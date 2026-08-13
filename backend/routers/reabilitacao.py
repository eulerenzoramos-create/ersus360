"""
Router: /api/reabilitacao — ERSUS 360
Dados de referência municipal — Apuí/AM
Fisioterapia · Fonoaudiologia · Terapia Ocupacional · CER (referência Humaitá)
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/reabilitacao", tags=["reabilitacao"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "pacientes_ativos": 68,
        "sessoes_mes": 412,
        "lista_espera": 94,
        "tempo_espera_medio_dias": 38,
        "cer_referencia": "CER II — Humaitá/AM (200 km)",
        "modalidades_locais": ["Fisioterapia", "Fonoaudiologia"],
        "modalidades_referencia": ["Terapia Ocupacional", "Psicologia especializada", "Órteses e próteses"],
    }


@router.get("/modalidades")
async def modalidades():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "modalidade": "Fisioterapia Motora",
            "local": "UBS Central Apuí",
            "profissionais": 1,
            "sessoes_mes": 218,
            "pacientes_ativos": 36,
            "lista_espera": 42,
            "tempo_espera_dias": 28,
            "status": "atencao",
        },
        {
            "situacao_dado": "referencia_municipal",
            "modalidade": "Fisioterapia Respiratória",
            "local": "UBS Central Apuí",
            "profissionais": 1,
            "sessoes_mes": 124,
            "pacientes_ativos": 18,
            "lista_espera": 22,
            "tempo_espera_dias": 18,
            "status": "ok",
        },
        {
            "situacao_dado": "referencia_municipal",
            "modalidade": "Fonoaudiologia",
            "local": "UBS Central Apuí",
            "profissionais": 1,
            "sessoes_mes": 70,
            "pacientes_ativos": 14,
            "lista_espera": 18,
            "tempo_espera_dias": 42,
            "status": "atencao",
        },
        {
            "situacao_dado": "referencia_municipal",
            "modalidade": "Terapia Ocupacional",
            "local": "CER II — Humaitá (referência)",
            "profissionais": 0,
            "sessoes_mes": 0,
            "pacientes_ativos": 0,
            "lista_espera": 12,
            "tempo_espera_dias": 90,
            "status": "critico",
        },
    ]


@router.get("/pcd-cadastros")
async def pcd_cadastros():
    return {
        "situacao_dado": "referencia_municipal",
        "competencia": "Mar/2026",
        "total_pcd_cadastrados": 184,
        "por_tipo": [
            {"tipo": "Deficiência física (motora)", "total": 78, "pct": 42.4},
            {"tipo": "Deficiência auditiva", "total": 38, "pct": 20.7},
            {"tipo": "Deficiência intelectual / TEA", "total": 32, "pct": 17.4},
            {"tipo": "Deficiência visual", "total": 22, "pct": 12.0},
            {"tipo": "Deficiência múltipla", "total": 14, "pct": 7.6},
        ],
        "com_beneficio_bpc": 62,
        "em_reabilitacao_ativa": 68,
        "aguardando_avaliacao": 24,
    }


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "sessoes": 368, "pacientes_ativos": 62, "lista_espera": 82},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "sessoes": 380, "pacientes_ativos": 64, "lista_espera": 86},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "sessoes": 342, "pacientes_ativos": 61, "lista_espera": 88},
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "sessoes": 392, "pacientes_ativos": 64, "lista_espera": 90},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "sessoes": 401, "pacientes_ativos": 66, "lista_espera": 92},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "sessoes": 412, "pacientes_ativos": 68, "lista_espera": 94},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Cobertura reabilitação PcD",
            "valor": 37.0,
            "unidade": "%",
            "meta": 60,
            "status": "critico",
            "observacao": "68 de 184 PcD cadastrados em reabilitação ativa. Fila de 94 aguardando.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Tempo de espera para fisioterapia",
            "valor": 28,
            "unidade": "dias",
            "meta": 20,
            "status": "atencao",
            "observacao": "1 fisioterapeuta para pop. de 20 mil. NASF parcialmente supre demanda de APS.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Sessões/paciente/mês (média)",
            "valor": 6.1,
            "unidade": "sessões",
            "meta": 8,
            "status": "atencao",
            "observacao": "Capacidade instalada não permite frequência ideal para reabilitação neurológica.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Terapia Ocupacional local disponível",
            "valor": 0,
            "unidade": "profissional",
            "meta": 1,
            "status": "critico",
            "observacao": "Zero TO no município — referência ao CER II de Humaitá implica deslocamento 200 km.",
        },
    ]
