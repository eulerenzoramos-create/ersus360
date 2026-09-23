"""Quadro "Repasses APS recebidos" da tela inicial: soma oficial do e-Gestor APS
para o município DA SESSÃO; sem resposta da fonte → indisponível (sem valor)."""
import httpx

from services.cache_service import _store
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)


def _falso_egestor(consultas: list[str], total_por_parcela: float):
    original = httpx.AsyncClient.send

    async def falso(self, request, *a, **k):
        if request.url.host == "test":
            return await original(self, request, *a, **k)
        consultas.append(str(request.url))
        if "financiamento/pagamento" in str(request.url):
            return httpx.Response(200, request=request, json={"data": "2026-09-23", "agrupamentos": [
                {"nuParcela": "202601", "total": total_por_parcela, "listaPagamentoPlanoOrcamentario": []},
                {"nuParcela": "202602", "total": total_por_parcela, "listaPagamentoPlanoOrcamentario": []},
            ]})
        return httpx.Response(404, request=request, json={})
    return falso


async def test_repasses_aps_do_municipio_da_sessao(ambiente, monkeypatch):
    c = ambiente["client"]
    _store.clear()
    consultas: list[str] = []
    monkeypatch.setattr(httpx.AsyncClient, "send", _falso_egestor(consultas, 1000.50))
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    stats = (await c.get("/api/dashboard/stats", headers=_h(tok_b))).json()
    assert stats["repasses_aps_total"] == 2001.0
    assert stats["repasses_aps_parcelas"] == 2
    assert stats["repasses_aps_situacao"] == "oficial_validado"
    pagamento = [u for u in consultas if "financiamento/pagamento" in u]
    assert pagamento and all("coMunicipio=139999" in u for u in pagamento)
    assert not any("130014" in u for u in consultas)
    _store.clear()


async def test_repasses_aps_indisponivel_sem_resposta(ambiente, monkeypatch):
    c = ambiente["client"]
    _store.clear()
    original = httpx.AsyncClient.send

    async def fora(self, request, *a, **k):
        if request.url.host == "test":
            return await original(self, request, *a, **k)
        return httpx.Response(503, request=request, json={})

    monkeypatch.setattr(httpx.AsyncClient, "send", fora)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    stats = (await c.get("/api/dashboard/stats", headers=_h(tok))).json()
    assert stats["repasses_aps_total"] is None
    assert stats["repasses_aps_situacao"] == "nao_disponivel"
    _store.clear()
