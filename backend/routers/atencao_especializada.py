from fastapi import APIRouter

router = APIRouter(prefix="/api/atencao-especializada", tags=["atencao_especializada"])

_ESPECIALIDADES = [
    {"especialidade": "Clínica Médica", "profissionais": 3, "consultas_mes": 684, "lista_espera": 124,
     "tempo_espera_dias": 28, "disponibilidade": "presencial", "status": "atencao"},
    {"especialidade": "Ginecologia/Obstetrícia", "profissionais": 2, "consultas_mes": 428, "lista_espera": 86,
     "tempo_espera_dias": 34, "disponibilidade": "presencial", "status": "atencao"},
    {"especialidade": "Pediatria", "profissionais": 2, "consultas_mes": 512, "lista_espera": 64,
     "tempo_espera_dias": 21, "disponibilidade": "presencial", "status": "ok"},
    {"especialidade": "Cardiologia", "profissionais": 0, "consultas_mes": 48, "lista_espera": 218,
     "tempo_espera_dias": 94, "disponibilidade": "itinerante_mensal", "status": "critico"},
    {"especialidade": "Neurologia", "profissionais": 0, "consultas_mes": 24, "lista_espera": 312,
     "tempo_espera_dias": 148, "disponibilidade": "referencia_manaus", "status": "critico"},
    {"especialidade": "Ortopedia/Traumatologia", "profissionais": 0, "consultas_mes": 36, "lista_espera": 284,
     "tempo_espera_dias": 112, "disponibilidade": "itinerante_quinzenal", "status": "critico"},
    {"especialidade": "Dermatologia", "profissionais": 0, "consultas_mes": 18, "lista_espera": 196,
     "tempo_espera_dias": 168, "disponibilidade": "itinerante_trimestral", "status": "critico"},
    {"especialidade": "Urologia", "profissionais": 0, "consultas_mes": 12, "lista_espera": 142,
     "tempo_espera_dias": 182, "disponibilidade": "referencia_manaus", "status": "critico"},
    {"especialidade": "Endocrinologia", "profissionais": 0, "consultas_mes": 16, "lista_espera": 168,
     "tempo_espera_dias": 124, "disponibilidade": "telessaude", "status": "critico"},
    {"especialidade": "Psiquiatria", "profissionais": 1, "consultas_mes": 84, "lista_espera": 98,
     "tempo_espera_dias": 48, "disponibilidade": "presencial", "status": "atencao"},
]

_EXAMES_MAC = [
    {"exame": "Tomografia Computadorizada", "realizados_mes": 42, "lista_espera": 184,
     "tempo_espera_dias": 62, "local": "Referência Humaitá/Manaus", "status": "critico"},
    {"exame": "Ressonância Magnética", "realizados_mes": 18, "lista_espera": 248,
     "tempo_espera_dias": 94, "local": "Referência Manaus", "status": "critico"},
    {"exame": "Ecocardiograma", "realizados_mes": 24, "lista_espera": 118,
     "tempo_espera_dias": 48, "local": "Itinerante mensal", "status": "critico"},
    {"exame": "Endoscopia Digestiva", "realizados_mes": 32, "lista_espera": 86,
     "tempo_espera_dias": 38, "local": "Itinerante quinzenal", "status": "atencao"},
    {"exame": "Colonoscopia", "realizados_mes": 8, "lista_espera": 64,
     "tempo_espera_dias": 58, "local": "Referência Humaitá", "status": "critico"},
    {"exame": "Espirometria", "realizados_mes": 28, "lista_espera": 42,
     "tempo_espera_dias": 22, "local": "Hospital Municipal", "status": "atencao"},
    {"exame": "Holter 24h", "realizados_mes": 14, "lista_espera": 78,
     "tempo_espera_dias": 34, "local": "Itinerante mensal", "status": "atencao"},
]

_HISTORICO = [
    {"mes": "Jan", "consultas_especializadas": 1624, "exames_mac": 148, "referencias_manaus": 84, "contrareferencias_pct": 42.8},
    {"mes": "Fev", "consultas_especializadas": 1548, "exames_mac": 136, "referencias_manaus": 78, "contrareferencias_pct": 44.9},
    {"mes": "Mar", "consultas_especializadas": 1712, "exames_mac": 162, "referencias_manaus": 96, "contrareferencias_pct": 41.7},
    {"mes": "Abr", "consultas_especializadas": 1648, "exames_mac": 154, "referencias_manaus": 88, "contrareferencias_pct": 43.2},
    {"mes": "Mai", "consultas_especializadas": 1784, "exames_mac": 168, "referencias_manaus": 102, "contrareferencias_pct": 40.2},
    {"mes": "Jun", "consultas_especializadas": 1862, "exames_mac": 166, "referencias_manaus": 98, "contrareferencias_pct": 38.8},
]

_INDICADORES = [
    {"indicador": "Especialidades com presença local", "valor": 4, "meta": 10, "unidade": "especialidades",
     "status": "critico", "observacao": "Apenas Clínica Médica, Gineco, Pediatria e Psiquiatria com profissional fixo"},
    {"indicador": "Espera neurologia", "valor": 148, "meta": 30, "unidade": "dias",
     "status": "critico", "observacao": "148 dias de espera — única via é referência Manaus (14h de distância)"},
    {"indicador": "Espera ortopedia", "valor": 112, "meta": 30, "unidade": "dias",
     "status": "critico", "observacao": "Itinerante quinzenal insuficiente para 284 pacientes em espera"},
    {"indicador": "Contrarreferência (retorno à APS)", "valor": 38.8, "meta": 80.0, "unidade": "%",
     "status": "critico", "observacao": "61% dos pacientes especializados sem contrarreferência — fragmentação do cuidado"},
    {"indicador": "Referências a Manaus/mês", "valor": 98, "meta": None, "unidade": "pacientes",
     "status": "critico", "observacao": "98 pacientes/mês viajam a Manaus — custo logístico estimado R$ 196k/mês"},
    {"indicador": "Policlínica municipal", "valor": 0, "meta": 1, "unidade": "unidades",
     "status": "critico", "observacao": "Sem estrutura de policlínica — atenção especializada pulverizada e sem coordenação"},
]


@router.get("/dashboard")
def dashboard():
    return {
        "especialidades_disponiveis": 10,
        "especialidades_presencial": 4,
        "especialidades_criticas": 6,
        "consultas_especializadas_mes": 1862,
        "total_lista_espera": 1892,
        "exames_mac_mes": 166,
        "referencias_manaus_mes": 98,
        "contrareferencia_pct": 38.8,
        "policlinica": False,
    }


@router.get("/especialidades")
def especialidades():
    return _ESPECIALIDADES


@router.get("/exames-mac")
def exames_mac():
    return _EXAMES_MAC


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
