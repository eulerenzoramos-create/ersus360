import pytest
from httpx import AsyncClient, ASGITransport

import main
from database import get_db
from routers.auth import get_current_user, UserOut
from tenancy.guard import tenant_guard

ADMIN_USER = UserOut(
    username="admin-teste", nome="Admin Teste", cargo="Administrador", municipio="Apuí/AM", role="admin",
)
CONSULTA_USER = UserOut(
    username="consulta-teste", nome="Consulta Teste", cargo="Consulta", municipio="Apuí/AM", role="consulta",
)


@pytest.fixture
def app_com_overrides(db_session, municipio, monkeypatch):
    import routers.integracao_pec as rota

    async def _get_db_override():
        yield db_session

    async def _sem_rede(*a, **k):
        return []

    # PEC local não configurado e e-Gestor sem rede: o teste nunca sai da máquina.
    monkeypatch.setattr(rota, "ESUS_URL", "")
    monkeypatch.setattr(rota, "ESUS_USUARIO", "")
    monkeypatch.setattr(rota, "ESUS_SENHA", "")
    monkeypatch.setattr(rota, "_pec_token", None)
    monkeypatch.setattr(rota, "listar_parcelas", _sem_rede)
    main.app.dependency_overrides[get_db] = _get_db_override
    yield main.app
    main.app.dependency_overrides.clear()


def _como(app, usuario):
    async def _override():
        return usuario
    app.dependency_overrides[get_current_user] = _override
    app.dependency_overrides[tenant_guard] = lambda: None  # guard testado em test_isolamento_tenant


async def test_status_nao_expoe_client_secret_nem_senha(app_com_overrides, monkeypatch):
    import routers.integracao_pec as rota
    from config import settings
    monkeypatch.setattr(settings, "PEC_CLIENT_SECRET", "segredo-super-sensivel")
    monkeypatch.setattr(rota, "ESUS_SENHA", "senha-super-sensivel")
    _como(app_com_overrides, ADMIN_USER)

    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/integracao-pec/status")

    assert r.status_code == 200
    assert "segredo-super-sensivel" not in r.text
    assert "senha-super-sensivel" not in r.text
    assert settings.ESUS_INTEGRATION_ENABLED is False
    pec = r.json()["pec_local"]
    assert pec["configurada"] is False
    assert pec["online"] is None


async def test_situacao_honesta_sem_dados_sincronizados(app_com_overrides):
    _como(app_com_overrides, ADMIN_USER)
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/integracao-pec/situacao")

    assert r.status_code == 200
    body = r.json()
    assert body["pec_local"]["situacao_dado"] == "nao_disponivel"
    assert body["pec_local"]["dados"] is None
    assert body["egestor_aps"]["situacao_dado"] == "nao_disponivel"
    assert body["egestor_aps"]["ultima_parcela"] is None


async def test_sincronizar_cadastros_retorna_erros_honestos_quando_desativado(app_com_overrides):
    _como(app_com_overrides, ADMIN_USER)
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.post("/api/integracao-pec/sincronizar-cadastros")

    assert r.status_code == 200
    body = r.json()
    assert body["sucesso"] is False
    assert "contagens" not in body
    assert "fichas_resumo" not in body


async def test_reprocessar_pendencias_sem_visitas_nao_encontra_nada(app_com_overrides):
    _como(app_com_overrides, ADMIN_USER)
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.post("/api/integracao-pec/reprocessar-pendencias")

    assert r.status_code == 200
    assert r.json()["situacao_dado"] == "nao_disponivel"
    assert r.json()["pec_configurado"] is False


@pytest.mark.parametrize("rota", [
    "/api/integracao-pec/testar-conexao",
    "/api/integracao-pec/sincronizar-cadastros",
    "/api/integracao-pec/reprocessar-pendencias",
    "/api/integracao-pec/sync-esus",
])
async def test_acoes_bloqueadas_para_perfil_sem_permissao(app_com_overrides, rota):
    _como(app_com_overrides, CONSULTA_USER)
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.post(rota)

    assert r.status_code == 403
