from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from services.fns_portal_service import (
    carregar_repasses, salvar_repasses, sincronizar_portal_transparencia
)
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/cronograma-repasses", tags=["cronograma-repasses"])

# ── Dados de referência (fallback quando JSON vazio) ──────────────────────────

_REPASSES_BASE = [
    # Janeiro 2026
    {"id":"r01","competencia":"Jan/2026","bloco":"Atencao Primaria","programa":"Financiamento da Atencao Primaria a Saude (FAEC-APS) - Componente fixo Previne Brasil","valor_previsto":142800,"valor_creditado":142800,"data_prevista":"15/01/2026","data_credito":"14/01/2026","status":"creditado","portaria":"GM/MS n 3.493/2017","observacao":"Creditado dentro do prazo.","fonte":"manual"},
    {"id":"r02","competencia":"Jan/2026","bloco":"Vigilancia em Saude","programa":"Piso Fixo de Vigilancia em Saude (PFVS)","valor_previsto":28400,"valor_creditado":28400,"data_prevista":"20/01/2026","data_credito":"20/01/2026","status":"creditado","portaria":"GM/MS n 1.378/2013","observacao":"","fonte":"manual"},
    {"id":"r03","competencia":"Jan/2026","bloco":"Saude Mental","programa":"Rede de Atencao Psicossocial (RAPS) - Incentivo CAPS","valor_previsto":32600,"valor_creditado":32600,"data_prevista":"20/01/2026","data_credito":"19/01/2026","status":"creditado","portaria":"GM/MS n 3.088/2011","observacao":"","fonte":"manual"},
    # Fevereiro 2026
    {"id":"r04","competencia":"Fev/2026","bloco":"Atencao Primaria","programa":"Financiamento da Atencao Primaria a Saude (FAEC-APS) - Componente fixo Previne Brasil","valor_previsto":142800,"valor_creditado":142800,"data_prevista":"15/02/2026","data_credito":"14/02/2026","status":"creditado","portaria":"GM/MS n 3.493/2017","observacao":"","fonte":"manual"},
    {"id":"r05","competencia":"Fev/2026","bloco":"Media e Alta Complexidade","programa":"Teto MAC - Atencao Ambulatorial e Hospitalar","valor_previsto":64200,"valor_creditado":58900,"data_prevista":"25/02/2026","data_credito":"25/02/2026","status":"parcial","portaria":"GM/MS n 204/2007","observacao":"Glosa de R$ 5.300 por inconsistencia no SIA/SIH.","fonte":"manual"},
    {"id":"r06","competencia":"Fev/2026","bloco":"Vigilancia em Saude","programa":"Piso Fixo de Vigilancia em Saude (PFVS)","valor_previsto":28400,"valor_creditado":28400,"data_prevista":"20/02/2026","data_credito":"19/02/2026","status":"creditado","portaria":"GM/MS n 1.378/2013","observacao":"","fonte":"manual"},
    # Marco 2026
    {"id":"r07","competencia":"Mar/2026","bloco":"Atencao Primaria","programa":"Financiamento da Atencao Primaria a Saude (FAEC-APS) - Componente fixo Previne Brasil","valor_previsto":142800,"valor_creditado":142800,"data_prevista":"15/03/2026","data_credito":"15/03/2026","status":"creditado","portaria":"GM/MS n 3.493/2017","observacao":"","fonte":"manual"},
    {"id":"r08","competencia":"Mar/2026","bloco":"Saude Mental","programa":"Rede de Atencao Psicossocial (RAPS) - Incentivo CAPS","valor_previsto":32600,"valor_creditado":32600,"data_prevista":"20/03/2026","data_credito":"19/03/2026","status":"creditado","portaria":"GM/MS n 3.088/2011","observacao":"","fonte":"manual"},
    {"id":"r09","competencia":"Mar/2026","bloco":"Vigilancia em Saude","programa":"Piso Fixo de Vigilancia em Saude (PFVS)","valor_previsto":28400,"valor_creditado":28400,"data_prevista":"20/03/2026","data_credito":"20/03/2026","status":"creditado","portaria":"GM/MS n 1.378/2013","observacao":"","fonte":"manual"},
    # Abril 2026
    {"id":"r10","competencia":"Abr/2026","bloco":"Atencao Primaria","programa":"Financiamento da Atencao Primaria a Saude (FAEC-APS) - Componente fixo Previne Brasil","valor_previsto":142800,"valor_creditado":142800,"data_prevista":"15/04/2026","data_credito":"15/04/2026","status":"creditado","portaria":"GM/MS n 3.493/2017","observacao":"","fonte":"manual"},
    {"id":"r11","competencia":"Abr/2026","bloco":"Vigilancia em Saude","programa":"Piso Fixo de Vigilancia em Saude (PFVS)","valor_previsto":28400,"valor_creditado":28400,"data_prevista":"20/04/2026","data_credito":"14/05/2026","status":"creditado","portaria":"GM/MS n 1.378/2013","observacao":"Creditado com atraso de 24 dias - pendencia documental regularizada em 13/05/2026.","fonte":"manual"},
    {"id":"r12","competencia":"Abr/2026","bloco":"Media e Alta Complexidade","programa":"Teto MAC - Atencao Ambulatorial e Hospitalar","valor_previsto":64200,"valor_creditado":64200,"data_prevista":"25/04/2026","data_credito":"25/04/2026","status":"creditado","portaria":"GM/MS n 204/2007","observacao":"","fonte":"manual"},
    # Maio 2026
    {"id":"r13","competencia":"Mai/2026","bloco":"Atencao Primaria","programa":"Financiamento da Atencao Primaria a Saude (FAEC-APS) - Componente fixo Previne Brasil","valor_previsto":142800,"valor_creditado":142800,"data_prevista":"15/05/2026","data_credito":"15/05/2026","status":"creditado","portaria":"GM/MS n 3.493/2017","observacao":"","fonte":"manual"},
    {"id":"r14","competencia":"Mai/2026","bloco":"Vigilancia em Saude","programa":"Piso Fixo de Vigilancia em Saude (PFVS)","valor_previsto":28400,"valor_creditado":28400,"data_prevista":"20/05/2026","data_credito":"20/05/2026","status":"creditado","portaria":"GM/MS n 1.378/2013","observacao":"","fonte":"manual"},
    {"id":"r15","competencia":"Mai/2026","bloco":"Saude Mental","programa":"Rede de Atencao Psicossocial (RAPS) - Incentivo CAPS","valor_previsto":32600,"valor_creditado":32600,"data_prevista":"20/05/2026","data_credito":"19/05/2026","status":"creditado","portaria":"GM/MS n 3.088/2011","observacao":"","fonte":"manual"},
    # Junho 2026
    {"id":"r16","competencia":"Jun/2026","bloco":"Atencao Primaria","programa":"Financiamento da Atencao Primaria a Saude (FAEC-APS) - Componente fixo Previne Brasil","valor_previsto":142800,"valor_creditado":142800,"data_prevista":"15/06/2026","data_credito":"14/06/2026","status":"creditado","portaria":"GM/MS n 3.493/2017","observacao":"","fonte":"manual"},
    {"id":"r17","competencia":"Jun/2026","bloco":"Vigilancia em Saude","programa":"Piso Fixo de Vigilancia em Saude (PFVS)","valor_previsto":28400,"valor_creditado":28400,"data_prevista":"20/06/2026","data_credito":"19/06/2026","status":"creditado","portaria":"GM/MS n 1.378/2013","observacao":"","fonte":"manual"},
    {"id":"r18","competencia":"Jun/2026","bloco":"Media e Alta Complexidade","programa":"Teto MAC - Atencao Ambulatorial e Hospitalar","valor_previsto":64200,"valor_creditado":64200,"data_prevista":"25/06/2026","data_credito":"25/06/2026","status":"creditado","portaria":"GM/MS n 204/2007","observacao":"","fonte":"manual"},
    # Julho 2026
    {"id":"r19","competencia":"Jul/2026","bloco":"Atencao Primaria","programa":"Financiamento da Atencao Primaria a Saude (FAEC-APS) - Componente fixo Previne Brasil","valor_previsto":142800,"valor_creditado":142800,"data_prevista":"15/07/2026","data_credito":"14/07/2026","status":"creditado","portaria":"GM/MS n 3.493/2017","observacao":"Creditado em 14/07/2026.","fonte":"manual"},
    {"id":"r20","competencia":"Jul/2026","bloco":"Vigilancia em Saude","programa":"Piso Fixo de Vigilancia em Saude (PFVS)","valor_previsto":28400,"valor_creditado":28400,"data_prevista":"20/07/2026","data_credito":"18/07/2026","status":"creditado","portaria":"GM/MS n 1.378/2013","observacao":"Creditado em 18/07/2026.","fonte":"manual"},
    {"id":"r21","competencia":"Jul/2026","bloco":"Saude Mental","programa":"Rede de Atencao Psicossocial (RAPS) - Incentivo CAPS","valor_previsto":32600,"valor_creditado":32600,"data_prevista":"20/07/2026","data_credito":"17/07/2026","status":"creditado","portaria":"GM/MS n 3.088/2011","observacao":"Creditado em 17/07/2026.","fonte":"manual"},
    {"id":"r22","competencia":"Jul/2026","bloco":"Media e Alta Complexidade","programa":"Teto MAC - Atencao Ambulatorial e Hospitalar","valor_previsto":64200,"valor_creditado":None,"data_prevista":"25/07/2026","data_credito":None,"status":"previsto","portaria":"GM/MS n 204/2007","observacao":"Aguardando processamento FNS - previsao 25/07/2026.","fonte":"manual"},
    # Agosto 2026
    {"id":"r23","competencia":"Ago/2026","bloco":"Atencao Primaria","programa":"Financiamento da Atencao Primaria a Saude (FAEC-APS) - Componente fixo Previne Brasil","valor_previsto":142800,"valor_creditado":None,"data_prevista":"15/08/2026","data_credito":None,"status":"previsto","portaria":"GM/MS n 3.493/2017","observacao":"","fonte":"manual"},
    {"id":"r24","competencia":"Ago/2026","bloco":"Vigilancia em Saude","programa":"Piso Fixo de Vigilancia em Saude (PFVS)","valor_previsto":28400,"valor_creditado":None,"data_prevista":"20/08/2026","data_credito":None,"status":"previsto","portaria":"GM/MS n 1.378/2013","observacao":"","fonte":"manual"},
    {"id":"r25","competencia":"Ago/2026","bloco":"Saude Mental","programa":"Rede de Atencao Psicossocial (RAPS) - Incentivo CAPS","valor_previsto":32600,"valor_creditado":None,"data_prevista":"20/08/2026","data_credito":None,"status":"previsto","portaria":"GM/MS n 3.088/2011","observacao":"","fonte":"manual"},
    {"id":"r26","competencia":"Ago/2026","bloco":"Media e Alta Complexidade","programa":"Teto MAC - Atencao Ambulatorial e Hospitalar","valor_previsto":64200,"valor_creditado":None,"data_prevista":"25/08/2026","data_credito":None,"status":"previsto","portaria":"GM/MS n 204/2007","observacao":"","fonte":"manual"},
]

# ── Modelos ────────────────────────────────────────────────────────────────────

class RepasseUpdate(BaseModel):
    competencia: Optional[str] = None
    bloco: Optional[str] = None
    programa: Optional[str] = None
    valor_previsto: Optional[float] = None
    valor_creditado: Optional[float] = None
    data_prevista: Optional[str] = None
    data_credito: Optional[str] = None
    status: Optional[str] = None
    portaria: Optional[str] = None
    observacao: Optional[str] = None

class RepasseCreate(BaseModel):
    competencia: str
    bloco: str
    programa: str
    valor_previsto: float
    valor_creditado: Optional[float] = None
    data_prevista: str
    data_credito: Optional[str] = None
    status: str = "previsto"
    portaria: Optional[str] = ""
    observacao: Optional[str] = ""

# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_repasses_efetivos() -> tuple[list, dict]:
    """Retorna (repasses, data_json). Se JSON vazio, usa dados base."""
    data = carregar_repasses()
    if not data["repasses"]:
        # Popula JSON com dados base para Railway nao ficar vazio
        data["repasses"] = list(_REPASSES_BASE)
        data["fonte_dados"] = "manual"
        salvar_repasses(data)
    return data["repasses"], data

def _calcular_resumo(repasses: list) -> dict:
    creditados = [r for r in repasses if r.get("status") == "creditado"]
    previstos  = [r for r in repasses if r.get("status") == "previsto"]
    atrasados  = [r for r in repasses if r.get("status") == "atrasado"]
    parciais   = [r for r in repasses if r.get("status") == "parcial"]
    total_prev = sum(r.get("valor_previsto", 0) or 0 for r in repasses)
    total_cred = sum(r.get("valor_creditado", 0) or 0 for r in repasses)
    proximo = next((r for r in repasses if r.get("status") == "previsto"), None)
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

# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/resumo")
def resumo():
    repasses, data = _get_repasses_efetivos()
    res = _calcular_resumo(repasses)
    res["ultima_sincronizacao"] = data.get("ultima_sincronizacao")
    res["fonte_dados"] = data.get("fonte_dados", "manual")
    res["municipio"] = data.get("municipio", "Apui")
    res["ibge"] = data.get("ibge", "1300144")
    return res

@router.get("/lista")
def lista(status: Optional[str] = None, bloco: Optional[str] = None):
    repasses, _ = _get_repasses_efetivos()
    if status and status != "todos":
        repasses = [r for r in repasses if r.get("status") == status]
    if bloco and bloco != "todos":
        repasses = [r for r in repasses if r.get("bloco") == bloco]
    return repasses

@router.get("/{repasse_id}")
def get_repasse(repasse_id: str):
    repasses, _ = _get_repasses_efetivos()
    for r in repasses:
        if r["id"] == repasse_id:
            return r
    raise HTTPException(status_code=404, detail="Repasse nao encontrado")

@router.post("")
def criar_repasse(body: RepasseCreate):
    _, data = _get_repasses_efetivos()
    novo = {
        "id": f"manual-{uuid.uuid4().hex[:8]}",
        "fonte": "manual",
        **body.model_dump(),
    }
    data["repasses"].append(novo)
    salvar_repasses(data)
    return novo

@router.put("/{repasse_id}")
def atualizar_repasse(repasse_id: str, body: RepasseUpdate):
    repasses, data = _get_repasses_efetivos()
    for r in data["repasses"]:
        if r["id"] == repasse_id:
            updates = {k: v for k, v in body.model_dump().items() if v is not None}
            r.update(updates)
            r["fonte"] = "manual"
            r["editado_em"] = datetime.now().isoformat()
            salvar_repasses(data)
            return r
    raise HTTPException(status_code=404, detail="Repasse nao encontrado")

@router.delete("/{repasse_id}")
def deletar_repasse(repasse_id: str):
    _, data = _get_repasses_efetivos()
    antes = len(data["repasses"])
    data["repasses"] = [r for r in data["repasses"] if r["id"] != repasse_id]
    if len(data["repasses"]) == antes:
        raise HTTPException(status_code=404, detail="Repasse nao encontrado")
    salvar_repasses(data)
    return {"ok": True}

@router.post("/sincronizar-fns")
async def sincronizar_fns(ano: int = 2026):
    # Garante que dados base existem antes de sincronizar
    _get_repasses_efetivos()
    resultado = await sincronizar_portal_transparencia(ano)
    return resultado
