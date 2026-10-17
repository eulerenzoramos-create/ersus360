"""
Boas Práticas e Alertas do eGestor/SIAPS, geradas a partir dos resultados oficiais já captados
(substitui a lista fixa de Abr/2026 que existia em routers/siaps.py):

  • Vínculo por equipe — último relatório CVAT do SIAPS importado no ERSUS360
    (equipes Ótimo = destaque; equipes Regular = plano de melhoria). Faixas: status_cvat.
  • Qualidade por indicador — Avaliação do Quadrimestre publicada no SIAPS (services/siaps_publico):
    indicador com todas as equipes Ótimo ou com melhora = destaque; indicador com equipes em
    Regular = alerta crítico. Só contagens publicadas: nenhuma nota é recalculada.
"""
from __future__ import annotations

import json

from sqlalchemy.ext.asyncio import AsyncSession

from services import siaps_publico as sp
from services.siaps_relatorio import status_cvat


def _fmt(v: float) -> str:
    return f"{v:.2f}".replace(".", ",")


def _comp_rotulo(comp: str) -> str:
    meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    ano, _, mes = comp.partition("-")
    return f"{meses[int(mes) - 1]}/{ano}" if mes.isdigit() and 1 <= int(mes) <= 12 else comp


def itens_vinculo(rel) -> list[dict]:
    """Relatório CVAT importado → destaques (Ótimo) e planos de melhoria (Regular) por equipe."""
    linhas = json.loads(rel.linhas)
    comp = _comp_rotulo(rel.competencia)
    fonte = f"Relatório SIAPS importado — CVAT {comp}" + (" (dado preliminar)" if rel.dado_preliminar else "")
    itens = []
    for l in sorted(linhas, key=lambda x: -(x.get("pontuacao") or 0)):
        p, st = l.get("pontuacao"), status_cvat(l.get("pontuacao"))
        base = {"ubs": l.get("ubs") or "—", "equipe": l.get("equipe") or "—", "fonte": fonte, "periodo": comp}
        if st == "otimo":
            itens.append({**base, "tipo": "vinculo", "destaque": True,
                          "titulo": f"Equipe {base['equipe']} — Vínculo Ótimo ({_fmt(p)})",
                          "descricao": f"Pontuação {_fmt(p)} no Componente Vínculo e Acompanhamento Territorial em {comp}."})
        elif st == "regular":
            itens.append({**base, "tipo": "plano_melhoria", "destaque": False,
                          "titulo": f"Equipe {base['equipe']} — Vínculo Regular ({_fmt(p)})",
                          "descricao": f"Pontuação {_fmt(p)} (abaixo de 5) no Componente Vínculo em {comp}: "
                                       "revisar cadastro e acompanhamento do território."})
    return itens


def itens_quadrimestre(atual: dict, anterior: dict | None) -> list[dict]:
    """Avaliação do Quadrimestre oficial → destaques e alertas por indicador (contagens publicadas)."""
    q = atual["rotulo"]
    fonte = f"SIAPS — Avaliação do Quadrimestre, {q}"
    antes = {}
    if anterior:
        antes = {(i["tipo_equipe"], i["co_indicador"]): i
                 for i in anterior["indicadores_qualidade"] + anterior["dimensoes_cvat"]}
    itens = []
    for i in atual["indicadores_qualidade"] + atual["dimensoes_cvat"]:
        nome = i.get("indicador") or i.get("dimensao")
        tipo = "vinculo" if i.get("dimensao") else "qualidade"
        base = {"ubs": "TODAS", "equipe": i["tipo_equipe"], "fonte": fonte,
                "periodo": atual["quadrimestre"]}
        a = antes.get((i["tipo_equipe"], i["co_indicador"]))
        if i["regular"]:
            ant = f" (antes: {a['regular']})" if a else ""
            itens.append({**base, "tipo": "alerta_critico", "destaque": False,
                          "titulo": f"{nome} — {i['regular']} equipe(s) {i['tipo_equipe']} em Regular",
                          "descricao": f"{i['regular']} de {i['total']} equipes em Regular no {q}{ant}."})
        elif i["total"] and i["otimo"] == i["total"]:
            itens.append({**base, "tipo": tipo, "destaque": True,
                          "titulo": f"{nome} — todas as {i['total']} equipes {i['tipo_equipe']} Ótimo",
                          "descricao": f"Todas as equipes avaliadas com conceito Ótimo no {q}."})
        elif a and (i["otimo"] > a["otimo"] or i["regular"] < a["regular"]):
            itens.append({**base, "tipo": tipo, "destaque": True,
                          "titulo": f"{nome} — melhora em relação a {anterior['rotulo']}",
                          "descricao": f"Ótimo {a['otimo']}→{i['otimo']}, Regular {a['regular']}→{i['regular']} "
                                       f"({i['tipo_equipe']}, {i['total']} equipes)."})
    return itens


async def montar(db: AsyncSession, municipio_id: int, ibge: str, municipio: str | None) -> dict:
    from routers.siaps_relatorios import relatorios_do_municipio

    itens, fontes = [], []
    cvat = await relatorios_do_municipio(db, municipio_id, "cvat")
    if cvat:
        rel = cvat[0]                                   # mais recente (ordenado por competência desc)
        v = itens_vinculo(rel)
        itens += v
        fontes.append(f"Relatório SIAPS importado — CVAT {_comp_rotulo(rel.competencia)}")
    painel = await sp.painel(db, municipio_id, ibge)
    quads = painel["quadrimestres"]
    if quads:
        itens += itens_quadrimestre(quads[0], quads[1] if len(quads) > 1 else None)
        fontes.append(f"SIAPS — Avaliação do Quadrimestre, {quads[0]['rotulo']}")

    ordem = {"vinculo": 0, "qualidade": 1, "alerta_critico": 2, "plano_melhoria": 3}
    itens.sort(key=lambda b: (not b["destaque"], ordem.get(b["tipo"], 9)))
    return {
        "situacao_dado": "oficial" if itens else "nao_disponivel",
        "municipio": municipio,
        "competencia": " · ".join(fontes) or None,
        "fontes": fontes,
        "total": len(itens),
        "destaques": sum(1 for b in itens if b["destaque"]),
        "alertas": sum(1 for b in itens if b["tipo"] in ("alerta_critico", "plano_melhoria")),
        "boas_praticas": itens,
        "fonte": "siaps_oficial",
    }
