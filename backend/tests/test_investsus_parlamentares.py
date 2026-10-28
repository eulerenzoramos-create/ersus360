"""Partido/UF/cargo dos autores de emendas (services/investsus_parlamentares.py): só preenche
quando o nome bate com um único parlamentar; bancadas e comissões não são consultadas."""
from types import SimpleNamespace

from services import investsus_parlamentares as ip

CAMARA_EXERCICIO = {"dados": [
    {"id": 220715, "nome": "Amom Mandel", "siglaPartido": "REPUBLICANOS", "siglaUf": "AM"},
    {"id": 204572, "nome": "Capitão Alberto Neto", "siglaPartido": "PL", "siglaUf": "AM"},
    {"id": 220712, "nome": "Fausto Jr.", "siglaPartido": "UNIÃO", "siglaUf": "AM"},
]}
# A lista por legislatura traz o partido da posse — não pode sobrescrever o atual.
CAMARA_LEG57 = {"dados": [
    {"id": 220715, "nome": "Amom Mandel", "siglaPartido": "CIDADANIA", "siglaUf": "AM"},
    {"id": 1, "nome": "José Silva", "siglaPartido": "AAA", "siglaUf": "SP"},
    {"id": 2, "nome": "José Silva", "siglaPartido": "BBB", "siglaUf": "MG"},
]}
SENADO = {"ListaParlamentarEmExercicio": {"Parlamentares": {"Parlamentar": [
    {"IdentificacaoParlamentar": {"CodigoParlamentar": "4994", "NomeParlamentar": "Eduardo Braga",
                                  "NomeCompletoParlamentar": "Carlos Eduardo de Souza Braga",
                                  "SiglaPartidoParlamentar": "MDB", "UfParlamentar": "AM"}},
]}}}

LISTA = ip.deputados_de(CAMARA_EXERCICIO) + ip.deputados_de(CAMARA_LEG57) + ip.senadores_de(SENADO)


def _p(nome, cargo=None, partido=None, uf=None):
    return SimpleNamespace(nome=nome, cargo=cargo, partido=partido, uf=uf)


def test_nome_do_investsus_em_caixa_alta_e_com_acento_bate_com_a_camara():
    p = _p("CAPITÃO ALBERTO NETO")
    r = ip.aplicar([p], LISTA)
    assert (p.cargo, p.partido, p.uf) == ("Deputado Federal", "PL", "AM")
    assert r["atualizados"] == 1


def test_pontuacao_no_nome_nao_impede_a_correspondencia():
    p = _p("FAUSTO JR")
    ip.aplicar([p], LISTA)
    assert p.partido == "UNIÃO"


def test_partido_atual_vence_o_partido_da_posse():
    p = _p("AMOM MANDEL")
    ip.aplicar([p], LISTA)
    assert p.partido == "REPUBLICANOS"


def test_senador_pelo_nome_parlamentar_e_pelo_nome_completo():
    a, b = _p("EDUARDO BRAGA"), _p("CARLOS EDUARDO DE SOUZA BRAGA")
    ip.aplicar([a, b], LISTA)
    assert (a.cargo, a.partido, a.uf) == ("Senador", "MDB", "AM")
    assert b.partido == "MDB"


def test_bancada_e_comissao_nao_sao_consultadas():
    ps = [_p("BANCADA DO AMAZONAS", cargo="Bancada"), _p("COMISSÃO DA SAÚDE", cargo="Comissão"),
          _p("COMISSÃO DE ASSUNTOS SOCIAIS - CAS")]
    r = ip.aplicar(ps, LISTA)
    assert r["coletivos"] == 3 and r["atualizados"] == 0
    assert all(p.partido is None for p in ps)


def test_nome_ambiguo_ou_desconhecido_fica_em_branco():
    amb, nada = _p("JOSÉ SILVA"), _p("FULANO DE TAL", partido="XYZ")
    r = ip.aplicar([amb, nada], LISTA)
    assert amb.partido is None and r["ambiguos"] == ["JOSÉ SILVA"]
    assert nada.partido == "XYZ" and r["nao_encontrados"] == ["FULANO DE TAL"]


def test_sem_mudanca_quando_ja_esta_em_dia():
    p = _p("EDUARDO BRAGA", cargo="Senador", partido="MDB", uf="AM")
    r = ip.aplicar([p], LISTA)
    assert r["sem_mudanca"] == 1 and r["atualizados"] == 0


def test_senado_com_um_unico_parlamentar_vem_como_objeto():
    unico = {"ListaParlamentarLegislatura": {"Parlamentares": {"Parlamentar":
             SENADO["ListaParlamentarEmExercicio"]["Parlamentares"]["Parlamentar"][0]}}}
    assert [s["nome"] for s in ip.senadores_de(unico)] == ["Eduardo Braga"]


# ── Rotas /api/investsus/parlamentares (banco em memória, Câmara/Senado simulados) ──

def _usuario(mid, role="gestor"):
    from routers.auth import UserOut
    return UserOut(username="teste", nome="Teste", role=role, municipio_id=mid, municipio_ibge="1300144")


async def test_rotas_completam_dados_e_totalizam_so_o_municipio_da_sessao(db_session, municipio, monkeypatch):
    import pytest
    from fastapi import HTTPException
    from models.investsus import Parlamentar, PropostaInvestSUS, SituacaoNormalizada
    from models.municipio import Municipio
    from routers import investsus as rt

    async def falsa_carga():
        return LISTA, []
    monkeypatch.setattr(ip, "carregar_parlamentares", falsa_carga)

    outro = Municipio(nome="Outro", uf="AM", codigo_ibge="1300000")
    braga = Parlamentar(nome="EDUARDO BRAGA")
    bancada = Parlamentar(nome="BANCADA DO AMAZONAS", cargo="Bancada")
    db_session.add_all([outro, braga, bancada])
    await db_session.flush()
    for mid, num, valor, sit in ((municipio.id, "A", 300.0, SituacaoNormalizada.APROVADA),
                                 (municipio.id, "B", 50.0, SituacaoNormalizada.CANCELADA),
                                 (outro.id, "C", 999.0, SituacaoNormalizada.APROVADA)):
        db_session.add(PropostaInvestSUS(municipio_id=mid, numero_proposta=num, exercicio=2026, modalidade="rp6",
                                         parlamentar_id=braga.id, valor_aprovado=valor, situacao_normalizada=sit))
    await db_session.commit()

    with pytest.raises(HTTPException):  # perfil sem permissão não consulta
        await rt.atualizar_parlamentares(db_session, _usuario(municipio.id, role="acs"))

    r = await rt.atualizar_parlamentares(db_session, _usuario(municipio.id))
    assert r["atualizados"] == 1 and r["coletivos"] == 1

    lista = {p["nome"]: p for p in await rt.listar_parlamentares(db_session, _usuario(municipio.id))}
    b = lista["EDUARDO BRAGA"]
    assert (b["cargo"], b["partido"], b["uf"]) == ("Senador", "MDB", "AM")
    assert b["qtd_propostas"] == 2 and b["valor"] == 300.0  # cancelada conta, mas não soma; outro município fora
    assert lista["BANCADA DO AMAZONAS"]["partido"] is None
