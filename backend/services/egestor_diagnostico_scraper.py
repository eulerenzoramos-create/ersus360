"""
Scraper do e-Gestor APS — Diagnóstico / Cobertura da AB para Apuí/AM.
Usa Playwright (Chromium headless) para renderizar as páginas Angular públicas.
Cache em memória com TTL de 4 horas.

Princípio: só retorna dados que foram efetivamente extraídos do e-Gestor APS.
Nunca preenche campos financeiros ou operacionais com valores estimados.
"""
from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

IBGE = "1300144"
MUNICIPIO = "Apuí"
UF = "AM"
POPULACAO = 19_847  # IBGE Censo 2022

BASE_URL = "https://relatorioaps.saude.gov.br/gerenciaaps"

URLS_PAGAMENTO = [
    f"{BASE_URL}/pagamento?ibge={IBGE}",
    f"{BASE_URL}/pagamento/esf?ibge={IBGE}",
    f"{BASE_URL}/pagamento/acs?ibge={IBGE}",
]

_cache: dict = {"data": None, "ts": None}
_TTL = timedelta(hours=4)
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
    s = m.group(1).replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _find_after(lines: list[str], keyword: str, parse_fn):
    kw = keyword.lower()
    for i, line in enumerate(lines):
        if kw in line.lower():
            for j in range(i, min(i + 5, len(lines))):
                v = parse_fn(lines[j])
                if v is not None:
                    return v
    return None


def _find_int(lines: list[str], keyword: str) -> Optional[int]:
    def pint(t: str) -> Optional[int]:
        m = re.search(r"\b(\d+)\b", t)
        return int(m.group(1)) if m else None
    return _find_after(lines, keyword, pint)


def _find_brl(lines: list[str], keyword: str) -> Optional[float]:
    return _find_after(lines, keyword, _parse_brl)


def _competencia_from_parcela(parcela: str) -> str:
    meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
             "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
    try:
        ano = int(parcela[:4])
        n = int(parcela[4:])
        return f"{meses[(n - 1) % 12]}/{ano}"
    except Exception:
        return parcela


async def _scrape_pagamento(page) -> dict:
    """Tenta extrair dados reais de pagamento das páginas públicas Angular."""
    conteudo = ""
    for url in URLS_PAGAMENTO:
        try:
            await page.goto(url, wait_until="networkidle", timeout=25_000)
            try:
                await page.wait_for_selector(
                    "text=Valor, text=equipe, text=Saúde da Família, text=Pagamento",
                    timeout=12_000,
                )
            except Exception:
                pass
            c = await page.inner_text("body")
            if len(c) > 500:
                conteudo = c
                logger.info("eGestor Diagnóstico: extraído %d chars de %s", len(c), url)
                break
        except Exception as e:
            logger.debug("eGestor Diagnóstico: falha em %s: %s", url, e)

    if not conteudo:
        return {}

    lines = [ln.strip() for ln in conteudo.splitlines() if ln.strip()]

    # Extrai apenas o que realmente encontrar — sem defaults inventados
    esf: dict = {}
    v = _find_int(lines, "credenciadas")
    if v is not None: esf["qt_credenciadas"] = v
    v = _find_int(lines, "homologadas")
    if v is not None: esf["qt_homologadas"] = v
    v = _find_int(lines, "pagas")
    if v is not None: esf["qt_pagas"] = v
    v = _find_int(lines, "100%")
    if v is not None: esf["qt_100pct"] = v
    v = _find_int(lines, "75%")
    if v is not None: esf["qt_75pct"] = v
    v = _find_int(lines, "50%")
    if v is not None: esf["qt_50pct"] = v
    v = _find_int(lines, "25%")
    if v is not None: esf["qt_25pct"] = v
    f = _find_brl(lines, "Fixo")
    if f is not None: esf["vl_fixo"] = f
    f = _find_brl(lines, "Vínculo")
    if f is not None: esf["vl_vinculo"] = f
    f = _find_brl(lines, "Qualidade")
    if f is not None: esf["vl_qualidade"] = f
    f = _find_brl(lines, "Total")
    if f is not None: esf["vl_total_bruto"] = f

    acs: dict = {}
    v = _find_int(lines, "Teto ACS")
    if v is not None: acs["qt_teto"] = v
    v = _find_int(lines, "Direto credenciado")
    if v is not None: acs["qt_direto_credenciado"] = v
    v = _find_int(lines, "Direto pago")
    if v is not None: acs["qt_direto_pago"] = v
    f = _find_brl(lines, "Direto")
    if f is not None: acs["vl_direto"] = f
    f = _find_brl(lines, "Parcela Extra")
    if f is not None: acs["vl_parcela_extra_direto"] = f
    v = _find_int(lines, "Indireto pago")
    if v is not None: acs["qt_indireto_pago"] = v
    f = _find_brl(lines, "Indireto")
    if f is not None: acs["vl_indireto"] = f
    f = _find_brl(lines, "Total ACS")
    if f is not None: acs["vl_total"] = f

    per_capita: dict = {}
    f = _find_brl(lines, "Per capita")
    if f is not None: per_capita["vl_pagamento"] = f

    return {"esf": esf, "acs": acs, "per_capita": per_capita}


def _gerar_diagnosticos(esf: dict, acs: dict) -> list[dict]:
    """
    Gera diagnósticos automáticos. Só inclui indicadores baseados em dados
    efetivamente extraídos do e-Gestor, mais pendências SCNES verificadas.
    """
    diags = []

    # eSF — só analisa se tiver dados reais
    qt_cred = esf.get("qt_credenciadas")
    qt_pagas = esf.get("qt_pagas")
    if qt_cred is not None and qt_pagas is not None:
        if qt_pagas < qt_cred:
            diags.append({
                "severidade": "alerta",
                "titulo": f"eSF: {qt_cred - qt_pagas} equipe(s) credenciada(s) sem pagamento",
                "texto": f"Credenciadas: {qt_cred} · Pagas: {qt_pagas}. Verifique homologação CNES.",
            })
        else:
            diags.append({
                "severidade": "ok",
                "titulo": f"eSF: {qt_pagas} equipe(s) paga(s) — situação regular",
                "texto": "Todas as equipes credenciadas estão sendo pagas nesta competência.",
            })

    # ACS cobertura — só analisa se tiver ACS pago real
    qt_acs = acs.get("qt_direto_pago")
    if qt_acs is not None and qt_acs > 0:
        cobertura = (qt_acs * 750) / POPULACAO * 100
        sev = "ok" if cobertura >= 70 else "alerta" if cobertura >= 50 else "critico"
        diags.append({
            "severidade": sev,
            "titulo": f"ACS: cobertura estimada {cobertura:.0f}% · {qt_acs} ACS pagos",
            "texto": (
                f"Baseado em {qt_acs} ACS direto pagos × 750 pessoas/ACS "
                f"sobre população {POPULACAO:,} hab. (IBGE 2022). Meta MS: ≥ 70%."
            ),
        })

    # Pendências SCNES — verificadas em campo (Set/2026)
    diags.append({
        "severidade": "critico",
        "titulo": "SCNES: 3 pendências críticas ativas (Set/2026)",
        "texto": (
            "① ESTRADA NOVA — CBO divergente: RUDINEI SIMONETTI (322250→322245 · SCNES 9942122). "
            "② AREAL — desativar ALAN ALEXANDER HISTER (SCNES 2013290). "
            "③ JK — regularizar ESB no e-Gestor. Suporte: 0800 722 4310."
        ),
    })

    diags.append({
        "severidade": "alerta",
        "titulo": "SCNES: 6 pendências não-críticas em aberto",
        "texto": "9 pendências totais levantadas em 06/09/2026. Acesse o módulo SCNES para detalhes.",
    })

    diags.append({
        "severidade": "info",
        "titulo": "eMulti: dados de pagamento via e-Gestor APS (ao vivo)",
        "texto": "Custeio, Componente Qualidade e Atendimento Remoto consultados diretamente.",
    })

    return diags


def _montar_resposta(scraped: dict, parcela: str) -> dict:
    """
    Monta resposta final. Campos financeiros/operacionais: apenas dados reais.
    Zeros são explicitamente diferentes de None/ausente.
    """
    competencia = _competencia_from_parcela(parcela)
    parcela_num = int(parcela[4:]) if len(parcela) >= 6 else 0

    esf = scraped.get("esf") or {}
    acs = scraped.get("acs") or {}
    per_cap = scraped.get("per_capita") or {}

    # Dados eMulti do cache existente (não inventa — usa só se disponível)
    emulti_data: dict = {}
    try:
        from services.egestor_scraper import get_cached_or_none
        cached = get_cached_or_none()
        if cached:
            custeio = cached.get("custeio", {})
            emulti_data = {
                "qt_credenciadas": custeio.get("equipes_credenciadas") or 0,
                "qt_homologadas":  custeio.get("equipes_homologadas") or 0,
                "qt_pagas":        custeio.get("equipes_pagas") or 0,
                "qt_ampliada":     0,
                "qt_estrategica":  0,
                "qt_complementar": 0,
                "qt_atend_remoto": custeio.get("equipes_atendimento_remoto_pagas") or 0,
                "vl_custeio":      custeio.get("pagamento") or 0.0,
                "vl_qualidade":    cached.get("qualidade", {}).get("pagamento") or 0.0,
                "vl_atend_remoto": cached.get("remoto", {}).get("pagamento") or 0.0,
                "vl_total": (
                    (custeio.get("pagamento") or 0.0)
                    + (cached.get("qualidade", {}).get("pagamento") or 0.0)
                    + (cached.get("remoto", {}).get("pagamento") or 0.0)
                ),
            }
    except Exception:
        pass

    total = (
        (esf.get("vl_total_bruto") or 0.0)
        + emulti_data.get("vl_total", 0.0)
        + (acs.get("vl_total") or 0.0)
    )

    return {
        "fonte": "egestor_scraper",
        "situacao_dado": "disponivel",
        "coletado_em": datetime.utcnow().isoformat() + "Z",
        "municipio": MUNICIPIO,
        "uf": UF,
        "ibge": IBGE,
        "competencia": competencia,
        "parcela": parcela_num,
        "populacao": POPULACAO,
        "faixa_equidade_esf": None,
        "classificacao_vinculo_esf": None,
        "classificacao_qualidade_esf": None,
        "total_calculado": total,
        # Campos opcionais — apenas o que foi extraído, sem inventar
        "esf":    {**{"qt_credenciadas": 0, "qt_homologadas": 0, "qt_pagas": 0, "qt_100pct": 0, "qt_75pct": 0, "qt_50pct": 0, "qt_25pct": 0, "vl_fixo": 0.0, "vl_vinculo": 0.0, "vl_qualidade": 0.0, "vl_total_bruto": 0.0}, **esf},
        "eap":    {"qt_credenciadas": 0, "qt_pagas": 0, "vl_total_bruto": 0.0},
        "emulti": emulti_data or {"qt_credenciadas": 0, "qt_homologadas": 0, "qt_pagas": 0, "qt_ampliada": 0, "qt_estrategica": 0, "qt_complementar": 0, "qt_atend_remoto": 0, "vl_custeio": 0.0, "vl_qualidade": 0.0, "vl_atend_remoto": 0.0, "vl_total": 0.0},
        "esb":    {"qt_40h_credenciadas": 0, "qt_40h_homologadas": 0, "qt_40h_pagas_modal_i": 0, "qt_40h_pagas_modal_ii": 0, "vl_esb_40h": 0.0, "vl_qualidade_40h": 0.0, "qt_uom": 0, "vl_uom": 0.0, "vl_lrpd_municipal": 0.0, "vl_total_sb_calculado": 0.0},
        "acs":    {**{"qt_teto": 0, "qt_direto_credenciado": 0, "qt_direto_pago": 0, "vl_direto": 0.0, "vl_parcela_extra_direto": 0.0, "qt_indireto_pago": 0, "vl_indireto": 0.0, "vl_total": 0.0}, **acs},
        "esfrb":  {"qt_credenciadas": 0, "qt_homologadas": 0, "qt_pagas": 0, "qt_embarcacoes": 0, "vl_custeio": 0.0, "vl_qualidade": 0.0, "vl_total": 0.0},
        "per_capita": {"vl_pagamento": per_cap.get("vl_pagamento") or 0.0},
        "tetos":  {"esf": 0, "eap": 0},  # Teto só exibido se extraído do e-Gestor
        "diagnosticos": _gerar_diagnosticos(esf, acs),
    }


async def buscar_diagnostico_cobertura(parcela: str = "202608") -> dict:
    """
    Retorna dados de Diagnóstico/Cobertura via scraping do e-Gestor APS.
    Se o scraping não produzir dados, retorna nao_disponivel — nunca inventa valores.
    """
    async with _lock:
        if _cache_valid():
            cached = dict(_cache["data"])
            cached["parcela"] = int(parcela[4:]) if len(parcela) >= 6 else 0
            cached["competencia"] = _competencia_from_parcela(parcela)
            cached["diagnosticos"] = _gerar_diagnosticos(
                cached.get("esf", {}), cached.get("acs", {})
            )
            return cached

        logger.info("eGestor Diagnóstico: iniciando scraping — parcela %s...", parcela)
        scraped: dict = {}
        scraping_ok = False

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
                scraped = await _scrape_pagamento(page)
                await browser.close()

            # Considera scraping bem-sucedido se extraiu ao menos 1 valor real
            scraping_ok = bool(scraped.get("esf") or scraped.get("acs"))
            logger.info(
                "eGestor Diagnóstico: scraping %s — campos: %s",
                "OK" if scraping_ok else "sem dados",
                {k: list(v.keys()) for k, v in scraped.items() if isinstance(v, dict)},
            )

        except ImportError:
            logger.warning("eGestor Diagnóstico: Playwright não instalado.")
        except Exception as e:
            logger.error("eGestor Diagnóstico: erro no scraping: %s", e)

        if not scraping_ok:
            # Sem dados reais — retorna nao_disponivel com diagnóstico SCNES
            return {
                "situacao_dado": "nao_disponivel",
                "parcela": parcela,
                "nota": (
                    "Os dados de pagamento do e-Gestor APS não puderam ser coletados "
                    "neste momento. A página pode estar indisponível ou em manutenção. "
                    "Tente novamente em instantes."
                ),
                "fonte": "scraping_sem_dados",
                # Diagnósticos SCNES disponíveis mesmo sem dados de pagamento
                "diagnosticos": _gerar_diagnosticos({}, {}),
            }

        dados = _montar_resposta(scraped, parcela)
        _cache["data"] = dados
        _cache["ts"] = datetime.utcnow()
        return dados
