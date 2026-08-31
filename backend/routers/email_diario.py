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
    current_user: UserOut = Depends(get_current_user),
):
    """Dispara o envio imediatamente (botão 'Enviar agora' ou 'Reenviar')."""
    from services.portarias_dou_service import executar_envio_diario
    data_ref = date.fromisoformat(data) if data else date.today()
    resultado = await executar_envio_diario(
        data_ref=data_ref, forcar=True,
        modo="manual", usuario=getattr(current_user, "email", None),
    )
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
            "titulo":      titulo,
            "numero":      numero,
            "data_pub":    data_pub,
            "orgao":       orgao,
            "relevancia":  relevancia,
            "prioridade":  p.get("_prioridade", "normativo"),
            "resumo":      resumo or "(Acesse o link para ver o conteúdo completo)",
            "impacto":     impacto_texto,
            "link":        link,
            "valores":     p.get("_valores", []),
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
        # executar_envio_diario já persiste — não duplicar
        from services.portarias_dou_service import executar_envio_diario
        env = await executar_envio_diario(data_ref=data_ref, forcar=True, modo="manual")
        resultado["enviado"]        = env.get("ok", False)
        resultado["envio_detalhe"]  = env
    else:
        # Busca sem envio — persiste como retroativo
        from services.portarias_dou_service import _salvar_portarias_db
        try:
            await _salvar_portarias_db(
                portarias, data_ref, log_exec,
                resultado_email={"ok": False},
                modo="manual_retroativo",
                usuario=None,
            )
        except Exception as exc:
            resultado["aviso_db"] = f"Dados não persistidos: {exc}"

    return resultado


@router.get("/testes-validacao")
async def testes_validacao(
    _: UserOut = Depends(get_current_user),
):
    """Executa suite de testes de validação de órgão e retorna resultado."""
    from services.portarias_dou_service import _testes_validacao_orgao
    return _testes_validacao_orgao()


@router.post("/informe-html")
async def gerar_informe_html(
    payload: dict,
    _: UserOut = Depends(get_current_user),
):
    """
    Recebe lista de informes e devolve HTML imprimível com Informe Técnico
    completo (8 seções) para cada portaria selecionada.
    """
    from fastapi.responses import HTMLResponse
    from services.portarias_dou_service import gerar_informe_tecnico
    from datetime import date as _date

    informes  = payload.get("informes", [])
    data_ref  = payload.get("data", "")
    ano       = int(data_ref[:4]) if data_ref and len(data_ref) >= 4 else _date.today().year

    # Converte dict do informe para formato esperado por gerar_informe_tecnico
    def _normalizar(inf: dict, seq: int) -> dict:
        return {
            "_titulo":    inf.get("titulo",   "Sem título"),
            "_numero":    inf.get("numero",   ""),
            "_data":      inf.get("data_pub", ""),
            "_orgao":     inf.get("orgao",    "Ministério da Saúde"),
            "_link":      inf.get("link",     "https://www.in.gov.br/leiturajornal"),
            "_resumo":    inf.get("resumo",   ""),
            "_relevancia":inf.get("relevancia","federal"),
        }

    informes_html = "".join(
        gerar_informe_tecnico(_normalizar(inf, i+1), i+1, ano)
        for i, inf in enumerate(informes)
    )

    # Data formatada BR
    data_br = ""
    if data_ref:
        try:
            d = _date.fromisoformat(data_ref)
            data_br = d.strftime("%d/%m/%Y")
        except Exception:
            data_br = data_ref

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Informes Técnicos — Portarias MS — {data_br}</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 40px; color: #1e293b; background: #f8fafc; }}
    @media print {{
      body {{ margin: 20px; background: #fff; }}
      .no-print {{ display: none !important; }}
    }}
  </style>
</head>
<body>
  <!-- Barra de ação -->
  <div class="no-print" style="position:sticky;top:0;z-index:100;background:#fff;
       border-bottom:1px solid #e2e8f0;padding:10px 20px;margin:-40px -40px 32px;
       display:flex;gap:12px;align-items:center">
    <button onclick="window.print()"
      style="padding:8px 20px;background:#1d4ed8;color:#fff;border:none;
             border-radius:6px;cursor:pointer;font-size:13px;font-weight:700">
      🖨 Imprimir / Salvar PDF
    </button>
    <div style="font-size:12px;color:#64748b">
      <strong>ERSUS 360</strong> · Informes Técnicos · Portarias MS · {data_br}
      · {len(informes)} informe(s)
    </div>
  </div>

  <!-- Cabeçalho institucional -->
  <div style="border:2px solid #1d4ed8;border-radius:10px;padding:20px 28px;
              margin-bottom:32px;background:#fff">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                letter-spacing:1px;color:#1d4ed8;margin-bottom:4px">
      ERSUS 360 — Sistema de Monitoramento em Saúde Pública
    </div>
    <div style="font-size:18px;font-weight:800;color:#1e293b;margin-bottom:8px">
      Informes Técnicos — Portarias do Ministério da Saúde
    </div>
    <table style="font-size:12px;color:#374151;border-collapse:collapse">
      <tr><td style="padding-right:20px;font-weight:600">Município</td>
          <td>Apuí/AM — IBGE 1300144</td></tr>
      <tr><td style="padding-right:20px;font-weight:600">Secretária de Saúde</td>
          <td>Rosângela Motter</td></tr>
      <tr><td style="padding-right:20px;font-weight:600">Assessor Técnico</td>
          <td>Euler Ramos de Oliveira</td></tr>
      <tr><td style="padding-right:20px;font-weight:600">Data DOU consultada</td>
          <td>{data_br}</td></tr>
      <tr><td style="padding-right:20px;font-weight:600">Total de informes</td>
          <td>{len(informes)}</td></tr>
      <tr><td style="padding-right:20px;font-weight:600">Fonte</td>
          <td>Diário Oficial da União — www.in.gov.br</td></tr>
    </table>
  </div>

  {informes_html if informes_html else
    "<p style='color:#94a3b8;text-align:center;padding:40px'>Nenhum informe disponível.</p>"}

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


# ── Portarias DB ──────────────────────────────────────────────────────────────

@router.get("/portarias")
async def listar_portarias(
    data: Optional[str] = Query(None, description="YYYY-MM-DD — filtra por dia exato"),
    data_inicio: Optional[str] = Query(None, description="YYYY-MM-DD — início do intervalo (para busca por mês)"),
    data_fim: Optional[str] = Query(None, description="YYYY-MM-DD — fim do intervalo (para busca por mês)"),
    relevancia: Optional[str] = Query(None, description="apui|amazonas|federal|sem_impacto"),
    prioridade: Optional[str] = Query(None, description="urgente|prazo|financeiro|normativo|sem_impacto"),
    status: Optional[str] = Query(None, description="processado|revisao_manual|descartado"),
    limit: int = Query(200, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Lista portarias persistidas no banco com filtros opcionais."""
    from models.portaria_dou import PortariaDOU
    from sqlalchemy import and_

    conditions = []
    if data:
        conditions.append(PortariaDOU.data_publicacao == data)
    elif data_inicio and data_fim:
        conditions.append(PortariaDOU.data_publicacao >= data_inicio)
        conditions.append(PortariaDOU.data_publicacao <= data_fim)
    elif data_inicio:
        conditions.append(PortariaDOU.data_publicacao >= data_inicio)
    if relevancia:
        # "apui" → mostra apui + federal + amazonas (todas afetam o município)
        if relevancia == "apui":
            conditions.append(
                PortariaDOU.relevancia.in_(["apui", "federal", "amazonas"])
            )
        # "federal" → mostra federal + apui
        elif relevancia == "federal":
            conditions.append(
                PortariaDOU.relevancia.in_(["federal", "apui"])
            )
        else:
            conditions.append(PortariaDOU.relevancia == relevancia)
    if prioridade:
        conditions.append(PortariaDOU.prioridade == prioridade)
    if status:
        conditions.append(PortariaDOU.status == status)

    q = select(PortariaDOU)
    if conditions:
        q = q.where(and_(*conditions))
    q = q.order_by(desc(PortariaDOU.capturado_em)).limit(limit).offset(offset)

    res = await db.execute(q)
    rows = res.scalars().all()

    def _row(p: PortariaDOU) -> dict:
        import json as _json
        return {
            "id": p.id,
            "titulo": p.titulo,
            "numero": p.numero,
            "tipo_ato": p.tipo_ato,
            "data_publicacao": p.data_publicacao,
            "orgao": p.orgao,
            "resumo": p.resumo,
            "url_oficial": p.url_oficial,
            "relevancia": p.relevancia,
            "prioridade": p.prioridade,
            "valores_identificados": _json.loads(p.valores_identificados or "[]"),
            "status": p.status,
            "chave_dedup": p.chave_dedup,
            "capturado_em": p.capturado_em.isoformat() if p.capturado_em else None,
        }

    return {"total": len(rows), "portarias": [_row(p) for p in rows]}


@router.get("/portarias/{portaria_id}")
async def detalhe_portaria(
    portaria_id: int,
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Retorna uma portaria completa pelo ID."""
    from models.portaria_dou import PortariaDOU
    import json as _json
    from fastapi import HTTPException

    res = await db.execute(select(PortariaDOU).where(PortariaDOU.id == portaria_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Portaria não encontrada")

    return {
        "id": p.id,
        "titulo": p.titulo,
        "numero": p.numero,
        "tipo_ato": p.tipo_ato,
        "data_assinatura": p.data_assinatura,
        "data_publicacao": p.data_publicacao,
        "edicao_dou": p.edicao_dou,
        "secao_dou": p.secao_dou,
        "pagina_dou": p.pagina_dou,
        "orgao": p.orgao,
        "unidade_responsavel": p.unidade_responsavel,
        "ementa": p.ementa,
        "corpo_completo": p.corpo_completo,
        "resumo": p.resumo,
        "url_oficial": p.url_oficial,
        "id_dou": p.id_dou,
        "relevancia": p.relevancia,
        "prioridade": p.prioridade,
        "valores_identificados": _json.loads(p.valores_identificados or "[]"),
        "impacto_financeiro": _json.loads(p.impacto_financeiro or "[]"),
        "impacto_assistencial": _json.loads(p.impacto_assistencial or "[]"),
        "impacto_administrativo": _json.loads(p.impacto_administrativo or "[]"),
        "providencias": _json.loads(p.providencias or "[]"),
        "chave_dedup": p.chave_dedup,
        "status": p.status,
        "motivo_descarte": p.motivo_descarte,
        "portaria_original_id": p.portaria_original_id,
        "capturado_em": p.capturado_em.isoformat() if p.capturado_em else None,
        "processado_em": p.processado_em.isoformat() if p.processado_em else None,
    }


@router.post("/informe-ia")
async def gerar_informe_ia(
    payload: dict,
    _: UserOut = Depends(get_current_user),
):
    """
    Gera Informe Técnico formal via IA (Claude API) a partir dos dados
    de uma portaria. Retorna HTML imprimível pronto para window.open().

    Payload: { "portaria": { _titulo, _numero, _resumo, _link, ... } }
    """
    from fastapi.responses import HTMLResponse
    from fastapi import HTTPException
    from services.informe_ia_service import gerar_informe_ia, formatar_informe_html
    from datetime import date as _date

    portaria = payload.get("portaria")
    if not portaria:
        raise HTTPException(400, "Campo 'portaria' ausente no payload.")

    try:
        texto = await gerar_informe_ia(portaria)
    except RuntimeError as exc:
        raise HTTPException(503, str(exc))

    html = formatar_informe_html(texto, portaria, _date.today())
    return HTMLResponse(content=html)


@router.patch("/portarias/{portaria_id}/status")
async def atualizar_status_portaria(
    portaria_id: int,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: UserOut = Depends(get_current_user),
):
    """
    Atualiza o status de uma portaria (processado | revisao_manual | descartado | retificado).
    Usado pelo painel de revisão manual.
    Payload: { "status": "...", "motivo": "..." (opcional) }
    """
    from models.portaria_dou import PortariaDOU
    from fastapi import HTTPException

    STATUS_VALIDOS = {"processado", "revisao_manual", "descartado", "retificado"}
    novo_status = payload.get("status", "")
    if novo_status not in STATUS_VALIDOS:
        raise HTTPException(400, f"Status inválido. Use: {', '.join(STATUS_VALIDOS)}")

    res = await db.execute(select(PortariaDOU).where(PortariaDOU.id == portaria_id))
    p = res.scalar_one_or_none()
    if not p:
        raise HTTPException(404, "Portaria não encontrada")

    p.status = novo_status
    if payload.get("motivo"):
        p.motivo_descarte = payload["motivo"]
    await db.commit()
    return {"ok": True, "id": portaria_id, "status": novo_status}


@router.get("/execucoes")
async def listar_execucoes(
    limit: int = Query(30, le=90),
    db: AsyncSession = Depends(get_db),
    _: UserOut = Depends(get_current_user),
):
    """Lista histórico de execuções do agente de portarias."""
    from models.portaria_dou import ExecucaoPortarias
    import json as _json

    res = await db.execute(
        select(ExecucaoPortarias)
        .order_by(desc(ExecucaoPortarias.iniciado_em))
        .limit(limit)
    )
    rows = res.scalars().all()

    def _row(e: ExecucaoPortarias) -> dict:
        return {
            "id": e.id,
            "data_referencia": e.data_referencia,
            "iniciado_em": e.iniciado_em.isoformat() if e.iniciado_em else None,
            "concluido_em": e.concluido_em.isoformat() if e.concluido_em else None,
            "estrategia_usada": e.estrategia_usada,
            "total_bruto": e.total_bruto,
            "total_descartados": e.total_descartados,
            "total_aceitos": e.total_aceitos,
            "total_apui": e.total_apui,
            "total_amazonas": e.total_amazonas,
            "total_federal": e.total_federal,
            "total_sem_impacto": e.total_sem_impacto,
            "total_duplicatas": e.total_duplicatas,
            "email_enviado": e.email_enviado,
            "email_erro": e.email_erro,
            "modo": e.modo,
            "usuario": e.usuario,
        }

    return {"total": len(rows), "execucoes": [_row(e) for e in rows]}
