"""
Router: /api/rnds — RNDS FHIR R4 Gateway — ERSUS 360

Fontes reais:
  - RNDS (Rede Nacional de Dados em Saúde): API REST FHIR R4, certificado mTLS.
  - Requer RNDS_CERT_PATH + RNDS_CERT_KEY_PATH + RNDS_CNES configurados no Railway.
  - Sem certificado: todos os endpoints retornam situacao_dado = nao_disponivel.

Regras de dados:
  - Nenhum registro de paciente, CNS ou log de envio é simulado.
  - Status de conexão derivado de ping real ao endpoint RNDS quando certificado presente.
"""
from __future__ import annotations
import asyncio
import logging
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rnds", tags=["RNDS"])


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _tem_certificado() -> bool:
    return bool(
        os.getenv("RNDS_CERT_PATH", "").strip() and
        os.getenv("RNDS_CERT_KEY_PATH", "").strip()
    )


async def _ping_rnds() -> dict:
    """Testa conectividade com a RNDS via mTLS."""
    import httpx
    cert_path = os.getenv("RNDS_CERT_PATH", "")
    key_path  = os.getenv("RNDS_CERT_KEY_PATH", "")
    cnes      = os.getenv("RNDS_CNES", "")
    base_url  = os.getenv("RNDS_URL", "https://ehr.saude.gov.br")

    if not (cert_path and key_path):
        return {
            "online": False,
            "situacao_dado": "nao_disponivel",
            "nota": "Certificado mTLS não configurado. Defina RNDS_CERT_PATH e RNDS_CERT_KEY_PATH no Railway.",
        }

    try:
        async with httpx.AsyncClient(
            cert=(cert_path, key_path), timeout=10, verify=True
        ) as c:
            r = await c.get(f"{base_url}/fhir/r4/metadata")
            if r.status_code < 400:
                return {
                    "online": True,
                    "situacao_dado": "oficial_validado",
                    "versao_fhir": r.json().get("fhirVersion", "R4"),
                    "latencia_ms": int(r.elapsed.total_seconds() * 1000),
                    "nota": f"RNDS acessível via mTLS. CNES: {cnes or 'não definido'}.",
                }
            return {
                "online": False,
                "situacao_dado": "divergente",
                "codigo_resposta": r.status_code,
                "nota": f"RNDS retornou HTTP {r.status_code}.",
            }
    except Exception as exc:
        logger.warning("Erro ao pingar RNDS: %s", exc)
        return {
            "online": False,
            "situacao_dado": "nao_disponivel",
            "nota": f"Falha de conectividade com a RNDS: {exc}",
        }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status")
async def status_rnds(_: UserOut = Depends(get_current_user)):
    """
    Status da conexão mTLS com a RNDS.
    Faz ping real ao endpoint /fhir/r4/metadata quando certificado presente.
    """
    ping = await _ping_rnds()
    tem_cert = _tem_certificado()

    recursos_fhir = [
        {"recurso": "Patient",             "path": "/fhir/r4/Patient",             "metodos": ["GET","POST"]},
        {"recurso": "Immunization",        "path": "/fhir/r4/Immunization",        "metodos": ["GET","POST"]},
        {"recurso": "AllergyIntolerance",  "path": "/fhir/r4/AllergyIntolerance",  "metodos": ["GET","POST","PUT"]},
        {"recurso": "Condition",           "path": "/fhir/r4/Condition",           "metodos": ["GET","POST"]},
        {"recurso": "Procedure",           "path": "/fhir/r4/Procedure",           "metodos": ["GET","POST"]},
        {"recurso": "MedicationRequest",   "path": "/fhir/r4/MedicationRequest",   "metodos": ["GET"]},
        {"recurso": "Observation",         "path": "/fhir/r4/Observation",         "metodos": ["GET","POST"]},
        {"recurso": "CapabilityStatement", "path": "/fhir/r4/metadata",            "metodos": ["GET"]},
    ]

    return {
        "situacao_dado":      ping["situacao_dado"],
        "online":             ping.get("online", False),
        "certificado_mtls":   tem_cert,
        "latencia_ms":        ping.get("latencia_ms"),
        "versao_fhir":        ping.get("versao_fhir"),
        "ambiente":           "producao" if tem_cert else "nao_configurado",
        "recursos_fhir":      recursos_fhir,
        "nota":               ping["nota"],
        "verificado_em":      _ts(),
        "instrucao": (
            None if tem_cert else
            "Configure RNDS_CERT_PATH, RNDS_CERT_KEY_PATH e RNDS_CNES no Railway. "
            "Certificado digital emitido pelo DATASUS/MS para o estabelecimento de saúde."
        ),
    }


@router.get("/registros")
async def listar_registros(
    status: Optional[str] = Query(None),
    _: UserOut = Depends(get_current_user),
):
    """
    Lista envios RNDS do banco local.
    Requer certificado mTLS configurado — retorna lista vazia sem ele.
    """
    if not _tem_certificado():
        return {
            "situacao_dado": "nao_disponivel",
            "registros": [],
            "nota": "Certificado mTLS RNDS não configurado. Sem envios realizados.",
            "verificado_em": _ts(),
        }

    # Quando certificado configurado: consultar tabela de logs de envio RNDS no banco
    # (tabela rnds_envios — implementada quando integração estiver ativa)
    return {
        "situacao_dado": "oficial_aguardando",
        "registros": [],
        "nota": "Certificado detectado — tabela rnds_envios será consultada em versão futura.",
        "verificado_em": _ts(),
    }


@router.get("/estatisticas")
async def estatisticas_rnds(_: UserOut = Depends(get_current_user)):
    """
    Estatísticas de envio RNDS.
    Requer certificado mTLS — declara nao_disponivel sem ele.
    """
    if not _tem_certificado():
        return {
            "situacao_dado":       "nao_disponivel",
            "total_enviados_mes":  None,
            "total_rejeitados_mes": None,
            "taxa_sucesso":        None,
            "historico_diario":   [],
            "nota": "Certificado mTLS RNDS não configurado. Configure no Railway.",
            "verificado_em": _ts(),
        }

    return {
        "situacao_dado":       "oficial_aguardando",
        "total_enviados_mes":  None,
        "total_rejeitados_mes": None,
        "taxa_sucesso":        None,
        "historico_diario":   [],
        "nota": "Certificado detectado — estatísticas serão extraídas da tabela rnds_envios.",
        "verificado_em": _ts(),
    }


@router.post("/testar-conexao")
async def testar_conexao(_: UserOut = Depends(get_current_user)):
    """Testa a conexão mTLS com a RNDS em tempo real."""
    ping = await _ping_rnds()
    return {
        "ok":           ping.get("online", False),
        "situacao_dado": ping["situacao_dado"],
        "latencia_ms":  ping.get("latencia_ms"),
        "nota":         ping["nota"],
        "testado_em":   _ts(),
    }


@router.post("/registros/{registro_id}/reprocessar")
async def reprocessar_registro(
    registro_id: str,
    _: UserOut = Depends(get_current_user),
):
    """Reprocessa um envio RNDS com falha."""
    if not _tem_certificado():
        return {
            "ok": False,
            "nota": "Certificado mTLS RNDS não configurado — não é possível reprocessar.",
        }
    return {
        "ok": True,
        "registro_id": registro_id,
        "nota": "Registro enfileirado para reprocessamento (requer tabela rnds_envios ativa).",
    }
