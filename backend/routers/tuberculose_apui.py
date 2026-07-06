from fastapi import APIRouter

router = APIRouter(prefix="/api/tuberculose-apui", tags=["tuberculose_apui"])

_DASHBOARD = {
    "casos_novos_ano": 22,
    "incidencia_100k": 89,
    "meta_incidencia_100k": 10,
    "coeficiente_mortalidade_100k": 4.0,
    "cura_pct": 72.4,
    "meta_cura_pct": 85.0,
    "abandono_pct": 18.4,
    "meta_abandono_pct": 5.0,
    "obito_tb_pct": 9.2,
    "casos_tb_hiv_coinfectados_pct": 18.2,
    "casos_tb_mdr": 1,
    "contatos_examinados_pct": 58.4,
    "meta_contatos_pct": 80.0,
    "dots_supervisao_pct": 64.2,
    "meta_dots_pct": 100.0,
    "baciloscopia_diagnostico_pct": 78.4,
    "cultura_disponivel": False,
    "tst_realizado_pct": 48.4,
    "ltbi_tratamento_pct": 28.4,
    "status_cura": "critico",
    "status_abandono": "critico",
    "status_dots": "critico",
}

_CASOS_PERFIL = [
    {"categoria": "Pulmonar bacilífera",           "casos": 14, "pct": 63.6, "cura_pct": 78.6, "abandono_pct": 14.3, "status": "atencao"},
    {"categoria": "Pulmonar não bacilífera",        "casos": 5,  "pct": 22.7, "cura_pct": 80.0, "abandono_pct": 20.0, "status": "atencao"},
    {"categoria": "Extrapulmonar",                 "casos": 2,  "pct": 9.1,  "cura_pct": 50.0, "abandono_pct": 50.0, "status": "critico"},
    {"categoria": "TB recidiva",                   "casos": 1,  "pct": 4.5,  "cura_pct": 0.0,  "abandono_pct": 100.0,"status": "critico"},
]

_DETERMINANTES = [
    {"fator": "Coinfecção TB-HIV",           "prevalencia_pct": 18.2, "impacto": "Mortalidade 3× maior — TARV obrigatório concomitante", "status": "critico"},
    {"fator": "Privação de liberdade",        "prevalencia_pct": 4.5,  "impacto": "Incidência 28× maior em privados de liberdade",         "status": "critico"},
    {"fator": "Alcoolismo",                   "prevalencia_pct": 22.7, "impacto": "Risco 3× maior de abandono e falência terapêutica",     "status": "critico"},
    {"fator": "Desnutrição",                  "prevalencia_pct": 31.8, "impacto": "Imunossupressão favorece reativação de LTBI",           "status": "critico"},
    {"fator": "Moradia inadequada / aglom.",  "prevalencia_pct": 40.9, "impacto": "Principal fator de transmissão intradomiciliar",        "status": "critico"},
    {"fator": "Ribeirinho / área rural",      "prevalencia_pct": 27.3, "impacto": "Dificuldade de DOTS e seguimento — abandono mais alto", "status": "critico"},
]

_HISTORICO = [
    {"ano": "2022", "casos_novos": 18, "cura_pct": 66.7, "abandono_pct": 22.2, "obitos": 2, "coinfec_hiv_pct": 16.7},
    {"ano": "2023", "casos_novos": 19, "cura_pct": 68.4, "abandono_pct": 21.1, "obitos": 2, "coinfec_hiv_pct": 15.8},
    {"ano": "2024", "casos_novos": 20, "cura_pct": 70.0, "abandono_pct": 20.0, "obitos": 2, "coinfec_hiv_pct": 17.5},
    {"ano": "2025", "casos_novos": 22, "cura_pct": 72.4, "abandono_pct": 18.4, "obitos": 2, "coinfec_hiv_pct": 18.2},
]

_INDICADORES = [
    {"indicador": "Taxa de cura",                 "valor": 72.4, "meta": 85.0,  "unidade": "%",       "status": "critico", "observacao": "12,6 pp abaixo da meta — abandono e óbito explicam 27,6% dos desfechos desfavoráveis. Região amazônica tem as piores taxas do Brasil"},
    {"indicador": "Taxa de abandono",             "valor": 18.4, "meta": 5.0,   "unidade": "%",       "status": "critico", "observacao": "18,4% vs meta 5% — DOTS não estruturado (64,2% vs meta 100%). Populações ribeirinhas e usuários de álcool têm abandono estimado > 30%"},
    {"indicador": "DOTS supervisão",              "valor": 64.2, "meta": 100.0, "unidade": "%",       "status": "critico", "observacao": "35,8% sem supervisão de tomada — principal causa de abandono e risco de resistência. ACS sobrecarregados, zona rural sem logística"},
    {"indicador": "Contatos examinados",          "valor": 58.4, "meta": 80.0,  "unidade": "%",       "status": "atencao", "observacao": "41,6% dos contatos sem exame — cada caso pulmonar tem em média 8 contatos domiciliares. Subnotificação de novos casos esperada"},
    {"indicador": "LTBI em tratamento",           "valor": 28.4, "meta": 80.0,  "unidade": "%",       "status": "critico", "observacao": "71,6% dos LTBI identificados sem tratamento preventivo — reservatório de futuros casos ativos não tratado"},
    {"indicador": "Coinfecção TB-HIV",            "valor": 18.2, "meta": None,  "unidade": "%",       "status": "critico", "observacao": "18,2% de coinfecção TB-HIV — mortalidade 3× maior, exige início simultâneo de TARV e esquema TB. 1 caso MDR em 2025"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/perfil")
def perfil():
    return _CASOS_PERFIL


@router.get("/determinantes")
def determinantes():
    return _DETERMINANTES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
