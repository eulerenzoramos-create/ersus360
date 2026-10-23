"""INVESTSUS 360 — detalhe da proposta (cadastro, pareceres, repasses, plano, anexos).
Amostra real da API do InvestSUS (proposta 36000802654202600, Apuí/AM, 16/10/2026)."""
from datetime import date

from sqlalchemy import select

from models.investsus import (
    AcaoServico, AlertaInvestSUS, DocumentoInvestSUS, NaturezaDespesa, PagamentoInvestSUS,
    Parecer, PlanoTrabalho, PropostaInvestSUS, UnidadeBeneficiada,
)
from routers.investsus import aplicar_detalhes, aplicar_propostas_federais
from services.investsus_detalhe import normalizar_detalhe, resultado_parecer, tipo_parecer

CNPJ = "12834320000126"
NUMERO = "36000802654202600"

CADASTRO = {
    "projeto": {"id": 1886490, "nuSubprojeto": NUMERO, "vlProposta": 718435, "cnpjEntidade": CNPJ,
                "cnpjFundo": CNPJ, "sgUf": "AM", "dsProgramaTrabalho": "1030251182E900013",
                "nuAnoExercicio": "2026", "coTipoProjeto": "INCREMENTO MAC", "coTipoRecurso": "EMENDA"},
    "situacao": {"id": 67, "descricao": "Proposta Paga"},
    "objeto": {"descricaoComponente": "INCREMENTO TEMPORÁRIO DO TETO DA MÉDIA E ALTA COMPLEXIDADE - MAC",
               "descricaoProgramaEstrategico": "ATENÇÃO ESPECIALIZADA À SAÚDE",
               "descricaoObjeto": "INCREMENTO DA MÉDIA E ALTA COMPLEXIDADE (MAC)", "descricaoGnd": "CORRENTE",
               "descricaoTipoProposta": "INCREMENTO MAC", "codigoAcao": "2E90",
               "descricaoAcao": "Incremento Temporário ao Custeio dos Serviços de Assistência Hospitalar e Ambulatorial"},
    "indicacoes": [{
        "cnes": "6820662", "nomeEstabelecimento": "SECRETARIA MUNICIPAL DE SAUDE DE APUI",
        "valorDisponivel": 718435, "idPlanoTrabalho": 110075, "idTipoEmenda": "BANCADA OBRIGATÓRIA",
        "indicacoes": [{"numeroEmenda": "71040008", "nomeParlamentar": "BANCADA DO AMAZONAS",
                        "valorIndicado": 718435, "idTipoEmenda": "BANCADA OBRIGATÓRIA"}],
    }],
    "programacaoAnualSaude": {
        "ano": "2025", "situacao": "APROVADO",
        "diretriz": {"descricao": "Ampliar a oferta e o acesso &agrave;s a&ccedil;&otilde;es",
                     "objetivo": {"descricao": "Ampliar e qualificar o acesso",
                                  "meta": [{"descricao": "Aumentar o percentual de parto normal"}]}},
    },
}
PARECERES = [
    {"descricaoSituacao": "Favorável", "dataParecer": "2026-05-22T21:20:39Z",
     "areaResponsavel": "CGAE/DAET - COORDENAÇÃO-GERAL DE ATENÇÃO ESPECIALIZADA",
     "descricaoGrupoParecer": "Parecer Mérito", "idParecer": "990018864901702"},
    {"descricaoSituacao": "Diligência", "dataParecer": "2026-05-14T22:19:07Z",
     "areaResponsavel": "CGAE/DAET - COORDENAÇÃO-GERAL DE ATENÇÃO ESPECIALIZADA",
     "descricaoGrupoParecer": "Parecer Mérito", "idParecer": "990018864901701"},
]
REPASSES = [
    {"dataPagamento": "2026-06-29T03:00:00Z", "numeroOrdemPagamento": "2026OB058672", "valorRepassado": 100000,
     "numeroProcessoPagamento": "25000097146202638", "localProcessoPagamento": "COOF em 05/08/2026 10:10"},
    {"dataPagamento": "2026-06-29T03:00:00Z", "numeroOrdemPagamento": "2026OB058674", "valorRepassado": 618435,
     "numeroProcessoPagamento": "25000097146202638", "localProcessoPagamento": "COOF em 05/08/2026 10:10"},
]
PLANO = {
    "cnes": "6820662", "id": 110075, "valor": 718435, "justificativa": "O município de Apuí/AM...",
    "metas": [
        {"id": 252819, "valor": 100000, "meta": {"descricao": "OCI em Ginecologia", "metaPai": {
            "descricao": "PROGRAMA AGORA TEM ESPECIALISTA - COMPONENTE AMBULATORIAL",
            "metaPai": {"descricao": "AÇÕES E SERVIÇOS"}}}},
        {"id": 252820, "valor": 618435, "meta": {"descricao": "CAPS - Centro de Atenção Psicossocial ",
                                                  "metaPai": {"descricao": "SAÚDE MENTAL"}}},
    ],
    "naturezas": [{"idNaturezaDespesa": "339039", "valor": 340000},
                  {"idNaturezaDespesa": "339030", "valor": 378435}],
}
ANEXOS = [{"codigo": 1671122, "descricaoDocumento": "Outros documentos para a Proposta",
           "documento": "CRU MANAUS - NOVA AMBULA.pdf"}]


def _detalhe(**extra):
    base = {"numero": NUMERO, "cadastro": CADASTRO, "pareceres": PARECERES, "repasses": REPASSES,
            "anexos": ANEXOS, "planos": [PLANO]}
    base.update(extra)
    return base


def test_normaliza_detalhe_real():
    d = normalizar_detalhe(_detalhe(), CNPJ)
    assert d["cnpj_ok"] and d["modalidade"] == "rp7"
    assert d["emendas"][0]["numero_emenda"] == "71040008"
    assert d["proposta"]["tipo_financiamento"] == "custeio"
    assert d["proposta"]["acao_orcamentaria"].startswith("2E90 — ")
    assert d["digisus"]["digisus_diretriz"].startswith("Ampliar a oferta e o acesso às ações")
    assert [p["resultado"] for p in d["pareceres"]] == ["favoravel", "diligencia"]
    assert d["pareceres"][1]["data_parecer"] == date(2026, 5, 14)
    assert sum(r["valor"] for r in d["repasses"]) == 718435
    meta = d["planos"][0]["metas"][0]
    assert meta["descricao"] == "OCI em Ginecologia"
    assert meta["categoria"] == "PROGRAMA AGORA TEM ESPECIALISTA - COMPONENTE AMBULATORIAL"
    assert d["planos"][0]["naturezas"][0]["descricao"] == "OUTROS SERVICOS DE TERCEIROS-PESSOA JURIDICA"
    assert d["planos"][0]["raw"] is PLANO
    assert d["repasses"][0]["numero_processo"] == "25000097146202638"


def test_tipos_de_emenda_do_investsus():
    for tipo, modalidade in {"INDIVIDUAL": "rp6", "BANCADA OBRIGATÓRIA": "rp7", "COMISSAO": "rp8"}.items():
        cad = {**CADASTRO, "indicacoes": [{**CADASTRO["indicacoes"][0], "indicacoes": [
            {**CADASTRO["indicacoes"][0]["indicacoes"][0], "idTipoEmenda": tipo}]}]}
        assert normalizar_detalhe(_detalhe(cadastro=cad), CNPJ)["modalidade"] == modalidade, tipo


def test_programa_sem_emenda():
    cad = {**CADASTRO, "projeto": {**CADASTRO["projeto"], "coTipoRecurso": "PROGRAMA"},
           "indicacoes": [{"cnes": "2013282", "valorDisponivel": 10}]}
    assert normalizar_detalhe(_detalhe(cadastro=cad), CNPJ)["modalidade"] == "programa"


def test_situacoes_e_grupos_de_parecer():
    assert resultado_parecer("Não Favorável") == "desfavoravel"
    assert resultado_parecer("Favorável") == "favoravel"
    assert resultado_parecer("Diligência") == "diligencia"
    assert tipo_parecer("Parecer Econômico") == "financeiro"
    assert tipo_parecer("Parecer Mérito") == "merito"


def test_cadastro_de_outro_fundo_e_recusado():
    cad = {**CADASTRO, "projeto": {**CADASTRO["projeto"], "cnpjFundo": "11111111000111"}}
    assert normalizar_detalhe(_detalhe(cadastro=cad), CNPJ)["cnpj_ok"] is False


def test_proposta_cancelada_sem_cadastro():
    d = normalizar_detalhe({"numero": NUMERO, "cadastro": None, "pareceres": [], "repasses": []}, CNPJ)
    assert d["cnpj_ok"] and not d["tem_cadastro"] and d["modalidade"] is None


async def _criar_proposta(db_session, municipio):
    await aplicar_propostas_federais({"propostas": [{
        "numero_proposta": NUMERO, "objeto": "INCREMENTO MAC", "modalidade": "a_classificar",
        "esfera": "federal", "valor_global": 718435.0, "valor_aprovado": 718435.0,
        "situacao_raw": "Proposta Paga", "exercicio": 2026, "fonte": "investsus"}]},
        municipio.id, db_session, origem="teste")


async def test_grava_detalhe_completo_sem_duplicar(db_session, municipio):
    await _criar_proposta(db_session, municipio)
    c1 = await aplicar_detalhes(db_session, municipio.id, CNPJ, [_detalhe()], "teste")
    assert c1["propostas"] == 1 and c1["classificadas"] == 1
    assert c1["pareceres_novos"] == 2 and c1["repasses_novos"] == 2 and c1["anexos_novos"] == 1

    p = (await db_session.execute(select(PropostaInvestSUS).where(
        PropostaInvestSUS.numero_proposta == NUMERO))).scalar_one()
    assert p.modalidade == "rp7" and p.tipo_emenda.value == "bancada"
    assert p.numero_emenda == "71040008" and p.valor_pago == 718435
    assert p.numero_processo == "25000097146202638"
    pg = (await db_session.execute(select(PagamentoInvestSUS))).scalars().first()
    assert pg.numero_processo == "25000097146202638"
    plano = (await db_session.execute(select(PlanoTrabalho))).scalar_one()
    assert plano.justificativa == "O município de Apuí/AM..." and plano.payload_original["id"] == 110075

    # segunda importação: nada duplica
    c2 = await aplicar_detalhes(db_session, municipio.id, CNPJ, [_detalhe()], "teste")
    assert c2["pareceres_novos"] == 0 and c2["repasses_novos"] == 0 and c2["anexos_novos"] == 0
    conta = lambda m: db_session.execute(select(m))  # noqa: E731
    assert len((await conta(Parecer)).scalars().all()) == 2
    assert len((await conta(PagamentoInvestSUS)).scalars().all()) == 2
    assert len((await conta(UnidadeBeneficiada)).scalars().all()) == 1
    assert len((await conta(PlanoTrabalho)).scalars().all()) == 1
    assert len((await conta(AcaoServico)).scalars().all()) == 2
    assert len((await conta(NaturezaDespesa)).scalars().all()) == 2
    assert len((await conta(DocumentoInvestSUS)).scalars().all()) == 1


async def test_resposta_interna_e_execucao_nao_sao_sobrescritas(db_session, municipio):
    await _criar_proposta(db_session, municipio)
    await aplicar_detalhes(db_session, municipio.id, CNPJ, [_detalhe()], "teste")
    dil = (await db_session.execute(select(Parecer).where(Parecer.eh_diligencia == True))).scalar_one()  # noqa: E712
    dil.resposta_texto = "Respondido com ofício 12/2026"
    nat = (await db_session.execute(select(NaturezaDespesa).where(NaturezaDespesa.codigo == "339030"))).scalar_one()
    nat.valor_pago = 1000.0
    await db_session.commit()

    await aplicar_detalhes(db_session, municipio.id, CNPJ, [_detalhe()], "teste")
    dil = (await db_session.execute(select(Parecer).where(Parecer.eh_diligencia == True))).scalar_one()  # noqa: E712
    nat = (await db_session.execute(select(NaturezaDespesa).where(NaturezaDespesa.codigo == "339030"))).scalar_one()
    assert dil.resposta_texto == "Respondido com ofício 12/2026"
    assert nat.valor_pago == 1000.0 and nat.valor_previsto == 378435


async def test_diligencia_aberta_gera_alerta_e_antiga_nao(db_session, municipio):
    await _criar_proposta(db_session, municipio)
    # histórico: diligência seguida de parecer favorável → sem alerta
    c = await aplicar_detalhes(db_session, municipio.id, CNPJ, [_detalhe()], "teste")
    assert c["alertas"] == 0
    # nova diligência, a mais recente → alerta urgente
    nova = {**PARECERES[1], "idParecer": "990018864901799", "dataParecer": "2026-10-10T12:00:00Z"}
    c = await aplicar_detalhes(db_session, municipio.id, CNPJ, [_detalhe(pareceres=PARECERES + [nova])], "teste")
    assert c["alertas"] == 1
    alerta = (await db_session.execute(select(AlertaInvestSUS).where(
        AlertaInvestSUS.tipo_alerta == "nova_diligencia"))).scalar_one()
    assert alerta.nivel.value == "urgente"


async def test_lista_nao_desfaz_valor_pago_dos_repasses(db_session, municipio):
    await _criar_proposta(db_session, municipio)
    parcial = [REPASSES[0]]
    await aplicar_detalhes(db_session, municipio.id, CNPJ, [_detalhe(repasses=parcial)], "teste")
    await _criar_proposta(db_session, municipio)  # nova sincronização da lista ("Proposta Paga")
    p = (await db_session.execute(select(PropostaInvestSUS))).scalar_one()
    assert p.valor_pago == 100000


async def test_proposta_de_outro_municipio_nao_e_tocada(db_session, municipio):
    c = await aplicar_detalhes(db_session, municipio.id, CNPJ, [_detalhe()], "teste")
    assert c["propostas"] == 0 and c["nao_encontradas"] == 1
    assert (await db_session.execute(select(Parecer))).first() is None
