"""
InvestSUS — relatórios da Execução Financeira (PDF e Excel).

Montados a partir das mesmas respostas do painel/ficha (routers/investsus_execucao.py),
então o relatório mostra exatamente o que a tela mostra, no modelo único dos relatórios
do InvestSUS (services/relatorio_modelo_investsus.py): cabeçalho institucional, faixa do
relatório, cards e tabelas por modalidade e as seções próprias de cada relatório.

Valor sem registro aparece como "Dados não disponíveis" — inclusive empenho, liquidação e
pagamento de proposta em que o município ainda não lançou nada (não é zero).
"""
from __future__ import annotations

from services import relatorio_modelo_investsus as modelo
from services.relatorio_modelo_investsus import (
    SEM_DADO, Documento, Identificacao, LinhaProposta, Moeda, Secao, Tabela,
)

TIPOS = {
    "consolidado": "Execução financeira consolidada",
    "individual": "Execução individual do plano de trabalho",
    "modalidade": "Execução por modalidade de recurso",
    "area": "Execução por área assistencial",
    "saldos": "Saldos financeiros",
    "pendencias": "Pendências da execução financeira",
}

AVISO_FONTES = ("Aprovado e repassado: dados oficiais do InvestSUS/FNS sincronizados no ERSUS360. "
                "Empenhado, liquidado, pago, rendimentos e devoluções: registrados pelo município "
                "(manual ou planilha) — não são dados confirmados pelo FNS.")

ROTULO_TIPO = {"empenho": "Empenho", "anulacao_empenho": "Anulação de empenho", "liquidacao": "Liquidação",
               "estorno_liquidacao": "Estorno de liquidação", "pagamento": "Pagamento",
               "estorno_pagamento": "Estorno de pagamento"}
ROTULO_NIVEL = {"critico": "Crítico", "urgente": "Urgente", "atencao": "Atenção", "informativo": "Informativo"}

# Campos que vêm do registro do município: sem lançamento, não há dado (e não zero).
CAMPOS_MUNICIPIO = ("empenhado", "liquidado", "pago", "saldo_financeiro", "saldo_plano", "perc_execucao")


def _m(v) -> Moeda | None:
    return None if v is None else Moeda(round(float(v), 2))


def _apr(v) -> Moeda | None:
    """Aprovado zerado = proposta ainda não aprovada: não há valor aprovado (não é zero)."""
    return _m(v) if v else None


def _pct(v) -> str:
    return modelo.pct(v)


def _dt(d: str | None) -> str | None:
    return "/".join(reversed(d[:10].split("-"))) if d else None


def _mun(p: dict, campo: str):
    """Valor lançado pelo município; None quando a proposta não tem nenhum lançamento."""
    return None if p.get("sem_lancamento") else p.get(campo)


def _filtros(painel: dict) -> str:
    f = painel["filtros"]
    partes = [f"Exercício {f['exercicio']}" if f.get("exercicio") else "Todos os exercícios acompanhados"]
    if f.get("origem"):
        partes.append(painel["opcoes"]["origens"].get(f["origem"], f["origem"]))
    if f.get("destinacao"):
        partes.append(painel["opcoes"]["destinacoes"].get(f["destinacao"], f["destinacao"]))
    if f.get("tipo_recurso"):
        partes.append("Tipo de recurso: " + modelo.TIPOS_RECURSO.get(f["tipo_recurso"], f["tipo_recurso"]))
    return " · ".join(partes)


def _subtitulo(painel_ou_ident: dict) -> str:
    mun = painel_ou_ident.get("municipio") or "Município"
    uf = painel_ou_ident.get("municipio_uf")
    return f"Execução financeira dos planos de trabalho · FMS {mun}{('/' + uf) if uf else ''}"


def linha_modelo(p: dict) -> LinhaProposta:
    """Linha do painel → linha da tabela do modelo (Nº, autoria, partido/UF, objeto, situação...)."""
    mod = p.get("origem") or "a_classificar"
    tem_parl = bool(p.get("parlamentar"))
    tipo, origem = modelo.classificar_tipo(p.get("modalidade_oficial") or mod, p.get("componente"),
                                           p.get("tipo_oficial"), p.get("programas_oficiais") or ())
    return LinhaProposta(
        numero=p.get("numero_proposta"),
        autoria=modelo.autoria(mod, p.get("parlamentar")),
        partido_uf=modelo.partido_uf(mod, p.get("parlamentar_partido"), p.get("parlamentar_uf"), tem_parl),
        objeto=p.get("objeto") or p.get("programa") or p.get("acao_orcamentaria") or SEM_DADO,
        situacao=modelo.rotulo_situacao(p.get("situacao_proposta")),
        situacao_oficial=p.get("situacao_proposta_texto"),
        valor_global=modelo.valor_global(p.get("aprovado"), p.get("valor_proposta"), p.get("valor_indicado")),
        repassado=p.get("recebido"),
        ano=p.get("exercicio"),
        tipo=tipo,
        tipo_oficial=p.get("tipo_oficial"),
        tipo_origem=origem,
    )


def _grupos(props: list[dict], fixas: bool = True) -> list[modelo.Grupo]:
    return modelo.montar_grupos([(p.get("origem") or "a_classificar", linha_modelo(p)) for p in props], fixas)


def _indicadores(painel: dict) -> Secao:
    i = painel["indicadores"]
    todas_sem = i["total_propostas"] > 0 and i.get("propostas_sem_lancamento") == i["total_propostas"]

    def mun(campo):  # sem nenhum lançamento no recorte: não há dado do município
        return None if (todas_sem or not i["total_propostas"]) else _m(i[campo])

    tem_aprovado = bool(i["aprovado"])

    linhas = [
        ["Propostas", i["total_propostas"]], ["Planos de trabalho cadastrados", i["total_planos"]],
        ["Valor aprovado (oficial)", _apr(i["aprovado"])], ["Repassado pelo FNS (oficial)", _m(i["recebido"])],
        ["   dos quais de emendas parlamentares", _m(i["recebido_emendas"])],
        ["Aprovado ainda não repassado", _m(i["saldo_a_receber"]) if tem_aprovado else None],
        ["Empenhado (município)", mun("empenhado")], ["Liquidado (município)", mun("liquidado")],
        ["Pago (município)", mun("pago")],
        ["Saldo financeiro disponível", mun("saldo_financeiro")],
        ["Saldo de planos ainda não executado", None if not i["total_planos"] else _m(i["saldo_plano"])],
        ["% de execução financeira (pago ÷ plano)", _pct(i["perc_execucao"])],
        ["Aprovado de propostas sem plano cadastrado", _m(i["aprovado_sem_plano"]) if tem_aprovado else None],
        ["Propostas sem lançamento do município", i.get("propostas_sem_lancamento", 0)],
    ]
    return Secao("Indicadores da execução", tabelas=[Tabela(["Indicador", "Valor"], linhas)])


def _linhas_props(props: list[dict]) -> list[list]:
    return [[p["numero_proposta"], p["exercicio"], p["origem_rotulo"], p["destinacao_rotulo"],
             _apr(p["aprovado"]), _m(p["recebido"]), _m(_mun(p, "empenhado")), _m(_mun(p, "liquidado")),
             _m(_mun(p, "pago")), _m(_mun(p, "saldo_financeiro")), _m(p.get("saldo_plano")),
             _pct(_mun(p, "perc_execucao")), "sem lançamento" if p["sem_lancamento"] else ""] for p in props]


COLS_PROPS = ["Nº Proposta", "Ano", "Modalidade", "Área", "Aprovado", "Repassado", "Empenhado", "Liquidado",
              "Pago", "Saldo financeiro", "Saldo do plano", "% exec.", "Obs."]


def _cons(linhas: list[dict], com_aprovado: bool, sem_lancamento_total: bool) -> Tabela:
    def mun(v):
        return None if sem_lancamento_total else _m(v)

    if com_aprovado:
        cols = ["Modalidade", "Qtd", "Aprovado", "Repassado", "Pago", "Saldo financeiro"]
        ls = [[l["rotulo"], l["qtd"], _apr(l["aprovado"]), _m(l["recebido"]), mun(l["pago"]),
               mun(l["saldo_financeiro"])] for l in linhas]
    else:
        cols = ["Área", "Qtd", "Repassado", "Empenhado", "Liquidado", "Pago", "Saldo financeiro"]
        ls = [[l["rotulo"], l["qtd"], _m(l["recebido"]), mun(l["empenhado"]), mun(l["liquidado"]),
               mun(l["pago"]), mun(l["saldo_financeiro"])] for l in linhas]

    def soma(i):
        vals = [r[i] for r in ls if r[i] is not None]
        return _m(sum(float(v) for v in vals)) if vals else None

    tot = ["TOTAL GERAL", sum(l["qtd"] for l in linhas)] + [soma(i) for i in range(2, len(cols))]
    return Tabela(cols, ls + [tot])


def montar(tipo: str, painel: dict, alertas: dict, ficha: dict | None, periodo: str | None = None) -> Documento:
    titulo = TIPOS[tipo]
    c = painel["consolidado"]
    props = painel["propostas"]
    sem_tudo = bool(props) and all(p["sem_lancamento"] for p in props)
    per = periodo or modelo.periodo_padrao(painel["filtros"].get("exercicio"))
    doc = Documento(titulo=titulo, subtitulo=_subtitulo(painel), periodo=per, filtros=_filtros(painel),
                    fonte="InvestSUS / FNS · lançamentos do município",
                    atualizacao="sincronização oficial + registro auditável", avisos=[AVISO_FONTES])
    if tipo != "individual":
        doc.grupos = _grupos(props)

    if tipo == "consolidado":
        doc.secoes = [_indicadores(painel),
                      Secao("Execução por proposta", tabelas=[Tabela(COLS_PROPS, _linhas_props(props))])]
        return doc
    if tipo == "modalidade":
        doc.secoes = [
            Secao("Consolidação por modalidade de recurso",
                  ["Cada proposta entra uma única vez; uma emenda destinada à MAC aparece também no total MAC "
                   "do relatório por área, sem duplicar o total geral."],
                  [_cons(c["por_origem"], True, sem_tudo)]),
            Secao("Modalidade × área", tabelas=[Tabela(
                ["Modalidade", "Área", "Qtd", "Aprovado", "Repassado", "Pago", "Saldo financeiro"],
                [[painel["opcoes"]["origens"].get(m["origem"], "A classificar"),
                  painel["opcoes"]["destinacoes"].get(m["destinacao"], "A classificar"), m["qtd"],
                  _apr(m["aprovado"]), _m(m["recebido"]), None if sem_tudo else _m(m["pago"]),
                  None if sem_tudo else _m(m["saldo_financeiro"])]
                 for m in c["matriz"]])]),
        ]
        return doc
    if tipo == "area":
        doc.secoes = [Secao("Consolidação por área de aplicação", tabelas=[_cons(c["por_destinacao"], False, sem_tudo)])]
        return doc
    if tipo == "saldos":
        ls = []
        for p in props:
            mv = p["movimentos"]
            sem = p["sem_lancamento"]
            ls.append([p["numero_proposta"], None if sem else _m(mv["saldo_inicial"]), _m(p["recebido"]),
                       None if sem else _m(mv["rendimento"]), _m(_mun(p, "pago")),
                       None if sem else _m(mv["devolucao"]), None if sem else _m(mv["outra_saida"]),
                       _m(_mun(p, "saldo_financeiro")), _m(p.get("saldo_extrato")),
                       _m(p.get("diferenca_conciliacao"))])
        doc.secoes = [Secao(
            "Demonstrativo de saldos por proposta",
            ["Saldo financeiro = saldo inicial + repasses recebidos + rendimentos - pagamentos - devoluções - "
             "outras saídas. É diferente do saldo do plano ainda não executado. Proposta sem lançamento do "
             "município aparece como \"Dados não disponíveis\"."],
            [Tabela(["Nº Proposta", "Saldo inicial", "Repassado FNS", "Rendimentos", "Pagamentos", "Devoluções",
                     "Outras saídas", "Saldo calculado", "Saldo do extrato", "Diferença"], ls)])]
        return doc
    if tipo == "pendencias":
        ls = [[a["numero_proposta"], ROTULO_NIVEL.get(a["nivel"], a["nivel"]),
               a["problema"] + (f" ({a['acao']})" if a.get("acao") else ""),
               a.get("responsavel"), a["providencia"]] for a in alertas["alertas"]]
        sem = [p for p in props if p["sem_lancamento"]]
        doc.secoes = [
            Secao("Pendências e alertas", [alertas["aviso"]],
                  [Tabela(["Nº Proposta", "Nível", "Problema", "Responsável", "Providência recomendada"], ls)]),
            Secao("Propostas sem lançamento de execução", tabelas=[Tabela(
                ["Nº Proposta", "Ano", "Aprovado", "Repassado"],
                [[p["numero_proposta"], p["exercicio"], _apr(p["aprovado"]), _m(p["recebido"])] for p in sem])]),
        ]
        return doc

    # individual
    assert ficha is not None
    idf, r = ficha["identificacao"], ficha["resumo"]
    doc.titulo = f"{titulo} — proposta {idf['numero_proposta']}"
    doc.filtros = f"Exercício {idf['exercicio']}" if idf.get("exercicio") else ""
    linha_painel = next((p for p in props if p["numero_proposta"] == idf["numero_proposta"]), None)
    if linha_painel:
        doc.grupos = _grupos([linha_painel], fixas=False)
    acoes = [a for a in ficha["acoes"] if a["ativa"]]
    lanc = [[a["descricao"], ROTULO_TIPO.get(l["tipo"], l["tipo"]), _dt(l["data"]), _m(l["valor"]), l["fornecedor"],
             l["numero_empenho"], l["ordem_bancaria"], l["documento_comprobatorio"], l["origem_dado"],
             l["status_validacao"]]
            for a in ficha["acoes"] for l in a["lancamentos"] if not l["cancelado"]]
    sem_lanc = not lanc
    tot = ["TOTAL", _m(sum(a["previsto_original"] for a in acoes)), _m(sum(a["previsto"] for a in acoes)),
           _m(sum(a["empenhado"] for a in acoes)), _m(sum(a["liquidado"] for a in acoes)),
           _m(sum(a["pago"] for a in acoes)), _m(sum(a["saldo_a_pagar"] for a in acoes)),
           _m(sum(a["saldo_plano"] for a in acoes)), _pct(r["perc_execucao"])]
    f = ficha["ficha"] or {}
    doc.secoes = [
        Secao("Identificação", tabelas=[Tabela(["Campo", "Informação"], [
            ["Nº Proposta", idf["numero_proposta"]], ["Emenda", idf["numero_emenda"]],
            ["Modalidade", ficha["classificacao"]["origem_rotulo"]], ["Área", ficha["classificacao"]["destinacao_rotulo"]],
            ["Objeto", idf["objeto"]], ["Programa/ação", f.get("programa_acao") or idf.get("acao_orcamentaria")],
            ["Situação da proposta", idf.get("situacao_proposta_texto") or idf.get("fase_rotulo")],
            ["Prazo de execução", _dt(f.get("prazo_execucao"))],
            ["Responsável", f.get("responsavel")]])]),
        Secao("Resumo financeiro", tabelas=[Tabela(["Item", "Valor"], [
            ["Valor aprovado (oficial)", _apr(r["aprovado"])], ["Repassado pelo FNS (oficial)", _m(r["recebido"])],
            ["A receber do FNS", _m(r["saldo_a_receber"]) if r["aprovado"] else None],
            ["Valor do plano de trabalho", _m(r["valor_plano"]) if r.get("tem_plano") else None],
            ["Empenhado", None if sem_lanc else _m(r["empenhado"])],
            ["Liquidado", None if sem_lanc else _m(r["liquidado"])], ["Pago", None if sem_lanc else _m(r["pago"])],
            ["Saldo financeiro disponível", None if r.get("sem_lancamento") else _m(r["saldo_financeiro"])],
            ["Saldo do plano não executado", _m(r["saldo_plano"])], ["% de execução", _pct(r["perc_execucao"])]])]),
        Secao("Execução por ação (previsto × executado)",
              paragrafos=[] if acoes else ["Nenhuma ação cadastrada no plano de trabalho."],
              tabelas=[Tabela(["Ação/Despesa", "Previsto original", "Previsto atual", "Empenhado", "Liquidado", "Pago",
                               "Saldo a pagar", "Saldo do plano", "% exec."],
                              [[a["descricao"], _m(a["previsto_original"]), _m(a["previsto"]), _m(a["empenhado"]),
                                _m(a["liquidado"]), _m(a["pago"]), _m(a["saldo_a_pagar"]), _m(a["saldo_plano"]),
                                _pct(a["perc_execucao"])] for a in acoes] + [tot])] if acoes else []),
        Secao("Lançamentos", paragrafos=[] if lanc else ["Não houve lançamento de execução."],
              tabelas=[Tabela(["Ação", "Tipo", "Data", "Valor", "Fornecedor", "Empenho", "OB", "Documento",
                               "Origem", "Validação"], lanc)] if lanc else []),
        Secao("Pendências", paragrafos=[f"[{ROTULO_NIVEL.get(a['nivel'], a['nivel'])}] {a['problema']} — "
                                        f"{a['providencia']}" for a in ficha["alertas"]]
              or ["Nenhuma pendência identificada."]),
    ]
    return doc


def pdf(doc: Documento, ident: Identificacao) -> bytes:
    return modelo.pdf(doc, ident)


def xlsx(doc: Documento, ident: Identificacao) -> bytes:
    return modelo.xlsx(doc, ident)
