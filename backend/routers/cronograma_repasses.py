from fastapi import APIRouter
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/cronograma-repasses", tags=["cronograma-repasses"])

# ── Dados de referência ────────────────────────────────────────────────────────

_REPASSES = [
    # ── Janeiro 2026 ──────────────────────────────────────────────────────────
    {
        "id": "r01", "competencia": "Jan/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS) — Componente fixo Previne Brasil",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/01/2026", "data_credito": "14/01/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": "Creditado dentro do prazo."
    },
    {
        "id": "r02", "competencia": "Jan/2026", "bloco": "Vigilância em Saúde",
        "programa": "Piso Fixo de Vigilância em Saúde (PFVS)",
        "valor_previsto": 28400, "valor_creditado": 28400,
        "data_prevista": "20/01/2026", "data_credito": "20/01/2026",
        "status": "creditado", "portaria": "GM/MS nº 1.378/2013",
        "observacao": ""
    },
    {
        "id": "r03", "competencia": "Jan/2026", "bloco": "Saúde Mental",
        "programa": "Rede de Atenção Psicossocial (RAPS) — Incentivo CAPS",
        "valor_previsto": 32600, "valor_creditado": 32600,
        "data_prevista": "20/01/2026", "data_credito": "19/01/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.088/2011",
        "observacao": ""
    },
    # ── Fevereiro 2026 ────────────────────────────────────────────────────────
    {
        "id": "r04", "competencia": "Fev/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS) — Componente fixo Previne Brasil",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/02/2026", "data_credito": "14/02/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": ""
    },
    {
        "id": "r05", "competencia": "Fev/2026", "bloco": "Média e Alta Complexidade",
        "programa": "Teto MAC — Atenção Ambulatorial e Hospitalar",
        "valor_previsto": 64200, "valor_creditado": 58900,
        "data_prevista": "25/02/2026", "data_credito": "25/02/2026",
        "status": "parcial", "portaria": "GM/MS nº 204/2007",
        "observacao": "Glosa de R$ 5.300 por inconsistência no SIA/SIH — BPA-C com erros de CNES."
    },
    {
        "id": "r06", "competencia": "Fev/2026", "bloco": "Vigilância em Saúde",
        "programa": "Piso Fixo de Vigilância em Saúde (PFVS)",
        "valor_previsto": 28400, "valor_creditado": 28400,
        "data_prevista": "20/02/2026", "data_credito": "19/02/2026",
        "status": "creditado", "portaria": "GM/MS nº 1.378/2013",
        "observacao": ""
    },
    # ── Março 2026 ────────────────────────────────────────────────────────────
    {
        "id": "r07", "competencia": "Mar/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS) — Componente fixo Previne Brasil",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/03/2026", "data_credito": "15/03/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": ""
    },
    {
        "id": "r08", "competencia": "Mar/2026", "bloco": "Saúde Mental",
        "programa": "Rede de Atenção Psicossocial (RAPS) — Incentivo CAPS",
        "valor_previsto": 32600, "valor_creditado": 32600,
        "data_prevista": "20/03/2026", "data_credito": "19/03/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.088/2011",
        "observacao": ""
    },
    {
        "id": "r09", "competencia": "Mar/2026", "bloco": "Vigilância em Saúde",
        "programa": "Piso Fixo de Vigilância em Saúde (PFVS)",
        "valor_previsto": 28400, "valor_creditado": 28400,
        "data_prevista": "20/03/2026", "data_credito": "20/03/2026",
        "status": "creditado", "portaria": "GM/MS nº 1.378/2013",
        "observacao": ""
    },
    # ── Abril 2026 ────────────────────────────────────────────────────────────
    {
        "id": "r10", "competencia": "Abr/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS) — Componente fixo Previne Brasil",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/04/2026", "data_credito": "15/04/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": ""
    },
    {
        "id": "r11", "competencia": "Abr/2026", "bloco": "Vigilância em Saúde",
        "programa": "Piso Fixo de Vigilância em Saúde (PFVS)",
        "valor_previsto": 28400, "valor_creditado": 28400,
        "data_prevista": "20/04/2026", "data_credito": "14/05/2026",
        "status": "creditado", "portaria": "GM/MS nº 1.378/2013",
        "observacao": "Creditado com atraso de 24 dias — pendência documental regularizada em 13/05/2026."
    },
    {
        "id": "r12", "competencia": "Abr/2026", "bloco": "Média e Alta Complexidade",
        "programa": "Teto MAC — Atenção Ambulatorial e Hospitalar",
        "valor_previsto": 64200, "valor_creditado": 64200,
        "data_prevista": "25/04/2026", "data_credito": "25/04/2026",
        "status": "creditado", "portaria": "GM/MS nº 204/2007",
        "observacao": ""
    },
    # ── Maio 2026 ─────────────────────────────────────────────────────────────
    {
        "id": "r13", "competencia": "Mai/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS) — Componente fixo Previne Brasil",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/05/2026", "data_credito": "15/05/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": ""
    },
    {
        "id": "r14", "competencia": "Mai/2026", "bloco": "Vigilância em Saúde",
        "programa": "Piso Fixo de Vigilância em Saúde (PFVS)",
        "valor_previsto": 28400, "valor_creditado": 28400,
        "data_prevista": "20/05/2026", "data_credito": "20/05/2026",
        "status": "creditado", "portaria": "GM/MS nº 1.378/2013",
        "observacao": ""
    },
    {
        "id": "r15", "competencia": "Mai/2026", "bloco": "Saúde Mental",
        "programa": "Rede de Atenção Psicossocial (RAPS) — Incentivo CAPS",
        "valor_previsto": 32600, "valor_creditado": 32600,
        "data_prevista": "20/05/2026", "data_credito": "19/05/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.088/2011",
        "observacao": ""
    },
    # ── Junho 2026 ────────────────────────────────────────────────────────────
    {
        "id": "r16", "competencia": "Jun/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS) — Componente fixo Previne Brasil",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/06/2026", "data_credito": "14/06/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": ""
    },
    {
        "id": "r17", "competencia": "Jun/2026", "bloco": "Vigilância em Saúde",
        "programa": "Piso Fixo de Vigilância em Saúde (PFVS)",
        "valor_previsto": 28400, "valor_creditado": 28400,
        "data_prevista": "20/06/2026", "data_credito": "19/06/2026",
        "status": "creditado", "portaria": "GM/MS nº 1.378/2013",
        "observacao": ""
    },
    {
        "id": "r18", "competencia": "Jun/2026", "bloco": "Média e Alta Complexidade",
        "programa": "Teto MAC — Atenção Ambulatorial e Hospitalar",
        "valor_previsto": 64200, "valor_creditado": 64200,
        "data_prevista": "25/06/2026", "data_credito": "25/06/2026",
        "status": "creditado", "portaria": "GM/MS nº 204/2007",
        "observacao": ""
    },
    # ── Julho 2026 — mês corrente (referência: 24/07/2026) ───────────────────
    {
        "id": "r19", "competencia": "Jul/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS) — Componente fixo Previne Brasil",
        "valor_previsto": 142800, "valor_creditado": 142800,
        "data_prevista": "15/07/2026", "data_credito": "14/07/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.493/2017",
        "observacao": "Creditado em 14/07/2026 — dentro do prazo."
    },
    {
        "id": "r20", "competencia": "Jul/2026", "bloco": "Vigilância em Saúde",
        "programa": "Piso Fixo de Vigilância em Saúde (PFVS)",
        "valor_previsto": 28400, "valor_creditado": 28400,
        "data_prevista": "20/07/2026", "data_credito": "18/07/2026",
        "status": "creditado", "portaria": "GM/MS nº 1.378/2013",
        "observacao": "Creditado em 18/07/2026."
    },
    {
        "id": "r21", "competencia": "Jul/2026", "bloco": "Saúde Mental",
        "programa": "Rede de Atenção Psicossocial (RAPS) — Incentivo CAPS",
        "valor_previsto": 32600, "valor_creditado": 32600,
        "data_prevista": "20/07/2026", "data_credito": "17/07/2026",
        "status": "creditado", "portaria": "GM/MS nº 3.088/2011",
        "observacao": "Creditado em 17/07/2026."
    },
    {
        "id": "r22", "competencia": "Jul/2026", "bloco": "Média e Alta Complexidade",
        "programa": "Teto MAC — Atenção Ambulatorial e Hospitalar",
        "valor_previsto": 64200, "valor_creditado": None,
        "data_prevista": "25/07/2026", "data_credito": None,
        "status": "previsto", "portaria": "GM/MS nº 204/2007",
        "observacao": "Aguardando processamento FNS — previsão 25/07/2026."
    },
    # ── Agosto 2026 — próximo mês (previsão) ─────────────────────────────────
    {
        "id": "r23", "competencia": "Ago/2026", "bloco": "Atenção Primária",
        "programa": "Financiamento da Atenção Primária à Saúde (FAEC-APS) — Componente fixo Previne Brasil",
        "valor_previsto": 142800, "valor_creditado": None,
        "data_prevista": "15/08/2026", "data_credito": None,
        "status": "previsto", "portaria": "GM/MS nº 3.493/2017",
        "observacao": "Previsão de crédito: 14/08/2026."
    },
    {
        "id": "r24", "competencia": "Ago/2026", "bloco": "Vigilância em Saúde",
        "programa": "Piso Fixo de Vigilância em Saúde (PFVS)",
        "valor_previsto": 28400, "valor_creditado": None,
        "data_prevista": "20/08/2026", "data_credito": None,
        "status": "previsto", "portaria": "GM/MS nº 1.378/2013",
        "observacao": ""
    },
    {
        "id": "r25", "competencia": "Ago/2026", "bloco": "Saúde Mental",
        "programa": "Rede de Atenção Psicossocial (RAPS) — Incentivo CAPS",
        "valor_previsto": 32600, "valor_creditado": None,
        "data_prevista": "20/08/2026", "data_credito": None,
        "status": "previsto", "portaria": "GM/MS nº 3.088/2011",
        "observacao": ""
    },
    {
        "id": "r26", "competencia": "Ago/2026", "bloco": "Média e Alta Complexidade",
        "programa": "Teto MAC — Atenção Ambulatorial e Hospitalar",
        "valor_previsto": 64200, "valor_creditado": None,
        "data_prevista": "25/08/2026", "data_credito": None,
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
    parciais   = [r for r in _REPASSES if r["status"] == "parcial"]
    total_prev = sum(r["valor_previsto"] for r in _REPASSES)
    total_cred = sum(r["valor_creditado"] for r in _REPASSES if r["valor_creditado"])
    # Proximo repasse nao creditado
    proximo = next((r for r in _REPASSES if r["status"] == "previsto"), None)
    return {
        "total_previsto":   total_prev,
        "total_creditado":  total_cred,
        "total_aguardando": total_prev - total_cred,
        "creditados":       len(creditados),
        "previstos":        len(previstos),
        "atrasados":        len(atrasados),
        "parciais":         len(parciais),
        "proximo_repasse":  proximo["data_prevista"] if proximo else "—",
        "proximo_valor":    proximo["valor_previsto"] if proximo else 0,
        "proximo_bloco":    proximo["bloco"] if proximo else "—",
    }

@router.get("/lista")
def lista(status: Optional[str] = None, bloco: Optional[str] = None):
    data = _REPASSES
    if status and status != "todos":
        data = [r for r in data if r["status"] == status]
    if bloco and bloco != "todos":
        data = [r for r in data if r["bloco"] == bloco]
    return data
