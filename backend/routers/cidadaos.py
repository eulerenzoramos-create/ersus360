"""
Router: /api/cidadaos — cache local de cidadãos (cadastro individual do PEC).

Somente leitura — o PEC continua sendo a fonte oficial (ver docs/ERSUS-DOC-PEC-INTEGRACAO.md).
CNS/CPF nunca são retornados em texto puro, apenas a versão mascarada já armazenada
no cadastro (ver services/pec/pseudonimizacao.py).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Municipio
from models.pec_cadastro import Cidadao, Domicilio
from models.visita_domiciliar import VisitaDomiciliar
from datetime import date, datetime
from services.cnes_service import resumo_estabelecimentos
from services.sia_service import buscar_producao
from routers.auth import get_current_user, UserOut
from tenancy.contexto import municipio_atual

router = APIRouter(prefix="/api/cidadaos", tags=["Cidadãos"])


async def _municipio_atual(db: AsyncSession) -> Municipio:
    # Município da sessão (tenancy.guard); sem sessão, o padrão de Apuí/AM.
    mun = (await db.execute(
        select(Municipio).where(Municipio.codigo_ibge == municipio_atual().ibge)
    )).scalar_one_or_none()
    if not mun:
        raise HTTPException(status_code=404, detail="Município não cadastrado")
    return mun


@router.get("")
async def listar_cidadaos(
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    mun = await _municipio_atual(db)
    rows = (await db.execute(
        select(Cidadao)
        .options(selectinload(Cidadao.domicilio).selectinload(Domicilio.microarea))
        .where(Cidadao.municipio_id == mun.id)
        .order_by(Cidadao.nome)
    )).scalars().all()

    return [
        {
            "id": c.id,
            "nome": c.nome,
            "cns_mascarado": c.cns_mascarado,
            "data_nascimento": c.data_nascimento.date().isoformat() if c.data_nascimento else None,
            "sexo": c.sexo,
            "domicilio_id": c.domicilio_id,
            "microarea": c.domicilio.microarea.codigo if c.domicilio and c.domicilio.microarea else None,
            "origem_dado": c.origem_dado.value,
            "data_ultima_atualizacao_pec": (
                c.data_ultima_atualizacao_pec.isoformat() if c.data_ultima_atualizacao_pec else None
            ),
        }
        for c in rows
    ]


@router.get("/{cidadao_id}/visitas")
async def visitas_do_cidadao(
    cidadao_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    mun = await _municipio_atual(db)
    cidadao = await db.get(Cidadao, cidadao_id)
    if not cidadao or cidadao.municipio_id != mun.id:
        raise HTTPException(status_code=404, detail="Cidadão não encontrado")

    rows = (await db.execute(
        select(VisitaDomiciliar)
        .options(
            selectinload(VisitaDomiciliar.profissional),
            selectinload(VisitaDomiciliar.equipe),
            selectinload(VisitaDomiciliar.microarea),
        )
        .where(VisitaDomiciliar.cidadao_id == cidadao_id)
        .order_by(VisitaDomiciliar.data_hora_dispositivo.desc())
    )).scalars().all()

    return {
        "cidadao": {"id": cidadao.id, "nome": cidadao.nome, "cns_mascarado": cidadao.cns_mascarado},
        "visitas": [
            {
                "id": v.id,
                "numero_controle": v.uuid_local,
                "data": v.data_hora_dispositivo.isoformat(),
                "acs": v.profissional.nome if v.profissional else None,
                "equipe": v.equipe.nome if v.equipe else None,
                "microarea": v.microarea.codigo if v.microarea else None,
                "motivo_visita": v.motivo_visita,
                "tipo_visita": v.tipo_visita,
                "desfecho": v.desfecho,
                "duracao_segundos": v.duracao_segundos,
                "status_fila": v.status_fila.value,
            }
            for v in rows
        ],
    }


# ── Resumo por dados abertos (proxy de cobertura enquanto o PEC não está integrado) ──
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Cadastro individual de cidadãos requer e-SUS PEC/CADSUS (pendente). CNES/SIA como proxy de cobertura."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    cnes = await resumo_estabelecimentos(); sia = await buscar_producao(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [cnes, sia])
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "ano": ano, "estabelecimentos": cnes.get("total"), "producao": sia.get("total_procedimentos"), "nota": _NOTA, "fonte": "CNES + SIA — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
