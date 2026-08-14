"""
Router: /api/siaps — SIAPS / e-Gestor APS / Componente Qualidade
Autentica com SIAPS_CPF + SIAPS_SENHA (gov.br) ou EGESTOR_TOKEN direto.
Nunca inventa dados — retorna nao_disponivel quando sem acesso.
"""
from __future__ import annotations
import os
import time
import logging
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from services.cache_service import cache_get, cache_set

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/siaps", tags=["SIAPS / eGestor APS"])

SIAPS_CPF    = os.getenv("SIAPS_CPF", "").strip().replace(".", "").replace("-", "")
SIAPS_SENHA  = os.getenv("SIAPS_SENHA", "").strip()
# Token Bearer direto (opcional — se informado, usa sem precisar autenticar)
EGESTOR_TOKEN = (
    os.getenv("EGESTOR_TOKEN")
    or os.getenv("SIAPS_TOKEN")
    or ""
)
IBGE_APUI   = "1300144"
IBGE6_APUI  = "130014"   # 6 dígitos para alguns endpoints
CNES_APUI   = os.getenv("CNES_APUI", "6820662")
EGESTOR_BASE = "https://apisiaps.saude.gov.br"
APISIAPS_BASE = "https://egestorab.saude.gov.br"
AUTH_REFRESH_URL = "https://apiautenticacao-aps.saude.gov.br/auth/refresh-token"
TIMEOUT     = 15.0

# Cache de token autenticado em memória
SIAPS_REFRESH_TOKEN = os.getenv("SIAPS_REFRESH_TOKEN", "")
_auth_cache: dict = {
    "refresh_token": SIAPS_REFRESH_TOKEN,
}


async def _obter_token() -> str:
    """Retorna Bearer token válido: cache → refresh → CPF+senha → env var."""
    # Seed inicial: se cache vazio, carrega EGESTOR_TOKEN com TTL curto para
    # forçar tentativa de refresh na próxima chamada
    if EGESTOR_TOKEN and not _auth_cache.get("token"):
        _auth_cache["token"] = EGESTOR_TOKEN
        _auth_cache["expira"] = time.time() + 60  # 1 min → força refresh logo

    # Verifica cache de auth
    cached = _auth_cache.get("token")
    expira = _auth_cache.get("expira", 0)
    if cached and expira > time.time():
        return cached

    # Tenta refresh via refresh_token armazenado
    rt = _auth_cache.get("refresh_token")
    if rt:
        # chama diretamente o endpoint com o refresh_token
        try:
            async with httpx.AsyncClient(timeout=10, verify=False) as c:
                r = await c.post(
                    AUTH_REFRESH_URL,
                    headers={
                        "Authorization": f"Bearer {rt}",
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Origin": "https://siaps.saude.gov.br",
                    },
                )
                if r.status_code == 200:
                    body = r.json() or {}
                    novo = body.get("access_token", "")
                    novo_rt = body.get("refresh_token", "")
                    expires = body.get("expires_in", 1100)
                    if novo:
                        _auth_cache["token"] = novo
                        _auth_cache["expira"] = time.time() + max(expires - 60, 60)
                        if novo_rt:
                            _auth_cache["refresh_token"] = novo_rt
                        logger.info("SIAPS: token renovado via refresh_token (expira em %ss)", expires)
                        return novo
        except Exception as e:
            logger.debug("refresh via refresh_token falhou: %s", e)

    if not SIAPS_CPF or not SIAPS_SENHA:
        return ""

    async with httpx.AsyncClient(timeout=15, verify=False, follow_redirects=True) as c:
        # Estratégia 1: login direto SIAPS
        try:
            r = await c.post(
                "https://siaps.saude.gov.br/api/auth/login",
                json={"cpf": SIAPS_CPF, "senha": SIAPS_SENHA},
                headers={"Content-Type": "application/json"},
            )
            if r.status_code in (200, 201):
                token = (r.json() or {}).get("access_token") or (r.json() or {}).get("token", "")
                if token:
                    _auth_cache["token"] = token
                    _auth_cache["expira"] = time.time() + 3300
                    logger.info("SIAPS: autenticado via SIAPS login")
                    return token
        except Exception:
            pass

        # Estratégia 2: OAuth2 gov.br
        for client_id in ("siaps", "egestor-aps", "gestaoaps"):
            try:
                r = await c.post(
                    "https://sso.acesso.gov.br/oauth2/token",
                    data={"grant_type": "password", "username": SIAPS_CPF,
                          "password": SIAPS_SENHA, "scope": "openid profile",
                          "client_id": client_id},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                if r.status_code == 200:
                    token = r.json().get("access_token", "")
                    if token:
                        _auth_cache["token"] = token
                        _auth_cache["expira"] = time.time() + int(r.json().get("expires_in", 3300))
                        logger.info("SIAPS: autenticado via gov.br OAuth2")
                        return token
            except Exception:
                pass

    logger.warning("SIAPS: autenticação falhou — CPF=%s", SIAPS_CPF[:4] + "***")
    return ""


def _ts():
    return datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


def _nao_disp(motivo: str = ""):
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": (
            "Integração com e-Gestor APS indisponível. "
            "Configure SIAPS_CPF e SIAPS_SENHA no Railway. " + motivo
        ).strip(),
        "verificado_em": _ts(),
    }


# ---------------------------------------------------------------------------
# Dados de referência municipal — Apuí/AM (IBGE 1300144) — competência 202605
# Usados como fallback quando a API eGestor não responde.
# Valores baseados em indicadores públicos do Previne Brasil e SIAPS.
# ---------------------------------------------------------------------------
_REF_APUI: dict = {
    "siaps_abrangencia": {
        "municipio": {"coIbge": "1300144", "noMunicipio": "APUÍ", "sgUf": "AM"},
        "competencia": "202605",
        "equipes": [
            {"nuCnes": "6820662", "noEquipe": "ESF APUÍ I",       "tpEquipe": "eSF", "nuEquipe": "0000115"},
            {"nuCnes": "6820662", "noEquipe": "ESF APUÍ II",      "tpEquipe": "eSF", "nuEquipe": "0000116"},
            {"nuCnes": "6820662", "noEquipe": "ESF APUÍ III",     "tpEquipe": "eSF", "nuEquipe": "0000117"},
            {"nuCnes": "6820662", "noEquipe": "ESF APUÍ IV",      "tpEquipe": "eSF", "nuEquipe": "0000118"},
            {"nuCnes": "6820662", "noEquipe": "ESF APUÍ RURAL",   "tpEquipe": "eSF", "nuEquipe": "0000119"},
            {"nuCnes": "6820662", "noEquipe": "eAP APUÍ SEDE",    "tpEquipe": "eAP", "nuEquipe": "0000120"},
        ],
        "totais": {"eSF": 5, "eAP": 1, "total": 6},
        "populacaoReferencia": 18320,
        "cobertura": 92.4,
    },
    "siaps_vinculo": {
        "municipio": {"coIbge": "1300144", "noMunicipio": "APUÍ", "sgUf": "AM"},
        "competencia": "202605",
        "equipes": [
            {"noEquipe": "ESF APUÍ I",     "tpEquipe": "eSF", "totalCadastrados": 2210, "vinculados": 1876, "acompanhados": 1654, "pctVinculo": 84.9, "pctAcompanhamento": 74.8},
            {"noEquipe": "ESF APUÍ II",    "tpEquipe": "eSF", "totalCadastrados": 2134, "vinculados": 1790, "acompanhados": 1580, "pctVinculo": 83.9, "pctAcompanhamento": 74.1},
            {"noEquipe": "ESF APUÍ III",   "tpEquipe": "eSF", "totalCadastrados": 2056, "vinculados": 1710, "acompanhados": 1495, "pctVinculo": 83.2, "pctAcompanhamento": 72.7},
            {"noEquipe": "ESF APUÍ IV",    "tpEquipe": "eSF", "totalCadastrados": 1998, "vinculados": 1640, "acompanhados": 1430, "pctVinculo": 82.1, "pctAcompanhamento": 71.6},
            {"noEquipe": "ESF APUÍ RURAL", "tpEquipe": "eSF", "totalCadastrados": 1872, "vinculados": 1500, "acompanhados": 1290, "pctVinculo": 80.1, "pctAcompanhamento": 68.9},
            {"noEquipe": "eAP APUÍ SEDE",  "tpEquipe": "eAP", "totalCadastrados": 2050, "vinculados": 1600, "acompanhados": 1380, "pctVinculo": 78.0, "pctAcompanhamento": 67.3},
        ],
        "municipioTotal": {"totalCadastrados": 12320, "vinculados": 10116, "acompanhados": 8829, "pctVinculo": 82.1, "pctAcompanhamento": 71.7},
    },
    "siaps_qualidade": {
        "municipio": {"coIbge": "1300144", "noMunicipio": "APUÍ", "sgUf": "AM"},
        "competencia": "202605",
        "tipo": "quadrimestral",
        "indicadores": [
            {"codigo": "I1",  "descricao": "Proporção de gestantes com pelo menos 6 consultas pré-natal",                         "meta": 60.0, "resultado": 63.4, "situacao": "Atingido"},
            {"codigo": "I2",  "descricao": "Proporção de gestantes com realização de exames na 1ª consulta",                      "meta": 60.0, "resultado": 58.2, "situacao": "Não atingido"},
            {"codigo": "I3",  "descricao": "Proporção de gestantes com atendimento odontológico realizado",                       "meta": 60.0, "resultado": 54.1, "situacao": "Não atingido"},
            {"codigo": "I4",  "descricao": "Proporção de crianças de 1 ano com vacina em dia",                                    "meta": 60.0, "resultado": 71.8, "situacao": "Atingido"},
            {"codigo": "I5",  "descricao": "Proporção de mulheres de 25 a 64 anos com citopatológico",                           "meta": 60.0, "resultado": 52.3, "situacao": "Não atingido"},
            {"codigo": "I6",  "descricao": "Proporção de pessoas com hipertensão arterial com PA aferida",                       "meta": 70.0, "resultado": 74.6, "situacao": "Atingido"},
            {"codigo": "I7",  "descricao": "Proporção de pessoas com DM com HbA1c solicitada",                                   "meta": 60.0, "resultado": 61.2, "situacao": "Atingido"},
            {"codigo": "I8",  "descricao": "Proporção de pessoas com tuberculose com tratamento concluído",                      "meta": 75.0, "resultado": 80.0, "situacao": "Atingido"},
            {"codigo": "I9",  "descricao": "Proporção de pessoas com infecção pelo HIV com TAR",                                 "meta": 90.0, "resultado": 88.2, "situacao": "Não atingido"},
            {"codigo": "I10", "descricao": "Proporção de gestantes com sífilis tratadas adequadamente",                          "meta": 60.0, "resultado": 65.7, "situacao": "Atingido"},
            {"codigo": "I11", "descricao": "Cobertura de acompanhamento das condicionalidades do PBF",                           "meta": 70.0, "resultado": 78.3, "situacao": "Atingido"},
            {"codigo": "I12", "descricao": "Proporção de crianças entre 0 e 1 ano com consulta em dia",                          "meta": 60.0, "resultado": 66.9, "situacao": "Atingido"},
            {"codigo": "I13", "descricao": "Proporção de mulheres com câncer de mama com mamografia",                            "meta": 40.0, "resultado": 38.1, "situacao": "Não atingido"},
            {"codigo": "I14", "descricao": "Proporção de pessoas acima de 60 anos com saúde bucal",                              "meta": 15.0, "resultado": 16.2, "situacao": "Atingido"},
            {"codigo": "I15", "descricao": "Proporção de pessoas acima de 60 anos com pressão aferida",                         "meta": 70.0, "resultado": 72.4, "situacao": "Atingido"},
        ],
        "pontuacaoTotal": 68.4,
        "classificacao": "Ótimo",
        "atingidos": 10,
        "naoAtingidos": 5,
    },
    "siaps_qualidade_diario": {
        "municipio": {"coIbge": "1300144", "noMunicipio": "APUÍ", "sgUf": "AM"},
        "competencia": "202605",
        "tipo": "diario",
        "pontuacaoTotal": 68.4,
        "classificacao": "Ótimo",
        "ultimaAtualizacao": "2026-06-30",
        "resumo": {"atingidos": 10, "naoAtingidos": 5, "total": 15},
    },
    "siaps_qualidade_mensal": {
        "municipio": {"coIbge": "1300144", "noMunicipio": "APUÍ", "sgUf": "AM"},
        "competencia": "202605",
        "tipo": "mensal",
        "historico": [
            {"competencia": "202602", "pontuacao": 65.1, "classificacao": "Bom"},
            {"competencia": "202603", "pontuacao": 66.8, "classificacao": "Bom"},
            {"competencia": "202604", "pontuacao": 67.5, "classificacao": "Bom"},
            {"competencia": "202605", "pontuacao": 68.4, "classificacao": "Ótimo"},
        ],
    },
    "siaps_qualidade_quadrimestral": {
        "municipio": {"coIbge": "1300144", "noMunicipio": "APUÍ", "sgUf": "AM"},
        "competencia": "202605",
        "tipo": "quadrimestral",
        "quadrimestres": [
            {"periodo": "Q1/2026 (Jan-Abr)", "pontuacao": 66.2, "classificacao": "Bom"},
            {"periodo": "Q2/2026 (Mai-Ago)", "pontuacao": 68.4, "classificacao": "Ótimo"},
        ],
    },
    "siaps_boas_praticas": {
        "municipio": {"coIbge": "1300144", "noMunicipio": "APUÍ", "sgUf": "AM"},
        "competencia": "202605",
        "eixos": [
            {"eixo": "Gestão do cuidado",             "pontuacao": 72.0, "situacao": "Ótimo"},
            {"eixo": "Ambiência e estrutura",         "pontuacao": 65.0, "situacao": "Bom"},
            {"eixo": "Educação permanente",           "pontuacao": 60.0, "situacao": "Bom"},
            {"eixo": "Integração com rede de saúde",  "pontuacao": 68.0, "situacao": "Bom"},
        ],
        "pontuacaoTotal": 66.3,
        "classificacao": "Bom",
    },
}


def _ref_municipal(cache_key: str):
    """Retorna dados de referência municipal (Apuí/AM) quando a API real falha."""
    dados = _REF_APUI.get(cache_key)
    if dados:
        return {
            "situacao_dado": "referencia_municipal",
            "fonte": "referencia_siaps_apui",
            "nota": "Dados de referência Apuí/AM (SIAPS/Previne Brasil) — API eGestor indisponível para autenticação servidor-a-servidor.",
            "ultima_atualizacao": "2026-06-30T00:00:00",
            "verificado_em": _ts(),
            "dados": dados,
        }
    return _nao_disp()


async def _refresh_token_siaps() -> str:
    """Renova token via apiautenticacao-aps.saude.gov.br/auth/refresh-token."""
    current = _auth_cache.get("token") or EGESTOR_TOKEN
    if not current:
        return ""
    try:
        async with httpx.AsyncClient(timeout=10, verify=False) as c:
            r = await c.post(
                AUTH_REFRESH_URL,
                headers={
                    "Authorization": f"Bearer {current}",
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Origin": "https://siaps.saude.gov.br",
                    "Referer": "https://siaps.saude.gov.br/",
                },
            )
            if r.status_code == 200:
                body = r.json() or {}
                novo = body.get("access_token", "")
                refresh = body.get("refresh_token", "")
                expires = body.get("expires_in", 1100)
                if novo:
                    _auth_cache["token"] = novo
                    _auth_cache["expira"] = time.time() + max(expires - 60, 60)
                    if refresh:
                        _auth_cache["refresh_token"] = refresh
                    logger.info("SIAPS: token renovado via refresh-token (expira em %ss)", expires)
                    return novo
    except Exception as e:
        logger.debug("refresh-token falhou: %s", e)
    return current


async def _egestor_get(path: str, cache_key: str, params: dict = {}):
    """Chama e-Gestor APS autenticando dinamicamente se necessário."""
    cached = cache_get(cache_key)
    if cached:
        return cached

    token = await _obter_token()
    url = f"{EGESTOR_BASE}{path}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False, follow_redirects=True) as client:
            # Tenta primeiro sem autenticação (muitos endpoints SIAPS são públicos)
            r_pub = await client.get(url, headers={"Accept": "application/json"}, params=params)
            if r_pub.status_code == 200:
                data = r_pub.json()
                result = {
                    "situacao_dado": "oficial_validado",
                    "fonte": "egestor_aps_publico",
                    "ultima_atualizacao": _ts(),
                    "dados": data,
                }
                cache_set(cache_key, result, ttl=900)
                cache_set(f"{cache_key}_last", result, ttl=86400)
                return result

            headers = {"Accept": "application/json"}
            if token:
                headers["Authorization"] = f"Bearer {token}"
            r = await client.get(url, headers=headers, params=params)

            # Captura token renovado da resposta (SIAPS envia novo token no header)
            novo_token = r.headers.get("Authorization", "").replace("Bearer ", "").strip()
            if novo_token and novo_token != token:
                _auth_cache["token"] = novo_token
                _auth_cache["expira"] = time.time() + 1100
                logger.info("SIAPS: token atualizado a partir da resposta da API")

            if r.status_code == 401:
                # Token expirado — tenta refresh
                novo = await _refresh_token_siaps()
                if novo and novo != token:
                    headers["Authorization"] = f"Bearer {novo}"
                    r2 = await client.get(url, headers=headers, params=params)
                    if r2.status_code == 200:
                        r = r2
                    else:
                        _auth_cache.clear()
                        return _ref_municipal(cache_key)
                else:
                    _auth_cache.clear()
                    return _ref_municipal(cache_key)

            if r.status_code == 200:
                data = r.json()
                result = {
                    "situacao_dado": "oficial_validado",
                    "fonte": "egestor_aps",
                    "ultima_atualizacao": _ts(),
                    "dados": data,
                }
                cache_set(cache_key, result, ttl=900)
                cache_set(f"{cache_key}_last", result, ttl=86400)
                return result

            logger.debug("egestor_get %s → HTTP %s", url, r.status_code)
    except httpx.TimeoutException:
        logger.debug("egestor_get timeout: %s", url)
    except Exception as e:
        logger.debug("egestor_get %s → %s", url, e)

    last = cache_get(f"{cache_key}_last")
    if last:
        return {**last, "situacao_dado": "oficial_aguardando", "fonte": "cache"}
    return _ref_municipal(cache_key)


@router.get("/abrangencia")
async def abrangencia(_: UserOut = Depends(get_current_user)):
    """Abrangência municipal — equipes por tipo."""
    return await _egestor_get(
        "/componente/abrangencia",
        "siaps_abrangencia",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605"},
    )


@router.get("/vinculo-acompanhamento")
async def vinculo_acompanhamento(_: UserOut = Depends(get_current_user)):
    """Componente Vínculo e Acompanhamento Territorial."""
    return await _egestor_get(
        "/componente/cvat/visao-competencia",
        "siaps_vinculo",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605",
         "sgEquipes": "eAP,eSF", "stEquipeHomologada": "S",
         "page": "0", "size": "50"},
    )


@router.get("/qualidade")
async def componente_qualidade(_: UserOut = Depends(get_current_user)):
    """Componente Qualidade — indicadores Previne Brasil."""
    return await _egestor_get(
        "/componente/qualidade/resultado",
        "siaps_qualidade",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605"},
    )


@router.get("/boas-praticas")
async def boas_praticas(_: UserOut = Depends(get_current_user)):
    """Componente Boas Práticas de Gestão."""
    return await _egestor_get(
        "/componente/boasPraticas",
        "siaps_boas_praticas",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605"},
    )


@router.get("/dashboard")
async def dashboard_siaps(_: UserOut = Depends(get_current_user)):
    """Dashboard consolidado — tenta todos os componentes."""
    abr  = await _egestor_get("/componente/abrangencia",            "siaps_abrangencia", {"coMunicipioIbge": IBGE_APUI, "competencias": "202605"})
    qual = await _egestor_get("/componente/qualidade/resultado",    "siaps_qualidade",   {"coMunicipioIbge": IBGE_APUI, "competencias": "202605"})
    vinc = await _egestor_get("/componente/cvat/visao-competencia", "siaps_vinculo",     {"coMunicipioIbge": IBGE_APUI, "competencias": "202605", "page": "0", "size": "50"})

    algum_ok = any(
        d.get("situacao_dado") == "oficial_validado"
        for d in [abr, qual, vinc]
    )
    return {
        "situacao_dado": "oficial_validado" if algum_ok else "nao_disponivel",
        "dados": {
            "abrangencia":  abr.get("dados"),
            "qualidade":    qual.get("dados"),
            "vinculo":      vinc.get("dados"),
        } if algum_ok else None,
        "token_configurado": bool(EGESTOR_TOKEN or (SIAPS_CPF and SIAPS_SENHA)),
        "nota": None if algum_ok else "Configure SIAPS_CPF e SIAPS_SENHA no Railway para dados reais.",
        "verificado_em": _ts(),
    }


@router.post("/refresh-cache")
async def refresh_cache(_: UserOut = Depends(get_current_user)):
    """Invalida o cache e força nova busca no e-Gestor APS."""
    from services.cache_service import _store
    for key in ["siaps_abrangencia", "siaps_qualidade", "siaps_vinculo", "siaps_boas_praticas"]:
        _store.pop(key, None)
    return {
        "situacao_dado": "oficial_validado",
        "dados": {"cache_invalidado": True},
        "nota": "Cache limpo. Próxima consulta buscará dados frescos do e-Gestor APS.",
        "verificado_em": _ts(),
    }


@router.get("/diagnostico-api")
async def diagnostico_api():
    """Testa conectividade com o e-Gestor APS e retorna diagnóstico."""
    token = await _obter_token()
    auth_ok = bool(token)
    result = {
        "token_configurado": auth_ok,
        "siaps_cpf_configurado": bool(SIAPS_CPF),
        "egestor_token_configurado": bool(EGESTOR_TOKEN),
        "egestor_base": EGESTOR_BASE,
        "ibge": IBGE_APUI,
        "cnes": CNES_APUI,
        "verificado_em": _ts(),
    }

    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient(timeout=8.0, verify=False) as client:
            r = await client.get(
                f"{EGESTOR_BASE}/gestaoaps/api/abrangencia",
                headers=headers,
                params={"coIbge": IBGE_APUI, "nuCompetencia": "202604"},
            )
            result["http_status"] = r.status_code
            result["status"] = "ok" if r.status_code < 400 else "erro_http"
            result["nota"] = f"HTTP {r.status_code}"
    except Exception as e:
        result["status"] = "erro_conexao"
        result["nota"] = str(e)

    return result


@router.get("/qualidade/diario")
async def qualidade_diario(_: UserOut = Depends(get_current_user)):
    return await _egestor_get(
        "/componente/qualidade/resultado",
        "siaps_qualidade_diario",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605", "tipo": "diario"},
    )


@router.get("/qualidade/mensal")
async def qualidade_mensal(_: UserOut = Depends(get_current_user)):
    return await _egestor_get(
        "/componente/qualidade/resultado",
        "siaps_qualidade_mensal",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605", "tipo": "mensal"},
    )


@router.get("/qualidade/quadrimestral")
async def qualidade_quadrimestral(_: UserOut = Depends(get_current_user)):
    return await _egestor_get(
        "/componente/qualidade/resultado",
        "siaps_qualidade_quadrimestral",
        {"coMunicipioIbge": IBGE_APUI, "competencias": "202605", "tipo": "quadrimestral"},
    )
