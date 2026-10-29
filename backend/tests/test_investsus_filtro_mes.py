"""Painel InvestSUS filtrado por ano (exercício) e mês do repasse do FNS."""
from datetime import date

import pytest
from fastapi import HTTPException


def _usuario(mid):
    from routers.auth import UserOut
    return UserOut(username="teste", nome="Teste", role="gestor", municipio_id=mid, municipio_ibge="1300144")


async def _cenario(db, municipio):
    from models.investsus import PagamentoInvestSUS, PropostaInvestSUS, SituacaoNormalizada
    from models.municipio import Municipio

    outro = Municipio(nome="Outro", uf="AM", codigo_ibge="1300000")
    db.add(outro)
    await db.flush()

    def prop(mid, num, exercicio, indicado, pago):
        p = PropostaInvestSUS(municipio_id=mid, numero_proposta=num, exercicio=exercicio, modalidade="rp6",
                              valor_indicado=indicado, valor_aprovado=indicado, valor_pago=pago,
                              situacao_normalizada=SituacaoNormalizada.TOTALMENTE_PAGA)
        db.add(p)
        return p

    a = prop(municipio.id, "A", 2026, 1000.0, 1000.0)      # duas parcelas: jun e jul/2026
    b = prop(municipio.id, "B", 2025, 500.0, 500.0)        # exercício 2025 pago em jun/2026
    c = prop(municipio.id, "C", 2026, 300.0, 300.0)        # pago, mas sem repasse com data
    d = prop(municipio.id, "D", 2026, 700.0, 0.0)          # ainda não pago
    x = prop(outro.id, "X", 2026, 9999.0, 9999.0)          # outro município, mesmo mês
    await db.flush()
    db.add_all([
        PagamentoInvestSUS(proposta_id=a.id, data_pagamento=date(2026, 6, 29), valor=600.0),
        PagamentoInvestSUS(proposta_id=a.id, data_pagamento=date(2026, 7, 10), valor=400.0),
        PagamentoInvestSUS(proposta_id=b.id, data_pagamento=date(2026, 6, 1), valor=500.0),
        PagamentoInvestSUS(proposta_id=x.id, data_pagamento=date(2026, 6, 15), valor=9999.0),
    ])
    await db.commit()
    return a, b, c, d


async def test_sem_filtro_e_por_exercicio_continuam_como_antes(db_session, municipio):
    from routers import investsus as rt
    await _cenario(db_session, municipio)
    u = _usuario(municipio.id)

    tudo = await rt.dashboard(db_session, u, None, None, None)
    assert tudo["total_propostas"] == 4 and tudo["total_pago"] == 1800.0
    assert tudo["anos_disponiveis"] == [2026, 2025]

    ano = await rt.dashboard(db_session, u, 2026, None, None)
    assert ano["total_propostas"] == 3 and ano["total_indicado"] == 2000.0
    assert ano["filtro"]["criterio"] == "exercicio"


async def test_mes_usa_a_data_do_repasse_e_soma_so_o_pago_no_mes(db_session, municipio):
    from routers import investsus as rt
    await _cenario(db_session, municipio)
    u = _usuario(municipio.id)

    jun = await rt.dashboard(db_session, u, 2026, None, 6)
    assert jun["total_propostas"] == 2                   # A (2026) e B (exercício 2025); X é de outro município
    assert jun["total_pago"] == 1100.0                   # 600 de A + 500 de B, não o pago acumulado
    assert jun["total_indicado"] == 1500.0
    assert jun["saldo_executar"] == 1500.0               # saldo usa o pago acumulado das propostas
    assert jun["filtro"] == {"ano": 2026, "mes": 6, "criterio": "pagamento", "sem_data_pagamento": 1}

    jul = await rt.dashboard(db_session, u, 2026, None, 7)
    assert jul["total_propostas"] == 1 and jul["total_pago"] == 400.0

    dez = await rt.dashboard(db_session, u, 2026, None, 12)
    assert dez["total_propostas"] == 0 and dez["total_pago"] == 0


async def test_mes_sem_ano_e_recusado(db_session, municipio):
    from routers import investsus as rt
    with pytest.raises(HTTPException) as exc:
        await rt.dashboard(db_session, _usuario(municipio.id), None, None, 6)
    assert exc.value.status_code == 422
