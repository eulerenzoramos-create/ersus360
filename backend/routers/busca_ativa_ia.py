from fastapi import APIRouter
from typing import Optional
import random

router = APIRouter(prefix="/api/busca-ativa-ia", tags=["busca-ativa-ia"])

random.seed(99)

_CIDADAOS = [
    {
        "id": "c01", "nome": "Maria Aparecida Souza", "cns": "706 5023 4891 0001",
        "idade": 67, "microarea": "MA-01", "acs": "Francisca Lima",
        "score_prioridade": 94, "nivel": "critico",
        "motivos": [
            "HAS + DM sem consulta há 127 dias",
            "Exames laboratoriais vencidos (>6 meses)",
            "Mora sozinha — risco social elevado",
            "Histórico de internação em nov/2025",
        ],
        "ultima_visita": "2026-03-17", "dias_sem_visita": 128,
        "pendencias": [
            {"tipo": "PREVINE BRASIL", "descricao": "Hemoglobina glicada pendente — acompanhamento DM", "criticidade": "critica"},
            {"tipo": "PREVINE BRASIL", "descricao": "Pressão arterial não registrada no semestre", "criticidade": "critica"},
            {"tipo": "SIAPS", "descricao": "Renovação de receita de metformina vencida", "criticidade": "alta"},
            {"tipo": "CADSUS", "descricao": "Endereço desatualizado no cadastro", "criticidade": "media"},
        ],
        "telefone": "(97) 98423-1100",
    },
    {
        "id": "c02", "nome": "José Raimundo Ferreira", "cns": "706 5023 4891 0002",
        "idade": 72, "microarea": "MA-02", "acs": "Antônio Bentes",
        "score_prioridade": 89, "nivel": "critico",
        "motivos": [
            "DPOC com exacerbação recente (mai/2026)",
            "Sem visita ACS há 98 dias",
            "Não compareceu à consulta agendada",
            "Uso irregular de broncodilatador",
        ],
        "ultima_visita": "2026-04-16", "dias_sem_visita": 98,
        "pendencias": [
            {"tipo": "CONSULTA", "descricao": "Consulta médica não realizada — falta 3× consecutivas", "criticidade": "critica"},
            {"tipo": "SIAPS", "descricao": "Dispensação de medicamento DPOC em atraso", "criticidade": "alta"},
        ],
        "telefone": None,
    },
    {
        "id": "c03", "nome": "Ana Beatriz Rodrigues", "cns": "706 5023 4891 0003",
        "idade": 28, "microarea": "MA-01", "acs": "Francisca Lima",
        "score_prioridade": 82, "nivel": "critico",
        "motivos": [
            "Gestante de alto risco — 32 semanas sem consulta há 45 dias",
            "Pré-natal iniciado tardiamente (22ª semana)",
            "Ausência no SISPRENATAL",
        ],
        "ultima_visita": "2026-06-08", "dias_sem_visita": 45,
        "pendencias": [
            {"tipo": "PREVINE BRASIL", "descricao": "Consulta pré-natal do 3º trimestre pendente", "criticidade": "critica"},
            {"tipo": "SISPRENATAL", "descricao": "Registro incompleto — exames do 2º trimestre ausentes", "criticidade": "alta"},
        ],
        "telefone": "(97) 98100-2233",
    },
    {
        "id": "c04", "nome": "Carlos Eduardo Matos", "cns": "706 5023 4891 0004",
        "idade": 58, "microarea": "MA-03", "acs": "Rosa Viana",
        "score_prioridade": 74, "nivel": "alto",
        "motivos": [
            "HAS sem acompanhamento há 3 meses",
            "PA não aferida no semestre",
            "Tabagista ativo",
        ],
        "ultima_visita": "2026-05-10", "dias_sem_visita": 74,
        "pendencias": [
            {"tipo": "PREVINE BRASIL", "descricao": "Aferição de PA pendente — indicador B01", "criticidade": "alta"},
            {"tipo": "NASF", "descricao": "Encaminhamento para grupo de tabagismo não realizado", "criticidade": "media"},
        ],
        "telefone": "(97) 99300-4455",
    },
    {
        "id": "c05", "nome": "Francisca das Neves", "cns": "706 5023 4891 0005",
        "idade": 45, "microarea": "MA-02", "acs": "Antônio Bentes",
        "score_prioridade": 68, "nivel": "alto",
        "motivos": [
            "Citopatológico em atraso há 4 anos",
            "DM sem hemoglobina glicada no ano",
        ],
        "ultima_visita": "2026-06-01", "dias_sem_visita": 52,
        "pendencias": [
            {"tipo": "PREVINE BRASIL", "descricao": "Citopatológico cervical vencido (C02)", "criticidade": "alta"},
            {"tipo": "PREVINE BRASIL", "descricao": "Hemoglobina glicada pendente (C03)", "criticidade": "alta"},
        ],
        "telefone": "(97) 98555-6677",
    },
    {
        "id": "c06", "nome": "Pedro Henrique Costa", "cns": "706 5023 4891 0006",
        "idade": 8, "microarea": "MA-04", "acs": "Marlene Figueiredo",
        "score_prioridade": 61, "nivel": "alto",
        "motivos": [
            "Criança sem consulta de puericultura há 5 meses",
            "Vacinação com dose em atraso (tríplice viral)",
        ],
        "ultima_visita": "2026-05-25", "dias_sem_visita": 59,
        "pendencias": [
            {"tipo": "PREVINE BRASIL", "descricao": "Consulta de puericultura M01 pendente", "criticidade": "alta"},
            {"tipo": "PNI", "descricao": "Vacina tríplice viral 2ª dose em atraso", "criticidade": "alta"},
        ],
        "telefone": "(97) 98200-1122",
    },
    {
        "id": "c07", "nome": "Luiza Helena Pereira", "cns": "706 5023 4891 0007",
        "idade": 35, "microarea": "MA-03", "acs": "Rosa Viana",
        "score_prioridade": 42, "nivel": "medio",
        "motivos": [
            "Citopatológico com 2 anos de atraso",
            "Cadastro CADSUS incompleto",
        ],
        "ultima_visita": "2026-06-20", "dias_sem_visita": 33,
        "pendencias": [
            {"tipo": "PREVINE BRASIL", "descricao": "Citopatológico cervical 2 anos vencido", "criticidade": "media"},
            {"tipo": "CADSUS", "descricao": "Telefone e e-mail ausentes no cadastro", "criticidade": "baixa"},
        ],
        "telefone": None,
    },
    {
        "id": "c08", "nome": "Roberto Silva Lima", "cns": "706 5023 4891 0008",
        "idade": 51, "microarea": "MA-04", "acs": "Marlene Figueiredo",
        "score_prioridade": 35, "nivel": "medio",
        "motivos": [
            "HAS com última consulta há 4 meses (dentro do limite)",
            "PA aferida — sem pendências críticas",
        ],
        "ultima_visita": "2026-06-28", "dias_sem_visita": 25,
        "pendencias": [
            {"tipo": "PREVINE BRASIL", "descricao": "Consulta semestral próxima do vencimento (30 dias)", "criticidade": "media"},
        ],
        "telefone": "(97) 99100-8899",
    },
    {
        "id": "c09", "nome": "Tereza Cristina Barbosa", "cns": "706 5023 4891 0009",
        "idade": 62, "microarea": "MA-01", "acs": "Francisca Lima",
        "score_prioridade": 22, "nivel": "baixo",
        "motivos": [
            "DM e HAS com consultas em dia",
            "Citopatológico realizado em mar/2026",
        ],
        "ultima_visita": "2026-07-05", "dias_sem_visita": 18,
        "pendencias": [
            {"tipo": "CADSUS", "descricao": "Atualização de endereço recomendada", "criticidade": "baixa"},
        ],
        "telefone": "(97) 98700-3344",
    },
    {
        "id": "c10", "nome": "Antônio Jorge Nascimento", "cns": "706 5023 4891 0010",
        "idade": 40, "microarea": "MA-02", "acs": "Antônio Bentes",
        "score_prioridade": 14, "nivel": "baixo",
        "motivos": [
            "Cadastro ativo sem condições crônicas registradas",
            "Última visita recente — sem pendências",
        ],
        "ultima_visita": "2026-07-10", "dias_sem_visita": 13,
        "pendencias": [],
        "telefone": "(97) 99900-5566",
    },
]

# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/resumo")
def resumo():
    criticos = [c for c in _CIDADAOS if c["nivel"] == "critico"]
    altos    = [c for c in _CIDADAOS if c["nivel"] == "alto"]
    medios   = [c for c in _CIDADAOS if c["nivel"] == "medio"]
    baixos   = [c for c in _CIDADAOS if c["nivel"] == "baixo"]
    pend     = [c for c in _CIDADAOS if c["pendencias"]]
    sem90    = [c for c in _CIDADAOS if c["dias_sem_visita"] >= 90]
    return {
        "total_cidadaos":      len(_CIDADAOS),
        "criticos":            len(criticos),
        "alto":                len(altos),
        "medio":               len(medios),
        "baixo":               len(baixos),
        "com_visita_pendente": len(pend),
        "sem_contato_90d":     len(sem90),
        "ultima_atualizacao":  "2026-07-23T06:00:00",
    }

@router.get("/priorizada")
def priorizada(nivel: Optional[str] = None, microarea: Optional[str] = None):
    data = sorted(_CIDADAOS, key=lambda c: -c["score_prioridade"])
    if nivel and nivel != "todos":
        data = [c for c in data if c["nivel"] == nivel]
    if microarea and microarea != "todos":
        data = [c for c in data if c["microarea"] == microarea]
    return data

@router.post("/recalcular")
def recalcular():
    return {"ok": True, "mensagem": "Prioridades recalculadas com sucesso.", "total": len(_CIDADAOS)}
