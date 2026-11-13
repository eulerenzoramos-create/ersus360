"""PMS Vivo — acompanhamento da execução: justificativa detalhada obrigatória, quadrimestre de referência com
histórico, atribuição em lote, painel com filtros, Agente de Monitoramento (só leitura) e relatório de execução
das ações. Dados fictícios."""
from __future__ import annotations

from datetime import date, datetime

from models.usuario import Perfil
from services import pms_vivo as svc
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)
from tests.test_pms_vivo import URL, _pms_aprovado, _usuario

DETALHE = {"motivo": "Recurso não liberado", "dificuldades": "Atraso no repasse da emenda",
           "providencias": "Solicitar suplementação orçamentária", "responsavel_solucao": "Coordenação APS",
           "novo_prazo": "2026-01-15"}


def test_quadrimestres():
    assert svc.quadrimestre_de(date(2026, 4, 30)) == 1 and svc.quadrimestre_de(date(2026, 5, 1)) == 2
    assert svc.quadrimestre_de(date(2026, 12, 31)) == 3
    assert svc.quadrimestre_padrao(2026, date(2026, 11, 13)) == 3
    assert svc.quadrimestre_padrao(2026, date(2027, 2, 1)) == 3 and svc.quadrimestre_padrao(2027, date(2026, 11, 1)) == 1

    class U:   # atualização antiga, sem período gravado
        ano_referencia = quadrimestre = None
        informado_em = datetime(2026, 6, 10)
    assert svc.periodo_da_atualizacao(U, 2026) == (2026, 2)
    assert svc.SITUACOES_ACAO["concluida"] == "Executada"


async def test_execucao_acompanhamento_agente_relatorio(ambiente):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    exec_id = await _usuario(S, ids["apui"], "executor@apui.test", Perfil.TECNICO_APS)
    await _usuario(S, ids["apui"], "coord@apui.test", Perfil.COORDENADOR)
    de_b = await _usuario(S, ids["b"], "alguem@b.test", Perfil.TECNICO_APS)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    tok_coord = await _token(c, "coord@apui.test")
    tok_exec = await _token(c, "executor@apui.test")
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    plano = await _pms_aprovado(c, tok)
    pid = plano["id"]
    m1, m2 = plano["diretrizes"][0]["objetivos"][0]["metas"]
    pas = (await c.post(f"{URL}/planos/{pid}/pas", headers=_h(tok), json={"exercicio": 2026})).json()
    a1 = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok),
                       json={"codigo": "A1", "descricao": "Capacitar ACS", "meta_ids": [m1["id"]]})).json()["id"]
    a2 = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok),
                       json={"codigo": "A2", "descricao": "Reformar UBS", "meta_ids": [m2["id"]],
                             "quantidade_prevista": 2})).json()["id"]

    # Agente antes de tudo: sem responsável/prazo e PAS em rascunho; não altera nada
    ag = (await c.get(f"{URL}/planos/{pid}/agente?ano=2026", headers=_h(tok))).json()
    cat = {x["id"]: x for x in ag["categorias"]}
    assert any("sem responsável" in i["texto"] for i in cat["providencia_gestao"]["itens"])
    assert any("rascunho" in i["texto"] for i in cat["providencia_gestao"]["itens"])
    assert ag["resumo"]["sem_responsavel"] == 2
    acoes_antes = (await c.get(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok))).json()

    # Atribuição em lote: só planejamento; ações de outra PAS/município são recusadas
    url_lote = f"{URL}/pas/{pas['id']}/acoes/lote"
    assert (await c.put(url_lote, headers=_h(tok_exec), json={"acao_ids": [a1], "prazo": "2026-12-31"})).status_code == 403
    assert (await c.put(url_lote, headers=_h(tok), json={"acao_ids": [a1]})).status_code == 422
    assert (await c.put(url_lote, headers=_h(tok), json={"acao_ids": [a1], "responsavel_usuario_id": de_b})).status_code == 422
    r = await c.put(url_lote, headers=_h(tok), json={"acao_ids": [a1, a2], "setor_responsavel": "Atenção Primária",
                                                     "responsavel_usuario_id": exec_id, "prazo": "2026-12-31"})
    assert r.status_code == 200 and r.json()["atualizadas"] == 2
    assert (await c.put(url_lote, headers=_h(tok_b), json={"acao_ids": [a1], "prazo": "2026-12-31"})).status_code in (403, 404)

    # Não executada/parcial: o registro não fecha sem o detalhamento completo
    url1 = f"{URL}/acoes/{a1}/atualizacoes"
    r = await c.post(url1, headers=_h(tok_exec), json={"situacao": "nao_executada", "justificativa": "Sem instrutor"})
    assert r.status_code == 422 and "Motivo" in r.json()["detail"] and "Novo prazo" in r.json()["detail"]
    incompleto = {**DETALHE, "providencias": "  "}
    assert (await c.post(url1, headers=_h(tok_exec), json={"situacao": "nao_executada", "justificativa": "Sem instrutor",
                                                            **incompleto})).status_code == 422
    u1 = (await c.post(url1, headers=_h(tok_exec), json={"situacao": "nao_executada", "justificativa": "Sem instrutor",
                                                          "quadrimestre": 2, **DETALHE})).json()
    assert u1["quadrimestre"] == 2 and u1["ano_referencia"] == 2026 and u1["motivo"] == DETALHE["motivo"]
    # executada exige resultado; detalhamento enviado em "executada" é descartado
    url2 = f"{URL}/acoes/{a2}/atualizacoes"
    assert (await c.post(url2, headers=_h(tok_exec), json={"situacao": "concluida"})).status_code == 422
    u2 = (await c.post(url2, headers=_h(tok_exec), json={"situacao": "concluida", "resultado_alcancado": "2 UBS reformadas",
                                                          "quantidade_realizada": 2, "quadrimestre": 2,
                                                          "motivo": "não se aplica"})).json()
    assert u2["motivo"] is None
    for u in (u1, u2):
        assert (await c.post(f"{URL}/atualizacoes/{u['id']}/validar", headers=_h(tok_coord),
                             json={"decisao": "validar"})).status_code == 200
    det = (await c.get(f"{URL}/acoes/{a1}", headers=_h(tok))).json()
    assert det["situacao"] == "nao_executada" and det["providencias"] == DETALHE["providencias"]
    assert det["novo_prazo"] == "2026-01-15" and det["responsavel_solucao"] == "Coordenação APS"

    # Acompanhamento: linhas com meta/diretriz/objetivo, quadrimestres e resumo
    ac = (await c.get(f"{URL}/planos/{pid}/acompanhamento?ano=2026", headers=_h(tok))).json()
    lin = {x["codigo"]: x for x in ac["linhas"]}
    assert lin["A1"]["metas"][0]["diretriz_codigo"] == "1" and lin["A1"]["metas"][0]["objetivo"]
    assert lin["A1"]["quadrimestres"]["2"]["situacao"] == "nao_executada" and lin["A1"]["quadrimestres"]["1"] is None
    assert lin["A1"]["justificativa_completa"] is True and lin["A2"]["situacao_rotulo"] == "Executada"
    assert lin["A1"]["pode_atualizar"] is True
    res = ac["resumo"]
    assert (res["total"], res["executadas"], res["nao_executadas"], res["sem_justificativa"]) == (2, 1, 1, 0)
    assert res["percentual_execucao"] == 50.0 and res["sem_responsavel"] == 0
    q1 = (await c.get(f"{URL}/planos/{pid}/acompanhamento?ano=2026&quadrimestre=1", headers=_h(tok))).json()["resumo"]
    assert q1["executadas"] == 0 and q1["sem_registro_no_quadrimestre"] == 2
    q2 = (await c.get(f"{URL}/planos/{pid}/acompanhamento?ano=2026&quadrimestre=2", headers=_h(tok))).json()["resumo"]
    assert q2["executadas"] == 1 and q2["nao_executadas"] == 1
    # o executor só pode atualizar as suas; o filtro por responsável funciona
    f = (await c.get(f"{URL}/planos/{pid}/acompanhamento?ano=2026&responsavel_usuario_id={exec_id}", headers=_h(tok_exec))).json()
    assert len(f["linhas"]) == 2 and all(x["pode_atualizar"] for x in f["linhas"])
    assert (await c.get(f"{URL}/planos/{pid}/acompanhamento?ano=2031", headers=_h(tok))).status_code == 422
    assert (await c.get(f"{URL}/planos/{pid}/acompanhamento?ano=2026", headers=_h(tok_b))).status_code in (403, 404)

    # Painel do gestor: indicadores de execução com filtro de quadrimestre
    pn = (await c.get(f"{URL}/planos/{pid}/painel?ano=2026&quadrimestre=2&diretriz_id={plano['diretrizes'][0]['id']}",
                      headers=_h(tok))).json()
    assert pn["execucao"]["executadas"] == 1 and pn["quadrimestre"] == 2

    # Agente: novo prazo vencido, não execução; nada oficial muda
    ag = (await c.get(f"{URL}/planos/{pid}/agente?ano=2026", headers=_h(tok))).json()
    cat = {x["id"]: x for x in ag["categorias"]}
    assert cat["nao_executada"]["total"] == 1 and cat["nao_executada"]["recomendacao"]
    assert any("novo prazo" in i["texto"] for i in cat["prazo_vencido"]["itens"])
    assert (await c.post(f"{URL}/planos/{pid}/agente/alertas?ano=2026", headers=_h(tok_exec))).status_code == 403
    n1 = (await c.post(f"{URL}/planos/{pid}/agente/alertas?ano=2026", headers=_h(tok))).json()["novos"]
    n2 = (await c.post(f"{URL}/planos/{pid}/agente/alertas?ano=2026", headers=_h(tok))).json()["novos"]
    assert n1 >= 1 and n2 == 0
    depois = (await c.get(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok))).json()
    assert [x["situacao"] for x in depois] == ["nao_executada", "concluida"] and len(depois) == len(acoes_antes)
    assert (await c.get(f"{URL}/planos/{pid}/agente?ano=2026", headers=_h(tok_b))).status_code in (403, 404)

    # Relatório de execução das ações (PDF e Excel), também por quadrimestre
    for fmt in ("pdf", "xlsx"):
        r = await c.get(f"{URL}/planos/{pid}/relatorios/execucao_acoes?formato={fmt}&ano=2026", headers=_h(tok))
        assert r.status_code == 200 and len(r.content) > 500
    r = await c.get(f"{URL}/planos/{pid}/relatorios/execucao_acoes?formato=xlsx&ano=2026&quadrimestre=2", headers=_h(tok))
    assert r.status_code == 200 and "q2" in r.headers["content-disposition"]
