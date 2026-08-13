"""
Router: /api/saude-idoso — ERSUS 360
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-idoso", tags=["Saúde do Idoso"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "total_idosos": 2140,
        "frageis": 312,
        "pre_frageis": 568,
        "robustos": 1260,
        "com_alerta": 47,
        "quedas_acumuladas": 23,
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan", "consultas": 387, "visitas_dom": 124, "quedas_atend": 3},
        {"mes": "Fev", "consultas": 394, "visitas_dom": 128, "quedas_atend": 4},
        {"mes": "Mar", "consultas": 401, "visitas_dom": 131, "quedas_atend": 4},
        {"mes": "Abr", "consultas": 408, "visitas_dom": 134, "quedas_atend": 3},
        {"mes": "Mai", "consultas": 413, "visitas_dom": 138, "quedas_atend": 5},
        {"mes": "Jun", "consultas": 419, "visitas_dom": 141, "quedas_atend": 4},
    ]


@router.get("/idosos")
async def idosos():
    return [
        {"id": 1,  "codigo": "IDO-001", "sexo": "F", "idade": 72, "esf": "ESF Centro",      "fragilidade": "robusto",    "ivcf": 2,  "polifarmacia": False, "quedas_ultimo_ano": 0, "caderneta": True,  "visita_domiciliar": False, "cuidador": False, "alerta": None},
        {"id": 2,  "codigo": "IDO-002", "sexo": "M", "idade": 81, "esf": "ESF Cidade Nova", "fragilidade": "fragil",     "ivcf": 11, "polifarmacia": True,  "quedas_ultimo_ano": 3, "caderneta": True,  "visita_domiciliar": True,  "cuidador": True,  "alerta": "3 quedas/ano + polifarmácia — risco alto"},
        {"id": 3,  "codigo": "IDO-003", "sexo": "F", "idade": 68, "esf": "ESF Centro",      "fragilidade": "pre_fragil", "ivcf": 6,  "polifarmacia": False, "quedas_ultimo_ano": 1, "caderneta": True,  "visita_domiciliar": False, "cuidador": False, "alerta": "Queda em Mar/26 — encaminhado fisioterapia"},
        {"id": 4,  "codigo": "IDO-004", "sexo": "M", "idade": 77, "esf": "ESF Colônia",     "fragilidade": "fragil",     "ivcf": 13, "polifarmacia": True,  "quedas_ultimo_ano": 2, "caderneta": False, "visita_domiciliar": True,  "cuidador": True,  "alerta": "Acamado — necessita VD semanal"},
        {"id": 5,  "codigo": "IDO-005", "sexo": "F", "idade": 63, "esf": "ESF Rural",       "fragilidade": "robusto",    "ivcf": 1,  "polifarmacia": False, "quedas_ultimo_ano": 0, "caderneta": True,  "visita_domiciliar": False, "cuidador": False, "alerta": None},
        {"id": 6,  "codigo": "IDO-006", "sexo": "M", "idade": 85, "esf": "ESF Centro",      "fragilidade": "fragil",     "ivcf": 15, "polifarmacia": True,  "quedas_ultimo_ano": 4, "caderneta": True,  "visita_domiciliar": True,  "cuidador": True,  "alerta": "4 quedas/ano — alto risco fratura"},
        {"id": 7,  "codigo": "IDO-007", "sexo": "F", "idade": 70, "esf": "ESF Cidade Nova", "fragilidade": "pre_fragil", "ivcf": 7,  "polifarmacia": True,  "quedas_ultimo_ano": 1, "caderneta": True,  "visita_domiciliar": False, "cuidador": False, "alerta": "Polifarmácia — revisar prescrição"},
        {"id": 8,  "codigo": "IDO-008", "sexo": "M", "idade": 74, "esf": "ESF Colônia",     "fragilidade": "robusto",    "ivcf": 3,  "polifarmacia": False, "quedas_ultimo_ano": 0, "caderneta": True,  "visita_domiciliar": False, "cuidador": False, "alerta": None},
        {"id": 9,  "codigo": "IDO-009", "sexo": "F", "idade": 88, "esf": "ESF Rural",       "fragilidade": "fragil",     "ivcf": 14, "polifarmacia": True,  "quedas_ultimo_ano": 2, "caderneta": False, "visita_domiciliar": True,  "cuidador": True,  "alerta": "Demência leve — sem cuidador formal"},
        {"id": 10, "codigo": "IDO-010", "sexo": "M", "idade": 66, "esf": "ESF Centro",      "fragilidade": "robusto",    "ivcf": 2,  "polifarmacia": False, "quedas_ultimo_ano": 0, "caderneta": True,  "visita_domiciliar": False, "cuidador": False, "alerta": None},
        {"id": 11, "codigo": "IDO-011", "sexo": "F", "idade": 79, "esf": "ESF Cidade Nova", "fragilidade": "pre_fragil", "ivcf": 8,  "polifarmacia": True,  "quedas_ultimo_ano": 1, "caderneta": True,  "visita_domiciliar": True,  "cuidador": False, "alerta": "Polifarmácia + DM — risco hipoglicemia"},
        {"id": 12, "codigo": "IDO-012", "sexo": "M", "idade": 92, "esf": "ESF Colônia",     "fragilidade": "fragil",     "ivcf": 16, "polifarmacia": True,  "quedas_ultimo_ano": 3, "caderneta": True,  "visita_domiciliar": True,  "cuidador": True,  "alerta": "Acamado — úlcera pressão estágio I"},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura Caderneta do Idoso",           "valor": 68,  "meta": 80, "unidade": "%",  "status": "critico",  "invertido": False, "observacao": "Distribuição irregular nas zonas rurais."},
        {"indicador": "Idosos frágeis com VD no mês",           "valor": 71,  "meta": 80, "unidade": "%",  "status": "atencao",  "invertido": False, "observacao": "312 frágeis; 221 receberam VD em Jun/26."},
        {"indicador": "Proporção com polifarmácia (≥5 med.)",   "valor": 28,  "meta": 20, "unidade": "%",  "status": "critico",  "invertido": True,  "observacao": "Alta prevalência HAS+DM+outras comorbidades."},
        {"indicador": "Quedas com atendimento registrado",      "valor": 23,  "meta": 15, "unidade": "casos","status": "atencao","invertido": True,  "observacao": "Subnotificação provável — estimativa real ~40."},
        {"indicador": "Idosos com IVCF aplicado no ano",        "valor": 54,  "meta": 75, "unidade": "%",  "status": "critico",  "invertido": False, "observacao": "Meta: aplicar IVCF em todos ≥75 anos."},
        {"indicador": "Cobertura consulta geriátrica/geronto.", "valor": 12,  "meta": 30, "unidade": "%",  "status": "critico",  "invertido": False, "observacao": "Sem geriatra local — TFD Manaus."},
        {"indicador": "Idosos em Academia da Saúde",            "valor": 187, "meta": 200,"unidade": "pacientes","status":"atencao","invertido": False,"observacao": "2 polos ativos — capacidade ampliada em Mai/26."},
    ]
