from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/dcnt", tags=["dcnt"])

@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {"condicao": "Hipertensão Arterial Sistêmica", "prevalencia_estimada": 3420,
         "diagnosticados": 2184, "em_tratamento": 1964, "controlados": 1248,
         "prevalencia_pct": 18.1, "controle_pct": 57.1, "meta_controle_pct": 70.0,
         "internacoes_ano": 48, "obitos_ano": 22, "status": "atencao"},
        {"condicao": "Diabetes Mellitus tipo 2", "prevalencia_estimada": 1710,
         "diagnosticados": 1082, "em_tratamento": 968, "controlados": 524,
         "prevalencia_pct": 9.1, "controle_pct": 54.1, "meta_controle_pct": 70.0,
         "internacoes_ano": 62, "obitos_ano": 14, "status": "critico"},
        {"condicao": "Obesidade (IMC ≥30)", "prevalencia_estimada": 2850,
         "diagnosticados": 1642, "em_tratamento": 482, "controlados": 142,
         "prevalencia_pct": 15.1, "controle_pct": 8.7, "meta_controle_pct": 20.0,
         "internacoes_ano": 18, "obitos_ano": 6, "status": "critico"},
        {"condicao": "DPOC / Asma", "prevalencia_estimada": 680,
         "diagnosticados": 412, "em_tratamento": 368, "controlados": 248,
         "prevalencia_pct": 3.6, "controle_pct": 67.4, "meta_controle_pct": 70.0,
         "internacoes_ano": 28, "obitos_ano": 8, "status": "atencao"},
        {"condicao": "Insuficiência Cardíaca Congestiva", "prevalencia_estimada": 380,
         "diagnosticados": 214, "em_tratamento": 196, "controlados": 118,
         "prevalencia_pct": 2.0, "controle_pct": 60.2, "meta_controle_pct": 65.0,
         "internacoes_ano": 34, "obitos_ano": 12, "status": "atencao"},
        {"condicao": "Doença Renal Crônica", "prevalencia_estimada": 284,
         "diagnosticados": 142, "em_tratamento": 128, "controlados": 72,
         "prevalencia_pct": 1.5, "controle_pct": 56.3, "meta_controle_pct": 65.0,
         "internacoes_ano": 22, "obitos_ano": 9, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _HAS_DM_SERIE():
    return [
        {"mes": "Jan", "has_consultas": 412, "dm_consultas": 248, "has_novos": 18, "dm_novos": 12,
         "insulina_dispensada": 284, "metformina_dispensada": 412, "glicemia_controlada_pct": 52.4},
        {"mes": "Fev", "has_consultas": 398, "dm_consultas": 234, "has_novos": 14, "dm_novos": 9,
         "insulina_dispensada": 276, "metformina_dispensada": 396, "glicemia_controlada_pct": 53.1},
        {"mes": "Mar", "has_consultas": 428, "dm_consultas": 262, "has_novos": 22, "dm_novos": 14,
         "insulina_dispensada": 298, "metformina_dispensada": 428, "glicemia_controlada_pct": 53.8},
        {"mes": "Abr", "has_consultas": 418, "dm_consultas": 256, "has_novos": 19, "dm_novos": 11,
         "insulina_dispensada": 288, "metformina_dispensada": 418, "glicemia_controlada_pct": 54.2},
        {"mes": "Mai", "has_consultas": 442, "dm_consultas": 278, "has_novos": 24, "dm_novos": 16,
         "insulina_dispensada": 312, "metformina_dispensada": 444, "glicemia_controlada_pct": 54.1},
        {"mes": "Jun", "has_consultas": 436, "dm_consultas": 271, "has_novos": 21, "dm_novos": 13,
         "insulina_dispensada": 304, "metformina_dispensada": 436, "glicemia_controlada_pct": 54.1},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Controle glicêmico DM2 (HbA1c <7%)", "valor": 54.1, "meta": 70.0, "unidade": "%",
         "status": "critico", "observacao": "46% dos diabéticos fora do controle — risco de complicações"},
        {"indicador": "Controle pressórico HAS (<140/90)", "valor": 57.1, "meta": 70.0, "unidade": "%",
         "status": "atencao", "observacao": "Distância de 13 pp da meta — adesão ao tratamento precária"},
        {"indicador": "Internações por DM (evitáveis)", "valor": 62, "meta": None, "unidade": "/ano",
         "status": "critico", "observacao": "DM lidera internações evitáveis — controle insuficiente"},
        {"indicador": "Obesidade em tratamento", "valor": 8.7, "meta": 20.0, "unidade": "%",
         "status": "critico", "observacao": "Menos de 10% dos obesos em acompanhamento ativo"},
        {"indicador": "DRC em acompanhamento especializado", "valor": 56.3, "meta": 80.0, "unidade": "%",
         "status": "atencao", "observacao": "142 identificados — apenas 80 com seguimento nefro"},
        {"indicador": "Amputações por DM/ano", "valor": 4, "meta": 0, "unidade": "casos",
         "status": "critico", "observacao": "4 amputações de membro inferior — controle inadequado de DM"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "has_em_tratamento": 1964,
        "dm_em_tratamento": 968,
        "controle_has_pct": 57.1,
        "controle_dm_pct": 54.1,
        "obesidade_prevalencia_pct": 15.1,
        "internacoes_evitaveis_mes": 18,
        "amputacoes_dm_ano": 4,
        "obitos_dcnt_ano": 71,
        "condicoes_monitoradas": 6,
        "hiperdia_cadastrados": 3266,
    }


@router.get("/condicoes")
def condicoes():
    return _CONDICOES()


@router.get("/has-dm-serie")
def has_dm_serie():
    return _HAS_DM_SERIE()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()