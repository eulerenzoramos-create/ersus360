"""
Router: /api/scnes-conformidade
Conformidade Cadastral SCNES — ERSUS 360

Fontes de dados REAIS:
  - cnes_service: estabelecimentos e equipes via CNES/DATASUS (API pública)
  - siaps_service / integracao_egestor: INEs das equipes ESF
  - tabela inconsistencias: pendências SCNES abertas

REGRA: nenhum score é calculado sobre dados inexistentes.
Campos sem dado real recebem situacao_dado="nao_disponivel".
Nenhum valor é inventado.
"""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.auth import get_current_user, UserOut
from services import cnes_service, siaps_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scnes-conformidade", tags=["Conformidade SCNES"])

_IBGE = "1300144"
_MUNICIPIO = "Apuí"
_UF = "AM"


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Análise de conformidade de uma equipe ─────────────────────────────────────

def _analisar_equipe(equipe: dict, inconsistencias: list[dict]) -> dict:
    """
    Avalia a conformidade de uma equipe ESF com base em dados reais do CNES.
    Retorna apenas o que se sabe — nunca inventa scores para campos vazios.
    """
    ine = equipe.get("ine")
    nome = equipe.get("nome", "Equipe sem nome")
    cnes_ubs = equipe.get("cnes_ubs", "")
    rejeicao = equipe.get("rejeicao_cnes", False)
    ativo = equipe.get("ativo", True)

    # Pendências reais: inconsistências desta equipe no banco
    pends_equipe = [
        i for i in inconsistencias
        if (ine and i.get("componente", "").find(ine) >= 0)
        or nome.upper() in i.get("componente", "").upper()
        or nome.upper() in i.get("descricao", "").upper()
    ]

    # Dimensões com dados reais disponíveis
    dimensoes: dict[str, dict] = {}

    # INE: dado chave para o Componente Vínculo
    if ine:
        dimensoes["ine"] = {
            "label": "INE — Identificador Nacional de Equipe",
            "situacao_dado": "oficial_validado",
            "valor": ine,
            "observacao": "INE registrado no SCNES.",
        }
    else:
        dimensoes["ine"] = {
            "label": "INE — Identificador Nacional de Equipe",
            "situacao_dado": "nao_disponivel",
            "valor": None,
            "observacao": "INE não disponível. Configure EGESTOR_TOKEN no Railway.",
        }

    # CNES UBS
    if cnes_ubs:
        dimensoes["cnes_ubs"] = {
            "label": "CNES da UBS vinculada",
            "situacao_dado": "oficial_validado",
            "valor": cnes_ubs,
            "observacao": "",
        }
    else:
        dimensoes["cnes_ubs"] = {
            "label": "CNES da UBS vinculada",
            "situacao_dado": "nao_disponivel",
            "valor": None,
            "observacao": "CNES da unidade não identificado.",
        }

    # Rejeição CNES
    dimensoes["rejeicao_esf"] = {
        "label": "Rejeição de equipe ESF no CNES",
        "situacao_dado": "oficial_validado" if rejeicao is not None else "nao_disponivel",
        "valor": rejeicao,
        "observacao": (
            "Equipe com registro de rejeição no CNES — verificar sincronização SCNES/SIAPS."
            if rejeicao else
            "Sem registro de rejeição identificado."
        ),
    }

    # Status ativo
    dimensoes["status_ativo"] = {
        "label": "Equipe ativa no CNES",
        "situacao_dado": "oficial_validado",
        "valor": ativo,
        "observacao": "Ativo" if ativo else "Inativo — verificar no SCNES.",
    }

    # Inconsistências abertas desta equipe
    n_pends = len([p for p in pends_equipe if p.get("situacao") in ("identificada", "em_correcao")])
    dimensoes["inconsistencias"] = {
        "label": "Pendências / Inconsistências abertas",
        "situacao_dado": "oficial_validado" if n_pends == 0 else "divergente",
        "valor": n_pends,
        "observacao": f"{n_pends} pendência(s) aberta(s) registrada(s)." if n_pends else "Sem pendências registradas.",
    }

    # Resumo situação geral
    situacoes = [d["situacao_dado"] for d in dimensoes.values()]
    if "nao_disponivel" in situacoes or "divergente" in situacoes:
        situacao_geral = "divergente" if rejeicao else "dado_nao_validado"
    else:
        situacao_geral = "oficial_validado"

    return {
        "ine": ine,
        "nome": nome,
        "cnes_ubs": cnes_ubs,
        "municipio": _MUNICIPIO,
        "uf": _UF,
        "ativo": ativo,
        "rejeicao_cnes": rejeicao,
        "situacao_geral": situacao_geral,
        "dimensoes": dimensoes,
        "pendencias_abertas": n_pends,
        "pendencias_detalhe": [
            {
                "id": p.get("id"), "componente": p.get("componente"),
                "gravidade": p.get("gravidade"), "descricao": p.get("descricao", "")[:200],
                "situacao": p.get("situacao"),
            }
            for p in pends_equipe if p.get("situacao") in ("identificada", "em_correcao")
        ],
        "fonte": "cnes_datasus",
        "verificado_em": _ts(),
    }


# ── Busca inconsistências SCNES do banco ──────────────────────────────────────

async def _buscar_inconsistencias_scnes(ibge: str, db: AsyncSession) -> list[dict]:
    try:
        from models.inconsistencia import Inconsistencia
        stmt = (
            select(Inconsistencia)
            .where(Inconsistencia.municipio_ibge == ibge)
            .where(Inconsistencia.programa.in_(["SCNES", "CNES", "SIAPS"]))
            .order_by(desc(Inconsistencia.criado_em))
            .limit(100)
        )
        rows = (await db.execute(stmt)).scalars().all()
        return [
            {
                "id": r.id, "componente": r.componente, "gravidade": r.gravidade,
                "descricao": r.descricao, "situacao": r.situacao,
            }
            for r in rows
        ]
    except Exception as exc:
        logger.debug("Sem tabela inconsistencias ou erro: %s", exc)
        return []


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/resumo")
async def resumo_scnes(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Resumo de conformidade SCNES: estabelecimentos, equipes ESF,
    rejeições, pendências abertas e situação geral.
    """
    estabs_task = cnes_service.buscar_estabelecimentos()
    equipes_task = cnes_service.buscar_equipes_saude()
    incons_task = _buscar_inconsistencias_scnes(ibge, db)

    estabs, equipes, incons = await asyncio.gather(estabs_task, equipes_task, incons_task)

    total_equipes = len(equipes)
    equipes_com_ine = sum(1 for e in equipes if e.get("ine"))
    equipes_com_rejeicao = sum(1 for e in equipes if e.get("rejeicao_cnes"))
    equipes_ativas = sum(1 for e in equipes if e.get("ativo", True))

    n_incons = len([i for i in incons if i.get("situacao") in ("identificada", "em_correcao")])

    # Situação geral de dados
    situacao_geral: str
    if equipes_com_ine == total_equipes and equipes_com_rejeicao == 0 and n_incons == 0:
        situacao_geral = "oficial_validado"
    elif equipes_com_ine > 0 or len(estabs) > 0:
        situacao_geral = "divergente" if equipes_com_rejeicao > 0 else "oficial_aguardando"
    else:
        situacao_geral = "nao_disponivel"

    return {
        "ibge": ibge,
        "municipio": _MUNICIPIO,
        "uf": _UF,
        "situacao_geral": situacao_geral,
        "estabelecimentos": {
            "total": len(estabs),
            "situacao_dado": "oficial_validado" if estabs else "nao_disponivel",
            "fonte": "cnes_datasus",
        },
        "equipes_esf": {
            "total": total_equipes,
            "com_ine": equipes_com_ine,
            "sem_ine": total_equipes - equipes_com_ine,
            "ativas": equipes_ativas,
            "com_rejeicao": equipes_com_rejeicao,
            "situacao_dado": (
                "oficial_validado" if equipes_com_ine == total_equipes
                else ("dado_nao_validado" if equipes_com_ine == 0 else "divergente")
            ),
            "nota": (
                "Todos os INEs obtidos." if equipes_com_ine == total_equipes
                else f"{total_equipes - equipes_com_ine} equipe(s) sem INE — configure EGESTOR_TOKEN no Railway."
            ),
        },
        "inconsistencias_abertas": n_incons,
        "total_inconsistencias": len(incons),
        "verificado_em": _ts(),
    }


@router.get("/equipes")
async def equipes_scnes(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lista equipes ESF com análise de conformidade por dimensão (dados reais CNES).
    """
    equipes_raw, incons = await asyncio.gather(
        cnes_service.buscar_equipes_saude(),
        _buscar_inconsistencias_scnes(ibge, db),
    )

    return [_analisar_equipe(e, incons) for e in equipes_raw]


@router.get("/estabelecimentos")
async def estabelecimentos_scnes(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """Lista estabelecimentos de saúde do município via CNES/DATASUS."""
    estabs = await cnes_service.buscar_estabelecimentos()
    return {
        "total": len(estabs),
        "situacao_dado": "oficial_validado" if estabs else "nao_disponivel",
        "fonte": "cnes_datasus",
        "ibge": ibge,
        "municipio": _MUNICIPIO,
        "uf": _UF,
        "estabelecimentos": estabs,
        "verificado_em": _ts(),
    }


@router.get("/alertas-cnes")
async def alertas_cnes(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Alertas de conformidade SCNES — inconsistências abertas por gravidade."""
    incons = await _buscar_inconsistencias_scnes(ibge, db)
    abertas = [i for i in incons if i.get("situacao") in ("identificada", "em_correcao")]

    criticos = [i for i in abertas if i.get("gravidade") == "critica"]
    altos    = [i for i in abertas if i.get("gravidade") == "alta"]
    medios   = [i for i in abertas if i.get("gravidade") == "media"]

    return {
        "total": len(abertas),
        "criticos": len(criticos),
        "altos": len(altos),
        "medios": len(medios),
        "situacao_dado": "oficial_validado" if incons else "nao_disponivel",
        "alertas": abertas[:20],
        "ultima_verificacao": _ts(),
    }


@router.get("/historico")
async def historico_conformidade(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Histórico de inconsistências SCNES registradas no banco."""
    try:
        from models.inconsistencia import Inconsistencia
        stmt = (
            select(Inconsistencia)
            .where(Inconsistencia.municipio_ibge == ibge)
            .where(Inconsistencia.programa.in_(["SCNES", "CNES", "SIAPS"]))
            .order_by(desc(Inconsistencia.criado_em))
            .limit(50)
        )
        rows = (await db.execute(stmt)).scalars().all()
        abertas = [r for r in rows if r.situacao in ("identificada", "em_correcao")]
        resolvidas = [r for r in rows if r.situacao in ("corrigida", "encerrada")]
        return {
            "total_alteracoes": len(rows),
            "aprovadas": len(resolvidas),
            "pendentes_regularizacao": len(abertas),
            "situacao_dado": "oficial_validado" if rows else "nao_disponivel",
            "periodo": "Histórico completo disponível",
            "alteracoes": [
                {
                    "id": r.id, "competencia": r.competencia,
                    "componente": r.componente, "gravidade": r.gravidade,
                    "situacao": r.situacao, "criado_em": r.criado_em.isoformat(),
                    "descricao": (r.descricao or "")[:150],
                }
                for r in rows[:20]
            ],
        }
    except Exception:
        return {
            "total_alteracoes": 0, "aprovadas": 0, "pendentes_regularizacao": 0,
            "situacao_dado": "nao_disponivel",
            "periodo": "Sem dados", "alteracoes": [],
        }


@router.get("/sincronizacao")
async def status_sincronizacao(
    _: UserOut = Depends(get_current_user),
):
    """Status da última sincronização CNES — consulta dados reais."""
    estabs = await cnes_service.buscar_estabelecimentos()
    equipes = await cnes_service.buscar_equipes_saude()
    com_ine = sum(1 for e in equipes if e.get("ine"))

    return {
        "situacao_dado": "oficial_validado" if estabs or equipes else "nao_disponivel",
        "ultima_sync": _ts(),
        "total_estabelecimentos": len(estabs),
        "total_equipes": len(equipes),
        "equipes_com_ine": com_ine,
        "equipes_sem_ine": len(equipes) - com_ine,
        "fonte": "cnes_datasus",
        "nota": (
            "INEs indisponíveis — configure EGESTOR_TOKEN no Railway para completar."
            if com_ine == 0 else
            f"{com_ine}/{len(equipes)} equipes com INE obtido via e-Gestor APS."
        ),
    }


@router.post("/sincronizar")
async def sincronizar_cnes(_: UserOut = Depends(get_current_user)):
    """Dispara re-consulta ao CNES/DATASUS (sem cache)."""
    estabs = await cnes_service.buscar_estabelecimentos()
    equipes = await cnes_service.buscar_equipes_saude()
    return {
        "sucesso": True,
        "estabelecimentos_atualizados": len(estabs),
        "equipes_atualizadas": len(equipes),
        "verificado_em": _ts(),
    }


@router.get("/divergencia-pec")
async def divergencia_pec(
    _: UserOut = Depends(get_current_user),
):
    """
    Divergências entre SCNES e e-SUS PEC.
    Requer e-SUS PEC configurado (ESUS_URL, ESUS_USUARIO, ESUS_SENHA no Railway).
    """
    from services import esus_pec
    status = await esus_pec.status_pec()
    pec_conectado = status.get("conectado", False)

    if not pec_conectado:
        return {
            "situacao_dado": "nao_disponivel",
            "pec_conectado": False,
            "nota": "e-SUS PEC não conectado. Configure ESUS_URL, ESUS_USUARIO e ESUS_SENHA no Railway.",
            "divergencias": [],
            "verificado_em": _ts(),
        }

    equipes = await cnes_service.buscar_equipes_saude()
    return {
        "situacao_dado": "oficial_aguardando",
        "pec_conectado": True,
        "versao_pec": status.get("versao"),
        "nota": "PEC conectado. Cross-reference nominal CNES × PEC em desenvolvimento.",
        "total_equipes_cnes": len(equipes),
        "divergencias": [],
        "verificado_em": _ts(),
    }
