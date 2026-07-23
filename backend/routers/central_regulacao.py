# backend/routers/central_regulacao.py — Central de Regulação SISREG
from fastapi import APIRouter
import random

router = APIRouter(prefix="/api/central-regulacao", tags=["central-regulacao"])
random.seed(42)

_ESPECIALIDADES = [
    {"especialidade": "Cardiologia",           "aguardando": 38, "tempo_medio_dias": 72, "oferta_mensal": 20, "deficit": 18},
    {"especialidade": "Ortopedia",             "aguardando": 54, "tempo_medio_dias": 98, "oferta_mensal": 18, "deficit": 36},
    {"especialidade": "Oftalmologia",          "aguardando": 41, "tempo_medio_dias": 85, "oferta_mensal": 24, "deficit": 17},
    {"especialidade": "Neurologia",            "aguardando": 29, "tempo_medio_dias": 110,"oferta_mensal": 10, "deficit": 19},
    {"especialidade": "Dermatologia",          "aguardando": 22, "tempo_medio_dias": 45, "oferta_mensal": 20, "deficit": 2},
    {"especialidade": "Endocrinologia",        "aguardando": 33, "tempo_medio_dias": 90, "oferta_mensal": 12, "deficit": 21},
    {"especialidade": "Mamografia Digital",    "aguardando": 17, "tempo_medio_dias": 35, "oferta_mensal": 20, "deficit": -3},
    {"especialidade": "Colonoscopia",          "aguardando": 12, "tempo_medio_dias": 28, "oferta_mensal": 15, "deficit": -3},
    {"especialidade": "Ultrassonografia ABD",  "aguardando": 8,  "tempo_medio_dias": 15, "oferta_mensal": 30, "deficit": -22},
]

_SOLICITACOES = [
    {"id":"S001","paciente":"Maria das Graças Oliveira","cns":"710001234567890","idade":47,"especialidade":"Cardiologia","cid":"I10","prioridade":"alta","data_solicitacao":"2026-05-10","dias_espera":74,"status":"aguardando","unidade_origem":"UBS Centro — ESF I","unidade_destino":None,"data_agendamento":None,"observacao":"HAS com dor precordial — avaliação cardiológica urgente"},
    {"id":"S002","paciente":"João Batista Ferreira","cns":"710009876543210","idade":62,"especialidade":"Ortopedia","cid":"M17","prioridade":"media","data_solicitacao":"2026-04-22","dias_espera":92,"status":"aguardando","unidade_origem":"UBS Castanhal — ESF II","unidade_destino":None,"data_agendamento":None,"observacao":"Gonartrose bilateral — aguardando TFD para Manaus"},
    {"id":"S003","paciente":"Ana Paula Souza","cns":"710005432198760","idade":34,"especialidade":"Oftalmologia","cid":"H52","prioridade":"eletiva","data_solicitacao":"2026-06-01","dias_espera":52,"status":"agendado","unidade_origem":"UBS Centro — ESF I","unidade_destino":"Clínica Olhar AM — Manaus","data_agendamento":"2026-08-15","observacao":"Miopia e astigmatismo — avaliação para cirurgia refrativa"},
    {"id":"S004","paciente":"Carlos Roberto Lima","cns":"710008765432109","idade":55,"especialidade":"Neurologia","cid":"G43","prioridade":"alta","data_solicitacao":"2026-03-18","dias_espera":127,"status":"aguardando","unidade_origem":"UBS Zona Rural — ESF III","unidade_destino":None,"data_agendamento":None,"observacao":"Enxaqueca crônica refratária — já usou 3 medicamentos sem resposta"},
    {"id":"S005","paciente":"Francisca Mendes Costa","cns":"710003456789012","idade":58,"especialidade":"Endocrinologia","cid":"E11","prioridade":"media","data_solicitacao":"2026-05-28","dias_espera":56,"status":"aguardando","unidade_origem":"UBS Nova Esperança — ESF IV","unidade_destino":None,"data_agendamento":None,"observacao":"DM2 descompensado — HbA1c 10.2% — necessita ajuste por endocrinologista"},
    {"id":"S006","paciente":"Raimundo Nonato Silva","cns":"710007654321098","idade":71,"especialidade":"Cardiologia","cid":"I50","prioridade":"urgente","data_solicitacao":"2026-07-18","dias_espera":5,"status":"autorizado","unidade_origem":"UPA Centro — Apuí","unidade_destino":"Hospital e Pronto-Socorro 28 de Agosto — Manaus","data_agendamento":"2026-07-25","observacao":"ICC descompensada — fração de ejeção 32% — TFD urgente solicitado"},
    {"id":"S007","paciente":"Tereza Cristina Albuquerque","cns":"710002345678901","idade":42,"especialidade":"Mamografia Digital","cid":"Z12.3","prioridade":"media","data_solicitacao":"2026-06-15","dias_espera":38,"status":"agendado","unidade_origem":"UBS Centro — ESF I","unidade_destino":"LAM — Laboratório Apuí","data_agendamento":"2026-07-28","observacao":"Rastreamento oncológico — nódulo palpável em mama direita"},
    {"id":"S008","paciente":"Paulo Sérgio Nascimento","cns":"710001357924680","idade":48,"especialidade":"Dermatologia","cid":"L40","prioridade":"eletiva","data_solicitacao":"2026-06-20","dias_espera":33,"status":"aguardando","unidade_origem":"UBS Castanhal — ESF II","unidade_destino":None,"data_agendamento":None,"observacao":"Psoríase em placas — tratamento tópico sem resposta adequada"},
    {"id":"S009","paciente":"Josefa Rodrigues Andrade","cns":"710004567890123","idade":65,"especialidade":"Ortopedia","cid":"M16","prioridade":"alta","data_solicitacao":"2026-04-10","dias_espera":104,"status":"negado","unidade_origem":"UBS Zona Rural — ESF III","unidade_destino":None,"data_agendamento":None,"observacao":"Coxartrose avançada — negado por ausência de RX recente — solicitado novo exame"},
    {"id":"S010","paciente":"Antônio José Pereira","cns":"710006789012345","idade":39,"especialidade":"Colonoscopia","cid":"K92","prioridade":"alta","data_solicitacao":"2026-07-01","dias_espera":22,"status":"agendado","unidade_origem":"UBS Nova Esperança — ESF IV","unidade_destino":"Clínica GED Manaus","data_agendamento":"2026-08-05","observacao":"Sangramento retal — pesquisa de CCR"},
]

_RESUMO = {
    "total_fila": len([s for s in _SOLICITACOES if s["status"] == "aguardando"]),
    "urgentes": len([s for s in _SOLICITACOES if s["prioridade"] == "urgente"]),
    "agendados_mes": len([s for s in _SOLICITACOES if s["status"] == "agendado"]),
    "tempo_medio_espera_dias": 52,
    "taxa_autorizacao_pct": 74.0,
    "oferta_disponivel": sum(e["oferta_mensal"] for e in _ESPECIALIDADES),
    "demanda_reprimida": sum(max(0, e["deficit"]) for e in _ESPECIALIDADES),
    "ultima_sincronizacao": "2026-07-23 06:00 (SISREG)",
}


@router.get("/resumo")
def resumo():
    return _RESUMO


@router.get("/solicitacoes")
def solicitacoes():
    return _SOLICITACOES


@router.get("/especialidades")
def especialidades():
    return _ESPECIALIDADES


@router.post("/sincronizar")
def sincronizar():
    return {"ok": True, "mensagem": "Sincronização SISREG concluída. 10 registros atualizados.", "timestamp": "2026-07-23 10:00"}
