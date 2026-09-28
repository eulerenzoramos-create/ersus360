"""eGestor atualizado pelas importações: cabeçalho e Vínculo pelo relatório do SIAPS,
Abrangência pelo XML do CNES (AREAL ribeirinha conta como eSFR) e cruzamento
CNES × SIAPS apontando equipe ativa sem relatório."""
from __future__ import annotations

from tests.test_cnes_xml import _importar as _importar_cnes, _xml, _zip
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)
from tests.test_siaps_relatorios import _cvat, _importar as _importar_siaps, _qualidade_esfr


async def test_egestor_usa_referencia_sem_importacao(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/siaps/dashboard", headers=_h(tok))).json()
    assert d["competencia"] == "Abr/2026" and d["fonte"] == "siaps_referencia"
    assert (await c.get("/api/siaps/abrangencia", headers=_h(tok))).json()["fonte"] == "siaps_referencia"


async def test_egestor_atualiza_com_cnes_e_siaps(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _importar_cnes(c, tok, _zip(_xml()))
    await _importar_siaps(c, tok, ("cvat.csv", _cvat()))

    d = (await c.get("/api/siaps/dashboard", headers=_h(tok))).json()
    assert (d["competencia"], d["fonte"], d["dado_preliminar"]) == ("Jul/2026", "siaps_relatorio_importado", True)
    assert d["vinculo"]["total_vinculadas"] == 1790 and d["vinculo"]["otimo"] == 1

    a = (await c.get("/api/siaps/abrangencia", headers=_h(tok))).json()
    assert a["fonte"] == "cnes_xml_importado" and a["competencia"] == "28/09/2026"
    # arquivo de teste: eSF AREAL (ribeirinha na referência de Apuí) + eSB + eMulti
    assert a["total_equipes"] == {"eAP": 0, "eAPP": 0, "eCR": 0, "eMulti": 1, "eSB": 1, "eSF": 0, "eSFR": 1}
    assert a["equipes_homologadas"]["eSF"] == 9                   # homologadas continuam do SIAPS

    # Cruzamento: AREAL ativa no CNES, ainda sem relatório do SIAPS na competência
    p = (await c.get("/api/siaps-relatorios/painel", headers=_h(tok))).json()
    assert [x["equipe"] for x in p["cnes"]["equipes_sem_relatorio_siaps"]] == ["AREAL"]
    assert any("AREAL (INE 0000007048)" in av for av in p["avisos"])
    # ... e some depois de importar o relatório de Qualidade eSFR
    await _importar_siaps(c, tok, ("esfr.csv", _qualidade_esfr()))
    p = (await c.get("/api/siaps-relatorios/painel", headers=_h(tok))).json()
    assert p["cnes"]["equipes_sem_relatorio_siaps"] == []
    assert next(e for e in p["equipes"] if e["equipe"] == "AREAL")["no_cnes"] is True


async def test_outro_municipio_nao_ve_referencia_de_apui(ambiente):
    c = ambiente["client"]
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    # /api/siaps/ continua restrito a Apuí pelo guard (módulo com referência embutida)
    assert (await c.get("/api/siaps/abrangencia", headers=_h(tok_b))).status_code == 403
