"""
Router: Agente IA de análise das Portarias do FNS (aba Repasses Mensais — FNS › Portarias). Multi-município.

  GET  /api/fns-portarias-ia/painel?exercicio=           consolidado + etiquetas (reanalisa só o que mudou)
  GET  /api/fns-portarias-ia/portaria?exercicio=&numero=  análise técnica individual
  POST /api/fns-portarias-ia/analisar-lote?exercicio=     reanalisa todas as portarias (forçado)
  POST /api/fns-portarias-ia/verificar-normas             confere os dispositivos no texto oficial
  POST /api/fns-portarias-ia/consultar                    "Consultar Aplicação do Recurso" (IA)
  POST /api/fns-portarias-ia/validar                      gestor marca a classificação como validada

Consultivo: nada aqui autoriza despesa nem altera as transferências do FNS.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from routers.auth import ip_de
from routers.fns_previsao import _pode_editar
from services import fns_portarias_agente as ag
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/fns-portarias-ia", tags=["FNS — Agente de análise das portarias"])


@router.get("/painel")
async def painel(current: SessaoMunicipal, exercicio: int = Query(2026, ge=2015, le=2100),
                 db: AsyncSession = Depends(get_db)):
    return await ag.painel(db, current.municipio_id, current.municipio_ibge, exercicio)


@router.get("/portaria")
async def portaria(current: SessaoMunicipal, numero: str = Query(..., min_length=1, max_length=60),
                   exercicio: int = Query(2026, ge=2015, le=2100), db: AsyncSession = Depends(get_db)):
    r = await ag.detalhe(db, current.municipio_id, current.municipio_ibge, exercicio, numero)
    if r is None:
        raise HTTPException(404, "Portaria não encontrada nas transferências do exercício.")
    return r


@router.post("/analisar-lote")
async def analisar_lote(request: Request, current: SessaoMunicipal, exercicio: int = Query(2026, ge=2015, le=2100),
                        db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    r = await ag.analisar_lote(db, current.municipio_id, current.municipio_ibge, exercicio, forcar=True)
    await registrar_auditoria(db, "FNS_PORTARIAS_ANALISE_LOTE", usuario=current, ip=ip_de(request),
                              tabela="fns_portaria_analise", detalhe=f"exercicio {exercicio}: {r['portarias']} portarias")
    return r


@router.post("/verificar-normas")
async def verificar_normas(request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    r = await ag.verificar_normas(db)
    await registrar_auditoria(db, "FNS_PORTARIAS_VERIFICAR_NORMAS", usuario=current, ip=ip_de(request),
                              tabela="fns_norma_verificacao",
                              detalhe=f"conferem {r['conferem']}, divergem {len(r['nao_conferem'])}")
    return r


class ConsultaIn(BaseModel):
    numero: str = Field(min_length=1, max_length=60)
    exercicio: int = Field(2026, ge=2015, le=2100)
    pergunta: str = Field(min_length=5, max_length=1500)


@router.post("/consultar")
async def consultar(body: ConsultaIn, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    try:
        r = await ag.consultar_aplicacao(db, current.municipio_id, current.municipio_ibge, body.exercicio,
                                         body.numero, body.pergunta.strip(), settings.ANTHROPIC_API_KEY)
    except LookupError as e:
        raise HTTPException(404, str(e))
    except ag.IAIndisponivel as e:
        raise HTTPException(503, str(e))
    await registrar_auditoria(db, "FNS_PORTARIAS_CONSULTA_IA", usuario=current, ip=ip_de(request),
                              tabela="fns_portaria_analise",
                              detalhe=f"portaria {body.numero}/{body.exercicio}: {r['classificacao']}")
    return r


class ValidarIn(BaseModel):
    numero: str = Field(min_length=1, max_length=60)
    exercicio: int = Field(2026, ge=2015, le=2100)
    nota: Optional[str] = Field(None, max_length=2000)


@router.post("/validar")
async def validar(body: ValidarIn, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    ok = await ag.validar(db, current.municipio_ibge, body.exercicio, body.numero, current.username, body.nota)
    if not ok:
        raise HTTPException(404, "Análise não encontrada.")
    await registrar_auditoria(db, "FNS_PORTARIAS_VALIDACAO", usuario=current, ip=ip_de(request),
                              tabela="fns_portaria_analise", detalhe=f"portaria {body.numero}/{body.exercicio}")
    return {"ok": True}
