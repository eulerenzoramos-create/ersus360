"""
Fichas Técnicas do Novo Modelo de Financiamento da APS
Portaria GM/MS nº 3.493/2024 | NT DESF/SAPS/MS nº 30/2025
Fonte: https://www.gov.br/saude/pt-br/composicao/saps/publicacoes/fichas-tecnicas
"""
from fastapi import APIRouter
router = APIRouter(prefix="/api/fichas-tecnicas", tags=["fichas-tecnicas"])

MUNICIPIO = {"nome": "Apuí", "uf": "AM", "ibge": "1300144", "porte": 1, "populacao": 24_800}

# ──────────────────────────────────────────────────────────────────────
# ESF / eAP  (Portaria GM/MS 3.493/2024 | NT 30/2025)
# ──────────────────────────────────────────────────────────────────────
ESF_EAP = {
    "sigla": "eSF / eAP",
    "nome_completo": "Equipe de Saúde da Família / Equipe de Atenção Primária",
    "portaria": "Portaria GM/MS nº 3.493, de 10 de outubro de 2024",
    "nota_tecnica": "NT DESF/SAPS/MS nº 30/2025",
    "descricao": (
        "Equipe multiprofissional responsável pela atenção primária à saúde de uma "
        "população adscrita. A eSF inclui médico, enfermeiro, técnico/auxiliar de "
        "enfermagem e ACS. A eAP amplia a composição para contextos específicos."
    ),
    "composicao_minima": [
        {"profissional": "Médico Generalista / MFC / Especialista em SF", "cbo": "2251-04", "ch_minima": 40, "obrigatorio": True},
        {"profissional": "Enfermeiro Generalista / Especialista em SF", "cbo": "2235-05", "ch_minima": 40, "obrigatorio": True},
        {"profissional": "Técnico ou Auxiliar de Enfermagem", "cbo": "3222-05", "ch_minima": 40, "obrigatorio": True},
        {"profissional": "Agente Comunitário de Saúde (ACS)", "cbo": "5151-05", "ch_minima": 40, "obrigatorio": True},
    ],
    "composicao_complementar": [
        {"profissional": "Agente de Combate às Endemias (ACE)", "cbo": "5151-10", "ch_minima": 40, "obrigatorio": False},
    ],
    "carga_horaria": {
        "descricao": "40 horas semanais para TODOS os profissionais de saúde",
        "semanal": 40,
        "mensal": 176,
        "fonte": "Art. 5º, Portaria GM/MS 3.493/2024",
    },
    "parametro_populacional": {
        "descricao": "Número de pessoas vinculadas por equipe conforme porte do município",
        "tabela": [
            {"porte": "Até 20.000 hab. (Porte I)", "pessoas": 2000},
            {"porte": "20.001 a 50.000 hab. (Porte II)", "pessoas": 2500},
            {"porte": "50.001 a 100.000 hab. (Porte III)", "pessoas": 2750},
            {"porte": "Acima de 100.000 hab. (Porte IV)", "pessoas": 3000},
        ],
        "apui": {
            "porte": "Porte I (< 20.000 hab.)",
            "pessoas_por_equipe": 2000,
            "observacao": "Apuí tem ~24.800 hab. mas perfil rural — referência Porte I aplicável às equipes rurais/ribeirinhas",
        },
        "fonte": "Art. 8º, Portaria GM/MS 3.493/2024",
    },
    "financiamento": {
        "componentes": [
            {
                "nome": "Bloco de Custeio – Capitação Ponderada",
                "descricao": "Valor per capita x número de pessoas vinculadas, com fatores de ponderação",
                "valor_referencia": "Definido anualmente pelo MS — NT 30/2025 especifica metodologia",
            },
            {
                "nome": "Incentivo de Implantação",
                "descricao": "Parcela única paga na implantação de nova equipe",
                "valor_referencia": "Previsto na Portaria 3.493/2024",
            },
            {
                "nome": "Bônus por Desempenho (ISF)",
                "descricao": "Índice de Saúde da Família — pagamento por performance nos 8 indicadores Novo Financiamento APS",
                "valor_referencia": "Até 100% adicional sobre a capitação",
                "indicadores_fonte": "SIAPS / e-Gestor APS",
            },
        ],
        "nota": "Novo modelo unifica Capitação Ponderada + Qualidade (ISF) substituindo o antigo PAB Variável",
    },
    "modalidades": ["eSF Urbana", "eSF Rural", "eAP (municípios sem ESF consolidada)"],
    "criterios_implantacao": [
        "Cadastro no SCNES com todos os profissionais vinculados",
        "Carga horária de 40h/semana comprovada",
        "Vínculo exclusivo à equipe (proibido acúmulo em outra eSF)",
        "Definição do território de abrangência com mapa",
        "Mínimo de ACS: 1 por micro-área (máx. 750 pessoas/ACS)",
    ],
    "apui_contexto": {
        "equipes_estimadas": 12,
        "observacao": (
            "Apuí possui perfil misto urbano/rural com área de 54.244 km². "
            "Equipes ribeirinhas e rurais recebem fator de ponderação adicional na capitação."
        ),
    },
}

# ──────────────────────────────────────────────────────────────────────
# ESB  (Portaria GM/MS 3.493/2024)
# ──────────────────────────────────────────────────────────────────────
ESB = {
    "sigla": "ESB",
    "nome_completo": "Equipe de Saúde Bucal",
    "portaria": "Portaria GM/MS nº 3.493, de 10 de outubro de 2024",
    "descricao": (
        "Equipe complementar à eSF responsável pela atenção em saúde bucal. "
        "Deve ser vinculada a uma ou mais equipes de saúde da família."
    ),
    "modalidades": [
        {
            "tipo": "Modalidade I",
            "composicao": [
                {"profissional": "Cirurgião-Dentista", "cbo": "2232-08", "ch_minima": 40, "obrigatorio": True},
                {"profissional": "Auxiliar em Saúde Bucal (ASB)", "cbo": "3224-05", "ch_minima": 40, "obrigatorio": True},
            ],
            "descricao": "Composição básica — CD + ASB",
        },
        {
            "tipo": "Modalidade II",
            "composicao": [
                {"profissional": "Cirurgião-Dentista", "cbo": "2232-08", "ch_minima": 40, "obrigatorio": True},
                {"profissional": "Auxiliar em Saúde Bucal (ASB)", "cbo": "3224-05", "ch_minima": 40, "obrigatorio": True},
                {"profissional": "Técnico em Saúde Bucal (TSB)", "cbo": "3224-10", "ch_minima": 40, "obrigatorio": True},
            ],
            "descricao": "Composição ampliada — CD + ASB + TSB (maior resolutividade)",
        },
    ],
    "carga_horaria": {"semanal": 40, "mensal": 176, "nota": "40h/semana para todos os profissionais"},
    "parametro_populacional": {
        "vinculacao": "1 ESB para cada 1–3 eSF",
        "cobertura_recomendada": "Até 6.000 pessoas/ESB Modalidade I; até 4.500 Modalidade II",
        "fonte": "Portaria GM/MS 3.493/2024 + PMAQ-AB",
    },
    "financiamento": {
        "modalidade_I": {
            "custeio_mensal": "Incluído no bloco de custeio da eSF vinculada",
            "incentivo_implantacao": "Previsto — valor publicado em portaria complementar",
        },
        "modalidade_II": {
            "custeio_mensal": "Valor adicional pela presença do TSB",
            "incentivo_implantacao": "Maior que Modalidade I",
        },
        "bonus_desempenho": "Vinculado ao desempenho nos indicadores PMAQ-AB / SIAPS",
    },
    "indicadores_monitoramento": [
        "1ª consulta odontológica programática",
        "Conclusão de tratamento odontológico",
        "Cobertura de escovação dental supervisionada",
        "Exodontias / total procedimentos odontológicos",
        "Ação coletiva em saúde bucal",
    ],
    "apui_contexto": {
        "observacao": "Apuí dispõe de CEO (Centro de Especialidades Odontológicas) que complementa a atenção básica bucal.",
    },
}

# ──────────────────────────────────────────────────────────────────────
# eMulti  (Portaria GM/MS 3.493/2024 | NT DESF nº 30/2025)
# ──────────────────────────────────────────────────────────────────────
EMULTI = {
    "sigla": "eMulti",
    "nome_completo": "Equipe Multiprofissional de Atenção Primária à Saúde",
    "portaria": "Portaria GM/MS nº 3.493, de 10 de outubro de 2024",
    "nota_tecnica": "NT DESF/SAPS/MS nº 30/2025",
    "descricao": (
        "Equipe de apoio matricial às eSF, atuando de forma compartilhada no território. "
        "Substitui o NASF-AB. Possui três modalidades conforme número de eSF vinculadas."
    ),
    "modalidades": [
        {
            "tipo": "eMulti Estratégica",
            "esf_vinculadas": "1 a 4 eSF",
            "ch_minima_equipe": 100,
            "ch_max_por_profissao": 40,
            "financiamento_mensal": 12000,
            "bonus_desempenho": 3000,
            "total_potencial_mes": 15000,
            "composicao_minima": [
                "1 profissional: nutricionista OU psicólogo (mín. 20h individuais)",
                "1 profissional: fisioterapeuta OU fonoaudiólogo OU educador físico OU terapeuta ocupacional",
            ],
            "descricao": "Para municípios com até 4 eSF — menor aporte, cobertura mais focal",
        },
        {
            "tipo": "eMulti Complementar",
            "esf_vinculadas": "5 a 9 eSF",
            "ch_minima_equipe": 200,
            "ch_max_por_profissao": 80,
            "financiamento_mensal": 24000,
            "bonus_desempenho": 6000,
            "total_potencial_mes": 30000,
            "composicao_minima": [
                "1 profissional: nutricionista OU psicólogo (mín. 20h individuais)",
                "1 profissional: fisioterapeuta OU fonoaudiólogo OU educador físico OU terapeuta ocupacional",
            ],
            "descricao": "Para municípios com 5 a 9 eSF — escala intermediária",
        },
        {
            "tipo": "eMulti Ampliada",
            "esf_vinculadas": "10 a 12 eSF",
            "ch_minima_equipe": 300,
            "ch_max_por_profissao": 120,
            "financiamento_mensal": 36000,
            "bonus_desempenho": 9000,
            "total_potencial_mes": 45000,
            "composicao_minima": [
                "Assistente Social OU Farmacêutico Clínico OU Nutricionista OU Psicólogo (mín. 20h)",
                "Fisioterapeuta OU Fonoaudiólogo OU Educador Físico OU Terapeuta Ocupacional",
            ],
            "descricao": "Para municípios com 10 a 12 eSF — cooperação intermunicipal permitida",
            "cooperacao_intermunicipal": True,
        },
    ],
    "cbos_elegiveis": [
        {"profissional": "Assistente Social", "cbo": "2516-05"},
        {"profissional": "Farmacêutico Clínico", "cbo": "2234-45"},
        {"profissional": "Fisioterapeuta", "cbo": "2236-05"},
        {"profissional": "Fonoaudiólogo", "cbo": "2238-10"},
        {"profissional": "Nutricionista", "cbo": "2237-10"},
        {"profissional": "Psicólogo", "cbo": "2515-10"},
        {"profissional": "Terapeuta Ocupacional", "cbo": "2239-05"},
        {"profissional": "Educador Físico", "cbo": "2241-40"},
        {"profissional": "Educador em Artes", "cbo": "5153-05"},
        {"profissional": "Médico Veterinário", "cbo": "2233-05"},
        {"profissional": "Sanitarista", "cbo": "1312-25"},
        {"profissional": "Médico Acupunturista", "cbo": "2251-05"},
        {"profissional": "Médico Cardiologista", "cbo": "2251-20"},
        {"profissional": "Médico Dermatologista", "cbo": "2251-35"},
        {"profissional": "Médico Endocrinologista", "cbo": "2251-55"},
        {"profissional": "Médico Geriatra", "cbo": "2251-80"},
        {"profissional": "Médico Ginecologista/Obstetra", "cbo": "2252-50"},
        {"profissional": "Médico Homeopata", "cbo": "2251-95"},
        {"profissional": "Médico Infectologista", "cbo": "2251-03"},
        {"profissional": "Médico Pediatra", "cbo": "2251-24"},
        {"profissional": "Médico Psiquiatra", "cbo": "2251-33"},
    ],
    "apui_contexto": {
        "modalidade_recomendada": "eMulti Estratégica",
        "justificativa": (
            "Apuí possui ~12 eSF. Modalidade Estratégica é o ponto de entrada recomendado. "
            "Com mais eSF implantadas, pode migrar para Complementar (R$ 24.000/mês) ou Ampliada (R$ 36.000/mês)."
        ),
        "valor_potencial_atual": "R$ 12.000/mês + R$ 3.000 bônus = R$ 15.000/mês",
    },
}

# ──────────────────────────────────────────────────────────────────────
# Equipe Ribeirinha  (Portaria GM/MS 3.493/2024 + Portaria 2.488/2011)
# ──────────────────────────────────────────────────────────────────────
RIBEIRINHA = {
    "sigla": "eSF Ribeirinha",
    "nome_completo": "Equipe de Saúde da Família Ribeirinha / Fluvial",
    "portaria": "Portaria GM/MS nº 3.493/2024 | Portaria GM/MS nº 2.488/2011 (Art. 44-48)",
    "descricao": (
        "Modalidade especial de eSF para populações ribeirinhas e de difícil acesso em "
        "regiões de várzea, rios e ilhas. Atua por meio de embarcação com itinerário fixo "
        "cobrindo múltiplas comunidades ao longo do rio."
    ),
    "composicao_minima": [
        {"profissional": "Médico Generalista / MFC", "cbo": "2251-04", "ch_minima": 40, "obrigatorio": True},
        {"profissional": "Enfermeiro", "cbo": "2235-05", "ch_minima": 40, "obrigatorio": True},
        {"profissional": "Técnico ou Auxiliar de Enfermagem", "cbo": "3222-05", "ch_minima": 40, "obrigatorio": True},
        {"profissional": "Agente Comunitário de Saúde (ACS)", "cbo": "5151-05", "ch_minima": 40, "obrigatorio": True},
        {"profissional": "Microscopista (endêmico/malária)", "cbo": "3241-05", "ch_minima": 40, "obrigatorio": False, "nota": "Recomendado em áreas endêmicas para malária como Apuí/AM"},
    ],
    "carga_horaria": {
        "semanal": 40,
        "mensal": 176,
        "especificidade": "Inclui deslocamento fluvial — horas de embarcação contam como hora trabalhada",
    },
    "parametro_populacional": {
        "pessoas_por_equipe": 2000,
        "especificidade": "Pode ser reduzido pelo MS em função do isolamento geográfico e dispersão populacional",
        "area_cobertura": "Itinerário fluvial definido — pode cobrir dezenas de comunidades ao longo do rio",
    },
    "financiamento": {
        "fator_ponderacao": "Fator de ponderação adicional para isolamento geográfico (Porte I + rural + ribeirinho)",
        "incentivo_especifico": "Incentivo Saúde na Hora para extensão de horário aplicável",
        "equipamento": "Embarcação sanitária custeada pelo Ministério da Saúde via convênio ou dotação específica",
        "fonte": "Portaria GM/MS 3.493/2024 + Portaria Interministerial nº 1, de 2014 (Ribeirinhos)",
    },
    "desafios_indicadores": {
        "pre_natal": {
            "meta_nacional": "60% de 6+ consultas",
            "realidade_ribeirinha": "21,8% — menos da metade da meta",
            "causa": "Distância, sazonalidade dos rios (cheia/seca), logística de transporte",
            "fonte": "Estudo CONASS/CONASEMS 2022 — Indicadores APS Amazônia",
        },
        "hba1c": {
            "meta_nacional": "≥ 12,8% dos diabéticos",
            "realidade_ribeirinha": "3,5% — crítico",
            "causa": "Baixa cobertura laboratorial, ausência de insumos (tiras reagentes), capacidade diagnóstica limitada",
        },
        "acoes_gestao": [
            "Programação de consultas de pré-natal durante visitas da embarcação",
            "Testes rápidos (glicemia, HIV, sífilis, dengue) levados na embarcação",
            "Telemedicina para teleconsulta especializada",
            "Farmácia itinerante com dispensação na comunidade",
            "Registro em formulário físico com posterior digitação no SIAPS (e-Gestor APS)",
        ],
    },
    "apui_contexto": {
        "rios_principais": ["Rio Sucunduri", "Rio Acari", "Rio Canumã", "Rio Aripuanã"],
        "comunidades_estimadas": 45,
        "equipes_ribeirinhas_apui": 3,
        "observacao": (
            "Apuí tem 42% de população rural — muitas comunidades ribeirinhas acessíveis "
            "apenas por barco. As equipes ribeirinhas são fundamentais para a cobertura "
            "da APS no município. SIAPS registra produção por mês de referência da visita."
        ),
    },
}

# ──────────────────────────────────────────────────────────────────────
# Consultório na Rua  (Portaria GM/MS 122/2011 + 3.493/2024)
# ──────────────────────────────────────────────────────────────────────
CONSULTORIO_RUA = {
    "sigla": "eCR",
    "nome_completo": "Equipe de Consultório na Rua",
    "portaria": "Portaria GM/MS nº 122, de 25 de janeiro de 2011 | Portaria GM/MS nº 3.493/2024",
    "descricao": (
        "Modalidade de equipe voltada para atenção integral à saúde de pessoas em situação "
        "de rua (PSR). Atua de forma itinerante nos territórios onde a PSR se concentra, "
        "articulando com CAPS, CRAS, CREAS e demais equipamentos da rede."
    ),
    "modalidades": [
        {
            "tipo": "Modalidade I",
            "composicao_minima": [
                {"profissional": "Enfermeiro", "cbo": "2235-05", "ch_minima": 30},
                {"profissional": "Psicólogo OU Assistente Social", "cbo": "2515-10 / 2516-05", "ch_minima": 30},
                {"profissional": "Técnico/Auxiliar de Enfermagem", "cbo": "3222-05", "ch_minima": 30},
            ],
            "ch_equipe_minima": 90,
            "descricao": "Composição básica — sem médico",
        },
        {
            "tipo": "Modalidade II",
            "composicao_minima": [
                {"profissional": "Médico", "cbo": "2251-04", "ch_minima": 30},
                {"profissional": "Enfermeiro", "cbo": "2235-05", "ch_minima": 30},
                {"profissional": "Psicólogo OU Assistente Social", "cbo": "2515-10 / 2516-05", "ch_minima": 30},
                {"profissional": "Técnico/Auxiliar de Enfermagem", "cbo": "3222-05", "ch_minima": 30},
            ],
            "ch_equipe_minima": 120,
            "descricao": "Composição ampliada — com médico",
        },
        {
            "tipo": "Modalidade III",
            "composicao_minima": [
                {"profissional": "Médico", "cbo": "2251-04", "ch_minima": 30},
                {"profissional": "Enfermeiro", "cbo": "2235-05", "ch_minima": 30},
                {"profissional": "Psicólogo", "cbo": "2515-10", "ch_minima": 30},
                {"profissional": "Assistente Social", "cbo": "2516-05", "ch_minima": 30},
                {"profissional": "Técnico/Auxiliar de Enfermagem", "cbo": "3222-05", "ch_minima": 30},
            ],
            "ch_equipe_minima": 150,
            "descricao": "Composição plena — máxima resolutividade para grandes centros",
        },
    ],
    "publico_alvo": "Pessoas em situação de rua (PSR) — sem exigência de cadastro prévio",
    "sem_vinculacao_territorial": True,
    "articulacao_rede": ["CAPS AD", "CRAS", "CREAS", "Centro Pop", "Albergues", "UPA", "Hospital"],
    "financiamento": {
        "custeio": "Transferência fundo a fundo ao município conforme modalidade implantada",
        "condicionalidade": "Relatório de produção mensal via SIAPS",
    },
    "apui_contexto": {
        "aplicabilidade": "Baixa — Apuí é município de pequeno porte sem grande contingente de PSR",
        "recomendacao": "Não prioritário para implantação em Apuí no curto prazo",
    },
}

# ──────────────────────────────────────────────────────────────────────
# Equipe Prisional  (Portaria Interministerial nº 1, de 2014 + 3.493/2024)
# ──────────────────────────────────────────────────────────────────────
PRISIONAL = {
    "sigla": "eSFP",
    "nome_completo": "Equipe de Saúde para Estabelecimentos Penais",
    "portaria": "Portaria Interministerial MJ/MS nº 1, de 02 de janeiro de 2014 | Portaria GM/MS nº 3.493/2024",
    "descricao": (
        "Equipe voltada à atenção integral à saúde da população privada de liberdade (PPL) "
        "em estabelecimentos penais. Vinculada à Política Nacional de Atenção Integral à "
        "Saúde das Pessoas Privadas de Liberdade no Sistema Prisional (PNAISP)."
    ),
    "modalidades": [
        {
            "tipo": "Tipo I — Até 100 PPL",
            "composicao": [
                {"profissional": "Enfermeiro", "cbo": "2235-05", "ch_minima": 20},
                {"profissional": "Técnico de Enfermagem", "cbo": "3222-05", "ch_minima": 20},
                {"profissional": "Cirurgião-Dentista", "cbo": "2232-08", "ch_minima": 20},
                {"profissional": "Auxiliar de Saúde Bucal", "cbo": "3224-05", "ch_minima": 20},
                {"profissional": "Psicólogo", "cbo": "2515-10", "ch_minima": 20},
                {"profissional": "Assistente Social", "cbo": "2516-05", "ch_minima": 20},
            ],
            "descricao": "Para até 100 pessoas privadas de liberdade",
        },
        {
            "tipo": "Tipo II — 101 a 500 PPL",
            "composicao": [
                {"profissional": "Médico", "cbo": "2251-04", "ch_minima": 20},
                {"profissional": "Enfermeiro", "cbo": "2235-05", "ch_minima": 20},
                {"profissional": "Técnico de Enfermagem", "cbo": "3222-05", "ch_minima": 20},
                {"profissional": "Cirurgião-Dentista", "cbo": "2232-08", "ch_minima": 20},
                {"profissional": "Auxiliar de Saúde Bucal", "cbo": "3224-05", "ch_minima": 20},
                {"profissional": "Psicólogo", "cbo": "2515-10", "ch_minima": 20},
                {"profissional": "Assistente Social", "cbo": "2516-05", "ch_minima": 20},
            ],
            "descricao": "Para 101 a 500 pessoas privadas de liberdade",
        },
    ],
    "prioridades_saude": [
        "Tuberculose (triagem + tratamento diretamente observado — TDO)",
        "HIV/Aids e ISTs",
        "Hepatites Virais",
        "Saúde Mental (CAPS vinculado)",
        "Hipertensão e Diabetes",
        "Saúde Bucal",
    ],
    "financiamento": {
        "custeio": "Transferência federal via PNAISP — Fundo Nacional de Saúde",
        "condicionalidade": "Relatório de produção mensal + confirmação da SEJUS/SEAP estadual",
    },
    "apui_contexto": {
        "estabelecimentos": "Apuí possui Cadeia Pública com capacidade limitada",
        "recomendacao": "Avaliar implantação de eSFP Tipo I se PPL > 30 pessoas",
    },
}

# ──────────────────────────────────────────────────────────────────────
# Painel Integrado
# ──────────────────────────────────────────────────────────────────────
RESUMO_FINANCIAMENTO = [
    {
        "equipe": "eSF / eAP",
        "modalidade": "Padrão Porte I",
        "financiamento_base": "Capitação Ponderada (per capita × 2.000 pessoas)",
        "bonus": "ISF — até 100% adicional",
        "prioridade_apui": "ALTA",
        "cor": "green",
    },
    {
        "equipe": "ESB Modalidade I",
        "modalidade": "CD + ASB",
        "financiamento_base": "Incluído no bloco custeio eSF",
        "bonus": "Vinculado ao desempenho PMAQ-AB / SIAPS",
        "prioridade_apui": "ALTA",
        "cor": "green",
    },
    {
        "equipe": "ESB Modalidade II",
        "modalidade": "CD + ASB + TSB",
        "financiamento_base": "Valor adicional sobre Modalidade I",
        "bonus": "Vinculado ao desempenho PMAQ-AB / SIAPS",
        "prioridade_apui": "MÉDIA",
        "cor": "yellow",
    },
    {
        "equipe": "eMulti Estratégica",
        "modalidade": "1–4 eSF vinculadas",
        "financiamento_base": "R$ 12.000/mês",
        "bonus": "R$ 3.000/mês por desempenho",
        "total_potencial": "R$ 15.000/mês",
        "prioridade_apui": "ALTA",
        "cor": "green",
    },
    {
        "equipe": "eMulti Complementar",
        "modalidade": "5–9 eSF vinculadas",
        "financiamento_base": "R$ 24.000/mês",
        "bonus": "R$ 6.000/mês por desempenho",
        "total_potencial": "R$ 30.000/mês",
        "prioridade_apui": "MÉDIA",
        "cor": "yellow",
    },
    {
        "equipe": "eMulti Ampliada",
        "modalidade": "10–12 eSF vinculadas",
        "financiamento_base": "R$ 36.000/mês",
        "bonus": "R$ 9.000/mês por desempenho",
        "total_potencial": "R$ 45.000/mês",
        "prioridade_apui": "BAIXA",
        "cor": "gray",
    },
    {
        "equipe": "eSF Ribeirinha",
        "modalidade": "Equipe Fluvial",
        "financiamento_base": "Capitação Ponderada + Fator Isolamento Geográfico",
        "bonus": "ISF adaptado + Incentivo Embarcação",
        "prioridade_apui": "ALTA",
        "cor": "green",
    },
    {
        "equipe": "eCR (Consultório na Rua)",
        "modalidade": "Modalidades I, II ou III",
        "financiamento_base": "Transferência fundo a fundo por modalidade",
        "bonus": "Vinculado à produção SIAPS",
        "prioridade_apui": "BAIXA",
        "cor": "gray",
    },
    {
        "equipe": "eSFP (Prisional)",
        "modalidade": "Tipo I ou II conforme PPL",
        "financiamento_base": "PNAISP — custeio federal específico",
        "bonus": "Vinculado à produção + SEJUS",
        "prioridade_apui": "MÉDIA",
        "cor": "yellow",
    },
]


@router.get("/esf")
def get_esf():
    return ESF_EAP


@router.get("/esb")
def get_esb():
    return ESB


@router.get("/emulti")
def get_emulti():
    return EMULTI


@router.get("/ribeirinha")
def get_ribeirinha():
    return RIBEIRINHA


@router.get("/consultorio-na-rua")
def get_consultorio_rua():
    return CONSULTORIO_RUA


@router.get("/prisional")
def get_prisional():
    return PRISIONAL


@router.get("/resumo")
def get_resumo():
    return {
        "titulo": "Novo Modelo de Financiamento da APS — Apuí/AM",
        "portaria_base": "Portaria GM/MS nº 3.493, de 10 de outubro de 2024",
        "nota_tecnica": "NT DESF/SAPS/MS nº 30/2025",
        "municipio": MUNICIPIO,
        "equipes": RESUMO_FINANCIAMENTO,
        "total_equipes_tipos": 6,
        "fonte_monitoramento": "SIAPS — e-Gestor APS (https://egestorab.saude.gov.br)",
    }
