"""
Router: /api/cnes-xml — importação do XML-CNES do SISAB (Gerador de Arquivo
XML-CNES para o e-SUS APS). Multi-município: o arquivo só é aceito se for do
município da sessão, e cada município vê só as próprias importações.
"""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.cnes_xml import CnesXmlImportacao
from routers.auth import ip_de
from routers.fns_previsao import _pode_editar
from services import cnes_xml as cx
from tenancy.auditoria import registrar_auditoria
from tenancy.contexto import eh_legado
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/cnes-xml", tags=["CNES — Importação XML do SISAB"])


def _marcacoes() -> dict[str, dict]:
    """Marcação de eSF ribeirinha (o XML não traz). Hoje só há referência verificada para Apuí."""
    if not eh_legado():
        return {}
    from services.cnes_service import _equipes_verificadas_cnes
    return {e["ine"]: {"ribeirinha": bool(e.get("ribeirinha")), "fonte": "CNES Web (verificado em 05/09/2026)"}
            for e in _equipes_verificadas_cnes()}


def _resumo(reg: CnesXmlImportacao) -> dict:
    return {"id": reg.id, "data_arquivo": reg.data_arquivo, "versao_xsd": reg.versao_xsd,
            "arquivo_nome": reg.arquivo_nome, "totais": json.loads(reg.totais),
            "importado_por": reg.importado_por,
            "importado_em": reg.importado_em.isoformat() if reg.importado_em else None}


async def _ultimas(db: AsyncSession, municipio_id: int, n: int) -> list[CnesXmlImportacao]:
    return list((await db.execute(select(CnesXmlImportacao)
                                  .where(CnesXmlImportacao.municipio_id == municipio_id)
                                  .order_by(CnesXmlImportacao.id.desc()).limit(n))).scalars())


@router.post("/importar")
async def importar(request: Request, current: SessaoMunicipal,
                   arquivo: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    _pode_editar(current)
    conteudo = await arquivo.read(cx.TAMANHO_MAXIMO + 1)
    try:
        dados = cx.ler_arquivo(conteudo, arquivo.filename or "")
    except cx.ArquivoInvalido as e:
        raise HTTPException(422, str(e))
    if not cx.mesmo_municipio(dados["municipio_ibge"], current.municipio_ibge):
        await registrar_auditoria(db, "CNES_XML_RECUSADO", usuario=current, ip=ip_de(request),
                                  tabela="cnes_xml_importacoes",
                                  detalhe=f"arquivo do IBGE {dados['municipio_ibge']} ≠ sessão {current.municipio_ibge}")
        raise HTTPException(422, f"Este arquivo é do município IBGE {dados['municipio_ibge']}, "
                                 f"não do município da sessão ({current.municipio_ibge}).")
    tot = cx.totais(dados)
    reg = CnesXmlImportacao(
        municipio_id=current.municipio_id, municipio_ibge=current.municipio_ibge,
        data_arquivo=dados["data_arquivo"], versao_xsd=dados["versao_xsd"],
        arquivo_nome=(arquivo.filename or "")[:255] or None,
        totais=json.dumps(tot, ensure_ascii=False),
        dados=json.dumps({k: dados[k] for k in ("data_arquivo", "estabelecimentos", "equipes", "profissionais")},
                         ensure_ascii=False),
        importado_por=current.username)
    db.add(reg)
    await db.commit()
    await registrar_auditoria(db, "CNES_XML_IMPORTADO", usuario=current, ip=ip_de(request),
                              tabela="cnes_xml_importacoes", registro_id=reg.id,
                              detalhe=f"XML-CNES v{dados['versao_xsd']} de {dados['data_arquivo']}: "
                                      f"{tot['equipes_ativas']} equipes ativas, {tot['profissionais']} profissionais")
    return {"ok": True, **_resumo(reg)}


@router.get("/painel")
async def painel(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    ultimas = await _ultimas(db, current.municipio_id, 2)
    if not ultimas:
        return {"situacao_dado": "nao_disponivel", "importacao": None}
    atual = json.loads(ultimas[0].dados)
    anterior = json.loads(ultimas[1].dados) if len(ultimas) > 1 else None
    return {"situacao_dado": "oficial_validado", "fonte": "CNES — XML do SISAB",
            "importacao": _resumo(ultimas[0]), **cx.analisar(atual, _marcacoes()),
            "comparacao": cx.comparar(atual, anterior)}


@router.get("/historico")
async def historico(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    return [_resumo(r) for r in await _ultimas(db, current.municipio_id, 24)]
