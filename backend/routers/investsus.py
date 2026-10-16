"""
Router: /api/investsus — INVESTSUS 360: propostas FEDERAIS do Fundo Municipal de Saúde

Escopo desta etapa (services/investsus_federal.py): somente recursos do Governo Federal
— Emendas RP 6 (individual), RP 7 (bancada), RP 8 (comissão) e Recursos de Programa
(Outros) do Ministério da Saúde. Emendas estaduais não são captadas nem exibidas.

Captação: sincronização com o InvestSUS (acesso gov.br do município), relay pelo
navegador, Portal da Transparência (complemento) e cadastro/importação manual auditável.
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
from services import investsus_federal as fed
from tenancy.contexto import IBGE_LEGADO, MunicipioContexto, municipio_atual

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
    modalidade: str | None = None          # rp6 | rp7 | rp8 | programa (padrão: derivado de tipo_emenda)
    esfera: str = fed.ESFERA_FEDERAL       # somente "federal" nesta etapa
    observacoes_internas: str | None = None
    prioridade: str | None = None
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
    # informações internas (não vêm da fonte oficial; a sincronização não sobrescreve)
    modalidade: str | None = None
    observacoes_internas: str | None = None
    prioridade: str | None = None


class RespostaDiligencia(BaseModel):
    data_resposta: str
    resposta_texto: str | None = None
    situacao_resposta: str = "respondida"


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
    """Município da sessão — nunca um valor padrão nem vindo do cliente."""
    mid = getattr(user, "municipio_id", None)
    if not mid:
        raise HTTPException(409, "MUNICIPIO_NAO_SELECIONADO: selecione um município para continuar")
    return mid


# Classificação de situação e modalidade: services/investsus_federal.py (fonte única das regras).


def _modalidade_de(p: PropostaInvestSUS) -> str:
    """Modalidade gravada; registros anteriores à coluna derivam do tipo legado."""
    if p.modalidade:
        return p.modalidade
    tipo = p.tipo_emenda.value if p.tipo_emenda else None
    return fed.modalidade_de_tipo_emenda(tipo) or fed.MODALIDADE_A_CLASSIFICAR


def _filtro_escopo():
    """Somente propostas de esfera habilitada (federal). Linhas antigas sem esfera = federal."""
    return or_(PropostaInvestSUS.esfera.is_(None), PropostaInvestSUS.esfera.in_(sorted(fed.ESFERAS_HABILITADAS)))


def _filtrar_modalidade_fase(stmt, modalidade: str | None, fase: str | None):
    if modalidade:
        _modalidade_valida(modalidade)
        stmt = stmt.where(PropostaInvestSUS.modalidade == modalidade)
    if fase:
        if fase not in fed.FASES:
            raise HTTPException(422, f"Fase inválida: {fase}")
        stmt = stmt.where(PropostaInvestSUS.situacao_normalizada.in_(
            [SituacaoNormalizada(s) for s in fed.situacoes_da_fase(fase)]))
    return stmt


def _prop_dict(p: PropostaInvestSUS) -> dict:
    modalidade = _modalidade_de(p)
    sit = p.situacao_normalizada.value if p.situacao_normalizada else None
    fase = fed.fase_de(sit)
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
        "esfera": p.esfera or fed.ESFERA_FEDERAL,
        "modalidade": modalidade,
        "modalidade_rotulo": fed.MODALIDADES.get(modalidade, {}).get("rotulo", "A classificar"),
        "fase": fase,
        "fase_rotulo": fed.FASES.get(fase or "", "Não identificada"),
        "observacoes_internas": p.observacoes_internas,
        "prioridade": p.prioridade,
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
        "payload_original": p.payload_original,
    }


# ── Dashboard ─────────────────────────────────────────────────────────────────

def _resumo_modalidades(acumulado: dict[str, dict]) -> list[dict]:
    """As quatro modalidades sempre aparecem (mesmo zeradas); "a classificar" só se houver."""
    saida = []
    for chave, info in fed.MODALIDADES.items():
        v = acumulado.get(chave) or {"qtd": 0, "valor_indicado": 0.0, "valor_pago": 0.0}
        saida.append({"modalidade": chave, "rotulo": info["rotulo"], **v})
    pend = acumulado.get(fed.MODALIDADE_A_CLASSIFICAR)
    if pend:
        saida.append({"modalidade": fed.MODALIDADE_A_CLASSIFICAR, "rotulo": "A classificar", **pend})
    return saida


@router.get("/dashboard")
async def dashboard(
    db: DbDep,
    user: UserDep,
    exercicio: int = Query(None),
    modalidade: str = Query(None),
):
    mid = _municipio_id(user)
    stmt = (select(PropostaInvestSUS).options(selectinload(PropostaInvestSUS.programa))
            .where(PropostaInvestSUS.municipio_id == mid, _filtro_escopo()))
    if exercicio:
        stmt = stmt.where(PropostaInvestSUS.exercicio == exercicio)
    stmt = _filtrar_modalidade_fase(stmt, modalidade, None)

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
    por_modalidade: dict[str, dict] = {}
    por_fase: dict[str, int] = {}

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

        md = _modalidade_de(p)
        acc = por_modalidade.setdefault(md, {"qtd": 0, "valor_indicado": 0.0, "valor_pago": 0.0})
        acc["qtd"] += 1
        acc["valor_indicado"] += p.valor_indicado
        acc["valor_pago"] += p.valor_pago

        fs = fed.fase_de(sn) or "nao_identificada"
        por_fase[fs] = por_fase.get(fs, 0) + 1

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
        "esfera": fed.ESFERA_FEDERAL,
        "por_modalidade": _resumo_modalidades(por_modalidade),
        "por_fase": [
            {"fase": k, "rotulo": r, "qtd": por_fase.get(k, 0)} for k, r in fed.FASES.items()
        ] + ([{"fase": "nao_identificada", "rotulo": "Não identificada", "qtd": por_fase["nao_identificada"]}]
             if por_fase.get("nao_identificada") else []),
        "alertas_abertos": alertas_abertos,
        "alertas_criticos": alertas_criticos,
        "atualizado_em": datetime.utcnow().isoformat(),
    }


# ── Propostas CRUD ────────────────────────────────────────────────────────────

@router.get("/propostas")
async def listar_propostas(
    db: DbDep,
    user: UserDep,
    situacao: str = Query(None),
    exercicio: int = Query(None),
    busca: str = Query(None),
    modalidade: str = Query(None, description="rp6 | rp7 | rp8 | programa | a_classificar"),
    fase: str = Query(None, description="cadastrada, enviada, em_analise, em_diligencia, em_reanalise, "
                                        "aprovada, rejeitada, empenhada, paga, em_execucao, concluida…"),
    pagina: int = Query(1, ge=1),
    tamanho: int = Query(50, ge=1, le=200),
):
    mid = _municipio_id(user)
    stmt = (
        select(PropostaInvestSUS)
        .options(
            selectinload(PropostaInvestSUS.parlamentar),
            selectinload(PropostaInvestSUS.programa),
            selectinload(PropostaInvestSUS.alertas_investsus),
        )
        .where(PropostaInvestSUS.municipio_id == mid, _filtro_escopo())
    )
    stmt = _filtrar_modalidade_fase(stmt, modalidade, fase)
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
    if not fed.esfera_habilitada(body.esfera):
        raise HTTPException(422, "Somente recursos federais nesta etapa — emendas estaduais estão fora do escopo.")
    if body.prioridade not in (None, "", "baixa", "media", "alta"):
        raise HTTPException(422, "Prioridade inválida (use baixa, media ou alta).")

    data = body.model_dump()
    modalidade = _modalidade_valida(body.modalidade) or fed.modalidade_de_tipo_emenda(body.tipo_emenda) \
        or fed.MODALIDADE_A_CLASSIFICAR
    data["modalidade"] = modalidade
    data["esfera"] = fed.ESFERA_FEDERAL
    try:
        data["tipo_emenda"] = TipoEmenda(fed.tipo_emenda_de_modalidade(modalidade)
                                         if modalidade in fed.MODALIDADES else body.tipo_emenda)
    except ValueError:
        data["tipo_emenda"] = TipoEmenda.OUTRO
    try:
        data["situacao_normalizada"] = SituacaoNormalizada(body.situacao_normalizada)
    except ValueError:
        raise HTTPException(422, f"Situação inválida: {body.situacao_normalizada}")
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
            "resposta_texto": pa.resposta_texto,
            "respondido_por": pa.respondido_por,
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
    if sit_nova:
        try:
            dados["situacao_normalizada"] = SituacaoNormalizada(sit_nova)
        except ValueError:
            raise HTTPException(422, f"Situação inválida: {sit_nova}")
    if "modalidade" in dados:
        modalidade = _modalidade_valida(dados["modalidade"]) or fed.MODALIDADE_A_CLASSIFICAR
        dados["modalidade"] = modalidade
        if modalidade in fed.MODALIDADES:
            prop.tipo_emenda = TipoEmenda(fed.tipo_emenda_de_modalidade(modalidade))
    if dados.get("prioridade") not in (None, "", "baixa", "media", "alta"):
        raise HTTPException(422, "Prioridade inválida (use baixa, media ou alta).")
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


@router.post("/propostas/{proposta_id}/pareceres/{parecer_id}/resposta")
async def responder_diligencia(proposta_id: int, parecer_id: int, body: RespostaDiligencia,
                               db: DbDep, user: UserDep):
    """Registra a resposta do município a uma diligência (registro interno). A situação
    OFICIAL não é alterada aqui — ela muda quando a fonte federal registrar a reanálise."""
    mid = _municipio_id(user)
    pa = (await db.execute(
        select(Parecer).join(PropostaInvestSUS, Parecer.proposta_id == PropostaInvestSUS.id).where(
            Parecer.id == parecer_id, Parecer.proposta_id == proposta_id, PropostaInvestSUS.municipio_id == mid,
        )
    )).scalar_one_or_none()
    if not pa:
        raise HTTPException(404, "Parecer não encontrado")
    if not pa.eh_diligencia:
        raise HTTPException(422, "Este parecer não é uma diligência.")
    try:
        pa.data_resposta = date.fromisoformat(body.data_resposta)
    except ValueError:
        raise HTTPException(422, "data_resposta inválida (use AAAA-MM-DD).")
    pa.resposta_texto = body.resposta_texto
    pa.situacao_resposta = body.situacao_resposta
    pa.respondido_por = user.nome
    db.add(HistoricoSituacao(
        proposta_id=proposta_id,
        situacao_nova="Resposta à diligência registrada",
        usuario=user.nome, origem="manual",
        observacao=(body.resposta_texto or "")[:2000] or None,
    ))
    # alertas de diligência desta proposta deixam de estar pendentes
    abertos = (await db.execute(select(AlertaInvestSUS).where(
        AlertaInvestSUS.proposta_id == proposta_id,
        AlertaInvestSUS.resolvido == False,  # noqa: E712
        AlertaInvestSUS.tipo_alerta.in_(["mudanca_fase_em_diligencia", "prazo_diligencia"]),
    ))).scalars().all()
    for al in abertos:
        al.resolvido, al.resolvido_em, al.resolvido_por = True, datetime.utcnow(), user.nome
    await db.commit()
    return {"ok": True, "alertas_resolvidos": len(abertos)}


@router.get("/escopo")
async def escopo_investsus(db: DbDep, user: UserDep):
    """Escopo vigente do INVESTSUS 360: esfera, modalidades, fases e fontes habilitadas,
    e os dados do Fundo do município da sessão usados na captura pelo navegador."""
    from tenancy.credenciais import configurado
    fundo = await _dados_fundo(db, _municipio_id(user))
    ibge = fundo["ibge"] or ""
    return {
        "fundo": {"cnpj": fundo["cnpj"], "cnpj_formatado": _formatar_cnpj(fundo["cnpj"]) if len(fundo["cnpj"]) == 14 else None,
                  "nome": fundo["nome"], "uf": fundo["uf"], "ibge": ibge,
                  # cabeçalho de contexto do InvestSUS: código UF / IBGE 6 dígitos / CNPJ
                  "contexto_investsus": f"{ibge[:2]}/{ibge[:6]}/{fundo['cnpj']}" if len(ibge) == 7 else None},
        "esferas_habilitadas": sorted(fed.ESFERAS_HABILITADAS),
        "modalidades": [{"codigo": k, **v} for k, v in fed.MODALIDADES.items()],
        "fases": [{"codigo": k, "rotulo": v} for k, v in fed.FASES.items()],
        "fontes": [{"codigo": f.codigo, "nome": f.nome, "esfera": f.esfera, "descricao": f.descricao}
                   for f in fed.fontes_habilitadas()],
        "investsus_configurado": configurado("INVESTSUS"),
        "fora_do_escopo": "Emendas parlamentares estaduais e recursos do orçamento estadual "
                          "não são captados nesta etapa.",
    }


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
    apenas_abertos: bool = Query(True),
    nivel: str = Query(None),
):
    mid = _municipio_id(user)
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
    r = await db.execute(select(AlertaInvestSUS).where(
        and_(AlertaInvestSUS.id == alerta_id, AlertaInvestSUS.municipio_id == _municipio_id(user))))
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

            textos = [row.get("modalidade"), row.get("tipo_emenda"), row.get("tipo_recurso"),
                      row.get("objeto"), row.get("parlamentar")]
            if fed.classificar_esfera(*textos) != fed.ESFERA_FEDERAL:
                erros.append({"numero": numero, "erro": "Fora do escopo: recurso estadual não é importado nesta etapa."})
                continue
            modalidade = (row.get("modalidade") if row.get("modalidade") in fed.MODALIDADES_VALIDAS
                          else fed.classificar_modalidade(*textos[:3]))
            if not modalidade and prop:
                modalidade = prop.modalidade
            modalidade = modalidade or fed.MODALIDADE_A_CLASSIFICAR

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
                "esfera": fed.ESFERA_FEDERAL,
                "modalidade": modalidade,
                "tipo_emenda": TipoEmenda(fed.tipo_emenda_de_modalidade(modalidade)),
            }
            sit_val = fed.classificar_situacao(campos["situacao_original"])
            if sit_val:
                campos["situacao_normalizada"] = SituacaoNormalizada(sit_val)

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
    r = await db.execute(
        select(PlanoTrabalho)
        .join(PropostaInvestSUS, PlanoTrabalho.proposta_id == PropostaInvestSUS.id)
        .where(and_(PlanoTrabalho.id == plano_id, PropostaInvestSUS.municipio_id == _municipio_id(user)))
    )
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
    exercicio: int = Query(None),
    situacao: str = Query(None),
    modalidade: str = Query(None),
    fase: str = Query(None),
):
    """Retorna dados estruturados para exportação (relatório consolidado, escopo federal)."""
    mid = _municipio_id(user)
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
        .where(PropostaInvestSUS.municipio_id == mid, _filtro_escopo())
    )
    if exercicio:
        stmt = stmt.where(PropostaInvestSUS.exercicio == exercicio)
    if situacao:
        stmt = stmt.where(PropostaInvestSUS.situacao_normalizada == situacao)
    stmt = _filtrar_modalidade_fase(stmt, modalidade, fase)

    result = await db.execute(stmt)
    props = result.scalars().all()

    linhas = []
    for p in props:
        linhas.append({
            "numero_proposta": p.numero_proposta,
            "numero_emenda": p.numero_emenda,
            "exercicio": p.exercicio,
            "esfera": p.esfera or fed.ESFERA_FEDERAL,
            "modalidade": fed.MODALIDADES.get(_modalidade_de(p), {}).get("rotulo", "A classificar"),
            "fase": fed.FASES.get(fed.fase_de(p.situacao_normalizada.value if p.situacao_normalizada else None) or "", ""),
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
            "prioridade": p.prioridade or "",
            "observacoes_internas": p.observacoes_internas or "",
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
    if not user.administrador_geral and user.role != "admin":
        raise HTTPException(403, "Acesso restrito")
    if user.municipio_ibge != "1300144":
        # o exemplo contém dados reais de Apuí: nunca gravar em outro município
        raise HTTPException(403, "Exemplo disponível somente para Apuí/AM")

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
        modalidade="rp6",
        esfera=fed.ESFERA_FEDERAL,
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


# ── Sincronização federal com o InvestSUS ─────────────────────────────────────
# Escopo: services/investsus_federal.py — só itens de esfera habilitada (federal).
# Regras da movimentação:
#   • o status OFICIAL (situacao_original) é preservado como veio da fonte;
#   • qualquer mudança no texto oficial OU na situação normalizada gera uma linha no
#     histórico e, conforme a nova fase, um alerta (diligência = urgente, rejeição = crítico);
#   • campos internos dos técnicos (responsável, observações, prioridade, DigiSUS…) nunca
#     são sobrescritos pela sincronização.
import asyncio as _asyncio
import uuid as _uuid
_sync_jobs: dict = {}   # job_id → {status, resultado, erro, municipio_id}

# CNPJ do Fundo de Apuí/AM — era fixo no código; mantido só como fallback do município
# legado enquanto Municipio.cnpj_fundo não estiver preenchido no cadastro.
_CNPJ_FUNDO_LEGADO_APUI = "12834320000126"

_ROTULO_NIVEL_GERAL = {"critico": "critico", "urgente": "critico", "atencao": "atencao", "informativo": "info"}


def _pode_sincronizar(user: UserOut) -> None:
    if not user.administrador_geral and user.role not in ("admin", "gestor", "financeiro"):
        raise HTTPException(403, "Acesso restrito")


async def _dados_fundo(db, mid: int) -> dict:
    """CNPJ do Fundo, nome e UF do município — o CNPJ consultado é sempre o do município da sessão."""
    from models.municipio import Municipio
    m = (await db.execute(select(Municipio).where(Municipio.id == mid))).scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Município não encontrado")
    from services.investsus_scraper import somente_digitos
    cnpj = somente_digitos(m.cnpj_fundo)
    if len(cnpj) != 14 and m.codigo_ibge == IBGE_LEGADO:
        cnpj = _CNPJ_FUNDO_LEGADO_APUI
    return {"cnpj": cnpj, "nome": m.nome, "uf": m.uf, "ibge": m.codigo_ibge}


def _formatar_cnpj(d: str) -> str:
    return f"{d[:2]}.{d[2:5]}.{d[5:8]}/{d[8:12]}-{d[12:]}" if len(d) == 14 else d


def _credenciais_investsus(ctx: MunicipioContexto | None = None) -> dict[str, str]:
    from tenancy.credenciais import SISTEMAS, credencial
    ctx = ctx or municipio_atual()
    return {campo: credencial("INVESTSUS", campo, ctx) for campo in SISTEMAS["INVESTSUS"]["campos"]}


async def _registrar_alertas(db, prop: PropostaInvestSUS, mid: int, alertas: list[dict]) -> int:
    """Grava alertas da proposta sem duplicar um alerta aberto do mesmo tipo; os urgentes e
    críticos também vão para a central de Alertas do ERSUS360 (sino / página Alertas)."""
    from models.alerta import Alerta, SeveridadeAlerta
    gravados = 0
    for a in alertas:
        ja = (await db.execute(select(AlertaInvestSUS.id).where(
            AlertaInvestSUS.proposta_id == prop.id,
            AlertaInvestSUS.tipo_alerta == a["tipo_alerta"],
            AlertaInvestSUS.resolvido == False,  # noqa: E712
        ))).first()
        if ja:
            continue
        db.add(AlertaInvestSUS(
            proposta_id=prop.id, municipio_id=mid, tipo_alerta=a["tipo_alerta"],
            nivel=NivelAlertaInvest(a["nivel"]), titulo=a["titulo"][:300],
            descricao=a.get("descricao"), providencia=a.get("providencia"),
            prazo=a.get("prazo"), responsavel=prop.responsavel_interno,
        ))
        if a["nivel"] in ("urgente", "critico"):
            db.add(Alerta(
                municipio_id=mid, titulo=a["titulo"][:200], descricao=a.get("descricao") or "",
                modulo="InvestSUS", severidade=SeveridadeAlerta(_ROTULO_NIVEL_GERAL[a["nivel"]]),
            ))
        gravados += 1
    return gravados


def _modalidade_valida(valor: str | None) -> str | None:
    if valor is None:
        return None
    if valor not in fed.MODALIDADES_VALIDAS:
        raise HTTPException(422, f"Modalidade inválida: {valor}. Use rp6, rp7, rp8 ou programa.")
    return valor


async def aplicar_propostas_federais(dados: dict, mid: int, db, origem: str) -> dict:
    """Upsert das propostas normalizadas (formato de services/investsus_scraper) com
    detecção de mudança de situação, histórico e alertas. Compartilhado pela sincronização
    do servidor, pelo relay do bookmarklet, pela leitura da tela e pelo job diário."""
    cont = {"criadas": 0, "atualizadas": 0, "movimentacoes": 0, "alertas": 0,
            "fora_escopo": int(dados.get("fora_escopo") or 0)}
    ts = dados.get("sincronizado_em") or datetime.utcnow().isoformat() + "Z"
    hoje = date.today()
    vistos: set[str] = set()

    for item in dados.get("propostas", []):
        numero = str(item.get("numero_proposta") or "").strip()
        if not numero or numero == "-" or numero in vistos:
            continue
        vistos.add(numero)
        if not fed.esfera_habilitada(item.get("esfera")):
            cont["fora_escopo"] += 1  # escopo federal: item estadual não é captado
            continue

        sit_txt = str(item.get("situacao_raw") or "").strip()
        sit_val = fed.classificar_situacao(sit_txt)
        sit_norm = SituacaoNormalizada(sit_val) if sit_val else None
        valor_global = float(item.get("valor_global") or 0)
        valor_pago = float(item.get("valor_repassado") or 0)
        if not valor_pago and sit_val == "totalmente_paga":
            valor_pago = valor_global  # a lista do InvestSUS só traz "valor"; paga = valor integral
        modalidade = item.get("modalidade")
        if modalidade not in fed.MODALIDADES_VALIDAS:
            modalidade = fed.MODALIDADE_A_CLASSIFICAR

        prop = (await db.execute(select(PropostaInvestSUS).where(
            PropostaInvestSUS.municipio_id == mid, PropostaInvestSUS.numero_proposta == numero,
        ))).scalar_one_or_none()

        if prop:
            txt_ant = prop.situacao_original
            norm_ant = prop.situacao_normalizada.value if prop.situacao_normalizada else None
            # campos oficiais (vindos da fonte)
            if valor_global:
                prop.valor_indicado = valor_global
                prop.valor_proposta = valor_global
            if item.get("valor_aprovado"):
                prop.valor_aprovado = float(item["valor_aprovado"])
            if valor_pago:
                prop.valor_pago = valor_pago
            if item.get("valor_executado"):
                prop.valor_executado = float(item["valor_executado"])
            for campo in ("objeto", "numero_instrumento", "numero_emenda", "componente", "tipo_financiamento"):
                if item.get(campo):
                    setattr(prop, campo, item[campo])
            if item.get("raw") is not None:
                prop.payload_original = item["raw"]
            prop.esfera = item.get("esfera") or fed.ESFERA_FEDERAL
            # modalidade: o dado oficial prevalece; sem informação na fonte, mantém a
            # classificação feita pelo técnico
            if modalidade != fed.MODALIDADE_A_CLASSIFICAR or not prop.modalidade:
                prop.modalidade = modalidade
                prop.tipo_emenda = TipoEmenda(fed.tipo_emenda_de_modalidade(modalidade))
            if sit_txt:
                prop.situacao_original = sit_txt
            if sit_norm:
                prop.situacao_normalizada = sit_norm
            prop.ultima_consulta_investsus = hoje
            prop.atualizado_por = f"sincronizacao:{origem}"

            norm_nova = prop.situacao_normalizada.value if prop.situacao_normalizada else None
            texto_mudou = bool(sit_txt) and fed._norm(sit_txt) != fed._norm(txt_ant)
            if texto_mudou or norm_nova != norm_ant:
                db.add(HistoricoSituacao(
                    proposta_id=prop.id,
                    situacao_anterior=txt_ant or norm_ant,
                    situacao_nova=sit_txt or norm_nova or "",
                    situacao_norm_anterior=norm_ant,
                    situacao_norm_nova=norm_nova,
                    usuario="sincronizacao",
                    origem=origem,
                    observacao=f"Mudança detectada na sincronização ({origem}) em {ts}",
                ))
                cont["movimentacoes"] += 1
                cont["alertas"] += await _registrar_alertas(db, prop, mid, fed.alertas_de_movimento(
                    nova=False, fase_anterior=fed.fase_de(norm_ant), fase_nova=fed.fase_de(norm_nova),
                    situacao_anterior=txt_ant, situacao_nova=sit_txt or norm_nova, numero=numero,
                ))
            cont["atualizadas"] += 1
        else:
            situacao = sit_norm or SituacaoNormalizada.EM_ANALISE
            prop = PropostaInvestSUS(
                municipio_id=mid,
                numero_proposta=numero,
                numero_emenda=item.get("numero_emenda"),
                numero_instrumento=item.get("numero_instrumento") or "",
                objeto=item.get("objeto") or "",
                esfera=item.get("esfera") or fed.ESFERA_FEDERAL,
                modalidade=modalidade,
                tipo_emenda=TipoEmenda(fed.tipo_emenda_de_modalidade(modalidade)),
                componente=item.get("componente"),
                tipo_financiamento=item.get("tipo_financiamento"),
                valor_indicado=valor_global,
                valor_proposta=valor_global,
                valor_aprovado=float(item.get("valor_aprovado") or 0),
                valor_pago=valor_pago,
                valor_executado=float(item.get("valor_executado") or 0),
                situacao_original=sit_txt,
                situacao_normalizada=situacao,
                exercicio=item.get("exercicio") or hoje.year,
                entidade_cnpj=_formatar_cnpj(item.get("cnpj_proponente") or ""),
                fonte_dado=item.get("fonte") or origem,
                payload_original=item.get("raw"),
                ultima_consulta_investsus=hoje,
                criado_por=f"sincronizacao:{origem}",
                atualizado_por=f"sincronizacao:{origem}",
            )
            db.add(prop)
            await db.flush()
            db.add(HistoricoSituacao(
                proposta_id=prop.id,
                situacao_nova=sit_txt or situacao.value,
                situacao_norm_nova=situacao.value,
                usuario="sincronizacao",
                origem=origem,
                observacao=f"Proposta captada na sincronização ({origem}) em {ts}",
            ))
            cont["alertas"] += await _registrar_alertas(db, prop, mid, fed.alertas_de_movimento(
                nova=True, fase_anterior=None, fase_nova=fed.fase_de(situacao.value),
                situacao_anterior=None, situacao_nova=sit_txt or situacao.value, numero=numero,
            ))
            cont["criadas"] += 1

    await db.commit()
    return cont


async def executar_sincronizacao(mid: int, fonte: str, cred: dict[str, str]) -> dict:
    """Busca na fonte federal e aplica no município `mid`. Usado pelo job de background
    (botão Sincronizar) e pelo job diário do scheduler."""
    from services.investsus_scraper import sincronizar_investsus, sincronizar_transparencia
    from database import AsyncSessionLocal

    if not fed.fonte_permitida(fonte):
        raise ValueError(f"Fonte fora do escopo habilitado: {fonte}")
    async with AsyncSessionLocal() as db:
        fundo = await _dados_fundo(db, mid)
    if fonte == "transparencia":
        dados = await sincronizar_transparencia(fundo["cnpj"], fundo["nome"], fundo["uf"])
    else:
        dados = await sincronizar_investsus(fundo["cnpj"], fundo["ibge"], cred)

    if not dados.get("propostas") and dados.get("erros"):
        raise RuntimeError("; ".join(e.get("erro", str(e)) for e in dados["erros"]))

    async with AsyncSessionLocal() as db:
        cont = await aplicar_propostas_federais(dados, mid, db, origem=f"sincronizacao_{fonte}")
    return {
        "ok": True,
        "fonte": fonte,
        "sincronizado_em": dados["sincronizado_em"],
        "propostas_encontradas": len(dados["propostas"]),
        **cont,
        "descartadas_outra_localidade": dados.get("descartadas_outra_localidade", 0),
        "erros": dados.get("erros", []),
    }


async def _executar_sync_job(job_id: str, mid: int, fonte: str, cred: dict[str, str]) -> None:
    """Roda a sincronização em background e guarda o resultado em _sync_jobs."""
    _sync_jobs[job_id]["status"] = "rodando"
    try:
        resultado = await _asyncio.wait_for(executar_sincronizacao(mid, fonte, cred), timeout=90)
        _sync_jobs[job_id].update({"status": "concluido", "resultado": resultado})
    except _asyncio.TimeoutError:
        _sync_jobs[job_id].update({
            "status": "erro",
            "erro": "Tempo limite excedido (90s) — a fonte externa ou a gravação no banco demorou demais. Tente novamente.",
        })
    except Exception as exc:
        _sync_jobs[job_id].update({"status": "erro", "erro": str(exc)})


@router.post("/sincronizar")
async def sincronizar_com_investsus(user: UserDep, fonte: str = Query("investsus")):
    """
    Inicia a sincronização das propostas FEDERAIS do Fundo do município da sessão e
    retorna job_id; consulte GET /api/investsus/sincronizar/{job_id}.

    fonte="investsus" (padrão): portal InvestSUS com o acesso gov.br do município
      (INVESTSUS_COOKIE/TOKEN/CPF+SENHA com sufixo _{IBGE7}).
    fonte="transparencia": emendas federais via Portal da Transparência CGU.
    """
    _pode_sincronizar(user)
    import os
    if not fed.fonte_permitida(fonte):
        raise HTTPException(400, f"Fonte '{fonte}' fora do escopo habilitado (somente fontes federais).")
    ctx = municipio_atual()
    cred: dict[str, str] = {}
    if fonte == "transparencia":
        if not os.getenv("TRANSPARENCIA_API_KEY", "").strip():
            raise HTTPException(400, detail={
                "erro": "TRANSPARENCIA_API_KEY não configurada",
                "instrucao": "Obtenha uma chave gratuita em portaldatransparencia.gov.br/api-de-dados "
                             "e configure TRANSPARENCIA_API_KEY nas variáveis do servidor.",
            })
    else:
        from tenancy.credenciais import configurado
        if not configurado("INVESTSUS", ctx):
            raise HTTPException(400, detail={
                "erro": "Credenciais do InvestSUS não configuradas para este município",
                "instrucao": (
                    f"Configure INVESTSUS_COOKIE_{ctx.ibge} (sessão do portal após login gov.br) ou "
                    f"INVESTSUS_CPF_{ctx.ibge} + INVESTSUS_SENHA_{ctx.ibge} nas variáveis do servidor — "
                    "ou use fonte=\"transparencia\"."
                ),
            })
        cred = _credenciais_investsus(ctx)

    mid = _municipio_id(user)
    job_id = str(_uuid.uuid4())
    _sync_jobs[job_id] = {"status": "iniciado", "resultado": None, "erro": None, "municipio_id": mid}
    _asyncio.create_task(_executar_sync_job(job_id, mid, fonte, cred))
    return {"job_id": job_id, "status": "iniciado"}


async def verificar_prazos_diligencia(db, mid: int, hoje: date | None = None) -> int:
    """Alertas de prazo de resposta a diligências sem resposta registrada: 7 dias (atenção),
    3 dias (urgente), vencido (crítico). Um único alerta aberto por proposta, que escala de
    nível conforme o prazo se aproxima. Retorna quantos alertas foram criados/escalados."""
    hoje = hoje or date.today()
    pendentes = (await db.execute(
        select(Parecer, PropostaInvestSUS)
        .join(PropostaInvestSUS, Parecer.proposta_id == PropostaInvestSUS.id)
        .where(
            PropostaInvestSUS.municipio_id == mid, _filtro_escopo(),
            Parecer.eh_diligencia == True,  # noqa: E712
            Parecer.prazo_resposta.is_not(None), Parecer.data_resposta.is_(None),
        )
    )).all()
    ordem = ["informativo", "atencao", "urgente", "critico"]
    alterados = 0
    for parecer, prop in pendentes:
        dias = (parecer.prazo_resposta - hoje).days
        nivel = fed.nivel_prazo_diligencia(dias)
        if not nivel:
            continue
        quando = "venceu" if dias < 0 else ("vence hoje" if dias == 0 else f"vence em {dias} dia(s)")
        titulo = f"Prazo de diligência {quando} — {prop.numero_proposta}"
        descricao = (f"Diligência de {parecer.sigla_area or parecer.area_responsavel or 'área técnica do MS'}"
                     f" com prazo de resposta em {parecer.prazo_resposta.strftime('%d/%m/%Y')}.")
        aberto = (await db.execute(select(AlertaInvestSUS).where(
            AlertaInvestSUS.proposta_id == prop.id, AlertaInvestSUS.tipo_alerta == "prazo_diligencia",
            AlertaInvestSUS.resolvido == False,  # noqa: E712
        ))).scalar_one_or_none()
        if aberto:
            if ordem.index(nivel) > ordem.index(aberto.nivel.value):
                aberto.nivel, aberto.titulo, aberto.descricao = NivelAlertaInvest(nivel), titulo, descricao
                if nivel in ("urgente", "critico"):
                    from models.alerta import Alerta, SeveridadeAlerta
                    db.add(Alerta(municipio_id=mid, titulo=titulo[:200], descricao=descricao, modulo="InvestSUS",
                                  severidade=SeveridadeAlerta(_ROTULO_NIVEL_GERAL[nivel])))
                alterados += 1
            continue
        alterados += await _registrar_alertas(db, prop, mid, [{
            "tipo_alerta": "prazo_diligencia", "nivel": nivel, "titulo": titulo, "descricao": descricao,
            "providencia": "Responder à diligência no InvestSUS e registrar a resposta no ERSUS360.",
            "prazo": parecer.prazo_resposta,
        }])
    await db.commit()
    return alterados


@router.get("/sincronizar/{job_id}")
async def status_sync_job(job_id: str, user: UserDep):
    """Retorna status do job de sincronização."""
    _pode_sincronizar(user)
    job = _sync_jobs.get(job_id)
    if not job or job.get("municipio_id") != _municipio_id(user):
        raise HTTPException(404, "Job não encontrado")
    return job


@router.post("/sincronizar-dados")
async def salvar_dados_sincronizados(payload: dict, db: DbDep, user: UserDep):
    """
    Recebe linhas lidas pelo navegador na TELA de Propostas do InvestSUS
    (numero_proposta, tipo_recurso_raw, tipo_raw, situacao_raw, valor_global) — usado
    quando o servidor não alcança .gov.br. payload: { propostas: [...], sincronizado_em }
    """
    _pode_sincronizar(user)
    from services.investsus_scraper import normalizar_item_tela
    mid = _municipio_id(user)
    fundo = await _dados_fundo(db, mid)
    dados = {
        "propostas": [normalizar_item_tela(it, fundo["cnpj"]) for it in payload.get("propostas", [])],
        "sincronizado_em": payload.get("sincronizado_em") or datetime.utcnow().isoformat() + "Z",
    }
    cont = await aplicar_propostas_federais(dados, mid, db, origem="sincronizacao_browser")
    return {
        "ok": True,
        "sincronizado_em": dados["sincronizado_em"],
        "propostas_encontradas": len(dados["propostas"]),
        **cont,
        "repasses": len(payload.get("repasses", [])),
        "erros": [],
    }


@router.post("/sincronizar-relay")
async def sincronizar_relay(payload: dict, db: DbDep, user: UserDep):
    """
    Recebe os itens BRUTOS que o navegador do usuário buscou na API real do InvestSUS
    (POST .../api/propostas/paginado) e os grava com a mesma regra da sincronização
    do servidor. payload: { items: [...] }
    """
    _pode_sincronizar(user)
    from services.investsus_scraper import sincronizar_investsus_relay

    mid = _municipio_id(user)
    items = payload.get("items", [])
    if not items:
        raise HTTPException(400, "Nenhum item recebido.")
    fundo = await _dados_fundo(db, mid)
    if len(fundo["cnpj"]) != 14:
        raise HTTPException(422, "CNPJ do Fundo Municipal de Saúde não cadastrado para o município.")
    dados = await sincronizar_investsus_relay(items, fundo["cnpj"])
    cont = await aplicar_propostas_federais(dados, mid, db, origem="sincronizacao_relay")
    return {
        "ok": True,
        "sincronizado_em": dados["sincronizado_em"],
        "propostas_encontradas": len(dados["propostas"]),
        **cont,
        "erros": dados.get("erros", []),
    }


# ── Snapshot do portal InvestSUS (capturado via bookmarklet) ──────────────────

@router.post("/snapshot")
async def salvar_snapshot(payload: dict, db: DbDep, user: UserDep):
    """Salva snapshot dos dados capturados do portal InvestSUS via bookmarklet."""
    from models.investsus import SnapshotInvestSUS
    mid = _municipio_id(user)
    snap = SnapshotInvestSUS(
        municipio_id=mid,
        dados=payload,
        origem=payload.get("origem", "bookmarklet"),
    )
    db.add(snap)
    await db.commit()
    await db.refresh(snap)
    return {"ok": True, "id": snap.id, "capturado_em": snap.capturado_em.isoformat()}


@router.get("/snapshot")
async def get_snapshot(db: DbDep, user: UserDep):
    """Retorna o snapshot mais recente do portal InvestSUS."""
    from models.investsus import SnapshotInvestSUS
    from sqlalchemy import desc
    mid = _municipio_id(user)
    result = await db.execute(
        select(SnapshotInvestSUS)
        .where(SnapshotInvestSUS.municipio_id == mid)
        .order_by(desc(SnapshotInvestSUS.capturado_em))
        .limit(1)
    )
    snap = result.scalar_one_or_none()
    if not snap:
        return None
    return {
        "id": snap.id,
        "capturado_em": snap.capturado_em.isoformat(),
        "origem": snap.origem,
        "dados": snap.dados,
    }
