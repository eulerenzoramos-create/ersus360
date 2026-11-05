"""
Modelo único dos relatórios do InvestSUS (PDF e Excel).

Reproduz o modelo "RELATÓRIO — INVESTSUS" do ERSUS 360:
  1. cabeçalho institucional (ERSUS 360 · Fundo Municipal de Saúde · CNPJ · IBGE · gerado em);
  2. faixa do relatório (título, período de referência e responsável · perfil);
  3. trilha (Início › Financiamento e Recursos › FNS / Convênios › InvestSUS — ...);
  4. bloco do módulo (InvestSUS · subtítulo · fonte · atualização) e aviso de escopo federal;
  5. cards por modalidade (RP 6, RP 7, RP 8, Recurso de Programa) com quantidade e valor;
  6. uma tabela por modalidade — Nº Proposta | Parlamentar / Autoria | Partido/UF |
     Objeto / Programa | Situação (+ status oficial) | Valor Global | Repassado (%) | Ano —
     com a linha "Total <modalidade>", ou "Nenhuma proposta encontrada nesta modalidade.";
  7. seções próprias de cada relatório; 8. rodapé institucional em todas as páginas.

Regra de dados: o que não tem fonte sai como "Dados não disponíveis" — nunca zero
inventado. Um repasse zero só aparece quando a fonte oficial informa que não houve repasse.
"""
from __future__ import annotations

import io
from dataclasses import dataclass, field
from datetime import datetime

SEM_DADO = "Dados não disponíveis"
NAO_SE_APLICA = "Não se aplica"

MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro",
         "Outubro", "Novembro", "Dezembro"]
MESES_MIN = [m.lower() for m in MESES]

ESCOPO_FEDERAL = ("São acompanhadas emendas parlamentares federais RP 6, RP 7 e RP 8 e Recursos de Programa "
                  "do Ministério da Saúde (InvestSUS). Emendas estaduais não são captadas nesta etapa.")

# Mesmas cores e rótulos da tela do InvestSUS (GRUPO_CONFIG em frontend/src/pages/InvestSUS.tsx)
MODALIDADES_MODELO: dict[str, dict] = {
    "rp6": {"rotulo": "Emenda Individual (RP 6)", "curto": "Individual", "cor": "#7c3aed", "bg": "#f5f3ff"},
    "rp7": {"rotulo": "Emenda de Bancada (RP 7)", "curto": "Bancada", "cor": "#0284c7", "bg": "#eff6ff"},
    "rp8": {"rotulo": "Emenda de Comissão (RP 8)", "curto": "Comissão", "cor": "#059669", "bg": "#f0fdf4"},
    "programa": {"rotulo": "Recurso de Programa (Outros)", "curto": "Outros", "cor": "#d97706", "bg": "#fffbeb"},
    "outros_federais": {"rotulo": "Outros recursos federais", "curto": "Outros federais", "cor": "#475569",
                        "bg": "#f8fafc"},
    "a_classificar": {"rotulo": "Emenda federal a classificar", "curto": "A classificar", "cor": "#6b7280",
                      "bg": "#f9fafb"},
}
MODALIDADES_FIXAS = ("rp6", "rp7", "rp8", "programa")   # sempre aparecem, mesmo vazias

# Rótulos da situação normalizada — os mesmos do selo da tela (SITUACAO_MAP)
ROTULO_SITUACAO = {
    "recurso_disponivel": "Recurso Disponível", "recurso_programado": "Programado",
    "indicacao_parlamentar": "Indicação Parlamentar", "beneficiario_indicado": "Beneficiário Indicado",
    "prazo_cadastramento": "Prazo de Cadastramento", "proposta_elaboracao": "Em Elaboração",
    "proposta_cadastrada": "Proposta Cadastrada", "proposta_enviada": "Proposta Enviada",
    "em_analise": "Em Análise", "em_diligencia": "Em Diligência",
    "aguardando_complementacao": "Aguardando Complementação", "complementacao_enviada": "Complementação Enviada",
    "em_reanalize": "Em Reanálise", "aprovada": "Aprovada", "rejeitada": "Rejeitada", "cancelada": "Cancelada",
    "empenhada": "Empenhada", "empenhada_aguardando_formalizacao": "Empenhada — Ag. Formalização",
    "formalizada": "Formalizada", "portaria_publicada": "Portaria Publicada",
    "aguardando_pagamento": "Aguardando Pagamento", "parcialmente_paga": "Parcialmente Paga",
    "totalmente_paga": "Totalmente Paga", "execucao_nao_iniciada": "Execução Não Iniciada",
    "em_execucao": "Em Execução", "execucao_atrasada": "Execução Atrasada",
    "execucao_paralisada": "Execução Paralisada", "execucao_fisica_concluida": "Execução Física Concluída",
    "execucao_financeira_concluida": "Execução Financeira Concluída",
    "monitoramento_pendente": "Monitoramento Pendente",
}

COLUNAS_PROPOSTAS = ["Nº Proposta", "Parlamentar / Autoria", "Partido/UF", "Objeto / Programa", "Tipo", "Situação",
                     "Valor Global", "Repassado", "Ano"]


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
class Identificacao:
    """Quem emite e para qual município — sempre o município da sessão."""
    municipio: str
    uf: str | None
    ibge: str | None
    cnpj_fundo: str | None
    responsavel: str
    perfil: str
    gerado_em: datetime = field(default_factory=datetime.now)


@dataclass
class LinhaProposta:
    numero: str | None
    autoria: str
    partido_uf: str
    objeto: str
    situacao: str
    situacao_oficial: str | None
    valor_global: float | None
    repassado: float | None
    ano: int | None
    tipo: str = SEM_DADO               # Programa MS, MAC, PAP ou Outro — só de campo oficial
    tipo_oficial: str | None = None    # texto da coluna "Tipo" do InvestSUS, quando houver

    @property
    def perc(self) -> float | None:
        if self.valor_global and self.repassado is not None:
            return self.repassado / self.valor_global * 100
        return None


@dataclass
class Grupo:
    chave: str
    linhas: list[LinhaProposta] = field(default_factory=list)

    @property
    def cfg(self) -> dict:
        return MODALIDADES_MODELO.get(self.chave, MODALIDADES_MODELO["a_classificar"])

    @property
    def total_global(self) -> float:
        return round(sum(l.valor_global or 0 for l in self.linhas), 2)

    @property
    def total_repassado(self) -> float | None:
        vals = [l.repassado for l in self.linhas if l.repassado is not None]
        return round(sum(vals), 2) if vals else None


@dataclass
class Documento:
    titulo: str                    # ex.: "InvestSUS" ou "Execução financeira consolidada"
    subtitulo: str                 # ex.: "Emendas, Propostas e Execução · FMS Apuí/AM"
    periodo: str                   # ex.: "Novembro/2026"
    filtros: str = ""
    fonte: str = "InvestSUS / MS"
    atualizacao: str = "manual auditável"
    grupos: list[Grupo] | None = None
    secoes: list[Secao] = field(default_factory=list)
    avisos: list[str] = field(default_factory=list)


# ── Formatação ────────────────────────────────────────────────────────────────

def brl(v: float | None) -> str:
    if v is None:
        return SEM_DADO
    txt = "R$ " + f"{abs(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("-" + txt) if v < 0 else txt


def pct(v: float | None, casas: int = 1) -> str:
    return SEM_DADO if v is None else f"{v:.{casas}f}%".replace(".", ",")


def texto(v) -> str:
    if v is None or v == "":
        return SEM_DADO
    if isinstance(v, Moeda):
        return brl(v)
    return str(v)


def data_extenso(d: datetime) -> str:
    return f"{d.day:02d} de {MESES_MIN[d.month - 1]} de {d.year} às {d:%H:%M}"


def periodo_padrao(exercicio: int | None, hoje: datetime | None = None) -> str:
    """Mês/ano de referência como no modelo; com filtro de exercício, o exercício também aparece."""
    h = hoje or datetime.now()
    mes = f"{MESES[h.month - 1]}/{h.year}"
    return f"Exercício {exercicio} · posição de {mes}" if exercicio else mes


def montar_grupos(linhas: list[tuple[str, LinhaProposta]], fixas: bool = True) -> list[Grupo]:
    """RP 6, RP 7, RP 8 e Programa sempre (fixas); demais modalidades só quando houver proposta."""
    grupos = {k: Grupo(k) for k in MODALIDADES_FIXAS} if fixas else {}
    for chave, ln in linhas:
        grupos.setdefault(chave if chave in MODALIDADES_MODELO else "a_classificar",
                          Grupo(chave if chave in MODALIDADES_MODELO else "a_classificar")).linhas.append(ln)
    for g in grupos.values():
        g.linhas.sort(key=lambda l: (-(l.valor_global or 0), l.numero or ""))
    ordem = list(MODALIDADES_MODELO)
    return sorted(grupos.values(), key=lambda g: ordem.index(g.chave))


def autoria(modalidade: str, parlamentar_nome: str | None) -> str:
    if parlamentar_nome:
        return parlamentar_nome
    return NAO_SE_APLICA if modalidade == "programa" else SEM_DADO


def partido_uf(modalidade: str, partido: str | None, uf: str | None, tem_parlamentar: bool) -> str:
    if partido or uf:
        return "/".join(x for x in (partido, uf) if x)
    if modalidade == "programa" and not tem_parlamentar:
        return NAO_SE_APLICA
    return SEM_DADO


def valor_global(aprovado, proposta, indicado) -> float | None:
    """Mesmo critério da tela: aprovado; se ainda não aprovado, valor da proposta ou indicado."""
    for v in (aprovado, proposta, indicado):
        if v:
            return round(float(v), 2)
    return None


def _sem_acento(t) -> str:
    import unicodedata
    return unicodedata.normalize("NFKD", str(t or "")).encode("ascii", "ignore").decode().upper()


def tipo_oficial_de(payload) -> str | None:
    """Texto da coluna "Tipo" do InvestSUS gravado na sincronização (payload original)."""
    if not isinstance(payload, dict):
        return None
    for chave in ("tipo_raw", "tipo", "tipoProposta", "tipoObjeto"):
        v = payload.get(chave)
        if isinstance(v, dict):
            v = v.get("descricao") or v.get("nome")
        if v and str(v).strip() not in ("-", ""):
            return str(v).strip()
    return None


def tipo_proposta(modalidade: str | None, componente: str | None, tipo_oficial: str | None) -> str:
    """Programa MS, MAC, PAP ou Outro — lido do componente/tipo oficial da proposta, nunca do objeto.
    MAC/PAP: componente gravado pela sincronização ou nome oficial do tipo (Custeio da Média e Alta
    Complexidade / da Atenção Primária). Sem componente, um Recurso de Programa é "Programa MS"."""
    comp = _sem_acento(componente).strip()
    if comp in ("MAC", "PAP"):
        return comp
    if comp == "APS":
        return "PAP"
    t = _sem_acento(tipo_oficial)
    if "MEDIA E ALTA COMPLEXIDADE" in t or " MAC" in f" {t}":
        return "MAC"
    if "ATENCAO PRIMARIA" in t or " PAP" in f" {t}":
        return "PAP"
    if modalidade == "programa":
        return "Programa MS"
    if modalidade in ("rp6", "rp7", "rp8", "outros_federais"):
        return "Outro"
    return SEM_DADO


def rotulo_situacao(sit: str | None) -> str:
    return ROTULO_SITUACAO.get(sit or "", sit.replace("_", " ").capitalize() if sit else SEM_DADO)


# ── PDF ───────────────────────────────────────────────────────────────────────

_TROCAS = {"−": "-", "→": "->", "≥": ">=", "≤": "<=", "✓": "", "⚕": ""}


def _seguro(s: str) -> str:
    """As fontes padrão do PDF usam o conjunto WinAnsi; troca o que ele não tem."""
    for a, b in _TROCAS.items():
        s = s.replace(a, b)
    return s.encode("cp1252", "replace").decode("cp1252")


def pdf(doc: Documento, ident: Identificacao) -> bytes:
    from xml.sax.saxutils import escape

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    def e(s) -> str:
        return escape(_seguro(str(s)))

    C = colors.HexColor
    azul, cinza, cinza_claro, tinta = C("#1d4ed8"), C("#64748b"), C("#9ca3af"), C("#111827")
    mun_up = (ident.municipio or "Município").upper()
    mun_uf = f"{mun_up} / {ident.uf}" if ident.uf else mun_up
    gerado = data_extenso(ident.gerado_em)
    ident_txt = " · ".join(x for x in (f"CNPJ: {ident.cnpj_fundo}" if ident.cnpj_fundo else None,
                                        f"IBGE: {ident.ibge}" if ident.ibge else None) if x)

    buf = io.BytesIO()
    tam = landscape(A4)
    margem = 10 * mm
    topo = 27 * mm
    largura = tam[0] - 2 * margem

    def moldura(c, d):
        c.saveState()
        w, h = tam
        y = h - 9 * mm
        # marca: quadrado azul com a cruz da saúde (o ⚕ da tela não existe nas fontes do PDF)
        c.setFillColor(azul)
        c.roundRect(margem, y - 11 * mm, 11 * mm, 11 * mm, 2.2 * mm, stroke=0, fill=1)
        c.setFillColor(colors.white)
        cx, cy = margem + 5.5 * mm, y - 5.5 * mm
        c.rect(cx - 1 * mm, cy - 3.6 * mm, 2 * mm, 7.2 * mm, stroke=0, fill=1)
        c.rect(cx - 3.6 * mm, cy - 1 * mm, 7.2 * mm, 2 * mm, stroke=0, fill=1)
        c.setFillColor(C("#0f172a"))
        c.setFont("Helvetica-Bold", 15)
        c.drawString(margem + 14 * mm, y - 5 * mm, "ERSUS 360")
        c.setFillColor(cinza)
        c.setFont("Helvetica", 6.8)
        c.drawString(margem + 14 * mm, y - 9.5 * mm, _seguro(f"SISTEMA DE GESTÃO EM SAÚDE · {mun_uf}"))
        c.setFont("Helvetica", 8)
        c.drawRightString(w - margem, y - 2.5 * mm, _seguro(f"Fundo Municipal de Saúde de {mun_up}"))
        if ident_txt:
            c.drawRightString(w - margem, y - 6.3 * mm, _seguro(ident_txt))
        c.setFillColor(cinza_claro)
        c.setFont("Helvetica", 7)
        c.drawRightString(w - margem, y - 10 * mm, _seguro(f"Gerado em: {gerado}"))
        c.setStrokeColor(azul)
        c.setLineWidth(2)
        c.line(margem, y - 13.5 * mm, w - margem, y - 13.5 * mm)
        # rodapé
        c.setStrokeColor(C("#e5e7eb"))
        c.setLineWidth(0.5)
        c.line(margem, 11 * mm, w - margem, 11 * mm)
        c.setFillColor(cinza_claro)
        c.setFont("Helvetica", 6.5)
        c.drawString(margem, 7.5 * mm, _seguro(
            f"ERSUS 360 · Sistema de Gestão em Saúde · Prefeitura Municipal de {mun_uf}"))
        c.drawRightString(w - margem, 7.5 * mm, _seguro(
            f"Secretaria Municipal de Saúde de {mun_up} · {ident.responsavel} · {gerado} · Página {d.page}"))
        c.restoreState()

    sd = SimpleDocTemplate(buf, pagesize=tam, leftMargin=margem, rightMargin=margem, topMargin=topo,
                           bottomMargin=15 * mm, title=_seguro(f"Relatório — {doc.titulo}"), author="ERSUS 360")

    base = ParagraphStyle("base", fontName="Helvetica", fontSize=8, leading=10, textColor=tinta)
    pequeno = ParagraphStyle("peq", parent=base, fontSize=6.5, leading=8, textColor=cinza)
    cel = ParagraphStyle("cel", parent=base, fontSize=7.3, leading=9)
    cel_num = ParagraphStyle("celn", parent=cel, alignment=2)
    cel_cent = ParagraphStyle("celc", parent=cel, alignment=1)
    cab = ParagraphStyle("cab", parent=cel, fontName="Helvetica-Bold", textColor=C("#374151"))
    cab_num = ParagraphStyle("cabn", parent=cab, alignment=2)
    titulo_secao = ParagraphStyle("ts", parent=base, fontName="Helvetica-Bold", fontSize=10, leading=13,
                                  textColor=C("#1e3a5f"), spaceBefore=8, spaceAfter=4)

    el: list = []

    # Faixa do relatório
    faixa = Table([[Paragraph(f'<font size="6.5" color="#2563eb"><b>{e("RELATÓRIO — " + doc.titulo.upper())}</b>'
                              f'</font>', base)],
                   [Paragraph(f'<font color="#6b7280">Período de referência: </font>'
                              f'<font size="10" color="#1e40af"><b>{e(doc.periodo)}</b></font>'
                              f'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<font color="#6b7280">Responsável: </font>'
                              f'<b>{e(ident.responsavel)}</b> <font size="6.5" color="#9ca3af">· '
                              f'{e(ident.perfil)}</font>', base)]],
                  colWidths=[largura])
    faixa.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), C("#eff6ff")),
                               ("LINEBEFORE", (0, 0), (0, -1), 3, azul),
                               ("LEFTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, 0), 6),
                               ("BOTTOMPADDING", (0, -1), (-1, -1), 6)]))
    el += [faixa, Spacer(1, 7)]

    # Trilha
    el.append(Paragraph(
        f'<font color="#1d4ed8"><b>Início</b></font>  ›  <font color="#6b7280">Financiamento e Recursos  ›  '
        f'FNS / Convênios  ›  </font><b>{e("InvestSUS — " + doc.titulo if doc.titulo != "InvestSUS" else "InvestSUS — Propostas/Execução")}</b>',
        base))
    el.append(Table([[""]], colWidths=[largura], rowHeights=[3],
                    style=[("LINEBELOW", (0, 0), (-1, -1), 0.6, C("#e2e8f0"))]))
    el.append(Spacer(1, 6))

    # Bloco do módulo
    modulo = Table([[Paragraph(f'<font size="13" color="#1e3a5f"><b>{e(doc.titulo)}</b></font>', base),
                     Paragraph(f'<font color="#9ca3af">Fonte: {e(doc.fonte)}</font>', ParagraphStyle(
                         "r", parent=pequeno, alignment=2))],
                    [Paragraph(e(doc.subtitulo + (f" · {doc.filtros}" if doc.filtros else "")), pequeno),
                     Paragraph(f'<font color="#9ca3af">Atualização: {e(doc.atualizacao)}</font>', ParagraphStyle(
                         "r2", parent=pequeno, alignment=2))]],
                   colWidths=[largura * 0.7, largura * 0.3])
    modulo.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                                ("VALIGN", (0, 0), (-1, -1), "BOTTOM")]))
    el += [modulo, Spacer(1, 8)]

    # Escopo federal e avisos
    for i, aviso in enumerate([ESCOPO_FEDERAL] + doc.avisos):
        rot = "<b>Escopo federal.</b> " if i == 0 else "<b>Fontes.</b> " if i == 1 else ""
        caixa = Table([[Paragraph(rot + e(aviso), ParagraphStyle("av", parent=base, textColor=C("#1e3a8a")))]],
                      colWidths=[largura])
        caixa.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), C("#eff6ff")),
                                   ("BOX", (0, 0), (-1, -1), 0.6, C("#bfdbfe")),
                                   ("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 5),
                                   ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
        el += [caixa, Spacer(1, 5)]

    # Cards e tabelas por modalidade
    if doc.grupos is not None:
        cards = [g for g in doc.grupos]
        n = len(cards)
        gap = 6
        wcard = (largura - gap * (n - 1)) / n
        linha_cards, estilos = [], [("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 6),
                                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7), ("VALIGN", (0, 0), (-1, -1), "TOP")]
        larguras = []
        for i, g in enumerate(cards):
            cfg = g.cfg
            linha_cards.append(Paragraph(
                f'<font size="7" color="{cfg["cor"]}"><b>{e(cfg["rotulo"].upper())}</b></font><br/>'
                f'<font size="12"><b>{len(g.linhas)}</b></font><br/>'
                f'<font size="7.5" color="#6b7280">proposta{"" if len(g.linhas) == 1 else "s"}</font><br/>'
                f'<font size="8.5" color="{cfg["cor"]}"><b>{e(brl(g.total_global))}</b></font>',
                ParagraphStyle("card", parent=base, leading=13)))
            col = 2 * i
            estilos += [("BACKGROUND", (col, 0), (col, 0), C(cfg["bg"])),
                        ("LINEBEFORE", (col, 0), (col, 0), 2.5, C(cfg["cor"]))]
            larguras.append(wcard)
            if i < n - 1:
                linha_cards.append("")
                larguras.append(gap)
        tc = Table([linha_cards], colWidths=larguras)
        tc.setStyle(TableStyle(estilos))
        el += [Spacer(1, 3), tc, Spacer(1, 9)]

        lw = [0.12, 0.115, 0.065, 0.175, 0.07, 0.215, 0.095, 0.085, 0.06]
        for g in doc.grupos:
            cfg = g.cfg
            borda = C(cfg["cor"])
            if not g.linhas:
                vazio = Table([[Paragraph("Nenhuma proposta encontrada nesta modalidade.",
                                          ParagraphStyle("vz", parent=base, alignment=1, textColor=cinza_claro))]],
                              colWidths=[largura], rowHeights=[22])
                vazio.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, borda),
                                           ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
                el += [vazio, Spacer(1, 6)]
                continue
            dados = [[Paragraph(f'<font color="{cfg["cor"]}"><b>{e(cfg["rotulo"])}</b></font> · '
                                f'{len(g.linhas)} proposta{"" if len(g.linhas) == 1 else "s"} · '
                                f'<b>{e(brl(g.total_global))}</b>', base)] + [""] * 8,
                     [Paragraph(e(c), cab_num if c in ("Valor Global", "Repassado") else cab)
                      for c in COLUNAS_PROPOSTAS]]
            for ln in g.linhas:
                sit = f'<font color="#0369a1"><b>{e(ln.situacao)}</b></font>'
                if ln.situacao_oficial:
                    sit += f'<br/><font size="6.3" color="#6b7280">Oficial: {e(ln.situacao_oficial)}</font>'
                rep = (f'<font color="#6b7280">{e(brl(ln.repassado))}</font>'
                       + (f'<br/><font size="6" color="#9ca3af">{e(pct(ln.perc, 0))}</font>'
                          if ln.perc is not None else ""))
                dados.append([
                    Paragraph(f'<font name="Courier-Bold" size="7">{e(ln.numero or SEM_DADO)}</font>', cel),
                    Paragraph(e(ln.autoria), cel), Paragraph(e(ln.partido_uf), cel),
                    Paragraph(e(ln.objeto), cel),
                    Paragraph(f"<b>{e(ln.tipo)}</b>" if ln.tipo != SEM_DADO else e(ln.tipo), cel),
                    Paragraph(sit, cel),
                    Paragraph(f"<b>{e(brl(ln.valor_global))}</b>", cel_num),
                    Paragraph(rep, cel_num),
                    Paragraph(f'<font color="#9ca3af">{e(ln.ano or SEM_DADO)}</font>', cel_cent)])
            dados.append([Paragraph(f'<b>{e("Total " + cfg["curto"] + " — " + cfg["rotulo"])}</b>', cel)]
                         + [""] * 5 + [Paragraph(f"<b>{e(brl(g.total_global))}</b>", cel_num),
                                       Paragraph(f"<b>{e(brl(g.total_repassado))}</b>", cel_num), ""])
            t = Table(dados, colWidths=[largura * x for x in lw], repeatRows=2)
            ult = len(dados) - 1
            est = [("SPAN", (0, 0), (-1, 0)), ("BACKGROUND", (0, 0), (-1, 0), C(cfg["bg"])),
                   ("BACKGROUND", (0, 1), (-1, 1), C("#f1f5f9")), ("SPAN", (0, ult), (5, ult)),
                   ("BACKGROUND", (0, ult), (-1, ult), C("#f1f5f9")),
                   ("LINEBELOW", (0, 1), (-1, ult - 1), 0.4, C("#eef2f7")),
                   ("BOX", (0, 0), (-1, -1), 0.6, borda), ("VALIGN", (0, 2), (-1, -1), "MIDDLE"),
                   ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]
            for i in range(2, ult):
                if i % 2 == 1:
                    est.append(("BACKGROUND", (0, i), (-1, i), C("#fafafa")))
            t.setStyle(TableStyle(est))
            # tabela curta não se parte entre páginas (como no modelo); longa repete o cabeçalho
            el += [KeepTogether([t]) if len(g.linhas) <= 12 else t, Spacer(1, 7)]

    # Seções próprias do relatório
    for s in doc.secoes:
        bloco = [Paragraph(e(s.titulo), titulo_secao)]
        for p in s.paragrafos:
            bloco.append(Paragraph(e(p), ParagraphStyle("pp", parent=base, textColor=C("#374151"), spaceAfter=3)))
        el.append(KeepTogether(bloco) if not s.tabelas else bloco[0])
        if s.tabelas:
            el += bloco[1:]
        for t in s.tabelas:
            dados = [[Paragraph(e(c), cab) for c in t.colunas]]
            for ln in t.linhas:
                dados.append([Paragraph(e(texto(v)), cel_num if isinstance(v, (Moeda, int)) and not isinstance(v, bool)
                                        else cel) for v in ln])
            ncol = len(t.colunas)
            prim = largura * (0.13 if ncol > 8 else 0.2 if ncol > 4 else 0.4)
            resto = (largura - prim) / max(1, ncol - 1)
            tb = Table(dados, repeatRows=1, colWidths=[prim] + [resto] * (ncol - 1))
            est = [("BACKGROUND", (0, 0), (-1, 0), C("#f1f5f9")),
                   ("LINEBELOW", (0, 0), (-1, -1), 0.4, C("#e5e7eb")),
                   ("BOX", (0, 0), (-1, -1), 0.6, C("#dbe3ee")), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                   ("TOPPADDING", (0, 0), (-1, -1), 3.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5)]
            if t.linhas and str(t.linhas[-1][0]).upper().startswith("TOTAL"):
                est.append(("BACKGROUND", (0, len(dados) - 1), (-1, len(dados) - 1), C("#f1f5f9")))
            if not t.linhas:
                dados.append([Paragraph("Nenhum registro.", ParagraphStyle("nr", parent=cel, textColor=cinza_claro))]
                             + [""] * (ncol - 1))
                tb = Table(dados, colWidths=[prim] + [resto] * (ncol - 1))
                est.append(("SPAN", (0, 1), (-1, 1)))
            tb.setStyle(TableStyle(est))
            el += [Spacer(1, 2), tb]
        el.append(Spacer(1, 4))

    sd.build(el, onFirstPage=moldura, onLaterPages=moldura)
    return buf.getvalue()


# ── Excel ─────────────────────────────────────────────────────────────────────

def xlsx(doc: Documento, ident: Identificacao) -> bytes:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

    wb = Workbook()
    ws = wb.active
    ws.title = "Relatório"
    moeda = '"R$" #,##0.00'
    fino = Side(style="thin", color="CBD5E1")
    borda = Border(left=fino, right=fino, top=fino, bottom=fino)
    mun_up = (ident.municipio or "Município").upper()
    mun_uf = f"{mun_up} / {ident.uf}" if ident.uf else mun_up
    gerado = data_extenso(ident.gerado_em)

    def linha(valores, negrito=False, cor=None, fundo=None, tam=None):
        ws.append(valores)
        r = ws.max_row
        for c in ws[r]:
            if c.value is None:
                continue
            c.font = Font(bold=negrito, color=cor, size=tam or 10)
            if fundo:
                c.fill = PatternFill("solid", fgColor=fundo)
        return r

    linha(["ERSUS 360", None, None, None, None, f"Fundo Municipal de Saúde de {mun_up}"], True, "0F172A", tam=14)
    linha([f"SISTEMA DE GESTÃO EM SAÚDE · {mun_uf}", None, None, None, None,
           " · ".join(x for x in (f"CNPJ: {ident.cnpj_fundo}" if ident.cnpj_fundo else None,
                                   f"IBGE: {ident.ibge}" if ident.ibge else None) if x) or SEM_DADO], cor="64748B")
    linha([None, None, None, None, None, f"Gerado em: {gerado}"], cor="9CA3AF")
    ws.append([])
    linha([f"RELATÓRIO — {doc.titulo.upper()}"], True, "2563EB", "EFF6FF")
    linha([f"Período de referência: {doc.periodo}", None, None, None,
           f"Responsável: {ident.responsavel} · {ident.perfil}"], fundo="EFF6FF")
    linha(["Início › Financiamento e Recursos › FNS / Convênios › "
           + ("InvestSUS — Propostas/Execução" if doc.titulo == "InvestSUS" else f"InvestSUS — {doc.titulo}")],
          cor="64748B")
    linha([doc.titulo], True, "1E3A5F", tam=13)
    linha([doc.subtitulo + (f" · {doc.filtros}" if doc.filtros else ""), None, None, None, None,
           f"Fonte: {doc.fonte}", None, f"Atualização: {doc.atualizacao}"], cor="64748B")
    linha([f"Escopo federal. {ESCOPO_FEDERAL}"], cor="1E3A8A", fundo="EFF6FF")
    for a in doc.avisos:
        linha([f"Fontes. {a}"], cor="1E3A8A", fundo="EFF6FF")

    if doc.grupos is not None:
        ws.append([])
        linha(["Modalidade", "Propostas", "Valor global"], True, fundo="F1F5F9")
        for g in doc.grupos:
            r = linha([g.cfg["rotulo"], len(g.linhas), g.total_global], cor=g.cfg["cor"].lstrip("#").upper())
            ws.cell(r, 3).number_format = moeda
        for g in doc.grupos:
            ws.append([])
            linha([f'{g.cfg["rotulo"]} · {len(g.linhas)} proposta{"" if len(g.linhas) == 1 else "s"}'], True,
                  g.cfg["cor"].lstrip("#").upper(), g.cfg["bg"].lstrip("#").upper())
            if not g.linhas:
                linha(["Nenhuma proposta encontrada nesta modalidade."], cor="9CA3AF")
                continue
            r = linha(COLUNAS_PROPOSTAS[:7] + ["Repassado", "% repassado", "Ano"], True, fundo="F1F5F9")
            for c in ws[r]:
                c.border = borda
            for ln in g.linhas:
                sit = ln.situacao + (f" — Oficial: {ln.situacao_oficial}" if ln.situacao_oficial else "")
                tipo = ln.tipo + (f" ({ln.tipo_oficial})" if ln.tipo_oficial else "")
                r = linha([ln.numero or SEM_DADO, ln.autoria, ln.partido_uf, ln.objeto, tipo, sit,
                           ln.valor_global if ln.valor_global is not None else SEM_DADO,
                           ln.repassado if ln.repassado is not None else SEM_DADO,
                           (round(ln.perc / 100, 4) if ln.perc is not None else SEM_DADO),
                           ln.ano if ln.ano is not None else SEM_DADO])
                for c in ws[r]:
                    c.border = borda
                    c.alignment = Alignment(vertical="top", wrap_text=True)
                for i in (7, 8):
                    if isinstance(ws.cell(r, i).value, float):
                        ws.cell(r, i).number_format = moeda
                if isinstance(ws.cell(r, 9).value, float):
                    ws.cell(r, 9).number_format = "0%"
            r = linha([f'Total {g.cfg["curto"]} — {g.cfg["rotulo"]}', None, None, None, None, None, g.total_global,
                       g.total_repassado if g.total_repassado is not None else SEM_DADO], True, fundo="F1F5F9")
            for i in (7, 8):
                ws.cell(r, i).number_format = moeda

    for s in doc.secoes:
        ws.append([])
        linha([s.titulo], True, "1E3A5F", tam=11)
        for p in s.paragrafos:
            linha([p], cor="374151")
        for t in s.tabelas:
            r = linha(t.colunas, True, fundo="F1F5F9")
            for c in ws[r]:
                c.border = borda
            if not t.linhas:
                linha(["Nenhum registro."], cor="9CA3AF")
            for ln in t.linhas:
                ws.append([float(v) if isinstance(v, Moeda) else
                           (v if isinstance(v, (int, float)) and not isinstance(v, bool) else texto(v)) for v in ln])
                for c, v in zip(ws[ws.max_row], ln):
                    c.border = borda
                    if isinstance(v, Moeda):
                        c.number_format = moeda
    ws.append([])
    linha([f"ERSUS 360 · Sistema de Gestão em Saúde · Prefeitura Municipal de {mun_uf}"], cor="9CA3AF")
    linha([f"Secretaria Municipal de Saúde de {mun_up} · {ident.responsavel} · {gerado}"], cor="9CA3AF")

    larguras = [24, 26, 14, 40, 16, 34, 18, 18, 14, 12, 16, 14, 14]
    for i, w in enumerate(larguras):
        ws.column_dimensions[chr(ord("A") + i)].width = w
    ws.sheet_view.showGridLines = False
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
