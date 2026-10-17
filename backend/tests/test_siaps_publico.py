"""Resultados oficiais da área pública do SIAPS e ERSUS IA — Analista SIAPS, com as respostas reais
de Apuí capturadas em 17/10/2026 (tests/dados/siaps_publico_apui_20261017.json): sincroniza, preserva
histórico e revisões do MS, não apaga nada com a fonte fora do ar, isola município e a IA só recebe
dados oficiais."""
from __future__ import annotations

import copy
import json
from pathlib import Path
from types import SimpleNamespace

import httpx

from services import siaps_ia
from services import siaps_publico as sp

_ASYNC_CLIENT_REAL = httpx.AsyncClient
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)

REAL = json.loads((Path(__file__).parent / "dados" / "siaps_publico_apui_20261017.json").read_text(encoding="utf-8"))
COMPETENCIAS = [{"nuCompetencia": "2026Q1", "quadrimestre": True}, {"nuCompetencia": "2025Q3", "quadrimestre": True},
                {"nuCompetencia": "202501", "quadrimestre": False}]


def _siaps_falso(monkeypatch, dados=None, falhar=False):
    dados = dados or REAL

    def handler(request: httpx.Request) -> httpx.Response:
        if falhar:
            return httpx.Response(502, text="Bad Gateway")
        path = request.url.path
        if path.endswith("/filtros/competencias"):
            return httpx.Response(200, json=COMPETENCIAS)
        if path.endswith("/filtros/indice-ied"):
            assert request.url.params["coMunicipioIbge"] == "130014"
            return httpx.Response(200, json=dados["ied"])
        corpo = json.loads(request.content)
        assert corpo["coMunicipioIbge"] == ["130014"]
        q = corpo["nuQuadrimestre"][0]
        return httpx.Response(200, json={**dados.get(q, {"classificacaoFinalComponente": []}), "graficos": [{"x": 1}]})
    monkeypatch.setattr(sp.httpx, "AsyncClient",
                        lambda *a, **k: _ASYNC_CLIENT_REAL(transport=httpx.MockTransport(handler), timeout=5))


def _cvat(quad: dict) -> dict:
    return next(c for c in quad["componentes"] if c["origem"] == "CVAT" and c["tipo_equipe"] == "eSF")


def test_rotulo_do_quadrimestre():
    assert sp.rotulo_quadrimestre("2026Q1") == "1º quadrimestre/2026 (jan–abr)"
    assert sp.rotulo_quadrimestre("2025Q3") == "3º quadrimestre/2025 (set–dez)"


async def test_sincroniza_e_mostra_resultado_oficial_de_apui(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    vazio = (await c.get("/api/siaps-publico", headers=_h(tok))).json()
    assert vazio["situacao_dado"] == "nao_disponivel" and vazio["quadrimestres"] == []

    _siaps_falso(monkeypatch)
    r = (await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))).json()
    assert r["ok"] and r["novo"] == ["2026Q1", "2025Q3", "IED 202608"]
    assert await _auditoria(S, "SIAPS_PUBLICO_SINCRONIZADO")

    p = (await c.get("/api/siaps-publico", headers=_h(tok))).json()
    assert p["situacao_dado"] == "oficial_publicado"
    assert [q["quadrimestre"] for q in p["quadrimestres"]] == ["2026Q1", "2025Q3"]
    atual = p["quadrimestres"][0]
    # mesmo resultado exibido no SIAPS para Apuí: 9 eSF — 1 Ótimo, 5 Bom, 1 Suficiente, 2 Regular
    assert {k: _cvat(atual)[k] for k in ("otimo", "bom", "suficiente", "regular", "total")} == \
        {"otimo": 1, "bom": 5, "suficiente": 1, "regular": 2, "total": 9}
    qual_esf = next(x for x in atual["componentes"] if x["origem"] == "QUALIDADE" and x["tipo_equipe"] == "eSF")
    assert qual_esf["otimo"] == 9
    assert len(atual["indicadores_qualidade"]) == 15 and len(atual["dimensoes_cvat"]) == 2
    assert p["equidade"]["faixa_ied"] == "ESTRATO 2"
    assert p["ultima_sincronizacao"]["sucesso"] is True
    assert "graficos" not in str(p)
    textos = " ".join(a["texto"] for a in p["alertas"])
    assert "2 de 9 equipe(s) com classificação Regular" in textos


async def test_preserva_historico_e_registra_revisao_do_ms(ambiente, monkeypatch):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    _siaps_falso(monkeypatch)
    await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))
    r = (await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))).json()
    assert r["novo"] == [] and r["revisado"] == [] and len(r["sem_mudanca"]) == 3

    revisado = copy.deepcopy(REAL)
    item = next(i for i in revisado["2026Q1"]["classificacaoFinalComponente"] if i["tipoOrigem"] == "CVAT")
    item["qtdClassificacaoRegular"], item["qtdClassificacaoSuficiente"] = 1, 2
    _siaps_falso(monkeypatch, revisado)
    r = (await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))).json()
    assert r["revisado"] == ["2026Q1"]
    atual = (await c.get("/api/siaps-publico", headers=_h(tok))).json()["quadrimestres"][0]
    assert atual["versao"] == 2 and atual["revisado_pelo_ms"] and _cvat(atual)["regular"] == 1

    from sqlalchemy import func, select
    from models.siaps_publico import SiapsPublicoColeta
    async with ambiente["Session"]() as db:
        n = (await db.execute(select(func.count()).select_from(SiapsPublicoColeta)
                              .where(SiapsPublicoColeta.chave == "2026Q1"))).scalar_one()
    assert n == 2                                                    # versão original preservada


async def test_fonte_fora_do_ar_ou_vazia_nao_apaga_nada(ambiente, monkeypatch):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    _siaps_falso(monkeypatch)
    await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))

    _siaps_falso(monkeypatch, falhar=True)
    assert (await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))).status_code == 503
    p = (await c.get("/api/siaps-publico", headers=_h(tok))).json()
    assert len(p["quadrimestres"]) == 2
    assert p["ultima_sincronizacao"]["sucesso"] is False and "indisponível" in p["ultima_sincronizacao"]["erro"]

    _siaps_falso(monkeypatch, {"ied": {}})                          # SIAPS responde, mas sem resultado
    r = (await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))).json()
    assert r["sem_dados"] == ["2026Q1", "2025Q3"]
    assert _cvat((await c.get("/api/siaps-publico", headers=_h(tok))).json()["quadrimestres"][0])["regular"] == 2


async def test_isolamento_e_perfil(ambiente, monkeypatch):
    c = ambiente["client"]
    _siaps_falso(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/siaps-publico", headers=_h(tok_b))).json()["quadrimestres"] == []
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/siaps-publico/sincronizar", headers=_h(consulta))).status_code == 403


def test_alerta_de_piora_compara_so_contagens_publicadas():
    atual = {"quadrimestre": "2026Q1", "rotulo": "1º", "indicadores_qualidade": [], "dimensoes_cvat": [],
             "componentes": [{"componente": "Vínculo", "origem": "CVAT", "tipo_equipe": "eSF",
                              "otimo": 1, "bom": 5, "suficiente": 1, "regular": 2, "total": 9}]}
    anterior = {**atual, "rotulo": "3º/2025",
                "componentes": [{**atual["componentes"][0], "otimo": 2, "regular": 2}]}
    textos = [a["texto"] for a in sp.alertas([atual, anterior])]
    assert any("piorou" in t and "Ótimo 2→1" in t for t in textos)


async def test_job_diario_le_municipios_ativos(ambiente, monkeypatch):
    import database
    import scheduler
    _siaps_falso(monkeypatch)
    chamados = []
    original = sp.sincronizar

    async def espiao(db, mid, ibge):
        chamados.append(ibge)
        if ibge != "1300144":
            raise sp.SiapsIndisponivel("sem dados de teste")
        return await original(db, mid, ibge)

    monkeypatch.setattr(database, "AsyncSessionLocal", ambiente["Session"])
    monkeypatch.setattr(sp, "sincronizar", espiao)
    await scheduler._job_siaps_publico_oficial()
    assert sorted(chamados) == ["1300144", "1399991"]


# ── ERSUS IA ──────────────────────────────────────────────────────────────────

class _StreamFalso:
    def __init__(self, enviado: dict, texto: str, stop="end_turn"):
        self.enviado, self.texto, self.stop = enviado, texto, stop

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def get_final_message(self):
        return SimpleNamespace(stop_reason=self.stop, model="claude-opus-5-5",
                               content=[SimpleNamespace(type="thinking"), SimpleNamespace(type="text", text=self.texto)])


def _ia_falsa(monkeypatch, enviado: dict, texto="## Análise\nCVAT eSF com 2 equipes em Regular.", stop="end_turn"):
    class Cliente:
        def __init__(self, **k):
            self.messages = SimpleNamespace(stream=lambda **kw: (enviado.update(kw), _StreamFalso(enviado, texto, stop))[1])
    monkeypatch.setattr(siaps_ia.anthropic, "AsyncAnthropic", Cliente)
    monkeypatch.setattr(siaps_ia.settings, "ANTHROPIC_API_KEY", "teste")


async def test_ia_usa_so_dados_oficiais_captados(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    enviado: dict = {}
    _ia_falsa(monkeypatch, enviado)

    # sem nada captado, a IA não responde (não inventa)
    r = await c.post("/api/siaps-ia/analisar", json={"modo": "analise"}, headers=_h(tok))
    assert r.status_code == 503 and "Ainda não há resultados oficiais" in r.json()["detail"]
    assert enviado == {}

    _siaps_falso(monkeypatch)
    await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))
    r = (await c.post("/api/siaps-ia/analisar", json={"modo": "plano"}, headers=_h(tok))).json()
    assert r["resposta"].startswith("## Análise") and r["modelo"] == "claude-opus-5-5"
    assert any("2026Q1" in f for f in r["fontes"]) and any("IED ESTRATO 2" in f for f in r["fontes"])
    assert await _auditoria(S, "SIAPS_IA_CONSULTA")

    assert enviado["model"] == "claude-opus-5-5"
    assert "Nunca estime, simule ou complete números" in enviado["system"]
    conteudo = enviado["messages"][0]["content"]
    dados = json.loads(conteudo.split("<dados_oficiais>\n")[1].split("\n</dados_oficiais>")[0])
    cvat = _cvat(dados["avaliacao_quadrimestre_siaps_publico"]["quadrimestres"][0])
    assert (cvat["otimo"], cvat["bom"], cvat["suficiente"], cvat["regular"]) == (1, 5, 1, 2)
    assert dados["resultados_mensais_por_equipe_relatorio_siaps"] == "sem dados importados"
    assert "plano de ação" in conteudo


async def test_ia_pergunta_vazia_recusa_e_sem_chave(ambiente, monkeypatch):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.post("/api/siaps-ia/analisar", json={"modo": "pergunta", "pergunta": " "}, headers=_h(tok))).status_code == 422
    monkeypatch.setattr(siaps_ia.settings, "ANTHROPIC_API_KEY", "")
    r = await c.post("/api/siaps-ia/analisar", json={"modo": "analise"}, headers=_h(tok))
    assert r.status_code == 503 and "não está configurada" in r.json()["detail"]

    _siaps_falso(monkeypatch)
    await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))
    _ia_falsa(monkeypatch, {}, stop="refusal")
    r = await c.post("/api/siaps-ia/analisar", json={"modo": "pergunta", "pergunta": "Como estamos?"}, headers=_h(tok))
    assert r.status_code == 503 and "não pôde responder" in r.json()["detail"]
