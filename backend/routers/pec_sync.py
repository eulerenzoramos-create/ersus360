"""
ERSUS360 — Receptor de Sincronização do e-SUS PEC
Recebe dados C1–C7 do agente local instalado no servidor do PEC.
"""
import json
import os
import secrets
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/pec", tags=["pec-sync"])

# Chave de autenticação — gerada e armazenada como env var ERSUS_SYNC_KEY
def _get_sync_key() -> str:
    key = os.getenv("ERSUS_SYNC_KEY", "")
    if not key:
        # Gera uma chave padrão na primeira execução e loga para o admin copiar
        key = "ersus-" + secrets.token_hex(16)
        log.warning("ERSUS_SYNC_KEY não definida. Use esta chave: %s", key)
    return key


# ── Modelos ──────────────────────────────────────────────────────────────────

class SyncPayload(BaseModel):
    competencia: str          # "YYYY-MM"
    ibge: str                 # "1300144"
    timestamp: str
    equipes: Dict[str, Dict[str, float]]        # {"CACHOEIRA": {"C1": 78.5, ...}}
    tipos_equipe: Optional[Dict[str, str]] = {} # {"CACHOEIRA": "eSF", "RIO NEGRO": "eSFR"}


class IndicadoresResponse(BaseModel):
    competencia: str
    equipes: Dict[str, Dict[str, float]]
    tipos_equipe: Optional[Dict[str, str]] = {}
    ultima_atualizacao: Optional[str] = None
    fonte: str = "e-SUS PEC"


# ── Armazenamento em arquivo JSON (cache local no Railway) ───────────────────
# Railway não tem disco persistente entre deploys, mas dados são recebidos
# periodicamente do agente — aceitável para uso intraday.
_CACHE_DIR = Path("/tmp/ersus_pec_cache")
_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _cache_path(competencia: str) -> Path:
    return _CACHE_DIR / f"indicadores_{competencia.replace('-','')}.json"


def _salvar_cache(competencia: str, data: dict):
    with open(_cache_path(competencia), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def _ler_cache(competencia: str) -> Optional[dict]:
    p = _cache_path(competencia)
    if p.exists():
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    return None


def _listar_competencias() -> list[str]:
    comps = []
    for f in _CACHE_DIR.glob("indicadores_*.json"):
        name = f.stem.replace("indicadores_", "")
        if len(name) == 6:
            comps.append(f"{name[:4]}-{name[4:]}")
    return sorted(comps, reverse=True)


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/sync")
async def receber_sync(
    payload: SyncPayload,
    x_sync_key: str = Header(..., alias="X-Sync-Key"),
):
    """Recebe dados do agente local do PEC e armazena em cache."""
    if x_sync_key != _get_sync_key():
        raise HTTPException(status_code=401, detail="Chave de sincronização inválida.")

    if payload.ibge != "1300144":
        raise HTTPException(status_code=400, detail="IBGE não corresponde a Apuí/AM.")

    registro = {
        "competencia": payload.competencia,
        "equipes": payload.equipes,
        "tipos_equipe": payload.tipos_equipe or {},
        "ultima_atualizacao": datetime.utcnow().isoformat(),
        "fonte": "e-SUS PEC",
    }
    _salvar_cache(payload.competencia, registro)
    log.info(
        "Sync recebido: competencia=%s equipes=%d",
        payload.competencia,
        len(payload.equipes),
    )
    return {
        "status": "ok",
        "competencia": payload.competencia,
        "equipes_recebidas": len(payload.equipes),
    }


@router.get("/indicadores/{competencia}", response_model=IndicadoresResponse)
async def get_indicadores(competencia: str):
    """Retorna indicadores C1–C7 por equipe para a competência solicitada."""
    data = _ler_cache(competencia)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"Dados não disponíveis para {competencia}. "
                   "Aguarde próxima sincronização do agente PEC.",
        )
    return IndicadoresResponse(**data)


@router.get("/competencias")
async def listar_competencias():
    """Lista as competências com dados disponíveis."""
    return {"competencias": _listar_competencias()}


@router.get("/status")
async def status_sync():
    """Status da última sincronização e chave de configuração."""
    comps = _listar_competencias()
    ultima = None
    if comps:
        data = _ler_cache(comps[0])
        if data:
            ultima = data.get("ultima_atualizacao")

    # Exibe a chave para o admin configurar no agente (apenas se não estiver definida)
    chave_info = "Definida via env var ERSUS_SYNC_KEY" if os.getenv("ERSUS_SYNC_KEY") else _get_sync_key()

    return {
        "status": "ativo",
        "competencias_disponiveis": comps,
        "ultima_atualizacao": ultima,
        "sync_key_info": chave_info,
        "agente_url": "https://github.com/eulerenzoramos-create/ersus360 — pasta pec_sync_agent/",
    }
