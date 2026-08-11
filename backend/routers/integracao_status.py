"""
Router: /api/integracao/status
Diagnóstico unificado das integrações: SIAPS, e-Gestor APS, e-SUS PEC, CNES.
SISAB descontinuado — não incluído.

Env vars no Railway:
  SIAPS_CPF / SIAPS_SENHA       — credenciais gov.br da gestora (Rosangela)
  SIAPS_TOKEN                   — token Bearer já obtido (opcional)
  EGESTOR_USUARIO / EGESTOR_SENHA / EGESTOR_TOKEN
  ESUS_URL / ESUS_USUARIO / ESUS_SENHA   — PEC local (ex: http://pec.apui.am.gov.br:8080)
  RNDS_CLIENT_ID / RNDS_CLIENT_SECRET    — RNDS/FHIR (certificado ICP-Brasil)
"""
from __future__ import annotations
import asyncio
import logging
import time
from datetime import datetime
from typing import Any

import httpx
from fastapi import APIRouter, Depends

from routers.auth import get_current_user, UserOut
from services import siaps_service, esus_pec, cnes_service
from config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/integracao", tags=["Integrações"])

_IBGE = "1300144"
_CNES_SMS = "2206406"
_COMPETENCIA = "202605"

EGESTOR_BASE  = "https://egestorab.saude.gov.br/api"
APISIAPS      = "https://apisiaps.saude.gov.br"
RNDS_AUTH_URL = "https://ehr.saude.gov.br/api/oauth2/token"


# ── helpers ───────────────────────────────────────────────────────────────────

def _ts() -> str:
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


async def _ping(url: str, timeout: float = 6.0) -> tuple[bool, int | None]:
    """Testa conectividade básica com uma URL. Retorna (alcançável, status_code)."""
    try:
        async with httpx.AsyncClient(timeout=timeout, verify=False, follow_redirects=True) as c:
            r = await c.get(url, headers={"Accept": "application/json", "User-Agent": "ERSUS360/2.0"})
            return True, r.status_code
    except Exception:
        return False, None


# ── SIAPS ─────────────────────────────────────────────────────────────────────

async def _checar_siaps() -> dict:
    """Testa SIAPS: autenticação, API de vínculo, fallback."""
    t0 = time.time()

    credenciais_ok = bool(
        (settings.SIAPS_CPF or "").strip() and
        (settings.SIAPS_SENHA or "").strip()
    ) or bool((settings.SIAPS_TOKEN or "").strip())

    # Tenta autenticar
    autenticado = False
    if credenciais_ok:
        autenticado = await siaps_service._autenticar()

    # Testa API pública (sem auth)
    alcancavel, status_pub = await _ping(
        f"{APISIAPS}/api/public/componente/indicador-quadrimestre",
    )

    # Tenta buscar dados de vínculo (com auth em cascata)
    vinculo_dados = await siaps_service.buscar_vinculo(_COMPETENCIA)
    tem_dados_api = vinculo_dados is not None

    return {
        "sistema": "SIAPS / e-Gestor APS (Componentes de Cofinanciamento)",
        "url_base": APISIAPS,
        "credenciais_configuradas": credenciais_ok,
        "autenticado": autenticado,
        "api_publica_alcancavel": alcancavel,
        "api_publica_status_http": status_pub,
        "dados_vinculo_obtidos": tem_dados_api,
        "fonte": "siaps_api" if tem_dados_api else "siaps_referencia",
        "nota": (
            "Dados reais obtidos via API." if tem_dados_api
            else "API indisponível — usando referência Mai/2026. Configure SIAPS_CPF e SIAPS_SENHA no Railway."
        ),
        "tempo_ms": round((time.time() - t0) * 1000),
        "verificado_em": _ts(),
    }


# ── e-Gestor APS ──────────────────────────────────────────────────────────────

async def _checar_egestor() -> dict:
    """Testa e-Gestor APS: alcançabilidade e fetch de equipes."""
    t0 = time.time()

    egestor_user  = (getattr(settings, "EGESTOR_USUARIO", None) or "").strip()
    egestor_pass  = (getattr(settings, "EGESTOR_SENHA",   None) or "").strip()
    egestor_token = (getattr(settings, "EGESTOR_TOKEN",   None) or "").strip()
    credenciais_ok = bool(egestor_token or (egestor_user and egestor_pass))

    alcancavel, status = await _ping(f"{EGESTOR_BASE}/gestaoUsuarios/equipes?ibge={_IBGE}")

    equipes_data: Any = None
    if egestor_token:
        try:
            async with httpx.AsyncClient(timeout=10, verify=False) as c:
                r = await c.get(
                    f"{EGESTOR_BASE}/gestaoUsuarios/equipes",
                    headers={"Authorization": f"Bearer {egestor_token}", "Accept": "application/json"},
                    params={"ibge": _IBGE},
                )
                if r.status_code == 200:
                    equipes_data = r.json()
        except Exception as exc:
            logger.debug("e-Gestor equipes: %s", exc)

    # Tenta buscar INEs (dado chave para o Componente Vínculo)
    ines_encontrados: list[dict] = []
    if equipes_data:
        items = equipes_data if isinstance(equipes_data, list) else equipes_data.get("equipes", equipes_data.get("data", []))
        for eq in (items or []):
            if isinstance(eq, dict):
                ine = eq.get("ine") or eq.get("co_equipe") or eq.get("ineEquipe")
                nome = eq.get("nomeEquipe") or eq.get("nome") or eq.get("ds_equipe") or ""
                if ine:
                    ines_encontrados.append({"ine": str(ine), "equipe": nome.upper()})

    return {
        "sistema": "e-Gestor Atenção Básica",
        "url_base": EGESTOR_BASE,
        "ibge": _IBGE,
        "credenciais_configuradas": credenciais_ok,
        "api_alcancavel": alcancavel,
        "api_status_http": status,
        "equipes_retornadas": len(ines_encontrados) if ines_encontrados else None,
        "ines_obtidos": ines_encontrados if ines_encontrados else [],
        "nota": (
            f"{len(ines_encontrados)} equipes com INE obtidas via API." if ines_encontrados
            else "API não retornou INEs. Configure EGESTOR_TOKEN no Railway."
        ),
        "tempo_ms": round((time.time() - t0) * 1000),
        "verificado_em": _ts(),
    }


# ── e-SUS PEC ─────────────────────────────────────────────────────────────────

async def _checar_esus_pec() -> dict:
    """Testa conectividade com e-SUS PEC local e RNDS."""
    t0 = time.time()

    # PEC local
    status_pec = await esus_pec.status_pec()

    # RNDS
    rnds_client_id = (getattr(settings, "RNDS_CLIENT_ID", None) or "").strip()
    rnds_secret    = (getattr(settings, "RNDS_CLIENT_SECRET", None) or "").strip()
    rnds_ok        = False
    if rnds_client_id and rnds_secret:
        try:
            async with httpx.AsyncClient(timeout=10) as c:
                r = await c.post(
                    RNDS_AUTH_URL,
                    data={"grant_type": "client_credentials", "client_id": rnds_client_id, "client_secret": rnds_secret},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                rnds_ok = r.status_code == 200
        except Exception:
            pass

    return {
        "sistema": "e-SUS PEC / RNDS",
        "pec_local": {
            "url": status_pec.get("url", esus_pec.ESUS_URL),
            "conectado": status_pec.get("conectado"),
            "autenticado": status_pec.get("autenticado"),
            "versao": status_pec.get("versao"),
            "credenciais_configuradas": bool(esus_pec.ESUS_USUARIO and esus_pec.ESUS_SENHA),
            "nota": (
                "PEC local conectado." if status_pec.get("conectado")
                else "PEC local indisponível. Configure ESUS_URL, ESUS_USUARIO, ESUS_SENHA no Railway."
            ),
        },
        "rnds": {
            "alcancavel": rnds_ok,
            "credenciais_configuradas": bool(rnds_client_id and rnds_secret),
            "nota": (
                "Token RNDS obtido com sucesso." if rnds_ok
                else "RNDS indisponível. Configure RNDS_CLIENT_ID e RNDS_CLIENT_SECRET no Railway."
            ),
        },
        "tempo_ms": round((time.time() - t0) * 1000),
        "verificado_em": _ts(),
    }


# ── CNES ──────────────────────────────────────────────────────────────────────

async def _checar_cnes() -> dict:
    """Consulta CNES/DATASUS para estabelecimentos de Apuí/AM."""
    t0 = time.time()

    estabs = await cnes_service.buscar_estabelecimentos()
    fonte = "api" if any(e.get("fonte_confirmacao") is None for e in estabs) else "cnes_datasus_confirmado"
    # Detecta se veio da API ou do fallback
    if estabs and "fonte_confirmacao" in estabs[0]:
        fonte = "cnes_datasus_confirmado"
    else:
        fonte = "api_ou_fallback"

    cnes_com_rejeicao = [e for e in estabs if e.get("rejeicao_equipe_esf") is True]
    cnes_sem_rejeicao = [e for e in estabs if e.get("rejeicao_equipe_esf") is False]

    return {
        "sistema": "CNES / DATASUS",
        "ibge": _IBGE,
        "cnes_sms": _CNES_SMS,
        "total_estabelecimentos": len(estabs),
        "com_rejeicao_equipe_esf": len(cnes_com_rejeicao),
        "sem_rejeicao_equipe_esf": len(cnes_sem_rejeicao),
        "estabelecimentos": [
            {
                "cnes": e.get("cnes"),
                "nome": e.get("nome"),
                "rejeicao_esf": e.get("rejeicao_equipe_esf"),
                "equipes": e.get("equipes_esf", []),
                "observacao": e.get("observacao"),
            }
            for e in estabs
        ],
        "fonte": fonte,
        "nota": f"{len(estabs)} estabelecimentos de saúde identificados para Apuí/AM (IBGE {_IBGE}).",
        "tempo_ms": round((time.time() - t0) * 1000),
        "verificado_em": _ts(),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status")
async def status_integracoes(_: UserOut = Depends(get_current_user)):
    """
    Diagnóstico unificado: testa SIAPS, e-Gestor APS, e-SUS PEC e CNES em paralelo.
    SISAB foi descontinuado e não está incluído.
    """
    siaps_task   = asyncio.create_task(_checar_siaps())
    egestor_task = asyncio.create_task(_checar_egestor())
    esus_task    = asyncio.create_task(_checar_esus_pec())
    cnes_task    = asyncio.create_task(_checar_cnes())

    siaps_r, egestor_r, esus_r, cnes_r = await asyncio.gather(
        siaps_task, egestor_task, esus_task, cnes_task,
        return_exceptions=True,
    )

    def _safe(r: Any, sistema: str) -> dict:
        if isinstance(r, Exception):
            return {"sistema": sistema, "erro": str(r), "verificado_em": _ts()}
        return r

    integracoes = {
        "siaps":      _safe(siaps_r,   "SIAPS"),
        "egestor":    _safe(egestor_r, "e-Gestor APS"),
        "esus_pec":   _safe(esus_r,    "e-SUS PEC / RNDS"),
        "cnes":       _safe(cnes_r,    "CNES / DATASUS"),
    }

    sistemas_ok = sum(
        1 for s in integracoes.values()
        if s.get("autenticado") or s.get("api_alcancavel") or
           s.get("dados_vinculo_obtidos") or s.get("total_estabelecimentos")
    )

    return {
        "municipio": "Apuí/AM",
        "ibge": _IBGE,
        "cnes_sms": _CNES_SMS,
        "competencia_referencia": "Mai/2026",
        "sisab": "DESCONTINUADO — não incluído",
        "sistemas_ok": sistemas_ok,
        "total_sistemas": 4,
        "integracoes": integracoes,
        "verificado_em": _ts(),
    }


@router.get("/cnes/estabelecimentos")
async def estabelecimentos_cnes(_: UserOut = Depends(get_current_user)):
    """Lista os estabelecimentos de saúde de Apuí/AM do CNES/DATASUS."""
    return await _checar_cnes()


@router.get("/egestor/ines")
async def ines_equipes(_: UserOut = Depends(get_current_user)):
    """
    Busca INEs (Identificadores Nacionais de Equipes) das equipes ESF de Apuí/AM
    no e-Gestor APS. Requer EGESTOR_TOKEN configurado no Railway.
    """
    return await _checar_egestor()


@router.get("/siaps/vinculo")
async def vinculo_siaps(
    competencia: str = "202605",
    _: UserOut = Depends(get_current_user),
):
    """
    Busca dados do Componente Vínculo e Acompanhamento Territorial diretamente
    do SIAPS via cascata de autenticação. Requer SIAPS_CPF + SIAPS_SENHA no Railway.
    """
    t0 = time.time()
    dados = await siaps_service.buscar_vinculo(competencia)
    return {
        "competencia": competencia,
        "dados_api": dados,
        "fonte": "siaps_api" if dados else "indisponivel",
        "nota": "Use /api/siaps/vinculo-acompanhamento para o endpoint completo com fallback.",
        "tempo_ms": round((time.time() - t0) * 1000),
        "verificado_em": _ts(),
    }
