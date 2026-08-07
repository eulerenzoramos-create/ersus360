"""CAPS Infanto-Juvenil — Saúde Mental Infanto-Juvenil · FMS Apuí/AM"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/caps-infanto", tags=["caps_infanto"])

@lru_cache(maxsize=1)
def _TRANSTORNOS():
    return [
        {"transtorno": "TDAH",                               "n": 48, "em_acompanhamento": 44, "alta_mes": 3,  "abandono_mes": 2,  "status": "ok"},
        {"transtorno": "Transtorno de ansiedade",             "n": 38, "em_acompanhamento": 36, "alta_mes": 2,  "abandono_mes": 3,  "status": "atencao"},
        {"transtorno": "Depressão infanto-juvenil",           "n": 28, "em_acompanhamento": 26, "alta_mes": 1,  "abandono_mes": 2,  "status": "atencao"},
        {"transtorno": "TEA (autismo)",                      "n": 24, "em_acompanhamento": 24, "alta_mes": 0,  "abandono_mes": 0,  "status": "critico"},
        {"transtorno": "Uso prejudicial de substâncias",     "n": 18, "em_acompanhamento": 16, "alta_mes": 2,  "abandono_mes": 4,  "status": "critico"},
        {"transtorno": "Psicose na infância/adolescência",   "n": 12, "em_acompanhamento": 12, "alta_mes": 0,  "abandono_mes": 1,  "status": "critico"},
        {"transtorno": "Transtorno de conduta",              "n": 14, "em_acompanhamento": 13, "alta_mes": 1,  "abandono_mes": 2,  "status": "atencao"},
        {"transtorno": "Outras demandas",                    "n": 22, "em_acompanhamento": 20, "alta_mes": 3,  "abandono_mes": 1,  "status": "ok"},
    ]


@router.get("/dashboard")
async def dashboard():
    total = sum(t["em_acompanhamento"] for t in _TRANSTORNOS())
    criticos = sum(1 for t in _TRANSTORNOS() if t["status"] == "critico")
    return {
        "pacientes_ativos": total,
        "novos_cadastros_mes": 12,
        "altas_mes": 12,
        "abandono_mes": 15,
        "taxa_abandono_pct": 7.8,
        "atendimentos_individuais_mes": 284,
        "atendimentos_grupo_mes": 96,
        "visitas_escola_mes": 8,
        "visitas_domiciliares_mes": 22,
        "encaminhamentos_entrada_mes": 18,
        "encaminhamentos_saida_mes": 6,
        "transtornos_criticos": criticos,
        "lista_espera": 28,
        "tempo_espera_medio_dias": 34,
        "leitos_referencia_caps_ad": 0,
        "status_geral": "atencao",
        "competencia": "Jun/2026",
    }

@router.get("/transtornos")
async def transtornos():
    return _TRANSTORNOS()

@router.get("/atividades")
async def atividades():
    return [
        {"atividade": "Psicoterapia individual",         "frequencia": "diário",    "profissional": "Psicólogo",         "participantes_mes": 148, "status": "ok"},
        {"atividade": "Grupo terapêutico TDAH",          "frequencia": "semanal",   "profissional": "Psicólogo + Ped.",  "participantes_mes": 44,  "status": "ok"},
        {"atividade": "Grupo família/responsáveis",      "frequencia": "quinzenal", "profissional": "Assistente Social", "participantes_mes": 52,  "status": "ok"},
        {"atividade": "Oficina de habilidades sociais",  "frequencia": "semanal",   "profissional": "TO + Pedagogo",     "participantes_mes": 38,  "status": "ok"},
        {"atividade": "Articulação escola-saúde (PSE)",  "frequencia": "mensal",    "profissional": "Equipe CAPS",       "participantes_mes": 8,   "status": "atencao"},
        {"atividade": "Atenção a usuários de crack/álcool adolescentes", "frequencia":"semanal","profissional":"Psicólogo + Médico","participantes_mes": 16, "status": "critico"},
        {"atividade": "Grupo AEE/TEA (inclusão escolar)","frequencia": "semanal",   "profissional": "TO + Pedagogo",     "participantes_mes": 24,  "status": "critico"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "pacientes_ativos": 168, "novos": 10, "altas": 8,  "abandono": 12, "atendimentos": 256, "lista_espera": 22},
        {"mes": "Fev/26", "pacientes_ativos": 170, "novos": 10, "altas": 9,  "abandono": 13, "atendimentos": 261, "lista_espera": 24},
        {"mes": "Mar/26", "pacientes_ativos": 172, "novos": 11, "altas": 10, "abandono": 14, "atendimentos": 268, "lista_espera": 26},
        {"mes": "Abr/26", "pacientes_ativos": 174, "novos": 12, "altas": 11, "abandono": 14, "atendimentos": 272, "lista_espera": 27},
        {"mes": "Mai/26", "pacientes_ativos": 179, "novos": 14, "altas": 11, "abandono": 15, "atendimentos": 278, "lista_espera": 28},
        {"mes": "Jun/26", "pacientes_ativos": 191, "novos": 12, "altas": 12, "abandono": 15, "atendimentos": 284, "lista_espera": 28},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Pacientes ativos CAPS-IJ",                    "valor": 191, "meta": None, "unidade": "n",  "status": "ok",      "observacao": "Crescimento 14% em 2026 — demanda maior que oferta; lista de espera em 28"},
        {"indicador": "Taxa de abandono ao tratamento",              "valor": 7.8, "meta": 5.0,  "unidade": "%",  "status": "atencao", "observacao": "Uso de substâncias tem maior evasão (22%) — articulação com CREAS prevista"},
        {"indicador": "Lista de espera — tempo médio de acesso",     "valor": 34,  "meta": 15,   "unidade": "dias","status": "critico", "observacao": "28 crianças/adolescentes aguardando — TEA e psicose com maior urgência"},
        {"indicador": "TEA: cobertura terapia ocupacional",          "valor": 58.3,"meta": 100.0,"unidade": "%",  "status": "critico", "observacao": "Apenas 14/24 pacientes com TEA em TO — 1 terapeuta ocupacional no município"},
        {"indicador": "Articulação escola-saúde (PSE/visitas)",      "valor": 8,   "meta": 12,   "unidade": "visitas/mês","status": "atencao","observacao": "Meta: 1 visita/escola pública/mês — 4 escolas sem visita em Jun/26"},
        {"indicador": "Adolescentes em uso de crack/álcool em tratamento","valor": 16,"meta": None,"unidade": "n","status": "critico", "observacao": "Ausência de CAPS AD para adolescentes — atendidos no CAPS-IJ com estrutura limitada"},
    ]