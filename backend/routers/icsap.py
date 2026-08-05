"""
ICSAP — Internações por Condições Sensíveis à Atenção Primária — Apuí/AM
Portaria SAS/MS nº 221/2008 — Lista Brasileira de ICSAP
Indicador de desempenho e qualidade da APS
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/icsap", tags=["ICSAP"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "competencia": "Mar/2026",
        "internacoes_total_mes": 112,
        "icsap_mes": 42,
        "icsap_pct": 37.5,
        "icsap_status": "critico",
        "meta_icsap_pct": 25.0,
        "tendencia": "alta",
        "top_causa": "Insuficiência cardíaca",
        "custo_icsap_mes": 48640.0,
        "internacoes_evitiveis_12m": 486,
    }


@lru_cache(maxsize=1)
def _CAUSAS_ICSAP():
    return [
        {"grupo":"Insuficiência cardíaca",         "cid":"I50","internacoes_mes":9, "pct_icsap":21.4,"tendencia":"alta",   "esf_principal":"ESF Apuí Centro","custo_medio":1420},
        {"grupo":"Doenças cerebrovasculares",      "cid":"I60-I69","internacoes_mes":6,"pct_icsap":14.3,"tendencia":"estavel","esf_principal":"ESF Apuí Centro","custo_medio":1840},
        {"grupo":"Asma",                           "cid":"J45-J46","internacoes_mes":5,"pct_icsap":11.9,"tendencia":"alta",   "esf_principal":"ESF Matupi","custo_medio":980},
        {"grupo":"Infecção do trato urinário",     "cid":"N10-N12","internacoes_mes":5,"pct_icsap":11.9,"tendencia":"estavel","esf_principal":"ESF São Francisco","custo_medio":760},
        {"grupo":"Hipertensão",                    "cid":"I10-I11","internacoes_mes":4,"pct_icsap":9.5, "tendencia":"alta",   "esf_principal":"ESF Apuí Centro","custo_medio":1120},
        {"grupo":"Diabetes mellitus",              "cid":"E10-E14","internacoes_mes":4,"pct_icsap":9.5, "tendencia":"alta",   "esf_principal":"ESF Apuí Centro","custo_medio":1240},
        {"grupo":"Doenças das vias aéreas inf.",   "cid":"J20-J22","internacoes_mes":3,"pct_icsap":7.1, "tendencia":"estavel","esf_principal":"ESF Matupi","custo_medio":880},
        {"grupo":"Outras ICSAP",                  "cid":"Variado","internacoes_mes":6,"pct_icsap":14.3,"tendencia":"estavel","esf_principal":"—","custo_medio":920},
    ]


@lru_cache(maxsize=1)
def _HISTORICO_MENSAL():
    return [
        {"mes":"Out/25","internacoes_total":98, "icsap":34,"pct_icsap":34.7,"custo_icsap":39280},
        {"mes":"Nov/25","internacoes_total":102,"icsap":36,"pct_icsap":35.3,"custo_icsap":41760},
        {"mes":"Dez/25","internacoes_total":88, "icsap":30,"pct_icsap":34.1,"custo_icsap":34800},
        {"mes":"Jan/26","internacoes_total":108,"icsap":39,"pct_icsap":36.1,"custo_icsap":45240},
        {"mes":"Fev/26","internacoes_total":104,"icsap":38,"pct_icsap":36.5,"custo_icsap":44080},
        {"mes":"Mar/26","internacoes_total":112,"icsap":42,"pct_icsap":37.5,"custo_icsap":48640},
    ]


@lru_cache(maxsize=1)
def _POR_ESF():
    return [
        {"esf":"ESF Apuí Centro",  "pop_coberta":4200,"internacoes_icsap_mes":18,"taxa_100mil":428.6,"meta_100mil":280,"status":"critico","principal_causa":"IC / HAS"},
        {"esf":"ESF São Francisco","pop_coberta":3100,"internacoes_icsap_mes":11,"taxa_100mil":354.8,"meta_100mil":280,"status":"critico","principal_causa":"ITU / DCV"},
        {"esf":"ESF Matupi",       "pop_coberta":2800,"internacoes_icsap_mes":8, "taxa_100mil":285.7,"meta_100mil":280,"status":"atencao","principal_causa":"Asma"},
        {"esf":"ESF Zona Rural",   "pop_coberta":2100,"internacoes_icsap_mes":5, "taxa_100mil":238.1,"meta_100mil":280,"status":"ok",     "principal_causa":"Gastroenterite"},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao":"Revisar protocolo HAS descompensada nas ESF",    "prioridade":"alta","causa_alvo":"Hipertensão / IC","responsavel":"Coordenação APS","prazo":"Abr/26","status":"em andamento"},
        {"acao":"Ampliar grupos de DM + visita domiciliar HAS",   "prioridade":"alta","causa_alvo":"Diabetes / HAS","responsavel":"ESF Apuí Centro","prazo":"Mai/26","status":"planejado"},
        {"acao":"Aumentar disponibilidade de salbutamol inalador","prioridade":"media","causa_alvo":"Asma","responsavel":"Farmácia Central","prazo":"Abr/26","status":"em andamento"},
        {"acao":"Busca ativa ITU — mulheres >60 anos sem consulta","prioridade":"media","causa_alvo":"ITU","responsavel":"ACS / ESF São Francisco","prazo":"Mai/26","status":"planejado"},
    ]


@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD

@router.get("/causas")
async def causas():
    return _CAUSAS_ICSAP

@router.get("/historico")
async def historico():
    return _HISTORICO_MENSAL

@router.get("/por-esf")
async def por_esf():
    return _POR_ESF

@router.get("/acoes")
async def acoes():
    return _ACOES
