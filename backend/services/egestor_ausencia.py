"""
Coleta do relatório público "Equipes e serviços com ausência de envio de informação" (e-Gestor APS).

  GET relatorioaps-prd.saude.gov.br/credenciamento/sujeitos-suspensao/competencias   → ["202505", ...]
  GET relatorioaps-prd.saude.gov.br/credenciamento/sujeitos-suspensao?nuCompCnes=AAAAMM
      → {"dataGeracao", "equipes": [...], "estabelecimentos": [...], "profissionais": [...]}  (Brasil inteiro,
        ~9 MB por competência; sem login). Só o recorte do município da sessão é guardado.

A fonte informa apenas AUSÊNCIA de produção válida e há quantas competências ela dura. Não traz
quantidades de atendimentos, transmissões ou rejeições — e este módulo não as inventa.
"""
from __future__ import annotations

import re
import unicodedata
from datetime import datetime

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.egestor_ausencia import EgestorAusencia, EgestorAusenciaColeta
from services.pec.pseudonimizacao import hash_documento, mascarar_documento

BASE = "https://relatorioaps-prd.saude.gov.br/credenciamento/sujeitos-suspensao"
HEADERS = {
    "Origin": "https://relatorioaps.saude.gov.br",
    "Referer": "https://relatorioaps.saude.gov.br/gerenciaaps/ausencia-envio-producao",
    "Accept": "application/json",
}
TIMEOUT = 180
FONTE = "e-Gestor APS — relatório público (relatorioaps.saude.gov.br)"

# Faixas da fonte → número de competências consecutivas (4 = "Superior a 03")
SUPERIOR_A_3 = 4

# Alerta gerencial interno — NÃO substitui a situação oficial publicada pelo Ministério da Saúde.
NIVEIS = {
    "verde":    "Regular",
    "amarelo":  "Atenção",
    "laranja":  "Alto risco",
    "vermelho": "Crítico",
    "cinza":    "Não verificado",
}


class FonteIndisponivel(RuntimeError):
    pass


def _sem_acento(s: str) -> str:
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()


def qt_consecutivas(texto: str | None) -> int | None:
    """'01 competência' → 1 · '02 competências consecutivas' → 2 · 'Superior a 03 …' → 4."""
    t = _sem_acento(texto or "")
    if "superior" in t:
        return SUPERIOR_A_3
    m = re.match(r"\s*(\d+)", t)
    return int(m.group(1)) if m else None


def nivel(qt: int | None, coletada: bool = True) -> str:
    """Cor do alerta gerencial. Sem coleta da competência → cinza (não verificado)."""
    if not coletada:
        return "cinza"
    if not qt:
        return "verde"
    return "amarelo" if qt == 1 else "laranja" if qt == 2 else "vermelho"


def comp_fonte(c: str) -> str:
    """'AAAA-MM' → 'AAAAMM' (formato da fonte)."""
    return c.replace("-", "")


def comp_ersus(c: str) -> str:
    """'AAAAMM' → 'AAAA-MM'."""
    return f"{c[:4]}-{c[4:6]}"


async def listar_competencias(client: httpx.AsyncClient | None = None) -> list[str]:
    fechar = client is None
    client = client or httpx.AsyncClient(timeout=TIMEOUT)
    try:
        r = await client.get(f"{BASE}/competencias", headers=HEADERS)
        r.raise_for_status()
        return sorted(comp_ersus(c) for c in r.json())
    except (httpx.HTTPError, ValueError) as e:
        raise FonteIndisponivel(f"Fonte pública do e-Gestor indisponível: {e}") from e
    finally:
        if fechar:
            await client.aclose()


async def baixar_competencia(competencia: str, client: httpx.AsyncClient | None = None) -> dict:
    fechar = client is None
    client = client or httpx.AsyncClient(timeout=TIMEOUT)
    try:
        r = await client.get(BASE, params={"nuCompCnes": comp_fonte(competencia)}, headers=HEADERS)
        r.raise_for_status()
        return r.json()
    except (httpx.HTTPError, ValueError) as e:
        raise FonteIndisponivel(f"Competência {competencia}: fonte indisponível ({e})") from e
    finally:
        if fechar:
            await client.aclose()


def recorte_do_municipio(payload: dict, ibge: str) -> dict:
    """Só o município da sessão (IBGE de 6 dígitos na fonte). Nada de outros municípios é guardado."""
    ibge6 = str(ibge)[:6]
    do_mun = lambda lista: [x for x in (lista or []) if str(x.get("coMunicipioIbge")) == ibge6]  # noqa: E731
    return {
        "data_geracao": payload.get("dataGeracao"),
        "equipes": do_mun(payload.get("equipes")),
        "estabelecimentos": do_mun(payload.get("estabelecimentos")),
        "profissionais": do_mun(payload.get("profissionais")),
        "qt_equipes_brasil": len(payload.get("equipes") or []),
    }


async def coletar(db: AsyncSession, municipio_id: int, ibge: str, competencias: list[str],
                  usuario: str | None, ultima_na_fonte: str | None = None,
                  client: httpx.AsyncClient | None = None) -> dict:
    """Baixa cada competência e substitui o recorte do município (idempotente)."""
    resumo: list[dict] = []
    erros: list[dict] = []
    agora = datetime.utcnow()
    for comp in competencias:
        try:
            rec = recorte_do_municipio(await baixar_competencia(comp, client), ibge)
        except FonteIndisponivel as e:
            erros.append({"competencia": comp, "erro": str(e)})
            continue

        await db.execute(delete(EgestorAusencia).where(EgestorAusencia.municipio_id == municipio_id,
                                                       EgestorAusencia.competencia == comp))
        linhas: dict[tuple[str, str], EgestorAusencia] = {}
        base = dict(municipio_id=municipio_id, municipio_ibge=str(ibge), competencia=comp, coletado_em=agora)
        for e in rec["equipes"]:
            ine = str(e.get("coEquipe") or "").zfill(10)
            linhas[("equipe", ine)] = EgestorAusencia(
                **base, tipo_registro="equipe", chave=ine, ine=ine, tipologia=str(e.get("coTipoEquipe") or "") or None,
                descricao=e.get("dsSubTipoSuspensao") or "", qt_texto=e.get("qtCompetenciasConsecutivas"),
                qt_consecutivas=qt_consecutivas(e.get("qtCompetenciasConsecutivas")))
        for e in rec["estabelecimentos"]:
            cnes = str(e.get("coCnes") or "").zfill(7)
            chave = f"{cnes}:{_sem_acento(e.get('dsComponentePagamento') or '')[:24]}"
            linhas[("estabelecimento", chave)] = EgestorAusencia(
                **base, tipo_registro="estabelecimento", chave=chave, cnes=cnes,
                componente=e.get("dsComponentePagamento"), descricao=e.get("dsSubTipoSuspensao") or "",
                qt_texto=e.get("qtCompetenciasConsecutivas"),
                qt_consecutivas=qt_consecutivas(e.get("qtCompetenciasConsecutivas")))
        for e in rec["profissionais"]:
            cns = str(e.get("nuCns") or "")
            ine = str(e.get("coEquipe") or "").zfill(10) if e.get("coEquipe") else None
            chave = f"{hash_documento(cns)[:16]}:{ine or ''}"
            linhas[("profissional", chave)] = EgestorAusencia(
                **base, tipo_registro="profissional", chave=chave, ine=ine,
                cnes=(str(e.get("coCnes") or "").zfill(7) if e.get("coCnes") else None),
                cbo=e.get("coCbo"), cns_mascarado=mascarar_documento(cns),   # nunca o CNS inteiro
                descricao=e.get("dsSubTipoSuspensao") or "", qt_texto=e.get("qtCompetenciasConsecutivas"),
                qt_consecutivas=qt_consecutivas(e.get("qtCompetenciasConsecutivas")))
        db.add_all(linhas.values())

        coleta = (await db.execute(select(EgestorAusenciaColeta).where(
            EgestorAusenciaColeta.municipio_id == municipio_id,
            EgestorAusenciaColeta.competencia == comp))).scalar_one_or_none()
        if coleta is None:
            coleta = EgestorAusenciaColeta(municipio_id=municipio_id, competencia=comp, municipio_ibge=str(ibge))
            db.add(coleta)
        coleta.data_geracao_fonte = rec["data_geracao"]
        coleta.ultima_competencia_fonte = ultima_na_fonte
        coleta.qt_equipes, coleta.qt_estabelecimentos = len(rec["equipes"]), len(rec["estabelecimentos"])
        coleta.qt_profissionais, coleta.qt_equipes_brasil = len(rec["profissionais"]), rec["qt_equipes_brasil"]
        coleta.coletado_por, coleta.coletado_em = usuario, agora
        resumo.append({"competencia": comp, "equipes": len(rec["equipes"]), "estabelecimentos": len(rec["estabelecimentos"]),
                       "profissionais": len(rec["profissionais"]), "gerado_em_fonte": rec["data_geracao"]})
    await db.commit()
    return {"coletadas": resumo, "erros": erros}
