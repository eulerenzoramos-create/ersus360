"""Importação dos relatórios "Baixar dados" do SIAPS (CVAT e Qualidade — Visão por
Competência). Reproduz o formato real de Apuí de Jul/26 (CSV UTF-8 com BOM, células
entre aspas com TAB no fim, cabeçalho com ";" dentro de parênteses; e XLSX)."""
from __future__ import annotations

import io

import openpyxl

from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)

CAB = ("Ministério da Saúde - MS\r\nSecretaria de Atenção Primária à Saúde - Saps\r\n"
       "Sistema de Informação para a Atenção Primária à Saúde – Siaps\r\n"
       "Dado gerado em: 28 de setembro de 2026 - 15:19h\r\n{titulo}\r\nDado Preliminar\r\n\r\n"
       "Dados sociodemográficos:\r\nUF: AM\r\nMunicípio: {ibge} / APUÍ\r\n\r\nFiltro:\r\n{filtros}\r\n")
RODAPE = "\r\nFonte: Sistema de Informação para a Atenção Primária à Saúde - SIAPS\r\n"


def _linha(*cel):
    return ";".join(f'"{c}\t"' for c in cel) + "\r\n"


def _cvat(ibge="130014", comp="JUL/26"):
    cab = CAB.format(titulo="Relatório CVAT - Visão por Competência", ibge=ibge,
                     filtros=f"Competência selecionada: {comp}\r\nCondição das Equipes: Considera apenas equipes "
                             "homologadas\r\nTipo de Equipe: eAP, eSF\r\n")
    head = ("CNES;ESTABELECIMENTO;TIPO DO ESTABELECIMENTO;INE;NOME DA EQUIPE;SIGLA DA EQUIPE;PARÂMETRO POPULACIONAL;"
            "PESSOAS SOMENTE COM CADASTRO INDIVIDUAL;PESSOAS COM CADASTRO INDIVIDUAL E CADASTRO DOMICILIAR E TERRITORIAL;"
            "TOTAL DE PESSOAS COM CADASTRO (C = A + B);PESSOAS SEM CRITÉRIO;CRIANÇAS + PESSOAS IDOSAS;"
            "PESSOAS BENEFICIARIAS DO BPC OU PBF;PESSOAS IDOSAS OU CRIANÇAS + BPC OU PBF;TOTAL DE PESSOAS ACOMPANHADAS;"
            "ATENDIMENTOS SUJEITOS À AVALIAÇÃO DE SATISFAÇÃO;ATENDIMENTOS COM AVALIAÇÃO DE SATISFAÇÃO ;"
            "N DE PESSOAS VINCULADAS A EQUIPE;PONTUAÇÃO\r\n")
    linhas = (_linha("3320138", "UBS IRMA ELIZABETE", "CENTRO DE SAUDE/UNIDADE BASICA", "0000007072", "CACHOEIRA",
                     "eSF", "2500", "4", "1000", "1004", "500", "200", "300", "50", "1000", "2000", " - ", "1000", "8,25")
              + _linha("3697983", "CENTRO DE SAUDE CURUMIM", "CENTRO DE SAUDE/UNIDADE BASICA", "0000007099",
                       "LIBERDADE", "eSF", "2500", " - ", "800", "800", "400", "100", "200", "20", "790", "1500",
                       " - ", "790", "10,00"))
    return ("﻿" + cab + head + linhas + RODAPE).encode("utf-8")


def _qualidade_esfr():
    cab = CAB.format(titulo="Relatório Qualidade - Visão por Competência", ibge="130014",
                     filtros="Indicador: Mais acesso à eSFR\r\nCompetência selecionada: JUL/26\r\n"
                             "Condição das Equipes: Considera apenas equipes homologadas\r\nTipo de Equipe: eSFR\r\n")
    head = ("CNES;ESTABELECIMENTO;TIPO DO ESTABELECIMENTO;INE;NOME DA EQUIPE;SIGLA DA EQUIPE;"
            "Nº TOTAL DE ATENDIMENTOS NA ESFR POR DEMANDA PROGRAMADA (CONSULTA AGENDADA PROGRAMADA; CUIDADO "
            "CONTINUADO; E CONSULTA AGENDADA);Nº TOTAL DE ATENDIMENTOS NA ESFR POR TODOS OS TIPOS DE DEMANDAS "
            "(ESPONTÂNEAS E PROGRAMADAS);PONTUAÇÃO\r\n")
    linha = _linha("2013290", "UBS EDUARDO BIAZIN", "CENTRO DE SAUDE/UNIDADE BASICA", "0000007048", "AREAL",
                   "eSFR", "100", "250", "40,00")
    return ("﻿" + cab + head + linha + RODAPE).encode("utf-8")


def _qualidade_esf_xlsx():
    wb = openpyxl.Workbook()
    ws = wb.active
    for linha in ["Ministério da Saúde - MS", "Relatório Qualidade - Visão por Competência", "Dado Preliminar",
                  "Município: 130014 / APUÍ", "Indicador: Mais Acesso à APS", "Competência selecionada: JUL/26",
                  "Condição das Equipes: Considera apenas equipes homologadas", "Tipo de Equipe: eAP, eSF", None]:
        ws.append([linha])
    ws.append(["CNES", "ESTABELECIMENTO", "TIPO DO ESTABELECIMENTO", "INE", "NOME DA EQUIPE", "SIGLA DA EQUIPE",
               "NÚMERO TOTAL DE ATENDIMENTOS POR DEMANDA PROGRAMADA",
               "NÚMERO TOTAL DE ATENDIMENTOS POR TODOS OS TIPOS DE DEMANDAS (ESPONTÂNEAS E PROGRAMADAS)", "PONTUAÇÃO"])
    ws.append(["3320138", "UBS IRMA ELIZABETE", "CENTRO DE SAUDE/UNIDADE BASICA", "0000007072", "CACHOEIRA", "eSF",
               299, 648, "46,14"])
    ws.append(["Fonte: Sistema de Informação para a Atenção Primária à Saúde - SIAPS"])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


async def _importar(c, tok, *arquivos):
    return await c.post("/api/siaps-relatorios/importar", headers=_h(tok),
                        files=[("arquivos", (nome, dados)) for nome, dados in arquivos])


async def test_importa_cvat_e_qualidade_incluindo_esfr(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await _importar(c, tok, ("relatorio-cvat-visao-competencia.csv", _cvat()),
                        ("relatorio-visao-competencia.csv", _qualidade_esfr()),
                        ("relatorio-visao-competencia.xlsx", _qualidade_esf_xlsx()))
    res = r.json()["resultados"]
    assert [x["ok"] for x in res] == [True, True, True], res
    assert {(x["componente"], x["tipo_equipe"]) for x in res} == {("cvat", "eAP, eSF"), ("qualidade", "eSFR"),
                                                                  ("qualidade", "eAP, eSF")}
    assert await _auditoria(S, "SIAPS_RELATORIO_IMPORTADO")

    d = (await c.get("/api/siaps-relatorios/painel", headers=_h(tok))).json()
    assert d["competencia"] == "2026-07"
    assert d["cvat"]["resumo"] == {"equipes": 2, "pessoas_vinculadas": 1790, "pessoas_acompanhadas": 1790,
                                   "pontuacao_media": 9.12,
                                   "por_status": {"otimo": 1, "bom": 1, "suficiente": 0, "regular": 0}}
    assert d["cvat"]["linhas"][1]["A"] is None               # " - " vira vazio, não zero
    eq = {e["equipe"]: e for e in d["equipes"]}
    assert eq["AREAL"]["sigla"] == "eSFR" and eq["AREAL"]["cvat_pontuacao"] is None
    assert eq["AREAL"]["qualidade"] == {"Mais acesso à eSFR": 40.0}
    assert eq["CACHOEIRA"]["qualidade"] == {"Mais Acesso à APS": 46.14}
    assert any("eSFR" in a for a in d["avisos"])

    # A tela de Vínculo existente passa a usar o relatório importado
    v = (await c.get("/api/siaps/vinculo-acompanhamento", headers=_h(tok))).json()
    assert v["fonte"] == "siaps_relatorio_importado" and v["competencia"] == "2026-07"
    assert (v["total_equipes"], v["total_pessoas_vinculadas"]) == (2, 1790)
    assert v["equipes"][1]["A"] == 0 and v["equipes"][1]["status"] == "otimo"

    # Reimportar o mesmo relatório substitui (não duplica)
    r = await _importar(c, tok, ("relatorio-cvat-visao-competencia (1).csv", _cvat()))
    assert r.json()["resultados"][0]["substituiu"] is True
    assert len((await c.get("/api/siaps-relatorios/painel", headers=_h(tok))).json()["relatorios"]) == 3


async def test_recusa_outro_municipio_e_isola(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    tok_a = await _token(c, "gestor.apui@teste.gov.br")
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    r = await _importar(c, tok_a, ("x.csv", _cvat(ibge="139999")))
    assert r.json()["resultados"][0]["ok"] is False
    assert await _auditoria(S, "SIAPS_RELATORIO_RECUSADO")
    await _importar(c, tok_a, ("x.csv", _cvat()))
    assert (await c.get("/api/siaps-relatorios/painel", headers=_h(tok_b))).json()["situacao_dado"] == "nao_disponivel"
    # Município B importa o próprio relatório (módulo não é exclusivo de Apuí)
    r = await _importar(c, tok_b, ("x.csv", _cvat(ibge="139999")))
    assert r.json()["resultados"][0]["ok"] is True
    assert len((await c.get("/api/siaps-relatorios/painel", headers=_h(tok_a))).json()["relatorios"]) == 1


async def test_perfil_consulta_e_arquivos_invalidos(ambiente):
    c = ambiente["client"]
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await _importar(c, consulta, ("x.csv", _cvat()))).status_code == 403
    tok = await _token(c, "gestor.apui@teste.gov.br")
    res = (await _importar(c, tok, ("a.csv", b"qualquer;coisa\r\n1;2"),
                           ("b.csv", _cvat(comp="XYZ/26")))).json()["resultados"]
    assert [x["ok"] for x in res] == [False, False]
    assert "Relatório" in res[0]["erro"] and "Competência" in res[1]["erro"]
