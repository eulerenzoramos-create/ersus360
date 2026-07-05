"""SAMU — Serviço de Atendimento Móvel de Urgência · RUTE · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/samu", tags=["samu"])

@router.get("/dashboard")
async def dashboard():
    return {
        "chamadas_mes": 284,
        "atendimentos_realizados": 248,
        "taxa_atendimento_pct": 87.3,
        "tempo_resposta_medio_min": 18.4,
        "meta_tempo_resposta_min": 15,
        "ambulancias_disponiveis": 3,
        "ambulancias_total": 4,
        "ambulancia_inoperante": 1,
        "pacientes_transferidos_uti": 38,
        "regulacoes_aceitas_manaus": 28,
        "obitos_via_samu": 4,
        "suporte_basico_pct": 68.2,
        "suporte_avancado_pct": 31.8,
        "status_geral": "atencao",
    }

@router.get("/ocorrencias")
async def ocorrencias():
    return [
        {"natureza": "Trauma / acidente de trânsito",    "total": 68,  "pct": 27.4, "sbv": 42, "sav": 26, "obitos": 1, "transferidos": 12, "gravidade": "alta"},
        {"natureza": "Emergência clínica (IAM/AVC)",      "total": 54,  "pct": 21.8, "sbv": 28, "sav": 26, "obitos": 2, "transferidos": 16, "gravidade": "alta"},
        {"natureza": "Acidente de trabalho / agressão",  "total": 38,  "pct": 15.3, "sbv": 30, "sav": 8,  "obitos": 0, "transferidos": 4,  "gravidade": "media"},
        {"natureza": "Afogamento / acidente fluvial",    "total": 28,  "pct": 11.3, "sbv": 18, "sav": 10, "obitos": 1, "transferidos": 6,  "gravidade": "alta"},
        {"natureza": "Intoxicação exógena",              "total": 22,  "pct": 8.9,  "sbv": 16, "sav": 6,  "obitos": 0, "transferidos": 2,  "gravidade": "media"},
        {"natureza": "Parto / urgência obstétrica",      "total": 18,  "pct": 7.3,  "sbv": 12, "sav": 6,  "obitos": 0, "transferidos": 8,  "gravidade": "alta"},
        {"natureza": "Queda / trauma ortopédico",        "total": 14,  "pct": 5.6,  "sbv": 12, "sav": 2,  "obitos": 0, "transferidos": 2,  "gravidade": "media"},
        {"natureza": "Outras",                           "total": 6,   "pct": 2.4,  "sbv": 6,  "sav": 0,  "obitos": 0, "transferidos": 0,  "gravidade": "baixa"},
    ]

@router.get("/veiculos")
async def veiculos():
    return [
        {"veiculo": "USA-01 — Unidade Suporte Avançado", "tipo": "SAV", "placa": "QPN-4821", "ano": 2022, "km_mes": 2480, "status": "operacional", "km_revisao": 5000, "ultima_revisao_km": 42800, "equipamentos_ok": True,  "observacao": None},
        {"veiculo": "USB-01 — Unidade Suporte Básico 1", "tipo": "SBV", "placa": "QPN-4822", "ano": 2020, "km_mes": 1840, "status": "operacional", "km_revisao": 5000, "ultima_revisao_km": 38600, "equipamentos_ok": True,  "observacao": None},
        {"veiculo": "USB-02 — Unidade Suporte Básico 2", "tipo": "SBV", "placa": "QPN-4823", "ano": 2021, "km_mes": 1640, "status": "operacional", "km_revisao": 5000, "ultima_revisao_km": 40200, "equipamentos_ok": False, "observacao": "Desfibrilador com bateria fraca — substituição solicitada"},
        {"veiculo": "Lancha SAMU — Rio Madeira",         "tipo": "SBV", "placa": "AM-48264",  "ano": 2019, "km_mes": 0,    "status": "inoperante",  "km_revisao": None, "ultima_revisao_km": None,   "equipamentos_ok": False, "observacao": "Motor avariado desde 12/02/2026 — impossibilita atendimento em comunidades ribeirinhas"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "chamadas": 248, "atendimentos": 216, "tempo_medio": 20.2, "transferencias": 32, "obitos": 2},
        {"mes": "Nov/25", "chamadas": 258, "atendimentos": 224, "tempo_medio": 19.8, "transferencias": 34, "obitos": 3},
        {"mes": "Dez/25", "chamadas": 276, "atendimentos": 238, "tempo_medio": 18.8, "transferencias": 36, "obitos": 3},
        {"mes": "Jan/26", "chamadas": 264, "atendimentos": 228, "tempo_medio": 19.4, "transferencias": 34, "obitos": 4},
        {"mes": "Fev/26", "chamadas": 272, "atendimentos": 236, "tempo_medio": 18.6, "transferencias": 36, "obitos": 3},
        {"mes": "Mar/26", "chamadas": 284, "atendimentos": 248, "tempo_medio": 18.4, "transferencias": 38, "obitos": 4},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Tempo médio de resposta",                "valor": 18.4, "meta": 15,  "unidade": "min","status": "atencao",  "observacao": "Zona rural: média 28 min — distância e estradas"},
        {"indicador": "Lancha fluvial inoperante",              "valor": 1,    "meta": 0,   "unidade": "un", "status": "critico",  "observacao": "Desde 12/02/2026 — comunidades ribeirinhas sem cobertura SAMU"},
        {"indicador": "Taxa de atendimento de chamadas",        "valor": 87.3, "meta": 95,  "unidade": "%",  "status": "atencao",  "observacao": "248 atendidos de 284 acionamentos — 36 sem resposta"},
        {"indicador": "Transferências UTI aceitas em Manaus",   "valor": 28,   "meta": None,"unidade": "un", "status": "ok",       "observacao": "Regulação Central AM — média 1,3 dias para vaga"},
        {"indicador": "Desfibrilador USB-02 com defeito",       "valor": 1,    "meta": 0,   "unidade": "un", "status": "atencao",  "observacao": "Bateria fraca — viaturas devem portar equip. reserva"},
        {"indicador": "Óbitos atendidos via SAMU",              "valor": 4,    "meta": None,"unidade": "un", "status": "ok",       "observacao": "Não acionável — indica gravidade das ocorrências locais"},
    ]
