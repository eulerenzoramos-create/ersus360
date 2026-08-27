"""
Agente de Portarias do Ministério da Saúde — DOU
Consulta a API pública do Diário Oficial da União, filtra portarias
relevantes para Apuí/AM e envia e-mail diário às 06h (America/Manaus).

Variáveis de ambiente obrigatórias:
  EMAIL_PROVIDER      smtp | resend  (default: smtp)
  EMAIL_FROM          remetente (ex: ersus360@prefeituraapui.am.gov.br)
  EMAIL_RECIPIENT     destinatário (ex: eulerenzoramos@gmail.com)
  EMAIL_TIMEZONE      America/Manaus
  EMAIL_SEND_HOUR     06:00
  SMTP_HOST           smtp.gmail.com
  SMTP_PORT           587
  SMTP_USER           (Railway env var — nunca hardcoded)
  SMTP_PASS           (Railway env var — nunca hardcoded)
  RESEND_API_KEY      (alternativo, se EMAIL_PROVIDER=resend)
"""
from __future__ import annotations
import json
import logging
import os
import re
import smtplib
import ssl
from datetime import datetime, date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ── Configurações via env ────────────────────────────────────────────────────
EMAIL_PROVIDER  = os.getenv("EMAIL_PROVIDER", "smtp").lower()
EMAIL_FROM      = os.getenv("EMAIL_FROM", "noreply@ersus360.local")
EMAIL_RECIPIENT = os.getenv("EMAIL_RECIPIENT", "eulerenzoramos@gmail.com")
EMAIL_TIMEZONE  = os.getenv("EMAIL_TIMEZONE", "America/Manaus")
EMAIL_SEND_HOUR = os.getenv("EMAIL_SEND_HOUR", "06:00")
SMTP_HOST       = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT       = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER       = os.getenv("SMTP_USER", "")
SMTP_PASS       = os.getenv("SMTP_PASS", "")
RESEND_API_KEY  = os.getenv("RESEND_API_KEY", "")

# Termos de busca no DOU
TERMOS_APUI  = ["apuí", "apui", "1300144"]
TERMOS_AM    = ["amazonas", " am,", " am.", "(am)"]
TERMOS_SAUDE = ["ministério da saúde", "saúde", "atenção básica", "atenção primária",
                "financiamento", "portaria", "sus", "fundo nacional"]
ORGAO_MS     = "Ministério da Saúde"

# DOU — URLs base
DOU_LEITURA  = "https://www.in.gov.br/leiturajornal"          # leitura por seção e data
DOU_BUSCA    = "https://www.in.gov.br/consulta/-/buscar-conteudo"
DOU_ORGAO    = "Ministério da Saúde"

# API interna usada pelo leiturajornal (seções DOU1/DOU2/DOU3)
DOU_API_SECAO = "https://www.in.gov.br/consulta/-/buscar-conteudo"


# ── Consulta DOU ─────────────────────────────────────────────────────────────

def _extrair_portarias_html(html: str) -> list[dict]:
    """
    Extrai portarias de resposta HTML do DOU.
    Prioriza JSON embutido em <script> tags (padrão do leiturajornal),
    depois links <a>, e evita fragmentos JSON como títulos.
    """
    resultado: list[dict] = []
    vistos: set[str] = set()

    def _limpo(t: str) -> str:
        """Remove fragmentos JSON, espaços extras e caracteres indesejados."""
        t = re.sub(r'"[a-zA-Z]+"\s*:\s*"[^"]*"', '', t)  # remove "key":"value"
        t = re.sub(r'[{}\[\]]', '', t)
        t = re.sub(r'\s+', ' ', t).strip()
        return t

    # Estratégia A: extrair objetos JSON de <script> tags (leiturajornal embute dados assim)
    for script in re.findall(r'<script[^>]*>(.*?)</script>', html, re.S | re.I):
        try:
            # Procura arrays JSON com portarias
            for match in re.finditer(r'\[(\{["\w].*?\})\]', script, re.S):
                try:
                    items = json.loads('[' + match.group(1) + ']')
                    for item in (items if isinstance(items, list) else []):
                        titulo = (item.get('title') or item.get('titulo') or
                                  item.get('identifica') or item.get('name') or '')
                        if re.search(r'portaria', titulo, re.I):
                            t = _limpo(titulo)
                            if t and t not in vistos and len(t) > 5:
                                vistos.add(t)
                                resultado.append({
                                    "title": t,
                                    "urlAddress": item.get('urlAddress') or item.get('url') or '',
                                    "content": item.get('content') or item.get('conteudo') or '',
                                    "pubDate": item.get('pubDate') or item.get('data') or '',
                                    "orgaoName": "Ministério da Saúde",
                                })
                except Exception:
                    pass
        except Exception:
            pass

    # Estratégia B: links <a href="/web/dou/-/..."> com texto limpo
    if not resultado:
        for link, titulo in re.findall(
            r'href="(https?://www\.in\.gov\.br/web/dou/-/[^"]+)"[^>]*>\s*([^<]{5,150})',
            html, re.I
        ):
            t = _limpo(titulo)
            if t and t not in vistos and not re.search(r'[{}":]', t):
                vistos.add(t)
                resultado.append({"urlAddress": link, "title": t, "orgaoName": "Ministério da Saúde"})

    # Estratégia C: títulos em tags semânticas — apenas se limpas (sem JSON)
    if not resultado:
        for titulo in re.findall(
            r'<(?:h[1-4]|span|div)[^>]*class="[^"]*(?:titulo|title|dou)[^"]*"[^>]*>\s*([^<]{10,200})',
            html, re.I
        ):
            t = _limpo(titulo)
            if re.search(r'portaria', t, re.I) and t not in vistos and not re.search(r'[{}":]', t):
                vistos.add(t)
                resultado.append({"title": t, "orgaoName": "Ministério da Saúde"})

    return resultado


async def _buscar_portarias_ms(data_ref: date) -> list[dict[str, Any]]:
    """
    Busca portarias do MS no DOU para a data informada.
    Estratégias em cascata:
      1. leiturajornal (interface de leitura oficial) — secoes DO1/DO2
      2. buscar-conteudo (API de busca do in.gov.br)
      3. pesquisa-de-materia (endpoint legado)
    """
    data_str   = data_ref.strftime("%d-%m-%Y")   # DD-MM-YYYY (padrão DOU)
    data_iso   = data_ref.strftime("%Y-%m-%d")   # YYYY-MM-DD (usado internamente)
    portarias: list[dict] = []

    hdrs = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0 Safari/537.36 ERSUS360/2.0"
        ),
        "Accept": "application/json, text/html, */*",
        "Referer": "https://www.in.gov.br/leiturajornal",
        "Accept-Language": "pt-BR,pt;q=0.9",
    }

    # ── Estratégia 1: leiturajornal — API interna que alimenta os dropdowns ────
    # Replica exatamente: Data → Ministério da Saúde → Portaria (como na tela)
    # O leiturajornal chama internamente:
    #   GET /consulta/-/buscar-conteudo?orgaoPesquisa=...&data=DD-MM-YYYY&tipoDeAto=Portaria&secao=DO1
    for secao in ("DO1", "DO2"):
        if portarias:
            break
        params_lj = {
            "orgaoPesquisa": "Ministério da Saúde",
            "data":          data_str,          # DD-MM-YYYY
            "tipoDeAto":     "Portaria",
            "secao":         secao,
            "numberPerPage": "100",
        }
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as c:
                r_lj = await c.get(DOU_BUSCA, params=params_lj, headers=hdrs)
            if r_lj.status_code == 200:
                try:
                    d = r_lj.json()
                    items = (d if isinstance(d, list)
                             else d.get("items") or d.get("content") or d.get("results") or [])
                    if items:
                        portarias.extend(items)
                        logger.info("leiturajornal API %s %s — %d portarias MS", data_str, secao, len(items))
                except Exception:
                    extraidos = _extrair_portarias_html(r_lj.text)
                    if extraidos:
                        portarias.extend(extraidos)
                        logger.info("leiturajornal HTML %s %s — %d portarias", data_str, secao, len(extraidos))
        except Exception as exc:
            logger.warning("leiturajornal %s erro: %s", secao, exc)

    # ── Estratégia 1b: leiturajornal página HTML com filtros na URL ───────────
    # URL do tipo: /leiturajornal?data=27-08-2026&secao=do1&orgao=ministério-da-saude&tipoDeAto=Portaria
    if not portarias:
        for secao in ("do1", "do2"):
            try:
                async with httpx.AsyncClient(timeout=30, follow_redirects=True) as c:
                    r_html = await c.get(
                        DOU_LEITURA,
                        params={"data": data_str, "secao": secao,
                                "orgao": "ministerio-da-saude", "tipoDeAto": "Portaria"},
                        headers=hdrs,
                    )
                if r_html.status_code == 200:
                    extraidos = _extrair_portarias_html(r_html.text)
                    if extraidos:
                        portarias.extend(extraidos)
                        logger.info("leiturajornal HTML2 %s %s — %d portarias", data_str, secao, len(extraidos))
                        break
            except Exception as exc2:
                logger.warning("leiturajornal HTML2 %s erro: %s", secao, exc2)

    # ── Estratégia 2: buscar-conteudo (API principal de busca) ────────────────
    if not portarias:
        params_b = {
            "q": "portaria",
            "exactDate": data_str,
            "orgaoPesquisa": DOU_ORGAO,
            "tipoDe": "Portaria",
            "numberPerPage": "100",
        }
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as c:
                r2 = await c.get(DOU_BUSCA, params=params_b, headers=hdrs)
            if r2.status_code == 200:
                try:
                    d2 = r2.json()
                    portarias = (d2 if isinstance(d2, list)
                                 else d2.get("items") or d2.get("results") or d2.get("content") or [])
                except Exception:
                    portarias = _extrair_portarias_html(r2.text)
        except Exception as exc2:
            logger.warning("buscar-conteudo erro: %s", exc2)

    # ── Estratégia 3: pesquisa-de-materia (endpoint legado) ───────────────────
    if not portarias:
        url_leg = (
            "https://www.in.gov.br/servicos/pesquisa-de-materia"
            f"?tipoPesquisa=TIPO_DATA&data={data_str}"
            "&orgao=MINISTERIO+DA+SAUDE&tipoDeAto=Portaria"
        )
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as c:
                r3 = await c.get(url_leg, headers=hdrs)
            if r3.status_code == 200:
                try:
                    d3 = r3.json()
                    portarias = d3 if isinstance(d3, list) else d3.get("items", [])
                except Exception:
                    portarias = _extrair_portarias_html(r3.text)
        except Exception as exc3:
            logger.warning("pesquisa-de-materia erro: %s", exc3)

    # ── Filtro estrito: apenas Ministério da Saúde ───────────────────────────
    SIGLAS_MS = {"gm/ms", "gm/m", "se/ms", "svs/ms", "saes/ms", "saps/ms", "sas/ms",
                 "sctie/ms", "sgtes/ms", "ses/ms", "ms nº", "ms n°", "/ms nº", "/ms n°"}
    ORGAOS_EXCLUIR = {"minc", "cultura", "educação", "mec", "defesa", "fazenda",
                      "planejamento", "trabalho", "justiça", "agricultura", "meio ambiente",
                      "infraestrutura", "comunicações", "previdência", "turismo",
                      "desenvolvimento agrário", "pesca", "sefic", "secom"}

    def _é_portaria_ms(p: dict) -> bool:
        titulo = (p.get('title') or p.get('titulo') or '').lower()
        orgao  = (p.get('orgaoName') or p.get('orgao') or '').lower()
        # Excluir se órgão contém outro ministério
        if any(ex in orgao for ex in ORGAOS_EXCLUIR):
            return False
        if any(ex in titulo for ex in ORGAOS_EXCLUIR):
            return False
        # Aceitar se título ou órgão referencia MS
        if any(s in titulo for s in SIGLAS_MS):
            return True
        if "saúde" in orgao or "saude" in orgao:
            return True
        if "saúde" in titulo or "saude" in titulo:
            return True
        # Se órgão não diz nada útil mas veio da busca por MS, aceitar
        if not orgao or orgao in ("ministério da saúde", "ministerio da saude"):
            return True
        return False

    filtradas = [p for p in portarias if _é_portaria_ms(p)]

    # Deduplicação por título normalizado
    vistos: set[str] = set()
    dedup: list[dict] = []
    for p in filtradas:
        chave = re.sub(r'\s+', ' ', (p.get('title') or p.get('titulo') or '')).strip().lower()[:80]
        if chave and chave not in vistos:
            vistos.add(chave)
            dedup.append(p)

    logger.info("DOU %s — %d portarias MS (após filtro e dedup, de %d brutas)", data_str, len(dedup), len(portarias))
    return dedup


def _classificar(p: dict) -> dict:
    """Classifica relevância da portaria para Apuí/AM."""
    titulo = (p.get("title") or p.get("titulo") or "").lower()
    corpo  = (p.get("content") or p.get("conteudo") or p.get("texto") or "").lower()
    numero = (p.get("identifica") or p.get("numero") or p.get("numberSection") or "").lower()
    texto  = f"{titulo} {corpo} {numero}"

    menciona_apui  = any(t in texto for t in TERMOS_APUI)
    menciona_am    = any(t in texto for t in TERMOS_AM)
    menciona_saude = any(t in texto for t in TERMOS_SAUDE)

    if menciona_apui:
        relevancia = "apui"
    elif menciona_am and menciona_saude:
        relevancia = "amazonas"
    elif menciona_saude:
        relevancia = "federal"
    else:
        relevancia = "outros"

    titulo_orig = (p.get("title") or p.get("titulo") or "Sem título")
    link_direto = (p.get("urlAddress") or p.get("link") or p.get("url") or "").strip()

    # Se não há link direto ou é genérico, usa busca pública no Google filtrada ao in.gov.br
    LINKS_GENERICOS = {"", "https://www.in.gov.br", "https://www.in.gov.br/leiturajornal",
                       "http://www.in.gov.br", "https://in.gov.br"}
    if link_direto in LINKS_GENERICOS:
        import urllib.parse
        termo = titulo_orig[:100]
        link_direto = (
            "https://www.google.com/search?"
            + urllib.parse.urlencode({
                "q": f'site:in.gov.br "Ministério da Saúde" {termo}',
            })
        )

    return {
        **p,
        "_relevancia": relevancia,
        "_titulo":   titulo_orig,
        "_numero":   (p.get("identifica") or p.get("numero") or ""),
        "_link":     link_direto,
        "_data":     (p.get("pubDate") or p.get("dataPublicacao") or ""),
        "_resumo":   corpo[:500] if corpo else "(sem texto disponível)",
    }


# ── Gerador de HTML do e-mail ─────────────────────────────────────────────────

def _gerar_html(data_ref: date, portarias_apui: list, portarias_am: list, portarias_fed: list) -> str:
    data_fmt = data_ref.strftime("%d/%m/%Y")
    sem_relevante = not portarias_apui and not portarias_am and not portarias_fed

    def bloco(titulo: str, cor: str, items: list) -> str:
        if not items:
            return ""
        linhas = ""
        for p in items:
            linhas += f"""
            <div style="border-left:4px solid {cor};padding:10px 14px;margin-bottom:12px;background:#fafafa;border-radius:0 6px 6px 0">
              <div style="font-weight:700;font-size:14px;color:#1e293b">{p['_titulo']}</div>
              {'<div style="font-size:11px;color:#6b7280;margin-top:2px">'+p['_numero']+'</div>' if p['_numero'] else ''}
              <div style="font-size:12px;color:#475569;margin:6px 0;line-height:1.6">{p['_resumo'][:300]}...</div>
              <a href="{p['_link']}" style="font-size:11px;color:#1d4ed8">🔗 Ver publicação oficial no DOU</a>
            </div>"""
        return f"""
        <div style="margin-bottom:24px">
          <div style="font-size:13px;font-weight:700;color:{cor};text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">{titulo} ({len(items)})</div>
          {linhas}
        </div>"""

    if sem_relevante:
        corpo = """
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0;font-size:13px;color:#15803d">
          Após consulta às publicações oficiais do Ministério da Saúde no Diário Oficial da União, não foram
          identificadas novas portarias com impacto direto em Apuí/AM, no Estado do Amazonas ou de aplicação
          federal relevante para o Município nesta data.
        </div>"""
    else:
        corpo = (
            bloco("📍 Portarias que citam diretamente Apuí/AM", "#ef4444", portarias_apui) +
            bloco("🗺️ Portarias para o Estado do Amazonas", "#f59e0b", portarias_am) +
            bloco("📋 Normas federais aplicáveis ao município", "#3b82f6", portarias_fed)
        )

    total = len(portarias_apui) + len(portarias_am) + len(portarias_fed)

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;background:#f8fafc;padding:20px">
  <div style="background:#1d4ed8;padding:20px 28px;border-radius:10px 10px 0 0">
    <div style="color:#fff;font-size:20px;font-weight:800">ERSUS 360 — Portarias do Ministério da Saúde</div>
    <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px">
      Apuí/AM · Secretaria Municipal de Saúde · {data_fmt}
    </div>
  </div>

  <div style="background:#fff;padding:24px 28px;border:1px solid #e5e7eb;border-top:none">
    <div style="display:flex;gap:20px;margin-bottom:24px;flex-wrap:wrap">
      <div style="flex:1;min-width:140px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#1d4ed8">{total}</div>
        <div style="font-size:11px;color:#64748b">portarias encontradas</div>
      </div>
      <div style="flex:1;min-width:140px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 16px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#dc2626">{len(portarias_apui)}</div>
        <div style="font-size:11px;color:#64748b">citam Apuí/AM</div>
      </div>
      <div style="flex:1;min-width:140px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#d97706">{len(portarias_am)}</div>
        <div style="font-size:11px;color:#64748b">para o Amazonas</div>
      </div>
      <div style="flex:1;min-width:140px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#16a34a">{len(portarias_fed)}</div>
        <div style="font-size:11px;color:#64748b">normas federais</div>
      </div>
    </div>

    {corpo}
  </div>

  <div style="background:#f1f5f9;padding:14px 28px;border-radius:0 0 10px 10px;font-size:11px;color:#64748b">
    <div>Gerado automaticamente pelo ERSUS 360 · Agente de Portarias MS</div>
    <div>Fonte: Diário Oficial da União — <a href="https://www.in.gov.br" style="color:#1d4ed8">www.in.gov.br</a></div>
    <div style="margin-top:4px">Horário de Manaus (America/Manaus) · {datetime.now().strftime('%d/%m/%Y %H:%M')}</div>
  </div>
</body>
</html>"""


# ── Envio de e-mail ───────────────────────────────────────────────────────────

def _enviar_smtp(assunto: str, html: str, destinatario: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"]    = EMAIL_FROM
    msg["To"]      = destinatario
    msg.attach(MIMEText(html, "html", "utf-8"))

    ctx = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as s:
        s.ehlo()
        s.starttls(context=ctx)
        s.login(SMTP_USER, SMTP_PASS)
        s.sendmail(EMAIL_FROM, [destinatario], msg.as_string())


async def _enviar_resend(assunto: str, html: str, destinatario: str) -> None:
    async with httpx.AsyncClient(timeout=20) as c:
        resp = await c.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json={"from": EMAIL_FROM, "to": [destinatario], "subject": assunto, "html": html},
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Resend API erro {resp.status_code}: {resp.text}")


# ── Função principal chamada pelo scheduler ──────────────────────────────────

async def executar_envio_diario(data_ref: date | None = None, forcar: bool = False) -> dict:
    """
    Busca portarias do DOU, gera e-mail e registra no banco.
    Retorna dict com status, qtd_portarias, erro (se houver).
    """
    from database import AsyncSessionLocal
    from models.email_diario import EmailDiarioLog, StatusEnvio
    from sqlalchemy import select

    if data_ref is None:
        data_ref = date.today()

    data_str = data_ref.isoformat()

    async with AsyncSessionLocal() as db:
        # Verifica se já enviou hoje (evita reenvio duplo)
        if not forcar:
            res = await db.execute(
                select(EmailDiarioLog).where(
                    EmailDiarioLog.data_referencia == data_str,
                    EmailDiarioLog.status == StatusEnvio.ENVIADO,
                )
            )
            if res.scalar_one_or_none():
                return {"ok": False, "motivo": "já enviado hoje", "data": data_str}

        # Verifica se está pausado
        res_cfg = await db.execute(
            select(EmailDiarioLog).where(EmailDiarioLog.pausado == True).limit(1)
        )
        cfg_pausado = res_cfg.scalar_one_or_none()
        if cfg_pausado and not forcar:
            return {"ok": False, "motivo": "envios pausados", "data": data_str}

        # Cria registro de log
        log = EmailDiarioLog(
            data_referencia=data_str,
            destinatario=EMAIL_RECIPIENT,
            assunto=f"ERSUS360 – Portarias do Ministério da Saúde – Apuí/AM – {data_ref.strftime('%d/%m/%Y')}",
            status=StatusEnvio.PENDENTE,
        )
        db.add(log)
        await db.commit()
        await db.refresh(log)
        log_id = log.id

    # Busca portarias (fora da sessão para não manter conexão aberta)
    portarias_raw: list[dict] = []
    try:
        portarias_raw = await _buscar_portarias_ms(data_ref)
    except Exception as exc:
        logger.error("Erro ao buscar DOU: %s", exc)

    classificadas = [_classificar(p) for p in portarias_raw]
    portarias_apui = [p for p in classificadas if p["_relevancia"] == "apui"]
    portarias_am   = [p for p in classificadas if p["_relevancia"] == "amazonas"]
    portarias_fed  = [p for p in classificadas if p["_relevancia"] == "federal"]

    total  = len(portarias_apui) + len(portarias_am) + len(portarias_fed)
    assunto = (
        f"ERSUS360 – Portarias MS – Apuí/AM – {data_ref.strftime('%d/%m/%Y')}"
        + (f" ({total} portarias)" if total else " — Sem novas portarias")
    )
    html_corpo = _gerar_html(data_ref, portarias_apui, portarias_am, portarias_fed)

    # Tentativas de envio (até 3)
    MAX_TENTATIVAS = 3
    erro_final: str | None = None

    for tentativa in range(1, MAX_TENTATIVAS + 1):
        try:
            if EMAIL_PROVIDER == "resend" and RESEND_API_KEY:
                await _enviar_resend(assunto, html_corpo, EMAIL_RECIPIENT)
            else:
                _enviar_smtp(assunto, html_corpo, EMAIL_RECIPIENT)

            # Sucesso
            async with AsyncSessionLocal() as db2:
                res2 = await db2.execute(select(EmailDiarioLog).where(EmailDiarioLog.id == log_id))
                log2 = res2.scalar_one_or_none()
                if log2:
                    log2.status       = StatusEnvio.ENVIADO
                    log2.tentativas   = tentativa
                    log2.assunto      = assunto
                    log2.corpo_html   = html_corpo
                    log2.qtd_portarias = total
                    log2.qtd_informes  = len(portarias_apui)
                    log2.portarias_ids = json.dumps([p.get("_numero", "") for p in portarias_apui + portarias_am + portarias_fed])
                    log2.enviado_em    = datetime.utcnow()
                    log2.erro          = None
                    await db2.commit()

            logger.info("E-mail diário portarias enviado — %s — %d portarias", data_str, total)
            return {"ok": True, "data": data_str, "qtd_portarias": total, "tentativas": tentativa}

        except Exception as exc:
            erro_final = str(exc)
            logger.warning("Tentativa %d falhou: %s", tentativa, exc)

    # Todas as tentativas falharam
    async with AsyncSessionLocal() as db3:
        res3 = await db3.execute(select(EmailDiarioLog).where(EmailDiarioLog.id == log_id))
        log3 = res3.scalar_one_or_none()
        if log3:
            log3.status     = StatusEnvio.FALHA
            log3.tentativas = MAX_TENTATIVAS
            log3.assunto    = assunto
            log3.corpo_html = html_corpo
            log3.erro       = erro_final
            await db3.commit()

    logger.error("Envio diário falhou após %d tentativas: %s", MAX_TENTATIVAS, erro_final)
    return {"ok": False, "data": data_str, "erro": erro_final, "tentativas": MAX_TENTATIVAS}
