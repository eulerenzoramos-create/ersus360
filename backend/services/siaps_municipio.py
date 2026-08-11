"""
SiapsMunicipioService — versão parametrizada por município.

Substitui siaps_service.py que tem o IBGE de Apuí hardcoded.
Aceita qualquer código IBGE (7 dígitos, ex: "1300144") e credenciais
passadas como parâmetro ou lidas de env vars no formato:
  SIAPS_CPF_{IBGE}   e   SIAPS_SENHA_{IBGE}
  SIAPS_TOKEN_{IBGE}

Fallback genérico: SIAPS_CPF / SIAPS_SENHA / SIAPS_TOKEN (Apuí legado).

O resultado inclui metadados de proveniência conforme a missão ERSUS 360.
"""
from __future__ import annotations
import logging
import os
import time
from datetime import datetime
from typing import Any

import httpx

logger = logging.getLogger(__name__)

_EGESTOR  = "https://egestorab.saude.gov.br/api/v1"
_APISIAPS = "https://apisiaps.saude.gov.br"
_GOVBR    = "https://sso.acesso.gov.br"
_DADOSAB  = "https://apidadosabertos.saude.gov.br"
_TIMEOUT  = 20

# Cache por municipio+competencia: {key: (data, timestamp)}
_cache: dict[str, tuple[Any, float]] = {}
_TTL = 1800  # 30 min

# Auth tokens por município: {ibge: {"token":..., "expira":...}}
_auth: dict[str, dict] = {}


def _ibge_curto(ibge: str) -> str:
    return ibge[:6]


def _cache_get(key: str) -> Any | None:
    entry = _cache.get(key)
    if entry and (time.time() - entry[1]) < _TTL:
        return entry[0]
    return None


def _cache_set(key: str, data: Any) -> Any:
    _cache[key] = (data, time.time())
    return data


def _credenciais(ibge: str) -> tuple[str, str, str]:
    """Retorna (cpf, senha, token) para o município. Busca env vars específicas primeiro."""
    cpf   = os.getenv(f"SIAPS_CPF_{ibge}",   os.getenv("SIAPS_CPF",   "")).strip().replace(".", "").replace("-", "")
    senha = os.getenv(f"SIAPS_SENHA_{ibge}",  os.getenv("SIAPS_SENHA", "")).strip()
    token = os.getenv(f"SIAPS_TOKEN_{ibge}",  os.getenv("SIAPS_TOKEN", "")).strip()
    return cpf, senha, token


def _auth_headers(ibge: str) -> dict:
    _, _, token = _credenciais(ibge)
    if not token:
        token = _auth.get(ibge, {}).get("token", "")
    if token:
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "ERSUS360/2.0",
        }
    return {"Accept": "application/json", "User-Agent": "ERSUS360/2.0"}


async def autenticar(ibge: str) -> bool:
    """Autentica no SIAPS para o município. Retorna True se autenticado."""
    cpf, senha, token = _credenciais(ibge)

    # Token já disponível via env var
    if token:
        _auth.setdefault(ibge, {})["token"]  = token
        _auth[ibge]["expira"] = time.time() + 3300
        return True

    if not cpf or not senha:
        return False

    # Verifica cache de auth
    cached = _auth.get(ibge, {})
    if cached.get("token") and cached.get("expira", 0) > time.time():
        return True

    async with httpx.AsyncClient(timeout=_TIMEOUT, verify=False, follow_redirects=True) as c:
        # Estratégia 1: SIAPS /api/auth/login
        try:
            r = await c.post(
                f"https://siaps.saude.gov.br/api/auth/login",
                json={"cpf": cpf, "senha": senha},
                headers={"Content-Type": "application/json"},
            )
            if r.status_code in (200, 201):
                t = (r.json() or {}).get("access_token") or (r.json() or {}).get("token")
                if t:
                    _auth[ibge] = {"token": t, "expira": time.time() + 3300}
                    return True
        except Exception:
            pass

        # Estratégia 2: gov.br OAuth2 password grant
        for client_id in ("siaps", "egestor-aps"):
            try:
                r = await c.post(
                    f"{_GOVBR}/oauth2/token",
                    data={"grant_type": "password", "username": cpf, "password": senha,
                          "scope": "openid profile email", "client_id": client_id},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                if r.status_code == 200:
                    t = r.json().get("access_token")
                    if t:
                        _auth[ibge] = {"token": t, "expira": time.time() + int(r.json().get("expires_in", 3300))}
                        return True
            except Exception:
                pass

    logger.warning("SIAPS: autenticação falhou para município IBGE=%s", ibge)
    return False


def _proveniencia(
    ibge: str,
    fonte: str,
    metodo: str,
    sucesso: bool,
    competencia: str,
    url: str | None = None,
    erro: str | None = None,
) -> dict:
    return {
        "municipio_ibge": ibge,
        "fonte_sistema": fonte,
        "metodo": metodo,
        "competencia": competencia,
        "sucesso": sucesso,
        "url_consultada": url,
        "erro": erro,
        "consultado_em": datetime.utcnow().isoformat(),
        "situacao": (
            "oficial_validado" if sucesso
            else "nao_disponivel"
        ),
    }


async def _get(ibge: str, url: str, params: dict | None = None) -> Any | None:
    hdrs = _auth_headers(ibge)
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, verify=False, follow_redirects=True) as c:
            r = await c.get(url, params=params or {}, headers=hdrs)
            if r.status_code == 401:
                _auth.pop(ibge, None)
            if r.status_code == 200:
                try:
                    return r.json()
                except Exception:
                    return None
    except Exception as exc:
        logger.debug("SIAPS GET %s → %s", url, exc)
    return None


def _parse_vinculo(raw: Any) -> list[dict] | None:
    if not raw:
        return None
    if isinstance(raw, list) and raw and isinstance(raw[0], dict):
        items = raw
    elif isinstance(raw, dict):
        for k in ("equipes", "data", "items", "results", "content"):
            if isinstance(raw.get(k), list):
                items = raw[k]
                break
        else:
            return None
    else:
        return None

    equipes = []
    for e in items:
        if not isinstance(e, dict):
            continue
        vinculadas   = int(e.get("pessoasVinculadas") or e.get("K") or e.get("vinculadas") or 0)
        acompanhadas = int(e.get("pessoasAcompanhadas") or e.get("H") or e.get("acompanhadas") or 0)
        pontuacao    = float(e.get("pontuacao") or e.get("nota") or e.get("score") or 0)
        equipes.append({
            "equipe":    (e.get("nomeEquipe") or e.get("nome") or e.get("equipe") or "").upper(),
            "ubs":       (e.get("nomeUbs") or e.get("ubs") or e.get("estabelecimento") or "").upper(),
            "ine":       str(e.get("ine") or e.get("co_equipe") or ""),
            "cnes":      str(e.get("cnes") or e.get("co_unidade") or ""),
            "tipo":      e.get("tipo") or e.get("tipoEquipe") or "eSF",
            "parametro": int(e.get("parametro") or e.get("param") or 2500),
            "K": vinculadas,
            "H": acompanhadas,
            "A": int(e.get("A") or 0), "B": int(e.get("B") or 0),
            "C": int(e.get("C") or 0), "D": int(e.get("D") or 0),
            "E": int(e.get("E") or 0), "F": int(e.get("F") or 0),
            "G": int(e.get("G") or 0), "I": int(e.get("I") or 0),
            "J": int(e.get("J") or 0),
            "pontuacao": round(pontuacao, 2),
            "situacao_dado": "oficial_validado",
            "fonte": "siaps_api",
        })
    return equipes or None


async def buscar_vinculo(ibge: str, competencia: str = "202605") -> dict:
    """
    Busca dados do Componente Vínculo e Acompanhamento Territorial.
    Retorna dict com: equipes, proveniencia, situacao_dado.
    """
    cache_key = f"vinculo_{ibge}_{competencia}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    await autenticar(ibge)

    ibge_curto = _ibge_curto(ibge)
    ano  = int(competencia[:4])
    mes  = int(competencia[4:])
    quad = 1 if mes <= 4 else (2 if mes <= 8 else 3)

    tentativas = [
        (f"{_APISIAPS}/componente/cvat/visao-por-competencia",
         {"coMunicipioIbge": ibge, "tiposEquipe": "eSF,eAP", "stEquipeHomologada": "S",
          "nuMes": mes, "nuAno": ano, "nivelVisualizacao": "equipe"}),
        (f"{_APISIAPS}/componente/cvat/visao-por-equipe",
         {"coMunicipioIbge": ibge, "tiposEquipe": "eSF,eAP", "nuMes": mes, "nuAno": ano}),
        (f"{_APISIAPS}/api/componente/equipe",
         {"coMunicipioIbge": ibge, "nuQuadrimestre": quad, "nuAno": ano, "coTipoIndicador": "VINCULO"}),
        (f"{_APISIAPS}/api/componente/vinculo/municipio/{ibge}/equipe",
         {"nuQuadrimestre": quad, "nuAno": ano}),
        (f"{_APISIAPS}/api/public/componente/indicador-quadrimestre",
         {"coMunicipioIbge": ibge, "nuQuadrimestre": quad, "coTipoIndicador": "VINCULO", "size": 20}),
        (f"{_EGESTOR}/relatorio/municipio/{ibge}/componenteVinculo",
         {"competencia": competencia}),
        (f"{_DADOSAB}/siaps/componentes/vinculo",
         {"ibge": ibge, "competencia": competencia}),
    ]

    ultimo_erro = None
    for url, params in tentativas:
        raw = await _get(ibge, url, params)
        equipes = _parse_vinculo(raw)
        if equipes:
            logger.info("SIAPS vínculo OK — ibge=%s url=%s → %d equipes", ibge, url, len(equipes))
            result = {
                "equipes": equipes,
                "proveniencia": _proveniencia(ibge, "SIAPS", "api_autenticada", True, competencia, url),
                "situacao_dado": "oficial_validado",
                "fonte": "siaps_api",
            }
            return _cache_set(cache_key, result)

    logger.warning("SIAPS vínculo — ibge=%s: todas as %d tentativas falharam", ibge, len(tentativas))
    return {
        "equipes": None,
        "proveniencia": _proveniencia(
            ibge, "SIAPS", "api_autenticada", False, competencia,
            erro="Todas as URLs tentadas retornaram erro ou vazio."
        ),
        "situacao_dado": "nao_disponivel",
        "fonte": "indisponivel",
        "mensagem": (
            "Dado não validado — SIAPS indisponível ou credenciais não configuradas. "
            f"Configure SIAPS_CPF_{ibge} e SIAPS_SENHA_{ibge} no Railway."
        ),
    }


async def buscar_qualidade(ibge: str, competencia: str = "202605") -> dict:
    """
    Busca dados do Componente Qualidade (15 indicadores, Portaria 3.493/2024).
    """
    cache_key = f"qualidade_{ibge}_{competencia}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    await autenticar(ibge)

    ano  = int(competencia[:4])
    mes  = int(competencia[4:])
    quad = 1 if mes <= 4 else (2 if mes <= 8 else 3)

    tentativas = [
        (f"{_APISIAPS}/componente/cq/visao-por-competencia",
         {"coMunicipioIbge": ibge, "tiposEquipe": "eSF,eAP", "nuMes": mes, "nuAno": ano, "nivelVisualizacao": "equipe"}),
        (f"{_APISIAPS}/componente/qualidade/visao-por-competencia",
         {"coMunicipioIbge": ibge, "tiposEquipe": "eSF,eAP", "nuMes": mes, "nuAno": ano}),
        (f"{_APISIAPS}/api/componente/equipe",
         {"coMunicipioIbge": ibge, "nuQuadrimestre": quad, "nuAno": ano, "coTipoIndicador": "QUALIDADE"}),
        (f"{_APISIAPS}/api/public/componente/indicador-quadrimestre",
         {"coMunicipioIbge": ibge, "nuQuadrimestre": quad, "coTipoIndicador": "QUALIDADE", "size": 20}),
        (f"{_EGESTOR}/relatorio/municipio/{ibge}/componenteQualidade",
         {"competencia": competencia}),
    ]

    for url, params in tentativas:
        raw = await _get(ibge, url, params)
        if raw:
            equipes = _parse_qualidade(raw)
            if equipes:
                result = {
                    "equipes": equipes,
                    "proveniencia": _proveniencia(ibge, "SIAPS", "api_autenticada", True, competencia, url),
                    "situacao_dado": "oficial_validado",
                }
                return _cache_set(cache_key, result)

    return {
        "equipes": None,
        "proveniencia": _proveniencia(ibge, "SIAPS", "api_autenticada", False, competencia,
                                      erro="Todas as URLs falharam."),
        "situacao_dado": "nao_disponivel",
        "mensagem": f"Dado não validado — SIAPS indisponível para IBGE {ibge}.",
    }


def _parse_qualidade(raw: Any) -> list[dict] | None:
    if not raw:
        return None
    if isinstance(raw, list) and raw and isinstance(raw[0], dict):
        items = raw
    elif isinstance(raw, dict):
        for k in ("equipes", "data", "items", "results", "content"):
            if isinstance(raw.get(k), list):
                items = raw[k]
                break
        else:
            return None
    else:
        return None

    equipes = []
    for e in items:
        if not isinstance(e, dict):
            continue
        pontuacao = float(e.get("pontuacao") or e.get("nota") or e.get("score") or 0)
        equipes.append({
            "equipe":    (e.get("nomeEquipe") or e.get("nome") or e.get("equipe") or "").upper(),
            "ubs":       (e.get("nomeUbs") or e.get("ubs") or "").upper(),
            "ine":       str(e.get("ine") or e.get("co_equipe") or ""),
            "cnes":      str(e.get("cnes") or e.get("co_unidade") or ""),
            "pontuacao_qualidade": round(pontuacao, 2),
            "indicadores_api": e.get("indicadores") or {},
            "situacao_dado": "oficial_validado",
            "fonte": "siaps_api",
        })
    return equipes or None


def limpar_cache(ibge: str | None = None) -> None:
    """Limpa cache de um município ou de todos."""
    if ibge:
        keys = [k for k in _cache if k.endswith(f"_{ibge}_") or f"_{ibge}_" in k]
    else:
        keys = list(_cache.keys())
    for k in keys:
        _cache.pop(k, None)
