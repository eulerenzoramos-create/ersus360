"""
InvestSUS Scraper — autenticação SCPA + API REST direta.

Fluxo:
  1. Playwright abre acesso.saude.gov.br (SCPA login)
  2. Preenche CPF + senha do env var
  3. Extrai cookie de sessão pós-login
  4. Usa cookie para chamar investsus-backend-prd.saude.gov.br/api diretamente
  5. Retorna propostas, repasses e saldos do município

Env vars necessários (Railway):
  INVESTSUS_CPF   — CPF do usuário SCPA (sem pontos/traço)
  INVESTSUS_SENHA — Senha do usuário no SCPA
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime
from typing import Any

import httpx
from playwright.async_api import async_playwright, Page, BrowserContext

logger = logging.getLogger(__name__)

_SCPA_LOGIN_URL  = "https://acesso.saude.gov.br"
_BACKEND_URL     = "https://investsus-backend-prd.saude.gov.br/api"
_CNPJ_APUI       = "12834320000126"   # FMS Apuí — sem pontos/barras

# ── credenciais ────────────────────────────────────────────────────────────────
def _credenciais() -> tuple[str, str]:
    cpf   = os.getenv("INVESTSUS_CPF", "")
    senha = os.getenv("INVESTSUS_SENHA", "")
    if not cpf or not senha:
        raise RuntimeError(
            "INVESTSUS_CPF e INVESTSUS_SENHA não configurados. "
            "Adicione as variáveis de ambiente no Railway."
        )
    return cpf.replace(".", "").replace("-", ""), senha


# ── login SCPA via Playwright ──────────────────────────────────────────────────
async def _fazer_login_scpa(page: Page, cpf: str, senha: str) -> None:
    """Navega até o SCPA, preenche CPF/senha e aguarda redirecionamento."""
    logger.info("InvestSUS scraper: navegando para SCPA login")
    await page.goto(_SCPA_LOGIN_URL, wait_until="domcontentloaded", timeout=60_000)

    # Clica na aba SCPA (em vez de gov.br OAuth)
    try:
        scpa_tab = page.locator("text=SCPA").first
        await scpa_tab.click(timeout=5_000)
        await page.wait_for_timeout(500)
    except Exception:
        pass  # já pode estar na aba SCPA

    # Preenche CPF
    cpf_field = page.locator("input[placeholder*='CPF'], input[name*='cpf'], input[id*='cpf'], input[type='text']").first
    await cpf_field.fill(cpf, timeout=10_000)

    # Preenche senha
    senha_field = page.locator("input[type='password']").first
    await senha_field.fill(senha, timeout=10_000)

    # Submit
    submit = page.locator("button[type='submit'], button:has-text('Entrar')").first
    await submit.click(timeout=10_000)

    # Aguarda redirecionamento para InvestSUS (até 60s)
    try:
        await page.wait_for_url("*investsus*", timeout=60_000)
        logger.info("InvestSUS scraper: login OK — %s", page.url)
    except Exception:
        # Verifica se há mensagem de erro
        page_text = await page.inner_text("body")
        if "incorretos" in page_text.lower() or "inválid" in page_text.lower():
            raise RuntimeError("Credenciais SCPA incorretas. Verifique INVESTSUS_CPF e INVESTSUS_SENHA.")
        logger.warning("InvestSUS scraper: timeout aguardando redirecionamento — URL atual: %s", page.url)


async def _extrair_cookies(context: BrowserContext) -> dict[str, str]:
    cookies = await context.cookies()
    return {c["name"]: c["value"] for c in cookies}


# ── chamadas REST com cookie de sessão ────────────────────────────────────────
async def _api_get(client: httpx.AsyncClient, path: str, params: dict | None = None) -> Any:
    url = f"{_BACKEND_URL}/{path.lstrip('/')}"
    resp = await client.get(url, params=params, timeout=20.0)
    if resp.status_code == 401:
        raise RuntimeError("Sessão InvestSUS expirada. Execute sincronização novamente.")
    resp.raise_for_status()
    return resp.json()


# ── normaliza proposta da API → nosso formato interno ─────────────────────────
def _normalizar_proposta(raw: dict) -> dict:
    return {
        "numero_proposta":   str(raw.get("numeroProposta") or raw.get("numero") or ""),
        "numero_convenio":   str(raw.get("numeroConvenio") or ""),
        "objeto":            raw.get("objeto") or raw.get("descricaoObjeto") or "",
        "tipo_emenda":       raw.get("tipoEmenda") or raw.get("tipoInstrumento") or "",
        "programa":          raw.get("nomePrograma") or raw.get("programa") or "",
        "parlamentar":       raw.get("nomeParlamentar") or raw.get("parlamentar") or "",
        "valor_global":      float(raw.get("valorGlobal") or raw.get("valor") or 0),
        "valor_aprovado":    float(raw.get("valorAprovado") or raw.get("valorGlobal") or 0),
        "valor_repassado":   float(raw.get("valorRepassado") or 0),
        "valor_executado":   float(raw.get("valorExecutado") or 0),
        "situacao_raw":      raw.get("situacao") or raw.get("descricaoSituacao") or "",
        "data_proposta":     raw.get("dataProposta") or raw.get("dataInicio"),
        "data_aprovacao":    raw.get("dataAprovacao"),
        "data_inicio":       raw.get("dataInicioVigencia") or raw.get("dataInicio"),
        "data_fim":          raw.get("dataFimVigencia") or raw.get("dataTermino"),
        "cnpj_proponente":   raw.get("cnpjProponente") or _CNPJ_APUI,
        "exercicio":         int(raw.get("anoExercicio") or raw.get("ano") or datetime.now().year),
        "raw":               raw,
    }


# ── função principal de sincronização ─────────────────────────────────────────
async def _login_via_http(cpf: str, senha: str) -> dict[str, str] | None:
    """
    Tenta autenticar via POST HTTP direto no SCPA (sem Playwright).
    Mais rápido, mas pode falhar se o SCPA exigir JS para submeter o form.
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            # Pega a página de login para extrair CSRF token se houver
            resp = await client.get(_SCPA_LOGIN_URL)
            cookies = dict(resp.cookies)

            # Tenta POST de login SCPA
            resp2 = await client.post(
                f"{_SCPA_LOGIN_URL}/login",
                data={"username": cpf, "password": senha},
                headers={"Content-Type": "application/x-www-form-urlencoded",
                         "Referer": _SCPA_LOGIN_URL},
            )
            # Verifica se redirecionou para InvestSUS
            if "investsus" in str(resp2.url):
                return dict(resp2.cookies)
    except Exception as exc:
        logger.debug("Login HTTP direto falhou: %s", exc)
    return None


async def sincronizar_investsus(cnpj: str | None = None) -> dict:
    """
    Autentica no SCPA, busca propostas do município e retorna dados normalizados.
    cnpj: CNPJ do fundo (sem formatação). Usa CNPJ de Apuí se None.
    """
    cpf, senha = _credenciais()
    cnpj = (cnpj or _CNPJ_APUI).replace(".", "").replace("/", "").replace("-", "")

    resultado: dict[str, Any] = {
        "propostas": [],
        "repasses": [],
        "saldos": [],
        "erros": [],
        "sincronizado_em": datetime.utcnow().isoformat() + "Z",
    }

    # Tenta login HTTP direto primeiro (mais rápido)
    session_cookies: dict[str, str] | None = await _login_via_http(cpf, senha)

    if session_cookies:
        logger.info("InvestSUS scraper: login via HTTP direto OK (%d cookies)", len(session_cookies))
    else:
        # Fallback: Playwright headless
        logger.info("InvestSUS scraper: usando Playwright para login SCPA")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
                  "--disable-setuid-sandbox", "--single-process"],
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 720},
            user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        )
        page = await context.new_page()

        try:
            # 1. Login SCPA (somente se HTTP direto não funcionou)
            if not session_cookies:
                await _fazer_login_scpa(page, cpf, senha)

            # 2. Extrai cookies de sessão
            cookies = session_cookies or await _extrair_cookies(context)
            logger.info("InvestSUS scraper: %d cookies disponíveis", len(cookies))

            # 3. Usa cookie para chamadas REST diretas (muito mais rápido que scraping de UI)
            async with httpx.AsyncClient(
                headers={
                    "Cookie": "; ".join(f"{k}={v}" for k, v in cookies.items()),
                    "Accept": "application/json",
                    "Referer": "https://investsus.saude.gov.br/",
                    "Origin": "https://investsus.saude.gov.br",
                },
                follow_redirects=True,
            ) as client:

                # 3a. Propostas paginadas do proponente
                try:
                    page_num = 0
                    while True:
                        dados = await _api_get(client, "propostas/paginado", {
                            "cnpjProponente": cnpj,
                            "page": page_num,
                            "size": 50,
                        })
                        items = dados.get("content") or dados.get("propostas") or []
                        if not items:
                            break
                        resultado["propostas"].extend(_normalizar_proposta(p) for p in items)
                        total_pages = dados.get("totalPages", 1)
                        page_num += 1
                        if page_num >= total_pages:
                            break
                    logger.info("InvestSUS scraper: %d propostas encontradas", len(resultado["propostas"]))
                except Exception as exc:
                    logger.warning("InvestSUS propostas: %s", exc)
                    resultado["erros"].append({"endpoint": "propostas/paginado", "erro": str(exc)})

                    # Fallback: tenta endpoint alternativo sem paginação
                    try:
                        dados = await _api_get(client, "propostas", {"cnpjProponente": cnpj})
                        items = dados if isinstance(dados, list) else dados.get("content", [])
                        resultado["propostas"].extend(_normalizar_proposta(p) for p in items)
                    except Exception as exc2:
                        resultado["erros"].append({"endpoint": "propostas (fallback)", "erro": str(exc2)})

                # 3b. Saldos das contas
                try:
                    dados = await _api_get(client, "saldo", {"cnpjEnte": cnpj})
                    resultado["saldos"] = dados if isinstance(dados, list) else [dados]
                except Exception as exc:
                    resultado["erros"].append({"endpoint": "saldo", "erro": str(exc)})

                # 3c. Repasses recentes
                try:
                    dados = await _api_get(client, "repasse", {
                        "cnpjEnte": cnpj,
                        "page": 0,
                        "size": 20,
                    })
                    items = dados.get("content") or (dados if isinstance(dados, list) else [])
                    resultado["repasses"] = items
                except Exception as exc:
                    resultado["erros"].append({"endpoint": "repasse", "erro": str(exc)})

        except Exception as exc:
            logger.error("InvestSUS scraper falhou: %s", exc, exc_info=True)
            resultado["erros"].append({"endpoint": "auth", "erro": str(exc)})
        finally:
            await browser.close()

    return resultado
