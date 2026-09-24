"""Origem dos recursos FNS: separa Ministério × emendas (individual, bancada,
comissão) usando o detalhamento oficial de cada pagamento (formato real de
maio/2026 de Apuí)."""
from __future__ import annotations

from sqlalchemy import select

from models.municipio import Municipio
from models.transferencia_fns import TransferenciaFns
from tests.test_fns_parcela_referencia import _fns_falso
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)

APS = "ATENÇÃO PRIMÁRIA"
MAC = "ATENÇÃO DE MÉDIA E ALTA COMPLEXIDADE AMBULATORIAL E HOSPITALAR"
EMENDA_APS = "EMENDA - INCREMENTO TEMPORÁRIO AO CUSTEIO DOS SERVIÇOS DE ATENÇÃO PRIMÁRIA EM SAÚDE"
EMENDA_MAC = "EMENDA - INCREMENTO TEMPORÁRIO AO CUSTEIO DOS SERVIÇOS DE ASSISTÊNCIA HOSPITALAR E AMBULATORIAL"


def _it(descricao, grupo, valor, ob, portaria, proposta=None, comp="Única em 2026"):
    ident = {"processoFormatado": "25000.064861/2026-94", "programaFundo": {"id": 1, "descricao": descricao}}
    if proposta:
        ident["processoEntidadePrograma"] = {"projeto": {"numeroSubprojeto": proposta}}
    return {"id": ident, "competencia": comp, "numeroDocumentoSiafi": ob, "nuPortaria": portaria,
            "valorTotal": valor, "valorLiquido": valor, "nomeComponente": grupo, "dataCriacaoSiafi": "06/05/2026"}


MAIO = [
    _it(EMENDA_APS, APS, 1000000, "020700", "10495", "36000745035202600"),
    _it(EMENDA_APS, APS, 500000, "020701", "10433", "36000746409202600"),
    _it(EMENDA_MAC, MAC, 500000, "020681", "10425", "36000745925202600"),
    _it("ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC", MAC, 1500000, "020690", "10923", "63000740292202600"),
    _it("ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC", MAC, 300674.9, "020650", "10146", comp="05/12 em 2026"),
    _it("INCENTIVO FINANCEIRO DA APS - EQUIPES DE SAÚDE DA FAMÍLIA/ESF", APS, 209826, "020660", "3493", comp="05/12 em 2026"),
]


async def _sincronizar_maio(ambiente, monkeypatch):
    S, ids = ambiente["Session"], ambiente["ids"]
    async with S() as db:
        (await db.get(Municipio, ids["apui"])).cnpj_fundo = "12.834.320/0001-26"
        await db.commit()
    _fns_falso(monkeypatch, MAIO)
    from services import fns_parcelas
    from tenancy.contexto import MunicipioContexto, contexto_municipio
    with contexto_municipio(MunicipioContexto(id=ids["apui"], uuid=ids["apui_uuid"], ibge="1300144",
                                              nome="APUÍ", uf="AM")):
        async with S() as db:
            await fns_parcelas.atualizar_parcelas(db, 2026, 5)
            await fns_parcelas.atualizar_parcelas(db, 2026, 5)      # re-sincronizar não duplica


async def test_separa_ministerio_e_emendas(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    await _sincronizar_maio(ambiente, monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/fns-origem/painel?exercicio=2026", headers=_h(tok))).json()
    aps, mac = d["grupos"]["Atenção Primária"], d["grupos"]["MAC — Média e Alta Complexidade"]
    assert (aps["total"], aps["ministerio"], aps["emenda_nao_classificada"]) == (1709826.0, 209826.0, 1500000.0)
    assert (mac["ministerio"], mac["emenda_nao_classificada"], mac["proposta_nao_identificada"]) == (300674.9, 500000.0, 1500000.0)
    assert d["meses"]["5"]["Atenção Primária"]["pct_emendas"] == 87.7
    assert len(d["propostas"]) == 4
    async with S() as db:                      # nada criado no Controle Financeiro
        assert (await db.execute(select(TransferenciaFns))).scalars().all() == []

    # Secretaria classifica: individual, bancada e a proposta sem marca como comissão
    for num, tipo, parl in (("36000745035202600", "individual", "Dep. Fulano"),
                            ("36000746409202600", "bancada", "Bancada do AM"),
                            ("63000740292202600", "comissao", None)):
        r = await c.put(f"/api/fns-origem/propostas/{num}", headers=_h(tok), json={"tipo": tipo, "parlamentar": parl})
        assert r.status_code == 200
    d = (await c.get("/api/fns-origem/painel?exercicio=2026", headers=_h(tok))).json()
    aps, mac = d["grupos"]["Atenção Primária"], d["grupos"]["MAC — Média e Alta Complexidade"]
    assert (aps["individual"], aps["bancada"], aps["emenda_nao_classificada"]) == (1000000.0, 500000.0, 0.0)
    assert (mac["comissao"], mac["emenda_nao_classificada"], mac["proposta_nao_identificada"]) == (1500000.0, 500000.0, 0.0)
    assert d["geral"]["emendas"] == 3500000.0
    assert await _auditoria(S, "ORIGEM_RECURSO_FNS_CLASSIFICADA")


async def test_classificacao_isolada_por_municipio_e_perfil(ambiente, monkeypatch):
    c = ambiente["client"]
    await _sincronizar_maio(ambiente, monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.put("/api/fns-origem/propostas/36000745035202600", headers=_h(tok), json={"tipo": "individual"})
    outro = await _token(c, "gestor.b@teste.gov.br")
    d = (await c.get("/api/fns-origem/painel?exercicio=2026", headers=_h(outro))).json()
    assert d["propostas"] == [] and d["geral"]["total"] == 0          # nada de Apuí vaza
    r = await c.put("/api/fns-origem/propostas/1", headers=_h(tok), json={"tipo": "qualquer"})
    assert r.status_code == 422
