"""
Router: /api/portarias — Módulo 6: Banco de Portarias
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
import uuid, os

from database import get_db
from models import Portaria, Municipio, PortariaMunicipio
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/portarias", tags=["Portarias"])

# Diretório local para armazenar PDFs (substitua por MinIO em produção)
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/ersus360/portarias")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Schemas ───────────────────────────────────────────────────────────────────

class PortariaIn(BaseModel):
    numero: str
    ano: int
    orgao_emissor: str = "GM/MS"
    programa: Optional[str] = None
    bloco: Optional[str] = None
    grupo: Optional[str] = None
    acao: Optional[str] = None
    natureza: Optional[str] = None
    objeto: Optional[str] = None
    data_publicacao: Optional[date] = None
    link_diario: Optional[str] = None
    valor_total: float = 0.0


class PortariaOut(PortariaIn):
    id: int
    arquivo_pdf: Optional[str]
    criado_em: date

    class Config:
        from_attributes = True


class PortariaMunicipioIn(BaseModel):
    portaria_id: int
    valor_municipio: float = 0.0
    competencia: Optional[str] = None
    observacoes: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[PortariaOut])
async def listar_portarias(
    q: Optional[str] = Query(None, description="Busca por número, programa ou objeto"),
    bloco: Optional[str] = None,
    ano: Optional[int] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    stmt = select(Portaria).order_by(Portaria.ano.desc(), Portaria.numero)

    if q:
        busca = f"%{q}%"
        stmt = stmt.where(
            or_(
                Portaria.numero.ilike(busca),
                Portaria.programa.ilike(busca),
                Portaria.objeto.ilike(busca),
                Portaria.bloco.ilike(busca),
            )
        )
    if bloco:
        stmt = stmt.where(Portaria.bloco == bloco)
    if ano:
        stmt = stmt.where(Portaria.ano == ano)

    stmt = stmt.offset(offset).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/{portaria_id}", response_model=PortariaOut)
async def get_portaria(
    portaria_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Portaria).where(Portaria.id == portaria_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Portaria não encontrada")
    return p


@router.post("", response_model=PortariaOut, status_code=201)
async def criar_portaria(
    dados: PortariaIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    portaria = Portaria(**dados.model_dump())
    db.add(portaria)
    await db.commit()
    await db.refresh(portaria)
    return portaria


@router.put("/{portaria_id}", response_model=PortariaOut)
async def atualizar_portaria(
    portaria_id: int,
    dados: PortariaIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Portaria).where(Portaria.id == portaria_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Portaria não encontrada")
    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(p, campo, valor)
    await db.commit()
    await db.refresh(p)
    return p


@router.post("/{portaria_id}/pdf")
async def upload_pdf(
    portaria_id: int,
    arquivo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Portaria).where(Portaria.id == portaria_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Portaria não encontrada")

    ext = os.path.splitext(arquivo.filename or "arquivo.pdf")[1]
    nome_arquivo = f"{uuid.uuid4()}{ext}"
    caminho = os.path.join(UPLOAD_DIR, nome_arquivo)

    conteudo = await arquivo.read()
    with open(caminho, "wb") as f:
        f.write(conteudo)

    p.arquivo_pdf = caminho
    await db.commit()
    return {"ok": True, "arquivo": caminho, "tamanho_kb": len(conteudo) // 1024}


@router.delete("/{portaria_id}")
async def remover_portaria(
    portaria_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Portaria).where(Portaria.id == portaria_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Portaria não encontrada")
    await db.delete(p)
    await db.commit()
    return {"ok": True}


@router.post("/vincular-municipio", status_code=201)
async def vincular_municipio(
    dados: PortariaMunicipioIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    if not mun:
        raise HTTPException(404, "Município não encontrado")

    vinculo = PortariaMunicipio(
        portaria_id=dados.portaria_id,
        municipio_id=mun.id,
        valor_municipio=dados.valor_municipio,
        competencia=dados.competencia,
        observacoes=dados.observacoes,
    )
    db.add(vinculo)
    await db.commit()
    return {"ok": True, "id": vinculo.id}
