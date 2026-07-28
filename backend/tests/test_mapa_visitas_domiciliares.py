from datetime import datetime

import pytest
from httpx import AsyncClient, ASGITransport

import main
from database import get_db
from routers.auth import get_current_user, UserOut
from models.pec_cadastro import EquipeSaude, ProfissionalSaude, Microarea, Domicilio, Cidadao
from models.visita_domiciliar import VisitaDomiciliar, StatusFilaVisita

ADMIN_USER = UserOut(username="admin-teste", nome="Admin Teste", cargo="Administrador", municipio="Apuí/AM", role="admin")


@pytest.fixture
def app_com_overrides(db_session, municipio):
    async def _get_db_override():
        yield db_session

    async def _get_current_user_override():
        return ADMIN_USER

    main.app.dependency_overrides[get_db] = _get_db_override
    main.app.dependency_overrides[get_current_user] = _get_current_user_override
    yield main.app
    main.app.dependency_overrides.clear()


async def _criar_visita(db_session, municipio, status_fila):
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
        cns_hash="hash2", cns_mascarado="***1234",
    )
    db_session.add(cidadao)
    await db_session.flush()

    visita = VisitaDomiciliar(
        uuid_local="uuid-visita-1", municipio_id=municipio.id, profissional_id=profissional.id,
        equipe_id=equipe.id, microarea_id=microarea.id, domicilio_id=domicilio.id, cidadao_id=cidadao.id,
        motivo_visita="Acompanhamento", tipo_visita="Rotina",
        data_hora_dispositivo=datetime(2026, 7, 20, 9, 0, 0), data_hora_servidor=datetime(2026, 7, 20, 9, 5, 0),
        duracao_segundos=1200, status_fila=status_fila,
    )
    db_session.add(visita)
    await db_session.flush()
    return visita


async def test_dados_mapa_nunca_expoe_dado_clinico_ou_pessoal(app_com_overrides, db_session, municipio):
    await _criar_visita(db_session, municipio, StatusFilaVisita.ACEITO_PEC)

    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/mapa-visitas-domiciliares/dados")

    assert r.status_code == 200
    texto = r.text.lower()
    for termo_proibido in ["fulano de tal", "cpf", "cns", "diagnostico", "diagnóstico", "prontuario", "prontuário"]:
        assert termo_proibido not in texto

    visita = r.json()["visitas"][0]
    assert visita["acs"] == "Maria Aparecida Silva"
    assert visita["microarea"] == "MA-01"
    assert visita["numero_controle"] == "uuid-visita-1"
    assert "cidadao" not in visita
    assert "cidadão" not in str(visita.keys()).lower()


@pytest.mark.parametrize("status_fila,cor_esperada", [
    (StatusFilaVisita.CRIADO_LOCALMENTE, "amarelo"),
    (StatusFilaVisita.ENVIADO_PEC, "laranja"),
    (StatusFilaVisita.ACEITO_PEC, "verde"),
    (StatusFilaVisita.REJEITADO_PEC, "vermelho"),
    (StatusFilaVisita.PROCESSADO_FLUXO_OFICIAL, "roxo"),
])
async def test_cor_legenda_por_status_fila(app_com_overrides, db_session, municipio, status_fila, cor_esperada):
    await _criar_visita(db_session, municipio, status_fila)

    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/mapa-visitas-domiciliares/dados")

    assert r.json()["visitas"][0]["cor_legenda"] == cor_esperada


async def test_dados_mapa_vazio_quando_sem_visitas(app_com_overrides, monkeypatch):
    # cnes_service.buscar_estabelecimentos() depende de rede externa (CNES/DATASUS) —
    # isolado aqui para o teste não ficar refém de conectividade do ambiente de CI.
    async def _ubs_fake():
        return [{"cnes": "2801040", "nome": "UBS Teste", "tipo": "UBS", "latitude": -7.19, "longitude": -59.88}]
    monkeypatch.setattr("routers.mapa_visitas_domiciliares.buscar_estabelecimentos", _ubs_fake)

    async with AsyncClient(transport=ASGITransport(app=app_com_overrides), base_url="http://test") as client:
        r = await client.get("/api/mapa-visitas-domiciliares/dados")

    assert r.status_code == 200
    body = r.json()
    assert body["visitas"] == []
    assert body["domicilios"] == []
    assert len(body["ubs"]) == 1
