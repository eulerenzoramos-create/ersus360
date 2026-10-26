"""PEC de teste (versão de treinamento padrão do MS, credenciada no DF): endereço único por variável de
ambiente, igual para todos os municípios; só um GET sem login (nada é gravado no PEC)."""
import httpx
import pytest
from fastapi import HTTPException

from routers import esus_pec_teste as ept
from routers.auth import UserOut
from tenancy.contexto import MunicipioContexto, contexto_municipio

APUI = MunicipioContexto(id=1, uuid="a", ibge="1300144", nome="APUÍ", uf="AM")
B = MunicipioContexto(id=2, uuid="b", ibge="1399991", nome="Município Teste B", uf="AM")


def _usuario(ctx, role="gestor"):
    return UserOut(username="teste", nome="Teste", role=role, municipio_id=ctx.id, municipio_ibge=ctx.ibge)


@pytest.fixture
def chamadas(monkeypatch):
    monkeypatch.delenv("ESUS_PEC_TESTE_URL", raising=False)
    feitas: list[httpx.Request] = []

    def responder(req: httpx.Request) -> httpx.Response:
        feitas.append(req)
        return httpx.Response(200, text="<html>e-SUS APS</html>")

    real = httpx.AsyncClient
    monkeypatch.setattr(ept.httpx, "AsyncClient",
                        lambda **kw: real(transport=httpx.MockTransport(responder), **kw))
    return feitas


async def test_sem_variavel_nao_configurado_e_sem_rede(chamadas):
    with contexto_municipio(B):
        r = await ept.status_pec_teste(_usuario(B))
    assert r["status"] == "nao_configurado" and r["variavel"] == "ESUS_PEC_TESTE_URL"
    assert r["online"] is None and not chamadas


async def test_configurado_faz_so_um_get_sem_credencial(chamadas, monkeypatch):
    monkeypatch.setenv("ESUS_PEC_TESTE_URL", "https://pec-teste.exemplo.test/")
    with contexto_municipio(B):
        r = await ept.status_pec_teste(_usuario(B))
    assert r["status"] == "online" and r["http_status"] == 200
    assert r["url"] == "https://pec-teste.exemplo.test"
    assert len(chamadas) == 1 and chamadas[0].method == "GET"
    assert "authorization" not in chamadas[0].headers and "graphql" not in str(chamadas[0].url)


async def test_mesmo_pec_de_teste_para_todos_os_municipios(chamadas, monkeypatch):
    monkeypatch.setenv("ESUS_PEC_TESTE_URL", "https://pec-teste.exemplo.test")
    with contexto_municipio(APUI):
        a = await ept.status_pec_teste(_usuario(APUI))
    with contexto_municipio(B):
        b = await ept.status_pec_teste(_usuario(B))
    assert a["url"] == b["url"] == "https://pec-teste.exemplo.test"


async def test_url_invalida_nao_chama_rede(chamadas, monkeypatch):
    monkeypatch.setenv("ESUS_PEC_TESTE_URL", "file:///etc/passwd")
    with contexto_municipio(B):
        r = await ept.status_pec_teste(_usuario(B))
    assert r["status"] == "url_invalida" and not chamadas


async def test_perfil_sem_permissao(chamadas):
    with contexto_municipio(APUI), pytest.raises(HTTPException) as e:
        await ept.status_pec_teste(_usuario(APUI, role="acs"))
    assert e.value.status_code == 403


@pytest.mark.parametrize("url", ["http://localhost:8080", "http://127.0.0.1:8080/", "http://[::1]:8080"])
async def test_pec_no_computador_local_nao_e_sondado_pelo_servidor(chamadas, monkeypatch, url):
    monkeypatch.setenv("ESUS_PEC_TESTE_URL", url)
    with contexto_municipio(APUI):
        r = await ept.status_pec_teste(_usuario(APUI))
    assert r["status"] == "local" and r["url"] and not chamadas
