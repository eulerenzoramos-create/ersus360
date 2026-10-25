"""
PMS Vivo — entrega 3: fechamento do ciclo (reprogramação, consolidação quadrimestral de apoio ao RDQA,
avaliação anual de apoio ao RAG, pauta das reuniões mensais e cruzamento com o Diagnóstico Situacional).

Regras:
  • Reprogramar nunca altera a ação original (situação e histórico do ano ficam como estão); só depois de
    aprovada a proposta vira ação nova na PAS seguinte, ainda em rascunho. Nenhum recurso é transferido.
  • Os relatórios são de APOIO: não substituem o RDQA/RAG oficial do DGMP/DigiSUS.
  • Recomendações são regras de procedimento a partir dos registros (ex.: "meta em risco sem FCA"),
    nunca conclusões sobre causas.
"""
from __future__ import annotations

import json
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.pms_vivo import (PmsAcao, PmsAcaoMeta, PmsAtualizacao, PmsDecisao, PmsDiagVinculo, PmsFca, PmsMeta,
                             PmsPas, PmsPlano, PmsReprogramacao, PmsReuniao)
from services import pms_monitoramento as mon
from services import pms_vivo as base

SITUACOES_REPROGRAMAVEIS = {"nao_executada", "parcial"}
SITUACOES_REPROG = {"proposta": "Aguardando decisão", "aprovada": "Aprovada", "rejeitada": "Rejeitada",
                    "incluida": "Incluída na PAS seguinte"}


def periodo_quadrimestre(ano: int, q: int) -> tuple[date, date]:
    if q not in (1, 2, 3):
        raise ValueError("Quadrimestre deve ser 1, 2 ou 3.")
    import calendar
    return date(ano, 4 * q - 3, 1), date(ano, 4 * q, calendar.monthrange(ano, 4 * q)[1])


def dict_reprog(r: PmsReprogramacao, acao: PmsAcao | None = None) -> dict:
    d = {k: getattr(r, k) for k in (
        "id", "plano_id", "acao_id", "ano_origem", "ano_destino", "situacao_origem", "motivo", "nova_quantidade",
        "ajuste_meta", "recursos", "responsavel_usuario_id", "responsavel_nome", "justificativa_tecnica", "situacao",
        "proposto_por", "decidido_por", "parecer", "acao_destino_id")}
    d["continua_necessaria"] = bool(r.continua_necessaria)
    d["novo_prazo"] = r.novo_prazo.isoformat() if r.novo_prazo else None
    d["proposto_em"] = r.proposto_em.isoformat()
    d["decidido_em"] = r.decidido_em.isoformat() if r.decidido_em else None
    d["situacao_rotulo"] = SITUACOES_REPROG.get(r.situacao, r.situacao)
    if acao is not None:
        d["acao"] = {"id": acao.id, "codigo": acao.codigo, "descricao": acao.descricao,
                     "situacao": acao.situacao, "situacao_rotulo": base.SITUACOES_ACAO.get(acao.situacao)}
    return d


async def reprogramacoes(db: AsyncSession, plano: PmsPlano, ano_origem: int | None = None) -> list[dict]:
    q = select(PmsReprogramacao, PmsAcao).join(PmsAcao, PmsAcao.id == PmsReprogramacao.acao_id).where(
        PmsReprogramacao.municipio_id == plano.municipio_id, PmsReprogramacao.plano_id == plano.id)
    if ano_origem:
        q = q.where(PmsReprogramacao.ano_origem == ano_origem)
    return [dict_reprog(r, a) for r, a in (await db.execute(q.order_by(PmsReprogramacao.id))).all()]


async def incluir_na_pas(db: AsyncSession, r: PmsReprogramacao, pas_destino: PmsPas, codigo: str, usuario: str) -> PmsAcao:
    """Cria a ação na PAS seguinte (rascunho), com as metas equivalentes pelo `uid` (vale entre versões do PMS)."""
    orig = await db.get(PmsAcao, r.acao_id)
    uids = (await db.execute(select(PmsMeta.uid).join(PmsAcaoMeta, PmsAcaoMeta.meta_id == PmsMeta.id)
                             .where(PmsAcaoMeta.acao_id == orig.id))).scalars().all()
    metas_destino = (await db.execute(select(PmsMeta.id).where(
        PmsMeta.plano_id == pas_destino.plano_id, PmsMeta.uid.in_(uids or ["-"])))).scalars().all()
    if not metas_destino:
        raise ValueError("As metas da ação original não existem na versão do PMS da PAS de destino.")
    nova = PmsAcao(pas_id=pas_destino.id, municipio_id=r.municipio_id, codigo=codigo,
                   descricao=orig.descricao, produto=orig.produto,
                   quantidade_prevista=r.nova_quantidade if r.nova_quantidade is not None else orig.quantidade_prevista,
                   prazo=r.novo_prazo, setor_responsavel=orig.setor_responsavel,
                   responsavel_usuario_id=r.responsavel_usuario_id or orig.responsavel_usuario_id,
                   responsavel_nome=r.responsavel_nome or orig.responsavel_nome,
                   recursos=r.recursos or orig.recursos, fonte_financiamento=orig.fonte_financiamento,
                   indicador_acompanhamento=orig.indicador_acompanhamento, evidencia_esperada=orig.evidencia_esperada,
                   criado_por=usuario)
    db.add(nova)
    await db.flush()
    for mid in metas_destino:
        db.add(PmsAcaoMeta(acao_id=nova.id, meta_id=mid, municipio_id=r.municipio_id))
    base.historico(db, r.municipio_id, "acao", nova.id, "reprogramada",
                   f"Criada por reprogramação da ação {orig.codigo} ({r.ano_origem}).", usuario)
    base.historico(db, r.municipio_id, "acao", orig.id, "reprogramada",
                   f"Reprogramada para {r.ano_destino} como {codigo}. Situação de {r.ano_origem} preservada.", usuario)
    return nova


# ── Consolidação quadrimestral (apoio ao RDQA) e avaliação anual (apoio ao RAG) ──

def _recomendacoes(metas: list[dict], acoes: list[dict], fcas: list[dict], reprogs: list[dict]) -> list[str]:
    rec = []
    com_fca = {f["meta_id"] for f in fcas if f["meta_id"]} | {f["acao_id"] for f in fcas if f["acao_id"]}
    for m in metas:
        if m["situacao"] in {"em_risco", "nao_alcancada"} and m["id"] not in com_fca:
            rec.append(f"Meta {m['codigo']} ({mon.SITUACOES_META[m['situacao']].lower()}): registrar análise FCA.")
        if m["situacao"] in {"sem_resultado", "em_acompanhamento"} and m["acoes_no_ano"] == 0:
            rec.append(f"Meta {m['codigo']} sem ação na PAS do ano: avaliar inclusão de ação ou revisão da meta.")
        if m["tipo_indicador"] is None:
            rec.append(f"Meta {m['codigo']}: definir o tipo do indicador para permitir o cálculo do acumulado.")
    atrasadas = [a for a in acoes if a["atrasada"]]
    if atrasadas:
        rec.append(f"{len(atrasadas)} ação(ões) atrasada(s): cobrar os responsáveis e registrar a execução.")
    for a in acoes:
        if a["situacao"] in SITUACOES_REPROGRAMAVEIS and not any(r["acao_id"] == a["id"] for r in reprogs):
            rec.append(f"Ação {a['codigo']} ({a['situacao_rotulo'].lower()}): avaliar reprogramação para o exercício seguinte.")
    pend = [r for r in reprogs if r["situacao"] == "proposta"]
    if pend:
        rec.append(f"{len(pend)} reprogramação(ões) aguardando decisão.")
    return rec


def _fca_dict(f: PmsFca) -> dict:
    return {"id": f.id, "meta_id": f.meta_id, "acao_id": f.acao_id, "ano": f.ano, "fato": f.fato, "causa": f.causa,
            "causa_validacao": f.causa_validacao, "acao_corretiva": f.acao_corretiva, "responsavel": f.responsavel,
            "prazo": f.prazo.isoformat() if f.prazo else None, "situacao": f.situacao,
            "criado_em": f.criado_em.isoformat()}


async def _fcas(db, plano, ano, ate: date | None = None) -> list[dict]:
    q = select(PmsFca).where(PmsFca.plano_id == plano.id, PmsFca.municipio_id == plano.municipio_id, PmsFca.ano == ano)
    rows = (await db.execute(q.order_by(PmsFca.id))).scalars().all()
    return [_fca_dict(f) for f in rows if ate is None or f.criado_em.date() <= ate]


async def consolidacao_quadrimestral(db: AsyncSession, plano: PmsPlano, ano: int, q: int, hoje: date | None = None) -> dict:
    ini, fim = periodo_quadrimestre(ano, q)
    metas = await mon.monitoramento(db, plano, ano)
    acoes = await mon.acoes_do_ano(db, plano, ano)
    realizadas = [a for a in acoes if a["situacao"] in {"concluida", "parcial"} and a["situacao_validada_em"]
                  and ini <= date.fromisoformat(a["situacao_validada_em"][:10]) <= fim]
    pendentes = [a for a in acoes if a["situacao"] in {"nao_iniciada", "em_andamento"} and a["prazo"]
                 and date.fromisoformat(a["prazo"]) <= fim]
    fcas = await _fcas(db, plano, ano, fim)
    reprogs = await reprogramacoes(db, plano, ano)
    return {
        "plano": base.dict_plano(plano), "ano": ano, "quadrimestre": q,
        "periodo": {"inicio": ini.isoformat(), "fim": fim.isoformat()},
        "acoes_realizadas": realizadas, "acoes_pendentes": pendentes,
        "metas": [{k: m[k] for k in ("id", "codigo", "descricao", "indicador", "tipo_indicador", "unidade", "situacao",
                                     "cumprimento", "anos", "acumulado")} for m in metas],
        "metas_alcancadas": [m["codigo"] for m in metas if m["situacao"] == "alcancada"],
        "dificuldades": [{"fato": f["fato"], "causa": f["causa"], "causa_validacao": f["causa_validacao"]} for f in fcas],
        "providencias": [{"acao_corretiva": f["acao_corretiva"], "responsavel": f["responsavel"], "prazo": f["prazo"],
                          "situacao": f["situacao"]} for f in fcas],
        "recomendacoes": _recomendacoes(metas, acoes, fcas, reprogs),
        "aviso": "Relatório gerencial de apoio à elaboração do RDQA. Não substitui o instrumento oficial do DGMP/DigiSUS.",
    }


async def avaliacao_anual(db: AsyncSession, plano: PmsPlano, ano: int) -> dict:
    metas = await mon.monitoramento(db, plano, ano)
    acoes = await mon.acoes_do_ano(db, plano, ano)
    fcas = await _fcas(db, plano, ano)
    reprogs = await reprogramacoes(db, plano, ano)

    def n(s):
        return sum(1 for a in acoes if a["situacao"] == s)
    return {
        "plano": base.dict_plano(plano), "ano": ano,
        "acoes": {"previstas": len(acoes), "executadas": n("concluida"), "parcialmente_executadas": n("parcial"),
                  "nao_executadas": n("nao_executada"), "canceladas": n("cancelada"),
                  "em_aberto": n("nao_iniciada") + n("em_andamento")},
        "metas": {"total": len(metas), "alcancadas": sum(m["situacao"] == "alcancada" for m in metas),
                  "nao_alcancadas": sum(m["situacao"] == "nao_alcancada" for m in metas),
                  "em_risco": sum(m["situacao"] == "em_risco" for m in metas),
                  "sem_resultado": sum(m["situacao"] in {"sem_resultado", "em_acompanhamento"} for m in metas)},
        "lista_metas": [{k: m[k] for k in ("codigo", "descricao", "situacao", "cumprimento", "anos")} for m in metas],
        "principais_resultados": [{"acao": a["codigo"], "descricao": a["descricao"], "resultado": a["resultado_alcancado"]}
                                  for a in acoes if a["situacao"] == "concluida" and a["resultado_alcancado"]],
        "justificativas": [{"acao": a["codigo"], "situacao": a["situacao_rotulo"], "justificativa": a["justificativa"]}
                           for a in acoes if a["situacao"] in {"parcial", "nao_executada", "cancelada"}],
        "dificuldades": [{"fato": f["fato"], "causa": f["causa"], "causa_validacao": f["causa_validacao"]} for f in fcas],
        "acoes_corretivas": [{"acao_corretiva": f["acao_corretiva"], "responsavel": f["responsavel"], "prazo": f["prazo"],
                              "situacao": f["situacao"]} for f in fcas],
        "reprogramacoes": reprogs,
        "recomendacoes": _recomendacoes(metas, acoes, fcas, reprogs),
        "aviso": "Avaliação de apoio ao RAG e à PAS seguinte. Não substitui o RAG oficial do DGMP/DigiSUS.",
    }


# ── Reuniões ─────────────────────────────────────────────────────────────────

async def gerar_pauta(db: AsyncSession, plano: PmsPlano, ano: int) -> dict:
    metas = await mon.monitoramento(db, plano, ano)
    acoes = await mon.acoes_do_ano(db, plano, ano)
    pend = (await db.execute(select(PmsAtualizacao).where(
        PmsAtualizacao.municipio_id == plano.municipio_id, PmsAtualizacao.status == "pendente",
        PmsAtualizacao.acao_id.in_([a["id"] for a in acoes] or [0])))).scalars().all()
    alertas = mon.alertas(acoes, metas, pend)
    por_resp: dict[str, list] = {}
    for a in alertas:
        if a["responsavel"]:
            por_resp.setdefault(a["responsavel"], []).append(a["texto"])
    fcas_vencidas = [f for f in await _fcas(db, plano, ano)
                     if f["prazo"] and f["prazo"] < date.today().isoformat() and f["situacao"] in {"aberta", "em_andamento"}]
    reprogs = [r for r in await reprogramacoes(db, plano) if r["situacao"] == "proposta"]
    anteriores = (await db.execute(select(PmsDecisao, PmsReuniao).join(PmsReuniao, PmsReuniao.id == PmsDecisao.reuniao_id)
                                   .where(PmsReuniao.plano_id == plano.id, PmsDecisao.municipio_id == plano.municipio_id,
                                          PmsDecisao.situacao == "pendente").order_by(PmsReuniao.data))).all()
    return {
        "ano": ano,
        "metas_em_risco": [{"codigo": m["codigo"], "descricao": m["descricao"], "situacao": m["situacao"],
                            "cumprimento": m["cumprimento"]} for m in metas if m["situacao"] in {"em_risco", "nao_alcancada"}],
        "acoes_atrasadas": [{"codigo": a["codigo"], "descricao": a["descricao"], "prazo": a["prazo"],
                             "responsavel": a["responsavel_nome"]} for a in acoes if a["atrasada"]],
        "pendencias_por_responsavel": [{"responsavel": k, "itens": v} for k, v in sorted(por_resp.items())],
        "problemas_para_decisao": (
            [f"Validação pendente: execução informada em {u.informado_em:%d/%m/%Y} (ação #{u.acao_id})." for u in pend]
            + [f"FCA com ação corretiva vencida: {f['acao_corretiva'][:120]}" for f in fcas_vencidas]),
        "reprogramacoes_propostas": [{"acao": r["acao"]["codigo"], "motivo": r["motivo"], "ano_destino": r["ano_destino"]}
                                     for r in reprogs],
        "providencias_anteriores": [{"reuniao": f"{ru.data:%d/%m/%Y} — {ru.titulo}", "decisao": d.descricao,
                                     "responsavel": d.responsavel, "prazo": d.prazo.isoformat() if d.prazo else None,
                                     "decisao_id": d.id} for d, ru in anteriores],
        "gerada_em": datetime.utcnow().isoformat(),
    }


def dict_reuniao(r: PmsReuniao, decisoes: list[PmsDecisao] | None = None) -> dict:
    return {"id": r.id, "plano_id": r.plano_id, "data": r.data.isoformat(), "titulo": r.titulo,
            "pauta": json.loads(r.pauta), "participantes": r.participantes, "ata": r.ata, "situacao": r.situacao,
            "criado_por": r.criado_por,
            "decisoes": [{"id": d.id, "descricao": d.descricao, "responsavel": d.responsavel,
                          "prazo": d.prazo.isoformat() if d.prazo else None, "situacao": d.situacao,
                          "observacao": d.observacao, "cumprida_em": d.cumprida_em.isoformat() if d.cumprida_em else None,
                          "atrasada": bool(d.prazo and d.prazo < date.today() and d.situacao == "pendente")}
                         for d in (decisoes or [])]}


# ── Integração com o Diagnóstico Situacional ─────────────────────────────────

async def integracao_diagnostico(db: AsyncSession, plano: PmsPlano, diagnostico_id: int | None, ano: int) -> dict:
    from models.diagnostico_situacional import DiagDiagnostico, DiagItem
    from services import diagnostico_catalogo as dcat
    mid = plano.municipio_id
    if diagnostico_id:
        diag = await db.get(DiagDiagnostico, diagnostico_id)
        if not diag or diag.municipio_id != mid:
            raise LookupError
    else:
        todos = (await db.execute(select(DiagDiagnostico).where(DiagDiagnostico.municipio_id == mid))).scalars().all()
        diag = max(todos, key=lambda d: dcat.chave_ordem(d.exercicio, d.periodo_tipo, d.periodo)) if todos else None
    metas = await mon.monitoramento(db, plano, ano)
    acoes = await mon.acoes_do_ano(db, plano, ano)
    if not diag:
        return {"diagnostico": None, "problemas": [], "metas_sem_acompanhamento": [], "acoes_sem_resultado": [],
                "recomendacoes": ["Não há Diagnóstico Situacional do município: gerar um para cruzar com o planejamento."]}
    itens = (await db.execute(select(DiagItem).where(DiagItem.diagnostico_id == diag.id, DiagItem.municipio_id == mid,
                                                     DiagItem.classificacao.in_(["pendencia", "critico"])))).scalars().all()
    vinc = (await db.execute(select(PmsDiagVinculo).where(
        PmsDiagVinculo.municipio_id == mid, PmsDiagVinculo.diag_item_id.in_([i.id for i in itens] or [0])))).scalars().all()
    metas_ids = {m["id"]: m for m in metas}
    acoes_ids = {a["id"]: a for a in acoes}
    problemas = []
    for i in itens:
        vs = [v for v in vinc if v.diag_item_id == i.id]
        problemas.append({
            "item_id": i.id, "codigo": i.codigo, "titulo": dcat.POR_CODIGO[i.codigo].titulo if i.codigo in dcat.POR_CODIGO else i.codigo,
            "classificacao": i.classificacao, "validacao": i.validacao, "natureza": i.natureza,
            "contemplado": bool(vs),
            "vinculos": [{"id": v.id, "meta": metas_ids[v.meta_id]["codigo"] if v.meta_id in metas_ids else None,
                          "meta_id": v.meta_id, "acao_id": v.acao_id,
                          "acao": acoes_ids[v.acao_id]["codigo"] if v.acao_id in acoes_ids else None,
                          "observacao": v.observacao} for v in vs]})
    sem_acomp = [{"codigo": m["codigo"], "descricao": m["descricao"],
                  "motivo": "sem ação na PAS do ano" if m["acoes_no_ano"] == 0 else "sem resultado registrado"}
                 for m in metas if m["acoes_no_ano"] == 0 or (m["situacao"] in {"sem_resultado"})]
    sem_res = [{"codigo": a["codigo"], "descricao": a["descricao"], "situacao": a["situacao_rotulo"]}
               for a in acoes if a["situacao"] in {"nao_executada"} or (a["situacao"] == "concluida" and not a["resultado_alcancado"])]
    rec = []
    for p in problemas:
        if not p["contemplado"]:
            rec.append(f"Problema {p['codigo']} ({'crítico' if p['classificacao'] == 'critico' else 'com pendência'}) "
                       "sem meta ou ação correspondente: avaliar inclusão no planejamento (PAS seguinte ou revisão do PMS).")
        elif p["validacao"] != "confirmado":
            rec.append(f"Problema {p['codigo']} vinculado ao planejamento, mas ainda não validado no Diagnóstico.")
    for m in sem_acomp:
        rec.append(f"Meta {m['codigo']} {m['motivo']}.")
    for a in sem_res:
        rec.append(f"Ação {a['codigo']} ({a['situacao'].lower()}) sem resultado apresentado.")
    return {"diagnostico": {"id": diag.id, "rotulo": dcat.rotulo_periodo(diag.exercicio, diag.periodo_tipo, diag.periodo),
                            "situacao": diag.situacao},
            "problemas": problemas, "contemplados": sum(p["contemplado"] for p in problemas),
            "sem_acao": sum(not p["contemplado"] for p in problemas),
            "metas_sem_acompanhamento": sem_acomp, "acoes_sem_resultado": sem_res, "recomendacoes": rec}
