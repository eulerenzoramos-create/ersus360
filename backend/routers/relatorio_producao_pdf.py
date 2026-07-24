"""
Gerador de PDF — Relatório de Produção ERSUS 360
Usa reportlab para gerar PDF multi-página completo
"""
from __future__ import annotations
import io
from datetime import date, datetime
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from typing import Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

router = APIRouter(prefix="/api/relatorios", tags=["relatorios"])

# ── Paleta ────────────────────────────────────────────────────────────────────
AZUL      = colors.HexColor("#1e40af")
AZUL_CLARO= colors.HexColor("#dbeafe")
VERDE     = colors.HexColor("#166534")
VERDE_FUNDO=colors.HexColor("#f0fdf4")
AMARELO_F = colors.HexColor("#fffbeb")
AMARELO_B = colors.HexColor("#92400e")
VERMELHO_F= colors.HexColor("#fef2f2")
VERMELHO_B= colors.HexColor("#b91c1c")
CINZA     = colors.HexColor("#6b7280")
CINZA_F   = colors.HexColor("#f9fafb")
CINZA_B   = colors.HexColor("#374151")
PRETO     = colors.HexColor("#111827")
BRANCO    = colors.white
VERDE_BARRA   = colors.HexColor("#22c55e")
AMARELO_BARRA = colors.HexColor("#f59e0b")
VERMELHO_BARRA= colors.HexColor("#ef4444")


# ── Estilos ───────────────────────────────────────────────────────────────────
def _estilos():
    return {
        "titulo": ParagraphStyle("titulo", fontName="Helvetica-Bold",   fontSize=16, textColor=AZUL,   spaceAfter=2),
        "subtit": ParagraphStyle("subtit", fontName="Helvetica",        fontSize=9,  textColor=CINZA,  spaceAfter=6),
        "grupo":  ParagraphStyle("grupo",  fontName="Helvetica-Bold",   fontSize=11, textColor=AZUL,   spaceBefore=12, spaceAfter=4),
        "normal": ParagraphStyle("normal", fontName="Helvetica",        fontSize=9,  textColor=PRETO),
        "bold9":  ParagraphStyle("bold9",  fontName="Helvetica-Bold",   fontSize=9,  textColor=PRETO),
        "small":  ParagraphStyle("small",  fontName="Helvetica",        fontSize=8,  textColor=CINZA),
        "center": ParagraphStyle("center", fontName="Helvetica",        fontSize=9,  alignment=TA_CENTER),
        "right":  ParagraphStyle("right",  fontName="Helvetica",        fontSize=9,  alignment=TA_RIGHT),
        "aviso":  ParagraphStyle("aviso",  fontName="Helvetica",        fontSize=8,  textColor=AMARELO_B),
        "assin":  ParagraphStyle("assin",  fontName="Helvetica-Bold",   fontSize=8,  textColor=CINZA_B, alignment=TA_CENTER),
        "assin2": ParagraphStyle("assin2", fontName="Helvetica",        fontSize=8,  textColor=CINZA,   alignment=TA_CENTER),
        "cab_dir":ParagraphStyle("cab_dir",fontName="Helvetica",        fontSize=8,  textColor=CINZA,   alignment=TA_RIGHT),
        "cab_neg":ParagraphStyle("cab_neg",fontName="Helvetica-Bold",   fontSize=8,  textColor=CINZA_B, alignment=TA_RIGHT),
    }


def _status_style(pct: float):
    if pct >= 75:
        return (VERDE_FUNDO, VERDE)
    elif pct >= 50:
        return (AMARELO_F, AMARELO_B)
    else:
        return (VERMELHO_F, VERMELHO_B)


def _status_label(pct: float) -> str:
    return "NORMAL" if pct >= 75 else "ATENÇÃO" if pct >= 50 else "CRÍTICO"


def _barra_pct(pct: float) -> Table:
    """Célula com barra de progresso visual."""
    total_w = 3.8 * cm
    fill_w  = min(pct / 100, 1.0) * total_w
    cor = VERDE_BARRA if pct >= 75 else AMARELO_BARRA if pct >= 50 else VERMELHO_BARRA
    barra = Table(
        [["", ""]],
        colWidths=[fill_w, total_w - fill_w],
        rowHeights=[0.35 * cm],
    )
    barra.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), cor),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#e5e7eb")),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING",   (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
        ("ROUNDEDCORNERS", [3]),
    ]))
    return barra


# ── Número de páginas (canvas callback) ──────────────────────────────────────
class _NumberedCanvas:
    """Injeta rodapé com número de página em cada folha."""
    def __init__(self, filename):
        from reportlab.pdfgen import canvas as rl_canvas
        self._doc  = None
        self._pages = []

    @staticmethod
    def _footer(canvas, doc, gerado_em: str):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(CINZA)
        w, h = A4
        y = 1.0 * cm
        canvas.line(doc.leftMargin, y + 0.4 * cm, w - doc.rightMargin, y + 0.4 * cm)
        canvas.drawString(doc.leftMargin, y, f"ERSUS 360 · SMS Apuí/AM · IBGE 1300144 · Gerado em {gerado_em}")
        canvas.drawRightString(w - doc.rightMargin, y, f"Página {canvas.getPageNumber()}")
        canvas.restoreState()


# ── Cabeçalho de página (no topo de cada página após a 1ª) ───────────────────
def _header_flowable(E, gerado_em: str):
    """Cabeçalho compacto repetido em páginas > 1."""
    data = [[
        Paragraph("<b>ERSUS 360</b> · Sistema de Gestão em Saúde · Apuí/AM", E["normal"]),
        Paragraph(f"CNPJ 12.834.320/0001-26 · IBGE 1300144<br/>Gerado em {gerado_em}", E["cab_dir"]),
    ]]
    t = Table(data, colWidths=[10 * cm, 8.7 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("LINEBELOW", (0, 0), (-1, 0), 1, AZUL),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


# ── Gerador principal ─────────────────────────────────────────────────────────
def gerar_pdf_producao(dados: dict, gerado_em: str) -> bytes:
    buf = io.BytesIO()
    E   = _estilos()
    cab = dados.get("cabecalho", {})
    MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

    def on_page(canvas, doc):
        _NumberedCanvas._footer(canvas, doc, gerado_em)

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=1.8 * cm, rightMargin=1.8 * cm,
        topMargin=1.5 * cm,  bottomMargin=2.0 * cm,
        title=cab.get("titulo", "Relatório de Produção"),
        author="ERSUS 360 · SMS Apuí/AM",
    )

    story = []
    W = doc.width  # largura útil

    # ── CABEÇALHO DA PRIMEIRA PÁGINA ─────────────────────────────────────────
    cabecalho_data = [[
        Paragraph(
            "<b>ERSUS 360</b><br/>"
            "<font size='8' color='#6b7280'>SISTEMA DE GESTÃO EM SAÚDE · APUÍ / AM</font>",
            E["titulo"]
        ),
        Paragraph(
            "Fundo Municipal de Saúde de Apuí<br/>"
            f"CNPJ: 12.834.320/0001-26 · IBGE: 1300144<br/>"
            f"Gerado em: {gerado_em}",
            E["cab_dir"]
        ),
    ]]
    t_cab = Table(cabecalho_data, colWidths=[W * 0.55, W * 0.45])
    t_cab.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("LINEBELOW", (0, 0), (-1, 0), 2, AZUL),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
    ]))
    story.append(t_cab)
    story.append(Spacer(1, 0.3 * cm))

    # Faixa azul com tipo de relatório e período
    faixa_data = [[
        Paragraph(f"RELATÓRIO — {cab.get('titulo','').upper()}", ParagraphStyle("fx", fontName="Helvetica-Bold", fontSize=8, textColor=AZUL)),
        Paragraph(
            f"Período de referência: <b>{cab.get('periodo','')}</b>&nbsp;&nbsp;"
            f"Responsável: <b>{cab.get('gerado_por','Gestor Municipal de Saúde')}</b>",
            ParagraphStyle("fx2", fontName="Helvetica", fontSize=8, textColor=CINZA_B)
        ),
    ]]
    t_faixa = Table(faixa_data, colWidths=[W * 0.4, W * 0.6])
    t_faixa.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AZUL_CLARO),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [4]),
    ]))
    story.append(t_faixa)
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph(f"Relatórios de Produção — Apuí/AM", E["titulo"]))
    eq_filtro = cab.get("equipe_filtro", "Todas as equipes")
    prof_filtro = cab.get("profissional_filtro", "Todos")
    story.append(Paragraph(
        f"ESF · ESB (Odontologia) · eMulti · {eq_filtro}"
        + (f" · {prof_filtro}" if prof_filtro != "Todos" else ""),
        E["subtit"]
    ))
    story.append(Spacer(1, 0.3 * cm))

    # ── AVISO DADOS ESTIMADOS ─────────────────────────────────────────────────
    t_aviso = Table([[
        Paragraph(
            "⚠  Dados Estimados (Meta/Parâmetros) — Produção calculada com base nos parâmetros de metas "
            "por CBO definidos no ERSUS 360. Para dados reais, importe o relatório do eSUS-PEC / SISAB.",
            E["aviso"]
        )
    ]], colWidths=[W])
    t_aviso.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), AMARELO_F),
        ("LEFTPADDING",  (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING",   (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 5),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#fde68a")),
    ]))
    story.append(t_aviso)
    story.append(Spacer(1, 0.4 * cm))

    # ── KPIs ─────────────────────────────────────────────────────────────────
    resumo = dados.get("resumo", {})
    total_at  = resumo.get("total", dados.get("total_atendimentos", 0))
    n_tipos   = len(dados.get("por_tipo", dados.get("por_tipo_ano", [])))
    dias_ut   = resumo.get("dias_uteis", dados.get("dias_uteis", 0))
    n_profs   = resumo.get("n_profissionais", dados.get("profissionais_filtro", 0))
    media_dia = resumo.get("media_dia", 0)

    kpi_style = TableStyle([
        ("BOX",        (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
        ("LINEABOVE",  (0, 0), (-1, 0),  2,   AZUL),
        ("BACKGROUND", (0, 0), (-1, -1), CINZA_F),
        ("LEFTPADDING",  (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING",   (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",(0, 0), (-1, -1), 6),
        ("ROUNDEDCORNERS", [4]),
    ])

    def kpi_cell(label, value, sub=""):
        return [
            Paragraph(f"<font size='8' color='#6b7280'>{label.upper()}</font>", E["small"]),
            Paragraph(f"<b><font size='20'>{value}</font></b>", E["normal"]),
            Paragraph(f"<font size='8' color='#9ca3af'>{sub}</font>", E["small"]) if sub else Spacer(1, 2),
        ]

    kpis = [
        kpi_cell("Total Atendimentos", f"{total_at:,}".replace(",","."), cab.get("periodo","Julho/2026")),
        kpi_cell("Tipos Distintos",    str(n_tipos),   "tipos de atendimento"),
        kpi_cell("Dias Úteis",         str(dias_ut),   "dias com produção"),
        kpi_cell("Profissionais",       str(n_profs),   "no filtro"),
    ]
    kw = W / 4 - 0.15 * cm
    t_kpi = Table(
        [[Table([k], colWidths=[kw], rowHeights=None) for k in kpis]],
        colWidths=[kw + 0.15 * cm] * 4,
    )
    for i, cell_tbl in enumerate([[Table([k], colWidths=[kw]) for k in kpis]]):
        pass
    # Tabela de KPIs lado a lado
    kpi_rows = []
    for k in kpis:
        inner = Table([k], colWidths=[kw])
        inner.setStyle(kpi_style)
        kpi_rows.append(inner)
    t_kpi2 = Table([kpi_rows], colWidths=[kw + 0.1*cm] * 4, hAlign="LEFT")
    t_kpi2.setStyle(TableStyle([
        ("LEFTPADDING",  (0, 0), (-1, -1), 2),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(t_kpi2)
    story.append(Spacer(1, 0.5 * cm))

    # ── TABELA POR GRUPO ─────────────────────────────────────────────────────
    por_grupo = dados.get("por_grupo", [])

    # Cabeçalho de coluna da tabela de tipos
    col_header = ["Tipo de Atendimento", "Realizado", "Meta Total", "% Meta / Progresso", "Média/Dia", "Status"]
    col_widths  = [W * 0.30, W * 0.09, W * 0.09, W * 0.28, W * 0.09, W * 0.15]

    for grupo_item in por_grupo:
        grp_nome  = grupo_item["grupo"]
        grp_total = grupo_item["total"]
        tipos     = grupo_item["tipos"]

        # Título do grupo
        grp_data = [[
            Paragraph(f"<b>{grp_nome}</b>", E["grupo"]),
            Paragraph(f"<b>{grp_total:,}".replace(",",".") + " atend.</b>",
                      ParagraphStyle("grd", fontName="Helvetica-Bold", fontSize=10, textColor=AZUL, alignment=TA_RIGHT)),
        ]]
        t_grp = Table(grp_data, colWidths=[W * 0.7, W * 0.3])
        t_grp.setStyle(TableStyle([
            ("LEFTPADDING",  (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 3),
            ("LINEBELOW", (0, 0), (-1, 0), 1.5, AZUL),
            ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ]))
        story.append(t_grp)

        # Cabeçalho das colunas
        header_row = [
            Paragraph(col_header[0], ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA)),
            Paragraph(col_header[1], ParagraphStyle("thr", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
            Paragraph(col_header[2], ParagraphStyle("thr", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
            Paragraph(col_header[3], ParagraphStyle("th",  fontName="Helvetica-Bold", fontSize=8, textColor=CINZA)),
            Paragraph(col_header[4], ParagraphStyle("thr", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
            Paragraph(col_header[5], ParagraphStyle("th",  fontName="Helvetica-Bold", fontSize=8, textColor=CINZA)),
        ]

        rows = [header_row]
        for t in tipos:
            pct  = float(t.get("pct_meta", t.get("pct", 0)))
            bg_s, txt_s = _status_style(pct)
            lbl   = _status_label(pct)
            real  = int(t.get("realizado", 0))
            meta  = int(t.get("meta_total", t.get("meta", 0)))
            media = t.get("media_dia", 0)

            # Badge de status como mini-tabela colorida
            badge = Table([[Paragraph(f"<b>{lbl}</b>", ParagraphStyle("bs", fontName="Helvetica-Bold", fontSize=7, textColor=txt_s, alignment=TA_CENTER))]],
                          colWidths=[1.5 * cm])
            badge.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), bg_s),
                ("TOPPADDING",   (0, 0), (-1, -1), 1),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 1),
                ("LEFTPADDING",  (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("ROUNDEDCORNERS", [3]),
            ]))

            # Célula de barra
            barra_cell = Table([[
                _barra_pct(pct),
                Paragraph(f" {pct:.1f}%", ParagraphStyle("pct", fontName="Helvetica", fontSize=8, textColor=PRETO)),
            ]], colWidths=[3.8 * cm, 1.0 * cm])
            barra_cell.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING",  (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING",   (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 0),
            ]))

            rows.append([
                Paragraph(t.get("label", ""), ParagraphStyle("td", fontName="Helvetica-Bold", fontSize=8, textColor=PRETO)),
                Paragraph(f"<b><font color='#1d4ed8'>{real:,}".replace(",",".") + "</font></b>",
                          ParagraphStyle("tdr", fontName="Helvetica-Bold", fontSize=9, alignment=TA_RIGHT)),
                Paragraph(f"{meta:,}".replace(",","."),
                          ParagraphStyle("tdr", fontName="Helvetica", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
                barra_cell,
                Paragraph(str(media), ParagraphStyle("tdr", fontName="Helvetica", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
                badge,
            ])

        t_tipos = Table(rows, colWidths=col_widths, repeatRows=1)
        ts = [
            ("BACKGROUND", (0, 0), (-1, 0), CINZA_F),
            ("LINEBELOW",  (0, 0), (-1, 0), 0.5, colors.HexColor("#d1d5db")),
            ("LINEBELOW",  (0, -1), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING",  (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING",   (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BRANCO, CINZA_F]),
        ]
        for i in range(1, len(rows)):
            ts.append(("LINEBELOW", (0, i), (-1, i), 0.3, colors.HexColor("#f3f4f6")))
        t_tipos.setStyle(TableStyle(ts))
        story.append(KeepTogether([t_tipos, Spacer(1, 0.3 * cm)]))

    # ── TABELA DIÁRIA (se existir) ────────────────────────────────────────────
    dias_list = dados.get("dias")
    if dias_list:
        story.append(PageBreak())
        story.append(_header_flowable(E, gerado_em))
        story.append(Spacer(1, 0.3 * cm))
        story.append(Paragraph("Produção Diária", E["grupo"]))

        dias_filtrados = [d for d in dias_list if not d.get("is_futuro") and d.get("total") is not None]
        if dias_filtrados:
            rows_d = [[
                Paragraph("Dia",        ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA)),
                Paragraph("Data",       ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA)),
                Paragraph("Dia Sem.",   ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA)),
                Paragraph("Total",      ParagraphStyle("thr", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
                Paragraph("Acumulado",  ParagraphStyle("thr", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
            ]]
            for d in dias_filtrados:
                rows_d.append([
                    Paragraph(str(d["dia"]), E["normal"]),
                    Paragraph(d.get("data",""), E["normal"]),
                    Paragraph(d.get("dia_semana",""), E["small"]),
                    Paragraph(f"{d['total']:,}".replace(",","."),
                              ParagraphStyle("tdr", fontName="Helvetica-Bold", fontSize=9, textColor=AZUL, alignment=TA_RIGHT)),
                    Paragraph(f"{d.get('acumulado',0):,}".replace(",","."),
                              ParagraphStyle("tdr", fontName="Helvetica", fontSize=8, textColor=CINZA, alignment=TA_RIGHT))
                    if d.get("acumulado") is not None else Paragraph("—", E["small"]),
                ])
            t_dias = Table(rows_d, colWidths=[W*0.1, W*0.12, W*0.12, W*0.18, W*0.18], repeatRows=1, hAlign="LEFT")
            t_dias.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), CINZA_F),
                ("LINEBELOW",  (0, 0), (-1, 0), 0.5, colors.HexColor("#d1d5db")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BRANCO, CINZA_F]),
                ("LINEBELOW",  (0, 1), (-1, -1), 0.3, colors.HexColor("#f3f4f6")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING",  (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING",   (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING",(0, 0), (-1, -1), 4),
            ]))
            story.append(t_dias)
        story.append(Spacer(1, 0.4 * cm))

    # ── TABELA POR PROFISSIONAL ───────────────────────────────────────────────
    por_prof = dados.get("por_profissional", [])
    if por_prof:
        story.append(PageBreak())
        story.append(_header_flowable(E, gerado_em))
        story.append(Spacer(1, 0.3 * cm))
        story.append(Paragraph("Produção por Profissional", E["grupo"]))

        rows_p = [[
            Paragraph("#",          ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA)),
            Paragraph("Profissional",ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA)),
            Paragraph("CBO",        ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA)),
            Paragraph("Equipe",     ParagraphStyle("th", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA)),
            Paragraph("Realizado",  ParagraphStyle("thr", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
            Paragraph("Meta",       ParagraphStyle("thr", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
            Paragraph("% Meta",     ParagraphStyle("thr", fontName="Helvetica-Bold", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
        ]]

        for i, p in enumerate(por_prof, 1):
            pct_p = float(p.get("pct_meta", p.get("pct", 0)))
            cor_pct = "#166534" if pct_p >= 75 else "#92400e" if pct_p >= 50 else "#b91c1c"
            rows_p.append([
                Paragraph(str(i), E["small"]),
                Paragraph(p.get("nome",""), ParagraphStyle("tdp", fontName="Helvetica-Bold", fontSize=8, textColor=PRETO)),
                Paragraph(p.get("cbo",""), E["small"]),
                Paragraph(p.get("equipe",""), E["small"]),
                Paragraph(f"<b>{int(p.get('total', p.get('total_realizado', 0))):,}".replace(",",".") + "</b>",
                          ParagraphStyle("tdr", fontName="Helvetica-Bold", fontSize=8, textColor=AZUL, alignment=TA_RIGHT)),
                Paragraph(f"{int(p.get('meta', p.get('total_meta', 0))):,}".replace(",","."),
                          ParagraphStyle("tdr", fontName="Helvetica", fontSize=8, textColor=CINZA, alignment=TA_RIGHT)),
                Paragraph(f"<font color='{cor_pct}'><b>{pct_p:.1f}%</b></font>",
                          ParagraphStyle("tdr", fontName="Helvetica-Bold", fontSize=8, alignment=TA_RIGHT)),
            ])

        cw_p = [W*0.04, W*0.24, W*0.17, W*0.16, W*0.12, W*0.12, W*0.15]
        t_prof = Table(rows_p, colWidths=cw_p, repeatRows=1)
        t_prof.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), CINZA_F),
            ("LINEBELOW",  (0, 0), (-1, 0), 0.5, colors.HexColor("#d1d5db")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [BRANCO, CINZA_F]),
            ("LINEBELOW",  (0, 1), (-1, -1), 0.3, colors.HexColor("#f3f4f6")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING",  (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING",   (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 3),
        ]))
        story.append(t_prof)
        story.append(Spacer(1, 0.5 * cm))

    # ── ASSINATURAS ──────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.2 * cm))
    assin_data = [[
        Table([[
            HRFlowable(width=6 * cm, color=CINZA_B, thickness=0.5),
            Paragraph("Secretário(a) Municipal de Saúde", E["assin"]),
            Paragraph("Secretaria Municipal de Saúde — Apuí/AM", E["assin2"]),
        ]], colWidths=[6 * cm]),
        Spacer(1, 1),
        Table([[
            HRFlowable(width=6 * cm, color=CINZA_B, thickness=0.5),
            Paragraph("Responsável pelo Monitoramento APS", E["assin"]),
            Paragraph("Departamento de Atenção Básica — FMS", E["assin2"]),
        ]], colWidths=[6 * cm]),
    ]]
    t_assin = Table(assin_data, colWidths=[W * 0.45, W * 0.1, W * 0.45])
    t_assin.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",  (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(t_assin)

    # ── BUILD ─────────────────────────────────────────────────────────────────
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    buf.seek(0)
    return buf.read()


# ── Endpoint ──────────────────────────────────────────────────────────────────
@router.get("/gerar-pdf")
async def gerar_pdf_endpoint(
    tipo: str = Query(default="mensal"),
    mes:  int = Query(default=None),
    ano:  int = Query(default=None),
    dia:  int = Query(default=None),
    equipe:          Optional[str] = Query(default=None),
    tipo_equipe:     Optional[str] = Query(default=None),
    profissional_id: Optional[str] = Query(default=None),
):
    """Gera e retorna PDF completo multi-página do relatório de produção."""
    from routers.relatorio_producao import gerar_relatorio

    hoje = date.today()
    if not mes: mes = hoje.month
    if not ano: ano = hoje.year
    if not dia: dia = hoje.day

    dados = await gerar_relatorio(
        tipo=tipo, dia=dia, mes=mes, ano=ano,
        equipe=equipe, tipo_equipe=tipo_equipe, profissional_id=profissional_id,
    )

    gerado_em = datetime.now().strftime("%d de %B de %Y às %H:%M").lower()
    # Capitaliza o mês
    meses = ["janeiro","fevereiro","março","abril","maio","junho",
             "julho","agosto","setembro","outubro","novembro","dezembro"]
    for m in meses:
        gerado_em = gerado_em.replace(m, m.capitalize())

    pdf_bytes = gerar_pdf_producao(dados, gerado_em)

    cab   = dados.get("cabecalho", {})
    per   = cab.get("periodo", f"{mes:02d}-{ano}").replace("/","-")
    fname = f"ERSUS360_Producao_{per}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )
