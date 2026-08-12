"""
Router: /api/auditoria-auto — Auditoria Automatica Mensal (cron)
Execucoes reais derivadas do banco de inconsistencias ERSUS 360.
Sem banco configurado → nao_disponivel.
"""
from __future__ import annotations
from datetime import datetime

from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/auditoria-auto", tags=["auditoria-auto"])


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/execucoes")
async def listar_execucoes(_: UserOut = Depends(get_current_user)):
    try:
        from database import get_db_direct
        from models.inconsistencia import Inconsistencia
        from sqlalchemy import select
        async for db in get_db_direct():
            rows = (await db.execute(
                select(Inconsistencia).order_by(Inconsistencia.criado_em.desc()).limit(50)
            )).scalars().all()
            execucoes = [
                {
                    "id":           row.id,
                    "modulo":       row.modulo,
                    "descricao":    row.descricao,
                    "gravidade":    row.gravidade,
                    "situacao":     row.situacao,
                    "criado_em":    row.criado_em.isoformat() if row.criado_em else None,
                    "situacao_dado": "oficial_validado",
                }
                for row in rows
            ]
            return {
                "situacao_dado": "oficial_validado" if execucoes else "nao_disponivel",
                "total":         len(execucoes),
                "execucoes":     execucoes,
                "verificado_em": _ts(),
            }
    except Exception:
        pass

    return {
        "situacao_dado": "nao_disponivel",
        "total":         None,
        "execucoes":     [],
        "nota":          "Banco de inconsistencias nao acessivel.",
        "verificado_em": _ts(),
    }


@router.get("/config")
async def obter_config(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado":   "nao_disponivel",
        "ativo":           False,
        "expressao_cron":  "0 6 1 * *",
        "nota":            "Configuracao de cron gerenciada no Railway Cron Jobs.",
    }


@router.post("/disparar")
async def disparar(_: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "nao_disponivel",
        "ok":            False,
        "nota":          "Disparo de auditoria manual nao implementado nesta versao.",
    }


@router.post("/config")
async def atualizar_config(body: dict, _: UserOut = Depends(get_current_user)):
    return {
        "situacao_dado": "nao_disponivel",
        "ok":            False,
        "nota":          "Configuracao gerenciada no Railway.",
    }
