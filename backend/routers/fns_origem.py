"""
Router: /api/fns-origem — origem dos recursos FNS (Ministério da Saúde × Emendas
Parlamentares individuais, de bancada e de comissão). Multi-município: sempre o
município da sessão.
"""
from __future__ import annotations

import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.fns_origem import FnsPropostaOrigem
from routers.auth import ip_de
from routers.fns_previsao import _pode_editar
from services import fns_origem as fo
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/fns-origem", tags=["FNS — Origem dos recursos"])


class ClassificacaoIn(BaseModel):
    tipo: Optional[str] = None                 # None = remover classificação
    parlamentar: Optional[str] = Field(None, max_length=200)
    numero_emenda: Optional[str] = Field(None, max_length=60)
    observacao: Optional[str] = Field(None, max_length=1000)


@router.get("/painel")
async def painel(current: SessaoMunicipal,
                 exercicio: int = Query(..., ge=2000, le=2100),
                 mes_inicio: int = Query(1, ge=1, le=12),
                 mes_fim: int = Query(12, ge=1, le=12),
                 db: AsyncSession = Depends(get_db)):
    return await fo.painel(db, current.municipio_id, exercicio, mes_inicio, mes_fim)


@router.put("/propostas/{numero_proposta}")
async def classificar(numero_proposta: str, body: ClassificacaoIn, request: Request,
                      current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    """Classificação da proposta pela Secretaria (o FNS não informa o tipo da emenda)."""
    _pode_editar(current)
    numero = re.sub(r"\D", "", numero_proposta)
    if not numero:
        raise HTTPException(422, "Nº de proposta inválido")
    if body.tipo is not None and body.tipo not in fo.TIPOS_CLASSIFICACAO:
        raise HTTPException(422, f"Tipo inválido. Use: {', '.join(fo.TIPOS_CLASSIFICACAO)}")
    reg = (await db.execute(select(FnsPropostaOrigem)
                            .where(FnsPropostaOrigem.municipio_id == current.municipio_id)
                            .where(FnsPropostaOrigem.numero_proposta == numero))).scalar_one_or_none()
    anterior = reg.tipo if reg else None
    if body.tipo is None:
        if reg:
            await db.delete(reg)
    else:
        if not reg:
            reg = FnsPropostaOrigem(municipio_id=current.municipio_id, numero_proposta=numero)
            db.add(reg)
        reg.tipo, reg.parlamentar = body.tipo, (body.parlamentar or "").strip() or None
        reg.numero_emenda, reg.observacao = (body.numero_emenda or "").strip() or None, body.observacao
        reg.classificado_por = current.username
    await db.commit()
    await registrar_auditoria(db, "ORIGEM_RECURSO_FNS_CLASSIFICADA", usuario=current, ip=ip_de(request),
                              tabela="fns_propostas_origem", registro_id=None,
                              detalhe=f"proposta {numero}: {anterior or '—'} → {body.tipo or 'removida'}"
                                      f"{' · ' + body.parlamentar if body.parlamentar else ''}")
    return {"ok": True, "numero_proposta": numero, "tipo": body.tipo}
