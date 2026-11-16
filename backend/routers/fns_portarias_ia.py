"""
Router: Agente IA de análise das Portarias do FNS (aba Repasses Mensais — FNS › Portarias). Multi-município.

  GET  /api/fns-portarias-ia/painel?exercicio=           consolidado + etiquetas (reanalisa só o que mudou)
  GET  /api/fns-portarias-ia/portaria?exercicio=&numero=  análise técnica individual
  POST /api/fns-portarias-ia/analisar-lote?exercicio=     reanalisa todas as portarias (forçado)
  POST /api/fns-portarias-ia/verificar-normas             confere os dispositivos no texto oficial
  POST /api/fns-portarias-ia/consultar                    "Consultar Aplicação do Recurso" (IA)
  POST /api/fns-portarias-ia/documento                    cadastra o link oficial da portaria no catálogo
  POST /api/fns-portarias-ia/validar                      gestor marca a classificação como validada

Consultivo: nada aqui autoriza despesa nem altera as transferências do FNS.
"""
from __future__ import annotations

from datetime import date
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


@router.get("/portaria/pdf")
async def portaria_pdf(request: Request, current: SessaoMunicipal,
                       numero: str = Query(..., min_length=1, max_length=60),
                       exercicio: int = Query(2026, ge=2015, le=2100), db: AsyncSession = Depends(get_db)):
    """PDF da análise técnica (A4) para imprimir ou anexar a um e-mail."""
    from fastapi.responses import Response
    from services import fns_portarias_pdf as pdfsvc
    r = await ag.detalhe(db, current.municipio_id, current.municipio_ibge, exercicio, numero)
    if r is None:
        raise HTTPException(404, "Portaria não encontrada nas transferências do exercício.")
    conteudo = pdfsvc.gerar(r, municipio=current.municipio, gerado_por=current.nome or current.username)
    await registrar_auditoria(db, "FNS_PORTARIAS_PDF", usuario=current, ip=ip_de(request),
                              tabela="fns_portaria_analise", detalhe=f"portaria {numero}/{exercicio}")
    return Response(conteudo, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="{pdfsvc.nome_arquivo(numero, exercicio)}"'})


class EmailIn(BaseModel):
    numero: str = Field(min_length=1, max_length=60)
    exercicio: int = Field(2026, ge=2015, le=2100)
    destinatarios: list[str] = Field(min_length=1, max_length=5)
    mensagem: Optional[str] = Field(None, max_length=2000)


@router.post("/portaria/enviar-email")
async def portaria_enviar_email(body: EmailIn, request: Request, current: SessaoMunicipal,
                                db: AsyncSession = Depends(get_db)):
    """Envia o PDF da análise técnica por e-mail (Resend, mesma configuração do e-mail diário de portarias)."""
    from services import fns_portarias_pdf as pdfsvc
    _pode_editar(current)
    try:
        destinos = ag.validar_emails(body.destinatarios)
    except ValueError as e:
        raise HTTPException(422, str(e))
    r = await ag.detalhe(db, current.municipio_id, current.municipio_ibge, body.exercicio, body.numero)
    if r is None:
        raise HTTPException(404, "Portaria não encontrada nas transferências do exercício.")
    conteudo = pdfsvc.gerar(r, municipio=current.municipio, gerado_por=current.nome or current.username)
    res = await ag.enviar_pdf_email(r, conteudo, pdfsvc.nome_arquivo(body.numero, body.exercicio), destinos,
                                    body.mensagem, municipio=current.municipio,
                                    remetente_nome=current.nome or current.username)
    await registrar_auditoria(db, "FNS_PORTARIAS_EMAIL", usuario=current, ip=ip_de(request),
                              tabela="fns_portaria_analise",
                              detalhe=f"portaria {body.numero}/{body.exercicio} para {len(destinos)} destinatário(s): "
                                      f"{'enviado' if res['ok'] else 'falhou'}")
    if not res["ok"]:
        raise HTTPException(503, res["erro"])
    return {"ok": True, "destinatarios": destinos}


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


class DocumentoIn(BaseModel):
    numero: str = Field(min_length=1, max_length=60)
    exercicio: int = Field(2026, ge=2015, le=2100)
    ano: int = Field(ge=1990, le=2100)
    link: str = Field(min_length=12, max_length=1000)
    data_publicacao: Optional[date] = None


@router.post("/documento")
async def registrar_documento(body: DocumentoIn, request: Request, current: SessaoMunicipal,
                              db: AsyncSession = Depends(get_db)):
    """Cadastra o link oficial da portaria no catálogo (só domínios oficiais; nunca sobrescreve link existente)."""
    _pode_editar(current)
    if body.ano > body.exercicio:
        raise HTTPException(422, "O ano da portaria não pode ser posterior ao exercício do repasse.")
    try:
        r = await ag.registrar_documento(db, body.numero, body.ano, body.link, body.data_publicacao)
    except ValueError as e:
        raise HTTPException(422, str(e))
    await registrar_auditoria(db, "FNS_PORTARIAS_DOCUMENTO", usuario=current, ip=ip_de(request),
                              tabela="portarias", detalhe=f"portaria {r['numero']}/{r['ano']} {r['acao']}")
    # o catálogo mudou: a análise desta portaria passa a ter ano, data e link
    await ag.analisar_lote(db, current.municipio_id, current.municipio_ibge, body.exercicio)
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
