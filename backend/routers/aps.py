"""
Router: /api/aps — Atencao Primaria a Saude
Dados de referencia municipal para Apui/AM (~21.781 hab).
situacao_dado = "referencia_municipal" em todos os endpoints.
"""
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/aps", tags=["APS"])


@router.get("/dashboard")
async def dashboard(_: UserOut = Depends(get_current_user)):
    """Dashboard APS — referencia municipal Apui/AM."""
    return {
        "situacao_dado":      "referencia_municipal",
        "municipio":          "Apuí",
        "uf":                 "AM",
        "competencia":        "Jun/2026",
        "cobertura_esf":      72.4,
        "cobertura_eap":      0.0,
        "ubs_total":          5,
        "equipes_sf":         4,
        "producao_mensal":    3_847,
        "icsap_taxa":         8.3,
        "prenatal_7mais":     62.1,
        "vacinal_bcg":        88.4,
        "populacao_cadastrada": 15_767,
        "acs_ativos":         18,
        "microareas_total":   22,
        "nota": (
            "Referencia municipal — Apui/AM. "
            "4 equipes ESF ativas cobrindo ~72% da populacao urbana. "
            "Area rural de dificil acesso limita cobertura total."
        ),
    }


@router.get("/indicadores")
async def indicadores(_: UserOut = Depends(get_current_user)):
    """Indicadores APS (Componente Qualidade Previne Brasil) — referencia municipal."""
    return [
        # Saude da Mulher
        {"nome": "Pre-natal >= 6 consultas",        "categoria": "Saude da Mulher",      "valor": 62.1, "meta": 70.0, "unidade": "%", "competencia": "Jun/2026", "semaforo": "amarelo"},
        {"nome": "Citopatologico colo do utero",    "categoria": "Saude da Mulher",      "valor": 41.8, "meta": 60.0, "unidade": "%", "competencia": "Jun/2026", "semaforo": "vermelho"},
        # Saude da Crianca
        {"nome": "Vacinacao DTP/Pentavalente",      "categoria": "Saude da Crianca",     "valor": 88.4, "meta": 90.0, "unidade": "%", "competencia": "Jun/2026", "semaforo": "amarelo"},
        {"nome": "Consulta RN 1a semana de vida",   "categoria": "Saude da Crianca",     "valor": 54.6, "meta": 70.0, "unidade": "%", "competencia": "Jun/2026", "semaforo": "vermelho"},
        # Doencas Cronicas
        {"nome": "Acompanhamento HAS",              "categoria": "Doencas Cronicas",     "valor": 48.3, "meta": 60.0, "unidade": "%", "competencia": "Jun/2026", "semaforo": "vermelho"},
        {"nome": "Acompanhamento DM (HbA1c)",       "categoria": "Doencas Cronicas",     "valor": 38.7, "meta": 55.0, "unidade": "%", "competencia": "Jun/2026", "semaforo": "vermelho"},
        {"nome": "Cuidado Pessoas com Obesidade",   "categoria": "Doencas Cronicas",     "valor": 29.4, "meta": 45.0, "unidade": "%", "competencia": "Jun/2026", "semaforo": "vermelho"},
    ]


@router.get("/producao-mensal")
async def producao_mensal(_: UserOut = Depends(get_current_user)):
    """Producao mensal APS 2026 — referencia municipal."""
    return [
        {"mes": "Jan/26", "producao": 3_612, "ano": 2026},
        {"mes": "Fev/26", "producao": 3_488, "ano": 2026},
        {"mes": "Mar/26", "producao": 3_741, "ano": 2026},
        {"mes": "Abr/26", "producao": 3_695, "ano": 2026},
        {"mes": "Mai/26", "producao": 3_820, "ano": 2026},
        {"mes": "Jun/26", "producao": 3_847, "ano": 2026},
    ]


@router.get("/ubs")
async def ubs(_: UserOut = Depends(get_current_user)):
    """Unidades Basicas de Saude de Apui/AM — referencia municipal."""
    return [
        {"id": 1, "nome": "UBS Central Apui",              "equipes": 1, "situacao": "ativa",    "populacao_cadastrada": 4_820, "medico": True,  "regiao": "urbana"},
        {"id": 2, "nome": "UBS Jardim Paraiso",            "equipes": 1, "situacao": "ativa",    "populacao_cadastrada": 3_640, "medico": True,  "regiao": "urbana"},
        {"id": 3, "nome": "UBS Nova Esperanca",            "equipes": 1, "situacao": "ativa",    "populacao_cadastrada": 3_980, "medico": True,  "regiao": "urbana"},
        {"id": 4, "nome": "UBS Ramal do Castanho",         "equipes": 1, "situacao": "ativa",    "populacao_cadastrada": 1_927, "medico": False, "regiao": "rural"},
        {"id": 5, "nome": "Polo de Saude Comunidade Flor", "equipes": 0, "situacao": "em_reforma","populacao_cadastrada":  1_400, "medico": False, "regiao": "rural"},
    ]
