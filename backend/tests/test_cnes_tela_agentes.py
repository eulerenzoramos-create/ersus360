"""Monitoramento CNES — filtros, exportação PDF/Excel, alertas automáticos e contexto do ERSUS IA (etapas 4 e 5)."""
from __future__ import annotations

from sqlalchemy import select

from models.alerta import Alerta
from tests.test_cnes_retrato import cnes_simulado  # noqa: F401 (fixture)
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)

ESF = "0000000101"


async def _coletar(c, tok):
    r = await c.post("/api/scnes-conformidade/retrato/coletar", headers=_h(tok))
    assert r.status_code == 200, r.text
    return r.json()


async def test_filtros_e_exportacao(ambiente, cnes_simulado):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _coletar(c, tok)
    d = (await c.get("/api/scnes-conformidade/conformidade?tipo=eSF", headers=_h(tok))).json()
    assert [e["ine"] for e in d["equipes"]] == [ESF]
    assert d["cards"]["eMulti"]["cadastradas_cnes"] == 1                 # cards são do município todo
    assert all(x["ine"] == ESF for x in d["criterios_pendentes"]) and d["criterios_pendentes"]
    d2 = (await c.get("/api/scnes-conformidade/conformidade?cnes=0000002", headers=_h(tok))).json()
    assert [e["tipo"] for e in d2["equipes"]] == ["eMulti"]              # só a eMulti apoia a UBS 2
    assert (await c.get("/api/scnes-conformidade/conformidade?tipo=xyz", headers=_h(tok))).status_code == 422

    pdf = await c.get("/api/scnes-conformidade/conformidade/exportar?formato=pdf", headers=_h(tok))
    assert pdf.status_code == 200 and pdf.content[:4] == b"%PDF"
    assert "monitoramento_cnes_1300144_202610.pdf" in pdf.headers["content-disposition"]
    xl = await c.get("/api/scnes-conformidade/conformidade/exportar?formato=xlsx&tipo=eSF", headers=_h(tok))
    assert xl.status_code == 200 and xl.content[:2] == b"PK"
    # sem retrato no município B → 404 (nada de outro município)
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/scnes-conformidade/conformidade/exportar", headers=_h(tok_b))).status_code == 404


async def test_alertas_criados_atualizados_e_resolvidos(ambiente, cnes_simulado):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await _coletar(c, tok)
    assert r["alertas"]["criados"] >= 1

    async def abertos(mid):
        async with S() as db:
            return {a.titulo for a in (await db.execute(select(Alerta).where(
                Alerta.municipio_id == mid, Alerta.modulo == "CNES", Alerta.resolvido.is_(False)))).scalars()}

    a1 = await abertos(ids["apui"])
    assert any("eSF EQUIPE TESTE — Composição mínima" in t for t in a1)
    assert await abertos(ids["b"]) == set()                              # isolado por município
    # nova coleta igual: não duplica
    r2 = await _coletar(c, tok)
    assert r2["alertas"]["criados"] == 0 and await abertos(ids["apui"]) == a1
    # equipe regularizada (ACS entrou): o alerta de composição é resolvido sozinho
    from tests import test_cnes_retrato as tr
    orig = tr._api

    def com_acs(*a, **kw):
        buscar = orig(*a, **kw)

        async def b2(caminho):
            dados = await buscar(caminho)
            if "coEquipe=101" in caminho and dados:
                return dados + [{**dados[0], "cbo": "515105", "dsCbo": "ACS", "noProfissional": "ACS FICTICIO",
                                 "cns": "700000000000019"}]
            return dados
        return b2
    tr._api = com_acs
    try:
        r3 = await _coletar(c, tok)
    finally:
        tr._api = orig
    assert r3["alertas"]["resolvidos"] >= 1
    assert not any("Composição mínima" in t for t in await abertos(ids["apui"]))


async def test_ersus_ia_recebe_o_monitoramento_cnes(ambiente, cnes_simulado):
    from services import siaps_ia
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    async with S() as db:
        ctx = await siaps_ia.montar_contexto(db, ids["apui"], "1300144", "Apuí")
    assert ctx["monitoramento_cnes"] == "sem retrato do CNES"
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _coletar(c, tok)
    async with S() as db:
        ctx = await siaps_ia.montar_contexto(db, ids["apui"], "1300144", "Apuí")
    m = ctx["monitoramento_cnes"]
    assert m["competencia_cnes"] == "202610" and m["pendencias"]
    assert all(p["fundamentacao"] for p in m["pendencias"] if p["situacao"] == "irregular" and "e-Gestor" not in p["criterio"])
    assert "Monitoramento CNES — CNES 202610" in siaps_ia.fontes_do_contexto(ctx)
    assert "cnes" in siaps_ia.MODOS and "Não a altere" in siaps_ia.SYSTEM
