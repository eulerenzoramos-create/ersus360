"""
Router: /api/municipios
Gerencia a carteira de municípios atendidos pela assessoria.

Regras de acesso:
  - Listar: qualquer usuário autenticado (vê apenas o próprio município se municipal)
  - Criar/editar: somente superadmin/admin da assessoria
  - Dados do município: inclui link para status das fontes de dados

Isolamento: usuário municipal só visualiza o próprio município.
"""
from __future__ import annotations
from datetime import datetime
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.auth import CurrentUser, require_municipio_access

router = APIRouter(prefix="/api/municipios", tags=["Municípios"])


class MunicipioIn(BaseModel):
    nome: str
    uf: str
    codigo_ibge: str
    cnpj_fundo: str | None = None
    secretario: str | None = None
    prefeito: str | None = None
    telefone: str | None = None
    email: str | None = None


class MunicipioOut(BaseModel):
    id: int
    nome: str
    uf: str
    codigo_ibge: str
    cnpj_fundo: str | None
    secretario: str | None
    prefeito: str | None
    telefone: str | None
    email: str | None
    populacao: int | None
    criado_em: str


async def _populacao_ibge(ibge: str) -> int | None:
    """Consulta população oficial via API IBGE."""
    url = (
        f"https://servicodados.ibge.gov.br/api/v3/agregados/4714"
        f"/periodos/2022/variaveis/93?localidades=N6[{ibge}]"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as c:
            r = await c.get(url)
            if r.status_code == 200:
                data = r.json()
                for ag in data or []:
                    for res in ag.get("resultados", []):
                        for s in res.get("series", []):
                            if s.get("localidade", {}).get("id") == ibge:
                                val = s.get("serie", {}).get("2022")
                                if val:
                                    return int(val)
    except Exception:
        pass
    return None


@router.get("")
async def listar_municipios(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Lista municípios. Municipal: vê apenas o seu. Assessoria: vê todos."""
    from models.municipio import Municipio

    stmt = select(Municipio).order_by(Municipio.uf, Municipio.nome)

    # Isolamento: usuário municipal vê só o próprio
    if not current_user.perfis_assessoria and current_user.municipio_ibge:
        stmt = stmt.where(Municipio.codigo_ibge == current_user.municipio_ibge)

    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "id": m.id,
            "nome": m.nome,
            "uf": m.uf,
            "codigo_ibge": m.codigo_ibge,
            "populacao": m.populacao,
        }
        for m in rows
    ]


@router.get("/{ibge}")
async def detalhe_municipio(
    ibge: str = Path(..., regex=r"^\d{7}$"),
    current_user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    require_municipio_access(ibge, current_user)

    from models.municipio import Municipio
    stmt = select(Municipio).where(Municipio.codigo_ibge == ibge)
    m = (await db.execute(stmt)).scalar_one_or_none()
    if not m:
        raise HTTPException(404, detail=f"Município IBGE {ibge} não cadastrado")

    return {
        "id": m.id,
        "nome": m.nome,
        "uf": m.uf,
        "codigo_ibge": m.codigo_ibge,
        "cnpj_fundo": m.cnpj_fundo,
        "secretario": m.secretario,
        "prefeito": m.prefeito,
        "telefone": m.telefone,
        "email": m.email,
        "populacao": m.populacao,
        "criado_em": m.criado_em.isoformat(),
        "links": {
            "cvat": f"/api/cvat/{ibge}/vinculo",
            "auditoria_fontes": f"/api/auditoria-dados/fontes?ibge={ibge}",
            "integracao_status": f"/api/integracao/status?ibge={ibge}",
            "status_fontes": f"/api/cvat/{ibge}/status-fontes",
        },
    }


@router.post("")
async def criar_municipio(
    body: MunicipioIn,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
):
    """Cadastra novo município na carteira da assessoria."""
    if current_user.role not in ("superadmin", "admin"):
        raise HTTPException(403, detail="Somente administradores podem cadastrar municípios")

    from models.municipio import Municipio

    # Verifica duplicidade
    stmt = select(Municipio).where(Municipio.codigo_ibge == body.codigo_ibge)
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(409, detail=f"Município IBGE {body.codigo_ibge} já cadastrado")

    # Busca população oficial
    pop = await _populacao_ibge(body.codigo_ibge)

    novo = Municipio(
        nome=body.nome.upper(),
        uf=body.uf.upper(),
        codigo_ibge=body.codigo_ibge,
        cnpj_fundo=body.cnpj_fundo,
        secretario=body.secretario,
        prefeito=body.prefeito,
        telefone=body.telefone,
        email=body.email,
        populacao=pop,
    )
    db.add(novo)
    await db.commit()
    await db.refresh(novo)

    return {
        "id": novo.id,
        "nome": novo.nome,
        "uf": novo.uf,
        "codigo_ibge": novo.codigo_ibge,
        "populacao": novo.populacao,
        "populacao_fonte": "IBGE Censo 2022" if pop else "Não obtida — verificar manualmente",
        "mensagem": "Município cadastrado. Configure as credenciais das fontes de dados no Railway.",
        "proximos_passos": [
            f"Configure SIAPS_CPF_{body.codigo_ibge} e SIAPS_SENHA_{body.codigo_ibge} no Railway",
            f"Configure EGESTOR_TOKEN_{body.codigo_ibge} no Railway",
            f"Acesse GET /api/auditoria-dados/fontes?ibge={body.codigo_ibge} para verificar fontes disponíveis",
        ],
    }


@router.patch("/{ibge}")
async def atualizar_municipio(
    ibge: str = Path(..., regex=r"^\d{7}$"),
    body: dict = ...,
    current_user: CurrentUser = Depends(),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role not in ("superadmin", "admin"):
        raise HTTPException(403, detail="Somente administradores podem editar municípios")

    from models.municipio import Municipio
    stmt = select(Municipio).where(Municipio.codigo_ibge == ibge)
    m = (await db.execute(stmt)).scalar_one_or_none()
    if not m:
        raise HTTPException(404, detail="Município não encontrado")

    campos_editaveis = {"secretario", "prefeito", "telefone", "email", "cnpj_fundo"}
    for campo, valor in body.items():
        if campo in campos_editaveis:
            setattr(m, campo, valor)

    # Atualiza população se solicitado
    if body.get("atualizar_populacao"):
        pop = await _populacao_ibge(ibge)
        if pop:
            m.populacao = pop

    await db.commit()
    return {"mensagem": "Município atualizado", "codigo_ibge": ibge}
