from datetime import datetime

import pytest
from httpx import AsyncClient, ASGITransport

import main
from database import get_db
from routers.auth import get_current_user, UserOut
from models.pec_cadastro import EquipeSaude, ProfissionalSaude, Microarea, Domicilio, Cidadao
from models.visita_domiciliar import VisitaDomiciliar
from services.pec.pseudonimizacao import hash_documento, mascarar_documento

ACS_USER = UserOut(username="acs-teste", nome="ACS Teste", cargo="Agente Comunitário", municipio="Apuí/AM", role="acs")


@pytest.fixture
def app_com_overrides(db_session, municipio):
    async def _get_db_override():
        yield db_session

    async def _get_current_user_override():
        return ACS_USER

    main.app.dependency_overrides[get_db] = _get_db_override
    main.app.dependency_overrides[get_current_user] = _get_current_user_override
    yield main.app
    main.app.dependency_overrides.clear()


@pytest.fixture
async def cidadao_com_visita(db_session, municipio):
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

    domicilio = Domicilio(municipio_id=municipio.id, microarea_id=microarea.id, uuid_ficha="uuid-dom-1")
    db_session.add(domicilio)
    await db_session.flush()

    cns_real = "700000000009999"
    cidadao = Cidadao(
        municipio_id=municipio.id, domicilio_id=domicilio.id, nome="Fulano de Tal",
        cns_hash=hash_documento(cns_real), cns_mascarado=mascarar_documento(cns_real),
    )
    db_session.add(cidadao)
    await db_session.flush()

    visita = VisitaDomiciliar(
        uuid_local="uuid-visita-1", municipio_id=municipio.id, profissional_id=profissional.id,
        equipe_id=equipe.id, microarea_id=microarea.id, domicilio_id=domicilio.id, cidadao_id=cidadao.id,
        motivo_visita="Acompanhamento", tipo_visita="Rotina",
        data_hora_dispositivo=datetime(2026, 7, 20, 9, 0, 0), data_hora_servidor=datetime(2026, 7, 20, 9, 5, 0),
    )
    db_session.add(visita)
    await db_session.flush()

    return {"cidadao": cidadao, "visita": visita, "microarea": microarea}


async def test_listar_cidadaos_nunca_expoe_cns_em_texto_puro(app_com_overrides, cidadao_com_visita):
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/cidadaos")

    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["nome"] == "Fulano de Tal"
    assert body[0]["cns_mascarado"].endswith("9999")
    assert "700000000009999" not in r.text
    assert body[0]["microarea"] == "MA-01"


async def test_visitas_do_cidadao_retorna_historico(app_com_overrides, cidadao_com_visita):
    cidadao_id = cidadao_com_visita["cidadao"].id
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get(f"/api/cidadaos/{cidadao_id}/visitas")

    assert r.status_code == 200
    body = r.json()
    assert body["cidadao"]["nome"] == "Fulano de Tal"
    assert len(body["visitas"]) == 1
    assert body["visitas"][0]["acs"] == "Maria Aparecida Silva"
    assert body["visitas"][0]["numero_controle"] == "uuid-visita-1"


async def test_visitas_de_cidadao_inexistente_retorna_404(app_com_overrides):
    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/cidadaos/999999/visitas")

    assert r.status_code == 404
