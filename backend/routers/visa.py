"""VISA — Vigilância Sanitária Municipal · Alvarás · Fiscalizações · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/visa", tags=["visa"])

@router.get("/dashboard")
async def dashboard():
    return {
        "estabelecimentos_cadastrados": 284,
        "alvaras_vigentes": 218,
        "alvaras_vencidos": 42,
        "alvaras_vencendo_30d": 24,
        "inspecoes_mes": 68,
        "inspecoes_meta_mes": 80,
        "autos_infracao_mes": 8,
        "interdicoes_ativas": 2,
        "estabelecimentos_alto_risco": 48,
        "alto_risco_inspecionados_pct": 62.5,
        "meta_alto_risco_inspecionados_pct": 100,
        "queixas_tecnicas_mes": 12,
        "queixas_atendidas_pct": 83.3,
        "status_geral": "atencao",
    }

@router.get("/estabelecimentos")
async def estabelecimentos():
    return [
        {"categoria": "Farmácias e drogarias",      "total": 18, "alvara_vigente": 16, "alto_risco": True,  "inspecionados_mes": 8,  "autos": 1, "interdicoes": 0, "status": "ok"},
        {"categoria": "Restaurantes e lanchonetes", "total": 64, "alvara_vigente": 48, "alto_risco": False, "inspecionados_mes": 18, "autos": 2, "interdicoes": 0, "status": "atencao"},
        {"categoria": "Serviços de saúde privado",  "total": 22, "alvara_vigente": 20, "alto_risco": True,  "inspecionados_mes": 10, "autos": 0, "interdicoes": 0, "status": "ok"},
        {"categoria": "Padarias e confeitarias",    "total": 28, "alvara_vigente": 22, "alto_risco": False, "inspecionados_mes": 6,  "autos": 2, "interdicoes": 1, "status": "critico"},
        {"categoria": "Supermercados e mercearias", "total": 38, "alvara_vigente": 30, "alto_risco": False, "inspecionados_mes": 8,  "autos": 1, "interdicoes": 0, "status": "atencao"},
        {"categoria": "Laboratórios e clínicas",    "total": 14, "alvara_vigente": 14, "alto_risco": True,  "inspecionados_mes": 6,  "autos": 0, "interdicoes": 0, "status": "ok"},
        {"categoria": "Indústria de alimentos",     "total": 12, "alvara_vigente": 10, "alto_risco": True,  "inspecionados_mes": 4,  "autos": 1, "interdicoes": 1, "status": "critico"},
        {"categoria": "Cosméticos e estética",      "total": 32, "alvara_vigente": 24, "alto_risco": False, "inspecionados_mes": 4,  "autos": 1, "interdicoes": 0, "status": "atencao"},
        {"categoria": "Postos de combustível",      "total": 8,  "alvara_vigente": 8,  "alto_risco": True,  "inspecionados_mes": 4,  "autos": 0, "interdicoes": 0, "status": "ok"},
        {"categoria": "Outros estabelecimentos",    "total": 48, "alvara_vigente": 26, "alto_risco": False, "inspecionados_mes": 0,  "autos": 0, "interdicoes": 0, "status": "atencao"},
    ]

@router.get("/inspecoes")
async def inspecoes():
    return [
        {"nro": "VISA-2026-0184", "estabelecimento": "Padaria Flor do Campo",     "categoria": "Padaria",        "data": "18/03/2026", "resultado": "reprovado",   "irregularidades": ["Ausência de controle de temperatura","Manipuladores sem EPI","Dedetização vencida"],   "auto": True,  "interdicao": True,  "prazo_saneamento": "25/03/2026"},
        {"nro": "VISA-2026-0183", "estabelecimento": "Farmácia Central Apuí",     "categoria": "Farmácia",       "data": "17/03/2026", "resultado": "aprovado",    "irregularidades": [],                                                                                    "auto": False, "interdicao": False, "prazo_saneamento": None},
        {"nro": "VISA-2026-0182", "estabelecimento": "Frigorífico Nova Amazônia", "categoria": "Ind. Alimentos", "data": "15/03/2026", "resultado": "reprovado",   "irregularidades": ["Produto fora de prazo em estoque","Registro MS ausente para 2 produtos"],            "auto": True,  "interdicao": True,  "prazo_saneamento": "22/03/2026"},
        {"nro": "VISA-2026-0181", "estabelecimento": "Restaurante Beira Rio",     "categoria": "Restaurante",    "data": "14/03/2026", "resultado": "condicional", "irregularidades": ["Extintores vencidos","Falta de lavatório exclusivo na cozinha"],                    "auto": True,  "interdicao": False, "prazo_saneamento": "14/04/2026"},
        {"nro": "VISA-2026-0180", "estabelecimento": "Clínica Saúde Total",       "categoria": "Serv. Saúde",    "data": "12/03/2026", "resultado": "aprovado",    "irregularidades": [],                                                                                    "auto": False, "interdicao": False, "prazo_saneamento": None},
        {"nro": "VISA-2026-0179", "estabelecimento": "Supermercado JM",           "categoria": "Supermercado",   "data": "10/03/2026", "resultado": "condicional", "irregularidades": ["Produto sem registro em seção de cosméticos"],                                      "auto": False, "interdicao": False, "prazo_saneamento": "10/04/2026"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "inspecoes": 58, "autos": 6, "interdicoes": 1, "alvaras_emitidos": 28, "queixas": 8,  "alto_risco_pct": 52.0},
        {"mes": "Nov/25", "inspecoes": 62, "autos": 7, "interdicoes": 2, "alvaras_emitidos": 24, "queixas": 10, "alto_risco_pct": 56.0},
        {"mes": "Dez/25", "inspecoes": 54, "autos": 5, "interdicoes": 1, "alvaras_emitidos": 32, "queixas": 9,  "alto_risco_pct": 54.0},
        {"mes": "Jan/26", "inspecoes": 64, "autos": 6, "interdicoes": 1, "alvaras_emitidos": 26, "queixas": 11, "alto_risco_pct": 58.0},
        {"mes": "Fev/26", "inspecoes": 66, "autos": 7, "interdicoes": 2, "alvaras_emitidos": 22, "queixas": 10, "alto_risco_pct": 60.0},
        {"mes": "Mar/26", "inspecoes": 68, "autos": 8, "interdicoes": 2, "alvaras_emitidos": 18, "queixas": 12, "alto_risco_pct": 62.5},
    ]

@router.get("/autos")
async def autos():
    return [
        {"nro": "AI-2026-0048", "estabelecimento": "Padaria Flor do Campo",     "categoria": "Padaria",        "data": "18/03/2026", "artigo": "Art. 7º Lei 6.437/77", "penalidade": "Interdição parcial", "valor_multa": 4800.00, "status": "interditado",  "prazo_defesa": "25/03/2026"},
        {"nro": "AI-2026-0047", "estabelecimento": "Frigorífico Nova Amazônia", "categoria": "Ind. Alimentos", "data": "15/03/2026", "artigo": "Art. 10º Lei 6.437/77","penalidade": "Interdição total",   "valor_multa": 9600.00, "status": "interditado",  "prazo_defesa": "22/03/2026"},
        {"nro": "AI-2026-0046", "estabelecimento": "Restaurante Beira Rio",     "categoria": "Restaurante",    "data": "14/03/2026", "artigo": "Art. 8º Lei 6.437/77", "penalidade": "Multa",             "valor_multa": 2400.00, "status": "em_recurso",   "prazo_defesa": "14/04/2026"},
        {"nro": "AI-2026-0045", "estabelecimento": "Supermercado JM",           "categoria": "Supermercado",   "data": "10/03/2026", "artigo": "Art. 9º Lei 6.437/77", "penalidade": "Advertência",       "valor_multa": 0,       "status": "regularizado", "prazo_defesa": None},
        {"nro": "AI-2026-0044", "estabelecimento": "Farmácia Bem Estar",        "categoria": "Farmácia",       "data": "05/03/2026", "artigo": "RDC 44/2009",          "penalidade": "Multa",             "valor_multa": 3200.00, "status": "pago",         "prazo_defesa": None},
        {"nro": "AI-2026-0043", "estabelecimento": "Salão Beleza Total",        "categoria": "Estética",       "data": "02/03/2026", "artigo": "RDC 15/2013",          "penalidade": "Advertência",       "valor_multa": 0,       "status": "regularizado", "prazo_defesa": None},
        {"nro": "AI-2026-0042", "estabelecimento": "Indústria de Biscoitos AM", "categoria": "Ind. Alimentos", "data": "28/02/2026", "artigo": "Art. 10º Lei 6.437/77","penalidade": "Multa",             "valor_multa": 6400.00, "status": "em_defesa",    "prazo_defesa": "28/03/2026"},
        {"nro": "AI-2026-0041", "estabelecimento": "Padaria Pão do Norte",      "categoria": "Padaria",        "data": "24/02/2026", "artigo": "Art. 7º Lei 6.437/77", "penalidade": "Advertência",       "valor_multa": 0,       "status": "regularizado", "prazo_defesa": None},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura inspeção alto risco",       "valor": 62.5, "meta": 100, "unidade": "%", "status": "critico",  "observacao": "30/48 estab. alto risco inspecionados — 18 sem visita em 2026"},
        {"indicador": "Alvarás vencidos sem renovação",      "valor": 42,   "meta": 0,   "unidade": "un","status": "atencao",  "observacao": "14.8% do cadastro com alvará expirado"},
        {"indicador": "Interdições sanitárias ativas",       "valor": 2,    "meta": 0,   "unidade": "un","status": "atencao",  "observacao": "Padaria Flor do Campo + Frigorífico Nova Amazônia"},
        {"indicador": "Inspeções realizadas / meta",         "valor": 85.0, "meta": 100, "unidade": "%", "status": "atencao",  "observacao": "68/80 — déficit de 12 inspeções no mês"},
        {"indicador": "Queixas técnicas resolvidas",         "valor": 83.3, "meta": 100, "unidade": "%", "status": "atencao",  "observacao": "10 de 12 queixas atendidas dentro do prazo"},
        {"indicador": "Autos de infração lavrados",          "valor": 8,    "meta": None,"unidade": "un","status": "ok",       "observacao": "Crescimento de 33% vs. Out/25 — tendência de aumento"},
    ]
