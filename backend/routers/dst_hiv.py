"""
Router: /api/dst-hiv — ERSUS 360
Dados de referência municipal — Apuí/AM (pop. ~20 mil).
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/dst-hiv", tags=["dst_hiv"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2025",
        "pvha_total": 48,
        "hiv_novos_ano": 6,
        "tarv_pct": 83.3,
        "cv_suprimida_pct": 72.9,
        "sifilis_adquirida_ano": 28,
        "sifilis_gestante_ano": 14,
        "sifilis_congenita_ano": 3,
        "obitos_aids_ano": 1,
        "prep_usuarios": 8,
        "pep_dispensacoes_ano": 12,
        "cascata_meta": "90-90-90",
        "nota": "Referência baseada em parâmetros epidemiológicos típicos para municípios amazônicos ~20 mil hab.",
    }


@router.get("/pvha-perfil")
async def pvha_perfil():
    return [
        {"situacao_dado": "referencia_municipal", "faixa": "15–24 anos", "pvha": 6,  "tarv_pct": 66.7, "cv_suprimida_pct": 50.0, "cd4_medio": 420, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "faixa": "25–34 anos", "pvha": 14, "tarv_pct": 78.6, "cv_suprimida_pct": 64.3, "cd4_medio": 510, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "faixa": "35–44 anos", "pvha": 16, "tarv_pct": 87.5, "cv_suprimida_pct": 81.3, "cd4_medio": 580, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "faixa": "45–59 anos", "pvha": 10, "tarv_pct": 90.0, "cv_suprimida_pct": 80.0, "cd4_medio": 620, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "faixa": "≥60 anos",   "pvha": 2,  "tarv_pct": 100,  "cv_suprimida_pct": 100,  "cd4_medio": 640, "status": "ok"},
    ]


@router.get("/dst-notificacoes")
async def dst_notificacoes():
    return [
        {"situacao_dado": "referencia_municipal", "agravo": "Sífilis Adquirida",         "casos_ano": 28, "taxa_100mil": 140.0, "tendencia": "alta",    "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Sífilis em Gestante",        "casos_ano": 14, "taxa_100mil": None,   "tendencia": "alta",    "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Sífilis Congênita",          "casos_ano": 3,  "taxa_100mil": None,   "tendencia": "alta",    "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "HIV (todos os estágios)",    "casos_ano": 6,  "taxa_100mil": 30.0,  "tendencia": "estavel", "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Aids (doença)",              "casos_ano": 2,  "taxa_100mil": 10.0,  "tendencia": "estavel", "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Hepatite B aguda",           "casos_ano": 4,  "taxa_100mil": 20.0,  "tendencia": "estavel", "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Hepatite C",                 "casos_ano": 2,  "taxa_100mil": 10.0,  "tendencia": "estavel", "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Gonorreia",                  "casos_ano": 18, "taxa_100mil": 90.0,  "tendencia": "alta",    "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Condiloma Acuminado (HPV)",  "casos_ano": 22, "taxa_100mil": 110.0, "tendencia": "estavel", "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Herpes Genital",             "casos_ano": 14, "taxa_100mil": 70.0,  "tendencia": "estavel", "status": "ok"},
    ]


@router.get("/serie-mensal")
async def serie_mensal():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Jan/25", "hiv_novos": 0, "sifilis_adq": 2, "sifilis_gest": 1, "tarv_pct": 80.0},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/25", "hiv_novos": 1, "sifilis_adq": 2, "sifilis_gest": 1, "tarv_pct": 80.8},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/25", "hiv_novos": 1, "sifilis_adq": 3, "sifilis_gest": 2, "tarv_pct": 81.4},
        {"situacao_dado": "referencia_municipal", "mes": "Abr/25", "hiv_novos": 0, "sifilis_adq": 2, "sifilis_gest": 1, "tarv_pct": 82.0},
        {"situacao_dado": "referencia_municipal", "mes": "Mai/25", "hiv_novos": 1, "sifilis_adq": 3, "sifilis_gest": 2, "tarv_pct": 82.4},
        {"situacao_dado": "referencia_municipal", "mes": "Jun/25", "hiv_novos": 0, "sifilis_adq": 2, "sifilis_gest": 1, "tarv_pct": 83.0},
        {"situacao_dado": "referencia_municipal", "mes": "Jul/25", "hiv_novos": 1, "sifilis_adq": 3, "sifilis_gest": 2, "tarv_pct": 83.0},
        {"situacao_dado": "referencia_municipal", "mes": "Ago/25", "hiv_novos": 0, "sifilis_adq": 2, "sifilis_gest": 1, "tarv_pct": 83.3},
        {"situacao_dado": "referencia_municipal", "mes": "Set/25", "hiv_novos": 1, "sifilis_adq": 3, "sifilis_gest": 1, "tarv_pct": 83.3},
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "hiv_novos": 0, "sifilis_adq": 2, "sifilis_gest": 1, "tarv_pct": 83.3},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "hiv_novos": 1, "sifilis_adq": 2, "sifilis_gest": 1, "tarv_pct": 83.3},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "hiv_novos": 0, "sifilis_adq": 2, "sifilis_gest": 0, "tarv_pct": 83.3},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "PVHA em TARV (meta: 90%)",               "valor": 83.3, "meta": 90,  "unidade": "%",    "status": "atencao", "observacao": "8 PVHA sem TARV — perda de acompanhamento (evasão rural)."},
        {"situacao_dado": "referencia_municipal", "indicador": "Carga Viral Suprimida (meta: 90%)",       "valor": 72.9, "meta": 90,  "unidade": "%",    "status": "critico", "observacao": "Falha terapêutica e perda de seguimento. Teleconsulta infectologia."},
        {"situacao_dado": "referencia_municipal", "indicador": "Sífilis Congênita (meta: eliminação)",   "valor": 3,    "meta": 0,   "unidade": "casos", "status": "critico", "observacao": "3 casos em 2025 — meta MS: 0,5/1.000 NV. Pré-natal inadequado."},
        {"situacao_dado": "referencia_municipal", "indicador": "Testagem HIV/Sífilis Gestantes (%)",     "valor": 84.2, "meta": 100, "unidade": "%",    "status": "atencao", "observacao": "15,8% das gestantes sem testagem — acesso rural."},
        {"situacao_dado": "referencia_municipal", "indicador": "PrEP — usuários ativos",                 "valor": 8,    "meta": None,"unidade": "pac.", "status": "ok",      "observacao": "Dispensação pela UBS Central. Medicamento disponível (MS)."},
        {"situacao_dado": "referencia_municipal", "indicador": "Taxa Sífilis Adquirida (por 100 mil)",   "valor": 140,  "meta": 30,  "unidade": "/100k", "status": "critico", "observacao": "4,7× a meta nacional. Intensificar testagem e tratamento na UBS."},
    ]
