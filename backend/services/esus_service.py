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
    return _producao_fallback(competencia)


async def buscar_cadastros() -> dict:
    """Total de cidadãos cadastrados no eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_CIDADAOS, {"municipio": IBGE, "page": 0}, token=token)
        if data and data.get("cidadaos"):
            total = data["cidadaos"].get("totalElements", 0)
            return {"individuais": total, "domiciliares": 0,
                    "atualizados_12m": 0, "fonte": "esus_pec"}
    return {"individuais": 18_924, "domiciliares": 6_241,
            "atualizados_12m": 12_100, "fonte": "fallback"}


async def buscar_unidades() -> list[dict]:
    """Unidades de saúde cadastradas no eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_UNIDADES, {"municipio": IBGE}, token=token)
        if data and data.get("unidadesSaude"):
            return [
                {
                    "id":   u.get("id"),
                    "nome": u.get("nome"),
                    "cnes": u.get("cnes"),
                    "tipo": (u.get("tipo") or {}).get("descricao", "—"),
                }
                for u in data["unidadesSaude"]
            ]
    return _unidades_fallback()


async def buscar_profissionais() -> list[dict]:
    """Profissionais de saúde cadastrados no eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_PROFISSIONAIS, {"municipio": IBGE}, token=token)
        if data and data.get("profissionaisDeSaude"):
            result = []
            for p in data["profissionaisDeSaude"]:
                lots = p.get("lotacoes") or [{}]
                result.append({
                    "nome":    p.get("nome", "—"),
                    "cns":     p.get("cns", "—"),
                    "cbo":     (p.get("cbo") or {}).get("descricao", "—"),
                    "unidade": (lots[0].get("unidadeSaude") or {}).get("nome", "—"),
                    "equipe":  (lots[0].get("equipe") or {}).get("nome", "—"),
                })
            return result
    return _profissionais_fallback()


async def buscar_indicadores_aps() -> list[dict]:
    return _indicadores_fallback()


async def buscar_equipes() -> list[dict]:
    return []


# ── Fallbacks (dados de demonstração) ────────────────────────────────────────

def _producao_fallback(competencia: str) -> dict:
    return {
        "competencia": competencia,
        "atendimentos_individuais":    1_240,
        "atendimentos_odontologicos":    318,
        "visitas_domiciliares":           892,
        "procedimentos":               2_156,
        "atividades_coletivas":           47,
        "encaminhamentos":               183,
        "fonte": "fallback",
    }


def _unidades_fallback() -> list[dict]:
    return [
        {"id": 1, "nome": "UBS Central Apuí",           "cnes": "2784520", "tipo": "Centro de Saúde/UBS"},
        {"id": 2, "nome": "UBSF Rio Juma",               "cnes": "2784539", "tipo": "UBS Fluvial"},
        {"id": 3, "nome": "UBSF Estrada Maracanã",       "cnes": "2784547", "tipo": "UBSF"},
        {"id": 4, "nome": "UBS Bairro Independência",    "cnes": "2784555", "tipo": "Centro de Saúde/UBS"},
        {"id": 5, "nome": "Hospital Municipal de Apuí",  "cnes": "2784563", "tipo": "Hospital Geral"},
        {"id": 6, "nome": "UPA 24h Apuí",                "cnes": "6523412", "tipo": "UPA"},
        {"id": 7, "nome": "CAPS II Apuí",                "cnes": "7834521", "tipo": "CAPS"},
        {"id": 8, "nome": "CEO Apuí",                    "cnes": "7834522", "tipo": "CEO"},
    ]


def _profissionais_fallback() -> list[dict]:
    return [
        {"nome": "Dra. Ana Paula Costa",    "cns": "700 8012 4318 2456", "cbo": "Médico de Família",        "unidade": "UBS Central",       "equipe": "ESF I"},
        {"nome": "Dr. Carlos Mendonça",     "cns": "700 8012 4319 1234", "cbo": "Médico de Família",        "unidade": "UBSF Rio Juma",     "equipe": "ESF III"},
        {"nome": "Enf. Maria Silva",        "cns": "700 8012 4320 5678", "cbo": "Enfermeiro",               "unidade": "UBS Central",       "equipe": "ESF I"},
        {"nome": "Enf. João Oliveira",      "cns": "700 8012 4321 9012", "cbo": "Enfermeiro",               "unidade": "UBSF Maracanã",     "equipe": "ESF II"},
        {"nome": "Dra. Fernanda Rocha",     "cns": "700 8012 4322 3456", "cbo": "Cirurgião-Dentista",       "unidade": "CEO Apuí",          "equipe": "—"},
        {"nome": "Marcos ACS",              "cns": "700 8012 4323 7890", "cbo": "Agente Comunitário Saúde", "unidade": "UBS Central",       "equipe": "ESF I"},
        {"nome": "Lucia ACS",               "cns": "700 8012 4324 1234", "cbo": "Agente Comunitário Saúde", "unidade": "UBSF Rio Juma",     "equipe": "ESF III"},
        {"nome": "Técn. Roberto Lima",      "cns": "700 8012 4325 5678", "cbo": "Técnico de Enfermagem",    "unidade": "Hospital Municipal", "equipe": "—"},
    ]


def _indicadores_fallback() -> list[dict]:
    return [
        {"indicador": "Pré-natal ≥ 7 consultas",                   "alcancado": 85, "meta": 100, "situacao": "EM_ANDAMENTO"},
        {"indicador": "Cobertura vacinal BCG",                      "alcancado": 92, "meta": 100, "situacao": "ATINGIDO"},
        {"indicador": "Cobertura ESF",                              "alcancado": 68, "meta": 100, "situacao": "EM_ANDAMENTO"},
        {"indicador": "Rastreamento câncer de colo do útero",       "alcancado": 80, "meta": 100, "situacao": "ATINGIDO"},
        {"indicador": "Hipertensão — pressão aferida",              "alcancado": 74, "meta": 100, "situacao": "EM_ANDAMENTO"},
        {"indicador": "Diabetes — HbA1c coletada",                  "alcancado": 61, "meta": 100, "situacao": "EM_ANDAMENTO"},
    ]
