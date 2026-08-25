"""Router: Execução Financeira FNS — Apuí/AM
CRUD para empenhos, liquidações e pagamentos dos recursos FNS.
"""
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from database import get_db
from models.execucao_fns import ExecucaoFns, DocumentoExecucao
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/execucao-fns", tags=["execucao-fns"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class EmpenhoIn(BaseModel):
    exercicio:       int   = 2026
    recurso:         str
    bloco:           str   = ""
    grupo:           str   = ""
    dotacao:         float = 0.0
    numero_empenho:  Optional[str] = None
    data_empenho:    Optional[date] = None
    empenhado:       float = 0.0
    fornecedor:      str   = ""
    cnpj_fornecedor: Optional[str] = None
    contrato:        Optional[str] = None
    conta_pagadora:  Optional[str] = None
    portaria:        Optional[str] = None
    observacao:      Optional[str] = None


class LiquidacaoIn(BaseModel):
    data_liquidacao: date
    liquidado:       float
    nota_fiscal:     Optional[str] = None
    observacao:      Optional[str] = None


class PagamentoIn(BaseModel):
    data_pagamento:   date
    pago:             float
    numero_ob:        Optional[str] = None
    banco_pagamento:  Optional[str] = None
    agencia_pagamento: Optional[str] = None
    numero_conta_pag: Optional[str] = None
    observacao:       Optional[str] = None


class PortariaIn(BaseModel):
    portaria: str


class DocumentoIn(BaseModel):
    nome:         str
    tipo_mime:    str = "application/octet-stream"
    tamanho_kb:   int = 0
    conteudo_b64: str  # base64 do arquivo


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _calcular_situacao(item: ExecucaoFns) -> str:
    pago      = item.pago      or 0.0
    liquidado = item.liquidado or 0.0
    empenhado = item.empenhado or 0.0
    if pago > 0 and pago >= empenhado:
        return "Pago"
    if liquidado > 0:
        return "Liquidado"
    if empenhado > 0:
        return "Empenhado"
    return "Pendente"


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("")
async def listar(exercicio: int = 2026, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ExecucaoFns)
        .where(ExecucaoFns.ativo == True, ExecucaoFns.exercicio == exercicio)
        .order_by(ExecucaoFns.criado_em.desc())
    )
    return [i.to_dict() for i in result.scalars().all()]


@router.get("/portarias")
async def listar_portarias_inline(exercicio: int = 2026, db: AsyncSession = Depends(get_db)):
    """Retorna portarias únicas (para autocomplete)."""
    from sqlalchemy import distinct
    result = await db.execute(
        select(distinct(ExecucaoFns.portaria))
        .where(ExecucaoFns.ativo == True, ExecucaoFns.exercicio == exercicio,
               ExecucaoFns.portaria != None, ExecucaoFns.portaria != "")
        .order_by(ExecucaoFns.portaria)
    )
    return [r for r in result.scalars().all() if r]


@router.get("/documentos/{doc_id}/download")
async def download_documento(doc_id: int, db: AsyncSession = Depends(get_db)):
    import base64
    from fastapi.responses import Response
    doc = await db.get(DocumentoExecucao, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")
    conteudo = base64.b64decode(doc.conteudo_b64)
    return Response(
        content=conteudo,
        media_type=doc.tipo_mime,
        headers={"Content-Disposition": f'attachment; filename="{doc.nome}"'},
    )


@router.delete("/documentos/{doc_id}")
async def excluir_documento_inline(doc_id: int, db: AsyncSession = Depends(get_db)):
    doc = await db.get(DocumentoExecucao, doc_id)
    if not doc:
        raise HTTPException(404, "Documento não encontrado")
    await db.delete(doc)
    await db.commit()
    return {"ok": True}


@router.get("/{item_id}")
async def obter(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    return item.to_dict()


@router.post("/email")
async def enviar_relatorio_email(body: dict, db: AsyncSession = Depends(get_db)):
    """Envia resumo da execução financeira por e-mail."""
    import smtplib, os
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    destinatario = body.get("destinatario", "")
    if not destinatario or "@" not in destinatario:
        raise HTTPException(400, "E-mail inválido")

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    if not smtp_user or not smtp_pass:
        raise HTTPException(503, "Servidor de e-mail não configurado (SMTP_USER / SMTP_PASS ausentes)")

    exercicio   = body.get("exercicio", 2026)
    total_dot   = body.get("total_dot", 0)
    total_emp   = body.get("total_emp", 0)
    total_liq   = body.get("total_liq", 0)
    total_pago  = body.get("total_pago", 0)
    saldo       = body.get("saldo", 0)
    pct_exec    = body.get("pct_exec", 0)
    registros   = body.get("registros", 0)

    def fmt(v): return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    html = f"""
    <html><body style="font-family:sans-serif;color:#111827">
    <h2 style="color:#1565c0">Execução Financeira FNS — Apuí/AM · Exercício {exercicio}</h2>
    <table border="0" cellpadding="8" style="border-collapse:collapse;width:100%;max-width:540px">
      <tr><td style="color:#6b7280">Dotação / Recebido</td><td><strong>{fmt(total_dot)}</strong></td></tr>
      <tr style="background:#f4f6f8"><td style="color:#6b7280">Total Empenhado</td><td><strong style="color:#d97706">{fmt(total_emp)}</strong></td></tr>
      <tr><td style="color:#6b7280">Total Liquidado</td><td><strong style="color:#2563eb">{fmt(total_liq)}</strong></td></tr>
      <tr style="background:#f4f6f8"><td style="color:#6b7280">Total Pago</td><td><strong style="color:#7c3aed">{fmt(total_pago)}</strong></td></tr>
      <tr><td style="color:#6b7280">Saldo a Pagar</td><td><strong>{fmt(saldo)}</strong></td></tr>
      <tr style="background:#f4f6f8"><td style="color:#6b7280">% Executado</td><td><strong>{pct_exec:.1f}%</strong></td></tr>
      <tr><td style="color:#6b7280">Registros</td><td>{registros}</td></tr>
    </table>
    <p style="font-size:12px;color:#6b7280;margin-top:24px">
      Gerado pelo ERSUS 360 · FMS Apuí/AM · CNPJ 12.834.320/0001-26
    </p>
    </body></html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Execução Financeira FNS — Apuí/AM · {exercicio}"
    msg["From"]    = smtp_user
    msg["To"]      = destinatario
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as srv:
            srv.ehlo()
            srv.starttls()
            srv.login(smtp_user, smtp_pass)
            srv.sendmail(smtp_user, [destinatario], msg.as_string())
    except Exception as e:
        raise HTTPException(502, f"Falha ao enviar e-mail: {e}")

    return {"ok": True}


@router.post("/empenho", status_code=201)
async def cadastrar_empenho(
    body: EmpenhoIn,
    db: AsyncSession = Depends(get_db),
    usuario: UserOut = Depends(get_current_user),
):
    import logging
    log = logging.getLogger(__name__)
    try:
        dados = body.model_dump()
        log.info("Cadastrar empenho payload: %s", dados)
        item = ExecucaoFns(**dados)
        item.situacao  = _calcular_situacao(item)
        item.criado_por = usuario.nome or usuario.username
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item.to_dict()
    except Exception as exc:
        log.error("Erro ao cadastrar empenho: %s", exc, exc_info=True)
        raise HTTPException(500, f"Erro interno: {exc}")


@router.put("/{item_id}")
async def editar_empenho(
    item_id: int,
    body: EmpenhoIn,
    db: AsyncSession = Depends(get_db),
    usuario: UserOut = Depends(get_current_user),
):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    for field, value in body.model_dump().items():
        setattr(item, field, value)
    item.situacao    = _calcular_situacao(item)
    item.editado_por = usuario.nome or usuario.username
    item.editado_em  = datetime.utcnow()
    item.atualizado_em = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return item.to_dict()


@router.put("/{item_id}/liquidacao")
async def registrar_liquidacao(item_id: int, body: LiquidacaoIn, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    item.data_liquidacao = body.data_liquidacao
    item.liquidado       = body.liquidado
    item.nota_fiscal     = body.nota_fiscal
    if body.observacao:
        item.observacao = body.observacao
    item.situacao = _calcular_situacao(item)
    item.atualizado_em = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return item.to_dict()


@router.put("/{item_id}/pagamento")
async def registrar_pagamento(item_id: int, body: PagamentoIn, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    item.data_pagamento    = body.data_pagamento
    item.pago              = body.pago
    item.numero_ob         = body.numero_ob
    item.banco_pagamento   = body.banco_pagamento
    item.agencia_pagamento = body.agencia_pagamento
    item.numero_conta_pag  = body.numero_conta_pag
    if body.observacao:
        item.observacao = body.observacao
    item.situacao = _calcular_situacao(item)
    item.atualizado_em = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return item.to_dict()


@router.put("/{item_id}/portaria")
async def vincular_portaria(item_id: int, body: PortariaIn, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    item.portaria = body.portaria
    item.atualizado_em = datetime.utcnow()
    await db.commit()
    await db.refresh(item)
    return item.to_dict()


@router.delete("/{item_id}")
async def excluir(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    usuario: UserOut = Depends(get_current_user),
):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    item.ativo        = False
    item.excluido_por = usuario.nome or usuario.username
    item.excluido_em  = datetime.utcnow()
    item.atualizado_em = datetime.utcnow()
    await db.commit()
    return {"ok": True, "excluido_por": item.excluido_por, "excluido_em": item.excluido_em.isoformat()}


# ─── Documentos ──────────────────────────────────────────────────────────────

@router.get("/{item_id}/documentos")
async def listar_documentos(item_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DocumentoExecucao)
        .where(DocumentoExecucao.execucao_id == item_id)
        .order_by(DocumentoExecucao.criado_em.desc())
    )
    return [d.to_dict_meta() for d in result.scalars().all()]


@router.post("/{item_id}/documentos", status_code=201)
async def anexar_documento(item_id: int, body: DocumentoIn, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    doc = DocumentoExecucao(
        execucao_id=item_id,
        nome=body.nome,
        tipo_mime=body.tipo_mime,
        tamanho_kb=body.tamanho_kb,
        conteudo_b64=body.conteudo_b64,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc.to_dict_meta()


