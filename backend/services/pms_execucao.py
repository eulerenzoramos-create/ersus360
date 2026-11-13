"""
PMS Vivo — acompanhamento da execução das ações da PAS e Agente de Monitoramento PMS.

acompanhamento(): uma linha por ação da PAS do exercício com meta, diretriz/objetivo, prazo, responsável,
situação oficial, resultado, justificativa (com o detalhamento da não execução) e evidência; mais a situação
informada em cada quadrimestre (1º jan–abr, 2º mai–ago, 3º set–dez) e o histórico das atualizações.

agente(): lê os registros e aponta o que pede atenção (atualização pendente, não execução, metas com baixo
desempenho, justificativa ausente, prazo vencido, divergência PMS × PAS, providências da gestão), com
recomendações. NUNCA altera registros oficiais; enviar_alertas() só grava na Central de Alertas.

Só usa o que está cadastrado: o que não foi informado aparece como "sem informação", nunca estimado.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.pms_vivo import (PmsAcao, PmsAcaoMeta, PmsAnexo, PmsAtualizacao, PmsDiretriz, PmsMeta, PmsMetaAnual,
                             PmsObjetivo, PmsPas, PmsPlano)
from services import pms_vivo as base

QUADRIMESTRES = {1: "1º quadrimestre (jan–abr)", 2: "2º quadrimestre (mai–ago)", 3: "3º quadrimestre (set–dez)"}
DIAS_VALIDACAO_PENDENTE = 5


def _fim_quadrimestre(ano: int, q: int) -> date:
    return {1: date(ano, 4, 30), 2: date(ano, 8, 31), 3: date(ano, 12, 31)}[q]


def _pode_atualizar(u, a: PmsAcao) -> bool:
    return bool(u is not None and (base.pode_validar(u) or (u.usuario_id is not None
                                                             and a.responsavel_usuario_id == u.usuario_id)))


def _resumo_upd(u: PmsAtualizacao | None) -> dict | None:
    if u is None:
        return None
    return {"id": u.id, "situacao": u.situacao, "situacao_rotulo": base.SITUACOES_ACAO.get(u.situacao, u.situacao),
            "status": u.status, "informado_por": u.informado_por, "informado_em": u.informado_em.isoformat(),
            "validado_por": u.validado_por, "resultado_alcancado": u.resultado_alcancado,
            "justificativa": u.justificativa, "parecer": u.parecer}


async def _linhas(db: AsyncSession, plano: PmsPlano, ano: int, filtros: dict, usuario=None) -> tuple[PmsPas | None, list[dict]]:
    mid = plano.municipio_id
    pas = (await db.execute(select(PmsPas).where(PmsPas.plano_id == plano.id, PmsPas.exercicio == ano,
                                                 PmsPas.municipio_id == mid))).scalars().first()
    if pas is None:
        return None, []
    q = select(PmsAcao).where(PmsAcao.pas_id == pas.id, PmsAcao.municipio_id == mid, PmsAcao.excluido_em.is_(None))
    if filtros.get("setor"):
        q = q.where(PmsAcao.setor_responsavel == filtros["setor"])
    if filtros.get("responsavel_usuario_id"):
        q = q.where(PmsAcao.responsavel_usuario_id == filtros["responsavel_usuario_id"])
    acoes = (await db.execute(q.order_by(PmsAcao.codigo))).scalars().all()
    ids = [a.id for a in acoes] or [0]
    metas: dict[int, list[dict]] = {}
    for acao_id, m, o, d in (await db.execute(
            select(PmsAcaoMeta.acao_id, PmsMeta, PmsObjetivo, PmsDiretriz)
            .join(PmsMeta, PmsMeta.id == PmsAcaoMeta.meta_id)
            .join(PmsObjetivo, PmsObjetivo.id == PmsMeta.objetivo_id)
            .join(PmsDiretriz, PmsDiretriz.id == PmsObjetivo.diretriz_id)
            .where(PmsAcaoMeta.acao_id.in_(ids), PmsAcaoMeta.municipio_id == mid))).all():
        metas.setdefault(acao_id, []).append({
            "id": m.id, "codigo": m.codigo, "descricao": m.descricao, "objetivo_id": o.id, "objetivo_codigo": o.codigo,
            "objetivo": o.descricao, "diretriz_id": d.id, "diretriz_codigo": d.codigo, "diretriz": d.descricao})
    upds: dict[int, list[PmsAtualizacao]] = {}
    for u in (await db.execute(select(PmsAtualizacao).where(
            PmsAtualizacao.acao_id.in_(ids), PmsAtualizacao.municipio_id == mid).order_by(PmsAtualizacao.id))).scalars():
        upds.setdefault(u.acao_id, []).append(u)
    com_anexo = set((await db.execute(select(PmsAnexo.entidade_id).where(
        PmsAnexo.municipio_id == mid, PmsAnexo.entidade == "acao", PmsAnexo.entidade_id.in_(ids),
        PmsAnexo.excluido_em.is_(None)))).scalars())
    saida = []
    for a in acoes:
        ms = sorted(metas.get(a.id, []), key=lambda m: m["codigo"])
        if filtros.get("diretriz_id") and not any(m["diretriz_id"] == filtros["diretriz_id"] for m in ms):
            continue
        if filtros.get("objetivo_id") and not any(m["objetivo_id"] == filtros["objetivo_id"] for m in ms):
            continue
        lst = upds.get(a.id, [])
        ultima = lst[-1] if lst else None
        por_q: dict[int, dict | None] = {}
        for qn in (1, 2, 3):
            do_q = [u for u in lst if base.periodo_da_atualizacao(u, ano) == (ano, qn)]
            validadas = [u for u in do_q if u.status == "validada"]
            por_q[qn] = _resumo_upd(validadas[-1] if validadas else (do_q[-1] if do_q else None))
        d = {**base.dict_acao(a), "exercicio": ano, "metas": ms,
             "tem_evidencia": a.id in com_anexo,
             "aguardando_validacao": bool(ultima and ultima.status == "pendente"),
             "devolvida": bool(ultima and ultima.status == "devolvida"),
             "ultima": _resumo_upd(ultima), "quadrimestres": por_q, "atualizacoes": len(lst),
             "justificativa_completa": (base.detalhe_completo(a) if a.situacao in base.EXIGE_DETALHE else None),
             "pode_atualizar": _pode_atualizar(usuario, a)}
        saida.append(d)
    return pas, saida


def _situacao_no_periodo(linha: dict, quadrimestre: int | None) -> str:
    """Situação considerada no resumo: a oficial (validada) ou a validada no quadrimestre escolhido."""
    if not quadrimestre:
        return linha["situacao"]
    r = linha["quadrimestres"].get(quadrimestre)
    return r["situacao"] if r and r["status"] == "validada" else "sem_registro"


def resumo(linhas: list[dict], quadrimestre: int | None = None) -> dict:
    sits = [_situacao_no_periodo(x, quadrimestre) for x in linhas]
    conta = {k: sits.count(k) for k in ("concluida", "parcial", "em_andamento", "nao_executada", "nao_iniciada",
                                        "cancelada", "sem_registro")}
    total = len(linhas)
    base_calc = total - conta["cancelada"]
    sem_just = sum(1 for x, s in zip(linhas, sits) if s in base.EXIGE_DETALHE and not x["justificativa_completa"])
    return {
        "total": total, "executadas": conta["concluida"], "parciais": conta["parcial"],
        "em_andamento": conta["em_andamento"], "nao_executadas": conta["nao_executada"],
        "nao_iniciadas": conta["nao_iniciada"], "canceladas": conta["cancelada"],
        "sem_registro_no_quadrimestre": conta["sem_registro"] if quadrimestre else None,
        "atrasadas": sum(1 for x in linhas if x["atrasada"]),
        "aguardando_validacao": sum(1 for x in linhas if x["aguardando_validacao"]),
        "sem_justificativa": sem_just,
        "sem_responsavel": sum(1 for x in linhas if not x["responsavel_nome"] and not x["responsavel_usuario_id"]),
        "sem_prazo": sum(1 for x in linhas if not x["prazo"]),
        "percentual_execucao": round(100 * conta["concluida"] / base_calc, 1) if base_calc else None,
    }


async def acompanhamento(db: AsyncSession, plano: PmsPlano, ano: int, filtros: dict | None = None,
                         quadrimestre: int | None = None, usuario=None) -> dict:
    f = filtros or {}
    pas, linhas = await _linhas(db, plano, ano, f, usuario)
    todas = linhas if not any(f.get(k) for k in ("setor", "responsavel_usuario_id", "diretriz_id", "objetivo_id")) \
        else (await _linhas(db, plano, ano, {}, usuario))[1]
    return {
        "ano": ano, "quadrimestre": quadrimestre, "quadrimestres": QUADRIMESTRES,
        "quadrimestre_atual": base.quadrimestre_padrao(ano),
        "pas": {"id": pas.id, "exercicio": pas.exercicio, "situacao": pas.situacao, "resolucao_cms": pas.resolucao_cms}
               if pas else None,
        "linhas": linhas, "resumo": resumo(linhas, quadrimestre),
        "setores": sorted({x["setor_responsavel"] for x in todas if x["setor_responsavel"]}),
        "responsaveis": sorted({x["responsavel_nome"] for x in todas if x["responsavel_nome"]}),
        "situacoes": base.SITUACOES_ACAO, "exige_detalhe": sorted(base.EXIGE_DETALHE), "campos_detalhe": base.CAMPOS_DETALHE,
        "nota": "Situação oficial = validada por outra pessoa. Nada é presumido: sem registro = ninguém informou.",
    }


# ── Agente de Monitoramento PMS ──────────────────────────────────────────────

CATEGORIAS = {
    "pendente_atualizacao": "Ações pendentes de atualização",
    "nao_executada": "Ações não executadas ou executadas em parte",
    "meta_baixo_desempenho": "Metas com baixo desempenho",
    "justificativa_ausente": "Justificativas ausentes ou incompletas",
    "prazo_vencido": "Prazos vencidos",
    "divergencia_pms_pas": "Divergências entre PMS e PAS",
    "providencia_gestao": "Providências da gestão",
}
RECOMENDACOES = {
    "pendente_atualizacao": "Cobrar dos responsáveis a atualização do quadrimestre na aba \"PAS e ações\" (ou em \"Minhas Ações\").",
    "nao_executada": "Registrar a análise Fato–Causa–Ação (aba FCA) e avaliar a reprogramação para a PAS seguinte.",
    "meta_baixo_desempenho": "Discutir a meta na reunião de monitoramento e definir ação corretiva com responsável e prazo.",
    "justificativa_ausente": "Completar motivo, dificuldades, providências, responsável pela solução e novo prazo — "
                             "exigidos para o RDQA/RAG.",
    "prazo_vencido": "Atualizar a situação das ações vencidas ou registrar novo prazo com justificativa.",
    "divergencia_pms_pas": "Conferir a PAS com o PMS aprovado; mudanças de meta só por nova versão do PMS (proposta de alteração).",
    "providencia_gestao": "Decisão da coordenação/secretaria: definir responsáveis e prazos, validar execuções e aprovar a PAS.",
}


def _item(sev: str, texto: str, acao_id=None, meta_id=None, codigo=None) -> dict:
    return {"severidade": sev, "texto": texto, "acao_id": acao_id, "meta_id": meta_id, "codigo": codigo}


def _lista(codigos: list[str], n: int = 12) -> str:
    return ", ".join(codigos[:n]) + (f" e mais {len(codigos) - n}" if len(codigos) > n else "")


async def agente(db: AsyncSession, plano: PmsPlano, ano: int, hoje: date | None = None) -> dict:
    from services import pms_monitoramento as mon
    hoje = hoje or date.today()
    pas, linhas = await _linhas(db, plano, ano, {})
    q_atual = base.quadrimestre_padrao(ano, hoje)
    ach: dict[str, list[dict]] = {k: [] for k in CATEGORIAS}

    # Divergências estruturais PMS × PAS
    metas = await mon.monitoramento(db, plano, ano)
    if pas is None:
        ach["divergencia_pms_pas"].append(_item("critico", f"Não há PAS cadastrada para {ano}: as metas do PMS ficam sem ações programadas."))
    else:
        if pas.situacao != "aprovada":
            ach["providencia_gestao"].append(_item("atencao", f"PAS {ano} em rascunho, sem resolução do Conselho Municipal de Saúde registrada."))
        prev = {(m.meta_id): m.meta_prevista for m in (await db.execute(select(PmsMetaAnual).where(
            PmsMetaAnual.municipio_id == plano.municipio_id, PmsMetaAnual.ano == ano,
            PmsMetaAnual.meta_id.in_([m["id"] for m in metas] or [0])))).scalars()}
        com_acao = {m["id"] for x in linhas for m in x["metas"]}
        for m in metas:
            if m["id"] not in com_acao:
                previsto = prev.get(m["id"])
                if previsto not in (None, 0):
                    ach["divergencia_pms_pas"].append(_item(
                        "atencao", f"Meta {m['codigo']} tem previsão no PMS para {ano} ({base_num(previsto)}) e nenhuma ação na PAS.",
                        meta_id=m["id"], codigo=m["codigo"]))
                else:
                    ach["divergencia_pms_pas"].append(_item(
                        "info", f"Meta {m['codigo']} sem ação na PAS {ano}.", meta_id=m["id"], codigo=m["codigo"]))
        for x in linhas:
            if not x["metas"]:
                ach["divergencia_pms_pas"].append(_item("atencao", f"Ação {x['codigo']} não está ligada a nenhuma meta do PMS.",
                                                        acao_id=x["id"], codigo=x["codigo"]))
            for m in x["metas"]:
                if m["id"] in prev and prev[m["id"]] == 0:
                    ach["divergencia_pms_pas"].append(_item(
                        "atencao", f"Ação {x['codigo']} programada para a meta {m['codigo']}, cuja previsão no PMS para {ano} é zero.",
                        acao_id=x["id"], meta_id=m["id"], codigo=x["codigo"]))

    for x in linhas:
        cod, aid = x["codigo"], x["id"]
        aberta = x["situacao"] in {"nao_iniciada", "em_andamento"}
        # Pendente de atualização: ação aberta sem registro no quadrimestre corrente (ou no último, se o ano acabou)
        if aberta and not x["aguardando_validacao"] and x["quadrimestres"].get(q_atual) is None and hoje.year >= ano:
            ach["pendente_atualizacao"].append(_item(
                "atencao", f"Ação {cod} sem atualização no {q_atual}º quadrimestre"
                + (f" — responsável: {x['responsavel_nome']}" if x["responsavel_nome"] else " — sem responsável definido") + ".",
                acao_id=aid, codigo=cod))
        if x["situacao"] in base.EXIGE_DETALHE:
            ach["nao_executada"].append(_item(
                "critico" if x["situacao"] == "nao_executada" else "atencao",
                f"Ação {cod}: {x['situacao_rotulo'].lower()}" + (f" — motivo: {x['motivo']}" if x["motivo"] else "") + ".",
                acao_id=aid, codigo=cod))
            if not x["justificativa_completa"]:
                ach["justificativa_ausente"].append(_item(
                    "atencao", f"Ação {cod} ({x['situacao_rotulo'].lower()}) sem o detalhamento completo da justificativa.",
                    acao_id=aid, codigo=cod))
            if x["novo_prazo"] and date.fromisoformat(x["novo_prazo"]) < hoje:
                ach["prazo_vencido"].append(_item(
                    "critico", f"Ação {cod}: novo prazo de regularização ({_br(x['novo_prazo'])}) vencido"
                    + (f" — responsável pela solução: {x['responsavel_solucao']}" if x["responsavel_solucao"] else "") + ".",
                    acao_id=aid, codigo=cod))
        if x["atrasada"]:
            ach["prazo_vencido"].append(_item("critico", f"Ação {cod} com prazo vencido em {_br(x['prazo'])} e ainda "
                                                         f"{x['situacao_rotulo'].lower()}.", acao_id=aid, codigo=cod))
        if x["devolvida"]:
            ach["providencia_gestao"].append(_item("atencao", f"Ação {cod}: atualização devolvida aguardando reenvio.",
                                                   acao_id=aid, codigo=cod))
        if x["aguardando_validacao"] and x["ultima"] and \
                datetime.fromisoformat(x["ultima"]["informado_em"]).date() <= hoje - timedelta(days=DIAS_VALIDACAO_PENDENTE):
            ach["providencia_gestao"].append(_item(
                "atencao", f"Ação {cod}: execução informada em {_br(x['ultima']['informado_em'])} aguarda validação.",
                acao_id=aid, codigo=cod))

    # Cadastro incompleto: agrupado (não lista 100 linhas iguais)
    sem_resp = [x["codigo"] for x in linhas if not x["responsavel_nome"] and not x["responsavel_usuario_id"]]
    sem_prazo = [x["codigo"] for x in linhas if not x["prazo"]]
    if sem_resp:
        ach["providencia_gestao"].append(_item(
            "critico" if len(sem_resp) == len(linhas) else "atencao",
            f"{len(sem_resp)} de {len(linhas)} ações sem responsável definido ({_lista(sem_resp)}). Sem responsável, "
            "ninguém recebe a ação em \"Minhas Ações\". Use a atribuição em lote na aba \"PAS e ações\"."))
    if sem_prazo:
        ach["providencia_gestao"].append(_item(
            "atencao", f"{len(sem_prazo)} de {len(linhas)} ações sem prazo ({_lista(sem_prazo)}). Sem prazo, o sistema "
            "não identifica atraso."))

    # Metas com baixo desempenho: resultado registrado ruim, ou metade ou mais das ações com problema
    for m in metas:
        if m["situacao"] in {"em_risco", "nao_alcancada"}:
            ach["meta_baixo_desempenho"].append(_item(
                "critico", f"Meta {m['codigo']} {'em risco' if m['situacao'] == 'em_risco' else 'não alcançada'} em {ano}"
                + (f" ({base_num(m['cumprimento'])}% da meta anual)" if m["cumprimento"] is not None else "") + ".",
                meta_id=m["id"], codigo=m["codigo"]))
        elif m["acoes_no_ano"] and m["acoes_com_problema"] * 2 >= m["acoes_no_ano"]:
            ach["meta_baixo_desempenho"].append(_item(
                "atencao", f"Meta {m['codigo']}: {m['acoes_com_problema']} de {m['acoes_no_ano']} ações atrasadas, "
                "parciais ou não executadas.", meta_id=m["id"], codigo=m["codigo"]))
    sem_tipo = [m["codigo"] for m in metas if not m["tipo_indicador"]]
    if sem_tipo:
        ach["meta_baixo_desempenho"].append(_item(
            "info", f"{len(sem_tipo)} meta(s) sem tipo de indicador ({_lista(sem_tipo)}): o desempenho não é calculado "
            "até o tipo ser informado em uma nova versão do PMS."))

    ordem = {"critico": 0, "atencao": 1, "info": 2}
    categorias = []
    for k, rot in CATEGORIAS.items():
        itens = sorted(ach[k], key=lambda i: ordem[i["severidade"]])
        categorias.append({"id": k, "titulo": rot, "total": len(itens), "recomendacao": RECOMENDACOES[k] if itens else None,
                           "criticos": sum(i["severidade"] == "critico" for i in itens), "itens": itens})
    return {
        "ano": ano, "gerado_em": datetime.utcnow().isoformat(), "quadrimestre_atual": q_atual,
        "pas": {"exercicio": pas.exercicio, "situacao": pas.situacao} if pas else None,
        "resumo": resumo(linhas), "categorias": categorias,
        "total_achados": sum(c["total"] for c in categorias),
        "aviso": "O agente só analisa e recomenda: nenhum registro oficial é alterado. As decisões são da gestão.",
    }


def base_num(v) -> str:
    if v is None:
        return "—"
    return f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".").rstrip("0").rstrip(",")


def _br(d: str | None) -> str:
    return "/".join(reversed(d[:10].split("-"))) if d else "—"


async def enviar_alertas(db: AsyncSession, plano: PmsPlano, ano: int, hoje: date | None = None) -> int:
    """Um alerta por categoria com achados críticos/de atenção; não duplica alerta igual ainda aberto."""
    from models.alerta import Alerta, SeveridadeAlerta
    r = await agente(db, plano, ano, hoje)
    novos = 0
    for c in r["categorias"]:
        relevantes = [i for i in c["itens"] if i["severidade"] in ("critico", "atencao")]
        if not relevantes:
            continue
        titulo = f"PMS {ano}: {c['titulo']}"[:200]
        desc = f"{len(relevantes)} achado(s). " + " ".join(i["texto"] for i in relevantes[:5]) \
            + (" …" if len(relevantes) > 5 else "") + f" Recomendação: {c['recomendacao']}"
        existe = (await db.execute(select(Alerta.id).where(
            Alerta.municipio_id == plano.municipio_id, Alerta.modulo == "PMS Vivo", Alerta.titulo == titulo,
            Alerta.descricao == desc, Alerta.resolvido.is_(False)))).first()
        if not existe:
            sev = SeveridadeAlerta.CRITICO if any(i["severidade"] == "critico" for i in relevantes) else SeveridadeAlerta.ATENCAO
            db.add(Alerta(municipio_id=plano.municipio_id, modulo="PMS Vivo", severidade=sev, titulo=titulo, descricao=desc))
            novos += 1
    await db.commit()
    return novos
