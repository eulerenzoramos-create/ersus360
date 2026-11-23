"""Previsto × Recebido das emendas parlamentares e dos programas do MS (InvestSUS).

Quadro complementar ao Previsto (Portarias) × Recebido (FNS): as emendas não têm previsão
cadastrada pelas Portarias e aparecem no FNS como "sem previsão". Aqui o previsto vem do
InvestSUS, pelas mesmas regras já usadas nos tetos e relatórios:

- previsto: um único estágio por proposta (aprovado → valor da proposta → indicado), nunca somados;
- canceladas e rejeitadas ficam fora do previsto (contadas à parte);
- recebido: valor pago informado pelo InvestSUS para a proposta;
- pago no período: pagamentos do InvestSUS com data dentro do período filtrado (qualquer exercício);
- PAP/MAC: componente gravado → tipo oficial do InvestSUS → nome oficial do programa
  (relatorio_modelo_investsus.classificar_tipo). Sem isso, fica em "Outros" — nunca deduzido.
"""
from __future__ import annotations

from datetime import date
from typing import Any, Iterable

from services import relatorio_modelo_investsus as rel
from services.investsus_tetos import valor_comprometido

FORA = {"cancelada", "rejeitada"}

UF_NOME = {
    "AC": "do Acre", "AL": "de Alagoas", "AP": "do Amapá", "AM": "do Amazonas", "BA": "da Bahia", "CE": "do Ceará",
    "DF": "do Distrito Federal", "ES": "do Espírito Santo", "GO": "de Goiás", "MA": "do Maranhão",
    "MT": "de Mato Grosso", "MS": "de Mato Grosso do Sul", "MG": "de Minas Gerais", "PA": "do Pará",
    "PB": "da Paraíba", "PR": "do Paraná", "PE": "de Pernambuco", "PI": "do Piauí", "RJ": "do Rio de Janeiro",
    "RN": "do Rio Grande do Norte", "RS": "do Rio Grande do Sul", "RO": "de Rondônia", "RR": "de Roraima",
    "SC": "de Santa Catarina", "SP": "de São Paulo", "SE": "de Sergipe", "TO": "do Tocantins",
}

AREAS = ("PAP", "MAC", "Outros")


def modalidades(uf: str | None) -> list[dict]:
    bancada = f"Emenda de Bancada {UF_NOME.get((uf or '').upper(), 'estadual')} (RP 7)"
    return [
        {"chave": "rp6", "rotulo": "Emenda Individual (RP 6)", "tipo": "individual"},
        {"chave": "rp7", "rotulo": bancada, "tipo": "coletiva"},
        {"chave": "rp8", "rotulo": "Emenda de Comissão (RP 8)", "tipo": "coletiva"},
        {"chave": "programa", "rotulo": "Programas do Ministério da Saúde (Outros)", "tipo": "programa"},
        {"chave": "outras", "rotulo": "Outras / modalidade a classificar", "tipo": "outras"},
    ]


def _sit(p: Any) -> str:
    s = getattr(p, "situacao_normalizada", None)
    return str(getattr(s, "value", s) or "")


def area_de(p: Any, modalidade: str) -> str:
    """PAP | MAC | Outros — só por campo oficial (componente, tipo oficial, programa oficial)."""
    tipo = rel.tipo_proposta(modalidade, getattr(p, "componente", None),
                             rel.tipo_oficial_de(getattr(p, "payload_original", None)), rel.programas_oficiais_de(p))
    return tipo if tipo in ("PAP", "MAC") else "Outros"


def _no_periodo(d: date | None, exercicio: int, mes_inicio: int, mes_fim: int) -> bool:
    return bool(d) and d.year == exercicio and mes_inicio <= d.month <= mes_fim


def _zero() -> dict:
    return {"qtd": 0, "previsto": 0.0, "recebido": 0.0, "a_receber": 0.0, "pago_periodo": 0.0}


def _somar(a: dict, b: dict) -> None:
    for k in ("qtd", "previsto", "recebido", "a_receber", "pago_periodo"):
        a[k] += b[k]


def _fechar(t: dict) -> dict:
    t = {k: (round(v, 2) if isinstance(v, float) else v) for k, v in t.items()}
    t["pct_recebido"] = round(100 * t["recebido"] / t["previsto"], 2) if t["previsto"] else None
    return t


def montar(propostas: Iterable[Any], modalidade_de, exercicio: int, mes_inicio: int = 1, mes_fim: int = 12,
           uf: str | None = None) -> dict:
    mods = modalidades(uf)
    chaves = {m["chave"] for m in mods}
    tot: dict[tuple[str, str], dict] = {}
    canceladas = {"qtd": 0, "valor": 0.0}
    tem_pagamentos = False

    for p in propostas:
        if (getattr(p, "esfera", None) or "federal") != "federal":
            continue
        mod = modalidade_de(p)
        mod = mod if mod in chaves else "outras"
        area = area_de(p, mod)
        pags = list(getattr(p, "pagamentos_investsus", None) or [])
        tem_pagamentos = tem_pagamentos or bool(pags)
        pago_per = sum(float(x.valor or 0) for x in pags if _no_periodo(x.data_pagamento, exercicio, mes_inicio, mes_fim))
        linha = tot.setdefault((mod, area), _zero())
        linha["pago_periodo"] += pago_per
        if getattr(p, "exercicio", None) != exercicio:
            continue
        if _sit(p) in FORA:
            canceladas["qtd"] += 1
            canceladas["valor"] += valor_comprometido(p)[0]
            continue
        prev = valor_comprometido(p)[0]
        rec = float(getattr(p, "valor_pago", 0) or 0)
        linha["qtd"] += 1
        linha["previsto"] += prev
        linha["recebido"] += rec
        linha["a_receber"] += max(prev - rec, 0.0)

    linhas = []
    for m in mods:
        areas = [{"area": a, **_fechar(tot[(m["chave"], a)])} for a in AREAS
                 if (m["chave"], a) in tot and (tot[(m["chave"], a)]["qtd"] or tot[(m["chave"], a)]["pago_periodo"])]
        if not areas and m["chave"] == "outras":
            continue
        sub = _zero()
        for a in AREAS:
            if (m["chave"], a) in tot:
                _somar(sub, tot[(m["chave"], a)])
        linhas.append({**m, "areas": areas, "total": _fechar(sub)})

    def soma(filtro) -> dict:
        s = _zero()
        for (mod, _a), v in tot.items():
            if filtro(mod):
                _somar(s, v)
        return _fechar(s)

    por_area = {a: _fechar({k: sum(v[k] for (mod, ar), v in tot.items() if ar == a)
                            for k in ("qtd", "previsto", "recebido", "a_receber", "pago_periodo")}) for a in AREAS}
    return {
        "exercicio": exercicio,
        "periodo": {"mes_inicio": mes_inicio, "mes_fim": mes_fim},
        "linhas": linhas,
        "coletivas": soma(lambda m: m in ("rp7", "rp8")),
        "emendas": soma(lambda m: m in ("rp6", "rp7", "rp8")),
        "total": soma(lambda m: True),
        "por_area": por_area,
        "canceladas": {"qtd": canceladas["qtd"], "valor": round(canceladas["valor"], 2)},
        "tem_pagamentos_com_data": tem_pagamentos,
        "fonte": "InvestSUS (propostas e pagamentos sincronizados)",
        "nota": ("Previsto = um estágio por proposta do exercício (aprovado; se ainda não aprovado, valor da proposta; "
                 "se não cadastrada, indicado). Recebido = valor pago informado pelo InvestSUS. Pago no período = "
                 "pagamentos com data no período, de qualquer exercício. PAP/MAC pelo componente ou tipo oficial; "
                 "sem isso, 'Outros'. Canceladas e rejeitadas ficam fora. Este quadro não soma ao previsto das "
                 "Portarias: no FNS esses créditos aparecem como 'sem previsão'."),
    }


def modalidade_gravada(p: Any) -> str:
    """Modalidade gravada; registros antigos derivam do tipo legado (mesma regra do router InvestSUS)."""
    from services import investsus_federal as fed
    if getattr(p, "modalidade", None):
        return p.modalidade
    te = getattr(p, "tipo_emenda", None)
    return fed.modalidade_de_tipo_emenda(getattr(te, "value", te)) or fed.MODALIDADE_A_CLASSIFICAR
