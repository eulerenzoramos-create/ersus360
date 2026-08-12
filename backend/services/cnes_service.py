"""
CNES Service — Integração com DATASUS/CNES
Busca estabelecimentos de saúde do município de Apuí/AM (IBGE 1300144)
Sem credenciais necessárias — dados públicos.
"""
from __future__ import annotations
import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)

IBGE = settings.FNS_MUNICIPIO_IBGE  # 1300144
TIMEOUT = 20


async def buscar_estabelecimentos() -> list[dict]:
    """Retorna lista de estabelecimentos de saúde de Apuí/AM via CNES/DATASUS."""
    urls = [
        f"{settings.CNES_API}/estabelecimentos?municipio={IBGE}&limit=200",
        f"https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?co_municipio={IBGE}&limit=200",
    ]
    for url in urls:
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                r = await client.get(url, headers={"Accept": "application/json"})
                if r.status_code == 200:
                    data = r.json()
                    items = data if isinstance(data, list) else data.get("items", data.get("data", []))
                    logger.info("CNES: %d estabelecimentos encontrados para IBGE %s", len(items), IBGE)
                    return _normalizar(items)
        except Exception as e:
            logger.warning("CNES tentativa falhou (%s): %s", url, e)

    # Dados confirmados manualmente do CNES2/DATASUS em 11/08/2026
    logger.info("CNES: API indisponivel — usando dados confirmados CNES2/DATASUS 2026-08-11")
    return _fallback_apui()


def _normalizar(items: list) -> list[dict]:
    result = []
    for it in items:
        result.append({
            "cnes": it.get("co_cnes") or it.get("cnes") or it.get("codigo_cnes", ""),
            "nome": it.get("no_fantasia") or it.get("nome_fantasia") or it.get("nome", ""),
            "tipo": it.get("ds_tipo_estabelecimento") or it.get("tipo", ""),
            "logradouro": it.get("no_logradouro") or it.get("logradouro", ""),
            "bairro": it.get("no_bairro") or it.get("bairro", ""),
            "municipio": "Apuí",
            "uf": "AM",
            "telefone": it.get("nu_telefone") or it.get("telefone", ""),
            "latitude": it.get("nu_latitude") or it.get("latitude"),
            "longitude": it.get("nu_longitude") or it.get("longitude"),
            "ativo": it.get("st_ativo", "1") == "1",
        })
    return result


def _fallback_apui() -> list[dict]:
    """
    Estabelecimentos confirmados via CNES2/DATASUS em 11/08/2026.
    situacao_dado = oficial_aguardando: dado real, aguardando validacao automatica via API.
    """
    return [
        {
            "cnes": "3320138",
            "nome": "UBS IRMÃ ELIZABETE",
            "tipo": "CENTRO DE SAUDE/UNIDADE BASICA",
            "logradouro": "", "bairro": "",
            "municipio": "Apuí", "uf": "AM",
            "telefone": "", "latitude": None, "longitude": None, "ativo": True,
            "rejeicao_equipe_esf": True,
            "equipes_esf": ["CACHOEIRA"],
            "fonte_confirmacao": "CNES2/DATASUS 2026-08-11",
        },
        {
            "cnes": "2013312",
            "nome": "UBS ANIZIO FERREIRA DA SILVA",
            "tipo": "CENTRO DE SAUDE/UNIDADE BASICA",
            "logradouro": "", "bairro": "",
            "municipio": "Apuí", "uf": "AM",
            "telefone": "", "latitude": None, "longitude": None, "ativo": True,
            "rejeicao_equipe_esf": True,
            "equipes_esf": ["SÃO SEBASTIÃO", "ACARI"],
            "fonte_confirmacao": "CNES2/DATASUS 2026-08-11",
        },
        {
            "cnes": "9934448",
            "nome": "UBS OSVALDO LEMES CABRAL",
            "tipo": "CENTRO DE SAUDE/UNIDADE BASICA",
            "logradouro": "", "bairro": "",
            "municipio": "Apuí", "uf": "AM",
            "telefone": "", "latitude": None, "longitude": None, "ativo": True,
            "rejeicao_equipe_esf": False,
            "equipes_esf": ["TRÊS ESTADOS"],
            "fonte_confirmacao": "CNES2/DATASUS 2026-08-11",
        },
        {
            "cnes": "3697983",
            "nome": "CENTRO DE SAÚDE CURUMIM",
            "tipo": "CENTRO DE SAUDE/UNIDADE BASICA",
            "logradouro": "", "bairro": "",
            "municipio": "Apuí", "uf": "AM",
            "telefone": "", "latitude": None, "longitude": None, "ativo": True,
            "rejeicao_equipe_esf": True,
            "equipes_esf": ["JUMA", "LIBERDADE"],
            "fonte_confirmacao": "CNES2/DATASUS 2026-08-11",
        },
        {
            "cnes": "2013304",
            "nome": "UBS PADRE FALIERO BONCI",
            "tipo": "CENTRO DE SAUDE/UNIDADE BASICA",
            "logradouro": "", "bairro": "",
            "municipio": "Apuí", "uf": "AM",
            "telefone": "", "latitude": None, "longitude": None, "ativo": True,
            "rejeicao_equipe_esf": True,
            "equipes_esf": ["KENNEDY"],
            "fonte_confirmacao": "CNES2/DATASUS 2026-08-11",
        },
        {
            "cnes": "4184688",
            "nome": "UBS JK",
            "tipo": "CENTRO DE SAUDE/UNIDADE BASICA",
            "logradouro": "", "bairro": "",
            "municipio": "Apuí", "uf": "AM",
            "telefone": "", "latitude": None, "longitude": None, "ativo": True,
            "rejeicao_equipe_esf": False,
            "equipes_esf": ["JK"],
            "fonte_confirmacao": "CNES2/DATASUS 2026-08-11",
        },
        {
            "cnes": "9942122",
            "nome": "UBS CLÁUDIA PEREIRA DOS SANTOS DAMACENA",
            "tipo": "CENTRO DE SAUDE/UNIDADE BASICA",
            "logradouro": "", "bairro": "",
            "municipio": "Apuí", "uf": "AM",
            "telefone": "", "latitude": None, "longitude": None, "ativo": True,
            "rejeicao_equipe_esf": False,
            "equipes_esf": ["ESTRADA NOVA"],
            "fonte_confirmacao": "CNES2/DATASUS 2026-08-11",
        },
        {
            "cnes": "2013290",
            "nome": "UBS EDUARDO BIAZIN / POSTO DE SAÚDE RURAL SUCUNDURI",
            "tipo": "CENTRO DE SAUDE/UNIDADE BASICA",
            "logradouro": "", "bairro": "",
            "municipio": "Apuí", "uf": "AM",
            "telefone": "", "latitude": None, "longitude": None, "ativo": True,
            "rejeicao_equipe_esf": True,
            "equipes_esf": [],
            "observacao": "Identificado no CNES/DATASUS em 11/08/2026. Sem equipe ESF mapeada no Componente Vínculo.",
            "fonte_confirmacao": "CNES2/DATASUS 2026-08-11",
        },
    ]


async def buscar_equipes_saude() -> list[dict]:
    """Retorna equipes de saúde da família ativas em Apuí/AM."""
    try:
        url = f"https://apidadosabertos.saude.gov.br/cnes/equipes?co_municipio={IBGE}&tp_equipe=70&limit=50"
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
            r = await client.get(url, headers={"Accept": "application/json"})
            if r.status_code == 200:
                data = r.json()
                items = data if isinstance(data, list) else data.get("items", [])
                return items
    except Exception as e:
        logger.warning("CNES equipes: %s", e)

    # Equipes ESF confirmadas no CNES/DATASUS 11/08/2026 — INEs pendentes (verificar e-Gestor APS)
    return [
        {"ine": None, "nome": "ESF CACHOEIRA",      "cnes_ubs": "3320138", "area": "", "ativo": True, "rejeicao_cnes": True},
        {"ine": None, "nome": "ESF SÃO SEBASTIÃO",  "cnes_ubs": "2013312", "area": "", "ativo": True, "rejeicao_cnes": True},
        {"ine": None, "nome": "ESF ACARI",           "cnes_ubs": "2013312", "area": "", "ativo": True, "rejeicao_cnes": True},
        {"ine": None, "nome": "ESF TRÊS ESTADOS",   "cnes_ubs": "9934448", "area": "", "ativo": True, "rejeicao_cnes": False},
        {"ine": None, "nome": "ESF JUMA",            "cnes_ubs": "3697983", "area": "", "ativo": True, "rejeicao_cnes": True},
        {"ine": None, "nome": "ESF LIBERDADE",       "cnes_ubs": "3697983", "area": "", "ativo": True, "rejeicao_cnes": True},
        {"ine": None, "nome": "ESF KENNEDY",         "cnes_ubs": "2013304", "area": "", "ativo": True, "rejeicao_cnes": True},
        {"ine": None, "nome": "ESF JK",              "cnes_ubs": "4184688", "area": "", "ativo": True, "rejeicao_cnes": False},
        {"ine": None, "nome": "ESF ESTRADA NOVA",   "cnes_ubs": "9942122", "area": "", "ativo": True, "rejeicao_cnes": False},
    ]
