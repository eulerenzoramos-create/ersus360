"""Saúde Ribeirinha — Comunidades Ribeirinhas · FMS Apuí/AM"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-ribeirinha", tags=["saude_ribeirinha"])

@lru_cache(maxsize=1)
def _COMUNIDADES():
    return [
        {"id": 1, "nome": "Comunidade Santo Antônio do Matupi",  "rio": "Rio Madeira",      "populacao": 284, "distancia_sede_km": 42,  "acesso": "fluvial",          "ubs_referencia": "UBS Matupi",       "equipe_esf": "ESF Ribeirinhas",  "ultima_visita": "Jun/2026", "status": "ok"},
        {"id": 2, "nome": "Comunidade São Raimundo do Aripuanã",  "rio": "Rio Aripuanã",    "populacao": 196, "distancia_sede_km": 78,  "acesso": "fluvial",          "ubs_referencia": "UBS Matupi",       "equipe_esf": "ESF Ribeirinhas",  "ultima_visita": "Mai/2026", "status": "atencao"},
        {"id": 3, "nome": "Comunidade Linha 7 Margens",           "rio": "Rio Madeira",      "populacao": 148, "distancia_sede_km": 35,  "acesso": "fluvial/terrestre","ubs_referencia": "UBS Linha 7",      "equipe_esf": "ESF Linha 7",      "ultima_visita": "Jun/2026", "status": "atencao"},
        {"id": 4, "nome": "Comunidade Nova Esperança do Juma",    "rio": "Rio Juma",         "populacao": 210, "distancia_sede_km": 94,  "acesso": "fluvial",          "ubs_referencia": "UBS Matupi",       "equipe_esf": "ESF Ribeirinhas",  "ultima_visita": "Abr/2026", "status": "critico"},
        {"id": 5, "nome": "Comunidade Boca do Acari",             "rio": "Rio Acari",        "populacao": 124, "distancia_sede_km": 118, "acesso": "fluvial",          "ubs_referencia": "UBS Sede",         "equipe_esf": "ESF Ribeirinhas",  "ultima_visita": "Mar/2026", "status": "critico"},
        {"id": 6, "nome": "Comunidade Boa Esperança",             "rio": "Rio Madeira",      "populacao": 88,  "distancia_sede_km": 28,  "acesso": "fluvial/terrestre","ubs_referencia": "UBS Sede",         "equipe_esf": "ESF Sede A",       "ultima_visita": "Jun/2026", "status": "ok"},
        {"id": 7, "nome": "Comunidade São José do Mapari",        "rio": "Rio Mapari",       "populacao": 72,  "distancia_sede_km": 132, "acesso": "fluvial",          "ubs_referencia": "UBS Matupi",       "equipe_esf": "ESF Ribeirinhas",  "ultima_visita": "Fev/2026", "status": "critico"},
        {"id": 8, "nome": "Comunidade Boa Vista do Jaraqui",      "rio": "Rio Madeira",      "populacao": 56,  "distancia_sede_km": 52,  "acesso": "fluvial",          "ubs_referencia": "UBS Sede",         "equipe_esf": "ESF Ribeirinhas",  "ultima_visita": "Mai/2026", "status": "ok"},
    ]


@router.get("/dashboard")
async def dashboard():
    total_pop = sum(c["populacao"] for c in _COMUNIDADES())
    ok = sum(1 for c in _COMUNIDADES() if c["status"] == "ok")
    atencao = sum(1 for c in _COMUNIDADES() if c["status"] == "atencao")
    critico = sum(1 for c in _COMUNIDADES() if c["status"] == "critico")
    return {
        "comunidades_cadastradas": len(_COMUNIDADES()),
        "populacao_ribeirinha_total": total_pop,
        "populacao_ribeirinha_pct_municipio": round(total_pop / 18852 * 100, 1),
        "comunidades_ok": ok,
        "comunidades_atencao": atencao,
        "comunidades_criticas": critico,
        "atendimentos_itinerantes_mes": 312,
        "consultas_barco_samu_mes": 48,
        "encaminhamentos_sede_mes": 28,
        "cobertura_vacinacao_pct": 74.2,
        "acompanhamento_pre_natal_pct": 62.8,
        "distancia_maxima_km": 132,
        "equipes_com_embarcacao": 1,
        "ultima_expedicao": "Jun/2026",
        "status_geral": "atencao",
        "competencia": "Jun/2026",
    }

@router.get("/comunidades")
async def comunidades():
    return _COMUNIDADES

@router.get("/atendimentos-itinerantes")
async def atendimentos_itinerantes():
    return [
        {"mes": "Jan/26", "comunidade": "Santo Antônio do Matupi",   "profissional": "Médico + Enfermeiro", "atendimentos": 48, "procedimentos": 62, "encaminhamentos": 4},
        {"mes": "Jan/26", "comunidade": "São Raimundo do Aripuanã",  "profissional": "Enfermeiro",          "atendimentos": 32, "procedimentos": 44, "encaminhamentos": 3},
        {"mes": "Fev/26", "comunidade": "Nova Esperança do Juma",    "profissional": "Médico + Enfermeiro", "atendimentos": 38, "procedimentos": 52, "encaminhamentos": 5},
        {"mes": "Mar/26", "comunidade": "Boca do Acari",             "profissional": "Médico",              "atendimentos": 28, "procedimentos": 36, "encaminhamentos": 6},
        {"mes": "Abr/26", "comunidade": "Linha 7 Margens",           "profissional": "Médico + Enfermeiro", "atendimentos": 42, "procedimentos": 58, "encaminhamentos": 3},
        {"mes": "Mai/26", "comunidade": "São José do Mapari",        "profissional": "Enfermeiro",          "atendimentos": 22, "procedimentos": 28, "encaminhamentos": 4},
        {"mes": "Jun/26", "comunidade": "Boa Esperança",             "profissional": "Médico + Enfermeiro", "atendimentos": 36, "procedimentos": 48, "encaminhamentos": 2},
        {"mes": "Jun/26", "comunidade": "Boa Vista do Jaraqui",      "profissional": "Enfermeiro",          "atendimentos": 28, "procedimentos": 34, "encaminhamentos": 1},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "atendimentos": 284, "comunidades_visitadas": 6, "encaminhamentos": 22, "cobertura_pre_natal_pct": 58.4},
        {"mes": "Fev/26", "atendimentos": 294, "comunidades_visitadas": 6, "encaminhamentos": 24, "cobertura_pre_natal_pct": 59.2},
        {"mes": "Mar/26", "atendimentos": 298, "comunidades_visitadas": 7, "encaminhamentos": 26, "cobertura_pre_natal_pct": 60.8},
        {"mes": "Abr/26", "atendimentos": 304, "comunidades_visitadas": 7, "encaminhamentos": 27, "cobertura_pre_natal_pct": 61.4},
        {"mes": "Mai/26", "atendimentos": 308, "comunidades_visitadas": 7, "encaminhamentos": 27, "cobertura_pre_natal_pct": 62.1},
        {"mes": "Jun/26", "atendimentos": 312, "comunidades_visitadas": 8, "encaminhamentos": 28, "cobertura_pre_natal_pct": 62.8},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura de atenção à saúde ribeirinha",       "valor": 87.4, "meta": 100.0, "unidade": "%",  "status": "atencao", "observacao": "8 comunidades cadastradas — 3 com visita há >60 dias (Boca do Acari, São José do Mapari)"},
        {"indicador": "Acompanhamento pré-natal em gestantes ribeirinhas", "valor": 62.8,"meta": 85.0,"unidade": "%", "status": "critico", "observacao": "Dificuldade de acesso fluvial em período de cheia/seca impede regularidade"},
        {"indicador": "Cobertura vacinal em crianças ribeirinhas",     "valor": 74.2, "meta": 95.0, "unidade": "%",  "status": "critico", "observacao": "Distância e acesso fluvial críticos — comunidades São José do Mapari e Boca do Acari com coberturas <60%"},
        {"indicador": "Encaminhamentos com resolução confirmada",      "valor": 82.1, "meta": 90.0, "unidade": "%",  "status": "atencao", "observacao": "Referência para sede: 28/mês — 5 sem retorno confirmado no mês"},
        {"indicador": "Equipes com embarcação disponível",             "valor": 1,    "meta": 3,    "unidade": "n",  "status": "critico", "observacao": "Apenas a ESF Ribeirinhas possui barco próprio — parceria SAMU para demais"},
        {"indicador": "Frequência média de visita/comunidade",         "valor": 1.4,  "meta": 2.0,  "unidade": "visitas/mês", "status": "atencao", "observacao": "Periodicidade mínima não atingida em 3 comunidades (>2 meses sem visita)"},
    ]
