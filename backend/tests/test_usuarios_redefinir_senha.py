"""Redefinir senha de usuário do município (tela Gestão de Usuários).

Reaproveita o cenário multi-município de test_isolamento_tenant: só o administrador do
próprio município (ou o administrador-geral) redefine; perfil global só pelo administrador-geral.
"""
from __future__ import annotations

from sqlalchemy import select

from models.usuario import Perfil, Usuario
from test_isolamento_tenant import SENHA, SENHA_ADMIN, _h, _login, _token, ambiente  # noqa: F401

NOVA = "nova-senha-teste-456"  # dado-ficticio


async def _id(amb, email: str) -> int:
    async with amb["Session"]() as db:
        return (await db.execute(select(Usuario.id).where(Usuario.email == email))).scalar_one()


async def test_admin_do_municipio_redefine_senha(ambiente):  # noqa: F811
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    uid = await _id(ambiente, "ana.consulta@apui.gov.br")
    r = await c.put(f"/api/usuarios/{uid}/senha", json={"senha_nova": NOVA}, headers=_h(tok))
    assert r.status_code == 200, r.text
    assert (await _login(c, "ana.consulta@apui.gov.br", NOVA)).status_code == 200
    assert (await _login(c, "ana.consulta@apui.gov.br", SENHA)).status_code == 401


async def test_senha_curta_recusada(ambiente):  # noqa: F811
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    uid = await _id(ambiente, "ana.consulta@apui.gov.br")
    r = await c.put(f"/api/usuarios/{uid}/senha", json={"senha_nova": "curta"}, headers=_h(tok))
    assert r.status_code == 422


async def test_outro_municipio_nao_redefine(ambiente):  # noqa: F811
    c = ambiente["client"]
    tok = await _token(c, "gestor.b@teste.gov.br")
    uid = await _id(ambiente, "ana.consulta@apui.gov.br")
    r = await c.put(f"/api/usuarios/{uid}/senha", json={"senha_nova": NOVA}, headers=_h(tok))
    assert r.status_code in (403, 404)
    assert (await _login(c, "ana.consulta@apui.gov.br", SENHA)).status_code == 200


async def test_perfil_sem_gestao_nao_redefine(ambiente):  # noqa: F811
    c = ambiente["client"]
    tok = await _token(c, "ana.consulta@apui.gov.br")
    uid = await _id(ambiente, "gestor.apui@teste.gov.br")
    r = await c.put(f"/api/usuarios/{uid}/senha", json={"senha_nova": NOVA}, headers=_h(tok))
    assert r.status_code == 403


async def test_alterar_minha_senha(ambiente):  # noqa: F811
    c = ambiente["client"]
    tok = await _token(c, "ana.consulta@apui.gov.br")
    url = "/api/auth/minha-senha"
    assert (await c.post(url, json={"senha_atual": "errada-123", "senha_nova": NOVA}, headers=_h(tok))).status_code == 400
    assert (await c.post(url, json={"senha_atual": SENHA, "senha_nova": "curta"}, headers=_h(tok))).status_code == 422
    assert (await c.post(url, json={"senha_atual": SENHA, "senha_nova": SENHA}, headers=_h(tok))).status_code == 422
    r = await c.post(url, json={"senha_atual": SENHA, "senha_nova": NOVA}, headers=_h(tok))
    assert r.status_code == 200, r.text
    assert (await _login(c, "ana.consulta@apui.gov.br", NOVA)).status_code == 200
    assert (await _login(c, "ana.consulta@apui.gov.br", SENHA)).status_code == 401
    # sem login não troca
    assert (await c.post(url, json={"senha_atual": NOVA, "senha_nova": "outra-senha-789"})).status_code == 401


async def test_conta_de_sistema_nao_troca_pela_tela(ambiente):  # noqa: F811
    c = ambiente["client"]
    tok = await _token(c, "euler", SENHA_ADMIN)
    r = await c.post("/api/auth/minha-senha", json={"senha_atual": SENHA_ADMIN, "senha_nova": NOVA}, headers=_h(tok))
    assert r.status_code == 409


async def test_perfil_global_so_pelo_admin_geral(ambiente):  # noqa: F811
    async with ambiente["Session"]() as db:
        alvo = (await db.execute(select(Usuario).where(Usuario.email == "ana.consulta@apui.gov.br"))).scalar_one()
        alvo.perfil = Perfil.ADMINISTRADOR_GERAL
        await db.commit()
        uid = alvo.id
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.put(f"/api/usuarios/{uid}/senha", json={"senha_nova": NOVA}, headers=_h(tok))
    assert r.status_code == 403
