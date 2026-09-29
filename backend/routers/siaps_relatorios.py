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
        from services import indicadores_motor as motor
        await motor.garantir_catalogo(db)
        log = await motor.normalizar_relatorio(db, reg, current.username)
        resultado.append({"arquivo": nome, "ok": True, "substituiu": substituiu, **_meta(reg),
                          "processamento": {"incluidos": log.registros_inseridos, "atualizados": log.registros_atualizados,
                                            "rejeitados": log.registros_rejeitados, "avisos": log.observacao}})
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

    # Cruzamento: equipe ativa (SIAPS público; senão XML do CNES) sem relatório na competência
    from routers.cnes_xml import ultima_importacao
    from services.siaps_equipes import equipes_do_municipio
    cnes = await ultima_importacao(db, current.municipio_id)
    oficiais = await equipes_do_municipio(db, current.municipio_id)
    fora_do_siaps = []
    if oficiais:
        for e in oficiais:
            if e.tipo in ("eSF", "eAP", "eSFR") and e.ine not in equipes:
                fora_do_siaps.append({"ine": e.ine, "equipe": e.nome, "sigla": e.tipo})
        for e in equipes.values():
            e["no_cnes"] = any(o.ine == e["ine"] for o in oficiais)
    elif cnes:
        for e in cnes["equipes"]:
            if not e["desativada_em"] and e["tp_equipe"] in ("70", "76") and e["ine"] not in equipes:
                fora_do_siaps.append({"ine": e["ine"], "equipe": e["nome"], "sigla": e["sigla"]})
        for e in equipes.values():
            e["no_cnes"] = any(c["ine"] == e["ine"] for c in cnes["equipes"])

    avisos = []
    if fora_do_siaps:
        avisos.append("Equipe(s) ativa(s) no CNES sem nenhum relatório do SIAPS importado nesta competência: "
                      + ", ".join(f"{x['equipe']} (INE {x['ine']})" for x in fora_do_siaps)
                      + ". Baixe também a aba do tipo dessa equipe no SIAPS (ex.: eSFR).")
    if any(e["sigla"].upper() == "ESFR" for e in equipes.values()):
        avisos.append(AVISO_ESFR)
    if any(r.dado_preliminar for r in do_mes):
        avisos.append("Dado preliminar no SIAPS: os valores podem mudar até o fechamento da competência.")
    return {"situacao_dado": "oficial_validado", "fonte": "SIAPS — relatório exportado pelo município",
            "competencias": competencias, "competencia": comp, "cvat": cvat, "qualidade": qualidade,
            "equipes": sorted(equipes.values(), key=lambda e: (e["sigla"], e["equipe"])),
            "relatorios": [_meta(r) for r in todos], "avisos": avisos,
            "cnes": {"importado": bool(cnes), "data_arquivo": cnes.get("data_arquivo") if cnes else None,
                     "equipes_sem_relatorio_siaps": fora_do_siaps}}


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


@router.get("/equipes")
async def equipes_oficiais(current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    """Equipes do município pela API pública do SIAPS (atualizadas automaticamente toda semana)."""
    from services import siaps_equipes as se
    eqs = await se.equipes_do_municipio(db, current.municipio_id)
    return {"situacao_dado": "oficial_validado" if eqs else "nao_disponivel",
            "fonte": "SIAPS — API pública (apisiaps.saude.gov.br)",
            "atualizado_em": max((e.atualizado_em for e in eqs), default=None),
            "por_tipo": se.por_tipo(eqs),
            "equipes": [{"ine": e.ine, "nome": e.nome, "tipo": e.tipo} for e in eqs]}


@router.post("/equipes/sincronizar")
async def sincronizar_equipes(request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    """Atualiza agora (além da rotina semanal automática)."""
    from services import siaps_equipes as se
    _pode_editar(current)
    try:
        r = await se.sincronizar(db, current.municipio_id, current.municipio_ibge)
    except se.SiapsIndisponivel as e:
        raise HTTPException(503, str(e))
    await registrar_auditoria(db, "SIAPS_EQUIPES_SINCRONIZADAS", usuario=current, ip=ip_de(request),
                              tabela="equipes_siaps", detalhe=f"{r.get('equipes')} equipes {r.get('por_tipo')}")
    return r


@router.post("/reprocessar")
async def reprocessar(request: Request, current: SessaoMunicipal, db: AsyncSession = Depends(get_db)):
    """Refaz a normalização de todos os relatórios do município no motor de indicadores."""
    from services import indicadores_motor as motor
    _pode_editar(current)
    n = await motor.reprocessar_municipio(db, current.municipio_id)
    await registrar_auditoria(db, "INDICADORES_REPROCESSADOS", usuario=current, ip=ip_de(request),
                              tabela="resultado_mensal_siaps", detalhe=f"{n} relatório(s)")
    return {"ok": True, "relatorios": n}


@router.get("/resultados")
async def resultados(current: SessaoMunicipal,
                     competencia: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$"),
                     tipo: Optional[str] = Query(None, max_length=10),
                     ine: Optional[str] = Query(None, pattern=r"^\d{1,10}$"),
                     indicador: Optional[str] = Query(None, max_length=10),
                     db: AsyncSession = Depends(get_db)):
    """Resultados oficiais por equipe/INE (motor de indicadores): resultado, meta, GAP, fonte,
    cartões de resumo e "Atenção necessária". Sempre o município da sessão."""
    from models.indicadores_aps import IndicadorConfig, ResultadoCvatMensal, ResultadoMensalSiaps, SincronizacaoLog
    from services.siaps_equipes import equipes_do_municipio
    ibge = current.municipio_ibge
    comps = sorted({c for (c,) in (await db.execute(select(ResultadoMensalSiaps.competencia)
                    .where(ResultadoMensalSiaps.municipio_ibge == ibge).distinct())).all()} |
                   {c for (c,) in (await db.execute(select(ResultadoCvatMensal.competencia)
                    .where(ResultadoCvatMensal.municipio_ibge == ibge).distinct())).all()}, reverse=True)
    if not comps:
        return {"situacao_dado": "nao_disponivel", "competencias": []}
    comp = competencia if competencia in comps else comps[0]

    q = select(ResultadoMensalSiaps).where(ResultadoMensalSiaps.municipio_ibge == ibge,
                                           ResultadoMensalSiaps.competencia == comp)
    if ine:
        q = q.where(ResultadoMensalSiaps.equipe_ine == ine.zfill(10))
    if indicador:
        q = q.where(ResultadoMensalSiaps.indicador_codigo == indicador.upper())
    if tipo:
        q = q.where(ResultadoMensalSiaps.equipe_tipo == tipo)
    qual = (await db.execute(q.order_by(ResultadoMensalSiaps.indicador_codigo,
                                        ResultadoMensalSiaps.equipe_nome))).scalars().all()
    cvat = []
    if not indicador or indicador.upper() == "CVAT":
        qc = select(ResultadoCvatMensal).where(ResultadoCvatMensal.municipio_ibge == ibge,
                                               ResultadoCvatMensal.competencia == comp)
        if ine:
            qc = qc.where(ResultadoCvatMensal.equipe_ine == ine.zfill(10))
        if tipo:
            qc = qc.where(ResultadoCvatMensal.equipe_tipo == tipo)
        cvat = (await db.execute(qc.order_by(ResultadoCvatMensal.equipe_nome))).scalars().all()
    catalogo = {c.codigo: c for c in (await db.execute(
        select(IndicadorConfig).where(IndicadorConfig.vigente.is_(True)))).scalars()}

    linhas = []
    for r in qual:
        gap = round(r.resultado_pct - r.meta, 2) if r.resultado_pct is not None and r.meta is not None else None
        cfg = catalogo.get(r.indicador_codigo)
        linhas.append({"componente": "qualidade", "indicador": r.indicador_codigo, "indicador_nome": r.indicador_nome,
                       "equipe": r.equipe_nome, "ine": r.equipe_ine, "tipo": r.equipe_tipo, "cnes": r.cnes,
                       "numerador": r.numerador, "denominador": r.denominador, "resultado": r.resultado_pct,
                       "meta": r.meta, "gap": gap, "classificacao": r.classificacao,
                       "meta_status": "confirmada" if r.meta is not None else "pendente_parametrizacao",
                       "regra": f"{r.indicador_codigo} v{r.versao_metodologia}"
                                + (f" — {cfg.nota_metodologica}" if cfg else ""),
                       "situacao": r.situacao, "fonte": r.fonte,
                       "coletado_em": r.data_extracao.isoformat() if r.data_extracao else None})
    for r in cvat:
        linhas.append({"componente": "cvat", "indicador": "CVAT", "indicador_nome": "Vínculo e Acompanhamento Territorial",
                       "equipe": r.equipe_nome, "ine": r.equipe_ine, "tipo": r.equipe_tipo, "cnes": r.cnes,
                       "numerador": r.var_K, "denominador": r.populacao_parametro, "resultado": r.pontuacao,
                       "meta": None, "gap": None, "classificacao": r.classificacao, "meta_status": "faixa_cvat",
                       "regra": f"CVAT v{r.versao_metodologia}", "situacao": r.situacao, "fonte": r.fonte,
                       "coletado_em": r.data_extracao.isoformat() if r.data_extracao else None})

    oficiais = await equipes_do_municipio(db, current.municipio_id)
    avaliaveis = [e for e in oficiais if e.tipo in ("eSF", "eAP", "eSFR", "eSB", "eMulti")]
    com_dado = {l["ine"] for l in linhas}
    atencao = []
    for l in linhas:
        if l["classificacao"] == "regular" or (l["gap"] is not None and l["gap"] < 0):
            atencao.append({"tipo": "abaixo_da_meta", "equipe": l["equipe"], "ine": l["ine"],
                            "indicador": l["indicador"], "resultado": l["resultado"], "meta": l["meta"],
                            "gap": l["gap"], "classificacao": l["classificacao"],
                            "origem_provavel": "produção/registro da equipe no e-SUS PEC abaixo do esperado"})
        if (l["componente"] == "qualidade" and l["numerador"] is not None and l["denominador"] is not None
                and l["numerador"] > l["denominador"]):
            atencao.append({"tipo": "inconsistencia", "equipe": l["equipe"], "ine": l["ine"],
                            "indicador": l["indicador"],
                            "origem_provavel": "numerador maior que denominador no relatório da fonte"})
    for e in avaliaveis:
        if e.ine not in com_dado and (not tipo or e.tipo == tipo) and (not ine or e.ine == ine.zfill(10)):
            atencao.append({"tipo": "sem_dados", "equipe": e.nome, "ine": e.ine, "indicador": None,
                            "origem_provavel": "relatório do SIAPS desta equipe/tipo ainda não coletado na competência"})

    ult = (await db.execute(select(SincronizacaoLog).where(SincronizacaoLog.municipio_ibge == ibge)
                            .order_by(SincronizacaoLog.id.desc()).limit(1))).scalar_one_or_none()
    comparaveis = [l for l in linhas if l["gap"] is not None]
    return {
        "situacao_dado": "oficial_validado", "competencias": comps, "competencia": comp,
        "cards": {"equipes_monitoradas": len(avaliaveis) or len({l["ine"] for l in linhas}),
                  "indicadores_monitorados": len({l["indicador"] for l in linhas}),
                  "meta_atingida": sum(1 for l in comparaveis if l["gap"] >= 0),
                  "abaixo_da_meta": sum(1 for l in comparaveis if l["gap"] < 0),
                  "sem_meta_parametrizada": sum(1 for l in linhas if l["meta_status"] == "pendente_parametrizacao"),
                  "sem_dados": sum(1 for a in atencao if a["tipo"] == "sem_dados")},
        "ultima_sincronizacao": {"em": ult.concluido_em.isoformat() if ult and ult.concluido_em else None,
                                 "sucesso": ult.sucesso if ult else None, "metodo": ult.metodo if ult else None,
                                 "observacao": ult.observacao if ult else None},
        "linhas": linhas, "atencao_necessaria": atencao,
        "nota": "Resultados oficiais publicados pelo SIAPS (não recalculados pelo ERSUS360). "
                "Meta/faixa exibida só quando confirmada na fonte oficial.",
    }
