"""
Relatório executivo do Diagnóstico Situacional em PDF (reportlab) — 12 seções fixas.

Só usa o que está registrado no diagnóstico: nenhuma recomendação ou número é criado aqui.
Cada item mostra o tipo de dado (automático, declarado ou validado) e a natureza do achado
(comprovado ou hipótese); itens não verificados vão para "Pendências de verificação", nunca para problemas.
"""
from __future__ import annotations

import io
from dataclasses import dataclass, field
from datetime import datetime

from services import diagnostico_catalogo as cat

SECOES = (
    "1. Identificação",
    "2. Objetivo e metodologia",
    "3. Fontes e períodos de referência",
    "4. Síntese do diagnóstico",
    "5. Diagnóstico por área",
    "6. Problemas identificados",
    "7. Pendências de verificação",
    "8. Vazios assistenciais",
    "9. Recomendações",
    "10. Prioridades",
    "11. Limitações",
    "12. Responsáveis",
)

TIPO_DADO = {"automatico": "Automático", "declarado": "Declarado", "validado": "Validado"}


@dataclass
class Bloco:
    titulo: str
    paragrafos: list[str] = field(default_factory=list)
    tabelas: list[tuple[list[str], list[list[str]]]] = field(default_factory=list)


def _c(v) -> str:
    return cat.CLASSIFICACOES.get(v, v or "—")


def _t(i: dict) -> str:
    return i["titulo"]


def montar(municipio: dict, painel: dict, itens: list[dict], acoes: list[dict], gerado_por: str) -> list[Bloco]:
    d = painel["diagnostico"]
    tot = painel["totais"]
    b: list[Bloco] = []

    b.append(Bloco(SECOES[0], [
        f"Município: {municipio['nome']}/{municipio.get('uf') or ''} — IBGE {municipio.get('ibge') or '—'}",
        f"Período avaliado: {d['rotulo']}",
        f"Situação do diagnóstico: {cat.SITUACOES.get(d['situacao'], d['situacao'])}",
        f"Responsável técnico: {d.get('responsavel_tecnico') or 'não informado'}",
        f"Relatório gerado em {datetime.now():%d/%m/%Y %H:%M} por {gerado_por} (ERSUS360).",
    ]))

    b.append(Bloco(SECOES[1], [
        d.get("objetivo") or "Objetivo: apresentar a situação da gestão municipal de saúde no período, por área, "
        "para subsidiar o planejamento e o plano de ação.",
        "Metodologia: checklist de 9 áreas (A–I). Cada item é classificado como Regular, Com pendência, Crítico, "
        "Não se aplica ou Não verificado, com fonte, competência, evidência, data e justificativa.",
        "Tipos de dado: Automático (fonte oficial integrada ao ERSUS360), Declarado (informado pelo município) e "
        "Validado (conferido e confirmado por técnico). Ausência de dado é registrada como Não verificado e nunca "
        "como irregularidade. Achados comprovados são separados das hipóteses a confirmar.",
    ]))

    com_fonte = [i for i in itens if i.get("fonte") and i["classificacao"] != "nao_verificado"]
    b.append(Bloco(SECOES[2], [] if com_fonte else ["Nenhum item com dado de fonte registrado."],
                   [(["Item", "Fonte", "Competência", "Data"],
                     [[f"{i['codigo']} {_t(i)}", i["fonte"], i.get("competencia") or "—",
                       i.get("data_referencia") or "—"] for i in com_fonte])] if com_fonte else []))

    b.append(Bloco(SECOES[3], [
        f"{painel['total_itens']} itens avaliados: " + "; ".join(f"{cat.CLASSIFICACOES[k]} {tot.get(k, 0)}"
                                                                 for k in cat.CLASSIFICACOES) + ".",
        "Por tipo de dado: " + "; ".join(f"{TIPO_DADO[k]} {v}" for k, v in painel["por_tipo_dado"].items()) + ".",
    ] + ([f"Comparação com {painel['anterior']['rotulo']}: {len(painel['evolucao']['pioraram'])} item(ns) piorou(aram), "
          f"{len(painel['evolucao']['melhoraram'])} melhorou(aram)."] if painel.get("evolucao") else
         ["Não há diagnóstico anterior para comparação."]),
        [(["Área", "Regular", "Com pendência", "Crítico", "Não se aplica", "Não verificado"],
          [[f"{a['area']} — {a['nome']}"] + [str(a["totais"].get(k, 0)) for k in cat.CLASSIFICACOES]
           for a in painel["por_area"]])]))

    tabs = []
    for area, nome in cat.AREAS.items():
        da = [i for i in itens if i["area"] == area]
        tabs.append(([f"{area} — {nome}", "Classificação", "Tipo de dado", "Natureza", "Justificativa / evidência"],
                     [[f"{i['codigo']} {_t(i)}", _c(i["classificacao"]), TIPO_DADO.get(i["tipo_dado"], i["tipo_dado"]),
                       cat.NATUREZAS.get(i.get("natureza"), "—"),
                       " ".join(filter(None, [i.get("justificativa"), i.get("evidencia")]))[:600] or "—"] for i in da]))
    b.append(Bloco(SECOES[4], [], tabs))

    probs = [i for i in itens if i["classificacao"] in {"critico", "pendencia"}]
    comprovados = [i for i in probs if i.get("natureza") == "comprovado"]
    hipoteses = [i for i in probs if i.get("natureza") != "comprovado"]
    cols = ["Item", "Classificação", "Tipo de dado", "Justificativa"]
    linhas = lambda xs: [[f"{i['codigo']} {_t(i)}", _c(i["classificacao"]), TIPO_DADO.get(i["tipo_dado"]),
                          i.get("justificativa") or "—"] for i in xs]
    blk = Bloco(SECOES[5], [] if probs else ["Nenhum problema registrado nos itens verificados."])
    if comprovados:
        blk.paragrafos.append("Achados comprovados (dado oficial ou evidência validada):")
        blk.tabelas.append((cols, linhas(comprovados)))
    if hipoteses:
        blk.paragrafos.append("Hipóteses a confirmar (dependem de conferência ou evidência adicional):")
        blk.tabelas.append((cols, linhas(hipoteses)))
    b.append(blk)

    nv = [i for i in itens if i["classificacao"] == "nao_verificado"]
    b.append(Bloco(SECOES[6], [] if nv else ["Todos os itens foram verificados."],
                   [(["Item", "Como verificar", "Fonte / evidência esperada", "Motivo"],
                     [[f"{i['codigo']} {_t(i)}", i.get("modo_rotulo") or "—",
                       f"{i.get('fonte_sugerida') or '—'} — {i.get('evidencia_esperada') or ''}",
                       i.get("justificativa") or "—"] for i in nv])] if nv else []))

    va = [i for i in itens if i.get("vazio_assistencial")]
    b.append(Bloco(SECOES[7], [] if va else ["Nenhum vazio assistencial registrado pelos técnicos neste diagnóstico."],
                   [(["Item", "Classificação", "Descrição"],
                     [[f"{i['codigo']} {_t(i)}", _c(i["classificacao"]),
                       " ".join(filter(None, [i.get("justificativa"), i.get("observacoes")])) or "—"] for i in va])]
                   if va else []))

    ativos = [a for a in acoes if a["status"] != "cancelada"]
    sem_acao = [i for i in probs if i["validacao"] == "confirmado" and not any(a["item_id"] == i["id"] for a in ativos)]
    rec = Bloco(SECOES[8], [] if (ativos or sem_acao) else ["Nenhuma recomendação registrada: não há problema validado."])
    if ativos:
        rec.tabelas.append((["Problema", "O quê", "Como", "Quem", "Prazo"],
                            [[a.get("item_codigo") or "", a["o_que"], a.get("como") or "—", a.get("quem") or "—",
                              a.get("quando") or "—"] for a in ativos]))
    for i in sem_acao:
        rec.paragrafos.append(f"{i['codigo']} {_t(i)}: problema validado ainda sem ação no plano 5W2H.")
    b.append(rec)

    prio_itens = [i for i in probs if i.get("prioridade") == "alta"]
    prio_acoes = [a for a in ativos if a.get("prioridade") == "alta"]
    pr = Bloco(SECOES[9], [] if (prio_itens or prio_acoes) else ["Nenhuma prioridade alta definida pelos técnicos."])
    if prio_itens:
        pr.tabelas.append((["Item de prioridade alta", "Classificação", "Responsável"],
                           [[f"{i['codigo']} {_t(i)}", _c(i["classificacao"]), i.get("responsavel") or "—"]
                            for i in prio_itens]))
    if prio_acoes:
        pr.tabelas.append((["Ação de prioridade alta", "Status", "Prazo", "Atrasada"],
                           [[a["o_que"], cat.STATUS_ACAO.get(a["status"], a["status"]), a.get("quando") or "—",
                             "Sim" if a.get("atrasada") else "Não"] for a in prio_acoes]))
    b.append(pr)

    lim = [f"{len(nv)} item(ns) não verificado(s): a ausência de dado não indica irregularidade."]
    integ = [i for i in nv if i.get("modo") == "integracao"]
    if integ:
        lim.append("Fontes ainda não integradas ao ERSUS360: " +
                   "; ".join(sorted({i["fonte_sugerida"] for i in integ})) + ".")
    if hipoteses:
        lim.append(f"{len(hipoteses)} problema(s) registrado(s) como hipótese, pendente(s) de confirmação.")
    nao_val = [i for i in itens if i["classificacao"] != "nao_verificado" and i["validacao"] != "confirmado"]
    if nao_val:
        lim.append(f"{len(nao_val)} item(ns) verificado(s) ainda sem validação técnica.")
    lim.append("Cadastro no CNES não comprova funcionamento: o funcionamento efetivo depende de levantamento local.")
    lim.append("Dados automáticos refletem a última coleta da fonte; a competência de cada dado está na seção 3.")
    b.append(Bloco(SECOES[10], lim))

    resp = Bloco(SECOES[11], [f"Responsável técnico do diagnóstico: {d.get('responsavel_tecnico') or 'não informado'}."])
    por_item = [i for i in itens if i.get("responsavel") or i.get("validado_por")]
    if por_item:
        resp.tabelas.append((["Item", "Responsável", "Validado por", "Validado em"],
                             [[f"{i['codigo']} {_t(i)}", i.get("responsavel") or "—", i.get("validado_por") or "—",
                               (i.get("validado_em") or "—")[:10]] for i in por_item]))
    if ativos:
        resp.tabelas.append((["Ação", "Quem"], [[a["o_que"], a.get("quem") or "—"] for a in ativos]))
    b.append(resp)
    return b


def pdf(blocos: list[Bloco], titulo: str) -> bytes:
    from xml.sax.saxutils import escape

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    buf = io.BytesIO()
    tam = landscape(A4)
    doc = SimpleDocTemplate(buf, pagesize=tam, leftMargin=1.5 * cm, rightMargin=1.5 * cm, topMargin=1.5 * cm,
                            bottomMargin=1.5 * cm, title=titulo, author="ERSUS360")
    ss = getSampleStyleSheet()
    cel = ParagraphStyle("cel", parent=ss["BodyText"], fontSize=7.5, leading=9)
    largura = tam[0] - 3 * cm
    el = [Paragraph(escape(titulo), ss["Title"]), Spacer(1, 6)]
    for bl in blocos:
        el.append(Paragraph(escape(bl.titulo), ss["Heading2"]))
        for p in bl.paragrafos:
            el.append(Paragraph(escape(p), ss["BodyText"]))
        for colunas, linhas in bl.tabelas:
            larg = [largura * 0.26] + [largura * 0.74 / (len(colunas) - 1)] * (len(colunas) - 1) \
                if len(colunas) > 1 else [largura]
            dados = [[Paragraph(f"<b>{escape(str(c))}</b>", cel) for c in colunas]] + \
                    [[Paragraph(escape(str(v)).replace("\n", "<br/>"), cel) for v in ln] for ln in linhas]
            tb = Table(dados, repeatRows=1, colWidths=larg)
            tb.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#94a3b8")),
                                    ("VALIGN", (0, 0), (-1, -1), "TOP")]))
            el += [Spacer(1, 4), tb]
        el.append(Spacer(1, 8))
    doc.build(el)
    return buf.getvalue()
