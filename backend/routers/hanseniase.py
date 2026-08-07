from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/hanseniase", tags=["hanseniase"])

@lru_cache(maxsize=1)
def _CASOS():
    return [
        {"forma": "Paucibacilar (PB)", "casos_ano": 14, "cura_pct": 85.7, "abandono": 1,
         "grau_0_pct": 71.4, "grau_1_pct": 21.4, "grau_2_pct": 7.2, "status": "atencao"},
        {"forma": "Multibacilar (MB)", "casos_ano": 22, "cura_pct": 72.7, "abandono": 3,
         "grau_0_pct": 54.5, "grau_1_pct": 27.3, "grau_2_pct": 18.2, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _CONTATOS():
    return [
        {"ano": "2022", "novos_casos": 28, "taxa_deteccao": 148.6, "grau2_pct": 14.3, "cura_pct": 81.2, "examinados_pct": 68.4},
        {"ano": "2023", "novos_casos": 32, "taxa_deteccao": 169.8, "grau2_pct": 18.8, "cura_pct": 78.1, "examinados_pct": 72.1},
        {"ano": "2024", "novos_casos": 38, "taxa_deteccao": 201.5, "grau2_pct": 15.8, "cura_pct": 76.3, "examinados_pct": 74.6},
        {"ano": "2025", "novos_casos": 34, "taxa_deteccao": 180.3, "grau2_pct": 17.6, "cura_pct": 80.9, "examinados_pct": 71.2},
        {"ano": "2026*", "novos_casos": 36, "taxa_deteccao": 190.9, "grau2_pct": 13.9, "cura_pct": None, "examinados_pct": 69.8},
    ]


@lru_cache(maxsize=1)
def _GRAUS():
    return [
        {"grau": "Grau 0 (sem incapacidade)", "casos": 21, "pct": 58.3, "cor": "ok"},
        {"grau": "Grau I (perda sensibilidade)", "casos": 11, "pct": 30.6, "cor": "atencao"},
        {"grau": "Grau II (incapacidade visível)", "casos": 4, "pct": 11.1, "cor": "critico"},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa detecção geral", "valor": 190.9, "meta": 10.0, "unidade": "/100 mil hab",
         "status": "critico", "observacao": "Hiperendêmico — OMS meta <10/100mil"},
        {"indicador": "Taxa detecção em menores de 15 anos", "valor": 28.4, "meta": 0.0, "unidade": "/100 mil hab",
         "status": "critico", "observacao": "Crianças afetadas — indica transmissão ativa recente"},
        {"indicador": "Grau II no diagnóstico (MB)", "valor": 18.2, "meta": 5.0, "unidade": "%",
         "status": "critico", "observacao": "Diagnóstico tardio com incapacidade instalada"},
        {"indicador": "Cura dentro do prazo (PQT)", "valor": 78.4, "meta": 90.0, "unidade": "%",
         "status": "critico", "observacao": "Meta 90% — abandono prejudica resultado"},
        {"indicador": "Contatos examinados", "valor": 69.8, "meta": 80.0, "unidade": "%",
         "status": "atencao", "observacao": "Busca ativa de contatos insuficiente"},
        {"indicador": "Abandono MB (12 doses)", "valor": 13.6, "meta": 5.0, "unidade": "%",
         "status": "critico", "observacao": "Alta taxa abandono — necessidade supervisão domiciliar"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO_MES():
    return [
        {"mes": "Jan", "novos_casos": 6, "em_tratamento": 34, "curas": 2, "abandonos": 0},
        {"mes": "Fev", "novos_casos": 5, "em_tratamento": 37, "curas": 2, "abandonos": 0},
        {"mes": "Mar", "novos_casos": 7, "em_tratamento": 40, "curas": 4, "abandonos": 1},
        {"mes": "Abr", "novos_casos": 6, "em_tratamento": 41, "curas": 5, "abandonos": 0},
        {"mes": "Mai", "novos_casos": 8, "em_tratamento": 43, "curas": 6, "abandonos": 1},
        {"mes": "Jun", "novos_casos": 4, "em_tratamento": 38, "curas": 9, "abandonos": 2},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "novos_casos_ano": 36,
        "taxa_deteccao_100mil": 190.9,
        "em_tratamento": 38,
        "mb_pct": 61.1,
        "pb_pct": 38.9,
        "grau2_diagnostico_pct": 13.9,
        "cura_pqt_pct": 78.4,
        "abandono_mb_pct": 13.6,
        "contatos_examinados_pct": 69.8,
        "menores15_casos_ano": 4,
        "classificacao": "HIPERENDEMICO",
        "nivel_endemicidade": "muito alto",
    }


@router.get("/casos-por-forma")
def casos_por_forma():
    return _CASOS()


@router.get("/graus-incapacidade")
def graus_incapacidade():
    return _GRAUS()


@router.get("/historico")
def historico():
    return _HISTORICO_MES()


@router.get("/serie-historica")
def serie_historica():
    return _CONTATOS()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()