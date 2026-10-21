"""
Painel geral da APS (aba "Painel Geral" do eGestor): junta o que os módulos já captaram de fonte oficial,
sem misturar periodicidades —
  • monitoramento MENSAL por equipe (área logada, captura assistida) — competência mais recente;
  • avaliação QUADRIMESTRAL (área pública por contagem; área logada por equipe) — classificação de cofinanciamento;
e informa, para cada bloco: competência/quadrimestre, data de atualização no ERSUS360, situação e a defasagem
em relação ao mês corrente. Nenhum número é calculado além de contagens do que foi publicado.
"""
from __future__ import annotations

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from services import siaps_captura as sc
from services import siaps_publico as sp
from services import siaps_quadrimestral as sq
from services.siaps_catalogo import catalogo

_MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro",
          "novembro", "dezembro"]


def _rot_comp(c: str | None) -> str | None:
    if not c:
        return None
    a, m = c.split("-")
    return f"{_MESES[int(m) - 1]}/{a}"


def defasagem_meses(competencia: str | None, hoje: date | None = None) -> int | None:
    """Meses entre a competência mais recente disponível e o mês corrente (em andamento)."""
    if not competencia:
        return None
    hoje = hoje or date.today()
    a, m = (int(x) for x in competencia.split("-"))
    return (hoje.year - a) * 12 + (hoje.month - m)


async def montar(db: AsyncSession, municipio_id: int, ibge: str, municipio: str | None,
                 modalidade: str | None = None, hoje: date | None = None) -> dict:
    hoje = hoje or date.today()
    pub = await sp.painel(db, municipio_id, ibge)
    mensal = await sc.por_indicador(db, ibge)
    quad = await sq.por_equipe(db, municipio_id)
    conf = await sq.conferencia(db, municipio_id)
    hv = await sq.homologadas_e_validas(db, municipio_id)

    from services.siaps_equipes import equipes_do_municipio, por_tipo
    equipes = await equipes_do_municipio(db, municipio_id)
    por_mod = {k: v for k, v in por_tipo(equipes).items() if v} if equipes else {}

    inds = mensal.get("indicadores", [])
    if modalidade:
        inds = [i for i in inds if i["sg_equipe"] == modalidade]
    com_regular = [{"codigo": i["codigo"], "nome": (i["catalogo"] or {}).get("nome") or i["nome_publicado"],
                    "sg_equipe": i["sg_equipe"], "regular": i["contagem"].get("regular", 0),
                    "equipes": [e["equipe"] for e in i["equipes"] if e["classificacao"] == "regular"]}
                   for i in inds if i["contagem"].get("regular")]
    sem_regular = [{"codigo": i["codigo"], "nome": (i["catalogo"] or {}).get("nome") or i["nome_publicado"],
                    "sg_equipe": i["sg_equipe"], "otimo": i["contagem"].get("otimo", 0), "total": len(i["equipes"])}
                   for i in inds if not i["contagem"].get("regular")]

    # indicadores oficiais das modalidades que o município tem, sem resultado captado
    mods_municipio = set(por_mod) | {i["sg_equipe"] for i in mensal.get("indicadores", [])}
    tem = {(i["sg_equipe"], i["codigo"]) for i in mensal.get("indicadores", [])}
    indisponiveis = [{"codigo": c["codigo"], "nome": c["nome"], "modalidades": c["modalidades"]}
                     for c in catalogo()
                     if any(m.strip() in mods_municipio for m in c["modalidades"].split(","))
                     and not any((m.strip(), c["codigo"]) in tem for m in c["modalidades"].split(","))
                     and (not modalidade or modalidade in c["modalidades"])]

    comp = mensal.get("competencia")
    quads_pub = pub.get("quadrimestres", [])
    return {
        "municipio": municipio, "ibge": ibge, "mes_corrente": f"{_MESES[hoje.month - 1]}/{hoje.year} (em andamento)",
        "equidade": pub.get("equidade"),
        "equipes_por_modalidade": por_mod, "homologadas_validas": hv,
        "monitoramento_mensal": {
            "competencia": comp, "competencia_rotulo": _rot_comp(comp), "defasagem_meses": defasagem_meses(comp, hoje),
            "situacao": "preliminar (monitoramento)" if comp else None, "atualizado_em": mensal.get("ultima_captura"),
            "fonte": "SIAPS área logada — Visão por Competência (captura assistida)",
            "indicadores_com_regular": com_regular, "indicadores_sem_regular": sem_regular,
        },
        "avaliacao_quadrimestral": {
            "publicado": quads_pub[0]["quadrimestre"] if quads_pub else None,
            "publicado_rotulo": quads_pub[0]["rotulo"] if quads_pub else None,
            "componentes_publicados": quads_pub[0]["componentes"] if quads_pub else [],
            "atualizado_em": (pub.get("ultima_sincronizacao") or {}).get("quando"),
            "por_equipe_mais_recente": quad.get("quadrimestre"), "por_equipe_situacao": quad.get("situacao"),
            "historico": [{"quadrimestre": q["quadrimestre"], "componentes": q["componentes"]} for q in reversed(quads_pub)],
        },
        "indisponiveis": indisponiveis,
        "conferencia": conf["resumo"],
        "divergencias": [i for i in conf["itens"] if i["situacao"] == "diverge"] + conf["integridade"],
        "regra": ("Mensal = monitoramento (preliminar); quadrimestral = avaliação para cofinanciamento "
                  "(NT nº 8/2026 e nº 12/2026). Os dois não são misturados."),
    }
