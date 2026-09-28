"""Importação do XML-CNES do SISAB (formato ImportarXMLCNES v3.1, conferido no
arquivo real de Apuí de 28/09/2026). Arquivos de teste fictícios."""
from __future__ import annotations

import io
import json
import zipfile

from sqlalchemy import select

from models.cnes_xml import CnesXmlImportacao
from tests.test_isolamento_tenant import _auditoria, _h, _token, ambiente  # noqa: F401 (fixture)


def _prof(cns, nome, *lotacoes):
    lots = "".join(f'<DADOS_LOTACOES CNES="{c}" CO_CBO="{cbo}" CO_INE="{ine}" MICROAREA=""/>'
                   for c, cbo, ine in lotacoes)
    return (f'<DADOS_PROFISSIONAIS CO_CNS="{cns}" NM_PROF="{nome}" CPF_PROF="00000000191" '
            f'DT_NASC="1980-01-01" SEXO="F" TELEFONE="999" E_MAIL="x@y.z" CONSELHO_ID="1" NU_REGISTRO="123">'
            f'<ENDERECO><DADOS_ENDERECO LOGRADOURO="RUA SECRETA" CO_IBGE_MUN="130014"/></ENDERECO>'
            f'<LOTACOES>{lots}</LOTACOES></DADOS_PROFISSIONAIS>')


def _xml(ibge="1300144", data="2026-09-28", sem_acs=True, extra_prof=""):
    """UBS com: eSF AREAL (INE da AREAL real, ribeirinha na referência de Apuí),
    eSB AREAL sem dentista e eMulti apoiando duas UBS."""
    profs = [
        _prof("700000000000001", "MEDICA TESTE", ("2013290", "225142", "0000007048")),
        _prof("700000000000002", "ENFERMEIRO TESTE", ("2013290", "223565", "0000007048")),
        _prof("700000000000003", "TECNICA TESTE", ("2013290", "322245", "0000007048")),
        _prof("700000000000004", "ASB TESTE", ("2013290", "322425", "0001773941")),
        _prof("700000000000005", "PSICOLOGA TESTE", ("2013290", "251510", "0002449927")),
    ]
    if not sem_acs:
        profs.append(_prof("700000000000006", "ACS TESTE", ("2013290", "515105", "0000007048")))
    eq = ('<DADOS_EQUIPES CO_INE="{ine}" TP_EQUIPE="{tp}" SG_EQUIPE="{sg}" NM_REFERENCIA="{nm}" '
          'DS_EQUIPE="X" CO_AREA="0002" DS_AREA="" ID_TP_EQUIPE="1" DT_DESATIVACAO=""/>')
    ubs1 = "".join([eq.format(ine="0000007048", tp="70", sg="ESF", nm="AREAL"),
                    eq.format(ine="0001773941", tp="71", sg="ESB", nm="0002 AREAL"),
                    eq.format(ine="0002449927", tp="72", sg="EMULTI", nm="EMULTI ANIZIO")])
    ubs2 = eq.format(ine="0002449927", tp="72", sg="EMULTI", nm="EMULTI ANIZIO")
    return (f'<?xml version="1.0" encoding="UTF-8"?><ImportarXMLCNES><IDENTIFICACAO CO_IBGE_MUN="{ibge}" '
            f'DATA="{data}" ORIGEM="PORTAL" DESTINO="ESUS_AB" VERSAO_XSD="3.1"><ESTABELECIMENTOS>'
            f'<DADOS_GERAIS_ESTABELECIMENTOS CNES="2013290" NM_FANTA="UBS EDUARDO BIAZIN" DS_TP_UNID="CENTRO DE SAUDE/UNIDADE BASICA">'
            f'<EQUIPES>{ubs1}</EQUIPES></DADOS_GERAIS_ESTABELECIMENTOS>'
            f'<DADOS_GERAIS_ESTABELECIMENTOS CNES="2013312" NM_FANTA="UBS ANIZIO" DS_TP_UNID="CENTRO DE SAUDE/UNIDADE BASICA">'
            f'<EQUIPES>{ubs2}</EQUIPES></DADOS_GERAIS_ESTABELECIMENTOS>'
            f'<DADOS_GERAIS_ESTABELECIMENTOS CNES="2013282" NM_FANTA="HOSPITAL" DS_TP_UNID="HOSPITAL GERAL"/>'
            f'</ESTABELECIMENTOS><PROFISSIONAIS>{"".join(profs)}{extra_prof}</PROFISSIONAIS>'
            f'</IDENTIFICACAO></ImportarXMLCNES>').encode("utf-8")


def _zip(xml: bytes, nome="XmlParaESUS31_130014.xml") -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr(nome, xml)
    return buf.getvalue()


async def _importar(c, tok, conteudo, nome="XmlParaESUS31_130014.zip"):
    return await c.post("/api/cnes-xml/importar", headers=_h(tok), files={"arquivo": (nome, conteudo)})


async def test_importa_zip_do_sisab_e_confere_equipes(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    assert (await c.get("/api/cnes-xml/painel", headers=_h(tok))).json()["situacao_dado"] == "nao_disponivel"

    r = await _importar(c, tok, _zip(_xml()))
    assert r.status_code == 200, r.text
    t = r.json()["totais"]
    # eMulti que apoia duas UBS conta uma vez só
    assert (t["estabelecimentos"], t["equipes_ativas"], t["por_tipo"]) == (3, 3, {"eSF": 1, "eSB": 1, "eMulti": 1})
    assert await _auditoria(S, "CNES_XML_IMPORTADO")

    d = (await c.get("/api/cnes-xml/painel", headers=_h(tok))).json()
    codigos = {(p["codigo"], p["severidade"]) for p in d["pendencias"]}
    assert ("ESF_SEM_ACS", "critica") in codigos
    assert ("ESB_SEM_DENTISTA", "critica") in codigos
    assert ("ESF_SEM_MEDICO", "critica") not in codigos
    areal = next(e for e in d["equipes"] if e["ine"] == "0000007048")
    assert areal["ribeirinha"] is True and areal["composicao"]["medico"] == 1
    emulti = next(e for e in d["equipes"] if e["tipo"] == "eMulti")
    assert emulti["estabelecimentos"] == ["2013290", "2013312"]
    assert d["comparacao"] is None

    # Minimização: CPF, nascimento, endereço e contatos não são guardados
    async with S() as db:
        bruto = (await db.execute(select(CnesXmlImportacao))).scalar_one().dados
    for proibido in ("00000000191", "1980-01-01", "RUA SECRETA", "x@y.z", "CPF"):
        assert proibido not in bruto


async def test_compara_com_importacao_anterior(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    await _importar(c, tok, _zip(_xml(data="2026-08-28")))
    await _importar(c, tok, _xml(data="2026-09-28", sem_acs=False), nome="cnes.xml")   # .xml puro também vale
    d = (await c.get("/api/cnes-xml/painel", headers=_h(tok))).json()
    assert d["comparacao"]["data_anterior"] == "2026-08-28"
    assert d["comparacao"]["profissionais_entraram"] == ["ACS TESTE"]
    assert "ESF_SEM_ACS" not in {p["codigo"] for p in d["pendencias"]}
    assert len((await c.get("/api/cnes-xml/historico", headers=_h(tok))).json()) == 2


async def test_recusa_arquivo_de_outro_municipio(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await _importar(c, tok, _zip(_xml(ibge="1399991")))
    assert r.status_code == 422 and "1399991" in r.json()["detail"]
    assert await _auditoria(S, "CNES_XML_RECUSADO")
    async with S() as db:
        assert (await db.execute(select(CnesXmlImportacao))).scalars().all() == []


async def test_isolado_por_municipio_e_disponivel_para_outros(ambiente):
    c = ambiente["client"]
    tok_a = await _token(c, "gestor.apui@teste.gov.br")
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    await _importar(c, tok_a, _zip(_xml()))
    assert (await c.get("/api/cnes-xml/painel", headers=_h(tok_b))).json()["situacao_dado"] == "nao_disponivel"
    assert (await c.get("/api/cnes-xml/historico", headers=_h(tok_b))).json() == []
    # O município B importa o próprio arquivo (módulo não é exclusivo de Apuí)
    r = await _importar(c, tok_b, _zip(_xml(ibge="1399991")))
    assert r.status_code == 200, r.text
    d = (await c.get("/api/cnes-xml/painel", headers=_h(tok_b))).json()
    # sem referência verificada para B: marcação ribeirinha desconhecida, não "falsa"
    assert all(e["ribeirinha"] is None for e in d["equipes"])
    assert len((await c.get("/api/cnes-xml/historico", headers=_h(tok_a))).json()) == 1


async def test_perfil_consulta_nao_importa_e_arquivos_invalidos(ambiente):
    c = ambiente["client"]
    consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await _importar(c, consulta, _zip(_xml()))).status_code == 403
    tok = await _token(c, "gestor.apui@teste.gov.br")
    assert (await _importar(c, tok, b"<eSUSAPS versao='1'/>", nome="x.xml")).status_code == 422
    assert (await _importar(c, tok, b"nao e xml", nome="x.xml")).status_code == 422
    bomba = b'<?xml version="1.0"?><!DOCTYPE a [<!ENTITY x "y">]><ImportarXMLCNES/>'
    assert (await _importar(c, tok, bomba, nome="x.xml")).status_code == 422
    dois = io.BytesIO()
    with zipfile.ZipFile(dois, "w") as z:
        z.writestr("a.xml", _xml())
        z.writestr("b.xml", _xml())
    assert (await _importar(c, tok, dois.getvalue())).status_code == 422
