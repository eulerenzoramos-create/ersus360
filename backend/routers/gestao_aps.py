"""Gestão APS — Painel de Gestão da Atenção Primária · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/gestao", tags=["gestao_aps"])

@router.get("/painel")
async def painel():
    return {
        "equipes_esf_ativas": 8,
        "equipes_completas": 5,
        "populacao_cadastrada_esf": 18_640,
        "cobertura_esf_pct": 85.2,
        "atendimentos_mes": 4_284,
        "visitas_acs_mes": 4_820,
        "vacinas_em_dia_pct": 68.4,
        "sisab_status": "em_dia",
        "competencia": "Jul/2026",
    }

@router.get("/atendimentos")
async def atendimentos():
    return {
        "total_periodo": 29_988,
        "media_mensal": 4_284,
        "serie_mensal": [
            {"mes": "Jan/26", "medico": 1840, "enfermeiro": 920, "odontologico": 480, "outros": 284, "total": 3524},
            {"mes": "Fev/26", "medico": 1680, "enfermeiro": 840, "odontologico": 440, "outros": 260, "total": 3220},
            {"mes": "Mar/26", "medico": 1924, "enfermeiro": 964, "odontologico": 520, "outros": 296, "total": 3704},
            {"mes": "Abr/26", "medico": 1780, "enfermeiro": 890, "odontologico": 460, "outros": 270, "total": 3400},
            {"mes": "Mai/26", "medico": 1960, "enfermeiro": 980, "odontologico": 540, "outros": 300, "total": 3780},
            {"mes": "Jun/26", "medico": 2080, "enfermeiro": 1040, "odontologico": 560, "outros": 320, "total": 4000},
            {"mes": "Jul/26", "medico": 2160, "enfermeiro": 1080, "odontologico": 600, "outros": 340, "total": 4180},
        ],
    }

@router.get("/procedimentos")
async def procedimentos():
    return {
        "procedimentos": [
            {"codigo": "0301010064", "descricao": "Consulta médica em atenção básica",             "quantidade": 15_120, "unidade": "consulta"},
            {"codigo": "0301010080", "descricao": "Consulta de enfermagem p/ atenção básica",      "quantidade": 7_560,  "unidade": "consulta"},
            {"codigo": "0301010099", "descricao": "Atendimento odontológico de urgência",          "quantidade": 3_780,  "unidade": "atendimento"},
            {"codigo": "0204020030", "descricao": "Coleta de material p/ exame citopatológico",   "quantidade": 2_840,  "unidade": "procedimento"},
            {"codigo": "0104010010", "descricao": "Visita domiciliar — ACS",                       "quantidade": 28_420, "unidade": "visita"},
            {"codigo": "0301010030", "descricao": "Atendimento p/ planejamento familiar — homem",  "quantidade": 480,    "unidade": "atendimento"},
            {"codigo": "0301010048", "descricao": "Atendimento p/ planejamento familiar — mulher", "quantidade": 1_240,  "unidade": "atendimento"},
            {"codigo": "0203010086", "descricao": "Teste rápido — HIV",                            "quantidade": 684,    "unidade": "teste"},
            {"codigo": "0203010051", "descricao": "Teste rápido — Sífilis",                        "quantidade": 720,    "unidade": "teste"},
            {"codigo": "0214010082", "descricao": "Eletrocardiograma (ECG)",                        "quantidade": 384,    "unidade": "exame"},
        ],
    }

@router.get("/vacinas")
async def vacinas():
    return {
        "em_dia": 4,
        "atencao": 5,
        "criticas": 4,
        "pct_cobertura_media": 68.4,
        "vacinas": [
            {"vacina": "BCG",                     "doses_aplicadas": 148,  "meta_ano": 160,   "pct": 92.5, "status": "em_dia"},
            {"vacina": "Hepatite B",               "doses_aplicadas": 128,  "meta_ano": 160,   "pct": 80.0, "status": "em_dia"},
            {"vacina": "Pentavalente",             "doses_aplicadas": 420,  "meta_ano": 480,   "pct": 87.5, "status": "em_dia"},
            {"vacina": "VIP (Poliomielite inj.)",  "doses_aplicadas": 392,  "meta_ano": 480,   "pct": 81.7, "status": "em_dia"},
            {"vacina": "VRH (Rotavírus)",          "doses_aplicadas": 284,  "meta_ano": 320,   "pct": 88.8, "status": "em_dia"},
            {"vacina": "Meningocócica C",          "doses_aplicadas": 240,  "meta_ano": 320,   "pct": 75.0, "status": "pendente"},
            {"vacina": "VOP (Poliomielite oral)",  "doses_aplicadas": 248,  "meta_ano": 480,   "pct": 51.7, "status": "pendente"},
            {"vacina": "Tríplice Viral (SCR)",     "doses_aplicadas": 340,  "meta_ano": 480,   "pct": 70.8, "status": "pendente"},
            {"vacina": "Varicela",                 "doses_aplicadas": 280,  "meta_ano": 480,   "pct": 58.3, "status": "pendente"},
            {"vacina": "HPV",                      "doses_aplicadas": 284,  "meta_ano": 684,   "pct": 41.5, "status": "pendente"},
            {"vacina": "dTpa (gestantes)",         "doses_aplicadas": 84,   "meta_ano": 284,   "pct": 29.6, "status": "pendente"},
            {"vacina": "Influenza (≥60 anos)",     "doses_aplicadas": 840,  "meta_ano": 2_480, "pct": 33.9, "status": "pendente"},
            {"vacina": "dT Adulto",                "doses_aplicadas": 284,  "meta_ano": 1_240, "pct": 22.9, "status": "pendente"},
        ],
    }

@router.get("/visitas")
async def visitas():
    return {
        "total_programadas": 33_740,
        "total_realizadas": 30_694,
        "pct_cumprimento": 91.0,
        "serie_mensal": [
            {"mes": "Jan/26", "programadas": 4_820, "realizadas": 4_196},
            {"mes": "Fev/26", "programadas": 4_820, "realizadas": 4_290},
            {"mes": "Mar/26", "programadas": 4_820, "realizadas": 4_482},
            {"mes": "Abr/26", "programadas": 4_820, "realizadas": 4_338},
            {"mes": "Mai/26", "programadas": 4_820, "realizadas": 4_580},
            {"mes": "Jun/26", "programadas": 4_820, "realizadas": 4_628},
            {"mes": "Jul/26", "programadas": 4_820, "realizadas": 4_980},
        ],
    }

@router.get("/sisab")
async def sisab():
    return {
        "status_envio": "em_dia",
        "ultima_competencia_enviada": "Jun/2026",
        "proxima_competencia": "Jul/2026",
        "prazo_envio": "10/08/2026",
        "dias_para_prazo": 36,
        "equipes_ativas": 8,
        "equipes_com_producao_mes": 8,
        "pct_fichas_validadas": 97.4,
        "inconsistencias": 12,
        "cns_sem_cpf": 48,
        "historico_envio": [
            {"competencia": "Jan/2026", "status": "enviado",  "fichas": 12_840},
            {"competencia": "Fev/2026", "status": "enviado",  "fichas": 11_680},
            {"competencia": "Mar/2026", "status": "enviado",  "fichas": 13_124},
            {"competencia": "Abr/2026", "status": "enviado",  "fichas": 12_480},
            {"competencia": "Mai/2026", "status": "enviado",  "fichas": 13_680},
            {"competencia": "Jun/2026", "status": "enviado",  "fichas": 14_284},
            {"competencia": "Jul/2026", "status": "pendente", "fichas": None},
        ],
    }

@router.get("/equipes-esf")
async def equipes_esf():
    return {
        "total": 8,
        "completas": 5,
        "incompletas": 3,
        "populacao_total": 18_640,
        "equipes": [
            {
                "cnes": "2001001", "nome": "ESF 01 — Centro", "unidade": "UBS Central", "area": "Zona Urbana",
                "populacao_cadastrada": 3_840, "pct_cobertura": 89.4, "completa": True, "incompleta_motivo": None,
                "composicao": {
                    "medico":      {"nome": "Dr. Carlos Andrade",       "carga_horaria": 40},
                    "enfermeiro":  {"nome": "Enf.ª Patrícia Lima",      "carga_horaria": 40},
                    "tecnico_enf": {"nome": "Téc. José da Silva",       "carga_horaria": 40},
                    "acs": [{"nome": "ACS Maria José"},{"nome": "ACS João Carlos"},{"nome": "ACS Ana Paula"},{"nome": "ACS Pedro Souza"},{"nome": "ACS Raimundo Farias"}],
                },
            },
            {
                "cnes": "2001002", "nome": "ESF 02 — Kennedy", "unidade": "UBS Bairro Kennedy", "area": "Zona Urbana",
                "populacao_cadastrada": 3_280, "pct_cobertura": 84.6, "completa": True, "incompleta_motivo": None,
                "composicao": {
                    "medico":      {"nome": "Dr.ª Fernanda Costa",      "carga_horaria": 40},
                    "enfermeiro":  {"nome": "Enf.° Rodrigo Melo",       "carga_horaria": 40},
                    "tecnico_enf": {"nome": "Téc. Sandra Vieira",       "carga_horaria": 40},
                    "acs": [{"nome": "ACS Conceição Nunes"},{"nome": "ACS Francisco Lima"},{"nome": "ACS Tereza Silva"},{"nome": "ACS Roberto Alves"}],
                },
            },
            {
                "cnes": "2001003", "nome": "ESF 03 — Nova Esperança", "unidade": "UBS Nova Esperança", "area": "Zona Urbana Periférica",
                "populacao_cadastrada": 2_840, "pct_cobertura": 78.2, "completa": False,
                "incompleta_motivo": "Vaga de médico em aberto desde Fev/2026 — 2 processos seletivos sem candidatos",
                "composicao": {
                    "medico":      None,
                    "enfermeiro":  {"nome": "Enf.ª Claudiane Rocha",    "carga_horaria": 40},
                    "tecnico_enf": {"nome": "Téc. Antônio Pereira",     "carga_horaria": 40},
                    "acs": [{"nome": "ACS Luzia Ferreira"},{"nome": "ACS Manoel Costa"},{"nome": "ACS Benedita Farias"},{"nome": "ACS Valdir Santos"}],
                },
            },
            {
                "cnes": "2001004", "nome": "ESF 04 — Zona Rural Linha 7", "unidade": "UBS Linha 7", "area": "Zona Rural",
                "populacao_cadastrada": 2_480, "pct_cobertura": 72.4, "completa": False,
                "incompleta_motivo": "Médico cumprindo 20h/semana (contrato temporário) — equipe sem enfermeiro efetivo",
                "composicao": {
                    "medico":      {"nome": "Dr. Marcos Tavares (20h)",  "carga_horaria": 20},
                    "enfermeiro":  None,
                    "tecnico_enf": {"nome": "Téc. Eliane Nogueira",     "carga_horaria": 40},
                    "acs": [{"nome": "ACS Nilton Barros"},{"nome": "ACS Roseli Carvalho"},{"nome": "ACS Gilson Araújo"}],
                },
            },
            {
                "cnes": "2001005", "nome": "ESF 05 — Ramal do Moura", "unidade": "UBS Ramal do Moura", "area": "Zona Rural",
                "populacao_cadastrada": 1_840, "pct_cobertura": 68.4, "completa": True, "incompleta_motivo": None,
                "composicao": {
                    "medico":      {"nome": "Dr.ª Simone Bastos",       "carga_horaria": 40},
                    "enfermeiro":  {"nome": "Enf.° Cleber Dantas",      "carga_horaria": 40},
                    "tecnico_enf": {"nome": "Téc. Ivete Marques",       "carga_horaria": 40},
                    "acs": [{"nome": "ACS Raimunda Cruz"},{"nome": "ACS Wellington Pinto"},{"nome": "ACS Cleonice Leal"}],
                },
            },
            {
                "cnes": "2001006", "nome": "ESF 06 — Comunidades Ribeirinhas", "unidade": "Posto Fluvial", "area": "Zona Ribeirinha",
                "populacao_cadastrada": 1_280, "pct_cobertura": 58.4, "completa": False,
                "incompleta_motivo": "Sem médico fixo — atendimento por itinerância 1×/mês em barco — sem técnico de enfermagem",
                "composicao": {
                    "medico":      None,
                    "enfermeiro":  {"nome": "Enf.ª Aparecida Gomes",    "carga_horaria": 20},
                    "tecnico_enf": None,
                    "acs": [{"nome": "ACS Durvalino Pinheiro"},{"nome": "ACS Florência Mendes"}],
                },
            },
            {
                "cnes": "2001007", "nome": "ESF 07 — Vila Progresso", "unidade": "UBS Vila Progresso", "area": "Zona Rural",
                "populacao_cadastrada": 1_680, "pct_cobertura": 76.8, "completa": True, "incompleta_motivo": None,
                "composicao": {
                    "medico":      {"nome": "Dr. Anderson Lima",        "carga_horaria": 40},
                    "enfermeiro":  {"nome": "Enf.ª Juliana Neves",      "carga_horaria": 40},
                    "tecnico_enf": {"nome": "Téc. Edmar Soares",        "carga_horaria": 40},
                    "acs": [{"nome": "ACS Marisa Teixeira"},{"nome": "ACS Genilson Braga"},{"nome": "ACS Ozana Vieira"}],
                },
            },
            {
                "cnes": "2001008", "nome": "ESF 08 — Assentamentos", "unidade": "UBS PA Agropalma", "area": "Assentamento",
                "populacao_cadastrada": 1_400, "pct_cobertura": 64.0, "completa": True, "incompleta_motivo": None,
                "composicao": {
                    "medico":      {"nome": "Dr.ª Natália Correia",     "carga_horaria": 40},
                    "enfermeiro":  {"nome": "Enf.° Tiago Albuquerque",  "carga_horaria": 40},
                    "tecnico_enf": {"nome": "Téc. Rosineide Castro",    "carga_horaria": 40},
                    "acs": [{"nome": "ACS Davi Macedo"},{"nome": "ACS Rosilene Figueiredo"},{"nome": "ACS Nildo Borges"}],
                },
            },
        ],
    }
