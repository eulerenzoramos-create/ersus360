"""
WebSocket /ws/alertas — Alertas em tempo real ERSUS 360
Snapshot inicial vem do banco de inconsistencias real.
Sem banco → snapshot vazio (nunca dados inventados).
"""
from __future__ import annotations
import asyncio
import json
import logging
from datetime import datetime
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WebSocket"])
logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._active.add(ws)
        logger.info("[WS] Cliente conectado — total: %d", len(self._active))

    def disconnect(self, ws: WebSocket) -> None:
        self._active.discard(ws)
        logger.info("[WS] Cliente desconectado — total: %d", len(self._active))

    async def broadcast(self, message: dict) -> None:
        dead: list[WebSocket] = []
        for ws in list(self._active):
            try:
                await ws.send_text(json.dumps(message, ensure_ascii=False, default=str))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._active.discard(ws)

    @property
    def count(self) -> int:
        return len(self._active)


manager = ConnectionManager()


async def _alertas_banco() -> list[dict]:
    try:
        from database import get_db_direct
        from models.inconsistencia import Inconsistencia
        from sqlalchemy import select
        async for db in get_db_direct():
            rows = (await db.execute(
                select(Inconsistencia)
                .where(Inconsistencia.situacao.in_(["identificada", "em_correcao"]))
                .order_by(Inconsistencia.criado_em.desc())
                .limit(20)
            )).scalars().all()
            return [
                {
                    "id":        row.id,
                    "nivel":     "CRITICO" if row.gravidade == "critica" else "AVISO",
                    "categoria": row.modulo or "Sistema",
                    "titulo":    (row.descricao or "")[:80],
                    "descricao": row.descricao or "",
                    "modulo":    row.modulo or "",
                    "lido":      False,
                }
                for row in rows
            ]
    except Exception:
        pass
    return []


@router.websocket("/ws/alertas")
async def ws_alertas(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        alertas = await _alertas_banco()
        await websocket.send_text(json.dumps({
            "tipo":           "snapshot",
            "alertas":        alertas,
            "total_nao_lidos": len([a for a in alertas if not a["lido"]]),
            "situacao_dado":  "oficial_validado" if alertas else "nao_disponivel",
            "ts":             datetime.utcnow().isoformat(),
        }, ensure_ascii=False))

        while True:
            await asyncio.sleep(30)
            await websocket.send_text(json.dumps({
                "tipo":           "ping",
                "ts":             datetime.utcnow().isoformat(),
                "clientes_ativos": manager.count,
            }))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as exc:
        logger.error("[WS] Erro: %s", exc)
        manager.disconnect(websocket)


@router.post("/api/ws/broadcast", tags=["WebSocket"])
async def broadcast_alerta(
    nivel: str = "INFO",
    titulo: str = "Novo alerta",
    descricao: str = "",
    categoria: str = "Sistema",
):
    """Envia alerta para todos os clientes WS conectados (uso interno/scheduler)."""
    msg = {
        "tipo":      "alerta",
        "nivel":     nivel,
        "titulo":    titulo,
        "descricao": descricao,
        "categoria": categoria,
        "ts":        datetime.utcnow().isoformat(),
    }
    await manager.broadcast(msg)
    return {"clientes_notificados": manager.count, "mensagem": msg}
