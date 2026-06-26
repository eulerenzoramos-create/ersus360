"""
Router: /api/relatorios — Módulo 10: Prestação de Contas e Relatórios
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date

from database import get_db
from models import Convenio, Repasse, Municipio, Indicador
from models.execucao import Empenho, Liquidacao, Pagamento, AplicacaoFinanceira
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/relatorios", tags=["Relatórios"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class ItemFinanceiro(BaseModel):
    convenio: str
    objeto: str
    bloco: str
    valor_recebido: float
    valor_empenhado: float
    valor_liquidado: float
    valor_pago: float
    saldo: float
    perc_executado: float


class RelatorioFinanceiroOut(BaseModel):
    municipio: str
    uf: str
    periodo: str
    gerado_em: str
    total_recebido: float
    total_empenhado: float
    total_liquidado: float
    total_pago: float
    total_saldo: float
    total_rendimento: float
    itens: list[ItemFinanceiro]


class ItemIndicador(BaseModel):
    indicador: str
    eixo: str
    meta: float
    alcancado: float
    situacao: str


class RelatorioGerencialOut(BaseModel):
    municipio: str
    periodo: str
    gerado_em: str
    financeiro: RelatorioFinanceiroOut
    indicadores: list[ItemIndicador]
    total_alertas_criticos: int
    total_obras_andamento: int


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/financeiro", response_model=RelatorioFinanceiroOut)
async def relatorio_financeiro(
    ano: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    nome_mun = mun.nome if mun else "N/A"
    uf = mun.uf if mun else "N/A"

    stmt_conv = select(Convenio)
    if mun:
        stmt_conv = stmt_conv.where(Convenio.municipio_id == mun.id)
    res_conv = await db.execute(stmt_conv)
    convenios = res_conv.scalars().all()

    itens = []
    total_recebido = total_emp = total_liq = total_pago = total_rend = 0.0

    for conv in convenios:
        # Repasses do ano
        stmt_rep = select(func.coalesce(func.sum(Repasse.valor_realizado), 0)).where(
            Repasse.convenio_id == conv.id
        )
        if ano:
            stmt_rep = stmt_rep.where(Repasse.ano == ano)
        vr = (await db.execute(stmt_rep)).scalar() or 0.0

        # Empenhos
        stmt_emp = select(func.coalesce(func.sum(Empenho.valor), 0)).where(
            Empenho.convenio_id == conv.id
        )
        ve = (await db.execute(stmt_emp)).scalar() or 0.0

        # IDs empenhos → liquidações → pagamentos
        ids_emp = [
            r[0] for r in (
                await db.execute(select(Empenho.id).where(Empenho.convenio_id == conv.id))
            ).all()
        ]
        vl = vp = 0.0
        if ids_emp:
            vl = (await db.execute(
                select(func.coalesce(func.sum(Liquidacao.valor), 0))
                .where(Liquidacao.empenho_id.in_(ids_emp))
            )).scalar() or 0.0
            ids_liq = [
                r[0] for r in (
                    await db.execute(
                        select(Liquidacao.id).where(Liquidacao.empenho_id.in_(ids_emp))
                    )
                ).all()
            ]
            if ids_liq:
                vp = (await db.execute(
                    select(func.coalesce(func.sum(Pagamento.valor), 0))
                    .where(Pagamento.liquidacao_id.in_(ids_liq))
                )).scalar() or 0.0

        # Rendimentos
        vr_rend = (await db.execute(
            select(func.coalesce(func.sum(AplicacaoFinanceira.rendimento), 0))
            .where(AplicacaoFinanceira.convenio_id == conv.id)
        )).scalar() or 0.0

        bloco = conv.bloco_pacto.nome if conv.bloco_pacto_id else "N/A"
        saldo = vr - vp
        perc = (vp / vr * 100) if vr > 0 else 0

        itens.append(ItemFinanceiro(
            convenio=conv.numero,
            objeto=conv.objeto[:80],
            bloco=bloco,
            valor_recebido=vr,
            valor_empenhado=ve,
            valor_liquidado=vl,
            valor_pago=vp,
            saldo=saldo,
            perc_executado=round(perc, 2),
        ))

        total_recebido += vr
        total_emp += ve
        total_liq += vl
        total_pago += vp
        total_rend += vr_rend

    periodo = str(ano) if ano else "Todos os anos"
    from datetime import datetime
    return RelatorioFinanceiroOut(
        municipio=nome_mun,
        uf=uf,
        periodo=periodo,
        gerado_em=datetime.now().strftime("%d/%m/%Y %H:%M"),
        total_recebido=total_recebido,
        total_empenhado=total_emp,
        total_liquidado=total_liq,
        total_pago=total_pago,
        total_saldo=total_recebido - total_pago,
        total_rendimento=total_rend,
        itens=itens,
    )


@router.get("/por-bloco")
async def relatorio_por_bloco(
    ano: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Agrupamento financeiro por bloco de financiamento."""
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()

    stmt = select(Repasse.tipo_repasse, func.sum(Repasse.valor_realizado).label("total"))
    if mun:
        stmt = stmt.join(Convenio).where(Convenio.municipio_id == mun.id)
    if ano:
        stmt = stmt.where(Repasse.ano == ano)
    stmt = stmt.group_by(Repasse.tipo_repasse).order_by(func.sum(Repasse.valor_realizado).desc())

    res = await db.execute(stmt)
    return [{"bloco": r[0], "total": r[1]} for r in res.all()]


@router.get("/por-programa")
async def relatorio_por_programa(
    ano: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Agrupamento por programa (objeto do convênio)."""
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()

    stmt = (
        select(Convenio.programa, func.sum(Repasse.valor_realizado).label("total"))
        .join(Repasse)
    )
    if mun:
        stmt = stmt.where(Convenio.municipio_id == mun.id)
    if ano:
        stmt = stmt.where(Repasse.ano == ano)
    stmt = stmt.group_by(Convenio.programa).order_by(func.sum(Repasse.valor_realizado).desc())

    res = await db.execute(stmt)
    return [{"programa": r[0] or "Sem programa", "total": r[1]} for r in res.all()]


@router.get("/prestacao-contas")
async def prestacao_de_contas(
    ano: int = Query(..., description="Ano de referência"),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Relatório completo de prestação de contas para o TCE."""
    fin = await relatorio_financeiro(ano=ano, db=db, _=_)
    por_bloco = await relatorio_por_bloco(ano=ano, db=db, _=_)
    por_programa = await relatorio_por_programa(ano=ano, db=db, _=_)

    # Indicadores do ano
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    indicadores = []
    if mun:
        res_ind = await db.execute(
            select(Indicador)
            .where(
                Indicador.municipio_id == mun.id,
                Indicador.competencia.like(f"{ano}%"),
            )
        )
        for ind in res_ind.scalars().all():
            indicadores.append({
                "indicador": ind.indicador,
                "eixo": ind.eixo,
                "meta": ind.meta_prevista,
                "alcancado": ind.valor_alcancado,
                "situacao": ind.situacao,
            })

    return {
        "titulo": f"Prestação de Contas — Fundo Municipal de Saúde — {ano}",
        "municipio": fin.municipio,
        "uf": fin.uf,
        "periodo": str(ano),
        "gerado_em": fin.gerado_em,
        "resumo_financeiro": {
            "total_recebido": fin.total_recebido,
            "total_pago": fin.total_pago,
            "total_saldo": fin.total_saldo,
            "total_rendimento": fin.total_rendimento,
        },
        "por_bloco": por_bloco,
        "por_programa": por_programa,
        "convenios": [i.model_dump() for i in fin.itens],
        "indicadores": indicadores,
    }
