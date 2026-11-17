"""Regularização de Contas de Emendas (ADPF 854): normalização das linhas do painel FNS, leitura
paginada do Qlik, isolamento por município no ingest, cruzamento com propostas e alertas.
Linhas de exemplo copiadas do painel público em 17/11/2026 (dados institucionais do FMS)."""
import json

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from models.alerta import Alerta
from models.investsus import (
    AlertaInvestSUS, ColetaRegularizacaoInvestSUS, ContaRegularizacaoInvestSUS, PropostaInvestSUS,
    SituacaoNormalizada,
)
from routers import investsus_regularizacao as rt
from services import investsus_regularizacao_contas as reg

CNPJ = "12834320000126"
LINK = "https://consultafns.saude.gov.br/#/proposta/{}/detalhe"


def _linha(conta, status, emenda, proposta, abertura="27/12/2024"):
    return [CNPJ, "AM", "APUI", "MUNICIPAL", "Banco do Brasil", "0926-1", conta, "Não se aplica (BB)",
            abertura, status, emenda, proposta, LINK.format(proposta)]


REGULARIZADA = _linha("000035917-3", "REGULARIZADA", "71040007", "36000590280202400")
PENDENTE = _linha("000039264-2", "PENDENTE", "42990003", "36000820396202600", "07/08/2026")


def _usuario(mid, role="admin"):
    from routers.auth import UserOut
    return UserOut(username="teste", nome="Teste", role=role, municipio_id=mid, municipio_ibge="1300144")


def _payload(*linhas):
    return reg.montar_payload([reg.normalizar_linha(x) for x in linhas], "AM", "APUI", "MUNICIPAL")


# ── Normalização ──────────────────────────────────────────────────────────────

def test_linha_do_painel_vira_o_contrato_json():
    n = reg.normalizar_linha(REGULARIZADA)
    assert n == {
        "cnpj": CNPJ, "uf": "AM", "municipio": "APUI", "esfera": "MUNICIPAL", "banco": "Banco do Brasil",
        "agencia_dv": "0926-1", "conta_dv": "000035917-3", "nova_conta_cef": "Não se aplica (BB)",
        "data_abertura": "2024-12-27", "status_regularizacao": "REGULARIZADA", "possui_pendencia": False,
        "numero_emenda": "71040007", "numero_proposta": "36000590280202400",
        "link_consulta_fns": LINK.format("36000590280202400"),
    }
    assert reg.normalizar_linha(PENDENTE)["possui_pendencia"] is True


def test_dv_x_cef_e_varias_propostas_na_mesma_conta():
    n = reg.normalizar_linha([CNPJ, "AM", "Apuí", "MUNICIPAL", " CEF", "0123-4", "000038142-x", "5741777232",
                              "02/02/2026", "Abertura recente", "41090012", "36000000001202600;36000000002202600",
                              "https://consultafns.saude.gov.br/#/proposta"])
    assert n["banco"] == "Caixa Econômica Federal" and n["conta_dv"] == "000038142-X"
    assert n["municipio"] == "APUI" and n["status_regularizacao"] == "ABERTURA RECENTE"
    assert n["possui_pendencia"] is False  # acompanhamento, não pendência
    assert reg.propostas_da_linha(n["numero_proposta"]) == ["36000000001202600", "36000000002202600"]


def test_link_de_fora_do_consultafns_e_descartado():
    linha = list(REGULARIZADA)
    linha[12] = "https://exemplo.invalido/phishing"
    assert reg.normalizar_linha(linha)["link_consulta_fns"] == ""


def test_resumo_e_datas_de_atualizacao():
    r = _payload(REGULARIZADA, PENDENTE)["metadata"]["resumo"]
    assert (r["total_contas"], r["total_regularizadas"], r["total_pendentes"]) == (2, 1, 1)
    d = reg.datas_atualizacao("Data de Atualização - BB : 06/11/2026 --//-- Data de Atualização - CEF: 17/11/2026")
    assert d == {"atualizacao_bb": "2026-11-06", "atualizacao_cef": "2026-11-17"}
    assert reg.datas_atualizacao("Data de Atualização - BB : 06/11/2026 --//-- Data de Atualização - CEF: -") == {
        "atualizacao_bb": "2026-11-06", "atualizacao_cef": None}


# ── Leitura do Qlik (WebSocket simulado) ──────────────────────────────────────

class _WsFalso:
    """Responde ao JSON-RPC do Qlik Engine com uma tabela de N linhas."""

    def __init__(self, linhas, cabecalho=None):
        self.linhas, self.fila = linhas, []
        self.cabecalho = cabecalho or reg.COLUNAS
        self.selecoes, self.paginas = [], []

    async def __aenter__(self):
        self.fila.append({"jsonrpc": "2.0", "method": "OnConnected", "params": {}})
        return self

    async def __aexit__(self, *a):
        return False

    async def send(self, texto):
        m = json.loads(texto)
        met, p, res = m["method"], m["params"], {}
        if met == "OpenDoc":
            res = {"qReturn": {"qHandle": 1}}
        elif met == "GetField":
            res = {"qReturn": {"qHandle": 10}}
        elif met == "SelectValues":
            self.selecoes.append(p["qFieldValues"][0]["qText"])
            res = {"qReturn": True}
        elif met == "GetObject":
            res = {"qReturn": {"qHandle": 20 if p["qId"] == reg.OBJ_TABELA else 30}}
        elif met == "GetLayout" and m["handle"] == 20:
            res = {"qLayout": {"qHyperCube": {"qSize": {"qcx": 13, "qcy": len(self.linhas)},
                                              "qDimensionInfo": [{"qFallbackTitle": c} for c in self.cabecalho]}}}
        elif met == "GetLayout":
            res = {"qLayout": {"qHyperCube": {"qMeasureInfo": [], "qDataPages": [{"qMatrix": [[{
                "qText": "Data de Atualização - BB : 06/11/2026 --//-- Data de Atualização - CEF: -"}]]}]}}}
        elif met == "GetHyperCubeData":
            pg = p["qPages"][0]
            self.paginas.append(pg["qTop"])
            fatia = self.linhas[pg["qTop"]:pg["qTop"] + pg["qHeight"]]
            res = {"qDataPages": [{"qMatrix": [[{"qText": c} for c in r] for r in fatia]}]}
        self.fila.append({"jsonrpc": "2.0", "id": m["id"], "result": res})

    async def recv(self):
        return json.dumps(self.fila.pop(0))


def _simular_qlik(monkeypatch, ws):
    import websockets

    async def sessao():
        return "X-Qlik-Session=abc", "csrf"
    monkeypatch.setattr(reg, "_sessao_anonima", sessao)
    monkeypatch.setattr(websockets, "connect", lambda url, **kw: ws)


@pytest.mark.asyncio
async def test_coleta_aplica_os_tres_filtros_e_le_todas_as_paginas(monkeypatch):
    linhas = [_linha(f"{i:09d}-1", "REGULARIZADA", "1", f"3600{i:013d}") for i in range(1200)]
    ws = _WsFalso(linhas)
    _simular_qlik(monkeypatch, ws)
    r = await reg.coletar("am", "Apuí")
    assert ws.selecoes == ["AM", "APUI", "MUNICIPAL"]
    assert ws.paginas == [0, 500, 1000]
    assert len(r["contas"]) == 1200 and r["metadata"]["linhas_no_painel"] == 1200
    assert r["metadata"]["atualizacao_bb"] == "2026-11-06" and r["metadata"]["atualizacao_cef"] is None


@pytest.mark.asyncio
async def test_coleta_para_se_as_colunas_do_painel_mudarem(monkeypatch):
    cab = list(reg.COLUNAS)
    cab[6], cab[9] = cab[9], cab[6]
    _simular_qlik(monkeypatch, _WsFalso([REGULARIZADA], cabecalho=cab))
    with pytest.raises(reg.ColetaRegularizacaoErro, match="Colunas"):
        await reg.coletar("AM", "Apuí")


# ── Gravação, cruzamento e alertas ────────────────────────────────────────────

async def _propostas(db, mid):
    a = PropostaInvestSUS(municipio_id=mid, numero_proposta="36000590280202400", numero_emenda="71040007",
                          exercicio=2024, situacao_normalizada=SituacaoNormalizada.TOTALMENTE_PAGA, valor_pago=10.0)
    b = PropostaInvestSUS(municipio_id=mid, numero_proposta="36000820396202600", numero_emenda="42990003",
                          exercicio=2026, situacao_normalizada=SituacaoNormalizada.EMPENHADA_AGUARDANDO_FORMALIZACAO)
    c = PropostaInvestSUS(municipio_id=mid, numero_proposta="36000999999202600", exercicio=2026,
                          situacao_normalizada=SituacaoNormalizada.TOTALMENTE_PAGA, valor_pago=5.0)
    db.add_all([a, b, c])
    await db.commit()
    return a, b, c


@pytest.mark.asyncio
async def test_pendente_gera_alerta_e_regularizacao_encerra(db_session, municipio):
    _, b, _ = await _propostas(db_session, municipio.id)
    r = await rt.aplicar_coleta(db_session, municipio.id, _payload(REGULARIZADA, PENDENTE), "teste", "Teste")
    assert r["vinculadas_a_propostas"] == 2 and r["novas_pendencias"] == 1

    alertas = (await db_session.execute(select(AlertaInvestSUS))).scalars().all()
    assert len(alertas) == 1 and alertas[0].proposta_id == b.id and not alertas[0].resolvido
    assert "000039264-2" in alertas[0].titulo
    # Repetir a coleta não duplica o alerta
    await rt.aplicar_coleta(db_session, municipio.id, _payload(REGULARIZADA, PENDENTE), "teste", "Teste")
    assert len((await db_session.execute(select(AlertaInvestSUS))).scalars().all()) == 1

    regularizou = list(PENDENTE)
    regularizou[9] = "REGULARIZADA"
    r = await rt.aplicar_coleta(db_session, municipio.id, _payload(REGULARIZADA, regularizou), "teste", "Teste")
    assert r["alertas_encerrados"] == 1
    al = (await db_session.execute(select(AlertaInvestSUS))).scalar_one()
    assert al.resolvido and "regularizada" in al.resolvido_por
    conta = (await db_session.execute(select(ContaRegularizacaoInvestSUS).where(
        ContaRegularizacaoInvestSUS.conta_dv == "000039264-2"))).scalar_one()
    assert [h["para"] for h in conta.historico] == ["PENDENTE", "REGULARIZADA"]


@pytest.mark.asyncio
async def test_pendente_sem_proposta_vai_para_central_de_alertas(db_session, municipio):
    await rt.aplicar_coleta(db_session, municipio.id, _payload(PENDENTE), "teste", "Teste")
    await rt.aplicar_coleta(db_session, municipio.id, _payload(PENDENTE), "teste", "Teste")
    gerais = (await db_session.execute(select(Alerta))).scalars().all()
    assert len(gerais) == 1 and gerais[0].modulo == "InvestSUS"  # uma vez por mudança de status


@pytest.mark.asyncio
async def test_listagem_cruza_propostas_e_marca_conta_que_saiu_do_painel(db_session, municipio):
    await _propostas(db_session, municipio.id)
    u = _usuario(municipio.id)
    await rt.aplicar_coleta(db_session, municipio.id, _payload(REGULARIZADA, PENDENTE), "teste", "Teste")
    await rt.aplicar_coleta(db_session, municipio.id, _payload(PENDENTE), "teste", "Teste")
    r = await rt.listar(db_session, u)
    assert r["resumo"]["total_contas"] == 1 and r["resumo"]["total_pendentes"] == 1
    assert r["contas"][0]["proposta"]["numero_proposta"] == "36000820396202600"
    assert [c["conta_dv"] for c in r["contas_fora_do_painel"]] == ["000035917-3"]
    # proposta paga sem conta no painel (a de 2024 saiu; a 36000999999202600 nunca esteve)
    assert {p["numero_proposta"] for p in r["propostas_pagas_sem_conta_no_painel"]} == {
        "36000590280202400", "36000999999202600"}
    coletas = (await db_session.execute(select(ColetaRegularizacaoInvestSUS))).scalars().all()
    assert len(coletas) == 2 and all(c.ok for c in coletas)


@pytest.mark.asyncio
async def test_divergencia_de_emenda_e_de_conta(db_session, municipio):
    a, _, _ = await _propostas(db_session, municipio.id)
    a.numero_emenda, a.conta_bancaria = "99999999", "BB 0926-1 / 12345-6"
    await db_session.commit()
    await rt.aplicar_coleta(db_session, municipio.id, _payload(REGULARIZADA), "teste", "Teste")
    r = await rt.listar(db_session, _usuario(municipio.id))
    div = r["contas"][0]["divergencias"]
    assert len(div) == 2 and r["resumo"]["com_divergencia"] == 1


@pytest.mark.asyncio
async def test_ingest_rejeita_conta_de_outro_municipio_e_perfil_sem_permissao(db_session, municipio):
    u = _usuario(municipio.id)
    outro = list(REGULARIZADA)
    outro[2] = "MANAUS"
    with pytest.raises(HTTPException) as e:
        await rt.ingest(db_session, u, _payload(REGULARIZADA, outro))
    assert e.value.status_code == 422
    assert not (await db_session.execute(select(ContaRegularizacaoInvestSUS))).scalars().all()
    with pytest.raises(HTTPException) as e:
        await rt.ingest(db_session, _usuario(municipio.id, role="acs"), _payload(REGULARIZADA))
    assert e.value.status_code == 403

    r = await rt.ingest(db_session, u, _payload(REGULARIZADA, PENDENTE))
    assert r["resumo"]["total_contas"] == 2
    coleta = (await db_session.execute(select(ColetaRegularizacaoInvestSUS))).scalar_one()
    assert coleta.origem == "agente_externo" and coleta.filtros["municipio"] == "APUI"


@pytest.mark.asyncio
async def test_ingest_aceita_linhas_cruas_do_exportar(db_session, municipio):
    cru = dict(zip(reg.COLUNAS, PENDENTE))
    r = await rt.ingest(db_session, _usuario(municipio.id), {"contas": [cru]})
    assert r["resumo"]["total_pendentes"] == 1


@pytest.mark.asyncio
async def test_falha_na_coleta_fica_registrada_e_nao_apaga_dados(db_session, municipio, monkeypatch):
    await rt.aplicar_coleta(db_session, municipio.id, _payload(REGULARIZADA), "teste", "Teste")

    async def falha(*a, **k):
        raise reg.ColetaRegularizacaoErro("painel fora do ar")
    monkeypatch.setattr(reg, "coletar", falha)
    with pytest.raises(HTTPException) as e:
        await rt.sincronizar_agora(db_session, _usuario(municipio.id))
    assert e.value.status_code == 502
    r = await rt.listar(db_session, _usuario(municipio.id))
    assert r["resumo"]["total_contas"] == 1
    assert r["ultima_falha"]["erro"] == "painel fora do ar"
