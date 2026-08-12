"""
Router: /api/fns — Integração FNS / Ministério da Saúde
Endpoints reais usando fns_service + Portal da Transparência.
"""
from __future__ import annotations
import os
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import Convenio, Repasse, Municipio
from schemas.fns import FnsSyncRequest, FnsSyncResult, FnsStatusOut
from services.fns_service import fns_sync, fns_preview
from routers.auth import get_current_user, UserOut
import httpx

router = APIRouter(prefix="/api/fns", tags=["FNS"])

DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[UserOut, Depends(get_current_user)]

TRANSP_KEY  = os.getenv("TRANSPARENCIA_API_KEY", "")
IBGE_APUI   = "1300144"
TRANSP_BASE = "https://api.portaldatransparencia.gov.br/api-de-dados"


@router.get("/status")
async def status_fns(db: DbDep, _: CurrentUser):
    """Retorna contagem real de repasses e convênios no banco."""
    total_rep = await db.execute(select(func.count(Repasse.id)))
    n_rep = total_rep.scalar() or 0

    total_conv = await db.execute(select(func.count(Convenio.id)))
    n_conv = total_conv.scalar() or 0

    # Último repasse inserido
    stmt = select(Repasse).order_by(Repasse.criado_em.desc()).limit(1)
    res = await db.execute(stmt)
    ultimo = res.scalar_one_or_none()

    return {
        "situacao_dado": "oficial_validado",
        "status": "ok" if n_rep > 0 else "sem_dados",
        "total_repasses_db": n_rep,
        "total_convenios_db": n_conv,
        "ultimo_sync": ultimo.criado_em.isoformat() if ultimo else None,
        "competencia": ultimo.competencia if ultimo else None,
        "transparencia_key_ok": bool(TRANSP_KEY),
        "nota": (
            f"{n_rep} repasses e {n_conv} convênios no banco."
            if n_rep > 0
            else "Banco vazio — use 'Sincronizar' para buscar dados do FNS."
        ),
    }


@router.get("/historico")
async def historico(db: DbDep, _: CurrentUser):
    """Lista repasses agrupados por competência."""
    stmt = (
        select(
            Repasse.competencia,
            func.count(Repasse.id).label("total"),
            func.sum(Repasse.valor_realizado).label("valor_total"),
            func.max(Repasse.criado_em).label("ultima_atualizacao"),
        )
        .group_by(Repasse.competencia)
        .order_by(Repasse.competencia.desc())
        .limit(24)
    )
    result = await db.execute(stmt)
    rows = result.all()
    return {
        "situacao_dado": "oficial_validado" if rows else "sem_dados",
        "dados": [
            {
                "competencia": r.competencia,
                "total_repasses": r.total,
                "valor_total": float(r.valor_total or 0),
                "ultima_atualizacao": r.ultima_atualizacao.isoformat() if r.ultima_atualizacao else None,
            }
            for r in rows
        ],
        "nota": None if rows else "Nenhum dado no banco. Execute a sincronização.",
    }


@router.post("/sync")
async def sync_fns(body: FnsSyncRequest, db: DbDep, _: CurrentUser):
    """
    Preview (modo='preview'): busca do FNS sem gravar.
    Sync   (modo='sync'):    busca e grava no banco.
    """
    if body.modo == "preview":
        itens = await fns_preview(body.mes, body.ano)
        return FnsSyncResult(
            status="ok" if itens else "sem_dados",
            municipio_ibge=IBGE_APUI,
            competencia=f"{body.ano}-{body.mes:02d}",
            total_encontrados=len(itens),
            novos_inseridos=0,
            atualizados=0,
            alertas_gerados=0,
            itens=itens,
            mensagem=f"Preview: {len(itens)} repasses encontrados." if itens else "Nenhum dado encontrado no portal FNS.",
            executado_em=datetime.utcnow(),
        )

    # modo sync — precisa do município no banco
    res_mun = await db.execute(select(Municipio).where(Municipio.codigo_ibge == IBGE_APUI))
    mun = res_mun.scalar_one_or_none()
    if not mun:
        raise HTTPException(400, f"Município IBGE {IBGE_APUI} não encontrado no banco.")

    result = await fns_sync(mes=body.mes, ano=body.ano, municipio_id=mun.id, db=db)
    return result


@router.post("/sync-todos")
async def sync_todos(
    db: DbDep,
    _: CurrentUser,
    municipio_id: int = Query(1),
    ultimos_meses: int = Query(3, ge=1, le=12),
):
    """Sincroniza os últimos N meses do FNS."""
    res_mun = await db.execute(select(Municipio).where(Municipio.codigo_ibge == IBGE_APUI))
    mun = res_mun.scalar_one_or_none()
    if not mun:
        raise HTTPException(400, f"Município IBGE {IBGE_APUI} não encontrado no banco.")

    hoje = datetime.utcnow()
    resultados = []
    for i in range(ultimos_meses):
        data = hoje - timedelta(days=30 * i)
        res = await fns_sync(mes=data.month, ano=data.year, municipio_id=mun.id, db=db)
        resultados.append(res)

    return resultados


@router.get("/transferencias-transparencia")
async def transferencias_transparencia(
    ano: int = Query(2025),
    _: CurrentUser = Depends(get_current_user),
):
    """
    Busca transferências diretamente do Portal da Transparência.
    Retorna dados brutos sem gravar no banco.
    """
    if not TRANSP_KEY:
        return {
            "situacao_dado": "nao_disponivel",
            "dados": None,
            "nota": "Configure TRANSPARENCIA_API_KEY no Railway.",
        }

    headers = {"chave-api": TRANSP_KEY, "Accept": "application/json"}
    url = f"{TRANSP_BASE}/transferencias-voluntarias-municipio-estado"
    params = {
        "codigoMunicipio": IBGE_APUI,
        "dataInicio": f"{ano}-01-01",
        "dataFim": f"{ano}-12-31",
        "pagina": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.get(url, headers=headers, params=params)
            r.raise_for_status()
            data = r.json()
            return {
                "situacao_dado": "oficial_validado",
                "fonte": "Portal da Transparência",
                "dados": data,
                "ano": ano,
                "ultima_atualizacao": datetime.now().isoformat(),
            }
    except Exception as e:
        return {
            "situacao_dado": "nao_disponivel",
            "dados": None,
            "erro": str(e),
            "nota": "Portal da Transparência indisponível. Tente novamente.",
        }


@router.get("/dashboard")
async def dashboard(_: CurrentUser):
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Use /api/fns/status para status real e /api/fns/sync para sincronizar.",
    }
