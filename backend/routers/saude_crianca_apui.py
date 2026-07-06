from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-crianca-apui", tags=["saude_crianca_apui"])

_DASHBOARD = {
    "nascidos_vivos_ano": 284,
    "mortalidade_infantil_1k_NV": 18.4,
    "meta_mortalidade_infantil": 10.0,
    "obitos_infantis_ano": 5,
    "mortalidade_neonatal_precoce": 10.6,
    "mortalidade_neonatal_tardia": 3.5,
    "mortalidade_pos_neonatal": 4.2,
    "prematuridade_pct": 8.4,
    "baixo_peso_nascer_pct": 9.2,
    "meta_baixo_peso_pct": 8.0,
    "aleitamento_materno_exclusivo_6m_pct": 42.4,
    "meta_aleitamento_pct": 60.0,
    "desnutricao_grave_menores2_pct": 4.8,
    "meta_desnutricao_pct": 2.0,
    "cobertura_peso_monitorado_pct": 72.4,
    "meta_peso_monitorado_pct": 55.0,
    "criancas_0_9_estimativa": 5840,
    "criancas_com_caderneta_atualizada_pct": 64.2,
    "status_mortalidade": "critico",
    "status_nutricao": "critico",
    "status_aleitamento": "atencao",
}

_MORTALIDADE = [
    {"causa": "Infecções respiratórias agudas",     "obitos": 1, "pct": 20.0, "evitavel": True,  "status": "critico"},
    {"causa": "Doenças diarreicas agudas",           "obitos": 1, "pct": 20.0, "evitavel": True,  "status": "critico"},
    {"causa": "Prematuridade / BPN",                "obitos": 1, "pct": 20.0, "evitavel": True,  "status": "critico"},
    {"causa": "Malformação congênita",              "obitos": 1, "pct": 20.0, "evitavel": False, "status": "atencao"},
    {"causa": "Causas externas (afogamento)",        "obitos": 1, "pct": 20.0, "evitavel": True,  "status": "critico"},
]

_NUTRICAO = [
    {"faixa": "< 6 meses (AME)",        "total": 142, "indicador": "Aleitamento exclusivo", "resultado_pct": 42.4, "meta_pct": 60.0, "status": "atencao"},
    {"faixa": "< 2 anos (peso)",         "total": 568, "indicador": "Peso monitorado",       "resultado_pct": 72.4, "meta_pct": 55.0, "status": "ok"},
    {"faixa": "< 2 anos (desnutrição)", "total": 568, "indicador": "Desnutrição grave",      "resultado_pct": 4.8,  "meta_pct": 2.0,  "status": "critico"},
    {"faixa": "< 5 anos (baixo peso)",  "total": 1460,"indicador": "Baixo peso/idade",       "resultado_pct": 8.4,  "meta_pct": 5.0,  "status": "atencao"},
    {"faixa": "5-9 anos (excesso peso)","total": 2920,"indicador": "Sobrepeso/obesidade",    "resultado_pct": 22.4, "meta_pct": 15.0, "status": "atencao"},
]

_HISTORICO = [
    {"ano": "2022", "nascidos_vivos": 296, "obitos_inf": 7, "mi_1k_nv": 23.6, "desnutricao_pct": 5.8, "ame_pct": 38.4},
    {"ano": "2023", "nascidos_vivos": 288, "obitos_inf": 6, "mi_1k_nv": 20.8, "desnutricao_pct": 5.4, "ame_pct": 39.8},
    {"ano": "2024", "nascidos_vivos": 290, "obitos_inf": 6, "mi_1k_nv": 20.7, "desnutricao_pct": 5.2, "ame_pct": 41.2},
    {"ano": "2025", "nascidos_vivos": 284, "obitos_inf": 5, "mi_1k_nv": 18.4, "desnutricao_pct": 4.8, "ame_pct": 42.4},
]

_INDICADORES = [
    {"indicador": "Mortalidade infantil",              "valor": 18.4, "meta": 10.0, "unidade": "/1k NV", "status": "critico", "observacao": "18,4/1k NV vs meta 10 — 5 óbitos em 2025, todos com causa evitável ou possivelmente evitável. Redução de 23,6 (2022) é positiva mas insuficiente"},
    {"indicador": "Baixo peso ao nascer",              "valor": 9.2,  "meta": 8.0,  "unidade": "%",      "status": "atencao", "observacao": "9,2% vs meta 8% — pré-natal tardio e sífilis congênita são fatores diretos. Ribeirinhos têm taxa estimada 2× maior"},
    {"indicador": "Desnutrição grave < 2 anos",        "valor": 4.8,  "meta": 2.0,  "unidade": "%",      "status": "critico", "observacao": "4,8% vs meta 2% — área ribeirinha tem prevalência estimada de 12,4%. Falta de acesso à alimentação complementar de qualidade"},
    {"indicador": "Aleitamento materno exclusivo 6m",  "valor": 42.4, "meta": 60.0, "unidade": "%",      "status": "atencao", "observacao": "42,4% vs meta 60% — retorno precoce ao trabalho, falta de suporte de lactação e introdução precoce de fórmula são as causas"},
    {"indicador": "Caderneta de saúde atualizada",     "valor": 64.2, "meta": 100.0,"unidade": "%",      "status": "atencao", "observacao": "35,8% das crianças sem caderneta em dia — dificulta vigilância do D/C e identificação de atrasos no desenvolvimento"},
    {"indicador": "Mortalidade evitável (% dos óbitos)","valor": 80.0,"meta": 0.0,  "unidade": "%",      "status": "critico", "observacao": "4 de 5 óbitos infantis eram evitáveis — diarreia, IRA e afogamento são preveníveis com acesso, saneamento e educação"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/mortalidade")
def mortalidade():
    return _MORTALIDADE


@router.get("/nutricao")
def nutricao():
    return _NUTRICAO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
