"""
Router: /api/cadsus-qualidade — Qualidade Cadastral CADSUS / e-SUS PEC
ERSUS 360

Fontes reais disponíveis:
  - e-SUS PEC (local): /api/esus-pec/status  → conectividade e contagem de cidadãos
  - CADSUS / RNDS: sem API pública de acesso em lote por município para ACS/microárea
  - CNES: equipes e microáreas (INEs via e-Gestor APS)

Regras de dados:
  - Nenhum nome de cidadão, CNS ou score por microárea é simulado.
  - Dados ausentes recebem situacao_dado = "nao_disponivel" com explicação.
  - Métricas reais de qualidade cadastral requerem acesso à base e-SUS PEC local.
"""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cadsus-qualidade", tags=["CADSUS Qualidade"])

_IBGE = "1300144"


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _metrica_indisponivel(label: str, obs: str) -> dict:
    return {
        "label":         label,
        "valor":         None,
        "situacao_dado": "nao_disponivel",
        "observacao":    obs,
    }


async def _status_esus() -> dict:
    """Verifica conectividade do e-SUS PEC local."""
    import httpx, os
    esus_url = os.getenv("ESUS_URL", "")
    if not esus_url:
        return {
            "online": False,
            "situacao_dado": "nao_disponivel",
            "nota": "ESUS_URL não configurado no Railway.",
        }
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            r = await c.get(f"{esus_url}/api/ping")
            if r.status_code < 400:
                return {
                    "online": True,
                    "situacao_dado": "oficial_aguardando",
                    "nota": f"e-SUS PEC acessível em {esus_url}.",
                }
    except Exception as exc:
        logger.debug("e-SUS PEC indisponível: %s", exc)
    return {
        "online": False,
        "situacao_dado": "nao_disponivel",
        "nota": f"e-SUS PEC em {esus_url or '(sem URL)'} não acessível.",
    }


@router.get("/resumo")
async def resumo_cadsus(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """
    Resumo da qualidade cadastral CADSUS.

    Métricas de qualidade por microárea requerem acesso à base e-SUS PEC local
    (ESUS_URL + credenciais configuradas no Railway).
    CADSUS em lote por município não possui API pública disponível.
    """
    esus = await _status_esus()

    metricas = {
        "completude_campos":
            _metrica_indisponivel(
                "Completude de Campos Obrigatórios (%)",
                "Requer consulta à base e-SUS PEC local (ESUS_URL). "
                "Sem acesso local, não é possível calcular automaticamente.",
            ),
        "cns_valido":
            _metrica_indisponivel(
                "CNS Válido / Verificado (%)",
                "Validação de CNS requer acesso à API CADSUS (gov.br) com credenciais gov.br. "
                "Configure CADSUS_TOKEN no Railway.",
            ),
        "endereco_completo":
            _metrica_indisponivel(
                "Endereço Completo (%)",
                "Requer consulta à base e-SUS PEC local.",
            ),
        "unicidade":
            _metrica_indisponivel(
                "Sem Duplicidade no Sistema (%)",
                "Detecção de duplicatas requer acesso ao banco e-SUS PEC ou RNDS. "
                "Sem API pública disponível para isso.",
            ),
        "atualizacao_12m":
            _metrica_indisponivel(
                "Atualizado nos últimos 12 meses (%)",
                "Requer consulta ao campo data_ultima_atualizacao na base e-SUS PEC local.",
            ),
    }

    return {
        "ibge":                 ibge,
        "situacao_dado_geral":  "nao_disponivel",
        "esus_pec":             esus,
        "metricas":             metricas,
        "microareas":           [],
        "total_cidadaos":       None,
        "cidadaos_situacao":    "nao_disponivel",
        "verificado_em":        _ts(),
        "nota": (
            "Qualidade cadastral CADSUS por microárea requer acesso à base e-SUS PEC local. "
            "Configure ESUS_URL, ESUS_USUARIO_1300144 e ESUS_SENHA_1300144 no Railway. "
            "A API CADSUS em lote por município não é pública — acesso via gov.br com CPF/senha."
        ),
    }


@router.get("/microareas")
async def microareas_cadsus(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """
    Lista de microáreas com qualidade cadastral.
    Requer e-SUS PEC local — retorna lista vazia com situacao_dado nao_disponivel
    enquanto a integração não estiver configurada.
    """
    esus = await _status_esus()
    return {
        "ibge":          ibge,
        "situacao_dado": "nao_disponivel",
        "esus_online":   esus["online"],
        "microareas":    [],
        "nota": esus["nota"],
        "instrucao": (
            "Para habilitar: configure ESUS_URL + ESUS_USUARIO_1300144 + ESUS_SENHA_1300144 "
            "no Railway. O ERSUS 360 consultará o e-SUS PEC local para obter as microáreas "
            "e os cadastros de cada ACS."
        ),
        "verificado_em": _ts(),
    }


@router.get("/criticos")
async def criticos_cadsus(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """
    Cadastros críticos (CNS inválido, sem atualização, duplicados).
    Requer e-SUS PEC local.
    """
    esus = await _status_esus()
    return {
        "ibge":          ibge,
        "situacao_dado": "nao_disponivel",
        "total_criticos": None,
        "criticos":       [],
        "esus_online":    esus["online"],
        "nota":           esus["nota"],
        "verificado_em":  _ts(),
    }


@router.get("/tendencia")
async def tendencia_cadsus(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """
    Tendência histórica de qualidade cadastral.
    Requer e-SUS PEC local.
    """
    return {
        "ibge":          ibge,
        "situacao_dado": "nao_disponivel",
        "historico":     [],
        "nota": (
            "Histórico de qualidade cadastral requer extração periódica do e-SUS PEC local. "
            "Configure a integração para habilitar este endpoint."
        ),
        "verificado_em": _ts(),
    }
