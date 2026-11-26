"""Matriz Normativa da APS — regras de equipe sobre a base normativa existente (agente de Portarias + parâmetros
versionados do Simulador). Sem internet: a conferência no texto oficial é da rotina diária de vigência."""
from __future__ import annotations

from services import aps_matriz_normativa as mn
from services import aps_parametros as ap
from services import fns_portarias_normas as N
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)


def test_catalogo_consistente():
    for k, (_v, disp, vig) in ap.REGRAS.items():
        assert disp in N.DISPOSITIVOS and len(vig) == 6, k
    for m in mn.MODALIDADES:
        for c in m["criterios"]:
            d = N.DISPOSITIVOS[c["dispositivo"]]
            assert d.get("tema") == "equipes_aps" and d["conferencia"], c
            assert all(p in ap.REGRAS for p in c["parametros"]), c
            assert all(cat in mn.CATEGORIAS for cat in c["categorias"]), c
        assert any(n["papel"] == "vigente" for n in m["cadeia"]), m["id"]
    # trecho de conferência curto e sem aspas tipográficas (procurado no texto oficial normalizado)
    for k, d in N.DISPOSITIVOS.items():
        if d.get("tema") == "equipes_aps":
            assert 15 <= len(d["conferencia"]) <= 120 and "“" not in d["conferencia"], k


def test_dispositivos_de_equipe_fora_da_consulta_de_despesas():
    import inspect
    from services import fns_portarias_agente as ag
    assert 'd.get("tema") != "equipes_aps"' in inspect.getsource(ag.consultar_aplicacao)


def test_cbo_emulti_do_anexo6():
    assert len(mn.CBO_EMULTI) == 28
    assert all(len(c) == 6 and c.isdigit() for c in mn.CBO_EMULTI)
    # categorias da eMulti Anizio (Apuí) conferidas no CNES em 26/11/2026
    assert {"223710", "223605", "223810"} <= set(mn.CBO_EMULTI)


async def test_matriz_por_modalidade_com_valores_e_fundamentacao(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.get("/api/aps-simulador/matriz-normativa?competencia=202610", headers=_h(tok))
    assert r.status_code == 200, r.text
    d = r.json()
    mods = {m["id"]: m for m in d["modalidades"]}
    assert set(mods) == {"eSF", "eAP", "eSB", "eSFR", "eMulti"}
    esf = {x["id"]: x for x in mods["eSF"]["criterios"]}
    assert esf["ch_individual"]["exigencia"] == "40 h semanais para todos os profissionais"
    assert esf["ch_individual"]["fundamentacao"]["url"].endswith("prc0002_03_10_2017.html")
    assert esf["susp_ch"]["valores"]["regra.aps.ch_max_acumulada"]["valor"] == 60
    emulti = {x["id"]: x for x in mods["eMulti"]["criterios"]}
    assert emulti["ch_total_complementar"]["exigencia"].startswith("Mínimo de 200 h semanais")
    assert "?" not in " ".join(x["exigencia"] for m in d["modalidades"] for x in m["criterios"])
    assert any(f["chave"].startswith("fixo.eSF.") for f in mods["eSF"]["financiamento"])
    assert mods["eSFR"]["pendencias"]
    # disponível para outros municípios (não é exclusivo de Apuí)
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/aps-simulador/matriz-normativa", headers=_h(tok_b))).status_code == 200


async def test_atualizacao_de_regra_so_vale_depois_de_validada(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    outro = await _token(c, "multi@teste.gov.br")
    novo = {"chave": "regra.eMulti.estrategica.ch_total_min", "valor": 120, "nacional": False,
            "norma": "PRT GM/MS nº 99.999/2027 (teste)", "fonte": "Texto oficial de teste",
            "justificativa": "Simulação de nova redação da norma", "vigencia_inicio": "202701"}
    pid = (await c.post("/api/aps-simulador/parametros", json=novo, headers=_h(tok))).json()["id"]

    async def valor(comp):
        d = (await c.get(f"/api/aps-simulador/matriz-normativa?competencia={comp}", headers=_h(tok))).json()
        m = next(m for m in d["modalidades"] if m["id"] == "eMulti")
        crit = next(x for x in m["criterios"] if x["id"] == "ch_total_estrategica")
        return crit["valores"]["regra.eMulti.estrategica.ch_total_min"]["valor"]

    assert await valor("202701") == 100                      # pendente: não altera
    r = await c.post(f"/api/aps-simulador/parametros/{pid}/decidir", json={"aprovar": True}, headers=_h(outro))
    assert r.status_code == 200, r.text
    assert await valor("202701") == 120                      # validada: vale a partir da vigência
    assert await valor("202612") == 100                      # competência anterior preserva a regra antiga
