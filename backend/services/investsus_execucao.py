"""
InvestSUS — regras da Execução Financeira dos Planos de Trabalho (sem banco, testável).

Fontes de cada número:
- aprovado / indicado ............ proposta (oficial, sincronizada do InvestSUS)
- recebido do FNS ................ soma de is_pagamentos (oficial); sem repasse detalhado,
                                   valor_pago da proposta (oficial, sem data)
- empenhado / liquidado / pago ... lançamentos do município (manual ou importado)
- saldo inicial / rendimentos /
  devoluções / outras saídas ..... movimentos da conta vinculada (manual ou importado)

Cada proposta entra UMA vez em cada dimensão (origem do recurso e destinação), então o
total por origem, o total por destinação e o total geral são sempre iguais.
"""
from __future__ import annotations

import re
from collections import defaultdict
from datetime import date
from typing import Any, Iterable

from services import investsus_federal as fed

# ── Classificação ─────────────────────────────────────────────────────────────

ORIGENS: dict[str, str] = {
    "rp6": "Emendas RP 6 (individual)",
    "rp7": "Emendas RP 7 (bancada)",
    "rp8": "Emendas RP 8 (comissão)",
    "programa": "Programas MS",
    "outros_federais": "Outros recursos federais",
}
ORIGENS_EMENDA = {"rp6", "rp7", "rp8"}
DESTINACOES: dict[str, str] = {
    "aps_pap": "Atenção Primária – APS/PAP",
    "mac": "Média e Alta Complexidade – MAC",
    "outra": "Outros programas do MS",
}
A_CLASSIFICAR = "a_classificar"

TIPOS_LANCAMENTO: dict[str, tuple[tuple[str, ...], int]] = {
    # tipo: (estágios que o lançamento movimenta, sinal)
    "empenho": (("empenhado",), 1),
    "anulacao_empenho": (("empenhado",), -1),
    "liquidacao": (("liquidado",), 1),
    "estorno_liquidacao": (("liquidado",), -1),
    "pagamento": (("pago",), 1),
    "estorno_pagamento": (("pago",), -1),
    # Controle simplificado (modelo das planilhas do Fundo): a nota fiscal paga baixa o
    # saldo da ação de uma vez — conta como empenhada, liquidada e paga.
    "nota_fiscal": (("empenhado", "liquidado", "pago"), 1),
    "estorno_nota_fiscal": (("empenhado", "liquidado", "pago"), -1),
}
TIPOS_PAGO = {t for t, (est, _) in TIPOS_LANCAMENTO.items() if "pago" in est}
TIPOS_MOVIMENTO = {"saldo_inicial": 1, "rendimento": 1, "devolucao": -1, "outra_saida": -1}
SITUACOES_PLANO = {
    "nao_cadastrado": "Não cadastrado",
    "em_elaboracao": "Em elaboração",
    "aprovado": "Aprovado",
    "em_execucao": "Em execução",
    "concluido": "Concluído",
}

# Limiares dos alertas (não são regras do MS; ajustáveis pelo município)
DIAS_PRAZO_PROXIMO = 60
DIAS_SEM_EXECUCAO = 180
PERC_BAIXA_EXECUCAO = 20.0
TOLERANCIA = 0.01


def _txt(*partes) -> str:
    return fed._norm(" | ".join(str(x) for x in partes if x))


def origem_automatica(p: Any) -> str:
    md = getattr(p, "modalidade", None)
    if not md:
        tipo = getattr(p, "tipo_emenda", None)
        md = fed.modalidade_de_tipo_emenda(getattr(tipo, "value", tipo))
    return md if md in ORIGENS else A_CLASSIFICAR


def destinacao_automatica(p: Any) -> str:
    """APS/PAP, MAC ou outra a partir das informações oficiais da proposta."""
    comp = fed._norm(getattr(p, "componente", None))
    if comp in ("pap", "aps"):
        return "aps_pap"
    if comp == "mac":
        return "mac"
    prog = getattr(p, "programa", None)
    t = _txt(getattr(p, "acao_orcamentaria", None), getattr(p, "bloco_financiamento", None),
             getattr(p, "finalidade", None), getattr(p, "tipo_objeto", None), getattr(p, "objeto", None),
             getattr(prog, "nome", None) if prog else None)
    if "2e89" in t or re.search(r"atencao primaria|atencao basica|\bpap\b|\baps\b|saude da familia", t):
        return "aps_pap"
    if "2e90" in t or re.search(r"media e alta|\bmac\b|especializada|hospitalar|ambulatorial", t):
        return "mac"
    if t:
        return "outra"
    return A_CLASSIFICAR


def classificar(p: Any, ficha: Any | None) -> dict:
    o_man = getattr(ficha, "origem_recurso", None) if ficha else None
    d_man = getattr(ficha, "destinacao", None) if ficha else None
    origem = o_man if o_man in ORIGENS else origem_automatica(p)
    dest = d_man if d_man in DESTINACOES else destinacao_automatica(p)
    return {
        "origem": origem, "origem_rotulo": ORIGENS.get(origem, "A classificar"),
        "origem_manual": bool(o_man in ORIGENS),
        "destinacao": dest, "destinacao_rotulo": DESTINACOES.get(dest, "A classificar"),
        "destinacao_manual": bool(d_man in DESTINACOES),
        "eh_emenda": origem in ORIGENS_EMENDA,
    }


# ── Cálculos ──────────────────────────────────────────────────────────────────

def _r(v: float) -> float:
    return round(v + 0.0, 2)


def _ativos(lancs: Iterable[Any]) -> list[Any]:
    return [l for l in lancs if not getattr(l, "cancelado", False)]


def totais_lancamentos(lancs: Iterable[Any]) -> dict:
    t = {"empenhado": 0.0, "liquidado": 0.0, "pago": 0.0}
    for l in _ativos(lancs):
        estagios, sinal = TIPOS_LANCAMENTO.get(l.tipo, ((), 0))
        for estagio in estagios:
            t[estagio] += sinal * float(l.valor or 0)
    return {k: _r(v) for k, v in t.items()}


def resumo_acao(acao: Any, lancs: Iterable[Any]) -> dict:
    lancs = [l for l in lancs if l.acao_id == acao.id]
    t = totais_lancamentos(lancs)
    previsto = float(acao.valor_previsto_atual or 0)
    return {
        "previsto_original": _r(float(acao.valor_previsto_original or 0)),
        "previsto": _r(previsto),
        **t,
        "saldo_a_pagar": _r(t["liquidado"] - t["pago"]),
        "empenhado_a_pagar": _r(t["empenhado"] - t["pago"]),
        "saldo_plano": _r(previsto - t["pago"]),
        "perc_execucao": round(100 * t["pago"] / previsto, 1) if previsto > 0 else None,
        "qtd_lancamentos": len(_ativos(lancs)),
        "sem_lancamento": not _ativos(lancs),
    }


def recebido_fns(p: Any, pagamentos: Iterable[Any]) -> dict:
    pags = [pg for pg in pagamentos if float(pg.valor or 0)]
    soma = _r(sum(float(pg.valor or 0) for pg in pags))
    pago_prop = _r(float(getattr(p, "valor_pago", 0) or 0))
    datas = sorted(pg.data_pagamento for pg in pags if pg.data_pagamento)
    if soma:
        valor, base = soma, "repasses"
    else:
        valor, base = pago_prop, ("proposta" if pago_prop else "sem_repasse")
    return {
        "valor": valor, "base": base, "qtd_parcelas": len(pags),
        "primeiro_repasse": datas[0].isoformat() if datas else None,
        "ultimo_repasse": datas[-1].isoformat() if datas else None,
        "divergencia_registros": bool(soma and pago_prop and abs(soma - pago_prop) > TOLERANCIA),
        "valor_pago_proposta": pago_prop,
    }


def totais_movimentos(movs: Iterable[Any]) -> dict:
    t = {k: 0.0 for k in TIPOS_MOVIMENTO}
    for m in movs:
        if not getattr(m, "cancelado", False) and m.tipo in t:
            t[m.tipo] += float(m.valor or 0)
    return {k: _r(v) for k, v in t.items()}


def resumo_ficha(p: Any, ficha: Any | None, acoes: list[Any], lancs: list[Any], movs: list[Any],
                 pagamentos: list[Any]) -> dict:
    ativas = [a for a in acoes if a.ativa]
    linhas = {a.id: resumo_acao(a, lancs) for a in ativas}
    # Lançamentos de ações inativadas continuam contando: o dinheiro saiu.
    t = totais_lancamentos(lancs)
    rec = recebido_fns(p, pagamentos)
    mv = totais_movimentos(movs)
    aprovado = _r(float(getattr(p, "valor_aprovado", 0) or 0))
    valor_plano = _r(sum(float(a.valor_previsto_atual or 0) for a in ativas))
    plano_original = _r(sum(float(a.valor_previsto_original or 0) for a in ativas))
    saldo_fin = _r(mv["saldo_inicial"] + rec["valor"] + mv["rendimento"] - t["pago"] - mv["devolucao"] - mv["outra_saida"])
    tem_plano = bool(ativas)
    pendentes_validacao = sum(1 for l in _ativos(lancs) if l.status_validacao != "validado") + \
        sum(1 for m in movs if not m.cancelado and m.status_validacao != "validado")
    origens_dado = sorted({l.origem_dado for l in _ativos(lancs)} | {m.origem_dado for m in movs if not m.cancelado})
    return {
        "aprovado": aprovado,
        "indicado": _r(float(getattr(p, "valor_indicado", 0) or 0)),
        "recebido": rec["valor"],
        "recebido_info": rec,
        "saldo_a_receber": _r(max(0.0, aprovado - rec["valor"])),
        "valor_plano": valor_plano,
        "valor_plano_original": plano_original,
        **t,
        "saldo_a_pagar": _r(t["liquidado"] - t["pago"]),
        "empenhado_a_pagar": _r(t["empenhado"] - t["pago"]),
        "saldo_plano": _r(valor_plano - t["pago"]) if tem_plano else None,
        "saldo_financeiro": saldo_fin,
        "movimentos": mv,
        "perc_execucao": round(100 * t["pago"] / valor_plano, 1) if valor_plano > 0 else None,
        "tem_plano": tem_plano,
        "qtd_acoes": len(ativas),
        "qtd_lancamentos": len(_ativos(lancs)),
        "sem_lancamento": not _ativos(lancs) and not any(not m.cancelado for m in movs),
        "pendentes_validacao": pendentes_validacao,
        "origens_dado": origens_dado,
        "acoes": linhas,
        "saldo_extrato": getattr(ficha, "saldo_extrato", None) if ficha else None,
        "diferenca_conciliacao": (_r(saldo_fin - ficha.saldo_extrato)
                                  if ficha is not None and ficha.saldo_extrato is not None else None),
    }


def resumo_naturezas(naturezas_plano: dict[str, dict], acoes: list[Any], lancs: list[Any]) -> list[dict]:
    """Saldo por natureza (elemento) de despesa: previsto no plano oficial do InvestSUS
    (soma de todos os estabelecimentos) − notas/pagamentos baixados naquela natureza.
    Lançamento sem natureza usa a natureza da ação."""
    nat_acao = {a.id: (a.natureza_despesa or "") for a in acoes}
    linhas: dict[str, dict] = {}
    for cod, info in naturezas_plano.items():
        linhas[cod] = {"codigo": cod, "descricao": info.get("descricao"), "previsto": _r(info.get("valor") or 0),
                       "pago": 0.0, "qtd_notas": 0}
    for l in _ativos(lancs):
        estagios, sinal = TIPOS_LANCAMENTO.get(l.tipo, ((), 0))
        if "pago" not in estagios:
            continue
        cod = (getattr(l, "natureza_despesa", None) or nat_acao.get(l.acao_id) or "").strip() or "sem_natureza"
        ln = linhas.setdefault(cod, {"codigo": cod, "descricao": None, "previsto": 0.0, "pago": 0.0, "qtd_notas": 0})
        ln["pago"] = _r(ln["pago"] + sinal * float(l.valor or 0))
        ln["qtd_notas"] += 1 if sinal > 0 else 0
    for ln in linhas.values():
        ln["saldo"] = _r(ln["previsto"] - ln["pago"])
        ln["fora_do_plano"] = ln["previsto"] == 0 and ln["pago"] != 0
    return sorted(linhas.values(), key=lambda x: x["codigo"])


# ── Consolidação ──────────────────────────────────────────────────────────────

CAMPOS_SOMA = ("aprovado", "recebido", "saldo_a_receber", "valor_plano", "empenhado", "liquidado", "pago",
               "saldo_a_pagar", "saldo_financeiro")


def _zero() -> dict:
    return {"qtd": 0, **{c: 0.0 for c in CAMPOS_SOMA}, "saldo_plano": 0.0}


def _somar(acc: dict, r: dict) -> None:
    acc["qtd"] += 1
    for c in CAMPOS_SOMA:
        acc[c] += r[c]
    acc["saldo_plano"] += r["saldo_plano"] or 0.0


def _fechar(acc: dict) -> dict:
    out = {k: (_r(v) if isinstance(v, float) else v) for k, v in acc.items()}
    out["perc_execucao"] = round(100 * acc["pago"] / acc["valor_plano"], 1) if acc["valor_plano"] > 0 else None
    return out


def consolidar(itens: list[dict]) -> dict:
    """`itens`: [{"classificacao": classificar(...), "resumo": resumo_ficha(...)}]."""
    total, emendas = _zero(), _zero()
    por_origem: dict[str, dict] = defaultdict(_zero)
    por_dest: dict[str, dict] = defaultdict(_zero)
    matriz: dict[tuple[str, str], dict] = defaultdict(_zero)
    for it in itens:
        c, r = it["classificacao"], it["resumo"]
        _somar(total, r)
        _somar(por_origem[c["origem"]], r)
        _somar(por_dest[c["destinacao"]], r)
        _somar(matriz[(c["origem"], c["destinacao"])], r)
        if c["eh_emenda"]:
            _somar(emendas, r)

    def _linhas(rotulos: dict, dados: dict) -> list[dict]:
        out = [{"chave": k, "rotulo": v, **_fechar(dados.get(k) or _zero())} for k, v in rotulos.items()]
        if A_CLASSIFICAR in dados:
            out.append({"chave": A_CLASSIFICAR, "rotulo": "A classificar", **_fechar(dados[A_CLASSIFICAR])})
        return out

    com_plano = sum(1 for it in itens if it["resumo"]["tem_plano"])
    return {
        "total": {**_fechar(total), "qtd_planos": com_plano,
                  "aprovado_sem_plano": _r(sum(it["resumo"]["aprovado"] for it in itens if not it["resumo"]["tem_plano"]))},
        "emendas": _fechar(emendas),
        "por_origem": _linhas(ORIGENS, por_origem),
        "por_destinacao": _linhas(DESTINACOES, por_dest),
        "matriz": [{"origem": o, "destinacao": d, **_fechar(v)} for (o, d), v in sorted(matriz.items())],
    }


def evolucao_mensal(lancs: Iterable[Any], pagamentos: Iterable[Any]) -> list[dict]:
    meses: dict[str, dict] = defaultdict(lambda: {"recebido": 0.0, "pago": 0.0})
    for l in _ativos(lancs):
        if l.tipo in TIPOS_PAGO and l.data:
            meses[l.data.strftime("%Y-%m")]["pago"] += TIPOS_LANCAMENTO[l.tipo][1] * float(l.valor or 0)
    for pg in pagamentos:
        if pg.data_pagamento:
            meses[pg.data_pagamento.strftime("%Y-%m")]["recebido"] += float(pg.valor or 0)
    return [{"mes": k, "recebido": _r(v["recebido"]), "pago": _r(v["pago"])} for k, v in sorted(meses.items())]


# ── Duplicidade ───────────────────────────────────────────────────────────────

def _limpo(v: str | None) -> str:
    return re.sub(r"[^0-9a-z]", "", (v or "").lower())


def chave_dedup(tipo: str, acao_id: int, data: date, valor: float, numero_empenho: str | None,
                numero_liquidacao: str | None, ordem_bancaria: str | None, fornecedor_documento: str | None,
                documento: str | None = None, fornecedor: str | None = None) -> str:
    """Mesmo documento = mesma despesa. Pagamento: OB; liquidação: nº da liquidação;
    empenho: nº do empenho; nota fiscal: nº da NF + fornecedor (o número se repete entre
    fornecedores). Anulações/estornos e lançamentos sem número usam
    data + valor + fornecedor + ação (o mesmo lançamento digitado duas vezes)."""
    if tipo == "nota_fiscal" and _limpo(documento):
        return f"{tipo}|{_limpo(documento)}|{_limpo(fornecedor_documento) or _limpo(fornecedor)}"
    numero = {"pagamento": ordem_bancaria, "liquidacao": numero_liquidacao, "empenho": numero_empenho}.get(tipo)
    if _limpo(numero):
        return f"{tipo}|{_limpo(numero)}"
    ref = _limpo(numero_liquidacao or numero_empenho or "")
    return f"{tipo}|#a{acao_id}|{data.isoformat()}|{valor:.2f}|{_limpo(fornecedor_documento)}|{ref}"


def chave_numerada(chave: str) -> bool:
    """Chave baseada no número do documento (vale para o município inteiro)."""
    return "#" not in chave


# ── Alertas ───────────────────────────────────────────────────────────────────

def _alerta(nivel: str, tipo: str, problema: str, providencia: str, acao: str | None = None) -> dict:
    return {"nivel": nivel, "tipo": tipo, "problema": problema, "providencia": providencia, "acao": acao}


def alertas(p: Any, ficha: Any | None, resumo: dict, acoes: list[Any], lancs: list[Any],
            docs_por_lancamento: set[int], hoje: date) -> list[dict]:
    """Pendências de gestão. Saldo ainda não executado NUNCA é tratado como irregularidade
    por si só — só gera aviso quando há prazo ou tempo decorrido que justifique."""
    out: list[dict] = []
    r = resumo
    recebido = r["recebido"]
    if recebido > 0 and not r["tem_plano"]:
        out.append(_alerta("urgente", "sem_plano", "Recurso recebido do FNS sem plano de trabalho cadastrado.",
                           "Cadastrar ou importar as ações do plano de trabalho aprovado."))
    if r["tem_plano"] and r["qtd_lancamentos"] == 0 and recebido > 0:
        out.append(_alerta("informativo", "sem_movimentacao", "Plano cadastrado sem movimentação financeira lançada.",
                           "Lançar empenhos/pagamentos realizados ou confirmar que a execução ainda não começou."))
    prim = r["recebido_info"]["primeiro_repasse"]
    if (r["perc_execucao"] is not None and r["perc_execucao"] < PERC_BAIXA_EXECUCAO and prim
            and (hoje - date.fromisoformat(prim)).days >= DIAS_SEM_EXECUCAO):
        out.append(_alerta("atencao", "baixa_execucao",
                           f"Execução de {r['perc_execucao']:.1f}% após {(hoje - date.fromisoformat(prim)).days} dias "
                           "do primeiro repasse.",
                           "Verificar andamento das contratações. Saldo em conta não é irregular por si só."))
    prazo = getattr(ficha, "prazo_execucao", None) if ficha else None
    if prazo and (r["perc_execucao"] or 0) < 100:
        dias = (prazo - hoje).days
        if dias < 0:
            out.append(_alerta("critico", "prazo_vencido", f"Prazo de execução vencido há {-dias} dia(s).",
                               "Verificar prorrogação, reprogramação ou devolução de saldo junto ao FNS."))
        elif dias <= DIAS_PRAZO_PROXIMO:
            out.append(_alerta("urgente", "prazo_proximo", f"Prazo de execução vence em {dias} dia(s).",
                               "Priorizar a execução ou solicitar prorrogação/reprogramação."))
    for a in acoes:
        if not a.ativa:
            continue
        ra = r["acoes"].get(a.id)
        if not ra:
            continue
        if ra["previsto"] > 0 and max(ra["empenhado"], ra["pago"]) > ra["previsto"] + TOLERANCIA:
            out.append(_alerta("urgente", "acima_previsto",
                               f"Despesa (R$ {max(ra['empenhado'], ra['pago']):,.2f}) acima do previsto "
                               f"(R$ {ra['previsto']:,.2f}).",
                               "Conferir lançamentos ou registrar a alteração autorizada do plano.", a.descricao))
        if ra["liquidado"] > ra["empenhado"] + TOLERANCIA or ra["pago"] > ra["liquidado"] + TOLERANCIA:
            out.append(_alerta("urgente", "inconsistencia_estagios",
                               "Valores inconsistentes: liquidado maior que empenhado ou pago maior que liquidado.",
                               "Conferir empenhos, liquidações e ordens bancárias lançados.", a.descricao))
        if min(ra["empenhado"], ra["liquidado"], ra["pago"]) < -TOLERANCIA:
            out.append(_alerta("urgente", "valor_negativo", "Anulações/estornos maiores que os lançamentos originais.",
                               "Conferir anulações e estornos.", a.descricao))
    sem_doc = [l for l in _ativos(lancs) if l.tipo in ("pagamento", "liquidacao")
               and not l.documento_comprobatorio and l.id not in docs_por_lancamento]
    if sem_doc:
        out.append(_alerta("atencao", "sem_comprovante",
                           f"{len(sem_doc)} liquidação(ões)/pagamento(s) sem documento comprobatório.",
                           "Informar a NF/contrato ou anexar o comprovante."))
    if r["recebido_info"]["divergencia_registros"]:
        out.append(_alerta("atencao", "divergencia_recebido",
                           f"Soma dos repasses (R$ {r['recebido']:,.2f}) difere do valor pago na proposta "
                           f"(R$ {r['recebido_info']['valor_pago_proposta']:,.2f}).",
                           "Sincronizar novamente com o InvestSUS/FNS e conferir as parcelas."))
    if r["saldo_financeiro"] < -TOLERANCIA:
        out.append(_alerta("critico", "saldo_negativo",
                           "Pagamentos e saídas superam os recursos recebidos e o saldo da conta.",
                           "Conferir lançamentos, saldo inicial, rendimentos e repasses."))
    if r["diferenca_conciliacao"] is not None and abs(r["diferenca_conciliacao"]) > TOLERANCIA:
        out.append(_alerta("atencao", "conciliacao",
                           f"Saldo calculado difere do extrato em R$ {r['diferenca_conciliacao']:,.2f}.",
                           "Conciliar a conta: rendimentos, tarifas ou pagamentos não lançados."))
    return out
