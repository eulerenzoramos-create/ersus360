"""Tipo da eMulti (Ampliada / Complementar / Estratégica): modalidade oficial pelo e-Gestor (quantitativo credenciado e
pago no Custeio eMulti) × perfil no CNES (carga horária somada e equipes vinculadas, art. 40-G da PRC 2)."""
from __future__ import annotations

from services import cnes_publico as cp
from services import cnes_validacao as cv
from tests.test_cnes_retrato import _api, cnes_simulado  # noqa: F401 (fixture)
from tests.test_cnes_validacao import PARAMS, _crit, _eg
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)

EMULTI = "0000000202"


def _ref(cred: dict, pago: dict) -> dict:
    return {"_referencia": {
        "listaValoresReferencia": [{"dsSubTipoEquipe": "eMulti Estratégica", "vlCusteio": 12000}],
        "quantitativoCredenciado": cred, "quantitativoPagamento": pago}}


def _eg_emulti(cred=None, pago=None, st="PAGO", vinc=2):
    cred = cred or {"qtEstrategica": 1}
    pago = pago or {"qtEstrategica": 1}
    return _eg({EMULTI: [{"co": cv.CO_EMULTI, "ds": "Custeio - eMulti", "st_pagamento": st, "pendencias": [],
                          "payload": {"qtEquipeVinculada": vinc, "qtCargaHorariaProfApto": 40,
                                      "portariaHomologacao": "Portaria nº 1"}}]},
               {cv.CO_EMULTI: _ref(cred, pago)})


def _com_vinculadas(n):
    base = _api()

    async def buscar(caminho):
        if "/nasf-esf/" in caminho:
            return [{"ineEsf": f"00000009{i:02d}", "noReferenciaEsf": f"ESF {i}", "tpEquipeEsf": "70",
                     "coCnesEsf": "0000001"} for i in range(n)]
        return await base(caminho)
    return buscar


async def test_coleta_guarda_equipes_vinculadas_da_emulti():
    r = await cp.coletar("1300144", _com_vinculadas(3))
    em = next(e for e in r["equipes"] if e["ine"] == EMULTI)
    assert [x["ine"] for x in em["equipes_vinculadas"]] == ["0000000900", "0000000901", "0000000902"]
    assert "equipes_vinculadas" not in next(e for e in r["equipes"] if e["ine"] != EMULTI)


async def test_modalidade_oficial_e_incompatibilidade_com_a_carga():
    r = cv.validar(await cp.coletar("1300144", _com_vinculadas(3)), None, PARAMS, _eg_emulti(), {})
    em = next(e for e in r["equipes"] if e["ine"] == EMULTI)
    assert em["modalidade"] == "Estratégica" and em["rotulo_modalidade"] == "eMulti Estratégica"
    assert "Custeio eMulti" in em["modalidade_fonte"]
    c = _crit(em, "Modalidade credenciada × carga horária")
    assert c["situacao"] == "irregular"                  # 40 h somadas < 100 h exigidas para a Estratégica
    assert c["fundamentacao"]["dispositivo"].startswith("Anexo XXII, art. 40-G, III")
    assert "3 equipes vinculadas (CNES)" in _crit(em, "Carga horária da equipe")["situacao_cnes"]
    card = r["cards"]["eMulti"]
    assert card["por_modalidade"] == [{"modalidade": "Estratégica", "credenciadas": 1, "pagas": 1, "no_cnes": 1}]
    assert card["nao_credenciadas_cnes"] == 0


async def test_sem_credenciamento_e_caso_ambiguo_nao_inventam_modalidade():
    ret = await cp.coletar("1300144", _api())
    r = cv.validar(ret, None, PARAMS, _eg(), {})
    em = next(e for e in r["equipes"] if e["ine"] == EMULTI)
    assert em["modalidade"] is None and em["rotulo_modalidade"] == "eMulti (não credenciada)"
    assert _crit(em, "Modalidade credenciada")["situacao"] == "atencao"
    assert r["cards"]["eMulti"]["nao_credenciadas_cnes"] == 1
    # duas modalidades pagas e uma só equipe na lista → não dá para afirmar a modalidade da equipe
    amb = cv.validar(ret, None, PARAMS, _eg_emulti(pago={"qtEstrategica": 1, "qtComplementar": 1}), {})
    assert next(e for e in amb["equipes"] if e["ine"] == EMULTI)["modalidade"] is None


async def test_filtro_por_tipo_de_emulti(ambiente, cnes_simulado):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.post("/api/scnes-conformidade/retrato/coletar", headers=_h(tok))).status_code == 200
    d = (await c.get("/api/scnes-conformidade/conformidade?modalidade=nao_credenciada", headers=_h(tok))).json()
    assert [e["ine"] for e in d["equipes"]] == [EMULTI]
    assert d["equipes"][0]["rotulo_modalidade"].startswith("eMulti (não credenciada")
    d2 = (await c.get("/api/scnes-conformidade/conformidade?modalidade=Estratégica", headers=_h(tok))).json()
    assert d2["equipes"] == []
    assert (await c.get("/api/scnes-conformidade/conformidade?modalidade=Outra", headers=_h(tok))).status_code == 422
    xl = await c.get("/api/scnes-conformidade/conformidade/exportar?formato=xlsx&modalidade=nao_credenciada",
                     headers=_h(tok))
    assert xl.status_code == 200 and xl.content[:2] == b"PK"


# ── Vínculos entre equipes (serviço nasf-esf do CNES) ─────────────────────────

def _vinc_para(ine_alvo):
    base = _api()

    async def buscar(caminho):
        if "/nasf-esf/" in caminho:
            return [{"ineEsf": ine_alvo, "noReferenciaEsf": "EQUIPE TESTE", "tpEquipeEsf": "70", "coCnesEsf": "0000001"}]
        return await base(caminho)
    return buscar


async def test_vinculo_oficial_e_inverso_para_esf():
    ESF = "0000000101"
    r = cv.validar(await cp.coletar("1300144", _vinc_para(ESF)), None, PARAMS, _eg_emulti(), {})
    esf = next(e for e in r["equipes"] if e["ine"] == ESF)
    em = next(e for e in r["equipes"] if e["ine"] == EMULTI)
    assert [v["ine"] for v in esf["vinculos_recebidos"]] == [EMULTI]           # vínculo inverso
    assert esf["resumo_vinculos"] == "eMulti EMULTI TESTE"
    assert em["resumo_vinculos"] == "1 equipe(s) vinculada(s)"
    c = _crit(em, "Equipes vinculadas à eMulti")
    assert c["situacao"] == "conforme" and "eMulti Estratégica: 1 a 4 equipes" == c["exigencia"]
    assert _crit(esf, "eMulti vinculada")["situacao"] == "conforme"


def _eq(ine, nome, sigla, ida=None, volta=None):
    return {"ine": ine, "nome": nome, "sigla": sigla, "ativa": True, "estabelecimentos": [{"cnes": "0000001"}],
            **({"equipes_vinculadas": ida} if ida is not None else {}), "vinculos_recebidos": volta or []}


def test_regras_de_vinculo_esb_esf_emulti():
    esb_sem = _eq("0000000303", "ESB X", "ESB", ida=[])
    c = cv._vinculos(esb_sem, "eSB", None, PARAMS, {})[0]
    assert c["situacao"] == "irregular" and c["fundamentacao"]["chave"] == "PRC2_PNAB_ESB_VINC"
    assert cv.resumo_vinculos(esb_sem, "eSB") == "Sem equipe de referência"
    # e-Gestor usa outra equipe de referência
    esb = _eq("0000000303", "ESB X", "ESB", ida=[{"ine": "0000000101", "nome": "ESF A", "sigla": "ESF"}])
    eg = {"0000000303": [{"co": cv.CO_ESB40, "payload": {"coEquipeEsfEap": "0000000999"}, "st_pagamento": "PAGO",
                          "pendencias": []}]}
    assert cv._vinculos(esb, "eSB", None, PARAMS, eg)[0]["situacao"] == "atencao"
    # eSF com duas eMulti e sem a eSB que o e-Gestor paga
    esf = _eq("0000000101", "ESF A", "ESF", volta=[{"ine": "1", "nome": "M1", "sigla": "EMULTI"},
                                                    {"ine": "2", "nome": "M2", "sigla": "EMULTI"}])
    eg2 = {"0000000303": [{"co": cv.CO_ESB40, "payload": {"coEquipeEsfEap": "101"}, "st_pagamento": "PAGO",
                           "pendencias": []}]}
    cs = {c["criterio"]: c for c in cv._vinculos(esf, "eSF", None, PARAMS, eg2)}
    assert cs["eMulti vinculada"]["situacao"] == "irregular"
    assert cs["eSB vinculada"]["situacao"] == "atencao" and "0000000303" in cs["eSB vinculada"]["diferenca"]
    # eMulti Estratégica com 5 equipes → fora da faixa (1 a 4)
    em = _eq(EMULTI, "EM", "EMULTI", ida=[{"ine": str(i), "nome": f"E{i}", "sigla": "ESF"} for i in range(5)])
    c = cv._vinculos(em, "eMulti", "Estratégica", PARAMS, {})[0]
    assert c["situacao"] == "irregular" and c["fundamentacao"]["chave"] == "PRC2_40G_III"
    # retrato antigo (sem vínculos coletados): não inventa
    assert cv._vinculos(_eq("0000000303", "ESB X", "ESB"), "eSB", None, PARAMS, {})[0]["situacao"] == "nao_verificavel"
