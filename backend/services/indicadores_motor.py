"""
Motor de indicadores APS — camada de dados.

O ERSUS360 NÃO recalcula os indicadores do Ministério: guarda o resultado OFICIAL publicado
pelo SIAPS (relatório "Baixar dados" importado ou coletado), com numerador, denominador e o
dado bruto, nas tabelas já existentes do módulo Indicadores APS:

  indicador_config        catálogo versionado (código, nome, tipo de equipe, vigência, meta)
  resultado_mensal_siaps  Componente Qualidade por equipe/INE/indicador/competência
  resultado_cvat_mensal   Vínculo e Acompanhamento (A…K) por equipe/INE/competência
  sincronizacao_log       rastreabilidade de cada processamento

Metas/faixas: só as confirmadas na fonte oficial. Demais ficam "pendente de parametrização".
"""
from __future__ import annotations

import json
import time
from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.indicadores_aps import IndicadorConfig, ResultadoCvatMensal, ResultadoMensalSiaps, SincronizacaoLog
from services.siaps_relatorio import CVAT_CHAVES, INDICADORES_QUALIDADE, codigo_indicador, status_cvat

VERSAO = "2026.1"
VIGENCIA_INICIO = "2026-01"
FONTE_CATALOGO = "apisiaps.saude.gov.br/api/public/filtros/componentes (conferido em 29/09/2026)"
FONTE_RESULTADO = "SIAPS — relatório oficial"

TIPO_POR_PREFIXO = {"C": "eSF,eAP", "R": "eSFR", "B": "eSB", "M": "eMulti", "CR": "eCR", "P": "eAPP"}

# Faixas confirmadas na tela oficial do SIAPS (Componente Qualidade → Mais Acesso à APS, legenda
# "Pontuação": Regular <=10 ou >70 · Suficiente >10 e <=30 · Bom >30 e <=50 · Ótimo >50 e <=70).
FAIXAS_CONFIRMADAS = {
    "C1": {"fonte": "SIAPS — legenda da Visão por Competência (Mais Acesso à APS), 28/09/2026",
           "meta_referencia": 50.0},
}


def tipo_equipe(codigo: str) -> str:
    prefixo = "CR" if codigo.startswith("CR") else codigo[0]
    return TIPO_POR_PREFIXO.get(prefixo, "")


def classificar(codigo: str, valor: float | None) -> str | None:
    if valor is None or codigo not in FAIXAS_CONFIRMADAS:
        return None
    if codigo == "C1":
        if valor <= 10 or valor > 70:
            return "regular"
        return "suficiente" if valor <= 30 else "bom" if valor <= 50 else "otimo"
    return None


async def garantir_catalogo(db: AsyncSession) -> int:
    """Cadastra no catálogo versionado os indicadores oficiais ainda ausentes. Não altera versões existentes."""
    existentes = {(c, v) for c, v in (await db.execute(select(IndicadorConfig.codigo, IndicadorConfig.versao))).all()}
    novos = 0
    for codigo, nome in list(INDICADORES_QUALIDADE.items()) + [("CVAT", "Vínculo e Acompanhamento Territorial")]:
        if (codigo, VERSAO) in existentes:
            continue
        faixa = FAIXAS_CONFIRMADAS.get(codigo)
        db.add(IndicadorConfig(
            codigo=codigo, nome=nome, tipo_equipe="eSF,eAP" if codigo == "CVAT" else tipo_equipe(codigo),
            periodo_afericao="mensal", fonte="SIAPS", versao=VERSAO, vigente=True, vigencia_inicio=VIGENCIA_INICIO,
            parametro_meta=faixa["meta_referencia"] if faixa else None,
            nota_metodologica=(f"Faixas: {faixa['fonte']}." if faixa else
                               "Meta/faixa pendente de parametrização conforme ficha técnica oficial.")
                              + f" Catálogo: {FONTE_CATALOGO}.",
        ))
        novos += 1
    if novos:
        await db.commit()
    return novos


def _num(v):
    return float(v) if isinstance(v, (int, float)) else None


async def normalizar_relatorio(db: AsyncSession, rel, usuario: str | None = None) -> SincronizacaoLog:
    """Grava o relatório do SIAPS (models.siaps_relatorio.SiapsRelatorio) nas tabelas de resultado.
    Idempotente: reprocessar substitui os resultados daquele relatório."""
    t0 = time.monotonic()
    ibge = rel.municipio_ibge
    linhas = json.loads(rel.linhas)
    colunas = json.loads(rel.colunas)
    situacao = "preliminar" if rel.dado_preliminar else "consolidado"
    log = SincronizacaoLog(municipio_ibge=ibge, fonte="SIAPS", competencia=rel.competencia, metodo="arquivo",
                           usuario=usuario or rel.importado_por, registros_lidos=len(linhas),
                           payload_resumo={"relatorio_id": rel.id, "componente": rel.componente,
                                           "indicador": rel.indicador, "tipo_equipe": rel.tipo_equipe,
                                           "arquivo": rel.arquivo_nome})
    ins = atu = rej = 0
    avisos: list[str] = []

    if rel.componente == "cvat":
        atuais = {r.equipe_ine: r for r in (await db.execute(select(ResultadoCvatMensal).where(
            ResultadoCvatMensal.municipio_ibge == ibge, ResultadoCvatMensal.competencia == rel.competencia))).scalars()}
        nomes = dict(zip(CVAT_CHAVES, colunas))
        for l in linhas:
            reg = atuais.get(l["ine"])
            if reg is None:
                reg = ResultadoCvatMensal(municipio_ibge=ibge, competencia=rel.competencia, equipe_ine=l["ine"])
                db.add(reg)
                ins += 1
            else:
                atu += 1
            reg.equipe_nome, reg.equipe_tipo, reg.cnes, reg.ubs = l["equipe"], l["sigla"], l["cnes"], l["ubs"]
            for k in CVAT_CHAVES[1:]:
                setattr(reg, f"var_{k}", _num(l.get(k)))
                setattr(reg, f"var_{k}_nome", nomes.get(k))
            reg.populacao_parametro = l.get("parametro")
            reg.pontuacao, reg.classificacao = _num(l.get("pontuacao")), status_cvat(l.get("pontuacao"))
            reg.situacao, reg.fonte, reg.versao_metodologia = situacao, FONTE_RESULTADO, VERSAO
            reg.data_extracao, reg.payload_original = rel.importado_em or datetime.utcnow(), l
    else:
        codigo = codigo_indicador(rel.indicador)
        if not codigo:
            rej = len(linhas)
            avisos.append(f"Indicador sem código no catálogo oficial: {rel.indicador!r}")
        else:
            ines = [l["ine"] for l in linhas]
            atuais = {r.equipe_ine: r for r in (await db.execute(select(ResultadoMensalSiaps).where(
                ResultadoMensalSiaps.municipio_ibge == ibge, ResultadoMensalSiaps.competencia == rel.competencia,
                ResultadoMensalSiaps.indicador_codigo == codigo))).scalars()}
            faixa = FAIXAS_CONFIRMADAS.get(codigo)
            for l in linhas:
                valores = [l.get("valores", {}).get(c) for c in colunas[:-1]]
                num, den = (_num(valores[0]), _num(valores[1])) if len(valores) == 2 else (None, None)
                if num is not None and den is not None and num > den:
                    avisos.append(f"{l['equipe']} ({codigo}): numerador {num:g} maior que denominador {den:g}")
                reg = atuais.get(l["ine"])
                if reg is None:
                    reg = ResultadoMensalSiaps(municipio_ibge=ibge, competencia=rel.competencia,
                                               equipe_ine=l["ine"], indicador_codigo=codigo)
                    db.add(reg)
                    ins += 1
                else:
                    atu += 1
                resultado = _num(l.get("pontuacao"))
                reg.equipe_nome, reg.equipe_tipo, reg.cnes = l["equipe"], l["sigla"], l["cnes"]
                reg.indicador_nome = INDICADORES_QUALIDADE[codigo]
                reg.numerador, reg.denominador, reg.resultado_pct, reg.pontuacao = num, den, resultado, resultado
                reg.meta = faixa["meta_referencia"] if faixa else None
                reg.classificacao = classificar(codigo, resultado)
                reg.situacao, reg.fonte, reg.versao_metodologia = situacao, FONTE_RESULTADO, VERSAO
                reg.data_extracao = rel.importado_em or datetime.utcnow()
                reg.payload_original = {"linha": l, "colunas": colunas, "indicador_fonte": rel.indicador,
                                        "tipo_equipe_filtro": rel.tipo_equipe, "gerado_em": rel.gerado_em}
            # equipe que saiu do relatório oficial não deve continuar com resultado antigo
            sairam = [ine for ine in atuais if ine not in ines]
            if sairam:
                await db.execute(delete(ResultadoMensalSiaps).where(
                    ResultadoMensalSiaps.municipio_ibge == ibge, ResultadoMensalSiaps.competencia == rel.competencia,
                    ResultadoMensalSiaps.indicador_codigo == codigo, ResultadoMensalSiaps.equipe_ine.in_(sairam)))

    log.registros_inseridos, log.registros_atualizados, log.registros_rejeitados = ins, atu, rej
    log.erros = rej
    log.sucesso = rej == 0
    log.observacao = "; ".join(avisos) or None
    log.concluido_em = datetime.utcnow()
    log.duracao_s = round(time.monotonic() - t0, 3)
    db.add(log)
    await db.commit()
    return log


async def reprocessar_municipio(db: AsyncSession, municipio_id: int) -> int:
    """Normaliza todos os relatórios já importados do município (idempotente)."""
    from routers.siaps_relatorios import relatorios_do_municipio
    await garantir_catalogo(db)
    rels = await relatorios_do_municipio(db, municipio_id)
    for r in rels:
        await normalizar_relatorio(db, r)
    return len(rels)
