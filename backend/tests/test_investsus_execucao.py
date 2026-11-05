"""InvestSUS — Execução Financeira dos Planos de Trabalho: cálculos, duplicidade, plano
aprovado, perfis, isolamento por município, importação, alertas e relatórios."""
import io
from datetime import date

import pytest
from fastapi import HTTPException


def _u(mid, role="financeiro", nome="tecnico"):
    from routers.auth import UserOut
    return UserOut(username=nome, nome=nome.title(), role=role, municipio_id=mid, municipio="Apuí",
                   municipio_ibge="1300144")


def _rt():
    from routers import investsus_execucao as rt
    return rt


async def _painel(db, u, **kw):
    args = {"exercicio": None, "origem": None, "destinacao": None, "fase": None, "situacao_plano": None,
            "busca": None, "proposta_id": None, **kw}
    return await _rt().painel(db, u, **args)


async def _cenario(db, municipio):
    from models.investsus import PagamentoInvestSUS, PropostaInvestSUS, SituacaoNormalizada
    from models.municipio import Municipio

    outro = Municipio(nome="Outro", uf="AM", codigo_ibge="1300000")
    db.add(outro)
    await db.flush()
    emenda_mac = PropostaInvestSUS(municipio_id=municipio.id, numero_proposta="E-MAC", exercicio=2026,
                                   modalidade="rp6", componente="MAC", valor_indicado=100000,
                                   valor_aprovado=100000, valor_pago=100000,
                                   situacao_normalizada=SituacaoNormalizada.TOTALMENTE_PAGA)
    programa_aps = PropostaInvestSUS(municipio_id=municipio.id, numero_proposta="P-APS", exercicio=2026,
                                     modalidade="programa", acao_orcamentaria="Incremento Atenção Primária",
                                     valor_aprovado=50000, valor_pago=50000,
                                     situacao_normalizada=SituacaoNormalizada.TOTALMENTE_PAGA)
    cancelada = PropostaInvestSUS(municipio_id=municipio.id, numero_proposta="CANC", exercicio=2026,
                                  modalidade="rp7", valor_aprovado=999, situacao_normalizada=SituacaoNormalizada.CANCELADA)
    alheia = PropostaInvestSUS(municipio_id=outro.id, numero_proposta="X", exercicio=2026, modalidade="rp6",
                               valor_aprovado=1, situacao_normalizada=SituacaoNormalizada.TOTALMENTE_PAGA)
    db.add_all([emenda_mac, programa_aps, cancelada, alheia])
    await db.flush()
    db.add_all([PagamentoInvestSUS(proposta_id=emenda_mac.id, data_pagamento=date(2026, 3, 10), valor=60000),
                PagamentoInvestSUS(proposta_id=emenda_mac.id, data_pagamento=date(2026, 5, 10), valor=40000)])
    await db.commit()
    return emenda_mac, programa_aps, cancelada, alheia, outro


async def _lancar_padrao(db, u, p):
    rt = _rt()
    a = (await rt.criar_acao(p.id, rt.AcaoCreate(descricao="Serviços médicos", valor_previsto=70000), db, u))["id"]
    b = (await rt.criar_acao(p.id, rt.AcaoCreate(descricao="Material de consumo", quantidade=100,
                                                 valor_unitario=300), db, u))["id"]
    L = rt.LancamentoCreate
    await rt.criar_lancamento(a, L(tipo="empenho", data="2026-04-01", valor=50000, numero_empenho="E1"), db, u)
    await rt.criar_lancamento(a, L(tipo="liquidacao", data="2026-04-20", valor=40000, numero_liquidacao="L1",
                                   documento_comprobatorio="NF 10"), db, u)
    await rt.criar_lancamento(a, L(tipo="pagamento", data="2026-05-02", valor=30000, ordem_bancaria="OB1",
                                   documento_comprobatorio="NF 10"), db, u)
    await rt.criar_lancamento(a, L(tipo="estorno_pagamento", data="2026-05-03", valor=5000), db, u)
    await rt.criar_lancamento(b, L(tipo="empenho", data="2026-04-02", valor=10000, numero_empenho="E2"), db, u)
    M = rt.MovimentoCreate
    await rt.criar_movimento(p.id, M(tipo="saldo_inicial", data="2026-01-01", valor=1000), db, u)
    await rt.criar_movimento(p.id, M(tipo="rendimento", data="2026-06-30", valor=200), db, u)
    await rt.criar_movimento(p.id, M(tipo="devolucao", data="2026-07-01", valor=100), db, u)
    return a, b


async def test_calculos_da_ficha_e_por_acao(db_session, municipio):
    emenda, *_ = await _cenario(db_session, municipio)
    u = _u(municipio.id)
    a, b = await _lancar_padrao(db_session, u, emenda)
    f = await _rt().ficha(emenda.id, db_session, u)
    r = f["resumo"]
    assert r["aprovado"] == 100000 and r["recebido"] == 100000 and r["saldo_a_receber"] == 0
    assert r["valor_plano"] == 100000                              # 70.000 + 100 × 300
    assert (r["empenhado"], r["liquidado"], r["pago"]) == (60000, 40000, 25000)
    assert r["saldo_a_pagar"] == 15000 and r["empenhado_a_pagar"] == 35000
    assert r["saldo_financeiro"] == 1000 + 100000 + 200 - 25000 - 100
    assert r["saldo_plano"] == 75000 and r["perc_execucao"] == 25.0
    acao_a = next(x for x in f["acoes"] if x["id"] == a)
    assert acao_a["pago"] == 25000 and acao_a["saldo_a_pagar"] == 15000 and acao_a["saldo_plano"] == 45000
    assert acao_a["perc_execucao"] == 35.7
    acao_b = next(x for x in f["acoes"] if x["id"] == b)
    assert acao_b["previsto"] == 30000 and acao_b["pago"] == 0
    assert all(l["origem_dado"] == "manual" for l in acao_a["lancamentos"])
    assert all(rp["origem_dado"] == "oficial" for rp in f["repasses_fns"])
    assert any(h["evento"] == "criacao" and h["entidade"] == "lancamento" for h in f["historico"])


async def test_consolidado_sem_dupla_contagem(db_session, municipio):
    emenda, programa, *_ = await _cenario(db_session, municipio)
    u = _u(municipio.id)
    await _lancar_padrao(db_session, u, emenda)
    pn = await _painel(db_session, u)
    assert {p["numero_proposta"] for p in pn["propostas"]} == {"E-MAC", "P-APS"}   # sem cancelada / outro município
    ind = pn["indicadores"]
    assert ind["total_propostas"] == 2 and ind["total_planos"] == 1
    assert ind["recebido"] == 150000 and ind["recebido_emendas"] == 100000
    assert ind["pago"] == 25000
    cons = pn["consolidado"]
    por_origem = {l["chave"]: l for l in cons["por_origem"]}
    por_area = {l["chave"]: l for l in cons["por_destinacao"]}
    assert por_origem["rp6"]["recebido"] == 100000 and por_origem["programa"]["recebido"] == 50000
    assert por_area["mac"]["recebido"] == 100000 and por_area["aps_pap"]["recebido"] == 50000
    soma = lambda ls: round(sum(l["recebido"] for l in ls), 2)
    assert soma(cons["por_origem"]) == soma(cons["por_destinacao"]) == cons["total"]["recebido"] == 150000
    # proposta sem plano: saldo do plano não é inventado, aprovado aparece à parte
    assert ind["saldo_plano"] == 75000 and ind["aprovado_sem_plano"] == 50000
    assert next(p for p in pn["propostas"] if p["numero_proposta"] == "P-APS")["sem_lancamento"] is True
    # filtros
    assert (await _painel(db_session, u, destinacao="mac"))["indicadores"]["total_propostas"] == 1
    assert (await _painel(db_session, u, origem="programa"))["graficos"]["programas_ms"][0]["recebido"] == 50000
    meses = {m["mes"]: m for m in pn["graficos"]["evolucao_mensal"]}
    assert meses["2026-05"]["pago"] == 25000 and meses["2026-03"]["recebido"] == 60000


async def test_lancamento_nao_conta_duas_vezes(db_session, municipio):
    emenda, programa, *_ = await _cenario(db_session, municipio)
    rt, u = _rt(), _u(municipio.id)
    a, _ = await _lancar_padrao(db_session, u, emenda)
    L = rt.LancamentoCreate
    with pytest.raises(HTTPException) as e:
        await rt.criar_lancamento(a, L(tipo="pagamento", data="2026-06-01", valor=1, ordem_bancaria="ob-1"), db_session, u)
    assert e.value.status_code == 409
    # mesma OB em outra proposta do município também é recusada
    outra = (await rt.criar_acao(programa.id, rt.AcaoCreate(descricao="Ação", valor_previsto=1000), db_session, u))["id"]
    with pytest.raises(HTTPException) as e:
        await rt.criar_lancamento(outra, L(tipo="pagamento", data="2026-06-01", valor=1, ordem_bancaria="OB1"), db_session, u)
    assert e.value.status_code == 409 and "E-MAC" in e.value.detail
    # sem número: mesma data+valor+ação é duplicado
    with pytest.raises(HTTPException):
        await rt.criar_lancamento(a, L(tipo="estorno_pagamento", data="2026-05-03", valor=5000), db_session, u)
    # cancelado deixa de somar e libera o documento
    f = await rt.ficha(emenda.id, db_session, u)
    ob = next(l for x in f["acoes"] for l in x["lancamentos"] if l["ordem_bancaria"] == "OB1")
    with pytest.raises(HTTPException):
        await rt.cancelar_lancamento(ob["id"], rt.Motivo(motivo=" "), db_session, u)
    await rt.cancelar_lancamento(ob["id"], rt.Motivo(motivo="Lançado na proposta errada"), db_session, u)
    assert (await rt.ficha(emenda.id, db_session, u))["resumo"]["pago"] == -5000 + 0
    await rt.criar_lancamento(outra, L(tipo="pagamento", data="2026-06-01", valor=1000, ordem_bancaria="OB1"), db_session, u)


async def test_plano_aprovado_preserva_original_e_exige_autorizacao(db_session, municipio):
    emenda, *_ = await _cenario(db_session, municipio)
    rt, tec, gestor = _rt(), _u(municipio.id), _u(municipio.id, "gestor", "gestora")
    a, _ = await _lancar_padrao(db_session, tec, emenda)
    with pytest.raises(HTTPException) as e:
        await rt.aprovar_plano(emenda.id, db_session, tec)
    assert e.value.status_code == 403
    await rt.aprovar_plano(emenda.id, db_session, gestor)
    with pytest.raises(HTTPException) as e:
        await rt.atualizar_acao(a, rt.AcaoUpdate(valor_previsto=80000), db_session, tec)
    assert e.value.status_code == 422
    await rt.atualizar_acao(a, rt.AcaoUpdate(valor_previsto=80000, justificativa="Remanejamento",
                                             autorizacao="Ofício 12/2026 CGFAP"), db_session, tec)
    with pytest.raises(HTTPException):
        await rt.criar_acao(emenda.id, rt.AcaoCreate(descricao="Nova", valor_previsto=10), db_session, tec)
    f = await rt.ficha(emenda.id, db_session, tec)
    acao = next(x for x in f["acoes"] if x["id"] == a)
    assert acao["previsto_original"] == 70000 and acao["previsto"] == 80000
    h = next(h for h in f["historico"] if h["campo"] == "valor_previsto" and h["valor_novo"] == "80000.0")
    assert h["valor_anterior"] == "70000.0" and h["autorizacao"] == "Ofício 12/2026 CGFAP" and h["usuario"] == "tecnico"
    with pytest.raises(HTTPException) as e:   # ação com lançamentos não é excluída
        await rt.inativar_acao(a, rt.Motivo(motivo="x"), db_session, tec)
    assert e.value.status_code == 409


async def test_perfis_e_isolamento(db_session, municipio):
    emenda, _, _, alheia, outro = await _cenario(db_session, municipio)
    rt = _rt()
    a, _ = await _lancar_padrao(db_session, _u(municipio.id), emenda)
    consulta = _u(municipio.id, "consulta", "conselheiro")
    with pytest.raises(HTTPException) as e:
        await rt.criar_acao(emenda.id, rt.AcaoCreate(descricao="x"), db_session, consulta)
    assert e.value.status_code == 403
    assert (await rt.ficha(emenda.id, db_session, consulta))["permissoes"] == {"perfil": "consulta", "lancar": False,
                                                                               "validar": False}
    f = await rt.ficha(emenda.id, db_session, consulta)
    lid = f["acoes"][0]["lancamentos"][0]["id"]
    with pytest.raises(HTTPException) as e:
        await rt.validar_lancamento(lid, rt.Validacao(), db_session, _u(municipio.id))
    assert e.value.status_code == 403
    await rt.validar_lancamento(lid, rt.Validacao(), db_session, _u(municipio.id, "gestor", "gestora"))
    # outro município: 404 idêntico, sem vazar
    u_outro = _u(outro.id)
    for chamada in (rt.ficha(emenda.id, db_session, u_outro),
                    rt.criar_lancamento(a, rt.LancamentoCreate(tipo="empenho", data="2026-01-01", valor=1), db_session, u_outro),
                    rt.cancelar_lancamento(lid, rt.Motivo(motivo="x"), db_session, u_outro)):
        with pytest.raises(HTTPException) as e:
            await chamada
        assert e.value.status_code == 404
    assert [p["numero_proposta"] for p in (await _painel(db_session, u_outro))["propostas"]] == ["X"]


async def test_importa_plano_sincronizado_uma_unica_vez(db_session, municipio):
    from models.investsus import AcaoServico, PlanoTrabalho
    emenda, *_ = await _cenario(db_session, municipio)
    pl = PlanoTrabalho(proposta_id=emenda.id, valor_indicado=100000)
    db_session.add(pl)
    await db_session.flush()
    db_session.add_all([AcaoServico(plano_id=pl.id, descricao="Custeio de exames", valor=60000),
                        AcaoServico(plano_id=pl.id, descricao="Insumos", valor=40000)])
    await db_session.commit()
    rt, u = _rt(), _u(municipio.id)
    assert (await rt.importar_plano(emenda.id, db_session, u))["importadas"] == 2
    assert (await rt.importar_plano(emenda.id, db_session, u))["importadas"] == 0
    f = await rt.ficha(emenda.id, db_session, u)
    assert [a["origem_dado"] for a in f["acoes"]] == ["importado", "importado"]
    assert f["resumo"]["valor_plano"] == 100000 and f["importacao"]["pendentes"] == 0


async def test_alertas(db_session, municipio):
    emenda, programa, *_ = await _cenario(db_session, municipio)
    rt, u = _rt(), _u(municipio.id)
    a = (await rt.criar_acao(emenda.id, rt.AcaoCreate(descricao="Exames", valor_previsto=1000), db_session, u))["id"]
    await rt.criar_acao(emenda.id, rt.AcaoCreate(descricao="Consultas", valor_previsto=10000), db_session, u)
    L = rt.LancamentoCreate
    await rt.criar_lancamento(a, L(tipo="empenho", data="2026-04-01", valor=900, numero_empenho="E9"), db_session, u)
    await rt.criar_lancamento(a, L(tipo="pagamento", data="2026-04-05", valor=1200, ordem_bancaria="OB9"), db_session, u)
    await rt.atualizar_ficha(emenda.id, rt.FichaUpdate(prazo_execucao="2020-01-01", saldo_extrato=10), db_session, u)
    al = await rt.alertas_execucao(db_session, u, None)
    tipos = {(x["numero_proposta"], x["tipo"]) for x in al["alertas"]}
    assert ("P-APS", "sem_plano") in tipos                      # recebeu do FNS e não tem plano
    assert {("E-MAC", t) for t in ("acima_previsto", "inconsistencia_estagios", "sem_comprovante",
                                   "prazo_vencido", "conciliacao")} <= tipos
    assert not any(x["numero_proposta"] == "CANC" for x in al["alertas"])
    assert al["alertas"][0]["nivel"] == "critico"


def test_saldo_nao_executado_nao_e_irregularidade_sem_prazo():
    from types import SimpleNamespace as N
    from services import investsus_execucao as ex
    p = N(valor_aprovado=100.0, valor_indicado=100.0, valor_pago=100.0)
    acao = N(id=1, ativa=True, valor_previsto_atual=100.0, valor_previsto_original=100.0, descricao="A")
    r = ex.resumo_ficha(p, None, [acao], [], [], [N(valor=100.0, data_pagamento=date(2026, 10, 1))])
    assert r["saldo_financeiro"] == 100.0 and r["saldo_plano"] == 100.0
    al = ex.alertas(p, None, r, [acao], [], set(), date(2026, 11, 4))
    assert [a["tipo"] for a in al] == ["sem_movimentacao"] and al[0]["nivel"] == "informativo"


async def test_planilha_excel_ida_e_volta(db_session, municipio):
    from openpyxl import load_workbook
    from starlette.datastructures import UploadFile
    emenda, *_ = await _cenario(db_session, municipio)
    rt, u = _rt(), _u(municipio.id)
    await _lancar_padrao(db_session, u, emenda)
    resp = await rt.exportar_planilha(emenda.id, db_session, u)
    wb = load_workbook(io.BytesIO(resp.body))
    ws = wb["Plano"]
    ws.append([None, "Medicamentos", None, "339030", 10, "cx", 50])
    wb["Lançamentos"].append([None, "Medicamentos", "empenho", "15/08/2026", 500, "Farma Ltda", None, "E77"])
    wb["Lançamentos"].append([None, "Serviços médicos", "pagamento", "2026-05-02", 30000, None, None, None, None, "OB1"])
    buf = io.BytesIO()
    wb.save(buf)

    def arquivo():
        return UploadFile(io.BytesIO(buf.getvalue()), filename="plano.xlsx")
    previa = await rt.importar_planilha(emenda.id, db_session, u, arquivo(), False)
    assert previa["previa"] and previa["novas_acoes"] == 1
    res = await rt.importar_planilha(emenda.id, db_session, u, arquivo(), True)
    assert res["acoes_criadas"] == 1 and res["lancamentos_criados"] == 1
    assert len(res["duplicados"]) == 6                          # os 5 exportados + OB1 já existentes
    f = await rt.ficha(emenda.id, db_session, u)
    med = next(a for a in f["acoes"] if a["descricao"] == "Medicamentos")
    assert med["previsto"] == 500 and med["empenhado"] == 500 and med["origem_dado"] == "importado"
    assert f["resumo"]["pago"] == 25000                          # nada contado duas vezes


@pytest.mark.parametrize("tipo", ["consolidado", "individual", "modalidade", "area", "saldos", "pendencias"])
async def test_relatorios_pdf_e_excel(db_session, municipio, tipo):
    emenda, *_ = await _cenario(db_session, municipio)
    rt, u = _rt(), _u(municipio.id, "auditoria", "auditor")
    await _lancar_padrao(db_session, _u(municipio.id), emenda)
    for formato, assinatura in (("pdf", b"%PDF"), ("xlsx", b"PK")):
        resp = await rt.relatorio(tipo, db_session, u, formato, None, None, None, emenda.id)
        assert resp.body[:len(assinatura)] == assinatura
