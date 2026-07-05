"""Saúde Mental — RAPS · CAPS · Leitos Psiquiatria · Crise · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-mental", tags=["saude_mental"])

@router.get("/dashboard")
async def dashboard():
    return {
        "usuarios_caps_ativos": 248,
        "novos_casos_mes": 28,
        "atendimentos_mes": 684,
        "caps_funcionando": 1,
        "caps_tipo": "CAPS I",
        "leitos_psiquiatria_hospital": 0,
        "crise_atendimentos_mes": 18,
        "encaminhamentos_manaus_mes": 8,
        "internacoes_involuntarias": 1,
        "transtornos_graves_pct": 38.4,
        "uso_alcool_drogas_pct": 29.8,
        "transtornos_comuns_pct": 31.8,
        "lista_espera_avaliacao": 42,
        "status_geral": "atencao",
    }

@router.get("/caps")
async def caps():
    return {
        "nome": "CAPS I Apuí",
        "municipio": "Apuí/AM",
        "portaria": "GM/MS 336/2002",
        "populacao_referencia": 27600,
        "capacidade_usuarios": 300,
        "usuarios_ativos": 248,
        "ocupacao_pct": 82.7,
        "profissionais": [
            {"cargo": "Psiquiatra (via TFD/Telepsiq)", "carga_h": 20,  "tipo": "contratado", "presenca": "quinzenal"},
            {"cargo": "Psicólogo",                     "carga_h": 40,  "tipo": "concursado", "presenca": "diária"},
            {"cargo": "Assistente Social",             "carga_h": 40,  "tipo": "concursado", "presenca": "diária"},
            {"cargo": "Enfermeiro",                    "carga_h": 40,  "tipo": "contratado", "presenca": "diária"},
            {"cargo": "Técnico de Enfermagem",         "carga_h": 40,  "tipo": "concursado", "presenca": "diária"},
            {"cargo": "Terapeuta Ocupacional",         "carga_h": 20,  "tipo": "vaga_aberta", "presenca": "sem cobertura"},
            {"cargo": "Educador Físico",               "carga_h": 20,  "tipo": "contratado", "presenca": "3x/semana"},
        ],
        "modalidades": ["Atendimento individual","Grupos terapêuticos","Visita domiciliar","Oficinas","Acolhimento noturno"],
        "funcionamento": "Seg-Sex 07h-17h — sem plantão noturno/fim de semana",
    }

@router.get("/transtornos")
async def transtornos():
    return [
        {"cid": "F20-F29", "descricao": "Esquizofrenia e psicoses",         "usuarios": 58,  "pct": 23.4, "gravidade": "grave",   "internacoes_6m": 4, "medicamentos": ["Haloperidol","Risperidona","Clozapina"]},
        {"cid": "F31-F33", "descricao": "Transtorno bipolar e depressão",   "usuarios": 76,  "pct": 30.6, "gravidade": "grave",   "internacoes_6m": 2, "medicamentos": ["Lítio","Valproato","Sertralina"]},
        {"cid": "F10",     "descricao": "Transtornos por uso de álcool",    "usuarios": 48,  "pct": 19.4, "gravidade": "moderado","internacoes_6m": 1, "medicamentos": ["Naltrexona","Dissulfiram","Tiamina"]},
        {"cid": "F11-F19", "descricao": "Uso de outras substâncias",        "usuarios": 26,  "pct": 10.5, "gravidade": "moderado","internacoes_6m": 0, "medicamentos": ["Metadona (regulação)","Buprenorfina"]},
        {"cid": "F40-F48", "descricao": "Transtornos ansiosos/neuróticos",  "usuarios": 28,  "pct": 11.3, "gravidade": "leve",    "internacoes_6m": 0, "medicamentos": ["Sertralina","Clonazepam","Escitalopram"]},
        {"cid": "F70-F79", "descricao": "Deficiência intelectual + mental",  "usuarios": 12,  "pct": 4.8,  "gravidade": "grave",   "internacoes_6m": 0, "medicamentos": ["Risperidona","Valproato"]},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "usuarios_ativos": 224, "novos": 22, "atendimentos": 624, "crise": 14, "internacoes": 1, "encaminhamentos_manaus": 6},
        {"mes": "Nov/25", "usuarios_ativos": 228, "novos": 24, "atendimentos": 636, "crise": 15, "internacoes": 2, "encaminhamentos_manaus": 7},
        {"mes": "Dez/25", "usuarios_ativos": 234, "novos": 18, "atendimentos": 612, "crise": 12, "internacoes": 0, "encaminhamentos_manaus": 5},
        {"mes": "Jan/26", "usuarios_ativos": 238, "novos": 26, "atendimentos": 648, "crise": 16, "internacoes": 1, "encaminhamentos_manaus": 7},
        {"mes": "Fev/26", "usuarios_ativos": 244, "novos": 24, "atendimentos": 664, "crise": 17, "internacoes": 1, "encaminhamentos_manaus": 8},
        {"mes": "Mar/26", "usuarios_ativos": 248, "novos": 28, "atendimentos": 684, "crise": 18, "internacoes": 1, "encaminhamentos_manaus": 8},
    ]

@router.get("/producao")
async def producao():
    return [
        {"mes": "Out/25", "atendimentos_individuais": 384, "atendimentos_grupo": 168, "visitas_domiciliares": 48, "acolhimentos": 12, "total": 612},
        {"mes": "Nov/25", "atendimentos_individuais": 392, "atendimentos_grupo": 172, "visitas_domiciliares": 52, "acolhimentos": 14, "total": 630},
        {"mes": "Dez/25", "atendimentos_individuais": 368, "atendimentos_grupo": 160, "visitas_domiciliares": 44, "acolhimentos": 12, "total": 584},
        {"mes": "Jan/26", "atendimentos_individuais": 396, "atendimentos_grupo": 176, "visitas_domiciliares": 54, "acolhimentos": 16, "total": 642},
        {"mes": "Fev/26", "atendimentos_individuais": 404, "atendimentos_grupo": 182, "visitas_domiciliares": 56, "acolhimentos": 17, "total": 659},
        {"mes": "Mar/26", "atendimentos_individuais": 418, "atendimentos_grupo": 188, "visitas_domiciliares": 58, "acolhimentos": 18, "total": 682},
    ]

@router.get("/usuarios")
async def usuarios():
    return [
        {"perfil": "Transtorno grave — psicose/bipolar",     "total": 134, "pct": 54.0, "com_medicacao": 128, "pts_atualizado": True,  "crise_ultimo_trimestre": 8,  "risco": "alto"},
        {"perfil": "Álcool e outras drogas",                 "total": 74,  "pct": 29.8, "com_medicacao": 42,  "pts_atualizado": True,  "crise_ultimo_trimestre": 4,  "risco": "moderado"},
        {"perfil": "Transtorno ansioso / depressão leve",    "total": 28,  "pct": 11.3, "com_medicacao": 22,  "pts_atualizado": True,  "crise_ultimo_trimestre": 1,  "risco": "baixo"},
        {"perfil": "Deficiência intelectual + mental",       "total": 12,  "pct": 4.8,  "com_medicacao": 10,  "pts_atualizado": True,  "crise_ultimo_trimestre": 0,  "risco": "moderado"},
    ]

@router.get("/grupos")
async def grupos():
    return [
        {"grupo": "Grupo de convivência — adultos",          "frequencia": "Semanal",   "participantes": 18, "profissional": "Psicólogo + TO", "status": "ativo",   "modalidade": "Sociabilidade"},
        {"grupo": "Grupo terapêutico — álcool e drogas",     "frequencia": "Semanal",   "participantes": 12, "profissional": "Assistente Social","status": "ativo",  "modalidade": "Terapêutico"},
        {"grupo": "Oficina de geração de renda",             "frequencia": "Quinzenal", "participantes": 10, "profissional": "Educador Físico",  "status": "ativo",  "modalidade": "Inserção social"},
        {"grupo": "Grupo de psicoeducação — familiares",     "frequencia": "Quinzenal", "participantes": 8,  "profissional": "Psicólogo",        "status": "ativo",  "modalidade": "Psicoeducação"},
        {"grupo": "Oficina de artesanato",                   "frequencia": "Semanal",   "participantes": 14, "profissional": "TO (vaga aberta)", "status": "suspenso","modalidade": "Reabilitação"},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Município sem leito psiquiátrico",          "valor": 0,    "meta": 4,   "unidade": "leitos","status": "critico",  "observacao": "0 leitos hospitalares — crises graves dependem de TFD para Manaus (8 encaminhamentos/mês)"},
        {"indicador": "Terapeuta Ocupacional — vaga aberta",       "valor": 1,    "meta": 0,   "unidade": "un",    "status": "atencao",  "observacao": "Equipe mínima CAPS I sem TO desde Jan/26"},
        {"indicador": "Psiquiatra apenas quinzenal",               "valor": 20,   "meta": 40,  "unidade": "h/sem", "status": "atencao",  "observacao": "Atendimento quinzenal via TFD/Telepsiquiatria — 248 usuários"},
        {"indicador": "Lista de espera para avaliação",            "valor": 42,   "meta": 0,   "unidade": "un",    "status": "atencao",  "observacao": "Tempo médio de espera estimado em 35 dias"},
        {"indicador": "Cobertura CAPS I (pop. referência)",        "valor": 82.7, "meta": 100, "unidade": "%",     "status": "ok",       "observacao": "248/300 — capacidade próxima do teto portaria"},
        {"indicador": "Usuários com PTS (Proj. Terapêutico Single)","valor": 100, "meta": 100, "unidade": "%",     "status": "ok",       "observacao": "Todos os 248 usuários ativos com PTS documentado"},
    ]
