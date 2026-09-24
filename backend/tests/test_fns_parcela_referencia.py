"""Parcela de referência oficial do FNS ("Comp./Parcela", ex. 09/12 em 2026):
captura sobre os registros existentes e uso na conciliação Previsto × Recebido."""
from __future__ import annotations

import itertools
from datetime import date
from decimal import Decimal

import httpx
from sqlalchemy import select

from models.municipio import Municipio
from models.transferencia_fns import TransferenciaFns
from services.fns_parcelas import parse_parcela
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)

MAC = "ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC"
CBAF = "CBAF - RECURSOS FINANCEIROS A TRANSFERIR PARA AQUISICAO PELAS SECRETARIAS DE SAUDE DOS ESTADOS, MUNICIPIOS E DO DISTRITO FEDERAL"
_seq = itertools.count(1000)


def _item(competencia, descricao, valor, ob, portaria, data_ob):
    """Formato real do consultafns /consulta-detalhada/detalhe-pagamento."""
    return {"competencia": competencia, "numeroDocumentoSiafi": ob, "nuPortaria": portaria,
            "valorTotal": valor, "valorLiquido": valor, "codigoBanco": "001", "codigoAgencia": "009261",
            "contaCorrente": "0000266221", "dataCriacaoSiafi": data_ob, "tipoRepasse": "MUNICIPAL",
            "id": {"processoFormatado": "25000.136747/2026-73",
                   "programaFundo": {"id": 1, "descricao": descricao}}}


async def _transf(S, comp, valor, mes=9, ano=2026, **extra):
    async with S() as db:
        t = TransferenciaFns(chave_unica=f"p{next(_seq)}", municipio_ibge="130014", exercicio=ano, mes=mes,
                             competencia=f"{ano}/{mes:02d}", acao_detalhada=comp, grupo="G",
                             valor_liquido=Decimal(str(valor)), fonte="consultafns", ativo=True, **extra)
        db.add(t)
        await db.commit()
        return t.id


def _fns_falso(monkeypatch, itens):
    original = httpx.AsyncClient.send

    async def falso(self, request, *a, **k):
        if request.url.host == "test":
            return await original(self, request, *a, **k)
        assert "detalhe-pagamento" in str(request.url)
        return httpx.Response(200, request=request, json={"resultado": {"dados": itens, "total": len(itens)}})
    monkeypatch.setattr(httpx.AsyncClient, "send", falso)


def test_parse_parcela():
    assert parse_parcela("09/12 em 2026") == {"parcela_fns": "09/12 em 2026", "parcela_numero": 9,
                                              "parcela_total": 12, "parcela_ano": 2026}
    assert parse_parcela("Única em 2025") == {"parcela_fns": "Única em 2025", "parcela_numero": 1,
                                              "parcela_total": 1, "parcela_ano": 2025}
    assert parse_parcela("") == {}


async def test_sincronizacao_grava_parcela_nos_registros_existentes(ambiente, monkeypatch):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    async with S() as db:
        (await db.get(Municipio, ids["apui"])).cnpj_fundo = "12.834.320/0001-26"
        await db.commit()
    mac = await _transf(S, MAC, "312343.90")
    cbaf = await _transf(S, CBAF, "15486.20")
    _fns_falso(monkeypatch, [
        _item("09/12 em 2026", MAC, 312343.9, "070192", "10146", "04/09/2026"),
        _item("09/12 em 2026", CBAF, 15486.2, "071314", "9887", "22/09/2026"),
    ])
    from services import fns_parcelas
    from tenancy.contexto import MunicipioContexto, contexto_municipio
    with contexto_municipio(MunicipioContexto(id=ids["apui"], uuid=ids["apui_uuid"], ibge="1300144",
                                              nome="APUÍ", uf="AM")):
        async with S() as db:
            res = await fns_parcelas.atualizar_parcelas(db, 2026, 9)
    assert res["atualizados"] == 2
    async with S() as db:
        t = await db.get(TransferenciaFns, mac)
        assert (t.parcela_fns, t.parcela_numero, t.parcela_total, t.parcela_ano) == ("09/12 em 2026", 9, 12, 2026)
        assert (t.numero_ob, t.numero_portaria, t.data_pagamento) == ("070192", "10146", date(2026, 9, 4))
        assert t.competencia == "2026/09"                       # campo existente intacto
        total = (await db.execute(select(TransferenciaFns))).scalars().all()
        assert len(total) == 2                                  # nenhum registro novo

    # aparece no detalhamento do mês já existente
    tok = await _token(c, "gestor.apui@teste.gov.br")
    det = (await c.get(f"/api/repasses-fns/matriz-detalhe?exercicio=2026&mes=9&ids={mac},{cbaf}",
                       headers=_h(tok))).json()
    assert {x["parcela_fns"] for x in det["transferencias"]} == {"09/12 em 2026"}


async def test_parcela_oficial_resolve_serie_mensal_paga_com_atraso(ambiente):
    """Sem a parcela a série ficaria pendente; com '07/12', '08/12', '09/12' o vínculo é seguro."""
    c, S = ambiente["client"], ambiente["Session"]
    t7 = await _transf(S, CBAF, "1000", mes=8, parcela_numero=7, parcela_total=12, parcela_ano=2026, parcela_fns="07/12 em 2026")
    t8 = await _transf(S, CBAF, "1000", mes=9, parcela_numero=8, parcela_total=12, parcela_ano=2026, parcela_fns="08/12 em 2026")
    t9 = await _transf(S, CBAF, "1000", mes=9, parcela_numero=9, parcela_total=12, parcela_ano=2026, parcela_fns="09/12 em 2026")
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.post("/api/fns-previsao/previsoes", headers=_h(tok), json={
        "numero_portaria": "9887", "ano_portaria": 2026, "exercicio": 2026, "componente": CBAF,
        "valor_previsto": 12000, "periodicidade": "mensal", "qtd_parcelas": 12, "competencia_inicial": "2026-01"})
    assert r.json()["conciliacao"]["vinculados"] == 3
    async with S() as db:
        ref = {t.id: t.competencia_referencia for t in (await db.execute(select(TransferenciaFns))).scalars()}
    assert ref == {t7: "2026-07", t8: "2026-08", t9: "2026-09"}   # pela parcela, não pelo mês do crédito
    linhas = (await c.get("/api/fns-previsao/painel?exercicio=2026&mes_inicio=7&mes_fim=9", headers=_h(tok))).json()["linhas"]
    assert [(l["competencia"], l["situacao"], l["parcela_fns"]) for l in linhas] == [
        ("2026-07", "PAGO", ["07/12 em 2026"]), ("2026-08", "PAGO", ["08/12 em 2026"]),
        ("2026-09", "PAGO", ["09/12 em 2026"])]


async def test_parcela_unica_de_2025_paga_em_2026(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    plantas = "APOIO AO USO DE PLANTAS MEDICINAIS E FITOTERAPICOS NO SUS - CGAFB"
    tid = await _transf(S, plantas, "13041", mes=9, ano=2026, parcela_numero=1, parcela_total=1,
                        parcela_ano=2025, parcela_fns="Única em 2025")
    outra = await _transf(S, plantas, "13041", mes=9, ano=2026, parcela_numero=1, parcela_total=1,
                          parcela_ano=2026, parcela_fns="Única em 2026")
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.post("/api/fns-previsao/previsoes", headers=_h(tok), json={
        "numero_portaria": "8297", "ano_portaria": 2025, "exercicio": 2025, "componente": plantas,
        "valor_previsto": 13041, "periodicidade": "unica", "competencia_inicial": "2025-12"})
    assert r.json()["conciliacao"]["vinculados"] == 1
    async with S() as db:
        assert (await db.get(TransferenciaFns, tid)).competencia_referencia == "2025-12"
        assert (await db.get(TransferenciaFns, outra)).previsao_id is None     # parcela de 2026: não é esta


async def test_gerar_previsoes_a_partir_do_fns(ambiente):
    """Sem previsão cadastrada, o FNS já informa Portaria + parcela: gera e concilia."""
    c, S = ambiente["client"], ambiente["Session"]
    ids = []
    for n, mes in ((7, 8), (8, 9), (9, 9)):
        ids.append(await _transf(S, MAC, "312343.90", mes=mes, numero_portaria="10146", valor_total=Decimal("312343.90"),
                                 parcela_numero=n, parcela_total=12, parcela_ano=2026, parcela_fns=f"{n:02d}/12 em 2026"))
    sem_parcela = await _transf(S, CBAF, "15486.20")                    # ainda sem Comp./Parcela: fica de fora
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = (await c.post("/api/fns-previsao/previsoes/gerar-do-fns?exercicio=2026", headers=_h(tok))).json()
    assert r["criadas"] == 1 and r["conciliacao"]["vinculados"] == 3
    prev = (await c.get("/api/fns-previsao/previsoes?exercicio=2026", headers=_h(tok))).json()
    assert len(prev) == 1 and prev[0]["numero_portaria"] == "10146" and prev[0]["qtd_parcelas"] == 12
    painel = (await c.get("/api/fns-previsao/painel?exercicio=2026&mes_inicio=7&mes_fim=9", headers=_h(tok))).json()
    assert [(l["competencia"], l["situacao"]) for l in painel["linhas"]] == [
        ("2026-07", "PAGO"), ("2026-08", "PAGO"), ("2026-09", "PAGO")]
    async with S() as db:
        assert (await db.get(TransferenciaFns, sem_parcela)).previsao_id is None
        assert len((await db.execute(select(TransferenciaFns))).scalars().all()) == 4   # nada duplicado
    # segunda execução não duplica
    r2 = (await c.post("/api/fns-previsao/previsoes/gerar-do-fns?exercicio=2026", headers=_h(tok))).json()
    assert r2["criadas"] == 0
