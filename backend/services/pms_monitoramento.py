"""
PMS Vivo — monitoramento (entrega 2): resultado anual das metas, cumprimento por tipo de indicador,
situação e tendência, painel do gestor, Kanban, cronograma e alertas.

Regras de cálculo (nunca somar o que não é acumulável):
  • absoluto_acumulavel     → acumulado = soma dos resultados anuais, comparado à meta quadrienal
  • percentual, taxa, índice, absoluto_nao_acumulavel → sem soma: vale o último resultado disponível
  • binario                 → cumprido só se o resultado for igual à meta (1/0)
  • tipo não informado      → nada de acumulado nem tendência (aviso para definir o tipo)
  • polaridade menor_melhor → cumprimento = meta / resultado (ex.: mortalidade)
Sem resultado registrado (com fonte) = "sem_resultado", nunca "não alcançada".
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.pms_vivo import (PmsAcao, PmsAcaoMeta, PmsAnexo, PmsAtualizacao, PmsDiretriz, PmsMeta, PmsMetaAnual,
                             PmsObjetivo, PmsPas)
from services import pms_vivo as base

# Indicadores do ERSUS360 aceitos como fonte automática: só correspondência exata de conceito e fórmula.
FONTES_AUTOMATICAS = {
    "siops_pct_asps": {
        "rotulo": "SIOPS — % da receita de impostos aplicada em ASPS (LC 141/2012)",
        "tipo": "percentual", "unidade": "%",
        "fonte": "SIOPS — API de dados abertos do Ministério da Saúde",
    },
}

SITUACOES_META = {
    "alcancada": "Alcançada", "nao_alcancada": "Não alcançada", "em_risco": "Em risco",
    "em_acompanhamento": "Em acompanhamento", "sem_resultado": "Sem resultado registrado", "prevista": "Prevista",
}
DIAS_SEM_ATUALIZACAO = 30
DIAS_VALIDACAO_PENDENTE = 5


# ── Cálculo ──────────────────────────────────────────────────────────────────

def cumprimento(tipo: str | None, polaridade: str | None, prevista: float | None, resultado: float | None) -> float | None:
    """% de cumprimento da meta anual. None quando falta dado ou a conta não faz sentido."""
    if resultado is None or prevista is None:
        return None
    if tipo == "binario":
        return 100.0 if resultado == prevista else 0.0
    if polaridade == "menor_melhor":
        if resultado == 0:
            return 100.0 if prevista >= 0 else None
        return round(prevista / resultado * 100, 1)
    if prevista == 0:
        return 100.0 if resultado >= 0 else None
    return round(resultado / prevista * 100, 1)


def acumulado(tipo: str | None, anuais: list[dict]) -> dict:
    """Resultado do quadriênio até agora, conforme o tipo do indicador."""
    com = [a for a in anuais if a["resultado"] is not None]
    if not tipo:
        return {"valor": None, "regra": "Tipo do indicador não definido: acumulado não calculado."}
    if not com:
        return {"valor": None, "regra": "Sem resultado registrado."}
    if tipo == "absoluto_acumulavel":
        return {"valor": round(sum(a["resultado"] for a in com), 4), "regra": "Soma dos resultados anuais (indicador acumulável)."}
    ult = max(com, key=lambda a: a["ano"])
    return {"valor": ult["resultado"], "regra": f"Último resultado ({ult['ano']}): indicador não acumulável, sem soma entre anos."}


def tendencia(tipo: str | None, polaridade: str | None, anuais: list[dict]) -> str | None:
    com = sorted((a for a in anuais if a["resultado"] is not None), key=lambda a: a["ano"])
    if not tipo or len(com) < 2:
        return None
    ant, ult = com[-2]["resultado"], com[-1]["resultado"]
    if ult == ant:
        return "estavel"
    melhorou = ult > ant if polaridade != "menor_melhor" else ult < ant
    return "melhora" if melhorou else "piora"


def situacao_meta(ano: int, prevista: float | None, resultado: float | None, cump: float | None,
                  acoes_problema: int, hoje: date | None = None) -> str:
    hoje = hoje or date.today()
    if ano > hoje.year:
        return "prevista"
    if ano < hoje.year:
        if resultado is None:
            return "sem_resultado"
        return "alcancada" if (cump is not None and cump >= 100) else "nao_alcancada"
    # ano corrente
    if cump is not None and cump >= 100:
        return "alcancada"
    if (cump is not None and cump < 100) or acoes_problema:
        return "em_risco"
    return "em_acompanhamento"


async def monitoramento(db: AsyncSession, plano, ano: int | None = None) -> list[dict]:
    hoje = date.today()
    ano = ano or hoje.year
    mid = plano.municipio_id
    metas = (await db.execute(select(PmsMeta).where(PmsMeta.plano_id == plano.id, PmsMeta.municipio_id == mid)
                              .order_by(PmsMeta.ordem, PmsMeta.id))).scalars().all()
    anuais = (await db.execute(select(PmsMetaAnual).where(PmsMetaAnual.meta_id.in_([m.id for m in metas] or [0]))
                               .order_by(PmsMetaAnual.ano))).scalars().all()
    obj = {o.id: o for o in (await db.execute(select(PmsObjetivo).where(PmsObjetivo.plano_id == plano.id))).scalars()}
    dirs = {d.id: d for d in (await db.execute(select(PmsDiretriz).where(PmsDiretriz.plano_id == plano.id))).scalars()}
    # ações com problema por meta, na PAS do ano (atrasadas, não executadas, parciais)
    problema: dict[int, int] = {}
    total_acoes: dict[int, int] = {}
    rows = (await db.execute(select(PmsAcaoMeta.meta_id, PmsAcao).join(PmsAcao, PmsAcao.id == PmsAcaoMeta.acao_id)
                             .join(PmsPas, PmsPas.id == PmsAcao.pas_id).where(
        PmsAcaoMeta.municipio_id == mid, PmsPas.exercicio == ano, PmsAcao.excluido_em.is_(None)))).all()
    for meta_id, a in rows:
        total_acoes[meta_id] = total_acoes.get(meta_id, 0) + 1
        if base.acao_atrasada(a, hoje) or a.situacao in {"nao_executada", "parcial"}:
            problema[meta_id] = problema.get(meta_id, 0) + 1
    saida = []
    for m in metas:
        lst = [{"ano": a.ano, "meta_prevista": a.meta_prevista, "resultado": a.resultado, "fonte": a.resultado_fonte,
                "competencia": a.resultado_competencia, "registrado_por": a.resultado_por,
                "registrado_em": a.resultado_em.isoformat() if a.resultado_em else None}
               for a in anuais if a.meta_id == m.id]
        for a in lst:
            a["cumprimento"] = cumprimento(m.tipo_indicador, m.polaridade, a["meta_prevista"], a["resultado"])
            a["situacao"] = situacao_meta(a["ano"], a["meta_prevista"], a["resultado"], a["cumprimento"],
                                          problema.get(m.id, 0) if a["ano"] == ano else 0, hoje)
        do_ano = next((a for a in lst if a["ano"] == ano), None)
        acum = acumulado(m.tipo_indicador, lst)
        o = obj.get(m.objetivo_id)
        saida.append({**base.dict_meta(m), "diretriz_id": o.diretriz_id if o else None,
                      "diretriz": f"{dirs[o.diretriz_id].codigo} — {dirs[o.diretriz_id].descricao}" if o else None,
                      "anos": lst, "ano_referencia": ano,
                      "situacao": do_ano["situacao"] if do_ano else None,
                      "cumprimento": do_ano["cumprimento"] if do_ano else None,
                      "acumulado": acum,
                      "cumprimento_quadrienal": cumprimento(m.tipo_indicador, m.polaridade, m.meta_quadrienal, acum["valor"]),
                      "tendencia": tendencia(m.tipo_indicador, m.polaridade, lst),
                      "acoes_no_ano": total_acoes.get(m.id, 0), "acoes_com_problema": problema.get(m.id, 0)})
    return saida


# ── Fonte automática ─────────────────────────────────────────────────────────

async def coletar_fonte_automatica(codigo: str, ano: int) -> dict:
    """Busca o resultado na fonte integrada. Sem dado → {'ok': False, 'motivo': ...}; nunca estima."""
    if codigo == "siops_pct_asps":
        from services.diagnostico_fontes import regra_siops
        from services.siops_service import buscar_apuracao
        r = regra_siops(await buscar_apuracao(ano), ano)
        if r.classificacao == "nao_verificado":
            return {"ok": False, "motivo": r.justificativa}
        return {"ok": True, "resultado": r.detalhes["minimo_constitucional_pct_aplicado"],
                "fonte": FONTES_AUTOMATICAS[codigo]["fonte"], "competencia": f"Exercício {ano}"}
    return {"ok": False, "motivo": "Fonte automática desconhecida."}


# ── Ações: Kanban, cronograma, painel e alertas ──────────────────────────────

COLUNAS_KANBAN = {"nao_iniciada": "Não iniciadas", "em_andamento": "Em andamento", "atrasada": "Atrasadas",
                  "aguardando_validacao": "Aguardando validação", "concluida": "Concluídas",
                  "encerrada": "Parciais, não executadas ou canceladas"}


async def acoes_do_ano(db: AsyncSession, plano, ano: int, filtros: dict | None = None) -> list[dict]:
    """Ações da PAS do ano com metas, flags e última atualização. Filtros: setor, responsavel_usuario_id,
    situacao, diretriz_id, objetivo_id."""
    f = filtros or {}
    q = select(PmsAcao, PmsPas).join(PmsPas, PmsPas.id == PmsAcao.pas_id).where(
        PmsPas.plano_id == plano.id, PmsPas.exercicio == ano, PmsAcao.municipio_id == plano.municipio_id,
        PmsAcao.excluido_em.is_(None))
    if f.get("setor"):
        q = q.where(PmsAcao.setor_responsavel == f["setor"])
    if f.get("responsavel_usuario_id"):
        q = q.where(PmsAcao.responsavel_usuario_id == f["responsavel_usuario_id"])
    rows = (await db.execute(q.order_by(PmsAcao.prazo.is_(None), PmsAcao.prazo, PmsAcao.codigo))).all()
    ids = [a.id for a, _ in rows] or [0]
    ultimas: dict[int, PmsAtualizacao] = {}
    for u in (await db.execute(select(PmsAtualizacao).where(PmsAtualizacao.acao_id.in_(ids))
                               .order_by(PmsAtualizacao.id))).scalars():
        ultimas[u.acao_id] = u
    metas_por_acao: dict[int, list] = {}
    for acao_id, m, o in (await db.execute(
            select(PmsAcaoMeta.acao_id, PmsMeta, PmsObjetivo).join(PmsMeta, PmsMeta.id == PmsAcaoMeta.meta_id)
            .join(PmsObjetivo, PmsObjetivo.id == PmsMeta.objetivo_id).where(PmsAcaoMeta.acao_id.in_(ids)))).all():
        metas_por_acao.setdefault(acao_id, []).append(
            {"id": m.id, "codigo": m.codigo, "objetivo_id": o.id, "diretriz_id": o.diretriz_id})
    com_anexo = set((await db.execute(select(PmsAnexo.entidade_id).where(
        PmsAnexo.entidade == "acao", PmsAnexo.entidade_id.in_(ids), PmsAnexo.excluido_em.is_(None)))).scalars())
    saida = []
    for a, pas in rows:
        metas = metas_por_acao.get(a.id, [])
        if f.get("diretriz_id") and not any(m["diretriz_id"] == f["diretriz_id"] for m in metas):
            continue
        if f.get("objetivo_id") and not any(m["objetivo_id"] == f["objetivo_id"] for m in metas):
            continue
        u = ultimas.get(a.id)
        d = {**base.dict_acao(a), "exercicio": pas.exercicio, "metas": metas,
             "aguardando_validacao": bool(u and u.status == "pendente"),
             "devolvida": bool(u and u.status == "devolvida"),
             "ultima_atualizacao_em": u.informado_em.isoformat() if u else None,
             "tem_evidencia": a.id in com_anexo}
        d["coluna"] = coluna_kanban(d)
        if f.get("situacao") and f["situacao"] not in (a.situacao, d["coluna"]):
            continue
        saida.append(d)
    return saida


def coluna_kanban(d: dict) -> str:
    if d["aguardando_validacao"]:
        return "aguardando_validacao"
    if d["situacao"] == "concluida":
        return "concluida"
    if d["situacao"] in {"parcial", "nao_executada", "cancelada"}:
        return "encerrada"
    if d["atrasada"]:
        return "atrasada"
    return d["situacao"] if d["situacao"] in {"nao_iniciada", "em_andamento"} else "nao_iniciada"


def cronograma(acoes: list[dict]) -> list[dict]:
    """Ações agrupadas pelo mês do prazo (sem prazo no fim)."""
    grupos: dict[str, list] = {}
    for a in acoes:
        grupos.setdefault(a["prazo"][:7] if a["prazo"] else "sem_prazo", []).append(
            {k: a[k] for k in ("id", "codigo", "descricao", "prazo", "responsavel_nome", "setor_responsavel",
                               "situacao", "situacao_rotulo", "atrasada", "coluna")})
    return [{"mes": k, "acoes": v} for k, v in sorted(grupos.items(), key=lambda x: (x[0] == "sem_prazo", x[0]))]


def alertas(acoes: list[dict], metas: list[dict], pendentes: list[PmsAtualizacao], hoje: date | None = None) -> list[dict]:
    hoje = hoje or date.today()
    saida = []

    def al(sev, tipo, texto, acao_id=None, meta_id=None, responsavel=None):
        saida.append({"severidade": sev, "tipo": tipo, "texto": texto, "acao_id": acao_id, "meta_id": meta_id,
                      "responsavel": responsavel})
    for a in acoes:
        quem = a["responsavel_nome"]
        if a["atrasada"]:
            al("critico", "acao_atrasada", f"Ação {a['codigo']} atrasada (prazo {a['prazo']}).", a["id"], responsavel=quem)
        elif a["prazo_proximo"]:
            al("atencao", "prazo_proximo", f"Ação {a['codigo']} vence em {a['prazo']}.", a["id"], responsavel=quem)
        aberta = a["situacao"] in {"nao_iniciada", "em_andamento"}
        ref = a["ultima_atualizacao_em"]
        if aberta and not a["aguardando_validacao"] and (
                ref is None or datetime.fromisoformat(ref).date() < hoje - timedelta(days=DIAS_SEM_ATUALIZACAO)):
            al("atencao", "sem_atualizacao", f"Ação {a['codigo']} sem atualização há mais de {DIAS_SEM_ATUALIZACAO} dias"
               + ("" if ref else " (nunca atualizada)") + ".", a["id"], responsavel=quem)
        if a["evidencia_esperada"] and not a["tem_evidencia"] and (a["atrasada"] or a["prazo_proximo"]
                                                                    or a["aguardando_validacao"]):
            al("atencao", "sem_evidencia", f"Ação {a['codigo']} sem a evidência esperada ({a['evidencia_esperada'][:80]}).",
               a["id"], responsavel=quem)
        if a["devolvida"]:
            al("atencao", "devolvida", f"Ação {a['codigo']}: atualização devolvida, aguardando reenvio.", a["id"], responsavel=quem)
    for u in pendentes:
        if u.informado_em.date() <= hoje - timedelta(days=DIAS_VALIDACAO_PENDENTE):
            al("atencao", "validacao_pendente", f"Execução informada em {u.informado_em:%d/%m/%Y} aguarda validação há mais de "
               f"{DIAS_VALIDACAO_PENDENTE} dias.", u.acao_id)
    for m in metas:
        if m["situacao"] == "em_risco":
            al("critico", "meta_em_risco", f"Meta {m['codigo']} em risco no ano de referência.", meta_id=m["id"])
        if m["tipo_indicador"] is None:
            al("info", "meta_sem_tipo", f"Meta {m['codigo']} sem tipo de indicador: acumulado e tendência não são calculados.",
               meta_id=m["id"])
    ordem = {"critico": 0, "atencao": 1, "info": 2}
    return sorted(saida, key=lambda x: ordem[x["severidade"]])


async def registrar_alertas_centrais(db: AsyncSession, municipio_id: int, hoje: date | None = None) -> int:
    """Rotina diária: ações atrasadas e metas em risco dos PMS aprovados vão para a central de alertas
    (módulo "PMS Vivo"), sem duplicar alerta ainda não resolvido."""
    from models.alerta import Alerta, SeveridadeAlerta
    from models.pms_vivo import PmsPlano
    hoje = hoje or date.today()
    planos = (await db.execute(select(PmsPlano).where(PmsPlano.municipio_id == municipio_id,
                                                      PmsPlano.situacao == "aprovado"))).scalars().all()
    novos = 0
    for p in planos:
        if hoje.year not in base.anos_do(p):
            continue
        metas = await monitoramento(db, p, hoje.year)
        acoes = await acoes_do_ano(db, p, hoje.year)
        for a in alertas(acoes, metas, [], hoje):
            if a["severidade"] != "critico":
                continue
            existe = (await db.execute(select(Alerta.id).where(
                Alerta.municipio_id == municipio_id, Alerta.modulo == "PMS Vivo", Alerta.descricao == a["texto"],
                Alerta.resolvido.is_(False)))).first()
            if not existe:
                db.add(Alerta(municipio_id=municipio_id, modulo="PMS Vivo", severidade=SeveridadeAlerta.CRITICO,
                              titulo=("PMS: ação atrasada" if a["tipo"] == "acao_atrasada" else "PMS: meta em risco"),
                              descricao=a["texto"]))
                novos += 1
    await db.commit()
    return novos


def painel(metas: list[dict], acoes: list[dict], alertas_: list[dict]) -> dict:
    def conta(itens, chave, valores):
        return {v: sum(1 for i in itens if i[chave] == v) for v in valores}
    por_area: dict = {}
    for m in metas:
        area = por_area.setdefault(m["diretriz_id"], {"diretriz": m["diretriz"], "metas": {}, "acoes": {}})
        area["metas"][m["situacao"]] = area["metas"].get(m["situacao"], 0) + 1
    for a in acoes:
        for d in {m["diretriz_id"] for m in a["metas"]}:
            area = por_area.get(d)
            if area:
                area["acoes"][a["coluna"]] = area["acoes"].get(a["coluna"], 0) + 1
    pend_resp: dict = {}
    for al in alertas_:
        if al["responsavel"] and al["tipo"] in {"acao_atrasada", "sem_atualizacao", "sem_evidencia", "devolvida"}:
            r = pend_resp.setdefault(al["responsavel"], {"responsavel": al["responsavel"], "pendencias": 0, "tipos": set()})
            r["pendencias"] += 1
            r["tipos"].add(al["tipo"])
    return {
        "metas": {"total": len(metas), **conta(metas, "situacao", SITUACOES_META)},
        "acoes": {"total": len(acoes), "concluidas": sum(a["situacao"] == "concluida" for a in acoes),
                  "atrasadas": sum(a["atrasada"] for a in acoes),
                  "nao_executadas": sum(a["situacao"] == "nao_executada" for a in acoes),
                  "parciais": sum(a["situacao"] == "parcial" for a in acoes),
                  "aguardando_validacao": sum(a["aguardando_validacao"] for a in acoes),
                  "reprogramacao_proposta": None},   # entrega 3
        "por_area": list(por_area.values()),
        "responsaveis_pendentes": sorted(({**r, "tipos": sorted(r["tipos"])} for r in pend_resp.values()),
                                         key=lambda r: -r["pendencias"]),
        "alertas": {"critico": sum(a["severidade"] == "critico" for a in alertas_),
                    "atencao": sum(a["severidade"] == "atencao" for a in alertas_)},
    }
