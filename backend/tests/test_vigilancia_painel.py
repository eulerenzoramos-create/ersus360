"""
Painel gerencial de Vigilância em Saúde: semáforo do PQA-VS, central de alertas por prioridade, áreas sem dado
("não disponível", nunca zero), coletores INPE/SISAGUA e acompanhamento dos alertas isolado por município.
"""
from __future__ import annotations

import io
import zipfile
from datetime import date

import httpx
import pytest
from httpx import ASGITransport, AsyncClient

import models.vigilancia_fvs  # noqa: F401
from models.vigilancia_alerta import VigAlertaAcompanhamento
from models.vigilancia_fvs import FvsFonteEstado, FvsMunicipio, FvsSerie
from services import fvs_coleta as col
from services import vig_externos as ext
from services import vig_painel as vp


def _s(fonte, ind, mun, ano, tipo="ano", per=0, valor=None, **kw):
    return FvsSerie(fonte=fonte, indicador=ind, ibge6=mun, ano=ano, periodo_tipo=tipo, periodo=per, recorte="total",
                    recorte_valor="", valor=valor, **kw)


# ── Semáforo do PQA-VS ────────────────────────────────────────────────────────

@pytest.mark.parametrize("item,cor", [
    ({"resultado": 95, "meta": ">=90%", "alcance": "SIM", "observacao": None}, "verde"),
    ({"resultado": 83.5, "meta": ">=90%", "alcance": "NÃO", "observacao": None}, "amarelo"),   # 92,8% da meta
    ({"resultado": 64.7, "meta": ">=70%", "alcance": "NÃO", "observacao": None}, "amarelo"),   # 92,4%
    ({"resultado": 0.0, "meta": ">=75%", "alcance": "NÃO", "observacao": None}, "vermelho"),
    ({"resultado": None, "meta": ">=75%", "alcance": None, "observacao": None}, "cinza"),
    ({"resultado": 0, "meta": "100%", "alcance": "NÃO", "observacao": "Ausência de casos"}, "cinza"),
])
def test_semaforo_pqa(item, cor):
    r = vp.semaforo_pqa(item)
    assert r["semaforo"] == cor


def test_semaforo_calcula_cumprimento_da_meta_publicada():
    r = vp.semaforo_pqa({"resultado": 76.8, "meta": ">=90%", "alcance": "NÃO", "observacao": None})
    assert r["meta_numero"] == 90 and r["cumprimento_pct"] == 85.3 and r["semaforo"] == "vermelho"


# ── Central de alertas ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_central_classifica_prioridade_e_separa_integracao(db_session):
    ano = date.today().year
    db_session.add_all([
        FvsMunicipio(ibge6="130014", ibge7="1300144", nome="Apuí", regiao_saude="RIO MADEIRA", fonte="t"),
        _s("sinan", "casos:Sarampo", "130014", ano, valor=1),
        _s("pqa_vs", "IND_07", "130014", ano, "quadrimestre", 1, 64.7, meta=">=70%", alcance="NÃO"),
        _s("aesop", "aviso_aesop", "130014", ano, "se", 30, texto="Sim"),
    ])
    await db_session.commit()
    r = await vp.central_alertas(db_session, "130014", ano)
    por_titulo = {a["titulo"]: a for a in r["alertas"]}
    critico = por_titulo["Agravo de notificação imediata: Sarampo"]
    assert critico["prioridade"] == "critico" and critico["categoria"] == "epidemiologico"
    assert "não informa" in critico["detalhe"]          # não afirma caso confirmado
    assert por_titulo["Aviso AESOP ativo"]["prioridade"] == "alto"
    pqa = next(a for a in r["alertas"] if a["fonte"] == "pqa_vs")
    assert pqa["prioridade"] == "moderado" and pqa["categoria"] == "desempenho"
    integ = [a for a in r["alertas"] if a["tipo"] == "integracao"]
    assert integ and all(a["categoria"] == "integracao" and a["prioridade"] == "informativo" for a in integ)
    assert r["alertas"][0]["prioridade"] == "critico"   # ordenado por prioridade
    assert all(len(a["chave"]) == 20 for a in r["alertas"])
    assert len({a["chave"] for a in r["alertas"]}) == len(r["alertas"])
    assert set(r["criterios"]) == {"critico", "alto", "moderado", "informativo"}


@pytest.mark.asyncio
async def test_ecoli_recente_gera_alerta_alto_ambiental(db_session):
    hoje = date.today()
    db_session.add_all([_s("sisagua", "presenca:ecoli", "130014", hoje.year, "mes", hoje.month, 2),
                        _s("sisagua", "amostras:ecoli", "130014", hoje.year, "ano", 0, 10)])
    await db_session.commit()
    r = await vp.central_alertas(db_session, "130014", hoje.year)
    a = next(a for a in r["alertas"] if a["fonte"] == "sisagua")
    assert a["prioridade"] == "alto" and a["area"] == "diarreicas" and "888/2021" in a["detalhe"]


# ── Áreas sem dado: nada de zero ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_areas_sem_dado_nao_inventam_numeros(db_session):
    ano = date.today().year
    resp = await vp.respiratoria(db_session, "130014", ano)
    assert all(v["ano"] is None and v["ano_anterior"] is None for v in resp["totais"].values())
    assert resp["exposicao"] is None
    assert any("PM2,5" in i["item"] for i in resp["indisponivel"])
    assert "NÃO comprova causa" in resp["nota_causalidade"]
    amb = await vp.ambiental(db_session, "130014", ano)
    assert all(x["focos"] is None for x in amb["focos_anual"])
    assert all(m[str(ano)] is None for m in amb["focos_mensal"])
    dda = await vp.diarreicas(db_session, "130014", ano)
    assert dda["agua_anual"] == [] and dda["agua_sem_registro"] is False   # fonte nunca sincronizada ≠ sem amostra
    assert any("MDDA" in i["item"] for i in dda["indisponivel"])
    vis = await vp.visao_geral(db_session, "130014", ano)
    assert vis["top_agravos"] == [] and all(c["acumulado"] is None for c in vis["comparativo_anos"])
    notif = await vp.notificacoes(db_session, "130014", ano)
    assert notif["linhas"] == []
    intel = await vp.inteligencia(db_session, "130014", ano)
    assert intel["hipoteses"] == [] and intel["limitacoes"]


@pytest.mark.asyncio
async def test_sisagua_sincronizado_sem_amostra_do_municipio(db_session):
    db_session.add_all([FvsFonteEstado(fonte="sisagua", situacao="ok"),
                        _s("sisagua", "amostras:ecoli", "130260", date.today().year, valor=50)])
    await db_session.commit()
    dda = await vp.diarreicas(db_session, "130014", date.today().year)
    assert dda["agua_sem_registro"] is True
    r = await vp.central_alertas(db_session, "130014", date.today().year)
    assert any(a["titulo"] == "Sem amostras de vigilância da água no SISAGUA" and a["prioridade"] == "informativo"
               for a in r["alertas"])


def test_tendencia_nao_rotula_numeros_pequenos():
    assert vp._tendencia({"variacao_recente_pct": 200.0, "ultimas_semanas": 3, "semanas_anteriores": 1}) == "números pequenos"
    assert vp._tendencia({"variacao_recente_pct": 50.0, "ultimas_semanas": 30, "semanas_anteriores": 20}) == "crescimento"
    assert vp._tendencia(None) == "sem série"


# ── Coletores externos ────────────────────────────────────────────────────────

def test_inpe_arquivo_anual_casa_nome_em_latin1():
    csv = ("id_bdq,foco_id,lat,lon,data_pas,pais,estado,municipio,bioma\n"
           "1,a,-7,-59,2024-08-10 17:00:00,Brasil,AMAZONAS,APUÍ,Amazônia\n"
           "2,b,-7,-59,2024-08-11 17:00:00,Brasil,AMAZONAS,APUÍ,Amazônia\n"
           "3,c,-7,-63,2024-08-11 17:00:00,Brasil,AMAZONAS,HUMAITÁ,Amazônia\n"
           "4,d,-7,-63,2024-08-11 17:00:00,Brasil,PARÁ,ALTAMIRA,Amazônia\n"
           "5,e,-7,-63,2024-08-11 17:00:00,Brasil,AMAZONAS,CIDADE INEXISTENTE,Amazônia\n").encode("latin-1")
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("focos_br_am_ref_2024.csv", csv)
    sem = set()
    nomes = {ext.normalizar_nome("Apuí"): "130014", ext.normalizar_nome("Humaitá"): "130170"}
    focos = ext._datas_de_zip(buf.getvalue(), nomes, sem)
    assert sorted(m for m, _ in focos) == ["130014", "130014", "130170"]
    assert sem == {"CIDADE INEXISTENTE"}


def test_sisagua_conta_presenca_e_fora_do_padrao(monkeypatch):
    ano = date.today().year
    regs = [
        {"codigo_ibge": 130260, "municipio": "MANAUS", "mes": 3, "parametro": "Escherichia coli", "resultado": "PRESENTE", "data_da_coleta": f"{ano}-03-02"},
        {"codigo_ibge": None, "municipio": "APUI", "mes": 3, "parametro": "Escherichia coli", "resultado": "AUSENTE", "data_da_coleta": f"{ano}-03-03"},
        {"codigo_ibge": None, "municipio": "APUI", "mes": 3, "parametro": "Turbidez (uT)", "resultado": "55,42", "data_da_coleta": f"{ano}-03-03"},
        {"codigo_ibge": None, "municipio": "APUI", "mes": 3, "parametro": "Cloro residual livre (mg/L)", "resultado": "0,1", "data_da_coleta": f"{ano}-03-03"},
        {"codigo_ibge": None, "municipio": "APUI", "mes": 3, "parametro": "pH", "resultado": "6", "data_da_coleta": f"{ano}-03-03"},
    ]

    def responder(req: httpx.Request):
        ok = req.url.params["ano"] == str(ano) and req.url.params["offset"] == "0"
        return httpx.Response(200, json={"parametros": regs if ok else []})

    real = httpx.Client
    monkeypatch.setattr(ext.httpx, "Client", lambda **kw: real(transport=httpx.MockTransport(responder), **kw))
    out = ext.coletar_sisagua({"APUI": "130014", "MANAUS": "130260"})
    v = {(r["indicador"], r["ibge6"], r["periodo_tipo"]): r["valor"] for r in out["linhas"]}
    assert v[("presenca:ecoli", "130260", "mes")] == 1
    assert ("presenca:ecoli", "130014", "mes") not in v
    assert v[("fora_padrao:turbidez", "130014", "ano")] == 1
    assert v[("fora_padrao:cloro", "130014", "ano")] == 1
    assert v[("amostras:ecoli", col.IBGE_AM, "ano")] == 2
    assert not any("ph" in k[0].lower() for k in v)


@pytest.mark.asyncio
async def test_coletor_externo_usa_lista_oficial_e_nao_consulta_tableau(db_session, monkeypatch):
    db_session.add(FvsMunicipio(ibge6="130014", ibge7="1300144", nome="Apuí", regiao_saude="RIO MADEIRA", fonte="t"))
    await db_session.commit()
    recebido = {}

    def fake(coletor, nomes):
        recebido.update(nomes)
        return {"linhas": [ext._linha("focos_calor", "130014", 2025, valor=541.0)], "publicado_em": None,
                "data_referencia": "focos até 31/12/2025", "extra": {}, "validacao": {}}
    monkeypatch.setattr(col, "_executar_externo", fake)
    monkeypatch.setattr(col.tb, "metadados", lambda p: (_ for _ in ()).throw(AssertionError("consultou Tableau")))
    r = await col.sincronizar(db_session, "inpe_focos", forcar=False)
    assert r["situacao"] == "ok" and recebido == {"APUI": "130014"}
    est = await db_session.get(FvsFonteEstado, "inpe_focos")
    assert est.situacao == "ok" and est.data_referencia == "focos até 31/12/2025"


# ── Acompanhamento dos alertas (rota, permissão, isolamento) ──────────────────

@pytest.fixture
def cliente(db_session, municipio):
    import main
    from database import get_db
    from routers.auth import UserOut, get_current_user
    from tenancy.guard import tenant_guard
    estado = {"user": None}

    async def _db():
        yield db_session

    async def _user():
        return estado["user"]

    main.app.dependency_overrides[get_db] = _db
    main.app.dependency_overrides[get_current_user] = _user
    main.app.dependency_overrides[tenant_guard] = lambda: None

    def como(role: str, municipio_id: int | None = None, ibge: str = "1300144"):
        estado["user"] = UserOut(username=f"u-{role}", nome=f"Usuário {role}", role=role, municipio="Apuí/AM",
                                 municipio_id=municipio_id or municipio.id, municipio_ibge=ibge)
        return AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test")
    yield como
    main.app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_acompanhamento_registra_historico_e_respeita_perfil(cliente, db_session):
    ano = date.today().year
    db_session.add(_s("sinan", "casos:Sarampo", "130014", ano, valor=1))
    await db_session.commit()
    async with cliente("vigilancia") as c:
        central = (await c.get("/api/vigilancia-fvs/alertas/central", params={"ano": ano})).json()
        assert central["acompanhamento_habilitado"] and central["pode_registrar"]
        al = next(a for a in central["alertas"] if a["prioridade"] == "critico")
        assert al["acompanhamento"]["situacao"] == "novo"
        corpo = {"chave": al["chave"], "titulo": al["titulo"], "ano": ano, "situacao": "em_avaliacao",
                 "avaliacao": "Ficha conferida; caso suspeito em investigação.", "providencias": "Bloqueio vacinal."}
        assert (await c.post("/api/vigilancia-fvs/alertas/acompanhamento", json=corpo)).status_code == 201
        corpo["situacao"] = "encerrado"
        assert (await c.post("/api/vigilancia-fvs/alertas/acompanhamento", json=corpo)).status_code == 201
        central = (await c.get("/api/vigilancia-fvs/alertas/central", params={"ano": ano})).json()
        atual = next(a for a in central["alertas"] if a["chave"] == al["chave"])["acompanhamento"]
        assert atual["situacao"] == "encerrado" and atual["eventos"] == 2
        hist = (await c.get(f"/api/vigilancia-fvs/alertas/acompanhamento/{al['chave']}")).json()["historico"]
        assert [h["situacao"] for h in hist] == ["encerrado", "em_avaliacao"]
        # chave que não é alerta atual do município → 404
        corpo["chave"] = "0" * 20
        assert (await c.post("/api/vigilancia-fvs/alertas/acompanhamento", json=corpo)).status_code == 404
    async with cliente("acs") as c:
        corpo["chave"] = al["chave"]
        assert (await c.post("/api/vigilancia-fvs/alertas/acompanhamento", json=corpo)).status_code == 403
        r = (await c.get("/api/vigilancia-fvs/alertas/central", params={"ano": ano})).json()
        assert r["pode_registrar"] is False


@pytest.mark.asyncio
async def test_acompanhamento_de_outro_municipio_nao_aparece(cliente, db_session, municipio):
    from models.municipio import Municipio
    ano = date.today().year
    outro = Municipio(nome="Teste B", uf="AM", codigo_ibge="1399991")
    db_session.add(outro)
    db_session.add(_s("sinan", "casos:Sarampo", "130014", ano, valor=1))
    await db_session.commit()
    chave = vp.chave_alerta("130014", ano, "sinan", "Agravo de notificação imediata: Sarampo")
    db_session.add(VigAlertaAcompanhamento(municipio_id=municipio.id, alerta_chave=chave, alerta_titulo="x", ano=ano,
                                           situacao="encerrado", avaliacao="interna", usuario="a", perfil="vigilancia"))
    await db_session.commit()
    async with cliente("vigilancia", municipio_id=outro.id, ibge="1399991") as c:
        # consulta pública do município 130014 a partir de outro tenant: alertas sim, acompanhamento não
        r = (await c.get("/api/vigilancia-fvs/alertas/central", params={"mun": "130014", "ano": ano})).json()
        assert r["acompanhamento_habilitado"] is False
        assert all(a["acompanhamento"] is None for a in r["alertas"])
        hist = (await c.get(f"/api/vigilancia-fvs/alertas/acompanhamento/{chave}")).json()
        assert hist["historico"] == []
