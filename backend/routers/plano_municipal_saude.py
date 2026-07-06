from fastapi import APIRouter

router = APIRouter(prefix="/api/plano-municipal-saude", tags=["plano_municipal_saude"])

_EIXOS = [
    {
        "eixo": "1 — Atenção à Saúde",
        "metas_total": 28, "metas_cumpridas": 11, "metas_em_andamento": 12, "metas_nao_iniciadas": 3, "metas_atrasadas": 2,
        "percentual_cumprimento": 39.3, "status": "critico",
        "destaques": ["Cobertura APS 72% (meta 95%)", "ICSAP acima da média nacional", "ESF sem médico: 3 equipes"],
    },
    {
        "eixo": "2 — Vigilância em Saúde",
        "metas_total": 14, "metas_cumpridas": 7, "metas_em_andamento": 5, "metas_nao_iniciadas": 1, "metas_atrasadas": 1,
        "percentual_cumprimento": 50.0, "status": "atencao",
        "destaques": ["Boletim semanal em dia", "Surtos com investigação oportuna: 66%", "SINAN pendências acima de 60d"],
    },
    {
        "eixo": "3 — Gestão em Saúde",
        "metas_total": 18, "metas_cumpridas": 9, "metas_em_andamento": 7, "metas_nao_iniciadas": 1, "metas_atrasadas": 1,
        "percentual_cumprimento": 50.0, "status": "atencao",
        "destaques": ["PEC implantado 87,5%", "Folha acima do limite prudencial", "CIS/CONASS filiado"],
    },
    {
        "eixo": "4 — Participação e Controle Social",
        "metas_total": 8, "metas_cumpridas": 6, "metas_em_andamento": 2, "metas_nao_iniciadas": 0, "metas_atrasadas": 0,
        "percentual_cumprimento": 75.0, "status": "ok",
        "destaques": ["CMS com reuniões mensais em dia", "8ª Conferência Municipal realizada", "Ouvidoria ativa"],
    },
    {
        "eixo": "5 — Saneamento e Saúde Ambiental",
        "metas_total": 10, "metas_cumpridas": 2, "metas_em_andamento": 4, "metas_nao_iniciadas": 2, "metas_atrasadas": 2,
        "percentual_cumprimento": 20.0, "status": "critico",
        "destaques": ["Água tratada 75,3% (meta 99%)", "Esgoto 28,4% (meta 90%)", "Sem programa mercúrio garimpo"],
    },
]

_METAS_DESTAQUE = [
    {"meta": "Cobertura APS ≥95% da população", "eixo": "Atenção à Saúde", "prazo": "Dez/2025",
     "baseline": "68%", "atual": "72%", "meta_valor": "95%", "progresso_pct": 4.0, "status": "critico"},
    {"meta": "Reduzir mortalidade infantil para <12/1.000NV", "eixo": "Atenção à Saúde", "prazo": "Dez/2025",
     "baseline": "18.4", "atual": "16.2", "meta_valor": "12/1000NV", "progresso_pct": 34.7, "status": "critico"},
    {"meta": "100% das notificações SINAN encerradas ≤60d", "eixo": "Vigilância", "prazo": "Dez/2025",
     "baseline": "72%", "atual": "79.4%", "meta_valor": "100%", "progresso_pct": 26.4, "status": "critico"},
    {"meta": "Cobertura vacinal ≥95% para todas as vacinas", "eixo": "Atenção à Saúde", "prazo": "Dez/2025",
     "baseline": "78%", "atual": "83.4%", "meta_valor": "95%", "progresso_pct": 31.2, "status": "critico"},
    {"meta": "Prontuário eletrônico 100% dos profissionais", "eixo": "Gestão", "prazo": "Dez/2025",
     "baseline": "72%", "atual": "87.5%", "meta_valor": "100%", "progresso_pct": 55.2, "status": "atencao"},
    {"meta": "Água tratada ≥99% da população", "eixo": "Saneamento", "prazo": "Dez/2025",
     "baseline": "68%", "atual": "75.3%", "meta_valor": "99%", "progresso_pct": 23.5, "status": "critico"},
    {"meta": "Implantação do CEO municipal", "eixo": "Atenção à Saúde", "prazo": "Jun/2025",
     "baseline": "0", "atual": "1", "meta_valor": "1 unidade", "progresso_pct": 100.0, "status": "ok"},
    {"meta": "CMS com 100% das reuniões ordinárias realizadas", "eixo": "Controle Social", "prazo": "Dez/2025",
     "baseline": "83%", "atual": "100%", "meta_valor": "100%", "progresso_pct": 100.0, "status": "ok"},
]

_HISTORICO_MONITORAMENTO = [
    {"quadrimestre": "1º Q/2024", "metas_avaliadas": 78, "cumpridas_pct": 32.1, "em_andamento_pct": 44.9, "atrasadas_pct": 23.0},
    {"quadrimestre": "2º Q/2024", "metas_avaliadas": 78, "cumpridas_pct": 35.9, "em_andamento_pct": 43.6, "atrasadas_pct": 20.5},
    {"quadrimestre": "3º Q/2024", "metas_avaliadas": 78, "cumpridas_pct": 38.5, "em_andamento_pct": 42.3, "atrasadas_pct": 19.2},
    {"quadrimestre": "4º Q/2024", "metas_avaliadas": 78, "cumpridas_pct": 41.0, "em_andamento_pct": 41.0, "atrasadas_pct": 18.0},
    {"quadrimestre": "1º Q/2025", "metas_avaliadas": 78, "cumpridas_pct": 43.6, "em_andamento_pct": 39.7, "atrasadas_pct": 16.7},
    {"quadrimestre": "2º Q/2025", "metas_avaliadas": 78, "cumpridas_pct": 44.9, "em_andamento_pct": 39.7, "atrasadas_pct": 15.4},
]

_INDICADORES = [
    {"indicador": "Metas do PMS cumpridas", "valor": 44.9, "meta": 100.0, "unidade": "%",
     "status": "critico", "observacao": "Apenas 35 de 78 metas cumpridas — PMS 2022-2025 com risco de não cumprimento"},
    {"indicador": "Eixo Saneamento (pior)", "valor": 20.0, "meta": 100.0, "unidade": "%",
     "status": "critico", "observacao": "1 de 5 eixos com cumprimento abaixo de 30% — saneamento é o maior gargalo"},
    {"indicador": "Metas atrasadas/vencidas", "valor": 6, "meta": 0, "unidade": "metas",
     "status": "critico", "observacao": "6 metas com prazo vencido ou em descumprimento crítico — necessária repactuação"},
    {"indicador": "Relatório Anual de Gestão", "valor": 1, "meta": 1, "unidade": "aprovado CMS",
     "status": "ok", "observacao": "RAG 2024 aprovado pelo CMS em março/2025 — conformidade mantida"},
    {"indicador": "Monitoramento quadrimestral", "valor": 6, "meta": 6, "unidade": "RADCs realizados",
     "status": "ok", "observacao": "Todos os Relatórios de Avaliação Detalhada quadrimestrais realizados"},
]


@router.get("/dashboard")
def dashboard():
    return {
        "periodo": "2022–2025",
        "eixos_total": 5,
        "metas_total": 78,
        "metas_cumpridas": 35,
        "metas_em_andamento": 30,
        "metas_atrasadas": 6,
        "metas_nao_iniciadas": 7,
        "percentual_cumprimento_geral": 44.9,
        "conferencia_realizada": True,
        "rag_aprovado": True,
        "radc_em_dia": True,
    }


@router.get("/eixos")
def eixos():
    return _EIXOS


@router.get("/metas-destaque")
def metas_destaque():
    return _METAS_DESTAQUE


@router.get("/historico-monitoramento")
def historico_monitoramento():
    return _HISTORICO_MONITORAMENTO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
