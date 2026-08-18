"""
Serviço: Geração de planilha Excel — Repasses Federais e Execução
Município: Apuí/AM · FMS CNPJ 12.834.320/0001-26 · IBGE 130014

Biblioteca: xlsxwriter (já instalada em requirements.txt)
Suporte a gráficos nativos do Excel, fórmulas, formatação condicional.
"""
from __future__ import annotations

import io
import logging
from datetime import datetime, date
from decimal import Decimal
from typing import Any

import xlsxwriter
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from models.transferencia_fns import TransferenciaFns

logger = logging.getLogger(__name__)

IBGE = "130014"
CNPJ_FMS = "12.834.320/0001-26"
MUNICIPIO = "Apuí/AM"

MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
         "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
MESES_FULL = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
              "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"]

# Portarias reais — base fixa pois são documentos oficiais publicados
PORTARIAS = [
    {
        "numero": "GM/MS nº 3.493/2024", "ano": 2024,
        "data": "10/04/2024", "grupo": "Atenção Primária",
        "acao": "Piso de Atenção Primária — PAP",
        "acao_det": "eSF, eAP, eMulti, ACS, ACE, per capita, indicadores",
        "objeto": "Novo modelo de financiamento da APS — Portaria de Consolidação",
        "tipo": "Custeio", "link": "https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-3.493-de-10-de-abril-de-2024",
        "fonte": "Diário Oficial da União — DOU", "obs": "Revoga PREVINE Brasil (Port. GM/MS 2.979/2019)",
        "permitidas": "Custeio de ações e serviços de APS conforme anexos I–VI",
        "nao_permitidas": "Investimento, obras, equipamentos sem previsão no Plano de Saúde",
    },
    {
        "numero": "GM/MS nº 635/2023", "ano": 2023,
        "data": "22/05/2023", "grupo": "Atenção Primária",
        "acao": "eMulti — Equipes Multiprofissionais",
        "acao_det": "Custeio e Atendimento Remoto das eMulti",
        "objeto": "Instituição das equipes multiprofissionais na APS",
        "tipo": "Custeio", "link": "https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-635-de-22-de-maio-de-2023",
        "fonte": "Ministério da Saúde", "obs": "Atendimento Remoto: R$ 2.250,00/equipe/mês",
        "permitidas": "Custeio de profissionais, insumos e ações das equipes",
        "nao_permitidas": "Obras e reformas sem previsão específica",
    },
    {
        "numero": "Port. Cons. GM/MS nº 6/2017", "ano": 2017,
        "data": "03/10/2017", "grupo": "MAC / Vigilância / Farmácia",
        "acao": "Blocos de Financiamento do SUS",
        "acao_det": "MAC, Vigilância em Saúde, Assistência Farmacêutica, Gestão do SUS",
        "objeto": "Consolidação das portarias de financiamento por bloco",
        "tipo": "Custeio e Investimento", "link": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0006_03_10_2017.html",
        "fonte": "BVS/MS", "obs": "Principais blocos de financiamento vigentes",
        "permitidas": "Conforme especificações de cada bloco",
        "nao_permitidas": "Utilização de recursos de um bloco em outro sem autorização",
    },
    {
        "numero": "Lei nº 14.434/2022", "ano": 2022,
        "data": "04/08/2022", "grupo": "Piso Salarial da Enfermagem",
        "acao": "PSE — Piso Salarial da Enfermagem",
        "acao_det": "Incentivo federal ao custeio do piso salarial",
        "objeto": "Institui o Piso Salarial Nacional da Enfermagem",
        "tipo": "Custeio", "link": "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14434.htm",
        "fonte": "Planalto/DOU", "obs": "Transferência fundo a fundo para complementação do piso",
        "permitidas": "Exclusivamente remuneração de enfermeiros, técnicos e auxiliares de enfermagem",
        "nao_permitidas": "Qualquer despesa que não seja remuneração da categoria",
    },
    {
        "numero": "GM/MS nº 3.992/2017", "ano": 2017,
        "data": "28/12/2017", "grupo": "Assistência Farmacêutica",
        "acao": "Assistência Farmacêutica",
        "acao_det": "CBAF, Qualifar-SUS, Farmácia Popular",
        "objeto": "Financiamento e transferência dos recursos federais para AF",
        "tipo": "Custeio", "link": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prt3992_28_12_2017.html",
        "fonte": "BVS/MS", "obs": "Componente Básico — CBAF per capita",
        "permitidas": "Aquisição de medicamentos do Componente Básico",
        "nao_permitidas": "Medicamentos do Componente Especializado, salvo exceção",
    },
    {
        "numero": "GM/MS nº 1.378/2013", "ano": 2013,
        "data": "09/07/2013", "grupo": "Vigilância em Saúde",
        "acao": "Vigilância em Saúde",
        "acao_det": "Vigilância epidemiológica, sanitária e ambiental",
        "objeto": "Gestão nacional das atividades de vigilância em saúde",
        "tipo": "Custeio", "link": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2013/prt1378_09_07_2013.html",
        "fonte": "BVS/MS", "obs": "Regulamenta repasses do bloco de vigilância",
        "permitidas": "Ações de vigilância epidemiológica, sanitária e ambiental",
        "nao_permitidas": "Ações de atenção à saúde sem relação com vigilância",
    },
]


def _f(v) -> float:
    """Converte Decimal/None para float seguro."""
    if v is None:
        return None
    try:
        return float(v)
    except Exception:
        return None


def _brl(v) -> str:
    if v is None:
        return ""
    return f"R$ {v:_.2f}".replace(".", ",").replace("_", ".")


async def _carregar_fns(db: AsyncSession, exercicio: int) -> list[dict]:
    stmt = (
        select(TransferenciaFns)
        .where(TransferenciaFns.municipio_ibge == IBGE)
        .where(TransferenciaFns.exercicio == exercicio)
        .order_by(TransferenciaFns.mes, TransferenciaFns.tipo_incentivo)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "mes": r.mes,
            "competencia": r.competencia,
            "data_pagamento": r.data_pagamento,
            "bloco": r.bloco,
            "grupo": r.grupo,
            "acao": r.acao,
            "acao_detalhada": r.acao_detalhada,
            "tipo_incentivo": r.tipo_incentivo,
            "numero_ob": r.numero_ob,
            "numero_portaria": r.numero_portaria,
            "valor_total": _f(r.valor_total),
            "valor_desconto": _f(r.valor_desconto),
            "valor_liquido": _f(r.valor_liquido),
            "situacao": r.situacao,
            "fonte": r.fonte,
            "data_coleta": r.data_coleta,
        }
        for r in rows
    ]


async def _carregar_execucao(db: AsyncSession, exercicio: int) -> list[dict]:
    """
    Tenta carregar dados de execução do banco.
    Retorna lista vazia se tabelas não existem ou exercício sem dados.
    """
    try:
        from sqlalchemy import text
        result = await db.execute(text(
            "SELECT e.numero, e.valor, e.descricao, "
            "NULL as numero_liquidacao, NULL as valor_liquidado, "
            "NULL as numero_pagamento, NULL as valor_pago, NULL as data_pagamento, NULL as fornecedor "
            "FROM empenhos e "
            "JOIN convenios c ON c.id = e.convenio_id "
            "WHERE EXTRACT(YEAR FROM e.data_empenho) = :exercicio "
            "LIMIT 500"
        ), {"exercicio": exercicio})
        rows = result.fetchall()
        return [
            {
                "numero_empenho": r[0],
                "valor_empenhado": _f(r[1]),
                "objeto": r[2],
                "grupo": None,
                "numero_liquidacao": r[3],
                "valor_liquidado": _f(r[4]),
                "numero_pagamento": r[5],
                "valor_pago": _f(r[6]),
                "data_pagamento": r[7],
                "fornecedor": r[8],
            }
            for r in rows
        ]
    except Exception as e:
        logger.warning(f"Execução não disponível (tabelas ausentes ou sem dados): {e}")
        return []


def _resumo_por_tipo_mes(fns_data: list[dict], exercicio: int) -> dict:
    """Agrega FNS por tipo de incentivo e mês."""
    tipos: dict[str, list[float | None]] = {}
    for r in fns_data:
        tipo = r["tipo_incentivo"] or "Outros incentivos"
        if tipo not in tipos:
            tipos[tipo] = [None] * 12
        mes_idx = (r["mes"] or 1) - 1
        if 0 <= mes_idx < 12:
            vl = r["valor_liquido"]
            if vl is not None:
                tipos[tipo][mes_idx] = (tipos[tipo][mes_idx] or 0) + vl
    return tipos


async def gerar_planilha_repasses(
    db: AsyncSession,
    exercicio: int = 2026,
    incluir_execucao: bool = True,
    incluir_portarias: bool = True,
) -> bytes:
    """
    Gera planilha Excel completa com 9 abas.
    Retorna bytes do arquivo .xlsx.
    """
    agora = datetime.now()
    fns_data = await _carregar_fns(db, exercicio)
    exec_data = await _carregar_execucao(db, exercicio) if incluir_execucao else []

    output = io.BytesIO()
    wb = xlsxwriter.Workbook(output, {"in_memory": True, "strings_to_urls": True})

    # ── Formatos ──────────────────────────────────────────────────────────────
    def fmt(**kw):
        return wb.add_format(kw)

    AZUL  = "#1565C0"
    AZULC = "#1976D2"
    VERDE = "#2E7D32"
    VERD2 = "#43A047"
    CIZBL = "#E3F2FD"
    CINZA = "#616161"
    AMAR  = "#F9A825"
    VERM  = "#C62828"
    LARAN = "#E65100"

    f_titulo  = fmt(bold=True, font_size=14, font_color=AZUL, align="left")
    f_sub     = fmt(font_size=10, font_color=CINZA, italic=True)
    f_aviso   = fmt(font_size=9, font_color=VERM, italic=True, text_wrap=True)
    f_cab     = fmt(bold=True, bg_color=AZUL, font_color="white", border=1,
                    align="center", valign="vcenter", text_wrap=True, font_size=9)
    f_cab_v   = fmt(bold=True, bg_color=VERDE, font_color="white", border=1,
                    align="center", valign="vcenter", text_wrap=True, font_size=9)
    f_data_cab= fmt(bold=True, font_color=CINZA, font_size=9, align="right")
    f_cel     = fmt(border=1, font_size=9, text_wrap=True, valign="top")
    f_cel2    = fmt(border=1, font_size=9, text_wrap=True, valign="top", bg_color="#F5F5F5")
    f_brl     = fmt(border=1, font_size=9, num_format='R$ #,##0.00')
    f_brl2    = fmt(border=1, font_size=9, num_format='R$ #,##0.00', bg_color="#F5F5F5")
    f_brl_tot = fmt(border=2, font_size=9, num_format='R$ #,##0.00', bold=True, bg_color=CIZBL)
    f_pct     = fmt(border=1, font_size=9, num_format='0.00%')
    f_data    = fmt(border=1, font_size=9, num_format='dd/mm/yyyy')
    f_tot     = fmt(bold=True, border=2, font_size=9, text_wrap=True, bg_color=CIZBL)
    f_url     = fmt(border=1, font_size=9, font_color=AZULC, underline=True)
    f_verde   = fmt(border=1, font_size=9, bg_color="#C8E6C9", bold=True, align="center")
    f_amar    = fmt(border=1, font_size=9, bg_color="#FFF9C4", align="center")
    f_verm_f  = fmt(border=1, font_size=9, bg_color="#FFCDD2", align="center")
    f_cinza_f = fmt(border=1, font_size=9, bg_color="#EEEEEE", align="center")
    f_num     = fmt(border=1, font_size=9, num_format='#,##0')

    # ── Cabeçalho padrão de identificação ─────────────────────────────────────
    def _cabecalho_ident(ws, exercicio, ultima_coleta=None):
        ws.merge_range("A1:Z1", "MÓDULO FINANCEIRO — REPASSES FEDERAIS E EXECUÇÃO", f_titulo)
        ws.merge_range("A2:Z2",
            f"Município: {MUNICIPIO}  ·  Fundo Municipal de Saúde  ·  CNPJ: {CNPJ_FMS}  ·  IBGE: {IBGE}  ·  "
            f"Exercício: {exercicio}  ·  Fontes: e-Gestor APS, FNS/MS, ERSUS360  ·  "
            f"Gerado em: {agora.strftime('%d/%m/%Y %H:%M')}",
            f_sub)
        ws.merge_range("A3:Z3",
            "⚠  Os valores do FNS NÃO são automaticamente somados aos valores do e-Gestor APS. "
            "Registros coincidentes devem ser conciliados para evitar dupla contabilização.",
            f_aviso)

    # ═══════════════════════════════════════════════════════════════════════════
    # ABA 1 — RESUMO GERAL
    # ═══════════════════════════════════════════════════════════════════════════
    ws1 = wb.add_worksheet("RESUMO GERAL")
    ws1.set_zoom(85)
    ws1.set_column("A:A", 32)
    ws1.set_column("B:C", 20)
    ws1.set_column("D:D", 15)

    _cabecalho_ident(ws1, exercicio)

    # KPIs
    total_fns = sum(r["valor_liquido"] for r in fns_data if r["valor_liquido"])
    total_aps = sum(r["valor_liquido"] for r in fns_data
                    if r["tipo_incentivo"] == "Atenção Primária" and r["valor_liquido"])
    total_mac = sum(r["valor_liquido"] for r in fns_data
                    if r["tipo_incentivo"] == "MAC — Média e Alta Complexidade" and r["valor_liquido"])
    qt_registros = len(fns_data)
    qt_tipos = len(set(r["tipo_incentivo"] for r in fns_data if r["tipo_incentivo"]))

    total_emp = sum((e["valor_empenhado"] or 0) for e in exec_data)
    total_pago = sum((e["valor_pago"] or 0) for e in exec_data)

    kpis = [
        ("TOTAL ANUAL RECEBIDO (FNS)", total_fns, f_brl_tot),
        ("Total — Atenção Primária (APS)", total_aps, f_brl),
        ("Total — MAC e outros", total_mac, f_brl),
        ("Total Empenhado", total_emp if exec_data else None, f_brl),
        ("Total Pago", total_pago if exec_data else None, f_brl),
        ("Saldo Disponível (Recebido − Pago)", (total_fns - total_pago) if exec_data else None, f_brl),
        ("Qtd. de Registros FNS coletados", qt_registros, f_num),
        ("Qtd. de Tipos de Incentivo", qt_tipos, f_num),
        ("Qtd. de Portarias referenciadas", len(PORTARIAS), f_num),
        ("Última coleta FNS", agora.strftime("%d/%m/%Y %H:%M"), fmt(border=1, font_size=9)),
    ]

    ws1.merge_range("A5:A5", "INDICADOR", f_cab)
    ws1.merge_range("B5:B5", "VALOR", f_cab)
    ws1.write("C5", "SITUAÇÃO", f_cab)

    for i, (label, valor, fmt_) in enumerate(kpis, start=5):
        row = i
        ws1.write(row, 0, label, f_cel if i % 2 == 0 else f_cel2)
        if valor is None:
            ws1.write(row, 1, "Aguardando dados", f_cel if i % 2 == 0 else f_cel2)
            ws1.write(row, 2, "Sem informação", f_cinza_f)
        elif isinstance(valor, str):
            ws1.write(row, 1, valor, f_cel)
            ws1.write(row, 2, "", f_cel)
        elif isinstance(valor, float) and fmt_ == f_brl_tot:
            ws1.write_number(row, 1, valor, f_brl_tot)
            ws1.write(row, 2, "Oficial FNS", f_verde)
        else:
            ws1.write_number(row, 1, valor, fmt_) if isinstance(valor, (int, float)) else ws1.write(row, 1, valor, f_cel)
            ws1.write(row, 2, "Calculado", f_amar)

    # Tabela de totais por tipo para o gráfico
    tipos_resumo = _resumo_por_tipo_mes(fns_data, exercicio)
    row_g = 17
    ws1.write(row_g, 0, "TIPO DE INCENTIVO", f_cab)
    ws1.write(row_g, 1, "TOTAL ANUAL (R$)", f_cab)
    ws1.write(row_g, 2, "% DO TOTAL", f_cab)

    tipo_rows_start = row_g + 1
    tipo_list = sorted(tipos_resumo.items(), key=lambda x: -(sum(v for v in x[1] if v) or 0))
    for i, (tipo, valores) in enumerate(tipo_list):
        r = tipo_rows_start + i
        tot = sum(v for v in valores if v) or 0
        pct = tot / total_fns if total_fns else 0
        ws1.write(r, 0, tipo, f_cel if i % 2 == 0 else f_cel2)
        ws1.write_number(r, 1, tot, f_brl if i % 2 == 0 else f_brl2)
        ws1.write_number(r, 2, pct, f_pct)
    tipo_rows_end = tipo_rows_start + len(tipo_list) - 1

    # Gráfico de pizza — Repasses por tipo
    if tipo_list:
        chart_pie = wb.add_chart({"type": "pie"})
        chart_pie.add_series({
            "name": "Repasses por Tipo",
            "categories": ["RESUMO GERAL", tipo_rows_start, 0, tipo_rows_end, 0],
            "values":     ["RESUMO GERAL", tipo_rows_start, 1, tipo_rows_end, 1],
            "data_labels": {"percentage": True, "category": True, "font": {"size": 8}},
        })
        chart_pie.set_title({"name": f"Distribuição dos Repasses FNS — {exercicio}"})
        chart_pie.set_size({"width": 480, "height": 300})
        ws1.insert_chart("E5", chart_pie)

        # Gráfico de barras — evolução mensal
        meses_totais = [0.0] * 12
        for valores in tipos_resumo.values():
            for i, v in enumerate(valores):
                if v:
                    meses_totais[i] += v

        row_ev = tipo_rows_end + 2
        ws1.write(row_ev, 0, "MÊS", f_cab)
        ws1.write(row_ev, 1, "TOTAL RECEBIDO (R$)", f_cab)
        for i, (mes_nome, total) in enumerate(zip(MESES_FULL, meses_totais)):
            ws1.write(row_ev + 1 + i, 0, mes_nome, f_cel)
            ws1.write_number(row_ev + 1 + i, 1, total or 0, f_brl)

        chart_bar = wb.add_chart({"type": "column"})
        chart_bar.add_series({
            "name": "Total Mensal",
            "categories": ["RESUMO GERAL", row_ev + 1, 0, row_ev + 12, 0],
            "values":     ["RESUMO GERAL", row_ev + 1, 1, row_ev + 12, 1],
            "fill": {"color": AZUL},
        })
        chart_bar.set_title({"name": f"Evolução Mensal dos Repasses — {exercicio}"})
        chart_bar.set_x_axis({"name": "Mês"})
        chart_bar.set_y_axis({"name": "R$", "num_format": "R$ #,##0"})
        chart_bar.set_size({"width": 480, "height": 280})
        ws1.insert_chart("E22", chart_bar)

    # ═══════════════════════════════════════════════════════════════════════════
    # ABA 2 — REPASSES MENSAIS
    # ═══════════════════════════════════════════════════════════════════════════
    ws2 = wb.add_worksheet("REPASSES MENSAIS")
    ws2.set_zoom(80)
    ws2.freeze_panes(5, 4)
    ws2.set_landscape()
    ws2.set_paper(9)  # A4
    ws2.fit_to_pages(1, 0)
    ws2.repeat_rows(4, 4)

    _cabecalho_ident(ws2, exercicio)

    # Larguras das colunas
    for c, w in enumerate([16, 28, 34, 12, 22, 18, 8,
                            12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12,
                            14, 14, 14, 14, 14, 10, 18, 22]):
        ws2.set_column(c, c, w)

    cabs2 = [
        "GRUPO", "AÇÃO", "AÇÃO DETALHADA", "TIPO", "BLOCO / PORTARIA", "FONTE",
        "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
        "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
        "TOTAL RECEBIDO", "TOTAL EMPENHADO", "TOTAL PAGO",
        "TOTAL A PAGAR", "SALDO DISPONÍVEL", "% EXECUÇÃO",
        "SITUAÇÃO", "OBSERVAÇÕES",
    ]
    for col, cab in enumerate(cabs2):
        ws2.write(4, col, cab, f_cab)

    # Agrupa FNS por tipo/grupo para linhas mensais
    grupos: dict[str, dict] = {}
    for r in fns_data:
        key = f"{r['tipo_incentivo']}|||{r['acao'] or ''}|||{r['acao_detalhada'] or ''}"
        if key not in grupos:
            grupos[key] = {
                "grupo": r["tipo_incentivo"] or "Outros incentivos",
                "acao": r["acao"] or "",
                "acao_det": r["acao_detalhada"] or "",
                "tipo": "Custeio",
                "bloco": r["bloco"] or "",
                "portaria": r["numero_portaria"] or "",
                "fonte": r["fonte"] or "FNS/MS",
                "meses": [None] * 12,
            }
        m = (r["mes"] or 1) - 1
        if 0 <= m < 12:
            vl = r["valor_liquido"]
            if vl is not None:
                grupos[key]["meses"][m] = (grupos[key]["meses"][m] or 0) + vl

    data_row = 5
    total_row_2 = 4 + len(grupos) + 1  # linha de totais

    for i, (key, g) in enumerate(sorted(grupos.items())):
        row = data_row + i
        alt = row % 2 == 0
        fb = f_cel2 if alt else f_cel
        fm = f_brl2 if alt else f_brl

        # Colunas de texto (A–F = 0–5)
        ws2.write(row, 0, g["grupo"], fb)
        ws2.write(row, 1, g["acao"], fb)
        ws2.write(row, 2, g["acao_det"], fb)
        ws2.write(row, 3, g["tipo"], fb)
        ws2.write(row, 4, g["bloco"] or g["portaria"], fb)
        ws2.write(row, 5, g["fonte"], fb)

        # Meses (G–R = 6–17)
        for mi, vl in enumerate(g["meses"]):
            if vl is not None:
                ws2.write_number(row, 6 + mi, vl, fm)
            else:
                ws2.write_blank(row, 6 + mi, fm)

        # Colunas de cálculo usando fórmulas reais do Excel
        col_jan = xlsxwriter.utility.xl_col_to_name(6)
        col_dez = xlsxwriter.utility.xl_col_to_name(17)
        col_rec = xlsxwriter.utility.xl_col_to_name(18)
        col_emp = xlsxwriter.utility.xl_col_to_name(19)
        col_pag = xlsxwriter.utility.xl_col_to_name(20)
        xl_row  = row + 1  # Excel é 1-indexed

        ws2.write_formula(row, 18, f"=SUM({col_jan}{xl_row}:{col_dez}{xl_row})", f_brl_tot)  # Total recebido
        ws2.write_blank(row, 19, fm)   # Empenhado — preencher manualmente / execução
        ws2.write_blank(row, 20, fm)   # Pago
        ws2.write_formula(row, 21,
            f"=IFERROR({col_emp}{xl_row}-{col_pag}{xl_row},\"\")", fm)  # A pagar
        ws2.write_formula(row, 22,
            f"=IFERROR({col_rec}{xl_row}-{col_pag}{xl_row},\"\")", fm)  # Saldo
        ws2.write_formula(row, 23,
            f"=IFERROR({col_pag}{xl_row}/{col_rec}{xl_row},0)", f_pct)  # % execução

        # Situação — fórmula lógica
        ws2.write_formula(row, 24,
            f'=IFERROR(IF({col_rec}{xl_row}=0,"SEM REPASSE",'
            f'IF({col_pag}{xl_row}="",' '"AGUARDANDO INFORMAÇÕES",'
            f'IF({col_pag}{xl_row}=0,"SEM EXECUÇÃO",'
            f'IF({col_pag}{xl_row}>={col_rec}{xl_row},"EXECUTADO",'
            f'"EM ANDAMENTO")))),"SEM DADOS")',
            f_amar)

        ws2.write_blank(row, 25, fb)  # Observações

    # Linha de totais
    trow = data_row + len(grupos)
    ws2.write(trow, 0, "TOTAL GERAL", f_tot)
    ws2.write_blank(trow, 1, f_tot)
    ws2.write_blank(trow, 2, f_tot)
    ws2.write_blank(trow, 3, f_tot)
    ws2.write_blank(trow, 4, f_tot)
    ws2.write_blank(trow, 5, f_tot)
    if grupos:
        first_data = data_row + 1
        last_data  = data_row + len(grupos)
        for ci in range(6, 23):
            col_name = xlsxwriter.utility.xl_col_to_name(ci)
            ws2.write_formula(trow, ci,
                f"=SUM({col_name}{first_data}:{col_name}{last_data})",
                f_brl_tot)
    ws2.write_blank(trow, 23, f_tot)
    ws2.write(trow, 24, "TOTAL", f_tot)
    ws2.write_blank(trow, 25, f_tot)

    ws2.autofilter(4, 0, trow, len(cabs2) - 1)

    # Formatação condicional — coluna de situação
    ws2.conditional_format(data_row, 24, trow - 1, 24, {
        "type": "text", "criteria": "containing", "value": "EXECUTADO",
        "format": f_verde,
    })
    ws2.conditional_format(data_row, 24, trow - 1, 24, {
        "type": "text", "criteria": "containing", "value": "EM ANDAMENTO",
        "format": f_amar,
    })
    ws2.conditional_format(data_row, 24, trow - 1, 24, {
        "type": "text", "criteria": "containing", "value": "SEM EXECUÇÃO",
        "format": f_verm_f,
    })

    # ═══════════════════════════════════════════════════════════════════════════
    # ABA 3 — EXECUÇÃO FINANCEIRA
    # ═══════════════════════════════════════════════════════════════════════════
    ws3 = wb.add_worksheet("EXECUÇÃO FINANCEIRA")
    ws3.set_zoom(80)
    ws3.freeze_panes(5, 3)
    _cabecalho_ident(ws3, exercicio)

    cabs3 = [
        "GRUPO", "AÇÃO", "OBJETO",
        "VL RECEBIDO", "VL EMPENHADO", "VL LIQUIDADO", "VL PAGO", "VL A PAGAR", "SALDO", "% EXEC.",
        "FORNECEDOR", "CNPJ/CPF", "Nº EMPENHO", "Nº LIQUIDAÇÃO", "Nº PAGAMENTO",
        "DATA PAGAMENTO", "CONTA", "SITUAÇÃO", "OBSERVAÇÃO",
    ]
    for col, cab in enumerate(cabs3):
        ws3.write(4, col, cab, f_cab)
    ws3.set_column(0, 2, 18)
    ws3.set_column(3, 9, 14)
    ws3.set_column(10, 18, 16)

    if exec_data:
        for i, e in enumerate(exec_data):
            row = 5 + i
            alt = i % 2 == 0
            fb  = f_cel2 if alt else f_cel
            fm  = f_brl2 if alt else f_brl
            ws3.write(row, 0, e.get("grupo") or "Não informado", fb)
            ws3.write(row, 1, "", fb)
            ws3.write(row, 2, e.get("objeto") or "Não informado", fb)
            ws3.write_number(row, 3, e.get("valor_empenhado") or 0, fm) if e.get("valor_empenhado") else ws3.write(row, 3, "", fb)
            ws3.write_number(row, 4, e.get("valor_empenhado") or 0, fm) if e.get("valor_empenhado") else ws3.write(row, 4, "", fb)
            ws3.write_number(row, 5, e.get("valor_liquidado") or 0, fm) if e.get("valor_liquidado") else ws3.write(row, 5, "", fb)
            ws3.write_number(row, 6, e.get("valor_pago") or 0, fm) if e.get("valor_pago") else ws3.write(row, 6, "", fb)
            ws3.write_blank(row, 7, fb)
            ws3.write_blank(row, 8, fb)
            ws3.write_blank(row, 9, fb)
            ws3.write(row, 10, e.get("fornecedor") or "", fb)
            ws3.write_blank(row, 11, fb)
            ws3.write(row, 12, e.get("numero_empenho") or "", fb)
            ws3.write(row, 13, e.get("numero_liquidacao") or "", fb)
            ws3.write(row, 14, e.get("numero_pagamento") or "", fb)
            dp = e.get("data_pagamento")
            if isinstance(dp, (date, datetime)):
                ws3.write_datetime(row, 15, dp, f_data)
            else:
                ws3.write(row, 15, "", fb)
            ws3.write_blank(row, 16, fb)
            ws3.write(row, 17, "Registrado", f_verde)
            ws3.write_blank(row, 18, fb)
    else:
        ws3.merge_range("A6:S6", "Aguardando dados de execução — nenhum empenho cadastrado no ERSUS360 para este exercício.", f_aviso)

    ws3.autofilter(4, 0, 4 + max(len(exec_data), 1), len(cabs3) - 1)

    # ═══════════════════════════════════════════════════════════════════════════
    # ABA 4 — ATENÇÃO PRIMÁRIA (e-Gestor APS)
    # ═══════════════════════════════════════════════════════════════════════════
    ws4 = wb.add_worksheet("ATENÇÃO PRIMÁRIA")
    ws4.set_zoom(85)
    ws4.freeze_panes(5, 3)
    _cabecalho_ident(ws4, exercicio)

    cabs4 = [
        "COMPETÊNCIA", "PARCELA", "AÇÃO / COMPONENTE", "EQUIPE/SERVIÇO",
        "CUSTEIO (R$)", "IMPLANTAÇÃO (R$)", "ATEND. REMOTO (R$)", "QUALIDADE (R$)", "TOTAL (R$)",
        "SITUAÇÃO", "FONTE", "DATA COLETA",
    ]
    for col, cab in enumerate(cabs4):
        ws4.write(4, col, cab, f_cab_v)
    ws4.set_column(0, 3, 18)
    ws4.set_column(4, 8, 16)
    ws4.set_column(9, 11, 16)

    # Filtra registros APS do FNS já coletados
    aps_fns = [r for r in fns_data if r["tipo_incentivo"] == "Atenção Primária"]
    if aps_fns:
        for i, r in enumerate(aps_fns):
            row = 5 + i
            alt = i % 2 == 0
            fb = f_cel2 if alt else f_cel
            fm = f_brl2 if alt else f_brl
            ws4.write(row, 0, r["competencia"] or "", fb)
            ws4.write_blank(row, 1, fb)
            ws4.write(row, 2, r["acao"] or r["acao_detalhada"] or "Atenção Primária", fb)
            ws4.write_blank(row, 3, fb)
            ws4.write_number(row, 4, r["valor_liquido"] or 0, fm) if r["valor_liquido"] else ws4.write(row, 4, "", fb)
            ws4.write_blank(row, 5, fb)
            ws4.write_blank(row, 6, fb)
            ws4.write_blank(row, 7, fb)
            ws4.write_formula(row, 8,
                f"=IFERROR(SUM(E{row+1}:H{row+1}),\"\")", fm)
            ws4.write(row, 9, r["situacao"] or "Pago", f_verde)
            ws4.write(row, 10, r["fonte"] or "FNS/MS", fb)
            dc = r.get("data_coleta")
            if isinstance(dc, datetime):
                ws4.write_datetime(row, 11, dc, f_data)
            else:
                ws4.write(row, 11, str(dc)[:10] if dc else "", fb)
    else:
        ws4.merge_range("A6:L6",
            "Nenhum registro de Atenção Primária coletado do FNS para este exercício. "
            "Utilize a aba 'Repasses do Fundo Nacional de Saúde' para sincronizar os dados oficiais.", f_aviso)

    ws4.write(5 + max(len(aps_fns), 1), 0,
        "NOTA: Esta aba exibe os repasses classificados como Atenção Primária no FNS. "
        "Para dados detalhados por equipe/competência, consulte o e-Gestor APS (relatorioaps-prd.saude.gov.br).",
        f_sub)
    ws4.autofilter(4, 0, 5 + max(len(aps_fns), 1), len(cabs4) - 1)

    # ═══════════════════════════════════════════════════════════════════════════
    # ABA 5 — REPASSES FNS (todos os registros)
    # ═══════════════════════════════════════════════════════════════════════════
    ws5 = wb.add_worksheet("REPASSES FNS")
    ws5.set_zoom(80)
    ws5.freeze_panes(5, 3)
    _cabecalho_ident(ws5, exercicio)

    cabs5 = [
        "ID", "EXERCÍCIO", "MÊS", "COMPETÊNCIA", "DATA PAGAMENTO",
        "BLOCO", "GRUPO", "AÇÃO", "AÇÃO DETALHADA", "TIPO INCENTIVO",
        "VALOR TOTAL (R$)", "DESCONTO (R$)", "VALOR LÍQUIDO (R$)",
        "Nº OB", "PORTARIA", "SITUAÇÃO", "FONTE", "DATA COLETA",
    ]
    for col, cab in enumerate(cabs5):
        ws5.write(4, col, cab, f_cab)
    ws5.set_column(0, 3, 10)
    ws5.set_column(4, 4, 14)
    ws5.set_column(5, 9, 24)
    ws5.set_column(10, 12, 16)
    ws5.set_column(13, 17, 16)

    for i, r in enumerate(fns_data):
        row = 5 + i
        alt = i % 2 == 0
        fb = f_cel2 if alt else f_cel
        fm = f_brl2 if alt else f_brl
        ws5.write_number(row, 0, r["id"] or 0, fb)
        ws5.write_number(row, 1, exercicio, fb)
        ws5.write_number(row, 2, r["mes"] or 0, fb)
        ws5.write(row, 3, r["competencia"] or "", fb)
        dp = r.get("data_pagamento")
        if isinstance(dp, (date, datetime)):
            ws5.write_datetime(row, 4, dp, f_data)
        else:
            ws5.write(row, 4, "", fb)
        ws5.write(row, 5, r["bloco"] or "", fb)
        ws5.write(row, 6, r["grupo"] or "", fb)
        ws5.write(row, 7, r["acao"] or "", fb)
        ws5.write(row, 8, r["acao_detalhada"] or "", fb)
        ws5.write(row, 9, r["tipo_incentivo"] or "", fb)
        ws5.write_number(row, 10, r["valor_total"] or 0, fm) if r["valor_total"] else ws5.write(row, 10, "", fb)
        ws5.write_number(row, 11, r["valor_desconto"] or 0, fm) if r["valor_desconto"] else ws5.write(row, 11, 0, fm)
        ws5.write_number(row, 12, r["valor_liquido"] or 0, fm) if r["valor_liquido"] else ws5.write(row, 12, "", fb)
        ws5.write(row, 13, r["numero_ob"] or "", fb)
        ws5.write(row, 14, r["numero_portaria"] or "", fb)
        ws5.write(row, 15, r["situacao"] or "", f_verde if r["situacao"] == "Pago" else fb)
        ws5.write(row, 16, r["fonte"] or "", fb)
        dc = r.get("data_coleta")
        if isinstance(dc, datetime):
            ws5.write_datetime(row, 17, dc, f_data)
        else:
            ws5.write(row, 17, str(dc)[:10] if dc else "", fb)

    if not fns_data:
        ws5.merge_range("A6:R6", "Nenhum registro FNS coletado para este exercício.", f_aviso)

    ws5.autofilter(4, 0, 5 + max(len(fns_data), 1), len(cabs5) - 1)

    # ═══════════════════════════════════════════════════════════════════════════
    # ABA 6 — CONCILIAÇÃO APS × FNS
    # ═══════════════════════════════════════════════════════════════════════════
    ws6 = wb.add_worksheet("CONCILIAÇÃO APS × FNS")
    ws6.set_zoom(80)
    ws6.freeze_panes(5, 2)
    _cabecalho_ident(ws6, exercicio)

    cabs6 = [
        "COMPETÊNCIA (eGESTOR)", "PARCELA", "AÇÃO APS", "COMPONENTE",
        "VALOR eGESTOR (R$)", "DATA PAG FNS", "AÇÃO FNS", "VALOR FNS (R$)",
        "DIFERENÇA (R$)", "SITUAÇÃO", "JUSTIFICATIVA", "FONTE",
    ]
    for col, cab in enumerate(cabs6):
        ws6.write(4, col, cab, f_cab)
    ws6.set_column(0, 3, 18)
    ws6.set_column(4, 8, 16)
    ws6.set_column(9, 11, 22)

    # Agrupa FNS por mês para conciliação
    fns_por_mes: dict[int, float] = {}
    for r in fns_data:
        if r["tipo_incentivo"] == "Atenção Primária" and r["valor_liquido"]:
            m = r["mes"] or 0
            fns_por_mes[m] = fns_por_mes.get(m, 0) + r["valor_liquido"]

    STATUS_CONCIL = {
        "ok": "Conciliado",
        "grupo": "Conciliado com diferença de agrupamento",
        "sem_fns": "Pagamento não identificado no FNS",
        "divergente": "Valor divergente — exige análise",
        "retroativo": "Transferência retroativa",
        "sem_info": "Competência não processada",
    }

    meses_concil = sorted(set(list(fns_por_mes.keys())))
    if meses_concil:
        for i, mes_num in enumerate(meses_concil):
            row = 5 + i
            alt = i % 2 == 0
            fb = f_cel2 if alt else f_cel
            fm = f_brl2 if alt else f_brl
            comp = f"{exercicio}/{mes_num:02d}"
            vl_fns = fns_por_mes.get(mes_num, 0)

            ws6.write(row, 0, comp, fb)
            ws6.write(row, 1, "", fb)
            ws6.write(row, 2, "Atenção Primária", fb)
            ws6.write(row, 3, "FNS — APS", fb)
            ws6.write(row, 4, "", fb)  # valor eGestor — não disponível sem sync eGestor
            ws6.write(row, 5, "", fb)
            ws6.write(row, 6, "APS — FNS", fb)
            ws6.write_number(row, 7, vl_fns, fm)
            ws6.write_formula(row, 8,
                f"=IFERROR(E{row+1}-H{row+1},\"\")", fm)  # Diferença
            ws6.write(row, 9, STATUS_CONCIL["sem_info"], f_amar)
            ws6.write(row, 10,
                "Valor do e-Gestor APS não sincronizado. Conciliação parcial — apenas FNS disponível.", fb)
            ws6.write(row, 11, "FNS/MS — consultafns.saude.gov.br", fb)
    else:
        ws6.merge_range("A6:L6",
            "Nenhum registro de APS disponível para conciliação. Sincronize os dados do FNS primeiro.", f_aviso)

    ws6.autofilter(4, 0, 5 + max(len(meses_concil), 1), len(cabs6) - 1)

    # ═══════════════════════════════════════════════════════════════════════════
    # ABA 7 — PORTARIAS E FONTES
    # ═══════════════════════════════════════════════════════════════════════════
    if incluir_portarias:
        ws7 = wb.add_worksheet("PORTARIAS E FONTES")
        ws7.set_zoom(85)
        ws7.freeze_panes(5, 2)
        _cabecalho_ident(ws7, exercicio)

        cabs7 = [
            "Nº PORTARIA", "ANO", "DATA", "GRUPO", "AÇÃO", "AÇÃO DETALHADA",
            "OBJETO", "TIPO", "LINK OFICIAL",
            "FONTE", "OBS.", "DESPESAS PERMITIDAS", "DESPESAS NÃO PERMITIDAS",
        ]
        for col, cab in enumerate(cabs7):
            ws7.write(4, col, cab, f_cab)
        ws7.set_column(0, 1, 22)
        ws7.set_column(2, 2, 12)
        ws7.set_column(3, 7, 20)
        ws7.set_column(8, 8, 50)
        ws7.set_column(9, 12, 30)

        for i, p in enumerate(PORTARIAS):
            row = 5 + i
            alt = i % 2 == 0
            fb = f_cel2 if alt else f_cel
            ws7.write(row, 0, p["numero"], fb)
            ws7.write_number(row, 1, p["ano"], fb)
            ws7.write(row, 2, p["data"], fb)
            ws7.write(row, 3, p["grupo"], fb)
            ws7.write(row, 4, p["acao"], fb)
            ws7.write(row, 5, p["acao_det"], fb)
            ws7.write(row, 6, p["objeto"], fb)
            ws7.write(row, 7, p["tipo"], fb)
            ws7.write_url(row, 8, p["link"], f_url, p["link"])
            ws7.write(row, 9, p["fonte"], fb)
            ws7.write(row, 10, p["obs"], fb)
            ws7.write(row, 11, p["permitidas"], fb)
            ws7.write(row, 12, p["nao_permitidas"], fb)

        ws7.autofilter(4, 0, 5 + len(PORTARIAS), len(cabs7) - 1)

    # ═══════════════════════════════════════════════════════════════════════════
    # ABA 8 — PENDÊNCIAS
    # ═══════════════════════════════════════════════════════════════════════════
    ws8 = wb.add_worksheet("PENDÊNCIAS")
    ws8.set_zoom(85)
    ws8.freeze_panes(5, 3)
    _cabecalho_ident(ws8, exercicio)

    cabs8 = [
        "GRUPO", "AÇÃO", "INCENTIVO", "PORTARIA", "VL RECEBIDO (R$)",
        "EXECUÇÃO INFORMADA", "PROBLEMA IDENTIFICADO",
        "PROVIDÊNCIA NECESSÁRIA", "RESPONSÁVEL", "PRAZO", "PRIORIDADE", "SITUAÇÃO",
    ]
    for col, cab in enumerate(cabs8):
        ws8.write(4, col, cab, f_cab)
    ws8.set_column(0, 3, 18)
    ws8.set_column(4, 5, 16)
    ws8.set_column(6, 11, 24)

    # Gera pendências automáticas
    pendencias = []
    for r in fns_data:
        vl = r["valor_liquido"]
        if vl and vl > 0 and not r.get("acao_detalhada"):
            pendencias.append({
                "grupo": r["tipo_incentivo"] or "",
                "acao": r["acao"] or "",
                "incentivo": "Ação não identificada",
                "portaria": r["numero_portaria"] or "",
                "vl_recebido": vl,
                "exec": "Não informada",
                "problema": "Registro sem ação/descrição detalhada — classificação incompleta",
                "providencia": "Sincronizar novamente ou verificar fonte FNS",
                "responsavel": "Setor Financeiro",
                "prazo": "30 dias",
                "prioridade": "MÉDIA",
                "situacao": "PENDENTE",
            })

    if not exec_data and fns_data:
        pendencias.append({
            "grupo": "TODOS",
            "acao": "Todos os repasses",
            "incentivo": f"Total: {_brl(total_fns)}",
            "portaria": "Múltiplas",
            "vl_recebido": total_fns,
            "exec": "Não cadastrada",
            "problema": "Recursos recebidos sem execução financeira cadastrada no ERSUS360",
            "providencia": "Cadastrar empenhos, liquidações e pagamentos no módulo financeiro",
            "responsavel": "Contador / Tesoureiro",
            "prazo": "Imediato",
            "prioridade": "ALTA",
            "situacao": "PENDENTE",
        })

    for r in fns_data:
        vl = r["valor_liquido"]
        if vl and vl > 0 and not r.get("numero_portaria"):
            pendencias.append({
                "grupo": r["tipo_incentivo"] or "",
                "acao": r["acao"] or "Não identificada",
                "incentivo": r["tipo_incentivo"] or "",
                "portaria": "NÃO VINCULADA",
                "vl_recebido": vl,
                "exec": "Não vinculada",
                "problema": "Repasse sem portaria vinculada",
                "providencia": "Identificar portaria correspondente e vincular no sistema",
                "responsavel": "Setor Jurídico/Financeiro",
                "prazo": "15 dias",
                "prioridade": "MÉDIA",
                "situacao": "PENDENTE",
            })

    prioridade_fmt = {
        "ALTA": f_verm_f,
        "MÉDIA": f_amar,
        "BAIXA": f_verde,
    }

    if pendencias:
        for i, p in enumerate(pendencias[:200]):  # limita 200 para performance
            row = 5 + i
            alt = i % 2 == 0
            fb = f_cel2 if alt else f_cel
            fm = f_brl2 if alt else f_brl
            ws8.write(row, 0, p["grupo"], fb)
            ws8.write(row, 1, p["acao"], fb)
            ws8.write(row, 2, p["incentivo"], fb)
            ws8.write(row, 3, p["portaria"], fb)
            ws8.write_number(row, 4, p["vl_recebido"] or 0, fm) if p.get("vl_recebido") else ws8.write(row, 4, "", fb)
            ws8.write(row, 5, p["exec"], fb)
            ws8.write(row, 6, p["problema"], fb)
            ws8.write(row, 7, p["providencia"], fb)
            ws8.write(row, 8, p["responsavel"], fb)
            ws8.write(row, 9, p["prazo"], fb)
            ws8.write(row, 10, p["prioridade"], prioridade_fmt.get(p["prioridade"], fb))
            ws8.write(row, 11, p["situacao"], f_amar)
    else:
        ws8.merge_range("A6:L6", "Nenhuma pendência identificada automaticamente.", f_verde)

    ws8.autofilter(4, 0, 5 + max(len(pendencias), 1), len(cabs8) - 1)

    # ═══════════════════════════════════════════════════════════════════════════
    # ABA 9 — BASE DE DADOS
    # ═══════════════════════════════════════════════════════════════════════════
    ws9 = wb.add_worksheet("BASE DE DADOS")
    ws9.set_zoom(75)
    ws9.freeze_panes(5, 3)
    _cabecalho_ident(ws9, exercicio)

    cabs9 = [
        "ID", "MUNICÍPIO", "IBGE", "CNPJ FMS", "EXERCÍCIO", "COMPETÊNCIA",
        "DATA PAGAMENTO", "GRUPO", "AÇÃO", "AÇÃO DETALHADA", "TIPO INCENTIVO",
        "BLOCO", "CUSTEIO/INVEST.", "PORTARIA", "LINK",
        "FONTE", "VALOR BRUTO", "DESCONTO", "VALOR LÍQUIDO",
        "EMPENHADO", "LIQUIDADO", "PAGO", "SALDO",
        "STATUS", "DATA COLETA", "ID ORIGINAL",
    ]
    for col, cab in enumerate(cabs9):
        ws9.write(4, col, cab, f_cab)
    ws9.set_column(0, 5, 12)
    ws9.set_column(6, 14, 18)
    ws9.set_column(15, 24, 16)

    for i, r in enumerate(fns_data):
        row = 5 + i
        alt = i % 2 == 0
        fb = f_cel2 if alt else f_cel
        fm = f_brl2 if alt else f_brl
        ws9.write_number(row, 0, i + 1, fb)
        ws9.write(row, 1, MUNICIPIO, fb)
        ws9.write(row, 2, IBGE, fb)
        ws9.write(row, 3, CNPJ_FMS, fb)
        ws9.write_number(row, 4, exercicio, fb)
        ws9.write(row, 5, r["competencia"] or "", fb)
        dp = r.get("data_pagamento")
        if isinstance(dp, (date, datetime)):
            ws9.write_datetime(row, 6, dp, f_data)
        else:
            ws9.write(row, 6, "", fb)
        ws9.write(row, 7, r["grupo"] or "", fb)
        ws9.write(row, 8, r["acao"] or "", fb)
        ws9.write(row, 9, r["acao_detalhada"] or "", fb)
        ws9.write(row, 10, r["tipo_incentivo"] or "", fb)
        ws9.write(row, 11, r["bloco"] or "", fb)
        ws9.write(row, 12, "Custeio", fb)
        ws9.write(row, 13, r["numero_portaria"] or "", fb)
        ws9.write(row, 14, "", fb)
        ws9.write(row, 15, r["fonte"] or "", fb)
        ws9.write_number(row, 16, r["valor_total"] or 0, fm) if r["valor_total"] else ws9.write(row, 16, "", fb)
        ws9.write_number(row, 17, r["valor_desconto"] or 0, fm)
        ws9.write_number(row, 18, r["valor_liquido"] or 0, fm) if r["valor_liquido"] else ws9.write(row, 18, "", fb)
        ws9.write(row, 19, "", fb)
        ws9.write(row, 20, "", fb)
        ws9.write(row, 21, "", fb)
        ws9.write_formula(row, 22,
            f"=IFERROR(S{row+1}-V{row+1},\"\")", fm)  # Saldo = líquido - pago
        ws9.write(row, 23, r["situacao"] or "", fb)
        dc = r.get("data_coleta")
        if isinstance(dc, datetime):
            ws9.write_datetime(row, 24, dc, f_data)
        else:
            ws9.write(row, 24, str(dc)[:10] if dc else "", fb)
        ws9.write_number(row, 25, r["id"] or 0, fb)

    ws9.autofilter(4, 0, 5 + max(len(fns_data), 1), len(cabs9) - 1)

    # ═══════════════════════════════════════════════════════════════════════════
    # ABA — AVISOS DE VALIDAÇÃO (se houver inconsistências)
    # ═══════════════════════════════════════════════════════════════════════════
    avisos = []
    if not fns_data:
        avisos.append({
            "registro": "FNS", "campo": "Total de registros",
            "valor": "0", "problema": "Nenhum dado FNS coletado",
            "providencia": "Sincronizar dados na aba Repasses do FNS",
        })
    for r in fns_data:
        if r["valor_total"] and r["valor_liquido"]:
            esperado = r["valor_total"] - (r["valor_desconto"] or 0)
            if abs(esperado - r["valor_liquido"]) > 0.02:
                avisos.append({
                    "registro": f"ID {r['id']}",
                    "campo": "valor_liquido",
                    "valor": f"{r['valor_liquido']}",
                    "problema": f"Líquido ({r['valor_liquido']}) ≠ Bruto − Desconto ({esperado:.2f})",
                    "providencia": "Verificar na fonte FNS",
                })

    if avisos:
        wsa = wb.add_worksheet("AVISOS DE VALIDAÇÃO")
        _cabecalho_ident(wsa, exercicio)
        cabs_a = ["REGISTRO", "CAMPO", "VALOR", "PROBLEMA", "PROVIDÊNCIA RECOMENDADA"]
        for col, cab in enumerate(cabs_a):
            wsa.write(4, col, cab, f_cab)
        wsa.set_column(0, 4, 30)
        for i, a in enumerate(avisos):
            row = 5 + i
            alt = i % 2 == 0
            fb = f_cel2 if alt else f_cel
            wsa.write(row, 0, a["registro"], fb)
            wsa.write(row, 1, a["campo"], fb)
            wsa.write(row, 2, a["valor"], fb)
            wsa.write(row, 3, a["problema"], f_verm_f)
            wsa.write(row, 4, a["providencia"], f_amar)

    # ── Rodapés ───────────────────────────────────────────────────────────────
    rodape = (
        f"&L{MUNICIPIO} · FMS · CNPJ {CNPJ_FMS}&C Exercício {exercicio}&R"
        f"Gerado pelo ERSUS 360 em {agora.strftime('%d/%m/%Y %H:%M')} · Pág. &P de &N"
    )
    for ws in [ws1, ws2, ws3, ws4, ws5, ws6, ws8, ws9]:
        ws.set_footer(rodape)

    wb.close()
    output.seek(0)
    return output.read()
