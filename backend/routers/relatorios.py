"""
Router: /api/relatorios — Módulo 10: Prestação de Contas e Relatórios
"""
from __future__ import annotations
import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
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
        "titulo": f"Prestação de Contas — Fundo Municipal de Saúde de {fin.municipio}/{fin.uf} — {ano}",
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


@router.get("/exportar-csv")
async def exportar_csv(
    tipo: str = Query("financeiro", description="financeiro | indicadores"),
    ano: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Exporta relatório como CSV (UTF-8 com BOM para compatibilidade Excel)."""
    from datetime import datetime
    now = datetime.now().strftime("%Y%m%d_%H%M%S")

    output = io.StringIO()
    # BOM para Excel reconhecer UTF-8
    output.write("﻿")

    if tipo == "financeiro":
        fin = await relatorio_financeiro(ano=ano, db=db, _=_)
        writer = csv.writer(output, delimiter=";")
        writer.writerow([
            "Convênio", "Objeto", "Bloco", "Recebido (R$)",
            "Empenhado (R$)", "Liquidado (R$)", "Pago (R$)",
            "Saldo (R$)", "Executado (%)",
        ])
        for item in fin.itens:
            writer.writerow([
                item.convenio, item.objeto, item.bloco,
                f"{item.valor_recebido:.2f}".replace(".", ","),
                f"{item.valor_empenhado:.2f}".replace(".", ","),
                f"{item.valor_liquidado:.2f}".replace(".", ","),
                f"{item.valor_pago:.2f}".replace(".", ","),
                f"{item.saldo:.2f}".replace(".", ","),
                f"{item.perc_executado:.1f}".replace(".", ","),
            ])
        # Totais
        writer.writerow([])
        writer.writerow([
            "TOTAIS", "", "",
            f"{fin.total_recebido:.2f}".replace(".", ","),
            f"{fin.total_empenhado:.2f}".replace(".", ","),
            f"{fin.total_liquidado:.2f}".replace(".", ","),
            f"{fin.total_pago:.2f}".replace(".", ","),
            f"{fin.total_saldo:.2f}".replace(".", ","),
            "",
        ])
        filename = f"relatorio_financeiro_{fin.municipio}_{fin.periodo}_{now}.csv"

    else:
        # Indicadores
        res_mun = await db.execute(select(Municipio).limit(1))
        mun = res_mun.scalar_one_or_none()
        indicadores = []
        if mun:
            stmt = select(Indicador).where(Indicador.municipio_id == mun.id)
            if ano:
                stmt = stmt.where(Indicador.competencia.like(f"{ano}%"))
            res = await db.execute(stmt)
            indicadores = res.scalars().all()

        writer = csv.writer(output, delimiter=";")
        writer.writerow(["Indicador", "Eixo", "Competência", "Meta", "Alcançado", "Situação"])
        for ind in indicadores:
            writer.writerow([
                ind.indicador, ind.eixo, ind.competencia,
                f"{ind.meta_prevista:.2f}".replace(".", ","),
                f"{ind.valor_alcancado:.2f}".replace(".", ","),
                ind.situacao,
            ])
        nome_mun = mun.nome if mun else "municipio"
        filename = f"relatorio_indicadores_{nome_mun}_{ano or 'todos'}_{now}.csv"

    content = output.getvalue()
    return StreamingResponse(
        iter([content.encode("utf-8-sig")]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/exportar-pdf")
async def exportar_pdf(
    tipo: str = Query("gerencial", description="gerencial | financeiro | indicadores"),
    ano: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Gera relatório gerencial em PDF com ReportLab."""
    from datetime import datetime
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )

    # Busca dados
    fin = await relatorio_financeiro(ano=ano, db=db, _=_)
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()

    # Indicadores
    ind_list = []
    if mun:
        stmt = select(Indicador).where(Indicador.municipio_id == mun.id)
        if ano:
            stmt = stmt.where(Indicador.competencia.like(f"{ano}%"))
        res_ind = await db.execute(stmt)
        ind_list = res_ind.scalars().all()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    azul = colors.HexColor("#1565c0")
    cinza = colors.HexColor("#616161")
    vermelho = colors.HexColor("#c62828")
    verde = colors.HexColor("#2e7d32")
    amarelo_claro = colors.HexColor("#fff9c4")

    titulo_style = ParagraphStyle("titulo", parent=styles["Heading1"], textColor=azul, fontSize=16, spaceAfter=4)
    sub_style    = ParagraphStyle("sub",    parent=styles["Normal"],   textColor=cinza, fontSize=10, spaceAfter=12)
    sec_style    = ParagraphStyle("sec",    parent=styles["Heading2"], textColor=azul, fontSize=12, spaceBefore=14, spaceAfter=6)
    normal_style = styles["Normal"]

    def fmt_r(v: float) -> str:
        return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    elementos: list = []

    # ── Cabeçalho ────────────────────────────────────────────────────────────
    periodo_str = str(ano) if ano else "Todos os períodos"
    elementos.append(Paragraph("ERSUS 360 — Relatório Gerencial", titulo_style))
    elementos.append(Paragraph(
        f"Fundo Municipal de Saúde · {fin.municipio}/{fin.uf} · {periodo_str} · "
        f"Gerado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}",
        sub_style,
    ))
    elementos.append(HRFlowable(width="100%", thickness=2, color=azul, spaceAfter=12))

    # ── Resumo financeiro ────────────────────────────────────────────────────
    elementos.append(Paragraph("Resumo Financeiro", sec_style))
    resumo_data = [
        ["", "Valor"],
        ["Total Recebido (FNS)",        fmt_r(fin.total_recebido)],
        ["Total Pago",                  fmt_r(fin.total_pago)],
        ["Saldo Disponível",            fmt_r(fin.total_saldo)],
        ["Total Rendimentos",           fmt_r(fin.total_rendimento)],
    ]
    t_resumo = Table(resumo_data, colWidths=[10*cm, 6*cm])
    t_resumo.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, 0), azul),
        ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0e0")),
        ("ALIGN",       (1, 0), (1, -1), "RIGHT"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
    ]))
    elementos.append(t_resumo)
    elementos.append(Spacer(1, 14))

    # ── Convênios ────────────────────────────────────────────────────────────
    if fin.itens:
        elementos.append(Paragraph("Convênios FNS — Execução por Fonte", sec_style))
        header = ["Convênio", "Objeto", "Recebido", "Pago", "%"]
        rows = [header]
        for item in fin.itens:
            cor_bg = verde if item.perc_executado >= 75 else (amarelo_claro if item.perc_executado >= 50 else colors.HexColor("#ffebee"))
            rows.append([
                item.convenio,
                item.objeto[:45] + ("…" if len(item.objeto) > 45 else ""),
                fmt_r(item.valor_recebido),
                fmt_r(item.valor_pago),
                f"{item.perc_executado:.1f}%",
            ])
        t_conv = Table(rows, colWidths=[3*cm, 7*cm, 3*cm, 3*cm, 1.5*cm])
        t_conv.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0), azul),
            ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
            ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
            ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0e0")),
            ("ALIGN",       (2, 1), (-1, -1), "RIGHT"),
            ("LEFTPADDING",  (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING",   (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ]))
        elementos.append(t_conv)
        elementos.append(Spacer(1, 14))

    # ── Indicadores ──────────────────────────────────────────────────────────
    if ind_list:
        elementos.append(Paragraph("Indicadores PAS", sec_style))
        ind_header = ["Indicador", "Eixo", "Meta", "Alcançado", "Situação"]
        ind_rows = [ind_header]
        for ind in ind_list:
            sit_cor = verde if "ATING" in str(ind.situacao).upper() else (amarelo_claro if "ANDAMENTO" in str(ind.situacao).upper() else vermelho)
            ind_rows.append([
                ind.indicador[:50],
                ind.eixo[:20],
                f"{ind.meta_prevista:.0f}%",
                f"{ind.valor_alcancado:.0f}%",
                str(ind.situacao).replace("_", " ").title(),
            ])
        t_ind = Table(ind_rows, colWidths=[7*cm, 3.5*cm, 2*cm, 2.5*cm, 2.5*cm])
        t_ind.setStyle(TableStyle([
            ("BACKGROUND",  (0, 0), (-1, 0), azul),
            ("TEXTCOLOR",   (0, 0), (-1, 0), colors.white),
            ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",    (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
            ("GRID",        (0, 0), (-1, -1), 0.5, colors.HexColor("#e0e0e0")),
            ("ALIGN",       (2, 1), (3, -1), "CENTER"),
            ("LEFTPADDING",  (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING",   (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
        ]))
        elementos.append(t_ind)
        elementos.append(Spacer(1, 14))

    # ── Rodapé ───────────────────────────────────────────────────────────────
    elementos.append(HRFlowable(width="100%", thickness=0.5, color=cinza, spaceBefore=8))
    elementos.append(Paragraph(
        f"Documento gerado pelo ERSUS 360 · {datetime.now().strftime('%d/%m/%Y %H:%M')} · "
        f"Dados de referência — {fin.municipio}/{fin.uf}",
        ParagraphStyle("rodape", parent=normal_style, textColor=cinza, fontSize=7, alignment=1),
    ))

    doc.build(elementos)
    buf.seek(0)

    now_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"relatorio_gerencial_{fin.municipio}_{periodo_str}_{now_str}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
