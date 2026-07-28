import pytest
from httpx import AsyncClient, ASGITransport

import main
from database import get_db
from routers.auth import get_current_user, UserOut
from models.pec_cadastro import EquipeSaude, ProfissionalSaude, Microarea, Domicilio, Cidadao

ACS_USER = UserOut(username="acs-teste", nome="ACS Teste", cargo="Agente Comunitário", municipio="Apuí/AM", role="acs")
CONSULTA_USER = UserOut(username="consulta-teste", nome="Consulta Teste", cargo="Consulta", municipio="Apuí/AM", role="consulta")


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


@pytest.fixture
async def cadastro_base(db_session, municipio):
    equipe = EquipeSaude(municipio_id=municipio.id, ine="0001", nome="ESF I", tipo_equipe="ESF", cnes="2206406")
    db_session.add(equipe)
    await db_session.flush()

    profissional = ProfissionalSaude(
        municipio_id=municipio.id, equipe_id=equipe.id, nome="Maria Aparecida Silva",
        cns_hash="hash1", cns_mascarado="***9999", cbo="5151-01", cnes="2206406", cargo="ACS",
    )
    db_session.add(profissional)
    await db_session.flush()

    microarea = Microarea(municipio_id=municipio.id, equipe_id=equipe.id, codigo="MA-01", zona="urbana")
    db_session.add(microarea)
    await db_session.flush()

    domicilio = Domicilio(
        municipio_id=municipio.id, microarea_id=microarea.id, uuid_ficha="uuid-dom-1",
        latitude=-7.1972, longitude=-59.8878,
    )
    db_session.add(domicilio)
    await db_session.flush()

    cidadao = Cidadao(
        municipio_id=municipio.id, domicilio_id=domicilio.id, nome="Fulano de Tal",
        cns_hash="hash-cidadao", cns_mascarado="***1234",
    )
    db_session.add(cidadao)
    await db_session.flush()

    return {
        "equipe": equipe, "profissional": profissional, "microarea": microarea,
        "domicilio": domicilio, "cidadao": cidadao,
    }


async def test_opcoes_lista_profissionais_e_domicilios(app_com_overrides, cadastro_base):
    _como(app_com_overrides, ACS_USER)
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/visitas-domiciliares/opcoes")

    assert r.status_code == 200
    body = r.json()
    assert len(body["profissionais"]) == 1
    assert len(body["domicilios"]) == 1


async def test_registrar_visita_com_sucesso(app_com_overrides, cadastro_base):
    _como(app_com_overrides, ACS_USER)
    payload = {
        "profissional_id": cadastro_base["profissional"].id,
        "domicilio_id": cadastro_base["domicilio"].id,
        "motivo_visita": "Acompanhamento",
        "tipo_visita": "Rotina",
        "latitude_visita": -7.1975,
        "longitude_visita": -59.8880,
        "precisao_gps_metros": 8.5,
    }
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.post("/api/visitas-domiciliares", json=payload)

    assert r.status_code == 200
    body = r.json()
    assert body["status_fila"] == "criado_localmente"
    assert "uuid_local" in body


async def test_registrar_visita_bloqueado_para_perfil_sem_permissao(app_com_overrides, cadastro_base):
    _como(app_com_overrides, CONSULTA_USER)
    payload = {
        "profissional_id": cadastro_base["profissional"].id,
        "domicilio_id": cadastro_base["domicilio"].id,
        "motivo_visita": "Acompanhamento",
        "tipo_visita": "Rotina",
    }
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.post("/api/visitas-domiciliares", json=payload)

    assert r.status_code == 403


async def test_registrar_visita_domicilio_inexistente_retorna_404(app_com_overrides, cadastro_base):
    _como(app_com_overrides, ACS_USER)
    payload = {
        "profissional_id": cadastro_base["profissional"].id,
        "domicilio_id": 999999,
        "motivo_visita": "Acompanhamento",
        "tipo_visita": "Rotina",
    }
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.post("/api/visitas-domiciliares", json=payload)

    assert r.status_code == 404


async def test_visita_registrada_aparece_no_mapa_com_status_amarelo(app_com_overrides, cadastro_base):
    _como(app_com_overrides, ACS_USER)
    payload = {
        "profissional_id": cadastro_base["profissional"].id,
        "domicilio_id": cadastro_base["domicilio"].id,
        "motivo_visita": "Acompanhamento",
        "tipo_visita": "Rotina",
        "latitude_visita": -7.1975,
        "longitude_visita": -59.8880,
    }
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        criar = await client.post("/api/visitas-domiciliares", json=payload)
        assert criar.status_code == 200

        mapa = await client.get("/api/mapa-visitas-domiciliares/dados")

    assert mapa.status_code == 200
    visitas = mapa.json()["visitas"]
    assert len(visitas) == 1
    assert visitas[0]["cor_legenda"] == "amarelo"
    assert visitas[0]["acs"] == "Maria Aparecida Silva"


async def test_opcoes_lista_cidadaos(app_com_overrides, cadastro_base):
    _como(app_com_overrides, ACS_USER)
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/visitas-domiciliares/opcoes")

    assert r.status_code == 200
    assert len(r.json()["cidadaos"]) == 1
    assert r.json()["cidadaos"][0]["nome"] == "Fulano de Tal"


async def test_registrar_visita_com_cidadao(app_com_overrides, cadastro_base):
    _como(app_com_overrides, ACS_USER)
    payload = {
        "profissional_id": cadastro_base["profissional"].id,
        "domicilio_id": cadastro_base["domicilio"].id,
        "cidadao_id": cadastro_base["cidadao"].id,
        "motivo_visita": "Acompanhamento",
        "tipo_visita": "Rotina",
    }
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        criar = await client.post("/api/visitas-domiciliares", json=payload)
        assert criar.status_code == 200

        historico = await client.get(f"/api/cidadaos/{cadastro_base['cidadao'].id}/visitas")

    assert historico.status_code == 200
    assert len(historico.json()["visitas"]) == 1


async def test_registrar_visita_cidadao_inexistente_retorna_404(app_com_overrides, cadastro_base):
    _como(app_com_overrides, ACS_USER)
    payload = {
        "profissional_id": cadastro_base["profissional"].id,
        "domicilio_id": cadastro_base["domicilio"].id,
        "cidadao_id": 999999,
        "motivo_visita": "Acompanhamento",
        "tipo_visita": "Rotina",
    }
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.post("/api/visitas-domiciliares", json=payload)

    assert r.status_code == 404
