from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-bucal-apui", tags=["saude_bucal_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "cirurgioes_dentistas_sus": 8,
        "cd_necessarios": 12,
        "esb_implantadas": 5,
        "esb_necessarias": 8,
        "cobertura_esb_pct": 62.5,
        "procedimentos_basicos_mes": 1284,
        "procedimentos_especializados_mes": 84,
        "primeira_consulta_programatica_mes": 348,
        "exodontia_proporcao_pct": 38.4,
        "meta_exodontia_pct": 30.0,
        "ceo_d_5a": 4.2,
        "meta_ceo_d_5a": 2.0,
        "cpod_12a": 3.8,
        "meta_cpod_12a": 2.6,
        "fluorose_leve_pct": 22.4,
        "fluorose_moderada_pct": 4.8,
        "cobertura_agua_fluoretada_pct": 48.4,
        "gestantes_atendidas_pre_natal_pct": 38.4,
        "meta_gestantes_pct": 60.0,
        "ceo_implantado": False,
        "status_cobertura": "atencao",
        "status_cpod": "critico",
        "status_exodontia": "critico",
    }


@lru_cache(maxsize=1)
def _PRODUCAO():
    return [
        {"procedimento": "Consulta inicial / triagem",       "realizado_mes": 348, "meta_mes": 420, "status": "atencao"},
        {"procedimento": "Restauração dentária",             "realizado_mes": 284, "meta_mes": 380, "status": "atencao"},
        {"procedimento": "Exodontia (adulto)",               "realizado_mes": 184, "meta_mes": 150, "status": "critico"},
        {"procedimento": "Exodontia (criança / decíduo)",    "realizado_mes": 48,  "meta_mes": 60,  "status": "atencao"},
        {"procedimento": "Prevenção (aplicação flúor/selante)","realizado_mes": 212,"meta_mes": 400, "status": "critico"},
        {"procedimento": "Raspagem periodontal",             "realizado_mes": 84,  "meta_mes": 120, "status": "atencao"},
        {"procedimento": "Urgência odontológica",            "realizado_mes": 124, "meta_mes": 100, "status": "ok"},
        {"procedimento": "Cirurgia oral menor",              "realizado_mes": 28,  "meta_mes": 40,  "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _INDICADORES_EPIDEM():
    return [
        {"faixa": "5 anos (CEO-d)",         "indice": "CEO-d", "valor": 4.2,  "meta": 2.0,  "interpretacao": "Alto — OMS meta < 2,0",    "status": "critico"},
        {"faixa": "12 anos (CPO-D)",        "indice": "CPO-D", "valor": 3.8,  "meta": 2.6,  "interpretacao": "Moderado — SB meta ≤ 2,6", "status": "atencao"},
        {"faixa": "35-44 anos",             "indice": "CPO-D", "valor": 18.4, "meta": 14.0, "interpretacao": "Alto — média Brasil 16,7", "status": "critico"},
        {"faixa": "65-74 anos (edentulismo)","indice": "% edêntulos", "valor": 38.4, "meta": 15.0, "interpretacao": "Muito alto — reflexo de décadas de exodontia como única oferta", "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "procedimentos": 1084, "exodontias": 198, "prevencao": 184, "urgencias": 108, "exod_proporcao_pct": 36.4},
        {"mes": "Fev/25", "procedimentos": 1124, "exodontias": 204, "prevencao": 192, "urgencias": 112, "exod_proporcao_pct": 36.8},
        {"mes": "Mar/25", "procedimentos": 1184, "exodontias": 218, "prevencao": 198, "urgencias": 118, "exod_proporcao_pct": 37.2},
        {"mes": "Abr/25", "procedimentos": 1224, "exodontias": 224, "prevencao": 208, "urgencias": 120, "exod_proporcao_pct": 37.8},
        {"mes": "Mai/25", "procedimentos": 1264, "exodontias": 228, "prevencao": 208, "urgencias": 122, "exod_proporcao_pct": 38.0},
        {"mes": "Jun/25", "procedimentos": 1284, "exodontias": 232, "prevencao": 212, "urgencias": 124, "exod_proporcao_pct": 38.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "CEO-d em crianças de 5 anos",       "valor": 4.2,  "meta": 2.0,  "unidade": "",        "status": "critico", "observacao": "CEO-d 4,2 vs meta OMS 2,0 — alta prevalência de cárie precoce da infância. Aleitamento noturno prolongado e consumo de açúcar são os fatores principais"},
        {"indicador": "Proporção de exodontias",           "valor": 38.4, "meta": 30.0, "unidade": "%",       "status": "critico", "observacao": "38,4% dos procedimentos são exodontias — modelo mutilador ainda prevalente. Meta Brasil < 30%. Falta de acesso oportuno leva ao estágio de necessidade de extração"},
        {"indicador": "Edentulismo (65-74a)",              "valor": 38.4, "meta": 15.0, "unidade": "%",       "status": "critico", "observacao": "38,4% dos idosos edêntulos — reflexo de décadas de exodontia como única oferta. Impacto nutricional, social e cognitivo significativo"},
        {"indicador": "Gestantes atendidas (pré-natal)",   "valor": 38.4, "meta": 60.0, "unidade": "%",       "status": "critico", "observacao": "38,4% vs meta 60% — 3 UBS sem ESB. Gestantes sem odontológico pioram o Novo Financiamento APS e aumentam risco de prematuridade por infecção periodontal"},
        {"indicador": "Prevenção (flúor/selante) no total","valor": 16.5, "meta": 30.0, "unidade": "%",       "status": "critico", "observacao": "16,5% dos procedimentos são preventivos vs meta 30% — modelo ainda curativo-mutilador. Selante e aplicação de flúor são subofertados"},
        {"indicador": "ESB implantadas",                   "valor": 62.5, "meta": 100.0,"unidade": "%",       "status": "atencao", "observacao": "5 de 8 equipes têm ESB — 3 UBS sem dentista. Equipes incompletas não atingem indicadores Novo Financiamento APS de saúde bucal no pré-natal"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/producao")
def producao():
    return _PRODUCAO()


@router.get("/epidemiologia")
def epidemiologia():
    return _INDICADORES_EPIDEM()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()