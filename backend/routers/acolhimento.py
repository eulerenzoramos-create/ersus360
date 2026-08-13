"""
Router: /api/acolhimento — Classificação de Risco · Protocolo Manchester · FMS Apuí/AM
UBS com Pronto-Atendimento — sem UPA. Único ponto de urgência municipal além do SAMU.
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/acolhimento", tags=["acolhimento"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "atendimentos_upa_mes": 1248,
        "atendimentos_classificados_pct": 94.2,
        "vermelho_emergencia": 38,
        "laranja_muito_urgente": 112,
        "amarelo_urgente": 318,
        "verde_pouco_urgente": 548,
        "azul_nao_urgente": 232,
        "tempo_espera_verde_min": 42,
        "meta_verde_min": 120,
        "tempo_espera_amarelo_min": 18,
        "meta_amarelo_min": 30,
        "fuga_antes_atend_pct": 5.8,
        "nota": "UPA não existe — UBS com Pronto-Atendimento 24h. Manchester adaptado.",
    }


@router.get("/fluxo")
async def fluxo():
    return {
        "situacao_dado": "referencia_municipal",
        "competencia": "Mar/2026",
        "por_turno": [
            {"turno": "Manhã (07h–13h)", "atendimentos": 488, "pct": 39.1, "medicos_disponiveis": 2},
            {"turno": "Tarde (13h–19h)", "atendimentos": 412, "pct": 33.0, "medicos_disponiveis": 2},
            {"turno": "Noite (19h–07h)", "atendimentos": 348, "pct": 27.9, "medicos_disponiveis": 1},
        ],
        "por_dia_semana": [
            {"dia": "Seg", "atendimentos": 204},
            {"dia": "Ter", "atendimentos": 188},
            {"dia": "Qua", "atendimentos": 179},
            {"dia": "Qui", "atendimentos": 182},
            {"dia": "Sex", "atendimentos": 196},
            {"dia": "Sáb", "atendimentos": 158},
            {"dia": "Dom", "atendimentos": 141},
        ],
    }


@router.get("/queixas")
async def queixas():
    return [
        {"situacao_dado": "referencia_municipal", "queixa": "Febre / Síndrome gripal", "total": 218, "pct": 17.5, "classificacao_predominante": "verde_pouco_urgente"},
        {"situacao_dado": "referencia_municipal", "queixa": "Dor abdominal", "total": 164, "pct": 13.1, "classificacao_predominante": "amarelo_urgente"},
        {"situacao_dado": "referencia_municipal", "queixa": "Cefaleia", "total": 142, "pct": 11.4, "classificacao_predominante": "verde_pouco_urgente"},
        {"situacao_dado": "referencia_municipal", "queixa": "Dispneia / Dificuldade respiratória", "total": 118, "pct": 9.5, "classificacao_predominante": "amarelo_urgente"},
        {"situacao_dado": "referencia_municipal", "queixa": "Trauma / Acidentes", "total": 104, "pct": 8.3, "classificacao_predominante": "laranja_muito_urgente"},
        {"situacao_dado": "referencia_municipal", "queixa": "Dor torácica", "total": 88, "pct": 7.1, "classificacao_predominante": "laranja_muito_urgente"},
        {"situacao_dado": "referencia_municipal", "queixa": "Crise hipertensiva", "total": 82, "pct": 6.6, "classificacao_predominante": "amarelo_urgente"},
        {"situacao_dado": "referencia_municipal", "queixa": "Transtorno mental agudo", "total": 68, "pct": 5.4, "classificacao_predominante": "amarelo_urgente"},
        {"situacao_dado": "referencia_municipal", "queixa": "Hipoglicemia / Crise diabética", "total": 58, "pct": 4.6, "classificacao_predominante": "laranja_muito_urgente"},
        {"situacao_dado": "referencia_municipal", "queixa": "Outros", "total": 206, "pct": 16.5, "classificacao_predominante": "azul_nao_urgente"},
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "tempo_verde": 38, "tempo_amarelo": 16, "fuga_pct": 4.8},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "tempo_verde": 40, "tempo_amarelo": 17, "fuga_pct": 5.1},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "tempo_verde": 44, "tempo_amarelo": 19, "fuga_pct": 6.2},
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "tempo_verde": 46, "tempo_amarelo": 20, "fuga_pct": 6.8},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "tempo_verde": 43, "tempo_amarelo": 18, "fuga_pct": 5.9},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "tempo_verde": 42, "tempo_amarelo": 18, "fuga_pct": 5.8},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Cobertura de classificação Manchester",
            "valor": 94.2,
            "unidade": "%",
            "meta": 100,
            "status": "atencao",
            "observacao": "5,8% dos atendimentos sem classificação registrada — ocorre principalmente no turno noturno (1 médico).",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Espera média Prioridade Verde (P3)",
            "valor": 42,
            "unidade": "min",
            "meta": 120,
            "status": "ok",
            "observacao": "Dentro do protocolo Manchester (meta ≤ 120 min). Boa agilidade para porte do município.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Espera média Prioridade Amarela (P2)",
            "valor": 18,
            "unidade": "min",
            "meta": 30,
            "status": "ok",
            "observacao": "Abaixo da meta Manchester. Casos urgentes priorizados adequadamente.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Taxa de fuga antes do atendimento",
            "valor": 5.8,
            "unidade": "%",
            "meta": 3,
            "status": "atencao",
            "observacao": "Maioria dos casos de fuga são pacientes classificados como Azul (não urgente) — tempo de espera longo no turno noturno.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Casos Vermelho (Emergência) / mês",
            "valor": 38,
            "unidade": "casos",
            "meta": None,
            "status": "atencao",
            "observacao": "38 emergências/mês sem UTI local. Todos os PCR são regulados via CROSS/AM para Humaitá ou Manaus.",
        },
    ]
