"""Router: Execução Financeira FNS — Apuí/AM
CRUD para empenhos, liquidações e pagamentos dos recursos FNS.
"""
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from database import get_db
from models.execucao_fns import ExecucaoFns

router = APIRouter(prefix="/api/execucao-fns", tags=["execucao-fns"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class EmpenhoIn(BaseModel):
    exercicio:       int   = 2026
    recurso:         str
    bloco:           str   = ""
    grupo:           str   = ""
    dotacao:         float = 0.0
    numero_empenho:  Optional[str] = None
    data_empenho:    Optional[date] = None
    empenhado:       float = 0.0
    fornecedor:      str   = ""
    cnpj_fornecedor: Optional[str] = None
    contrato:        Optional[str] = None
    conta_pagadora:  Optional[str] = None
    portaria:        Optional[str] = None
    observacao:      Optional[str] = None


class LiquidacaoIn(BaseModel):
    data_liquidacao: date
    liquidado:       float
    nota_fiscal:     Optional[str] = None
    observacao:      Optional[str] = None


class PagamentoIn(BaseModel):
    data_pagamento:  date
    pago:            float
    numero_ob:       Optional[str] = None
    observacao:      Optional[str] = None


class PortariaIn(BaseModel):
    portaria: str


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _calcular_situacao(item: ExecucaoFns) -> str:
    if item.pago > 0 and item.pago >= item.empenhado:
        return "Pago"
    if item.liquidado > 0:
        return "Liquidado"
    if item.empenhado > 0:
        return "Empenhado"
    return "Pendente"


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("")
async def listar(exercicio: int = 2026, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ExecucaoFns)
        .where(ExecucaoFns.ativo == True, ExecucaoFns.exercicio == exercicio)
        .order_by(ExecucaoFns.criado_em.desc())
    )
    return [i.to_dict() for i in result.scalars().all()]


@router.get("/{item_id}")
async def obter(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    return item.to_dict()


@router.post("/empenho", status_code=201)
async def cadastrar_empenho(body: EmpenhoIn, db: AsyncSession = Depends(get_db)):
    item = ExecucaoFns(**body.model_dump())
    item.situacao = _calcular_situacao(item)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item.to_dict()


@router.put("/{item_id}/liquidacao")
async def registrar_liquidacao(item_id: int, body: LiquidacaoIn, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    item.data_liquidacao = body.data_liquidacao
    item.liquidado       = body.liquidado
    item.nota_fiscal     = body.nota_fiscal
    if body.observacao:
        item.observacao = body.observacao
    item.situacao = _calcular_situacao(item)
    item.atualizado_em = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return item.to_dict()


@router.put("/{item_id}/pagamento")
async def registrar_pagamento(item_id: int, body: PagamentoIn, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    item.data_pagamento = body.data_pagamento
    item.pago           = body.pago
    item.numero_ob      = body.numero_ob
    if body.observacao:
        item.observacao = body.observacao
    item.situacao = _calcular_situacao(item)
    item.atualizado_em = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return item.to_dict()


@router.put("/{item_id}/portaria")
async def vincular_portaria(item_id: int, body: PortariaIn, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    item.portaria = body.portaria
    item.atualizado_em = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return item.to_dict()


@router.delete("/{item_id}")
async def excluir(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    item.ativo = False
    item.atualizado_em = datetime.utcnow()
    await db.commit()
    return {"ok": True}
