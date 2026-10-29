"""Painel InvestSUS: canceladas e rejeitadas ficam fora dos totais; saldo a receber por modalidade."""
from routers.auth import UserOut


def _usuario(mid):
    return UserOut(username="teste", nome="Teste", role="gestor", municipio_id=mid, municipio_ibge="1300144")


async def test_canceladas_e_rejeitadas_nao_entram_nos_totais(db_session, municipio):
    from models.investsus import PropostaInvestSUS, SituacaoNormalizada as S
    from routers import investsus as rt

    def prop(num, mod, sit, indicado, aprovado, pago):
        db_session.add(PropostaInvestSUS(municipio_id=municipio.id, numero_proposta=num, exercicio=2026,
                                         modalidade=mod, situacao_normalizada=sit, valor_indicado=indicado,
                                         valor_aprovado=aprovado, valor_pago=pago))

    prop("PAGA", "rp6", S.PARCIALMENTE_PAGA, 1000.0, 1000.0, 400.0)
    prop("ANALISE", "rp7", S.EM_ANALISE, 500.0, 0.0, 0.0)
    prop("CANC", "rp6", S.CANCELADA, 9000.0, 0.0, 0.0)
    prop("REJ", "rp8", S.REJEITADA, 3000.0, 0.0, 0.0)
    await db_session.commit()

    d = await rt.dashboard(db_session, _usuario(municipio.id), None, None, None)

    assert d["total_propostas"] == 2
    assert d["total_indicado"] == 1500.0
    assert d["saldo_a_receber"] == 600.0 + 500.0           # aprovado − pago; sem aprovação, indicado − pago
    assert d["desconsideradas"]["qtd"] == 2
    assert d["desconsideradas"]["valor_indicado"] == 12000.0
    assert {f["fase"] for f in d["por_fase"]}.isdisjoint({"cancelada", "rejeitada"})
    assert {s["situacao"] for s in d["por_situacao"]} == {"parcialmente_paga", "em_analise"}

    rp6 = next(m for m in d["por_modalidade"] if m["modalidade"] == "rp6")
    assert rp6["qtd"] == 1 and rp6["saldo_a_receber"] == 600.0
    rp8 = next(m for m in d["por_modalidade"] if m["modalidade"] == "rp8")
    assert rp8["qtd"] == 0
