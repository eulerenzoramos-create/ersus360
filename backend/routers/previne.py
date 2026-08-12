"""
Router: /api/previne — Novo Financiamento APS (7 indicadores oficiais)
API: e-Gestor APS / SISAB — dados reais somente.
Sem fallback com valores inventados. API indisponível → nao_disponivel.
"""
from __future__ import annotations
from datetime import date

from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services import previne_service, cnes_service

router = APIRouter(prefix="/api/previne", tags=["Novo Financiamento APS"])

_IBGE = "1300144"


def _competencia_atual() -> str:
    hoje = date.today()
    return f"{hoje.year}{hoje.month:02d}"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/indicadores")
async def listar_indicadores(
    competencia: str = Query(None, description="AAAAMM — omitir usa competência atual"),
    _: UserOut = Depends(get_current_user),
):
    """7 indicadores Novo Financiamento APS com metas e status via API e-Gestor APS."""
    comp = competencia or _competencia_atual()
    return await previne_service.buscar_indicadores(comp)


@router.get("/historico")
async def historico_indicadores(
    meses: int = Query(6, ge=1, le=24),
    _: UserOut = Depends(get_current_user),
):
    """Histórico mensal dos indicadores Previne Brasil via API e-Gestor APS."""
    return await previne_service.buscar_historico(meses=meses)


@router.get("/equipes")
async def indicadores_por_equipe(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """
    Indicadores Previne Brasil por equipe ESF — via CNES/DATASUS.
    Indicadores per-equipe requerem EGESTOR_TOKEN no Railway (API fechada).
    """
    equipes_cnes = await cnes_service.buscar_equipes_saude(ibge)

    if not equipes_cnes:
        return {
            "ibge":           ibge,
            "situacao_dado":  "nao_disponivel",
            "total_equipes":  None,
            "equipes":        [],
            "nota": (
                "Equipes ESF do CNES/DATASUS não retornadas. "
                "Indicadores per-equipe requerem EGESTOR_TOKEN no Railway "
                "(acesso à API SISAB fechada do e-Gestor APS)."
            ),
        }

    equipes_out = []
    for eq in equipes_cnes:
        equipes_out.append({
            "ine":           eq.get("ine"),
            "nome":          eq.get("nome_equipe") or eq.get("nome"),
            "ubs":           eq.get("nome_estabelecimento") or eq.get("ubs"),
            "tipo":          eq.get("tipo_equipe", "ESF"),
            "situacao_dado": "nao_disponivel",
            "indicadores":   [],
            "nota": (
                "Indicadores por equipe requerem EGESTOR_TOKEN (API fechada). "
                "Dados estruturais do CNES disponíveis."
            ),
        })

    return {
        "ibge":          ibge,
        "situacao_dado": "dado_nao_validado",
        "total_equipes": len(equipes_out),
        "equipes":       equipes_out,
        "nota":          "Estrutura de equipes via CNES/DATASUS. Indicadores per-equipe pendentes de EGESTOR_TOKEN.",
    }


@router.get("/busca-ativa")
async def busca_ativa(
    indicador: int = Query(..., ge=1, le=7, description="Número do indicador (1–7)"),
    _: UserOut = Depends(get_current_user),
):
    """
    Lista de pacientes elegíveis para busca ativa por indicador.
    Requer e-SUS PEC local (ESUS_URL configurado no Railway).
    """
    _NOMES = {
        1: "Pré-natal ≥ 6 consultas",
        2: "Citopatológico do colo do útero",
        3: "Vacinação DTP/Pentavalente",
        4: "Consulta RN na 1ª semana de vida",
        5: "Acompanhamento — HAS",
        6: "Acompanhamento — DM (HbA1c)",
        7: "Cuidado Pessoas com Obesidade",
    }
    return {
        "indicador":      indicador,
        "nome":           _NOMES.get(indicador, f"Indicador {indicador}"),
        "situacao_dado":  "nao_disponivel",
        "total_elegivel": None,
        "total_realizado": None,
        "pendentes":      None,
        "pacientes":      [],
        "nota": (
            "Busca ativa requer acesso ao e-SUS PEC local. "
            "Configure ESUS_URL, ESUS_USUARIO e ESUS_SENHA no Railway."
        ),
    }
