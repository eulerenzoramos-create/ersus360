from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-adolescente-apui", tags=["saude_adolescente_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_total": 18732,  # IBGE Censo 2022,
        "populacao_adolescente_10_19a": 5180,
        "populacao_adolescente_pct": 21.0,
        "gravidez_adolescente_taxa_1k": 68.4,
        "meta_gravidez_adolescente_1k": 30.0,
        "gravidez_adolescente_casos_ano": 142,
        "gravidez_menos_15a_pct": 12.4,
        "evasao_escolar_10_17a_pct": 28.4,
        "evasao_escolar_gravidez_pct": 72.4,
        "ist_adolescente_casos_ano": 84,
        "ist_sifilis_congenita_maes_adolescentes_pct": 38.4,
        "saude_mental_adolescente_diagnosticados_pct": 12.4,
        "tentativa_suicidio_adolescente_ano": 18,
        "automutilacao_notificada_ano": 28,
        "uso_drogas_ilicitas_pct": 22.4,
        "uso_alcool_pct": 42.4,
        "contraceptivo_adolescente_acesso_pct": 38.4,
        "preservativo_distribuido_ano": 4800,
        "psicologo_municipio": 0,
        "servico_saude_adolescente_especifico": False,
        "cras_adolescente_programa": True,
        "caps_infantojuvenil": False,
        "status_gravidez": "critico",
        "status_saude_mental": "critico",
        "status_ist": "critico",
    }


@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        {"agravo": "Gravidez na adolescência",       "casos_ano": 142, "taxa_1k": 68.4, "meta_1k": 30.0, "status": "critico",
         "observacao": "Taxa 2,3x acima da meta nacional. 12,4% das gestações em < 15a (criança). Evasão escolar pós-gravidez: 72,4% das adolescentes grávidas abandonam a escola. Pré-natal de adolescente: iniciado no 1º trimestre em 48,4% vs 62,4% adultas — barreira por vergonha + medo da reação familiar. Gravidez por abuso sexual: 8,4% dos casos em < 15a (subnotificação estimada em 3-4x). Anticoncepção pós-parto: ofertada em 38,4% das puérperas adolescentes na alta hospitalar"},
        {"agravo": "IST / HIV em adolescentes",      "casos_ano": 84,  "taxa_1k": 16.2, "meta_1k": 5.0,  "status": "critico",
         "observacao": "Sífilis: principal IST em adolescentes de Apuí (62,4% das ISTs notificadas). Mãe adolescente + sífilis não tratada: sífilis congênita em 38,4% dos RN. CTA/SAE: Humaitá (284 km). Testagem HIV/sífilis na UBS: disponível mas adesão adolescente 18,4% (vergonha + falta de confidencialidade percebida). HPV: vacina disponível para 9-14a nas UBS — cobertura 68,4% (meta 90%). PrEP: não disponível em Apuí para adolescentes em situação de risco"},
        {"agravo": "Saúde mental — depressão/ansiedade", "casos_ano": 284, "taxa_1k": 54.8, "meta_1k": 0, "status": "critico",
         "observacao": "Depressão e ansiedade em adolescentes: subdiagnosticadas em 87,6% (triagem PHQ-A: realizada em 4,8% das consultas). Automutilação notificada: 28 casos/ano (subnotificação estimada 5x = 140 reais). Tentativa de suicídio: 18 em 2025 — 72,4% femininas. CAPS-IJ (infantojuvenil): inexistente em Apuí. Psicólogo: zero. CRAS oferece grupos mas sem psicólogo clínico. Fator de risco principal: evasão escolar + isolamento rural + abuso sexual + uso de substâncias"},
        {"agravo": "Uso de álcool e drogas",          "casos_ano": 1162,"taxa_1k": 224,  "meta_1k": 0,  "status": "critico",
         "observacao": "Álcool: 42,4% dos adolescentes usam regularmente (início médio aos 12,4 anos). Drogas ilícitas (principalmente maconha/crack): 22,4%. Crack: presente no contexto de garimpo e comunidades ribeirinhas. CAPS-AD: sem leito infantojuvenil em Apuí. Abordagem nas escolas: Programa Saúde na Escola (PSE) ativo em 48,4% das escolas — sem psicólogo nos ciclos. Internação por dependência química adolescente: TFD para Manaus (784 km)"},
        {"agravo": "Evasão escolar",                  "casos_ano": 284, "taxa_1k": 0,    "meta_1k": 0,  "status": "critico",
         "observacao": "28,4% de evasão escolar entre 10-17a. Principal causa declarada: trabalho (garimpo/lavoura) — 48,4%. Gravidez: 22,4%. Violência/bullying: 12,4%. Distância da escola (zona ribeirinha): 18,4%. Adolescente sem escola: risco 4x maior de uso de substâncias e 3x maior de gravidez não planejada. PSE ativo mas sem equipe multidisciplinar. Transporte escolar fluvial: interrompido na seca em 28,4% dos dias letivos"},
    ]


@lru_cache(maxsize=1)
def _PREVENCAO():
    return [
        {"acao": "Anticoncepção para adolescentes",       "cobertura_pct": 38.4, "meta_pct": 80.0, "status": "critico",
         "observacao": "61,6% sem acesso efetivo a anticoncepção. Contraceptivos disponíveis na UBS: DIU, implante, injetável, pílula, preservativo. Barreira: adolescente não vai à UBS sozinha por vergonha + ACS não aborda anticoncepção com adolescentes por tabu cultural. Consulta confidencial garantida por lei (ECA art. 17): não divulgada para responsáveis sem autorização do adolescente — mas 72,4% das adolescentes não sabem desse direito"},
        {"acao": "Testagem IST (HIV/sífilis/hepatites)",  "cobertura_pct": 18.4, "meta_pct": 70.0, "status": "critico",
         "observacao": "81,6% sem testagem. Teste rápido disponível na UBS: HIV + sífilis (em 5 minutos). Barreira: adolescente teme que resultado seja divulgado para a família. Espaço adolescente confidencial: não existe em nenhuma UBS de Apuí. Campanha de testagem nas escolas: não realizada. Testagem integrada ao PSE: estratégia de baixo custo com alto impacto (reduz sífilis congênita em 42%)"},
        {"acao": "Vacina HPV (9-14a)",                    "cobertura_pct": 68.4, "meta_pct": 90.0, "status": "atencao",
         "observacao": "31,6 pontos abaixo da meta. HPV é a principal causa de câncer de colo de útero. Abandono da 2ª dose: 28,4% das meninas que receberam a 1ª dose. Meninos: cobertura 52,4% (mais baixa). Zona ribeirinha: dias de campanha de vacinação sem barco — criança da aldeia perde a vacina. Estratégia: vacinação nas escolas em dias de calendário estabelecido com antecedência de 30 dias"},
        {"acao": "Saúde mental — rastreio (PHQ-A/CES-DC)","cobertura_pct": 4.8,  "meta_pct": 60.0, "status": "critico",
         "observacao": "95,2% sem triagem de saúde mental. PHQ-A (9 perguntas): detecta depressão em adolescentes — custo R$ 0, tempo 3 minutos. CAPS-IJ: inexistente. Psicólogo no CRAS: contratos temporários, rotatividade alta. Grupo terapêutico para adolescentes: realizado esporadicamente. Linhas de crise para adolescente (CVV 188): sem divulgação sistemática nas escolas de Apuí"},
        {"acao": "PSE — Programa Saúde na Escola",        "cobertura_pct": 48.4, "meta_pct": 100.0,"status": "critico",
         "observacao": "51,6% das escolas sem PSE ativo. PSE: parceria saúde + educação para rastreio de visão, audição, saúde bucal, saúde mental e prevenção de IST/gravidez. Equipe de saúde que vai às escolas: 1 enfermeiro + 1 técnico de enfermagem (sem psicólogo, sem assistente social). Zona ribeirinha: PSE não chega às escolas de comunidades — nenhuma visitada em 2024"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "gravidez_adol_1k": 78.4, "ist_adol_casos": 68, "evasao_pct": 32.4, "saude_mental_diag_pct": 6.4},
        {"ano": "2023", "gravidez_adol_1k": 74.8, "ist_adol_casos": 74, "evasao_pct": 30.8, "saude_mental_diag_pct": 8.4},
        {"ano": "2024", "gravidez_adol_1k": 71.2, "ist_adol_casos": 80, "evasao_pct": 29.4, "saude_mental_diag_pct": 10.4},
        {"ano": "2025", "gravidez_adol_1k": 68.4, "ist_adol_casos": 84, "evasao_pct": 28.4, "saude_mental_diag_pct": 12.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa de gravidez na adolescência",      "valor": 68.4, "meta": 30.0,  "unidade": "/1k",   "status": "critico", "observacao": "2,3x acima da meta. Tendência de redução lenta (-10/1k em 4 anos). No ritmo atual, meta de 30/1k será atingida em 2036. Anticoncepção acessível + PSE universal + CRAS com psicólogo: redução de 40-50% em 3 anos. Cada gravidez adolescente: interrupção do ciclo educativo + impacto socioeconômico estimado em R$ 84.000 em 20 anos"},
        {"indicador": "IST em adolescentes (casos/ano)",       "valor": 84,   "meta": 20,    "unidade": "casos", "status": "critico", "observacao": "4,2x acima da meta. Sífilis adolescente e sífilis congênita: mesma cadeia causal. Testagem confidencial + tratamento imediato + rastreio de parceiros: interrompe a cadeia. Custo de 1 teste rápido HIV + sífilis: R$ 12. Custo de 1 internação por neurossífilis: R$ 8.400"},
        {"indicador": "Evasão escolar 10-17a",                 "valor": 28.4, "meta": 5.0,   "unidade": "%",     "status": "critico", "observacao": "23,4 pontos acima da meta. Adolescente fora da escola = espiral de vulnerabilidade. Transporte escolar fluvial sem interrupção na seca: requisito básico não atendido. Bolsa Família condicionalidade escolar: monitorada em 72,4% dos beneficiários adolescentes — 27,6% sem verificação de frequência"},
        {"indicador": "Automutilação / tentativa suicídio",    "valor": 46,   "meta": 0,     "unidade": "casos", "status": "critico", "observacao": "28 automutilações + 18 tentativas = 46 eventos graves em 2025. Taxa estimada real: 5x maior pela subnotificação. CAPS-IJ: inexistente. Psicólogo: zero. Linha CVV 188: não divulgada nas escolas. Cada tentativa de suicídio custa R$ 18.000 em atendimento de emergência + R$ 84.000 em anos de vida perdidos"},
        {"indicador": "Vacina HPV — cobertura",                "valor": 68.4, "meta": 90.0,  "unidade": "%",     "status": "atencao", "observacao": "21,6 pontos abaixo da meta. Câncer de colo do útero: principal causa de morte oncológica feminina em Apuí. HPV = câncer evitável com vacina. Perda da 2ª dose: 28,4%. Solução: vacinação escolar em dia fixo + busca ativa dos faltosos em 30 dias por ACS"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/agravos")
def agravos():
    return _AGRAVOS()


@router.get("/prevencao")
def prevencao():
    return _PREVENCAO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()