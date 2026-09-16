"""Router: /api/contas-fms — Contas Bancárias do Fundo Municipal de Saúde."""
from __future__ import annotations
import logging
from datetime import date, datetime
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.conta_bancaria_fms import ContaBancariaFMS, MovimentacaoContaFMS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/contas-fms", tags=["contas-fms"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


# ── Schemas ───────────────────────────────────────────────────────────────────

class ContaIn(BaseModel):
    banco:          str
    codigo_banco:   Optional[str] = None
    agencia:        Optional[str] = None
    numero_conta:   Optional[str] = None
    digito:         Optional[str] = None
    tipo:           str = "Corrente"
    descricao:      Optional[str] = None
    saldo_inicial:  float = 0.0
    data_saldo_ini: Optional[date] = None
    criado_por:     Optional[str] = None

class ContaUpdate(BaseModel):
    banco:          Optional[str] = None
    codigo_banco:   Optional[str] = None
    agencia:        Optional[str] = None
    numero_conta:   Optional[str] = None
    digito:         Optional[str] = None
    tipo:           Optional[str] = None
    descricao:      Optional[str] = None
    saldo_inicial:  Optional[float] = None
    data_saldo_ini: Optional[date] = None

class MovIn(BaseModel):
    tipo:         str            # "entrada" | "saida"
    valor:        float
    data:         date
    descricao:    Optional[str] = None
    origem:       str = "manual"
    referencia_id: Optional[int] = None
    criado_por:   Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_or_404(db: AsyncSession, id: int) -> ContaBancariaFMS:
    obj = await db.get(ContaBancariaFMS, id)
    if not obj or not obj.ativo:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return obj

def _saldo_atual(conta: ContaBancariaFMS) -> float:
    saldo = float(conta.saldo_inicial or 0)
    for m in conta.movimentacoes:
        v = float(m.valor or 0)
        saldo += v if m.tipo == "entrada" else -v
    return saldo


# ── Listagem ──────────────────────────────────────────────────────────────────

@router.get("")
async def listar_contas(db: DbDep):
    q = select(ContaBancariaFMS).where(ContaBancariaFMS.ativo == True).order_by(ContaBancariaFMS.banco)
    rows = (await db.execute(q)).scalars().all()
    result = []
    for c in rows:
        d = c.to_dict()
        # carrega movimentações
        q2 = select(MovimentacaoContaFMS).where(MovimentacaoContaFMS.conta_id == c.id).order_by(MovimentacaoContaFMS.data)
        movs = (await db.execute(q2)).scalars().all()
        c.movimentacoes = movs
        d["saldo_atual"] = _saldo_atual(c)
        d["total_entradas"] = sum(float(m.valor or 0) for m in movs if m.tipo == "entrada")
        d["total_saidas"] = sum(float(m.valor or 0) for m in movs if m.tipo == "saida")
        d["qtd_movimentacoes"] = len(movs)
        result.append(d)
    return result


@router.get("/resumo")
async def resumo_contas(db: DbDep):
    contas = await listar_contas(db)
    return {
        "total_contas": len(contas),
        "saldo_consolidado": sum(c["saldo_atual"] for c in contas),
        "total_entradas": sum(c["total_entradas"] for c in contas),
        "total_saidas": sum(c["total_saidas"] for c in contas),
        "contas": contas,
    }


# ── CRUD Conta ────────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def criar_conta(db: DbDep, body: ContaIn):
    obj = ContaBancariaFMS(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    d = obj.to_dict()
    d["saldo_atual"] = float(obj.saldo_inicial or 0)
    d["total_entradas"] = 0.0
    d["total_saidas"] = 0.0
    d["qtd_movimentacoes"] = 0
    logger.info("Conta FMS criada id=%s banco=%s", obj.id, obj.banco)
    return d


@router.get("/{id}")
async def obter_conta(db: DbDep, id: int):
    obj = await _get_or_404(db, id)
    q2 = select(MovimentacaoContaFMS).where(MovimentacaoContaFMS.conta_id == id).order_by(MovimentacaoContaFMS.data.desc())
    movs = (await db.execute(q2)).scalars().all()
    obj.movimentacoes = movs
    d = obj.to_dict()
    d["saldo_atual"] = _saldo_atual(obj)
    d["total_entradas"] = sum(float(m.valor or 0) for m in movs if m.tipo == "entrada")
    d["total_saidas"] = sum(float(m.valor or 0) for m in movs if m.tipo == "saida")
    d["movimentacoes"] = [m.to_dict() for m in movs]
    return d


@router.put("/{id}")
async def atualizar_conta(db: DbDep, id: int, body: ContaUpdate):
    obj = await _get_or_404(db, id)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    await db.commit()
    await db.refresh(obj)
    return obj.to_dict()


@router.delete("/{id}")
async def excluir_conta(db: DbDep, id: int):
    obj = await _get_or_404(db, id)
    obj.ativo = False
    await db.commit()
    return {"ok": True, "id": id}


# ── Movimentações ─────────────────────────────────────────────────────────────

@router.post("/{id}/movimentacao", status_code=201)
async def adicionar_movimentacao(db: DbDep, id: int, body: MovIn):
    await _get_or_404(db, id)
    mov = MovimentacaoContaFMS(conta_id=id, **body.model_dump())
    db.add(mov)
    await db.commit()
    await db.refresh(mov)
    logger.info("Movimentação id=%s conta=%s tipo=%s valor=%s", mov.id, id, mov.tipo, mov.valor)
    return mov.to_dict()


@router.get("/{id}/extrato")
async def extrato(
    db: DbDep,
    id: int,
    de: Optional[date] = Query(None),
    ate: Optional[date] = Query(None),
):
    await _get_or_404(db, id)
    q = select(MovimentacaoContaFMS).where(MovimentacaoContaFMS.conta_id == id)
    if de:
        q = q.where(MovimentacaoContaFMS.data >= de)
    if ate:
        q = q.where(MovimentacaoContaFMS.data <= ate)
    q = q.order_by(MovimentacaoContaFMS.data)
    movs = (await db.execute(q)).scalars().all()

    saldo_corrente = float((await db.get(ContaBancariaFMS, id)).saldo_inicial or 0)
    linhas = []
    for m in movs:
        v = float(m.valor or 0)
        if m.tipo == "entrada":
            saldo_corrente += v
        else:
            saldo_corrente -= v
        d = m.to_dict()
        d["saldo_apos"] = saldo_corrente
        linhas.append(d)

    return {
        "conta_id": id,
        "de": de.isoformat() if de else None,
        "ate": ate.isoformat() if ate else None,
        "linhas": linhas,
        "saldo_final": saldo_corrente,
        "total_entradas": sum(float(m.valor or 0) for m in movs if m.tipo == "entrada"),
        "total_saidas": sum(float(m.valor or 0) for m in movs if m.tipo == "saida"),
    }


@router.delete("/{conta_id}/movimentacao/{mov_id}")
async def excluir_movimentacao(db: DbDep, conta_id: int, mov_id: int):
    mov = await db.get(MovimentacaoContaFMS, mov_id)
    if not mov or mov.conta_id != conta_id:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")
    await db.delete(mov)
    await db.commit()
    return {"ok": True}
