"""Pagamento e validação por equipe lidos do e-Gestor (relatório público, sem login), no formato
real de Apuí de 29/09/2026: sincroniza, mostra a aba "eSF e eAP", aponta pendências, isola município
e não apaga nada quando o e-Gestor volta vazio ou fora do ar."""
from __future__ import annotations

import httpx

from services import egestor_pagamento as ep

_ASYNC_CLIENT_REAL = httpx.AsyncClient
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)

AGRUPADO = {"agrupamentos": [{"nuParcela": "202609", "nuCompCnes": "202607", "coProcesso": 5027,
                              "listaPagamentoPlanoOrcamentario": [
                                  {"coSeqPlanoOrcamentario": 8, "dsPlanoOrcamentario": "Equipes de Saúde da Família - eSF e equipes de Atenção Primária - eAP"},
                                  {"coSeqPlanoOrcamentario": 10, "dsPlanoOrcamentario": "Atenção à Saúde Bucal"}]}]}
COMPLETO = {"pagamentos": [{"nuParcela": "202609", "dsClassificacaoQualidadeEsfEap": "BOM",
                            "dsClassificacaoVinculoEsfEap": "BOM"}]}
COMPONENTES = {
    "8": [{"coComponentePagamento": 48, "dsComponentePagamento": "Equipe de Saúde da Família - eSF", "coProcesso": 5027,
           "coPlanoOrcamentario": 8, "coProcessoValidacao": 5025, "coProcessoPagamento": 5686, "nuCompCnes": "202607", "nuParcela": "202609"}],
    "10": [{"coComponentePagamento": 5, "dsComponentePagamento": "Saúde Bucal - eSB 40h", "coProcesso": 5027,
            "coPlanoOrcamentario": 10, "coProcessoValidacao": 5025, "coProcessoPagamento": 5686, "nuCompCnes": "202607", "nuParcela": "202609"}],
}
ESF_OK = {"composicao": "100%", "codigoEstabelecimento": "2013304", "dsSubTipoEquipe": "Convencional", "stTipoEquipe": "VÁLIDO",
          "stSuspensaoDuplicidadeEsf": "NÃO SUSPENSO", "stPossuiProfAcimacargahora": "NÃO", "stSuspensaoProducao": "NÃO SUSPENSO",
          "stEquipeAtiva": "ATIVA", "stUnidadeValida": "ATIVO", "stPagamento": "VÁLIDO", "coEquipe": "0000007056"}
DETALHE = {
    48: {"dsClassificacaoQualidade": "BOM", "dsClassificacaoVinculo": "BOM", "qtHomologado": 9, "vlPagamentoFixo": 162000,
         "vlDesconto": -42174, "vlTotal": 227826,
         "validacoesEquipes": [ESF_OK, {**ESF_OK, "coEquipe": "0000007072", "stSuspensaoProducao": "SUSPENSO"}]},
    5: {"vlTotal": 74210, "validacoesEquipes": [{"coEquipeEsb": "0001773860", "coEquipeEsfEap": "0000007080", "coCnes": "3697983",
                                                  "stEsbUom": "CH compartilhada", "stEsbAtiva": "ATIVA", "stPagamento": "PAGO",
                                                  "modalidade": "1"}]},
    12: {"vlTotal": 213972, "validacoesProfissionais": [{"coCns": "701803293653176"}]},
}


def _egestor_falso(monkeypatch, vazio=False, falhar=False):
    def handler(request: httpx.Request) -> httpx.Response:
        if falhar:
            return httpx.Response(500, text="Falha interna do servidor!!!")
        q, path = request.url.params, request.url.path
        assert q.get("coMunicipio", "130014") == "130014"
        if path.endswith("/componente-pagamento"):
            return httpx.Response(200, json=COMPONENTES[q["coPlanoOrcamentario"]])
        if path.endswith("/relatorio-detalhado"):
            return httpx.Response(200, json=DETALHE[int(q["coComponentePagamento"])])
        if q["tipoRelatorio"] == "AGRUPADO":
            return httpx.Response(200, json={"agrupamentos": []} if vazio else AGRUPADO)
        return httpx.Response(200, json=COMPLETO)
    monkeypatch.setattr(ep.httpx, "AsyncClient",
                        lambda *a, **k: _ASYNC_CLIENT_REAL(transport=httpx.MockTransport(handler), timeout=5))


def test_pendencias_ignoram_situacoes_validas_e_informativas():
    assert ep.pendencias(ESF_OK) == []
    assert ep.pendencias({"stEsbUom": "CH compartilhada", "stPagamento": "PAGO"}) == []
    assert ep.pendencias({"stSuspensaoProducao": "SUSPENSO"}) == [
        {"campo": "stSuspensaoProducao", "rotulo": "Suspensão por falta de produção", "situacao": "SUSPENSO"}]


async def test_sincroniza_e_mostra_esf_eap_por_equipe(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.get("/api/egestor-pagamento", headers=_h(tok))).json()["situacao_dado"] == "nao_disponivel"

    _egestor_falso(monkeypatch)
    r = (await c.post("/api/egestor-pagamento/sincronizar", headers=_h(tok))).json()
    assert r == {"ok": True, "parcelas": ["202609"], "motivo": None}
    assert await _auditoria(S, "EGESTOR_PAGAMENTO_SINCRONIZADO")

    p = (await c.get("/api/egestor-pagamento", headers=_h(tok))).json()
    assert p["parcela_rotulo"] == "9ª parcela/2026" and p["competencia_cnes_rotulo"] == "Jul/2026"
    assert p["classificacao_qualidade"] == "BOM" and p["classificacao_vinculo"] == "BOM"
    assert p["total"] == 227826 + 74210 and p["descontos"] == -42174
    esf = {e["ine"]: e for e in p["equipes"] if e["co_componente"] == 48}
    assert esf["0000007056"]["ok"] and not esf["0000007072"]["ok"]
    assert esf["0000007072"]["pendencias"][0]["rotulo"] == "Suspensão por falta de produção"
    esb = next(e for e in p["equipes"] if e["co_componente"] == 5)
    assert esb["ine"] == "0001773860" and esb["ine_vinculada"] == "0000007080" and esb["ok"]
    assert p["equipes_com_pendencia"] == 1
    assert "coCns" not in str(p)                                   # profissionais não são gravados

    # e-Gestor vazio ou fora do ar não apaga a última leitura
    _egestor_falso(monkeypatch, vazio=True)
    assert (await c.post("/api/egestor-pagamento/sincronizar", headers=_h(tok))).json()["ok"] is False
    _egestor_falso(monkeypatch, falhar=True)
    assert (await c.post("/api/egestor-pagamento/sincronizar", headers=_h(tok))).status_code == 503
    assert len((await c.get("/api/egestor-pagamento", headers=_h(tok))).json()["equipes"]) == 3


async def test_isolamento_e_perfil(ambiente, monkeypatch):
    c = ambiente["client"]
    _egestor_falso(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/egestor-pagamento/sincronizar", headers=_h(tok))
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/egestor-pagamento", headers=_h(tok_b))).json()["situacao_dado"] == "nao_disponivel"
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/egestor-pagamento/sincronizar", headers=_h(consulta))).status_code == 403


async def test_job_diario_le_municipios_ativos(ambiente, monkeypatch):
    import database
    import scheduler
    _egestor_falso(monkeypatch)
    chamados = []
    original = ep.sincronizar

    async def espiao(db, mid, ibge):
        chamados.append(ibge)
        if ibge != "1300144":
            raise ep.EgestorIndisponivel("sem dados de teste")
        return await original(db, mid, ibge)

    monkeypatch.setattr(database, "AsyncSessionLocal", ambiente["Session"])
    monkeypatch.setattr(ep, "sincronizar", espiao)
    await scheduler._job_egestor_pagamento()
    assert sorted(chamados) == ["1300144", "1399991"]
    tok = await _token(ambiente["client"], "gestor.apui@teste.gov.br")
    assert (await ambiente["client"].get("/api/egestor-pagamento", headers=_h(tok))).json()["situacao_dado"] == "oficial_validado"
