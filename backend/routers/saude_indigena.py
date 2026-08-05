from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-indigena", tags=["saude_indigena"])

@lru_cache(maxsize=1)
def _ALDEIAS():
    return [
        {"aldeia": "Aldeia Muducu", "povo": "Mura", "populacao": 312, "municipio": "Apuí",
         "equipe_saude": True, "ultima_visita_dias": 14, "cobertura_vacinal_pct": 78.4,
         "desnutricao_infantil_pct": 18.2, "status": "atencao"},
        {"aldeia": "Aldeia Tenharin do Marmelos", "povo": "Tenharin", "populacao": 487, "municipio": "Apuí",
         "equipe_saude": True, "ultima_visita_dias": 7, "cobertura_vacinal_pct": 84.1,
         "desnutricao_infantil_pct": 14.6, "status": "ok"},
        {"aldeia": "Aldeia Jiahui", "povo": "Jiahui", "populacao": 96, "municipio": "Apuí",
         "equipe_saude": False, "ultima_visita_dias": 62, "cobertura_vacinal_pct": 52.3,
         "desnutricao_infantil_pct": 31.8, "status": "critico"},
        {"aldeia": "Aldeia Parintintin", "povo": "Parintintin", "populacao": 218, "municipio": "Apuí",
         "equipe_saude": True, "ultima_visita_dias": 28, "cobertura_vacinal_pct": 71.2,
         "desnutricao_infantil_pct": 22.4, "status": "atencao"},
        {"aldeia": "Aldeia Diahui", "povo": "Diahui", "populacao": 44, "municipio": "Apuí",
         "equipe_saude": False, "ultima_visita_dias": 91, "cobertura_vacinal_pct": 38.6,
         "desnutricao_infantil_pct": 42.1, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        {"agravo": "Desnutrição Infantil (<5 anos)", "casos_ano": 68, "taxa_100": 18.4, "meta_pct": 10.0, "tendencia": "estavel", "status": "critico"},
        {"agravo": "Malária (IPA indígena)", "casos_ano": 184, "taxa_100": 49.7, "meta_pct": None, "tendencia": "alta", "status": "critico"},
        {"agravo": "Tuberculose Pulmonar", "casos_ano": 12, "taxa_100": 3.2, "meta_pct": None, "tendencia": "estavel", "status": "atencao"},
        {"agravo": "Anemia em Crianças", "casos_ano": 104, "taxa_100": 28.1, "meta_pct": 15.0, "tendencia": "queda", "status": "critico"},
        {"agravo": "Sífilis Congênita", "casos_ano": 3, "taxa_100": 0.8, "meta_pct": 0.5, "tendencia": "alta", "status": "atencao"},
        {"agravo": "Doenças Diarreicas", "casos_ano": 231, "taxa_100": 62.4, "meta_pct": None, "tendencia": "queda", "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura vacinal indígena", "valor": 72.6, "meta": 95.0, "unidade": "%", "status": "critico",
         "observacao": "Meta nacional 95% — deficiência logística em aldeias remotas"},
        {"indicador": "Desnutrição infantil (<5 anos)", "valor": 18.4, "meta": 10.0, "unidade": "%", "status": "critico",
         "observacao": "Alta prevalência — intervenção nutricional urgente necessária"},
        {"indicador": "Aldeias sem equipe EMSI", "valor": 2, "meta": 0, "unidade": "aldeias", "status": "critico",
         "observacao": "Jiahui e Diahui sem equipe multidisciplinar de saúde indígena"},
        {"indicador": "Cobertura pré-natal indígena", "valor": 61.4, "meta": 85.0, "unidade": "%", "status": "critico",
         "observacao": "Dificuldade de acesso e barreiras culturais"},
        {"indicador": "IPA malária indígena", "valor": 49.7, "meta": None, "unidade": "/1000 hab", "status": "critico",
         "observacao": "IPA indígena 74% superior ao municipal (28.8/1000)"},
        {"indicador": "Mortalidade infantil indígena", "valor": 28.4, "meta": 15.0, "unidade": "/1000 NV", "status": "critico",
         "observacao": "TMI indígena quase 2× superior ao municipal (15.2)"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan", "atendimentos": 312, "visitas_aldeias": 8, "encam_polo_base": 28},
        {"mes": "Fev", "atendimentos": 298, "visitas_aldeias": 7, "encam_polo_base": 24},
        {"mes": "Mar", "atendimentos": 334, "visitas_aldeias": 9, "encam_polo_base": 31},
        {"mes": "Abr", "atendimentos": 356, "visitas_aldeias": 8, "encam_polo_base": 35},
        {"mes": "Mai", "atendimentos": 378, "visitas_aldeias": 10, "encam_polo_base": 38},
        {"mes": "Jun", "atendimentos": 401, "visitas_aldeias": 9, "encam_polo_base": 42},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "populacao_indigena_total": 1157,
        "aldeias_monitoradas": 5,
        "aldeias_sem_emsi": 2,
        "povos_atendidos": 5,
        "cobertura_vacinal_media_pct": 72.6,
        "desnutricao_infantil_pct": 18.4,
        "ipa_indigena": 49.7,
        "tmi_indigena": 28.4,
        "atendimentos_mes": 401,
        "visitas_aldeias_mes": 9,
        "aldeia_critica": "Aldeia Diahui — sem EMSI, 91 dias sem visita",
        "pos_semana_epidemiologica": 26,
    }


@router.get("/aldeias")
def aldeias():
    return _ALDEIAS


@router.get("/agravos")
def agravos():
    return _AGRAVOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
