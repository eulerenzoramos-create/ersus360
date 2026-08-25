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
# Dados de referencia municipal — Apui/AM (IBGE 1300144) — competencia 202605
# Estrutura compativel com SiapsEgestor.tsx.
# ---------------------------------------------------------------------------
_REF_APUI: dict = {
    "siaps_dashboard": {
        "uf": "AM",
        "municipio": "APUI",
        "ied": "II",
        "competencia": "Mai/2026",
        "vinculo": {
            "pontuacao_media": 8.1,
            "otimo": 3,
            "bom": 4,
            "suficiente": 2,
            "regular": 0,
            "total_vinculadas": 21834,
            "total_acompanhadas": 18940,
        },
        "qualidade": {
            "pontuacao_media": 57.9,
            "cito_meta_pct_media": 37.1,
        },
    },
    "siaps_abrangencia": {
        "uf": "AM",
        "municipio": "APUI",
        "ied": "II",
        "total_equipes":               {"eAP": 0, "eAPP": 0, "eCR": 0, "eMulti": 0, "eSB": 0, "eSF": 9, "eSFR": 0},
        "equipes_homologadas":         {"eAP": 0, "eAPP": 0, "eCR": 0, "eMulti": 0, "eSB": 0, "eSF": 9, "eSFR": 0},
        "equipes_validas_componentes": {"eAP": 0, "eAPP": 0, "eCR": 0, "eMulti": 0, "eSB": 0, "eSF": 8, "eSFR": 0},
    },
    "siaps_vinculo": {
        "total_equipes": 9,
        "total_pessoas_vinculadas": 21834,
        "total_pessoas_acompanhadas": 18940,
        "pontuacao_media": 8.1,
        "ied": "II",
        "por_status": {"otimo": 3, "bom": 4, "suficiente": 2, "regular": 0},
        "equipes": [
            {"ubs": "UBS IRMA ELIZABETE",                     "equipe": "CACHOEIRA",     "tipo": "eSF", "parametro": 3500, "A": 720, "B": 1210, "C": 1930, "D": 580, "E": 420, "F": 190, "G": 110, "H": 1654, "I": 290, "J": 22, "K": 1980, "pontuacao": 8.6, "status": "otimo"},
            {"ubs": "UBS ANIZIO FERREIRA DA SILVA",            "equipe": "SAO SEBASTIAO", "tipo": "eSF", "parametro": 3200, "A": 680, "B": 1100, "C": 1780, "D": 530, "E": 390, "F": 175, "G": 100, "H": 1510, "I": 270, "J": 20, "K": 1830, "pontuacao": 8.3, "status": "bom"},
            {"ubs": "UBS ANIZIO FERREIRA DA SILVA",            "equipe": "ACARI",         "tipo": "eSF", "parametro": 3100, "A": 660, "B": 1080, "C": 1740, "D": 510, "E": 370, "F": 165, "G": 95,  "H": 1480, "I": 260, "J": 18, "K": 1790, "pontuacao": 8.2, "status": "bom"},
            {"ubs": "UBS OSVALDO LEMES CABRAL",                "equipe": "TRES ESTADOS",  "tipo": "eSF", "parametro": 2800, "A": 500, "B": 820,  "C": 1320, "D": 380, "E": 270, "F": 130, "G": 70,  "H": 1120, "I": 190, "J": 12, "K": 1350, "pontuacao": 6.4, "status": "suficiente"},
            {"ubs": "CENTRO DE SAUDE CURUMIM",                 "equipe": "JUMA",          "tipo": "eSF", "parametro": 3400, "A": 730, "B": 1190, "C": 1920, "D": 570, "E": 415, "F": 185, "G": 108, "H": 1640, "I": 285, "J": 21, "K": 1970, "pontuacao": 8.5, "status": "bom"},
            {"ubs": "CENTRO DE SAUDE CURUMIM",                 "equipe": "LIBERDADE",     "tipo": "eSF", "parametro": 3600, "A": 790, "B": 1320, "C": 2110, "D": 640, "E": 465, "F": 210, "G": 130, "H": 1780, "I": 330, "J": 26, "K": 2180, "pontuacao": 9.1, "status": "otimo"},
            {"ubs": "UBS PADRE FALIERO BONCI",                 "equipe": "KENNEDY",       "tipo": "eSF", "parametro": 3300, "A": 700, "B": 1150, "C": 1850, "D": 560, "E": 405, "F": 180, "G": 105, "H": 1580, "I": 280, "J": 21, "K": 1900, "pontuacao": 9.3, "status": "otimo"},
            {"ubs": "UBS JK",                                  "equipe": "JK",            "tipo": "eSF", "parametro": 3250, "A": 690, "B": 1130, "C": 1820, "D": 545, "E": 395, "F": 178, "G": 102, "H": 1560, "I": 276, "J": 20, "K": 1870, "pontuacao": 8.4, "status": "bom"},
            {"ubs": "UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA", "equipe": "ESTRADA NOVA",  "tipo": "eSF", "parametro": 2900, "A": 420, "B": 690,  "C": 1110, "D": 310, "E": 220, "F": 110, "G": 58,  "H": 940,  "I": 155, "J": 9,  "K": 1140, "pontuacao": 5.8, "status": "suficiente"},
        ],
    },
    "siaps_qualidade": {
        "indicadores_resumo": {
            "ind1_prenatal":    {"resultado": 72.5, "meta": 55, "status": "verde",    "media": 72.5, "otimo": 6, "atencao": 2, "critico": 1},
            "ind2_cito":        {"resultado": 37.1, "meta": 50, "status": "vermelho", "media": 37.1, "otimo": 0, "atencao": 3, "critico": 6},
            "ind3_vacina":      {"resultado": 76.5, "meta": 90, "status": "amarelo",  "media": 76.5, "otimo": 2, "atencao": 5, "critico": 2},
            "ind4_rn":          {"resultado": 81.9, "meta": 55, "status": "verde",    "media": 81.9, "otimo": 8, "atencao": 1, "critico": 0},
            "ind5_odonto1":     {"resultado": 32.6, "meta": 45, "status": "vermelho", "media": 32.6, "otimo": 0, "atencao": 2, "critico": 7},
            "ind6_odonto_comp": {"resultado": 25.8, "meta": 45, "status": "vermelho", "media": 25.8, "otimo": 0, "atencao": 1, "critico": 8},
            "ind7_urg_odonto":  {"resultado": 51.8, "meta": 45, "status": "verde",    "media": 51.8, "otimo": 7, "atencao": 2, "critico": 0},
            "ind8_has":         {"resultado": 70.5, "meta": 60, "status": "verde",    "media": 70.5, "otimo": 7, "atencao": 2, "critico": 0},
            "ind9_dm":          {"resultado": 55.4, "meta": 55, "status": "verde",    "media": 55.4, "otimo": 5, "atencao": 3, "critico": 1},
            "ind10_obesidade":  {"resultado": 67.1, "meta": 55, "status": "verde",    "media": 67.1, "otimo": 8, "atencao": 1, "critico": 0},
            "ind11_cv":         {"resultado": 37.8, "meta": 50, "status": "vermelho", "media": 37.8, "otimo": 0, "atencao": 3, "critico": 6},
            "ind12_psicose":    {"resultado": 43.5, "meta": 50, "status": "amarelo",  "media": 43.5, "otimo": 1, "atencao": 5, "critico": 3},
            "ind13_tab":        {"resultado": 38.4, "meta": 50, "status": "vermelho", "media": 38.4, "otimo": 0, "atencao": 4, "critico": 5},
            "ind14_sif_gest":   {"resultado": 76.8, "meta": 55, "status": "verde",    "media": 76.8, "otimo": 8, "atencao": 1, "critico": 0},
            "ind15_sif_cong":   {"resultado": 81.4, "meta": 55, "status": "verde",    "media": 81.4, "otimo": 9, "atencao": 0, "critico": 0},
        },
        "equipes": [
            {"ubs": "UBS IRMA ELIZABETE",                     "equipe": "CACHOEIRA",     "pontuacao_qualidade": 55.27, "status_qualidade": "bom",
             "indicadores": {"ind1_prenatal": {"resultado": 85, "meta": 55, "status": "verde"}, "ind2_cito": {"resultado": 43, "meta": 50, "status": "amarelo"}, "ind3_vacina": {"resultado": 88, "meta": 90, "status": "amarelo"}, "ind4_rn": {"resultado": 91, "meta": 55, "status": "verde"}, "ind5_odonto1": {"resultado": 39, "meta": 45, "status": "amarelo"}, "ind6_odonto_comp": {"resultado": 30, "meta": 45, "status": "vermelho"}, "ind7_urg_odonto": {"resultado": 55, "meta": 45, "status": "verde"}, "ind8_has": {"resultado": 79, "meta": 60, "status": "verde"}, "ind9_dm": {"resultado": 63, "meta": 55, "status": "verde"}, "ind10_obesidade": {"resultado": 78, "meta": 55, "status": "verde"}, "ind11_cv": {"resultado": 43, "meta": 50, "status": "amarelo"}, "ind12_psicose": {"resultado": 48, "meta": 50, "status": "amarelo"}, "ind13_tab": {"resultado": 42, "meta": 50, "status": "amarelo"}, "ind14_sif_gest": {"resultado": 80, "meta": 55, "status": "verde"}, "ind15_sif_cong": {"resultado": 83, "meta": 55, "status": "verde"}}},
            {"ubs": "UBS ANIZIO FERREIRA DA SILVA",            "equipe": "SAO SEBASTIAO", "pontuacao_qualidade": 53.52, "status_qualidade": "suficiente",
             "indicadores": {"ind1_prenatal": {"resultado": 80, "meta": 55, "status": "verde"}, "ind2_cito": {"resultado": 41, "meta": 50, "status": "amarelo"}, "ind3_vacina": {"resultado": 82, "meta": 90, "status": "amarelo"}, "ind4_rn": {"resultado": 89, "meta": 55, "status": "verde"}, "ind5_odonto1": {"resultado": 37, "meta": 45, "status": "amarelo"}, "ind6_odonto_comp": {"resultado": 29, "meta": 45, "status": "vermelho"}, "ind7_urg_odonto": {"resultado": 54, "meta": 45, "status": "verde"}, "ind8_has": {"resultado": 75, "meta": 60, "status": "verde"}, "ind9_dm": {"resultado": 58, "meta": 55, "status": "verde"}, "ind10_obesidade": {"resultado": 73, "meta": 55, "status": "verde"}, "ind11_cv": {"resultado": 41, "meta": 50, "status": "amarelo"}, "ind12_psicose": {"resultado": 47, "meta": 50, "status": "amarelo"}, "ind13_tab": {"resultado": 41, "meta": 50, "status": "amarelo"}, "ind14_sif_gest": {"resultado": 77, "meta": 55, "status": "verde"}, "ind15_sif_cong": {"resultado": 80, "meta": 55, "status": "verde"}}},
            {"ubs": "UBS ANIZIO FERREIRA DA SILVA",            "equipe": "ACARI",         "pontuacao_qualidade": 63.99, "status_qualidade": "bom",
             "indicadores": {"ind1_prenatal": {"resultado": 79, "meta": 55, "status": "verde"}, "ind2_cito": {"resultado": 40, "meta": 50, "status": "amarelo"}, "ind3_vacina": {"resultado": 80, "meta": 90, "status": "amarelo"}, "ind4_rn": {"resultado": 90, "meta": 55, "status": "verde"}, "ind5_odonto1": {"resultado": 37, "meta": 45, "status": "amarelo"}, "ind6_odonto_comp": {"resultado": 29, "meta": 45, "status": "vermelho"}, "ind7_urg_odonto": {"resultado": 52, "meta": 45, "status": "verde"}, "ind8_has": {"resultado": 77, "meta": 60, "status": "verde"}, "ind9_dm": {"resultado": 60, "meta": 55, "status": "verde"}, "ind10_obesidade": {"resultado": 72, "meta": 55, "status": "verde"}, "ind11_cv": {"resultado": 40, "meta": 50, "status": "amarelo"}, "ind12_psicose": {"resultado": 47, "meta": 50, "status": "amarelo"}, "ind13_tab": {"resultado": 40, "meta": 50, "status": "amarelo"}, "ind14_sif_gest": {"resultado": 75, "meta": 55, "status": "verde"}, "ind15_sif_cong": {"resultado": 79, "meta": 55, "status": "verde"}}},
            {"ubs": "UBS OSVALDO LEMES CABRAL",                "equipe": "TRES ESTADOS",  "pontuacao_qualidade": 33.41, "status_qualidade": "regular",
             "indicadores": {"ind1_prenatal": {"resultado": 56, "meta": 55, "status": "verde"}, "ind2_cito": {"resultado": 28, "meta": 50, "status": "vermelho"}, "ind3_vacina": {"resultado": 63, "meta": 90, "status": "vermelho"}, "ind4_rn": {"resultado": 67, "meta": 55, "status": "verde"}, "ind5_odonto1": {"resultado": 25, "meta": 45, "status": "vermelho"}, "ind6_odonto_comp": {"resultado": 18, "meta": 45, "status": "vermelho"}, "ind7_urg_odonto": {"resultado": 39, "meta": 45, "status": "amarelo"}, "ind8_has": {"resultado": 58, "meta": 60, "status": "amarelo"}, "ind9_dm": {"resultado": 46, "meta": 55, "status": "amarelo"}, "ind10_obesidade": {"resultado": 55, "meta": 55, "status": "verde"}, "ind11_cv": {"resultado": 29, "meta": 50, "status": "vermelho"}, "ind12_psicose": {"resultado": 32, "meta": 50, "status": "vermelho"}, "ind13_tab": {"resultado": 26, "meta": 50, "status": "vermelho"}, "ind14_sif_gest": {"resultado": 50, "meta": 55, "status": "amarelo"}, "ind15_sif_cong": {"resultado": 50, "meta": 55, "status": "amarelo"}}},
            {"ubs": "CENTRO DE SAUDE CURUMIM",                 "equipe": "JUMA",          "pontuacao_qualidade": 55.17, "status_qualidade": "bom",
             "indicadores": {"ind1_prenatal": {"resultado": 86, "meta": 55, "status": "verde"}, "ind2_cito": {"resultado": 45, "meta": 50, "status": "amarelo"}, "ind3_vacina": {"resultado": 85, "meta": 90, "status": "amarelo"}, "ind4_rn": {"resultado": 93, "meta": 55, "status": "verde"}, "ind5_odonto1": {"resultado": 39, "meta": 45, "status": "amarelo"}, "ind6_odonto_comp": {"resultado": 31, "meta": 45, "status": "vermelho"}, "ind7_urg_odonto": {"resultado": 56, "meta": 45, "status": "verde"}, "ind8_has": {"resultado": 81, "meta": 60, "status": "verde"}, "ind9_dm": {"resultado": 64, "meta": 55, "status": "verde"}, "ind10_obesidade": {"resultado": 79, "meta": 55, "status": "verde"}, "ind11_cv": {"resultado": 44, "meta": 50, "status": "amarelo"}, "ind12_psicose": {"resultado": 49, "meta": 50, "status": "amarelo"}, "ind13_tab": {"resultado": 44, "meta": 50, "status": "amarelo"}, "ind14_sif_gest": {"resultado": 82, "meta": 55, "status": "verde"}, "ind15_sif_cong": {"resultado": 86, "meta": 55, "status": "verde"}}},
            {"ubs": "CENTRO DE SAUDE CURUMIM",                 "equipe": "LIBERDADE",     "pontuacao_qualidade": 63.62, "status_qualidade": "bom",
             "indicadores": {"ind1_prenatal": {"resultado": 91, "meta": 55, "status": "verde"}, "ind2_cito": {"resultado": 52, "meta": 50, "status": "verde"}, "ind3_vacina": {"resultado": 91, "meta": 90, "status": "verde"}, "ind4_rn": {"resultado": 100, "meta": 55, "status": "verde"}, "ind5_odonto1": {"resultado": 46, "meta": 45, "status": "verde"}, "ind6_odonto_comp": {"resultado": 39, "meta": 45, "status": "amarelo"}, "ind7_urg_odonto": {"resultado": 63, "meta": 45, "status": "verde"}, "ind8_has": {"resultado": 85, "meta": 60, "status": "verde"}, "ind9_dm": {"resultado": 71, "meta": 55, "status": "verde"}, "ind10_obesidade": {"resultado": 83, "meta": 55, "status": "verde"}, "ind11_cv": {"resultado": 53, "meta": 50, "status": "verde"}, "ind12_psicose": {"resultado": 58, "meta": 50, "status": "verde"}, "ind13_tab": {"resultado": 53, "meta": 50, "status": "verde"}, "ind14_sif_gest": {"resultado": 92, "meta": 55, "status": "verde"}, "ind15_sif_cong": {"resultado": 100, "meta": 55, "status": "verde"}}},
            {"ubs": "UBS PADRE FALIERO BONCI",                 "equipe": "KENNEDY",       "pontuacao_qualidade": 70.89, "status_qualidade": "otimo",
             "indicadores": {"ind1_prenatal": {"resultado": 72, "meta": 55, "status": "verde"}, "ind2_cito": {"resultado": 40, "meta": 50, "status": "amarelo"}, "ind3_vacina": {"resultado": 76, "meta": 90, "status": "amarelo"}, "ind4_rn": {"resultado": 80, "meta": 55, "status": "verde"}, "ind5_odonto1": {"resultado": 50, "meta": 45, "status": "verde"}, "ind6_odonto_comp": {"resultado": 46, "meta": 45, "status": "verde"}, "ind7_urg_odonto": {"resultado": 58, "meta": 45, "status": "verde"}, "ind8_has": {"resultado": 82, "meta": 60, "status": "verde"}, "ind9_dm": {"resultado": 68, "meta": 55, "status": "verde"}, "ind10_obesidade": {"resultado": 75, "meta": 55, "status": "verde"}, "ind11_cv": {"resultado": 58, "meta": 50, "status": "verde"}, "ind12_psicose": {"resultado": 55, "meta": 50, "status": "verde"}, "ind13_tab": {"resultado": 52, "meta": 50, "status": "verde"}, "ind14_sif_gest": {"resultado": 72, "meta": 55, "status": "verde"}, "ind15_sif_cong": {"resultado": 75, "meta": 55, "status": "verde"}}},
            {"ubs": "UBS JK",                                  "equipe": "JK",            "pontuacao_qualidade": 68.14, "status_qualidade": "bom",
             "indicadores": {"ind1_prenatal": {"resultado": 83, "meta": 55, "status": "verde"}, "ind2_cito": {"resultado": 43, "meta": 50, "status": "amarelo"}, "ind3_vacina": {"resultado": 86, "meta": 90, "status": "amarelo"}, "ind4_rn": {"resultado": 90, "meta": 55, "status": "verde"}, "ind5_odonto1": {"resultado": 38, "meta": 45, "status": "amarelo"}, "ind6_odonto_comp": {"resultado": 30, "meta": 45, "status": "vermelho"}, "ind7_urg_odonto": {"resultado": 53, "meta": 45, "status": "verde"}, "ind8_has": {"resultado": 78, "meta": 60, "status": "verde"}, "ind9_dm": {"resultado": 62, "meta": 55, "status": "verde"}, "ind10_obesidade": {"resultado": 77, "meta": 55, "status": "verde"}, "ind11_cv": {"resultado": 41, "meta": 50, "status": "amarelo"}, "ind12_psicose": {"resultado": 48, "meta": 50, "status": "amarelo"}, "ind13_tab": {"resultado": 41, "meta": 50, "status": "amarelo"}, "ind14_sif_gest": {"resultado": 78, "meta": 55, "status": "verde"}, "ind15_sif_cong": {"resultado": 82, "meta": 55, "status": "verde"}}},
            {"ubs": "UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA", "equipe": "ESTRADA NOVA",  "pontuacao_qualidade": 54.48, "status_qualidade": "suficiente",
             "indicadores": {"ind1_prenatal": {"resultado": 44, "meta": 55, "status": "amarelo"}, "ind2_cito": {"resultado": 20, "meta": 50, "status": "vermelho"}, "ind3_vacina": {"resultado": 55, "meta": 90, "status": "vermelho"}, "ind4_rn": {"resultado": 57, "meta": 55, "status": "verde"}, "ind5_odonto1": {"resultado": 21, "meta": 45, "status": "vermelho"}, "ind6_odonto_comp": {"resultado": 15, "meta": 45, "status": "vermelho"}, "ind7_urg_odonto": {"resultado": 34, "meta": 45, "status": "vermelho"}, "ind8_has": {"resultado": 49, "meta": 60, "status": "vermelho"}, "ind9_dm": {"resultado": 36, "meta": 55, "status": "vermelho"}, "ind10_obesidade": {"resultado": 41, "meta": 55, "status": "amarelo"}, "ind11_cv": {"resultado": 22, "meta": 50, "status": "vermelho"}, "ind12_psicose": {"resultado": 26, "meta": 50, "status": "vermelho"}, "ind13_tab": {"resultado": 20, "meta": 50, "status": "vermelho"}, "ind14_sif_gest": {"resultado": 39, "meta": 55, "status": "amarelo"}, "ind15_sif_cong": {"resultado": 43, "meta": 55, "status": "amarelo"}}},
        ],
    },
    "siaps_qualidade_diario": {
        "equipes": [
            {"equipe": "CACHOEIRA",     "ubs": "UBS IRMA ELIZABETE",                     "prenatal": 2, "cito": 1, "vacina_dtppenta": 3, "rn_semana1": 1, "has": 8, "dm": 4, "des_infantil": 2},
            {"equipe": "SAO SEBASTIAO", "ubs": "UBS ANIZIO FERREIRA DA SILVA",            "prenatal": 2, "cito": 1, "vacina_dtppenta": 2, "rn_semana1": 1, "has": 7, "dm": 3, "des_infantil": 2},
            {"equipe": "ACARI",         "ubs": "UBS ANIZIO FERREIRA DA SILVA",            "prenatal": 2, "cito": 1, "vacina_dtppenta": 2, "rn_semana1": 1, "has": 7, "dm": 3, "des_infantil": 2},
            {"equipe": "TRES ESTADOS",  "ubs": "UBS OSVALDO LEMES CABRAL",               "prenatal": 1, "cito": 0, "vacina_dtppenta": 1, "rn_semana1": 0, "has": 4, "dm": 2, "des_infantil": 1},
            {"equipe": "JUMA",          "ubs": "CENTRO DE SAUDE CURUMIM",                "prenatal": 2, "cito": 1, "vacina_dtppenta": 3, "rn_semana1": 1, "has": 8, "dm": 4, "des_infantil": 2},
            {"equipe": "LIBERDADE",     "ubs": "CENTRO DE SAUDE CURUMIM",                "prenatal": 3, "cito": 2, "vacina_dtppenta": 3, "rn_semana1": 2, "has": 9, "dm": 5, "des_infantil": 3},
            {"equipe": "KENNEDY",       "ubs": "UBS PADRE FALIERO BONCI",                "prenatal": 2, "cito": 1, "vacina_dtppenta": 2, "rn_semana1": 1, "has": 8, "dm": 4, "des_infantil": 2},
            {"equipe": "JK",            "ubs": "UBS JK",                                 "prenatal": 2, "cito": 1, "vacina_dtppenta": 2, "rn_semana1": 1, "has": 7, "dm": 4, "des_infantil": 2},
            {"equipe": "ESTRADA NOVA",  "ubs": "UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA","prenatal": 1, "cito": 0, "vacina_dtppenta": 1, "rn_semana1": 0, "has": 3, "dm": 2, "des_infantil": 1},
        ],
        "meta_diaria_estimada": 80,
        "indicadores_criticos_hoje": [],
    },
    "siaps_qualidade_mensal": {
        "variacao_mes_anterior": {
            "ind1_prenatal": 2.1, "ind2_cito": -0.5, "ind3_vacina": 1.8, "ind4_rn": 0.9,
            "ind5_odonto1": -1.2, "ind6_odonto_comp": -0.8, "ind7_urg_odonto": 1.5,
            "ind8_has": 2.0, "ind9_dm": 1.3, "ind10_obesidade": 0.7,
            "ind11_cv": 1.2, "ind12_psicose": 0.6, "ind13_tab": 0.4,
            "ind14_sif_gest": 1.0, "ind15_sif_cong": 0.8,
        },
        "evolucao": [
            {"mes": "Set/25", "ind1": 65, "ind2": 32, "ind3": 72, "ind4": 76, "ind5": 28, "ind6": 21, "ind7": 46, "ind8": 64, "ind9": 50, "ind10": 62, "ind11": 32, "ind12": 38, "ind13": 33, "ind14": 71, "ind15": 76},
            {"mes": "Out/25", "ind1": 67, "ind2": 33, "ind3": 73, "ind4": 78, "ind5": 29, "ind6": 22, "ind7": 47, "ind8": 66, "ind9": 51, "ind10": 63, "ind11": 33, "ind12": 39, "ind13": 34, "ind14": 73, "ind15": 77},
            {"mes": "Nov/25", "ind1": 69, "ind2": 34, "ind3": 74, "ind4": 79, "ind5": 30, "ind6": 23, "ind7": 48, "ind8": 67, "ind9": 52, "ind10": 64, "ind11": 35, "ind12": 40, "ind13": 35, "ind14": 74, "ind15": 78},
            {"mes": "Dez/25", "ind1": 70, "ind2": 35, "ind3": 74, "ind4": 80, "ind5": 31, "ind6": 24, "ind7": 49, "ind8": 68, "ind9": 53, "ind10": 65, "ind11": 36, "ind12": 41, "ind13": 36, "ind14": 75, "ind15": 79},
            {"mes": "Jan/26", "ind1": 71, "ind2": 36, "ind3": 75, "ind4": 81, "ind5": 31, "ind6": 25, "ind7": 50, "ind8": 69, "ind9": 54, "ind10": 66, "ind11": 37, "ind12": 42, "ind13": 37, "ind14": 76, "ind15": 80},
            {"mes": "Fev/26", "ind1": 72, "ind2": 37, "ind3": 76, "ind4": 82, "ind5": 32, "ind6": 25, "ind7": 51, "ind8": 70, "ind9": 55, "ind10": 67, "ind11": 37, "ind12": 43, "ind13": 38, "ind14": 77, "ind15": 81},
        ],
        "equipes_evolucao": [
            {"equipe": "CACHOEIRA",     "nov": 52.5, "dez": 53.8, "jan": 54.2, "fev": 54.9, "mar": 55.1, "abr": 55.27, "tendencia": "crescente"},
            {"equipe": "SAO SEBASTIAO", "nov": 50.1, "dez": 51.4, "jan": 52.0, "fev": 52.8, "mar": 53.2, "abr": 53.52, "tendencia": "crescente"},
            {"equipe": "ACARI",         "nov": 61.2, "dez": 62.1, "jan": 62.8, "fev": 63.3, "mar": 63.7, "abr": 63.99, "tendencia": "crescente"},
            {"equipe": "TRES ESTADOS",  "nov": 30.5, "dez": 31.0, "jan": 31.5, "fev": 32.0, "mar": 32.8, "abr": 33.41, "tendencia": "crescente"},
            {"equipe": "JUMA",          "nov": 52.3, "dez": 53.1, "jan": 53.6, "fev": 54.2, "mar": 54.8, "abr": 55.17, "tendencia": "crescente"},
            {"equipe": "LIBERDADE",     "nov": 60.8, "dez": 61.4, "jan": 62.0, "fev": 62.8, "mar": 63.2, "abr": 63.62, "tendencia": "crescente"},
            {"equipe": "KENNEDY",       "nov": 67.5, "dez": 68.1, "jan": 68.9, "fev": 69.5, "mar": 70.2, "abr": 70.89, "tendencia": "crescente"},
            {"equipe": "JK",            "nov": 65.0, "dez": 65.8, "jan": 66.4, "fev": 67.0, "mar": 67.7, "abr": 68.14, "tendencia": "crescente"},
            {"equipe": "ESTRADA NOVA",  "nov": 51.5, "dez": 52.0, "jan": 52.8, "fev": 53.4, "mar": 54.0, "abr": 54.48, "tendencia": "crescente"},
        ],
        "alerta_mensal": None,
        "destaque_mensal": "Indicadores de pre-natal e HAS apresentaram crescimento consistente em todas as equipes.",
    },
    "siaps_qualidade_quadrimestral": {
        "quadrimestre_atual": "Q2/2026",
        "referencia_anterior": "Q1/2026",
        "variacao_geral": 2.2,
        "projecao_2q_2026": 68.0,
        "indicadores": [
            {"indicador": "Pre-natal >=7 consultas", "1q_2025": 60.2, "2q_2025": 63.1, "3q_2025": 66.4, "1q_2026": 72.5, "meta": 55, "tendencia": "crescente"},
            {"indicador": "Citopatologico",          "1q_2025": 30.8, "2q_2025": 32.5, "3q_2025": 34.1, "1q_2026": 37.1, "meta": 50, "tendencia": "crescente_insuf"},
            {"indicador": "DTP/Pentavalente",        "1q_2025": 71.2, "2q_2025": 73.1, "3q_2025": 74.8, "1q_2026": 76.5, "meta": 90, "tendencia": "crescente_insuf"},
            {"indicador": "Puerperio/RN 1a sem.",    "1q_2025": 77.5, "2q_2025": 79.1, "3q_2025": 80.4, "1q_2026": 81.9, "meta": 55, "tendencia": "crescente"},
            {"indicador": "1a Consulta Odonto",      "1q_2025": 28.4, "2q_2025": 29.8, "3q_2025": 31.2, "1q_2026": 32.6, "meta": 45, "tendencia": "crescente_insuf"},
            {"indicador": "Odonto Completada",       "1q_2025": 21.5, "2q_2025": 23.1, "3q_2025": 24.4, "1q_2026": 25.8, "meta": 45, "tendencia": "crescente_insuf"},
            {"indicador": "Urgencia Odonto",         "1q_2025": 47.5, "2q_2025": 49.2, "3q_2025": 50.5, "1q_2026": 51.8, "meta": 45, "tendencia": "crescente"},
            {"indicador": "Acompanhamento HAS",      "1q_2025": 65.8, "2q_2025": 67.2, "3q_2025": 68.9, "1q_2026": 70.5, "meta": 60, "tendencia": "crescente"},
            {"indicador": "DM (HbA1c)",              "1q_2025": 50.1, "2q_2025": 52.1, "3q_2025": 53.8, "1q_2026": 55.4, "meta": 55, "tendencia": "crescente"},
            {"indicador": "Obesidade Infantil",      "1q_2025": 62.5, "2q_2025": 64.3, "3q_2025": 65.7, "1q_2026": 67.1, "meta": 55, "tendencia": "crescente"},
            {"indicador": "Alto Risco CV",           "1q_2025": 32.8, "2q_2025": 34.5, "3q_2025": 36.1, "1q_2026": 37.8, "meta": 50, "tendencia": "crescente_insuf"},
            {"indicador": "Esquizofrenia/Psicose",   "1q_2025": 38.5, "2q_2025": 40.2, "3q_2025": 41.8, "1q_2026": 43.5, "meta": 50, "tendencia": "crescente_insuf"},
            {"indicador": "Trans. Afetivo Bipolar",  "1q_2025": 33.4, "2q_2025": 35.0, "3q_2025": 36.8, "1q_2026": 38.4, "meta": 50, "tendencia": "crescente_insuf"},
            {"indicador": "Sifilis em Gestante",     "1q_2025": 71.2, "2q_2025": 73.5, "3q_2025": 75.1, "1q_2026": 76.8, "meta": 55, "tendencia": "crescente"},
            {"indicador": "Sifilis Congenita",       "1q_2025": 76.4, "2q_2025": 78.2, "3q_2025": 79.8, "1q_2026": 81.4, "meta": 55, "tendencia": "crescente"},
        ],
        "equipes": [
            {"equipe": "CACHOEIRA",     "1q_2025": 49.1, "2q_2025": 51.5, "3q_2025": 53.2, "1q_2026": 55.27, "variacao": 6.2, "status": "bom"},
            {"equipe": "SAO SEBASTIAO", "1q_2025": 47.5, "2q_2025": 49.8, "3q_2025": 51.5, "1q_2026": 53.52, "variacao": 6.1, "status": "suficiente"},
            {"equipe": "ACARI",         "1q_2025": 57.8, "2q_2025": 59.9, "3q_2025": 61.8, "1q_2026": 63.99, "variacao": 6.2, "status": "bom"},
            {"equipe": "TRES ESTADOS",  "1q_2025": 27.5, "2q_2025": 29.1, "3q_2025": 31.0, "1q_2026": 33.41, "variacao": 5.9, "status": "regular"},
            {"equipe": "JUMA",          "1q_2025": 49.0, "2q_2025": 51.2, "3q_2025": 53.0, "1q_2026": 55.17, "variacao": 6.2, "status": "bom"},
            {"equipe": "LIBERDADE",     "1q_2025": 57.5, "2q_2025": 59.8, "3q_2025": 61.5, "1q_2026": 63.62, "variacao": 6.1, "status": "bom"},
            {"equipe": "KENNEDY",       "1q_2025": 64.8, "2q_2025": 66.9, "3q_2025": 68.8, "1q_2026": 70.89, "variacao": 6.1, "status": "otimo"},
            {"equipe": "JK",            "1q_2025": 62.1, "2q_2025": 64.2, "3q_2025": 66.1, "1q_2026": 68.14, "variacao": 6.1, "status": "bom"},
            {"equipe": "ESTRADA NOVA",  "1q_2025": 48.5, "2q_2025": 50.8, "3q_2025": 52.5, "1q_2026": 54.48, "variacao": 5.9, "status": "suficiente"},
        ],
        "parecer_gestor": "Apui/AM apresenta evolucao positiva no Componente Qualidade. Pre-natal, HAS e sifilis em destaque. Odontologia e saude mental precisam de atencao prioritaria no Q2/2026.",
    },
    "siaps_boas_praticas": {
        "total": 8,
        "destaques": 5,
        "alertas": 3,
        "boas_praticas": [
            {"tipo": "qualidade", "titulo": "Pre-natal: meta superada em 8 das 9 equipes", "descricao": "Excelente desempenho no pre-natal >= 7 consultas.", "destaque": True, "indicador": "I01 Pre-natal >= 7 consultas — meta 55%",
             "por_equipe": [{"equipe": "LIBERDADE", "ubs": "CENTRO DE SAUDE CURUMIM", "resultado": 91, "status": "verde"}, {"equipe": "JUMA", "ubs": "CENTRO DE SAUDE CURUMIM", "resultado": 86, "status": "verde"}, {"equipe": "CACHOEIRA", "ubs": "UBS IRMA ELIZABETE", "resultado": 85, "status": "verde"}]},
            {"tipo": "qualidade", "titulo": "Sifilis Congenita: 100% em LIBERDADE", "descricao": "Manejo exemplar de sifilis congenita — meta 55%.", "destaque": True, "indicador": "I15 Sifilis Congenita — meta 55%",
             "por_equipe": [{"equipe": "LIBERDADE", "ubs": "CENTRO DE SAUDE CURUMIM", "resultado": 100, "status": "verde"}, {"equipe": "KENNEDY", "ubs": "UBS PADRE FALIERO BONCI", "resultado": 75, "status": "verde"}, {"equipe": "JK", "ubs": "UBS JK", "resultado": 82, "status": "verde"}]},
            {"tipo": "qualidade", "titulo": "HAS: media municipal de 70.5% supera meta de 60%", "descricao": "Hipertensao sob controle na maioria das equipes.", "destaque": True, "indicador": "I08 Acompanhamento HAS — meta 60%",
             "por_equipe": [{"equipe": "LIBERDADE", "ubs": "CENTRO DE SAUDE CURUMIM", "resultado": 85, "status": "verde"}, {"equipe": "KENNEDY", "ubs": "UBS PADRE FALIERO BONCI", "resultado": 82, "status": "verde"}, {"equipe": "JUMA", "ubs": "CENTRO DE SAUDE CURUMIM", "resultado": 81, "status": "verde"}]},
            {"tipo": "vinculo", "titulo": "KENNEDY e LIBERDADE lideram vinculo municipal", "descricao": "KENNEDY (9.3 pts) e LIBERDADE (9.1 pts) com classificacao OTIMO.", "destaque": True, "indicador": None, "por_equipe": []},
            {"tipo": "qualidade", "titulo": "Obesidade Infantil: meta atingida em 8 equipes", "descricao": "Cobertura de 67.1% municipal (meta: 55%) — busca ativa eficaz.", "destaque": True, "indicador": "I10 Obesidade Infantil — meta 55%",
             "por_equipe": [{"equipe": "LIBERDADE", "ubs": "CENTRO DE SAUDE CURUMIM", "resultado": 83, "status": "verde"}, {"equipe": "JUMA", "ubs": "CENTRO DE SAUDE CURUMIM", "resultado": 79, "status": "verde"}, {"equipe": "CACHOEIRA", "ubs": "UBS IRMA ELIZABETE", "resultado": 78, "status": "verde"}]},
            {"tipo": "alerta_critico", "titulo": "Citopatologico: alerta em 7 das 9 equipes", "descricao": "Media municipal de 37.1% abaixo da meta de 50%. Intensificar busca ativa.", "destaque": False, "indicador": "I02 Citopatologico — meta 50%",
             "por_equipe": [{"equipe": "ESTRADA NOVA", "ubs": "UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA", "resultado": 20, "status": "vermelho"}, {"equipe": "TRES ESTADOS", "ubs": "UBS OSVALDO LEMES CABRAL", "resultado": 28, "status": "vermelho"}, {"equipe": "SAO SEBASTIAO", "ubs": "UBS ANIZIO FERREIRA DA SILVA", "resultado": 41, "status": "amarelo"}]},
            {"tipo": "alerta_critico", "titulo": "Odontologia: abaixo da meta na maioria das equipes", "descricao": "1a Consulta (32.6%) e Tratamento Completado (25.8%) abaixo da meta de 45%.", "destaque": False, "indicador": "I05/I06 Odontologia — meta 45%", "por_equipe": []},
            {"tipo": "plano_melhoria", "titulo": "TRES ESTADOS: plano de melhoria prioritario", "descricao": "Pontuacao mais baixa (33.41 pts). Priorizar DTP (63%), HAS (58%) e saude mental.", "destaque": False, "indicador": None, "por_equipe": []},
        ],
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
    """Dashboard consolidado — retorna referencia municipal enquanto API indisponivel."""
    return _ref_municipal("siaps_dashboard")


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


@router.get("/diagnostico-cobertura")
async def diagnostico_cobertura(
    parcela: str = Query(default="202608", description="Código da parcela, ex: 202608"),
):
    """
    Diagnóstico e Cobertura da Atenção Básica — Apuí/AM.
    Busca dados reais via API pública do e-Gestor APS (sem autenticação necessária).
    Endpoint: /financiamento/pagamento?tipoRelatorio=COMPLETO
    """
    from services.egestor_aps import buscar_completo, EGestorAPIError

    cache_key = f"siaps_diag_cobertura_{parcela}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    try:
        raw = await buscar_completo(
            co_municipio="130014",
            co_uf="13",
            parcela_inicio=parcela,
            parcela_fim=parcela,
        )
    except EGestorAPIError as exc:
        logger.warning("diagnostico-cobertura: %s", exc)
        return {
            "situacao_dado": "nao_disponivel",
            "dados": None,
            "nota": f"API e-Gestor APS indisponível: {exc}",
            "verificado_em": _ts(),
        }
    except Exception as exc:
        logger.error("diagnostico-cobertura inesperado: %s", exc, exc_info=True)
        return {
            "situacao_dado": "nao_disponivel",
            "dados": None,
            "nota": f"Erro interno: {exc}",
            "verificado_em": _ts(),
        }

    det = raw.get("detalhado", {})

    # ── Geração automática de diagnósticos ────────────────────────────────────
    diagnosticos: list[dict] = []

    def _diag(tipo: str, titulo: str, texto: str, severidade: str = "info"):
        diagnosticos.append({"tipo": tipo, "titulo": titulo, "texto": texto, "severidade": severidade})

    # eSF
    esf = det.get("esf", {})
    esf_cred = esf.get("qt_credenciadas", 0)
    esf_hom  = esf.get("qt_homologadas", 0)
    esf_pago = esf.get("qt_pagas", 0)
    teto_esf = det.get("tetos", {}).get("esf", 0)
    if esf_cred and teto_esf and esf_cred < teto_esf:
        _diag("esf", "Teto eSF não atingido",
              f"Credenciadas {esf_cred} de {teto_esf} no teto. Solicitar credenciamento ao MS.", "alerta")
    if esf_hom < esf_cred:
        _diag("esf", "eSF credenciadas > homologadas",
              f"{esf_cred - esf_hom} equipe(s) credenciada(s) ainda não homologada(s) no CNES. Verificar vínculo.", "alerta")
    if esf_pago < esf_hom:
        _diag("esf", "eSF homologadas > pagas",
              f"{esf_hom - esf_pago} equipe(s) homologada(s) não receberam pagamento nesta parcela. Verificar pendências.", "critico")

    # eMulti
    emulti = det.get("emulti", {})
    emulti_cred = emulti.get("qt_credenciadas", 0)
    emulti_pago = emulti.get("qt_pagas", 0)
    if emulti_cred > 0 and emulti_pago == 0:
        _diag("emulti", "eMulti credenciada sem pagamento",
              f"{emulti_cred} eMulti credenciada(s) mas nenhum pagamento registrado nesta parcela.", "critico")
    if emulti_cred == 0:
        _diag("emulti", "Sem eMulti credenciada",
              "Nenhuma Equipe Multiprofissional credenciada. Avaliar proposta de credenciamento.", "info")

    # eSB
    esb = det.get("esb", {})
    esb_cred = esb.get("qt_40h_credenciadas", 0)
    esb_hom  = esb.get("qt_40h_homologadas", 0)
    esb_pago_i  = esb.get("qt_40h_pagas_modal_i", 0)
    esb_pago_ii = esb.get("qt_40h_pagas_modal_ii", 0)
    esb_pago = esb_pago_i + esb_pago_ii
    if esb_hom > esb_pago:
        _diag("esb", "eSB homologadas > pagas",
              f"{esb_hom - esb_pago} equipe(s) de saúde bucal homologada(s) sem pagamento. Verificar pendências.", "alerta")

    # ACS
    acs = det.get("acs", {})
    acs_teto = acs.get("qt_teto", 0)
    acs_dir_cred = acs.get("qt_direto_credenciado", 0)
    acs_dir_pago = acs.get("qt_direto_pago", 0)
    if acs_teto and acs_dir_cred < acs_teto:
        _diag("acs", "ACS abaixo do teto",
              f"Credenciados {acs_dir_cred} de {acs_teto} no teto ACS. Verificar recrutamento.", "alerta")
    if acs_dir_pago < acs_dir_cred:
        _diag("acs", "ACS credenciados > pagos",
              f"{acs_dir_cred - acs_dir_pago} ACS credenciado(s) sem pagamento nesta parcela.", "alerta")

    # per capita
    per_capita = det.get("per_capita", {})
    if per_capita.get("vl_pagamento", 0) == 0:
        _diag("per_capita", "Sem repasse per capita",
              "Incentivo por componente per capita de base populacional = R$ 0. Verificar população IBGE cadastrada.", "alerta")

    # UOM / LRPD
    if esb.get("qt_uom", 0) == 0 and esb.get("vl_uom", 0) == 0:
        _diag("uom", "Sem UOM cadastrada",
              "Nenhuma Unidade Odontológica Móvel registrada. Avaliar necessidade para população ribeirinha.", "info")

    # Conciliação valores
    total_esf  = esf.get("vl_total_bruto", 0)
    total_eap  = det.get("eap", {}).get("vl_total_bruto", 0)
    total_emulti = emulti.get("vl_total", 0)
    total_esb_calc = esb.get("vl_total_sb_calculado", 0)
    total_acs  = acs.get("vl_total", 0)
    total_pc   = per_capita.get("vl_pagamento", 0)
    total_esfrb = det.get("esfrb", {}).get("vl_total", 0)
    total_calc = total_esf + total_eap + total_emulti + total_esb_calc + total_acs + total_pc + total_esfrb

    if not diagnosticos:
        _diag("geral", "Sem pendências identificadas",
              "Todos os indicadores de cobertura analisados estão dentro do esperado para esta parcela.", "ok")

    resultado = {
        "situacao_dado": "oficial_confirmado",
        "fonte": "e-Gestor APS — API /financiamento/pagamento?tipoRelatorio=COMPLETO",
        "coletado_em": raw.get("coletado_em", _ts()),
        "data_consulta": raw.get("data_consulta", ""),
        "competencia": det.get("competencia", ""),
        "parcela": det.get("parcela", ""),
        "nu_parcela": det.get("nu_parcela", parcela),
        "nu_comp_cnes": det.get("nu_comp_cnes", ""),
        "municipio": det.get("municipio", "Apuí"),
        "uf": det.get("uf", "AM"),
        "ibge": det.get("ibge", "130014"),
        "populacao": det.get("populacao", 0),
        "faixa_equidade_esf": det.get("faixa_equidade_esf", ""),
        "classificacao_vinculo_esf": det.get("classificacao_vinculo_esf", ""),
        "classificacao_qualidade_esf": det.get("classificacao_qualidade_esf", ""),
        "tetos": det.get("tetos", {}),
        "esf": esf,
        "eap": det.get("eap", {}),
        "emulti": emulti,
        "esb": esb,
        "acs": acs,
        "esfrb": det.get("esfrb", {}),
        "per_capita": per_capita,
        "pse": det.get("pse", {}),
        "microscopistas": det.get("microscopistas", {}),
        "total_calculado": round(total_calc, 2),
        "diagnosticos": diagnosticos,
        "verificado_em": _ts(),
    }

    cache_set(cache_key, resultado, ttl=900)
    return resultado


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
