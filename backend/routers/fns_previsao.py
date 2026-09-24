"""
Router: /api/fns-previsao — Previsão da Portaria × Recebimento FNS.

Evolução do Controle Financeiro FNS: cadastro da previsão (sobre
portarias_municipio), conciliação com as transferências FNS já coletadas e o
painel Previsto × Recebido. Multi-município: tudo do município da sessão.
"""
from __future__ import annotations

import re
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.portaria import Portaria, PortariaMunicipio
from models.transferencia_fns import TransferenciaFns
from routers.auth import UserOut, ip_de
from services import previsao_fns as pf
from tenancy.auditoria import registrar_auditoria
from tenancy.contexto import ibge6, ibge7
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/fns-previsao", tags=["FNS — Previsto × Recebido"])

PERFIS_EDICAO = {"admin", "gestor", "financeiro", "contabilidade"}


def _pode_editar(u: UserOut) -> None:
    if not (u.administrador_geral or u.role in PERFIS_EDICAO):
        raise HTTPException(403, "Perfil sem permissão para alterar previsões e conciliações")


# ── Schemas ───────────────────────────────────────────────────────────────────

class PrevisaoIn(BaseModel):
    numero_portaria: str = Field(min_length=1, max_length=50)
    ano_portaria: int = Field(ge=2000, le=2100)
    orgao_emissor: str = "GM/MS"
    data_portaria: Optional[date] = None
    exercicio: int = Field(ge=2000, le=2100)
    grupo: Optional[str] = None
    acao: Optional[str] = None
    componente: Optional[str] = None
    programa: Optional[str] = None
    valor_previsto: float = Field(ge=0)
    periodicidade: str = "unica"
    competencia_inicial: str             # AAAA-MM
    qtd_parcelas: int = Field(1, ge=1, le=120)
    valor_parcela: Optional[float] = Field(None, ge=0)
    fundamento: Optional[str] = None


class VinculoIn(BaseModel):
    transferencia_id: int
    previsao_id: int
    competencia: str                     # AAAA-MM
    motivo: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _validar(body: PrevisaoIn) -> tuple[int, int]:
    if body.periodicidade not in pf.PASSO_MESES:
        raise HTTPException(422, f"Periodicidade inválida. Use: {', '.join(pf.PASSO_MESES)}")
    comp = pf.comp_parse(body.competencia_inicial)
    if not comp:
        raise HTTPException(422, "Competência inicial inválida (use AAAA-MM)")
    if not (body.componente or body.acao):
        raise HTTPException(422, "Informe o componente ou a ação — sem isso não há como conciliar com o FNS")
    return comp


async def _portaria(db: AsyncSession, body: PrevisaoIn, usuario: UserOut) -> Portaria:
    """Portaria do catálogo nacional; cria apenas o identificador se ainda não existir
    (nunca altera uma Portaria existente)."""
    numero = re.sub(r"\s+", "", body.numero_portaria)
    port = (await db.execute(
        select(Portaria).where(Portaria.numero == numero).where(Portaria.ano == body.ano_portaria)
    )).scalars().first()
    if port:
        return port
    port = Portaria(numero=numero, ano=body.ano_portaria, orgao_emissor=body.orgao_emissor or "GM/MS",
                    data_publicacao=body.data_portaria, programa=body.programa,
                    grupo=(body.grupo or None) and body.grupo[:100], acao=(body.acao or None) and body.acao[:200])
    db.add(port)
    await db.flush()
    return port


async def _previsao(db: AsyncSession, u: UserOut, previsao_id: int) -> PortariaMunicipio:
    p = (await db.execute(
        select(PortariaMunicipio).options(selectinload(PortariaMunicipio.portaria))
        .where(PortariaMunicipio.id == previsao_id)
    )).scalar_one_or_none()
    if not p or p.excluido_em is not None or p.municipio_id != u.municipio_id:
        if p and p.municipio_id != u.municipio_id:
            await registrar_auditoria(db, "ACESSO_NEGADO", usuario=u, tabela="portarias_municipio",
                                      registro_id=previsao_id, detalhe="REGISTRO_DE_OUTRO_MUNICIPIO")
        raise HTTPException(404, "Previsão não encontrada")
    return p


async def _transferencia(db: AsyncSession, u: UserOut, tid: int) -> TransferenciaFns:
    t = await db.get(TransferenciaFns, tid)
    if not t or t.municipio_ibge not in (ibge6(), ibge7()):
        if t:
            await registrar_auditoria(db, "ACESSO_NEGADO", usuario=u, tabela="transferencias_fns",
                                      registro_id=tid, detalhe="REGISTRO_DE_OUTRO_MUNICIPIO")
        raise HTTPException(404, "Transferência não encontrada")
    return t


def _dict_previsao(p: PortariaMunicipio) -> dict:
    return {
        "id": p.id, "portaria": pf.portaria_rotulo(p),
        "numero_portaria": p.portaria.numero if p.portaria else None,
        "ano_portaria": p.portaria.ano if p.portaria else None,
        "orgao_emissor": p.portaria.orgao_emissor if p.portaria else None,
        "data_portaria": p.portaria.data_publicacao if p.portaria else None,
        "exercicio": p.exercicio, "grupo": p.grupo, "acao": p.acao, "componente": p.componente,
        "valor_previsto": p.valor_municipio, "periodicidade": p.periodicidade,
        "competencia_inicial": p.competencia, "qtd_parcelas": p.qtd_parcelas,
        "valor_parcela": p.valor_parcela, "fundamento": p.fundamento,
        "parcelas": [{"numero": pa.numero, "competencia": pa.competencia, "valor": float(pa.valor)}
                     for pa in pf.parcelas(p)],
    }


def _aplicar(p: PortariaMunicipio, body: PrevisaoIn, comp: tuple[int, int]) -> None:
    p.exercicio = body.exercicio
    p.grupo, p.acao, p.componente = body.grupo, body.acao, body.componente
    p.valor_municipio = body.valor_previsto
    p.periodicidade = body.periodicidade
    p.competencia = pf.comp_fmt(*comp)
    p.qtd_parcelas = 1 if body.periodicidade == "unica" else body.qtd_parcelas
    p.valor_parcela = body.valor_parcela
    p.fundamento = body.fundamento


async def _limpar_vinculos(db: AsyncSession, p: PortariaMunicipio, so_automaticos: bool) -> int:
    """Remove vínculos da previsão (todos, ou só os automáticos e os manuais cuja
    competência deixou de existir após a edição)."""
    validas = {pa.competencia for pa in pf.parcelas(p)}
    ts = (await db.execute(select(TransferenciaFns).where(TransferenciaFns.previsao_id == p.id))).scalars().all()
    n = 0
    for t in ts:
        if not so_automaticos or t.vinculo_tipo != "manual" or t.competencia_referencia not in validas:
            t.previsao_id = t.competencia_referencia = t.vinculo_tipo = t.vinculo_por = None
            t.vinculo_em = None
            n += 1
    return n


# ── Previsões ─────────────────────────────────────────────────────────────────

@router.get("/previsoes")
async def listar_previsoes(current: SessaoMunicipal, exercicio: Optional[int] = None,
                           db: AsyncSession = Depends(get_db)):
    prevs = await pf.carregar_previsoes(db, current.municipio_id)
    if exercicio:
        prevs = [p for p in prevs if p.exercicio == exercicio]
    return [_dict_previsao(p) for p in sorted(prevs, key=lambda p: (p.competencia or "", p.id))]


@router.post("/previsoes", status_code=201)
async def criar_previsao(body: PrevisaoIn, request: Request, current: SessaoMunicipal,
                         db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    comp = _validar(body)
    port = await _portaria(db, body, current)
    p = PortariaMunicipio(portaria_id=port.id, municipio_id=current.municipio_id,
                          criado_por=current.username)
    _aplicar(p, body, comp)
    db.add(p)
    await db.commit()
    p = await _previsao(db, current, p.id)
    await registrar_auditoria(db, "PREVISAO_FNS_CRIADA", usuario=current, ip=ip_de(request),
                              tabela="portarias_municipio", registro_id=p.id,
                              detalhe=f"{pf.portaria_rotulo(p)} {p.competencia} R$ {p.valor_municipio}")
    conc = await pf.conciliar(db, current.municipio_id, current.username)
    return {**_dict_previsao(await _previsao(db, current, p.id)), "conciliacao": conc}


@router.put("/previsoes/{previsao_id}")
async def atualizar_previsao(previsao_id: int, body: PrevisaoIn, request: Request,
                             current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    comp = _validar(body)
    p = await _previsao(db, current, previsao_id)
    port = await _portaria(db, body, current)
    p.portaria_id = port.id
    _aplicar(p, body, comp)
    await db.flush()
    removidos = await _limpar_vinculos(db, p, so_automaticos=True)
    await db.commit()
    await registrar_auditoria(db, "PREVISAO_FNS_ATUALIZADA", usuario=current, ip=ip_de(request),
                              tabela="portarias_municipio", registro_id=p.id,
                              detalhe=f"vínculos refeitos: {removidos}")
    conc = await pf.conciliar(db, current.municipio_id, current.username)
    return {**_dict_previsao(await _previsao(db, current, p.id)), "conciliacao": conc}


@router.delete("/previsoes/{previsao_id}")
async def excluir_previsao(previsao_id: int, request: Request, current: SessaoMunicipal,
                           db: AsyncSession = Depends(get_db)):
    """Exclusão lógica. Os registros do FNS permanecem intactos; só o vínculo sai."""
    _pode_editar(current)
    p = await _previsao(db, current, previsao_id)
    removidos = await _limpar_vinculos(db, p, so_automaticos=False)
    p.excluido_em = datetime.utcnow()
    await db.commit()
    await registrar_auditoria(db, "PREVISAO_FNS_EXCLUIDA", usuario=current, ip=ip_de(request),
                              tabela="portarias_municipio", registro_id=p.id,
                              detalhe=f"exclusão lógica; vínculos desfeitos: {removidos}")
    return {"ok": True, "vinculos_desfeitos": removidos}


@router.post("/previsoes/gerar-do-fns")
async def gerar_previsoes_do_fns(request: Request, current: SessaoMunicipal,
                                 exercicio: int = Query(..., ge=2000, le=2100),
                                 db: AsyncSession = Depends(get_db)):
    """Cria as previsões a partir da Portaria e da "Comp./Parcela" informadas pelo
    FNS em cada pagamento já coletado (nenhum registro financeiro é criado).
    Não sobrescreve previsão existente; cada criação fica na auditoria."""
    _pode_editar(current)
    propostas = await pf.propostas_do_fns(db, current.municipio_id, exercicio)
    criadas = []
    for pr in propostas:
        port = (await db.execute(
            select(Portaria).where(Portaria.numero == pr["numero_portaria"])
            .where(Portaria.ano.in_([exercicio, exercicio - 1])).order_by(Portaria.ano.desc())
        )).scalars().first()
        if not port:
            port = Portaria(numero=pr["numero_portaria"], ano=exercicio, orgao_emissor="GM/MS",
                            grupo=(pr["grupo"] or None) and pr["grupo"][:100],
                            acao=(pr["acao"] or None) and pr["acao"][:200])
            db.add(port)
            await db.flush()
        p = PortariaMunicipio(
            portaria_id=port.id, municipio_id=current.municipio_id, criado_por=current.username,
            exercicio=exercicio, grupo=pr["grupo"], acao=pr["acao"], componente=pr["componente"],
            valor_municipio=pr["valor_previsto"], periodicidade=pr["periodicidade"],
            competencia=pr["competencia_inicial"], qtd_parcelas=pr["qtd_parcelas"],
            valor_parcela=pr["valor_parcela"],
            fundamento=f"Gerada a partir do FNS (Portaria nº {pr['numero_portaria']}, "
                       f"parcelas {', '.join(pr['parcelas_fns'])}). Conferir valor e ano com a Portaria publicada.")
        db.add(p)
        await db.flush()
        criadas.append((p.id, pr))
    await db.commit()
    for pid, pr in criadas:
        await registrar_auditoria(db, "PREVISAO_FNS_CRIADA", usuario=current, ip=ip_de(request),
                                  tabela="portarias_municipio", registro_id=pid,
                                  detalhe=f"gerada do FNS: Portaria {pr['numero_portaria']} "
                                          f"{pr['qtd_parcelas']}x R$ {pr['valor_parcela']}")
    conc = await pf.conciliar(db, current.municipio_id, current.username) if criadas else {"vinculados": 0}
    return {"criadas": len(criadas), "conciliacao": conc}


# ── Conciliação ──────────────────────────────────────────────────────────────

@router.post("/conciliar")
async def conciliar(request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    return await pf.conciliar(db, current.municipio_id, current.username)


@router.post("/vinculos")
async def vincular(body: VinculoIn, request: Request, current: SessaoMunicipal,
                   db: AsyncSession = Depends(get_db)):
    """Vínculo manual pagamento FNS → previsão/competência (registrado na auditoria)."""
    _pode_editar(current)
    p = await _previsao(db, current, body.previsao_id)
    t = await _transferencia(db, current, body.transferencia_id)
    comp = pf.comp_parse(body.competencia)
    if not comp or pf.comp_fmt(*comp) not in {pa.competencia for pa in pf.parcelas(p)}:
        raise HTTPException(422, "Competência não pertence às parcelas desta previsão")
    if t.previsao_id and (t.previsao_id, t.competencia_referencia) != (p.id, pf.comp_fmt(*comp)):
        raise HTTPException(409, "Este pagamento já está vinculado a outra previsão — desfaça o vínculo antes")
    t.previsao_id, t.competencia_referencia = p.id, pf.comp_fmt(*comp)
    t.vinculo_tipo, t.vinculo_por, t.vinculo_em = "manual", current.username, datetime.utcnow()
    await db.commit()
    await registrar_auditoria(
        db, "CONCILIACAO_FNS_MANUAL", usuario=current, ip=ip_de(request),
        tabela="transferencias_fns", registro_id=t.id,
        detalhe=f"{pf.portaria_rotulo(p)} competência {t.competencia_referencia}; "
                f"pago em {t.data_pagamento or '—'}; valor {t.valor_liquido}. {body.motivo or ''}".strip())
    return {"ok": True, "sem_valor_liquido": t.valor_liquido is None}


@router.delete("/vinculos/{transferencia_id}")
async def desvincular(transferencia_id: int, request: Request, current: SessaoMunicipal,
                      db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    t = await _transferencia(db, current, transferencia_id)
    if not t.previsao_id:
        raise HTTPException(404, "Pagamento sem vínculo")
    anterior = f"previsão {t.previsao_id} competência {t.competencia_referencia} ({t.vinculo_tipo})"
    t.previsao_id = t.competencia_referencia = t.vinculo_tipo = t.vinculo_por = None
    t.vinculo_em = None
    await db.commit()
    await registrar_auditoria(db, "CONCILIACAO_FNS_DESFEITA", usuario=current, ip=ip_de(request),
                              tabela="transferencias_fns", registro_id=t.id, detalhe=anterior)
    return {"ok": True}


# ── Painel ────────────────────────────────────────────────────────────────────

@router.get("/painel")
async def painel(
    current: SessaoMunicipal,
    exercicio: int = Query(..., ge=2000, le=2100),
    mes_inicio: int = Query(1, ge=1, le=12),
    mes_fim: int = Query(12, ge=1, le=12),
    grupo: Optional[str] = None,
    tipo_incentivo: Optional[str] = None,
    busca: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await pf.painel(db, current.municipio_id, pf.Filtros(
        exercicio=exercicio, mes_inicio=mes_inicio, mes_fim=mes_fim,
        grupo=grupo, tipo_incentivo=tipo_incentivo, busca=busca))
