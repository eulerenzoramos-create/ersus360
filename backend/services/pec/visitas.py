"""PecVisitService — consulta visitas domiciliares já processadas/reconhecidas pelo PEC.

Distinto de LediTransmissionService (envia uma visita criada no ERSUS 360 ao PEC) e de
PecProcessingStatusService (consulta o status de processamento de um lote/protocolo já
enviado) — este serviço é o lado "leitura" para conciliação (comparar o que o ERSUS 360
acha que enviou com o que o PEC efetivamente reconhece).
"""
from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel

from services.pec.base import exigir_integracao_ativa


class VisitaPecDTO(BaseModel):
    pec_reference_id: str
    uuid_ficha: str
    profissional_pec_reference_id: str
    data_visita: datetime
    situacao_oficial: str


class PecVisitService:
    async def fetch_processed_visits(self, competencia: str) -> list[VisitaPecDTO]:
        exigir_integracao_ativa()
        raise NotImplementedError(
            "Endpoint LEDI de consulta de visitas processadas ainda não documentado/validado "
            "para esta instalação do PEC."
        )
