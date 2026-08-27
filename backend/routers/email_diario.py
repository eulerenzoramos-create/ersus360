"""
Router: /api/email-diario — Painel de controle do agente de portarias MS
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.email_diario import EmailDiarioLog, StatusEnvio
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/email-diario", tags=["EmailDiario"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class LogOut(BaseModel):
    id: int
    data_referencia: str
    destinatario: str
    assunto: str
    status: str
    tentativas: int
    erro: Optional[str]
    qtd_portarias: int
    qtd_informes: int
    criado_em: datetime
    enviado_em: Optional[datetime]
    pausado: bool

    class Config:
        from_attributes = True


class StatusPainelOut(BaseModel):
    proximo_envio: str
    ultimo_envio: Optional[str]
    destinatario: str
    status_atual: str
    pausado: bool
    qtd_portarias_ultimo: int
    qtd_informes_ultimo: int
    erro_ultimo: Optional[str]
    tentativas_ultimo: int
    historico: list[LogOut]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/status", response_model=StatusPainelOut)
async def status_painel(
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    import os, zoneinfo
    tz = zoneinfo.ZoneInfo(os.getenv("EMAIL_TIMEZONE", "America/Manaus"))
    hora_env = os.getenv("EMAIL_SEND_HOUR", "06:00")
    hora, minuto = map(int, hora_env.split(":"))

    # próximo envio
    agora = datetime.now(tz)
    prox = agora.replace(hour=hora, minute=minuto, second=0, microsecond=0)
    if prox <= agora:
        from datetime import timedelta
        prox = prox + timedelta(days=1)
    proximo_str = prox.strftime("%d/%m/%Y %H:%M") + f" ({os.getenv('EMAIL_TIMEZONE','America/Manaus')})"

    # histórico
    res = await db.execute(
        select(EmailDiarioLog).order_by(desc(EmailDiarioLog.criado_em)).limit(30)
    )
    historico = res.scalars().all()
    ultimo = historico[0] if historico else None

    # verifica pausa global
    res_p = await db.execute(
        select(EmailDiarioLog).where(EmailDiarioLog.pausado == True).limit(1)
    )
    pausado = res_p.scalar_one_or_none() is not None

    return StatusPainelOut(
        proximo_envio=proximo_str,
        ultimo_envio=ultimo.enviado_em.strftime("%d/%m/%Y %H:%M") if ultimo and ultimo.enviado_em else None,
        destinatario=os.getenv("EMAIL_RECIPIENT", "eulerenzoramos@gmail.com"),
        status_atual=ultimo.status if ultimo else "nenhum",
        pausado=pausado,
        qtd_portarias_ultimo=ultimo.qtd_portarias if ultimo else 0,
        qtd_informes_ultimo=ultimo.qtd_informes if ultimo else 0,
        erro_ultimo=ultimo.erro if ultimo else None,
        tentativas_ultimo=ultimo.tentativas if ultimo else 0,
        historico=list(historico),
    )


@router.post("/enviar-agora")
async def enviar_agora(
    data: Optional[str] = Query(None, description="YYYY-MM-DD — padrão: hoje"),
    _: UserOut = Depends(get_current_user),
):
    """Dispara o envio imediatamente (botão 'Enviar agora' ou 'Reenviar')."""
    from services.portarias_dou_service import executar_envio_diario
    data_ref = date.fromisoformat(data) if data else date.today()
    resultado = await executar_envio_diario(data_ref=data_ref, forcar=True)
    return resultado


@router.get("/visualizar/{log_id}")
async def visualizar_email(
    log_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Retorna o HTML do e-mail gerado para visualização."""
    from fastapi.responses import HTMLResponse
    res = await db.execute(select(EmailDiarioLog).where(EmailDiarioLog.id == log_id))
    log = res.scalar_one_or_none()
    if not log:
        from fastapi import HTTPException
        raise HTTPException(404, "Log não encontrado")
    html = log.corpo_html or "<p>Nenhum conteúdo gerado.</p>"
    return HTMLResponse(content=html)


@router.post("/pausar")
async def pausar_envios(
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Pausa todos os envios automáticos futuros."""
    # cria registro sentinela de pausa
    sentinela = EmailDiarioLog(
        data_referencia="pausa",
        destinatario="",
        assunto="PAUSA",
        status=StatusEnvio.PAUSADO,
        pausado=True,
    )
    db.add(sentinela)
    await db.commit()
    return {"ok": True, "pausado": True}


@router.post("/retomar")
async def retomar_envios(
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Retoma os envios automáticos."""
    res = await db.execute(
        select(EmailDiarioLog).where(EmailDiarioLog.pausado == True)
    )
    for log in res.scalars().all():
        log.pausado = False
    await db.commit()
    return {"ok": True, "pausado": False}


@router.get("/buscar-dou")
async def buscar_dou_retroativo(
    data: str = Query(..., description="YYYY-MM-DD"),
    enviar: bool = Query(False, description="Se True, envia o e-mail após buscar"),
    _: UserOut = Depends(get_current_user),
):
    """Busca portarias do MS no DOU (sem e-mail por padrão). Valida órgão via allowlist."""
    from services.portarias_dou_service import (
        _buscar_portarias_ms, _classificar, _analisar_impacto
    )
    from datetime import date as _date
    try:
        data_ref = _date.fromisoformat(data)
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(400, "Data inválida. Use YYYY-MM-DD.")

    brutos, log_exec = await _buscar_portarias_ms(data_ref)
    portarias = [_classificar(p, data_ref) for p in brutos]

    def _gerar_informe(p: dict) -> dict:
        titulo    = p.get("_titulo",  "Sem título")
        numero    = p.get("_numero",  "")
        link      = p.get("_link",    "https://www.in.gov.br/leiturajornal")
        data_pub  = p.get("_data",    data)
        resumo    = p.get("_resumo",  "")[:600]
        orgao     = p.get("_orgao",   p.get("orgaoName", "Ministério da Saúde"))
        relevancia = p.get("_relevancia", "federal")
        impacto   = _analisar_impacto(titulo, resumo)

        # Impacto resumido para o card
        itens: list[str] = (
            impacto["providencias"] +
            impacto["financeiro"] +
            impacto["assistencial"] +
            impacto["administrativo"]
        )
        impacto_texto = (
            " ".join(itens[:3])
            if itens else
            "Não foi identificado impacto direto para Apuí/AM após análise do texto."
        )

        return {
            "titulo":     titulo,
            "numero":     numero,
            "data_pub":   data_pub,
            "orgao":      orgao,
            "relevancia": relevancia,
            "resumo":     resumo or "(Acesse o link para ver o conteúdo completo)",
            "impacto":    impacto_texto,
            "link":       link,
        }

    relevantes = [p for p in portarias if p["_relevancia"] in ("apui", "amazonas", "federal")]
    informes   = [_gerar_informe(p) for p in relevantes]

    resultado = {
        "data":       data,
        "total":      len(portarias),
        "apui":       [_gerar_informe(p) for p in portarias if p["_relevancia"] == "apui"],
        "amazonas":   [_gerar_informe(p) for p in portarias if p["_relevancia"] == "amazonas"],
        "federal":    [_gerar_informe(p) for p in portarias if p["_relevancia"] == "federal"],
        "sem_impacto":[_gerar_informe(p) for p in portarias if p["_relevancia"] == "sem_impacto"],
        "informes":   informes,
        "enviado":    False,
        "log":        log_exec,     # transparência: fontes, descartes, falhas
    }

    if enviar:
        from services.portarias_dou_service import executar_envio_diario
        env = await executar_envio_diario(data_ref=data_ref, forcar=True)
        resultado["enviado"]        = env.get("ok", False)
        resultado["envio_detalhe"]  = env

    return resultado


@router.post("/informe-html")
async def gerar_informe_html(
    payload: dict,
    _: UserOut = Depends(get_current_user),
):
    """Recebe lista de informes e devolve HTML imprimível do documento oficial."""
    from fastapi.responses import HTMLResponse
    informes = payload.get("informes", [])
    data_ref = payload.get("data", "")
    municipio = "Apuí/AM — IBGE 1300144"

    COR = {"apui": "#059669", "amazonas": "#7c3aed", "federal": "#0284c7", "outros": "#6b7280"}
    LABEL = {"apui": "📍 Apuí/AM", "amazonas": "🏛 Estado AM", "federal": "🇧🇷 Federal MS", "outros": "📄 Outros"}

    itens_html = ""
    for i, inf in enumerate(informes, 1):
        cor = COR.get(inf.get("relevancia", "federal"), "#0284c7")
        lbl = LABEL.get(inf.get("relevancia", "federal"), "Federal MS")
        resumo = inf.get("resumo", "(sem texto disponível)")
        impacto = inf.get("impacto", "")
        link = inf.get("link", "#")
        numero = inf.get("numero", "")
        data_pub = inf.get("data_pub", "")
        orgao = inf.get("orgao", "Ministério da Saúde")
        itens_html += f"""
        <div class="informe" style="border-left:4px solid {cor}; margin-bottom:24px; padding:0 0 16px 16px; page-break-inside:avoid;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <span style="font-size:10px;font-weight:700;color:{cor};background:{cor}18;border:1px solid {cor}40;padding:2px 10px;border-radius:20px;">{lbl}</span>
            <span style="font-size:11px;color:#64748b;">#{i}</span>
          </div>
          <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:6px;">{inf.get('titulo','')}</div>
          <table style="font-size:11px;color:#64748b;border-collapse:collapse;margin-bottom:10px;">
            {"<tr><td style='padding-right:16px;font-weight:600;'>Número</td><td>" + numero + "</td></tr>" if numero else ""}
            {"<tr><td style='padding-right:16px;font-weight:600;'>Publicação</td><td>" + data_pub + "</td></tr>" if data_pub else ""}
            <tr><td style='padding-right:16px;font-weight:600;'>Órgão</td><td>{orgao}</td></tr>
          </table>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;margin-bottom:4px;">Resumo</div>
          <div style="font-size:12px;color:#374151;line-height:1.7;background:#f8fafc;padding:10px;border-radius:6px;margin-bottom:10px;">{resumo}</div>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px;margin-bottom:10px;">
            <div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;margin-bottom:4px;">⚡ Impacto para Apuí/AM</div>
            <div style="font-size:12px;color:#78350f;">{impacto}</div>
          </div>
          <div style="font-size:11px;color:#1d4ed8;">🔗 <a href="{link}" style="color:#1d4ed8;">{link}</a></div>
        </div>"""

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Informe de Portarias MS — {data_ref}</title>
<style>
  body {{ font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }}
  @media print {{ body {{ margin: 20px; }} .no-print {{ display:none; }} }}
  h1 {{ font-size: 18px; color: #1d4ed8; margin-bottom: 4px; }}
  .meta {{ font-size: 12px; color: #64748b; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }}
  .informe {{ border-left: 4px solid #0284c7; }}
</style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;">
    <button onclick="window.print()" style="padding:8px 20px;background:#1d4ed8;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;">🖨 Imprimir / Salvar PDF</button>
  </div>
  <h1>📋 Informe de Portarias — Ministério da Saúde</h1>
  <div class="meta">
    <strong>Município:</strong> {municipio} &nbsp;|&nbsp;
    <strong>Data DOU:</strong> {data_ref} &nbsp;|&nbsp;
    <strong>Total de informes:</strong> {len(informes)} &nbsp;|&nbsp;
    <strong>Gerado pelo ERSUS 360</strong>
  </div>
  {itens_html if itens_html else "<p style='color:#94a3b8;'>Nenhum informe disponível.</p>"}
</body>
</html>"""
    return HTMLResponse(content=html)


@router.get("/historico", response_model=list[LogOut])
async def historico(
    limit: int = Query(30, le=90),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    res = await db.execute(
        select(EmailDiarioLog)
        .where(EmailDiarioLog.data_referencia != "pausa")
        .order_by(desc(EmailDiarioLog.criado_em))
        .limit(limit)
    )
    return res.scalars().all()
