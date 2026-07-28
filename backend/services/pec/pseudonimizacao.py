"""Pseudonimização de CNS/CPF antes de gravar no cache local (LGPD).

Nunca gravar CNS/CPF em texto puro nas tabelas pec_cidadaos / pec_profissionais_saude.
`hash_documento` gera a chave de deduplicação; `mascarar_documento` gera o valor
seguro para exibição em tela/relatório.
"""
from __future__ import annotations
import hashlib
import re

from config import settings


def _somente_digitos(valor: str) -> str:
    return re.sub(r"\D", "", valor or "")


def hash_documento(valor: str) -> str:
    """SHA-256 do documento normalizado, salgado com SECRET_KEY — chave de deduplicação, não reversível."""
    normalizado = _somente_digitos(valor)
    salgado = f"{settings.SECRET_KEY}:{normalizado}".encode("utf-8")
    return hashlib.sha256(salgado).hexdigest()


def mascarar_documento(valor: str, digitos_visiveis: int = 4) -> str:
    """Mantém apenas os últimos N dígitos visíveis para exibição (ex.: CNS -> '***.****.**12.3456')."""
    normalizado = _somente_digitos(valor)
    if not normalizado:
        return "*" * digitos_visiveis
    visivel = normalizado[-digitos_visiveis:]
    return f"{'*' * max(len(normalizado) - digitos_visiveis, 0)}{visivel}"
