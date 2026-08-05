from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/conselho-saude-apui", tags=["conselho_saude_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "composicao_total_membros": 16,
        "segmento_usuarios_membros": 8,
        "segmento_trabalhadores_membros": 4,
        "segmento_gestores_membros": 2,
        "segmento_prestadores_membros": 2,
        "reunioes_ordinarias_realizadas_ano": 11,
        "reunioes_ordinarias_previstas_ano": 12,
        "reunioes_extraordinarias_ano": 4,
        "deliberacoes_emitidas_ano": 38,
        "deliberacoes_cumpridas_pct": 68.4,
        "resolucoes_aprovadas_ano": 14,
        "plenarias_publicas_ano": 2,
        "quorum_medio_pct": 81.3,
        "ata_publicacao_prazo_pct": 72.4,
        "site_conselho_ativo": False,
        "status_funcionamento": "atencao",
        "status_deliberacoes": "atencao",
    }


@lru_cache(maxsize=1)
def _COMPOSICAO():
    return [
        {"segmento": "Usuários do SUS",       "vagas": 8,  "titulares": 8,  "suplentes": 8,  "pct_plenario": 50.0, "tipo": "usuario"},
        {"segmento": "Trabalhadores de Saúde","vagas": 4,  "titulares": 4,  "suplentes": 3,  "pct_plenario": 25.0, "tipo": "trabalhador"},
        {"segmento": "Gestores Públicos",     "vagas": 2,  "titulares": 2,  "suplentes": 2,  "pct_plenario": 12.5, "tipo": "gestor"},
        {"segmento": "Prestadores de Serviço","vagas": 2,  "titulares": 2,  "suplentes": 1,  "pct_plenario": 12.5, "tipo": "prestador"},
    ]


@lru_cache(maxsize=1)
def _DELIBERACOES():
    return [
        {"numero": "001/2025", "assunto": "Aprovação Relatório Anual de Gestão 2024",          "data": "2025-01-22", "resultado": "aprovado",    "cumprida": True,  "area": "Gestão"},
        {"numero": "002/2025", "assunto": "Aprovação do Plano Municipal de Saúde 2022–2025 (revisão)", "data": "2025-02-19","resultado": "aprovado","cumprida": True,  "area": "Planejamento"},
        {"numero": "003/2025", "assunto": "Ampliação de vagas de especialidades via TeleSaúde","data": "2025-02-19", "resultado": "aprovado",    "cumprida": False, "area": "Regulação"},
        {"numero": "004/2025", "assunto": "Prioridade para contratação de psiquiatra",         "data": "2025-03-19", "resultado": "aprovado",    "cumprida": False, "area": "RH"},
        {"numero": "005/2025", "assunto": "Criação do Comitê Municipal de Segurança do Paciente","data":"2025-03-19","resultado": "aprovado",    "cumprida": True,  "area": "Qualidade"},
        {"numero": "006/2025", "assunto": "Reforma do CAPS — prazo de conclusão",              "data": "2025-04-16", "resultado": "aprovado",    "cumprida": False, "area": "Infraestrutura"},
        {"numero": "007/2025", "assunto": "Implantação de horário estendido UBS Zona Rural",   "data": "2025-04-16", "resultado": "aprovado",    "cumprida": True,  "area": "APS"},
        {"numero": "008/2025", "assunto": "Aprovação da PPA de Saúde 2026–2029",               "data": "2025-05-21", "resultado": "aprovado",    "cumprida": False, "area": "Planejamento"},
        {"numero": "009/2025", "assunto": "Repúdio à demora na regulação de cirurgias eletivas","data":"2025-05-21","resultado": "aprovado",    "cumprida": False, "area": "Regulação"},
        {"numero": "010/2025", "assunto": "Implantação do e-SUS nas EMSI indígenas",           "data": "2025-06-18", "resultado": "aprovado",    "cumprida": False, "area": "Saúde Indígena"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "reunioes": 10, "deliberacoes": 28, "cumpridas_pct": 58.4, "quorum_medio": 75.2},
        {"ano": "2023", "reunioes": 11, "deliberacoes": 32, "cumpridas_pct": 62.4, "quorum_medio": 78.4},
        {"ano": "2024", "reunioes": 12, "deliberacoes": 36, "cumpridas_pct": 65.8, "quorum_medio": 80.2},
        {"ano": "2025", "reunioes": 11, "deliberacoes": 38, "cumpridas_pct": 68.4, "quorum_medio": 81.3},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Reuniões realizadas no ano",         "valor": 11,   "meta": 12,   "unidade": "reuniões", "status": "atencao", "observacao": "11/12 reuniões ordinárias — 1 cancelada por falta de quórum em março"},
        {"indicador": "Deliberações cumpridas",             "valor": 68.4, "meta": 90.0, "unidade": "%",        "status": "atencao", "observacao": "31,6% das deliberações não cumpridas — principalmente RH (psiquiatra) e regulação especializada"},
        {"indicador": "Publicação de atas no prazo",        "valor": 72.4, "meta": 100.0,"unidade": "%",        "status": "atencao", "observacao": "27,6% das atas com publicação atrasada — secretaria executiva sem servidor dedicado"},
        {"indicador": "Plenárias públicas no ano",          "valor": 2,    "meta": 4,    "unidade": "plenárias","status": "atencao", "observacao": "Apenas 2 plenárias públicas — participação social reduzida em município com baixa escolaridade"},
        {"indicador": "Site do Conselho ativo",             "valor": 0,    "meta": 1,    "unidade": "sim/não",  "status": "critico", "observacao": "Conselho sem site oficial — transparência comprometida, deliberações não acessíveis on-line"},
        {"indicador": "Quórum médio nas reuniões",          "valor": 81.3, "meta": 75.0, "unidade": "%",        "status": "ok",      "observacao": "Quórum acima da meta — presença qualificada dos conselheiros nas reuniões ordinárias"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/composicao")
def composicao():
    return _COMPOSICAO


@router.get("/deliberacoes")
def deliberacoes():
    return _DELIBERACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
