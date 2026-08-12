"""
Router: /api/fns — Integração FNS / Ministério da Saúde

Endpoints:
  GET  /api/fns/status          → status do último sync
  GET  /api/fns/historico       → histórico de syncs
  POST /api/fns/sync            → sincroniza uma competência (preview ou gravar)
  POST /api/fns/sync-todos      → sincroniza últimas N competências
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/fns", tags=["FNS"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
