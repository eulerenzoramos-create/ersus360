"""
Painel gerencial de Vigilância em Saúde — áreas temáticas, central de alertas e inteligência epidemiológica.

Lê só a série oficial gravada pelos coletores (fvs_serie: FVS-RCP/AM, INPE, SISAGUA). Regras:
  • número que a fonte não publica → item em "indisponivel" com o motivo (a tela mostra "Dados não
    disponíveis"), nunca zero;
  • toda conta feita aqui leva a fórmula ("calculado_ersus360");
  • associação temporal (fumaça × respiratório, água × diarreia) é descrita como coincidência no tempo,
    nunca como causa;
  • alerta calculado é sinal para avaliação técnica, não declaração de surto.
"""
from __future__ import annotations

import hashlib
from collections import defaultdict
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.vigilancia_fvs import FvsSerie
from services import fvs_analise as an
from services import fvs_catalogo as cat
from services.fvs_coleta import IBGE_AM, semana_epidemiologica

# ── Critérios documentados (aparecem na tela e nos relatórios) ────────────────

CRITERIOS_PRIORIDADE = {
    "critico": "Notificação de agravo de notificação imediata (até 24 h) no ano — "
               + cat.NOTIFICACAO_IMEDIATA_NORMA + ". Exige verificar se a investigação foi aberta e encerrada.",
    "alto": "Aviso oficial do CIEVS/FVS (AESOP) ativo; aumento ≥ 100% no acumulado do ano com pelo menos "
            f"{an.CRITERIOS['minimo_casos']} casos; E. coli presente em amostra de água da vigilância nos últimos 3 meses.",
    "moderado": f"Aumento ≥ {an.CRITERIOS['aumento_pct']:.0f}% no acumulado do ano (mínimo de {an.CRITERIOS['minimo_casos']} casos), "
                f"crescimento ≥ {an.CRITERIOS['aumento_recente_pct']:.0f}% nas últimas {an.CRITERIOS['janela_semanas']} semanas, "
                "meta do PQA-VS não atingida, aumento de focos de calor.",
    "informativo": "Situação sem urgência: disponibilidade de dados, falha ou atraso de integração, lacunas de monitoramento.",
}
SEMAFORO_PQA = ("Verde: meta atingida (alcance publicado pela FVS). Amarelo: meta não atingida, mas resultado ≥ 90% "
                "da meta. Vermelho: resultado < 90% da meta. Cinza: sem resultado ou 'ausência de casos' no período.")
MINIMO_FOCOS = 10


def _pct(a, b):
    return an._pct(a, b)


async def _estados(db: AsyncSession, *fontes: str) -> dict:
    return {f: await an._estado(db, f) for f in fontes}


async def _semanal_total(db: AsyncSession, fonte: str, ibge6: str, anos: list[int], indicador: str | None = None,
                         prefixo: str | None = None) -> dict[int, dict[int, float]]:
    """{ano: {se: soma}} — soma de todos os indicadores (ou do prefixo) da fonte."""
    q = select(FvsSerie.ano, FvsSerie.periodo, func.sum(FvsSerie.valor)).where(
        FvsSerie.fonte == fonte, FvsSerie.ibge6 == ibge6, FvsSerie.periodo_tipo == "se",
        FvsSerie.recorte == "total", FvsSerie.ano.in_(anos))
    if indicador:
        q = q.where(FvsSerie.indicador == indicador)
    if prefixo:
        q = q.where(FvsSerie.indicador.like(f"{prefixo}%"))
    out: dict[int, dict[int, float]] = defaultdict(dict)
    for a, se, v in (await db.execute(q.group_by(FvsSerie.ano, FvsSerie.periodo))).all():
        out[a][se] = v or 0
    return out


async def _anual(db: AsyncSession, fonte: str, indicador: str, ibge6: str, anos: list[int]) -> dict[int, float]:
    rows = await an.serie(db, fonte, indicador, [ibge6], min(anos), max(anos), "ano")
    return {r["ano"]: r["valor"] for r in rows}


def _ate(sem: dict[int, float], se: int) -> float:
    return sum(v for s, v in sem.items() if s <= se)


def _serie_se(dados: dict[int, dict[int, float]], anos: list[int], ate: int | None) -> list[dict]:
    """Linhas {se, <ano>: valor} para gráfico; o ano corrente para na última SE completa."""
    atual = max(anos)
    out = []
    for se in range(1, 54):
        lin = {"se": se}
        for a in anos:
            if a == atual and ate and se > ate:
                lin[str(a)] = None
            else:
                lin[str(a)] = dados[a].get(se, 0) if dados.get(a) else None
        out.append(lin)
    return out


# ── Visão geral ───────────────────────────────────────────────────────────────

async def visao_geral(db: AsyncSession, ibge6: str, ano: int) -> dict:
    p = await an.painel_executivo(db, ibge6, ano)
    se = await an.ultima_se(db, "sinan", ano)
    anos = [ano - 2, ano - 1, ano]
    sem = await _semanal_total(db, "sinan", ibge6, anos)
    comparativo = [{"ano": a, "acumulado": _ate(sem.get(a, {}), se) if se else None} for a in anos]
    crescimento = sorted([a for a in p["agravos"] if a["comparacao"] and a["comparacao"]["variacao_pct"] is not None
                          and a["comparacao"]["acumulado"] >= an.CRITERIOS["minimo_casos"]],
                         key=lambda a: -a["comparacao"]["variacao_pct"])[:5]
    zona = await an.serie(db, "sinan", None, [ibge6], ano, ano, "ano", "zona")
    por_zona: dict[str, float] = defaultdict(float)
    for r in zona:
        por_zona[r["recorte_valor"]] += r["valor"] or 0
    return {
        "municipio": p["municipio"], "ano": ano, "ate_se": se, "fontes": p["fontes"],
        "populacao_referencia": p["populacao_referencia"], "cartoes": p["cartoes"],
        "agravos_monitorados": sum(1 for a in p["agravos"] if a["casos_ano"]),
        "maior_crescimento": [{"agravo": a["agravo"], "variacao_pct": a["comparacao"]["variacao_pct"],
                               "acumulado": a["comparacao"]["acumulado"],
                               "anterior": a["comparacao"]["mesmo_periodo_ano_anterior"]} for a in crescimento],
        "evolucao_semanal": _serie_se(sem, anos, se),
        "top_agravos": [{"agravo": a["agravo"], "casos": a["casos_ano"]} for a in p["agravos"][:10] if a["casos_ano"]],
        "comparativo_anos": comparativo,
        "comparativo_formula": f"soma das notificações (todas as doenças/agravos) das SE 1–{se} de cada ano" if se else None,
        "territorio": [{"rotulo": k, "valor": v} for k, v in sorted(por_zona.items(), key=lambda x: -x[1])],
        "territorio_nota": "Zona de residência informada na notificação (SINAN, base FVS). A base pública não traz "
                           "bairro, distrito, localidade nem equipe de saúde — o mapa por território depende do SINAN "
                           "municipal ou do e-SUS APS do próprio município.",
        "malaria": p["malaria"], "aesop": p["aesop"], "pqa_vs": p["pqa_vs"],
        "indisponivel": p["indisponivel"] + [
            {"item": "Internações por causas prioritárias",
             "motivo": "SIH/SUS por município de residência não está integrado a este painel (publicação mensal, "
                       "defasagem de 2–3 meses). Previsto para a fase 2 via arquivos públicos do DATASUS."},
        ],
    }


# ── Vigilância respiratória e qualidade do ar ─────────────────────────────────

async def respiratoria(db: AsyncSession, ibge6: str, ano: int) -> dict:
    anos = [ano - 1, ano]
    aesop = {ind: await _semanal_total(db, "aesop", ibge6, anos, ind)
             for ind in ("srag_casos", "sg_casos_agregados", "sindrome_gripal_aps", "atendimentos_aps")}
    focos = await _semanal_total(db, "inpe_focos", ibge6, anos, "focos_calor")
    se_aesop = max(aesop["sindrome_gripal_aps"].get(ano, {}) or aesop["srag_casos"].get(ano, {}) or {0: 0})
    se_focos = max(focos.get(ano, {}) or {0: 0})
    ate = max(se_aesop, se_focos) or None
    conjunto = []
    for se in range(1, (ate or 53) + 1):
        conjunto.append({"se": se,
                         "focos_calor": focos.get(ano, {}).get(se, 0) if focos.get(ano) else None,
                         "srag": aesop["srag_casos"].get(ano, {}).get(se, 0) if aesop["srag_casos"].get(ano) else None,
                         "sg_aps": aesop["sindrome_gripal_aps"].get(ano, {}).get(se, 0) if aesop["sindrome_gripal_aps"].get(ano) else None,
                         "atend_aps": aesop["atendimentos_aps"].get(ano, {}).get(se, 0) if aesop["atendimentos_aps"].get(ano) else None})
    virus = await an.serie(db, "aesop", "gal_virus_detectados", [ibge6], ano, ano, "se", "virus")
    por_virus: dict[str, float] = defaultdict(float)
    for r in virus:
        por_virus[r["recorte_valor"]] += r["valor"] or 0
    return {
        "municipio": ibge6, "ano": ano, "fontes": await _estados(db, "aesop", "inpe_focos"),
        "aesop_ultima": await an._aesop_ultima(db, ibge6),
        "totais": {k: {"ano": sum(v.get(ano, {}).values()) if v.get(ano) else None,
                       "ano_anterior": sum(v.get(ano - 1, {}).values()) if v.get(ano - 1) else None}
                   for k, v in {**aesop, "focos_calor": focos}.items()},
        "serie_conjunta": conjunto,
        "virus": [{"rotulo": k, "valor": v} for k, v in sorted(por_virus.items(), key=lambda x: -x[1])],
        "exposicao": _comparar_exposicao(conjunto),
        "agravos": await _agravos_area(db, ibge6, ano, "respiratorias"),
        "nota_causalidade": "As séries são mostradas juntas para leitura temporal. Coincidência no tempo entre fumaça e "
                            "atendimentos respiratórios NÃO comprova causa: há sazonalidade de vírus respiratórios, "
                            "mudança de procura e de registro, e outros fatores.",
        "indisponivel": [
            {"item": "Concentração de PM2,5 e índice de qualidade do ar",
             "motivo": "Não há estação de monitoramento oficial no município. O INPE (SISAM) e o Copernicus/CAMS "
                       "publicam ESTIMATIVAS de modelo; a inclusão depende de decisão da Secretaria sobre usar "
                       "estimativa de modelo (rotulada como tal)."},
            {"item": "Internações e óbitos por doenças respiratórias",
             "motivo": "SIH/SUS e SIM ainda não integrados a este painel (fase 2, arquivos públicos do DATASUS)."},
            {"item": "Atendimentos por asma/bronquite, menores de 5 anos e idosos",
             "motivo": "Dependem do e-SUS APS do próprio município (CID/CIAP por faixa etária); o painel AESOP só "
                       "publica o total de síndrome gripal na APS."},
            {"item": "Alertas de fumaça e períodos de estiagem (INMET/CEMADEN)",
             "motivo": "A API de dados do INMET exige credencial institucional; CEMADEN não publica série municipal "
                       "aberta verificada. Dias sem chuva do INPE só existem nos pontos de foco (não representam o município)."},
        ],
    }


def _comparar_exposicao(conj: list[dict]) -> dict | None:
    """Semanas com mais × menos focos (quartis do próprio ano) e média semanal de SG na APS em cada grupo."""
    pares = [(c["focos_calor"], c["sg_aps"]) for c in conj if c["focos_calor"] is not None and c["sg_aps"] is not None]
    if len(pares) < 12:
        return None
    ordenados = sorted(f for f, _ in pares)
    q1, q3 = ordenados[len(ordenados) // 4], ordenados[(3 * len(ordenados)) // 4]
    if q3 <= q1:
        return None
    alta = [s for f, s in pares if f >= q3]
    baixa = [s for f, s in pares if f <= q1]
    return {"limite_alta": q3, "limite_baixa": q1, "semanas_alta": len(alta), "semanas_baixa": len(baixa),
            "media_sg_alta": round(sum(alta) / len(alta), 1), "media_sg_baixa": round(sum(baixa) / len(baixa), 1),
            "origem": "calculado_ersus360",
            "formula": "semanas do ano com focos ≥ 3º quartil × semanas com focos ≤ 1º quartil; média semanal de "
                       "síndrome gripal na APS (AESOP) em cada grupo. Descritivo — não ajusta sazonalidade."}


# ── Doenças diarreicas e qualidade da água ────────────────────────────────────

async def diarreicas(db: AsyncSession, ibge6: str, ano: int) -> dict:
    meses = await an.serie(db, "sisagua", None, [ibge6], ano - 2, ano, "mes")
    por: dict[tuple, dict] = defaultdict(dict)
    for r in meses:
        por[(r["ano"], r["periodo"])][r["indicador"]] = r["valor"]
    agua = [{"ano": a, "mes": m, **v} for (a, m), v in sorted(por.items())]
    anual = await an.serie(db, "sisagua", None, [ibge6], ano - 2, ano, "ano")
    tot: dict[int, dict] = defaultdict(dict)
    for r in anual:
        tot[r["ano"]][r["indicador"]] = r["valor"]
    estado = await an._estado(db, "sisagua")
    return {
        "municipio": ibge6, "ano": ano, "fontes": {"sisagua": estado, **await _estados(db, "sinan")},
        "agua_mensal": agua, "agua_anual": [{"ano": a, **v} for a, v in sorted(tot.items())],
        "agua_sem_registro": estado["situacao"] == "ok" and not anual,
        "referencias_agua": "E. coli deve estar ausente em 100 mL; turbidez ≤ 5,0 uT e cloro residual livre "
                            "≥ 0,2 mg/L no sistema de distribuição (Portaria GM/MS nº 888/2021).",
        "agravos": await _agravos_area(db, ibge6, ano, "diarreicas"),
        "nota_causalidade": "Resultados de água e casos de doença são mostrados lado a lado para leitura temporal; "
                            "não se presume causa.",
        "indisponivel": [
            {"item": "Casos de diarreia por semana epidemiológica (MDDA), por faixa etária e surtos",
             "motivo": "O Sivep-DDA (Monitorização das Doenças Diarreicas Agudas) não tem API nem arquivo público por "
                       "município. Fonte possível: planilhas MDDA da própria vigilância municipal ou e-SUS APS (CID A00–A09)."},
            {"item": "Internações e óbitos por doenças diarreicas",
             "motivo": "SIH/SUS e SIM ainda não integrados a este painel (fase 2)."},
            {"item": "Cheias e estiagem", "motivo": "Ver área Vigilância Ambiental (painel oficial de inundação da FVS)."},
        ],
    }


# ── Arboviroses e doenças endêmicas ───────────────────────────────────────────

async def _agravos_area(db: AsyncSession, ibge6: str, ano: int, area: str) -> list[dict]:
    nomes = cat.AREAS_AGRAVOS[area]
    pop = (await an.populacao(db, [ibge6], ano)).get(ibge6)
    out = []
    for ag in nomes:
        if ag == "Malária":
            continue
        ind = f"casos:{ag}"
        anual = await _anual(db, "sinan", ind, ibge6, [ano - 2, ano - 1, ano])
        if not anual:
            continue
        comp = await an.comparar_periodo(db, "sinan", ind, ibge6, ano)
        sem = await _semanal_total(db, "sinan", ibge6, [ano - 1, ano], ind)
        out.append({"agravo": ag, "cid10": cat.CID10.get(ag), "casos_ano": anual.get(ano),
                    "casos_ano_anterior": anual.get(ano - 1), "casos_2_anos_antes": anual.get(ano - 2),
                    "incidencia_100mil": round(anual[ano] / pop[1] * 100000, 1) if anual.get(ano) and pop else None,
                    "comparacao": comp, "tendencia": _tendencia(comp),
                    "semanal": _serie_se(sem, [ano - 1, ano], comp["ate_se"] if comp else None)})
    return out


def _tendencia(comp: dict | None) -> str:
    """Rótulo descritivo — só com números suficientes."""
    if not comp:
        return "sem série"
    v, base = comp.get("variacao_recente_pct"), (comp.get("ultimas_semanas") or 0) + (comp.get("semanas_anteriores") or 0)
    if v is None or base < an.CRITERIOS["minimo_casos"]:
        return "números pequenos"
    return "crescimento" if v >= 25 else "redução" if v <= -25 else "estável"


async def arboviroses(db: AsyncSession, ibge6: str, ano: int) -> dict:
    p = await an.painel_executivo(db, ibge6, ano)
    mal_sem = await _semanal_total(db, "malaria", ibge6, [ano - 1, ano], "positivos")
    comp_mal = (p.get("malaria") or {}).get("comparacao")
    parasita = await an.serie(db, "malaria", "positivos", [ibge6], ano - 4, ano, "ano", "parasita")
    return {
        "municipio": p["municipio"], "ano": ano, "fontes": await _estados(db, "sinan", "malaria"),
        "populacao_referencia": p["populacao_referencia"],
        "agravos": await _agravos_area(db, ibge6, ano, "arboviroses"),
        "malaria": {**(p.get("malaria") or {}), "tendencia": _tendencia(comp_mal),
                    "semanal": _serie_se(mal_sem, [ano - 1, ano], comp_mal["ate_se"] if comp_mal else None),
                    "parasita": parasita, "anual": await an.serie(db, "malaria", None, [ibge6], ano - 9, ano, "ano")},
        "indisponivel": [
            {"item": "Casos confirmados × suspeitos (dengue, chikungunya, zika)",
             "motivo": "A base da FVS conta notificações sem classificação final. A API de Dados Abertos do MS publica "
                       "microdados com classificação, com defasagem; integração prevista para a fase 2."},
            {"item": "Malária autóctone × importada e por localidade",
             "motivo": "O painel público da FVS conta por município PROVÁVEL DE INFECÇÃO (já exclui o que foi "
                       "importado de outro município) e não traz localidade. Detalhe por localidade: SIVEP-Malária municipal."},
            {"item": "Distribuição territorial dentro do município", "motivo": "Sem bairro/localidade na base pública."},
        ],
    }


# ── Notificações compulsórias ─────────────────────────────────────────────────

async def notificacoes(db: AsyncSession, ibge6: str, ano: int) -> dict:
    p = await an.painel_executivo(db, ibge6, ano)
    est = p["fontes"]["sinan"]
    linhas = []
    for a in p["agravos"]:
        c = a["comparacao"] or {}
        relevante = bool(c and c.get("variacao_pct") is not None and c["variacao_pct"] >= an.CRITERIOS["aumento_pct"]
                         and c["acumulado"] >= an.CRITERIOS["minimo_casos"])
        linhas.append({"agravo": a["agravo"], "cid10": cat.CID10.get(a["agravo"]),
                       "imediata": a["agravo"] in cat.NOTIFICACAO_IMEDIATA,
                       "notificacoes": a["casos_ano"], "ano_anterior": a["casos_ano_anterior"],
                       "acumulado_se": c.get("acumulado"), "mesmo_periodo": c.get("mesmo_periodo_ano_anterior"),
                       "ate_se": c.get("ate_se"), "variacao_pct": c.get("variacao_pct"),
                       "incidencia_100mil": a["incidencia_100mil"], "tendencia": _tendencia(a["comparacao"]),
                       "aumento_relevante": relevante, "confirmados": None})
    return {"municipio": p["municipio"], "ano": ano, "fonte": est, "linhas": linhas,
            "criterio_relevancia": f"Aumento ≥ {an.CRITERIOS['aumento_pct']:.0f}% nas mesmas semanas do ano anterior com pelo "
                                   f"menos {an.CRITERIOS['minimo_casos']} notificações. Abaixo disso a variação percentual "
                                   "é instável e não é destacada.",
            "nota_confirmados": "Casos confirmados: dado não disponível na base pública da FVS (só notificações)."}


# ── Vigilância ambiental ──────────────────────────────────────────────────────

async def ambiental(db: AsyncSession, ibge6: str, ano: int) -> dict:
    anos = [ano - 4, ano - 3, ano - 2, ano - 1, ano]
    mensal = await an.serie(db, "inpe_focos", "focos_calor", [ibge6], min(anos), ano, "mes")
    por: dict[int, dict[int, float]] = defaultdict(dict)
    for r in mensal:
        por[r["ano"]][r["periodo"]] = r["valor"]
    meses = [{"mes": m, **{str(a): por.get(a, {}).get(m, 0) if por.get(a) else None for a in anos}} for m in range(1, 13)]
    anual = await _anual(db, "inpe_focos", "focos_calor", ibge6, anos)
    sem = await _semanal_total(db, "inpe_focos", ibge6, [ano - 1, ano], "focos_calor")
    se = max(sem.get(ano, {}) or {0: 0}) or None
    acum = _ate(sem.get(ano, {}), se) if se else None
    acum_ant = _ate(sem.get(ano - 1, {}), se) if se else None
    return {
        "municipio": ibge6, "ano": ano, "fontes": await _estados(db, "inpe_focos"),
        "focos_mensal": meses, "focos_anual": [{"ano": a, "focos": anual.get(a)} for a in anos],
        "focos_acumulado": {"ate_se": se, "ano": acum, "ano_anterior": acum_ant, "variacao_pct": _pct(acum, acum_ant),
                            "origem": "calculado_ersus360",
                            "formula": f"focos do satélite de referência nas SE 1–{se} de {ano} × mesmo período de {ano - 1}" if se else None},
        "mes_pico": max(((m["mes"], m.get(str(ano)) or 0) for m in meses), key=lambda x: x[1])[0] if por.get(ano) else None,
        "nota_satelite": "Focos do satélite de referência do INPE (AQUA, tarde): permite comparar anos. Foco de calor "
                         "indica fogo ativo, não área queimada nem concentração de fumaça.",
        "indisponivel": [
            {"item": "Precipitação e estiagem (INMET)", "motivo": "API de dados do INMET exige token institucional — "
                                                                 "solicitar ao INMET em nome da Secretaria."},
            {"item": "Cheias, inundações e situações de emergência reconhecidas (Defesa Civil/S2iD, CEMADEN)",
             "motivo": "Sem série municipal aberta verificada. Use o painel oficial 'Informe Inundação AM' da FVS abaixo."},
            {"item": "Qualidade do ar (PM2,5)", "motivo": "Ver área Respiratória — depende de decisão sobre estimativa de modelo."},
        ],
    }


# ── PQA-VS com semáforo ───────────────────────────────────────────────────────

def _meta_num(meta: str | None) -> float | None:
    import re
    m = re.search(r"(\d+(?:[.,]\d+)?)", meta or "")
    return float(m.group(1).replace(",", ".")) if m else None


def semaforo_pqa(item: dict) -> dict:
    meta = _meta_num(item.get("meta"))
    res = item.get("resultado")
    cumprimento = round(res / meta * 100, 1) if res is not None and meta else None
    if item.get("observacao") == "Ausência de casos" or item.get("alcance") not in {"SIM", "NÃO"}:
        cor = "cinza"
    elif item["alcance"] == "SIM":
        cor = "verde"
    elif cumprimento is not None and cumprimento >= 90:
        cor = "amarelo"
    else:
        cor = "vermelho"
    return {**item, "meta_numero": meta, "cumprimento_pct": cumprimento, "semaforo": cor}


async def pqa(db: AsyncSession, ibge6: str) -> dict:
    u = await an.pqa_resumo(db, ibge6)
    if u:
        u = {**u, "itens": [semaforo_pqa(i) for i in u["itens"]]}
    return {"ultimo": u, "historico": await an.pqa_historico(db, ibge6), "criterio_semaforo": SEMAFORO_PQA,
            "nota_metas": "Metas e alcance lidos da publicação da FVS (painel PQA-VS), não fixados no sistema. "
                          "De 2024 em diante os indicadores seguem a Portaria GM/MS nº 6.878/2025.",
            "estado": await an._estado(db, "pqa_vs")}


# ── Central de alertas ────────────────────────────────────────────────────────

def chave_alerta(ibge6: str, ano: int, fonte: str, titulo: str) -> str:
    return hashlib.sha1(f"{ibge6}|{ano}|{fonte}|{titulo}".encode()).hexdigest()[:20]


def _area_da_fonte(fonte: str, agravo: str | None) -> str:
    if fonte == "aesop":
        return "respiratoria"
    if fonte in {"inpe_focos"}:
        return "ambiental"
    if fonte == "sisagua":
        return "diarreicas"
    if fonte == "pqa_vs":
        return "pqa"
    if fonte == "malaria":
        return "arboviroses"
    for area, lista in cat.AREAS_AGRAVOS.items():
        if agravo and agravo in lista:
            return {"respiratorias": "respiratoria"}.get(area, area)
    return "notificacoes"


async def central_alertas(db: AsyncSession, ibge6: str, ano: int) -> dict:
    base = await an.alertas(db, ibge6, ano)
    out = []
    for a in base["alertas"]:
        agravo = a["titulo"].split(": ", 1)[1] if ": " in a["titulo"] and a["fonte"] == "sinan" else None
        if a["tipo"] == "integracao":
            prioridade, categoria = "informativo", "integracao"
        elif a["tipo"] == "oficial" and a["fonte"] == "aesop":
            prioridade, categoria = "alto", "epidemiologico"
        elif a["fonte"] == "pqa_vs":
            prioridade, categoria = "moderado", "desempenho"
        else:
            prioridade = "alto" if a["nivel"] == "alto" else "moderado"
            categoria = "epidemiologico"
        out.append({**a, "prioridade": prioridade, "categoria": categoria, "agravo": agravo or (
            "Malária" if a["fonte"] == "malaria" else None), "area": _area_da_fonte(a["fonte"], agravo)})

    # Crítico: agravo de notificação imediata notificado no ano
    rows = (await db.execute(select(FvsSerie.indicador, FvsSerie.valor).where(
        FvsSerie.fonte == "sinan", FvsSerie.ibge6 == ibge6, FvsSerie.ano == ano, FvsSerie.periodo_tipo == "ano",
        FvsSerie.recorte == "total"))).all()
    for ind, v in rows:
        ag = ind.split(":", 1)[1]
        if ag in cat.NOTIFICACAO_IMEDIATA and (v or 0) >= 1:
            out.append({"tipo": "calculado", "nivel": "alto", "fonte": "sinan", "prioridade": "critico",
                        "categoria": "epidemiologico", "agravo": ag, "area": _area_da_fonte("sinan", ag),
                        "titulo": f"Agravo de notificação imediata: {ag}",
                        "detalhe": f"{int(v)} notificação(ões) em {ano} na base da FVS. Verificar se a investigação foi "
                                   "aberta em até 24 h e qual a classificação final (a base pública não informa).",
                        "formula": cat.NOTIFICACAO_IMEDIATA_NORMA, "subaba": "epidemiologia"})

    # Ambiental: aumento de focos de calor
    amb = await ambiental(db, ibge6, ano)
    fa = amb["focos_acumulado"]
    if fa["variacao_pct"] is not None and fa["variacao_pct"] >= an.CRITERIOS["aumento_pct"] and (fa["ano"] or 0) >= MINIMO_FOCOS:
        out.append({"tipo": "calculado", "nivel": "medio", "fonte": "inpe_focos", "prioridade": "moderado",
                    "categoria": "ambiental", "agravo": None, "area": "ambiental",
                    "titulo": "Aumento de focos de calor",
                    "detalhe": f"{int(fa['ano'])} focos até a SE {fa['ate_se']} contra {int(fa['ano_anterior'] or 0)} no "
                               f"mesmo período de {ano - 1} (+{an._br(fa['variacao_pct'])}%). Acompanhar atendimentos respiratórios.",
                    "formula": fa["formula"], "subaba": "painel"})

    # Água: E. coli presente nos últimos 3 meses / município sem amostras de vigilância
    hoje = date.today()
    recentes = [(hoje.year, hoje.month - i) if hoje.month - i > 0 else (hoje.year - 1, 12 + hoje.month - i) for i in range(0, 4)]
    ecoli = await an.serie(db, "sisagua", "presenca:ecoli", [ibge6], hoje.year - 1, hoje.year, "mes")
    pos = [r for r in ecoli if (r["ano"], r["periodo"]) in recentes and (r["valor"] or 0) > 0]
    if pos:
        n = int(sum(r["valor"] for r in pos))
        out.append({"tipo": "oficial", "nivel": "alto", "fonte": "sisagua", "prioridade": "alto",
                    "categoria": "ambiental", "agravo": None, "area": "diarreicas",
                    "titulo": "Escherichia coli em amostra de água (vigilância)",
                    "detalhe": f"{n} amostra(s) com E. coli presente registradas no SISAGUA nos últimos 3 meses. Padrão: "
                               "ausência em 100 mL (Portaria GM/MS nº 888/2021).", "subaba": "vigiagua"})
    sis = await an._estado(db, "sisagua")
    if sis["situacao"] == "ok" and not await an.serie(db, "sisagua", "amostras:ecoli", [ibge6], ano, ano, "ano"):
        out.append({"tipo": "integracao", "nivel": "baixo", "fonte": "sisagua", "prioridade": "informativo",
                    "categoria": "desempenho", "agravo": None, "area": "diarreicas",
                    "titulo": "Sem amostras de vigilância da água no SISAGUA",
                    "detalhe": f"Nenhuma análise de E. coli da vigilância municipal registrada no SISAGUA em {ano}. "
                               "Verificar coleta e digitação do Vigiagua.", "subaba": "vigiagua"})

    ordem = {"critico": 0, "alto": 1, "moderado": 2, "informativo": 3}
    for a in out:
        a["chave"] = chave_alerta(ibge6, ano, a["fonte"], a["titulo"])
    out.sort(key=lambda x: (ordem[x["prioridade"]], x["categoria"] != "epidemiologico", x["titulo"]))
    resumo = {p: sum(1 for a in out if a["prioridade"] == p) for p in ordem}
    return {"municipio": ibge6, "ano": ano, "alertas": out, "resumo": resumo,
            "por_categoria": {c: sum(1 for a in out if a["categoria"] == c)
                              for c in ("epidemiologico", "ambiental", "desempenho", "integracao")},
            "criterios": CRITERIOS_PRIORIDADE, "legenda": base["legenda"]}


# ── Inteligência epidemiológica (análise automática, sem IA generativa) ───────

async def inteligencia(db: AsyncSession, ibge6: str, ano: int) -> dict:
    central = await central_alertas(db, ibge6, ano)
    resp = await respiratoria(db, ibge6, ano)
    fatos, hipoteses, investigar, limitacoes = [], [], [], []
    for a in central["alertas"]:
        if a["categoria"] in {"epidemiologico", "ambiental"}:
            fatos.append({"texto": f"{a['titulo']} — {a['detalhe']}", "fonte": a["fonte"], "prioridade": a["prioridade"]})
        if a["prioridade"] in {"critico", "alto"} and a["categoria"] == "epidemiologico":
            investigar.append(a["titulo"])
    # Sazonalidade simples: SE atual × mesma SE nos 4 anos anteriores (malária e SINAN total)
    se = await an.ultima_se(db, "sinan", ano)
    if se:
        hist = await _semanal_total(db, "sinan", ibge6, list(range(ano - 4, ano + 1)))
        janela = range(max(1, se - 3), se + 1)
        atual = sum(hist.get(ano, {}).get(s, 0) for s in janela)
        antes = [sum(hist.get(a, {}).get(s, 0) for s in janela) for a in range(ano - 4, ano) if hist.get(a)]
        if len(antes) >= 2:
            media = sum(antes) / len(antes)
            if media and atual > 1.5 * media and atual >= an.CRITERIOS["minimo_casos"]:
                hipoteses.append({"texto": f"Notificações das SE {janela.start}–{se}: {int(atual)}, acima da média das mesmas "
                                           f"semanas nos {len(antes)} anos anteriores ({an._br(media)}). Pode ser aumento real, "
                                           "mudança de registro ou de busca ativa — requer avaliação técnica.",
                                  "formula": "soma das 4 últimas SE completas × média das mesmas SE nos anos anteriores"})
    exp = resp.get("exposicao")
    if exp and exp["media_sg_alta"] > exp["media_sg_baixa"] * 1.2:
        hipoteses.append({"texto": f"Coincidência temporal: nas {exp['semanas_alta']} semanas com mais focos de calor a média de "
                                   f"síndrome gripal na APS foi {an._br(exp['media_sg_alta'])}/semana, contra "
                                   f"{an._br(exp['media_sg_baixa'])} nas {exp['semanas_baixa']} semanas com menos focos. "
                                   "Não comprova causa (sazonalidade de vírus respiratórios e outros fatores).",
                          "formula": exp["formula"]})
    for bloco in (resp, await diarreicas(db, ibge6, ano)):
        limitacoes += [f"{i['item']}: {i['motivo']}" for i in bloco["indisponivel"]]
    limitacoes.append("Contagens pequenas variam muito em percentual: alertas exigem mínimo de "
                      f"{an.CRITERIOS['minimo_casos']} casos.")
    limitacoes.append("Dados do ano corrente são parciais e revisados a cada publicação das fontes.")
    return {"municipio": ibge6, "ano": ano, "fatos": fatos, "hipoteses": hipoteses,
            "investigar": investigar, "limitacoes": list(dict.fromkeys(limitacoes)),
            "aviso": "Análise automática por regras documentadas. Não declara surto, não faz diagnóstico nem "
                     "recomendação clínica: orienta a avaliação da equipe técnica."}
