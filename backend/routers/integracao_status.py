"""Router: /api/integracao — Status das integrações ERSUS 360 (SIAPS, e-Gestor, e-SUS PEC, CNES).

Cada fonte pública é TESTADA a cada verificação (requisição real, com status HTTP e tempo medido).
O que não é testado agora (lista de estabelecimentos do CNES, RNDS, PEC local) aparece como
"não verificado" ou com a data da última conferência — nunca como "tempo real".
"""
from __future__ import annotations

import asyncio
import logging
import os
import time
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.equipe_siaps import EquipeSiaps
from tenancy.escopo import SessaoMunicipal

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/integracao", tags=["Integrações"])

IBGE_APUI = "1300144"
CNES_SMS_APUI = "2013282"  # Hospital Dorvalino Lagasse — gestão municipal (lista de referência de Apuí)
CNES_LISTA_CONFERIDA_EM = "05/09/2026"
TIMEOUT_SONDA = 8

URL_SIAPS = "https://apisiaps.saude.gov.br/api/public/filtros/componentes"
URL_EGESTOR = "https://relatorioaps-prd.saude.gov.br/credenciamento/sujeitos-suspensao/competencias"
HEADERS_EGESTOR = {
    "Origin": "https://relatorioaps.saude.gov.br",
    "Referer": "https://relatorioaps.saude.gov.br/gerenciaaps/ausencia-envio-producao",
    "Accept": "application/json",
}
URL_CNES = "https://cnes.datasus.gov.br"
TIPOS_ESF = ("eSF", "eSFR", "eAP")


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


async def _sonda(url: str, headers: dict | None = None, verify: bool = True) -> dict:
    """Uma requisição GET de verdade: alcançável?, status HTTP e tempo em ms."""
    t0 = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SONDA, verify=verify, follow_redirects=True) as c:
            r = await c.get(url, headers=headers)
        return {"alcancavel": r.status_code < 500, "http": r.status_code, "ms": round((time.perf_counter() - t0) * 1000),
                "erro": None if r.status_code < 400 else f"HTTP {r.status_code}"}
    except httpx.HTTPError as e:
        return {"alcancavel": False, "http": None, "ms": round((time.perf_counter() - t0) * 1000),
                "erro": f"{type(e).__name__}"}


def _data_br(dt: datetime | None) -> str:
    return dt.strftime("%d/%m/%Y") if dt else "—"


def _status_siaps(sonda: dict, n_equipes: int, ultima: datetime | None) -> dict:
    credenciais = bool(os.getenv("SIAPS_CPF") and os.getenv("SIAPS_SENHA"))
    dados = n_equipes > 0
    if sonda["alcancavel"] and dados:
        nota = (f"API pública do SIAPS respondeu agora (HTTP {sonda['http']}). {n_equipes} equipes do município guardadas, "
                f"última atualização em {_data_br(ultima)}. Sem login gov.br; acesso autenticado não configurado.")
    elif not sonda["alcancavel"]:
        nota = f"API pública do SIAPS não respondeu agora ({sonda['erro']}). Os dados guardados continuam disponíveis, mas podem estar desatualizados."
    else:
        nota = "API pública do SIAPS respondeu, mas nenhuma equipe do município foi sincronizada ainda."
    if not credenciais:
        nota += " Para acesso autenticado, configure SIAPS_CPF e SIAPS_SENHA no Railway."
    return {
        "sistema": "SIAPS — Sistema de Informação para APS", "url_base": "https://apisiaps.saude.gov.br",
        "credenciais_configuradas": credenciais, "autenticado": False,
        "api_publica_alcancavel": sonda["alcancavel"], "api_publica_status_http": sonda["http"],
        "dados_vinculo_obtidos": dados, "fonte": "SIAPS — API pública (apisiaps.saude.gov.br), sem login",
        "nota": nota, "tempo_ms": sonda["ms"], "verificado_em": _ts(),
    }


def _status_egestor(sonda: dict, equipes: list[EquipeSiaps], ultima: datetime | None) -> dict:
    credenciais = bool(os.getenv("EGESTOR_TOKEN") or os.getenv("SIAPS_REFRESH_TOKEN"))
    esf = [e for e in equipes if e.tipo in TIPOS_ESF]
    if sonda["alcancavel"]:
        nota = f"Relatório público do e-Gestor APS respondeu agora (HTTP {sonda['http']}). "
    else:
        nota = f"Relatório público do e-Gestor APS não respondeu agora ({sonda['erro']}). "
    nota += (f"{len(esf)} equipes ESF/eAP/eRibeirinha do município, conforme a API pública do SIAPS "
             f"(atualizada em {_data_br(ultima)})." if esf else "Nenhuma equipe ESF sincronizada ainda para este município.")
    return {
        "sistema": "e-Gestor APS / SIAPS", "url_base": "https://relatorioaps.saude.gov.br",
        "ibge": "", "credenciais_configuradas": credenciais,
        "api_alcancavel": sonda["alcancavel"], "api_status_http": sonda["http"],
        "equipes_retornadas": len(esf),
        "ines_obtidos": [{"ine": e.ine, "equipe": f"{e.nome} ({e.tipo})"} for e in sorted(esf, key=lambda e: (e.tipo, e.nome))],
        "nota": nota, "tempo_ms": sonda["ms"], "verificado_em": _ts(),
    }


def _status_esus_pec() -> dict:
    pec_host = os.getenv("PEC_DB_HOST", "")
    credenciais = bool(pec_host and os.getenv("PEC_DB_PASS"))
    return {
        "sistema": "e-SUS PEC / RNDS",
        "pec_local": {
            "url": os.getenv("PEC_URL", "http://localhost:8080"),
            "conectado": None, "autenticado": None, "versao": None,
            "credenciais_configuradas": credenciais,
            "nota": ("PEC local: conexão não testada por esta tela. "
                     + ("Credenciais do banco configuradas no Railway." if credenciais
                        else "Configure PEC_DB_HOST, PEC_DB_USER e PEC_DB_PASS no Railway para acesso ao banco local.")),
        },
        "rnds": {
            "alcancavel": None, "credenciais_configuradas": bool(os.getenv("RNDS_CERT_PATH")),
            "nota": "RNDS não testada: requer certificado ICP-Brasil e autorização da Secretaria. Configure RNDS_CERT_PATH e RNDS_CERT_KEY_PATH no Railway.",
        },
        "tempo_ms": 0, "verificado_em": _ts(),
    }


def _status_cnes(sonda: dict, ibge: str) -> dict:
    from services.cnes_service import _UBS_APUI
    lista = _UBS_APUI if ibge == IBGE_APUI else []   # a lista de referência é só de Apuí
    if lista:
        nota = (f"Lista de {len(lista)} estabelecimentos de referência, conferida no CNES em {CNES_LISTA_CONFERIDA_EM} (não é consultada a cada verificação). "
                + (f"Portal do CNES respondeu agora (HTTP {sonda['http']})." if sonda["alcancavel"]
                   else f"Portal do CNES não respondeu agora ({sonda['erro']})."))
    else:
        nota = "Este município ainda não tem lista de estabelecimentos de referência cadastrada nesta tela."
    return {
        "sistema": "CNES / DATASUS", "ibge": ibge, "cnes_sms": CNES_SMS_APUI if lista else "",
        "api_alcancavel": sonda["alcancavel"], "api_status_http": sonda["http"],
        "total_estabelecimentos": len(lista),
        "com_rejeicao_equipe_esf": None, "sem_rejeicao_equipe_esf": None,   # não verificado por esta tela
        "estabelecimentos": [{"cnes": u["cnes"], "nome": u["nome"], "rejeicao_esf": None, "equipes": [], "observacao": None} for u in lista],
        "fonte": f"Lista de referência (CNES, conferida em {CNES_LISTA_CONFERIDA_EM})" if lista else "—",
        "nota": nota, "tempo_ms": sonda["ms"], "verificado_em": _ts(),
    }


@router.get("/status")
@router.get("/dashboard")
@router.get("/indicadores")
async def status(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    ibge = str(current.municipio_ibge)
    eqs = list((await db.execute(select(EquipeSiaps).where(EquipeSiaps.municipio_id == current.municipio_id,
                                                           EquipeSiaps.ativa.is_(True)))).scalars())
    ultima = max((e.atualizado_em for e in eqs), default=None)
    s_siaps, s_egestor, s_cnes = await asyncio.gather(
        _sonda(URL_SIAPS), _sonda(URL_EGESTOR, HEADERS_EGESTOR), _sonda(URL_CNES, verify=False))   # CNES: certificado do DATASUS costuma falhar

    siaps = _status_siaps(s_siaps, len(eqs), ultima)
    egestor = _status_egestor(s_egestor, eqs, ultima)
    egestor["ibge"] = ibge
    esus = _status_esus_pec()
    cnes = _status_cnes(s_cnes, ibge)

    ok = sum([siaps["api_publica_alcancavel"] and siaps["dados_vinculo_obtidos"],
              egestor["api_alcancavel"] and egestor["equipes_retornadas"] > 0,
              cnes["api_alcancavel"] and cnes["total_estabelecimentos"] > 0])
    return {
        "municipio": f"{current.municipio or 'Município'}/{current.municipio_uf or ''}".rstrip("/"), "ibge": ibge,
        "cnes_sms": cnes["cnes_sms"], "sistemas_ok": ok, "total_sistemas": 4,
        "integracoes": {"siaps": siaps, "egestor": egestor, "esus_pec": esus, "cnes": cnes},
        "verificado_em": _ts(),
    }
