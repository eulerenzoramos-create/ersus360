"""/api/integracao/status existe em dois routers; o Painel de Integrações espera o de integracao_status
(com integracoes.egestor etc.). A primeira rota registrada vence — este teste trava a ordem."""
from main import app

ALVO = "/api/integracao/status"


def test_status_integracoes_serve_o_formato_do_painel():
    for r in app.routes:
        original = getattr(r, "original_router", None)
        for rota in getattr(original, "routes", []):
            if getattr(rota, "path", None) == ALVO:
                assert rota.endpoint.__module__ == "routers.integracao_status"
                return
    raise AssertionError(f"nenhuma rota atende {ALVO}")


# ── o painel testa as fontes de verdade e não afirma o que não verificou ─────────────────────────

import pytest  # noqa: E402

from models.equipe_siaps import EquipeSiaps  # noqa: E402
from routers import integracao_status as st  # noqa: E402
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: E402,F401


def _sondas(monkeypatch, alcancavel=True):
    chamadas = []

    async def falsa(url, headers=None, verify=True):
        chamadas.append(url)
        return {"alcancavel": alcancavel, "http": 200 if alcancavel else None, "ms": 42,
                "erro": None if alcancavel else "ConnectTimeout"}
    monkeypatch.setattr(st, "_sonda", falsa)
    return chamadas


async def _semear(ambiente):
    async with ambiente["Session"]() as db:
        db.add_all([EquipeSiaps(municipio_id=ambiente["ids"]["apui"], ine="0001536974", nome="SÃO SEBASTIÃO", tipo="eSF"),
                    EquipeSiaps(municipio_id=ambiente["ids"]["apui"], ine="0000007048", nome="AREAL", tipo="eSFR"),
                    EquipeSiaps(municipio_id=ambiente["ids"]["apui"], ine="0002449927", nome="EMULTI", tipo="eMulti")])
        await db.commit()


@pytest.mark.asyncio
async def test_painel_testa_as_fontes_e_usa_equipes_do_municipio(ambiente, monkeypatch):
    c = ambiente["client"]
    chamadas = _sondas(monkeypatch)
    await _semear(ambiente)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/integracao/status", headers=_h(tok))).json()
    assert len(chamadas) == 3                                      # SIAPS, e-Gestor e CNES testados de verdade
    assert d["ibge"] == "1300144" and d["sistemas_ok"] == 3 and d["total_sistemas"] == 4
    eg = d["integracoes"]["egestor"]
    assert eg["equipes_retornadas"] == 2                           # só eSF/eSFR; a eMulti não entra
    assert {i["ine"] for i in eg["ines_obtidos"]} == {"0001536974", "0000007048"}
    assert eg["tempo_ms"] == 42 and "tempo real" not in str(d).lower()
    cnes = d["integracoes"]["cnes"]
    assert cnes["com_rejeicao_equipe_esf"] is None and cnes["sem_rejeicao_equipe_esf"] is None   # não inventa
    assert "05/09/2026" in cnes["fonte"]
    assert d["integracoes"]["esus_pec"]["rnds"]["alcancavel"] is None                            # não testada


@pytest.mark.asyncio
async def test_fonte_fora_do_ar_nao_aparece_como_operacional(ambiente, monkeypatch):
    c = ambiente["client"]
    _sondas(monkeypatch, alcancavel=False)
    await _semear(ambiente)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/integracao/status", headers=_h(tok))).json()
    assert d["sistemas_ok"] == 0
    assert d["integracoes"]["siaps"]["api_publica_alcancavel"] is False
    assert "não respondeu" in d["integracoes"]["egestor"]["nota"]


@pytest.mark.asyncio
async def test_modulo_so_de_apui_continua_barrado_para_outro_municipio(ambiente, monkeypatch):
    c = ambiente["client"]
    chamadas = _sondas(monkeypatch)
    await _semear(ambiente)
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    r = await c.get("/api/integracao/status", headers=_h(tok_b))
    assert r.status_code == 403 and chamadas == []                 # nem chega a testar as fontes
