"""
Router: /api/saude-bucal — ERSUS 360
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
2 Equipes de Saúde Bucal (ESB). Sem CEO local.
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-bucal", tags=["saude-bucal"])


@router.get("/resumo")
async def resumo():
    return {
        "situacao_dado": "referencia_municipal",
        "score_sb": 5.8,
        "procedimentos_mes": 487,
        "meta_procedimentos": 600,
        "primeira_consulta_pct": 73,
        "tratamento_concluido_pct": 58,
        "cobertura_1a_consulta": 41,
        "exodontias_pct": 28,
        "equipes_sb": 2,
        "ceo_ativo": False,
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/indicadores")
async def indicadores():
    return [
        {
            "id": "sb-01", "codigo": "B4", "nome": "Cobertura de 1ª Consulta Odontológica Programática",
            "grupo": "Cobertura", "meta": 50.0, "realizado": 41.0, "unidade": "%",
            "pct_meta": 82, "status": "alerta", "tendencia": "alta",
            "historico": [33, 35, 37, 39, 40, 41, 0, 0, 0, 0, 0, 0],
            "meses": ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
        },
        {
            "id": "sb-02", "codigo": "B5", "nome": "Proporção de Tratamentos Concluídos",
            "grupo": "Qualidade", "meta": 75.0, "realizado": 58.0, "unidade": "%",
            "pct_meta": 77, "status": "alerta", "tendencia": "estavel",
            "historico": [55, 56, 57, 57, 58, 58, 0, 0, 0, 0, 0, 0],
            "meses": ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
        },
        {
            "id": "sb-03", "codigo": "B6", "nome": "Proporção de Exodontias em Relação aos Procedimentos",
            "grupo": "Qualidade", "meta": 15.0, "realizado": 28.0, "unidade": "%",
            "pct_meta": 53, "status": "critico", "tendencia": "queda",
            "historico": [32, 31, 30, 29, 29, 28, 0, 0, 0, 0, 0, 0],
            "meses": ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
        },
        {
            "id": "sb-04", "codigo": "B7", "nome": "Cobertura Odontológica Gestantes (Pré-natal)",
            "grupo": "Populações Especiais", "meta": 70.0, "realizado": 54.0, "unidade": "%",
            "pct_meta": 77, "status": "alerta", "tendencia": "alta",
            "historico": [48, 49, 50, 51, 53, 54, 0, 0, 0, 0, 0, 0],
            "meses": ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
        },
        {
            "id": "sb-05", "codigo": "B8", "nome": "Cobertura de Fluoretação da Água",
            "grupo": "Prevenção", "meta": 80.0, "realizado": 34.0, "unidade": "%",
            "pct_meta": 43, "status": "critico", "tendencia": "estavel",
            "historico": [34, 34, 34, 34, 34, 34, 0, 0, 0, 0, 0, 0],
            "meses": ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
        },
        {
            "id": "sb-06", "codigo": "B9", "nome": "Procedimentos Preventivos / Total Procedimentos",
            "grupo": "Prevenção", "meta": 40.0, "realizado": 38.0, "unidade": "%",
            "pct_meta": 95, "status": "atingida", "tendencia": "alta",
            "historico": [33, 34, 35, 36, 37, 38, 0, 0, 0, 0, 0, 0],
            "meses": ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
        },
    ]


@router.get("/procedimentos")
async def procedimentos():
    return [
        {"codigo": "0101050062", "descricao": "Consulta de saúde bucal na APS",                          "quantidade": 487, "meta_mensal": 600},
        {"codigo": "0301010064", "descricao": "Aplicação tópica de flúor (sessão individual)",            "quantidade": 142, "meta_mensal": 150},
        {"codigo": "0301010072", "descricao": "Selante (por dente)",                                      "quantidade": 87,  "meta_mensal": 100},
        {"codigo": "0307010013", "descricao": "Exodontia de dente permanente",                            "quantidade": 136, "meta_mensal": 90},
        {"codigo": "0307010021", "descricao": "Exodontia de dente decíduo",                               "quantidade": 48,  "meta_mensal": 50},
        {"codigo": "0304010014", "descricao": "Restauração de dente permanente (1 face) amálgama",        "quantidade": 98,  "meta_mensal": 120},
        {"codigo": "0304010022", "descricao": "Restauração de dente permanente (1 face) resina composta", "quantidade": 74,  "meta_mensal": 100},
        {"codigo": "0301010056", "descricao": "Remoção de tártaro / profilaxia",                          "quantidade": 163, "meta_mensal": 180},
        {"codigo": "0303010037", "descricao": "Endodontia de dente com 1 canal",                          "quantidade": 18,  "meta_mensal": 20},
        {"codigo": "0302050025", "descricao": "Tratamento de periodontite crônica (por sextante)",        "quantidade": 54,  "meta_mensal": 60},
    ]
