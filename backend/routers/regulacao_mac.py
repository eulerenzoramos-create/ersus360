"""
Regulação MAC — SUS Regulação / CROSS-AM / Central de Regulação
(SISREG será descontinuado — migração para SUS Regulação em andamento)
FMS Apuí/AM · MAC execução 41% (crítico)
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/regulacao-mac", tags=["Regulação MAC"])

# ── Dados reais / referência Apuí/AM ─────────────────────────────────────────

_FILA_AMBULATORIAL = [
    {"id":1,  "especialidade":"Cardiologia",         "tipo":"Consulta especializada","fila":38, "tempo_medio_dias":82,  "autorizadas_mes":6,  "negadas_mes":1,  "urgentes":2,  "status_meta":"critico",    "referencia":"CRS Manaus"},
    {"id":2,  "especialidade":"Ortopedia",            "tipo":"Consulta especializada","fila":52, "tempo_medio_dias":95,  "autorizadas_mes":8,  "negadas_mes":2,  "urgentes":4,  "status_meta":"critico",    "referencia":"HPS Manaus"},
    {"id":3,  "especialidade":"Neurologia",           "tipo":"Consulta especializada","fila":29, "tempo_medio_dias":110, "autorizadas_mes":4,  "negadas_mes":1,  "urgentes":1,  "status_meta":"critico",    "referencia":"FHT Manaus"},
    {"id":4,  "especialidade":"Oftalmologia",         "tipo":"Consulta especializada","fila":61, "tempo_medio_dias":120, "autorizadas_mes":5,  "negadas_mes":0,  "urgentes":3,  "status_meta":"critico",    "referencia":"FHT Manaus"},
    {"id":5,  "especialidade":"Dermatologia",         "tipo":"Consulta especializada","fila":18, "tempo_medio_dias":75,  "autorizadas_mes":4,  "negadas_mes":0,  "urgentes":0,  "status_meta":"atencao",    "referencia":"CRS Manaus"},
    {"id":6,  "especialidade":"Ginecologia/Obstetrícia","tipo":"Consulta especializada","fila":14,"tempo_medio_dias":45, "autorizadas_mes":9,  "negadas_mes":0,  "urgentes":1,  "status_meta":"ok",         "referencia":"Maternidade Manaus"},
    {"id":7,  "especialidade":"Endocrinologia",       "tipo":"Consulta especializada","fila":22, "tempo_medio_dias":90,  "autorizadas_mes":3,  "negadas_mes":1,  "urgentes":0,  "status_meta":"critico",    "referencia":"CRS Manaus"},
    {"id":8,  "especialidade":"Urologia",             "tipo":"Consulta especializada","fila":16, "tempo_medio_dias":80,  "autorizadas_mes":4,  "negadas_mes":0,  "urgentes":1,  "status_meta":"atencao",    "referencia":"HUM Manaus"},
    {"id":9,  "especialidade":"Tomografia (TC)",      "tipo":"Exame diagnóstico",     "fila":45, "tempo_medio_dias":60,  "autorizadas_mes":10, "negadas_mes":2,  "urgentes":5,  "status_meta":"critico",    "referencia":"Clínica DAPI"},
    {"id":10, "especialidade":"Ressonância (RM)",     "tipo":"Exame diagnóstico",     "fila":31, "tempo_medio_dias":75,  "autorizadas_mes":6,  "negadas_mes":1,  "urgentes":3,  "status_meta":"critico",    "referencia":"Clínica DAPI"},
    {"id":11, "especialidade":"Colonoscopia",         "tipo":"Procedimento",          "fila":12, "tempo_medio_dias":55,  "autorizadas_mes":3,  "negadas_mes":0,  "urgentes":1,  "status_meta":"atencao",    "referencia":"HUM Manaus"},
    {"id":12, "especialidade":"Ecocardiograma",       "tipo":"Exame diagnóstico",     "fila":19, "tempo_medio_dias":50,  "autorizadas_mes":5,  "negadas_mes":0,  "urgentes":2,  "status_meta":"atencao",    "referencia":"Cardioclínica AM"},
    {"id":13, "especialidade":"Fisioterapia",         "tipo":"Terapia especializada", "fila":27, "tempo_medio_dias":40,  "autorizadas_mes":8,  "negadas_mes":0,  "urgentes":2,  "status_meta":"atencao",    "referencia":"CRER Manaus"},
    {"id":14, "especialidade":"Hemodiálise",          "tipo":"Procedimento cont.",    "fila":4,  "tempo_medio_dias":30,  "autorizadas_mes":4,  "negadas_mes":0,  "urgentes":4,  "status_meta":"ok",         "referencia":"CLINIRIM Manaus"},
    {"id":15, "especialidade":"Cirurgia Geral",       "tipo":"Procedimento cirúrgico","fila":23, "tempo_medio_dias":85,  "autorizadas_mes":4,  "negadas_mes":2,  "urgentes":2,  "status_meta":"critico",    "referencia":"HPS Manaus"},
]

_INTERNACOES = [
    {"id":1, "tipo":"Clínica Médica",       "leitos_ref":12, "ocupados":9,  "autorizadas_mes":8,  "dias_medio_perm":5.2, "valor_aih_mes":38_400.00},
    {"id":2, "tipo":"Cirurgia",             "leitos_ref":6,  "ocupados":4,  "autorizadas_mes":4,  "dias_medio_perm":4.8, "valor_aih_mes":22_800.00},
    {"id":3, "tipo":"Obstetrícia/Parto",    "leitos_ref":8,  "ocupados":5,  "autorizadas_mes":12, "dias_medio_perm":2.1, "valor_aih_mes":14_400.00},
    {"id":4, "tipo":"Pediatria",            "leitos_ref":4,  "ocupados":2,  "autorizadas_mes":5,  "dias_medio_perm":3.6, "valor_aih_mes":12_000.00},
    {"id":5, "tipo":"UTI Adulto",           "leitos_ref":4,  "ocupados":3,  "autorizadas_mes":3,  "dias_medio_perm":8.5, "valor_aih_mes":51_000.00},
]

_TFD_SOLICITACOES = [
    {"id":1,  "paciente":"M.A.S.",  "especialidade":"Oncologia",       "destino":"Manaus", "status":"autorizado",   "data":"2026-04-02", "urgencia":"urgente"},
    {"id":2,  "paciente":"J.F.O.",  "especialidade":"Cardiologia",     "destino":"Manaus", "status":"em_analise",   "data":"2026-04-05", "urgencia":"eletivo"},
    {"id":3,  "paciente":"R.C.P.",  "especialidade":"Neurologia",      "destino":"Manaus", "status":"autorizado",   "data":"2026-04-01", "urgencia":"urgente"},
    {"id":4,  "paciente":"L.T.M.",  "especialidade":"Oftalmologia",    "destino":"Manaus", "status":"autorizado",   "data":"2026-03-28", "urgencia":"eletivo"},
    {"id":5,  "paciente":"F.A.S.",  "especialidade":"Ortopedia",       "destino":"Manaus", "status":"pendente_doc", "data":"2026-04-08", "urgencia":"eletivo"},
    {"id":6,  "paciente":"C.F.R.",  "especialidade":"Oncologia",       "destino":"Manaus", "status":"autorizado",   "data":"2026-04-03", "urgencia":"urgente"},
    {"id":7,  "paciente":"A.B.C.",  "especialidade":"Hematologia",     "destino":"Manaus", "status":"em_analise",   "data":"2026-04-09", "urgencia":"eletivo"},
    {"id":8,  "paciente":"P.Q.R.",  "especialidade":"Cirurgia Cardíaca","destino":"Manaus","status":"autorizado",   "data":"2026-04-04", "urgencia":"urgente"},
]

_HISTORICO_AUTORIZACOES = [
    {"mes":"Nov/25","ambulatorial":52,"internacao":28,"tfd":12,"negadas":6},
    {"mes":"Dez/25","ambulatorial":58,"internacao":30,"tfd":14,"negadas":5},
    {"mes":"Jan/26","ambulatorial":61,"internacao":32,"tfd":13,"negadas":7},
    {"mes":"Fev/26","ambulatorial":55,"internacao":29,"tfd":11,"negadas":4},
    {"mes":"Mar/26","ambulatorial":63,"internacao":31,"tfd":15,"negadas":8},
    {"mes":"Abr/26","ambulatorial":66,"internacao":36,"tfd":8, "negadas":6},
]

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    total_fila    = sum(f["fila"] for f in _FILA_AMBULATORIAL)
    aut_mes       = sum(f["autorizadas_mes"] for f in _FILA_AMBULATORIAL)
    neg_mes       = sum(f["negadas_mes"] for f in _FILA_AMBULATORIAL)
    urgentes      = sum(f["urgentes"] for f in _FILA_AMBULATORIAL)
    criticas      = [f["especialidade"] for f in _FILA_AMBULATORIAL if f["status_meta"] == "critico"]
    tempo_medio   = round(sum(f["tempo_medio_dias"] for f in _FILA_AMBULATORIAL) / len(_FILA_AMBULATORIAL), 1)

    total_leitos  = sum(i["leitos_ref"] for i in _INTERNACOES)
    leitos_ocup   = sum(i["ocupados"] for i in _INTERNACOES)
    valor_aih_mes = sum(i["valor_aih_mes"] for i in _INTERNACOES)
    tfd_autorizados = sum(1 for t in _TFD_SOLICITACOES if t["status"] == "autorizado")

    # MAC financeiro (espelho do painel financeiro)
    mac_dotacao    = 1_200_000.00
    mac_empenhado  = 492_000.00
    mac_pct        = round(mac_empenhado / mac_dotacao * 100, 1)

    return {
        "competencia":       "Abr/2026",
        "fila_total":        total_fila,
        "autorizadas_mes":   aut_mes,
        "negadas_mes":       neg_mes,
        "urgentes":          urgentes,
        "especialidades_criticas": criticas,
        "tempo_espera_medio_dias": tempo_medio,
        "taxa_autorizacao":  round(aut_mes / (aut_mes + neg_mes) * 100, 1),
        "leitos_referenciados": total_leitos,
        "leitos_ocupados":   leitos_ocup,
        "taxa_ocupacao":     round(leitos_ocup / total_leitos * 100, 1),
        "valor_aih_mes":     round(valor_aih_mes, 2),
        "tfd_autorizados_mes": tfd_autorizados,
        "tfd_pendentes":     len(_TFD_SOLICITACOES) - tfd_autorizados,
        "mac_dotacao":       mac_dotacao,
        "mac_empenhado":     mac_empenhado,
        "mac_pct":           mac_pct,
        "historico":         _HISTORICO_AUTORIZACOES,
    }


@router.get("/fila-ambulatorial")
async def fila_ambulatorial():
    return sorted(_FILA_AMBULATORIAL, key=lambda x: -x["fila"])


@router.get("/internacoes")
async def internacoes():
    return _INTERNACOES


@router.get("/tfd")
async def tfd():
    return sorted(_TFD_SOLICITACOES, key=lambda x: (x["status"] != "em_analise", x["data"]))
