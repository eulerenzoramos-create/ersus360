"""
Rede de Frio / Imunobiológicos — Apuí/AM
Monitoramento temperatura · Estoque · Perdas · PNI
Portaria GM/MS nº 1.101/2002 · Manual Rede de Frio 6ª ed.
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/rede-frio", tags=["Rede de Frio"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "competencia": "Mar/2026",
        "equipamentos_total": 7,
        "equipamentos_ok": 5,
        "equipamentos_alerta": 2,
        "temperatura_media_atual": 4.1,
        "temperatura_ok": True,
        "lotes_vencendo_30d": 3,
        "perdas_mes_doses": 48,
        "perdas_mes_pct": 1.8,
        "perdas_status": "atencao",
        "vacinas_cobertura_critica": 2,
    }


@lru_cache(maxsize=1)
def _EQUIPAMENTOS():
    return [
        {"id":"RF-01","tipo":"Câmara Fria Positiva","local":"Sala de Vacinas Central","temp_atual":4.1,"temp_min_24h":2.8,"temp_max_24h":5.4,"status":"ok",     "ultima_calibracao":"Jan/26","alerta":None},
        {"id":"RF-02","tipo":"Refrigerador doméstico","local":"ESF São Francisco",     "temp_atual":6.8,"temp_min_24h":5.1,"temp_max_24h":8.2,"status":"alerta", "ultima_calibracao":"Out/25","alerta":"Temperatura acima de 8°C registrada — verificar"},
        {"id":"RF-03","tipo":"Refrigerador doméstico","local":"ESF Apuí Centro",       "temp_atual":3.6,"temp_min_24h":2.4,"temp_max_24h":5.0,"status":"ok",     "ultima_calibracao":"Dez/25","alerta":None},
        {"id":"RF-04","tipo":"Caixa térmica transporte","local":"SAMU / Transporte",   "temp_atual":5.2,"temp_min_24h":3.8,"temp_max_24h":6.4,"status":"ok",     "ultima_calibracao":"Fev/26","alerta":None},
        {"id":"RF-05","tipo":"Refrigerador doméstico","local":"ESF Matupi",            "temp_atual":7.4,"temp_min_24h":6.2,"temp_max_24h":9.1,"status":"alerta", "ultima_calibracao":"Nov/25","alerta":"Temperatura crítica >8°C — acionar manutenção"},
        {"id":"RF-06","tipo":"Câmara Fria Negativa",   "local":"Almoxarifado Central", "temp_atual":-18.2,"temp_min_24h":-20.1,"temp_max_24h":-16.8,"status":"ok","ultima_calibracao":"Jan/26","alerta":None},
        {"id":"RF-07","tipo":"Refrigerador doméstico","local":"UBS Posto Apuí",        "temp_atual":4.8,"temp_min_24h":3.2,"temp_max_24h":5.9,"status":"ok",     "ultima_calibracao":"Fev/26","alerta":None},
    ]


@lru_cache(maxsize=1)
def _ESTOQUE():
    return [
        {"vacina":"BCG",                      "lote":"BCG2025-11","doses_estoque":142,"doses_minimas":80, "vencimento":"Jun/26","status":"ok"},
        {"vacina":"Hepatite B",               "lote":"HBV2025-08","doses_estoque":218,"doses_minimas":100,"vencimento":"Ago/26","status":"ok"},
        {"vacina":"Penta (DTP+Hib+HB)",       "lote":"PENT25-14", "doses_estoque":186,"doses_minimas":120,"vencimento":"Mai/26","status":"ok"},
        {"vacina":"VIP (Poliomielite inativ.)","lote":"VIP2025-09","doses_estoque":95, "doses_minimas":80, "vencimento":"Abr/26","status":"atencao","alerta":"Estoque próximo do mínimo"},
        {"vacina":"VRH (Rotavírus)",           "lote":"VRH2025-06","doses_estoque":68, "doses_minimas":60, "vencimento":"Abr/26","status":"atencao","alerta":"Vence em <30 dias — priorizar aplicação"},
        {"vacina":"Pneumocócica 10v",          "lote":"PNE25-12",  "doses_estoque":112,"doses_minimas":80, "vencimento":"Jul/26","status":"ok"},
        {"vacina":"Meningocócica C",           "lote":"MEN25-10",  "doses_estoque":84, "doses_minimas":60, "vencimento":"Jun/26","status":"ok"},
        {"vacina":"Tríplice Viral (MMR)",      "lote":"MMR2025-07","doses_estoque":156,"doses_minimas":100,"vencimento":"Set/26","status":"ok"},
        {"vacina":"Febre Amarela",             "lote":"FA2025-08", "doses_estoque":204,"doses_minimas":120,"vencimento":"Ago/26","status":"ok"},
        {"vacina":"Influenza",                 "lote":"INF2026-01","doses_estoque":312,"doses_minimas":200,"vencimento":"Abr/26","status":"atencao","alerta":"Campanha em andamento — estoque pré-planejado"},
        {"vacina":"HPV 4v",                   "lote":"HPV2025-05","doses_estoque":88, "doses_minimas":60, "vencimento":"Mai/26","status":"ok"},
        {"vacina":"DT Adulto",                "lote":"DTA2025-09","doses_estoque":62, "doses_minimas":40, "vencimento":"Out/26","status":"ok"},
    ]


@lru_cache(maxsize=1)
def _PERDAS_MENSAL():
    return [
        {"mes":"Out/25","doses_aplicadas":2641,"doses_perdidas":36,"pct_perdas":1.4,"causa_principal":"Vencimento"},
        {"mes":"Nov/25","doses_aplicadas":2580,"doses_perdidas":28,"pct_perdas":1.1,"causa_principal":"Frasco aberto"},
        {"mes":"Dez/25","doses_aplicadas":2412,"doses_perdidas":44,"pct_perdas":1.8,"causa_principal":"Falha cadeia frio"},
        {"mes":"Jan/26","doses_aplicadas":2698,"doses_perdidas":32,"pct_perdas":1.2,"causa_principal":"Frasco aberto"},
        {"mes":"Fev/26","doses_aplicadas":2724,"doses_perdidas":41,"pct_perdas":1.5,"causa_principal":"Vencimento"},
        {"mes":"Mar/26","doses_aplicadas":2614,"doses_perdidas":48,"pct_perdas":1.8,"causa_principal":"Falha cadeia frio"},
    ]


@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD

@router.get("/equipamentos")
async def equipamentos():
    return _EQUIPAMENTOS

@router.get("/estoque")
async def estoque():
    return _ESTOQUE

@router.get("/perdas")
async def perdas():
    return _PERDAS_MENSAL
