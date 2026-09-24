"""Previsão da Portaria × Recebimento FNS: conciliação segura, sem duplicar nem
somar previsão como receita, multi-município e vínculo manual auditado."""
from __future__ import annotations

import itertools
from datetime import date
from decimal import Decimal

from sqlalchemy import select

from models.transferencia_fns import TransferenciaFns
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)

CBAF = "CBAF - RECURSOS FINANCEIROS A TRANSFERIR PARA AQUISICAO PELAS SECRETARIAS DE SAUDE"
_seq = itertools.count(1)


async def _transf(Session, *, ibge="130014", comp=CBAF, valor="15486.20", pago=date(2026, 9, 10),
                  portaria=None, grupo="Assistência Farmacêutica", tipo="CBAF"):
    async with Session() as db:
        t = TransferenciaFns(
            chave_unica=f"t{next(_seq)}", municipio_ibge=ibge, exercicio=pago.year, mes=pago.month,
            data_pagamento=pago, competencia=f"{pago.year}/{pago.month:02d}", grupo=grupo,
            acao="PROMOCAO DA ASSISTENCIA FARMACEUTICA", acao_detalhada=comp, tipo_incentivo=tipo,
            numero_portaria=portaria, valor_liquido=Decimal(valor) if valor is not None else None,
            fonte="consultafns", ativo=True)
        db.add(t)
        await db.commit()
        return t.id


def _prev(**kw):
    base = {"numero_portaria": "3493", "ano_portaria": 2024, "exercicio": 2026,
            "grupo": "Assistência Farmacêutica", "componente": CBAF,
            "valor_previsto": 15486.20, "periodicidade": "unica", "competencia_inicial": "2026-08"}
    base.update(kw)
    return base


async def _painel(c, tok, **params):
    q = "&".join(f"{k}={v}" for k, v in {"exercicio": 2026, **params}.items())
    r = await c.get(f"/api/fns-previsao/painel?{q}", headers=_h(tok))
    assert r.status_code == 200, r.text
    return r.json()


async def test_competencia_de_agosto_paga_em_setembro(ambiente):
    """Exemplo do pedido: recurso de Ago/2026 creditado em Set/2026 continua Ago/2026."""
    c, S = ambiente["client"], ambiente["Session"]
    tid = await _transf(S)                                   # registro FNS já existente
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.post("/api/fns-previsao/previsoes", json=_prev(), headers=_h(tok))
    assert r.status_code == 201, r.text
    assert r.json()["conciliacao"]["vinculados"] == 1

    p = await _painel(c, tok)
    [linha] = p["linhas"]
    assert linha["competencia"] == "2026-08"                 # competência da previsão
    assert linha["datas_credito"] == ["2026-09-10"]          # data do crédito preservada
    assert linha["situacao"] == "PAGO" and linha["diferenca"] == 0.0
    assert linha["pago_em_mes_diferente"] is True
    assert p["cards"] == {"previsto": 15486.2, "recebido": 15486.2, "a_receber": 0.0, "pct_recebido": 100.0}
    assert any(a["tipo"] == "pago_em_outro_mes" for a in p["alertas"])

    async with S() as db:                                    # nenhum registro financeiro novo
        ts = (await db.execute(select(TransferenciaFns))).scalars().all()
        assert [t.id for t in ts] == [tid]
        assert ts[0].competencia == "2026/09"                # campo atual intacto (matriz inalterada)
        assert ts[0].competencia_referencia == "2026-08" and ts[0].vinculo_tipo == "automatico"


async def test_valor_igual_nao_basta_para_vincular(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    await _transf(S, comp="OUTRO COMPONENTE QUALQUER DO BLOCO DE MANUTENCAO")   # mesmo valor, outro componente
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/fns-previsao/previsoes", json=_prev(), headers=_h(tok))
    [linha] = (await _painel(c, tok))["linhas"]
    assert linha["situacao"] == "NAO_RECEBIDO" and linha["recebido"] == 0.0


async def test_serie_mensal_ambigua_fica_pendente_com_sugestao(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    for m in (8, 9, 10):
        await _transf(S, valor="1000.00", pago=date(2026, m + 1, 5))     # cada mês pago no seguinte
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.post("/api/fns-previsao/previsoes", headers=_h(tok), json=_prev(
        valor_previsto=3000, periodicidade="mensal", qtd_parcelas=3, competencia_inicial="2026-08"))
    assert r.json()["conciliacao"]["vinculados"] == 0                    # não presume
    linhas = (await _painel(c, tok))["linhas"]
    assert [l["situacao"] for l in linhas] == ["CONCILIACAO_PENDENTE"] * 3
    sugestoes = [l["sugestao_transferencia_id"] for l in linhas]
    assert None not in sugestoes and len(set(sugestoes)) == 3            # sugestão, sem repetir


async def test_vinculo_manual_auditado_e_desfazer(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    tids = [await _transf(S, valor="1000.00", pago=date(2026, m + 1, 5)) for m in (8, 9)]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    prev = (await c.post("/api/fns-previsao/previsoes", headers=_h(tok), json=_prev(
        valor_previsto=2000, periodicidade="mensal", qtd_parcelas=2))).json()
    r = await c.post("/api/fns-previsao/vinculos", headers=_h(tok), json={
        "transferencia_id": tids[0], "previsao_id": prev["id"], "competencia": "2026-08", "motivo": "conferido no extrato"})
    assert r.status_code == 200
    linhas = (await _painel(c, tok))["linhas"]
    assert linhas[0]["situacao"] == "PAGO" and linhas[0]["vinculo_tipo"] == "manual"
    # o mesmo pagamento não pode ir para outra competência sem desfazer antes
    r = await c.post("/api/fns-previsao/vinculos", headers=_h(tok), json={
        "transferencia_id": tids[0], "previsao_id": prev["id"], "competencia": "2026-09"})
    assert r.status_code == 409
    assert (await c.delete(f"/api/fns-previsao/vinculos/{tids[0]}", headers=_h(tok))).status_code == 200
    acoes = [a.acao for a in await _auditoria(S)]
    assert "CONCILIACAO_FNS_MANUAL" in acoes and "CONCILIACAO_FNS_DESFEITA" in acoes


async def test_situacoes_parcial_maior_a_vencer_e_sem_valor(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    await _transf(S, comp=CBAF + " A", valor="900.00", pago=date(2026, 3, 5))
    await _transf(S, comp=CBAF + " B", valor="1100.00", pago=date(2026, 3, 5))
    sem = await _transf(S, comp=CBAF + " C", valor=None, pago=date(2026, 3, 5))
    tok = await _token(c, "gestor.apui@teste.gov.br")
    for sufixo in ("A", "B", "C"):
        await c.post("/api/fns-previsao/previsoes", headers=_h(tok), json=_prev(
            componente=f"{CBAF} {sufixo}", valor_previsto=1000, competencia_inicial="2026-03"))
    futura = (await c.post("/api/fns-previsao/previsoes", headers=_h(tok), json=_prev(
        componente=f"{CBAF} D", valor_previsto=500, competencia_inicial="2026-12"))).json()
    sit = {l["componente"][-1]: l["situacao"] for l in (await _painel(c, tok))["linhas"]}
    assert sit["A"] == "PARCIAL" and sit["B"] == "PAGO_A_MAIOR" and sit["D"] == "A_VENCER"
    # há pagamento, mas sem valor líquido (coleta incompleta): nunca vinculado
    # automaticamente nem tratado como pago — fica pendente
    assert sit["C"] == "CONCILIACAO_PENDENTE"
    # vínculo manual de registro sem valor líquido não confirma pagamento
    prev_c = next(p for p in (await c.get("/api/fns-previsao/previsoes?exercicio=2026", headers=_h(tok))).json()
                  if p["componente"].endswith("C"))
    await c.post("/api/fns-previsao/vinculos", headers=_h(tok), json={
        "transferencia_id": sem, "previsao_id": prev_c["id"], "competencia": "2026-03"})
    linha_c = next(l for l in (await _painel(c, tok))["linhas"] if l["componente"].endswith("C"))
    assert linha_c["situacao"] == "CONCILIACAO_PENDENTE" and linha_c["coleta_incompleta"] is True
    assert futura["parcelas"][0]["competencia"] == "2026-12"


async def test_previsao_nao_e_somada_como_receita(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    await _transf(S, valor="500.00", pago=date(2026, 8, 5))
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/fns-previsao/previsoes", headers=_h(tok), json=_prev(valor_previsto=2000))
    cards = (await _painel(c, tok))["cards"]
    assert cards == {"previsto": 2000.0, "recebido": 500.0, "a_receber": 1500.0, "pct_recebido": 25.0}


async def test_multimunicipio_isolado(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    tid_apui = await _transf(S)
    tok_a = await _token(c, "gestor.apui@teste.gov.br")
    prev_a = (await c.post("/api/fns-previsao/previsoes", json=_prev(), headers=_h(tok_a))).json()

    tok_b = await _token(c, "gestor.b@teste.gov.br")
    painel_b = await _painel(c, tok_b)
    assert painel_b["linhas"] == [] and painel_b["total_previsoes"] == 0
    assert (await c.get("/api/fns-previsao/previsoes", headers=_h(tok_b))).json() == []
    # B cria previsão igual: não enxerga o pagamento de Apuí
    await _transf(S, ibge="139999", valor="100.00")
    prev_b = (await c.post("/api/fns-previsao/previsoes", json=_prev(valor_previsto=100), headers=_h(tok_b))).json()
    [lb] = (await _painel(c, tok_b))["linhas"]
    assert lb["recebido"] == 100.0 and all(t["id"] != tid_apui for t in lb["transferencias"])
    # B não vincula nem edita registros de Apuí
    r = await c.post("/api/fns-previsao/vinculos", headers=_h(tok_b), json={
        "transferencia_id": tid_apui, "previsao_id": prev_b["id"], "competencia": "2026-08"})
    assert r.status_code == 404
    assert (await c.delete(f"/api/fns-previsao/previsoes/{prev_a['id']}", headers=_h(tok_b))).status_code == 404


async def test_perfil_consulta_nao_altera(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/fns-previsao/previsoes", json=_prev(), headers=_h(tok))).status_code == 403
    assert (await c.get("/api/fns-previsao/painel?exercicio=2026", headers=_h(tok))).status_code == 200


async def test_alertas_no_sistema_de_validacoes_existente(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/fns-previsao/previsoes", headers=_h(tok), json=_prev(competencia_inicial="2026-01"))
    val = (await c.get("/api/repasses-fns/matriz-validacoes?exercicio=2026", headers=_h(tok))).json()
    assert any(a["tipo"] == "previsto_nao_identificado" for a in val["alertas"])
