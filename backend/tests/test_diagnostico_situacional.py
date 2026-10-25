"""Diagnóstico Situacional da Saúde Municipal: regras de classificação (sem rede), fluxo completo pela API,
validação técnica, plano 5W2H, relatório de 12 seções, comparação entre períodos e isolamento por município.
Dados de teste fictícios, exceto a publicação do SIAPS de Apuí (tests/dados, coletada em 17/10/2026)."""
from __future__ import annotations

import json
from datetime import date, timedelta
from pathlib import Path

import pytest
from sqlalchemy import select

from models.alerta import Alerta
from models.siaps_publico import SiapsPublicoColeta
from services import diagnostico_catalogo as cat
from services import diagnostico_fontes as f
from services import diagnostico_relatorio as rel
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)

CTX = f.Contexto(1, "1300144", 2026, "quadrimestre", 1)
URL = "/api/diagnostico-situacional"


# ── Catálogo ──────────────────────────────────────────────────────────────────

def test_catalogo_tem_9_areas_e_coletores_coerentes():
    assert list(cat.AREAS) == list("ABCDEFGHI")
    assert len({i.codigo for i in cat.ITENS}) == len(cat.ITENS)
    assert all(cat.itens_da_area(a) for a in cat.AREAS)
    automaticos = {i.codigo for i in cat.ITENS if i.modo == "automatico"}
    assert automaticos == set(f.COLETORES)            # todo item automático tem coletor e vice-versa
    assert {i.modo for i in cat.ITENS} == set(cat.MODOS)
    assert "PREVINE" not in json.dumps([i.__dict__ for i in cat.ITENS], ensure_ascii=False).upper()


def test_periodos():
    assert cat.meses_do_periodo("quadrimestre", 2) == (5, 8)
    assert cat.meses_do_periodo("semestre", 2) == (7, 12)
    with pytest.raises(ValueError):
        cat.validar_periodo("quadrimestre", 4)
    with pytest.raises(ValueError):
        cat.validar_periodo("anual", 1)
    assert cat.chave_ordem(2025, "anual", 0) < cat.chave_ordem(2026, "quadrimestre", 1)


# ── Regras: ausência de dado nunca é irregularidade ──────────────────────────

def test_siops_sem_dado_ou_incompleto_e_nao_verificado():
    assert f.regra_siops({"situacao_dado": "nao_disponivel"}, 2026).classificacao == "nao_verificado"
    # percentual zerado por falta de campo na fonte não pode virar "abaixo do mínimo"
    r = f.regra_siops({"situacao_dado": "oficial_validado", "receita_impostos": 0,
                       "minimo_constitucional_pct_aplicado": 0}, 2025)
    assert r.classificacao == "nao_verificado"


def test_siops_abaixo_do_minimo_e_critico_comprovado():
    base = {"situacao_dado": "oficial_validado", "receita_impostos": 50_000_000.0, "gasto_proprio_saude": 6e6,
            "minimo_constitucional_pct_obrigatorio": 15.0}
    r = f.regra_siops({**base, "minimo_constitucional_pct_aplicado": 12.0}, 2025)
    assert (r.classificacao, r.natureza, r.competencia) == ("critico", "comprovado", "Exercício 2025")
    assert "12,00%" in r.evidencia
    assert f.regra_siops({**base, "minimo_constitucional_pct_aplicado": 19.4}, 2025).classificacao == "regular"


def test_fns_divergencia_e_hipotese_nunca_critico():
    assert f.regra_fns({"total_previsoes": 0}, CTX).classificacao == "nao_verificado"
    assert f.regra_fns({"total_previsoes": 2, "linhas": []}, CTX).classificacao == "nao_verificado"
    r = f.regra_fns({"total_previsoes": 2, "linhas": [{}, {}], "situacoes": {"PAGO": 1, "NAO_RECEBIDO": 1},
                     "cards": {"previsto": 10.0, "recebido": 5.0}}, CTX)
    assert (r.classificacao, r.natureza) == ("pendencia", "hipotese")
    r = f.regra_fns({"total_previsoes": 1, "linhas": [{}], "situacoes": {"PAGO": 1}, "cards": {}}, CTX)
    assert r.classificacao == "regular"


def test_siaps_usa_contagem_oficial_e_quadrimestre_do_periodo():
    assert f.escolher_quadrimestre(["2025Q3", "2026Q1"], CTX) == "2026Q1"
    assert f.escolher_quadrimestre(["2025Q3"], CTX) is None
    assert f.escolher_quadrimestre(["2026Q1", "2026Q2"], f.Contexto(1, "1300144", 2026, "semestre", 1)) == "2026Q1"
    assert f.regra_siaps(None, CTX).classificacao == "nao_verificado"
    quad = {"quadrimestre": "2026Q1", "rotulo": "1º quadrimestre de 2026", "componentes": [
        {"componente": "Vínculo e Acompanhamento", "tipo_equipe": "eSF", "otimo": 1, "bom": 5, "suficiente": 1,
         "regular": 2, "total": 9}]}
    r = f.regra_siaps(quad, CTX)
    assert (r.classificacao, r.natureza) == ("pendencia", "comprovado")
    assert "2 de 9" in r.justificativa


def test_pagamento_suspensao_e_critico():
    pend = [{"campo": "stSuspensaoProducao", "rotulo": "Suspensão por falta de produção", "situacao": "SUSPENSA"}]
    assert f.regra_pagamento(None, [], CTX).classificacao == "nao_verificado"
    assert f.regra_pagamento("202603", [{"ine": "1", "pendencias": pend}], CTX).classificacao == "critico"
    outra = [{"campo": "stVinculoValido", "rotulo": "Vínculo", "situacao": "INVALIDO"}]
    assert f.regra_pagamento("202603", [{"ine": "1", "pendencias": outra}], CTX).classificacao == "pendencia"
    assert f.regra_pagamento("202603", [{"ine": "1", "pendencias": []}], CTX).classificacao == "regular"


def test_cnes_e_pqa():
    assert f.regra_cnes(None, None, CTX).classificacao == "nao_verificado"
    crit = {"pendencias": [{"severidade": "critica", "mensagem": "eSF X sem médico(a) lotado(a)"}]}
    assert f.regra_cnes("2026-03-10", crit, CTX).classificacao == "critico"
    assert f.regra_cnes("2026-03-10", {"pendencias": []}, CTX).classificacao == "regular"
    fora_am = f.Contexto(1, "3550308", 2026, "anual", 0)
    assert f.regra_pqa([{"alcance": "NÃO"}], "2026", fora_am).classificacao == "nao_verificado"
    itens = [{"indicador": "IND_01", "alcance": "SIM"}, {"indicador": "IND_02", "alcance": "NÃO"},
             {"indicador": "IND_03", "alcance": "NÃO", "observacao": "Ausência de casos"}]
    r = f.regra_pqa(itens, "2026", CTX)
    assert r.classificacao == "pendencia" and r.detalhes["abaixo_da_meta"] == ["IND_02"]


def test_investsus():
    assert f.regra_investsus([], 2026).classificacao == "nao_verificado"
    props = [{"numero": "P1", "exercicio": 2026, "situacao": "em_diligencia", "situacao_original": "Em diligência"},
             {"numero": "P2", "exercicio": 2026, "situacao": "aprovada", "situacao_original": "Aprovada"}]
    assert f.regra_investsus(props, 2026).classificacao == "pendencia"
    assert f.regra_investsus(props[1:], 2026).classificacao == "regular"


async def test_falha_da_fonte_vira_nao_verificado(monkeypatch):
    async def quebra(db, ctx):
        raise TimeoutError("fora do ar")

    class _Db:
        async def rollback(self):
            pass
    monkeypatch.setitem(f.COLETORES, "G01", quebra)
    r = await f.coletar(_Db(), "G01", CTX)
    assert r.classificacao == "nao_verificado" and "TimeoutError" in r.justificativa


# ── Fluxo pela API ────────────────────────────────────────────────────────────

SIOPS = {2024: 16.2, 2025: 12.0}


@pytest.fixture
def siops_simulado(monkeypatch):
    async def fake(ano):
        if ano not in SIOPS:
            return {"situacao_dado": "nao_disponivel"}
        return {"situacao_dado": "oficial_validado", "receita_impostos": 40_000_000.0, "gasto_proprio_saude": 5e6,
                "minimo_constitucional_pct_obrigatorio": 15.0, "minimo_constitucional_pct_aplicado": SIOPS[ano]}
    import services.siops_service as s
    monkeypatch.setattr(s, "buscar_apuracao", fake)


async def _siaps_apui(Session, municipio_id):
    dados = json.loads((Path(__file__).parent / "dados" / "siaps_publico_apui_20261017.json").read_text("utf-8"))
    async with Session() as db:
        db.add(SiapsPublicoColeta(municipio_id=municipio_id, recurso="quadrimestre", chave="2026Q1", versao=1,
                                  hash="x", payload=dados["2026Q1"]))
        await db.commit()


def _por_codigo(det):
    return {i["codigo"]: i for i in det["itens"]}


async def test_fluxo_completo_apui(ambiente, siops_simulado):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    await _siaps_apui(S, ids["apui"])
    tok = await _token(c, "gestor.apui@teste.gov.br")

    r = await c.post(f"{URL}/diagnosticos", headers=_h(tok),
                     json={"exercicio": 2026, "periodo_tipo": "quadrimestre", "periodo": 1,
                           "responsavel_tecnico": "Técnica Teste"})
    assert r.status_code == 201, r.text
    did = r.json()["id"]
    assert "B01" in r.json()["coleta"]["atualizados"]
    assert (await c.post(f"{URL}/diagnosticos", headers=_h(tok),
                         json={"exercicio": 2026, "periodo_tipo": "quadrimestre", "periodo": 1})).status_code == 409
    assert (await c.post(f"{URL}/diagnosticos", headers=_h(tok),
                         json={"exercicio": 2026, "periodo_tipo": "quadrimestre", "periodo": 4})).status_code == 422

    it = _por_codigo((await c.get(f"{URL}/diagnosticos/{did}", headers=_h(tok))).json())
    assert len(it) == len(cat.ITENS)
    # SIAPS oficial de Apuí 2026Q1: 2 eSF em Regular no componente Vínculo e Acompanhamento
    assert (it["B01"]["classificacao"], it["B01"]["tipo_dado"], it["B01"]["natureza"]) == \
        ("pendencia", "automatico", "comprovado")
    assert it["B01"]["competencia"].startswith("1º quadrimestre/2026")
    # Sem dado: não verificado (SIOPS 2026 não publicado, sem CNES importado, sem FNS…)
    for cod in ("G01", "C01", "G02", "G03", "B02", "B03"):
        assert it[cod]["classificacao"] == "nao_verificado", cod
    assert it["A01"]["classificacao"] == "nao_verificado" and it["A01"]["origem"] == "declarado"

    painel = (await c.get(f"{URL}/diagnosticos/{did}/painel", headers=_h(tok))).json()
    assert painel["totais"]["pendencia"] == 1 and painel["totais"]["critico"] == 0
    assert painel["totais"]["nao_verificado"] == len(cat.ITENS) - 1
    assert painel["anterior"] is None and painel["problemas"][0]["codigo"] == "B01"

    # Validação técnica
    a05 = it["A05"]["id"]
    assert (await c.post(f"{URL}/itens/{a05}/validar", headers=_h(tok),
                         json={"decisao": "confirmar"})).status_code == 422          # não verificado
    assert (await c.put(f"{URL}/itens/{a05}", headers=_h(tok),
                        json={"classificacao": "critico"})).status_code == 422       # sem justificativa
    r = await c.put(f"{URL}/itens/{a05}", headers=_h(tok), json={
        "classificacao": "critico", "justificativa": "Sem reunião ordinária no quadrimestre.",
        "fonte": "Atas do CMS", "competencia": "jan–abr/2026", "natureza": "comprovado",
        "vazio_assistencial": False})
    assert r.status_code == 200 and r.json()["tipo_dado"] == "declarado"
    assert (await c.post(f"{URL}/itens/{a05}/validar", headers=_h(tok),
                         json={"decisao": "contestar"})).status_code == 422          # contestar exige motivo
    r = await c.post(f"{URL}/itens/{a05}/validar", headers=_h(tok),
                     json={"decisao": "confirmar", "prioridade": "alta", "responsavel": "Coord. Planejamento"})
    assert r.json()["tipo_dado"] == "validado" and r.json()["prioridade"] == "alta"
    hist = (await c.get(f"{URL}/itens/{a05}/historico", headers=_h(tok))).json()
    assert {h["evento"] for h in hist} == {"edicao", "validacao"}
    assert await _auditoria(S, "DIAGNOSTICO_ITEM_VALIDADO")

    # Coleta nova não reescreve item validado/declarado
    b01 = it["B01"]["id"]
    await c.post(f"{URL}/itens/{b01}/validar", headers=_h(tok), json={"decisao": "confirmar"})
    res = (await c.post(f"{URL}/diagnosticos/{did}/coletar", headers=_h(tok))).json()
    assert "B01" in res["preservados"]

    # Plano 5W2H só a partir de problema validado
    g01 = it["G01"]["id"]
    assert (await c.post(f"{URL}/diagnosticos/{did}/acoes", headers=_h(tok),
                         json={"item_id": g01, "o_que": "Qualquer coisa"})).status_code == 422
    ontem = (date.today() - timedelta(days=1)).isoformat()
    r = await c.post(f"{URL}/diagnosticos/{did}/acoes", headers=_h(tok), json={
        "item_id": a05, "o_que": "Retomar reuniões ordinárias do CMS", "por_que": "Item A05 crítico",
        "onde": "Sede do CMS", "quando": ontem, "quem": "Secretaria Executiva", "como": "Calendário anual",
        "produto": "Atas", "indicador": "Reuniões realizadas", "status": "em_andamento"})
    assert r.status_code == 201, r.text
    acao = r.json()
    assert acao["atrasada"] and acao["prioridade"] == "alta" and acao["quanto"] is None
    r = await c.put(f"{URL}/acoes/{acao['id']}", headers=_h(tok), json={"status": "concluida"})
    assert r.json()["atrasada"] is False
    painel = (await c.get(f"{URL}/diagnosticos/{did}/painel", headers=_h(tok))).json()
    assert painel["acoes"] == {"total": 1, "atrasadas": 0, "concluidas": 1}
    assert painel["por_tipo_dado"]["validado"] == 2

    # Anexo
    r = await c.post(f"{URL}/itens/{a05}/anexos", headers=_h(tok),
                     files={"arquivo": ("ata.pdf", b"%PDF-1.4 ata")}, data={"descricao": "Ata"})
    assert r.status_code == 201, r.text
    anexo = r.json()["id"]
    assert (await c.get(f"{URL}/anexos/{anexo}", headers=_h(tok))).content == b"%PDF-1.4 ata"
    assert (await c.post(f"{URL}/itens/{a05}/anexos", headers=_h(tok),
                         files={"arquivo": ("x.exe", b"MZ")})).status_code == 422

    # Relatório PDF
    r = await c.get(f"{URL}/diagnosticos/{did}/relatorio.pdf", headers=_h(tok))
    assert r.status_code == 200 and r.content.startswith(b"%PDF")

    # Concluído: bloqueia edição até reabrir
    await c.put(f"{URL}/diagnosticos/{did}", headers=_h(tok), json={"situacao": "concluido"})
    assert (await c.put(f"{URL}/itens/{a05}", headers=_h(tok), json={"observacoes": "x"})).status_code == 409
    await c.put(f"{URL}/diagnosticos/{did}", headers=_h(tok), json={"situacao": "em_validacao"})
    assert (await c.put(f"{URL}/itens/{a05}", headers=_h(tok), json={"observacoes": "x"})).status_code == 200

    # Isolamento: outro município não enxerga nada de Apuí
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    for path in (f"/diagnosticos/{did}", f"/diagnosticos/{did}/painel", f"/diagnosticos/{did}/relatorio.pdf",
                 f"/itens/{a05}/historico", f"/anexos/{anexo}", f"/diagnosticos/{did}/acoes"):
        assert (await c.get(URL + path, headers=_h(tok_b))).status_code == 404, path
    assert (await c.put(f"{URL}/itens/{a05}", headers=_h(tok_b), json={"observacoes": "x"})).status_code == 404
    assert (await c.get(f"{URL}/diagnosticos", headers=_h(tok_b))).json()["diagnosticos"] == []
    assert await _auditoria(S, "ACESSO_NEGADO")
    # Perfil de consulta lê, mas não altera
    tok_cons = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.get(f"{URL}/diagnosticos/{did}/painel", headers=_h(tok_cons))).status_code == 200
    assert (await c.put(f"{URL}/itens/{a05}", headers=_h(tok_cons), json={"observacoes": "x"})).status_code == 403


async def test_comparacao_e_alerta_de_novo_critico(ambiente, siops_simulado):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d24 = (await c.post(f"{URL}/diagnosticos", headers=_h(tok),
                        json={"exercicio": 2024, "periodo_tipo": "anual", "periodo": 0})).json()["id"]
    d25 = (await c.post(f"{URL}/diagnosticos", headers=_h(tok),
                        json={"exercicio": 2025, "periodo_tipo": "anual", "periodo": 0})).json()["id"]
    it24 = _por_codigo((await c.get(f"{URL}/diagnosticos/{d24}", headers=_h(tok))).json())
    it25 = _por_codigo((await c.get(f"{URL}/diagnosticos/{d25}", headers=_h(tok))).json())
    assert it24["G01"]["classificacao"] == "regular" and it25["G01"]["classificacao"] == "critico"

    p = (await c.get(f"{URL}/diagnosticos/{d25}/painel", headers=_h(tok))).json()
    assert p["anterior"]["id"] == d24
    assert [x["codigo"] for x in p["evolucao"]["pioraram"]] == ["G01"]
    assert {a["tipo"] for a in p["alertas"]} >= {"novo_critico", "critico_sem_validacao"}
    comp = (await c.get(f"{URL}/diagnosticos/{d25}/comparar?com={d24}", headers=_h(tok))).json()
    assert comp["novos_criticos"][0]["codigo"] == "G01"

    async with S() as db:
        centrais = (await db.execute(select(Alerta).where(Alerta.modulo == "Diagnóstico"))).scalars().all()
    assert len(centrais) == 1 and centrais[0].municipio_id == ids["apui"]
    await c.post(f"{URL}/diagnosticos/{d25}/coletar", headers=_h(tok))   # não duplica
    async with S() as db:
        assert len((await db.execute(select(Alerta).where(Alerta.modulo == "Diagnóstico"))).scalars().all()) == 1

    lista = (await c.get(f"{URL}/diagnosticos", headers=_h(tok))).json()["diagnosticos"]
    assert [d["id"] for d in lista] == [d25, d24]


def test_relatorio_tem_12_secoes_e_separa_hipotese():
    itens = []
    for i in cat.ITENS:
        itens.append({"id": len(itens) + 1, "codigo": i.codigo, "area": i.area, "titulo": i.titulo,
                      "classificacao": "nao_verificado", "tipo_dado": "automatico" if i.modo == "automatico" else "declarado",
                      "natureza": None, "validacao": "pendente", "fonte": None, "modo": i.modo,
                      "modo_rotulo": cat.MODOS[i.modo], "fonte_sugerida": i.fonte_sugerida,
                      "evidencia_esperada": i.evidencia_esperada, "justificativa": None})
    itens[0].update(classificacao="critico", natureza="hipotese", fonte="Atas", justificativa="Sem PMS")
    itens[1].update(classificacao="pendencia", natureza="comprovado", fonte="X", justificativa="Y",
                    validacao="confirmado", tipo_dado="validado", vazio_assistencial=True)
    painel = {"diagnostico": {"rotulo": "Exercício 2026", "situacao": "em_elaboracao", "responsavel_tecnico": None},
              "totais": {"critico": 1, "pendencia": 1, "nao_verificado": len(itens) - 2},
              "total_itens": len(itens), "por_tipo_dado": {"automatico": 8, "declarado": 30, "validado": 1},
              "por_area": [{"area": a, "nome": n, "totais": {}} for a, n in cat.AREAS.items()], "evolucao": None}
    blocos = rel.montar({"nome": "Apuí", "uf": "AM", "ibge": "1300144"}, painel, itens, [], "teste")
    assert [b.titulo for b in blocos] == list(rel.SECOES) and len(blocos) == 12
    problemas = blocos[5]
    assert any("Hipóteses" in p for p in problemas.paragrafos) and any("comprovados" in p for p in problemas.paragrafos)
    assert len(blocos[6].tabelas[0][1]) == len(itens) - 2          # pendências de verificação
    assert blocos[7].tabelas and blocos[7].tabelas[0][1][0][0].startswith(itens[1]["codigo"])   # vazio assistencial
    assert any("sem ação" in p for p in blocos[8].paragrafos)      # problema validado sem ação
    assert rel.pdf(blocos, "Teste").startswith(b"%PDF")


async def test_falha_de_uma_fonte_nao_desfaz_as_outras(ambiente, siops_simulado, monkeypatch):
    c, S, ids = ambiente["client"], ambiente["Session"], ambiente["ids"]
    await _siaps_apui(S, ids["apui"])

    async def quebra(db, ctx):
        raise ConnectionResetError("fonte fora do ar")
    monkeypatch.setitem(f.COLETORES, "G01", quebra)       # G01 roda depois de B01
    tok = await _token(c, "gestor.apui@teste.gov.br")
    did = (await c.post(f"{URL}/diagnosticos", headers=_h(tok),
                        json={"exercicio": 2026, "periodo_tipo": "quadrimestre", "periodo": 1})).json()["id"]
    it = _por_codigo((await c.get(f"{URL}/diagnosticos/{did}", headers=_h(tok))).json())
    assert it["B01"]["classificacao"] == "pendencia"
    assert it["G01"]["classificacao"] == "nao_verificado" and "ConnectionResetError" in it["G01"]["justificativa"]
