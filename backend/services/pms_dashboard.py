"""
PMS Vivo — Dashboard consolidado do plano (visão do gestor em uma tela).

Junta o que já é calculado nos outros módulos, sem cálculo novo de resultado:
  • metas do ano por situação (pms_monitoramento) e por diretriz;
  • execução da PAS do ano pelo checklist "foi feito?" (pms_checklist), geral e por diretriz;
  • PAS de cada ano da vigência (existe? aprovada?), prazo do quadrimestre corrente;
  • alertas por severidade e cobertura de cadastro (ações sem responsável/prazo, metas sem tipo).
Nada é estimado: sem resultado ou sem informação aparece como tal.
"""
from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.pms_vivo import PmsAcao, PmsAtualizacao, PmsDiretriz, PmsPas
from services import pms_checklist as chk
from services import pms_monitoramento as mon
from services import pms_vivo as base

FIM_QUADRIMESTRE = {1: (4, 30), 2: (8, 31), 3: (12, 31)}


def quadrimestre(hoje: date, ano: int) -> dict:
    """Quadrimestre de referência do ano escolhido (corrente se for o ano atual)."""
    if ano < hoje.year:
        q = 3
    elif ano > hoje.year:
        q = 1
    else:
        q = 1 if hoje.month <= 4 else 2 if hoje.month <= 8 else 3
    m, d = FIM_QUADRIMESTRE[q]
    fim = date(ano, m, d)
    return {"numero": q, "fim": fim.isoformat(), "dias_restantes": (fim - hoje).days if fim >= hoje else None,
            "encerrado": fim < hoje}


async def dashboard(db: AsyncSession, plano, ano: int, hoje: date | None = None) -> dict:
    hoje = hoje or date.today()
    metas = await mon.monitoramento(db, plano, ano)
    lista = await chk.checklist(db, plano, ano)
    itens = lista["itens"]
    acoes = await mon.acoes_do_ano(db, plano, ano)
    pend = (await db.execute(select(PmsAtualizacao).where(
        PmsAtualizacao.municipio_id == plano.municipio_id, PmsAtualizacao.status == "pendente",
        PmsAtualizacao.acao_id.in_([a["id"] for a in acoes] or [0])))).scalars().all()
    als = mon.alertas(acoes, metas, pend, hoje)

    diretrizes = (await db.execute(select(PmsDiretriz).where(PmsDiretriz.plano_id == plano.id)
                                   .order_by(PmsDiretriz.ordem))).scalars().all()
    por_diretriz = []
    for d in diretrizes:
        ms = [m for m in metas if m["diretriz_id"] == d.id]
        its = [i for i in itens if d.id in i["diretriz_ids"]]
        por_diretriz.append({
            "id": d.id, "codigo": d.codigo, "descricao": d.descricao,
            "metas": {"total": len(ms), **{k: sum(1 for m in ms if m["situacao"] == k) for k in mon.SITUACOES_META}},
            "acoes": chk.resumo(its),
        })

    # PAS de cada ano da vigência
    pas_rows = {p.exercicio: p for p in (await db.execute(
        select(PmsPas).where(PmsPas.plano_id == plano.id))).scalars()}
    n_acoes = dict((await db.execute(select(PmsAcao.pas_id, func.count(PmsAcao.id)).where(
        PmsAcao.pas_id.in_([p.id for p in pas_rows.values()] or [0]), PmsAcao.excluido_em.is_(None))
        .group_by(PmsAcao.pas_id))).all())
    pas_anos = [{"exercicio": a, "existe": a in pas_rows,
                 "situacao": pas_rows[a].situacao if a in pas_rows else None,
                 "resolucao_cms": pas_rows[a].resolucao_cms if a in pas_rows else None,
                 "acoes": n_acoes.get(pas_rows[a].id, 0) if a in pas_rows else 0} for a in base.anos_do(plano)]

    com_resultado = sum(1 for m in metas if any(x["ano"] == ano and x["resultado"] is not None for x in m["anos"]))
    sev = {s: sum(1 for a in als if a["severidade"] == s) for s in ("critico", "atencao", "info")}
    return {
        "plano": base.dict_plano(plano), "ano": ano, "anos": base.anos_do(plano),
        "quadrimestre": quadrimestre(hoje, ano),
        "metas": {"total": len(metas), **{k: sum(1 for m in metas if m["situacao"] == k) for k in mon.SITUACOES_META},
                  "com_resultado_no_ano": com_resultado,
                  "sem_tipo_indicador": sum(1 for m in metas if m["tipo_indicador"] is None)},
        "rotulos_metas": mon.SITUACOES_META,
        "execucao": lista["resumo"], "rotulos_execucao": chk.STATUS_CHECKLIST, "pas": lista["pas"],
        "pas_anos": pas_anos,
        "por_diretriz": por_diretriz,
        "cadastro": {"acoes": len(acoes),
                     "sem_responsavel": sum(1 for a in acoes if not a["responsavel_usuario_id"] and not a["responsavel_nome"]),
                     "sem_prazo": sum(1 for a in acoes if not a["prazo"]),
                     "atrasadas": sum(1 for a in acoes if a["atrasada"])},
        "alertas": {**sev, "principais": [a for a in als if a["severidade"] in ("critico", "atencao")][:8]},
        "metas_em_risco": [{"id": m["id"], "codigo": m["codigo"], "descricao": m["descricao"], "situacao": m["situacao"],
                            "cumprimento": m["cumprimento"]} for m in metas if m["situacao"] in {"em_risco", "nao_alcancada"}][:10],
        "documento_anexado": None,   # preenchido pela rota (precisa da lista de anexos)
    }
