"""MUNICÍPIO TREINAMENTO (PEC MS, IBGE fictício 5399999): recebe só os dados fictícios do PEC de
treinamento do Ministério, e nada dele chega a Apuí — nem pelo servidor, nem pelo agente local."""
import importlib.util
import shutil
from pathlib import Path

import pytest
from fastapi import HTTPException

from models.municipio import Municipio
from routers import acs as acs_router
from routers import pec_sync as ps
from routers.pec_agente import HeartbeatIn, receber_heartbeat, receber_lote_acs, situacao_agente
from tenancy.contexto import IBGE_LEGADO, IBGE_TREINAMENTO
from tests.test_isolamento_tenant import ambiente  # noqa: F401 (fixture)
from tests.test_pec_agente import CHAVE, _lote, _req, _sessao, apui  # noqa: F401 (fixture)

CHAVE_TREINO = "chave-treinamento"  # dado-ficticio
AGENTE = Path(__file__).resolve().parents[2] / "pec_sync_agent" / "pec_sync.py"


@pytest.fixture
async def treino(db_session, apui, monkeypatch):
    m = Municipio(nome="MUNICÍPIO TREINAMENTO (PEC MS)", uf="DF", codigo_ibge=IBGE_TREINAMENTO, situacao="ativo")
    db_session.add(m)
    await db_session.flush()
    monkeypatch.setenv(f"ERSUS_SYNC_KEY_{IBGE_TREINAMENTO}", CHAVE_TREINO)
    return m


def test_codigo_de_treinamento_nao_e_municipio_real():
    # Prefixo 53 (DF) — o único município do DF no IBGE é 5300108
    assert IBGE_TREINAMENTO == "5399999" and IBGE_TREINAMENTO != IBGE_LEGADO


async def test_dados_do_treinamento_nao_aparecem_em_apui(db_session, apui, treino):
    await receber_heartbeat(HeartbeatIn(ibge=IBGE_TREINAMENTO, agente_versao="1.4.0", banco_pec_ok=True),
                            _req(), db_session, x_sync_key=CHAVE_TREINO)
    await receber_lote_acs(_lote(ibge=IBGE_TREINAMENTO), _req(), db_session, x_sync_key=CHAVE_TREINO)
    assert (await acs_router.dashboard(_sessao(treino), db_session, ano=0, esf="", competencia=""))["kpis"]
    assert (await acs_router.dashboard(_sessao(apui), db_session, ano=0, esf="", competencia=""))["kpis"] is None
    assert (await situacao_agente(db_session, apui.id))["estado"] == "sem_agente"


async def test_chave_do_treinamento_nao_envia_como_apui(db_session, apui, treino):
    with pytest.raises(HTTPException) as e:
        await receber_lote_acs(_lote(), _req(), db_session, x_sync_key=CHAVE_TREINO)
    assert e.value.status_code == 401


async def test_previa_de_indicadores_recusa_o_treinamento(monkeypatch):
    monkeypatch.setenv("ERSUS_SYNC_KEY", CHAVE)
    payload = ps.SyncPayload(competencia="2026-10", ibge=IBGE_TREINAMENTO, timestamp="2026-10-26T00:00:00", equipes={})
    with pytest.raises(HTTPException) as e:
        await ps.receber_sync(payload, x_sync_key=CHAVE)
    assert e.value.status_code == 400


def _carregar_agente(tmp_path, monkeypatch, **env):
    for k in ("ERSUS_IBGE", "PEC_TREINAMENTO"):
        monkeypatch.delenv(k, raising=False)
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    copia = tmp_path / "pec_sync.py"
    shutil.copy(AGENTE, copia)
    spec = importlib.util.spec_from_file_location("pec_sync_treino", copia)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.mark.parametrize("env", [
    {"PEC_TREINAMENTO": "1"},                                 # treinamento apontando para Apuí (padrão)
    {"PEC_TREINAMENTO": "1", "ERSUS_IBGE": IBGE_LEGADO},
    {"ERSUS_IBGE": IBGE_TREINAMENTO},                         # município de treino sem marcar o PEC de treino
])
def test_agente_trava_destino_errado(tmp_path, monkeypatch, env):
    agente = _carregar_agente(tmp_path, monkeypatch, **env)
    with pytest.raises(SystemExit):
        agente.conferir_destino()


def test_agente_de_treinamento_envia_so_para_o_municipio_de_treino(tmp_path, monkeypatch):
    agente = _carregar_agente(tmp_path, monkeypatch, PEC_TREINAMENTO="1", ERSUS_IBGE=IBGE_TREINAMENTO,
                              ERSUS_SYNC_KEY=CHAVE_TREINO)
    agente.conferir_destino()
    enviados = []
    from tests.test_pec_inconsistencias import _Conn
    monkeypatch.setattr(agente, "conectar_pec", lambda: type("C", (_Conn,), {"close": lambda self: None})())
    monkeypatch.setattr(agente.requests, "post", lambda url, json=None, headers=None, timeout=None:
                        enviados.append((url, json)) or type("R", (), {"status_code": 200, "text": "ok"})())
    agente.sincronizar()
    # sinal de vida + inconsistências (por município); nada em /api/pec/sync (prévia só de Apuí)
    assert [u.rsplit("/api/", 1)[1] for u, _ in enviados] == ["pec-agente/heartbeat", "pec-agente/inconsistencias"]
    assert all(corpo["ibge"] == IBGE_TREINAMENTO for _, corpo in enviados)


async def test_painel_acs_liberado_para_outro_municipio_sem_dados_de_apui(ambiente, monkeypatch):
    """/api/acs/ saiu de ROTAS_SO_APUI: outro município abre o Painel ACS e vê só o próprio lote."""
    from tests.test_isolamento_tenant import _h, _token
    c = ambiente["client"]
    monkeypatch.setenv("ERSUS_SYNC_KEY_1300144", CHAVE)
    r = await c.post("/api/pec-agente/acs", json=_lote().model_dump(mode="json"), headers={"X-Sync-Key": CHAVE})
    assert r.status_code == 200, r.text
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    for rota in ("/api/acs/dashboard", "/api/acs/lista", "/api/acs/esus/status", "/api/acs/esus/tempo-real"):
        assert (await c.get(rota, headers=_h(tok_b))).status_code == 200, rota
    assert (await c.get("/api/acs/dashboard", headers=_h(tok_b))).json()["kpis"] is None
    assert (await c.get("/api/acs/lista", headers=_h(tok_b))).json()["acs"] == []
    tok_a = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.get("/api/acs/dashboard", headers=_h(tok_a))).json()["kpis"]["total_acs"] == 2
