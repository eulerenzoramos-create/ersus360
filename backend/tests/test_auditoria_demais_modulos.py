"""Auditoria etapa 5 (21/10/2026): módulos que exibiam dado de outro assunto com o rótulo da tela.

Sem fonte específica integrada, o dashboard responde nao_disponivel com a nota — e não consulta
SIA/SIH/CNES/SINASC/SIOPS para preencher a tela com totais que não medem aquele assunto.
"""
import importlib

import pytest

SEM_FONTE = [
    "acesso_especialidades_apui",
    "banco_leite_apui",
    "cadeia_frio_apui",
    "ceac_ambulatorial_apui",
    "farmacovigilancia_apui",
    "judicializacao_saude_apui",
    "matriciamento_nasf_apui",
    "saude_populacao_rua_apui",
    "suas_sus_apui",
]


@pytest.mark.parametrize("nome", SEM_FONTE)
async def test_modulo_sem_fonte_responde_nao_disponivel(nome):
    mod = importlib.import_module(f"routers.{nome}")
    for fn in (mod.dashboard, mod.indicadores):
        r = await fn(ano=2025)
        assert r["situacao_dado"] == "nao_disponivel"
        assert r["dados"] is None
        assert r["nota"]
        # nenhum total de outro sistema sobra na resposta
        for campo in ("producao", "producao_ambulatorial", "estabelecimentos", "internacoes",
                      "valor_internacoes", "despesa_total_saude", "nascidos_vivos", "cobertura_vacinal", "agravos"):
            assert campo not in r


async def test_lista_espera_continua_respondendo():
    from routers import acesso_especialidades_apui as mod
    r = await mod.lista_espera()
    assert r["situacao_dado"] == "nao_disponivel"


async def test_comite_sem_taxa_infantil_calculada_com_obitos_gerais(monkeypatch):
    from routers import comite_mortalidade_apui as mod

    async def obitos(ano):
        return {"total_obitos": 90, "situacao_dado": "oficial_validado"}

    async def nascidos(ano):
        return {"total_nascidos": 450, "situacao_dado": "oficial_validado"}

    monkeypatch.setattr(mod, "buscar_obitos", obitos)
    monkeypatch.setattr(mod, "buscar_nascidos_vivos", nascidos)
    r = await mod.dashboard(ano=2025)
    assert r["obitos"] == 90 and r["nascidos_vivos"] == 450
    assert "taxa_mortalidade_infantil_estimada" not in r


async def test_gestao_riscos_sem_internacoes_nem_limiar_fixo(monkeypatch):
    from routers import gestao_riscos_saude_apui as mod

    async def agravos(ano):
        return [{"agravo": "malaria", "total_casos": 500, "situacao_dado": "oficial_validado"}]

    async def malaria(ano):
        return {"total_casos": 500, "situacao_dado": "oficial_validado"}

    monkeypatch.setattr(mod, "buscar_agravos_resumo", agravos)
    monkeypatch.setattr(mod, "buscar_malaria", malaria)
    r = await mod.dashboard(ano=2025)
    assert r["situacao_dado"] == "oficial_validado"
    assert r["casos_malaria"] == 500
    assert "internacoes" not in r and "alertas" not in r


async def test_saude_sexual_sem_total_sih(monkeypatch):
    from routers import saude_sexual_reprodutiva_apui as mod

    async def nascidos(ano):
        return {"total_nascidos": 450, "situacao_dado": "oficial_validado"}

    monkeypatch.setattr(mod, "buscar_nascidos_vivos", nascidos)
    r = await mod.dashboard(ano=2025)
    assert r["nascidos_vivos"] == 450
    assert "internacoes" not in r


# ── Parte 2: routers sem fonte (proxy) e dados escritos no código ─────────────────────────────────

import inspect  # noqa: E402
import pathlib  # noqa: E402

ROUTERS = pathlib.Path(__file__).resolve().parent.parent / "routers"
MARCAS = ("devolvia dados de\noutro assunto (proxy)", 'rotulados "referencia_municipal" — removidos')
# Painel sem fonte, mas com uma rota legítima mantida (lista de estabelecimentos do CNES)
PAINEL_SEM_FONTE_COM_CNES = {"infraestrutura_ubs_apui"}
SEM_FONTE_AUTO = sorted(
    p.stem for p in ROUTERS.glob("*.py")
    if any(m in p.read_text(encoding="utf-8") for m in MARCAS) and p.stem not in PAINEL_SEM_FONTE_COM_CNES
)


async def test_infraestrutura_ubs_painel_sem_proxy_e_cnes_mantido():
    from routers import infraestrutura_ubs_apui as mod
    for fn in (mod.dashboard, mod.indicadores):
        r = await fn()
        assert r["situacao_dado"] == "nao_disponivel" and r["dados"] is None
    assert "/api/infraestrutura-ubs-apui/estabelecimentos" in {r.path for r in mod.router.routes}


def test_varredura_encontrou_os_routers_reescritos():
    # 9 (parte 1) + 67 proxies + monitoramento_rt + 7 com dados no código
    assert len(SEM_FONTE_AUTO) >= 80


@pytest.mark.parametrize("nome", SEM_FONTE_AUTO)
async def test_router_sem_fonte_nao_consulta_nada_e_responde_nao_disponivel(nome):
    mod = importlib.import_module(f"routers.{nome}")
    assert "from services" not in inspect.getsource(mod), "não deve consultar fonte de outro assunto"
    for rota in mod.router.routes:
        if "GET" not in rota.methods:
            continue
        params = {p: "1" for p in inspect.signature(rota.endpoint).parameters if p not in ("ano", "_")}
        r = await rota.endpoint(**params)
        assert r["situacao_dado"] == "nao_disponivel", rota.path
        assert r["dados"] is None and r["nota"], rota.path


@pytest.mark.parametrize("nome,trecho", [
    ("cms", "Maria de Fátima"), ("absenteismo", "João Carlos Silva"), ("patrimonio", "QRM-1A23"),
    ("ouvidoria", "OUV-001"), ("contratos", "CT-2025-001"), ("relatorios", "PMAQ"), ("frota", "18640"),
])
def test_dados_escritos_no_codigo_foram_removidos(nome, trecho):
    assert trecho not in (ROUTERS / f"{nome}.py").read_text(encoding="utf-8")


async def test_exportar_relatorio_sem_fonte_nao_gera_arquivo():
    from routers import relatorios
    for fn in (relatorios.exportar_pdf, relatorios.exportar_csv):
        r = await fn()
        assert r.status_code == 404


async def test_exportador_nao_finge_arquivo_gerado():
    from routers import exportador
    r = await exportador.gerar({"relatorio_id": "REL-001"}, _=None)
    assert r["status"] == "indisponivel" and r["url_download"] is None
    res = await exportador.resumo(_=None)
    assert res["geracoes_mes"] is None and res["ultima_exportacao"] is None


async def test_rota_inexistente_responde_com_dados_nulo():
    # Sem "dados": None o apiGet do frontend entregava o objeto às telas, que quebravam em .map()
    import main
    from starlette.requests import Request
    req = Request({"type": "http", "method": "GET", "path": "/api/x/y", "headers": [], "query_string": b""})
    r = await main.api_catchall("x/y", req)
    import json
    corpo = json.loads(r.body)
    assert corpo["situacao_dado"] == "nao_disponivel" and corpo["dados"] is None


def test_auditoria_nao_encobre_o_painel_da_central():
    from routers import auditoria
    assert "/api/auditoria/dashboard" not in {r.path for r in auditoria.router.routes}


# ── Serviços DATASUS: página cheia não vira total ─────────────────────────────────────────────────

@pytest.mark.parametrize("modulo,funcao,limite", [
    ("services.sih_service", "buscar_internacoes", 500),
    ("services.sinan_service", "buscar_malaria", 500),
    ("services.sinan_service", "buscar_dengue", 500),
    ("services.sim_sinasc_service", "buscar_obitos", 200),
    ("services.sim_sinasc_service", "buscar_nascidos_vivos", 500),
    ("services.sia_service", "buscar_producao", 500),
])
async def test_consulta_no_limite_nao_e_contada_como_total(monkeypatch, modulo, funcao, limite):
    mod = importlib.import_module(modulo)

    async def pagina_cheia(url, params):
        return [{"id": i} for i in range(limite)]

    monkeypatch.setattr(mod, "_get", pagina_cheia)
    monkeypatch.setattr(mod, "ibge6", lambda: "130014", raising=False)
    monkeypatch.setattr(mod, "populacao", lambda: 20000, raising=False)
    r = await getattr(mod, funcao)(2025)
    assert r["situacao_dado"] == "nao_disponivel"
    assert str(limite) in r["nota"]

    async def pagina_parcial(url, params):
        return [{"id": i} for i in range(limite - 1)]

    monkeypatch.setattr(mod, "_get", pagina_parcial)
    r = await getattr(mod, funcao)(2025)
    assert r["situacao_dado"] == "oficial_validado"


# ── TMI com óbitos de todas as idades e internações "obstétricas estimadas" ───────────────────────

@pytest.mark.parametrize("nome", ["materno_infantil_apui", "saude_crianca_apui"])
async def test_sem_tmi_calculada_com_obitos_gerais(monkeypatch, nome):
    mod = importlib.import_module(f"routers.{nome}")

    async def obitos(ano):
        return {"total_obitos": 90, "situacao_dado": "oficial_validado"}

    async def nascidos(ano):
        return {"total_nascidos": 450, "situacao_dado": "oficial_validado"}

    monkeypatch.setattr(mod, "buscar_obitos", obitos)
    monkeypatch.setattr(mod, "buscar_nascidos_vivos", nascidos)
    monkeypatch.setattr(mod, "cache_get", lambda *a, **k: None, raising=False)
    monkeypatch.setattr(mod, "cache_set", lambda *a, **k: None, raising=False)
    r = await mod.dashboard(ano=2025)
    assert "taxa_mortalidade_infantil_estimada" not in r and "nota_tmi" in r
    assert not any(k.startswith("internacoes") for k in r)


async def test_mortalidade_infantil_sem_alerta_falso():
    from routers import saude_crianca_apui as mod
    r = await mod.mortalidade_infantil(ano=2025)
    assert r["situacao_dado"] == "nao_disponivel" and "alertas" not in r


async def test_prenatal_sem_internacoes_obstetricas_estimadas(monkeypatch):
    from routers import prenatal_risco_gestacional_apui as mod

    async def nascidos(ano):
        return {"total_nascidos": 450, "situacao_dado": "oficial_validado"}

    monkeypatch.setattr(mod, "buscar_nascidos_vivos", nascidos)
    r = await mod.dashboard(ano=2025)
    assert "internacoes_obstetricas_estimadas" not in r and r["nascidos_vivos"] == 450
