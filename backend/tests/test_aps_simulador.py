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

ESB = ["0001773860", "0001773895", "0001773909", "0001773917", "0001773925", "0001773941", "0001773984",
       "0001774026", "0001774042", "0002329840"]
ESF = ["0000007072", "0000007080", "0000007099", "0000007056", "0001536974", "0000007064", "0001690442",
       "0001690426", "0002323613"]
PESOS = {"C1": 1, "C2": 2, "C3": 2, "C4": 1, "C5": 1, "C6": 1, "C7": 2}
CONC = {"regular": 0.25, "suficiente": 0.5, "bom": 0.75, "otimo": 1.0}


def _inds(classes: dict) -> list[dict]:
    return [{"co": i, "codigo": c, "peso": PESOS[c], "classificacao": k, "conceito": CONC[k], "nota": CONC[k] * PESOS[c]}
            for i, (c, k) in enumerate(classes.items())]


def _q(mid, quad, comp, sg, ine, classe, nota=None, inds=None, valida=True):
    return SiapsQuadrimestreEquipe(municipio_id=mid, quadrimestre=quad, componente=comp, sg_equipe=sg, ine=ine,
                                   equipe=ine, nota_final=nota, classificacao=classe, equipe_valida=valida,
                                   homologada=True, indicadores=inds or [], hash=f"{quad}{comp}{ine}",
                                   capturado_em=datetime.utcnow())


async def _semear(S, mid, monkeypatch, parcela=PARCELA_202610):
    """Formato real de Apuí: 2026Q1 (aplicada na parcela 10/2026) e 2026Q2 (mais recente)."""
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
        for ine in ESB:
            db.add(EquipeSiaps(municipio_id=mid, ine=ine, nome=f"ESB {ine[-3:]}", tipo="eSB"))
        # 2026Q1: qualidade eSF toda Ótimo; eSB 4 Ótimo + 6 Bom; eMulti Bom; eSFR Ótimo; vínculo variado
        regs = [_q(mid, "2026Q1", "QUALIDADE", "eSF", i, "otimo", 8.0) for i in ESF]
        regs += [_q(mid, "2026Q1", "QUALIDADE", "eSB", i, "otimo" if k < 4 else "bom", 6.0) for k, i in enumerate(ESB)]
        regs += [_q(mid, "2026Q1", "QUALIDADE", "eMulti", "0002449927", "bom", 6.0),
                 _q(mid, "2026Q1", "QUALIDADE", "eSFR", "0000007048", "otimo", 8.0)]
        regs += [_q(mid, "2026Q1", "CVAT", "eSF", i, c, 7.5) for i, c in zip(ESF, ["otimo", "bom", "regular"] * 3)]
        # 2026Q2: equipe 1 cai para Suficiente (nota 4,5); demais seguem Ótimo; eMulti sobe para Ótimo
        q1 = _inds({"C1": "suficiente", "C2": "suficiente", "C3": "suficiente", "C4": "regular",
                    "C5": "suficiente", "C6": "regular", "C7": "suficiente"})
        regs += [_q(mid, "2026Q2", "QUALIDADE", "eSF", ESF[0], "suficiente", sum(i["nota"] for i in q1), q1)]
        regs += [_q(mid, "2026Q2", "QUALIDADE", "eSF", i, "otimo", 8.0) for i in ESF[1:]]
        regs += [_q(mid, "2026Q2", "CVAT", "eSF", ESF[0], "bom", 7.2)]
        regs += [_q(mid, "2026Q2", "CVAT", "eSF", ESF[2], "regular", 4.0)]
        # avaliação antiga com a eSFR "Bom": não pode virar "classificação" (outros componentes usam 2026Q1)
        regs += [_q(mid, "2025Q1", "QUALIDADE", "eSFR", "0000007048", "bom", 6.0)]
        regs += [_q(mid, "2026Q2", "QUALIDADE", "eMulti", "0002449927", "otimo", 8.0)]
        db.add_all(regs)
        await db.commit()
    return sum(i["nota"] for i in q1)


async def test_situacao_atual_regra_identificada_e_desempenho(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    nota1 = await _semear(S, ambiente["ids"]["apui"], monkeypatch)
    assert nota1 == 4.5
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/aps-simulador", headers=_h(tok))).json()
    assert d["situacao_dado"] == "oficial_validado" and d["parcela"] == "202610"
    assert "CNS e e-SUS PEC não são fontes" in d["nao_utiliza"]
    p = d["perfil"]
    assert p["estrato_ied"] == "E2" and p["populacao"] == 21781 and p["populacao_ano"] == 2025
    soma = sum(x["resumo"].get("vlTotal") or 0 for x in PARCELA_202610["componentes"])
    assert d["kpis"]["financiamento_atual_mensal"] == round(soma, 2)
    assert d["kpis"]["financiamento_atual_anual"] == round(soma * 12, 2)
    # regra identificada no próprio pagamento
    regras = {r["chave"]: r for r in d["desempenho"]["regras"]}
    assert (regras["qualidade.eSF"]["regra"], regras["qualidade.eSF"]["quadrimestre"]) == ("classificacao", "2026Q1")
    assert regras["qualidade.eSF"]["esperado"] == 72000                   # 9 × Ótimo R$ 8.000
    assert (regras["qualidade.eSB"]["regra"], regras["qualidade.eSB"]["esperado"]) == ("classificacao", 33000)  # 9.591
    assert regras["qualidade.eMulti"]["regra"] == "classificacao"         # Estratégica Bom R$ 2.250 em 2026Q1
    assert regras["vinculo.eSF"]["regra"] == "bom"                        # vínculo ainda pago como "Bom"
    assert regras["qualidade.eSFR"]["regra"] == "bom"                     # eSFR paga R$ 6.000 (Bom), avaliada Ótimo
    assert regras["vinculo.eSFR"]["regra"] == "bom"                       # Art. 69-D: 12 parcelas no valor "Bom"
    assert not [x for x in d["diferencas"] if x["tipo"] == "parametro_divergente"]
    # previsão com a avaliação mais recente (2026Q2): equipe 1 cai para Suficiente (−R$ 4.000); eMulti sobe (+R$ 750)
    assert regras["qualidade.eSF"]["previsao_quadrimestre"] == "2026Q2"
    assert regras["qualidade.eSF"]["variacao_mensal"] == -4000
    assert regras["qualidade.eMulti"]["variacao_mensal"] == 750
    prev = [x for x in d["diferencas"] if x["tipo"] == "previsao_proxima_avaliacao"]
    assert any("R$ 68.000,00" in x["texto"] for x in prev)
    assert any(x["tipo"] == "desconto_repetido" for x in d["diferencas"])
    assert any(x["tipo"] == "desconto" for x in d["diferencas"])
    # por equipe: pago pela regra identificada (não rateio)
    e1 = next(e for e in d["por_equipe"] if e["ine"] == ESF[0])
    assert e1["atual"] == {"fixo": 16000, "vinculo": 6000, "qualidade": 8000}
    assert e1["norma"]["qualidade"] == 4000                               # Suficiente na avaliação mais recente
    m = next(x for x in e1["melhoria"] if x["componente"] == "qualidade")
    assert (m["de"], m["para"], m["incremento_mensal"], m["efeito"]) == ("suficiente", "bom", 2000, "proxima_avaliacao")
    assert m["plano"]["possivel"] and m["plano"]["nota_projetada"] >= 5
    assert m["plano"]["passos"][0]["indicador"] in ("C2", "C3") and m["plano"]["passos"][0]["para"] == "bom"
    v = next(x for x in e1["melhoria"] if x["componente"] == "vinculo")
    assert (v["de"], v["para"], v["incremento_mensal"], v["efeito"]) == ("bom", "otimo", 2000, "apos_transicao")
    esb = next(e for e in d["por_equipe"] if e["ine"] == ESB[0])
    assert esb["atual"]["qualidade"] == 3750 and esb["atual"]["custeio"] == 6021
    em1 = next(e for e in d["por_equipe"] if e["ine"] == "0002449927")
    assert em1["atual"]["qualidade"] == 2250 and em1["norma"]["qualidade"] == 3000 and em1["norma"]["custeio"] == 12000
    # incremento por desempenho: qualidade eSF (equipe 1 Suficiente→Bom) entra; vínculo fica "após a transição"
    assert d["desempenho"]["incremento_mensal_proximo_nivel"] == 2000
    assert d["desempenho"]["incremento_mensal_apos_transicao"] == 2000 + 2000      # equipe 1 Bom→Ótimo; equipe 3 Regular→Suficiente
    # fim da transição do vínculo: equipe 3 (Regular) perderia R$ 4.000/mês; previsão atual continua "Bom"
    e3 = next(e for e in d["por_equipe"] if e["ine"] == ESF[2])
    assert e3["norma"]["vinculo"] == 6000 and e3["fim_transicao"] == [{"componente": "vinculo", "classificacao": "regular",
                                                                      "variacao_mensal": -4000}]
    assert d["kpis"]["fim_transicao_perdas_mensal"] == -4000
    areal = next(e for e in d["por_equipe"] if e["ine"] == "0000007048")
    assert areal["norma"]["vinculo"] == areal["atual"]["vinculo"] == 6000      # sem avaliação nova: mantém o pago
    assert d["desempenho"]["efeito_financeiro"] == "imediato"
    assert d["kpis"]["total_potencial_mensal"] == round(d["kpis"]["financiamento_atual_mensal"] + 2000, 2)
    assert d["kpis"]["variacao_proxima_avaliacao_mensal"] == -4000 + 750


async def test_oportunidades_apui(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    await _semear(S, ambiente["ids"]["apui"], monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/aps-simulador", headers=_h(tok))).json()
    ops = {o["id"]: o for o in d["oportunidades"]}
    # teto 11, credenciadas 10, homologadas 9
    assert ops["esf_homologacao"]["quantidade"] == 1 and ops["esf_homologacao"]["elegibilidade"] == "potencial"
    assert ops["esf_homologacao"]["custeio_unitario"] == 28000          # fixo E2 16.000 + vínculo e qualidade “Bom”
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
    # eSFR (PRT 5.850/2024): só o custeio base é pago → embarcação registrada sem incentivo, adicionais não custeados
    assert ops["esfr_embarcacao_registrada"]["quantidade"] == 1 and ops["esfr_embarcacao_registrada"]["custeio_unitario"] == 6000
    assert "RIO SUCUNDURI" in ops["esfr_embarcacao_registrada"]["observacao"]
    assert ops["esfr_embarcacoes"]["quantidade"] == 3 and ops["esfr_unidades_apoio"]["quantidade"] == 4
    assert ops["esfr_unidades_apoio"]["custeio_unitario"] == 4000 and ops["esfr_pickup"]["custeio_unitario"] == 6000
    assert ops["esfr_aux_enf"]["incremento_mensal"] == 11 * 2375 and ops["esfr_nivel_superior"]["incremento_mensal"] == 2 * 5000
    assert ops["esfr_microscopistas"]["quantidade"] == 7 and ops["esfr_microscopistas"]["custeio_unitario"] == 3242
    assert ops["esfr_nova"]["custeio_unitario"] == 24000 + 6000 + 6000 and ops["esfr_nova"]["grupo_exclusivo"] == "esf_vaga"
    assert "Amazônia Legal" in ops["esfr_nova"]["perfil"]
    # ACS acima do teto → não elegível
    assert ops["acs"]["elegibilidade"] == "nao_elegivel"
    # programas sem recebimento descobertos pelo e-Gestor (dados insuficientes, com valor de referência)
    assert ops["academia"]["elegibilidade"] == "dados_insuficientes"
    # nada potencial é somado ao total garantido; excludentes contam uma vez no "a confirmar"
    assert d["kpis"]["incremento_credenciamento_confirmado_mensal"] == 0
    max_esf = max(ops["esf_homologacao"]["incremento_mensal"], ops["esf_nova"]["incremento_mensal"])
    assert d["kpis"]["incremento_credenciamento_a_confirmar_mensal"] >= max_esf
    assert len(d["respostas"]) == 6
    # resumo por tipo de equipe: soma dos grupos = financiamento atual; oportunidades no grupo certo
    pt = {g["tipo"]: g for g in d["por_tipo"]}
    assert round(sum(g["recebe_mensal"] for g in d["por_tipo"]), 2) == d["kpis"]["financiamento_atual_mensal"]
    assert pt["eSFR"]["recebe_mensal"] == 24000 + 6000 + 6000 + 16210          # custeio + qualidade + vínculo + microscopistas
    assert {o["id"] for o in pt["eSFR"]["oportunidades"]} >= {"esfr_embarcacao_registrada", "esfr_nova"}
    assert pt["eMulti"]["credenciamento_a_confirmar_mensal"] == 42750         # excludentes: conta a maior
    assert pt["eSF"]["equipes"] == 9 and pt["ACS"]["oportunidades"][0]["elegibilidade"] == "nao_elegivel"
    assert pt["eSB"]["recebe_mensal"] == 60210 + 33000 + 9360 + 11250
    prov = d["respostas"][5]["resposta"]
    assert prov.count("2ª eMulti") == 1                                   # providência sem repetição


async def test_parametros_validacao_e_historico(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    mid = ambiente["ids"]["apui"]
    await _semear(S, mid, monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    outro = await _token(c, "multi@teste.gov.br")
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    novo = {"chave": "vinculo.eSF.bom", "valor": 6600, "norma": "Portaria GM/MS (exemplo de teste)",
            "fonte": "Texto oficial conferido no DOU", "justificativa": "Teste de atualização normativa",
            "vigencia_inicio": "202601", "nacional": False}
    assert (await c.post("/api/aps-simulador/parametros", json=novo, headers=_h(consulta))).status_code == 403
    assert (await c.post("/api/aps-simulador/parametros", json={**novo, "nacional": True}, headers=_h(tok))).status_code == 403
    pid = (await c.post("/api/aps-simulador/parametros", json=novo, headers=_h(tok))).json()["id"]
    # pendente não muda o cálculo
    d = (await c.get("/api/aps-simulador", headers=_h(tok))).json()
    assert {r["chave"]: r["regra"] for r in d["desempenho"]["regras"]}["vinculo.eSF"] == "bom"
    assert any(a.get("tipo") == "validacao_pendente" for a in d["alertas"])
    # quem registrou não valida; outro usuário valida
    assert (await c.post(f"/api/aps-simulador/parametros/{pid}/decidir", json={"aprovar": True}, headers=_h(tok))).status_code == 403
    assert (await c.post(f"/api/aps-simulador/parametros/{pid}/decidir", json={"aprovar": True}, headers=_h(outro))).json()["situacao"] == "vigente"
    d = (await c.get("/api/aps-simulador", headers=_h(tok))).json()
    # o novo valor não fecha com o pago (9 × 6.000) → divergência apontada, nada somado
    assert {r["chave"]: r["regra"] for r in d["desempenho"]["regras"]}["vinculo.eSF"] == "divergente"
    assert any(x["componente"] == "eSF — vínculo e acompanhamento" for x in d["diferencas"])
    # histórico: competência anterior à vigência continua com o valor antigo; versões da norma por vigência
    async with S() as db:
        from services import aps_parametros as ap
        assert ap.valor(await ap.vigentes(db, mid, "202512"), "vinculo.eSF.bom") == 6000
        assert ap.valor(await ap.vigentes(db, mid, "202610"), "vinculo.eSF.bom") == 6600
        assert ap.valor(await ap.vigentes(db, mid, "202512"), "qualidade.eSB.I_quil.bom") == 2755.13   # PRT 3.493
        assert ap.valor(await ap.vigentes(db, mid, "202610"), "qualidade.eSB.I_quil.bom") == 3000      # PRT 9.591
    # isolamento: outro município não vê parâmetro municipal nem dados
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/aps-simulador", headers=_h(tok_b))).json()["situacao_dado"] == "nao_disponivel"
    hist_b = (await c.get("/api/aps-simulador/parametros", headers=_h(tok_b))).json()["historico"]
    assert not any(h["chave"] == "vinculo.eSF.bom" for h in hist_b)


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


def test_estruturas_da_esfr_lidas_do_egestor_sem_dados_pessoais():
    det = {"validacoes": {"validacoesEquipes": [],
                          "validacoesEquipesEmEmbaracacao": [{"coEquipe": "0000007048", "nuEmbarcacao": "01",
                                                              "noEmbarcacao": "TERRA PRETA", "dsComunidadeAtendida": "RIO SUCUNDURI",
                                                              "coCns": "700000000000005"}],
                          "validacoesUnidadesApoio": []}}
    est = ep.estruturas(det)
    assert est["embarcacoes"] == [{"coEquipe": "0000007048", "nuEmbarcacao": "01", "noEmbarcacao": "TERRA PRETA",
                                   "dsComunidadeAtendida": "RIO SUCUNDURI"}]
    assert ep.estruturas({"validacoes": {}}) is None and ep.estruturas([]) is None
