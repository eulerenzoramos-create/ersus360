"""
Conferência e-Gestor APS × FNS por parcela.

O e-Gestor APS calcula o valor de cada parcela (plano orçamentário) e o FNS faz o
crédito (OB). Este serviço compara, componente a componente, o valor efetivo do
e-Gestor com o que o FNS creditou PARA A MESMA PARCELA — identificada pelo campo
oficial "Comp./Parcela" do consultafns (ex.: "11/12 em 2026"), e não pelo mês do
crédito. Nada é estimado: se o FNS ainda não creditou a parcela, a situação é
"aguardando_pagamento_fns"; se o consultafns não responder, "fns_indisponivel".

Fontes (públicas, sem autenticação):
  - e-Gestor APS: relatorioaps-prd.saude.gov.br/financiamento/pagamento (AGRUPADO)
  - FNS: consultafns.saude.gov.br/recursos/consulta-detalhada/detalhe-pagamento
"""
from __future__ import annotations

import re
import time
import unicodedata
from datetime import date
from typing import Any, Awaitable, Callable

# (trecho normalizado da descrição → coSeqPlanoOrcamentario do e-Gestor)
# A ordem importa: o primeiro trecho encontrado define o plano.
_PLANOS_APS: list[tuple[str, int]] = [
    ("EQUIPES DE SAUDE DA FAMILIA", 8),
    ("SAUDE BUCAL", 10),
    ("MULTIPROFISSIONAIS", 9),
    ("AGENTES COMUNITARIOS DE SAUDE", 2),
    ("DEMAIS PROGRAMAS", 11),
    ("PER CAPITA", 12),
    ("PROMOCAO A SAUDE", 16),
    ("ACADEMIA DA SAUDE", 7),
]

_TOL = 0.02  # tolerância de centavos


def _norm(s: str | None) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9]+", " ", s.upper()).strip()


def plano_aps(descricao: str | None) -> int | None:
    """Plano orçamentário da APS (co_seq do e-Gestor) a partir da descrição oficial."""
    n = _norm(descricao)
    for trecho, co_seq in _PLANOS_APS:
        if trecho in n:
            return co_seq
    return None


def parcela_do_credito(competencia: str | None) -> tuple[int, int] | None:
    """'11/12 em 2026' ou '11 em 2026' → (2026, 11). 'Única em 2026' → None."""
    m = re.match(r"\s*(\d{1,2})(?:\s*/\s*\d{1,2})?\s*em\s*(\d{4})", competencia or "")
    return (int(m.group(2)), int(m.group(1))) if m else None


def meses_de_busca(nu_parcela: str, hoje: date | None = None) -> list[tuple[int, int]]:
    """Mês em que o FNS paga a parcela AAAAMM (MM/AAAA) e o seguinte (OBs complementares),
    sem consultar meses futuros."""
    hoje = hoje or date.today()
    ano, mes = int(nu_parcela[:4]), int(nu_parcela[4:])
    seguinte = (ano + 1, 1) if mes == 12 else (ano, mes + 1)
    return [(a, m) for a, m in ((ano, mes), seguinte) if (a, m) <= (hoje.year, hoje.month)]


def _mes_label(ano: int, mes: int) -> str:
    nomes = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
    return f"{nomes[mes - 1]}/{ano}"


# ── Cache curto dos créditos do FNS por mês (o consultafns é lento) ─────────────
_CACHE: dict[tuple[str, int, int], tuple[float, list[dict]]] = {}
_TTL = 1800.0


def limpar_cache() -> None:
    _CACHE.clear()


async def creditos_fns_mes(
    buscar: Callable[[int, int], Awaitable[list[dict]]], chave_mun: str, ano: int, mes: int,
) -> list[dict]:
    chave = (chave_mun, ano, mes)
    hit = _CACHE.get(chave)
    if hit and time.monotonic() - hit[0] < _TTL:
        return hit[1]
    itens = await buscar(ano, mes)  # erros sobem: falha não é cacheada
    _CACHE[chave] = (time.monotonic(), itens)
    return itens


def _componente_fns(item: dict) -> str:
    pf = ((item.get("id") or {}).get("programaFundo") or {})
    return pf.get("descricao") or item.get("nomeComponente") or ""


def _eh_aps(item: dict) -> bool:
    return _norm(item.get("nomeComponente")) == "ATENCAO PRIMARIA" or (
        plano_aps(_componente_fns(item)) is not None
        and "COMBATE" not in _norm(_componente_fns(item))
    )


def conferir(
    competencia_egestor: dict,
    creditos_por_mes: dict[tuple[int, int], list[dict]] | None,
    nomes_planos: dict[int, str] | None = None,
) -> dict[str, Any]:
    """Compara uma parcela do e-Gestor (formato de egestor_aps.buscar_pagamentos)
    com os créditos do FNS dos meses consultados. `creditos_por_mes=None` → FNS indisponível."""
    nu = competencia_egestor["nu_parcela"]
    alvo = (int(nu[:4]), int(nu[4:]))
    nomes_planos = nomes_planos or {}

    egestor: dict[int, float] = {}
    descricoes: dict[int, str] = {}
    for comp in competencia_egestor.get("componentes", []):
        co = int(comp.get("co_seq") or 0)
        egestor[co] = egestor.get(co, 0.0) + float(comp.get("vl_total") or 0)
        descricoes[co] = comp.get("descricao") or nomes_planos.get(co, str(co))

    base = {
        "nu_parcela": nu,
        "competencia_cnes": competencia_egestor.get("competencia"),
        "parcela": competencia_egestor.get("parcela"),
        "mes_pagamento_previsto": _mes_label(*alvo),
        "total_egestor": round(sum(egestor.values()), 2),
        "fontes": {
            "egestor": "e-Gestor APS — /financiamento/pagamento (AGRUPADO)",
            "fns": "consultafns.saude.gov.br — Detalhar pagamento (Comp./Parcela)",
        },
    }

    if creditos_por_mes is None:
        return {**base, "situacao": "fns_indisponivel", "total_pago_fns": None,
                "diferenca": None, "planos": [
                    {"co_seq": co, "descricao": descricoes[co], "vl_egestor": round(v, 2),
                     "vl_fns": None, "diferenca": None, "situacao": "fns_indisponivel", "ordens": []}
                    for co, v in sorted(egestor.items(), key=lambda x: -x[1])],
                "outros_creditos_aps": [], "meses_consultados": []}

    fns: dict[int, float] = {}
    ordens: dict[int, list[dict]] = {}
    outros: list[dict] = []
    for (ano, mes), itens in sorted(creditos_por_mes.items()):
        for it in itens:
            if not _eh_aps(it):
                continue
            desc = _componente_fns(it)
            co = plano_aps(desc)
            valor = float(it.get("valorLiquido") or 0)
            ob = {
                "ob": str(it.get("numeroDocumentoSiafi") or ""),
                "data": it.get("dataCriacaoSiafi"),
                "valor": round(valor, 2),
                "competencia_fns": it.get("competencia"),
                "portaria": it.get("nuPortaria"),
            }
            if co is not None and parcela_do_credito(it.get("competencia")) == alvo:
                fns[co] = fns.get(co, 0.0) + valor
                ordens.setdefault(co, []).append(ob)
                descricoes.setdefault(co, nomes_planos.get(co, desc))
            elif (ano, mes) == alvo:
                # crédito de APS no mesmo mês, mas de outra parcela/portaria (ex.: "Única em 2026")
                outros.append({**ob, "descricao": desc})

    planos = []
    for co in sorted(set(egestor) | set(fns), key=lambda c: -max(egestor.get(c, 0), fns.get(c, 0))):
        ve, vf = round(egestor.get(co, 0.0), 2), round(fns.get(co, 0.0), 2)
        if ve == 0 and vf == 0:
            continue
        if vf == 0:
            sit = "aguardando_pagamento"
        elif abs(ve - vf) < _TOL:
            sit = "confere"
        else:
            sit = "diferenca"
        planos.append({"co_seq": co, "descricao": descricoes.get(co, str(co)), "vl_egestor": ve,
                       "vl_fns": vf, "diferenca": round(vf - ve, 2), "situacao": sit,
                       "ordens": ordens.get(co, [])})

    total_fns = round(sum(fns.values()), 2)
    if total_fns == 0:
        situacao = "aguardando_pagamento_fns"
    elif all(p["situacao"] == "confere" for p in planos):
        situacao = "pago_confere"
    else:
        situacao = "pago_com_diferenca"
    datas = sorted({o["data"] for lst in ordens.values() for o in lst if o.get("data")},
                   key=lambda d: (d[6:10], d[3:5], d[0:2]))
    return {
        **base,
        "situacao": situacao,
        "total_pago_fns": total_fns if total_fns else 0.0,
        "diferenca": round(total_fns - base["total_egestor"], 2) if total_fns else None,
        "datas_pagamento": datas,
        "meses_consultados": [_mes_label(a, m) for a, m in sorted(creditos_por_mes)],
        "planos": planos,
        "outros_creditos_aps": outros,
        "total_outros_creditos_aps": round(sum(o["valor"] for o in outros), 2),
    }
