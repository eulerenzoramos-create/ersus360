"""Router: /api/acs — ERSUS 360 — Painel ACS Apuí/AM
Sem dados simulados: enquanto não houver fonte real (e-SUS PEC/CNES), responde "não disponível".
"""
from __future__ import annotations
import logging
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/acs", tags=["ACS"])

_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

# ── Sem dados simulados ───────────────────────────────────────────────────────
# Este painel NÃO tem fonte real conectada ainda: os números de ACS/visitas/cadastros
# dependem do e-SUS PEC (agente local, após autorização da Secretaria) e a lista de
# ACS depende do XML do CNES importado. Nenhum valor é estimado ou inventado: enquanto
# não houver fonte, as telas informam "dado não disponível".
_NOTA = (
    "Dado não disponível: depende do e-SUS PEC (agente local, após autorização da Secretaria) "
    "ou do XML do CNES importado. Nenhum valor é estimado."
)


# ── Endpoints principais ──────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(
    ano: int = Query(0),
    esf: str = Query(""),
):
    return {
        "situacao_dado": "nao_disponivel",
        "fonte": None,
        "mes_referencia": {"label": datetime.now().strftime("%B/%Y")},
        "kpis": None,
        "nota": _NOTA,
        "producao_esus": None,
        "verificado_em": _TS(),
    }

@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)

@router.get("/producao")
async def producao(ano: int = Query(0)):
    return {"situacao_dado": "nao_disponivel", "ano": ano or date.today().year, "indicadores": None,
            "nota": _NOTA, "verificado_em": _TS()}

@router.get("/lista")
async def lista_acs(esf: str = Query("")):
    return {"acs": [], "total": 0, "fonte": None, "nota": _NOTA, "verificado_em": _TS()}

@router.get("/microareas")
async def microareas():
    return {"microareas": [], "total": 0, "fonte": None, "nota": _NOTA, "verificado_em": _TS()}


# ── Endpoints eSUS PEC (sem dado enquanto não houver fonte real) ──────────────

@router.get("/esus/status")
async def esus_status():
    return {
        "conectado": False, "autenticado": False,
        "url": "", "versao": None,
        "instancia": None, "municipio": None,
    }

@router.get("/esus/visitas")
async def esus_visitas(
    periodo: str = Query("mensal"),
    competencia: str = Query(""),
    data: str = Query(""),
    ano: str = Query(""),
):
    return {"dados": None, "nota": _NOTA, "verificado_em": _TS()}

@router.get("/esus/calendario-visitas")
async def esus_calendario():
    return {"dados": [], "fonte": None, "verificado_em": _TS()}

@router.get("/esus/cadastros-individuais")
async def esus_cadastros_individuais(pagina: int = Query(1), tamanho: int = Query(50)):
    return {
        "dados": [], "total": 0, "pagina": pagina, "tamanho": tamanho,
        "fonte": "indisponivel", "nota": "Conecte o e-SUS PEC para ver os cadastros individuais reais.",
        "verificado_em": _TS(),
    }

@router.get("/esus/cadastros-domiciliares")
async def esus_cadastros_domiciliares(pagina: int = Query(1), tamanho: int = Query(50)):
    return {
        "dados": [], "total": 0, "pagina": pagina, "tamanho": tamanho,
        "fonte": "indisponivel", "nota": "Conecte o e-SUS PEC para ver os cadastros de domicílios reais.",
        "verificado_em": _TS(),
    }

@router.get("/esus/acs")
async def esus_acs():
    return {"dados": [], "total": 0, "fonte": "indisponivel", "nota": _NOTA, "verificado_em": _TS()}

@router.get("/esus/territorios")
async def esus_territorios():
    return {"dados": [], "total": 0, "fonte": "indisponivel", "nota": _NOTA, "verificado_em": _TS()}

@router.get("/esus/tempo-real")
async def esus_tempo_real():
    return {
        "dados": {
            "online": False,
            "visitas_hoje": None,
            "atendimentos_hoje": None,
            "kpis_mes": None,
            "nota": _NOTA,
        },
        "verificado_em": _TS(),
    }


# ── Snapshot (bookmarklet eSUS PEC) ──────────────────────────────────────────

class SnapshotIn(BaseModel):
    dados: dict

@router.post("/esus/snapshot", status_code=201)
async def receber_snapshot(body: SnapshotIn):
    logger.info("Snapshot eSUS recebido: %s chaves", len(body.dados))
    return {"ok": True, "recebido_em": _TS()}
