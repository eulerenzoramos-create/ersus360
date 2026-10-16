"""InvestSUS: o login por CPF/senha tem prioridade sobre cookie/token copiados (que expiram)."""
import services.investsus_scraper as sc

CNPJ = "12834320000126"


def _instalar(monkeypatch, login_ok=True):
    vistos = []

    async def autenticar(client, cpf, senha):
        if not login_ok:
            raise RuntimeError("Credenciais rejeitadas")
        return "tok-novo"

    async def buscar(client, cnpj, ano):
        vistos.append((client.headers.get("Authorization"), client.headers.get("Cookie")))
        return [], None

    monkeypatch.setattr(sc, "_autenticar", autenticar)
    monkeypatch.setattr(sc, "_buscar_propostas_paginado", buscar)
    return vistos


async def test_cpf_senha_prevalece_sobre_cookie_antigo(monkeypatch):
    vistos = _instalar(monkeypatch)
    r = await sc.sincronizar_investsus(CNPJ, "1300144", {"COOKIE": "sessao=velha", "CPF": "123", "SENHA": "x"})
    assert vistos[0] == ("Bearer tok-novo", None)
    assert r["erros"] == []


async def test_login_falhou_usa_cookie_como_alternativa(monkeypatch):
    vistos = _instalar(monkeypatch, login_ok=False)
    r = await sc.sincronizar_investsus(CNPJ, "1300144", {"COOKIE": "sessao=x", "CPF": "123", "SENHA": "x"})
    assert vistos[0] == (None, "sessao=x")
    assert r["erros"][0]["endpoint"] == "auth"


async def test_login_falhou_sem_alternativa_para(monkeypatch):
    vistos = _instalar(monkeypatch, login_ok=False)
    r = await sc.sincronizar_investsus(CNPJ, "1300144", {"CPF": "123", "SENHA": "x"})
    assert vistos == [] and r["erros"][0]["erro"] == "Credenciais rejeitadas"


async def test_sem_credencial_nenhuma(monkeypatch):
    vistos = _instalar(monkeypatch)
    r = await sc.sincronizar_investsus(CNPJ, "1300144", {})
    assert vistos == [] and "não configuradas" in r["erros"][0]["erro"]
