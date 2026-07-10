from fastapi import APIRouter
router = APIRouter(prefix="/api/controle-vetorial-apui", tags=["Controle Vetorial Apuí"])

_DASHBOARD = {
    "iip_aedes_atual_pct": 4.2,
    "nivel_risco_dengue": "critico",
    "iip_meta_pct": 1.0,
    "nebulizacoes_realizadas_2025": 18,
    "nebulizacoes_meta_2025": 24,
    "visitas_imoveis_mes": 2840,
    "imoveis_programados_mes": 3200,
    "cobertura_visitas_pct": 88.8,
    "focos_eliminados_2025": 4284,
    "focos_tratados_focal_2025": 1847,
    "agentes_endemias_ativo": 2,
    "agentes_endemias_necessario": 12,
    "larvicidas_estoque_meses": 1.4,
    "inseticidas_estoque_meses": 0.8,
    "vistoria_caixa_dagua_cobertura_pct": 42.4,
    "pontos_estrategicos_tratados_pct": 68.4,
    "armadilhas_ovitrampa": 28,
    "positivas_ovitrampa_pct": 64.3,
    "status_iip": "critico",
    "status_nebulizacao": "atencao",
    "status_agentes": "critico",
}

_LIRAA = [
    {"ciclo": "LIRAa 1/2024", "iip_pct": 3.8, "iib_pct": 2.4, "nivel": "alerta",  "imoveis_inspecionados": 960, "focos": 36, "principais_depositos": "A2 (caixa d'água), D1 (pneus)", "acoes": "Borrifação focal + palestra escolar"},
    {"ciclo": "LIRAa 2/2024", "iip_pct": 4.6, "iib_pct": 3.1, "nivel": "critico", "imoveis_inspecionados": 940, "focos": 43, "principais_depositos": "A2, B (baldes)", "acoes": "Nebulização ultrabaixo volume + mutirão limpeza"},
    {"ciclo": "LIRAa 1/2025", "iip_pct": 4.2, "iib_pct": 2.9, "nivel": "critico", "imoveis_inspecionados": 972, "focos": 41, "principais_depositos": "A2, D1, E (natural)", "acoes": "Borrifação residual + EPI agentes + mobilização"},
    {"ciclo": "LIRAa 2/2025", "iip_pct": None, "iib_pct": None, "nivel": "pendente", "imoveis_inspecionados": 0, "focos": 0, "principais_depositos": "—", "acoes": "Programado para ago/2025"},
]

_NEBULIZACOES = [
    {"mes": "Jan/2025", "realizadas": 3, "programadas": 2, "km_percorridos": 284, "inseticida_litros": 18.4, "horario": "05h-07h", "cobertura_bairros": "Centro, Bairro Novo"},
    {"mes": "Fev/2025", "realizadas": 2, "programadas": 2, "km_percorridos": 198, "inseticida_litros": 12.8, "horario": "05h-07h", "cobertura_bairros": "Cohab, Esperança"},
    {"mes": "Mar/2025", "realizadas": 3, "programadas": 3, "km_percorridos": 312, "inseticida_litros": 20.2, "horario": "05h-07h", "cobertura_bairros": "Todos bairros urbanos"},
    {"mes": "Abr/2025", "realizadas": 2, "programadas": 2, "km_percorridos": 204, "inseticida_litros": 13.2, "horario": "05h-07h", "cobertura_bairros": "Centro, Bairro Novo"},
    {"mes": "Mai/2025", "realizadas": 4, "programadas": 3, "km_percorridos": 396, "inseticida_litros": 25.6, "horario": "05h-07h", "cobertura_bairros": "Ampliado: COHAB I e II"},
    {"mes": "Jun/2025", "realizadas": 2, "programadas": 4, "km_percorridos": 198, "inseticida_litros": 12.8, "horario": "05h-07h", "cobertura_bairros": "Centro, Esperança", "obs": "2 saídas canceladas — falta de inseticida"},
    {"mes": "Jul/2025", "realizadas": 2, "programadas": 4, "km_percorridos": 196, "inseticida_litros": 12.6, "horario": "05h-07h", "cobertura_bairros": "Centro", "obs": "Restrição de inseticida — apenas áreas críticas"},
]

_HISTORICO = [
    {"ano": "2022", "iip_medio_pct": 3.4, "surto_dengue": False, "casos_dengue": 124, "focos_eliminados": 3648, "nebulizacoes": 14, "agentes": 3},
    {"ano": "2023", "iip_medio_pct": 3.8, "surto_dengue": False, "casos_dengue": 164, "focos_eliminados": 3924, "nebulizacoes": 16, "agentes": 3},
    {"ano": "2024", "iip_medio_pct": 4.4, "surto_dengue": True,  "casos_dengue": 264, "focos_eliminados": 4124, "nebulizacoes": 18, "agentes": 2},
    {"ano": "2025", "iip_medio_pct": 4.2, "surto_dengue": True,  "casos_dengue": 284, "focos_eliminados": 4284, "nebulizacoes": 18, "agentes": 2},
]

_INDICADORES = [
    {"indicador": "IIP Aedes aegypti",              "valor": "4,2%",  "meta": "< 1%",     "status": "critico", "observacao": "Nível crítico (>3,9%) — surto de dengue em curso. Principal causa: cobertura de agentes insuficiente (2/12 necessários) e deposição de pneus no lixão a céu aberto. Caixas d'água sem tampa 57,6% dos imóveis vistoriados"},
    {"indicador": "Cobertura de Visitas Domiciliares", "valor": "88,8%", "meta": "≥ 100%", "status": "atencao", "observacao": "11,2% dos imóveis não visitados por insuficiência de agentes. Área ribeirinha e zona rural excluídas do controle — logística fluvial sem recurso municipal"},
    {"indicador": "Agentes de Endemias",             "valor": "2",     "meta": "12",       "status": "critico", "observacao": "Déficit de 10 agentes. Concurso público não realizado em 10 anos. Contrato temporário vigente vence em dez/2025 — risco de paralisação do controle vetorial"},
    {"indicador": "Estoque Inseticida (meses)",      "valor": "0,8",   "meta": "≥ 3",      "status": "critico", "observacao": "Nebulizações canceladas em jun-jul/2025 por falta de inseticida. Processo licitatório em andamento — prazo estimado 45 dias para nova aquisição"},
    {"indicador": "Pontos Estratégicos Tratados",    "valor": "68,4%", "meta": "≥ 100%",   "status": "atencao", "observacao": "Borracharias, ferro-velho e cemitério sem tratamento regular. Acordo com setor privado não formalizado"},
    {"indicador": "Nebulizações Realizadas",         "valor": "18/24", "meta": "24/ano",   "status": "atencao", "observacao": "6 saídas não realizadas por falta de inseticida ou equipamento em manutenção. Nebulizador termal único do município sem contrato de manutenção vigente"},
]

@router.get("/dashboard")
def dashboard(): return _DASHBOARD

@router.get("/liraa")
def liraa(): return _LIRAA

@router.get("/nebulizacoes")
def nebulizacoes(): return _NEBULIZACOES

@router.get("/historico")
def historico(): return _HISTORICO

@router.get("/indicadores")
def indicadores(): return _INDICADORES
