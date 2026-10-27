"""
Catálogo de competências da tela eGestor/SIAPS: o que cada fonte oficial já publicou e o que já entrou no ERSUS360.

Fontes públicas (sem login) consultadas a cada chamada, com cache curto:
  GET apisiaps.saude.gov.br/api/public/filtros/competencias
      → competências mensais (202608…) e quadrimestres (2026Q2…) com resultado publicado no SIAPS
  GET relatorioaps-prd.saude.gov.br/financiamento/pagamento?tipoRelatorio=AGRUPADO&coMunicipio=<6>…
      → parcelas do e-Gestor publicadas para o município (nuParcela, nuCompCnes, total)

Do banco: relatórios CVAT importados (siaps_relatorio) e resultados de Qualidade capturados (captura assistida).

Conferido em 27/10/2026 para Apuí: SIAPS mensal até 08/2026 e quadrimestre 2026Q2; e-Gestor até a
parcela 10/2026 (CNES 08/2026). Competência sem publicação aparece como "ainda não publicada" — nunca estimada.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta

import httpx
from sqlalchemy import distinct, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

URL_SIAPS = "https://apisiaps.saude.gov.br/api/public/filtros/competencias"
URL_EGESTOR = "https://relatorioaps-prd.saude.gov.br/financiamento/pagamento"
TIMEOUT = 30
_TTL = timedelta(minutes=30)
_cache: dict[str, dict] = {}
_MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
MESES_NO_CATALOGO = 12


def rotulo(comp: str) -> str:
    """'2026-08' → 'Ago/2026'."""
    ano, mes = comp.split("-")
    return f"{_MESES[int(mes) - 1]}/{ano}"


def quadrimestre(comp: str) -> str:
    ano, mes = comp.split("-")
    return f"{ano}Q{(int(mes) - 1) // 4 + 1}"


def meses_ate(hoje: datetime, n: int = MESES_NO_CATALOGO) -> list[str]:
    """Últimos n meses até o mês corrente, do mais recente para o mais antigo."""
    a, m = hoje.year, hoje.month
    saida = []
    for _ in range(n):
        saida.append(f"{a}-{m:02d}")
        a, m = (a, m - 1) if m > 1 else (a - 1, 12)
    return saida


async def _siaps_publicado(client: httpx.AsyncClient) -> dict:
    r = await client.get(URL_SIAPS)
    r.raise_for_status()
    mensais, quads = set(), set()
    for c in r.json():
        nu = str(c.get("nuCompetencia") or "")
        if c.get("quadrimestre"):
            quads.add(nu)
        elif len(nu) == 6 and nu.isdigit():
            mensais.add(f"{nu[:4]}-{nu[4:]}")
    return {"mensais": mensais, "quadrimestres": quads}


async def _egestor_publicado(client: httpx.AsyncClient, ibge: str, hoje: datetime) -> dict:
    r = await client.get(URL_EGESTOR, params={
        "tipoRelatorio": "AGRUPADO", "unidadeGeografica": "MUNICIPIO", "coUf": ibge[:2], "coMunicipio": ibge[:6],
        "nuParcelaInicio": f"{hoje.year - 1}01", "nuParcelaFim": f"{hoje.year}12"})
    r.raise_for_status()
    return {f"{g['nuParcela'][:4]}-{g['nuParcela'][4:]}": {
                "nu_parcela": g["nuParcela"], "comp_cnes": g.get("nuCompCnes"), "total": g.get("total")}
            for g in (r.json().get("agrupamentos") or []) if g.get("nuParcela")}


async def consultar_fontes(ibge: str, forcar: bool = False) -> dict:
    """Consulta as duas fontes públicas. Falha de uma fonte vira 'indisponível' — não 'não publicada'."""
    c = _cache.get(ibge)
    agora = datetime.utcnow()
    if c and not forcar and agora - c["ts"] < _TTL:
        return c["dados"]
    dados: dict = {"consultado_em": agora.isoformat(timespec="seconds") + "Z", "siaps": None, "egestor": None, "erros": {}}
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            dados["siaps"] = await _siaps_publicado(client)
        except (httpx.HTTPError, ValueError, KeyError) as e:
            dados["erros"]["siaps"] = e.__class__.__name__
        try:
            dados["egestor"] = await _egestor_publicado(client, ibge, agora)
        except (httpx.HTTPError, ValueError, KeyError) as e:
            dados["erros"]["egestor"] = e.__class__.__name__
    if dados["siaps"] is None and dados["egestor"] is None and c:
        return {**c["dados"], "aviso": "Fontes oficiais fora do ar agora; mostrando a consulta anterior."}
    _cache[ibge] = {"ts": agora, "dados": dados}
    return dados


def montar(meses: list[str], fontes: dict, cvat_importado: set[str], qualidade_capturada: set[str]) -> list[dict]:
    """Situação de cada competência. Pura (sem rede/banco) para ser testada com as respostas reais."""
    siaps, egestor = fontes.get("siaps"), fontes.get("egestor")
    saida = []
    for comp in meses:
        q = quadrimestre(comp)
        if siaps is None:
            sit = "fonte_indisponivel"
        elif comp in cvat_importado or comp in qualidade_capturada:
            sit = "importada"
        elif comp in siaps["mensais"]:
            sit = "publicada_aguardando_importacao"
        else:
            sit = "nao_publicada"
        parcela = (egestor or {}).get(comp)
        saida.append({
            "competencia": comp, "rotulo": rotulo(comp), "situacao_siaps": sit,
            "siaps_publicada": None if siaps is None else comp in siaps["mensais"],
            "quadrimestre": q, "quadrimestre_publicado": None if siaps is None else q in siaps["quadrimestres"],
            "cvat_importado": comp in cvat_importado, "qualidade_capturada": comp in qualidade_capturada,
            "egestor_parcela_publicada": None if egestor is None else parcela is not None,
            "egestor_parcela": parcela["nu_parcela"] if parcela else f"{comp[:4]}{comp[5:]}",
            "egestor_comp_cnes": rotulo(f"{parcela['comp_cnes'][:4]}-{parcela['comp_cnes'][4:]}")
                                 if parcela and parcela.get("comp_cnes") else None,
            "egestor_total": parcela.get("total") if parcela else None,
        })
    return saida


async def catalogo(db: AsyncSession, municipio_id: int | None, ibge: str, forcar: bool = False) -> dict:
    from models.indicadores_aps import ResultadoMensalSiaps
    from models.siaps_relatorio import SiapsRelatorio
    from services.siaps_captura import FONTE_CAPTURA

    fontes = await consultar_fontes(ibge, forcar)
    cvat, qual = set(), set()
    if municipio_id is not None:
        cvat = set((await db.execute(select(distinct(SiapsRelatorio.competencia)).where(
            SiapsRelatorio.municipio_id == municipio_id, SiapsRelatorio.componente == "cvat"))).scalars())
        qual = set((await db.execute(select(distinct(ResultadoMensalSiaps.competencia)).where(
            ResultadoMensalSiaps.municipio_ibge == ibge, ResultadoMensalSiaps.fonte == FONTE_CAPTURA))).scalars())
    comps = montar(meses_ate(datetime.utcnow()), fontes, cvat, qual)
    siaps, egestor = fontes.get("siaps"), fontes.get("egestor")
    ult_siaps = max(siaps["mensais"]) if siaps and siaps["mensais"] else None
    ult_quad = max(siaps["quadrimestres"]) if siaps and siaps["quadrimestres"] else None
    ult_parc = max(egestor) if egestor else None
    com_dados = sorted(cvat | qual, reverse=True)
    return {
        "consultado_em": fontes["consultado_em"],
        "aviso": fontes.get("aviso"),
        "fontes": [
            {"fonte": "SIAPS — área pública", "url": URL_SIAPS, "disponivel": siaps is not None,
             "erro": fontes["erros"].get("siaps"),
             "ultima_mensal": ult_siaps and rotulo(ult_siaps), "ultimo_quadrimestre": ult_quad},
            {"fonte": "e-Gestor APS — relatório público de pagamento",
             "url": f"{URL_EGESTOR}?tipoRelatorio=AGRUPADO&unidadeGeografica=MUNICIPIO&coUf={ibge[:2]}&coMunicipio={ibge[:6]}",
             "disponivel": egestor is not None, "erro": fontes["erros"].get("egestor"),
             "ultima_parcela": ult_parc and f"{rotulo(ult_parc)} (CNES {egestor[ult_parc]['comp_cnes'][4:]}/{egestor[ult_parc]['comp_cnes'][:4]})"},
        ],
        "ultima_siaps_publicada": ult_siaps,
        "ultima_com_dados": com_dados[0] if com_dados else None,
        "nota": ("Resultados mensais por equipe (CVAT e Qualidade) ficam na área logada do SIAPS (gov.br): competência "
                 "publicada só aparece nas abas depois de importada (Relatórios do SIAPS) ou capturada (Componente Qualidade)."),
        "competencias": comps,
    }
