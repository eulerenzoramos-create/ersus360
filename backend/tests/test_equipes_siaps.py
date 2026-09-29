"""Equipes pela API pública do SIAPS (sem login), no formato real de Apuí de 29/09/2026:
sincroniza, marca a que sumiu como inativa, alimenta Abrangência, cruzamento e a lista de
equipes do Componente Qualidade, e não apaga nada quando a API volta vazia."""
from __future__ import annotations

import httpx
import pytest

from services import siaps_equipes as se

_ASYNC_CLIENT_REAL = httpx.AsyncClient     # o original, antes de qualquer monkeypatch
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)
from tests.test_siaps_relatorios import _cvat, _importar, _qualidade_esf_xlsx

COMPONENTES = [{"noComponente": "Qualidade", "equipesAvaliadas": [
    {"identificador": "APS", "indicadores": [{"coTipoIndicador": 104}]},
    {"identificador": "eSFR", "indicadores": [{"coTipoIndicador": 131}]},
    {"identificador": "BUCAL", "indicadores": [{"coTipoIndicador": 111}]},
    {"identificador": "eAPP", "indicadores": [{"coTipoIndicador": 125}]},
]}]
POR_INDICADOR = {
    "104": [{"coEquipe": "0000007072", "noEquipe": "CACHOEIRA", "sgEquipe": "eSF"},
            {"coEquipe": "0000007099", "noEquipe": "LIBERDADE", "sgEquipe": "eSF"},
            {"coEquipe": "0001690426", "noEquipe": "ESTRADA NOVA", "sgEquipe": "eSF"}],
    "131": [{"coEquipe": "0000007048", "noEquipe": "AREAL", "sgEquipe": "eSFR"}],
    "111": [{"coEquipe": "0001773941", "noEquipe": "0002 AREAL", "sgEquipe": "eSB"}],
    "125": [],
}


def _siaps_falso(monkeypatch, por_indicador=POR_INDICADOR, falhar=False):
    def handler(request: httpx.Request) -> httpx.Response:
        if falhar:
            return httpx.Response(503)
        if request.url.path.endswith("/filtros/componentes"):
            return httpx.Response(200, json=COMPONENTES)
        assert request.url.params["municipioIbge"] == "130014"
        return httpx.Response(200, json=por_indicador[request.url.params.get_list("indicadores")[0]])
    monkeypatch.setattr(se.httpx, "AsyncClient",
                        lambda *a, **k: _ASYNC_CLIENT_REAL(transport=httpx.MockTransport(handler), timeout=5))


async def test_sincroniza_e_alimenta_as_telas(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.get("/api/siaps-relatorios/equipes", headers=_h(tok))).json()["situacao_dado"] == "nao_disponivel"

    _siaps_falso(monkeypatch)
    r = (await c.post("/api/siaps-relatorios/equipes/sincronizar", headers=_h(tok))).json()
    assert r["equipes"] == 5 and r["por_tipo"]["eSFR"] == 1 and r["por_tipo"]["eSB"] == 1
    assert await _auditoria(S, "SIAPS_EQUIPES_SINCRONIZADAS")

    # Abrangência passa a vir do SIAPS público
    a = (await c.get("/api/siaps/abrangencia", headers=_h(tok))).json()
    assert a["fonte"] == "siaps_publico_equipes" and a["total_equipes"]["eSF"] == 3 and a["total_equipes"]["eSFR"] == 1

    # Cruzamento: equipes sem relatório; lista do Componente Qualidade com AREAL eSFR
    await _importar(c, tok, ("cvat.csv", _cvat()), ("esf.xlsx", _qualidade_esf_xlsx()))
    p = (await c.get("/api/siaps-relatorios/painel", headers=_h(tok))).json()
    assert sorted(x["equipe"] for x in p["cnes"]["equipes_sem_relatorio_siaps"]) == ["AREAL", "ESTRADA NOVA"]
    q = (await c.get("/api/pec/indicadores/2026-07", headers=_h(tok))).json()
    lista = {e["equipe"]: e["tipo"] for e in q["equipes_lista"]}
    assert lista["AREAL"] == "eSFR" and lista["ESTRADA NOVA"] == "eSF" and "0002 AREAL" not in lista

    # equipe que sai do SIAPS vira inativa; API vazia/instável não apaga nada
    menos = {**POR_INDICADOR, "104": POR_INDICADOR["104"][:2]}
    _siaps_falso(monkeypatch, menos)
    r = (await c.post("/api/siaps-relatorios/equipes/sincronizar", headers=_h(tok))).json()
    assert r["desativadas"] == ["ESTRADA NOVA"]
    _siaps_falso(monkeypatch, {k: [] for k in POR_INDICADOR})
    assert (await c.post("/api/siaps-relatorios/equipes/sincronizar", headers=_h(tok))).json()["ok"] is False
    _siaps_falso(monkeypatch, falhar=True)
    assert (await c.post("/api/siaps-relatorios/equipes/sincronizar", headers=_h(tok))).status_code == 503
    assert len((await c.get("/api/siaps-relatorios/equipes", headers=_h(tok))).json()["equipes"]) == 4


async def test_isolamento_e_perfil(ambiente, monkeypatch):
    c = ambiente["client"]
    _siaps_falso(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/siaps-relatorios/equipes/sincronizar", headers=_h(tok))
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/siaps-relatorios/equipes", headers=_h(tok_b))).json()["equipes"] == []
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/siaps-relatorios/equipes/sincronizar", headers=_h(consulta))).status_code == 403


async def test_job_semanal_sincroniza_municipios_ativos(ambiente, monkeypatch):
    import database
    import scheduler
    _siaps_falso(monkeypatch)
    chamados = []
    original = se.sincronizar

    async def espiao(db, mid, ibge):
        chamados.append(ibge)
        if ibge != "1300144":
            raise se.SiapsIndisponivel("sem dados de teste")   # erro de um município não para os demais
        return await original(db, mid, ibge)

    monkeypatch.setattr(database, "AsyncSessionLocal", ambiente["Session"])
    monkeypatch.setattr(se, "sincronizar", espiao)
    await scheduler._job_equipes_siaps()
    assert sorted(chamados) == ["1300144", "1399991"]             # município suspenso fica de fora
    tok = await _token(ambiente["client"], "gestor.apui@teste.gov.br")
    assert len((await ambiente["client"].get("/api/siaps-relatorios/equipes", headers=_h(tok))).json()["equipes"]) == 5


@pytest.mark.parametrize("ibge", ["1300144", "130014"])
async def test_aceita_ibge_de_6_ou_7_digitos(monkeypatch, ibge):
    _siaps_falso(monkeypatch)
    assert len(await se.buscar_equipes(ibge)) == 5


def test_job_inicial_agendado_com_fuso(monkeypatch):
    """Regressão: datetime sem fuso era lido como horário de Manaus → 1ª execução 4 h atrasada."""
    from datetime import datetime, timezone
    import scheduler
    capturado = {}
    monkeypatch.setattr(scheduler.scheduler, "start", lambda: None)
    orig = scheduler.scheduler.add_job

    def add_job(func, trigger=None, **kw):
        if kw.get("id") == "equipes_siaps_inicial":
            capturado.update(kw)
        return orig(func, trigger, **kw)
    monkeypatch.setattr(scheduler.scheduler, "add_job", add_job)
    scheduler.start_scheduler()
    atraso = (capturado["run_date"] - datetime.now(timezone.utc)).total_seconds()
    assert capturado["run_date"].tzinfo is not None and 0 < atraso <= 200
    for job in scheduler.scheduler.get_jobs():
        scheduler.scheduler.remove_job(job.id)
