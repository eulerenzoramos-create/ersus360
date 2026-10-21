"""Diagnóstico técnico da ausência de envio (Monitoramento SIAPS).

Formato real das fontes conferido em 21/10/2026: relatório público de Validação do SISAB (tabela CNES, INE,
Tipo Equipe, Validação, Total; "Reprovado(PROF)", "Reprovado(CNES+INE)") e validação por equipe do pagamento
do e-Gestor (stEsbAtiva, stSuspensaoProducao…). Caso real usado como referência: eSB 0008 TRES ESTADOS,
INE 0001774026, CNES 9934448 — nenhuma ficha recebida em 12/2025, enquanto a eSF da mesma unidade enviou."""
from __future__ import annotations

import pytest

from services import egestor_diagnostico as dg
from services import sisab_validacao as sv
from tests.test_egestor_ausencia import _fonte_falsa, _sincronizar
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)

INE = "0001774026"
CNES = "9934448"
AGORA = "2026-10-21T13:00:00Z"
D_EQUIPE = "Sem envio de produção válida da equipe dentro do prazo estabelecido"
D_REMOTO = "Sem envio de produção válida do atendimento remoto (eMulti) dentro do prazo estabelecido"


def _l(cnes, ine, val, total, motivo=None, tp="71"):
    return {"cnes": cnes, "ine": ine, "tp_equipe": tp if ine else None, "validacao": val, "motivo": motivo, "total": total}


def _sis(total, prazo=None):
    return {"situacao": "ok", "payload": {"total": total, "no_prazo": total if prazo is None else prazo},
            "consultado_em": AGORA, "mensagem": None}


NAO = {"situacao": "nao_consultado", "payload": {}, "consultado_em": None, "mensagem": None}


def _ctx(sisab=NAO, pagamento=NAO, descricao=D_EQUIPE, **extra):
    base = {"ine": INE, "competencia": "2025-12", "equipe": "0008 TRES ESTADOS", "tipo_equipe": "eSB",
            "ausencia": {"descricao": descricao, "qt_texto": "01 competência", "coletado_em": AGORA},
            "profissionais": [], "sisab": sisab, "pagamento": pagamento, "cnes_xml": None, "pec": {},
            "cnes_equipe": CNES}
    return {**base, **extra}


def _codigos(d):
    return {a["codigo"]: a["classe"] for a in d["achados"]}


# ── regras ────────────────────────────────────────────────────────────────────

def test_nada_recebido_confirma_e_unidade_que_transmitiu_e_so_indicio():
    d = dg.diagnosticar(_ctx(_sis([_l(CNES, "0001690442", "Aprovado", 3109, tp="70"),
                                   _l("3697983", None, "Aprovado", 2)])))
    assert d["classificacao"] == "causa_confirmada"
    assert d["causa"] == "Produção da equipe não chegou à base federal (SISAB)"
    c = _codigos(d)
    assert c["SEM_RECEBIMENTO_FEDERAL"] == "confirmada"
    assert c["UNIDADE_TRANSMITIU_OUTRAS_EQUIPES"] == "possivel"      # indício, nunca causa confirmada
    assert "REGISTROS_SEM_INE" not in c                                # ficha sem INE de OUTRA unidade não conta
    assert d["etapas"]["transmissao"]["status"] == "nao_recebido"
    assert d["etapas"]["origem"]["status"] == "nao_verificado"         # PEC nunca é presumido
    assert any("PEC" in f for f in d["fontes_nao_verificadas"])
    assert d["orientacoes"] and all("regra" in o for o in d["orientacoes"])


def test_unidade_inteira_sem_envio_e_fichas_sem_ine_da_propria_unidade():
    d = dg.diagnosticar(_ctx(_sis([_l("3697983", "0000007099", "Aprovado", 5000, tp="70")])))
    assert "UNIDADE_SEM_ENVIO" in _codigos(d)
    d = dg.diagnosticar(_ctx(_sis([_l(CNES, None, "Reprovado", 32, "CBO")])))
    assert _codigos(d)["REGISTROS_SEM_INE"] == "possivel"


def test_envio_fora_do_prazo_confirmado():
    d = dg.diagnosticar(_ctx(_sis([_l(CNES, INE, "Aprovado", 1)], prazo=[])))
    assert d["classificacao"] == "causa_confirmada" and _codigos(d)["ENVIO_FORA_DO_PRAZO"] == "confirmada"
    assert d["etapas"]["transmissao"]["texto"].startswith("1 ficha(s) recebida(s)")


def test_reprovacao_total_confirma_e_parcial_nao():
    total = dg.diagnosticar(_ctx(_sis([_l(CNES, INE, "Reprovado", 7, "PROF")])))
    assert total["classificacao"] == "causa_confirmada"
    a = next(x for x in total["achados"] if x["codigo"] == "REJEICAO_VALIDACAO")
    assert a["erro_oficial"]["codigo"] == "Reprovado(PROF)" and "vínculo" in a["descricao"]
    parcial = dg.diagnosticar(_ctx(_sis([_l(CNES, INE, "Reprovado", 2, "CNES+INE"), _l(CNES, INE, "Aprovado", 50)])))
    assert parcial["classificacao"] == "sem_inconsistencia"            # há produção aprovada no prazo
    assert _codigos(parcial)["REJEICAO_VALIDACAO"] == "possivel"
    assert _codigos(parcial)["DIVERGENCIA_SISAB_SIAPS"] == "informativo"


def test_emulti_remoto_e_subtipo_oficial():
    d = dg.diagnosticar(_ctx(_sis([_l("2003066", INE, "Aprovado", 442, tp="72")]), descricao=D_REMOTO, tipo_equipe="eMulti"))
    assert d["classificacao"] == "causa_confirmada" and "AUSENCIA_ATENDIMENTO_REMOTO" in _codigos(d)
    assert "DIVERGENCIA_SISAB_SIAPS" not in _codigos(d)                 # explicado pelo subtipo


def test_sem_fonte_consultada_e_indisponivel_e_competencia_nao_publicada():
    d = dg.diagnosticar(_ctx())
    assert d["classificacao"] == "indisponivel" and d["etapas"]["transmissao"]["status"] == "nao_verificado"
    assert any(o["codigo"] == "VERIFICAR_ORIGEM" for o in d["orientacoes"])
    pend = {"situacao": "nao_publicado", "payload": {}, "consultado_em": AGORA, "mensagem": "ainda não disponível"}
    d = dg.diagnosticar(_ctx(pend))
    assert d["classificacao"] == "indisponivel" and _codigos(d)["PROCESSAMENTO_PENDENTE"] == "informativo"


def test_pagamento_bloqueio_cadastral_e_consequencia():
    eq = {"ine": INE, "co_componente": 5, "cnes": CNES, "st_pagamento": "NÃO PAGO",
          "situacoes": {"stEsbAtiva": "INATIVA", "stSuspensaoProducao": "SUSPENSO"},
          "pendencias": [{"campo": "stEsbAtiva", "rotulo": "eSB ativa", "situacao": "INATIVA"},
                         {"campo": "stSuspensaoProducao", "rotulo": "Suspensão por falta de produção", "situacao": "SUSPENSO"}]}
    pag = {"situacao": "ok", "payload": {"parcela": "202602", "equipes": [eq]}, "consultado_em": AGORA, "mensagem": None}
    d = dg.diagnosticar(_ctx(pagamento=pag))
    assert _codigos(d)["CADASTRO_BLOQUEIO_EGESTOR"] == "confirmada" and d["classificacao"] == "causa_confirmada"
    assert d["consequencias"][0]["suspenso_por_producao"] is True and "2ª parcela/2026" in d["consequencias"][0]["texto"]
    ok = dict(eq, st_pagamento="PAGO", situacoes={"stSuspensaoProducao": "NÃO SUSPENSO"}, pendencias=[])
    d = dg.diagnosticar(_ctx(pagamento={**pag, "payload": {"parcela": "202602", "equipes": [ok]}}))
    assert d["consequencias"][0]["suspenso_por_producao"] is False and d["etapas"]["cadastro"]["status"] == "regular"


def test_cnes_xml_do_mesmo_mes():
    xml = {"data_arquivo": "2025-12-10", "equipe": {"ine": INE, "desativada_em": "2025-11-30"}, "pendencias": []}
    assert _codigos(dg.diagnosticar(_ctx(cnes_xml=xml)))["EQUIPE_DESATIVADA_CNES"] == "confirmada"
    assert _codigos(dg.diagnosticar(_ctx(cnes_xml={"data_arquivo": "2025-12-10", "equipe": None})))["EQUIPE_AUSENTE_CNES_XML"] == "possivel"


# ── leitura do relatório do SISAB ─────────────────────────────────────────────

HTML = """<form id="j_idt44"><select id="unidGeo" name="unidGeo"></select>
<span id="competencia"><select name="j_idt70"><option value="202512">12/2025</option><option value="202601">01/2026</option></select></span>
<select name="j_idt77"><option value="2%">Duplicado</option><option value="1%">Aprovado</option></select>
<table><tr><th>CNES</th><th>INE</th><th>Tipo Equipe</th><th>Validação</th><th>Total</th></tr>
<tr><td>9934448</td><td>0001690442</td><td>70</td><td>Aprovado</td><td>3.109</td></tr>
<tr><td>9934448</td><td></td><td></td><td>Reprovado(CBO)</td><td>32</td></tr>
<tr><td>2013290</td><td>0001773941</td><td>71</td><td>Duplicado</td><td>18</td></tr>
<tr><td>9934448</td><td>0001774026</td><td>71</td><td>Preliminar&gt;Aprovado</td><td>58</td></tr></table></form>"""


def test_parser_do_sisab():
    assert sv.competencias_disponiveis(HTML) == ["2025-12", "2026-01"]
    assert sv._select_com_opcao(HTML, "1%") == "j_idt77" and sv._form_id(HTML) == "j_idt44"
    linhas = sv.ler_tabela(HTML)
    assert linhas[0] == {"cnes": "9934448", "ine": "0001690442", "tp_equipe": "70", "validacao": "Aprovado",
                         "motivo": None, "preliminar": False, "total": 3109}
    assert linhas[1]["ine"] is None and linhas[1]["validacao"] == "Reprovado" and linhas[1]["motivo"] == "CBO"
    r = sv.resumo_ine({"total": linhas, "no_prazo": linhas[:1]}, "0001773941")
    assert r["recebidos"] == 18 and r["duplicados"] == 18 and r["aprovados_no_prazo"] == 0
    p = sv.resumo_ine({"total": linhas, "no_prazo": linhas}, "0001774026")   # competência ainda em processamento
    assert p["aprovados"] == 58 and p["preliminar"] is True
    assert dg.previa_equipe({**p, "reprovados": 0}, "eSB")["situacao"] == "com_producao"


# ── API ───────────────────────────────────────────────────────────────────────

EMULTI = "0002449927"


def _fontes_oficiais_falsas(monkeypatch):
    async def validacao(ibge, comp, client=None):
        if comp == "2026-08":
            return {"disponivel": False, "competencias_disponiveis": ["2026-07"], "total": [], "no_prazo": []}
        linhas = [_l("2003066", EMULTI, "Aprovado", 400, tp="72"), _l("3697983", "0000007099", "Aprovado", 900, tp="70")]
        return {"disponivel": True, "competencias_disponiveis": ["2026-06", "2026-07"], "total": linhas, "no_prazo": linhas}

    async def pagamento(ibge, comps, client):
        return {c: {"publicado": c == "2026-06", "parcela": "202608", "equipes": []} for c in comps}
    monkeypatch.setattr(dg.sv, "validacao_competencia", validacao)
    monkeypatch.setattr(dg, "_pagamento_competencias", pagamento)


async def test_fluxo_api_diagnostico_resumo_alertas(ambiente, monkeypatch):
    c = ambiente["client"]
    _fonte_falsa(monkeypatch)
    _fontes_oficiais_falsas(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _sincronizar(c, tok, historico=True)

    antes = (await c.get(f"/api/egestor-ausencia/diagnostico/equipe/{EMULTI}", headers=_h(tok))).json()
    assert {d["classificacao"] for d in antes["diagnosticos"]} == {"causa_confirmada"}   # subtipo oficial já basta
    assert antes["diagnosticos"][0]["etapas"]["transmissao"]["status"] == "nao_verificado"

    r = await c.post("/api/egestor-ausencia/diagnostico/verificar", json={"segundo_plano": False}, headers=_h(tok))
    assert r.status_code == 200 and r.json()["competencias"][:2] == ["2026-06", "2026-07"]
    assert all(c > "2026-08" for c in r.json()["competencias"][2:])        # prévia: depois da última lista oficial

    d = (await c.get(f"/api/egestor-ausencia/diagnostico/equipe/{EMULTI}", headers=_h(tok))).json()
    assert d["competencias_com_ausencia"] == ["2026-06", "2026-07"] and d["ausencia_em_curso"] is False
    jun = d["diagnosticos"][0]
    assert jun["etapas"]["transmissao"]["status"] == "recebido" and jun["etapas"]["cadastro"]["status"] == "nao_listada"
    assert d["diagnosticos"][1]["etapas"]["cadastro"]["status"] == "nao_verificado"   # parcela ainda não publicada
    assert "regularizada" in d["conclusao"]

    eq2 = (await c.get("/api/egestor-ausencia/diagnostico/equipe/0001773917", headers=_h(tok))).json()["diagnosticos"][0]
    assert eq2["classificacao"] == "causa_confirmada" and eq2["etapas"]["transmissao"]["status"] == "nao_recebido"

    res = (await c.get("/api/egestor-ausencia/diagnostico/resumo", headers=_h(tok))).json()
    assert res["cards"]["casos"] == 3 and res["cards"]["equipes_com_ausencia"] == 2
    assert res["cards"]["competencias_afetadas"] == 2 and res["cards"]["pendencias_intervencao_sms"] == 0
    assert {e["situacao"] for e in res["evidencias"]} >= {"ok"}

    al = (await c.get("/api/egestor-ausencia/diagnostico/alertas", headers=_h(tok))).json()
    assert al["competencia"] == "2026-08" and al["alertas"] == []          # 08/2026 sem ausência


async def test_diagnostico_permissao_e_isolamento(ambiente, monkeypatch):
    c = ambiente["client"]
    _fonte_falsa(monkeypatch)
    _fontes_oficiais_falsas(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _sincronizar(c, tok, historico=True)
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/egestor-ausencia/diagnostico/verificar", json={"segundo_plano": False},
                         headers=_h(consulta))).status_code == 403
    assert (await c.post("/api/egestor-ausencia/diagnostico/verificar", json={"competencias": ["2026-6"], "segundo_plano": False},
                         headers=_h(tok))).status_code == 422
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    for rota in ("resumo", "alertas", f"equipe/{EMULTI}"):
        r = (await c.get(f"/api/egestor-ausencia/diagnostico/{rota}", headers=_h(tok_b))).json()
        assert r["situacao_dado"] == "nao_disponivel"
    assert (await c.get("/api/egestor-ausencia/diagnostico/equipe/0009999999", headers=_h(tok))).status_code == 404


def test_previa_por_equipe():
    base = {"recebidos": 0, "aprovados": 0, "aprovados_no_prazo": 0, "reprovados": 0, "reprovados_por_motivo": {}, "cnes": []}
    assert dg.previa_equipe(base, "eSB")["situacao"] == "sem_envio"
    assert dg.previa_equipe({**base, "recebidos": 3, "reprovados": 3, "reprovados_por_motivo": {"PROF": 3}}, "eSB")["situacao"] == "so_reprovada"
    assert dg.previa_equipe({**base, "recebidos": 5, "aprovados": 5}, "eSF")["situacao"] == "so_fora_do_prazo"
    ok = dg.previa_equipe({**base, "recebidos": 9, "aprovados": 9, "aprovados_no_prazo": 9}, "eMulti")
    assert ok["situacao"] == "com_producao" and not ok["risco"] and "remoto" in ok["nota"]


def test_competencias_previa_respeita_calendario():
    from datetime import date
    from routers.egestor_diagnostico import competencias_previa
    cs = competencias_previa("2026-08", date(2026, 10, 21))
    assert [c["competencia"] for c in cs] == ["2026-09", "2026-10"]
    assert cs[0]["situacao"] == "envio_encerrado" and cs[1]["situacao"] == "em_producao"


async def test_api_previa(ambiente, monkeypatch):
    c = ambiente["client"]
    _fonte_falsa(monkeypatch)
    _fontes_oficiais_falsas(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _sincronizar(c, tok, historico=True)
    await c.post("/api/egestor-ausencia/diagnostico/verificar", json={"segundo_plano": False}, headers=_h(tok))
    p = (await c.get("/api/egestor-ausencia/diagnostico/previa", headers=_h(tok))).json()
    assert p["situacao_dado"] == "previa_nao_oficial" and p["ultima_competencia_oficial"] == "2026-08"
    assert all(x["competencia"] > "2026-08" for x in p["competencias"])     # depende do calendário vigente
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/egestor-ausencia/diagnostico/previa", headers=_h(tok_b))).json()["situacao_dado"] == "nao_disponivel"
