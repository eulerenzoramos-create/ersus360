from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/dst-hiv", tags=["dst_hiv"])

@lru_cache(maxsize=1)
def _PVHA():
    return [
        {"faixa": "15–24 anos", "pvha": 18, "tarv_pct": 83.3, "cv_suprimida_pct": 72.2, "cd4_medio": 412, "status": "atencao"},
        {"faixa": "25–39 anos", "pvha": 52, "tarv_pct": 90.4, "cv_suprimida_pct": 84.6, "cd4_medio": 528, "status": "ok"},
        {"faixa": "40–59 anos", "pvha": 38, "tarv_pct": 94.7, "cv_suprimida_pct": 89.5, "cd4_medio": 574, "status": "ok"},
        {"faixa": "60+ anos",   "pvha": 14, "tarv_pct": 100.0,"cv_suprimida_pct": 92.9, "cd4_medio": 601, "status": "ok"},
        {"faixa": "< 15 anos",  "pvha": 6,  "tarv_pct": 66.7, "cv_suprimida_pct": 50.0, "cd4_medio": 318, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _DST_NOTIFICACOES():
    return [
        {"agravo": "Sífilis Adquirida", "casos_ano": 84, "taxa_100mil": 445.6, "tendencia": "alta", "status": "critico"},
        {"agravo": "Sífilis em Gestante", "casos_ano": 22, "taxa_100mil": None, "tendencia": "alta", "status": "critico"},
        {"agravo": "Sífilis Congênita", "casos_ano": 7, "taxa_100mil": None, "tendencia": "alta", "status": "critico"},
        {"agravo": "Gonorreia", "casos_ano": 31, "taxa_100mil": 164.4, "tendencia": "estavel", "status": "atencao"},
        {"agravo": "Hepatite B", "casos_ano": 12, "taxa_100mil": 63.6, "tendencia": "queda", "status": "atencao"},
        {"agravo": "Hepatite C", "casos_ano": 8,  "taxa_100mil": 42.4, "tendencia": "queda", "status": "atencao"},
        {"agravo": "HIV — Novos Diagnósticos", "casos_ano": 14, "taxa_100mil": 74.2, "tendencia": "alta", "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _SERIE():
    return [
        {"mes": "Jan", "hiv_novos": 2, "sifilis_adq": 12, "sifilis_gest": 3, "tarv_pct": 87.2},
        {"mes": "Fev", "hiv_novos": 1, "sifilis_adq": 14, "sifilis_gest": 2, "tarv_pct": 87.5},
        {"mes": "Mar", "hiv_novos": 3, "sifilis_adq": 16, "sifilis_gest": 4, "tarv_pct": 88.1},
        {"mes": "Abr", "hiv_novos": 2, "sifilis_adq": 15, "sifilis_gest": 3, "tarv_pct": 88.4},
        {"mes": "Mai", "hiv_novos": 3, "sifilis_adq": 18, "sifilis_gest": 5, "tarv_pct": 89.0},
        {"mes": "Jun", "hiv_novos": 3, "sifilis_adq": 9,  "sifilis_gest": 5, "tarv_pct": 89.3},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "PVHA em TARV (Cascata 90-90-90)", "valor": 89.2, "meta": 90.0, "unidade": "%",
         "status": "atencao", "observacao": "Próximo da meta UNAIDS 90% — manter monitoramento"},
        {"indicador": "Carga Viral Suprimida (<1000 cop/mL)", "valor": 84.1, "meta": 90.0, "unidade": "%",
         "status": "atencao", "observacao": "Meta UNAIDS 90% CV suprimida — distância de 6 pontos"},
        {"indicador": "Sífilis congênita (taxa)", "valor": 37.1, "meta": 0.5, "unidade": "/1000 NV",
         "status": "critico", "observacao": "74× acima da meta de eliminação — 7 casos em 2026"},
        {"indicador": "TARV em crianças <15 anos", "valor": 66.7, "meta": 90.0, "unidade": "%",
         "status": "critico", "observacao": "6 crianças PVHA — apenas 4 em TARV regular"},
        {"indicador": "Testagem HIV em pré-natal", "valor": 88.6, "meta": 100.0, "unidade": "%",
         "status": "atencao", "observacao": "11% das gestantes sem teste — risco de TMV"},
        {"indicador": "Profilaxia PEP/PrEP ativa", "valor": 12, "meta": None, "unidade": "usuários",
         "status": "ok", "observacao": "12 em PrEP, 4 atendimentos PEP no semestre"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "pvha_total": 128,
        "hiv_novos_ano": 14,
        "tarv_pct": 89.2,
        "cv_suprimida_pct": 84.1,
        "cd4_medio": 524,
        "sifilis_adquirida_ano": 84,
        "sifilis_gestante_ano": 22,
        "sifilis_congenita_ano": 7,
        "obitos_aids_ano": 2,
        "prep_usuarios": 12,
        "testagem_prenatal_pct": 88.6,
        "cascata_meta": "90-90-90",
    }


@router.get("/pvha-perfil")
def pvha_perfil():
    return _PVHA()


@router.get("/dst-notificacoes")
def dst_notificacoes():
    return _DST_NOTIFICACOES()


@router.get("/serie-mensal")
def serie_mensal():
    return _SERIE()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()