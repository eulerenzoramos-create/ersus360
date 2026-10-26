"""Servidor de teste do e-SUS PEC: endereço só por variável de ambiente do município, só um GET sem
login (nada é gravado no PEC) e nunca herda o endereço de Apuí."""
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
    for var in ("ESUS_PEC_TESTE_URL", "ESUS_PEC_TESTE_URL_1300144", "ESUS_PEC_TESTE_URL_1399991"):
        monkeypatch.delenv(var, raising=False)
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
    assert r["status"] == "nao_configurado" and r["variavel"] == "ESUS_PEC_TESTE_URL_1399991"
    assert r["online"] is None and not chamadas


async def test_configurado_faz_so_um_get_sem_credencial(chamadas, monkeypatch):
    monkeypatch.setenv("ESUS_PEC_TESTE_URL_1399991", "https://pec-teste.exemplo.test/")
    with contexto_municipio(B):
        r = await ept.status_pec_teste(_usuario(B))
    assert r["status"] == "online" and r["http_status"] == 200
    assert r["url"] == "https://pec-teste.exemplo.test"
    assert len(chamadas) == 1 and chamadas[0].method == "GET"
    assert "authorization" not in chamadas[0].headers and "graphql" not in str(chamadas[0].url)


async def test_endereco_de_apui_nao_vale_para_outro_municipio(chamadas, monkeypatch):
    monkeypatch.setenv("ESUS_PEC_TESTE_URL", "https://pec-teste-apui.exemplo.test")
    with contexto_municipio(B):
        r = await ept.status_pec_teste(_usuario(B))
    assert r["status"] == "nao_configurado" and not chamadas


async def test_url_invalida_nao_chama_rede(chamadas, monkeypatch):
    monkeypatch.setenv("ESUS_PEC_TESTE_URL_1399991", "file:///etc/passwd")
    with contexto_municipio(B):
        r = await ept.status_pec_teste(_usuario(B))
    assert r["status"] == "url_invalida" and not chamadas


async def test_perfil_sem_permissao(chamadas):
    with contexto_municipio(APUI), pytest.raises(HTTPException) as e:
        await ept.status_pec_teste(_usuario(APUI, role="acs"))
    assert e.value.status_code == 403
