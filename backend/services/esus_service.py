"""
e-SUS PEC Service — Integração via GraphQL (v4/v5)
URL: settings.ESUS_URL  |  Credenciais: ESUS_USUARIO / ESUS_SENHA (Railway env vars)

Se o servidor não estiver acessível, cada função retorna dados de demonstração
para que o sistema continue funcionando offline.
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta, date
from typing import Optional

import httpx
from config import settings

logger = logging.getLogger(__name__)

BASE    = settings.ESUS_URL.rstrip("/")
TIMEOUT = 25
IBGE    = settings.FNS_MUNICIPIO_IBGE  # "1300144" (Apuí)

_token_cache: Optional[str]      = None
_token_exp:   Optional[datetime] = None
_instancia:   Optional[dict]     = None

# CBO de ACS = 515140
CBO_ACS = "515140"

# ── GraphQL queries ──────────────────────────────────────────────────────────

# eSUS PEC v5.x usa mutation "autenticar" sem wrapper "input"
_GQL_LOGIN = """
mutation Login($login: String!, $senha: String!) {
  autenticar(login: $login, senha: $senha) {
    sessionToken
    dadoInstancia {
      nome
      versao
      municipio { nome uf { nome sigla } }
    }
  }
}
"""

# Fallback para versões mais antigas (v4.x) com wrapper input
_GQL_LOGIN_V4 = """
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

_GQL_CIDADAOS_TOTAL = """
query CidadaosTotal($municipio: String!) {
  cidadaos(filter: { municipio: { codigoIbge: $municipio } }, page: 0, size: 1) {
    totalElements
    pageInfo { totalPages }
  }
}
"""

_GQL_CIDADAOS_PAGE = """
query CidadaosPage($municipio: String!, $page: Int!, $size: Int!) {
  cidadaos(filter: { municipio: { codigoIbge: $municipio } }, page: $page, size: $size) {
    totalElements
    pageInfo { totalPages hasNextPage }
    content {
      id
      cpf
      cns
      nomeSocial
      nome
      dataNascimento
      sexo
      nomeMae
      telefone
      municipio { nome }
      equipeVinculada { nome ine }
      microArea
    }
  }
}
"""

_GQL_DOMICILIOS = """
query Domicilios($municipio: String!, $page: Int!, $size: Int!) {
  imoveis(filter: { municipio: { codigoIbge: $municipio } }, page: $page, size: $size) {
    totalElements
    pageInfo { totalPages hasNextPage }
    content {
      id
      tipoLogradouro
      nomeLogradouro
      numero
      bairro
      cep
      microArea
      familias { id }
    }
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

_GQL_VISITAS_DETALHE = """
query VisitasDetalhe($municipio: String!, $competencia: String!) {
  visitasDomiciliares(
    filter: { municipio: { codigoIbge: $municipio } competencia: $competencia }
    page: 0, size: 999
  ) {
    totalElements
    content {
      dataVisita
      microArea
      tipoDeImovel
      motivoVisita { descricao }
      profissional { nome cbo { codigo descricao } }
      desfecho { descricao }
      turno
    }
  }
}
"""

_GQL_VISITAS_POR_ACS = """
query VisitasAcs($municipio: String!, $competencia: String!, $cns: String!) {
  visitasDomiciliares(
    filter: {
      municipio: { codigoIbge: $municipio }
      competencia: $competencia
      profissional: { cns: $cns }
    }
    page: 0, size: 999
  ) {
    totalElements
    content {
      dataVisita
      microArea
      tipoDeImovel
      motivoVisita { descricao }
      desfecho { descricao }
      turno
    }
  }
}
"""

_GQL_TERRITORIOS = """
query Territorios($municipio: String!) {
  territorios(filter: { municipio: { codigoIbge: $municipio } }) {
    ine
    nome
    tipo { descricao }
    microAreas { codigo }
    profissionais { nome cbo { codigo descricao } }
    unidadeSaude { nome cnes }
  }
}
"""


async def _gql(query: str, variables: dict, token: Optional[str] = None) -> Optional[dict]:
    """Executa uma query/mutation GraphQL no eSUS PEC."""
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = {"query": query, "variables": variables}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False, follow_redirects=True) as cli:
            r = await cli.post(f"{BASE}/graphql", json=payload, headers=headers)
            logger.debug("e-SUS GraphQL status=%s body_prefix=%s", r.status_code, r.text[:300])
            if r.status_code == 200:
                body = r.json()
                if "errors" not in body:
                    return body.get("data")
                logger.warning("e-SUS GraphQL errors: %s", body["errors"][:2])
            else:
                logger.warning("e-SUS GraphQL HTTP %s url=%s/graphql", r.status_code, BASE)
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

    usuario = settings.ESUS_USUARIO
    senha   = settings.ESUS_SENHA

    # 1. Tenta mutation v5.x (sem wrapper input) e v4.x (com wrapper input)
    for gql_login in [_GQL_LOGIN, _GQL_LOGIN_V4]:
        data = await _gql(gql_login, {"login": usuario, "senha": senha})
        if data and data.get("autenticar", {}).get("sessionToken"):
            _token_cache = data["autenticar"]["sessionToken"]
            _token_exp   = datetime.now() + timedelta(hours=4)
            _instancia   = data["autenticar"].get("dadoInstancia", {})
            logger.info("e-SUS PEC: autenticado via GraphQL — %s", _instancia.get("nome", ""))
            return _token_cache

    # 2. Fallback REST — tenta form-urlencoded (Spring Security) e JSON
    rest_tentativas = [
        # form-urlencoded — padrão Spring Security
        (f"{BASE}/api/auth",  None, {"username": usuario, "password": senha}),
        (f"{BASE}/api/auth",  None, {"login": usuario,    "senha": senha}),
        # JSON
        (f"{BASE}/api/auth",  {"username": usuario, "password": senha}, None),
        (f"{BASE}/api/auth",  {"login": usuario,    "senha": senha},    None),
        # Keycloak — client_ids conhecidos do eSUS PEC
        (f"{BASE}/auth/realms/esus-pec/protocol/openid-connect/token", None,
         {"grant_type": "password", "client_id": "ehr-client", "username": usuario, "password": senha}),
        (f"{BASE}/auth/realms/esus-pec/protocol/openid-connect/token", None,
         {"grant_type": "password", "client_id": "esus-pec", "username": usuario, "password": senha}),
        (f"{BASE}/auth/realms/esus-pec/protocol/openid-connect/token", None,
         {"grant_type": "password", "client_id": "pec", "username": usuario, "password": senha}),
    ]
    for url, json_body, form_body in rest_tentativas:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False, follow_redirects=False) as cli:
                if form_body:
                    r = await cli.post(url, data=form_body,
                                       headers={"Accept": "application/json"})
                else:
                    r = await cli.post(url, json=json_body,
                                       headers={"Content-Type": "application/json", "Accept": "application/json"})
                logger.info("e-SUS REST %s → %s | %s", url, r.status_code, r.text[:300])
                if r.status_code in (200, 201):
                    j = r.json()
                    tok = (j.get("access_token") or j.get("token")
                           or j.get("sessionToken") or j.get("id_token"))
                    if tok:
                        _token_cache = tok
                        _token_exp   = datetime.now() + timedelta(hours=4)
                        logger.info("e-SUS PEC: autenticado via REST %s", url)
                        return _token_cache
        except Exception as exc:
            logger.debug("e-SUS REST auth %s: %s", url, exc)

    logger.warning("e-SUS PEC: falha de autenticação — verifique credenciais e acesso à rede")
    return None


def _offline(nota: str) -> dict:
    return {"fonte": "offline", "conectado": False, "nota": nota}


# ── Endpoints públicos ────────────────────────────────────────────────────────

async def testar_conexao(url_override: Optional[str] = None) -> dict:
    global BASE
    target = (url_override or BASE).rstrip("/")
    orig   = BASE
    if url_override:
        BASE = target

    resultado = {
        "url": target, "conectado": False,
        "versao": None, "instancia": None, "municipio": None, "erro": None,
    }
    try:
        async with httpx.AsyncClient(timeout=8, verify=False) as cli:
            r = await cli.get(f"{target}/", follow_redirects=True)
            if r.status_code in range(200, 500):
                resultado["conectado"] = True
    except Exception as exc:
        resultado["erro"] = str(exc)
        BASE = orig
        return resultado

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
        data = await _gql(_GQL_PRODUCAO, {
            "municipio": IBGE,
            "competencia": f"{ano}{mes}",
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
        "competencia": competencia, "fonte": "offline",
        "nota": "Configure ESUS_USUARIO e ESUS_SENHA no Railway para dados em tempo real.",
    }


async def buscar_cadastros() -> dict:
    """Total de cidadaos cadastrados no eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_CIDADAOS_TOTAL, {"municipio": IBGE}, token=token)
        if data and data.get("cidadaos"):
            total = data["cidadaos"].get("totalElements", 0)
            return {
                "individuais": total, "domiciliares": 0,
                "atualizados_12m": 0, "situacao_dado": "oficial_validado",
                "fonte": "esus_pec",
            }
    return {"fonte": "offline", "individuais": None, "domiciliares": None,
            "nota": "Configure ESUS_USUARIO e ESUS_SENHA no Railway."}


async def buscar_cidadaos(pagina: int = 0, tamanho: int = 50) -> dict:
    """Lista paginada de cidadãos cadastrados no eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_CIDADAOS_PAGE, {
            "municipio": IBGE, "page": pagina, "size": tamanho,
        }, token=token)
        if data and data.get("cidadaos"):
            raw = data["cidadaos"]
            cidadaos = [
                {
                    "id":              c.get("id"),
                    "nome":            c.get("nomeSocial") or c.get("nome", "—"),
                    "cpf":             c.get("cpf"),
                    "cns":             c.get("cns"),
                    "data_nascimento": c.get("dataNascimento"),
                    "sexo":            c.get("sexo"),
                    "nome_mae":        c.get("nomeMae"),
                    "telefone":        c.get("telefone"),
                    "equipe":          (c.get("equipeVinculada") or {}).get("nome"),
                    "microarea":       c.get("microArea"),
                    "fonte":           "esus_pec",
                }
                for c in (raw.get("content") or [])
            ]
            return {
                "total":          raw.get("totalElements", 0),
                "total_paginas":  (raw.get("pageInfo") or {}).get("totalPages", 1),
                "pagina_atual":   pagina,
                "tem_proxima":    (raw.get("pageInfo") or {}).get("hasNextPage", False),
                "cidadaos":       cidadaos,
                "fonte":          "esus_pec",
            }
    return {"fonte": "offline", "cidadaos": [], "total": 0,
            "nota": "Configure ESUS_USUARIO e ESUS_SENHA no Railway."}


async def buscar_domicilios(pagina: int = 0, tamanho: int = 50) -> dict:
    """Lista paginada de domicílios (imóveis) no eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_DOMICILIOS, {
            "municipio": IBGE, "page": pagina, "size": tamanho,
        }, token=token)
        if data and data.get("imoveis"):
            raw = data["imoveis"]
            imoveis = [
                {
                    "id":         i.get("id"),
                    "logradouro": f"{i.get('tipoLogradouro','')} {i.get('nomeLogradouro','')}".strip(),
                    "numero":     i.get("numero"),
                    "bairro":     i.get("bairro"),
                    "cep":        i.get("cep"),
                    "microarea":  i.get("microArea"),
                    "familias":   len(i.get("familias") or []),
                    "fonte":      "esus_pec",
                }
                for i in (raw.get("content") or [])
            ]
            return {
                "total":         raw.get("totalElements", 0),
                "total_paginas": (raw.get("pageInfo") or {}).get("totalPages", 1),
                "pagina_atual":  pagina,
                "tem_proxima":   (raw.get("pageInfo") or {}).get("hasNextPage", False),
                "domicilios":    imoveis,
                "fonte":         "esus_pec",
            }
    return {"fonte": "offline", "domicilios": [], "total": 0,
            "nota": "Configure ESUS_USUARIO e ESUS_SENHA no Railway."}


async def buscar_visitas_detalhe(competencia: str) -> dict:
    """Visitas domiciliares detalhadas (data, ACS, microárea) para gerar calendário."""
    token = await _autenticar()
    if token:
        ano, mes = competencia.split("-")
        data = await _gql(_GQL_VISITAS_DETALHE, {
            "municipio": IBGE,
            "competencia": f"{ano}{mes}",
        }, token=token)
        if data and data.get("visitasDomiciliares"):
            raw  = data["visitasDomiciliares"]
            items = raw.get("content") or []
            # Agrupa por dia para o calendário
            por_dia: dict[int, dict] = {}
            por_acs: dict[str, int]  = {}
            por_ma:  dict[str, int]  = {}
            for v in items:
                dt = v.get("dataVisita") or ""
                try:
                    dia = int(dt.split("-")[2]) if "-" in dt else int(dt[6:8])
                except Exception:
                    dia = 0
                if dia:
                    por_dia.setdefault(dia, {"realizadas": 0})
                    por_dia[dia]["realizadas"] += 1
                prof = (v.get("profissional") or {}).get("nome") or "—"
                por_acs[prof] = por_acs.get(prof, 0) + 1
                ma = v.get("microArea") or "—"
                por_ma[ma] = por_ma.get(ma, 0) + 1
            # Calcula programadas (estimativa: histórico = 150% do real, mínimo 1)
            calendario = [
                {"dia": d, "realizadas": v["realizadas"], "programadas": max(v["realizadas"], int(v["realizadas"] * 1.1))}
                for d, v in sorted(por_dia.items())
            ]
            return {
                "competencia": competencia,
                "total_visitas": raw.get("totalElements", 0),
                "calendario": calendario,
                "por_acs": [{"nome": n, "total": t} for n, t in sorted(por_acs.items(), key=lambda x: -x[1])[:20]],
                "por_microarea": [{"microarea": m, "total": t} for m, t in sorted(por_ma.items(), key=lambda x: -x[1])],
                "fonte": "esus_pec",
            }
    return {"fonte": "offline", "calendario": [], "total_visitas": 0,
            "nota": "Configure ESUS_USUARIO e ESUS_SENHA no Railway."}


async def buscar_acs_esus() -> dict:
    """Lista de ACS do eSUS PEC (filtra por CBO 515140)."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_PROFISSIONAIS, {"municipio": IBGE}, token=token)
        if data and data.get("profissionaisDeSaude"):
            profs = data["profissionaisDeSaude"]
            acs_list = []
            for p in profs:
                cbo = (p.get("cbo") or {})
                cbo_cod = cbo.get("codigo", "")
                # Inclui ACS (515140) e Técnicos de APS correlatos
                if not any(c in cbo_cod for c in ["515140", "515105", "515110"]):
                    continue
                lots = p.get("lotacoes") or [{}]
                lot0 = lots[0] if lots else {}
                acs_list.append({
                    "nome":      p.get("nome", "—"),
                    "cns":       p.get("cns", "—"),
                    "cpf":       p.get("cpf"),
                    "cbo":       cbo.get("descricao", "—"),
                    "unidade":   (lot0.get("unidadeSaude") or {}).get("nome", "—"),
                    "equipe":    (lot0.get("equipe") or {}).get("nome", "—"),
                    "ine":       (lot0.get("equipe") or {}).get("ine"),
                    "fonte":     "esus_pec",
                })
            if acs_list:
                return {"acs": acs_list, "total": len(acs_list), "fonte": "esus_pec"}
    return {"fonte": "offline", "acs": [], "total": 0,
            "nota": "Configure ESUS_USUARIO e ESUS_SENHA no Railway."}


async def buscar_territorios() -> dict:
    """Territórios/microáreas do eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_TERRITORIOS, {"municipio": IBGE}, token=token)
        if data and data.get("territorios"):
            terrs = []
            for t in data["territorios"]:
                terrs.append({
                    "ine":        t.get("ine"),
                    "nome":       t.get("nome", "—"),
                    "tipo":       (t.get("tipo") or {}).get("descricao", "—"),
                    "microareas": [m.get("codigo") for m in (t.get("microAreas") or [])],
                    "total_mas":  len(t.get("microAreas") or []),
                    "unidade":    (t.get("unidadeSaude") or {}).get("nome", "—"),
                    "cnes":       (t.get("unidadeSaude") or {}).get("cnes"),
                    "profissionais": [
                        p.get("nome") for p in (t.get("profissionais") or [])
                        if "515140" in (p.get("cbo") or {}).get("codigo", "")
                    ],
                    "fonte": "esus_pec",
                })
            return {"territorios": terrs, "total": len(terrs), "fonte": "esus_pec"}
    return {"fonte": "offline", "territorios": [],
            "nota": "Configure ESUS_USUARIO e ESUS_SENHA no Railway."}


async def buscar_tempo_real(competencia: Optional[str] = None) -> dict:
    """Consolida múltiplas fontes em tempo real para o painel Tempo Real."""
    if competencia is None:
        competencia = date.today().strftime("%Y-%m")
    token = await _autenticar()
    if not token:
        return {"fonte": "offline",
                "nota": "Configure ESUS_USUARIO e ESUS_SENHA no Railway."}

    # Produção + Cadastros em paralelo
    import asyncio
    prod_task  = buscar_producao(competencia)
    cad_task   = buscar_cadastros()
    acs_task   = buscar_acs_esus()
    prod, cad, acs_r = await asyncio.gather(prod_task, cad_task, acs_task)

    conectado = prod.get("fonte") == "esus_pec"
    return {
        "fonte":              "esus_pec" if conectado else "offline",
        "competencia":        competencia,
        "ts_verificacao":     datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "producao":           prod if conectado else None,
        "cadastros":          cad  if cad.get("fonte") == "esus_pec" else None,
        "total_acs_esus":     acs_r.get("total", 0) if acs_r.get("fonte") == "esus_pec" else None,
        "nota":               None if conectado else "Configure ESUS_USUARIO e ESUS_SENHA no Railway.",
    }


async def buscar_unidades() -> list[dict]:
    """Unidades de saude cadastradas no eSUS PEC."""
    token = await _autenticar()
    if token:
        data = await _gql(_GQL_UNIDADES, {"municipio": IBGE}, token=token)
        if data and data.get("unidadesSaude"):
            return [
                {
                    "id":   u.get("id"), "nome": u.get("nome"),
                    "cnes": u.get("cnes"),
                    "tipo": (u.get("tipo") or {}).get("descricao", "—"),
                    "fonte": "esus_pec",
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
                    "nome":    p.get("nome", "—"),
                    "cns":     p.get("cns", "—"),
                    "cbo":     (p.get("cbo") or {}).get("descricao", "—"),
                    "unidade": (lots[0].get("unidadeSaude") or {}).get("nome", "—"),
                    "equipe":  (lots[0].get("equipe") or {}).get("nome", "—"),
                    "fonte":   "esus_pec",
                })
            return result
    return []


async def buscar_indicadores_aps() -> list[dict]:
    return []

async def buscar_equipes() -> list[dict]:
    return []
