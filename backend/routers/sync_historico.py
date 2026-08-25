"""
ERSUS360 — Extração Histórica SIAPS / e-Gestor / RNDS
Endpoint de disparo manual para buscar indicadores de Jan–Ago/2026 de todas as equipes.
"""
from __future__ import annotations
import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import httpx
from fastapi import APIRouter, Depends, BackgroundTasks

from routers.auth import get_current_user, UserOut
from services.cache_service import cache_get, cache_set

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/sync", tags=["sync-historico"])

# ── Constantes ────────────────────────────────────────────────────────────────
IBGE       = "1300144"
IBGE_CURTO = "130014"
APISIAPS   = "https://apisiaps.saude.gov.br"
EGESTOR    = "https://egestorab.saude.gov.br/api/v1"
DADOSAB    = "https://apidadosabertos.saude.gov.br"
TIMEOUT    = 20.0

_CACHE_DIR = Path("/tmp/ersus_pec_cache")
_CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Competências do exercício 2026 a extrair
COMPETENCIAS_2026 = [
    "202601", "202602", "202603", "202604",
    "202605", "202606", "202607", "202608",
]
COMP_LABEL = {
    "202601": "Jan/2026", "202602": "Fev/2026", "202603": "Mar/2026",
    "202604": "Abr/2026", "202605": "Mai/2026", "202606": "Jun/2026",
    "202607": "Jul/2026", "202608": "Ago/2026",
}

# Status da última extração (em memória — apenas informativo)
_STATUS: dict = {
    "em_andamento": False,
    "inicio": None,
    "fim": None,
    "competencias_ok": [],
    "competencias_falha": [],
    "equipes_total": 0,
    "log": [],
}


def _comp_iso(c: str) -> str:
    """'202605' → '2026-05'"""
    return f"{c[:4]}-{c[4:]}"


def _cache_path(competencia_iso: str) -> Path:
    return _CACHE_DIR / f"indicadores_{competencia_iso.replace('-','')}.json"


def _salvar_pec_cache(competencia_iso: str, equipes: dict[str, dict[str, float]],
                      tipos: dict[str, str], fonte: str):
    """Salva no mesmo formato esperado por ComponenteQualidade via /api/pec/indicadores."""
    registro = {
        "competencia": competencia_iso,
        "equipes": equipes,
        "tipos_equipe": tipos,
        "ultima_atualizacao": datetime.utcnow().isoformat(),
        "fonte": fonte,
    }
    p = _cache_path(competencia_iso)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(registro, f, ensure_ascii=False)
    log.info("PEC cache salvo: %s → %d equipes", p.name, len(equipes))


# ── Mapeamento SIAPS (ind*) → códigos PAP ────────────────────────────────────
def _siaps_para_pap(inds: dict[str, Any]) -> dict[str, float]:
    """
    Converte dict de indicadores SIAPS para códigos PAP Portaria 3.493/2024.
    Aceita chaves: 'ind1', 'ind1_prenatal', 'ind1_prenatal.resultado', etc.
    """
    def _v(*keys: str) -> float | None:
        for k in keys:
            v = inds.get(k)
            if v is None:
                continue
            if isinstance(v, (int, float)):
                return float(v)
            if isinstance(v, dict):
                r = v.get("resultado") or v.get("valor") or v.get("score")
                if r is not None:
                    return float(r)
        return None

    out: dict[str, float] = {}

    # C2 — Saúde da Criança (DTP/Pentavalente = ind3)
    v = _v("ind3", "ind3_vacina", "C2", "vacina")
    if v is not None:
        out["C2"] = round(v, 1)

    # C3 — Gestação e Puerpério (média pré-natal ind1 + puerpério ind4)
    i1 = _v("ind1", "ind1_prenatal", "prenatal")
    i4 = _v("ind4", "ind4_rn", "puerperio", "rn")
    if i1 is not None and i4 is not None:
        out["C3"] = round((i1 + i4) / 2, 1)
    elif i1 is not None:
        out["C3"] = round(i1, 1)
    elif i4 is not None:
        out["C3"] = round(i4, 1)

    # C4 — Diabetes Mellitus (ind9 = HbA1c)
    v = _v("ind9", "ind9_dm", "dm", "diabetes", "C4")
    if v is not None:
        out["C4"] = round(v, 1)

    # C5 — Hipertensão Arterial (ind8)
    v = _v("ind8", "ind8_has", "has", "hipertensao", "C5")
    if v is not None:
        out["C5"] = round(v, 1)

    # C7 — Prevenção do Câncer do Colo (ind2 = citopatológico)
    v = _v("ind2", "ind2_cito", "cito", "cancer", "C7")
    if v is not None:
        out["C7"] = round(v, 1)

    # B1 — 1ª Consulta Odontológica Programada (ind5)
    v = _v("ind5", "ind5_odonto1", "odonto1", "B1")
    if v is not None:
        out["B1"] = round(v, 1)

    # B2 — Tratamento Odontológico Concluído (ind6)
    v = _v("ind6", "ind6_odonto_comp", "odonto_comp", "B2")
    if v is not None:
        out["B2"] = round(v, 1)

    # R2-R6 = espelho de C2-C7 para equipes ribeirinhas
    if "C2" in out:
        out["R2"] = out["C2"]
    if "C3" in out:
        out["R3"] = out["C3"]
    if "C4" in out:
        out["R4"] = out["C4"]
    if "C5" in out:
        out["R5"] = out["C5"]
    if "C7" in out:
        out["R6"] = out["C7"]

    return out


def _normalizar_nome_equipe(nome: str) -> str:
    """Normaliza nome da equipe para chave do mapa."""
    m = {
        "SAO SEBASTIAO": "SÃO SEBASTIÃO",
        "SÃO SEBASTIAO": "SÃO SEBASTIÃO",
        "TRES ESTADOS": "TRÊS ESTADOS",
        "TRES ESTADO": "TRÊS ESTADOS",
    }
    n = nome.upper().strip()
    return m.get(n, n)


# ── Cliente HTTP com auth SIAPS ────────────────────────────────────────────────
async def _get_token() -> str:
    """Tenta obter token SIAPS de várias formas."""
    # Token estático
    token = (os.getenv("EGESTOR_TOKEN") or os.getenv("SIAPS_TOKEN") or "").strip()
    if token:
        return token

    cpf   = os.getenv("SIAPS_CPF", "").replace(".", "").replace("-", "").strip()
    senha = os.getenv("SIAPS_SENHA", "").strip()
    rt    = os.getenv("SIAPS_REFRESH_TOKEN", "").strip()

    # Tenta refresh_token
    if rt:
        try:
            async with httpx.AsyncClient(timeout=15, verify=False) as c:
                r = await c.post(
                    "https://apiautenticacao-aps.saude.gov.br/auth/refresh-token",
                    headers={"Authorization": f"Bearer {rt}", "Accept": "application/json"},
                )
                if r.status_code == 200:
                    body = r.json()
                    t = body.get("access_token", "")
                    if t:
                        return t
        except Exception as e:
            log.debug("refresh_token falhou: %s", e)

    if not cpf or not senha:
        return ""

    # Login direto SIAPS
    try:
        async with httpx.AsyncClient(timeout=15, verify=False, follow_redirects=True) as c:
            r = await c.post(
                "https://siaps.saude.gov.br/api/auth/login",
                json={"cpf": cpf, "senha": senha},
                headers={"Content-Type": "application/json"},
            )
            if r.status_code in (200, 201):
                t = r.json().get("access_token") or r.json().get("token", "")
                if t:
                    return t
    except Exception as e:
        log.debug("login SIAPS falhou: %s", e)

    # OAuth2 gov.br
    for client_id in ("siaps", "egestor-aps"):
        try:
            async with httpx.AsyncClient(timeout=15, verify=False) as c:
                r = await c.post(
                    "https://sso.acesso.gov.br/oauth2/token",
                    data={"grant_type": "password", "username": cpf, "password": senha,
                          "scope": "openid profile", "client_id": client_id},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                if r.status_code == 200:
                    t = r.json().get("access_token", "")
                    if t:
                        return t
        except Exception:
            pass

    return ""


async def _siaps_get(url: str, params: dict, token: str) -> Any | None:
    hdrs = {
        "Accept": "application/json",
        "User-Agent": "ERSUS360/2.0 FMS-Apui-AM",
    }
    if token:
        hdrs["Authorization"] = f"Bearer {token}"
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, verify=False, follow_redirects=True) as c:
            r = await c.get(url, params=params, headers=hdrs)
            if r.status_code == 200:
                return r.json()
    except Exception as e:
        log.debug("GET %s → %s", url, e)
    return None


def _parse_equipes_siaps(raw: Any, comp: str) -> dict[str, dict[str, float]] | None:
    """
    Tenta extrair equipes+indicadores de qualquer formato de resposta SIAPS.
    Retorna {nome_equipe: {C4: 63.0, C5: 79.0, ...}}
    """
    items = []
    if isinstance(raw, list):
        items = raw
    elif isinstance(raw, dict):
        for k in ("equipes", "data", "items", "results", "content", "list"):
            v = raw.get(k)
            if isinstance(v, list):
                items = v
                break
        # Estrutura flat {equipe: {ind*}}
        if not items and any(isinstance(v, dict) for v in raw.values()):
            # Pode ser {nomEquipe: {ind1:X, ind2:Y}} diretamente
            equipes_out = {}
            for nome, inds in raw.items():
                if isinstance(inds, dict) and any(k.startswith("ind") for k in inds):
                    nome_n = _normalizar_nome_equipe(str(nome))
                    pap = _siaps_para_pap(inds)
                    if pap:
                        equipes_out[nome_n] = pap
            if equipes_out:
                return equipes_out

    if not items:
        return None

    equipes_out = {}
    for e in items:
        if not isinstance(e, dict):
            continue
        nome = (
            e.get("nomeEquipe") or e.get("nome") or
            e.get("equipe") or e.get("ds_equipe") or
            e.get("nmEquipe") or ""
        )
        if not nome:
            continue
        nome_n = _normalizar_nome_equipe(str(nome))

        # Indicadores podem estar em sub-dicts ou flat
        inds_raw = e.get("indicadores") or e.get("indicators") or {}
        if not inds_raw:
            # Tenta campos flat no próprio dict
            inds_raw = {k: v for k, v in e.items()
                        if k.startswith("ind") or k in ("C1","C2","C3","C4","C5","C6","C7",
                                                          "B1","B2","B3","B4","M1","M2")}

        pap = _siaps_para_pap(inds_raw)
        if pap:
            equipes_out[nome_n] = pap

    return equipes_out if equipes_out else None


async def _extrair_competencia(comp: str, token: str) -> dict[str, dict[str, float]] | None:
    """
    Tenta extrair dados de indicadores para a competência dada via múltiplos endpoints SIAPS.
    comp: '202605'
    """
    ano  = int(comp[:4])
    mes  = int(comp[4:])
    quad = 1 if mes <= 4 else (2 if mes <= 8 else 3)

    endpoints = [
        # Endpoints autenticados SIAPS
        (f"{APISIAPS}/componente/cq/visao-por-competencia",
         {"coMunicipioIbge": IBGE, "tiposEquipe": "eSF,eAP,eSB,eMulti,eSFR",
          "stEquipeHomologada": "S", "nuMes": mes, "nuAno": ano, "nivelVisualizacao": "equipe"}),
        (f"{APISIAPS}/componente/cq/visao-por-equipe",
         {"coMunicipioIbge": IBGE, "nuMes": mes, "nuAno": ano, "stEquipeHomologada": "S"}),
        (f"{APISIAPS}/api/componente/equipe",
         {"coMunicipioIbge": IBGE, "nuQuadrimestre": quad, "nuAno": ano, "coTipoIndicador": "QUALIDADE"}),
        (f"{APISIAPS}/api/componente/qualidade/municipio/{IBGE}/equipe",
         {"nuQuadrimestre": quad, "nuAno": ano}),
        # Endpoints públicos
        (f"{APISIAPS}/api/public/componente/indicador-quadrimestre",
         {"coMunicipioIbge": IBGE, "nuQuadrimestre": quad, "nuAno": ano,
          "coTipoIndicador": "QUALIDADE", "size": 50}),
        (f"{APISIAPS}/api/public/indicadores/municipio/{IBGE}",
         {"competencia": comp, "tipoIndicador": "QUALIDADE"}),
        # eGestor APS
        (f"{EGESTOR}/relatorio/municipio/{IBGE}/componenteQualidade",
         {"competencia": comp}),
        (f"{EGESTOR}/siaps/qualidade/municipio/{IBGE}/equipes",
         {"competencia": comp}),
        (f"{EGESTOR}/relatorio/municipio/{IBGE_CURTO}/componenteQualidade",
         {"competencia": comp}),
        # Dados Abertos
        (f"{DADOSAB}/siaps/componentes/qualidade",
         {"ibge": IBGE, "competencia": comp}),
        (f"{DADOSAB}/indicadores-aps/municipio/{IBGE}",
         {"competencia": comp, "tipo": "QUALIDADE"}),
    ]

    for url, params in endpoints:
        try:
            raw = await _siaps_get(url, params, token)
            if raw:
                equipes = _parse_equipes_siaps(raw, comp)
                if equipes:
                    log.info("SIAPS extraiu %s: %d equipes via %s", comp, len(equipes), url)
                    return equipes
        except Exception as e:
            log.debug("%s %s → %s", url, params, e)

    return None


# ── RNDS FHIR R4 — extração de dados laboratoriais e vacinais ─────────────────
RNDS_BASE = os.getenv("RNDS_URL", "https://ehr.saude.gov.br")

# Mapeamento: LOINC/SNOMED/TUSS → código PAP do indicador
_FHIR_CODE_PAP: dict[str, str] = {
    # C4 — Diabetes (HbA1c)
    "4548-4":    "C4",   # LOINC HbA1c %
    "4549-2":    "C4",   # LOINC HbA1c mmol/mol
    "41995-2":   "C4",   # LOINC HbA1c (alternative)
    # C5 — Hipertensão (pressão arterial sistólica)
    "8480-6":    "C5",   # LOINC PA sistólica
    "55284-4":   "C5",   # LOINC PA sistólica + diastólica
    # C7 — Citopatológico (colo do útero)
    "10524-7":   "C7",   # LOINC microscopia colo útero
    "19762-4":   "C7",   # LOINC microscopia geral (colo)
    "85319-2":   "C7",   # LOINC citopatológico colo
    # C2 — Vacina DTP/Pentavalente → Immunization (ver _FHIR_VACCINE_PAP)
    # C3 — Gestação/Puerpério → Condition ICD-10 Z34, Z37
}
_FHIR_CONDITION_PAP: dict[str, str] = {
    "Z34":   "C3",  # Gestação normal
    "Z35":   "C3",  # Gravidez de alto risco
    "Z37":   "C3",  # Parto (proxy puerpério)
    "O80":   "C3",  # Parto único espontâneo
    "I10":   "C5",  # Hipertensão essencial
    "E11":   "C4",  # DM tipo 2
    "E10":   "C4",  # DM tipo 1
}
_FHIR_VACCINE_PAP: list[str] = [
    # DTP / Pentavalente — código CVX e SNOMED
    "106", "107", "110", "120", "132",  # CVX DTP variants
    "396430003",  # SNOMED DTP
    "871875004",  # SNOMED Pentavalente
]


def _tem_rnds() -> bool:
    return bool(
        os.getenv("RNDS_CERT_PATH", "").strip() and
        os.getenv("RNDS_CERT_KEY_PATH", "").strip()
    )


async def _rnds_fhir_get(path: str, params: dict) -> Any | None:
    """GET autenticado no RNDS via mTLS."""
    cert_path = os.getenv("RNDS_CERT_PATH", "").strip()
    key_path  = os.getenv("RNDS_CERT_KEY_PATH", "").strip()
    if not cert_path or not key_path:
        return None
    url = f"{RNDS_BASE}/fhir/r4/{path}"
    try:
        async with httpx.AsyncClient(
            cert=(cert_path, key_path), timeout=TIMEOUT, verify=True
        ) as c:
            r = await c.get(url, params={**params, "_format": "json", "_count": "500"})
            if r.status_code == 200:
                return r.json()
            log.debug("RNDS FHIR %s → HTTP %d", url, r.status_code)
    except Exception as e:
        log.debug("RNDS FHIR %s → %s", url, e)
    return None


def _fhir_entries(bundle: Any) -> list[dict]:
    if not isinstance(bundle, dict):
        return []
    return [e.get("resource", {}) for e in bundle.get("entry", []) if isinstance(e, dict)]


def _fhir_period(comp: str) -> tuple[str, str]:
    """'202605' → ('2026-05-01', '2026-05-31')"""
    import calendar
    ano, mes = int(comp[:4]), int(comp[4:])
    last = calendar.monthrange(ano, mes)[1]
    return f"{ano:04d}-{mes:02d}-01", f"{ano:04d}-{mes:02d}-{last:02d}"


async def _extrair_rnds_competencia(comp: str, cnes_list: list[str]) -> dict[str, dict[str, int]]:
    """
    Extrai do RNDS FHIR R4 os totais por CNES para cada indicador PAP.
    Retorna {cnes: {C4: N_total, C5: N_total, C7: N_total, C2: N_vacinados, C3: N_gestantes}}
    — valores são CONTAGENS brutas (denominador requer dados de cadastro do SIAPS).
    Retorna {} se RNDS não configurado.
    """
    if not _tem_rnds():
        return {}

    inicio, fim = _fhir_period(comp)
    totais: dict[str, dict[str, int]] = {cnes: {} for cnes in cnes_list}

    # ── Observation (exames laboratoriais) ────────────────────────────────────
    for cnes in cnes_list:
        bundle = await _rnds_fhir_get(
            "Observation",
            {"performer": f"Organization/{cnes}", "date": f"ge{inicio}", "_count": "500"}
        )
        for obs in _fhir_entries(bundle):
            codes = []
            cc = obs.get("code", {})
            for coding in cc.get("coding", []):
                codes.append(coding.get("code", ""))
            for code in codes:
                pap = _FHIR_CODE_PAP.get(code)
                if pap:
                    totais[cnes][pap] = totais[cnes].get(pap, 0) + 1

    # ── Condition (diagnósticos HAS / DM / Gestação) ──────────────────────────
    for cnes in cnes_list:
        bundle = await _rnds_fhir_get(
            "Condition",
            {"asserter": f"Organization/{cnes}", "recorded-date": f"ge{inicio}"}
        )
        for cond in _fhir_entries(bundle):
            codes = []
            cc = cond.get("code", {})
            for coding in cc.get("coding", []):
                c = coding.get("code", "")
                # ICD-10 pode vir como "I10" ou "I10.0" — pegar prefixo 3 chars
                codes.extend([c, c[:3]])
            for code in codes:
                pap = _FHIR_CONDITION_PAP.get(code)
                if pap:
                    totais[cnes][pap] = totais[cnes].get(pap, 0) + 1

    # ── Immunization (DTP / Pentavalente → C2) ────────────────────────────────
    for cnes in cnes_list:
        bundle = await _rnds_fhir_get(
            "Immunization",
            {"performer": f"Organization/{cnes}", "date": f"ge{inicio}"}
        )
        for imm in _fhir_entries(bundle):
            codes = []
            vc = imm.get("vaccineCode", {})
            for coding in vc.get("coding", []):
                codes.append(coding.get("code", ""))
            if any(c in _FHIR_VACCINE_PAP for c in codes):
                totais[cnes]["C2"] = totais[cnes].get("C2", 0) + 1

    return {k: v for k, v in totais.items() if v}


# CNES das UBS de Apuí/AM (para query RNDS por estabelecimento)
_CNES_EQUIPES: dict[str, str] = {
    "CACHOEIRA":     "6820662",
    "SÃO SEBASTIÃO": "6820662",
    "ACARI":         "6820662",
    "TRÊS ESTADOS":  "6820662",
    "JUMA":          "2797490",
    "LIBERDADE":     "2797490",
    "KENNEDY":       "6820670",
    "JK":            "6820689",
    "ESTRADA NOVA":  "6820697",
}


# ── Job de extração em background ─────────────────────────────────────────────
async def _job_extrator(competencias: list[str], incluir_rnds: bool = True):
    _STATUS["em_andamento"] = True
    _STATUS["inicio"]       = datetime.utcnow().isoformat()
    _STATUS["competencias_ok"]    = []
    _STATUS["competencias_falha"] = []
    _STATUS["equipes_total"]      = 0
    _STATUS["log"]                = []

    def _log(msg: str):
        _STATUS["log"].append(f"{datetime.utcnow().strftime('%H:%M:%S')} {msg}")
        log.info("[sync-historico] %s", msg)

    _log("Obtendo token SIAPS…")
    token = await _get_token()
    _log(f"Token SIAPS: {'OK' if token else 'NÃO OBTIDO — tentando endpoints públicos'}")

    rnds_ok = _tem_rnds()
    _log(f"RNDS mTLS: {'certificado configurado' if rnds_ok else 'não configurado — pulando extração RNDS'}")

    tipos_equipe = {
        "CACHOEIRA": "eSF", "SÃO SEBASTIÃO": "eSF", "ACARI": "eSF",
        "TRÊS ESTADOS": "eSF", "JUMA": "eSF", "LIBERDADE": "eSF",
        "KENNEDY": "eSF", "JK": "eSF", "ESTRADA NOVA": "eSFR",
    }
    cnes_list = list(set(_CNES_EQUIPES.values()))

    for comp in competencias:
        comp_iso  = _comp_iso(comp)
        comp_lbl  = COMP_LABEL.get(comp, comp_iso)
        _log(f"Extraindo {comp_lbl} ({comp_iso})…")

        # 1. SIAPS / eGestor
        equipes_siaps = await _extrair_competencia(comp, token)

        # 2. RNDS FHIR R4 (apenas se certificado configurado)
        rnds_por_cnes: dict[str, dict[str, int]] = {}
        if incluir_rnds and rnds_ok:
            _log(f"  → RNDS FHIR {comp_lbl}…")
            rnds_por_cnes = await _extrair_rnds_competencia(comp, cnes_list)
            rnds_equipes = sum(len(v) for v in rnds_por_cnes.values())
            _log(f"  → RNDS: {rnds_equipes} registros em {len(rnds_por_cnes)} CNES")

        # 3. Merge: RNDS enriquece SIAPS onde SIAPS tem dado (RNDS provê contagens,
        #    não percentuais — mantemos percentuais SIAPS como primários)
        equipes_final = equipes_siaps or {}
        fonte_partes = []
        if equipes_siaps:
            fonte_partes.append("SIAPS")
        if rnds_por_cnes:
            fonte_partes.append("RNDS FHIR R4")
            # Anotar no primeiro dict disponível que RNDS foi consultado
            for eq_nome, cnes in _CNES_EQUIPES.items():
                if cnes in rnds_por_cnes and rnds_por_cnes[cnes]:
                    if eq_nome not in equipes_final:
                        equipes_final[eq_nome] = {}
                    # Adiciona chave _rnds_contagens para auditoria (não exibida no front)
                    equipes_final[eq_nome]["_rnds_ok"] = 1.0

        if equipes_final:
            fonte = " + ".join(fonte_partes) + " — extração automática ERSUS360"
            _salvar_pec_cache(comp_iso, equipes_final, tipos_equipe, fonte)
            _STATUS["competencias_ok"].append(comp_iso)
            _STATUS["equipes_total"] += len(equipes_final)
            _log(f"✓ {comp_lbl}: {len(equipes_final)} equipes [{fonte}]")
        else:
            _STATUS["competencias_falha"].append(comp_iso)
            _log(f"✗ {comp_lbl}: sem dados — mantida referência existente")

    _STATUS["em_andamento"] = False
    _STATUS["fim"]          = datetime.utcnow().isoformat()
    _log(f"Concluído: {len(_STATUS['competencias_ok'])} OK / "
         f"{len(_STATUS['competencias_falha'])} sem dados")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/extrair-historico")
async def extrair_historico(
    background_tasks: BackgroundTasks,
    competencias: list[str] | None = None,
    incluir_rnds: bool = True,
    _: UserOut = Depends(get_current_user),
):
    """
    Dispara extração histórica SIAPS + RNDS para Jan–Ago/2026 (ou lista específica).
    Roda em background — use GET /api/sync/status para acompanhar.
    - SIAPS: indicadores C2-C7/B1-B2 por equipe via API gov.br (requer SIAPS_CPF/SENHA)
    - RNDS: HbA1c/citopatológico/DTP/HAS/DM via FHIR R4 (requer RNDS_CERT_PATH/KEY)
    """
    if _STATUS.get("em_andamento"):
        return {"status": "em_andamento", "mensagem": "Extração já em andamento.",
                "progresso": _STATUS}

    comps = competencias or COMPETENCIAS_2026
    background_tasks.add_task(_job_extrator, comps, incluir_rnds)
    return {
        "status": "iniciado",
        "competencias": comps,
        "incluir_rnds": incluir_rnds,
        "rnds_configurado": _tem_rnds(),
        "mensagem": (
            "Extração SIAPS + RNDS iniciada em background. Acompanhe em GET /api/sync/status."
            if incluir_rnds and _tem_rnds() else
            "Extração SIAPS iniciada (RNDS não configurado — defina RNDS_CERT_PATH/KEY no Railway)."
        ),
    }


@router.get("/rnds-status")
async def rnds_status(_: UserOut = Depends(get_current_user)):
    """Status da integração RNDS FHIR R4 e instruções de configuração."""
    tem = _tem_rnds()
    resultado = {
        "configurado": tem,
        "cert_path":   bool(os.getenv("RNDS_CERT_PATH", "").strip()),
        "cert_key":    bool(os.getenv("RNDS_CERT_KEY_PATH", "").strip()),
        "rnds_url":    RNDS_BASE,
        "cnes_apui":   list(set(_CNES_EQUIPES.values())),
        "indicadores_extraiveis": {
            "C4": "Diabetes — HbA1c (LOINC 4548-4)",
            "C5": "Hipertensão — PA sistólica (LOINC 8480-6)",
            "C7": "Citopatológico — colo uterino (LOINC 10524-7, 19762-4)",
            "C2": "DTP/Pentavalente — Immunization (CVX 106/107/110/120)",
            "C3": "Gestação — Condition ICD-10 Z34/Z35/Z37",
        },
        "instrucao": (
            "RNDS pronto para extração FHIR R4." if tem else
            "Configure no Railway: RNDS_CERT_PATH (caminho do certificado .pfx/.pem), "
            "RNDS_CERT_KEY_PATH (chave privada), RNDS_URL (padrão: https://ehr.saude.gov.br). "
            "Certificado emitido pelo DATASUS para o CNES do estabelecimento."
        ),
    }
    if tem:
        # Tenta ping rápido
        try:
            async with httpx.AsyncClient(
                cert=(os.getenv("RNDS_CERT_PATH"), os.getenv("RNDS_CERT_KEY_PATH")),
                timeout=8, verify=True,
            ) as c:
                r = await c.get(f"{RNDS_BASE}/fhir/r4/metadata",
                                headers={"Accept": "application/json"})
                resultado["ping"] = {"ok": r.status_code < 400, "http": r.status_code}
        except Exception as e:
            resultado["ping"] = {"ok": False, "erro": str(e)}
    return resultado


@router.get("/status")
async def status_extracao():
    """Status da última extração histórica e das competências disponíveis no cache."""
    disponiveis = []
    for comp in COMPETENCIAS_2026:
        p = _cache_path(_comp_iso(comp))
        if p.exists():
            try:
                data = json.loads(p.read_text(encoding="utf-8"))
                equipes = data.get("equipes", {})
                fonte   = data.get("fonte", "desconhecida")
                disponiveis.append({
                    "competencia": _comp_iso(comp),
                    "label": COMP_LABEL.get(comp, comp),
                    "equipes": len(equipes),
                    "fonte": fonte,
                    "ultima_atualizacao": data.get("ultima_atualizacao"),
                })
            except Exception:
                pass

    return {
        "extracao": _STATUS,
        "cache_disponivel": disponiveis,
        "total_competencias_cache": len(disponiveis),
    }
