"""Utilitários compartilhados pela camada de integração PEC."""
from __future__ import annotations
import hashlib
import json

from config import settings
from services.pec.exceptions import PecIntegracaoDesativadaError


def hash_registro(dados: dict) -> str:
    """Hash de controle usado para detectar mudança de um registro sincronizado do PEC
    sem precisar comparar campo a campo (evita updates/writes desnecessários)."""
    serializado = json.dumps(dados, sort_keys=True, default=str, ensure_ascii=False)
    return hashlib.sha256(serializado.encode("utf-8")).hexdigest()


def exigir_integracao_ativa() -> None:
    """Interrompe a chamada com um erro claro em vez de simular sucesso ou cair
    silenciosamente em dado sintético. Todo serviço PEC real deve chamar isto primeiro."""
    if not settings.ESUS_INTEGRATION_ENABLED:
        raise PecIntegracaoDesativadaError(
            "ESUS_INTEGRATION_ENABLED=false — habilite e configure a integração antes de sincronizar."
        )
    if not settings.pec_configurado:
        raise PecIntegracaoDesativadaError(
            "PEC_BASE_URL / PEC_CLIENT_ID / PEC_CLIENT_SECRET ausentes — configure no Railway."
        )
