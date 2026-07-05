from fastapi import APIRouter

router = APIRouter(prefix="/api/imunizacao", tags=["imunizacao"])

_VACINAS = [
    {"vacina": "BCG (ao nascer)", "doses_aplicadas": 148, "cobertura_pct": 89.7, "meta_pct": 90.0, "status": "atencao",
     "publico_alvo": "Recém-nascidos", "homogeneidade_pct": 78.4},
    {"vacina": "Hepatite B (ao nascer)", "doses_aplicadas": 152, "cobertura_pct": 92.1, "meta_pct": 90.0, "status": "ok",
     "publico_alvo": "Recém-nascidos", "homogeneidade_pct": 85.2},
    {"vacina": "Penta (DTP+Hib+HepB)", "doses_aplicadas": 412, "cobertura_pct": 83.4, "meta_pct": 95.0, "status": "critico",
     "publico_alvo": "2,4,6 meses", "homogeneidade_pct": 62.1},
    {"vacina": "VIP (Poliomielite)", "doses_aplicadas": 408, "cobertura_pct": 82.6, "meta_pct": 95.0, "status": "critico",
     "publico_alvo": "2,4,6 meses", "homogeneidade_pct": 60.8},
    {"vacina": "Pneumocócica 10V", "doses_aplicadas": 394, "cobertura_pct": 79.8, "meta_pct": 95.0, "status": "critico",
     "publico_alvo": "2,4 meses + reforço", "homogeneidade_pct": 58.3},
    {"vacina": "Rotavírus (VORH)", "doses_aplicadas": 376, "cobertura_pct": 76.2, "meta_pct": 95.0, "status": "critico",
     "publico_alvo": "2,4 meses", "homogeneidade_pct": 54.6},
    {"vacina": "Meningocócica C", "doses_aplicadas": 368, "cobertura_pct": 74.5, "meta_pct": 95.0, "status": "critico",
     "publico_alvo": "3,5 meses + reforço", "homogeneidade_pct": 52.1},
    {"vacina": "Febre Amarela", "doses_aplicadas": 1842, "cobertura_pct": 91.2, "meta_pct": 95.0, "status": "atencao",
     "publico_alvo": "9 meses – 59 anos", "homogeneidade_pct": 84.7},
    {"vacina": "Tríplice Viral (MMR)", "doses_aplicadas": 628, "cobertura_pct": 86.4, "meta_pct": 95.0, "status": "critico",
     "publico_alvo": "12–15 meses + reforço", "homogeneidade_pct": 71.2},
    {"vacina": "Varicela (SCRV)", "doses_aplicadas": 314, "cobertura_pct": 84.1, "meta_pct": 95.0, "status": "critico",
     "publico_alvo": "15 meses", "homogeneidade_pct": 69.8},
    {"vacina": "HPV Quadrivalente", "doses_aplicadas": 482, "cobertura_pct": 61.8, "meta_pct": 80.0, "status": "critico",
     "publico_alvo": "9–14 anos (meninas/meninos)", "homogeneidade_pct": 48.3},
    {"vacina": "Influenza (campanha)", "doses_aplicadas": 3214, "cobertura_pct": 78.3, "meta_pct": 90.0, "status": "critico",
     "publico_alvo": "Grupos prioritários", "homogeneidade_pct": 72.4},
]

_CAMERA_FRIA = [
    {"equipamento": "Câmara Fria Central (UBS Central)", "temperatura_atual": 4.2, "faixa_ideal": "2–8°C",
     "ultima_verificacao_horas": 2, "status_equipamento": "ok", "alarme_ativo": False},
    {"equipamento": "Refrigerador Vacinas (UBS Novo Aripuanã)", "temperatura_atual": 7.8, "faixa_ideal": "2–8°C",
     "ultima_verificacao_horas": 4, "status_equipamento": "atencao", "alarme_ativo": False},
    {"equipamento": "Refrigerador Vacinas (UBSF Juma)", "temperatura_atual": 9.4, "faixa_ideal": "2–8°C",
     "ultima_verificacao_horas": 8, "status_equipamento": "critico", "alarme_ativo": True},
    {"equipamento": "Caixa Térmica Transporte", "temperatura_atual": 5.1, "faixa_ideal": "2–8°C",
     "ultima_verificacao_horas": 1, "status_equipamento": "ok", "alarme_ativo": False},
]

_HISTORICO = [
    {"mes": "Jan", "doses_total": 1842, "cobertura_media": 82.4, "eventos_adversos": 3, "perdas_pct": 4.2},
    {"mes": "Fev", "doses_total": 1764, "cobertura_media": 80.1, "eventos_adversos": 2, "perdas_pct": 3.8},
    {"mes": "Mar", "doses_total": 2018, "cobertura_media": 83.6, "eventos_adversos": 4, "perdas_pct": 5.1},
    {"mes": "Abr", "doses_total": 1934, "cobertura_media": 82.9, "eventos_adversos": 1, "perdas_pct": 4.4},
    {"mes": "Mai", "doses_total": 2104, "cobertura_media": 84.2, "eventos_adversos": 3, "perdas_pct": 3.9},
    {"mes": "Jun", "doses_total": 1988, "cobertura_media": 83.1, "eventos_adversos": 2, "perdas_pct": 4.1},
]

_INDICADORES = [
    {"indicador": "Cobertura Penta (DTP+Hib+HepB)", "valor": 83.4, "meta": 95.0, "unidade": "%",
     "status": "critico", "observacao": "11,6 pp abaixo da meta — risco de surtos de coqueluche"},
    {"indicador": "Cobertura VIP (Pólio)", "valor": 82.6, "meta": 95.0, "unidade": "%",
     "status": "critico", "observacao": "Zona de risco para reintrodução do poliovírus"},
    {"indicador": "Cobertura Febre Amarela", "valor": 91.2, "meta": 95.0, "unidade": "%",
     "status": "atencao", "observacao": "Município em área endêmica — meta 95% crítica"},
    {"indicador": "Cobertura HPV (meninas 9-14)", "valor": 61.8, "meta": 80.0, "unidade": "%",
     "status": "critico", "observacao": "18,2 pp abaixo da meta — estratégia escolar necessária"},
    {"indicador": "Homogeneidade municipal <95%", "valor": 8, "meta": 0, "unidade": "vacinas",
     "status": "critico", "observacao": "8 das 12 vacinas monitoradas com homogeneidade <95%"},
    {"indicador": "Temperatura câmara fria adequada", "valor": 75.0, "meta": 100.0, "unidade": "%",
     "status": "critico", "observacao": "1 refrigerador com temperatura >8°C — risco de perda"},
]


@router.get("/dashboard")
def dashboard():
    return {
        "doses_aplicadas_mes": 1988,
        "vacinas_monitoradas": 12,
        "vacinas_meta_atingida": 2,
        "cobertura_media_pct": 83.1,
        "vacina_menor_cobertura": "HPV Quadrivalente (61.8%)",
        "equipamentos_rede_frio": 4,
        "equipamentos_criticos": 1,
        "eventos_adversos_mes": 2,
        "perdas_doses_pct": 4.1,
        "campanha_influenza_pct": 78.3,
    }


@router.get("/vacinas")
def vacinas():
    return _VACINAS


@router.get("/rede-frio")
def rede_frio():
    return _CAMERA_FRIA


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
