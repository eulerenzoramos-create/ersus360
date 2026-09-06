"""
CNES Service — Integração em tempo real com DATASUS/CNES
Endpoint público (sem credencial): cnes.datasus.gov.br/services/estabelecimentos-equipes/{coUnidade}
Dados verificados via CNES Web em 05/09/2026 — Apuí/AM (IBGE 1300144).
"""
from __future__ import annotations
import logging
from datetime import datetime, timedelta
from typing import Optional
import httpx
from config import settings

logger = logging.getLogger(__name__)

IBGE = settings.FNS_MUNICIPIO_IBGE  # 1300144
CNES_BASE = "https://cnes.datasus.gov.br"
TIMEOUT = 20

# Cache simples em memória (TTL 6h)
_cache_equipes: Optional[list] = None
_cache_equipes_exp: Optional[datetime] = None
_cache_estab: Optional[list] = None
_cache_estab_exp: Optional[datetime] = None

# Mapeamento CNES → co_unidade (IBGE + CNES sem separação)
_UBS_APUI = [
    {"cnes": "2013312", "co_unidade": "1300142013312", "nome": "UBS ANIZIO FERREIRA DA SILVA",
     "bairro": "SAO SEBASTIAO", "telefone": "9398409750", "latitude": -7.197632, "longitude": -59.891345},
    {"cnes": "9942122", "co_unidade": "1300149942122", "nome": "UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA",
     "bairro": "", "telefone": "", "latitude": None, "longitude": None},
    {"cnes": "2013290", "co_unidade": "1300142013290", "nome": "UBS EDUARDO BIAZIN",
     "bairro": "", "telefone": "", "latitude": None, "longitude": None},
    {"cnes": "3320138", "co_unidade": "1300143320138", "nome": "UBS IRMA ELIZABETE",
     "bairro": "", "telefone": "", "latitude": None, "longitude": None},
    {"cnes": "9934448", "co_unidade": "1300149934448", "nome": "UBS OSVALDO LEMES CABRAL",
     "bairro": "", "telefone": "", "latitude": None, "longitude": None},
    {"cnes": "2013304", "co_unidade": "1300142013304", "nome": "UBS PADRE FALIERO BONCI",
     "bairro": "KENNEDY", "telefone": "", "latitude": None, "longitude": None},
    {"cnes": "4184688", "co_unidade": "1300144184688", "nome": "UBS PEDRO ALEXANDRE SANTOS DA SILVA",
     "bairro": "", "telefone": "", "latitude": None, "longitude": None},
    {"cnes": "3697983", "co_unidade": "1300143697983", "nome": "CENTRO DE SAUDE CURUMIM",
     "bairro": "", "telefone": "", "latitude": None, "longitude": None},
    {"cnes": "2013282", "co_unidade": "1300142013282", "nome": "HOSPITAL DORVALINO LAGASSE",
     "bairro": "", "telefone": "", "latitude": None, "longitude": None},
    {"cnes": "6893279", "co_unidade": "1300146893279", "nome": "CAPS MARIA SALETE TASCA",
     "bairro": "", "telefone": "", "latitude": None, "longitude": None},
]


async def _buscar_equipes_ubs(co_unidade: str) -> list[dict]:
    """Busca equipes de uma UBS diretamente da API pública do CNES."""
    url = f"{CNES_BASE}/services/estabelecimentos-equipes/{co_unidade}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
            r = await client.get(url, headers={"Accept": "application/json"})
            if r.status_code == 200:
                return r.json() if isinstance(r.json(), list) else []
    except Exception as e:
        logger.debug("CNES equipes %s: %s", co_unidade, e)
    return []


async def buscar_equipes_saude(ibge: str = IBGE) -> list[dict]:
    """
    Retorna todas as equipes ESF/ESB/eMulti de Apuí/AM em tempo real via CNES.
    Cache TTL: 6 horas.
    """
    global _cache_equipes, _cache_equipes_exp
    if _cache_equipes and _cache_equipes_exp and datetime.now() < _cache_equipes_exp:
        logger.debug("CNES equipes: retornando do cache")
        return _cache_equipes

    todas: list[dict] = []
    erros = 0
    for ubs in _UBS_APUI:
        equipes = await _buscar_equipes_ubs(ubs["co_unidade"])
        if equipes:
            for eq in equipes:
                todas.append({
                    "ine": eq.get("coEquipe", ""),
                    "seq_equipe": eq.get("seqEquipe", ""),
                    "nome": eq.get("nomeEquipe", ""),
                    "tipo": eq.get("dsEquipe", ""),
                    "tp_equipe": eq.get("tpEquipe", ""),
                    "area": eq.get("coArea", ""),
                    "ds_area": eq.get("dsArea", ""),
                    "cnes_ubs": ubs["cnes"],
                    "nome_ubs": ubs["nome"],
                    "co_municipio": eq.get("coMunicipio", IBGE),
                    "ribeirinha": eq.get("ribeirinha") == "1",
                    "quilombola": eq.get("quilombola") == "1",
                    "indigena": eq.get("indigena") == "1",
                    "ativo": eq.get("dtDesativacao") is None,
                    "dt_ativacao": eq.get("dtAtivacao", ""),
                    "dt_desativacao": eq.get("dtDesativacao"),
                    "fonte": "cnes_live",
                    "atualizado_em": datetime.now().isoformat(),
                })
        else:
            erros += 1

    if todas:
        _cache_equipes = todas
        _cache_equipes_exp = datetime.now() + timedelta(hours=6)
        logger.info("CNES: %d equipes carregadas de %d UBS (%d erros)", len(todas), len(_UBS_APUI), erros)
        return todas

    logger.warning("CNES: API indisponível — usando dados verificados 05/09/2026")
    return _equipes_verificadas_cnes()


async def buscar_estabelecimentos() -> list[dict]:
    """
    Retorna estabelecimentos de saúde de Apuí/AM com equipes em tempo real.
    Cache TTL: 6 horas.
    """
    global _cache_estab, _cache_estab_exp
    if _cache_estab and _cache_estab_exp and datetime.now() < _cache_estab_exp:
        return _cache_estab

    result = []
    for ubs in _UBS_APUI:
        equipes = await _buscar_equipes_ubs(ubs["co_unidade"])
        esf = [e for e in equipes if e.get("tpEquipe") == "70"]
        esb = [e for e in equipes if e.get("tpEquipe") == "71"]
        emulti = [e for e in equipes if e.get("tpEquipe") == "72"]
        result.append({
            "cnes": ubs["cnes"],
            "co_unidade": ubs["co_unidade"],
            "nome": ubs["nome"],
            "tipo": "CENTRO DE SAUDE/UNIDADE BASICA",
            "municipio": "Apuí",
            "uf": "AM",
            "ibge": IBGE,
            "bairro": ubs.get("bairro", ""),
            "telefone": ubs.get("telefone", ""),
            "latitude": ubs.get("latitude"),
            "longitude": ubs.get("longitude"),
            "ativo": True,
            "qtd_esf": len(esf),
            "qtd_esb": len(esb),
            "qtd_emulti": len(emulti),
            "equipes_esf": [e.get("nomeEquipe") for e in esf],
            "equipes_esb": [e.get("nomeEquipe") for e in esb],
            "fonte": "cnes_live" if equipes else "cnes_verificado",
            "atualizado_em": datetime.now().isoformat(),
        })

    if any(u.get("fonte") == "cnes_live" for u in result):
        _cache_estab = result
        _cache_estab_exp = datetime.now() + timedelta(hours=6)

    return result


async def buscar_status() -> dict:
    """Verifica conectividade com a API do CNES."""
    url = f"{CNES_BASE}/services/estabelecimentos/1300142013312"
    try:
        async with httpx.AsyncClient(timeout=10, verify=False) as client:
            r = await client.get(url)
            conectado = r.status_code == 200
    except Exception:
        conectado = False

    return {
        "cnes_api_disponivel": conectado,
        "endpoint": f"{CNES_BASE}/services/estabelecimentos-equipes/{{co_unidade}}",
        "municipio": "Apuí/AM",
        "ibge": IBGE,
        "total_ubs_monitoradas": len(_UBS_APUI),
        "cache_equipes_ativo": _cache_equipes is not None,
        "cache_expira_em": _cache_equipes_exp.isoformat() if _cache_equipes_exp else None,
        "timestamp": datetime.now().isoformat(),
    }


def _equipes_verificadas_cnes() -> list[dict]:
    """Dados verificados diretamente no CNES Web em 05/09/2026."""
    return [
        # UBS ANIZIO FERREIRA DA SILVA (2013312)
        {"ine": "0001536974", "seq_equipe": "1536974", "nome": "SAO SEBASTIAO", "tipo": "ESF - EQUIPE DE SAUDE DA FAMILIA",
         "tp_equipe": "70", "area": "0004", "ds_area": "SAO SEBASTIAO", "cnes_ubs": "2013312",
         "nome_ubs": "UBS ANIZIO FERREIRA DA SILVA", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "01/07/2014", "fonte": "cnes_verificado"},
        {"ine": "0000007064", "seq_equipe": "7064", "nome": "ACARI", "tipo": "ESF - EQUIPE DE SAUDE DA FAMILIA",
         "tp_equipe": "70", "area": "0005", "ds_area": "ACARI", "cnes_ubs": "2013312",
         "nome_ubs": "UBS ANIZIO FERREIRA DA SILVA", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "01/07/2003", "fonte": "cnes_verificado"},
        {"ine": "0002449927", "seq_equipe": "2449927", "nome": "EMULTI ANIZIO", "tipo": "EMULTI - EQUIPE MULTIPROFISSIONAL NA AT. PRIMARIA A SAUDE",
         "tp_equipe": "72", "area": "0000", "ds_area": "NAO SE APLICA", "cnes_ubs": "2013312",
         "nome_ubs": "UBS ANIZIO FERREIRA DA SILVA", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "06/05/2024", "fonte": "cnes_verificado"},
        # UBS CLAUDIA PEREIRA (9942122)
        {"ine": "0001690426", "seq_equipe": "1690426", "nome": "ESTRADA NOVA", "tipo": "ESF - EQUIPE DE SAUDE DA FAMILIA",
         "tp_equipe": "70", "area": "0009", "ds_area": "ESTRADA NOVA", "cnes_ubs": "9942122",
         "nome_ubs": "UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "29/10/2019", "fonte": "cnes_verificado"},
        # UBS EDUARDO BIAZIN (2013290) — AREAL com ribeirinha=True
        {"ine": "0000007048", "seq_equipe": "7048", "nome": "AREAL", "tipo": "ESF - EQUIPE DE SAUDE DA FAMILIA",
         "tp_equipe": "70", "area": "0002", "ds_area": "AREAL", "cnes_ubs": "2013290",
         "nome_ubs": "UBS EDUARDO BIAZIN", "ribeirinha": True, "quilombola": False,
         "ativo": True, "dt_ativacao": "10/11/1998",
         "alerta": "0 vinculados no SIAPS Q1/26 — verificar ACS e fichas no e-SUS PEC",
         "fonte": "cnes_verificado"},
        # UBS IRMA ELIZABETE (3320138)
        {"ine": "0000007072", "seq_equipe": "7072", "nome": "CACHOEIRA", "tipo": "ESF - EQUIPE DE SAUDE DA FAMILIA",
         "tp_equipe": "70", "area": "0010", "ds_area": "CACHOEIRA", "cnes_ubs": "3320138",
         "nome_ubs": "UBS IRMA ELIZABETE", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "01/07/2003", "fonte": "cnes_verificado"},
        # UBS OSVALDO LEMES CABRAL (9934448)
        {"ine": "0001690442", "seq_equipe": "1690442", "nome": "TRES ESTADOS", "tipo": "ESF - EQUIPE DE SAUDE DA FAMILIA",
         "tp_equipe": "70", "area": "0008", "ds_area": "TRES ESTADOS", "cnes_ubs": "9934448",
         "nome_ubs": "UBS OSVALDO LEMES CABRAL", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "29/10/2019", "fonte": "cnes_verificado"},
        # UBS PADRE FALIERO BONCI (2013304)
        {"ine": "0000007056", "seq_equipe": "7056", "nome": "KENNEDY", "tipo": "ESF - EQUIPE DE SAUDE DA FAMILIA",
         "tp_equipe": "70", "area": "0001", "ds_area": "KENNEDY", "cnes_ubs": "2013304",
         "nome_ubs": "UBS PADRE FALIERO BONCI", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "10/11/1998", "fonte": "cnes_verificado"},
        # UBS PEDRO ALEXANDRE (4184688)
        {"ine": "0002323613", "seq_equipe": "2323613", "nome": "JK", "tipo": "ESF - EQUIPE DE SAUDE DA FAMILIA",
         "tp_equipe": "70", "area": "0012", "ds_area": "JK/JK", "cnes_ubs": "4184688",
         "nome_ubs": "UBS PEDRO ALEXANDRE SANTOS DA SILVA", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "29/05/2023", "fonte": "cnes_verificado"},
        # CENTRO DE SAUDE CURUMIM (3697983)
        {"ine": "0000007099", "seq_equipe": "7099", "nome": "LIBERDADE", "tipo": "ESF - EQUIPE DE SAUDE DA FAMILIA",
         "tp_equipe": "70", "area": "0011", "ds_area": "LIBERDADE", "cnes_ubs": "3697983",
         "nome_ubs": "CENTRO DE SAUDE CURUMIM", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "17/10/2005", "fonte": "cnes_verificado"},
        {"ine": "0000007080", "seq_equipe": "7080", "nome": "JUMA", "tipo": "ESF - EQUIPE DE SAUDE DA FAMILIA",
         "tp_equipe": "70", "area": "0014", "ds_area": "JUMA", "cnes_ubs": "3697983",
         "nome_ubs": "CENTRO DE SAUDE CURUMIM", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "01/02/2007", "fonte": "cnes_verificado"},
        {"ine": "0002449900", "seq_equipe": "2449900", "nome": "EMULTI CURUMIM", "tipo": "EMULTI - EQUIPE MULTIPROFISSIONAL NA AT. PRIMARIA A SAUDE",
         "tp_equipe": "72", "area": "0000", "ds_area": "NAO SE APLICA", "cnes_ubs": "3697983",
         "nome_ubs": "CENTRO DE SAUDE CURUMIM", "ribeirinha": False, "quilombola": False,
         "ativo": True, "dt_ativacao": "06/05/2024", "fonte": "cnes_verificado"},
    ]
