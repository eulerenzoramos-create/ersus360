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
    """Busca portarias no DOU para uma data específica (sem enviar e-mail por padrão)."""
    from services.portarias_dou_service import _buscar_portarias_ms, _classificar
    from datetime import date as _date
    try:
        data_ref = _date.fromisoformat(data)
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(400, "Data inválida. Use YYYY-MM-DD.")

    brutos = await _buscar_portarias_ms(data_ref)
    portarias = [_classificar(p) for p in brutos]

    def _gerar_informe(p: dict) -> dict:
        """Gera informe estruturado de uma portaria para o município de Apuí/AM."""
        titulo   = p.get("_titulo", p.get("title", "Sem título"))
        numero   = p.get("_numero", p.get("identifica", ""))
        link     = p.get("_link", p.get("urlAddress", "https://www.in.gov.br"))
        data_pub = p.get("_data", p.get("pubDate", data))
        resumo   = p.get("_resumo", p.get("content", p.get("conteudo", "")))[:600]
        orgao    = p.get("orgaoName", p.get("orgao", "Ministério da Saúde"))
        relevancia = p.get("_relevancia", "federal")

        # Impacto para Apuí baseado em palavras-chave do conteúdo
        texto = (titulo + " " + resumo).lower()
        impactos = []
        if any(t in texto for t in ["financiamento", "repasse", "transferência", "recurso", "fundo"]):
            impactos.append("Pode afetar repasses financeiros ao município.")
        if any(t in texto for t in ["atenção básica", "atenção primária", "aps", "esf", "acs"]):
            impactos.append("Impacta a Atenção Primária à Saúde de Apuí.")
        if any(t in texto for t in ["meta", "indicador", "avaliação", "desempenho"]):
            impactos.append("Exige acompanhamento de metas e indicadores.")
        if any(t in texto for t in ["prazo", "habilitação", "credenciamento", "adesão"]):
            impactos.append("Verificar prazo de habilitação ou adesão.")
        if any(t in texto for t in ["apuí", "apui", "1300144"]):
            impactos.append("Portaria com referência direta ao município de Apuí/AM.")
        if not impactos:
            impactos.append("Monitorar aplicabilidade para o município conforme conteúdo completo.")

        return {
            "titulo":     titulo,
            "numero":     numero,
            "data_pub":   data_pub,
            "orgao":      orgao,
            "relevancia": relevancia,
            "resumo":     resumo or "(Acesse o link para ver o conteúdo completo)",
            "impacto":    " ".join(impactos),
            "link":       link,
        }

    relevantes = [p for p in portarias if p["_relevancia"] in ("apui", "federal")]
    informes   = [_gerar_informe(p) for p in relevantes]

    resultado = {
        "data":     data,
        "total":    len(portarias),
        "apui":     [_gerar_informe(p) for p in portarias if p["_relevancia"] == "apui"],
        "amazonas": [_gerar_informe(p) for p in portarias if p["_relevancia"] == "amazonas"],
        "federal":  [_gerar_informe(p) for p in portarias if p["_relevancia"] == "federal"],
        "outros":   [_gerar_informe(p) for p in portarias if p["_relevancia"] == "outros"],
        "informes": informes,   # apui + federal com informe estruturado
        "enviado":  False,
    }

    if enviar:
        from services.portarias_dou_service import executar_envio_diario
        env = await executar_envio_diario(data_ref=data_ref, forcar=True)
        resultado["enviado"] = env.get("ok", False)
        resultado["envio_detalhe"] = env

    return resultado


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
