"""
Router: /api/ledi — e-SUS APS LEDI API Gateway — ERSUS 360

API LEDI v8.5.0: envio de fichas clínicas ao PEC via Apache Thrift.
Requer LEDI_PEC_URL + LEDI_USUARIO + LEDI_SENHA no Railway (env vars).
"""
from __future__ import annotations
import logging
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ledi", tags=["LEDI e-SUS APS"])


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _ledi_configurado() -> bool:
    return bool(
        os.getenv("LEDI_PEC_URL", "").strip() and
        os.getenv("LEDI_USUARIO", "").strip() and
        os.getenv("LEDI_SENHA", "").strip()
    )


@router.get("/status")
async def status_ledi(_: UserOut = Depends(get_current_user)):
    """Status da conexão com o e-SUS APS via API LEDI."""
    configurado = _ledi_configurado()
    pec_url = os.getenv("LEDI_PEC_URL", "").strip()

    fichas_suportadas = [
        "Atendimento Individual", "Atendimento Odontológico",
        "Visita Domiciliar", "Atividade Coletiva",
        "Cadastro Individual", "Cadastro Domiciliar",
        "Procedimentos", "Marcadores de Consumo Alimentar",
    ]

    return {
        "situacao_dado": "nao_disponivel" if not configurado else "configurado",
        "configurado": configurado,
        "pec_url": pec_url if pec_url else None,
        "versao_ledi": "8.5.0",
        "versao_pec_minima": "5.5.23",
        "endpoint_login": f"{pec_url}/api/recebimento/login" if pec_url else None,
        "endpoint_ficha": f"{pec_url}/api/v1/recebimento/ficha" if pec_url else None,
        "fichas_suportadas": fichas_suportadas,
        "nota": (
            None if configurado else
            "Configure LEDI_PEC_URL, LEDI_USUARIO e LEDI_SENHA no Railway. "
            "Credenciais geradas no PEC em: Gestão → Integrações → Credenciais para API."
        ),
        "verificado_em": _ts(),
    }


@router.post("/testar-conexao")
async def testar_conexao_ledi(_: UserOut = Depends(get_current_user)):
    """Testa autenticação no PEC via API LEDI em tempo real."""
    from services.integration_gateway import obter_sessao_ledi
    resultado = await obter_sessao_ledi()
    return {
        "ok": resultado["ok"],
        "situacao_dado": "oficial_validado" if resultado["ok"] else "nao_disponivel",
        "sessao_criada": resultado["ok"],
        "nota": resultado["nota"],
        "testado_em": _ts(),
    }


@router.get("/fichas")
async def listar_fichas(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    _: UserOut = Depends(get_current_user),
):
    """Lista fichas enviadas ao PEC (log do gateway)."""
    from database import AsyncSessionLocal
    from models.integracao_gateway import GatewayTransmissao, SistemaDestino
    from sqlalchemy import select, desc

    async with AsyncSessionLocal() as db:
        q = select(GatewayTransmissao).where(
            GatewayTransmissao.sistema == SistemaDestino.LEDI
        ).order_by(desc(GatewayTransmissao.criado_em)).limit(limit)
        if status:
            from models.integracao_gateway import StatusTransmissao
            try:
                q = q.where(GatewayTransmissao.status == StatusTransmissao(status))
            except ValueError:
                pass
        res = await db.execute(q)
        fichas = res.scalars().all()

    return {
        "situacao_dado": "oficial_validado",
        "total": len(fichas),
        "fichas": [
            {
                "id": f.id,
                "operacao": f.operacao,
                "status": f.status,
                "id_transacao": f.id_transacao,
                "codigo_retorno": f.codigo_retorno,
                "criado_em": f.criado_em.isoformat() if f.criado_em else None,
            }
            for f in fichas
        ],
        "verificado_em": _ts(),
    }


@router.post("/fichas/{transmissao_id}/reprocessar")
async def reprocessar_ficha(
    transmissao_id: int,
    _: UserOut = Depends(get_current_user),
):
    """Marca uma ficha rejeitada/com erro para reprocessamento."""
    from database import AsyncSessionLocal
    from models.integracao_gateway import GatewayTransmissao, StatusTransmissao
    from sqlalchemy import select

    if not _ledi_configurado():
        return {"ok": False, "nota": "LEDI não configurado — não é possível reprocessar."}

    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(GatewayTransmissao).where(GatewayTransmissao.id == transmissao_id)
        )
        tx = res.scalar_one_or_none()
        if not tx:
            return {"ok": False, "nota": f"Transmissão {transmissao_id} não encontrada."}
        tx.status = StatusTransmissao.REPROCESSAMENTO
        tx.tentativas = (tx.tentativas or 0) + 1
        await db.commit()

    return {
        "ok": True,
        "transmissao_id": transmissao_id,
        "nota": "Ficha marcada para reprocessamento.",
        "atualizado_em": _ts(),
    }
