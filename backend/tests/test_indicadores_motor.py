"""Motor de indicadores (etapa 1): resultado oficial do SIAPS por equipe/INE gravado nas tabelas
do módulo Indicadores APS, com catálogo versionado, meta só quando confirmada, GAP, rastreabilidade,
"Atenção necessária", reimportação sem duplicar e isolamento entre municípios."""
from __future__ import annotations

from sqlalchemy import func, select

from models.indicadores_aps import IndicadorConfig, ResultadoCvatMensal, ResultadoMensalSiaps, SincronizacaoLog
from services import indicadores_motor as motor
from tests.test_equipes_siaps import _siaps_falso
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)
from tests.test_siaps_relatorios import _cvat, _importar, _qualidade_esf_xlsx, _qualidade_esfr


def test_faixa_c1_confirmada_e_demais_pendentes():
    assert [motor.classificar("C1", v) for v in (5, 20, 46.14, 51.65, 70, 70.01)] == \
        ["regular", "suficiente", "bom", "otimo", "otimo", "regular"]
    assert motor.classificar("C2", 90) is None                     # sem faixa confirmada → não inventa
    assert motor.tipo_equipe("R1") == "eSFR" and motor.tipo_equipe("CR2") == "eCR" and motor.tipo_equipe("B3") == "eSB"


async def test_importacao_alimenta_motor_com_rastreabilidade(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = (await _importar(c, tok, ("cvat.csv", _cvat()), ("esfr.csv", _qualidade_esfr()),
                         ("esf.xlsx", _qualidade_esf_xlsx()))).json()["resultados"]
    assert [x["processamento"]["incluidos"] for x in r] == [2, 1, 1]

    async with S() as db:
        cachoeira = (await db.execute(select(ResultadoMensalSiaps).where(
            ResultadoMensalSiaps.indicador_codigo == "C1"))).scalar_one()
        assert (cachoeira.equipe_ine, cachoeira.numerador, cachoeira.denominador, cachoeira.resultado_pct) == \
            ("0000007072", 299, 648, 46.14)
        assert (cachoeira.meta, cachoeira.classificacao, cachoeira.situacao) == (50.0, "bom", "preliminar")
        assert cachoeira.payload_original["indicador_fonte"] == "Mais Acesso à APS"     # dado bruto guardado
        areal = (await db.execute(select(ResultadoMensalSiaps).where(
            ResultadoMensalSiaps.indicador_codigo == "R1"))).scalar_one()
        assert (areal.equipe_tipo, areal.meta, areal.classificacao) == ("eSFR", None, None)
        lib = (await db.execute(select(ResultadoCvatMensal).where(
            ResultadoCvatMensal.equipe_nome == "LIBERDADE"))).scalar_one()
        assert (lib.var_A, lib.var_K, lib.pontuacao, lib.classificacao) == (None, 790, 10.0, "otimo")
        assert (await db.execute(select(func.count(IndicadorConfig.id)))).scalar() == 32   # 31 oficiais + CVAT
        logs = (await db.execute(select(SincronizacaoLog))).scalars().all()
        assert len(logs) == 3 and all(l.sucesso and l.metodo == "arquivo" for l in logs)

    # reimportar não duplica (atualiza)
    r = (await _importar(c, tok, ("esf.xlsx", _qualidade_esf_xlsx()))).json()["resultados"][0]
    assert (r["processamento"]["incluidos"], r["processamento"]["atualizados"]) == (0, 1)
    async with S() as db:
        assert (await db.execute(select(func.count(ResultadoMensalSiaps.id)))).scalar() == 2


async def test_resultados_por_equipe_com_meta_gap_e_atencao(ambiente, monkeypatch):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    _siaps_falso(monkeypatch)
    await c.post("/api/siaps-relatorios/equipes/sincronizar", headers=_h(tok))
    await _importar(c, tok, ("cvat.csv", _cvat()), ("esfr.csv", _qualidade_esfr()), ("esf.xlsx", _qualidade_esf_xlsx()))

    d = (await c.get("/api/siaps-relatorios/resultados", headers=_h(tok))).json()
    assert d["competencia"] == "2026-07"
    c1 = next(l for l in d["linhas"] if l["indicador"] == "C1")
    assert (c1["resultado"], c1["meta"], c1["gap"], c1["meta_status"]) == (46.14, 50.0, -3.86, "confirmada")
    r1 = next(l for l in d["linhas"] if l["indicador"] == "R1")
    assert (r1["meta"], r1["gap"], r1["meta_status"]) == (None, None, "pendente_parametrizacao")
    assert d["cards"]["abaixo_da_meta"] == 1 and d["cards"]["sem_meta_parametrizada"] == 1
    assert d["cards"]["equipes_monitoradas"] == 5 and d["ultima_sincronizacao"]["sucesso"] is True
    tipos = {(a["tipo"], a["equipe"]) for a in d["atencao_necessaria"]}
    assert ("abaixo_da_meta", "CACHOEIRA") in tipos
    assert ("sem_dados", "ESTRADA NOVA") in tipos and ("sem_dados", "0002 AREAL") in tipos

    # filtros por INE, indicador e tipo
    d = (await c.get("/api/siaps-relatorios/resultados?ine=7048", headers=_h(tok))).json()
    assert {l["equipe"] for l in d["linhas"]} == {"AREAL"}
    d = (await c.get("/api/siaps-relatorios/resultados?indicador=CVAT", headers=_h(tok))).json()
    assert {l["indicador"] for l in d["linhas"]} == {"CVAT"} and len(d["linhas"]) == 2
    d = (await c.get("/api/siaps-relatorios/resultados?tipo=eSFR", headers=_h(tok))).json()
    assert {l["tipo"] for l in d["linhas"]} == {"eSFR"}


async def test_isolamento_e_reprocessamento(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _importar(c, tok, ("esf.xlsx", _qualidade_esf_xlsx()))
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/siaps-relatorios/resultados", headers=_h(tok_b))).json()["situacao_dado"] == "nao_disponivel"

    # reprocessar (idempotente) e perfil de consulta sem permissão
    async with S() as db:
        await db.execute(ResultadoMensalSiaps.__table__.delete())
        await db.commit()
    r = (await c.post("/api/siaps-relatorios/reprocessar", headers=_h(tok))).json()
    assert r["relatorios"] == 1 and await _auditoria(S, "INDICADORES_REPROCESSADOS")
    async with S() as db:
        assert (await db.execute(select(func.count(ResultadoMensalSiaps.id)))).scalar() == 1
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/siaps-relatorios/reprocessar", headers=_h(consulta))).status_code == 403


async def test_referencia_antiga_identificada(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/pec/indicadores/2026-07", headers=_h(tok))).json()
    assert d["fonte"].startswith("REFERÊNCIA MUNICIPAL (Abr/2026) — não é a competência selecionada")


async def test_historico_da_equipe_e_isolamento(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _importar(c, tok, ("jul.csv", _cvat()), ("jun.csv", _cvat(comp="JUN/26")))
    h = (await c.get("/api/siaps-relatorios/resultados/historico?ine=7099", headers=_h(tok))).json()
    assert [p["competencia"] for p in h["series"]["CVAT"]] == ["2026-06", "2026-07"]
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/siaps-relatorios/resultados/historico?ine=7099", headers=_h(tok_b))).json()["series"] == {}
