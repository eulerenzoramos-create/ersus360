"""
Router: resultados oficiais da área pública do SIAPS e o ERSUS IA — Analista SIAPS. Multi-município.

  GET  /api/siaps-publico               Avaliação do Quadrimestre, IED, alertas e última sincronização
  POST /api/siaps-publico/sincronizar   consulta o SIAPS agora (além da rotina diária)
  GET  /api/siaps-publico/captura       última captura assistida da área logada (resultados por equipe)
  POST /api/siaps-publico/captura       importa a captura (só resultados oficiais; nenhuma credencial)
  POST /api/siaps-ia/analisar           pergunta / análise / plano de ação / relatório da IA
"""
from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.auth import ip_de
from routers.fns_previsao import _pode_editar
from services import siaps_captura, siaps_ia
from services import siaps_publico as sp
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/siaps-publico", tags=["SIAPS — resultados públicos oficiais"])
router_ia = APIRouter(prefix="/api/siaps-ia", tags=["ERSUS IA — Analista SIAPS"])


@router.get("")
async def painel(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    return await sp.painel(db, current.municipio_id, current.municipio_ibge)


@router.post("/sincronizar")
async def sincronizar(request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    try:
        r = await sp.sincronizar(db, current.municipio_id, current.municipio_ibge)
    except sp.SiapsIndisponivel as e:
        raise HTTPException(503, str(e))
    await registrar_auditoria(db, "SIAPS_PUBLICO_SINCRONIZADO", usuario=current, ip=ip_de(request),
                              tabela="siaps_publico_coleta",
                              detalhe=f"novos {r['novo']} revisados {r['revisado']}")
    return r


@router.get("/captura")
async def captura_situacao(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    return await siaps_captura.situacao(db, current.municipio_ibge)


@router.get("/captura/resultados")
async def captura_resultados(current: SessaoMunicipal, competencia: Optional[str] = None,
                             db: AsyncSession = Depends(get_db)):
    """Qualidade por equipe (classificação oficial) para a aba Componente Qualidade do eGestor."""
    return await siaps_captura.tabela_por_equipe(db, current.municipio_ibge, competencia)


@router.post("/captura")
async def captura_importar(request: Request, current: SessaoMunicipal, pacote: dict = Body(...),
                           db: AsyncSession = Depends(get_db)):
    """Recebe o resultado lido da área logada do SIAPS no navegador do gestor (captura assistida)."""
    _pode_editar(current)
    try:
        r = await siaps_captura.importar(db, current.municipio_ibge, pacote, current.username)
    except siaps_captura.CapturaInvalida as e:
        raise HTTPException(422, str(e))
    await registrar_auditoria(db, "SIAPS_CAPTURA_IMPORTADA", usuario=current, ip=ip_de(request),
                              tabela="resultado_mensal_siaps",
                              detalhe=f"competencias {r['competencias']} inseridos {r['inseridos']} atualizados {r['atualizados']}")
    return r


class AnaliseIn(BaseModel):
    modo: Literal["pergunta", "analise", "plano", "relatorio"] = "pergunta"
    pergunta: Optional[str] = Field(None, max_length=2000)


@router_ia.post("/analisar")
async def analisar(body: AnaliseIn, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    pergunta = (body.pergunta or "").strip() or None
    if body.modo == "pergunta" and not pergunta:
        raise HTTPException(422, "Escreva a pergunta.")
    try:
        r = await siaps_ia.responder(db, current.municipio_id, current.municipio_ibge, current.municipio,
                                     body.modo, pergunta)
    except siaps_ia.IAIndisponivel as e:
        raise HTTPException(503, str(e))
    await registrar_auditoria(db, "SIAPS_IA_CONSULTA", usuario=current, ip=ip_de(request),
                              tabela="siaps_publico_coleta", detalhe=f"modo {body.modo}")
    return r
