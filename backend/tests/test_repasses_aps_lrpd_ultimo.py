"""LRPD zerado na parcela: a tela recebe o último LRPD pago como referência, sem alterar o total."""
import asyncio

import routers.repasses_aps_apui as r
from services.egestor_aps import EGestorAPIError


def test_parcelas_anteriores_volta_o_ano():
    assert r.parcelas_anteriores("202611", 3) == ["202610", "202609", "202608"]
    assert r.parcelas_anteriores("202602", 3) == ["202601", "202512", "202511"]


def test_lrpd_ultimo_pago_acha_parcela_anterior(monkeypatch):
    dados = {"202610": {"esb": {"vl_lrpd_municipal": 11250}, "parcela": "10/12"}}

    async def falso(co_municipio, co_uf, parcela_inicio, parcela_fim):
        if parcela_inicio == "202609":
            raise EGestorAPIError("fora")
        return {"detalhado": dados.get(parcela_inicio, {"esb": {"vl_lrpd_municipal": 0}})}

    r._LRPD_CACHE.clear()
    monkeypatch.setattr(r, "buscar_completo", falso)
    assert asyncio.run(r._lrpd_ultimo_pago("202611")) == {"nu_parcela": "202610", "parcela": "10/12", "valor": 11250}


def test_lrpd_ultimo_pago_sem_historico(monkeypatch):
    async def falso(**kw):
        return {"detalhado": {"esb": {"vl_lrpd_municipal": 0}}}

    r._LRPD_CACHE.clear()
    monkeypatch.setattr(r, "buscar_completo", falso)
    assert asyncio.run(r._lrpd_ultimo_pago("202611")) is None
