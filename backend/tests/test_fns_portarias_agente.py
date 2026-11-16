"""Agente de análise das Portarias do FNS: natureza pelo bloco oficial, matriz de despesas com fundamentação,
análise em lote sem dupla contagem, isolamento por município e validação da resposta da IA.
Blocos e programas no formato real do consultafns (Apuí, maio/2026)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal

from sqlalchemy import select

from models.fns_portaria_analise import FnsPortariaAnalise
from models.transferencia_fns import TransferenciaFns
from services import fns_portarias_agente as ag
from services import fns_portarias_normas as N
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)

MANUT = "Manutenção das Ações e Serviços Públicos de Saúde"
ESTRUT = "Estruturação da Rede de Serviços Públicos de Saúde"


def test_natureza_vem_do_bloco_oficial_e_nao_do_titulo():
    assert ag.classificar_natureza(MANUT)["natureza"] == "CUSTEIO"
    assert ag.classificar_natureza(ESTRUT)["natureza"] == "INVESTIMENTO"
    assert ag.classificar_natureza("")["natureza"] == "EM ANÁLISE"
    assert ag.classificar_natureza("Bloco qualquer")["natureza"] == "OUTRA NATUREZA"
    # título com "investimento" mas bloco de manutenção → custeio
    t = TransferenciaFns(id=1, bloco=MANUT, grupo="ATENÇÃO PRIMÁRIA", acao="INVESTIMENTO EM SAÚDE",
                         acao_detalhada="X", valor_liquido=Decimal("10"))
    r = ag.analisar("1", [t], exercicio=2026, documentos={}, propostas_ob={}, propostas_is={}, execucao={},
                    estado_normas={})
    assert r["naturezas"] == ["CUSTEIO"]


def test_matriz_tem_12_categorias_com_fundamentacao():
    for nat in ("CUSTEIO", "INVESTIMENTO"):
        m = ag.matriz_despesas(nat, "regular")
        assert [c["categoria"] for c in m] == [c for c, _ in N.CATEGORIAS]
        for c in m:
            assert c["classificacao"] in (N.PERMITIDO, N.COM_CONDICOES, N.VEDADO, N.ANALISE)
            assert c["fundamentacao"], c
            assert all(f["url"].startswith("https://") for f in c["fundamentacao"])
    custeio = {c["categoria"]: c["classificacao"] for c in ag.matriz_despesas("CUSTEIO", "regular")}
    invest = {c["categoria"]: c["classificacao"] for c in ag.matriz_despesas("INVESTIMENTO", "regular")}
    assert custeio["obras"] == N.VEDADO and invest["obras"] == N.COM_CONDICOES
    assert invest["pessoal"] == N.VEDADO and custeio["veiculos"] == N.ANALISE
    # emenda de incremento: pessoal não é presumido
    emenda = {c["categoria"]: c["classificacao"] for c in ag.matriz_despesas("CUSTEIO", "emenda")}
    assert emenda["pessoal"] == N.ANALISE
    # sem natureza confirmada → tudo exige análise
    assert {c["classificacao"] for c in ag.matriz_despesas("EM ANÁLISE", "regular")} == {N.ANALISE}


def test_toda_citacao_aponta_para_dispositivo_conferido():
    for d in N.DISPOSITIVOS.values():
        assert d["norma"] in N.NORMAS and d["conferencia"]


def _t(**kw):
    base = dict(municipio_ibge="130014", municipio_nome="Apuí", uf="AM", cnpj_fundo="12.834.320/0001-26",
                exercicio=2026, mes=5, fonte="consultafns", ativo=True, data_pagamento=date(2026, 5, 6))
    base.update(kw)
    base.setdefault("chave_unica", f"k{kw['numero_ob']}")
    return TransferenciaFns(**base)


async def _popular(S):
    async with S() as db:
        db.add_all([
            _t(numero_portaria="3493", numero_ob="1", bloco=MANUT, grupo="ATENÇÃO PRIMÁRIA",
               acao_detalhada="INCENTIVO FINANCEIRO DA APS - EQUIPES DE SAÚDE DA FAMÍLIA/ESF", valor_liquido=Decimal("209826")),
            _t(numero_portaria="3493", numero_ob="2", mes=6, bloco=MANUT, grupo="ATENÇÃO PRIMÁRIA",
               acao_detalhada="INCENTIVO FINANCEIRO DA APS - EQUIPES DE SAÚDE DA FAMÍLIA/ESF", valor_liquido=Decimal("209826")),
            _t(numero_portaria="900", numero_ob="3", bloco=MANUT, grupo="ATENÇÃO PRIMÁRIA",
               acao_detalhada="AQUISIÇÃO DE EQUIPAMENTOS", valor_liquido=Decimal("100")),
            _t(numero_portaria="900", numero_ob="4", bloco=ESTRUT, grupo="ATENÇÃO PRIMÁRIA",
               acao_detalhada="AQUISIÇÃO DE EQUIPAMENTOS", valor_liquido=Decimal("50000")),
            _t(numero_portaria=None, numero_ob="5", bloco="", grupo="CONTRATO DE GESTÃO",
               acao_detalhada="CONTRATO", valor_liquido=Decimal("700")),
            # outro município — não pode aparecer
            _t(municipio_ibge="139998", numero_portaria="3493", numero_ob="6", bloco=MANUT,
               grupo="ATENÇÃO PRIMÁRIA", acao_detalhada="X", valor_liquido=Decimal("999999")),
        ])
        await db.commit()


async def test_painel_consolida_sem_dupla_contagem_e_isola_municipio(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    await _popular(S)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    d = (await c.get("/api/fns-portarias-ia/painel?exercicio=2026", headers=_h(tok))).json()
    k = d["consolidado"]
    assert k["total_custeio"] == 419752.0
    assert k["total_investimento"] == 50000.0
    assert k["total_pendente"] == 700.0
    assert k["total_geral"] == 470452.0          # = soma das transferências do município, uma vez cada
    assert k["transferencias_analisadas"] == 5
    assert k["transferencias_sem_identificacao"] == 1
    porta = {p["numero_portaria"]: p for p in d["portarias"]}
    assert porta["900"]["naturezas"] == ["CUSTEIO", "INVESTIMENTO"]   # cada transferência classificada sozinha
    assert porta[ag.SEM_PORTARIA]["situacao"] == "pendente_confirmacao"

    # município B não vê nada de Apuí
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    db_ = (await c.get("/api/fns-portarias-ia/painel?exercicio=2026", headers=_h(tok_b))).json()
    assert db_["portarias"] == [] and db_["consolidado"]["total_geral"] == 0

    # transferências originais não foram alteradas
    async with S() as db:
        assert len((await db.execute(select(TransferenciaFns))).scalars().all()) == 6


async def test_detalhe_validacao_e_reanalise_quando_dados_mudam(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    await _popular(S)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = (await c.get("/api/fns-portarias-ia/portaria?exercicio=2026&numero=3493", headers=_h(tok))).json()
    assert r["identificacao"]["valor_transferido"] == 419652.0
    assert set(r["despesas"]) == {"CUSTEIO"}
    assert "Portaria nº 3493 não cadastrada" in r["pendencias"][0]
    assert r["saldos"]["bancario"] is None and r["saldos"]["disponivel_estimado"] is None
    assert len(r["orientacao"].splitlines()) <= 5
    assert any(f["chave"] == "PRC6_5_P1_V" for f in r["fundamentacao"])

    tok_consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/fns-portarias-ia/validar", json={"numero": "3493", "exercicio": 2026},
                         headers=_h(tok_consulta))).status_code == 403
    assert (await c.post("/api/fns-portarias-ia/validar", json={"numero": "3493", "exercicio": 2026, "nota": "ok"},
                         headers=_h(tok))).status_code == 200
    d = (await c.get("/api/fns-portarias-ia/painel?exercicio=2026", headers=_h(tok))).json()
    assert {p["numero_portaria"]: p["situacao"] for p in d["portarias"]}["3493"] == "validada"

    # chega transferência nova da mesma portaria → reanalisa e a validação cai
    async with S() as db:
        db.add(_t(numero_portaria="3493", numero_ob="7", mes=7, bloco=MANUT, grupo="ATENÇÃO PRIMÁRIA",
                  acao_detalhada="INCENTIVO FINANCEIRO DA APS - EQUIPES DE SAÚDE DA FAMÍLIA/ESF",
                  valor_liquido=Decimal("1000")))
        await db.commit()
    d = (await c.get("/api/fns-portarias-ia/painel?exercicio=2026", headers=_h(tok))).json()
    p = {p["numero_portaria"]: p for p in d["portarias"]}["3493"]
    assert p["situacao"] == "preliminar" and p["qtd_transferencias"] == 3
    async with S() as db:
        a = (await db.execute(select(FnsPortariaAnalise).where(FnsPortariaAnalise.numero_portaria == "3493",
                                                               FnsPortariaAnalise.municipio_ibge == "1300144"))).scalar_one()
        assert a.resultado["validacao_anterior"]["nota"] == "ok"


async def test_consulta_sem_chave_da_ia_responde_503(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    await _popular(S)
    from config import settings
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "")
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.post("/api/fns-portarias-ia/consultar",
                     json={"numero": "3493", "exercicio": 2026, "pergunta": "Posso adquirir um veículo?"},
                     headers=_h(tok))
    assert r.status_code == 503


def test_resposta_da_ia_so_aceita_citacoes_da_base():
    analise = {"situacao": "preliminar"}
    r = ag.montar_resposta({"classificacao": N.PERMITIDO, "categoria": "veiculos", "justificativa": "x",
                            "base_legal": [{"chave": "LEI_INVENTADA", "como_se_aplica": "y"}],
                            "condicoes": [], "falta_confirmar": [], "orientacao": "z"}, analise, "m")
    assert r["classificacao"] == N.ANALISE and r["base_legal"] == [] and r["citacoes_descartadas"] == ["LEI_INVENTADA"]
    r = ag.montar_resposta({"classificacao": N.VEDADO, "categoria": "obras", "justificativa": "x",
                            "base_legal": [{"chave": "PRC6_5_P1_V", "como_se_aplica": "y"}],
                            "condicoes": [], "falta_confirmar": [], "orientacao": "z"}, analise, "m")
    assert r["classificacao"] == N.VEDADO and r["base_legal"][0]["dispositivo"] == "art. 5º, § 1º, V"
    # análise pendente nunca vira "permitido"
    r = ag.montar_resposta({"classificacao": N.PERMITIDO, "categoria": "consumo", "justificativa": "x",
                            "base_legal": [{"chave": "PRC6_5_CAPUT", "como_se_aplica": "y"}],
                            "condicoes": [], "falta_confirmar": [], "orientacao": "z"},
                           {"situacao": "pendente_confirmacao"}, "m")
    assert r["classificacao"] == ag.PENDENTE_TXT.upper()


async def test_verificacao_normas_marca_alteracao(db_session, monkeypatch):
    class _Resp:
        status_code = 200
        encoding = "utf-8"

        def __init__(self, txt):
            self.content = txt.encode()

    textos = {n["url"]: " ".join(d["conferencia"] for d in N.DISPOSITIVOS.values() if d["norma"] == k)
              for k, n in N.NORMAS.items()}
    textos[N.NORMAS["LC172"]["url"]] = "ciência ao respectivo Conselho de Saúde exercício financeiro de 2027"

    class _Cli:
        def __init__(self, *a, **k): ...
        async def __aenter__(self): return self
        async def __aexit__(self, *a): ...
        async def get(self, url): return _Resp(textos[url])

    import httpx
    monkeypatch.setattr(httpx, "AsyncClient", _Cli)
    r = await ag.verificar_normas(db_session)
    assert r["nao_conferem"] == ["LC172_5"]        # prazo mudou no texto oficial → alerta
    estado = await ag._estado_normas(db_session)
    assert estado["LC172_5"]["confere"] is False and estado["PRC6_5_P1_V"]["confere"] is True


def test_portaria_com_finalidades_diferentes_tem_uma_matriz_para_cada():
    """Formato real da Portaria 3493 no FNS: Piso APS e vencimento de ACS na mesma portaria."""
    ts = [TransferenciaFns(id=1, bloco=MANUT, grupo="ATENÇÃO PRIMÁRIA", acao="PISO DE ATENÇÃO PRIMÁRIA À SAÚDE",
                           acao_detalhada="INCENTIVO FINANCEIRO DA APS - EQUIPES MULTIPROFISSIONAIS - EMULTI",
                           valor_liquido=Decimal("100")),
          TransferenciaFns(id=2, bloco=MANUT, grupo="ATENÇÃO PRIMÁRIA",
                           acao="TRANSFERÊNCIA AOS ENTES FEDERATIVOS PARA O PAGAMENTO DOS VENCIMENTOS DOS AGENTES COMUNITÁRIOS DE SAÚDE",
                           acao_detalhada="AGENTES COMUNITÁRIOS DE SAÚDE", valor_liquido=Decimal("200"))]
    r = ag.analisar("3493", ts, exercicio=2026, documentos={}, propostas_ob={}, propostas_is={}, execucao={},
                    estado_normas={})
    assert len(r["despesas"]) == 2
    acs = next(v for k, v in r["despesas"].items() if "ACS" in k)
    regular = next(v for k, v in r["despesas"].items() if "regular" in k)
    assert {c["categoria"]: c["classificacao"] for c in acs}["consumo"] == N.ANALISE
    assert {c["categoria"]: c["classificacao"] for c in regular}["consumo"] == N.PERMITIDO
    assert [t["finalidade"] for t in r["transferencias"]][1].startswith("Assistência financeira complementar")


def test_link_oficial_so_aceita_dominios_oficiais():
    assert ag.link_oficial_valido("https://www.in.gov.br/web/dou/-/portaria-gm/ms-n-3.493-de-10-de-abril-de-2024-553925580")
    assert ag.link_oficial_valido("https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt3493_11_04_2024.html")
    assert not ag.link_oficial_valido("http://www.in.gov.br/x")              # sem https
    assert not ag.link_oficial_valido("https://in.gov.br.golpe.com/x")
    assert not ag.link_oficial_valido("javascript:alert(1)")
    assert ag.numero_formatado("10146") == "10.146" and ag.numero_formatado("3493") == "3.493"
    assert ag._numero_no_titulo("PORTARIA GM/MS Nº 10.146, DE 3 DE SETEMBRO DE 2026") == "10146"
    assert "Portaria+GM%2FMS+n%C2%BA+3.493" in ag.url_busca_dou("3493")


async def test_analise_tecnica_traz_link_da_portaria(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    await _popular(S)
    from models.portaria_dou import PortariaDOU
    async with S() as db:
        db.add_all([
            PortariaDOU(titulo="PORTARIA GM/MS Nº 3.493, DE 10 DE ABRIL DE 2024", numero="3.493",
                        data_publicacao="2024-04-11", orgao="Ministério da Saúde/Gabinete do Ministro",
                        url_oficial="https://www.in.gov.br/web/dou/-/portaria-gm/ms-n-3.493-de-10-de-abril-de-2024",
                        chave_dedup="a" * 32),
            # mesmo número, publicada depois do exercício → não serve
            PortariaDOU(titulo="PORTARIA GM/MS Nº 3.493, DE 2 DE MARÇO DE 2027", numero="3.493",
                        data_publicacao="2027-03-03", url_oficial="https://www.in.gov.br/web/dou/-/outra",
                        chave_dedup="b" * 32),
        ])
        await db.commit()
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = (await c.get("/api/fns-portarias-ia/portaria?exercicio=2026&numero=3493", headers=_h(tok))).json()
    links = r["links"]
    assert [d["ano"] for d in links["dou"]] == [2024]
    assert links["cadastrado"] == [] and "3.493" in links["busca_dou"]

    # gestor registra o link oficial → catálogo → identificação com ano e link
    url = "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2024/prt3493_11_04_2024.html"
    ruim = await c.post("/api/fns-portarias-ia/documento", headers=_h(tok),
                        json={"numero": "3493", "exercicio": 2026, "ano": 2024, "link": "https://site-falso.com/p"})
    assert ruim.status_code == 422
    tok_consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/fns-portarias-ia/documento", headers=_h(tok_consulta),
                         json={"numero": "3493", "exercicio": 2026, "ano": 2024, "link": url})).status_code == 403
    ok = await c.post("/api/fns-portarias-ia/documento", headers=_h(tok),
                      json={"numero": "3493", "exercicio": 2026, "ano": 2024, "link": url, "data_publicacao": "2024-04-11"})
    assert ok.status_code == 200, ok.text
    r = (await c.get("/api/fns-portarias-ia/portaria?exercicio=2026&numero=3493", headers=_h(tok))).json()
    assert r["links"]["cadastrado"][0]["link"] == url
    assert r["identificacao"]["ano"] == 2024 and r["identificacao"]["link"] == url
    # link diferente para a mesma portaria/ano não sobrescreve o cadastrado
    outro = await c.post("/api/fns-portarias-ia/documento", headers=_h(tok),
                         json={"numero": "3493", "exercicio": 2026, "ano": 2024, "link": "https://www.in.gov.br/web/dou/-/x"})
    assert outro.status_code == 422


async def test_pdf_da_analise_tecnica(ambiente):
    c, S = ambiente["client"], ambiente["Session"]
    await _popular(S)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    for numero in ("3493", "900", "Sem portaria"):
        r = await c.get("/api/fns-portarias-ia/portaria/pdf", params={"exercicio": 2026, "numero": numero},
                        headers=_h(tok))
        assert r.status_code == 200, r.text
        assert r.headers["content-type"] == "application/pdf"
        assert r.content.startswith(b"%PDF") and len(r.content) > 3000
    assert 'analise-tecnica-portaria-3493-2026.pdf' in (await c.get(
        "/api/fns-portarias-ia/portaria/pdf", params={"exercicio": 2026, "numero": "3493"},
        headers=_h(tok))).headers["content-disposition"]
    # outro município não gera PDF das portarias de Apuí
    tok_b = await _token(c, "gestor.b@teste.gov.br")
    assert (await c.get("/api/fns-portarias-ia/portaria/pdf", params={"exercicio": 2026, "numero": "3493"},
                        headers=_h(tok_b))).status_code == 404


async def test_enviar_pdf_por_email(ambiente, monkeypatch):
    c, S = ambiente["client"], ambiente["Session"]
    await _popular(S)
    tok = await _token(c, "gestor.apui@teste.gov.br")
    corpo = {"numero": "3493", "exercicio": 2026, "destinatarios": ["secretaria@apui.am.gov.br"]}

    tok_consulta = await _token(c, "ana.consulta@apui.gov.br")
    assert (await c.post("/api/fns-portarias-ia/portaria/enviar-email", json=corpo,
                         headers=_h(tok_consulta))).status_code == 403
    assert (await c.post("/api/fns-portarias-ia/portaria/enviar-email",
                         json={**corpo, "destinatarios": ["nao-e-email"]}, headers=_h(tok))).status_code == 422

    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    r = await c.post("/api/fns-portarias-ia/portaria/enviar-email", json=corpo, headers=_h(tok))
    assert r.status_code == 503 and "Baixe o PDF" in r.json()["detail"]

    enviados = []

    class _Resp:
        status_code = 200
        text = "{}"

    class _Cli:
        def __init__(self, *a, **k): ...
        async def __aenter__(self): return self
        async def __aexit__(self, *a): ...
        async def post(self, url, headers=None, json=None):
            enviados.append(json)
            return _Resp()

    import httpx
    monkeypatch.setenv("RESEND_API_KEY", "chave-ficticia-de-teste")
    monkeypatch.setattr(httpx, "AsyncClient", _Cli)
    r = await c.post("/api/fns-portarias-ia/portaria/enviar-email",
                     json={**corpo, "mensagem": "Para conhecimento."}, headers=_h(tok))
    assert r.status_code == 200, r.text
    msg = enviados[0]
    assert msg["to"] == ["secretaria@apui.am.gov.br"]
    assert "Portaria nº 3.493" in msg["subject"]
    assert msg["attachments"][0]["filename"] == "analise-tecnica-portaria-3493-2026.pdf"
    import base64
    assert base64.b64decode(msg["attachments"][0]["content"]).startswith(b"%PDF")
