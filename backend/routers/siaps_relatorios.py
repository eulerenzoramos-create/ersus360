"""
Router: /api/siaps-relatorios — importação dos relatórios "Baixar dados" do SIAPS
(CVAT e Qualidade, Visão por Competência). Multi-município: só aceita arquivo do
município da sessão e cada município vê apenas os próprios relatórios.
"""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.siaps_relatorio import SiapsRelatorio
from routers.auth import ip_de
from routers.fns_previsao import _pode_editar
from services import siaps_relatorio as sr
from tenancy.auditoria import registrar_auditoria
from tenancy.escopo import SessaoMunicipal

router = APIRouter(prefix="/api/siaps-relatorios", tags=["SIAPS — Relatórios importados"])

AVISO_ESFR = ("O componente Vínculo e Acompanhamento (CVAT) do SIAPS avalia só eAP e eSF: "
              "equipes eSFR (ribeirinhas) aparecem apenas no Componente Qualidade.")


async def relatorios_do_municipio(db: AsyncSession, municipio_id: int, componente: Optional[str] = None,
                                  competencia: Optional[str] = None) -> list[SiapsRelatorio]:
    stmt = select(SiapsRelatorio).where(SiapsRelatorio.municipio_id == municipio_id)
    if componente:
        stmt = stmt.where(SiapsRelatorio.componente == componente)
    if competencia:
        stmt = stmt.where(SiapsRelatorio.competencia == competencia)
    return list((await db.execute(stmt.order_by(SiapsRelatorio.competencia.desc(),
                                                SiapsRelatorio.componente, SiapsRelatorio.indicador))).scalars())


def resumo_cvat(linhas: list[dict]) -> dict:
    pts = [l["pontuacao"] for l in linhas if l.get("pontuacao") is not None]
    status = [sr.status_cvat(l.get("pontuacao")) for l in linhas]
    return {"equipes": len(linhas),
            "pessoas_vinculadas": sum(l.get("K") or 0 for l in linhas),
            "pessoas_acompanhadas": sum(l.get("H") or 0 for l in linhas),
            "pontuacao_media": round(sum(pts) / len(pts), 2) if pts else None,
            "por_status": {s: status.count(s) for s in ("otimo", "bom", "suficiente", "regular")}}


def _meta(r: SiapsRelatorio) -> dict:
    return {"id": r.id, "componente": r.componente, "indicador": r.indicador, "competencia": r.competencia,
            "tipo_equipe": r.tipo_equipe, "condicao": r.condicao, "dado_preliminar": r.dado_preliminar,
            "gerado_em": r.gerado_em, "arquivo_nome": r.arquivo_nome, "importado_por": r.importado_por,
            "importado_em": r.importado_em.isoformat() if r.importado_em else None,
            "equipes": len(json.loads(r.linhas))}


@router.post("/importar")
async def importar(request: Request, current: SessaoMunicipal,
                   arquivos: list[UploadFile] = File(...), db: AsyncSession = Depends(get_db)):
    """Aceita um ou vários arquivos (.csv ou .xlsx) de uma vez."""
    _pode_editar(current)
    resultado = []
    for arq in arquivos:
        nome = arq.filename or ""
        try:
            d = sr.ler_relatorio(await arq.read(sr.TAMANHO_MAXIMO + 1), nome)
        except sr.RelatorioInvalido as e:
            resultado.append({"arquivo": nome, "ok": False, "erro": str(e)})
            continue
        if d["municipio_ibge"][:6] != (current.municipio_ibge or "")[:6]:
            await registrar_auditoria(db, "SIAPS_RELATORIO_RECUSADO", usuario=current, ip=ip_de(request),
                                      tabela="siaps_relatorios",
                                      detalhe=f"{nome}: IBGE {d['municipio_ibge']} ≠ sessão {current.municipio_ibge}")
            resultado.append({"arquivo": nome, "ok": False,
                              "erro": f"Relatório do município {d['municipio_ibge']}, não do município da sessão."})
            continue
        chave = (SiapsRelatorio.municipio_id == current.municipio_id, SiapsRelatorio.componente == d["componente"],
                 SiapsRelatorio.indicador == d["indicador"], SiapsRelatorio.competencia == d["competencia"],
                 SiapsRelatorio.tipo_equipe == d["tipo_equipe"])
        reg = (await db.execute(select(SiapsRelatorio).where(*chave))).scalar_one_or_none()
        substituiu = reg is not None
        if not reg:
            reg = SiapsRelatorio(municipio_id=current.municipio_id, municipio_ibge=current.municipio_ibge,
                                 componente=d["componente"], indicador=d["indicador"],
                                 competencia=d["competencia"], tipo_equipe=d["tipo_equipe"])
            db.add(reg)
        reg.condicao, reg.dado_preliminar, reg.gerado_em = d["condicao"], d["dado_preliminar"], d["gerado_em"]
        reg.colunas = json.dumps(d["colunas"], ensure_ascii=False)
        reg.linhas = json.dumps(d["linhas"], ensure_ascii=False)
        reg.arquivo_nome, reg.importado_por = nome[:255] or None, current.username
        await db.commit()
        await registrar_auditoria(db, "SIAPS_RELATORIO_IMPORTADO", usuario=current, ip=ip_de(request),
                                  tabela="siaps_relatorios", registro_id=reg.id,
                                  detalhe=f"{d['componente']} {d['indicador'] or ''} {d['competencia']} "
                                          f"{d['tipo_equipe']}: {len(d['linhas'])} equipes"
                                          f"{' (substituiu)' if substituiu else ''}")
        resultado.append({"arquivo": nome, "ok": True, "substituiu": substituiu, **_meta(reg)})
    return {"resultados": resultado}


@router.get("/painel")
async def painel(current: SessaoMunicipal, competencia: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
                 db: AsyncSession = Depends(get_db)):
    todos = await relatorios_do_municipio(db, current.municipio_id)
    if not todos:
        return {"situacao_dado": "nao_disponivel", "competencias": []}
    competencias = sorted({r.competencia for r in todos}, reverse=True)
    comp = competencia if competencia in competencias else competencias[0]
    do_mes = [r for r in todos if r.competencia == comp]

    equipes: dict[str, dict] = {}
    cvat, qualidade = None, []
    for r in do_mes:
        linhas = json.loads(r.linhas)
        for l in linhas:
            e = equipes.setdefault(l["ine"], {"ine": l["ine"], "equipe": l["equipe"], "ubs": l["ubs"],
                                              "sigla": l["sigla"], "cvat_pontuacao": None, "cvat_status": None,
                                              "pessoas_vinculadas": None, "qualidade": {}})
            if r.componente == "cvat":
                e.update(cvat_pontuacao=l["pontuacao"], cvat_status=sr.status_cvat(l["pontuacao"]),
                         pessoas_vinculadas=l.get("K"))
            else:
                e["qualidade"][r.indicador] = l["pontuacao"]
        if r.componente == "cvat":
            cvat = {**_meta(r), "resumo": resumo_cvat(linhas),
                    "linhas": [{**l, "status": sr.status_cvat(l["pontuacao"])} for l in linhas]}
        else:
            qualidade.append({**_meta(r), "colunas": json.loads(r.colunas), "linhas": linhas})

    avisos = []
    if any(e["sigla"].upper() == "ESFR" for e in equipes.values()):
        avisos.append(AVISO_ESFR)
    if any(r.dado_preliminar for r in do_mes):
        avisos.append("Dado preliminar no SIAPS: os valores podem mudar até o fechamento da competência.")
    return {"situacao_dado": "oficial_validado", "fonte": "SIAPS — relatório exportado pelo município",
            "competencias": competencias, "competencia": comp, "cvat": cvat, "qualidade": qualidade,
            "equipes": sorted(equipes.values(), key=lambda e: (e["sigla"], e["equipe"])),
            "relatorios": [_meta(r) for r in todos], "avisos": avisos}


@router.get("/calendario")
async def calendario(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    """Calendário oficial de envio ao SIAPS + relatórios que já deviam ter sido importados."""
    from datetime import date
    from services import siaps_calendario as cal
    hoje = date.today()
    itens = cal.calendario(hoje)
    importadas = {r.competencia for r in await relatorios_do_municipio(db, current.municipio_id, "cvat")}
    vencidos = [i for i in itens if i["data_relatorio"] <= hoje.isoformat()]
    for i in itens:
        i["relatorio_importado"] = i["competencia"] in importadas
    return {"hoje": hoje.isoformat(), "fonte": cal.FONTE, "calendario": itens,
            "proximo_prazo": cal.proximo_prazo(hoje),
            # só as 3 últimas competências fechadas — o histórico antigo não gera cobrança
            "relatorios_pendentes": [i for i in vencidos[-3:] if i["competencia"] not in importadas]}
