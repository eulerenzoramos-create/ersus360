from __future__ import annotations
from datetime import date as _date
from fastapi import APIRouter
from services import sim_sinasc_service
from functools import lru_cache

router = APIRouter(prefix="/api/comite-mortalidade-apui", tags=["Comitê de Mortalidade Apuí"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "obitos_maternos_2025": 2,
        "obitos_maternos_2024": 3,
        "razao_mortalidade_materna_100k": 256.3,
        "meta_rmm_100k": 30.0,
        "obitos_maternos_evitaveis_pct": 100.0,
        "obitos_infantis_2025": 18,
        "taxa_mortalidade_infantil_1k": 22.4,
        "meta_tmi_1k": 10.0,
        "obitos_infantis_evitaveis_pct": 77.8,
        "obitos_neonatais_2025": 12,
        "obitos_pos_neonatais_2025": 6,
        "investigacoes_concluidas_pct": 88.9,
        "investigacoes_prazo_60d_pct": 66.7,
        "fichas_sinasc_completude_pct": 84.2,
        "fichas_sim_completude_pct": 78.6,
        "reunioes_realizadas_2025": 4,
        "reunioes_meta_2025": 6,
        "status_mortalidade_materna": "critico",
        "status_mortalidade_infantil": "critico",
        "status_investigacoes": "atencao",
    }


@lru_cache(maxsize=1)
def _OBITOS_MATERNOS():
    return [
        {
            "id": "OM-2025-001", "mes": "Março/2025", "causa_basica": "Hemorragia pós-parto",
            "causa_obito_CID": "O72", "local_obito": "UPA Apuí", "gestacao": "39 semanas",
            "pre_natal_consultas": 4, "meta_pre_natal": 6, "evitavel": True,
            "classificacao": "Evitável — falha assistencial",
            "fatores": ["Pré-natal incompleto", "Retardo na decisão de transferência", "Ausência de UTI obstétrica"],
            "recomendacoes": ["Protocolo de hemorragia pós-parto", "Simulacro de emergência obstétrica", "Garantia de bolsa de ocitocina em estoque"]
        },
        {
            "id": "OM-2025-002", "mes": "Junho/2025", "causa_basica": "Pré-eclâmpsia grave / Eclâmpsia",
            "causa_obito_CID": "O14", "local_obito": "Hospital Regional — Humaitá (referência)", "gestacao": "34 semanas",
            "pre_natal_consultas": 6, "meta_pre_natal": 6, "evitavel": True,
            "classificacao": "Evitável — retardo no reconhecimento de sinal de alerta",
            "fatores": ["Aferição de PA sem registro sistemático", "Demora de 8h na decisão de transferência", "SAMU com UTI móvel em Manaus (784 km)"],
            "recomendacoes": ["Protocolo ALERTA pré-eclâmpsia", "Treinamento equipe UPA", "Sulfato de magnésio na farmácia da UPA"]
        },
        {
            "id": "OM-2024-001", "mes": "Fev/2024", "causa_basica": "Sepse puerperal",
            "causa_obito_CID": "O85", "local_obito": "UPA Apuí", "gestacao": "Puerpério imediato",
            "pre_natal_consultas": 5, "meta_pre_natal": 6, "evitavel": True,
            "classificacao": "Evitável — falha no reconhecimento precoce",
            "fatores": ["Ausência de protocolo sepse", "Atendimento médico com demora de 3h"],
            "recomendacoes": ["Implantar protocolo Sepse-6", "Reforço de plantão noturno UPA"]
        },
    ]


@lru_cache(maxsize=1)
def _OBITOS_INFANTIS():
    return [
        {"causa": "Prematuridade / Baixo peso",     "obitos_2025": 6,  "evitaveis_pct": 83.3, "CID": "P07", "principal_fator": "Ausência de UTI neonatal — transferência tardia >200 km"},
        {"causa": "Infecção neonatal / Sepse",       "obitos_2025": 4,  "evitaveis_pct": 100.0,"CID": "P36", "principal_fator": "Diagnóstico tardio + antibioticoterapia retardada"},
        {"causa": "Malformação congênita",           "obitos_2025": 2,  "evitaveis_pct": 0.0,  "CID": "Q",   "principal_fator": "Não evitável — diagnóstico pré-natal ausente"},
        {"causa": "Diarreia e desidratação",         "obitos_2025": 2,  "evitaveis_pct": 100.0,"CID": "A09", "principal_fator": "Acesso tardio à UBS — área ribeirinha"},
        {"causa": "Pneumonia",                       "obitos_2025": 2,  "evitaveis_pct": 100.0,"CID": "J18", "principal_fator": "Diagnóstico tardio em comunidade distante"},
        {"causa": "Afogamento / Acidente doméstico", "obitos_2025": 1,  "evitaveis_pct": 100.0,"CID": "W65", "principal_fator": "Comunidade ribeirinha — resgate fluvial >2h"},
        {"causa": "Desnutrição grave",               "obitos_2025": 1,  "evitaveis_pct": 100.0,"CID": "E43", "principal_fator": "Falta de acompanhamento regular — família em área de garimpo"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2021", "obitos_maternos": 4, "rmm_100k": 512.4, "obitos_infantis": 22, "tmi_1k": 27.4, "investigados_pct": 72.4},
        {"ano": "2022", "obitos_maternos": 3, "rmm_100k": 384.2, "obitos_infantis": 20, "tmi_1k": 24.9, "investigados_pct": 80.0},
        {"ano": "2023", "obitos_maternos": 3, "rmm_100k": 384.2, "obitos_infantis": 19, "tmi_1k": 23.6, "investigados_pct": 84.2},
        {"ano": "2024", "obitos_maternos": 3, "rmm_100k": 384.2, "obitos_infantis": 18, "tmi_1k": 22.4, "investigados_pct": 88.9},
        {"ano": "2025", "obitos_maternos": 2, "rmm_100k": 256.3, "obitos_infantis": 18, "tmi_1k": 22.4, "investigados_pct": 88.9},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Razão Mortalidade Materna",       "valor": "256,3/100k NV", "meta": "≤ 30/100k",   "status": "critico", "observacao": "8,5x a meta nacional. 100% dos óbitos classificados como evitáveis — causa direta: falha assistencial + ausência de UTI obstétrica regional. Municípios do sul do AM sem maternidade de risco habitual"},
        {"indicador": "Taxa Mortalidade Infantil",       "valor": "22,4/1.000 NV", "meta": "≤ 10/1.000",  "status": "critico", "observacao": "2,2x a meta. 77,8% evitáveis: prematuridade sem UTI neonatal (transferência 200+ km), sepse de diagnóstico tardio, e doenças infecciosas em ribeirinhos sem acesso a atenção básica regular"},
        {"indicador": "Investigação de Óbitos Maternos", "valor": "100%",          "meta": "100%",         "status": "ok",      "observacao": "Todos os óbitos maternos investigados. Fichas enviadas ao Comitê Estadual. Prazo médio de conclusão: 72 dias (meta 60 dias)"},
        {"indicador": "Investigação de Óbitos Infantis", "valor": "88,9%",         "meta": "100%",         "status": "atencao", "observacao": "2 óbitos em comunidades rurais com investigação incompleta por dificuldade de acesso e ausência de prontuário. Subnotificação estimada 15% em mortes domiciliares"},
        {"indicador": "Reuniões do Comitê",              "valor": "4/6",           "meta": "≥ 6/ano",      "status": "atencao", "observacao": "2 reuniões não realizadas por ausência de quórum (médico obstetra, profissional de epidemiologia). Município sem obstetra fixo — cobertura por teleconsulta"},
        {"indicador": "Completude SIM/SINASC",           "valor": "81,4%",         "meta": "≥ 95%",        "status": "atencao", "observacao": "Declarações de óbito com causa mal definida em 18,6% dos casos. SINASC: 4 nascimentos de área ribeirinha sem notificação no prazo — partos domiciliares"},
    ]


@router.get("/dashboard")
async def dashboard():
    ano = _date.today().year - 1
    obitos = await sim_sinasc_service.buscar_obitos(ano)
    nascidos = await sim_sinasc_service.buscar_nascidos_vivos(ano)
    nv = nascidos.get("total_nascimentos", 246)
    return {
        **_DASHBOARD,
        "obitos_gerais_ano": obitos.get("total_obitos", _DASHBOARD().get("obitos_gerais_2025")),
        "nascidos_vivos_ano": nv,
        "causas_externas_pct": obitos.get("causas_externas_pct"),
        "cardiovasculares_pct": obitos.get("cardiovasculares_pct"),
        "fonte_sim": obitos.get("fonte", "referencia"),
        "fonte_sinasc": nascidos.get("fonte", "referencia"),
    }

@router.get("/obitos-maternos")
def obitos_maternos(): return _OBITOS_MATERNOS

@router.get("/obitos-infantis")
def obitos_infantis(): return _OBITOS_INFANTIS

@router.get("/historico")
async def historico():
    hist = await sim_sinasc_service.buscar_historico_mortalidade()
    return hist or _HISTORICO

@router.get("/indicadores")
def indicadores(): return _INDICADORES
