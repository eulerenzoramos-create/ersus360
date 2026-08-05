from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-cardiovascular-apui", tags=["saude_cardiovascular_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_total": 24700,
        "has_prevalencia_estimada_pct": 22.4,
        "has_casos_estimados": 5533,
        "has_cadastrados_hiperdia": 3684,
        "has_pa_controlada_pct": 38.4,
        "meta_has_controlada_pct": 50.0,
        "has_desabastecimento_anti_hipertensivo_dias_ano": 48,
        "iam_internacoes_ano": 28,
        "iam_mortalidade_hospitalar_pct": 21.4,
        "iam_tempo_porta_balao_minutos": 0,
        "iam_trombolise_disponivel": False,
        "avc_internacoes_ano": 38,
        "avc_mortalidade_hospitalar_pct": 18.4,
        "avc_sequela_permanente_pct": 64.2,
        "avc_trombolitico_disponivel": False,
        "avc_tempo_janela_terapeutica_perdido_pct": 98.4,
        "ic_internacoes_ano": 48,
        "ic_reinternacao_30d_pct": 28.4,
        "cardiologista_municipio": 0,
        "ecg_disponivel_ubs": False,
        "ecg_referencia": "HMM Apuí (sede) — aguarda cardiologista",
        "ecocardiograma_referencia": "Humaitá (284 km) ou Manaus (784 km)",
        "mortalidade_cardiovascular_100k": 184.0,
        "media_nacional_cardiovascular_100k": 142.0,
        "status_has": "critico",
        "status_iam": "critico",
        "status_avc": "critico",
    }


@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {"condicao": "Hipertensão Arterial Sistêmica (HAS)", "estimados": 5533, "cadastrados": 3684, "controlados_pct": 38.4, "internacoes_ano": 84, "status": "critico",
         "observacao": "3.684 cadastrados no HIPERDIA, 1.849 não cadastrados. PA controlada: 38,4% (meta 50%). Principal barreira: desabastecimento de anti-hipertensivos 48 dias/ano — paciente sem medicação retorna ao descontrole em 7-10 dias. Médico novo recomeça conduta = tempo de titulação perdido. ACS visita hipertenso descompensado mas não tem acesso a ajuste de dose imediato"},
        {"condicao": "Infarto Agudo do Miocárdio (IAM)",     "estimados": 0,    "cadastrados": 0,    "controlados_pct": 0,   "internacoes_ano": 28, "status": "critico",
         "observacao": "28 internações/ano, mortalidade hospitalar 21,4% (meta < 10%). Zero trombólise disponível no HMM. Zero balão intraórtico. Zero USIC (Unidade Semicrítica Cardiovascular). Tempo sintoma-tratamento > 6h em 94% dos casos: janela terapêutica perdida. IAM com supra de ST = transfer para Manaus (784 km, 5-8h) = mortalidade no trajeto não contabilizada"},
        {"condicao": "Acidente Vascular Cerebral (AVC)",     "estimados": 0,    "cadastrados": 0,    "controlados_pct": 0,   "internacoes_ano": 38, "status": "critico",
         "observacao": "38 AVC/ano. Mortalidade hospitalar 18,4%. Sequela permanente em 64,2% dos sobreviventes. rt-PA (trombólise): não disponível no HMM. Tomógrafo: zero em Apuí — diagnóstico de AVC hemorrágico vs isquêmico impossível sem TC = trombólise contraindicada sem diagnóstico. Janela terapêutica (4,5h): 98,4% dos casos chegam fora da janela"},
        {"condicao": "Insuficiência Cardíaca (IC)",          "estimados": 0,    "cadastrados": 0,    "controlados_pct": 0,   "internacoes_ano": 48, "status": "atencao",
         "observacao": "IC = principal causa de internação cardiovascular repetida. Reinternação em 30 dias: 28,4% (meta < 15%). Sem cardiologista: ajuste de dose de furosemida/espironolactona feito pelo clínico sem ecocardiograma de controle. Pesagem diária e restrição hídrica: sem educação do paciente por falta de nutricionista/enfermeiro especializado"},
        {"condicao": "Fibrilação Atrial (FA)",               "estimados": 184,  "cadastrados": 42,   "controlados_pct": 22.4, "internacoes_ano": 12, "status": "critico",
         "observacao": "FA = maior fator de risco para AVC isquêmico (risco 5x). Anticoagulação: warfarina em 84,2% dos casos com INR monitorado a cada 21-28 dias (meta: 7-14 dias). DOAC (apixabana, rivaroxabana): sem dispensação na farmácia municipal — custo R$ 280-420/mês para o paciente. Cardioversão: zero em Apuí"},
    ]


@lru_cache(maxsize=1)
def _FATORES_RISCO():
    return [
        {"fator": "Tabagismo",                "prevalencia_adultos_pct": 18.4, "meta_pct": 12.0, "status": "atencao", "observacao": "18,4% de tabagistas adultos (AM: 14,2%, BR: 12,6%). Programa de cessação tabágica: zero psicólogo, zero grupo de apoio. Terapia farmacológica (bupropiona, vareniclina): não dispensada na rede municipal. Exposição passiva em domicílio: 28,4% das crianças"},
        {"fator": "Obesidade (IMC > 30)",     "prevalencia_adultos_pct": 22.4, "meta_pct": 15.0, "status": "critico","observacao": "22,4% de adultos obesos. Nutricionista municipal: zero. Academia da Saúde: não implantada. NASF sem nutricionista substitui parcialmente. Obesidade + HAS + DM = síndrome metabólica em 14,2% dos adultos — triple risco cardiovascular"},
        {"fator": "Sedentarismo",             "prevalencia_adultos_pct": 58.4, "meta_pct": 40.0, "status": "critico","observacao": "58,4% de adultos sem atividade física regular. Infraestrutura de lazer: zero parque municipal, zero academia ao ar livre em bom estado. Agente Comunitário de Saúde: orienta mas sem espaço de prática. Calor amazônico + horário de trabalho = barreira real para exercício físico"},
        {"fator": "Dislipidemia",             "prevalencia_adultos_pct": 28.4, "meta_pct": 20.0, "status": "atencao","observacao": "Colesterol total médio: não monitorado na rede. Rastreio lipídico: 42,4% dos hipertensos sem perfil lipídico nos últimos 12 meses. Sinvastatina: disponível, mas desabastecimento médio 21 dias/ano. Sem nutricionista: orientação dietética não sistematizada"},
        {"fator": "Consumo excessivo de álcool","prevalencia_adultos_pct": 24.4,"meta_pct": 15.0, "status": "critico","observacao": "24,4% de consumo de risco (AUDIT > 8). CAPS AD: zero em Apuí — referência Humaitá (284 km). Consulta breve para alcoolismo: capacitação de APS insuficiente. Alcoolismo + HAS = PA incontrolável. Violência doméstica associada em 42,4% dos episódios de consumo intenso"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "has_controlada_pct": 28.4, "iam_internacoes": 34, "avc_internacoes": 44, "mortalidade_cv_100k": 204.0},
        {"ano": "2023", "has_controlada_pct": 31.4, "iam_internacoes": 32, "avc_internacoes": 42, "mortalidade_cv_100k": 196.0},
        {"ano": "2024", "has_controlada_pct": 35.4, "iam_internacoes": 30, "avc_internacoes": 40, "mortalidade_cv_100k": 190.0},
        {"ano": "2025", "has_controlada_pct": 38.4, "iam_internacoes": 28, "avc_internacoes": 38, "mortalidade_cv_100k": 184.0},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "HAS com PA controlada",            "valor": 38.4,  "meta": 50.0,  "unidade": "%",       "status": "critico", "observacao": "11,6 pontos abaixo da meta. Barreira estrutural: anti-hipertensivo em falta 48 dias/ano. Cada evento de desabastecimento derruba o controle de toda a coorte. Solução: contrato de fornecimento com cláusula de entrega amazônica + estoque estratégico de 90 dias"},
        {"indicador": "Mortalidade cardiovascular/100k",  "valor": 184.0, "meta": 142.0, "unidade": "/100k",   "status": "critico", "observacao": "29,6% acima da média nacional. IAM e AVC = principais causas. Mortalidade no trajeto (transfer 5-8h) não contabilizada: mortalidade real é subestimada. Cada IAM sem trombólise = mortalidade 3x maior"},
        {"indicador": "IAM — mortalidade hospitalar",     "valor": 21.4,  "meta": 10.0,  "unidade": "%",       "status": "critico", "observacao": "2x acima da meta. Sem trombólise, sem USIC, sem cardiologista de plantão: IAM em Apuí = sobrevivência por sorte. Implantação de protocolo de trombólise no HMM (médico clínico + kit trombolítico) poderia reduzir mortalidade em 30-40%"},
        {"indicador": "AVC — janela terapêutica atingida","valor": 1.6,   "meta": 30.0,  "unidade": "%",       "status": "critico", "observacao": "98,4% dos AVC chegam fora da janela de 4,5h. Distância + ausência de TC + ausência de rt-PA = AVC isquêmico não tratável em Apuí. Investimento necessário: tomógrafo no HMM + protocolo de trombólise = viável com emenda parlamentar"},
        {"indicador": "Reinternação por IC em 30 dias",   "valor": 28.4,  "meta": 15.0,  "unidade": "%",       "status": "critico", "observacao": "Quase 2x a meta. IC reinternação é prevenível com manejo correto pós-alta. Alta sem pesagem diária prescrita, sem restrição hídrica documentada, sem consulta de retorno em 7 dias = reinternação previsível em 30 dias"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/condicoes")
def condicoes():
    return _CONDICOES


@router.get("/fatores-risco")
def fatores_risco():
    return _FATORES_RISCO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
