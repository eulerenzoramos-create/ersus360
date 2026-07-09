from fastapi import APIRouter

router = APIRouter(prefix="/api/visa-municipal-apui", tags=["visa_municipal_apui"])

_DASHBOARD = {
    "estabelecimentos_cadastrados": 284,
    "estabelecimentos_regulares":   198,
    "estabelecimentos_irregulares":  48,
    "estabelecimentos_sem_licenca":  38,
    "inspecoes_realizadas_ano":     312,
    "meta_inspecoes_ano":           360,
    "autos_infracao_ano":            42,
    "interdictions_ano":              8,
    "multas_valor_r":             24800.0,
    "reclamacoes_ouvidoria_ano":      64,
    "amostras_coletadas_ano":        148,
    "amostras_irregulares_pct":      12.8,
    "cobertura_inspecao_pct":        69.7,
    "status_cobertura":           "atencao",
    "status_irregularidades":     "atencao",
}

_ESTABELECIMENTOS_TIPO = [
    {"tipo": "Alimentação / Manipulação",    "total": 84,  "regulares": 58, "irregulares": 18, "sem_licenca": 8,  "risco": "alto",   "status": "atencao"},
    {"tipo": "Farmácias e Drogarias",        "total": 12,  "regulares": 11, "irregulares": 1,  "sem_licenca": 0,  "risco": "alto",   "status": "ok"},
    {"tipo": "Serviços de Saúde (privado)",  "total": 28,  "regulares": 22, "irregulares": 4,  "sem_licenca": 2,  "risco": "alto",   "status": "atencao"},
    {"tipo": "Cosméticos / Estética",        "total": 38,  "regulares": 24, "irregulares": 10, "sem_licenca": 4,  "risco": "médio",  "status": "atencao"},
    {"tipo": "Saneantes / Produtos de Limpeza","total": 18,"regulares": 14, "irregulares": 3,  "sem_licenca": 1,  "risco": "médio",  "status": "ok"},
    {"tipo": "Cemitérios / Funerárias",      "total": 4,   "regulares": 3,  "irregulares": 1,  "sem_licenca": 0,  "risco": "médio",  "status": "ok"},
    {"tipo": "Abatedouros / Frigoríficos",   "total": 6,   "regulares": 2,  "irregulares": 4,  "sem_licenca": 0,  "risco": "alto",   "status": "critico"},
    {"tipo": "Água Mineral / Envasada",      "total": 2,   "regulares": 2,  "irregulares": 0,  "sem_licenca": 0,  "risco": "alto",   "status": "ok"},
    {"tipo": "Outros",                       "total": 92,  "regulares": 62, "irregulares": 7,  "sem_licenca": 23, "risco": "baixo",  "status": "atencao"},
]

_INSPECOES = [
    {"mes": "Jan/25", "realizadas": 22, "meta": 30, "irregularidades": 8,  "autos": 3, "interditions": 0},
    {"mes": "Fev/25", "realizadas": 24, "meta": 30, "irregularidades": 9,  "autos": 4, "interditions": 1},
    {"mes": "Mar/25", "realizadas": 28, "meta": 30, "irregularidades": 10, "autos": 4, "interditions": 1},
    {"mes": "Abr/25", "realizadas": 26, "meta": 30, "irregularidades": 7,  "autos": 3, "interditions": 2},
    {"mes": "Mai/25", "realizadas": 30, "meta": 30, "irregularidades": 12, "autos": 5, "interditions": 2},
    {"mes": "Jun/25", "realizadas": 28, "meta": 30, "irregularidades": 9,  "autos": 4, "interditions": 2},
]

_ALERTAS_PRODUTOS = [
    {"produto": "Agrotóxico — Glifosato (uso urbano irregular)", "risco": "alto",   "acao": "Auto de infração + notificação IBAMA", "status": "em_apuracao"},
    {"produto": "Açaí in natura — coliformes termotolerantes",   "risco": "alto",   "acao": "Interdição lote + notificação LACEN",  "status": "resolvido"},
    {"produto": "Saneante clandestino (lavanderia)",             "risco": "médio",  "acao": "Apreensão + multa R$ 2.400",          "status": "resolvido"},
    {"produto": "Cosméticos sem registro ANVISA (salão)",        "risco": "médio",  "acao": "Notificação + prazo 30 dias",         "status": "em_apuracao"},
    {"produto": "Medicamento vencido (farmácia popular)",        "risco": "alto",   "acao": "Apreensão + descarte + multa",        "status": "resolvido"},
    {"produto": "Peixe refrigerado — temperatura inadequada",    "risco": "alto",   "acao": "Interdição produto + orientação",     "status": "em_apuracao"},
]

_INDICADORES = [
    {"indicador": "Cobertura de inspeções",             "valor": 69.7, "meta": 100.0, "unidade": "%",   "status": "atencao", "observacao": "312/360 inspeções programadas realizadas — déficit de vigilância por equipe reduzida"},
    {"indicador": "Estabelecimentos irregulares",       "valor": 16.9, "meta": 5.0,   "unidade": "%",   "status": "atencao", "observacao": "48/284 estabelecimentos com irregularidades — alimentação e abatedouros são prioridade"},
    {"indicador": "Estabelecimentos sem licença",       "valor": 13.4, "meta": 0.0,   "unidade": "%",   "status": "atencao", "observacao": "38 estabelecimentos operando sem Licença Sanitária — alto risco à saúde pública"},
    {"indicador": "Amostras irregulares (alimentos)",   "valor": 12.8, "meta": 5.0,   "unidade": "%",   "status": "atencao", "observacao": "12,8% das amostras analisadas com inconformidade — açaí e carnes principais grupos"},
    {"indicador": "Abatedouros — regularidade",         "valor": 33.3, "meta": 100.0, "unidade": "%",   "status": "critico", "observacao": "Apenas 2/6 abatedouros regulares — alto risco de DTAs e zoonoses transmitidas por alimentos"},
    {"indicador": "Tempo médio resolução notificação",  "valor": 28,   "meta": 15,    "unidade": "dias","status": "atencao", "observacao": "28 dias vs meta 15 — equipe VISA com apenas 2 técnicos para município de 24.892 hab."},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/estabelecimentos")
def estabelecimentos():
    return _ESTABELECIMENTOS_TIPO


@router.get("/inspecoes")
def inspecoes():
    return _INSPECOES


@router.get("/alertas-produtos")
def alertas_produtos():
    return _ALERTAS_PRODUTOS


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
