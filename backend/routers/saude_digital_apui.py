from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-digital-apui", tags=["saude_digital_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "ubs_total": 8,
        "ubs_com_esus_pec": 5,
        "ubs_esus_pec_pct": 62.5,
        "ubs_com_internet": 3,
        "ubs_internet_pct": 37.5,
        "ubs_internet_banda_larga": 2,
        "ubs_internet_3g_4g": 1,
        "prontuario_eletronico_pct": 37.5,
        "prontuario_papel_pct": 62.5,
        "atendimentos_digitais_mes": 1248,
        "atendimentos_com_cns_identificado_pct": 72.4,
        "meta_cns_pct": 95.0,
        "rnds_integracao_ativa": False,
        "rnds_prevista": "2026-Q2",
        "telessaude_consultas_mes": 28,
        "meta_telessaude_mes": 120,
        "telediagnostico_eletrocardiograma": True,
        "telediagnostico_teleradiologia": False,
        "sistemas_municipais": ["e-SUS PEC", "SIGTAP", "HÓRUS", "SINAN-NET", "SISREG"],
        "sistemas_sem_integracao": ["HÓRUS", "SISREG"],
        "profissionais_treinados_esus_pct": 48.4,
        "meta_treinados_pct": 100.0,
        "suporte_tecnico_local": False,
        "suporte_referencia": "DATASUS / CONASS Manaus",
        "status_conectividade": "critico",
        "status_prontuario": "critico",
        "status_telessaude": "atencao",
    }


@lru_cache(maxsize=1)
def _SISTEMAS():
    return [
        {"sistema": "e-SUS PEC",         "versao": "5.2",  "ubs_implantadas": 5, "ubs_total": 8, "status": "atencao",  "descricao": "5/8 UBS com PEC implantado — 3 UBS rurais sem conectividade usam fichas CDS (papel). Sincronização off-line disponível mas depende de técnico para upload. Inconsistências de duplicidade de cadastro: 12,4% dos cadastros com CNS duplicado"},
        {"sistema": "SINAN-NET",          "versao": "5.0",  "ubs_implantadas": 1, "ubs_total": 8, "status": "critico",  "descricao": "Apenas a Secretaria Municipal tem SINAN-NET. UBS notificam por ficha em papel → digitação centralizada com atraso médio de 8 dias. Surto em área ribeirinha: 12-15 dias para entrar no sistema após detecção"},
        {"sistema": "HÓRUS (farmácia)",   "versao": "4.0",  "ubs_implantadas": 3, "ubs_total": 8, "status": "critico",  "descricao": "Dispensação sem HÓRUS em 5/8 UBS — controle de estoque em planilha Excel ou caderno. Desabastecimento detectado após ruptura (não antes). Integração com BNAFAR e RENAME inexistente em 5 UBS"},
        {"sistema": "SISREG",             "versao": "3.0",  "ubs_implantadas": 1, "ubs_total": 1, "status": "atencao",  "descricao": "SISREG exclusivo na Central de Regulação municipal. Médico de UBS sem acesso para verificar posição de fila do paciente — ligação telefônica para central. Especialidades com fila > 90 dias sem alerta automático"},
        {"sistema": "SIGTAP / TABWIN",    "versao": "atual","ubs_implantadas": 1, "ubs_total": 1, "status": "atencao",  "descricao": "Apenas FMS acessa SIGTAP. Faturamento APAC e BPA com erro de codificação em 18,4% dos procedimentos — perda de receita estimada R$ 84.000/ano por subcodificação"},
        {"sistema": "RNDS",               "versao": "N/A",  "ubs_implantadas": 0, "ubs_total": 8, "status": "critico",  "descricao": "Rede Nacional de Dados em Saúde sem integração em Apuí. Paciente atendido no HMM + UBS + Manaus = 3 prontuários desconexos. Duplicidade de exames, interações medicamentosas não detectadas. Prazo RNDS: 2026-Q2"},
    ]


@lru_cache(maxsize=1)
def _CONECTIVIDADE():
    return [
        {"ubs": "UBS Central (sede)",        "internet": True,  "tipo": "Fibra 100Mbps", "esus_pec": True,  "ultima_sinc": "diária",   "status": "ok"},
        {"ubs": "UBS Bairro Industrial",     "internet": True,  "tipo": "Cable 10Mbps",  "esus_pec": True,  "ultima_sinc": "diária",   "status": "ok"},
        {"ubs": "UBS Ramal do Açaí",         "internet": True,  "tipo": "4G (instável)", "esus_pec": True,  "ultima_sinc": "semanal",  "status": "atencao"},
        {"ubs": "UBS Km 130 (ramal)",        "internet": False, "tipo": "Sem internet",  "esus_pec": False, "ultima_sinc": "mensal",   "status": "critico"},
        {"ubs": "UBS Rio Juma (ribeirinha)", "internet": False, "tipo": "Sem internet",  "esus_pec": False, "ultima_sinc": "bimestral","status": "critico"},
        {"ubs": "UBS São Luís (ribeirinha)", "internet": False, "tipo": "Sem internet",  "esus_pec": False, "ultima_sinc": "bimestral","status": "critico"},
        {"ubs": "UBS Ramal Santa Rosa",      "internet": False, "tipo": "Sem internet",  "esus_pec": False, "ultima_sinc": "mensal",   "status": "critico"},
        {"ubs": "HMM (pronto-socorro)",      "internet": True,  "tipo": "Fibra 50Mbps",  "esus_pec": True,  "ultima_sinc": "diária",   "status": "ok"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "ubs_esus_pct": 25.0, "prontuario_digital_pct": 25.0, "atend_cns_pct": 58.4, "telessaude_mes": 8},
        {"ano": "2023", "ubs_esus_pct": 37.5, "prontuario_digital_pct": 37.5, "atend_cns_pct": 62.4, "telessaude_mes": 14},
        {"ano": "2024", "ubs_esus_pct": 50.0, "prontuario_digital_pct": 50.0, "atend_cns_pct": 68.4, "telessaude_mes": 22},
        {"ano": "2025", "ubs_esus_pct": 62.5, "prontuario_digital_pct": 37.5, "atend_cns_pct": 72.4, "telessaude_mes": 28},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "UBS com e-SUS PEC implantado",         "valor": 62.5,  "meta": 100.0, "unidade": "%",      "status": "atencao", "observacao": "3/8 UBS sem PEC — áreas rurais e ribeirinhas sem conectividade. UBS sem PEC: produção registrada em ficha CDS com atraso médio de 8 dias. Indicadores Novo Financiamento APS calculados com defasagem: gestora toma decisão com dado de semanas atrás"},
        {"indicador": "UBS com internet (qualquer tipo)",     "valor": 37.5,  "meta": 100.0, "unidade": "%",      "status": "critico", "observacao": "5/8 UBS sem internet alguma. Conectividade em áreas remotas requer satélite (Starlink ~R$ 500/mês/ponto) ou expansão de fibra (inviável a curto prazo). Telemedicina, teleconsulta e RNDS dependem de conectividade — atualmente inacessíveis em 62,5% das UBS"},
        {"indicador": "Atendimentos com CNS identificado",    "valor": 72.4,  "meta": 95.0,  "unidade": "%",      "status": "atencao", "observacao": "27,6% dos atendimentos sem CNS — pagamento federal depende de CNS válido em procedimentos APAC e BPA. Perda de receita estimada R$ 84k/ano. Cadastro desatualizado: 12,4% de duplicidades, 18% sem e-mail ou telefone válido"},
        {"indicador": "Telessaúde — consultas/mês",           "valor": 28,    "meta": 120,   "unidade": "consul.",  "status": "critico", "observacao": "23% da meta de teleconsultas. Telediagnóstico disponível apenas para ECG — teleradiologia, teledermatologia e telepediatria inexistentes. Sem telessaúde, paciente com dúvida diagnóstica = transfer para Humaitá (284 km) ou Manaus (784 km)"},
        {"indicador": "RNDS — integração ativa",              "valor": 0,     "meta": 1,     "unidade": "sistema", "status": "critico", "observacao": "Rede Nacional de Dados em Saúde sem implantação. Paciente com 3 prontuários desconexos (UBS + HMM + referência). Polimedicação não rastreada, exames duplicados, histórico de alergias não compartilhado. Previsão de implantação: 2026-Q2"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/sistemas")
def sistemas():
    return _SISTEMAS


@router.get("/conectividade")
def conectividade():
    return _CONECTIVIDADE


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
