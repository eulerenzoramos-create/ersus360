"""Sincronização automática do território do PEC: cliente da API web (GraphQL), gravação do lote e agendamento."""
import json

import httpx
import pytest
from sqlalchemy import select

from models.municipio import Municipio
from models.pec_agente import PecAcsLote, PecAgenteExecucao
from routers import pec_agente as ag
from services import pec_territorio_web as web
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401

ACESSO = web.Acesso(url="https://pec.exemplo", usuario="conta-servico", senha="segredo-123")


def _pec(login_ok=True, erro_consulta=None, http=200):
    """PEC simulado: exige o cookie de sessão depois do login e registra o que foi pedido."""
    visto = {"ops": [], "queries": []}

    def handler(req: httpx.Request) -> httpx.Response:
        corpo = json.loads(req.content)
        op, q, v = corpo["operationName"], corpo["query"], corpo["variables"]["input"]
        visto["ops"].append(op)
        visto["queries"].append(q)
        if http != 200:
            return httpx.Response(http)
        if op == "Login":
            ok = login_ok and v == {"username": "conta-servico", "password": "segredo-123"}
            r = httpx.Response(200, json={"data": {"login": {"success": ok}}})
            if ok:
                r.headers["set-cookie"] = "JSESSIONID=abc; Path=/; HttpOnly"
            return r
        if "JSESSIONID=abc" not in req.headers.get("cookie", ""):
            return httpx.Response(200, json={"errors": [{"message": "não autenticado"}]})
        if erro_consulta and op == erro_consulta:
            return httpx.Response(200, json={"errors": [{"message": "falha com conta-servico e segredo-123"}]})
        if op == "UnidadesSaudeSelectField":
            return httpx.Response(200, json={"data": {"unidadesSaude": {"content": [
                {"id": "9", "cnes": "3697983", "nome": "Centro de Saude Curumim", "ativo": True},
                {"id": "5", "cnes": "2013282", "nome": "Hospital Dorvalino Lagasse", "ativo": True},
                {"id": "7", "cnes": "0000000", "nome": "Unidade Inativa", "ativo": False}]}}})
        if op == "EquipeSelectField":
            if v["unidadeSaudeId"] == "9":
                eqs = [{"id": "1", "nome": "JUMA", "ine": "0000007080", "ativo": True, "tipoEquipe": {"sigla": "ESF"}},
                       {"id": "2", "nome": "0014 JUMA", "ine": "0001773860", "ativo": True, "tipoEquipe": {"sigla": "ESB"}},
                       {"id": "3", "nome": "EMULTI CURUMIM", "ine": "0002449900", "ativo": True, "tipoEquipe": {"sigla": "EMULTI"}}]
            else:
                eqs = []
            return httpx.Response(200, json={"data": {"equipes": {"content": eqs}}})
        if op == "VisualizacaoTerritorial":
            return httpx.Response(200, json={"data": {"territorioEquipe": {"microareas": ["01", "02", "FA"]}}})
        if op == "TerritorioMicroarea":
            tab = {"01": (178, 178, 178, 100, 69), "02": (207, 205, 207, 101, 85), "FA": (217, 10, 11, 190, 0)}[v["microarea"]]
            return httpx.Response(200, json={"data": {"territorioMicroarea": {"id": "x", "indices": {
                "totalImoveisNaoRecusados": tab[0], "quantidadeImoveisCadastroCompleto": tab[1],
                "quantidadeImoveisAtualizados": tab[2], "totalImoveisAtualizados": tab[0],
                "quantidadeDomiciliosAvaliados": tab[3], "quantidadeDomiciliosVisitados": tab[4]}}}})
        return httpx.Response(200, json={"errors": [{"message": "operação desconhecida"}]})

    cliente = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="https://pec.exemplo")
    return cliente, visto


@pytest.mark.asyncio
async def test_coleta_so_equipes_esf_e_so_contadores():
    c, visto = _pec()
    equipes = await web.coletar_territorio(ACESSO, client=c)
    assert [(e["ine"], e["nome"], e["unidade"], e["cnes"]) for e in equipes] == [
        ("0000007080", "Juma", "Centro de Saude Curumim", "3697983")]          # ESB, eMulti e unidade inativa ficam de fora
    m = {x["codigo"]: x for x in equipes[0]["microareas"]}
    assert m["01"] == {"codigo": "01", "imoveis": 178, "cadastro_completo": 178, "cadastro_atualizado": 178,
                       "domicilios_visitados": 69, "domicilios_a_visitar": 100}
    assert m["FORA"]["imoveis"] == 217 and m["FORA"]["domicilios_visitados"] == 0          # "FA" vira FORA
    await c.aclose()
    assert visto["ops"][0] == "Login"                                                        # autentica antes de tudo
    tudo = " ".join(visto["queries"]).lower()
    for proibido in ("logradouros", "cidadao", "cpf", "cns", "domicilio {"):
        assert proibido not in tudo                                                           # só contadores
    assert [q for q in visto["queries"] if q.startswith("mutation")] == [web.Q_LOGIN]         # única mutation = login


@pytest.mark.asyncio
async def test_login_recusado_nao_vaza_credenciais():
    c, _ = _pec(login_ok=False)
    with pytest.raises(web.PecWebErro) as e:
        await web.coletar_territorio(ACESSO, client=c)
    assert "Login recusado" in str(e.value) and "segredo-123" not in str(e.value) and "conta-servico" not in str(e.value)


@pytest.mark.asyncio
async def test_erro_do_pec_e_http_viram_mensagem_limpa():
    c, _ = _pec(erro_consulta="UnidadesSaudeSelectField")
    with pytest.raises(web.PecWebErro) as e:
        await web.coletar_territorio(ACESSO, client=c)
    assert "segredo-123" not in str(e.value) and "conta-servico" not in str(e.value) and "***" in str(e.value)
    c, _ = _pec(http=502)
    with pytest.raises(web.PecWebErro, match="HTTP 502"):
        await web.coletar_territorio(ACESSO, client=c)


# ── gravação do lote e situação ───────────────────────────────────────────────

EQUIPES = [{"ine": "0000007080", "nome": "Juma", "tipo": "eSF", "cnes": "3697983", "unidade": "Centro de Saude Curumim",
            "microareas": [{"codigo": "01", "imoveis": 178, "cadastro_completo": 178, "cadastro_atualizado": 178,
                            "domicilios_visitados": 69, "domicilios_a_visitar": 100}]}]


async def _apui(S):
    async with S() as db:
        return (await db.execute(select(Municipio).where(Municipio.codigo_ibge == "1300144"))).scalar_one()


@pytest.mark.asyncio
async def test_sincronizacao_grava_lote_automatico_e_painel_identifica(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    for k, v in {"ESUS_PEC_URL": "https://pec.exemplo", "ESUS_USUARIO": "u", "ESUS_SENHA": "s"}.items():
        monkeypatch.setenv(k, v)

    async def falso(acesso, **kw):
        assert acesso.url == "https://pec.exemplo" and acesso.usuario == "u"
        return EQUIPES
    monkeypatch.setattr(web, "coletar_territorio", falso)
    async with S() as db:
        m = (await db.execute(select(Municipio).where(Municipio.codigo_ibge == "1300144"))).scalar_one()
        r = await ag.sincronizar_territorio_municipio(db, m)
    assert r["ok"] and r["equipes"] == 1 and r["microareas"] == 1

    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get(f"/api/acs/dashboard?competencia={ag.competencia_agora()}", headers=_h(tok))).json()
    assert d["origem_dado"] == "sincronizacao_automatica" and d["captura"]["automatica"] is True
    assert d["kpis"]["domicilios_visitados"] == 69 and d["kpis"]["total_acs"] is None
    s = (await c.get("/api/pec-agente/situacao", headers=_h(tok))).json()
    assert s["estado"] == "sem_agente"                                                    # não é contato do agente
    assert s["sincronizacao_web"]["ultima_execucao"]["status"] == "aceito"


@pytest.mark.asyncio
async def test_falhas_viram_historico_e_lote_do_agente_nunca_e_substituido(ambiente, monkeypatch):
    S = ambiente["Session"]
    for k, v in {"ESUS_PEC_URL": "https://pec.exemplo", "ESUS_USUARIO": "u", "ESUS_SENHA": "s"}.items():
        monkeypatch.setenv(k, v)

    async def recusa(acesso, **kw):
        raise web.PecWebErro("Login recusado pelo PEC")
    monkeypatch.setattr(web, "coletar_territorio", recusa)
    async with S() as db:
        m = (await db.execute(select(Municipio).where(Municipio.codigo_ibge == "1300144"))).scalar_one()
        assert (await ag.sincronizar_territorio_municipio(db, m))["motivo"] == "falha"
        ex = (await db.execute(select(PecAgenteExecucao))).scalars().all()
        assert [(e.tipo, e.status) for e in ex] == [("sync_web", "erro_origem")] and "Login recusado" in ex[0].mensagem

        async def ok(acesso, **kw):
            return EQUIPES
        monkeypatch.setattr(web, "coletar_territorio", ok)
        db.add(PecAcsLote(municipio_id=m.id, competencia=ag.competencia_agora(), hash_conteudo="h",
                          payload={"equipes": [], "acs": [], "microareas": [], "visitas": [], "grupos": []}))   # lote do agente
        await db.commit()
        assert (await ag.sincronizar_territorio_municipio(db, m))["motivo"] == "lote_do_agente"


@pytest.mark.asyncio
async def test_sincronizacao_substitui_captura_manual_e_sem_credencial_nao_roda(ambiente, monkeypatch):
    S = ambiente["Session"]
    for k in ("ESUS_PEC_URL", "ESUS_URL", "ESUS_USUARIO", "ESUS_SENHA"):
        monkeypatch.delenv(k, raising=False)
    async with S() as db:
        m = (await db.execute(select(Municipio).where(Municipio.codigo_ibge == "1300144"))).scalar_one()
        assert (await ag.sincronizar_territorio_municipio(db, m)) == {"ok": False, "motivo": "nao_configurado"}


@pytest.mark.asyncio
async def test_endpoint_sob_demanda_exige_edicao_e_configuracao(ambiente, monkeypatch):
    c = ambiente["client"]
    for k in ("ESUS_PEC_URL", "ESUS_URL", "ESUS_USUARIO", "ESUS_SENHA"):
        monkeypatch.delenv(k, raising=False)
    assert (await c.post("/api/pec-agente/sincronizar-territorio", headers=_h(await _token(c, "ana.consulta@apui.gov.br")))).status_code == 403
    r = await c.post("/api/pec-agente/sincronizar-territorio", headers=_h(await _token(c, "gestor.apui@teste.gov.br")))
    assert r.status_code == 409 and "ESUS_PEC_URL" in r.json()["detail"]


@pytest.mark.asyncio
async def test_job_agendado_a_cada_4_horas():
    import scheduler
    scheduler.start_scheduler()
    try:
        ids = {j.id for j in scheduler.scheduler.get_jobs()}
        assert {f"pec_territorio_{h}h" for h in (6, 10, 14, 18)} <= ids
    finally:
        scheduler.stop_scheduler()


@pytest.mark.asyncio
async def test_login_recusado_pausa_o_automatico_para_nao_bloquear_a_conta(ambiente, monkeypatch):
    S = ambiente["Session"]
    for k, v in {"ESUS_PEC_URL": "https://pec.exemplo", "ESUS_USUARIO": "u", "ESUS_SENHA": "errada"}.items():
        monkeypatch.setenv(k, v)
    chamadas = []

    async def recusa(acesso, **kw):
        chamadas.append(1)
        raise web.PecWebErro("Login recusado pelo PEC: confira usuário e senha")
    monkeypatch.setattr(web, "coletar_territorio", recusa)
    async with S() as db:
        m = (await db.execute(select(Municipio).where(Municipio.codigo_ibge == "1300144"))).scalar_one()
        assert (await ag.sincronizar_territorio_municipio(db, m, automatica=True))["motivo"] == "falha"
        assert (await ag.sincronizar_territorio_municipio(db, m, automatica=True))["motivo"] == "login_recusado_pausado"
        assert len(chamadas) == 1                                                       # a 2ª rodada automática nem tentou entrar
        assert (await ag.sincronizar_territorio_municipio(db, m))["motivo"] == "falha"   # sob demanda sempre tenta
        assert len(chamadas) == 2


@pytest.mark.asyncio
async def test_falha_de_rede_nao_pausa_o_automatico(ambiente, monkeypatch):
    S = ambiente["Session"]
    for k, v in {"ESUS_PEC_URL": "https://pec.exemplo", "ESUS_USUARIO": "u", "ESUS_SENHA": "s"}.items():
        monkeypatch.setenv(k, v)
    n = []

    async def rede(acesso, **kw):
        n.append(1)
        raise web.PecWebErro("Login: sem conexão com o PEC (ConnectError)")
    monkeypatch.setattr(web, "coletar_territorio", rede)
    async with S() as db:
        m = (await db.execute(select(Municipio).where(Municipio.codigo_ibge == "1300144"))).scalar_one()
        await ag.sincronizar_territorio_municipio(db, m, automatica=True)
        await ag.sincronizar_territorio_municipio(db, m, automatica=True)
    assert len(n) == 2


@pytest.mark.asyncio
async def test_senha_incorreta_do_pec_vira_login_recusado_e_pausa(ambiente, monkeypatch):
    """Caso real: o PEC responde com erro GraphQL "Usuário ou senha incorretos. Após 5 tentativas ... bloqueado"."""
    def handler(req: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"errors": [{"message": "Usuário ou senha incorretos. Após 5 tentativas o seu login será bloqueado."}]})
    c = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="https://pec.exemplo")
    with pytest.raises(web.PecWebErro) as e:
        await web.coletar_territorio(ACESSO, client=c)
    assert str(e.value).startswith("Login recusado pelo PEC: Usuário ou senha incorretos")

    S = ambiente["Session"]
    for k, v in {"ESUS_PEC_URL": "https://pec.exemplo", "ESUS_USUARIO": "u", "ESUS_SENHA": "errada"}.items():
        monkeypatch.setenv(k, v)
    chamadas = []

    async def recusa(acesso, **kw):
        chamadas.append(1)
        raise web.PecWebErro("Login recusado pelo PEC: Usuário ou senha incorretos.")
    monkeypatch.setattr(web, "coletar_territorio", recusa)
    async with S() as db:
        m = (await db.execute(select(Municipio).where(Municipio.codigo_ibge == "1300144"))).scalar_one()
        # registro antigo, gravado antes da correção (mensagem no formato "Login: ...")
        db.add(PecAgenteExecucao(municipio_id=m.id, tipo="sync_web", status="erro_origem",
                                 mensagem="Login: Usuário ou senha incorretos. Após 5 tentativas o seu login será bloqueado."))
        await db.commit()
        assert (await ag.sincronizar_territorio_municipio(db, m, automatica=True))["motivo"] == "login_recusado_pausado"
    assert chamadas == []                                                              # nem tentou entrar


def test_cliente_se_identifica_como_a_tela_web_do_pec(monkeypatch):
    h = web.cabecalhos("https://esus.apui.am.gov.br/")
    assert h["apollographql-client-name"] == "PEC Web" and h["apollographql-client-version"] == "5.5.28"
    assert h["Origin"] == "https://esus.apui.am.gov.br" and h["Referer"] == "https://esus.apui.am.gov.br/"
    assert h["User-Agent"].startswith("ERSUS360")                                      # identifica-se de verdade
    assert "Authorization" not in h and "Cookie" not in h
    monkeypatch.setenv("ESUS_PEC_VERSAO", "5.6.1")
    assert web.cabecalhos("https://x")["apollographql-client-version"] == "5.6.1"


def test_cabecalhos_aceitos_pelo_httpx_e_so_ascii():
    """Falha real (19/10/2026): um acento no User-Agent derrubou a criação do cliente httpx em produção."""
    h = web.cabecalhos("https://esus.apui.am.gov.br")
    for k, v in h.items():
        v.encode("ascii")                                                              # cabeçalho HTTP não aceita acento
    cliente = httpx.AsyncClient(base_url="https://esus.apui.am.gov.br", headers=h)     # é assim que coletar_territorio o cria
    assert cliente.headers["apollographql-client-name"] == "PEC Web"


def test_api_consumer_id_so_quando_configurado(monkeypatch):
    monkeypatch.delenv("ESUS_PEC_API_CONSUMER_ID", raising=False)
    assert "Api-Consumer-Id" not in web.cabecalhos("https://x")
    monkeypatch.setenv("ESUS_PEC_API_CONSUMER_ID", "  ersus360-apui  ")
    assert web.cabecalhos("https://x")["Api-Consumer-Id"] == "ersus360-apui"


@pytest.mark.asyncio
async def test_falta_api_consumer_id_explica_o_que_configurar():
    """Falha real (19/10/2026, PEC 5.5.28): credencial aceita, mas o PEC exigiu Api-Consumer-Id."""
    def handler(req):
        return httpx.Response(200, json={"errors": [{"message": "Api-Consumer-Id não informado no header da requisição."}]})
    c = httpx.AsyncClient(base_url="https://pec.exemplo", transport=httpx.MockTransport(handler))
    with pytest.raises(web.PecWebErro) as e:
        await web._login(c, ACESSO)
    assert str(e.value).startswith("Login recusado pelo PEC: Api-Consumer-Id") and "ESUS_PEC_API_CONSUMER_ID" in str(e.value)
