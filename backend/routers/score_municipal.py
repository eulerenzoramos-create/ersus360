from fastapi import APIRouter

router = APIRouter(prefix="/api/score-municipal", tags=["score_municipal"])

_DIMENSOES = [
    {"dimensao": "Atenção Primária à Saúde",     "peso": 25, "score": 52.4, "cor": "#2563eb",
     "subdimensoes": [
         {"item": "Cobertura ESF", "valor": 72.0, "meta": 95.0, "score": 44.4},
         {"item": "Previne Brasil (IFP)", "valor": 0.52, "meta": 1.0, "score": 52.0},
         {"item": "ICSAP (inverso)", "valor": 18.4, "meta": 8.0, "score": 43.5},
         {"item": "Produção APS/hab", "valor": 3.2, "meta": 5.0, "score": 64.0},
     ]},
    {"dimensao": "Vigilância em Saúde",           "peso": 15, "score": 61.2, "cor": "#7c3aed",
     "subdimensoes": [
         {"item": "Cobertura vacinal (média)", "valor": 83.4, "meta": 95.0, "score": 70.5},
         {"item": "Encerramento SINAN ≤60d", "valor": 79.4, "meta": 95.0, "score": 63.5},
         {"item": "Controle malária (IPA)", "valor": 49.7, "meta": 10.0, "score": 20.1},
         {"item": "Saneamento / água tratada", "valor": 75.3, "meta": 99.0, "score": 76.1},
     ]},
    {"dimensao": "Saúde da Mulher e Criança",     "peso": 15, "score": 48.6, "cor": "#db2777",
     "subdimensoes": [
         {"item": "7+ consultas pré-natal", "valor": 58.4, "meta": 90.0, "score": 44.2},
         {"item": "TMI (<5a)", "valor": 16.2, "meta": 12.0, "score": 42.6},
         {"item": "Papanicolau cobertura", "valor": 52.3, "meta": 80.0, "score": 55.4},
         {"item": "TAN cobertura", "valor": 86.4, "meta": 95.0, "score": 83.2},
     ]},
    {"dimensao": "Doenças Crônicas / DCNT",       "peso": 12, "score": 44.8, "cor": "#d97706",
     "subdimensoes": [
         {"item": "HAS controlada", "valor": 57.1, "meta": 90.0, "score": 47.4},
         {"item": "DM controlada", "valor": 54.1, "meta": 85.0, "score": 46.3},
         {"item": "Rastreio câncer colo/mama", "valor": 47.1, "meta": 80.0, "score": 42.5},
         {"item": "Obesidade prevalência (inv.)", "valor": 26.7, "meta": 15.0, "score": 43.8},
     ]},
    {"dimensao": "Saúde Mental",                  "peso": 8,  "score": 38.4, "cor": "#4f46e5",
     "subdimensoes": [
         {"item": "CAPS superlotação (inverso)", "valor": 108.0, "meta": 80.0, "score": 26.0},
         {"item": "Tentativas suicídio/mês (inv.)", "valor": 7, "meta": 2, "score": 28.6},
         {"item": "Reinternação psiquiátrica (inv.)", "valor": 30.4, "meta": 15.0, "score": 49.3},
         {"item": "Leitos psiquiátricos SUS", "valor": 0, "meta": 10, "score": 0.0},
     ]},
    {"dimensao": "Financeiro / Gestão FMS",       "peso": 10, "score": 57.8, "cor": "#0891b2",
     "subdimensoes": [
         {"item": "Aplicação mínima (≥15%)", "valor": 126.3, "meta": 15.0, "score": 100.0},
         {"item": "Pessoal/despesa (≤60%)", "valor": 62.4, "meta": 60.0, "score": 48.4},
         {"item": "Execução blocos SUS", "valor": 85.8, "meta": 95.0, "score": 84.2},
         {"item": "Exec. emendas parlam.", "valor": 57.0, "meta": 90.0, "score": 35.0},
     ]},
    {"dimensao": "Saúde Digital / e-SUS",         "peso": 8,  "score": 62.4, "cor": "#16a34a",
     "subdimensoes": [
         {"item": "Adesão PEC", "valor": 87.5, "meta": 100.0, "score": 87.5},
         {"item": "Cobertura prontuário", "valor": 65.9, "meta": 90.0, "score": 57.7},
         {"item": "RNDS integradas", "valor": 25.0, "meta": 100.0, "score": 25.0},
         {"item": "Transmissão SISAB", "valor": 91.7, "meta": 97.0, "score": 80.0},
     ]},
    {"dimensao": "Recursos Humanos",              "peso": 7,  "score": 41.2, "cor": "#dc2626",
     "subdimensoes": [
         {"item": "Médicos/1000 hab.", "valor": 0.42, "meta": 1.0, "score": 42.0},
         {"item": "Absenteísmo (inv.)", "valor": 4.2, "meta": 2.0, "score": 47.6},
         {"item": "Folha/receita (inv.)", "valor": 62.4, "meta": 60.0, "score": 48.4},
         {"item": "ACS cobertura", "valor": 87.5, "meta": 100.0, "score": 87.5},
     ]},
]

_HISTORICO_SCORE = [
    {"ano": 2022, "score_geral": 38.2, "aps": 44.1, "vigilancia": 52.4, "mulher_crianca": 40.2, "dcnt": 36.8},
    {"ano": 2023, "score_geral": 41.8, "aps": 47.2, "vigilancia": 55.8, "mulher_crianca": 43.6, "dcnt": 39.4},
    {"ano": 2024, "score_geral": 46.4, "aps": 50.1, "vigilancia": 58.4, "mulher_crianca": 46.8, "dcnt": 42.1},
    {"ano": 2025, "score_geral": 50.2, "aps": 52.4, "vigilancia": 61.2, "mulher_crianca": 48.6, "dcnt": 44.8},
]

_COMPARATIVO_AM = {
    "municipio": "Apuí/AM",
    "score_apui": 50.2,
    "media_am": 48.6,
    "mediana_am": 46.2,
    "melhor_am": 74.8,
    "pior_am": 22.4,
    "ranking_estado": 18,
    "total_municipios_am": 62,
    "categoria": "Moderado",
}

_INDICADORES = [
    {"indicador": "Score ERSUS 360 Geral", "valor": 50.2, "meta": 70.0, "unidade": "pontos",
     "status": "atencao", "observacao": "Score moderado — acima da mediana estadual (46,2) mas distante da meta de 70 pontos"},
    {"indicador": "Pior dimensão: Saúde Mental", "valor": 38.4, "meta": 70.0, "unidade": "pontos",
     "status": "critico", "observacao": "Sem leitos psiquiátricos SUS, CAPS superlotados e suicídios em alta"},
    {"indicador": "Ranking AM", "valor": 18, "meta": None, "unidade": "º/62",
     "status": "atencao", "observacao": "18º entre 62 municípios amazonenses — posição intermediária"},
    {"indicador": "Evolução 2022→2025", "valor": 12.0, "meta": None, "unidade": "pontos",
     "status": "ok", "observacao": "Ganho de 12 pontos em 3 anos — tendência positiva sustentada"},
    {"indicador": "Dimensão financeira", "valor": 57.8, "meta": 70.0, "unidade": "pontos",
     "status": "atencao", "observacao": "Aplicação constitucional OK (100 pts) mas pessoal e emendas puxam o score para baixo"},
]


@router.get("/dashboard")
def dashboard():
    return {
        "score_geral": 50.2,
        "categoria": "Moderado",
        "ranking_am": 18,
        "total_municipios_am": 62,
        "dimensoes_avaliadas": 8,
        "dimensao_melhor": "Saúde Digital / e-SUS",
        "score_melhor": 62.4,
        "dimensao_pior": "Saúde Mental",
        "score_pior": 38.4,
        "evolucao_3anos": 12.0,
        "media_am": 48.6,
    }


@router.get("/dimensoes")
def dimensoes():
    return _DIMENSOES


@router.get("/historico")
def historico():
    return _HISTORICO_SCORE


@router.get("/comparativo")
def comparativo():
    return _COMPARATIVO_AM


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
