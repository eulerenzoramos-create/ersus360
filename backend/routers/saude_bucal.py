from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-bucal", tags=["saude_bucal"])

_EQUIPES = [
    {"esf": "ESF Novo Aripuanã",    "cirurgiao_dentista": True,  "asb": True,  "tsb": False,
     "primeira_consulta_mes": 48, "procedimentos_basicos_mes": 312, "meta_proc_basicos": 340,
     "extracao_mes": 28, "restauracao_mes": 84, "status": "atencao"},
    {"esf": "ESF São Lazaro",        "cirurgiao_dentista": True,  "asb": True,  "tsb": True,
     "primeira_consulta_mes": 52, "procedimentos_basicos_mes": 388, "meta_proc_basicos": 340,
     "extracao_mes": 22, "restauracao_mes": 102, "status": "ok"},
    {"esf": "ESF Juma (ribeirinha)", "cirurgiao_dentista": False, "asb": False, "tsb": False,
     "primeira_consulta_mes": 0,  "procedimentos_basicos_mes": 0,   "meta_proc_basicos": 340,
     "extracao_mes": 0,  "restauracao_mes": 0,   "status": "critico"},
    {"esf": "ESF Acari",             "cirurgiao_dentista": True,  "asb": True,  "tsb": False,
     "primeira_consulta_mes": 44, "procedimentos_basicos_mes": 298, "meta_proc_basicos": 340,
     "extracao_mes": 31, "restauracao_mes": 71,  "status": "atencao"},
    {"esf": "ESF Centro",            "cirurgiao_dentista": True,  "asb": True,  "tsb": True,
     "primeira_consulta_mes": 61, "procedimentos_basicos_mes": 421, "meta_proc_basicos": 340,
     "extracao_mes": 18, "restauracao_mes": 118, "status": "ok"},
    {"esf": "ESF Mapari",            "cirurgiao_dentista": False, "asb": True,  "tsb": False,
     "primeira_consulta_mes": 12, "procedimentos_basicos_mes": 68,  "meta_proc_basicos": 340,
     "extracao_mes": 8,  "restauracao_mes": 14,  "status": "critico"},
]

_CEO_ESPECIALIDADES = [
    {"especialidade": "Diagnóstico Bucal / Estomatologia", "procedimentos_mes": 42, "lista_espera": 18,
     "tempo_espera_dias": 24, "meta_proc_mes": 40, "status": "ok"},
    {"especialidade": "Periodontia", "procedimentos_mes": 68, "lista_espera": 64,
     "tempo_espera_dias": 38, "meta_proc_mes": 80, "status": "atencao"},
    {"especialidade": "Endodontia (Tratamento de Canal)", "procedimentos_mes": 34, "lista_espera": 112,
     "tempo_espera_dias": 62, "meta_proc_mes": 60, "status": "critico"},
    {"especialidade": "Cirurgia Oral Menor", "procedimentos_mes": 28, "lista_espera": 84,
     "tempo_espera_dias": 48, "meta_proc_mes": 40, "status": "atencao"},
    {"especialidade": "Prótese Dentária (Laboratorial)", "procedimentos_mes": 14, "lista_espera": 204,
     "tempo_espera_dias": 98, "meta_proc_mes": 30, "status": "critico"},
]

_HISTORICO = [
    {"mes": "Jan", "primeiras_consultas": 186, "proc_basicos": 1024, "extracoes": 98, "restauracoes": 312, "ceo_proc": 168},
    {"mes": "Fev", "primeiras_consultas": 178, "proc_basicos":  968, "extracoes": 88, "restauracoes": 298, "ceo_proc": 156},
    {"mes": "Mar", "primeiras_consultas": 204, "proc_basicos": 1108, "extracoes": 112,"restauracoes": 348, "ceo_proc": 184},
    {"mes": "Abr", "primeiras_consultas": 198, "proc_basicos": 1082, "extracoes": 104,"restauracoes": 334, "ceo_proc": 178},
    {"mes": "Mai", "primeiras_consultas": 216, "proc_basicos": 1142, "extracoes": 118,"restauracoes": 362, "ceo_proc": 192},
    {"mes": "Jun", "primeiras_consultas": 217, "proc_basicos": 1087, "extracoes": 107,"restauracoes": 389, "ceo_proc": 186},
]

_INDICADORES = [
    {"indicador": "ESB sem cirurgião-dentista", "valor": 2, "meta": 0, "unidade": "equipes",
     "status": "critico", "observacao": "Juma e Mapari sem CD — 2 ESF sem cobertura odontológica"},
    {"indicador": "Razão extração/restauração", "valor": 0.28, "meta": 0.20, "unidade": "ratio",
     "status": "critico", "observacao": "Ainda acima da meta — extração mais frequente que restauração"},
    {"indicador": "Lista espera prótese CEO", "valor": 204, "meta": 0, "unidade": "pacientes",
     "status": "critico", "observacao": "98 dias de espera para prótese — maior fila do CEO"},
    {"indicador": "Cobertura 1ª consulta programática", "valor": 44.8, "meta": 50.0, "unidade": "%",
     "status": "atencao", "observacao": "Abaixo da meta — ESF sem CD prejudica cobertura"},
    {"indicador": "Procedimentos básicos/equipe/mês", "valor": 278.4, "meta": 340.0, "unidade": "proc",
     "status": "critico", "observacao": "Média descontando as 2 ESF sem CD — meta 340 proc/equipe/mês"},
    {"indicador": "CEO endodontia (espera)", "valor": 62, "meta": 30, "unidade": "dias",
     "status": "critico", "observacao": "112 pacientes aguardando tratamento de canal — 62 dias de espera"},
]


@router.get("/dashboard")
def dashboard():
    return {
        "esb_total": 6,
        "esb_sem_cd": 2,
        "primeiras_consultas_mes": 217,
        "proc_basicos_mes": 1087,
        "extracoes_mes": 107,
        "restauracoes_mes": 389,
        "ratio_extracao_restauracao": 0.28,
        "ceo_procedimentos_mes": 186,
        "ceo_lista_espera_total": 482,
        "ceo_especialidades": 5,
        "cobertura_primeira_consulta_pct": 44.8,
    }


@router.get("/equipes")
def equipes():
    return _EQUIPES


@router.get("/ceo-especialidades")
def ceo_especialidades():
    return _CEO_ESPECIALIDADES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
