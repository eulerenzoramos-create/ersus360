"""
Router: /api/integracao-pec — ERSUS 360
Integração com e-SUS PEC (Prontuário Eletrônico do Cidadão)

Duas fontes reais:
1. API LOCAL do PEC (quando ESUS_PEC_URL estiver configurado no Railway)
   Credenciais: ESUS_USUARIO / ESUS_SENHA (Railway env vars)
2. Indicadores de Qualidade APS via e-Gestor APS (já integrado, sem autenticação)
   — os indicadores de qualidade/vínculo publicados pelo e-Gestor APS são
     calculados a partir dos dados transmitidos pelo e-SUS PEC (Portaria GM/MS nº 3.493/2024).

REGRA ABSOLUTA: nenhum valor é simulado. Quando a fonte não está disponível,
o campo retorna situacao_dado="nao_disponivel" e dado=null.
"""
from __future__ import annotations
import os
import time
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException

from services.egestor_aps import buscar_completo, listar_parcelas, EGestorAPIError

router = APIRouter(prefix="/api/integracao-pec", tags=["Integração PEC e-SUS APS"])

# ── Configuração via Railway env vars ────────────────────────────────────────
ESUS_URL      = os.getenv("ESUS_PEC_URL", "").rstrip("/")
ESUS_USUARIO  = os.getenv("ESUS_USUARIO", "")
ESUS_SENHA    = os.getenv("ESUS_SENHA", "")
TIMEOUT       = 12.0

# e-Gestor APS — mesmos parâmetros do módulo de repasses
IBGE    = "130014"
CO_UF   = "13"

_pec_token: str | None = None
_pec_token_exp: float = 0.0


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _env_status() -> dict[str, Any]:
    return {
        "ESUS_PEC_URL":  {"configurada": bool(ESUS_URL),     "valor_exemplo": "http://192.168.0.10:8080"},
        "ESUS_USUARIO":  {"configurada": bool(ESUS_USUARIO), "valor_exemplo": "gestor.apui"},
        "ESUS_SENHA":    {"configurada": bool(ESUS_SENHA),   "valor_exemplo": "(senha do gestor PEC)"},
    }


def _pec_pronto() -> bool:
    return bool(ESUS_URL and ESUS_USUARIO and ESUS_SENHA)


# ── GraphQL — e-SUS PEC usa /graphql (não REST) ──────────────────────────────

_GQL_LOGIN = """
mutation Login($login: String!, $senha: String!) {
  autenticar(input: { login: $login, senha: $senha }) {
    sessionToken
  }
}
"""

_GQL_EQUIPES = """
query Equipes($municipio: String!) {
  equipesSaude(filter: { municipio: { codigoIbge: $municipio } }) {
    id ine nome
    tipoEquipe { descricao }
    unidadeSaude { cnes }
    ativa
  }
}
"""

_GQL_PROFISSIONAIS = """
query Profissionais($municipio: String!) {
  profissionaisDeSaude(filter: { municipio: { codigoIbge: $municipio } }) {
    id nome
    cbo { codigo descricao }
    ativo
    lotacoes { unidadeSaude { cnes } equipe { ine } }
  }
}
"""

_GQL_FICHAS_RESUMO = """
query FichasResumo($municipio: String!) {
  relatorioSinteticoFichas(filter: { municipio: { codigoIbge: $municipio } }) {
    totalAtendimentoIndividual
    totalAtendimentoOdontologico
    totalVisitaDomiciliar
    totalCadastroIndividual
    totalCadastroDomiciliar
    totalAtividadeColetiva
  }
}
"""


async def _pec_gql(query: str, variables: dict, token: str | None = None) -> dict | None:
    """Executa uma query GraphQL no e-SUS PEC local."""
    headers: dict = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
            r = await client.post(
                f"{ESUS_URL}/graphql",
                json={"query": query, "variables": variables},
                headers=headers,
            )
            if r.status_code == 200:
                body = r.json()
                if "errors" not in body:
                    return body.get("data")
    except Exception:
        pass
    return None


async def _pec_autenticar() -> str | None:
    """Autentica via GraphQL mutation e retorna o sessionToken."""
    global _pec_token, _pec_token_exp
    if _pec_token and time.time() < _pec_token_exp:
        return _pec_token
    if not _pec_pronto():
        return None
    data = await _pec_gql(_GQL_LOGIN, {"login": ESUS_USUARIO, "senha": ESUS_SENHA})
    token = (data or {}).get("autenticar", {}).get("sessionToken")
    if token:
        _pec_token = token
        _pec_token_exp = time.time() + 3540  # ~1h
        return token
    return None


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/status")
async def status_integracao():
    """
    Status da integração com o e-SUS PEC local e com o e-Gestor APS.
    Testa a conexão real quando as credenciais estiverem configuradas.
    """
    env = _env_status()
    pec_pronto = _pec_pronto()

    conexao_local: dict[str, Any] = {
        "configurada": pec_pronto,
        "testada": False,
        "online": None,
        "mensagem": "Configure ESUS_PEC_URL, ESUS_USUARIO e ESUS_SENHA no Railway.",
        "url": ESUS_URL or None,
    }

    if pec_pronto:
        token = await _pec_autenticar()
        if token:
            conexao_local.update({
                "testada": True,
                "online": True,
                "mensagem": "Conectado à instância local do e-SUS PEC.",
            })
        else:
            conexao_local.update({
                "testada": True,
                "online": False,
                "mensagem": (
                    f"Falha ao autenticar em {ESUS_URL}. "
                    "Verifique se o servidor PEC está acessível pelo Railway "
                    "e se as credenciais estão corretas."
                ),
            })

    # e-Gestor APS: sempre disponível (indicadores derivados do PEC)
    try:
        parcelas = await listar_parcelas(ano=2026, co_uf=CO_UF)
        ultima_parcela = max(parcelas) if parcelas else None
    except Exception:
        ultima_parcela = None

    egestor_ok = ultima_parcela is not None

    return {
        "verificado_em": _now_iso(),
        "municipio": "Apuí/AM",
        "ibge": IBGE,
        "pec_local": conexao_local,
        "egestor_aps": {
            "disponivel": egestor_ok,
            "ultima_parcela": ultima_parcela,
            "nota": (
                "Indicadores de Qualidade APS disponíveis via e-Gestor APS "
                "(calculados a partir dos dados transmitidos pelo e-SUS PEC)."
            ),
        },
        "env_vars": env,
        "instrucoes_configuracao": {
            "passo_1": "No Railway, adicione a variável ESUS_PEC_URL com a URL da instalação local do e-SUS PEC",
            "passo_2": "Configure ESUS_USUARIO e ESUS_SENHA com as credenciais do gestor municipal",
            "passo_3": "Certifique-se de que o servidor PEC está acessível pela internet (ou use um túnel)",
            "nota": "Os indicadores de qualidade APS já estão disponíveis via e-Gestor APS sem configuração adicional.",
        },
    }


@router.get("/indicadores-qualidade")
async def indicadores_qualidade():
    """
    Indicadores de Qualidade APS para Apuí/AM — fonte: e-Gestor APS.
    Calculados pelo Ministério da Saúde (Portaria GM/MS nº 3.493/2024) a partir
    dos dados transmitidos pelo e-SUS PEC e publicados no e-Gestor APS.
    """
    try:
        parcelas = await listar_parcelas(ano=2026, co_uf=CO_UF)
    except EGestorAPIError as exc:
        raise HTTPException(status_code=503, detail={
            "erro": "e-Gestor APS indisponível",
            "descricao": str(exc),
        })

    if not parcelas:
        raise HTTPException(status_code=404, detail="Nenhuma parcela disponível.")

    ultima = max(parcelas)

    try:
        resultado = await buscar_completo(
            co_municipio=IBGE,
            co_uf=CO_UF,
            parcela_inicio=ultima,
            parcela_fim=ultima,
        )
    except EGestorAPIError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    det = resultado.get("detalhado", {})
    ind = det.get("indicadores_classificacao", {})
    esf = det.get("esf", {})
    emulti = det.get("emulti", {})
    esb = det.get("esb", {})
    acs = det.get("acs", {})

    _COMP_MAP = {
        "202601": "NOV/2025", "202602": "DEZ/2025", "202603": "JAN/2026",
        "202604": "FEV/2026", "202605": "MAR/2026", "202606": "ABR/2026",
        "202607": "MAI/2026", "202608": "JUN/2026",
        "202609": "JUL/2026", "202610": "AGO/2026", "202611": "SET/2026", "202612": "OUT/2026",
    }

    def _cls(val: str | None) -> dict:
        if not val:
            return {"classificacao": None, "situacao_dado": "nao_disponivel"}
        nivel = {
            "BOM": "success",
            "REGULAR": "warning",
            "INSUFICIENTE": "danger",
            "RUIM": "danger",
        }.get(val.upper(), "neutral")
        return {"classificacao": val, "nivel": nivel, "situacao_dado": "oficial_validado"}

    return {
        "fonte": "e-Gestor APS (relatorioaps-prd.saude.gov.br)",
        "nota": (
            "Indicadores de qualidade calculados pelo DATASUS a partir dos dados "
            "transmitidos pelo e-SUS PEC, publicados mensalmente junto ao financiamento "
            "da APS (Portaria GM/MS nº 3.493/2024). Nenhum valor estimado."
        ),
        "competencia_referencia": _COMP_MAP.get(ultima, ultima),
        "nu_parcela": ultima,
        "coletado_em": resultado["coletado_em"],
        "indicadores": {
            "qualidade_esf": _cls(ind.get("qualidade_esf")),
            "qualidade_emulti": _cls(ind.get("qualidade_emulti")),
            "vinculo": _cls(ind.get("vinculo")),
            "equidade_estrato": {
                "estrato": ind.get("equidade_estrato"),
                "situacao_dado": "oficial_validado" if ind.get("equidade_estrato") else "nao_disponivel",
            },
        },
        "equipes_referencia": {
            "esf": {
                "pagas": esf.get("qt_pagas"),
                "teto": esf.get("qt_teto"),
                "situacao_dado": "oficial_validado" if esf.get("qt_pagas") is not None else "nao_disponivel",
            },
            "emulti": {
                "pagas": emulti.get("qt_estrategica"),
                "situacao_dado": "oficial_validado" if emulti.get("qt_estrategica") is not None else "nao_disponivel",
            },
            "esb": {
                "pagas": esb.get("qt_esb_40h"),
                "teto": esb.get("qt_teto"),
                "situacao_dado": "oficial_validado" if esb.get("qt_esb_40h") is not None else "nao_disponivel",
            },
            "acs": {
                "pagos": acs.get("qt_pagas"),
                "situacao_dado": "oficial_validado" if acs.get("qt_pagas") is not None else "nao_disponivel",
            },
        },
    }


@router.post("/testar-conexao")
async def testar_conexao():
    """Testa a conexão com a instância local do e-SUS PEC."""
    global _pec_token, _pec_token_exp
    # Forçar re-autenticação
    _pec_token = None
    _pec_token_exp = 0.0

    if not _pec_pronto():
        return {
            "online": False,
            "mensagem": "Credenciais não configuradas. Configure ESUS_PEC_URL, ESUS_USUARIO e ESUS_SENHA no Railway.",
            "env_vars": _env_status(),
            "verificado_em": _now_iso(),
        }

    token = await _pec_autenticar()
    return {
        "online": bool(token),
        "url_testada": ESUS_URL,
        "mensagem": (
            "Conexão estabelecida com sucesso."
            if token else
            f"Falha ao conectar em {ESUS_URL}. Verifique se o servidor é acessível."
        ),
        "verificado_em": _now_iso(),
    }


@router.get("/situacao")
async def consultar_situacao():
    """
    Situação da integração: cadastros sincronizados e estatísticas de transmissão.
    Quando o PEC local estiver configurado, tenta buscar dados reais.
    """
    situacao_pec: dict[str, Any] = {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "PEC local não configurado. Configure ESUS_PEC_URL no Railway.",
    }

    if _pec_pronto():
        token = await _pec_autenticar()
        if token:
            # Busca equipes via GraphQL como sonda de produção
            data_eq = await _pec_gql(_GQL_EQUIPES, {"municipio": IBGE}, token=token)
            equipes_raw = (data_eq or {}).get("equipesSaude") or []

            if equipes_raw is not None:
                situacao_pec = {
                    "situacao_dado": "oficial_validado",
                    "fonte": "graphql",
                    "dados": {"equipes": len(equipes_raw)},
                    "ultima_consulta": _now_iso(),
                }
            else:
                situacao_pec = {
                    "situacao_dado": "nao_disponivel",
                    "nota": "PEC conectado mas GraphQL não retornou dados de equipes.",
                    "ultima_consulta": _now_iso(),
                }
        else:
            situacao_pec = {
                "situacao_dado": "nao_disponivel",
                "nota": f"Falha na autenticação em {ESUS_URL}.",
                "ultima_consulta": _now_iso(),
            }

    # Indicadores via e-Gestor (sempre disponíveis)
    try:
        parcelas = await listar_parcelas(ano=2026, co_uf=CO_UF)
        n_parcelas = len(parcelas)
        ultima = max(parcelas) if parcelas else None
    except Exception:
        n_parcelas = 0
        ultima = None

    return {
        "verificado_em": _now_iso(),
        "pec_local": situacao_pec,
        "egestor_aps": {
            "situacao_dado": "oficial_validado" if ultima else "nao_disponivel",
            "parcelas_ciclo_2026": n_parcelas,
            "ultima_parcela": ultima,
            "nota": "Indicadores de qualidade APS disponíveis. Use /api/integracao-pec/indicadores-qualidade.",
        },
    }


@router.post("/sincronizar-cadastros")
async def sincronizar_cadastros():
    """Sincroniza cadastros do PEC local para o ERSUS360."""
    if not _pec_pronto():
        return {
            "sucesso": False,
            "mensagem": "PEC local não configurado. Nenhuma sincronização realizada.",
            "verificado_em": _now_iso(),
        }

    token = await _pec_autenticar()
    if not token:
        return {
            "sucesso": False,
            "mensagem": f"Falha na autenticação em {ESUS_URL}. Verifique ESUS_USUARIO e ESUS_SENHA no Railway.",
            "verificado_em": _now_iso(),
        }

    # Busca equipes e profissionais via GraphQL
    IBGE_MUNICIPIO = "1300144"
    data_eq = await _pec_gql(_GQL_EQUIPES, {"municipio": IBGE_MUNICIPIO}, token=token)
    data_pr = await _pec_gql(_GQL_PROFISSIONAIS, {"municipio": IBGE_MUNICIPIO}, token=token)
    data_fi = await _pec_gql(_GQL_FICHAS_RESUMO, {"municipio": IBGE_MUNICIPIO}, token=token)

    equipes    = (data_eq or {}).get("equipesSaude") or []
    profiss    = (data_pr or {}).get("profissionaisDeSaude") or []
    fichas_res = (data_fi or {}).get("relatorioSinteticoFichas") or {}

    if not (equipes or profiss):
        return {
            "sucesso": False,
            "mensagem": "PEC conectado mas nenhum dado de cadastro retornado pelo GraphQL. Verifique a versão do PEC e as permissões do usuário.",
            "verificado_em": _now_iso(),
        }

    return {
        "sucesso": True,
        "mensagem": "Dados obtidos via GraphQL do e-SUS PEC.",
        "contagens": {
            "equipes":      len(equipes),
            "profissionais": len(profiss),
        },
        "fichas_resumo": fichas_res or None,
        "verificado_em": _now_iso(),
    }


@router.post("/reprocessar-pendencias")
async def reprocessar_pendencias():
    return {
        "situacao_dado": "nao_disponivel",
        "mensagem": "Reprocessamento de pendências requer PEC local configurado.",
        "pec_configurado": _pec_pronto(),
        "verificado_em": _now_iso(),
    }


@router.post("/sync-esus")
async def sync_esus():
    """Alias para sincronizar-cadastros."""
    return await sincronizar_cadastros()


@router.get("/fichas-cds")
async def fichas_cds():
    """
    Resumo de fichas CDS transmitidas pelo PEC — via GraphQL.
    Requer ESUS_PEC_URL, ESUS_USUARIO, ESUS_SENHA configurados no Railway.
    """
    if not _pec_pronto():
        return {
            "situacao_dado": "nao_disponivel",
            "dados": None,
            "nota": "Configure ESUS_PEC_URL, ESUS_USUARIO e ESUS_SENHA no Railway.",
            "verificado_em": _now_iso(),
        }

    token = await _pec_autenticar()
    if not token:
        return {
            "situacao_dado": "nao_disponivel",
            "dados": None,
            "nota": f"Falha na autenticação em {ESUS_URL}.",
            "verificado_em": _now_iso(),
        }

    data = await _pec_gql(_GQL_FICHAS_RESUMO, {"municipio": IBGE}, token=token)
    resumo = (data or {}).get("relatorioSinteticoFichas")

    if not resumo:
        return {
            "situacao_dado": "nao_disponivel",
            "dados": None,
            "nota": "PEC conectado mas relatorioSinteticoFichas não retornou dados.",
            "verificado_em": _now_iso(),
        }

    return {
        "situacao_dado": "oficial_validado",
        "fonte": f"e-SUS PEC GraphQL — {ESUS_URL}/graphql",
        "dados": resumo,
        "verificado_em": _now_iso(),
    }


@router.get("/equipes")
async def equipes_pec():
    """Lista equipes cadastradas no PEC local via GraphQL."""
    if not _pec_pronto():
        return {"situacao_dado": "nao_disponivel", "dados": None, "nota": "PEC não configurado.", "verificado_em": _now_iso()}

    token = await _pec_autenticar()
    if not token:
        return {"situacao_dado": "nao_disponivel", "dados": None, "nota": "Falha na autenticação.", "verificado_em": _now_iso()}

    data = await _pec_gql(_GQL_EQUIPES, {"municipio": IBGE}, token=token)
    equipes = (data or {}).get("equipesSaude") or []

    return {
        "situacao_dado": "oficial_validado" if equipes else "nao_disponivel",
        "total": len(equipes),
        "dados": equipes,
        "fonte": f"e-SUS PEC GraphQL — {ESUS_URL}/graphql",
        "verificado_em": _now_iso(),
    }
