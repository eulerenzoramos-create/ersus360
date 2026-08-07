"""CAPS AD — Álcool e Drogas · FMS Apuí/AM"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/caps-ad", tags=["caps_ad"])

@lru_cache(maxsize=1)
def _SUBSTANCIAS():
    return [
        {"substancia": "Álcool",              "n": 148, "pct": 47.0, "acompanhamento_ativo": 132, "abandono_mes": 12, "status": "critico"},
        {"substancia": "Cannabis",            "n": 64,  "pct": 20.3, "acompanhamento_ativo": 58,  "abandono_mes": 6,  "status": "atencao"},
        {"substancia": "Crack/Pasta-base",    "n": 48,  "pct": 15.2, "acompanhamento_ativo": 42,  "abandono_mes": 9,  "status": "critico"},
        {"substancia": "Benzodiazepínico",    "n": 28,  "pct": 8.9,  "acompanhamento_ativo": 26,  "abandono_mes": 2,  "status": "atencao"},
        {"substancia": "Tabaco (dependência)","n": 18,  "pct": 5.7,  "acompanhamento_ativo": 16,  "abandono_mes": 1,  "status": "ok"},
        {"substancia": "Outras drogas",       "n": 9,   "pct": 2.9,  "acompanhamento_ativo": 8,   "abandono_mes": 1,  "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _SERVICOS():
    return [
        {"servico": "Acolhimento/triagem",              "realizados_mes": 38, "profissional": "Assistente Social + Psicólogo", "status": "ok"},
        {"servico": "Atendimento individual",           "realizados_mes": 284,"profissional": "Psicólogo + Médico Psiquiatra",  "status": "ok"},
        {"servico": "Grupo terapêutico semanal",        "realizados_mes": 96, "profissional": "Psicólogo",                     "status": "ok"},
        {"servico": "Grupo de familiares",              "realizados_mes": 48, "profissional": "Assistente Social",              "status": "ok"},
        {"servico": "Oficina redução de danos",         "realizados_mes": 32, "profissional": "Psicólogo + Enfermeiro",         "status": "atencao"},
        {"servico": "Visita domiciliar",                "realizados_mes": 24, "profissional": "Equipe multiprofissional",       "status": "atencao"},
        {"servico": "Internação breve (leitos CAPS AD)","realizados_mes": 0,  "profissional": "N/A — sem leitos",              "status": "critico"},
        {"servico": "Referência p/ comunidade terapêutica","realizados_mes": 4,"profissional": "Assistente Social",            "status": "atencao"},
    ]


@router.get("/dashboard")
async def dashboard():
    total = sum(s["acompanhamento_ativo"] for s in _SUBSTANCIAS())
    return {
        "pacientes_ativos": total,
        "novos_cadastros_mes": 22,
        "altas_mes": 8,
        "abandono_mes": 31,
        "taxa_abandono_pct": 10.4,
        "atendimentos_mes": 528,
        "proporcao_alcool_pct": 47.0,
        "proporcao_crack_pct": 15.2,
        "internacoes_referidas_mes": 4,
        "leitos_caps_ad": 0,
        "lista_espera": 18,
        "tempo_espera_dias": 21,
        "encaminhamentos_creas_mes": 12,
        "encaminhamentos_hospitalizacao_mes": 3,
        "status_geral": "critico",
        "competencia": "Jun/2026",
    }

@router.get("/substancias")
async def substancias():
    return _SUBSTANCIAS()

@router.get("/servicos")
async def servicos():
    return _SERVICOS()

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "pacientes_ativos": 268, "novos": 18, "altas": 6,  "abandono": 28, "atendimentos": 492},
        {"mes": "Fev/26", "pacientes_ativos": 272, "novos": 20, "altas": 7,  "abandono": 29, "atendimentos": 498},
        {"mes": "Mar/26", "pacientes_ativos": 274, "novos": 21, "altas": 7,  "abandono": 30, "atendimentos": 508},
        {"mes": "Abr/26", "pacientes_ativos": 276, "novos": 22, "altas": 8,  "abandono": 30, "atendimentos": 514},
        {"mes": "Mai/26", "pacientes_ativos": 278, "novos": 21, "altas": 8,  "abandono": 31, "atendimentos": 521},
        {"mes": "Jun/26", "pacientes_ativos": 282, "novos": 22, "altas": 8,  "abandono": 31, "atendimentos": 528},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Pacientes ativos CAPS AD",                 "valor": 282,  "meta": None, "unidade": "n",    "status": "atencao", "observacao": "Crescimento 5% em 2026 — álcool (47%) e crack (15%) lideram demanda"},
        {"indicador": "Taxa de abandono ao tratamento",           "valor": 10.4, "meta": 5.0,  "unidade": "%",    "status": "critico", "observacao": "Crack/pasta-base com maior evasão (18%/mês) — falta de leitos de crise agrava abandono"},
        {"indicador": "Leitos de internação breve CAPS AD",       "valor": 0,    "meta": 6,    "unidade": "leitos","status": "critico","observacao": "Ausência total de leitos — internações de crise enviadas a Humaitá/AM (>200 km)"},
        {"indicador": "Tempo médio de espera para 1ª consulta",   "valor": 21,   "meta": 7,    "unidade": "dias",  "status": "critico", "observacao": "18 em lista de espera — demanda supera capacidade da equipe atual"},
        {"indicador": "Redução de danos — alcance mensal",        "valor": 32,   "meta": 60,   "unidade": "n",    "status": "atencao", "observacao": "Oficinas não atingem usuários de crack em área central — necessário trabalho de rua"},
        {"indicador": "Familiares em grupo terapêutico",          "valor": 48,   "meta": 80,   "unidade": "participações/mês","status": "atencao","observacao": "Grupo de familiares com frequência abaixo do esperado — barreiras de acesso e estigma"},
    ]