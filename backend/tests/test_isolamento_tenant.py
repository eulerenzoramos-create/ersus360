"""
Testes obrigatórios de isolamento multi-tenant (especificação ERSUS360).

Cenário: Apuí/AM (piloto, ativo), "Município Teste B" (ativo) e
"Município Teste C" (suspenso). Qualquer acesso cruzado reprova a entrega.

Os testes exercitam o app real (main.app) com o guard global ativo; só o banco
é substituído por SQLite em memória.
"""
from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import main
import models  # noqa: F401
from config import settings
from database import Base, get_db
from models.documento import Documento
from models.municipio import Municipio
from models.usuario import AuditLog, Perfil, Usuario, UsuarioMunicipio
from routers import auth as auth_mod
from routers import documentos as documentos_mod
from tenancy.migracoes import migrar_multitenant

SENHA = "senha-forte-123"
SENHA_ADMIN = "admin-geral-teste"


@pytest_asyncio.fixture
async def ambiente(tmp_path, monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool,
                                 connect_args={"check_same_thread": False})
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await migrar_multitenant(engine)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    hash_ = auth_mod.pwd_ctx.hash(SENHA)
    async with Session() as db:
        apui = Municipio(nome="APUÍ", uf="AM", codigo_ibge="1300144", situacao="ativo")
        mun_b = Municipio(nome="Município Teste B", uf="AM", codigo_ibge="1399991", situacao="ativo")
        mun_c = Municipio(nome="Município Teste C", uf="AM", codigo_ibge="1399992", situacao="suspenso")
        db.add_all([apui, mun_b, mun_c])
        await db.flush()
        usuarios = {
            "gestor.apui@teste.gov.br": (apui, Perfil.ADMIN, True),
            "ana.consulta@apui.gov.br": (apui, Perfil.CONSULTA, True),
            "gestor.b@teste.gov.br": (mun_b, Perfil.ADMIN, True),
            "ana.consulta@b.gov.br": (mun_b, Perfil.CONSULTA, True),
            "gestor.c@teste.gov.br": (mun_c, Perfil.ADMIN, True),
            "suspenso@apui.gov.br": (apui, Perfil.CONSULTA, False),
            "multi@teste.gov.br": (apui, Perfil.ADMIN, True),
        }
        objs = {}
        for email, (mun, perfil, ativo) in usuarios.items():
            u = Usuario(municipio_id=mun.id, nome=email.split("@")[0], email=email,
                        senha_hash=hash_, perfil=perfil, ativo=ativo)
            db.add(u)
            objs[email] = u
        await db.flush()
        db.add(UsuarioMunicipio(usuario_id=objs["multi@teste.gov.br"].id, municipio_id=mun_b.id,
                                concedido_por="euler"))
        db.add_all([
            Documento(municipio_id=apui.id, titulo="Relatório Apuí sigiloso", tipo="Relatório",
                      arquivo=str(tmp_path / "apui.pdf")),
            Documento(municipio_id=mun_b.id, titulo="Relatório B sigiloso", tipo="Relatório",
                      arquivo=str(tmp_path / "b.pdf")),
        ])
        await db.commit()
        ids = {"apui": apui.id, "b": mun_b.id, "c": mun_c.id,
               "apui_uuid": apui.uuid, "b_uuid": mun_b.uuid, "c_uuid": mun_c.uuid}
        docs = {d.municipio_id: d.id for d in (await db.execute(select(Documento))).scalars()}
        ids["doc_apui"], ids["doc_b"] = docs[apui.id], docs[mun_b.id]
    (tmp_path / "apui.pdf").write_bytes(b"%PDF apui")
    (tmp_path / "b.pdf").write_bytes(b"%PDF b")

    async def _get_db():
        async with Session() as s:
            yield s

    monkeypatch.setitem(auth_mod.USERS_BOOTSTRAP["euler"], "hashed_password",
                        auth_mod.pwd_ctx.hash(SENHA_ADMIN))
    monkeypatch.setattr(documentos_mod, "UPLOAD_DIR", str(tmp_path / "uploads"))
    main.app.dependency_overrides[get_db] = _get_db
    client = AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test")
    yield {"client": client, "Session": Session, "ids": ids, "tmp": tmp_path}
    await client.aclose()
    main.app.dependency_overrides.clear()
    await engine.dispose()


async def _login(client, usuario, senha=SENHA):
    return await client.post("/api/auth/login", data={"username": usuario, "password": senha})


async def _token(client, usuario, senha=SENHA) -> str:
    r = await _login(client, usuario, senha)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _h(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


async def _auditoria(Session, acao: str | None = None) -> list[AuditLog]:
    async with Session() as db:
        stmt = select(AuditLog).order_by(AuditLog.id)
        if acao:
            stmt = stmt.where(AuditLog.acao == acao)
        return list((await db.execute(stmt)).scalars().all())


# ── Base: nada sem login ──────────────────────────────────────────────────────

async def test_api_sem_token_bloqueada(ambiente):
    c = ambiente["client"]
    for path in ("/api/documentos", "/api/usuarios", "/api/qualquer-modulo-legado",
                 "/api/tenant/contexto", "/api/admin-geral/municipios"):
        r = await c.get(path)
        assert r.status_code == 401, path


async def test_token_assinado_com_outra_chave_rejeitado(ambiente):
    falso = jwt.encode({"sub": "gestor.apui@teste.gov.br", "mid": ambiente["ids"]["b"]},
                       "chave-errada", algorithm=settings.ALGORITHM)
    r = await ambiente["client"].get("/api/documentos", headers=_h(falso))
    assert r.status_code == 401


async def test_login_nao_aceita_trecho_do_nome(ambiente):
    # Antes, o login caía num ILIKE '%texto%' sobre o nome do usuário.
    r = await _login(ambiente["client"], "gestor", SENHA)
    assert r.status_code == 401


# ── 1 e 2. Apuí não acessa outro município e vice-versa ───────────────────────

async def test_1_usuario_apui_nao_acessa_outro_municipio(ambiente):
    c, ids = ambiente["client"], ambiente["ids"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    docs = (await c.get("/api/documentos", headers=_h(tok))).json()
    assert [d["titulo"] for d in docs] == ["Relatório Apuí sigiloso"]
    assert (await c.get(f"/api/documentos/{ids['doc_b']}/download", headers=_h(tok))).status_code == 404
    r = await c.post("/api/tenant/selecionar", json={"municipio_uuid": ids["b_uuid"]}, headers=_h(tok))
    assert r.status_code == 403


async def test_2_usuario_de_outro_municipio_nao_acessa_apui(ambiente):
    c, ids = ambiente["client"], ambiente["ids"]
    tok = await _token(c, "gestor.b@teste.gov.br")
    docs = (await c.get("/api/documentos", headers=_h(tok))).json()
    assert [d["titulo"] for d in docs] == ["Relatório B sigiloso"]
    assert (await c.get(f"/api/documentos/{ids['doc_apui']}/download", headers=_h(tok))).status_code == 404
    r = await c.post("/api/tenant/selecionar", json={"municipio_uuid": ids["apui_uuid"]}, headers=_h(tok))
    assert r.status_code == 403
    # Módulos com dados de referência de Apuí no código não respondem a outro município
    for rota in ("/api/frota/dashboard", "/api/folha/folha", "/api/repasses-aps/resumo-executivo"):
        r = await c.get(rota, headers=_h(tok))
        assert r.status_code == 403, rota


# ── 3. Alterar município na URL ───────────────────────────────────────────────

@pytest.mark.parametrize("param", ["municipio_id", "ibge", "municipio_ibge", "ibge6", "coMunicipio"])
async def test_3_alterar_municipio_na_url_nao_libera(ambiente, param):
    c, ids = ambiente["client"], ambiente["ids"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    valor = {"municipio_id": ids["b"], "ibge": "1399991", "municipio_ibge": "1399991",
             "ibge6": "139999", "coMunicipio": "139999"}[param]
    r = await c.get(f"/api/documentos?{param}={valor}", headers=_h(tok))
    assert r.status_code == 403
    # parâmetro coerente com a sessão continua funcionando
    ok = {"municipio_id": ids["apui"], "ibge": "1300144", "municipio_ibge": "1300144",
          "ibge6": "130014", "coMunicipio": "130014"}[param]
    assert (await c.get(f"/api/documentos?{param}={ok}", headers=_h(tok))).status_code == 200


# ── 4. Alterar parâmetros da API (corpo e token) ──────────────────────────────

async def test_4_alterar_corpo_da_api_nao_libera(ambiente):
    c, ids = ambiente["client"], ambiente["ids"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.post("/api/usuarios", headers=_h(tok), json={
        "nome": "Intruso", "email": "intruso@x.gov.br", "senha": "12345678",
        "municipio_id": ids["b"],
    })
    assert r.status_code == 403
    # sem o campo, o usuário é criado no município da sessão — nunca em outro
    r = await c.post("/api/usuarios", headers=_h(tok), json={
        "nome": "Novo", "email": "novo@apui.gov.br", "senha": "12345678"})
    assert r.status_code == 201
    assert r.json()["municipio_id"] == ids["apui"]


async def test_4_token_com_municipio_trocado_nao_libera(ambiente):
    c, ids = ambiente["client"], ambiente["ids"]
    # Mesmo um token íntegro com "mid" de outro município é recusado: a
    # autorização é revalidada no banco a cada requisição.
    forjado = auth_mod._create_token({"sub": "gestor.apui@teste.gov.br", "mid": ids["b"]})
    r = await c.get("/api/documentos", headers=_h(forjado))
    assert r.status_code == 403


# ── 5 e 6. Relatórios e exportações ───────────────────────────────────────────

async def test_5_relatorios_somente_do_municipio_autorizado(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.b@teste.gov.br")
    usuarios = (await c.get("/api/usuarios", headers=_h(tok))).json()
    assert {u["email"] for u in usuarios} == {"gestor.b@teste.gov.br", "ana.consulta@b.gov.br"}
    # relatórios legados (dados fixos de Apuí) bloqueados para o município B
    r = await c.get("/api/relatorios/gerar-pdf", headers=_h(tok))
    assert r.status_code == 403


async def test_6_exportacoes_somente_do_municipio_autorizado(ambiente):
    c, ids = ambiente["client"], ambiente["ids"]
    tok = await _token(c, "gestor.b@teste.gov.br")
    r = await c.get(f"/api/documentos/{ids['doc_b']}/download", headers=_h(tok))
    assert r.status_code == 200 and r.content == b"%PDF b"
    assert (await c.get(f"/api/documentos/{ids['doc_apui']}/download", headers=_h(tok))).status_code == 404
    # exportadores com dados de referência de Apuí embutidos: bloqueados para B
    for path in ("/api/exportador/lista", "/api/relatorios/exportar-pdf"):
        assert (await c.get(path, headers=_h(tok))).status_code == 403, path


# ── 7. Pesquisas ──────────────────────────────────────────────────────────────

async def test_7_pesquisas_nao_retornam_outros_municipios(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    achados = (await c.get("/api/usuarios?q=ana.consulta", headers=_h(tok))).json()
    assert [u["email"] for u in achados] == ["ana.consulta@apui.gov.br"]
    docs = (await c.get("/api/documentos?q=sigiloso", headers=_h(tok))).json()
    assert [d["titulo"] for d in docs] == ["Relatório Apuí sigiloso"]


# ── 8. Documentos ─────────────────────────────────────────────────────────────

async def test_8_documentos_isolados(ambiente):
    c, ids = ambiente["client"], ambiente["ids"]
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.delete(f"/api/documentos/{ids['doc_apui']}", headers=_h(tok_b))).status_code == 404

    tok_a = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.post("/api/documentos/upload?titulo=Oficio&tipo=Of%C3%ADcio", headers=_h(tok_a),
                     files={"arquivo": ("oficio.pdf", b"conteudo", "application/pdf")})
    assert r.status_code == 201, r.text
    novo = r.json()
    # arquivo gravado na área lógica do município
    assert f"municipios/{ids['apui_uuid']}/documentos".replace("/", "") in novo["arquivo"].replace("\\", "").replace("/", "")
    assert (await c.get(f"/api/documentos/{novo['id']}/download", headers=_h(tok_b))).status_code == 404
    assert (await c.get(f"/api/documentos/{novo['id']}/download", headers=_h(tok_a))).status_code == 200


# ── 9. Usuário suspenso ───────────────────────────────────────────────────────

async def test_9_usuario_suspenso_nao_entra(ambiente):
    c, Session = ambiente["client"], ambiente["Session"]
    assert (await _login(c, "suspenso@apui.gov.br")).status_code == 403

    tok = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.get("/api/documentos", headers=_h(tok))).status_code == 200
    async with Session() as db:
        u = (await db.execute(select(Usuario).where(Usuario.email == "ana.consulta@apui.gov.br"))).scalar_one()
        u.ativo = False
        await db.commit()
    # token ainda não expirou, mas a suspensão vale na requisição seguinte
    assert (await c.get("/api/documentos", headers=_h(tok))).status_code == 403


# ── 10. Município suspenso ────────────────────────────────────────────────────

async def test_10_municipio_suspenso_nao_usa_o_sistema(ambiente):
    c, ids = ambiente["client"], ambiente["ids"]
    assert (await _login(c, "gestor.c@teste.gov.br")).status_code == 403

    tok_b = await _token(c, "gestor.b@teste.gov.br")
    admin = await _token(c, "euler", SENHA_ADMIN)
    r = await c.post(f"/api/admin-geral/municipios/{ids['b_uuid']}/situacao", headers=_h(admin),
                     json={"situacao": "suspenso", "motivo": "teste"})
    assert r.status_code == 200
    assert (await c.get("/api/documentos", headers=_h(tok_b))).status_code == 403
    assert (await _login(c, "gestor.b@teste.gov.br")).status_code == 403

    await c.post(f"/api/admin-geral/municipios/{ids['b_uuid']}/situacao", headers=_h(admin),
                 json={"situacao": "ativo"})
    assert (await c.get("/api/documentos", headers=_h(tok_b))).status_code == 200


# ── 11. Administrador-geral ───────────────────────────────────────────────────

async def test_11_administrador_geral_acessa_todos(ambiente):
    c, ids, Session = ambiente["client"], ambiente["ids"], ambiente["Session"]
    r = await _login(c, "euler", SENHA_ADMIN)
    assert r.status_code == 200
    assert r.json()["user"]["administrador_geral"] is True
    admin = r.json()["access_token"]

    # sem município selecionado, rotas de dados exigem seleção
    assert (await c.get("/api/documentos", headers=_h(admin))).status_code == 409
    muns = (await c.get("/api/tenant/municipios", headers=_h(admin))).json()
    assert {m["uuid"] for m in muns} >= {ids["apui_uuid"], ids["b_uuid"], ids["c_uuid"]}

    for alvo, titulo in ((ids["apui_uuid"], "Relatório Apuí sigiloso"), (ids["b_uuid"], "Relatório B sigiloso")):
        r = await c.post("/api/tenant/selecionar", json={"municipio_uuid": alvo}, headers=_h(admin))
        assert r.status_code == 200
        admin = r.json()["access_token"]
        docs = (await c.get("/api/documentos", headers=_h(admin))).json()
        assert [d["titulo"] for d in docs] == [titulo]  # nunca mistura municípios
        ctx = (await c.get("/api/tenant/contexto", headers=_h(admin))).json()
        assert ctx["ambiente"] == "suporte" and ctx["municipio_uuid"] == alvo

    r = await c.post("/api/tenant/sair-suporte", headers=_h(admin))
    assert r.status_code == 200 and r.json()["user"]["municipio_id"] is None

    acoes = [a.acao for a in await _auditoria(Session)]
    assert acoes.count("SUPORTE_INICIO") == 2 and acoes.count("SUPORTE_FIM") == 2

    # painel geral só para o administrador-geral
    assert (await c.get("/api/admin-geral/painel", headers=_h(r.json()["access_token"]))).status_code == 200
    gestor = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.get("/api/admin-geral/painel", headers=_h(gestor))).status_code == 403
    assert (await c.get("/api/auth/usuarios", headers=_h(gestor))).status_code == 403


async def test_usuario_multimunicipio_troca_auditada(ambiente):
    c, ids, Session = ambiente["client"], ambiente["ids"], ambiente["Session"]
    r = await _login(c, "multi@teste.gov.br")
    user = r.json()["user"]
    assert user["municipio_id"] == ids["apui"] and user["perfis_assessoria"] is True
    tok = r.json()["access_token"]
    muns = {m["uuid"] for m in (await c.get("/api/tenant/municipios", headers=_h(tok))).json()}
    assert muns == {ids["apui_uuid"], ids["b_uuid"]}  # só os autorizados aparecem

    r = await c.post("/api/tenant/selecionar", json={"municipio_uuid": ids["b_uuid"]}, headers=_h(tok))
    assert r.status_code == 200
    tok_b = r.json()["access_token"]
    docs = (await c.get("/api/documentos", headers=_h(tok_b))).json()
    assert [d["titulo"] for d in docs] == ["Relatório B sigiloso"]
    r = await c.post("/api/tenant/selecionar", json={"municipio_uuid": ids["c_uuid"]}, headers=_h(tok_b))
    assert r.status_code == 403

    trocas = await _auditoria(Session, "TROCA_MUNICIPIO")
    assert len(trocas) == 1 and trocas[0].municipio_id == ids["b"]

    # revogação pelo admin-geral vale imediatamente
    async with Session() as db:
        uid = (await db.execute(select(Usuario.id).where(Usuario.email == "multi@teste.gov.br"))).scalar_one()
    admin = await _token(c, "euler", SENHA_ADMIN)
    r = await c.put(f"/api/admin-geral/usuarios/{uid}/municipios", headers=_h(admin), json={"municipios_uuid": []})
    assert r.status_code == 200
    assert (await c.get("/api/documentos", headers=_h(tok_b))).status_code == 403


# ── 12. Tentativas indevidas registradas ──────────────────────────────────────

async def test_12_tentativas_indevidas_ficam_registradas(ambiente):
    c, ids, Session = ambiente["client"], ambiente["ids"], ambiente["Session"]
    await _login(c, "gestor.apui@teste.gov.br", "senha-errada")
    await _login(c, "gestor.c@teste.gov.br")
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.get(f"/api/documentos?municipio_id={ids['b']}", headers=_h(tok))
    await c.get(f"/api/documentos/{ids['doc_b']}/download", headers=_h(tok))
    await c.post("/api/tenant/selecionar", json={"municipio_uuid": ids["b_uuid"]}, headers=_h(tok))
    await c.get("/api/admin-geral/painel", headers=_h(tok))

    logs = await _auditoria(Session)
    por_acao = {}
    for a in logs:
        por_acao.setdefault(a.acao, []).append(a)
    assert por_acao["LOGIN_FALHA"][0].municipio_id == ids["apui"]
    assert "MUNICIPIO_SEM_ACESSO" in por_acao["LOGIN_NEGADO"][0].detalhe
    negados = por_acao["ACESSO_NEGADO"]
    detalhes = " | ".join(a.detalhe for a in negados)
    for motivo in ("PARAMETRO_MUNICIPIO_DIVERGENTE", "REGISTRO_DE_OUTRO_MUNICIPIO",
                   "MUNICIPIO_NAO_AUTORIZADO", "ROTA_ADMIN_GERAL"):
        assert motivo in detalhes, motivo
    assert all(a.usuario_login == "gestor.apui@teste.gov.br" for a in negados)
    assert all(a.municipio_id == ids["apui"] for a in negados)


# ── Preservação dos dados existentes de Apuí ─────────────────────────────────

async def test_migracao_preserva_dados_de_apui():
    """Banco no formato ANTERIOR (sem colunas multi-tenant) com Apuí e um usuário."""
    engine = create_async_engine("sqlite+aiosqlite://", poolclass=StaticPool)
    async with engine.begin() as conn:
        await conn.execute(text("""CREATE TABLE municipios (id INTEGER PRIMARY KEY, nome VARCHAR(100),
            uf VARCHAR(2), codigo_ibge VARCHAR(7), cnpj_fundo VARCHAR(18), populacao INTEGER)"""))
        await conn.execute(text("CREATE TABLE usuarios (id INTEGER PRIMARY KEY, municipio_id INTEGER, email VARCHAR(200))"))
        await conn.execute(text("""CREATE TABLE audit_log (id INTEGER PRIMARY KEY, usuario_id INTEGER, acao VARCHAR(50),
            tabela VARCHAR(50), registro_id INTEGER, detalhe TEXT, ip_origem VARCHAR(45), criado_em TIMESTAMP)"""))
        await conn.execute(text("CREATE TABLE documentos (id INTEGER PRIMARY KEY, municipio_id INTEGER, titulo VARCHAR(255))"))
        await conn.execute(text("""INSERT INTO municipios VALUES
            (1, 'APUÍ', 'AM', '1300144', '12.834.320/0001-26', 20647),
            (2, 'SEM CONTRATO', 'AM', '1300000', NULL, NULL)"""))
        await conn.execute(text("INSERT INTO usuarios VALUES (10, 1, 'gestor@apui')"))
        await conn.execute(text("INSERT INTO documentos VALUES (5, 1, 'Portaria')"))
        # tabela municipal que não tinha identificador do município
        await conn.execute(text("CREATE TABLE execucao_fns (id INTEGER PRIMARY KEY, descricao VARCHAR(100))"))
        await conn.execute(text("INSERT INTO execucao_fns VALUES (7, 'Pagamento FMS')"))

    await migrar_multitenant(engine)
    await migrar_multitenant(engine)  # idempotente

    async with engine.connect() as conn:
        apui = (await conn.execute(text(
            "SELECT nome, cnpj_fundo, populacao, situacao, uuid FROM municipios WHERE id = 1"))).one()
        outro = (await conn.execute(text("SELECT situacao FROM municipios WHERE id = 2"))).scalar_one()
        doc = (await conn.execute(text("SELECT titulo, municipio_id, excluido_em FROM documentos"))).one()
        usu = (await conn.execute(text("SELECT municipio_id FROM usuarios WHERE id = 10"))).scalar_one()
        exec_fns = (await conn.execute(text("SELECT descricao, municipio_id FROM execucao_fns"))).one()
    await engine.dispose()

    assert apui[:3] == ("APUÍ", "12.834.320/0001-26", 20647)
    assert apui.situacao == "ativo" and len(apui.uuid) == 36
    assert outro == "disponivel"
    assert tuple(doc) == ("Portaria", 1, None) and usu == 1
    assert tuple(exec_fns) == ("Pagamento FMS", 1)  # registro antigo atribuído a Apuí


# ── WebSockets também exigem token ────────────────────────────────────────────

def test_websocket_sem_token_recusado():
    from fastapi.testclient import TestClient
    from starlette.websockets import WebSocketDisconnect

    cliente = TestClient(main.app)
    for path in ("/ws/alertas", "/ws/acs-geo"):
        with pytest.raises(WebSocketDisconnect) as exc:
            with cliente.websocket_connect(path) as ws:
                ws.receive_text()
        assert exc.value.code == 1008, path


# ── Fase 2: CRUD legado, cache e estado em memória ────────────────────────────

async def test_crud_convenios_indicadores_alertas_isolados(ambiente):
    from models.alerta import Alerta
    from models.convenio import Convenio
    c, ids, Session = ambiente["client"], ambiente["ids"], ambiente["Session"]
    async with Session() as db:
        conv = Convenio(municipio_id=ids["apui"], numero="APUI-1", objeto="Convênio Apuí")
        db.add(conv)
        await db.flush()
        alerta = Alerta(municipio_id=ids["apui"], titulo="Alerta Apuí", descricao="x", modulo="APS")
        db.add(alerta)
        await db.commit()
        conv_id, alerta_id = conv.id, alerta.id

    tok_b = await _token(c, "gestor.b@teste.gov.br")
    # sem municipio_id na URL, o padrão antigo (id=1 = Apuí) não vale mais
    assert (await c.get("/api/convenios", headers=_h(tok_b))).json() == []
    assert (await c.get("/api/alertas", headers=_h(tok_b))).json() == []
    assert (await c.get(f"/api/convenios/{conv_id}", headers=_h(tok_b))).status_code == 404
    assert (await c.put(f"/api/convenios/{conv_id}", json={"numero": "x", "objeto": "x"},
                        headers=_h(tok_b))).status_code == 404
    assert (await c.delete(f"/api/convenios/{conv_id}", headers=_h(tok_b))).status_code == 404
    assert (await c.post(f"/api/alertas/{alerta_id}/resolver", headers=_h(tok_b))).status_code == 404
    stats = (await c.get("/api/dashboard/stats", headers=_h(tok_b))).json()
    assert stats["municipio_id"] == ids["b"] and stats["total_convenios"] == 0

    r = await c.post("/api/convenios", json={"numero": "B-1", "objeto": "Convênio B"}, headers=_h(tok_b))
    assert r.status_code == 201 and r.json()["municipio_id"] == ids["b"]
    r = await c.post("/api/convenios", json={"numero": "B-2", "objeto": "x", "municipio_id": ids["apui"]},
                     headers=_h(tok_b))
    assert r.status_code == 403

    tok_a = await _token(c, "gestor.apui@teste.gov.br")
    numeros = {x["numero"] for x in (await c.get("/api/convenios", headers=_h(tok_a))).json()}
    assert numeros == {"APUI-1"}


def test_cache_separado_por_municipio():
    from services.cache_service import cache_get, cache_set
    from tenancy.contexto import MunicipioContexto, contexto_municipio

    a = MunicipioContexto(id=1, uuid="a", ibge="1300144", nome="APUÍ", uf="AM")
    b = MunicipioContexto(id=2, uuid="b", ibge="1399991", nome="B", uf="AM")
    with contexto_municipio(a):
        cache_set("sia:2025", {"total": 123})
    with contexto_municipio(b):
        assert cache_get("sia:2025") is None
    with contexto_municipio(a):
        assert cache_get("sia:2025") == {"total": 123}


async def test_servicos_consultam_o_ibge_da_sessao(ambiente, monkeypatch):
    import httpx
    c = ambiente["client"]
    enviados: list[str] = []
    original = httpx.AsyncClient.send

    async def falso(self, request, *a, **k):
        if request.url.host == "test":
            return await original(self, request, *a, **k)
        enviados.append(str(request.url))
        return httpx.Response(404, request=request, json={})

    monkeypatch.setattr(httpx.AsyncClient, "send", falso)
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    r = await c.get("/api/saude-idoso-apui/dashboard?ano=2025", headers=_h(tok_b))
    assert r.status_code == 200
    assert enviados and all("130014" not in u for u in enviados)
    assert any("139999" in u for u in enviados)


async def test_plano_de_acao_da_auditoria_separado(ambiente):
    c = ambiente["client"]
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/auditoria/plano-acao", headers=_h(tok_b))).json() == []
    await c.post("/api/auditoria/plano-acao", json={"titulo": "Tarefa B"}, headers=_h(tok_b))
    tok_a = await _token(c, "gestor.apui@teste.gov.br")
    titulos = [x["titulo"] for x in (await c.get("/api/auditoria/plano-acao", headers=_h(tok_a))).json()]
    assert "Tarefa B" not in titulos


async def test_catalogo_nacional_de_portarias_so_admin_geral_edita(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.post("/api/portarias", json={"numero": "1", "ano": 2026, "bloco": "APS"}, headers=_h(tok))
    assert r.status_code == 403
