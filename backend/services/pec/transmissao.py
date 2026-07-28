"""LediTransmissionService — empacota o payload MIVDT no envelope LEDI e transmite
ao PEC pela API oficial. PecProcessingStatusService — consulta o status de
processamento de um protocolo/lote já enviado.

Nunca marcar uma visita como aceita/processada sem uma resposta HTTP real do PEC
(ver StatusFilaVisita — os estados são avançados um a um, nunca pulados).
"""
from __future__ import annotations
from datetime import datetime

import httpx
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.visita_domiciliar import VisitaDomiciliar, VisitaTransmissao, StatusFilaVisita
from services.pec.base import exigir_integracao_ativa
from services.pec.exceptions import PecIntegracaoDesativadaError
from services.pec.mivdt import MivdtVisitaPayload


class LediEnvelope(BaseModel):
    ledi_version: str
    mivdt_version: str
    estabelecimento_cnes: str
    gerado_em: datetime
    payload: MivdtVisitaPayload


class LediTransmissionService:
    def construir_envelope(self, payload: MivdtVisitaPayload) -> LediEnvelope:
        if not settings.LEDI_VERSION:
            raise PecIntegracaoDesativadaError("LEDI_VERSION não configurada.")
        return LediEnvelope(
            ledi_version=settings.LEDI_VERSION,
            mivdt_version=payload.versao_mivdt,
            estabelecimento_cnes=settings.PEC_ESTABLISHMENT_CNES or payload.cnes,
            gerado_em=datetime.utcnow(),
            payload=payload,
        )

    async def enviar(
        self, db: AsyncSession, visita: VisitaDomiciliar, envelope: LediEnvelope
    ) -> VisitaTransmissao:
        exigir_integracao_ativa()
        async with httpx.AsyncClient(timeout=settings.PEC_REQUEST_TIMEOUT) as client:
            resp = await client.post(
                f"{settings.PEC_API_URL.rstrip('/')}/ledi/visita-domiciliar",
                json=envelope.model_dump(mode="json"),
                headers={"X-CNES": settings.PEC_ESTABLISHMENT_CNES},
            )

        registro = VisitaTransmissao(
            visita_id=visita.id,
            uuid_ficha=visita.uuid_local,
            ledi_version=envelope.ledi_version,
            mivdt_version=envelope.mivdt_version,
            codigo_http=resp.status_code,
            resposta_tecnica=resp.text[:4000],
            tentativas=1,
        )
        db.add(registro)

        # Apenas "enviado" — aceitação/processamento exigem retorno posterior do PEC
        # (ver PecProcessingStatusService.consultar), nunca inferidos deste POST.
        visita.status_fila = StatusFilaVisita.ENVIADO_PEC
        visita.data_envio_pec = datetime.utcnow()

        await db.flush()
        return registro


class PecProcessingStatusService:
    async def consultar(self, protocolo: str) -> dict:
        exigir_integracao_ativa()
        async with httpx.AsyncClient(timeout=settings.PEC_REQUEST_TIMEOUT) as client:
            resp = await client.get(f"{settings.PEC_API_URL.rstrip('/')}/ledi/status/{protocolo}")
        return {"http_status": resp.status_code, "corpo": resp.text}
