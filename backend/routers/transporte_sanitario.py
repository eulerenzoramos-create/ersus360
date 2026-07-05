"""
Transporte Sanitário / TFD — Tratamento Fora do Domicílio
FMS Apuí/AM · Gestão de frota e viagens médicas
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/transporte-sanitario", tags=["Transporte Sanitário"])

_FROTA = [
    {"id":1, "placa":"QRS-1A23","tipo":"Ambulância UTI",   "marca":"Mercedes Sprinter","ano":2022,"km":48200,"status":"operacional","proxima_rev":"2026-07-10","combustivel":"diesel","capacidade":1,"base":"UBS Central"},
    {"id":2, "placa":"QRT-2B45","tipo":"Ambulância Simples","marca":"Peugeot Boxer",    "ano":2021,"km":72400,"status":"operacional","proxima_rev":"2026-06-20","combustivel":"diesel","capacidade":4,"base":"UBS Kennedy"},
    {"id":3, "placa":"QRU-3C67","tipo":"Ambulância Simples","marca":"Fiat Ducato",      "ano":2020,"km":91800,"status":"manutencao", "proxima_rev":"2026-05-01","combustivel":"diesel","capacidade":4,"base":"UBS Cachoeira"},
    {"id":4, "placa":"QRV-4D89","tipo":"Veículo Leve",      "marca":"Toyota Hilux",     "ano":2023,"km":28600,"status":"operacional","proxima_rev":"2026-09-15","combustivel":"flex",  "capacidade":4,"base":"Secretaria"},
    {"id":5, "placa":"QRW-5E01","tipo":"Veículo Leve",      "marca":"Mitsubishi L200",  "ano":2021,"km":65300,"status":"operacional","proxima_rev":"2026-08-01","combustivel":"flex",  "capacidade":4,"base":"UBS Central"},
    {"id":6, "placa":"QRX-6F23","tipo":"Micro-ônibus",      "marca":"Iveco Daily",      "ano":2019,"km":118400,"status":"aguardando_peca","proxima_rev":"2026-04-01","combustivel":"diesel","capacidade":15,"base":"Secretaria"},
]

_VIAGENS = [
    {"id":1, "paciente":"J.S.F.",  "destino":"Manaus","especialidade":"Oncologia",       "data":"2026-04-02","status":"realizada",  "veiculo":"QRS-1A23","km_total":860,"motorista":"A.M.","custo_km":3.20,"acomp":"cônjuge"},
    {"id":2, "paciente":"M.A.P.",  "destino":"Manaus","especialidade":"Cardiologia",      "data":"2026-04-05","status":"realizada",  "veiculo":"QRS-1A23","km_total":860,"motorista":"A.M.","custo_km":3.20,"acomp":"filho(a)"},
    {"id":3, "paciente":"T.R.O.",  "destino":"Manaus","especialidade":"Neurologia",       "data":"2026-04-08","status":"realizada",  "veiculo":"QRT-2B45","km_total":860,"motorista":"B.C.","custo_km":2.80,"acomp":"cônjuge"},
    {"id":4, "paciente":"A.N.S.",  "destino":"Manaus","especialidade":"Hemodiálise",      "data":"2026-04-09","status":"realizada",  "veiculo":"QRT-2B45","km_total":860,"motorista":"B.C.","custo_km":2.80,"acomp":"mãe"},
    {"id":5, "paciente":"K.L.M.",  "destino":"Manaus","especialidade":"Oftalmologia",     "data":"2026-04-12","status":"realizada",  "veiculo":"QRV-4D89","km_total":860,"motorista":"C.D.","custo_km":2.40,"acomp":"filho(a)"},
    {"id":6, "paciente":"P.H.T.",  "destino":"Manaus","especialidade":"Ortopedia",        "data":"2026-04-15","status":"realizada",  "veiculo":"QRV-4D89","km_total":860,"motorista":"C.D.","custo_km":2.40,"acomp":"cônjuge"},
    {"id":7, "paciente":"F.B.R.",  "destino":"Humaitá","especialidade":"Fisioterapia",    "data":"2026-04-16","status":"realizada",  "veiculo":"QRW-5E01","km_total":480,"motorista":"E.F.","custo_km":2.40,"acomp":"não"},
    {"id":8, "paciente":"C.E.V.",  "destino":"Manaus","especialidade":"Oncologia",        "data":"2026-04-18","status":"realizada",  "veiculo":"QRS-1A23","km_total":860,"motorista":"A.M.","custo_km":3.20,"acomp":"cônjuge"},
    {"id":9, "paciente":"D.O.Q.",  "destino":"Manaus","especialidade":"Cirurgia Cardíaca","data":"2026-04-22","status":"realizada",  "veiculo":"QRS-1A23","km_total":860,"motorista":"A.M.","custo_km":3.20,"acomp":"filho(a)"},
    {"id":10,"paciente":"L.W.G.",  "destino":"Manaus","especialidade":"Psiquiatria",      "data":"2026-04-25","status":"realizada",  "veiculo":"QRT-2B45","km_total":860,"motorista":"B.C.","custo_km":2.80,"acomp":"cônjuge"},
    {"id":11,"paciente":"I.X.H.",  "destino":"Manaus","especialidade":"Endocrinologia",   "data":"2026-04-28","status":"agendada",   "veiculo":"QRV-4D89","km_total":860,"motorista":"C.D.","custo_km":2.40,"acomp":"mãe"},
    {"id":12,"paciente":"R.Y.N.",  "destino":"Manaus","especialidade":"Nefrologia",       "data":"2026-05-02","status":"agendada",   "veiculo":"QRS-1A23","km_total":860,"motorista":"A.M.","custo_km":3.20,"acomp":"cônjuge"},
    {"id":13,"paciente":"U.Z.C.",  "destino":"Humaitá","especialidade":"Ortopedia",       "data":"2026-05-05","status":"agendada",   "veiculo":"QRW-5E01","km_total":480,"motorista":"E.F.","custo_km":2.40,"acomp":"não"},
    {"id":14,"paciente":"V.B.P.",  "destino":"Manaus","especialidade":"Oncologia",        "data":"2026-05-08","status":"agendada",   "veiculo":"QRT-2B45","km_total":860,"motorista":"B.C.","custo_km":2.80,"acomp":"filho(a)"},
]

_CUSTO_MENSAL = [
    {"mes":"Nov/25","viagens":32,"km_total":22400,"custo":74800},
    {"mes":"Dez/25","viagens":28,"km_total":19600,"custo":65200},
    {"mes":"Jan/26","viagens":35,"km_total":24500,"custo":81600},
    {"mes":"Fev/26","viagens":30,"km_total":21000,"custo":70000},
    {"mes":"Mar/26","viagens":38,"km_total":26600,"custo":88600},
    {"mes":"Abr/26","viagens":14,"km_total":9800, "custo":32700},
]

@router.get("/dashboard")
async def dashboard():
    realizadas   = [v for v in _VIAGENS if v["status"] == "realizada"]
    agendadas    = [v for v in _VIAGENS if v["status"] == "agendada"]
    op_count     = sum(1 for f in _FROTA if f["status"] == "operacional")
    por_esp: dict = {}
    for v in _VIAGENS:
        por_esp[v["especialidade"]] = por_esp.get(v["especialidade"], 0) + 1
    top_esp = sorted(por_esp.items(), key=lambda x: -x[1])[:5]
    custo_mes = sum(v["km_total"]*v["custo_km"] for v in realizadas)
    return {
        "competencia":       "Abr/2026",
        "total_frota":       len(_FROTA),
        "frota_operacional": op_count,
        "frota_indisponivel":len(_FROTA) - op_count,
        "viagens_realizadas_mes": len(realizadas),
        "viagens_agendadas": len(agendadas),
        "km_total_mes":      sum(v["km_total"] for v in realizadas),
        "custo_estimado_mes":round(custo_mes, 2),
        "destinos": {"manaus": sum(1 for v in realizadas if v["destino"]=="Manaus"), "humaita": sum(1 for v in realizadas if v["destino"]=="Humaitá")},
        "top_especialidades": [{"esp":k,"n":v} for k,v in top_esp],
        "historico_mensal":  _CUSTO_MENSAL,
    }

@router.get("/frota")
async def frota():
    return _FROTA

@router.get("/viagens")
async def viagens():
    return _VIAGENS

@router.get("/custo-mensal")
async def custo_mensal():
    return _CUSTO_MENSAL
