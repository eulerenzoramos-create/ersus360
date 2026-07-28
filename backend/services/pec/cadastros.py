"""Serviços de sincronização dos cadastros oficiais do PEC (somente leitura -> cache local).

Cada serviço expõe:
- fetch_from_pec(): busca os dados reais no PEC. Levanta PecIntegracaoDesativadaError
  se a integração estiver desativada/sem credenciais, e NotImplementedError se o
  endpoint LEDI ainda não foi validado contra a documentação oficial desta instalação
  (ver docs/DOC-PEC-INTEGRACAO.md — nenhuma chamada é simulada).
- upsert_local(): reconcilia os registros no cache local por pec_reference_id,
  nunca duplicando um cidadão/domicílio/equipe/profissional já vinculado ao PEC.
"""
from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.pec_cadastro import (
    EquipeSaude, ProfissionalSaude, Microarea, Domicilio, Cidadao, OrigemDado,
)
from services.pec.base import exigir_integracao_ativa, hash_registro
from services.pec.pseudonimizacao import hash_documento, mascarar_documento


async def _resolver_fk(db: AsyncSession, modelo, pec_reference_id: str | None):
    if not pec_reference_id:
        return None
    row = (await db.execute(
        select(modelo).where(modelo.pec_reference_id == pec_reference_id)
    )).scalar_one_or_none()
    return row.id if row else None


# ─── Equipes (INE) ──────────────────────────────────────────────────────────

class EquipeSaudeDTO(BaseModel):
    pec_reference_id: str
    ine: str
    nome: str
    tipo_equipe: str
    cnes: str
    ativa: bool = True
    atualizado_em_pec: datetime | None = None


class PecTeamService:
    async def fetch_from_pec(self) -> list[EquipeSaudeDTO]:
        exigir_integracao_ativa()
        raise NotImplementedError(
            "Endpoint LEDI de equipes ainda não documentado/validado para esta instalação do PEC."
        )

    async def upsert_local(
        self, db: AsyncSession, municipio_id: int, registros: list[EquipeSaudeDTO]
    ) -> dict:
        criados = atualizados = inalterados = 0
        for r in registros:
            h = hash_registro(r.model_dump(mode="json"))
            existente = (await db.execute(
                select(EquipeSaude).where(EquipeSaude.pec_reference_id == r.pec_reference_id)
            )).scalar_one_or_none()
            if existente is None:
                db.add(EquipeSaude(
                    municipio_id=municipio_id, ine=r.ine, nome=r.nome, tipo_equipe=r.tipo_equipe,
                    cnes=r.cnes, ativa=r.ativa, pec_reference_id=r.pec_reference_id,
                    data_ultima_atualizacao_pec=r.atualizado_em_pec, hash_controle=h,
                    origem_dado=OrigemDado.PEC,
                ))
                criados += 1
            elif existente.hash_controle != h:
                existente.ine, existente.nome, existente.tipo_equipe = r.ine, r.nome, r.tipo_equipe
                existente.cnes, existente.ativa = r.cnes, r.ativa
                existente.data_ultima_atualizacao_pec, existente.hash_controle = r.atualizado_em_pec, h
                atualizados += 1
            else:
                inalterados += 1
        await db.flush()
        return {"criados": criados, "atualizados": atualizados, "inalterados": inalterados}


# ─── Profissionais (inclui ACS) ─────────────────────────────────────────────

class ProfissionalSaudeDTO(BaseModel):
    pec_reference_id: str
    nome: str
    cns: str                       # texto puro apenas em trânsito — nunca persistido assim
    cbo: str
    cbo_descricao: str | None = None
    cnes: str
    cargo: str | None = None
    ativo: bool = True
    equipe_pec_reference_id: str | None = None
    atualizado_em_pec: datetime | None = None


class PecProfessionalService:
    async def fetch_from_pec(self) -> list[ProfissionalSaudeDTO]:
        exigir_integracao_ativa()
        raise NotImplementedError(
            "Endpoint LEDI de profissionais ainda não documentado/validado para esta instalação do PEC."
        )

    async def upsert_local(
        self, db: AsyncSession, municipio_id: int, registros: list[ProfissionalSaudeDTO]
    ) -> dict:
        criados = atualizados = inalterados = 0
        for r in registros:
            cns_hash = hash_documento(r.cns)
            cns_mascarado = mascarar_documento(r.cns)
            equipe_id = await _resolver_fk(db, EquipeSaude, r.equipe_pec_reference_id)
            dados_hash = r.model_dump(mode="json", exclude={"cns"}) | {"cns_hash": cns_hash}
            h = hash_registro(dados_hash)
            existente = (await db.execute(
                select(ProfissionalSaude).where(ProfissionalSaude.pec_reference_id == r.pec_reference_id)
            )).scalar_one_or_none()
            if existente is None:
                db.add(ProfissionalSaude(
                    municipio_id=municipio_id, equipe_id=equipe_id, nome=r.nome,
                    cns_hash=cns_hash, cns_mascarado=cns_mascarado, cbo=r.cbo,
                    cbo_descricao=r.cbo_descricao, cnes=r.cnes, cargo=r.cargo, ativo=r.ativo,
                    pec_reference_id=r.pec_reference_id, data_ultima_atualizacao_pec=r.atualizado_em_pec,
                    hash_controle=h, origem_dado=OrigemDado.PEC,
                ))
                criados += 1
            elif existente.hash_controle != h:
                existente.equipe_id, existente.nome = equipe_id, r.nome
                existente.cns_hash, existente.cns_mascarado = cns_hash, cns_mascarado
                existente.cbo, existente.cbo_descricao = r.cbo, r.cbo_descricao
                existente.cnes, existente.cargo, existente.ativo = r.cnes, r.cargo, r.ativo
                existente.data_ultima_atualizacao_pec, existente.hash_controle = r.atualizado_em_pec, h
                atualizados += 1
            else:
                inalterados += 1
        await db.flush()
        return {"criados": criados, "atualizados": atualizados, "inalterados": inalterados}


# ─── Microáreas (território) ────────────────────────────────────────────────

class MicroareaDTO(BaseModel):
    pec_reference_id: str
    codigo: str
    zona: str
    equipe_pec_reference_id: str
    acs_pec_reference_id: str | None = None
    atualizado_em_pec: datetime | None = None


class PecTerritoryService:
    async def fetch_from_pec(self) -> list[MicroareaDTO]:
        exigir_integracao_ativa()
        raise NotImplementedError(
            "Endpoint LEDI de território/microáreas ainda não documentado/validado para esta instalação do PEC."
        )

    async def upsert_local(
        self, db: AsyncSession, municipio_id: int, registros: list[MicroareaDTO]
    ) -> dict:
        criados = atualizados = inalterados = 0
        for r in registros:
            equipe_id = await _resolver_fk(db, EquipeSaude, r.equipe_pec_reference_id)
            acs_id = await _resolver_fk(db, ProfissionalSaude, r.acs_pec_reference_id)
            h = hash_registro(r.model_dump(mode="json"))
            existente = (await db.execute(
                select(Microarea).where(Microarea.pec_reference_id == r.pec_reference_id)
            )).scalar_one_or_none()
            if existente is None:
                db.add(Microarea(
                    municipio_id=municipio_id, equipe_id=equipe_id, acs_profissional_id=acs_id,
                    codigo=r.codigo, zona=r.zona, pec_reference_id=r.pec_reference_id,
                    data_ultima_atualizacao_pec=r.atualizado_em_pec, hash_controle=h,
                    origem_dado=OrigemDado.PEC,
                ))
                criados += 1
            elif existente.hash_controle != h:
                existente.equipe_id, existente.acs_profissional_id = equipe_id, acs_id
                existente.codigo, existente.zona = r.codigo, r.zona
                existente.data_ultima_atualizacao_pec, existente.hash_controle = r.atualizado_em_pec, h
                atualizados += 1
            else:
                inalterados += 1
        await db.flush()
        return {"criados": criados, "atualizados": atualizados, "inalterados": inalterados}


# ─── Domicílios ──────────────────────────────────────────────────────────────

class DomicilioDTO(BaseModel):
    pec_reference_id: str
    uuid_ficha: str
    logradouro: str | None = None
    numero: str | None = None
    tipo_domicilio: str | None = None
    situacao_moradia: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    microarea_pec_reference_id: str
    atualizado_em_pec: datetime | None = None


class PecHouseholdService:
    async def fetch_from_pec(self) -> list[DomicilioDTO]:
        exigir_integracao_ativa()
        raise NotImplementedError(
            "Endpoint LEDI de cadastro domiciliar ainda não documentado/validado para esta instalação do PEC."
        )

    async def upsert_local(
        self, db: AsyncSession, municipio_id: int, registros: list[DomicilioDTO]
    ) -> dict:
        criados = atualizados = inalterados = 0
        for r in registros:
            microarea_id = await _resolver_fk(db, Microarea, r.microarea_pec_reference_id)
            h = hash_registro(r.model_dump(mode="json"))
            existente = (await db.execute(
                select(Domicilio).where(Domicilio.pec_reference_id == r.pec_reference_id)
            )).scalar_one_or_none()
            if existente is None:
                db.add(Domicilio(
                    municipio_id=municipio_id, microarea_id=microarea_id, uuid_ficha=r.uuid_ficha,
                    logradouro=r.logradouro, numero=r.numero, tipo_domicilio=r.tipo_domicilio,
                    situacao_moradia=r.situacao_moradia, latitude=r.latitude, longitude=r.longitude,
                    pec_reference_id=r.pec_reference_id, data_ultima_atualizacao_pec=r.atualizado_em_pec,
                    hash_controle=h, origem_dado=OrigemDado.PEC,
                ))
                criados += 1
            elif existente.hash_controle != h:
                existente.microarea_id = microarea_id
                existente.logradouro, existente.numero = r.logradouro, r.numero
                existente.tipo_domicilio, existente.situacao_moradia = r.tipo_domicilio, r.situacao_moradia
                existente.latitude, existente.longitude = r.latitude, r.longitude
                existente.data_ultima_atualizacao_pec, existente.hash_controle = r.atualizado_em_pec, h
                atualizados += 1
            else:
                inalterados += 1
        await db.flush()
        return {"criados": criados, "atualizados": atualizados, "inalterados": inalterados}


# ─── Cidadãos ────────────────────────────────────────────────────────────────

class CidadaoDTO(BaseModel):
    pec_reference_id: str
    nome: str
    cns: str
    cpf: str | None = None
    data_nascimento: datetime | None = None
    sexo: str | None = None
    domicilio_pec_reference_id: str | None = None
    atualizado_em_pec: datetime | None = None


class PecCitizenService:
    async def fetch_from_pec(self) -> list[CidadaoDTO]:
        exigir_integracao_ativa()
        raise NotImplementedError(
            "Endpoint LEDI de cadastro individual ainda não documentado/validado para esta instalação do PEC."
        )

    async def upsert_local(
        self, db: AsyncSession, municipio_id: int, registros: list[CidadaoDTO]
    ) -> dict:
        criados = atualizados = inalterados = 0
        for r in registros:
            cns_hash = hash_documento(r.cns)
            cns_mascarado = mascarar_documento(r.cns)
            cpf_hash = hash_documento(r.cpf) if r.cpf else None
            domicilio_id = await _resolver_fk(db, Domicilio, r.domicilio_pec_reference_id)
            dados_hash = r.model_dump(mode="json", exclude={"cns", "cpf"}) | {
                "cns_hash": cns_hash, "cpf_hash": cpf_hash,
            }
            h = hash_registro(dados_hash)
            existente = (await db.execute(
                select(Cidadao).where(Cidadao.pec_reference_id == r.pec_reference_id)
            )).scalar_one_or_none()
            if existente is None:
                db.add(Cidadao(
                    municipio_id=municipio_id, domicilio_id=domicilio_id, nome=r.nome,
                    cns_hash=cns_hash, cns_mascarado=cns_mascarado, cpf_hash=cpf_hash,
                    data_nascimento=r.data_nascimento, sexo=r.sexo,
                    pec_reference_id=r.pec_reference_id, data_ultima_atualizacao_pec=r.atualizado_em_pec,
                    hash_controle=h, origem_dado=OrigemDado.PEC,
                ))
                criados += 1
            elif existente.hash_controle != h:
                existente.domicilio_id, existente.nome = domicilio_id, r.nome
                existente.cns_hash, existente.cns_mascarado, existente.cpf_hash = cns_hash, cns_mascarado, cpf_hash
                existente.data_nascimento, existente.sexo = r.data_nascimento, r.sexo
                existente.data_ultima_atualizacao_pec, existente.hash_controle = r.atualizado_em_pec, h
                atualizados += 1
            else:
                inalterados += 1
        await db.flush()
        return {"criados": criados, "atualizados": atualizados, "inalterados": inalterados}
