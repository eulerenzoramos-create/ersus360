"""Monitoramento CNES — retrato por competência pela API pública do CNES.

Respostas no formato real dos serviços do portal (conferido em 26/11/2026 com a UBS Anizio, Apuí/AM);
nomes e CNS fictícios. Internet não é usada: o coletor recebe uma função de busca simulada.
"""
from __future__ import annotations

import json

import pytest

from services import cnes_publico as cp
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)

CNS_MED, CNS_ENF, CNS_PSI, CNS_TEC = "700000000000011", "700000000000012", "700000000000013", "700000000000014"


def _api(ibge6="130014", ch_enf=40, com_tec=True, falha=None):
    """Simula o CNES: 2 UBS; eSF na UBS 1; eMulti apoiando as duas UBS; enfermeira com vínculo no hospital."""
    u1, u2, hosp = f"{ibge6}0000001", f"{ibge6}0000002", f"{ibge6}0000003"
    esf = {"tpEquipe": "70", "dsEquipe": "ESF - EQUIPE DE SAUDE DA FAMILIA", "coEquipe": "0000000101",
           "nomeEquipe": "EQUIPE TESTE", "seqEquipe": "101", "coArea": "0001", "dsArea": "AREA TESTE",
           "ribeirinha": "2", "quilombola": "2", "dtAtivacao": "01/07/2014", "dtDesativacao": None}
    emulti = {"tpEquipe": "72", "dsEquipe": "EMULTI - EQUIPE MULTIPROFISSIONAL NA AT. PRIMARIA A SAUDE",
              "coEquipe": "0000000202", "nomeEquipe": "EMULTI TESTE", "seqEquipe": "202", "coArea": "0000",
              "dsArea": "NAO SE APLICA", "dtAtivacao": "06/05/2024", "dtDesativacao": None}

    def pe(cns, nome, cbo, ch):
        return {"cbo": cbo, "dsCbo": "X", "chOutros": 0, "chAmb": ch, "chHosp": 0, "noProfissional": nome,
                "cns": cns, "stEquipeMinima": "1", "dtEntrada": "03/06/2024", "dtDesligamento": None}

    def pl(cns, nome, cbo, amb, hosp=0):
        return {"tpSusNaoSus": "S", "cbo": cbo, "dsCbo": "X", "chOutros": 0, "chAmb": amb, "chHosp": hosp,
                "vinculacao": "VINCULO EMPREGATICIO", "vinculo": "ESTATUTARIO", "subVinculo": "PROPRIO",
                "nome": nome, "cns": cns}

    esf_profs = [pe(CNS_MED, "MEDICA FICTICIA", "225142", 40), pe(CNS_ENF, "ENFERMEIRA FICTICIA", "223565", ch_enf)]
    if com_tec:
        esf_profs.append(pe(CNS_TEC, "TECNICA FICTICIA", "322245", 40))
    rotas = {
        "/services/competencias": [{"nuComp": "202610"}, {"nuComp": "202609"}],
        f"/services/estabelecimentos?municipio={ibge6}": [
            {"id": u1, "cnes": "0000001", "noFantasia": "UBS UM", "gestao": "M", "atendeSus": "S"},
            {"id": u2, "cnes": "0000002", "noFantasia": "UBS DOIS", "gestao": "M", "atendeSus": "S"},
            {"id": hosp, "cnes": "0000003", "noFantasia": "HOSPITAL", "gestao": "M", "atendeSus": "S"}],
        f"/services/estabelecimentos-equipes/{u1}": [esf, emulti],
        f"/services/estabelecimentos-equipes/{u2}": [emulti],
        f"/services/estabelecimentos-equipes/{hosp}": [],
        f"/services/estabelecimentos-equipes/profissionais/{u1}?coMun={ibge6}&coArea=0001&coEquipe=101": esf_profs,
        f"/services/estabelecimentos-equipes/profissionais/{u1}?coMun={ibge6}&coArea=0000&coEquipe=202":
            [pe(CNS_PSI, "PSICOLOGA FICTICIA", "251510", 20)],
        f"/services/estabelecimentos-equipes/profissionais/{u2}?coMun={ibge6}&coArea=0000&coEquipe=202":
            [pe(CNS_PSI, "PSICOLOGA FICTICIA", "251510", 20)],
        f"/services/estabelecimentos-profissionais/{u1}": [pl(CNS_MED, "MEDICA FICTICIA", "225142", 40),
                                                           pl(CNS_ENF, "ENFERMEIRA FICTICIA", "223565", ch_enf),
                                                           pl(CNS_PSI, "PSICOLOGA FICTICIA", "251510", 20)],
        f"/services/estabelecimentos-profissionais/{u2}": [pl(CNS_PSI, "PSICOLOGA FICTICIA", "251510", 20)],
        f"/services/estabelecimentos-profissionais/{hosp}": [pl(CNS_ENF, "ENFERMEIRA FICTICIA", "223505", 0, 24)],
    }

    async def buscar(caminho):
        if falha and falha in caminho:
            raise RuntimeError("HTTP 503")
        return rotas.get(caminho)
    return buscar


async def test_coleta_monta_equipes_profissionais_e_vinculos():
    r = await cp.coletar("1300144", _api())
    assert r["competencia"] == "202610" and r["erros"] == []
    eq = {e["ine"]: e for e in r["equipes"]}
    assert set(eq) == {"0000000101", "0000000202"}
    esf, emulti = eq["0000000101"], eq["0000000202"]
    assert esf["sigla"] == "ESF" and emulti["sigla"] == "EMULTI"
    assert esf["n_profissionais"] == 3 and esf["ch_total"] == 120
    assert [e["cnes"] for e in emulti["estabelecimentos"]] == ["0000001", "0000002"]   # apoia 2 UBS
    enf = next(p for p in esf["profissionais"] if p["cbo"] == "223565")
    pessoa = r["pessoas"][enf["chave"]]
    assert pessoa["n_estabelecimentos"] == 2 and pessoa["ch_total"] == 64          # 40h UBS + 24h hospital
    t = cp.totais(r)
    assert t["equipes_ativas"] == 2 and t["equipes_por_tipo"] == {"ESF": 1, "EMULTI": 1}
    assert t["profissionais_em_equipes"] == 4


async def test_cns_nao_e_guardado():
    r = await cp.coletar("1300144", _api())
    bruto = json.dumps(r)
    for cns in (CNS_MED, CNS_ENF, CNS_PSI, CNS_TEC):
        assert cns not in bruto
    assert cp.chave_pessoa(CNS_MED) == cp.chave_pessoa(CNS_MED) != cp.chave_pessoa(CNS_ENF)


async def test_coleta_parcial_e_indisponivel():
    r = await cp.coletar("1300144", _api(falha="estabelecimentos-profissionais/1300140000002"))
    assert len(r["erros"]) == 1 and len(r["equipes"]) == 2
    with pytest.raises(cp.CnesIndisponivel):
        await cp.coletar("1300144", _api(falha="/services/estabelecimentos?municipio"))


async def test_compara_alteracoes_cadastrais():
    antes = await cp.coletar("1300144", _api())
    depois = await cp.coletar("1300144", _api(ch_enf=30, com_tec=False))
    tipos = sorted(m["tipo"] for m in cp.comparar(depois, antes)["itens"])
    assert tipos == ["carga_horaria_alterada", "profissional_saiu"]
    assert cp.comparar(antes, None) is None


@pytest.fixture
def cnes_simulado(monkeypatch):
    estado = {"ch_enf": 40, "com_tec": True}
    original = cp.coletar

    async def coletar(ibge, buscar=None):
        return await original(ibge, _api(str(ibge)[:6], **estado))
    monkeypatch.setattr(cp, "coletar", coletar)
    return estado


async def test_rotas_isoladas_por_municipio(ambiente, cnes_simulado):
    c, S = ambiente["client"], ambiente["Session"]
    tok_a = await _token(c, "gestor.apui@teste.gov.br")
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/scnes-conformidade/retrato", headers=_h(tok_a))).json()["situacao_dado"] == "sem_coleta"

    r = await c.post("/api/scnes-conformidade/retrato/coletar", headers=_h(tok_a))
    assert r.status_code == 200, r.text
    assert r.json()["competencia"] == "202610"
    assert len(await _auditoria(S, "CNES_RETRATO_COLETADO")) == 1

    d = (await c.get("/api/scnes-conformidade/retrato", headers=_h(tok_a))).json()
    assert d["situacao_dado"] == "oficial" and d["competencia_rotulo"] == "10/2026"
    assert {e["ine"] for e in d["equipes"]} == {"0000000101", "0000000202"}
    assert "profissionais" not in d["equipes"][0]

    det = (await c.get("/api/scnes-conformidade/retrato/equipes/0000000101", headers=_h(tok_a))).json()
    enf = next(p for p in det["profissionais"] if p["cbo"] == "223565")
    assert enf["outras_lotacoes"][0]["estabelecimento"] == "HOSPITAL" and enf["ch_total_municipio"] == 64
    assert "chave" not in enf and "cns" not in enf

    # Município B não vê o retrato de Apuí, e pode coletar o próprio (módulo não é exclusivo de Apuí)
    assert (await c.get("/api/scnes-conformidade/retrato", headers=_h(tok_b))).json()["situacao_dado"] == "sem_coleta"
    assert (await c.get("/api/scnes-conformidade/retratos", headers=_h(tok_b))).json() == []
    assert (await c.get("/api/scnes-conformidade/retrato/equipes/0000000101",
                        headers=_h(tok_b))).status_code == 404
    assert (await c.post("/api/scnes-conformidade/retrato/coletar", headers=_h(tok_b))).status_code == 200
    assert (await c.get("/api/scnes-conformidade/resumo", headers=_h(tok_b))).json()["equipes_esf"]["total"] == 1


async def test_mesma_competencia_substitui_e_registra_alteracoes(ambiente, cnes_simulado):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await c.post("/api/scnes-conformidade/retrato/coletar", headers=_h(tok))
    cnes_simulado.update(ch_enf=30, com_tec=False)
    await c.post("/api/scnes-conformidade/sincronizar", headers=_h(tok))
    hist = (await c.get("/api/scnes-conformidade/retratos", headers=_h(tok))).json()
    assert len(hist) == 1 and hist[0]["alteracoes"] == 2
    al = (await c.get("/api/scnes-conformidade/alertas-cnes", headers=_h(tok))).json()
    assert al["medios"] == 2


async def test_perfil_consulta_nao_coleta(ambiente, cnes_simulado):
    c = ambiente["client"]
    tok = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/scnes-conformidade/retrato/coletar", headers=_h(tok))).status_code == 403
    assert (await c.get("/api/scnes-conformidade/sincronizacao", headers=_h(tok))).json()["situacao_dado"] == "sem_coleta"
