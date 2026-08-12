"""
e-SUS PEC Service — Integração via GraphQL (v4/v5)
URL: settings.ESUS_URL  |  Credenciais: ESUS_USUARIO / ESUS_SENHA (Railway env vars)

Se o servidor não estiver acessível, cada função retorna dados de demonstração
para que o sistema continue funcionando offline.
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

BASE    = settings.ESUS_URL.rstrip("/")
TIMEOUT = 20
IBGE    = settings.FNS_MUNICIPIO_IBGE  # "1300144" (Apuí)

_token_cache: Optional[str]      = None
_token_exp:   Optional[datetime] = None
_instancia:   Optional[dict]     = None

# ── GraphQL queries ──────────────────────────────────────────────────────────

_GQL_LOGIN = """
mutation Login($login: String!, $senha: String!) {
  autenticar(input: { login: $login, senha: $senha }) {
    sessionToken
    dadoInstancia {
      nome
      versao
      municipio { nome uf { nome sigla } }
    }
  }
}
"""

_GQL_UNIDADES = """
query Unidades($municipio: String!) {
  unidadesSaude(filter: { municipio: { codigoIbge: $municipio } }) {
    id nome cnes tipo { descricao }
  }
}
"""

_GQL_PROFISSIONAIS = """
query Profissionais($municipio: String!) {
  profissionaisDeSaude(filter: { municipio: { codigoIbge: $municipio } }) {
    id nome cpf cns
    cbo { codigo descricao }
    lotacoes { unidadeSaude { nome } equipe { ine nome } }
  }
}
"""

_GQL_CIDADAOS = """
query Cidadaos($municipio: String!, $page: Int!) {
  cidadaos(filter: { municipio: { codigoIbge: $municipio } }, page: $page, size: 1) {
    totalElements
    pageInfo { totalPages }
  }
}
"""

_GQL_PRODUCAO = """
query Producao($municipio: String!, $competencia: String!) {
  relatorioAtendimentos(
    filter: { municipio: { codigoIbge: $municipio } competencia: $competencia }
  ) {
    totalAtendimentosIndividuais
    totalAtendimentosOdontologicos
    totalVisitasDomiciliares
    totalProcedimentos
    totalAtividadesColetivas
    totalEncaminhamentos
  }
}
"""


async def _gql(query: str, variables: dict, token: Optional[str] = None) -> Optional[dict]:
    """Executa uma query/mutation GraphQL no eSUS PEC."""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = {"query": query, "variables": variables}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as cli:
            r = await cli.post(f"{BASE}/graphql", json=payload, headers=headers)
            if r.status_code == 200:
                body = r.json()
                if "errors" not in body:
                    return body.get("data")
                logger.warning("e-SUS GraphQL errors: %s", body["errors"][:1])
    except Exception as exc:
        logger.debug("e-SUS GraphQL erro: %s", exc)
    return None


async def _autenticar() -> Optional[str]:
    """Autentica no e-SUS PEC e devolve token (com cache de 4h)."""
    global _token_cache, _token_exp, _instancia

    if _token_cache and _token_exp and datetime.now() < _token_exp:
        return _token_cache

    if not (settings.ESUS_USUARIO and settings.ESUS_SENHA):
        return None

    # Tenta GraphQL primeiro, depois REST
    data = await _gql(_GQL_LOGIN, {
        "login": settings.ESUS_USUARIO,
        "senha": settings.ESUS_SENHA,
    })
    if data and data.get("autenticar", {}).get("sessionToken"):
        _token_cache = data["autenticar"]["sessionToken"]
        _token_exp   = datetime.now() + timedelta(hours=4)
        _instancia   = data["autenticar"].get("dadoInstancia", {})
        logger.info("e-SUS PEC: autenticado via GraphQL — %s", _instancia.get("nome", ""))
        return _token_cache

    # Fallback REST
    for url in [f"{BASE}/api/auth", f"{BASE}/api/login", f"{BASE}/oauth/token"]:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as cli:
                r = await cli.post(url, json={
                    "username": settings.ESUS_USUARIO,
                    "password": settings.ESUS_SENHA,
                })
                if r.status_code in (200, 201):
                    tok = r.json().get("access_token") or r.json().get("token")
                    if tok:
                        _token_cache = tok
                        _token_exp   = datetime.now() + timedelta(hours=4)
                        logger.info("e-SUS PEC: autenticado via REST %s", url)
                        return _token_cache
        except Exception as exc:
            logger.debug("e-SUS REST auth %s: %s", url, exc)

    logger.warning("e-SUS PEC: falha de autenticação")
    return None


# ── Endpoints públicos ────────────────────────────────────────────────────────

async def testar_conexao(url_override: Optional[str] = None) -> dict:
    """
    Testa conectividade com o eSUS PEC.
    Retorna dict com status, versão e nome da instância.
    """
    global BASE
    target = (url_override or BASE).rstrip("/")
    orig   = BASE

    if url_override:
        BASE = target  # temporário para o teste

    resultado = {
        "url":      target,
        "conectado": False,
        "versao":   None,
        "instancia": None,
        "municipio": None,
        "erro":     None,
    }

    try:
        # Ping simples
        async with httpx.AsyncClient(timeout=8, verify=False) as cli:
            r = await cli.get(f"{target}/", follow_redirects=True)
            if r.status_code in range(200, 500):
                resultado["conectado"] = True
    except Exception as exc:
        resultado["erro"] = str(exc)
        BASE = orig
        return resultado

    # Tenta autenticar
    token = await _autenticar()
    if token and _instancia:
        resultado["versao"]    = _instancia.get("versao")
        resultado["instancia"] = _instancia.get("nome")
        mun = _instancia.get("municipio", {})
        resultado["municipio"] = f"{mun.get('nome','')} / {mun.get('uf',{}).get('sigla','')}"

    BASE = orig
    return resultado


async def buscar_producao(competencia: str) -> dict:
    """Produção mensal do eSUS PEC. competencia = 'AAAA-MM'."""
    token = await _autenticar()
    if token:
        ano, mes = competencia.split("-")
        comp_fmtd = f"{ano}{mes}"  # ex.: "202607"
        data = await _gql(_GQL_PRODUCAO, {
            "municipio": IBGE,
            "competencia": comp_fmtd,
        }, token=token)
        if data and data.get("relatorioAtendimentos"):
            r = data["relatorioAtendimentos"]
            return {
                "competencia": competencia,
                "atendimentos_individuais":    r.get("totalAtendimentosIndividuais",   0),
                "atendimentos_odontologicos":  r.get("totalAtendimentosOdontologicos", 0),
                "visitas_domiciliares":        r.get("totalVisitasDomiciliares",        0),
                "procedimentos":               r.get("totalProcedimentos",              0),
                "atividades_coletivas":        r.get("totalAtividadesColetivas",        0),
                "encaminhamentos":             r.get("totalEncaminhamentos",            0),
                "fonte": "esus_pec",
            }
    return {
        "competencia":                competencia,
        "situacao_dado":              "nao_disponivel",
        "atendimentos_individuais":   None,
        "atendimentos_odontologicos": None,
        "visitas_domiciliares":        None,
        "procedimentos":              None,
        "atividades_coletivas":        None,
        "encaminhamentos":             None,
        "fonte":                      "nao_disponivel",
        "nota": "e-SUS PEC nao acessivel. Configure ESUS_URL, ESUS_USUARIO, ESUS_SENHA no Railway.",
    }


async def buscar_cadastros() -> dict:
    """Total de cidadaos cadastrados no eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_CIDADAOS, {"municipio": IBGE, "page": 0}, token=token)
        if data and data.get("cidadaos"):
            total = data["cidadaos"].get("totalElements", 0)
            return {
                "individuais":     total,
                "domiciliares":    0,
                "atualizados_12m": 0,
                "situacao_dado":   "oficial_validado",
                "fonte":           "esus_pec",
            }
    return {
        "situacao_dado": "nao_disponivel",
        "individuais":   None,
        "domiciliares":  None,
        "fonte":         "nao_disponivel",
        "nota": "e-SUS PEC nao acessivel. Configure ESUS_URL no Railway.",
    }


async def buscar_unidades() -> list[dict]:
    """Unidades de saude cadastradas no eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_UNIDADES, {"municipio": IBGE}, token=token)
        if data and data.get("unidadesSaude"):
            return [
                {
                    "id":            u.get("id"),
                    "nome":          u.get("nome"),
                    "cnes":          u.get("cnes"),
                    "tipo":          (u.get("tipo") or {}).get("descricao", "—"),
                    "situacao_dado": "oficial_validado",
                }
                for u in data["unidadesSaude"]
            ]
    return []


async def buscar_profissionais() -> list[dict]:
    """Profissionais de saude cadastrados no eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_PROFISSIONAIS, {"municipio": IBGE}, token=token)
        if data and data.get("profissionaisDeSaude"):
            result = []
            for p in data["profissionaisDeSaude"]:
                lots = p.get("lotacoes") or [{}]
                result.append({
                    "nome":          p.get("nome", "—"),
                    "cns":           p.get("cns", "—"),
                    "cbo":           (p.get("cbo") or {}).get("descricao", "—"),
                    "unidade":       (lots[0].get("unidadeSaude") or {}).get("nome", "—"),
                    "equipe":        (lots[0].get("equipe") or {}).get("nome", "—"),
                    "situacao_dado": "oficial_validado",
                })
            return result
    return []


async def buscar_indicadores_aps() -> list[dict]:
    return []


async def buscar_equipes() -> list[dict]:
    return []
