"""
Sincronização automática dos resultados oficiais públicos do SIAPS (sem login, qualquer município).

Endpoints usados pelo próprio portal siaps.saude.gov.br/publico (conferidos em 17/10/2026):
  GET  apisiaps.saude.gov.br/api/public/filtros/competencias
       → [{"nuCompetencia": "2026Q1", "quadrimestre": true}, …]  (quadrimestres publicados)
  POST apisiaps.saude.gov.br/api/public/componente/indicador-quadrimestre/filtro
       {"coMunicipioIbge": ["130014"], "nuQuadrimestre": ["2026Q1"]}
       → classificacaoFinalComponente (CVAT e Qualidade por tipo de equipe),
         conceitoPorIndicadorQualidade, classificacaoFinalPorDimensaoCvat, graficos
  GET  apisiaps.saude.gov.br/api/public/filtros/indice-ied?coMunicipioIbge=130014
       → {"dsFaixaIndiceEquidade": "ESTRATO 2", "dsPortePopulacional": …, "competenciaQuadrimestre": "202608"}

O que a área pública NÃO traz: pontuação por equipe, numerador/denominador e resultados mensais.
Esses ficam na área logada (gov.br) e continuam entrando pela importação do relatório do SIAPS.

Conferido para Apuí em 17/10/2026: 2026Q1 — CVAT eSF 1 Ótimo, 5 Bom, 1 Suficiente, 2 Regular (9 equipes).
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime

import httpx
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.indicadores_aps import SincronizacaoLog
from models.siaps_publico import SiapsPublicoColeta

logger = logging.getLogger(__name__)

BASE = "https://apisiaps.saude.gov.br/api/public"
TIMEOUT = 30
FONTE_LOG = "SIAPS_PUBLICO"
FONTE_ROTULO = "SIAPS — Relatórios Públicos (apisiaps.saude.gov.br)"
COMPONENTES = {"CVAT": "Vínculo e Acompanhamento Territorial", "QUALIDADE": "Qualidade"}
_PERIODOS = {"1": "jan–abr", "2": "mai–ago", "3": "set–dez"}


class SiapsIndisponivel(RuntimeError):
    pass


def rotulo_quadrimestre(chave: str) -> str:
    """'2026Q1' → '1º quadrimestre/2026 (jan–abr)'."""
    ano, _, q = chave.partition("Q")
    return f"{q}º quadrimestre/{ano} ({_PERIODOS.get(q, '?')})" if ano.isdigit() and q in _PERIODOS else chave


def _hash(payload: dict) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()


# ── Coleta ────────────────────────────────────────────────────────────────────

async def buscar_quadrimestres(client: httpx.AsyncClient) -> list[str]:
    r = await client.get(f"{BASE}/filtros/competencias")
    r.raise_for_status()
    return sorted({c["nuCompetencia"] for c in r.json() if c.get("quadrimestre")}, reverse=True)


async def buscar_resultado_quadrimestre(client: httpx.AsyncClient, ibge6: str, quad: str) -> dict:
    r = await client.post(f"{BASE}/componente/indicador-quadrimestre/filtro",
                          json={"coMunicipioIbge": [ibge6], "nuQuadrimestre": [quad]})
    r.raise_for_status()
    dados = r.json()
    dados.pop("graficos", None)   # só repete os mesmos números em formato de gráfico
    return dados


async def buscar_equidade(client: httpx.AsyncClient, ibge6: str) -> dict:
    r = await client.get(f"{BASE}/filtros/indice-ied", params={"coMunicipioIbge": ibge6})
    r.raise_for_status()
    return r.json() or {}


async def _guardar(db: AsyncSession, municipio_id: int, recurso: str, chave: str, payload: dict) -> str:
    """Grava nova versão só se o conteúdo mudou. Retorna 'novo' | 'revisado' | 'sem_mudanca'."""
    h = _hash(payload)
    atual = (await db.execute(
        select(SiapsPublicoColeta)
        .where(SiapsPublicoColeta.municipio_id == municipio_id, SiapsPublicoColeta.recurso == recurso,
               SiapsPublicoColeta.chave == chave)
        .order_by(desc(SiapsPublicoColeta.versao)).limit(1))).scalar_one_or_none()
    agora = datetime.utcnow()
    if atual and atual.hash == h:
        atual.verificado_em = agora
        return "sem_mudanca"
    db.add(SiapsPublicoColeta(municipio_id=municipio_id, recurso=recurso, chave=chave,
                              versao=(atual.versao + 1) if atual else 1, hash=h, payload=payload,
                              coletado_em=agora, verificado_em=agora))
    return "revisado" if atual else "novo"


async def sincronizar(db: AsyncSession, municipio_id: int, ibge: str) -> dict:
    """Busca todos os quadrimestres publicados e o IED do município. Resposta vazia do SIAPS
    não apaga nem substitui nada (instabilidade da fonte não pode zerar o histórico)."""
    ibge6 = ibge[:6]
    inicio = datetime.utcnow()
    log = SincronizacaoLog(municipio_ibge=ibge, fonte=FONTE_LOG, metodo="api_publica", iniciado_em=inicio)
    resumo: dict[str, list[str]] = {"novo": [], "revisado": [], "sem_mudanca": [], "sem_dados": []}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            quads = await buscar_quadrimestres(client)
            if not quads:
                raise SiapsIndisponivel("SIAPS não informou nenhum quadrimestre publicado")
            for q in quads:
                dados = await buscar_resultado_quadrimestre(client, ibge6, q)
                if not dados.get("classificacaoFinalComponente"):
                    resumo["sem_dados"].append(q)
                    continue
                resumo[await _guardar(db, municipio_id, "quadrimestre", q, dados)].append(q)
            ied = await buscar_equidade(client, ibge6)
            if ied.get("dsFaixaIndiceEquidade"):
                chave = str(ied.get("competenciaQuadrimestre") or "atual")[:10]
                resumo[await _guardar(db, municipio_id, "equidade", chave, ied)].append(f"IED {chave}")
    except (httpx.HTTPError, ValueError, KeyError, SiapsIndisponivel) as e:
        await db.rollback()
        log.sucesso, log.erros, log.observacao = False, 1, f"Fonte indisponível: {e}"[:1000]
        log.concluido_em = datetime.utcnow()
        log.duracao_s = (log.concluido_em - inicio).total_seconds()
        db.add(log)
        await db.commit()
        raise SiapsIndisponivel(f"API pública do SIAPS indisponível: {e}") from e

    log.sucesso = True
    log.registros_lidos = sum(len(v) for v in resumo.values())
    log.registros_inseridos = len(resumo["novo"])
    log.registros_atualizados = len(resumo["revisado"])
    log.payload_resumo = resumo
    log.concluido_em = datetime.utcnow()
    log.duracao_s = (log.concluido_em - inicio).total_seconds()
    db.add(log)
    await db.commit()
    return {"ok": True, **resumo}


# ── Leitura para as telas e para a IA ────────────────────────────────────────

async def _versoes_atuais(db: AsyncSession, municipio_id: int, recurso: str) -> list[SiapsPublicoColeta]:
    linhas = (await db.execute(
        select(SiapsPublicoColeta)
        .where(SiapsPublicoColeta.municipio_id == municipio_id, SiapsPublicoColeta.recurso == recurso)
        .order_by(desc(SiapsPublicoColeta.chave), desc(SiapsPublicoColeta.versao)))).scalars().all()
    vistas, atuais = set(), []
    for c in linhas:
        if c.chave not in vistas:
            vistas.add(c.chave)
            atuais.append(c)
    return atuais


def _contagens(item: dict) -> dict:
    ot, bom = item.get("qtdClassificacaoOtimo", 0) or 0, item.get("qtdClassificacaoBom", 0) or 0
    suf, reg = item.get("qtdClassificacaoSuficiente", 0) or 0, item.get("qtdClassificacaoRegular", 0) or 0
    return {"otimo": ot, "bom": bom, "suficiente": suf, "regular": reg, "total": ot + bom + suf + reg}


def normalizar_quadrimestre(c: SiapsPublicoColeta) -> dict:
    p = c.payload or {}
    return {
        "quadrimestre": c.chave,
        "rotulo": rotulo_quadrimestre(c.chave),
        "versao": c.versao,
        "revisado_pelo_ms": c.versao > 1,
        "coletado_em": c.coletado_em.isoformat() if c.coletado_em else None,
        "verificado_em": c.verificado_em.isoformat() if c.verificado_em else None,
        "componentes": [
            {"componente": COMPONENTES.get(i.get("tipoOrigem"), i.get("tipoOrigem")), "origem": i.get("tipoOrigem"),
             "tipo_equipe": i.get("sgEquipe"), **_contagens(i),
             "total_equipes_validas": i.get("totalEquipesValidasParaComponente")}
            for i in p.get("classificacaoFinalComponente", [])],
        "indicadores_qualidade": [
            {"tipo_equipe": i.get("sgEquipe"), "co_indicador": i.get("coTipoIndicador"),
             "indicador": i.get("noIndicador"), **_contagens(i)}
            for i in p.get("conceitoPorIndicadorQualidade", [])],
        "dimensoes_cvat": [
            {"tipo_equipe": i.get("sgEquipe"), "co_indicador": i.get("coTipoIndicador"),
             "dimensao": i.get("noDimensao"), **_contagens(i)}
            for i in p.get("classificacaoFinalPorDimensaoCvat", [])],
    }


def alertas(quads: list[dict]) -> list[dict]:
    """Alertas do quadrimestre mais recente: equipes em Regular e piora em relação ao anterior.
    Só compara contagens publicadas — nenhuma nota é recalculada."""
    if not quads:
        return []
    atual, anterior = quads[0], (quads[1] if len(quads) > 1 else None)
    q = atual["rotulo"]
    saida = []
    for c in atual["componentes"]:
        if c["regular"]:
            saida.append({"severidade": "alta", "quadrimestre": atual["quadrimestre"],
                          "texto": f"{c['componente']} ({c['tipo_equipe']}): {c['regular']} de {c['total']} equipe(s) "
                                   f"com classificação Regular no {q}."})
    for i in atual["indicadores_qualidade"] + atual["dimensoes_cvat"]:
        if i["regular"]:
            nome = i.get("indicador") or i.get("dimensao")
            saida.append({"severidade": "media", "quadrimestre": atual["quadrimestre"],
                          "texto": f"{nome} ({i['tipo_equipe']}): {i['regular']} equipe(s) em Regular no {q}."})
    if anterior:
        ant = {(c["origem"], c["tipo_equipe"]): c for c in anterior["componentes"]}
        for c in atual["componentes"]:
            a = ant.get((c["origem"], c["tipo_equipe"]))
            if a and (c["regular"] > a["regular"] or c["otimo"] < a["otimo"]):
                saida.append({"severidade": "media", "quadrimestre": atual["quadrimestre"],
                              "texto": f"{c['componente']} ({c['tipo_equipe']}) piorou em relação ao {anterior['rotulo']}: "
                                       f"Ótimo {a['otimo']}→{c['otimo']}, Regular {a['regular']}→{c['regular']}."})
    return saida


async def ultima_sincronizacao(db: AsyncSession, ibge: str) -> dict | None:
    log = (await db.execute(select(SincronizacaoLog)
                            .where(SincronizacaoLog.municipio_ibge == ibge, SincronizacaoLog.fonte == FONTE_LOG)
                            .order_by(desc(SincronizacaoLog.id)).limit(1))).scalar_one_or_none()
    if not log:
        return None
    return {"quando": (log.concluido_em or log.iniciado_em).isoformat(), "sucesso": bool(log.sucesso),
            "erro": None if log.sucesso else log.observacao, "resumo": log.payload_resumo}


async def painel(db: AsyncSession, municipio_id: int, ibge: str) -> dict:
    quads = [normalizar_quadrimestre(c) for c in await _versoes_atuais(db, municipio_id, "quadrimestre")]
    eq = await _versoes_atuais(db, municipio_id, "equidade")
    equidade = None
    if eq:
        p = eq[0].payload or {}
        equidade = {"faixa_ied": p.get("dsFaixaIndiceEquidade"), "porte_populacional": p.get("dsPortePopulacional"),
                    "competencia_referencia": p.get("competenciaQuadrimestre"),
                    "coletado_em": eq[0].coletado_em.isoformat() if eq[0].coletado_em else None}
    return {
        "situacao_dado": "oficial_publicado" if quads else "nao_disponivel",
        "fonte": FONTE_ROTULO,
        "nota": ("Avaliação do Quadrimestre publicada pelo Ministério da Saúde na área pública do SIAPS. "
                 "A área pública não traz a pontuação de cada equipe nem numerador/denominador — "
                 "esses dados vêm do relatório do SIAPS (área logada gov.br) importado no ERSUS360."),
        "quadrimestres": quads,
        "equidade": equidade,
        "alertas": alertas(quads),
        "ultima_sincronizacao": await ultima_sincronizacao(db, ibge),
    }
