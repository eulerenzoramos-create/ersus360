"""Atenção às Vítimas de Violência Doméstica e Sexual · FMS Apuí/AM"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/violencia-domestica", tags=["violencia_domestica"])

@lru_cache(maxsize=1)
def _TIPOS_VIOLENCIA():
    return [
        {"tipo": "Violência física",        "n_mes": 14, "n_ano": 72,  "feminino_pct": 78.6, "menor_18_pct": 21.4, "profilaxia_dst_pct": None, "bo_registrado_pct": 57.1, "status": "critico"},
        {"tipo": "Violência psicológica",   "n_mes": 18, "n_ano": 88,  "feminino_pct": 83.3, "menor_18_pct": 16.7, "profilaxia_dst_pct": None, "bo_registrado_pct": 38.9, "status": "critico"},
        {"tipo": "Violência sexual",        "n_mes": 4,  "n_ano": 22,  "feminino_pct": 90.9, "menor_18_pct": 63.6, "profilaxia_dst_pct": 100.0,"bo_registrado_pct": 72.7, "status": "critico"},
        {"tipo": "Violência patrimonial",   "n_mes": 6,  "n_ano": 28,  "feminino_pct": 71.4, "menor_18_pct": 0,    "profilaxia_dst_pct": None, "bo_registrado_pct": 64.3, "status": "atencao"},
        {"tipo": "Negligência/abandono",    "n_mes": 5,  "n_ano": 26,  "feminino_pct": 57.7, "menor_18_pct": 84.6, "profilaxia_dst_pct": None, "bo_registrado_pct": 46.2, "status": "atencao"},
        {"tipo": "Violência autoprovocada", "n_mes": 3,  "n_ano": 16,  "feminino_pct": 62.5, "menor_18_pct": 43.8, "profilaxia_dst_pct": None, "bo_registrado_pct": 75.0, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _FLUXO():
    return [
        {"passo": "Acolhimento na UBS/UPA",                "responsavel": "Enfermeiro/Médico",       "prazo": "Imediato",        "executado_pct": 94.0, "status": "ok"},
        {"passo": "Notificação SINAN (VD/VS)",              "responsavel": "Profissional de saúde",  "prazo": "Até 7 dias",      "executado_pct": 78.4, "status": "atencao"},
        {"passo": "Profilaxia IST/HIV (violência sexual)",  "responsavel": "Médico",                 "prazo": "Até 72h",         "executado_pct": 100.0,"status": "ok"},
        {"passo": "Anticoncepção de emergência (VS)",       "responsavel": "Médico/Enfermeiro",      "prazo": "Até 72h",         "executado_pct": 100.0,"status": "ok"},
        {"passo": "Encaminhamento CREAS",                   "responsavel": "Assistente Social",      "prazo": "Até 24h",         "executado_pct": 72.8, "status": "atencao"},
        {"passo": "Encaminhamento CAPS/Saúde Mental",       "responsavel": "Assistente Social",      "prazo": "Até 48h",         "executado_pct": 64.2, "status": "atencao"},
        {"passo": "Acompanhamento pós-atendimento (30 dias)","responsavel": "ACS/Enfermeiro",        "prazo": "30 dias",         "executado_pct": 42.8, "status": "critico"},
        {"passo": "Abrigamento/Casa da Mulher",             "responsavel": "CREAS/Assistência Social","prazo": "Conforme caso",  "executado_pct": 58.3, "status": "atencao"},
    ]


@router.get("/dashboard")
async def dashboard():
    return {
        "atendimentos_mes": 50,
        "notificacoes_sinan_mes": 38,
        "subnotificacao_estimada_pct": 40.0,
        "violencia_sexual_mes": 4,
        "profilaxia_ist_realizada_pct": 100.0,
        "menores_vitimas_mes": 12,
        "masculino_agressor_pct": 84.0,
        "reincidentes_pct": 32.0,
        "encaminhamentos_creas_mes": 28,
        "medidas_protetivas_solicitadas_mes": 14,
        "bo_registrado_pct": 54.2,
        "seguimento_30dias_pct": 42.8,
        "status_geral": "critico",
        "competencia": "Jun/2026",
    }

@router.get("/tipos")
async def tipos():
    return _TIPOS_VIOLENCIA()

@router.get("/fluxo-atendimento")
async def fluxo_atendimento():
    return _FLUXO()

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "atendimentos": 42, "notificacoes": 32, "violencia_sexual": 3, "menores": 10, "encaminhamentos_creas": 24},
        {"mes": "Fev/26", "atendimentos": 44, "notificacoes": 33, "violencia_sexual": 3, "menores": 10, "encaminhamentos_creas": 25},
        {"mes": "Mar/26", "atendimentos": 46, "notificacoes": 35, "violencia_sexual": 4, "menores": 11, "encaminhamentos_creas": 26},
        {"mes": "Abr/26", "atendimentos": 48, "notificacoes": 36, "violencia_sexual": 3, "menores": 11, "encaminhamentos_creas": 27},
        {"mes": "Mai/26", "atendimentos": 49, "notificacoes": 37, "violencia_sexual": 4, "menores": 12, "encaminhamentos_creas": 27},
        {"mes": "Jun/26", "atendimentos": 50, "notificacoes": 38, "violencia_sexual": 4, "menores": 12, "encaminhamentos_creas": 28},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Notificação compulsória de violência doméstica", "valor": 78.4, "meta": 100.0, "unidade": "%",  "status": "atencao", "observacao": "Subnotificação estimada em 40% — treinamento equipes previsto Jul/26"},
        {"indicador": "Violência sexual — profilaxia IST/HIV em 72h",  "valor": 100.0,"meta": 100.0, "unidade": "%",  "status": "ok",      "observacao": "Kit profilaxia disponível no Hospital e UPA — protocolo implantado Nov/25"},
        {"indicador": "Seguimento pós-atendimento (30 dias)",          "valor": 42.8, "meta": 80.0,  "unidade": "%",  "status": "critico", "observacao": "57% das vítimas perdem o acompanhamento — mudança de endereço e medo de exposição são as principais barreiras"},
        {"indicador": "Encaminhamento ao CREAS em 24h",                "valor": 72.8, "meta": 90.0,  "unidade": "%",  "status": "atencao", "observacao": "CREAS com 1 assistente social — sobrecarregado; triagem prioritária para casos com menores"},
        {"indicador": "Menores vítimas de violência/mês",              "valor": 12,   "meta": None,  "unidade": "n",  "status": "critico", "observacao": "63% da violência sexual com vítimas <18 anos — acionamento do Conselho Tutelar em 100% dos casos"},
        {"indicador": "Boletim de Ocorrência registrado (%)",          "valor": 54.2, "meta": 80.0,  "unidade": "%",  "status": "atencao", "observacao": "Vítimas com dificuldade de acessar delegacia — Apuí sem Delegacia da Mulher (DDM)"},
    ]