"""InvestSUS — filtro por tipo de recurso (PAP, MAC, Programa, coletivas, RP 6/7/8, programa/outros).
Classificação só pela modalidade RP e pelo componente/tipo oficial gravados — nunca pelo objeto.
Vale para o painel, a lista, o relatório de acompanhamento e os relatórios da execução."""
import pytest
from fastapi import HTTPException


def _u(mid):
    from routers.auth import UserOut
    return UserOut(username="auditor", nome="Euler Ramos", role="auditoria", municipio_id=mid, municipio="Apuí",
                   municipio_ibge="1300144", municipio_uf="AM")


async def _cenario(db, municipio):
    from models.investsus import PropostaInvestSUS, SituacaoNormalizada
    from models.municipio import Municipio

    outro = Municipio(nome="Outro", uf="AM", codigo_ibge="1300000")
    db.add(outro)
    await db.flush()
    em = SituacaoNormalizada.EM_ANALISE

    def prop(num, mod, mid=municipio.id, **kw):
        return PropostaInvestSUS(municipio_id=mid, numero_proposta=num, exercicio=2026, modalidade=mod,
                                 valor_indicado=100, situacao_normalizada=em, **kw)

    db.add_all([
        prop("RP6", "rp6", componente="MAC"),
        prop("RP7", "rp7"),
        prop("RP8", "rp8"),
        prop("PROG-MAC", "programa", payload_original={"tipo_raw": "CUSTEIO DA MÉDIA E ALTA COMPLEXIDADE"}),
        prop("PROG-PAP", "programa", componente="PAP"),
        # texto livre que só menciona atenção primária: não é o nome oficial do programa, não vira PAP
        prop("PROG-SEM", "programa", objeto="Aquisição de insumos para a atenção primária"),
        # nome oficial exato do programa publicado pelo InvestSUS (gravado em objeto/ação): classifica
        prop("PROG-NOME-PAP", "programa", objeto="CUSTEIO DA ATENÇÃO PRIMÁRIA À SAÚDE"),
        prop("PROG-NOME-MAC", "programa", acao_orcamentaria="Custeio da Média e Alta Complexidade à Saúde"),
        prop("CLASSIF", "a_classificar"),
        prop("ALHEIA", "programa", mid=outro.id, componente="PAP"),
    ])
    await db.commit()


ESPERADO = {
    "pap": {"PROG-PAP", "PROG-NOME-PAP"},
    "mac": {"RP6", "PROG-MAC", "PROG-NOME-MAC"},
    "programa": {"PROG-MAC", "PROG-PAP", "PROG-SEM", "PROG-NOME-PAP", "PROG-NOME-MAC"},
    "coletivas": {"RP7", "RP8"},
    "rp6": {"RP6"},
    "rp7": {"RP7"},
    "rp8": {"RP8"},
    "programa_outros": {"PROG-MAC", "PROG-PAP", "PROG-SEM", "PROG-NOME-PAP", "PROG-NOME-MAC", "CLASSIF"},
}


@pytest.mark.parametrize("chave", list(ESPERADO))
async def test_lista_painel_e_acompanhamento(db_session, municipio, chave):
    from routers import investsus as r
    await _cenario(db_session, municipio)
    u = _u(municipio.id)
    lista = await r.listar_propostas(db_session, u, None, None, None, None, None, 1, 200, chave)
    assert {p["numero_proposta"] for p in lista["propostas"]} == ESPERADO[chave] and lista["total"] == len(ESPERADO[chave])
    painel = await r.dashboard(db_session, u, None, None, None, chave)
    assert painel["total_propostas"] == len(ESPERADO[chave])
    assert painel["total_indicado"] == 100 * len(ESPERADO[chave])
    rel = await r.relatorio_acompanhamento(db_session, u, None, None, None, None, chave)
    assert {ln["numero_proposta"] for ln in rel["linhas"]} == ESPERADO[chave]


async def test_sem_filtro_e_paginacao(db_session, municipio):
    from routers import investsus as r
    await _cenario(db_session, municipio)
    u = _u(municipio.id)
    tudo = await r.listar_propostas(db_session, u, None, None, None, None, None, 1, 200, None)
    assert tudo["total"] == 9                                   # nada de outro município
    pag = await r.listar_propostas(db_session, u, None, None, None, None, None, 2, 2, "programa_outros")
    assert pag["total"] == 6 and len(pag["propostas"]) == 2


async def test_tipo_invalido_e_relatorios_da_execucao(db_session, municipio):
    from routers import investsus as r
    from routers import investsus_execucao as rt
    await _cenario(db_session, municipio)
    u = _u(municipio.id)
    with pytest.raises(HTTPException) as e:
        await r.listar_propostas(db_session, u, None, None, None, None, None, 1, 50, "estadual")
    assert e.value.status_code == 422
    painel = await rt.painel(db_session, u, None, None, None, None, None, None, None, "mac")
    assert {p["numero_proposta"] for p in painel["propostas"]} == {"RP6", "PROG-MAC", "PROG-NOME-MAC"}
    assert painel["filtros"]["tipo_recurso"] == "mac"
    resp = await rt.relatorio("consolidado", db_session, u, "xlsx", None, None, None, None, "pap")
    from io import BytesIO

    from openpyxl import load_workbook
    vals = [c for row in load_workbook(BytesIO(resp.body)).active.iter_rows(values_only=True) for c in row if c]
    assert "PROG-PAP" in vals and "PROG-NOME-PAP" in vals and "PROG-MAC" not in vals and "PROG-SEM" not in vals
    assert any("PAP — pelo programa oficial" == v for v in vals) and any("PAP — pelo componente oficial" == v for v in vals)
    assert any("Tipo de recurso: PAP" in str(v) for v in vals)
    resp = await r.exportar_relatorio_acompanhamento(db_session, u, "pdf", None, None, None, None, "coletivas")
    assert resp.body[:4] == b"%PDF"


async def test_origem_da_classificacao_no_acompanhamento(db_session, municipio):
    from routers import investsus as r
    await _cenario(db_session, municipio)
    d = await r.relatorio_acompanhamento(db_session, _u(municipio.id), None, None, None, None, None)
    ln = {x["numero_proposta"]: x for x in d["linhas"]}
    assert (ln["PROG-NOME-PAP"]["tipo"], ln["PROG-NOME-PAP"]["tipo_origem"]) == ("PAP", "pelo programa oficial")
    assert (ln["PROG-NOME-MAC"]["tipo"], ln["PROG-NOME-MAC"]["tipo_origem"]) == ("MAC", "pelo programa oficial")
    assert (ln["PROG-PAP"]["tipo"], ln["PROG-PAP"]["tipo_origem"]) == ("PAP", "pelo componente oficial")
    assert (ln["PROG-MAC"]["tipo"], ln["PROG-MAC"]["tipo_origem"]) == ("MAC", "pelo tipo oficial do InvestSUS")
    assert (ln["PROG-SEM"]["tipo"], ln["PROG-SEM"]["tipo_origem"]) == ("Programa MS", "pela modalidade oficial")
    assert (ln["CLASSIF"]["tipo"], ln["CLASSIF"]["tipo_origem"]) == ("Dados não disponíveis", None)
