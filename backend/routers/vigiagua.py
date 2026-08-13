"""
Router: /api/vigiagua — ERSUS 360
VigiÁgua — Qualidade da Água · SISÁGUA · FMS Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/vigiagua", tags=["vigiagua"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jun 2026",
        "populacao_abastecida_sistema_pct": 64.2,
        "populacao_solucao_alternativa_pct": 35.8,
        "amostras_coletadas_mes": 48,
        "amostras_conformes_pct": 82.4,
        "amostras_cloro_residual_ok_pct": 84.2,
        "amostras_turbidez_ok_pct": 88.4,
        "amostras_coliformes_totais_ok_pct": 78.4,
        "amostras_e_coli_ausente_pct": 88.4,
        "sisagua_registros_atualizados": True,
        "nota": "Referência baseada em parâmetros VIGIAGUA para municípios amazônicos com infraestrutura hídrica limitada.",
    }


@router.get("/sistemas")
async def sistemas():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "sistema": "SAA — Sistema de Abastecimento de Água (CAEMA/COSAMA)",
            "tipo": "SAA",
            "populacao_abastecida": 11840,
            "ligacoes_ativas": 3240,
            "tratamento": "Coagulação + filtração + cloração + fluoretação",
            "continuidade_horas_dia": 16,
            "indice_conformidade_mes_pct": 84.2,
            "status": "atencao",
            "observacao": "Abastecimento 16h/dia — interrupções noturnas. Vazamentos na rede estimados em 38%.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "sistema": "SAC — Soluções Alternativas Coletivas (SAC rurais)",
            "tipo": "SAC",
            "populacao_abastecida": 4800,
            "ligacoes_ativas": 0,
            "tratamento": "Cloração simples (hipoclorito sódio)",
            "continuidade_horas_dia": 24,
            "indice_conformidade_mes_pct": 68.4,
            "status": "critico",
            "observacao": "Comunidades ribeirinhas e PA. Cloração manual — alto risco de falha.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "sistema": "SAI — Soluções Alternativas Individuais (poços, cacimbas)",
            "tipo": "SAI",
            "populacao_abastecida": 3360,
            "ligacoes_ativas": 0,
            "tratamento": "Sem tratamento formal",
            "continuidade_horas_dia": 24,
            "indice_conformidade_mes_pct": 42.4,
            "status": "critico",
            "observacao": "Zona rural afastada. E. coli em 57,6% das amostras coletadas em visita.",
        },
    ]


@router.get("/parametros")
async def parametros():
    return [
        {"situacao_dado": "referencia_municipal", "parametro": "Cloro Residual Livre (0,2–5 mg/L)",    "amostras": 48, "conforme": 41, "nao_conforme": 7, "conformidade_pct": 84.2, "risco": "Subdosagem → risco microbiológico",   "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "parametro": "Turbidez (≤1 NTU saída / ≤5 NTU rede)","amostras": 48, "conforme": 43, "nao_conforme": 5, "conformidade_pct": 88.4, "risco": "Chuva intensa eleva turbidez",        "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "parametro": "Coliformes Totais (ausência/100mL)",    "amostras": 48, "conforme": 38, "nao_conforme": 10,"conformidade_pct": 79.2, "risco": "Contaminação cruzada na distribuição","status": "critico"},
        {"situacao_dado": "referencia_municipal", "parametro": "Escherichia coli (ausência/100mL)",     "amostras": 48, "conforme": 43, "nao_conforme": 5, "conformidade_pct": 89.6, "risco": "Contaminação fecal — risco grave",    "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "parametro": "Fluoreto (0,6–0,9 mg/L)",               "amostras": 24, "conforme": 22, "nao_conforme": 2, "conformidade_pct": 91.7, "risco": "Déficit cárie / excesso fluorose",    "status": "ok"},
        {"situacao_dado": "referencia_municipal", "parametro": "pH (6,0–9,5)",                          "amostras": 48, "conforme": 48, "nao_conforme": 0, "conformidade_pct": 100,  "risco": "Sem risco identificado",             "status": "ok"},
        {"situacao_dado": "referencia_municipal", "parametro": "Mercúrio (≤0,001 mg/L) — garimpo",     "amostras": 4,  "conforme": 3,  "nao_conforme": 1, "conformidade_pct": 75.0, "risco": "Contaminação garimpo Rio Juma",      "status": "critico"},
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "amostras": 42, "conformidade_pct": 80.2, "e_coli_ausente_pct": 85.7, "turbidez_ok_pct": 84.8},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "amostras": 44, "conformidade_pct": 79.8, "e_coli_ausente_pct": 86.4, "turbidez_ok_pct": 81.8},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "amostras": 46, "conformidade_pct": 80.8, "e_coli_ausente_pct": 87.0, "turbidez_ok_pct": 84.8},
        {"situacao_dado": "referencia_municipal", "mes": "Abr/26", "amostras": 48, "conformidade_pct": 81.4, "e_coli_ausente_pct": 87.5, "turbidez_ok_pct": 87.5},
        {"situacao_dado": "referencia_municipal", "mes": "Mai/26", "amostras": 48, "conformidade_pct": 82.0, "e_coli_ausente_pct": 88.0, "turbidez_ok_pct": 87.5},
        {"situacao_dado": "referencia_municipal", "mes": "Jun/26", "amostras": 48, "conformidade_pct": 82.4, "e_coli_ausente_pct": 89.6, "turbidez_ok_pct": 88.4},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "Conformidade Geral (%)",              "valor": 82.4, "meta": 95,  "unidade": "%",  "status": "atencao", "observacao": "17,6% das amostras não conformes. Risco hídrico real."},
        {"situacao_dado": "referencia_municipal", "indicador": "E. coli Ausente (%)",                 "valor": 89.6, "meta": 100, "unidade": "%",  "status": "atencao", "observacao": "10,4% com E. coli — coliformes fecais. Risco de gastroenterite."},
        {"situacao_dado": "referencia_municipal", "indicador": "Cloro Residual OK (%)",               "valor": 84.2, "meta": 95,  "unidade": "%",  "status": "atencao", "observacao": "Falha no sistema de dosagem — subdosagem noturna."},
        {"situacao_dado": "referencia_municipal", "indicador": "Cobertura SAA (%)",                   "valor": 64.2, "meta": 100, "unidade": "%",  "status": "atencao", "observacao": "35,8% da pop. em soluções alternativas — risco maior."},
        {"situacao_dado": "referencia_municipal", "indicador": "Mercúrio SAI zona rural",             "valor": 75.0, "meta": 100, "unidade": "%conforme","status": "critico","observacao": "Garimpo Rio Juma — contaminação mercúrio. Boitatá/IBAMA."},
        {"situacao_dado": "referencia_municipal", "indicador": "SISÁGUA — registros em dia",          "valor": 100,  "meta": 100, "unidade": "%",  "status": "ok",      "observacao": "Lançamentos mensais atualizados pela VISA municipal."},
    ]
