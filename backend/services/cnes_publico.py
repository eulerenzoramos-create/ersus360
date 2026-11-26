"""
Coletor da API pública do CNES (a mesma que o portal cnes.datasus.gov.br usa) — sem login.

Serviços conferidos em 26/11/2026 com a UBS Anizio Ferreira da Silva (Apuí/AM, CNES 2013312):
  /services/competencias                                   → competências publicadas (a 1ª é a atual)
  /services/estabelecimentos?municipio={ibge6}             → estabelecimentos do município
  /services/estabelecimentos-equipes/{ibge6+cnes}          → equipes (INE, tipo, área, ativação/desativação)
  /services/estabelecimentos-equipes/profissionais/{id}?coMun=&coArea=&coEquipe={seqEquipe}
                                                           → profissionais da equipe: CBO, CH amb/hosp/outros,
                                                             equipe mínima, entrada/desligamento
  /services/estabelecimentos-profissionais/{id}            → todos os profissionais do estabelecimento com vínculo

Limites conhecidos (sem inventar dado):
  • a API devolve o CNES ATUAL — não há consulta confirmada de competência passada; o histórico é formado pelos
    retratos guardados a cada coleta (models.cnes_retrato);
  • vínculos em OUTROS municípios não aparecem aqui (só lotações nos estabelecimentos deste município);
  • o servidor do CNES recusa clientes sem cabeçalho de navegador — por isso User-Agent/Referer abaixo.

LGPD: o CNS vira chave pseudônima (HMAC-SHA256 com a SECRET_KEY); CPF e demais dados pessoais da ficha
não são lidos.
"""
from __future__ import annotations

import asyncio
import hashlib
import hmac
import logging
from datetime import datetime, timedelta
from typing import Any, Awaitable, Callable

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.cnes_retrato import CnesRetrato

logger = logging.getLogger(__name__)

CNES_BASE = "https://cnes.datasus.gov.br"
FONTE = "CNES — API pública do portal cnes.datasus.gov.br (sem login)"
_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/130.0 Safari/537.36",
    "Accept": "application/json",
    "Referer": f"{CNES_BASE}/pages/estabelecimentos/consulta.jsp",
}
CONCORRENCIA = 4
REVALIDAR_APOS = timedelta(days=7)   # o CNES muda ao longo do mês: recoleta semanal da competência atual

Buscar = Callable[[str], Awaitable[Any]]


class CnesIndisponivel(RuntimeError):
    """A API do CNES não respondeu nem à lista de estabelecimentos — nada é gravado."""


def _ibge6(ibge: str) -> str:
    return str(ibge).strip()[:6]


def chave_pessoa(cns: str | None) -> str | None:
    """Pseudônimo estável do profissional (não reversível sem a SECRET_KEY)."""
    cns = (cns or "").strip()
    if not cns:
        return None
    return hmac.new(settings.SECRET_KEY.encode(), cns.encode(), hashlib.sha256).hexdigest()[:20]


def _int(v) -> int:
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def _sigla(ds: str | None, tp: str | None) -> str:
    """Sigla publicada pelo próprio CNES no início da descrição (ex.: 'ESF - EQUIPE DE SAUDE DA FAMILIA')."""
    ds = (ds or "").strip()
    if " - " in ds:
        return ds.split(" - ", 1)[0].strip()
    return ds or (tp or "")


def _data_iso(d: str | None) -> str | None:
    """dd/mm/aaaa → aaaa-mm-dd (como o CNES publica)."""
    if not d:
        return None
    try:
        return datetime.strptime(d.strip()[:10], "%d/%m/%Y").date().isoformat()
    except ValueError:
        return d


async def _cliente_http() -> tuple[Buscar, httpx.AsyncClient]:
    cli = httpx.AsyncClient(base_url=CNES_BASE, headers=_HEADERS, timeout=30, follow_redirects=True)

    async def buscar(caminho: str):
        ultimo: Exception | None = None
        for tentativa in range(3):
            try:
                r = await cli.get(caminho)
                if r.status_code == 200:
                    return r.json()
                if r.status_code == 404:
                    return None
                ultimo = RuntimeError(f"HTTP {r.status_code}")
            except (httpx.HTTPError, ValueError) as e:
                ultimo = e
            await asyncio.sleep(1.5 * (tentativa + 1))
        raise RuntimeError(f"{caminho}: {ultimo}")

    return buscar, cli


def _norm_prof_equipe(p: dict) -> dict:
    amb, hosp, outros = _int(p.get("chAmb")), _int(p.get("chHosp")), _int(p.get("chOutros"))
    deslig = _data_iso(p.get("dtDesligamento"))
    return {
        "chave": chave_pessoa(p.get("cns")),
        "nome": (p.get("noProfissional") or p.get("nome") or "").strip(),
        "cbo": (p.get("cbo") or "").strip(), "ds_cbo": (p.get("dsCbo") or "").strip(),
        "ch_amb": amb, "ch_hosp": hosp, "ch_outros": outros, "ch_total": amb + hosp + outros,
        "equipe_minima": p.get("stEquipeMinima") == "1",
        "dt_entrada": _data_iso(p.get("dtEntrada")), "dt_desligamento": deslig,
        "ativo": not deslig,
    }


def _norm_lotacao(p: dict, est: dict) -> dict:
    amb, hosp, outros = _int(p.get("chAmb")), _int(p.get("chHosp")), _int(p.get("chOutros"))
    return {
        "cnes": est["cnes"], "estabelecimento": est["nome"],
        "cbo": (p.get("cbo") or "").strip(), "ds_cbo": (p.get("dsCbo") or "").strip(),
        "ch_amb": amb, "ch_hosp": hosp, "ch_outros": outros, "ch_total": amb + hosp + outros,
        "sus": p.get("tpSusNaoSus") == "S",
        "vinculacao": p.get("vinculacao"), "vinculo": p.get("vinculo"), "sub_vinculo": p.get("subVinculo"),
    }


async def coletar(ibge: str, buscar: Buscar | None = None) -> dict:
    """Retrato completo do CNES do município (estabelecimentos, equipes com profissionais e lotações por pessoa)."""
    cli = None
    if buscar is None:
        buscar, cli = await _cliente_http()
    try:
        return await _coletar(_ibge6(ibge), buscar)
    finally:
        if cli is not None:
            await cli.aclose()


async def _coletar(ib6: str, buscar: Buscar) -> dict:
    erros: list[str] = []
    try:
        comps = await buscar("/services/competencias") or []
        competencia = str(comps[0]["nuComp"]) if comps else None
    except Exception as e:  # noqa: BLE001
        competencia = None
        erros.append(f"competências: {e}")

    try:
        lista = await buscar(f"/services/estabelecimentos?municipio={ib6}")
    except Exception as e:  # noqa: BLE001
        raise CnesIndisponivel(f"API do CNES indisponível (estabelecimentos do município {ib6}): {e}") from e
    if not isinstance(lista, list):
        raise CnesIndisponivel(f"API do CNES não devolveu a lista de estabelecimentos do município {ib6}")

    estabs = [{"id": str(e.get("id") or f"{ib6}{e.get('cnes')}"), "cnes": str(e.get("cnes") or "").zfill(7),
               "nome": (e.get("noFantasia") or "").strip(), "gestao": e.get("gestao"),
               "atende_sus": e.get("atendeSus") == "S"} for e in lista]
    sem = asyncio.Semaphore(CONCORRENCIA)

    async def chamar(caminho: str, rotulo: str):
        async with sem:
            try:
                return await buscar(caminho)
            except Exception as e:  # noqa: BLE001
                erros.append(f"{rotulo}: {e}")
                return None

    # 1) equipes e lotações de cada estabelecimento
    eq_por_est = await asyncio.gather(*[chamar(f"/services/estabelecimentos-equipes/{e['id']}",
                                               f"equipes {e['cnes']}") for e in estabs])
    prof_por_est = await asyncio.gather(*[chamar(f"/services/estabelecimentos-profissionais/{e['id']}",
                                                 f"profissionais {e['cnes']}") for e in estabs])

    equipes: dict[str, dict] = {}
    pedidos: list[tuple[str, dict, dict]] = []
    for est, eqs in zip(estabs, eq_por_est):
        est["n_equipes"] = len(eqs or [])
        for eq in eqs or []:
            ine = str(eq.get("coEquipe") or "").strip()
            if not ine:
                continue
            reg = equipes.setdefault(ine, {
                "ine": ine, "seq": str(eq.get("seqEquipe") or ""), "nome": (eq.get("nomeEquipe") or "").strip(),
                "tp_equipe": str(eq.get("tpEquipe") or ""), "descricao": (eq.get("dsEquipe") or "").strip(),
                "sigla": _sigla(eq.get("dsEquipe"), eq.get("tpEquipe")),
                "area": eq.get("coArea"), "ds_area": eq.get("dsArea"),
                "dt_ativacao": _data_iso(eq.get("dtAtivacao")), "dt_desativacao": _data_iso(eq.get("dtDesativacao")),
                "ativa": not eq.get("dtDesativacao"),
                "marcadores": {k: eq.get(k) == "1" for k in
                               ("ribeirinha", "quilombola", "indigena", "assentada", "escola", "pronasci")},
                "estabelecimentos": [], "profissionais": [],
            })
            reg["estabelecimentos"].append({"cnes": est["cnes"], "nome": est["nome"]})
            pedidos.append((ine, est, eq))

    # 2) profissionais de cada equipe (por estabelecimento — a eMulti pode apoiar várias UBS)
    respostas = await asyncio.gather(*[
        chamar(f"/services/estabelecimentos-equipes/profissionais/{est['id']}?coMun={ib6}"
               f"&coArea={eq.get('coArea') or ''}&coEquipe={eq.get('seqEquipe') or ''}",
               f"profissionais da equipe {ine}") for ine, est, eq in pedidos])
    for (ine, est, _eq), profs in zip(pedidos, respostas):
        for p in profs or []:
            equipes[ine]["profissionais"].append({**_norm_prof_equipe(p), "cnes": est["cnes"]})

    # 2b) vínculos oficiais entre equipes (serviço "nasf-esf" da ficha do estabelecimento no portal CNES):
    #     eMulti → equipes apoiadas; eSB → eSF/eAP/eSFR de referência. Para eSF/eSFR o serviço vem vazio — o vínculo
    #     inverso (quais eSB/eMulti apoiam a equipe) é montado a partir destas mesmas listas oficiais.
    emultis = [(ine, est, eq) for ine, est, eq in pedidos if str(eq.get("tpEquipe")) != "70"]
    vinc = await asyncio.gather(*[
        chamar(f"/services/estabelecimentos-equipes/nasf-esf/{est['id']}?coMun={ib6}"
               f"&coArea={eq.get('coArea') or ''}&coEquipe={eq.get('seqEquipe') or ''}",
               f"vínculos da equipe {ine}") for ine, est, eq in emultis])
    for (ine, _est, _eq), lista in zip(emultis, vinc):
        if lista is None:
            continue
        atuais = equipes[ine].setdefault("equipes_vinculadas", [])
        for v in lista:
            iv = str(v.get("ineEsf") or "").strip()
            if iv and iv not in {x["ine"] for x in atuais}:
                atuais.append({"ine": iv, "nome": (v.get("noReferenciaEsf") or "").strip(),
                               "tipo_cnes": str(v.get("tpEquipeEsf") or ""), "cnes": str(v.get("coCnesEsf") or "")})

    # 3) lotações por pessoa (todos os estabelecimentos do município) → vínculos simultâneos / CH total
    pessoas: dict[str, dict] = {}
    for est, profs in zip(estabs, prof_por_est):
        est["n_profissionais"] = len(profs or [])
        for p in profs or []:
            ch = chave_pessoa(p.get("cns"))
            if not ch:
                continue
            pes = pessoas.setdefault(ch, {"nome": (p.get("nome") or "").strip(), "lotacoes": []})
            pes["lotacoes"].append(_norm_lotacao(p, est))
    for pes in pessoas.values():
        pes["ch_total"] = sum(l["ch_total"] for l in pes["lotacoes"])
        pes["n_estabelecimentos"] = len({l["cnes"] for l in pes["lotacoes"]})

    nomes = {i: (e["nome"], e["sigla"]) for i, e in equipes.items()}
    for ine, e in equipes.items():
        for v in e.get("equipes_vinculadas") or []:
            v["sigla"] = nomes.get(v["ine"], (None, None))[1]
            alvo = equipes.get(v["ine"])
            if alvo is not None:
                alvo.setdefault("vinculos_recebidos", []).append(
                    {"ine": ine, "nome": e["nome"], "sigla": e["sigla"],
                     "cnes": (e["estabelecimentos"] or [{}])[0].get("cnes", "")})

    for eq in equipes.values():
        ativos = [p for p in eq["profissionais"] if p["ativo"]]
        eq["n_profissionais"] = len(ativos)
        eq["ch_total"] = sum(p["ch_total"] for p in ativos)

    lista_eq = sorted(equipes.values(), key=lambda e: (e["sigla"], e["nome"]))
    return {
        "municipio_ibge6": ib6, "competencia": competencia,
        "coletado_em": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "estabelecimentos": estabs, "equipes": lista_eq, "pessoas": pessoas, "erros": erros,
    }


def totais(r: dict) -> dict:
    ativas = [e for e in r["equipes"] if e["ativa"]]
    por_tipo: dict[str, int] = {}
    for e in ativas:
        por_tipo[e["sigla"]] = por_tipo.get(e["sigla"], 0) + 1
    return {
        "estabelecimentos": len(r["estabelecimentos"]),
        "equipes": len(r["equipes"]), "equipes_ativas": len(ativas), "equipes_por_tipo": por_tipo,
        "profissionais_em_equipes": len({p["chave"] for e in ativas for p in e["profissionais"]
                                         if p["ativo"] and p["chave"]}),
        "profissionais_municipio": len(r["pessoas"]),
        "erros": len(r["erros"]),
    }


def comparar(atual: dict, anterior: dict | None) -> dict | None:
    """Alterações cadastrais entre dois retratos (equipes e lotações nas equipes)."""
    if not anterior:
        return None
    a_eq = {e["ine"]: e for e in atual["equipes"]}
    b_eq = {e["ine"]: e for e in anterior.get("equipes", [])}

    def membros(e):
        return {(p["chave"], p["cbo"]): p for p in e.get("profissionais", []) if p.get("ativo") and p.get("chave")}

    mudancas = []
    for ine, e in a_eq.items():
        ant = b_eq.get(ine)
        if not ant:
            mudancas.append({"tipo": "equipe_nova", "ine": ine, "equipe": e["nome"]})
            continue
        if ant.get("ativa") and not e["ativa"]:
            mudancas.append({"tipo": "equipe_desativada", "ine": ine, "equipe": e["nome"],
                             "data": e["dt_desativacao"]})
        ma, mb = membros(e), membros(ant)
        for k in ma.keys() - mb.keys():
            mudancas.append({"tipo": "profissional_entrou", "ine": ine, "equipe": e["nome"],
                             "profissional": ma[k]["nome"], "cbo": ma[k]["cbo"]})
        for k in mb.keys() - ma.keys():
            mudancas.append({"tipo": "profissional_saiu", "ine": ine, "equipe": e["nome"],
                             "profissional": mb[k]["nome"], "cbo": mb[k]["cbo"]})
        for k in ma.keys() & mb.keys():
            if ma[k]["ch_total"] != mb[k]["ch_total"]:
                mudancas.append({"tipo": "carga_horaria_alterada", "ine": ine, "equipe": e["nome"],
                                 "profissional": ma[k]["nome"], "cbo": ma[k]["cbo"],
                                 "de": mb[k]["ch_total"], "para": ma[k]["ch_total"]})
    for ine in b_eq.keys() - a_eq.keys():
        mudancas.append({"tipo": "equipe_removida", "ine": ine, "equipe": b_eq[ine].get("nome")})
    return {"competencia_anterior": anterior.get("competencia"), "total": len(mudancas), "itens": mudancas}


async def ultimo(db: AsyncSession, municipio_id: int) -> CnesRetrato | None:
    return (await db.execute(select(CnesRetrato).where(CnesRetrato.municipio_id == municipio_id)
                             .order_by(CnesRetrato.competencia.desc(), CnesRetrato.id.desc()).limit(1))
            ).scalar_one_or_none()


async def de_competencia(db: AsyncSession, municipio_id: int, competencia: str) -> CnesRetrato | None:
    return (await db.execute(select(CnesRetrato).where(CnesRetrato.municipio_id == municipio_id,
                                                       CnesRetrato.competencia == competencia))
            ).scalar_one_or_none()


async def historico(db: AsyncSession, municipio_id: int) -> list[CnesRetrato]:
    return list((await db.execute(select(CnesRetrato).where(CnesRetrato.municipio_id == municipio_id)
                                  .order_by(CnesRetrato.competencia.desc()))).scalars())


async def salvar(db: AsyncSession, municipio_id: int, ibge: str, r: dict, usuario: str | None) -> CnesRetrato:
    """Grava o retrato da competência (substitui o da mesma competência; preserva os anteriores)."""
    competencia = r["competencia"] or datetime.utcnow().strftime("%Y%m")
    anterior = (await db.execute(select(CnesRetrato).where(CnesRetrato.municipio_id == municipio_id,
                                                           CnesRetrato.competencia < competencia)
                                 .order_by(CnesRetrato.competencia.desc()).limit(1))).scalar_one_or_none()
    mesmo = await de_competencia(db, municipio_id, competencia)
    base_cmp = mesmo.dados if mesmo else (anterior.dados if anterior else None)
    dados = {k: r[k] for k in ("competencia", "coletado_em", "estabelecimentos", "equipes", "pessoas")}
    campos = dict(municipio_ibge=ibge, situacao="parcial" if r["erros"] else "completo", totais=totais(r),
                  dados=dados, alteracoes=comparar(r, base_cmp), erros=r["erros"] or None, fonte=FONTE,
                  coletado_por=usuario, coletado_em=datetime.utcnow())
    if mesmo:
        for k, v in campos.items():
            setattr(mesmo, k, v)
        reg = mesmo
    else:
        reg = CnesRetrato(municipio_id=municipio_id, competencia=competencia, **campos)
        db.add(reg)
    await db.commit()
    return reg


async def sincronizar(db: AsyncSession, municipio_id: int, ibge: str, usuario: str | None = None,
                      forcar: bool = False, buscar: Buscar | None = None) -> dict:
    """Coleta e grava. Sem `forcar`, só coleta se não houver retrato recente (≤ 7 dias) da competência atual."""
    if not forcar:
        reg = await ultimo(db, municipio_id)
        if reg and datetime.utcnow() - reg.coletado_em < REVALIDAR_APOS:
            return {"coletado": False, "motivo": "retrato recente", "competencia": reg.competencia}
    r = await coletar(ibge, buscar)
    reg = await salvar(db, municipio_id, ibge, r, usuario)
    return {"coletado": True, "competencia": reg.competencia, "situacao": reg.situacao, "totais": reg.totais,
            "alteracoes": (reg.alteracoes or {}).get("total")}
