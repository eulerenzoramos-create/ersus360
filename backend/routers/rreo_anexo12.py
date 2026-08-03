"""
RREO - ANEXO 12 (LC 141/2012, art. 35)
Demonstrativo das Receitas e Despesas com ASPS
Apuí/AM · 1º Bimestre 2026 · Homologado SIOPS 29/04/2026
Dados reais conforme documento oficial assinado digitalmente por ROSANGELA MOTTER
"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/rreo-anexo12", tags=["RREO Anexo 12"])

# ── DADOS REAIS — HOMOLOGADO SIOPS 29/04/2026 ────────────────────────────────

_META = {
    "uf": "Amazonas",
    "municipio": "Apuí",
    "exercicio": 2026,
    "bimestre": 1,
    "periodo": "Janeiro e Fevereiro de 2026",
    "fonte": "SIOPS, Apuí",
    "homologado_em": "2026-04-29T10:15:25-04:00",
    "responsavel": "ROSANGELA MOTTER:34130047272",
    "anexo": "RREO - ANEXO 12 (LC141/2012, art.35)",
    "unidade": "R$ 1,00",
}

# SEÇÃO 1 — Receitas Resultantes de Impostos e Transferências
_RECEITAS = {
    "impostos": {
        "label": "RECEITA DE IMPOSTOS (I)",
        "prev_ini": 2_929_000.00,
        "prev_atu": 2_929_000.00,
        "realizada": 882_982.66,
        "pct": 30.15,
        "itens": [
            {"desc": "Receita Resultante do Imposto Predial e Territorial Urbano - IPTU",
             "prev_ini": 189_000.00, "prev_atu": 189_000.00, "realizada": 4_504.13, "pct": 2.38},
            {"desc": "Receita Resultante do Imposto sobre Transmissão Inter Vivos - ITBI",
             "prev_ini": 10_000.00, "prev_atu": 10_000.00, "realizada": 131_306.41, "pct": 1_313.06},
            {"desc": "Receita Resultante do Imposto sobre Serviços de Qualquer Natureza - ISS",
             "prev_ini": 1_050_000.00, "prev_atu": 1_050_000.00, "realizada": 217_173.14, "pct": 20.68},
            {"desc": "Receita Resultante do Imposto sobre a Renda e Proventos de Qualquer Natureza Retido na Fonte - IRRF",
             "prev_ini": 1_680_000.00, "prev_atu": 1_680_000.00, "realizada": 529_998.98, "pct": 31.55},
        ],
    },
    "transferencias": {
        "label": "RECEITA DE TRANSFERÊNCIAS CONSTITUCIONAIS E LEGAIS (II)",
        "prev_ini": 46_184_355.00,
        "prev_atu": 46_184_355.00,
        "realizada": 9_355_124.43,
        "pct": 20.26,
        "itens": [
            {"desc": "Cota-Parte FPM", "prev_ini": 26_250_000.00, "prev_atu": 26_250_000.00, "realizada": 6_516_517.50, "pct": 24.82},
            {"desc": "Cota-Parte ITR", "prev_ini": 3_150.00, "prev_atu": 3_150.00, "realizada": 388.51, "pct": 12.33},
            {"desc": "Cota-Parte do IPVA", "prev_ini": 1_602_825.00, "prev_atu": 1_602_825.00, "realizada": 132_623.06, "pct": 8.27},
            {"desc": "Cota-Parte do ICMS", "prev_ini": 18_277_035.00, "prev_atu": 18_277_035.00, "realizada": 2_698_536.75, "pct": 14.76},
            {"desc": "Cota-Parte do IPI - Exportação", "prev_ini": 51_345.00, "prev_atu": 51_345.00, "realizada": 7_058.61, "pct": 13.75},
            {"desc": "Compensações Financeiras Provenientes de Impostos e Transferências Constitucionais",
             "prev_ini": 0.00, "prev_atu": 0.00, "realizada": 0.00, "pct": 0.00},
        ],
    },
    "total": {
        "label": "TOTAL DAS RECEITAS RESULTANTES DE IMPOSTOS E TRANSFERÊNCIAS CONSTITUCIONAIS E LEGAIS - (III) = (I) + (II)",
        "prev_ini": 49_113_355.00,
        "prev_atu": 49_113_355.00,
        "realizada": 10_238_107.09,
        "pct": 20.85,
    },
}

# SEÇÃO 2 — Despesas com ASPS por Subfunção
_DESPESAS_ASPS = [
    {
        "id": "IV", "label": "ATENÇÃO BÁSICA (IV)",
        "dot_ini": 1_603_000.00, "dot_atu": 1_655_250.00,
        "emp": 1_379_663.41, "emp_pct": 83.35,
        "liq": 320_700.60, "liq_pct": 19.37,
        "pago": 312_746.29, "pago_pct": 18.89,
        "rp_np": 1_058_962.81,
        "sub": [
            {"desc": "Despesas Correntes", "dot_ini": 1_513_000, "dot_atu": 1_565_250,
             "emp": 1_379_663.41, "emp_pct": 88.14, "liq": 320_700.60, "liq_pct": 20.49,
             "pago": 312_746.29, "pago_pct": 19.98, "rp_np": 1_058_962.81},
            {"desc": "Despesas de Capital", "dot_ini": 90_000, "dot_atu": 90_000,
             "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0},
        ],
    },
    {
        "id": "V", "label": "ASSISTÊNCIA HOSPITALAR E AMBULATORIAL (V)",
        "dot_ini": 2_833_000.00, "dot_atu": 2_833_000.00,
        "emp": 407_095.06, "emp_pct": 14.37,
        "liq": 157_480.97, "liq_pct": 5.56,
        "pago": 127_345.97, "pago_pct": 4.50,
        "rp_np": 249_614.09,
        "sub": [
            {"desc": "Despesas Correntes", "dot_ini": 2_773_000, "dot_atu": 2_773_000,
             "emp": 407_095.06, "emp_pct": 14.68, "liq": 157_480.97, "liq_pct": 5.68,
             "pago": 127_345.97, "pago_pct": 4.59, "rp_np": 249_614.09},
            {"desc": "Despesas de Capital", "dot_ini": 60_000, "dot_atu": 60_000,
             "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0},
        ],
    },
    {
        "id": "VI", "label": "SUPORTE PROFILÁTICO E TERAPÊUTICO (VI)",
        "dot_ini": 110_000.00, "dot_atu": 57_750.00,
        "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0,
        "sub": [
            {"desc": "Despesas Correntes", "dot_ini": 100_000, "dot_atu": 47_750,
             "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0},
            {"desc": "Despesas de Capital", "dot_ini": 10_000, "dot_atu": 10_000,
             "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0},
        ],
    },
    {
        "id": "VII", "label": "VIGILÂNCIA SANITÁRIA (VII)",
        "dot_ini": 20_000.00, "dot_atu": 20_000.00,
        "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0,
        "sub": [
            {"desc": "Despesas Correntes", "dot_ini": 10_000, "dot_atu": 10_000,
             "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0},
            {"desc": "Despesas de Capital", "dot_ini": 10_000, "dot_atu": 10_000,
             "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0},
        ],
    },
    {
        "id": "VIII", "label": "VIGILÂNCIA EPIDEMIOLÓGICA (VIII)",
        "dot_ini": 595_000.00, "dot_atu": 638_005.00,
        "emp": 243_211.01, "emp_pct": 38.12,
        "liq": 157_134.06, "liq_pct": 24.63,
        "pago": 157_134.06, "pago_pct": 24.63,
        "rp_np": 86_076.95,
        "sub": [
            {"desc": "Despesas Correntes", "dot_ini": 540_000, "dot_atu": 583_005,
             "emp": 243_211.01, "emp_pct": 41.72, "liq": 157_134.06, "liq_pct": 26.95,
             "pago": 157_134.06, "pago_pct": 26.95, "rp_np": 86_076.95},
            {"desc": "Despesas de Capital", "dot_ini": 55_000, "dot_atu": 55_000,
             "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0},
        ],
    },
    {
        "id": "IX", "label": "ALIMENTAÇÃO E NUTRIÇÃO (IX)",
        "dot_ini": 0, "dot_atu": 0,
        "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0,
        "sub": [
            {"desc": "Despesas Correntes", "dot_ini": 0, "dot_atu": 0,
             "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0},
            {"desc": "Despesas de Capital", "dot_ini": 0, "dot_atu": 0,
             "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0},
        ],
    },
    {
        "id": "X", "label": "OUTRAS SUBFUNÇÕES (X)",
        "dot_ini": 3_253_391.22, "dot_atu": 3_210_386.22,
        "emp": 1_699_543.55, "emp_pct": 52.94,
        "liq": 1_194_431.41, "liq_pct": 37.21,
        "pago": 1_191_069.81, "pago_pct": 37.10,
        "rp_np": 505_112.14,
        "sub": [
            {"desc": "Despesas Correntes", "dot_ini": 2_334_000, "dot_atu": 2_699_314,
             "emp": 1_699_543.55, "emp_pct": 62.96, "liq": 1_194_431.41, "liq_pct": 44.25,
             "pago": 1_191_069.81, "pago_pct": 44.12, "rp_np": 505_112.14},
            {"desc": "Despesas de Capital", "dot_ini": 919_391.22, "dot_atu": 511_072.22,
             "emp": 0, "emp_pct": 0, "liq": 0, "liq_pct": 0, "pago": 0, "pago_pct": 0, "rp_np": 0},
        ],
    },
]

_TOTAL_XI = {
    "label": "TOTAL (XI) = (IV + V + VI + VII + VIII + IX + X)",
    "dot_ini": 8_414_391.22, "dot_atu": 8_414_391.22,
    "emp": 3_729_513.03, "emp_pct": 44.32,
    "liq": 1_829_747.04, "liq_pct": 21.75,
    "pago": 1_788_296.13, "pago_pct": 21.25,
    "rp_np": 1_899_765.99,
}

_APURACAO = {
    "total_asps_emp": 3_729_513.03,
    "total_asps_liq": 1_829_747.04,
    "total_asps_pago": 1_788_296.13,
    "rp_indevidos": "N/A",
    "despesas_xiv_emp": 0.00, "despesas_xiv_liq": 0.00, "despesas_xiv_pago": 0.00,
    "despesas_xv_emp": 0.00, "despesas_xv_liq": 0.00, "despesas_xv_pago": 0.00,
    "valor_aplicado_emp": 3_729_513.03,
    "valor_aplicado_liq": 1_829_747.04,
    "valor_aplicado_pago": 1_788_296.13,
    "despesa_minima_15pct": 1_535_716.06,
    "despesa_minima_lei_organica": "N/A",
    "diferenca_emp": 2_193_796.97,
    "diferenca_liq": 294_030.98,
    "diferenca_pago": 252_580.07,
    "limite_nao_cumprido_emp": 0.00,
    "limite_nao_cumprido_liq": 0.00,
    "limite_nao_cumprido_pago": 0.00,
    "pct_aplicado_emp": 36.42,
    "pct_aplicado_liq": 17.87,
    "pct_aplicado_pago": 17.46,
    "cumpriu": True,
}

_RECEITAS_ADICIONAIS = {
    "transferencias_saude": {
        "label": "RECEITAS DE TRANSFERÊNCIAS PARA A SAÚDE (XXIX)",
        "prev_ini": 14_016_765.00, "prev_atu": 14_016_765.00, "realizada": 2_357_443.79, "pct": 16.82,
        "itens": [
            {"desc": "Provenientes da União", "prev_ini": 11_594_847.00, "prev_atu": 11_594_847.00, "realizada": 2_357_251.49, "pct": 20.33},
            {"desc": "Provenientes dos Estados", "prev_ini": 2_421_918.00, "prev_atu": 2_421_918.00, "realizada": 192.30, "pct": 0.01},
            {"desc": "Provenientes de Outros Municípios", "prev_ini": 0, "prev_atu": 0, "realizada": 0, "pct": 0},
        ],
    },
    "operacoes_credito": {"label": "RECEITA DE OPERAÇÕES DE CRÉDITO INTERNAS E EXTERNAS VINCULADAS A SAÚDE (XXX)",
                          "prev_ini": 0, "prev_atu": 0, "realizada": 0, "pct": 0},
    "outras_receitas": {"label": "OUTRAS RECEITAS (XXXI)", "prev_ini": 0, "prev_atu": 0, "realizada": 0, "pct": 0},
    "total": {"label": "TOTAL RECEITAS ADICIONAIS PARA FINANCIAMENTO DA SAÚDE (XXXII) = (XXIX + XXX + XXXI)",
              "prev_ini": 14_016_765.00, "prev_atu": 14_016_765.00, "realizada": 2_357_443.79, "pct": 16.82},
}

_TOTAL_XL = {
    "label": "TOTAL DAS DESPESAS NÃO COMPUTADAS NO CÁLCULO DO MÍNIMO (XL)",
    "dot_ini": 14_016_765.00, "dot_atu": 16_922_797.36,
    "emp": 4_590_754.54, "emp_pct": 27.13,
    "liq": 2_266_544.68, "liq_pct": 13.39,
    "pago": 2_264_211.35, "pago_pct": 13.38,
    "rp_np": 2_324_209.86,
}

_TOTAIS_FINAIS = {
    "total_saude": {"label": "TOTAL DAS DESPESAS COM SAÚDE (XLVIII) = (XI + XL)",
                    "dot_ini": 22_431_156.22, "dot_atu": 25_337_188.58,
                    "emp": 8_320_267.57, "emp_pct": 32.84,
                    "liq": 4_096_291.72, "liq_pct": 16.17,
                    "pago": 4_052_507.48, "pago_pct": 15.99, "rp_np": 4_223_975.85},
    "transf_uniao": {"label": "(-) Despesas da Fonte: Transferências da União - inciso I do art. 5º da LC 173/2020",
                     "dot_ini": 14_016_765.00, "dot_atu": 16_922_797.36,
                     "emp": 4_590_754.54, "emp_pct": 27.13,
                     "liq": 2_266_544.68, "liq_pct": 13.39,
                     "pago": 2_264_211.35, "pago_pct": 13.38, "rp_np": 2_324_209.86},
    "recursos_proprios": {"label": "TOTAL DAS DESPESAS EXECUTADAS COM RECURSOS PRÓPRIOS (XLIX)",
                          "dot_ini": 8_414_391.22, "dot_atu": 8_414_391.22,
                          "emp": 3_729_513.03, "emp_pct": 44.32,
                          "liq": 1_829_747.04, "liq_pct": 21.75,
                          "pago": 1_788_296.13, "pago_pct": 21.25, "rp_np": 1_899_765.99},
}


@router.get("/dados")
async def dados():
    return {
        "meta": _META,
        "receitas": _RECEITAS,
        "despesas_asps": _DESPESAS_ASPS,
        "total_xi": _TOTAL_XI,
        "apuracao": _APURACAO,
        "receitas_adicionais": _RECEITAS_ADICIONAIS,
        "total_xl": _TOTAL_XL,
        "totais_finais": _TOTAIS_FINAIS,
    }


@router.get("/exportar-pdf")
async def exportar_pdf():
    """Gera PDF no formato oficial RREO Anexo 12 LC 141/2012."""
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib import colors
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    import io

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4),
                            leftMargin=1*cm, rightMargin=1*cm,
                            topMargin=1*cm, bottomMargin=1*cm)

    PRETO = colors.black
    CINZA_H = colors.HexColor("#D9D9D9")
    CINZA_L = colors.HexColor("#F2F2F2")
    BRANCO  = colors.white

    def p(txt, size=7, bold=False, align=TA_LEFT, color=PRETO):
        style = ParagraphStyle("x", fontSize=size, leading=size+2,
                               fontName="Helvetica-Bold" if bold else "Helvetica",
                               alignment=align, textColor=color)
        return Paragraph(txt, style)

    def fmt(v):
        if v == 0 or v == 0.0:
            return "0,00"
        return f"{v:_.2f}".replace("_", ".").replace(",","X").replace(".",",").replace("X",".")

    def pct(v):
        return f"{v:.2f}".replace(".",",")

    story = []

    # Cabeçalho oficial
    story.append(p(f"UF: {_META['uf']}", 8))
    story.append(p(f"Municipio: {_META['municipio']}", 8))
    story.append(Spacer(1, 3))
    story.append(p("RELATÓRIO RESUMIDO DA EXECUÇÃO ORÇAMENTÁRIA", 10, bold=True, align=TA_CENTER))
    story.append(p("DEMONSTRATIVO DAS RECEITAS E DESPESAS COM AÇÕES E SERVIÇOS PÚBLICOS DE SAÚDE", 9, bold=True, align=TA_CENTER))
    story.append(p("ORÇAMENTOS FISCAL E DA SEGURIDADE SOCIAL", 9, bold=True, align=TA_CENTER))
    story.append(p(f"{_META['bimestre']}° Bimestre {_META['periodo']}", 8, align=TA_CENTER))
    story.append(Spacer(1, 4))

    pw = doc.width
    TS_BASE = [
        ("FONTSIZE",   (0,0), (-1,-1), 6.5),
        ("GRID",       (0,0), (-1,-1), 0.3, PRETO),
        ("VALIGN",     (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING",  (0,0), (-1,-1), 3),
        ("RIGHTPADDING", (0,0), (-1,-1), 3),
        ("TOPPADDING",   (0,0), (-1,-1), 2),
        ("BOTTOMPADDING",(0,0), (-1,-1), 2),
    ]

    # ── TABELA 1: RECEITAS ────────────────────────────────────────────────────
    story.append(p(f"{_META['anexo']}    {_META['unidade']}", 7))
    story.append(Spacer(1, 2))

    r_head = [
        [p("RECEITAS RESULTANTES DE IMPOSTOS E\nTRANSFERÊNCIAS CONSTITUCIONAIS E LEGAIS", 6.5, bold=True, align=TA_CENTER),
         p("PREVISÃO\nINICIAL", 6.5, bold=True, align=TA_CENTER),
         p("PREVISÃO\nATUALIZADA\n(a)", 6.5, bold=True, align=TA_CENTER),
         p("RECEITAS REALIZADAS\nAté o\nBimestre (b)", 6.5, bold=True, align=TA_CENTER),
         p("% (b/a) x\n100", 6.5, bold=True, align=TA_CENTER)],
    ]
    r_rows = []
    rec = _RECEITAS

    def rec_row(label, d, negrito=False, bg=None):
        return [p(label, 6.5, bold=negrito),
                p(fmt(d["prev_ini"]), 6.5, align=TA_RIGHT),
                p(fmt(d["prev_atu"]), 6.5, align=TA_RIGHT),
                p(fmt(d["realizada"]), 6.5, align=TA_RIGHT),
                p(pct(d["pct"]), 6.5, align=TA_RIGHT)]

    r_rows.append(rec_row("RECEITA DE IMPOSTOS (I)", rec["impostos"], negrito=True))
    for it in rec["impostos"]["itens"]:
        r_rows.append([p("   " + it["desc"], 6), p(fmt(it["prev_ini"]), 6, align=TA_RIGHT),
                       p(fmt(it["prev_atu"]), 6, align=TA_RIGHT),
                       p(fmt(it["realizada"]), 6, align=TA_RIGHT),
                       p(pct(it["pct"]), 6, align=TA_RIGHT)])
    r_rows.append(rec_row("RECEITA DE TRANSFERÊNCIAS CONSTITUCIONAIS E LEGAIS (II)", rec["transferencias"], negrito=True))
    for it in rec["transferencias"]["itens"]:
        r_rows.append([p("   " + it["desc"], 6), p(fmt(it["prev_ini"]), 6, align=TA_RIGHT),
                       p(fmt(it["prev_atu"]), 6, align=TA_RIGHT),
                       p(fmt(it["realizada"]), 6, align=TA_RIGHT),
                       p(pct(it["pct"]), 6, align=TA_RIGHT)])
    r_rows.append(rec_row("TOTAL DAS RECEITAS RESULTANTES DE IMPOSTOS E TRANSFERÊNCIAS CONSTITUCIONAIS E LEGAIS - (III) = (I) + (II)",
                          rec["total"], negrito=True))

    t_rec = Table(r_head + r_rows, colWidths=[pw*0.45, pw*0.14, pw*0.14, pw*0.14, pw*0.13])
    ts_rec = TableStyle(TS_BASE + [
        ("BACKGROUND", (0,0), (-1,0), CINZA_H),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("ALIGN",      (1,0), (-1,-1), "RIGHT"),
        ("BACKGROUND", (0, len(r_rows)), (-1, len(r_rows)), CINZA_L),
    ])
    t_rec.setStyle(ts_rec)
    story.append(t_rec)
    story.append(Spacer(1, 6))

    # ── TABELA 2: DESPESAS ASPS ───────────────────────────────────────────────
    d_head = [
        [p("DESPESAS COM AÇÕES E SERVIÇOS\nPÚBLICOS DE SAÚDE (ASPS) -\nPOR SUBFUNÇÃO E CATEGORIA\nECONÔMICA", 6.5, bold=True, align=TA_CENTER),
         p("DOTAÇÃO\nINICIAL", 6.5, bold=True, align=TA_CENTER),
         p("DOTAÇÃO\nATUALIZADA\n(c)", 6.5, bold=True, align=TA_CENTER),
         p("DESPESAS EMPENHADAS\nAté o\nbimestre (d)", 6.5, bold=True, align=TA_CENTER),
         p("% (d/c)\nx 100", 6.5, bold=True, align=TA_CENTER),
         p("DESPESAS LIQUIDADAS\nAté o\nbimestre (e)", 6.5, bold=True, align=TA_CENTER),
         p("% (e/c)\nx 100", 6.5, bold=True, align=TA_CENTER),
         p("DESPESAS PAGAS\nAté o\nbimestre (f)", 6.5, bold=True, align=TA_CENTER),
         p("% (f/c)\nx 100", 6.5, bold=True, align=TA_CENTER),
         p("Inscritas em\nRestos a Pagar Não\nProcessados (g)", 6.5, bold=True, align=TA_CENTER)],
    ]

    def d_row(label, d, negrito=False):
        return [p(label, 6.5, bold=negrito),
                p(fmt(d["dot_ini"]), 6.5, align=TA_RIGHT),
                p(fmt(d["dot_atu"]), 6.5, align=TA_RIGHT),
                p(fmt(d["emp"]), 6.5, align=TA_RIGHT),
                p(pct(d["emp_pct"]), 6.5, align=TA_RIGHT),
                p(fmt(d["liq"]), 6.5, align=TA_RIGHT),
                p(pct(d["liq_pct"]), 6.5, align=TA_RIGHT),
                p(fmt(d["pago"]), 6.5, align=TA_RIGHT),
                p(pct(d["pago_pct"]), 6.5, align=TA_RIGHT),
                p(fmt(d["rp_np"]), 6.5, align=TA_RIGHT)]

    d_rows = []
    for item in _DESPESAS_ASPS:
        d_rows.append(d_row(item["label"], item, negrito=True))
        for s in item["sub"]:
            d_rows.append([p("   " + s["desc"], 6), p(fmt(s["dot_ini"]), 6, align=TA_RIGHT),
                           p(fmt(s["dot_atu"]), 6, align=TA_RIGHT),
                           p(fmt(s["emp"]), 6, align=TA_RIGHT), p(pct(s["emp_pct"]), 6, align=TA_RIGHT),
                           p(fmt(s["liq"]), 6, align=TA_RIGHT), p(pct(s["liq_pct"]), 6, align=TA_RIGHT),
                           p(fmt(s["pago"]), 6, align=TA_RIGHT), p(pct(s["pago_pct"]), 6, align=TA_RIGHT),
                           p(fmt(s["rp_np"]), 6, align=TA_RIGHT)])

    d_rows.append(d_row(_TOTAL_XI["label"], _TOTAL_XI, negrito=True))

    cw = [pw*0.22, pw*0.08, pw*0.09, pw*0.09, pw*0.06, pw*0.09, pw*0.06, pw*0.09, pw*0.06, pw*0.10]
    t_desp = Table(d_head + d_rows, colWidths=cw)
    ts_d = TableStyle(TS_BASE + [
        ("BACKGROUND", (0,0), (-1,0), CINZA_H),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("BACKGROUND", (0, len(d_rows)), (-1, len(d_rows)), CINZA_L),
    ])
    t_desp.setStyle(ts_d)
    story.append(t_desp)
    story.append(Spacer(1, 4))

    # ── APURAÇÃO ──────────────────────────────────────────────────────────────
    ap = _APURACAO
    a_rows = [
        [p("APURAÇÃO DO CUMPRIMENTO DO LIMITE MÍNIMO PARA APLICAÇÃO EM ASPS", 6.5, bold=True, align=TA_CENTER),
         p("DESPESAS\nEMPENHADAS (d)", 6.5, bold=True, align=TA_CENTER),
         p("DESPESAS\nLIQUIDADAS (e)", 6.5, bold=True, align=TA_CENTER),
         p("DESPESAS PAGAS (f)", 6.5, bold=True, align=TA_CENTER)],
        [p("Total das Despesas com ASPS (XII) = (XI)", 6.5),
         p(fmt(ap["total_asps_emp"]), 6.5, align=TA_RIGHT), p(fmt(ap["total_asps_liq"]), 6.5, align=TA_RIGHT), p(fmt(ap["total_asps_pago"]), 6.5, align=TA_RIGHT)],
        [p("(-) Restos a Pagar Inscritos Indevidamente no Exercício sem Disponibilidade Financeira (XIII)", 6.5),
         p("N/A", 6.5, align=TA_RIGHT), p("N/A", 6.5, align=TA_RIGHT), p("N/A", 6.5, align=TA_RIGHT)],
        [p("(-) Despesas Custeadas com Recursos Vinculados à Parcela do Percentual Mínimo que não foi Aplicada em ASPS em Exercícios Anteriores (XIV)", 6.5),
         p(fmt(0), 6.5, align=TA_RIGHT), p(fmt(0), 6.5, align=TA_RIGHT), p(fmt(0), 6.5, align=TA_RIGHT)],
        [p("(-) Despesas Custeadas com Disponibilidade de Caixa Vinculada aos Restos a Pagar Cancelados (XV)", 6.5),
         p(fmt(0), 6.5, align=TA_RIGHT), p(fmt(0), 6.5, align=TA_RIGHT), p(fmt(0), 6.5, align=TA_RIGHT)],
        [p("(=) VALOR APLICADO EM ASPS (XVI) = (XII - XIII - XIV - XV)", 6.5, bold=True),
         p(fmt(ap["valor_aplicado_emp"]), 6.5, bold=True, align=TA_RIGHT),
         p(fmt(ap["valor_aplicado_liq"]), 6.5, bold=True, align=TA_RIGHT),
         p(fmt(ap["valor_aplicado_pago"]), 6.5, bold=True, align=TA_RIGHT)],
        [p("Despesa Mínima a ser Aplicada em ASPS (XVII) = (III) x 15% (LC 141/2012)", 6.5, bold=True),
         p("", 6.5), p("", 6.5), p(fmt(ap["despesa_minima_15pct"]), 6.5, bold=True, align=TA_RIGHT)],
        [p("Despesa Mínima a ser Aplicada em ASPS (XVII) = (III) x % (Lei Orgânica Municipal)", 6.5),
         p("", 6.5), p("", 6.5), p("N/A", 6.5, align=TA_RIGHT)],
        [p("Diferença entre o Valor Aplicado e a Despesa Mínima a ser Aplicada (XVIII) = (XVI (d ou e) - XVII)", 6.5),
         p(fmt(ap["diferenca_emp"]), 6.5, align=TA_RIGHT),
         p(fmt(ap["diferenca_liq"]), 6.5, align=TA_RIGHT),
         p(fmt(ap["diferenca_pago"]), 6.5, align=TA_RIGHT)],
        [p("Limite não Cumprido (XIX) = (XVIII) (Quando valor for inferior a zero)", 6.5),
         p(fmt(0), 6.5, align=TA_RIGHT), p(fmt(0), 6.5, align=TA_RIGHT), p(fmt(0), 6.5, align=TA_RIGHT)],
        [p("PERCENTUAL DA RECEITA DE IMPOSTOS E TRANSFERÊNCIAS CONSTITUCIONAIS E LEGAIS APLICADO EM ASPS (XVI / III)*100 (mínimo de 15% conforme LC n° 141/2012)",
           6.5, bold=True),
         p(pct(ap["pct_aplicado_emp"]), 6.5, bold=True, align=TA_RIGHT),
         p(pct(ap["pct_aplicado_liq"]), 6.5, bold=True, align=TA_RIGHT),
         p(pct(ap["pct_aplicado_pago"]), 6.5, bold=True, align=TA_RIGHT)],
    ]

    t_ap = Table(a_rows, colWidths=[pw*0.55, pw*0.15, pw*0.15, pw*0.15])
    ts_ap = TableStyle(TS_BASE + [
        ("BACKGROUND", (0,0), (-1,0), CINZA_H),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("BACKGROUND", (0,5), (-1,5), CINZA_L),
        ("BACKGROUND", (0,10), (-1,10), CINZA_L),
    ])
    t_ap.setStyle(ts_ap)
    story.append(t_ap)
    story.append(Spacer(1, 8))

    # Rodapé
    story.append(HRFlowable(width="100%", thickness=0.5, color=PRETO))
    story.append(p(f"FONTE: {_META['fonte']}     Homologado em: 29/04/2026 10:15     Ministério da Saúde / DATASUS", 6, align=TA_LEFT))
    story.append(p("1 - Nos cinco primeiros bimestres, o acompanhamento será feito com base na despesa liquidada. No último bimestre, o valor deverá corresponder ao total empenhado.", 5.5))
    story.append(p("2 - A partir de 2019, o controle da execução dos restos a pagar considera os restos a pagar processados e não processados.", 5.5))

    doc.build(story)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.read()]),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=RREO_Anexo12_1Bim2026_Apui.pdf"},
    )
