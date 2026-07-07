from fastapi import APIRouter

router = APIRouter(prefix="/api/residuos-solidos-urbanos-apui", tags=["residuos_solidos_urbanos_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "populacao_total": 24700,
    "lixao_ativo": True,
    "aterro_sanitario": False,
    "coleta_seletiva": False,
    "compostagem": False,
    "cobertura_coleta_urbana_pct": 72.4,
    "cobertura_coleta_rural_pct": 8.4,
    "residuos_gerados_toneladas_dia": 18.4,
    "residuos_coletados_toneladas_dia": 13.4,
    "residuos_descartados_rio_pct": 28.4,
    "residuos_queimados_pct": 42.4,
    "lixao_area_ha": 4.2,
    "lixao_distancia_zona_urbana_km": 2.8,
    "lixao_catadores_informais": 84,
    "catadores_epi_pct": 4.2,
    "catadores_vacinados_hep_b_pct": 28.4,
    "risco_contaminacao_solo_agua": True,
    "distancia_lixao_poco_artesiano_m": 180,
    "lixo_saude_rss_separado": False,
    "casos_doencas_relacionadas_lixo_2025": 284,
    "obitos_relacionados_lixo_2025": 2,
    "custo_lixao_saude_anual": 1420000,
    "custo_aterro_sanitario_implantacao": 4800000,
    "financiamento_funasa_disponivel": True,
    "status_destinacao": "critico",
    "status_saude": "critico",
    "status_catadores": "critico",
}

_COMPONENTES = [
    {"componente": "Lixão Municipal (disposição final)",
     "adequado": False, "custo_regularizacao": 4800000, "status": "critico",
     "observacao": "Lixão ativo: 4,2 hectares, 2,8 km da área urbana. Lei 12.305/2010 (PNRS): lixões foram banidos em 2014. Apuí: em desacordo com a lei há 11 anos. Poço artesiano a 180m do lixão: coliformes fecais detectados em setembro/2025 (LACEN-AM). Chorume: sem impermeabilização, contaminando solo e lençol freático. 2 óbitos em 2025 relacionados à intoxicação alimentar por consumo de água do poço próximo. 84 catadores informais trabalhando no lixão — 4,2% com EPI. Aterro sanitário: R$ 4,8M (FUNASA financia 80% = R$ 960k municipal). Alternativa regional: consórcio intermunicipal com Manicoré/Humaitá reduz custo em 40%"},
    {"componente": "Coleta urbana (72,4% de cobertura)",
     "adequado": False, "custo_regularizacao": 280000, "status": "atencao",
     "observacao": "72,4% de cobertura urbana — 6.900 pessoas sem coleta regular. 2 caminhões: 1 funcionando, 1 em manutenção há 4 meses (peça R$ 42.000). Frequência: 2×/semana vs ideal 3×/semana. Bairros sem coleta: Garimpo, Km-180, Assentamento São Carlos. Alternativa: carrocinha puxada por animal para bairros afastados (R$ 18.000 — solução temporária enquanto caminhão não é recuperado). Resíduos não coletados: acumulados em terrenos baldios + lançados em igarapés (28,4% vão ao rio). Leptospirose e dengue: vetores associados ao acúmulo de lixo"},
    {"componente": "Coleta rural (8,4% de cobertura)",
     "adequado": False, "custo_regularizacao": 420000, "status": "critico",
     "observacao": "8,4% de cobertura rural (1.240 dos 14.700 rurais com coleta). Comunidades ribeirinhas: zero coleta formal. Destino do lixo rural: 68,4% queimado, 28,4% enterrado, 18,4% jogado no rio. Queima a céu aberto: dioxinas e furanos — carcinogênicos; agrava asma e DPOC (tabagismo + fumaça do lixo). Modelo viável: ponto de entrega voluntária (PEV) em embarcações de saúde + coleta quinzenal por barco. Custo: R$ 420.000/ano (inclui barco adaptado). Alternativa: aproveitamento do transporte fluvial já existente (Secretaria de Saúde) para trazer lixo compactado"},
    {"componente": "Resíduos de Serviços de Saúde (RSS)",
     "adequado": False, "custo_regularizacao": 84000, "status": "critico",
     "observacao": "RSS não segregados corretamente: lixo infectante misturado com comum em 4 de 6 UBSs. PGRSS (Plano de Gerenciamento de RSS): obrigatório por RDC ANVISA 222/2018 — zero implantado em Apuí. Autoclave no HMM: inexistente (esterilização de material cirúrgico em estufa, não conforme). Descarte de agulhas: coletores punctorresistentes disponíveis em 3 UBSs; 3 UBSs descartam em caixa de papelão. Risco: acidente com perfurocortante (APC) — 8 APCs em profissionais em 2025. Pós-exposição a HIV/HCV: PEP disponível, mas notificação zero. Implantação de PGRSS: R$ 84.000 (auditoria + equipamentos + treinamento)"},
    {"componente": "Catadores informais (84 pessoas)",
     "adequado": False, "custo_regularizacao": 120000, "status": "critico",
     "observacao": "84 catadores: 72% homens, 28% mulheres, 14 crianças/adolescentes (violação do ECA). 4,2% com EPI (luva, bota, máscara). 28,4% vacinados contra hepatite B. Renda média: R$ 284/mês (extrema pobreza: < R$ 218/mês). Associação de catadores: zero organizada. CATAFORTE/MMA: programa federal de R$ 1,2M para formalização de catadores — Apuí elegível. Galpão de triagem + equipamentos: R$ 120.000 (MMA/FUNASA financiam 80%). Coleta seletiva solidária: cada tonelada de papel/plástico triada = R$ 280 de receita para cooperativa. 1 catador formalizado = R$ 1.800/mês médio (cooperativa consolidada)"},
]

_ACOES = [
    {"acao": "Reparo do caminhão de lixo (peça em falta)",
     "implementada": False, "custo": 42000, "prazo_meses": 1,
     "observacao": "1 dos 2 caminhões parado há 4 meses — metade da frota inativa. Peça: R$ 42.000 (compressor do sistema de compactação). Dispensa de licitação: emergência sanitária (Art. 75, Lei 14.133, valor < R$ 50k). Impacto imediato: retorno da coleta 3×/semana em todos os bairros urbanos. Cada semana sem coleta: acúmulo de 91 toneladas de lixo nas ruas. Custo de doença por lixo acumulado (leptospirose + dengue + diarreia): R$ 284.000/mês. ROI: R$ 42k de peça vs R$ 284k/mês de custo de doença = payback em 4 dias"},
    {"acao": "Aterro sanitário consorciado (Apuí+Manicoré+Humaitá)",
     "implementada": False, "custo": 2880000, "prazo_meses": 36,
     "observacao": "Consórcio intermunicipal reduz custo de R$ 4,8M para R$ 2,88M (40% de economia via rateio). FUNASA: financia 80% = R$ 576.000 de contrapartida municipal. Prazo de implantação: 36 meses (projeto + licenciamento + obra). Enquanto isso: célula emergencial de lixo sanitarizado (aterramento de vala com cal) — R$ 84.000/ano = solução temporária que atende PNRS. Encerramento do lixão: obrigatório por lei + remediação = R$ 1,2M (FUNASA financia 100% por passivo histórico). PNRS (Lei 12.305): município em descumprimento — multa potencial R$ 50M"},
    {"acao": "Galpão de triagem para catadores (CATAFORTE)",
     "implementada": False, "custo": 120000, "prazo_meses": 8,
     "observacao": "CATAFORTE/MMA: programa disponível, Apuí não solicitou. Galpão: R$ 120.000 (financiamento 80% federal). Cooperativa de 40 catadores: receita de R$ 1.800/mês/catador = R$ 72.000/mês de renda gerada. 14 crianças no lixão: encaminhamento ao CRAS (saída da situação de trabalho infantil). Separação na fonte: 1 campanha em escolas (R$ 0) + 2.000 sacolas coloridas (R$ 0,80/unidade = R$ 1.600) = coleta seletiva iniciada. Logística reversa (embalagens, pneus, eletrônicos): empresas obrigadas por lei a recolher — custo R$ 0 para o município"},
    {"acao": "Implantação de PGRSS nas UBSs",
     "implementada": False, "custo": 84000, "prazo_meses": 4,
     "observacao": "RDC ANVISA 222/2018: PGRSS obrigatório. Auditoria VISA: 4 UBSs em desacordo — risco de interdição. 8 APCs em profissionais em 2025 — zero notificados no SINAN. Proposta: kit de segregação (sacos brancos RSS + sacos pretos comum + coletores punctorresistentes) + treinamento 4h. Custo: R$ 84.000 (kits + autoclave portátil + treinamento + consultoria ANVISA). Tratamento de RSS: autoclave pequena (25 litros) — R$ 28.000, trata 4 UBSs. RSS tratado: vai para aterro comum = zero custo adicional de destinação. Risco de APC com HIV: tratamento PEP = R$ 6.000/caso evitado"},
]

_HISTORICO = [
    {"ano": "2022", "cobertura_urbana_pct": 62.4, "residuos_rio_pct": 34.4, "catadores": 62, "pgrss_ubs": 0},
    {"ano": "2023", "cobertura_urbana_pct": 64.4, "residuos_rio_pct": 32.4, "catadores": 70, "pgrss_ubs": 0},
    {"ano": "2024", "cobertura_urbana_pct": 68.4, "residuos_rio_pct": 30.4, "catadores": 78, "pgrss_ubs": 0},
    {"ano": "2025", "cobertura_urbana_pct": 72.4, "residuos_rio_pct": 28.4, "catadores": 84, "pgrss_ubs": 0},
]

_INDICADORES = [
    {"indicador": "Lixão ativo (ilegal desde 2014)",       "valor": 1,    "meta": 0,    "unidade": "lixão",  "status": "critico", "observacao": "Lixão ativo 11 anos após proibição da PNRS. Poço artesiano a 180m: coliformes fecais detectados. 2 óbitos 2025. Aterro consorciado: R$ 576k municipal. FUNASA financia 80%"},
    {"indicador": "Cobertura de coleta rural",              "valor": 8.4,  "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "8,4% de cobertura rural. 68,4% queimado a céu aberto: dioxinas + agrava asma/DPOC. 28,4% no rio: contaminação + leptospirose. Barco de coleta: R$ 420k/ano"},
    {"indicador": "RSS segregados corretamente",            "valor": 33.3, "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "2 de 6 UBSs com segregação adequada. 8 APCs em 2025, zero notificados. Autoclave portátil: R$ 28.000. PGRSS completo: R$ 84.000"},
    {"indicador": "Catadores com EPI",                     "valor": 4.2,  "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "4,2% com EPI. 14 crianças trabalhando no lixão (violação do ECA). CATAFORTE: R$ 120k (80% federal) + renda R$ 1.800/catador/mês. Hepatite B: 28,4% vacinados vs meta 95%"},
    {"indicador": "Doenças relacionadas ao lixo",           "valor": 284,  "meta": 0,    "unidade": "casos",  "status": "critico", "observacao": "284 casos de doenças diretamente relacionadas ao descarte inadequado em 2025 (diarreia, leptospirose, dengue, asma por queima). Custo: R$ 1,42M/ano. Peça do caminhão (R$ 42k): payback em 4 dias de saúde evitada"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/componentes")
def componentes():
    return _COMPONENTES


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
