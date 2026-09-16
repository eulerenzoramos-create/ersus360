"""Router: /api/contas-fms — Contas Bancárias do Fundo Municipal de Saúde."""
from __future__ import annotations
import csv
import io
import logging
import re
from datetime import date, datetime
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.conta_bancaria_fms import ContaBancariaFMS, MovimentacaoContaFMS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/contas-fms", tags=["contas-fms"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


# ── Schemas ───────────────────────────────────────────────────────────────────

class ContaIn(BaseModel):
    banco:          str
    codigo_banco:   Optional[str] = None
    agencia:        Optional[str] = None
    numero_conta:   Optional[str] = None
    digito:         Optional[str] = None
    tipo:           str = "Corrente"
    descricao:      Optional[str] = None
    saldo_inicial:  float = 0.0
    data_saldo_ini: Optional[date] = None
    criado_por:     Optional[str] = None

class ContaUpdate(BaseModel):
    banco:          Optional[str] = None
    codigo_banco:   Optional[str] = None
    agencia:        Optional[str] = None
    numero_conta:   Optional[str] = None
    digito:         Optional[str] = None
    tipo:           Optional[str] = None
    descricao:      Optional[str] = None
    saldo_inicial:  Optional[float] = None
    data_saldo_ini: Optional[date] = None

class MovIn(BaseModel):
    tipo:         str            # "entrada" | "saida"
    valor:        float
    data:         date
    descricao:    Optional[str] = None
    origem:       str = "manual"
    referencia_id: Optional[int] = None
    criado_por:   Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_or_404(db: AsyncSession, id: int) -> ContaBancariaFMS:
    obj = await db.get(ContaBancariaFMS, id)
    if not obj or not obj.ativo:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return obj

def _saldo_atual(conta: ContaBancariaFMS) -> float:
    saldo = float(conta.saldo_inicial or 0)
    for m in conta.movimentacoes:
        v = float(m.valor or 0)
        saldo += v if m.tipo == "entrada" else -v
    return saldo


# ── Listagem ──────────────────────────────────────────────────────────────────

@router.get("")
async def listar_contas(db: DbDep):
    q = select(ContaBancariaFMS).where(ContaBancariaFMS.ativo == True).order_by(ContaBancariaFMS.banco)
    rows = (await db.execute(q)).scalars().all()
    result = []
    for c in rows:
        d = c.to_dict()
        # carrega movimentações
        q2 = select(MovimentacaoContaFMS).where(MovimentacaoContaFMS.conta_id == c.id).order_by(MovimentacaoContaFMS.data)
        movs = (await db.execute(q2)).scalars().all()
        c.movimentacoes = movs
        d["saldo_atual"] = _saldo_atual(c)
        d["total_entradas"] = sum(float(m.valor or 0) for m in movs if m.tipo == "entrada")
        d["total_saidas"] = sum(float(m.valor or 0) for m in movs if m.tipo == "saida")
        d["qtd_movimentacoes"] = len(movs)
        result.append(d)
    return result


@router.get("/resumo")
async def resumo_contas(db: DbDep):
    contas = await listar_contas(db)
    return {
        "total_contas": len(contas),
        "saldo_consolidado": sum(c["saldo_atual"] for c in contas),
        "total_entradas": sum(c["total_entradas"] for c in contas),
        "total_saidas": sum(c["total_saidas"] for c in contas),
        "contas": contas,
    }


# ── CRUD Conta ────────────────────────────────────────────────────────────────

@router.post("", status_code=201)
async def criar_conta(db: DbDep, body: ContaIn):
    obj = ContaBancariaFMS(**body.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    d = obj.to_dict()
    d["saldo_atual"] = float(obj.saldo_inicial or 0)
    d["total_entradas"] = 0.0
    d["total_saidas"] = 0.0
    d["qtd_movimentacoes"] = 0
    logger.info("Conta FMS criada id=%s banco=%s", obj.id, obj.banco)
    return d


@router.get("/{id}")
async def obter_conta(db: DbDep, id: int):
    obj = await _get_or_404(db, id)
    q2 = select(MovimentacaoContaFMS).where(MovimentacaoContaFMS.conta_id == id).order_by(MovimentacaoContaFMS.data.desc())
    movs = (await db.execute(q2)).scalars().all()
    obj.movimentacoes = movs
    d = obj.to_dict()
    d["saldo_atual"] = _saldo_atual(obj)
    d["total_entradas"] = sum(float(m.valor or 0) for m in movs if m.tipo == "entrada")
    d["total_saidas"] = sum(float(m.valor or 0) for m in movs if m.tipo == "saida")
    d["movimentacoes"] = [m.to_dict() for m in movs]
    return d


@router.put("/{id}")
async def atualizar_conta(db: DbDep, id: int, body: ContaUpdate):
    obj = await _get_or_404(db, id)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(obj, k, v)
    await db.commit()
    await db.refresh(obj)
    return obj.to_dict()


@router.delete("/{id}")
async def excluir_conta(db: DbDep, id: int):
    obj = await _get_or_404(db, id)
    obj.ativo = False
    await db.commit()
    return {"ok": True, "id": id}


# ── Movimentações ─────────────────────────────────────────────────────────────

@router.post("/{id}/movimentacao", status_code=201)
async def adicionar_movimentacao(db: DbDep, id: int, body: MovIn):
    await _get_or_404(db, id)
    mov = MovimentacaoContaFMS(conta_id=id, **body.model_dump())
    db.add(mov)
    await db.commit()
    await db.refresh(mov)
    logger.info("Movimentação id=%s conta=%s tipo=%s valor=%s", mov.id, id, mov.tipo, mov.valor)
    return mov.to_dict()


@router.get("/{id}/extrato")
async def extrato(
    db: DbDep,
    id: int,
    de: Optional[date] = Query(None),
    ate: Optional[date] = Query(None),
):
    await _get_or_404(db, id)
    q = select(MovimentacaoContaFMS).where(MovimentacaoContaFMS.conta_id == id)
    if de:
        q = q.where(MovimentacaoContaFMS.data >= de)
    if ate:
        q = q.where(MovimentacaoContaFMS.data <= ate)
    q = q.order_by(MovimentacaoContaFMS.data)
    movs = (await db.execute(q)).scalars().all()

    saldo_corrente = float((await db.get(ContaBancariaFMS, id)).saldo_inicial or 0)
    linhas = []
    for m in movs:
        v = float(m.valor or 0)
        if m.tipo == "entrada":
            saldo_corrente += v
        else:
            saldo_corrente -= v
        d = m.to_dict()
        d["saldo_apos"] = saldo_corrente
        linhas.append(d)

    return {
        "conta_id": id,
        "de": de.isoformat() if de else None,
        "ate": ate.isoformat() if ate else None,
        "linhas": linhas,
        "saldo_final": saldo_corrente,
        "total_entradas": sum(float(m.valor or 0) for m in movs if m.tipo == "entrada"),
        "total_saidas": sum(float(m.valor or 0) for m in movs if m.tipo == "saida"),
    }


@router.delete("/{conta_id}/movimentacao/{mov_id}")
async def excluir_movimentacao(db: DbDep, conta_id: int, mov_id: int):
    mov = await db.get(MovimentacaoContaFMS, mov_id)
    if not mov or mov.conta_id != conta_id:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")
    await db.delete(mov)
    await db.commit()
    return {"ok": True}


# ── Importação de Extrato OFX / CSV ──────────────────────────────────────────

def _parse_ofx(content: str) -> list[dict]:
    """Lê OFX SGML (padrão BB, Caixa, Bradesco, Itaú) e retorna lista de transações."""
    transactions = []
    blocks = re.findall(r"<STMTTRN>(.*?)</STMTTRN>", content, re.DOTALL | re.IGNORECASE)
    for block in blocks:
        def gv(tag: str) -> str:
            m = re.search(rf"<{tag}>\s*([^\n<]+)", block, re.IGNORECASE)
            return m.group(1).strip() if m else ""

        trnamt_raw = gv("TRNAMT").replace(",", ".")
        try:
            valor_num = float(trnamt_raw)
        except ValueError:
            continue

        dtposted = gv("DTPOSTED")
        if len(dtposted) >= 8:
            data_iso = f"{dtposted[:4]}-{dtposted[4:6]}-{dtposted[6:8]}"
        else:
            data_iso = None

        memo = gv("MEMO") or gv("NAME") or ""
        fitid = gv("FITID")
        tipo = "entrada" if valor_num > 0 else "saida"

        transactions.append({
            "fitid":    fitid,
            "tipo":     tipo,
            "valor":    abs(valor_num),
            "data":     data_iso,
            "descricao": memo[:280],
            "origem":   "ofx",
        })
    return transactions


def _parse_csv(content: str) -> list[dict]:
    """
    Tenta detectar e ler CSV de extratos bancários brasileiros.
    Suporta: BB, Caixa, Bradesco, Sicoob, Sicredi e genérico.
    """
    # Normaliza separador: ponto-e-vírgula → vírgula
    sample = content[:2000]
    sep = ";" if sample.count(";") > sample.count(",") else ","

    lines = [l for l in content.splitlines() if l.strip()]
    # Detecta linha de cabeçalho (busca por palavras-chave)
    header_idx = 0
    for i, line in enumerate(lines):
        low = line.lower()
        if any(k in low for k in ["data", "histórico", "historico", "valor", "lançamento", "lancamento"]):
            header_idx = i
            break

    reader = csv.DictReader(lines[header_idx:], delimiter=sep)
    transactions = []

    for row in reader:
        keys = {k.strip().lower().replace(" ", "_"): v.strip() for k, v in row.items() if k}

        # Data
        data_raw = (keys.get("data") or keys.get("data_lançamento") or keys.get("data_lancamento") or "").strip()
        data_iso = None
        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y"):
            try:
                data_iso = datetime.strptime(data_raw, fmt).date().isoformat()
                break
            except ValueError:
                pass

        # Descrição
        descricao = (
            keys.get("histórico") or keys.get("historico") or
            keys.get("descrição") or keys.get("descricao") or
            keys.get("memo") or keys.get("lançamento") or ""
        )[:280]

        # Valor e tipo — tenta crédito/débito separados primeiro
        def to_float(s: str) -> float:
            s = s.strip().replace(".", "").replace(",", ".").replace("R$", "").strip()
            try:
                return float(s)
            except ValueError:
                return 0.0

        credito = to_float(keys.get("crédito") or keys.get("credito") or keys.get("entrada") or "0")
        debito  = to_float(keys.get("débito")  or keys.get("debito")  or keys.get("saída")   or keys.get("saida") or "0")

        if credito == 0 and debito == 0:
            # Coluna única "valor"
            val_raw = keys.get("valor") or keys.get("montante") or "0"
            val = to_float(val_raw)
            if val > 0:
                credito = val
            elif val < 0:
                debito = abs(val)

        if credito > 0:
            transactions.append({"tipo": "entrada", "valor": credito, "data": data_iso, "descricao": descricao, "origem": "csv", "fitid": ""})
        if debito > 0:
            transactions.append({"tipo": "saida",   "valor": debito,  "data": data_iso, "descricao": descricao, "origem": "csv", "fitid": ""})

    return [t for t in transactions if t["valor"] > 0]


class ImportConfirm(BaseModel):
    transacoes: list[dict]
    criado_por: Optional[str] = None


@router.post("/{id}/importar-extrato")
async def importar_extrato_preview(id: int, file: UploadFile = File(...)):
    """Recebe arquivo OFX ou CSV e retorna preview das transações (sem gravar)."""
    await _get_or_404.__wrapped__ if hasattr(_get_or_404, "__wrapped__") else None
    raw = await file.read()
    try:
        content = raw.decode("latin-1")
    except Exception:
        content = raw.decode("utf-8", errors="replace")

    fname = (file.filename or "").lower()
    if fname.endswith(".ofx") or fname.endswith(".ofc") or "<OFX>" in content.upper():
        transacoes = _parse_ofx(content)
        formato = "OFX"
    else:
        transacoes = _parse_csv(content)
        formato = "CSV"

    if not transacoes:
        raise HTTPException(status_code=422, detail="Nenhuma transação encontrada no arquivo. Verifique o formato.")

    return {
        "formato": formato,
        "total": len(transacoes),
        "total_entradas": sum(t["valor"] for t in transacoes if t["tipo"] == "entrada"),
        "total_saidas":   sum(t["valor"] for t in transacoes if t["tipo"] == "saida"),
        "transacoes": transacoes,
    }


@router.post("/{id}/confirmar-importacao", status_code=201)
async def confirmar_importacao(db: DbDep, id: int, body: ImportConfirm):
    """Grava as transações confirmadas pelo usuário."""
    await _get_or_404(db, id)
    salvos = 0
    for t in body.transacoes:
        data_val = None
        if t.get("data"):
            try:
                data_val = date.fromisoformat(t["data"])
            except ValueError:
                pass
        if not data_val or not t.get("valor"):
            continue
        mov = MovimentacaoContaFMS(
            conta_id  = id,
            tipo      = t.get("tipo", "entrada"),
            valor     = float(t["valor"]),
            data      = data_val,
            descricao = t.get("descricao", ""),
            origem    = t.get("origem", "importado"),
            criado_por= body.criado_por,
        )
        db.add(mov)
        salvos += 1
    await db.commit()
    logger.info("Importação conta %s: %d movimentações gravadas", id, salvos)
    return {"ok": True, "salvos": salvos}
