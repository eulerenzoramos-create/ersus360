"""PMS Vivo — Dashboard consolidado: metas, execução da PAS (checklist), PAS por ano, quadrimestre, alertas,
cadastro e isolamento por município. Dados fictícios."""
from __future__ import annotations

from datetime import date

from models.usuario import Perfil
from services import pms_dashboard as dash
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)
from tests.test_pms_vivo import URL, _pms_aprovado, _usuario


def test_quadrimestre():
    assert dash.quadrimestre(date(2026, 11, 13), 2026) == {"numero": 3, "fim": "2026-12-31", "dias_restantes": 48,
                                                           "encerrado": False}
    assert dash.quadrimestre(date(2026, 3, 1), 2026)["numero"] == 1
    assert dash.quadrimestre(date(2026, 6, 1), 2026)["fim"] == "2026-08-31"
    passado = dash.quadrimestre(date(2027, 2, 1), 2026)
    assert passado["numero"] == 3 and passado["encerrado"] and passado["dias_restantes"] is None
    assert dash.quadrimestre(date(2026, 11, 13), 2027)["numero"] == 1


async def test_dashboard(ambiente):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    await _usuario(S, ids["apui"], "coord@apui.test", Perfil.COORDENADOR)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    tok_coord = await _token(c, "coord@apui.test")
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    plano = await _pms_aprovado(c, tok)
    pid = plano["id"]
    m1, m2 = plano["diretrizes"][0]["objetivos"][0]["metas"]

    d = (await c.get(f"{URL}/planos/{pid}/dashboard?ano=2026", headers=_h(tok))).json()
    assert d["metas"]["total"] == 2 and d["execucao"]["total"] == 0 and d["pas"] is None
    assert [p["exercicio"] for p in d["pas_anos"]] == [2026, 2027, 2028, 2029] and not d["pas_anos"][0]["existe"]
    assert d["documento_anexado"] is False and d["metas"]["sem_tipo_indicador"] == 0
    assert (await c.get(f"{URL}/planos/{pid}/dashboard?ano=2031", headers=_h(tok))).status_code == 422

    pas = (await c.post(f"{URL}/planos/{pid}/pas", headers=_h(tok), json={"exercicio": 2026})).json()
    a1 = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok),
                       json={"codigo": "A1", "descricao": "Ação 1", "meta_ids": [m1["id"]]})).json()["id"]
    await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok),
                 json={"codigo": "A2", "descricao": "Ação 2", "meta_ids": [m2["id"]], "prazo": "2026-12-31",
                       "responsavel_nome": "Coordenação APS"})
    await c.post(f"{URL}/acoes/{a1}/atualizacoes", headers=_h(tok),
                 json={"situacao": "nao_executada", "justificativa": "Sem recurso", "motivo": "Sem recurso", "dificuldades": "Atraso no repasse", "providencias": "Pedir suplementação", "responsavel_solucao": "Coordenação APS", "novo_prazo": "2027-03-31"})
    u = (await c.get(f"{URL}/validacoes-pendentes", headers=_h(tok_coord))).json()[0]
    await c.post(f"{URL}/atualizacoes/{u['id']}/validar", headers=_h(tok_coord), json={"decisao": "validar"})

    d = (await c.get(f"{URL}/planos/{pid}/dashboard?ano=2026", headers=_h(tok))).json()
    ex = d["execucao"]
    assert ex["total"] == 2 and ex["nao_feito"] == 1 and ex["sem_informacao"] == 1 and ex["percentual_informado"] == 50.0
    assert d["pas"]["situacao"] == "rascunho" and d["pas_anos"][0] == {
        "exercicio": 2026, "existe": True, "situacao": "rascunho", "resolucao_cms": None, "acoes": 2}
    dz = d["por_diretriz"][0]
    assert dz["codigo"] == "1" and dz["metas"]["total"] == 2 and dz["acoes"]["nao_feito"] == 1
    assert d["cadastro"] == {"acoes": 2, "sem_responsavel": 1, "sem_prazo": 1, "atrasadas": 0}
    assert set(d["alertas"]) >= {"critico", "atencao", "info", "principais"}
    assert d["quadrimestre"]["numero"] in (1, 2, 3)

    # isolamento: outro município não vê o dashboard
    assert (await c.get(f"{URL}/planos/{pid}/dashboard?ano=2026", headers=_h(tok_b))).status_code in (403, 404)
