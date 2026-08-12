"""
WebSocket: /ws/acs-geo — Geo-localização em tempo real dos ACS
Protocolo:
  ACS → Servidor: { tipo: "ping", acs_id, lat, lng, status, precisao, bateria }
  Servidor → Gestor: { tipo: "localizacao", acs_id, nome, lat, lng, status, ts }
  Servidor → ACS: { tipo: "ack", ts }
  ACS → Servidor: { tipo: "producao", acs_id, visita {...} }
  Servidor → Todos: { tipo: "producao_registrada", acs_id, nome, familia, ts }
"""
from __future__ import annotations
import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["WS-ACS"])
logger = logging.getLogger(__name__)

# ── Nomes dos ACS: preenchido dinamicamente via app ACS no payload de ping ────
# Nao usamos nomes inventados. Identificacao por acs_id ate app ACS conectar.
_ACS_NOMES: Dict[int, str] = {}  # populado em _ping quando app envia "nome"

# ── Estado em memória ─────────────────────────────────────────────────────────

class _Estado:
    """Estado em memória das localizações ativas dos ACS."""

    # ultima posição por acs_id
    posicoes: Dict[int, dict] = {}

    # visitas registradas hoje (acumuladas, max 500)
    producao_hoje: list = []

    # conexões WebSocket ativas: acs_id → websocket (pode ser None para gestores)
    gestores: list[WebSocket] = []
    acs_ws: Dict[int, WebSocket] = {}


estado = _Estado()


async def _broadcast_gestores(msg: dict) -> None:
    dead = []
    for ws in estado.gestores:
        try:
            await ws.send_json(msg)
        except Exception:
            dead.append(ws)
    for ws in dead:
        try:
            estado.gestores.remove(ws)
        except ValueError:
            pass


# ── Endpoint WebSocket principal ──────────────────────────────────────────────

@router.websocket("/ws/acs-geo")
async def ws_acs_geo(ws: WebSocket):
    await ws.accept()
    acs_id: Optional[int] = None
    role = "gestor"  # "gestor" ou "acs"

    try:
        # Primeiro frame define o papel da conexão
        raw = await asyncio.wait_for(ws.receive_text(), timeout=10.0)
        dados = json.loads(raw)
        role = dados.get("role", "gestor")

        if role == "acs":
            acs_id = int(dados.get("acs_id", 0))
            estado.acs_ws[acs_id] = ws
            logger.info("[WS-ACS] ACS %d conectou: %s", acs_id, _ACS_NOMES.get(acs_id, "?"))
            # Envia posições atuais para o ACS se reconectar
            await ws.send_json({"tipo": "posicoes_atuais", "posicoes": list(estado.posicoes.values())})
        else:
            estado.gestores.append(ws)
            logger.info("[WS-ACS] Gestor conectou (total: %d)", len(estado.gestores))
            # Envia snapshot inicial com todas as posições
            await ws.send_json({"tipo": "snapshot", "posicoes": list(estado.posicoes.values()), "producao_hoje": estado.producao_hoje[-20:]})

        # Loop de mensagens
        while True:
            raw = await ws.receive_text()
            dados = json.loads(raw)
            tipo = dados.get("tipo")

            # ── Ping de localização ──────────────────────────────────────────
            if tipo == "ping":
                aid = int(dados.get("acs_id", acs_id or 0))
                ts = datetime.now(timezone.utc).isoformat()
                # Captura nome real enviado pelo app ACS (se presente)
                if dados.get("nome") and aid:
                    _ACS_NOMES[aid] = dados["nome"]
                pos = {
                    "acs_id":    aid,
                    "nome":      _ACS_NOMES.get(aid, f"ACS {aid}"),
                    "lat":       float(dados.get("lat", 0)),
                    "lng":       float(dados.get("lng", 0)),
                    "status":    dados.get("status", "ativo"),   # ativo | em_visita | deslocamento | offline
                    "microarea": dados.get("microarea", ""),
                    "precisao":  dados.get("precisao", 0),
                    "bateria":   dados.get("bateria", None),
                    "ts":        ts,
                }
                estado.posicoes[aid] = pos
                await ws.send_json({"tipo": "ack", "ts": ts})
                await _broadcast_gestores({"tipo": "localizacao", **pos})

            # ── Registro de produção / visita ────────────────────────────────
            elif tipo == "producao":
                aid = int(dados.get("acs_id", acs_id or 0))
                ts = datetime.now(timezone.utc).isoformat()
                visita = dados.get("visita", {})
                registro = {
                    "acs_id":  aid,
                    "nome":    _ACS_NOMES.get(aid, f"ACS {aid}"),
                    "familia": visita.get("familia", "Família não identificada"),
                    "cns_responsavel": visita.get("cns_responsavel", ""),
                    "microarea": visita.get("microarea", ""),
                    "lat":     visita.get("lat"),
                    "lng":     visita.get("lng"),
                    "procedimentos": visita.get("procedimentos", []),
                    "observacao": visita.get("observacao", ""),
                    "ts":      ts,
                }
                estado.producao_hoje.append(registro)
                if len(estado.producao_hoje) > 500:
                    estado.producao_hoje = estado.producao_hoje[-500:]

                await ws.send_json({"tipo": "producao_ack", "ts": ts, "id": len(estado.producao_hoje)})
                await _broadcast_gestores({"tipo": "producao_registrada", **registro})
                logger.info("[WS-ACS] Produção ACS %d: %s", aid, visita.get("familia", "?"))

            # ── Checkin em microárea ─────────────────────────────────────────
            elif tipo == "checkin":
                aid = int(dados.get("acs_id", acs_id or 0))
                ts = datetime.now(timezone.utc).isoformat()
                checkin = {
                    "tipo":     "checkin",
                    "acs_id":   aid,
                    "nome":     _ACS_NOMES.get(aid, f"ACS {aid}"),
                    "microarea": dados.get("microarea", ""),
                    "lat":      dados.get("lat"),
                    "lng":      dados.get("lng"),
                    "ts":       ts,
                }
                await _broadcast_gestores(checkin)

    except WebSocketDisconnect:
        pass
    except asyncio.TimeoutError:
        logger.warning("[WS-ACS] Timeout no handshake inicial")
    except Exception as exc:
        logger.error("[WS-ACS] Erro: %s", exc, exc_info=True)
    finally:
        if role == "acs" and acs_id and acs_id in estado.acs_ws:
            del estado.acs_ws[acs_id]
            # Marca como offline nas posições
            if acs_id in estado.posicoes:
                estado.posicoes[acs_id]["status"] = "offline"
            await _broadcast_gestores({"tipo": "acs_offline", "acs_id": acs_id, "ts": datetime.now(timezone.utc).isoformat()})
        elif role == "gestor" and ws in estado.gestores:
            estado.gestores.remove(ws)


# ── REST: snapshot de posições (para carga inicial via HTTP) ──────────────────

from fastapi import Depends
from routers.auth import get_current_user, UserOut


@router.get("/api/acs/localizacoes")
async def get_localizacoes(_: UserOut = Depends(get_current_user)):
    """Snapshot REST das últimas posições conhecidas dos ACS."""
    return {
        "posicoes":        list(estado.posicoes.values()),
        "producao_hoje":   estado.producao_hoje[-50:],
        "total_ativos":    sum(1 for p in estado.posicoes.values() if p["status"] != "offline"),
        "total_visitas":   len(estado.producao_hoje),
        "ts":              datetime.now(timezone.utc).isoformat(),
    }


@router.get("/api/acs/producao-hoje")
async def producao_hoje(_: UserOut = Depends(get_current_user)):
    """Lista de visitas/produções registradas hoje via app ACS."""
    return {
        "total":    len(estado.producao_hoje),
        "visitas":  estado.producao_hoje,
        "ts":       datetime.now(timezone.utc).isoformat(),
    }
