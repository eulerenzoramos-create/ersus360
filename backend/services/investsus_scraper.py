"""
InvestSUS Scraper - API real do portal investsus.saude.gov.br

Endpoints confirmados em 08/10/2026:
  Auth:      POST https://acesso.saude.gov.br/realms/saude/protocol/openid-connect/token
             client_id=INVESTSUS  (Keycloak v18+, sem prefixo /auth)
  Propostas: POST https://investsus-backend-prd.saude.gov.br/api/propostas/paginado
             body: {"filter": {"ano": "<ANO>", "cnpj": "<CNPJ>"}, "pageNumber": 1, "pageSize": 100}
  Tipos:     GET  https://investsus-backend-prd.saude.gov.br/api/geral/propostas/tipos-propostas/valores

Env vars (Railway):
  INVESTSUS_CPF   - CPF do responsavel (so digitos, sem pontos/tracas)
  INVESTSUS_SENHA - senha do portal InvestSUS / gov.br
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_BACKEND   = "https://investsus-backend-prd.saude.gov.br/api"
_CNPJ_APUI = "12834320000126"
_CLIENT_ID = "INVESTSUS"
_TIMEOUT   = 45.0

_TOKEN_URL_PRINCIPAL = "https://acesso.saude.gov.br/realms/saude/protocol/openid-connect/token"
_TOKEN_URL_FALLBACK  = "https://acesso.saude.gov.br/auth/realms/saude/protocol/openid-connect/token"


def _credenciais() -> tuple[str, str]:
    cpf   = os.getenv("INVESTSUS_CPF", "").strip().replace(".", "").replace("-", "")
    senha = os.getenv("INVESTSUS_SENHA", "").strip()
    if not cpf or not senha:
        raise RuntimeError(
            "INVESTSUS_CPF e INVESTSUS_SENHA nao configurados. "
            "Adicione as variaveis de ambiente no Railway."
        )
    return cpf, senha


async def _autenticar(client: httpx.AsyncClient, cpf: str, senha: str) -> str:
    """
    Obtem Bearer token via Keycloak password grant (SCPA/acesso.saude.gov.br).
    clientId INVESTSUS, realm 'saude'.
    """
    payload = {
        "grant_type": "password",
        "client_id":  _CLIENT_ID,
        "username":   cpf,
        "password":   senha,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    for url in [_TOKEN_URL_PRINCIPAL, _TOKEN_URL_FALLBACK]:
        try:
            resp = await client.post(url, data=payload, headers=headers, timeout=_TIMEOUT)
            if resp.status_code == 404:
                continue

            body = resp.json()

            if resp.status_code == 400:
                err  = body.get("error", "")
                desc = body.get("error_description", "")
                if "invalid_grant" in err or "Invalid user" in desc:
                    raise RuntimeError(
                        f"Credenciais SCPA rejeitadas: {desc}. "
                        "Verifique INVESTSUS_CPF e INVESTSUS_SENHA no Railway."
                    )
                logger.debug("Token %s: %s %s", url, err, desc)
                continue

            if resp.status_code == 401:
                raise RuntimeError("Credenciais SCPA rejeitadas (401). Verifique INVESTSUS_CPF/SENHA.")

            resp.raise_for_status()

            token = body.get("access_token")
            if token:
                logger.info("InvestSUS: autenticado (SCPA realm=saude, client=%s)", _CLIENT_ID)
                return str(token)

            logger.debug("access_token ausente em %s: %s", url, list(body.keys()))

        except RuntimeError:
            raise
        except Exception as e:
            logger.debug("Auth %s: %s", url, e)
            continue

    raise RuntimeError(
        "Nao foi possivel autenticar no SCPA/InvestSUS. "
        "Verifique se INVESTSUS_CPF e INVESTSUS_SENHA estao corretos no Railway."
    )


def _normalizar_proposta(raw: dict) -> dict:
    """Mapeia campos da API real do InvestSUS para o formato ERSUS360."""
    numero = str(
        raw.get("numeroProposta")
        or raw.get("numero_proposta")
        or raw.get("numero")
        or raw.get("id")
        or ""
    )
    situacao = (
        raw.get("descricaoSituacao")
        or raw.get("situacao")
        or raw.get("situacaoProposta")
        or raw.get("fase")
        or ""
    )
    tipo_recurso  = raw.get("tipoRecurso") or raw.get("tipo_recurso") or ""
    tipo_proposta = (
        raw.get("tipoProposta")
        or raw.get("tipo")
        or raw.get("descricaoTipoProposta")
        or tipo_recurso
        or ""
    )
    valor = float(
        raw.get("valor")
        or raw.get("valorProposta")
        or raw.get("valorGlobal")
        or raw.get("valorIndicado")
        or 0
    )
    return {
        "numero_proposta":    numero,
        "numero_instrumento": str(raw.get("numeroInstrumento") or raw.get("instrumento") or ""),
        "objeto":             raw.get("objeto") or raw.get("descricao") or tipo_proposta or "",
        "tipo_emenda":        tipo_recurso.lower() if tipo_recurso else "individual",
        "programa":           tipo_proposta,
        "parlamentar":        raw.get("parlamentar") or raw.get("nomeParlamentar") or "",
        "valor_global":       valor,
        "valor_aprovado":     float(raw.get("valorAprovado") or valor or 0),
        "valor_repassado":    float(raw.get("valorRepassado") or raw.get("valorPago") or 0),
        "valor_executado":    float(raw.get("valorExecutado") or 0),
        "situacao_raw":       situacao,
        "data_proposta":      raw.get("dataCadastro") or raw.get("dataInicio"),
        "data_aprovacao":     raw.get("dataAprovacao"),
        "data_inicio":        raw.get("dataInicio") or raw.get("dataVigenciaInicio"),
        "data_fim":           raw.get("dataFim") or raw.get("dataVigenciaFim"),
        "cnpj_proponente":    _CNPJ_APUI,
        "exercicio":          int(raw.get("exercicio") or raw.get("ano") or datetime.now().year),
        "fonte":              "investsus",
        "raw":                raw,
    }


async def _buscar_propostas_paginado(
    client: httpx.AsyncClient,
    token: str,
    cnpj: str,
    ano: int,
) -> list[dict]:
    """
    POST /api/propostas/paginado - endpoint confirmado pelo portal.
    Pagina ate buscar todos os registros.
    """
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    all_items: list[dict] = []
    page = 1

    while True:
        body = {
            "filter": {
                "ano":  str(ano),
                "cnpj": cnpj,
                "idAgrupadorTipoProposta": None,
            },
            "pageNumber": page,
            "pageSize":   100,
        }
        try:
            resp = await client.post(
                f"{_BACKEND}/propostas/paginado",
                json=body,
                headers=headers,
                timeout=_TIMEOUT,
            )
            if resp.status_code in (401, 403):
                logger.warning("InvestSUS propostas: nao autorizado (token expirado?)")
                break
            resp.raise_for_status()
            data = resp.json()

            items = (
                data.get("content")
                or data.get("propostas")
                or data.get("items")
                or (data if isinstance(data, list) else [])
            )
            all_items.extend(items)

            total = data.get("totalElements") or data.get("total") or len(items)
            logger.info("InvestSUS propostas %d: %d/%d", ano, len(all_items), total)

            if len(all_items) >= int(total) or len(items) < 100:
                break
            page += 1

        except Exception as e:
            logger.error("InvestSUS paginado p%d: %s", page, e)
            break

    return all_items


async def sincronizar_investsus(cnpj: str | None = None) -> dict:
    """
    Busca propostas do InvestSUS.

    Estratégia de autenticação (em ordem):
      1. INVESTSUS_TOKEN  — token JWT extraído do browser (contorna MFA gov.br)
      2. INVESTSUS_CPF + INVESTSUS_SENHA — password grant SCPA (só funciona sem MFA)
    """
    cnpj = (cnpj or _CNPJ_APUI).replace(".", "").replace("/", "").replace("-", "")
    ano  = datetime.now().year

    resultado: dict[str, Any] = {
        "propostas":       [],
        "repasses":        [],
        "saldos":          [],
        "erros":           [],
        "sincronizado_em": datetime.utcnow().isoformat() + "Z",
    }

    async with httpx.AsyncClient(follow_redirects=True) as client:
        # 1. Obter token
        token_fixo = os.getenv("INVESTSUS_TOKEN", "").strip()
        if token_fixo:
            token = token_fixo
            logger.info("InvestSUS: usando INVESTSUS_TOKEN configurado (bypass MFA)")
        else:
            try:
                cpf, senha = _credenciais()
                token = await _autenticar(client, cpf, senha)
            except Exception as exc:
                logger.error("InvestSUS auth falhou: %s", exc)
                resultado["erros"].append({"endpoint": "auth", "erro": str(exc)})
                return resultado

        # 2. Propostas do ano atual
        try:
            raws = await _buscar_propostas_paginado(client, token, cnpj, ano)
            resultado["propostas"] = [_normalizar_proposta(r) for r in raws]
        except Exception as exc:
            logger.error("InvestSUS propostas %d: %s", ano, exc)
            resultado["erros"].append({"endpoint": "propostas", "erro": str(exc)})

        # 3. Propostas do ano anterior (vigentes)
        try:
            raws_prev = await _buscar_propostas_paginado(client, token, cnpj, ano - 1)
            resultado["propostas"].extend(_normalizar_proposta(r) for r in raws_prev)
        except Exception as exc:
            logger.debug("InvestSUS propostas %d: %s", ano - 1, exc)

    logger.info(
        "InvestSUS: %d propostas sincronizadas, %d erros",
        len(resultado["propostas"]), len(resultado["erros"]),
    )
    return resultado
