"""Camada de integração com o PEC e-SUS APS (LEDI/MIVDT).

Esta é a ÚNICA camada autorizada a falar com o PEC. Nenhum router deve
importar httpx diretamente para o PEC — sempre passar por um destes serviços.

Ver docs/DOC-PEC-INTEGRACAO.md para o diagnóstico completo, o que está
configurado vs. pendente, e o plano de homologação.
"""
from services.pec.connection import PecConnectionService, PecConnectionStatus
from services.pec.cadastros import (
    PecProfessionalService, PecTeamService, PecCitizenService,
    PecHouseholdService, PecTerritoryService,
)
from services.pec.visitas import PecVisitService
from services.pec.mivdt import MivdtBuilderService, MivdtVisitaPayload
from services.pec.transmissao import LediTransmissionService, PecProcessingStatusService
from services.pec.auditoria import PecAuditService
from services.pec.exceptions import PecIntegracaoDesativadaError

__all__ = [
    "PecConnectionService", "PecConnectionStatus",
    "PecProfessionalService", "PecTeamService", "PecCitizenService",
    "PecHouseholdService", "PecTerritoryService",
    "PecVisitService",
    "MivdtBuilderService", "MivdtVisitaPayload",
    "LediTransmissionService", "PecProcessingStatusService",
    "PecAuditService",
    "PecIntegracaoDesativadaError",
]
