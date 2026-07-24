from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from services.fns_portal_service import (
    carregar_repasses, salvar_repasses, sincronizar_portal_transparencia
)
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/cronograma-repasses", tags=["cronograma-repasses"])

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
    data = carregar_repasses()
    res = _calcular_resumo(data["repasses"])
    res["ultima_sincronizacao"] = data.get("ultima_sincronizacao")
    res["fonte_dados"] = data.get("fonte_dados", "manual")
    res["municipio"] = data.get("municipio", "Apuí")
    res["ibge"] = data.get("ibge", "1300144")
    return res

@router.get("/lista")
def lista(status: Optional[str] = None, bloco: Optional[str] = None):
    data = carregar_repasses()
    repasses = data["repasses"]
    if status and status != "todos":
        repasses = [r for r in repasses if r.get("status") == status]
    if bloco and bloco != "todos":
        repasses = [r for r in repasses if r.get("bloco") == bloco]
    return repasses

@router.get("/{repasse_id}")
def get_repasse(repasse_id: str):
    data = carregar_repasses()
    for r in data["repasses"]:
        if r["id"] == repasse_id:
            return r
    raise HTTPException(status_code=404, detail="Repasse nao encontrado")

@router.post("")
def criar_repasse(body: RepasseCreate):
    data = carregar_repasses()
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
    data = carregar_repasses()
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
    data = carregar_repasses()
    antes = len(data["repasses"])
    data["repasses"] = [r for r in data["repasses"] if r["id"] != repasse_id]
    if len(data["repasses"]) == antes:
        raise HTTPException(status_code=404, detail="Repasse nao encontrado")
    salvar_repasses(data)
    return {"ok": True}

@router.post("/sincronizar-fns")
async def sincronizar_fns(ano: int = 2026):
    resultado = await sincronizar_portal_transparencia(ano)
    return resultado
