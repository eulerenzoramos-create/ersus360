"""Farmacovigilância — RAM · NOTIVISA · Queixas Técnicas · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/farmacovigilancia", tags=["farmacovigilancia"])

@router.get("/dashboard")
async def dashboard():
    return {
        "notificacoes_mes": 18,
        "ram_mes": 11,
        "queixas_tecnicas_mes": 7,
        "notificacoes_graves_mes": 3,
        "notificadas_notivisa_pct": 88.9,
        "meta_notivisa_pct": 100,
        "taxa_subnotificacao_estimada_pct": 68.4,
        "medicamentos_alerta_mes": 4,
        "medicamentos_retirados": 1,
        "status_geral": "atencao",
        "profissionais_notificadores_ativos": 14,
        "tendencia": "aumento",
        "ram_graves_internacao": 2,
    }

@router.get("/notificacoes")
async def notificacoes():
    return [
        {"id": "RAM-001", "tipo": "RAM",             "medicamento": "Warfarina 5 mg",       "reacao": "Sangramento digestivo",          "gravidade": "grave",   "causalidade": "Provável",  "notivisa": True,  "desfecho": "Recuperado com sequela", "profissional": "Médico"},
        {"id": "RAM-002", "tipo": "RAM",             "medicamento": "Amoxicilina 500 mg",   "reacao": "Anafilaxia",                     "gravidade": "grave",   "causalidade": "Definida",  "notivisa": True,  "desfecho": "Recuperado",            "profissional": "Enfermeiro"},
        {"id": "RAM-003", "tipo": "RAM",             "medicamento": "Metformina 850 mg",    "reacao": "Acidose láctica",                "gravidade": "grave",   "causalidade": "Possível",  "notivisa": True,  "desfecho": "Recuperado",            "profissional": "Médico"},
        {"id": "RAM-004", "tipo": "RAM",             "medicamento": "Enalapril 10 mg",      "reacao": "Tosse seca persistente",         "gravidade": "moderada","causalidade": "Definida",  "notivisa": True,  "desfecho": "Recuperado",            "profissional": "Farmacêutico"},
        {"id": "RAM-005", "tipo": "RAM",             "medicamento": "Captopril 25 mg",      "reacao": "Angioedema de face",             "gravidade": "grave",   "causalidade": "Provável",  "notivisa": False, "desfecho": "Recuperado",            "profissional": "Médico", "alerta": "Não notificado ao NOTIVISA"},
        {"id": "RAM-006", "tipo": "RAM",             "medicamento": "Metronidazol 250 mg",  "reacao": "Neuropatia periférica",          "gravidade": "moderada","causalidade": "Possível",  "notivisa": True,  "desfecho": "Em acompanhamento",     "profissional": "Médico"},
        {"id": "QT-001",  "tipo": "Queixa técnica",  "medicamento": "Dipirona 500 mg/mL",  "reacao": "Partícula visível na ampola",    "gravidade": "moderada","causalidade": "N/A",       "notivisa": True,  "desfecho": "Lote retirado",         "profissional": "Farmacêutico"},
        {"id": "QT-002",  "tipo": "Queixa técnica",  "medicamento": "Soro fisiológico 0,9%","reacao": "Embalagem com vazamento",       "gravidade": "leve",    "causalidade": "N/A",       "notivisa": True,  "desfecho": "Comunicado fornecedor", "profissional": "Enfermeiro"},
        {"id": "QT-003",  "tipo": "Queixa técnica",  "medicamento": "Insulina NPH",         "reacao": "Aspecto turvo fora do padrão",  "gravidade": "grave",   "causalidade": "N/A",       "notivisa": True,  "desfecho": "Investigação em curso", "profissional": "Farmacêutico"},
    ]

@router.get("/alertas")
async def alertas():
    return [
        {"medicamento": "Captopril 25 mg",     "alerta": "Angioedema — 2 casos em 30 dias",          "acao": "Revisar prescrições + orientar pacientes",      "prazo": "05/04/26", "status": "aberto"},
        {"medicamento": "Warfarina 5 mg",      "alerta": "Sangramento grave — INR não monitorado",   "acao": "Implementar protocolo de monitoramento INR",     "prazo": "10/04/26", "status": "em_andamento"},
        {"medicamento": "Insulina NPH",        "alerta": "QT aspecto turvo — lote suspeito",         "acao": "Quarentena lote + comunicar ANVISA",            "prazo": "01/04/26", "status": "aberto"},
        {"medicamento": "Amoxicilina 500 mg",  "alerta": "Anafilaxia — alergia não registrada",      "acao": "Atualizar histórico alérgico no prontuário",    "prazo": "08/04/26", "status": "concluido"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "ram": 8,  "queixas": 4, "graves": 2, "notivisa_pct": 83.3},
        {"mes": "Nov/25", "ram": 9,  "queixas": 5, "graves": 2, "notivisa_pct": 85.7},
        {"mes": "Dez/25", "ram": 7,  "queixas": 3, "graves": 1, "notivisa_pct": 80.0},
        {"mes": "Jan/26", "ram": 10, "queixas": 6, "graves": 2, "notivisa_pct": 87.5},
        {"mes": "Fev/26", "ram": 10, "queixas": 6, "graves": 3, "notivisa_pct": 87.5},
        {"mes": "Mar/26", "ram": 11, "queixas": 7, "graves": 3, "notivisa_pct": 88.9},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Taxa de notificação ao NOTIVISA", "valor": 88.9, "meta": 100, "unidade": "%", "status": "atencao", "observacao": "2 RAMs graves não notificadas"},
        {"indicador": "RAM graves com internação",       "valor": 2,    "meta": 0,   "unidade": "un","status": "atencao", "observacao": "Warfarina e Amoxicilina"},
        {"indicador": "Taxa de subnotificação estimada", "valor": 68.4, "meta": 30,  "unidade": "%", "status": "critico", "observacao": "Cultura de notificação a fortalecer"},
        {"indicador": "Medicamentos com alerta ativo",  "valor": 4,    "meta": 0,   "unidade": "un","status": "atencao", "observacao": "3 abertos + 1 em andamento"},
        {"indicador": "Profissionais notificadores",    "valor": 14,   "meta": 30,  "unidade": "un","status": "critico", "observacao": "Apenas 14 de 284 trabalhadores"},
        {"indicador": "Tempo médio análise causalidade","valor": 8.4,  "meta": 5,   "unidade": "dias","status":"atencao","observacao": "Farmacêutico único — sobrecarga"},
    ]
