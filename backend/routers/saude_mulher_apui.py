from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-mulher-apui", tags=["saude_mulher_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "mulheres_total": 11800,
        "mulheres_idade_fertil_10_49": 6284,
        "prenatal_1consulta_1tri_pct": 42.4,
        "meta_prenatal_1tri_pct": 100.0,
        "prenatal_6consultas_pct": 38.4,
        "meta_6consultas_pct": 100.0,
        "consultas_medias_prenatal": 4.2,
        "sifilis_gestante_2025": 84,
        "sifilis_congenita_2025": 28,
        "hiv_gestante_2025": 12,
        "gestante_adolescente_pct": 28.4,
        "parto_cesarea_pct": 72.4,
        "meta_cesarea_oms_pct": 15.0,
        "obito_materno_2025": 3,
        "razao_mortalidade_materna_100k_nv": 284.0,
        "meta_rmm_100k": 30.0,
        "puerpera_consulta_ate_42dias_pct": 42.4,
        "citopatologico_cobertura_pct": 38.4,
        "meta_citopatologico_pct": 80.0,
        "mammografia_cobertura_pct": 18.4,
        "meta_mammografia_pct": 70.0,
        "colposcopia_apui": False,
        "espera_colposcopia_sisreg_dias": 240,
        "cancer_colo_nv_2025": 8,
        "cancer_mama_2025": 6,
        "planejamento_familiar_cobertura_pct": 42.4,
        "laqueadura_sem_consentimento_casos": 4,
        "contraceptivo_diu_disponivel": False,
        "implante_disponivel": False,
        "violencia_obstetrica_relato_pct": 62.4,
        "episiotomia_rotina_pct": 52.4,
        "parto_humanizado_apui": False,
        "ginecologista_apui": 0,
        "obstetra_apui": 0,
        "mastologista_apui": 0,
        "enfermeira_obstetra_apui": 1,
        "ubs_prenatal_apui": 8,
        "status_mortalidade": "critico",
        "status_prenatal": "critico",
        "status_cancer": "critico",
    }


@lru_cache(maxsize=1)
def _PROGRAMAS():
    return [
        {"programa": "Pré-natal — 1ª consulta no 1º trimestre",
         "cobertura_pct": 42.4, "meta_pct": 100.0, "gestantes_2025": 420,
         "status": "critico",
         "observacao": "42,4% das gestantes iniciam pré-natal no 1º trimestre (meta 100%). 84 casos de sífilis gestacional — 28 casos de sífilis congênita (100% evitável com VDRL + penicilina R$ 8,40/ampola). 28,4% das gestantes são adolescentes. Meta Rede Cegonha: > 60% com ≥ 6 consultas. ACS: toda mulher com atraso menstrual > 2 semanas agendada em 5 dias úteis."},
        {"programa": "Rastreamento câncer de colo do útero (citopatológico)",
         "cobertura_pct": 38.4, "meta_pct": 80.0, "gestantes_2025": 0,
         "status": "critico",
         "observacao": "38,4% das mulheres 25-64a com citopatológico em dia (meta INCA 80%). 2.020 mulheres sem coleta atualizada. Colposcopia: zero em Apuí — fila SISREG 240 dias. NIC III tratado com LEEP (R$ 280): cura 98% vs câncer invasivo: mortalidade 50%/5a. Mutirão: R$ 28.000 → 2.020 coletas em 6 meses."},
        {"programa": "Rastreamento câncer de mama (mamografia)",
         "cobertura_pct": 18.4, "meta_pct": 70.0, "gestantes_2025": 0,
         "status": "critico",
         "observacao": "18,4% das mulheres 50-69a com mamografia em dia (meta MS 70%). 684 mulheres nessa faixa. Mamógrafo em Apuí: zero. Estádio I: sobrevida 97%/5a vs Estádio III: 40%. Caravana mamografia SES-AM: R$ 84.000 → 500 exames em 1 semana (INCA parceria disponível)."},
        {"programa": "Sífilis gestacional e congênita — cobertura de testagem",
         "cobertura_pct": 62.4, "meta_pct": 100.0, "gestantes_2025": 420,
         "status": "critico",
         "observacao": "84 casos de sífilis gestacional — 28 de sífilis congênita (266/100k NV, meta OMS < 50/100k). 62,4% das gestantes testadas no 1º trimestre (meta 100%). Parceiro tratado: apenas 38%. Teste rápido sífilis: R$ 2,80 — 1 min resultado. Custo de 1 SC não tratado: surdez + retardo + morte = R$ 284.000."},
        {"programa": "Planejamento familiar — método anticoncepcional disponível",
         "cobertura_pct": 42.4, "meta_pct": 80.0, "gestantes_2025": 0,
         "status": "critico",
         "observacao": "DIU: zero disponível (MS fornece via RENAME: R$ 0). Implante subdérmico: zero disponível. 68,4% das gestações não planejadas. 4 casos de laqueadura sem consentimento adequado registrados. Lei 9.263/96: município obrigado a ofertar todos os métodos. Capacitação de inserção de DIU: 40h EAD (ENAP gratuito)."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Auditoria e qualificação do pré-natal — captação no 1º trimestre",
         "implementada": False, "custo": 8400, "prazo_meses": 1,
         "observacao": "42,4% de captação no 1º tri. RMM 284/100k (meta 30/100k). Auditoria: R$ 8.400. ACS: toda mulher com atraso menstrual > 2 semanas agendada em 5 dias. Protocolo eclâmpsia: sulfato de magnésio — disponível no REMUME. 1 óbito materno evitado: R$ 2,8M de impacto social."},
        {"acao": "Mutirão de citopatológico — meta 80% de cobertura em 6 meses",
         "implementada": False, "custo": 28000, "prazo_meses": 6,
         "observacao": "38,4% de cobertura. 2.020 mulheres sem coleta. 4 UBSs × 50 coletas/dia × 10 semanas = 2.000 coletas. Custo: R$ 28.000. LEEP para NIC III: R$ 280 vs câncer invasivo R$ 84.000 + mortalidade 50%. ROI 300:1."},
        {"acao": "Solicitação de DIU e implante subdérmico via RENAME/DAF",
         "implementada": False, "custo": 0, "prazo_meses": 1,
         "observacao": "R$ 0. DIU: 1.200 mulheres/ano × 5 anos = 6.000 gestações não planejadas evitadas. Capacitação inserção DIU: 40h ENAP/EAD. 1 gestação não planejada evitada = R$ 2.800 (pré-natal + parto SUS). Implante: 3 anos de proteção, inserção simples no consultório."},
        {"acao": "Caravana de mamografia (mamógrafo itinerante) — SES-AM",
         "implementada": False, "custo": 84000, "prazo_meses": 3,
         "observacao": "18,4% de cobertura (meta 70%). SES-AM envia unidade móvel 1 semana → 500 exames. Custo: R$ 84.000. Ofício formal ao Departamento de Regulação/SES-AM. Caso detectado no estádio I: sobrevida 97% vs estádio III: 40%/5a."},
        {"acao": "Comitê Municipal de Mortalidade Materna (CMMM) — obrigatório por lei",
         "implementada": False, "custo": 4200, "prazo_meses": 2,
         "observacao": "3 óbitos maternos em 2025. CMMM obrigatório (Portaria MS 1.119/2008). Custo: R$ 4.200/ano (reuniões + fichas SINAN). Causa identificada: intervenção imediata no protocolo. Ácido acetilsalicílico 100mg + cálcio 1g/dia em gestantes alto risco: R$ 0,84/mês — redução de eclâmpsia em 17%."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "prenatal_1tri_pct": 32.4, "citop_pct": 28.4, "mamografia_pct": 12.4, "sifilis_cong": 34, "obito_materno": 4},
        {"ano": "2023", "prenatal_1tri_pct": 36.4, "citop_pct": 32.4, "mamografia_pct": 14.8, "sifilis_cong": 32, "obito_materno": 4},
        {"ano": "2024", "prenatal_1tri_pct": 39.2, "citop_pct": 35.4, "mamografia_pct": 16.8, "sifilis_cong": 30, "obito_materno": 3},
        {"ano": "2025", "prenatal_1tri_pct": 42.4, "citop_pct": 38.4, "mamografia_pct": 18.4, "sifilis_cong": 28, "obito_materno": 3},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Razão mortalidade materna (meta: ≤ 30/100k NV)",    "valor": 284.0, "meta": 30.0,  "unidade": "/100k NV", "status": "critico", "observacao": "284/100k (9,5× meta OMS). 3 óbitos 2025. CMMM: R$ 4.200/ano. Eclâmpsia: AAS + cálcio = R$ 0,84/mês."},
        {"indicador": "Pré-natal 1ª consulta no 1º trimestre (meta 100%)",  "valor": 42.4,  "meta": 100.0, "unidade": "%",        "status": "critico", "observacao": "42,4%. ACS capta em 5 dias do atraso. Teste rápido gravidez: R$ 1,40. 1 óbito evitado: R$ 2,8M."},
        {"indicador": "Sífilis congênita (meta: ≤ 0,5/1.000 NV)",          "valor": 28.0,  "meta": 0.5,   "unidade": "casos",    "status": "critico", "observacao": "28 casos (266/100k NV). 100% evitável. Penicilina: R$ 8,40/ampola. Custo de 1 SC: R$ 284.000."},
        {"indicador": "Citopatológico cobertura (meta: ≥ 80%)",            "valor": 38.4,  "meta": 80.0,  "unidade": "%",        "status": "critico", "observacao": "38,4%. Mutirão R$ 28.000 → 2.020 coletas. NIC III + LEEP R$ 280 vs Ca invasivo R$ 84.000."},
        {"indicador": "Mamografia cobertura 50-69a (meta: ≥ 70%)",         "valor": 18.4,  "meta": 70.0,  "unidade": "%",        "status": "critico", "observacao": "18,4%. Caravana SES-AM R$ 84.000 → 500 exames. Estádio I: sobrevida 97%."},
        {"indicador": "DIU disponível nas UBSs (meta: 100% das UBSs)",     "valor": 0,     "meta": 8,     "unidade": "UBSs",     "status": "critico", "observacao": "Zero UBSs. MS fornece via RENAME: R$ 0. Capacitação 40h EAD. 6.000 gestações não planejadas evitadas/5a."},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/programas")
def programas():
    return _PROGRAMAS()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()