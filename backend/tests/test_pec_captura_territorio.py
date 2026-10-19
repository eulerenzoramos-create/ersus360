"""Captura assistida do território do PEC: importação por sessão, sem inventar números e sem passar por agente."""
from datetime import datetime

import pytest
from sqlalchemy import select

from models.pec_agente import PecAcsLote
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401

URL = "/api/pec-agente/captura-territorio"


def _captura(**extra):
    base = {
        "formato": "ersus360-pec-territorio-v1", "ibge": "1300144", "origem": "captura_assistida_pec_web",
        "fonte": "e-SUS PEC web — Acompanhamento do território", "capturado_em": "2026-10-19T19:20:00Z",
        "mes_referencia": "2026-10",
        "equipes": [
            {"unidade": "Centro de Saude Curumim", "cnes": "3697983", "nome": "Juma", "ine": "0000007080", "tipo": "eSF",
             "microareas": [
                 {"codigo": "01", "imoveis": 178, "cadastro_completo": 178, "cadastro_atualizado": 178,
                  "domicilios_visitados": 69, "domicilios_a_visitar": 100},
                 {"codigo": "02", "imoveis": 207, "cadastro_completo": 207, "cadastro_atualizado": 207,
                  "domicilios_visitados": 85, "domicilios_a_visitar": 101},
                 {"codigo": "FORA", "imoveis": 217, "cadastro_completo": 10, "cadastro_atualizado": 11,
                  "domicilios_visitados": 0, "domicilios_a_visitar": 190},
             ]},
        ],
    }
    base.update(extra)
    return base


@pytest.mark.asyncio
async def test_importa_e_painel_usa_so_o_que_foi_capturado(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.post(URL, json=_captura(), headers=_h(tok))
    assert r.status_code == 200, r.text
    assert r.json() == {"ok": True, "competencia": "2026-10", "equipes": 1, "microareas": 3, "parcial_ate": "2026-10-19"}

    d = (await c.get("/api/acs/dashboard?competencia=2026-10", headers=_h(tok))).json()
    k = d["kpis"]
    assert d["origem_dado"] == "captura_assistida" and d["captura"]["parcial_ate"] == "2026-10-19"
    assert k["total_microareas"] == 2 and k["domicilios_cadastrados"] == 385           # a microárea FORA não entra
    assert k["imoveis_fora_de_area"] == 217
    assert k["domicilios_visitados"] == 154 and k["domicilios_a_visitar"] == 201 and k["pct_domicilios_visitados"] == 76.6
    for nao_capturado in ("total_acs", "acs_ativos", "visitas_realizadas", "gestantes_ativas", "familias_cadastradas"):
        assert k[nao_capturado] is None                                                  # nunca zero inventado

    ma = {m["codigo"]: m for m in (await c.get("/api/acs/microareas", headers=_h(tok))).json()["microareas"]}
    assert ma["01"]["pct_visitas"] == 69.0 and ma["01"]["domicilios_visitados"] == 69 and ma["01"]["domicilios"] == 178
    assert ma["01"]["semaforo"] is None                                                  # captura parcial: sem semáforo
    assert ma["FORA"]["fora_de_area"] is True and ma["FORA"]["nome"].startswith("Imóveis fora de área")
    assert ma["FORA"]["pct_visitas"] is None and ma["FORA"]["semaforo"] is None                   # fora de área não tem % de visita


@pytest.mark.asyncio
async def test_captura_nao_conta_como_agente_conectado(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post(URL, json=_captura(), headers=_h(tok))
    s = (await c.get("/api/pec-agente/situacao", headers=_h(tok))).json()
    assert s["estado"] == "sem_agente" and s["ultimo_contato"] is None                  # captura não é contato do agente
    assert s["captura"]["competencia"] == "2026-10" and "Captura assistida" in s["captura"]["mensagem"]


@pytest.mark.asyncio
async def test_permissoes_municipio_e_formato(ambiente):
    c = ambiente["client"]
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post(URL, json=_captura(), headers=_h(consulta))).status_code == 403
    tok = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.post(URL, json=_captura(ibge="1399991"), headers=_h(tok))).status_code == 403   # outro município
    assert (await c.post(URL, json=_captura(extra="x"), headers=_h(tok))).status_code == 422          # fora do contrato
    ruim = _captura()
    ruim["equipes"][0]["microareas"][0]["domicilios_visitados"] = 500                                   # visitou mais do que devia
    assert (await c.post(URL, json=ruim, headers=_h(tok))).status_code == 422
    ruim = _captura()
    ruim["equipes"][0]["microareas"][0]["cadastro_completo"] = 999                                      # mais que os imóveis
    assert (await c.post(URL, json=ruim, headers=_h(tok))).status_code == 422


@pytest.mark.asyncio
async def test_nao_substitui_lote_do_agente_e_municipio_b_nao_ve(ambiente):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post(URL, json=_captura(), headers=_h(tok))
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    rb = await c.get("/api/acs/microareas", headers=_h(tok_b))
    assert rb.status_code == 403                                                               # módulo só de Apuí: nada vaza
    assert (await c.post(URL, json=_captura(), headers=_h(tok_b))).status_code in (403, 404)

    async with S() as db:
        lote = (await db.execute(select(PecAcsLote).where(PecAcsLote.municipio_id == ids["apui"]))).scalar_one()
        lote.payload = {"equipes": [], "acs": [], "microareas": [], "visitas": [], "grupos": []}   # vira lote do agente
        await db.commit()
    r = await c.post(URL, json=_captura(), headers=_h(tok))
    assert r.status_code == 409 and "agente local" in r.json()["detail"]


@pytest.mark.asyncio
async def test_reimportar_atualiza_a_mesma_competencia(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post(URL, json=_captura(), headers=_h(tok))
    nova = _captura(capturado_em="2026-10-26T12:00:00Z")
    nova["equipes"][0]["microareas"][0]["domicilios_visitados"] = 80
    assert (await c.post(URL, json=nova, headers=_h(tok))).status_code == 200
    async with S() as db:
        lotes = (await db.execute(select(PecAcsLote))).scalars().all()
    assert len(lotes) == 1 and lotes[0].payload["parcial_ate"] == "2026-10-26"
    ma = {m["codigo"]: m for m in (await c.get("/api/acs/microareas", headers=_h(tok))).json()["microareas"]}
    assert ma["01"]["domicilios_visitados"] == 80
