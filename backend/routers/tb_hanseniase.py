"""
Tuberculose e Hanseníase — PNCT / PNCH — Apuí/AM
SINAN · Tratamento Diretamente Observado (TDO) · Operacional
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/tb-hanseniase", tags=["TB e Hanseníase"])

_CASOS_TB = [
    {"id":1, "codigo":"TB2026001","forma":"pulmonar","situacao":"em_tratamento","esquema":"RHZE","mes_inicio":"Jan/26","mes_prev_alta":"Jul/26","tdo":True, "contatos_examinados":6,"contatos_total":6,"resultado_bk":"positivo","baciloscopia_2m":"negativo","notificante":"ESF Central","alerta":None},
    {"id":2, "codigo":"TB2026002","forma":"pulmonar","situacao":"em_tratamento","esquema":"RHZE","mes_inicio":"Jan/26","mes_prev_alta":"Jul/26","tdo":True, "contatos_examinados":4,"contatos_total":5,"resultado_bk":"positivo","baciloscopia_2m":"positivo","notificante":"ESF Alto Apuí","alerta":"baciloscopia 2m positiva"},
    {"id":3, "codigo":"TB2026003","forma":"extrapulmonar","situacao":"em_tratamento","esquema":"RHZE","mes_inicio":"Fev/26","mes_prev_alta":"Ago/26","tdo":False,"contatos_examinados":3,"contatos_total":4,"resultado_bk":"negativo","baciloscopia_2m":None,"notificante":"Clínica Médica Apuí","alerta":"TDO não aderido"},
    {"id":4, "codigo":"TB2026004","forma":"pulmonar","situacao":"em_tratamento","esquema":"RHZE","mes_inicio":"Mar/26","mes_prev_alta":"Set/26","tdo":True, "contatos_examinados":8,"contatos_total":8,"resultado_bk":"positivo","baciloscopia_2m":None,"notificante":"ESF Bela Vista","alerta":None},
    {"id":5, "codigo":"TB2026005","forma":"pulmonar","situacao":"em_tratamento","esquema":"RHZE","mes_inicio":"Mar/26","mes_prev_alta":"Set/26","tdo":True, "contatos_examinados":5,"contatos_total":6,"resultado_bk":"positivo","baciloscopia_2m":None,"notificante":"ESF São Cristóvão","alerta":None},
    {"id":6, "codigo":"TB2025012","forma":"pulmonar","situacao":"alta_cura",    "esquema":"RHZE","mes_inicio":"Jul/25","mes_prev_alta":"Jan/26","tdo":True, "contatos_examinados":4,"contatos_total":4,"resultado_bk":"positivo","baciloscopia_2m":"negativo","notificante":"ESF Linha 1","alerta":None},
    {"id":7, "codigo":"TB2025013","forma":"pulmonar","situacao":"abandono",     "esquema":"RHZE","mes_inicio":"Ago/25","mes_prev_alta":"Fev/26","tdo":False,"contatos_examinados":3,"contatos_total":5,"resultado_bk":"positivo","baciloscopia_2m":"positivo","notificante":"ESF Estrada Nova","alerta":"abandono — busca ativa necessária"},
]

_CASOS_HANS = [
    {"id":1,"codigo":"HN2026001","forma":"dimorfa","classificacao":"MB","esquema":"PQT-MB","mes_inicio":"Jan/26","duracao_prevista":"12 meses","grau_incapacidade_inicial":1,"grau_incapacidade_atual":1,"exames_contatos":8,"notificante":"ESF Central","status":"em_tratamento"},
    {"id":2,"codigo":"HN2026002","forma":"virchowiana","classificacao":"MB","esquema":"PQT-MB","mes_inicio":"Fev/26","duracao_prevista":"12 meses","grau_incapacidade_inicial":2,"grau_incapacidade_atual":2,"exames_contatos":12,"notificante":"ESF Alto Apuí","status":"em_tratamento"},
    {"id":3,"codigo":"HN2026003","forma":"tuberculoide","classificacao":"PB","esquema":"PQT-PB","mes_inicio":"Mar/26","duracao_prevista":"6 meses","grau_incapacidade_inicial":0,"grau_incapacidade_atual":0,"exames_contatos":5,"notificante":"ESF São Cristóvão","status":"em_tratamento"},
    {"id":4,"codigo":"HN2025010","forma":"dimorfa","classificacao":"MB","esquema":"PQT-MB","mes_inicio":"Set/25","duracao_prevista":"12 meses","grau_incapacidade_inicial":1,"grau_incapacidade_atual":0,"exames_contatos":9,"notificante":"ESF Linha 2","status":"alta_cura"},
]

_HISTORICO = [
    {"ano":"2021","tb_casos":8, "tb_cura_pct":75.0,"tb_abandono_pct":12.5,"hans_casos":5,"hans_cura_pct":80.0,"coef_hans":23.7},
    {"ano":"2022","tb_casos":6, "tb_cura_pct":83.3,"tb_abandono_pct":0.0, "hans_casos":4,"hans_cura_pct":75.0,"coef_hans":19.0},
    {"ano":"2023","tb_casos":9, "tb_cura_pct":77.8,"tb_abandono_pct":11.1,"hans_casos":6,"hans_cura_pct":100.0,"coef_hans":28.5},
    {"ano":"2024","tb_casos":7, "tb_cura_pct":85.7,"tb_abandono_pct":0.0, "hans_casos":3,"hans_cura_pct":100.0,"coef_hans":14.2},
    {"ano":"2025","tb_casos":5, "tb_cura_pct":60.0,"tb_abandono_pct":20.0,"hans_casos":4,"hans_cura_pct":75.0,"coef_hans":19.0},
    {"ano":"2026*","tb_casos":5,"tb_cura_pct":None,"tb_abandono_pct":None,"hans_casos":3,"hans_cura_pct":None,"coef_hans":None},
]

@router.get("/dashboard")
async def dashboard():
    tb_ativos  = [c for c in _CASOS_TB   if c["situacao"]=="em_tratamento"]
    hans_ativ  = [c for c in _CASOS_HANS if c["status"]=="em_tratamento"]
    alertas_tb = [c for c in tb_ativos if c["alerta"]]
    tdo_adh    = sum(1 for c in tb_ativos if c["tdo"]) / len(tb_ativos) * 100 if tb_ativos else 0
    return {
        "competencia":        "Mar/2026",
        "tb_em_tratamento":   len(tb_ativos),
        "tb_alertas":         len(alertas_tb),
        "tb_tdo_adesao_pct":  round(tdo_adh, 1),
        "hans_em_tratamento": len(hans_ativ),
        "hans_grau2_pct":     round(sum(1 for c in hans_ativ if c["grau_incapacidade_atual"]==2)/len(hans_ativ)*100 if hans_ativ else 0, 1),
        "coef_hans_2025":     19.0,
        "historico":          _HISTORICO,
    }

@router.get("/tuberculose")
async def tuberculose():
    return _CASOS_TB

@router.get("/hanseniase")
async def hanseniase():
    return _CASOS_HANS

@router.get("/historico")
async def historico():
    return _HISTORICO
