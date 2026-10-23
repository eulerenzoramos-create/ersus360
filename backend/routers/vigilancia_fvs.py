"""
Router: Vigilância em Saúde integrada à FVS-RCP/AM (dados públicos agregados dos 62 municípios do AM).

Dado público estadual: as consultas aceitam qualquer município do AM (parâmetro `mun`, código IBGE de
6 ou 7 dígitos) para comparação. `mun` de propósito NÃO é um dos nomes de parâmetro de tenant que o
guard (tenancy/guard.py) bloqueia: aqui só se leem as tabelas fvs_* (públicas, sem municipio_id),
nunca dado do município da sessão. A rota exige login como qualquer outra.

  GET  /api/vigilancia-fvs/catalogo                 inventário dos painéis da FVS × subabas
  GET  /api/vigilancia-fvs/municipios               62 municípios com Região de Saúde (FVS)
  GET  /api/vigilancia-fvs/painel?mun=&ano=         painel executivo
  GET  /api/vigilancia-fvs/subaba?id=&mun=&ano=   dados FVS para uma das 15 subabas
  GET  /api/vigilancia-fvs/serie?fonte=&indicador=… série histórica com filtros
  GET  /api/vigilancia-fvs/alertas?mun=             alertas oficiais × calculados
  GET  /api/vigilancia-fvs/mapa?fonte=&indicador=   valor por município (mapa)
  GET  /api/vigilancia-fvs/malha                    limites municipais do AM (IBGE, GeoJSON)
  GET  /api/vigilancia-fvs/comparativo?mun=a,b      comparação entre municípios
  GET  /api/vigilancia-fvs/tendencias?fonte=&indicador=
  GET  /api/vigilancia-fvs/pqa-vs?mun=              PQA-VS do município (último período e histórico)
  GET  /api/vigilancia-fvs/integracoes              área técnica: fontes, situação, histórico
  POST /api/vigilancia-fvs/sincronizar              atualização manual (perfis autorizados)
  POST /api/vigilancia-fvs/relatorio                gera relatório (pdf | xlsx | docx)
  POST /api/vigilancia-fvs/ia                       Agente IA — consulta em linguagem natural
"""
from __future__ import annotations

import asyncio
import logging
import re
from datetime import date
from typing import Literal, Optional

import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from database import AsyncSessionLocal, get_db
from routers.auth import ip_de
from services import fvs_analise as an
from services import fvs_catalogo as cat
from services import fvs_coleta as col
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/vigilancia-fvs", tags=["Vigilância em Saúde — FVS-RCP/AM"])

PERFIS_SINCRONIZAR = {"admin", "gestor", "superadmin"}
_malha_cache: dict = {}


def _mun(v: str | None, current) -> str:
    """Município pedido (6 dígitos) ou o da sessão. Só municípios do Amazonas."""
    s = re.sub(r"\D", "", v or "") or (current.municipio_ibge or "")
    s = s[:6]
    if len(s) != 6 or not s.startswith("13"):
        raise HTTPException(422, "Informe um município do Amazonas (código IBGE).")
    return s


def _ano(ano: int | None) -> int:
    a = ano or date.today().year
    if not 2000 <= a <= date.today().year:
        raise HTTPException(422, "Ano fora do intervalo.")
    return a


@router.get("/catalogo")
async def catalogo(current: SessaoMunicipal):
    return {"pagina_oficial": cat.FONTE_PAGINA, "fonte": cat.FONTE_NOME, "paineis": cat.PAINEIS,
            "subabas": cat.SUBABAS, "sem_fonte_fvs": cat.SEM_FONTE_FVS, "coletores": cat.COLETORES,
            "levantado_em": "2026-10-23"}


@router.get("/municipios")
async def municipios(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    lista = await an.municipios(db)
    return {"municipios": lista, "total": len(lista),
            "regioes": sorted({m["regiao_saude"] for m in lista if m["regiao_saude"]}),
            "fonte": "FVS-RCP/AM — planilha de municípios do painel PQA-VS"}


@router.get("/painel")
async def painel(current: SessaoMunicipal, mun: Optional[str] = None, ano: Optional[int] = None,
                 db: AsyncSession = Depends(get_db)):
    return await an.painel_executivo(db, _mun(mun, current), _ano(ano))


@router.get("/subaba")
async def subaba(current: SessaoMunicipal, id: str, mun: Optional[str] = None, ano: Optional[int] = None,
                 db: AsyncSession = Depends(get_db)):
    """Bloco "Dados oficiais FVS-AM" de uma subaba: painéis oficiais, agravos, PQA-VS ligado à subaba."""
    rota = id
    if rota not in cat.SUBABAS:
        raise HTTPException(404, "Subaba desconhecida")
    m, a = _mun(mun, current), _ano(ano)
    nomes = await an.nomes_municipios(db)
    agravos = cat.AGRAVOS_POR_SUBABA.get(rota, [])
    blocos = []
    if agravos is not None and (rota in cat.AGRAVOS_POR_SUBABA):
        disponiveis = [i[6:] for i in await an.indicadores_disponiveis(db, "sinan") if i.startswith("casos:")]
        for ag in (agravos or disponiveis):
            if ag not in disponiveis:
                continue
            anual = await an.serie(db, "sinan", f"casos:{ag}", [m, col.IBGE_AM], a - 9, a, "ano")
            semanal = await an.serie(db, "sinan", f"casos:{ag}", [m], a - 1, a, "se")
            blocos.append({"agravo": ag, "anual": anual, "semanal": semanal,
                           "comparacao": await an.comparar_periodo(db, "sinan", f"casos:{ag}", m, a)})
    pqa = None
    if rota in cat.PQA_POR_SUBABA:
        hist = await an.pqa_historico(db, m)
        alvo = {f"IND_{i}" for i in cat.PQA_POR_SUBABA[rota]}
        nomes_ind = (await an.extra_da_fonte(db, "pqa_vs")).get("indicadores_ate_2023", {})
        pqa = {"indicadores": [{"indicador": i, "nome": nomes_ind.get(i),
                                "historico": [h for h in hist if h["indicador"] == i]} for i in sorted(alvo)]}
    extra = {}
    if rota == "malaria":
        extra["malaria"] = {
            "anual": await an.serie(db, "malaria", None, [m, col.IBGE_AM], a - 9, a, "ano"),
            "semanal": await an.serie(db, "malaria", "positivos", [m], a - 1, a, "se"),
            "parasita": await an.serie(db, "malaria", "positivos", [m], a - 4, a, "ano", "parasita"),
            "comparacao": await an.comparar_periodo(db, "malaria", "positivos", m, a)}
    if rota == "monitor":
        extra["aesop"] = {"ultima": await an._aesop_ultima(db, m),
                          "semanal": await an.serie(db, "aesop", None, [m], a, a, "se")}
    if rota == "vacinas":
        extra["vacinometro"] = {"anual": await an.serie(db, "vacinometro", "doses_covid19", [m], None, None, "ano"),
                                "dose": await an.serie(db, "vacinometro", "doses_covid19", [m], None, None, "ano", "dose")}
    fontes = {f: await an._estado(db, f) for f in cat.COLETORES}
    return {"id": rota, "subaba": cat.SUBABAS[rota], "municipio": {"ibge6": m, "nome": nomes.get(m)}, "ano": a,
            "paineis": cat.paineis_da_subaba(rota), "sem_fonte_fvs": cat.SEM_FONTE_FVS.get(rota),
            "agravos": blocos, "pqa_vs": pqa, **extra, "fontes": fontes}


@router.get("/serie")
async def serie(current: SessaoMunicipal, fonte: str, indicador: Optional[str] = None, mun: Optional[str] = None,
                ano_inicio: Optional[int] = None, ano_fim: Optional[int] = None,
                periodo_tipo: Optional[Literal["ano", "mes", "se", "quadrimestre"]] = None,
                recorte: str = "total", db: AsyncSession = Depends(get_db)):
    if fonte not in cat.COLETORES:
        raise HTTPException(404, "Fonte desconhecida")
    ibges = [_mun(x, current) if x != col.IBGE_AM else x for x in (mun or "").split(",") if x.strip()] or None
    return {"fonte": fonte, "estado": await an._estado(db, fonte),
            "linhas": await an.serie(db, fonte, indicador, ibges, ano_inicio, ano_fim, periodo_tipo, recorte)}


@router.get("/indicadores")
async def indicadores(current: SessaoMunicipal, fonte: str, db: AsyncSession = Depends(get_db)):
    if fonte not in cat.COLETORES:
        raise HTTPException(404, "Fonte desconhecida")
    return {"fonte": fonte, "indicadores": await an.indicadores_disponiveis(db, fonte),
            "extra": await an.extra_da_fonte(db, fonte)}


@router.get("/alertas")
async def alertas(current: SessaoMunicipal, mun: Optional[str] = None, ano: Optional[int] = None,
                  aumento_pct: Optional[float] = Query(None, ge=1, le=1000),
                  minimo_casos: Optional[int] = Query(None, ge=1, le=10000),
                  db: AsyncSession = Depends(get_db)):
    crit = {k: v for k, v in {"aumento_pct": aumento_pct, "minimo_casos": minimo_casos}.items() if v is not None}
    return await an.alertas(db, _mun(mun, current), _ano(ano), crit)


@router.get("/mapa")
async def mapa(current: SessaoMunicipal, fonte: str = "sinan", indicador: str = "casos:Dengue",
               ano: Optional[int] = None, periodo_tipo: Literal["ano", "mes", "se", "quadrimestre"] = "ano",
               periodo: int = 0, db: AsyncSession = Depends(get_db)):
    if fonte not in cat.COLETORES:
        raise HTTPException(404, "Fonte desconhecida")
    return {**await an.mapa(db, fonte, indicador, _ano(ano), periodo_tipo, periodo),
            "estado": await an._estado(db, fonte)}


@router.get("/malha")
async def malha(current: SessaoMunicipal):
    """Limites municipais oficiais do IBGE (API de malhas v3), em cache na memória do servidor."""
    if "geo" not in _malha_cache:
        url = ("https://servicodados.ibge.gov.br/api/v3/malhas/estados/13"
               "?formato=application/vnd.geo+json&intrarregiao=municipio&qualidade=minima")
        try:
            async with httpx.AsyncClient(timeout=60) as c:
                r = await c.get(url)
                r.raise_for_status()
                geo = r.json()
        except (httpx.HTTPError, ValueError) as exc:
            return {"situacao_dado": "nao_disponivel", "geojson": None,
                    "mensagem": f"Malha do IBGE indisponível no momento ({type(exc).__name__}). Tente de novo mais tarde."}
        _malha_cache["geo"] = {"fonte": "IBGE — API de malhas territoriais v3 (servicodados.ibge.gov.br)",
                               "url": url, "geojson": geo}
    return _malha_cache["geo"]


@router.get("/comparativo")
async def comparativo(current: SessaoMunicipal, mun: str, ano: Optional[int] = None,
                      db: AsyncSession = Depends(get_db)):
    ibges = list(dict.fromkeys(_mun(x, current) for x in mun.split(",") if x.strip()))[:10]
    if not ibges:
        raise HTTPException(422, "Informe ao menos um município")
    return await an.comparativo(db, ibges, _ano(ano))


@router.get("/tendencias")
async def tendencias(current: SessaoMunicipal, fonte: str = "sinan", indicador: str = "casos:Dengue",
                     ano: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    return {"fonte": fonte, "indicador": indicador,
            "municipios": await an.tendencias(db, fonte, indicador, _ano(ano))}


@router.get("/pqa-vs")
async def pqa_vs(current: SessaoMunicipal, mun: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    m = _mun(mun, current)
    return {"ultimo": await an.pqa_resumo(db, m), "historico": await an.pqa_historico(db, m),
            "indicadores_ate_2023": (await an.extra_da_fonte(db, "pqa_vs")).get("indicadores_ate_2023", {}),
            "nota_definicoes": (await an.extra_da_fonte(db, "pqa_vs")).get("nota_definicoes"),
            "estado": await an._estado(db, "pqa_vs")}


# ── Área técnica das integrações ──────────────────────────────────────────────

@router.get("/integracoes")
async def integracoes(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    fontes = []
    for f, info in cat.COLETORES.items():
        painel = cat.painel_do_coletor(f) or {}
        fontes.append({**await an._estado(db, f), "titulo": info["titulo"], "periodicidade": info["periodicidade"],
                       "endereco": f"https://public.tableau.com/workbooks/{info['workbook']}.twb",
                       "metadados": f"https://public.tableau.com/profile/api/workbook/{info['workbook']}",
                       "metodo": "Download público da pasta de trabalho (liberado pela FVS) + leitura da extração "
                                 "com Tableau Hyper API; só agregados por município/período são gravados.",
                       "municipios": "62 municípios do AM", "subabas": painel.get("subabas", []),
                       "indicadores": await an.indicadores_disponiveis(db, f)})
    nao_extraidos = [{"titulo": p["titulo"], "integracao": p["integracao"], "plataforma": p["plataforma"],
                      "nota": p.get("nota"), "subabas": p["subabas"]}
                     for p in cat.PAINEIS if p["integracao"] != "extracao"]
    return {"fontes": fontes, "paineis_sem_extracao": nao_extraidos, "historico": await col.historico(db),
            "pode_sincronizar": current.administrador_geral or current.role in PERFIS_SINCRONIZAR}


class SincronizarIn(BaseModel):
    fonte: Optional[str] = None      # None = todas
    forcar: bool = False             # reprocessa mesmo sem nova publicação


async def _sincronizar_em_segundo_plano(fonte: str | None, usuario: str, forcar: bool) -> None:
    async with AsyncSessionLocal() as db:
        try:
            if fonte:
                await col.sincronizar(db, fonte, "manual", usuario, forcar)
            else:
                await col.sincronizar_todas(db, "manual", usuario, forcar)
        except Exception as exc:  # noqa: BLE001
            logger.error("[FVS] sincronização manual: %s", exc, exc_info=True)


@router.post("/sincronizar", status_code=202)
async def sincronizar(request: Request, current: SessaoMunicipal, corpo: SincronizarIn = Body(default=SincronizarIn()),
                      db: AsyncSession = Depends(get_db)):
    if not (current.administrador_geral or current.role in PERFIS_SINCRONIZAR):
        raise HTTPException(403, "Perfil sem permissão para atualizar as integrações")
    if corpo.fonte and corpo.fonte not in cat.COLETORES:
        raise HTTPException(404, "Fonte desconhecida")
    await registrar_auditoria(db, "FVS_SINCRONIZACAO_MANUAL", usuario=current, ip=ip_de(request),
                              tabela="fvs_sincronizacao", detalhe=f"fonte={corpo.fonte or 'todas'} forcar={corpo.forcar}")
    asyncio.create_task(_sincronizar_em_segundo_plano(corpo.fonte, current.username, corpo.forcar))
    return {"situacao": "iniciada", "fonte": corpo.fonte or "todas",
            "mensagem": "A coleta roda em segundo plano (a malária leva alguns minutos). Acompanhe no histórico."}


# ── Relatórios e IA ───────────────────────────────────────────────────────────

class RelatorioIn(BaseModel):
    tipo: Literal["municipal", "consolidado", "agravo", "comparativo", "pqa_vs", "evolucao", "alertas", "estadual"]
    formato: Literal["pdf", "xlsx", "docx"] = "pdf"
    municipios: list[str] = Field(default_factory=list, max_length=10)
    ano: Optional[int] = None
    agravo: Optional[str] = None
    incluir_analise_ia: bool = False


@router.post("/relatorio")
async def relatorio(request: Request, current: SessaoMunicipal, corpo: RelatorioIn, db: AsyncSession = Depends(get_db)):
    from services import fvs_relatorio
    ibges = [_mun(x, current) for x in corpo.municipios] or [_mun(None, current)]
    try:
        conteudo, mime, nome = await fvs_relatorio.gerar(db, corpo.tipo, corpo.formato, ibges, _ano(corpo.ano),
                                                         corpo.agravo, corpo.incluir_analise_ia,
                                                         gerado_por=current.nome or current.username)
    except fvs_relatorio.SemDados as exc:
        raise HTTPException(409, str(exc))
    await registrar_auditoria(db, "FVS_RELATORIO", usuario=current, ip=ip_de(request), tabela="fvs_serie",
                              detalhe=f"{corpo.tipo}/{corpo.formato} {','.join(ibges)} {corpo.ano or ''}")
    return Response(conteudo, media_type=mime, headers={"Content-Disposition": f'attachment; filename="{nome}"'})


class PerguntaIn(BaseModel):
    pergunta: str = Field(min_length=3, max_length=1500)
    mun: Optional[str] = None


@router.post("/ia")
async def ia(request: Request, current: SessaoMunicipal, corpo: PerguntaIn, db: AsyncSession = Depends(get_db)):
    from services import fvs_ia
    try:
        r = await fvs_ia.responder(db, corpo.pergunta, _mun(corpo.mun, current))
    except fvs_ia.IAIndisponivel as exc:
        raise HTTPException(503, str(exc))
    await registrar_auditoria(db, "FVS_IA_CONSULTA", usuario=current, ip=ip_de(request), tabela="fvs_serie",
                              detalhe=corpo.pergunta[:200])
    return r
