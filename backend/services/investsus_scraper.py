"""
InvestSUS Scraper — autenticação via SCPA (acesso.saude.gov.br / Keycloak)

O portal InvestSUS usa o SSO SCPA do DATASUS. O fluxo de autenticação é:
  1. GET investsus.saude.gov.br → redireciona para acesso.saude.gov.br/login
  2. Extrai client_id e auth URL do redirect OAuth/Keycloak
  3. POST credenciais ao Keycloak token endpoint (password grant)
  4. Usa o access_token para chamar a API do InvestSUS

Env vars (Railway):
  INVESTSUS_CPF   — CPF do responsável (sem pontos/traços)
  INVESTSUS_SENHA — senha do portal InvestSUS (SCPA / gov.br)
"""

from __future__ import annotations

import logging
import os
import re
from datetime import datetime
from typing import Any
from urllib.parse import parse_qs, urlparse

import httpx

logger = logging.getLogger(__name__)

_BASE      = "https://investsus.saude.gov.br"
_SCPA_BASE = "https://acesso.saude.gov.br"
_CNPJ_APUI = "12834320000126"
_TIMEOUT   = 45.0

# Keycloak realm do DATASUS (valor padrão; sobrescrito se descoberto no redirect)
_KEYCLOAK_REALM    = "saude"
_KEYCLOAK_CLIENT   = "investsus"   # client_id padrão
_KEYCLOAK_TOKEN_URL = (
    f"{_SCPA_BASE}/auth/realms/{_KEYCLOAK_REALM}"
    "/protocol/openid-connect/token"
)


def _credenciais() -> tuple[str, str]:
    cpf   = os.getenv("INVESTSUS_CPF", "").strip()
    senha = os.getenv("INVESTSUS_SENHA", "").strip()
    if not cpf or not senha:
        raise RuntimeError(
            "INVESTSUS_CPF e INVESTSUS_SENHA não configurados. "
            "Adicione as variáveis de ambiente no Railway."
        )
    return cpf, senha


async def _descobrir_oauth_params(client: httpx.AsyncClient) -> dict:
    """
    Faz GET no InvestSUS para descobrir o client_id e token_url reais
    a partir do redirect OAuth/Keycloak.
    Retorna dict com 'token_url' e 'client_id'.
    """
    params = {"token_url": _KEYCLOAK_TOKEN_URL, "client_id": _KEYCLOAK_CLIENT}
    try:
        resp = await client.get(f"{_BASE}/", follow_redirects=False, timeout=15.0)
        location = resp.headers.get("location", "")
        if not location:
            return params

        parsed = urlparse(location)
        qs = parse_qs(parsed.query)

        # Extrai client_id do redirect URL
        client_id = (qs.get("client_id") or [""])[0]
        if client_id:
            params["client_id"] = client_id
            logger.debug("OAuth client_id descoberto: %s", client_id)

        # Extrai realm e monta token_url
        # Padrão: /auth/realms/{realm}/protocol/openid-connect/auth
        m = re.search(r"/auth/realms/([^/]+)/protocol", location)
        if m:
            realm = m.group(1)
            base_url = f"{parsed.scheme}://{parsed.netloc}"
            params["token_url"] = (
                f"{base_url}/auth/realms/{realm}"
                "/protocol/openid-connect/token"
            )
            logger.debug("Keycloak token_url descoberto: %s", params["token_url"])

    except Exception as e:
        logger.debug("Não foi possível descobrir OAuth params: %s — usando defaults", e)

    return params


async def _autenticar(client: httpx.AsyncClient, cpf: str, senha: str) -> str:
    """
    Autentica via SCPA/Keycloak (password grant) e retorna o access_token.
    """
    oauth = await _descobrir_oauth_params(client)
    token_url = oauth["token_url"]
    client_id = oauth["client_id"]

    # Tenta password grant (Resource Owner Password Credentials)
    tentativas = [
        # SCPA Keycloak — formato padrão
        {
            "url": token_url,
            "data": {
                "grant_type": "password",
                "client_id": client_id,
                "username": cpf,
                "password": senha,
            },
        },
        # Fallback: client_id alternativo
        {
            "url": token_url,
            "data": {
                "grant_type": "password",
                "client_id": "investsus-web",
                "username": cpf,
                "password": senha,
            },
        },
        # Fallback: URL alternativa SCPA
        {
            "url": f"{_SCPA_BASE}/auth/realms/master/protocol/openid-connect/token",
            "data": {
                "grant_type": "password",
                "client_id": client_id,
                "username": cpf,
                "password": senha,
            },
        },
    ]

    ultimo_erro = "nenhuma tentativa executada"
    for t in tentativas:
        try:
            resp = await client.post(
                t["url"],
                data=t["data"],
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=_TIMEOUT,
            )
            if resp.status_code == 404:
                continue
            if resp.status_code in (401, 400):
                body = resp.text[:300]
                # 400 com "invalid_grant" = credenciais erradas
                if "invalid_grant" in body or "Invalid user" in body:
                    raise RuntimeError(
                        "Credenciais SCPA rejeitadas. "
                        "Verifique INVESTSUS_CPF e INVESTSUS_SENHA no Railway."
                    )
                ultimo_erro = f"HTTP {resp.status_code}: {body}"
                continue
            resp.raise_for_status()
            data = resp.json()
            token = data.get("access_token") or data.get("token")
            if token:
                logger.info("InvestSUS/SCPA: autenticado com sucesso")
                return str(token)
            ultimo_erro = f"access_token ausente na resposta: {list(data.keys())}"
        except RuntimeError:
            raise
        except Exception as e:
            ultimo_erro = str(e)
            continue

    raise RuntimeError(
        f"Falha na autenticação SCPA/InvestSUS. Último erro: {ultimo_erro}"
    )


def _normalizar_proposta(raw: dict) -> dict:
    numero = str(
        raw.get("numeroProposta")
        or raw.get("numero_proposta")
        or raw.get("numero")
        or raw.get("id")
        or ""
    )
    return {
        "numero_proposta":    numero,
        "numero_instrumento": str(raw.get("numeroInstrumento") or raw.get("numero_instrumento") or ""),
        "objeto":             raw.get("objeto") or raw.get("descricaoObjeto") or raw.get("descricao") or "",
        "tipo_emenda":        raw.get("tipoEmenda") or raw.get("tipo_emenda") or raw.get("modalidade") or "individual",
        "programa":           raw.get("programa") or raw.get("nomePrograma") or raw.get("acaoOrcamentaria") or "",
        "parlamentar":        raw.get("parlamentar") or raw.get("nomeParlamentar") or raw.get("nomeAutor") or "",
        "valor_global":       float(raw.get("valorGlobal") or raw.get("valor_global") or raw.get("valorIndicado") or raw.get("valor") or 0),
        "valor_aprovado":     float(raw.get("valorAprovado") or raw.get("valor_aprovado") or raw.get("valorEmpenhado") or 0),
        "valor_repassado":    float(raw.get("valorRepassado") or raw.get("valor_repassado") or raw.get("valorPago") or 0),
        "valor_executado":    float(raw.get("valorExecutado") or raw.get("valor_executado") or 0),
        "situacao_raw":       raw.get("situacao") or raw.get("situacaoProposta") or raw.get("descricaoSituacao") or raw.get("fase") or "",
        "data_proposta":      raw.get("dataCadastro") or raw.get("dataInicio"),
        "data_aprovacao":     raw.get("dataAprovacao") or raw.get("dataPublicacao"),
        "data_inicio":        raw.get("dataInicio") or raw.get("dataVigenciaInicio"),
        "data_fim":           raw.get("dataFim") or raw.get("dataVigenciaFim"),
        "cnpj_proponente":    _CNPJ_APUI,
        "exercicio":          int(raw.get("exercicio") or raw.get("anoExercicio") or raw.get("ano") or datetime.now().year),
        "fonte":              "investsus",
        "raw":                raw,
    }


async def _buscar_propostas(
    client: httpx.AsyncClient,
    token: str,
    cnpj: str,
) -> list[dict]:
    headers = {"Authorization": f"Bearer {token}"}
    candidatos = [
        f"{_BASE}/api/proposta?cnpjProponente={cnpj}",
        f"{_BASE}/api/propostas?cnpj={cnpj}",
        f"{_BASE}/api/proposta/listar?cnpj={cnpj}",
        f"{_BASE}/api/proposta/proponente/{cnpj}",
        f"{_BASE}/api/propostas/proponente?cnpj={cnpj}",
        f"{_BASE}/api/proposta/buscar?cnpjProponente={cnpj}",
    ]
    for url in candidatos:
        try:
            resp = await client.get(url, headers=headers, timeout=_TIMEOUT)
            if resp.status_code == 404:
                continue
            if resp.status_code in (401, 403):
                logger.warning("InvestSUS propostas: sem autorização em %s", url)
                continue
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list):
                logger.info("InvestSUS: %d propostas via %s", len(data), url)
                return data
            if isinstance(data, dict):
                items = (
                    data.get("propostas")
                    or data.get("content")
                    or data.get("data")
                    or data.get("items")
                    or []
                )
                if isinstance(items, list):
                    logger.info("InvestSUS: %d propostas via %s", len(items), url)
                    return items
        except Exception as e:
            logger.debug("InvestSUS endpoint %s: %s", url, e)
            continue

    logger.warning("InvestSUS: nenhum endpoint retornou propostas para CNPJ %s", cnpj)
    return []


async def sincronizar_investsus(cnpj: str | None = None) -> dict:
    """
    Autentica no portal InvestSUS com INVESTSUS_CPF/INVESTSUS_SENHA e
    busca propostas do FMS Apuí (ou do CNPJ fornecido).
    """
    cpf, senha = _credenciais()
    cnpj = (cnpj or _CNPJ_APUI).replace(".", "").replace("/", "").replace("-", "")

    resultado: dict[str, Any] = {
        "propostas":       [],
        "repasses":        [],
        "saldos":          [],
        "erros":           [],
        "sincronizado_em": datetime.utcnow().isoformat() + "Z",
    }

    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            token = await _autenticar(client, cpf, senha)
        except Exception as exc:
            logger.error("InvestSUS autenticação falhou: %s", exc)
            resultado["erros"].append({"endpoint": "auth", "erro": str(exc)})
            return resultado

        try:
            raws = await _buscar_propostas(client, token, cnpj)
            resultado["propostas"] = [_normalizar_proposta(r) for r in raws]
        except Exception as exc:
            logger.error("InvestSUS busca propostas falhou: %s", exc)
            resultado["erros"].append({"endpoint": "propostas", "erro": str(exc)})

    logger.info(
        "InvestSUS sincronização: %d propostas, %d erros",
        len(resultado["propostas"]), len(resultado["erros"]),
    )
    return resultado
