"""
Router: /api/linha-tempo — Linha do Tempo Unificada do Cidadao
Requer RNDS (certificado mTLS) + e-SUS PEC (ESUS_URL) para dados reais.
Sem credenciais configuradas → nao_disponivel.
"""
from __future__ import annotations
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/linha-tempo", tags=["linha-tempo"])

_NOTA = (
    "Linha do tempo requer integracao com RNDS (RNDS_CERT_PATH, RNDS_CERT_KEY_PATH) "
    "e e-SUS PEC local (ESUS_URL, ESUS_USUARIO, ESUS_SENHA) configurados no Railway. "
    "Nunca sao exibidos dados de pacientes sem fonte real verificada."
)


@router.get("/cidadao")
async def buscar_cidadao(cns: str = Query(...)):
    return {
        "cns":           cns,
        "situacao_dado": "nao_disponivel",
        "dados":         None,
        "nota":          _NOTA,
    }


@router.get("/eventos")
async def listar_eventos(
    cns: str = Query(...),
    fontes: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
):
    return {
        "cns":           cns,
        "situacao_dado": "nao_disponivel",
        "eventos":       [],
        "nota":          _NOTA,
    }
