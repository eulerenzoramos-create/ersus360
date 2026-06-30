"""
Router de Integração — CNES, FNS API, e-SUS PEC
Endpoints para consulta e sincronização de dados externos.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.auth import get_current_user
from services.cnes_service import buscar_estabelecimentos, buscar_equipes_saude
from services.fns_api_service import buscar_repasses, buscar_convenios, buscar_indicadores_previne
from services.esus_service import buscar_producao, buscar_indicadores_aps, buscar_cadastros, buscar_equipes

router = APIRouter(prefix="/api/integracao", tags=["Integração"])

hoje = datetime.now()


@router.get("/status")
async def status_integracoes(_=Depends(get_current_user)):
    """Retorna status de todas as integrações configuradas."""
    from config import settings
    return {
        "municipio": {"nome": "Apuí", "uf": "AM", "ibge": settings.FNS_MUNICIPIO_IBGE},
        "integracoes": {
            "cnes": {
                "nome": "CNES / DATASUS",
                "url": settings.CNES_API,
                "credencial_necessaria": False,
                "status": "ativo",
            },
            "fns_api": {
                "nome": "FNS API (apifns.saude.gov.br)",
                "url": settings.FNS_API_BASE,
                "credencial_necessaria": True,
                "configurada": bool(settings.FNS_API_CPF and settings.FNS_API_SENHA),
                "status": "ativo" if settings.FNS_API_CPF else "aguardando_credencial",
            },
            "esus_pec": {
                "nome": "e-SUS PEC",
                "url": settings.ESUS_URL,
                "credencial_necessaria": True,
                "configurada": bool(settings.ESUS_USUARIO and settings.ESUS_SENHA),
                "status": "ativo" if settings.ESUS_USUARIO else "aguardando_credencial",
            },
        },
    }


# ── CNES ─────────────────────────────────────────────────────────────────────

@router.get("/cnes/estabelecimentos")
async def listar_estabelecimentos(_=Depends(get_current_user)):
    """Lista estabelecimentos de saúde de Apuí/AM via CNES/DATASUS."""
    data = await buscar_estabelecimentos()
    return {"total": len(data), "municipio": "Apuí/AM", "fonte": "CNES/DATASUS", "dados": data}


@router.get("/cnes/equipes")
async def listar_equipes_cnes(_=Depends(get_current_user)):
    """Lista equipes de saúde da família cadastradas no CNES para Apuí/AM."""
    data = await buscar_equipes_saude()
    return {"total": len(data), "dados": data}


# ── FNS API ───────────────────────────────────────────────────────────────────

@router.get("/fns/repasses")
async def repasses_fns(
    ano: int = None, mes: int = None,
    _=Depends(get_current_user)
):
    """Busca repasses do FNS via apifns.saude.gov.br para Apuí/AM."""
    ano = ano or hoje.year
    mes = mes or hoje.month
    data = await buscar_repasses(ano, mes)
    return {"competencia": f"{ano}-{mes:02d}", "municipio_ibge": "1300144", "repasses": data}


@router.get("/fns/convenios")
async def convenios_fns(_=Depends(get_current_user)):
    """Busca convênios vigentes de Apuí/AM no FNS."""
    data = await buscar_convenios()
    return {"total": len(data), "convenios": data}


@router.get("/fns/previne")
async def indicadores_previne(_=Depends(get_current_user)):
    """Busca indicadores do Previne Brasil para Apuí/AM."""
    data = await buscar_indicadores_previne()
    return {"indicadores": data}


# ── e-SUS PEC ─────────────────────────────────────────────────────────────────

@router.get("/esus/producao")
async def producao_esus(
    competencia: str = None,
    _=Depends(get_current_user)
):
    """Busca dados de produção do e-SUS PEC de Apuí/AM."""
    comp = competencia or f"{hoje.year}-{hoje.month:02d}"
    data = await buscar_producao(comp)
    return data


@router.get("/esus/indicadores")
async def indicadores_esus(_=Depends(get_current_user)):
    """Busca indicadores APS do e-SUS PEC."""
    data = await buscar_indicadores_aps()
    return {"total": len(data), "indicadores": data}


@router.get("/esus/cadastros")
async def cadastros_esus(_=Depends(get_current_user)):
    """Busca totais de cadastros do e-SUS PEC."""
    return await buscar_cadastros()


@router.get("/esus/equipes")
async def equipes_esus(_=Depends(get_current_user)):
    """Lista equipes vinculadas no e-SUS PEC."""
    data = await buscar_equipes()
    return {"total": len(data), "equipes": data}


# ── Sync geral ────────────────────────────────────────────────────────────────

@router.post("/sincronizar")
async def sincronizar_tudo(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user)
):
    """Sincroniza dados de todas as integrações de uma vez."""
    erros = []
    resultados = {}

    try:
        estab = await buscar_estabelecimentos()
        resultados["cnes_estabelecimentos"] = len(estab)
    except Exception as e:
        erros.append(f"CNES: {e}")

    try:
        reps = await buscar_repasses(hoje.year, hoje.month)
        resultados["fns_repasses"] = len(reps)
    except Exception as e:
        erros.append(f"FNS repasses: {e}")

    try:
        convs = await buscar_convenios()
        resultados["fns_convenios"] = len(convs)
    except Exception as e:
        erros.append(f"FNS convênios: {e}")

    try:
        prod = await buscar_producao(f"{hoje.year}-{hoje.month:02d}")
        resultados["esus_producao"] = prod.get("atendimentos_individuais", 0)
    except Exception as e:
        erros.append(f"e-SUS produção: {e}")

    return {
        "status": "concluido" if not erros else "parcial",
        "timestamp": hoje.isoformat(),
        "resultados": resultados,
        "erros": erros,
    }
