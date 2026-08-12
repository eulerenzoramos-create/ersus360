"""
Converte routers com dados fictícios (lru_cache/hardcode) para stubs nao_disponivel.
Preserva: prefix, tags, decorator de autenticação.
Não toca nos routers já reescritos com dados reais.
"""
import os
import re
import sys

ROUTERS_DIR = os.path.join(os.path.dirname(__file__), "..", "routers")

# Routers já reescritos com dados reais — não tocar
PRESERVAR = {
    "auth.py", "municipios.py", "municipio.py", "usuarios.py",
    "integracao.py", "integracao_status.py",
    "siaps_monitor.py", "scnes_conformidade.py", "cadsus_qualidade.py",
    "rnds_gateway.py", "score.py", "dashboard_exec.py", "financeiro.py",
    "relatorio_ersus.py", "painel_integracoes.py",
    # Serviços com API real
    "previne.py", "siops.py", "fns.py", "repasses.py", "convenios.py",
    "aps.py", "producao_aps.py", "auditoria_aps.py",
    "epidemiologia.py",
    # Infra
    "ws_alertas.py", "ws_acs.py", "exportador.py",
    "auditoria.py", "auditoria_dados.py", "auditoria_auto.py",
    "notificacoes.py", "alertas.py", "inconsistencias.py",
    "cadastros.py", "cvat_municipio.py",
    # Já tratados
    "linha_tempo.py",
}

TEMPLATE_ENDPOINT = '''
@router.{method}("{path}"{extra})
async def {func_name}({params}):
    """
    {docstring}
    Dados reais requerem integração local ou API pública não disponível para este módulo.
    """
    return {{
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": (
            "Este módulo requer integração com sistema local ou API pública "
            "não disponível automaticamente. Configure a integração no Railway "
            "ou insira os dados via formulário manual."
        ),
        "verificado_em": __import__("datetime").datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }}
'''

TEMPLATE_FILE = '''"""
Router: {prefix} — ERSUS 360
Dados reais pendentes de integração — situacao_dado = nao_disponivel.
Nenhum valor é simulado ou estimado.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="{prefix}", tags={tags})

{endpoints}
'''

TEMPLATE_ENDPOINT_SIMPLE = '''
@router.{method}("{path}"{extra})
async def {func_name}({params}):
    return {{
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }}
'''


def extrair_prefix_tags(content: str):
    m = re.search(r'APIRouter\(prefix\s*=\s*["\']([^"\']+)["\']', content)
    prefix = m.group(1) if m else "/api/modulo"

    m2 = re.search(r'tags\s*=\s*(\[[^\]]+\])', content)
    tags = m2.group(1) if m2 else '["modulo"]'

    return prefix, tags


def extrair_endpoints(content: str):
    pattern = re.compile(
        r'@router\.(get|post|put|delete|patch)\(\s*["\']([^"\']+)["\']([^)]*)\)\s*\n'
        r'(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)',
        re.MULTILINE,
    )
    return pattern.findall(content)


def tem_dados_ficticios(content: str) -> bool:
    indicators = [
        "lru_cache",
        # hardcoded lists/dicts with fake data
        '"nome": "',
        "'nome': '",
        "score_qualidade",
        "710 00",  # fake CNS
        "tendencia.*melhora",
        "referencia",
        # Fake numeric data
        "77.4", "82.3", "91.0", "76.4",
    ]
    for ind in indicators:
        if re.search(ind, content):
            return True
    return False


def converter_arquivo(filepath: str) -> bool:
    filename = os.path.basename(filepath)
    if filename in PRESERVAR:
        return False

    with open(filepath, encoding="utf-8", errors="replace") as f:
        content = f.read()

    if not tem_dados_ficticios(content):
        return False

    prefix, tags = extrair_prefix_tags(content)
    endpoints = extrair_endpoints(content)

    if not endpoints:
        return False

    # Gera stubs para cada endpoint
    eps = []
    for method, path, extra, func_name, params in endpoints:
        # Remove dependências de autenticação para simplificar
        simple_params = ""
        if "UserOut" in params or "get_current_user" in params:
            simple_params = "_: UserOut = Depends(get_current_user)"
        elif "db:" in params:
            simple_params = ""

        ep = TEMPLATE_ENDPOINT_SIMPLE.format(
            method=method,
            path=path,
            extra=extra.strip().rstrip(",") if extra.strip() else "",
            func_name=func_name,
            params=simple_params,
        )
        eps.append(ep)

    new_content = TEMPLATE_FILE.format(
        prefix=prefix,
        tags=tags,
        endpoints="\n".join(eps),
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)

    return True


def main():
    converted = []
    skipped = []
    errors = []

    files = sorted(f for f in os.listdir(ROUTERS_DIR) if f.endswith(".py") and not f.startswith("__"))

    for filename in files:
        filepath = os.path.join(ROUTERS_DIR, filename)
        try:
            if converter_arquivo(filepath):
                converted.append(filename)
            else:
                skipped.append(filename)
        except Exception as e:
            errors.append((filename, str(e)))

    print(f"Convertidos: {len(converted)}")
    print(f"Preservados: {len(skipped)}")
    print(f"Erros: {len(errors)}")
    if errors:
        for f, e in errors[:10]:
            print(f"  ERRO {f}: {e}")
    if "--verbose" in sys.argv:
        for f in converted:
            print(f"  OK: {f}")


if __name__ == "__main__":
    main()
