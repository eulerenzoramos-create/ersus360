"""
WebSocket /ws/alertas — Alertas em tempo real ERSUS 360
Clientes conectados recebem push quando novos alertas são gerados.
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

# ── Connection manager ────────────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self) -> None:
        self._active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._active.add(ws)
        logger.info("[WS] Novo cliente conectado — total: %d", len(self._active))

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


# ── Alertas de referência (Apuí/AM) ──────────────────────────────────────────

_ALERTAS_REF = [
    {
        "id": 1,
        "nivel": "CRITICO",
        "categoria": "Financeiro",
        "titulo": "Convênio FNS vencendo em 7 dias",
        "descricao": "Convênio MAC — R$ 94.800 — vence em 11/07/2026. Necessário renovação urgente.",
        "modulo": "financeiro",
        "lido": False,
    },
    {
        "id": 2,
        "nivel": "CRITICO",
        "categoria": "RH",
        "titulo": "2 servidores com férias vencidas",
        "descricao": "Carlos Souza e Maria Lima estão com período aquisitivo vencido há mais de 30 dias.",
        "modulo": "rh",
        "lido": False,
    },
    {
        "id": 3,
        "nivel": "AVISO",
        "categoria": "Previne Brasil",
        "titulo": "Meta Ind.2 — Citopatológico abaixo do esperado",
        "descricao": "Cobertura atual: 43% · Meta: 60%. Equipes ESF precisam intensificar busca ativa.",
        "modulo": "aps",
        "lido": False,
    },
    {
        "id": 4,
        "nivel": "AVISO",
        "categoria": "Patrimônio",
        "titulo": "Veículo AAA-1234 com manutenção vencida",
        "descricao": "Ambulância Ford Transit — última revisão há 8 meses. Agendar manutenção preventiva.",
        "modulo": "patrimonio",
        "lido": False,
    },
    {
        "id": 5,
        "nivel": "INFO",
        "categoria": "OCIS",
        "titulo": "Sincronização FNS concluída",
        "descricao": "Sync diário realizado às 06:00 — 3 novos repasses importados.",
        "modulo": "financeiro",
        "lido": True,
    },
]


# ── Endpoint WebSocket ────────────────────────────────────────────────────────

@router.websocket("/ws/alertas")
async def ws_alertas(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Envia snapshot inicial dos alertas ativos
        await websocket.send_text(json.dumps({
            "tipo": "snapshot",
            "alertas": _ALERTAS_REF,
            "total_nao_lidos": sum(1 for a in _ALERTAS_REF if not a["lido"]),
            "ts": datetime.utcnow().isoformat(),
            "fonte": "referencia",
        }, ensure_ascii=False))

        # Mantém conexão viva com heartbeat a cada 30s
        while True:
            await asyncio.sleep(30)
            await websocket.send_text(json.dumps({
                "tipo": "ping",
                "ts": datetime.utcnow().isoformat(),
                "clientes_ativos": manager.count,
            }))

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as exc:
        logger.error("[WS] Erro inesperado: %s", exc)
        manager.disconnect(websocket)


# ── Endpoint REST: broadcast manual (para testes e integração interna) ────────

@router.post("/api/ws/broadcast", tags=["WebSocket"])
async def broadcast_alerta(
    nivel: str = "INFO",
    titulo: str = "Novo alerta",
    descricao: str = "",
    categoria: str = "Sistema",
):
    """Envia alerta para todos os clientes WS conectados (uso interno/scheduler)."""
    msg = {
        "tipo": "alerta",
        "nivel": nivel,
        "titulo": titulo,
        "descricao": descricao,
        "categoria": categoria,
        "ts": datetime.utcnow().isoformat(),
    }
    await manager.broadcast(msg)
    return {"clientes_notificados": manager.count, "mensagem": msg}
