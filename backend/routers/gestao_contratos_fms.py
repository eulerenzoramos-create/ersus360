from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/gestao-contratos-fms", tags=["gestao_contratos_fms"])

@lru_cache(maxsize=1)
def _CONTRATOS():
    return [
        {"numero": "CT-FMS-001/2025", "objeto": "Serviços médicos plantonistas UPA 24h",
         "fornecedor": "Cooperativa Médica Amazonas Ltda", "valor_total_r": 1_284_000,
         "valor_mensal_r": 107_000, "vigencia_fim": "2025-12-31", "execucao_pct": 58.4,
         "aditivos": 1, "tipo": "servico", "status": "ativo"},
        {"numero": "CT-FMS-002/2025", "objeto": "Fornecimento de medicamentos básicos (Lote A)",
         "fornecedor": "Distribuidora Saúde Norte Ltda", "valor_total_r": 684_000,
         "valor_mensal_r": 57_000, "vigencia_fim": "2025-12-31", "execucao_pct": 47.4,
         "aditivos": 0, "tipo": "fornecimento", "status": "ativo"},
        {"numero": "CT-FMS-003/2025", "objeto": "Locação de veículos (transporte sanitário)",
         "fornecedor": "Transporte Amazonas Eireli", "valor_total_r": 312_000,
         "valor_mensal_r": 26_000, "vigencia_fim": "2025-06-30", "execucao_pct": 100.0,
         "aditivos": 2, "tipo": "locacao", "status": "vencido"},
        {"numero": "CT-FMS-004/2025", "objeto": "Manutenção de equipamentos hospitalares",
         "fornecedor": "TechMed Serviços Ltda", "valor_total_r": 248_400,
         "valor_mensal_r": 20_700, "vigencia_fim": "2026-04-30", "execucao_pct": 72.1,
         "aditivos": 0, "tipo": "servico", "status": "ativo"},
        {"numero": "CT-FMS-005/2026", "objeto": "Implantação sistema gestão hospitalar (HIS)",
         "fornecedor": "SistemaSUS Tecnologia S.A.", "valor_total_r": 428_000,
         "valor_mensal_r": 35_667, "vigencia_fim": "2026-03-31", "execucao_pct": 28.4,
         "aditivos": 0, "tipo": "tecnologia", "status": "ativo"},
        {"numero": "CT-FMS-006/2025", "objeto": "Serviços de laboratório clínico (terceirizado)",
         "fornecedor": "BioAnálises Amazônia Ltda", "valor_total_r": 984_000,
         "valor_mensal_r": 82_000, "vigencia_fim": "2026-07-31", "execucao_pct": 83.2,
         "aditivos": 1, "tipo": "servico", "status": "ativo"},
        {"numero": "CT-FMS-007/2025", "objeto": "Fornecimento gases medicinais (O₂/CO₂/N₂O)",
         "fornecedor": "White Martins Gases Industriais", "valor_total_r": 184_800,
         "valor_mensal_r": 15_400, "vigencia_fim": "2025-08-31", "execucao_pct": 94.6,
         "aditivos": 0, "tipo": "fornecimento", "status": "ativo"},
    ]


@lru_cache(maxsize=1)
def _LICITACOES():
    return [
        {"modalidade": "Pregão Eletrônico", "numero": "PE-FMS-014/2026", "objeto": "Aquisição equipamentos fisioterapia (CER)",
         "valor_estimado_r": 284_000, "fase": "em_andamento", "data_abertura": "2026-07-22",
         "propostas_recebidas": 3, "status": "em_andamento"},
        {"modalidade": "Pregão Eletrônico", "numero": "PE-FMS-015/2026", "objeto": "Medicamentos básicos — 2º semestre 2026",
         "valor_estimado_r": 684_000, "fase": "homologado", "data_abertura": "2026-06-18",
         "propostas_recebidas": 5, "status": "homologado"},
        {"modalidade": "Dispensa de Licitação", "numero": "DL-FMS-042/2026", "objeto": "Imunobiológicos emergência (Influenza A)",
         "valor_estimado_r": 48_400, "fase": "concluido", "data_abertura": "2026-06-04",
         "propostas_recebidas": 2, "status": "concluido"},
        {"modalidade": "Tomada de Preços", "numero": "TP-FMS-003/2026", "objeto": "Reforma UBSF Igapó-Açu",
         "valor_estimado_r": 384_000, "fase": "aguardando_recurso", "data_abertura": "2026-07-01",
         "propostas_recebidas": 4, "status": "aguardando_recurso"},
        {"modalidade": "Pregão Eletrônico", "numero": "PE-FMS-016/2026", "objeto": "Sistema de prontuário eletrônico (renovação)",
         "valor_estimado_r": 128_000, "fase": "planejamento", "data_abertura": "2026-08-15",
         "propostas_recebidas": 0, "status": "planejamento"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan", "contratos_ativos": 14, "valor_contratos_r": 3_842_000, "licitacoes_abertas": 2, "economicidade_pct": 12.4},
        {"mes": "Fev", "contratos_ativos": 14, "valor_contratos_r": 3_842_000, "licitacoes_abertas": 3, "economicidade_pct": 14.8},
        {"mes": "Mar", "contratos_ativos": 15, "valor_contratos_r": 4_126_000, "licitacoes_abertas": 2, "economicidade_pct": 11.2},
        {"mes": "Abr", "contratos_ativos": 15, "valor_contratos_r": 4_126_000, "licitacoes_abertas": 4, "economicidade_pct": 16.4},
        {"mes": "Mai", "contratos_ativos": 14, "valor_contratos_r": 3_984_000, "licitacoes_abertas": 3, "economicidade_pct": 13.8},
        {"mes": "Jun", "contratos_ativos": 13, "valor_contratos_r": 3_784_000, "licitacoes_abertas": 5, "economicidade_pct": 15.2},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Contratos vencidos sem renovação", "valor": 1, "meta": 0, "unidade": "contratos",
         "status": "critico", "observacao": "CT-FMS-003/2025 (transporte sanitário) vencido — risco de paralisação"},
        {"indicador": "Economicidade média nas licitações", "valor": 15.2, "meta": 10.0, "unidade": "%",
         "status": "ok", "observacao": "15% abaixo do valor estimado em média — bom desempenho na fase competitiva"},
        {"indicador": "Contratos com aditivo de prazo/valor", "valor": 3, "meta": None, "unidade": "contratos",
         "status": "atencao", "observacao": "3 contratos com aditivos — verificar justificativas e limites legais (25%/50%)"},
        {"indicador": "Licitações com recurso pendente", "valor": 1, "meta": 0, "unidade": "processos",
         "status": "atencao", "observacao": "TP-FMS-003/2026 (reforma UBSF Igapó-Açu) aguardando julgamento de recurso"},
        {"indicador": "Valor total contratos FMS/ano", "valor": 4_124_400, "meta": None, "unidade": "R$",
         "status": "ok", "observacao": "R$ 4,1M em contratos ativos — 26,2% da despesa total de saúde"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "contratos_ativos": 13,
        "contratos_vencidos": 1,
        "valor_total_contratos_r": 4_124_400,
        "licitacoes_em_andamento": 2,
        "licitacoes_planejadas": 1,
        "economicidade_media_pct": 15.2,
        "contratos_com_aditivo": 3,
        "valor_empenhado_mes_r": 343_700,
    }


@router.get("/contratos")
def contratos():
    return _CONTRATOS


@router.get("/licitacoes")
def licitacoes():
    return _LICITACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
