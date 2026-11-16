"""
PDF da Análise Técnica de uma portaria do FNS (para imprimir e enviar por e-mail).

Usa exatamente o resultado do Agente de Análise das Portarias (services/fns_portarias_agente.detalhe):
nada é recalculado aqui. A4 retrato, cabeçalho com município/exercício, rodapé com página e aviso consultivo.
"""
from __future__ import annotations

import io
from datetime import datetime
from xml.sax.saxutils import escape

MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


def _brl(v) -> str:
    if v is None:
        return "—"
    s = f"{float(v):,.2f}"
    return "R$ " + s.replace(",", "X").replace(".", ",").replace("X", ".")


def _data(s: str | None) -> str:
    if not s:
        return "—"
    s = s[:10]
    return f"{s[8:10]}/{s[5:7]}/{s[:4]}" if len(s) == 10 and s[4] == "-" else s


def _txt(v) -> str:
    """Texto seguro para o Paragraph do reportlab (escapa < > & e troca símbolos fora da fonte padrão)."""
    s = "" if v is None else str(v)
    for de, para in (("→", "->"), ("✓", ""), ("≤", "<="), ("≥", ">=")):
        s = s.replace(de, para)
    return escape(s).replace("\n", "<br/>")


def nome_arquivo(numero: str, exercicio: int) -> str:
    base = "sem-portaria" if not any(ch.isdigit() for ch in numero) else "".join(ch for ch in numero if ch.isdigit())
    return f"relatorio-tecnico-portaria-{base}-{exercicio}.pdf"


def gerar(r: dict, *, municipio: str | None, gerado_por: str | None) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    AZUL = colors.HexColor("#283593")
    CINZA = colors.HexColor("#6b7280")
    FUNDO = colors.HexColor("#e8eaf6")
    BORDA = colors.HexColor("#c5cae9")
    COR_CLASSE = {"PERMITIDO": "#2e7d32", "PERMITIDO COM CONDIÇÕES": "#1565c0", "VEDADO": "#c62828",
                  "EXIGE ANÁLISE COMPLEMENTAR": "#b45309"}

    numero = r.get("numero_portaria") or "—"
    exercicio = r.get("exercicio")
    ident = r.get("identificacao") or {}
    links = r.get("links") or {}
    titulo_doc = ("Transferências sem portaria identificada" if numero == "Sem portaria"
                  else f"Portaria nº {links.get('numero_formatado') or numero}")

    buf = io.BytesIO()
    larg = A4[0] - 3.6 * cm
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=1.8 * cm, rightMargin=1.8 * cm, topMargin=1.6 * cm,
                            bottomMargin=1.8 * cm, title=f"Análise técnica — {titulo_doc} — {exercicio}",
                            author="ERSUS360", subject="Análise técnica de portaria do FNS")
    ss = getSampleStyleSheet()
    corpo = ParagraphStyle("corpo", parent=ss["BodyText"], fontSize=9, leading=12)
    peq = ParagraphStyle("peq", parent=corpo, fontSize=7.8, leading=10)
    rot = ParagraphStyle("rot", parent=peq, textColor=CINZA)
    h1 = ParagraphStyle("h1", parent=ss["Title"], fontSize=16, leading=20, textColor=AZUL, spaceAfter=2)
    sub = ParagraphStyle("sub", parent=corpo, alignment=TA_CENTER, textColor=CINZA, fontSize=8.5)
    h2 = ParagraphStyle("h2", parent=ss["Heading3"], fontSize=10.5, textColor=AZUL, spaceBefore=10, spaceAfter=4)
    caixa = ParagraphStyle("caixa", parent=corpo, backColor=FUNDO, borderColor=BORDA, borderWidth=0.5,
                           borderPadding=6, spaceBefore=10, spaceAfter=8)

    def tabela(linhas, larguras, cabecalho=True, zebra=True):
        t = Table(linhas, colWidths=larguras, repeatRows=1 if cabecalho else 0)
        estilo = [("GRID", (0, 0), (-1, -1), 0.25, BORDA), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                  ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4)]
        if cabecalho:
            estilo.append(("BACKGROUND", (0, 0), (-1, 0), FUNDO))
        if zebra:
            for i in range(1 if cabecalho else 0, len(linhas)):
                if i % 2 == 0:
                    estilo.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#fafbfc")))
        t.setStyle(TableStyle(estilo))
        return t

    def P(v, st=corpo):
        return Paragraph(_txt(v), st)

    el = [Paragraph("RELATÓRIO TÉCNICO DA PORTARIA — FUNDO NACIONAL DE SAÚDE", sub),
          Paragraph(_txt(titulo_doc), h1),
          Paragraph(_txt(f"{municipio or ident.get('municipio') or ''} · Exercício {exercicio} · "
                         f"Natureza: {', '.join(r.get('naturezas') or ['EM ANÁLISE'])} · "
                         f"Emitido em {datetime.now().strftime('%d/%m/%Y')}"), sub),
          Spacer(1, 6)]

    # Situação da validação (sempre no topo)
    estado = r.get("estado_validacao") or "ANÁLISE PENDENTE"
    cor_estado = {"VALIDADA PELO RESPONSÁVEL": "#2e7d32", "AGUARDANDO VALIDAÇÃO TÉCNICA": "#1565c0",
                  "FUNDAMENTAÇÃO CONFERIDA": "#1565c0", "NORMA LOCALIZADA": "#b45309"}.get(estado, "#c62828")
    txt_val = (f"Validada por {r['validacao']['por']} em {_data(r['validacao']['em'])}"
               if r.get("validacao") else (r.get("estado_motivo") or ""))
    el.append(Paragraph(f'<b>Situação da validação:</b> <font color="{cor_estado}"><b>{_txt(estado)}</b></font>'
                        f' — {_txt(txt_val)}', caixa))

    # Documento oficial
    rep_ = r.get("portaria_repasse") or {}
    el.append(Paragraph("Portaria de repasse", h2))
    if rep_.get("papel"):
        el.append(P(rep_["papel"] + ".", peq))
    cad = (links.get("cadastrado") or [None])[0]
    if cad:
        el.append(P(f"Portaria {cad.get('orgao') or 'GM/MS'} nº {links.get('numero_formatado') or numero}"
                    + (f"/{cad['ano']}" if cad.get("ano") else "")
                    + (f" — publicada em {_data(cad['data_publicacao'])}" if cad.get("data_publicacao") else "")))
        el.append(Paragraph(f'<link href="{escape(cad["link"])}" color="#1565c0">{_txt(cad["link"])}</link>', peq))
    elif links.get("dou"):
        el.append(P("Link não confirmado no catálogo. Encontrada(s) no DOU pela captura diária (conferir o ano):"))
        for d in links["dou"]:
            el.append(Paragraph(f'{_txt(d.get("titulo"))} — <link href="{escape(d["link"])}" color="#1565c0">'
                                f'{_txt(d["link"])}</link>', peq))
    elif numero == "Sem portaria":
        el.append(P("O FNS não informou número de portaria para estas transferências."))
    else:
        el.append(P("Link oficial ainda não cadastrado. O FNS informa só o número da portaria, sem o ano."))
        if links.get("busca_dou"):
            el.append(Paragraph(f'Busca no DOU: <link href="{escape(links["busca_dou"])}" color="#1565c0">'
                                f'{_txt(links["busca_dou"])}</link>', peq))

    # Portaria de repasse × normas de origem e regulamentação
    vinc = r.get("programas_vinculados") or []
    if vinc or r.get("programas_sem_norma"):
        el.append(Paragraph("Normas de origem e regulamentação do recurso", h2))
        el.append(P("A portaria de repasse autoriza a transferência; as regras de aplicação vêm das normas abaixo.", peq))
        for v in vinc:
            el.append(Paragraph(f"<b>{_txt(v['nome'])}</b> — {_txt(_brl(v.get('valor')))}", corpo))
            if v.get("pendente"):
                el.append(Paragraph(f'<font color="#c62828">{_txt(v["pendente"])}</font>', peq))
                continue
            linhas_n = [[P("Papel", peq), P("Norma e dispositivo", peq), P("O que diz", peq), P("Conferência", peq)]]
            for n in v.get("normas") or []:
                conf = ("Conferido no texto oficial" + (f" em {_data(n.get('verificado_em'))}" if n.get("verificado_em") else "")
                        if n.get("conferido") is True else "Ainda não conferido automaticamente")
                linhas_n.append([P(n.get("papel"), peq),
                                 Paragraph(f'<link href="{escape(n["url"])}" color="#1565c0">{_txt(n["norma"])}, '
                                           f'{_txt(n["dispositivo"])}</link>', peq),
                                 P(n.get("resumo"), peq), P(conf, peq)])
            el.append(tabela(linhas_n, [2.6 * cm, 4.4 * cm, larg - 10.4 * cm, 3.4 * cm]))
        for sn in r.get("programas_sem_norma") or []:
            el.append(Paragraph(f'<font color="#c62828"><b>Sem norma conferida:</b> {_txt(sn["nome"])} — '
                                f'{_txt(_brl(sn.get("valor")))}. Análise pendente.</font>', peq))

    if r.get("como_utilizar"):
        el.append(Paragraph("Como utilizar o recurso", h2))
        for cu in r["como_utilizar"]:
            el.append(Paragraph(f"<b>{_txt(cu['programa'])}:</b> {_txt(cu['limite'])}", corpo))
            for ex in cu.get("exemplos") or []:
                el.append(P(f"• {ex}", peq))

    if r.get("despesas_vedadas"):
        el.append(Paragraph("Despesas vedadas", h2))
        vistos = set()
        for dv in r["despesas_vedadas"]:
            chave = (dv["despesa"], dv["recurso"])
            if chave in vistos:
                continue
            vistos.add(chave)
            el.append(Paragraph(f'<font color="#c62828"><b>{_txt(dv["despesa"])}</b></font> ({_txt(dv["recurso"])}) — '
                                f'{_txt(dv["justificativa"])} <font color="#6b7280">'
                                f'[{_txt("; ".join(dv.get("fundamentacao") or []))}]</font>', peq))

    if r.get("condicoes_execucao"):
        el.append(Paragraph("Condições para execução", h2))
        for c in r["condicoes_execucao"]:
            el.append(P(f"• {c}", peq))

    if r.get("pendencias"):
        el.append(Paragraph("Pendências", h2))
        for p in r["pendencias"]:
            el.append(P(f"• {p}"))

    # Identificação
    el.append(Paragraph("Identificação", h2))
    nats = ident.get("naturezas") or {}
    linhas = [
        ("Número", ident.get("numero")),
        ("Ano / publicação", f"{ident.get('ano')} · {_data(ident.get('data_publicacao'))}" if ident.get("ano")
         else "Não confirmado"),
        ("Natureza do recurso", " · ".join(f"{n}: {_brl(v)}" for n, v in nats.items()) or "—"),
        ("Bloco de financiamento (FNS)", " · ".join(ident.get("blocos") or []) or "Não informado pelo FNS"),
        ("Programa / componente (FNS)", " · ".join(ident.get("programas") or []) or "—"),
        ("Finalidade", ident.get("finalidade")),
        ("Valor transferido", _brl(ident.get("valor_transferido"))),
        ("Município / fundo", f"{ident.get('municipio') or '—'} · FMS {ident.get('fundo_cnpj') or '—'}"),
    ]
    el.append(tabela([[P(k, rot), P(v)] for k, v in linhas], [4.6 * cm, larg - 4.6 * cm], cabecalho=False, zebra=False))

    el.append(Paragraph("Aplicação", h2))
    el.append(P(" · ".join(r.get("aplicacao") or []) or "Nenhuma despesa confirmada — análise complementar."))
    el.append(Paragraph("Restrições", h2))
    el.append(P(" · ".join(r.get("restricoes") or []) or "Nenhuma vedação expressa identificada."))
    el.append(Paragraph("Orientação ao gestor", h2))
    el.append(Paragraph(_txt(r.get("orientacao")), caixa))

    # Despesas permitidas
    for nat, cats in (r.get("despesas") or {}).items():
        el.append(Paragraph(f"Despesas — recurso: {_txt(nat)}", h2))
        cab = [P("Categoria", peq), P("Classificação", peq), P("Justificativa e fundamentação", peq)]
        corpo_t = []
        for c in cats:
            cor = COR_CLASSE.get(c["classificacao"], "#6b7280")
            fund = "; ".join(f"{f['norma']}, {f['dispositivo']}" for f in c.get("fundamentacao") or [])
            corpo_t.append([P(c["rotulo"], peq),
                            Paragraph(f'<font color="{cor}"><b>{_txt(c["classificacao"])}</b></font>', peq),
                            Paragraph(_txt(c["justificativa"]) + (f'<br/><font color="#6b7280">{_txt(fund)}</font>'
                                                                  if fund else ""), peq)])
        el.append(tabela([cab] + corpo_t, [4.2 * cm, 3.4 * cm, larg - 7.6 * cm]))

    # Prazos, saldos e planos
    pz, sd = r.get("prazos") or {}, r.get("saldos") or {}
    plano = pz.get("plano_trabalho") or {}
    el.append(Paragraph("Prazos, saldos e plano de trabalho", h2))
    linhas = [
        ("Prazo de execução", pz.get("prazo_execucao")),
        ("Saldos remanescentes", pz.get("saldos_remanescentes")),
        ("Plano de trabalho", f"{plano.get('exigido', '—')} — {plano.get('texto', '')}"
         + "".join(f"\nProposta {p.get('numero_proposta')}{' · ' + p['objeto'] if p.get('objeto') else ''}"
                   for p in plano.get("propostas") or [])),
        ("Planejamento e orçamento", pz.get("planejamento")),
        ("Monitoramento e prestação de contas", pz.get("monitoramento")),
        ("Reprogramação / devolução", pz.get("reprogramacao_devolucao")),
        ("Valor autorizado (previsto)", _brl(sd.get("autorizado")) if sd.get("autorizado") is not None else "Não registrado"),
        ("Transferido no exercício", _brl(sd.get("transferido"))),
        ("Saldo bancário", sd.get("bancario_nota")),
        ("Saldo contábil", sd.get("contabil_nota")),
        ("Saldo comprometido", f"{_brl(sd['comprometido'])} ({sd.get('comprometido_nota')})"
         if sd.get("comprometido") is not None else sd.get("comprometido_nota")),
        ("Saldo disponível", f"{_brl(sd['disponivel_estimado'])} ({sd.get('disponivel_nota')})"
         if sd.get("disponivel_estimado") is not None else sd.get("disponivel_nota")),
    ]
    el.append(tabela([[P(k, rot), P(v, peq)] for k, v in linhas], [4.6 * cm, larg - 4.6 * cm], cabecalho=False,
                     zebra=False))

    # Transferências
    trs = r.get("transferencias") or []
    if trs:
        el.append(Paragraph(f"Transferências classificadas ({len(trs)})", h2))
        cab = [P(h, peq) for h in ("Mês", "OB", "Programa", "Natureza", "Parcela", "Valor")]
        lin = [[P(MESES[t["mes"] - 1] if t.get("mes") else "—", peq), P(t.get("numero_ob") or "—", peq),
                P(t.get("programa") or "—", peq), P(t.get("natureza"), peq), P(t.get("parcela_fns") or "—", peq),
                P(_brl(t.get("valor_liquido")), peq)] for t in trs]
        lin.append([P("", peq), P("", peq), Paragraph("<b>Total</b>", peq), P("", peq), P("", peq),
                    Paragraph(f"<b>{_txt(_brl(ident.get('valor_transferido')))}</b>", peq)])
        el.append(tabela([cab] + lin, [1.2 * cm, 1.6 * cm, larg - 9.0 * cm, 2.4 * cm, 1.8 * cm, 2.0 * cm]))

    # Fundamentação
    fund = r.get("fundamentacao") or []
    if fund:
        el.append(Paragraph("Fundamentação legal e vigência", h2))
        for f in fund:
            el.append(KeepTogether([
                Paragraph(f'<b>{_txt(f["norma"])}, {_txt(f["dispositivo"])}</b> — '
                          f'<link href="{escape(f["url"])}" color="#1565c0">texto oficial</link>', peq),
                P(f.get("resumo"), peq),
                Paragraph(f'<font color="#6b7280">Redação: {_txt(f.get("redacao"))}'
                          f'{" · " + _txt(f["vigencia"]) if f.get("vigencia") else ""}</font>', peq),
                Spacer(1, 3)]))

    if r.get("validacao"):
        v = r["validacao"]
        el.append(Paragraph("Validação", h2))
        el.append(P(f"Validada por {v.get('por')} em {_data(v.get('em'))}." + (f" Nota: {v['nota']}" if v.get("nota") else "")))

    el.append(Spacer(1, 10))
    el.append(Paragraph(_txt(r.get("aviso")), caixa))
    gerado = datetime.now().strftime("%d/%m/%Y %H:%M")
    el.append(Paragraph(_txt(f"Gerado pelo ERSUS360 em {gerado}" + (f" por {gerado_por}" if gerado_por else "")
                             + f" · Análise verificada em {_data(r.get('verificado_em'))}"), rot))

    def rodape(canvas, doc_):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(CINZA)
        canvas.drawString(1.8 * cm, 1.0 * cm, f"ERSUS360 — Relatório técnico — {titulo_doc} — Exercício {exercicio}")
        canvas.drawRightString(A4[0] - 1.8 * cm, 1.0 * cm, f"Página {doc_.page}")
        canvas.restoreState()

    doc.build(el, onFirstPage=rodape, onLaterPages=rodape)
    return buf.getvalue()
