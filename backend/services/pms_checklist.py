"""
PMS Vivo — Checklist de execução da PAS e agente de monitoramento.

Checklist: cada ação da PAS do ano com a pergunta "foi feito?" (Feito / Parcial / Não feito),
com justificativa obrigatória quando não foi feito. A marcação usa a rota de execução já existente
(POST /acoes/{id}/atualizacoes) e continua passando pela validação de outra pessoa.

Agente (roda junto com a rotina diária do PMS Vivo, 07:30 de Manaus):
  • toda segunda-feira → resumo semanal da PAS do ano na central de alertas;
  • fim de quadrimestre (30/04, 31/08, 31/12) → alerta de fechamento para o RDQA/RAG, listando as ações
    sem informação e as não executadas com a justificativa registrada.
Nada é estimado: "sem informação" significa que ninguém informou a execução ainda.
"""
from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.pms_vivo import PmsAtualizacao, PmsPas
from services import pms_monitoramento as mon
from services import pms_vivo as base

STATUS_CHECKLIST = {
    "feito": "Feito",
    "parcial": "Parcial",
    "nao_feito": "Não feito",
    "aguardando_validacao": "Aguardando validação",
    "devolvida": "Devolvida para correção",
    "sem_informacao": "Sem informação",
    "cancelada": "Cancelada",
}
# Botões do checklist → situação oficial da ação
MARCACOES = {"feito": "concluida", "parcial": "parcial", "nao_feito": "nao_executada"}
FINS_QUADRIMESTRE = {(4, 30): 1, (8, 31): 2, (12, 31): 3}


def status_checklist(d: dict) -> str:
    if d["aguardando_validacao"]:
        return "aguardando_validacao"
    if d["situacao"] == "concluida":
        return "feito"
    if d["situacao"] == "parcial":
        return "parcial"
    if d["situacao"] == "nao_executada":
        return "nao_feito"
    if d["situacao"] == "cancelada":
        return "cancelada"
    if d["devolvida"]:
        return "devolvida"
    return "sem_informacao"


async def checklist(db: AsyncSession, plano, ano: int) -> dict:
    acoes = await mon.acoes_do_ano(db, plano, ano)
    ids = [a["id"] for a in acoes] or [0]
    ultimas: dict[int, PmsAtualizacao] = {}
    for u in (await db.execute(select(PmsAtualizacao).where(PmsAtualizacao.acao_id.in_(ids))
                               .order_by(PmsAtualizacao.id))).scalars():
        ultimas[u.acao_id] = u
    pas = (await db.execute(select(PmsPas).where(PmsPas.plano_id == plano.id, PmsPas.exercicio == ano))).scalars().first()
    itens = []
    for a in acoes:
        u = ultimas.get(a["id"])
        st = status_checklist(a)
        itens.append({
            "id": a["id"], "codigo": a["codigo"], "descricao": a["descricao"],
            "metas": [m["codigo"] for m in a["metas"]],
            "diretriz_ids": sorted({m["diretriz_id"] for m in a["metas"]}),
            "responsavel_nome": a["responsavel_nome"], "setor_responsavel": a["setor_responsavel"], "prazo": a["prazo"],
            "status": st, "status_rotulo": STATUS_CHECKLIST[st],
            "situacao": a["situacao"], "situacao_rotulo": a["situacao_rotulo"],
            "resultado_alcancado": a["resultado_alcancado"], "justificativa": a["justificativa"],
            "validado_por": a["situacao_validada_por"],
            "ultima": None if u is None else {
                "situacao_rotulo": base.SITUACOES_ACAO.get(u.situacao, u.situacao), "status": u.status,
                "informado_por": u.informado_por, "informado_em": u.informado_em.isoformat(),
                "resultado_alcancado": u.resultado_alcancado, "justificativa": u.justificativa, "parecer": u.parecer},
        })
    return {"exercicio": ano, "pas": None if pas is None else {"id": pas.id, "situacao": pas.situacao,
                                                                 "resolucao_cms": pas.resolucao_cms},
            "resumo": resumo(itens), "itens": itens}


def resumo(itens: list[dict]) -> dict:
    r = {k: sum(1 for i in itens if i["status"] == k) for k in STATUS_CHECKLIST}
    r["total"] = len(itens)
    informadas = r["total"] - r["sem_informacao"] - r["devolvida"]
    r["percentual_informado"] = round(100 * informadas / r["total"], 1) if r["total"] else None
    return r


def _lista(itens: list[dict], status: str, com_justificativa: bool = False, limite: int = 40) -> str:
    sel = [i for i in itens if i["status"] == status]
    linhas = [f"{i['codigo']}" + (f" — {(i['justificativa'] or 'sem justificativa')[:120]}" if com_justificativa else "")
              for i in sel[:limite]]
    if len(sel) > limite:
        linhas.append(f"... e mais {len(sel) - limite}")
    return "; ".join(linhas)


def texto_resumo(r: dict) -> str:
    return (f"{r['total']} ações: {r['feito']} feitas, {r['parcial']} parciais, {r['nao_feito']} não feitas, "
            f"{r['aguardando_validacao']} aguardando validação, {r['devolvida']} devolvidas, "
            f"{r['sem_informacao']} sem informação.")


async def registrar_monitoramento_execucao(db: AsyncSession, municipio_id: int, hoje: date | None = None) -> int:
    """Agente: grava na central de alertas o resumo semanal (segunda-feira) e o fechamento do quadrimestre."""
    from models.alerta import Alerta, SeveridadeAlerta
    from models.pms_vivo import PmsPlano
    hoje = hoje or date.today()
    quad = FINS_QUADRIMESTRE.get((hoje.month, hoje.day))
    if hoje.weekday() != 0 and not quad:
        return 0
    planos = (await db.execute(select(PmsPlano).where(PmsPlano.municipio_id == municipio_id,
                                                      PmsPlano.situacao == "aprovado"))).scalars().all()
    novos = 0
    for p in planos:
        if hoje.year not in base.anos_do(p):
            continue
        dados = await checklist(db, p, hoje.year)
        if not dados["itens"]:
            continue
        r = dados["resumo"]
        alertas = []
        if hoje.weekday() == 0:
            alertas.append((SeveridadeAlerta.INFO if r["sem_informacao"] == 0 else SeveridadeAlerta.ATENCAO,
                            f"PMS: monitoramento semanal da PAS {hoje.year}",
                            f"Semana de {hoje:%d/%m/%Y}. {texto_resumo(r)}"
                            + (f" Sem informação: {_lista(dados['itens'], 'sem_informacao')}." if r["sem_informacao"] else "")))
        if quad:
            pend = r["sem_informacao"] + r["devolvida"]
            desc = (f"Fechamento do {quad}º quadrimestre de {hoje.year} ({hoje:%d/%m/%Y}). {texto_resumo(r)}")
            if pend:
                desc += f" Sem informação: {_lista(dados['itens'], 'sem_informacao')}."
            if r["nao_feito"]:
                desc += f" Não feitas: {_lista(dados['itens'], 'nao_feito', com_justificativa=True)}."
            alertas.append((SeveridadeAlerta.CRITICO if pend or r["nao_feito"] else SeveridadeAlerta.INFO,
                            f"PMS: fechamento do {quad}º quadrimestre da PAS {hoje.year}", desc))
        for sev, titulo, desc in alertas:
            chave = desc.split(".")[0]          # "Semana de dd/mm/aaaa" ou "Fechamento do Nº quadrimestre ..."
            existe = (await db.execute(select(Alerta.id).where(
                Alerta.municipio_id == municipio_id, Alerta.modulo == "PMS Vivo", Alerta.titulo == titulo,
                Alerta.descricao.like(chave + "%")))).first()
            if not existe:
                db.add(Alerta(municipio_id=municipio_id, modulo="PMS Vivo", severidade=sev, titulo=titulo[:200],
                              descricao=desc))
                novos += 1
    await db.commit()
    return novos
