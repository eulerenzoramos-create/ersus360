from datetime import datetime

import pytest
from sqlalchemy import select

from models.pec_cadastro import EquipeSaude, ProfissionalSaude, Microarea, Domicilio, Cidadao, OrigemDado
from models.visita_domiciliar import VisitaDomiciliar, VisitaTransmissao, StatusFilaVisita, StatusLocalizacao
from services.pec.pseudonimizacao import hash_documento, mascarar_documento


async def test_cadeia_completa_de_cadastros_pec(db_session, municipio):
    equipe = EquipeSaude(
        municipio_id=municipio.id, ine="0001234567", nome="ESF I", tipo_equipe="ESF",
        cnes="2206406", pec_reference_id="pec-equipe-1",
    )
    db_session.add(equipe)
    await db_session.flush()

    profissional = ProfissionalSaude(
        municipio_id=municipio.id, equipe_id=equipe.id, nome="Maria Aparecida Silva",
        cns_hash=hash_documento("700000000000001"), cns_mascarado=mascarar_documento("700000000000001"),
        cbo="5151-01", cnes="2206406", cargo="ACS", pec_reference_id="pec-prof-1",
    )
    db_session.add(profissional)
    await db_session.flush()

    microarea = Microarea(
        municipio_id=municipio.id, equipe_id=equipe.id, acs_profissional_id=profissional.id,
        codigo="MA-01", zona="urbana", pec_reference_id="pec-ma-1",
    )
    db_session.add(microarea)
    await db_session.flush()

    domicilio = Domicilio(
        municipio_id=municipio.id, microarea_id=microarea.id, uuid_ficha="uuid-dom-1",
        latitude=-7.1972, longitude=-59.8878, pec_reference_id="pec-dom-1",
    )
    db_session.add(domicilio)
    await db_session.flush()

    cidadao = Cidadao(
        municipio_id=municipio.id, domicilio_id=domicilio.id, nome="Cidadão Teste",
        cns_hash=hash_documento("700000000000002"), cns_mascarado=mascarar_documento("700000000000002"),
        pec_reference_id="pec-cid-1",
    )
    db_session.add(cidadao)
    await db_session.flush()

    # Defaults de origem_dado devem ser PEC (dado oficial), não ERSUS_OPERACIONAL
    assert equipe.origem_dado == OrigemDado.PEC
    assert cidadao.origem_dado == OrigemDado.PEC

    visita = VisitaDomiciliar(
        uuid_local="uuid-visita-1", municipio_id=municipio.id, profissional_id=profissional.id,
        equipe_id=equipe.id, microarea_id=microarea.id, domicilio_id=domicilio.id, cidadao_id=cidadao.id,
        motivo_visita="Acompanhamento", tipo_visita="Rotina",
        data_hora_dispositivo=datetime.utcnow(), data_hora_servidor=datetime.utcnow(),
    )
    db_session.add(visita)
    await db_session.flush()

    # Defaults operacionais
    assert visita.status_fila == StatusFilaVisita.CRIADO_LOCALMENTE
    assert visita.status_localizacao == StatusLocalizacao.INDISPONIVEL
    assert visita.origem_dado == OrigemDado.ERSUS_OPERACIONAL

    transmissao = VisitaTransmissao(
        visita_id=visita.id, uuid_ficha=visita.uuid_local, ledi_version="1.0", mivdt_version="1.0",
        codigo_http=200, tentativas=1,
    )
    db_session.add(transmissao)
    await db_session.flush()

    resultado = (await db_session.execute(
        select(VisitaTransmissao).where(VisitaTransmissao.visita_id == visita.id)
    )).scalars().all()
    assert len(resultado) == 1


def test_hash_documento_e_deterministico_e_nao_reversivel():
    h1 = hash_documento("700 1234 5678 9012")
    h2 = hash_documento("700123456789012")
    assert h1 == h2
    assert h1 != "700123456789012"
    assert len(h1) == 64  # sha256 hex


def test_mascarar_documento_oculta_todos_menos_os_ultimos_digitos():
    mascarado = mascarar_documento("70000000000123", digitos_visiveis=4)
    assert mascarado.endswith("0123")
    assert "7000000000" not in mascarado
