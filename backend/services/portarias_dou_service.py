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

# DOU: endpoint de busca confirmado via inspeção do site in.gov.br
DOU_BUSCA    = "https://www.in.gov.br/consulta/-/buscar-conteudo"
# Parâmetros: q=portaria, exactDate=DD-MM-YYYY, orgaoPesquisa=..., tipoDe=Portaria
DOU_ORGAO    = "Ministério da Saúde"


# ── Consulta DOU ─────────────────────────────────────────────────────────────

async def _buscar_portarias_ms(data_ref: date) -> list[dict[str, Any]]:
    """
    Busca portarias do MS no DOU para a data informada.
    Usa o endpoint de busca do in.gov.br — o mesmo usado pelo filtro
    Ministério da Saúde > Portaria visível na tela do sistema.
    """
    data_str = data_ref.strftime("%d-%m-%Y")   # formato DOU: DD-MM-YYYY
    portarias: list[dict] = []
    hdrs = {
        "User-Agent": "ERSUS360/1.0 (gestor@apui.am.gov.br)",
        "Accept": "application/json, text/javascript, */*",
    }

    # Estratégia 1: endpoint de busca principal do DOU
    params = {
        "q": "portaria",
        "exactDate": data_str,
        "orgaoPesquisa": DOU_ORGAO,
        "tipoDe": "Portaria",
        "numberPerPage": "100",
    }
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as c:
            r = await c.get(DOU_BUSCA, params=params, headers=hdrs)
        if r.status_code == 200:
            try:
                d = r.json()
                if isinstance(d, list):
                    portarias = d
                elif isinstance(d, dict):
                    portarias = d.get("items") or d.get("results") or d.get("content") or []
            except Exception:
                # HTML retornado — extrai links via regex simples
                texto = r.text
                matches = re.findall(
                    r'href="(https://www\.in\.gov\.br/web/dou/-/portaria[^"]+)"[^>]*>([^<]+)<',
                    texto, re.I
                )
                portarias = [{"urlAddress": m[0], "title": m[1].strip()} for m in matches]
    except Exception as exc:
        logger.warning("DOU busca erro: %s", exc)

    # Estratégia 2: endpoint legado de pesquisa por data
    if not portarias:
        url_legacy = (
            "https://www.in.gov.br/servicos/pesquisa-de-materia"
            f"?tipoPesquisa=TIPO_DATA&data={data_str}&orgao=MINISTERIO+DA+SAUDE&tipoDeAto=Portaria"
        )
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as c:
                r2 = await c.get(url_legacy, headers=hdrs)
            if r2.status_code == 200:
                try:
                    d2 = r2.json()
                    portarias = d2 if isinstance(d2, list) else d2.get("items", [])
                except Exception:
                    pass
        except Exception as exc2:
            logger.warning("DOU legado erro: %s", exc2)

    logger.info("DOU %s — %d portarias MS encontradas", data_str, len(portarias))
    return portarias


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

    return {
        **p,
        "_relevancia": relevancia,
        "_titulo":   (p.get("title") or p.get("titulo") or "Sem título"),
        "_numero":   (p.get("identifica") or p.get("numero") or ""),
        "_link":     (p.get("urlAddress") or p.get("link") or p.get("url") or "https://www.in.gov.br"),
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
