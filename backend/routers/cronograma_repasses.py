from fastapi import APIRouter
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/cronograma-repasses", tags=["cronograma-repasses"])

# ── Dados de referência ────────────────────────────────────────────────────────

_REPASSES = [
    {
        "id": "r01", "competencia": "Jan/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS)",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/01/2026", "data_credito": "14/01/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": "Creditado dentro do prazo."
    },
    {
        "id": "r02", "competencia": "Jan/2026", "bloco": "Vigilância em Saúde",
        "programa": "Vigilância Epidemiológica e Ambiental",
        "valor_previsto": 28400, "valor_creditado": 28400,
        "data_prevista": "20/01/2026", "data_credito": "20/01/2026",
        "status": "creditado", "portaria": "GM/MS nº 1.378/2013",
        "observacao": ""
    },
    {
        "id": "r03", "competencia": "Fev/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS)",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/02/2026", "data_credito": "14/02/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": ""
    },
    {
        "id": "r04", "competencia": "Fev/2026", "bloco": "Média e Alta Complexidade",
        "programa": "Teto MAC — Ambulatorial e Hospitalar",
        "valor_previsto": 64200, "valor_creditado": 58900,
        "data_prevista": "25/02/2026", "data_credito": "25/02/2026",
        "status": "parcial", "portaria": "GM/MS nº 204/2007",
        "observacao": "Glosa de R$ 5.300 por inconsistência no SIA/SIH."
    },
    {
        "id": "r05", "competencia": "Mar/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS)",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/03/2026", "data_credito": "15/03/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": ""
    },
    {
        "id": "r06", "competencia": "Mar/2026", "bloco": "Saúde Mental",
        "programa": "Rede de Atenção Psicossocial (RAPS)",
        "valor_previsto": 32600, "valor_creditado": 32600,
        "data_prevista": "20/03/2026", "data_credito": "19/03/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.088/2011",
        "observacao": ""
    },
    {
        "id": "r07", "competencia": "Abr/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS)",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/04/2026", "data_credito": "15/04/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": ""
    },
    {
        "id": "r08", "competencia": "Abr/2026", "bloco": "Vigilância em Saúde",
        "programa": "Vigilância Epidemiológica e Ambiental",
        "valor_previsto": 28400, "valor_creditado": None,
        "data_prevista": "20/04/2026", "data_credito": None,
        "status": "atrasado", "portaria": "GM/MS nº 1.378/2013",
        "observacao": "Pendência de pendência documental no FNS. Previsão de regularização: 05/05/2026."
    },
    {
        "id": "r09", "competencia": "Mai/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS)",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/05/2026", "data_credito": "15/05/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": ""
    },
    {
        "id": "r10", "competencia": "Jun/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS)",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/06/2026", "data_credito": "14/06/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": ""
    },
    {
        "id": "r11", "competencia": "Jul/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS)",
        "valor_previsto": 142800, "valor_creditado": None,
        "data_prevista": "15/07/2026", "data_credito": None,
        "status": "previsto", "portaria": "GM/MS nº 3.493/2017",
        "observacao": "Aguardando processamento FNS."
    },
    {
        "id": "r12", "competencia": "Jul/2026", "bloco": "Média e Alta Complexidade",
        "programa": "Teto MAC — Ambulatorial e Hospitalar",
        "valor_previsto": 64200, "valor_creditado": None,
        "data_prevista": "25/07/2026", "data_credito": None,
        "status": "previsto", "portaria": "GM/MS nº 204/2007",
        "observacao": ""
    },
]

# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/resumo")
def resumo():
    creditados = [r for r in _REPASSES if r["status"] == "creditado"]
    previstos  = [r for r in _REPASSES if r["status"] == "previsto"]
    atrasados  = [r for r in _REPASSES if r["status"] == "atrasado"]
    total_prev = sum(r["valor_previsto"] for r in _REPASSES)
    total_cred = sum(r["valor_creditado"] for r in _REPASSES if r["valor_creditado"])
    return {
        "total_previsto":   total_prev,
        "total_creditado":  total_cred,
        "total_aguardando": total_prev - total_cred,
        "creditados":       len(creditados),
        "previstos":        len(previstos),
        "atrasados":        len(atrasados),
        "proximo_repasse":  "15/07/2026",
        "proximo_valor":    142800,
        "proximo_bloco":    "Atenção Primária",
    }

@router.get("/lista")
def lista(status: Optional[str] = None, bloco: Optional[str] = None):
    data = _REPASSES
    if status and status != "todos":
        data = [r for r in data if r["status"] == status]
    if bloco and bloco != "todos":
        data = [r for r in data if r["bloco"] == bloco]
    return data
