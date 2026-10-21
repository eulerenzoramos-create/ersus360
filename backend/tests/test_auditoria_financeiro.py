"""Auditoria do Financeiro (etapa 2): SIOPS pela consulta pública real, sem "proxy" que induz a erro,
e a consulta FNS do Painel Financeiro ligada às transferências coletadas."""
from __future__ import annotations

from datetime import date

import httpx

from models.transferencia_fns import TransferenciaFns
from services import siops_service as ss
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401

_REAL = httpx.AsyncClient


def _ind(base, asps, desp=1000.0):
    return [{"numero_indicador": "1.1", "ds_indicador": "x", "numerador": 10, "denominador": 500.0, "indicador_calculado": "2 %"},
            {"numero_indicador": "1.3", "ds_indicador": "x", "numerador": 300.0, "denominador": 1, "indicador_calculado": "1 %"},
            {"numero_indicador": "2.1", "ds_indicador": "x", "numerador": desp, "denominador": 10, "indicador_calculado": "R$ 100,00"},
            {"numero_indicador": "2.2", "ds_indicador": "x", "numerador": 600.0, "denominador": desp, "indicador_calculado": "60 %"},
            {"numero_indicador": "3.2", "ds_indicador": "x", "numerador": base * asps / 100, "denominador": base,
             "indicador_calculado": f"{asps:.2f}".replace(".", ",") + " %"}]


def _siops_falso(monkeypatch, por_ano_codigo: dict):
    ss._cache.clear()

    def handler(req: httpx.Request) -> httpx.Response:
        *_, ibge, ano, cod = req.url.path.split("/")
        dados = por_ano_codigo.get((int(ano), int(cod)))
        return httpx.Response(200, json=dados if dados else [{"error": "msg03", "message": "Dados não homologado(s)."}])
    monkeypatch.setattr(ss.httpx, "AsyncClient", lambda *a, **k: _REAL(transport=httpx.MockTransport(handler)))


def test_mapa_de_bimestres_e_percentual():
    assert ss.CODIGO_BIMESTRE == {1: 12, 2: 14, 3: 1, 4: 18, 5: 20, 6: 2}
    assert ss._pct("19,13 %") == 19.13 and ss._pct("R$ 1.638,15") == 1638.15


async def test_ano_fechado_e_ano_parcial(monkeypatch):
    _siops_falso(monkeypatch, {(2025, 2): _ind(1000.0, 19.13), (2026, 18): _ind(800.0, 13.02), (2026, 12): _ind(100.0, 9.0)})
    a = await ss.buscar_apuracao(2025)
    assert a["ano_fechado"] and a["bimestre"] == 6 and a["percentual_saude_receita"] == 19.13 and a["status_minimo"] == "atingido"
    assert ss.alerta_minimo(a) is None
    p = await ss.buscar_apuracao(2026)                      # usa o último bimestre homologado (4º), não o 1º
    assert p["bimestre"] == 4 and p["status_minimo"] == "parcial_abaixo" and not p["ano_fechado"]
    al = ss.alerta_minimo(p)
    assert al["nivel"] == "atencao" and "Parcial" in al["mensagem"]
    assert (await ss.buscar_apuracao(2020))["situacao_dado"] == "nao_disponivel"


async def test_execucao_orcamentaria_nao_repete_despesa(ambiente, monkeypatch):
    _siops_falso(monkeypatch, {(date.today().year - 1, 2): _ind(1000.0, 19.0)})
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = (await c.get("/api/siops-detalhado/execucao-orcamentaria", headers=_h(tok))).json()
    assert r["empenhado"] is None and r["liquidado"] is None and r["pago"] is None and r["despesa_total_saude"] == 1000.0
    n = (await c.get("/api/siops-detalhado/despesa-natureza", headers=_h(tok))).json()
    assert n["naturezas"][0]["valor"] == 600.0 and n["naturezas"][0]["percentual"] == 60.0


async def test_consulta_fns_do_painel_financeiro(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    async with S() as db:
        db.add_all([
            TransferenciaFns(chave_unica="a", municipio_ibge="130014", exercicio=2026, mes=8, data_pagamento=date(2026, 8, 12),
                             bloco="Atenção Primária", acao="Incentivo APS", acao_detalhada="eSF", valor_total=100, valor_desconto=10, valor_liquido=90, fonte="teste"),
            TransferenciaFns(chave_unica="b", municipio_ibge="130014", exercicio=2026, mes=9, data_pagamento=date(2026, 9, 10),
                             bloco="Atenção Primária", acao="Incentivo APS", acao_detalhada="ACS", valor_total=50, valor_desconto=0, valor_liquido=50, fonte="teste"),
        ])
        await db.commit()
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = (await c.get("/api/financeiro/fns-acoes?ano=2026&mes=8", headers=_h(tok))).json()
    assert r["situacao_dado"] == "oficial_validado" and len(r["acoes"]) == 1 and r["total_liquido"] == 90
    d = (await c.get("/api/financeiro/fns-repasse-dia?ano=2026&mes=9&dia=10", headers=_h(tok))).json()
    assert d["total"] == 50 and d["ultimo_pagamento"] == "10/09/2026"
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/financeiro/fns-acoes?ano=2026", headers=_h(tok_b))).json()["acoes"] == []   # outro município
