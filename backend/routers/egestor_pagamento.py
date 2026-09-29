"""
Router: /api/egestor-pagamento — pagamento da APS por componente e validação de cada equipe,
lidos automaticamente do e-Gestor APS (relatório público, sem login). Multi-município.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.auth import ip_de
from routers.fns_previsao import _pode_editar
from services import egestor_pagamento as ep
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/egestor-pagamento", tags=["e-Gestor — pagamento por equipe"])


@router.get("")
async def painel(current: SessaoMunicipal, parcela: Optional[str] = Query(None, pattern=r"^\d{6}$"),
                 db: AsyncSession = Depends(get_db)):
    return await ep.painel(db, current.municipio_id, parcela)


@router.post("/sincronizar")
async def sincronizar(request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    """Busca agora no e-Gestor (além da rotina automática)."""
    _pode_editar(current)
    try:
        r = await ep.sincronizar(db, current.municipio_id, current.municipio_ibge)
    except ep.EgestorIndisponivel as e:
        raise HTTPException(503, str(e))
    await registrar_auditoria(db, "EGESTOR_PAGAMENTO_SINCRONIZADO", usuario=current, ip=ip_de(request),
                              tabela="egestor_pagamento_componente", detalhe=f"parcelas {r['parcelas']}")
    return r
