from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-bucal-municipal", tags=["saude_bucal_municipal"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "esb_total": 6,
        "esb_funcionando": 5,
        "ceo_disponivel": False,
        "procedimentos_basicos_mes": 1842,
        "exodontias_mes": 184,
        "exodontias_pct_total": 10.0,
        "meta_exodontias_pct": 7.0,
        "fluoretacao_agua": True,
        "cpod_12anos": 3.8,
        "meta_cpod_oms": 2.0,
        "primeira_consulta_pct": 64.2,
        "meta_primeira_consulta_pct": 75.0,
        "urgencias_mes": 284,
        "status_geral": "atencao",
    }


@lru_cache(maxsize=1)
def _ESB():
    return [
        {"esb": "ESB 01 — UBSF Sede I",    "dentistas": 1, "auxiliares": 1, "proc_mes": 412, "exod_pct": 9.2,  "status": "ok",      "obs": None},
        {"esb": "ESB 02 — UBSF Sede II",   "dentistas": 1, "auxiliares": 1, "proc_mes": 384, "exod_pct": 10.4, "status": "ok",      "obs": None},
        {"esb": "ESB 03 — UBSF Juma",      "dentistas": 1, "auxiliares": 0, "proc_mes": 284, "exod_pct": 11.8, "status": "atencao", "obs": "Sem auxiliar de saúde bucal — capacidade reduzida"},
        {"esb": "ESB 04 — UBSF Mapari",    "dentistas": 1, "auxiliares": 1, "proc_mes": 312, "exod_pct": 10.6, "status": "ok",      "obs": None},
        {"esb": "ESB 05 — UBSF Igapó-Açu","dentistas": 1, "auxiliares": 1, "proc_mes": 280, "exod_pct": 9.8,  "status": "ok",      "obs": None},
        {"esb": "ESB 06 — PA Aripuanã",    "dentistas": 0, "auxiliares": 0, "proc_mes": 0,   "exod_pct": 0,    "status": "critico", "obs": "Vaga de dentista sem preenchimento há 4 meses"},
    ]


@lru_cache(maxsize=1)
def _PROCEDIMENTOS():
    return [
        {"procedimento": "Restauração",                        "quantidade": 684, "pct": 37.1},
        {"procedimento": "Exodontia",                          "quantidade": 184, "pct": 10.0},
        {"procedimento": "Profilaxia/Orientação",              "quantidade": 412, "pct": 22.4},
        {"procedimento": "Tratamento periodontal",             "quantidade": 184, "pct": 10.0},
        {"procedimento": "Urgência/Alívio de dor",             "quantidade": 284, "pct": 15.4},
        {"procedimento": "Endodontia (canal)",                 "quantidade": 48,  "pct": 2.6},
        {"procedimento": "Fluoretação tópica",                 "quantidade": 46,  "pct": 2.5},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "proc_basicos": 1682, "exodontias": 168, "urgencias": 264, "primeira_consulta": 128},
        {"mes": "Fev/25", "proc_basicos": 1724, "exodontias": 172, "urgencias": 272, "primeira_consulta": 132},
        {"mes": "Mar/25", "proc_basicos": 1748, "exodontias": 176, "urgencias": 280, "primeira_consulta": 136},
        {"mes": "Abr/25", "proc_basicos": 1784, "exodontias": 178, "urgencias": 276, "primeira_consulta": 140},
        {"mes": "Mai/25", "proc_basicos": 1812, "exodontias": 182, "urgencias": 282, "primeira_consulta": 144},
        {"mes": "Jun/25", "proc_basicos": 1842, "exodontias": 184, "urgencias": 284, "primeira_consulta": 148},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "CPO-D (12 anos)",                 "valor": 3.8,  "meta": 2.0,  "unidade": "dentes",  "status": "critico", "observacao": "CPO-D acima da meta OMS de 2,0 — alta prevalência de cárie não tratada"},
        {"indicador": "1ª Consulta Odontológica Prog.",  "valor": 64.2, "meta": 75.0, "unidade": "%",       "status": "atencao", "observacao": "35,8% sem consulta programática — falta de acesso em zona rural"},
        {"indicador": "Exodontias / total procedimentos","valor": 10.0, "meta": 7.0,  "unidade": "%",       "status": "atencao", "observacao": "Taxa de exodontia acima da meta — indica demanda represada e diagnóstico tardio"},
        {"indicador": "CEO disponível",                  "valor": 0,    "meta": 1,    "unidade": "unidade", "status": "critico", "observacao": "Apuí não possui CEO — pacientes com necessidade especializada referenciados a Humaitá/Manaus"},
        {"indicador": "Fluoretação da água",             "valor": 1,    "meta": 1,    "unidade": "sistema", "status": "ok",      "observacao": "Sistema de fluoretação ativo em toda a rede de abastecimento urbana"},
        {"indicador": "ESB com vaga de dentista vaga",   "valor": 1,    "meta": 0,    "unidade": "ESB",     "status": "critico", "observacao": "ESB 06 (PA Aripuanã) sem dentista há 4 meses — comunidade rural sem acesso"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/esb")
def esb():
    return _ESB()


@router.get("/procedimentos")
def procedimentos():
    return _PROCEDIMENTOS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()