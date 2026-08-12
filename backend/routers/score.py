"""
Router: /api/score — Score ERSUS 360
Índice composto 0–100 calculado sobre dados REAIS das APIs públicas.

Regras de dados:
  - Cada métrica carrega situacao_dado explícito.
  - Valores sem API pública disponível = situacao_dado: "nao_disponivel".
  - Nenhum número é inventado — fallback = ausência declarada, nunca estimativa silenciosa.
  - random() e valores hardcoded de desempenho são PROIBIDOS.

Pesos dos eixos:
  35% APS          — Previne Brasil (API pública) + SISAB regularidade (API pública)
  25% Financeiro   — SIOPS mínimo constitucional (API pública) + execução FNS (sem API = nao_disponivel)
  20% Epidemiologia— sem API pública nacional consolidada → nao_disponivel
  10% Gestão       — sem API pública nacional consolidada → nao_disponivel
  10% Infra        — sem API pública nacional consolidada → nao_disponivel
"""
from __future__ import annotations
import asyncio
import logging
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services import previne_service, siops_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/score", tags=["Score ERSUS 360"])

_IBGE = "1300144"

# ── Pesos ─────────────────────────────────────────────────────────────────────

PESOS = {
    "aps":            0.35,
    "financeiro":     0.25,
    "epidemiologia":  0.20,
    "gestao":         0.10,
    "infraestrutura": 0.10,
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _metrica(label: str, valor: Any, situacao: str, obs: str = "") -> dict:
    return {"label": label, "valor": valor, "situacao_dado": situacao, "observacao": obs}


def _classificar(score: float) -> dict:
    if score >= 80:
        return {"nivel": "Excelente", "cor": "#16a34a"}
    if score >= 65:
        return {"nivel": "Bom",       "cor": "#2563eb"}
    if score >= 50:
        return {"nivel": "Regular",   "cor": "#d97706"}
    return     {"nivel": "Critico",   "cor": "#dc2626"}


# ── Eixo APS ─────────────────────────────────────────────────────────────────

async def _score_aps(ibge: str) -> dict:
    """
    Score APS baseado nos indicadores Previne Brasil (API gov.br pública).
    Cobertura ESF e regularidade SISAB: situacao_dado nao_disponivel (sem API pública).
    """
    hoje = date.today()
    comp = f"{hoje.year}{hoje.month:02d}"
    previne = await previne_service.buscar_indicadores(comp)

    indicadores_raw = previne.get("indicadores", [])
    fonte_previne = previne.get("fonte", "nao_disponivel")
    sit_previne = "oficial_validado" if fonte_previne not in ("referencia", None, "") else "nao_disponivel"

    pontos = []
    for ind in indicadores_raw:
        resultado = ind.get("resultado_pct")
        meta = ind.get("meta_pct", 60.0)
        if resultado is not None and meta:
            pct = min(resultado / meta, 1.0) * 100
        else:
            pct = None
        pontos.append({
            "nome":           ind.get("nome", ""),
            "resultado_pct":  resultado,
            "meta_pct":       meta,
            "pct_meta":       round(pct, 1) if pct is not None else None,
            "situacao_dado":  sit_previne,
        })

    if pontos and all(p["pct_meta"] is not None for p in pontos):
        score_previne = sum(p["pct_meta"] for p in pontos) / len(pontos)
        score_final = round(min(score_previne, 100), 1)
    else:
        score_final = None

    metricas = {
        "previne_brasil": _metrica(
            "Indicadores Previne Brasil",
            round(score_previne, 1) if pontos and score_final else None,
            sit_previne,
            obs=f"API Previne ({comp}) — {len(pontos)} indicadores" if pontos else
                "API Previne não retornou indicadores para esta competência.",
        ),
        "cobertura_esf": _metrica(
            "Cobertura ESF (%)",
            None,
            "nao_disponivel",
            obs="Sem API pública nacional para cobertura ESF por município em tempo real.",
        ),
        "sisab_regularidade": _metrica(
            "Regularidade SISAB (%)",
            None,
            "nao_disponivel",
            obs="Consultar SISAB diretamente — sem API pública automatizada disponível.",
        ),
    }

    return {
        "score":             score_final,
        "situacao_dado":     sit_previne if score_final is not None else "nao_disponivel",
        "metricas":          metricas,
        "indicadores_raw":   pontos,
        "peso":              PESOS["aps"],
        "contribuicao":      round(score_final * PESOS["aps"], 2) if score_final else None,
        "nota":              "Score calculado apenas sobre indicadores Previne com dado disponível.",
    }


# ── Eixo Financeiro ───────────────────────────────────────────────────────────

async def _score_financeiro(ibge: str) -> dict:
    """
    Score Financeiro: apenas mínimo constitucional via SIOPS tem API pública.
    Execução FNS e conformidade não têm API pública por município → nao_disponivel.
    """
    hoje = date.today()
    siops = await siops_service.buscar_apuracao(hoje.year)
    fonte_siops = siops.get("fonte", "nao_disponivel")
    sit_siops = "oficial_validado" if fonte_siops not in ("referencia", None, "") else "nao_disponivel"

    proprio_pct = siops.get("minimo_constitucional_pct_aplicado")
    score_proprio = min(float(proprio_pct) / 15.0 * 100, 100) if proprio_pct else None

    metricas = {
        "minimo_constitucional": _metrica(
            "Mínimo Constitucional Saúde (%)",
            proprio_pct,
            sit_siops,
            obs=f"SIOPS {hoje.year} — fonte: {fonte_siops}",
        ),
        "execucao_fns": _metrica(
            "Execução Orçamentária FNS (%)",
            None,
            "nao_disponivel",
            obs="Sem API pública FNS por município disponível para extração automática.",
        ),
        "siops_conformidade": _metrica(
            "Conformidade SIOPS (%)",
            None,
            "nao_disponivel",
            obs="Verificar SIOPS manualmente — sem API de conformidade municipal.",
        ),
    }

    score_final = round(score_proprio, 1) if score_proprio is not None else None

    return {
        "score":         score_final,
        "situacao_dado": sit_siops if score_final is not None else "nao_disponivel",
        "metricas":      metricas,
        "peso":          PESOS["financeiro"],
        "contribuicao":  round(score_final * PESOS["financeiro"], 2) if score_final else None,
        "nota":          "Score financeiro calculado apenas sobre dado SIOPS disponível.",
    }


# ── Eixos sem API pública ─────────────────────────────────────────────────────

def _eixo_sem_api(nome: str) -> dict:
    peso = PESOS[nome]
    return {
        "score":         None,
        "situacao_dado": "nao_disponivel",
        "metricas":      {},
        "peso":          peso,
        "contribuicao":  None,
        "nota":          (
            f"Eixo {nome} requer integração com sistemas locais ou estaduais. "
            "Nenhuma API pública nacional fornece estes dados por município automaticamente. "
            "Registre os dados via formulário de entrada manual quando disponíveis."
        ),
    }


# ── Cálculo consolidado ───────────────────────────────────────────────────────

async def calcular_score_completo(ibge: str = _IBGE) -> dict:
    aps, fin = await asyncio.gather(_score_aps(ibge), _score_financeiro(ibge))

    eixos = {
        "aps":            aps,
        "financeiro":     fin,
        "epidemiologia":  _eixo_sem_api("epidemiologia"),
        "gestao":         _eixo_sem_api("gestao"),
        "infraestrutura": _eixo_sem_api("infraestrutura"),
    }

    # Soma ponderada apenas dos eixos com dado real
    soma_pesos_validos = 0.0
    soma_score_pond   = 0.0
    for e in eixos.values():
        if e["score"] is not None:
            soma_score_pond += e["score"] * e["peso"]
            soma_pesos_validos += e["peso"]

    if soma_pesos_validos > 0:
        score_total = round(soma_score_pond / soma_pesos_validos * (soma_pesos_validos / 1.0), 2)
        score_total = round(min(score_total, 100), 1)
        sit_geral = "dado_nao_validado"
        for e in eixos.values():
            if e["situacao_dado"] == "oficial_validado":
                sit_geral = "oficial_validado"
                break
    else:
        score_total = None
        sit_geral = "nao_disponivel"

    classif = _classificar(score_total) if score_total else {"nivel": "Sem dado", "cor": "#94a3b8"}

    return {
        "score_total":    score_total,
        "situacao_dado":  sit_geral,
        "nivel":          classif["nivel"],
        "cor":            classif["cor"],
        "eixos":          eixos,
        "municipio":      "Apuí",
        "uf":             "AM",
        "ibge":           ibge,
        "calculado_em":   _ts(),
        "nota":           (
            "Score parcial — apenas eixos com dado real de API pública são incluídos. "
            "Eixos epidemiologia, gestão e infraestrutura aguardam integração local."
        ),
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
async def get_score(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """Score ERSUS 360 atual com detalhamento por eixo e situacao_dado por métrica."""
    return await calcular_score_completo(ibge)


@router.get("/resumo")
async def get_score_resumo(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """Versão resumida para widgets de dashboard."""
    data = await calcular_score_completo(ibge)
    return {
        "score_total":   data["score_total"],
        "situacao_dado": data["situacao_dado"],
        "nivel":         data["nivel"],
        "cor":           data["cor"],
        "calculado_em":  data["calculado_em"],
        "nota":          data["nota"],
        "eixos_resumo":  {
            k: {
                "score":         v["score"],
                "peso":          v["peso"],
                "situacao_dado": v["situacao_dado"],
            }
            for k, v in data["eixos"].items()
        },
    }
