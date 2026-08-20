"""
InvestSUS Scraper — dados via Portal da Transparência (API pública).

Usa TRANSPARENCIA_API_KEY (já configurado no Railway) para buscar:
- Emendas parlamentares destinadas ao FMS Apuí (CNPJ 12.834.320/0001-26)
- Transferências constitucionais e legais
- Convênios e instrumentos de transferência voluntária

API: https://api.portaltransparencia.gov.br/api-de-dados/
Documentação: https://api.portaltransparencia.gov.br/swagger-ui.html

Env vars (Railway):
  TRANSPARENCIA_API_KEY — chave da API do Portal da Transparência
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_API_BASE  = "https://api.portaltransparencia.gov.br/api-de-dados"
_CNPJ_APUI = "12834320000126"   # FMS Apuí — sem pontos/barras


def _api_key() -> str:
    key = os.getenv("TRANSPARENCIA_API_KEY", "")
    if not key:
        raise RuntimeError(
            "TRANSPARENCIA_API_KEY não configurada. "
            "Adicione a variável de ambiente no Railway."
        )
    return key


def _headers(key: str) -> dict:
    return {
        "chave-api-dados": key,
        "Accept": "application/json",
        "User-Agent": "ERSUS360/1.0 (FMS Apui/AM; gestao municipal SUS)",
    }


async def _get(client: httpx.AsyncClient, path: str, params: dict) -> Any:
    url  = f"{_API_BASE}/{path.lstrip('/')}"
    resp = await client.get(url, params=params, timeout=30.0)
    if resp.status_code == 403:
        raise RuntimeError("TRANSPARENCIA_API_KEY inválida ou sem permissão.")
    if resp.status_code == 404:
        return []
    resp.raise_for_status()
    return resp.json()


def _normalizar_emenda(raw: dict) -> dict:
    """Converte resposta de emenda do Portal Transparência para nosso formato."""
    parlamentar = raw.get("nomeAutor") or raw.get("autor") or ""
    tipo        = raw.get("tipoEmenda") or raw.get("localidadeDoGasto") or ""
    return {
        "numero_proposta":    str(raw.get("codigoEmenda") or raw.get("numero") or ""),
        "numero_instrumento": str(raw.get("codigoSubEmenda") or ""),
        "objeto":             raw.get("descricao") or raw.get("objeto") or tipo,
        "tipo_emenda":        tipo,
        "programa":           raw.get("acaoOrcamentaria") or raw.get("programa") or "",
        "parlamentar":        parlamentar,
        "valor_global":       float(raw.get("valorEmpenhado") or raw.get("valor") or 0),
        "valor_aprovado":     float(raw.get("valorEmpenhado") or 0),
        "valor_repassado":    float(raw.get("valorPago") or raw.get("valorRepassado") or 0),
        "valor_executado":    float(raw.get("valorPago") or 0),
        "situacao_raw":       raw.get("situacao") or raw.get("fase") or "",
        "data_proposta":      raw.get("dataInicio") or raw.get("dataCriacao"),
        "data_aprovacao":     None,
        "data_inicio":        raw.get("dataInicio"),
        "data_fim":           raw.get("dataFim"),
        "cnpj_proponente":    _CNPJ_APUI,
        "exercicio":          int(raw.get("ano") or datetime.now().year),
        "fonte":              "transparencia",
        "raw":                raw,
    }


def _normalizar_convenio(raw: dict) -> dict:
    """Converte convênio/instrumento do Portal Transparência."""
    return {
        "numero_proposta":    str(raw.get("numero") or raw.get("codigoConvenio") or ""),
        "numero_instrumento": str(raw.get("numeroProcesso") or ""),
        "objeto":             raw.get("objeto") or "",
        "tipo_emenda":        raw.get("modalidade") or raw.get("tipoInstrumento") or "Convênio",
        "programa":           raw.get("programa") or "",
        "parlamentar":        raw.get("concedente") or raw.get("orgaoConcedente") or "",
        "valor_global":       float(raw.get("valorGlobal") or 0),
        "valor_aprovado":     float(raw.get("valorGlobal") or 0),
        "valor_repassado":    float(raw.get("valorRepassado") or raw.get("valorRepasseConcedente") or 0),
        "valor_executado":    float(raw.get("valorExecutado") or 0),
        "situacao_raw":       raw.get("situacao") or raw.get("situacaoConvenio") or "",
        "data_proposta":      raw.get("dataInicioVigencia"),
        "data_aprovacao":     raw.get("dataAssinatura"),
        "data_inicio":        raw.get("dataInicioVigencia"),
        "data_fim":           raw.get("dataFimVigencia"),
        "cnpj_proponente":    _CNPJ_APUI,
        "exercicio":          int(raw.get("anoAssinatura") or datetime.now().year),
        "fonte":              "transparencia_convenio",
        "raw":                raw,
    }


async def sincronizar_investsus(cnpj: str | None = None) -> dict:
    """
    Busca dados de emendas parlamentares e convênios do FMS Apuí
    via Portal da Transparência (API pública, sem SCPA).
    """
    key  = _api_key()
    cnpj = (cnpj or _CNPJ_APUI).replace(".", "").replace("/", "").replace("-", "")
    ano  = datetime.now().year

    resultado: dict[str, Any] = {
        "propostas": [],
        "repasses":  [],
        "saldos":    [],
        "erros":     [],
        "sincronizado_em": datetime.utcnow().isoformat() + "Z",
    }

    async with httpx.AsyncClient(headers=_headers(key), follow_redirects=True) as client:

        # ── 1. Emendas parlamentares destinadas ao FMS ─────────────────────
        for ano_busca in [ano, ano - 1]:
            try:
                dados = await _get(client, "emendas", {
                    "cnpjBeneficiario": cnpj,
                    "ano": ano_busca,
                    "pagina": 1,
                })
                items = dados if isinstance(dados, list) else []
                resultado["propostas"].extend(_normalizar_emenda(p) for p in items)
                logger.info("Transparência emendas %d: %d registros", ano_busca, len(items))
            except Exception as exc:
                logger.warning("emendas %d: %s", ano_busca, exc)
                resultado["erros"].append({"endpoint": f"emendas/{ano_busca}", "erro": str(exc)})

        # ── 2. Convênios/instrumentos de transferência ─────────────────────
        try:
            dados = await _get(client, "convenios", {
                "cnpjConvenente": cnpj,
                "pagina": 1,
                "tamanhoPagina": 100,
            })
            items = dados if isinstance(dados, list) else []
            resultado["propostas"].extend(_normalizar_convenio(c) for c in items)
            logger.info("Transparência convênios: %d registros", len(items))
        except Exception as exc:
            logger.warning("convenios: %s", exc)
            resultado["erros"].append({"endpoint": "convenios", "erro": str(exc)})

        # ── 3. Transferências recebidas pelo município ──────────────────────
        try:
            dados = await _get(client, "transferencias/municipios", {
                "codigoMunicipio": "1300144",   # IBGE Apuí
                "ano": ano,
                "pagina": 1,
                "tamanhoPagina": 20,
            })
            items = dados if isinstance(dados, list) else []
            resultado["repasses"] = items
            logger.info("Transparência transferências: %d registros", len(items))
        except Exception as exc:
            logger.warning("transferencias: %s", exc)
            resultado["erros"].append({"endpoint": "transferencias/municipios", "erro": str(exc)})

    logger.info(
        "Sincronização concluída: %d propostas, %d repasses, %d erros",
        len(resultado["propostas"]), len(resultado["repasses"]), len(resultado["erros"]),
    )
    return resultado
