"""
InvestSUS Scraper — autenticação via portal investsus.saude.gov.br

Usa INVESTSUS_CPF e INVESTSUS_SENHA (Railway) para buscar propostas do
Fundo Municipal de Saúde de Apuí (CNPJ 12.834.320/0001-26).

Env vars (Railway):
  INVESTSUS_CPF   — CPF do responsável (sem pontos/traços)
  INVESTSUS_SENHA — senha do portal InvestSUS
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_BASE      = "https://investsus.saude.gov.br"
_CNPJ_APUI = "12834320000126"
_TIMEOUT   = 45.0


def _credenciais() -> tuple[str, str]:
    cpf   = os.getenv("INVESTSUS_CPF", "").strip()
    senha = os.getenv("INVESTSUS_SENHA", "").strip()
    if not cpf or not senha:
        raise RuntimeError(
            "INVESTSUS_CPF e INVESTSUS_SENHA não configurados. "
            "Adicione as variáveis de ambiente no Railway."
        )
    return cpf, senha


async def _autenticar(client: httpx.AsyncClient, cpf: str, senha: str) -> str:
    """Autentica no portal InvestSUS e retorna o Bearer token."""
    candidatos = [
        (f"{_BASE}/api/autenticacao/login",   {"login": cpf, "senha": senha}),
        (f"{_BASE}/api/auth/login",           {"cpf": cpf, "senha": senha}),
        (f"{_BASE}/api/usuario/autenticar",   {"login": cpf, "senha": senha}),
        (f"{_BASE}/api/login",                {"cpf": cpf, "password": senha}),
    ]
    ultimo_erro = "nenhum endpoint tentado"
    for url, payload in candidatos:
        try:
            resp = await client.post(url, json=payload, timeout=_TIMEOUT)
            if resp.status_code == 404:
                continue
            if resp.status_code in (401, 403):
                raise RuntimeError(
                    "Credenciais InvestSUS rejeitadas (401/403). "
                    "Verifique INVESTSUS_CPF e INVESTSUS_SENHA no Railway."
                )
            resp.raise_for_status()
            data = resp.json()
            token = (
                data.get("token")
                or data.get("accessToken")
                or data.get("access_token")
                or (data.get("data") or {}).get("token")
                or (data.get("data") or {}).get("access_token")
            )
            if token:
                logger.info("InvestSUS: autenticado via %s", url)
                return str(token)
            ultimo_erro = f"Token ausente na resposta de {url}: {list(data.keys())}"
        except RuntimeError:
            raise
        except Exception as e:
            ultimo_erro = str(e)
            continue

    raise RuntimeError(f"Falha na autenticação InvestSUS. Último erro: {ultimo_erro}")


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
