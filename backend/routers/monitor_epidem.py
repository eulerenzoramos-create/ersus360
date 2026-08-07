# backend/routers/monitor_epidem.py — Monitor Epidemiológico · SINAN / e-SUS VE
from fastapi import APIRouter
import random
from functools import lru_cache

router = APIRouter(prefix="/api/monitor-epidem", tags=["monitor-epidem"])
random.seed(55)

def _hist(base: int, n: int = 10) -> list:
    vals = [base]
    for _ in range(n - 1):
        vals.append(max(0, vals[-1] + random.randint(-2, 3)))
    return vals

@lru_cache(maxsize=1)
def _ALERTAS():
    return [
        {
            "id": "A01", "agravo": "Dengue", "cid": "A90", "nivel": "alerta",
            "casos_semana": 14, "casos_anterior": 8, "variacao_pct": 75.0,
            "limiar_epidemico": 20,
            "descricao": "Aumento de 75% no número de casos em relação à semana anterior. Monitoramento intensificado.",
            "municipios_afetados": ["Apuí — Zona Urbana", "Apuí — Bairro Castanhal"],
            "data_alerta": "2026-07-20", "ativo": True,
        },
        {
            "id": "A02", "agravo": "Malária Vivax", "cid": "B51", "nivel": "surto",
            "casos_semana": 23, "casos_anterior": 11, "variacao_pct": 109.1,
            "limiar_epidemico": 15,
            "descricao": "Casos acima do limiar epidêmico — surto ativo nas comunidades ribeirinhas. Borrifação emergencial solicitada.",
            "municipios_afetados": ["Apuí — Zona Rural Norte", "Apuí — Comunidade Rio Sucunduri"],
            "data_alerta": "2026-07-18", "ativo": True,
        },
        {
            "id": "A03", "agravo": "Influenza A (H3N2)", "cid": "J11", "nivel": "monitoramento",
            "casos_semana": 6, "casos_anterior": 9, "variacao_pct": -33.3,
            "limiar_epidemico": 25,
            "descricao": "Tendência de queda após pico na SE 27/2026. Campanha de vacinação em andamento.",
            "municipios_afetados": ["Apuí — Geral"],
            "data_alerta": "2026-07-10", "ativo": True,
        },
        {
            "id": "A04", "agravo": "Leptospirose", "cid": "A27", "nivel": "alerta",
            "casos_semana": 3, "casos_anterior": 0, "variacao_pct": 300.0,
            "limiar_epidemico": 5,
            "descricao": "3 casos após período de chuvas intensas. Investigação epidemiológica em andamento. Alerta emitido.",
            "municipios_afetados": ["Apuí — Área de Várzea"],
            "data_alerta": "2026-07-22", "ativo": True,
        },
    ]


@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        {"cid":"A90","agravo":"Dengue","grupo":"Arboviroses","casos_ano":148,"casos_mes":42,"casos_semana":14,"tendencia":"crescimento","historico_semanas":_hist(6),"notificacoes_pendentes":3},
        {"cid":"B51","agravo":"Malária Vivax","grupo":"Endemias","casos_ano":312,"casos_mes":71,"casos_semana":23,"tendencia":"crescimento","historico_semanas":_hist(8),"notificacoes_pendentes":5},
        {"cid":"A96","agravo":"Chikungunya","grupo":"Arboviroses","casos_ano":28,"casos_mes":6,"casos_semana":2,"tendencia":"estavel","historico_semanas":_hist(3),"notificacoes_pendentes":0},
        {"cid":"A92.0","agravo":"Zika Vírus","grupo":"Arboviroses","casos_ano":4,"casos_mes":1,"casos_semana":0,"tendencia":"queda","historico_semanas":_hist(2),"notificacoes_pendentes":0},
        {"cid":"A27","agravo":"Leptospirose","grupo":"Zoonoses","casos_ano":9,"casos_mes":3,"casos_semana":3,"tendencia":"crescimento","historico_semanas":_hist(1),"notificacoes_pendentes":2},
        {"cid":"J11","agravo":"Influenza A","grupo":"Respiratórias","casos_ano":184,"casos_mes":48,"casos_semana":6,"tendencia":"queda","historico_semanas":_hist(12),"notificacoes_pendentes":0},
        {"cid":"A33","agravo":"Tuberculose","grupo":"DNC","casos_ano":18,"casos_mes":3,"casos_semana":1,"tendencia":"estavel","historico_semanas":_hist(1),"notificacoes_pendentes":1},
        {"cid":"A30","agravo":"Hanseníase","grupo":"DNC","casos_ano":7,"casos_mes":1,"casos_semana":0,"tendencia":"queda","historico_semanas":_hist(1),"notificacoes_pendentes":0},
        {"cid":"A95","agravo":"Febre Amarela","grupo":"Arboviroses","casos_ano":0,"casos_mes":0,"casos_semana":0,"tendencia":"estavel","historico_semanas":[0]*10,"notificacoes_pendentes":0},
        {"cid":"A20","agravo":"Leishmaniose Visceral","grupo":"Endemias","casos_ano":5,"casos_mes":1,"casos_semana":0,"tendencia":"estavel","historico_semanas":_hist(1),"notificacoes_pendentes":0},
    ]


@lru_cache(maxsize=1)
def _RESUMO():
    return {
        "semana_epidemiologica": "29/2026",
        "total_notificacoes_semana": sum(a["casos_semana"] for a in _AGRAVOS()),
        "alertas_ativos": len([a for a in _ALERTAS() if a["ativo"]]),
        "surtos_ativos": len([a for a in _ALERTAS() if a["nivel"] == "surto" and a["ativo"]]),
        "agravos_monitorados": len(_AGRAVOS()),
        "taxa_confirmacao_pct": 68.4,
        "ultima_atualizacao": "2026-07-23 07:00 (SINAN)",
    }



@router.get("/resumo")
def resumo():
    return _RESUMO()


@router.get("/alertas")
def alertas():
    return _ALERTAS()


@router.get("/agravos")
def agravos():
    return _AGRAVOS()


@router.post("/atualizar")
def atualizar():
    return {"ok": True, "mensagem": "Dados epidemiológicos atualizados via SINAN e e-SUS VE."}