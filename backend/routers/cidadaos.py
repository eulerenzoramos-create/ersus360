"""
Router: /api/cidadaos — cache local de cidadãos (cadastro individual do PEC).

Somente leitura — o PEC continua sendo a fonte oficial (ver docs/ERSUS-DOC-PEC-INTEGRACAO.md).
CNS/CPF nunca são retornados em texto puro, apenas a versão mascarada já armazenada
no cadastro (ver services/pec/pseudonimizacao.py).

Fallback demo: quando o banco está vazio (antes da integração PEC), retorna cidadãos
e visitas fictícios de Apuí/AM para que a interface seja navegável.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import settings
from database import get_db
from models import Municipio
from models.pec_cadastro import Cidadao, Domicilio
from models.visita_domiciliar import VisitaDomiciliar
from routers.auth import get_current_user, UserOut
from functools import lru_cache

router = APIRouter(prefix="/api/cidadaos", tags=["Cidadãos"])

# ---------------------------------------------------------------------------
# Dados demo — usados somente quando o banco está vazio (pré-integração PEC)
# ---------------------------------------------------------------------------
@lru_cache(maxsize=1)
def _DEMO_CIDADAOS():
    return [
        {"id": -1,  "nome": "Ana Clara Ferreira dos Santos",    "cns_mascarado": "***.***.***-01", "microarea": "MA-01", "origem_dado": "demo"},
        {"id": -2,  "nome": "Benedito Souza Lima",              "cns_mascarado": "***.***.***-02", "microarea": "MA-01", "origem_dado": "demo"},
        {"id": -3,  "nome": "Claudete Rodrigues da Silva",      "cns_mascarado": "***.***.***-03", "microarea": "MA-02", "origem_dado": "demo"},
        {"id": -4,  "nome": "Davi Mendonça Barbosa",            "cns_mascarado": "***.***.***-04", "microarea": "MA-02", "origem_dado": "demo"},
        {"id": -5,  "nome": "Edilene Alves Costa",              "cns_mascarado": "***.***.***-05", "microarea": "MA-03", "origem_dado": "demo"},
        {"id": -6,  "nome": "Francisco Pereira Neto",           "cns_mascarado": "***.***.***-06", "microarea": "MA-03", "origem_dado": "demo"},
        {"id": -7,  "nome": "Geralda Teixeira Moraes",          "cns_mascarado": "***.***.***-07", "microarea": "MA-04", "origem_dado": "demo"},
        {"id": -8,  "nome": "Hélio Costa Monteiro",             "cns_mascarado": "***.***.***-08", "microarea": "MA-04", "origem_dado": "demo"},
        {"id": -9,  "nome": "Ivanilsa Ramos Carvalho",          "cns_mascarado": "***.***.***-09", "microarea": "MA-RIO", "origem_dado": "demo"},
        {"id": -10, "nome": "José Ribeiro Pantoja",             "cns_mascarado": "***.***.***-10", "microarea": "MA-RIO", "origem_dado": "demo"},
        {"id": -11, "nome": "Katiane Figueiredo Nascimento",    "cns_mascarado": "***.***.***-11", "microarea": "MA-05", "origem_dado": "demo"},
        {"id": -12, "nome": "Luiz Augusto Pinheiro",            "cns_mascarado": "***.***.***-12", "microarea": "MA-05", "origem_dado": "demo"},
    ]


_DEMO_VISITAS: dict[int, list[dict]] = {
    -1: [
        {"id": 101, "numero_controle": "DEMO-001-A", "data": "2026-06-10T09:15:00",
         "acs": "ACS Rosangela Lima", "equipe": "ESF I — Centro", "microarea": "MA-01",
         "motivo_visita": "Acompanhamento de gestante", "tipo_visita": "Visita domiciliar",
         "desfecho": "Encaminhada ao pré-natal", "duracao_segundos": 1200, "status_fila": "aceito_pec"},
        {"id": 102, "numero_controle": "DEMO-001-B", "data": "2026-05-12T10:00:00",
         "acs": "ACS Rosangela Lima", "equipe": "ESF I — Centro", "microarea": "MA-01",
         "motivo_visita": "Cadastro domiciliar", "tipo_visita": "Visita domiciliar",
         "desfecho": "Cadastro realizado", "duracao_segundos": 900, "status_fila": "aceito_pec"},
    ],
    -2: [
        {"id": 201, "numero_controle": "DEMO-002-A", "data": "2026-06-15T14:30:00",
         "acs": "ACS Marcos Oliveira", "equipe": "ESF I — Centro", "microarea": "MA-01",
         "motivo_visita": "Controle de HAS", "tipo_visita": "Visita domiciliar",
         "desfecho": "PA aferida: 145/90 — agendada consulta médica", "duracao_segundos": 800, "status_fila": "aceito_pec"},
    ],
    -3: [
        {"id": 301, "numero_controle": "DEMO-003-A", "data": "2026-06-20T08:45:00",
         "acs": "ACS Valdirene Cruz", "equipe": "ESF II — Bairro Novo", "microarea": "MA-02",
         "motivo_visita": "Acompanhamento de DM", "tipo_visita": "Visita domiciliar",
         "desfecho": "Medicação em uso — solicitar HbA1c", "duracao_segundos": 1500, "status_fila": "aceito_pec"},
        {"id": 302, "numero_controle": "DEMO-003-B", "data": "2026-04-05T09:00:00",
         "acs": "ACS Valdirene Cruz", "equipe": "ESF II — Bairro Novo", "microarea": "MA-02",
         "motivo_visita": "Busca ativa faltoso", "tipo_visita": "Visita domiciliar",
         "desfecho": "Paciente localizado — retornou à UBS", "duracao_segundos": 600, "status_fila": "aceito_pec"},
    ],
    -5: [
        {"id": 501, "numero_controle": "DEMO-005-A", "data": "2026-07-01T10:20:00",
         "acs": "ACS Celso Menezes", "equipe": "ESF III — Ribeirinha", "microarea": "MA-03",
         "motivo_visita": "Criança com diarreia", "tipo_visita": "Visita domiciliar",
         "desfecho": "Orientações de hidratação — mãe instruída", "duracao_segundos": 720, "status_fila": "aceito_pec"},
    ],
    -9: [
        {"id": 901, "numero_controle": "DEMO-009-A", "data": "2026-06-28T07:30:00",
         "acs": "ACS Lúcio Pantoja", "equipe": "ESF Ribeirinha — Rio Negro", "microarea": "MA-RIO",
         "motivo_visita": "Visita puerpério", "tipo_visita": "Visita domiciliar",
         "desfecho": "Bebê com desenvolvimento normal", "duracao_segundos": 1800, "status_fila": "aceito_pec"},
        {"id": 902, "numero_controle": "DEMO-009-B", "data": "2026-05-30T08:00:00",
         "acs": "ACS Lúcio Pantoja", "equipe": "ESF Ribeirinha — Rio Negro", "microarea": "MA-RIO",
         "motivo_visita": "Controle pré-natal", "tipo_visita": "Visita domiciliar",
         "desfecho": "28ª semana — encaminhada para exame", "duracao_segundos": 1200, "status_fila": "aceito_pec"},
    ],
}


async def _municipio_atual(db: AsyncSession) -> Municipio:
    mun = (await db.execute(
        select(Municipio).where(Municipio.codigo_ibge == settings.FNS_MUNICIPIO_IBGE)
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

    if not rows:
        return _DEMO_CIDADAOS()

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
    # Fallback demo: IDs negativos são cidadãos demo
    if cidadao_id < 0:
        demo = next((c for c in _DEMO_CIDADAOS() if c["id"] == cidadao_id), None)
        if not demo:
            raise HTTPException(status_code=404, detail="Cidadão demo não encontrado")
        return {
            "cidadao": {"id": demo["id"], "nome": demo["nome"], "cns_mascarado": demo["cns_mascarado"]},
            "visitas": _DEMO_VISITAS.get(cidadao_id, []),
        }

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