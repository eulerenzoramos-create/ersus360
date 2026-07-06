from fastapi import APIRouter

router = APIRouter(prefix="/api/programa-saude-escola", tags=["programa_saude_escola"])

_DASHBOARD = {
    "escolas_municipais_total": 28,
    "escolas_pse_vinculadas": 22,
    "escolas_pse_pct": 78.6,
    "alunos_matriculados": 4284,
    "alunos_pse_cobertos": 3512,
    "alunos_pse_pct": 81.9,
    "equipes_saude_vinculadas": 8,
    "acoes_realizadas_ano": 184,
    "acoes_meta_ano": 220,
    "componente1_pct": 82.4,
    "componente2_pct": 68.2,
    "componente3_pct": 54.8,
    "status_geral": "atencao",
}

_ESCOLAS = [
    {"escola": "EMEF Apuí — Sede (polo)",          "zona": "urbana", "alunos": 842, "pse": True,  "equipe": "UBSF Sede",  "acoes_2025": 24, "status": "ok"},
    {"escola": "EMEF Maravilha",                    "zona": "urbana", "alunos": 618, "pse": True,  "equipe": "UBSF Sede",  "acoes_2025": 18, "status": "ok"},
    {"escola": "EEAM Gov. Plínio Ramos (estadual)", "zona": "urbana", "alunos": 724, "pse": True,  "equipe": "UBSF Sede",  "acoes_2025": 20, "status": "ok"},
    {"escola": "EMEF Juma",                         "zona": "rural",  "alunos": 284, "pse": True,  "equipe": "UBSF Juma",  "acoes_2025": 12, "status": "atencao"},
    {"escola": "EMEF Mapari",                       "zona": "rural",  "alunos": 196, "pse": True,  "equipe": "UBSF Mapari","acoes_2025": 8,  "status": "atencao"},
    {"escola": "EMEF Igapó-Açu",                    "zona": "rural",  "alunos": 142, "pse": True,  "equipe": "UBSF Igapó", "acoes_2025": 6,  "status": "atencao"},
    {"escola": "EMEF Nova Olinda (PA Aripuanã)",    "zona": "rural",  "alunos": 98,  "pse": True,  "equipe": "EqAP móvel", "acoes_2025": 4,  "status": "critico"},
    {"escola": "6 escolas zona rural remota",       "zona": "rural",  "alunos": 608, "pse": False, "equipe": None,          "acoes_2025": 0,  "status": "critico"},
]

_ACOES = [
    {"componente": "Componente 1 — Avaliação das Condições de Saúde",
     "acoes": [
         {"acao": "Avaliação antropométrica (peso/altura/IMC)", "realizadas": 3284, "meta": 3512, "pct": 93.5, "status": "ok"},
         {"acao": "Avaliação saúde bucal",                      "realizadas": 2914, "meta": 3512, "pct": 83.0, "status": "ok"},
         {"acao": "Atualização cartão vacinal",                 "realizadas": 3104, "meta": 3512, "pct": 88.4, "status": "ok"},
         {"acao": "Triagem visual (Snellen/Ishihara)",          "realizadas": 2841, "meta": 3512, "pct": 80.9, "status": "atencao"},
         {"acao": "Triagem auditiva",                           "realizadas": 2480, "meta": 3512, "pct": 70.6, "status": "atencao"},
         {"acao": "Acuidade visual / teste olho do peixe",      "realizadas": 2284, "meta": 3512, "pct": 65.0, "status": "atencao"},
     ]},
    {"componente": "Componente 2 — Promoção de Saúde e Prevenção",
     "acoes": [
         {"acao": "Educação em saúde bucal",           "realizadas": 28, "meta": 32, "pct": 87.5, "status": "ok"},
         {"acao": "Alimentação saudável (PNAE)",        "realizadas": 22, "meta": 28, "pct": 78.6, "status": "atencao"},
         {"acao": "Atividade física e esporte",         "realizadas": 20, "meta": 28, "pct": 71.4, "status": "atencao"},
         {"acao": "Saúde sexual e reprodutiva (>10a)",  "realizadas": 14, "meta": 22, "pct": 63.6, "status": "atencao"},
         {"acao": "Prevenção ao uso de drogas/álcool",  "realizadas": 18, "meta": 28, "pct": 64.3, "status": "atencao"},
         {"acao": "Saúde mental e prevenção ao bullying","realizadas": 12, "meta": 22, "pct": 54.5, "status": "critico"},
     ]},
    {"componente": "Componente 3 — Educação Permanente dos Profissionais",
     "acoes": [
         {"acao": "Formação saúde alimentar educadores",   "realizadas": 18, "meta": 28, "pct": 64.3, "status": "atencao"},
         {"acao": "Capacitação professores (1º socorros)", "realizadas": 14, "meta": 28, "pct": 50.0, "status": "critico"},
         {"acao": "Oficina saúde mental professores",      "realizadas": 8,  "meta": 18, "pct": 44.4, "status": "critico"},
     ]},
]

_HISTORICO = [
    {"ano": "2022", "escolas_pse": 16, "alunos_cobertos": 2480, "acoes": 124, "comp1_pct": 68.4, "comp2_pct": 52.1, "comp3_pct": 38.2},
    {"ano": "2023", "escolas_pse": 18, "alunos_cobertos": 2840, "acoes": 148, "comp1_pct": 72.8, "comp2_pct": 58.4, "comp3_pct": 44.6},
    {"ano": "2024", "escolas_pse": 20, "alunos_cobertos": 3184, "acoes": 164, "comp1_pct": 78.2, "comp2_pct": 64.1, "comp3_pct": 50.2},
    {"ano": "2025", "escolas_pse": 22, "alunos_cobertos": 3512, "acoes": 184, "comp1_pct": 82.4, "comp2_pct": 68.2, "comp3_pct": 54.8},
]

_INDICADORES = [
    {"indicador": "Cobertura PSE (escolas)",     "valor": 78.6, "meta": 100.0,"unidade": "%","status": "atencao","observacao": "6 escolas rurais remotas sem equipe de saúde vinculada"},
    {"indicador": "Cobertura PSE (alunos)",      "valor": 81.9, "meta": 90.0, "unidade": "%","status": "atencao","observacao": "18,1% dos alunos sem cobertura de ações PSE"},
    {"indicador": "Meta de ações atingida",      "valor": 83.6, "meta": 100.0,"unidade": "%","status": "atencao","observacao": "184/220 ações realizadas — zona rural com menor adesão"},
    {"indicador": "Capacitação professores 1º socorros","valor": 50.0,"meta": 80.0,"unidade": "%","status": "critico","observacao": "Apenas metade dos professores capacitados em primeiros socorros"},
    {"indicador": "Triagem visual escolar",      "valor": 80.9, "meta": 95.0, "unidade": "%","status": "atencao","observacao": "19,1% sem triagem — baixa acuidade pode prejudicar aprendizado"},
    {"indicador": "Cartão vacinal atualizado",   "valor": 88.4, "meta": 95.0, "unidade": "%","status": "atencao","observacao": "11,6% com esquema incompleto identificado na triagem PSE"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/escolas")
def escolas():
    return _ESCOLAS


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
