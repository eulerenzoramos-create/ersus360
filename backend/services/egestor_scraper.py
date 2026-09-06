"""
Scraper do e-Gestor APS — busca dados públicos de pagamento para Apuí/AM.
Cobre: eSF, ACS, eSB, eMulti (Custeio, Qualidade, Atend. Remoto).
Usa Playwright (Chromium headless) para renderizar as páginas Angular.
Cache em memória com TTL de 6 horas.
"""
import asyncio
import logging
import re
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

IBGE = "130014"
BASE = "https://relatorioaps.saude.gov.br/gerenciaaps/pagamento"

URLS = {
    # eMulti — confirmados funcionando
    "emulti_custeio":   f"{BASE}/emulti/custeio?ibge={IBGE}",
    "emulti_qualidade": f"{BASE}/emulti/componente-qualidade?ibge={IBGE}",
    "emulti_remoto":    f"{BASE}/emulti/atendimento-remoto?ibge={IBGE}",
    # eSF
    "esf_custeio":      f"{BASE}/esf/custeio?ibge={IBGE}",
    "esf_qualidade":    f"{BASE}/esf/componente-qualidade?ibge={IBGE}",
    "esf_vinculo":      f"{BASE}/esf/vinculo-acompanhamento-territorial?ibge={IBGE}",
    # ACS — "Agente Comunitário de Saúde (AFC - 95% e IFP - 5%)"
    "acs_custeio":      f"{BASE}/agente-comunitario-saude?ibge={IBGE}",
    # eSB — "Equipes de Saúde Bucal - 40 Horas"
    "esb_custeio":      f"{BASE}/equipe-saude-bucal/custeio?ibge={IBGE}",
    "esb_qualidade":    f"{BASE}/equipe-saude-bucal/componente-qualidade?ibge={IBGE}",
    # UOM — "Unidade Odontológica Móvel"
    "uom":              f"{BASE}/unidade-odontologica-movel?ibge={IBGE}",
    # LRPD — "Laboratórios Regionais de Prótese Dentária"
    "lrpd":             f"{BASE}/lrpd?ibge={IBGE}",
    # eSFR — "Equipes de Saúde da Família Ribeirinhas - eSFR"
    "esfr_custeio":     f"{BASE}/esf-ribeirinha/custeio?ibge={IBGE}",
    "esfr_vinculo":     f"{BASE}/esf-ribeirinha/vinculo-acompanhamento-territorial?ibge={IBGE}",
    # Microscopista
    "microscopista":    f"{BASE}/microscopista?ibge={IBGE}",
}

# Cache global
_cache: dict = {"data": None, "ts": None}
_TTL = timedelta(hours=6)
_lock = asyncio.Lock()


def _cache_valid() -> bool:
    return (
        _cache["data"] is not None
        and _cache["ts"] is not None
        and datetime.utcnow() - _cache["ts"] < _TTL
    )


def _parse_brl(text: str) -> Optional[float]:
    m = re.search(r"R\$\s*([\d.,]+)", text.replace("\xa0", " "))
    if not m:
        return None
    try:
        return float(m.group(1).replace(".", "").replace(",", "."))
    except ValueError:
        return None


def _find_value_after(lines: list, keyword: str) -> Optional[float]:
    kl = keyword.lower()
    for i, line in enumerate(lines):
        if kl in line.lower():
            for j in range(i, min(i + 5, len(lines))):
                v = _parse_brl(lines[j])
                if v is not None:
                    return v
    return None


def _find_int_after(lines: list, keyword: str) -> Optional[int]:
    kl = keyword.lower()
    for i, line in enumerate(lines):
        if kl in line.lower():
            for j in range(i, min(i + 5, len(lines))):
                m = re.search(r"\b(\d+)\b", lines[j])
                if m:
                    return int(m.group(1))
    return None


def _find_str_after(lines: list, keyword: str, options: list) -> Optional[str]:
    kl = keyword.lower()
    for i, line in enumerate(lines):
        if kl in line.lower():
            for j in range(i, min(i + 5, len(lines))):
                for opt in options:
                    if opt.upper() in lines[j].upper():
                        return opt
    return None


async def _scrape_page(page, url: str, hint: str = "Valor") -> list:
    """Abre URL no Playwright e retorna linhas do body. Retorna [] se falhar."""
    try:
        await page.goto(url, wait_until="networkidle", timeout=35_000)
        try:
            await page.wait_for_selector(f"text={hint}", timeout=15_000)
        except Exception:
            pass
        body = await page.inner_text("body")
        if len(body) > 200:
            logger.info("eGestor scrape: %d chars em %s", len(body), url.split("?")[0])
            return [ln.strip() for ln in body.splitlines() if ln.strip()]
    except Exception as e:
        logger.warning("eGestor: falha %s — %s", url.split("?")[0], e)
    return []


def _parse_emulti_custeio(lines: list) -> dict:
    return {
        "equipes_credenciadas":              _find_int_after(lines, "equipes credenciadas") or 0,
        "equipes_homologadas":               _find_int_after(lines, "homologadas") or 0,
        "equipes_pagas":                     _find_int_after(lines, "equipes pagas") or 0,
        "equipes_atendimento_remoto_pagas":  _find_int_after(lines, "atendimento remoto pagas") or 0,
        "pagamento":                         _find_value_after(lines, "Valor do Pagamento") or 0.0,
        "ajuste":                            _find_value_after(lines, "Ajuste") or 0.0,
        "desconto":                          _find_value_after(lines, "Desconto") or 0.0,
        "total":                             _find_value_after(lines, "Total") or 0.0,
    }


def _parse_emulti_qualidade(lines: list) -> dict:
    return {
        "pagamento": _find_value_after(lines, "Valor do Pagamento") or 0.0,
        "total":     _find_value_after(lines, "Total") or 0.0,
    }


def _parse_emulti_remoto(lines: list) -> dict:
    return {
        "pagamento": _find_value_after(lines, "Valor do Pagamento") or 0.0,
        "total":     _find_value_after(lines, "Total") or 0.0,
    }


def _parse_esf_custeio(lines: list) -> dict:
    if not lines:
        return {}
    return {
        "qt_teto":             _find_int_after(lines, "Teto") or 0,
        "qt_credenciadas":     _find_int_after(lines, "credenciadas") or 0,
        "qt_homologadas":      _find_int_after(lines, "homologadas") or 0,
        "qt_pagas":            _find_int_after(lines, "pagas") or 0,
        "qt_100pct":           _find_int_after(lines, "100%") or 0,
        "qt_75pct":            _find_int_after(lines, "75%") or 0,
        "qt_50pct":            _find_int_after(lines, "50%") or 0,
        "qt_25pct":            _find_int_after(lines, "25%") or 0,
        "ied":                 _find_str_after(lines, "ESTRATO", ["ESTRATO 1","ESTRATO 2","ESTRATO 3","ESTRATO 4","ESTRATO 5"])
                               or next((ln for ln in lines if "ESTRATO" in ln.upper()), ""),
        "classificacao_qualidade": _find_str_after(lines, "Qualidade", ["ÓTIMO","BOM","REGULAR","RUIM","INSUFICIENTE"]) or "",
        "classificacao_vinculo":   _find_str_after(lines, "Vínculo",   ["ÓTIMO","BOM","REGULAR","RUIM","INSUFICIENTE"]) or "",
        "vl_equidade":         _find_value_after(lines, "Componente Equidade") or _find_value_after(lines, "Equidade") or 0.0,
        "vl_qualidade":        _find_value_after(lines, "Qualidade") or 0.0,
        "vl_vinculo":          _find_value_after(lines, "Vínculo e Acompanhamento") or _find_value_after(lines, "Vínculo") or 0.0,
        "vl_implantacao":      _find_value_after(lines, "Implantação") or 0.0,
        "vl_ajuste":           _find_value_after(lines, "Ajuste") or 0.0,
        "vl_desconto":         -abs(_find_value_after(lines, "Desconto") or 0.0),
        "vl_total_bruto":      _find_value_after(lines, "Total") or 0.0,
        "_scraped": True,
    }


def _parse_acs_custeio(lines: list) -> dict:
    if not lines:
        return {}
    return {
        "qt_teto":                _find_int_after(lines, "Teto") or 0,
        "qt_direto_credenciado":  _find_int_after(lines, "Direto credenciado") or _find_int_after(lines, "credenciado") or 0,
        "qt_direto_pago":         _find_int_after(lines, "Direto pago") or _find_int_after(lines, "direto pag") or 0,
        "vl_direto":              _find_value_after(lines, "Direto") or 0.0,
        "vl_parcela_extra_direto":_find_value_after(lines, "Parcela Extra") or 0.0,
        "qt_indireto_pago":       _find_int_after(lines, "Indireto pago") or _find_int_after(lines, "indireto") or 0,
        "vl_indireto":            _find_value_after(lines, "Indireto") or 0.0,
        "vl_total":               _find_value_after(lines, "Total ACS") or _find_value_after(lines, "Total") or 0.0,
        "_scraped": True,
    }


def _parse_esb_custeio(lines: list) -> dict:
    if not lines:
        return {}
    return {
        "qt_40h_credenciadas":   _find_int_after(lines, "credenciadas") or 0,
        "qt_40h_homologadas":    _find_int_after(lines, "homologadas") or 0,
        "qt_40h_pagas_modal_i":  _find_int_after(lines, "Modalidade I pagas") or _find_int_after(lines, "Modal. I") or 0,
        "qt_40h_pagas_modal_ii": _find_int_after(lines, "Modalidade II pagas") or _find_int_after(lines, "Modal. II") or 0,
        "vl_ref_modal_i":        _find_value_after(lines, "referência de custeio de modalidade I") or 0.0,
        "vl_ref_modal_ii":       _find_value_after(lines, "referência de custeio de modalidade II") or 0.0,
        "vl_esb_40h":            _find_value_after(lines, "Valor do Pagamento") or _find_value_after(lines, "Pagamento") or 0.0,
        "vl_qualidade_40h":      0.0,
        "qt_uom": 0, "vl_uom": 0.0,
        "vl_lrpd_municipal": 0.0,
        "vl_total_sb_calculado": _find_value_after(lines, "Total") or 0.0,
        "_scraped": True,
    }


def _parse_uom(lines: list) -> dict:
    if not lines:
        return {}
    return {
        "qt_credenciados": _find_int_after(lines, "credenciados") or 0,
        "qt_homologados":  _find_int_after(lines, "homologados") or 0,
        "qt_pagos":        _find_int_after(lines, "pagos") or 0,
        "vl_ref_custeio":  _find_value_after(lines, "referência de custeio") or 0.0,
        "vl_total":        _find_value_after(lines, "Total") or _find_value_after(lines, "Valor do Pagamento") or 0.0,
        "_scraped": True,
    }


def _parse_lrpd(lines: list) -> dict:
    if not lines:
        return {}
    return {
        "vl_total": _find_value_after(lines, "Total") or _find_value_after(lines, "Valor do Pagamento") or 0.0,
        "_scraped": True,
    }


def _parse_esfr_custeio(lines: list) -> dict:
    if not lines:
        return {}
    return {
        "qt_credenciadas": _find_int_after(lines, "credenciadas") or 0,
        "qt_homologadas":  _find_int_after(lines, "homologadas") or 0,
        "qt_pagas":        _find_int_after(lines, "pagas") or 0,
        "qt_embarcacoes":  _find_int_after(lines, "embarcações") or 0,
        "vl_ref_custeio":  _find_value_after(lines, "referência de custeio") or 0.0,
        "vl_custeio":      _find_value_after(lines, "Valor do Pagamento") or _find_value_after(lines, "Pagamento") or 0.0,
        "vl_vinculo":      0.0,
        "vl_total":        _find_value_after(lines, "Total") or 0.0,
        "_scraped": True,
    }


def _parse_microscopista(lines: list) -> dict:
    if not lines:
        return {}
    return {
        "qt_credenciados": _find_int_after(lines, "credenciados") or 0,
        "qt_pagos":        _find_int_after(lines, "pagos") or 0,
        "vl_ref_custeio":  _find_value_after(lines, "referência de custeio") or 0.0,
        "vl_total":        _find_value_after(lines, "Total") or _find_value_after(lines, "Valor do Pagamento") or 0.0,
        "_scraped": True,
    }


async def fetch_egestor_all() -> dict:
    """
    Retorna dados ao vivo do e-Gestor para TODOS os componentes APS.
    Usa cache de 6h. Em caso de falha parcial retorna o que foi obtido.
    """
    async with _lock:
        if _cache_valid():
            logger.info("eGestor cache hit (idade: %s)", datetime.utcnow() - _cache["ts"])
            return _cache["data"]

        logger.info("Iniciando scraping do e-Gestor APS — todos os componentes...")
        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as pw:
                browser = await pw.chromium.launch(
                    headless=True,
                    args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
                )
                context = await browser.new_context(
                    locale="pt-BR",
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"
                    ),
                )
                page = await context.new_page()

                raw: dict = {}
                for key, url in URLS.items():
                    try:
                        raw[key] = await _scrape_page(page, url, "Valor")
                        logger.info("eGestor %s: %d linhas", key, len(raw[key]))
                    except Exception as e:
                        logger.error("Erro scraping eGestor %s: %s", key, e)
                        raw[key] = []

                await browser.close()

            # Parseia cada componente
            emulti_custeio = _parse_emulti_custeio(raw.get("emulti_custeio", []))
            emulti_qual    = _parse_emulti_qualidade(raw.get("emulti_qualidade", []))
            emulti_remoto  = _parse_emulti_remoto(raw.get("emulti_remoto", []))

            esf_c  = _parse_esf_custeio(raw.get("esf_custeio", []))
            esf_q  = raw.get("esf_qualidade", [])
            esf_v  = raw.get("esf_vinculo", [])

            # Mescla qualidade/vínculo no esf se scraped
            if esf_c and esf_c.get("_scraped"):
                if esf_q:
                    v = _find_value_after(esf_q, "Qualidade") or _find_value_after(esf_q, "Valor")
                    if v:
                        esf_c["vl_qualidade"] = v
                if esf_v:
                    v = _find_value_after(esf_v, "Vínculo") or _find_value_after(esf_v, "Valor")
                    if v:
                        esf_c["vl_vinculo"] = v

            acs = _parse_acs_custeio(raw.get("acs_custeio", []))

            esb = _parse_esb_custeio(raw.get("esb_custeio", []))
            if raw.get("esb_qualidade") and esb.get("_scraped"):
                v = _find_value_after(raw["esb_qualidade"], "Valor do Pagamento") or _find_value_after(raw["esb_qualidade"], "Total")
                if v:
                    esb["vl_qualidade_40h"] = v

            uom   = _parse_uom(raw.get("uom", []))
            lrpd  = _parse_lrpd(raw.get("lrpd", []))

            # Agrega UOM + LRPD no eSB
            if esb.get("_scraped"):
                esb["qt_uom"]            = uom.get("qt_pagos", 0)
                esb["vl_uom"]            = uom.get("vl_total", 0.0)
                esb["vl_lrpd_municipal"] = lrpd.get("vl_total", 0.0)
                esb["vl_total_sb_calculado"] = (
                    (esb.get("vl_esb_40h") or 0)
                    + (esb.get("vl_qualidade_40h") or 0)
                    + (uom.get("vl_total") or 0)
                    + (lrpd.get("vl_total") or 0)
                )

            esfr = _parse_esfr_custeio(raw.get("esfr_custeio", []))
            if raw.get("esfr_vinculo") and esfr.get("_scraped"):
                v = _find_value_after(raw["esfr_vinculo"], "Valor do Pagamento") or _find_value_after(raw["esfr_vinculo"], "Total")
                if v:
                    esfr["vl_vinculo"] = v
                    esfr["vl_total"] = (esfr.get("vl_custeio") or 0) + v

            micro = _parse_microscopista(raw.get("microscopista", []))

            data = {
                "fonte": "egestor_live",
                "ultima_sincronizacao": datetime.utcnow().isoformat() + "Z",
                # Estrutura legada eMulti (compat.)
                "custeio":   emulti_custeio,
                "qualidade": emulti_qual,
                "remoto":    emulti_remoto,
                # Todos os componentes
                "esf":          esf_c,
                "acs":          acs,
                "esb":          esb,
                "esfr":         esfr,
                "microscopista": micro,
            }

            _cache["data"] = data
            _cache["ts"] = datetime.utcnow()
            logger.info(
                "eGestor OK — ESF=%s ACS=%s eSB=%s eSFR=%s Micro=%s eMulti=%d ln",
                esf_c.get("_scraped"), acs.get("_scraped"), esb.get("_scraped"),
                esfr.get("_scraped"), micro.get("_scraped"),
                len(raw.get("emulti_custeio", [])),
            )
            return data

        except Exception as e:
            logger.error("Falha geral no scraping do eGestor: %s", e)
            return None


# Mantém alias para compatibilidade com código que chama fetch_egestor_emulti
async def fetch_egestor_emulti() -> dict:
    return await fetch_egestor_all()


def get_cached_or_none() -> Optional[dict]:
    """Retorna cache se válido, sem fazer novo scraping."""
    if _cache_valid():
        return _cache["data"]
    return None
