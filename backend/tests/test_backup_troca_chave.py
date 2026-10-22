"""Troca da BACKUP_CHAVE / SECRET_KEY sem perder a leitura dos backups antigos (aviso de segurança Railway, 21/10/2026)."""
import io
import zipfile

import pytest
from cryptography.fernet import Fernet

import tenancy.backup as bk
from config import settings


def _arquivo_cifrado(tmp_path, fernet: Fernet):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("manifest.json", "{}")
    p = tmp_path / "antigo.ersusbkp"
    p.write_bytes(fernet.encrypt(buf.getvalue()))
    return p


@pytest.fixture
def limpo(monkeypatch):
    for v in ("BACKUP_CHAVE", "BACKUP_CHAVES_ANTERIORES", "SECRET_KEY_ANTERIOR"):
        monkeypatch.delenv(v, raising=False)
    return monkeypatch


def test_troca_de_backup_chave_com_chave_anterior(tmp_path, limpo):
    antiga, nova = Fernet.generate_key().decode(), Fernet.generate_key().decode()
    p = _arquivo_cifrado(tmp_path, Fernet(antiga))
    limpo.setenv("BACKUP_CHAVE", nova)
    with pytest.raises(bk.ErroBackup):
        bk._abrir(p)
    limpo.setenv("BACKUP_CHAVES_ANTERIORES", f"invalida, {antiga}")
    assert bk._abrir(p).read("manifest.json") == b"{}"
    assert len(bk._chaves_anteriores()) == 1  # a inválida é ignorada


def test_troca_de_secret_key_sem_backup_chave(tmp_path, limpo):
    secret_antiga = "chave-antiga-de-teste"
    p = _arquivo_cifrado(tmp_path, bk._derivada(secret_antiga))
    limpo.setattr(settings, "SECRET_KEY", "chave-nova-de-teste")
    with pytest.raises(bk.ErroBackup):
        bk._abrir(p)
    limpo.setenv("SECRET_KEY_ANTERIOR", secret_antiga)
    assert bk._abrir(p).read("manifest.json") == b"{}"


def test_backup_feito_antes_da_chave_dedicada_continua_legivel(tmp_path, limpo):
    p = _arquivo_cifrado(tmp_path, bk._derivada(settings.SECRET_KEY))
    limpo.setenv("BACKUP_CHAVE", Fernet.generate_key().decode())
    assert bk._abrir(p).read("manifest.json") == b"{}"


def test_gravacao_usa_sempre_a_chave_atual(tmp_path, limpo):
    antiga, nova = Fernet.generate_key().decode(), Fernet.generate_key().decode()
    limpo.setenv("BACKUP_CHAVE", nova)
    limpo.setenv("BACKUP_CHAVES_ANTERIORES", antiga)
    dado = bk._fernet().encrypt(b"x")
    assert Fernet(nova).decrypt(dado) == b"x"
