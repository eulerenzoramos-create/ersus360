"""
Router: /api/integracao-pec — Configurações → Integrações → PEC e-SUS APS

Expõe a camada services/pec/* para a tela administrativa. Nunca retorna
client_secret, senha ou certificado — apenas o estado (configurado ou não).
Somente perfis administradores podem disparar as ações (RBAC).
"""
from __future__ import annotations
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from database import get_db
from models import Municipio
from models.pec_cadastro import EquipeSaude, ProfissionalSaude, Microarea, Domicilio, Cidadao
from models.visita_domiciliar import VisitaDomiciliar, StatusFilaVisita
from models.usuario import AuditLog
from routers.auth import get_current_user, UserOut
from services.pec.connection import PecConnectionService
from services.pec.cadastros import (
    PecTeamService, PecProfessionalService, PecTerritoryService,
    PecHouseholdService, PecCitizenService,
)
from services.pec.auditoria import PecAuditService
from services.pec.exceptions import PecIntegracaoDesativadaError

router = APIRouter(prefix="/api/integracao-pec", tags=["Integração PEC e-SUS APS"])

_ADMINS_INTEGRACAO = {"superadmin", "admin", "gestor"}


def _exigir_admin_integracao(current_user: UserOut) -> None:
    if current_user.role not in _ADMINS_INTEGRACAO:
        raise HTTPException(status_code=403, detail="Acesso negado — somente administradores da integração")


async def _municipio_atual(db: AsyncSession) -> Municipio:
    mun = (await db.execute(
        select(Municipio).where(Municipio.codigo_ibge == settings.FNS_MUNICIPIO_IBGE)
    )).scalar_one_or_none()
    if not mun:
        raise HTTPException(status_code=404, detail="Município não cadastrado")
    return mun


CADASTRO_SERVICES = [
    ("equipes", PecTeamService()),
    ("profissionais", PecProfessionalService()),
    ("microareas", PecTerritoryService()),
    ("domicilios", PecHouseholdService()),
    ("cidadaos", PecCitizenService()),
]


@router.get("/status")
async def status_integracao(current_user: UserOut = Depends(get_current_user)):
    """Situação da conexão + configuração — nunca expõe segredo algum."""
    conexao = await PecConnectionService().test_connection()
    return {
        "ambiente": conexao.ambiente,
        "base_url": conexao.base_url,
        "https_ativo": conexao.https,
        "credencial_configurada": conexao.configurado,
        "integracao_habilitada": settings.ESUS_INTEGRATION_ENABLED,
        "situacao_conexao": conexao.conectado,   # True | False | None (não testado)
        "mensagem": conexao.mensagem,
        "ledi_version": settings.LEDI_VERSION or None,
        "mivdt_version": settings.MIVDT_VERSION or None,
        "verificado_em": conexao.verificado_em.isoformat(),
    }


@router.post("/testar-conexao")
async def testar_conexao(
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    _exigir_admin_integracao(current_user)
    conexao = await PecConnectionService().test_connection()
    await PecAuditService().registrar(
        db, usuario_id=None, acao="TESTAR_CONEXAO_PEC", tabela="integracao_pec",
        registro_id=None, detalhe=conexao.mensagem,
    )
    await db.commit()
    return conexao.to_dict()


@router.post("/sincronizar-cadastros")
async def sincronizar_cadastros(
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    _exigir_admin_integracao(current_user)
    mun = await _municipio_atual(db)

    resultados: dict = {}
    erros: list[dict] = []
    for nome, servico in CADASTRO_SERVICES:
        try:
            registros = await servico.fetch_from_pec()
            resultados[nome] = await servico.upsert_local(db, mun.id, registros)
        except (PecIntegracaoDesativadaError, NotImplementedError) as exc:
            erros.append({"cadastro": nome, "motivo": str(exc)})

    status_final = "concluido" if not erros else ("parcial" if resultados else "nao_executado")
    await PecAuditService().registrar(
        db, usuario_id=None, acao="SINCRONIZAR_CADASTROS_PEC", tabela="integracao_pec",
        registro_id=None, detalhe=f"status={status_final} erros={len(erros)}",
    )
    await db.commit()
    return {"status": status_final, "resultados": resultados, "erros": erros}


@router.get("/situacao")
async def consultar_situacao(
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    """Estado real dos dados reconciliados localmente — nunca um número fabricado."""
    mun = await _municipio_atual(db)

    async def _contagem_e_ultima_sync(modelo):
        total = (await db.execute(
            select(func.count()).select_from(modelo).where(modelo.municipio_id == mun.id)
        )).scalar_one()
        ultima = (await db.execute(
            select(func.max(modelo.data_ultima_atualizacao_pec)).where(modelo.municipio_id == mun.id)
        )).scalar_one()
        return total, ultima

    eq_total, eq_ultima = await _contagem_e_ultima_sync(EquipeSaude)
    prof_total, prof_ultima = await _contagem_e_ultima_sync(ProfissionalSaude)
    ma_total, ma_ultima = await _contagem_e_ultima_sync(Microarea)
    dom_total, dom_ultima = await _contagem_e_ultima_sync(Domicilio)
    cid_total, cid_ultima = await _contagem_e_ultima_sync(Cidadao)

    ultima_sincronizacao = max(
        (d for d in [eq_ultima, prof_ultima, ma_ultima, dom_ultima, cid_ultima] if d is not None),
        default=None,
    )

    aceitos = (await db.execute(
        select(func.count()).select_from(VisitaDomiciliar).where(
            VisitaDomiciliar.municipio_id == mun.id,
            VisitaDomiciliar.status_fila.in_([StatusFilaVisita.ACEITO_PEC, StatusFilaVisita.PROCESSADO_FLUXO_OFICIAL]),
        )
    )).scalar_one()
    rejeitados = (await db.execute(
        select(func.count()).select_from(VisitaDomiciliar).where(
            VisitaDomiciliar.municipio_id == mun.id,
            VisitaDomiciliar.status_fila == StatusFilaVisita.REJEITADO_PEC,
        )
    )).scalar_one()
    ultimo_envio = (await db.execute(
        select(func.max(VisitaDomiciliar.data_envio_pec)).where(VisitaDomiciliar.municipio_id == mun.id)
    )).scalar_one()

    erros_recentes = (await db.execute(
        select(AuditLog).where(AuditLog.acao.like("%_PEC")).order_by(AuditLog.criado_em.desc()).limit(10)
    )).scalars().all()

    return {
        "cadastros_sincronizados": {
            "equipes": eq_total, "profissionais": prof_total, "microareas": ma_total,
            "domicilios": dom_total, "cidadaos": cid_total,
        },
        "ultima_sincronizacao": ultima_sincronizacao.isoformat() if ultima_sincronizacao else None,
        "ultimo_envio_pec": ultimo_envio.isoformat() if ultimo_envio else None,
        "registros_aceitos": aceitos,
        "registros_rejeitados": rejeitados,
        "erros_recentes": [
            {"acao": e.acao, "detalhe": e.detalhe, "criado_em": e.criado_em.isoformat()}
            for e in erros_recentes
        ],
    }


@router.post("/reprocessar-pendencias")
async def reprocessar_pendencias(
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    _exigir_admin_integracao(current_user)
    mun = await _municipio_atual(db)

    pendentes = (await db.execute(
        select(VisitaDomiciliar).where(
            VisitaDomiciliar.municipio_id == mun.id,
            VisitaDomiciliar.status_fila == StatusFilaVisita.REJEITADO_PEC,
        )
    )).scalars().all()

    if not pendentes:
        return {"status": "sem_pendencias", "total_encontrado": 0, "reprocessados": 0, "erros": []}

    if not settings.ESUS_INTEGRATION_ENABLED:
        motivo = "ESUS_INTEGRATION_ENABLED=false — reprocessamento não pode ser executado."
        await PecAuditService().registrar(
            db, usuario_id=None, acao="REPROCESSAR_PENDENCIAS_PEC", tabela="integracao_pec",
            registro_id=None, detalhe=motivo,
        )
        await db.commit()
        return {"status": "bloqueado", "total_encontrado": len(pendentes), "reprocessados": 0, "erros": [motivo]}

    # Reenvio real seria feito aqui via MivdtBuilderService + LediTransmissionService
    # assim que a integração estiver habilitada e os endpoints LEDI validados.
    return {"status": "nao_implementado", "total_encontrado": len(pendentes), "reprocessados": 0, "erros": []}


@router.post("/sync-esus")
async def sync_esus(
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    """
    Sincroniza equipes, profissionais e cidadãos diretamente do e-SUS PEC
    via GraphQL (ESUS_USUARIO / ESUS_SENHA).

    Não requer ESUS_INTEGRATION_ENABLED=true — usa as credenciais do gestor
    já configuradas no Railway. Idempotente: upsert por pec_reference_id.
    """
    _exigir_admin_integracao(current_user)

    if not (settings.ESUS_USUARIO and settings.ESUS_SENHA):
        raise HTTPException(
            status_code=503,
            detail="ESUS_USUARIO e/ou ESUS_SENHA não configurados. "
                   "Adicione as variáveis de ambiente no Railway.",
        )

    from services.pec.sync_esus import sincronizar_cadastros_pec
    resultado = await sincronizar_cadastros_pec(db)

    await PecAuditService().registrar(
        db, usuario_id=None, acao="SYNC_ESUS_GRAPHQL", tabela="integracao_pec",
        registro_id=None,
        detalhe=(
            f"cidadaos={resultado.cidadaos_criados}+{resultado.cidadaos_atualizados} "
            f"equipes={resultado.equipes_criadas} "
            f"profissionais={resultado.profissionais_criados} "
            f"erros={len(resultado.erros)}"
        ),
    )
    await db.commit()
    return {"status": "concluido", **resultado.to_dict()}
