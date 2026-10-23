"""
Vigilância em Saúde — integração com os painéis públicos da FVS-RCP/AM.

Cobre: trava de dado pessoal (LGPD) na leitura das pastas do Tableau, regras de contagem copiadas dos
painéis da FVS (malária), calendário epidemiológico, sincronização com histórico/diferenças/erros,
alertas (oficiais × calculados) e o mapeamento para as 15 subabas.
"""
from __future__ import annotations

import zipfile
from datetime import date, datetime
from pathlib import Path

import pytest

import models.vigilancia_fvs  # noqa: F401 — registra as tabelas fvs_*
from models.vigilancia_fvs import FvsFonteEstado, FvsMunicipio, FvsSerie, FvsSincronizacao
from services import fvs_analise as an
from services import fvs_catalogo as cat
from services import fvs_coleta as col
from services import fvs_tableau as tb



# ── Proteção de dados ─────────────────────────────────────────────────────────

@pytest.mark.parametrize("coluna", ["no_nome_paciente", "NOMEMAE", "Nomemae", "NUMSUS", "dt_nascimento", "DTNASC",
                                    "nu_notificacao", "NUMERODO", "nu_cpf", "co_cns", "NOMEPAI"])
def test_colunas_identificadoras_sao_reconhecidas(coluna):
    assert tb.coluna_identificadora(coluna, 100000)


@pytest.mark.parametrize("coluna", ["NOME_MUN", "NM_MUNICIP", "Município", "codigo7", "Regional", "ID_PACIE",
                                    "paciente_idade", "Doenca/Agravo", "Faixa etaria", "qt_nascidos_vivos"])
def test_colunas_agregadas_nao_sao_bloqueadas(coluna):
    assert not tb.coluna_identificadora(coluna, 100000)


def test_nome_ambiguo_depende_do_tamanho_da_tabela():
    # pasta da malária: tabela de 9 UFs com coluna "Nome" (nome do estado) não é dado pessoal
    assert not tb.coluna_identificadora("Nome", 9)
    assert tb.coluna_identificadora("NOME", 376544)


def _pasta(tmp: Path, tabelas: dict[str, tuple[list[tuple[str, object]], list[tuple]]], twb: str = "<workbook/>") -> Path:
    """Monta um .twbx de teste com extrações .hyper reais."""
    api = pytest.importorskip("tableauhyperapi")
    arqs = []
    with api.HyperProcess(api.Telemetry.DO_NOT_SEND_USAGE_DATA_TO_TABLEAU,
                          parameters={"log_dir": str(tmp)}) as hp:
        for i, (nome, (cols, linhas)) in enumerate(tabelas.items()):
            arq = tmp / f"t{i}.hyper"
            with api.Connection(hp.endpoint, str(arq), api.CreateMode.CREATE_AND_REPLACE) as c:
                c.catalog.create_schema("Extract")
                defn = api.TableDefinition(api.TableName("Extract", "Extract"),
                                           [api.TableDefinition.Column(n, t) for n, t in cols])
                c.catalog.create_table(defn)
                with api.Inserter(c, defn) as ins:
                    ins.add_rows(linhas)
                    ins.execute()
            arqs.append(arq)
    pasta = tmp / "pasta.twbx"
    with zipfile.ZipFile(pasta, "w") as z:
        z.writestr("pasta.twb", twb)
        for i, a in enumerate(arqs):
            z.write(a, f"Data/Extracts/federated_{i}.hyper")
    return pasta


def test_pasta_com_dado_pessoal_e_recusada_e_apagada(tmp_path, monkeypatch):
    api = pytest.importorskip("tableauhyperapi")
    st = api.SqlType
    pasta = _pasta(tmp_path, {"x": ([("no_nome_paciente", st.text()), ("codigo", st.int())],
                                    [("FULANO FICTICIO", 130014)])})  # dado-ficticio
    criadas = []
    real = tb.tempfile.mkdtemp
    monkeypatch.setattr(tb.tempfile, "mkdtemp", lambda **kw: criadas.append(real(**kw)) or criadas[-1])
    with pytest.raises(tb.DadoPessoalDetectado):
        with tb.abrir_pasta("teste", pasta):
            pass
    assert criadas and not Path(criadas[0]).exists()   # nada fica em disco


def test_paineis_com_dado_pessoal_nunca_tem_coletor():
    for p in cat.PAINEIS:
        if p["integracao"] == "bloqueado_lgpd":
            assert "coletor" not in p and ":toolbar=no" in p["embed"]
    bloqueados = {p["workbook"] for p in cat.PAINEIS if p["integracao"] == "bloqueado_lgpd"}
    assert not bloqueados & {c["workbook"] for c in cat.COLETORES.values()}


def test_catalogo_cobre_as_15_subabas_e_os_19_paineis_da_pagina():
    assert len([p for p in cat.PAINEIS if p["ver_painel"]]) == 19
    assert len(cat.SUBABAS) == 16   # 15 subabas + painel executivo
    for p in cat.PAINEIS:
        assert set(p["subabas"]) <= set(cat.SUBABAS)
    assert set(cat.SEM_FONTE_FVS) <= set(cat.SUBABAS)


# ── Regras copiadas dos painéis ───────────────────────────────────────────────

def test_semana_epidemiologica():
    assert col.semana_epidemiologica(date(2024, 12, 29)) == (2025, 1)   # SE 1/2025: 29/12/2024 a 04/01/2025
    assert col.semana_epidemiologica(date(2025, 1, 4)) == (2025, 1)
    assert col.semana_epidemiologica(date(2026, 1, 3)) == (2025, 53)
    assert col.semana_epidemiologica(date(2026, 1, 4)) == (2026, 1)


def test_classe_ipa_igual_ao_painel_da_fvs():
    assert col.classe_ipa(0).startswith("Sem transmissão")
    assert col.classe_ipa(0.5).startswith("Controle")
    assert col.classe_ipa(9.97).startswith("Baixo")
    assert col.classe_ipa(26.25).startswith("Médio")
    assert col.classe_ipa(51).startswith("Alto")
    assert col.classe_ipa(101).startswith("Altíssimo")


def test_numero_aceita_formatos_da_fvs():
    assert col.numero("74,2") == 74.2
    assert col.numero("1.234,5") == 1234.5
    assert col.numero("NSA") is None and col.numero("-") is None and col.numero("X") is None


def test_malaria_conta_so_positivos_sem_lvc_ate_a_data_de_atualizacao(tmp_path):
    api = pytest.importorskip("tableauhyperapi")
    st = api.SqlType
    d = api.Date
    linhas = [  # (RES_EXAM, ID_LVC, DT_NOTIF, MUN_INFE, SEXO)
        (4, 2, d(2025, 3, 10), 130014, "M"),   # vivax — conta
        (2, 2, d(2025, 3, 11), 130014, "F"),   # falciparum — conta
        (1, 2, d(2025, 3, 12), 130014, "M"),   # negativo — não conta
        (4, 1, d(2025, 3, 13), 130014, "M"),   # lâmina de verificação de cura — não conta
        (4, 2, d(2025, 12, 31), 130014, "M"),  # depois da data de atualização — não conta
        (4, 2, d(2025, 4, 1), 130260, "F"),    # outro município — conta para ele
    ]
    twb = "<column caption='Data de atualização' datatype='date' name='[Parâmetro 1]' value='#2025-12-01#'>"
    pasta = _pasta(tmp_path, {
        "casos": ([("RES_EXAM", st.int()), ("ID_LVC ", st.int()), ("DT_NOTIF", st.date()), ("MUN_INFE", st.int()),
                   ("SEXO", st.text())], linhas),
        "pop": ([("Código", st.int()), ("Município", st.text()), ("Pop.", st.int())],
                [(130014, "APUI", 20000), (130260, "OUTRO", 10000)]),
    }, twb)
    with tb.abrir_pasta("teste", pasta) as ext:
        out = col.coletar_malaria(ext)
    pos = {(r["ibge6"], r["ano"]): r["valor"] for r in out["linhas"]
           if r["indicador"] == "positivos" and r["periodo_tipo"] == "ano" and r["recorte"] == "total"}
    assert pos == {("130014", 2025): 2, ("130260", 2025): 1, ("130000", 2025): 3}
    ipa = next(r for r in out["linhas"] if r["indicador"] == "ipa" and r["ibge6"] == "130014")
    assert ipa["valor"] == 0.1 and ipa["denominador"] == 20000 and ipa["texto"].startswith("Controle")
    par = {r["recorte_valor"]: r["valor"] for r in out["linhas"] if r["recorte"] == "parasita" and r["ibge6"] == "130014"}
    assert par == {"Vivax": 1, "Falciparum": 1}
    assert "01/12/2025" in out["data_referencia"]


def test_consolidar_descarta_conflito_sem_escolher_numero():
    a = col._linha("x", "130014", 2025, valor=1.0)
    b = col._linha("x", "130014", 2025, valor=2.0)
    c = col._linha("y", "130014", 2025, valor=5.0)
    linhas, v = col.consolidar([a, dict(a), b, c, dict(c)])
    assert [r["indicador"] for r in linhas] == ["y"]
    assert v["chaves_conflitantes_descartadas"] == 1 and v["repeticoes_identicas_consolidadas"] == 1


# ── Sincronização ─────────────────────────────────────────────────────────────

def _saida(valor_dengue=10.0):
    linhas = [col._linha("casos:Dengue", "130014", 2025, valor=valor_dengue),
              col._linha("casos:Dengue", "130260", 2025, valor=3.0)]
    return {"linhas": linhas, "extra": {"agravos": ["Dengue"]}, "data_referencia": "notificações até 19/10/2026",
            "validacao": {}, "publicado_em": datetime(2026, 10, 21, 13, 0), "perfil": "astec.sass"}


@pytest.mark.asyncio
async def test_sincronizacao_grava_historico_e_diferencas(db_session, monkeypatch):
    db_session.add_all([FvsMunicipio(ibge6="130014", ibge7="1300144", nome="Apuí", regiao_saude="RIO MADEIRA", fonte="t"),
                        FvsMunicipio(ibge6="130260", ibge7="1302603", nome="Manaus", regiao_saude="X", fonte="t")])
    await db_session.commit()
    saidas = iter([_saida(10.0), _saida(12.0)])
    monkeypatch.setattr(col, "_executar_coletor", lambda c: next(saidas))
    r1 = await col.sincronizar(db_session, "sinan", "manual", "teste", forcar=True)
    assert r1["situacao"] == "ok" and r1["novos"] == 2
    r2 = await col.sincronizar(db_session, "sinan", "manual", "teste", forcar=True)
    assert r2["alterados"] == 1 and r2["novos"] == 0
    v = (await an.serie(db_session, "sinan", "casos:Dengue", ["130014"]))[0]["valor"]
    assert v == 12.0
    est = await db_session.get(FvsFonteEstado, "sinan")
    assert est.situacao == "ok" and est.data_referencia.startswith("notificações")
    hist = await col.historico(db_session, "sinan")
    assert len(hist) == 2 and hist[0]["validacao"]["municipios_sem_dado"] == []


@pytest.mark.asyncio
async def test_sem_nova_publicacao_nao_baixa_de_novo(db_session, monkeypatch):
    monkeypatch.setattr(col, "_executar_coletor", lambda c: _saida())
    await col.sincronizar(db_session, "sinan", forcar=True)
    monkeypatch.setattr(col, "_executar_coletor", lambda c: (_ for _ in ()).throw(AssertionError("baixou de novo")))
    monkeypatch.setattr(tb, "metadados", lambda p: {"publicado_em": datetime(2026, 10, 21, 13, 0), "perfil": "x"})
    r = await col.sincronizar(db_session, "sinan")
    assert r["situacao"] == "sem_mudanca"


@pytest.mark.asyncio
async def test_falha_e_dado_pessoal_ficam_registrados_sem_apagar_a_serie(db_session, monkeypatch):
    monkeypatch.setattr(col, "_executar_coletor", lambda c: _saida())
    await col.sincronizar(db_session, "sinan", forcar=True)

    def falha(c):
        raise tb.DadoPessoalDetectado("2 coluna(s) identificadora(s)")
    monkeypatch.setattr(col, "_executar_coletor", falha)
    r = await col.sincronizar(db_session, "sinan", forcar=True)
    assert r["situacao"] == "erro" and "proteção de dados" in r["mensagem"]
    est = await db_session.get(FvsFonteEstado, "sinan")
    assert est.situacao == "bloqueado_lgpd"
    assert len(await an.serie(db_session, "sinan")) == 2   # última série válida continua no ar
    ultimo = (await col.historico(db_session, "sinan"))[0]
    assert ultimo["situacao"] == "erro"


# ── Análise e alertas ─────────────────────────────────────────────────────────

async def _semear_semanas(db, se_atual: int):
    db.add(FvsMunicipio(ibge6="130014", ibge7="1300144", nome="Apuí", regiao_saude="RIO MADEIRA", fonte="t"))
    ano = date.today().year
    linhas = []
    for se in range(1, se_atual + 1):
        linhas.append(FvsSerie(fonte="sinan", indicador="casos:Dengue", ibge6="130014", ano=ano, periodo_tipo="se",
                               periodo=se, recorte="total", recorte_valor="", valor=3))
        linhas.append(FvsSerie(fonte="sinan", indicador="casos:Dengue", ibge6="130014", ano=ano - 1, periodo_tipo="se",
                               periodo=se, recorte="total", recorte_valor="", valor=1))
        linhas.append(FvsSerie(fonte="sinan", indicador="casos:Dengue", ibge6=col.IBGE_AM, ano=ano, periodo_tipo="se",
                               periodo=se, recorte="total", recorte_valor="", valor=3))
    linhas.append(FvsSerie(fonte="pqa_vs", indicador="IND_07", ibge6="130014", ano=ano, periodo_tipo="quadrimestre",
                           periodo=1, recorte="total", recorte_valor="", valor=64.7, numerador=44, denominador=68,
                           meta=">=70%", alcance="NÃO"))
    linhas.append(FvsSerie(fonte="aesop", indicador="aviso_aesop", ibge6="130014", ano=ano, periodo_tipo="se",
                           periodo=se_atual, recorte="total", recorte_valor="", texto="Sim"))
    db.add_all(linhas)
    await db.commit()
    return ano


@pytest.mark.asyncio
async def test_alertas_separam_oficial_de_calculado(db_session):
    ano_hoje, se_hoje = col.semana_epidemiologica(date.today())
    if se_hoje < 12:
        pytest.skip("início do ano epidemiológico: poucas semanas para comparar")
    ano = await _semear_semanas(db_session, se_hoje - 2)
    r = await an.alertas(db_session, "130014", ano)
    tipos = {(a["tipo"], a["fonte"]) for a in r["alertas"]}
    assert ("oficial", "aesop") in tipos and ("oficial", "pqa_vs") in tipos
    aumento = [a for a in r["alertas"] if a["tipo"] == "calculado" and "Dengue" in a["titulo"]]
    assert aumento and "+200,0%" in aumento[0]["detalhe"] and aumento[0]["subaba"] == "arboviroses"
    assert "não confirma surto" in r["legenda"]["calculado"]


@pytest.mark.asyncio
async def test_painel_sem_dados_nao_inventa_numeros(db_session):
    p = await an.painel_executivo(db_session, "130014", date.today().year)
    assert p["cartoes"]["notificacoes_sinan"]["valor"] is None
    assert p["cartoes"]["malaria_positivos"]["valor"] is None
    assert p["agravos"] == [] and p["pqa_vs"] is None
    assert any("confirmados" in i["item"] for i in p["indisponivel"])
