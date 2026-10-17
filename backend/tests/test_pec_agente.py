"""PEC_SYNC_AGENT — recepção do agente local, isolamento por município, LGPD e Painel ACS."""
from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from starlette.requests import Request

from models.municipio import Municipio
from models.pec_agente import PecAcsLote, PecAgenteExecucao
from routers import acs as acs_router
from routers.pec_agente import (
    EsquemaIn, HeartbeatIn, LoteAcsIn, receber_esquema, receber_heartbeat, receber_lote_acs, situacao_agente,
)
from services import pec_acs

CHAVE = "chave-teste-apui"
H1, H2 = "a" * 64, "b" * 64


def _req():
    return Request({"type": "http", "method": "POST", "path": "/api/pec-agente/acs", "headers": [],
                    "client": ("10.0.0.1", 1234)})


def _lote(**extra):
    base = {
        "ibge": "1300144", "competencia": "2026-10", "gerado_em": "2026-10-16T22:00:00Z",
        "agente_versao": "1.3.0", "pec_versao": "5.5.28",
        "periodo": {"inicio": "2026-10-01", "fim": "2026-10-16"},
        "equipes": [{"ine": "0000123456", "nome": "ESF CENTRO", "tipo": "eSF"}],
        "acs": [{"chave": H1, "nome": "ACS UM", "cbo": "515105", "ine": "0000123456", "microareas": ["01"], "ativo": True},
                {"chave": H2, "nome": "ACS DOIS", "cbo": "515105", "ine": "0000123456", "microareas": ["02"], "ativo": False}],
        "microareas": [{"codigo": "01", "ine": "0000123456", "acs_chave": H1, "domicilios": 100, "familias": 90,
                        "individuos": 300, "familias_visitadas": 81}],
        "visitas": [{"data": "2026-10-03", "acs_chave": H1, "ine": "0000123456", "microarea": "01",
                     "total": 12, "realizadas": 10, "recusadas": 1, "ausentes": 1}],
        "grupos": [{"ine": "0000123456", "microarea": "01", "gestantes": 3, "criancas_menor_2": 5}],
        "criterios": {"visitas": "fichas de visita com desfecho realizada"},
    }
    base.update(extra)
    return LoteAcsIn(**base)


def _sessao(municipio):
    return SimpleNamespace(municipio_id=municipio.id, municipio=municipio.nome, administrador_geral=False, role="gestor")


@pytest.fixture
def apui(municipio, monkeypatch):
    municipio.situacao = "ativo"
    monkeypatch.setenv("ERSUS_SYNC_KEY_1300144", CHAVE)
    return municipio


# ── Contrato / LGPD ───────────────────────────────────────────────────────────

def test_contrato_recusa_dado_pessoal_fora_do_contrato():
    with pytest.raises(ValidationError):
        _lote(acs=[{"chave": H1, "nome": "X", "cpf": "12345678900"}])
    with pytest.raises(ValidationError):
        _lote(cidadaos=[{"nome": "Fulano"}])


def test_chave_do_acs_nao_pode_ser_cpf_ou_cns():
    with pytest.raises(ValidationError):
        _lote(acs=[{"chave": "12345678900", "nome": "X"}])


# ── Recepção ──────────────────────────────────────────────────────────────────

async def test_lote_aceito_e_reenvio_identico_nao_duplica(db_session, apui):
    r1 = await receber_lote_acs(_lote(), _req(), db_session, x_sync_key=CHAVE)
    assert r1["status"] == "aceito"
    r2 = await receber_lote_acs(_lote(gerado_em="2026-10-17T02:00:00Z"), _req(), db_session, x_sync_key=CHAVE)
    assert r2["status"] == "sem_alteracao"
    assert len((await db_session.execute(select(PecAcsLote))).scalars().all()) == 1
    assert len((await db_session.execute(select(PecAgenteExecucao))).scalars().all()) == 2


async def test_chave_invalida_e_rejeitada_e_registrada(db_session, apui):
    with pytest.raises(HTTPException) as e:
        await receber_lote_acs(_lote(), _req(), db_session, x_sync_key="errada")
    assert e.value.status_code == 401
    ex = (await db_session.execute(select(PecAgenteExecucao))).scalar_one()
    assert ex.status == "rejeitado"
    assert (await db_session.execute(select(PecAcsLote))).first() is None


async def test_chave_de_um_municipio_nao_vale_para_outro(db_session, apui, monkeypatch):
    outro = Municipio(nome="Outro", uf="AM", codigo_ibge="1399991", situacao="ativo")
    db_session.add(outro)
    await db_session.flush()
    monkeypatch.setenv("ERSUS_SYNC_KEY_1399991", "chave-do-outro")
    with pytest.raises(HTTPException) as e:
        await receber_lote_acs(_lote(ibge="1399991"), _req(), db_session, x_sync_key=CHAVE)
    assert e.value.status_code == 401


async def test_municipio_sem_chave_configurada_fica_desativado(db_session, municipio):
    municipio.situacao = "ativo"
    outro = Municipio(nome="Sem chave", uf="AM", codigo_ibge="1399992", situacao="ativo")
    db_session.add(outro)
    await db_session.flush()
    with pytest.raises(HTTPException) as e:
        await receber_lote_acs(_lote(ibge="1399992"), _req(), db_session, x_sync_key="qualquer")
    assert e.value.status_code == 503


async def test_esquema_registra_tabelas_sem_permissao(db_session, apui):
    r = await receber_esquema(EsquemaIn(ibge="1300144", agente_versao="1.3.0", pec_versao="5.5.28", tabelas={
        "tb_fat_visita_domiciliar": {"colunas": [{"nome": "nu_cns", "tipo": "text"}], "select_permitido": True},
        "tb_fat_cad_domiciliar": {"colunas": [], "select_permitido": False},
    }), _req(), db_session, x_sync_key=CHAVE)
    assert r["sem_permissao"] == ["tb_fat_cad_domiciliar"]


# ── Situação (Tempo Real / Capturar PEC) ──────────────────────────────────────

async def test_estados_da_integracao(db_session, apui):
    assert (await situacao_agente(db_session, apui.id))["estado"] == "sem_agente"
    await receber_heartbeat(HeartbeatIn(ibge="1300144", agente_versao="1.3.0", banco_pec_ok=True),
                            _req(), db_session, x_sync_key=CHAVE)
    assert (await situacao_agente(db_session, apui.id))["estado"] == "conectado"
    await receber_lote_acs(_lote(), _req(), db_session, x_sync_key=CHAVE)
    s = await situacao_agente(db_session, apui.id)
    assert s["estado"] == "atualizado" and s["ultimo_lote"]["competencia"] == "2026-10"
    assert "a cada" in s["modo"]   # nunca "tempo real": consulta periódica
    depois = datetime.utcnow() + timedelta(hours=9)
    assert (await situacao_agente(db_session, apui.id, agora=depois))["estado"] == "offline"
    await receber_heartbeat(HeartbeatIn(ibge="1300144", agente_versao="1.3.0", banco_pec_ok=False,
                                        erro="senha expirada"), _req(), db_session, x_sync_key=CHAVE)
    assert (await situacao_agente(db_session, apui.id))["estado"] == "erro"


# ── Painel ACS ────────────────────────────────────────────────────────────────

async def test_painel_sem_lote_nao_mostra_numeros(db_session, apui):
    d = await acs_router.dashboard(_sessao(apui), db_session)
    assert d["kpis"] is None and d["fonte"] == "aguardando_integracao_pec"
    lst = await acs_router.lista_acs(_sessao(apui), db_session)
    assert lst["acs"] == [] and lst["total"] == 0


async def test_painel_com_lote_usa_dados_do_pec(db_session, apui):
    await receber_lote_acs(_lote(), _req(), db_session, x_sync_key=CHAVE)
    d = await acs_router.dashboard(_sessao(apui), db_session)
    k = d["kpis"]
    assert d["fonte"] == "esus_pec"
    assert k["total_acs"] == 2 and k["acs_ativos"] == 1
    assert k["familias_cadastradas"] == 90 and k["pct_familias_visitadas"] == 90.0
    assert k["visitas_realizadas"] == 10 and k["gestantes_ativas"] == 3
    assert k["pct_cobertura"] is None          # fórmula ainda não validada → não inventa
    assert k["has_acompanhados"] is None       # não enviado → None, não zero


async def test_lote_de_um_municipio_nao_aparece_para_outro(db_session, apui):
    await receber_lote_acs(_lote(), _req(), db_session, x_sync_key=CHAVE)
    outro = Municipio(nome="Outro", uf="AM", codigo_ibge="1399991", situacao="ativo")
    db_session.add(outro)
    await db_session.flush()
    d = await acs_router.dashboard(_sessao(outro), db_session)
    assert d["kpis"] is None


def test_cadastro_nao_conta_como_visita():
    p = _lote(visitas=[]).model_dump(mode="json")
    k = pec_acs.kpis(p)
    assert k["visitas_realizadas"] == 0 and k["familias_cadastradas"] == 90


def test_visitas_por_periodo():
    p = _lote(visitas=[
        {"data": "2026-10-03", "total": 5, "realizadas": 4},
        {"data": "2026-10-20", "total": 7},
    ]).model_dump(mode="json")
    v = pec_acs.visitas_periodo(p, "2026-10-01", "2026-10-10", "10/2026")
    assert v["visitas_domiciliares"] == 4 and v["visitas_registradas"] == 5
    assert v["visitas_programadas"] is None   # sem planejamento → não inventa
