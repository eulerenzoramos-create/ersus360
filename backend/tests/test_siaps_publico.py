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


# ── Boas Práticas (aba existente, sem lista fixa) ─────────────────────────────

async def test_boas_praticas_vem_dos_resultados_oficiais(ambiente, monkeypatch):
    from models.siaps_relatorio import SiapsRelatorio
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    vazio = (await c.get("/api/siaps/boas-praticas", headers=_h(tok))).json()
    assert vazio["situacao_dado"] == "nao_disponivel" and vazio["boas_praticas"] == []
    assert "LIBERDADE" not in str(vazio) and "Previne" not in str(vazio)      # lista fixa antiga não volta

    _siaps_falso(monkeypatch)
    await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))
    async with S() as db:
        db.add(SiapsRelatorio(
            municipio_id=ambiente["ids"]["apui"], municipio_ibge="1300144", componente="cvat", indicador="",
            competencia="2026-07", tipo_equipe="eAP, eSF", dado_preliminar=True, colunas="[]",
            linhas=json.dumps([{"ubs": "UBS A", "equipe": "EQUIPE OTIMA", "pontuacao": 9.4},
                               {"ubs": "UBS B", "equipe": "EQUIPE MEDIA", "pontuacao": 7.2},
                               {"ubs": "UBS C", "equipe": "EQUIPE BAIXA", "pontuacao": 3.1}])))
        await db.commit()

    bp = (await c.get("/api/siaps/boas-praticas", headers=_h(tok))).json()
    titulos = [b["titulo"] for b in bp["boas_praticas"]]
    assert "Equipe EQUIPE OTIMA — Vínculo Ótimo (9,40)" in titulos
    assert "Equipe EQUIPE BAIXA — Vínculo Regular (3,10)" in titulos
    assert not any("EQUIPE MEDIA" in t for t in titulos)
    assert "Cuidado da Pessoa com Hipertensão — todas as 9 equipes eSF Ótimo" in titulos
    assert "Taxa de exodontias na APS — 4 equipe(s) eSB em Regular" in titulos
    assert any(t.startswith("Escovação Supervisionada na APS — 2 equipe(s)") for t in titulos)
    assert bp["destaques"] == sum(b["destaque"] for b in bp["boas_praticas"])
    assert all(b["fonte"] for b in bp["boas_praticas"])
    assert bp["boas_praticas"][0]["destaque"] is True                       # destaques primeiro

    # competência escolhida na tela: só o CVAT daquele mês e o quadrimestre que o contém
    jul = (await c.get("/api/siaps/boas-praticas", params={"competencia": "2026-07"}, headers=_h(tok))).json()
    assert jul["quadrimestre"] == "2026Q2" and "Equipe EQUIPE OTIMA — Vínculo Ótimo (9,40)" in [b["titulo"] for b in jul["boas_praticas"]]
    assert not any("Avaliação do Quadrimestre" in f for f in jul["fontes"])          # 2026Q2 não está nos dados de teste
    abr = (await c.get("/api/siaps/boas-praticas", params={"competencia": "2026-04"}, headers=_h(tok))).json()
    assert abr["quadrimestre"] == "2026Q1" and not any("EQUIPE OTIMA" in b["titulo"] for b in abr["boas_praticas"])
    assert any("Avaliação do Quadrimestre" in f for f in abr["fontes"])
    out = (await c.get("/api/siaps/boas-praticas", params={"competencia": "2026-10"}, headers=_h(tok))).json()
    assert out["situacao_dado"] == "nao_disponivel" and out["total"] == 0 and out["quadrimestre"] == "2026Q3"


# ── Captura assistida da área logada (linhas reais de Apuí, Jul/26, capturadas em 17/10/2026) ──

def _captura(linhas=None, **extra):
    from services import siaps_captura as sc
    return {"formato": sc.FORMATO, "municipio_ibge": "130014", "capturado_em": "2026-10-17T20:29:00Z",
            "colunas": sc.COLUNAS, **extra, "linhas": linhas if linhas is not None else [
        ["202607", "3320138", "UBS IRMA ELIZABETE", "0000007072", "CACHOEIRA", "eSF", "Mais Acesso à Atenção Primária à Saúde", 46.14, 299, 648, "BOM"],
        ["202607", "2013304", "UBS PADRE FALIERO BONCI", "0000007056", "KENNEDY", "eSF", "Mais Acesso à Atenção Primária à Saúde", 60.75, 226, 372, "ÓTIMO"],
        ["202605", "2013304", "UBS PADRE FALIERO BONCI", "0000007056", "KENNEDY", "eSF", "Mais Acesso à Atenção Primária à Saúde", 70.89, 224, 316, "REGULAR"],
        ["202607", "3320138", "UBS IRMA ELIZABETE", "0000007072", "CACHOEIRA", "eSF", "Cuidado Integral à Saúde da Mulher", 84.68, None, None, "ÓTIMO"],
        ["202607", "3320138", "UBS IRMA ELIZABETE", "0001773925", "0010 CACHOEIRA", "eSB", "Escovação Supervisionada na APS", 0, 0, 199, "REGULAR"],
        ["202607", "9942122", "UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA", "0001774042", "0009 ESTRADA NOVA", "eSB", "Escovação Supervisionada na APS", 83.87, 78, 93, "ÓTIMO"],
        ["202607", "2013290", "UBS EDUARDO BIAZIN", "0000007048", "AREAL", "eSFR", "Mais Acesso à  equipe de Saúde da Família Ribeirinha (eSFR)", 38.62, 314, 813, "BOM"],
        ["202607", "2013312", "UBS ANIZIO FERREIRA DA SILVA", "0002449927", "EMULTI ANIZIO", "eMulti", "Média de atendimentos da eMulti por pessoa", 2.16, 1768, 817, "BOM"],
    ]}


def test_codigo_do_indicador_por_tipo_de_equipe():
    from services.siaps_captura import codigo_do_indicador as c
    assert c("Mais Acesso à Atenção Primária à Saúde", "eSF") == "C1"
    assert c("Cuidado da Gestante e da Puérpera", "eSF") == "C3"
    assert c("Cuidado Integral à Saúde da Mulher", "eSF") == "C7"
    assert c("Cuidado da mulher na prevenção do câncer realizado pela equipe de Saúde da Família Ribeirinha (eSFR)", "eSFR") == "R6"
    assert c("Cuidado na Gestação e Puerpério realizado pela equipe de Saúde da Família Ribeirinha (eSFR)", "eSFR") == "R3"
    assert c("1ª Consulta Odontológica programada na APS", "eSB") == "B1"
    assert c("Tratamento Odontológico concluído na APS", "eSB") == "B2"
    assert c("Tratamento Restaurador Atraumático na APS", "eSB") == "B6"
    assert c("Procedimentos Odontológicos preventivos na APS", "eSB") == "B5"
    assert c("Ações interprofissionais realizadas pela eMulti na APS", "eMulti") == "M2"


async def test_captura_grava_classificacao_oficial_e_alimenta_boas_praticas(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = (await c.post("/api/siaps-publico/captura", json=_captura(), headers=_h(tok))).json()
    assert r["competencias"] == ["2026-05", "2026-07"] and r["inseridos"] == 8 and r["sem_codigo"] == []
    assert await _auditoria(S, "SIAPS_CAPTURA_IMPORTADA")
    st = (await c.get("/api/siaps-publico/captura", headers=_h(tok))).json()
    assert [x["competencia"] for x in st["competencias"]] == ["2026-05", "2026-07"]

    from sqlalchemy import select
    from models.indicadores_aps import ResultadoMensalSiaps
    async with S() as db:
        k = (await db.execute(select(ResultadoMensalSiaps).where(
            ResultadoMensalSiaps.equipe_ine == "0000007056", ResultadoMensalSiaps.competencia == "2026-05"))).scalar_one()
    # 70,89 em Mais Acesso é REGULAR para o SIAPS (passou do limite) — vale a classificação oficial
    assert (k.indicador_codigo, k.resultado_pct, k.classificacao, k.numerador, k.denominador) == ("C1", 70.89, "regular", 224, 316)

    # reimportar a mesma captura atualiza, não duplica
    r = (await c.post("/api/siaps-publico/captura", json=_captura(), headers=_h(tok))).json()
    assert r["inseridos"] == 0 and r["atualizados"] == 8

    bp = (await c.get("/api/siaps/boas-praticas", headers=_h(tok))).json()
    tit = {b["titulo"]: b for b in bp["boas_praticas"]}
    esc = tit["Escovação Supervisionada na APS — 1 de 2 equipe(s) eSB em Regular"]
    assert esc["tipo"] == "alerta_critico" and "0010 CACHOEIRA" in esc["descricao"]
    assert [x["classificacao"] for x in esc["por_equipe"]] == ["otimo", "regular"]
    assert "Mais Acesso à Atenção Primária à Saúde — 1 de 2 equipe(s) eSF Ótimo" in tit   # Jul/26: nenhuma em Regular
    assert any("Qualidade por equipe Jul/2026" in f for f in bp["fontes"])


async def test_captura_recusa_formato_errado_outro_municipio_e_perfil(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.post("/api/siaps-publico/captura", json={"linhas": []}, headers=_h(tok))).status_code == 422
    # captura de outro município: a guarda multi-município já barra (403) antes da validação (422)
    assert (await c.post("/api/siaps-publico/captura", json=_captura(municipio_ibge="139999"), headers=_h(tok))).status_code in (403, 422)
    ruim = _captura([["202607", "1", "U", "7072", "X", "eSF", "Mais Acesso", 1, 1, 1, "EXCELENTE"]])
    assert (await c.post("/api/siaps-publico/captura", json=ruim, headers=_h(tok))).status_code == 422
    extra = _captura([["202607", "1", "U", "7072", "X", "eSF", "Mais Acesso", 1, 1, 1, "BOM", "CPF 123"]])
    assert (await c.post("/api/siaps-publico/captura", json=extra, headers=_h(tok))).status_code == 422
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/siaps-publico/captura", json=_captura(), headers=_h(consulta))).status_code == 403
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    await c.post("/api/siaps-publico/captura", json=_captura(), headers=_h(tok))
    assert (await c.get("/api/siaps-publico/captura", headers=_h(tok_b))).json()["competencias"] == []


async def test_motor_nao_sobrescreve_classificacao_capturada(ambiente):
    from models.indicadores_aps import ResultadoMensalSiaps
    from models.siaps_relatorio import SiapsRelatorio
    from services.indicadores_motor import normalizar_relatorio
    from sqlalchemy import select
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/siaps-publico/captura", json=_captura(), headers=_h(tok))
    async with S() as db:
        rel = SiapsRelatorio(municipio_id=ambiente["ids"]["apui"], municipio_ibge="1300144", componente="qualidade",
                             indicador="Mais Acesso à APS", competencia="2026-05", tipo_equipe="eAP, eSF",
                             dado_preliminar=True, colunas=json.dumps(["NM", "DN", "PONTUAÇÃO"]),
                             linhas=json.dumps([{"ine": "0000007056", "equipe": "KENNEDY", "sigla": "eSF", "cnes": "2013304",
                                                 "ubs": "U", "valores": {"NM": 224, "DN": 316}, "pontuacao": 70.89}]))
        db.add(rel)
        await db.commit()
        await normalizar_relatorio(db, rel)
        await db.commit()
        k = (await db.execute(select(ResultadoMensalSiaps).where(
            ResultadoMensalSiaps.equipe_ine == "0000007056", ResultadoMensalSiaps.competencia == "2026-05"))).scalar_one()
    assert k.classificacao == "regular" and "captura" in k.fonte


async def test_tabela_por_equipe_da_aba_componente_qualidade(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.get("/api/siaps-publico/captura/resultados", headers=_h(tok))).json()["situacao_dado"] == "nao_disponivel"
    await c.post("/api/siaps-publico/captura", json=_captura(), headers=_h(tok))
    t = (await c.get("/api/siaps-publico/captura/resultados", headers=_h(tok))).json()
    assert t["competencia"] == "2026-07" and t["competencias"] == ["2026-07", "2026-05"]
    assert [x["tipo_equipe"] for x in t["tipos"]] == ["eSF", "eSFR", "eSB", "eMulti"]
    esf = t["tipos"][0]
    assert [i["codigo"] for i in esf["indicadores"]] == ["C1", "C7"]
    cach = next(e for e in esf["equipes"] if e["equipe"] == "CACHOEIRA")
    assert cach["valores"]["C1"] == {"resultado": 46.14, "numerador": 299, "denominador": 648, "classificacao": "bom"}
    maio = (await c.get("/api/siaps-publico/captura/resultados", params={"competencia": "2026-05"}, headers=_h(tok))).json()
    assert maio["tipos"][0]["equipes"][0]["valores"]["C1"]["classificacao"] == "regular"     # KENNEDY 70,89


# ── Avaliação quadrimestral oficial por equipe (área logada) — itens reais de Apuí, 17/10/2026 ──────────

AREAL_Q1 = {"quadrimestre": "2026Q1", "componente": 120, "sg_equipe": "eSFR", "ine": "0000007048", "equipe": "AREAL",
            "cnes": "2013290", "ubs": "UBS EDUARDO BIAZIN", "nota_final": 8, "classificacao": "ÓTIMO",
            "equipe_valida": "S", "homologada": "S", "indicadores": json.dumps({
                "131": {"SG": "R1", "NOTA": 0.5, "PESO": 1, "CONCEITO": 0.5, "CLASSIFICACAO": "SUFICIENTE", "SCORE": 26.34,
                        "DN": 1845, "NM": 486, "LSDN": {"MES1": 26, "MES2": 229, "MES3": 1085, "MES4": 505}},
                "132": {"SG": "R2", "NOTA": 1, "PESO": 2, "CONCEITO": 0.5, "CLASSIFICACAO": "SUFICIENTE", "SCORE": 45},
                "133": {"SG": "R3", "NOTA": 2, "PESO": 2, "CONCEITO": 1, "CLASSIFICACAO": "ÓTIMO", "SCORE": 79.17},
                "134": {"SG": "R4", "NOTA": 1.5, "PESO": 1.5, "CONCEITO": 1, "CLASSIFICACAO": "ÓTIMO", "SCORE": 85.96},
                "135": {"SG": "R5", "NOTA": 1.5, "PESO": 1.5, "CONCEITO": 1, "CLASSIFICACAO": "ÓTIMO", "SCORE": 90.14},
                "136": {"SG": "R6", "NOTA": 1.5, "PESO": 2, "CONCEITO": 0.75, "CLASSIFICACAO": "BOM", "SCORE": 68.17,
                        "LSDN": {"BPA": {"MES1": 293, "MES2": 292}, "BPB": {"MES1": 73}}},
                "NTFINAL": 8, "CLASSIFICACAO": "ÓTIMO"})}
EMULTI_Q1 = {"quadrimestre": "2026Q1", "componente": 120, "sg_equipe": "eMulti", "ine": "0002449927",
             "equipe": "EMULTI ANIZIO", "cnes": "2013312", "ubs": "UBS ANIZIO FERREIRA DA SILVA", "nota_final": 7,
             "classificacao": "BOM", "equipe_valida": "S", "homologada": "S", "indicadores": json.dumps({
                 "117": {"SG": "M1", "NOTA": 3, "PESO": 6, "CONCEITO": 0.5, "CLASSIFICACAO": "SUFICIENTE", "SCORE": 1.65},
                 "118": {"SG": "M2", "NOTA": 4, "PESO": 4, "CONCEITO": 1, "CLASSIFICACAO": "ÓTIMO", "SCORE": 5.9}})}
ACARI_CVAT_Q2 = {"quadrimestre": "2026Q2", "componente": 119, "sg_equipe": "eSF", "ine": "0000007064", "equipe": "ACARI",
                 "cnes": "2013312", "ubs": "UBS ANIZIO FERREIRA DA SILVA", "nota_final": 8.25, "classificacao": "BOM",
                 "equipe_valida": "S", "homologada": "S", "indicadores": json.dumps({
                     "101": {"LSSCORE": {"MES1": 3, "MES2": 3, "MES3": 3}, "SCORE": 3, "CLASSIFICACAO": "ÓTIMO"},
                     "102": {"LSSCORE": {"MES1": 5.25}, "SCORE": 5.25, "NPS": 0, "CLASSIFICACAO": "BOM"},
                     "NTFINAL": 8.25, "CLASSIFICACAO": "BOM"})}


async def test_quadrimestral_oficial_por_equipe_todas_modalidades(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.get("/api/siaps-publico/quadrimestral", headers=_h(tok))).json()["situacao_dado"] == "nao_disponivel"
    _siaps_falso(monkeypatch)
    await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))          # área pública: 2026Q1 e 2025Q3

    r = (await c.post("/api/siaps-publico/captura", headers=_h(tok),
                      json=_captura([], quadrimestral=[AREAL_Q1, EMULTI_Q1, ACARI_CVAT_Q2]))).json()
    assert r["quadrimestral"] == {"novos": 3, "revisados": [], "sem_mudanca": 0}

    q = (await c.get("/api/siaps-publico/quadrimestral", headers=_h(tok))).json()
    assert q["quadrimestre"] == "2026Q2" and q["situacao"] == "preliminar"          # Q2 ainda não publicado
    q1 = (await c.get("/api/siaps-publico/quadrimestral", params={"quadrimestre": "2026Q1"}, headers=_h(tok))).json()
    assert q1["situacao"] == "publicado"
    areal = next(g for g in q1["grupos"] if g["sg_equipe"] == "eSFR")["equipes"][0]
    assert (areal["nota_final"], areal["classificacao"]) == (8, "otimo")
    r1 = next(i for i in areal["indicadores"] if i["codigo"] == "R1")
    assert (r1["peso"], r1["conceito"], r1["classificacao"], r1["score"]) == (1, 0.5, "suficiente", 26.34)
    r6 = next(i for i in areal["indicadores"] if i["codigo"] == "R6")
    assert r6["mensal_dn"] == {"BPA": {"MES1": 293, "MES2": 292}, "BPB": {"MES1": 73}}

    # recaptura igual não duplica; MS revisando a nota cria versão nova e guarda a anterior
    r = (await c.post("/api/siaps-publico/captura", headers=_h(tok), json=_captura([], quadrimestral=[AREAL_Q1]))).json()
    assert r["quadrimestral"]["sem_mudanca"] == 1
    revisado = {**AREAL_Q1, "nota_final": 7.5, "classificacao": "BOM"}
    r = (await c.post("/api/siaps-publico/captura", headers=_h(tok), json=_captura([], quadrimestral=[revisado]))).json()
    assert r["quadrimestral"]["revisados"] == ["2026Q1 QUALIDADE AREAL: 8→7.5 (otimo→bom)"]
    from sqlalchemy import func, select
    from models.siaps_publico import SiapsQuadrimestreEquipe
    async with S() as db:
        assert (await db.execute(select(func.count()).select_from(SiapsQuadrimestreEquipe)
                                 .where(SiapsQuadrimestreEquipe.equipe == "AREAL"))).scalar_one() == 2


async def test_conferencia_entre_fontes_e_integridade_pela_nota_tecnica(ambiente, monkeypatch):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    _siaps_falso(monkeypatch)
    await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))
    await c.post("/api/siaps-publico/captura", headers=_h(tok), json=_captura([], quadrimestral=[AREAL_Q1, EMULTI_Q1]))
    conf = (await c.get("/api/siaps-publico/conferencia", headers=_h(tok))).json()
    por = {(i["quadrimestre"], i["componente"], i["sg_equipe"]): i for i in conf["itens"]}
    # área pública Q1/26: eMulti Qualidade = 0/1/0/0 (Bom) e a captura tem EMULTI ANIZIO Bom → confere
    assert por[("2026Q1", "QUALIDADE", "eMulti")]["situacao"] == "confere"
    # eSF só existe na área pública (não capturado aqui) → sem comparação, nunca "validado"
    assert por[("2026Q1", "QUALIDADE", "eSF")]["situacao"] == "sem_comparacao"
    assert conf["integridade"] == []                                   # AREAL e EMULTI fecham com NT 8 e 12/2026

    errado = {**EMULTI_Q1, "nota_final": 9}                            # soma 7 ≠ 9 e faixa ótimo ≠ bom
    await c.post("/api/siaps-publico/captura", headers=_h(tok), json=_captura([], quadrimestral=[errado]))
    conf = (await c.get("/api/siaps-publico/conferencia", headers=_h(tok))).json()
    textos = " | ".join(p["problema"] for p in conf["integridade"])
    assert "Soma das notas dos indicadores = 7, nota final publicada = 9" in textos
    assert "faixa da Nota Técnica é otimo" in textos


def test_faixas_e_pesos_das_notas_tecnicas():
    from services import siaps_quadrimestral as sq
    assert [sq.faixa_componente_iii(n) for n in (7.6, 7.5, 5, 4.9, 2.5)] == ["otimo", "bom", "bom", "suficiente", "regular"]
    assert [sq.faixa_componente_ii(n) for n in (8.6, 8.5, 7, 6.9, 4.9)] == ["otimo", "bom", "bom", "suficiente", "regular"]
    for grupo in (["C1", "C2", "C3", "C4", "C5", "C6", "C7"], ["B1", "B2", "B3", "B4", "B5", "B6"], ["M1", "M2"],
                  ["R1", "R2", "R3", "R4", "R5", "R6"], ["CR1", "CR2", "CR3", "CR4"], ["P1", "P2", "P3", "P4", "P5", "P6"]):
        assert sum(sq.PESOS_NT[k] for k in grupo) == 10


# ── Painel geral, catálogo, visão por indicador, abrangência (eGestor — outubro/2026) ────────────────────

def test_catalogo_oficial_tem_todas_as_modalidades_e_pesos_das_nts():
    from services.siaps_catalogo import catalogo
    cat = {c["codigo"]: c for c in catalogo()}
    assert len(cat) == 31 and {c["modalidades"] for c in cat.values()} >= {"eSF, eAP", "eSB", "eMulti", "eSFR", "eCR", "eAPP"}
    assert cat["R4"]["peso_quadrimestral"] == 1.5 and cat["R4"]["nota_tecnica"].startswith("Nota Técnica nº 12/2026")
    assert cat["B4"]["nota_tecnica"].startswith("Nota Técnica nº 8/2026") and "6-a-12-anos" in cat["B4"]["ficha_tecnica"]
    assert all(c["ficha_tecnica"].startswith("https://www.gov.br/saude/") for c in cat.values())


def test_defasagem_da_competencia():
    from datetime import date
    from services.siaps_painel_geral import defasagem_meses
    assert defasagem_meses("2026-07", date(2026, 10, 17)) == 3          # jul/26 publicado; outubro em andamento
    assert defasagem_meses(None) is None


async def test_painel_geral_separa_mensal_de_quadrimestral(ambiente, monkeypatch):
    from datetime import date
    from services import siaps_painel_geral
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    _siaps_falso(monkeypatch)
    await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))
    await c.post("/api/siaps-publico/captura", headers=_h(tok), json=_captura(quadrimestral=[AREAL_Q1, EMULTI_Q1]))

    original = siaps_painel_geral.montar
    monkeypatch.setattr(siaps_painel_geral, "montar",
                        lambda *a, **k: original(*a, **{**k, "hoje": date(2026, 10, 17)}))
    p = (await c.get("/api/siaps-publico/painel-geral", headers=_h(tok))).json()
    m = p["monitoramento_mensal"]
    assert m["competencia"] == "2026-07" and m["defasagem_meses"] == 3 and m["situacao"].startswith("preliminar")
    assert p["mes_corrente"] == "outubro/2026 (em andamento)"
    assert any(i["codigo"] == "B4" and i["equipes"] == ["0010 CACHOEIRA"] for i in m["indicadores_com_regular"])
    q = p["avaliacao_quadrimestral"]
    assert q["publicado"] == "2026Q1" and q["por_equipe_mais_recente"] == "2026Q1" and q["por_equipe_situacao"] == "publicado"
    assert [h["quadrimestre"] for h in q["historico"]] == ["2025Q3", "2026Q1"]
    assert {i["codigo"] for i in p["indisponiveis"]} >= {"C2", "C3"}       # eSF sem C2/C3 na captura de teste
    assert p["conferencia"]["confere"] >= 1
    so_esb = (await c.get("/api/siaps-publico/painel-geral", params={"modalidade": "eSB"}, headers=_h(tok))).json()
    assert {i["sg_equipe"] for i in so_esb["monitoramento_mensal"]["indicadores_com_regular"]} == {"eSB"}


async def test_visao_por_indicador_e_serie(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/siaps-publico/captura", json=_captura(), headers=_h(tok))
    v = (await c.get("/api/siaps-publico/captura/indicadores", headers=_h(tok))).json()
    c1 = next(b for b in v["indicadores"] if b["codigo"] == "C1")
    assert c1["catalogo"]["nome"] == "Mais acesso à APS" and c1["contagem"]["otimo"] == 1 and c1["contagem"]["bom"] == 1
    assert {e["ine"] for e in c1["equipes"]} == {"0000007072", "0000007056"}
    s = (await c.get("/api/siaps-publico/captura/serie", params={"codigo": "C1"}, headers=_h(tok))).json()
    assert s["competencias"] == ["2026-05", "2026-07"]
    kennedy = next(e for e in s["equipes"] if e["equipe"] == "KENNEDY")
    assert kennedy["valores"]["2026-05"]["classificacao"] == "regular" and kennedy["valores"]["2026-07"]["classificacao"] == "otimo"


async def test_correcao_do_ms_guarda_valor_anterior(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/siaps-publico/captura", json=_captura(), headers=_h(tok))
    corrigida = _captura()
    corrigida["linhas"][4] = ["202607", "3320138", "UBS IRMA ELIZABETE", "0001773925", "0010 CACHOEIRA", "eSB",
                              "Escovação Supervisionada na APS", 4.5, 9, 199, "SUFICIENTE"]        # B4 corrigido (SIAPS 2.1.2)
    r = (await c.post("/api/siaps-publico/captura", json=corrigida, headers=_h(tok))).json()
    assert r["corrigidos_pelo_ms"] == ["2026-07 0010 CACHOEIRA B4: 0→4.5 (regular→suficiente)"]
    s = (await c.get("/api/siaps-publico/captura/serie", params={"codigo": "B4"}, headers=_h(tok))).json()
    assert next(e for e in s["equipes"] if e["equipe"] == "0010 CACHOEIRA")["valores"]["2026-07"]["corrigido_pelo_ms"] is True


async def test_abrangencia_usa_homologadas_validas_oficiais(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/siaps-publico/captura", headers=_h(tok), json=_captura([], quadrimestral=[AREAL_Q1, EMULTI_Q1]))
    a = (await c.get("/api/siaps/abrangencia", headers=_h(tok))).json()
    assert a["equipes_homologadas"]["eSFR"] == 1 and a["equipes_validas_componentes"]["eMulti"] == 1
    assert a["equipes_validas_componentes"]["eSF"] == 0                 # sem eSF na captura de teste: não usa a referência fixa
    assert a.get("homologadas_fonte", "").endswith("2026Q1")


def test_rotas_live_nao_duplicadas():
    from main import app
    caminhos = [r.path for r in app.routes if getattr(r, "path", "").startswith("/api/siaps/live/")]
    assert len(caminhos) == len(set(caminhos))


async def test_conferencia_explica_equipe_nao_valida_contada_na_area_publica(ambiente, monkeypatch):
    # caso real Apuí Q1/2025 eSB: área pública 1/6/1/1; 0008 TRES ESTADOS Regular, homologada e NÃO válida
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    dados = copy.deepcopy(REAL)
    dados["2026Q1"]["classificacaoFinalComponente"] = [
        {**i, "qtdClassificacaoOtimo": 0, "qtdClassificacaoBom": 1, "qtdClassificacaoSuficiente": 0, "qtdClassificacaoRegular": 1}
        if i["sgEquipe"] == "eMulti" else i for i in dados["2026Q1"]["classificacaoFinalComponente"]]
    _siaps_falso(monkeypatch, dados)
    await c.post("/api/siaps-publico/sincronizar", headers=_h(tok))
    nao_valida = {**EMULTI_Q1, "ine": "0009999999", "equipe": "EMULTI TESTE", "nota_final": 2.5, "classificacao": "REGULAR",
                  "equipe_valida": "N", "indicadores": json.dumps({})}
    await c.post("/api/siaps-publico/captura", headers=_h(tok), json=_captura([], quadrimestral=[EMULTI_Q1, nao_valida]))
    conf = (await c.get("/api/siaps-publico/conferencia", headers=_h(tok))).json()
    item = next(i for i in conf["itens"] if (i["quadrimestre"], i["componente"], i["sg_equipe"]) == ("2026Q1", "QUALIDADE", "eMulti"))
    assert item["situacao"] == "confere" and "EMULTI TESTE (regular)" in item["nota"]
