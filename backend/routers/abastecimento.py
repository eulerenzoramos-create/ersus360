"""Abastecimento de Água e Saneamento — FMS Apuí/AM · Saúde Ambiental"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/abastecimento", tags=["abastecimento"])

@router.get("/dashboard")
async def dashboard():
    return {
        "populacao_atendida": 18_640,
        "populacao_total_municipio": 21_880,
        "cobertura_agua_tratada_pct": 68.4,
        "cobertura_esgotamento_pct": 34.8,
        "cobertura_coleta_lixo_pct": 72.6,
        "amostras_agua_potavel_mes": 48,
        "amostras_conforme_pct": 89.6,
        "amostras_nao_conforme": 5,
        "ligacoes_ativas": 4_284,
        "domicilios_sem_agua_tratada": 1_428,
        "domicilios_area_rural_sem_saneamento": 2_684,
        "doencas_transmitidas_agua_mes": 28,
        "status_geral": "atencao",
        "competencia": "Mar/2026",
    }

@router.get("/qualidade-agua")
async def qualidade_agua():
    return {
        "pontos_monitoramento": [
            {"ponto": "ETA Central — Saída",              "cloro_residual": 0.8, "turbidez": 0.3, "coliformes_totais": "Ausente", "coliformes_fecais": "Ausente", "fluor": 0.7, "status": "ok",      "ultima_coleta": "2026-03-28"},
            {"ponto": "Bairro Kennedy — Rede",             "cloro_residual": 0.6, "turbidez": 0.5, "coliformes_totais": "Ausente", "coliformes_fecais": "Ausente", "fluor": 0.6, "status": "ok",      "ultima_coleta": "2026-03-28"},
            {"ponto": "Bairro Nova Esperança — Rede",      "cloro_residual": 0.4, "turbidez": 0.8, "coliformes_totais": "Presente","coliformes_fecais": "Ausente", "fluor": 0.5, "status": "atencao", "ultima_coleta": "2026-03-27"},
            {"ponto": "Linha 7 — Poço Comunitário",        "cloro_residual": 0.0, "turbidez": 1.8, "coliformes_totais": "Presente","coliformes_fecais": "Presente","fluor": 0.0, "status": "critico", "ultima_coleta": "2026-03-26"},
            {"ponto": "Ramal do Moura — Cisterna coletiva", "cloro_residual": 0.2, "turbidez": 1.2, "coliformes_totais": "Presente","coliformes_fecais": "Ausente", "fluor": 0.0, "status": "atencao", "ultima_coleta": "2026-03-25"},
            {"ponto": "Vila Progresso — Rede",              "cloro_residual": 0.5, "turbidez": 0.6, "coliformes_totais": "Ausente", "coliformes_fecais": "Ausente", "fluor": 0.6, "status": "ok",      "ultima_coleta": "2026-03-28"},
        ],
        "resumo": {
            "pontos_conformes": 3,
            "pontos_atencao": 2,
            "pontos_criticos": 1,
            "conformidade_geral_pct": 89.6,
            "meta_conformidade_pct": 95.0,
        },
    }

@router.get("/coberturas")
async def coberturas():
    return [
        {"zona": "Urbana sede",                 "agua_tratada_pct": 94.2, "esgotamento_pct": 58.4, "coleta_lixo_pct": 98.4, "domicilios": 3280, "populacao": 13_124, "status": "ok"},
        {"zona": "Bairros periféricos",          "agua_tratada_pct": 72.6, "esgotamento_pct": 28.4, "coleta_lixo_pct": 84.6, "domicilios": 840,  "populacao": 3_360,  "status": "atencao"},
        {"zona": "Linhas rurais (ramal BR-230)", "agua_tratada_pct": 28.4, "esgotamento_pct": 4.8,  "coleta_lixo_pct": 32.6, "domicilios": 680,  "populacao": 2_720,  "status": "critico"},
        {"zona": "Comunidades ribeirinhas",      "agua_tratada_pct": 12.6, "esgotamento_pct": 2.4,  "coleta_lixo_pct": 18.4, "domicilios": 284,  "populacao": 1_136,  "status": "critico"},
        {"zona": "Assentamentos e colônias",     "agua_tratada_pct": 18.4, "esgotamento_pct": 6.2,  "coleta_lixo_pct": 24.8, "domicilios": 348,  "populacao": 1_540,  "status": "critico"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "amostras": 46, "conformes": 41, "conformidade_pct": 89.1, "doencas_h2o": 32, "novos_domicilios_tratada": 12},
        {"mes": "Nov/25", "amostras": 48, "conformes": 43, "conformidade_pct": 89.6, "doencas_h2o": 28, "novos_domicilios_tratada": 8},
        {"mes": "Dez/25", "amostras": 44, "conformes": 39, "conformidade_pct": 88.6, "doencas_h2o": 24, "novos_domicilios_tratada": 6},
        {"mes": "Jan/26", "amostras": 48, "conformes": 42, "conformidade_pct": 87.5, "doencas_h2o": 36, "novos_domicilios_tratada": 4},
        {"mes": "Fev/26", "amostras": 46, "conformes": 41, "conformidade_pct": 89.1, "doencas_h2o": 30, "novos_domicilios_tratada": 10},
        {"mes": "Mar/26", "amostras": 48, "conformes": 43, "conformidade_pct": 89.6, "doencas_h2o": 28, "novos_domicilios_tratada": 14},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura de água tratada",          "valor": 68.4, "meta": 90.0,  "unidade": "%","status": "critico",  "observacao": "31.6% da população sem acesso — área rural crítica (Linha 7 e ribeirinhas)"},
        {"indicador": "Cobertura de esgotamento sanitário", "valor": 34.8, "meta": 60.0,  "unidade": "%","status": "critico",  "observacao": "Abaixo da meta estadual — fossa séptica é a solução predominante"},
        {"indicador": "Conformidade amostras de água",      "valor": 89.6, "meta": 95.0,  "unidade": "%","status": "atencao",  "observacao": "5 amostras não conformes — Linha 7 com coliformes fecais"},
        {"indicador": "Cobertura de coleta de lixo",        "valor": 72.6, "meta": 80.0,  "unidade": "%","status": "atencao",  "observacao": "Áreas rurais com disposição a céu aberto — risco de vetores"},
        {"indicador": "Doenças de transmissão hídrica/mês", "valor": 28,   "meta": 10,    "unidade": "n","status": "critico",  "observacao": "Diarreia e gastroenterite predominantes — sazonalidade chuvosa"},
        {"indicador": "Novas ligações de água tratada/mês", "valor": 14,   "meta": 20,    "unidade": "n","status": "atencao",  "observacao": "Ritmo de expansão insuficiente para atingir meta Plano Municipal de Saneamento"},
    ]
