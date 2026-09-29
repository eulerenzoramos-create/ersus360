"""
Sincronização automática das equipes do município pela API pública do SIAPS (sem login).

  GET apisiaps.saude.gov.br/api/public/filtros/componentes
      → códigos (coTipoIndicador) dos indicadores de cada tipo de equipe avaliada
  GET apisiaps.saude.gov.br/api/public/filtros/equipes?municipioIbge=<6>&indicadores=…
      → [{"coEquipe": INE, "noEquipe": nome, "sgEquipe": "eSF"|"eSFR"|…}]

Conferido em 29/09/2026 para Apuí: 9 eSF, 1 eSFR (AREAL), 10 eSB, 2 eMulti — os mesmos INEs
do XML do CNES. A API não traz profissionais; a composição continua vindo do XML do SISAB.
"""
from __future__ import annotations

import logging
from datetime import datetime

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.equipe_siaps import EquipeSiaps

logger = logging.getLogger(__name__)

BASE = "https://apisiaps.saude.gov.br/api/public"
TIMEOUT = 30
TIPOS = ("eAP", "eAPP", "eCR", "eMulti", "eSB", "eSF", "eSFR")


class SiapsIndisponivel(RuntimeError):
    pass


async def buscar_equipes(ibge: str, client: httpx.AsyncClient | None = None) -> list[dict]:
    """Equipes do município (IBGE de 6 ou 7 dígitos) com o tipo oficial do SIAPS."""
    fechar = client is None
    client = client or httpx.AsyncClient(timeout=TIMEOUT)
    try:
        r = await client.get(f"{BASE}/filtros/componentes")
        r.raise_for_status()
        grupos = [[i["coTipoIndicador"] for i in eq.get("indicadores", [])]
                  for comp in r.json() for eq in comp.get("equipesAvaliadas", [])]
        equipes: dict[str, dict] = {}
        for codigos in grupos:
            if not codigos:
                continue
            params = [("municipioIbge", ibge[:6])] + [("indicadores", c) for c in codigos]
            r = await client.get(f"{BASE}/filtros/equipes", params=params)
            r.raise_for_status()
            for e in r.json():
                ine = str(e.get("coEquipe", "")).zfill(10)
                if ine.strip("0"):
                    equipes[ine] = {"ine": ine, "nome": (e.get("noEquipe") or "").strip(),
                                    "tipo": (e.get("sgEquipe") or "").strip()}
        return sorted(equipes.values(), key=lambda e: (e["tipo"], e["nome"]))
    except (httpx.HTTPError, ValueError, KeyError) as e:
        raise SiapsIndisponivel(f"API pública do SIAPS indisponível: {e}") from e
    finally:
        if fechar:
            await client.aclose()


async def sincronizar(db: AsyncSession, municipio_id: int, ibge: str) -> dict:
    """Atualiza a tabela de equipes do município. Lista vazia do SIAPS não desativa nada
    (evita apagar tudo por instabilidade da API)."""
    novas = await buscar_equipes(ibge)
    if not novas:
        return {"ok": False, "motivo": "SIAPS não retornou equipes para o município", "equipes": 0}
    atuais = {e.ine: e for e in (await db.execute(
        select(EquipeSiaps).where(EquipeSiaps.municipio_id == municipio_id))).scalars()}
    vistas = set()
    for n in novas:
        vistas.add(n["ine"])
        reg = atuais.get(n["ine"])
        if reg is None:
            db.add(EquipeSiaps(municipio_id=municipio_id, ine=n["ine"], nome=n["nome"], tipo=n["tipo"], ativa=True))
        else:
            reg.nome, reg.tipo, reg.ativa, reg.atualizado_em = n["nome"], n["tipo"], True, datetime.utcnow()
    desativadas = [e.nome for ine, e in atuais.items() if ine not in vistas and e.ativa]
    for ine, e in atuais.items():
        if ine not in vistas:
            e.ativa = False
    await db.commit()
    return {"ok": True, "equipes": len(novas), "desativadas": desativadas, "por_tipo": por_tipo(novas)}


def por_tipo(equipes: list[dict] | list[EquipeSiaps]) -> dict[str, int]:
    tot = {t: 0 for t in TIPOS}
    for e in equipes:
        tipo = e["tipo"] if isinstance(e, dict) else e.tipo
        tot[tipo] = tot.get(tipo, 0) + 1
    return tot


async def equipes_do_municipio(db: AsyncSession, municipio_id: int) -> list[EquipeSiaps]:
    return list((await db.execute(select(EquipeSiaps)
                                  .where(EquipeSiaps.municipio_id == municipio_id, EquipeSiaps.ativa.is_(True))
                                  .order_by(EquipeSiaps.tipo, EquipeSiaps.nome))).scalars())
