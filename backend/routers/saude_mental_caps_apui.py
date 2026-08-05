from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-mental-caps-apui", tags=["saude_mental_caps_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "caps_implantado": True,
        "caps_modalidade": "CAPS I",
        "caps_profissionais": 12,
        "caps_pacientes_ativos": 284,
        "caps_atendimentos_mes": 1284,
        "pacientes_psicose_esquizofrenia": 84,
        "pacientes_alcool_drogas": 112,
        "pacientes_transtorno_humor": 62,
        "pacientes_outros": 26,
        "internacoes_psiquiatricas_ano": 48,
        "internacoes_hospital_referencia": "Manaus/AM",
        "leitos_psiquiatricos_municipio": 0,
        "crise_atendida_caps_pct": 58.4,
        "crise_encaminhada_manaus_pct": 41.6,
        "abandonos_tratamento_pct": 28.4,
        "meta_abandono_pct": 15.0,
        "satisfacao_usuario_nota": 3.8,
        "status_caps": "atencao",
        "status_abandono": "critico",
        "status_crise": "atencao",
        "caps_tem_leito_observacao": False,
        "caps_tem_residencia_terapeutica": False,
    }


@lru_cache(maxsize=1)
def _DIAGNOSTICOS():
    return [
        {"cid": "F10",    "descricao": "Transtornos álcool",                  "pacientes": 112, "pct": 39.4, "internacoes_ano": 18, "status": "critico"},
        {"cid": "F20-29", "descricao": "Esquizofrenia / psicoses",            "pacientes": 84,  "pct": 29.6, "internacoes_ano": 16, "status": "critico"},
        {"cid": "F31-33", "descricao": "Transtorno bipolar / depressão grave","pacientes": 62,  "pct": 21.8, "internacoes_ano": 10, "status": "atencao"},
        {"cid": "F19",    "descricao": "Transtornos múltiplas drogas",        "pacientes": 18,  "pct": 6.3,  "internacoes_ano": 4,  "status": "critico"},
        {"cid": "F41",    "descricao": "Ansiedade grave",                     "pacientes": 8,   "pct": 2.9,  "internacoes_ano": 0,  "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _SERVICOS():
    return [
        {"servico": "Consulta médica psiquiátrica",   "disponivel": True,  "frequencia": "2×/semana", "capacidade_mes": 128, "realizado_mes": 112, "status": "ok"},
        {"servico": "Consulta psicológica",           "disponivel": True,  "frequencia": "Diária",    "capacidade_mes": 280, "realizado_mes": 248, "status": "ok"},
        {"servico": "Atendimento grupal",             "disponivel": True,  "frequencia": "3×/semana", "capacidade_mes": 200, "realizado_mes": 184, "status": "ok"},
        {"servico": "Visita domiciliar CAPS",         "disponivel": True,  "frequencia": "Semanal",   "capacidade_mes": 64,  "realizado_mes": 48,  "status": "atencao"},
        {"servico": "Leito de observação (crise)",    "disponivel": False, "frequencia": "—",         "capacidade_mes": 0,   "realizado_mes": 0,   "status": "critico"},
        {"servico": "Residência terapêutica",         "disponivel": False, "frequencia": "—",         "capacidade_mes": 0,   "realizado_mes": 0,   "status": "critico"},
        {"servico": "CAPS AD (álcool/drogas)",        "disponivel": False, "frequencia": "—",         "capacidade_mes": 0,   "realizado_mes": 0,   "status": "critico"},
        {"servico": "Medicação (REMUME psiquiatria)", "disponivel": True,  "frequencia": "Contínua",  "capacidade_mes": 284, "realizado_mes": 248, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "atendimentos": 1084, "pacientes": 264, "internacoes": 4, "abandonos": 28, "crises_caps": 18},
        {"mes": "Fev/25", "atendimentos": 1128, "pacientes": 268, "internacoes": 3, "abandonos": 24, "crises_caps": 16},
        {"mes": "Mar/25", "atendimentos": 1184, "pacientes": 274, "internacoes": 5, "abandonos": 22, "crises_caps": 22},
        {"mes": "Abr/25", "atendimentos": 1224, "pacientes": 278, "internacoes": 4, "abandonos": 20, "crises_caps": 19},
        {"mes": "Mai/25", "atendimentos": 1248, "pacientes": 280, "internacoes": 3, "abandonos": 18, "crises_caps": 21},
        {"mes": "Jun/25", "atendimentos": 1284, "pacientes": 284, "internacoes": 4, "abandonos": 26, "crises_caps": 24},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "CAPS I implantado",                   "valor": 1,    "meta": 1,    "unidade": "serv.",  "status": "ok",      "observacao": "CAPS I em funcionamento. Porém: CAPS AD (álcool/drogas) não implantado — 112 pac. com transtorno de álcool no CAPS geral"},
        {"indicador": "Abandono de tratamento",              "valor": 28.4, "meta": 15.0, "unidade": "%",      "status": "critico", "observacao": "28,4% dos pacientes abandonam o tratamento — 13,4 pp acima da meta. Distância, estigma e falta de leito de acolhimento são as principais causas"},
        {"indicador": "Crises resolvidas no CAPS",           "valor": 58.4, "meta": 80.0, "unidade": "%",      "status": "atencao", "observacao": "41,6% das crises psiquiátricas são encaminhadas a Manaus — sem leito de observação no CAPS, qualquer crise mais grave gera transferência 784 km"},
        {"indicador": "Internações psiquiátricas/ano",       "valor": 48,   "meta": None, "unidade": "intern.","status": "atencao", "observacao": "48 internações/ano em Manaus — custo médio R$ 4.200 + transporte. Custo estimado R$ 201.600/ano + morbidade de transferência"},
        {"indicador": "Leito de observação (crise)",         "valor": 0,    "meta": 2,    "unidade": "leitos", "status": "critico", "observacao": "ZERO leitos de observação em Apuí — para crise psiquiátrica, única opção é UPA (sem psiquiatra) ou transferência para Manaus"},
        {"indicador": "Cobertura em saúde mental (pop.)",    "valor": 1.15, "meta": 2.0,  "unidade": "%",      "status": "atencao", "observacao": "1,15% da população em acompanhamento CAPS — prevalência esperada de 3%. Subdiagnóstico significativo especialmente em área rural"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/diagnosticos")
def diagnosticos():
    return _DIAGNOSTICOS


@router.get("/servicos")
def servicos():
    return _SERVICOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
