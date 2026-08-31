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


@router.get("/pendentes-dou")
async def portarias_dou_pendentes(
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """
    Retorna portarias capturadas pelo agente DOU que ainda não foram importadas
    para o Banco de Portarias (status != 'importado').
    """
    from models.portaria_dou import PortariaDOU
    res = await db.execute(
        select(PortariaDOU)
        .where(PortariaDOU.status != "importado")
        .where(PortariaDOU.relevancia.in_(["apui", "amazonas", "federal"]))
        .order_by(PortariaDOU.capturado_em.desc())
        .limit(200)
    )
    rows = res.scalars().all()
    return [
        {
            "id":             r.id,
            "titulo":         r.titulo,
            "numero":         r.numero,
            "orgao":          r.orgao,
            "data_publicacao":r.data_publicacao,
            "relevancia":     r.relevancia,
            "prioridade":     r.prioridade,
            "url_oficial":    r.url_oficial,
        }
        for r in rows
    ]


@router.post("/importar-dou")
async def importar_portarias_dou(
    ids: list[int],
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """
    Importa portarias selecionadas do agente DOU para o Banco de Portarias.
    Converte PortariaDOU → Portaria e marca a origem como 'importado'.
    """
    from models.portaria_dou import PortariaDOU

    importadas = 0
    erros: list[str] = []

    for pid in ids:
        try:
            res = await db.execute(select(PortariaDOU).where(PortariaDOU.id == pid))
            dou = res.scalar_one_or_none()
            if not dou:
                erros.append(f"ID {pid} não encontrado")
                continue

            # Extrai ano da data de publicação
            try:
                ano = int((dou.data_publicacao or "")[:4]) or 2026
            except Exception:
                ano = 2026

            # Mapa de relevância → bloco aproximado
            bloco_map = {
                "apui":     "Atenção Primária",
                "amazonas": "Atenção Primária",
                "federal":  "Atenção Primária",
            }

            nova = Portaria(
                numero=dou.numero or dou.titulo[:50],
                ano=ano,
                orgao_emissor=dou.orgao or "GM/MS",
                programa=None,
                bloco=bloco_map.get(dou.relevancia),
                grupo=dou.relevancia,
                acao=None,
                natureza="Normativa",
                objeto=(dou.resumo or dou.titulo)[:2000],
                data_publicacao=None,
                link_diario=dou.url_oficial,
                valor_total=0.0,
            )
            db.add(nova)
            dou.status = "importado"
            importadas += 1
        except Exception as exc:
            erros.append(f"ID {pid}: {exc}")

    await db.commit()
    return {
        "ok":        True,
        "importadas": importadas,
        "erros":     erros,
    }


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
