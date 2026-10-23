"""Mês sincronizado pelo detalhe-pagamento precisa cair nas mesmas linhas da Matriz FNS que o detalhe-acao.

Setembro/2026 veio por essa fonte e aparecia com ✓ e R$ 0,00 na Atenção Primária: o normalizador punha a
descrição do programa em bloco, grupo, ação e componente, e os pagamentos viravam linhas soltas.
"""
from __future__ import annotations

from decimal import Decimal

import services.fns_transferencias as fns
from models.transferencia_fns import ColetaFns, TransferenciaFns

BLOCO = "Manutenção das Ações e Serviços Públicos de Saúde"
ESF = "INCENTIVO FINANCEIRO DA APS - EQUIPES DE SAÚDE DA FAMÍLIA/ESF E EQUIPES DE ATENÇÃO PRIMÁRIA/EAP"
PISO = "PISO DE ATENÇÃO PRIMÁRIA À SAÚDE"


def _pagamento(desc: str, valor: float) -> dict:
    """Item como o consultafns devolve em /consulta-detalhada/detalhe-pagamento (conferido em 23/10/2026)."""
    return {"id": {"programaFundo": {"descricao": desc}, "processoFormatado": "25000.123843/2026-51"},
            "nomeBloco": BLOCO, "nomeComponente": "ATENÇÃO PRIMÁRIA", "valorLiquido": valor,
            "valorTotal": valor, "valorDescontoTotal": 0, "numeroDocumentoSiafi": "069462",
            "dataCriacaoSiafi": "01/09/2026", "nuPortaria": 3493}


def _agosto(desc: str, valor: str) -> TransferenciaFns:
    vl = Decimal(valor)
    return TransferenciaFns(
        chave_unica=fns._chave(fns.IBGE_APUI_7, 2026, 8, BLOCO, "ATENÇÃO PRIMÁRIA", PISO, desc, str(vl)),
        municipio_ibge=fns.IBGE_APUI_7, exercicio=2026, mes=8, bloco=BLOCO, grupo="ATENÇÃO PRIMÁRIA",
        acao=PISO, acao_detalhada=desc, tipo_incentivo=fns.classificar_tipo(BLOCO, "ATENÇÃO PRIMÁRIA", PISO, desc),
        valor_liquido=vl, fonte="consultafns")


def test_normalizador_usa_bloco_e_grupo_reais():
    r = fns._normalizar_pagamento(_pagamento(ESF, 227826), 2026, 9, 1)
    assert (r["bloco"], r["grupo"], r["acao"], r["acao_detalhada"]) == (BLOCO, "ATENÇÃO PRIMÁRIA", "", ESF)
    assert r["tipo_incentivo"] == "Atenção Primária"


async def test_setembro_pelo_pagamento_cai_na_linha_da_atencao_primaria(db_session, monkeypatch):
    from routers import repasses_fns_apui as rota
    db_session.add_all([_agosto(ESF, "227826.00"),
                        ColetaFns(municipio_ibge=rota.IBGE_APUI, exercicio=2026, mes=8, competencia="08/2026",
                                  fonte="consultafns", sucesso=True, todas_paginas_ok=True)])
    await db_session.commit()

    async def vazio(exercicio, mes):
        return [], None, None

    async def pagamento(exercicio, mes):
        regs = [fns._normalizar_pagamento(_pagamento(ESF, 227826), exercicio, mes, 1),
                fns._normalizar_pagamento(_pagamento("PROGRAMA SEM HISTÓRICO", 10), exercicio, mes, 1)]
        return regs, Decimal("227836"), 2

    monkeypatch.setattr(fns, "_fetch_consultafns", vazio)            # detalhe-acao deu timeout
    monkeypatch.setattr(fns, "_fetch_detalhe_pagamento", pagamento)
    assert (await fns.coletar_transferencias(2026, 9, db_session))["sucesso"]

    r = await rota.matriz_tabela(exercicio=2026, mes_inicio=1, mes_fim=12, grupo=None, acao=None,
                                 componente=None, tipo_incentivo=None, busca=None, db=db_session)
    esf = [l for l in r["linhas"] if l["componente"] == ESF]
    assert len(esf) == 1                                              # antes: uma linha por fonte
    assert esf[0]["acao"] == PISO and esf[0]["grupo"] == "Atenção Primária"
    assert esf[0]["meses"]["8"]["valor"] == 227826 and esf[0]["meses"]["9"]["valor"] == 227826
    sem = [l for l in r["linhas"] if l["componente"] == "PROGRAMA SEM HISTÓRICO"]
    assert sem[0]["acao"] == ""                                       # ação nunca presumida
