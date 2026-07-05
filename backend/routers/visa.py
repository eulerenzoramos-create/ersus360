"""
Vigilância Sanitária — VISA Apuí/AM
Inspeções, Autos de Infração, Licenças
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/visa", tags=["Vigilância Sanitária"])

_ESTABELECIMENTOS = [
    {"id":1, "razao":"Supermercado Bom Preço",     "atividade":"Comércio alimentos",     "risco":"alto",  "ultima_inspecao":"2026-02-10","proxima_inspecao":"2026-08-10","resultado":"regular",  "licenca_valida":True, "validade_licenca":"2027-01-31","autos":0},
    {"id":2, "razao":"Farmácia Saúde Total",        "atividade":"Farmácia",               "risco":"alto",  "ultima_inspecao":"2026-01-20","proxima_inspecao":"2026-07-20","resultado":"bom",      "licenca_valida":True, "validade_licenca":"2027-03-31","autos":0},
    {"id":3, "razao":"Clínica Médica Apuí",         "atividade":"Serviço saúde",          "risco":"alto",  "ultima_inspecao":"2026-03-05","proxima_inspecao":"2026-09-05","resultado":"regular",  "licenca_valida":True, "validade_licenca":"2026-12-31","autos":1},
    {"id":4, "razao":"Restaurante O Bom Sabor",     "atividade":"Alimentação coletiva",   "risco":"alto",  "ultima_inspecao":"2026-03-18","proxima_inspecao":"2026-09-18","resultado":"insatisfatorio","licenca_valida":True,"validade_licenca":"2026-10-31","autos":2},
    {"id":5, "razao":"Açougue Central",             "atividade":"Produtos origem animal", "risco":"alto",  "ultima_inspecao":"2026-02-28","proxima_inspecao":"2026-08-28","resultado":"regular",  "licenca_valida":True, "validade_licenca":"2026-11-30","autos":0},
    {"id":6, "razao":"Distribuidora Água Mineral",  "atividade":"Água/bebidas",           "risco":"alto",  "ultima_inspecao":"2026-01-15","proxima_inspecao":"2026-07-15","resultado":"bom",      "licenca_valida":True, "validade_licenca":"2027-01-31","autos":0},
    {"id":7, "razao":"Ótica Visão Clara",           "atividade":"Ótica/produtos médicos", "risco":"medio", "ultima_inspecao":"2025-11-20","proxima_inspecao":"2026-05-20","resultado":"bom",      "licenca_valida":False,"validade_licenca":"2026-03-31","autos":0},
    {"id":8, "razao":"Salão de Beleza Glamour",     "atividade":"Serviços estéticos",     "risco":"medio", "ultima_inspecao":"2025-12-10","proxima_inspecao":"2026-06-10","resultado":"regular",  "licenca_valida":True, "validade_licenca":"2026-12-31","autos":0},
    {"id":9, "razao":"Laboratório de Análises",     "atividade":"Laboratório clínico",    "risco":"alto",  "ultima_inspecao":"2026-03-22","proxima_inspecao":"2026-09-22","resultado":"bom",      "licenca_valida":True, "validade_licenca":"2027-02-28","autos":0},
    {"id":10,"razao":"Drogaria Popular",            "atividade":"Farmácia",               "risco":"alto",  "ultima_inspecao":"2026-02-05","proxima_inspecao":"2026-08-05","resultado":"regular",  "licenca_valida":True, "validade_licenca":"2027-01-31","autos":0},
    {"id":11,"razao":"Panificadora Pão Fresco",     "atividade":"Comércio alimentos",     "risco":"alto",  "ultima_inspecao":"2026-01-08","proxima_inspecao":"2026-07-08","resultado":"insatisfatorio","licenca_valida":True,"validade_licenca":"2026-09-30","autos":1},
    {"id":12,"razao":"Posto de Gasolina Rio Verde", "atividade":"Combustíveis",           "risco":"medio", "ultima_inspecao":"2025-10-15","proxima_inspecao":"2026-04-15","resultado":"regular",  "licenca_valida":False,"validade_licenca":"2025-12-31","autos":0},
    {"id":13,"razao":"Clínica Odontológica Sorri",  "atividade":"Serviço saúde",          "risco":"alto",  "ultima_inspecao":"2026-04-02","proxima_inspecao":"2026-10-02","resultado":"bom",      "licenca_valida":True, "validade_licenca":"2027-04-30","autos":0},
    {"id":14,"razao":"Hotel Apuí Center",           "atividade":"Hospedagem",             "risco":"medio", "ultima_inspecao":"2025-09-20","proxima_inspecao":"2026-03-20","resultado":"regular",  "licenca_valida":True, "validade_licenca":"2026-11-30","autos":0},
    {"id":15,"razao":"Mercearia do João",           "atividade":"Comércio alimentos",     "risco":"medio", "ultima_inspecao":"2025-12-18","proxima_inspecao":"2026-06-18","resultado":"bom",      "licenca_valida":True, "validade_licenca":"2026-12-31","autos":0},
]

_AUTOS = [
    {"id":1,"estab_id":3,"estab":"Clínica Médica Apuí",   "infracao":"Descarte irregular resíduo infectante","base_legal":"RDC 222/2018","data":"2026-03-05","status":"em_prazo","prazo_regularizacao":"2026-05-05","multa_est":2000.0},
    {"id":2,"estab_id":4,"estab":"Restaurante O Bom Sabor","infracao":"Temperatura inadequada câmara fria",   "base_legal":"RDC 216/2004","data":"2026-03-18","status":"em_prazo","prazo_regularizacao":"2026-04-18","multa_est":1500.0},
    {"id":3,"estab_id":4,"estab":"Restaurante O Bom Sabor","infracao":"Manipulador sem exame admissional",    "base_legal":"RDC 216/2004","data":"2026-03-18","status":"em_prazo","prazo_regularizacao":"2026-04-25","multa_est":800.0},
    {"id":4,"estab_id":11,"estab":"Panificadora Pão Fresco","infracao":"Produtos sem identificação de validade","base_legal":"Lei 8.078/1990","data":"2026-01-08","status":"vencido","prazo_regularizacao":"2026-03-08","multa_est":1200.0},
]

_INSPECOES_MES = [
    {"mes":"Out/25","realizadas":8,"programadas":10,"autos_lavrados":1},
    {"mes":"Nov/25","realizadas":9,"programadas":10,"autos_lavrados":0},
    {"mes":"Dez/25","realizadas":7,"programadas":8, "autos_lavrados":2},
    {"mes":"Jan/26","realizadas":10,"programadas":10,"autos_lavrados":0},
    {"mes":"Fev/26","realizadas":8,"programadas":10,"autos_lavrados":1},
    {"mes":"Mar/26","realizadas":11,"programadas":10,"autos_lavrados":3},
]

@router.get("/dashboard")
async def dashboard():
    insatisf     = sum(1 for e in _ESTABELECIMENTOS if e["resultado"]=="insatisfatorio")
    lic_vencida  = sum(1 for e in _ESTABELECIMENTOS if not e["licenca_valida"])
    vencidos_auto= sum(1 for a in _AUTOS if a["status"]=="vencido")
    return {
        "competencia":          "Abr/2026",
        "total_estabelecimentos": len(_ESTABELECIMENTOS),
        "inspecionados_ano":    12,
        "resultado_insatisfatorio": insatisf,
        "licencas_vencidas":    lic_vencida,
        "autos_abertos":        len(_AUTOS),
        "autos_vencidos":       vencidos_auto,
        "proximas_inspecoes":   sum(1 for e in _ESTABELECIMENTOS if e["proxima_inspecao"] <= "2026-06-30"),
        "historico":            _INSPECOES_MES,
    }

@router.get("/estabelecimentos")
async def estabelecimentos():
    return sorted(_ESTABELECIMENTOS, key=lambda x: (x["resultado"]!="insatisfatorio", x["licenca_valida"], x["proxima_inspecao"]))

@router.get("/autos")
async def autos():
    return _AUTOS

@router.get("/inspecoes")
async def inspecoes():
    return _INSPECOES_MES
