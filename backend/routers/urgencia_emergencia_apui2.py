from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/urgencia-emergencia-apui", tags=["urgencia_emergencia_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "hospital_nome": "Hospital Municipal Dr. José Fernandes Júnior",
        "leitos_sus_total": 42,
        "leitos_uti_sus": 0,
        "leitos_uti_necessarios": 8,
        "taxa_ocupacao_clinica_pct": 84.2,
        "meta_ocupacao_pct": 75.0,
        "atendimentos_ps_mes": 1284,
        "internacoes_mes": 124,
        "transferencias_manaus_mes": 28,
        "transferencias_emergencia_mes": 8,
        "obitos_hospitalares_mes": 6,
        "taxa_mortalidade_hospitalar_pct": 4.8,
        "samu_tempo_resposta_min": 48,
        "meta_samu_resposta_min": 20,
        "uti_movel_avancada": False,
        "uti_movel_basica": 1,
        "distancia_uti_manaus_km": 784,
        "tempo_transferencia_aereo_min": 90,
        "disponibilidade_aeronave_pct": 28.4,
        "trauma_proporcao_pct": 32.4,
        "parto_proporcao_pct": 18.4,
        "malaria_grave_proporcao_pct": 12.4,
        "status_uti": "critico",
        "status_samu": "critico",
        "status_ocupacao": "critico",
    }


@lru_cache(maxsize=1)
def _CAUSAS_ATENDIMENTO():
    return [
        {"causa": "Trauma / acidente (moto/garimpo)",  "atend_mes": 416, "internacoes": 38, "obitos": 2, "transferencia_pct": 18.4, "status": "critico"},
        {"causa": "Parto e complicações obstétricas",   "atend_mes": 236, "internacoes": 84, "obitos": 1, "transferencia_pct": 8.4,  "status": "atencao"},
        {"causa": "Malária grave / complicações",        "atend_mes": 159, "internacoes": 22, "obitos": 1, "transferencia_pct": 12.4, "status": "critico"},
        {"causa": "Infecção respiratória grave",         "atend_mes": 142, "internacoes": 18, "obitos": 1, "transferencia_pct": 6.4,  "status": "atencao"},
        {"causa": "Acidente ofídico / animal peçonhento","atend_mes": 84,  "internacoes": 12, "obitos": 0, "transferencia_pct": 4.2,  "status": "atencao"},
        {"causa": "DCNT em crise (HAS/DM/IAM)",          "atend_mes": 124, "internacoes": 28, "obitos": 1, "transferencia_pct": 22.4, "status": "critico"},
        {"causa": "Intoxicação / envenenamento",         "atend_mes": 48,  "internacoes": 8,  "obitos": 0, "transferencia_pct": 4.8,  "status": "atencao"},
        {"causa": "Outros / não classificados",          "atend_mes": 75,  "internacoes": 6,  "obitos": 0, "transferencia_pct": 2.4,  "status": "ok"},
    ]


@lru_cache(maxsize=1)
def _TRANSFERENCIAS():
    return [
        {"destino": "Manaus — UTI adulto",            "transferencias_mes": 12, "custo_medio_R": 3200, "tempo_medio_h": 3.5, "disponibilidade_pct": 72.4, "status": "critico"},
        {"destino": "Manaus — cirurgia cardíaca",     "transferencias_mes": 4,  "custo_medio_R": 4800, "tempo_medio_h": 4.0, "disponibilidade_pct": 48.4, "status": "critico"},
        {"destino": "Manaus — neurologia/neurocirurg.","transferencias_mes": 3,  "custo_medio_R": 4200, "tempo_medio_h": 4.0, "disponibilidade_pct": 48.4, "status": "critico"},
        {"destino": "Humaitá — referência secundária", "transferencias_mes": 6,  "custo_medio_R": 1200, "tempo_medio_h": 2.5, "disponibilidade_pct": 84.2, "status": "atencao"},
        {"destino": "Manicoré — hospital regional",   "transferencias_mes": 3,  "custo_medio_R": 980,  "tempo_medio_h": 2.0, "disponibilidade_pct": 84.2, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "atendimentos": 1148, "internacoes": 108, "transferencias": 24, "obitos": 5, "ocupacao_pct": 78.4},
        {"mes": "Fev/25", "atendimentos": 1184, "internacoes": 112, "transferencias": 25, "obitos": 5, "ocupacao_pct": 80.2},
        {"mes": "Mar/25", "atendimentos": 1212, "internacoes": 116, "transferencias": 26, "obitos": 5, "ocupacao_pct": 82.4},
        {"mes": "Abr/25", "atendimentos": 1248, "internacoes": 120, "transferencias": 27, "obitos": 6, "ocupacao_pct": 83.6},
        {"mes": "Mai/25", "atendimentos": 1264, "internacoes": 122, "transferencias": 28, "obitos": 6, "ocupacao_pct": 84.0},
        {"mes": "Jun/25", "atendimentos": 1284, "internacoes": 124, "transferencias": 28, "obitos": 6, "ocupacao_pct": 84.2},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Leitos UTI SUS funcionais",         "valor": 0,    "meta": 8,    "unidade": "leitos", "status": "critico", "observacao": "Zero leitos de UTI — pacientes críticos ficam em corredor até estabilização para transferência aérea. Manaus a 784 km. Mortalidade por IAM, TCE e malária grave é diretamente atribuível à ausência de UTI"},
        {"indicador": "Tempo de resposta SAMU",             "valor": 48,   "meta": 20,   "unidade": "min",    "status": "critico", "observacao": "48 min vs meta 20 min — sem UTI móvel avançada (apenas básica). Zona rural e ribeirinha sem cobertura. Garimpo ilegal fora do alcance. Mortalidade no trauma é 2-3× maior sem acesso a cuidados avançados em < 1h"},
        {"indicador": "Taxa de ocupação leitos clínicos",  "valor": 84.2, "meta": 75.0, "unidade": "%",      "status": "critico", "observacao": "84,2% vs meta 75% — superlotação crônica com pico nas épocas de malária (jan-mar, out-dez). Internações por DCNT evitável (ICSAP 184/ano) consomem leitos que seriam necessários para urgência"},
        {"indicador": "Transferências/mês para Manaus",    "valor": 28,   "meta": None, "unidade": "transf.", "status": "critico", "observacao": "28 transferências/mês = R$ 89.600 só em transporte. Aeronave disponível em 28,4% das solicitações urgentes. Helicóptero do GRAU-AM tem fila de espera de horas. Pacientes morrem aguardando voo"},
        {"indicador": "Disponibilidade aeronave emergência","valor": 28.4, "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "71,6% das solicitações de aeronave negadas ou com atraso > 4h. Único hospital com pista de pouso no município. Custo total TFD: R$ 284k/mês — maior item de despesa da SMS após folha"},
        {"indicador": "Acidente ofídico — soro disponível","valor": 84.2, "meta": 100.0,"unidade": "%",      "status": "atencao", "observacao": "15,8% de desabastecimento de soro antiofídico registrado em 2025. Apuí tem uma das maiores incidências de acidentes por serpente do AM (84 casos/ano). Óbito em < 4h sem soro"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/causas")
def causas():
    return _CAUSAS_ATENDIMENTO


@router.get("/transferencias")
def transferencias():
    return _TRANSFERENCIAS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
