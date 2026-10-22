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
