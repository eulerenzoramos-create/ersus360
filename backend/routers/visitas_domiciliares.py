"""
Router: /api/visitas-domiciliares — registro de visita domiciliar pelo ACS.

Esta é a primeira etapa real do fluxo "ACS registra a visita no aplicativo
integrado" descrito em docs/ERSUS-DOC-PEC-INTEGRACAO.md. A visita é gravada como
dado OPERACIONAL do ERSUS 360 (origem_dado=ERSUS_OPERACIONAL) — só passa a ser
considerada oficial depois de aceita pelo PEC (ver services/pec/transmissao.py,
ainda não acionado automaticamente aqui).

Limitação conhecida: o sistema de login atual (routers/auth.py) não vincula um
usuário autenticado a um ProfissionalSaude específico — por isso o formulário
pede a seleção manual do ACS responsável. Isso deve ser corrigido quando contas
individuais de ACS existirem.
"""
from __future__ import annotations
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models import Municipio
from models.pec_cadastro import ProfissionalSaude, Domicilio, Cidadao
from models.visita_domiciliar import VisitaDomiciliar, StatusLocalizacao, OrigemDado
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/visitas-domiciliares", tags=["Visitas Domiciliares"])

_PODE_REGISTRAR = {"acs", "enfermeiro", "coordenador", "gestor", "admin", "superadmin"}


async def _municipio_atual(db: AsyncSession) -> Municipio:
    mun = (await db.execute(
        select(Municipio).where(Municipio.codigo_ibge == settings.FNS_MUNICIPIO_IBGE)
    )).scalar_one_or_none()
    if not mun:
        raise HTTPException(status_code=404, detail="Município não cadastrado")
    return mun


class VisitaCreateIn(BaseModel):
    profissional_id: int
    domicilio_id: int
    cidadao_id: int | None = None
    motivo_visita: str
    tipo_visita: str
    acompanhamento_realizado: str | None = None
    desfecho: str | None = None
    duracao_segundos: int | None = None
    latitude_visita: float | None = None
    longitude_visita: float | None = None
    precisao_gps_metros: float | None = None


@router.get("/opcoes")
async def opcoes_formulario(
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    """Lista de ACS e domicílios disponíveis para preencher o formulário de registro."""
    mun = await _municipio_atual(db)

    profissionais = (await db.execute(
        select(ProfissionalSaude).where(
            ProfissionalSaude.municipio_id == mun.id, ProfissionalSaude.ativo == True,  # noqa: E712
        )
    )).scalars().all()
    domicilios = (await db.execute(
        select(Domicilio).where(Domicilio.municipio_id == mun.id)
    )).scalars().all()
    cidadaos = (await db.execute(
        select(Cidadao).where(Cidadao.municipio_id == mun.id)
    )).scalars().all()

    return {
        "profissionais": [{"id": p.id, "nome": p.nome, "cargo": p.cargo} for p in profissionais],
        "domicilios": [{"id": d.id, "uuid_ficha": d.uuid_ficha, "microarea_id": d.microarea_id} for d in domicilios],
        "cidadaos": [
            {"id": c.id, "nome": c.nome, "cns_mascarado": c.cns_mascarado, "domicilio_id": c.domicilio_id}
            for c in cidadaos
        ],
    }


@router.post("")
async def registrar_visita(
    body: VisitaCreateIn,
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    if current_user.role not in _PODE_REGISTRAR:
        raise HTTPException(status_code=403, detail="Perfil não autorizado a registrar visitas domiciliares")

    mun = await _municipio_atual(db)

    profissional = await db.get(ProfissionalSaude, body.profissional_id)
    if not profissional or profissional.municipio_id != mun.id:
        raise HTTPException(status_code=404, detail="Profissional (ACS) não encontrado")

    domicilio = await db.get(Domicilio, body.domicilio_id)
    if not domicilio or domicilio.municipio_id != mun.id:
        raise HTTPException(status_code=404, detail="Domicílio não encontrado")

    cidadao_id = None
    if body.cidadao_id is not None:
        cidadao = await db.get(Cidadao, body.cidadao_id)
        if not cidadao or cidadao.municipio_id != mun.id:
            raise HTTPException(status_code=404, detail="Cidadão não encontrado")
        cidadao_id = cidadao.id

    agora = datetime.utcnow()
    status_localizacao = (
        StatusLocalizacao.CAPTURADA if body.latitude_visita is not None and body.longitude_visita is not None
        else StatusLocalizacao.INDISPONIVEL
    )

    visita = VisitaDomiciliar(
        uuid_local=str(uuid.uuid4()),
        municipio_id=mun.id,
        profissional_id=profissional.id,
        equipe_id=profissional.equipe_id,
        microarea_id=domicilio.microarea_id,
        domicilio_id=domicilio.id,
        cidadao_id=cidadao_id,
        motivo_visita=body.motivo_visita,
        tipo_visita=body.tipo_visita,
        acompanhamento_realizado=body.acompanhamento_realizado,
        desfecho=body.desfecho,
        data_hora_dispositivo=agora,
        data_hora_servidor=agora,
        duracao_segundos=body.duracao_segundos,
        latitude_visita=body.latitude_visita,
        longitude_visita=body.longitude_visita,
        precisao_gps_metros=body.precisao_gps_metros,
        status_localizacao=status_localizacao,
        data_recebimento_ersus=agora,
        origem_dado=OrigemDado.ERSUS_OPERACIONAL,
    )
    db.add(visita)
    await db.commit()
    await db.refresh(visita)

    return {
        "id": visita.id,
        "uuid_local": visita.uuid_local,
        "status_fila": visita.status_fila.value,
        "mensagem": "Visita registrada no ERSUS 360. Ainda não foi enviada ao PEC "
                    "(ESUS_INTEGRATION_ENABLED=false ou pendente de transmissão).",
    }
