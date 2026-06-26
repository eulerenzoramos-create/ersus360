"""
Router: /api/obras — Módulo 4: Obras e SISMOB
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
import uuid, os

from database import get_db
from models import Municipio
from models.obra import Obra, ObraFoto, ObraCronograma, TipoEstabelecimento, TipoObra, StatusObra, StatusEtapa
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/obras", tags=["Obras"])

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/ersus360/obras")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ── Schemas ───────────────────────────────────────────────────────────────────

class ObraIn(BaseModel):
    convenio_id: Optional[int] = None
    numero_sismob: Optional[str] = None
    tipo_estabelecimento: TipoEstabelecimento = TipoEstabelecimento.UBS
    nome_estabelecimento: str
    tipo_obra: TipoObra = TipoObra.CONSTRUCAO
    endereco: Optional[str] = None
    valor_contrato: float = 0.0
    empresa_construtora: Optional[str] = None
    cnpj_empresa: Optional[str] = None
    engenheiro_resp: Optional[str] = None
    art_numero: Optional[str] = None
    data_inicio: Optional[date] = None
    data_previsao_conclusao: Optional[date] = None
    perc_fisico: float = 0.0
    perc_financeiro: float = 0.0
    status: StatusObra = StatusObra.LICITACAO
    observacoes: Optional[str] = None


class ObraOut(ObraIn):
    id: int
    municipio_id: int
    dias_atraso: Optional[int] = None

    class Config:
        from_attributes = True


class EtapaIn(BaseModel):
    etapa: str
    data_inicio_prevista: Optional[date] = None
    data_fim_prevista: Optional[date] = None
    perc_previsto: float = 0.0
    perc_realizado: float = 0.0
    status: StatusEtapa = StatusEtapa.PENDENTE


class EtapaOut(EtapaIn):
    id: int
    obra_id: int

    class Config:
        from_attributes = True


class FotoOut(BaseModel):
    id: int
    obra_id: int
    arquivo: str
    data_foto: Optional[date]
    descricao: Optional[str]

    class Config:
        from_attributes = True


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ObraOut])
async def listar_obras(
    status: Optional[StatusObra] = None,
    tipo: Optional[TipoEstabelecimento] = None,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    stmt = select(Obra).order_by(Obra.nome_estabelecimento)
    if status:
        stmt = stmt.where(Obra.status == status)
    if tipo:
        stmt = stmt.where(Obra.tipo_estabelecimento == tipo)
    res = await db.execute(stmt)
    obras = res.scalars().all()
    return [
        ObraOut(
            **{c.key: getattr(o, c.key) for c in o.__table__.columns},
            dias_atraso=o.dias_atraso,
        )
        for o in obras
    ]


@router.get("/{obra_id}", response_model=ObraOut)
async def get_obra(
    obra_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Obra).where(Obra.id == obra_id))
    obra = res.scalar_one_or_none()
    if not obra:
        raise HTTPException(404, "Obra não encontrada")
    return ObraOut(
        **{c.key: getattr(obra, c.key) for c in obra.__table__.columns},
        dias_atraso=obra.dias_atraso,
    )


@router.post("", response_model=ObraOut, status_code=201)
async def criar_obra(
    dados: ObraIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    if not mun:
        raise HTTPException(404, "Município não cadastrado")
    obra = Obra(municipio_id=mun.id, **dados.model_dump())
    db.add(obra)
    await db.commit()
    await db.refresh(obra)
    return ObraOut(
        **{c.key: getattr(obra, c.key) for c in obra.__table__.columns},
        dias_atraso=obra.dias_atraso,
    )


@router.put("/{obra_id}", response_model=ObraOut)
async def atualizar_obra(
    obra_id: int,
    dados: ObraIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Obra).where(Obra.id == obra_id))
    obra = res.scalar_one_or_none()
    if not obra:
        raise HTTPException(404, "Obra não encontrada")
    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(obra, campo, valor)
    await db.commit()
    await db.refresh(obra)
    return ObraOut(
        **{c.key: getattr(obra, c.key) for c in obra.__table__.columns},
        dias_atraso=obra.dias_atraso,
    )


@router.delete("/{obra_id}")
async def remover_obra(
    obra_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Obra).where(Obra.id == obra_id))
    obra = res.scalar_one_or_none()
    if not obra:
        raise HTTPException(404, "Obra não encontrada")
    await db.delete(obra)
    await db.commit()
    return {"ok": True}


# ── Cronograma ────────────────────────────────────────────────────────────────

@router.get("/{obra_id}/cronograma", response_model=list[EtapaOut])
async def listar_etapas(
    obra_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(
        select(ObraCronograma)
        .where(ObraCronograma.obra_id == obra_id)
        .order_by(ObraCronograma.data_inicio_prevista)
    )
    return res.scalars().all()


@router.post("/{obra_id}/cronograma", response_model=EtapaOut, status_code=201)
async def criar_etapa(
    obra_id: int,
    dados: EtapaIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    etapa = ObraCronograma(obra_id=obra_id, **dados.model_dump())
    db.add(etapa)
    await db.commit()
    await db.refresh(etapa)
    return etapa


@router.put("/{obra_id}/cronograma/{etapa_id}", response_model=EtapaOut)
async def atualizar_etapa(
    obra_id: int,
    etapa_id: int,
    dados: EtapaIn,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(
        select(ObraCronograma).where(
            ObraCronograma.id == etapa_id, ObraCronograma.obra_id == obra_id
        )
    )
    etapa = res.scalar_one_or_none()
    if not etapa:
        raise HTTPException(404, "Etapa não encontrada")
    for campo, valor in dados.model_dump().items():
        setattr(etapa, campo, valor)
    await db.commit()
    await db.refresh(etapa)
    return etapa


# ── Fotos ─────────────────────────────────────────────────────────────────────

@router.get("/{obra_id}/fotos", response_model=list[FotoOut])
async def listar_fotos(
    obra_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(
        select(ObraFoto)
        .where(ObraFoto.obra_id == obra_id)
        .order_by(ObraFoto.data_foto.desc())
    )
    return res.scalars().all()


@router.post("/{obra_id}/fotos", response_model=FotoOut, status_code=201)
async def upload_foto(
    obra_id: int,
    descricao: Optional[str] = None,
    arquivo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(select(Obra).where(Obra.id == obra_id))
    if not res.scalar_one_or_none():
        raise HTTPException(404, "Obra não encontrada")

    pasta = os.path.join(UPLOAD_DIR, str(obra_id))
    os.makedirs(pasta, exist_ok=True)
    ext = os.path.splitext(arquivo.filename or "foto.jpg")[1]
    nome = f"{uuid.uuid4()}{ext}"
    caminho = os.path.join(pasta, nome)

    conteudo = await arquivo.read()
    with open(caminho, "wb") as f:
        f.write(conteudo)

    foto = ObraFoto(
        obra_id=obra_id,
        arquivo=caminho,
        data_foto=date.today(),
        descricao=descricao,
    )
    db.add(foto)
    await db.commit()
    await db.refresh(foto)
    return foto
