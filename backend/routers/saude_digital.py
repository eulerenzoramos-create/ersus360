"""Saúde Digital — RNDS · e-SUS · Prontuário Eletrônico · Interoperabilidade · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-digital", tags=["saude_digital"])

@router.get("/dashboard")
async def dashboard():
    return {
        "cobertura_pec_pct": 88.2,
        "meta_pec_pct": 100,
        "registros_rnds_mes": 4842,
        "envios_rnds_sucesso_pct": 94.6,
        "meta_envios_pct": 98,
        "fichas_digitais_pct": 82.4,
        "atendimentos_sem_papel_pct": 74.8,
        "usuarios_ativos_pec": 68,
        "total_usuarios_pec": 78,
        "sincronizacoes_pendentes": 124,
        "alertas_integracao": 3,
        "status_geral": "atencao",
        "cnds_emitidas_mes": 312,
        "sumarios_alta_rnds_mes": 48,
    }

@router.get("/sistemas")
async def sistemas():
    return [
        {"sistema": "e-SUS PEC",              "versao": "5.2.36",   "status": "online",   "cobertura": "5/5 UBS",  "sync_pendentes": 0,   "ultima_sync": "Há 2h",     "uptime_pct": 99.2,  "observacao": None},
        {"sistema": "e-SUS CDS",              "versao": "3.2.18",   "status": "online",   "cobertura": "3/3 ESF",  "sync_pendentes": 124, "ultima_sync": "Há 18h",    "uptime_pct": 94.8,  "observacao": "ESF Matupi com backlog — verificar conectividade"},
        {"sistema": "RNDS",                   "versao": "API v2",    "status": "online",   "cobertura": "Hospital+UPA","sync_pendentes": 0,"ultima_sync": "Há 4h",    "uptime_pct": 98.6,  "observacao": None},
        {"sistema": "SISREG Online",          "versao": "3.8.2",    "status": "online",   "cobertura": "Central",  "sync_pendentes": 0,   "ultima_sync": "Há 1h",     "uptime_pct": 97.4,  "observacao": None},
        {"sistema": "SIGTAP/BPA",             "versao": "2026.1",   "status": "online",   "cobertura": "Hospital",  "sync_pendentes": 8,  "ultima_sync": "Há 6h",     "uptime_pct": 96.8,  "observacao": None},
        {"sistema": "SINAN Web",              "versao": "Web",      "status": "online",   "cobertura": "VISA",      "sync_pendentes": 0,  "ultima_sync": "Há 3h",     "uptime_pct": 99.0,  "observacao": None},
        {"sistema": "GAL/Laboratório",        "versao": "3.4.1",    "status": "atencao",  "cobertura": "Lab central","sync_pendentes": 28,"ultima_sync": "Há 24h",    "uptime_pct": 86.4,  "observacao": "Integração GAL-PEC pendente — resultados manuais"},
        {"sistema": "HÓRUS/Farmácia",         "versao": "4.2.0",    "status": "online",   "cobertura": "3 unidades","sync_pendentes": 0,  "ultima_sync": "Há 2h",     "uptime_pct": 98.2,  "observacao": None},
        {"sistema": "SCNES",                  "versao": "Web",      "status": "online",   "cobertura": "Todas",     "sync_pendentes": 0,  "ultima_sync": "Há 1d",     "uptime_pct": 99.8,  "observacao": "Atualização mensal — OK"},
        {"sistema": "CADSUS Web",             "versao": "Web",      "status": "atencao",  "cobertura": "Todas",     "sync_pendentes": 0,  "ultima_sync": "Há 3h",     "uptime_pct": 88.2,  "observacao": "Intermitências nos últimos 7 dias"},
    ]

@router.get("/rnds")
async def rnds():
    return {
        "registros_mes": 4842,
        "sucesso_pct": 94.6,
        "erros_pct": 5.4,
        "por_tipo": [
            {"tipo": "Sumário de alta hospitalar",  "enviados": 48,   "sucesso": 47, "erro": 1,  "pct": 97.9},
            {"tipo": "Resultado de exame lab.",     "enviados": 2840, "sucesso": 2698,"erro": 142,"pct": 95.0},
            {"tipo": "Registro de vacina",          "enviados": 1284, "sucesso": 1248,"erro": 36, "pct": 97.2},
            {"tipo": "Dispensação de medicamentos", "enviados": 486,  "sucesso": 452, "erro": 34, "pct": 93.0},
            {"tipo": "Atendimento individual",      "enviados": 184,  "sucesso": 138, "erro": 46, "pct": 75.0},
        ],
        "erros_principais": [
            {"erro": "CPF não encontrado no CADSUS",    "ocorrencias": 82, "tipo": "Identificação"},
            {"erro": "CNS inválido ou inexistente",     "ocorrencias": 48, "tipo": "Identificação"},
            {"erro": "Timeout de conexão",              "ocorrencias": 84, "tipo": "Técnico"},
            {"erro": "Schema de dados inválido",        "ocorrencias": 28, "tipo": "Dados"},
            {"erro": "Servidor RNDS indisponível",      "ocorrencias": 18, "tipo": "Técnico"},
        ]
    }

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "registros_rnds": 4124, "pec_cobertura": 82.4, "fichas_digitais": 74.8, "sucesso_pct": 92.4},
        {"mes": "Nov/25", "registros_rnds": 4284, "pec_cobertura": 84.2, "fichas_digitais": 76.4, "sucesso_pct": 92.8},
        {"mes": "Dez/25", "registros_rnds": 3864, "pec_cobertura": 84.8, "fichas_digitais": 78.2, "sucesso_pct": 93.2},
        {"mes": "Jan/26", "registros_rnds": 4486, "pec_cobertura": 86.4, "fichas_digitais": 80.4, "sucesso_pct": 93.8},
        {"mes": "Fev/26", "registros_rnds": 4682, "pec_cobertura": 86.8, "fichas_digitais": 81.6, "sucesso_pct": 94.2},
        {"mes": "Mar/26", "registros_rnds": 4842, "pec_cobertura": 88.2, "fichas_digitais": 82.4, "sucesso_pct": 94.6},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura e-SUS PEC",              "valor": 88.2, "meta": 100, "unidade": "%", "status": "atencao", "observacao": "1 UBS sem PEC implantado"},
        {"indicador": "Envios RNDS — sucesso",            "valor": 94.6, "meta": 98,  "unidade": "%", "status": "atencao", "observacao": "CPF/CNS inválidos — maioria dos erros"},
        {"indicador": "Fichas digitais (sem papel)",      "valor": 82.4, "meta": 95,  "unidade": "%", "status": "atencao", "observacao": "Meta DAB: 95% digital"},
        {"indicador": "Usuários ativos no PEC",           "valor": 87.2, "meta": 95,  "unidade": "%", "status": "atencao", "observacao": "10 usuários inativos > 30 dias"},
        {"indicador": "Integração GAL-PEC",               "valor": 0,    "meta": 100, "unidade": "%", "status": "critico", "observacao": "Resultados de lab ainda manuais"},
        {"indicador": "Backlog CDS Matupi",               "valor": 124,  "meta": 0,   "unidade": "un","status": "atencao", "observacao": "Conectividade rural — 4G limitado"},
    ]
