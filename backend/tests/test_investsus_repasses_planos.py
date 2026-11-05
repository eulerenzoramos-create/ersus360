"""InvestSUS — conferência com a lista oficial, plano convertido em controle por finalidade
e natureza de despesa, nota fiscal baixando o saldo e Excel no modelo das planilhas do Fundo."""
import io
from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy import select

from models.investsus import NaturezaDespesa, PropostaInvestSUS, SituacaoNormalizada
from routers.investsus import (
    aplicar_detalhes, aplicar_propostas_federais, conferencia_investsus, dashboard, registrar_conferencia,
)
from tests.test_investsus_detalhe import CNPJ, NUMERO, PLANO, _criar_proposta, _detalhe


def _u(mid, role="financeiro"):
    from routers.auth import UserOut
    return UserOut(username="tecnico", nome="Técnico", role=role, municipio_id=mid, municipio="Apuí",
                   municipio_ibge="1300144")


def _item(numero, exercicio=2026, valor=1000.0, situacao="Proposta Paga"):
    return {"numero_proposta": numero, "objeto": "INCREMENTO PAP", "modalidade": "rp6", "esfera": "federal",
            "valor_global": valor, "valor_aprovado": valor, "situacao_raw": situacao, "exercicio": exercicio,
            "fonte": "investsus"}


async def test_conferencia_tira_dos_totais_o_que_nao_esta_no_investsus(db_session, municipio):
    # proposta antiga do Portal da Transparência (número da emenda, não da proposta)
    db_session.add(PropostaInvestSUS(municipio_id=municipio.id, numero_proposta="202571040008", exercicio=2025,
                                     modalidade="rp6", valor_indicado=5000, valor_aprovado=5000,
                                     fonte_dado="portal_transparencia",
                                     situacao_normalizada=SituacaoNormalizada.TOTALMENTE_PAGA))
    await db_session.commit()
    dados = {"propostas": [_item("A", 2026, 1000), _item("B", 2023, 2000)]}
    await aplicar_propostas_federais(dados, municipio.id, db_session, origem="teste")
    conf = await registrar_conferencia(db_session, municipio.id, dados, [2026, 2025, 2024, 2023], "tecnico")
    assert conf["conferidas"] == 2 and conf["nao_encontradas"] == 1 and conf["nao_encontradas_valor"] == 5000
    assert [r["exercicio"] for r in conf["investsus_por_exercicio"]] == [2026, 2023]

    u = _u(municipio.id, "gestor")
    painel = await dashboard(db_session, u, None, None, None)
    assert painel["total_propostas"] == 2 and painel["total_indicado"] == 3000
    assert painel["nao_encontradas_investsus"] == {"qtd": 1, "valor_indicado": 5000.0}
    c = await conferencia_investsus(db_session, u)
    assert [p["numero_proposta"] for p in c["nao_encontradas"]] == ["202571040008"]
    assert c["ultima"]["investsus_total"] == 2

    # voltou na lista (ex.: estava em outro exercício): volta a contar
    dados2 = {"propostas": dados["propostas"] + [_item("202571040008", 2025, 5000)]}
    await aplicar_propostas_federais(dados2, municipio.id, db_session, origem="teste")
    await registrar_conferencia(db_session, municipio.id, dados2, [2026, 2025], "tecnico")
    assert (await dashboard(db_session, u, None, None, None))["total_propostas"] == 3


async def test_exercicio_passa_a_seguir_o_investsus(db_session, municipio):
    await aplicar_propostas_federais({"propostas": [_item("X", 2026)]}, municipio.id, db_session, origem="teste")
    await aplicar_propostas_federais({"propostas": [_item("X", 2024)]}, municipio.id, db_session, origem="teste")
    p = (await db_session.execute(select(PropostaInvestSUS).where(PropostaInvestSUS.numero_proposta == "X"))).scalar_one()
    assert p.exercicio == 2024 and p.conferencia_investsus == "conferida"


def test_captura_todos_os_exercicios():
    from services.investsus_scraper import exercicios_investsus
    assert exercicios_investsus(2026) == [2026, 2025, 2024, 2023, 2022, 2021, 2020]


async def test_natureza_soma_todos_os_planos_da_proposta(db_session, municipio):
    await _criar_proposta(db_session, municipio)
    outro = {**PLANO, "id": 110076, "cnes": "2017660", "valor": 100000,
             "metas": [{"id": 252900, "valor": 100000, "meta": {"descricao": "Exames", "metaPai": {"descricao": "SAÚDE MENTAL"}}}],
             "naturezas": [{"idNaturezaDespesa": "339030", "valor": 100000}]}
    await aplicar_detalhes(db_session, municipio.id, CNPJ, [_detalhe(planos=[PLANO, outro])], "teste")
    nat = {n.codigo: n.valor_previsto for n in (await db_session.execute(select(NaturezaDespesa))).scalars()}
    assert nat == {"339039": 340000, "339030": 478435}   # 378.435 + 100.000, não só o último plano


async def _proposta_com_plano(db_session, municipio):
    from routers import investsus_execucao as rt
    await _criar_proposta(db_session, municipio)
    await aplicar_detalhes(db_session, municipio.id, CNPJ, [_detalhe()], "teste")
    p = (await db_session.execute(select(PropostaInvestSUS).where(PropostaInvestSUS.numero_proposta == NUMERO))).scalar_one()
    u = _u(municipio.id)
    assert (await rt.importar_plano(p.id, db_session, u))["importadas"] == 2
    return rt, u, p


async def test_plano_vira_controle_por_finalidade_e_natureza(db_session, municipio):
    rt, u, p = await _proposta_com_plano(db_session, municipio)
    f = await rt.ficha(p.id, db_session, u)
    acoes = {a["descricao"].strip(): a for a in f["acoes"]}
    assert acoes["OCI em Ginecologia"]["grupo"] == "PROGRAMA AGORA TEM ESPECIALISTA - COMPONENTE AMBULATORIAL"
    assert acoes["CAPS - Centro de Atenção Psicossocial"]["grupo"] == "SAÚDE MENTAL"
    assert acoes["OCI em Ginecologia"]["natureza_despesa"] is None        # plano com 2 naturezas: escolhe na NF
    assert f["dados_gerais"]["numero_proposta"] == NUMERO and f["resumo"]["recebido"] == 718435

    oci = acoes["OCI em Ginecologia"]["id"]
    NF = rt.LancamentoCreate
    await rt.criar_lancamento(oci, NF(tipo="nota_fiscal", data="2026-07-10", valor=30000, natureza_despesa="339039",
                                      fornecedor="Clínica X", documento_comprobatorio="NF 15", historico="Consultas"), db_session, u)
    await rt.criar_lancamento(oci, NF(tipo="nota_fiscal", data="2026-07-20", valor=5000, natureza_despesa="339030",
                                      fornecedor="Distribuidora Y", documento_comprobatorio="15"), db_session, u)
    with pytest.raises(HTTPException) as e:                              # mesma NF do mesmo fornecedor
        await rt.criar_lancamento(oci, NF(tipo="nota_fiscal", data="2026-07-21", valor=1, fornecedor="Clínica X",
                                          documento_comprobatorio="nf-15"), db_session, u)
    assert e.value.status_code == 409
    with pytest.raises(HTTPException) as e:                              # NF sem número
        await rt.criar_lancamento(oci, NF(tipo="nota_fiscal", data="2026-07-21", valor=1), db_session, u)
    assert e.value.status_code == 422

    f = await rt.ficha(p.id, db_session, u)
    a = next(x for x in f["acoes"] if x["id"] == oci)
    assert (a["empenhado"], a["liquidado"], a["pago"], a["saldo_plano"]) == (35000, 35000, 35000, 65000)
    assert not any(al["tipo"] == "inconsistencia_estagios" for al in f["alertas"])
    nat = {n["codigo"]: n for n in f["naturezas"]}
    assert (nat["339039"]["previsto"], nat["339039"]["pago"], nat["339039"]["saldo"]) == (340000, 30000, 310000)
    assert (nat["339030"]["pago"], nat["339030"]["saldo"]) == (5000, 373435)


async def test_excel_no_modelo_das_planilhas(db_session, municipio):
    from openpyxl import load_workbook
    rt, u, p = await _proposta_com_plano(db_session, municipio)
    f = await rt.ficha(p.id, db_session, u)
    caps = next(a["id"] for a in f["acoes"] if a["grupo"] == "SAÚDE MENTAL")
    await rt.criar_lancamento(caps, rt.LancamentoCreate(tipo="nota_fiscal", data="2026-08-01", valor=18435,
                                                        natureza_despesa="339030", fornecedor="Farma",
                                                        documento_comprobatorio="NF 9"), db_session, u)
    resp = await rt.exportar_controle(p.id, db_session, u)
    wb = load_workbook(io.BytesIO(resp.body))
    assert wb.sheetnames[0] == "DADOS GERAIS DA EMENDA" and wb.sheetnames[-1] == "SALDO POR NATUREZA"
    abas = wb.sheetnames[1:-1]
    assert len(abas) == 2 and any(a.startswith("618.435,00") for a in abas)
    ws = wb[next(a for a in abas if a.startswith("618.435,00"))]
    linhas = [[c.value for c in r] for r in ws.iter_rows(min_row=3)]
    assert linhas[0][0] == "ENTRADA" and linhas[0][7] == 618435
    nf = next(l for l in linhas if l[5] == "NF 9")
    assert nf[6] == 18435 and str(nf[7]).startswith("=H") and nf[3].startswith("3.3.90.30")
    assert isinstance(nf[0], (date,)) or hasattr(nf[0], "year")


def _planilha_modelo(numero):
    """Planilha sintética nos dois modelos do Fundo (MAC por natureza e PAP por finalidade)."""
    from openpyxl import Workbook
    wb = Workbook()
    dg = wb.active
    dg.title = "DADOS GERAIS DA EMENDAS"
    dg.append(["Campo", "Valor"])
    dg.append(["Nº da Proposta", float(numero)])        # o Excel guarda como número (perde dígitos)
    mac = wb.create_sheet("378.435,00 CONSUMO")
    mac.append(["CONTROLE EXECUÇÃO EMENDA PARLAMENTAR - MATERIAL DE CONSUMO MAC- 33.90.30 -R$ 378.435,00"])
    mac.append(["Data", None, "FORNECEDOR", "FINALIDADE", "N. NOTA FISCAL", "VALOR", "SALDO ATUAL"])
    mac.append(["ENTRADA", "SAÍDA"])
    mac.append([378435, None, None, None, None, None, 378435])
    mac.append([None, date(2026, 8, 3), "Farma A", "Medicamentos", "101", 1000, "=G4-F5"])
    mac.append([None, None, "Farma B", "Insumos", None, 500, "=G5-F6"])             # sem data e sem nº
    pap = wb.create_sheet("618.435,00-SAUDE MENTAL")
    pap.append(["INCREMENTO - FINALIDADE: SAÚDE MENTAL - 618.435,00"])
    pap.append(["DATA ENTRADA/SAIDA", "FINALIDADE", "VALOR", "ELEMENTO DE DESPESA", None, None, "FORNECEDOR",
                "N. NOTA FISCAL", "VALOR", "SALDO ATUAL"])
    pap.append([])
    pap.append([None, None, None, "COSUMO", "PESSOA JURIDICA", "DESPESA COM LOCOMOÇAO"])
    pap.append([None, "SAÚDE MENTAL", None, None, None, None, None, None, None, 618435])
    pap.append([None, "Oficinas terapêuticas do CAPS", 200000])                       # sub-ação (previsto), não é nota
    pap.append([date(2026, 9, 1), "Oficinas terapêuticas do CAPS", None, None, "x", None, "Instituto C", "55", 7000, "=J5-I7"])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def test_le_os_dois_modelos():
    from openpyxl import load_workbook
    from services.investsus_controle_importacao import ler_planilha
    r = ler_planilha(load_workbook(io.BytesIO(_planilha_modelo(NUMERO))))
    assert r["numero_proposta"][:14] == NUMERO[:14]
    mac, pap = r["abas"]
    assert (mac["modelo"], mac["natureza"]) == ("mac", "339030")
    assert [(n["valor"], n["nota_fiscal"], n["data"]) for n in mac["notas"]] == [(1000, "101", "2026-08-03"), (500, None, None)]
    assert (pap["modelo"], pap["finalidade"]) == ("pap", "SAÚDE MENTAL")
    assert [(n["valor"], n["natureza"], n["nota_fiscal"]) for n in pap["notas"]] == [(7000, "339039", "55")]


async def test_importa_planilha_preenchida_sem_duplicar(db_session, municipio):
    from starlette.datastructures import UploadFile
    rt, u, p = await _proposta_com_plano(db_session, municipio)
    dados = _planilha_modelo(NUMERO)
    arq = lambda: UploadFile(io.BytesIO(dados), filename="controle.xlsx")

    previa = await rt.importar_controle(p.id, db_session, u, arq(), False, None, None)
    abas = {a["aba"]: a for a in previa["abas"]}
    assert previa["confere_proposta"] is True
    assert abas["618.435,00-SAUDE MENTAL"]["acao"].strip() == "CAPS - Centro de Atenção Psicossocial"
    assert abas["378.435,00 CONSUMO"]["acao_id"] is None          # 2 ações e nenhuma com natureza única
    oci = next(a["id"] for a in previa["acoes"] if a["descricao"] == "OCI em Ginecologia")
    import json
    mapa = json.dumps({"378.435,00 CONSUMO": oci})
    previa = await rt.importar_controle(p.id, db_session, u, arq(), False, None, mapa)
    assert previa["notas_a_importar"] == 2 and next(a for a in previa["abas"] if a["aba"] == "378.435,00 CONSUMO")["sem_data"] == 1

    r = await rt.importar_controle(p.id, db_session, u, arq(), True, "2026-08-31", mapa)
    assert r["criadas"] == 3 and r["valor_a_importar"] == 8500
    f = await rt.ficha(p.id, db_session, u)
    assert f["resumo"]["pago"] == 8500
    nat = {n["codigo"]: n["pago"] for n in f["naturezas"]}
    assert nat == {"339030": 1500, "339039": 7000}
    notas = [l for a in f["acoes"] for l in a["lancamentos"]]
    assert all(l["origem_dado"] == "importado" and l["tipo"] == "nota_fiscal" for l in notas)
    assert any(l["documento_comprobatorio"].startswith("S/N") and l["data"] == "2026-08-31" for l in notas)

    again = await rt.importar_controle(p.id, db_session, u, arq(), True, "2026-08-31", mapa)
    assert again["criadas"] == 0 and len(again["duplicadas"]) == 3
    assert (await rt.ficha(p.id, db_session, u))["resumo"]["pago"] == 8500


async def test_planilha_de_outra_proposta_e_recusada(db_session, municipio):
    from starlette.datastructures import UploadFile
    rt, u, p = await _proposta_com_plano(db_session, municipio)
    dados = _planilha_modelo("36000679442202500")
    previa = await rt.importar_controle(p.id, db_session, u, UploadFile(io.BytesIO(dados), filename="x.xlsx"), False, None, None)
    assert previa["confere_proposta"] is False
    with pytest.raises(HTTPException) as e:
        await rt.importar_controle(p.id, db_session, u, UploadFile(io.BytesIO(dados), filename="x.xlsx"), True, "2026-08-31", None)
    assert e.value.status_code == 422
