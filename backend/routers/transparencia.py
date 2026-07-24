from fastapi import APIRouter
from typing import Optional

router = APIRouter(prefix="/api/transparencia", tags=["transparencia"])

_INDICADORES = [
    # Atenção Primária
    {"id": "i01", "categoria": "Atenção Primária", "nome": "Cobertura ESF", "valor": "98,5%", "competencia": "Jun/2026", "fonte": "SCNES", "publico": True},
    {"id": "i02", "categoria": "Atenção Primária", "nome": "Score Previne Brasil", "valor": "6,8", "competencia": "1º quadri/2026", "fonte": "SISAB", "publico": True},
    {"id": "i03", "categoria": "Atenção Primária", "nome": "Pré-natal 6+ consultas", "valor": "74,1%", "competencia": "1º quadri/2026", "fonte": "SISAB", "publico": True},
    {"id": "i04", "categoria": "Atenção Primária", "nome": "Acompanhamento HAS", "valor": "61,3%", "competencia": "1º quadri/2026", "fonte": "SISAB", "publico": True},
    {"id": "i05", "categoria": "Atenção Primária", "nome": "Acompanhamento DM", "valor": "58,7%", "competencia": "1º quadri/2026", "fonte": "SISAB", "publico": True},
    # Vigilância
    {"id": "i06", "categoria": "Vigilância em Saúde", "nome": "Taxa de incidência de malária (por mil hab.)", "valor": "8,4", "competencia": "Jun/2026", "fonte": "SIVEP-Malária", "publico": True},
    {"id": "i07", "categoria": "Vigilância em Saúde", "nome": "Cobertura vacinal DTP3 < 1 ano", "valor": "89,3%", "competencia": "Jun/2026", "fonte": "PNI/SIPNI", "publico": True},
    # Financeiro
    {"id": "i08", "categoria": "Gestão Financeira", "nome": "Percentual de repasses creditados no prazo", "valor": "83,3%", "competencia": "Jan–Jun/2026", "fonte": "FNS/SIOPS", "publico": True},
    {"id": "i09", "categoria": "Gestão Financeira", "nome": "Execução orçamentária saúde", "valor": "71,4%", "competencia": "Jun/2026", "fonte": "SIOPS", "publico": True},
    # RH
    {"id": "i10", "categoria": "Recursos Humanos", "nome": "Equipes ESF completas", "valor": "4 de 5", "competencia": "Jul/2026", "fonte": "SCNES", "publico": True},
    {"id": "i11", "categoria": "Recursos Humanos", "nome": "Profissionais com CNES ativo", "valor": "96,8%", "competencia": "Jul/2026", "fonte": "SCNES", "publico": True},
]

_LAI = [
    {
        "id": "l01", "protocolo": "LAI-2026-001", "data_solicitacao": "2026-04-03",
        "assunto": "Relação de contratos de prestação de serviços de saúde",
        "status": "respondida", "prazo": "2026-04-23", "dias_restantes": None,
        "resposta_em": "2026-04-18",
    },
    {
        "id": "l02", "protocolo": "LAI-2026-002", "data_solicitacao": "2026-05-14",
        "assunto": "Valores transferidos pelo FNS ao FMS no ano de 2025",
        "status": "respondida", "prazo": "2026-06-03", "dias_restantes": None,
        "resposta_em": "2026-05-28",
    },
    {
        "id": "l03", "protocolo": "LAI-2026-003", "data_solicitacao": "2026-06-22",
        "assunto": "Quantidade e identificação de servidores da saúde efetivos e comissionados",
        "status": "em_analise", "prazo": "2026-07-12", "dias_restantes": None,
        "resposta_em": None,
    },
    {
        "id": "l04", "protocolo": "LAI-2026-004", "data_solicitacao": "2026-07-05",
        "assunto": "Atas das reuniões do Conselho Municipal de Saúde — 2026",
        "status": "em_prazo", "prazo": "2026-07-25", "dias_restantes": 2,
        "resposta_em": None,
    },
    {
        "id": "l05", "protocolo": "LAI-2026-005", "data_solicitacao": "2026-07-14",
        "assunto": "Relatório de execução financeira do 1º semestre de 2026",
        "status": "em_prazo", "prazo": "2026-08-03", "dias_restantes": 11,
        "resposta_em": None,
    },
]

_DESPESAS = [
    {"id": "d01", "funcao": "Atenção Primária",         "dotacao": 2_160_000, "empenhado": 1_720_000, "liquidado": 1_610_000, "pago": 1_560_000},
    {"id": "d02", "funcao": "Média e Alta Complexidade", "dotacao": 980_000,  "empenhado": 590_000,  "liquidado": 550_000,  "pago": 540_000},
    {"id": "d03", "funcao": "Vigilância em Saúde",       "dotacao": 420_000,  "empenhado": 310_000,  "liquidado": 290_000,  "pago": 285_000},
    {"id": "d04", "funcao": "Saúde Mental (RAPS)",       "dotacao": 380_000,  "empenhado": 198_000,  "liquidado": 180_000,  "pago": 178_000},
    {"id": "d05", "funcao": "Assistência Farmacêutica",  "dotacao": 320_000,  "empenhado": 210_000,  "liquidado": 205_000,  "pago": 200_000},
    {"id": "d06", "funcao": "Gestão em Saúde",           "dotacao": 280_000,  "empenhado": 163_000,  "liquidado": 150_000,  "pago": 148_000},
]

# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/resumo")
def resumo():
    total_dot = sum(d["dotacao"]   for d in _DESPESAS)
    total_emp = sum(d["empenhado"] for d in _DESPESAS)
    total_pag = sum(d["pago"]      for d in _DESPESAS)
    exec_pct  = round(total_emp / total_dot * 100, 1) if total_dot else 0
    respondidas = len([l for l in _LAI if l["status"] == "respondida"])
    return {
        "score_transparencia":   81,
        "total_indicadores":     len(_INDICADORES),
        "dotacao_total":         total_dot,
        "empenhado_total":       total_emp,
        "pago_total":            total_pag,
        "execucao_pct":          exec_pct,
        "total_lai":             len(_LAI),
        "lai_respondidas":       respondidas,
        "lai_em_prazo":          len([l for l in _LAI if l["status"] == "em_prazo"]),
        "lai_atrasadas":         len([l for l in _LAI if l["status"] == "atrasada"]),
    }

@router.get("/indicadores")
def indicadores(categoria: Optional[str] = None):
    data = _INDICADORES
    if categoria and categoria != "todos":
        data = [i for i in data if i["categoria"] == categoria]
    return data

@router.get("/lai")
def lai(status: Optional[str] = None):
    data = _LAI
    if status and status != "todos":
        data = [l for l in data if l["status"] == status]
    return data

@router.get("/despesas")
def despesas():
    return _DESPESAS
