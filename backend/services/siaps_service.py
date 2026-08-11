"""
SIAPS Service — Integração com eGestor APS / SISAB / SIAPS
Busca dados reais do Componente Qualidade e Vínculo e Acompanhamento.

Estratégia de autenticação em cascata:
  1. Token Bearer via gov.br OAuth2 (SIAPS_CPF + SIAPS_SENHA no Railway)
  2. Session cookie via login direto no SIAPS
  3. eGestor APS API sem autenticação (dados públicos)
  4. Fallback: dados de referência Mai/2026 hardcoded

Credenciais necessárias no Railway:
  SIAPS_CPF   — CPF sem pontos/traços (ex: 12345678901)
  SIAPS_SENHA — Senha gov.br
"""
from __future__ import annotations
import logging
import time
from typing import Any

import httpx
from config import settings

logger = logging.getLogger(__name__)

_IBGE       = settings.FNS_MUNICIPIO_IBGE   # "1300144"
_IBGE_CURTO = _IBGE[:6]                     # "130014"
_EGESTOR    = "https://egestorab.saude.gov.br/api/v1"
_SISAB      = "https://sisab.saude.gov.br"
_DADOSAB    = "https://apidadosabertos.saude.gov.br"
_SIAPS      = "https://siaps.saude.gov.br"
_APISIAPS   = "https://apisiaps.saude.gov.br"   # API pública real do SIAPS
_GOVBR_SSO  = "https://sso.acesso.gov.br"
_TIMEOUT    = 20

# ── Cache em memória ──────────────────────────────────────────────────────────
_cache: dict[str, tuple[Any, float]] = {}
_TTL = 1800  # 30 minutos

# ── Auth token cache ──────────────────────────────────────────────────────────
_auth: dict[str, Any] = {}   # {"token": str, "cookies": dict, "expira": float}


def _cached(key: str, data: Any) -> Any:
    _cache[key] = (data, time.time())
    return data


def _from_cache(key: str) -> Any | None:
    entry = _cache.get(key)
    if entry and (time.time() - entry[1]) < _TTL:
        return entry[0]
    return None


def _auth_headers() -> dict:
    # Prioridade: SIAPS_TOKEN do Railway > token obtido via auth dinâmica
    token = (settings.SIAPS_TOKEN or "").strip() or _auth.get("token")
    if token:
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 ERSUS360/2.0",
        }
    return {
        "Accept": "application/json",
        "User-Agent": "ERSUS360/2.0 FMS-Apui-AM",
    }


def _auth_cookies() -> dict:
    return _auth.get("cookies") or {}


async def _autenticar() -> bool:
    """
    Tenta autenticar no SIAPS/gov.br via CPF+senha (Railway env vars).
    Estratégia 1: Bearer token via /api/auth/login do SIAPS
    Estratégia 2: Bearer token via gov.br OAuth2 password grant
    Estratégia 3: Session cookie via form login gov.br
    Retorna True se alguma estratégia funcionou.
    """
    cpf   = (settings.SIAPS_CPF or "").strip().replace(".", "").replace("-", "")
    senha = (settings.SIAPS_SENHA or "").strip()

    if not cpf or not senha:
        logger.debug("SIAPS auth: SIAPS_CPF/SIAPS_SENHA não configurados")
        return False

    # Verifica se ainda temos token válido (expira em 55 min)
    if _auth.get("token") and _auth.get("expira", 0) > time.time():
        return True
    if _auth.get("cookies") and _auth.get("expira", 0) > time.time():
        return True

    async with httpx.AsyncClient(timeout=_TIMEOUT, verify=False, follow_redirects=True) as c:

        # ── Estratégia 1: SIAPS /api/auth/login ──────────────────────────────
        try:
            r = await c.post(
                f"{_SIAPS}/api/auth/login",
                json={"cpf": cpf, "senha": senha},
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
            if r.status_code in (200, 201):
                data = r.json()
                token = data.get("access_token") or data.get("token") or data.get("jwt")
                if token:
                    _auth["token"]  = token
                    _auth["expira"] = time.time() + 3300  # 55 min
                    logger.info("SIAPS auth: token via /api/auth/login OK")
                    return True
        except Exception as e:
            logger.debug("SIAPS auth estratégia 1 falhou: %s", e)

        # ── Estratégia 2: gov.br OAuth2 password grant ────────────────────────
        for client_id in ("siaps", "egestor-aps", "sisab"):
            try:
                r = await c.post(
                    f"{_GOVBR_SSO}/oauth2/token",
                    data={
                        "grant_type": "password",
                        "username": cpf,
                        "password": senha,
                        "scope": "openid profile email govbr_confiabilidades",
                        "client_id": client_id,
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                if r.status_code == 200:
                    data = r.json()
                    token = data.get("access_token")
                    if token:
                        _auth["token"]  = token
                        _auth["expira"] = time.time() + int(data.get("expires_in", 3300))
                        logger.info("SIAPS auth: token gov.br OAuth2 OK (client_id=%s)", client_id)
                        return True
            except Exception as e:
                logger.debug("SIAPS auth gov.br OAuth2 (client_id=%s) falhou: %s", client_id, e)

        # ── Estratégia 3: eGestor APS login ──────────────────────────────────
        try:
            r = await c.post(
                f"{_EGESTOR}/auth/login",
                json={"cpf": cpf, "senha": senha},
                headers={"Content-Type": "application/json"},
            )
            if r.status_code in (200, 201):
                data = r.json()
                token = data.get("access_token") or data.get("token")
                if token:
                    _auth["token"]  = token
                    _auth["expira"] = time.time() + 3300
                    logger.info("SIAPS auth: token eGestor OK")
                    return True
        except Exception as e:
            logger.debug("SIAPS auth eGestor falhou: %s", e)

        # ── Estratégia 4: form login SIAPS com cookie de sessão ───────────────
        try:
            # Busca página de login para pegar CSRF token / hidden fields
            r_get = await c.get(f"{_SIAPS}/login", headers={"Accept": "text/html"})
            cookies = dict(r_get.cookies)

            # Extrai CSRF ou viewstate se houver
            extra: dict = {}
            text = r_get.text
            for field in ("_csrf", "javax.faces.ViewState", "lt", "execution"):
                import re
                m = re.search(rf'name="{field}"[^>]*value="([^"]+)"', text)
                if m:
                    extra[field] = m.group(1)

            r_post = await c.post(
                f"{_SIAPS}/login",
                data={"cpf": cpf, "senha": senha, **extra},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                cookies=cookies,
            )
            merged_cookies = {**cookies, **dict(r_post.cookies)}
            # Sucesso se redirecionou para página autenticada (não /login)
            if r_post.status_code in (200, 302) and "/login" not in str(r_post.url):
                _auth["cookies"] = merged_cookies
                _auth["expira"]  = time.time() + 3300
                logger.info("SIAPS auth: sessão via cookie OK")
                return True
        except Exception as e:
            logger.debug("SIAPS auth cookie falhou: %s", e)

    logger.warning("SIAPS auth: todas as estratégias falharam para CPF %s***", cpf[:3])
    return False


async def _get(url: str, params: dict | None = None, headers: dict | None = None) -> Any | None:
    """GET com auth automática (token Bearer ou cookie de sessão)."""
    hdrs = headers or _auth_headers()
    cookies = _auth_cookies()
    try:
        async with httpx.AsyncClient(
            timeout=_TIMEOUT, verify=False, follow_redirects=True,
            cookies=cookies,
        ) as c:
            r = await c.get(url, params=params or {}, headers=hdrs)
            if r.status_code == 401 and _auth.get("token"):
                # Token expirou — limpa e tenta sem auth
                _auth.clear()
                r = await c.get(url, params=params or {}, headers={
                    "Accept": "application/json",
                    "User-Agent": "ERSUS360/2.0 FMS-Apui-AM",
                })
            if r.status_code == 200:
                try:
                    return r.json()
                except Exception:
                    return None
    except Exception as exc:
        logger.debug("SIAPS svc GET %s → %s", url, exc)
    return None


# ──────────────────────────────────────────────────────────────────────────────
#  Componente Qualidade — busca dados por equipe
# ──────────────────────────────────────────────────────────────────────────────

def _parse_qualidade(raw: Any) -> list[dict] | None:
    """Tenta extrair lista de equipes+pontuações de qualquer formato conhecido."""
    if not raw:
        return None

    # Formato eGestor: lista direta de equipes
    if isinstance(raw, list) and raw and isinstance(raw[0], dict):
        items = raw
    # Formato dict com chave 'equipes', 'data', 'items', 'results'
    elif isinstance(raw, dict):
        for key in ("equipes", "data", "items", "results", "content"):
            if isinstance(raw.get(key), list):
                items = raw[key]
                break
        else:
            return None
    else:
        return None

    equipes = []
    for e in items:
        if not isinstance(e, dict):
            continue
        nome = (
            e.get("nomeEquipe") or e.get("nome") or
            e.get("equipe") or e.get("ds_equipe") or ""
        )
        ubs = (
            e.get("nomeUbs") or e.get("ubs") or
            e.get("ds_unidade") or e.get("estabelecimento") or ""
        )
        pontuacao = float(
            e.get("pontuacao") or e.get("nota") or
            e.get("score") or e.get("total") or 0
        )
        ine = str(e.get("ine") or e.get("co_equipe") or "")
        cnes = str(e.get("cnes") or e.get("co_unidade") or "")

        # Indicadores individuais (se virem na resposta)
        inds = e.get("indicadores") or e.get("indicators") or {}

        equipes.append({
            "ubs":  ubs.upper(),
            "equipe": nome.upper(),
            "ine":  ine,
            "cnes": cnes,
            "pontuacao_qualidade": round(pontuacao, 2),
            "indicadores_api": inds,
        })

    return equipes if equipes else None


async def buscar_qualidade(competencia: str = "202605") -> list[dict] | None:
    """
    Retorna lista de equipes com pontuação do Componente Qualidade.
    competencia: AAAAMM (ex: '202605' = Mai/2026)
    """
    cache_key = f"qualidade_{competencia}"
    cached = _from_cache(cache_key)
    if cached is not None:
        return cached

    # Tenta autenticar com credenciais do Railway
    await _autenticar()

    ibge_long  = _IBGE
    ibge_short = _IBGE_CURTO
    comp_fmt   = competencia  # já no formato AAAAMM

    # Converter competencia AAAAMM → quadrimestre/ano para apisiaps.saude.gov.br
    ano  = int(competencia[:4])
    mes  = int(competencia[4:])
    quad = 1 if mes <= 4 else (2 if mes <= 8 else 3)

    urls_tentativas = [
        # ── API PRIVADA SIAPS (requer Bearer token) ───────────────────────────
        # Padrão identificado: /componente/cq/visao-por-competencia
        (f"{_APISIAPS}/componente/cq/visao-por-competencia",
         {"coMunicipioIbge": ibge_long, "tiposEquipe": "eSF,eAP", "stEquipeHomologada": "S",
          "nuMes": mes, "nuAno": ano, "nivelVisualizacao": "equipe"}),
        (f"{_APISIAPS}/componente/cq/visao-por-equipe",
         {"coMunicipioIbge": ibge_long, "tiposEquipe": "eSF,eAP", "stEquipeHomologada": "S",
          "nuMes": mes, "nuAno": ano}),
        (f"{_APISIAPS}/componente/qualidade/visao-por-competencia",
         {"coMunicipioIbge": ibge_long, "tiposEquipe": "eSF,eAP", "stEquipeHomologada": "S",
          "nuMes": mes, "nuAno": ano, "nivelVisualizacao": "equipe"}),
        (f"{_APISIAPS}/api/componente/equipe",
         {"coMunicipioIbge": ibge_long, "nuQuadrimestre": quad, "nuAno": ano, "coTipoIndicador": "QUALIDADE"}),
        (f"{_APISIAPS}/api/componente/qualidade/municipio/{ibge_long}/equipe",
         {"nuQuadrimestre": quad, "nuAno": ano}),
        # ── API PÚBLICA SIAPS (sem autenticação) ─────────────────────────────
        (f"{_APISIAPS}/api/public/componente/indicador-quadrimestre",
         {"coMunicipioIbge": ibge_long, "nuQuadrimestre": quad, "coTipoIndicador": "QUALIDADE", "size": 20}),
        (f"{_APISIAPS}/api/public/componente/indicador-quadrimestre",
         {"coMunicipioIbge": ibge_long, "nuQuadrimestre": quad, "size": 20}),
        (f"{_APISIAPS}/api/public/componente/qualidade/municipio/{ibge_long}",
         {"nuQuadrimestre": quad, "nuAno": ano}),
        # ── eGestor APS ───────────────────────────────────────────────────────
        (f"{_EGESTOR}/relatorio/municipio/{ibge_long}/componenteQualidade",
         {"competencia": comp_fmt}),
        (f"{_EGESTOR}/relatorio/municipio/{ibge_short}/componenteQualidade",
         {"competencia": comp_fmt}),
        (f"{_EGESTOR}/siaps/qualidade/municipio/{ibge_long}/equipes",
         {"competencia": comp_fmt}),
        # ── SISAB / Dados Abertos ─────────────────────────────────────────────
        (f"{_DADOSAB}/siaps/componentes/qualidade",
         {"ibge": ibge_long, "competencia": comp_fmt}),
    ]

    for url, params in urls_tentativas:
        raw = await _get(url, params)
        equipes = _parse_qualidade(raw)
        if equipes:
            logger.info("SIAPS qualidade OK via %s → %d equipes", url, len(equipes))
            return _cached(cache_key, equipes)

    logger.warning("SIAPS qualidade: todas as tentativas falharam para competência %s", competencia)
    return None


# ──────────────────────────────────────────────────────────────────────────────
#  Componente Vínculo — busca dados por equipe
# ──────────────────────────────────────────────────────────────────────────────

def _parse_vinculo(raw: Any) -> list[dict] | None:
    if not raw:
        return None

    if isinstance(raw, list) and raw and isinstance(raw[0], dict):
        items = raw
    elif isinstance(raw, dict):
        for key in ("equipes", "data", "items", "results", "content"):
            if isinstance(raw.get(key), list):
                items = raw[key]
                break
        else:
            return None
    else:
        return None

    equipes = []
    for e in items:
        if not isinstance(e, dict):
            continue
        nome = (
            e.get("nomeEquipe") or e.get("nome") or
            e.get("equipe") or e.get("ds_equipe") or ""
        )
        ubs = (
            e.get("nomeUbs") or e.get("ubs") or
            e.get("ds_unidade") or e.get("estabelecimento") or ""
        )
        pontuacao = float(
            e.get("pontuacao") or e.get("nota") or
            e.get("score") or e.get("total") or 0
        )
        vinculadas = int(
            e.get("pessoasVinculadas") or e.get("K") or
            e.get("vinculadas") or e.get("totalVinculadas") or 0
        )
        acompanhadas = int(
            e.get("pessoasAcompanhadas") or e.get("H") or
            e.get("acompanhadas") or e.get("totalAcompanhadas") or 0
        )
        parametro = int(
            e.get("parametro") or e.get("param") or
            e.get("qt_parametro") or 2500
        )

        equipes.append({
            "ubs":            ubs.upper(),
            "equipe":         nome.upper(),
            "tipo":           e.get("tipo") or e.get("tipoEquipe") or "eSF",
            "parametro":      parametro,
            "K":              vinculadas,
            "H":              acompanhadas,
            "pontuacao":      round(pontuacao, 2),
            "status":         _status_vinculo(pontuacao),
            "A": int(e.get("A") or e.get("qt_a") or 0),
            "B": int(e.get("B") or e.get("qt_b") or 0),
            "C": int(e.get("C") or e.get("qt_c") or 0),
            "D": int(e.get("D") or e.get("qt_d") or 0),
            "E": int(e.get("E") or e.get("qt_e") or 0),
            "F": int(e.get("F") or e.get("qt_f") or 0),
            "G": int(e.get("G") or e.get("qt_g") or 0),
            "I": int(e.get("I") or e.get("qt_i") or 0),
            "J": int(e.get("J") or e.get("qt_j") or 0),
        })

    return equipes if equipes else None


def _status_vinculo(pontuacao: float) -> str:
    if pontuacao > 8.5:
        return "otimo"
    if pontuacao >= 7.0:
        return "bom"
    if pontuacao >= 5.0:
        return "suficiente"
    return "regular"


async def buscar_vinculo(competencia: str = "202605") -> list[dict] | None:
    """
    Retorna lista de equipes com dados do Componente Vínculo e Acompanhamento.
    """
    cache_key = f"vinculo_{competencia}"
    cached = _from_cache(cache_key)
    if cached is not None:
        return cached

    await _autenticar()

    ibge_long  = _IBGE
    ibge_short = _IBGE_CURTO

    ano  = int(competencia[:4])
    mes  = int(competencia[4:])
    quad = 1 if mes <= 4 else (2 if mes <= 8 else 3)

    urls_tentativas = [
        # ── API PRIVADA SIAPS (requer Bearer token) ───────────────────────────
        # Padrão identificado: /componente/cvat/visao-por-competencia
        (f"{_APISIAPS}/componente/cvat/visao-por-competencia",
         {"coMunicipioIbge": ibge_long, "tiposEquipe": "eSF,eAP", "stEquipeHomologada": "S",
          "nuMes": mes, "nuAno": ano, "nivelVisualizacao": "equipe"}),
        (f"{_APISIAPS}/componente/cvat/visao-por-equipe",
         {"coMunicipioIbge": ibge_long, "tiposEquipe": "eSF,eAP", "stEquipeHomologada": "S",
          "nuMes": mes, "nuAno": ano}),
        (f"{_APISIAPS}/api/componente/equipe",
         {"coMunicipioIbge": ibge_long, "nuQuadrimestre": quad, "nuAno": ano, "coTipoIndicador": "VINCULO"}),
        (f"{_APISIAPS}/api/componente/vinculo/municipio/{ibge_long}/equipe",
         {"nuQuadrimestre": quad, "nuAno": ano}),
        (f"{_APISIAPS}/api/municipio/{ibge_long}/componente/vinculo/equipe",
         {"nuQuadrimestre": quad, "nuAno": ano}),
        # ── API PÚBLICA SIAPS ────────────────────────────────────────────────
        (f"{_APISIAPS}/api/public/componente/indicador-quadrimestre",
         {"coMunicipioIbge": ibge_long, "nuQuadrimestre": quad, "coTipoIndicador": "VINCULO", "size": 20}),
        (f"{_APISIAPS}/api/public/componente/vinculo/municipio/{ibge_long}",
         {"nuQuadrimestre": quad, "nuAno": ano}),
        # ── eGestor APS ─────────────────────────────────────────────────────
        (f"{_EGESTOR}/relatorio/municipio/{ibge_long}/componenteVinculo",
         {"competencia": competencia}),
        (f"{_EGESTOR}/siaps/vinculo/municipio/{ibge_long}/equipes",
         {"competencia": competencia}),
        (f"{_DADOSAB}/siaps/componentes/vinculo",
         {"ibge": ibge_long, "competencia": competencia}),
    ]

    for url, params in urls_tentativas:
        raw = await _get(url, params)
        equipes = _parse_vinculo(raw)
        if equipes:
            logger.info("SIAPS vínculo OK via %s → %d equipes", url, len(equipes))
            return _cached(cache_key, equipes)

    logger.warning("SIAPS vínculo: todas as tentativas falharam para %s", competencia)
    return None


# ──────────────────────────────────────────────────────────────────────────────
#  Indicadores Municipais (Painel dos 15 — Portaria 3.493/2024)
# ──────────────────────────────────────────────────────────────────────────────

_METAS_15 = {1:55, 2:50, 3:90, 4:55, 5:45, 6:45, 7:45,
             8:60, 9:55, 10:55, 11:50, 12:50, 13:50, 14:55, 15:55}

_NOMES_15 = {
    1:  "Pré-natal ≥7 consultas (1º trim.)",
    2:  "Citopatológico do colo uterino",
    3:  "Vacinação DTP/Pentavalente",
    4:  "Puerpério / RN 1ª semana",
    5:  "1ª Consulta Odontológica Programática",
    6:  "Tratamento Odontológico Completado",
    7:  "Urgência Odontológica Resolvida",
    8:  "Acompanhamento HAS",
    9:  "Acompanhamento DM (HbA1c)",
    10: "Obesidade Infantil (IMC 5-9 anos)",
    11: "Alto Risco Cardiovascular",
    12: "Esquizofrenia / Psicose",
    13: "Transtorno Afetivo Bipolar",
    14: "Sífilis em Gestante — Tratamento",
    15: "Sífilis Congênita — Tratamento",
}

_EIXOS_15 = {
    1:"Criança/Mulher", 2:"Criança/Mulher", 3:"Criança/Mulher", 4:"Criança/Mulher",
    5:"Saúde Bucal", 6:"Saúde Bucal", 7:"Saúde Bucal",
    8:"Doenças Crônicas", 9:"Doenças Crônicas", 10:"Doenças Crônicas", 11:"Doenças Crônicas",
    12:"Saúde Mental", 13:"Saúde Mental",
    14:"IST", 15:"IST",
}


def _parse_ind_status(resultado: float, meta: float) -> str:
    if resultado >= meta:
        return "verde"
    if resultado >= meta * 0.7:
        return "amarelo"
    return "vermelho"


def _parse_indicadores_municipio(raw: Any) -> list[dict] | None:
    if not raw:
        return None

    if isinstance(raw, list):
        items = raw
    elif isinstance(raw, dict):
        for key in ("indicadores", "data", "items", "results"):
            if isinstance(raw.get(key), list):
                items = raw[key]
                break
        else:
            return None
    else:
        return None

    if not items:
        return None

    indicadores = []
    for i, item in enumerate(items[:15], start=1):
        if not isinstance(item, dict):
            continue
        num = int(item.get("numero") or item.get("indicador") or i)
        resultado = float(item.get("resultado") or item.get("percentual") or
                         item.get("resultadoPct") or item.get("valor") or 0)
        meta = float(item.get("meta") or item.get("metaPct") or _METAS_15.get(num, 55))
        numerador   = int(item.get("numerador") or item.get("qtd") or 0)
        denominador = int(item.get("denominador") or item.get("total") or 0)

        indicadores.append({
            "numero":       num,
            "nome":         item.get("nome") or item.get("descricao") or _NOMES_15.get(num, f"Ind.{num}"),
            "resultado_pct": round(resultado, 1),
            "meta_pct":     meta,
            "numerador":    numerador,
            "denominador":  denominador,
            "status":       _parse_ind_status(resultado, meta),
            "eixo":         item.get("eixo") or _EIXOS_15.get(num, ""),
            "fonte":        "siaps_api",
        })

    return indicadores if indicadores else None


async def buscar_indicadores_municipio(competencia: str = "202605") -> list[dict] | None:
    """
    Busca os 15 indicadores agregados do município (Portaria 3.493/2024).
    """
    cache_key = f"indicadores_{competencia}"
    cached = _from_cache(cache_key)
    if cached is not None:
        return cached

    ibge = _IBGE

    urls_tentativas = [
        (f"{_EGESTOR}/relatorio/municipio/{ibge}/indicadoresNovoPrevine",
         {"competencia": competencia}),
        (f"{_EGESTOR}/novoFinanciamento/municipio/{ibge}/indicadores",
         {"competencia": competencia}),
        (f"{_EGESTOR}/previne/municipio/{ibge}/indicadores",
         {"competencia": competencia}),
        (f"{_SIAPS}/api/v1/municipio/{ibge}/indicadores",
         {"competencia": competencia}),
        (f"{_DADOSAB}/indicadores/novoFinanciamento/municipio/{ibge}",
         {"competencia": competencia}),
        (f"{_DADOSAB}/indicadores/previne/municipio/{ibge}",
         {"competencia": competencia}),
    ]

    for url, params in urls_tentativas:
        raw = await _get(url, params)
        inds = _parse_indicadores_municipio(raw)
        if inds:
            logger.info("SIAPS indicadores OK via %s → %d inds", url, len(inds))
            return _cached(cache_key, inds)

    logger.warning("SIAPS indicadores: falha em todas as tentativas (%s)", competencia)
    return None


def limpar_cache() -> None:
    """Limpa o cache forçando nova busca na próxima chamada."""
    _cache.clear()
