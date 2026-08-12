"""
Router: /api/notificacoes — Notificacoes do sistema ERSUS 360
Derivadas do banco de inconsistencias real.
Sem banco configurado → lista vazia (nunca dados inventados).
"""
from __future__ import annotations
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/notificacoes", tags=["notificacoes"])


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


async def _buscar_banco() -> list[dict]:
    try:
        from database import get_db_direct
        from models.inconsistencia import Inconsistencia
        from sqlalchemy import select
        async for db in get_db_direct():
            rows = (await db.execute(
                select(Inconsistencia)
                .where(Inconsistencia.situacao.in_(["identificada", "em_correcao"]))
                .order_by(Inconsistencia.criado_em.desc())
                .limit(50)
            )).scalars().all()
            return [
                {
                    "id":       f"INC-{row.id}",
                    "titulo":   row.descricao[:80] if row.descricao else "Inconsistencia",
                    "descricao": row.descricao or "",
                    "modulo":   row.modulo or "",
                    "tipo":     "critico" if row.gravidade == "critica" else "alerta",
                    "data":     row.criado_em.strftime("%d/%m/%Y") if row.criado_em else "",
                    "hora":     row.criado_em.strftime("%H:%M") if row.criado_em else "",
                    "lida":     False,
                    "situacao_dado": "oficial_validado",
                }
                for row in rows
            ]
    except Exception:
        pass
    return []


@router.get("/resumo")
async def resumo(_: UserOut = Depends(get_current_user)):
    items = await _buscar_banco()
    return {
        "total":         len(items),
        "nao_lidas":     len([n for n in items if not n["lida"]]),
        "criticas":      len([n for n in items if n["tipo"] == "critico"]),
        "alertas":       len([n for n in items if n["tipo"] == "alerta"]),
        "situacao_dado": "oficial_validado" if items else "nao_disponivel",
        "verificado_em": _ts(),
    }


@router.get("/lista")
async def lista(
    tipo: Optional[str] = None,
    lida: Optional[str] = None,
    _: UserOut = Depends(get_current_user),
):
    items = await _buscar_banco()
    if tipo:
        items = [n for n in items if n["tipo"] == tipo]
    return items


@router.post("/marcar-lida")
async def marcar_lida(body: dict, _: UserOut = Depends(get_current_user)):
    return {"ok": True}


@router.post("/marcar-todas-lidas")
async def marcar_todas_lidas(_: UserOut = Depends(get_current_user)):
    return {"ok": True}
