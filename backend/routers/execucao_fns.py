"""Router: /api/execucao-fns — Execução Financeira FNS — ERSUS 360
Empenho · Liquidação · Pagamento · Documentos · Portarias
"""
from __future__ import annotations
import base64
import logging
from datetime import date, datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.execucao_fns import ExecucaoFns, DocumentoExecucao

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/execucao-fns", tags=["execucao-fns"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


# ── Schemas ───────────────────────────────────────────────────────────────────

class EmpenhoIn(BaseModel):
    exercicio:      int = 2026
    recurso:        str
    bloco:          str = ""
    grupo:          str = ""
    dotacao:        float = 0.0
    numero_empenho: Optional[str] = None
    data_empenho:   Optional[date] = None
    empenhado:      float = 0.0
    fornecedor:     str = ""
    cnpj_fornecedor: Optional[str] = None
    contrato:       Optional[str] = None
    conta_pagadora: Optional[str] = None
    portaria:       Optional[str] = None
    situacao:       str = "Pendente"
    observacao:     Optional[str] = None
    criado_por:     Optional[str] = None

class LiquidacaoIn(BaseModel):
    data_liquidacao: Optional[date] = None
    liquidado:       float = 0.0
    nota_fiscal:     Optional[str] = None
    observacao:      Optional[str] = None
    editado_por:     Optional[str] = None

class PagamentoIn(BaseModel):
    data_pagamento:   Optional[date] = None
    pago:             float = 0.0
    numero_ob:        Optional[str] = None
    banco_pagamento:  Optional[str] = None
    agencia_pagamento: Optional[str] = None
    numero_conta_pag:  Optional[str] = None
    observacao:       Optional[str] = None
    editado_por:      Optional[str] = None

class PortariaIn(BaseModel):
    portaria:    Optional[str] = None
    editado_por: Optional[str] = None

class ExecucaoUpdate(BaseModel):
    recurso:        Optional[str] = None
    bloco:          Optional[str] = None
    grupo:          Optional[str] = None
    dotacao:        Optional[float] = None
    numero_empenho: Optional[str] = None
    data_empenho:   Optional[date] = None
    empenhado:      Optional[float] = None
    data_liquidacao: Optional[date] = None
    liquidado:      Optional[float] = None
    nota_fiscal:    Optional[str] = None
    data_pagamento: Optional[date] = None
    pago:           Optional[float] = None
    numero_ob:      Optional[str] = None
    banco_pagamento: Optional[str] = None
    agencia_pagamento: Optional[str] = None
    numero_conta_pag: Optional[str] = None
    fornecedor:     Optional[str] = None
    cnpj_fornecedor: Optional[str] = None
    contrato:       Optional[str] = None
    conta_pagadora: Optional[str] = None
    portaria:       Optional[str] = None
    situacao:       Optional[str] = None
    observacao:     Optional[str] = None
    editado_por:    Optional[str] = None

class EmailIn(BaseModel):
    destinatario: str
    assunto:      str = "Execução Financeira FNS"
    corpo:        str = ""


# ── helpers ───────────────────────────────────────────────────────────────────

def _resolver_situacao(r: ExecucaoFns) -> str:
    if r.pago and r.pago >= r.empenhado and r.empenhado > 0:
        return "Pago"
    if r.liquidado and r.liquidado > 0:
        return "Liquidado"
    if r.empenhado and r.empenhado > 0:
        return "Empenhado"
    return "Pendente"

async def _get_or_404(db: AsyncSession, id: int) -> ExecucaoFns:
    obj = await db.get(ExecucaoFns, id)
    if not obj or not obj.ativo:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return obj


# ── LISTAGEM ──────────────────────────────────────────────────────────────────

@router.get("")
async def listar(
    db: DbDep,
    exercicio: int = Query(2026),
    situacao: str = Query(""),
    grupo: str = Query(""),
    busca: str = Query(""),
):
    q = select(ExecucaoFns).where(
        ExecucaoFns.ativo == True,
        ExecucaoFns.exercicio == exercicio,
    )
    if situacao:
        q = q.where(ExecucaoFns.situacao == situacao)
    if grupo:
        q = q.where(ExecucaoFns.grupo == grupo)
    if busca:
        like = f"%{busca}%"
        from sqlalchemy import or_
        q = q.where(or_(
            ExecucaoFns.recurso.ilike(like),
            ExecucaoFns.fornecedor.ilike(like),
        ))
    q = q.order_by(ExecucaoFns.criado_em.desc())
    rows = (await db.execute(q)).scalars().all()
    return [r.to_dict() for r in rows]


@router.get("/dashboard")
async def dashboard(db: DbDep, exercicio: int = Query(2026)):
    q = select(ExecucaoFns).where(
        ExecucaoFns.ativo == True,
        ExecucaoFns.exercicio == exercicio,
    )
    rows = (await db.execute(q)).scalars().all()
    total_dotacao   = sum(r.dotacao    for r in rows)
    total_empenhado = sum(r.empenhado  for r in rows)
    total_liquidado = sum(r.liquidado  for r in rows)
    total_pago      = sum(r.pago       for r in rows)
    return {
        "exercicio":       exercicio,
        "dotacao":         total_dotacao,
        "empenhado":       total_empenhado,
        "liquidado":       total_liquidado,
        "pago":            total_pago,
        "saldo_livre":     total_dotacao - total_pago,
        "pct_executado":   round((total_pago / total_dotacao * 100), 1) if total_dotacao else 0,
        "qtd_registros":   len(rows),
        "verificado_em":   datetime.utcnow().isoformat(),
    }

@router.get("/indicadores")
async def indicadores(db: DbDep, exercicio: int = Query(2026)):
    return await dashboard(db=db, exercicio=exercicio)

@router.get("/portarias")
async def listar_portarias(db: DbDep, exercicio: int = Query(2026)):
    q = select(ExecucaoFns.portaria).where(
        ExecucaoFns.ativo == True,
        ExecucaoFns.exercicio == exercicio,
        ExecucaoFns.portaria != None,
    ).distinct()
    rows = (await db.execute(q)).scalars().all()
    return [r for r in rows if r]


# ── CRUD PRINCIPAL ────────────────────────────────────────────────────────────

@router.post("/empenho", status_code=201)
async def criar_empenho(db: DbDep, body: EmpenhoIn):
    obj = ExecucaoFns(**body.model_dump())
    obj.situacao = _resolver_situacao(obj)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    logger.info("Empenho criado id=%s recurso=%s", obj.id, obj.recurso)
    return obj.to_dict()


@router.get("/{id}")
async def obter(db: DbDep, id: int):
    return (await _get_or_404(db, id)).to_dict()


@router.put("/{id}")
async def atualizar(db: DbDep, id: int, body: ExecucaoUpdate):
    obj = await _get_or_404(db, id)
    data = body.model_dump(exclude_none=True)
    editado_por = data.pop("editado_por", None)
    for k, v in data.items():
        setattr(obj, k, v)
    obj.situacao = _resolver_situacao(obj)
    if editado_por:
        obj.editado_por = editado_por
    obj.editado_em = datetime.utcnow()
    await db.commit()
    await db.refresh(obj)
    return obj.to_dict()


@router.put("/{id}/liquidacao")
async def registrar_liquidacao(db: DbDep, id: int, body: LiquidacaoIn):
    obj = await _get_or_404(db, id)
    if body.data_liquidacao: obj.data_liquidacao = body.data_liquidacao
    if body.liquidado is not None: obj.liquidado = body.liquidado
    if body.nota_fiscal: obj.nota_fiscal = body.nota_fiscal
    if body.observacao: obj.observacao = body.observacao
    obj.situacao = _resolver_situacao(obj)
    obj.editado_por = body.editado_por
    obj.editado_em  = datetime.utcnow()
    await db.commit()
    await db.refresh(obj)
    return obj.to_dict()


@router.put("/{id}/pagamento")
async def registrar_pagamento(db: DbDep, id: int, body: PagamentoIn):
    obj = await _get_or_404(db, id)
    if body.data_pagamento:    obj.data_pagamento    = body.data_pagamento
    if body.pago is not None:  obj.pago              = body.pago
    if body.numero_ob:         obj.numero_ob         = body.numero_ob
    if body.banco_pagamento:   obj.banco_pagamento   = body.banco_pagamento
    if body.agencia_pagamento: obj.agencia_pagamento = body.agencia_pagamento
    if body.numero_conta_pag:  obj.numero_conta_pag  = body.numero_conta_pag
    if body.observacao:        obj.observacao        = body.observacao
    obj.situacao    = _resolver_situacao(obj)
    obj.editado_por = body.editado_por
    obj.editado_em  = datetime.utcnow()
    await db.commit()
    await db.refresh(obj)
    return obj.to_dict()


@router.put("/{id}/portaria")
async def vincular_portaria(db: DbDep, id: int, body: PortariaIn):
    obj = await _get_or_404(db, id)
    obj.portaria    = body.portaria
    obj.editado_por = body.editado_por
    obj.editado_em  = datetime.utcnow()
    await db.commit()
    await db.refresh(obj)
    return obj.to_dict()


@router.delete("/{id}")
async def excluir(db: DbDep, id: int, excluido_por: str = Query("")):
    obj = await _get_or_404(db, id)
    obj.ativo        = False
    obj.excluido_por = excluido_por or None
    obj.excluido_em  = datetime.utcnow()
    await db.commit()
    return {"ok": True, "id": id}


# ── DOCUMENTOS ────────────────────────────────────────────────────────────────

@router.post("/{id}/documentos", status_code=201)
async def anexar_documento(
    db: DbDep,
    id: int,
    file: UploadFile = File(...),
):
    await _get_or_404(db, id)
    content = await file.read()
    if len(content) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Arquivo maior que 15 MB")
    doc = DocumentoExecucao(
        execucao_id   = id,
        nome          = file.filename or "arquivo",
        tipo_mime     = file.content_type or "application/octet-stream",
        tamanho_kb    = len(content) // 1024,
        conteudo_b64  = base64.b64encode(content).decode(),
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc.to_dict_meta()


@router.get("/{id}/documentos")
async def listar_documentos(db: DbDep, id: int):
    q = select(DocumentoExecucao).where(DocumentoExecucao.execucao_id == id)
    rows = (await db.execute(q)).scalars().all()
    return [r.to_dict_meta() for r in rows]


@router.get("/documentos/{doc_id}/download")
async def download_documento(db: DbDep, doc_id: int):
    doc = await db.get(DocumentoExecucao, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    content = base64.b64decode(doc.conteudo_b64)
    return Response(
        content=content,
        media_type=doc.tipo_mime,
        headers={"Content-Disposition": f'attachment; filename="{doc.nome}"'},
    )


@router.delete("/documentos/{doc_id}")
async def excluir_documento(db: DbDep, doc_id: int):
    doc = await db.get(DocumentoExecucao, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    await db.delete(doc)
    await db.commit()
    return {"ok": True}


# ── EMAIL ─────────────────────────────────────────────────────────────────────

@router.post("/email")
async def enviar_email(body: EmailIn):
    try:
        import os, httpx
        api_key = os.environ.get("RESEND_API_KEY", "")
        if not api_key:
            raise HTTPException(status_code=503, detail="RESEND_API_KEY não configurada")
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "from": "ERSUS360 <noreply@ersus360.app>",
                    "to": [body.destinatario],
                    "subject": body.assunto,
                    "text": body.corpo,
                },
                timeout=15,
            )
        r.raise_for_status()
        return {"ok": True, "id": r.json().get("id")}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Erro ao enviar e-mail: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
