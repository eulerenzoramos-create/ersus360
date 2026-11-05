"""
Router: /api/investsus/execucao — Execução Financeira dos Planos de Trabalho (InvestSUS)

Aprimora a aba "Execução das Propostas" sem cadastro paralelo: toda proposta do
InvestSUS (is_propostas, escopo federal, sem canceladas/rejeitadas) aparece aqui; a
ficha de execução é criada no primeiro registro. Aprovado e repasses vêm sempre dos
dados oficiais sincronizados; empenho/liquidação/pagamento e movimentos da conta são
lançados pelo município (manual ou planilha) e identificados como tal.

Perfis (models.usuario.Perfil):
- administrador (administrador_geral, superadmin, admin) ..... tudo
- técnico (financeiro, contabilidade, planejamento) .......... cadastra e lança
- gestor (gestor, prefeito) .................................. consulta, valida e aprova o plano
- consulta/auditoria (auditoria, conselho, consulta e demais)  visualiza e emite relatórios
"""
from __future__ import annotations

import hashlib
import io
import re
import uuid
from datetime import date, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.investsus import (
    AcaoServico, NaturezaDespesa, PagamentoInvestSUS, PlanoTrabalho, PropostaInvestSUS,
)
from models.investsus_execucao import (
    AcaoExecucao, AuditoriaExecucao, DocumentoExecucao, FichaExecucao, LancamentoExecucao,
    MovimentoFinanceiro,
)
from routers.auth import UserOut
from services import investsus_execucao as ex
from services import investsus_federal as fed
from services.investsus_detalhe import NATUREZAS as NATUREZAS_SIAFI
from tenancy.arquivos import caminho_seguro, pasta_municipio
from tenancy.escopo import SessaoMunicipal, garantir_do_municipio

router = APIRouter(prefix="/api/investsus/execucao", tags=["InvestSUS — Execução Financeira"])
DbDep = Annotated[AsyncSession, Depends(get_db)]

PERFIS_ADMIN = {"administrador_geral", "superadmin", "admin"}
PERFIS_LANCAMENTO = PERFIS_ADMIN | {"financeiro", "contabilidade", "planejamento"}
PERFIS_VALIDACAO = PERFIS_ADMIN | {"gestor", "prefeito"}

FASES_FORA = {"cancelada", "rejeitada"}
TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024
EXTENSOES_ANEXO = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx", ".odt", ".ods", ".csv", ".txt"}
TIPOS_DOCUMENTO = {"plano_aprovado", "espelho_proposta", "nota_fiscal", "contrato", "comprovante", "extrato", "outro"}


def _perfil(u: UserOut) -> str:
    if u.administrador_geral or u.role in PERFIS_ADMIN:
        return "administrador"
    if u.role in PERFIS_LANCAMENTO:
        return "tecnico"
    if u.role in PERFIS_VALIDACAO:
        return "gestor"
    return "consulta"


def _pode_lancar(u: UserOut) -> None:
    if not (u.administrador_geral or u.role in PERFIS_LANCAMENTO):
        raise HTTPException(403, "Seu perfil não permite cadastrar ou lançar a execução financeira.")


def _pode_validar(u: UserOut) -> None:
    if not (u.administrador_geral or u.role in PERFIS_VALIDACAO):
        raise HTTPException(403, "Somente gestor municipal ou administrador valida lançamentos e aprova o plano.")


def _permissoes(u: UserOut) -> dict:
    return {"perfil": _perfil(u),
            "lancar": bool(u.administrador_geral or u.role in PERFIS_LANCAMENTO),
            "validar": bool(u.administrador_geral or u.role in PERFIS_VALIDACAO)}


def _data(v: str | None, campo: str) -> date | None:
    if not v:
        return None
    try:
        return date.fromisoformat(str(v)[:10])
    except ValueError:
        raise HTTPException(422, f"Data inválida em {campo}: use AAAA-MM-DD.")


def _str(v) -> str | None:
    if v is None:
        return None
    return v.isoformat() if isinstance(v, (date, datetime)) else str(v)


# ── Schemas ───────────────────────────────────────────────────────────────────

class FichaUpdate(BaseModel):
    origem_recurso: str | None = None
    destinacao: str | None = None
    programa_acao: str | None = None
    conta_bancaria: str | None = None
    situacao_plano: str | None = None
    prazo_execucao: str | None = None
    responsavel: str | None = None
    observacoes: str | None = None
    saldo_extrato: float | None = None
    saldo_extrato_data: str | None = None


class AcaoCreate(BaseModel):
    descricao: str
    detalhamento: str | None = None
    natureza_despesa: str | None = None
    quantidade: float | None = None
    unidade: str | None = None
    valor_unitario: float | None = None
    valor_previsto: float | None = None
    justificativa: str | None = None
    autorizacao: str | None = None


class AcaoUpdate(BaseModel):
    descricao: str | None = None
    detalhamento: str | None = None
    natureza_despesa: str | None = None
    quantidade: float | None = None
    unidade: str | None = None
    valor_unitario: float | None = None
    valor_previsto: float | None = None
    ordem: int | None = None
    justificativa: str | None = None
    autorizacao: str | None = None


class LancamentoCreate(BaseModel):
    tipo: str
    data: str
    valor: float
    natureza_despesa: str | None = None
    fornecedor: str | None = None
    fornecedor_documento: str | None = None
    numero_empenho: str | None = None
    numero_liquidacao: str | None = None
    ordem_bancaria: str | None = None
    documento_comprobatorio: str | None = None
    historico: str | None = None


class MovimentoCreate(BaseModel):
    tipo: str
    data: str
    valor: float
    descricao: str | None = None
    documento: str | None = None


class Motivo(BaseModel):
    motivo: str


class Validacao(BaseModel):
    status: str = "validado"   # validado | rejeitado
    observacao: str | None = None


# ── Carga de dados ────────────────────────────────────────────────────────────

async def _proposta(db, u: UserOut, pid: int) -> PropostaInvestSUS:
    p = await db.get(PropostaInvestSUS, pid, options=[selectinload(PropostaInvestSUS.programa),
                                                       selectinload(PropostaInvestSUS.parlamentar)])
    return await garantir_do_municipio(db, u, p, "is_propostas", pid)


async def _ficha_de(db, p: PropostaInvestSUS) -> FichaExecucao | None:
    return (await db.execute(select(FichaExecucao).where(FichaExecucao.proposta_id == p.id))).scalar_one_or_none()


async def _ficha_ou_criar(db, p: PropostaInvestSUS, u: UserOut) -> FichaExecucao:
    f = await _ficha_de(db, p)
    if f:
        return f
    f = FichaExecucao(municipio_id=p.municipio_id, proposta_id=p.id, situacao_plano="nao_cadastrado",
                      conta_bancaria=p.conta_bancaria, responsavel=p.responsavel_interno,
                      prazo_execucao=p.prazo_vigencia, criado_por=u.username)
    db.add(f)
    await db.flush()
    _aud(db, f, "ficha", f.id, "criacao", None, None, None, u)
    return f


def _aud(db, f: FichaExecucao, entidade: str, eid: int | None, evento: str, campo: str | None,
         anterior, novo, u: UserOut, justificativa: str | None = None, autorizacao: str | None = None) -> None:
    db.add(AuditoriaExecucao(ficha_id=f.id, municipio_id=f.municipio_id, entidade=entidade, entidade_id=eid,
                             evento=evento, campo=campo, valor_anterior=_str(anterior), valor_novo=_str(novo),
                             justificativa=justificativa, autorizacao=autorizacao, usuario=u.username))


async def _registro(db, u: UserOut, modelo, rid: int, tabela: str):
    reg = await garantir_do_municipio(db, u, await db.get(modelo, rid), tabela, rid)
    return reg, await db.get(FichaExecucao, reg.ficha_id)


async def _carregar(db, mid: int, proposta_ids: list[int] | None = None) -> dict:
    """Tudo que os cálculos precisam, em poucas consultas, sempre do município da sessão."""
    stmt = (select(PropostaInvestSUS)
            .options(selectinload(PropostaInvestSUS.programa), selectinload(PropostaInvestSUS.parlamentar))
            .where(PropostaInvestSUS.municipio_id == mid,
                   (PropostaInvestSUS.esfera.is_(None)) | (PropostaInvestSUS.esfera.in_(sorted(fed.ESFERAS_HABILITADAS)))))
    if proposta_ids is not None:
        stmt = stmt.where(PropostaInvestSUS.id.in_(proposta_ids or [-1]))
    props = (await db.execute(stmt)).scalars().all()
    if proposta_ids is None:
        # fora: canceladas/rejeitadas e as que não estão na lista oficial do InvestSUS
        props = [p for p in props if fed.fase_de(p.situacao_normalizada.value if p.situacao_normalizada else None)
                 not in FASES_FORA and p.conferencia_investsus != "nao_encontrada"]
    ids = [p.id for p in props] or [-1]
    fichas = {f.proposta_id: f for f in (await db.execute(
        select(FichaExecucao).where(FichaExecucao.municipio_id == mid, FichaExecucao.proposta_id.in_(ids)))).scalars()}
    fids = [f.id for f in fichas.values()] or [-1]

    def _agrupar(linhas, chave):
        out: dict[int, list] = {}
        for x in linhas:
            out.setdefault(getattr(x, chave), []).append(x)
        return out

    acoes = _agrupar((await db.execute(select(AcaoExecucao).where(AcaoExecucao.ficha_id.in_(fids))
                                       .order_by(AcaoExecucao.ordem, AcaoExecucao.id))).scalars(), "ficha_id")
    lancs = _agrupar((await db.execute(select(LancamentoExecucao).where(LancamentoExecucao.ficha_id.in_(fids))
                                       .order_by(LancamentoExecucao.data, LancamentoExecucao.id))).scalars(), "ficha_id")
    movs = _agrupar((await db.execute(select(MovimentoFinanceiro).where(MovimentoFinanceiro.ficha_id.in_(fids))
                                      .order_by(MovimentoFinanceiro.data, MovimentoFinanceiro.id))).scalars(), "ficha_id")
    pags = _agrupar((await db.execute(select(PagamentoInvestSUS).where(PagamentoInvestSUS.proposta_id.in_(ids))
                                      .order_by(PagamentoInvestSUS.data_pagamento))).scalars(), "proposta_id")
    docs = (await db.execute(select(DocumentoExecucao.ficha_id, DocumentoExecucao.lancamento_id)
                             .where(DocumentoExecucao.ficha_id.in_(fids), DocumentoExecucao.excluido_em.is_(None)))).all()
    docs_lanc: dict[int, set[int]] = {}
    for fid, lid in docs:
        if lid:
            docs_lanc.setdefault(fid, set()).add(lid)
    return {"props": props, "fichas": fichas, "acoes": acoes, "lancs": lancs, "movs": movs, "pags": pags,
            "docs_lanc": docs_lanc}


def _calcular(dados: dict, p: PropostaInvestSUS, hoje: date) -> dict:
    f = dados["fichas"].get(p.id)
    fid = f.id if f else None
    acoes = dados["acoes"].get(fid, []) if fid else []
    lancs = dados["lancs"].get(fid, []) if fid else []
    movs = dados["movs"].get(fid, []) if fid else []
    pags = dados["pags"].get(p.id, [])
    resumo = ex.resumo_ficha(p, f, acoes, lancs, movs, pags)
    cls = ex.classificar(p, f)
    al = ex.alertas(p, f, resumo, acoes, lancs, dados["docs_lanc"].get(fid, set()) if fid else set(), hoje)
    return {"ficha": f, "acoes": acoes, "lancs": lancs, "movs": movs, "pags": pags,
            "resumo": resumo, "classificacao": cls, "alertas": al}


def _situacao_plano(f: FichaExecucao | None, resumo: dict) -> str:
    if f and f.situacao_plano and f.situacao_plano != "nao_cadastrado":
        return f.situacao_plano
    return "em_elaboracao" if resumo["tem_plano"] else "nao_cadastrado"


def _linha(p: PropostaInvestSUS, c: dict) -> dict:
    r = {k: v for k, v in c["resumo"].items() if k != "acoes"}
    f = c["ficha"]
    sit = p.situacao_normalizada.value if p.situacao_normalizada else None
    fase = fed.fase_de(sit)
    return {
        "proposta_id": p.id, "ficha_id": f.id if f else None,
        "numero_proposta": p.numero_proposta, "numero_emenda": p.numero_emenda, "exercicio": p.exercicio,
        "objeto": p.objeto or p.finalidade, "programa": p.programa.nome if p.programa else None,
        "parlamentar": p.parlamentar.nome if p.parlamentar else None,
        "situacao_proposta": sit, "situacao_proposta_texto": p.situacao_original,
        "fase": fase, "fase_rotulo": fed.FASES.get(fase or "", "Não identificada"),
        "situacao_plano": _situacao_plano(f, c["resumo"]),
        "prazo_execucao": _str(f.prazo_execucao) if f else None,
        "responsavel": (f.responsavel if f else None) or p.responsavel_interno,
        "perc_fisico": p.perc_fisico,
        **c["classificacao"], **r,
        "alertas": len(c["alertas"]),
        "alertas_niveis": sorted({a["nivel"] for a in c["alertas"]}),
    }


def _filtrar(linhas: list[dict], origem, destinacao, fase, situacao_plano, busca) -> list[dict]:
    b = (busca or "").strip().lower()
    out = []
    for ln in linhas:
        if origem and ln["origem"] != origem:
            continue
        if destinacao and ln["destinacao"] != destinacao:
            continue
        if fase and ln["fase"] != fase:
            continue
        if situacao_plano and ln["situacao_plano"] != situacao_plano:
            continue
        if b and b not in " ".join(str(ln.get(k) or "") for k in
                                   ("numero_proposta", "numero_emenda", "objeto", "programa", "parlamentar")).lower():
            continue
        out.append(ln)
    return out


async def _painel_dados(db, u: UserOut, exercicio, origem, destinacao, fase, situacao_plano, busca, proposta_id=None):
    mid = u.municipio_id
    dados = await _carregar(db, mid)
    hoje = date.today()
    props = [p for p in dados["props"] if (not exercicio or p.exercicio == exercicio)
             and (not proposta_id or p.id == proposta_id)]
    calc = {p.id: _calcular(dados, p, hoje) for p in props}
    linhas = _filtrar([_linha(p, calc[p.id]) for p in props], origem, destinacao, fase, situacao_plano, busca)
    ids = {ln["proposta_id"] for ln in linhas}
    sel = [calc[i] for i in ids]
    return dados, calc, linhas, sel


# ── Painel consolidado ────────────────────────────────────────────────────────

@router.get("/painel")
async def painel(db: DbDep, u: SessaoMunicipal,
                 exercicio: int | None = Query(None), origem: str | None = Query(None),
                 destinacao: str | None = Query(None), fase: str | None = Query(None),
                 situacao_plano: str | None = Query(None), busca: str | None = Query(None),
                 proposta_id: int | None = Query(None)):
    dados, calc, linhas, sel = await _painel_dados(db, u, exercicio, origem, destinacao, fase, situacao_plano,
                                                    busca, proposta_id)
    cons = ex.consolidar([{"classificacao": c["classificacao"], "resumo": c["resumo"]} for c in sel])
    todos_lancs = [l for c in sel for l in c["lancs"]]
    todos_pags = [pg for c in sel for pg in c["pags"]]
    programas: dict[str, dict] = {}
    for ln in linhas:
        if ln["origem"] == "programa":
            g = programas.setdefault(ln["programa"] or "Programa não informado",
                                     {"programa": ln["programa"] or "Programa não informado", "qtd": 0,
                                      "aprovado": 0.0, "recebido": 0.0, "pago": 0.0})
            g["qtd"] += 1
            for k in ("aprovado", "recebido", "pago"):
                g[k] = round(g[k] + ln[k], 2)
    alertas_niveis: dict[str, int] = {}
    for c in sel:
        for a in c["alertas"]:
            alertas_niveis[a["nivel"]] = alertas_niveis.get(a["nivel"], 0) + 1
    anos = sorted({p.exercicio for p in dados["props"] if p.exercicio}, reverse=True)
    return {
        "municipio": u.municipio, "municipio_ibge": u.municipio_ibge,
        "permissoes": _permissoes(u),
        "filtros": {"exercicio": exercicio, "origem": origem, "destinacao": destinacao, "fase": fase,
                    "situacao_plano": situacao_plano, "busca": busca},
        "opcoes": {"anos": anos, "origens": ex.ORIGENS, "destinacoes": ex.DESTINACOES,
                   "fases": {k: v for k, v in fed.FASES.items() if k not in FASES_FORA},
                   "situacoes_plano": ex.SITUACOES_PLANO},
        "indicadores": {
            "total_propostas": len(linhas),
            "total_planos": cons["total"]["qtd_planos"],
            "aprovado": cons["total"]["aprovado"],
            "recebido": cons["total"]["recebido"],
            "empenhado": cons["total"]["empenhado"],
            "liquidado": cons["total"]["liquidado"],
            "pago": cons["total"]["pago"],
            "saldo_financeiro": cons["total"]["saldo_financeiro"],
            "saldo_plano": cons["total"]["saldo_plano"],
            "saldo_a_receber": cons["total"]["saldo_a_receber"],
            "valor_plano": cons["total"]["valor_plano"],
            "perc_execucao": cons["total"]["perc_execucao"],
            "aprovado_sem_plano": cons["total"]["aprovado_sem_plano"],
            "recebido_emendas": cons["emendas"]["recebido"],
            "propostas_sem_lancamento": sum(1 for ln in linhas if ln["sem_lancamento"]),
            "lancamentos_pendentes_validacao": sum(ln["pendentes_validacao"] for ln in linhas),
        },
        "consolidado": cons,
        "graficos": {
            "evolucao_mensal": ex.evolucao_mensal(todos_lancs, todos_pags),
            "programas_ms": sorted(programas.values(), key=lambda g: -g["recebido"]),
        },
        "alertas_por_nivel": alertas_niveis,
        "propostas": sorted(linhas, key=lambda ln: (-(ln["exercicio"] or 0), ln["numero_proposta"] or "")),
        "fontes": {
            "oficial": "Aprovado e repasses: InvestSUS/FNS sincronizados no ERSUS360.",
            "municipio": "Empenho, liquidação, pagamento, rendimentos e devoluções: lançados pelo município "
                         "(manual ou planilha) — não são dados confirmados pelo FNS.",
        },
        "gerado_em": datetime.utcnow().isoformat(),
    }


@router.get("/alertas")
async def alertas_execucao(db: DbDep, u: SessaoMunicipal, exercicio: int | None = Query(None)):
    _, calc, linhas, _ = await _painel_dados(db, u, exercicio, None, None, None, None, None)
    out = []
    for ln in linhas:
        for a in calc[ln["proposta_id"]]["alertas"]:
            out.append({**a, "proposta_id": ln["proposta_id"], "numero_proposta": ln["numero_proposta"],
                        "objeto": ln["objeto"], "responsavel": ln["responsavel"], "exercicio": ln["exercicio"]})
    ordem = {"critico": 0, "urgente": 1, "atencao": 2, "informativo": 3}
    out.sort(key=lambda a: (ordem.get(a["nivel"], 9), a["numero_proposta"] or ""))
    return {"total": len(out), "alertas": out,
            "aviso": "Saldo ainda não executado não é classificado como irregular por si só."}


# ── Ficha individual ──────────────────────────────────────────────────────────

def _acao_dict(a: AcaoExecucao, r: dict | None, lancs: list[LancamentoExecucao]) -> dict:
    return {
        "id": a.id, "ordem": a.ordem, "descricao": a.descricao, "grupo": a.grupo, "detalhamento": a.detalhamento,
        "natureza_despesa": a.natureza_despesa, "quantidade": a.quantidade, "unidade": a.unidade,
        "valor_unitario": a.valor_unitario, "origem_dado": a.origem_dado, "ativa": a.ativa,
        "motivo_inativacao": a.motivo_inativacao,
        "importada": bool(a.acao_servico_id or a.natureza_id),
        **(r or {}),
        "lancamentos": [_lanc_dict(l) for l in lancs if l.acao_id == a.id],
    }


def _lanc_dict(l: LancamentoExecucao) -> dict:
    return {c: _str(getattr(l, c)) if isinstance(getattr(l, c), (date, datetime)) else getattr(l, c) for c in (
        "id", "acao_id", "tipo", "natureza_despesa", "data", "valor", "fornecedor", "fornecedor_documento", "numero_empenho",
        "numero_liquidacao", "ordem_bancaria", "documento_comprobatorio", "historico", "origem_dado",
        "status_validacao", "validado_por", "validado_em", "cancelado", "cancelado_motivo", "cancelado_por",
        "criado_por", "criado_em")}


def _mov_dict(m: MovimentoFinanceiro) -> dict:
    return {c: _str(getattr(m, c)) if isinstance(getattr(m, c), (date, datetime)) else getattr(m, c) for c in (
        "id", "tipo", "data", "valor", "descricao", "documento", "origem_dado", "status_validacao", "cancelado",
        "cancelado_motivo", "cancelado_por", "criado_por", "criado_em")}


@router.get("/propostas/{proposta_id}")
async def ficha(proposta_id: int, db: DbDep, u: SessaoMunicipal):
    p = await _proposta(db, u, proposta_id)
    dados = await _carregar(db, u.municipio_id, [p.id])
    c = _calcular(dados, p, date.today())
    f = c["ficha"]
    docs, hist = [], []
    if f:
        docs = [{"id": d.id, "tipo": d.tipo, "nome": d.nome_original, "tamanho": d.tamanho,
                 "lancamento_id": d.lancamento_id, "descricao": d.descricao, "enviado_por": d.enviado_por,
                 "criado_em": _str(d.criado_em), "hash_sha256": d.hash_sha256}
                for d in (await db.execute(select(DocumentoExecucao).where(
                    DocumentoExecucao.ficha_id == f.id, DocumentoExecucao.excluido_em.is_(None))
                    .order_by(DocumentoExecucao.id.desc()))).scalars()]
        hist = [{"id": h.id, "entidade": h.entidade, "entidade_id": h.entidade_id, "evento": h.evento,
                 "campo": h.campo, "valor_anterior": h.valor_anterior, "valor_novo": h.valor_novo,
                 "justificativa": h.justificativa, "autorizacao": h.autorizacao, "usuario": h.usuario,
                 "criado_em": _str(h.criado_em)}
                for h in (await db.execute(select(AuditoriaExecucao).where(AuditoriaExecucao.ficha_id == f.id)
                                           .order_by(AuditoriaExecucao.id.desc()).limit(500))).scalars()]
    planos = (await db.execute(select(PlanoTrabalho).options(selectinload(PlanoTrabalho.acoes))
                               .where(PlanoTrabalho.proposta_id == p.id))).scalars().all()
    naturezas = (await db.execute(select(NaturezaDespesa).where(NaturezaDespesa.proposta_id == p.id))).scalars().all()
    ja_importadas = {a.acao_servico_id for a in c["acoes"] if a.acao_servico_id} | \
                    {a.natureza_id for a in c["acoes"] if a.natureza_id}
    importaveis = sum(1 for pl in planos for a in pl.acoes) + len(naturezas)
    linha = _linha(p, c)
    naturezas_plano = {n.codigo: {"descricao": n.descricao or NATUREZAS_SIAFI.get(n.codigo), "valor": n.valor_previsto or 0}
                       for n in naturezas}
    return {
        "permissoes": _permissoes(u),
        "identificacao": {
            "municipio": u.municipio, "municipio_ibge": u.municipio_ibge,
            **{k: linha[k] for k in ("proposta_id", "numero_proposta", "numero_emenda", "exercicio", "objeto",
                                     "programa", "parlamentar", "situacao_proposta", "situacao_proposta_texto",
                                     "fase_rotulo")},
            "acao_orcamentaria": p.acao_orcamentaria, "componente": p.componente,
            "tipo_financiamento": p.tipo_financiamento, "valor_indicado": p.valor_indicado,
            "valor_aprovado": p.valor_aprovado, "portaria_numero": p.portaria_numero,
            "conta_bancaria_proposta": p.conta_bancaria, "fonte_dado": p.fonte_dado,
            "ultima_consulta_investsus": _str(p.ultima_consulta_investsus),
        },
        "classificacao": c["classificacao"],
        "classificacao_automatica": {"origem": ex.origem_automatica(p), "destinacao": ex.destinacao_automatica(p)},
        "ficha": None if not f else {
            "id": f.id, "origem_recurso": f.origem_recurso, "destinacao": f.destinacao,
            "programa_acao": f.programa_acao or p.acao_orcamentaria, "conta_bancaria": f.conta_bancaria,
            "situacao_plano": _situacao_plano(f, c["resumo"]), "prazo_execucao": _str(f.prazo_execucao),
            "responsavel": f.responsavel, "observacoes": f.observacoes, "saldo_extrato": f.saldo_extrato,
            "saldo_extrato_data": _str(f.saldo_extrato_data), "plano_aprovado_em": _str(f.plano_aprovado_em),
            "plano_aprovado_por": f.plano_aprovado_por, "criado_em": _str(f.criado_em), "criado_por": f.criado_por,
        },
        "resumo": {k: v for k, v in c["resumo"].items() if k != "acoes"},
        "acoes": [_acao_dict(a, c["resumo"]["acoes"].get(a.id), c["lancs"]) for a in c["acoes"]],
        "lancamentos_sem_acao_ativa": [_lanc_dict(l) for l in c["lancs"]
                                       if l.acao_id not in {a.id for a in c["acoes"] if a.ativa}],
        "movimentos": [_mov_dict(m) for m in c["movs"]],
        "repasses_fns": [{"id": pg.id, "data": _str(pg.data_pagamento), "valor": pg.valor, "parcela": pg.parcela,
                          "ordem_bancaria": pg.ordem_bancaria, "fonte": pg.fonte_oficial or "InvestSUS/FNS",
                          "origem_dado": "oficial"} for pg in c["pags"]],
        "documentos": docs,
        "historico": hist,
        "alertas": c["alertas"],
        "importacao": {"disponiveis": importaveis,
                       "pendentes": sum(1 for pl in planos for a in pl.acoes if a.id not in ja_importadas)
                       + sum(1 for n in naturezas if n.id not in ja_importadas)},
        "evolucao_mensal": ex.evolucao_mensal(c["lancs"], c["pags"]),
        "naturezas": ex.resumo_naturezas(naturezas_plano, c["acoes"], c["lancs"]),
        "dados_gerais": {
            "ano": p.exercicio, "beneficiario": p.entidade_nome or p.fundo_saude, "dirigente": p.responsavel_legal,
            "municipio": u.municipio, "tipo_beneficiario": p.entidade_natureza_juridica or p.entidade_esfera,
            "cnpj": p.entidade_cnpj or u.municipio_cnpj_fundo, "numero_proposta": p.numero_proposta,
            "finalidade": p.finalidade or p.justificativa or p.resultados_esperados,
            "objeto": p.objeto, "valor": p.valor_aprovado or p.valor_proposta or p.valor_indicado,
            "parlamentar": p.parlamentar.nome if p.parlamentar else None,
        },
    }


CAMPOS_FICHA = ("origem_recurso", "destinacao", "programa_acao", "conta_bancaria", "situacao_plano",
                "prazo_execucao", "responsavel", "observacoes", "saldo_extrato", "saldo_extrato_data")


@router.put("/propostas/{proposta_id}/ficha")
async def atualizar_ficha(proposta_id: int, body: FichaUpdate, db: DbDep, u: SessaoMunicipal):
    _pode_lancar(u)
    p = await _proposta(db, u, proposta_id)
    f = await _ficha_ou_criar(db, p, u)
    dados = body.model_dump(exclude_unset=True)
    if "origem_recurso" in dados and dados["origem_recurso"] not in (None, "", *ex.ORIGENS):
        raise HTTPException(422, "Origem do recurso inválida.")
    if "destinacao" in dados and dados["destinacao"] not in (None, "", *ex.DESTINACOES):
        raise HTTPException(422, "Destinação inválida.")
    if "situacao_plano" in dados and dados["situacao_plano"] not in (None, "", *ex.SITUACOES_PLANO):
        raise HTTPException(422, "Situação do plano inválida.")
    for campo in CAMPOS_FICHA:
        if campo not in dados:
            continue
        novo = dados[campo]
        if campo in ("prazo_execucao", "saldo_extrato_data"):
            novo = _data(novo, campo)
        elif isinstance(novo, str):
            novo = novo.strip() or None
        antigo = getattr(f, campo)
        if antigo != novo:
            setattr(f, campo, novo)
            _aud(db, f, "ficha", f.id, "alteracao", campo, antigo, novo, u)
    f.atualizado_por = u.username
    await db.commit()
    return {"ok": True, "ficha_id": f.id}


@router.post("/propostas/{proposta_id}/importar-plano")
async def importar_plano(proposta_id: int, db: DbDep, u: SessaoMunicipal):
    """Copia as ações/metas do plano de trabalho já sincronizado do InvestSUS (ou, sem plano,
    as naturezas de despesa). Cada origem é importada uma única vez."""
    _pode_lancar(u)
    p = await _proposta(db, u, proposta_id)
    f = await _ficha_ou_criar(db, p, u)
    existentes = (await db.execute(select(AcaoExecucao).where(AcaoExecucao.ficha_id == f.id))).scalars().all()
    ja_acoes = {a.acao_servico_id for a in existentes if a.acao_servico_id}
    ja_nat = {a.natureza_id for a in existentes if a.natureza_id}
    ordem = max([a.ordem for a in existentes] or [0])
    novas = []
    planos = (await db.execute(select(PlanoTrabalho).options(selectinload(PlanoTrabalho.acoes))
                               .where(PlanoTrabalho.proposta_id == p.id))).scalars().all()
    acoes_plano: list[AcaoServico] = [a for pl in planos for a in pl.acoes]
    nat_codigos = sorted({n.codigo for n in (await db.execute(
        select(NaturezaDespesa).where(NaturezaDespesa.proposta_id == p.id))).scalars()})
    # Com uma única natureza no plano, toda ação usa essa natureza; com várias, a natureza
    # é escolhida em cada nota fiscal.
    nat_unica = nat_codigos[0] if len(nat_codigos) == 1 else None
    for a in acoes_plano:
        if a.id in ja_acoes:
            continue
        ordem += 1
        novas.append(AcaoExecucao(ficha_id=f.id, municipio_id=f.municipio_id, ordem=ordem,
                                  descricao=(a.descricao or a.categoria or "Ação do plano")[:300],
                                  grupo=(a.categoria or None) and a.categoria[:300], natureza_despesa=nat_unica,
                                  detalhamento=a.justificativa or a.meta_qualitativa,
                                  quantidade=a.meta_quantitativa, unidade=a.unidade_medida,
                                  valor_previsto_original=a.valor or 0, valor_previsto_atual=a.valor or 0,
                                  origem_dado="importado", acao_servico_id=a.id, criado_por=u.username))
    if not acoes_plano:
        for n in (await db.execute(select(NaturezaDespesa).where(NaturezaDespesa.proposta_id == p.id))).scalars():
            if n.id in ja_nat:
                continue
            ordem += 1
            novas.append(AcaoExecucao(ficha_id=f.id, municipio_id=f.municipio_id, ordem=ordem,
                                      descricao=(n.descricao or f"Natureza {n.codigo}")[:300],
                                      natureza_despesa=n.codigo, valor_previsto_original=n.valor_previsto or 0,
                                      valor_previsto_atual=n.valor_previsto or 0, origem_dado="importado",
                                      natureza_id=n.id, criado_por=u.username))
    for a in novas:
        db.add(a)
    await db.flush()
    for a in novas:
        _aud(db, f, "acao", a.id, "importacao", "valor_previsto", None, a.valor_previsto_atual, u,
             "Importada do plano de trabalho sincronizado do InvestSUS")
    if novas and (f.situacao_plano or "nao_cadastrado") == "nao_cadastrado":
        f.situacao_plano = "em_elaboracao"
    await db.commit()
    return {"importadas": len(novas),
            "origem": "plano_trabalho" if acoes_plano else "naturezas_despesa",
            "mensagem": (f"{len(novas)} ação(ões) importada(s)." if novas
                         else "Nada novo para importar: o plano sincronizado já está na planilha ou não há plano/naturezas no InvestSUS.")}


@router.post("/propostas/{proposta_id}/aprovar-plano")
async def aprovar_plano(proposta_id: int, db: DbDep, u: SessaoMunicipal):
    """Fixa o plano aprovado como referência original. Depois disso, alterar o previsto
    exige justificativa e identificação da autorização."""
    _pode_validar(u)
    p = await _proposta(db, u, proposta_id)
    f = await _ficha_ou_criar(db, p, u)
    if f.plano_aprovado_em:
        raise HTTPException(409, "O plano já foi registrado como aprovado.")
    acoes = (await db.execute(select(AcaoExecucao).where(AcaoExecucao.ficha_id == f.id,
                                                         AcaoExecucao.ativa.is_(True)))).scalars().all()
    if not acoes:
        raise HTTPException(422, "Cadastre as ações do plano antes de registrá-lo como aprovado.")
    for a in acoes:
        a.valor_previsto_original = a.valor_previsto_atual
    f.plano_aprovado_em = datetime.utcnow()
    f.plano_aprovado_por = u.username
    if f.situacao_plano in (None, "nao_cadastrado", "em_elaboracao"):
        f.situacao_plano = "aprovado"
    _aud(db, f, "ficha", f.id, "aprovacao_plano", "valor_plano", None,
         round(sum(a.valor_previsto_atual for a in acoes), 2), u)
    await db.commit()
    return {"ok": True}


# ── Ações (linhas da planilha) ────────────────────────────────────────────────

def _previsto(quantidade, valor_unitario, valor_previsto) -> float:
    if valor_previsto is not None:
        return round(float(valor_previsto), 2)
    if quantidade is not None and valor_unitario is not None:
        return round(float(quantidade) * float(valor_unitario), 2)
    return 0.0


@router.post("/propostas/{proposta_id}/acoes", status_code=201)
async def criar_acao(proposta_id: int, body: AcaoCreate, db: DbDep, u: SessaoMunicipal):
    _pode_lancar(u)
    if not body.descricao.strip():
        raise HTTPException(422, "Informe a descrição da ação.")
    p = await _proposta(db, u, proposta_id)
    f = await _ficha_ou_criar(db, p, u)
    previsto = _previsto(body.quantidade, body.valor_unitario, body.valor_previsto)
    if previsto < 0:
        raise HTTPException(422, "Valor previsto não pode ser negativo.")
    travado = bool(f.plano_aprovado_em)
    if travado and not ((body.justificativa or "").strip() and (body.autorizacao or "").strip()):
        raise HTTPException(422, "Plano já aprovado: nova ação exige justificativa e a autorização correspondente.")
    ordem = max([a.ordem for a in (await db.execute(select(AcaoExecucao).where(
        AcaoExecucao.ficha_id == f.id))).scalars()] or [0]) + 1
    a = AcaoExecucao(ficha_id=f.id, municipio_id=f.municipio_id, ordem=ordem, descricao=body.descricao.strip()[:300],
                     detalhamento=body.detalhamento, natureza_despesa=body.natureza_despesa,
                     quantidade=body.quantidade, unidade=body.unidade, valor_unitario=body.valor_unitario,
                     # ação incluída depois da aprovação não fazia parte do plano original
                     valor_previsto_original=0.0 if travado else previsto, valor_previsto_atual=previsto,
                     origem_dado="manual", criado_por=u.username)
    db.add(a)
    await db.flush()
    _aud(db, f, "acao", a.id, "criacao", "valor_previsto", None, previsto, u, body.justificativa, body.autorizacao)
    if (f.situacao_plano or "nao_cadastrado") == "nao_cadastrado":
        f.situacao_plano = "em_elaboracao"
    await db.commit()
    return {"id": a.id}


@router.put("/acoes/{acao_id}")
async def atualizar_acao(acao_id: int, body: AcaoUpdate, db: DbDep, u: SessaoMunicipal):
    _pode_lancar(u)
    a, f = await _registro(db, u, AcaoExecucao, acao_id, "is_exec_acoes")
    if not a.ativa:
        raise HTTPException(409, "Ação inativada não pode ser alterada.")
    dados = body.model_dump(exclude_unset=True)
    just, aut = (dados.pop("justificativa", None) or "").strip() or None, (dados.pop("autorizacao", None) or "").strip() or None
    novo_prev = dados.pop("valor_previsto", None)
    q = dados.get("quantidade", a.quantidade)
    vu = dados.get("valor_unitario", a.valor_unitario)
    if novo_prev is None and ("quantidade" in dados or "valor_unitario" in dados) and q is not None and vu is not None:
        novo_prev = q * vu
    muda_prev = novo_prev is not None and abs(round(float(novo_prev), 2) - a.valor_previsto_atual) > 0.004
    if muda_prev and round(float(novo_prev), 2) < 0:
        raise HTTPException(422, "Valor previsto não pode ser negativo.")
    if muda_prev and f.plano_aprovado_em and not (just and aut):
        raise HTTPException(422, "Plano aprovado: alterar o valor previsto exige justificativa e autorização.")
    if "descricao" in dados and not (dados["descricao"] or "").strip():
        raise HTTPException(422, "A descrição não pode ficar vazia.")
    for campo, novo in dados.items():
        antigo = getattr(a, campo)
        if antigo != novo:
            setattr(a, campo, novo)
            _aud(db, f, "acao", a.id, "alteracao", campo, antigo, novo, u, just, aut)
    if muda_prev:
        antigo = a.valor_previsto_atual
        a.valor_previsto_atual = round(float(novo_prev), 2)
        if not f.plano_aprovado_em:
            a.valor_previsto_original = a.valor_previsto_atual   # rascunho: ainda não há referência aprovada
        _aud(db, f, "acao", a.id, "alteracao", "valor_previsto", antigo, a.valor_previsto_atual, u, just, aut)
    await db.commit()
    return {"ok": True}


@router.post("/acoes/{acao_id}/inativar")
async def inativar_acao(acao_id: int, body: Motivo, db: DbDep, u: SessaoMunicipal):
    """Exclusão lógica: a linha sai da planilha, mas fica no histórico e seus lançamentos continuam contando."""
    _pode_lancar(u)
    if not body.motivo.strip():
        raise HTTPException(422, "Informe a justificativa.")
    a, f = await _registro(db, u, AcaoExecucao, acao_id, "is_exec_acoes")
    ativos = (await db.execute(select(LancamentoExecucao).where(LancamentoExecucao.acao_id == a.id,
                                                                LancamentoExecucao.cancelado.is_(False)))).scalars().all()
    if ativos:
        raise HTTPException(409, "A ação tem lançamentos ativos: cancele/estorne os lançamentos antes de excluí-la.")
    a.ativa = False
    a.motivo_inativacao = body.motivo.strip()
    _aud(db, f, "acao", a.id, "cancelamento", "ativa", True, False, u, a.motivo_inativacao)
    await db.commit()
    return {"ok": True}


# ── Lançamentos ───────────────────────────────────────────────────────────────

async def _novo_lancamento(db, f: FichaExecucao, a: AcaoExecucao, body: LancamentoCreate, u: UserOut,
                           origem: str = "manual") -> LancamentoExecucao:
    if body.tipo not in ex.TIPOS_LANCAMENTO:
        raise HTTPException(422, "Tipo de lançamento inválido.")
    valor = round(float(body.valor or 0), 2)
    if valor <= 0:
        raise HTTPException(422, "O valor deve ser maior que zero (use anulação/estorno para reduzir).")
    d = _data(body.data, "data")
    if body.tipo == "nota_fiscal" and not (body.documento_comprobatorio or "").strip():
        raise HTTPException(422, "Informe o número da nota fiscal.")
    natureza = re.sub(r"\D", "", body.natureza_despesa or "") or a.natureza_despesa
    chave = ex.chave_dedup(body.tipo, a.id, d, valor, body.numero_empenho, body.numero_liquidacao,
                           body.ordem_bancaria, body.fornecedor_documento, body.documento_comprobatorio,
                           body.fornecedor)
    # Documento numerado (OB, liquidação, empenho) não pode repetir em nenhuma proposta do
    # município; lançamento sem número só é comparado dentro da mesma ação.
    stmt = (select(LancamentoExecucao, PropostaInvestSUS.numero_proposta)
            .join(FichaExecucao, FichaExecucao.id == LancamentoExecucao.ficha_id)
            .join(PropostaInvestSUS, PropostaInvestSUS.id == FichaExecucao.proposta_id)
            .where(LancamentoExecucao.municipio_id == f.municipio_id, LancamentoExecucao.chave_dedup == chave))
    if not ex.chave_numerada(chave):
        stmt = stmt.where(LancamentoExecucao.ficha_id == f.id)
    dup = (await db.execute(stmt)).first()
    if dup:
        raise HTTPException(409, f"Lançamento duplicado: este {body.tipo.replace('_', ' ')} já foi registrado "
                                 f"(lançamento #{dup[0].id}, proposta {dup[1]}). Não é possível contá-lo duas vezes.")
    lanc = LancamentoExecucao(
        ficha_id=f.id, acao_id=a.id, municipio_id=f.municipio_id, tipo=body.tipo, data=d, valor=valor,
        natureza_despesa=natureza,
        fornecedor=(body.fornecedor or "").strip() or None,
        fornecedor_documento=re.sub(r"\D", "", body.fornecedor_documento or "") or None,
        numero_empenho=(body.numero_empenho or "").strip() or None,
        numero_liquidacao=(body.numero_liquidacao or "").strip() or None,
        ordem_bancaria=(body.ordem_bancaria or "").strip() or None,
        documento_comprobatorio=(body.documento_comprobatorio or "").strip() or None,
        historico=body.historico, origem_dado=origem, status_validacao="pendente",
        chave_dedup=chave, criado_por=u.username)
    db.add(lanc)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, "Lançamento duplicado: este documento já foi registrado nesta proposta.")
    _aud(db, f, "lancamento", lanc.id, "criacao", body.tipo, None, valor, u)
    if f.situacao_plano in (None, "nao_cadastrado", "em_elaboracao", "aprovado"):
        f.situacao_plano = "em_execucao"
    return lanc


@router.post("/acoes/{acao_id}/lancamentos", status_code=201)
async def criar_lancamento(acao_id: int, body: LancamentoCreate, db: DbDep, u: SessaoMunicipal):
    _pode_lancar(u)
    a, f = await _registro(db, u, AcaoExecucao, acao_id, "is_exec_acoes")
    if not a.ativa:
        raise HTTPException(409, "Ação inativada não recebe lançamentos.")
    lanc = await _novo_lancamento(db, f, a, body, u)
    await db.commit()
    return {"id": lanc.id}


@router.post("/lancamentos/{lancamento_id}/cancelar")
async def cancelar_lancamento(lancamento_id: int, body: Motivo, db: DbDep, u: SessaoMunicipal):
    """Sem exclusão definitiva: o lançamento fica no histórico, marcado como cancelado."""
    _pode_lancar(u)
    if not body.motivo.strip():
        raise HTTPException(422, "Informe a justificativa do cancelamento.")
    l, f = await _registro(db, u, LancamentoExecucao, lancamento_id, "is_exec_lancamentos")
    if l.cancelado:
        raise HTTPException(409, "Lançamento já cancelado.")
    l.cancelado, l.cancelado_motivo, l.cancelado_por, l.cancelado_em = True, body.motivo.strip(), u.username, datetime.utcnow()
    l.chave_cancelada, l.chave_dedup = l.chave_dedup, None
    _aud(db, f, "lancamento", l.id, "cancelamento", l.tipo, l.valor, None, u, l.cancelado_motivo)
    await db.commit()
    return {"ok": True}


@router.post("/lancamentos/{lancamento_id}/validar")
async def validar_lancamento(lancamento_id: int, body: Validacao, db: DbDep, u: SessaoMunicipal):
    _pode_validar(u)
    if body.status not in ("validado", "rejeitado"):
        raise HTTPException(422, "Status inválido.")
    l, f = await _registro(db, u, LancamentoExecucao, lancamento_id, "is_exec_lancamentos")
    antigo = l.status_validacao
    l.status_validacao, l.validado_por, l.validado_em = body.status, u.username, datetime.utcnow()
    _aud(db, f, "lancamento", l.id, "validacao", "status_validacao", antigo, body.status, u, body.observacao)
    await db.commit()
    return {"ok": True}


# ── Movimentos da conta vinculada ─────────────────────────────────────────────

@router.post("/propostas/{proposta_id}/movimentos", status_code=201)
async def criar_movimento(proposta_id: int, body: MovimentoCreate, db: DbDep, u: SessaoMunicipal):
    _pode_lancar(u)
    if body.tipo not in ex.TIPOS_MOVIMENTO:
        raise HTTPException(422, "Tipo de movimento inválido.")
    valor = round(float(body.valor or 0), 2)
    if valor <= 0:
        raise HTTPException(422, "O valor deve ser maior que zero.")
    p = await _proposta(db, u, proposta_id)
    f = await _ficha_ou_criar(db, p, u)
    d = _data(body.data, "data")
    existentes = (await db.execute(select(MovimentoFinanceiro).where(MovimentoFinanceiro.ficha_id == f.id,
                                                                     MovimentoFinanceiro.cancelado.is_(False)))).scalars().all()
    if body.tipo == "saldo_inicial" and any(m.tipo == "saldo_inicial" for m in existentes):
        raise HTTPException(409, "Já existe saldo inicial registrado: cancele-o antes de lançar outro.")
    if any(m.tipo == body.tipo and m.data == d and abs(m.valor - valor) < 0.005 for m in existentes):
        raise HTTPException(409, "Movimento duplicado: mesmo tipo, data e valor já registrados.")
    m = MovimentoFinanceiro(ficha_id=f.id, municipio_id=f.municipio_id, tipo=body.tipo, data=d, valor=valor,
                            descricao=body.descricao, documento=body.documento, origem_dado="manual",
                            criado_por=u.username)
    db.add(m)
    await db.flush()
    _aud(db, f, "movimento", m.id, "criacao", body.tipo, None, valor, u)
    await db.commit()
    return {"id": m.id}


@router.post("/movimentos/{movimento_id}/cancelar")
async def cancelar_movimento(movimento_id: int, body: Motivo, db: DbDep, u: SessaoMunicipal):
    _pode_lancar(u)
    if not body.motivo.strip():
        raise HTTPException(422, "Informe a justificativa do cancelamento.")
    m, f = await _registro(db, u, MovimentoFinanceiro, movimento_id, "is_exec_movimentos")
    if m.cancelado:
        raise HTTPException(409, "Movimento já cancelado.")
    m.cancelado, m.cancelado_motivo, m.cancelado_por = True, body.motivo.strip(), u.username
    _aud(db, f, "movimento", m.id, "cancelamento", m.tipo, m.valor, None, u, m.cancelado_motivo)
    await db.commit()
    return {"ok": True}


@router.post("/movimentos/{movimento_id}/validar")
async def validar_movimento(movimento_id: int, body: Validacao, db: DbDep, u: SessaoMunicipal):
    _pode_validar(u)
    if body.status not in ("validado", "rejeitado"):
        raise HTTPException(422, "Status inválido.")
    m, f = await _registro(db, u, MovimentoFinanceiro, movimento_id, "is_exec_movimentos")
    antigo = m.status_validacao
    m.status_validacao = body.status
    _aud(db, f, "movimento", m.id, "validacao", "status_validacao", antigo, body.status, u, body.observacao)
    await db.commit()
    return {"ok": True}


# ── Documentos ────────────────────────────────────────────────────────────────

@router.post("/propostas/{proposta_id}/documentos", status_code=201)
async def anexar(proposta_id: int, db: DbDep, u: SessaoMunicipal, arquivo: UploadFile = File(...),
                 tipo: str = Form("outro"), lancamento_id: int | None = Form(None), descricao: str | None = Form(None)):
    _pode_lancar(u)
    if tipo not in TIPOS_DOCUMENTO:
        raise HTTPException(422, "Tipo de documento inválido.")
    p = await _proposta(db, u, proposta_id)
    f = await _ficha_ou_criar(db, p, u)
    if lancamento_id:
        l = await garantir_do_municipio(db, u, await db.get(LancamentoExecucao, lancamento_id),
                                        "is_exec_lancamentos", lancamento_id)
        if l.ficha_id != f.id:
            raise HTTPException(422, "O lançamento não pertence a esta proposta.")
    nome = re.sub(r"[^\w.\- ]", "_", (arquivo.filename or "anexo"))[:200]
    ext = ("." + nome.rsplit(".", 1)[-1].lower()) if "." in nome else ""
    if ext not in EXTENSOES_ANEXO:
        raise HTTPException(422, "Tipo de arquivo não aceito (use PDF, imagem, documento ou planilha).")
    conteudo = await arquivo.read(TAMANHO_MAXIMO_ANEXO + 1)
    if len(conteudo) > TAMANHO_MAXIMO_ANEXO:
        raise HTTPException(413, "Arquivo acima de 10 MB.")
    if not conteudo:
        raise HTTPException(422, "Arquivo vazio.")
    sha = hashlib.sha256(conteudo).hexdigest()
    repetido = (await db.execute(select(DocumentoExecucao).where(
        DocumentoExecucao.ficha_id == f.id, DocumentoExecucao.hash_sha256 == sha,
        DocumentoExecucao.excluido_em.is_(None)))).scalars().first()
    if repetido:
        raise HTTPException(409, f"Este arquivo já foi anexado a esta proposta ({repetido.nome_original}).")
    relativo = f"investsus_execucao/{f.id}/{uuid.uuid4().hex}{ext}"
    pasta = pasta_municipio("documentos", f"investsus_execucao/{f.id}")
    (pasta / relativo.rsplit("/", 1)[-1]).write_bytes(conteudo)
    d = DocumentoExecucao(ficha_id=f.id, municipio_id=f.municipio_id, lancamento_id=lancamento_id, tipo=tipo,
                          nome_original=nome, caminho=relativo, tamanho=len(conteudo), hash_sha256=sha,
                          descricao=(descricao or "")[:300] or None, enviado_por=u.username)
    db.add(d)
    await db.flush()
    _aud(db, f, "documento", d.id, "anexo", tipo, None, nome, u)
    await db.commit()
    return {"id": d.id, "nome": nome, "tamanho": d.tamanho}


@router.get("/documentos/{documento_id}")
async def baixar_documento(documento_id: int, db: DbDep, u: SessaoMunicipal):
    d = await garantir_do_municipio(db, u, await db.get(DocumentoExecucao, documento_id),
                                    "is_exec_documentos", documento_id)
    if d.excluido_em:
        raise HTTPException(404, "Registro não encontrado")
    try:
        caminho = caminho_seguro(pasta_municipio("documentos"), d.caminho)
    except ValueError:
        raise HTTPException(404, "Registro não encontrado")
    if not caminho.exists():
        raise HTTPException(404, "Arquivo não encontrado no armazenamento")
    return FileResponse(caminho, filename=d.nome_original)


@router.post("/documentos/{documento_id}/remover")
async def remover_documento(documento_id: int, body: Motivo, db: DbDep, u: SessaoMunicipal):
    _pode_lancar(u)
    if not body.motivo.strip():
        raise HTTPException(422, "Informe a justificativa.")
    d, f = await _registro(db, u, DocumentoExecucao, documento_id, "is_exec_documentos")
    if d.excluido_em:
        raise HTTPException(409, "Documento já removido.")
    d.excluido_em, d.excluido_por = datetime.utcnow(), u.username
    _aud(db, f, "documento", d.id, "cancelamento", d.tipo, d.nome_original, None, u, body.motivo.strip())
    await db.commit()
    return {"ok": True}


# ── Planilha Excel (exportar / importar) ──────────────────────────────────────

COLS_PLANO = ["ID", "Ação/Despesa", "Detalhamento", "Natureza", "Quantidade", "Unidade", "Valor unitário",
              "Previsto original", "Previsto atualizado", "Empenhado", "Liquidado", "Pago", "Saldo a pagar",
              "Saldo do plano", "% execução"]
COLS_LANC = ["ID ação", "Ação", "Tipo", "Data", "Valor", "Fornecedor", "CNPJ fornecedor", "Nº empenho",
             "Nº liquidação", "Ordem bancária", "Documento comprobatório", "Histórico", "Origem", "Validação",
             "Cancelado"]


@router.get("/propostas/{proposta_id}/planilha.xlsx")
async def exportar_planilha(proposta_id: int, db: DbDep, u: SessaoMunicipal):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill

    dados = await ficha(proposta_id, db, u)
    wb = Workbook()
    ws = wb.active
    ws.title = "Plano"
    idf = dados["identificacao"]
    ws.append([f"Plano de trabalho — proposta {idf['numero_proposta']} ({idf['municipio']}, exercício {idf['exercicio'] or '—'})"])
    ws["A1"].font = Font(bold=True, size=12)
    ws.append(["Linhas com ID vazio são incluídas como novas ações na importação. Valores de execução vêm dos lançamentos."])
    ws.append(COLS_PLANO)
    for c in ws[3]:
        c.font, c.fill = Font(bold=True), PatternFill("solid", fgColor="DBEAFE")
    for a in dados["acoes"]:
        if not a["ativa"]:
            continue
        ws.append([a["id"], a["descricao"], a["detalhamento"], a["natureza_despesa"], a["quantidade"], a["unidade"],
                   a["valor_unitario"], a["previsto_original"], a["previsto"], a["empenhado"], a["liquidado"],
                   a["pago"], a["saldo_a_pagar"], a["saldo_plano"],
                   (a["perc_execucao"] or 0) / 100 if a["perc_execucao"] is not None else None])
    for row in ws.iter_rows(min_row=4, min_col=7, max_col=14):
        for c in row:
            c.number_format = '#,##0.00'
    for row in ws.iter_rows(min_row=4, min_col=15, max_col=15):
        for c in row:
            c.number_format = '0.0%'
    for col, w in zip("ABCDEFGHIJKLMNO", (8, 40, 30, 11, 11, 10, 14, 16, 16, 14, 14, 14, 14, 14, 10)):
        ws.column_dimensions[col].width = w
    wl = wb.create_sheet("Lançamentos")
    wl.append(COLS_LANC)
    for c in wl[1]:
        c.font, c.fill = Font(bold=True), PatternFill("solid", fgColor="DBEAFE")
    for a in dados["acoes"]:
        for l in a["lancamentos"]:
            wl.append([a["id"], a["descricao"], l["tipo"], l["data"], l["valor"], l["fornecedor"],
                       l["fornecedor_documento"], l["numero_empenho"], l["numero_liquidacao"], l["ordem_bancaria"],
                       l["documento_comprobatorio"], l["historico"], l["origem_dado"], l["status_validacao"],
                       "sim" if l["cancelado"] else ""])
    for col in "ABCDEFGHIJKLMNO":
        wl.column_dimensions[col].width = 18
    wt = wb.create_sheet("Tipos")
    wt.append(["Tipos de lançamento aceitos na importação"])
    for t in ex.TIPOS_LANCAMENTO:
        wt.append([t])
    buf = io.BytesIO()
    wb.save(buf)
    nome = f"plano_execucao_{re.sub(r'[^0-9A-Za-z]', '', idf['numero_proposta'] or str(proposta_id))}.xlsx"
    return Response(buf.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{nome}"'})


def _num(v) -> float | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace("R$", "").replace(" ", "")
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _data_planilha(v) -> str | None:
    if isinstance(v, datetime):
        return v.date().isoformat()
    if isinstance(v, date):
        return v.isoformat()
    s = str(v or "").strip()
    m = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", s)
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else (s[:10] or None)


@router.post("/propostas/{proposta_id}/planilha/importar")
async def importar_planilha(proposta_id: int, db: DbDep, u: SessaoMunicipal, arquivo: UploadFile = File(...),
                            confirmar: bool = Form(False)):
    """Importa a planilha no formato exportado: novas ações (ID vazio) e lançamentos.
    Com confirmar=false só mostra a prévia. Duplicados são ignorados e listados."""
    _pode_lancar(u)
    from openpyxl import load_workbook

    conteudo = await arquivo.read(TAMANHO_MAXIMO_ANEXO + 1)
    if len(conteudo) > TAMANHO_MAXIMO_ANEXO:
        raise HTTPException(413, "Arquivo acima de 10 MB.")
    try:
        wb = load_workbook(io.BytesIO(conteudo), data_only=True, read_only=True)
    except Exception:
        raise HTTPException(422, "Arquivo não reconhecido: use a planilha .xlsx exportada pelo ERSUS360.")
    if "Plano" not in wb.sheetnames:
        raise HTTPException(422, "Aba 'Plano' não encontrada: use a planilha exportada pelo ERSUS360.")
    p = await _proposta(db, u, proposta_id)
    f = await _ficha_de(db, p)
    acoes_exist = {} if not f else {a.id: a for a in (await db.execute(
        select(AcaoExecucao).where(AcaoExecucao.ficha_id == f.id))).scalars()}
    novas, erros, lancs = [], [], []
    for i, row in enumerate(wb["Plano"].iter_rows(min_row=4, values_only=True), start=4):
        if not row or not any(row[:9]):
            continue
        rid, desc = row[0], (str(row[1] or "")).strip()
        if rid not in (None, ""):
            continue  # ação existente: valores de execução vêm dos lançamentos
        if not desc:
            erros.append(f"Plano, linha {i}: descrição vazia.")
            continue
        prev = _num(row[8]) if len(row) > 8 else None
        novas.append({"linha": i, "descricao": desc[:300], "detalhamento": row[2], "natureza_despesa":
                      str(row[3]) if row[3] else None, "quantidade": _num(row[4]), "unidade": row[5],
                      "valor_unitario": _num(row[6]), "valor_previsto": prev})
    if "Lançamentos" in wb.sheetnames:
        desc_map = {a.descricao.strip().lower(): a.id for a in acoes_exist.values() if a.ativa}
        for i, row in enumerate(wb["Lançamentos"].iter_rows(min_row=2, values_only=True), start=2):
            if not row or not any(row[:5]):
                continue
            if len(row) > 14 and str(row[14] or "").strip().lower() == "sim":
                continue
            aid = int(row[0]) if isinstance(row[0], (int, float)) else None
            if aid is None and row[1]:
                aid = desc_map.get(str(row[1]).strip().lower())
                if aid is None:
                    aid = next((f"nova:{n['linha']}" for n in novas
                                if n["descricao"].lower() == str(row[1]).strip().lower()), None)
            if aid is None or (isinstance(aid, int) and aid not in acoes_exist):
                erros.append(f"Lançamentos, linha {i}: ação não encontrada nesta proposta.")
                continue
            tipo = str(row[2] or "").strip().lower()
            if tipo not in ex.TIPOS_LANCAMENTO:
                erros.append(f"Lançamentos, linha {i}: tipo '{row[2]}' inválido.")
                continue
            valor = _num(row[4])
            dt = _data_planilha(row[3])
            if not valor or valor <= 0 or not dt:
                erros.append(f"Lançamentos, linha {i}: data ou valor inválido.")
                continue
            lancs.append({"linha": i, "acao": aid, "tipo": tipo, "data": dt, "valor": valor,
                          "fornecedor": row[5], "fornecedor_documento": str(row[6]) if row[6] else None,
                          "numero_empenho": str(row[7]) if row[7] else None,
                          "numero_liquidacao": str(row[8]) if row[8] else None,
                          "ordem_bancaria": str(row[9]) if row[9] else None,
                          "documento_comprobatorio": str(row[10]) if row[10] else None, "historico": row[11]})
    if not confirmar:
        return {"previa": True, "novas_acoes": len(novas), "lancamentos": len(lancs), "erros": erros[:50],
                "acoes": [n["descricao"] for n in novas][:50]}
    f = await _ficha_ou_criar(db, p, u)
    if novas and f.plano_aprovado_em:
        raise HTTPException(422, "Plano já aprovado: inclua novas ações pela tela, com justificativa e autorização.")
    ids_novas: dict[str, int] = {}
    ordem = max([a.ordem for a in acoes_exist.values()] or [0])
    for n in novas:
        ordem += 1
        prev = _previsto(n["quantidade"], n["valor_unitario"], n["valor_previsto"])
        a = AcaoExecucao(ficha_id=f.id, municipio_id=f.municipio_id, ordem=ordem, descricao=n["descricao"],
                         detalhamento=n["detalhamento"], natureza_despesa=n["natureza_despesa"],
                         quantidade=n["quantidade"], unidade=n["unidade"], valor_unitario=n["valor_unitario"],
                         valor_previsto_original=prev, valor_previsto_atual=prev, origem_dado="importado",
                         criado_por=u.username)
        db.add(a)
        await db.flush()
        ids_novas[f"nova:{n['linha']}"] = a.id
        acoes_exist[a.id] = a
        _aud(db, f, "acao", a.id, "importacao", "valor_previsto", None, prev, u, f"Planilha {arquivo.filename}")
    criados, duplicados = 0, []
    for ln in lancs:
        aid = ids_novas.get(ln["acao"]) if isinstance(ln["acao"], str) else ln["acao"]
        corpo = LancamentoCreate(**{k: ln[k] for k in LancamentoCreate.model_fields if k in ln})
        try:
            await _novo_lancamento(db, f, acoes_exist[aid], corpo, u, origem="importado")
            criados += 1
        except HTTPException as e:
            if e.status_code == 409:
                duplicados.append(f"Lançamentos, linha {ln['linha']}: já registrado (ignorado).")
            else:
                erros.append(f"Lançamentos, linha {ln['linha']}: {e.detail}")
    await db.commit()
    return {"previa": False, "acoes_criadas": len(novas), "lancamentos_criados": criados,
            "duplicados": duplicados[:50], "erros": erros[:50]}


# ── Relatórios ────────────────────────────────────────────────────────────────

@router.get("/relatorios/{tipo}")
async def relatorio(tipo: str, db: DbDep, u: SessaoMunicipal, formato: str = Query("pdf"),
                    exercicio: int | None = Query(None), origem: str | None = Query(None),
                    destinacao: str | None = Query(None), proposta_id: int | None = Query(None)):
    from services import investsus_execucao_relatorios as rel

    if tipo not in rel.TIPOS:
        raise HTTPException(404, "Relatório não encontrado.")
    if formato not in ("pdf", "xlsx"):
        raise HTTPException(422, "Formato deve ser pdf ou xlsx.")
    if tipo == "individual" and not proposta_id:
        raise HTTPException(422, "Escolha a proposta para o relatório individual.")
    painel_ = await painel(db, u, exercicio, origem, destinacao, None, None, None, None)
    alertas_ = await alertas_execucao(db, u, exercicio)
    ficha_ = await ficha(proposta_id, db, u) if tipo == "individual" else None
    doc = rel.montar(tipo, painel_, alertas_, ficha_)
    conteudo = rel.pdf(doc, u.nome or u.username) if formato == "pdf" else rel.xlsx(doc, u.nome or u.username)
    mime = "application/pdf" if formato == "pdf" else \
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    nome = f"investsus_execucao_{tipo}_{date.today():%Y%m%d}.{formato}"
    return Response(conteudo, media_type=mime, headers={"Content-Disposition": f'attachment; filename="{nome}"'})


# ── Controle da emenda no modelo das planilhas do Fundo ───────────────────────
# "DADOS GERAIS DA EMENDA" + uma aba por finalidade do plano (entrada = valor da
# finalidade; cada nota fiscal é uma saída com elemento de despesa, fornecedor, nº da NF,
# valor e saldo atual) + uma aba com o saldo por natureza de despesa.

def _nome_aba(texto: str, usados: set[str]) -> str:
    base = re.sub(r"[\[\]:*?/\\]", " ", texto).strip()[:31] or "Aba"
    nome, i = base, 2
    while nome.lower() in usados:
        sufixo = f" ({i})"
        nome, i = base[:31 - len(sufixo)] + sufixo, i + 1
    usados.add(nome.lower())
    return nome


def _brl(v: float) -> str:
    return f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _natureza_fmt(cod: str | None) -> str:
    c = re.sub(r"\D", "", cod or "")
    return f"{c[0]}.{c[1]}.{c[2:4]}.{c[4:6]}" if len(c) == 6 else (cod or "—")


@router.get("/propostas/{proposta_id}/controle.xlsx")
async def exportar_controle(proposta_id: int, db: DbDep, u: SessaoMunicipal):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

    dados = await ficha(proposta_id, db, u)
    dg, r = dados["dados_gerais"], dados["resumo"]
    nomes_nat = {n["codigo"]: n["descricao"] for n in dados["naturezas"]}
    fino = Side(style="thin", color="94A3B8")
    borda = Border(left=fino, right=fino, top=fino, bottom=fino)
    cab = PatternFill("solid", fgColor="DBEAFE")
    moeda = '"R$" #,##0.00'

    wb = Workbook()
    ws = wb.active
    ws.title = "DADOS GERAIS DA EMENDA"
    ws.append(["Campo", "Valor"])
    for c in ws[1]:
        c.font, c.fill, c.border = Font(bold=True), cab, borda
    linhas = [("Ano", dg["ano"]), ("Beneficiário", dg["beneficiario"]), ("Dirigente", dg["dirigente"]),
              ("Município", dg["municipio"]), ("Tipo de Beneficiário", dg["tipo_beneficiario"]), ("CNPJ", dg["cnpj"]),
              ("Nº da Proposta", dg["numero_proposta"]), ("Origem do recurso", dados["classificacao"]["origem_rotulo"]),
              ("Parlamentar", dg["parlamentar"]), ("Finalidade", dg["finalidade"]), ("Objeto", dg["objeto"]),
              ("Valor da Proposta (R$)", dg["valor"]), ("Recebido do FNS (R$) — oficial", r["recebido"]),
              ("Notas fiscais baixadas (R$) — lançado pelo município", r["pago"]),
              ("Saldo do plano (R$)", r["saldo_plano"]), ("Saldo financeiro em conta (R$)", r["saldo_financeiro"])]
    for campo, valor in linhas:
        ws.append([campo, valor if valor not in (None, "") else "—"])
        ws.cell(ws.max_row, 1).font = Font(bold=True)
        for c in ws[ws.max_row]:
            c.border, c.alignment = borda, Alignment(wrap_text=True, vertical="top")
        if isinstance(valor, (int, float)) and "R$" in campo:
            ws.cell(ws.max_row, 2).number_format = moeda
    ws.column_dimensions["A"].width, ws.column_dimensions["B"].width = 42, 110

    acoes = [a for a in dados["acoes"] if a["ativa"]]
    grupos: dict[str, list] = {}
    for a in acoes:
        grupos.setdefault(a["grupo"] or a["descricao"], []).append(a)
    usados = {ws.title.lower()}
    colunas = ["DATA", "FINALIDADE / AÇÃO", "VALOR PREVISTO", "ELEMENTO DE DESPESA", "FORNECEDOR",
               "Nº NOTA FISCAL", "VALOR", "SALDO ATUAL"]
    for grupo, itens in grupos.items():
        total = round(sum(a["previsto"] for a in itens), 2)
        wg = wb.create_sheet(_nome_aba(f"{_brl(total)} {grupo}", usados))
        wg.append([f"CONTROLE EXECUÇÃO — {dados['classificacao']['origem_rotulo'].upper()} — PROPOSTA "
                   f"{dg['numero_proposta']} — FINALIDADE: {grupo.upper()} — R$ {_brl(total)}"])
        wg.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(colunas))
        wg["A1"].font, wg["A1"].alignment = Font(bold=True, size=12), Alignment(wrap_text=True)
        wg.row_dimensions[1].height = 34
        wg.append(colunas)
        for c in wg[2]:
            c.font, c.fill, c.border = Font(bold=True), cab, borda
            c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        wg.append(["ENTRADA", grupo, total, None, None, None, None, total])
        for c in wg[3]:
            c.font, c.border = Font(bold=True), borda
        saldo_ref = "H3"
        for a in itens:
            wg.append([None, a["descricao"], a["previsto"], _natureza_fmt(a["natureza_despesa"]) if a["natureza_despesa"] else "vários",
                       None, None, None, None])
            for c in wg[wg.max_row]:
                c.border, c.fill = borda, PatternFill("solid", fgColor="F1F5F9")
            for l in a["lancamentos"]:
                if l["cancelado"] or l["tipo"] not in ex.TIPOS_PAGO:
                    continue
                sinal = ex.TIPOS_LANCAMENTO[l["tipo"]][1]
                nat = l["natureza_despesa"] or a["natureza_despesa"]
                wg.append([date.fromisoformat(l["data"]), l["historico"] or a["descricao"], None,
                           f"{_natureza_fmt(nat)} {nomes_nat.get(nat) or ''}".strip(), l["fornecedor"],
                           l["documento_comprobatorio"] or l["ordem_bancaria"], sinal * l["valor"], None])
                linha = wg.max_row
                wg.cell(linha, 8).value = f"={saldo_ref}-G{linha}"
                saldo_ref = f"H{linha}"
                wg.cell(linha, 1).number_format = "DD/MM/YYYY"
                for c in wg[linha]:
                    c.border = borda
        for row in wg.iter_rows(min_row=3, min_col=3, max_col=3):
            for c in row:
                c.number_format = moeda
        for row in wg.iter_rows(min_row=3, min_col=7, max_col=8):
            for c in row:
                c.number_format = moeda
        for col, w in zip("ABCDEFGH", (12, 60, 16, 30, 32, 16, 16, 16)):
            wg.column_dimensions[col].width = w

    wn = wb.create_sheet(_nome_aba("SALDO POR NATUREZA", usados))
    wn.append(["Elemento", "Descrição", "Previsto no plano (InvestSUS)", "Notas baixadas", "Saldo"])
    for c in wn[1]:
        c.font, c.fill, c.border = Font(bold=True), cab, borda
    for n in dados["naturezas"]:
        wn.append([_natureza_fmt(n["codigo"]), n["descricao"] or ("Sem natureza informada" if n["codigo"] == "sem_natureza" else ""),
                   n["previsto"], n["pago"], n["saldo"]])
        for c in wn[wn.max_row]:
            c.border = borda
    for row in wn.iter_rows(min_row=2, min_col=3, max_col=5):
        for c in row:
            c.number_format = moeda
    for col, w in zip("ABCDE", (14, 60, 26, 18, 18)):
        wn.column_dimensions[col].width = w

    buf = io.BytesIO()
    wb.save(buf)
    nome = f"controle_emenda_{re.sub(r'[^0-9A-Za-z]', '', dg['numero_proposta'] or str(proposta_id))}.xlsx"
    return Response(buf.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{nome}"'})


@router.post("/propostas/{proposta_id}/controle/importar")
async def importar_controle(proposta_id: int, db: DbDep, u: SessaoMunicipal, arquivo: UploadFile = File(...),
                            confirmar: bool = Form(False), data_padrao: str | None = Form(None),
                            mapa: str | None = Form(None)):
    """Importa as notas fiscais das planilhas de controle já preenchidas (modelos MAC e PAP
    do Fundo). Prévia primeiro (confirmar=false); `mapa` = JSON {aba: acao_id} para as abas
    que a prévia não conseguiu vincular; `data_padrao` para notas sem data na planilha.
    Nota repetida (mesmo nº + fornecedor) é ignorada."""
    import json

    from openpyxl import load_workbook

    from services import investsus_controle_importacao as imp

    _pode_lancar(u)
    conteudo = await arquivo.read(TAMANHO_MAXIMO_ANEXO + 1)
    if len(conteudo) > TAMANHO_MAXIMO_ANEXO:
        raise HTTPException(413, "Arquivo acima de 10 MB.")
    try:
        wb = load_workbook(io.BytesIO(conteudo), data_only=True)
    except Exception:
        raise HTTPException(422, "Arquivo não reconhecido: envie a planilha .xlsx de controle da emenda.")
    p = await _proposta(db, u, proposta_id)
    f = await _ficha_de(db, p)
    acoes = [] if not f else (await db.execute(select(AcaoExecucao).where(
        AcaoExecucao.ficha_id == f.id, AcaoExecucao.ativa.is_(True)).order_by(AcaoExecucao.ordem))).scalars().all()
    if not acoes:
        raise HTTPException(422, "Converta o plano do InvestSUS em planilha antes de importar as notas.")
    lido = imp.ler_planilha(wb)
    try:
        escolhas = {k: int(v) for k, v in (json.loads(mapa) if mapa else {}).items() if v}
    except (ValueError, TypeError):
        raise HTTPException(422, "Vínculo de abas inválido.")
    d_padrao = _data(data_padrao, "data_padrao") if data_padrao else None
    info = [{"id": a.id, "descricao": a.descricao, "grupo": a.grupo, "natureza_despesa": a.natureza_despesa} for a in acoes]
    por_id = {a.id: a for a in acoes}
    numero_planilha = re.sub(r"\D", "", lido["numero_proposta"] or "")
    numero_proposta = re.sub(r"\D", "", p.numero_proposta or "")
    # nº grande lido como número no Excel perde os últimos dígitos: compara só o começo
    confere = (not numero_planilha) or numero_planilha[:14] == numero_proposta[:14]

    abas, notas_validas = [], []
    for aba in lido["abas"]:
        acao_id, motivo = (escolhas[aba["aba"]], "escolhida na prévia") if aba["aba"] in escolhas else imp.vincular(aba, info)
        if acao_id and acao_id not in por_id:
            acao_id, motivo = None, "ação escolhida não pertence a esta proposta"
        grupo = por_id[acao_id].grupo if acao_id else None
        candidatas = [a for a in info if grupo and a["grupo"] == grupo] or ([next(a for a in info if a["id"] == acao_id)] if acao_id else [])
        sem_data = 0
        for n in aba["notas"]:
            alvo = acao_id
            if len(candidatas) > 1 and n["historico"]:
                melhor = max(candidatas, key=lambda a: imp._parecido(n["historico"], a["descricao"]))
                if imp._parecido(n["historico"], melhor["descricao"]) >= 0.35:
                    alvo = melhor["id"]
            data_nota = n["data"] or (d_padrao.isoformat() if d_padrao else None)
            if not data_nota:
                sem_data += 1
            if alvo and data_nota:
                notas_validas.append({**n, "acao_id": alvo, "data": data_nota, "aba": aba["aba"]})
        abas.append({"aba": aba["aba"], "modelo": aba["modelo"], "natureza": aba["natureza"], "finalidade": aba["finalidade"],
                     "acao_id": acao_id, "acao": por_id[acao_id].descricao if acao_id else None, "motivo": motivo,
                     "notas": len(aba["notas"]), "valor": round(sum(n["valor"] for n in aba["notas"]), 2),
                     "sem_data": sem_data, "sem_numero": sum(1 for n in aba["notas"] if not n["nota_fiscal"]),
                     "avisos": aba["avisos"]})
    resumo = {"numero_planilha": lido["numero_proposta"], "confere_proposta": confere, "abas": abas,
              "acoes": [{"id": a["id"], "descricao": a["descricao"], "grupo": a["grupo"]} for a in info],
              "notas_a_importar": len(notas_validas), "valor_a_importar": round(sum(n["valor"] for n in notas_validas), 2)}
    if not confirmar:
        return {"previa": True, **resumo}
    if not confere:
        raise HTTPException(422, f"A planilha é da proposta {lido['numero_proposta']}, não da {p.numero_proposta}.")
    criadas, duplicadas, erros = 0, [], []
    for n in notas_validas:
        corpo = LancamentoCreate(
            tipo="nota_fiscal", data=n["data"], valor=n["valor"], natureza_despesa=n["natureza"],
            fornecedor=n["fornecedor"], documento_comprobatorio=n["nota_fiscal"] or f"S/N {n['aba'][:20]} L{n['linha']}",
            historico=n["historico"])
        try:
            await _novo_lancamento(db, f, por_id[n["acao_id"]], corpo, u, origem="importado")
            criadas += 1
        except HTTPException as e:
            (duplicadas if e.status_code == 409 else erros).append(f"{n['aba']}, linha {n['linha']}: {e.detail}")
    _aud(db, f, "ficha", f.id, "importacao", "notas_planilha_controle", None, criadas, u, f"Planilha {arquivo.filename}")
    await db.commit()
    return {"previa": False, **resumo, "criadas": criadas, "duplicadas": duplicadas[:50], "erros": erros[:50]}
