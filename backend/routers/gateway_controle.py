"""
Router: /api/gateway — Controle central do ERSUS Integration Gateway.

Endpoints de pausa, diagnóstico, status geral e histórico de transmissões.
"""
from __future__ import annotations
import logging
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/gateway", tags=["Integration Gateway"])


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


async def _get_ou_criar_config(municipio_id: int):
    from database import AsyncSessionLocal
    from models.integracao_gateway import GatewayConfig
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(GatewayConfig).where(GatewayConfig.municipio_id == municipio_id)
        )
        cfg = res.scalar_one_or_none()
        if not cfg:
            cfg = GatewayConfig(municipio_id=municipio_id, pausado=False, modo_diagnostico=True)
            db.add(cfg)
            await db.commit()
            await db.refresh(cfg)
        return {
            "pausado": cfg.pausado,
            "modo_diagnostico": cfg.modo_diagnostico,
            "rnds_ativo": cfg.rnds_ativo,
            "ledi_ativo": cfg.ledi_ativo,
            "uf": cfg.uf,
        }


@router.get("/status")
async def status_gateway(current_user: UserOut = Depends(get_current_user)):
    """Status geral do Integration Gateway (RNDS + LEDI)."""
    municipio_id = getattr(current_user, "municipio_id", 1)
    cfg = await _get_ou_criar_config(municipio_id)

    rnds_cert = bool(
        os.getenv("RNDS_CERT_PATH", "").strip() and
        os.getenv("RNDS_CERT_KEY_PATH", "").strip()
    )
    ledi_conf = bool(
        os.getenv("LEDI_PEC_URL", "").strip() and
        os.getenv("LEDI_USUARIO", "").strip() and
        os.getenv("LEDI_SENHA", "").strip()
    )

    sistemas = [
        {
            "sistema": "RNDS",
            "descricao": "Rede Nacional de Dados em Saúde — HL7 FHIR R4",
            "configurado": rnds_cert,
            "ativo": cfg["rnds_ativo"],
            "ambiente": os.getenv("RNDS_AMBIENTE", "homologacao"),
            "endpoint": os.getenv("RNDS_SERVICES_URL", "https://ehr-services.hmg.saude.gov.br"),
            "autenticacao": "Certificado ICP-Brasil mTLS + JWT 30min",
            "status": "disponivel" if rnds_cert else "nao_configurado",
        },
        {
            "sistema": "LEDI",
            "descricao": "e-SUS APS LEDI API v8.5.0 — Fichas clínicas Apache Thrift",
            "configurado": ledi_conf,
            "ativo": cfg["ledi_ativo"],
            "ambiente": os.getenv("LEDI_AMBIENTE", "producao"),
            "endpoint": os.getenv("LEDI_PEC_URL", ""),
            "autenticacao": "Usuário/Senha PEC → Cookie JSESSIONID",
            "status": "disponivel" if ledi_conf else "nao_configurado",
        },
    ]

    return {
        "situacao_dado": "oficial_validado",
        "pausado": cfg["pausado"],
        "modo_diagnostico": cfg["modo_diagnostico"],
        "sistemas": sistemas,
        "nota": (
            "Gateway pausado — nenhuma transmissão será feita." if cfg["pausado"] else
            "Modo diagnóstico ativo — somente leitura." if cfg["modo_diagnostico"] else
            "Gateway ativo para transmissão."
        ),
        "verificado_em": _ts(),
    }


@router.post("/pausar")
async def pausar_gateway(current_user: UserOut = Depends(get_current_user)):
    """Pausa todas as transmissões do gateway para o município. Não apaga dados ou logs."""
    from database import AsyncSessionLocal
    from models.integracao_gateway import GatewayConfig
    from sqlalchemy import select

    municipio_id = getattr(current_user, "municipio_id", 1)
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(GatewayConfig).where(GatewayConfig.municipio_id == municipio_id)
        )
        cfg = res.scalar_one_or_none()
        if not cfg:
            cfg = GatewayConfig(municipio_id=municipio_id, pausado=True, modo_diagnostico=True)
            db.add(cfg)
        else:
            cfg.pausado = True
        await db.commit()

    logger.info("Gateway PAUSADO — município_id=%s por usuário %s", municipio_id, current_user.email)
    return {
        "ok": True,
        "pausado": True,
        "nota": "Gateway pausado. Novas transmissões bloqueadas até retomada explícita.",
        "atualizado_em": _ts(),
    }


@router.post("/retomar")
async def retomar_gateway(current_user: UserOut = Depends(get_current_user)):
    """Retoma transmissões do gateway para o município."""
    from database import AsyncSessionLocal
    from models.integracao_gateway import GatewayConfig
    from sqlalchemy import select

    municipio_id = getattr(current_user, "municipio_id", 1)
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(GatewayConfig).where(GatewayConfig.municipio_id == municipio_id)
        )
        cfg = res.scalar_one_or_none()
        if not cfg:
            cfg = GatewayConfig(municipio_id=municipio_id, pausado=False, modo_diagnostico=True)
            db.add(cfg)
        else:
            cfg.pausado = False
        await db.commit()

    logger.info("Gateway RETOMADO — município_id=%s por usuário %s", municipio_id, current_user.email)
    return {
        "ok": True,
        "pausado": False,
        "nota": "Gateway retomado. Novas transmissões permitidas.",
        "atualizado_em": _ts(),
    }


@router.post("/modo-diagnostico")
async def ativar_modo_diagnostico(
    ativo: bool = True,
    current_user: UserOut = Depends(get_current_user),
):
    """
    Ativa/desativa modo diagnóstico (somente leitura).
    Em modo diagnóstico, o gateway verifica conectividade mas não envia dados.
    Transmissão só é habilitada após desativar este modo explicitamente.
    """
    from database import AsyncSessionLocal
    from models.integracao_gateway import GatewayConfig
    from sqlalchemy import select

    municipio_id = getattr(current_user, "municipio_id", 1)
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(GatewayConfig).where(GatewayConfig.municipio_id == municipio_id)
        )
        cfg = res.scalar_one_or_none()
        if not cfg:
            cfg = GatewayConfig(municipio_id=municipio_id, pausado=False, modo_diagnostico=ativo)
            db.add(cfg)
        else:
            cfg.modo_diagnostico = ativo
        await db.commit()

    return {
        "ok": True,
        "modo_diagnostico": ativo,
        "nota": (
            "Modo diagnóstico ativado — somente leitura/conectividade." if ativo else
            "Modo diagnóstico desativado — transmissão de dados habilitada."
        ),
        "atualizado_em": _ts(),
    }


@router.get("/diagnostico")
async def diagnostico_completo(current_user: UserOut = Depends(get_current_user)):
    """
    Diagnóstico completo de conectividade (somente leitura).
    Testa RNDS (CapabilityStatement) e LEDI (login) sem enviar dados.
    """
    from services.integration_gateway import diagnostico_rnds, obter_sessao_ledi
    import os

    cns_profissional = os.getenv("RNDS_CNS_PROFISSIONAL", "")
    cnes = os.getenv("RNDS_CNES", "")
    uf = os.getenv("RNDS_UF", "am")

    rnds_diag = await diagnostico_rnds(cns_profissional, cnes, uf)
    ledi_diag = await obter_sessao_ledi()

    return {
        "situacao_dado": "oficial_validado",
        "rnds": {
            "ok": rnds_diag.get("situacao_dado") == "oficial_validado",
            "certificado_configurado": rnds_diag.get("certificado_configurado"),
            "token_obtido": rnds_diag.get("token_obtido"),
            "latencia_ms": rnds_diag.get("latencia_ms"),
            "ambiente": rnds_diag.get("ambiente"),
            "endpoint": rnds_diag.get("endpoint_services"),
            "nota": rnds_diag.get("nota"),
        },
        "ledi": {
            "ok": ledi_diag.get("ok"),
            "configurado": bool(os.getenv("LEDI_PEC_URL", "").strip()),
            "nota": ledi_diag.get("nota"),
        },
        "verificado_em": _ts(),
    }


@router.get("/transmissoes")
async def listar_transmissoes(
    sistema: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=500),
    current_user: UserOut = Depends(get_current_user),
):
    """Lista histórico de transmissões com filtros por sistema e status."""
    from database import AsyncSessionLocal
    from models.integracao_gateway import GatewayTransmissao, SistemaDestino, StatusTransmissao
    from sqlalchemy import select, desc

    municipio_id = getattr(current_user, "municipio_id", 1)

    async with AsyncSessionLocal() as db:
        q = select(GatewayTransmissao).where(
            GatewayTransmissao.municipio_id == municipio_id
        ).order_by(desc(GatewayTransmissao.criado_em)).limit(limit)

        if sistema:
            try:
                q = q.where(GatewayTransmissao.sistema == SistemaDestino(sistema))
            except ValueError:
                pass
        if status:
            try:
                q = q.where(GatewayTransmissao.status == StatusTransmissao(status))
            except ValueError:
                pass

        res = await db.execute(q)
        txs = res.scalars().all()

    return {
        "situacao_dado": "oficial_validado",
        "total": len(txs),
        "transmissoes": [
            {
                "id": t.id,
                "sistema": t.sistema,
                "endpoint": t.endpoint,
                "operacao": t.operacao,
                "status": t.status,
                "id_transacao": t.id_transacao,
                "codigo_retorno": t.codigo_retorno,
                "tentativas": t.tentativas,
                "criado_em": t.criado_em.isoformat() if t.criado_em else None,
            }
            for t in txs
        ],
        "verificado_em": _ts(),
    }
