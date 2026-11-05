"""
InvestSUS — relatórios da Execução Financeira (PDF e Excel).

Montados a partir das mesmas respostas do painel/ficha (routers/investsus_execucao.py),
então o relatório mostra exatamente o que a tela mostra. Valor sem registro aparece
como "—" e cada documento identifica o que é oficial e o que é lançado pelo município.
"""
from __future__ import annotations

import io
from dataclasses import dataclass, field
from datetime import datetime

TIPOS = {
    "consolidado": "Execução financeira consolidada",
    "individual": "Execução individual do plano de trabalho",
    "modalidade": "Execução por modalidade de recurso",
    "area": "Execução por área assistencial",
    "saldos": "Saldos financeiros",
    "pendencias": "Pendências da execução financeira",
}

AVISO_FONTES = ("Aprovado e recebido: dados oficiais do InvestSUS/FNS sincronizados no ERSUS360. "
                "Empenhado, liquidado, pago, rendimentos e devoluções: registrados pelo município "
                "(manual ou planilha) — não são dados confirmados pelo FNS.")


class Moeda(float):
    """Valor monetário: R$ no PDF, número formatado no Excel."""


@dataclass
class Tabela:
    colunas: list[str]
    linhas: list[list]


@dataclass
class Secao:
    titulo: str
    paragrafos: list[str] = field(default_factory=list)
    tabelas: list[Tabela] = field(default_factory=list)


@dataclass
class Documento:
    titulo: str
    subtitulo: str
    secoes: list[Secao] = field(default_factory=list)
    aviso: str = AVISO_FONTES


def _m(v) -> Moeda | None:
    return None if v is None else Moeda(round(float(v), 2))


def _pct(v) -> str:
    return "—" if v is None else f"{v:.1f}%".replace(".", ",")


def _brl(v: float) -> str:
    txt = "R$ " + f"{abs(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("−" + txt) if v < 0 else txt


def _dt(d: str | None) -> str | None:
    return "/".join(reversed(d[:10].split("-"))) if d else None


ROTULO_TIPO = {"empenho": "Empenho", "anulacao_empenho": "Anulação de empenho", "liquidacao": "Liquidação",
               "estorno_liquidacao": "Estorno de liquidação", "pagamento": "Pagamento",
               "estorno_pagamento": "Estorno de pagamento"}
ROTULO_NIVEL = {"critico": "Crítico", "urgente": "Urgente", "atencao": "Atenção", "informativo": "Informativo"}


def _txt(v) -> str:
    if v is None or v == "":
        return "—"
    if isinstance(v, Moeda):
        return _brl(v)
    return str(v)


def _filtros(painel: dict) -> str:
    f = painel["filtros"]
    partes = [f"Exercício {f['exercicio']}" if f.get("exercicio") else "Todos os exercícios"]
    if f.get("origem"):
        partes.append(painel["opcoes"]["origens"].get(f["origem"], f["origem"]))
    if f.get("destinacao"):
        partes.append(painel["opcoes"]["destinacoes"].get(f["destinacao"], f["destinacao"]))
    return " · ".join(partes)


def _sub(painel: dict) -> str:
    return f"{painel.get('municipio') or ''} (IBGE {painel.get('municipio_ibge') or '—'}) · {_filtros(painel)}"


def _indicadores(painel: dict) -> Secao:
    i = painel["indicadores"]
    linhas = [
        ["Propostas", i["total_propostas"]], ["Planos de trabalho cadastrados", i["total_planos"]],
        ["Valor aprovado", _m(i["aprovado"])], ["Recebido do FNS", _m(i["recebido"])],
        ["   dos quais de emendas parlamentares", _m(i["recebido_emendas"])],
        ["Aprovado ainda não recebido", _m(i["saldo_a_receber"])],
        ["Empenhado", _m(i["empenhado"])], ["Liquidado", _m(i["liquidado"])], ["Pago", _m(i["pago"])],
        ["Saldo financeiro disponível", _m(i["saldo_financeiro"])],
        ["Saldo de planos ainda não executado", _m(i["saldo_plano"])],
        ["% de execução financeira (pago ÷ previsto)", _pct(i["perc_execucao"])],
        ["Aprovado de propostas sem plano cadastrado", _m(i["aprovado_sem_plano"])],
    ]
    return Secao("Indicadores", tabelas=[Tabela(["Indicador", "Valor"], linhas)])


def _linhas_props(props: list[dict]) -> list[list]:
    return [[p["numero_proposta"], p["exercicio"], p["origem_rotulo"], p["destinacao_rotulo"],
             _m(p["aprovado"]), _m(p["recebido"]), _m(p["empenhado"]), _m(p["liquidado"]), _m(p["pago"]),
             _m(p["saldo_financeiro"]), _m(p["saldo_plano"]), _pct(p["perc_execucao"]),
             "sem lançamento" if p["sem_lancamento"] else ""] for p in props]


COLS_PROPS = ["Proposta", "Exerc.", "Origem", "Área", "Aprovado", "Recebido", "Empenhado", "Liquidado", "Pago",
              "Saldo financeiro", "Saldo do plano", "% exec.", "Obs."]


def _cons(linhas: list[dict], com_aprovado: bool) -> Tabela:
    if com_aprovado:
        cols = ["Modalidade", "Qtd", "Aprovado", "Recebido", "Pago", "Saldo financeiro"]
        ls = [[l["rotulo"], l["qtd"], _m(l["aprovado"]), _m(l["recebido"]), _m(l["pago"]), _m(l["saldo_financeiro"])]
              for l in linhas]
    else:
        cols = ["Área", "Qtd", "Recebido", "Empenhado", "Liquidado", "Pago", "Saldo financeiro"]
        ls = [[l["rotulo"], l["qtd"], _m(l["recebido"]), _m(l["empenhado"]), _m(l["liquidado"]), _m(l["pago"]),
               _m(l["saldo_financeiro"])] for l in linhas]
    tot = ["TOTAL GERAL", sum(l["qtd"] for l in linhas)] + [
        _m(sum(float(r[i] or 0) for r in ls)) for i in range(2, len(cols))]
    return Tabela(cols, ls + [tot])


def montar(tipo: str, painel: dict, alertas: dict, ficha: dict | None) -> Documento:
    titulo = TIPOS[tipo]
    c = painel["consolidado"]
    if tipo == "consolidado":
        return Documento(titulo, _sub(painel), [
            _indicadores(painel),
            Secao("Propostas", tabelas=[Tabela(COLS_PROPS, _linhas_props(painel["propostas"]))]),
        ])
    if tipo == "modalidade":
        return Documento(titulo, _sub(painel), [
            Secao("Consolidação por modalidade de recurso",
                  ["Cada proposta entra uma única vez; uma emenda destinada à MAC aparece também no total MAC "
                   "do relatório por área, sem duplicar o total geral."],
                  [_cons(c["por_origem"], True)]),
            Secao("Origem × área", tabelas=[Tabela(
                ["Origem", "Área", "Qtd", "Aprovado", "Recebido", "Pago", "Saldo financeiro"],
                [[painel["opcoes"]["origens"].get(m["origem"], "A classificar"),
                  painel["opcoes"]["destinacoes"].get(m["destinacao"], "A classificar"), m["qtd"],
                  _m(m["aprovado"]), _m(m["recebido"]), _m(m["pago"]), _m(m["saldo_financeiro"])]
                 for m in c["matriz"]])]),
        ])
    if tipo == "area":
        return Documento(titulo, _sub(painel), [
            Secao("Consolidação por área de aplicação", tabelas=[_cons(c["por_destinacao"], False)]),
        ])
    if tipo == "saldos":
        ls = []
        for p in painel["propostas"]:
            mv = p["movimentos"]
            ls.append([p["numero_proposta"], _m(mv["saldo_inicial"]), _m(p["recebido"]), _m(mv["rendimento"]),
                       _m(p["pago"]), _m(mv["devolucao"]), _m(mv["outra_saida"]), _m(p["saldo_financeiro"]),
                       _m(p["saldo_extrato"]), _m(p["diferenca_conciliacao"])])
        return Documento(titulo, _sub(painel), [Secao(
            "Demonstrativo por proposta",
            ["Saldo financeiro = saldo inicial + repasses recebidos + rendimentos − pagamentos − devoluções − "
             "outras saídas. É diferente do saldo do plano ainda não executado."],
            [Tabela(["Proposta", "Saldo inicial", "Recebido FNS", "Rendimentos", "Pagamentos", "Devoluções",
                     "Outras saídas", "Saldo calculado", "Saldo do extrato", "Diferença"], ls)])])
    if tipo == "pendencias":
        ls = [[a["numero_proposta"], ROTULO_NIVEL.get(a["nivel"], a["nivel"]), a["problema"] + (f" ({a['acao']})" if a.get("acao") else ""),
               a.get("responsavel"), a["providencia"]] for a in alertas["alertas"]]
        sem = [p for p in painel["propostas"] if p["sem_lancamento"]]
        return Documento(titulo, _sub(painel), [
            Secao("Pendências e alertas", [alertas["aviso"]],
                  [Tabela(["Proposta", "Nível", "Problema", "Responsável", "Providência recomendada"], ls)]),
            Secao("Propostas sem lançamento de execução", tabelas=[Tabela(
                ["Proposta", "Exercício", "Aprovado", "Recebido"],
                [[p["numero_proposta"], p["exercicio"], _m(p["aprovado"]), _m(p["recebido"])] for p in sem])]),
        ])
    # individual
    assert ficha is not None
    idf, r = ficha["identificacao"], ficha["resumo"]
    acoes = [a for a in ficha["acoes"] if a["ativa"]]
    lanc = [[a["descricao"], ROTULO_TIPO.get(l["tipo"], l["tipo"]), _dt(l["data"]), _m(l["valor"]), l["fornecedor"], l["numero_empenho"],
             l["ordem_bancaria"], l["documento_comprobatorio"], l["origem_dado"], l["status_validacao"]]
            for a in ficha["acoes"] for l in a["lancamentos"] if not l["cancelado"]]
    tot = ["TOTAL", _m(sum(a["previsto_original"] for a in acoes)), _m(sum(a["previsto"] for a in acoes)),
           _m(sum(a["empenhado"] for a in acoes)), _m(sum(a["liquidado"] for a in acoes)),
           _m(sum(a["pago"] for a in acoes)), _m(sum(a["saldo_a_pagar"] for a in acoes)),
           _m(sum(a["saldo_plano"] for a in acoes)), _pct(r["perc_execucao"])]
    return Documento(f"{titulo} — proposta {idf['numero_proposta']}",
                     f"{idf['municipio']} (IBGE {idf['municipio_ibge'] or '—'}) · exercício {idf['exercicio'] or '—'}", [
        Secao("Identificação", tabelas=[Tabela(["Campo", "Informação"], [
            ["Proposta", idf["numero_proposta"]], ["Emenda", idf["numero_emenda"]],
            ["Origem", ficha["classificacao"]["origem_rotulo"]], ["Área", ficha["classificacao"]["destinacao_rotulo"]],
            ["Objeto", idf["objeto"]], ["Programa/ação", (ficha["ficha"] or {}).get("programa_acao") or idf["acao_orcamentaria"]],
            ["Situação da proposta", idf["situacao_proposta_texto"] or idf["fase_rotulo"]],
            ["Prazo de execução", _dt((ficha["ficha"] or {}).get("prazo_execucao"))],
            ["Responsável", (ficha["ficha"] or {}).get("responsavel")]])]),
        Secao("Resumo financeiro", tabelas=[Tabela(["Item", "Valor"], [
            ["Valor aprovado (oficial)", _m(r["aprovado"])], ["Recebido do FNS (oficial)", _m(r["recebido"])],
            ["A receber do FNS", _m(r["saldo_a_receber"])], ["Valor do plano de trabalho", _m(r["valor_plano"])],
            ["Empenhado", _m(r["empenhado"])], ["Liquidado", _m(r["liquidado"])], ["Pago", _m(r["pago"])],
            ["Saldo financeiro disponível", _m(r["saldo_financeiro"])],
            ["Saldo do plano não executado", _m(r["saldo_plano"])], ["% de execução", _pct(r["perc_execucao"])]])]),
        Secao("Execução por ação (previsto × executado)", tabelas=[Tabela(
            ["Ação/Despesa", "Previsto original", "Previsto atual", "Empenhado", "Liquidado", "Pago",
             "Saldo a pagar", "Saldo do plano", "% exec."],
            [[a["descricao"], _m(a["previsto_original"]), _m(a["previsto"]), _m(a["empenhado"]), _m(a["liquidado"]),
              _m(a["pago"]), _m(a["saldo_a_pagar"]), _m(a["saldo_plano"]), _pct(a["perc_execucao"])]
             for a in acoes] + ([tot] if acoes else []))]
            if acoes else [], paragrafos=[] if acoes else ["Nenhuma ação cadastrada no plano de trabalho."]),
        Secao("Lançamentos", paragrafos=[] if lanc else ["Não houve lançamento de execução."],
              tabelas=[Tabela(["Ação", "Tipo", "Data", "Valor", "Fornecedor", "Empenho", "OB", "Documento",
                               "Origem", "Validação"], lanc)] if lanc else []),
        Secao("Pendências", paragrafos=[f"[{ROTULO_NIVEL.get(a['nivel'], a['nivel'])}] {a['problema']} → {a['providencia']}"
                                        for a in ficha["alertas"]] or ["Nenhuma pendência identificada."]),
    ])


def pdf(doc: Documento, gerado_por: str) -> bytes:
    from xml.sax.saxutils import escape

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    buf = io.BytesIO()
    tam = landscape(A4)
    pdf_ = SimpleDocTemplate(buf, pagesize=tam, leftMargin=1.2 * cm, rightMargin=1.2 * cm, topMargin=1.2 * cm,
                             bottomMargin=1.2 * cm, title=doc.titulo, author="ERSUS360")
    ss = getSampleStyleSheet()
    cel = ParagraphStyle("cel", parent=ss["BodyText"], fontSize=7, leading=8.5)
    num = ParagraphStyle("num", parent=cel, alignment=2)
    aviso = ParagraphStyle("av", parent=ss["BodyText"], fontSize=8, textColor=colors.HexColor("#92400e"))
    largura = tam[0] - 2.4 * cm
    el = [Paragraph(escape(doc.titulo), ss["Title"]), Paragraph(escape(doc.subtitulo), ss["Normal"]),
          Paragraph(escape(f"Gerado em {datetime.now():%d/%m/%Y %H:%M} por {gerado_por} · ERSUS360 — InvestSUS"),
                    ss["Normal"]),
          Paragraph(escape(doc.aviso), aviso), Spacer(1, 6)]
    for s in doc.secoes:
        el.append(Paragraph(escape(s.titulo), ss["Heading3"]))
        for p in s.paragrafos:
            el.append(Paragraph(escape(p), ss["BodyText"]))
        for t in s.tabelas:
            dados = [[Paragraph(f"<b>{escape(c)}</b>", cel) for c in t.colunas]]
            for ln in t.linhas:
                dados.append([Paragraph(escape(_txt(v)), num if isinstance(v, (Moeda, int)) else cel) for v in ln])
            larg_primeira = largura * (0.22 if len(t.colunas) > 4 else 0.4)
            resto = (largura - larg_primeira) / max(1, len(t.colunas) - 1)
            tb = Table(dados, repeatRows=1, colWidths=[larg_primeira] + [resto] * (len(t.colunas) - 1))
            estilo = [("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#dbeafe")),
                      ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#94a3b8")),
                      ("VALIGN", (0, 0), (-1, -1), "TOP")]
            if t.linhas and str(t.linhas[-1][0]).startswith("TOTAL"):
                estilo.append(("BACKGROUND", (0, len(dados) - 1), (-1, len(dados) - 1), colors.HexColor("#f1f5f9")))
            tb.setStyle(TableStyle(estilo))
            el += [Spacer(1, 3), tb]
        el.append(Spacer(1, 6))
    pdf_.build(el)
    return buf.getvalue()


def xlsx(doc: Documento, gerado_por: str) -> bytes:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill

    wb = Workbook()
    ws = wb.active
    ws.title = "Relatório"
    ws.append([doc.titulo])
    ws["A1"].font = Font(bold=True, size=14)
    ws.append([doc.subtitulo])
    ws.append([f"Gerado em {datetime.now():%d/%m/%Y %H:%M} por {gerado_por} · ERSUS360 — InvestSUS"])
    ws.append([doc.aviso])
    for s in doc.secoes:
        ws.append([])
        ws.append([s.titulo])
        ws.cell(ws.max_row, 1).font = Font(bold=True)
        for p in s.paragrafos:
            ws.append([p])
        for t in s.tabelas:
            ws.append(t.colunas)
            for c in ws[ws.max_row]:
                c.font = Font(bold=True)
                c.fill = PatternFill("solid", fgColor="DBEAFE")
            for ln in t.linhas:
                ws.append([float(v) if isinstance(v, Moeda) else (v if isinstance(v, (int, float)) else _txt(v))
                           for v in ln])
                for c, v in zip(ws[ws.max_row], ln):
                    if isinstance(v, Moeda):
                        c.number_format = '"R$" #,##0.00'
    for i, col in enumerate("ABCDEFGHIJKLM"):
        ws.column_dimensions[col].width = 34 if i == 0 else 17
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
