"""Competências da tela eGestor/SIAPS com as respostas reais de Apuí consultadas em 27/10/2026
(tests/dados/egestor_competencias_apui_20261027.json): SIAPS mensal até 08/2026 e quadrimestre 2026Q2;
e-Gestor até a parcela 10/2026 (CNES 08/2026). Competência sem publicação nunca é preenchida com outro mês."""
from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import httpx

from services import egestor_competencias as ec
from tests.test_egestor_pagamento import _egestor_falso
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)

_ASYNC_CLIENT_REAL = httpx.AsyncClient
REAL = json.loads((Path(__file__).parent / "dados" / "egestor_competencias_apui_20261027.json").read_text(encoding="utf-8"))


def _fontes_falsas(monkeypatch, siaps_fora=False, egestor_fora=False):
    ec._cache.clear()

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.host == "apisiaps.saude.gov.br":
            return httpx.Response(502) if siaps_fora else httpx.Response(200, json=REAL["siaps_competencias"])
        assert request.url.params["coMunicipio"] == "130014" and request.url.params["tipoRelatorio"] == "AGRUPADO"
        return httpx.Response(500) if egestor_fora else httpx.Response(200, json=REAL["egestor_agrupado"])
    monkeypatch.setattr(ec.httpx, "AsyncClient",
                        lambda *a, **k: _ASYNC_CLIENT_REAL(transport=httpx.MockTransport(handler), timeout=5))


def test_rotulos_e_meses():
    assert ec.rotulo("2026-08") == "Ago/2026"
    assert [ec.quadrimestre(c) for c in ("2026-04", "2026-05", "2026-08", "2026-09")] == ["2026Q1", "2026Q2", "2026Q2", "2026Q3"]
    assert ec.meses_ate(datetime(2026, 10, 27), 4) == ["2026-10", "2026-09", "2026-08", "2026-07"]
    assert ec.meses_ate(datetime(2026, 1, 5), 2) == ["2026-01", "2025-12"]


async def test_situacao_real_de_apui_em_27_10_2026(monkeypatch):
    _fontes_falsas(monkeypatch)
    fontes = await ec.consultar_fontes("1300144", forcar=True)
    comps = {c["competencia"]: c for c in ec.montar(["2026-10", "2026-09", "2026-08", "2026-07"], fontes,
                                                     cvat_importado={"2026-07"}, qualidade_capturada={"2026-07"})}
    assert comps["2026-07"]["situacao_siaps"] == "importada"
    assert comps["2026-08"]["situacao_siaps"] == "publicada_aguardando_importacao"
    assert comps["2026-08"]["quadrimestre"] == "2026Q2" and comps["2026-08"]["quadrimestre_publicado"] is True
    for m in ("2026-09", "2026-10"):
        assert comps[m]["situacao_siaps"] == "nao_publicada" and comps[m]["siaps_publicada"] is False
        assert comps[m]["quadrimestre"] == "2026Q3" and comps[m]["quadrimestre_publicado"] is False
    # e-Gestor: a parcela do mês 10/2026 já saiu (paga sobre o CNES de 08/2026); a de 11/2026 ainda não
    assert comps["2026-10"]["egestor_parcela_publicada"] is True and comps["2026-10"]["egestor_comp_cnes"] == "Ago/2026"
    assert comps["2026-10"]["egestor_parcela"] == "202610" and comps["2026-08"]["egestor_comp_cnes"] == "Jun/2026"
    nov = ec.montar(["2026-11"], fontes, set(), set())[0]
    assert nov["egestor_parcela_publicada"] is False and nov["egestor_parcela"] == "202611" and nov["egestor_total"] is None


async def test_fonte_fora_do_ar_nao_vira_nao_publicada(monkeypatch):
    _fontes_falsas(monkeypatch, siaps_fora=True, egestor_fora=True)
    fontes = await ec.consultar_fontes("1300144", forcar=True)
    assert set(fontes["erros"]) == {"siaps", "egestor"}
    c = ec.montar(["2026-08"], fontes, set(), set())[0]
    assert c["situacao_siaps"] == "fonte_indisponivel" and c["siaps_publicada"] is None
    assert c["egestor_parcela_publicada"] is None

    # com uma consulta boa anterior, a queda das duas fontes devolve a anterior com aviso
    _fontes_falsas(monkeypatch)
    await ec.consultar_fontes("1300144", forcar=True)

    def handler(request):
        return httpx.Response(503)
    monkeypatch.setattr(ec.httpx, "AsyncClient",
                        lambda *a, **k: _ASYNC_CLIENT_REAL(transport=httpx.MockTransport(handler), timeout=5))
    f = await ec.consultar_fontes("1300144", forcar=True)
    assert f["siaps"] is not None and "consulta anterior" in f["aviso"]


async def test_endpoint_e_vinculo_nao_troca_de_mes(ambiente, monkeypatch):
    import routers.siaps as rs
    c = ambiente["client"]
    _fontes_falsas(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")

    cat = (await c.get("/api/siaps/competencias", headers=_h(tok))).json()
    assert cat["ultima_siaps_publicada"] == "2026-08"
    assert {f["fonte"]: f["disponivel"] for f in cat["fontes"]} == {
        "SIAPS — área pública": True, "e-Gestor APS — relatório público de pagamento": True}
    assert cat["fontes"][1]["ultima_parcela"] == "Out/2026 (CNES 08/2026)"
    assert "coMunicipio=130014" in cat["fontes"][1]["url"]

    async def quad_vazio(ibge6, quad):
        return None
    monkeypatch.setattr(rs, "buscar_classificacao_quadrimestre", quad_vazio)
    v = (await c.get("/api/siaps/vinculo-acompanhamento", params={"competencia": "2026-10"}, headers=_h(tok))).json()
    assert v["situacao_dado"] == "nao_publicada" and v["equipes"] == [] and "Out/2026" in v["nota"]
    v = (await c.get("/api/siaps/vinculo-acompanhamento", params={"competencia": "2026-08"}, headers=_h(tok))).json()
    assert v["situacao_dado"] == "publicada_aguardando_importacao" and v["por_status"] is None

    # quadrimestre publicado: mostra a classificação pública do quadrimestre, identificada como tal
    async def quad_q2(ibge6, quad):
        assert ibge6 == "130014" and quad == "2026Q2"
        return {"total_equipes": 9, "por_status": {"otimo": 1, "bom": 5, "suficiente": 1, "regular": 2}}
    monkeypatch.setattr(rs, "buscar_classificacao_quadrimestre", quad_q2)
    v = (await c.get("/api/siaps/vinculo-acompanhamento", params={"competencia": "2026-08"}, headers=_h(tok))).json()
    assert v["fonte"] == "siaps_publico" and v["quadrimestre"] == "2026Q2" and v["equipes"] == []
    assert v["nota"].startswith("Relatório mensal de Ago/2026 não importado")

    assert (await c.get("/api/siaps/vinculo-acompanhamento", params={"competencia": "ago"}, headers=_h(tok))).status_code == 422


async def test_pagamento_nao_troca_parcela_pedida(ambiente, monkeypatch):
    c = ambiente["client"]
    _egestor_falso(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/egestor-pagamento/sincronizar", headers=_h(tok))
    p = (await c.get("/api/egestor-pagamento", params={"parcela": "202611"}, headers=_h(tok))).json()
    assert p["situacao_dado"] == "nao_publicada" and p["parcela_rotulo"] == "11ª parcela/2026"
    assert [x["nu_parcela"] for x in p["parcelas"]] == ["202609"] and "componentes" not in p
    p = (await c.get("/api/egestor-pagamento", params={"parcela": "202609"}, headers=_h(tok))).json()
    assert p["situacao_dado"] == "oficial_validado"
