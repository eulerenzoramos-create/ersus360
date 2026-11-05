"""InvestSUS — relatórios no modelo "RELATÓRIO — INVESTSUS": colunas do modelo preenchidas com
o que existe no banco, "Dados não disponíveis" quando não há fonte (nunca zero inventado),
isolamento por município e geração de PDF/Excel com o cabeçalho institucional."""
import io
from datetime import date

from services.relatorio_modelo_investsus import NAO_SE_APLICA, SEM_DADO


def _u(mid, role="auditoria", nome="auditor"):
    from routers.auth import UserOut
    return UserOut(username=nome, nome="Euler Ramos", role=role, municipio_id=mid, municipio="Apuí",
                   municipio_ibge="1300144", municipio_uf="AM", municipio_cnpj_fundo="12.834.320/0001-26")


async def _cenario(db, municipio):
    from models.investsus import PagamentoInvestSUS, Parlamentar, PropostaInvestSUS, SituacaoNormalizada
    from models.municipio import Municipio

    outro = Municipio(nome="Outro", uf="AM", codigo_ibge="1300000")
    parl = Parlamentar(nome="Dep. Fulano", partido="PSD", uf="AM")
    db.add_all([outro, parl])
    await db.flush()
    rp6 = PropostaInvestSUS(municipio_id=municipio.id, numero_proposta="RP6-1", exercicio=2026, modalidade="rp6",
                            parlamentar_id=parl.id, objeto="AQUISIÇÃO DE EQUIPAMENTO", valor_indicado=300000,
                            valor_aprovado=300000, situacao_original="Proposta paga",
                            situacao_normalizada=SituacaoNormalizada.TOTALMENTE_PAGA)
    rp7_sem_parl = PropostaInvestSUS(municipio_id=municipio.id, numero_proposta="RP7-1", exercicio=2026,
                                     modalidade="rp7", valor_indicado=150000,
                                     situacao_normalizada=SituacaoNormalizada.EM_ANALISE)
    programa = PropostaInvestSUS(municipio_id=municipio.id, numero_proposta="63000792928202600", exercicio=2026,
                                 modalidade="programa", payload_original={"tipo_raw": "CUSTEIO DA MÉDIA E ALTA COMPLEXIDADE"}, objeto="CUSTEIO DA MÉDIA E ALTA COMPLEXIDADE À SAÚDE",
                                 valor_indicado=2000050, valor_proposta=2000050,
                                 situacao_original="Proposta enviada para Análise Técnica de Mérito",
                                 situacao_normalizada=SituacaoNormalizada.EM_ANALISE)
    alheia = PropostaInvestSUS(municipio_id=outro.id, numero_proposta="ALHEIA", exercicio=2026, modalidade="rp6",
                               valor_aprovado=1, situacao_normalizada=SituacaoNormalizada.EM_ANALISE)
    db.add_all([rp6, rp7_sem_parl, programa, alheia])
    await db.flush()
    db.add(PagamentoInvestSUS(proposta_id=rp6.id, data_pagamento=date(2026, 3, 10), valor=120000))
    await db.commit()
    return rp6, rp7_sem_parl, programa, alheia


async def test_acompanhamento_nas_colunas_do_modelo(db_session, municipio):
    from routers import investsus as r
    await _cenario(db_session, municipio)
    d = await r.relatorio_acompanhamento(db_session, _u(municipio.id), None, None, None, None)
    linhas = {ln["numero_proposta"]: ln for ln in d["linhas"]}
    assert set(linhas) == {"RP6-1", "RP7-1", "63000792928202600"}          # nada de outro município

    e = linhas["RP6-1"]
    assert (e["autoria"], e["partido_uf"], e["objeto_programa"]) == ("Dep. Fulano", "PSD/AM",
                                                                      "AQUISIÇÃO DE EQUIPAMENTO")
    assert e["valor_global"] == 300000 and e["valor_repassado"] == 120000 and e["perc_repassado"] == 40.0
    assert e["situacao_rotulo"] == "Totalmente Paga" and e["situacao_original"] == "Proposta paga"

    p = linhas["63000792928202600"]
    assert p["autoria"] == NAO_SE_APLICA and p["partido_uf"] == NAO_SE_APLICA   # programa não tem parlamentar
    assert p["valor_global"] == 2000050                                       # ainda não aprovado: valor da proposta
    assert p["situacao_rotulo"] == "Em Análise"
    assert p["tipo"] == "MAC" and p["tipo_oficial"] == "CUSTEIO DA MÉDIA E ALTA COMPLEXIDADE"   # do tipo oficial

    s = linhas["RP7-1"]
    assert s["autoria"] == SEM_DADO and s["partido_uf"] == SEM_DADO           # emenda sem parlamentar: sem fonte
    assert s["objeto_programa"] == SEM_DADO and s["programa"] == SEM_DADO
    assert s["tipo"] == "Outro" and e["tipo"] == "Outro"                      # emenda sem componente oficial

    grupos = {g["modalidade"]: g for g in d["grupos"]}
    assert list(grupos)[:4] == ["rp6", "rp7", "rp8", "programa"]
    assert grupos["rp8"]["qtd"] == 0 and grupos["programa"]["valor_global"] == 2000050
    assert d["totais"]["total_global"] == 2450050


async def test_acompanhamento_exporta_pdf_e_excel(db_session, municipio):
    import pytest
    from openpyxl import load_workbook

    from routers import investsus as r
    await _cenario(db_session, municipio)
    u = _u(municipio.id)
    resp = await r.exportar_relatorio_acompanhamento(db_session, u, "xlsx", None, None, None, None)
    ws = load_workbook(io.BytesIO(resp.body)).active
    valores = [c for row in ws.iter_rows(values_only=True) for c in row if c is not None]
    assert "RELATÓRIO — INVESTSUS" in valores and "Dep. Fulano" in valores and 2000050 in valores
    assert "Nenhuma proposta encontrada nesta modalidade." in valores

    resp = await r.exportar_relatorio_acompanhamento(db_session, u, "pdf", 2026, None, None, None)
    assert resp.body[:4] == b"%PDF"
    PdfReader = pytest.importorskip("pypdf").PdfReader     # leitura do texto só onde o pypdf existe
    texto = " ".join(pg.extract_text() for pg in PdfReader(io.BytesIO(resp.body)).pages)
    for trecho in ("ERSUS 360", "Fundo Municipal de Saúde de APUÍ", "CNPJ: 12.834.320/0001-26",
                   "RELATÓRIO — INVESTSUS", "Responsável: Euler Ramos", "Escopo federal",
                   "EMENDA DE COMISSÃO (RP 8)", "Nenhuma proposta encontrada nesta modalidade.",
                   "Parlamentar / Autoria", "Dep. Fulano", "PSD/AM", "Oficial: Proposta enviada",
                   "Total Outros — Recurso de Programa (Outros)", "Dados não disponíveis"):
        assert trecho in texto, trecho
    assert "ALHEIA" not in texto


async def test_execucao_sem_lancamento_nao_vira_zero(db_session, municipio):
    from routers import investsus_execucao as rt
    from services import investsus_execucao_relatorios as rel
    rp6, *_ = await _cenario(db_session, municipio)
    u = _u(municipio.id)
    painel = await rt.painel(db_session, u, None, None, None, None, None, None, None)
    alertas = await rt.alertas_execucao(db_session, u, None)
    doc = rel.montar("consolidado", painel, alertas, None)
    assert [g.chave for g in doc.grupos][:4] == ["rp6", "rp7", "rp8", "programa"]
    ind = dict(doc.secoes[0].tabelas[0].linhas)
    assert ind["Empenhado (município)"] is None and ind["Pago (município)"] is None   # sai "Dados não disponíveis"
    assert ind["Repassado pelo FNS (oficial)"] == 120000
    linha = next(l for l in doc.secoes[1].tabelas[0].linhas if l[0] == "RP6-1")
    assert linha[6] is None and linha[8] is None and linha[5] == 120000

    ficha = await rt.ficha(rp6.id, db_session, u)
    ind_doc = rel.montar("individual", painel, alertas, ficha)
    assert [g.chave for g in ind_doc.grupos] == ["rp6"] and ind_doc.grupos[0].linhas[0].autoria == "Dep. Fulano"
    for tipo in rel.TIPOS:
        resp = await rt.relatorio(tipo, db_session, u, "pdf", 2026, None, None, rp6.id)
        assert resp.body[:4] == b"%PDF"


def test_tipo_so_de_campo_oficial():
    from services.relatorio_modelo_investsus import tipo_oficial_de, tipo_proposta
    assert tipo_proposta("programa", None, None) == "Programa MS"
    assert tipo_proposta("programa", "PAP", None) == "PAP"
    assert tipo_proposta("programa", None, "CUSTEIO DA ATENÇÃO PRIMÁRIA À SAÚDE") == "PAP"
    assert tipo_proposta("a_classificar", None, None) == SEM_DADO
    assert tipo_oficial_de({"tipo_raw": "-"}) is None and tipo_oficial_de(None) is None
