"""PMS Vivo — entrega 3: reprogramação (aprovação por outra pessoa, ação original preservada, inclusão na PAS
seguinte), consolidação quadrimestral (RDQA) e avaliação anual (RAG) de apoio, reuniões com pauta gerada e
decisões, cruzamento com o Diagnóstico Situacional, relatórios PDF/Excel e isolamento. Dados fictícios."""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from models.usuario import Perfil
from services import pms_ciclo as ciclo
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)
from tests.test_pms_vivo import URL, _pms_aprovado, _usuario


def test_periodo_do_quadrimestre():
    assert ciclo.periodo_quadrimestre(2026, 1) == (date(2026, 1, 1), date(2026, 4, 30))
    assert ciclo.periodo_quadrimestre(2026, 2) == (date(2026, 5, 1), date(2026, 8, 31))
    assert ciclo.periodo_quadrimestre(2026, 3) == (date(2026, 9, 1), date(2026, 12, 31))
    with pytest.raises(ValueError):
        ciclo.periodo_quadrimestre(2026, 4)


async def _executar(c, tok_exec, tok_val, acao_id, situacao, **extra):
    u = (await c.post(f"{URL}/acoes/{acao_id}/atualizacoes", headers=_h(tok_exec), json={"situacao": situacao, **extra})).json()
    r = await c.post(f"{URL}/atualizacoes/{u['id']}/validar", headers=_h(tok_val), json={"decisao": "validar"})
    assert r.status_code == 200, r.text


async def test_ciclo_reprogramacao_rdqa_rag_reunioes_diagnostico_relatorios(ambiente, monkeypatch):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    exec_id = await _usuario(S, ids["apui"], "executor@apui.test", Perfil.TECNICO_APS)
    await _usuario(S, ids["apui"], "coord@apui.test", Perfil.COORDENADOR)
    await _usuario(S, ids["apui"], "planej@apui.test", Perfil.PLANEJAMENTO)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    tok_exec = await _token(c, "executor@apui.test")
    tok_coord = await _token(c, "coord@apui.test")
    tok_plan = await _token(c, "planej@apui.test")
    plano = await _pms_aprovado(c, tok)
    pid = plano["id"]
    m1, m2 = plano["diretrizes"][0]["objetivos"][0]["metas"]
    pas = (await c.post(f"{URL}/planos/{pid}/pas", headers=_h(tok), json={"exercicio": 2026})).json()
    base = {"meta_ids": [m1["id"]], "responsavel_usuario_id": exec_id, "prazo": "2026-06-30", "quantidade_prevista": 10}
    a1 = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok), json={**base, "codigo": "A1", "descricao": "Capacitar ACS"})).json()
    a2 = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok), json={**base, "codigo": "A2", "descricao": "Mapear microáreas"})).json()
    a3 = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok), json={**base, "codigo": "A3", "descricao": "Comprar tablets"})).json()
    await _executar(c, tok_exec, tok_coord, a1["id"], "nao_executada", justificativa="Instrutor não disponível")
    await _executar(c, tok_exec, tok_coord, a3["id"], "concluida", resultado_alcancado="10 tablets entregues")

    # ── Reprogramação ──
    corpo = {"motivo": "Capacitação não ocorreu", "justificativa_tecnica": "Ação necessária para a meta 1.1.1",
             "novo_prazo": "2027-05-31", "nova_quantidade": 12}
    assert (await c.post(f"{URL}/acoes/{a2['id']}/reprogramar", headers=_h(tok_exec), json=corpo)).status_code == 422
    rp = (await c.post(f"{URL}/acoes/{a1['id']}/reprogramar", headers=_h(tok_exec), json=corpo)).json()
    assert (rp["ano_destino"], rp["situacao"], rp["situacao_origem"]) == (2027, "proposta", "nao_executada")
    assert (await c.post(f"{URL}/acoes/{a1['id']}/reprogramar", headers=_h(tok_exec), json=corpo)).status_code == 409
    painel = (await c.get(f"{URL}/planos/{pid}/painel?ano=2026", headers=_h(tok))).json()
    assert painel["acoes"]["reprogramacao_proposta"] == 1
    assert "reprogramacao_pendente" in {a["tipo"] for a in (await c.get(f"{URL}/planos/{pid}/alertas?ano=2026", headers=_h(tok))).json()}
    reu1 = (await c.post(f"{URL}/planos/{pid}/reunioes", headers=_h(tok_coord),
                         json={"data": "2026-07-10", "titulo": "Reunião de julho", "ano": 2026})).json()
    assert reu1["pauta"]["reprogramacoes_propostas"][0]["acao"] == "A1"
    assert reu1["pauta"]["acoes_atrasadas"][0]["codigo"] == "A2" if date.today() > date(2026, 6, 30) else True
    url_dec = f"{URL}/reprogramacoes/{rp['id']}/decidir"
    assert (await c.post(url_dec, headers=_h(tok_exec), json={"decisao": "aprovar"})).status_code == 403
    assert (await c.post(url_dec, headers=_h(tok_plan), json={"decisao": "rejeitar"})).status_code == 422
    assert (await c.post(url_dec, headers=_h(tok_plan), json={"decisao": "aprovar", "parecer": "De acordo"})).json()["situacao"] == "aprovada"
    pas27 = (await c.post(f"{URL}/planos/{pid}/pas", headers=_h(tok), json={"exercicio": 2027})).json()
    assert (await c.post(f"{URL}/reprogramacoes/{rp['id']}/incluir", headers=_h(tok),
                         json={"pas_id": pas["id"], "codigo": "R-A1"})).status_code == 422          # PAS errada
    r = (await c.post(f"{URL}/reprogramacoes/{rp['id']}/incluir", headers=_h(tok), json={"pas_id": pas27["id"], "codigo": "R-A1"})).json()
    assert r["situacao"] == "incluida" and r["acao"]["situacao"] == "nao_executada"     # original preservada
    nova = (await c.get(f"{URL}/acoes/{r['acao_destino_id']}", headers=_h(tok))).json()
    assert (nova["exercicio"], nova["quantidade_prevista"], nova["prazo"], nova["situacao"]) == (2027, 12, "2027-05-31", "nao_iniciada")
    assert [m["codigo"] for m in nova["metas"]] == ["1.1.1"]
    assert (await c.post(f"{URL}/reprogramacoes/{rp['id']}/incluir", headers=_h(tok),
                         json={"pas_id": pas27["id"], "codigo": "R-A1b"})).status_code == 409
    assert await _auditoria(S, "PMS_REPROG_INCLUIDA")

    # ── RDQA (quadrimestre) e RAG (ano) ──
    hoje = date.today()
    q = (hoje.month - 1) // 4 + 1
    quad = (await c.get(f"{URL}/planos/{pid}/quadrimestre?ano={hoje.year}&q={q}", headers=_h(tok))).json()
    if hoje.year == 2026:
        assert [a["codigo"] for a in quad["acoes_realizadas"]] == ["A3"]
    assert "Não substitui" in quad["aviso"]
    assert any("FCA" in x for x in quad["recomendacoes"]) or quad["metas"]
    rag = (await c.get(f"{URL}/planos/{pid}/avaliacao-anual?ano=2026", headers=_h(tok))).json()
    assert rag["acoes"]["previstas"] == 3 and rag["acoes"]["executadas"] == 1 and rag["acoes"]["nao_executadas"] == 1
    assert rag["justificativas"][0]["acao"] == "A1" and rag["principais_resultados"][0]["resultado"] == "10 tablets entregues"
    assert rag["reprogramacoes"][0]["situacao"] == "incluida"

    # ── Reuniões: decisões e providências da reunião anterior ──
    reu1 = (await c.post(f"{URL}/reunioes/{reu1['id']}/decisoes", headers=_h(tok_coord),
                         json={"descricao": "Remarcar capacitação com a regional", "responsavel": "Coord. APS",
                               "prazo": (hoje - timedelta(days=1)).isoformat()})).json()
    dec = reu1["decisoes"][0]
    assert dec["atrasada"]
    reu2 = (await c.post(f"{URL}/planos/{pid}/reunioes", headers=_h(tok_coord),
                         json={"data": "2026-08-10", "titulo": "Reunião de agosto", "ano": 2026})).json()
    assert reu2["pauta"]["providencias_anteriores"][0]["decisao_id"] == dec["id"]
    assert (await c.put(f"{URL}/decisoes/{dec['id']}", headers=_h(tok_coord), json={"situacao": "cumprida"})).status_code == 422
    reu1 = (await c.put(f"{URL}/decisoes/{dec['id']}", headers=_h(tok_coord),
                        json={"situacao": "cumprida", "observacao": "Capacitação remarcada"})).json()
    assert reu1["decisoes"][0]["cumprida_em"]
    assert (await c.put(f"{URL}/reunioes/{reu1['id']}", headers=_h(tok_coord),
                        json={"ata": "Discutidas as pendências.", "participantes": "Secretária, Coord. APS",
                              "situacao": "realizada"})).json()["situacao"] == "realizada"
    assert (await c.post(f"{URL}/planos/{pid}/reunioes", headers=_h(tok_exec),
                         json={"data": "2026-09-10", "titulo": "x y z"})).status_code == 403
    pdf = await c.get(f"{URL}/reunioes/{reu1['id']}/relatorio.pdf", headers=_h(tok))
    assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")

    # ── Diagnóstico Situacional ──
    import services.siops_service as siops

    async def sem_siops(ano):
        return {"situacao_dado": "nao_disponivel"}
    monkeypatch.setattr(siops, "buscar_apuracao", sem_siops)
    d = (await c.post("/api/diagnostico-situacional/diagnosticos", headers=_h(tok),
                      json={"exercicio": 2026, "periodo_tipo": "anual", "periodo": 0})).json()
    itens = {i["codigo"]: i for i in (await c.get(f"/api/diagnostico-situacional/diagnosticos/{d['id']}", headers=_h(tok))).json()["itens"]}
    await c.put(f"/api/diagnostico-situacional/itens/{itens['I02']['id']}", headers=_h(tok), json={
        "classificacao": "critico", "justificativa": "Microáreas sem ACS (teste)", "fonte": "Coordenação APS"})
    await c.put(f"/api/diagnostico-situacional/itens/{itens['F01']['id']}", headers=_h(tok), json={
        "classificacao": "pendencia", "justificativa": "REMUME desatualizada (teste)", "fonte": "AF"})
    url_v = f"{URL}/planos/{pid}/diagnostico/vinculos"
    assert (await c.post(url_v, headers=_h(tok), json={"diag_item_id": itens["A01"]["id"], "meta_id": m1["id"]})).status_code == 422
    assert (await c.post(url_v, headers=_h(tok_exec), json={"diag_item_id": itens["I02"]["id"], "meta_id": m1["id"]})).status_code == 403
    assert (await c.post(url_v, headers=_h(tok), json={"diag_item_id": itens["I02"]["id"], "meta_id": m1["id"],
                                                         "observacao": "Meta de cadastro"})).status_code == 201
    cruz = (await c.get(f"{URL}/planos/{pid}/diagnostico?ano=2026", headers=_h(tok))).json()
    assert cruz["diagnostico"]["id"] == d["id"] and (cruz["contemplados"], cruz["sem_acao"]) == (1, 1)
    assert any("F01" in x and "sem meta ou ação" in x for x in cruz["recomendacoes"])
    assert any(m["codigo"] == "1.1.2" for m in cruz["metas_sem_acompanhamento"])     # 1.1.2 sem ação na PAS 2026

    # ── Relatórios PDF e Excel ──
    for tipo in ("execucao_pas", "metas_pms", "pendencias", "por_responsavel", "quadrimestral", "anual",
                 "reprogramacoes", "plano_acao"):
        for formato, magica in (("pdf", b"%PDF"), ("xlsx", b"PK")):
            r = await c.get(f"{URL}/planos/{pid}/relatorios/{tipo}?formato={formato}&ano=2026&quadrimestre=2", headers=_h(tok))
            assert r.status_code == 200 and r.content.startswith(magica), (tipo, formato, r.text[:200])
    assert (await c.get(f"{URL}/planos/{pid}/relatorios/inexistente", headers=_h(tok))).status_code == 404

    # ── Isolamento ──
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    for path in (f"/planos/{pid}/reprogramacoes", f"/planos/{pid}/reunioes", f"/reunioes/{reu1['id']}",
                 f"/planos/{pid}/relatorios/anual", f"/planos/{pid}/diagnostico", f"/planos/{pid}/avaliacao-anual?ano=2026"):
        assert (await c.get(URL + path, headers=_h(tok_b))).status_code == 404, path
    assert (await c.post(url_dec, headers=_h(tok_b), json={"decisao": "aprovar"})).status_code == 404
