"""
Agente de extração — Regularização de Contas de Emendas (FNS → ERSUS360).

Lê o painel público "Regularização Contas Emendas" do FNS (Qlik, sem login), aplica
UF / MUNICIPIO / ESFERA, extrai 100% das linhas da tabela "Situação de Regularidade de Contas"
e (opcional) envia o JSON ao ERSUS360 em POST /api/investsus/regularizacao-contas/ingest.

O backend do ERSUS360 já faz a mesma coleta sozinho (job diário 06:50 e botão "Atualizar do
FNS"). Este script serve para rodar fora do servidor — por exemplo, se o FNS bloquear o IP
do Railway — ou para auditar a extração.

Uso (a partir da raiz do repositório):

    python scripts/investsus/agente_regularizacao_contas.py --uf AM --municipio "Apuí" --saida contas.json
    ERSUS360_TOKEN=... python scripts/investsus/agente_regularizacao_contas.py --uf AM --municipio "Apuí" \
        --enviar https://ersus360-production.up.railway.app

O token vai SEMPRE em variável de ambiente e no cabeçalho Authorization (nunca na URL nem no código).
É o token de um usuário do próprio município (perfil admin/gestor/financeiro); o backend rejeita o lote
inteiro se alguma conta for de outro município.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "backend"))

from services import investsus_regularizacao_contas as reg  # noqa: E402


async def _main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--uf", default=os.getenv("REG_CONTAS_UF", "AM"))
    ap.add_argument("--municipio", default=os.getenv("REG_CONTAS_MUNICIPIO", "APUI"))
    ap.add_argument("--esfera", default="MUNICIPAL", choices=["MUNICIPAL", "ESTADUAL"])
    ap.add_argument("--saida", help="grava o JSON neste arquivo")
    ap.add_argument("--enviar", help="URL base do ERSUS360 para POST no ingest (token em ERSUS360_TOKEN)")
    a = ap.parse_args()

    payload = await reg.coletar(a.uf, a.municipio, a.esfera)
    r = payload["metadata"]["resumo"]
    print(f"{payload['metadata']['filtros_aplicados']}: {r['total_contas']} conta(s), "
          f"{r['total_regularizadas']} regularizada(s), {r['total_pendentes']} pendente(s)", file=sys.stderr)

    texto = json.dumps(payload, ensure_ascii=False, indent=2)
    if a.saida:
        Path(a.saida).write_text(texto, encoding="utf-8")
    elif not a.enviar:
        print(texto)

    if a.enviar:
        import httpx
        token = os.getenv("ERSUS360_TOKEN")
        if not token:
            print("Defina ERSUS360_TOKEN para enviar.", file=sys.stderr)
            return 2
        url = a.enviar.rstrip("/") + "/api/investsus/regularizacao-contas/ingest"
        async with httpx.AsyncClient(timeout=60) as c:
            resp = await c.post(url, json=payload, headers={"Authorization": f"Bearer {token}"})
        print(f"ERSUS360 respondeu {resp.status_code}: {resp.text[:500]}", file=sys.stderr)
        return 0 if resp.is_success else 1
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(_main()))
