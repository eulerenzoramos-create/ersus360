from fastapi import APIRouter

router = APIRouter(prefix="/api/infeccoes-hospitalares-apui", tags=["infeccoes_hospitalares_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "hmm_leitos_sus": 28,
    "iras_taxa_geral_pct": 8.4,
    "meta_iras_pct": 3.0,
    "infeccao_sitio_cirurgico_pct": 12.4,
    "meta_isc_pct": 2.0,
    "pneumonia_associada_ventilador": 0,
    "itu_cateter_casos_ano": 18,
    "bacteremia_cateter_casos_ano": 8,
    "ccih_constituida": True,
    "ccih_reunioes_ano": 4,
    "ccih_reunioes_meta": 12,
    "microbiologista": 0,
    "infectologista": 0,
    "farmaceutico_clinico": 0,
    "cultura_bacteriana_disponivel": True,
    "cultura_espera_dias": 5,
    "antibiograma_disponivel": True,
    "resistencia_mrsa_casos_2025": 4,
    "resistencia_kpc_casos_2025": 2,
    "higiene_maos_conformidade_pct": 48.4,
    "meta_higiene_maos_pct": 80.0,
    "consumo_alcool_gel_ml_leito_dia": 18.4,
    "meta_alcool_gel_ml": 40.0,
    "antibiotico_profilaxia_cirurgica_pct": 62.4,
    "meta_profilaxia_pct": 95.0,
    "obitos_iras_ano": 4,
    "mortalidade_iras_pct": 16.7,
    "status_iras": "critico",
    "status_resistencia": "critico",
    "status_prevencao": "critico",
}

_IRAS_TIPOS = [
    {"tipo": "Infecção do Sítio Cirúrgico (ISC)",   "taxa_pct": 12.4, "meta_pct": 2.0,  "casos_ano": 18, "status": "critico",
     "observacao": "6x acima da meta. Principal causa: antibiótico profilático não administrado no momento correto (< 60 min antes da incisão) em 37,6% das cirurgias. Esterilização: CME com 2 autoclaves, 1 em manutenção há 3 meses. ISC aumenta internação em 7-14 dias e custo em R$ 4.800. Curativo de ISC: realizado por técnico de enfermagem sem protocolo padronizado"},
    {"tipo": "ITU Relacionada a Cateter (ITRUC)",   "taxa_pct": 4.2,  "meta_pct": 0.5,  "casos_ano": 18, "status": "critico",
     "observacao": "8,4x acima da meta. Sondagem vesical sem indicação precisa: 28,4% dos pacientes sondados sem critério formal. Bundle anti-ITRUC (5 medidas): implementado em 38,4% dos casos. Retirada precoce de cateter: não monitorada diariamente. ITU por cateter = 3-5 dias a mais de internação + risco de urossepse"},
    {"tipo": "Bacteremia Relacionada a CVC",        "taxa_pct": 2.8,  "meta_pct": 0.5,  "casos_ano": 8,  "status": "critico",
     "observacao": "5,6x acima da meta. Cateter venoso central: inserido pelo médico plantonista sem checklist de inserção em 62,4% dos casos. Curativo de CVC: troca a cada 7 dias em apenas 48,4% dos casos. Mortalidade por bacteremia por CVC: 28,4% (4x maior que infecção sem CVC). CVC desnecessário: não avaliado diariamente para retirada precoce"},
    {"tipo": "Pneumonia Hospitalar (PAH/PAV)",      "taxa_pct": 1.8,  "meta_pct": 0.5,  "casos_ano": 4,  "status": "atencao",
     "observacao": "Zero ventilador mecânico no HMM (sem UTI): PAV não aplicável. PAH por aspiração: 4 casos/ano em pacientes com AVC + disfagia. Elevação da cabeceira a 30-45°: não monitorada rotineiramente. Higiene oral com clorexidina: realizada em 38,4% dos pacientes em risco"},
    {"tipo": "Resistência bacteriana (MRSA/KPC)",   "taxa_pct": 0,    "meta_pct": 0,    "casos_ano": 6,  "status": "critico",
     "observacao": "4 MRSA + 2 KPC em 2025. Para um hospital de 28 leitos: alarmante. MRSA: triagem na admissão (swab nasal) realizada em 0% dos pacientes de risco. Isolamento de contato: implementado em 72,4% dos casos identificados. Vancomicina: disponível. Polimixina B: disponível via TFD em Manaus (casos de KPC pan-resistente)"},
]

_PREVENCAO = [
    {"medida": "Higiene das mãos (5 momentos OMS)", "conformidade_pct": 48.4, "meta_pct": 80.0, "status": "critico",
     "observacao": "51,6% de não adesão. Álcool gel: 18,4 mL/leito/dia vs meta 40 mL — consumo baixo indica não uso. Treinamento em higiene das mãos: última capacitação há 14 meses. Observação direta: 2h/semana pelo CCIH (meta: 10h). Higiene das mãos é a intervenção com melhor custo-benefício em controle de IRAS: R$ 0,12/higienização vs R$ 4.800/ISC"},
    {"medida": "Bundle cirúrgico (profilaxia ATB)",  "conformidade_pct": 62.4, "meta_pct": 95.0, "status": "critico",
     "observacao": "37,6% das cirurgias sem profilaxia no momento correto. Antibiótico profilático: cefazolina 1g EV, 30-60 min antes da incisão + 2ª dose se cirurgia > 3h. Controle de temperatura intraoperatória: não monitorado. Glicemia intraoperatória: não controlada sistematicamente. Bundle de 5 itens: implementado completamente em apenas 28,4% das cirurgias"},
    {"medida": "Checklist de admissão para isolamento","conformidade_pct": 28.4,"meta_pct": 100.0,"status": "critico",
     "observacao": "71,6% sem triagem de resistência na admissão. Paciente transferido de outro hospital: internado em quarto coletivo antes do resultado de cultura — janela de disseminação de MRSA/KPC. Leito de isolamento: 1 quarto individual disponível para 28 leitos (ideal: 1 para cada 10)"},
    {"medida": "Curativo de CVC (bundle)",           "conformidade_pct": 48.4, "meta_pct": 95.0, "status": "critico",
     "observacao": "51,6% fora do protocolo. Curative transparente com troca a cada 7 dias ou ao sinal de infecção: não padronizado. Kit de curativo de CVC: desabastecimento médio 28 dias/ano. Treinamento de técnicos de enfermagem em bundle de CVC: última capacitação há 18 meses"},
    {"medida": "CCIH ativa (reuniões mensais)",      "conformidade_pct": 33.3, "meta_pct": 100.0,"status": "critico",
     "observacao": "4/12 reuniões realizadas. CCIH existe formalmente mas sem microbiologista, sem infectologista, sem enfermeiro de controle de IRAS dedicado. CCIH operando com médico clínico + enfermeiro sobrecarregados. Relatório mensal de IRAS: não enviado à ANVISA em 8/12 meses de 2024"},
]

_HISTORICO = [
    {"ano": "2022", "iras_taxa_pct": 10.4, "isc_pct": 14.8, "higiene_maos_pct": 38.4, "resistencia_casos": 2},
    {"ano": "2023", "iras_taxa_pct": 9.8,  "isc_pct": 13.6, "higiene_maos_pct": 42.4, "resistencia_casos": 4},
    {"ano": "2024", "iras_taxa_pct": 9.2,  "isc_pct": 12.8, "higiene_maos_pct": 45.8, "resistencia_casos": 5},
    {"ano": "2025", "iras_taxa_pct": 8.4,  "isc_pct": 12.4, "higiene_maos_pct": 48.4, "resistencia_casos": 6},
]

_INDICADORES = [
    {"indicador": "Taxa geral de IRAS",              "valor": 8.4,  "meta": 3.0,   "unidade": "%",  "status": "critico", "observacao": "2,8x acima da meta. Tendência de melhora lenta (10,4% → 8,4% em 4 anos). No ritmo atual, meta de 3% será atingida em 2036. Programa intensivo de controle de IRAS (6 meses): redução esperada de 40-50% com protocolo OMS + CCIH ativa + treinamento mensal"},
    {"indicador": "Infecção do Sítio Cirúrgico",     "valor": 12.4, "meta": 2.0,   "unidade": "%",  "status": "critico", "observacao": "6x acima da meta. ISC é o principal indicador de qualidade cirúrgica. Solução de custo baixo: checklist cirúrgico OMS (impresso, R$ 0,05/folha) + cefazolina no timing correto (já disponível). Implementação completa do bundle cirúrgico: reduz ISC em 58% em 90 dias"},
    {"indicador": "Higiene das mãos",                "valor": 48.4, "meta": 80.0,  "unidade": "%",  "status": "critico", "observacao": "31,6 pontos abaixo da meta. Álcool gel insuficiente (18,4 mL vs meta 40 mL/leito/dia) é uma causa, mas comportamento é o principal fator. Observação direta + feedback imediato: aumenta adesão em 20 pontos em 30 dias. Custo da intervenção: R$ 800/mês de álcool gel extra + 2h/semana de observação"},
    {"indicador": "Resistência bacteriana (casos)",  "valor": 6,    "meta": 0,     "unidade": "casos","status": "critico","observacao": "Tendência crescente (2 → 6 casos em 4 anos). MRSA e KPC em hospital de 28 leitos = risco de surto com disseminação para toda a ala. Notificação à ANVISA: obrigatória mas não realizada em 2/6 casos em 2025. KPC: opções terapêuticas limitadas (polimixina + meropeném) — mortalidade 40-60%"},
    {"indicador": "Óbitos atribuídos a IRAS",        "valor": 4,    "meta": 0,     "unidade": "casos","status": "critico","observacao": "4 óbitos/ano evitáveis. Mortalidade por IRAS: 16,7% dos casos (meta < 5%). Cada óbito por IRAS é um indicador de falha do sistema de prevenção — não uma fatalidade inevitável. Programa de controle de IRAS com CCIH ativa: reduz mortalidade associada em 40-60%"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/tipos")
def tipos():
    return _IRAS_TIPOS


@router.get("/prevencao")
def prevencao():
    return _PREVENCAO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
