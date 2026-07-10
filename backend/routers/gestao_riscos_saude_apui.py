"""Gestão de Riscos em Saúde — Matriz de Riscos SMS Apuí/AM"""
from fastapi import APIRouter
router = APIRouter(prefix="/api/gestao-riscos-saude-apui", tags=["Gestão de Riscos Apuí"])

DASHBOARD = {
    "riscos_mapeados": 34,
    "riscos_criticos": 8,
    "riscos_altos": 12,
    "riscos_medios": 10,
    "riscos_baixos": 4,
    "planos_acao_ativos": 18,
    "planos_concluidos": 6,
    "indice_risco_medio": 6.4,
    "meta_indice": 4.0,
    "status": "critico",
}

MATRIZ = [
    {"categoria": "Financeiro",          "risco": "Insuficiência de repasses FNS",             "probabilidade": 4, "impacto": 5, "nivel": "critico",  "plano": "Diversificação de fontes + monitoramento mensal"},
    {"categoria": "Financeiro",          "risco": "Inadimplência de fornecedores",              "probabilidade": 3, "impacto": 4, "nivel": "alto",     "plano": "Cadastro de fornecedores homologados"},
    {"categoria": "RH / Pessoal",        "risco": "Alta rotatividade de médicos SF",            "probabilidade": 5, "impacto": 5, "nivel": "critico",  "plano": "Plano de fixação (moradia + incentivo)"},
    {"categoria": "RH / Pessoal",        "risco": "Déficit de especialistas (psicólogo, nutricionista)", "probabilidade": 5, "impacto": 4, "nivel": "critico", "plano": "Convênio com UFAM / Telessaúde"},
    {"categoria": "Infraestrutura",      "risco": "Falta de equipamentos de diagnóstico",       "probabilidade": 4, "impacto": 4, "nivel": "critico",  "plano": "Emenda parlamentar + consórcio"},
    {"categoria": "Infraestrutura",      "risco": "Interrupção do fornecimento de energia",     "probabilidade": 3, "impacto": 5, "nivel": "critico",  "plano": "Gerador + UPS nas UBS"},
    {"categoria": "Epidemiológico",      "risco": "Surto de malária (sazonalidade)",            "probabilidade": 4, "impacto": 5, "nivel": "critico",  "plano": "Vigilância semanal + IRS preventivo"},
    {"categoria": "Epidemiológico",      "risco": "Epidemia de dengue (nov-abr)",               "probabilidade": 4, "impacto": 4, "nivel": "critico",  "plano": "Bloqueio vetorial + DSEI + mutirões"},
    {"categoria": "Logística",           "risco": "Interrupção do abastecimento de medicamentos","probabilidade": 3, "impacto": 5, "nivel": "alto",     "plano": "Estoque estratégico 90 dias (REME)"},
    {"categoria": "Logística",           "risco": "Deterioração da frota de veículos",          "probabilidade": 4, "impacto": 4, "nivel": "alto",     "plano": "Manutenção preventiva semestral"},
    {"categoria": "Regulatório",         "risco": "Irregularidades em contratos (TCE-AM)",      "probabilidade": 3, "impacto": 5, "nivel": "alto",     "plano": "Auditoria interna trimestral"},
    {"categoria": "Digital / Dados",     "risco": "Perda de dados do e-SUS PEC",               "probabilidade": 2, "impacto": 5, "nivel": "alto",     "plano": "Backup diário + nuvem"},
]

PLANOS = [
    {"risco": "Alta rotatividade médicos",       "acao": "Plano de fixação c/ moradia funcional", "responsavel": "Secretária", "prazo": "Dez/2025", "status": "andamento"},
    {"risco": "Surto malária",                   "acao": "Protocolo resposta rápida atualizado",  "responsavel": "VIGIEP",     "prazo": "Ago/2025", "status": "concluido"},
    {"risco": "Abastecimento medicamentos",      "acao": "Estoque estratégico 90 dias",            "responsavel": "Farmácia",   "prazo": "Set/2025", "status": "andamento"},
    {"risco": "Energia UBS",                     "acao": "Aquisição geradores",                    "responsavel": "Infra",      "prazo": "Nov/2025", "status": "pendente"},
    {"risco": "Contratos TCE",                   "acao": "Auditoria interna Q3/2025",              "responsavel": "Controle",   "prazo": "Set/2025", "status": "andamento"},
    {"risco": "Perda dados e-SUS",               "acao": "Backup automático nuvem",                "responsavel": "TI",         "prazo": "Ago/2025", "status": "concluido"},
]

HISTORICO = [
    {"trimestre": "Q3/2024", "mapeados": 28, "criticos": 10, "resolvidos": 2, "indice": 7.1},
    {"trimestre": "Q4/2024", "mapeados": 30, "criticos": 9,  "resolvidos": 3, "indice": 6.8},
    {"trimestre": "Q1/2025", "mapeados": 32, "criticos": 9,  "resolvidos": 4, "indice": 6.6},
    {"trimestre": "Q2/2025", "mapeados": 34, "criticos": 8,  "resolvidos": 6, "indice": 6.4},
]

INDICADORES = [
    {"indicador": "Riscos críticos ativos",        "valor": 8,     "meta": "≤ 3",  "status": "critico"},
    {"indicador": "Planos de ação ativos",          "valor": 18,    "meta": 34,     "status": "atencao"},
    {"indicador": "Taxa resolução (acum.)",         "valor": "36%", "meta": "60%",  "status": "atencao"},
    {"indicador": "Índice risco médio",             "valor": 6.4,   "meta": 4.0,    "status": "critico"},
    {"indicador": "Revisão matriz (trimestral)",    "valor": "Sim", "meta": "Sim",  "status": "ok"},
    {"indicador": "Comitê de riscos implantado",    "valor": "Não", "meta": "Sim",  "status": "atencao"},
]

@router.get("/dashboard")
def dashboard():    return DASHBOARD
@router.get("/matriz")
def matriz():        return MATRIZ
@router.get("/planos")
def planos():        return PLANOS
@router.get("/historico")
def historico():     return HISTORICO
@router.get("/indicadores")
def indicadores():   return INDICADORES
