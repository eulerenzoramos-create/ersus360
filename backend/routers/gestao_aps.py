"""Router: /api/gestao — ERSUS 360 — Painel de Gestão APS Apuí/AM
Retorna apenas dados verificados de fontes oficiais.
Endpoints sem integração ativa retornam situacao_dado="sem_integracao".
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.fns_api_service import buscar_indicadores_previne
from services.sia_service import buscar_producao_aps

router = APIRouter(prefix="/api/gestao", tags=["gestao_aps"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1

_SEM_INTEGRACAO = {"situacao_dado": "sem_integracao"}


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    previne = await buscar_indicadores_previne(ano)
    sia = await buscar_producao_aps(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [previne, sia])
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "ano": ano, "previne": previne, "producao_aps": sia,
        "fonte": "e-Gestor APS + SIA — dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


# Todos os endpoints abaixo aguardam integração com fonte oficial
@router.get("/atendimentos")
async def atendimentos():
    return _SEM_INTEGRACAO


@router.get("/procedimentos")
async def procedimentos():
    return _SEM_INTEGRACAO


@router.get("/vacinas")
async def vacinas():
    return _SEM_INTEGRACAO


@router.get("/visitas")
async def visitas():
    return _SEM_INTEGRACAO


@router.get("/sisab")
async def sisab():
    return _SEM_INTEGRACAO


@router.get("/equipes-esf")
async def equipes_esf():
    return _SEM_INTEGRACAO


@router.get("/painel")
async def painel():
    return _SEM_INTEGRACAO
