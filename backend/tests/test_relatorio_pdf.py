"""PDF de produção: sem dado real do e-SUS PEC, responde 'não disponível' (503)
em vez de quebrar com erro 500 — e nunca gera PDF com números inventados."""
from tests.test_isolamento_tenant import _h, _token, ambiente  # noqa: F401 (fixture)


async def test_pdf_producao_indisponivel_sem_dado_real(ambiente):
    c = ambiente["client"]
    tok = await _token(c, "gestor.apui@teste.gov.br")
    r = await c.get("/api/relatorios/gerar-pdf?tipo=mensal&mes=8&ano=2026", headers=_h(tok))
    assert r.status_code == 503
    assert r.json()["situacao_dado"] == "nao_disponivel"
    assert "e-SUS PEC" in r.json()["detail"]
