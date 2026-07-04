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

# ── Componente Qualidade (Previne Brasil 7 indicadores) ───────────────────────

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

_BOAS_PRATICAS = [
    {
        "titulo": "Equipe LIBERDADE — Vínculo Ótimo",
        "descricao": "Pontuação máxima (10,0) no Componente Vínculo. Maior cobertura de acompanhamento do município — 1.784 pessoas acompanhadas de 2.500 do parâmetro.",
        "ubs": "CENTRO DE SAÚDE CURUMIM", "equipe": "LIBERDADE",
        "tipo": "vinculo", "destaque": True,
    },
    {
        "titulo": "Pré-natal — Equipe CACHOEIRA acima da meta",
        "descricao": "84,4% das gestantes com ≥6 consultas de pré-natal e início no 1º trimestre (meta: 60%). Maior taxa de adesão ao pré-natal do município.",
        "ubs": "UBS IRMÃ ELIZABETE", "equipe": "CACHOEIRA",
        "tipo": "qualidade", "destaque": True,
    },
    {
        "titulo": "Consulta RN — Equipe LIBERDADE 100%",
        "descricao": "100% dos recém-nascidos com consulta na 1ª semana de vida. Indicador 4 do Previne Brasil — atingido por apenas 1 equipe no município.",
        "ubs": "CENTRO DE SAÚDE CURUMIM", "equipe": "LIBERDADE",
        "tipo": "qualidade", "destaque": True,
    },
    {
        "titulo": "Citopatológico — Maior cobertura: Equipe LIBERDADE (52,4%)",
        "descricao": "Apesar de ainda abaixo da meta (60%), equipe LIBERDADE lidera a cobertura de citopatológico. Atenção especial necessária em KENNEDY (22,1%) e ESTRADA NOVA (19,8%).",
        "ubs": "CENTRO DE SAÚDE CURUMIM", "equipe": "LIBERDADE",
        "tipo": "alerta_critico", "destaque": False,
    },
    {
        "titulo": "Vacinação — Meta não atingida por nenhuma equipe",
        "descricao": "Nenhuma das 9 equipes atingiu 95% de cobertura vacinal (DTP/Penta). Melhor desempenho: CACHOEIRA (88,2%). Prioridade: KENNEDY (58,3%) e ESTRADA NOVA (55,0%).",
        "ubs": "TODAS", "equipe": "TODAS",
        "tipo": "alerta_critico", "destaque": False,
    },
    {
        "titulo": "Equipes KENNEDY e ESTRADA NOVA — Plano de Melhoria",
        "descricao": "Pontuação Vínculo 3,25 (Regular). Recomendação: intensificar cadastros individuais e domiciliares, priorizar acompanhamento de idosos, crianças e beneficiários BPC/PBF.",
        "ubs": "UBS PADRE FALIERO BONCI / UBS CLÁUDIA PEREIRA", "equipe": "KENNEDY / ESTRADA NOVA",
        "tipo": "plano_melhoria", "destaque": False,
    },
]

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
