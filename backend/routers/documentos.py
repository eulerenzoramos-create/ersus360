"""
Router: /api/documentos — Módulo 9: Gestão de Documentos
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime
import uuid, os

from database import get_db
from models import Municipio
from models.documento import Documento
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/documentos", tags=["Documentos"])

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/ersus360/documentos")
os.makedirs(UPLOAD_DIR, exist_ok=True)

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


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[DocumentoOut])
async def listar_documentos(
    tipo: Optional[str] = None,
    convenio_id: Optional[int] = None,
    q: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    if not mun:
        return []

    stmt = (
        select(Documento)
        .where(Documento.municipio_id == mun.id)
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
    titulo: str,
    tipo: str = "Outro",
    convenio_id: Optional[int] = None,
    descricao: Optional[str] = None,
    arquivo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current: UserOut = Depends(get_current_user),
):
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    if not mun:
        raise HTTPException(404, "Município não cadastrado")

    ext = os.path.splitext(arquivo.filename or "arquivo")[1]
    nome_arquivo = f"{uuid.uuid4()}{ext}"
    subpasta = tipo.lower().replace(" ", "_").replace("/", "_")
    pasta = os.path.join(UPLOAD_DIR, subpasta)
    os.makedirs(pasta, exist_ok=True)
    caminho = os.path.join(pasta, nome_arquivo)

    conteudo = await arquivo.read()
    with open(caminho, "wb") as f:
        f.write(conteudo)

    doc = Documento(
        municipio_id=mun.id,
        convenio_id=convenio_id,
        titulo=titulo,
        tipo=tipo,
        arquivo=caminho,
        tamanho_kb=len(conteudo) // 1024,
        mime_type=arquivo.content_type,
        descricao=descricao,
        uploader_id=None,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@router.get("/{doc_id}/download")
async def download_documento(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Documento).where(Documento.id == doc_id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Documento não encontrado")
    if not os.path.exists(doc.arquivo):
        raise HTTPException(404, "Arquivo não encontrado no servidor")
    return FileResponse(
        path=doc.arquivo,
        filename=os.path.basename(doc.arquivo),
        media_type=doc.mime_type or "application/octet-stream",
    )


@router.delete("/{doc_id}")
async def remover_documento(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Documento).where(Documento.id == doc_id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Documento não encontrado")
    # remove arquivo do disco
    if os.path.exists(doc.arquivo):
        os.remove(doc.arquivo)
    await db.delete(doc)
    await db.commit()
    return {"ok": True}
