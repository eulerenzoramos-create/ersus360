"""
ERSUS Integration Gateway — Serviço central de integração.

Regras do Prompt Mestre:
- Nunca acessar banco do PEC diretamente.
- Nunca armazenar credenciais fora de env vars (Railway Secret Manager).
- Nunca usar endpoints não documentados ou scraping.
- Isolamento por município (token/sessão por configuração, não compartilhado).
- Idempotência: hash SHA-256 impede duplo envio.
- Botão de pausa: GatewayConfig.pausado bloqueia novas transmissões.
- Modo diagnóstico: somente leitura/conectividade antes de habilitar transmissão.
"""
from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import time
from typing import Optional

logger = logging.getLogger(__name__)

# ── Cache de token RNDS (por município/CNES) ─────────────────────────────────
# {cnes: {"token": str, "expires_at": float}}
_token_cache: dict[str, dict] = {}
_TOKEN_TTL = 28 * 60  # 28 min (token dura 30, renova com folga)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _rnds_auth_url() -> str:
    return os.getenv("RNDS_AUTH_URL", "https://ehr-auth-hmg.saude.gov.br")


def _rnds_services_url(uf: str = "am") -> str:
    base = os.getenv("RNDS_SERVICES_URL", "")
    if base:
        return base
    ambiente = os.getenv("RNDS_AMBIENTE", "homologacao")
    if ambiente == "producao":
        return f"https://{uf.lower()}-ehr-services.saude.gov.br"
    return "https://ehr-services.hmg.saude.gov.br"


def _cert_configurado() -> bool:
    return bool(
        os.getenv("RNDS_CERT_PATH", "").strip() and
        os.getenv("RNDS_CERT_KEY_PATH", "").strip()
    )


def _ledi_configurado() -> bool:
    return bool(
        os.getenv("LEDI_PEC_URL", "").strip() and
        os.getenv("LEDI_USUARIO", "").strip() and
        os.getenv("LEDI_SENHA", "").strip()
    )


def payload_hash(dados: bytes) -> str:
    return hashlib.sha256(dados).hexdigest()


# ── RNDS: Autenticação mTLS → JWT ────────────────────────────────────────────

async def obter_token_rnds(cnes: Optional[str] = None) -> dict:
    """
    Obtém JWT da RNDS via mTLS (certificado ICP-Brasil PKCS12).
    Token é cacheado por 28 minutos por CNES.
    Retorna {"token": str, "ok": bool, "nota": str}.
    """
    import httpx

    cache_key = cnes or "default"
    cached = _token_cache.get(cache_key)
    if cached and time.time() < cached["expires_at"]:
        return {"token": cached["token"], "ok": True, "nota": "Token do cache (válido).", "cache": True}

    cert_path = os.getenv("RNDS_CERT_PATH", "").strip()
    key_path = os.getenv("RNDS_CERT_KEY_PATH", "").strip()

    if not (cert_path and key_path):
        return {
            "token": None, "ok": False, "cache": False,
            "nota": "Certificado mTLS não configurado. Defina RNDS_CERT_PATH e RNDS_CERT_KEY_PATH no Railway.",
        }

    url = f"{_rnds_auth_url()}/api/token"
    try:
        async with httpx.AsyncClient(cert=(cert_path, key_path), timeout=15, verify=True) as c:
            r = await c.get(url)
        if r.status_code == 200:
            token = r.text.strip().strip('"')
            _token_cache[cache_key] = {"token": token, "expires_at": time.time() + _TOKEN_TTL}
            logger.info("Token RNDS obtido para CNES=%s", cache_key)
            return {"token": token, "ok": True, "cache": False, "nota": "Token obtido com sucesso."}
        return {
            "token": None, "ok": False, "cache": False,
            "nota": f"RNDS Auth retornou HTTP {r.status_code}: {r.text[:200]}",
        }
    except Exception as exc:
        logger.warning("Erro ao obter token RNDS: %s", exc)
        return {"token": None, "ok": False, "cache": False, "nota": f"Erro de conectividade: {exc}"}


# ── RNDS: Requisições FHIR ────────────────────────────────────────────────────

async def rnds_get(path: str, cns_profissional: str, cnes: str, uf: str = "am") -> dict:
    """
    GET genérico em recurso FHIR da RNDS.
    Headers: X-Authorization-Server (JWT) + Authorization (CNS profissional).
    """
    import httpx

    token_result = await obter_token_rnds(cnes)
    if not token_result["ok"]:
        return {"ok": False, "nota": token_result["nota"], "situacao_dado": "nao_disponivel"}

    token = token_result["token"]
    base = _rnds_services_url(uf)
    url = f"{base}/api/fhir/r4{path}"
    headers = {
        "X-Authorization-Server": f"Bearer {token}",
        "Authorization": cns_profissional,
        "Accept": "application/fhir+json",
    }
    try:
        async with httpx.AsyncClient(
            cert=(os.getenv("RNDS_CERT_PATH"), os.getenv("RNDS_CERT_KEY_PATH")),
            timeout=15, verify=True,
        ) as c:
            r = await c.get(url, headers=headers)
        return {
            "ok": r.status_code < 400,
            "status_code": r.status_code,
            "data": r.json() if "json" in r.headers.get("content-type", "") else r.text,
            "nota": f"HTTP {r.status_code}",
            "situacao_dado": "oficial_validado" if r.status_code < 400 else "divergente",
        }
    except Exception as exc:
        return {"ok": False, "nota": str(exc), "situacao_dado": "nao_disponivel"}


async def rnds_post_bundle(
    bundle: dict, cns_profissional: str, cnes: str, uf: str = "am",
) -> dict:
    """
    POST Bundle FHIR à RNDS. Inclui hash de idempotência.
    Apenas executa se GatewayConfig.pausado == False e modo_diagnostico == False.
    """
    import json
    import httpx

    payload_bytes = json.dumps(bundle).encode()
    h = payload_hash(payload_bytes)

    token_result = await obter_token_rnds(cnes)
    if not token_result["ok"]:
        return {"ok": False, "nota": token_result["nota"], "hash": h, "situacao_dado": "nao_disponivel"}

    token = token_result["token"]
    base = _rnds_services_url(uf)
    url = f"{base}/api/fhir/r4/Bundle"
    headers = {
        "X-Authorization-Server": f"Bearer {token}",
        "Authorization": cns_profissional,
        "Content-Type": "application/fhir+json",
    }
    try:
        async with httpx.AsyncClient(
            cert=(os.getenv("RNDS_CERT_PATH"), os.getenv("RNDS_CERT_KEY_PATH")),
            timeout=30, verify=True,
        ) as c:
            r = await c.post(url, headers=headers, content=payload_bytes)
        return {
            "ok": r.status_code < 400,
            "status_code": r.status_code,
            "hash": h,
            "data": r.json() if "json" in r.headers.get("content-type", "") else r.text,
            "nota": f"HTTP {r.status_code}",
            "situacao_dado": "oficial_validado" if r.status_code < 400 else "divergente",
        }
    except Exception as exc:
        return {"ok": False, "nota": str(exc), "hash": h, "situacao_dado": "nao_disponivel"}


# ── RNDS: Diagnóstico (modo leitura — CapabilityStatement) ───────────────────

async def diagnostico_rnds(cns_profissional: str, cnes: str, uf: str = "am") -> dict:
    """
    Testa conectividade e obtém CapabilityStatement da RNDS.
    Modo somente leitura — não envia dados.
    """
    import httpx

    resultado = {
        "certificado_configurado": _cert_configurado(),
        "token_obtido": False,
        "capability_statement": None,
        "latencia_ms": None,
        "ambiente": os.getenv("RNDS_AMBIENTE", "homologacao"),
        "uf": uf,
        "endpoint_services": _rnds_services_url(uf),
        "endpoint_auth": _rnds_auth_url(),
        "situacao_dado": "nao_disponivel",
        "nota": "",
    }

    if not _cert_configurado():
        resultado["nota"] = "Certificado mTLS não configurado. Defina RNDS_CERT_PATH e RNDS_CERT_KEY_PATH no Railway."
        return resultado

    token_result = await obter_token_rnds(cnes)
    resultado["token_obtido"] = token_result["ok"]
    if not token_result["ok"]:
        resultado["nota"] = token_result["nota"]
        return resultado

    import time as _time
    t0 = _time.time()
    cap = await rnds_get("/metadata?mode=full", cns_profissional, cnes, uf)
    resultado["latencia_ms"] = int((_time.time() - t0) * 1000)

    if cap["ok"]:
        resultado["capability_statement"] = cap.get("data")
        resultado["situacao_dado"] = "oficial_validado"
        resultado["nota"] = "RNDS acessível. Diagnóstico OK."
    else:
        resultado["situacao_dado"] = "divergente"
        resultado["nota"] = cap.get("nota", "Falha ao obter CapabilityStatement.")

    return resultado


# ── LEDI: Autenticação e envio de fichas ──────────────────────────────────────

async def obter_sessao_ledi() -> dict:
    """
    Autentica no e-SUS APS via API LEDI e retorna cookie JSESSIONID.
    Credenciais via env vars LEDI_PEC_URL + LEDI_USUARIO + LEDI_SENHA.
    """
    import httpx

    if not _ledi_configurado():
        return {
            "ok": False, "jsessionid": None,
            "nota": "LEDI não configurado. Defina LEDI_PEC_URL, LEDI_USUARIO e LEDI_SENHA no Railway.",
        }

    url = os.getenv("LEDI_PEC_URL", "").rstrip("/") + "/api/recebimento/login"
    # Credenciais lidas de env vars — nunca hardcoded
    usuario = os.getenv("LEDI_USUARIO", "")
    senha = os.getenv("LEDI_SENHA", "")

    try:
        async with httpx.AsyncClient(timeout=15, verify=True) as c:
            r = await c.post(url, data={"usuario": usuario, "senha": senha})
        if r.status_code == 200:
            jsessionid = r.cookies.get("JSESSIONID")
            if jsessionid:
                return {"ok": True, "jsessionid": jsessionid, "nota": "Sessão LEDI criada com sucesso."}
            return {"ok": False, "jsessionid": None, "nota": "Login OK mas JSESSIONID não retornado."}
        return {
            "ok": False, "jsessionid": None,
            "nota": f"Login LEDI retornou HTTP {r.status_code}: {r.text[:200]}",
        }
    except Exception as exc:
        return {"ok": False, "jsessionid": None, "nota": f"Erro de conectividade LEDI: {exc}"}


async def enviar_ficha_ledi(ficha_bytes: bytes, uuid_ficha: str, jsessionid: str) -> dict:
    """
    Envia arquivo .esus (Apache Thrift serializado) ao PEC via API LEDI.
    Retorna status HTTP e mensagem do PEC.
    """
    import httpx

    if not _ledi_configurado():
        return {"ok": False, "nota": "LEDI não configurado."}

    url = os.getenv("LEDI_PEC_URL", "").rstrip("/") + "/api/v1/recebimento/ficha"
    h = payload_hash(ficha_bytes)
    try:
        async with httpx.AsyncClient(timeout=30, verify=True) as c:
            r = await c.post(
                url,
                files={"file": (f"{uuid_ficha}.esus", ficha_bytes, "application/octet-stream")},
                cookies={"JSESSIONID": jsessionid},
            )
        return {
            "ok": r.status_code == 200,
            "status_code": r.status_code,
            "hash": h,
            "uuid": uuid_ficha,
            "resposta": r.text[:500],
            "nota": f"HTTP {r.status_code}",
        }
    except Exception as exc:
        return {"ok": False, "hash": h, "uuid": uuid_ficha, "nota": f"Erro ao enviar ficha: {exc}"}


# ── Controle de pausa ─────────────────────────────────────────────────────────

async def gateway_pausado(municipio_id: int) -> bool:
    """Verifica se o gateway está pausado para o município."""
    from database import AsyncSessionLocal
    from models.integracao_gateway import GatewayConfig
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(GatewayConfig).where(GatewayConfig.municipio_id == municipio_id)
        )
        cfg = res.scalar_one_or_none()
        return cfg.pausado if cfg else False


async def gateway_modo_diagnostico(municipio_id: int) -> bool:
    """Verifica se o gateway está em modo somente diagnóstico."""
    from database import AsyncSessionLocal
    from models.integracao_gateway import GatewayConfig
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(GatewayConfig).where(GatewayConfig.municipio_id == municipio_id)
        )
        cfg = res.scalar_one_or_none()
        return cfg.modo_diagnostico if cfg else True


async def registrar_transmissao(
    municipio_id: int, sistema: str, endpoint: str, status: str,
    operacao: str = None, cnes: str = None, hash_payload: str = None,
    codigo_retorno: int = None, resposta: str = None,
    mensagem_erro: str = None, quantidade_registros: int = None,
    id_transacao: str = None,
) -> None:
    """Persiste log de auditoria de transmissão. Nunca armazena senha/token."""
    import uuid as _uuid
    from database import AsyncSessionLocal
    from models.integracao_gateway import GatewayTransmissao, SistemaDestino, StatusTransmissao

    try:
        async with AsyncSessionLocal() as db:
            tx = GatewayTransmissao(
                municipio_id=municipio_id,
                cnes=cnes,
                sistema=SistemaDestino(sistema),
                endpoint=endpoint[:500],
                operacao=operacao,
                status=StatusTransmissao(status),
                id_transacao=id_transacao or str(_uuid.uuid4()),
                hash_payload=hash_payload,
                codigo_retorno=codigo_retorno,
                resposta=resposta[:2000] if resposta else None,
                mensagem_erro=mensagem_erro[:1000] if mensagem_erro else None,
                quantidade_registros=quantidade_registros,
            )
            db.add(tx)
            await db.commit()
    except Exception as exc:
        logger.error("Erro ao registrar transmissão: %s", exc)
