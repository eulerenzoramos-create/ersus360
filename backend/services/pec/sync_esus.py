# -*- coding: utf-8 -*-
"""
Sincronização de cadastros do e-SUS PEC → banco local ERSUS 360.

Fluxo:
  1. Autentica via GraphQL (ESUS_USUARIO / ESUS_SENHA)
  2. Busca equipes, profissionais e cidadãos paginados
  3. Grava no banco com pseudonimização (CNS/CPF → hash + máscara)
  4. Idempotente: upsert por pec_reference_id — nunca duplica

Ativação: chamado pelo endpoint POST /api/integracao-pec/sync-cidadaos
ou automaticamente no startup quando ESUS_USUARIO/SENHA estão configurados.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import Municipio
from models.pec_cadastro import (
    EquipeSaude, ProfissionalSaude, Microarea, Cidadao, OrigemDado,
)
from services.pec.pseudonimizacao import hash_documento, mascarar_documento

logger = logging.getLogger(__name__)

BASE = settings.ESUS_URL.rstrip("/")
TIMEOUT = 30
IBGE = settings.FNS_MUNICIPIO_IBGE

# ── GraphQL queries ──────────────────────────────────────────────────────────

_GQL_LOGIN = """
mutation Login($login: String!, $senha: String!) {
  autenticar(input: { login: $login, senha: $senha }) {
    sessionToken
  }
}
"""

_GQL_EQUIPES = """
query Equipes($municipio: String!) {
  equipesSaude(filter: { municipio: { codigoIbge: $municipio } }) {
    id ine nome tipoEquipe { descricao }
    unidadeSaude { cnes }
    ativa
  }
}
"""

_GQL_PROFISSIONAIS = """
query Profissionais($municipio: String!) {
  profissionaisDeSaude(filter: { municipio: { codigoIbge: $municipio } }) {
    id nome cns cpf
    cbo { codigo descricao }
    ativo
    lotacoes {
      unidadeSaude { cnes }
      equipe { ine }
    }
  }
}
"""

_GQL_CIDADAOS_PAG = """
query CidadaosPag($municipio: String!, $page: Int!, $size: Int!) {
  cidadaos(
    filter: { municipio: { codigoIbge: $municipio } }
    page: $page
    size: $size
  ) {
    totalElements
    pageInfo { totalPages hasNextPage }
    content {
      id
      nome
      nomeSocial
      cns
      cpf
      dataNascimento
      sexo
    }
  }
}
"""


# ── helpers ──────────────────────────────────────────────────────────────────

async def _gql(query: str, variables: dict, token: Optional[str] = None) -> Optional[dict]:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as cli:
            r = await cli.post(f"{BASE}/graphql", json={"query": query, "variables": variables}, headers=headers)
            if r.status_code == 200:
                body = r.json()
                if "errors" not in body:
                    return body.get("data")
                logger.warning("PEC GraphQL errors: %s", body["errors"][:2])
    except Exception as exc:
        logger.warning("PEC GraphQL falha de rede: %s", exc)
    return None


async def _autenticar() -> Optional[str]:
    if not (settings.ESUS_USUARIO and settings.ESUS_SENHA):
        logger.warning("ESUS_USUARIO/ESUS_SENHA não configurados — sync abortado.")
        return None

    data = await _gql(_GQL_LOGIN, {"login": settings.ESUS_USUARIO, "senha": settings.ESUS_SENHA})
    token = data and data.get("autenticar", {}).get("sessionToken")
    if token:
        logger.info("PEC: autenticado com sucesso.")
        return token

    logger.error("PEC: falha de autenticação — verifique ESUS_USUARIO/ESUS_SENHA.")
    return None


# ── sync principal ──────────────────────────────────────────────────────────

class SyncResult:
    def __init__(self):
        self.equipes_criadas = 0
        self.equipes_atualizadas = 0
        self.profissionais_criados = 0
        self.profissionais_atualizados = 0
        self.cidadaos_criados = 0
        self.cidadaos_atualizados = 0
        self.erros: list[str] = []
        self.iniciado_em = datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "equipes_criadas": self.equipes_criadas,
            "equipes_atualizadas": self.equipes_atualizadas,
            "profissionais_criados": self.profissionais_criados,
            "profissionais_atualizados": self.profissionais_atualizados,
            "cidadaos_criados": self.cidadaos_criados,
            "cidadaos_atualizados": self.cidadaos_atualizados,
            "erros": self.erros[:20],
            "duracao_segundos": round((datetime.utcnow() - self.iniciado_em).total_seconds(), 1),
        }


async def sincronizar_cadastros_pec(db: AsyncSession) -> SyncResult:
    """
    Sincroniza equipes, profissionais e cidadãos do PEC para o banco local.
    Retorna um SyncResult com contadores de criados/atualizados/erros.
    """
    result = SyncResult()

    token = await _autenticar()
    if not token:
        result.erros.append("Falha de autenticação — verifique credenciais no Railway.")
        return result

    # Município local
    mun = (await db.execute(
        select(Municipio).where(Municipio.codigo_ibge == IBGE)
    )).scalar_one_or_none()
    if not mun:
        result.erros.append(f"Município IBGE {IBGE} não encontrado no banco.")
        return result

    agora = datetime.utcnow()

    # ── 1. Equipes ────────────────────────────────────────────────────────────
    data_eq = await _gql(_GQL_EQUIPES, {"municipio": IBGE}, token=token)
    equipes_raw = (data_eq or {}).get("equipesSaude") or []
    pec_id_to_equipe: dict[str, EquipeSaude] = {}

    for eq in equipes_raw:
        pec_id = str(eq.get("id", ""))
        if not pec_id:
            continue
        existente = (await db.execute(
            select(EquipeSaude).where(EquipeSaude.pec_reference_id == pec_id)
        )).scalar_one_or_none()

        ine = eq.get("ine") or pec_id
        nome = eq.get("nome") or f"Equipe {ine}"
        tipo = (eq.get("tipoEquipe") or {}).get("descricao") or "ESF"
        cnes = (eq.get("unidadeSaude") or {}).get("cnes") or ""
        ativa = eq.get("ativa", True)

        if existente:
            existente.nome = nome
            existente.tipo_equipe = tipo
            existente.cnes = cnes
            existente.ativa = ativa
            existente.data_ultima_atualizacao_pec = agora
            result.equipes_atualizadas += 1
            pec_id_to_equipe[pec_id] = existente
        else:
            nova = EquipeSaude(
                municipio_id=mun.id,
                ine=ine,
                nome=nome,
                tipo_equipe=tipo,
                cnes=cnes,
                ativa=ativa,
                pec_reference_id=pec_id,
                data_ultima_atualizacao_pec=agora,
                origem_dado=OrigemDado.PEC,
            )
            db.add(nova)
            await db.flush()
            pec_id_to_equipe[pec_id] = nova
            result.equipes_criadas += 1

    await db.flush()
    logger.info("Equipes: %d criadas, %d atualizadas.", result.equipes_criadas, result.equipes_atualizadas)

    # ── 2. Profissionais ──────────────────────────────────────────────────────
    data_prof = await _gql(_GQL_PROFISSIONAIS, {"municipio": IBGE}, token=token)
    profs_raw = (data_prof or {}).get("profissionaisDeSaude") or []

    for prof in profs_raw:
        pec_id = str(prof.get("id", ""))
        cns_raw = str(prof.get("cns") or prof.get("cpf") or pec_id)
        if not cns_raw:
            continue

        cns_hash = hash_documento(cns_raw)
        cns_mask = mascarar_documento(cns_raw)

        existente = (await db.execute(
            select(ProfissionalSaude).where(ProfissionalSaude.cns_hash == cns_hash)
        )).scalar_one_or_none()

        nome = prof.get("nome") or "Profissional"
        cbo_obj = prof.get("cbo") or {}
        cbo = cbo_obj.get("codigo") or ""
        cbo_desc = cbo_obj.get("descricao") or ""
        ativo = prof.get("ativo", True)
        # primeira lotação disponível
        lotacoes = prof.get("lotacoes") or []
        cnes = ""
        equipe_id = None
        for lot in lotacoes:
            cnes = (lot.get("unidadeSaude") or {}).get("cnes") or cnes
            ine_lot = (lot.get("equipe") or {}).get("ine") or ""
            if ine_lot:
                eq_match = next(
                    (e for e in pec_id_to_equipe.values() if e.ine == ine_lot), None
                )
                if eq_match:
                    equipe_id = eq_match.id
            break

        if existente:
            existente.nome = nome
            existente.cbo = cbo
            existente.cbo_descricao = cbo_desc
            existente.cnes = cnes or existente.cnes
            existente.ativo = ativo
            existente.equipe_id = equipe_id or existente.equipe_id
            existente.data_ultima_atualizacao_pec = agora
            result.profissionais_atualizados += 1
        else:
            novo = ProfissionalSaude(
                municipio_id=mun.id,
                equipe_id=equipe_id,
                nome=nome,
                cns_hash=cns_hash,
                cns_mascarado=cns_mask,
                cbo=cbo,
                cbo_descricao=cbo_desc,
                cnes=cnes or "0000000",
                ativo=ativo,
                pec_reference_id=pec_id or None,
                data_ultima_atualizacao_pec=agora,
                origem_dado=OrigemDado.PEC,
            )
            db.add(novo)
            result.profissionais_criados += 1

    await db.flush()
    logger.info("Profissionais: %d criados, %d atualizados.", result.profissionais_criados, result.profissionais_atualizados)

    # ── 3. Cidadãos (paginado) ────────────────────────────────────────────────
    page = 0
    page_size = 100
    total_pages = 1

    while page < total_pages:
        data_cid = await _gql(_GQL_CIDADAOS_PAG, {
            "municipio": IBGE,
            "page": page,
            "size": page_size,
        }, token=token)

        if not data_cid or not data_cid.get("cidadaos"):
            logger.warning("PEC: sem dados na página %d de cidadãos.", page)
            break

        pag = data_cid["cidadaos"]
        total_pages = (pag.get("pageInfo") or {}).get("totalPages") or 1
        content = pag.get("content") or []

        for cid in content:
            pec_id = str(cid.get("id", ""))
            cns_raw = str(cid.get("cns") or cid.get("cpf") or pec_id)
            if not cns_raw:
                continue

            cns_hash = hash_documento(cns_raw)
            cns_mask = mascarar_documento(cns_raw)

            nome = (
                cid.get("nomeSocial")
                or cid.get("nome")
                or "Cidadão"
            )

            dn_raw = cid.get("dataNascimento")
            data_nasc = None
            if dn_raw:
                try:
                    data_nasc = datetime.fromisoformat(str(dn_raw)[:10])
                except Exception:
                    pass

            sexo = (str(cid.get("sexo") or "")[:1].upper()) or None
            if sexo not in ("M", "F"):
                sexo = None

            existente = (await db.execute(
                select(Cidadao).where(Cidadao.cns_hash == cns_hash)
            )).scalar_one_or_none()

            if existente:
                existente.nome = nome
                existente.data_nascimento = data_nasc
                existente.sexo = sexo
                existente.data_ultima_atualizacao_pec = agora
                result.cidadaos_atualizados += 1
            else:
                novo_cid = Cidadao(
                    municipio_id=mun.id,
                    domicilio_id=None,
                    nome=nome,
                    cns_hash=cns_hash,
                    cns_mascarado=cns_mask,
                    data_nascimento=data_nasc,
                    sexo=sexo,
                    pec_reference_id=pec_id or None,
                    data_ultima_atualizacao_pec=agora,
                    origem_dado=OrigemDado.PEC,
                )
                db.add(novo_cid)
                result.cidadaos_criados += 1

        await db.flush()
        logger.info(
            "Cidadãos página %d/%d: %d criados até agora.",
            page + 1, total_pages, result.cidadaos_criados,
        )
        page += 1

    await db.commit()
    logger.info(
        "Sync PEC concluído: %d equipes, %d profissionais, %d cidadãos novos.",
        result.equipes_criadas, result.profissionais_criados, result.cidadaos_criados,
    )
    return result
