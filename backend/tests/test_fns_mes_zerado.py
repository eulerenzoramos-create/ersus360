"""Sincronização FNS não pode zerar um mês (setembro/2026 ficou com R$ 0,00 e ✓ na Matriz FNS).

Antes, coletar_transferencias apagava os registros do mês ANTES de consultar o FNS: uma falha ou timeout
deixava o mês vazio. E a Matriz mostrava ✓ com base só na última coleta, mesmo sem registro gravado.
"""
from __future__ import annotations

from decimal import Decimal

import pytest
from sqlalchemy import func, select

import services.fns_transferencias as fns
from models.transferencia_fns import ColetaFns, TransferenciaFns


def _reg(mes: int, valor: str, desc: str = "INCENTIVO FINANCEIRO DA APS - ESF") -> dict:
    vl = Decimal(valor)
    return {
        "chave_unica": fns._chave(fns.IBGE_APUI_7, 2026, mes, "APS", "ATENÇÃO PRIMÁRIA", "PISO APS", desc, str(vl)),
        "municipio_ibge": fns.IBGE_APUI_7, "municipio_nome": "Apuí", "uf": "AM",
        "exercicio": 2026, "mes": mes, "competencia": f"{mes:02d}/2026",
        "bloco": "APS", "grupo": "ATENÇÃO PRIMÁRIA", "acao": "PISO APS", "acao_detalhada": desc,
        "valor_total": vl, "valor_desconto": Decimal("0"), "valor_liquido": vl, "fonte": "consultafns",
    }


@pytest.fixture
def fontes(monkeypatch):
    """Controla o que as três fontes do FNS devolvem."""
    estado = {"registros": [], "erro_ao_salvar": False}

    async def consulta(exercicio, mes):
        return list(estado["registros"]), None, len(estado["registros"]) or None

    async def vazio(exercicio, mes):
        return [], None, None

    monkeypatch.setattr(fns, "_fetch_consultafns", consulta)
    monkeypatch.setattr(fns, "_fetch_detalhe_pagamento", vazio)
    monkeypatch.setattr(fns, "_fetch_transparencia", vazio)

    original = fns._salvar_registros

    async def salvar(db, registros):
        if estado["erro_ao_salvar"]:
            raise RuntimeError("queda no meio da gravação")
        return await original(db, registros)

    monkeypatch.setattr(fns, "_salvar_registros", salvar)
    return estado


async def _qtd(db, mes: int) -> int:
    return (await db.execute(select(func.count()).select_from(TransferenciaFns).where(
        TransferenciaFns.exercicio == 2026, TransferenciaFns.mes == mes))).scalar_one()


async def test_fns_fora_do_ar_nao_apaga_o_mes(db_session, fontes):
    fontes["registros"] = [_reg(9, "227826.00"), _reg(9, "114159.00", "SAÚDE BUCAL")]
    assert (await fns.coletar_transferencias(2026, 9, db_session))["sucesso"]
    assert await _qtd(db_session, 9) == 2

    fontes["registros"] = []                        # FNS sem resposta na ressincronização
    r = await fns.coletar_transferencias(2026, 9, db_session)
    assert r["sucesso"] is False
    assert await _qtd(db_session, 9) == 2           # setembro continua com os pagamentos


async def test_ressincronizar_substitui_os_registros_do_mes(db_session, fontes):
    fontes["registros"] = [_reg(9, "227826.00")]
    await fns.coletar_transferencias(2026, 9, db_session)
    fontes["registros"] = [_reg(9, "227826.00"), _reg(9, "65585.00", "DEMAIS PROGRAMAS")]
    r = await fns.coletar_transferencias(2026, 9, db_session)
    assert r["sucesso"] and await _qtd(db_session, 9) == 2


async def test_queda_ao_gravar_desfaz_a_troca(db_session, fontes):
    fontes["registros"] = [_reg(9, "227826.00"), _reg(9, "114159.00", "SAÚDE BUCAL")]
    await fns.coletar_transferencias(2026, 9, db_session)
    fontes["registros"] = [_reg(9, "1.00")]
    fontes["erro_ao_salvar"] = True
    r = await fns.coletar_transferencias(2026, 9, db_session)
    assert r["sucesso"] is False
    assert await _qtd(db_session, 9) == 2           # a remoção não ficou gravada sozinha
    ultima = (await db_session.execute(select(ColetaFns).order_by(ColetaFns.id.desc()))).scalars().first()
    assert ultima.sucesso is False


async def test_matriz_marca_pendente_mes_coletado_sem_registros(db_session):
    from routers import repasses_fns_apui as rota
    db_session.add_all([
        ColetaFns(municipio_ibge=rota.IBGE_APUI, exercicio=2026, mes=8, competencia="08/2026",
                  fonte="consultafns", sucesso=True, todas_paginas_ok=True),
        ColetaFns(municipio_ibge=rota.IBGE_APUI, exercicio=2026, mes=9, competencia="09/2026",
                  fonte="consultafns", sucesso=True, todas_paginas_ok=True),
        TransferenciaFns(**_reg(8, "646591.75")),
    ])
    await db_session.commit()
    r = await rota.matriz_tabela(exercicio=2026, mes_inicio=1, mes_fim=12, grupo=None, acao=None,
                                 componente=None, tipo_incentivo=None, busca=None, db=db_session)
    assert r["meses_status"]["8"] == "ok"
    assert r["meses_status"]["9"] == "pendente"     # antes: "ok" (✓) com R$ 0,00


async def test_falha_informa_o_motivo_real(db_session, monkeypatch, fontes):
    async def consulta_com_503(exercicio, mes):
        fns._MOTIVO_CONSULTAFNS[f"{exercicio}/{mes}"] = "consultafns respondeu HTTP 503"
        return [], None, None

    monkeypatch.setattr(fns, "_fetch_consultafns", consulta_com_503)
    r = await fns.coletar_transferencias(2026, 9, db_session)
    assert r["sucesso"] is False and "HTTP 503" in r["mensagem_erro"]
