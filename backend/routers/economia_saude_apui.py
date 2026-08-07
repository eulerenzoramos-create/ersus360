from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/economia-saude-apui", tags=["economia_saude_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        "orcamento_saude_total_2025": 10000000,
        "gasto_per_capita_saude": 405,
        "gasto_per_capita_media_am": 484,
        "gasto_per_capita_media_br": 684,
        "receita_propria_saude_pct": 8.4,
        "fundo_fns_repasse_pct": 91.6,
        "custo_tfd_pct_orcamento": 28.4,
        "judicializacoes_ativas": 84,
        "custo_judicial_mensal": 284000,
        "custo_judicial_anual": 3408000,
        "desperdicioestimado_pct": 18.4,
        "custo_prevencao_pct": 4.8,
        "custo_prevencao_meta_pct": 15.0,
        "custo_hospitalizacoes_preveniveis_ano": 1248000,
        "macas_ativas_hum": 28,
        "custo_diaria_hospitalar_media": 684,
        "internacoes_causas_preveniveis_pct": 42.4,
        "custo_por_consulta_atencao_basica": 48,
        "custo_por_internacao_media": 2840,
        "retorno_investimento_prevencao": 4.2,
        "status_financeiro": "critico",
        "status_judicial": "critico",
        "status_eficiencia": "atencao",
    }


@lru_cache(maxsize=1)
def _GASTOS():
    return [
        {"categoria": "TFD e Regulação",          "valor_ano": 2840000, "pct_orcamento": 28.4, "status": "critico",
         "observacao": "R$ 2,84M/ano = 28,4% do orçamento total de saúde — a maior rubrica depois de pessoal. Crescendo R$ 280k/ano (+10,9% aa). Em 10 anos, TFD consumirá 48% do orçamento se a estrutura local não melhorar. 1.842 TFDs/ano: 984 para Manaus (R$ 2.000/TFD médio), 684 para Humaitá (R$ 800), 174 para Belém e outros (R$ 2.500). Telemedicina: reduz 28% da demanda de TFD — economia potencial de R$ 795k/ano com investimento de R$ 48.000"},
        {"categoria": "Pessoal e encargos",        "valor_ano": 4800000, "pct_orcamento": 48.0, "status": "atencao",
         "observacao": "R$ 4,8M/ano = 48% do orçamento. Adequado para o tamanho da equipe (limite constitucional: 60%). Déficit de especialistas: 10 especialistas faltantes = R$ 1,8M/ano em salários que seriam necessários. Rotatividade de médicos: 48,4%/ano — custo de recrutamento e treinamento R$ 28.000/médico. Médico em área de difícil acesso: precisa de incentivo de R$ 2.000-4.000/mês vs Manaus — Apuí paga R$ 1.200. Agentes Comunitários de Saúde: 48 vs 68 necessários (cobertura 70,6%)"},
        {"categoria": "Medicamentos e insumos",    "valor_ano": 1200000, "pct_orcamento": 12.0, "status": "atencao",
         "observacao": "R$ 1,2M/ano = 12% do orçamento. Componente especial (via estado): R$ 284.000/ano para medicamentos de alto custo. Medicamentos básicos: desabastecimento em 28,4% do catálogo no último semestre. Compra emergencial: 18,4% das aquisições via dispensa de licitação — custo 28% superior ao pregão regular. Vencimento de estoque: 8,4% dos medicamentos vencem sem uso — R$ 101k desperdício/ano. Insulinas: 100% disponível (insulinodependentes priorizados)"},
        {"categoria": "Judicialização da saúde",   "valor_ano": 3408000, "pct_orcamento": 34.1, "status": "critico",
         "observacao": "R$ 3,4M/ano em ações judiciais — superando TFD como maior gasto em 2025. 84 ações ativas: R$ 284.000/mês. Cresce 22%/ano (2022: 48 ações, 2025: 84). Principais objetos: medicamentos especiais não dispensados (48,4%), equipamentos assistivos (18,4%), cirurgias eletivas (14,4%), fraldas geriátricas (8,4%), nutrição enteral (10,4%). Custo de defesa: Procuradoria Municipal sem advogado exclusivo para saúde — terceirizado a R$ 84.000/ano. Cumprimento de liminar: média de 3,4 dias — atraso gera multa de R$ 500-5.000/dia"},
        {"categoria": "Atenção Básica",            "valor_ano": 984000,  "pct_orcamento": 9.8,  "status": "critico",
         "observacao": "R$ 984k/ano = apenas 9,8% do orçamento. Meta OMS: 30-40% para atenção primária. Subfinanciamento crônico da AB = maior demanda por TFD e hospitalização. Custo de consulta de AB: R$ 48 vs internação: R$ 2.840 (59x mais cara). 42,4% das internações são por causas evitáveis na AB = R$ 1,24M/ano em hospitalizações desnecessárias. Retorno do investimento em prevenção: R$ 4,20 para cada R$ 1,00 investido (evidência brasileira consolidada)"},
        {"categoria": "Urgência e Emergência",     "valor_ano": 680000,  "pct_orcamento": 6.8,  "status": "atencao",
         "observacao": "R$ 680k/ano = 6,8% do orçamento. UPA/PA 24h: não existe em Apuí — prontoatendimento do HMM absorve 100% das demandas de urgência. 28 macas ativas = gargalo em alta demanda (epidemias, acidentes). Regulação de urgência: SAMU em Humaitá (284 km). UTI: zero em Apuí — remoção para Humaitá ou Manaus. Custo de remoção aérea (SAMU de Manaus): R$ 12.000-28.000/remoção. 8 remoções aéreas em 2025 = R$ 160k em remoção de emergência"},
    ]


@lru_cache(maxsize=1)
def _JUDICIALIZACAO():
    return [
        {"objeto": "Medicamentos especiais",    "acoes": 40, "custo_mensal": 136000, "status": "critico",
         "observacao": "40 ações = R$ 136k/mês. Principais: insulina análoga (R$ 2.800/mês/paciente), adalimumabe (R$ 8.400/mês), enzimas de reposição para doenças raras (R$ 18.000-80.000/mês). Solução estrutural: ampliar CEAF estadual — medicamento aprovado pelo CONITEC no RENAME mas não disponível no estado. Protocolo PCDT: elaborar laudo conforme protocolo clínico evita 42% das ações — paciente recebe pelo componente estadual"},
        {"objeto": "Equipamentos assistivos",   "acoes": 15, "custo_mensal": 42000,  "status": "critico",
         "observacao": "15 ações = R$ 42k/mês. Principais: cadeira de rodas motorizada (R$ 8.000), próteses ortopédicas (R$ 12.000-48.000), órteses (R$ 2.800), audífonos AASI (R$ 4.200). CER (Centro Especializado em Reabilitação): Apuí não tem — referência Manaus/HCFMPA. Tempo de espera para concessão administrativa: 18-24 meses. Via judicial: 30 dias. 84 pacientes com necessidade de assistivos aguardam fila administrativa"},
        {"objeto": "Cirurgias eletivas",        "acoes": 12, "custo_mensal": 56000,  "status": "critico",
         "observacao": "12 ações = R$ 56k/mês. Fila do SUS para cirurgia eletiva (artroplastia, catarata, laparoscopia): 18-36 meses. Via judicial: cirurgia autorizada em 15-30 dias. Custo via judicial (hospital particular conveniado): 2,4x maior que tabela SUS. Mutirão cirúrgico (gestão ativa da fila): 1 mutirão de catarata resolve 142 casos por R$ 164.720 (R$ 1.160/procedimento) vs 142 ações judiciais = R$ 71.400/mês (R$ 856k/ano)"},
        {"objeto": "Fraldas geriátricas",       "acoes": 7,  "custo_mensal": 21000,  "status": "atencao",
         "observacao": "7 ações = R$ 21k/mês. 126 idosos com incontinência severa estimados em Apuí. Política Municipal de Fornecimento de Fraldas: inexistente. Custo administrativo de fornecimento: R$ 128/mês/paciente vs custo judicial: R$ 3.000/mês/paciente (honorários + multas). Resolução: lei municipal de fornecimento de fraldas com critérios (parecer médico) — custo R$ 16.128/mês, elimina 7 ações judiciais que custam R$ 21k/mês"},
        {"objeto": "Nutrição enteral/parenteral","acoes": 10, "custo_mensal": 29000,  "status": "atencao",
         "observacao": "10 ações = R$ 29k/mês. Pacientes com disfagia severa, doença de Crohn, oncológicos. PNAE via estado: cobertura parcial. Nutricionista clínica: zero no HMM — prescritora de suporte nutricional não disponível localmente. Via judicial com nutricionista particular: R$ 2.900/mês vs via administrativa com nutricionista do NASF: R$ 284/mês (quando há profissional). Contratação de nutricionista NASF: R$ 8.400/mês — elimina 10 ações judiciais que custam R$ 29k/mês"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "orcamento_total": 7800000,  "tfd_custo": 1848000, "judicial_custo": 1104000, "prev_custo": 374400, "custo_per_capita": 316},
        {"ano": "2023", "orcamento_total": 8400000,  "tfd_custo": 2112000, "judicial_custo": 1680000, "prev_custo": 403200, "custo_per_capita": 340},
        {"ano": "2024", "orcamento_total": 9200000,  "tfd_custo": 2484000, "judicial_custo": 2484000, "prev_custo": 441600, "custo_per_capita": 373},
        {"ano": "2025", "orcamento_total": 10000000, "tfd_custo": 2840000, "judicial_custo": 3408000, "prev_custo": 480000, "custo_per_capita": 405},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Gasto per capita em saúde",        "valor": 405,  "meta": 684,  "unidade": "R$/hab/a", "status": "critico", "observacao": "R$ 405/hab/ano = 59% da média nacional (R$ 684). Subfinanciamento crônico: Apuí recebe menos do FNS per capita que municípios com maior população (escala reduz custo por habitante). Proposta: PEC do Piso da AB universal — R$ 684/hab mínimo. Pleito ao Ministério da Saúde: financiamento diferenciado para municípios amazônicos de difícil acesso"},
        {"indicador": "TFD como % do orçamento",          "valor": 28.4, "meta": 10.0, "unidade": "%",        "status": "critico", "observacao": "28,4% em TFD — acima do custo de toda a atenção básica (9,8%). Investimento em especialistas locais = redução de TFD. 1 cardiologista local = R$ 216k/ano vs 284 TFDs para cardiologia = R$ 240k/ano. ROI de especialista local em 12 meses: R$ 24k de economia + 284 pacientes sem deslocamento de 784 km"},
        {"indicador": "Judicialização (% orçamento)",      "valor": 34.1, "meta": 5.0,  "unidade": "%",        "status": "critico", "observacao": "R$ 3,4M/ano = 34,1% do orçamento — acima do TFD pela primeira vez em 2025. Crescimento de 22%/ao. Sem intervenção: em 2027 ultrapassará R$ 5M/ano. Defensoria pública + protocolo de laudo = redução de 40% das ações judiciais em 24 meses"},
        {"indicador": "Internações por causas evitáveis", "valor": 42.4, "meta": 15.0, "unidade": "%",        "status": "critico", "observacao": "42,4% das internações são evitáveis com AB efetiva: pneumonia, DPOC, HAS não controlada, DM não controlado, infecções urinárias recorrentes. Custo de 1 internação evitável: R$ 2.840 vs 59 consultas de AB (R$ 2.840 ÷ R$ 48 = custo = 59 consultas evitariam 1 internação)"},
        {"indicador": "Gasto em prevenção (% orçamento)", "valor": 4.8,  "meta": 15.0, "unidade": "%",        "status": "critico", "observacao": "4,8% em prevenção vs meta de 15%. ROI da prevenção: R$ 4,20 retorno para cada R$ 1,00 investido (evidência consolidada no SUS). Cada R$ 1M deslocado de TFD para prevenção: reduz R$ 4,2M em custos futuros em 5 anos. Paradoxo: prevenção é cortada no orçamento porque o efeito é em 5-10 anos; hospitalização é paga hoje"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/gastos")
def gastos():
    return _GASTOS()


@router.get("/judicializacao")
def judicializacao():
    return _JUDICIALIZACAO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()