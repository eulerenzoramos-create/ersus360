"""
Router: /api/documentos — Módulo 9: Gestão de Documentos (multi-tenant)

Arquivos ficam em UPLOAD_DIR/municipios/{municipio_uuid}/documentos/{tipo}/ e
só são servidos por este router, após conferir que o documento pertence ao
município da sessão. Exclusão é lógica (arquivo e registro preservados).
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
import re, uuid, os

from database import get_db
from models.documento import Documento
from routers.auth import UserOut
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal, garantir_do_municipio

router = APIRouter(prefix="/api/documentos", tags=["Documentos"])

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/ersus360")

TIPOS_VALIDOS = {
    "Portaria", "Ofício", "Nota Técnica", "Parecer",
    "Extrato Bancário", "Comprovante", "Nota Fiscal",
    "Foto", "Relatório", "Outro",
}


# ── Schemas ───────────────────────────────────────────────────────────────────

class DocumentoOut(BaseModel):
    id: int
    municipio_id: int
    convenio_id: Optional[int]
    titulo: str
    tipo: str
    arquivo: str
    tamanho_kb: Optional[int]
    mime_type: Optional[str]
    descricao: Optional[str]
    uploader_id: Optional[int]
    criado_em: datetime

    class Config:
        from_attributes = True


# ── Helpers ───────────────────────────────────────────────────────────────────

def _pasta_municipio(current: UserOut, tipo: str) -> str:
    subpasta = re.sub(r"[^a-z0-9_]", "_", tipo.lower()) or "outro"
    return os.path.join(UPLOAD_DIR, "municipios", current.municipio_uuid or str(current.municipio_id),
                        "documentos", subpasta)


async def _documento(db: AsyncSession, current: UserOut, doc_id: int) -> Documento:
    doc = await db.get(Documento, doc_id)
    if doc is not None and doc.excluido_em is not None:
        doc = None
    return await garantir_do_municipio(db, current, doc, "documentos", doc_id)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[DocumentoOut])
async def listar_documentos(
    current: SessaoMunicipal,
    tipo: Optional[str] = None,
    convenio_id: Optional[int] = None,
    q: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Documento)
        .where(Documento.municipio_id == current.municipio_id)
        .where(Documento.excluido_em.is_(None))
        .order_by(Documento.criado_em.desc())
    )
    if tipo:
        stmt = stmt.where(Documento.tipo == tipo)
    if convenio_id:
        stmt = stmt.where(Documento.convenio_id == convenio_id)
    if q:
        stmt = stmt.where(
            or_(Documento.titulo.ilike(f"%{q}%"), Documento.descricao.ilike(f"%{q}%"))
        )

    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/upload", response_model=DocumentoOut, status_code=201)
async def upload_documento(
    current: SessaoMunicipal,
    titulo: str,
    tipo: str = "Outro",
    convenio_id: Optional[int] = None,
    descricao: Optional[str] = None,
    arquivo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if convenio_id is not None:
        from models.convenio import Convenio
        await garantir_do_municipio(db, current, await db.get(Convenio, convenio_id), "convenios", convenio_id)

    ext = re.sub(r"[^A-Za-z0-9.]", "", os.path.splitext(arquivo.filename or "arquivo")[1])[:10]
    pasta = _pasta_municipio(current, tipo)
    os.makedirs(pasta, exist_ok=True)
    caminho = os.path.join(pasta, f"{uuid.uuid4()}{ext}")

    conteudo = await arquivo.read()
    with open(caminho, "wb") as f:
        f.write(conteudo)

    doc = Documento(
        municipio_id=current.municipio_id,
        convenio_id=convenio_id,
        titulo=titulo,
        tipo=tipo,
        arquivo=caminho,
        tamanho_kb=len(conteudo) // 1024,
        mime_type=arquivo.content_type,
        descricao=descricao,
        uploader_id=current.usuario_id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("/{doc_id}/download")
async def download_documento(
    doc_id: int,
    current: SessaoMunicipal,
    db: AsyncSession = Depends(get_db),
):
    doc = await _documento(db, current, doc_id)
    if not os.path.exists(doc.arquivo):
        raise HTTPException(404, "Arquivo não encontrado no servidor")
    await registrar_auditoria(db, "DOCUMENTO_DOWNLOAD", usuario=current, tabela="documentos", registro_id=doc.id)
    return FileResponse(
        path=doc.arquivo,
        filename=os.path.basename(doc.arquivo),
        media_type=doc.mime_type or "application/octet-stream",
    )


@router.delete("/{doc_id}")
async def remover_documento(
    doc_id: int,
    current: SessaoMunicipal,
    db: AsyncSession = Depends(get_db),
):
    doc = await _documento(db, current, doc_id)
    doc.excluido_em = datetime.utcnow()
    await db.commit()
    await registrar_auditoria(db, "DOCUMENTO_EXCLUIDO", usuario=current, tabela="documentos", registro_id=doc.id,
                              detalhe="exclusão lógica — arquivo preservado")
    return {"ok": True}
