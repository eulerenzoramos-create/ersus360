"""
Router: /api/monitor-epidem — ERSUS 360
Monitor Epidemiológico — Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/monitor-epidem", tags=["monitor-epidem"])


@router.get("/resumo")
async def resumo():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "semana_epidemiologica": "SE25/2026",
        "periodo": "Jun 2026",
        "alertas_ativos": 3,
        "agravos_em_surto": ["Dengue (DENV-1/3)", "Sífilis Adquirida", "Malária P. vivax"],
        "agravos_acima_limiar": ["Leishmaniose Tegumentar", "Hepatite A"],
        "total_notificacoes_semana": 84,
        "total_notificacoes_ano": 2140,
        "casos_confirmados_ano": 1480,
        "investigacoes_em_aberto": 18,
        "oportunidade_investigacao_pct": 78.4,
        "oportunidade_encerramento_pct": 64.2,
        "nota": "Referência baseada em SINAN e SIVEP para municípios amazônicos ~20 mil hab.",
    }


@router.get("/alertas")
async def alertas():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "id": "ALE-2026-001",
            "agravo": "Dengue",
            "tipo": "surto",
            "nivel": "critico",
            "inicio": "Jan/2026",
            "status": "ativo",
            "casos_acumulados": 214,
            "ultima_atualizacao": "SE24/2026",
            "acao_adotada": "Nebulização emergencial + LIRAa quinzenal + equipes de bloqueio.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": "ALE-2026-002",
            "agravo": "Sífilis Adquirida",
            "tipo": "tendencia_alta",
            "nivel": "critico",
            "inicio": "Jan/2026",
            "status": "ativo",
            "casos_acumulados": 28,
            "ultima_atualizacao": "SE24/2026",
            "acao_adotada": "Testagem ampliada + tratamento parceiros + capacitação eSF.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": "ALE-2026-003",
            "agravo": "Malária P. vivax",
            "tipo": "endemico_acima_limiar",
            "nivel": "alto",
            "inicio": "Jan/2026",
            "status": "ativo",
            "casos_acumulados": 848,
            "ultima_atualizacao": "SE24/2026",
            "acao_adotada": "SIVEP-Malária ativo. Tratamento primaquina. Mosquiteiros impregnados.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": "ALE-2025-018",
            "agravo": "Leishmaniose Tegumentar (LTA)",
            "tipo": "acima_media_historica",
            "nivel": "medio",
            "inicio": "Set/2025",
            "status": "monitoramento",
            "casos_acumulados": 18,
            "ultima_atualizacao": "SE20/2026",
            "acao_adotada": "Busca ativa áreas de garimpo. Tratamento antimonial disponível.",
        },
    ]


@router.get("/agravos")
async def agravos():
    return [
        {"situacao_dado": "referencia_municipal", "agravo": "Malária (total)",                "casos_ano": 848, "incidencia_100mil": 4240, "tendencia": "estavel",  "sinan": False, "sivep": True,  "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Dengue",                          "casos_ano": 214, "incidencia_100mil": 1070, "tendencia": "alta",     "sinan": True,  "sivep": False, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Sífilis Adquirida",               "casos_ano": 28,  "incidencia_100mil": 140,  "tendencia": "alta",     "sinan": True,  "sivep": False, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Sífilis Gestante",                "casos_ano": 14,  "incidencia_100mil": None, "tendencia": "alta",     "sinan": True,  "sivep": False, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Sífilis Congênita",               "casos_ano": 3,   "incidencia_100mil": None, "tendencia": "alta",     "sinan": True,  "sivep": False, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "HIV / Aids",                      "casos_ano": 6,   "incidencia_100mil": 30,   "tendencia": "estavel",  "sinan": True,  "sivep": False, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Leishmaniose Tegumentar (LTA)",   "casos_ano": 18,  "incidencia_100mil": 90,   "tendencia": "alta",     "sinan": True,  "sivep": False, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Leishmaniose Visceral (LV)",      "casos_ano": 2,   "incidencia_100mil": 10,   "tendencia": "estavel",  "sinan": True,  "sivep": False, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Hepatite B aguda",                "casos_ano": 4,   "incidencia_100mil": 20,   "tendencia": "estavel",  "sinan": True,  "sivep": False, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Tuberculose",                     "casos_ano": 8,   "incidencia_100mil": 40,   "tendencia": "estavel",  "sinan": True,  "sivep": False, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Hanseníase",                      "casos_ano": 6,   "incidencia_100mil": 30,   "tendencia": "queda",    "sinan": True,  "sivep": False, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Chikungunya",                     "casos_ano": 28,  "incidencia_100mil": 140,  "tendencia": "estavel",  "sinan": True,  "sivep": False, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Leptospirose",                    "casos_ano": 4,   "incidencia_100mil": 20,   "tendencia": "estavel",  "sinan": True,  "sivep": False, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "agravo": "Violência Interpessoal/Doméstica","casos_ano": 84,  "incidencia_100mil": 420,  "tendencia": "alta",     "sinan": True,  "sivep": False, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Intoxicação Exógena",             "casos_ano": 12,  "incidencia_100mil": 60,   "tendencia": "estavel",  "sinan": True,  "sivep": False, "status": "atencao"},
    ]


@router.post("/atualizar")
async def atualizar():
    return {
        "situacao_dado": "referencia_municipal",
        "ok": True,
        "mensagem": "Monitor epidemiológico atualizado com dados de referência municipal — Apuí/AM.",
        "proxima_atualizacao": "SE26/2026",
    }
