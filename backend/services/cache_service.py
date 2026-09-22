"""Cache em memória SEPARADO POR MUNICÍPIO.

Toda chave é prefixada com o IBGE do município da requisição corrente
(tenancy.contexto), então um município nunca lê o cache de outro.
"""
import time
from typing import Any, Dict, Optional, Tuple

from tenancy.contexto import ibge7

_store: Dict[str, Tuple[Any, float]] = {}


def _chave(key: str) -> str:
    return f"{ibge7()}:{key}"


def cache_get(key: str) -> Optional[Any]:
    k = _chave(key)
    entry = _store.get(k)
    if entry and time.time() < entry[1]:
        return entry[0]
    _store.pop(k, None)
    return None


def cache_set(key: str, value: Any, ttl: int = 900) -> None:
    _store[_chave(key)] = (value, time.time() + ttl)


def cache_keys() -> list:
    """Chaves do município corrente (sem o prefixo)."""
    prefixo = f"{ibge7()}:"
    return [k[len(prefixo):] for k in _store if k.startswith(prefixo)]
