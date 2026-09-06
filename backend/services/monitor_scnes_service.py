"""
Monitor SCNES/Sprint — Relatório Semanal ERSUS 360
Gera e envia e-mail toda segunda-feira às 07:00 (America/Manaus) via RESEND.

Env vars (Railway):
  RESEND_API_KEY   — obrigatório
  EMAIL_FROM       — default onboarding@resend.dev
  MONITOR_EMAIL    — destinatário (default eulerenzoramos@gmail.com)
"""
from __future__ import annotations
import logging
import os
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM     = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
MONITOR_EMAIL  = os.getenv("MONITOR_EMAIL", "eulerenzoramos@gmail.com")

# Dados base da varredura de 06/09/2026 — atualizar quando novas varreduras forem feitas
_EQUIPES = [
    {"nome": "ACARI",         "score": 95.0,  "nivel": "Ótimo",  "vinculadas": 1611},
    {"nome": "KENNEDY",       "score": 87.5,  "nivel": "Ótimo",  "vinculadas": 761},
    {"nome": "JK",            "score": 87.5,  "nivel": "Ótimo",  "vinculadas": 1497},
    {"nome": "LIBERDADE",     "score": 87.5,  "nivel": "Ótimo",  "vinculadas": 1784},
    {"nome": "SÃO SEBASTIÃO", "score": 87.5,  "nivel": "Ótimo",  "vinculadas": 1585},
    {"nome": "CACHOEIRA",     "score": 82.5,  "nivel": "Ótimo",  "vinculadas": 1552},
    {"nome": "JUMA",          "score": 82.5,  "nivel": "Ótimo",  "vinculadas": 1732},
    {"nome": "ESTRADA NOVA",  "score": 80.0,  "nivel": "Ótimo",  "vinculadas": 806},
    {"nome": "TRÊS ESTADOS",  "score": 80.0,  "nivel": "Ótimo",  "vinculadas": 1035},
    {"nome": "AREAL",         "score": 60.0,  "nivel": "Bom",    "vinculadas": 0},
]

_PENDENCIAS = [
    {"sev": "🚨 CRÍTICO",  "equipe": "ESTRADA NOVA", "desc": "RUDINEI SIMONETTI — CBO 322250 → corrigir para 322245 (Téc. Enf. ESF) · SCNES 9942122"},
    {"sev": "🚨 CRÍTICO",  "equipe": "AREAL",        "desc": "2 enfermeiros com vínculo irregular — ALAN ALEXANDER HISTER deve ser desativado · SCNES 2013290"},
    {"sev": "🚨 CRÍTICO",  "equipe": "JK",           "desc": "ESB JK ausente do SIAPS desde ativação (06/06/2023) — acionar suporte 0800 722 4310"},
    {"sev": "⚠️ MÉDIO",   "equipe": "JK",            "desc": "MARIA ANTONIA MIRANDA BARROS — CBO 322205 → 322245 · CNS 705408412586591"},
    {"sev": "⚠️ MÉDIO",   "equipe": "CACHOEIRA",     "desc": "ELILDA DIAS HISTER — CBO 322230 (genérico) desde 01/09/2009 · CNS 704104879343850"},
    {"sev": "⚠️ MÉDIO",   "equipe": "TRÊS ESTADOS",  "desc": "MARINETE RIBEIRO DE ARAÚJO SOARES — CBO 515110 (Atendente) não é perfil ESF · CNS 706409674985182"},
    {"sev": "⚠️ MÉDIO",   "equipe": "JK",            "desc": "Confirmar migração CNES 3324915 (inativo) → 4184688"},
    {"sev": "⚠️ MÉDIO",   "equipe": "CACHOEIRA",     "desc": "Confirmar modalidade eRibeirinha vs eSF no e-Gestor"},
    {"sev": "ℹ️ ATENÇÃO", "equipe": "KENNEDY",       "desc": "ESB nota 7,5 em Q1/26 — no limiar Ótimo. Monitorar produção odontológica"},
]


def _cor_nivel(nivel: str) -> str:
    return "#1a7340" if nivel == "Ótimo" else "#b45309" if nivel == "Bom" else "#991b1b"


def _cor_sev(sev: str) -> str:
    if "CRÍTICO" in sev:
        return "#fef2f2"
    if "MÉDIO" in sev:
        return "#fffbeb"
    return "#f0fdf4"


def gerar_html_relatorio(data_ref: str) -> str:
    otimo = sum(1 for e in _EQUIPES if e["nivel"] == "Ótimo")
    bom   = sum(1 for e in _EQUIPES if e["nivel"] == "Bom")
    critico = sum(1 for p in _PENDENCIAS if "CRÍTICO" in p["sev"])
    medio   = sum(1 for p in _PENDENCIAS if "MÉDIO"   in p["sev"])
    total_vinculadas = sum(e["vinculadas"] for e in _EQUIPES)

    linhas_equipes = ""
    for e in _EQUIPES:
        cor = _cor_nivel(e["nivel"])
        linhas_equipes += f"""
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">{e['nome']}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">
            <span style="background:{cor};color:#fff;padding:2px 10px;border-radius:12px;font-size:13px;">
              {e['score']} pts — {e['nivel']}
            </span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">{e['vinculadas']:,}</td>
        </tr>"""

    linhas_pend = ""
    for p in _PENDENCIAS:
        bg = _cor_sev(p["sev"])
        linhas_pend += f"""
        <tr style="background:{bg};">
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;white-space:nowrap;">{p['sev']}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">{p['equipe']}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">{p['desc']}</td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Monitor SCNES/Sprint — ERSUS 360</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr><td style="background:#1e3a5f;padding:28px 32px;">
          <p style="margin:0;color:#93c5fd;font-size:12px;letter-spacing:1px;text-transform:uppercase;">ERSUS 360 · FMS Apuí/AM</p>
          <h1 style="margin:6px 0 0;color:#fff;font-size:22px;">Monitor SCNES/Sprint — Relatório Semanal</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">{data_ref} · Sprint ÓTIMO Q2/2026 · Portaria GM/MS 3.493/2024</p>
        </td></tr>

        <!-- KPIs -->
        <tr><td style="padding:24px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="25%" style="text-align:center;background:#f0fdf4;border-radius:10px;padding:16px 8px;">
                <div style="font-size:28px;font-weight:700;color:#1a7340;">{otimo}</div>
                <div style="font-size:12px;color:#374151;margin-top:4px;">Equipes Ótimo</div>
              </td>
              <td width="4%"></td>
              <td width="25%" style="text-align:center;background:#fffbeb;border-radius:10px;padding:16px 8px;">
                <div style="font-size:28px;font-weight:700;color:#b45309;">{bom}</div>
                <div style="font-size:12px;color:#374151;margin-top:4px;">Equipes Bom</div>
              </td>
              <td width="4%"></td>
              <td width="25%" style="text-align:center;background:#fef2f2;border-radius:10px;padding:16px 8px;">
                <div style="font-size:28px;font-weight:700;color:#991b1b;">{critico}</div>
                <div style="font-size:12px;color:#374151;margin-top:4px;">Pendências Críticas</div>
              </td>
              <td width="4%"></td>
              <td width="25%" style="text-align:center;background:#f0f9ff;border-radius:10px;padding:16px 8px;">
                <div style="font-size:28px;font-weight:700;color:#0369a1;">{total_vinculadas:,}</div>
                <div style="font-size:12px;color:#374151;margin-top:4px;">Vinculadas CVAT</div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Scores por equipe -->
        <tr><td style="padding:24px 32px 8px;">
          <h2 style="margin:0 0 12px;font-size:16px;color:#1e3a5f;border-left:4px solid #1e3a5f;padding-left:10px;">
            Scores por Equipe — SIAPS Q1/2026
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">EQUIPE</th>
                <th style="padding:8px 12px;text-align:center;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">SCORE / NÍVEL</th>
                <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">VINCULADAS</th>
              </tr>
            </thead>
            <tbody>{linhas_equipes}</tbody>
          </table>
        </td></tr>

        <!-- Pendências -->
        <tr><td style="padding:24px 32px 8px;">
          <h2 style="margin:0 0 12px;font-size:16px;color:#1e3a5f;border-left:4px solid #dc2626;padding-left:10px;">
            Pendências Ativas SCNES ({len(_PENDENCIAS)} itens — {critico} críticos · {medio} médios)
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">SEVERIDADE</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">EQUIPE</th>
                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;border-bottom:2px solid #e5e7eb;">DESCRIÇÃO</th>
              </tr>
            </thead>
            <tbody>{linhas_pend}</tbody>
          </table>
        </td></tr>

        <!-- Ações da semana -->
        <tr><td style="padding:24px 32px 8px;">
          <h2 style="margin:0 0 12px;font-size:16px;color:#1e3a5f;border-left:4px solid #f59e0b;padding-left:10px;">
            Ações Prioritárias da Semana
          </h2>
          <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
            <li>Corrigir CBO 322250→322245 de RUDINEI SIMONETTI no SCNES (ESTRADA NOVA)</li>
            <li>Desativar ALAN ALEXANDER HISTER no SCNES · SCNES 2013290 (AREAL)</li>
            <li>Ligar 0800 722 4310 — regularizar ESB JK no SIAPS (JK)</li>
            <li>Corrigir CBO 322205→322245 de MARIA ANTONIA no SCNES (JK)</li>
            <li>Verificar produção odontológica ESB KENNEDY para manter nota ≥ 7,5</li>
          </ol>
        </td></tr>

        <!-- Indicadores com maior gap -->
        <tr><td style="padding:24px 32px 8px;">
          <h2 style="margin:0 0 12px;font-size:16px;color:#1e3a5f;border-left:4px solid #8b5cf6;padding-left:10px;">
            Indicadores com Maior Gap — Q2/2026
          </h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr style="background:#faf5ff;">
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">Pré-natal adequado</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">29% → meta 60%</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626;font-weight:700;">GAP 31pp</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">Saúde Bucal B1/B2</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">35% → meta 60%</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#dc2626;font-weight:700;">GAP 25pp</td>
            </tr>
            <tr style="background:#faf5ff;">
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">Puericultura</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">48% → meta 70%</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#b45309;font-weight:700;">GAP 22pp</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">HAS Controlada</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">66% → meta 75%</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#b45309;font-weight:700;">GAP 9pp</td>
            </tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
            ERSUS 360 · FMS Apuí/AM · Gerado automaticamente toda segunda-feira às 07:00<br>
            Para pausar: defina <code>MONITOR_SCNES_ENABLED=false</code> no Railway
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


async def enviar_relatorio_semanal() -> dict:
    """Gera e envia o relatório semanal SCNES/Sprint via RESEND."""
    if not RESEND_API_KEY:
        logger.warning("[MonitorSCNES] RESEND_API_KEY não configurado — relatório não enviado")
        return {"ok": False, "erro": "RESEND_API_KEY não configurado"}

    enabled = os.getenv("MONITOR_SCNES_ENABLED", "true").lower()
    if enabled == "false":
        logger.info("[MonitorSCNES] Monitoramento desabilitado (MONITOR_SCNES_ENABLED=false)")
        return {"ok": False, "motivo": "desabilitado"}

    agora = datetime.now().strftime("%d/%m/%Y %H:%M")
    assunto = f"[ERSUS 360] Monitor SCNES/Sprint — {agora} — {sum(1 for p in _PENDENCIAS if 'CRÍTICO' in p['sev'])} pendências críticas"
    html = gerar_html_relatorio(agora)

    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": EMAIL_FROM,
                    "to": [MONITOR_EMAIL],
                    "subject": assunto,
                    "html": html,
                },
            )
        if r.status_code in (200, 201):
            logger.info("[MonitorSCNES] Relatório enviado para %s", MONITOR_EMAIL)
            return {"ok": True, "destinatario": MONITOR_EMAIL, "assunto": assunto}
        logger.error("[MonitorSCNES] Resend HTTP %s: %s", r.status_code, r.text[:200])
        return {"ok": False, "erro": f"Resend HTTP {r.status_code}: {r.text[:200]}"}
    except Exception as exc:
        logger.error("[MonitorSCNES] Erro ao enviar: %s", exc, exc_info=True)
        return {"ok": False, "erro": str(exc)}
