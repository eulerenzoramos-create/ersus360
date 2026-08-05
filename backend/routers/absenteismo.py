"""
Absenteísmo e Gestão de Frequência — FMS Apuí/AM
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/absenteismo", tags=["Absenteísmo"])

@lru_cache(maxsize=1)
def _SERVIDORES():
    return [
        # nome, cargo, unidade, dias_trabalhaveis, dias_faltados, motivos (dict)
        {"id":1,  "nome":"A.B.S.",  "cargo":"Médico Clínico",         "unidade":"UBS Cachoeira",    "dt":22, "df":2, "motivos":{"medico":2,"injust":0,"licenca":0}},
        {"id":2,  "nome":"C.D.F.",  "cargo":"Enfermeira",             "unidade":"ESF Liberdade",    "dt":22, "df":0, "motivos":{"medico":0,"injust":0,"licenca":0}},
        {"id":3,  "nome":"E.G.H.",  "cargo":"ACS",                    "unidade":"Microárea M1",     "dt":22, "df":1, "motivos":{"medico":1,"injust":0,"licenca":0}},
        {"id":4,  "nome":"I.J.K.",  "cargo":"Técnico Enfermagem",     "unidade":"UBS Kennedy",      "dt":22, "df":4, "motivos":{"medico":1,"injust":2,"licenca":1}},
        {"id":5,  "nome":"L.M.N.",  "cargo":"Dentista",               "unidade":"ESB JK",           "dt":22, "df":1, "motivos":{"medico":1,"injust":0,"licenca":0}},
        {"id":6,  "nome":"O.P.Q.",  "cargo":"Médico",                 "unidade":"ESF Kennedy",      "dt":22, "df":0, "motivos":{"medico":0,"injust":0,"licenca":0}},
        {"id":7,  "nome":"R.S.T.",  "cargo":"ACS",                    "unidade":"Microárea M3",     "dt":22, "df":3, "motivos":{"medico":0,"injust":3,"licenca":0}},
        {"id":8,  "nome":"U.V.W.",  "cargo":"Farmacêutico",           "unidade":"Farmácia Central", "dt":22, "df":0, "motivos":{"medico":0,"injust":0,"licenca":0}},
        {"id":9,  "nome":"X.Y.Z.",  "cargo":"Técnico Enfermagem",     "unidade":"UBS Acari",        "dt":22, "df":5, "motivos":{"medico":2,"injust":0,"licenca":3}},
        {"id":10, "nome":"A.A.B.",  "cargo":"Enfermeira",             "unidade":"ESF Três Estados", "dt":22, "df":2, "motivos":{"medico":2,"injust":0,"licenca":0}},
        {"id":11, "nome":"B.C.D.",  "cargo":"Médico",                 "unidade":"ESF Juma",         "dt":22, "df":0, "motivos":{"medico":0,"injust":0,"licenca":0}},
        {"id":12, "nome":"E.F.G.",  "cargo":"ACS",                    "unidade":"Microárea M5",     "dt":22, "df":1, "motivos":{"medico":1,"injust":0,"licenca":0}},
        {"id":13, "nome":"H.I.J.",  "cargo":"Auxiliar Administrativo","unidade":"Sede FMS",         "dt":22, "df":6, "motivos":{"medico":1,"injust":4,"licenca":1}},
        {"id":14, "nome":"K.L.M.",  "cargo":"Motorista",              "unidade":"Transporte",       "dt":22, "df":1, "motivos":{"medico":1,"injust":0,"licenca":0}},
        {"id":15, "nome":"N.O.P.",  "cargo":"Técnico Enfermagem",     "unidade":"ESF São Sebastião","dt":22, "df":2, "motivos":{"medico":1,"injust":1,"licenca":0}},
        {"id":16, "nome":"Q.R.S.",  "cargo":"Enfermeiro",             "unidade":"ESF Estrada Nova", "dt":22, "df":7, "motivos":{"medico":2,"injust":3,"licenca":2}},
        {"id":17, "nome":"T.U.V.",  "cargo":"ACS",                    "unidade":"Microárea M8",     "dt":22, "df":0, "motivos":{"medico":0,"injust":0,"licenca":0}},
        {"id":18, "nome":"W.X.Y.",  "cargo":"Médico",                 "unidade":"ESF Liberdade",    "dt":22, "df":0, "motivos":{"medico":0,"injust":0,"licenca":0}},
        {"id":19, "nome":"Z.A.B.",  "cargo":"Técnico Enfermagem",     "unidade":"UBS Três Estados", "dt":22, "df":3, "motivos":{"medico":2,"injust":1,"licenca":0}},
        {"id":20, "nome":"C.D.E.",  "cargo":"Dentista",               "unidade":"ESB Cachoeira",    "dt":22, "df":0, "motivos":{"medico":0,"injust":0,"licenca":0}},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes":"Nov/25","pct":5.8,"dias":112},
        {"mes":"Dez/25","pct":7.1,"dias":138},
        {"mes":"Jan/26","pct":5.2,"dias":101},
        {"mes":"Fev/26","pct":6.9,"dias":134},
        {"mes":"Mar/26","pct":7.4,"dias":144},
        {"mes":"Abr/26","pct":6.2,"dias":120},
    ]


def _taxa(s: dict) -> float:
    return round(s["df"] / s["dt"] * 100, 1) if s["dt"] else 0.0

@router.get("/dashboard")
async def dashboard():
    total_dt  = sum(s["dt"] for s in _SERVIDORES())
    total_df  = sum(s["df"] for s in _SERVIDORES())
    taxa_geral = round(total_df / total_dt * 100, 1)
    criticos  = [s for s in _SERVIDORES() if _taxa(s) >= 10]

    por_cargo: dict = {}
    for s in _SERVIDORES():
        if s["cargo"] not in por_cargo:
            por_cargo[s["cargo"]] = {"dt":0, "df":0, "n":0}
        por_cargo[s["cargo"]]["dt"] += s["dt"]
        por_cargo[s["cargo"]]["df"] += s["df"]
        por_cargo[s["cargo"]]["n"]  += 1

    por_cargo_list = [
        {"cargo": k, "taxa": round(v["df"]/v["dt"]*100, 1), "servidores": v["n"], "dias_faltados": v["df"]}
        for k, v in sorted(por_cargo.items(), key=lambda x: -(x[1]["df"]/x[1]["dt"]))
    ]

    return {
        "competencia":      "Abr/2026",
        "total_servidores": len(_SERVIDORES()),
        "total_dias_trab":  total_dt,
        "total_dias_falta": total_df,
        "taxa_geral":       taxa_geral,
        "meta_taxa":        8.0,
        "conforme":         taxa_geral <= 8.0,
        "n_criticos":       len(criticos),
        "motivos": {
            "medico":  sum(s["motivos"]["medico"] for s in _SERVIDORES()),
            "injust":  sum(s["motivos"]["injust"] for s in _SERVIDORES()),
            "licenca": sum(s["motivos"]["licenca"] for s in _SERVIDORES()),
        },
        "por_cargo": por_cargo_list,
        "historico": _HISTORICO,
    }

@router.get("/servidores")
async def servidores():
    return [
        {**s, "taxa": _taxa(s), "status": "critico" if _taxa(s) >= 10 else "atencao" if _taxa(s) >= 5 else "ok"}
        for s in sorted(_SERVIDORES, key=lambda x: -_taxa(x))
    ]
