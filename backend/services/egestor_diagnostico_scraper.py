"""
Diagnóstico / Cobertura — Apuí/AM
Scraping das páginas públicas do e-Gestor APS (mesmo padrão do egestor_scraper.py).
Tetos confirmados via SCNES verificado (Set/2026). Cache 4h.
"""
from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

# IBGE 6 dígitos — padrão aceito pelo relatorioaps.saude.gov.br
IBGE_6     = "130014"
IBGE_7     = "1300144"
MUNICIPIO  = "Apuí"
UF         = "AM"
POPULACAO  = 19_847   # IBGE Censo 2022

PBASE = "https://relatorioaps.saude.gov.br/gerenciaaps/pagamento"

# ─────────────────────────────────────────────────────────────
# Tetos e dados verificados — e-Gestor APS, JUN/2026 (parcela 8/12)
# Fonte: screenshots relatorioaps.saude.gov.br (Set/2026)
# ─────────────────────────────────────────────────────────────
TETOS_SCNES = {
    "esf":    11,   # e-Gestor JUN/2026 confirmado
    "emulti":  1,   # 1 eMulti Estratégica (JUN/2026 confirmado)
    "esb":     9,   # 9 eSB 40h credenciadas (JUN/2026 confirmado)
    "esfr":    1,   # 1 eSFR (Ribeirinha) confirmada
    "acs":    65,   # Teto ACS confirmado
    "microscopista": 5,
    "eap":     0,
}

_FONTE = "egestor_screenshot_set2026"

_DADOS_ESF_JUN2026 = {
    "nu_comp_cnes": "JUN/2026",
    "qt_teto": 11,
    "qt_credenciadas": 10,
    "qt_homologadas": 9,
    "qt_pagas": 9,
    "qt_100pct": 0, "qt_75pct": 0, "qt_50pct": 0, "qt_25pct": 0,
    "ied": "ESTRATO 2",
    "classificacao_qualidade": "BOM",
    "classificacao_vinculo": "BOM",
    "vl_equidade": 144_000.0,
    "vl_qualidade": 72_000.0,
    "vl_vinculo": 54_000.0,
    "vl_implantacao": 0.0,
    "vl_ajuste": 0.0,
    "vl_desconto": -42_174.0,
    "vl_total_bruto": 227_826.0,
    "vl_fixo": 144_000.0,
    "_scraped": True, "_fonte_verificada": _FONTE,
}

_DADOS_ESB_JUN2026 = {
    "nu_comp_cnes": "JUN/2026",
    "qt_40h_credenciadas": 9,
    "qt_40h_homologadas": 9,
    "qt_40h_pagas_modal_i": 9,
    "qt_40h_pagas_modal_ii": 0,
    "vl_ref_modal_i": 4_014.0,
    "vl_ref_modal_ii": 7_064.0,
    "vl_esb_40h": 54_189.0,        # custeio 40h
    "vl_qualidade_40h": 30_000.0,
    "qt_uom": 1,
    "vl_uom": 9_360.0,
    "vl_lrpd_municipal": 11_250.0,
    "vl_total_sb_calculado": 54_189.0 + 30_000.0 + 9_360.0 + 11_250.0,  # 104.799
    "_scraped": True, "_fonte_verificada": _FONTE,
}

_DADOS_ACS_JUN2026 = {
    "nu_comp_cnes": "JUN/2026",
    "qt_teto": 65,
    "qt_direto_credenciado": 67,
    "qt_direto_pago": 66,
    "vl_ref_custeio": 3_242.0,
    "vl_direto": 213_972.0,
    "vl_parcela_extra_direto": 0.0,
    "qt_indireto_pago": 0,
    "vl_indireto": 0.0,
    "vl_total": 213_972.0,
    "_scraped": True, "_fonte_verificada": _FONTE,
}

_DADOS_EMULTI_JUN2026 = {
    "nu_comp_cnes": "JUN/2026",
    "qt_credenciadas": 1,
    "qt_estrategica": 1,
    "qt_ampliada": 0,
    "qt_complementar": 0,
    "qt_intermunicipal": 0,
    "qt_homologadas": 1,
    "qt_pagas": 1,
    "qt_atend_remoto": 1,
    "vl_custeio": 12_000.0,
    "vl_qualidade": 2_250.0,
    "vl_atend_remoto": 0.0,
    "vl_total": 12_000.0 + 2_250.0,  # 14.250
    "_scraped": True, "_fonte_verificada": _FONTE,
}

_DADOS_ESFR_JUN2026 = {
    "nu_comp_cnes": "JUN/2026",
    "qt_credenciadas": 1,
    "qt_homologadas": 1,
    "qt_pagas": 1,
    "qt_embarcacoes": 0,
    "vl_ref_custeio": 24_000.0,
    "vl_ref_implantacao": 50_000.0,
    "vl_custeio": 24_000.0,
    "vl_vinculo": 6_000.0,
    "vl_qualidade": 0.0,
    "vl_total": 24_000.0 + 6_000.0,  # 30.000
    "_scraped": True, "_fonte_verificada": _FONTE,
}

_DADOS_MICROSCOPISTA_JUN2026 = {
    "nu_comp_cnes": "JUN/2026",
    "qt_credenciados": 5,
    "qt_pagos": 5,
    "vl_ref_custeio": 3_242.0,
    "vl_total": 16_210.0,
    "_scraped": True, "_fonte_verificada": _FONTE,
}

_cache: dict = {"data": None, "ts": None}
_TTL  = timedelta(hours=4)
_lock = asyncio.Lock()


def _cache_valid() -> bool:
    return _cache["data"] is not None and _cache["ts"] is not None \
           and datetime.utcnow() - _cache["ts"] < _TTL


def _parse_brl(text: str) -> Optional[float]:
    m = re.search(r"R\$\s*([\d.,]+)", text.replace("\xa0", " "))
    if not m:
        return None
    try:
        return float(m.group(1).replace(".", "").replace(",", "."))
    except ValueError:
        return None


def _find_after(lines: list[str], kw: str, parse_fn):
    k = kw.lower()
    for i, ln in enumerate(lines):
        if k in ln.lower():
            for j in range(i, min(i + 5, len(lines))):
                v = parse_fn(lines[j])
                if v is not None:
                    return v
    return None


def _fi(lines: list[str], kw: str) -> Optional[int]:
    def p(t):
        m = re.search(r"\b(\d+)\b", t)
        return int(m.group(1)) if m else None
    return _find_after(lines, kw, p)


def _fb(lines: list[str], kw: str) -> Optional[float]:
    return _find_after(lines, kw, _parse_brl)


async def _scrape(page, url: str, selector_hint: str = "Valor") -> list[str]:
    """Abre URL e retorna linhas do body. Retorna [] se falhar."""
    try:
        await page.goto(url, wait_until="networkidle", timeout=28_000)
        try:
            await page.wait_for_selector(f"text={selector_hint}", timeout=12_000)
        except Exception:
            pass
        body = await page.inner_text("body")
        if len(body) > 300:
            logger.info("eGestor Diag: %d chars de %s", len(body), url)
            return [ln.strip() for ln in body.splitlines() if ln.strip()]
    except Exception as e:
        logger.debug("eGestor Diag: falha %s — %s", url, e)
    return []


async def _scrape_esf(page) -> dict:
    """
    Labels reais do e-Gestor APS (confirmados via screenshot Set/2026):
    - 'Componente Equidade', 'Qualidade', 'Vínculo e Acompanhamento Territorial'
    - 'Quantidade de equipes credenciadas', 'homologadas', 'pagas'
    - 'Teto', 'Desconto', 'Total'
    """
    urls = [
        f"{PBASE}/esf?ibge={IBGE_6}",
        f"{PBASE}/esf/custeio?ibge={IBGE_6}",
        f"{PBASE}/equipe-saude-familia?ibge={IBGE_6}",
    ]
    for url in urls:
        lines = await _scrape(page, url, "equipes credenciadas")
        if not lines:
            lines = await _scrape(page, url, "Componente Equidade")
        if lines and len(lines) > 10:
            teto = _fi(lines, "Teto") or TETOS_SCNES["esf"]
            cred = _fi(lines, "credenciadas") or teto
            hom  = _fi(lines, "homologadas")  or 0
            pag  = _fi(lines, "pagas")        or 0
            equidade = _fb(lines, "Componente Equidade") or _fb(lines, "Equidade") or 0.0
            qualid   = _fb(lines, "Qualidade") or 0.0
            vinculo  = _fb(lines, "Vínculo e Acompanhamento") or _fb(lines, "Vínculo") or 0.0
            desconto = _fb(lines, "Desconto") or 0.0
            total    = _fb(lines, "Total") or (equidade + qualid + vinculo - desconto)
            ied      = next((ln for ln in lines if "ESTRATO" in ln.upper()), None)
            cl_qual  = next((ln for ln in lines if ln.upper() in ("BOM","ÓTIMO","REGULAR","RUIM")), None)
            return {
                "qt_teto":         teto,
                "qt_credenciadas": cred,
                "qt_homologadas":  hom,
                "qt_pagas":        pag,
                "qt_100pct": 0, "qt_75pct": 0, "qt_50pct": 0, "qt_25pct": 0,
                "ied":                    ied or "",
                "classificacao_qualidade": cl_qual or "",
                "vl_equidade":   equidade,
                "vl_fixo":       equidade,   # alias frontend
                "vl_qualidade":  qualid,
                "vl_vinculo":    vinculo,
                "vl_ajuste":     0.0,
                "vl_desconto":   -abs(desconto),
                "vl_total_bruto": total,
                "_scraped": True,
            }
    # Fallback: dados verificados via screenshot (JUN/2026)
    return dict(_DADOS_ESF_JUN2026)


async def _scrape_acs(page) -> dict:
    urls = [
        f"{PBASE}/acs/custeio?ibge={IBGE_6}",
        f"{PBASE}/acs?ibge={IBGE_6}",
        f"{PBASE}/agente-comunitario-saude?ibge={IBGE_6}",
        f"{PBASE}/agente-comunitario-saude/custeio?ibge={IBGE_6}",
    ]
    for url in urls:
        lines = await _scrape(page, url, "Agente")
        if not lines:
            lines = await _scrape(page, url, "Valor")
        if lines and len(lines) > 10:
            return {
                "qt_teto":                _fi(lines, "Teto")               or 0,
                "qt_direto_credenciado":  _fi(lines, "Direto credenciado")  or 0,
                "qt_direto_pago":         _fi(lines, "Direto pago")         or 0,
                "vl_direto":              _fb(lines, "Direto")              or 0.0,
                "vl_parcela_extra_direto":_fb(lines, "Parcela Extra")       or 0.0,
                "qt_indireto_pago":       _fi(lines, "Indireto pago")       or 0,
                "vl_indireto":            _fb(lines, "Indireto")            or 0.0,
                "vl_total":               _fb(lines, "Total ACS")           or 0.0,
                "_scraped": True,
            }
    return {
        "qt_teto": 0, "qt_direto_credenciado": 0, "qt_direto_pago": 0,
        "vl_direto": 0.0, "vl_parcela_extra_direto": 0.0,
        "qt_indireto_pago": 0, "vl_indireto": 0.0, "vl_total": 0.0,
        "_scraped": False,
    }


async def _scrape_esb(page) -> dict:
    urls = [
        f"{PBASE}/esb/custeio?ibge={IBGE_6}",
        f"{PBASE}/esb?ibge={IBGE_6}",
        f"{PBASE}/saude-bucal?ibge={IBGE_6}",
        f"{PBASE}/saude-bucal/custeio?ibge={IBGE_6}",
    ]
    for url in urls:
        lines = await _scrape(page, url, "Bucal")
        if not lines:
            lines = await _scrape(page, url, "Valor")
        if lines and len(lines) > 10:
            return {
                "qt_40h_credenciadas":   _fi(lines, "credenciadas") or 0,
                "qt_40h_homologadas":    _fi(lines, "homologadas")  or 0,
                "qt_40h_pagas_modal_i":  _fi(lines, "Modal. I")     or 0,
                "qt_40h_pagas_modal_ii": _fi(lines, "Modal. II")    or 0,
                "vl_esb_40h":            _fb(lines, "eSB 40h")      or 0.0,
                "vl_qualidade_40h":      _fb(lines, "Qualidade")    or 0.0,
                "qt_uom":                _fi(lines, "UOM")          or 0,
                "vl_uom":                _fb(lines, "UOM")          or 0.0,
                "vl_lrpd_municipal":     _fb(lines, "LRPD")         or 0.0,
                "vl_total_sb_calculado": _fb(lines, "Total")        or 0.0,
                "_scraped": True,
            }
    return {
        "qt_40h_credenciadas": 0, "qt_40h_homologadas": 0,
        "qt_40h_pagas_modal_i": 0, "qt_40h_pagas_modal_ii": 0,
        "vl_esb_40h": 0.0, "vl_qualidade_40h": 0.0,
        "qt_uom": 0, "vl_uom": 0.0,
        "vl_lrpd_municipal": 0.0, "vl_total_sb_calculado": 0.0,
        "_scraped": False,
    }


def _do_cache_all() -> dict:
    """
    Lê o cache unificado do egestor_scraper (ESF, ACS, eSB, eMulti).
    Retorna dict com chaves: esf, acs, esb, emulti — ou None em cada se não disponível.
    """
    try:
        from services.egestor_scraper import get_cached_or_none
        cached = get_cached_or_none()
        if not cached:
            return {}
        c = cached.get("custeio", {})
        emulti = {
            "qt_credenciadas": c.get("equipes_credenciadas") or TETOS_SCNES["emulti"],
            "qt_homologadas":  c.get("equipes_homologadas")  or 0,
            "qt_pagas":        c.get("equipes_pagas")        or 0,
            "qt_ampliada": 0, "qt_estrategica": 0, "qt_complementar": 0,
            "qt_atend_remoto": c.get("equipes_atendimento_remoto_pagas") or 0,
            "vl_custeio":      c.get("pagamento") or 0.0,
            "vl_qualidade":    cached.get("qualidade", {}).get("pagamento") or 0.0,
            "vl_atend_remoto": cached.get("remoto",   {}).get("pagamento") or 0.0,
            "vl_total": (c.get("pagamento") or 0.0)
                        + (cached.get("qualidade", {}).get("pagamento") or 0.0)
                        + (cached.get("remoto",    {}).get("pagamento") or 0.0),
            "_scraped": bool(c),
        }
        return {
            "emulti": emulti,
            "esf":    cached.get("esf") or {},
            "acs":    cached.get("acs") or {},
            "esb":    cached.get("esb") or {},
        }
    except Exception as e:
        logger.debug("_do_cache_all: %s", e)
        return {}


def _emulti_fallback() -> dict:
    return {
        "qt_credenciadas": TETOS_SCNES["emulti"],
        "qt_homologadas": 0, "qt_pagas": 0,
        "qt_ampliada": 0, "qt_estrategica": 0, "qt_complementar": 0, "qt_atend_remoto": 0,
        "vl_custeio": 0.0, "vl_qualidade": 0.0, "vl_atend_remoto": 0.0, "vl_total": 0.0,
        "_scraped": False,
    }


def _diagnosticos(esf: dict, acs: dict) -> list[dict]:
    from services.monitor_scnes_service import _EQUIPES, _PENDENCIAS
    diags = []

    for p in _PENDENCIAS:
        sev = "critico" if "CRÍTICO" in p["sev"] else "alerta" if "MÉDIO" in p["sev"] else "info"
        diags.append({"severidade": sev,
                       "titulo": f"SCNES {p['sev'].split()[1].lower()} — {p['equipe']}",
                       "texto": p["desc"]})

    qt_pagas = esf.get("qt_pagas", 0)
    qt_cred  = esf.get("qt_credenciadas", TETOS_SCNES["esf"])
    if qt_pagas and qt_pagas < qt_cred:
        # Tenta identificar a(s) equipe(s) não paga(s) pelo menor nº de vinculadas no SIAPS
        n_faltantes = qt_cred - qt_pagas
        suspeitas = sorted(
            [e for e in _EQUIPES],
            key=lambda e: (e.get("vinculadas", 9999), e["score"])
        )[:n_faltantes]
        nomes = " · ".join(e["nome"] for e in suspeitas)
        diags.append({"severidade": "alerta",
                       "titulo": f"eSF: {n_faltantes} equipe(s) não paga(s)",
                       "texto": (
                           f"Credenciadas: {qt_cred} · Pagas: {qt_pagas}. "
                           f"Provável equipe não paga: {nomes} "
                           f"(menor nº de vínculos no SIAPS — confirmar no e-Gestor)."
                       )})
    elif qt_pagas and qt_pagas >= qt_cred:
        diags.append({"severidade": "ok",
                       "titulo": f"eSF: {qt_pagas} equipes pagas — situação regular",
                       "texto": f"Todas as {qt_cred} equipes credenciadas estão sendo pagas."})

    qt_acs = acs.get("qt_direto_pago", 0)
    if qt_acs:
        cob = (qt_acs * 750) / POPULACAO * 100
        sev = "ok" if cob >= 70 else "alerta" if cob >= 50 else "critico"
        diags.append({"severidade": sev,
                       "titulo": f"ACS: cobertura estimada {cob:.0f}% · {qt_acs} pagos",
                       "texto": f"{qt_acs} ACS × 750 pessoas / {POPULACAO:,} hab. Meta: ≥ 70%."})

    for eq in _EQUIPES:
        if eq["score"] < 70:
            diags.append({"severidade": "critico",
                           "titulo": f"{eq['nome']}: score {eq['score']} — {eq['nivel']}",
                           "texto": f"{eq['vinculadas']} vinculadas. Score abaixo de 70."})

    return diags


_MAPA_COMP = {
    "202601": "NOV/2025", "202602": "DEZ/2025",
    "202603": "JAN/2026", "202604": "FEV/2026", "202605": "MAR/2026",
    "202606": "ABR/2026", "202607": "MAI/2026", "202608": "JUN/2026",
    "202609": "JUL/2026", "202610": "AGO/2026", "202611": "SET/2026",
    "202612": "OUT/2026",
}

# Série histórica — base confirmada, expandida automaticamente pelo job _job_egestor_incentivos
HISTORICO_INCENTIVOS: list[dict] = [
    {"parcela_code": "202601", "competencia": "NOV/2025", "parcela": "1/12",  "total": 618_703.11},
    {"parcela_code": "202602", "competencia": "DEZ/2025", "parcela": "2/12",  "total": 589_588.00},
    {"parcela_code": "202603", "competencia": "JAN/2026", "parcela": "3/12",  "total": 606_004.75},
    {"parcela_code": "202604", "competencia": "FEV/2026", "parcela": "4/12",  "total": 606_871.75},
    {"parcela_code": "202605", "competencia": "MAR/2026", "parcela": "5/12",  "total": 609_710.75},
    {"parcela_code": "202606", "competencia": "ABR/2026", "parcela": "6/12",  "total": 595_996.75},
    {"parcela_code": "202607", "competencia": "MAI/2026", "parcela": "7/12",  "total": 630_371.75},
    {"parcela_code": "202608", "competencia": "JUN/2026", "parcela": "8/12",  "total": 637_231.75},
    # JUL/2026+ populados automaticamente via API no startup e domingo às 04:00
]


def _parcela_atual() -> str:
    """
    Calcula a parcela mais recente disponível no e-Gestor.
    O MS publica os dados do mês M na parcela do mês M+1 (lag ~1 mês).
    Formato: AAAAPP onde PP é o número da parcela no ciclo 2026 (01=NOV/25, 09=JUL/26...).
    """
    from datetime import date
    hoje = date.today()
    ano, mes = hoje.year, hoje.month
    # Ciclo 2026: PP=01 → NOV/2025 ... PP=09 → JUL/2026 ... PP=12 → OUT/2026
    # Mapeamento: ano/mês do calendário → código de parcela
    _CAL_PARA_PARC: dict[tuple, str] = {
        (2025, 11): "202601", (2025, 12): "202602",
        (2026,  1): "202603", (2026,  2): "202604", (2026,  3): "202605",
        (2026,  4): "202606", (2026,  5): "202607", (2026,  6): "202608",
        (2026,  7): "202609", (2026,  8): "202610", (2026,  9): "202611",
        (2026, 10): "202612",
    }
    # Dados do mês passado estão normalmente disponíveis no mês atual
    # Tenta mês atual, senão mês anterior
    p = _CAL_PARA_PARC.get((ano, mes))
    if p:
        return p
    if mes == 1:
        return _CAL_PARA_PARC.get((ano - 1, 12), "202611")
    return _CAL_PARA_PARC.get((ano, mes - 1), "202611")


async def _buscar_live(parcela: str) -> dict | None:
    """
    Busca dados ao vivo da API pública e-Gestor APS (REST, sem Playwright).
    Retorna dict com esf/acs/esb/emulti/esfr/microscopistas ou None se falhar.
    """
    try:
        from services.egestor_aps import buscar_completo, EGestorAPIError
        resultado = await buscar_completo(parcela_inicio=parcela, parcela_fim=parcela)
        det = resultado.get("detalhado", {})
        if not det:
            return None

        esf_r = det.get("esf", {})
        acs_r = det.get("acs", {})
        esb_r = det.get("esb", {})
        emu_r = det.get("emulti", {})
        esfr_r = det.get("esfrb", {})
        mic_r  = det.get("microscopistas", {})
        tetos_r = det.get("tetos", {})
        comp_label = det.get("competencia", _MAPA_COMP.get(parcela, parcela))

        # ESF
        esf_data = {
            "qt_teto": tetos_r.get("esf") or TETOS_SCNES["esf"],
            "qt_credenciadas": esf_r.get("qt_credenciadas", 0),
            "qt_homologadas":  esf_r.get("qt_homologadas",  0),
            "qt_pagas":        esf_r.get("qt_pagas",        0),
            "ied":             det.get("faixa_equidade_esf") or "ESTRATO 2",
            "classificacao_qualidade": det.get("classificacao_qualidade_esf") or "",
            "classificacao_vinculo":   det.get("classificacao_vinculo_esf")   or "",
            "vl_equidade":   esf_r.get("vl_fixo", 0.0),
            "vl_fixo":       esf_r.get("vl_fixo", 0.0),
            "vl_qualidade":  esf_r.get("vl_qualidade", 0.0),
            "vl_vinculo":    esf_r.get("vl_vinculo",   0.0),
            "vl_ajuste":     0.0,
            "vl_desconto":   -(esf_r.get("vl_total_bruto", 0.0) - esf_r.get("vl_fixo", 0.0)
                                - esf_r.get("vl_qualidade", 0.0) - esf_r.get("vl_vinculo", 0.0)),
            "vl_total_bruto": esf_r.get("vl_total_bruto", 0.0),
            "nu_comp_cnes":  comp_label,
            "_scraped": True, "_fonte_verificada": f"egestor_api_{parcela}",
        }
        # ACS
        acs_data = {
            "qt_teto":               acs_r.get("qt_teto", TETOS_SCNES["acs"]),
            "qt_direto_credenciado": acs_r.get("qt_direto_credenciado", 0),
            "qt_direto_pago":        acs_r.get("qt_direto_pago", 0),
            "vl_ref_custeio":        3_242.0,
            "vl_direto":             acs_r.get("vl_direto", 0.0),
            "vl_parcela_extra_direto": acs_r.get("vl_parcela_extra_direto", 0.0),
            "qt_indireto_pago":      acs_r.get("qt_indireto_pago", 0),
            "vl_indireto":           acs_r.get("vl_indireto", 0.0),
            "vl_total":              acs_r.get("vl_total", 0.0),
            "_scraped": True, "_fonte_verificada": f"egestor_api_{parcela}",
        }
        # eSB
        esb_data = {
            "qt_40h_credenciadas":   esb_r.get("qt_40h_credenciadas",   TETOS_SCNES["esb"]),
            "qt_40h_homologadas":    esb_r.get("qt_40h_homologadas",    0),
            "qt_40h_pagas_modal_i":  esb_r.get("qt_40h_pagas_modal_i",  0),
            "qt_40h_pagas_modal_ii": esb_r.get("qt_40h_pagas_modal_ii", 0),
            "vl_esb_40h":            esb_r.get("vl_esb_40h",            0.0),
            "vl_qualidade_40h":      esb_r.get("vl_qualidade_40h",      0.0),
            "qt_uom":                esb_r.get("qt_uom",                 0),
            "vl_uom":                esb_r.get("vl_uom",                 0.0),
            "vl_lrpd_municipal":     esb_r.get("vl_lrpd_municipal",     0.0),
            "vl_total_sb_calculado": esb_r.get("vl_total_sb_calculado", 0.0),
            "_scraped": True, "_fonte_verificada": f"egestor_api_{parcela}",
        }
        # eMulti
        emulti_data = {
            "qt_credenciadas":  emu_r.get("qt_credenciadas",  TETOS_SCNES["emulti"]),
            "qt_homologadas":   emu_r.get("qt_homologadas",   0),
            "qt_pagas":         emu_r.get("qt_pagas",         0),
            "qt_estrategica":   emu_r.get("qt_estrategica",   0),
            "qt_ampliada":      emu_r.get("qt_ampliada",      0),
            "qt_complementar":  emu_r.get("qt_complementar",  0),
            "qt_atend_remoto":  emu_r.get("qt_atend_remoto",  0),
            "vl_custeio":       emu_r.get("vl_custeio",       0.0),
            "vl_qualidade":     emu_r.get("vl_qualidade",     0.0),
            "vl_atend_remoto":  emu_r.get("vl_atend_remoto",  0.0),
            "vl_total":         emu_r.get("vl_total",         0.0),
            "_scraped": True, "_fonte_verificada": f"egestor_api_{parcela}",
        }
        # eSFR
        esfr_data = {
            "qt_credenciadas": esfr_r.get("qt_credenciadas", TETOS_SCNES["esfr"]),
            "qt_pagas":        esfr_r.get("qt_pagas",        0),
            "vl_custeio":      esfr_r.get("vl_custeio",      0.0),
            "vl_vinculo":      esfr_r.get("vl_vinculo",      0.0),
            "vl_qualidade":    esfr_r.get("vl_qualidade",    0.0),
            "vl_total":        esfr_r.get("vl_total",        0.0),
            "_scraped": True,
        }
        # Microscopistas
        micro_data = {
            "qt_credenciados": mic_r.get("qt_credenciados", TETOS_SCNES["microscopista"]),
            "qt_pagos":        mic_r.get("qt_pagos",        0),
            "vl_total":        mic_r.get("vl_total",        0.0),
            "_scraped": True,
        }
        tetos = {**TETOS_SCNES, **({"esf": tetos_r.get("esf")} if tetos_r.get("esf") else {})}

        logger.info(
            "eGestor API live: parcela=%s ESF total=%.2f ACS total=%.2f",
            parcela, esf_data["vl_total_bruto"], acs_data["vl_total"],
        )
        return {
            "esf": esf_data, "acs": acs_data, "esb": esb_data,
            "emulti": emulti_data, "esfr": esfr_data, "micro": micro_data,
            "tetos": tetos, "competencia": comp_label,
            "faixa_equidade_esf": det.get("faixa_equidade_esf"),
            "classificacao_vinculo_esf":   det.get("classificacao_vinculo_esf"),
            "classificacao_qualidade_esf":  det.get("classificacao_qualidade_esf"),
        }
    except Exception as exc:
        logger.warning("eGestor API live falhou (parcela=%s): %s — usando fallback", parcela, exc)
        return None


async def buscar_diagnostico_cobertura(parcela: str = "202611", forcar_atualizacao: bool = False) -> dict:
    """
    Retorna dados de Diagnóstico/Cobertura para Apuí/AM via API REST e-Gestor (sem Playwright).
    Fluxo: API pública REST → fallback verificado JUN/2026.
    Cache 4h por parcela. forcar_atualizacao=True ignora o cache.
    """
    async with _lock:
        cache_parcela = (_cache.get("parcela") == parcela)
        if _cache_valid() and cache_parcela and not forcar_atualizacao:
            d = dict(_cache["data"])
            d["diagnosticos"] = _diagnosticos(d.get("esf", {}), d.get("acs", {}))
            return d

    # Tenta API REST ao vivo (sem Playwright, funciona no Railway)
    live = await _buscar_live(parcela)

    if live:
        esf_data    = live["esf"]
        acs_data    = live["acs"]
        esb_data    = live["esb"]
        emulti      = live["emulti"]
        esfr_data   = live["esfr"]
        micro_data  = live["micro"]
        tetos_uso   = live["tetos"]
        comp_label  = live["competencia"]
        faixa_eq    = live["faixa_equidade_esf"]
        cl_vinculo  = live["classificacao_vinculo_esf"]
        cl_qualid   = live["classificacao_qualidade_esf"]
        fonte_str   = f"egestor_api_{parcela}"
    else:
        # Fallback: dados verificados JUN/2026
        logger.info("eGestor: usando fallback verificado JUN/2026 para parcela=%s", parcela)
        esf_data   = dict(_DADOS_ESF_JUN2026)
        acs_data   = dict(_DADOS_ACS_JUN2026)
        esb_data   = dict(_DADOS_ESB_JUN2026)
        emulti     = dict(_DADOS_EMULTI_JUN2026)
        esfr_data  = dict(_DADOS_ESFR_JUN2026)
        micro_data = dict(_DADOS_MICROSCOPISTA_JUN2026)
        tetos_uso  = TETOS_SCNES
        comp_label = _MAPA_COMP.get(parcela, parcela)
        faixa_eq   = "ESTRATO 2"
        cl_vinculo = "BOM"
        cl_qualid  = "BOM"
        fonte_str  = "egestor_fallback_jun2026"

    total = (
        (esf_data.get("vl_total_bruto") or 0.0)
        + (emulti.get("vl_total") or 0.0)
        + (esb_data.get("vl_total_sb_calculado") or 0.0)
        + (acs_data.get("vl_total") or 0.0)
        + (esfr_data.get("vl_total") or 0.0)
        + (micro_data.get("vl_total") or 0.0)
    )

    from services.monitor_scnes_service import _EQUIPES, _PENDENCIAS
    score_medio      = round(sum(e["score"] for e in _EQUIPES) / len(_EQUIPES), 1) if _EQUIPES else 0
    total_vinculadas = sum(e["vinculadas"] for e in _EQUIPES)

    pend_por_equipe: dict[str, list[dict]] = {}
    for p in _PENDENCIAS:
        eq = p["equipe"]
        if eq not in pend_por_equipe:
            pend_por_equipe[eq] = []
        pend_por_equipe[eq].append({
            "sev": "critico" if "CRÍTICO" in p["sev"] else "alerta" if "MÉDIO" in p["sev"] else "info",
            "desc": p["desc"],
        })

    equipes_scnes = [
        {
            "nome": e["nome"],
            "score": e["score"],
            "nivel": e["nivel"],
            "vinculadas": e["vinculadas"],
            "pendencias": pend_por_equipe.get(e["nome"], []),
        }
        for e in _EQUIPES
    ]

    criticos_pend = sum(1 for p in _PENDENCIAS if "CRÍTICO" in p["sev"])

    dados = {
        "fonte":         fonte_str,
        "situacao_dado": "disponivel",
        "coletado_em":   datetime.utcnow().isoformat() + "Z",
        "municipio":     MUNICIPIO,
        "uf":            UF,
        "ibge":          IBGE_7,
        "competencia":   comp_label,
        "parcela":       int(parcela[4:]) if len(parcela) >= 6 else 0,
        "populacao":     POPULACAO,
        "faixa_equidade_esf":          faixa_eq,
        "classificacao_vinculo_esf":    cl_vinculo,
        "classificacao_qualidade_esf":  cl_qualid,
        "total_calculado":    total,
        "total_equipes_scnes": len(_EQUIPES),
        "score_medio_scnes":   score_medio,
        "total_vinculadas_cvat": total_vinculadas,
        "pendencias_criticas": criticos_pend,
        "pendencias_total":    len(_PENDENCIAS),
        "tetos": tetos_uso,
        "esf":    esf_data,
        "acs":    acs_data,
        "esb":    esb_data,
        "emulti": emulti,
        "esfr":   esfr_data,
        "microscopista": micro_data,
        "eap":    {"qt_credenciadas": 0, "qt_pagas": 0, "vl_total_bruto": 0.0, "_scraped": False},
        "per_capita": {"vl_pagamento": 0.0},
        "historico_incentivos": HISTORICO_INCENTIVOS,
        "diagnosticos": _diagnosticos(esf_data, acs_data),
        "equipes_scnes": equipes_scnes,
        "_meta": {"scnes_varredura": "Set/2026", "nota": "Varredura SCNES 06/09/2026"},
    }

    async with _lock:
        _cache["data"] = dados
        _cache["ts"]   = datetime.utcnow()

    return dados
