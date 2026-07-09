from fastapi import APIRouter

router = APIRouter(prefix="/api/politica-prevencao-apui", tags=["Política de Prevenção Apuí"])

@router.get("/dashboard")
def dashboard():
    return {
        "rastreios_ativos": 8,
        "rastreios_na_meta": 2,
        "cobertura_media_rastreios_pct": 54.6,
        "preventivo_colo_pct": 68.4,
        "meta_preventivo_pct": 80.0,
        "mamografia_local": False,
        "mamografia_espera_meses": 8.2,
        "rastreio_dm_pct": 64.8,
        "rastreio_has_pct": 78.2,
        "tabagismo_cessacao_pct": 18.4,
        "glaucoma_rastreio_disponivel": False,
        "ca_colorretal_rastreio_disponivel": False,
        "status_prevencao": "atencao",
        "consultas_preventivas_pct": 38.4,
    }

@router.get("/rastreios")
def rastreios():
    return [
        {"programa": "Preventivo câncer de colo (Papanicolau)",
         "cobertura_pct": 68.4, "meta_pct": 80.0, "disponivel_local": True,
         "periodicidade": "Anual (25–64 anos)", "status": "atencao",
         "obstaculo": "Colposcopia indisponível — referência Manaus"},
        {"programa": "Mamografia câncer de mama",
         "cobertura_pct": 34.2, "meta_pct": 70.0, "disponivel_local": False,
         "periodicidade": "Bienal (50–69 anos)", "status": "critico",
         "obstaculo": "Equipamento inexistente; espera 8.2 meses para Manaus"},
        {"programa": "Rastreio hipertensão arterial (HAS)",
         "cobertura_pct": 78.2, "meta_pct": 90.0, "disponivel_local": True,
         "periodicidade": "Rotina APS", "status": "atencao",
         "obstaculo": "18.4% da população adulta sem aferição nos últimos 12 meses"},
        {"programa": "Rastreio diabetes mellitus (DM)",
         "cobertura_pct": 64.8, "meta_pct": 90.0, "disponivel_local": True,
         "periodicidade": "Anual (adultos com fatores de risco)", "status": "critico",
         "obstaculo": "Glicemia de jejum não protocolada para toda população adulta"},
        {"programa": "Cessação do tabagismo (PNCT)",
         "cobertura_pct": 18.4, "meta_pct": 50.0, "disponivel_local": True,
         "periodicidade": "Grupos bimestrais", "status": "critico",
         "obstaculo": "Apenas 1 grupo ativo; sem terapia medicamentosa regular"},
        {"programa": "Glaucoma e acuidade visual",
         "cobertura_pct": 0, "meta_pct": 60.0, "disponivel_local": False,
         "periodicidade": "N/A — sem programa", "status": "critico",
         "obstaculo": "Oftalmologista ausente; sem tonômetro no município"},
        {"programa": "Câncer colorretal (sangue oculto)",
         "cobertura_pct": 0, "meta_pct": 50.0, "disponivel_local": False,
         "periodicidade": "N/A — sem programa", "status": "critico",
         "obstaculo": "Colonoscopia indisponível; kit de sangue oculto fora da lista local"},
        {"programa": "Saúde bucal preventiva (selantes/fluoreto)",
         "cobertura_pct": 38.4, "meta_pct": 80.0, "disponivel_local": True,
         "periodicidade": "Anual (0–12 anos)", "status": "critico",
         "obstaculo": "Cobertura de saúde bucal insuficiente (2 CD/7 equipes)"},
    ]

@router.get("/programas")
def programas():
    return [
        {"programa": "PNCT — Programa Nacional de Controle do Tabagismo",
         "implantado": True, "grupos_ativos": 1, "pacientes": 28,
         "medicamento_disponivel": False, "status": "atencao"},
        {"programa": "PAAS — Alimentação Saudável e Atividade Física",
         "implantado": True, "grupos_ativos": 2, "pacientes": 184,
         "medicamento_disponivel": None, "status": "atencao"},
        {"programa": "PNPIC — Práticas Integrativas (fitoterapia/acupuntura)",
         "implantado": False, "grupos_ativos": 0, "pacientes": 0,
         "medicamento_disponivel": False, "status": "critico"},
        {"programa": "Prevenção cardiovascular — Estratificação de risco",
         "implantado": True, "grupos_ativos": 3, "pacientes": 284,
         "medicamento_disponivel": True, "status": "atencao"},
        {"programa": "PMAQ — Acesso e qualidade APS",
         "implantado": True, "grupos_ativos": 7, "pacientes": None,
         "medicamento_disponivel": None, "status": "atencao"},
    ]

@router.get("/historico")
def historico():
    return [
        {"ano": 2022, "preventivo_pct": 58.4, "rastreio_dm_pct": 52.4, "rastreio_has_pct": 68.4, "cessacao_tabagismo_pct": 12.8},
        {"ano": 2023, "preventivo_pct": 62.8, "rastreio_dm_pct": 58.2, "rastreio_has_pct": 72.4, "cessacao_tabagismo_pct": 14.4},
        {"ano": 2024, "preventivo_pct": 66.4, "rastreio_dm_pct": 62.4, "rastreio_has_pct": 75.8, "cessacao_tabagismo_pct": 16.8},
        {"ano": 2025, "preventivo_pct": 68.4, "rastreio_dm_pct": 64.8, "rastreio_has_pct": 78.2, "cessacao_tabagismo_pct": 18.4},
    ]

@router.get("/indicadores")
def indicadores():
    return [
        {"indicador": "Cobertura de rastreio (média todos programas)", "valor": 54.6, "unidade": "%", "meta": 80, "status": "atencao",
         "observacao": "Apenas 2 dos 8 programas de rastreio atingem a meta de cobertura."},
        {"indicador": "Mamografia no município", "valor": 0, "unidade": "equip.", "meta": 1, "status": "critico",
         "observacao": "Equipamento inexistente. Espera de 8,2 meses para realizar em Manaus."},
        {"indicador": "Cessação do tabagismo", "valor": 18.4, "unidade": "%", "meta": 50, "status": "critico",
         "observacao": "PNCT com 1 grupo ativo. Meta nacional de 50% de abstinência em 12 meses não atingida."},
        {"indicador": "Preventivo câncer de colo", "valor": 68.4, "unidade": "%", "meta": 80, "status": "atencao",
         "observacao": "Colposcopia indisponível localmente. Resultados alterados com espera para Manaus."},
        {"indicador": "Rastreio DM em adultos de risco", "valor": 64.8, "unidade": "%", "meta": 90, "status": "critico",
         "observacao": "35,2% dos adultos com fatores de risco não rastreados nos últimos 12 meses."},
    ]
