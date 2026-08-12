"""
Script: converter_fake_para_nao_disponivel_v2.py
Converte routers com dados fictícios para retornar situacao_dado: nao_disponivel.
Versão 2 — para routers simples sem lru_cache (gerados como stubs de área).
"""
import os, re, ast

ROUTERS_DIR = os.path.join(os.path.dirname(__file__), "..", "routers")

# Routers para PULAR (infraestrutura — sem dados de saúde fictícios)
SKIP = {
    "auth.py", "modulos.py", "integracao.py", "integracao_egestor_apui.py",
    "integracao_esuspec_apui.py", "integracao_fns_apui.py", "integracao_siaps_apui.py",
    "integracao_status.py", "ws_acs.py", "inconsistencias.py", "documentos.py",
    "portarias.py", "relatorio_producao_pdf.py", "usuarios.py",
    # já limpos
    "previne.py", "epidemiologia.py", "producao_aps.py", "siops.py",
    "linha_tempo.py", "auditoria_auto.py", "notificacoes.py", "ws_alertas.py",
    "exportador.py", "financeiro.py", "cadastros.py", "auditoria_aps.py",
    "folha_pagamento.py", "auditoria_dados.py", "score.py", "dashboard_exec.py",
    "bi.py", "cvat_municipio.py", "scnes_conformidade.py", "siaps_monitor.py",
    "cadsus_qualidade.py", "relatorio_ersus.py", "busca_ativa_ia.py",
    "integracao_egestor_apui.py",
}

TEMPLATE = '''{docstring}from fastapi import APIRouter

router = APIRouter(prefix="{prefix}", tags={tags})


@router.get("/dashboard")
async def dashboard():
    return {{
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }}
'''

def extrair_meta(conteudo: str, nome_arquivo: str):
    """Extrai prefix, tags e docstring do router existente."""
    # prefix
    m_prefix = re.search(r'APIRouter\([^)]*prefix\s*=\s*["\']([^"\']+)["\']', conteudo)
    prefix = m_prefix.group(1) if m_prefix else f"/api/{nome_arquivo.replace('.py','').replace('_','-')}"

    # tags
    m_tags = re.search(r'APIRouter\([^)]*tags\s*=\s*(\[[^\]]+\])', conteudo)
    tags = m_tags.group(1) if m_tags else f'["{nome_arquivo.replace(".py","")}"]'

    # docstring (primeira linha)
    m_doc = re.match(r'"""(.+?)"""', conteudo, re.DOTALL)
    docstring = f'"""{m_doc.group(1)}"""\n' if m_doc else ""

    return prefix, tags, docstring


def tem_dados_ficticios(conteudo: str) -> bool:
    """Verifica se o router tem dados fictícios (números hardcoded, listas estáticas)."""
    # Já tem nao_disponivel → pular
    if "nao_disponivel" in conteudo:
        return False
    # Tem números inteiros ou floats em valores de resposta
    if re.search(r':\s*\d{3,}', conteudo):  # ≥ 3 dígitos
        return True
    if re.search(r':\s*\d+\.\d+', conteudo):  # float
        return True
    # Tem listas de dicts hardcoded
    if re.search(r'return\s*\[', conteudo):
        return True
    return False


convertidos = 0
pulados = 0

for nome in sorted(os.listdir(ROUTERS_DIR)):
    if not nome.endswith(".py") or nome in SKIP or nome.startswith("__"):
        continue

    caminho = os.path.join(ROUTERS_DIR, nome)
    with open(caminho, encoding="utf-8") as f:
        conteudo = f.read()

    if not tem_dados_ficticios(conteudo):
        pulados += 1
        continue

    prefix, tags, docstring = extrair_meta(conteudo, nome)
    novo = TEMPLATE.format(docstring=docstring, prefix=prefix, tags=tags)

    with open(caminho, "w", encoding="utf-8") as f:
        f.write(novo)

    print(f"  [OK] {nome}")
    convertidos += 1

print(f"\nConvertidos: {convertidos} | Pulados: {pulados}")
