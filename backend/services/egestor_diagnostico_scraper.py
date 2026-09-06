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

# Tetos confirmados via SCNES Web (05/09/2026)
TETOS_SCNES = {
    "esf":    10,   # 10 equipes ativas: ACARI, KENNEDY, JK, LIBERDADE, SÃO SEBASTIÃO,
                    #                     CACHOEIRA, JUMA, ESTRADA NOVA, TRÊS ESTADOS, AREAL
    "emulti": 2,    # EMULTI ANIZIO + EMULTI CURUMIM
    "esb":    0,    # Nenhuma ESB ativa no SCNES verificado
    "eap":    0,
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
    urls = [
        f"{PBASE}/esf?ibge={IBGE_6}",
        f"{PBASE}/esf?ibge={IBGE_7}",
        f"{PBASE}/saude-familia?ibge={IBGE_6}",
    ]
    for url in urls:
        lines = await _scrape(page, url, "Saúde da Família")
        if lines:
            return {
                "qt_credenciadas": _fi(lines, "credenciadas") or TETOS_SCNES["esf"],
                "qt_homologadas":  _fi(lines, "homologadas")  or 0,
                "qt_pagas":        _fi(lines, "pagas")        or 0,
                "qt_100pct":       _fi(lines, "100%")         or 0,
                "qt_75pct":        _fi(lines, "75%")          or 0,
                "qt_50pct":        _fi(lines, "50%")          or 0,
                "qt_25pct":        _fi(lines, "25%")          or 0,
                "vl_fixo":         _fb(lines, "Fixo")         or 0.0,
                "vl_vinculo":      _fb(lines, "Vínculo")      or 0.0,
                "vl_qualidade":    _fb(lines, "Qualidade")    or 0.0,
                "vl_total_bruto":  _fb(lines, "Total")        or 0.0,
                "_scraped": True,
            }
    # Scraping falhou — usa teto SCNES, valores indisponíveis
    return {
        "qt_credenciadas": TETOS_SCNES["esf"],  # confirmado SCNES
        "qt_homologadas": 0, "qt_pagas": 0,
        "qt_100pct": 0, "qt_75pct": 0, "qt_50pct": 0, "qt_25pct": 0,
        "vl_fixo": 0.0, "vl_vinculo": 0.0, "vl_qualidade": 0.0, "vl_total_bruto": 0.0,
        "_scraped": False,
    }


async def _scrape_acs(page) -> dict:
    urls = [
        f"{PBASE}/acs?ibge={IBGE_6}",
        f"{PBASE}/acs?ibge={IBGE_7}",
        f"{PBASE}/agente-comunitario?ibge={IBGE_6}",
    ]
    for url in urls:
        lines = await _scrape(page, url, "Agente")
        if lines:
            return {
                "qt_teto":                _fi(lines, "Teto")              or 0,
                "qt_direto_credenciado":  _fi(lines, "Direto credenciado") or 0,
                "qt_direto_pago":         _fi(lines, "Direto pago")        or 0,
                "vl_direto":              _fb(lines, "Direto")             or 0.0,
                "vl_parcela_extra_direto":_fb(lines, "Parcela Extra")      or 0.0,
                "qt_indireto_pago":       _fi(lines, "Indireto pago")      or 0,
                "vl_indireto":            _fb(lines, "Indireto")           or 0.0,
                "vl_total":               _fb(lines, "Total ACS")          or 0.0,
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
        f"{PBASE}/esb?ibge={IBGE_6}",
        f"{PBASE}/saude-bucal?ibge={IBGE_6}",
        f"{PBASE}/esb?ibge={IBGE_7}",
    ]
    for url in urls:
        lines = await _scrape(page, url, "Bucal")
        if lines:
            return {
                "qt_40h_credenciadas":    _fi(lines, "credenciadas") or 0,
                "qt_40h_homologadas":     _fi(lines, "homologadas")  or 0,
                "qt_40h_pagas_modal_i":   _fi(lines, "Modal. I")     or 0,
                "qt_40h_pagas_modal_ii":  _fi(lines, "Modal. II")    or 0,
                "vl_esb_40h":             _fb(lines, "eSB 40h")      or 0.0,
                "vl_qualidade_40h":       _fb(lines, "Qualidade")    or 0.0,
                "qt_uom":                 _fi(lines, "UOM")          or 0,
                "vl_uom":                 _fb(lines, "UOM")          or 0.0,
                "vl_lrpd_municipal":      _fb(lines, "LRPD")         or 0.0,
                "vl_total_sb_calculado":  _fb(lines, "Total")        or 0.0,
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


def _emulti_do_cache() -> dict:
    """Pega dados eMulti já scrapeados pelo egestor_scraper existente."""
    try:
        from services.egestor_scraper import get_cached_or_none
        cached = get_cached_or_none()
        if cached:
            c = cached.get("custeio", {})
            return {
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
                "_scraped": True,
            }
    except Exception:
        pass
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
        diags.append({"severidade": "alerta",
                       "titulo": f"eSF: {qt_cred - qt_pagas} equipe(s) não pagas",
                       "texto": f"Credenciadas: {qt_cred} · Pagas: {qt_pagas}."})
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


async def buscar_diagnostico_cobertura(parcela: str = "202611") -> dict:
    """
    Retorna dados de Diagnóstico/Cobertura para Apuí/AM.
    - Tetos: SCNES verificado (Set/2026)
    - Pagamento ESF/ACS/eSB: scraping páginas públicas e-Gestor (Playwright)
    - eMulti: cache do egestor_scraper existente
    - Diagnósticos: pendências SCNES + análise de cobertura
    """
    async with _lock:
        if _cache_valid():
            d = dict(_cache["data"])
            d["parcela"]     = int(parcela[4:]) if len(parcela) >= 6 else 0
            d["competencia"] = _MAPA_COMP.get(parcela, parcela)
            d["diagnosticos"] = _diagnosticos(d.get("esf", {}), d.get("acs", {}))
            return d

    logger.info("eGestor Diagnóstico: scraping — parcela %s", parcela)

    esf_data    = {"qt_credenciadas": TETOS_SCNES["esf"], "qt_homologadas": 0, "qt_pagas": 0,
                   "qt_100pct": 0, "qt_75pct": 0, "qt_50pct": 0, "qt_25pct": 0,
                   "vl_fixo": 0.0, "vl_vinculo": 0.0, "vl_qualidade": 0.0,
                   "vl_total_bruto": 0.0, "_scraped": False}
    acs_data    = {"qt_teto": 0, "qt_direto_credenciado": 0, "qt_direto_pago": 0,
                   "vl_direto": 0.0, "vl_parcela_extra_direto": 0.0,
                   "qt_indireto_pago": 0, "vl_indireto": 0.0, "vl_total": 0.0,
                   "_scraped": False}
    esb_data    = {"qt_40h_credenciadas": 0, "qt_40h_homologadas": 0,
                   "qt_40h_pagas_modal_i": 0, "qt_40h_pagas_modal_ii": 0,
                   "vl_esb_40h": 0.0, "vl_qualidade_40h": 0.0,
                   "qt_uom": 0, "vl_uom": 0.0, "vl_lrpd_municipal": 0.0,
                   "vl_total_sb_calculado": 0.0, "_scraped": False}

    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
            )
            ctx = await browser.new_context(
                locale="pt-BR",
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
            )
            page = await ctx.new_page()
            esf_data = await _scrape_esf(page)
            acs_data = await _scrape_acs(page)
            esb_data = await _scrape_esb(page)
            await browser.close()
        logger.info(
            "eGestor Diagnóstico: ESF scraped=%s ACS scraped=%s eSB scraped=%s",
            esf_data.get("_scraped"), acs_data.get("_scraped"), esb_data.get("_scraped"),
        )
    except ImportError:
        logger.warning("eGestor Diagnóstico: Playwright não instalado")
    except Exception as e:
        logger.error("eGestor Diagnóstico: erro scraping — %s", e)

    emulti = _emulti_do_cache()
    total  = (esf_data.get("vl_total_bruto") or 0.0) \
           + emulti.get("vl_total", 0.0) \
           + (esb_data.get("vl_total_sb_calculado") or 0.0) \
           + (acs_data.get("vl_total") or 0.0)

    from services.monitor_scnes_service import _EQUIPES
    score_medio      = round(sum(e["score"] for e in _EQUIPES) / len(_EQUIPES), 1) if _EQUIPES else 0
    total_vinculadas = sum(e["vinculadas"] for e in _EQUIPES)

    dados = {
        "fonte":         "egestor_publico_scnes",
        "situacao_dado": "disponivel",
        "coletado_em":   datetime.utcnow().isoformat() + "Z",
        "municipio":     MUNICIPIO,
        "uf":            UF,
        "ibge":          IBGE_7,
        "competencia":   _MAPA_COMP.get(parcela, parcela),
        "parcela":       int(parcela[4:]) if len(parcela) >= 6 else 0,
        "populacao":     POPULACAO,
        "faixa_equidade_esf":          None,
        "classificacao_vinculo_esf":    None,
        "classificacao_qualidade_esf":  None,
        "total_calculado":    total,
        "total_equipes_scnes": len(_EQUIPES),
        "score_medio_scnes":   score_medio,
        "total_vinculadas_cvat": total_vinculadas,
        "pendencias_criticas": 3,
        "pendencias_total":    9,
        "esf":     esf_data,
        "eap":     {"qt_credenciadas": 0, "qt_pagas": 0, "vl_total_bruto": 0.0, "_scraped": False},
        "emulti":  emulti,
        "esb":     esb_data,
        "acs":     acs_data,
        "esfrb":   {"qt_credenciadas": 0, "qt_homologadas": 0, "qt_pagas": 0,
                    "qt_embarcacoes": 0, "vl_custeio": 0.0, "vl_qualidade": 0.0,
                    "vl_total": 0.0, "_scraped": False},
        "per_capita": {"vl_pagamento": 0.0},
        "tetos":   {"esf": TETOS_SCNES["esf"], "eap": TETOS_SCNES["eap"]},
        "diagnosticos": _diagnosticos(esf_data, acs_data),
    }

    async with _lock:
        _cache["data"] = dados
        _cache["ts"]   = datetime.utcnow()

    return dados
