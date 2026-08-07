from fastapi import APIRouter
from functools import lru_cache
router = APIRouter(prefix="/api/cadeia-frio-apui", tags=["Cadeia de Frio Apuí"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "equipamentos_refrigeracao_total": 12,
        "equipamentos_funcionando": 10,
        "equipamentos_manutencao": 2,
        "temperatura_media_central_c": 4.8,
        "temperatura_meta_min_c": 2.0,
        "temperatura_meta_max_c": 8.0,
        "doses_perdidas_2025": 284,
        "doses_aplicadas_2025": 18420,
        "perda_pct": 1.52,
        "meta_perda_pct": 2.0,
        "ubs_com_refrigerador_adequado": 6,
        "ubs_total": 9,
        "ubs_sem_registro_temperatura_pct": 33.3,
        "sala_vacinacao_ubs_adequada_pct": 66.7,
        "cobertura_dtpa_gestantes_pct": 68.4,
        "cobertura_polio_menores_5_pct": 84.2,
        "cobertura_triplice_viral_pct": 91.8,
        "cobertura_hepatite_b_adulto_pct": 54.2,
        "cobertura_covid_atualizado_pct": 38.4,
        "status_temperatura": "atencao",
        "status_cobertura_vacinal": "atencao",
        "status_equipamentos": "atencao",
    }


@lru_cache(maxsize=1)
def _EQUIPAMENTOS():
    return [
        {"id":"REFR-01","local":"Central de Vacinas — SMS","modelo":"Consul CRA28","temp_atual_c":4.8,"status":"ok",       "ultima_calibragem":"2025-02-10","data_aquisicao":"2021-03-15","garantia":"2026-03-15","obs":""},
        {"id":"REFR-02","local":"UBS Centro",               "modelo":"Esmaltec BCR120","temp_atual_c":7.2,"status":"atencao","ultima_calibragem":"2024-08-20","data_aquisicao":"2019-06-01","garantia":"Vencida",    "obs":"Temperatura limite superior — necessita regulagem"},
        {"id":"REFR-03","local":"UBS Bairro Novo",          "modelo":"Esmaltec BCR120","temp_atual_c":5.1,"status":"ok",    "ultima_calibragem":"2025-01-15","data_aquisicao":"2022-04-10","garantia":"2027-04-10","obs":""},
        {"id":"REFR-04","local":"UBS Cohab I",              "modelo":"Consul CRA28",  "temp_atual_c":None,"status":"manutencao","ultima_calibragem":"2024-07-01","data_aquisicao":"2020-01-20","garantia":"Vencida",  "obs":"Compressor queimado — sem previsão de conserto"},
        {"id":"REFR-05","local":"UBS Cohab II",             "modelo":"Esmaltec BCR120","temp_atual_c":5.6,"status":"ok",    "ultima_calibragem":"2025-03-05","data_aquisicao":"2023-02-18","garantia":"2028-02-18","obs":""},
        {"id":"REFR-06","local":"PSF Rural I (Linha 8)",    "modelo":"Consul CRA28",  "temp_atual_c":8.4,"status":"critico","ultima_calibragem":"2024-04-12","data_aquisicao":"2018-09-01","garantia":"Vencida",    "obs":"Temperatura acima do limite — vacinas possivelmente comprometidas"},
        {"id":"REFR-07","local":"PSF Rural II (Vila Progresso)","modelo":"Menor Porte","temp_atual_c":5.4,"status":"ok",   "ultima_calibragem":"2024-11-20","data_aquisicao":"2022-06-30","garantia":"2027-06-30","obs":""},
        {"id":"REFR-08","local":"UBS Esperança",            "modelo":"Esmaltec BCR120","temp_atual_c":4.2,"status":"ok",   "ultima_calibragem":"2025-04-18","data_aquisicao":"2023-08-14","garantia":"2028-08-14","obs":""},
        {"id":"REFR-09","local":"PSF Ribeirinho (barco)",   "modelo":"Isopor c/ gelo reutilizável","temp_atual_c":None,"status":"atencao","ultima_calibragem":"N/A","data_aquisicao":"N/A","garantia":"N/A","obs":"Sem equipamento fixo — transporte por caixa isotérmica a cada 15 dias"},
        {"id":"REFR-10","local":"UPS Margem Esquerda",      "modelo":"Consul CRA28",  "temp_atual_c":6.1,"status":"ok",   "ultima_calibragem":"2025-02-28","data_aquisicao":"2021-11-10","garantia":"2026-11-10","obs":""},
        {"id":"REFR-11","local":"UBS Garimpo (Apoio)",      "modelo":"Consul CRA28",  "temp_atual_c":None,"status":"manutencao","ultima_calibragem":"2024-03-14","data_aquisicao":"2019-04-22","garantia":"Vencida",  "obs":"Em manutenção há 48 dias — vacinação suspensa no local"},
        {"id":"REFR-12","local":"Central — Câmara Fria 2",  "modelo":"Câmara ≥ 400L", "temp_atual_c":3.8,"status":"ok",  "ultima_calibragem":"2025-05-01","data_aquisicao":"2020-07-08","garantia":"2025-07-08","obs":"Garantia vencendo em jul/2025"},
    ]


@lru_cache(maxsize=1)
def _COBERTURAS():
    return [
        {"vacina":"BCG",                     "publico":"Recém-nascidos",   "aplicadas_2025":312,"meta":384,"cobertura_pct":81.3,"status":"atencao"},
        {"vacina":"Hepatite B (RN)",         "publico":"Recém-nascidos",   "aplicadas_2025":298,"meta":384,"cobertura_pct":77.6,"status":"atencao"},
        {"vacina":"Pentavalente (3ª dose)",  "publico":"< 1 ano",          "aplicadas_2025":284,"meta":346,"cobertura_pct":82.1,"status":"atencao"},
        {"vacina":"VIP — Inativada Polio",   "publico":"< 1 ano",          "aplicadas_2025":281,"meta":346,"cobertura_pct":81.2,"status":"atencao"},
        {"vacina":"VOP — Polio oral",        "publico":"< 5 anos",         "aplicadas_2025":2184,"meta":2594,"cobertura_pct":84.2,"status":"atencao"},
        {"vacina":"Rotavírus (2ª dose)",     "publico":"< 1 ano",          "aplicadas_2025":264,"meta":346,"cobertura_pct":76.3,"status":"atencao"},
        {"vacina":"Tríplice Viral (D1)",     "publico":"12 meses",         "aplicadas_2025":318,"meta":346,"cobertura_pct":91.8,"status":"ok"},
        {"vacina":"Tríplice Viral (D2)",     "publico":"15 meses",         "aplicadas_2025":284,"meta":346,"cobertura_pct":82.1,"status":"atencao"},
        {"vacina":"Varicela",                "publico":"15 meses",         "aplicadas_2025":278,"meta":346,"cobertura_pct":80.3,"status":"atencao"},
        {"vacina":"dT adulto",               "publico":"Adultos",          "aplicadas_2025":1248,"meta":1850,"cobertura_pct":67.5,"status":"atencao"},
        {"vacina":"dTpa gestante",           "publico":"Gestantes",        "aplicadas_2025":102,"meta":149,"cobertura_pct":68.5,"status":"atencao"},
        {"vacina":"Influenza",               "publico":"Grupos prioritários","aplicadas_2025":3284,"meta":4920,"cobertura_pct":66.7,"status":"atencao"},
        {"vacina":"COVID-19 (atualizado)",   "publico":"Todos ≥ 6m",       "aplicadas_2025":9484,"meta":24700,"cobertura_pct":38.4,"status":"critico"},
        {"vacina":"Febre Amarela",           "publico":"≥ 9 meses (AM)",   "aplicadas_2025":1284,"meta":1850,"cobertura_pct":69.4,"status":"atencao"},
        {"vacina":"HPV (1ª dose)",           "publico":"9-14 anos",        "aplicadas_2025":248,"meta":412,"cobertura_pct":60.2,"status":"atencao"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano":"2022","doses_aplicadas":17284,"perda_pct":1.8,"cobertura_vop_pct":82.4,"cobertura_triplice_pct":89.2,"incidentes_temperatura":8},
        {"ano":"2023","doses_aplicadas":17840,"perda_pct":1.6,"cobertura_vop_pct":83.1,"cobertura_triplice_pct":90.4,"incidentes_temperatura":6},
        {"ano":"2024","doses_aplicadas":18124,"perda_pct":1.7,"cobertura_vop_pct":83.8,"cobertura_triplice_pct":91.2,"incidentes_temperatura":5},
        {"ano":"2025","doses_aplicadas":18420,"perda_pct":1.5,"cobertura_vop_pct":84.2,"cobertura_triplice_pct":91.8,"incidentes_temperatura":4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador":"Equipamentos com Temperatura Adequada","valor":"83,3%","meta":"100%","status":"atencao","obs":"2 refrigeradores em manutenção (UBS Cohab I e Garimpo) + 1 com temperatura acima do limite (PSF Rural I). Risco de perda de lote inteiro no rural — sem gerador de backup"},
        {"indicador":"UBS com Registro de Temperatura","valor":"66,7%","meta":"100%","status":"atencao","obs":"3 UBS sem registro sistemático — responsabilidade informal, sem protocolo de monitoramento 2x ao dia"},
        {"indicador":"Cobertura Polio < 5 anos","valor":"84,2%","meta":"≥ 95%","status":"atencao","obs":"Meta de eliminação exige ≥ 95%. Municípios abaixo dessa cobertura mantêm risco de importação. Zona ribeirinha e rural com cobertura estimada 58%"},
        {"indicador":"Cobertura COVID-19 Atualizado","valor":"38,4%","meta":"≥ 70%","status":"critico","obs":"Hesitância vacinal em 2023-2024 e renovação de estoque irregular. Apenas 1 campanha anual sem busca ativa adequada"},
        {"indicador":"Cobertura dTpa Gestante","valor":"68,5%","meta":"≥ 95%","status":"atencao","obs":"31,5% das gestantes sem dose — risco de coqueluche em recém-nascidos. Vinculação pré-natal/sala de vacina não padronizada"},
        {"indicador":"Índice de Aproveitamento de Doses","valor":"98,5%","meta":"≥ 98%","status":"ok","obs":"Perda de 1,5% — dentro da meta nacional. Principais causas: falta de luz em área rural e abertura de frasco sem demanda suficiente"},
    ]


@router.get("/dashboard")
def dashboard(): return _DASHBOARD()

@router.get("/equipamentos")
def equipamentos(): return _EQUIPAMENTOS()

@router.get("/coberturas")
def coberturas(): return _COBERTURAS()

@router.get("/historico")
def historico(): return _HISTORICO()

@router.get("/indicadores")
def indicadores(): return _INDICADORES()