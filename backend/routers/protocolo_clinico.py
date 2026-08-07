"""Protocolos Clínicos e PCDT — Conformidade · Monitoramento · FMS Apuí/AM"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/protocolo-clinico", tags=["protocolo_clinico"])

@lru_cache(maxsize=1)
def _PROTOCOLOS():
    return [
        {"id":1,  "nome":"Hipertensão Arterial Sistêmica",       "sigla":"HAS",     "categoria":"Doenças Crônicas",      "pcdt_ms": True,  "versao":"2022","pacientes_alvo": 1_840, "em_protocolo": 1_420, "adesao_pct": 77.2, "monitoramentos_mes": 284, "desvios_mes": 48,  "status":"atencao"},
        {"id":2,  "nome":"Diabetes Mellitus tipo 2",             "sigla":"DM2",     "categoria":"Doenças Crônicas",      "pcdt_ms": True,  "versao":"2022","pacientes_alvo": 840,  "em_protocolo": 680,  "adesao_pct": 81.0, "monitoramentos_mes": 128, "desvios_mes": 28,  "status":"atencao"},
        {"id":3,  "nome":"Tuberculose",                          "sigla":"TB",      "categoria":"Doenças Infecciosas",   "pcdt_ms": True,  "versao":"2023","pacientes_alvo": 28,   "em_protocolo": 28,   "adesao_pct": 100.0,"monitoramentos_mes": 28,  "desvios_mes": 0,   "status":"ok"},
        {"id":4,  "nome":"Hanseníase",                           "sigla":"HANS",    "categoria":"Doenças Infecciosas",   "pcdt_ms": True,  "versao":"2022","pacientes_alvo": 18,   "em_protocolo": 18,   "adesao_pct": 100.0,"monitoramentos_mes": 18,  "desvios_mes": 0,   "status":"ok"},
        {"id":5,  "nome":"HIV/AIDS — Terapia Antirretroviral",   "sigla":"TARV",    "categoria":"IST/HIV",               "pcdt_ms": True,  "versao":"2023","pacientes_alvo": 84,   "em_protocolo": 80,   "adesao_pct": 95.2, "monitoramentos_mes": 28,  "desvios_mes": 4,   "status":"ok"},
        {"id":6,  "nome":"Pré-natal de baixo risco",             "sigla":"PRE-NAT", "categoria":"Saúde da Mulher",       "pcdt_ms": False, "versao":"2022","pacientes_alvo": 164,  "em_protocolo": 148,  "adesao_pct": 90.2, "monitoramentos_mes": 48,  "desvios_mes": 12,  "status":"ok"},
        {"id":7,  "nome":"Pré-natal de alto risco",              "sigla":"PAR",     "categoria":"Saúde da Mulher",       "pcdt_ms": False, "versao":"2022","pacientes_alvo": 28,   "em_protocolo": 22,   "adesao_pct": 78.6, "monitoramentos_mes": 12,  "desvios_mes": 8,   "status":"atencao"},
        {"id":8,  "nome":"Asma — GINA",                         "sigla":"ASMA",    "categoria":"Doenças Respiratórias", "pcdt_ms": True,  "versao":"2023","pacientes_alvo": 284,  "em_protocolo": 184,  "adesao_pct": 64.8, "monitoramentos_mes": 48,  "desvios_mes": 28,  "status":"critico"},
        {"id":9,  "nome":"Insuficiência Cardíaca",               "sigla":"IC",      "categoria":"Doenças Cardiovasc.",  "pcdt_ms": True,  "versao":"2022","pacientes_alvo": 124,  "em_protocolo": 84,   "adesao_pct": 67.7, "monitoramentos_mes": 28,  "desvios_mes": 18,  "status":"critico"},
        {"id":10, "nome":"Doença Renal Crônica",                 "sigla":"DRC",     "categoria":"Doenças Crônicas",      "pcdt_ms": True,  "versao":"2023","pacientes_alvo": 48,   "em_protocolo": 36,   "adesao_pct": 75.0, "monitoramentos_mes": 12,  "desvios_mes": 6,   "status":"atencao"},
        {"id":11, "nome":"Saúde Mental — Depressão",             "sigla":"DEPRES",  "categoria":"Saúde Mental",          "pcdt_ms": True,  "versao":"2022","pacientes_alvo": 284,  "em_protocolo": 164,  "adesao_pct": 57.7, "monitoramentos_mes": 28,  "desvios_mes": 18,  "status":"critico"},
        {"id":12, "nome":"Rastreamento Câncer de Colo Uterino",  "sigla":"PREV-CCU","categoria":"Oncologia/Prev.",       "pcdt_ms": True,  "versao":"2022","pacientes_alvo": 2_480,"em_protocolo": 1_648,"adesao_pct": 66.5, "monitoramentos_mes": 184, "desvios_mes": 48,  "status":"critico"},
        {"id":13, "nome":"Rastreamento Câncer de Mama",          "sigla":"PREV-MAM","categoria":"Oncologia/Prev.",       "pcdt_ms": True,  "versao":"2022","pacientes_alvo": 1_240,"em_protocolo": 848,  "adesao_pct": 68.4, "monitoramentos_mes": 84,  "desvios_mes": 28,  "status":"critico"},
        {"id":14, "nome":"Dislipidemia",                         "sigla":"DISL",    "categoria":"Doenças Crônicas",      "pcdt_ms": True,  "versao":"2022","pacientes_alvo": 480,  "em_protocolo": 284,  "adesao_pct": 59.2, "monitoramentos_mes": 48,  "desvios_mes": 28,  "status":"critico"},
        {"id":15, "nome":"Saúde da Criança — Puericultura",      "sigla":"PUER",    "categoria":"Saúde da Criança",      "pcdt_ms": False, "versao":"2023","pacientes_alvo": 840,  "em_protocolo": 720,  "adesao_pct": 85.7, "monitoramentos_mes": 120, "desvios_mes": 14,  "status":"ok"},
    ]


@router.get("/dashboard")
async def dashboard():
    total = len(_PROTOCOLOS())
    ok_n     = sum(1 for p in _PROTOCOLOS() if p["status"] == "ok")
    atencao  = sum(1 for p in _PROTOCOLOS() if p["status"] == "atencao")
    critico  = sum(1 for p in _PROTOCOLOS() if p["status"] == "critico")
    adesao_media = round(sum(p["adesao_pct"] for p in _PROTOCOLOS()) / total, 1)
    return {
        "protocolos_ativos": total,
        "protocolos_ok": ok_n,
        "protocolos_atencao": atencao,
        "protocolos_criticos": critico,
        "adesao_media_pct": adesao_media,
        "meta_adesao_pct": 85.0,
        "pacientes_em_protocolo": sum(p["em_protocolo"] for p in _PROTOCOLOS()),
        "monitoramentos_mes": sum(p["monitoramentos_mes"] for p in _PROTOCOLOS()),
        "desvios_mes": sum(p["desvios_mes"] for p in _PROTOCOLOS()),
        "competencia": "Jun/2026",
        "status_geral": "atencao",
    }

@router.get("/lista")
async def lista(categoria: str = "", status: str = ""):
    items = _PROTOCOLOS()
    if categoria: items = [p for p in items if p["categoria"] == categoria]
    if status:    items = [p for p in items if p["status"] == status]
    return items

@router.get("/desvios")
async def desvios():
    return [
        {"protocolo": "HAS",     "desvio": "PA não aferida na consulta",              "n_mes": 24, "unidade": "UBS Nova Esperança", "causa": "Esfigmomanômetro com defeito — substituído em Jun/26"},
        {"protocolo": "HAS",     "desvio": "Consulta > 3 meses sem retorno",           "n_mes": 18, "unidade": "Múltiplas UBS",      "causa": "Zona rural — dificuldade de deslocamento"},
        {"protocolo": "DM2",     "desvio": "HbA1c sem solicitação semestral",          "n_mes": 16, "unidade": "UBS Linha 7",        "causa": "Cartucho HbA1c em falta — aguardando reposição laboratório"},
        {"protocolo": "ASMA",    "desvio": "Sem espirometria anual documentada",       "n_mes": 14, "unidade": "UBS Central",        "causa": "Espirômetro sem manutenção — laudado para reparo"},
        {"protocolo": "DEPRES",  "desvio": "Consulta psiquiátrica > 90 dias pendente", "n_mes": 12, "unidade": "CAPS/UBS",           "causa": "Fila regulação Manaus — tempo médio espera: 94 dias"},
        {"protocolo": "PREV-CCU","desvio": "Citologia > 3 anos sem coleta",            "n_mes": 28, "unidade": "Zona Rural",         "causa": "Busca ativa ACS programada para Jul/26"},
        {"protocolo": "IC",      "desvio": "ECG sem solicitação bimestral",            "n_mes": 10, "unidade": "UBS Kennedy",        "causa": "Médico temporário sem familiaridade com protocolo local"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "adesao_media": 71.4, "desvios": 312, "monitoramentos": 984},
        {"mes": "Fev/26", "adesao_media": 72.8, "desvios": 296, "monitoramentos": 992},
        {"mes": "Mar/26", "adesao_media": 73.4, "desvios": 280, "monitoramentos": 1_008},
        {"mes": "Abr/26", "adesao_media": 74.6, "desvios": 268, "monitoramentos": 1_024},
        {"mes": "Mai/26", "adesao_media": 75.2, "desvios": 260, "monitoramentos": 1_016},
        {"mes": "Jun/26", "adesao_media": 76.1, "desvios": 248, "monitoramentos": 1_040},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Adesão média aos protocolos",      "valor": 76.1, "meta": 85.0, "unidade": "%","status": "atencao", "observacao": "Depressão (57.7%), Dislipidemia (59.2%) e Asma (64.8%) puxam a média para baixo"},
        {"indicador": "Protocolos com adesão crítica",    "valor": 5,    "meta": 0,    "unidade": "n", "status": "critico", "observacao": "Asma, IC, Depressão, Rastr. CCU e Rastr. Mama abaixo de 70%"},
        {"indicador": "Desvios de protocolo/mês",         "valor": 248,  "meta": 100,  "unidade": "n", "status": "atencao", "observacao": "Tendência de queda — 312 em Jan/26 → 248 em Jun/26"},
        {"indicador": "Pacientes TB 100% em protocolo",   "valor": 100,  "meta": 100,  "unidade": "%","status": "ok",      "observacao": "Acompanhamento DOT para todos os casos de TB ativa"},
        {"indicador": "TARV — adherência confirmada",     "valor": 95.2, "meta": 95.0, "unidade": "%","status": "ok",      "observacao": "Retirada CEAF e carga viral indetectável como proxy de adesão"},
        {"indicador": "Pré-natal baixo risco — protocolo","valor": 90.2, "meta": 90.0, "unidade": "%","status": "ok",      "observacao": "6 consultas mínimas: 94% — exames do 1º trimestre: 88%"},
    ]