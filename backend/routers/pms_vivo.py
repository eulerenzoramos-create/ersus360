"""
Router: /api/pms-vivo — PMS Vivo (Gestão, Execução e Resultados do Plano Municipal de Saúde).

Multi-município: tudo filtrado pelo município da sessão; registro de outro município → 404 auditado.
Leitura: qualquer perfil do município (consulta e conselho só leem). Planejamento (cadastro, importação,
aprovação, PAS e ações): admin, gestor, planejamento. Validação da execução: + coordenador.
Atualizar a execução: o responsável indicado na ação ou quem valida. Ver services/pms_vivo.py.

  GET    /referencias                         tipos de indicador, situações, perfis
  GET    /planos | POST /planos               versões do PMS do município | novo PMS (rascunho)
  GET    /planos/{id}                         plano + árvore diretriz → objetivo → meta → metas anuais
  PUT    /planos/{id}                         dados do rascunho
  POST   /planos/{id}/aprovar                 aprova a versão (a aprovada anterior vira "substituido")
  POST   /planos/{id}/nova-versao             proposta de alteração a partir de uma versão
  POST   /planos/{id}/diretrizes · PUT/DELETE /diretrizes/{id}
  POST   /diretrizes/{id}/objetivos · PUT/DELETE /objetivos/{id}
  POST   /objetivos/{id}/metas · PUT/DELETE /metas/{id}
  GET    /modelo.xlsx                         planilha modelo
  POST   /planos/{id}/importar/previa         lê a planilha e devolve a prévia (não grava)
  POST   /planos/{id}/importar/confirmar      grava a estrutura revisada
  POST   /planos/{id}/documento               anexa o PDF oficial do PMS
  GET    /planos/{id}/pas · POST              PAS por exercício
  POST   /pas/{id}/aprovar
  GET    /pas/{id}/acoes · POST               ações da PAS (filtros: setor, responsável, situação)
  GET    /acoes/{id} · PUT · DELETE           detalhe | planejamento da ação | exclusão lógica (PAS em rascunho)
  POST   /acoes/{id}/atualizacoes             execução informada (fica aguardando validação)
  POST   /atualizacoes/{id}/validar           validar | devolver
  GET    /validacoes-pendentes                fila de validação
  POST   /acoes/{id}/anexos · GET/DELETE /anexos/{id}
  GET    /minhas-acoes                        ações do usuário da sessão
  GET    /responsaveis                        usuários do município para indicar como responsáveis
"""
from __future__ import annotations

import re
import uuid
from datetime import date, datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.pms_vivo import (PmsAcao, PmsAcaoMeta, PmsAnexo, PmsAtualizacao, PmsDiretriz, PmsHistorico, PmsMeta,
                             PmsMetaAnual, PmsObjetivo, PmsPas, PmsPlano)
from models.usuario import Usuario
from routers.auth import UserOut, ip_de
from services import pms_vivo as svc
from tenancy.arquivos import caminho_seguro, pasta_municipio
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal, garantir_do_municipio

router = APIRouter(prefix="/api/pms-vivo", tags=["PMS Vivo — Gestão, Execução e Resultados"])

TAMANHO_MAXIMO = 15 * 1024 * 1024
EXT_EVIDENCIA = {".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx", ".odt", ".ods", ".csv", ".txt"}
Tipo = Literal["percentual", "taxa", "indice", "absoluto_acumulavel", "absoluto_nao_acumulavel", "binario"]
Polaridade = Literal["maior_melhor", "menor_melhor"]
Situacao = Literal["nao_iniciada", "em_andamento", "concluida", "parcial", "nao_executada", "cancelada"]


def _planejador(u: UserOut) -> None:
    if not svc.pode_planejar(u):
        raise HTTPException(403, "Perfil sem permissão para alterar o planejamento (Secretário, Planejamento ou administrador).")


async def _get(db, u, modelo, id_, tabela):
    reg = await garantir_do_municipio(db, u, await db.get(modelo, id_), tabela, id_)
    if getattr(reg, "excluido_em", None):
        raise HTTPException(404, "Registro não encontrado")
    return reg


def _rascunho(p: PmsPlano) -> None:
    if p.situacao != "rascunho":
        raise HTTPException(409, "Versão aprovada não é editada: crie uma nova versão (proposta de alteração).")


async def _audit(db, u, request, acao, tabela, rid, detalhe=None):
    await registrar_auditoria(db, acao, usuario=u, ip=ip_de(request), tabela=tabela, registro_id=rid, detalhe=detalhe)


@router.get("/referencias")
async def referencias(current: SessaoMunicipal):
    return {"tipos_indicador": svc.TIPOS_INDICADOR, "polaridades": svc.POLARIDADES,
            "situacoes_acao": svc.SITUACOES_ACAO, "exige_justificativa": sorted(svc.EXIGE_JUSTIFICATIVA),
            "perfis": {"planejamento": sorted(svc.PERFIS_PLANEJAMENTO), "validacao": sorted(svc.PERFIS_VALIDACAO)},
            "pode_planejar": svc.pode_planejar(current), "pode_validar": svc.pode_validar(current),
            "usuario_id": current.usuario_id}


# ── Planos (PMS) ──────────────────────────────────────────────────────────────

class PlanoIn(BaseModel):
    titulo: str = Field(min_length=3, max_length=300)
    vigencia_inicio: int = Field(ge=2018, le=2100)
    observacoes: Optional[str] = Field(None, max_length=8000)


class PlanoUpd(BaseModel):
    titulo: Optional[str] = Field(None, min_length=3, max_length=300)
    observacoes: Optional[str] = Field(None, max_length=8000)


@router.get("/planos")
async def listar_planos(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    ps = (await db.execute(select(PmsPlano).where(PmsPlano.municipio_id == current.municipio_id)
                           .order_by(PmsPlano.vigencia_inicio.desc(), PmsPlano.versao.desc()))).scalars().all()
    return [svc.dict_plano(p) for p in ps]


@router.post("/planos", status_code=201)
async def criar_plano(body: PlanoIn, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _planejador(current)
    existe = (await db.execute(select(PmsPlano.id).where(
        PmsPlano.municipio_id == current.municipio_id, PmsPlano.vigencia_inicio == body.vigencia_inicio))).first()
    if existe:
        raise HTTPException(409, "Já existe PMS para esta vigência: use 'nova versão' para propor alterações.")
    p = PmsPlano(municipio_id=current.municipio_id, titulo=body.titulo, vigencia_inicio=body.vigencia_inicio,
                 vigencia_fim=body.vigencia_inicio + 3, observacoes=body.observacoes, criado_por=current.username)
    db.add(p)
    await db.commit()
    await _audit(db, current, request, "PMS_CRIADO", "pms_plano", p.id, f"{p.vigencia_inicio}–{p.vigencia_fim}")
    return svc.dict_plano(p)


@router.get("/planos/{plano_id}")
async def detalhe_plano(plano_id: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    p = await _get(db, current, PmsPlano, plano_id, "pms_plano")
    docs = (await db.execute(select(PmsAnexo).where(
        PmsAnexo.municipio_id == current.municipio_id, PmsAnexo.entidade == "plano", PmsAnexo.entidade_id == p.id,
        PmsAnexo.excluido_em.is_(None)))).scalars().all()
    return {**svc.dict_plano(p), "anos": svc.anos_do(p), "diretrizes": await svc.arvore(db, p),
            "documentos": [_dict_anexo(a) for a in docs]}


@router.put("/planos/{plano_id}")
async def editar_plano(plano_id: int, body: PlanoUpd, request: Request, current: SessaoMunicipal,
                       db: AsyncSession = Depends(get_db)):
    _planejador(current)
    p = await _get(db, current, PmsPlano, plano_id, "pms_plano")
    _rascunho(p)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    await db.commit()
    await _audit(db, current, request, "PMS_EDITADO", "pms_plano", p.id)
    return svc.dict_plano(p)


class AprovarIn(BaseModel):
    resolucao_cms: str = Field(min_length=3, max_length=200)


@router.post("/planos/{plano_id}/aprovar")
async def aprovar_plano(plano_id: int, body: AprovarIn, request: Request, current: SessaoMunicipal,
                        db: AsyncSession = Depends(get_db)):
    _planejador(current)
    p = await _get(db, current, PmsPlano, plano_id, "pms_plano")
    _rascunho(p)
    if not (await db.execute(select(PmsMeta.id).where(PmsMeta.plano_id == p.id).limit(1))).first():
        raise HTTPException(422, "O PMS não tem metas cadastradas.")
    anteriores = (await db.execute(select(PmsPlano).where(
        PmsPlano.municipio_id == p.municipio_id, PmsPlano.vigencia_inicio == p.vigencia_inicio,
        PmsPlano.situacao == "aprovado"))).scalars().all()
    for a in anteriores:
        a.situacao = "substituido"
        svc.historico(db, a.municipio_id, "plano", a.id, "substituido", f"Substituída pela versão {p.versao}.",
                      current.username)
    p.situacao, p.resolucao_cms = "aprovado", body.resolucao_cms
    p.aprovado_por, p.aprovado_em = current.username, datetime.utcnow()
    svc.historico(db, p.municipio_id, "plano", p.id, "aprovado", f"Aprovado ({body.resolucao_cms}).", current.username)
    await db.commit()
    await _audit(db, current, request, "PMS_APROVADO", "pms_plano", p.id, f"v{p.versao} — {body.resolucao_cms}")
    return svc.dict_plano(p)


class VersaoIn(BaseModel):
    motivo: str = Field(min_length=5, max_length=4000)


@router.post("/planos/{plano_id}/nova-versao", status_code=201)
async def nova_versao(plano_id: int, body: VersaoIn, request: Request, current: SessaoMunicipal,
                      db: AsyncSession = Depends(get_db)):
    _planejador(current)
    p = await _get(db, current, PmsPlano, plano_id, "pms_plano")
    rasc = (await db.execute(select(PmsPlano.id).where(
        PmsPlano.municipio_id == p.municipio_id, PmsPlano.vigencia_inicio == p.vigencia_inicio,
        PmsPlano.situacao == "rascunho"))).first()
    if rasc:
        raise HTTPException(409, f"Já existe proposta em rascunho para esta vigência (id {rasc[0]}).")
    novo = await svc.nova_versao(db, p, current.username, body.motivo)
    svc.historico(db, p.municipio_id, "plano", novo.id, "nova_versao", f"Proposta a partir da v{p.versao}: {body.motivo}",
                  current.username)
    await db.commit()
    await _audit(db, current, request, "PMS_NOVA_VERSAO", "pms_plano", novo.id, f"origem v{p.versao}")
    return svc.dict_plano(novo)


# ── Estrutura: diretrizes, objetivos, metas ──────────────────────────────────

class ItemIn(BaseModel):
    codigo: str = Field(min_length=1, max_length=20)
    descricao: str = Field(min_length=3, max_length=4000)


class ItemUpd(BaseModel):
    codigo: Optional[str] = Field(None, min_length=1, max_length=20)
    descricao: Optional[str] = Field(None, min_length=3, max_length=4000)


class MetaIn(ItemIn):
    indicador: Optional[str] = Field(None, max_length=4000)
    tipo_indicador: Optional[Tipo] = None
    unidade: Optional[str] = Field(None, max_length=40)
    polaridade: Optional[Polaridade] = None
    formula: Optional[str] = Field(None, max_length=4000)
    linha_base: Optional[float] = None
    ano_linha_base: Optional[int] = Field(None, ge=1990, le=2100)
    meta_quadrienal: Optional[float] = None
    fonte: Optional[str] = Field(None, max_length=300)
    setor_responsavel: Optional[str] = Field(None, max_length=150)
    metas_anuais: dict[str, Optional[float]] = {}


class MetaUpd(BaseModel):
    codigo: Optional[str] = Field(None, min_length=1, max_length=20)
    descricao: Optional[str] = Field(None, min_length=3, max_length=4000)
    indicador: Optional[str] = Field(None, max_length=4000)
    tipo_indicador: Optional[Tipo] = None
    unidade: Optional[str] = Field(None, max_length=40)
    polaridade: Optional[Polaridade] = None
    formula: Optional[str] = Field(None, max_length=4000)
    linha_base: Optional[float] = None
    ano_linha_base: Optional[int] = Field(None, ge=1990, le=2100)
    meta_quadrienal: Optional[float] = None
    fonte: Optional[str] = Field(None, max_length=300)
    setor_responsavel: Optional[str] = Field(None, max_length=150)
    metas_anuais: Optional[dict[str, Optional[float]]] = None


async def _plano_editavel(db, u, plano_id) -> PmsPlano:
    _planejador(u)
    p = await _get(db, u, PmsPlano, plano_id, "pms_plano")
    _rascunho(p)
    return p


@router.post("/planos/{plano_id}/diretrizes", status_code=201)
async def criar_diretriz(plano_id: int, body: ItemIn, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    p = await _plano_editavel(db, current, plano_id)
    d = PmsDiretriz(plano_id=p.id, municipio_id=p.municipio_id, codigo=body.codigo, descricao=body.descricao, ordem=999)
    db.add(d)
    await db.commit()
    return {"id": d.id, "codigo": d.codigo, "descricao": d.descricao}


@router.put("/diretrizes/{did}")
async def editar_diretriz(did: int, body: ItemUpd, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    d = await _get(db, current, PmsDiretriz, did, "pms_diretriz")
    await _plano_editavel(db, current, d.plano_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(d, k, v)
    await db.commit()
    return {"id": d.id, "codigo": d.codigo, "descricao": d.descricao}


@router.delete("/diretrizes/{did}")
async def excluir_diretriz(did: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    d = await _get(db, current, PmsDiretriz, did, "pms_diretriz")
    await _plano_editavel(db, current, d.plano_id)
    if (await db.execute(select(PmsObjetivo.id).where(PmsObjetivo.diretriz_id == d.id).limit(1))).first():
        raise HTTPException(409, "Exclua antes os objetivos desta diretriz.")
    await db.delete(d)
    await db.commit()
    return {"ok": True}


@router.post("/diretrizes/{did}/objetivos", status_code=201)
async def criar_objetivo(did: int, body: ItemIn, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    d = await _get(db, current, PmsDiretriz, did, "pms_diretriz")
    p = await _plano_editavel(db, current, d.plano_id)
    o = PmsObjetivo(diretriz_id=d.id, plano_id=p.id, municipio_id=p.municipio_id, codigo=body.codigo,
                    descricao=body.descricao, ordem=999)
    db.add(o)
    await db.commit()
    return {"id": o.id, "codigo": o.codigo, "descricao": o.descricao}


@router.put("/objetivos/{oid}")
async def editar_objetivo(oid: int, body: ItemUpd, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    o = await _get(db, current, PmsObjetivo, oid, "pms_objetivo")
    await _plano_editavel(db, current, o.plano_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(o, k, v)
    await db.commit()
    return {"id": o.id, "codigo": o.codigo, "descricao": o.descricao}


@router.delete("/objetivos/{oid}")
async def excluir_objetivo(oid: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    o = await _get(db, current, PmsObjetivo, oid, "pms_objetivo")
    await _plano_editavel(db, current, o.plano_id)
    if (await db.execute(select(PmsMeta.id).where(PmsMeta.objetivo_id == o.id).limit(1))).first():
        raise HTTPException(409, "Exclua antes as metas deste objetivo.")
    await db.delete(o)
    await db.commit()
    return {"ok": True}


async def _gravar_anuais(db, p: PmsPlano, meta: PmsMeta, valores: dict[str, Optional[float]]) -> None:
    anos = svc.anos_do(p)
    existentes = {a.ano: a for a in (await db.execute(select(PmsMetaAnual).where(
        PmsMetaAnual.meta_id == meta.id))).scalars()}
    for ano in anos:
        if str(ano) not in valores:
            if ano not in existentes:
                db.add(PmsMetaAnual(meta_id=meta.id, municipio_id=meta.municipio_id, ano=ano))
            continue
        reg = existentes.get(ano) or PmsMetaAnual(meta_id=meta.id, municipio_id=meta.municipio_id, ano=ano)
        reg.meta_prevista = valores[str(ano)]
        db.add(reg)
    fora = set(valores) - {str(a) for a in anos}
    if fora:
        raise HTTPException(422, f"Ano(s) fora da vigência: {', '.join(sorted(fora))}.")


@router.post("/objetivos/{oid}/metas", status_code=201)
async def criar_meta(oid: int, body: MetaIn, request: Request, current: SessaoMunicipal,
                     db: AsyncSession = Depends(get_db)):
    o = await _get(db, current, PmsObjetivo, oid, "pms_objetivo")
    p = await _plano_editavel(db, current, o.plano_id)
    if (await db.execute(select(PmsMeta.id).where(PmsMeta.plano_id == p.id, PmsMeta.codigo == body.codigo))).first():
        raise HTTPException(409, f"Já existe meta {body.codigo} neste PMS.")
    dados = body.model_dump(exclude={"metas_anuais"})
    m = PmsMeta(objetivo_id=o.id, plano_id=p.id, municipio_id=p.municipio_id, uid=str(uuid.uuid4()), ordem=999, **dados)
    db.add(m)
    await db.flush()
    await _gravar_anuais(db, p, m, body.metas_anuais)
    svc.historico(db, p.municipio_id, "meta", m.id, "criada", f"Meta {m.codigo} criada.", current.username)
    await db.commit()
    await _audit(db, current, request, "PMS_META_CRIADA", "pms_meta", m.id, m.codigo)
    return svc.dict_meta(m)


@router.put("/metas/{meta_id}")
async def editar_meta(meta_id: int, body: MetaUpd, request: Request, current: SessaoMunicipal,
                      db: AsyncSession = Depends(get_db)):
    m = await _get(db, current, PmsMeta, meta_id, "pms_meta")
    p = await _plano_editavel(db, current, m.plano_id)
    mud = body.model_dump(exclude_unset=True)
    anuais = mud.pop("metas_anuais", None)
    for k, v in mud.items():
        setattr(m, k, v)
    if anuais is not None:
        await _gravar_anuais(db, p, m, anuais)
    svc.historico(db, p.municipio_id, "meta", m.id, "editada", "Campos: " + ", ".join(sorted(mud) + (["metas anuais"] if anuais is not None else [])),
                  current.username)
    await db.commit()
    await _audit(db, current, request, "PMS_META_EDITADA", "pms_meta", m.id, m.codigo)
    return svc.dict_meta(m)


@router.delete("/metas/{meta_id}")
async def excluir_meta(meta_id: int, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    m = await _get(db, current, PmsMeta, meta_id, "pms_meta")
    await _plano_editavel(db, current, m.plano_id)
    if (await db.execute(select(PmsAcaoMeta.id).where(PmsAcaoMeta.meta_id == m.id).limit(1))).first():
        raise HTTPException(409, "A meta tem ações vinculadas na PAS.")
    for a in (await db.execute(select(PmsMetaAnual).where(PmsMetaAnual.meta_id == m.id))).scalars():
        await db.delete(a)
    await db.delete(m)
    await db.commit()
    await _audit(db, current, request, "PMS_META_EXCLUIDA", "pms_meta", meta_id, m.codigo)
    return {"ok": True}


# ── Importação (Excel modelo + revisão) ──────────────────────────────────────

@router.get("/modelo.xlsx")
async def modelo(current: SessaoMunicipal, vigencia_inicio: int = Query(2026, ge=2018, le=2100)):
    return Response(svc.modelo_xlsx(list(range(vigencia_inicio, vigencia_inicio + 4))),
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="modelo_pms_{vigencia_inicio}.xlsx"'})


@router.post("/planos/{plano_id}/importar/previa")
async def importar_previa(plano_id: int, current: SessaoMunicipal, arquivo: UploadFile = File(...),
                          db: AsyncSession = Depends(get_db)):
    p = await _plano_editavel(db, current, plano_id)
    conteudo = await arquivo.read(TAMANHO_MAXIMO + 1)
    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(413, "Planilha acima de 15 MB.")
    try:
        return svc.ler_planilha(conteudo, svc.anos_do(p))
    except ValueError as e:
        raise HTTPException(422, str(e))


class ImportarIn(BaseModel):
    diretrizes: list[dict]
    substituir: bool = False


@router.post("/planos/{plano_id}/importar/confirmar")
async def importar_confirmar(plano_id: int, body: ImportarIn, request: Request, current: SessaoMunicipal,
                             db: AsyncSession = Depends(get_db)):
    p = await _plano_editavel(db, current, plano_id)
    tem = (await db.execute(select(PmsMeta.id).where(PmsMeta.plano_id == p.id).limit(1))).first()
    if tem and not body.substituir:
        raise HTTPException(409, "O rascunho já tem metas: confirme a substituição para importar de novo.")
    try:
        for d in body.diretrizes:
            assert d.get("codigo") and d.get("descricao")
            for o in d.get("objetivos", []):
                assert o.get("codigo") and o.get("descricao")
                for m in o.get("metas", []):
                    assert m.get("codigo") and m.get("descricao")
                    if m.get("tipo_indicador") not in (None, *svc.TIPOS_INDICADOR):
                        raise AssertionError
    except AssertionError:
        raise HTTPException(422, "Estrutura revisada inválida: diretriz, objetivo e meta precisam de código e texto.")
    if tem:
        acoes = (await db.execute(select(PmsAcaoMeta.id).join(PmsMeta, PmsMeta.id == PmsAcaoMeta.meta_id)
                                  .where(PmsMeta.plano_id == p.id).limit(1))).first()
        if acoes:
            raise HTTPException(409, "Há ações da PAS ligadas às metas deste rascunho.")
        await svc.limpar_estrutura(db, p)
    tot = await svc.gravar_estrutura(db, p, body.diretrizes)
    svc.historico(db, p.municipio_id, "plano", p.id, "importacao",
                  f"Importação revisada: {tot['diretrizes']} diretrizes, {tot['objetivos']} objetivos, {tot['metas']} metas.",
                  current.username)
    await db.commit()
    await _audit(db, current, request, "PMS_IMPORTADO", "pms_plano", p.id, str(tot))
    return tot


# ── Anexos ────────────────────────────────────────────────────────────────────

def _dict_anexo(a: PmsAnexo) -> dict:
    return {"id": a.id, "nome": a.nome_original, "tamanho": a.tamanho, "descricao": a.descricao,
            "atualizacao_id": a.atualizacao_id, "enviado_por": a.enviado_por, "enviado_em": a.enviado_em.isoformat()}


async def _salvar_anexo(db, u, entidade, entidade_id, arquivo: UploadFile, descricao, so_pdf=False,
                        atualizacao_id=None) -> PmsAnexo:
    nome = re.sub(r"[^\w.\- ]", "_", arquivo.filename or "anexo")[:200]
    ext = ("." + nome.rsplit(".", 1)[-1].lower()) if "." in nome else ""
    if (so_pdf and ext != ".pdf") or ext not in EXT_EVIDENCIA:
        raise HTTPException(422, "Tipo de arquivo não aceito." + (" Envie o PDF do PMS." if so_pdf else ""))
    conteudo = await arquivo.read(TAMANHO_MAXIMO + 1)
    if len(conteudo) > TAMANHO_MAXIMO:
        raise HTTPException(413, "Arquivo acima de 15 MB.")
    if not conteudo:
        raise HTTPException(422, "Arquivo vazio.")
    pasta = pasta_municipio("documentos", f"pms/{entidade}/{entidade_id}")
    relativo = f"pms/{entidade}/{entidade_id}/{uuid.uuid4().hex}{ext}"
    (pasta / relativo.rsplit("/", 1)[-1]).write_bytes(conteudo)
    a = PmsAnexo(municipio_id=u.municipio_id, entidade=entidade, entidade_id=entidade_id, atualizacao_id=atualizacao_id,
                 nome_original=nome, caminho=relativo, tamanho=len(conteudo), descricao=(descricao or "")[:300] or None,
                 enviado_por=u.username)
    db.add(a)
    await db.flush()
    return a


@router.post("/planos/{plano_id}/documento", status_code=201)
async def anexar_documento(plano_id: int, request: Request, current: SessaoMunicipal, arquivo: UploadFile = File(...),
                           descricao: Optional[str] = Form(None), db: AsyncSession = Depends(get_db)):
    _planejador(current)
    p = await _get(db, current, PmsPlano, plano_id, "pms_plano")
    a = await _salvar_anexo(db, current, "plano", p.id, arquivo, descricao or "Documento oficial do PMS", so_pdf=True)
    svc.historico(db, p.municipio_id, "plano", p.id, "documento", f"PDF anexado: {a.nome_original}", current.username)
    await db.commit()
    await _audit(db, current, request, "PMS_DOCUMENTO", "pms_anexo", a.id, a.nome_original)
    return _dict_anexo(a)


@router.get("/anexos/{anexo_id}")
async def baixar_anexo(anexo_id: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    a = await _get(db, current, PmsAnexo, anexo_id, "pms_anexo")
    try:
        caminho = caminho_seguro(pasta_municipio("documentos"), a.caminho)
    except ValueError:
        raise HTTPException(404, "Registro não encontrado")
    if not caminho.exists():
        raise HTTPException(404, "Arquivo não encontrado no armazenamento")
    return FileResponse(caminho, filename=a.nome_original)


@router.delete("/anexos/{anexo_id}")
async def remover_anexo(anexo_id: int, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    a = await _get(db, current, PmsAnexo, anexo_id, "pms_anexo")
    if a.entidade == "acao":
        acao = await _get(db, current, PmsAcao, a.entidade_id, "pms_acao")
        _pode_atualizar(current, acao)
    else:
        _planejador(current)
    if a.atualizacao_id:
        upd = await db.get(PmsAtualizacao, a.atualizacao_id)
        if upd and upd.status == "validada":
            raise HTTPException(409, "Evidência de atualização já validada não pode ser removida.")
    a.excluido_em = datetime.utcnow()
    svc.historico(db, a.municipio_id, a.entidade, a.entidade_id, "anexo_removido", a.nome_original, current.username)
    await db.commit()
    await _audit(db, current, request, "PMS_ANEXO_REMOVIDO", "pms_anexo", a.id)
    return {"ok": True}


# ── PAS ───────────────────────────────────────────────────────────────────────

def _dict_pas(p: PmsPas) -> dict:
    return {"id": p.id, "plano_id": p.plano_id, "exercicio": p.exercicio, "situacao": p.situacao,
            "resolucao_cms": p.resolucao_cms, "aprovada_por": p.aprovada_por,
            "aprovada_em": p.aprovada_em.isoformat() if p.aprovada_em else None, "criado_por": p.criado_por}


class PasIn(BaseModel):
    exercicio: int = Field(ge=2018, le=2100)


@router.get("/planos/{plano_id}/pas")
async def listar_pas(plano_id: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    p = await _get(db, current, PmsPlano, plano_id, "pms_plano")
    rows = (await db.execute(select(PmsPas).where(PmsPas.plano_id == p.id, PmsPas.municipio_id == current.municipio_id)
                             .order_by(PmsPas.exercicio))).scalars().all()
    return [_dict_pas(x) for x in rows]


@router.post("/planos/{plano_id}/pas", status_code=201)
async def criar_pas(plano_id: int, body: PasIn, request: Request, current: SessaoMunicipal,
                    db: AsyncSession = Depends(get_db)):
    _planejador(current)
    p = await _get(db, current, PmsPlano, plano_id, "pms_plano")
    if p.situacao != "aprovado":
        raise HTTPException(409, "A PAS é vinculada a um PMS aprovado.")
    if body.exercicio not in svc.anos_do(p):
        raise HTTPException(422, f"Exercício fora da vigência do PMS ({p.vigencia_inicio}–{p.vigencia_fim}).")
    if (await db.execute(select(PmsPas.id).where(PmsPas.plano_id == p.id, PmsPas.exercicio == body.exercicio))).first():
        raise HTTPException(409, "Já existe PAS deste exercício para esta versão do PMS.")
    x = PmsPas(plano_id=p.id, municipio_id=p.municipio_id, exercicio=body.exercicio, criado_por=current.username)
    db.add(x)
    await db.commit()
    await _audit(db, current, request, "PAS_CRIADA", "pms_pas", x.id, str(body.exercicio))
    return _dict_pas(x)


@router.post("/pas/{pas_id}/aprovar")
async def aprovar_pas(pas_id: int, body: AprovarIn, request: Request, current: SessaoMunicipal,
                      db: AsyncSession = Depends(get_db)):
    _planejador(current)
    x = await _get(db, current, PmsPas, pas_id, "pms_pas")
    if x.situacao != "rascunho":
        raise HTTPException(409, "PAS já aprovada.")
    if not (await db.execute(select(PmsAcao.id).where(PmsAcao.pas_id == x.id, PmsAcao.excluido_em.is_(None)).limit(1))).first():
        raise HTTPException(422, "A PAS não tem ações.")
    x.situacao, x.resolucao_cms, x.aprovada_por, x.aprovada_em = "aprovada", body.resolucao_cms, current.username, datetime.utcnow()
    svc.historico(db, x.municipio_id, "pas", x.id, "aprovada", body.resolucao_cms, current.username)
    await db.commit()
    await _audit(db, current, request, "PAS_APROVADA", "pms_pas", x.id, body.resolucao_cms)
    return _dict_pas(x)


# ── Ações ─────────────────────────────────────────────────────────────────────

class AcaoIn(BaseModel):
    codigo: str = Field(min_length=1, max_length=30)
    descricao: str = Field(min_length=3, max_length=4000)
    meta_ids: list[int] = Field(min_length=1)
    produto: Optional[str] = Field(None, max_length=300)
    quantidade_prevista: Optional[float] = Field(None, ge=0)
    prazo: Optional[date] = None
    setor_responsavel: Optional[str] = Field(None, max_length=150)
    responsavel_usuario_id: Optional[int] = None
    responsavel_nome: Optional[str] = Field(None, max_length=150)
    recursos: Optional[str] = Field(None, max_length=4000)
    fonte_financiamento: Optional[str] = Field(None, max_length=300)
    indicador_acompanhamento: Optional[str] = Field(None, max_length=300)
    evidencia_esperada: Optional[str] = Field(None, max_length=4000)


class AcaoUpd(BaseModel):
    codigo: Optional[str] = Field(None, min_length=1, max_length=30)
    descricao: Optional[str] = Field(None, min_length=3, max_length=4000)
    meta_ids: Optional[list[int]] = Field(None, min_length=1)
    produto: Optional[str] = Field(None, max_length=300)
    quantidade_prevista: Optional[float] = Field(None, ge=0)
    prazo: Optional[date] = None
    setor_responsavel: Optional[str] = Field(None, max_length=150)
    responsavel_usuario_id: Optional[int] = None
    responsavel_nome: Optional[str] = Field(None, max_length=150)
    recursos: Optional[str] = Field(None, max_length=4000)
    fonte_financiamento: Optional[str] = Field(None, max_length=300)
    indicador_acompanhamento: Optional[str] = Field(None, max_length=300)
    evidencia_esperada: Optional[str] = Field(None, max_length=4000)


async def _responsavel(db, u: UserOut, usuario_id: Optional[int]) -> Optional[str]:
    if usuario_id is None:
        return None
    r = await db.get(Usuario, usuario_id)
    if not r or r.municipio_id != u.municipio_id or not r.ativo:
        raise HTTPException(422, "Responsável deve ser um usuário ativo do município.")
    return r.nome


@router.get("/pas/{pas_id}/acoes")
async def listar_acoes(pas_id: int, current: SessaoMunicipal, setor: Optional[str] = None,
                       responsavel_usuario_id: Optional[int] = None, situacao: Optional[str] = None,
                       db: AsyncSession = Depends(get_db)):
    x = await _get(db, current, PmsPas, pas_id, "pms_pas")
    q = select(PmsAcao).where(PmsAcao.pas_id == x.id, PmsAcao.municipio_id == current.municipio_id,
                              PmsAcao.excluido_em.is_(None))
    if setor:
        q = q.where(PmsAcao.setor_responsavel == setor)
    if responsavel_usuario_id:
        q = q.where(PmsAcao.responsavel_usuario_id == responsavel_usuario_id)
    if situacao:
        q = q.where(PmsAcao.situacao == situacao)
    acoes = (await db.execute(q.order_by(PmsAcao.codigo))).scalars().all()
    pend = set((await db.execute(select(PmsAtualizacao.acao_id).where(
        PmsAtualizacao.municipio_id == current.municipio_id, PmsAtualizacao.status == "pendente"))).scalars())
    return [{**svc.dict_acao(a), "metas": await svc.metas_da_acao(db, a), "aguardando_validacao": a.id in pend}
            for a in acoes]


@router.post("/pas/{pas_id}/acoes", status_code=201)
async def criar_acao(pas_id: int, body: AcaoIn, request: Request, current: SessaoMunicipal,
                     db: AsyncSession = Depends(get_db)):
    _planejador(current)
    x = await _get(db, current, PmsPas, pas_id, "pms_pas")
    if (await db.execute(select(PmsAcao.id).where(PmsAcao.pas_id == x.id, PmsAcao.codigo == body.codigo))).first():
        raise HTTPException(409, f"Já existe ação {body.codigo} nesta PAS.")
    dados = body.model_dump(exclude={"meta_ids"})
    nome = await _responsavel(db, current, body.responsavel_usuario_id)
    if nome and not dados.get("responsavel_nome"):
        dados["responsavel_nome"] = nome
    a = PmsAcao(pas_id=x.id, municipio_id=current.municipio_id, criado_por=current.username, **dados)
    db.add(a)
    await db.flush()
    try:
        await svc.definir_metas(db, a, x.plano_id, body.meta_ids)
    except ValueError as e:
        await db.rollback()
        raise HTTPException(422, str(e))
    svc.historico(db, a.municipio_id, "acao", a.id, "criada", f"Ação {a.codigo} criada.", current.username)
    await db.commit()
    await _audit(db, current, request, "PAS_ACAO_CRIADA", "pms_acao", a.id, a.codigo)
    return {**svc.dict_acao(a), "metas": await svc.metas_da_acao(db, a)}


@router.get("/acoes/{acao_id}")
async def detalhe_acao(acao_id: int, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    a = await _get(db, current, PmsAcao, acao_id, "pms_acao")
    upds = (await db.execute(select(PmsAtualizacao).where(
        PmsAtualizacao.acao_id == a.id, PmsAtualizacao.municipio_id == current.municipio_id)
        .order_by(PmsAtualizacao.id.desc()))).scalars().all()
    anexos = (await db.execute(select(PmsAnexo).where(
        PmsAnexo.municipio_id == current.municipio_id, PmsAnexo.entidade == "acao", PmsAnexo.entidade_id == a.id,
        PmsAnexo.excluido_em.is_(None)))).scalars().all()
    hist = (await db.execute(select(PmsHistorico).where(
        PmsHistorico.municipio_id == current.municipio_id, PmsHistorico.entidade == "acao",
        PmsHistorico.entidade_id == a.id).order_by(PmsHistorico.id.desc()))).scalars().all()
    pas = await db.get(PmsPas, a.pas_id)
    return {**svc.dict_acao(a), "exercicio": pas.exercicio, "metas": await svc.metas_da_acao(db, a),
            "atualizacoes": [svc.dict_atualizacao(u) for u in upds], "anexos": [_dict_anexo(x) for x in anexos],
            "historico": [{"evento": h.evento, "descricao": h.descricao, "usuario": h.usuario,
                           "criado_em": h.criado_em.isoformat()} for h in hist],
            "pode_atualizar": _pode_atualizar(current, a, levantar=False),
            "pode_validar": svc.pode_validar(current)}


@router.put("/acoes/{acao_id}")
async def editar_acao(acao_id: int, body: AcaoUpd, request: Request, current: SessaoMunicipal,
                      db: AsyncSession = Depends(get_db)):
    _planejador(current)
    a = await _get(db, current, PmsAcao, acao_id, "pms_acao")
    pas = await db.get(PmsPas, a.pas_id)
    mud = body.model_dump(exclude_unset=True)
    metas = mud.pop("meta_ids", None)
    if pas.situacao == "aprovada" and set(mud) & {"codigo", "descricao", "quantidade_prevista"}:
        raise HTTPException(409, "PAS aprovada: código, descrição e quantidade só mudam por reprogramação.")
    if "responsavel_usuario_id" in mud:
        nome = await _responsavel(db, current, mud["responsavel_usuario_id"])
        if nome and "responsavel_nome" not in mud:
            mud["responsavel_nome"] = nome
    for k, v in mud.items():
        setattr(a, k, v)
    if metas is not None:
        try:
            await svc.definir_metas(db, a, pas.plano_id, metas)
        except ValueError as e:
            await db.rollback()
            raise HTTPException(422, str(e))
    a.atualizado_em = datetime.utcnow()
    svc.historico(db, a.municipio_id, "acao", a.id, "editada",
                  "Campos: " + ", ".join(sorted(mud) + (["metas"] if metas is not None else [])), current.username)
    await db.commit()
    await _audit(db, current, request, "PAS_ACAO_EDITADA", "pms_acao", a.id)
    return {**svc.dict_acao(a), "metas": await svc.metas_da_acao(db, a)}


@router.delete("/acoes/{acao_id}")
async def excluir_acao(acao_id: int, request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    _planejador(current)
    a = await _get(db, current, PmsAcao, acao_id, "pms_acao")
    pas = await db.get(PmsPas, a.pas_id)
    if pas.situacao == "aprovada":
        raise HTTPException(409, "PAS aprovada: a ação não é excluída (use cancelamento com justificativa).")
    a.excluido_em = datetime.utcnow()
    svc.historico(db, a.municipio_id, "acao", a.id, "excluida", f"Ação {a.codigo} excluída do rascunho.", current.username)
    await db.commit()
    await _audit(db, current, request, "PAS_ACAO_EXCLUIDA", "pms_acao", a.id)
    return {"ok": True}


# ── Execução e validação ─────────────────────────────────────────────────────

def _pode_atualizar(u: UserOut, a: PmsAcao, levantar: bool = True) -> bool:
    ok = svc.pode_validar(u) or (u.usuario_id is not None and a.responsavel_usuario_id == u.usuario_id)
    if not ok and levantar:
        raise HTTPException(403, "Só o responsável pela ação ou a coordenação podem atualizar a execução.")
    return ok


class AtualizacaoIn(BaseModel):
    situacao: Situacao
    percentual_execucao: Optional[float] = None
    quantidade_realizada: Optional[float] = Field(None, ge=0)
    resultado_alcancado: Optional[str] = Field(None, max_length=8000)
    justificativa: Optional[str] = Field(None, max_length=8000)


@router.post("/acoes/{acao_id}/atualizacoes", status_code=201)
async def informar_execucao(acao_id: int, body: AtualizacaoIn, request: Request, current: SessaoMunicipal,
                            db: AsyncSession = Depends(get_db)):
    a = await _get(db, current, PmsAcao, acao_id, "pms_acao")
    _pode_atualizar(current, a)
    if a.situacao == "cancelada":
        raise HTTPException(409, "Ação cancelada.")
    try:
        svc.validar_atualizacao_informada(body.situacao, body.justificativa, body.resultado_alcancado,
                                          body.percentual_execucao)
    except ValueError as e:
        raise HTTPException(422, str(e))
    if (await db.execute(select(PmsAtualizacao.id).where(
            PmsAtualizacao.acao_id == a.id, PmsAtualizacao.status == "pendente"))).first():
        raise HTTPException(409, "Já existe atualização aguardando validação para esta ação.")
    u = PmsAtualizacao(acao_id=a.id, municipio_id=a.municipio_id, informado_por=current.username, **body.model_dump())
    db.add(u)
    await db.flush()
    svc.historico(db, a.municipio_id, "acao", a.id, "execucao_informada",
                  f"Informado: {svc.SITUACOES_ACAO[body.situacao]} (aguardando validação).", current.username)
    await db.commit()
    await _audit(db, current, request, "PAS_EXECUCAO_INFORMADA", "pms_atualizacao", u.id, f"{a.codigo}: {body.situacao}")
    return svc.dict_atualizacao(u)


@router.post("/acoes/{acao_id}/anexos", status_code=201)
async def anexar_evidencia(acao_id: int, request: Request, current: SessaoMunicipal, arquivo: UploadFile = File(...),
                           descricao: Optional[str] = Form(None), atualizacao_id: Optional[int] = Form(None),
                           db: AsyncSession = Depends(get_db)):
    a = await _get(db, current, PmsAcao, acao_id, "pms_acao")
    _pode_atualizar(current, a)
    if atualizacao_id:
        upd = await _get(db, current, PmsAtualizacao, atualizacao_id, "pms_atualizacao")
        if upd.acao_id != a.id:
            raise HTTPException(422, "Atualização de outra ação.")
    an = await _salvar_anexo(db, current, "acao", a.id, arquivo, descricao, atualizacao_id=atualizacao_id)
    svc.historico(db, a.municipio_id, "acao", a.id, "evidencia", f"Evidência anexada: {an.nome_original}", current.username)
    await db.commit()
    await _audit(db, current, request, "PAS_EVIDENCIA", "pms_anexo", an.id, an.nome_original)
    return _dict_anexo(an)


class ValidarIn(BaseModel):
    decisao: Literal["validar", "devolver"]
    parecer: Optional[str] = Field(None, max_length=4000)


@router.post("/atualizacoes/{upd_id}/validar")
async def validar_execucao(upd_id: int, body: ValidarIn, request: Request, current: SessaoMunicipal,
                           db: AsyncSession = Depends(get_db)):
    if not svc.pode_validar(current):
        raise HTTPException(403, "Perfil sem permissão para validar a execução.")
    u = await _get(db, current, PmsAtualizacao, upd_id, "pms_atualizacao")
    if u.status != "pendente":
        raise HTTPException(409, "Atualização já analisada.")
    if u.informado_por == current.username:
        raise HTTPException(409, "A validação deve ser feita por outra pessoa, não por quem informou.")
    a = await _get(db, current, PmsAcao, u.acao_id, "pms_acao")
    parecer = (body.parecer or "").strip()
    if body.decisao == "devolver":
        if not parecer:
            raise HTTPException(422, "Explique o motivo da devolução.")
        u.status = "devolvida"
    else:
        if u.situacao == "cancelada" and not (current.administrador_geral or current.role in svc.PERFIS_AUTORIZA_CANCELAMENTO):
            raise HTTPException(403, "Cancelamento precisa da autorização do Secretário ou da Coordenação de Planejamento.")
        if u.situacao == "concluida" and a.evidencia_esperada and not await svc.tem_evidencia(db, a):
            raise HTTPException(422, "Anexe a evidência esperada antes de validar a conclusão.")
        u.status = "validada"
        a.situacao, a.percentual_execucao = u.situacao, u.percentual_execucao
        a.quantidade_realizada, a.resultado_alcancado, a.justificativa = u.quantidade_realizada, u.resultado_alcancado, u.justificativa
        a.situacao_validada_por, a.situacao_validada_em, a.atualizado_em = current.username, datetime.utcnow(), datetime.utcnow()
    u.validado_por, u.validado_em, u.parecer = current.username, datetime.utcnow(), parecer or None
    svc.historico(db, a.municipio_id, "acao", a.id, "execucao_" + u.status,
                  f"{'Validado' if u.status == 'validada' else 'Devolvido'}: {svc.SITUACOES_ACAO[u.situacao]}"
                  + (f" — {parecer}" if parecer else ""), current.username)
    await db.commit()
    await _audit(db, current, request, "PAS_EXECUCAO_" + u.status.upper(), "pms_atualizacao", u.id, a.codigo)
    return {"atualizacao": svc.dict_atualizacao(u), "acao": svc.dict_acao(a)}


@router.get("/validacoes-pendentes")
async def validacoes_pendentes(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(PmsAtualizacao, PmsAcao).join(PmsAcao, PmsAcao.id == PmsAtualizacao.acao_id).where(
        PmsAtualizacao.municipio_id == current.municipio_id, PmsAtualizacao.status == "pendente",
        PmsAcao.excluido_em.is_(None)).order_by(PmsAtualizacao.informado_em))).all()
    return [{**svc.dict_atualizacao(u), "acao": {"id": a.id, "codigo": a.codigo, "descricao": a.descricao,
                                                 "evidencia_esperada": a.evidencia_esperada,
                                                 "tem_evidencia": await svc.tem_evidencia(db, a)},
             "pode_validar": svc.pode_validar(current) and u.informado_por != current.username}
            for u, a in rows]


# ── Minhas Ações ─────────────────────────────────────────────────────────────

@router.get("/minhas-acoes")
async def minhas_acoes(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    if current.usuario_id is None:
        return {"acoes": [], "resumo": {}, "nota": "Sessão sem usuário municipal vinculado."}
    rows = (await db.execute(select(PmsAcao, PmsPas).join(PmsPas, PmsPas.id == PmsAcao.pas_id).where(
        PmsAcao.municipio_id == current.municipio_id, PmsAcao.responsavel_usuario_id == current.usuario_id,
        PmsAcao.excluido_em.is_(None), PmsAcao.situacao != "cancelada")
        .order_by(PmsAcao.prazo.is_(None), PmsAcao.prazo))).all()
    upd = {}
    for u in (await db.execute(select(PmsAtualizacao).where(
            PmsAtualizacao.municipio_id == current.municipio_id,
            PmsAtualizacao.acao_id.in_([a.id for a, _ in rows] or [0])).order_by(PmsAtualizacao.id))).scalars():
        upd[u.acao_id] = u
    saida = []
    for a, pas in rows:
        ult = upd.get(a.id)
        d = {**svc.dict_acao(a), "exercicio": pas.exercicio, "metas": await svc.metas_da_acao(db, a),
             "aguardando_validacao": bool(ult and ult.status == "pendente"),
             "devolvida": bool(ult and ult.status == "devolvida"), "parecer": ult.parecer if ult else None,
             "evidencia_pendente": bool(a.evidencia_esperada) and not await svc.tem_evidencia(db, a)
                                   and a.situacao not in {"cancelada", "nao_executada"}}
        saida.append(d)
    resumo = {"total": len(saida), "atrasadas": sum(x["atrasada"] for x in saida),
              "prazo_proximo": sum(x["prazo_proximo"] for x in saida),
              "aguardando_validacao": sum(x["aguardando_validacao"] for x in saida),
              "devolvidas": sum(x["devolvida"] for x in saida),
              "evidencias_pendentes": sum(x["evidencia_pendente"] for x in saida)}
    return {"acoes": saida, "resumo": resumo}


@router.get("/responsaveis")
async def responsaveis(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    us = (await db.execute(select(Usuario).where(Usuario.municipio_id == current.municipio_id, Usuario.ativo.is_(True))
                           .order_by(Usuario.nome))).scalars().all()
    return [{"id": u.id, "nome": u.nome, "perfil": getattr(u.perfil, "value", u.perfil)} for u in us]
