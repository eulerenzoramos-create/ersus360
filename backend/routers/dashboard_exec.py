"""
Router: /api/dashboard-exec — Dashboard Executivo ERSUS 360

Agrega dados REAIS das APIs públicas disponíveis.
Cada bloco carrega situacao_dado derivado da fonte real.
Valores sem API pública = nao_disponivel (nunca estimados).

Fontes:
  - Previne Brasil: indicadores APS (API gov.br pública)
  - SIOPS: mínimo constitucional (API pública)
  - CNES: equipes ESF (API pública)
  - SIAPS: vínculos CVAT (requer credenciais Railway)
  - Inconsistencias: banco local ERSUS 360
"""
from __future__ import annotations
import asyncio
import logging
from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services import previne_service, siops_service, cnes_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard-exec", tags=["Dashboard Executivo"])

_IBGE = "1300144"


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _bloco(modulo: str, icone: str, situacao_dado: str,
           indicadores: list[dict], nota: str = "") -> dict:
    return {
        "modulo":       modulo,
        "icone":        icone,
        "situacao_dado": situacao_dado,
        "indicadores":  indicadores,
        "nota":         nota,
    }


def _ind(nome: str, valor: Any, status: str, situacao_dado: str,
         tendencia: str | None = None, rota: str = "/") -> dict:
    return {
        "nome":          nome,
        "valor":         str(valor) if valor is not None else "—",
        "status":        status,
        "situacao_dado": situacao_dado,
        "tendencia":     tendencia,
        "rota":          rota,
    }


def _sit(fonte: str | None) -> str:
    """Converte nome de fonte em situacao_dado."""
    if not fonte or fonte in ("referencia", "sem_dado", ""):
        return "nao_disponivel"
    return "oficial_validado"


# ── Blocos de dados ───────────────────────────────────────────────────────────

async def _bloco_aps(ibge: str) -> dict:
    hoje = date.today()
    comp = f"{hoje.year}{hoje.month:02d}"
    previne = await previne_service.buscar_indicadores(comp)
    fonte = previne.get("fonte", "")
    sit = _sit(fonte)

    inds = previne.get("indicadores", [])
    score_previne = None
    if inds:
        pts = [i.get("resultado_pct", 0) for i in inds if i.get("resultado_pct") is not None]
        score_previne = round(sum(pts) / len(pts), 1) if pts else None

    return _bloco(
        "Atenção Primária (APS)", "hospital", sit,
        [
            _ind("Cofinanciamento APS — Score médio",
                 f"{score_previne:.1f}%" if score_previne else None,
                 "ok" if score_previne and score_previne >= 60 else "alerta",
                 sit, None, "/producao-aps"),
            _ind("Indicadores Previne — total",
                 len(inds) if inds else None,
                 "ok", sit, None, "/producao-aps"),
            _ind("Cobertura ESF (%)", None, "alerta",
                 "nao_disponivel", None, "/producao-aps"),
            _ind("Visitas domiciliares / mês", None, "alerta",
                 "nao_disponivel", None, "/producao-aps"),
        ],
        nota=f"Cofinanc. APS competência {comp} — fonte: {fonte or 'indisponível'}",
    )


async def _bloco_financeiro(ibge: str) -> dict:
    hoje = date.today()
    siops = await siops_service.buscar_apuracao(hoje.year)
    fonte = siops.get("fonte", "")
    sit = _sit(fonte)

    proprio = siops.get("minimo_constitucional_pct_aplicado")

    return _bloco(
        "Financeiro / FNS", "dollar", sit,
        [
            _ind("Mínimo constitucional saúde (%)",
                 f"{float(proprio):.1f}%" if proprio else None,
                 "ok" if proprio and float(proprio) >= 15 else "alerta",
                 sit, None, "/cronograma-repasses"),
            _ind("Execução orçamentária FNS (%)", None, "alerta",
                 "nao_disponivel", None, "/cronograma-repasses"),
            _ind("Repasses FNS pendentes", None, "alerta",
                 "nao_disponivel", None, "/cronograma-repasses"),
            _ind("Contratos vencendo (30d)", None, "alerta",
                 "nao_disponivel", None, "/gestao-contratos"),
        ],
        nota=f"SIOPS {hoje.year} — fonte: {fonte or 'indisponível'}",
    )


async def _bloco_cnes(ibge: str) -> dict:
    equipes = await cnes_service.buscar_equipes_saude(ibge)
    fonte = "cnes_datasus" if equipes else ""
    sit = _sit(fonte)

    total = len(equipes)
    ativas = sum(1 for e in equipes if e.get("ativo", False))
    sem_ine = sum(1 for e in equipes if not e.get("ine"))
    rej = sum(1 for e in equipes if e.get("rejeicao_cnes"))

    return _bloco(
        "Equipes ESF / SCNES", "hospital", sit,
        [
            _ind("Equipes cadastradas no CNES",
                 total if total else None,
                 "ok", sit, None, "/conformidade-scnes"),
            _ind("Equipes ativas",
                 ativas if total else None,
                 "ok" if ativas == total else "alerta",
                 sit, None, "/conformidade-scnes"),
            _ind("Sem INE (aguarda EGESTOR_TOKEN)",
                 sem_ine if total else None,
                 "critico" if sem_ine > 0 else "ok",
                 "nao_disponivel" if sem_ine > 0 else sit,
                 None, "/conformidade-scnes"),
            _ind("Equipes com rejeição CNES",
                 rej if total else None,
                 "critico" if rej > 0 else "ok",
                 sit, None, "/conformidade-scnes"),
        ],
        nota="CNES/DATASUS API pública. INEs requerem EGESTOR_TOKEN no Railway.",
    )


async def _bloco_siaps(ibge: str) -> dict:
    try:
        from services import siaps_service as ss
        from config import settings
        tem_creds = bool(
            (getattr(settings, "SIAPS_CPF", None) or "").strip() and
            (getattr(settings, "SIAPS_SENHA", None) or "").strip()
        )
        if not tem_creds:
            sit = "nao_disponivel"
            nota = "Configure SIAPS_CPF_1300144 e SIAPS_SENHA_1300144 no Railway."
            total_v = None
            total_a = None
        else:
            hoje = date.today()
            comp = f"{hoje.year}{hoje.month:02d}"
            dados = await ss.buscar_vinculo(comp)
            if dados:
                sit = dados.get("situacao_dado", "dado_nao_validado")
                total_v = dados.get("metricas", dados).get("total_vinculadas")
                total_a = dados.get("metricas", dados).get("total_acompanhadas")
                nota = f"SIAPS competência {comp}"
            else:
                sit = "nao_disponivel"
                total_v = None
                total_a = None
                nota = "SIAPS não retornou dados para competência atual."
    except Exception as exc:
        logger.debug("Erro bloco SIAPS: %s", exc)
        sit = "nao_disponivel"
        total_v = total_a = None
        nota = "Erro ao consultar SIAPS."

    return _bloco(
        "CVAT / SIAPS", "users", sit,
        [
            _ind("Equipes vinculadas (Campo K)", total_v, "ok", sit, None, "/monitor-siaps"),
            _ind("Equipes acompanhadas (Campo H)", total_a, "alerta",
                 sit if total_a else "nao_disponivel", None, "/monitor-siaps"),
        ],
        nota=nota,
    )


async def _bloco_vigilancia_sem_api() -> dict:
    return _bloco(
        "Vigilância em Saúde", "microscope", "nao_disponivel",
        [
            _ind("Malária — IPA", None, "alerta", "nao_disponivel", None, "/malaria"),
            _ind("Cobertura água tratada (%)", None, "alerta", "nao_disponivel", None, "/mapa-sanitario"),
            _ind("Dengue — casos confirmados", None, "alerta", "nao_disponivel", None, "/dengue-arboviroses"),
            _ind("Notificações SINAN (mês)", None, "alerta", "nao_disponivel", None, "/epidemiologia"),
        ],
        nota=(
            "Dados de vigilância requerem acesso ao SINAN/Tabnet ou e-SUS PEC local. "
            "Sem API pública nacional disponível por município."
        ),
    )


# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.get("/blocos")
async def get_blocos(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """
    Blocos do dashboard executivo com dados reais e situacao_dado por indicador.
    Fontes: Cofinanciamento APS (P.3.493/2024), SIOPS, CNES/DATASUS, SIAPS (quando credenciado).
    """
    blocos_aps, blocos_fin, blocos_cnes, blocos_siaps, blocos_vig = await asyncio.gather(
        _bloco_aps(ibge),
        _bloco_financeiro(ibge),
        _bloco_cnes(ibge),
        _bloco_siaps(ibge),
        _bloco_vigilancia_sem_api(),
    )

    return {
        "ibge":         ibge,
        "verificado_em": _ts(),
        "blocos": [
            blocos_aps,
            blocos_fin,
            blocos_cnes,
            blocos_siaps,
            blocos_vig,
        ],
        "nota": (
            "Dashboard agrega dados reais de APIs públicas disponíveis. "
            "Blocos com situacao_dado=nao_disponivel aguardam configuração de integrações no Railway."
        ),
    }


@router.get("/alertas")
async def get_alertas(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """
    Alertas consolidados do dashboard.
    Consulta banco de inconsistências para alertas reais.
    """
    try:
        from database import get_db_direct
        from models.inconsistencia import Inconsistencia
        from sqlalchemy import select, func
        async for db in get_db_direct():
            criticas = (await db.execute(
                select(func.count()).where(
                    Inconsistencia.municipio_ibge == ibge,
                    Inconsistencia.gravidade == "critica",
                    Inconsistencia.situacao.in_(["identificada", "em_correcao"]),
                )
            )).scalar_one()
            total = (await db.execute(
                select(func.count()).where(
                    Inconsistencia.municipio_ibge == ibge,
                    Inconsistencia.situacao.in_(["identificada", "em_correcao"]),
                )
            )).scalar_one()
            return {
                "ibge": ibge, "total_alertas": total,
                "criticos": criticas, "situacao_dado": "oficial_validado",
                "verificado_em": _ts(),
            }
    except Exception as exc:
        logger.debug("Sem tabela inconsistencias: %s", exc)

    return {
        "ibge": ibge, "total_alertas": None, "criticos": None,
        "situacao_dado": "nao_disponivel",
        "nota": "Banco de inconsistências não acessível.",
        "verificado_em": _ts(),
    }
