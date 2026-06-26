"""Router: /api/emendas — Emendas Parlamentares (InvestSUS / DigiSUS Gestor)"""
from __future__ import annotations
from datetime import date, datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from database import get_db
from models.emenda import Emenda, FaseEmenda, TipoEmenda, QuadrimestreEmenda

router = APIRouter(prefix="/api/emendas", tags=["Emendas"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


# ── Schemas ───────────────────────────────────────────────────────────────────

class EmendaOut(BaseModel):
    id: int
    municipio_id: int
    obra_id: int | None
    numero_emenda: str
    ano: int
    parlamentar: str
    partido: str | None
    uf_parlamentar: str | None
    tipo: str
    objeto: str | None
    programa: str | None
    vinculo: str | None
    valor_indicado: float
    valor_empenhado: float
    valor_liquidado: float
    valor_pago: float
    fase: str
    quadrimestre: str | None
    data_indicacao: date | None
    data_empenho: date | None
    nota_empenho: str | None
    observacoes: str | None
    perc_empenhado: float
    perc_executado: float
    saldo_a_pagar: float
    criado_em: datetime

    class Config:
        from_attributes = True


class EmendaCreate(BaseModel):
    municipio_id: int = 1
    obra_id: int | None = None
    numero_emenda: str
    ano: int
    parlamentar: str
    partido: str | None = None
    uf_parlamentar: str | None = None
    tipo: TipoEmenda = TipoEmenda.individual
    objeto: str | None = None
    programa: str | None = None
    vinculo: str | None = None
    valor_indicado: float = 0
    valor_empenhado: float = 0
    valor_liquidado: float = 0
    valor_pago: float = 0
    fase: FaseEmenda = FaseEmenda.indicada
    quadrimestre: QuadrimestreEmenda | None = None
    data_indicacao: date | None = None
    data_empenho: date | None = None
    nota_empenho: str | None = None
    observacoes: str | None = None


class EmendaUpdate(BaseModel):
    objeto: str | None = None
    programa: str | None = None
    vinculo: str | None = None
    valor_indicado: float | None = None
    valor_empenhado: float | None = None
    valor_liquidado: float | None = None
    valor_pago: float | None = None
    fase: FaseEmenda | None = None
    quadrimestre: QuadrimestreEmenda | None = None
    data_empenho: date | None = None
    nota_empenho: str | None = None
    obra_id: int | None = None
    observacoes: str | None = None


# ── Seed de dados demo ────────────────────────────────────────────────────────

EMENDAS_DEMO = [
    {
        "municipio_id": 1, "numero_emenda": "202400112345", "ano": 2024,
        "parlamentar": "Dep. Átila Lins", "partido": "PSD", "uf_parlamentar": "AM",
        "tipo": "individual", "objeto": "Construção de UBS na Zona Rural de Apuí",
        "programa": "APS", "vinculo": "obra",
        "valor_indicado": 1200000.0, "valor_empenhado": 1200000.0,
        "valor_liquidado": 780000.0, "valor_pago": 650000.0,
        "fase": "em_execucao", "quadrimestre": "2Q",
        "data_indicacao": date(2024, 2, 15), "data_empenho": date(2024, 5, 10),
        "nota_empenho": "NE2024/000521",
    },
    {
        "municipio_id": 1, "numero_emenda": "202400223456", "ano": 2024,
        "parlamentar": "Sen. Omar Aziz", "partido": "PSD", "uf_parlamentar": "AM",
        "tipo": "individual", "objeto": "Aquisição de equipamentos médicos hospitalares",
        "programa": "MAC", "vinculo": "equipamento",
        "valor_indicado": 850000.0, "valor_empenhado": 850000.0,
        "valor_liquidado": 850000.0, "valor_pago": 850000.0,
        "fase": "paga", "quadrimestre": "1Q",
        "data_indicacao": date(2024, 1, 20), "data_empenho": date(2024, 3, 5),
        "nota_empenho": "NE2024/000298",
    },
    {
        "municipio_id": 1, "numero_emenda": "202500334567", "ano": 2025,
        "parlamentar": "Dep. Sidney Leite", "partido": "PSD", "uf_parlamentar": "AM",
        "tipo": "individual", "objeto": "Reforma e ampliação da UBS Central de Apuí",
        "programa": "APS", "vinculo": "obra",
        "valor_indicado": 600000.0, "valor_empenhado": 600000.0,
        "valor_liquidado": 210000.0, "valor_pago": 180000.0,
        "fase": "em_execucao", "quadrimestre": "2Q",
        "data_indicacao": date(2025, 3, 10), "data_empenho": date(2025, 6, 1),
        "nota_empenho": "NE2025/000412",
    },
    {
        "municipio_id": 1, "numero_emenda": "202500445678", "ano": 2025,
        "parlamentar": "Dep. Bosco Saraiva", "partido": "Solidariedade", "uf_parlamentar": "AM",
        "tipo": "individual", "objeto": "Custeio de ações de Vigilância em Saúde",
        "programa": "Vigilância", "vinculo": "custeio",
        "valor_indicado": 400000.0, "valor_empenhado": 400000.0,
        "valor_liquidado": 0.0, "valor_pago": 0.0,
        "fase": "empenhada", "quadrimestre": "3Q",
        "data_indicacao": date(2025, 4, 1), "data_empenho": date(2025, 7, 15),
        "nota_empenho": "NE2025/000687",
    },
    {
        "municipio_id": 1, "numero_emenda": "202600556789", "ano": 2026,
        "parlamentar": "Dep. Átila Lins", "partido": "PSD", "uf_parlamentar": "AM",
        "tipo": "individual", "objeto": "Aquisição de veículo de saúde (ambulância)",
        "programa": "APS", "vinculo": "equipamento",
        "valor_indicado": 320000.0, "valor_empenhado": 0.0,
        "valor_liquidado": 0.0, "valor_pago": 0.0,
        "fase": "indicada", "quadrimestre": "1Q",
        "data_indicacao": date(2026, 2, 10),
    },
    {
        "municipio_id": 1, "numero_emenda": "202600667890", "ano": 2026,
        "parlamentar": "Sen. Eduardo Braga", "partido": "MDB", "uf_parlamentar": "AM",
        "tipo": "individual", "objeto": "Implantação de Academia da Saúde",
        "programa": "APS", "vinculo": "obra",
        "valor_indicado": 280000.0, "valor_empenhado": 280000.0,
        "valor_liquidado": 0.0, "valor_pago": 0.0,
        "fase": "empenhada", "quadrimestre": "1Q",
        "data_indicacao": date(2026, 1, 15), "data_empenho": date(2026, 4, 20),
        "nota_empenho": "NE2026/000145",
    },
]


async def _seed_emendas(db: AsyncSession):
    count = await db.execute(select(func.count()).select_from(Emenda))
    if (count.scalar() or 0) > 0:
        return
    for d in EMENDAS_DEMO:
        db.add(Emenda(**d))
    await db.commit()


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[EmendaOut])
async def listar_emendas(
    db: DbDep,
    municipio_id: int = Query(1),
    parlamentar: str | None = Query(None),
    programa: str | None = Query(None),
    fase: str | None = Query(None),
    ano: int | None = Query(None),
):
    await _seed_emendas(db)
    stmt = select(Emenda).where(Emenda.municipio_id == municipio_id).order_by(Emenda.ano.desc(), Emenda.parlamentar)
    if parlamentar:
        stmt = stmt.where(Emenda.parlamentar.ilike(f"%{parlamentar}%"))
    if programa:
        stmt = stmt.where(Emenda.programa == programa)
    if fase:
        stmt = stmt.where(Emenda.fase == fase)
    if ano:
        stmt = stmt.where(Emenda.ano == ano)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/dashboard")
async def dashboard_emendas(db: DbDep, municipio_id: int = Query(1)):
    await _seed_emendas(db)
    result = await db.execute(select(Emenda).where(Emenda.municipio_id == municipio_id))
    emendas = result.scalars().all()

    total_indicado  = sum(float(e.valor_indicado or 0)  for e in emendas)
    total_empenhado = sum(float(e.valor_empenhado or 0) for e in emendas)
    total_pago      = sum(float(e.valor_pago or 0)      for e in emendas)

    por_parlamentar: dict[str, dict] = {}
    for e in emendas:
        p = e.parlamentar
        if p not in por_parlamentar:
            por_parlamentar[p] = {"parlamentar": p, "partido": e.partido, "total": 0, "pago": 0, "qtd": 0}
        por_parlamentar[p]["total"] += float(e.valor_indicado or 0)
        por_parlamentar[p]["pago"]  += float(e.valor_pago or 0)
        por_parlamentar[p]["qtd"]   += 1

    por_programa: dict[str, float] = {}
    for e in emendas:
        prog = e.programa or "Outros"
        por_programa[prog] = por_programa.get(prog, 0) + float(e.valor_indicado or 0)

    por_fase = {}
    for e in emendas:
        por_fase[e.fase] = por_fase.get(e.fase, 0) + 1

    por_quadrimestre: dict[str, dict] = {}
    for e in emendas:
        q = e.quadrimestre or "—"
        if q not in por_quadrimestre:
            por_quadrimestre[q] = {"quadrimestre": q, "indicado": 0, "pago": 0}
        por_quadrimestre[q]["indicado"] += float(e.valor_indicado or 0)
        por_quadrimestre[q]["pago"]     += float(e.valor_pago or 0)

    return {
        "total_emendas":     len(emendas),
        "total_indicado":    round(total_indicado, 2),
        "total_empenhado":   round(total_empenhado, 2),
        "total_pago":        round(total_pago, 2),
        "perc_empenhado":    round(total_empenhado / total_indicado * 100, 1) if total_indicado else 0,
        "perc_executado":    round(total_pago / total_indicado * 100, 1) if total_indicado else 0,
        "saldo_a_pagar":     round(total_indicado - total_pago, 2),
        "por_parlamentar":   sorted(por_parlamentar.values(), key=lambda x: x["total"], reverse=True),
        "por_programa":      [{"programa": k, "valor": round(v, 2)} for k, v in sorted(por_programa.items(), key=lambda x: x[1], reverse=True)],
        "por_fase":          [{"fase": k, "qtd": v} for k, v in por_fase.items()],
        "por_quadrimestre":  sorted(por_quadrimestre.values(), key=lambda x: x["quadrimestre"]),
    }


@router.get("/{id}", response_model=EmendaOut)
async def obter_emenda(id: int, db: DbDep):
    result = await db.execute(select(Emenda).where(Emenda.id == id))
    emenda = result.scalar_one_or_none()
    if not emenda:
        raise HTTPException(404, "Emenda não encontrada")
    return emenda


@router.post("", response_model=EmendaOut, status_code=201)
async def criar_emenda(body: EmendaCreate, db: DbDep):
    emenda = Emenda(**body.model_dump())
    db.add(emenda)
    await db.commit()
    await db.refresh(emenda)
    return emenda


@router.put("/{id}", response_model=EmendaOut)
async def atualizar_emenda(id: int, body: EmendaUpdate, db: DbDep):
    result = await db.execute(select(Emenda).where(Emenda.id == id))
    emenda = result.scalar_one_or_none()
    if not emenda:
        raise HTTPException(404, "Emenda não encontrada")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(emenda, k, v)
    await db.commit()
    await db.refresh(emenda)
    return emenda


@router.delete("/{id}", status_code=204)
async def deletar_emenda(id: int, db: DbDep):
    result = await db.execute(select(Emenda).where(Emenda.id == id))
    emenda = result.scalar_one_or_none()
    if not emenda:
        raise HTTPException(404)
    await db.delete(emenda)
    await db.commit()
