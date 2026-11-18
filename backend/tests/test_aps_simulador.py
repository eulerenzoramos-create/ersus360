"""Simulador de Financiamento e Oportunidades da APS com os dados reais de Apuí (e-Gestor parcela 202610 +
avaliação quadrimestral do SIAPS no formato da captura). Confere: só e-Gestor/SIAPS como fonte, conferência
norma × pago, incremento só com parâmetro confirmado, transição, 2ª eMulti sem direito automático,
oportunidades não somadas como garantidas, monitoramento normativo com validação e histórico preservado."""
from __future__ import annotations

import copy
from datetime import datetime

from models.equipe_siaps import EquipeSiaps
from models.siaps_publico import SiapsQuadrimestreEquipe
from services import aps_simulador as sim
from services import egestor_pagamento as ep
from tests.dados_egestor_apui_202610 import PARCELA_202610
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)

ESF = ["0000007072", "0000007080", "0000007099", "0000007056", "0001536974", "0000007064", "0001690442",
       "0001690426", "0002323613"]
PESOS = {"C1": 1, "C2": 2, "C3": 2, "C4": 1, "C5": 1, "C6": 1, "C7": 2}
CONC = {"regular": 0.25, "suficiente": 0.5, "bom": 0.75, "otimo": 1.0}


def _inds(classes: dict) -> list[dict]:
    return [{"co": i, "codigo": c, "peso": PESOS[c], "classificacao": k, "conceito": CONC[k], "nota": CONC[k] * PESOS[c]}
            for i, (c, k) in enumerate(classes.items())]


async def _semear(S, mid, monkeypatch, parcela=PARCELA_202610):
    async def buscar(ibge, parcelas=3, client=None):
        return [copy.deepcopy(parcela)]
    monkeypatch.setattr(ep, "buscar", buscar)
    async with S() as db:
        r = await ep.sincronizar(db, mid, "1300144")
        assert r["ok"]
        for i, ine in enumerate(ESF):
            db.add(EquipeSiaps(municipio_id=mid, ine=ine, nome=f"ESF {i + 1}", tipo="eSF"))
        db.add(EquipeSiaps(municipio_id=mid, ine="0000007048", nome="AREAL", tipo="eSFR"))
        db.add(EquipeSiaps(municipio_id=mid, ine="0002449927", nome="EMULTI 1", tipo="eMulti"))
        db.add(EquipeSiaps(municipio_id=mid, ine="0009999999", nome="EMULTI 2", tipo="eMulti"))
        # equipe 1: qualidade Suficiente (nota 4,5); equipe 2: Bom; demais sem captura
        q1 = _inds({"C1": "suficiente", "C2": "suficiente", "C3": "suficiente", "C4": "regular",
                    "C5": "suficiente", "C6": "regular", "C7": "suficiente"})
        nota1 = sum(i["nota"] for i in q1)
        db.add_all([
            SiapsQuadrimestreEquipe(municipio_id=mid, quadrimestre="2026Q2", componente="QUALIDADE", sg_equipe="eSF",
                                    ine=ESF[0], equipe="ESF 1", nota_final=nota1, classificacao="suficiente",
                                    equipe_valida=True, homologada=True, indicadores=q1, hash="a", capturado_em=datetime.utcnow()),
            SiapsQuadrimestreEquipe(municipio_id=mid, quadrimestre="2026Q2", componente="CVAT", sg_equipe="eSF",
                                    ine=ESF[0], equipe="ESF 1", nota_final=7.2, classificacao="bom",
                                    equipe_valida=True, homologada=True, indicadores=[], hash="b", capturado_em=datetime.utcnow()),
            SiapsQuadrimestreEquipe(municipio_id=mid, quadrimestre="2026Q2", componente="QUALIDADE", sg_equipe="eMulti",
                                    ine="0002449927", equipe="EMULTI 1", nota_final=6.0, classificacao="bom",
                                    equipe_valida=True, homologada=True, indicadores=[], hash="c", capturado_em=datetime.utcnow()),
        ])
        await db.commit()
    return nota1


async def test_situacao_atual_conferencia_e_desempenho(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    nota1 = await _semear(S, ambiente["ids"]["apui"], monkeypatch)
    assert nota1 == 4.5
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/aps-simulador", headers=_h(tok))).json()
    assert d["situacao_dado"] == "oficial_validado" and d["parcela"] == "202610"
    assert "CNS e e-SUS PEC não são fontes" in d["nao_utiliza"]
    p = d["perfil"]
    assert p["estrato_ied"] == "E2" and p["populacao"] == 21781 and p["populacao_ano"] == 2025
    # financiamento atual = soma do pago no e-Gestor na parcela
    soma = sum(x["resumo"].get("vlTotal") or 0 for x in PARCELA_202610["componentes"])
    assert d["kpis"]["financiamento_atual_mensal"] == round(soma, 2)
    assert d["kpis"]["financiamento_atual_anual"] == round(soma * 12, 2)
    # conferência: fixo E2 (9 × 16.000) e vínculo Bom (9 × 6.000) conferem; qualidade eSF (9 × 8.000 pago × 6.000
    # pela tabela) diverge → alerta e incremento não confirmado
    div = {x["componente"]: x for x in d["diferencas"] if x["tipo"] == "parametro_divergente"}
    assert "eSF — componente fixo" not in div and "eSF — vínculo e acompanhamento" not in div
    assert div["eSF — qualidade"]["esperado_norma"] == 54000 and div["eSF — qualidade"]["pago_egestor"] == 72000
    assert "eMulti — qualidade" not in div                     # Estratégica Bom 2.250 = pago
    assert "R$ 54.000,00" in div["eSF — qualidade"]["texto"] and "R$ 72.000,00" in div["eSF — qualidade"]["texto"]
    assert any(x["tipo"] == "desconto_repetido" for x in d["diferencas"])   # mesmo desconto na eSF e na eAP
    em1 = next(e for e in d["por_equipe"] if e["ine"] == "0002449927")
    assert em1["norma"]["custeio"] == em1["atual"]["custeio"] == 12000 and em1["norma"]["qualidade"] == 2250
    assert any(x["tipo"] == "desconto" for x in d["diferencas"])
    # por equipe: ESF 1 qualidade Suficiente → Bom; plano de melhoria pelos indicadores de maior peso
    e1 = next(e for e in d["por_equipe"] if e["ine"] == ESF[0])
    assert e1["atual"] == {"fixo": 16000, "vinculo": 6000, "qualidade": 8000}
    m = next(x for x in e1["melhoria"] if x["componente"] == "qualidade")
    assert (m["de"], m["para"], m["incremento_mensal"], m["confirmado"]) == ("suficiente", "bom", 2000, False)
    assert m["plano"]["possivel"] and m["plano"]["nota_projetada"] >= 5
    assert m["plano"]["passos"][0]["indicador"] in ("C2", "C3") and m["plano"]["passos"][0]["para"] == "bom"
    v = next(x for x in e1["melhoria"] if x["componente"] == "vinculo")
    assert (v["de"], v["para"], v["incremento_mensal"], v["confirmado"]) == ("bom", "otimo", 2000, True)
    # incremento: vínculo confirmado entra; qualidade (parâmetro divergente) fica fora do total
    assert d["desempenho"]["incremento_mensal_proximo_nivel"] == 2000 + 750   # vínculo eSF 1 + eMulti Bom→Ótimo
    assert d["desempenho"]["incremento_mensal_nao_confirmado"] == 2000
    assert d["desempenho"]["efeito_financeiro"] == "apos_transicao"            # fim da transição não registrado
    assert d["kpis"]["total_potencial_mensal"] == d["kpis"]["financiamento_atual_mensal"]   # nada garantido somado
    assert any(a.get("chave") == "transicao.fim" for a in d["alertas"])


async def test_oportunidades_apui(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    await _semear(S, ambiente["ids"]["apui"], monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/aps-simulador", headers=_h(tok))).json()
    ops = {o["id"]: o for o in d["oportunidades"]}
    # teto 11, credenciadas 10, homologadas 9
    assert ops["esf_homologacao"]["quantidade"] == 1 and ops["esf_homologacao"]["elegibilidade"] == "potencial"
    assert ops["esf_homologacao"]["custeio_unitario"] == 30000          # 16.000 + 6.000 + 8.000 pagos por eSF
    assert ops["esf_homologacao"]["implantacao_unitaria"] == 30000
    assert ops["esf_nova"]["quantidade"] == 1 and ops["eap_nova"]["conta_no_total"] is False
    assert ops["esf_nova"]["grupo_exclusivo"] == ops["eap_nova"]["grupo_exclusivo"] == ops["esf_homologacao"]["grupo_exclusivo"]
    # 2ª eMulti: SIAPS 2, e-Gestor 1 credenciada → potencial, sem direito automático, modalidade a confirmar
    em = [o for o in d["oportunidades"] if o["id"].startswith("emulti_")]
    assert em and all(o["elegibilidade"] == "potencial" for o in em)
    assert "EMULTI 2" in em[0]["situacao_atual"] and "Modalidade" in em[0]["pendencias"]
    estr = ops["emulti_estrategica"]
    assert estr["custeio_unitario"] == 12000 + 2250
    # eSB modalidade II: diferença publicada no e-Gestor (7.064 − 4.014)
    assert ops["esb_modII"]["custeio_unitario"] == 3050 and ops["esb_modII"]["quantidade"] == 10
    # ACS acima do teto → não elegível
    assert ops["acs"]["elegibilidade"] == "nao_elegivel"
    # programas sem recebimento descobertos pelo e-Gestor (dados insuficientes, com valor de referência)
    assert ops["academia"]["elegibilidade"] == "dados_insuficientes"
    # nada potencial é somado ao total garantido; excludentes contam uma vez no "a confirmar"
    assert d["kpis"]["incremento_credenciamento_confirmado_mensal"] == 0
    max_esf = max(ops["esf_homologacao"]["incremento_mensal"], ops["esf_nova"]["incremento_mensal"])
    assert d["kpis"]["incremento_credenciamento_a_confirmar_mensal"] >= max_esf
    assert len(d["respostas"]) == 6
    prov = d["respostas"][5]["resposta"]
    assert prov.count("2ª eMulti") == 1                                   # providência sem repetição


async def test_parametros_validacao_historico_e_transicao(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    mid = ambiente["ids"]["apui"]
    await _semear(S, mid, monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    outro = await _token(c, "multi@teste.gov.br")
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    novo = {"chave": "qualidade.eSF.bom", "valor": 8000, "norma": "Portaria GM/MS (exemplo de teste)",
            "fonte": "Texto oficial conferido no DOU", "justificativa": "Valor pago no e-Gestor desde 2025",
            "vigencia_inicio": "202601", "nacional": False}
    assert (await c.post("/api/aps-simulador/parametros", json=novo, headers=_h(consulta))).status_code == 403
    assert (await c.post("/api/aps-simulador/parametros", json={**novo, "nacional": True}, headers=_h(tok))).status_code == 403
    pid = (await c.post("/api/aps-simulador/parametros", json=novo, headers=_h(tok))).json()["id"]
    # pendente não muda o cálculo
    d = (await c.get("/api/aps-simulador", headers=_h(tok))).json()
    assert any(x["componente"] == "eSF — qualidade" for x in d["diferencas"])
    # quem registrou não valida; outro usuário valida
    assert (await c.post(f"/api/aps-simulador/parametros/{pid}/decidir", json={"aprovar": True}, headers=_h(tok))).status_code == 403
    assert (await c.post(f"/api/aps-simulador/parametros/{pid}/decidir", json={"aprovar": True}, headers=_h(outro))).json()["situacao"] == "vigente"
    d = (await c.get("/api/aps-simulador", headers=_h(tok))).json()
    assert not any(x["componente"] == "eSF — qualidade" for x in d["diferencas"])
    # histórico: competência anterior à vigência continua com o valor antigo
    async with S() as db:
        from services import aps_parametros as ap
        assert ap.valor(await ap.vigentes(db, mid, "202512"), "qualidade.eSF.bom") == 6000
        assert ap.valor(await ap.vigentes(db, mid, "202610"), "qualidade.eSF.bom") == 8000
    # transição registrada e validada: efeito imediato após o fim
    t = {"chave": "transicao.fim", "valor_texto": "202605", "norma": "PRT GM/MS 3.493/2024, Art. 3º",
         "fonte": "Contagem de 20 meses conferida", "justificativa": "Fim da transição registrado para teste",
         "vigencia_inicio": "202401", "nacional": False}
    tid = (await c.post("/api/aps-simulador/parametros", json=t, headers=_h(tok))).json()["id"]
    await c.post(f"/api/aps-simulador/parametros/{tid}/decidir", json={"aprovar": True}, headers=_h(outro))
    d = (await c.get("/api/aps-simulador", headers=_h(tok))).json()
    assert d["transicao"]["em_transicao"] is False and d["desempenho"]["efeito_financeiro"] == "imediato"
    assert d["kpis"]["total_potencial_mensal"] == round(d["kpis"]["financiamento_atual_mensal"]
                                                        + d["desempenho"]["incremento_mensal_proximo_nivel"], 2)
    # isolamento: outro município não vê parâmetro municipal nem dados
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/aps-simulador", headers=_h(tok_b))).json()["situacao_dado"] == "nao_disponivel"
    hist_b = (await c.get("/api/aps-simulador/parametros", headers=_h(tok_b))).json()["historico"]
    assert not any(h["chave"] in ("qualidade.eSF.bom", "transicao.fim") for h in hist_b)


async def test_monitor_detecta_alteracao_de_valores_de_referencia(ambiente, monkeypatch):
    S = ambiente["Session"]
    mid = ambiente["ids"]["apui"]
    await _semear(S, mid, monkeypatch)
    nova = copy.deepcopy(PARCELA_202610)
    for comp in nova["componentes"]:
        if comp["co_componente"] == 5:
            comp["resumo"]["_referencia"]["valoresReferencia"] = {**comp["resumo"]["_referencia"]["valoresReferencia"],
                                                                 "vlCusteioModalidadeI": 4500, "portaria": "Portaria nova"}

    async def buscar(ibge, parcelas=3, client=None):
        return [nova]
    monkeypatch.setattr(ep, "buscar", buscar)
    async with S() as db:
        r = await ep.sincronizar(db, mid, "1300144")
        assert len(r["alteracoes_normativas"]) == 1
        d = await sim.simular(db, mid)
        assert any(a["tipo"] == "norma_alterada" for a in d["alertas"])
        from services import aps_parametros as ap
        hist = [h for h in await ap.historico(db, mid) if h["chave"] == "egestor.ref.5"]
        assert len(hist) == 2 and {h["situacao"] for h in hist} == {"vigente", "pendente_validacao"}   # nada apagado
