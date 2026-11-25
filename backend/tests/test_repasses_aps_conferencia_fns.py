"""Controle Financeiro FNS (/repasses-aps-apui): parcelas recentes do e-Gestor APS
e conferência, componente a componente, com o crédito do FNS da MESMA parcela.

Os valores dos dublês reproduzem o formato público das fontes (e-Gestor APS
/financiamento/pagamento e consultafns detalhe-pagamento); nenhum dado pessoal.
"""
from __future__ import annotations

from datetime import date

import httpx

from services import egestor_fns_conferencia as conf
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)


# ── Dublês das fontes oficiais ────────────────────────────────────────────────

def _plano(co, desc, valor):
    return {"coSeqPlanoOrcamentario": co, "dsPlanoOrcamentario": desc,
            "vlTotalCusteio": valor, "vlTotalImplantacao": 0}


_EGESTOR = {
    "202610": (648752.75, [
        _plano(8, "Equipes de Saúde da Família - eSF e equipes de Atenção Primária - eAP", 227826),
        _plano(10, "Atenção à Saúde Bucal", 113820),
        _plano(9, "Equipes Multiprofissionais - eMulti", 16750),
        _plano(2, "Agentes Comunitários de Saúde", 213972),
        _plano(11, "Demais programas, serviços e equipes da Atenção Primária à Saúde", 65585),
        _plano(12, "Componente per capita de base populacional", 10799.75),
    ]),
    "202611": (678926.75, [
        _plano(8, "Equipes de Saúde da Família - eSF e equipes de Atenção Primária - eAP", 270000),
        _plano(10, "Atenção à Saúde Bucal", 101070),
        _plano(9, "Equipes Multiprofissionais - eMulti", 17500),
        _plano(2, "Agentes Comunitários de Saúde", 213972),
        _plano(11, "Demais programas, serviços e equipes da Atenção Primária à Saúde", 65585),
        _plano(12, "Componente per capita de base populacional", 10799.75),
    ]),
    "202612": (626232.75, [
        _plano(8, "Equipes de Saúde da Família - eSF e equipes de Atenção Primária - eAP", 240000),
        _plano(2, "Agentes Comunitários de Saúde", 191278),
        _plano(10, "Atenção à Saúde Bucal", 101070),
        _plano(9, "Equipes Multiprofissionais - eMulti", 17500),
        _plano(11, "Demais programas, serviços e equipes da Atenção Primária à Saúde", 65585),
        _plano(12, "Componente per capita de base populacional", 10799.75),
    ]),
}


def _credito(desc, valor, comp, ob, data, componente="ATENÇÃO PRIMÁRIA", portaria="3493"):
    return {"id": {"programaFundo": {"descricao": desc}}, "nomeComponente": componente,
            "valorLiquido": valor, "competencia": comp, "numeroDocumentoSiafi": ob,
            "dataCriacaoSiafi": data, "nuPortaria": portaria}


_FNS = {
    10: [
        _credito("INCENTIVO FINANCEIRO DA APS - EQUIPES DE SAÚDE DA FAMÍLIA/ESF E EQUIPES DE ATENÇÃO PRIMÁRIA/EAP", 227826, "10/12 em 2026", "1", "14/10/2026"),
        _credito("INCENTIVO FINANCEIRO DA APS - ATENCAO A SAUDE BUCAL", 113820, "10/12 em 2026", "2", "14/10/2026"),
        _credito("INCENTIVO FINANCEIRO DA APS - EQUIPES MULTIPROFISSIONAIS - EMULTI", 16750, "10/12 em 2026", "3", "14/10/2026"),
        _credito("AGENTES COMUNITÁRIOS DE SAÚDE", 213972, "10/12 em 2026", "4", "14/10/2026"),
        _credito("INCENTIVO FINANCEIRO DA APS - DEMAIS PROGRAMAS, SERVIÇOS E EQUIPES DA ATENÇÃO PRIMÁRIA À SAÚDE", 65585, "10/12 em 2026", "5", "21/10/2026"),
        _credito("INCENTIVO FINANCEIRO DA APS - COMPONENTE PER CAPITA DE BASE POPULACIONAL", 10799.75, "10/12 em 2026", "6", "14/10/2026"),
        _credito("INCENTIVO FINANCEIRO DA APS - PROMOCAO À SAÚDE", 25938.23, "Única em 2026", "7", "14/10/2026", portaria="12122"),
        _credito("TRANSFERÊNCIA AOS ENTES FEDERATIVOS PARA O PAGAMENTO DOS VENCIMENTOS DOS AGENTES DE COMBATE ÀS ENDEMIAS", 24639.2, "10 em 2026", "8", "14/10/2026", componente="VIGILÂNCIA EM SAÚDE"),
    ],
    11: [
        _credito("INCENTIVO FINANCEIRO DA APS - EQUIPES DE SAÚDE DA FAMÍLIA/ESF E EQUIPES DE ATENÇÃO PRIMÁRIA/EAP", 231635.11, "11 em 2026", "11", "12/11/2026"),
        _credito("INCENTIVO FINANCEIRO DA APS - ATENCAO A SAUDE BUCAL", 113820, "11/12 em 2026", "12", "12/11/2026"),
        _credito("INCENTIVO FINANCEIRO DA APS - EQUIPES MULTIPROFISSIONAIS - EMULTI", 16750, "11 em 2026", "13", "12/11/2026"),
        _credito("INCENTIVO FINANCEIRO DA APS - EQUIPES MULTIPROFISSIONAIS - EMULTI", 750, "11/12 em 2026", "14", "16/11/2026"),
        _credito("AGENTES COMUNITÁRIOS DE SAÚDE", 213972, "11/12 em 2026", "15", "12/11/2026"),
        _credito("INCENTIVO FINANCEIRO DA APS - DEMAIS PROGRAMAS, SERVIÇOS E EQUIPES DA ATENÇÃO PRIMÁRIA À SAÚDE", 65585, "11 em 2026", "16", "12/11/2026"),
        _credito("INCENTIVO FINANCEIRO DA APS - COMPONENTE PER CAPITA DE BASE POPULACIONAL", 10799.75, "11 em 2026", "17", "12/11/2026"),
        _credito("ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC", 312343.9, "11 em 2026", "18", "12/11/2026", componente="MAC"),
    ],
}


# Campos eMulti como o e-Gestor publica na parcela 202612 (CNES 10/2026)
_COMPLETO_EMULTI = {
    "nuParcela": "202612", "nuCompCnes": "202610", "qtEmultiPagas": 1,
    "qtEmultiPagamentoEstrategica": 1, "qtEmultiPagasAtendRemoto": 1,
    "vlPagamentoEmultiCusteio": 12000, "vlPagamentoEmultiQualidade": 3000,
    "vlPagamentoEmultiAtendimentoRemoto": 2500, "vlPagamentoQualidadeEmulti": 2375,
    "vlPagamentoEmultiPadi": 0, "vlPagamentoEmultiImplantacao": 0, "vlTotalEmulti": 19875,
    "qtTetoEmultiEstrategica": 9, "qtTetoEmultiComplementar": 1,
}


def _competencia(nu):
    total, planos = _EGESTOR[nu]
    return {"nu_parcela": nu, "competencia": "SET/2026", "parcela": "11/12", "componentes": [
        {"co_seq": p["coSeqPlanoOrcamentario"], "descricao": p["dsPlanoOrcamentario"],
         "vl_total": p["vlTotalCusteio"]} for p in planos]}


def _fontes_falsas(consultas: list[str], listadas=("202610", "202609")):
    original = httpx.AsyncClient.send

    async def falso(self, request, *a, **k):
        if request.url.host == "test":
            return await original(self, request, *a, **k)
        url = str(request.url)
        consultas.append(url)
        q = request.url.params
        if "data/parcelas" in url:
            return httpx.Response(200, request=request, json=list(listadas))
        if "financiamento/pagamento" in url and q.get("tipoRelatorio") == "COMPLETO":
            return httpx.Response(200, request=request, json={"data": "25/11/2026", "resumosPlanosOrcamentarios": [],
                                                              "pagamentos": [_COMPLETO_EMULTI]})
        if "financiamento/pagamento" in url:
            ini, fim = q.get("nuParcelaInicio"), q.get("nuParcelaFim")
            ags = [{"nuParcela": nu, "nuCompCnes": "", "total": t, "listaPagamentoPlanoOrcamentario": pl}
                   for nu, (t, pl) in sorted(_EGESTOR.items()) if ini <= nu <= fim]
            return httpx.Response(200, request=request, json={"data": "25/11/2026", "agrupamentos": ags})
        if "consultafns" in url:
            itens = _FNS.get(int(q.get("mes")), []) if q.get("ano") == "2026" else []
            return httpx.Response(200, request=request, json={"resultado": {"dados": itens}})
        return httpx.Response(404, request=request, json={})
    return falso


# ── Regras puras ──────────────────────────────────────────────────────────────

def test_parcela_do_credito_le_comp_parcela_oficial():
    assert conf.parcela_do_credito("11/12 em 2026") == (2026, 11)
    assert conf.parcela_do_credito("11 em 2026") == (2026, 11)
    assert conf.parcela_do_credito("Única em 2026") is None
    assert conf.parcela_do_credito(None) is None


def test_plano_aps_nao_confunde_acs_com_ace():
    assert conf.plano_aps("AGENTES COMUNITÁRIOS DE SAÚDE") == 2
    assert conf.plano_aps("Atenção à Saúde Bucal") == 10
    assert conf.plano_aps("INCENTIVO FINANCEIRO DA APS - EQUIPES MULTIPROFISSIONAIS - EMULTI") == 9
    assert conf.plano_aps("PAGAMENTO DOS VENCIMENTOS DOS AGENTES DE COMBATE ÀS ENDEMIAS") is None


def test_meses_de_busca_nao_consulta_futuro():
    assert conf.meses_de_busca("202611", hoje=date(2026, 11, 25)) == [(2026, 11)]
    assert conf.meses_de_busca("202610", hoje=date(2026, 11, 25)) == [(2026, 10), (2026, 11)]
    assert conf.meses_de_busca("202612", hoje=date(2026, 11, 25)) == []
    assert conf.meses_de_busca("202612", hoje=date(2027, 2, 1)) == [(2026, 12), (2027, 1)]


def test_parcela_paga_igual_confere_e_separa_credito_de_outra_portaria():
    r = conf.conferir(_competencia("202610"), {(2026, 10): _FNS[10], (2026, 11): _FNS[11]})
    assert r["situacao"] == "pago_confere"
    assert r["total_pago_fns"] == 648752.75 == r["total_egestor"]
    # Promoção à saúde "Única em 2026" entrou no mês mas não é desta parcela
    assert [o["valor"] for o in r["outros_creditos_aps"]] == [25938.23]
    # ACE (vigilância) e créditos da parcela 11 não entram
    assert all(o["competencia_fns"].startswith("10") for p in r["planos"] for o in p["ordens"])


def test_parcela_com_valor_creditado_diferente_mostra_diferenca_por_componente():
    r = conf.conferir(_competencia("202611"), {(2026, 11): _FNS[11]})
    assert r["situacao"] == "pago_com_diferenca"
    assert r["total_pago_fns"] == 653311.86          # = Recebido APS do FNS em NOV/2026
    assert r["diferenca"] == -25614.89
    por = {p["co_seq"]: p for p in r["planos"]}
    assert por[8]["diferenca"] == -38364.89 and por[8]["situacao"] == "diferenca"
    assert por[10]["diferenca"] == 12750.0 and por[10]["situacao"] == "diferenca"
    assert por[9]["vl_fns"] == 17500.0 and por[9]["situacao"] == "confere"   # duas OBs somadas
    assert len(por[9]["ordens"]) == 2
    assert r["datas_pagamento"] == ["12/11/2026", "16/11/2026"]


def test_parcela_sem_credito_fica_aguardando_e_fns_fora_do_ar_nao_inventa():
    r = conf.conferir(_competencia("202612"), {})
    assert r["situacao"] == "aguardando_pagamento_fns"
    assert r["total_pago_fns"] == 0.0 and r["diferenca"] is None
    assert all(p["situacao"] == "aguardando_pagamento" for p in r["planos"])
    r = conf.conferir(_competencia("202612"), None)
    assert r["situacao"] == "fns_indisponivel"
    assert r["total_pago_fns"] is None
    assert all(p["vl_fns"] is None for p in r["planos"])


# ── Endpoints (app real, guard ativo) ─────────────────────────────────────────

async def test_lista_inclui_parcelas_ja_publicadas_na_api_e_status_do_fns(ambiente, monkeypatch):
    c = ambiente["client"]
    conf.limpar_cache()
    consultas: list[str] = []
    monkeypatch.setattr(httpx.AsyncClient, "send", _fontes_falsas(consultas))
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.get("/api/repasses-aps/competencias?ano=2026", headers=_h(tok))
    assert r.status_code == 200, r.text
    d = r.json()
    nus = [x["nu_parcela"] for x in d["competencias"]]
    assert nus == ["202610", "202611", "202612"]          # não para mais na lista do portal
    por = {x["nu_parcela"]: x for x in d["competencias"]}
    assert por["202610"]["listada_portal"] is True
    assert por["202611"]["listada_portal"] is False
    assert por["202610"]["pagamento_fns"]["situacao"] == "pago_confere"
    assert por["202611"]["pagamento_fns"]["situacao"] == "pago_com_diferenca"
    assert por["202612"]["pagamento_fns"]["situacao"] == "aguardando_pagamento_fns"
    assert d["parcelas_aguardando_fns"] == ["202612"]
    assert d["total_pago"] == round(648752.75 + 678926.75, 2)
    # e-Gestor consultado para o ciclo inteiro
    assert any("nuParcelaFim=202612" in u for u in consultas)
    conf.limpar_cache()


async def test_conferencia_fns_endpoint(ambiente, monkeypatch):
    c = ambiente["client"]
    conf.limpar_cache()
    consultas: list[str] = []
    monkeypatch.setattr(httpx.AsyncClient, "send", _fontes_falsas(consultas))
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.get("/api/repasses-aps/conferencia-fns/202611", headers=_h(tok))
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["situacao"] == "pago_com_diferenca" and d["total_pago_fns"] == 653311.86
    assert (await c.get("/api/repasses-aps/conferencia-fns/2026-1", headers=_h(tok))).status_code == 400
    conf.limpar_cache()


async def test_emulti_detalhado_fecha_com_total_oficial(ambiente, monkeypatch):
    c = ambiente["client"]
    monkeypatch.setattr(httpx.AsyncClient, "send", _fontes_falsas([]))
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.get("/api/repasses-aps/detalhado/202612", headers=_h(tok))
    assert r.status_code == 200, r.text
    em = r.json()["emulti"]
    assert em["qt_pagas"] == 1 and em["qt_estrategica"] == 1 and em["qt_atend_remoto"] == 1
    assert em["vl_qualidade_adicional"] == 2375 and em["qt_teto_complementar"] == 1
    soma = (em["vl_custeio"] + em["vl_qualidade"] + em["vl_qualidade_adicional"]
            + em["vl_atend_remoto"] + em["vl_implantacao"] + em["vl_padi"])
    assert soma == em["vl_total"] == 19875


async def test_outro_municipio_nao_acessa_conferencia_nem_dispara_consulta(ambiente, monkeypatch):
    """Isolamento: o módulo tem dados de Apuí fixos; outro município recebe 403 e
    nenhuma fonte externa é consultada em seu nome."""
    c = ambiente["client"]
    conf.limpar_cache()
    consultas: list[str] = []
    monkeypatch.setattr(httpx.AsyncClient, "send", _fontes_falsas(consultas))
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    for rota in ("/api/repasses-aps/competencias", "/api/repasses-aps/conferencia-fns/202611"):
        assert (await c.get(rota, headers=_h(tok_b))).status_code == 403, rota
    assert consultas == []
    conf.limpar_cache()
