"""Monitoramento de Execução (InvestSUS): regra de cor da lista oficial, validação igual ao
formulário do InvestSUS, gravação da coleta, histórico, alertas e isolamento por município.
Números de proposta da tela real de Apuí (27/11/2026)."""
from datetime import date, datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from models.investsus import (
    AlertaInvestSUS, MonitoramentoInvestSUS, MonitoramentoRegistroInvestSUS, PropostaInvestSUS,
    SituacaoNormalizada,
)
from models.municipio import Municipio
from routers import investsus_monitoramento as rt
from services import investsus_monitoramento as mon

AGORA = datetime(2026, 11, 27, 12, 0)
HOJE = AGORA.date()


def _usuario(mid, role="admin"):
    from routers.auth import UserOut
    return UserOut(username="teste", nome="Teste", role=role, municipio_id=mid, municipio_ibge="1300144")


def _item(numero, co, st=None, dt=None, status_exec=None, tipo="INCREMENTO PAP", valor=500000.0):
    return {"numero": numero, "coProposta": co, "tipoRecurso": {"descricao": "EMENDA"},
            "tipoProposta": {"id": 414, "descricao": tipo}, "situacao": {"descricaoExterna": "Proposta Paga"},
            "descricaoInstrumento": "10433", "valor": valor, "stAtualizacao": st, "dtOperacao": dt,
            "statusExecucao": status_exec}


# ── Regras puras ──────────────────────────────────────────────────────────────

def test_status_segue_a_regra_de_cor_do_investsus():
    s = mon.status_monitoramento
    assert s("P", "T", None, AGORA) == mon.FINALIZADA          # T vence tudo
    assert s("A", None, None, AGORA) == mon.ATUALIZADA
    assert s("P", None, AGORA, AGORA) == mon.DESATUALIZADA
    assert s(None, None, None, AGORA) == mon.DESATUALIZADA     # sem data
    assert s(None, None, AGORA - timedelta(days=30), AGORA) == mon.ATUALIZADA
    assert s(None, None, AGORA - timedelta(days=31), AGORA) == mon.DESATUALIZADA


def test_prazos_avisam_vencimento_e_data_provavel_vencida():
    p = mon.prazos(mon.ATUALIZADA, AGORA - timedelta(days=25), date(2026, 11, 1), "PARCIAL", AGORA)
    assert p["vence_em_dias"] == 5 and p["a_vencer"] and p["data_provavel_vencida"]
    assert p["data_limite_atualizacao"] == "2026-12-02"
    assert not mon.prazos(mon.FINALIZADA, None, date(2026, 1, 1), "TOTAL", AGORA)["data_provavel_vencida"]


def test_datas_em_varios_formatos():
    assert mon.para_datetime("2026-11-20T10:00:00.000-03:00") == datetime(2026, 11, 20, 13, 0)
    assert mon.para_datetime("20/11/2026") == datetime(2026, 11, 20)
    assert mon.para_datetime(1763640000000).year == 2025
    assert mon.para_datetime("lixo") is None
    assert mon.exercicio_do_numero("36000746409202600") == 2026


@pytest.mark.parametrize("dados,erro", [
    ({}, "execução foi iniciada"),
    ({"execucao_iniciada": "N", "data_provavel_finalizacao": "2026-11-26"}, "hoje ou futura"),
    ({"execucao_iniciada": "S", "status_execucao": "PARCIAL", "data_provavel_finalizacao": "2026-12-31"}, "obrigatório"),
    ({"execucao_iniciada": "S", "status_execucao": "PARCIAL", "percentual_execucao": 0,
      "data_provavel_finalizacao": "2026-12-31"}, "entre 1 e 100"),
    ({"execucao_iniciada": "S", "status_execucao": "PARCIAL", "percentual_execucao": 101,
      "data_provavel_finalizacao": "2026-12-31"}, "entre 1 e 100"),
    ({"execucao_iniciada": "S", "status_execucao": "TOTAL", "data_finalizacao": "2026-11-28"}, "não pode ser futura"),
])
def test_validacao_igual_ao_formulario_oficial(dados, erro):
    with pytest.raises(ValueError, match=erro):
        mon.validar_registro(dados, HOJE)


def test_validacao_normaliza_total_parcial_e_nao_iniciada():
    t = mon.validar_registro({"execucao_iniciada": "S", "status_execucao": "TOTAL", "data_finalizacao": "2026-11-27",
                              "percentual_execucao": 40}, HOJE)
    assert t["percentual_execucao"] == 100.0 and t["data_provavel_finalizacao"] == HOJE
    p = mon.validar_registro({"execucao_iniciada": "S", "status_execucao": "PARCIAL", "percentual_execucao": "45,5",
                              "data_provavel_finalizacao": "2027-03-31"}, HOJE)
    assert p["percentual_execucao"] == 45.5
    n = mon.validar_registro({"execucao_iniciada": "N", "status_execucao": "PARCIAL", "percentual_execucao": 50,
                              "data_provavel_finalizacao": "2027-01-10"}, HOJE)
    assert n["status_execucao"] is None and n["percentual_execucao"] is None


# ── Gravação ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_coleta_grava_historico_alerta_e_encerra(db_session, municipio):
    prop = PropostaInvestSUS(municipio_id=municipio.id, numero_proposta="36000746409202600", exercicio=2026,
                             situacao_normalizada=SituacaoNormalizada.TOTALMENTE_PAGA, valor_pago=500000.0)
    db_session.add(prop)
    await db_session.commit()

    velho = (AGORA - timedelta(days=45)).isoformat()
    r = await rt.aplicar_coleta(db_session, municipio.id, {"anos": [2026], "itens": [
        {"item": _item("36000746409202600", 111, dt=velho), "monitoramento": None},
        {"item": _item("36000745925202600", 222, st="A", tipo="INCREMENTO MAC"),
         "monitoramento": {"execucaoIniciada": "S", "statusExecucao": "PARCIAL", "percentualExecucao": 60,
                           "dataProvavelFinalizacao": "2026-12-20"}},
    ]}, "Teste", AGORA)
    assert (r["lidas"], r["novas"], r["alertas"]) == (2, 2, 1)
    assert r["resumo"]["desatualizada"] == 1 and r["resumo"]["atualizada"] == 1

    regs = (await db_session.execute(select(MonitoramentoRegistroInvestSUS))).scalars().all()
    assert len(regs) == 1 and regs[0].origem == "investsus" and regs[0].percentual_execucao == 60

    # Município atualiza no InvestSUS → alerta encerra; sem mudança de formulário, sem novo histórico.
    r = await rt.aplicar_coleta(db_session, municipio.id, {"anos": [2026], "itens": [
        {"item": _item("36000746409202600", 111, st="A", dt=AGORA.isoformat()),
         "monitoramento": {"execucaoIniciada": "N", "dataProvavelFinalizacao": "2027-02-01"}},
        {"item": _item("36000745925202600", 222, st="A")},
    ]}, "Teste", AGORA)
    assert r["alertas_encerrados"] == 1 and r["alteradas"] == 1
    al = (await db_session.execute(select(AlertaInvestSUS))).scalar_one()
    assert al.resolvido
    m = (await db_session.execute(select(MonitoramentoInvestSUS).where(
        MonitoramentoInvestSUS.numero_proposta == "36000745925202600"))).scalar_one()
    assert m.percentual_execucao == 60  # projeto sem resposta não apaga


@pytest.mark.asyncio
async def test_listagem_pendencias_preenchimento_e_isolamento(db_session, municipio):
    paga_fora = PropostaInvestSUS(municipio_id=municipio.id, numero_proposta="36000743395202600", exercicio=2026,
                                  situacao_normalizada=SituacaoNormalizada.TOTALMENTE_PAGA, valor_pago=300000.0)
    db_session.add(paga_fora)
    await db_session.commit()
    await rt.aplicar_coleta(db_session, municipio.id, {"anos": [2026], "itens": [
        {"item": _item("36000745035202600", 333, dt=(datetime.utcnow() - timedelta(days=26)).isoformat()),
         "monitoramento": None}]}, "Teste")
    u = _usuario(municipio.id)
    lst = await rt.listar(db_session, u, ano=2026, numero=None)
    assert lst["resumo"]["a_vencer"] == 1 and lst["resumo"]["pagas_sem_monitoramento"] == 1
    assert lst["pagas_sem_monitoramento"][0]["numero_proposta"] == "36000743395202600"
    mid_ = lst["itens"][0]["id"]

    with pytest.raises(HTTPException) as e:
        await rt.preencher(mid_, db_session, u, {"execucao_iniciada": "S", "status_execucao": "PARCIAL"})
    assert e.value.status_code == 422
    reg = await rt.preencher(mid_, db_session, u, {
        "execucao_iniciada": "S", "status_execucao": "PARCIAL", "percentual_execucao": 30,
        "data_provavel_finalizacao": (date.today() + timedelta(days=60)).isoformat(), "observacao": "Compra em andamento"})
    assert not reg["lancado_no_investsus"]
    lst = await rt.listar(db_session, u, ano=None, numero="5035")
    assert lst["resumo"]["preenchimentos_nao_lancados"] == 1 and len(lst["itens"]) == 1

    # Sincronização com os mesmos valores confere o preenchimento como lançado.
    await rt.aplicar_coleta(db_session, municipio.id, {"anos": [2026], "itens": [
        {"item": _item("36000745035202600", 333, st="A"),
         "monitoramento": {"execucaoIniciada": "S", "statusExecucao": "PARCIAL", "percentualExecucao": 30,
                           "dataProvavelFinalizacao": reg["data_provavel_finalizacao"]}}]}, "Teste")
    det = await rt.detalhe(mid_, db_session, u)
    assert det["preenchimento_ersus_pendente"] is None
    assert {x["origem"] for x in det["registros"]} == {"ersus", "investsus"}

    # Outro município não vê nem preenche.
    outro = Municipio(nome="Outro", uf="AM", codigo_ibge="1300000")
    db_session.add(outro)
    await db_session.commit()
    u2 = _usuario(outro.id)
    assert (await rt.listar(db_session, u2, ano=None, numero=None))["itens"] == []
    with pytest.raises(HTTPException) as e:
        await rt.detalhe(mid_, db_session, u2)
    assert e.value.status_code == 404


def test_somente_leitura_nao_preenche():
    with pytest.raises(HTTPException):
        rt._pode_preencher(_usuario(1, role="visualizador"))
