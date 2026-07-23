# backend/routers/score_risco.py — Score de Risco Composto por Equipe ESF
from fastapi import APIRouter

router = APIRouter(prefix="/api/score-risco", tags=["score-risco"])

_EQUIPES = [
    {
        "id": "ESF1", "nome": "ESF I — UBS Centro",
        "score_risco": 72,   # 0=ótimo, 100=crítico
        "nivel_risco": "alto",
        "score_previne": 51,  # % atingimento médio indicadores
        "score_scnes": 64,
        "score_cadsus": 58,
        "score_siaps": 78,
        "tendencia": "piorando",
        "ultima_atualizacao": "2026-07-01 06:00",
        "dimensoes": [
            {"nome": "Previne Brasil", "score": 51, "peso": 35, "status": "critico", "contribuicao": 18, "detalhes": "C02 citopatológico em 41% (meta 80%) — crítico"},
            {"nome": "Conformidade SCNES", "score": 64, "peso": 25, "status": "atencao", "contribuicao": 16, "detalhes": "Carga horária e formação com pendências em 3 profissionais"},
            {"nome": "Qualidade CADSUS", "score": 58, "peso": 20, "status": "atencao", "contribuicao": 12, "detalhes": "Microáreas 1A e 1B com CNS inválidos > 8%"},
            {"nome": "Transmissão SIAPS", "score": 78, "peso": 20, "status": "bom", "contribuicao": 16, "detalhes": "Taxa de rejeição 6.2% — dentro do limite"},
        ],
        "alertas": [
            {"tipo": "critico", "mensagem": "Cobertura citopatológica em 41% — meta 80% — risco de perda APQ", "acao": "Agendar mutirão de coleta para agosto — meta 80 coletas"},
            {"tipo": "alto",    "mensagem": "SCNES com pendência em carga horária médica", "acao": "Regularizar carga horária no CNES até 30/07"},
            {"tipo": "medio",   "mensagem": "6% de CNS inválidos nas microáreas 1A e 1B", "acao": "Atualização cadastral nas 2 microáreas prioritárias"},
        ],
    },
    {
        "id": "ESF2", "nome": "ESF II — UBS Castanhal",
        "score_risco": 58,
        "nivel_risco": "medio",
        "score_previne": 63,
        "score_scnes": 81,
        "score_cadsus": 72,
        "score_siaps": 91,
        "tendencia": "estavel",
        "ultima_atualizacao": "2026-07-01 06:00",
        "dimensoes": [
            {"nome": "Previne Brasil", "score": 63, "peso": 35, "status": "atencao", "contribuicao": 22, "detalhes": "Diabéticos acompanhados em 53% (meta 70%)"},
            {"nome": "Conformidade SCNES", "score": 81, "peso": 25, "status": "bom", "contribuicao": 20, "detalhes": "Todos os profissionais com carga horária regularizada"},
            {"nome": "Qualidade CADSUS", "score": 72, "peso": 20, "status": "atencao", "contribuicao": 14, "detalhes": "Microárea 2C com desatualização > 180 dias em 12%"},
            {"nome": "Transmissão SIAPS", "score": 91, "peso": 20, "status": "bom", "contribuicao": 18, "detalhes": "Rejeição 2.1% — excelente"},
        ],
        "alertas": [
            {"tipo": "medio",   "mensagem": "Acompanhamento de DM2 abaixo de 70% da meta", "acao": "Ativar grupo DM2 com reunião mensal e controle glicêmico"},
            {"tipo": "baixo",   "mensagem": "Microárea 2C com cadastros > 180 dias sem atualização", "acao": "ACS responsável pela 2C priorizar atualização em agosto"},
        ],
    },
    {
        "id": "ESF3", "nome": "ESF III — UBS Zona Rural",
        "score_risco": 85,
        "nivel_risco": "critico",
        "score_previne": 44,
        "score_scnes": 55,
        "score_cadsus": 49,
        "score_siaps": 68,
        "tendencia": "piorando",
        "ultima_atualizacao": "2026-07-01 06:00",
        "dimensoes": [
            {"nome": "Previne Brasil", "score": 44, "peso": 35, "status": "critico", "contribuicao": 15, "detalhes": "4 de 6 indicadores abaixo de 70% da meta — cobertura baixa"},
            {"nome": "Conformidade SCNES", "score": 55, "peso": 25, "status": "critico", "contribuicao": 14, "detalhes": "Médico sem registro ativo no CNES há 45 dias"},
            {"nome": "Qualidade CADSUS", "score": 49, "peso": 20, "status": "critico", "contribuicao": 10, "detalhes": "3 microáreas rurais com > 20% de CNS inválidos"},
            {"nome": "Transmissão SIAPS", "score": 68, "peso": 20, "status": "atencao", "contribuicao": 14, "detalhes": "Rejeição 9.4% — acima do limite de 8%"},
        ],
        "alertas": [
            {"tipo": "critico", "mensagem": "Médico da equipe sem registro ativo no CNES — risco de descredenciamento", "acao": "Regularizar CRM e cadastro CNES imediatamente — prazo: 7 dias"},
            {"tipo": "critico", "mensagem": "Apenas 44% dos indicadores Previne Brasil com atingimento ≥70%", "acao": "Plano de ação de 90 dias com metas por indicador — reunião de equipe urgente"},
            {"tipo": "alto",    "mensagem": "Taxa de rejeição SIAPS em 9.4% (limite: 8%)", "acao": "Revisar fichas CDS de visita domiciliar — erros de campo obrigatório"},
            {"tipo": "alto",    "mensagem": "49% das microáreas rurais com CNS inválidos > 20%", "acao": "Mutirão de atualização cadastral nas comunidades rurais em agosto"},
        ],
    },
    {
        "id": "ESF4", "nome": "ESF IV — UBS Nova Esperança",
        "score_risco": 38,
        "nivel_risco": "baixo",
        "score_previne": 82,
        "score_scnes": 91,
        "score_cadsus": 88,
        "score_siaps": 95,
        "tendencia": "melhorando",
        "ultima_atualizacao": "2026-07-01 06:00",
        "dimensoes": [
            {"nome": "Previne Brasil", "score": 82, "peso": 35, "status": "bom", "contribuicao": 29, "detalhes": "5 de 6 indicadores acima da meta — destaque em saúde infantil"},
            {"nome": "Conformidade SCNES", "score": 91, "peso": 25, "status": "bom", "contribuicao": 23, "detalhes": "Todos os profissionais com registro e carga horária OK"},
            {"nome": "Qualidade CADSUS", "score": 88, "peso": 20, "status": "bom", "contribuicao": 18, "detalhes": "Completude cadastral 94% — melhor do município"},
            {"nome": "Transmissão SIAPS", "score": 95, "peso": 20, "status": "bom", "contribuicao": 19, "detalhes": "Rejeição 0.8% — referência do município"},
        ],
        "alertas": [
            {"tipo": "baixo", "mensagem": "Indicador C02 (citopatológico) em 68% — abaixo da meta de 80%", "acao": "Priorizar coletas de Papanicolau para mulheres 40-50 anos não rastreadas"},
        ],
    },
    {
        "id": "ESF5", "nome": "ESF V — Equipe Ribeirinha",
        "score_risco": 61,
        "nivel_risco": "medio",
        "score_previne": 57,
        "score_scnes": 72,
        "score_cadsus": 61,
        "score_siaps": 74,
        "tendencia": "estavel",
        "ultima_atualizacao": "2026-07-01 06:00",
        "dimensoes": [
            {"nome": "Previne Brasil", "score": 57, "peso": 35, "status": "atencao", "contribuicao": 20, "detalhes": "Acesso geográfico limita acompanhamento — 3 indicadores entre 50-70%"},
            {"nome": "Conformidade SCNES", "score": 72, "peso": 25, "status": "atencao", "contribuicao": 18, "detalhes": "ACS ribeirinho sem comprovante de área de atuação atualizado"},
            {"nome": "Qualidade CADSUS", "score": 61, "peso": 20, "status": "atencao", "contribuicao": 12, "detalhes": "Endereços rurais em formato não padronizado — afeta georreferenciamento"},
            {"nome": "Transmissão SIAPS", "score": 74, "peso": 20, "status": "atencao", "contribuicao": 15, "detalhes": "Rejeição 7.8% — próximo do limite de 8%"},
        ],
        "alertas": [
            {"tipo": "medio",   "mensagem": "Acompanhamento de hipertensos ribeirinhos em 48% (meta 70%)", "acao": "Criar rota de atendimento mensal nas comunidades ribeirinhas — barco UBS itinerante"},
            {"tipo": "medio",   "mensagem": "Rejeição SIAPS em 7.8% — próxima do limite", "acao": "Revisar fichas de procedimento e fichas de visita domiciliar"},
            {"tipo": "baixo",   "mensagem": "Endereços sem padronização de logradouro", "acao": "Usar código IBGE de setor censitário para endereços rurais"},
        ],
    },
]


@router.get("/resumo")
def resumo():
    scores = [e["score_risco"] for e in _EQUIPES]
    return {
        "total_equipes": len(_EQUIPES),
        "criticas": sum(1 for e in _EQUIPES if e["nivel_risco"] == "critico"),
        "alto_risco": sum(1 for e in _EQUIPES if e["nivel_risco"] == "alto"),
        "medio_risco": sum(1 for e in _EQUIPES if e["nivel_risco"] == "medio"),
        "baixo_risco": sum(1 for e in _EQUIPES if e["nivel_risco"] == "baixo"),
        "score_medio_municipio": round(sum(scores) / len(scores), 1),
        "equipe_mais_critica": next(e["nome"] for e in sorted(_EQUIPES, key=lambda x: -x["score_risco"])),
        "ultima_atualizacao": "2026-07-01 06:00 (cron mensal)",
    }


@router.get("/equipes")
def listar_equipes():
    return _EQUIPES


@router.post("/recalcular")
def recalcular():
    return {"ok": True, "mensagem": "Scores recalculados com dados atualizados de Previne Brasil, SCNES, CADSUS e SIAPS."}
