from fastapi import APIRouter

router = APIRouter(prefix="/api/telessaude", tags=["telessaude"])

_DASHBOARD = {
    "teleconsultas_realizadas_ano": 842,
    "teleconsultas_mes_atual": 84,
    "telediagnosticos_ano": 312,
    "ubs_com_conectividade": 6,
    "ubs_total": 8,
    "conectividade_pct": 75.0,
    "velocidade_media_mbps": 4.8,
    "meta_velocidade_mbps": 10.0,
    "especialidades_disponiveis": 12,
    "segunda_opiniao_casos_ano": 148,
    "tele_eletrocardiograma_ano": 184,
    "tele_dermatologia_casos_ano": 96,
    "satisfacao_profissional_nota": 3.8,
    "taxa_resolubilidade_pct": 68.4,
    "evitou_referencia_manaus_pct": 42.4,
    "status_conectividade": "atencao",
    "status_teleconsultas": "atencao",
}

_ESPECIALIDADES = [
    {"especialidade": "Telepsiquiatria",        "consultas_ano": 148, "resolubilidade_pct": 72.4, "tempo_resposta_dias": 3,  "disponibilidade": "2× semana", "status": "ok"},
    {"especialidade": "Teledermatologia",        "consultas_ano": 96,  "resolubilidade_pct": 78.4, "tempo_resposta_dias": 2,  "disponibilidade": "Assíncrono", "status": "ok"},
    {"especialidade": "Telecardiologia",         "consultas_ano": 184, "resolubilidade_pct": 62.4, "tempo_resposta_dias": 1,  "disponibilidade": "ECG 24h",    "status": "ok"},
    {"especialidade": "Teleonco (2ª opinião)",   "consultas_ano": 42,  "resolubilidade_pct": 48.4, "tempo_resposta_dias": 7,  "disponibilidade": "Semanal",    "status": "atencao"},
    {"especialidade": "Teleneurologia",          "consultas_ano": 64,  "resolubilidade_pct": 52.4, "tempo_resposta_dias": 5,  "disponibilidade": "Semanal",    "status": "atencao"},
    {"especialidade": "Teleendocrinologia",      "consultas_ano": 58,  "resolubilidade_pct": 58.4, "tempo_resposta_dias": 5,  "disponibilidade": "Quinzenal",  "status": "atencao"},
    {"especialidade": "Tele-infectologia",       "consultas_ano": 84,  "resolubilidade_pct": 74.4, "tempo_resposta_dias": 2,  "disponibilidade": "3× semana",  "status": "ok"},
    {"especialidade": "Telegnecologia",          "consultas_ano": 48,  "resolubilidade_pct": 64.2, "tempo_resposta_dias": 4,  "disponibilidade": "Quinzenal",  "status": "atencao"},
    {"especialidade": "Teleortopedia",           "consultas_ano": 38,  "resolubilidade_pct": 44.2, "tempo_resposta_dias": 7,  "disponibilidade": "Mensal",     "status": "critico"},
    {"especialidade": "Tele-odonto (especializ.)","consultas_ano": 22,  "resolubilidade_pct": 68.4, "tempo_resposta_dias": 5, "disponibilidade": "Quinzenal",  "status": "atencao"},
    {"especialidade": "Telenutrição",            "consultas_ano": 28,  "resolubilidade_pct": 82.4, "tempo_resposta_dias": 3,  "disponibilidade": "Semanal",    "status": "ok"},
    {"especialidade": "Telepsicologia",          "consultas_ano": 30,  "resolubilidade_pct": 76.4, "tempo_resposta_dias": 3,  "disponibilidade": "2× semana",  "status": "ok"},
]

_CONECTIVIDADE_UBS = [
    {"ubs": "UBS Central Apuí",          "conectada": True,  "velocidade_mbps": 8.4,  "tipo": "Fibra óptica",  "status": "ok"},
    {"ubs": "UBS Bairro Novo",           "conectada": True,  "velocidade_mbps": 4.8,  "tipo": "Rádio 4G",      "status": "atencao"},
    {"ubs": "UBS Zona Norte",            "conectada": True,  "velocidade_mbps": 3.2,  "tipo": "Rádio 4G",      "status": "atencao"},
    {"ubs": "UBS Zona Sul",              "conectada": True,  "velocidade_mbps": 2.8,  "tipo": "Rádio 4G",      "status": "atencao"},
    {"ubs": "UBS Agrópolis do Juma",     "conectada": True,  "velocidade_mbps": 1.2,  "tipo": "Satélite VSAT", "status": "critico"},
    {"ubs": "UBS Rio Juma (fluvial)",    "conectada": True,  "velocidade_mbps": 0.8,  "tipo": "Satélite VSAT", "status": "critico"},
    {"ubs": "UBS Aldeia Tenharim",       "conectada": False, "velocidade_mbps": 0.0,  "tipo": "Sem conexão",   "status": "critico"},
    {"ubs": "UBS Aldeia Mura",           "conectada": False, "velocidade_mbps": 0.0,  "tipo": "Sem conexão",   "status": "critico"},
]

_HISTORICO = [
    {"mes": "Jan/25", "teleconsultas": 62,  "telediag": 22, "segunda_opiniao": 11, "resolvidas_pct": 66.4},
    {"mes": "Fev/25", "teleconsultas": 68,  "telediag": 24, "segunda_opiniao": 12, "resolvidas_pct": 67.2},
    {"mes": "Mar/25", "teleconsultas": 72,  "telediag": 26, "segunda_opiniao": 12, "resolvidas_pct": 68.0},
    {"mes": "Abr/25", "teleconsultas": 78,  "telediag": 26, "segunda_opiniao": 13, "resolvidas_pct": 68.4},
    {"mes": "Mai/25", "teleconsultas": 82,  "telediag": 28, "segunda_opiniao": 14, "resolvidas_pct": 68.4},
    {"mes": "Jun/25", "teleconsultas": 84,  "telediag": 28, "segunda_opiniao": 14, "resolvidas_pct": 68.4},
]

_INDICADORES = [
    {"indicador": "UBS com conectividade adequada",      "valor": 75.0, "meta": 100.0, "unidade": "%",        "status": "atencao", "observacao": "2 UBS indígenas sem conexão — teleconsulta impossível. VSAT no Juma com 0,8 Mbps inviabiliza vídeo"},
    {"indicador": "Taxa de resolubilidade TeleSaúde",    "valor": 68.4, "meta": 80.0,  "unidade": "%",        "status": "atencao", "observacao": "31,6% dos casos ainda precisam de encaminhamento presencial — principalmente ortopedia e neurologia"},
    {"indicador": "Referências evitadas a Manaus",       "valor": 42.4, "meta": 60.0,  "unidade": "%",        "status": "atencao", "observacao": "TeleSaúde evita 42,4% das referências — economia estimada de R$ 180 mil/ano em custeio de transporte"},
    {"indicador": "Especialidades disponíveis",          "valor": 12,   "meta": 20,    "unidade": "espec.",   "status": "atencao", "observacao": "12 especialidades disponíveis via TeleSaúde — ortopedia e urologia apenas mensal: cobertura insuficiente"},
    {"indicador": "Velocidade média de internet nas UBS","valor": 4.8,  "meta": 10.0,  "unidade": "Mbps",     "status": "atencao", "observacao": "4,8 Mbps médio — abaixo dos 10 Mbps recomendados pelo CFM para teleconsulta com vídeo de qualidade"},
    {"indicador": "Satisfação do profissional",          "valor": 3.8,  "meta": 4.5,   "unidade": "nota/5",   "status": "atencao", "observacao": "Queixas sobre queda de conexão durante consulta (UBS rurais) e falta de integração com prontuário e-SUS"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/especialidades")
def especialidades():
    return _ESPECIALIDADES


@router.get("/conectividade")
def conectividade():
    return _CONECTIVIDADE_UBS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
