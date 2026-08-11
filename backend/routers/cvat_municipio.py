"""
Router: /api/cvat/{ibge}
Componente Vínculo e Acompanhamento Territorial — multimunicípio.

Diferente de /api/siaps (Apuí hardcoded), este router:
  - aceita qualquer município via parâmetro ibge
  - usa siaps_municipio.py (parametrizado)
  - retorna proveniência completa de cada dado
  - nunca mistura municípios
  - classifica cada informação conforme a missão ERSUS 360

Regra: se não houver dado real disponível, retorna
  "Dado não validado — aguardando acesso ou relatório oficial."
em vez de um número fabricado.
"""
from __future__ import annotations
import asyncio
from datetime import datetime
from typing import Any

import httpx
from fastapi import APIRouter, Depends, Path, Query, HTTPException

from routers.auth import get_current_user, UserOut, require_municipio_access
from services import siaps_municipio

router = APIRouter(prefix="/api/cvat", tags=["CVAT — Multimunicípio"])

_IBGE_PADRAO_APUI = "1300144"


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


async def _populacao_ibge(ibge: str) -> dict:
    """Busca população oficial via API IBGE Censo 2022."""
    url = (
        f"https://servicodados.ibge.gov.br/api/v3/agregados/4714"
        f"/periodos/2022/variaveis/93?localidades=N6[{ibge}]"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(url)
            if r.status_code == 200:
                data = r.json()
                # Estrutura: [{resultados: [{series: [{localidade:{id:...}, serie:{"2022": valor}}]}]}]
                for ag in data or []:
                    for res in ag.get("resultados", []):
                        for s in res.get("series", []):
                            if s.get("localidade", {}).get("id") == ibge:
                                val = s.get("serie", {}).get("2022")
                                if val:
                                    return {
                                        "populacao": int(val),
                                        "fonte": "IBGE Censo 2022",
                                        "situacao": "oficial_validado",
                                        "api": url,
                                        "consultado_em": _ts(),
                                    }
    except Exception:
        pass
    return {
        "populacao": None,
        "fonte": "IBGE",
        "situacao": "nao_disponivel",
        "mensagem": "Dado não validado — API IBGE indisponível.",
        "consultado_em": _ts(),
    }


def _calcular_metricas(equipes: list[dict], populacao: int | None) -> dict:
    """Calcula totais a partir dos dados reais das equipes."""
    total_k = sum(e.get("K", 0) for e in equipes)
    total_h = sum(e.get("H", 0) for e in equipes)

    metricas = {
        "total_equipes": len(equipes),
        "total_vinculadas": total_k,
        "total_acompanhadas": total_h,
        "situacao_k": "oficial_validado" if total_k > 0 else "dado_nao_validado",
        "situacao_h": "dado_nao_validado",  # H é sempre estimado até extração nominal
        "nota_h": (
            "Campo H (acompanhadas) estimado com base em percentual do histórico da equipe. "
            "Extração nominal via e-SUS PEC necessária para valor exato."
        ),
    }

    if populacao:
        metricas["populacao_ibge_censo2022"] = populacao
        if total_k > 0:
            metricas["cobertura_vinculacao_pct"] = round(total_k / populacao * 100, 1)
            metricas["sem_vinculo_estimado"] = populacao - total_k
            metricas["nota_sem_vinculo"] = (
                "ATENÇÃO: 'sem vínculo' calculado como IBGE − vinculadas no SIAPS. "
                "Este valor INCLUI: cadastrados no PEC não reconhecidos pelo SIAPS, "
                "cadastros rejeitados, duplicidades, falecidos, mudanças de município. "
                "O cruzamento nominal via e-SUS PEC + CadSUS é necessário para a classificação real."
            )
            metricas["situacao_sem_vinculo"] = "estimativa_autorizada"
    else:
        metricas["populacao_ibge_censo2022"] = None
        metricas["nota_populacao"] = "Dado não validado — API IBGE indisponível."

    return metricas


@router.get("/{ibge}/vinculo")
async def cvat_vinculo(
    ibge: str = Path(..., description="Código IBGE do município (7 dígitos)", regex=r"^\d{7}$"),
    competencia: str = Query("202605", description="Competência AAAAMM", regex=r"^\d{6}$"),
    current_user: UserOut = Depends(get_current_user),
):
    require_municipio_access(ibge, current_user)
    """
    Retorna dados do Componente Vínculo e Acompanhamento Territorial para qualquer município.

    Se as credenciais SIAPS estiverem configuradas (SIAPS_CPF_{ibge} no Railway),
    retorna dados reais da API. Caso contrário, retorna:
      situacao_dado: "nao_disponivel"
      mensagem: "Dado não validado — aguardando acesso ou relatório oficial."
    """
    # Busca em paralelo: SIAPS + IBGE
    vinculo_task = asyncio.create_task(siaps_municipio.buscar_vinculo(ibge, competencia))
    ibge_task    = asyncio.create_task(_populacao_ibge(ibge))

    vinculo_result, ibge_result = await asyncio.gather(vinculo_task, ibge_task)

    equipes      = vinculo_result.get("equipes")
    situacao     = vinculo_result.get("situacao_dado", "nao_disponivel")
    proveniencia = vinculo_result.get("proveniencia", {})
    fonte        = vinculo_result.get("fonte", "indisponivel")

    # Sem dados reais → não inventar
    if not equipes:
        return {
            "municipio_ibge": ibge,
            "competencia": competencia,
            "situacao_dado": "dado_nao_validado",
            "mensagem": (
                vinculo_result.get("mensagem") or
                "Dado não validado — aguardando acesso ou relatório oficial do SIAPS."
            ),
            "proveniencia": proveniencia,
            "instrucao": (
                f"Para obter dados reais, configure no Railway: "
                f"SIAPS_CPF_{ibge} e SIAPS_SENHA_{ibge} (credenciais gov.br do gestor municipal)."
            ),
            "populacao_ibge": ibge_result,
            "consultado_em": _ts(),
        }

    populacao = ibge_result.get("populacao")
    metricas  = _calcular_metricas(equipes, populacao)

    return {
        "municipio_ibge": ibge,
        "competencia": competencia,
        "situacao_dado": situacao,
        "fonte": fonte,
        "proveniencia": proveniencia,
        "populacao_ibge": ibge_result,
        "metricas": metricas,
        "equipes": equipes,
        "aviso_campo_h": metricas.get("nota_h"),
        "aviso_sem_vinculo": metricas.get("nota_sem_vinculo"),
        "consultado_em": _ts(),
    }


@router.get("/{ibge}/status-fontes")
async def cvat_status_fontes(
    ibge: str = Path(..., description="Código IBGE do município", regex=r"^\d{7}$"),
    current_user: UserOut = Depends(get_current_user),
):
    require_municipio_access(ibge, current_user)
    """
    Verifica quais fontes estão configuradas e acessíveis para o município.
    """
    import os

    def _env_ok(nome: str) -> bool:
        return bool(os.getenv(nome, "").strip())

    return {
        "municipio_ibge": ibge,
        "consultado_em": _ts(),
        "fontes": {
            "siaps": {
                "configurado": _env_ok(f"SIAPS_CPF_{ibge}") or _env_ok("SIAPS_CPF") or _env_ok(f"SIAPS_TOKEN_{ibge}") or _env_ok("SIAPS_TOKEN"),
                "env_cpf":    f"SIAPS_CPF_{ibge}",
                "env_senha":  f"SIAPS_SENHA_{ibge}",
                "env_token":  f"SIAPS_TOKEN_{ibge}",
                "instrucao":  "Credenciais gov.br do gestor municipal (Rosangela ou responsável SIAPS)",
            },
            "egestor_aps": {
                "configurado": _env_ok(f"EGESTOR_TOKEN_{ibge}") or _env_ok("EGESTOR_TOKEN"),
                "env_token":  f"EGESTOR_TOKEN_{ibge}",
                "instrucao":  "Token Bearer extraído do e-Gestor APS autenticado",
            },
            "esus_pec": {
                "configurado": _env_ok("ESUS_URL") and (_env_ok(f"ESUS_USUARIO_{ibge}") or _env_ok("ESUS_USUARIO")),
                "env_url":    "ESUS_URL",
                "env_usuario": f"ESUS_USUARIO_{ibge}",
                "env_senha":  f"ESUS_SENHA_{ibge}",
                "instrucao":  "URL + credenciais do PEC local do município",
            },
            "cnes": {
                "configurado": True,
                "acesso":      "api_publica",
                "instrucao":   "API pública DATASUS — sem credenciais necessárias",
            },
            "ibge": {
                "configurado": True,
                "acesso":      "api_publica",
                "instrucao":   "API pública IBGE Agregados — sem credenciais necessárias",
            },
        },
    }
