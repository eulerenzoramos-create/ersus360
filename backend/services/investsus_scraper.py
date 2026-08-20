"""
InvestSUS Scraper — autenticação SCPA via HTTP REST + API InvestSUS.

Fluxo (sem Playwright — Railway não alcança acesso.saude.gov.br via browser):
  1. POST HTTP para o endpoint SCPA de autenticação
  2. Usa JWT/cookie retornado para chamar investsus-backend-prd.saude.gov.br/api
  3. Retorna propostas, repasses e saldos do município

Env vars necessários (Railway):
  INVESTSUS_CPF   — CPF do usuário SCPA (só números)
  INVESTSUS_SENHA — Senha do usuário no SCPA
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_BACKEND_URL = "https://investsus-backend-prd.saude.gov.br/api"
_CNPJ_APUI   = "12834320000126"

# Candidatos de endpoint SCPA (tentados em ordem)
_SCPA_AUTH_URLS = [
    "https://scpa.saude.gov.br/api/autenticacao/v1/login",
    "https://acesso.saude.gov.br/api/autenticacao/v1/login",
    "https://acesso.saude.gov.br/api/login",
    "https://acesso.saude.gov.br/login",
]

_HEADERS_BASE = {
    "Accept":          "application/json, text/plain, */*",
    "Content-Type":    "application/json",
    "Origin":          "https://investsus.saude.gov.br",
    "Referer":         "https://investsus.saude.gov.br/",
    "User-Agent":      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
}


def _credenciais() -> tuple[str, str]:
    cpf   = os.getenv("INVESTSUS_CPF", "")
    senha = os.getenv("INVESTSUS_SENHA", "")
    if not cpf or not senha:
        raise RuntimeError(
            "INVESTSUS_CPF e INVESTSUS_SENHA não configurados. "
            "Adicione as variáveis de ambiente no Railway."
        )
    return cpf.replace(".", "").replace("-", ""), senha


async def _tentar_auth_scpa(client: httpx.AsyncClient, cpf: str, senha: str) -> dict | None:
    """
    Tenta autenticar no SCPA via múltiplos endpoints REST.
    Retorna dict com token/cookies ou None se todos falharem.
    """
    payload_json  = {"cpf": cpf, "senha": senha}
    payload_form  = {"username": cpf, "password": senha, "cpf": cpf, "senha": senha}

    for url in _SCPA_AUTH_URLS:
        # Tenta POST JSON
        try:
            resp = await client.post(url, json=payload_json, timeout=20.0)
            if resp.status_code in (200, 201):
                data = resp.json()
                token = (data.get("token") or data.get("access_token")
                         or data.get("accessToken") or data.get("jwt"))
                if token:
                    logger.info("SCPA auth OK via JSON POST → %s", url)
                    return {"token": token, "cookies": dict(resp.cookies)}
        except Exception as exc:
            logger.debug("SCPA JSON POST %s falhou: %s", url, exc)

        # Tenta POST form-urlencoded
        try:
            resp = await client.post(
                url, data=payload_form, timeout=20.0,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            if resp.status_code in (200, 201):
                try:
                    data = resp.json()
                    token = (data.get("token") or data.get("access_token")
                             or data.get("accessToken") or data.get("jwt"))
                    if token:
                        logger.info("SCPA auth OK via form POST → %s", url)
                        return {"token": token, "cookies": dict(resp.cookies)}
                except Exception:
                    pass
            # Redirecional após login bem-sucedido (alguns SCPA retornam 302)
            if resp.status_code in (301, 302) and resp.cookies:
                logger.info("SCPA auth via redirect → %s", url)
                return {"token": None, "cookies": dict(resp.cookies)}
        except Exception as exc:
            logger.debug("SCPA form POST %s falhou: %s", url, exc)

    return None


async def _api_get(client: httpx.AsyncClient, path: str, params: dict | None = None) -> Any:
    url  = f"{_BACKEND_URL}/{path.lstrip('/')}"
    resp = await client.get(url, params=params, timeout=20.0)
    if resp.status_code == 401:
        raise RuntimeError("Sessão InvestSUS expirada ou credenciais inválidas.")
    resp.raise_for_status()
    return resp.json()


def _normalizar_proposta(raw: dict) -> dict:
    return {
        "numero_proposta":  str(raw.get("numeroProposta") or raw.get("numero") or ""),
        "numero_instrumento": str(raw.get("numeroInstrumento") or raw.get("numeroConvenio") or ""),
        "objeto":           raw.get("objeto") or raw.get("descricaoObjeto") or "",
        "tipo_emenda":      raw.get("tipoEmenda") or raw.get("tipoInstrumento") or "",
        "programa":         raw.get("nomePrograma") or raw.get("programa") or "",
        "parlamentar":      raw.get("nomeParlamentar") or raw.get("parlamentar") or "",
        "valor_global":     float(raw.get("valorGlobal") or raw.get("valor") or 0),
        "valor_aprovado":   float(raw.get("valorAprovado") or raw.get("valorGlobal") or 0),
        "valor_repassado":  float(raw.get("valorRepassado") or 0),
        "valor_executado":  float(raw.get("valorExecutado") or 0),
        "situacao_raw":     raw.get("situacao") or raw.get("descricaoSituacao") or "",
        "data_proposta":    raw.get("dataProposta") or raw.get("dataInicio"),
        "data_aprovacao":   raw.get("dataAprovacao"),
        "data_inicio":      raw.get("dataInicioVigencia") or raw.get("dataInicio"),
        "data_fim":         raw.get("dataFimVigencia") or raw.get("dataTermino"),
        "cnpj_proponente":  raw.get("cnpjProponente") or _CNPJ_APUI,
        "exercicio":        int(raw.get("anoExercicio") or raw.get("ano") or datetime.now().year),
        "raw":              raw,
    }


async def sincronizar_investsus(cnpj: str | None = None) -> dict:
    """
    Autentica no SCPA via HTTP, busca propostas do município e retorna dados.
    """
    cpf, senha = _credenciais()
    cnpj = (cnpj or _CNPJ_APUI).replace(".", "").replace("/", "").replace("-", "")

    resultado: dict[str, Any] = {
        "propostas": [],
        "repasses":  [],
        "saldos":    [],
        "erros":     [],
        "sincronizado_em": datetime.utcnow().isoformat() + "Z",
    }

    async with httpx.AsyncClient(
        headers=_HEADERS_BASE,
        follow_redirects=True,
        timeout=30.0,
    ) as client:

        # ── 1. Autenticação SCPA ────────────────────────────────────────────
        auth = await _tentar_auth_scpa(client, cpf, senha)

        if auth:
            # Injeta token/cookies nas próximas requisições
            if auth.get("token"):
                client.headers["Authorization"] = f"Bearer {auth['token']}"
            for k, v in (auth.get("cookies") or {}).items():
                client.cookies.set(k, v)
        else:
            logger.warning("InvestSUS: nenhum endpoint SCPA respondeu — tentando API sem auth")
            resultado["erros"].append({
                "endpoint": "scpa_auth",
                "erro": "Nenhum endpoint SCPA REST funcionou. A API pode exigir login via browser.",
            })

        # ── 2. Propostas paginadas ──────────────────────────────────────────
        try:
            page_num = 0
            while True:
                dados = await _api_get(client, "propostas/paginado", {
                    "cnpjProponente": cnpj,
                    "page": page_num,
                    "size": 50,
                })
                items = dados.get("content") or dados.get("propostas") or []
                if not items:
                    break
                resultado["propostas"].extend(_normalizar_proposta(p) for p in items)
                total_pages = dados.get("totalPages", 1)
                page_num += 1
                if page_num >= total_pages:
                    break
            logger.info("InvestSUS: %d propostas encontradas", len(resultado["propostas"]))
        except Exception as exc:
            logger.warning("InvestSUS propostas/paginado: %s", exc)
            resultado["erros"].append({"endpoint": "propostas/paginado", "erro": str(exc)})

            # Fallback: endpoint sem paginação
            try:
                dados = await _api_get(client, "propostas", {"cnpjProponente": cnpj})
                items = dados if isinstance(dados, list) else dados.get("content", [])
                resultado["propostas"].extend(_normalizar_proposta(p) for p in items)
            except Exception as exc2:
                resultado["erros"].append({"endpoint": "propostas (fallback)", "erro": str(exc2)})

        # ── 3. Saldos ───────────────────────────────────────────────────────
        try:
            dados = await _api_get(client, "saldo", {"cnpjEnte": cnpj})
            resultado["saldos"] = dados if isinstance(dados, list) else [dados]
        except Exception as exc:
            resultado["erros"].append({"endpoint": "saldo", "erro": str(exc)})

        # ── 4. Repasses recentes ────────────────────────────────────────────
        try:
            dados = await _api_get(client, "repasse", {"cnpjEnte": cnpj, "page": 0, "size": 20})
            resultado["repasses"] = dados.get("content") or (dados if isinstance(dados, list) else [])
        except Exception as exc:
            resultado["erros"].append({"endpoint": "repasse", "erro": str(exc)})

    return resultado
