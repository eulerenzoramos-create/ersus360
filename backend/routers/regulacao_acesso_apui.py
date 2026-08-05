from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/regulacao-acesso-apui", tags=["regulacao_acesso_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "fila_total_ativa": 1284,
        "fila_consultas_espec": 842,
        "fila_exames_mac": 312,
        "fila_cirurgias_eletivas": 130,
        "tempo_medio_espera_dias": 148,
        "meta_tempo_espera_dias": 60,
        "solicitacoes_mes": 284,
        "reguladas_mes": 218,
        "reguladas_pct": 76.8,
        "negadas_mes": 28,
        "pendentes_mais_180dias": 184,
        "referencias_manaus_mes": 98,
        "contrarreferencias_retorno_pct": 38.4,
        "status_fila": "critico",
        "status_regulacao": "atencao",
    }


@lru_cache(maxsize=1)
def _ESPECIALIDADES_FILA():
    return [
        {"especialidade": "Ortopedia",         "fila": 148, "espera_media_dias": 284, "cotas_mes": 8,  "oferta": "Manaus", "status": "critico"},
        {"especialidade": "Neurologia",        "fila": 124, "espera_media_dias": 312, "cotas_mes": 4,  "oferta": "Manaus", "status": "critico"},
        {"especialidade": "Dermatologia",      "fila": 112, "espera_media_dias": 248, "cotas_mes": 6,  "oferta": "Manaus", "status": "critico"},
        {"especialidade": "Cardiologia",       "fila": 98,  "espera_media_dias": 184, "cotas_mes": 8,  "oferta": "Manaus", "status": "critico"},
        {"especialidade": "Oftalmologia",      "fila": 84,  "espera_media_dias": 168, "cotas_mes": 12, "oferta": "Manaus/presencial bim.", "status": "atencao"},
        {"especialidade": "Ginecologia/Obst.", "fila": 72,  "espera_media_dias": 148, "cotas_mes": 12, "oferta": "Manaus/TeleSaúde",  "status": "atencao"},
        {"especialidade": "Urologia",          "fila": 64,  "espera_media_dias": 224, "cotas_mes": 4,  "oferta": "Manaus", "status": "critico"},
        {"especialidade": "Endocrinologia",    "fila": 58,  "espera_media_dias": 196, "cotas_mes": 4,  "oferta": "Manaus", "status": "critico"},
        {"especialidade": "Pneumologia",       "fila": 42,  "espera_media_dias": 148, "cotas_mes": 4,  "oferta": "Manaus", "status": "atencao"},
        {"especialidade": "Psiquiatria",       "fila": 40,  "espera_media_dias": 124, "cotas_mes": 2,  "oferta": "Manaus (visita 2×/mês)", "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _EXAMES_MAC():
    return [
        {"exame": "Tomografia computadorizada", "fila": 84,  "espera_dias": 124, "cotas_mes": 4,  "status": "critico"},
        {"exame": "Ressonância magnética",       "fila": 72,  "espera_dias": 184, "cotas_mes": 2,  "status": "critico"},
        {"exame": "Ecocardiograma",              "fila": 48,  "espera_dias": 96,  "cotas_mes": 6,  "status": "atencao"},
        {"exame": "Colonoscopia/endoscopia",     "fila": 42,  "espera_dias": 148, "cotas_mes": 4,  "status": "critico"},
        {"exame": "Cintilografia/medicina nuc.", "fila": 28,  "espera_dias": 248, "cotas_mes": 1,  "status": "critico"},
        {"exame": "Hemodinâmica/cateterismo",    "fila": 18,  "espera_dias": 184, "cotas_mes": 2,  "status": "critico"},
        {"exame": "Mamografia",                  "fila": 20,  "espera_dias": 96,  "cotas_mes": 6,  "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "fila_total": 1148, "solicitacoes": 248, "reguladas": 188, "reguladas_pct": 75.8, "referencias_manaus": 88},
        {"mes": "Fev/25", "fila_total": 1184, "solicitacoes": 256, "reguladas": 196, "reguladas_pct": 76.6, "referencias_manaus": 90},
        {"mes": "Mar/25", "fila_total": 1212, "solicitacoes": 262, "reguladas": 200, "reguladas_pct": 76.3, "referencias_manaus": 92},
        {"mes": "Abr/25", "fila_total": 1236, "solicitacoes": 270, "reguladas": 208, "reguladas_pct": 77.0, "referencias_manaus": 94},
        {"mes": "Mai/25", "fila_total": 1258, "solicitacoes": 278, "reguladas": 212, "reguladas_pct": 76.3, "referencias_manaus": 96},
        {"mes": "Jun/25", "fila_total": 1284, "solicitacoes": 284, "reguladas": 218, "reguladas_pct": 76.8, "referencias_manaus": 98},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Fila ativa de espera",               "valor": 1284, "meta": None, "unidade": "pacientes",  "status": "critico", "observacao": "Fila crescente: +136 pacientes em 6 meses — oferta de especialidades muito abaixo da demanda"},
        {"indicador": "Tempo médio espera especialidade",   "valor": 148,  "meta": 60,   "unidade": "dias",       "status": "critico", "observacao": "148 dias vs meta 60 — 2,5× o tempo aceitável; neurologia e ortopedia >300 dias"},
        {"indicador": "Pacientes >180 dias em fila",        "valor": 184,  "meta": 0,    "unidade": "pacientes",  "status": "critico", "observacao": "184 pacientes aguardando >6 meses — risco de agravamento clínico e judicialização"},
        {"indicador": "Taxa de regulação (solicit→agend)",  "valor": 76.8, "meta": 95.0, "unidade": "%",          "status": "atencao", "observacao": "23,2% das solicitações não reguladas — principalmente por falta de cotas disponíveis"},
        {"indicador": "Contrarreferência com retorno",      "valor": 38.4, "meta": 80.0, "unidade": "%",          "status": "critico", "observacao": "61,6% das referências sem contrarreferência — perda de continuidade do cuidado"},
        {"indicador": "Referências a Manaus/mês",           "valor": 98,   "meta": None, "unidade": "pacientes",  "status": "atencao", "observacao": "98 pacientes/mês para Manaus (600 km) — custo logístico e sofrimento do paciente"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/especialidades")
def especialidades():
    return _ESPECIALIDADES_FILA


@router.get("/exames-mac")
def exames_mac():
    return _EXAMES_MAC


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
