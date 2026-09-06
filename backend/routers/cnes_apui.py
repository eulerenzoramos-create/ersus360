"""
Router CNES — Dados em tempo real do CNES/DATASUS para Apuí/AM.
Endpoint público — sem credencial.
"""
from fastapi import APIRouter, Query
from services import cnes_service

router = APIRouter(prefix="/api/cnes", tags=["CNES"])


@router.get("/status")
async def status_cnes():
    """Verifica conectividade com a API pública do CNES/DATASUS."""
    return await cnes_service.buscar_status()


@router.get("/equipes")
async def equipes_apui(
    tipo: str = Query(None, description="Filtrar por tipo: ESF, ESB, EMULTI"),
    apenas_ativas: bool = Query(True),
):
    """
    Retorna todas as equipes de saúde de Apuí/AM em tempo real via CNES.
    Cache de 6 horas.
    """
    equipes = await cnes_service.buscar_equipes_saude()
    if apenas_ativas:
        equipes = [e for e in equipes if e.get("ativo", True)]
    if tipo:
        mapa = {"ESF": "70", "ESB": "71", "EMULTI": "72"}
        tp = mapa.get(tipo.upper(), tipo)
        equipes = [e for e in equipes if e.get("tp_equipe") == tp]
    return {
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "total": len(equipes),
        "equipes": equipes,
    }


@router.get("/equipes/esf")
async def equipes_esf():
    """Retorna apenas equipes ESF (Equipe de Saúde da Família) de Apuí/AM."""
    equipes = await cnes_service.buscar_equipes_saude()
    esf = [e for e in equipes if e.get("tp_equipe") == "70" and e.get("ativo", True)]
    return {
        "municipio": "Apuí/AM",
        "total_esf": len(esf),
        "equipes": esf,
        "alerta_critico": [e for e in esf if e.get("alerta")],
    }


@router.get("/equipes/diagnostico")
async def diagnostico_equipes():
    """
    Diagnóstico completo das equipes de Apuí/AM com alertas.
    Compara dados do CNES com situação no SIAPS.
    """
    equipes = await cnes_service.buscar_equipes_saude()
    esf = [e for e in equipes if e.get("tp_equipe") == "70"]
    esb = [e for e in equipes if e.get("tp_equipe") == "71"]
    emulti = [e for e in equipes if e.get("tp_equipe") == "72"]
    criticos = [e for e in equipes if e.get("alerta")]
    ribeirinhas = [e for e in esf if e.get("ribeirinha")]

    return {
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "resumo": {
            "total_equipes": len(equipes),
            "total_esf": len(esf),
            "total_esb": len(esb),
            "total_emulti": len(emulti),
            "equipes_ribeirinhas": len(ribeirinhas),
            "alertas_criticos": len(criticos),
        },
        "esf": esf,
        "esb": esb,
        "emulti": emulti,
        "ribeirinhas": ribeirinhas,
        "alertas": criticos,
        "fonte": "CNES/DATASUS — cnes.datasus.gov.br/services/estabelecimentos-equipes",
        "nota": "ESF AREAL (INE 0000007048): ativa no CNES, ribeirinha=True, 0 vinculados no SIAPS Q1/26 — verificar ACS e fichas no e-SUS PEC",
    }


@router.get("/estabelecimentos")
async def estabelecimentos_apui():
    """Retorna estabelecimentos de saúde de Apuí/AM com equipes em tempo real."""
    estabs = await cnes_service.buscar_estabelecimentos()
    return {
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "total": len(estabs),
        "estabelecimentos": estabs,
    }


@router.get("/equipes/ubs/{cnes}")
async def equipes_por_ubs(cnes: str):
    """Retorna equipes de uma UBS específica pelo código CNES."""
    equipes = await cnes_service.buscar_equipes_saude()
    equipes_ubs = [e for e in equipes if e.get("cnes_ubs") == cnes]
    if not equipes_ubs:
        return {"cnes": cnes, "total": 0, "equipes": [], "mensagem": "UBS não encontrada ou sem equipes"}
    return {
        "cnes": cnes,
        "nome_ubs": equipes_ubs[0].get("nome_ubs", ""),
        "total": len(equipes_ubs),
        "equipes": equipes_ubs,
    }
