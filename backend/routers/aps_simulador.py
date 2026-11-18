"""
Router: /api/aps-simulador — Simulador de Financiamento e Oportunidades de Credenciamento da APS (eGestor).
Fontes: e-Gestor APS e SIAPS (integrações já existentes). Multi-município (sessão municipal).
"""
from __future__ import annotations

import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.auth import ip_de
from routers.fns_previsao import _pode_editar
from services import aps_parametros as ap
from services import aps_simulador as sim
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/aps-simulador", tags=["eGestor — simulador de financiamento da APS"])

_CHAVE = re.compile(r"^[a-zA-Z0-9_.]{3,80}$")


@router.get("")
async def painel(current: SessaoMunicipal, parcela: Optional[str] = Query(None, pattern=r"^\d{6}$"),
                 db: AsyncSession = Depends(get_db)):
    return await sim.simular(db, current.municipio_id, parcela)


@router.get("/parametros")
async def parametros(current: SessaoMunicipal, competencia: Optional[str] = Query(None, pattern=r"^\d{6}$"),
                     db: AsyncSession = Depends(get_db)):
    from datetime import date
    comp = competencia or date.today().strftime("%Y%m")
    return {"competencia": comp, "vigentes": await ap.vigentes(db, current.municipio_id, comp),
            "historico": await ap.historico(db, current.municipio_id), "descricao": ap.DESCRICAO,
            "monitoramento": ("Automático: valores de referência e portarias publicados pelo e-Gestor em cada "
                              "sincronização. Manual (com validação): tabelas por classificação, transição e normas "
                              "que o e-Gestor não publica.")}


class ParametroIn(BaseModel):
    chave: str
    valor: Optional[float] = Field(None, ge=0, le=10_000_000)
    valor_texto: Optional[str] = Field(None, max_length=200)
    norma: str = Field(min_length=3, max_length=200)
    fonte: str = Field(min_length=5, max_length=300)
    justificativa: str = Field(min_length=10, max_length=2000)
    vigencia_inicio: str = Field(pattern=r"^\d{6}$")
    nacional: bool = True

    @field_validator("chave")
    @classmethod
    def _chave(cls, v: str) -> str:
        if not _CHAVE.match(v) or v.startswith("egestor."):
            raise ValueError("Chave de parâmetro inválida.")
        return v


@router.post("/parametros")
async def registrar(dados: ParametroIn, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    """Registra atualização normativa (fica pendente de validação; não muda cálculo até ser validada)."""
    _pode_editar(current)
    if dados.valor is None and not dados.valor_texto:
        raise HTTPException(422, "Informe o valor.")
    if dados.chave == "transicao.fim" and not re.match(r"^\d{6}$", dados.valor_texto or ""):
        raise HTTPException(422, "Competência final da transição no formato AAAAMM.")
    if dados.nacional and not current.administrador_geral:
        raise HTTPException(403, "Parâmetro nacional só pelo administrador-geral; registre para o município.")
    p = await ap.registrar(db, None if dados.nacional else current.municipio_id, dados.model_dump(), current.username)
    await registrar_auditoria(db, "APS_PARAMETRO_REGISTRADO", usuario=current, ip=ip_de(request),
                              tabela="aps_parametro_norma", detalhe=f"{p.chave} id={p.id}")
    return {"id": p.id, "situacao": p.situacao}


class DecisaoIn(BaseModel):
    aprovar: bool


@router.post("/parametros/{pid}/decidir")
async def decidir(pid: int, dados: DecisaoIn, request: Request, current: SessaoMunicipal,
                  db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    from models.aps_parametro import ApsParametroNorma
    alvo = await db.get(ApsParametroNorma, pid)
    if alvo is not None and alvo.municipio_id is None and not current.administrador_geral:
        raise HTTPException(403, "Parâmetro nacional só é validado pelo administrador-geral.")
    if alvo is not None and alvo.origem == "manual" and alvo.registrado_por == current.username and dados.aprovar:
        raise HTTPException(403, "A validação deve ser feita por outro usuário (quem registrou não valida).")
    p = await ap.decidir(db, current.municipio_id, pid, dados.aprovar, current.username)
    if p is None:
        raise HTTPException(404, "Parâmetro pendente não encontrado.")
    await registrar_auditoria(db, "APS_PARAMETRO_VALIDADO" if dados.aprovar else "APS_PARAMETRO_REJEITADO",
                              usuario=current, ip=ip_de(request), tabela="aps_parametro_norma", detalhe=f"{p.chave} id={p.id}")
    return {"id": p.id, "situacao": p.situacao}
