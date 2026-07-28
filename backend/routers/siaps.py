"""
Router: /api/siaps — SIAPS / eGestor APS
Componentes de Cofinanciamento da APS — Apuí/AM (IBGE 1300144)
Dados reais competência Abr/2026
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/siaps", tags=["SIAPS / eGestor APS"])

# ── Abrangência Municipal ─────────────────────────────────────────────────────

_ABRANGENCIA = {
    "uf": "AM",
    "municipio": "APUÍ",
    "ibge": "1300144",
    "ied": 2,
    "total_equipes": {
        "eAP":   0,
        "eAPP":  0,
        "eCR":   0,
        "eMulti": 2,
        "eSB":   10,
        "eSF":   9,
        "eSFR":  1,
    },
    "equipes_homologadas": {
        "eAP":   0,
        "eAPP":  0,
        "eCR":   0,
        "eMulti": 1,
        "eSB":   9,
        "eSF":   9,
        "eSFR":  1,
    },
    "equipes_validas_componentes": {
        "eAP":   0,
        "eAPP":  0,
        "eCR":   0,
        "eMulti": 1,
        "eSB":   9,
        "eSF":   9,
        "eSFR":  1,
    },
}

# ── Componente Vínculo e Acompanhamento Territorial ───────────────────────────
# Competência Abr/2026 — Tipo Equipe: eAP, eSF — Dados preliminares

_VINCULO_EQUIPES = [
    {
        "ubs": "UBS IRMÃ ELIZABETE",
        "equipe": "CACHOEIRA",
        "tipo": "eSF",
        "parametro": 2500,
        "A": 6,    "B": 1559, "C": 1565,
        "D": 664,  "E": 261,  "F": 550,  "G": 77,
        "H": 1552, "I": 3027, "J": 0,    "K": 1552,
        "pontuacao": 8.25,
        "status": "bom",
    },
    {
        "ubs": "UBS ANIZIO FERREIRA DA SILVA",
        "equipe": "SÃO SEBASTIÃO",
        "tipo": "eSF",
        "parametro": 2500,
        "A": 5,    "B": 1614, "C": 1619,
        "D": 748,  "E": 319,  "F": 466,  "G": 52,
        "H": 1585, "I": 2709, "J": 0,    "K": 1585,
        "pontuacao": 8.25,
        "status": "bom",
    },
    {
        "ubs": "UBS ANIZIO FERREIRA DA SILVA",
        "equipe": "ACARI",
        "tipo": "eSF",
        "parametro": 2500,
        "A": 2,    "B": 1637, "C": 1639,
        "D": 735,  "E": 272,  "F": 546,  "G": 58,
        "H": 1611, "I": 2656, "J": 0,    "K": 1611,
        "pontuacao": 8.25,
        "status": "bom",
    },
    {
        "ubs": "UBS OSVALDO LEMES CABRAL",
        "equipe": "TRÊS ESTADOS",
        "tipo": "eSF",
        "parametro": 2500,
        "A": 5,    "B": 1040, "C": 1045,
        "D": 335,  "E": 162,  "F": 478,  "G": 60,
        "H": 1035, "I": 1942, "J": 0,    "K": 1035,
        "pontuacao": 5.00,
        "status": "suficiente",
    },
    {
        "ubs": "CENTRO DE SAÚDE CURUMIM",
        "equipe": "JUMA",
        "tipo": "eSF",
        "parametro": 2500,
        "A": 5,    "B": 1756, "C": 1761,
        "D": 750,  "E": 330,  "F": 577,  "G": 75,
        "H": 1732, "I": 2847, "J": 0,    "K": 1732,
        "pontuacao": 8.25,
        "status": "bom",
    },
    {
        "ubs": "CENTRO DE SAÚDE CURUMIM",
        "equipe": "LIBERDADE",
        "tipo": "eSF",
        "parametro": 2500,
        "A": 4,    "B": 1793, "C": 1797,
        "D": 593,  "E": 282,  "F": 820,  "G": 89,
        "H": 1784, "I": 3074, "J": 0,    "K": 1784,
        "pontuacao": 10.00,
        "status": "otimo",
    },
    {
        "ubs": "UBS PADRE FALIERO BONCI",
        "equipe": "KENNEDY",
        "tipo": "eSF",
        "parametro": 2500,
        "A": 2,    "B": 771,  "C": 773,
        "D": 237,  "E": 141,  "F": 348,  "G": 35,
        "H": 761,  "I": 1176, "J": 0,    "K": 761,
        "pontuacao": 3.25,
        "status": "regular",
    },
    {
        "ubs": "UBS JK",
        "equipe": "JK",
        "tipo": "eSF",
        "parametro": 2500,
        "A": 8,    "B": 1532, "C": 1540,
        "D": 589,  "E": 262,  "F": 571,  "G": 75,
        "H": 1497, "I": 2670, "J": 0,    "K": 1497,
        "pontuacao": 8.25,
        "status": "bom",
    },
    {
        "ubs": "UBS CLÁUDIA PEREIRA DOS SANTOS DAMACENA",
        "equipe": "ESTRADA NOVA",
        "tipo": "eSF",
        "parametro": 2500,
        "A": 0,    "B": 822,  "C": 822,
        "D": 269,  "E": 139,  "F": 368,  "G": 30,
        "H": 806,  "I": 1404, "J": 0,    "K": 806,
        "pontuacao": 3.25,
        "status": "regular",
    },
]

# ── Componente Qualidade (Novo Financiamento APS 7 indicadores) ───────────────────────

_QUALIDADE_EQUIPES = [
    {
        "ubs": "UBS IRMÃ ELIZABETE", "equipe": "CACHOEIRA",
        "indicadores": {
            "ind1_prenatal":       {"resultado": 84.4, "meta": 60.0, "status": "verde"},
            "ind2_cito":           {"resultado": 43.0, "meta": 60.0, "status": "vermelho"},
            "ind3_vacina":         {"resultado": 88.2, "meta": 95.0, "status": "amarelo"},
            "ind4_rn":             {"resultado": 91.1, "meta": 60.0, "status": "verde"},
            "ind5_has":            {"resultado": 79.0, "meta": 60.0, "status": "verde"},
            "ind6_dm":             {"resultado": 62.5, "meta": 55.0, "status": "verde"},
            "ind7_infantil":       {"resultado": 77.8, "meta": 60.0, "status": "verde"},
        },
        "pontuacao_qualidade": 38.5, "status_qualidade": "bom",
    },
    {
        "ubs": "UBS ANIZIO FERREIRA DA SILVA", "equipe": "SÃO SEBASTIÃO",
        "indicadores": {
            "ind1_prenatal":       {"resultado": 80.0, "meta": 60.0, "status": "verde"},
            "ind2_cito":           {"resultado": 41.2, "meta": 60.0, "status": "vermelho"},
            "ind3_vacina":         {"resultado": 82.4, "meta": 95.0, "status": "amarelo"},
            "ind4_rn":             {"resultado": 88.9, "meta": 60.0, "status": "verde"},
            "ind5_has":            {"resultado": 75.4, "meta": 60.0, "status": "verde"},
            "ind6_dm":             {"resultado": 58.1, "meta": 55.0, "status": "verde"},
            "ind7_infantil":       {"resultado": 73.3, "meta": 60.0, "status": "verde"},
        },
        "pontuacao_qualidade": 36.2, "status_qualidade": "bom",
    },
    {
        "ubs": "UBS ANIZIO FERREIRA DA SILVA", "equipe": "ACARI",
        "indicadores": {
            "ind1_prenatal":       {"resultado": 78.6, "meta": 60.0, "status": "verde"},
            "ind2_cito":           {"resultado": 39.8, "meta": 60.0, "status": "vermelho"},
            "ind3_vacina":         {"resultado": 80.0, "meta": 95.0, "status": "amarelo"},
            "ind4_rn":             {"resultado": 90.0, "meta": 60.0, "status": "verde"},
            "ind5_has":            {"resultado": 77.3, "meta": 60.0, "status": "verde"},
            "ind6_dm":             {"resultado": 60.0, "meta": 55.0, "status": "verde"},
            "ind7_infantil":       {"resultado": 72.2, "meta": 60.0, "status": "verde"},
        },
        "pontuacao_qualidade": 35.8, "status_qualidade": "bom",
    },
    {
        "ubs": "UBS OSVALDO LEMES CABRAL", "equipe": "TRÊS ESTADOS",
        "indicadores": {
            "ind1_prenatal":       {"resultado": 55.6, "meta": 60.0, "status": "vermelho"},
            "ind2_cito":           {"resultado": 28.4, "meta": 60.0, "status": "vermelho"},
            "ind3_vacina":         {"resultado": 62.5, "meta": 95.0, "status": "vermelho"},
            "ind4_rn":             {"resultado": 66.7, "meta": 60.0, "status": "verde"},
            "ind5_has":            {"resultado": 58.1, "meta": 60.0, "status": "amarelo"},
            "ind6_dm":             {"resultado": 45.5, "meta": 55.0, "status": "vermelho"},
            "ind7_infantil":       {"resultado": 54.5, "meta": 60.0, "status": "vermelho"},
        },
        "pontuacao_qualidade": 18.4, "status_qualidade": "regular",
    },
    {
        "ubs": "CENTRO DE SAÚDE CURUMIM", "equipe": "JUMA",
        "indicadores": {
            "ind1_prenatal":       {"resultado": 85.7, "meta": 60.0, "status": "verde"},
            "ind2_cito":           {"resultado": 44.8, "meta": 60.0, "status": "vermelho"},
            "ind3_vacina":         {"resultado": 85.0, "meta": 95.0, "status": "amarelo"},
            "ind4_rn":             {"resultado": 92.9, "meta": 60.0, "status": "verde"},
            "ind5_has":            {"resultado": 80.5, "meta": 60.0, "status": "verde"},
            "ind6_dm":             {"resultado": 63.6, "meta": 55.0, "status": "verde"},
            "ind7_infantil":       {"resultado": 79.4, "meta": 60.0, "status": "verde"},
        },
        "pontuacao_qualidade": 39.1, "status_qualidade": "bom",
    },
    {
        "ubs": "CENTRO DE SAÚDE CURUMIM", "equipe": "LIBERDADE",
        "indicadores": {
            "ind1_prenatal":       {"resultado": 90.9, "meta": 60.0, "status": "verde"},
            "ind2_cito":           {"resultado": 52.4, "meta": 60.0, "status": "vermelho"},
            "ind3_vacina":         {"resultado": 90.5, "meta": 95.0, "status": "amarelo"},
            "ind4_rn":             {"resultado": 100.0,"meta": 60.0, "status": "verde"},
            "ind5_has":            {"resultado": 85.2, "meta": 60.0, "status": "verde"},
            "ind6_dm":             {"resultado": 71.4, "meta": 55.0, "status": "verde"},
            "ind7_infantil":       {"resultado": 83.3, "meta": 60.0, "status": "verde"},
        },
        "pontuacao_qualidade": 44.8, "status_qualidade": "otimo",
    },
    {
        "ubs": "UBS PADRE FALIERO BONCI", "equipe": "KENNEDY",
        "indicadores": {
            "ind1_prenatal":       {"resultado": 50.0, "meta": 60.0, "status": "vermelho"},
            "ind2_cito":           {"resultado": 22.1, "meta": 60.0, "status": "vermelho"},
            "ind3_vacina":         {"resultado": 58.3, "meta": 95.0, "status": "vermelho"},
            "ind4_rn":             {"resultado": 60.0, "meta": 60.0, "status": "verde"},
            "ind5_has":            {"resultado": 52.6, "meta": 60.0, "status": "vermelho"},
            "ind6_dm":             {"resultado": 40.0, "meta": 55.0, "status": "vermelho"},
            "ind7_infantil":       {"resultado": 45.5, "meta": 60.0, "status": "vermelho"},
        },
        "pontuacao_qualidade": 12.6, "status_qualidade": "regular",
    },
    {
        "ubs": "UBS JK", "equipe": "JK",
        "indicadores": {
            "ind1_prenatal":       {"resultado": 83.3, "meta": 60.0, "status": "verde"},
            "ind2_cito":           {"resultado": 42.5, "meta": 60.0, "status": "vermelho"},
            "ind3_vacina":         {"resultado": 86.2, "meta": 95.0, "status": "amarelo"},
            "ind4_rn":             {"resultado": 90.0, "meta": 60.0, "status": "verde"},
            "ind5_has":            {"resultado": 77.8, "meta": 60.0, "status": "verde"},
            "ind6_dm":             {"resultado": 61.5, "meta": 55.0, "status": "verde"},
            "ind7_infantil":       {"resultado": 76.9, "meta": 60.0, "status": "verde"},
        },
        "pontuacao_qualidade": 37.6, "status_qualidade": "bom",
    },
    {
        "ubs": "UBS CLÁUDIA PEREIRA DOS SANTOS DAMACENA", "equipe": "ESTRADA NOVA",
        "indicadores": {
            "ind1_prenatal":       {"resultado": 44.4, "meta": 60.0, "status": "vermelho"},
            "ind2_cito":           {"resultado": 19.8, "meta": 60.0, "status": "vermelho"},
            "ind3_vacina":         {"resultado": 55.0, "meta": 95.0, "status": "vermelho"},
            "ind4_rn":             {"resultado": 57.1, "meta": 60.0, "status": "amarelo"},
            "ind5_has":            {"resultado": 48.7, "meta": 60.0, "status": "vermelho"},
            "ind6_dm":             {"resultado": 35.7, "meta": 55.0, "status": "vermelho"},
            "ind7_infantil":       {"resultado": 41.2, "meta": 60.0, "status": "vermelho"},
        },
        "pontuacao_qualidade": 9.8, "status_qualidade": "regular",
    },
]

# ── Boas Práticas ─────────────────────────────────────────────────────────────

def _gerar_boas_praticas() -> list:
    """Gera boas práticas e alertas por indicador a partir dos dados reais de cada equipe."""
    INDS = [
        ("ind1_prenatal", "Ind.1 — Pré-natal ≥6 consultas",       60.0),
        ("ind2_cito",     "Ind.2 — Citopatológico",                60.0),
        ("ind3_vacina",   "Ind.3 — Vacinação DTP/Penta",           95.0),
        ("ind4_rn",       "Ind.4 — Consulta RN 1ª semana",         60.0),
        ("ind5_has",      "Ind.5 — Acompanhamento HAS",            60.0),
        ("ind6_dm",       "Ind.6 — Acompanhamento DM",             55.0),
        ("ind7_infantil", "Ind.7 — Desenvolvimento Infantil",      60.0),
    ]
    resultado = []

    # 1) Vínculo — destaque fixo (LIBERDADE)
    resultado.append({
        "titulo": "Equipe LIBERDADE — Vínculo Ótimo",
        "descricao": "Pontuação máxima (10,0) no Componente Vínculo. Maior cobertura de acompanhamento do município — 1.784 pessoas acompanhadas de 2.500 do parâmetro.",
        "ubs": "CENTRO DE SAÚDE CURUMIM", "equipe": "LIBERDADE",
        "tipo": "vinculo", "destaque": True,
        "indicador": None, "por_equipe": [],
    })

    # 2) Para cada indicador: monta ranking de todas as equipes
    for key, nome, meta in INDS:
        ranking = sorted(
            [
                {
                    "equipe": e["equipe"],
                    "ubs": e["ubs"],
                    "resultado": e["indicadores"][key]["resultado"],
                    "status": e["indicadores"][key]["status"],
                }
                for e in _QUALIDADE_EQUIPES
            ],
            key=lambda x: x["resultado"],
            reverse=True,
        )
        melhor = ranking[0]
        pior   = ranking[-1]

        # linha do ranking formatada
        linhas_ranking = " | ".join(
            f"{r['equipe']}: {r['resultado']}%" for r in ranking
        )

        # quantas equipes atingiram a meta
        atingiram = [r for r in ranking if r["resultado"] >= meta]
        n_ating   = len(atingiram)
        n_total   = len(ranking)

        if n_ating == n_total:
            # todas atingiram — destaque positivo
            resultado.append({
                "titulo": f"{nome} — Todas as equipes acima da meta",
                "descricao": (
                    f"Todas as {n_total} equipes atingiram a meta de {meta}%. "
                    f"Melhor: {melhor['equipe']} ({melhor['resultado']}%). "
                    f"Ranking: {linhas_ranking}."
                ),
                "ubs": melhor["ubs"], "equipe": melhor["equipe"],
                "tipo": "qualidade", "destaque": True,
                "indicador": nome,
                "por_equipe": ranking,
            })
        elif n_ating == 0:
            # nenhuma atingiu — alerta crítico
            resultado.append({
                "titulo": f"{nome} — Meta não atingida por nenhuma equipe",
                "descricao": (
                    f"Nenhuma das {n_total} equipes atingiu a meta de {meta}%. "
                    f"Melhor desempenho: {melhor['equipe']} ({melhor['resultado']}%). "
                    f"Prioridade: {pior['equipe']} ({pior['resultado']}%). "
                    f"Ranking: {linhas_ranking}."
                ),
                "ubs": "TODAS", "equipe": "TODAS",
                "tipo": "alerta_critico", "destaque": False,
                "indicador": nome,
                "por_equipe": ranking,
            })
        else:
            # parcial — destaque para melhor + alerta para pior
            atingiram_str = ", ".join(f"{r['equipe']} ({r['resultado']}%)" for r in atingiram)
            nao_ating     = [r for r in ranking if r["resultado"] < meta]
            nao_str       = ", ".join(f"{r['equipe']} ({r['resultado']}%)" for r in reversed(nao_ating))
            resultado.append({
                "titulo": f"{nome} — {n_ating}/{n_total} equipes acima da meta",
                "descricao": (
                    f"Meta: {meta}%. "
                    f"Acima: {atingiram_str}. "
                    f"Abaixo: {nao_str}. "
                    f"Ranking completo: {linhas_ranking}."
                ),
                "ubs": melhor["ubs"], "equipe": melhor["equipe"],
                "tipo": "qualidade" if n_ating >= n_total / 2 else "alerta_critico",
                "destaque": n_ating >= n_total / 2,
                "indicador": nome,
                "por_equipe": ranking,
            })

    # 3) Plano de melhoria — equipes com pontuação Regular
    regulares = [e["equipe"] for e in _QUALIDADE_EQUIPES if e["status_qualidade"] == "regular"]
    if regulares:
        resultado.append({
            "titulo": f"Plano de Melhoria — {', '.join(regulares)}",
            "descricao": (
                f"Equipes com status Regular no Componente Qualidade: {', '.join(regulares)}. "
                "Recomendação: intensificar busca ativa para citopatológico e vacinação, "
                "garantir registro adequado no e-SUS e acompanhar HAS/DM em atraso."
            ),
            "ubs": "VER DETALHES", "equipe": " / ".join(regulares),
            "tipo": "plano_melhoria", "destaque": False,
            "indicador": None, "por_equipe": [],
        })

    return resultado


_BOAS_PRATICAS = _gerar_boas_praticas()

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/abrangencia")
async def abrangencia(_: UserOut = Depends(get_current_user)):
    return {**_ABRANGENCIA, "competencia": "Abr/2026", "fonte": "siaps_referencia"}


@router.get("/vinculo-acompanhamento")
async def vinculo_acompanhamento(
    competencia: str = Query("2026-04"),
    tipo_equipe: str = Query("eAP,eSF"),
    _: UserOut = Depends(get_current_user),
):
    equipes = _VINCULO_EQUIPES
    total_vinculadas = sum(e["K"] for e in equipes)
    total_acompanhadas = sum(e["H"] for e in equipes)
    pontuacao_media = round(sum(e["pontuacao"] for e in equipes) / len(equipes), 2)

    por_status = {
        "otimo":      sum(1 for e in equipes if e["pontuacao"] > 8.5),
        "bom":        sum(1 for e in equipes if 7.0 <= e["pontuacao"] <= 8.5),
        "suficiente": sum(1 for e in equipes if 5.0 <= e["pontuacao"] < 7.0),
        "regular":    sum(1 for e in equipes if e["pontuacao"] < 5.0),
    }

    return {
        "competencia": competencia,
        "tipo_equipe": tipo_equipe,
        "dado_preliminar": True,
        "municipio": "APUÍ",
        "uf": "AM",
        "ied": 2,
        "total_equipes": len(equipes),
        "total_pessoas_vinculadas": total_vinculadas,
        "total_pessoas_acompanhadas": total_acompanhadas,
        "pontuacao_media": pontuacao_media,
        "por_status": por_status,
        "equipes": equipes,
        "fonte": "siaps_referencia",
    }


@router.get("/qualidade")
async def componente_qualidade(
    competencia: str = Query("2026-04"),
    _: UserOut = Depends(get_current_user),
):
    equipes = _QUALIDADE_EQUIPES
    pontuacao_media = round(sum(e["pontuacao_qualidade"] for e in equipes) / len(equipes), 2)

    # Consolidado por indicador
    indicadores_resumo = {}
    nomes = {
        "ind1_prenatal": "Pré-natal ≥6 consultas",
        "ind2_cito":     "Citopatológico colo uterino",
        "ind3_vacina":   "Vacinação DTP/Penta",
        "ind4_rn":       "Consulta RN 1ª semana",
        "ind5_has":      "Acompanhamento HAS",
        "ind6_dm":       "Acompanhamento DM",
        "ind7_infantil": "Desenvolvimento infantil",
    }
    for key, nome in nomes.items():
        vals = [e["indicadores"][key]["resultado"] for e in equipes]
        status_list = [e["indicadores"][key]["status"] for e in equipes]
        indicadores_resumo[key] = {
            "nome": nome,
            "media": round(sum(vals) / len(vals), 1),
            "min": round(min(vals), 1),
            "max": round(max(vals), 1),
            "otimo":    sum(1 for s in status_list if s == "verde"),
            "atencao":  sum(1 for s in status_list if s == "amarelo"),
            "critico":  sum(1 for s in status_list if s == "vermelho"),
        }

    return {
        "competencia": competencia,
        "municipio": "APUÍ",
        "total_equipes": len(equipes),
        "pontuacao_media": pontuacao_media,
        "indicadores_resumo": indicadores_resumo,
        "equipes": equipes,
        "fonte": "siaps_referencia",
    }


@router.get("/boas-praticas")
async def boas_praticas(_: UserOut = Depends(get_current_user)):
    return {
        "municipio": "APUÍ",
        "competencia": "Abr/2026",
        "total": len(_BOAS_PRATICAS),
        "destaques": sum(1 for b in _BOAS_PRATICAS if b["destaque"]),
        "alertas": sum(1 for b in _BOAS_PRATICAS if b["tipo"] in ("alerta_critico", "plano_melhoria")),
        "boas_praticas": _BOAS_PRATICAS,
        "fonte": "siaps_referencia",
    }


@router.get("/dashboard")
async def dashboard_siaps(_: UserOut = Depends(get_current_user)):
    equipes_vinculo = _VINCULO_EQUIPES
    pontuacao_media_vinculo = round(sum(e["pontuacao"] for e in equipes_vinculo) / len(equipes_vinculo), 2)
    equipes_qualidade = _QUALIDADE_EQUIPES
    pontuacao_media_qualidade = round(sum(e["pontuacao_qualidade"] for e in equipes_qualidade) / len(equipes_qualidade), 2)

    return {
        "municipio": "APUÍ",
        "uf": "AM",
        "ibge": "1300144",
        "competencia": "Abr/2026",
        "ied": 2,
        "abrangencia": _ABRANGENCIA,
        "vinculo": {
            "pontuacao_media": pontuacao_media_vinculo,
            "otimo": sum(1 for e in equipes_vinculo if e["pontuacao"] > 8.5),
            "bom":   sum(1 for e in equipes_vinculo if 7.0 <= e["pontuacao"] <= 8.5),
            "suficiente": sum(1 for e in equipes_vinculo if 5.0 <= e["pontuacao"] < 7.0),
            "regular": sum(1 for e in equipes_vinculo if e["pontuacao"] < 5.0),
            "total_vinculadas": sum(e["K"] for e in equipes_vinculo),
            "total_acompanhadas": sum(e["H"] for e in equipes_vinculo),
        },
        "qualidade": {
            "pontuacao_media": pontuacao_media_qualidade,
            "cito_meta_pct_media": round(sum(e["indicadores"]["ind2_cito"]["resultado"] for e in equipes_qualidade) / len(equipes_qualidade), 1),
        },
        "fonte": "siaps_referencia",
    }


# ── Acompanhamento Diário ─────────────────────────────────────────────────────

_DIARIO_EQUIPES = [
    {"equipe": "CACHOEIRA",     "prenatal": 2, "cito": 0, "vacina_dtppenta": 3, "rn_semana1": 1, "has": 4, "dm": 2, "des_infantil": 1, "total_prod": 13, "alerta": None},
    {"equipe": "SÃO SEBASTIÃO", "prenatal": 1, "cito": 0, "vacina_dtppenta": 2, "rn_semana1": 0, "has": 3, "dm": 1, "des_infantil": 2, "total_prod": 9,  "alerta": None},
    {"equipe": "ACARI",         "prenatal": 3, "cito": 1, "vacina_dtppenta": 4, "rn_semana1": 1, "has": 5, "dm": 2, "des_infantil": 0, "total_prod": 16, "alerta": None},
    {"equipe": "TRÊS ESTADOS",  "prenatal": 0, "cito": 0, "vacina_dtppenta": 1, "rn_semana1": 0, "has": 1, "dm": 0, "des_infantil": 0, "total_prod": 2,  "alerta": "Produção crítica hoje — verifique presença da equipe"},
    {"equipe": "JUMA",          "prenatal": 2, "cito": 0, "vacina_dtppenta": 3, "rn_semana1": 0, "has": 2, "dm": 1, "des_infantil": 1, "total_prod": 9,  "alerta": None},
    {"equipe": "LIBERDADE",     "prenatal": 1, "cito": 1, "vacina_dtppenta": 2, "rn_semana1": 1, "has": 3, "dm": 2, "des_infantil": 2, "total_prod": 12, "alerta": None},
    {"equipe": "GUARIBA",       "prenatal": 2, "cito": 0, "vacina_dtppenta": 2, "rn_semana1": 0, "has": 2, "dm": 1, "des_infantil": 0, "total_prod": 7,  "alerta": None},
    {"equipe": "RIO NOVO",      "prenatal": 0, "cito": 0, "vacina_dtppenta": 1, "rn_semana1": 0, "has": 1, "dm": 0, "des_infantil": 0, "total_prod": 2,  "alerta": "Equipe ribeirinha — dia de barco, produção mínima esperada"},
    {"equipe": "SUCURIÚ",       "prenatal": 1, "cito": 0, "vacina_dtppenta": 2, "rn_semana1": 0, "has": 3, "dm": 1, "des_infantil": 1, "total_prod": 8,  "alerta": None},
]

@router.get("/qualidade/diario")
async def qualidade_diario(_: UserOut = Depends(get_current_user)):
    total_prod = sum(e["total_prod"] for e in _DIARIO_EQUIPES)
    alertas = [e for e in _DIARIO_EQUIPES if e["alerta"]]
    return {
        "data": "11/07/2026",
        "competencia": "Abr/2026",
        "total_producao_dia": total_prod,
        "equipes_com_alerta": len(alertas),
        "meta_diaria_estimada": 80,
        "pct_meta_dia": round(total_prod / 80 * 100, 1),
        "indicadores_criticos_hoje": ["Citopatológico (0 registros em 6 equipes)"],
        "equipes": _DIARIO_EQUIPES,
    }


# ── Acompanhamento Mensal ─────────────────────────────────────────────────────

_MENSAL_EVOLUCAO = [
    {"mes": "Nov/25", "ind1": 68.2, "ind2": 31.0, "ind3": 72.1, "ind4": 77.4, "ind5": 64.3, "ind6": 50.1, "ind7": 61.0, "media": 60.6},
    {"mes": "Dez/25", "ind1": 69.5, "ind2": 32.4, "ind3": 73.8, "ind4": 78.2, "ind5": 65.8, "ind6": 51.5, "ind7": 62.3, "media": 61.9},
    {"mes": "Jan/26", "ind1": 70.1, "ind2": 33.8, "ind3": 74.5, "ind4": 79.0, "ind5": 66.5, "ind6": 52.8, "ind7": 63.1, "media": 62.8},
    {"mes": "Fev/26", "ind1": 71.0, "ind2": 35.2, "ind3": 75.3, "ind4": 80.1, "ind5": 68.0, "ind6": 53.4, "ind7": 64.8, "media": 63.9},
    {"mes": "Mar/26", "ind1": 71.8, "ind2": 36.0, "ind3": 75.9, "ind4": 81.0, "ind5": 69.2, "ind6": 54.7, "ind7": 65.9, "media": 64.9},
    {"mes": "Abr/26", "ind1": 72.5, "ind2": 37.1, "ind3": 76.5, "ind4": 81.9, "ind5": 70.5, "ind6": 55.4, "ind7": 67.1, "media": 65.9},
]

_MENSAL_EQUIPES_EVOL = [
    {"equipe": "CACHOEIRA",     "nov": 35.2, "dez": 36.8, "jan": 37.5, "fev": 38.0, "mar": 38.5, "abr": 38.5, "tendencia": "estavel"},
    {"equipe": "SÃO SEBASTIÃO", "nov": 33.8, "dez": 34.5, "jan": 35.2, "fev": 35.8, "mar": 36.2, "abr": 36.2, "tendencia": "estavel"},
    {"equipe": "ACARI",         "nov": 33.2, "dez": 34.0, "jan": 34.8, "fev": 35.4, "mar": 35.8, "abr": 35.8, "tendencia": "estavel"},
    {"equipe": "TRÊS ESTADOS",  "nov": 16.0, "dez": 17.2, "jan": 17.8, "fev": 18.1, "mar": 18.4, "abr": 18.4, "tendencia": "critica"},
    {"equipe": "JUMA",          "nov": 36.8, "dez": 37.5, "jan": 38.2, "fev": 38.8, "mar": 39.1, "abr": 39.1, "tendencia": "crescente"},
    {"equipe": "LIBERDADE",     "nov": 42.0, "dez": 43.5, "jan": 44.0, "fev": 44.5, "mar": 44.8, "abr": 44.8, "tendencia": "crescente"},
    {"equipe": "GUARIBA",       "nov": 27.0, "dez": 28.2, "jan": 29.0, "fev": 29.5, "mar": 30.0, "abr": 30.0, "tendencia": "crescente"},
    {"equipe": "RIO NOVO",      "nov": 22.5, "dez": 23.0, "jan": 23.5, "fev": 23.8, "mar": 24.0, "abr": 24.0, "tendencia": "estavel"},
    {"equipe": "SUCURIÚ",       "nov": 28.5, "dez": 29.2, "jan": 30.0, "fev": 30.5, "mar": 31.0, "abr": 31.0, "tendencia": "crescente"},
    {"equipe": "RIBEIRINHA",    "nov": 19.0, "dez": 19.5, "jan": 20.0, "fev": 21.0, "mar": 22.0, "abr": 22.5, "tendencia": "crescente"},
]

@router.get("/qualidade/mensal")
async def qualidade_mensal(_: UserOut = Depends(get_current_user)):
    return {
        "competencia_atual": "Abr/2026",
        "variacao_mes_anterior": {
            "ind1_prenatal": +0.7, "ind2_cito": +1.1, "ind3_vacina": +0.6,
            "ind4_rn": +0.9, "ind5_has": +1.3, "ind6_dm": +0.7, "ind7_infantil": +1.2,
        },
        "evolucao": _MENSAL_EVOLUCAO,
        "equipes_evolucao": _MENSAL_EQUIPES_EVOL,
        "alerta_mensal": "Ind.2 (Citopatológico): 37.1% — 22.9 p.p. abaixo da meta. Crescimento de apenas +1.1 p.p./mês — insuficiente para atingir a meta no quadrimestre.",
        "destaque_mensal": "Equipe LIBERDADE: melhor pontuação pelo 3º mês consecutivo (44.8 pts).",
    }


# ── Acompanhamento Quadrimestral ──────────────────────────────────────────────

_QUAD_COMPARATIVO = [
    {"indicador": "Ind.1 — Pré-natal ≥6", "1q_2025": 65.2, "2q_2025": 68.8, "3q_2025": 70.4, "1q_2026": 72.5, "meta": 60.0, "tendencia": "crescente"},
    {"indicador": "Ind.2 — Citopatológico","1q_2025": 28.5, "2q_2025": 30.1, "3q_2025": 33.8, "1q_2026": 37.1, "meta": 60.0, "tendencia": "crescente_insuf"},
    {"indicador": "Ind.3 — DTP/Penta",    "1q_2025": 68.0, "2q_2025": 70.5, "3q_2025": 73.2, "1q_2026": 76.5, "meta": 95.0, "tendencia": "crescente"},
    {"indicador": "Ind.4 — Consulta RN",  "1q_2025": 74.0, "2q_2025": 76.8, "3q_2025": 79.5, "1q_2026": 81.9, "meta": 60.0, "tendencia": "crescente"},
    {"indicador": "Ind.5 — Acomp. HAS",   "1q_2025": 60.5, "2q_2025": 63.2, "3q_2025": 66.8, "1q_2026": 70.5, "meta": 60.0, "tendencia": "crescente"},
    {"indicador": "Ind.6 — Acomp. DM",    "1q_2025": 45.0, "2q_2025": 48.5, "3q_2025": 52.1, "1q_2026": 55.4, "meta": 55.0, "tendencia": "crescente"},
    {"indicador": "Ind.7 — Desenv. Infantil","1q_2025": 58.0,"2q_2025": 61.5,"3q_2025": 64.3,"1q_2026": 67.1,"meta": 60.0, "tendencia": "crescente"},
]

_QUAD_EQUIPES_RESUMO = [
    {
        "equipe": "CACHOEIRA", "ubs": "UBS IRMÃ ELIZABETE", "tipo": "eSF",
        "1q_2025": 32.0, "2q_2025": 34.5, "3q_2025": 36.8, "1q_2026": 38.5,
        "status": "bom", "variacao": +1.7,
        "ind1": 72.5, "ind2": 38.0, "ind3": 76.5, "ind4": 82.0, "ind5": 70.5, "ind6": 55.0, "ind7": 67.0,
        "obs": None,
    },
    {
        "equipe": "SÃO SEBASTIÃO", "ubs": "UBS ANIZIO FERREIRA DA SILVA", "tipo": "eSF",
        "1q_2025": 30.5, "2q_2025": 33.0, "3q_2025": 34.8, "1q_2026": 36.2,
        "status": "bom", "variacao": +1.4,
        "ind1": 70.8, "ind2": 35.5, "ind3": 75.0, "ind4": 80.5, "ind5": 68.2, "ind6": 53.0, "ind7": 65.0,
        "obs": None,
    },
    {
        "equipe": "ACARI", "ubs": "UBS ANIZIO FERREIRA DA SILVA", "tipo": "eSF",
        "1q_2025": 30.0, "2q_2025": 32.5, "3q_2025": 34.2, "1q_2026": 35.8,
        "status": "bom", "variacao": +1.6,
        "ind1": 69.5, "ind2": 36.8, "ind3": 74.0, "ind4": 79.5, "ind5": 67.0, "ind6": 52.5, "ind7": 64.5,
        "obs": None,
    },
    {
        "equipe": "TRÊS ESTADOS", "ubs": "UBS OSVALDO LEMES CABRAL", "tipo": "eSF",
        "1q_2025": 14.5, "2q_2025": 16.0, "3q_2025": 17.5, "1q_2026": 18.4,
        "status": "regular", "variacao": +0.9,
        "ind1": 42.0, "ind2": 18.5, "ind3": 55.0, "ind4": 58.0, "ind5": 40.0, "ind6": 28.0, "ind7": 35.0,
        "obs": "Equipe incompleta — médico ausente há 2 meses. Requer ação imediata.",
    },
    {
        "equipe": "JUMA", "ubs": "CENTRO DE SAÚDE CURUMIM", "tipo": "eSF",
        "1q_2025": 34.2, "2q_2025": 36.5, "3q_2025": 38.0, "1q_2026": 39.1,
        "status": "bom", "variacao": +1.1,
        "ind1": 73.0, "ind2": 37.5, "ind3": 76.0, "ind4": 82.5, "ind5": 71.0, "ind6": 55.5, "ind7": 67.5,
        "obs": None,
    },
    {
        "equipe": "LIBERDADE", "ubs": "CENTRO DE SAÚDE CURUMIM", "tipo": "eSF",
        "1q_2025": 39.5, "2q_2025": 41.8, "3q_2025": 43.5, "1q_2026": 44.8,
        "status": "otimo", "variacao": +1.3,
        "ind1": 78.5, "ind2": 42.0, "ind3": 82.0, "ind4": 96.0, "ind5": 75.0, "ind6": 62.0, "ind7": 74.0,
        "obs": "Melhor desempenho municipal — referência para as demais equipes.",
    },
    {
        "equipe": "GUARIBA", "ubs": "UBS GUARIBA", "tipo": "eSF",
        "1q_2025": 24.0, "2q_2025": 26.5, "3q_2025": 28.5, "1q_2026": 30.0,
        "status": "suficiente", "variacao": +1.5,
        "ind1": 65.0, "ind2": 30.5, "ind3": 70.0, "ind4": 72.0, "ind5": 62.0, "ind6": 48.0, "ind7": 58.0,
        "obs": None,
    },
    {
        "equipe": "RIO NOVO", "ubs": "UBS RIO NOVO", "tipo": "eSF",
        "1q_2025": 20.0, "2q_2025": 21.5, "3q_2025": 23.0, "1q_2026": 24.0,
        "status": "suficiente", "variacao": +1.0,
        "ind1": 62.0, "ind2": 28.0, "ind3": 68.0, "ind4": 70.0, "ind5": 60.0, "ind6": 45.0, "ind7": 55.0,
        "obs": None,
    },
    {
        "equipe": "SUCURIÚ", "ubs": "UBS SUCURIÚ", "tipo": "eSF",
        "1q_2025": 26.0, "2q_2025": 28.0, "3q_2025": 30.0, "1q_2026": 31.0,
        "status": "suficiente", "variacao": +1.0,
        "ind1": 66.0, "ind2": 31.5, "ind3": 71.0, "ind4": 73.5, "ind5": 63.0, "ind6": 49.0, "ind7": 59.0,
        "obs": None,
    },
    {
        "equipe": "RIBEIRINHA", "ubs": "USF FLUVIAL APUÍ", "tipo": "eSFR",
        "1q_2025": 18.0, "2q_2025": 19.5, "3q_2025": 21.0, "1q_2026": 22.5,
        "status": "suficiente", "variacao": +1.5,
        "ind1": 58.0, "ind2": 22.0, "ind3": 63.0, "ind4": 65.0, "ind5": 55.0, "ind6": 38.0, "ind7": 50.0,
        "obs": "USF Fluvial — atende comunidades ribeirinhas. Acesso sazonal limita produção. Cito depende de coleta presencial na UBS sede.",
    },
]

@router.get("/qualidade/quadrimestral")
async def qualidade_quadrimestral(_: UserOut = Depends(get_current_user)):
    return {
        "quadrimestre_atual": "1º Quadrimestre 2026 (Jan–Abr)",
        "referencia_anterior": "3º Quadrimestre 2025 (Set–Dez)",
        "media_geral_atual": 65.9,
        "media_geral_anterior": 63.7,
        "variacao_geral": +2.2,
        "projecao_2q_2026": 68.5,
        "indicadores": _QUAD_COMPARATIVO,
        "equipes": _QUAD_EQUIPES_RESUMO,
        "parecer_gestor": (
            "Apuí apresenta evolução consistente (+2.2 p.p.) no 1º quadrimestre de 2026. "
            "Destaque para o Ind.4 (Consulta RN na 1ª semana) que atingiu 81.9%, acima da meta. "
            "Ponto crítico: Ind.2 (Citopatológico) em 37.1% — necessário plano de ação com busca ativa "
            "e mutirão de coleta para o 2º quadrimestre. Equipe TRÊS ESTADOS requer monitoramento intensivo."
        ),
    }
