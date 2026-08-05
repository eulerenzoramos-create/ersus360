from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/nutricao", tags=["nutricao"])

@lru_cache(maxsize=1)
def _SISVAN_CICLOS():
    return [
        {"ciclo_vida": "Crianças <5 anos", "avaliados": 684, "total_estimado": 812,
         "cobertura_pct": 84.2,
         "desnutricao_grave_pct": 2.8, "desnutricao_moderada_pct": 8.4,
         "risco_nutricional_pct": 12.6, "eutrofico_pct": 64.8,
         "sobrepeso_pct": 7.2, "obesidade_pct": 4.2, "status": "critico"},
        {"ciclo_vida": "Crianças 5–9 anos", "avaliados": 824, "total_estimado": 962,
         "cobertura_pct": 85.7,
         "desnutricao_grave_pct": 1.4, "desnutricao_moderada_pct": 5.8,
         "risco_nutricional_pct": 9.2, "eutrofico_pct": 58.4,
         "sobrepeso_pct": 14.8, "obesidade_pct": 10.4, "status": "atencao"},
        {"ciclo_vida": "Adolescentes", "avaliados": 612, "total_estimado": 784,
         "cobertura_pct": 78.1,
         "desnutricao_grave_pct": 0.8, "desnutricao_moderada_pct": 4.2,
         "risco_nutricional_pct": 7.8, "eutrofico_pct": 56.2,
         "sobrepeso_pct": 18.4, "obesidade_pct": 12.6, "status": "atencao"},
        {"ciclo_vida": "Adultos (20–59 anos)", "avaliados": 2184, "total_estimado": 8420,
         "cobertura_pct": 25.9,
         "desnutricao_grave_pct": 0.4, "desnutricao_moderada_pct": 2.1,
         "risco_nutricional_pct": 3.8, "eutrofico_pct": 38.4,
         "sobrepeso_pct": 28.6, "obesidade_pct": 26.7, "status": "critico"},
        {"ciclo_vida": "Idosos (60+)", "avaliados": 842, "total_estimado": 1124,
         "cobertura_pct": 74.9,
         "desnutricao_grave_pct": 3.8, "desnutricao_moderada_pct": 11.2,
         "risco_nutricional_pct": 18.4, "eutrofico_pct": 44.2,
         "sobrepeso_pct": 14.8, "obesidade_pct": 7.6, "status": "critico"},
        {"ciclo_vida": "Gestantes", "avaliados": 122, "total_estimado": 188,
         "cobertura_pct": 64.9,
         "desnutricao_grave_pct": 1.6, "desnutricao_moderada_pct": 6.6,
         "risco_nutricional_pct": 9.8, "eutrofico_pct": 52.5,
         "sobrepeso_pct": 21.3, "obesidade_pct": 8.2, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _BF_NUTRICAO():
    return [
        {"programa": "Bolsa Família — Condicionalidade Saúde", "familias_total": 1842,
         "acompanhadas_saude": 1612, "cobertura_pct": 87.5,
         "criancas_avaliadas": 2184, "gestantes_acompanhadas": 98,
         "descumprimento_pct": 4.2, "status": "atencao"},
        {"programa": "SISVAN (Vigilância Alimentar)", "familias_total": None,
         "acompanhadas_saude": 5146, "cobertura_pct": 52.4,
         "criancas_avaliadas": 1508, "gestantes_acompanhadas": 122,
         "descumprimento_pct": None, "status": "atencao"},
        {"programa": "Suplementação Vitamina A (<5 anos)", "familias_total": None,
         "acompanhadas_saude": 684, "cobertura_pct": 72.4,
         "criancas_avaliadas": 684, "gestantes_acompanhadas": None,
         "descumprimento_pct": None, "status": "atencao"},
        {"programa": "Suplementação Ferro (<2 anos)", "familias_total": None,
         "acompanhadas_saude": 312, "cobertura_pct": 64.8,
         "criancas_avaliadas": 312, "gestantes_acompanhadas": None,
         "descumprimento_pct": None, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan", "avaliados_sisvan": 812, "desnutricao_graves": 18, "obesidade_novos": 42, "bf_acompanhadas": 1584},
        {"mes": "Fev", "avaliados_sisvan": 784, "desnutricao_graves": 16, "obesidade_novos": 38, "bf_acompanhadas": 1596},
        {"mes": "Mar", "avaliados_sisvan": 842, "desnutricao_graves": 21, "obesidade_novos": 48, "bf_acompanhadas": 1604},
        {"mes": "Abr", "avaliados_sisvan": 828, "desnutricao_graves": 19, "obesidade_novos": 44, "bf_acompanhadas": 1608},
        {"mes": "Mai", "avaliados_sisvan": 868, "desnutricao_graves": 22, "obesidade_novos": 52, "bf_acompanhadas": 1612},
        {"mes": "Jun", "avaliados_sisvan": 856, "desnutricao_graves": 20, "obesidade_novos": 46, "bf_acompanhadas": 1612},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Desnutrição grave <5 anos", "valor": 2.8, "meta": 1.0, "unidade": "%",
         "status": "critico", "observacao": "2,8× a meta — intervenção nutricional urgente nas crianças mais vulneráveis"},
        {"indicador": "Obesidade em adultos", "valor": 26.7, "meta": None, "unidade": "%",
         "status": "critico", "observacao": "1 em 4 adultos obesos — fator de risco para DM, HAS e doenças cardiovasculares"},
        {"indicador": "Cobertura SISVAN adultos", "valor": 25.9, "meta": 50.0, "unidade": "%",
         "status": "critico", "observacao": "Apenas 26% dos adultos com estado nutricional registrado"},
        {"indicador": "Cobertura vitamina A (<5 anos)", "valor": 72.4, "meta": 80.0, "unidade": "%",
         "status": "atencao", "observacao": "Risco de deficiência vitamínica — protocolo semestral"},
        {"indicador": "Suplementação ferro (<2 anos)", "valor": 64.8, "meta": 80.0, "unidade": "%",
         "status": "critico", "observacao": "Anemia ferropriva prevalente — cobertura de suplementação insuficiente"},
        {"indicador": "Condicionalidades BF cumpridas", "valor": 87.5, "meta": 90.0, "unidade": "%",
         "status": "atencao", "observacao": "4,2% de descumprimento — monitoramento ativo necessário"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "avaliados_sisvan_mes": 856,
        "ciclos_monitorados": 6,
        "desnutricao_grave_criancas_pct": 2.8,
        "obesidade_adultos_pct": 26.7,
        "cobertura_sisvan_media_pct": 67.6,
        "familias_bf_acompanhadas": 1612,
        "suplementacao_vit_a_pct": 72.4,
        "suplementacao_ferro_pct": 64.8,
        "bf_total_familias": 1842,
        "desnutricao_indigena_pct": 18.4,
    }


@router.get("/sisvan-ciclos")
def sisvan_ciclos():
    return _SISVAN_CICLOS


@router.get("/programas")
def programas():
    return _BF_NUTRICAO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
