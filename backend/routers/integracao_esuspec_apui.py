"""
Integração e-SUS PEC / RNDS (Rede Nacional de Dados em Saúde)
Env vars (Railway):
  RNDS_CLIENT_ID      — client_id OAuth2 (DATASUS)
  RNDS_CLIENT_SECRET  — client_secret
  RNDS_CERT_B64       — certificado .pfx em base64 (ICP-Brasil)
  RNDS_CERT_PASSWORD  — senha do certificado
CNES Apuí: 2206406  |  IBGE: 1300144
API indisponível → nao_disponivel. Nunca atendimentos, prescrições ou doses inventadas.
"""
import os
from datetime import datetime
from typing import Optional
import httpx
from fastapi import APIRouter
from services.cache_service import cache_get, cache_set

router = APIRouter(prefix="/api/integracao-esuspec-apui", tags=["Integração e-SUS PEC"])

IBGE_APUI    = "1300144"
CNES_APUI    = "2206406"
CLIENT_ID    = os.getenv("RNDS_CLIENT_ID", "")
CLIENT_SEC   = os.getenv("RNDS_CLIENT_SECRET", "")
CERT_B64     = os.getenv("RNDS_CERT_B64", "")
CERT_PASS    = os.getenv("RNDS_CERT_PASSWORD", "")
ESUS_BASE    = "https://ehr.saude.gov.br/api/fhir/r4"
TIMEOUT      = 12.0

_NAO_DISP = {
    "situacao_dado": "nao_disponivel",
    "dados": None,
    "nota": "Dados requerem integração com RNDS/e-SUS PEC. Configure RNDS_CLIENT_ID e RNDS_CLIENT_SECRET no Railway. Nenhum valor inventado.",
}

_rnds_token: Optional[str] = None
_rnds_token_exp: float = 0.0

def _ts():
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

async def _get_rnds_token() -> Optional[str]:
    import time
    global _rnds_token, _rnds_token_exp
    if _rnds_token and time.time() < _rnds_token_exp:
        return _rnds_token
    if not (CLIENT_ID and CLIENT_SEC):
        return None
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            r = await client.post(
                "https://ehr.saude.gov.br/api/oauth2/token",
                data={"grant_type": "client_credentials", "client_id": CLIENT_ID, "client_secret": CLIENT_SEC},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            r.raise_for_status()
            j = r.json()
            _rnds_token = j.get("access_token")
            _rnds_token_exp = time.time() + j.get("expires_in", 3600) - 60
            return _rnds_token
    except Exception:
        return None

async def _rnds_get(path: str, cache_key: str, params: dict = {}):
    cached = cache_get(cache_key)
    if cached:
        return cached
    token = await _get_rnds_token()
    if not token:
        return {**_NAO_DISP, "ultima_atualizacao": _ts()}
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(f"{ESUS_BASE}{path}", headers={"Authorization": f"Bearer {token}"}, params=params)
        r.raise_for_status()
        data = r.json()
        result = {"situacao_dado": "oficial_validado", "fonte": "api", "ultima_atualizacao": _ts(), "dados": data}
        cache_set(cache_key, result, ttl=900)
        return result


@router.get("/status")
async def status():
    return {
        "sistema": "e-SUS PEC / RNDS (Rede Nacional de Dados em Saúde)",
        "ibge": IBGE_APUI,
        "cnes": CNES_APUI,
        "env_vars_necessarias": ["RNDS_CLIENT_ID", "RNDS_CLIENT_SECRET", "RNDS_CERT_B64", "RNDS_CERT_PASSWORD"],
        "env_vars_ok": {
            "RNDS_CLIENT_ID":     bool(CLIENT_ID),
            "RNDS_CLIENT_SECRET": bool(CLIENT_SEC),
            "RNDS_CERT_B64":      bool(CERT_B64),
            "RNDS_CERT_PASSWORD": bool(CERT_PASS),
        },
        "credenciais_configuradas": bool(CLIENT_ID and CLIENT_SEC),
        "cache_ttl_minutos": 15,
        "ultima_verificacao": _ts(),
    }


@router.get("/atendimentos")
async def atendimentos():
    try:
        return await _rnds_get(
            f"/Encounter?_count=50&organization.identifier=urn:oid:2.16.840.1.113883.13.36|{CNES_APUI}",
            "rnds_atendimentos",
        )
    except Exception as e:
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/prescricoes")
async def prescricoes():
    try:
        return await _rnds_get(
            f"/MedicationRequest?_count=50&requester.organization={CNES_APUI}",
            "rnds_prescricoes",
        )
    except Exception as e:
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/vacinacao")
async def vacinacao():
    try:
        return await _rnds_get(
            f"/Immunization?_count=100&location.identifier=urn:oid:2.16.840.1.113883.13.36|{CNES_APUI}",
            "rnds_vacinacao",
        )
    except Exception as e:
        return {**_NAO_DISP, "erro": str(e), "ultima_atualizacao": _ts()}


@router.get("/dashboard")
async def dashboard():
    try:
        token = await _get_rnds_token()
        status_rnds = "online" if token else "offline"
    except Exception:
        status_rnds = "offline"

    return {
        "situacao_dado": "oficial_validado" if status_rnds == "online" else "nao_disponivel",
        "fonte": "api" if status_rnds == "online" else "sem_dados",
        "ultima_atualizacao": _ts(),
        "municipio": "Apuí/AM",
        "ibge": IBGE_APUI,
        "cnes": CNES_APUI,
        "rnds_status": status_rnds,
        "credenciais_ok": bool(CLIENT_ID and CLIENT_SEC),
        "dados": None,
        "nota": None if status_rnds == "online" else "Configure RNDS_CLIENT_ID e RNDS_CLIENT_SECRET no Railway.",
    }
