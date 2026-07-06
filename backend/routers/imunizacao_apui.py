from fastapi import APIRouter

router = APIRouter(prefix="/api/imunizacao-apui", tags=["imunizacao_apui"])

_DASHBOARD = {
    "cobertura_geral_pct": 84.2,
    "meta_cobertura_pct": 95.0,
    "vacinas_aplicadas_mes": 2840,
    "vacinas_aplicadas_ano": 28420,
    "criancas_menores_1_vacinadas_pct": 88.4,
    "multivacinacao_ultima_campanha_pct": 78.4,
    "doses_perdidas_pct": 4.8,
    "meta_perdas_pct": 3.0,
    "sala_vacina_funcionando": 6,
    "sala_vacina_total": 8,
    "cadeia_frio_status": "atencao",
    "freezer_ativo": 4,
    "freezer_necessario": 6,
    "vacinas_abaixo_meta": 4,
    "status_cobertura": "atencao",
    "status_cadeia_frio": "atencao",
    "campanhas_realizadas_ano": 3,
}

_COBERTURAS = [
    {"vacina": "BCG",                       "publico": "RN",        "aplicadas": 284, "populacao_alvo": 320, "cobertura_pct": 88.8, "meta_pct": 90.0,  "status": "atencao"},
    {"vacina": "Pentavalente (DTP/Hib/HB)", "publico": "<1 ano",    "aplicadas": 768, "populacao_alvo": 960, "cobertura_pct": 80.0, "meta_pct": 95.0,  "status": "critico"},
    {"vacina": "VIP (Poliomielite injet.)", "publico": "<1 ano",    "aplicadas": 816, "populacao_alvo": 960, "cobertura_pct": 85.0, "meta_pct": 95.0,  "status": "atencao"},
    {"vacina": "VOP (oral)",                "publico": "<5 anos",   "aplicadas": 284, "populacao_alvo": 320, "cobertura_pct": 88.8, "meta_pct": 95.0,  "status": "atencao"},
    {"vacina": "Rotavírus humano",          "publico": "2-7 meses", "aplicadas": 564, "populacao_alvo": 640, "cobertura_pct": 88.1, "meta_pct": 95.0,  "status": "atencao"},
    {"vacina": "Pneumocócica 10v",          "publico": "<2 anos",   "aplicadas": 848, "populacao_alvo": 960, "cobertura_pct": 88.3, "meta_pct": 95.0,  "status": "atencao"},
    {"vacina": "Meningocócica C",           "publico": "3-12 meses","aplicadas": 752, "populacao_alvo": 960, "cobertura_pct": 78.3, "meta_pct": 95.0,  "status": "critico"},
    {"vacina": "Febre Amarela",             "publico": "≥9 meses",  "aplicadas": 984, "populacao_alvo": 1200,"cobertura_pct": 82.0, "meta_pct": 95.0,  "status": "critico"},
    {"vacina": "Tríplice Viral (SCR)",      "publico": "12 meses",  "aplicadas": 292, "populacao_alvo": 320, "cobertura_pct": 91.3, "meta_pct": 95.0,  "status": "atencao"},
    {"vacina": "Varicela",                  "publico": "15 meses",  "aplicadas": 284, "populacao_alvo": 320, "cobertura_pct": 88.8, "meta_pct": 95.0,  "status": "atencao"},
    {"vacina": "HPV quadrivalente",         "publico": "9-14a (F)", "aplicadas": 684, "populacao_alvo": 1284,"cobertura_pct": 53.3, "meta_pct": 80.0,  "status": "critico"},
    {"vacina": "dT adulto",                 "publico": "Gestantes", "aplicadas": 212, "populacao_alvo": 320, "cobertura_pct": 66.3, "meta_pct": 95.0,  "status": "critico"},
    {"vacina": "Influenza",                 "publico": "Grupos alvo","aplicadas": 1284,"populacao_alvo": 1800,"cobertura_pct": 71.3, "meta_pct": 90.0,  "status": "critico"},
    {"vacina": "Covid-19 (reforço)",        "publico": ">60a",      "aplicadas": 648, "populacao_alvo": 1200,"cobertura_pct": 54.0, "meta_pct": 90.0,  "status": "critico"},
]

_HISTORICO = [
    {"mes": "Jan/25", "aplicadas": 2284, "perdas_pct": 5.2, "cobertura_inf_pct": 84.2, "febre_amarela_pct": 80.4},
    {"mes": "Fev/25", "aplicadas": 2484, "perdas_pct": 4.8, "cobertura_inf_pct": 84.8, "febre_amarela_pct": 81.2},
    {"mes": "Mar/25", "aplicadas": 2684, "perdas_pct": 4.4, "cobertura_inf_pct": 86.2, "febre_amarela_pct": 81.8},
    {"mes": "Abr/25", "aplicadas": 2984, "perdas_pct": 4.2, "cobertura_inf_pct": 86.8, "febre_amarela_pct": 81.6},
    {"mes": "Mai/25", "aplicadas": 2684, "perdas_pct": 5.0, "cobertura_inf_pct": 87.2, "febre_amarela_pct": 81.4},
    {"mes": "Jun/25", "aplicadas": 2840, "perdas_pct": 4.8, "cobertura_inf_pct": 84.2, "febre_amarela_pct": 82.0},
]

_INDICADORES = [
    {"indicador": "Cobertura vacinal geral",         "valor": 84.2, "meta": 95.0,  "unidade": "%",   "status": "atencao", "observacao": "10,8 pp abaixo da meta — Pentavalente e Meningocócica C são os pontos críticos. 2 salas de vacina fechadas por falta de pessoal"},
    {"indicador": "Cobertura Febre Amarela",         "valor": 82.0, "meta": 95.0,  "unidade": "%",   "status": "critico", "observacao": "Endêmica na região Amazônica — cobertura < 95% mantém risco de surto. Apuí está em zona de transmissão silvestre ativa"},
    {"indicador": "Cobertura HPV (meninas 9-14a)",   "valor": 53.3, "meta": 80.0,  "unidade": "%",   "status": "critico", "observacao": "53,3% vs meta 80% — esquema de 2 doses com intervalo de 6 meses. Perda de seguimento é a principal causa de não conclusão"},
    {"indicador": "Cobertura influenza (grupos alvo)","valor": 71.3, "meta": 90.0, "unidade": "%",   "status": "critico", "observacao": "71,3% — 18,7 pp abaixo da meta. Gestantes (66,3%) e idosos (54% Covid) são os mais vulneráveis"},
    {"indicador": "Perdas de doses",                 "valor": 4.8,  "meta": 3.0,   "unidade": "%",   "status": "atencao", "observacao": "Acima da meta de 3% — falha na cadeia de frio (2 freezers insuficientes) e abertura de frascos sem completar doses"},
    {"indicador": "Salas de vacina em funcionamento","valor": 6,    "meta": 8,     "unidade": "salas","status": "atencao", "observacao": "2 salas fechadas por falta de vacinador — UBS Ramal Acará e UBS Rural prejudicam cobertura ribeirinha e rural"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/coberturas")
def coberturas():
    return _COBERTURAS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
