"""Auditoria Interna — Controle Interno SMS Apuí/AM"""
from fastapi import APIRouter
router = APIRouter(prefix="/api/auditoria-interna-apui", tags=["Auditoria Interna Apuí"])

DASHBOARD = {
    "auditorias_realizadas_2025": 12,
    "auditorias_planejadas_2025": 18,
    "conformidade_media_pct": 68.4,
    "meta_conformidade_pct": 85.0,
    "nao_conformidades_abertas": 34,
    "nao_conformidades_criticas": 8,
    "recomendacoes_atendidas_pct": 54.2,
    "processos_sob_monitoramento": 28,
    "status": "atencao",
}

AUDITORIAS = [
    {"area": "Farmácia Básica",            "data": "Jan/25", "conformidade_pct": 72.4, "nc_criticas": 2, "nc_totais": 8,  "status": "concluida"},
    {"area": "Contratos e Convênios",      "data": "Jan/25", "conformidade_pct": 58.3, "nc_criticas": 4, "nc_totais": 12, "status": "concluida"},
    {"area": "Almoxarifado / Estoque",     "data": "Fev/25", "conformidade_pct": 74.8, "nc_criticas": 1, "nc_totais": 6,  "status": "concluida"},
    {"area": "Folha de Pagamento RH",      "data": "Fev/25", "conformidade_pct": 81.2, "nc_criticas": 0, "nc_totais": 4,  "status": "concluida"},
    {"area": "Frota e Transporte",         "data": "Mar/25", "conformidade_pct": 63.4, "nc_criticas": 3, "nc_totais": 9,  "status": "concluida"},
    {"area": "Vigilância Sanitária",       "data": "Abr/25", "conformidade_pct": 77.6, "nc_criticas": 1, "nc_totais": 5,  "status": "concluida"},
    {"area": "Licitações e Pregões",       "data": "Mai/25", "conformidade_pct": 54.8, "nc_criticas": 5, "nc_totais": 14, "status": "concluida"},
    {"area": "UBS Central — Processos",   "data": "Jun/25", "conformidade_pct": 70.2, "nc_criticas": 2, "nc_totais": 7,  "status": "concluida"},
    {"area": "TFD — Tratamento Fora Dom.", "data": "Jun/25", "conformidade_pct": 66.4, "nc_criticas": 3, "nc_totais": 9,  "status": "em andamento"},
    {"area": "Resíduos de Saúde (PGRSS)", "data": "Jul/25", "conformidade_pct": 0,    "nc_criticas": 0, "nc_totais": 0,  "status": "planejada"},
]

NAO_CONFORMIDADES = [
    {"id": "NC-001", "area": "Contratos",    "descricao": "Contrato vencido sem renovação (> 90 dias)",         "criticidade": "critica",  "status": "aberta",  "prazo": "Ago/25"},
    {"id": "NC-002", "area": "Contratos",    "descricao": "Processo licitatório sem publicação DOU",             "criticidade": "critica",  "status": "aberta",  "prazo": "Jul/25"},
    {"id": "NC-003", "area": "Licitações",   "descricao": "Dispensa sem justificativa técnica formal",           "criticidade": "critica",  "status": "aberta",  "prazo": "Jul/25"},
    {"id": "NC-004", "area": "Frota",        "descricao": "Veículo sem CRLV 2025",                               "criticidade": "alta",     "status": "aberta",  "prazo": "Ago/25"},
    {"id": "NC-005", "area": "Farmácia",     "descricao": "Medicamento controlado sem registro de dispensação",  "criticidade": "critica",  "status": "aberta",  "prazo": "Jul/25"},
    {"id": "NC-006", "area": "Almoxarifado", "descricao": "Divergência inventário físico x sistema (> 5%)",     "criticidade": "alta",     "status": "em tratamento", "prazo": "Set/25"},
    {"id": "NC-007", "area": "RH",           "descricao": "Servidor sem avaliação de desempenho 2024",           "criticidade": "media",    "status": "em tratamento", "prazo": "Ago/25"},
    {"id": "NC-008", "area": "Licitações",   "descricao": "Ata de registro de preços vencida — ainda em uso",   "criticidade": "critica",  "status": "aberta",  "prazo": "Jul/25"},
]

HISTORICO = [
    {"trimestre": "Q3/2024", "auditorias": 4, "conformidade": 62.4, "nc_abertas": 42, "nc_atendidas": 18},
    {"trimestre": "Q4/2024", "auditorias": 5, "conformidade": 64.8, "nc_abertas": 38, "nc_atendidas": 22},
    {"trimestre": "Q1/2025", "auditorias": 5, "conformidade": 67.2, "nc_abertas": 36, "nc_atendidas": 24},
    {"trimestre": "Q2/2025", "auditorias": 7, "conformidade": 68.4, "nc_abertas": 34, "nc_atendidas": 28},
]

INDICADORES = [
    {"indicador": "Conformidade média",            "valor": "68.4%", "meta": "85%",  "status": "atencao"},
    {"indicador": "Auditorias realizadas/planej.", "valor": "12/18", "meta": "18/18","status": "atencao"},
    {"indicador": "NC críticas abertas",           "valor": 8,       "meta": "0",    "status": "critico"},
    {"indicador": "Recomendações atendidas",       "valor": "54.2%", "meta": "80%",  "status": "atencao"},
    {"indicador": "Prazo médio tratamento NC",     "valor": "62d",   "meta": "30d",  "status": "critico"},
    {"indicador": "Comitê auditoria ativo",        "valor": "Sim",   "meta": "Sim",  "status": "ok"},
]

@router.get("/dashboard")
def dashboard():           return DASHBOARD
@router.get("/auditorias")
def auditorias():          return AUDITORIAS
@router.get("/nao-conformidades")
def nao_conformidades():   return NAO_CONFORMIDADES
@router.get("/historico")
def historico():           return HISTORICO
@router.get("/indicadores")
def indicadores():         return INDICADORES
