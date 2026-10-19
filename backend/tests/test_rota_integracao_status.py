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
