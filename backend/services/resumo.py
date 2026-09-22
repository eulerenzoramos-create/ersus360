"""Adaptador: listas dos serviços de dados abertos → resumo usado pelos painéis.

Não cria dado: lista vazia = "nao_disponivel"; a situação é a melhor situação
declarada pelos próprios itens (oficial só se algum item for oficial).
"""
from __future__ import annotations


def como_resumo(lista, chave: str = "historico") -> dict:
    if isinstance(lista, dict):  # já é um resumo
        return lista
    itens = list(lista or [])
    situacoes = {i.get("situacao_dado") for i in itens if isinstance(i, dict)}
    if not itens:
        situacao = "nao_disponivel"
    elif "oficial_validado" in situacoes:
        situacao = "oficial_validado"
    else:
        situacao = next((s for s in situacoes if s), "nao_disponivel")
    return {"situacao_dado": situacao, chave: itens}
