"""Chave do agente PEC: falha fechada (sem chave = sincronização desativada), comparação em tempo
constante e rota pública de status que nunca revela o valor."""
import pytest
from fastapi import HTTPException

from routers import pec_sync as ps


def _payload():
    return ps.SyncPayload(competencia="2026-09", ibge="1300144", timestamp="2026-10-02T00:00:00", equipes={})


async def test_sem_chave_configurada_sincronizacao_desativada(monkeypatch):
    monkeypatch.delenv("ERSUS_SYNC_KEY", raising=False)
    with pytest.raises(HTTPException) as e:
        await ps.receber_sync(_payload(), x_sync_key="qualquer-coisa")
    assert e.value.status_code == 503


async def test_chave_errada_e_recusada(monkeypatch):
    monkeypatch.setenv("ERSUS_SYNC_KEY", "chave-certa")
    with pytest.raises(HTTPException) as e:
        await ps.receber_sync(_payload(), x_sync_key="chave-errada")
    assert e.value.status_code == 401


async def test_status_publico_nunca_expoe_a_chave(monkeypatch):
    monkeypatch.setattr(ps, "_listar_competencias", lambda: [])
    monkeypatch.delenv("ERSUS_SYNC_KEY", raising=False)
    sem = await ps.status_sync()
    assert "ersus-" not in str(sem) and "NÃO definida" in sem["sync_key_info"]
    monkeypatch.setenv("ERSUS_SYNC_KEY", "segredo-xyz-123")
    com = await ps.status_sync()
    assert "segredo-xyz-123" not in str(com)
