"""Testes do verificador. Valores sensíveis são gerados em tempo de execução (nenhum fica escrito aqui)."""
import importlib.util
from pathlib import Path

import pytest

_sp = importlib.util.spec_from_file_location("verificador", Path(__file__).with_name("verificar_dados_sensiveis.py"))
v = importlib.util.module_from_spec(_sp)
_sp.loader.exec_module(v)


def _cpf() -> str:
    b = [5, 2, 9, 9, 8, 2, 2, 4, 7]
    for n in (9, 10):
        b.append(sum(b[i] * (n + 1 - i) for i in range(n)) * 10 % 11 % 10)
    return "".join(map(str, b))


def _cns() -> str:
    return next(d for x in range(10**4) if v.cns_valido(d := "89876543210" + f"{x:04d}"))


CPF = _cpf()

DEVE_PEGAR = [
    ('ANTHROPIC_API_KEY="sk-ant-api03-' + "Ab1" * 12 + '"', "x.py"),  # dado-ficticio
    ("FNS_API_SENHA=" + "Xk9#mQ2!pLz", ".env"),
    ("DATABASE_URL=postgresql://postgres:" + "Hq7Kd92mZp" + "@db.railway.internal:5432/railway", "a.py"),
    (f'cpf = "{CPF[:3]}.{CPF[3:6]}.{CPF[6:9]}-{CPF[9:]}"', "a.ts"),
    ("FNS_API_CPF=" + CPF, ".env.prod.example"),
    ('coCns: "' + _cns() + '"', "a.ts"),
    ('t="eyJhbGciOiJIUzI1NiJ9xx.eyJzdWIiOiJldWxlciJ9xxxxx.SflKxwRJSMeKKF2QT4fwpMeJf36"', "a.ts"),  # dado-ficticio
    ("-----BEGIN RSA " + "PRIVATE KEY-----", "k.pem"),
    ('token = "ghp_' + "a1B2" * 9 + '"', "a.py"),
]

NAO_DEVE_PEGAR = [
    'const K_TOKEN = "ersus_token";',
    'URL_TOKEN = "https://acesso.saude.gov.br/token"',
    'ibge = "1300144"; ine = "0001774026"; cnes = "9934448"',
    "SECRET_KEY=gere-com-openssl-rand-hex-32",
    "DB_PASSWORD=ESCOLHA_UMA_SENHA_FORTE",
    "ANTHROPIC_API_KEY=sk-ant-...",
    "SENHA = os.getenv(\"SENHA\", \"\")",
    'coCns: "700000000000005"',
    "cpf = '00000000000'",
]


@pytest.mark.parametrize("texto,caminho", DEVE_PEGAR)
def test_detecta_segredo_ou_dado_pessoal(texto, caminho):
    assert v.achados_na_linha(texto, caminho)


@pytest.mark.parametrize("texto", NAO_DEVE_PEGAR)
def test_nao_acusa_placeholder_nem_identificador_publico(texto):
    assert v.achados_na_linha(texto, "a.py") == []


def test_marca_dado_ficticio_libera_a_linha():
    assert v.achados_na_linha(f'cpf = "{CPF}"  # dado-ficticio', "t.py") == []


def test_valores_aparecem_mascarados():
    msg = " ".join(v.achados_na_linha(f'cpf = "{CPF}"', "a.py"))
    assert CPF not in msg and "***" in msg


def test_env_real_bloqueado_e_env_publico_vite_permitido(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    (tmp_path / ".env").write_text("SECRET_KEY=abc\n")
    (tmp_path / ".env.production").write_text("VITE_API_URL=https://exemplo.gov.br\n")
    assert v.env_proibido(".env")
    assert not v.env_proibido(".env.production")
    assert not v.env_proibido(".env.example")
