"""
Captura assistida dos resultados oficiais por equipe da ÁREA LOGADA do SIAPS.

A leitura acontece no navegador do gestor já logado no gov.br (tarefa mensal do Claude no app):
a própria tela do SIAPS consulta `apisiaps.saude.gov.br/componente/qualidade/visao-competencia`
e só o RESULTADO (equipe, indicador, pontuação, NM, DN e a classificação oficial do Ministério)
é colado na importação do ERSUS360. Nenhuma senha ou token sai do navegador.

Formato aceito ("ersus360-siaps-captura-v1"):
  {"formato": "ersus360-siaps-captura-v1", "municipio_ibge": "130014", "capturado_em": ISO,
   "colunas": [competencia, cnes, ubs, ine, equipe, sg_equipe, indicador, score, numerador,
               denominador, classificacao],
   "linhas": [["202607", "3320138", "UBS IRMA ELIZABETE", "0000007072", "CACHOEIRA", "eSF",
               "Mais Acesso à Atenção Primária à Saúde", 46.14, 299, 648, "BOM"], ...]}

Grava em resultado_mensal_siaps (fonte FONTE_CAPTURA). A classificação gravada é a do SIAPS —
o ERSUS360 não recalcula. O motor de indicadores não sobrescreve estas linhas.
"""
from __future__ import annotations

import re
import unicodedata
from datetime import datetime

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.indicadores_aps import ResultadoMensalSiaps, SincronizacaoLog
from services import siaps_quadrimestral as sq
from services.siaps_relatorio import INDICADORES_QUALIDADE, codigo_indicador

FORMATO = "ersus360-siaps-captura-v1"
FONTE_CAPTURA = "SIAPS — área logada (captura assistida)"
FONTE_LOG = "SIAPS_LOGADO"
COLUNAS = ["competencia", "cnes", "ubs", "ine", "equipe", "sg_equipe", "indicador", "score",
           "numerador", "denominador", "classificacao"]
CLASSES = {"OTIMO": "otimo", "BOM": "bom", "SUFICIENTE": "suficiente", "REGULAR": "regular"}
MAX_LINHAS = 5000

# nome oficial do indicador (varia entre telas) → código do catálogo, por tipo de equipe
_PALAVRAS = [
    ("mais acesso", "1"), ("desenvolvimento infantil", "2"), ("gesta", "3"), ("diabetes", "4"),
    ("hipertens", "5"), ("idosa", "6"), ("mulher", "7"),
]
_PALAVRAS_ESFR = {"1": "R1", "2": "R2", "3": "R3", "4": "R4", "5": "R5", "7": "R6"}
_PALAVRAS_ESB = [("consulta odontol", "B1"), ("restaurador", "B6"), ("exodontia", "B3"), ("escova", "B4"),
                 ("preventivo", "B5"), ("tratamento odontol", "B2")]
_PALAVRAS_EMULTI = [("media de atendimentos", "M1"), ("interprofission", "M2")]


class CapturaInvalida(ValueError):
    pass


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", s).strip()


def codigo_do_indicador(nome: str, sg_equipe: str) -> str | None:
    n, sg = _norm(nome), (sg_equipe or "").strip()
    if sg == "eSB":
        return next((c for p, c in _PALAVRAS_ESB if p in n), None)
    if sg == "eMulti":
        return next((c for p, c in _PALAVRAS_EMULTI if p in n), None)
    if sg in ("eSF", "eAP", "eSFR"):
        dig = next((d for p, d in _PALAVRAS if p in n), None)
        if dig:
            return _PALAVRAS_ESFR.get(dig) if sg == "eSFR" else f"C{dig}"
    return codigo_indicador(nome)


def _comp(c: str) -> str:
    if not re.fullmatch(r"20\d{2}(0[1-9]|1[0-2])", str(c)):
        raise CapturaInvalida(f"Competência inválida: {c!r}")
    return f"{c[:4]}-{c[4:]}"


def validar(pacote: dict, ibge: str) -> list[dict]:
    if not isinstance(pacote, dict) or pacote.get("formato") != FORMATO:
        raise CapturaInvalida("Formato não reconhecido: use a captura do SIAPS gerada pelo ERSUS360.")
    if str(pacote.get("municipio_ibge", ""))[:6] != ibge[:6]:
        raise CapturaInvalida("A captura é de outro município.")
    if pacote.get("colunas") != COLUNAS:
        raise CapturaInvalida("Colunas diferentes do formato esperado.")
    linhas = pacote.get("linhas")
    if not isinstance(linhas, list) or (not linhas and not pacote.get("quadrimestral")):
        raise CapturaInvalida("Captura sem linhas.")
    if len(linhas) > MAX_LINHAS:
        raise CapturaInvalida(f"Captura grande demais ({len(linhas)} linhas).")
    saida = []
    for l in linhas:
        if not isinstance(l, list) or len(l) != len(COLUNAS):
            raise CapturaInvalida("Linha fora do formato.")
        d = dict(zip(COLUNAS, l))
        classe = CLASSES.get(_norm(str(d["classificacao"])).upper())
        if not classe:
            raise CapturaInvalida(f"Classificação desconhecida: {d['classificacao']!r}")
        ine = re.sub(r"\D", "", str(d["ine"]))
        if not ine:
            raise CapturaInvalida("Linha sem INE da equipe.")
        for k in ("score", "numerador", "denominador"):
            if d[k] is not None and not isinstance(d[k], (int, float)):
                raise CapturaInvalida(f"Valor não numérico em {k}.")
        saida.append({**d, "competencia": _comp(d["competencia"]), "ine": ine.zfill(10), "classe": classe,
                      "codigo": codigo_do_indicador(str(d["indicador"]), str(d["sg_equipe"]))})
    return saida


async def importar(db: AsyncSession, ibge: str, pacote: dict, usuario: str | None,
                   municipio_id: int | None = None) -> dict:
    linhas = validar(pacote, ibge)
    try:
        quad = sq.validar(pacote.get("quadrimestral") or [])
    except sq.QuadrimestralInvalido as e:
        raise CapturaInvalida(str(e)) from e
    if quad and municipio_id is None:
        raise CapturaInvalida("Município não informado para a avaliação quadrimestral.")
    inicio = datetime.utcnow()
    comps = sorted({l["competencia"] for l in linhas})
    atuais = {(r.competencia, r.equipe_ine, r.indicador_codigo): r for r in (await db.execute(
        select(ResultadoMensalSiaps).where(ResultadoMensalSiaps.municipio_ibge == ibge,
                                           ResultadoMensalSiaps.competencia.in_(comps)))).scalars()}
    ins = atu = 0
    corrigidos: list[str] = []
    sem_codigo = sorted({f"{l['sg_equipe']}: {l['indicador']}" for l in linhas if not l["codigo"]})
    for l in linhas:
        if not l["codigo"]:
            continue
        chave = (l["competencia"], l["ine"], l["codigo"])
        reg = atuais.get(chave)
        if reg is None:
            reg = ResultadoMensalSiaps(municipio_ibge=ibge, competencia=l["competencia"], equipe_ine=l["ine"],
                                       indicador_codigo=l["codigo"])
            db.add(reg)
            atuais[chave] = reg
            ins += 1
        else:
            atu += 1
            antes = (reg.resultado_pct, reg.numerador, reg.denominador, reg.classificacao)
            if reg.fonte == FONTE_CAPTURA and antes != (l["score"], l["numerador"], l["denominador"], l["classe"]):
                # o MS republicou outro valor (ex.: correção B1/B4 da eSB diferenciada, SIAPS 2.1.2): guarda o anterior
                hist = list((reg.payload_original or {}).get("historico", []))
                hist.append({"resultado": antes[0], "numerador": antes[1], "denominador": antes[2],
                             "classificacao": antes[3], "substituido_em": inicio.isoformat()})
                reg.payload_original = {**(reg.payload_original or {}), "historico": hist}
                corrigidos.append(f"{l['competencia']} {l['equipe']} {l['codigo']}: {sq._fmt(antes[0])}→{sq._fmt(l['score'])} "
                                  f"({antes[3]}→{l['classe']})")
        reg.equipe_nome, reg.equipe_tipo, reg.cnes = str(l["equipe"])[:100], str(l["sg_equipe"])[:20], str(l["cnes"])[:10]
        reg.indicador_nome = str(l["indicador"])[:200] or INDICADORES_QUALIDADE.get(l["codigo"])
        reg.numerador, reg.denominador = l["numerador"], l["denominador"]
        reg.resultado_pct = reg.pontuacao = l["score"]
        reg.meta = None
        reg.classificacao = l["classe"]
        reg.situacao, reg.fonte = "preliminar", FONTE_CAPTURA
        reg.data_extracao = inicio
        reg.payload_original = {**{k: v for k, v in (reg.payload_original or {}).items() if k == "historico"},
                                "captura": {k: l[k] for k in COLUNAS}, "ubs": l["ubs"],
                                "capturado_em": pacote.get("capturado_em")}
    q_res = (await sq.gravar(db, municipio_id, quad, inicio)) if quad else {"novos": 0, "revisados": [], "sem_mudanca": 0}
    obs = [("Indicadores sem código: " + "; ".join(sem_codigo)) if sem_codigo else None,
           ("Valores mensais alterados pelo MS: " + "; ".join(corrigidos[:50])) if corrigidos else None,
           ("Avaliação quadrimestral revisada pelo MS: " + "; ".join(q_res["revisados"][:50])) if q_res["revisados"] else None]
    log = SincronizacaoLog(municipio_ibge=ibge, fonte=FONTE_LOG, metodo="captura_assistida", usuario=usuario,
                           competencia=comps[-1] if comps else None, iniciado_em=inicio, concluido_em=datetime.utcnow(),
                           sucesso=True, registros_lidos=len(linhas) + len(quad), registros_inseridos=ins + q_res["novos"],
                           registros_atualizados=atu, registros_rejeitados=len(linhas) - ins - atu,
                           payload_resumo={"competencias": comps, "capturado_em": pacote.get("capturado_em"),
                                           "sem_codigo": sem_codigo, "corrigidos_pelo_ms": corrigidos,
                                           "quadrimestral": q_res},
                           observacao=("; ".join(o for o in obs if o)[:4000]) or None)
    db.add(log)
    await db.commit()
    return {"ok": True, "competencias": comps, "inseridos": ins, "atualizados": atu,
            "equipes": len({l["ine"] for l in linhas}), "sem_codigo": sem_codigo,
            "corrigidos_pelo_ms": corrigidos, "quadrimestral": q_res}


async def situacao(db: AsyncSession, ibge: str) -> dict:
    log = (await db.execute(select(SincronizacaoLog)
                            .where(SincronizacaoLog.municipio_ibge == ibge, SincronizacaoLog.fonte == FONTE_LOG)
                            .order_by(desc(SincronizacaoLog.id)).limit(1))).scalar_one_or_none()
    comps = (await db.execute(select(ResultadoMensalSiaps.competencia, func.count())
                              .where(ResultadoMensalSiaps.municipio_ibge == ibge,
                                     ResultadoMensalSiaps.fonte == FONTE_CAPTURA)
                              .group_by(ResultadoMensalSiaps.competencia)
                              .order_by(ResultadoMensalSiaps.competencia))).all()
    return {"ultima_captura": (log.concluido_em or log.iniciado_em).isoformat() if log else None,
            "capturado_no_siaps_em": (log.payload_resumo or {}).get("capturado_em") if log else None,
            "competencias": [{"competencia": c, "linhas": n} for c, n in comps],
            "formato": FORMATO, "colunas": COLUNAS}


async def resultados_da_competencia(db: AsyncSession, ibge: str, competencia: str | None = None):
    """Linhas capturadas da competência pedida (ou da mais recente)."""
    if competencia is None:
        competencia = (await db.execute(select(func.max(ResultadoMensalSiaps.competencia))
                                        .where(ResultadoMensalSiaps.municipio_ibge == ibge,
                                               ResultadoMensalSiaps.fonte == FONTE_CAPTURA))).scalar_one_or_none()
    if not competencia:
        return None, []
    linhas = (await db.execute(select(ResultadoMensalSiaps)
                               .where(ResultadoMensalSiaps.municipio_ibge == ibge,
                                      ResultadoMensalSiaps.fonte == FONTE_CAPTURA,
                                      ResultadoMensalSiaps.competencia == competencia)
                               .order_by(ResultadoMensalSiaps.indicador_codigo, ResultadoMensalSiaps.equipe_nome))).scalars().all()
    return competencia, list(linhas)


async def tabela_por_equipe(db: AsyncSession, ibge: str, competencia: str | None = None) -> dict:
    """Tabela da tela eGestor: por tipo de equipe, cada equipe × indicador com o resultado e a
    classificação oficial capturados da área logada do SIAPS."""
    comps = [c for (c,) in (await db.execute(
        select(ResultadoMensalSiaps.competencia).where(ResultadoMensalSiaps.municipio_ibge == ibge,
                                                      ResultadoMensalSiaps.fonte == FONTE_CAPTURA)
        .distinct().order_by(desc(ResultadoMensalSiaps.competencia)))).all()]
    if not comps:
        return {"situacao_dado": "nao_disponivel", "competencias": [], "tipos": []}
    competencia = competencia if competencia in comps else comps[0]
    _, linhas = await resultados_da_competencia(db, ibge, competencia)
    tipos: dict[str, dict] = {}
    for r in linhas:
        t = tipos.setdefault(r.equipe_tipo, {"tipo_equipe": r.equipe_tipo, "indicadores": {}, "equipes": {}})
        t["indicadores"].setdefault(r.indicador_codigo, r.indicador_nome)
        e = t["equipes"].setdefault(r.equipe_ine, {"ine": r.equipe_ine, "equipe": r.equipe_nome,
                                                   "ubs": (r.payload_original or {}).get("ubs") or "", "valores": {}})
        e["valores"][r.indicador_codigo] = {"resultado": r.resultado_pct, "numerador": r.numerador,
                                            "denominador": r.denominador, "classificacao": r.classificacao}
    ordem = {"eSF": 0, "eAP": 1, "eSFR": 2, "eSB": 3, "eMulti": 4}
    saida = []
    for t in sorted(tipos.values(), key=lambda t: ordem.get(t["tipo_equipe"], 9)):
        saida.append({"tipo_equipe": t["tipo_equipe"],
                      "indicadores": [{"codigo": c, "nome": n} for c, n in sorted(t["indicadores"].items())],
                      "equipes": sorted(t["equipes"].values(), key=lambda e: e["equipe"] or "")})
    st = await situacao(db, ibge)
    return {"situacao_dado": "oficial", "fonte": FONTE_CAPTURA, "situacao": "preliminar",
            "competencia": competencia, "competencias": comps, "tipos": saida,
            "ultima_captura": st["ultima_captura"]}


async def por_indicador(db: AsyncSession, ibge: str, competencia: str | None = None) -> dict:
    """Visão consolidada da aba Componente Qualidade: um bloco por indicador (catálogo oficial + contagem por
    classificação) com o detalhe de cada equipe (INE, resultado, NM, DN, classificação oficial)."""
    from services.siaps_catalogo import do_codigo
    tab = await tabela_por_equipe(db, ibge, competencia)
    if tab["situacao_dado"] == "nao_disponivel":
        return {**tab, "indicadores": []}
    blocos = []
    for t in tab["tipos"]:
        for ind in t["indicadores"]:
            equipes = []
            for e in t["equipes"]:
                v = e["valores"].get(ind["codigo"])
                if v:
                    equipes.append({"ine": e["ine"], "equipe": e["equipe"], "ubs": e["ubs"], **v})
            ordem = {"regular": 0, "suficiente": 1, "bom": 2, "otimo": 3}
            equipes.sort(key=lambda x: (ordem.get(x["classificacao"], 9), x["equipe"] or ""))
            blocos.append({"codigo": ind["codigo"], "nome_publicado": ind["nome"], "sg_equipe": t["tipo_equipe"],
                           "catalogo": do_codigo(ind["codigo"]),
                           "contagem": {c: sum(1 for x in equipes if x["classificacao"] == c) for c in CLASSES.values()},
                           "equipes": equipes})
    return {**{k: v for k, v in tab.items() if k != "tipos"}, "indicadores": blocos}


async def serie_indicador(db: AsyncSession, ibge: str, codigo: str) -> dict:
    """Histórico mensal capturado de um indicador, por equipe (para o gráfico da visão por indicador)."""
    linhas = (await db.execute(select(ResultadoMensalSiaps)
                               .where(ResultadoMensalSiaps.municipio_ibge == ibge,
                                      ResultadoMensalSiaps.fonte == FONTE_CAPTURA,
                                      ResultadoMensalSiaps.indicador_codigo == codigo)
                               .order_by(ResultadoMensalSiaps.competencia))).scalars().all()
    comps = sorted({r.competencia for r in linhas})
    equipes: dict[str, dict] = {}
    for r in linhas:
        e = equipes.setdefault(r.equipe_ine, {"ine": r.equipe_ine, "equipe": r.equipe_nome, "valores": {}})
        e["valores"][r.competencia] = {"resultado": r.resultado_pct, "classificacao": r.classificacao,
                                       "corrigido_pelo_ms": bool((r.payload_original or {}).get("historico"))}
    return {"codigo": codigo, "competencias": comps,
            "equipes": sorted(equipes.values(), key=lambda e: e["equipe"] or "")}
