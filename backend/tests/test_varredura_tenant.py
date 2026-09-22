"""
Varredura completa: TODAS as rotas GET da API chamadas como usuário de outro
município (internet simulada). Nenhuma pode devolver dados de Apuí nem
consultar fontes externas com o IBGE de Apuí. Reprovação aqui = não publicar.
"""
from tests.varredura_tenant import executar


async def test_nenhuma_rota_get_vaza_dados_de_apui():
    rel = await executar()
    assert rel.total > 500  # a varredura realmente percorreu a API
    detalhes = "\n".join(f"{v.rota} [{v.status}] {v.motivo}: {v.trecho}" for v in rel.vazamentos)
    assert not rel.vazamentos, f"{len(rel.vazamentos)} rota(s) com vazamento:\n{detalhes}"
    # rotas só-Apuí foram de fato bloqueadas para o outro município
    assert len(rel.bloqueadas) > 50


# Rotas que abrem sessão própria no banco (fora de get_db) e por isso não
# enxergam o banco de teste — não são erro do código.
_SESSAO_PROPRIA = {"/api/gateway/status", "/api/gateway/transmissoes"}


async def test_nenhuma_rota_get_quebra_para_outro_municipio():
    rel = await executar()
    erros = [e for e in rel.erros if e.rota not in _SESSAO_PROPRIA]
    detalhes = "\n".join(f"{e.rota} [{e.status}] {e.motivo}: {e.trecho}" for e in erros)
    assert not erros, f"{len(erros)} rota(s) com erro:\n{detalhes}"
