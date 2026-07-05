"""Cuidados Paliativos — Equipe Multiprofissional · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/cuidados-paliativos", tags=["cuidados_paliativos"])

@router.get("/dashboard")
async def dashboard():
    return {
        "pacientes_ativos": 48,
        "pacientes_oncologicos": 28,
        "pacientes_nao_oncologicos": 20,
        "novos_cadastros_mes": 6,
        "obitos_mes": 4,
        "obitos_em_local_desejado_pct": 75.0,
        "visitas_domiciliares_mes": 84,
        "atendimentos_ambulatoriais_mes": 48,
        "consultas_dor_mes": 36,
        "prescricoes_opioides_mes": 28,
        "disponibilidade_morfina_oral": True,
        "equipe_capacitada_pct": 64.8,
        "planos_de_cuidado_atualizados_pct": 87.5,
        "competencia": "Jun/2026",
        "status_geral": "atencao",
    }

@router.get("/pacientes-perfil")
async def pacientes_perfil():
    return {
        "por_diagnostico": [
            {"diagnostico": "Neoplasia maligna — CA pulmão",      "n": 8,  "fase": "terminal"},
            {"diagnostico": "Neoplasia maligna — CA mama",         "n": 6,  "fase": "avancada"},
            {"diagnostico": "Neoplasia maligna — CA colo uterino", "n": 5,  "fase": "terminal"},
            {"diagnostico": "Neoplasia maligna — CA colorretal",   "n": 4,  "fase": "avancada"},
            {"diagnostico": "Neoplasia maligna — outros",          "n": 5,  "fase": "mista"},
            {"diagnostico": "Insuficiência cardíaca avançada",     "n": 6,  "fase": "avancada"},
            {"diagnostico": "DPOC grave/muito grave",              "n": 4,  "fase": "avancada"},
            {"diagnostico": "Demência avançada",                   "n": 4,  "fase": "terminal"},
            {"diagnostico": "ELA / Doenças neurológicas progr.",   "n": 3,  "fase": "terminal"},
            {"diagnostico": "Doença renal crônica em diálise",     "n": 3,  "fase": "avancada"},
        ],
        "por_local_cuidado": [
            {"local": "Domicílio",               "n": 32, "pct": 66.7},
            {"local": "Ambulatório paliativo",   "n": 10, "pct": 20.8},
            {"local": "Internação hospitalar",   "n": 4,  "pct": 8.3},
            {"local": "Casa de apoio (Manaus)",  "n": 2,  "pct": 4.2},
        ],
        "escala_ecog": [
            {"ecog": "0 — Totalmente ativo",     "n": 2},
            {"ecog": "1 — Restrição leve",        "n": 4},
            {"ecog": "2 — Ambulatorial >50%",     "n": 8},
            {"ecog": "3 — Cuidados pessoais",     "n": 18},
            {"ecog": "4 — Totalmente dependente", "n": 16},
        ],
    }

@router.get("/controle-sintomas")
async def controle_sintomas():
    return [
        {"sintoma": "Dor",                   "prevalencia_pct": 82.4, "controlado_pct": 68.4, "meta_pct": 80, "farmaco_principal": "Morfina oral 10mg + Dipirona 1g",      "status": "atencao"},
        {"sintoma": "Dispneia",              "prevalencia_pct": 64.8, "controlado_pct": 72.4, "meta_pct": 75, "farmaco_principal": "Morfina oral (off-label) + O₂ paliativo","status": "atencao"},
        {"sintoma": "Náuseas/Vômitos",       "prevalencia_pct": 48.4, "controlado_pct": 84.6, "meta_pct": 80, "farmaco_principal": "Metoclopramida + Ondansetrona",          "status": "ok"},
        {"sintoma": "Constipação",           "prevalencia_pct": 64.8, "controlado_pct": 56.4, "meta_pct": 80, "farmaco_principal": "Lactulose + Bisacodil",                  "status": "atencao"},
        {"sintoma": "Ansiedade/Depressão",   "prevalencia_pct": 58.4, "controlado_pct": 48.4, "meta_pct": 70, "farmaco_principal": "Diazepam + Amitriptilina",              "status": "critico"},
        {"sintoma": "Caquexia/Anorexia",     "prevalencia_pct": 72.4, "controlado_pct": 32.4, "meta_pct": 50, "farmaco_principal": "Suporte nutricional oral + dexametasona","status": "critico"},
        {"sintoma": "Delirium",              "prevalencia_pct": 28.4, "controlado_pct": 72.4, "meta_pct": 75, "farmaco_principal": "Haloperidol + medidas não farmacológicas","status": "atencao"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "pacientes_ativos": 42, "obitos": 3, "visitas_dom": 72, "consultas_dor": 28, "obito_local_desejado_pct": 66.7},
        {"mes": "Fev/26", "pacientes_ativos": 44, "obitos": 4, "visitas_dom": 76, "consultas_dor": 30, "obito_local_desejado_pct": 75.0},
        {"mes": "Mar/26", "pacientes_ativos": 44, "obitos": 3, "visitas_dom": 78, "consultas_dor": 32, "obito_local_desejado_pct": 66.7},
        {"mes": "Abr/26", "pacientes_ativos": 46, "obitos": 5, "visitas_dom": 80, "consultas_dor": 34, "obito_local_desejado_pct": 80.0},
        {"mes": "Mai/26", "pacientes_ativos": 46, "obitos": 4, "visitas_dom": 82, "consultas_dor": 36, "obito_local_desejado_pct": 75.0},
        {"mes": "Jun/26", "pacientes_ativos": 48, "obitos": 4, "visitas_dom": 84, "consultas_dor": 36, "obito_local_desejado_pct": 75.0},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Óbito no local desejado pelo paciente",   "valor": 75.0, "meta": 80.0, "unidade": "%","status": "atencao", "observacao": "3/4 óbitos em Jun/26 no domicílio — 1 em hospital por crise sem controle"},
        {"indicador": "Dor controlada (EVA ≤4)",                 "valor": 68.4, "meta": 80.0, "unidade": "%","status": "atencao", "observacao": "Dor oncológica neuropática com maior dificuldade de controle"},
        {"indicador": "Ansiedade/Depressão controlada",          "valor": 48.4, "meta": 70.0, "unidade": "%","status": "critico", "observacao": "Falta psiquiatra na equipe — encaminhamento Manaus com espera de 90+ dias"},
        {"indicador": "Planos de cuidado atualizados",           "valor": 87.5, "meta": 100.0,"unidade": "%","status": "atencao", "observacao": "6 pacientes com plano desatualizado > 60 dias"},
        {"indicador": "Disponibilidade de morfina oral",         "valor": 100,  "meta": 100,  "unidade": "%","status": "ok",      "observacao": "Estoque regular — 280 comprimidos 10mg em Jun/26"},
        {"indicador": "Equipe capacitada em cuidados paliativos","valor": 64.8, "meta": 80.0, "unidade": "%","status": "atencao", "observacao": "Curso PALIA-R previsto para Set/26 — 12 profissionais inscritos"},
    ]
