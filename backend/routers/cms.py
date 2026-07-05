"""
Conselho Municipal de Saúde — CMS Apuí
FMS Apuí/AM · Controle Social · Lei 8.142/1990
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/cms", tags=["Conselho Municipal de Saúde"])

_REUNIOES = [
    {"id":1, "tipo":"ordinaria", "data":"2026-01-21","pauta":"Aprovação PAS 2026; Prestação de contas Dez/25","quorum":12,"total_conselheiros":14,"ata_aprovada":True, "deliberacoes":["Aprovação PAS 2026","Aprovação prestação de contas Dez/25"]},
    {"id":2, "tipo":"ordinaria", "data":"2026-02-18","pauta":"SIOPS 4º trimestre 2025; Contratação TFD","quorum":11,"total_conselheiros":14,"ata_aprovada":True, "deliberacoes":["Aprovação SIOPS Dez/25 (17.16%)","Aprovação contratação TFD"]},
    {"id":3, "tipo":"ordinaria", "data":"2026-03-18","pauta":"Prestação contas Fev/26; Reforma UBS Kennedy","quorum":13,"total_conselheiros":14,"ata_aprovada":True, "deliberacoes":["Aprovação prestação de contas","Aprovação licitação reforma UBS Kennedy R$680k"]},
    {"id":4, "tipo":"extraordinaria","data":"2026-03-25","pauta":"Surto dengue — medidas emergenciais","quorum":10,"total_conselheiros":14,"ata_aprovada":True, "deliberacoes":["Aprovação plano de combate à dengue","Solicitação de recursos estaduais"]},
    {"id":5, "tipo":"ordinaria", "data":"2026-04-15","pauta":"Prestação contas Mar/26; RAPS — CAPS I","quorum":12,"total_conselheiros":14,"ata_aprovada":False,"deliberacoes":["Em aprovação — ata pendente"]},
    {"id":6, "tipo":"ordinaria", "data":"2026-05-20","pauta":"LOA 2027 (prévia); Concurso público RH","quorum":None,"total_conselheiros":14,"ata_aprovada":False,"deliberacoes":[]},
]

_CONSELHEIROS = [
    {"id":1, "nome":"Pedro A.L.",    "segmento":"gestão",      "cargo":"Presidente",         "ativo":True},
    {"id":2, "nome":"Sandra R.M.",   "segmento":"trabalhadores","cargo":"Vice-presidente",    "ativo":True},
    {"id":3, "nome":"José B.F.",     "segmento":"usuarios",    "cargo":"Secretário",         "ativo":True},
    {"id":4, "nome":"Ana C.O.",      "segmento":"gestão",      "cargo":"Conselheiro(a)",     "ativo":True},
    {"id":5, "nome":"Mário D.S.",    "segmento":"prestadores", "cargo":"Conselheiro(a)",     "ativo":True},
    {"id":6, "nome":"Cláudia E.N.",  "segmento":"usuarios",    "cargo":"Conselheiro(a)",     "ativo":True},
    {"id":7, "nome":"Roberto F.T.",  "segmento":"trabalhadores","cargo":"Conselheiro(a)",    "ativo":True},
    {"id":8, "nome":"Lúcia G.P.",    "segmento":"usuarios",    "cargo":"Conselheiro(a)",     "ativo":True},
    {"id":9, "nome":"Antônio H.Q.",  "segmento":"gestão",      "cargo":"Conselheiro(a)",     "ativo":True},
    {"id":10,"nome":"Fernanda I.R.", "segmento":"usuarios",    "cargo":"Conselheiro(a)",     "ativo":True},
    {"id":11,"nome":"Marcos J.U.",   "segmento":"trabalhadores","cargo":"Conselheiro(a)",    "ativo":True},
    {"id":12,"nome":"Patrícia K.V.", "segmento":"prestadores", "cargo":"Conselheiro(a)",     "ativo":True},
    {"id":13,"nome":"Carlos L.W.",   "segmento":"usuarios",    "cargo":"Conselheiro(a)",     "ativo":True},
    {"id":14,"nome":"Beatriz M.X.",  "segmento":"gestão",      "cargo":"Conselheiro(a)",     "ativo":False},
]

_DELIBERACOES = [
    {"id":1, "reuniao":1,"descricao":"Aprovação PAS 2026","status":"implementada","responsavel":"FMS","prazo":"2026-02-28"},
    {"id":2, "reuniao":1,"descricao":"Aprovação prestação de contas Dez/25","status":"implementada","responsavel":"FMS","prazo":"2026-02-15"},
    {"id":3, "reuniao":2,"descricao":"Aprovação SIOPS 4º trim 2025 (17.16%)","status":"implementada","responsavel":"FMS","prazo":"2026-03-15"},
    {"id":4, "reuniao":2,"descricao":"Aprovação contratação empresa TFD","status":"em_andamento","responsavel":"FMS/Licitação","prazo":"2026-04-30"},
    {"id":5, "reuniao":3,"descricao":"Aprovação licitação reforma UBS Kennedy","status":"em_andamento","responsavel":"Obras","prazo":"2026-06-30"},
    {"id":6, "reuniao":4,"descricao":"Plano de ação dengue — mobilização comunitária","status":"em_andamento","responsavel":"Vigilância","prazo":"2026-04-30"},
    {"id":7, "reuniao":4,"descricao":"Solicitar inseticida e insumos ao Estado/MS","status":"implementada","responsavel":"FMS","prazo":"2026-04-10"},
    {"id":8, "reuniao":5,"descricao":"Aprovação CAPS I — relatório anual RAPS","status":"pendente","responsavel":"FMS","prazo":"2026-05-15"},
]

@router.get("/dashboard")
async def dashboard():
    realizadas  = [r for r in _REUNIOES if r["quorum"] is not None]
    media_quorum= round(sum(r["quorum"] for r in realizadas) / len(realizadas), 1) if realizadas else 0
    proxima     = next((r for r in _REUNIOES if r["quorum"] is None), None)
    return {
        "competencia":         "2026",
        "total_reunioes":      len([r for r in _REUNIOES if r["quorum"] is not None]),
        "proxima_reuniao":     proxima["data"] if proxima else None,
        "proxima_pauta":       proxima["pauta"] if proxima else None,
        "media_quorum_pct":    round(media_quorum / 14 * 100, 1),
        "conselheiros_ativos": sum(1 for c in _CONSELHEIROS if c["ativo"]),
        "deliberacoes_total":  len(_DELIBERACOES),
        "deliberacoes_pendentes": sum(1 for d in _DELIBERACOES if d["status"]=="pendente"),
        "deliberacoes_andamento": sum(1 for d in _DELIBERACOES if d["status"]=="em_andamento"),
        "deliberacoes_implant":   sum(1 for d in _DELIBERACOES if d["status"]=="implementada"),
        "atas_pendentes":      sum(1 for r in _REUNIOES if r["quorum"] is not None and not r["ata_aprovada"]),
        "reunioes_ano":        [{"tipo":r["tipo"],"data":r["data"],"quorum":r["quorum"],"total":r["total_conselheiros"]} for r in _REUNIOES if r["quorum"] is not None],
    }

@router.get("/reunioes")
async def reunioes():
    return _REUNIOES

@router.get("/conselheiros")
async def conselheiros():
    return _CONSELHEIROS

@router.get("/deliberacoes")
async def deliberacoes():
    return _DELIBERACOES
