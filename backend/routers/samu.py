"""SAMU — Serviço de Atendimento Móvel de Urgência · Apuí/AM
1 unidade USB · 1 lancha fluvial (inoperante desde fev/26) · regulação CROSS/AM
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/samu", tags=["samu"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "chamadas_mes": 187,
        "atendimentos_realizados": 164,
        "tempo_resposta_medio_min": 18.4,
        "meta_tempo_resposta_min": 15,
        "taxa_atendimento_pct": 87.7,
        "ambulancias_disponiveis": 1,
        "ambulancias_total": 2,
        "ambulancia_inoperante": 1,
        "lancha_fluvial_operacional": False,
        "lancha_inoperante_desde": "2026-02-12",
        "transferencias_uti_mes": 14,
    }


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "chamadas": 168, "atendimentos": 152, "transferencias": 11, "tempo_medio": 17.1},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "chamadas": 174, "atendimentos": 155, "transferencias": 13, "tempo_medio": 17.8},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "chamadas": 181, "atendimentos": 160, "transferencias": 15, "tempo_medio": 18.0},
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "chamadas": 178, "atendimentos": 157, "transferencias": 12, "tempo_medio": 17.6},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "chamadas": 183, "atendimentos": 161, "transferencias": 13, "tempo_medio": 19.2},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "chamadas": 187, "atendimentos": 164, "transferencias": 14, "tempo_medio": 18.4},
    ]


@router.get("/ocorrencias")
async def ocorrencias():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "natureza": "Trauma (acidentes de moto/trabalho rural)",
            "total": 48,
            "pct": 29,
            "gravidade": "alta",
            "obitos": 1,
            "sbv": 34,
            "sav": 14,
            "transferidos": 12,
        },
        {
            "situacao_dado": "referencia_municipal",
            "natureza": "Clínica médica (descompensação HAS/DM)",
            "total": 42,
            "pct": 26,
            "gravidade": "media",
            "obitos": 0,
            "sbv": 36,
            "sav": 6,
            "transferidos": 4,
        },
        {
            "situacao_dado": "referencia_municipal",
            "natureza": "Intoxicação exógena / Envenenamento",
            "total": 22,
            "pct": 13,
            "gravidade": "alta",
            "obitos": 0,
            "sbv": 14,
            "sav": 8,
            "transferidos": 8,
        },
        {
            "situacao_dado": "referencia_municipal",
            "natureza": "Obstétrica (parto em andamento / eclâmpsia)",
            "total": 18,
            "pct": 11,
            "gravidade": "alta",
            "obitos": 0,
            "sbv": 10,
            "sav": 8,
            "transferidos": 6,
        },
        {
            "situacao_dado": "referencia_municipal",
            "natureza": "Psiquiátrica (surto / automutilação)",
            "total": 16,
            "pct": 10,
            "gravidade": "media",
            "obitos": 0,
            "sbv": 14,
            "sav": 2,
            "transferidos": 3,
        },
        {
            "situacao_dado": "referencia_municipal",
            "natureza": "Afogamento / Acidente fluvial",
            "total": 10,
            "pct": 6,
            "gravidade": "alta",
            "obitos": 1,
            "sbv": 6,
            "sav": 4,
            "transferidos": 4,
        },
        {
            "situacao_dado": "referencia_municipal",
            "natureza": "Parada Cardiorrespiratória",
            "total": 8,
            "pct": 5,
            "gravidade": "alta",
            "obitos": 3,
            "sbv": 2,
            "sav": 6,
            "transferidos": 2,
        },
    ]


@router.get("/veiculos")
async def veiculos():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "veiculo": "USB-01 Apuí — Sprinter 2021",
            "tipo": "USB",
            "status": "operacional",
            "placa": "QRX-4281",
            "ano": 2021,
            "km_mes": 3840,
            "equipamentos_ok": True,
            "observacao": None,
        },
        {
            "situacao_dado": "referencia_municipal",
            "veiculo": "Lancha Fluvial — Rio Madeira",
            "tipo": "Fluvial",
            "status": "inoperante",
            "placa": "AM-0047",
            "ano": 2019,
            "km_mes": 0,
            "equipamentos_ok": False,
            "observacao": "Motor avariado desde 12/02/2026. Comunidades ribeirinhas sem cobertura SAMU. Orçamento de reparo: R$ 28.400 — aguardando empenho.",
        },
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Tempo médio de resposta",
            "valor": 18.4,
            "unidade": "min",
            "meta": 15,
            "status": "atencao",
            "observacao": "Zona rural e comunidades ribeirinhas elevam o tempo médio. Meta: ≤ 15 min (urbano) / ≤ 30 min (rural).",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Taxa de atendimento das chamadas",
            "valor": 87.7,
            "unidade": "%",
            "meta": 95,
            "status": "atencao",
            "observacao": "Trotes e chamadas equivocadas representam ~8% do volume; veículo único limita capacidade simultânea.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Disponibilidade da frota SAMU",
            "valor": 50,
            "unidade": "%",
            "meta": 90,
            "status": "critico",
            "observacao": "Lancha fluvial inoperante há 60 dias reduz cobertura a 50% da frota.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Transferências UTI/mês",
            "valor": 14,
            "unidade": "transf.",
            "meta": None,
            "status": "atencao",
            "observacao": "Todas as transferências para UTI seguem a Humaitá ou Manaus via regulação CROSS/AM.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Óbitos no local da ocorrência/mês",
            "valor": 5,
            "unidade": "óbitos",
            "meta": None,
            "status": "critico",
            "observacao": "PCR (3), afogamento (1), trauma grave (1). Ausência de SAV prejudica sobrevida.",
        },
    ]
