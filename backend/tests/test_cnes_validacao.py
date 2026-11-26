"""Validações automáticas: retrato do CNES × Matriz Normativa × e-Gestor × SIAPS (dados fictícios no formato real)."""
from __future__ import annotations

import pytest

from services import aps_parametros as ap
from services import cnes_publico as cp
from services import cnes_validacao as cv
from tests.test_cnes_retrato import _api, cnes_simulado  # noqa: F401 (fixture)
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)

PARAMS = {k: {"valor": v} for k, (v, _d, _vig) in ap.REGRAS.items()}
ESF, EMULTI = "0000000101", "0000000202"


def _eg(equipes=None, resumos=None):
    return {"parcela": "202612", "comp_cnes": "202610", "resumos": resumos or {}, "equipes": equipes or {}}


def _crit(eq, nome):
    return next(c for c in eq["criterios"] if c["criterio"].startswith(nome))


async def _ret(**kw):
    return await cp.coletar("1300144", _api(**kw))


async def test_esf_sem_acs_composicao_e_risco_de_suspensao():
    r = cv.validar(await _ret(), None, PARAMS, _eg(), {})
    esf = next(e for e in r["equipes"] if e["ine"] == ESF)
    assert esf["tipo"] == "eSF"
    comp = _crit(esf, "Composição mínima")
    assert comp["situacao"] == "irregular" and "Agente comunitário" in comp["diferenca"]
    assert comp["fundamentacao"]["dispositivo"].startswith("Anexo XXII, Anexo 1 (PNAB)")
    risco = _crit(esf, "Risco de suspensão")
    assert risco["diferenca"] == "25%" and risco["situacao"] == "atencao"      # 1ª competência
    # ausência também no retrato anterior → suspensão (2 competências consecutivas)
    r2 = cv.validar(await _ret(), await _ret(), PARAMS, _eg(), {})
    esf2 = next(e for e in r2["equipes"] if e["ine"] == ESF)
    assert _crit(esf2, "Risco de suspensão")["situacao"] == "irregular"


async def test_carga_horaria_individual_e_profissional():
    r = cv.validar(await _ret(ch_enf=30), None, PARAMS, _eg(), {})
    esf = next(e for e in r["equipes"] if e["ine"] == ESF)
    ch = _crit(esf, "Carga horária individual")
    assert ch["situacao"] == "irregular" and "ENFERMEIRA FICTICIA (30 h)" in ch["diferenca"]
    enf = next(p for p in esf["profissionais"] if p["cbo"] == "223565")
    assert enf["situacao"] == "irregular" and enf["ch_exigida"] == 40 and enf["ch_cnes"] == 30


async def test_emulti_categorias_e_modalidade():
    r = cv.validar(await _ret(), None, PARAMS, _eg(), {})
    em = next(e for e in r["equipes"] if e["ine"] == EMULTI)
    assert _crit(em, "Categorias e CBO")["situacao"] == "conforme"          # psicólogo 251510 está no Anexo 6
    mod = _crit(em, "Carga horária da equipe")
    assert mod["situacao"] == "irregular" and mod["diferenca"] == "Nenhuma modalidade atendida"   # 40 h < 100 h
    assert em["credenciada"] is False
    assert _crit(em, "Credenciamento/homologação")["situacao"] == "atencao"


async def test_egestor_duplicidade_fora_do_municipio_e_tipo_oficial():
    eg = _eg({ESF: [{"co": 48, "ds": "eSF", "st_pagamento": "INVÁLIDO",
                     "pendencias": [{"campo": "stSuspensaoDuplicidadeEsf", "rotulo": "Suspensão por duplicidade",
                                     "situacao": "SUSPENSO"}],
                     "payload": {"portariaHomologacao": "Portaria nº 1"}}]},
             {48: {"qtCredenciado": 1, "qtHomologado": 1}})
    r = cv.validar(await _ret(), None, PARAMS, eg, {ESF: "eSFR"})
    esf = next(e for e in r["equipes"] if e["ine"] == ESF)
    assert esf["tipo"] == "eSFR"                                              # tipo oficial do SIAPS prevalece
    c = _crit(esf, "Situação no e-Gestor")
    assert c["situacao"] == "irregular" and "OUTRO município" in c["observacao"]
    assert esf["credenciada"] and esf["homologada"] and not esf["financiada"]
    assert r["cards"]["eSF"]["credenciadas"] == 1 and r["cards"]["eMulti"]["credenciadas"] is None
    assert _crit(esf, "Carga horária individual (eSFR)")["situacao"] == "nao_verificavel"


async def test_rotas_de_conformidade_isoladas(ambiente, cnes_simulado):
    c = ambiente["client"]
    tok_a = await _token(c, "gestor.apui@teste.gov.br")
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/scnes-conformidade/conformidade", headers=_h(tok_a))).json()["situacao_dado"] == "sem_coleta"
    await c.post("/api/scnes-conformidade/retrato/coletar", headers=_h(tok_a))
    d = (await c.get("/api/scnes-conformidade/conformidade", headers=_h(tok_a))).json()
    assert d["situacao_dado"] == "oficial" and d["cards"]["eSF"]["cadastradas_cnes"] == 1
    assert "criterios" not in d["equipes"][0]
    det = (await c.get(f"/api/scnes-conformidade/conformidade/equipes/{ESF}", headers=_h(tok_a))).json()
    assert det["criterios"] and all("chave" not in p for p in det["profissionais"])
    assert (await c.get("/api/scnes-conformidade/conformidade", headers=_h(tok_b))).json()["situacao_dado"] == "sem_coleta"
    assert (await c.get(f"/api/scnes-conformidade/conformidade/equipes/{ESF}", headers=_h(tok_b))).status_code == 404


async def test_email_semanal_usa_a_validacao_e_nao_dado_fixo():
    from services.monitor_scnes_service import gerar_html_conformidade
    v = cv.validar(await _ret(), None, PARAMS, _eg(), {})
    v["municipio"] = "Apuí/AM"
    html = gerar_html_conformidade(v, "26/11/2026 07:00")
    assert "EQUIPE TESTE" in html and "Composição mínima" in html and "prc0002_03_10_2017.html" in html
    assert "RUDINEI" not in html and "Sprint" not in html
