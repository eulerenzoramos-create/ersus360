"""
Leitura e análise da série da FVS-RCP/AM gravada pelos coletores (services/fvs_coleta.py).

Toda saída diz a origem de cada número:
  "oficial"            → publicado pela FVS (contagem da base pública, resultado/alcance do PQA-VS, aviso AESOP)
  "calculado_ersus360" → conta feita aqui sobre números oficiais (incidência por 100 mil, variação %,
                         comparação de períodos); a fórmula vai junto.
Alertas calculados ≠ alertas oficiais: os primeiros são sinais estatísticos para investigação, nunca
declaração de surto.
"""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.vigilancia_fvs import FvsFonteEstado, FvsMunicipio, FvsSerie
from services import fvs_catalogo as cat
from services.fvs_coleta import IBGE_AM, semana_epidemiologica

# Critérios dos alertas calculados (ajustáveis por parâmetro da rota de alertas)
CRITERIOS = {
    "aumento_pct": 50.0,          # acumulado do ano × mesmo período do ano anterior
    "minimo_casos": 5,            # abaixo disso, variação percentual não gera alerta
    "janela_semanas": 4,          # últimas N semanas × N semanas anteriores
    "aumento_recente_pct": 100.0,
    "dias_sem_atualizacao": 7,    # fonte sem sincronização bem-sucedida há mais tempo que isso
}

ROTULO_FONTE = {
    "pqa_vs": "FVS-AM — Indicadores do PQA-VS (Tableau Public)",
    "sinan": "FVS-AM — Monitoramento de doenças e agravos de notificação/SINAN (Tableau Public)",
    "malaria": "FVS-AM — Painel Malária/SIVEP-Malária (Tableau Public)",
    "aesop": "FVS-AM/CIEVS — Painel AESOP (Tableau Public)",
    "vacinometro": "FVS-AM — Vacinômetro COVID-19 (Tableau Public)",
}


def _br(v: float | None, casas: int = 1) -> str:
    return "—" if v is None else f"{v:,.{casas}f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _pct(atual: float | None, anterior: float | None) -> float | None:
    if atual is None or not anterior:
        return None
    return round((atual - anterior) / anterior * 100, 1)


async def _estado(db: AsyncSession, fonte: str) -> dict:
    e = await db.get(FvsFonteEstado, fonte)
    painel = cat.painel_do_coletor(fonte) or {}
    base = {"fonte": fonte, "rotulo": ROTULO_FONTE.get(fonte, fonte), "painel_url": painel.get("embed"),
            "pagina_oficial": cat.FONTE_PAGINA}
    if not e:
        return {**base, "situacao": "nunca_sincronizada", "ultima_sincronizacao": None,
                "publicado_na_fonte": None, "data_referencia": None}
    return {**base, "situacao": e.situacao, "ultima_sincronizacao": e.ultima_sucesso,
            "ultima_tentativa": e.ultima_tentativa, "publicado_na_fonte": e.publicado_na_fonte,
            "data_referencia": e.data_referencia, "registros": e.registros,
            "erro": e.mensagem if e.situacao in {"erro", "bloqueado_lgpd"} else None}


async def extra_da_fonte(db: AsyncSession, fonte: str) -> dict:
    e = await db.get(FvsFonteEstado, fonte)
    if e and e.situacao == "ok" and e.mensagem and e.mensagem.startswith("{"):
        try:
            return json.loads(e.mensagem)
        except ValueError:
            return {}
    return {}


# ── Municípios ────────────────────────────────────────────────────────────────

async def municipios(db: AsyncSession) -> list[dict]:
    rows = (await db.execute(select(FvsMunicipio).order_by(FvsMunicipio.nome))).scalars().all()
    return [{"ibge6": m.ibge6, "ibge7": m.ibge7, "nome": m.nome, "regiao_saude": m.regiao_saude} for m in rows]


async def nomes_municipios(db: AsyncSession) -> dict[str, str]:
    d = {m["ibge6"]: m["nome"] for m in await municipios(db)}
    d[IBGE_AM] = "Amazonas"
    return d


async def populacao(db: AsyncSession, ibges: list[str], ano: int) -> dict[str, tuple[int, float]]:
    """População que a FVS usa no PQA-VS: a do próprio ano ou a mais recente anterior. → {ibge6: (ano, pop)}"""
    out: dict[str, tuple[int, float]] = {}
    rows = (await db.execute(select(FvsSerie.ibge6, FvsSerie.ano, FvsSerie.valor).where(
        FvsSerie.fonte == "pqa_vs", FvsSerie.indicador == "populacao", FvsSerie.ibge6.in_(ibges),
        FvsSerie.ano <= ano).order_by(FvsSerie.ano))).all()
    for m, a, v in rows:
        out[m] = (a, v)
    return out


# ── Série genérica ────────────────────────────────────────────────────────────

async def serie(db: AsyncSession, fonte: str, indicador: str | None = None, ibges: list[str] | None = None,
                ano_inicio: int | None = None, ano_fim: int | None = None, periodo_tipo: str | None = None,
                recorte: str = "total", limite: int = 20000) -> list[dict]:
    q = select(FvsSerie).where(FvsSerie.fonte == fonte, FvsSerie.recorte == recorte)
    if indicador:
        q = q.where(FvsSerie.indicador == indicador)
    if ibges:
        q = q.where(FvsSerie.ibge6.in_(ibges))
    if ano_inicio:
        q = q.where(FvsSerie.ano >= ano_inicio)
    if ano_fim:
        q = q.where(FvsSerie.ano <= ano_fim)
    if periodo_tipo:
        q = q.where(FvsSerie.periodo_tipo == periodo_tipo)
    q = q.order_by(FvsSerie.indicador, FvsSerie.ibge6, FvsSerie.ano, FvsSerie.periodo).limit(limite)
    return [{"indicador": r.indicador, "ibge6": r.ibge6, "ano": r.ano, "periodo_tipo": r.periodo_tipo,
             "periodo": r.periodo, "recorte": r.recorte, "recorte_valor": r.recorte_valor, "valor": r.valor,
             "numerador": r.numerador, "denominador": r.denominador, "meta": r.meta, "alcance": r.alcance,
             "texto": r.texto} for r in (await db.execute(q)).scalars()]


async def indicadores_disponiveis(db: AsyncSession, fonte: str) -> list[str]:
    return list((await db.execute(select(FvsSerie.indicador).where(FvsSerie.fonte == fonte).distinct()
                                  .order_by(FvsSerie.indicador))).scalars())


# ── Comparação de períodos (semanas epidemiológicas) ──────────────────────────

async def _semanas(db: AsyncSession, fonte: str, indicador: str, ibges: list[str], anos: list[int]) -> dict:
    """{(ibge6, ano): {se: casos}}"""
    out: dict[tuple, dict[int, float]] = defaultdict(dict)
    rows = (await db.execute(select(FvsSerie.ibge6, FvsSerie.ano, FvsSerie.periodo, FvsSerie.valor).where(
        FvsSerie.fonte == fonte, FvsSerie.indicador == indicador, FvsSerie.periodo_tipo == "se",
        FvsSerie.recorte == "total", FvsSerie.ibge6.in_(ibges), FvsSerie.ano.in_(anos)))).all()
    for m, a, se, v in rows:
        out[(m, a)][se] = v or 0
    return out


async def ultima_se(db: AsyncSession, fonte: str, ano: int) -> int | None:
    """Última semana COMPLETA com dado na base estadual (a semana da data de referência pode estar parcial)."""
    se = (await db.execute(select(func.max(FvsSerie.periodo)).where(
        FvsSerie.fonte == fonte, FvsSerie.periodo_tipo == "se", FvsSerie.ibge6 == IBGE_AM,
        FvsSerie.ano == ano))).scalar()
    if not se:
        return None
    hoje_ano, hoje_se = semana_epidemiologica(date.today())
    if (ano, se) >= (hoje_ano, hoje_se):
        se = hoje_se - 1
    return se if se and se > 0 else None


def _soma(semanas: dict[int, float], ate: int, desde: int = 1) -> float:
    return sum(v for s, v in semanas.items() if desde <= s <= ate)


async def comparar_periodo(db: AsyncSession, fonte: str, indicador: str, ibge6: str, ano: int) -> dict | None:
    se = await ultima_se(db, fonte, ano)
    if not se:
        return None
    sem = await _semanas(db, fonte, indicador, [ibge6], [ano, ano - 1])
    atual, ant = _soma(sem.get((ibge6, ano), {}), se), _soma(sem.get((ibge6, ano - 1), {}), se)
    j = CRITERIOS["janela_semanas"]
    rec = _soma(sem.get((ibge6, ano), {}), se, se - j + 1) if se > j else None
    prev = _soma(sem.get((ibge6, ano), {}), se - j, se - 2 * j + 1) if se > 2 * j else None
    return {"ate_se": se, "acumulado": atual, "mesmo_periodo_ano_anterior": ant,
            "variacao_pct": _pct(atual, ant), "ultimas_semanas": rec, "semanas_anteriores": prev,
            "variacao_recente_pct": _pct(rec, prev), "janela_semanas": j,
            "origem": "calculado_ersus360",
            "formula": f"soma das SE 1–{se} de {ano} ÷ soma das SE 1–{se} de {ano - 1} − 1"}


# ── Painel executivo ──────────────────────────────────────────────────────────

async def painel_executivo(db: AsyncSession, ibge6: str, ano: int | None = None) -> dict:
    ano = ano or date.today().year
    nomes = await nomes_municipios(db)
    fontes = {f: await _estado(db, f) for f in cat.COLETORES}
    pop = (await populacao(db, [ibge6], ano)).get(ibge6)

    # SINAN — casos por agravo no ano e comparação com o mesmo período do ano anterior
    agravos = []
    rows = (await db.execute(select(FvsSerie.indicador, FvsSerie.ano, FvsSerie.valor).where(
        FvsSerie.fonte == "sinan", FvsSerie.ibge6 == ibge6, FvsSerie.periodo_tipo == "ano",
        FvsSerie.recorte == "total", FvsSerie.ano.in_([ano, ano - 1])))).all()
    por = defaultdict(dict)
    for ind, a, v in rows:
        por[ind][a] = v
    for ind, anos in por.items():
        comp = await comparar_periodo(db, "sinan", ind, ibge6, ano) if anos.get(ano) else None
        casos = anos.get(ano)
        agravos.append({
            "agravo": ind.split(":", 1)[1], "indicador": ind, "casos_ano": casos, "casos_ano_anterior": anos.get(ano - 1),
            "incidencia_100mil": round(casos / pop[1] * 100000, 1) if casos and pop else None,
            "comparacao": comp})
    agravos.sort(key=lambda a: -(a["casos_ano"] or 0))
    total = sum(a["casos_ano"] or 0 for a in agravos) if agravos else None

    # Malária
    mal = await serie(db, "malaria", None, [ibge6], ano - 1, ano, "ano")
    mal_d = {(r["indicador"], r["ano"]): r for r in mal}
    malaria = None
    if mal:
        malaria = {"positivos_ano": (mal_d.get(("positivos", ano)) or {}).get("valor"),
                   "positivos_ano_anterior": (mal_d.get(("positivos", ano - 1)) or {}).get("valor"),
                   "ipa_ano_anterior": mal_d.get(("ipa", ano - 1)),
                   "ipa_ano": mal_d.get(("ipa", ano)),
                   "comparacao": await comparar_periodo(db, "malaria", "positivos", ibge6, ano)}

    # AESOP — última semana
    aesop = await _aesop_ultima(db, ibge6)
    srag = (await db.execute(select(func.sum(FvsSerie.valor)).where(
        FvsSerie.fonte == "aesop", FvsSerie.indicador == "srag_casos", FvsSerie.ibge6 == ibge6,
        FvsSerie.ano == ano))).scalar()

    pqa = await pqa_resumo(db, ibge6)
    vac = (await db.execute(select(func.sum(FvsSerie.valor)).where(
        FvsSerie.fonte == "vacinometro", FvsSerie.ibge6 == ibge6, FvsSerie.periodo_tipo == "ano",
        FvsSerie.recorte == "total"))).scalar()

    return {
        "municipio": {"ibge6": ibge6, "nome": nomes.get(ibge6)}, "ano": ano,
        "populacao_referencia": {"ano": pop[0], "valor": pop[1],
                                 "fonte": "FVS-AM — população do painel PQA-VS"} if pop else None,
        "fontes": fontes,
        "cartoes": {
            "notificacoes_sinan": {"valor": total, "origem": "oficial", "fonte": "sinan",
                                   "nota": "Soma dos registros de todas as doenças/agravos da base de monitoramento "
                                           "SINAN publicada pela FVS (o painel conta registros: 'Casos = COUNT')."},
            "malaria_positivos": {"valor": (malaria or {}).get("positivos_ano"), "origem": "oficial", "fonte": "malaria",
                                  "nota": "Exames positivos sem LVC, por município provável de infecção (regra do painel da FVS)."},
            "srag_casos": {"valor": srag, "origem": "oficial", "fonte": "aesop", "nota": "Casos de SRAG no SIVEP-Gripe (painel AESOP)."},
            "pqa_vs": {"valor": pqa.get("atingidos") if pqa else None, "total": pqa.get("avaliados") if pqa else None,
                       "periodo": pqa.get("periodo_rotulo") if pqa else None, "origem": "oficial", "fonte": "pqa_vs"},
            "vacinas_covid_doses": {"valor": vac, "origem": "oficial", "fonte": "vacinometro",
                                    "nota": "Total de doses COVID-19 aplicadas em estabelecimentos do município (Vacinômetro FVS)."},
        },
        "agravos": agravos,
        "malaria": malaria,
        "aesop": aesop,
        "pqa_vs": pqa,
        "indisponivel": [
            {"item": "Casos confirmados, descartados e em investigação",
             "motivo": "A base pública de monitoramento da FVS traz só a contagem de notificações, sem a "
                       "classificação final. Fonte possível: SINAN municipal (acesso do próprio município)."},
            {"item": "Óbitos e taxas de mortalidade",
             "motivo": "A FVS publica mortalidade em painéis Power BI (sem exportação de dados) e em pasta "
                       "Tableau com dado pessoal (bloqueada pelo ERSUS360). Veja os painéis oficiais em SIM/SINASC."},
        ],
    }


async def _aesop_ultima(db: AsyncSession, ibge6: str) -> dict | None:
    ult = (await db.execute(select(FvsSerie.ano, FvsSerie.periodo).where(
        FvsSerie.fonte == "aesop", FvsSerie.indicador == "aviso_aesop", FvsSerie.ibge6 == ibge6)
        .order_by(FvsSerie.ano.desc(), FvsSerie.periodo.desc()).limit(1))).first()
    if not ult:
        return None
    rows = (await db.execute(select(FvsSerie).where(
        FvsSerie.fonte == "aesop", FvsSerie.ibge6 == ibge6, FvsSerie.ano == ult[0], FvsSerie.periodo == ult[1],
        FvsSerie.periodo_tipo == "se", FvsSerie.recorte == "total"))).scalars().all()
    d = {r.indicador: (r.texto if r.texto is not None else r.valor) for r in rows}
    return {"ano": ult[0], "se": ult[1], **d, "origem": "oficial"}


# ── PQA-VS ────────────────────────────────────────────────────────────────────

def _rotulo_periodo(ano: int, tipo: str, per: int) -> str:
    return f"{per}º quadrimestre/{ano}" if tipo == "quadrimestre" else str(ano)


async def pqa_resumo(db: AsyncSession, ibge6: str) -> dict | None:
    ult = (await db.execute(select(FvsSerie.ano, FvsSerie.periodo_tipo, FvsSerie.periodo).where(
        FvsSerie.fonte == "pqa_vs", FvsSerie.ibge6 == ibge6, FvsSerie.indicador.like("IND_%"))
        .order_by(FvsSerie.ano.desc(), FvsSerie.periodo.desc()).limit(1))).first()
    if not ult:
        return None
    nomes = (await extra_da_fonte(db, "pqa_vs")).get("indicadores_ate_2023", {}) if ult[0] <= 2023 else {}
    rows = (await db.execute(select(FvsSerie).where(
        FvsSerie.fonte == "pqa_vs", FvsSerie.ibge6 == ibge6, FvsSerie.ano == ult[0],
        FvsSerie.periodo_tipo == ult[1], FvsSerie.periodo == ult[2], FvsSerie.indicador.like("IND_%"))
        .order_by(FvsSerie.indicador))).scalars().all()
    itens = [{"indicador": r.indicador, "nome": nomes.get(r.indicador), "numerador": r.numerador,
              "denominador": r.denominador, "resultado": r.valor, "meta": r.meta, "alcance": r.alcance,
              "observacao": r.texto,
              "subaba": next((s for s, inds in cat.PQA_POR_SUBABA.items() if r.indicador[4:] in inds), None)}
             for r in rows]
    # "Ausência de casos": a FVS marca o indicador como não aplicável no período (legenda "(-)" do painel)
    avaliados = [i for i in itens if i["alcance"] in {"SIM", "NÃO"} and i["observacao"] != "Ausência de casos"]
    return {"ano": ult[0], "periodo_tipo": ult[1], "periodo": ult[2],
            "periodo_rotulo": _rotulo_periodo(*ult), "itens": itens,
            "avaliados": len(avaliados), "atingidos": sum(1 for i in avaliados if i["alcance"] == "SIM"),
            "abaixo_da_meta": [i for i in avaliados if i["alcance"] == "NÃO"], "origem": "oficial"}


async def pqa_historico(db: AsyncSession, ibge6: str, indicador: str | None = None) -> list[dict]:
    q = select(FvsSerie).where(FvsSerie.fonte == "pqa_vs", FvsSerie.ibge6 == ibge6, FvsSerie.indicador.like("IND_%"))
    if indicador:
        q = q.where(FvsSerie.indicador == indicador)
    rows = (await db.execute(q.order_by(FvsSerie.indicador, FvsSerie.ano, FvsSerie.periodo))).scalars().all()
    nomes = (await extra_da_fonte(db, "pqa_vs")).get("indicadores_ate_2023", {})
    return [{"indicador": r.indicador, "nome": nomes.get(r.indicador) if r.ano <= 2023 else None,
             "periodo": _rotulo_periodo(r.ano, r.periodo_tipo, r.periodo), "ano": r.ano,
             "periodo_tipo": r.periodo_tipo, "quadrimestre": r.periodo or None, "resultado": r.valor,
             "numerador": r.numerador, "denominador": r.denominador, "meta": r.meta, "alcance": r.alcance,
             "observacao": r.texto} for r in rows]


# ── Alertas ───────────────────────────────────────────────────────────────────

async def alertas(db: AsyncSession, ibge6: str, ano: int | None = None, criterios: dict | None = None) -> dict:
    c = {**CRITERIOS, **(criterios or {})}
    ano = ano or date.today().year
    lista: list[dict] = []

    # Oficiais — AESOP/CIEVS
    a = await _aesop_ultima(db, ibge6)
    if a:
        for campo, nome in (("aviso_aesop", "Aviso AESOP"), ("aviso_aps", "Aviso APS"), ("aviso_pip", "Aviso PIP")):
            if str(a.get(campo) or "").strip().lower() == "sim":
                lista.append({"tipo": "oficial", "nivel": "alto", "fonte": "aesop", "titulo": f"{nome} ativo",
                              "detalhe": f"SE {a['se']}/{a['ano']} — publicado pelo CIEVS/FVS no painel AESOP "
                                         "(alerta precoce de síndromes respiratórias).",
                              "subaba": "monitor"})

    # Oficiais — PQA-VS abaixo da meta (resultado e alcance publicados pela FVS)
    p = await pqa_resumo(db, ibge6)
    for i in (p or {}).get("abaixo_da_meta", []):
        lista.append({"tipo": "oficial", "nivel": "medio", "fonte": "pqa_vs",
                      "titulo": f"PQA-VS {i['indicador'].replace('IND_', 'indicador ')} abaixo da meta",
                      "detalhe": f"{p['periodo_rotulo']}: resultado {_br(i['resultado'])}"
                                 f" (meta {i['meta'] or '—'}). {i['nome'] or ''}".strip(),
                      "subaba": i["subaba"] or "painel"})

    # Calculados — aumento de notificações por agravo
    rows = (await db.execute(select(FvsSerie.indicador).where(
        FvsSerie.fonte == "sinan", FvsSerie.ibge6 == ibge6, FvsSerie.ano == ano, FvsSerie.periodo_tipo == "se")
        .distinct())).scalars().all()
    for ind in rows:
        comp = await comparar_periodo(db, "sinan", ind, ibge6, ano)
        if comp:
            lista += _alertas_comparacao(comp, ind.split(":", 1)[1], "sinan", c, _subaba_do_agravo(ind))
    comp = await comparar_periodo(db, "malaria", "positivos", ibge6, ano)
    if comp:
        lista += _alertas_comparacao(comp, "Malária (positivos SIVEP)", "malaria", c, "malaria")
    ipa = {r["ano"]: r for r in await serie(db, "malaria", "ipa", [ibge6], ano - 2, ano - 1, "ano")}
    if ipa.get(ano - 1) and ipa.get(ano - 2) and (ipa[ano - 1]["valor"] or 0) > (ipa[ano - 2]["valor"] or 0) \
            and ipa[ano - 1]["texto"] != ipa[ano - 2]["texto"]:
        lista.append({"tipo": "calculado", "nivel": "medio", "fonte": "malaria",
                      "titulo": "Mudança de classe de risco da malária (IPA)",
                      "detalhe": f"IPA {ano - 2}: {_br(ipa[ano - 2]['valor'], 2)} ({ipa[ano - 2]['texto']}) → "
                                 f"{ano - 1}: {_br(ipa[ano - 1]['valor'], 2)} ({ipa[ano - 1]['texto']}).",
                      "formula": "IPA = positivos ÷ população da planilha da FVS × 1.000", "subaba": "malaria"})

    # Atualização das fontes
    limite = datetime.utcnow() - timedelta(days=c["dias_sem_atualizacao"])
    for f in cat.COLETORES:
        e = await _estado(db, f)
        if e["situacao"] in {"erro", "bloqueado_lgpd"}:
            lista.append({"tipo": "integracao", "nivel": "medio", "fonte": f, "titulo": f"Falha na atualização: {e['rotulo']}",
                          "detalhe": (e.get("erro") or "")[:300], "subaba": "painel"})
        elif not e["ultima_sincronizacao"] or e["ultima_sincronizacao"] < limite:
            lista.append({"tipo": "integracao", "nivel": "baixo", "fonte": f, "titulo": f"Fonte sem atualização recente: {e['rotulo']}",
                          "detalhe": "Nunca sincronizada." if not e["ultima_sincronizacao"]
                          else f"Última sincronização em {e['ultima_sincronizacao']:%d/%m/%Y %H:%M} (UTC).",
                          "subaba": "painel"})
    ordem = {"alto": 0, "medio": 1, "baixo": 2}
    lista.sort(key=lambda x: (ordem.get(x["nivel"], 3), x["tipo"] != "oficial"))
    return {"municipio": ibge6, "ano": ano, "criterios": c, "alertas": lista,
            "legenda": {"oficial": "Publicado pela FVS/CIEVS (aviso AESOP, alcance de meta do PQA-VS).",
                        "calculado": "Sinal estatístico calculado pelo ERSUS360 sobre números oficiais — indica "
                                     "necessidade de análise/investigação, não confirma surto.",
                        "integracao": "Situação da coleta automática dos dados."}}


def _subaba_do_agravo(ind: str) -> str:
    agravo = ind.split(":", 1)[1]
    for rota, lista in cat.AGRAVOS_POR_SUBABA.items():
        if lista and agravo in lista:
            return rota
    return "epidemiologia"


def _alertas_comparacao(comp: dict, nome: str, fonte: str, c: dict, subaba: str) -> list[dict]:
    out = []
    v, atual = comp["variacao_pct"], comp["acumulado"]
    if v is not None and v >= c["aumento_pct"] and atual >= c["minimo_casos"]:
        out.append({"tipo": "calculado", "nivel": "alto" if v >= 2 * c["aumento_pct"] else "medio", "fonte": fonte,
                    "titulo": f"Aumento de notificações: {nome}",
                    "detalhe": f"{int(atual)} casos até a SE {comp['ate_se']} contra {int(comp['mesmo_periodo_ano_anterior'])} "
                               f"no mesmo período do ano anterior (+{_br(v)}%).",
                    "formula": comp["formula"], "subaba": subaba})
    elif comp["mesmo_periodo_ano_anterior"] == 0 and atual >= c["minimo_casos"]:
        out.append({"tipo": "calculado", "nivel": "medio", "fonte": fonte, "titulo": f"Casos sem registro no ano anterior: {nome}",
                    "detalhe": f"{int(atual)} casos até a SE {comp['ate_se']}; nenhum no mesmo período do ano anterior.",
                    "formula": comp["formula"], "subaba": subaba})
    vr = comp["variacao_recente_pct"]
    if vr is not None and vr >= c["aumento_recente_pct"] and (comp["ultimas_semanas"] or 0) >= c["minimo_casos"]:
        j = comp["janela_semanas"]
        out.append({"tipo": "calculado", "nivel": "medio", "fonte": fonte, "titulo": f"Crescimento recente: {nome}",
                    "detalhe": f"{int(comp['ultimas_semanas'])} casos nas últimas {j} semanas (até a SE {comp['ate_se']}) "
                               f"contra {int(comp['semanas_anteriores'])} nas {j} anteriores (+{_br(vr)}%).",
                    "formula": f"soma das {j} últimas SE ÷ soma das {j} SE anteriores − 1", "subaba": subaba})
    return out


# ── Mapa e comparativo ────────────────────────────────────────────────────────

async def mapa(db: AsyncSession, fonte: str, indicador: str, ano: int, periodo_tipo: str = "ano",
               periodo: int = 0) -> dict:
    nomes = await nomes_municipios(db)
    rows = (await db.execute(select(FvsSerie.ibge6, FvsSerie.valor, FvsSerie.texto).where(
        FvsSerie.fonte == fonte, FvsSerie.indicador == indicador, FvsSerie.ano == ano,
        FvsSerie.periodo_tipo == periodo_tipo, FvsSerie.periodo == periodo, FvsSerie.recorte == "total",
        FvsSerie.ibge6 != IBGE_AM))).all()
    vals = {m: (v, t) for m, v, t in rows}
    taxa = fonte in {"sinan"} and indicador.startswith("casos:")
    pops = await populacao(db, list(nomes), ano) if taxa else {}
    anterior = {}
    if periodo_tipo == "ano":
        anterior = {m: v for m, v in (await db.execute(select(FvsSerie.ibge6, FvsSerie.valor).where(
            FvsSerie.fonte == fonte, FvsSerie.indicador == indicador, FvsSerie.ano == ano - 1,
            FvsSerie.periodo_tipo == "ano", FvsSerie.periodo == 0, FvsSerie.recorte == "total"))).all()}
    itens = []
    for m, nome in nomes.items():
        if m == IBGE_AM:
            continue
        v, t = vals.get(m, (None, None))
        pop = pops.get(m)
        itens.append({"ibge6": m, "nome": nome, "valor": v, "texto": t,
                      "taxa_100mil": round(v / pop[1] * 100000, 1) if taxa and v is not None and pop else None,
                      "ano_anterior": anterior.get(m), "variacao_pct": _pct(v, anterior.get(m))})
    return {"fonte": fonte, "indicador": indicador, "ano": ano, "periodo_tipo": periodo_tipo, "periodo": periodo,
            "municipios": itens, "sem_dado": [i["nome"] for i in itens if i["valor"] is None and i["texto"] is None],
            "taxa": {"descricao": "casos ÷ população PQA-VS (FVS) × 100.000", "origem": "calculado_ersus360"} if taxa else None}


async def comparativo(db: AsyncSession, ibges: list[str], ano: int) -> dict:
    nomes = await nomes_municipios(db)
    pops = await populacao(db, ibges, ano)
    rows = (await db.execute(select(FvsSerie.fonte, FvsSerie.indicador, FvsSerie.ibge6, FvsSerie.valor, FvsSerie.texto)
                             .where(FvsSerie.ibge6.in_(ibges), FvsSerie.ano == ano, FvsSerie.periodo_tipo == "ano",
                                    FvsSerie.recorte == "total",
                                    FvsSerie.fonte.in_(["sinan", "malaria"])))).all()
    tabela: dict[str, dict] = defaultdict(dict)
    for f, ind, m, v, t in rows:
        chave = f"{f}|{ind}"
        tabela[chave][m] = {"valor": v, "texto": t,
                            "taxa_100mil": round(v / pops[m][1] * 100000, 1)
                            if f == "sinan" and v is not None and pops.get(m) else None}
    linhas = [{"fonte": k.split("|")[0], "indicador": k.split("|")[1], "valores": v} for k, v in sorted(tabela.items())]
    pqa = {m: await pqa_resumo(db, m) for m in ibges}
    return {"ano": ano, "municipios": [{"ibge6": m, "nome": nomes.get(m), "populacao": pops.get(m)} for m in ibges],
            "linhas": linhas,
            "pqa_vs": {m: ({"periodo": p["periodo_rotulo"], "atingidos": p["atingidos"], "avaliados": p["avaliados"]}
                           if p else None) for m, p in pqa.items()}}


async def tendencias(db: AsyncSession, fonte: str, indicador: str, ano: int, limite: int = 15) -> list[dict]:
    """Municípios com maior aumento no acumulado do ano × mesmo período do ano anterior."""
    se = await ultima_se(db, fonte, ano)
    if not se:
        return []
    nomes = await nomes_municipios(db)
    sem = await _semanas(db, fonte, indicador, list(nomes), [ano, ano - 1])
    out = []
    for m, nome in nomes.items():
        if m == IBGE_AM:
            continue
        atual, ant = _soma(sem.get((m, ano), {}), se), _soma(sem.get((m, ano - 1), {}), se)
        if atual or ant:
            out.append({"ibge6": m, "nome": nome, "acumulado": atual, "mesmo_periodo_ano_anterior": ant,
                        "variacao_pct": _pct(atual, ant), "diferenca": atual - ant, "ate_se": se})
    out.sort(key=lambda x: -x["diferenca"])
    return out[:limite]
