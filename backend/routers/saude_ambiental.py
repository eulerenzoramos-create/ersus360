from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-ambiental", tags=["saude_ambiental"])

@lru_cache(maxsize=1)
def _VIGIAGUA():
    return [
        {"sistema": "SAA — Sistema de Abast. de Água (SAAE)", "populacao_atendida": 14200,
         "cobertura_pct": 75.3, "amostras_mes": 24, "conformes_pct": 87.5,
         "cloro_residual_ok_pct": 91.7, "turbidez_ok_pct": 95.8,
         "fluoreto_ok_pct": 72.4, "status": "atencao"},
        {"sistema": "SAA — Poços Coletivos Zona Rural", "populacao_atendida": 2840,
         "cobertura_pct": 15.1, "amostras_mes": 8, "conformes_pct": 62.5,
         "cloro_residual_ok_pct": 0.0, "turbidez_ok_pct": 75.0,
         "fluoreto_ok_pct": 0.0, "status": "critico"},
        {"sistema": "SAI — Soluções Individuais (poços domésticos)", "populacao_atendida": 1840,
         "cobertura_pct": 9.6, "amostras_mes": 4, "conformes_pct": 25.0,
         "cloro_residual_ok_pct": 0.0, "turbidez_ok_pct": 50.0,
         "fluoreto_ok_pct": 0.0, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _SANEAMENTO():
    return {
        "agua_tratada_pct": 75.3,
        "esgoto_coletado_pct": 28.4,
        "esgoto_tratado_pct": 14.2,
        "residuos_solidos_coletados_pct": 82.6,
        "residuos_solidos_destino_adequado_pct": 94.1,
        "lixao_ativo": False,
        "dda_casos_mes": 312,
        "dda_hospitalizacoes_mes": 18,
    }


@lru_cache(maxsize=1)
def _AGROTOXICOS():
    return [
        {"cultura": "Mandioca", "area_ha": 1842, "agrotoxicos_uso": ["Glifosato", "2,4-D"],
         "intoxicacoes_ano": 4, "monitoramento_ativo": True, "status": "atencao"},
        {"cultura": "Milho", "area_ha": 642, "agrotoxicos_uso": ["Atrazina", "Cipermetrina", "Glifosato"],
         "intoxicacoes_ano": 8, "monitoramento_ativo": True, "status": "critico"},
        {"cultura": "Garimpo (mercúrio)", "area_ha": None, "agrotoxicos_uso": ["Mercúrio elementar"],
         "intoxicacoes_ano": 3, "monitoramento_ativo": False, "status": "critico"},
        {"cultura": "Pastagem/Pecuária", "area_ha": 12400, "agrotoxicos_uso": ["Glifosato", "Picloram"],
         "intoxicacoes_ano": 2, "monitoramento_ativo": False, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan", "amostras_agua": 28, "conformes_pct": 82.1, "dda_casos": 284, "intox_agrotox": 2},
        {"mes": "Fev", "amostras_agua": 26, "conformes_pct": 84.6, "dda_casos": 268, "intox_agrotox": 1},
        {"mes": "Mar", "amostras_agua": 30, "conformes_pct": 80.0, "dda_casos": 312, "intox_agrotox": 3},
        {"mes": "Abr", "amostras_agua": 28, "conformes_pct": 85.7, "dda_casos": 298, "intox_agrotox": 2},
        {"mes": "Mai", "amostras_agua": 32, "conformes_pct": 78.1, "dda_casos": 342, "intox_agrotox": 4},
        {"mes": "Jun", "amostras_agua": 36, "conformes_pct": 77.8, "dda_casos": 312, "intox_agrotox": 5},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura água tratada", "valor": 75.3, "meta": 99.0, "unidade": "%",
         "status": "critico", "observacao": "24,7% da população sem acesso à água tratada — zona rural e ribeirinha"},
        {"indicador": "Cobertura esgotamento sanitário", "valor": 28.4, "meta": 90.0, "unidade": "%",
         "status": "critico", "observacao": "71,6% sem coleta de esgoto — principal causa de DDA e verminoses"},
        {"indicador": "Conformidade água (VIGIAGUA)", "valor": 77.8, "meta": 95.0, "unidade": "%",
         "status": "critico", "observacao": "22% das amostras fora do padrão — risco de contaminação"},
        {"indicador": "Intoxicações por agrotóxico/mês", "valor": 5, "meta": 0, "unidade": "casos",
         "status": "critico", "observacao": "Tendência crescente — milho e garimpo os maiores focos"},
        {"indicador": "Monitoramento mercúrio (garimpo)", "valor": 0, "meta": 1, "unidade": "programas ativos",
         "status": "critico", "observacao": "Sem programa ativo de monitoramento de mercúrio no garimpo"},
        {"indicador": "DDA (doenças diarreicas agudas)/mês", "valor": 312, "meta": None, "unidade": "casos",
         "status": "critico", "observacao": "Alta correlação com água sem tratamento adequado na zona rural"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "agua_tratada_pct": 75.3,
        "esgoto_coletado_pct": 28.4,
        "conformidade_vigiagua_pct": 77.8,
        "dda_casos_mes": 312,
        "dda_hospitalizacoes_mes": 18,
        "intox_agrotoxicos_mes": 5,
        "intox_mercurio_garimpo_ano": 3,
        "sistemas_monitorados": 3,
        "culturas_monitoradas": 4,
        "lixao_ativo": False,
    }


@router.get("/vigiagua")
def vigiagua():
    return _VIGIAGUA()


@router.get("/saneamento")
def saneamento():
    return _SANEAMENTO()


@router.get("/agrotoxicos")
def agrotoxicos():
    return _AGROTOXICOS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()