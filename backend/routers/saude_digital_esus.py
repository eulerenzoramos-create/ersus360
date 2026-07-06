from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-digital-esus", tags=["saude_digital_esus"])

_SISTEMAS = [
    {"sistema": "e-SUS APS (PEC)", "versao": "5.2.34", "unidades_ativas": 8, "unidades_total": 8,
     "sincronizacao_ok_pct": 97.4, "producao_mes": 4284, "ultima_sync": "2026-07-04 23:51",
     "status": "ok"},
    {"sistema": "SISAB (transmissão)", "versao": "—", "transmissao_semana_pct": 91.7,
     "fichas_pendentes": 312, "ultimo_envio": "2026-07-04", "sincronizacao_ok_pct": 91.7,
     "producao_mes": None, "unidades_ativas": 8, "unidades_total": 8, "status": "atencao"},
    {"sistema": "RNDS (Rede Nacional Dados em Saúde)", "versao": "2.4", "unidades_ativas": 2,
     "unidades_total": 8, "sincronizacao_ok_pct": 25.0, "producao_mes": 142,
     "ultima_sync": "2026-06-28 14:22", "status": "critico"},
    {"sistema": "ConecteSUS (cidadão)", "versao": "—", "unidades_ativas": 8, "unidades_total": 8,
     "sincronizacao_ok_pct": 100.0, "producao_mes": None, "ultima_sync": "2026-07-05 00:12",
     "status": "ok"},
    {"sistema": "SIGTAP (procedimentos)", "versao": "—", "unidades_ativas": 8, "unidades_total": 8,
     "sincronizacao_ok_pct": 100.0, "producao_mes": None, "ultima_sync": "2026-07-01",
     "status": "ok"},
    {"sistema": "GAL (laboratório)", "versao": "3.1", "unidades_ativas": 1, "unidades_total": 1,
     "sincronizacao_ok_pct": 84.6, "producao_mes": 684, "ultima_sync": "2026-07-03 16:40",
     "status": "atencao"},
]

_PRONTUARIO_DIGITAL = {
    "pacientes_com_pec": 12480,
    "pacientes_cadastrados_total": 18924,
    "cobertura_pec_pct": 65.9,
    "atendimentos_digitais_mes": 4284,
    "atendimentos_papel_mes": 318,
    "prescricoes_eletronicas_pct": 86.4,
    "profissionais_ativos_pec": 42,
    "profissionais_total": 48,
    "adesao_pec_pct": 87.5,
}

_CONECTIVIDADE = [
    {"unidade": "UBS Central", "tipo_conexao": "Fibra óptica", "velocidade_mbps": 100,
     "uptime_pct": 99.2, "backup_4g": True, "status": "ok"},
    {"unidade": "UBSF Juma", "tipo_conexao": "4G rural", "velocidade_mbps": 8,
     "uptime_pct": 71.4, "backup_4g": False, "status": "critico"},
    {"unidade": "UBSF Mapari", "tipo_conexao": "4G rural", "velocidade_mbps": 6,
     "uptime_pct": 68.2, "backup_4g": False, "status": "critico"},
    {"unidade": "UBSF Igapó-Açu", "tipo_conexao": "Satélite VSAT", "velocidade_mbps": 4,
     "uptime_pct": 82.6, "backup_4g": False, "status": "atencao"},
    {"unidade": "PSF Bairro Novo", "tipo_conexao": "Rádio ponto-a-ponto", "velocidade_mbps": 20,
     "uptime_pct": 94.8, "backup_4g": True, "status": "ok"},
    {"unidade": "UPA 24h", "tipo_conexao": "Fibra óptica", "velocidade_mbps": 100,
     "uptime_pct": 99.8, "backup_4g": True, "status": "ok"},
    {"unidade": "Hospital Municipal", "tipo_conexao": "Fibra óptica", "velocidade_mbps": 200,
     "uptime_pct": 99.9, "backup_4g": True, "status": "ok"},
    {"unidade": "CAPS AD", "tipo_conexao": "Cable/ADSL", "velocidade_mbps": 25,
     "uptime_pct": 88.4, "backup_4g": False, "status": "atencao"},
]

_HISTORICO = [
    {"mes": "Jan", "atendimentos_digitais": 3842, "fichas_sinan_transmitidas_pct": 88.2, "uptime_medio_pct": 87.4},
    {"mes": "Fev", "atendimentos_digitais": 3614, "fichas_sinan_transmitidas_pct": 89.6, "uptime_medio_pct": 88.1},
    {"mes": "Mar", "atendimentos_digitais": 4012, "fichas_sinan_transmitidas_pct": 90.4, "uptime_medio_pct": 86.9},
    {"mes": "Abr", "atendimentos_digitais": 3924, "fichas_sinan_transmitidas_pct": 91.2, "uptime_medio_pct": 89.2},
    {"mes": "Mai", "atendimentos_digitais": 4148, "fichas_sinan_transmitidas_pct": 90.8, "uptime_medio_pct": 88.7},
    {"mes": "Jun", "atendimentos_digitais": 4284, "fichas_sinan_transmitidas_pct": 91.7, "uptime_medio_pct": 90.1},
]

_INDICADORES = [
    {"indicador": "Adesão ao PEC / prontuário digital", "valor": 87.5, "meta": 100.0, "unidade": "%",
     "status": "atencao", "observacao": "6 profissionais ainda com atendimentos em papel — 2 UBS rurais sem conectividade adequada"},
    {"indicador": "Cobertura cadastral no PEC", "valor": 65.9, "meta": 90.0, "unidade": "%",
     "status": "critico", "observacao": "34% dos pacientes sem prontuário digital — população ribeirinha sem cobertura"},
    {"indicador": "RNDS — unidades integradas", "valor": 25.0, "meta": 100.0, "unidade": "%",
     "status": "critico", "observacao": "Apenas 2 de 8 unidades enviando dados à RNDS — requisito do e-SUS estratégico"},
    {"indicador": "Transmissão SISAB semanal", "valor": 91.7, "meta": 97.0, "unidade": "%",
     "status": "atencao", "observacao": "312 fichas pendentes — UBS Juma e Mapari com conectividade instável"},
    {"indicador": "Uptime médio das unidades", "valor": 90.1, "meta": 99.0, "unidade": "%",
     "status": "critico", "observacao": "UBSF Juma (71%) e Mapari (68%) com conectividade crítica — impacto no PEC"},
    {"indicador": "Prescrição eletrônica", "valor": 86.4, "meta": 100.0, "unidade": "%",
     "status": "atencao", "observacao": "13,6% das prescrições ainda em papel — riscos de segurança do paciente"},
]


@router.get("/dashboard")
def dashboard():
    return {
        "sistemas_monitorados": 6,
        "sistemas_ok": 3,
        "sistemas_criticos": 2,
        "atendimentos_digitais_mes": 4284,
        "atendimentos_papel_mes": 318,
        "adesao_pec_pct": 87.5,
        "cobertura_prontuario_pct": 65.9,
        "fichas_pendentes_sisab": 312,
        "unidades_rnds_integradas": 2,
        "uptime_medio_pct": 90.1,
    }


@router.get("/sistemas")
def sistemas():
    return _SISTEMAS


@router.get("/prontuario-digital")
def prontuario_digital():
    return _PRONTUARIO_DIGITAL


@router.get("/conectividade")
def conectividade():
    return _CONECTIVIDADE


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
