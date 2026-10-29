"""Tetos municipais de emendas (services/investsus_tetos.py): leitura das planilhas do FNS
e saldo = teto − comprometido, sem dupla contagem e sem valor estimado."""
import io
from types import SimpleNamespace

import openpyxl
import pytest

from services import investsus_tetos as tt

FONTES = tt.fontes_do_exercicio(2026)


def _xlsx(abas: dict[str, list[tuple]]) -> bytes:
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    for nome, linhas in abas.items():
        ws = wb.create_sheet(nome)
        for ln in linhas:
            ws.append(list(ln))
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# Leiautes iguais aos publicados pelo FNS em 03/2026 (cabeçalho abaixo de linhas de título).
PAP_INDIVIDUAL = _xlsx({
    "base": [("SG_UF", "NO_MUNICIPIO_ACENTUADO", "CO_MUNICIPIO_IBGE", "IVS", "TOTAL"),
             ("AM", "APUÍ", "130014", 0.48, "#REF!")],
    "PAP Município 25": [("MINISTÉRIO DA SAÚDE - MS",), (), ("Fonte: CGFAP/DEAPS/SAPS/MS em 05/02/2026.",), (),
                         ("UF", "MUNICÍPIO", "IBGE", "IVS", " VALOR"),
                         ("AM", "APUÍ", "130014", 0.48, 10209109),
                         ("AM", "JAPURÁ", "130210", 0.636, 7843777)],
})
MAC = _xlsx({
    "SES CARGA INVEST OK": [("UF", "IF_UF", "IBGE", "SECRETARIAS ESTADUAIS DE SAÚDE", "GESTÃO", "CNES", "CNPJ", "VL SECRETARIAS"),
                            ("AM", 13, "130000", "AMAZONAS", "ESTADUAL", "6546242", "x", 1015866778)],
    "SMS CARGA INVEST OK": [("MINISTÉRIO DA SAÚDE",), ("*Dados Sujeitos a atualizações", "Data de Relatório: 13/02/2026"),
                            ("UF", "IF_UF", "IBGE", "SECRETARIAS MUNICIPAIS DE SAÚDE", "GESTÃO", "CNES", "CNPJ",
                             "VL SECRETARIAS ESTADUAL/MUNICÍPIOS, DEDUZIDO OS FILANTR, SSA E ADM. IND. R$"),
                            ("AM", 13, "130014", "APUI", "MUNICIPAL", "6820662", "x", 5675296)],
    "FILANTR SMS CARGA INVEST OK": [("UF", "IBGE", "MUNICÍPIOS", "CNES", "DS_ESTABELECIMENTO", "GESTÃO", "CNPJ", "VL APROVADO R$"),
                                    ("AL", "270030", "ARAPIRACA", "2786346", "PESTALOZZI", "M", "x", 1273896)],
})


def test_pap_le_a_aba_oficial_e_ignora_a_aba_base():
    r = tt.extrair_teto(FONTES["individual_pap"], PAP_INDIVIDUAL, "130014")
    assert r["valor"] == 10209109
    assert r["situacao"] == tt.SITUACAO_CONFIRMADO
    assert r["detalhes"]["aba"] == "PAP Município 25" and r["detalhes"]["ivs"] == 0.48


def test_mac_soma_cnes_do_municipio_e_fica_pendente_pelos_acrescimos():
    r = tt.extrair_teto(FONTES["individual_mac"], MAC, "130014")
    assert r["valor"] == 5675296
    assert [c["cnes"] for c in r["detalhes"]["cnes"]] == ["6820662"]
    assert r["situacao"] == tt.SITUACAO_PENDENTE  # acréscimos 30%/20% não discriminados


def test_municipio_ausente_nao_vira_zero_nem_estimativa():
    r = tt.extrair_teto(FONTES["coletiva_pap"], PAP_INDIVIDUAL, "999999")
    assert r["valor"] is None and r["situacao"] == tt.SITUACAO_NAO_DISPONIVEL


def test_leiaute_desconhecido_e_recusado():
    with pytest.raises(tt.PlanilhaInvalida):
        tt.extrair_teto(FONTES["coletiva_pap"], _xlsx({"x": [("A", "B"), (1, 2)]}), "130014")
    with pytest.raises(tt.PlanilhaInvalida):
        tt.extrair_teto(FONTES["coletiva_pap"], b"<html>erro</html>", "130014")


# ── Consumo ───────────────────────────────────────────────────────────────────

_ID = iter(range(1, 1000))


def _p(mod, sit="aprovada", acao="2E89 — Incremento Temporário PAP", fin="custeio", ind=0.0, prop=0.0,
       apr=0.0, emp=0.0, pago=0.0, ex=2026, comp=None, objeto=None):
    return SimpleNamespace(
        id=next(_ID), numero_proposta=f"N{mod}", modalidade=mod, situacao_normalizada=sit,
        acao_orcamentaria=acao, componente=comp, bloco_financiamento=None, finalidade=None, tipo_objeto=None,
        objeto=objeto, programa=None, tipo_financiamento=fin, valor_indicado=ind, valor_proposta=prop,
        valor_aprovado=apr, valor_empenhado=emp, valor_pago=pago, exercicio=ex)


def _painel(props, tetos=None):
    tetos = tetos if tetos is not None else {"individual_pap": {"valor": 1000.0, "situacao": "confirmado"},
                      "coletiva_pap": {"valor": 500.0, "situacao": "confirmado"},
                      "coletiva_mac": {"valor": 800.0, "situacao": "pendente_validacao"}}
    painel = tt.montar_painel(tetos, props, lambda p: p.modalidade, 2026)
    return painel, {c["categoria"]: c for c in painel["cards"]}


def test_um_unico_estagio_por_proposta_sem_dupla_contagem():
    # indicado 400, aprovado 300, empenhado 300, pago 300 → consome 300 (não 1.300)
    _, c = _painel([_p("rp6", ind=400, prop=350, apr=300, emp=300, pago=300)])
    card = c["individual_pap"]
    assert card["comprometido"] == 300
    assert card["saldo"] == 700
    assert card["perc_utilizado"] == 30.0 and card["perc_disponivel"] == 70.0
    assert card["situacao"] == "confirmado"


def test_estagio_cai_para_proposta_e_depois_indicado():
    _, c = _painel([_p("rp6", sit="em_analise", ind=200, prop=150), _p("rp6", sit="recurso_disponivel", ind=100)])
    card = c["individual_pap"]
    assert card["comprometido"] == 250
    assert card["por_estagio"] == {"proposta": 150, "indicado": 100}


def test_bancada_e_comissao_dividem_um_teto_coletivo():
    _, c = _painel([_p("rp7", apr=200), _p("rp8", apr=100)])
    card = c["coletiva_pap"]
    assert card["comprometido"] == 300 and card["saldo"] == 200
    assert card["por_modalidade"] == {"rp7": {"qtd": 1, "valor": 200}, "rp8": {"qtd": 1, "valor": 100}}
    assert c["individual_pap"]["comprometido"] == 0  # individual é teto independente


def test_cancelada_e_rejeitada_nao_sao_subtraidas_mas_aparecem():
    _, c = _painel([_p("rp6", sit="cancelada", apr=500), _p("rp6", sit="rejeitada", ind=100)])
    card = c["individual_pap"]
    assert card["comprometido"] == 0 and len(card["excluidas"]) == 2


def test_investimento_e_outro_exercicio_nao_consomem():
    painel, c = _painel([_p("rp6", acao="8581 — Estruturação da Rede APS", fin="investimento", apr=900),
                         _p("rp6", apr=900, ex=2025)])
    assert c["individual_pap"]["comprometido"] == 0
    assert painel["propostas_outros_exercicios"] == 1


def test_mac_pela_acao_2e90_e_teto_pendente_propaga():
    _, c = _painel([_p("rp7", acao="2E90 — Incremento Temporário MAC", apr=100)])
    card = c["coletiva_mac"]
    assert card["comprometido"] == 100 and card["saldo"] == 700
    assert card["situacao"] == "pendente_validacao"


def test_sem_componente_fica_a_classificar_e_saldo_pendente():
    painel, c = _painel([_p("rp6", acao=None, fin=None, apr=50, objeto="Custeio diverso")])
    assert c["individual_pap"]["comprometido"] == 0
    assert len(painel["a_classificar"]["individual"]) == 1
    assert c["individual_pap"]["situacao"] == "pendente_validacao"


def test_teto_ausente_nao_calcula_saldo():
    _, c = _painel([_p("rp6", apr=100)], tetos={})
    card = c["individual_pap"]
    assert card["saldo"] is None and card["perc_disponivel"] is None
    assert card["situacao"] == "nao_disponivel"
    assert card["comprometido"] == 100


def test_acima_do_teto_e_sinalizado():
    _, c = _painel([_p("rp6", apr=1500)])
    assert c["individual_pap"]["saldo"] == -500 and c["individual_pap"]["acima_do_teto"]


def test_programacao_sem_limite_oficial_fica_nao_disponivel():
    painel, _ = _painel([_p("programa", acao="Programa X", apr=100, ind=120)])
    prog = {g["programa"]: g for g in painel["programacao"]["programas"]}["Programa X"]
    assert prog["valor_solicitado"] == 100
    assert prog["valor_maximo"] is None
    assert prog["situacao_limite"] == "nao_disponivel"


def test_classificacao_por_texto_de_incremento():
    assert tt.componente_do_teto(_p("rp6", acao="Incremento Temporário ao Custeio da Atenção Especializada")) == "mac"
    assert tt.componente_do_teto(_p("rp6", acao="INCREMENTO PAP")) == "pap"
    assert tt.componente_do_teto(_p("rp6", acao=None, comp="MAC")) == "mac"


# ── Rotas /api/investsus/tetos (banco em memória, FNS simulado) ───────────────

def _usuario(mid, role="gestor"):
    from routers.auth import UserOut
    return UserOut(username="teste", nome="Teste", role=role, municipio_id=mid, municipio_ibge="1300144")


async def test_rotas_gravam_teto_e_calculam_saldo_isolado_por_municipio(db_session, municipio, monkeypatch):
    from fastapi import HTTPException
    from models.investsus import PropostaInvestSUS, SituacaoNormalizada
    from models.municipio import Municipio
    from routers import investsus as rt

    async def falso_fns(ibge, exercicio):
        assert ibge == "1300144"
        return [{"categoria": "individual_pap", "exercicio": exercicio, "valor": 1000.0, "situacao": "confirmado",
                 "erro": None, "detalhes": {}, "documento": "Portaria", "url_planilha": "u", "url_pagina": "p",
                 "data_publicacao": tt.date(2026, 3, 3), "arquivo_modificado_em": None, "hash_sha256": "h"}]
    monkeypatch.setattr(tt, "consultar_tetos", falso_fns)

    outro = Municipio(nome="Outro", uf="AM", codigo_ibge="1300000")
    db_session.add(outro)
    await db_session.flush()
    for mid, valor in ((municipio.id, 300.0), (outro.id, 999.0)):
        db_session.add(PropostaInvestSUS(municipio_id=mid, numero_proposta=f"P{mid}", exercicio=2026, modalidade="rp6",
                                         acao_orcamentaria="2E89", tipo_financiamento="custeio", valor_aprovado=valor,
                                         situacao_normalizada=SituacaoNormalizada.APROVADA))
    await db_session.commit()

    with pytest.raises(HTTPException):  # perfil sem permissão não consulta o FNS
        await rt.atualizar_tetos_municipais(db_session, _usuario(municipio.id, role="acs"), None)

    r = await rt.atualizar_tetos_municipais(db_session, _usuario(municipio.id), None)
    assert r["ok"] and r["resultados"][0]["valor"] == 1000.0

    painel = await rt.tetos_municipais(db_session, _usuario(municipio.id), None)
    card = {c["categoria"]: c for c in painel["cards"]}["individual_pap"]
    assert card["teto"]["valor"] == 1000.0 and card["comprometido"] == 300.0 and card["saldo"] == 700.0
    assert painel["ultima_consulta"]

    # Falha posterior de leitura não apaga o último valor oficial.
    async def fns_fora(ibge, exercicio):
        return [{"categoria": "individual_pap", "valor": None, "situacao": "nao_disponivel", "erro": "timeout",
                 "detalhes": {}}]
    monkeypatch.setattr(tt, "consultar_tetos", fns_fora)
    await rt.atualizar_tetos_municipais(db_session, _usuario(municipio.id), None)
    painel = await rt.tetos_municipais(db_session, _usuario(municipio.id), None)
    card = {c["categoria"]: c for c in painel["cards"]}["individual_pap"]
    assert card["teto"]["valor"] == 1000.0 and card["teto"]["erro"] == "timeout"

    # O outro município não vê o teto nem as propostas de Apuí.
    painel_outro = await rt.tetos_municipais(db_session, _usuario(outro.id), None)
    c2 = {c["categoria"]: c for c in painel_outro["cards"]}["individual_pap"]
    assert c2["teto"]["valor"] is None and c2["comprometido"] == 999.0
