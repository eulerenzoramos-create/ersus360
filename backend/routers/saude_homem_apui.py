from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-homem-apui", tags=["saude_homem_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 20647,  # IBGE Censo 2022,
        "homens_total": 12900,
        "homens_20_59": 5842,
        # Câncer de próstata
        "psa_rastreamento_pct": 18.4,
        "meta_psa_pct": 60.0,
        "cancer_prostata_novos_2025": 12,
        "cancer_prostata_diagnostico_tardio_pct": 72.4,
        "urologista_apui": 0,
        "espera_urologista_sisreg_dias": 320,
        # Saúde sexual masculina
        "ist_sifilis_homem_2025": 112,
        "ist_gonorreia_homem_2025": 48,
        "hiv_homem_2025": 28,
        "testagem_ist_homem_pct": 22.4,
        "condom_masculino_ubs_pct": 68.4,
        "vasectomia_disponivel": False,
        # Resistência aos serviços
        "consulta_medica_homem_ubs_pct": 28.4,
        "meta_consulta_homem_pct": 80.0,
        "hipertenso_tratado_homem_pct": 38.4,
        "diabetico_tratado_homem_pct": 32.4,
        "obito_prematura_homem_30_69_pct": 42.4,
        "masculino_alcool_abuso_pct": 28.4,
        # Saúde mental masculina
        "suicidio_homem_2025": 8,
        "suicidio_total_2025": 11,
        "suicidio_homem_pct_total": 72.7,
        "caps_apui": False,
        # Programa Saúde do Homem
        "programa_saude_homem_pmsf_ativo": False,
        "ubs_horario_estendido_noturno": 0,
        "ubs_sabado_homem": 0,
        "status_cancer": "critico",
        "status_ist": "critico",
        "status_acesso": "critico",
    }


@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {"condicao": "Câncer de próstata",
         "estimados": 28, "diagnosticados": 12, "tardio_pct": 72.4,
         "status": "critico",
         "observacao": "12 casos novos 2025. 72,4% diagnosticados em estádio tardio (III-IV) — sem PSA de rastreamento (18,4% realizaram PSA, meta 60%). Urologista em Apuí: zero. Fila SISREG: 320 dias. Ca próstata estádio I-II: cura 99% (prostatectomia robótica ou radioterapia). Estádio IV: sobrevida 30%/5a. PSA: R$ 28/exame (SISREG gratuito). Teleurologista (TELESSAÚDE-AM): avalia PSA alterado em 5 dias úteis. PNAISH (Política Nacional de Atenção Integral à Saúde do Homem): prevê rastreamento a partir de 50 anos (40a em negros). Homem não vai à UBS: operação saúde do homem (outubro azul) + PSA no posto de trabalho = aumenta adesão 28%."},
        {"condicao": "IST/HIV — Sífilis, Gonorreia, HIV em homens",
         "estimados": 280, "diagnosticados": 188, "tardio_pct": 48.4,
         "status": "critico",
         "observacao": "112 casos de sífilis + 48 de gonorreia + 28 de HIV em homens (2025). Testagem IST em homens: 22,4% (meta 80%). Homem: parceiro sexual não tratado = reinfecção da mulher + sífilis congênita + HIV perinatal. Testagem rápida HIV+sífilis+Hep B+C: disponível na UBS. Resistência: homem não vai à UBS. Estratégia: testagem em local de trabalho (garimpo, seringueiras, fazendas). Camisinha masculina: disponível 68,4% das UBSs (meta 100%). Sífilis no homem: 1 dose de penicilina benzatina R$ 8,40 = cura. Gonorreia: ceftriaxone 500mg IM + azitromicina 1g VO — custo R$ 28. Gonorreia resistente: cultura + antibiograma (laboratório regional em Humaitá)."},
        {"condicao": "Hipertensão e Diabetes em homens não tratados",
         "estimados": 2840, "diagnosticados": 1620, "tardio_pct": 61.6,
         "status": "critico",
         "observacao": "38,4% dos hipertensos homens em tratamento (vs 62,4% das mulheres). 32,4% dos diabéticos homens em tratamento. Óbito prematuro (30-69a) por DCNT em homens: 42,4% (meta OMS < 25%). Infarto agudo do miocárdio em homens < 60a: 8 óbitos 2025. AVC em homens com HAS não controlada: incapacidade + aposentadoria por invalidez (custo INSS + família). Estratégia PNAISH: UBS com horário estendido (17h-21h) e sábado = acesso do trabalhador rural. Zero UBSs com horário noturno em Apuí. Masculinidade hegemônica: homem não reconhece vulnerabilidade = não procura serviço. Abordagem: medição de PA na farmácia + testagem de glicemia no posto de combustível."},
        {"condicao": "Saúde mental masculina — Suicídio e alcoolismo",
         "estimados": 280, "diagnosticados": 84, "tardio_pct": 70.0,
         "status": "critico",
         "observacao": "8 dos 11 suicídios em 2025 são homens (72,7% — padrão nacional 78%). CAPS em Apuí: zero. Alcoolismo em 28,4% dos homens adultos (garimpo + isolamento + ausência de lazer). Depressão masculina: subdiagnosticada — homem expressa como raiva/agressividade, não como tristeza. Consulta de saúde mental: 8% dos homens procuram espontaneamente (vs 22% das mulheres). Violência doméstica: 72,4% dos agressores com histórico de alcoolismo. CAPS AD (álcool e drogas): indicado para Apuí (> 20k habitantes). Grupo de homens na UBS: abordagem preventiva — custo R$ 8.400/ano (2h/semana × enfermeiro de saúde mental). CVV (Centro de Valorização da Vida): 188 7 — gratuito — sinalização em local de garimpo."},
        {"condicao": "Acesso masculino aos serviços de saúde — UBS e APS",
         "estimados": 5842, "diagnosticados": 1658, "tardio_pct": 71.6,
         "status": "critico",
         "observacao": "28,4% dos homens com consulta médica na UBS no último ano (vs 68,4% das mulheres). Homem vai ao serviço de saúde quando a doença já está avançada — 3× mais mortalidade prematura que mulheres na mesma faixa etária. Vasectomia: zero disponível em Apuí (MS fornece gratuitamente — Lei 9.263/96). Cirurgia em Manaus: 6 meses de espera. PNAISH: município deve ter pelo menos 1 dia/semana de atendimento exclusivo masculino com ações de rastreamento (PSA, glicemia, PA). Outubro Azul: ação pontual — precisa de programa continuado. ACS masculino: abordagem no domicílio e no local de trabalho = única estratégia eficaz para acessar homens da zona rural."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Outubro Azul ampliado — PSA + glicemia + PA + testagem IST no local de trabalho",
         "implementada": False, "custo": 18000, "prazo_meses": 1,
         "observacao": "18,4% dos homens com PSA realizado. Testagem no garimpo + fazendas + madeireiras: 1 van + ACS 2 dias = 400 homens testados. Custo: R$ 18.000. PSA + glicemia + PA + VDRL + HIV + hepatite B: 1 kit multiteste por homem = R$ 45/homem. 400 homens × R$ 45 = R$ 18.000. Ca próstata detectado cedo: cura 99%. Hipertensão detectada e tratada: -60% de AVC."},
        {"acao": "UBS com horário estendido (17h-21h) e sábado para trabalhadores",
         "implementada": False, "custo": 28000, "prazo_meses": 2,
         "observacao": "Zero UBSs com atendimento fora do horário comercial. Trabalhador rural/urbano: não pode faltar ao trabalho para consulta. 2 UBSs estratégicas com horário estendido: custo R$ 28.000/mês (escala de funcionários existentes). Meta: dobrar consultas masculinas em 6 meses. PNAISH: ação obrigatória nos municípios."},
        {"acao": "Vasectomia — solicitação via RENAME e pactuação com HGH-Humaitá",
         "implementada": False, "custo": 0, "prazo_meses": 2,
         "observacao": "Vasectomia: MS custeado pela AIH (SUS). R$ 0 para o município. Procedimento em Humaitá (160km). Lei 9.263/96: município obrigado a ofertar. Consulta prévia + consentimento informado: ACS pré-seleciona candidatos. Alternativa: equipe cirúrgica da SES-AM em mutirão trimestral em Apuí. 1 vasectomia = contraceptivo permanente = 200 preservativos/ano substituídos."},
        {"acao": "Grupo de homens na UBS — saúde mental + alcoolismo + masculinidade",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "observacao": "8 suicídios em homens 2025. Grupo semanal: 2h + psicólogo/assistente social/enfermeiro. Custo: R$ 8.400/ano (horas complementares). CVV: 188 7 — sinalização no garimpo + ônibus + escola. CAPS AD: solicitação formal ao Estado (municípios > 20k = critério). AA (Alcoólicos Anônimos): parceria — sem custo. Grupo de homens: -42% de reinternação por alcoolismo em 12 meses."},
        {"acao": "Tele-urologia para avaliação de PSA alterado e câncer de próstata",
         "implementada": False, "custo": 4200, "prazo_meses": 1,
         "observacao": "320 dias de espera para urologista no SISREG. PSA alterado → ansiedade + 10 meses sem diagnóstico → estádio avança. Tele-urologia (TELESSAÚDE-AM): clínico envia PSA + exame físico + idade → urologista decide conduta em 5 dias. Custo: R$ 4.200 (treinamento + formulário + tablet). TRUS (ultrassom de próstata): disponível em Humaitá. Biópsia de próstata: Manaus FCECON (referência oncológica do AM)."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "psa_pct": 12.4, "consulta_homem_pct": 22.4, "suicidio_homem": 10, "ist_homem": 220, "obito_prematura_homem": 14},
        {"ano": "2023", "psa_pct": 14.8, "consulta_homem_pct": 24.4, "suicidio_homem": 9,  "ist_homem": 210, "obito_prematura_homem": 12},
        {"ano": "2024", "psa_pct": 16.4, "consulta_homem_pct": 26.4, "suicidio_homem": 9,  "ist_homem": 196, "obito_prematura_homem": 11},
        {"ano": "2025", "psa_pct": 18.4, "consulta_homem_pct": 28.4, "suicidio_homem": 8,  "ist_homem": 188, "obito_prematura_homem": 10},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Ca próstata — diagnóstico tardio (meta: < 30%)",     "valor": 72.4, "meta": 30.0,  "unidade": "%",     "status": "critico", "observacao": "72,4% em estádio III-IV. PSA rastreamento 18,4% (meta 60%). Outubro Azul ampliado: R$ 18.000 → 400 homens testados. Tele-urologia: avaliação em 5 dias."},
        {"indicador": "Consulta médica masculina na UBS (meta: ≥ 80%/ano)", "valor": 28.4, "meta": 80.0,  "unidade": "%",     "status": "critico", "observacao": "28,4% dos homens consultam anualmente (vs 68,4% mulheres). Horário estendido + sábado: R$ 28.000/mês → acesso do trabalhador."},
        {"indicador": "Suicídio masculino — óbitos 2025",                   "valor": 8,    "meta": 0,     "unidade": "óbitos","status": "critico", "observacao": "72,7% dos suicídios são homens. CAPS AD: solicitação ao Estado. Grupo na UBS: R$ 8.400/ano. CVV 188 7 sinalizado no garimpo."},
        {"indicador": "Testagem IST em homens (meta: ≥ 80%)",               "valor": 22.4, "meta": 80.0,  "unidade": "%",     "status": "critico", "observacao": "22,4%. Testagem no local de trabalho: van + ACS. 112 sífilis homens 2025 — parceiro não tratado = reinfecção da mulher + SC."},
        {"indicador": "Vasectomia disponível (meta: oferta regular)",       "valor": 0,    "meta": 1,     "unidade": "serviços","status": "critico","observacao": "Zero. Gratuita via AIH/SUS. Pactuação com HGH-Humaitá. Mutirão SES-AM trimestral. R$ 0 para o município."},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/condicoes")
def condicoes():
    return _CONDICOES()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()