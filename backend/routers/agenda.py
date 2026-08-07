"""
Router: /api/agenda — Agenda de Gestão ERSUS 360
Prazos, reuniões, obrigações legais, alertas de vencimento
"""
from __future__ import annotations
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from functools import lru_cache

router = APIRouter(prefix="/api/agenda", tags=["Agenda"])

# ── Obrigações legais recorrentes ─────────────────────────────────────────────
@lru_cache(maxsize=1)
def _OBRIGACOES():
    return [
        { "id": 1,  "titulo": "Envio SIOPS — 2º Quad.",    "tipo": "legal",    "data": "2026-07-31", "status": "pendente",  "prioridade": "alta",  "responsavel": "Financeiro",  "descricao": "Prazo para envio do SIOPS — 2º Quadrimestre 2026 ao TCE-AM." },
        { "id": 2,  "titulo": "Relatório de Gestão FNS",   "tipo": "legal",    "data": "2026-08-15", "status": "pendente",  "prioridade": "alta",  "responsavel": "Financeiro",  "descricao": "Envio do Relatório de Gestão via FNS/MS para prestação de contas." },
        { "id": 3,  "titulo": "RDQA — Avaliação Externa",  "tipo": "legal",    "data": "2026-07-15", "status": "concluido", "prioridade": "alta",  "responsavel": "Qualidade",   "descricao": "Resultado da avaliação externa RDQA — Apuí 2026." },
        { "id": 4,  "titulo": "CMS — Reunião Ordinária",   "tipo": "reuniao",  "data": "2026-07-25", "status": "pendente",  "prioridade": "media", "responsavel": "Gestão",      "descricao": "Reunião ordinária do Conselho Municipal de Saúde." },
        { "id": 5,  "titulo": "Novo Financiamento APS — Dig. Jul.", "tipo": "producao", "data": "2026-07-10", "status": "concluido", "prioridade": "alta",  "responsavel": "APS",         "descricao": "Prazo para digitação da produção APS no e-SUS PEC — competência Jul/2026." },
        { "id": 6,  "titulo": "Folha de Pagamento",        "tipo": "rh",       "data": "2026-07-25", "status": "pendente",  "prioridade": "alta",  "responsavel": "RH",          "descricao": "Fechamento e envio da folha de pagamento dos servidores da saúde." },
        { "id": 7,  "titulo": "Renovação Contrato Serv.",  "tipo": "rh",       "data": "2026-07-31", "status": "pendente",  "prioridade": "media", "responsavel": "RH",          "descricao": "Renovação de contrato de 3 agentes comunitários de saúde." },
        { "id": 8,  "titulo": "Inventário Patrimônio",     "tipo": "patrimonio","data": "2026-09-30","status": "pendente",  "prioridade": "media", "responsavel": "Patrimônio",  "descricao": "Inventário anual de bens patrimoniais da FMS." },
        { "id": 9,  "titulo": "Capacitação ESF — NASF",    "tipo": "capacitacao","data": "2026-08-10","status": "pendente", "prioridade": "media", "responsavel": "APS",         "descricao": "Capacitação mensal das equipes ESF com o NASF-AB." },
        { "id": 10, "titulo": "Visita VISA às UBS",         "tipo": "vigilancia","data": "2026-07-28","status": "pendente", "prioridade": "media", "responsavel": "Vigilância",  "descricao": "Visita programada da Vigilância Sanitária às unidades básicas." },
        { "id": 11, "titulo": "Reunião TAC — Promotoria",  "tipo": "legal",    "data": "2026-08-05", "status": "pendente",  "prioridade": "alta",  "responsavel": "Jurídico",    "descricao": "Reunião do TAC com Ministério Público sobre atenção odontológica." },
        { "id": 12, "titulo": "Envio SISAB — Jul/2026",    "tipo": "producao", "data": "2026-08-25", "status": "pendente",  "prioridade": "alta",  "responsavel": "APS",         "descricao": "Prazo CONASEMS para envio da produção do SISAB/RNDS." },
    ]


@lru_cache(maxsize=1)
def _CATEGORIAS_COR():
    return {
        "legal":       "#c62828",
        "reuniao":     "#1565c0",
        "producao":    "#2e7d32",
        "rh":          "#6a1b9a",
        "patrimonio":  "#e65100",
        "capacitacao": "#f57f17",
        "vigilancia":  "#00838f",
    }



# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/eventos")
async def listar_eventos(
    tipo: str = Query(None),
    status: str = Query(None),
    proximos_dias: int = Query(None, description="Eventos nos próximos N dias"),
    _: UserOut = Depends(get_current_user),
):
    """Lista de eventos/obrigações do calendário de gestão."""
    eventos = _OBRIGACOES().copy()

    if tipo:
        eventos = [e for e in eventos if e["tipo"] == tipo]
    if status:
        eventos = [e for e in eventos if e["status"] == status]
    if proximos_dias:
        hoje = date.today()
        limite = hoje + timedelta(days=proximos_dias)
        eventos = [e for e in eventos if date.fromisoformat(e["data"]) <= limite]

    # Ordena por data
    eventos.sort(key=lambda e: e["data"])

    hoje = date.today()
    for e in eventos:
        d = date.fromisoformat(e["data"])
        delta = (d - hoje).days
        e["dias_restantes"] = delta
        e["urgencia"] = "vencido" if delta < 0 else "urgente" if delta <= 7 else "proximo" if delta <= 30 else "normal"

    pendentes = [e for e in eventos if e["status"] == "pendente"]
    vencidos  = [e for e in pendentes if e["dias_restantes"] < 0]
    urgentes  = [e for e in pendentes if 0 <= e["dias_restantes"] <= 7]

    return {
        "total": len(eventos),
        "pendentes": len(pendentes),
        "vencidos": len(vencidos),
        "urgentes_7d": len(urgentes),
        "categorias_cor": _CATEGORIAS_COR(),
        "eventos": eventos,
        "fonte": "referencia",
    }


@router.get("/resumo-mes")
async def resumo_mes(
    ano: int = Query(2026),
    mes: int = Query(7, ge=1, le=12),
    _: UserOut = Depends(get_current_user),
):
    """Resumo dos eventos do mês para exibição no calendário."""
    eventos_mes = [
        e for e in _OBRIGACOES()
        if e["data"].startswith(f"{ano}-{mes:02d}")
    ]
    por_tipo = {}
    for e in eventos_mes:
        por_tipo.setdefault(e["tipo"], 0)
        por_tipo[e["tipo"]] += 1

    return {
        "ano": ano,
        "mes": mes,
        "total_eventos": len(eventos_mes),
        "por_tipo": por_tipo,
        "eventos": eventos_mes,
        "fonte": "referencia",
    }


@router.get("/proximos-prazos")
async def proximos_prazos(
    dias: int = Query(30),
    _: UserOut = Depends(get_current_user),
):
    """Próximos prazos críticos nos próximos N dias."""
    hoje = date.today()
    limite = hoje + timedelta(days=dias)
    prazos = [
        e for e in _OBRIGACOES()
        if e["status"] == "pendente" and date.fromisoformat(e["data"]) <= limite
    ]
    prazos.sort(key=lambda e: e["data"])
    for p in prazos:
        d = date.fromisoformat(p["data"])
        p["dias_restantes"] = (d - hoje).days
    return {
        "periodo_dias": dias,
        "total_prazos": len(prazos),
        "prazos": prazos,
        "fonte": "referencia",
    }
