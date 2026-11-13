"""PMS Vivo — Checklist "foi feito?" da PAS e agente de monitoramento (resumo semanal e fechamento de quadrimestre).
Marcação continua passando pela validação de outra pessoa; "não feito" exige justificativa. Dados fictícios."""
from __future__ import annotations

from datetime import date

from sqlalchemy import select

from models.alerta import Alerta
from models.usuario import Perfil
from services import pms_checklist as chk
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)
from tests.test_pms_vivo import URL, _pms_aprovado, _usuario

SEGUNDA = date(2026, 11, 16)          # segunda-feira comum
QUINTA_FIM_Q1 = date(2026, 4, 30)     # quinta-feira, fim do 1º quadrimestre
SEGUNDA_FIM_Q2 = date(2026, 8, 31)    # segunda-feira e fim do 2º quadrimestre


def test_status_checklist():
    base = {"aguardando_validacao": False, "devolvida": False, "situacao": "nao_iniciada"}
    assert chk.status_checklist(base) == "sem_informacao"
    assert chk.status_checklist({**base, "situacao": "em_andamento"}) == "sem_informacao"
    assert chk.status_checklist({**base, "situacao": "concluida"}) == "feito"
    assert chk.status_checklist({**base, "situacao": "nao_executada"}) == "nao_feito"
    assert chk.status_checklist({**base, "aguardando_validacao": True, "situacao": "concluida"}) == "aguardando_validacao"
    assert chk.status_checklist({**base, "devolvida": True}) == "devolvida"
    r = chk.resumo([{"status": "feito"}, {"status": "sem_informacao"}])
    assert r["total"] == 2 and r["feito"] == 1 and r["percentual_informado"] == 50.0


async def test_checklist_marcacao_validacao_relatorio_e_agente(ambiente):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    await _usuario(S, ids["apui"], "coord@apui.test", Perfil.COORDENADOR)
    await _usuario(S, ids["apui"], "consulta2@apui.test", Perfil.CONSULTA)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    tok_coord = await _token(c, "coord@apui.test")
    tok_cons = await _token(c, "consulta2@apui.test")
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    plano = await _pms_aprovado(c, tok)
    pid = plano["id"]
    m1, m2 = plano["diretrizes"][0]["objetivos"][0]["metas"]

    # sem PAS: checklist responde, mas vazio
    d = (await c.get(f"{URL}/planos/{pid}/checklist?ano=2026", headers=_h(tok))).json()
    assert d["pas"] is None and d["itens"] == []
    assert (await c.get(f"{URL}/planos/{pid}/checklist?ano=2031", headers=_h(tok))).status_code == 422

    pas = (await c.post(f"{URL}/planos/{pid}/pas", headers=_h(tok), json={"exercicio": 2026})).json()
    acoes = {}
    for cod, meta in (("A1", m1), ("A2", m1), ("A3", m2)):
        acoes[cod] = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok),
                                   json={"codigo": cod, "descricao": f"Ação {cod}", "meta_ids": [meta["id"]]})).json()["id"]

    d = (await c.get(f"{URL}/planos/{pid}/checklist?ano=2026", headers=_h(tok))).json()
    assert d["resumo"]["sem_informacao"] == 3 and d["resumo"]["percentual_informado"] == 0.0
    assert d["marcacoes"] == {"feito": "concluida", "parcial": "parcial", "nao_feito": "nao_executada"}

    # marcar: "não feito" sem justificativa é recusado; "feito" exige o que foi feito
    url = f"{URL}/acoes/{acoes['A2']}/atualizacoes"
    assert (await c.post(url, headers=_h(tok), json={"situacao": "nao_executada"})).status_code == 422
    assert (await c.post(url, headers=_h(tok), json={"situacao": "nao_executada",
                                                     "justificativa": "Recurso não liberado", "motivo": "Sem recurso", "dificuldades": "Atraso no repasse", "providencias": "Pedir suplementação", "responsavel_solucao": "Coordenação APS", "novo_prazo": "2027-03-31"})).status_code == 201
    assert (await c.post(f"{URL}/acoes/{acoes['A1']}/atualizacoes", headers=_h(tok),
                         json={"situacao": "concluida", "percentual_execucao": 100})).status_code == 422
    assert (await c.post(f"{URL}/acoes/{acoes['A1']}/atualizacoes", headers=_h(tok),
                         json={"situacao": "concluida", "percentual_execucao": 100,
                               "resultado_alcancado": "Capacitação feita"})).status_code == 201
    # perfil só de consulta não marca
    assert (await c.post(f"{URL}/acoes/{acoes['A3']}/atualizacoes", headers=_h(tok_cons),
                         json={"situacao": "nao_executada", "justificativa": "x"})).status_code == 403

    d = (await c.get(f"{URL}/planos/{pid}/checklist?ano=2026", headers=_h(tok))).json()
    st = {i["codigo"]: i for i in d["itens"]}
    assert st["A1"]["status"] == "aguardando_validacao" and st["A2"]["status"] == "aguardando_validacao"
    assert st["A2"]["ultima"]["justificativa"] == "Recurso não liberado"

    # validação por outra pessoa (quem informou não valida)
    pend = (await c.get(f"{URL}/validacoes-pendentes", headers=_h(tok_coord))).json()
    assert len(pend) == 2
    for u in pend:
        assert (await c.post(f"{URL}/atualizacoes/{u['id']}/validar", headers=_h(tok),
                             json={"decisao": "validar"})).status_code == 409
        assert (await c.post(f"{URL}/atualizacoes/{u['id']}/validar", headers=_h(tok_coord),
                             json={"decisao": "validar"})).status_code == 200
    d = (await c.get(f"{URL}/planos/{pid}/checklist?ano=2026", headers=_h(tok))).json()
    st = {i["codigo"]: i for i in d["itens"]}
    assert st["A1"]["status"] == "feito" and st["A1"]["resultado_alcancado"] == "Capacitação feita"
    assert st["A2"]["status"] == "nao_feito" and st["A2"]["justificativa"] == "Recurso não liberado"
    assert st["A3"]["status"] == "sem_informacao" and st["A1"]["validado_por"]
    assert d["resumo"]["feito"] == 1 and d["resumo"]["nao_feito"] == 1 and d["resumo"]["sem_informacao"] == 1

    # relatório (Excel e PDF) e isolamento por município
    for fmt in ("xlsx", "pdf"):
        r = await c.get(f"{URL}/planos/{pid}/relatorios/checklist?formato={fmt}&ano=2026", headers=_h(tok))
        assert r.status_code == 200 and len(r.content) > 500
    assert (await c.get(f"{URL}/planos/{pid}/checklist?ano=2026", headers=_h(tok_b))).status_code in (403, 404)

    # agente: nada em dia comum; resumo semanal na segunda; fechamento de quadrimestre; sem duplicar
    async with S() as db:
        assert await chk.registrar_monitoramento_execucao(db, ids["apui"], date(2026, 11, 17)) == 0
        assert await chk.registrar_monitoramento_execucao(db, ids["apui"], SEGUNDA) == 1
        assert await chk.registrar_monitoramento_execucao(db, ids["apui"], SEGUNDA) == 0
        assert await chk.registrar_monitoramento_execucao(db, ids["apui"], QUINTA_FIM_Q1) == 1
        assert await chk.registrar_monitoramento_execucao(db, ids["apui"], SEGUNDA_FIM_Q2) == 2
        assert await chk.registrar_monitoramento_execucao(db, ids["b"], SEGUNDA) == 0
        als = (await db.execute(select(Alerta).where(Alerta.modulo == "PMS Vivo",
                                                      Alerta.titulo.like("PMS: %PAS 2026%")))).scalars().all()
    assert len(als) == 4 and all(a.municipio_id == ids["apui"] for a in als)
    semanal = next(a for a in als if a.titulo.startswith("PMS: monitoramento semanal") and "16/11/2026" in a.descricao)
    assert "1 feitas" in semanal.descricao and "1 não feitas" in semanal.descricao and "A3" in semanal.descricao
    q1 = next(a for a in als if "1º quadrimestre" in a.titulo)
    assert q1.severidade.value == "critico" and "A2 — Recurso não liberado" in q1.descricao and "A3" in q1.descricao
