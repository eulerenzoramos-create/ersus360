"""
Router: /api/score — Score ERSUS 360
Índice composto 0–100 calculado a partir dos 5 eixos principais:
  35% APS (Atenção Primária / Previne Brasil)
  25% Financeiro (SIOPS, execução FNS, conformidade)
  20% Epidemiologia (vigilância, cobertura vacinal, agravos)
  10% Gestão (oblrigações cumpridas, documentos, RH)
  10% Infraestrutura (frotas, obras, patrimônio)
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/score", tags=["Score ERSUS 360"])

# ── Pesos ────────────────────────────────────────────────────────────────────

_PESOS = {
    "aps":              0.35,
    "financeiro":       0.25,
    "epidemiologia":    0.20,
    "gestao":           0.10,
    "infraestrutura":   0.10,
}

# ── Componentes de cada eixo ─────────────────────────────────────────────────

def _score_aps() -> dict:
    """
    Score APS = média ponderada dos 7 indicadores Previne Brasil
    + cobertura ESF + coleta de dados SISAB.
    """
    indicadores = [
        {"nome": "Pré-natal ≥ 6 consultas",         "resultado": 84.4, "meta": 60.0},
        {"nome": "Citopatológico do colo do útero",  "resultado": 43.0, "meta": 60.0},
        {"nome": "Vacinação DTP/Penta",              "resultado": 82.9, "meta": 95.0},
        {"nome": "Consulta RN 1ª semana",            "resultado": 91.1, "meta": 60.0},
        {"nome": "HAS acompanhada",                  "resultado": 79.0, "meta": 70.0},
        {"nome": "DM com HbA1c solicitada",          "resultado": 62.7, "meta": 55.0},
        {"nome": "Obesidade infantil IMC",           "resultado": 55.7, "meta": 55.0},
    ]
    pontos = []
    for ind in indicadores:
        pct = min(ind["resultado"] / ind["meta"], 1.0) * 100
        pontos.append({"nome": ind["nome"], "resultado": ind["resultado"], "meta": ind["meta"], "pct_meta": round(pct, 1)})

    score_previne = sum(p["pct_meta"] for p in pontos) / len(pontos)
    cobertura_esf = 68.4          # % cobertura ESF Apuí
    sisab_regularidade = 90.0     # % meses com envio regular

    score_final = (score_previne * 0.70) + (cobertura_esf * 0.20) + (sisab_regularidade * 0.10)
    return {
        "score": round(min(score_final, 100), 1),
        "subcomponentes": {
            "previne_brasil":      round(score_previne, 1),
            "cobertura_esf":       cobertura_esf,
            "sisab_regularidade":  sisab_regularidade,
        },
        "indicadores": pontos,
        "peso": _PESOS["aps"],
    }


def _score_financeiro() -> dict:
    """
    Score Financeiro = execução FNS + conformidade SIOPS + proporção recursos próprios.
    """
    execucao_fns_pct   = 73.8   # % despesa realizada / prevista
    proprio_saude_pct  = 17.16  # % recursos próprios aplicados em saúde (meta >= 15%)
    siops_conformidade = 100.0  # enviou SIOPS no prazo?
    pendencias_fns     = 0      # número de pendências FNS em aberto

    # Penalidade por cada pendência FNS
    penalidade = min(pendencias_fns * 5, 30)

    score_final = (
        execucao_fns_pct       * 0.50 +
        min(proprio_saude_pct / 15.0 * 100, 100) * 0.25 +
        siops_conformidade     * 0.25
    ) - penalidade

    return {
        "score": round(max(min(score_final, 100), 0), 1),
        "subcomponentes": {
            "execucao_fns_pct":      execucao_fns_pct,
            "proprio_saude_pct":     proprio_saude_pct,
            "siops_conformidade":    siops_conformidade,
            "pendencias_fns":        pendencias_fns,
        },
        "peso": _PESOS["financeiro"],
    }


def _score_epidemiologia() -> dict:
    """
    Score Epidemiologia = notificação de agravos + cobertura vacinal + IPA malária.
    """
    notificacao_oportuna_pct = 78.0  # % notificações dentro de 7 dias
    cobertura_vacinal_pct    = 82.9  # vacinação rotina (mesmo do Previne)
    ipa_malaria_controle     = 75.0  # % redução IPA vs ano anterior (meta 80%)
    dengue_confirmados       = 3     # casos confirmados dengue (baixo = bom)

    # IPA: score relativo à meta 80%
    ipa_score = min(ipa_malaria_controle / 80.0 * 100, 100)
    dengue_score = max(100 - (dengue_confirmados * 5), 60)  # nunca abaixo de 60

    score_final = (
        notificacao_oportuna_pct * 0.35 +
        cobertura_vacinal_pct    * 0.35 +
        ipa_score                * 0.20 +
        dengue_score             * 0.10
    )
    return {
        "score": round(min(score_final, 100), 1),
        "subcomponentes": {
            "notificacao_oportuna_pct": notificacao_oportuna_pct,
            "cobertura_vacinal_pct":    cobertura_vacinal_pct,
            "ipa_malaria_controle":     ipa_malaria_controle,
            "dengue_confirmados":       dengue_confirmados,
        },
        "peso": _PESOS["epidemiologia"],
    }


def _score_gestao() -> dict:
    """
    Score Gestão = cumprimento de obrigações legais + RH + documentação.
    """
    obrigacoes_cumpridas_pct = 66.7  # 4/6 obrigações da agenda CMS
    servidores_regulares_pct = 88.0  # sem pendências funcionais
    documentos_assinados_pct = 75.0  # documentos com status assinado
    rdqa_em_dia             = True

    rdqa_bonus = 5 if rdqa_em_dia else 0
    score_final = (
        obrigacoes_cumpridas_pct * 0.40 +
        servidores_regulares_pct * 0.30 +
        documentos_assinados_pct * 0.30
    ) + rdqa_bonus

    return {
        "score": round(min(score_final, 100), 1),
        "subcomponentes": {
            "obrigacoes_cumpridas_pct":  obrigacoes_cumpridas_pct,
            "servidores_regulares_pct":  servidores_regulares_pct,
            "documentos_assinados_pct":  documentos_assinados_pct,
            "rdqa_em_dia":               rdqa_em_dia,
        },
        "peso": _PESOS["gestao"],
    }


def _score_infraestrutura() -> dict:
    """
    Score Infraestrutura = frota operacional + obras em andamento + patrimônio regular.
    """
    frota_operacional_pct = 75.0  # 6/8 veículos operacionais
    obras_no_prazo_pct    = 50.0  # obras dentro do cronograma
    patrimonio_regular_pct = 90.0 # itens com inventário regular

    score_final = (
        frota_operacional_pct  * 0.40 +
        obras_no_prazo_pct     * 0.30 +
        patrimonio_regular_pct * 0.30
    )
    return {
        "score": round(min(score_final, 100), 1),
        "subcomponentes": {
            "frota_operacional_pct":   frota_operacional_pct,
            "obras_no_prazo_pct":      obras_no_prazo_pct,
            "patrimonio_regular_pct":  patrimonio_regular_pct,
        },
        "peso": _PESOS["infraestrutura"],
    }


def _classificar(score: float) -> dict:
    if score >= 80:
        return {"nivel": "Excelente",  "cor": "#16a34a", "emoji": "🏆"}
    if score >= 65:
        return {"nivel": "Bom",        "cor": "#2563eb", "emoji": "✅"}
    if score >= 50:
        return {"nivel": "Regular",    "cor": "#d97706", "emoji": "⚠️"}
    return     {"nivel": "Crítico",    "cor": "#dc2626", "emoji": "🚨"}


def calcular_score_completo() -> dict:
    """Calcula e retorna o Score ERSUS 360 completo."""
    aps   = _score_aps()
    fin   = _score_financeiro()
    epi   = _score_epidemiologia()
    gest  = _score_gestao()
    infra = _score_infraestrutura()

    eixos = {
        "aps":            aps,
        "financeiro":     fin,
        "epidemiologia":  epi,
        "gestao":         gest,
        "infraestrutura": infra,
    }

    score_total = sum(e["score"] * e["peso"] for e in eixos.values())
    score_total = round(score_total, 1)
    classif = _classificar(score_total)

    # Variação histórica (referência)
    historico = [
        {"mes": "Jan/26", "score": 54.2},
        {"mes": "Fev/26", "score": 58.7},
        {"mes": "Mar/26", "score": 61.3},
        {"mes": "Abr/26", "score": 63.1},
        {"mes": "Mai/26", "score": 65.8},
        {"mes": "Jun/26", "score": 67.4},
        {"mes": "Jul/26", "score": score_total},
    ]

    # Benchmarks (AM e Nacional)
    benchmarks = {
        "municipio": {"nome": "Apuí/AM",        "score": score_total},
        "estado_am": {"nome": "Média AM",        "score": 61.2},
        "nacional":  {"nome": "Média Nacional",  "score": 63.8},
    }

    return {
        "score_total":  score_total,
        "nivel":        classif["nivel"],
        "cor":          classif["cor"],
        "emoji":        classif["emoji"],
        "eixos":        eixos,
        "historico":    historico,
        "benchmarks":   benchmarks,
        "calculado_em": datetime.utcnow().isoformat() + "Z",
        "municipio":    "Apuí",
        "uf":           "AM",
        "ibge":         "1300144",
        "fonte":        "referencia",
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("")
async def get_score(_: UserOut = Depends(get_current_user)):
    """Score ERSUS 360 atual com detalhamento por eixo."""
    return calcular_score_completo()


@router.get("/resumo")
async def get_score_resumo(_: UserOut = Depends(get_current_user)):
    """Versão resumida para widgets de dashboard."""
    data = calcular_score_completo()
    return {
        "score_total":  data["score_total"],
        "nivel":        data["nivel"],
        "cor":          data["cor"],
        "emoji":        data["emoji"],
        "calculado_em": data["calculado_em"],
        "eixos_resumo": {
            k: {"score": v["score"], "peso": v["peso"]}
            for k, v in data["eixos"].items()
        },
    }
