"""Componente Qualidade → "Selecione um Indicador" (/api/pec/indicadores/{competencia}) usa os
relatórios de Qualidade do SIAPS importados: nome oficial do indicador → código (C1, R1…),
lista de equipes do município (SIAPS + CNES) e isolamento por município."""
from __future__ import annotations

from services.siaps_relatorio import codigo_indicador
from tests.test_cnes_xml import _importar as _importar_cnes, _xml, _zip
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)
from tests.test_siaps_relatorios import _cvat, _importar, _qualidade_esf_xlsx, _qualidade_esfr


def test_codigo_do_indicador_pelo_nome_oficial():
    assert codigo_indicador("Mais Acesso à APS") == "C1"
    assert codigo_indicador("Mais acesso à eSFR") == "R1"
    assert codigo_indicador("  MAIS  ACESSO A APS ") == "C1"          # sem acento / caixa / espaços
    assert codigo_indicador("Taxa de exodontias") == "B3"
    assert codigo_indicador("Indicador inexistente") is None


async def test_sem_importacao_mantem_referencia(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/pec/indicadores/2026-07", headers=_h(tok))).json()
    assert "REFERÊNCIA" in d["fonte"] and not d.get("equipes_lista")


async def test_indicadores_vem_dos_relatorios_importados(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _importar_cnes(c, tok, _zip(_xml()))
    await _importar(c, tok, ("cvat.csv", _cvat()), ("esfr.csv", _qualidade_esfr()),
                    ("esf.xlsx", _qualidade_esf_xlsx()))

    d = (await c.get("/api/pec/indicadores/2026-07", headers=_h(tok))).json()
    assert d["fonte"].startswith("SIAPS — relatórios oficiais importados")
    assert d["equipes"]["CACHOEIRA"] == {"C1": 46.14}
    assert d["equipes"]["AREAL"] == {"R1": 40.0}
    lista = {e["equipe"]: e for e in d["equipes_lista"]}
    assert lista["AREAL"]["tipo"] == "eSFR" and lista["AREAL"]["ine"] == "0000007048"
    assert lista["LIBERDADE"]["tipo"] == "eSF"                        # veio do CVAT, sem Qualidade
    assert d["tipos_equipe"]["AREAL"] == "eSFR"

    # competência sem relatório importado continua na referência
    d = (await c.get("/api/pec/indicadores/2026-06", headers=_h(tok))).json()
    assert not d.get("equipes_lista")


async def test_outro_municipio_nao_acessa(ambiente):
    c = ambiente["client"]
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    # /api/pec/ segue restrito a Apuí pelo guard (módulo com referência embutida)
    assert (await c.get("/api/pec/indicadores/2026-07", headers=_h(tok_b))).status_code == 403
