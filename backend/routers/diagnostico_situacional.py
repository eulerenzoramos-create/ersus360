"""
Router: /api/diagnostico-situacional — Diagnóstico Situacional da Saúde Municipal.

Multi-município: tudo é filtrado pelo município da sessão (registro de outro município → 404 auditado).
Leitura: qualquer perfil do município. Escrita: perfis de edição (admin, gestor, financeiro, contabilidade)
ou administrador-geral. Toda escrita vai para a trilha de auditoria e para o histórico do item.

  GET    /catalogo                              9 áreas, itens, modos de verificação, rótulos
  GET    /diagnosticos                          histórico de diagnósticos do município
  POST   /diagnosticos                          cria (exercício + período) e roda a coleta automática
  GET    /diagnosticos/{id}                     cabeçalho + itens
  PUT    /diagnosticos/{id}                     responsável, objetivo, observações, situação
  POST   /diagnosticos/{id}/coletar             nova coleta automática (não toca item validado/declarado)
  GET    /diagnosticos/{id}/painel              painel executivo (totais, problemas, evolução, alertas)
  GET    /diagnosticos/{id}/comparar?com=ID     comparação entre dois períodos
  GET    /diagnosticos/{id}/relatorio.pdf       relatório executivo (12 seções)
  PUT    /itens/{id}                            declaração/edição técnica do item
  POST   /itens/{id}/validar                    confirmar ou contestar
  GET    /itens/{id}/historico                  trilha do item
  POST   /itens/{id}/anexos                     anexa evidência
  GET    /anexos/{id}                           baixa evidência
  DELETE /anexos/{id}                           remove (exclusão lógica)
  GET    /diagnosticos/{id}/acoes               plano de ação 5W2H
  POST   /diagnosticos/{id}/acoes               nova ação (só para problema validado)
  PUT    /acoes/{id}                            edita ação
  DELETE /acoes/{id}                            exclusão lógica
  GET    /piloto                                matriz do que tem dado, exige integração ou levantamento
"""
from __future__ import annotations

import re
import uuid
from datetime import date, datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.diagnostico_situacional import DiagAcao, DiagAnexo, DiagDiagnostico, DiagHistorico, DiagItem
from routers.auth import UserOut, ip_de
from services import diagnostico as svc
from services import diagnostico_catalogo as cat
from services import diagnostico_relatorio as rel
from services.diagnostico_fontes import COLETORES
from tenancy.arquivos import caminho_seguro, pasta_municipio
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal, garantir_do_municipio

router = APIRouter(prefix="/api/diagnostico-situacional", tags=["Diagnóstico Situacional da Saúde Municipal"])

PERFIS_EDICAO = {"admin", "gestor", "financeiro", "contabilidade"}
TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024
EXTENSOES_ANEXO = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx", ".odt", ".ods", ".csv", ".txt"}

Classificacao = Literal["regular", "pendencia", "critico", "nao_se_aplica", "nao_verificado"]
Prioridade = Literal["alta", "media", "baixa"]


def _pode_editar(u: UserOut) -> None:
    if not (u.administrador_geral or u.role in PERFIS_EDICAO):
        raise HTTPException(403, "Perfil sem permissão para alterar o diagnóstico")


async def _diag(db: AsyncSession, u: UserOut, diag_id: int) -> DiagDiagnostico:
    return await garantir_do_municipio(db, u, await db.get(DiagDiagnostico, diag_id), "diag_diagnostico", diag_id)


async def _item(db: AsyncSession, u: UserOut, item_id: int) -> DiagItem:
    return await garantir_do_municipio(db, u, await db.get(DiagItem, item_id), "diag_item", item_id)


def _editavel(d: DiagDiagnostico) -> None:
    if d.situacao == "concluido":
        raise HTTPException(409, "Diagnóstico concluído: reabra-o para alterar.")


# ── Catálogo e piloto ─────────────────────────────────────────────────────────

@router.get("/catalogo")
async def catalogo(current: SessaoMunicipal):
    return {
        "areas": [{"area": a, "nome": n, "itens": [
            {"codigo": i.codigo, "titulo": i.titulo, "pergunta": i.pergunta, "modo": i.modo,
             "modo_rotulo": cat.MODOS[i.modo], "fonte_sugerida": i.fonte_sugerida,
             "evidencia_esperada": i.evidencia_esperada, "coleta_automatica": i.codigo in COLETORES}
            for i in cat.itens_da_area(a)]} for a, n in cat.AREAS.items()],
        "classificacoes": cat.CLASSIFICACOES, "origens": cat.ORIGENS, "validacoes": cat.VALIDACOES,
        "naturezas": cat.NATUREZAS, "prioridades": cat.PRIORIDADES, "status_acao": cat.STATUS_ACAO,
        "modos": cat.MODOS, "periodos": list(cat.PERIODOS),
    }


@router.get("/piloto")
async def piloto(current: SessaoMunicipal):
    """O que já tem dado automático, o que exige integração e o que depende de levantamento municipal.
    Não traz resultado: só a matriz de verificação (os resultados vêm de um diagnóstico gerado)."""
    return {"municipio": current.municipio, "ibge": current.municipio_ibge,
            "areas": [{"area": a, "nome": n, **{m: [f"{i.codigo} {i.titulo}" for i in cat.itens_da_area(a) if i.modo == m]
                                                for m in cat.MODOS}} for a, n in cat.AREAS.items()],
            "totais": {m: sum(1 for i in cat.ITENS if i.modo == m) for m in cat.MODOS}}


# ── Diagnósticos ──────────────────────────────────────────────────────────────

class DiagnosticoIn(BaseModel):
    exercicio: int = Field(ge=2018, le=2100)
    periodo_tipo: Literal["anual", "quadrimestre", "semestre"]
    periodo: int = Field(ge=0, le=3)
    responsavel_tecnico: Optional[str] = Field(None, max_length=150)
    objetivo: Optional[str] = Field(None, max_length=4000)


class DiagnosticoUpd(BaseModel):
    responsavel_tecnico: Optional[str] = Field(None, max_length=150)
    objetivo: Optional[str] = Field(None, max_length=4000)
    observacoes: Optional[str] = Field(None, max_length=8000)
    situacao: Optional[Literal["em_elaboracao", "em_validacao", "concluido"]] = None


@router.get("/diagnosticos")
async def listar(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    ds = (await db.execute(select(DiagDiagnostico).where(
        DiagDiagnostico.municipio_id == current.municipio_id))).scalars().all()
    ds = sorted(ds, key=lambda d: cat.chave_ordem(d.exercicio, d.periodo_tipo, d.periodo), reverse=True)
    saida = []
    for d in ds:
        itens = await svc.itens_do(db, d)
        saida.append({**svc.dict_diagnostico(d), "totais": svc.totais(itens)})
    return {"municipio": current.municipio, "ibge": current.municipio_ibge, "diagnosticos": saida}


@router.post("/diagnosticos", status_code=201)
async def criar(body: DiagnosticoIn, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    try:
        cat.validar_periodo(body.periodo_tipo, body.periodo)
    except ValueError as e:
        raise HTTPException(422, str(e))
    existe = (await db.execute(select(DiagDiagnostico.id).where(
        DiagDiagnostico.municipio_id == current.municipio_id, DiagDiagnostico.exercicio == body.exercicio,
        DiagDiagnostico.periodo_tipo == body.periodo_tipo, DiagDiagnostico.periodo == body.periodo))).first()
    if existe:
        raise HTTPException(409, f"Já existe diagnóstico para este período (id {existe[0]}).")
    try:
        d = await svc.criar(db, current.municipio_id, body.exercicio, body.periodo_tipo, body.periodo,
                            current.username, body.responsavel_tecnico, body.objetivo)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409, "Já existe diagnóstico para este período.")
    resumo = await svc.coletar(db, d, current.municipio_ibge or "", current.username)
    await registrar_auditoria(db, "DIAGNOSTICO_CRIADO", usuario=current, ip=ip_de(request),
                              tabela="diag_diagnostico", registro_id=d.id,
                              detalhe=f"{cat.rotulo_periodo(d.exercicio, d.periodo_tipo, d.periodo)}; coleta: "
                                      f"{len(resumo['atualizados'])} atualizados, {len(resumo['nao_verificados'])} não verificados")
    await svc.registrar_alertas_centrais(db, d, await svc.painel(db, d))
    return {**svc.dict_diagnostico(d), "coleta": resumo}


@router.get("/diagnosticos/{diag_id}")
async def detalhe(diag_id: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    d = await _diag(db, current, diag_id)
    itens = await svc.itens_do(db, d)
    anexos = (await db.execute(select(DiagAnexo).where(
        DiagAnexo.municipio_id == current.municipio_id, DiagAnexo.item_id.in_([i.id for i in itens] or [0]),
        DiagAnexo.excluido_em.is_(None)))).scalars().all()
    por_item: dict[int, list] = {}
    for a in anexos:
        por_item.setdefault(a.item_id, []).append({"id": a.id, "nome": a.nome_original, "tamanho": a.tamanho,
                                                   "descricao": a.descricao, "enviado_por": a.enviado_por,
                                                   "enviado_em": a.enviado_em.isoformat()})
    return {**svc.dict_diagnostico(d), "municipio": current.municipio,
            "itens": [{**svc.dict_item(i), "anexos": por_item.get(i.id, [])} for i in itens]}


@router.put("/diagnosticos/{diag_id}")
async def atualizar(diag_id: int, body: DiagnosticoUpd, request: Request, current: SessaoMunicipal,
                    db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    d = await _diag(db, current, diag_id)
    mud = body.model_dump(exclude_unset=True)
    if d.situacao == "concluido" and set(mud) - {"situacao"}:
        raise HTTPException(409, "Diagnóstico concluído: reabra-o para alterar.")
    for k, v in mud.items():
        setattr(d, k, v)
    if mud.get("situacao") == "concluido":
        d.concluido_por, d.concluido_em = current.username, datetime.utcnow()
    elif "situacao" in mud:
        d.concluido_por = d.concluido_em = None
    await db.commit()
    await registrar_auditoria(db, "DIAGNOSTICO_ATUALIZADO", usuario=current, ip=ip_de(request),
                              tabela="diag_diagnostico", registro_id=d.id, detalhe=", ".join(sorted(mud)))
    return svc.dict_diagnostico(d)


@router.post("/diagnosticos/{diag_id}/coletar")
async def recoletar(diag_id: int, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    d = await _diag(db, current, diag_id)
    _editavel(d)
    resumo = await svc.coletar(db, d, current.municipio_ibge or "", current.username)
    await registrar_auditoria(db, "DIAGNOSTICO_COLETA", usuario=current, ip=ip_de(request),
                              tabela="diag_diagnostico", registro_id=d.id,
                              detalhe=f"atualizados={resumo['atualizados']} preservados={resumo['preservados']}")
    await svc.registrar_alertas_centrais(db, d, await svc.painel(db, d))
    return resumo


@router.get("/diagnosticos/{diag_id}/painel")
async def painel(diag_id: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    d = await _diag(db, current, diag_id)
    return {"municipio": current.municipio, "uf": current.municipio_uf, "ibge": current.municipio_ibge,
            **await svc.painel(db, d)}


@router.get("/diagnosticos/{diag_id}/comparar")
async def comparar(diag_id: int, com: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    d = await _diag(db, current, diag_id)
    outro = await _diag(db, current, com)
    return {"atual": svc.dict_diagnostico(d), "anterior": svc.dict_diagnostico(outro),
            **svc.comparar(await svc.itens_do(db, d), await svc.itens_do(db, outro))}


@router.get("/diagnosticos/{diag_id}/relatorio.pdf")
async def relatorio(diag_id: int, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    d = await _diag(db, current, diag_id)
    itens = await svc.itens_do(db, d)
    por_id = {i.id: i for i in itens}
    acoes = [svc.dict_acao(a, por_id.get(a.item_id)) for a in await svc.acoes_do(db, d)]
    blocos = rel.montar({"nome": current.municipio, "uf": current.municipio_uf, "ibge": current.municipio_ibge},
                        await svc.painel(db, d), [svc.dict_item(i) for i in itens], acoes, current.nome or current.username)
    titulo = f"Diagnóstico Situacional da Saúde Municipal — {current.municipio} — " \
             f"{cat.rotulo_periodo(d.exercicio, d.periodo_tipo, d.periodo)}"
    conteudo = rel.pdf(blocos, titulo)
    await registrar_auditoria(db, "DIAGNOSTICO_RELATORIO", usuario=current, ip=ip_de(request),
                              tabela="diag_diagnostico", registro_id=d.id)
    nome = f"diagnostico_situacional_{d.exercicio}_{d.periodo_tipo}{d.periodo or ''}.pdf"
    return Response(conteudo, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{nome}"'})


# ── Itens: declaração, validação, histórico ──────────────────────────────────

class ItemUpd(BaseModel):
    classificacao: Optional[Classificacao] = None
    natureza: Optional[Literal["comprovado", "hipotese"]] = None
    fonte: Optional[str] = Field(None, max_length=300)
    competencia: Optional[str] = Field(None, max_length=40)
    evidencia: Optional[str] = Field(None, max_length=8000)
    data_referencia: Optional[date] = None
    justificativa: Optional[str] = Field(None, max_length=8000)
    prioridade: Optional[Prioridade] = None
    responsavel: Optional[str] = Field(None, max_length=150)
    observacoes: Optional[str] = Field(None, max_length=8000)
    vazio_assistencial: Optional[bool] = None


_CAMPOS_DADO = {"classificacao", "natureza", "fonte", "competencia", "evidencia", "data_referencia", "justificativa"}


@router.put("/itens/{item_id}")
async def editar_item(item_id: int, body: ItemUpd, request: Request, current: SessaoMunicipal,
                      db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    item = await _item(db, current, item_id)
    _editavel(await _diag(db, current, item.diagnostico_id))
    mud = {k: v for k, v in body.model_dump(exclude_unset=True).items() if getattr(item, k) != v}
    if not mud:
        return svc.dict_item(item)
    nova = mud.get("classificacao", item.classificacao)
    if nova in {"regular", "pendencia", "critico", "nao_se_aplica"} and "classificacao" in mud:
        just = mud.get("justificativa", item.justificativa)
        if not (just or "").strip():
            raise HTTPException(422, "Informe a justificativa da classificação.")
        if nova != "nao_se_aplica" and not (mud.get("fonte", item.fonte) or "").strip():
            raise HTTPException(422, "Informe a fonte do dado declarado.")
    if set(mud) & _CAMPOS_DADO:
        # O dado passa a ser declarado pelo técnico; a validação anterior não vale para o dado novo.
        if item.origem == "automatico":
            svc.historico(db, item, "edicao", "Dado automático substituído por declaração do município.", current.username)
        item.origem = "declarado"
        if item.validacao != "pendente":
            mud["validacao"] = "pendente"
            item.validado_por = item.validado_em = None
        if "data_referencia" not in mud and item.data_referencia is None:
            item.data_referencia = date.today()
    descr = []
    for k, v in mud.items():
        antes = getattr(item, k)
        if k == "classificacao":
            descr.append(f"classificação: {cat.CLASSIFICACOES.get(antes)} → {cat.CLASSIFICACOES.get(v)}")
        elif k in {"evidencia", "justificativa", "observacoes"}:
            descr.append(f"{k} alterada")
        else:
            descr.append(f"{k}: {antes if antes not in (None, '') else '—'} → {v if v not in (None, '') else '—'}")
        setattr(item, k, v)
    item.atualizado_por, item.atualizado_em = current.username, datetime.utcnow()
    svc.historico(db, item, "edicao", "; ".join(descr), current.username)
    await db.commit()
    await registrar_auditoria(db, "DIAGNOSTICO_ITEM_EDITADO", usuario=current, ip=ip_de(request),
                              tabela="diag_item", registro_id=item.id, detalhe=f"{item.codigo}: " + "; ".join(descr))
    return svc.dict_item(item)


class ValidacaoIn(BaseModel):
    decisao: Literal["confirmar", "contestar"]
    observacao: Optional[str] = Field(None, max_length=4000)
    prioridade: Optional[Prioridade] = None
    responsavel: Optional[str] = Field(None, max_length=150)


@router.post("/itens/{item_id}/validar")
async def validar(item_id: int, body: ValidacaoIn, request: Request, current: SessaoMunicipal,
                  db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    item = await _item(db, current, item_id)
    _editavel(await _diag(db, current, item.diagnostico_id))
    obs = (body.observacao or "").strip()
    if body.decisao == "contestar" and not obs:
        raise HTTPException(422, "Explique o motivo da contestação.")
    if body.decisao == "confirmar" and item.classificacao == "nao_verificado":
        raise HTTPException(422, "Item não verificado não pode ser confirmado: declare o dado com evidência primeiro.")
    item.validacao = "confirmado" if body.decisao == "confirmar" else "contestado"
    item.validado_por, item.validado_em = current.username, datetime.utcnow()
    if body.prioridade:
        item.prioridade = body.prioridade
    if body.responsavel:
        item.responsavel = body.responsavel
    if obs:
        item.observacoes = f"{item.observacoes}\n{obs}".strip() if item.observacoes else obs
    texto = f"{'Confirmado' if body.decisao == 'confirmar' else 'Contestado'} ({cat.CLASSIFICACOES[item.classificacao]})"
    svc.historico(db, item, "validacao", texto + (f": {obs}" if obs else ""), current.username)
    await db.commit()
    await registrar_auditoria(db, "DIAGNOSTICO_ITEM_VALIDADO", usuario=current, ip=ip_de(request),
                              tabela="diag_item", registro_id=item.id, detalhe=f"{item.codigo}: {texto}")
    return svc.dict_item(item)


@router.get("/itens/{item_id}/historico")
async def historico_item(item_id: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    item = await _item(db, current, item_id)
    hs = (await db.execute(select(DiagHistorico).where(
        DiagHistorico.item_id == item.id, DiagHistorico.municipio_id == current.municipio_id)
        .order_by(DiagHistorico.id.desc()))).scalars().all()
    return [{"id": h.id, "evento": h.evento, "descricao": h.descricao, "usuario": h.usuario,
             "criado_em": h.criado_em.isoformat()} for h in hs]


# ── Anexos ────────────────────────────────────────────────────────────────────

@router.post("/itens/{item_id}/anexos", status_code=201)
async def anexar(item_id: int, request: Request, current: SessaoMunicipal, arquivo: UploadFile = File(...),
                 descricao: Optional[str] = Form(None), db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    item = await _item(db, current, item_id)
    _editavel(await _diag(db, current, item.diagnostico_id))
    nome = re.sub(r"[^\w.\- ]", "_", (arquivo.filename or "anexo"))[:200]
    ext = ("." + nome.rsplit(".", 1)[-1].lower()) if "." in nome else ""
    if ext not in EXTENSOES_ANEXO:
        raise HTTPException(422, "Tipo de arquivo não aceito (use PDF, imagem, documento ou planilha).")
    conteudo = await arquivo.read(TAMANHO_MAXIMO_ANEXO + 1)
    if len(conteudo) > TAMANHO_MAXIMO_ANEXO:
        raise HTTPException(413, "Arquivo acima de 10 MB.")
    if not conteudo:
        raise HTTPException(422, "Arquivo vazio.")
    pasta = pasta_municipio("documentos", f"diagnostico/{item.diagnostico_id}")
    relativo = f"diagnostico/{item.diagnostico_id}/{uuid.uuid4().hex}{ext}"
    (pasta / relativo.rsplit("/", 1)[-1]).write_bytes(conteudo)
    an = DiagAnexo(item_id=item.id, municipio_id=current.municipio_id, nome_original=nome, caminho=relativo,
                   tamanho=len(conteudo), descricao=(descricao or "")[:300] or None, enviado_por=current.username)
    db.add(an)
    await db.flush()
    svc.historico(db, item, "anexo", f"Evidência anexada: {nome}", current.username)
    await db.commit()
    await registrar_auditoria(db, "DIAGNOSTICO_ANEXO", usuario=current, ip=ip_de(request), tabela="diag_anexo",
                              registro_id=an.id, detalhe=f"{item.codigo}: {nome} ({len(conteudo)} bytes)")
    return {"id": an.id, "nome": nome, "tamanho": an.tamanho}


async def _anexo(db: AsyncSession, u: UserOut, anexo_id: int) -> DiagAnexo:
    an = await garantir_do_municipio(db, u, await db.get(DiagAnexo, anexo_id), "diag_anexo", anexo_id)
    if an.excluido_em:
        raise HTTPException(404, "Registro não encontrado")
    return an


@router.get("/anexos/{anexo_id}")
async def baixar_anexo(anexo_id: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    an = await _anexo(db, current, anexo_id)
    base = pasta_municipio("documentos")
    try:
        caminho = caminho_seguro(base, an.caminho)
    except ValueError:
        raise HTTPException(404, "Registro não encontrado")
    if not caminho.exists():
        raise HTTPException(404, "Arquivo não encontrado no armazenamento")
    return FileResponse(caminho, filename=an.nome_original)


@router.delete("/anexos/{anexo_id}")
async def remover_anexo(anexo_id: int, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    an = await _anexo(db, current, anexo_id)
    item = await _item(db, current, an.item_id)
    _editavel(await _diag(db, current, item.diagnostico_id))
    an.excluido_em = datetime.utcnow()
    svc.historico(db, item, "anexo", f"Evidência removida: {an.nome_original}", current.username)
    await db.commit()
    await registrar_auditoria(db, "DIAGNOSTICO_ANEXO_REMOVIDO", usuario=current, ip=ip_de(request),
                              tabela="diag_anexo", registro_id=an.id)
    return {"ok": True}


# ── Plano de ação 5W2H ────────────────────────────────────────────────────────

class AcaoIn(BaseModel):
    item_id: int
    o_que: str = Field(min_length=3, max_length=4000)
    por_que: Optional[str] = Field(None, max_length=4000)
    onde: Optional[str] = Field(None, max_length=300)
    quando: Optional[date] = None
    quem: Optional[str] = Field(None, max_length=200)
    como: Optional[str] = Field(None, max_length=4000)
    quanto: Optional[float] = Field(None, ge=0)
    quanto_texto: Optional[str] = Field(None, max_length=300)
    produto: Optional[str] = Field(None, max_length=300)
    indicador: Optional[str] = Field(None, max_length=300)
    evidencia: Optional[str] = Field(None, max_length=4000)
    prioridade: Optional[Prioridade] = None
    status: Literal["nao_iniciada", "em_andamento", "concluida", "cancelada"] = "nao_iniciada"


class AcaoUpd(BaseModel):
    o_que: Optional[str] = Field(None, min_length=3, max_length=4000)
    por_que: Optional[str] = Field(None, max_length=4000)
    onde: Optional[str] = Field(None, max_length=300)
    quando: Optional[date] = None
    quem: Optional[str] = Field(None, max_length=200)
    como: Optional[str] = Field(None, max_length=4000)
    quanto: Optional[float] = Field(None, ge=0)
    quanto_texto: Optional[str] = Field(None, max_length=300)
    produto: Optional[str] = Field(None, max_length=300)
    indicador: Optional[str] = Field(None, max_length=300)
    evidencia: Optional[str] = Field(None, max_length=4000)
    prioridade: Optional[Prioridade] = None
    status: Optional[Literal["nao_iniciada", "em_andamento", "concluida", "cancelada"]] = None


@router.get("/diagnosticos/{diag_id}/acoes")
async def listar_acoes(diag_id: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    d = await _diag(db, current, diag_id)
    por_id = {i.id: i for i in await svc.itens_do(db, d)}
    return [svc.dict_acao(a, por_id.get(a.item_id)) for a in await svc.acoes_do(db, d)]


@router.post("/diagnosticos/{diag_id}/acoes", status_code=201)
async def criar_acao(diag_id: int, body: AcaoIn, request: Request, current: SessaoMunicipal,
                     db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    d = await _diag(db, current, diag_id)
    item = await _item(db, current, body.item_id)
    if item.diagnostico_id != d.id:
        raise HTTPException(422, "O item não pertence a este diagnóstico.")
    if item.classificacao not in {"pendencia", "critico"} or item.validacao != "confirmado":
        raise HTTPException(422, "O plano de ação só aceita problemas validados (Com pendência ou Crítico, confirmados).")
    a = DiagAcao(diagnostico_id=d.id, municipio_id=current.municipio_id, criado_por=current.username,
                 atualizado_por=current.username, **body.model_dump())
    if a.prioridade is None:
        a.prioridade = item.prioridade
    db.add(a)
    await db.flush()
    svc.historico(db, item, "acao", f"Ação 5W2H criada: {a.o_que[:200]}", current.username)
    await db.commit()
    await registrar_auditoria(db, "DIAGNOSTICO_ACAO_CRIADA", usuario=current, ip=ip_de(request),
                              tabela="diag_acao", registro_id=a.id, detalhe=f"{item.codigo}: {a.o_que[:200]}")
    return svc.dict_acao(a, item)


async def _acao(db: AsyncSession, u: UserOut, acao_id: int) -> DiagAcao:
    a = await garantir_do_municipio(db, u, await db.get(DiagAcao, acao_id), "diag_acao", acao_id)
    if a.excluido_em:
        raise HTTPException(404, "Registro não encontrado")
    return a


@router.put("/acoes/{acao_id}")
async def editar_acao(acao_id: int, body: AcaoUpd, request: Request, current: SessaoMunicipal,
                      db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    a = await _acao(db, current, acao_id)
    mud = body.model_dump(exclude_unset=True)
    if "o_que" in mud and not mud["o_que"]:
        raise HTTPException(422, "Informe o quê.")
    for k, v in mud.items():
        setattr(a, k, v)
    a.atualizado_por, a.atualizado_em = current.username, datetime.utcnow()
    item = await _item(db, current, a.item_id)
    svc.historico(db, item, "acao", f"Ação 5W2H #{a.id} alterada: {', '.join(sorted(mud))}", current.username)
    await db.commit()
    await registrar_auditoria(db, "DIAGNOSTICO_ACAO_EDITADA", usuario=current, ip=ip_de(request),
                              tabela="diag_acao", registro_id=a.id, detalhe=", ".join(sorted(mud)))
    return svc.dict_acao(a, item)


@router.delete("/acoes/{acao_id}")
async def excluir_acao(acao_id: int, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    a = await _acao(db, current, acao_id)
    a.excluido_em = datetime.utcnow()
    item = await _item(db, current, a.item_id)
    svc.historico(db, item, "acao", f"Ação 5W2H #{a.id} excluída", current.username)
    await db.commit()
    await registrar_auditoria(db, "DIAGNOSTICO_ACAO_EXCLUIDA", usuario=current, ip=ip_de(request),
                              tabela="diag_acao", registro_id=a.id)
    return {"ok": True}
