"""Gestão da Qualidade — Acreditação · Indicadores · Auditorias · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/gestao-qualidade", tags=["gestao_qualidade"])

@router.get("/dashboard")
async def dashboard():
    return {
        "nivel_acreditacao": "Nível 1 — ONA",
        "score_qualidade": 72.4,
        "meta_score": 80.0,
        "auditorias_mes": 3,
        "nao_conformidades_abertas": 18,
        "nao_conformidades_criticas": 4,
        "acoes_corretivas_pendentes": 11,
        "indicadores_qualidade_monitorados": 28,
        "indicadores_meta_atingida_pct": 53.6,
        "satisfacao_usuario_pct": 76.8,
        "meta_satisfacao_pct": 85,
        "status_geral": "atencao",
        "reacreditacao_prevista": "Nov/26",
        "protocolos_vigentes": 42,
        "protocolos_vencidos": 6,
    }

@router.get("/indicadores-qualidade")
async def indicadores_qualidade():
    return [
        {"indicador": "Taxa de mortalidade hospitalar",        "valor": 2.8,  "meta": 3.0,  "unidade": "%",    "area": "Assistencial",   "status": "ok",      "tendencia": "queda"},
        {"indicador": "Taxa de infecção hospitalar (IRAS)",    "valor": 3.2,  "meta": 2.0,  "unidade": "%",    "area": "Segurança",      "status": "critico", "tendencia": "estavel"},
        {"indicador": "Densidade ICS/1.000 cateter-dia",       "valor": 6.4,  "meta": 4.0,  "unidade": "‰",    "area": "Segurança",      "status": "critico", "tendencia": "alta"},
        {"indicador": "Reinternação em 30 dias",               "valor": 8.4,  "meta": 6.0,  "unidade": "%",    "area": "Assistencial",   "status": "atencao", "tendencia": "estavel"},
        {"indicador": "Cirurgias suspensas no dia",            "valor": 4.2,  "meta": 2.0,  "unidade": "%",    "area": "Cirúrgico",      "status": "atencao", "tendencia": "queda"},
        {"indicador": "Satisfação do usuário",                 "valor": 76.8, "meta": 85,   "unidade": "%",    "area": "Experiência",    "status": "atencao", "tendencia": "alta"},
        {"indicador": "Cumprimento de protocolos clínicos",    "valor": 68.4, "meta": 80,   "unidade": "%",    "area": "Assistencial",   "status": "atencao", "tendencia": "alta"},
        {"indicador": "Higienização de mãos (adesão)",        "valor": 74.2, "meta": 85,   "unidade": "%",    "area": "Segurança",      "status": "atencao", "tendencia": "alta"},
        {"indicador": "Identificação correta do paciente",    "valor": 92.6, "meta": 99,   "unidade": "%",    "area": "Segurança",      "status": "atencao", "tendencia": "estavel"},
        {"indicador": "Erros de medicação notificados",       "valor": 6,    "meta": 4,    "unidade": "un",   "area": "Segurança",      "status": "atencao", "tendencia": "queda"},
        {"indicador": "Alta médica até 12h",                  "valor": 64.8, "meta": 80,   "unidade": "%",    "area": "Fluxo",          "status": "atencao", "tendencia": "alta"},
        {"indicador": "Tempo médio internação",               "valor": 5.8,  "meta": 5.0,  "unidade": "dias", "area": "Fluxo",          "status": "atencao", "tendencia": "estavel"},
    ]

@router.get("/auditorias")
async def auditorias():
    return [
        {"auditoria": "Auditoria de prontuários — APS",         "data": "15/03/26", "prontuarios": 48, "conformes": 36, "pct": 75.0, "nc_criticas": 1, "status": "concluida", "responsavel": "Coordenação APS"},
        {"auditoria": "Auditoria de medicamentos — farmácia",   "data": "20/03/26", "prontuarios": 0,  "conformes": 0,  "pct": 82.4, "nc_criticas": 2, "status": "concluida", "responsavel": "Farmacêutico"},
        {"auditoria": "Auditoria CCIH — bundles UTI",           "data": "25/03/26", "prontuarios": 12, "conformes": 9,  "pct": 75.0, "nc_criticas": 1, "status": "concluida", "responsavel": "CCIH"},
        {"auditoria": "Auditoria de faturamento APAC/BPA",      "data": "28/03/26", "prontuarios": 64, "conformes": 58, "pct": 90.6, "nc_criticas": 0, "status": "concluida", "responsavel": "Faturamento"},
        {"auditoria": "Auditoria de segurança do paciente",     "data": "05/04/26", "prontuarios": 0,  "conformes": 0,  "pct": 0,    "nc_criticas": 0, "status": "agendada",  "responsavel": "Núcleo Qualidade"},
        {"auditoria": "Auditoria interna — bloco cirúrgico",    "data": "12/04/26", "prontuarios": 0,  "conformes": 0,  "pct": 0,    "nc_criticas": 0, "status": "agendada",  "responsavel": "Núcleo Qualidade"},
    ]

@router.get("/nao-conformidades")
async def nao_conformidades():
    return [
        {"id": "NQ-001", "descricao": "Protocolo de identificação do paciente desatualizado", "area": "Segurança",  "gravidade": "critica", "data_abertura": "02/03/26", "responsavel": "Enfermagem", "prazo": "02/04/26", "status": "atrasada"},
        {"id": "NQ-002", "descricao": "Ausência de check-list cirúrgico em 3 prontuários",   "area": "Cirúrgico",  "gravidade": "critica", "data_abertura": "10/03/26", "responsavel": "CME",        "prazo": "10/04/26", "status": "em_andamento"},
        {"id": "NQ-003", "descricao": "Registro incompleto de intercorrências na UTI",        "area": "UTI",        "gravidade": "critica", "data_abertura": "15/03/26", "responsavel": "Médico UTI", "prazo": "15/04/26", "status": "em_andamento"},
        {"id": "NQ-004", "descricao": "Falta de sinalização de saída de emergência",          "area": "Estrutura",  "gravidade": "critica", "data_abertura": "18/03/26", "responsavel": "Infraestrutura","prazo":"01/04/26","status": "atrasada"},
        {"id": "NQ-005", "descricao": "Temperatura da geladeira de medicamentos fora do limite","area": "Farmácia","gravidade": "maior",   "data_abertura": "20/03/26", "responsavel": "Farmácia",   "prazo": "25/03/26", "status": "concluida"},
        {"id": "NQ-006", "descricao": "Ausência de política de privacidade no prontuário",    "area": "Ética",      "gravidade": "maior",   "data_abertura": "22/03/26", "responsavel": "Direção",    "prazo": "22/04/26", "status": "aberta"},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Score geral de qualidade",           "valor": 72.4, "meta": 80,  "unidade": "%", "status": "atencao", "observacao": "ONA nível 1 — próxima reacreditação Nov/26"},
        {"indicador": "Indicadores com meta atingida",      "valor": 53.6, "meta": 70,  "unidade": "%", "status": "atencao", "observacao": "15 de 28 indicadores OK"},
        {"indicador": "NC críticas abertas",                "valor": 4,    "meta": 0,   "unidade": "un","status": "critico", "observacao": "2 com prazo vencido"},
        {"indicador": "Protocolos vencidos",                "valor": 6,    "meta": 0,   "unidade": "un","status": "atencao", "observacao": "Revisão pendente"},
        {"indicador": "Satisfação do usuário",              "valor": 76.8, "meta": 85,  "unidade": "%", "status": "atencao", "observacao": "Tempo espera principal queixa"},
        {"indicador": "Auditorias realizadas no mês",       "valor": 3,    "meta": 4,   "unidade": "un","status": "atencao", "observacao": "1 agendada para abril"},
    ]
