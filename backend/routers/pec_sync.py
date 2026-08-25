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
from typing import Dict, List, Optional

from fastapi import APIRouter, Header, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/pec", tags=["pec-sync"])

# Metas oficiais Portaria GM/MS 3.493/2024
_META: Dict[str, float] = {
    "C1": 75.0, "C2": 75.0, "C3": 70.0,
    "C4": 50.0, "C5": 50.0, "C6": 60.0, "C7": 40.0,
}
_DESC: Dict[str, str] = {
    "C1": "Mais Acesso", "C2": "Desenvolvimento Infantil", "C3": "Gestação e Puerpério",
    "C4": "Diabetes Mellitus", "C5": "Hipertensão Arterial",
    "C6": "Pessoa Idosa", "C7": "Prevenção Câncer Colo",
}
_ALERTAS_PATH = Path("/tmp/ersus_pec_cache/alertas_aps.json")


def _gerar_alertas_aps(equipes: Dict[str, Dict[str, float]], competencia: str) -> List[dict]:
    alertas = []
    for equipe, inds in equipes.items():
        for ind, valor in inds.items():
            meta = _META.get(ind)
            if meta is None:
                continue
            gap = meta - valor
            if gap <= 0:
                continue
            nivel = "CRITICO" if gap >= 20 else "AVISO"
            alertas.append({
                "id": f"pec_{competencia}_{equipe}_{ind}",
                "nivel": nivel,
                "modulo": "APS",
                "categoria": f"{ind} — {_DESC.get(ind, ind)}",
                "titulo": f"{ind} abaixo da meta — Equipe {equipe}",
                "mensagem": (
                    f"Equipe {equipe}: {ind} ({_DESC.get(ind,'')}) atingiu "
                    f"{valor:.1f}% contra meta de {meta:.0f}% "
                    f"(gap {gap:.1f}pp). Competência {competencia}."
                ),
                "ts": datetime.utcnow().isoformat(),
                "lido": False,
            })
    # Persiste alertas
    existentes = []
    if _ALERTAS_PATH.exists():
        try:
            existentes = json.loads(_ALERTAS_PATH.read_text(encoding="utf-8"))
        except Exception:
            existentes = []
    ids_novos = {a["id"] for a in alertas}
    mantidos = [a for a in existentes if a["id"] not in ids_novos]
    todos = (alertas + mantidos)[:200]
    _ALERTAS_PATH.write_text(json.dumps(todos, ensure_ascii=False), encoding="utf-8")
    return alertas

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


# ── Referência municipal — Apuí/AM (derivado de scores SIAPS Q2/2026) ────────
# eSF C2-C7: C2=DTP(ind3), C3=avg(ind1,ind4), C4=DM(ind9), C5=HAS(ind8), C7=cito(ind2)
# eSB B1-B2: B1=1ªConsulta(ind5), B2=TratamentoComp(ind6)
# eSFR R2-R6: mesmos critérios C2-C7 aplicados à equipe ribeirinha
# Fonte: SIAPS — competência Mai/2026. C1/C6/B3/B4/M1/M2 indisponíveis sem agente PEC.
_REF_INDICADORES: Dict[str, Dict[str, float]] = {
    "CACHOEIRA":     {"C2":88.0,"C3":88.0,"C4":63.0,"C5":79.0,"C7":43.0, "B1":39.0,"B2":30.0},
    "SÃO SEBASTIÃO": {"C2":82.0,"C3":84.5,"C4":58.0,"C5":75.0,"C7":41.0, "B1":37.0,"B2":29.0},
    "ACARI":         {"C2":80.0,"C3":84.5,"C4":60.0,"C5":77.0,"C7":40.0, "B1":37.0,"B2":29.0},
    "TRÊS ESTADOS":  {"C2":63.0,"C3":61.5,"C4":46.0,"C5":58.0,"C7":28.0, "B1":25.0,"B2":18.0},
    "JUMA":          {"C2":85.0,"C3":89.5,"C4":64.0,"C5":81.0,"C7":45.0, "B1":39.0,"B2":31.0},
    "LIBERDADE":     {"C2":91.0,"C3":95.5,"C4":71.0,"C5":85.0,"C7":52.0, "B1":46.0,"B2":39.0},
    "KENNEDY":       {"C2":76.0,"C3":76.0,"C4":68.0,"C5":82.0,"C7":40.0, "B1":50.0,"B2":46.0},
    "JK":            {"C2":86.0,"C3":86.5,"C4":62.0,"C5":78.0,"C7":43.0, "B1":38.0,"B2":30.0},
    # ESTRADA NOVA = eSFR; R-codes espelham C-codes para equipes ribeirinhas
    "ESTRADA NOVA":  {"C2":55.0,"C3":50.5,"C4":36.0,"C5":49.0,"C7":20.0,
                      "R2":55.0,"R3":50.5,"R4":36.0,"R5":49.0,"R6":20.0,
                      "B1":21.0,"B2":15.0},
}
_REF_TIPOS_EQUIPE: Dict[str, str] = {
    "CACHOEIRA": "eSF", "SÃO SEBASTIÃO": "eSF", "ACARI": "eSF",
    "TRÊS ESTADOS": "eSF", "JUMA": "eSF", "LIBERDADE": "eSF",
    "KENNEDY": "eSF", "JK": "eSF", "ESTRADA NOVA": "eSFR",
}


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
    alertas = _gerar_alertas_aps(payload.equipes, payload.competencia)
    log.info(
        "Sync recebido: competencia=%s equipes=%d alertas_gerados=%d",
        payload.competencia, len(payload.equipes), len(alertas),
    )
    return {
        "status": "ok",
        "competencia": payload.competencia,
        "equipes_recebidas": len(payload.equipes),
        "alertas_gerados": len(alertas),
    }


@router.get("/indicadores/{competencia}", response_model=IndicadoresResponse)
async def get_indicadores(competencia: str):
    """Retorna indicadores C1–C7 por equipe para a competência solicitada.
    Quando não há dados do agente PEC, retorna referência SIAPS municipal."""
    data = _ler_cache(competencia)
    if data:
        return IndicadoresResponse(**data)
    # Fallback: referência derivada de scores SIAPS — C1 e C6 indisponíveis sem PEC
    return IndicadoresResponse(
        competencia=competencia,
        equipes=_REF_INDICADORES,
        tipos_equipe=_REF_TIPOS_EQUIPE,
        ultima_atualizacao=None,
        fonte="SIAPS — Referência municipal (C1/C6 indisponíveis sem agente PEC)",
    )


@router.get("/competencias")
async def listar_competencias():
    """Lista as competências com dados disponíveis."""
    return {"competencias": _listar_competencias()}


@router.get("/alertas")
async def listar_alertas_aps(apenas_nao_lidos: bool = False):
    """Retorna alertas APS gerados na última sincronização PEC."""
    alertas = []
    if _ALERTAS_PATH.exists():
        try:
            alertas = json.loads(_ALERTAS_PATH.read_text(encoding="utf-8"))
        except Exception:
            alertas = []
    if apenas_nao_lidos:
        alertas = [a for a in alertas if not a.get("lido")]
    return {"total": len(alertas), "alertas": alertas}


@router.post("/alertas/{alerta_id}/lido")
async def marcar_alerta_lido(alerta_id: str):
    """Marca um alerta APS como lido."""
    alertas = []
    if _ALERTAS_PATH.exists():
        try:
            alertas = json.loads(_ALERTAS_PATH.read_text(encoding="utf-8"))
        except Exception:
            alertas = []
    for a in alertas:
        if a["id"] == alerta_id:
            a["lido"] = True
    _ALERTAS_PATH.write_text(json.dumps(alertas, ensure_ascii=False), encoding="utf-8")
    return {"status": "ok"}


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
