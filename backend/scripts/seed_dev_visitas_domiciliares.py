"""
Script de homologação — NÃO é um endpoint HTTP e NÃO roda em produção automaticamente.

Popula uma equipe/profissional(ACS)/microárea/domicílio mínimos, marcados
origem_dado=ERSUS_MANUAL (cadastro de contingência, sem vínculo PEC), para permitir
testar o registro de visitas domiciliares (routers/visitas_domiciliares.py) e o
Mapa de Visitas Domiciliares localmente, sem depender de uma instalação real do PEC.

Uso:
    cd backend
    python scripts/seed_dev_visitas_domiciliares.py

Idempotente: não duplica se já existir um registro com o mesmo pec_reference_id.
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from database import AsyncSessionLocal, init_db
from config import settings
from models import Municipio
from models.pec_cadastro import EquipeSaude, ProfissionalSaude, Microarea, Domicilio, Cidadao, OrigemDado
from services.pec.pseudonimizacao import hash_documento, mascarar_documento

_MARCADOR = "seed-dev-homologacao"


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        mun = (await db.execute(
            select(Municipio).where(Municipio.codigo_ibge == settings.FNS_MUNICIPIO_IBGE)
        )).scalar_one_or_none()
        if not mun:
            print("Município não encontrado — rode o backend uma vez para o seed inicial criar o município.")
            return

        existente = (await db.execute(
            select(EquipeSaude).where(EquipeSaude.pec_reference_id == _MARCADOR)
        )).scalar_one_or_none()
        if existente:
            print("Dados de homologação já existem — nada a fazer.")
            return

        equipe = EquipeSaude(
            municipio_id=mun.id, ine="0000000001", nome="ESF I — Homologação", tipo_equipe="ESF",
            cnes="2206406", pec_reference_id=_MARCADOR, origem_dado=OrigemDado.ERSUS_MANUAL,
        )
        db.add(equipe)
        await db.flush()

        profissional = ProfissionalSaude(
            municipio_id=mun.id, equipe_id=equipe.id, nome="ACS Homologação (dado de teste)",
            cns_hash="dev-homologacao-cns-hash", cns_mascarado="***0000", cbo="5151-01",
            cnes="2206406", cargo="ACS", pec_reference_id=_MARCADOR, origem_dado=OrigemDado.ERSUS_MANUAL,
        )
        db.add(profissional)
        await db.flush()

        microarea = Microarea(
            municipio_id=mun.id, equipe_id=equipe.id, acs_profissional_id=profissional.id,
            codigo="MA-HOMOLOG", zona="urbana", pec_reference_id=_MARCADOR, origem_dado=OrigemDado.ERSUS_MANUAL,
        )
        db.add(microarea)
        await db.flush()

        domicilio = Domicilio(
            municipio_id=mun.id, microarea_id=microarea.id, uuid_ficha=_MARCADOR,
            latitude=-7.1972, longitude=-59.8878, tipo_domicilio="Residência",
            pec_reference_id=_MARCADOR, origem_dado=OrigemDado.ERSUS_MANUAL,
        )
        db.add(domicilio)
        await db.flush()

        cns_teste = "700000000000099"
        cidadao = Cidadao(
            municipio_id=mun.id, domicilio_id=domicilio.id, nome="Cidadão Homologação (dado de teste)",
            cns_hash=hash_documento(cns_teste), cns_mascarado=mascarar_documento(cns_teste),
            pec_reference_id=_MARCADOR, origem_dado=OrigemDado.ERSUS_MANUAL,
        )
        db.add(cidadao)

        await db.commit()
        print(f"OK — equipe {equipe.id}, profissional {profissional.id}, "
              f"microárea {microarea.id}, domicílio {domicilio.id}, cidadão {cidadao.id} "
              f"criados (origem_dado=ERSUS_MANUAL).")


if __name__ == "__main__":
    asyncio.run(seed())
