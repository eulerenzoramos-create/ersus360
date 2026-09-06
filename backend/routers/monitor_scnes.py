"""
Router: /api/monitor/scnes — Disparo manual do relatório semanal SCNES/Sprint
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/monitor", tags=["Monitor SCNES"])


@router.post("/scnes/relatorio")
async def disparar_relatorio_scnes(current_user: UserOut = Depends(get_current_user)):
    """Dispara o relatório semanal SCNES/Sprint imediatamente (manual)."""
    from services.monitor_scnes_service import enviar_relatorio_semanal
    resultado = await enviar_relatorio_semanal()
    return resultado


@router.get("/scnes/status")
async def status_monitor_scnes(current_user: UserOut = Depends(get_current_user)):
    """Retorna configuração atual do monitor SCNES."""
    import os
    return {
        "habilitado": os.getenv("MONITOR_SCNES_ENABLED", "true").lower() != "false",
        "destinatario": os.getenv("MONITOR_EMAIL", "eulerenzoramos@gmail.com"),
        "resend_configurado": bool(os.getenv("RESEND_API_KEY")),
        "agenda": "toda segunda-feira às 07:00 (America/Manaus)",
        "pendencias_criticas": 3,
        "pendencias_total": 9,
    }
