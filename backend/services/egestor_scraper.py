"""
Scraper do e-Gestor APS — busca dados públicos de pagamento eMulti para Apuí/AM.
Usa Playwright (Chromium headless) para renderizar as páginas Angular.
Cache em memória com TTL de 6 horas.
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

IBGE = "130014"
BASE_URL = "https://relatorioaps.saude.gov.br/gerenciaaps/pagamento/emulti"

URLS = {
    "custeio":    f"{BASE_URL}/custeio?ibge={IBGE}",
    "qualidade":  f"{BASE_URL}/componente-qualidade?ibge={IBGE}",
    "remoto":     f"{BASE_URL}/atendimento-remoto?ibge={IBGE}",
}

# Cache global { "data": {...}, "ts": datetime }
_cache: dict = {"data": None, "ts": None}
_TTL = timedelta(hours=6)
_lock = asyncio.Lock()


def _cache_valid() -> bool:
    return (
        _cache["data"] is not None
        and _cache["ts"] is not None
        and datetime.utcnow() - _cache["ts"] < _TTL
    )


async def _scrape_page(page, url: str, key: str) -> dict:
    """Abre URL no Playwright e extrai os valores financeiros da página."""
    await page.goto(url, wait_until="networkidle", timeout=30_000)

    # Aguarda o card de valores aparecer
    try:
        await page.wait_for_selector("text=Valor do Pagamento", timeout=15_000)
    except Exception:
        logger.warning("Timeout aguardando conteúdo em %s", url)
        return {}

    result = {}

    # Extrai todos os textos de valor (padrão: "R$ X.XXX,XX")
    cells = await page.locator(".card-body .row, .info-row, dl, dt, dd, table td, .value, [class*='value']").all_text_contents()

    # Estratégia: pegar o texto completo da página e fazer parsing
    content = await page.inner_text("body")
    lines = [l.strip() for l in content.splitlines() if l.strip()]

    def parse_brl(text: str) -> Optional[float]:
        import re
        m = re.search(r"R\$\s*([\d.,]+)", text.replace("\xa0", " "))
        if not m:
            return None
        s = m.group(1).replace(".", "").replace(",", ".")
        try:
            return float(s)
        except ValueError:
            return None

    def find_value_after(keyword: str) -> Optional[float]:
        for i, line in enumerate(lines):
            if keyword.lower() in line.lower():
                # Procura nas próximas 3 linhas
                for j in range(i, min(i + 4, len(lines))):
                    v = parse_brl(lines[j])
                    if v is not None:
                        return v
        return None

    competencia = None
    parcela = None
    for line in lines:
        if "JAN/" in line.upper() or "FEV/" in line.upper() or "MAR/" in line.upper() \
                or "ABR/" in line.upper() or "MAI/" in line.upper() or "JUN/" in line.upper() \
                or "JUL/" in line.upper() or "AGO/" in line.upper() or "SET/" in line.upper() \
                or "OUT/" in line.upper() or "NOV/" in line.upper() or "DEZ/" in line.upper():
            import re
            m = re.search(r"([A-Z]{3}/\d{4})", line.upper())
            if m:
                competencia = m.group(1)
        if "/" in line and len(line) <= 6:
            import re
            if re.match(r"^\d+/\d+$", line):
                parcela = line

    result["competencia_cnes"] = competencia or "—"
    result["parcela"] = parcela or "—"
    result["pagamento"] = find_value_after("Valor do Pagamento") or 0.0
    result["ajuste"] = find_value_after("Ajuste") or 0.0
    result["desconto"] = find_value_after("Desconto") or 0.0
    result["total"] = find_value_after("Total") or 0.0

    # Indicadores específicos do Custeio
    if key == "custeio":
        def find_int_after(keyword: str) -> Optional[int]:
            for i, line in enumerate(lines):
                if keyword.lower() in line.lower():
                    for j in range(i, min(i + 4, len(lines))):
                        import re
                        m = re.search(r"\b(\d+)\b", lines[j])
                        if m:
                            return int(m.group(1))
            return None

        result["equipes_credenciadas"] = find_int_after("equipes credenciadas") or 0
        result["equipes_adesao_remoto_tic"] = find_int_after("adesão ao atendimento remoto") or 0
        result["equipes_homologadas"] = find_int_after("homologadas") or 0
        result["equipes_pagas"] = find_int_after("equipes pagas") or 0
        result["equipes_atendimento_remoto_pagas"] = find_int_after("atendimento remoto pagas") or 0

    return result


async def fetch_egestor_emulti() -> dict:
    """
    Retorna dados ao vivo do e-Gestor para os 3 sub-componentes eMulti.
    Usa cache de 6h. Em caso de falha retorna None para o frontend usar fallback.
    """
    async with _lock:
        if _cache_valid():
            logger.info("eGestor cache hit (idade: %s)", datetime.utcnow() - _cache["ts"])
            return _cache["data"]

        logger.info("Iniciando scraping do e-Gestor APS...")
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

                results = {}
                for key, url in URLS.items():
                    try:
                        results[key] = await _scrape_page(page, url, key)
                        logger.info("eGestor %s: %s", key, results[key])
                    except Exception as e:
                        logger.error("Erro scraping eGestor %s: %s", key, e)
                        results[key] = {}

                await browser.close()

            data = {
                "fonte": "egestor_live",
                "ultima_sincronizacao": datetime.utcnow().isoformat() + "Z",
                "custeio": results.get("custeio", {}),
                "qualidade": results.get("qualidade", {}),
                "remoto": results.get("remoto", {}),
            }

            _cache["data"] = data
            _cache["ts"] = datetime.utcnow()
            logger.info("eGestor scraping concluído com sucesso.")
            return data

        except Exception as e:
            logger.error("Falha geral no scraping do eGestor: %s", e)
            return None


def get_cached_or_none() -> Optional[dict]:
    """Retorna cache se válido, sem fazer novo scraping."""
    if _cache_valid():
        return _cache["data"]
    return None
