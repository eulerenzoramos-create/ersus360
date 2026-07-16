"""
Router: /api/conformidade — Central de Conformidade Legal
Agrega todas as obrigações legais periódicas do município de saúde:
  SIOPS, RDQA/CMS, FNS prestação de contas, SISAB/RNDS, CAP, PAS,
  Vigilância Sanitária, etc.
"""
from __future__ import annotations
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/conformidade", tags=["Conformidade"])

# ── Obrigações legais ─────────────────────────────────────────────────────────

_ANO = 2026

_OBRIGACOES: list[dict] = [
    # ── SIOPS ──────────────────────────────────────────────────────────────
    {"id": "SIOPS-Q1", "categoria": "SIOPS", "titulo": "SIOPS 1º Quadrimestre",
     "descricao": "Envio do Sistema de Informações sobre Orçamentos Públicos em Saúde",
     "prazo": f"{_ANO}-05-30", "status": "concluido", "responsavel": "Contabilidade",
     "base_legal": "LC 141/2012 art. 36", "modulo": "/siops", "prioridade": "alta"},
    {"id": "SIOPS-Q2", "categoria": "SIOPS", "titulo": "SIOPS 2º Quadrimestre",
     "descricao": "Envio consolidado mai-ago ao Ministério da Saúde",
     "prazo": f"{_ANO}-09-30", "status": "pendente", "responsavel": "Contabilidade",
     "base_legal": "LC 141/2012 art. 36", "modulo": "/siops", "prioridade": "alta"},
    {"id": "SIOPS-Q3", "categoria": "SIOPS", "titulo": "SIOPS 3º Quadrimestre",
     "descricao": "Envio consolidado set-dez ao Ministério da Saúde",
     "prazo": f"{_ANO}-01-30", "status": "nao_iniciado", "responsavel": "Contabilidade",
     "base_legal": "LC 141/2012 art. 36", "modulo": "/siops", "prioridade": "alta"},

    # ── RDQA / CMS ──────────────────────────────────────────────────────────
    {"id": "RDQA-Q1", "categoria": "RDQA/CMS", "titulo": "RDQA 1º Quadrimestre — Apresentação ao CMS",
     "descricao": "Relatório Detalhado Quadrimestral de Ações ao Conselho Municipal",
     "prazo": f"{_ANO}-05-28", "status": "concluido", "responsavel": "Secretário de Saúde",
     "base_legal": "Lei 8.142/1990 + NOB 1/96", "modulo": "/rdqa", "prioridade": "alta"},
    {"id": "RDQA-Q2", "categoria": "RDQA/CMS", "titulo": "RDQA 2º Quadrimestre — Apresentação ao CMS",
     "descricao": "Relatório referente a mai-ago/2026 para deliberação do CMS",
     "prazo": f"{_ANO}-09-30", "status": "em_elaboracao", "responsavel": "Secretário de Saúde",
     "base_legal": "Lei 8.142/1990 + NOB 1/96", "modulo": "/rdqa", "prioridade": "alta"},
    {"id": "RDQA-Q3", "categoria": "RDQA/CMS", "titulo": "RDQA 3º Quadrimestre — Apresentação ao CMS",
     "descricao": "Relatório referente a set-dez/2026",
     "prazo": "2027-01-30", "status": "nao_iniciado", "responsavel": "Secretário de Saúde",
     "base_legal": "Lei 8.142/1990 + NOB 1/96", "modulo": "/rdqa", "prioridade": "alta"},

    # ── FNS ─────────────────────────────────────────────────────────────────
    {"id": "FNS-CAP1", "categoria": "FNS", "titulo": "CAP Mensal — Julho/2026",
     "descricao": "Comunicação de Alteração de Projeto — prazo até dia 20 do mês seguinte",
     "prazo": f"{_ANO}-07-20", "status": "concluido", "responsavel": "Setor FNS",
     "base_legal": "Portaria GM/MS 3.992/2017", "modulo": "/fns", "prioridade": "media"},
    {"id": "FNS-CAP2", "categoria": "FNS", "titulo": "CAP Mensal — Agosto/2026",
     "descricao": "Atualização de saldos e execução mensal no FNS",
     "prazo": f"{_ANO}-08-20", "status": "pendente", "responsavel": "Setor FNS",
     "base_legal": "Portaria GM/MS 3.992/2017", "modulo": "/fns", "prioridade": "media"},
    {"id": "FNS-PRESTACAO", "categoria": "FNS", "titulo": "Prestação de Contas FNS — Anuais",
     "descricao": "Envio anual de prestação de contas de convênios encerrados",
     "prazo": f"{_ANO}-12-31", "status": "pendente", "responsavel": "Setor FNS",
     "base_legal": "IN TCU 71/2012", "modulo": "/fns", "prioridade": "alta"},

    # ── SISAB / RNDS ────────────────────────────────────────────────────────
    {"id": "SISAB-JUL", "categoria": "SISAB/RNDS", "titulo": "Envio SISAB — Julho/2026",
     "descricao": "Produção mensal das equipes APS — prazo dia 15 do mês seguinte",
     "prazo": f"{_ANO}-08-15", "status": "pendente", "responsavel": "TI / APS",
     "base_legal": "Portaria 1.412/2013", "modulo": "/aps", "prioridade": "alta"},
    {"id": "SISAB-AGO", "categoria": "SISAB/RNDS", "titulo": "Envio SISAB — Agosto/2026",
     "descricao": "Produção mensal das equipes APS",
     "prazo": f"{_ANO}-09-15", "status": "nao_iniciado", "responsavel": "TI / APS",
     "base_legal": "Portaria 1.412/2013", "modulo": "/aps", "prioridade": "alta"},

    # ── Plano de Saúde ──────────────────────────────────────────────────────
    {"id": "PAS-2027", "categoria": "Planejamento", "titulo": "Elaboração PAS 2027",
     "descricao": "Programação Anual de Saúde para o exercício 2027, aprovação CMS até dez/2026",
     "prazo": f"{_ANO}-11-30", "status": "nao_iniciado", "responsavel": "Gabinete / Planejamento",
     "base_legal": "Lei 8.080/1990 art. 36", "modulo": "/planejamento", "prioridade": "alta"},
    {"id": "PMS-2026-2029", "categoria": "Planejamento", "titulo": "Revisão PMS 2026–2029",
     "descricao": "Revisão anual do Plano Municipal de Saúde — aprovação pelo CMS",
     "prazo": f"{_ANO}-12-15", "status": "nao_iniciado", "responsavel": "Gabinete",
     "base_legal": "Lei 8.080/1990", "modulo": "/planejamento", "prioridade": "media"},

    # ── Vigilância Sanitária ────────────────────────────────────────────────
    {"id": "VISA-RELATORIO-SEM1", "categoria": "Vigilância", "titulo": "Relatório VISA 1º Semestre",
     "descricao": "Envio de inspeções sanitárias realizadas à VISA Estadual",
     "prazo": f"{_ANO}-07-31", "status": "concluido", "responsavel": "VISA Municipal",
     "base_legal": "Lei 6.437/1977", "modulo": "/vigilancia", "prioridade": "media"},
    {"id": "VISA-RELATORIO-SEM2", "categoria": "Vigilância", "titulo": "Relatório VISA 2º Semestre",
     "descricao": "Envio de inspeções sanitárias realizadas à VISA Estadual",
     "prazo": f"{_ANO}-01-31", "status": "nao_iniciado", "responsavel": "VISA Municipal",
     "base_legal": "Lei 6.437/1977", "modulo": "/vigilancia", "prioridade": "media"},

    # ── Novo Financiamento APS ──────────────────────────────────────────────────────
    {"id": "PREVINE-AVALIAC-Q3", "categoria": "Novo Financiamento APS", "titulo": "Avaliação Novo Financiamento APS — 3º Quadrimestre",
     "descricao": "Fechamento dos 7 indicadores para competição de desempenho",
     "prazo": f"{_ANO}-11-30", "status": "nao_iniciado", "responsavel": "Coord. APS",
     "base_legal": "Portaria 2.979/2019", "modulo": "/previne", "prioridade": "alta"},

    # ── Emendas parlamentares ───────────────────────────────────────────────
    {"id": "EMENDAS-RELATORIO", "categoria": "Emendas", "titulo": "Relatório de Execução de Emendas",
     "descricao": "Envio semestral ao Ministério da Saúde do status de execução física/financeira",
     "prazo": f"{_ANO}-08-31", "status": "pendente", "responsavel": "Setor de Emendas",
     "base_legal": "Portaria 1.369/2022", "modulo": "/emendas", "prioridade": "media"},
]


def _calcular_status(ob: dict, hoje: date) -> dict:
    """Enriquece obrigação com dias_para_prazo, semaforo, urgente."""
    prazo = date.fromisoformat(ob["prazo"])
    delta = (prazo - hoje).days
    status = ob["status"]

    if status == "concluido":
        semaforo = "verde"
    elif delta < 0:
        semaforo = "vermelho"  # vencido
    elif delta <= 7:
        semaforo = "vermelho"  # urgente
    elif delta <= 30:
        semaforo = "amarelo"
    else:
        semaforo = "azul" if status == "em_elaboracao" else "cinza"

    return {
        **ob,
        "dias_para_prazo": delta,
        "semaforo": semaforo,
        "urgente": delta <= 7 and status != "concluido",
        "vencido": delta < 0 and status != "concluido",
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
async def listar_obrigacoes(
    categoria: str | None = Query(None),
    status: str | None = Query(None),
    _: UserOut = Depends(get_current_user),
):
    """Lista todas as obrigações legais com semáforo de conformidade."""
    hoje = date.today()
    itens = [_calcular_status(ob, hoje) for ob in _OBRIGACOES]

    if categoria:
        itens = [i for i in itens if i["categoria"].lower() == categoria.lower()]
    if status:
        itens = [i for i in itens if i["status"] == status]

    # Ordenar: vencidos → urgentes → próximos → futuros → concluídos
    ordem = {"vermelho": 0, "amarelo": 1, "azul": 2, "cinza": 3, "verde": 4}
    itens.sort(key=lambda x: (ordem.get(x["semaforo"], 5), x["dias_para_prazo"]))

    # Resumo
    total       = len(itens)
    concluidos  = sum(1 for i in itens if i["status"] == "concluido")
    vencidos    = sum(1 for i in itens if i["vencido"])
    urgentes    = sum(1 for i in itens if i["urgente"] and not i["vencido"])
    proximos    = sum(1 for i in itens if not i["urgente"] and not i["vencido"]
                      and i["status"] != "concluido" and i["dias_para_prazo"] <= 60)

    pct_conformidade = round(concluidos / total * 100, 1) if total else 0

    return {
        "municipio":          "Apuí/AM",
        "data_referencia":    hoje.isoformat(),
        "resumo": {
            "total":              total,
            "concluidos":         concluidos,
            "vencidos":           vencidos,
            "urgentes":           urgentes,
            "proximos_60d":       proximos,
            "pct_conformidade":   pct_conformidade,
        },
        "obrigacoes": itens,
        "categorias": sorted({i["categoria"] for i in itens}),
        "fonte": "referencia",
    }


@router.get("/dashboard")
async def dashboard_conformidade(_: UserOut = Depends(get_current_user)):
    """KPIs rápidos de conformidade para widget no dashboard."""
    hoje = date.today()
    itens = [_calcular_status(ob, hoje) for ob in _OBRIGACOES]
    total = len(itens)
    concluidos = sum(1 for i in itens if i["status"] == "concluido")
    criticos = sum(1 for i in itens if i["vencido"] or i["urgente"])

    proximos = sorted(
        [i for i in itens if i["status"] != "concluido" and i["dias_para_prazo"] >= 0],
        key=lambda x: x["dias_para_prazo"],
    )[:3]

    return {
        "pct_conformidade":  round(concluidos / total * 100, 1) if total else 0,
        "total":             total,
        "concluidos":        concluidos,
        "criticos":          criticos,
        "proximos_prazos":   proximos,
        "fonte":             "referencia",
    }
