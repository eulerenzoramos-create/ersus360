"""
Router: /api/controle-vetorial-apui — ERSUS 360
Controle Vetorial — LIRAa · Aedes aegypti · Anopheles (Malária) · FMS Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
Perfil AM: endemia malária, dengue sazonal, Apuí zona endêmica Amazônia
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/controle-vetorial-apui", tags=["Controle Vetorial Apuí"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jun 2026",
        "liraa_atual": "LIRAa 2T/2026 — Jun/2026",
        "indice_infestacao_predial_pct": 3.8,
        "indice_breteau": 5.2,
        "nivel_alerta": "risco",
        "agentes_controle_vetores": 6,
        "quarteiroes_trabalhados_mes": 284,
        "imoveis_inspecionados_mes": 3840,
        "focos_aedes_eliminados_mes": 482,
        "nebulizacoes_mes": 4,
        "casos_dengue_acumulados_ano": 214,
        "casos_malaria_acumulados_ano": 848,
        "anopheles_capturas_mes": 38,
        "nota": "Referência baseada em PNCD e SIVEP-Malária para municípios amazônicos ~20 mil hab.",
    }


@router.get("/liraa")
async def liraa():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "liraa": "LIRAa 2T/2026 — Jun/2026",
        "indice_infestacao_predial_pct": 3.8,
        "indice_breteau": 5.2,
        "classificacao": "Risco (IIP 1,0–3,9%)",
        "imoveis_pesquisados": 3840,
        "imoveis_com_larvas": 146,
        "depositos_positivos_total": 270,
        "depositos_por_tipo": [
            {"tipo": "A1 — Caixas d'água descobertas",    "positivos": 62,  "pct": 23.0, "status": "critico"},
            {"tipo": "A2 — Barris/tonéis/tambores",       "positivos": 48,  "pct": 17.8, "status": "atencao"},
            {"tipo": "B — Móveis/utensílios domésticos",  "positivos": 54,  "pct": 20.0, "status": "atencao"},
            {"tipo": "C — Recipientes fixos (pneu/lixo)", "positivos": 72,  "pct": 26.7, "status": "critico"},
            {"tipo": "D1 — Borracharia / pneu",           "positivos": 22,  "pct": 8.1,  "status": "atencao"},
            {"tipo": "E — Natural (bromeliáceas/árvore)",  "positivos": 12,  "pct": 4.4,  "status": "ok"},
        ],
        "bairros_criticos": ["Bairro Novo", "Vila Aparecida", "PA Princesa do Sul"],
        "historico_liraa": [
            {"periodo": "1T/2025", "iip_pct": 4.8, "breteau": 6.2, "classificacao": "Risco"},
            {"periodo": "2T/2025", "iip_pct": 5.4, "breteau": 7.4, "classificacao": "Alto risco"},
            {"periodo": "3T/2025", "iip_pct": 4.2, "breteau": 5.8, "classificacao": "Risco"},
            {"periodo": "4T/2025", "iip_pct": 3.4, "breteau": 4.6, "classificacao": "Alerta"},
            {"periodo": "1T/2026", "iip_pct": 3.6, "breteau": 4.8, "classificacao": "Alerta"},
            {"periodo": "2T/2026", "iip_pct": 3.8, "breteau": 5.2, "classificacao": "Risco"},
        ],
        "nota": "IIP abaixo de 4% — zona de risco. Estação chuvosa (Dez–Abr) eleva para alto risco.",
    }


@router.get("/nebulizacoes")
async def nebulizacoes():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "nebulizacoes_total_semestre": 22,
        "nebulizacoes_costal": 14,
        "nebulizacoes_UBV_moto": 8,
        "inseticidas_utilizados": ["Malathion CE 44%", "Cifenotrina 15% CE"],
        "ciclos_mes": [
            {"mes": "Jan/26", "nebulizacoes": 6, "motivo": "Surto dengue — bairros críticos", "status": "emergencia"},
            {"mes": "Fev/26", "nebulizacoes": 5, "motivo": "Continuidade bloqueio — dengue", "status": "emergencia"},
            {"mes": "Mar/26", "nebulizacoes": 4, "motivo": "Manutenção controle",            "status": "rotina"},
            {"mes": "Abr/26", "nebulizacoes": 3, "motivo": "Manutenção controle",            "status": "rotina"},
            {"mes": "Mai/26", "nebulizacoes": 2, "motivo": "Manutenção — estação seca início","status": "rotina"},
            {"mes": "Jun/26", "nebulizacoes": 2, "motivo": "Estação seca — rotina",          "status": "rotina"},
        ],
        "km_percorridos_UBV": 384,
        "cobertura_bairros_pct": 78.4,
        "equipamentos": [
            {"equipamento": "Pulverizador costal 12L", "unidades": 6, "operacional_pct": 100},
            {"equipamento": "Moto UBV (nebulizador)", "unidades": 1, "operacional_pct": 100},
            {"equipamento": "Veiculo UBV pesado",     "unidades": 0, "operacional_pct": 0, "observacao": "Sem veículo UBV pesado — solicitação pendente SES-AM"},
        ],
        "nota": "Referência municipal Apuí/AM.",
    }


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "ano": 2023, "casos_dengue": 142, "casos_malaria": 924, "iip_medio_pct": 4.2, "nebulizacoes": 28, "agentes_acv": 6},
        {"situacao_dado": "referencia_municipal", "ano": 2024, "casos_dengue": 184, "casos_malaria": 886, "iip_medio_pct": 4.6, "nebulizacoes": 32, "agentes_acv": 6},
        {"situacao_dado": "referencia_municipal", "ano": 2025, "casos_dengue": 196, "casos_malaria": 848, "iip_medio_pct": 4.1, "nebulizacoes": 38, "agentes_acv": 6},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "IIP — Índice Infestação Predial (%)",     "valor": 3.8,  "meta": 1.0,  "unidade": "%",     "status": "atencao", "observacao": "Zona de risco (1–3,9%). Acima de 4% = alto risco (surto eminente)."},
        {"situacao_dado": "referencia_municipal", "indicador": "Índice Breteau",                          "valor": 5.2,  "meta": 1.0,  "unidade": "depósitos/100im","status": "atencao","observacao": "5,2 depósitos positivos/100 imóveis. Meta MS: <1."},
        {"situacao_dado": "referencia_municipal", "indicador": "Casos Dengue Acumulados/ano",             "valor": 214,  "meta": None, "unidade": "casos",  "status": "critico", "observacao": "Surto Jan–Mar/26 (DENV-1/3). Incidência 1.070/100 mil."},
        {"situacao_dado": "referencia_municipal", "indicador": "Casos Malária P. vivax/ano",              "valor": 848,  "meta": None, "unidade": "casos",  "status": "critico", "observacao": "IPA = 42,4/1.000 hab — endêmico. SIVEP ativo. Garimpo fator de risco."},
        {"situacao_dado": "referencia_municipal", "indicador": "Imóveis Inspecionados/mês",               "valor": 3840, "meta": 4200, "unidade": "imóveis","status": "atencao", "observacao": "91,4% da meta — zona rural descoberta (acesso balsas)."},
        {"situacao_dado": "referencia_municipal", "indicador": "Cobertura Nebulização (%)",               "valor": 78.4, "meta": 100,  "unidade": "%",      "status": "atencao", "observacao": "Sem UBV pesado — periferia e assentamentos não cobertos."},
        {"situacao_dado": "referencia_municipal", "indicador": "Agentes de Controle de Vetores (ACV)",    "valor": 6,    "meta": 8,    "unidade": "agentes","status": "atencao", "observacao": "Déficit de 2 agentes — área rural extensa (11.200 km² município)."},
    ]
