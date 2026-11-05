"""Monitoramento SIAPS — ausência de envio de produção válida (relatório público do e-Gestor APS).

Formato real da fonte (conferido em 18/10/2026): lista nacional por competência; só o recorte do
município da sessão é guardado; só ausência é informada (nada de quantidades de produção)."""
from __future__ import annotations

import httpx
import pytest
from sqlalchemy import select

from models.egestor_ausencia import EgestorAusencia
from services import egestor_ausencia as svc

_ASYNC_CLIENT_REAL = httpx.AsyncClient
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)

EMULTI = "0002449927"
CNS_PROF = "700000000000099"


def _eq(ibge, ine, tip, desc, qt, nome="APUI"):
    return {"coMunicipioIbge": ibge, "nuCompCnes": "x", "noMunicipio": nome, "sgUf": "AM", "coEquipe": ine,
            "coTipoEquipe": tip, "dsSubTipoSuspensao": desc, "qtCompetenciasConsecutivas": qt}


D_EMULTI = "Sem envio de produção válida do atendimento remoto (eMulti) dentro do prazo estabelecido"
D_EQUIPE = "Sem envio de produção válida da equipe dentro do prazo estabelecido"
OUTRO_MUN = _eq("120005", "0001634755", "72", D_EMULTI, "Superior a 03 competências consecutivas", "ASSIS BRASIL")
PROF = {"coMunicipioIbge": "130014", "coEquipe": EMULTI, "coCnes": "2003066", "nuCns": CNS_PROF, "coCbo": "515105",
        "dsSubTipoSuspensao": "Sem envio de produção válida do profissional dentro do prazo estabelecido",
        "qtCompetenciasConsecutivas": "01 competência"}

FONTE = {
    "202606": {"dataGeracao": "19/10/2026", "equipes": [
        _eq("130014", EMULTI, "72", D_EMULTI, "02 competências consecutivas"), OUTRO_MUN],
        "estabelecimentos": [], "profissionais": [PROF]},
    "202607": {"dataGeracao": "19/10/2026", "equipes": [
        _eq("130014", EMULTI, "72", D_EMULTI, "Superior a 03 competências consecutivas"),
        _eq("130014", "0001773917", "71", D_EQUIPE, "01 competência"), OUTRO_MUN],
        "estabelecimentos": [], "profissionais": []},
    "202608": {"dataGeracao": "19/10/2026", "equipes": [OUTRO_MUN], "estabelecimentos": [], "profissionais": []},
}


def _fonte_falsa(monkeypatch, falhar=False):
    def handler(request: httpx.Request) -> httpx.Response:
        if falhar:
            return httpx.Response(503)
        if request.url.path.endswith("/competencias"):
            return httpx.Response(200, json=list(FONTE))
        return httpx.Response(200, json=FONTE[request.url.params["nuCompCnes"]])
    monkeypatch.setattr(svc.httpx, "AsyncClient",
                        lambda *a, **k: _ASYNC_CLIENT_REAL(transport=httpx.MockTransport(handler), timeout=5))


async def _sincronizar(c, tok, **corpo):
    return await c.post("/api/egestor-ausencia/sincronizar", json=corpo or None, headers=_h(tok))


# ── regras puras ──────────────────────────────────────────────────────────────

def test_qt_consecutivas_e_niveis():
    assert svc.qt_consecutivas("01 competência") == 1
    assert svc.qt_consecutivas("02 competências consecutivas") == 2
    assert svc.qt_consecutivas("03 competências consecutivas") == 3
    assert svc.qt_consecutivas("Superior a 03 competências consecutivas") == 4
    assert svc.qt_consecutivas(None) is None
    assert [svc.nivel(q) for q in (None, 1, 2, 3, 4)] == ["verde", "amarelo", "laranja", "vermelho", "vermelho"]
    assert svc.nivel(None, coletada=False) == "cinza"


# ── coleta e recorte do município ─────────────────────────────────────────────

async def test_sem_coleta_nao_inventa_nada(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    for rota in ("painel", "ausencias", "alertas", "historico"):
        r = (await c.get(f"/api/egestor-ausencia/{rota}", headers=_h(tok))).json()
        assert r["situacao_dado"] == "nao_disponivel"


async def test_coleta_guarda_so_o_municipio_e_mascara_o_cns(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    _fonte_falsa(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = (await _sincronizar(c, tok, historico=True)).json()
    assert [x["competencia"] for x in r["coletadas"]] == ["2026-06", "2026-07", "2026-08"] and not r["erros"]
    assert r["ultima_competencia_fonte"] == "2026-08"
    async with S() as db:
        linhas = (await db.execute(select(EgestorAusencia))).scalars().all()
    assert linhas and all(l.municipio_ibge == "1300144" for l in linhas)      # nada de outro município
    assert not any(l.ine == "0001634755" for l in linhas)
    prof = next(l for l in linhas if l.tipo_registro == "profissional")
    assert prof.cns_mascarado.endswith("0099") and CNS_PROF not in (prof.cns_mascarado, prof.chave)
    corpo = (await c.get("/api/egestor-ausencia/ausencias?competencia=2026-06", headers=_h(tok))).text
    assert CNS_PROF not in corpo                                               # CNS inteiro nunca sai pela API


async def test_painel_niveis_e_competencia_posterior(ambiente, monkeypatch):
    c = ambiente["client"]
    _fonte_falsa(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _sincronizar(c, tok, historico=True)

    jul = (await c.get("/api/egestor-ausencia/painel?competencia=2026-07", headers=_h(tok))).json()["cards"]
    assert jul["tres_ou_mais_competencias_sem_envio"] == 1 and jul["uma_competencia_sem_envio"] == 1
    assert jul["risco_de_suspensao"] == 1 and jul["equipes_sem_producao_valida"] == 2

    p = (await c.get("/api/egestor-ausencia/painel", headers=_h(tok))).json()   # padrão = última coletada
    assert p["competencia"] == "2026-08" and p["cards"]["equipes_sem_producao_valida"] == 0
    assert p["cards"]["pct_regular"] is None or p["cards"]["pct_regular"] == 100.0   # situação de julho NÃO persiste
    assert "produção transmitida" in p["nao_disponibilizado_pela_fonte"]               # sem inventar quantidades
    assert any("NÃO significa" in a for a in p["avisos"])                              # não afirma suspensão


async def test_alertas_regularizadas_e_historico(ambiente, monkeypatch):
    c = ambiente["client"]
    _fonte_falsa(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _sincronizar(c, tok, competencias=["2026-06", "2026-07"])
    a = (await c.get("/api/egestor-ausencia/alertas", headers=_h(tok))).json()
    assert a["competencia"] == "2026-07"
    critico = next(x for x in a["alertas"] if x["ine"] == EMULTI)
    assert critico["nivel"] == "vermelho" and critico["mensagem"].startswith("CRÍTICO")
    assert critico["suspensao_confirmada"] is False and critico["situacao"] == "risco_de_suspensao"

    await _sincronizar(c, tok, competencias=["2026-08"])
    a = (await c.get("/api/egestor-ausencia/alertas", headers=_h(tok))).json()
    assert a["alertas"] == [] and {x["ine"] for x in a["regularizadas"]} == {EMULTI, "0001773917"}

    h = (await c.get("/api/egestor-ausencia/historico", headers=_h(tok))).json()
    tipos = {(e["competencia"], e["tipo"], e["ine"]) for e in h["eventos"]}
    assert ("2026-07", "entrou_em_ausencia", "0001773917") in tipos
    assert ("2026-08", "regularizada", EMULTI) in tipos


# ── caso individual e acompanhamento ──────────────────────────────────────────

async def test_caso_da_equipe_e_acompanhamento(ambiente, monkeypatch):
    c = ambiente["client"]
    _fonte_falsa(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _sincronizar(c, tok, historico=True)
    caso = (await c.get(f"/api/egestor-ausencia/equipe/{EMULTI}", headers=_h(tok))).json()
    assert [t["competencia"] for t in caso["linha_do_tempo"]] == ["2026-06", "2026-07", "2026-08"]
    assert caso["ultima_competencia_sem_ausencia"] == "2026-08" and caso["tipologia"] == "72"
    assert caso["historico_transmissoes"] == "Informação não disponibilizada pela fonte"
    assert any("eMulti" in x for x in caso["possiveis_causas"])
    assert (await c.get("/api/egestor-ausencia/equipe/0009999999", headers=_h(tok))).status_code == 404

    consulta = await _token(c, "ana.consulta@apui.gov.br")
    corpo = {"situacao": "em_acompanhamento", "responsavel": "Coord. APS", "observacao": "Conferir lote no PEC"}
    assert (await c.put(f"/api/egestor-ausencia/equipe/{EMULTI}/acompanhamento", json=corpo, headers=_h(consulta))).status_code == 403
    assert (await c.put(f"/api/egestor-ausencia/equipe/{EMULTI}/acompanhamento", json=corpo, headers=_h(tok))).status_code == 200
    caso = (await c.get(f"/api/egestor-ausencia/equipe/{EMULTI}", headers=_h(tok))).json()
    assert caso["acompanhamento"]["situacao"] == "em_acompanhamento" and caso["acompanhamento"]["responsavel"] == "Coord. APS"


# ── permissões, isolamento e falhas ───────────────────────────────────────────

async def test_so_editor_sincroniza_e_municipio_b_nao_ve_dados_de_apui(ambiente, monkeypatch):
    c = ambiente["client"]
    _fonte_falsa(monkeypatch)
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await _sincronizar(c, consulta)).status_code == 403
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _sincronizar(c, tok, historico=True)

    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/egestor-ausencia/painel", headers=_h(tok_b))).json()["situacao_dado"] == "nao_disponivel"
    assert (await c.get(f"/api/egestor-ausencia/equipe/{EMULTI}", headers=_h(tok_b))).json()["situacao_dado"] == "nao_disponivel"
    assert (await c.get("/api/egestor-ausencia/fonte", headers=_h(tok_b))).json()["coletas"] == []


async def test_fonte_fora_do_ar_e_competencia_invalida(ambiente, monkeypatch):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    _fonte_falsa(monkeypatch, falhar=True)
    assert (await _sincronizar(c, tok)).status_code == 503
    _fonte_falsa(monkeypatch)
    assert (await _sincronizar(c, tok, competencias=["2099-01"])).status_code == 422


# ── tipo de ausência e cruzamento com o relatório público de pagamento ───────

def test_tipo_de_ausencia_lido_do_texto_oficial():
    from routers.egestor_ausencia import tipo_ausencia
    assert tipo_ausencia(D_EMULTI) == "atendimento_remoto"
    assert tipo_ausencia(D_EQUIPE) == "producao_equipe"
    assert tipo_ausencia("Sem envio de produção válida da equipe e do atendimento remoto (eMulti) "
                         "dentro do prazo estabelecido") == "equipe_e_remoto"


async def _gravar_pagamento(S, comp_cnes: str, parcela: str, st_remoto: str, pago_remoto: str):
    """Parcela do e-Gestor no formato gravado pela aba Relatório de Pagamento (conferido em 05/11/2026)."""
    import json
    from models.egestor_pagamento import EgestorPagamentoComponente, EgestorValidacaoEquipe
    from models.municipio import Municipio
    async with S() as db:
        mid = (await db.execute(select(Municipio.id).where(Municipio.codigo_ibge == "1300144"))).scalar_one()
        for co, ds, vl in ((42, "Custeio - eMulti", 12000), (55, "Atendimento Remoto - eMulti", 2500 if pago_remoto == "PAGO" else 0)):
            db.add(EgestorPagamentoComponente(municipio_id=mid, nu_parcela=parcela, nu_comp_cnes=comp_cnes, co_plano=9,
                                              ds_plano="Equipes Multiprofissionais - eMulti", co_componente=co,
                                              ds_componente=ds, vl_total=vl))
        st = {"stPagamento": "PAGO", "stSuspensaoProducao": "NÃO SUSPENSO", "stSuspensaoProdAtendRemoto": st_remoto,
              "stPagamentoAtendRemoto": pago_remoto, "coEquipe": EMULTI}
        db.add(EgestorValidacaoEquipe(municipio_id=mid, nu_parcela=parcela, co_componente=42, ine=EMULTI,
                                      st_pagamento="PAGO", payload=json.dumps(st, ensure_ascii=False)))
        await db.commit()


async def test_painel_e_alertas_separam_atendimento_remoto_e_confirmam_no_egestor(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    _fonte_falsa(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _sincronizar(c, tok, competencias=["2026-06", "2026-07"])

    # sem a parcela coletada: nada é afirmado sobre suspensão
    a = (await c.get("/api/egestor-ausencia/alertas", headers=_h(tok))).json()
    em = next(x for x in a["alertas"] if x["ine"] == EMULTI)
    assert em["tipo_ausencia"] == "atendimento_remoto" and "atendimento remoto (eMulti)" in em["mensagem"]
    assert em["suspensao_verificada"] is False and em["suspensao_confirmada"] is False
    assert any("03.01.01.025-0" in p for p in em["providencias"])
    eq = next(x for x in a["alertas"] if x["ine"] == "0001773917")
    assert eq["tipo_ausencia"] == "producao_equipe" and eq["providencias"] is None
    p = (await c.get("/api/egestor-ausencia/painel?competencia=2026-07", headers=_h(tok))).json()
    assert {x["tipo"]: x["equipes"] for x in p["ausencia_por_tipo"]} == {
        "producao_equipe": 1, "atendimento_remoto": 1, "equipe_e_remoto": 0}
    assert p["pagamento"]["verificado"] is False and p["emulti_atendimento_remoto"]["verificado"] is False

    # parcela 09/2026 (avalia CNES 07/2026) publica a suspensão do atendimento remoto
    await _gravar_pagamento(S, "202607", "202609", "SUSPENSO", "NÃO PAGO")
    a = (await c.get("/api/egestor-ausencia/alertas", headers=_h(tok))).json()
    em = next(x for x in a["alertas"] if x["ine"] == EMULTI)
    assert em["suspensao_verificada"] is True and em["suspensao_confirmada"] is True
    assert "09/2026" in em["suspensao_confirmada_nota"] and "atendimento remoto" in em["suspensao_confirmada_nota"]
    assert a["parcela_verificada"] == "09/2026"
    p = (await c.get("/api/egestor-ausencia/painel?competencia=2026-07", headers=_h(tok))).json()
    assert p["pagamento"]["parcela_rotulo"] == "09/2026" and [s["ine"] for s in p["pagamento"]["suspensoes_confirmadas"]] == [EMULTI]
    bloco = p["emulti_atendimento_remoto"]
    assert bloco["verificado"] and bloco["valor_atendimento_remoto"] == 0
    assert bloco["equipes"][0]["st_pagamento_atend_remoto"] == "NÃO PAGO"
    assert bloco["equipes"][0]["ausencia_na_competencia"] == "Atendimento remoto (eMulti)"
    caso = (await c.get(f"/api/egestor-ausencia/equipe/{EMULTI}", headers=_h(tok))).json()
    assert caso["pagamento_na_competencia"]["suspensao_confirmada"] is True
    assert caso["tipo_ausencia_atual"] == "Atendimento remoto (eMulti)"

    # outra competência sem parcela coletada continua "não verificada"
    p6 = (await c.get("/api/egestor-ausencia/painel?competencia=2026-06", headers=_h(tok))).json()
    assert p6["pagamento"]["verificado"] is False


async def test_pagamento_de_apui_nao_aparece_para_outro_municipio(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    _fonte_falsa(monkeypatch)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _sincronizar(c, tok, competencias=["2026-07"])
    await _gravar_pagamento(S, "202607", "202609", "NÃO SUSPENSO", "PAGO")
    ok = (await c.get("/api/egestor-ausencia/alertas", headers=_h(tok))).json()
    em = next(x for x in ok["alertas"] if x["ine"] == EMULTI)
    assert em["suspensao_confirmada"] is False and "sem suspensão" in em["suspensao_confirmada_nota"]
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/egestor-ausencia/painel", headers=_h(tok_b))).json()["situacao_dado"] == "nao_disponivel"


def test_validacao_da_emulti_vem_dentro_de_validacoes():
    """Formato real do relatório detalhado da eMulti (componente 42), conferido em 05/11/2026."""
    from services.egestor_pagamento import pendencias, validacoes_equipes
    emulti = {"vlTotal": 12000, "validacoes": {"validacoesEquipes": [
        {"coEquipe": EMULTI, "stPagamento": "PAGO", "stSuspensaoProdAtendRemoto": "SUSPENSO",
         "stPagamentoAtendRemoto": "NÃO PAGO", "stSuspensaoEquipeInativa": "ATIVA"}], "validacoesVinculoEquipe": []}}
    esf = {"vlTotal": 1, "validacoesEquipes": [{"coEquipe": "0001773917", "stPagamento": "PAGO"}]}
    assert [e["coEquipe"] for e in validacoes_equipes(emulti)] == [EMULTI]
    assert [e["coEquipe"] for e in validacoes_equipes(esf)] == ["0001773917"]
    assert validacoes_equipes([]) == [] and validacoes_equipes({}) == []
    rotulos = {p["rotulo"] for p in pendencias(validacoes_equipes(emulti)[0])}
    assert rotulos == {"Suspensão por falta de produção de atendimento remoto (eMulti)",
                       "Pagamento do atendimento remoto (eMulti)"}
