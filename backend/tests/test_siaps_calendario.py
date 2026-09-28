"""Calendário oficial do SIAPS 2026 (sisaps.saude.gov.br, conferido em 28/09/2026) e alertas
de prazo: 7/3/1/0 dias antes da data limite e o dia de extrair os relatórios (limite + 1)."""
from __future__ import annotations

from datetime import date

from sqlalchemy import select

from models.alerta import Alerta
from services import siaps_calendario as cal
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)
from tests.test_siaps_relatorios import _cvat, _importar


def test_calendario_oficial_2026():
    limites = {c: l for c, _i, _f, l in cal.CALENDARIO}
    assert limites["2026-07"] == date(2026, 8, 14) and limites["2026-09"] == date(2026, 10, 15)
    assert limites["2026-12"] == date(2027, 1, 15) and len(limites) == 13
    assert cal.data_relatorio(limites["2026-09"]) == date(2026, 10, 16)
    p = cal.proximo_prazo(date(2026, 9, 28))
    assert (p["competencia"], p["dias_para_limite"], p["nivel"]) == ("2026-09", 17, "info")


def test_alertas_do_dia():
    assert cal.alertas_do_dia(date(2026, 10, 10)) == []
    a7 = cal.alertas_do_dia(date(2026, 10, 8))
    assert len(a7) == 1 and a7[0]["severidade"] == "atencao" and "em 7 dias (15/10/2026)" in a7[0]["titulo"]
    hoje = cal.alertas_do_dia(date(2026, 10, 15))
    assert hoje[0]["severidade"] == "critico" and "HOJE" in hoje[0]["titulo"]
    rel = cal.alertas_do_dia(date(2026, 10, 16))
    assert len(rel) == 1 and "extrair hoje os relatórios da competência Setembro/2026" in rel[0]["titulo"]


async def test_endpoint_calendario_marca_relatorio_importado(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _importar(c, tok, ("cvat.csv", _cvat()))
    d = (await c.get("/api/siaps-relatorios/calendario", headers=_h(tok))).json()
    jul = next(i for i in d["calendario"] if i["competencia"] == "2026-07")
    assert jul["relatorio_importado"] is True and jul["data_relatorio"] == "2026-08-15"
    assert all(p["competencia"] != "2026-07" for p in d["relatorios_pendentes"])
    # outro município não herda a importação de Apuí
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    d_b = (await c.get("/api/siaps-relatorios/calendario", headers=_h(tok_b))).json()
    assert next(i for i in d_b["calendario"] if i["competencia"] == "2026-07")["relatorio_importado"] is False


async def test_job_diario_grava_alertas_sem_duplicar(ambiente, monkeypatch):
    import database
    import scheduler
    from routers import ws_alertas

    class _Hoje(date):
        @classmethod
        def today(cls):
            return date(2026, 10, 15)

    enviados = []

    async def _broadcast(msg):
        enviados.append(msg)

    monkeypatch.setattr(scheduler, "date", _Hoje)
    monkeypatch.setattr(database, "AsyncSessionLocal", ambiente["Session"])
    monkeypatch.setattr(ws_alertas.manager, "broadcast", _broadcast)

    await scheduler._job_alertas_automaticos()
    await scheduler._job_alertas_automaticos()          # rodar de novo não duplica

    async with ambiente["Session"]() as db:
        alertas = (await db.execute(select(Alerta))).scalars().all()
    ids = ambiente["ids"]
    assert {a.municipio_id for a in alertas} == {ids["apui"], ids["b"]}      # município suspenso fica de fora
    assert len(alertas) == 2 and all(a.modulo == "SIAPS" and "HOJE" in a.titulo for a in alertas)
    assert enviados and enviados[0]["nivel"] == "CRITICO"
