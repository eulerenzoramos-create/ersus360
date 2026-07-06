from fastapi import APIRouter

router = APIRouter(prefix="/api/cuidados-paliativos", tags=["cuidados_paliativos"])

_DASHBOARD = {
    "pacientes_ativos": 42,
    "pacientes_domicilio": 34,
    "pacientes_hospitalar": 8,
    "oncologicos_pct": 52.4,
    "nao_oncologicos_pct": 47.6,
    "emad_implantada": True,
    "emad_profissionais": 6,
    "visitas_domiciliares_mes": 148,
    "media_visitas_paciente_mes": 4.4,
    "meta_visitas_paciente_mes": 6.0,
    "opioides_disponiveis": True,
    "morfina_estoque_dias": 28,
    "meta_estoque_dias": 60,
    "obitos_dignos_domicilio_pct": 58.4,
    "internacoes_evitadas_mes": 8,
    "satisfacao_familiar_nota": 4.1,
    "status_cobertura": "atencao",
    "status_opioides": "atencao",
}

_PACIENTES_DIAGNOSTICO = [
    {"diagnostico": "Neoplasia maligna (vários)",         "pacientes": 22, "pct": 52.4, "estagio": "IV", "domicilio": 18, "hospitalar": 4},
    {"diagnostico": "DPOC avançado / insuficiência resp.", "pacientes": 6,  "pct": 14.3, "estagio": "terminal", "domicilio": 5, "hospitalar": 1},
    {"diagnostico": "Insuficiência cardíaca congestiva",   "pacientes": 5,  "pct": 11.9, "estagio": "terminal", "domicilio": 4, "hospitalar": 1},
    {"diagnostico": "AVC sequelado grave",                "pacientes": 4,  "pct":  9.5, "estagio": "seq. grave","domicilio": 3, "hospitalar": 1},
    {"diagnostico": "Insuficiência renal crônica (sem TRS)","pacientes": 3, "pct": 7.1, "estagio": "terminal", "domicilio": 3, "hospitalar": 0},
    {"diagnostico": "Demência avançada",                  "pacientes": 2,  "pct":  4.8, "estagio": "avançado",  "domicilio": 1, "hospitalar": 1},
]

_CONTROLE_SINTOMAS = [
    {"sintoma": "Dor",              "prevalencia_pct": 84.2, "controlado_pct": 72.4, "principal_medic": "Morfina / Tramadol",   "status": "atencao"},
    {"sintoma": "Dispneia",         "prevalencia_pct": 62.4, "controlado_pct": 64.2, "principal_medic": "Morfina / O₂ domicil.","status": "atencao"},
    {"sintoma": "Náusea / vômito",  "prevalencia_pct": 48.4, "controlado_pct": 78.4, "principal_medic": "Metoclopramida",       "status": "ok"},
    {"sintoma": "Ansiedade / agit.","prevalencia_pct": 58.4, "controlado_pct": 62.4, "principal_medic": "Midazolam / Diazepam", "status": "atencao"},
    {"sintoma": "Constipação",      "prevalencia_pct": 72.4, "controlado_pct": 68.4, "principal_medic": "Lactulose / Bisacodil","status": "atencao"},
    {"sintoma": "Delirium",         "prevalencia_pct": 38.4, "controlado_pct": "—",  "principal_medic": "Haloperidol",          "status": "atencao"},
]

_HISTORICO = [
    {"mes": "Jan/25", "pacientes": 36, "visitas": 122, "obitos": 3, "internacoes_evit": 6, "satisf": 4.0},
    {"mes": "Fev/25", "pacientes": 37, "visitas": 128, "obitos": 2, "internacoes_evit": 7, "satisf": 4.0},
    {"mes": "Mar/25", "pacientes": 38, "visitas": 132, "obitos": 3, "internacoes_evit": 7, "satisf": 4.1},
    {"mes": "Abr/25", "pacientes": 40, "visitas": 138, "obitos": 2, "internacoes_evit": 8, "satisf": 4.1},
    {"mes": "Mai/25", "pacientes": 41, "visitas": 144, "obitos": 3, "internacoes_evit": 8, "satisf": 4.1},
    {"mes": "Jun/25", "pacientes": 42, "visitas": 148, "obitos": 2, "internacoes_evit": 8, "satisf": 4.1},
]

_INDICADORES = [
    {"indicador": "Pacientes com CP ativo",             "valor": 42,   "meta": None, "unidade": "pacientes","status": "ok",      "observacao": "42 pacientes em cuidados paliativos — estimativa de subcobertura de ~30% pela dificuldade de acesso rural"},
    {"indicador": "Controle de dor adequado",           "valor": 72.4, "meta": 90.0, "unidade": "%",        "status": "atencao", "observacao": "27,6% com dor não controlada — morfina com estoque de 28 dias (meta 60). Risco de desabastecimento"},
    {"indicador": "Visitas domiciliares / paciente / mês","valor": 4.4, "meta": 6.0, "unidade": "visitas",  "status": "atencao", "observacao": "4,4 vs meta 6 — EMAD com 6 profissionais para 34 pacientes domiciliares em área geográfica extensa"},
    {"indicador": "Óbitos com dignidade (domicílio)",   "valor": 58.4, "meta": 70.0, "unidade": "%",        "status": "atencao", "observacao": "41,6% dos pacientes ainda morrem em ambiente hospitalar — desejo dos pacientes é falecer em casa"},
    {"indicador": "Estoque de morfina",                 "valor": 28,   "meta": 60,   "unidade": "dias",     "status": "atencao", "observacao": "28 dias de estoque — abastecimento via REMUME; atraso logístico de Manaus pode causar descontinuidade"},
    {"indicador": "Internações evitadas / mês",         "valor": 8,    "meta": None, "unidade": "intern.",  "status": "ok",      "observacao": "8 internações/mês evitadas pelo CP domiciliar — economia estimada de R$ 6.700/internação"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/diagnosticos")
def diagnosticos():
    return _PACIENTES_DIAGNOSTICO


@router.get("/controle-sintomas")
def controle_sintomas():
    return _CONTROLE_SINTOMAS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
