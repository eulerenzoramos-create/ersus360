"""INVESTSUS 360 — sincronização federal: movimentações, alertas, escopo e campos internos."""
from datetime import date, timedelta

from sqlalchemy import select

from models.alerta import Alerta
from models.investsus import (
    AlertaInvestSUS, HistoricoSituacao, Parecer, PropostaInvestSUS, SituacaoNormalizada,
)
from routers.investsus import aplicar_propostas_federais, verificar_prazos_diligencia


def _item(numero="36000820396202600", situacao="Cadastrada", **extra):
    base = {
        "numero_proposta": numero,
        "objeto": "INCREMENTO MAC",
        "modalidade": "rp7",
        "esfera": "federal",
        "valor_global": 500000.0,
        "valor_aprovado": 500000.0,
        "situacao_raw": situacao,
        "exercicio": 2026,
        "cnpj_proponente": "12834320000126",
        "fonte": "investsus",
    }
    base.update(extra)
    return base


def _dados(*itens):
    return {"propostas": list(itens), "sincronizado_em": "2026-10-15T12:00:00Z"}


async def _proposta(db, numero="36000820396202600"):
    return (await db.execute(select(PropostaInvestSUS).where(
        PropostaInvestSUS.numero_proposta == numero))).scalar_one()


async def _alertas(db, prop_id):
    return (await db.execute(select(AlertaInvestSUS).where(
        AlertaInvestSUS.proposta_id == prop_id).order_by(AlertaInvestSUS.id))).scalars().all()


async def _historico(db, prop_id):
    return (await db.execute(select(HistoricoSituacao).where(
        HistoricoSituacao.proposta_id == prop_id).order_by(HistoricoSituacao.id))).scalars().all()


async def test_nova_proposta_federal_registra_modalidade_historico_e_alerta(db_session, municipio):
    cont = await aplicar_propostas_federais(_dados(_item()), municipio.id, db_session, origem="teste")
    assert cont["criadas"] == 1 and cont["alertas"] == 1

    p = await _proposta(db_session)
    assert p.esfera == "federal" and p.modalidade == "rp7"
    assert p.tipo_emenda.value == "bancada"
    assert p.situacao_original == "Cadastrada"
    assert p.situacao_normalizada == SituacaoNormalizada.PROPOSTA_CADASTRADA
    assert p.entidade_cnpj == "12.834.320/0001-26"
    assert [a.tipo_alerta for a in await _alertas(db_session, p.id)] == ["nova_proposta"]
    assert len(await _historico(db_session, p.id)) == 1


async def test_mudanca_para_diligencia_gera_movimentacao_e_alerta_urgente(db_session, municipio):
    await aplicar_propostas_federais(_dados(_item()), municipio.id, db_session, origem="teste")
    cont = await aplicar_propostas_federais(_dados(_item(situacao="Em Diligência")),
                                            municipio.id, db_session, origem="teste")
    assert cont["movimentacoes"] == 1 and cont["alertas"] == 1

    p = await _proposta(db_session)
    hist = await _historico(db_session, p.id)
    assert hist[-1].situacao_anterior == "Cadastrada" and hist[-1].situacao_nova == "Em Diligência"
    alerta = (await _alertas(db_session, p.id))[-1]
    assert alerta.tipo_alerta == "mudanca_fase_em_diligencia" and alerta.nivel.value == "urgente"
    # urgentes também vão para a central de Alertas do ERSUS360
    gerais = (await db_session.execute(select(Alerta).where(Alerta.modulo == "InvestSUS"))).scalars().all()
    assert len(gerais) == 1


async def test_mesma_situacao_nao_duplica_historico_nem_alerta(db_session, municipio):
    await aplicar_propostas_federais(_dados(_item(situacao="Em análise")), municipio.id, db_session, origem="teste")
    cont = await aplicar_propostas_federais(_dados(_item(situacao="EM ANÁLISE")), municipio.id, db_session, origem="teste")
    assert cont["movimentacoes"] == 0 and cont["alertas"] == 0
    p = await _proposta(db_session)
    assert len(await _historico(db_session, p.id)) == 1


async def test_aguardando_pagamento_nao_lanca_valor_como_pago(db_session, municipio):
    await aplicar_propostas_federais(_dados(_item(situacao="Aguardando Pagamento")),
                                     municipio.id, db_session, origem="teste")
    p = await _proposta(db_session)
    assert p.situacao_normalizada == SituacaoNormalizada.AGUARDANDO_PAGAMENTO
    assert p.valor_pago == 0


async def test_paga_lanca_valor_integral(db_session, municipio):
    await aplicar_propostas_federais(_dados(_item(situacao="Paga")), municipio.id, db_session, origem="teste")
    p = await _proposta(db_session)
    assert p.valor_pago == 500000.0


async def test_item_estadual_nao_e_captado(db_session, municipio):
    cont = await aplicar_propostas_federais(_dados(_item(numero="EST-1", esfera="estadual")),
                                            municipio.id, db_session, origem="teste")
    assert cont["criadas"] == 0 and cont["fora_escopo"] == 1
    assert (await db_session.execute(select(PropostaInvestSUS))).first() is None


async def test_sincronizacao_preserva_informacoes_internas(db_session, municipio):
    await aplicar_propostas_federais(_dados(_item(modalidade="a_classificar")),
                                     municipio.id, db_session, origem="teste")
    p = await _proposta(db_session)
    p.modalidade = "rp8"                       # classificação feita pelo técnico
    p.observacoes_internas = "Aguardar ofício do autor"
    p.prioridade = "alta"
    p.responsavel_interno = "Técnica do FMS"
    await db_session.commit()

    # a fonte continua sem informar o tipo da emenda
    await aplicar_propostas_federais(_dados(_item(modalidade="a_classificar", situacao="Em análise")),
                                     municipio.id, db_session, origem="teste")
    p = await _proposta(db_session)
    assert p.modalidade == "rp8"
    assert p.observacoes_internas == "Aguardar ofício do autor"
    assert p.prioridade == "alta" and p.responsavel_interno == "Técnica do FMS"
    assert p.situacao_original == "Em análise"


async def test_dado_oficial_de_modalidade_prevalece(db_session, municipio):
    await aplicar_propostas_federais(_dados(_item(modalidade="a_classificar")), municipio.id, db_session, origem="teste")
    await aplicar_propostas_federais(_dados(_item(modalidade="rp6")), municipio.id, db_session, origem="teste")
    p = await _proposta(db_session)
    assert p.modalidade == "rp6" and p.tipo_emenda.value == "individual"


async def test_prazo_de_diligencia_alerta_e_escala(db_session, municipio):
    await aplicar_propostas_federais(_dados(_item(situacao="Em diligência")), municipio.id, db_session, origem="teste")
    p = await _proposta(db_session)
    hoje = date(2026, 10, 15)
    db_session.add(Parecer(proposta_id=p.id, eh_diligencia=True, sigla_area="SAES",
                           prazo_resposta=hoje + timedelta(days=2)))
    await db_session.commit()

    assert await verificar_prazos_diligencia(db_session, municipio.id, hoje=hoje) == 1
    prazo = [a for a in await _alertas(db_session, p.id) if a.tipo_alerta == "prazo_diligencia"]
    assert len(prazo) == 1 and prazo[0].nivel.value == "urgente"

    # mesmo dia: não duplica
    assert await verificar_prazos_diligencia(db_session, municipio.id, hoje=hoje) == 0
    # prazo vencido: o mesmo alerta escala para crítico
    assert await verificar_prazos_diligencia(db_session, municipio.id, hoje=hoje + timedelta(days=3)) == 1
    prazo = [a for a in await _alertas(db_session, p.id) if a.tipo_alerta == "prazo_diligencia"]
    assert len(prazo) == 1 and prazo[0].nivel.value == "critico"


async def test_diligencia_respondida_nao_gera_alerta_de_prazo(db_session, municipio):
    await aplicar_propostas_federais(_dados(_item(situacao="Em diligência")), municipio.id, db_session, origem="teste")
    p = await _proposta(db_session)
    hoje = date(2026, 10, 15)
    db_session.add(Parecer(proposta_id=p.id, eh_diligencia=True, prazo_resposta=hoje,
                           data_resposta=hoje - timedelta(days=1)))
    await db_session.commit()
    assert await verificar_prazos_diligencia(db_session, municipio.id, hoje=hoje) == 0
