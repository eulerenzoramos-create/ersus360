import pytest
from httpx import AsyncClient, ASGITransport

import main
from database import get_db
from routers.auth import get_current_user, UserOut

ADMIN_USER = UserOut(
    username="admin-teste", nome="Admin Teste", cargo="Administrador", municipio="Apuí/AM", role="admin",
)
CONSULTA_USER = UserOut(
    username="consulta-teste", nome="Consulta Teste", cargo="Consulta", municipio="Apuí/AM", role="consulta",
)


@pytest.fixture
def app_com_overrides(db_session, municipio):
    async def _get_db_override():
        yield db_session

    main.app.dependency_overrides[get_db] = _get_db_override
    yield main.app
    main.app.dependency_overrides.clear()


def _como(app, usuario):
    async def _override():
        return usuario
    app.dependency_overrides[get_current_user] = _override


async def test_status_nao_expoe_client_secret_nem_senha(app_com_overrides, monkeypatch):
    from config import settings
    monkeypatch.setattr(settings, "PEC_CLIENT_SECRET", "segredo-super-sensivel")
    _como(app_com_overrides, ADMIN_USER)

    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/integracao-pec/status")

    assert r.status_code == 200
    assert "segredo-super-sensivel" not in r.text
    assert r.json()["integracao_habilitada"] is False


async def test_situacao_honesta_sem_dados_sincronizados(app_com_overrides):
    _como(app_com_overrides, ADMIN_USER)
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/integracao-pec/situacao")

    assert r.status_code == 200
    body = r.json()
    assert body["registros_aceitos"] == 0
    assert body["registros_rejeitados"] == 0
    assert body["ultima_sincronizacao"] is None


async def test_sincronizar_cadastros_retorna_erros_honestos_quando_desativado(app_com_overrides):
    _como(app_com_overrides, ADMIN_USER)
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.post("/api/integracao-pec/sincronizar-cadastros")

    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "nao_executado"
    assert len(body["erros"]) == 5
    assert body["resultados"] == {}


async def test_reprocessar_pendencias_sem_visitas_nao_encontra_nada(app_com_overrides):
    _como(app_com_overrides, ADMIN_USER)
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.post("/api/integracao-pec/reprocessar-pendencias")

    assert r.status_code == 200
    assert r.json()["status"] == "sem_pendencias"


async def test_acoes_bloqueadas_para_perfil_sem_permissao(app_com_overrides):
    _como(app_com_overrides, CONSULTA_USER)
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.post("/api/integracao-pec/testar-conexao")

    assert r.status_code == 403
