import time
from typing import Any, Dict, Optional, Tuple

_store: Dict[str, Tuple[Any, float]] = {}

def cache_get(key: str) -> Optional[Any]:
    entry = _store.get(key)
    if entry and time.time() < entry[1]:
        return entry[0]
    _store.pop(key, None)
    return None

def cache_set(key: str, value: Any, ttl: int = 900) -> None:
    _store[key] = (value, time.time() + ttl)

def cache_keys() -> list:
    return list(_store.keys())
