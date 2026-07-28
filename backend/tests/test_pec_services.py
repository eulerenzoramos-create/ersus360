from datetime import datetime

import pytest
from sqlalchemy import select

from config import settings
from services.pec.base import exigir_integracao_ativa
from services.pec.connection import PecConnectionService
from services.pec.exceptions import PecIntegracaoDesativadaError
from services.pec.cadastros import EquipeSaudeDTO, PecTeamService, ProfissionalSaudeDTO, PecProfessionalService
from services.pec.pseudonimizacao import hash_documento
from services.pec.mivdt import MivdtBuilderService
from services.pec.auditoria import PecAuditService
from models.pec_cadastro import EquipeSaude, ProfissionalSaude, Microarea, Domicilio, Cidadao
from models.visita_domiciliar import VisitaDomiciliar
from models.usuario import AuditLog


# ─── Guard-rail: nunca simular conexão/dado real quando desativado ──────────

def test_exigir_integracao_ativa_bloqueia_por_padrao():
    assert settings.ESUS_INTEGRATION_ENABLED is False
    with pytest.raises(PecIntegracaoDesativadaError):
        exigir_integracao_ativa()


async def test_connection_service_desativado_nao_faz_chamada_de_rede():
    status = await PecConnectionService().test_connection()
    assert status.conectado is None
    assert "desativada" in status.mensagem.lower()


async def test_connection_service_habilitado_sem_credenciais(monkeypatch):
    monkeypatch.setattr(settings, "ESUS_INTEGRATION_ENABLED", True)
    status = await PecConnectionService().test_connection()
    assert status.configurado is False
    assert status.conectado is None
    assert "ausentes" in status.mensagem.lower()


async def test_connection_service_habilitado_reporta_falha_real_de_rede(monkeypatch):
    monkeypatch.setattr(settings, "ESUS_INTEGRATION_ENABLED", True)
    monkeypatch.setattr(settings, "PEC_BASE_URL", "http://127.0.0.1:1")
    monkeypatch.setattr(settings, "PEC_CLIENT_ID", "teste")
    monkeypatch.setattr(settings, "PEC_CLIENT_SECRET", "teste")
    monkeypatch.setattr(settings, "PEC_REQUEST_TIMEOUT", 2)

    status = await PecConnectionService().test_connection()
    # Uma tentativa de rede real foi feita e falhou honestamente — nunca "sucesso" fabricado.
    assert status.conectado is False
    assert "falha de rede" in status.mensagem.lower()


async def test_team_service_fetch_bloqueado_quando_desativado():
    with pytest.raises(PecIntegracaoDesativadaError):
        await PecTeamService().fetch_from_pec()


async def test_team_service_fetch_nao_simula_dado_quando_endpoint_pendente(monkeypatch):
    monkeypatch.setattr(settings, "ESUS_INTEGRATION_ENABLED", True)
    monkeypatch.setattr(settings, "PEC_BASE_URL", "https://pec.exemplo.gov.br")
    monkeypatch.setattr(settings, "PEC_CLIENT_ID", "teste")
    monkeypatch.setattr(settings, "PEC_CLIENT_SECRET", "teste")
    with pytest.raises(NotImplementedError):
        await PecTeamService().fetch_from_pec()


# ─── Upsert local: reconciliação sem duplicidade ────────────────────────────

async def test_team_service_upsert_cria_atualiza_e_detecta_inalterado(db_session, municipio):
    dto = EquipeSaudeDTO(pec_reference_id="pec-equipe-x", ine="000111222", nome="ESF II", tipo_equipe="ESF", cnes="2206406")

    r1 = await PecTeamService().upsert_local(db_session, municipio.id, [dto])
    assert r1 == {"criados": 1, "atualizados": 0, "inalterados": 0}

    r2 = await PecTeamService().upsert_local(db_session, municipio.id, [dto])
    assert r2 == {"criados": 0, "atualizados": 0, "inalterados": 1}

    dto_alterado = dto.model_copy(update={"nome": "ESF II Renomeada"})
    r3 = await PecTeamService().upsert_local(db_session, municipio.id, [dto_alterado])
    assert r3 == {"criados": 0, "atualizados": 1, "inalterados": 0}


async def test_professional_service_upsert_nunca_persiste_cns_em_texto_puro(db_session, municipio):
    cns_real = "700000000009999"
    dto = ProfissionalSaudeDTO(
        pec_reference_id="pec-prof-x", nome="Ana Paula Ferreira", cns=cns_real,
        cbo="5151-01", cnes="2206406", cargo="ACS",
    )
    await PecProfessionalService().upsert_local(db_session, municipio.id, [dto])

    salvo = (await db_session.execute(
        select(ProfissionalSaude).where(ProfissionalSaude.pec_reference_id == "pec-prof-x")
    )).scalar_one()

    assert not hasattr(salvo, "cns")
    assert salvo.cns_hash == hash_documento(cns_real)
    assert salvo.cns_mascarado.endswith("9999")
    assert cns_real not in salvo.cns_mascarado


# ─── MIVDT builder ───────────────────────────────────────────────────────────

def test_mivdt_builder_bloqueia_sem_versao_configurada():
    with pytest.raises(PecIntegracaoDesativadaError):
        MivdtBuilderService().construir(VisitaDomiciliar())


def test_mivdt_builder_constroi_payload_a_partir_da_visita(monkeypatch):
    monkeypatch.setattr(settings, "MIVDT_VERSION", "2025.1")

    equipe = EquipeSaude(ine="000111222", nome="ESF I", tipo_equipe="ESF", cnes="2206406")
    profissional = ProfissionalSaude(
        nome="Maria", cns_hash="x", cns_mascarado="***9999", cbo="5151-01", cnes="2206406",
    )
    microarea = Microarea(codigo="MA-01", zona="urbana")
    domicilio = Domicilio(uuid_ficha="uuid-dom-x")
    visita = VisitaDomiciliar(
        uuid_local="uuid-visita-x", motivo_visita="Rotina", tipo_visita="Acompanhamento",
        data_hora_dispositivo=datetime.utcnow(), data_hora_servidor=datetime.utcnow(),
        visita_compartilhada=False,
        profissional=profissional, equipe=equipe, microarea=microarea, domicilio=domicilio, cidadao=None,
    )

    payload = MivdtBuilderService().construir(visita)
    assert payload.versao_mivdt == "2025.1"
    assert payload.profissional_cns_mascarado == "***9999"
    assert payload.microarea_codigo == "MA-01"
    assert payload.domicilio_uuid_ficha == "uuid-dom-x"
    assert payload.cidadao_cns_mascarado is None


# ─── Auditoria ───────────────────────────────────────────────────────────────

async def test_audit_service_grava_no_audit_log_existente(db_session):
    entrada = await PecAuditService().registrar(
        db_session, usuario_id=1, acao="SINCRONIZAR", tabela="pec_equipes_saude",
        registro_id=None, detalhe="Sincronização de equipes solicitada manualmente.",
    )
    assert entrada.id is not None
    assert isinstance(entrada, AuditLog)
