from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-pcd-apui", tags=["saude_pcd_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_total": 20647,  # IBGE Censo 2022,
        "pcd_estimada_ibge_pct": 8.4,
        "pcd_estimada_total": 2075,
        "pcd_cadastradas_cadsus": 484,
        "cobertura_cadastro_pct": 23.3,
        "bpc_beneficiarios": 284,
        "bpc_cobertura_pcd_pct": 58.7,
        "apae_municipio": False,
        "apae_referencia": "APAE Humaitá (284 km)",
        "fisioterapeuta_municipio": 1,
        "fonoaudiologo_municipio": 0,
        "terapeuta_ocupacional_municipio": 0,
        "psicologo_reabilitacao": 0,
        "consultas_reabilitacao_mes": 48,
        "meta_reabilitacao_mes": 280,
        "laudo_medico_pcd_emissao_dias": 84,
        "meta_laudo_dias": 30,
        "tfd_pcd_viagens_ano": 148,
        "acessibilidade_ubs_adequada_pct": 25.0,
        "inclusao_escola_regular_pct": 72.4,
        "diagnostico_tardio_pct": 64.2,
        "status_reabilitacao": "critico",
        "status_diagnostico": "critico",
        "status_beneficios": "atencao",
    }


@lru_cache(maxsize=1)
def _DEFICIENCIAS():
    return [
        {"tipo": "Deficiência física (motora)",    "prevalencia_estimada": 620, "cadastradas": 148, "reabilitacao_acesso_pct": 18.4, "status": "critico",  "observacao": "Amputações (diabéticos + garimpo): 12/ano. AVC com sequela motora: 18/ano. Fisioterapeuta: 1 para 18.732 hab. Órteses e próteses: confecção em Manaus com fila de 6-18 meses via TFD. Paciente com AVC sem fisioterapia nas primeiras 72h = sequela definitiva evitável"},
        {"tipo": "Deficiência intelectual",         "prevalencia_estimada": 480, "cadastradas": 96,  "reabilitacao_acesso_pct": 12.4, "status": "critico",  "observacao": "APAE em Humaitá (284 km): 1 atendimento/semana para quem consegue chegar. Diagnóstico tardio em 64,2%: criança com DI leve detectada após 7 anos por falta de rastreio. TDA/TDAH: zero psiquiatra infantil. BPC garante renda mas não reabilitação"},
        {"tipo": "Deficiência auditiva",            "prevalencia_estimada": 320, "cadastradas": 48,  "reabilitacao_acesso_pct": 8.4,  "status": "critico",  "observacao": "Teste da orelhinha: 48,4% — perda auditiva congênita não detectada = criança muda funcional. Aparelho auditivo via SUS: fila de 12-18 meses em Manaus. Língua de sinais: zero intérprete de LIBRAS nos serviços de saúde de Apuí"},
        {"tipo": "Deficiência visual",              "prevalencia_estimada": 280, "cadastradas": 42,  "reabilitacao_acesso_pct": 6.4,  "status": "critico",  "observacao": "Triagem visual escolar: 28,4%. Catarata cirúrgica: 18 casos em fila de 14-24 meses (Humaitá ou Manaus). Glaucoma: zero tonômetro em Apuí. Retinopatia diabética: zero retinógrafo, diagnóstico por transferência de paciente"},
        {"tipo": "Deficiência múltipla (2+)",       "prevalencia_estimada": 240, "cadastradas": 84,  "reabilitacao_acesso_pct": 4.8,  "status": "critico",  "observacao": "Necessita de equipe multiprofissional integrada — inexistente em Apuí. Cuidador familiar sem suporte: esgotamento, depressão, abandono de emprego. Centro de referência para deficiência múltipla: Manaus (784 km)"},
        {"tipo": "Transtorno do Espectro Autista",  "prevalencia_estimada": 135, "cadastradas": 66,  "reabilitacao_acesso_pct": 22.4, "status": "critico",  "observacao": "TEA: diagnóstico médio em 5,2 anos em Apuí (meta: 2 anos). Zero psiquiatra infantil, zero neuropediatra. ABA e terapia comportamental: serviço privado apenas. CAPS Infantojuvenil não existe — CAPS I atende adultos e PcD mental simultaneamente"},
    ]


@lru_cache(maxsize=1)
def _BENEFICIOS():
    return [
        {"beneficio": "BPC (deficiência)",          "beneficiarios": 284, "elegibilidade_estimada": 420, "cobertura_pct": 67.6, "status": "atencao", "observacao": "32,4% dos elegíveis sem BPC — dificuldade de acesso ao INSS (sem agência em Apuí), laudo médico com fila de 84 dias, documentação incompleta (zona ribeirinha sem certidão). Renda: 1 salário mínimo = principal fonte de renda familiar para PcD em 84,2% dos casos"},
        {"beneficio": "Passe Livre (LOAS)",         "beneficiarios": 148, "elegibilidade_estimada": 284, "cobertura_pct": 52.1, "status": "atencao", "observacao": "47,9% sem passe livre. Transporte intermunicipal para consultas de reabilitação: sem passe livre, família paga R$ 180-480/viagem para Humaitá/Manaus. Custo torna inviável seguimento regular: paciente abandona reabilitação"},
        {"beneficio": "TFD (Tratamento Fora Dom.)", "beneficiarios": 148, "elegibilidade_estimada": 200, "cobertura_pct": 74.0, "status": "atencao", "observacao": "148 TFDs PcD/ano para reabilitação (fisio, fonoaudiologia, terapia ocupacional). Cada TFD: transporte + diária + acompanhante. Paciente com deficiência física grave: transfer em transporte inadequado = risco de lesão. Fila TFD: 2-4 meses para primeira consulta"},
        {"beneficio": "Laudo médico para benefícios","beneficiarios": 0,  "elegibilidade_estimada": 0,   "cobertura_pct": 0,    "status": "critico", "observacao": "Emissão de laudo em 84 dias (meta: 30 dias). Médico clínico sem capacitação para classificar deficiência pela CIF. Laudos rejeitados pelo INSS por inadequação técnica: 28,4% de primeira análise. PcD em zona ribeirinha: laudo requer viagem à sede (1-2 dias) = barreira adicional"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "pcd_cadastradas": 384, "bpc_beneficiarios": 248, "reabilitacao_pct": 14.4, "tfd_viagens": 112},
        {"ano": "2023", "pcd_cadastradas": 424, "bpc_beneficiarios": 258, "reabilitacao_pct": 15.8, "tfd_viagens": 124},
        {"ano": "2024", "pcd_cadastradas": 458, "bpc_beneficiarios": 272, "reabilitacao_pct": 17.4, "tfd_viagens": 138},
        {"ano": "2025", "pcd_cadastradas": 484, "bpc_beneficiarios": 284, "reabilitacao_pct": 18.4, "tfd_viagens": 148},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura cadastral de PcD",          "valor": 23.3,  "meta": 80.0,  "unidade": "%",       "status": "critico", "observacao": "76,7% das PcD estimadas sem cadastro no sistema. Sem cadastro: sem busca ativa, sem vinculação ao serviço, sem monitoramento. PcD ribeirinha: nunca chegou ao sistema de saúde — invisível para a gestão. Censo Escolar detecta PcD com 7+ anos; sistema de saúde deveria detectar ao nascer"},
        {"indicador": "Acesso à reabilitação",               "valor": 18.4,  "meta": 80.0,  "unidade": "%",       "status": "critico", "observacao": "1 fisioterapeuta para 2.075 PcD estimadas = 48 atendimentos/mês (meta: 280). Fila de espera: 14-18 meses para primeira consulta de fisioterapia. Zero fonoaudiólogo, zero terapeuta ocupacional municipal. Reabilitação via TFD: viagem de 284-784 km a cada sessão — inviável para frequência semanal"},
        {"indicador": "Diagnóstico tardio de deficiência",   "valor": 64.2,  "meta": 10.0,  "unidade": "%",       "status": "critico", "observacao": "64,2% das PcD diagnosticadas após 3 anos de sintomas. DI leve detectada aos 7+ anos: 5 anos sem estimulação precoce = potencial de desenvolvimento não aproveitado. Surdez congênita: sem triagem neonatal universal = detecção na escola, não no nascimento"},
        {"indicador": "Acessibilidade nas UBS",              "valor": 25.0,  "meta": 100.0, "unidade": "%",       "status": "critico", "observacao": "6/8 UBS sem rampa de acesso, sem banheiro adaptado, sem piso tátil. UBS ribeirinha: acesso de barco = cadeira de rodas inacessível à embarcação. PcD que não consegue chegar à UBS usa emergência hospitalar como único ponto de acesso"},
        {"indicador": "Emissão de laudo médico PcD",         "valor": 84,    "meta": 30,    "unidade": "dias",    "status": "critico", "observacao": "84 dias para laudo vs meta de 30 dias. Médico clínico sem capacitação na Classificação Internacional de Funcionalidade (CIF). 28,4% de laudos rejeitados pelo INSS: família espera mais 60-90 dias para reemissão. Cada mês sem BPC: família sem renda mínima"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/deficiencias")
def deficiencias():
    return _DEFICIENCIAS()


@router.get("/beneficios")
def beneficios():
    return _BENEFICIOS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()