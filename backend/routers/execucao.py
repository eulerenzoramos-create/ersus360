"""
Router: /api/execucao — Módulo 3: Execução Financeira
Empenho → Liquidação → Pagamento · Restos a Pagar · Aplicações
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date

from database import get_db
from models import Convenio
from models.execucao import (
    Empenho, Liquidacao, Pagamento, RestoPagar, AplicacaoFinanceira,
    SituacaoEmpenho, SituacaoResto,
)
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/execucao", tags=["Execução Financeira"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class EmpenhoIn(BaseModel):
    convenio_id: int
    numero: str
    data_empenho: date
    valor: float
    descricao: Optional[str] = None
    natureza: Optional[str] = None
    modalidade: Optional[str] = None
    credor: Optional[str] = None
    cnpj_credor: Optional[str] = None
    situacao: SituacaoEmpenho = SituacaoEmpenho.NORMAL


class EmpenhoOut(EmpenhoIn):
    id: int
    valor_liquidado: float = 0.0
    valor_pago: float = 0.0
    valor_saldo: float = 0.0

    class Config:
        from_attributes = True


class LiquidacaoIn(BaseModel):
    empenho_id: int
    data_liquidacao: date
    valor: float
    nota_fiscal: Optional[str] = None
    descricao: Optional[str] = None


class LiquidacaoOut(LiquidacaoIn):
    id: int

    class Config:
        from_attributes = True


class PagamentoIn(BaseModel):
    liquidacao_id: int
    data_pagamento: date
    valor: float
    forma_pagamento: str = "OB"
    numero_ob: Optional[str] = None
    banco_favorecido: Optional[str] = None


class PagamentoOut(PagamentoIn):
    id: int

    class Config:
        from_attributes = True


class RestoIn(BaseModel):
    empenho_id: int
    ano_inscricao: int
    valor_inscrito: float
    situacao: SituacaoResto = SituacaoResto.PROCESSADO


class RestoOut(RestoIn):
    id: int
    valor_pago: float
    valor_cancelado: float
    valor_saldo: float

    class Config:
        from_attributes = True


class AplicacaoIn(BaseModel):
    convenio_id: int
    conta_bancaria_id: Optional[int] = None
    competencia: str
    saldo_inicial: float
    rendimento: float
    saldo_final: float
    data_extrato: Optional[date] = None


class AplicacaoOut(AplicacaoIn):
    id: int

    class Config:
        from_attributes = True


class SaldoConvenioOut(BaseModel):
    convenio_id: int
    numero: str
    objeto: str
    valor_recebido: float
    total_empenhado: float
    total_liquidado: float
    total_pago: float
    total_rendimento: float
    saldo_disponivel: float
    saldo_comprometido: float
    saldo_executado: float
    perc_executado: float


# ── Empenhos ──────────────────────────────────────────────────────────────────

@router.get("/empenhos", response_model=list[EmpenhoOut])
async def listar_empenhos(
    convenio_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    stmt = select(Empenho).order_by(Empenho.data_empenho.desc())
    if convenio_id:
        stmt = stmt.where(Empenho.convenio_id == convenio_id)
    res = await db.execute(stmt)
    empenhos = res.scalars().all()

    resultado = []
    for emp in empenhos:
        # calcula totais
        liq_stmt = select(func.coalesce(func.sum(Liquidacao.valor), 0)).where(
            Liquidacao.empenho_id == emp.id
        )
        pag_stmt = select(func.coalesce(func.sum(Pagamento.valor), 0)).where(
            Pagamento.liquidacao_id.in_(
                select(Liquidacao.id).where(Liquidacao.empenho_id == emp.id)
            )
        )
        liq_total = (await db.execute(liq_stmt)).scalar() or 0.0
        pag_total = (await db.execute(pag_stmt)).scalar() or 0.0

        out = EmpenhoOut(
            **{c.key: getattr(emp, c.key) for c in emp.__table__.columns},
            valor_liquidado=liq_total,
            valor_pago=pag_total,
            valor_saldo=emp.valor - liq_total,
        )
        resultado.append(out)
    return resultado


@router.post("/empenhos", response_model=EmpenhoOut, status_code=201)
async def criar_empenho(
    dados: EmpenhoIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    emp = Empenho(**dados.model_dump())
    db.add(emp)
    await db.commit()
    await db.refresh(emp)
    return EmpenhoOut(**{c.key: getattr(emp, c.key) for c in emp.__table__.columns})


@router.delete("/empenhos/{empenho_id}")
async def remover_empenho(
    empenho_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Empenho).where(Empenho.id == empenho_id))
    emp = res.scalar_one_or_none()
    if not emp:
        raise HTTPException(404, "Empenho não encontrado")
    await db.delete(emp)
    await db.commit()
    return {"ok": True}


# ── Liquidações ───────────────────────────────────────────────────────────────

@router.get("/liquidacoes", response_model=list[LiquidacaoOut])
async def listar_liquidacoes(
    empenho_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    stmt = select(Liquidacao).order_by(Liquidacao.data_liquidacao.desc())
    if empenho_id:
        stmt = stmt.where(Liquidacao.empenho_id == empenho_id)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/liquidacoes", response_model=LiquidacaoOut, status_code=201)
async def criar_liquidacao(
    dados: LiquidacaoIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    liq = Liquidacao(**dados.model_dump())
    db.add(liq)
    await db.commit()
    await db.refresh(liq)
    return liq


# ── Pagamentos ────────────────────────────────────────────────────────────────

@router.get("/pagamentos", response_model=list[PagamentoOut])
async def listar_pagamentos(
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Pagamento).order_by(Pagamento.data_pagamento.desc()))
    return res.scalars().all()


@router.post("/pagamentos", response_model=PagamentoOut, status_code=201)
async def criar_pagamento(
    dados: PagamentoIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    pag = Pagamento(**dados.model_dump())
    db.add(pag)
    await db.commit()
    await db.refresh(pag)
    return pag


# ── Restos a Pagar ────────────────────────────────────────────────────────────

@router.get("/restos-a-pagar", response_model=list[RestoOut])
async def listar_restos(
    ano: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    stmt = select(RestoPagar).order_by(RestoPagar.ano_inscricao.desc())
    if ano:
        stmt = stmt.where(RestoPagar.ano_inscricao == ano)
    res = await db.execute(stmt)
    restos = res.scalars().all()
    return [
        RestoOut(
            **{c.key: getattr(r, c.key) for c in r.__table__.columns},
            valor_saldo=r.valor_saldo,
        )
        for r in restos
    ]


@router.post("/restos-a-pagar", response_model=RestoOut, status_code=201)
async def criar_resto(
    dados: RestoIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    resto = RestoPagar(**dados.model_dump())
    db.add(resto)
    await db.commit()
    await db.refresh(resto)
    return RestoOut(
        **{c.key: getattr(resto, c.key) for c in resto.__table__.columns},
        valor_saldo=resto.valor_saldo,
    )


# ── Aplicações Financeiras ────────────────────────────────────────────────────

@router.get("/rendimentos", response_model=list[AplicacaoOut])
async def listar_aplicacoes(
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(
        select(AplicacaoFinanceira).order_by(AplicacaoFinanceira.competencia.desc())
    )
    return res.scalars().all()


@router.post("/rendimentos", response_model=AplicacaoOut, status_code=201)
async def criar_aplicacao(
    dados: AplicacaoIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    aplic = AplicacaoFinanceira(**dados.model_dump())
    db.add(aplic)
    await db.commit()
    await db.refresh(aplic)
    return aplic


# ── Saldo por convênio ────────────────────────────────────────────────────────

@router.get("/saldo/{convenio_id}", response_model=SaldoConvenioOut)
async def saldo_convenio(
    convenio_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res_conv = await db.execute(select(Convenio).where(Convenio.id == convenio_id))
    conv = res_conv.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "Convênio não encontrado")

    # Totais de empenho
    stmt_emp = select(func.coalesce(func.sum(Empenho.valor), 0)).where(
        Empenho.convenio_id == convenio_id
    )
    total_empenhado = (await db.execute(stmt_emp)).scalar() or 0.0

    # IDs de empenhos do convênio
    emp_ids_stmt = select(Empenho.id).where(Empenho.convenio_id == convenio_id)
    emp_ids = [r[0] for r in (await db.execute(emp_ids_stmt)).all()]

    # Totais de liquidação
    total_liquidado = 0.0
    total_pago = 0.0
    if emp_ids:
        stmt_liq = select(func.coalesce(func.sum(Liquidacao.valor), 0)).where(
            Liquidacao.empenho_id.in_(emp_ids)
        )
        total_liquidado = (await db.execute(stmt_liq)).scalar() or 0.0

        liq_ids_stmt = select(Liquidacao.id).where(Liquidacao.empenho_id.in_(emp_ids))
        liq_ids = [r[0] for r in (await db.execute(liq_ids_stmt)).all()]
        if liq_ids:
            stmt_pag = select(func.coalesce(func.sum(Pagamento.valor), 0)).where(
                Pagamento.liquidacao_id.in_(liq_ids)
            )
            total_pago = (await db.execute(stmt_pag)).scalar() or 0.0

    # Rendimentos
    stmt_rend = select(func.coalesce(func.sum(AplicacaoFinanceira.rendimento), 0)).where(
        AplicacaoFinanceira.convenio_id == convenio_id
    )
    total_rendimento = (await db.execute(stmt_rend)).scalar() or 0.0

    valor_recebido = conv.valor_recebido or conv.valor_contrato
    saldo_disponivel = valor_recebido + total_rendimento - total_pago
    saldo_comprometido = total_empenhado - total_pago
    perc = (total_pago / valor_recebido * 100) if valor_recebido > 0 else 0

    return SaldoConvenioOut(
        convenio_id=conv.id,
        numero=conv.numero,
        objeto=conv.objeto,
        valor_recebido=valor_recebido,
        total_empenhado=total_empenhado,
        total_liquidado=total_liquidado,
        total_pago=total_pago,
        total_rendimento=total_rendimento,
        saldo_disponivel=saldo_disponivel,
        saldo_comprometido=saldo_comprometido,
        saldo_executado=total_pago,
        perc_executado=round(perc, 2),
    )
