"""
Router: /api/investsus — InvestSUS Emendas, Propostas e Execução
ERSUS 360 — Fundo Municipal de Saúde Apuí/AM

Sem API pública disponível: importação assistida + cadastro manual auditável.
"""
from __future__ import annotations
import logging
from datetime import date, datetime
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, field_validator
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from routers.auth import get_current_user, UserOut
from models.investsus import (
    PropostaInvestSUS, HistoricoSituacao, Parlamentar, ProgramaInvestSUS,
    UnidadeBeneficiada, PlanoTrabalho, AcaoServico, NaturezaDespesa,
    Parecer, PagamentoInvestSUS, AlertaInvestSUS, DocumentoInvestSUS,
    AtualizacaoManual, SituacaoNormalizada, TipoEmenda,
    NivelAlertaInvest, TipoParecer, ResultadoParecer, OrigemAtualizacao,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/investsus", tags=["InvestSUS"])
DbDep = Annotated[AsyncSession, Depends(get_db)]
UserDep = Annotated[UserOut, Depends(get_current_user)]


# ── Schemas Pydantic ──────────────────────────────────────────────────────────

class PropostaCreate(BaseModel):
    numero_proposta: str
    numero_emenda: str | None = None
    numero_instrumento: str | None = None
    numero_processo: str | None = None
    exercicio: int | None = None
    parlamentar_id: int | None = None
    programa_id: int | None = None
    tipo_emenda: str = "individual"
    objeto: str | None = None
    finalidade: str | None = None
    tipo_objeto: str | None = None
    modalidade_transferencia: str | None = None
    bloco_financiamento: str | None = None
    componente: str | None = None
    tipo_financiamento: str | None = None
    acao_orcamentaria: str | None = None
    entidade_nome: str | None = None
    entidade_cnpj: str | None = None
    entidade_municipio: str | None = None
    entidade_uf: str | None = None
    fundo_saude: str | None = None
    responsavel_legal: str | None = None
    valor_indicado: float = 0.0
    valor_proposta: float = 0.0
    valor_aprovado: float = 0.0
    valor_empenhado: float = 0.0
    valor_pago: float = 0.0
    situacao_original: str | None = None
    situacao_normalizada: str = "recurso_disponivel"
    portaria_numero: str | None = None
    portaria_data: str | None = None
    empenho_numero: str | None = None
    empenho_data: str | None = None
    conta_bancaria: str | None = None
    responsavel_interno: str | None = None
    prazo_vigencia: str | None = None
    digisus_diretriz: str | None = None
    digisus_objetivo: str | None = None
    digisus_meta: str | None = None
    digisus_exercicio: int | None = None
    justificativa: str | None = None
    fonte_dado: str | None = None


class PropostaUpdate(BaseModel):
    objeto: str | None = None
    finalidade: str | None = None
    situacao_original: str | None = None
    situacao_normalizada: str | None = None
    valor_indicado: float | None = None
    valor_proposta: float | None = None
    valor_aprovado: float | None = None
    valor_empenhado: float | None = None
    valor_pago: float | None = None
    valor_executado: float | None = None
    saldo_bancario: float | None = None
    rendimentos: float | None = None
    perc_fisico: float | None = None
    perc_financeiro: float | None = None
    portaria_numero: str | None = None
    portaria_data: str | None = None
    empenho_numero: str | None = None
    empenho_data: str | None = None
    conta_bancaria: str | None = None
    responsavel_interno: str | None = None
    prazo_vigencia: str | None = None
    digisus_diretriz: str | None = None
    digisus_objetivo: str | None = None
    digisus_meta: str | None = None
    digisus_exercicio: int | None = None
    digisus_situacao_vinculacao: str | None = None
    digisus_justificativa: str | None = None
    digisus_verificado_em: str | None = None
    digisus_verificado_por: str | None = None
    justificativa: str | None = None
    fonte_dado: str | None = None
    numero_instrumento: str | None = None
    numero_processo: str | None = None


class PareceCreate(BaseModel):
    area_responsavel: str | None = None
    sigla_area: str | None = None
    data_parecer: str | None = None
    tipo: str = "merito"
    resultado: str = "pendente"
    texto: str | None = None
    numero_parecer: str | None = None
    responsavel: str | None = None
    eh_diligencia: bool = False
    prazo_resposta: str | None = None


class PagamentoCreate(BaseModel):
    ordem_bancaria: str | None = None
    data_pagamento: str | None = None
    valor: float
    parcela: int | None = None
    conta_bancaria: str | None = None
    situacao: str | None = None


class AtualizacaoCreate(BaseModel):
    data_consulta: str
    situacao_encontrada: str | None = None
    observacoes: str | None = None
    origem: str = "manual"


class UnidadeCreate(BaseModel):
    cnes: str | None = None
    nome_estabelecimento: str | None = None
    municipio: str | None = None
    tipo_estabelecimento: str | None = None
    esfera_gestao: str | None = None
    valor_destinado: float = 0.0
    objeto_destinado: str | None = None


class NaturezaCreate(BaseModel):
    codigo: str
    descricao: str | None = None
    categoria_economica: str | None = None
    grupo: str | None = None
    modalidade_aplicacao: str | None = None
    elemento: str | None = None
    valor_previsto: float = 0.0


class AlertaResolverBody(BaseModel):
    observacao: str | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _municipio_id(user: UserOut) -> int:
    """Retorna municipio_id do usuário; superadmin usa municipio_id=1 como padrão."""
    mid = getattr(user, "municipio_id", None)
    if mid:
        return mid
    # assessoria/superadmin: permite filtrar depois
    return 1


def _prop_dict(p: PropostaInvestSUS) -> dict:
    parl = None
    if p.parlamentar:
        parl = {"id": p.parlamentar.id, "nome": p.parlamentar.nome, "partido": p.parlamentar.partido, "uf": p.parlamentar.uf}
    prog = None
    if p.programa:
        prog = {"id": p.programa.id, "nome": p.programa.nome, "bloco": p.programa.bloco}
    return {
        "id": p.id,
        "municipio_id": p.municipio_id,
        "numero_proposta": p.numero_proposta,
        "numero_emenda": p.numero_emenda,
        "numero_instrumento": p.numero_instrumento,
        "numero_processo": p.numero_processo,
        "exercicio": p.exercicio,
        "tipo_emenda": p.tipo_emenda.value if p.tipo_emenda else None,
        "parlamentar": parl,
        "programa": prog,
        "entidade_nome": p.entidade_nome,
        "entidade_cnpj": p.entidade_cnpj,
        "entidade_municipio": p.entidade_municipio,
        "entidade_uf": p.entidade_uf,
        "fundo_saude": p.fundo_saude,
        "objeto": p.objeto,
        "finalidade": p.finalidade,
        "tipo_objeto": p.tipo_objeto,
        "modalidade_transferencia": p.modalidade_transferencia,
        "bloco_financiamento": p.bloco_financiamento,
        "componente": p.componente,
        "tipo_financiamento": p.tipo_financiamento,
        "acao_orcamentaria": p.acao_orcamentaria,
        "valor_indicado": p.valor_indicado,
        "valor_proposta": p.valor_proposta,
        "valor_aprovado": p.valor_aprovado,
        "valor_empenhado": p.valor_empenhado,
        "valor_pago": p.valor_pago,
        "valor_executado": p.valor_executado,
        "saldo_bancario": p.saldo_bancario,
        "rendimentos": p.rendimentos,
        "valor_devolvido": p.valor_devolvido,
        "saldo_executar": p.saldo_executar,
        "perc_fisico": p.perc_fisico,
        "perc_financeiro": p.perc_financeiro,
        "situacao_original": p.situacao_original,
        "situacao_normalizada": p.situacao_normalizada.value if p.situacao_normalizada else None,
        "portaria_numero": p.portaria_numero,
        "portaria_data": str(p.portaria_data) if p.portaria_data else None,
        "empenho_numero": p.empenho_numero,
        "empenho_data": str(p.empenho_data) if p.empenho_data else None,
        "conta_bancaria": p.conta_bancaria,
        "responsavel_interno": p.responsavel_interno,
        "prazo_vigencia": str(p.prazo_vigencia) if p.prazo_vigencia else None,
        "digisus_exercicio": p.digisus_exercicio,
        "digisus_diretriz": p.digisus_diretriz,
        "digisus_objetivo": p.digisus_objetivo,
        "digisus_meta": p.digisus_meta,
        "digisus_indicador": p.digisus_indicador,
        "digisus_acao": p.digisus_acao,
        "digisus_situacao_vinculacao": p.digisus_situacao_vinculacao,
        "digisus_justificativa": p.digisus_justificativa,
        "digisus_verificado_em": str(p.digisus_verificado_em) if p.digisus_verificado_em else None,
        "digisus_verificado_por": p.digisus_verificado_por,
        "justificativa": p.justificativa,
        "fonte_dado": p.fonte_dado,
        "responsavel_legal": p.responsavel_legal,
        "situacao_cadastral": p.situacao_cadastral,
        "situacao_habilitacao": p.situacao_habilitacao,
        "ultima_consulta_investsus": str(p.ultima_consulta_investsus) if p.ultima_consulta_investsus else None,
        "criado_por": p.criado_por,
        "criado_em": p.criado_em.isoformat() if p.criado_em else None,
        "atualizado_em": p.atualizado_em.isoformat() if p.atualizado_em else None,
        "total_alertas_abertos": sum(1 for a in p.alertas_investsus if not a.resolvido) if p.alertas_investsus else 0,
    }


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard(
    db: DbDep,
    user: UserDep,
    municipio_id: int = Query(None),
    exercicio: int = Query(None),
):
    mid = municipio_id or _municipio_id(user)
    stmt = select(PropostaInvestSUS).where(PropostaInvestSUS.municipio_id == mid)
    if exercicio:
        stmt = stmt.where(PropostaInvestSUS.exercicio == exercicio)

    result = await db.execute(stmt)
    props = result.scalars().all()

    total_indicado = sum(p.valor_indicado for p in props)
    total_proposta = sum(p.valor_proposta for p in props)
    total_aprovado = sum(p.valor_aprovado for p in props)
    total_empenhado = sum(p.valor_empenhado for p in props)
    total_pago = sum(p.valor_pago for p in props)
    total_executado = sum(p.valor_executado for p in props)

    por_situacao: dict[str, int] = {}
    por_programa: dict[str, float] = {}
    por_componente: dict[str, float] = {}
    por_tipo: dict[str, float] = {}

    # Alertas
    stmt_alertas = select(func.count(AlertaInvestSUS.id)).where(
        and_(AlertaInvestSUS.municipio_id == mid, AlertaInvestSUS.resolvido == False)
    )
    r_al = await db.execute(stmt_alertas)
    alertas_abertos = r_al.scalar() or 0

    stmt_crit = select(func.count(AlertaInvestSUS.id)).where(
        and_(
            AlertaInvestSUS.municipio_id == mid,
            AlertaInvestSUS.resolvido == False,
            AlertaInvestSUS.nivel == NivelAlertaInvest.CRITICO,
        )
    )
    r_crit = await db.execute(stmt_crit)
    alertas_criticos = r_crit.scalar() or 0

    for p in props:
        sn = p.situacao_normalizada.value if p.situacao_normalizada else "desconhecido"
        por_situacao[sn] = por_situacao.get(sn, 0) + 1

        pnome = (p.programa.nome if p.programa else None) or "Não informado"
        por_programa[pnome] = por_programa.get(pnome, 0) + p.valor_aprovado

        comp = p.componente or "Não informado"
        por_componente[comp] = por_componente.get(comp, 0) + p.valor_aprovado

        te = p.tipo_emenda.value if p.tipo_emenda else "outro"
        por_tipo[te] = por_tipo.get(te, 0) + p.valor_indicado

    return {
        "municipio_id": mid,
        "total_propostas": len(props),
        "total_indicado": total_indicado,
        "total_proposta": total_proposta,
        "total_aprovado": total_aprovado,
        "total_empenhado": total_empenhado,
        "total_pago": total_pago,
        "total_executado": total_executado,
        "saldo_executar": max(0.0, total_pago - total_executado),
        "perc_empenhado": round(100 * total_empenhado / total_indicado, 1) if total_indicado else 0,
        "perc_pago": round(100 * total_pago / total_indicado, 1) if total_indicado else 0,
        "perc_executado": round(100 * total_executado / total_pago, 1) if total_pago else 0,
        "por_situacao": [{"situacao": k, "qtd": v} for k, v in por_situacao.items()],
        "por_programa": [{"programa": k, "valor": v} for k, v in sorted(por_programa.items(), key=lambda x: -x[1])[:10]],
        "por_componente": [{"componente": k, "valor": v} for k, v in por_componente.items()],
        "por_tipo_emenda": [{"tipo": k, "valor": v} for k, v in por_tipo.items()],
        "alertas_abertos": alertas_abertos,
        "alertas_criticos": alertas_criticos,
        "atualizado_em": datetime.utcnow().isoformat(),
    }


# ── Propostas CRUD ────────────────────────────────────────────────────────────

@router.get("/propostas")
async def listar_propostas(
    db: DbDep,
    user: UserDep,
    municipio_id: int = Query(None),
    situacao: str = Query(None),
    exercicio: int = Query(None),
    busca: str = Query(None),
    pagina: int = Query(1, ge=1),
    tamanho: int = Query(50, ge=1, le=200),
):
    mid = municipio_id or _municipio_id(user)
    stmt = (
        select(PropostaInvestSUS)
        .options(
            selectinload(PropostaInvestSUS.parlamentar),
            selectinload(PropostaInvestSUS.programa),
            selectinload(PropostaInvestSUS.alertas_investsus),
        )
        .where(PropostaInvestSUS.municipio_id == mid)
    )
    if situacao:
        stmt = stmt.where(PropostaInvestSUS.situacao_normalizada == situacao)
    if exercicio:
        stmt = stmt.where(PropostaInvestSUS.exercicio == exercicio)
    if busca:
        like = f"%{busca}%"
        stmt = stmt.where(
            or_(
                PropostaInvestSUS.numero_proposta.ilike(like),
                PropostaInvestSUS.numero_emenda.ilike(like),
                PropostaInvestSUS.objeto.ilike(like),
                PropostaInvestSUS.entidade_nome.ilike(like),
            )
        )

    # total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = stmt.order_by(PropostaInvestSUS.exercicio.desc(), PropostaInvestSUS.id.desc())
    stmt = stmt.offset((pagina - 1) * tamanho).limit(tamanho)
    result = await db.execute(stmt)
    props = result.scalars().all()

    return {
        "total": total,
        "pagina": pagina,
        "tamanho": tamanho,
        "propostas": [_prop_dict(p) for p in props],
    }


@router.post("/propostas", status_code=201)
async def criar_proposta(body: PropostaCreate, db: DbDep, user: UserDep):
    mid = _municipio_id(user)
    # Verificar duplicidade
    existe = await db.execute(
        select(PropostaInvestSUS).where(
            and_(
                PropostaInvestSUS.municipio_id == mid,
                PropostaInvestSUS.numero_proposta == body.numero_proposta,
            )
        )
    )
    if existe.scalar_one_or_none():
        raise HTTPException(409, f"Proposta {body.numero_proposta} já cadastrada para este município.")

    data = body.model_dump()
    for campo_data in ("portaria_data", "empenho_data", "prazo_vigencia"):
        val = data.get(campo_data)
        if val:
            try:
                data[campo_data] = date.fromisoformat(val)
            except Exception:
                data[campo_data] = None

    prop = PropostaInvestSUS(
        **{k: v for k, v in data.items() if hasattr(PropostaInvestSUS, k)},
        municipio_id=mid,
        criado_por=user.nome,
        atualizado_por=user.nome,
    )
    db.add(prop)
    await db.flush()

    hist = HistoricoSituacao(
        proposta_id=prop.id,
        situacao_nova=prop.situacao_original or prop.situacao_normalizada.value,
        situacao_norm_nova=prop.situacao_normalizada.value,
        usuario=user.nome,
        origem="manual",
        observacao="Proposta cadastrada",
    )
    db.add(hist)
    await db.commit()
    await db.refresh(prop)
    return {"id": prop.id, "numero_proposta": prop.numero_proposta}


@router.get("/propostas/{proposta_id}")
async def detalhe_proposta(proposta_id: int, db: DbDep, user: UserDep):
    mid = _municipio_id(user)
    stmt = (
        select(PropostaInvestSUS)
        .options(
            selectinload(PropostaInvestSUS.parlamentar),
            selectinload(PropostaInvestSUS.programa),
            selectinload(PropostaInvestSUS.historico),
            selectinload(PropostaInvestSUS.unidades),
            selectinload(PropostaInvestSUS.planos_trabalho).selectinload(PlanoTrabalho.acoes),
            selectinload(PropostaInvestSUS.naturezas_despesa),
            selectinload(PropostaInvestSUS.pareceres),
            selectinload(PropostaInvestSUS.pagamentos_investsus),
            selectinload(PropostaInvestSUS.alertas_investsus),
            selectinload(PropostaInvestSUS.documentos_investsus),
            selectinload(PropostaInvestSUS.atualizacoes),
        )
        .where(
            and_(PropostaInvestSUS.id == proposta_id, PropostaInvestSUS.municipio_id == mid)
        )
    )
    result = await db.execute(stmt)
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(404, "Proposta não encontrada")

    d = _prop_dict(prop)
    d["historico"] = [
        {
            "id": h.id, "situacao_anterior": h.situacao_anterior,
            "situacao_nova": h.situacao_nova, "situacao_norm_anterior": h.situacao_norm_anterior,
            "situacao_norm_nova": h.situacao_norm_nova,
            "data_evento": h.data_evento.isoformat(), "usuario": h.usuario,
            "origem": h.origem, "observacao": h.observacao,
        }
        for h in prop.historico
    ]
    d["unidades"] = [
        {
            "id": u.id, "cnes": u.cnes, "nome_estabelecimento": u.nome_estabelecimento,
            "municipio": u.municipio, "tipo_estabelecimento": u.tipo_estabelecimento,
            "esfera_gestao": u.esfera_gestao, "situacao_cnes": u.situacao_cnes,
            "valor_destinado": u.valor_destinado, "objeto_destinado": u.objeto_destinado,
        }
        for u in prop.unidades
    ]
    d["planos_trabalho"] = [
        {
            "id": pt.id, "versao": pt.versao, "valor_indicado": pt.valor_indicado,
            "objeto": pt.objeto, "situacao": pt.situacao,
            "data_elaboracao": str(pt.data_elaboracao) if pt.data_elaboracao else None,
            "data_envio": str(pt.data_envio) if pt.data_envio else None,
            "data_aprovacao": str(pt.data_aprovacao) if pt.data_aprovacao else None,
            "responsavel": pt.responsavel,
            "acoes": [
                {
                    "id": a.id, "categoria": a.categoria, "descricao": a.descricao,
                    "tipo": a.tipo, "meta_quantitativa": a.meta_quantitativa,
                    "unidade_medida": a.unidade_medida, "valor": a.valor,
                    "situacao_execucao": a.situacao_execucao,
                    "resultado_alcancado": a.resultado_alcancado,
                }
                for a in pt.acoes
            ],
        }
        for pt in prop.planos_trabalho
    ]
    d["naturezas_despesa"] = [
        {
            "id": nd.id, "codigo": nd.codigo, "descricao": nd.descricao,
            "categoria_economica": nd.categoria_economica, "grupo": nd.grupo,
            "valor_previsto": nd.valor_previsto, "valor_contratado": nd.valor_contratado,
            "valor_empenhado_municipio": nd.valor_empenhado_municipio,
            "valor_liquidado": nd.valor_liquidado, "valor_pago": nd.valor_pago,
            "saldo": nd.saldo,
        }
        for nd in prop.naturezas_despesa
    ]
    d["pareceres"] = [
        {
            "id": pa.id, "area_responsavel": pa.area_responsavel, "sigla_area": pa.sigla_area,
            "data_parecer": str(pa.data_parecer) if pa.data_parecer else None,
            "tipo": pa.tipo.value if pa.tipo else None,
            "resultado": pa.resultado.value if pa.resultado else None,
            "texto": pa.texto, "numero_parecer": pa.numero_parecer,
            "eh_diligencia": pa.eh_diligencia,
            "prazo_resposta": str(pa.prazo_resposta) if pa.prazo_resposta else None,
            "data_resposta": str(pa.data_resposta) if pa.data_resposta else None,
            "situacao_resposta": pa.situacao_resposta,
            "criado_em": pa.criado_em.isoformat(),
        }
        for pa in prop.pareceres
    ]
    d["pagamentos"] = [
        {
            "id": pg.id, "ordem_bancaria": pg.ordem_bancaria,
            "data_pagamento": str(pg.data_pagamento) if pg.data_pagamento else None,
            "valor": pg.valor, "parcela": pg.parcela,
            "conta_bancaria": pg.conta_bancaria, "situacao": pg.situacao,
        }
        for pg in prop.pagamentos_investsus
    ]
    d["alertas"] = [
        {
            "id": al.id, "tipo_alerta": al.tipo_alerta,
            "nivel": al.nivel.value if al.nivel else None,
            "titulo": al.titulo, "descricao": al.descricao,
            "providencia": al.providencia,
            "prazo": str(al.prazo) if al.prazo else None,
            "responsavel": al.responsavel, "resolvido": al.resolvido,
            "criado_em": al.criado_em.isoformat(),
        }
        for al in prop.alertas_investsus
    ]
    d["documentos"] = [
        {
            "id": dc.id, "nome": dc.nome, "tipo": dc.tipo,
            "enviado_por": dc.enviado_por, "criado_em": dc.criado_em.isoformat(),
        }
        for dc in prop.documentos_investsus
    ]
    d["atualizacoes"] = [
        {
            "id": at.id, "data_consulta": str(at.data_consulta),
            "situacao_encontrada": at.situacao_encontrada,
            "situacao_anterior": at.situacao_anterior,
            "observacoes": at.observacoes, "responsavel": at.responsavel,
            "origem": at.origem.value if at.origem else "manual",
            "criado_em": at.criado_em.isoformat(),
        }
        for at in prop.atualizacoes
    ]
    # Verificações de consistência
    d["verificacoes"] = _verificar_consistencia(prop)

    return d


def _verificar_consistencia(p: PropostaInvestSUS) -> list[dict]:
    issues = []
    # DigiSUS
    if not p.digisus_diretriz:
        issues.append({"tipo": "digisus", "nivel": "atencao", "msg": "Sem vinculação à diretriz do DigiSUS/PAS"})
    # Unidades vs total
    if p.unidades:
        total_u = sum(u.valor_destinado for u in p.unidades)
        if p.valor_aprovado > 0 and abs(total_u - p.valor_aprovado) > 1:
            issues.append({"tipo": "valores", "nivel": "atencao",
                           "msg": f"Soma das unidades (R$ {total_u:,.2f}) difere do valor aprovado (R$ {p.valor_aprovado:,.2f})"})
    # Naturezas vs aprovado
    if p.naturezas_despesa:
        total_nd = sum(nd.valor_previsto for nd in p.naturezas_despesa)
        if p.valor_aprovado > 0 and abs(total_nd - p.valor_aprovado) > 1:
            issues.append({"tipo": "valores", "nivel": "atencao",
                           "msg": f"Soma das naturezas de despesa difere do valor aprovado"})
    return issues


@router.put("/propostas/{proposta_id}")
async def atualizar_proposta(proposta_id: int, body: PropostaUpdate, db: DbDep, user: UserDep):
    mid = _municipio_id(user)
    result = await db.execute(
        select(PropostaInvestSUS).where(
            and_(PropostaInvestSUS.id == proposta_id, PropostaInvestSUS.municipio_id == mid)
        )
    )
    prop = result.scalar_one_or_none()
    if not prop:
        raise HTTPException(404, "Proposta não encontrada")

    sit_anterior = prop.situacao_normalizada.value if prop.situacao_normalizada else None
    dados = body.model_dump(exclude_unset=True)

    for campo_data in ("portaria_data", "empenho_data", "prazo_vigencia", "digisus_verificado_em"):
        if campo_data in dados and dados[campo_data]:
            try:
                dados[campo_data] = date.fromisoformat(dados[campo_data])
            except Exception:
                dados[campo_data] = None

    sit_nova = dados.get("situacao_normalizada")
    for k, v in dados.items():
        setattr(prop, k, v)
    prop.atualizado_por = user.nome

    if sit_nova and sit_nova != sit_anterior:
        hist = HistoricoSituacao(
            proposta_id=prop.id,
            situacao_anterior=sit_anterior,
            situacao_nova=sit_nova,
            situacao_norm_anterior=sit_anterior,
            situacao_norm_nova=sit_nova,
            usuario=user.nome,
            origem="manual",
        )
        db.add(hist)

    await db.commit()
    return {"ok": True}


# ── Pareceres ─────────────────────────────────────────────────────────────────

@router.post("/propostas/{proposta_id}/pareceres", status_code=201)
async def adicionar_parecer(proposta_id: int, body: PareceCreate, db: DbDep, user: UserDep):
    mid = _municipio_id(user)
    r = await db.execute(
        select(PropostaInvestSUS).where(
            and_(PropostaInvestSUS.id == proposta_id, PropostaInvestSUS.municipio_id == mid)
        )
    )
    prop = r.scalar_one_or_none()
    if not prop:
        raise HTTPException(404, "Proposta não encontrada")

    dados = body.model_dump()
    for campo_data in ("data_parecer", "prazo_resposta"):
        if dados.get(campo_data):
            try:
                dados[campo_data] = date.fromisoformat(dados[campo_data])
            except Exception:
                dados[campo_data] = None

    pa = Parecer(proposta_id=proposta_id, **dados)
    db.add(pa)

    # Atualizar situação se diligência
    if body.eh_diligencia:
        prop.situacao_normalizada = SituacaoNormalizada.EM_DILIGENCIA
        db.add(HistoricoSituacao(
            proposta_id=prop.id,
            situacao_anterior=prop.situacao_original,
            situacao_nova="Em diligência",
            situacao_norm_nova=SituacaoNormalizada.EM_DILIGENCIA.value,
            usuario=user.nome, origem="manual",
        ))
    elif body.resultado == "favoravel":
        prop.situacao_normalizada = SituacaoNormalizada.APROVADA
        db.add(HistoricoSituacao(
            proposta_id=prop.id,
            situacao_nova="Aprovada — parecer favorável",
            situacao_norm_nova=SituacaoNormalizada.APROVADA.value,
            usuario=user.nome, origem="manual",
        ))

    await db.commit()
    return {"id": pa.id}


# ── Pagamentos ────────────────────────────────────────────────────────────────

@router.post("/propostas/{proposta_id}/pagamentos", status_code=201)
async def adicionar_pagamento(proposta_id: int, body: PagamentoCreate, db: DbDep, user: UserDep):
    mid = _municipio_id(user)
    r = await db.execute(
        select(PropostaInvestSUS).where(
            and_(PropostaInvestSUS.id == proposta_id, PropostaInvestSUS.municipio_id == mid)
        )
    )
    prop = r.scalar_one_or_none()
    if not prop:
        raise HTTPException(404)

    dados = body.model_dump()
    if dados.get("data_pagamento"):
        try:
            dados["data_pagamento"] = date.fromisoformat(dados["data_pagamento"])
        except Exception:
            dados["data_pagamento"] = None

    pg = PagamentoInvestSUS(proposta_id=proposta_id, **dados)
    db.add(pg)

    # Atualizar valor_pago da proposta
    prop.valor_pago = prop.valor_pago + body.valor
    prop.atualizado_por = user.nome

    await db.commit()
    return {"id": pg.id, "novo_valor_pago": prop.valor_pago}


# ── Atualização manual InvestSUS ─────────────────────────────────────────────

@router.post("/propostas/{proposta_id}/atualizacoes", status_code=201)
async def registrar_atualizacao(proposta_id: int, body: AtualizacaoCreate, db: DbDep, user: UserDep):
    mid = _municipio_id(user)
    r = await db.execute(
        select(PropostaInvestSUS).where(
            and_(PropostaInvestSUS.id == proposta_id, PropostaInvestSUS.municipio_id == mid)
        )
    )
    prop = r.scalar_one_or_none()
    if not prop:
        raise HTTPException(404)

    at = AtualizacaoManual(
        proposta_id=proposta_id,
        data_consulta=date.fromisoformat(body.data_consulta),
        situacao_anterior=prop.situacao_original,
        situacao_encontrada=body.situacao_encontrada,
        observacoes=body.observacoes,
        responsavel=user.nome,
        origem=body.origem,
    )
    db.add(at)

    prop.ultima_consulta_investsus = date.fromisoformat(body.data_consulta)
    prop.atualizado_por = user.nome

    if body.situacao_encontrada and body.situacao_encontrada != prop.situacao_original:
        db.add(HistoricoSituacao(
            proposta_id=prop.id,
            situacao_anterior=prop.situacao_original,
            situacao_nova=body.situacao_encontrada,
            usuario=user.nome,
            origem="manual",
            observacao=body.observacoes,
        ))
        prop.situacao_original = body.situacao_encontrada

    await db.commit()
    return {"id": at.id}


# ── Unidades beneficiadas ─────────────────────────────────────────────────────

@router.post("/propostas/{proposta_id}/unidades", status_code=201)
async def adicionar_unidade(proposta_id: int, body: UnidadeCreate, db: DbDep, user: UserDep):
    mid = _municipio_id(user)
    r = await db.execute(
        select(PropostaInvestSUS).where(
            and_(PropostaInvestSUS.id == proposta_id, PropostaInvestSUS.municipio_id == mid)
        )
    )
    if not r.scalar_one_or_none():
        raise HTTPException(404)
    u = UnidadeBeneficiada(proposta_id=proposta_id, **body.model_dump())
    db.add(u)
    await db.commit()
    return {"id": u.id}


# ── Naturezas de despesa ──────────────────────────────────────────────────────

@router.post("/propostas/{proposta_id}/naturezas", status_code=201)
async def adicionar_natureza(proposta_id: int, body: NaturezaCreate, db: DbDep, user: UserDep):
    mid = _municipio_id(user)
    r = await db.execute(
        select(PropostaInvestSUS).where(
            and_(PropostaInvestSUS.id == proposta_id, PropostaInvestSUS.municipio_id == mid)
        )
    )
    if not r.scalar_one_or_none():
        raise HTTPException(404)
    nd = NaturezaDespesa(proposta_id=proposta_id, **body.model_dump())
    db.add(nd)
    await db.commit()
    return {"id": nd.id}


# ── Alertas InvestSUS ─────────────────────────────────────────────────────────

@router.get("/alertas")
async def listar_alertas(
    db: DbDep,
    user: UserDep,
    municipio_id: int = Query(None),
    apenas_abertos: bool = Query(True),
    nivel: str = Query(None),
):
    mid = municipio_id or _municipio_id(user)
    stmt = (
        select(AlertaInvestSUS)
        .where(AlertaInvestSUS.municipio_id == mid)
        .order_by(AlertaInvestSUS.criado_em.desc())
    )
    if apenas_abertos:
        stmt = stmt.where(AlertaInvestSUS.resolvido == False)
    if nivel:
        stmt = stmt.where(AlertaInvestSUS.nivel == nivel)

    result = await db.execute(stmt)
    alertas = result.scalars().all()
    return [
        {
            "id": al.id, "proposta_id": al.proposta_id,
            "tipo_alerta": al.tipo_alerta, "nivel": al.nivel.value,
            "titulo": al.titulo, "descricao": al.descricao,
            "providencia": al.providencia,
            "prazo": str(al.prazo) if al.prazo else None,
            "responsavel": al.responsavel, "resolvido": al.resolvido,
            "criado_em": al.criado_em.isoformat(),
        }
        for al in alertas
    ]


@router.post("/alertas/{alerta_id}/resolver")
async def resolver_alerta(alerta_id: int, body: AlertaResolverBody, db: DbDep, user: UserDep):
    r = await db.execute(select(AlertaInvestSUS).where(AlertaInvestSUS.id == alerta_id))
    al = r.scalar_one_or_none()
    if not al:
        raise HTTPException(404)
    al.resolvido = True
    al.resolvido_em = datetime.utcnow()
    al.resolvido_por = user.nome
    await db.commit()
    return {"ok": True}


# ── Parlamentares ─────────────────────────────────────────────────────────────

@router.get("/parlamentares")
async def listar_parlamentares(db: DbDep, user: UserDep):
    r = await db.execute(select(Parlamentar).where(Parlamentar.ativo == True).order_by(Parlamentar.nome))
    return [{"id": p.id, "nome": p.nome, "partido": p.partido, "uf": p.uf, "cargo": p.cargo} for p in r.scalars().all()]


@router.post("/parlamentares", status_code=201)
async def criar_parlamentar(body: dict = Body(...), db: DbDep = None, user: UserDep = None):
    p = Parlamentar(**{k: v for k, v in body.items() if hasattr(Parlamentar, k)})
    db.add(p)
    await db.commit()
    return {"id": p.id}


# ── Programas ─────────────────────────────────────────────────────────────────

@router.get("/programas")
async def listar_programas(db: DbDep, user: UserDep):
    r = await db.execute(select(ProgramaInvestSUS).where(ProgramaInvestSUS.ativo == True).order_by(ProgramaInvestSUS.nome))
    return [{"id": p.id, "nome": p.nome, "codigo": p.codigo, "bloco": p.bloco, "tipo_financiamento": p.tipo_financiamento} for p in r.scalars().all()]


@router.post("/programas", status_code=201)
async def criar_programa(body: dict = Body(...), db: DbDep = None, user: UserDep = None):
    p = ProgramaInvestSUS(**{k: v for k, v in body.items() if hasattr(ProgramaInvestSUS, k)})
    db.add(p)
    await db.commit()
    return {"id": p.id}


# ── Importação assistida ──────────────────────────────────────────────────────

@router.post("/importar/preview")
async def importar_preview(
    payload: list[dict] = Body(...),
    db: DbDep = None,
    user: UserDep = None,
):
    """Recebe lista de dicts (CSV parse no frontend), retorna preview com validações."""
    mid = _municipio_id(user)
    preview = []
    for row in payload[:200]:  # limita preview a 200 linhas
        numero = row.get("numero_proposta") or row.get("PROPOSTA") or row.get("Proposta") or ""
        # Verificar se já existe
        existe = None
        if numero:
            r = await db.execute(
                select(PropostaInvestSUS.id).where(
                    and_(
                        PropostaInvestSUS.municipio_id == mid,
                        PropostaInvestSUS.numero_proposta == numero,
                    )
                )
            )
            existe = r.scalar_one_or_none()

        preview.append({
            "numero_proposta": numero,
            "objeto": row.get("objeto") or row.get("OBJETO") or row.get("Objeto") or "",
            "valor_indicado": _parse_float(row.get("valor_indicado") or row.get("VALOR") or 0),
            "situacao_original": row.get("situacao") or row.get("SITUACAO") or row.get("Situação") or "",
            "ja_existe": bool(existe),
            "proposta_id_existente": existe,
            "_row_original": row,
        })
    return {"total": len(preview), "preview": preview}


@router.post("/importar/confirmar")
async def importar_confirmar(
    payload: list[dict] = Body(...),
    db: DbDep = None,
    user: UserDep = None,
):
    """Importa registros confirmados pelo usuário."""
    mid = _municipio_id(user)
    criados = 0
    atualizados = 0
    erros = []

    for row in payload:
        try:
            numero = row.get("numero_proposta", "")
            if not numero:
                continue

            r = await db.execute(
                select(PropostaInvestSUS).where(
                    and_(PropostaInvestSUS.municipio_id == mid, PropostaInvestSUS.numero_proposta == numero)
                )
            )
            prop = r.scalar_one_or_none()

            if prop and not row.get("sobrescrever", False):
                continue  # pula se já existe e não foi marcado para sobrescrever

            campos = {
                "numero_proposta": numero,
                "objeto": row.get("objeto") or "",
                "valor_indicado": _parse_float(row.get("valor_indicado", 0)),
                "valor_aprovado": _parse_float(row.get("valor_aprovado", 0)),
                "valor_empenhado": _parse_float(row.get("valor_empenhado", 0)),
                "valor_pago": _parse_float(row.get("valor_pago", 0)),
                "situacao_original": row.get("situacao_original") or "",
                "entidade_nome": row.get("entidade_nome") or "",
                "exercicio": _parse_int(row.get("exercicio")),
                "numero_emenda": row.get("numero_emenda"),
                "fonte_dado": "importacao_csv",
            }

            if prop:
                for k, v in campos.items():
                    if v is not None:
                        setattr(prop, k, v)
                prop.atualizado_por = user.nome
                atualizados += 1
            else:
                prop = PropostaInvestSUS(municipio_id=mid, criado_por=user.nome, atualizado_por=user.nome, **campos)
                db.add(prop)
                await db.flush()
                db.add(HistoricoSituacao(
                    proposta_id=prop.id, situacao_nova=campos["situacao_original"] or "importada",
                    usuario=user.nome, origem="importacao_csv",
                ))
                criados += 1
        except Exception as e:
            erros.append({"numero": row.get("numero_proposta"), "erro": str(e)})

    await db.commit()
    return {"criados": criados, "atualizados": atualizados, "erros": erros}


# ── Plano de Trabalho ─────────────────────────────────────────────────────────

class PlanoCreate(BaseModel):
    versao: str | None = "1"
    objeto: str | None = None
    valor_indicado: float = 0.0
    data_elaboracao: str | None = None
    data_envio: str | None = None
    data_aprovacao: str | None = None
    responsavel: str | None = None
    situacao: str | None = "elaboracao"
    observacoes: str | None = None


class AcaoCreate(BaseModel):
    categoria: str | None = None
    descricao: str | None = None
    tipo: str | None = None
    meta_quantitativa: float | None = None
    unidade_medida: str | None = None
    valor: float = 0.0
    situacao_execucao: str | None = "nao_iniciada"


@router.post("/propostas/{proposta_id}/planos", status_code=201)
async def adicionar_plano(proposta_id: int, body: PlanoCreate, db: DbDep, user: UserDep):
    mid = _municipio_id(user)
    r = await db.execute(
        select(PropostaInvestSUS).where(
            and_(PropostaInvestSUS.id == proposta_id, PropostaInvestSUS.municipio_id == mid)
        )
    )
    if not r.scalar_one_or_none():
        raise HTTPException(404)
    dados = body.model_dump()
    for campo_data in ("data_elaboracao", "data_envio", "data_aprovacao"):
        if dados.get(campo_data):
            try:
                dados[campo_data] = date.fromisoformat(dados[campo_data])
            except Exception:
                dados[campo_data] = None
    pt = PlanoTrabalho(proposta_id=proposta_id, **dados)
    db.add(pt)
    await db.commit()
    await db.refresh(pt)
    return {"id": pt.id}


@router.post("/planos/{plano_id}/acoes", status_code=201)
async def adicionar_acao(plano_id: int, body: AcaoCreate, db: DbDep, user: UserDep):
    r = await db.execute(select(PlanoTrabalho).where(PlanoTrabalho.id == plano_id))
    if not r.scalar_one_or_none():
        raise HTTPException(404)
    ac = AcaoServico(plano_id=plano_id, **body.model_dump())
    db.add(ac)
    await db.commit()
    return {"id": ac.id}


# ── Relatório de acompanhamento ───────────────────────────────────────────────

@router.get("/relatorio")
async def relatorio_acompanhamento(
    db: DbDep,
    user: UserDep,
    municipio_id: int = Query(None),
    exercicio: int = Query(None),
    situacao: str = Query(None),
):
    """Retorna dados estruturados para exportação (relatório consolidado)."""
    mid = municipio_id or _municipio_id(user)
    stmt = (
        select(PropostaInvestSUS)
        .options(
            selectinload(PropostaInvestSUS.parlamentar),
            selectinload(PropostaInvestSUS.programa),
            selectinload(PropostaInvestSUS.naturezas_despesa),
            selectinload(PropostaInvestSUS.pareceres),
            selectinload(PropostaInvestSUS.pagamentos_investsus),
            selectinload(PropostaInvestSUS.alertas_investsus),
        )
        .where(PropostaInvestSUS.municipio_id == mid)
    )
    if exercicio:
        stmt = stmt.where(PropostaInvestSUS.exercicio == exercicio)
    if situacao:
        stmt = stmt.where(PropostaInvestSUS.situacao_normalizada == situacao)

    result = await db.execute(stmt)
    props = result.scalars().all()

    linhas = []
    for p in props:
        linhas.append({
            "numero_proposta": p.numero_proposta,
            "numero_emenda": p.numero_emenda,
            "exercicio": p.exercicio,
            "parlamentar": p.parlamentar.nome if p.parlamentar else "",
            "partido_uf": f"{p.parlamentar.partido}/{p.parlamentar.uf}" if p.parlamentar else "",
            "programa": p.programa.nome if p.programa else "",
            "componente": p.componente or "",
            "tipo_financiamento": p.tipo_financiamento or "",
            "entidade": p.entidade_nome or "",
            "cnpj": p.entidade_cnpj or "",
            "objeto": (p.objeto or "")[:200],
            "situacao_original": p.situacao_original or "",
            "situacao_normalizada": p.situacao_normalizada.value if p.situacao_normalizada else "",
            "valor_indicado": p.valor_indicado,
            "valor_aprovado": p.valor_aprovado,
            "valor_empenhado": p.valor_empenhado,
            "valor_pago": p.valor_pago,
            "valor_executado": p.valor_executado,
            "saldo_bancario": p.saldo_bancario,
            "perc_fisico": p.perc_fisico or 0,
            "perc_financeiro": p.perc_financeiro or 0,
            "portaria_numero": p.portaria_numero or "",
            "empenho_numero": p.empenho_numero or "",
            "prazo_vigencia": str(p.prazo_vigencia) if p.prazo_vigencia else "",
            "ultima_consulta": str(p.ultima_consulta_investsus) if p.ultima_consulta_investsus else "",
            "total_pareceres": len(p.pareceres),
            "alertas_abertos": sum(1 for a in p.alertas_investsus if not a.resolvido),
            "responsavel_interno": p.responsavel_interno or "",
        })

    totais = {
        "total_propostas": len(props),
        "total_indicado": sum(p.valor_indicado for p in props),
        "total_aprovado": sum(p.valor_aprovado for p in props),
        "total_empenhado": sum(p.valor_empenhado for p in props),
        "total_pago": sum(p.valor_pago for p in props),
        "total_executado": sum(p.valor_executado for p in props),
    }

    return {"linhas": linhas, "totais": totais, "municipio_id": mid, "exercicio": exercicio}


def _parse_float(v: Any) -> float:
    if v is None:
        return 0.0
    try:
        return float(str(v).replace("R$", "").replace(".", "").replace(",", ".").strip())
    except Exception:
        return 0.0


def _parse_int(v: Any) -> int | None:
    if v is None:
        return None
    try:
        return int(str(v).strip())
    except Exception:
        return None


# ── Seed InvestSUS (dados do exemplo real de Apuí) ───────────────────────────

@router.post("/seed-exemplo-apui", include_in_schema=False)
async def seed_exemplo_apui(db: DbDep, user: UserDep):
    """
    Insere o exemplo real de Apuí para validação.
    Endpoint restrito — apenas superadmin.
    """
    if user.role not in ("superadmin", "admin"):
        raise HTTPException(403, "Acesso restrito")

    mid = _municipio_id(user)

    # Verificar se já existe
    r = await db.execute(
        select(PropostaInvestSUS.id).where(
            and_(
                PropostaInvestSUS.municipio_id == mid,
                PropostaInvestSUS.numero_proposta == "36000820396202600",
            )
        )
    )
    if r.scalar_one_or_none():
        return {"ok": True, "mensagem": "Exemplo já cadastrado"}

    # Programa
    prog_stmt = await db.execute(
        select(ProgramaInvestSUS).where(ProgramaInvestSUS.nome.ilike("%Incremento ao Custeio%Especializada%"))
    )
    prog = prog_stmt.scalar_one_or_none()
    if not prog:
        prog = ProgramaInvestSUS(
            nome="Incremento ao Custeio de Serviços da Atenção Especializada à Saúde",
            bloco="MAC",
            tipo_financiamento="custeio",
        )
        db.add(prog)
        await db.flush()

    # Proposta
    prop = PropostaInvestSUS(
        municipio_id=mid,
        numero_proposta="36000820396202600",
        exercicio=2026,
        programa_id=prog.id,
        tipo_emenda=TipoEmenda.INDIVIDUAL,
        entidade_nome="Secretaria Municipal de Saúde de Apuí",
        entidade_municipio="Apuí",
        entidade_uf="AM",
        fundo_saude="Fundo Municipal de Saúde de Apuí",
        entidade_cnpj="12.834.320/0001-26",
        valor_indicado=100000.0,
        valor_proposta=100000.0,
        valor_aprovado=100000.0,
        valor_empenhado=100000.0,
        valor_pago=0.0,
        objeto="Incremento ao custeio de serviços da atenção especializada à saúde",
        componente="MAC",
        tipo_financiamento="custeio",
        situacao_original="Proposta Empenhada aguardando Formalização",
        situacao_normalizada=SituacaoNormalizada.EMPENHADA_AGUARDANDO_FORMALIZACAO,
        responsavel_interno="Euler Ramos",
        fonte_dado="manual",
        criado_por=user.nome,
        atualizado_por=user.nome,
    )
    db.add(prop)
    await db.flush()

    # Unidade beneficiada
    unidade = UnidadeBeneficiada(
        proposta_id=prop.id,
        cnes="6820662",
        nome_estabelecimento="Secretaria Municipal de Saúde de Apuí",
        municipio="Apuí",
        esfera_gestao="Municipal",
        valor_destinado=100000.0,
        objeto_destinado="Incremento ao custeio especializado",
    )
    db.add(unidade)
    await db.flush()

    # Natureza de despesa
    nd = NaturezaDespesa(
        proposta_id=prop.id,
        codigo="339030",
        descricao="Material de Consumo",
        categoria_economica="Despesas Correntes",
        grupo="Outras Despesas Correntes",
        valor_previsto=100000.0,
    )
    db.add(nd)

    # Pareceres (exemplo real: diligência 30/07 + favorável 31/07)
    p1 = Parecer(
        proposta_id=prop.id,
        area_responsavel="CGOF/DRAC - Coordenação-Geral de Gestão Orçamentária e Financeira",
        sigla_area="CGOF/DRAC",
        data_parecer=date(2026, 7, 30),
        tipo=TipoParecer.MERITO,
        resultado=ResultadoParecer.DILIGENCIA,
        texto="Apresentar justificativa",
        eh_diligencia=True,
    )
    db.add(p1)

    p2 = Parecer(
        proposta_id=prop.id,
        area_responsavel="CGOF/DRAC - Coordenação-Geral de Gestão Orçamentária e Financeira",
        sigla_area="CGOF/DRAC",
        data_parecer=date(2026, 7, 31),
        tipo=TipoParecer.MERITO,
        resultado=ResultadoParecer.FAVORAVEL,
        texto="Parecer de Mérito — Favorável",
        eh_diligencia=False,
    )
    db.add(p2)

    # Histórico
    db.add(HistoricoSituacao(
        proposta_id=prop.id, situacao_nova="Proposta cadastrada",
        situacao_norm_nova=SituacaoNormalizada.PROPOSTA_CADASTRADA.value,
        usuario=user.nome, origem="manual",
    ))
    db.add(HistoricoSituacao(
        proposta_id=prop.id, situacao_anterior="Proposta cadastrada",
        situacao_nova="Em diligência", situacao_norm_nova=SituacaoNormalizada.EM_DILIGENCIA.value,
        data_evento=datetime(2026, 7, 30), usuario=user.nome, origem="manual",
    ))
    db.add(HistoricoSituacao(
        proposta_id=prop.id, situacao_anterior="Em diligência",
        situacao_nova="Proposta Empenhada aguardando Formalização",
        situacao_norm_nova=SituacaoNormalizada.EMPENHADA_AGUARDANDO_FORMALIZACAO.value,
        data_evento=datetime(2026, 7, 31), usuario=user.nome, origem="manual",
    ))

    # Alerta automático para formalização
    db.add(AlertaInvestSUS(
        proposta_id=prop.id, municipio_id=mid,
        tipo_alerta="formalização_pendente",
        nivel=NivelAlertaInvest.URGENTE,
        titulo="Proposta empenhada aguarda formalização",
        descricao="Proposta 36000820396202600 foi empenhada mas ainda não foi formalizada.",
        providencia="Acompanhar publicação da portaria e assinatura do instrumento de formalização.",
        responsavel="Euler Ramos",
    ))

    await db.commit()
    return {"ok": True, "proposta_id": prop.id, "numero": "36000820396202600"}


# ── Sincronização real com InvestSUS ──────────────────────────────────────────
# ── Job store em memória para sincronização assíncrona ────────────────────────
import asyncio as _asyncio
import uuid as _uuid
_sync_jobs: dict = {}   # job_id → {status, resultado, erro}


async def _executar_sync_job(job_id: str, mid: int) -> None:
    """Roda sincronização em background e armazena resultado em _sync_jobs."""
    from services.investsus_scraper import sincronizar_investsus
    from database import AsyncSessionLocal

    _sync_jobs[job_id]["status"] = "rodando"
    try:
        dados = await sincronizar_investsus()
    except Exception as exc:
        _sync_jobs[job_id].update({"status": "erro", "erro": str(exc)})
        return

    criadas = atualizadas = 0
    async with AsyncSessionLocal() as db:
        for prop_raw in dados.get("propostas", []):
            numero = prop_raw.get("numero_proposta", "")
            if not numero:
                continue
            res = await db.execute(
                select(PropostaInvestSUS).where(
                    PropostaInvestSUS.municipio_id == mid,
                    PropostaInvestSUS.numero_proposta == numero,
                )
            )
            existing = res.scalar_one_or_none()
            situacao_raw = prop_raw.get("situacao_raw", "")
            situacao_norm = None
            for s in SituacaoNormalizada:
                if s.value.lower() in situacao_raw.lower() or situacao_raw.lower() in s.value.lower():
                    situacao_norm = s
                    break

            if existing:
                old_sit = existing.situacao_normalizada
                if prop_raw.get("valor_aprovado"):
                    existing.valor_aprovado = prop_raw["valor_aprovado"]
                if prop_raw.get("valor_repassado"):
                    existing.valor_pago = prop_raw["valor_repassado"]
                if prop_raw.get("valor_executado"):
                    existing.valor_executado = prop_raw["valor_executado"]
                existing.situacao_original = prop_raw.get("situacao_raw") or existing.situacao_original
                if situacao_norm and situacao_norm != old_sit:
                    existing.situacao_normalizada = situacao_norm
                    db.add(HistoricoSituacao(
                        proposta_id=existing.id,
                        situacao_anterior=old_sit.value if old_sit else None,
                        situacao_nova=situacao_norm.value,
                        origem="sincronizacao_automatica",
                        observacao=f"Atualizado via sincronização em {dados['sincronizado_em']}",
                    ))
                atualizadas += 1
            else:
                nova = PropostaInvestSUS(
                    municipio_id=mid,
                    numero_proposta=numero,
                    numero_instrumento=prop_raw.get("numero_instrumento") or "",
                    objeto=prop_raw.get("objeto") or "",
                    tipo_emenda=TipoEmenda.INDIVIDUAL,
                    valor_indicado=prop_raw.get("valor_global", 0),
                    valor_proposta=prop_raw.get("valor_global", 0),
                    valor_aprovado=prop_raw.get("valor_aprovado", 0),
                    valor_pago=prop_raw.get("valor_repassado", 0),
                    valor_executado=prop_raw.get("valor_executado", 0),
                    situacao_original=prop_raw.get("situacao_raw") or "",
                    situacao_normalizada=situacao_norm or SituacaoNormalizada.PROPOSTA_EM_ANALISE,
                    exercicio=prop_raw.get("exercicio", 2024),
                    entidade_cnpj=prop_raw.get("cnpj_proponente") or "12.834.320/0001-26",
                )
                db.add(nova)
                await db.flush()
                db.add(HistoricoSituacao(
                    proposta_id=nova.id,
                    situacao_anterior=None,
                    situacao_nova=(situacao_norm or SituacaoNormalizada.PROPOSTA_EM_ANALISE).value,
                    origem="sincronizacao_automatica",
                    observacao=f"Importado via sincronização em {dados['sincronizado_em']}",
                ))
                criadas += 1
        await db.commit()

    _sync_jobs[job_id].update({
        "status": "concluido",
        "resultado": {
            "ok": True,
            "sincronizado_em": dados["sincronizado_em"],
            "propostas_encontradas": len(dados["propostas"]),
            "criadas": criadas,
            "atualizadas": atualizadas,
            "repasses": len(dados.get("repasses", [])),
            "erros": dados.get("erros", []),
        },
    })


@router.post("/sincronizar")
async def sincronizar_com_investsus(user: UserDep):
    """
    Inicia sincronização em background e retorna job_id imediatamente.
    Use GET /api/investsus/sincronizar/{job_id} para verificar o status.
    """
    if user.role not in ("superadmin", "admin", "gestor", "financeiro"):
        raise HTTPException(403, "Acesso restrito")

    import os
    if not os.getenv("TRANSPARENCIA_API_KEY"):
        raise HTTPException(400, detail={
            "erro": "TRANSPARENCIA_API_KEY não configurada",
            "instrucao": "Adicione TRANSPARENCIA_API_KEY nas variáveis de ambiente do Railway.",
        })

    mid = _municipio_id(user)
    job_id = str(_uuid.uuid4())
    _sync_jobs[job_id] = {"status": "iniciado", "resultado": None, "erro": None}
    _asyncio.create_task(_executar_sync_job(job_id, mid))
    return {"job_id": job_id, "status": "iniciado"}


@router.get("/sincronizar/{job_id}")
async def status_sync_job(job_id: str, user: UserDep):
    """Retorna status do job de sincronização."""
    if user.role not in ("superadmin", "admin", "gestor", "financeiro"):
        raise HTTPException(403, "Acesso restrito")
    job = _sync_jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job não encontrado")
    return job


@router.get("/config-chave")
async def get_transparencia_key(user: UserDep):
    """Retorna a chave da API do Portal da Transparência para uso no browser."""
    if user.role not in ("superadmin", "admin", "gestor", "financeiro"):
        raise HTTPException(403, "Acesso restrito")
    import os
    key = os.getenv("TRANSPARENCIA_API_KEY", "")
    if not key:
        raise HTTPException(400, detail={"erro": "TRANSPARENCIA_API_KEY não configurada no Railway."})
    return {"chave": key}


@router.post("/sincronizar-dados")
async def salvar_dados_sincronizados(payload: dict, db: DbDep, user: UserDep):
    """
    Recebe dados já buscados pelo browser diretamente no Portal da Transparência
    e os salva no banco. Usado quando o Railway não consegue alcançar .gov.br.
    payload: { propostas: [...], repasses: [...], sincronizado_em: str }
    """
    if user.role not in ("superadmin", "admin", "gestor", "financeiro"):
        raise HTTPException(403, "Acesso restrito")

    mid = _municipio_id(user)
    criadas = atualizadas = 0

    for prop_raw in payload.get("propostas", []):
        numero = str(prop_raw.get("numero_proposta") or prop_raw.get("codigoEmenda") or prop_raw.get("numero") or "")
        if not numero:
            continue
        res = await db.execute(
            select(PropostaInvestSUS).where(
                PropostaInvestSUS.municipio_id == mid,
                PropostaInvestSUS.numero_proposta == numero,
            )
        )
        existing = res.scalar_one_or_none()
        situacao_raw = str(prop_raw.get("situacao_raw") or prop_raw.get("situacao") or prop_raw.get("fase") or "")
        situacao_norm = None
        for s in SituacaoNormalizada:
            if s.value.lower() in situacao_raw.lower() or situacao_raw.lower() in s.value.lower():
                situacao_norm = s
                break

        valor_global = float(prop_raw.get("valor_global") or prop_raw.get("valorEmpenhado") or prop_raw.get("valor") or 0)
        valor_pago   = float(prop_raw.get("valor_repassado") or prop_raw.get("valorPago") or 0)
        objeto       = str(prop_raw.get("objeto") or prop_raw.get("descricao") or prop_raw.get("tipoEmenda") or "")
        parlamentar  = str(prop_raw.get("parlamentar") or prop_raw.get("nomeAutor") or "")
        exercicio    = int(prop_raw.get("exercicio") or prop_raw.get("ano") or 2024)
        ts           = payload.get("sincronizado_em", "")

        if existing:
            if valor_global:    existing.valor_aprovado = valor_global
            if valor_pago:      existing.valor_pago = valor_pago
            existing.situacao_original = situacao_raw or existing.situacao_original
            if situacao_norm and situacao_norm != existing.situacao_normalizada:
                db.add(HistoricoSituacao(
                    proposta_id=existing.id,
                    situacao_anterior=existing.situacao_normalizada.value if existing.situacao_normalizada else None,
                    situacao_nova=situacao_norm.value,
                    origem="sincronizacao_browser",
                    observacao=f"Atualizado via browser em {ts}",
                ))
                existing.situacao_normalizada = situacao_norm
            atualizadas += 1
        else:
            nova = PropostaInvestSUS(
                municipio_id=mid,
                numero_proposta=numero,
                numero_instrumento=str(prop_raw.get("numero_instrumento") or prop_raw.get("codigoSubEmenda") or ""),
                objeto=objeto,
                tipo_emenda=TipoEmenda.INDIVIDUAL,
                valor_indicado=valor_global,
                valor_proposta=valor_global,
                valor_aprovado=valor_global,
                valor_pago=valor_pago,
                valor_executado=float(prop_raw.get("valor_executado") or prop_raw.get("valorPago") or 0),
                situacao_original=situacao_raw,
                situacao_normalizada=situacao_norm or SituacaoNormalizada.PROPOSTA_EM_ANALISE,
                exercicio=exercicio,
                entidade_cnpj="12.834.320/0001-26",
            )
            db.add(nova)
            await db.flush()
            db.add(HistoricoSituacao(
                proposta_id=nova.id,
                situacao_anterior=None,
                situacao_nova=(situacao_norm or SituacaoNormalizada.PROPOSTA_EM_ANALISE).value,
                origem="sincronizacao_browser",
                observacao=f"Importado via browser em {ts}",
            ))
            criadas += 1

    await db.commit()
    return {
        "ok": True,
        "sincronizado_em": payload.get("sincronizado_em", ""),
        "propostas_encontradas": len(payload.get("propostas", [])),
        "criadas": criadas,
        "atualizadas": atualizadas,
        "repasses": len(payload.get("repasses", [])),
        "erros": [],
    }
