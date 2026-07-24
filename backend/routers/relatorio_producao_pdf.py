"""
Gerador de PDF — Relatório de Produção ERSUS 360
reportlab multi-página A4
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
    PageBreak, KeepTogether,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

router = APIRouter(prefix="/api/relatorios", tags=["relatorios"])

# ── Paleta ────────────────────────────────────────────────────────────────────
AZUL       = colors.HexColor("#1e40af")
AZUL_L     = colors.HexColor("#dbeafe")
VERDE      = colors.HexColor("#166534")
VERDE_F    = colors.HexColor("#f0fdf4")
AMA_F      = colors.HexColor("#fffbeb")
AMA_T      = colors.HexColor("#92400e")
AMA_BRD    = colors.HexColor("#fde68a")
VER_F      = colors.HexColor("#fef2f2")
VER_T      = colors.HexColor("#b91c1c")
CINZA      = colors.HexColor("#6b7280")
CINZA_F    = colors.HexColor("#f9fafb")
CINZA_B    = colors.HexColor("#374151")
BORDA_F    = colors.HexColor("#f3f4f6")
BORDA_L    = colors.HexColor("#e5e7eb")
PRETO      = colors.HexColor("#111827")
BRANCO     = colors.white
G_VERDE    = colors.HexColor("#22c55e")
G_AMA      = colors.HexColor("#f59e0b")
G_VERM     = colors.HexColor("#ef4444")

MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
            "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]


def _gerado_em_pt() -> str:
    agora = datetime.now()
    return f"{agora.day:02d} de {MESES_PT[agora.month-1]} de {agora.year} às {agora.hour:02d}:{agora.minute:02d}"


# ── Estilos ───────────────────────────────────────────────────────────────────
def S(name="n", font="Helvetica", size=9, color=None, bold=False, align=TA_LEFT,
      before=0, after=0):
    return ParagraphStyle(
        name,
        fontName="Helvetica-Bold" if bold else font,
        fontSize=size,
        textColor=color or PRETO,
        alignment=align,
        spaceBefore=before,
        spaceAfter=after,
        leading=size * 1.3,
    )


# ── Status helpers ────────────────────────────────────────────────────────────
def _status_bg_txt(pct: float):
    if pct >= 75: return VERDE_F, VERDE
    if pct >= 50: return AMA_F,   AMA_T
    return VER_F, VER_T


def _status_label(pct: float) -> str:
    return "NORMAL" if pct >= 75 else "ATENÇÃO" if pct >= 50 else "CRÍTICO"


def _barra(pct: float, total_w_cm=3.8) -> Table:
    fill = min(pct / 100, 1.0) * total_w_cm
    rest = total_w_cm - fill
    cor  = G_VERDE if pct >= 75 else G_AMA if pct >= 50 else G_VERM
    t = Table([[""," "]], colWidths=[fill*cm, rest*cm], rowHeights=[0.3*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(0,0), cor),
        ("BACKGROUND", (1,0),(1,0), BORDA_L),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
    ]))
    return t


def _badge_status(pct: float) -> Table:
    bg, txt = _status_bg_txt(pct)
    lbl = _status_label(pct)
    t = Table([[Paragraph(f"<b>{lbl}</b>", S("bs", size=7, color=txt, align=TA_CENTER))]],
              colWidths=[1.55*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), bg),
        ("TOPPADDING",   (0,0),(-1,-1), 2),
        ("BOTTOMPADDING",(0,0),(-1,-1), 2),
        ("LEFTPADDING",  (0,0),(-1,-1), 3),
        ("RIGHTPADDING", (0,0),(-1,-1), 3),
        ("BOX", (0,0),(-1,-1), 0.3, txt),
    ]))
    return t


# ── Rodapé de página ─────────────────────────────────────────────────────────
def _footer(canvas, doc, gerado_em: str):
    canvas.saveState()
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(CINZA)
    w, _ = A4
    y = 0.9 * cm
    canvas.setStrokeColor(BORDA_L)
    canvas.line(doc.leftMargin, y + 0.35*cm, w - doc.rightMargin, y + 0.35*cm)
    canvas.drawString(doc.leftMargin, y,
                      f"ERSUS 360 · SMS Apuí/AM · IBGE 1300144 · Gerado em {gerado_em}")
    canvas.drawRightString(w - doc.rightMargin, y,
                           f"Página {canvas.getPageNumber()}")
    canvas.restoreState()


# ── Cabeçalho compacto (páginas 2+) ──────────────────────────────────────────
def _header_compact(W: float, gerado_em: str) -> Table:
    t = Table([[
        Paragraph("<b>ERSUS 360</b> · Sistema de Gestão em Saúde · Apuí/AM",
                  S("hc", size=8, color=PRETO)),
        Paragraph(f"CNPJ 12.834.320/0001-26 · IBGE 1300144<br/>Gerado em {gerado_em}",
                  S("hcr", size=7, color=CINZA, align=TA_RIGHT)),
    ]], colWidths=[W*0.55, W*0.45])
    t.setStyle(TableStyle([
        ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("LINEBELOW",    (0,0),(-1,0),  1, AZUL),
        ("BOTTOMPADDING",(0,0),(-1,0),  5),
    ]))
    return t


# ── Construir por_grupo a partir de por_tipo ──────────────────────────────────
def _build_por_grupo(por_tipo: list) -> list:
    grupos: dict[str, dict] = {}
    for t in por_tipo:
        g = t.get("grupo", "Outros")
        if g not in grupos:
            grupos[g] = {"grupo": g, "tipos": [], "total": 0}
        grupos[g]["tipos"].append(t)
        grupos[g]["total"] += int(t.get("realizado", 0))
    return list(grupos.values())


# ── Gerador principal ─────────────────────────────────────────────────────────
def gerar_pdf_producao(dados: dict, gerado_em: str) -> bytes:
    buf = io.BytesIO()
    cab = dados.get("cabecalho", {})

    # ── Dados para o PDF ──
    por_tipo  = dados.get("por_tipo", dados.get("por_tipo_ano", []))
    por_grupo = dados.get("por_grupo") or _build_por_grupo(por_tipo)
    por_prof  = dados.get("por_profissional", [])
    dias_list = dados.get("dias", [])
    resumo    = dados.get("resumo", {})

    total_at  = int(resumo.get("total", dados.get("total_atendimentos", 0)) or 0)
    # conta tipos: de por_tipo se disponível, senão soma todos os tipos dentro de por_grupo
    n_tipos   = len(por_tipo) if por_tipo else sum(len(g.get("tipos", [])) for g in por_grupo)
    dias_ut   = int(resumo.get("dias_uteis", dados.get("dias_uteis", 0)) or 0)
    n_profs   = int(resumo.get("n_profissionais", dados.get("profissionais_filtro", 0)) or 0)

    # ── Documento ──
    def _on_page(canvas, doc):
        _footer(canvas, doc, gerado_em)

    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=1.8*cm, rightMargin=1.8*cm,
        topMargin=1.4*cm,  bottomMargin=1.8*cm,
        title=cab.get("titulo", "Relatório de Produção"),
        author="ERSUS 360 · SMS Apuí/AM",
    )
    W = doc.width
    story = []

    # ══════════════════════════════════════════════════════════════════════════
    # PÁGINA 1 — CABEÇALHO + KPIs + TABELAS POR GRUPO
    # ══════════════════════════════════════════════════════════════════════════

    # Cabeçalho principal
    t_cab = Table([[
        Paragraph(
            "<b>ERSUS 360</b><br/>"
            "<font size='8' color='#6b7280'>SISTEMA DE GESTÃO EM SAÚDE · APUÍ / AM</font>",
            S("tt", size=14, color=AZUL, bold=True)
        ),
        Paragraph(
            "Fundo Municipal de Saúde de Apuí<br/>"
            "CNPJ: 12.834.320/0001-26 · IBGE: 1300144<br/>"
            f"Gerado em: {gerado_em}",
            S("tcr", size=8, color=CINZA, align=TA_RIGHT)
        ),
    ]], colWidths=[W*0.55, W*0.45])
    t_cab.setStyle(TableStyle([
        ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
        ("LEFTPADDING",  (0,0),(-1,-1), 0),
        ("RIGHTPADDING", (0,0),(-1,-1), 0),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("LINEBELOW",    (0,0),(-1,0),  2, AZUL),
        ("BOTTOMPADDING",(0,0),(-1,0),  6),
    ]))
    story.append(t_cab)
    story.append(Spacer(1, 0.25*cm))

    # Faixa de tipo/período
    t_faixa = Table([[
        Paragraph(f"RELATÓRIO — {cab.get('titulo','').upper()}",
                  S("f1", size=8, color=AZUL, bold=True)),
        Paragraph(
            f"Período de referência: <b>{cab.get('periodo','')}</b>  "
            f"Responsável: <b>{cab.get('gerado_por','Gestor Municipal de Saúde')}</b>",
            S("f2", size=8, color=CINZA_B)
        ),
    ]], colWidths=[W*0.38, W*0.62])
    t_faixa.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), AZUL_L),
        ("LEFTPADDING",  (0,0),(-1,-1), 8),
        ("RIGHTPADDING", (0,0),(-1,-1), 8),
        ("TOPPADDING",   (0,0),(-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
        ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
    ]))
    story.append(t_faixa)
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("Relatórios de Produção — Apuí/AM",
                            S("titulo", size=15, color=AZUL, bold=True)))
    eq_f  = cab.get("equipe_filtro","Todas as equipes")
    pf_f  = cab.get("profissional_filtro","Todos")
    story.append(Paragraph(
        f"ESF · ESB (Odontologia) · eMulti · {eq_f}"
        + (f" · {pf_f}" if pf_f != "Todos" else ""),
        S("sub", size=9, color=CINZA, after=6)
    ))

    # Aviso dados estimados
    t_av = Table([[
        Paragraph(
            "⚠  Dados Estimados (Meta/Parâmetros) — Produção calculada com base nos parâmetros "
            "de metas por CBO definidos no ERSUS 360. Para dados reais, importe o relatório "
            "do eSUS-PEC / SISAB.",
            S("av", size=8, color=AMA_T)
        )
    ]], colWidths=[W])
    t_av.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), AMA_F),
        ("BOX",          (0,0),(-1,-1), 0.5, AMA_BRD),
        ("LEFTPADDING",  (0,0),(-1,-1), 8),
        ("RIGHTPADDING", (0,0),(-1,-1), 8),
        ("TOPPADDING",   (0,0),(-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
    ]))
    story.append(t_av)
    story.append(Spacer(1, 0.35*cm))

    # ── KPIs (4 células lado a lado) ─────────────────────────────────────────
    def _kpi_table(label: str, value: str, sub: str) -> Table:
        t = Table([
            [Paragraph(label.upper(), S("kl", size=8, color=CINZA))],
            [Paragraph(f"<b>{value}</b>",  S("kv", size=20, color=PRETO))],
            [Paragraph(sub,                 S("ks", size=8, color=CINZA))],
        ], colWidths=[(W/4) - 0.3*cm])
        t.setStyle(TableStyle([
            ("BOX",          (0,0),(-1,-1), 0.5, BORDA_L),
            ("LINEABOVE",    (0,0),(-1,0),  2.5, AZUL),
            ("BACKGROUND",   (0,0),(-1,-1), CINZA_F),
            ("LEFTPADDING",  (0,0),(-1,-1), 10),
            ("RIGHTPADDING", (0,0),(-1,-1), 10),
            ("TOPPADDING",   (0,0),(-1,-1), 7),
            ("BOTTOMPADDING",(0,0),(-1,-1), 7),
        ]))
        return t

    periodo_str = cab.get("periodo", "—")
    kpi_cells = [
        _kpi_table("Total Atendimentos", f"{total_at:,}".replace(",","."), periodo_str),
        _kpi_table("Tipos Distintos",    str(n_tipos),    "tipos de atendimento"),
        _kpi_table("Dias Úteis",         str(dias_ut),    "dias com produção"),
        _kpi_table("Profissionais",      str(n_profs),    "no filtro"),
    ]
    kw = (W / 4) - 0.05*cm
    t_kpis = Table([kpi_cells], colWidths=[kw]*4, hAlign="LEFT")
    t_kpis.setStyle(TableStyle([
        ("LEFTPADDING",  (0,0),(-1,-1), 3),
        ("RIGHTPADDING", (0,0),(-1,-1), 3),
        ("TOPPADDING",   (0,0),(-1,-1), 0),
        ("BOTTOMPADDING",(0,0),(-1,-1), 0),
        ("VALIGN",       (0,0),(-1,-1), "TOP"),
    ]))
    story.append(t_kpis)
    story.append(Spacer(1, 0.5*cm))

    # ── Tabelas por grupo ─────────────────────────────────────────────────────
    CW = [W*0.29, W*0.09, W*0.09, W*0.26, W*0.10, W*0.17]

    TH = S("th", size=8, color=CINZA)
    THR = S("thr", size=8, color=CINZA, align=TA_RIGHT)

    for grp in por_grupo:
        grp_nome  = grp["grupo"]
        grp_total = int(grp["total"])
        tipos     = grp["tipos"]

        # Título do grupo
        t_grp = Table([[
            Paragraph(f"<b>{grp_nome}</b>", S("gn", size=11, color=AZUL, bold=True)),
            Paragraph(f"<b>{grp_total:,}".replace(",",".") + " atend.</b>",
                      S("gt", size=10, color=AZUL, bold=True, align=TA_RIGHT)),
        ]], colWidths=[W*0.7, W*0.3])
        t_grp.setStyle(TableStyle([
            ("VALIGN",       (0,0),(-1,-1), "BOTTOM"),
            ("LEFTPADDING",  (0,0),(-1,-1), 0),
            ("RIGHTPADDING", (0,0),(-1,-1), 0),
            ("TOPPADDING",   (0,0),(-1,-1), 10),
            ("BOTTOMPADDING",(0,0),(-1,-1), 3),
            ("LINEBELOW",    (0,0),(-1,0),  1.5, AZUL),
        ]))

        # Cabeçalho da tabela
        header = [
            Paragraph("Tipo de Atendimento", TH),
            Paragraph("Realizado",            THR),
            Paragraph("Meta Total",           THR),
            Paragraph("% Meta / Progresso",   TH),
            Paragraph("Méd/Dia",              THR),
            Paragraph("Status",               TH),
        ]

        rows = [header]
        for t in tipos:
            pct  = float(t.get("pct_meta", t.get("pct", 0)))
            real = int(t.get("realizado", 0))
            meta = int(t.get("meta_total", t.get("meta", 0)))
            med  = t.get("media_dia", 0)

            # célula barra + %
            barra_cel = Table([[
                _barra(pct),
                Paragraph(f" {pct:.1f}%", S("pct", size=8, color=PRETO)),
            ]], colWidths=[3.8*cm, 1.1*cm])
            barra_cel.setStyle(TableStyle([
                ("VALIGN",       (0,0),(-1,-1), "MIDDLE"),
                ("LEFTPADDING",  (0,0),(-1,-1), 0),
                ("RIGHTPADDING", (0,0),(-1,-1), 0),
                ("TOPPADDING",   (0,0),(-1,-1), 0),
                ("BOTTOMPADDING",(0,0),(-1,-1), 0),
            ]))

            rows.append([
                Paragraph(t.get("label",""), S("td", size=8, bold=True)),
                Paragraph(f"<b><font color='#1d4ed8'>{real:,}".replace(",",".") + "</font></b>",
                          S("tdr", size=9, bold=True, align=TA_RIGHT)),
                Paragraph(f"{meta:,}".replace(",","."),
                          S("tdc", size=8, color=CINZA, align=TA_RIGHT)),
                barra_cel,
                Paragraph(str(med), S("tdm", size=8, color=CINZA, align=TA_RIGHT)),
                _badge_status(pct),
            ])

        t_tipos = Table(rows, colWidths=CW, repeatRows=1)
        estilo_tipos = TableStyle([
            ("BACKGROUND",    (0,0),(-1,0),  CINZA_F),
            ("LINEBELOW",     (0,0),(-1,0),  0.5, colors.HexColor("#d1d5db")),
            ("ROWBACKGROUNDS",(0,1),(-1,-1), [BRANCO, CINZA_F]),
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
            ("LEFTPADDING",   (0,0),(-1,-1), 4),
            ("RIGHTPADDING",  (0,0),(-1,-1), 4),
            ("TOPPADDING",    (0,0),(-1,-1), 5),
            ("BOTTOMPADDING", (0,0),(-1,-1), 5),
        ])
        for i in range(1, len(rows)):
            estilo_tipos.add("LINEBELOW", (0,i),(-1,i), 0.2, BORDA_F)
        t_tipos.setStyle(estilo_tipos)

        story.append(KeepTogether([t_grp, t_tipos]))
        story.append(Spacer(1, 0.2*cm))

    # ── Tabela diária (se existir) ────────────────────────────────────────────
    dias_uteis_lista = [d for d in dias_list
                        if not d.get("is_futuro") and d.get("total") is not None]
    if dias_uteis_lista:
        story.append(PageBreak())
        story.append(_header_compact(W, gerado_em))
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph("Produção Diária",
                                S("pd", size=11, color=AZUL, bold=True, before=0, after=6)))

        rows_d = [[
            Paragraph("Dia",       TH),
            Paragraph("Data",      TH),
            Paragraph("Dia Sem.",  TH),
            Paragraph("Total",     THR),
            Paragraph("Acumulado", THR),
        ]]
        for d in dias_uteis_lista:
            acum = d.get("acumulado")
            rows_d.append([
                Paragraph(str(d["dia"]),  S("n", size=8)),
                Paragraph(d.get("data",""), S("n", size=8)),
                Paragraph(d.get("dia_semana",""), S("n", size=8, color=CINZA)),
                Paragraph(f"<b><font color='#1d4ed8'>{int(d['total']):,}".replace(",",".") + "</font></b>",
                          S("n", size=9, bold=True, align=TA_RIGHT)),
                Paragraph(f"{int(acum):,}".replace(",",".") if acum is not None else "—",
                          S("n", size=8, color=CINZA, align=TA_RIGHT)),
            ])
        t_d = Table(rows_d, colWidths=[W*0.08, W*0.12, W*0.12, W*0.18, W*0.18],
                    repeatRows=1, hAlign="LEFT")
        t_d.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,0),  CINZA_F),
            ("LINEBELOW",     (0,0),(-1,0),  0.5, colors.HexColor("#d1d5db")),
            ("ROWBACKGROUNDS",(0,1),(-1,-1), [BRANCO, CINZA_F]),
            ("LINEBELOW",     (0,1),(-1,-1), 0.2, BORDA_F),
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
            ("LEFTPADDING",   (0,0),(-1,-1), 5),
            ("RIGHTPADDING",  (0,0),(-1,-1), 5),
            ("TOPPADDING",    (0,0),(-1,-1), 4),
            ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ]))
        story.append(t_d)

    # ── Tabela por profissional ───────────────────────────────────────────────
    if por_prof:
        story.append(PageBreak())
        story.append(_header_compact(W, gerado_em))
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph("Produção por Profissional",
                                S("pp", size=11, color=AZUL, bold=True, before=0, after=6)))

        CWP = [W*0.04, W*0.24, W*0.17, W*0.16, W*0.12, W*0.11, W*0.16]
        rows_p = [[
            Paragraph("#",            TH),
            Paragraph("Profissional", TH),
            Paragraph("CBO",          TH),
            Paragraph("Equipe",       TH),
            Paragraph("Realizado",    THR),
            Paragraph("Meta",         THR),
            Paragraph("% Meta",       THR),
        ]]
        for i, p in enumerate(por_prof, 1):
            pct_p = float(p.get("pct_meta", p.get("pct", 0)))
            bg_p, txt_p = _status_bg_txt(pct_p)
            real_p = int(p.get("total", p.get("total_realizado", 0)) or 0)
            meta_p = int(p.get("meta", p.get("total_meta", 0)) or 0)
            rows_p.append([
                Paragraph(str(i), S("n", size=8, color=CINZA)),
                Paragraph(p.get("nome",""), S("n", size=8, bold=True)),
                Paragraph(p.get("cbo",""),  S("n", size=7, color=CINZA)),
                Paragraph(p.get("equipe",""), S("n", size=8)),
                Paragraph(f"<b><font color='#1d4ed8'>{real_p:,}".replace(",",".") + "</font></b>",
                          S("n", size=9, bold=True, align=TA_RIGHT)),
                Paragraph(f"{meta_p:,}".replace(",","."),
                          S("n", size=8, color=CINZA, align=TA_RIGHT)),
                Paragraph(
                    f"<b><font color='{txt_p.hexval() if hasattr(txt_p,'hexval') else '#166534'}'>"
                    f"{pct_p:.1f}%</font></b>",
                    S("n", size=8, bold=True, align=TA_RIGHT)
                ),
            ])
        t_p = Table(rows_p, colWidths=CWP, repeatRows=1)
        t_p.setStyle(TableStyle([
            ("BACKGROUND",    (0,0),(-1,0),  CINZA_F),
            ("LINEBELOW",     (0,0),(-1,0),  0.5, colors.HexColor("#d1d5db")),
            ("ROWBACKGROUNDS",(0,1),(-1,-1), [BRANCO, CINZA_F]),
            ("LINEBELOW",     (0,1),(-1,-1), 0.2, BORDA_F),
            ("VALIGN",        (0,0),(-1,-1), "MIDDLE"),
            ("LEFTPADDING",   (0,0),(-1,-1), 4),
            ("RIGHTPADDING",  (0,0),(-1,-1), 4),
            ("TOPPADDING",    (0,0),(-1,-1), 4),
            ("BOTTOMPADDING", (0,0),(-1,-1), 4),
        ]))
        story.append(t_p)

    # ── Assinaturas ───────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.5*cm))
    col = (W - 2*cm) / 2

    def _assin_col(cargo: str, nome: str) -> Table:
        t = Table([
            [Paragraph("", S("a"))],          # espaço para assinar
            [Paragraph("_" * 45, S("al", size=8, color=CINZA_B))],
            [Paragraph(f"<b>{cargo}</b>",  S("ac", size=8, color=CINZA_B, align=TA_CENTER))],
            [Paragraph(nome,               S("an", size=8, color=CINZA,   align=TA_CENTER))],
        ], colWidths=[col])
        t.setStyle(TableStyle([
            ("LEFTPADDING",  (0,0),(-1,-1), 0),
            ("RIGHTPADDING", (0,0),(-1,-1), 0),
            ("TOPPADDING",   (0,0),(-1,-1), 1),
            ("BOTTOMPADDING",(0,0),(-1,-1), 1),
            ("ALIGN",        (0,0),(-1,-1), "CENTER"),
        ]))
        return t

    t_assin = Table([[
        _assin_col("Secretário(a) Municipal de Saúde",
                   "Secretaria Municipal de Saúde — Apuí/AM"),
        Spacer(2*cm, 1),
        _assin_col("Responsável pelo Monitoramento APS",
                   "Departamento de Atenção Básica — FMS"),
    ]], colWidths=[col, 2*cm, col])
    t_assin.setStyle(TableStyle([
        ("VALIGN",      (0,0),(-1,-1), "TOP"),
        ("LEFTPADDING", (0,0),(-1,-1), 0),
        ("RIGHTPADDING",(0,0),(-1,-1), 0),
    ]))
    story.append(t_assin)

    # ── Build ─────────────────────────────────────────────────────────────────
    doc.build(story, onFirstPage=_on_page, onLaterPages=_on_page)
    buf.seek(0)
    return buf.read()


# ── Endpoint ──────────────────────────────────────────────────────────────────
@router.get("/gerar-pdf")
async def gerar_pdf_endpoint(
    tipo:            str = Query(default="mensal"),
    mes:             int = Query(default=None),
    ano:             int = Query(default=None),
    dia:             int = Query(default=None),
    equipe:          Optional[str] = Query(default=None),
    tipo_equipe:     Optional[str] = Query(default=None),
    profissional_id: Optional[str] = Query(default=None),
):
    from routers.relatorio_producao import gerar_relatorio

    hoje = date.today()
    if not mes: mes = hoje.month
    if not ano: ano = hoje.year
    if not dia: dia = hoje.day

    dados = await gerar_relatorio(
        tipo=tipo, dia=dia, mes=mes, ano=ano,
        equipe=equipe, tipo_equipe=tipo_equipe, profissional_id=profissional_id,
    )

    gerado_em = _gerado_em_pt()
    pdf_bytes = gerar_pdf_producao(dados, gerado_em)

    cab   = dados.get("cabecalho", {})
    per   = cab.get("periodo", f"{mes:02d}-{ano}").replace("/","-")
    fname = f"ERSUS360_Producao_{per}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )
