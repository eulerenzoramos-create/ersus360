"""MivdtBuilderService — converte uma VisitaDomiciliar (dado operacional ERSUS 360)
no payload estruturado conforme o Modelo de Informação de Visita Domiciliar e
Territorial (MIVDT) vigente.

ATENÇÃO: o conjunto de campos abaixo é um mapeamento de melhor esforço, derivado do
que foi levantado no diagnóstico técnico (não da especificação oficial do MIVDT, que
não estava disponível neste projeto). Antes de qualquer transmissão real, validar
esta estrutura contra o Manual do Modelo de Informação de Visita Domiciliar e
Territorial do Ministério da Saúde e ajustar `MIVDT_VERSION` para a versão validada.
"""
from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel

from config import settings
from models.visita_domiciliar import VisitaDomiciliar
from services.pec.exceptions import PecIntegracaoDesativadaError


class MivdtVisitaPayload(BaseModel):
    versao_mivdt: str
    profissional_cns_mascarado: str
    cbo: str
    cnes: str
    ine: str
    microarea_codigo: str
    domicilio_uuid_ficha: str
    cidadao_cns_mascarado: str | None
    data_visita: datetime
    motivo_visita: str
    tipo_visita: str
    acompanhamento_realizado: str | None
    desfecho: str | None
    visita_compartilhada: bool


class MivdtBuilderService:
    def construir(self, visita: VisitaDomiciliar) -> MivdtVisitaPayload:
        """`visita` deve estar carregada com as relações profissional/equipe/microarea/
        domicilio/cidadao (ex.: via selectinload) — este método não faz I/O."""
        if not settings.MIVDT_VERSION:
            raise PecIntegracaoDesativadaError(
                "MIVDT_VERSION não configurada — defina a versão vigente antes de gerar o payload."
            )
        return MivdtVisitaPayload(
            versao_mivdt=settings.MIVDT_VERSION,
            profissional_cns_mascarado=visita.profissional.cns_mascarado,
            cbo=visita.profissional.cbo,
            cnes=visita.profissional.cnes,
            ine=visita.equipe.ine,
            microarea_codigo=visita.microarea.codigo,
            domicilio_uuid_ficha=visita.domicilio.uuid_ficha,
            cidadao_cns_mascarado=visita.cidadao.cns_mascarado if visita.cidadao else None,
            data_visita=visita.data_hora_dispositivo,
            motivo_visita=visita.motivo_visita,
            tipo_visita=visita.tipo_visita,
            acompanhamento_realizado=visita.acompanhamento_realizado,
            desfecho=visita.desfecho,
            visita_compartilhada=visita.visita_compartilhada,
        )
