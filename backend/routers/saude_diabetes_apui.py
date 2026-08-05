from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-diabetes-apui", tags=["saude_diabetes_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_total": 24700,
        "dm_prevalencia_estimada_pct": 9.4,
        "dm_casos_estimados": 2322,
        "dm_cadastrados_hiperdia": 1684,
        "dm_cobertura_pct": 72.5,
        "dm_hba1c_controlada_pct": 42.4,
        "meta_hba1c_controlada_pct": 50.0,
        "dm_hba1c_disponivel_laboratorio": True,
        "dm_hba1c_espera_dias": 14,
        "insulina_disponivel_ubs_pct": 62.5,
        "insulina_desabastecimento_dias_ano": 28,
        "metformina_desabastecimento_dias_ano": 28,
        "glicosimetro_ubs_funcionando_pct": 75.0,
        "fita_glicemia_disponivel_pct": 68.4,
        "nutricionista_municipal": 0,
        "endocrinologista_municipio": 0,
        "dm_amputacao_pé_diabetico_ano": 12,
        "dm_retinopatia_rastreada_pct": 18.4,
        "dm_neuropatia_rastreada_pct": 22.4,
        "dm_nefropatia_microalbuminuria_pct": 18.4,
        "dm_internacoes_descompensacao_ano": 84,
        "dm_cetoacidose_internacoes_ano": 12,
        "status_controle": "critico",
        "status_complicacoes": "critico",
        "status_insumos": "atencao",
    }


@lru_cache(maxsize=1)
def _COMPLICACOES():
    return [
        {"complicacao": "Pé diabético e amputações",     "rastreado_pct": 28.4, "complicados_estimados": 284, "internacoes_ano": 48, "status": "critico",
         "observacao": "12 amputações/ano — 3x acima da meta. Rastreio de neuropatia periférica com monofilamento: realizado em 22,4% dos diabéticos. Podólogo: zero no município. Protocolo de pé diabético: informal, sem sala de curativo especializado. Custo de 1 amputação: R$ 12.800 + reabilitação R$ 18.000 vs R$ 480/ano de prevenção integral com podólogo"},
        {"complicacao": "Retinopatia diabética",          "rastreado_pct": 18.4, "complicados_estimados": 320, "internacoes_ano": 8,  "status": "critico",
         "observacao": "81,6% sem rastreio de retinopatia. Retinógrafo: inexistente em Apuí. Oftalmologista: zero no município. Rastreio via foto de fundo com retinógrafo portátil na APS: solução viável para municípios amazônicos (custo R$ 28k). Cegueira diabética: irreversível, prevenível com rastreio bienal"},
        {"complicacao": "Nefropatia diabética",           "rastreado_pct": 18.4, "complicados_estimados": 248, "internacoes_ano": 12, "status": "critico",
         "observacao": "81,6% sem rastreio de nefropatia (microalbuminúria + creatinina anual). Nefropatia: principal causa de hemodiálise no município. Detecção em estágio G1-G2: IECA + controle glicêmico param progressão. Custo de hemodiálise/paciente/ano: R$ 50.400 vs R$ 28/ano de microalbuminúria"},
        {"complicacao": "Neuropatia periférica",          "rastreado_pct": 22.4, "complicados_estimados": 420, "internacoes_ano": 4,  "status": "critico",
         "observacao": "77,6% sem rastreio com monofilamento. Neuropatia não detectada = pé sem sensibilidade = ferida sem dor = amputação. Monofilamento 10g: custo R$ 12/unidade. Rastreio annual de todos os diabéticos com > 5 anos de doença: reduz amputação em 50-60%"},
        {"complicacao": "Doença cardiovascular (DM+HAS)", "rastreado_pct": 48.4, "complicados_estimados": 680, "internacoes_ano": 38, "status": "atencao",
         "observacao": "DM + HAS = risco cardiovascular 4-6x maior. 680 estimados com síndrome metabólica. Rastreio ECG basal: 48,4% dos DM+HAS. Estatina: disponível mas com desabastecimento médio 21 dias/ano. Aspirina preventiva: prescrita em 38,4% dos elegíveis"},
        {"complicacao": "Cetoacidose diabética (DM1)",    "rastreado_pct": 0,    "complicados_estimados": 84,  "internacoes_ano": 12, "status": "critico",
         "observacao": "12 cetoacidoses/ano — mortalidade hospitalar 14,2% (meta < 5%). DM1 em criança/adolescente: diagnóstico tardio em 72,4% dos casos (apresentação em cetoacidose). Insulina NPH/Regular: disponível no HMM mas falta média 28 dias/ano nas UBS. Criança DM1 em zona ribeirinha: sem acesso a insulina por 4-6 semanas/ano"},
    ]


@lru_cache(maxsize=1)
def _INSUMOS():
    return [
        {"insumo": "Metformina 500/850mg",             "disponivel_pct": 78.4, "desabastecimento_dias_ano": 28, "status": "atencao",
         "observacao": "28 dias/ano sem metformina = 1.684 diabéticos sem medicação basal. Custo da embalagem: R$ 2,40/mês (RENAME). Ruptura de estoque por falha de licitação amazônica — critério de entrega não contempla frete fluvial. Solução: estoque estratégico de 120 dias em vez de 30 dias"},
        {"insumo": "Insulina NPH (100 UI/mL)",          "disponivel_pct": 62.5, "desabastecimento_dias_ano": 42, "status": "critico",
         "observacao": "42 dias/ano sem insulina nas UBS. Cadeia frio essencial: 5/8 UBS com cadeia frio inadequada = perda de eficácia mesmo quando disponível. DM1: sem insulina = cetoacidose em 24-48h. DM2 insulinizado: descompensação em 5-7 dias. Alternativa de urgência: HMM tem estoque — mas UBS rurais ficam sem"},
        {"insumo": "Insulina Regular (10 UI/mL)",       "disponivel_pct": 50.0, "desabastecimento_dias_ano": 48, "status": "critico",
         "observacao": "Maior desabastecimento do portfólio diabético. Regular usada em cetoacidose e pré-operatório. 48 dias/ano sem regular no HMM = cetoacidose tratada com NPH = risco de hipoglicemia refratária. Farmácia popular: cidade sem farmácia popular credenciada"},
        {"insumo": "Fita de glicemia (glicosímetro)",   "disponivel_pct": 68.4, "desabastecimento_dias_ano": 38, "status": "critico",
         "observacao": "31,6% das UBS sem fita. Glicosímetro funcionando: 75%. Automonitoramento domiciliar: não é fornecido na rede pública. Paciente DM1: sem glicosímetro domiciliar = não detecta hipoglicemia noturna. Custo fita: R$ 1,20/teste — R$ 43/mês para automonitoramento 3x/dia"},
        {"insumo": "Hemoglobina glicada (HbA1c)",       "disponivel_pct": 84.2, "desabastecimento_dias_ano": 14, "status": "atencao",
         "observacao": "Disponível no laboratório municipal com espera de 14-21 dias. 14 dias de desabastecimento de reagente/ano. Frequência ideal: a cada 3 meses para DM descompensado. Frequência real: 1x/ano por dificuldade de acesso e custo do transporte ao laboratório"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "dm_cadastrados": 1484, "hba1c_controlada_pct": 32.4, "amputacoes": 16, "cetoacidose_internacoes": 16},
        {"ano": "2023", "dm_cadastrados": 1548, "hba1c_controlada_pct": 35.8, "amputacoes": 15, "cetoacidose_internacoes": 14},
        {"ano": "2024", "dm_cadastrados": 1624, "hba1c_controlada_pct": 39.4, "amputacoes": 13, "cetoacidose_internacoes": 13},
        {"ano": "2025", "dm_cadastrados": 1684, "hba1c_controlada_pct": 42.4, "amputacoes": 12, "cetoacidose_internacoes": 12},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "DM com HbA1c controlada",            "valor": 42.4, "meta": 50.0, "unidade": "%",       "status": "critico", "observacao": "7,6 pontos abaixo da meta. Metformina + insulina em falta 28-42 dias/ano são a principal causa estrutural. Sem nutricionista: orientação dietética inexistente. Automonitoramento domiciliar: não fornecido. Endocrinologista: TFD para Humaitá/Manaus — consulta a cada 6-12 meses vs ideal trimestral"},
        {"indicador": "Pé diabético — rastreio (monofilamento)", "valor": 22.4, "meta": 80.0, "unidade": "%",  "status": "critico", "observacao": "77,6% sem rastreio anual. Monofilamento 10g custa R$ 12 e dura 3 anos. Rastreio anual de todos os 1.684 DM cadastrados = R$ 1.684 de insumo/ano. Custo de 1 amputação: R$ 30.800. ROI do rastreio: 18.000:1 — intervenção mais custo-efetiva da medicina preventiva"},
        {"indicador": "Retinopatia — rastreio",              "valor": 18.4, "meta": 80.0, "unidade": "%",       "status": "critico", "observacao": "81,6% sem rastreio. Retinógrafo portátil com IA para leitura remota: solução para Apuí (R$ 28k equipamento). Cegueira diabética irreversível: 8 casos estimados em desenvolvimento silencioso. Cada caso de cegueira = impacto econômico R$ 480k em aposentadoria precoce + cuidado"},
        {"indicador": "Amputações por pé diabético",         "valor": 12,   "meta": 4,    "unidade": "casos/ano","status": "critico","observacao": "3x a meta. Tendência de redução lenta (16→12 em 4 anos). Com protocolo completo (rastreio + podólogo + educação): redução de 50-60% em 2 anos. Custo de implantar protocolo: R$ 84k/ano. Economia projetada: R$ 246k/ano em amputações evitadas"},
        {"indicador": "Cetoacidose — mortalidade hosp.",     "valor": 14.2, "meta": 5.0,  "unidade": "%",       "status": "critico", "observacao": "2,8x a meta. DM1 em cetoacidose grave sem UTI = transfer para Manaus (784 km). Mortalidade no trajeto: estimada mas não contabilizada. Protocolo de cetoacidose no HMM existe mas sem médico treinado em plantão noturno"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/complicacoes")
def complicacoes():
    return _COMPLICACOES


@router.get("/insumos")
def insumos():
    return _INSUMOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
