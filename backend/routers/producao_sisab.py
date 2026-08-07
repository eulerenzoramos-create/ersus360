"""
Produção APS — SISAB / e-SUS PEC
FMS Apuí/AM · Registro de Atendimentos e Procedimentos
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/sisab", tags=["Produção APS"])

@lru_cache(maxsize=1)
def _ATENDIMENTOS():
    return [
        # por equipe ESF, competência Mar/26
        {"equipe":"ESF Liberdade",     "medico":410,"enfermeiro":385,"odonto":180,"outros":95, "total":1070,"meta":1000,"status":"ok"},
        {"equipe":"ESF Kennedy",       "medico":298,"enfermeiro":270,"odonto":140,"outros":72, "total":780, "meta":900, "status":"atencao"},
        {"equipe":"ESF Cachoeira",     "medico":345,"enfermeiro":310,"odonto":155,"outros":88, "total":898, "meta":950, "status":"atencao"},
        {"equipe":"ESF JK",            "medico":376,"enfermeiro":352,"odonto":162,"outros":84, "total":974, "meta":900, "status":"ok"},
        {"equipe":"ESF Estrada Nova",  "medico":188,"enfermeiro":175,"odonto": 82,"outros":45, "total":490, "meta":600, "status":"critico"},
        {"equipe":"ESF Três Estados",  "medico":142,"enfermeiro":138,"odonto": 65,"outros":38, "total":383, "meta":500, "status":"critico"},
        {"equipe":"ESF Acari",         "medico":195,"enfermeiro":188,"odonto": 90,"outros":52, "total":525, "meta":550, "status":"atencao"},
        {"equipe":"ESF Maravilha",     "medico":162,"enfermeiro":155,"odonto": 72,"outros":40, "total":429, "meta":500, "status":"atencao"},
        {"equipe":"ESF Bela Vista",    "medico":118,"enfermeiro":110,"odonto": 52,"outros":30, "total":310, "meta":400, "status":"critico"},
    ]


@lru_cache(maxsize=1)
def _PROCEDIMENTOS():
    return [
        {"procedimento":"Consulta médica APS",         "codigo":"0301010064","qtd":2234,"meta_mes":2200,"status":"ok"},
        {"procedimento":"Consulta enfermagem",          "codigo":"0301010072","qtd":2083,"meta_mes":2000,"status":"ok"},
        {"procedimento":"Visita domiciliar ACS",        "codigo":"0301010030","qtd":4812,"meta_mes":5000,"status":"atencao"},
        {"procedimento":"Vacinação (todos imunobiol.)", "codigo":"0301100020","qtd":387, "meta_mes":400, "status":"atencao"},
        {"procedimento":"Pré-natal (consulta)",         "codigo":"0301010102","qtd":148, "meta_mes":150, "status":"atencao"},
        {"procedimento":"Coleta citopatológico",        "codigo":"0203010086","qtd":62,  "meta_mes":80,  "status":"critico"},
        {"procedimento":"Atendimento odontológico 1ª consulta","codigo":"0301160054","qtd":198,"meta_mes":200,"status":"ok"},
        {"procedimento":"Escovação dental supervisionada","codigo":"0301160038","qtd":312,"meta_mes":400,"status":"atencao"},
        {"procedimento":"Exame DST/HIV (rápido)",       "codigo":"0214010074","qtd":45,  "meta_mes":60,  "status":"critico"},
        {"procedimento":"Aferição PA",                  "codigo":"0101010010","qtd":3218,"meta_mes":3000,"status":"ok"},
        {"procedimento":"Glicemia capilar",             "codigo":"0214010228","qtd":1842,"meta_mes":1800,"status":"ok"},
        {"procedimento":"Curativos / pequenas cirurgias","codigo":"0301060096","qtd":284,"meta_mes":250,"status":"ok"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes":"Out/25","atend":7120,"vd_acs":5280,"proc_odonto":820},
        {"mes":"Nov/25","atend":7480,"vd_acs":5410,"proc_odonto":850},
        {"mes":"Dez/25","atend":6820,"vd_acs":4890,"proc_odonto":760},
        {"mes":"Jan/26","atend":7650,"vd_acs":5520,"proc_odonto":910},
        {"mes":"Fev/26","atend":7210,"vd_acs":5280,"proc_odonto":870},
        {"mes":"Mar/26","atend":7859,"vd_acs":5280,"proc_odonto":998},
    ]


@lru_cache(maxsize=1)
def _CICLOS():
    return [
        {"ciclo":"Jan/26","enviado":True, "data_envio":"2026-02-05","registros":8210,"criticas":12,"status":"ok"},
        {"ciclo":"Fev/26","enviado":True, "data_envio":"2026-03-04","registros":7940,"criticas":8, "status":"ok"},
        {"ciclo":"Mar/26","enviado":True, "data_envio":"2026-04-03","registros":8450,"criticas":5, "status":"ok"},
        {"ciclo":"Abr/26","enviado":False,"data_envio":None,        "registros":6180,"criticas":None,"status":"pendente"},
    ]


@router.get("/dashboard")
async def dashboard():
    total_atend   = sum(e["total"] for e in _ATENDIMENTOS())
    abaixo_meta   = [e["equipe"] for e in _ATENDIMENTOS() if e["status"]=="critico"]
    return {
        "competencia":      "Mar/2026",
        "total_atendimentos": total_atend,
        "meta_total":       sum(e["meta"] for e in _ATENDIMENTOS()),
        "equipes_criticas": len(abaixo_meta),
        "equipes_ok":       sum(1 for e in _ATENDIMENTOS() if e["status"]=="ok"),
        "ciclo_atual_status":"pendente",
        "registros_abr":    _CICLOS()[-1]["registros"],
        "historico":        _HISTORICO(),
        "top_proc":         [{"proc":p["procedimento"],"qtd":p["qtd"]} for p in sorted(_PROCEDIMENTOS(),key=lambda x:-x["qtd"])[:5]],
    }

@router.get("/por-equipe")
async def por_equipe():
    return _ATENDIMENTOS()

@router.get("/procedimentos")
async def procedimentos():
    return _PROCEDIMENTOS()

@router.get("/ciclos")
async def ciclos():
    return _CICLOS()