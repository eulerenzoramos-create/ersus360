"""Router: Execução Financeira FNS — Apuí/AM
CRUD para empenhos, liquidações e pagamentos dos recursos FNS.
"""
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from database import get_db
from models.execucao_fns import ExecucaoFns, DocumentoExecucao

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
    data_pagamento:  date
    pago:            float
    numero_ob:       Optional[str] = None
    observacao:      Optional[str] = None


class PortariaIn(BaseModel):
    portaria: str


class DocumentoIn(BaseModel):
    nome:         str
    tipo_mime:    str = "application/octet-stream"
    tamanho_kb:   int = 0
    conteudo_b64: str  # base64 do arquivo


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _calcular_situacao(item: ExecucaoFns) -> str:
    if item.pago > 0 and item.pago >= item.empenhado:
        return "Pago"
    if item.liquidado > 0:
        return "Liquidado"
    if item.empenhado > 0:
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


@router.post("/empenho", status_code=201)
async def cadastrar_empenho(body: EmpenhoIn, db: AsyncSession = Depends(get_db)):
    item = ExecucaoFns(**body.model_dump())
    item.situacao = _calcular_situacao(item)
    db.add(item)
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
    item.data_pagamento = body.data_pagamento
    item.pago           = body.pago
    item.numero_ob      = body.numero_ob
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
async def excluir(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(ExecucaoFns, item_id)
    if not item or not item.ativo:
        raise HTTPException(404, "Registro não encontrado")
    item.ativo = False
    item.atualizado_em = datetime.utcnow()
    await db.commit()
    return {"ok": True}


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


