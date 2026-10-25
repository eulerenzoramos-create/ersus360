"""PMS Vivo — entrega 2: cálculo por tipo de indicador (sem somar o que não é acumulável), situação e tendência
das metas, resultado com fonte obrigatória, fonte automática (SIOPS, sem estimar), painel, Kanban, cronograma,
alertas (inclusive central, sem duplicar), FCA com causa como hipótese até validação, isolamento. Dados fictícios."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select

from models.alerta import Alerta
from models.usuario import Perfil
from services import pms_monitoramento as mon
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)
from tests.test_pms_vivo import URL, _pms_aprovado, _usuario

HOJE = date(2026, 10, 25)


# ── Cálculo ──────────────────────────────────────────────────────────────────

def test_cumprimento_por_tipo_e_polaridade():
    assert mon.cumprimento("percentual", "maior_melhor", 75, 80) == 106.7
    assert mon.cumprimento("taxa", "menor_melhor", 10, 12.5) == 80.0      # mortalidade acima da meta
    assert mon.cumprimento("binario", None, 1, 1) == 100.0 and mon.cumprimento("binario", None, 1, 0) == 0.0
    assert mon.cumprimento("percentual", "maior_melhor", 75, None) is None


def test_acumulado_nao_soma_percentual():
    anos = [{"ano": 2026, "resultado": 70.0}, {"ano": 2027, "resultado": 78.0}, {"ano": 2028, "resultado": None}]
    assert mon.acumulado("absoluto_acumulavel", anos)["valor"] == 148.0
    pct = mon.acumulado("percentual", anos)
    assert pct["valor"] == 78.0 and "sem soma" in pct["regra"]
    assert mon.acumulado(None, anos)["valor"] is None
    assert mon.tendencia("taxa", "menor_melhor", [{"ano": 2026, "resultado": 12}, {"ano": 2027, "resultado": 9}]) == "melhora"
    assert mon.tendencia("percentual", "maior_melhor", [{"ano": 2026, "resultado": 80}, {"ano": 2027, "resultado": 70}]) == "piora"
    assert mon.tendencia(None, None, anos) is None


def test_situacao_da_meta_sem_resultado_nao_e_fracasso():
    assert mon.situacao_meta(2025, 75, None, None, 0, HOJE) == "sem_resultado"
    assert mon.situacao_meta(2025, 75, 70, 93.3, 0, HOJE) == "nao_alcancada"
    assert mon.situacao_meta(2026, 75, None, None, 0, HOJE) == "em_acompanhamento"
    assert mon.situacao_meta(2026, 75, None, None, 2, HOJE) == "em_risco"          # ações atrasadas/não executadas
    assert mon.situacao_meta(2026, 75, 80, 106.7, 0, HOJE) == "alcancada"
    assert mon.situacao_meta(2027, 78, None, None, 0, HOJE) == "prevista"


def test_kanban_e_cronograma():
    base = {"aguardando_validacao": False, "atrasada": False, "situacao": "em_andamento"}
    assert mon.coluna_kanban({**base, "aguardando_validacao": True, "atrasada": True}) == "aguardando_validacao"
    assert mon.coluna_kanban({**base, "atrasada": True}) == "atrasada"
    assert mon.coluna_kanban({**base, "situacao": "nao_executada"}) == "encerrada"
    acoes = [{"id": i, "codigo": f"A{i}", "descricao": "x", "prazo": p, "responsavel_nome": None, "setor_responsavel": None,
              "situacao": "nao_iniciada", "situacao_rotulo": "", "atrasada": False, "coluna": "nao_iniciada"}
             for i, p in ((1, "2026-11-30"), (2, None), (3, "2026-03-01"))]
    assert [g["mes"] for g in mon.cronograma(acoes)] == ["2026-03", "2026-11", "sem_prazo"]


# ── Fluxo pela API ────────────────────────────────────────────────────────────

async def test_monitoramento_painel_kanban_alertas_e_fca(ambiente, monkeypatch):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    exec_id = await _usuario(S, ids["apui"], "executor@apui.test", Perfil.TECNICO_APS)
    await _usuario(S, ids["apui"], "coord@apui.test", Perfil.COORDENADOR)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    tok_exec = await _token(c, "executor@apui.test")
    tok_coord = await _token(c, "coord@apui.test")
    plano = await _pms_aprovado(c, tok)
    pid = plano["id"]
    m1, m2 = plano["diretrizes"][0]["objetivos"][0]["metas"]          # 1.1.1 percentual · 1.1.2 acumulável
    pas = (await c.post(f"{URL}/planos/{pid}/pas", headers=_h(tok), json={"exercicio": 2026})).json()
    ontem = (date.today() - timedelta(days=1)).isoformat()
    acao = (await c.post(f"{URL}/pas/{pas['id']}/acoes", headers=_h(tok), json={
        "codigo": "A1", "descricao": "Capacitar ACS", "meta_ids": [m1["id"]], "prazo": ontem,
        "responsavel_usuario_id": exec_id, "setor_responsavel": "Coordenação APS",
        "evidencia_esperada": "Lista de presença"})).json()

    # resultado com fonte obrigatória; só na versão aprovada; executor não registra
    url_r = f"{URL}/metas/{m1['id']}/resultados/2026"
    assert (await c.put(url_r, headers=_h(tok), json={"resultado": 70})).status_code == 422
    assert (await c.put(url_r, headers=_h(tok_exec), json={"resultado": 70, "fonte": "e-SUS"})).status_code == 403
    assert (await c.put(f"{URL}/metas/{m1['id']}/resultados/2031", headers=_h(tok),
                        json={"resultado": 70, "fonte": "x"})).status_code == 422
    assert (await c.put(url_r, headers=_h(tok_coord), json={"resultado": 70, "fonte": "e-SUS APS",
                                                             "competencia": "jan–set/2026"})).status_code == 200
    for ano, v in ((2026, 1), (2027, 2)):
        await c.put(f"{URL}/metas/{m2['id']}/resultados/{ano}", headers=_h(tok), json={"resultado": v, "fonte": "Obras"})

    mo = {m["codigo"]: m for m in (await c.get(f"{URL}/planos/{pid}/monitoramento?ano=2026", headers=_h(tok))).json()["metas"]}
    a1 = mo["1.1.1"]
    assert a1["cumprimento"] == 93.3 and a1["acumulado"]["valor"] == 70 and a1["acoes_com_problema"] == 1
    assert a1["situacao"] == ("em_risco" if date.today().year == 2026 else "nao_alcancada")
    assert mo["1.1.2"]["acumulado"]["valor"] == 3 and mo["1.1.2"]["cumprimento_quadrienal"] == 75.0
    assert mo["1.1.2"]["tendencia"] == "melhora"

    # fonte automática: só com correspondência de tipo; sem dado da fonte, nada é gravado
    url_f = f"{URL}/metas/{m2['id']}/fonte-automatica"
    assert (await c.put(url_f, headers=_h(tok), json={"fonte_automatica": "siops_pct_asps"})).status_code == 422
    assert (await c.put(f"{URL}/metas/{m1['id']}/fonte-automatica", headers=_h(tok),
                        json={"fonte_automatica": "siops_pct_asps"})).status_code == 200
    import services.siops_service as siops

    async def fora_do_ar(ano):
        return {"situacao_dado": "nao_disponivel"}
    monkeypatch.setattr(siops, "buscar_apuracao", fora_do_ar)
    r = (await c.post(f"{URL}/metas/{m1['id']}/resultados/2027/coletar", headers=_h(tok))).json()
    assert r["ok"] is False
    mo = {m["codigo"]: m for m in (await c.get(f"{URL}/planos/{pid}/monitoramento", headers=_h(tok))).json()["metas"]}
    assert next(a for a in mo["1.1.1"]["anos"] if a["ano"] == 2027)["resultado"] is None

    async def publicado(ano):
        return {"situacao_dado": "oficial_validado", "receita_impostos": 4e7, "gasto_proprio_saude": 7e6,
                "minimo_constitucional_pct_obrigatorio": 15.0, "minimo_constitucional_pct_aplicado": 17.4}
    monkeypatch.setattr(siops, "buscar_apuracao", publicado)
    r = (await c.post(f"{URL}/metas/{m1['id']}/resultados/2027/coletar", headers=_h(tok))).json()
    assert r["ok"] and r["resultado"] == 17.4 and "SIOPS" in r["fonte"]

    # painel, Kanban, cronograma, alertas
    p = (await c.get(f"{URL}/planos/{pid}/painel?ano=2026", headers=_h(tok))).json()
    assert p["metas"]["total"] == 2 and p["acoes"]["atrasadas"] == 1 and p["acoes"]["reprogramacao_proposta"] is None
    assert p["responsaveis_pendentes"][0]["responsavel"] == "executor"
    assert (await c.get(f"{URL}/planos/{pid}/painel?ano=2026&setor=Outro", headers=_h(tok))).json()["acoes"]["total"] == 0
    kb = {col["id"]: col for col in (await c.get(f"{URL}/planos/{pid}/kanban?ano=2026", headers=_h(tok))).json()["colunas"]}
    assert [a["codigo"] for a in kb["atrasada"]["acoes"]] == ["A1"]
    await c.post(f"{URL}/acoes/{acao['id']}/atualizacoes", headers=_h(tok_exec), json={"situacao": "em_andamento"})
    kb = {col["id"]: col for col in (await c.get(f"{URL}/planos/{pid}/kanban?ano=2026", headers=_h(tok))).json()["colunas"]}
    assert [a["codigo"] for a in kb["aguardando_validacao"]["acoes"]] == ["A1"]
    cron = (await c.get(f"{URL}/planos/{pid}/cronograma?ano=2026", headers=_h(tok))).json()
    assert cron[0]["mes"] == ontem[:7] and cron[0]["acoes"][0]["codigo"] == "A1"
    tipos = {a["tipo"] for a in (await c.get(f"{URL}/planos/{pid}/alertas?ano=2026", headers=_h(tok))).json()}
    assert {"acao_atrasada", "sem_evidencia"} <= tipos

    # central de alertas (rotina diária), sem duplicar
    async with S() as db:
        n1 = await mon.registrar_alertas_centrais(db, ids["apui"])
        n2 = await mon.registrar_alertas_centrais(db, ids["apui"])
        centrais = (await db.execute(select(Alerta).where(Alerta.modulo == "PMS Vivo"))).scalars().all()
    assert n1 >= 1 and n2 == 0 and all(a.municipio_id == ids["apui"] for a in centrais)

    # FCA: só para meta em risco/não alcançada ou ação com problema; causa é hipótese até outra pessoa validar
    fca_meta = {"ano": 2026, "meta_id": m2["id"], "fato": "Reforma parada", "causa": "Licitação deserta",
                "acao_corretiva": "Nova licitação"}
    r2026 = mo["1.1.2"]["anos"][0]
    if r2026["situacao"] not in {"em_risco", "nao_alcancada"}:
        assert (await c.post(f"{URL}/planos/{pid}/fca", headers=_h(tok), json=fca_meta)).status_code == 422
    f = (await c.post(f"{URL}/planos/{pid}/fca", headers=_h(tok), json={**fca_meta, "meta_id": m1["id"]})).json()
    assert f["causa_validacao"] == "hipotese"
    assert (await c.post(f"{URL}/fca/{f['id']}/validar-causa", headers=_h(tok))).status_code == 409
    assert (await c.post(f"{URL}/fca/{f['id']}/validar-causa", headers=_h(tok_coord))).json()["causa_validacao"] == "confirmada"
    f = (await c.put(f"{URL}/fca/{f['id']}", headers=_h(tok), json={"causa": "Falta de veículo para as visitas"})).json()
    assert f["causa_validacao"] == "hipotese"                       # causa nova volta a ser hipótese
    fa = await c.post(f"{URL}/planos/{pid}/fca", headers=_h(tok_exec), json={
        "ano": 2026, "acao_id": acao["id"], "fato": "Capacitação adiada", "causa": "Instrutor indisponível",
        "acao_corretiva": "Remarcar com a regional", "prazo": (date.today() + timedelta(days=20)).isoformat()})
    assert fa.status_code == 201
    assert (await c.post(f"{URL}/planos/{pid}/fca", headers=_h(tok), json={**fca_meta, "acao_id": acao["id"]})).status_code == 422
    assert len((await c.get(f"{URL}/planos/{pid}/fca?ano=2026", headers=_h(tok))).json()) == 2
    assert await _auditoria(S, "PMS_FCA_CAUSA_VALIDADA")

    # isolamento
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    for path in (f"/planos/{pid}/painel", f"/planos/{pid}/kanban", f"/planos/{pid}/cronograma", f"/planos/{pid}/alertas",
                 f"/planos/{pid}/fca", f"/planos/{pid}/monitoramento"):
        assert (await c.get(URL + path, headers=_h(tok_b))).status_code == 404, path
    assert (await c.put(url_r, headers=_h(tok_b), json={"resultado": 1, "fonte": "x"})).status_code == 404
