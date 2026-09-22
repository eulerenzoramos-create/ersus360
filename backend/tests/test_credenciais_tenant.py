"""Credenciais de integração por município: nunca compartilhadas nem expostas."""
from __future__ import annotations

import httpx
import pytest

from config import settings
from tenancy.contexto import MunicipioContexto, contexto_municipio
from tenancy.credenciais import configurado, credencial, status_municipio
from tests.test_isolamento_tenant import SENHA_ADMIN, _h, _token, ambiente  # noqa: F401 (fixture)

APUI = MunicipioContexto(id=1, uuid="a", ibge="1300144", nome="APUÍ", uf="AM")
B = MunicipioContexto(id=2, uuid="b", ibge="1399991", nome="Município Teste B", uf="AM")


@pytest.fixture
def envs(monkeypatch):
    for var in ("SIAPS_CPF", "SIAPS_SENHA", "SIAPS_CPF_1399991", "SIAPS_SENHA_1399991",
                "LEDI_PEC_URL", "LEDI_USUARIO", "LEDI_SENHA", "FNS_API_CPF", "FNS_API_SENHA"):
        monkeypatch.delenv(var, raising=False)
    monkeypatch.setattr(settings, "FNS_API_CPF", "")
    monkeypatch.setattr(settings, "FNS_API_SENHA", "")
    monkeypatch.setattr(settings, "SIAPS_CPF", "")
    monkeypatch.setattr(settings, "SIAPS_SENHA", "")
    return monkeypatch


def test_variaveis_sem_sufixo_valem_somente_para_apui(envs):
    envs.setenv("SIAPS_CPF", "11111111111")
    envs.setenv("SIAPS_SENHA", "senha-apui")
    assert credencial("SIAPS", "CPF", APUI) == "11111111111"
    assert credencial("SIAPS", "CPF", B) == ""          # nunca herda a de Apuí
    assert configurado("SIAPS", APUI) and not configurado("SIAPS", B)

    envs.setenv("SIAPS_CPF_1399991", "22222222222")
    envs.setenv("SIAPS_SENHA_1399991", "senha-b")
    assert credencial("SIAPS", "CPF", B) == "22222222222"
    assert credencial("SIAPS", "CPF", APUI) == "11111111111"  # Apuí não vê a de B
    assert configurado("SIAPS", B)


def test_status_nao_expoe_valores(envs):
    envs.setenv("SIAPS_CPF_1399991", "22222222222")
    texto = repr(status_municipio(B))
    assert "22222222222" not in texto
    assert "SIAPS_CPF_1399991" in texto


async def test_token_fns_separado_por_municipio(envs):
    from services import fns_api_service as fns

    envs.setattr(settings, "FNS_API_CPF", "11111111111")   # credencial legada de Apuí
    envs.setattr(settings, "FNS_API_SENHA", "senha-apui")
    enviados: list[str] = []

    async def falso(self, request, *a, **k):
        enviados.append(request.content.decode())
        return httpx.Response(200, request=request, json={"access_token": "TOKEN-APUI"})

    envs.setattr(httpx.AsyncClient, "send", falso)
    fns._tokens.clear()
    with contexto_municipio(APUI):
        assert await fns._autenticar() == "TOKEN-APUI"
    with contexto_municipio(B):
        assert await fns._autenticar() is None     # sem credencial própria e sem reuso do token
    assert len(enviados) == 1 and "11111111111" in enviados[0]
    fns._tokens.clear()


async def test_gateway_nao_mostra_pec_de_outro_municipio(ambiente, envs):
    from routers import gateway_controle

    async def cfg_padrao(municipio_id):  # o router lê a config com sessão própria
        return {"pausado": False, "modo_diagnostico": True, "rnds_ativo": False, "ledi_ativo": False}

    envs.setattr(gateway_controle, "_get_ou_criar_config", cfg_padrao)
    c = ambiente["client"]
    envs.setenv("LEDI_PEC_URL", "https://pec-apui.exemplo.gov.br")
    envs.setenv("LEDI_USUARIO", "u")
    envs.setenv("LEDI_SENHA", "s")
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    r = await c.get("/api/gateway/status", headers=_h(tok_b))
    assert r.status_code == 200 and "pec-apui" not in r.text
    ledi = next(s for s in r.json()["sistemas"] if s["sistema"] == "LEDI")
    assert ledi["configurado"] is False

    tok_a = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.get("/api/gateway/status", headers=_h(tok_a))
    assert "pec-apui" in r.text


async def test_painel_de_credenciais_so_admin_geral_e_sem_valores(ambiente, envs):
    c, ids = ambiente["client"], ambiente["ids"]
    envs.setenv("SIAPS_CPF_1399991", "22222222222")
    admin = await _token(c, "euler", SENHA_ADMIN)
    r = await c.get(f"/api/admin-geral/municipios/{ids['b_uuid']}/credenciais", headers=_h(admin))
    assert r.status_code == 200 and "22222222222" not in r.text
    siaps = next(s for s in r.json()["sistemas"] if s["sistema"] == "SIAPS")
    assert siaps["campos"]["CPF"] == {"variavel": "SIAPS_CPF_1399991", "configurada": True, "origem": "municipal"}

    gestor = await _token(c, "gestor.b@teste.gov.br")
    r = await c.get(f"/api/admin-geral/municipios/{ids['b_uuid']}/credenciais", headers=_h(gestor))
    assert r.status_code == 403
