"""O agente local precisa enviar o sinal de vida que o Painel ACS espera (/api/pec-agente/heartbeat):
sem ele o painel fica eternamente em "Aguardando agente"."""
import importlib.util
import shutil
from pathlib import Path

import pytest

from routers.pec_agente import HeartbeatIn

AGENTE = Path(__file__).resolve().parents[2] / "pec_sync_agent" / "pec_sync.py"


@pytest.fixture
def agente(tmp_path, monkeypatch):
    """Carrega uma CÓPIA do agente numa pasta temporária (o módulo cria pec_sync.log ao lado de si)."""
    monkeypatch.setenv("ERSUS_SYNC_KEY", "chave-secreta-123")
    monkeypatch.setenv("PEC_DB_PASS", "senha-do-banco-xyz")
    copia = tmp_path / "pec_sync.py"
    shutil.copy(AGENTE, copia)
    spec = importlib.util.spec_from_file_location("pec_sync_copia", copia)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class _Resp:
    def __init__(self, status=200, text="ok"):
        self.status_code, self.text = status, text


def test_heartbeat_ok_segue_o_contrato_do_backend(agente, monkeypatch):
    enviados = []
    monkeypatch.setattr(agente.requests, "post", lambda url, json=None, headers=None, timeout=None:
                        enviados.append((url, json, headers)) or _Resp())
    assert agente.enviar_heartbeat(True) is True
    url, corpo, cab = enviados[0]
    assert url.endswith("/api/pec-agente/heartbeat") and cab == {"X-Sync-Key": "chave-secreta-123"}
    h = HeartbeatIn(**corpo)                                  # extra="forbid": nada além do contrato
    assert h.banco_pec_ok is True and h.erro is None and h.ibge == "1300144" and h.agente_versao == agente.VERSAO_AGENTE


def test_heartbeat_de_erro_nao_vaza_senha_nem_chave(agente, monkeypatch):
    enviados = []
    monkeypatch.setattr(agente.requests, "post", lambda url, json=None, headers=None, timeout=None:
                        enviados.append(json) or _Resp())
    agente.enviar_heartbeat(False, "FATAL: password authentication failed for user esus (senha-do-banco-xyz)\n chave-secreta-123")
    h = HeartbeatIn(**enviados[0])
    assert h.banco_pec_ok is False
    assert "senha-do-banco-xyz" not in h.erro and "chave-secreta-123" not in h.erro and "\n" not in h.erro
    assert "password authentication failed" in h.erro


def test_heartbeat_nunca_derruba_a_rodada(agente, monkeypatch):
    def falha(*a, **k):
        raise agente.requests.ConnectionError("sem internet")
    monkeypatch.setattr(agente.requests, "post", falha)
    assert agente.enviar_heartbeat(True) is False
    monkeypatch.setattr(agente.requests, "post", lambda *a, **k: _Resp(401, "Chave de sincronização inválida."))
    assert agente.enviar_heartbeat(True) is False


def test_sem_chave_nao_tenta_enviar(agente, monkeypatch):
    monkeypatch.setattr(agente, "ERSUS_KEY", "")
    chamou = []
    monkeypatch.setattr(agente.requests, "post", lambda *a, **k: chamou.append(1) or _Resp())
    assert agente.enviar_heartbeat(True) is False and not chamou


def test_falha_de_conexao_com_o_pec_envia_heartbeat_de_erro(agente, monkeypatch):
    enviados = []
    monkeypatch.setattr(agente, "enviar_heartbeat", lambda ok, erro=None: enviados.append((ok, erro)))
    def sem_banco():
        raise RuntimeError("could not connect to server (senha-do-banco-xyz)")
    monkeypatch.setattr(agente, "conectar_pec", sem_banco)
    agente.sincronizar()
    assert enviados and enviados[0][0] is False and "senha-do-banco-xyz" not in enviados[0][1]
