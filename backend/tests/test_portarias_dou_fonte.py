"""
Agente de Portarias MS — leitura real do leiturajornal e envio do e-mail diário.

O HTML de teste reproduz o formato do portal in.gov.br/leiturajornal verificado
em 26/10/2026: <script id="params" type="application/json">{"jsonArray": [...]}
com title, artType, hierarchyStr e urlTitle. Títulos e hierarquias são de atos
reais publicados no DOU de 20/10, 21/10 e 26/10/2026.
"""
import json
from datetime import date

import httpx
import pytest
from sqlalchemy import select

import database
import services.portarias_dou_service as svc
from models.email_diario import EmailDiarioLog, StatusEnvio


def _pagina(itens: list[dict]) -> str:
    params = {"section": "do1", "jsonArray": itens}
    return (
        "<html><body>"
        '<script type="application/json">{"jsonArray":[]}</script>'
        f'<script id="params" type="application/json">{json.dumps(params, ensure_ascii=False)}</script>'
        "</body></html>"
    )


def _ato(title, hierarchy, art_type="Portaria", url_title="ato-1"):
    return {"pubName": "DO1", "title": title, "artType": art_type, "hierarchyStr": hierarchy,
            "urlTitle": url_title, "content": title, "pubDate": "20/10/2026"}


DO1 = _pagina([
    _ato("Portaria GM/ms Nº 12.293, DE 20 de outuBRO DE 2026", "Ministério da Saúde/Gabinete do Ministro",
         url_title="portaria-gm/ms-n-12.293-de-20-de-outubro-de-2026-739407892"),
    _ato("Portaria SGTES/MS Nº 398, DE 16 DE outubro DE 2026",
         "Ministério da Saúde/Secretaria de Gestão do Trabalho e da Educação na Saúde", url_title="sgtes-398"),
    _ato("PORTARIA INC Nº 403, DE 19 DE OUTUBRO DE 2026",
         "Ministério da Saúde/Secretaria de Atenção Especializada à Saúde/Instituto Nacional de Cardiologia",
         url_title="inc-403"),
    _ato("PORTARIA ANP Nº 382, DE 19 DE OUTUBRO DE 2026",
         "Ministério de Minas e Energia/Agência Nacional do Petróleo, Gás Natural e Biocombustíveis"),
    _ato("RESOLUÇÃO-RE Nº 4.214, DE 23 DE OUTUBRO DE 2026",
         "Ministério da Saúde/Agência Nacional de Vigilância Sanitária", art_type="Resolução"),
])
DO2 = _pagina([
    # DO2 = atos de pessoal: título genérico não é aceito só pela hierarquia
    _ato("PORTARIA Nº 1.140, DE 23 DE OUTUBRO DE 2026", "Ministério da Saúde/Secretaria-Executiva"),
    _ato("PORTARIA SGTES/MS Nº 399, DE 21 DE OUTUBRO DE 2026",
         "Ministério da Saúde/Secretaria de Gestão do Trabalho e da Educação na Saúde", url_title="sgtes-399"),
])


class _ClienteFalso:
    """Substitui httpx.AsyncClient; responde por seção ou levanta a exceção configurada."""
    paginas: dict = {}
    erro: Exception | None = None
    chamadas: list = []

    def __init__(self, *a, **kw):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *a):
        return False

    async def get(self, url, params=None, headers=None):
        _ClienteFalso.chamadas.append((url, dict(params or {})))
        if _ClienteFalso.erro:
            raise _ClienteFalso.erro
        secao = (params or {}).get("secao", "")
        return httpx.Response(200, text=_ClienteFalso.paginas.get(secao, _pagina([])))


@pytest.fixture
def dou_falso(monkeypatch):
    _ClienteFalso.paginas = {"do1": DO1, "do2": DO2}
    _ClienteFalso.erro = None
    _ClienteFalso.chamadas = []
    monkeypatch.setattr(svc.httpx, "AsyncClient", _ClienteFalso)
    return _ClienteFalso


# ── Extração e validação de órgão ────────────────────────────────────────────

def test_extrai_orgao_e_link_do_json_params():
    itens = svc._extrair_portarias_html(DO1)
    por_titulo = {p["title"]: p for p in itens}
    gm = por_titulo["Portaria GM/ms Nº 12.293, DE 20 de outuBRO DE 2026"]
    assert gm["orgaoName"] == "Ministério da Saúde/Gabinete do Ministro"
    assert gm["urlAddress"] == (
        "https://www.in.gov.br/web/dou/-/portaria-gm/ms-n-12.293-de-20-de-outubro-de-2026-739407892"
    )
    # Resolução não entra (não é portaria)
    assert not any("RESOLUÇÃO" in t for t in por_titulo)


@pytest.mark.parametrize("titulo, orgao", [
    ("Portaria SGTES/MS Nº 398, DE 16 DE outubro DE 2026", ""),
    ("PORTARIA INC Nº 403, DE 19 DE OUTUBRO DE 2026",
     "Ministério da Saúde/Secretaria de Atenção Especializada à Saúde/Instituto Nacional de Cardiologia"),
    # "educação" é fragmento de exclusão, mas a hierarquia do DOU é do MS
    ("PORTARIA CONJUNTA SGTES/SAES Nº 107, DE 21 DE OUTUBRO DE 2026",
     "Ministério da Saúde/Secretaria de Gestão do Trabalho e da Educação na Saúde"),
])
def test_aceita_portarias_ms(titulo, orgao):
    assert svc.confirmar_orgao_ms(orgao, titulo) is True


@pytest.mark.parametrize("titulo, orgao", [
    ("PORTARIA ANP Nº 382, DE 19 DE OUTUBRO DE 2026",
     "Ministério de Minas e Energia/Agência Nacional do Petróleo, Gás Natural e Biocombustíveis"),
    # Sigla de outro órgão no título vence a hierarquia
    ("PORTARIA GM/MMA Nº 1.807, DE 22 DE OUTUBRO DE 2026", "Ministério da Saúde/Gabinete do Ministro"),
    ("PORTARIA DE PESSOAL SGTES/MS Nº 10, DE 1 DE OUTUBRO DE 2026", "Ministério da Saúde"),
])
def test_rejeita_nao_ms(titulo, orgao):
    assert svc.confirmar_orgao_ms(orgao, titulo) is False


# ── Busca completa ───────────────────────────────────────────────────────────

async def test_dou_sem_resposta_termina_no_prazo_e_registra_falha(monkeypatch):
    # Em produção a busca passava dos 60 s do navegador ("timeout of 60000ms
    # exceeded") quando o in.gov.br não respondia ao servidor.
    import asyncio, time

    class _Travado(_ClienteFalso):
        async def get(self, url, params=None, headers=None):
            await asyncio.sleep(3600)

    monkeypatch.setattr(svc.httpx, "AsyncClient", _Travado)
    monkeypatch.setattr(svc, "PRAZO_LEITURA_S", 0.2)
    monkeypatch.setattr(svc, "PRAZO_API_S", 0.1)
    inicio = time.monotonic()
    aceitos, log = await svc._buscar_portarias_ms(date(2026, 10, 27))
    assert time.monotonic() - inicio < 1.5   # leitura e API em paralelo, não em série
    assert aceitos == []
    assert len(log["falhas"]) == 4
    assert all("não respondeu" in f for f in log["falhas"])


async def test_busca_le_edicao_completa_e_filtra_ms(dou_falso):
    aceitos, log = await svc._buscar_portarias_ms(date(2026, 10, 20))
    titulos = sorted(p["title"] for p in aceitos)
    assert titulos == sorted([
        "Portaria GM/ms Nº 12.293, DE 20 de outuBRO DE 2026",
        "Portaria SGTES/MS Nº 398, DE 16 DE outubro DE 2026",
        "PORTARIA INC Nº 403, DE 19 DE OUTUBRO DE 2026",
        "PORTARIA SGTES/MS Nº 399, DE 21 DE OUTUBRO DE 2026",
    ])
    assert log["falhas"] == []
    assert log["edicao"]["do1"] == {
        "atos": 5, "atos_ms": 4, "tipos_ms": {"Portaria": 3, "Resolução": 1},
    }
    # Uma requisição por seção; sem org=/ato= (o portal os ignora)
    secoes = [p for u, p in dou_falso.chamadas if u == svc.DOU_LEITURA]
    assert secoes == [{"data": "20-10-2026", "secao": "do1"}, {"data": "20-10-2026", "secao": "do2"}]


async def test_falha_de_rede_aparece_no_log(dou_falso):
    dou_falso.erro = httpx.ConnectError("[Errno 101] Network is unreachable")
    aceitos, log = await svc._buscar_portarias_ms(date(2026, 10, 26))
    assert aceitos == []
    assert any("leiturajornal/do1" in f and "Network is unreachable" in f for f in log["falhas"])


# ── E-mail ───────────────────────────────────────────────────────────────────

async def test_erro_de_configuracao_nao_repete(monkeypatch):
    chamadas = []

    async def envio(assunto, html):
        chamadas.append(1)
        return {"ok": False, "config": True, "erro": "RESEND_API_KEY não configurado"}

    monkeypatch.setattr(svc, "_enviar_email", envio)
    r = await svc._enviar_email_com_tentativas("a", "<p>x</p>")
    assert len(chamadas) == 1 and r["tentativas"] == 1 and not r["ok"]


async def test_erro_transitorio_tenta_tres_vezes(monkeypatch):
    chamadas = []

    async def envio(assunto, html):
        chamadas.append(1)
        return {"ok": len(chamadas) == 3, "erro": None if len(chamadas) == 3 else "timeout"}

    async def sem_espera(_):
        return None

    monkeypatch.setattr(svc, "_enviar_email", envio)
    monkeypatch.setattr(svc.asyncio, "sleep", sem_espera)
    r = await svc._enviar_email_com_tentativas("a", "<p>x</p>")
    assert r["ok"] and r["tentativas"] == 3


async def test_resend_403_remetente_de_teste_explica(monkeypatch):
    class _Post(_ClienteFalso):
        async def post(self, url, headers=None, json=None):
            return httpx.Response(403, text='{"message":"You can only send testing emails to your own email address"}')

    monkeypatch.setattr(svc.httpx, "AsyncClient", _Post)
    monkeypatch.setattr(svc, "RESEND_API_KEY", "chave-de-teste")
    monkeypatch.setattr(svc, "EMAIL_FROM", "onboarding@resend.dev")
    r = await svc._enviar_resend("a", "<p>x</p>")
    assert r["ok"] is False and r["config"] is True
    assert "EMAIL_FROM" in r["erro"]


def test_diagnostico_email_nao_expoe_segredo(monkeypatch):
    monkeypatch.setattr(svc, "EMAIL_PROVIDER", "resend")
    monkeypatch.setattr(svc, "RESEND_API_KEY", "re_segredo_123")
    d = svc.diagnostico_email()
    assert d["configurado"] is True and d["pendencias"] == []
    assert "re_segredo_123" not in json.dumps(d)
    monkeypatch.setattr(svc, "RESEND_API_KEY", "")
    assert svc.diagnostico_email()["pendencias"] == ["RESEND_API_KEY"]


async def test_execucao_registra_historico_do_painel(monkeypatch, db_session, dou_falso):
    """O painel 'Envios Diários' lê email_diario_log: toda execução precisa gravar nele."""
    from sqlalchemy.ext.asyncio import async_sessionmaker

    Session = async_sessionmaker(db_session.bind, expire_on_commit=False)
    monkeypatch.setattr(database, "AsyncSessionLocal", Session)
    monkeypatch.setattr(svc, "EMAIL_PROVIDER", "resend")
    monkeypatch.setattr(svc, "RESEND_API_KEY", "")

    r = await svc.executar_envio_diario(data_ref=date(2026, 10, 20), modo="manual")
    assert r["ok"] is False and r["tentativas"] == 1

    async with Session() as s:
        logs = (await s.execute(select(EmailDiarioLog))).scalars().all()
    assert len(logs) == 1
    log = logs[0]
    assert log.status == StatusEnvio.FALHA
    assert log.data_referencia == "2026-10-20"
    assert "RESEND_API_KEY" in log.erro
    assert log.qtd_portarias == 4 and log.enviado_em is None
