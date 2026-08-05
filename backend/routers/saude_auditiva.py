from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-auditiva", tags=["saude_auditiva"])

@lru_cache(maxsize=1)
def _GRAUS_PERDA():
    return [
        {"grau": "Leve (26–40 dB)", "casos": 48, "pct": 31.6, "aasi_indicado": False,
         "em_acompanhamento": 38, "status": "ok"},
        {"grau": "Moderado (41–55 dB)", "casos": 42, "pct": 27.6, "aasi_indicado": True,
         "aasi_adaptados": 32, "lista_espera": 10, "status": "atencao"},
        {"grau": "Moderadamente Severo (56–70 dB)", "casos": 28, "pct": 18.4, "aasi_indicado": True,
         "aasi_adaptados": 18, "lista_espera": 10, "status": "atencao"},
        {"grau": "Severo (71–90 dB)", "casos": 22, "pct": 14.5, "aasi_indicado": True,
         "aasi_adaptados": 12, "lista_espera": 10, "status": "critico"},
        {"grau": "Profundo (>90 dB)", "casos": 12, "pct": 7.9, "aasi_indicado": True,
         "aasi_adaptados": 6, "lista_espera": 6, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _TAN_RESULTADOS():
    return [
        {"ano": "2022", "nascidos_vivos": 172, "triados": 148, "cobertura_pct": 86.0,
         "falha_1a_tela": 18, "confirmados_perda": 4, "encaminhados_reab": 4},
        {"ano": "2023", "nascidos_vivos": 168, "triados": 152, "cobertura_pct": 90.5,
         "falha_1a_tela": 16, "confirmados_perda": 3, "encaminhados_reab": 3},
        {"ano": "2024", "nascidos_vivos": 174, "triados": 148, "cobertura_pct": 85.1,
         "falha_1a_tela": 21, "confirmados_perda": 5, "encaminhados_reab": 4},
        {"ano": "2025", "nascidos_vivos": 170, "triados": 158, "cobertura_pct": 92.9,
         "falha_1a_tela": 14, "confirmados_perda": 3, "encaminhados_reab": 3},
        {"ano": "2026*", "nascidos_vivos": 88, "triados": 76, "cobertura_pct": 86.4,
         "falha_1a_tela": 9,  "confirmados_perda": 2, "encaminhados_reab": 2},
    ]


@lru_cache(maxsize=1)
def _AASI_ESTOQUE():
    return [
        {"modelo": "Intracanal (CIC)", "estoque": 8, "dispensados_ano": 24, "demanda_mensal": 4, "status": "atencao"},
        {"modelo": "Retroauricular BTE adulto", "estoque": 14, "dispensados_ano": 38, "demanda_mensal": 6, "status": "ok"},
        {"modelo": "Retroauricular BTE pediátrico", "estoque": 3, "dispensados_ano": 12, "demanda_mensal": 3, "status": "critico"},
        {"modelo": "AASI digital avançado", "estoque": 2, "dispensados_ano": 6, "demanda_mensal": 2, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan", "avaliacoes_audiologicas": 28, "aasi_adaptados": 6, "tan_realizados": 14, "reabilitacoes": 18},
        {"mes": "Fev", "avaliacoes_audiologicas": 24, "aasi_adaptados": 5, "tan_realizados": 12, "reabilitacoes": 16},
        {"mes": "Mar", "avaliacoes_audiologicas": 32, "aasi_adaptados": 7, "tan_realizados": 16, "reabilitacoes": 22},
        {"mes": "Abr", "avaliacoes_audiologicas": 30, "aasi_adaptados": 6, "tan_realizados": 14, "reabilitacoes": 20},
        {"mes": "Mai", "avaliacoes_audiologicas": 34, "aasi_adaptados": 8, "tan_realizados": 18, "reabilitacoes": 24},
        {"mes": "Jun", "avaliacoes_audiologicas": 31, "aasi_adaptados": 7, "tan_realizados": 12, "reabilitacoes": 21},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura TAN (Triagem Auditiva Neonatal)", "valor": 86.4, "meta": 95.0, "unidade": "%",
         "status": "critico", "observacao": "Meta nacional 95% — risco de diagnóstico tardio"},
        {"indicador": "AASI BTE pediátrico em estoque", "valor": 3, "meta": None, "unidade": "unidades",
         "status": "critico", "observacao": "Menos de 1 mês de estoque — reposição urgente necessária"},
        {"indicador": "AASI adaptados/ano", "valor": 68, "meta": None, "unidade": "dispositivos",
         "status": "atencao", "observacao": "36 pacientes ainda em lista de espera para AASI"},
        {"indicador": "Confirmados perda/NV (2026)", "valor": 22.7, "meta": None, "unidade": "/1000 NV",
         "status": "atencao", "observacao": "2 casos confirmados em 88 NV — acima da média nacional (1-3/1000)"},
        {"indicador": "Grau severo/profundo sem AASI", "valor": 16, "meta": 0, "unidade": "pacientes",
         "status": "critico", "observacao": "16 pacientes com perda severa/profunda aguardando adaptação"},
        {"indicador": "Fonoaudióloga disponível", "valor": 1, "meta": None, "unidade": "profissional",
         "status": "atencao", "observacao": "Única fono do município — sobrecarga e atendimento semanal no CER"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "pacientes_perda_auditiva": 152,
        "aasi_adaptados_total": 68,
        "aasi_lista_espera": 36,
        "tan_cobertura_pct": 86.4,
        "tan_confirmados_2026": 2,
        "grau_severo_profundo_sem_aasi": 16,
        "avaliacoes_mes": 31,
        "reabilitacoes_mes": 21,
        "fonoaudiologos": 1,
        "aasi_modelos_estoque_critico": 2,
    }


@router.get("/graus-perda")
def graus_perda():
    return _GRAUS_PERDA


@router.get("/tan-historico")
def tan_historico():
    return _TAN_RESULTADOS


@router.get("/aasi-estoque")
def aasi_estoque():
    return _AASI_ESTOQUE


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
