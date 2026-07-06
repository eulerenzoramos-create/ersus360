from fastapi import APIRouter

router = APIRouter(prefix="/api/seguranca-paciente", tags=["seguranca_paciente"])

_DASHBOARD = {
    "comite_implantado": True,
    "comite_implantacao_ano": 2025,
    "nsp_implantado_pct": 42.0,
    "unidades_com_nsp": 3,
    "unidades_total": 7,
    "eventos_adversos_notificados_ano": 84,
    "eventos_graves_ano": 12,
    "near_miss_notificados_ano": 28,
    "infeccao_hospitalar_taxa_pct": 4.8,
    "meta_infeccao_pct": 3.0,
    "quedas_paciente_hospitalar_ano": 18,
    "erros_medicacao_notificados_ano": 22,
    "cirurgia_segura_checklist_pct": 68.4,
    "meta_checklist_pct": 100.0,
    "cultura_seguranca_score": 52.4,
    "meta_cultura_score": 75.0,
    "status_nsp": "atencao",
    "status_infeccao": "atencao",
}

_EVENTOS_ADVERSOS = [
    {"categoria": "Infecção relacionada à assistência (IRAS)", "total_ano": 24, "graves": 4,  "obitos": 0, "notificacao_pct": 62.4, "status": "atencao"},
    {"categoria": "Erros de medicação",                        "total_ano": 22, "graves": 3,  "obitos": 0, "notificacao_pct": 48.4, "status": "atencao"},
    {"categoria": "Quedas de paciente",                        "total_ano": 18, "graves": 2,  "obitos": 0, "notificacao_pct": 72.4, "status": "atencao"},
    {"categoria": "Falha de identificação do paciente",        "total_ano": 8,  "graves": 1,  "obitos": 0, "notificacao_pct": 38.4, "status": "atencao"},
    {"categoria": "Complicação cirúrgica não planejada",       "total_ano": 6,  "graves": 2,  "obitos": 1, "notificacao_pct": 84.2, "status": "critico"},
    {"categoria": "Falha de equipamento / dispositivo",        "total_ano": 4,  "graves": 0,  "obitos": 0, "notificacao_pct": 42.4, "status": "ok"},
    {"categoria": "Reação a transfusão",                       "total_ano": 2,  "graves": 0,  "obitos": 0, "notificacao_pct": 100.0,"status": "ok"},
]

_PROTOCOLOS = [
    {"protocolo": "Higiene das Mãos",                 "implantado": True,  "adesao_pct": 72.4, "meta_pct": 95.0, "status": "atencao"},
    {"protocolo": "Cirurgia Segura (Checklist OMS)",  "implantado": True,  "adesao_pct": 68.4, "meta_pct": 100.0,"status": "atencao"},
    {"protocolo": "Identificação do Paciente",        "implantado": True,  "adesao_pct": 62.4, "meta_pct": 100.0,"status": "atencao"},
    {"protocolo": "Prevenção de Quedas",               "implantado": True,  "adesao_pct": 58.4, "meta_pct": 90.0, "status": "atencao"},
    {"protocolo": "Segurança na Prescrição e Admin.", "implantado": True,  "adesao_pct": 54.2, "meta_pct": 100.0,"status": "atencao"},
    {"protocolo": "Úlcera por Pressão (prevenção)",   "implantado": False, "adesao_pct": 0.0,  "meta_pct": 90.0, "status": "critico"},
    {"protocolo": "Transferência segura (handoff)",   "implantado": False, "adesao_pct": 0.0,  "meta_pct": 90.0, "status": "critico"},
]

_HISTORICO = [
    {"mes": "Jan/25", "eventos": 12, "graves": 2, "near_miss": 3, "infec_hosp": 4.2, "checklist": 62.4},
    {"mes": "Fev/25", "eventos": 13, "graves": 2, "near_miss": 4, "infec_hosp": 4.4, "checklist": 64.2},
    {"mes": "Mar/25", "eventos": 14, "graves": 2, "near_miss": 4, "infec_hosp": 4.6, "checklist": 66.4},
    {"mes": "Abr/25", "eventos": 14, "graves": 2, "near_miss": 5, "infec_hosp": 4.8, "checklist": 68.2},
    {"mes": "Mai/25", "eventos": 15, "graves": 3, "near_miss": 6, "infec_hosp": 4.8, "checklist": 68.4},
    {"mes": "Jun/25", "eventos": 16, "graves": 1, "near_miss": 6, "infec_hosp": 4.8, "checklist": 68.4},
]

_INDICADORES = [
    {"indicador": "NSP implantados nas unidades",          "valor": 42.0, "meta": 100.0, "unidade": "%",      "status": "atencao", "observacao": "3/7 unidades com Núcleo de Segurança — hospital e 2 UBS. UPA, CAPS, ESF rurais sem NSP ativo"},
    {"indicador": "Taxa de infecção hospitalar",           "valor": 4.8,  "meta": 3.0,   "unidade": "%",      "status": "atencao", "observacao": "4,8% vs meta 3% — leitos de isolamento 100% ocupados ampliam risco de disseminação"},
    {"indicador": "Adesão ao Checklist Cirurgia Segura",   "valor": 68.4, "meta": 100.0, "unidade": "%",      "status": "atencao", "observacao": "31,6% das cirurgias sem checklist completo — principal lacuna: briefing pré-incisão"},
    {"indicador": "Cultura de segurança (score)",          "valor": 52.4, "meta": 75.0,  "unidade": "pontos", "status": "atencao", "observacao": "Score abaixo de 60 indica cultura punitiva — profissionais temem notificar erros"},
    {"indicador": "Eventos graves / ano",                  "valor": 12,   "meta": None,  "unidade": "eventos","status": "atencao", "observacao": "12 eventos adversos graves notificados — subnotificação estimada em 40–60%"},
    {"indicador": "Protocolos críticos não implantados",   "valor": 2,    "meta": 0,     "unidade": "protoc.","status": "critico", "observacao": "Úlcera por pressão e transferência segura (handoff) sem protocolo — pacientes em risco"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/eventos-adversos")
def eventos_adversos():
    return _EVENTOS_ADVERSOS


@router.get("/protocolos")
def protocolos():
    return _PROTOCOLOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
