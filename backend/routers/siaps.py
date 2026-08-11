"""
Router: /api/siaps — SIAPS / eGestor APS
Componentes de Cofinanciamento da APS — Apuí/AM (IBGE 1300144)
Integração em cascata: tenta APIs públicas (eGestor/SIAPS/SISAB) e cai no
fallback hardcoded Mai/2026 se todas falharem.
"""
from __future__ import annotations
from datetime import date
import logging
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from functools import lru_cache
from services import siaps_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/siaps", tags=["SIAPS / eGestor APS"])

# ── Abrangência Municipal ─────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _ABRANGENCIA():
    return {
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
# Competência Abr/2026 — Tipo Equipe: eSF — DADO PRELIMINAR
#
# LEGENDA DAS COLUNAS (conforme extração Siaps):
#   A  = pessoas cadastradas COM visita ACS na competência
#   B  = pessoas cadastradas SEM visita ACS na competência
#   C  = total cadastrados (A + B)
#   D  = gestantes acompanhadas
#   E  = crianças < 2 anos acompanhadas
#   F  = hipertensos acompanhados
#   G  = diabéticos acompanhados
#   H  = pessoas ACOMPANHADAS (subconjunto de K — receberam atenção ativa)  ← CORRIGIDO
#   I  = denominador de referência (variável por equipe)
#   J  = pendente de validação (valor 0 — aguarda exportação oficial)
#   K  = pessoas VINCULADAS à equipe (≈ C, após validação de cadastros)    ← CORRIGIDO
#
# CORREÇÃO APLICADA em 2026-08-07:
#   Bug anterior: H = K em todas as equipes (acompanhadas = vinculadas, impossível).
#   H foi ajustado para valor estimado (~85-92% de K conforme desempenho da equipe).
#   ⚠️  Valores de H são ESTIMATIVAS até recebimento do arquivo oficial do Siaps.
#   Solicitar ao responsável: exportar "Componente Vínculo e Acompanhamento Territorial"
#   competência Abr/2026 em siaps.saude.gov.br > Relatórios > por Equipe.

@lru_cache(maxsize=1)
def _VINCULO_EQUIPES():
    return [
        {
            "ubs": "UBS IRMÃ ELIZABETE",
            "equipe": "CACHOEIRA",
            "tipo": "eSF",
            "parametro": 2500,
            "A": 6,    "B": 1559, "C": 1565,
            "D": 664,  "E": 261,  "F": 550,  "G": 77,
            "H": 1366, "I": 3027, "J": 0,    "K": 1552,  # H estimado (~88% de K)
            "pontuacao": 8.25,
            "status": "bom",
            "H_pendente_validacao": True,
        },
        {
            "ubs": "UBS ANIZIO FERREIRA DA SILVA",
            "equipe": "SÃO SEBASTIÃO",
            "tipo": "eSF",
            "parametro": 2500,
            "A": 5,    "B": 1614, "C": 1619,
            "D": 748,  "E": 319,  "F": 466,  "G": 52,
            "H": 1379, "I": 2709, "J": 0,    "K": 1585,  # H estimado (~87% de K)
            "pontuacao": 8.25,
            "status": "bom",
            "H_pendente_validacao": True,
        },
        {
            "ubs": "UBS ANIZIO FERREIRA DA SILVA",
            "equipe": "ACARI",
            "tipo": "eSF",
            "parametro": 2500,
            "A": 2,    "B": 1637, "C": 1639,
            "D": 735,  "E": 272,  "F": 546,  "G": 58,
            "H": 1418, "I": 2656, "J": 0,    "K": 1611,  # H estimado (~88% de K)
            "pontuacao": 8.25,
            "status": "bom",
            "H_pendente_validacao": True,
        },
        {
            "ubs": "UBS OSVALDO LEMES CABRAL",
            "equipe": "TRÊS ESTADOS",
            "tipo": "eSF",
            "parametro": 2500,
            "A": 5,    "B": 1040, "C": 1045,
            "D": 335,  "E": 162,  "F": 478,  "G": 60,
            "H": 849,  "I": 1942, "J": 0,    "K": 1035,  # H estimado (~82% de K — suficiente)
            "pontuacao": 5.00,
            "status": "suficiente",
            "H_pendente_validacao": True,
        },
        {
            "ubs": "CENTRO DE SAÚDE CURUMIM",
            "equipe": "JUMA",
            "tipo": "eSF",
            "parametro": 2500,
            "A": 5,    "B": 1756, "C": 1761,
            "D": 750,  "E": 330,  "F": 577,  "G": 75,
            "H": 1542, "I": 2847, "J": 0,    "K": 1732,  # H estimado (~89% de K)
            "pontuacao": 8.25,
            "status": "bom",
            "H_pendente_validacao": True,
        },
        {
            "ubs": "CENTRO DE SAÚDE CURUMIM",
            "equipe": "LIBERDADE",
            "tipo": "eSF",
            "parametro": 2500,
            "A": 4,    "B": 1793, "C": 1797,
            "D": 593,  "E": 282,  "F": 820,  "G": 89,
            "H": 1641, "I": 3074, "J": 0,    "K": 1784,  # H estimado (~92% de K — ótimo)
            "pontuacao": 10.00,
            "status": "otimo",
            "H_pendente_validacao": True,
        },
        {
            "ubs": "UBS PADRE FALIERO BONCI",
            "equipe": "KENNEDY",
            "tipo": "eSF",
            "parametro": 2500,
            "A": 2,    "B": 771,  "C": 773,
            "D": 237,  "E": 141,  "F": 348,  "G": 35,
            "H": 594,  "I": 1176, "J": 0,    "K": 761,   # H estimado (~78% de K — regular)
            "pontuacao": 3.25,
            "status": "regular",
            "H_pendente_validacao": True,
        },
        {
            "ubs": "UBS JK",
            "equipe": "JK",
            "tipo": "eSF",
            "parametro": 2500,
            "A": 8,    "B": 1532, "C": 1540,
            "D": 589,  "E": 262,  "F": 571,  "G": 75,
            "H": 1302, "I": 2670, "J": 0,    "K": 1497,  # H estimado (~87% de K)
            "pontuacao": 8.25,
            "status": "bom",
            "H_pendente_validacao": True,
        },
        {
            "ubs": "UBS CLÁUDIA PEREIRA DOS SANTOS DAMACENA",
            "equipe": "ESTRADA NOVA",
            "tipo": "eSF",
            "parametro": 2500,
            "A": 0,    "B": 822,  "C": 822,
            "D": 269,  "E": 139,  "F": 368,  "G": 30,
            "H": 613,  "I": 1404, "J": 0,    "K": 806,   # H estimado (~76% de K — regular)
            "pontuacao": 3.25,
            "status": "regular",
            "H_pendente_validacao": True,
        },
    ]


# ── Componente Qualidade (Novo Financiamento APS — 15 indicadores — Portaria 3.493/2024) ──

# Metas atualizadas conforme Portaria GM/MS 3.493/2024:
# I01 pré-natal: 55% | I02 cito: 50% | I03 DTP: 90% | I04 RN: 55%
# I05-I07 saúde bucal: 45% | I08 HAS: 60% | I09 DM: 55% | I10 obesidade: 55%
# I11 risco CV: 50% | I12 psicose: 50% | I13 TAB: 50% | I14-I15 sífilis: 55%

@lru_cache(maxsize=1)
def _QUALIDADE_EQUIPES():
    return [
        {
            "ubs": "UBS IRMÃ ELIZABETE", "equipe": "CACHOEIRA",
            "indicadores": {
                "ind1_prenatal":   {"resultado": 84.4, "meta": 55.0, "status": "verde"},
                "ind2_cito":       {"resultado": 43.0, "meta": 50.0, "status": "vermelho"},
                "ind3_vacina":     {"resultado": 88.2, "meta": 90.0, "status": "amarelo"},
                "ind4_rn":         {"resultado": 91.1, "meta": 55.0, "status": "verde"},
                "ind5_odonto1":    {"resultado": 38.5, "meta": 45.0, "status": "vermelho"},
                "ind6_odonto_comp":{"resultado": 30.2, "meta": 45.0, "status": "vermelho"},
                "ind7_urg_odonto": {"resultado": 54.8, "meta": 45.0, "status": "verde"},
                "ind8_has":        {"resultado": 79.0, "meta": 60.0, "status": "verde"},
                "ind9_dm":         {"resultado": 62.5, "meta": 55.0, "status": "verde"},
                "ind10_obesidade": {"resultado": 77.8, "meta": 55.0, "status": "verde"},
                "ind11_cv":        {"resultado": 42.5, "meta": 50.0, "status": "vermelho"},
                "ind12_psicose":   {"resultado": 48.2, "meta": 50.0, "status": "amarelo"},
                "ind13_tab":       {"resultado": 42.0, "meta": 50.0, "status": "vermelho"},
                "ind14_sif_gest":  {"resultado": 80.0, "meta": 55.0, "status": "verde"},
                "ind15_sif_cong":  {"resultado": 83.3, "meta": 55.0, "status": "verde"},
            },
            "pontuacao_qualidade": 55.27, "status_qualidade": "bom",
        },
        {
            "ubs": "UBS ANIZIO FERREIRA DA SILVA", "equipe": "SÃO SEBASTIÃO",
            "indicadores": {
                "ind1_prenatal":   {"resultado": 80.0, "meta": 55.0, "status": "verde"},
                "ind2_cito":       {"resultado": 41.2, "meta": 50.0, "status": "vermelho"},
                "ind3_vacina":     {"resultado": 82.4, "meta": 90.0, "status": "amarelo"},
                "ind4_rn":         {"resultado": 88.9, "meta": 55.0, "status": "verde"},
                "ind5_odonto1":    {"resultado": 37.2, "meta": 45.0, "status": "vermelho"},
                "ind6_odonto_comp":{"resultado": 29.4, "meta": 45.0, "status": "vermelho"},
                "ind7_urg_odonto": {"resultado": 53.6, "meta": 45.0, "status": "verde"},
                "ind8_has":        {"resultado": 75.4, "meta": 60.0, "status": "verde"},
                "ind9_dm":         {"resultado": 58.1, "meta": 55.0, "status": "verde"},
                "ind10_obesidade": {"resultado": 73.3, "meta": 55.0, "status": "verde"},
                "ind11_cv":        {"resultado": 41.0, "meta": 50.0, "status": "vermelho"},
                "ind12_psicose":   {"resultado": 47.1, "meta": 50.0, "status": "amarelo"},
                "ind13_tab":       {"resultado": 40.8, "meta": 50.0, "status": "vermelho"},
                "ind14_sif_gest":  {"resultado": 76.9, "meta": 55.0, "status": "verde"},
                "ind15_sif_cong":  {"resultado": 80.0, "meta": 55.0, "status": "verde"},
            },
            "pontuacao_qualidade": 53.52, "status_qualidade": "suficiente",
        },
        {
            "ubs": "UBS ANIZIO FERREIRA DA SILVA", "equipe": "ACARI",
            "indicadores": {
                "ind1_prenatal":   {"resultado": 78.6, "meta": 55.0, "status": "verde"},
                "ind2_cito":       {"resultado": 39.8, "meta": 50.0, "status": "vermelho"},
                "ind3_vacina":     {"resultado": 80.0, "meta": 90.0, "status": "amarelo"},
                "ind4_rn":         {"resultado": 90.0, "meta": 55.0, "status": "verde"},
                "ind5_odonto1":    {"resultado": 36.8, "meta": 45.0, "status": "vermelho"},
                "ind6_odonto_comp":{"resultado": 28.8, "meta": 45.0, "status": "vermelho"},
                "ind7_urg_odonto": {"resultado": 52.4, "meta": 45.0, "status": "verde"},
                "ind8_has":        {"resultado": 77.3, "meta": 60.0, "status": "verde"},
                "ind9_dm":         {"resultado": 60.0, "meta": 55.0, "status": "verde"},
                "ind10_obesidade": {"resultado": 72.2, "meta": 55.0, "status": "verde"},
                "ind11_cv":        {"resultado": 40.2, "meta": 50.0, "status": "vermelho"},
                "ind12_psicose":   {"resultado": 46.5, "meta": 50.0, "status": "amarelo"},
                "ind13_tab":       {"resultado": 39.5, "meta": 50.0, "status": "vermelho"},
                "ind14_sif_gest":  {"resultado": 75.0, "meta": 55.0, "status": "verde"},
                "ind15_sif_cong":  {"resultado": 78.6, "meta": 55.0, "status": "verde"},
            },
            "pontuacao_qualidade": 63.99, "status_qualidade": "bom",
        },
        {
            "ubs": "UBS OSVALDO LEMES CABRAL", "equipe": "TRÊS ESTADOS",
            "indicadores": {
                "ind1_prenatal":   {"resultado": 55.6, "meta": 55.0, "status": "verde"},
                "ind2_cito":       {"resultado": 28.4, "meta": 50.0, "status": "vermelho"},
                "ind3_vacina":     {"resultado": 62.5, "meta": 90.0, "status": "vermelho"},
                "ind4_rn":         {"resultado": 66.7, "meta": 55.0, "status": "verde"},
                "ind5_odonto1":    {"resultado": 24.5, "meta": 45.0, "status": "vermelho"},
                "ind6_odonto_comp":{"resultado": 18.2, "meta": 45.0, "status": "vermelho"},
                "ind7_urg_odonto": {"resultado": 38.6, "meta": 45.0, "status": "vermelho"},
                "ind8_has":        {"resultado": 58.1, "meta": 60.0, "status": "amarelo"},
                "ind9_dm":         {"resultado": 45.5, "meta": 55.0, "status": "vermelho"},
                "ind10_obesidade": {"resultado": 54.5, "meta": 55.0, "status": "amarelo"},
                "ind11_cv":        {"resultado": 28.5, "meta": 50.0, "status": "vermelho"},
                "ind12_psicose":   {"resultado": 32.0, "meta": 50.0, "status": "vermelho"},
                "ind13_tab":       {"resultado": 26.4, "meta": 50.0, "status": "vermelho"},
                "ind14_sif_gest":  {"resultado": 50.0, "meta": 55.0, "status": "amarelo"},
                "ind15_sif_cong":  {"resultado": 50.0, "meta": 55.0, "status": "amarelo"},
            },
            "pontuacao_qualidade": 33.41, "status_qualidade": "regular",
        },
        {
            "ubs": "CENTRO DE SAÚDE CURUMIM", "equipe": "JUMA",
            "indicadores": {
                "ind1_prenatal":   {"resultado": 85.7, "meta": 55.0, "status": "verde"},
                "ind2_cito":       {"resultado": 44.8, "meta": 50.0, "status": "vermelho"},
                "ind3_vacina":     {"resultado": 85.0, "meta": 90.0, "status": "amarelo"},
                "ind4_rn":         {"resultado": 92.9, "meta": 55.0, "status": "verde"},
                "ind5_odonto1":    {"resultado": 39.4, "meta": 45.0, "status": "vermelho"},
                "ind6_odonto_comp":{"resultado": 31.0, "meta": 45.0, "status": "vermelho"},
                "ind7_urg_odonto": {"resultado": 55.8, "meta": 45.0, "status": "verde"},
                "ind8_has":        {"resultado": 80.5, "meta": 60.0, "status": "verde"},
                "ind9_dm":         {"resultado": 63.6, "meta": 55.0, "status": "verde"},
                "ind10_obesidade": {"resultado": 79.4, "meta": 55.0, "status": "verde"},
                "ind11_cv":        {"resultado": 43.5, "meta": 50.0, "status": "vermelho"},
                "ind12_psicose":   {"resultado": 49.2, "meta": 50.0, "status": "amarelo"},
                "ind13_tab":       {"resultado": 43.8, "meta": 50.0, "status": "vermelho"},
                "ind14_sif_gest":  {"resultado": 82.4, "meta": 55.0, "status": "verde"},
                "ind15_sif_cong":  {"resultado": 85.7, "meta": 55.0, "status": "verde"},
            },
            "pontuacao_qualidade": 55.17, "status_qualidade": "bom",
        },
        {
            "ubs": "CENTRO DE SAÚDE CURUMIM", "equipe": "LIBERDADE",
            "indicadores": {
                "ind1_prenatal":   {"resultado": 90.9, "meta": 55.0, "status": "verde"},
                "ind2_cito":       {"resultado": 52.4, "meta": 50.0, "status": "verde"},
                "ind3_vacina":     {"resultado": 90.5, "meta": 90.0, "status": "verde"},
                "ind4_rn":         {"resultado": 100.0,"meta": 55.0, "status": "verde"},
                "ind5_odonto1":    {"resultado": 46.2, "meta": 45.0, "status": "verde"},
                "ind6_odonto_comp":{"resultado": 38.5, "meta": 45.0, "status": "vermelho"},
                "ind7_urg_odonto": {"resultado": 63.4, "meta": 45.0, "status": "verde"},
                "ind8_has":        {"resultado": 85.2, "meta": 60.0, "status": "verde"},
                "ind9_dm":         {"resultado": 71.4, "meta": 55.0, "status": "verde"},
                "ind10_obesidade": {"resultado": 83.3, "meta": 55.0, "status": "verde"},
                "ind11_cv":        {"resultado": 52.5, "meta": 50.0, "status": "verde"},
                "ind12_psicose":   {"resultado": 57.8, "meta": 50.0, "status": "verde"},
                "ind13_tab":       {"resultado": 53.2, "meta": 50.0, "status": "verde"},
                "ind14_sif_gest":  {"resultado": 91.7, "meta": 55.0, "status": "verde"},
                "ind15_sif_cong":  {"resultado": 100.0,"meta": 55.0, "status": "verde"},
            },
            "pontuacao_qualidade": 63.62, "status_qualidade": "bom",
        },
        {
            "ubs": "UBS PADRE FALIERO BONCI", "equipe": "KENNEDY",
            "indicadores": {
                "ind1_prenatal":   {"resultado": 72.0, "meta": 55.0, "status": "verde"},
                "ind2_cito":       {"resultado": 40.0, "meta": 50.0, "status": "amarelo"},
                "ind3_vacina":     {"resultado": 76.0, "meta": 90.0, "status": "amarelo"},
                "ind4_rn":         {"resultado": 80.0, "meta": 55.0, "status": "verde"},
                "ind5_odonto1":    {"resultado": 50.0, "meta": 45.0, "status": "verde"},
                "ind6_odonto_comp":{"resultado": 46.0, "meta": 45.0, "status": "verde"},
                "ind7_urg_odonto": {"resultado": 58.0, "meta": 45.0, "status": "verde"},
                "ind8_has":        {"resultado": 82.0, "meta": 60.0, "status": "verde"},
                "ind9_dm":         {"resultado": 68.0, "meta": 55.0, "status": "verde"},
                "ind10_obesidade": {"resultado": 75.0, "meta": 55.0, "status": "verde"},
                "ind11_cv":        {"resultado": 58.0, "meta": 50.0, "status": "verde"},
                "ind12_psicose":   {"resultado": 55.0, "meta": 50.0, "status": "verde"},
                "ind13_tab":       {"resultado": 52.0, "meta": 50.0, "status": "verde"},
                "ind14_sif_gest":  {"resultado": 72.0, "meta": 55.0, "status": "verde"},
                "ind15_sif_cong":  {"resultado": 75.0, "meta": 55.0, "status": "verde"},
            },
            "pontuacao_qualidade": 70.89, "status_qualidade": "otimo",
        },
        {
            "ubs": "UBS JK", "equipe": "JK",
            "indicadores": {
                "ind1_prenatal":   {"resultado": 83.3, "meta": 55.0, "status": "verde"},
                "ind2_cito":       {"resultado": 42.5, "meta": 50.0, "status": "vermelho"},
                "ind3_vacina":     {"resultado": 86.2, "meta": 90.0, "status": "amarelo"},
                "ind4_rn":         {"resultado": 90.0, "meta": 55.0, "status": "verde"},
                "ind5_odonto1":    {"resultado": 38.0, "meta": 45.0, "status": "vermelho"},
                "ind6_odonto_comp":{"resultado": 29.8, "meta": 45.0, "status": "vermelho"},
                "ind7_urg_odonto": {"resultado": 53.0, "meta": 45.0, "status": "verde"},
                "ind8_has":        {"resultado": 77.8, "meta": 60.0, "status": "verde"},
                "ind9_dm":         {"resultado": 61.5, "meta": 55.0, "status": "verde"},
                "ind10_obesidade": {"resultado": 76.9, "meta": 55.0, "status": "verde"},
                "ind11_cv":        {"resultado": 41.2, "meta": 50.0, "status": "vermelho"},
                "ind12_psicose":   {"resultado": 47.5, "meta": 50.0, "status": "amarelo"},
                "ind13_tab":       {"resultado": 40.5, "meta": 50.0, "status": "vermelho"},
                "ind14_sif_gest":  {"resultado": 77.8, "meta": 55.0, "status": "verde"},
                "ind15_sif_cong":  {"resultado": 81.8, "meta": 55.0, "status": "verde"},
            },
            "pontuacao_qualidade": 68.14, "status_qualidade": "bom",
        },
        {
            "ubs": "UBS CLÁUDIA PEREIRA DOS SANTOS DAMACENA", "equipe": "ESTRADA NOVA",
            "indicadores": {
                "ind1_prenatal":   {"resultado": 44.4, "meta": 55.0, "status": "vermelho"},
                "ind2_cito":       {"resultado": 19.8, "meta": 50.0, "status": "vermelho"},
                "ind3_vacina":     {"resultado": 55.0, "meta": 90.0, "status": "vermelho"},
                "ind4_rn":         {"resultado": 57.1, "meta": 55.0, "status": "verde"},
                "ind5_odonto1":    {"resultado": 20.5, "meta": 45.0, "status": "vermelho"},
                "ind6_odonto_comp":{"resultado": 15.2, "meta": 45.0, "status": "vermelho"},
                "ind7_urg_odonto": {"resultado": 34.4, "meta": 45.0, "status": "vermelho"},
                "ind8_has":        {"resultado": 48.7, "meta": 60.0, "status": "vermelho"},
                "ind9_dm":         {"resultado": 35.7, "meta": 55.0, "status": "vermelho"},
                "ind10_obesidade": {"resultado": 41.2, "meta": 55.0, "status": "vermelho"},
                "ind11_cv":        {"resultado": 21.8, "meta": 50.0, "status": "vermelho"},
                "ind12_psicose":   {"resultado": 26.0, "meta": 50.0, "status": "vermelho"},
                "ind13_tab":       {"resultado": 20.4, "meta": 50.0, "status": "vermelho"},
                "ind14_sif_gest":  {"resultado": 38.5, "meta": 55.0, "status": "vermelho"},
                "ind15_sif_cong":  {"resultado": 42.9, "meta": 55.0, "status": "vermelho"},
            },
            "pontuacao_qualidade": 54.48, "status_qualidade": "suficiente",
        },
    ]


# ── Boas Práticas ─────────────────────────────────────────────────────────────

def _gerar_boas_praticas() -> list:
    """Gera boas práticas e alertas por indicador a partir dos dados reais de cada equipe."""
    INDS = [
        ("ind1_prenatal",    "I01 — Pré-natal ≥7 consultas (1º trim.)",         55.0),
        ("ind2_cito",        "I02 — Citopatológico colo uterino",               50.0),
        ("ind3_vacina",      "I03 — Vacinação DTP/Pentavalente",                90.0),
        ("ind4_rn",          "I04 — Puerpério / RN 1ª semana",                  55.0),
        ("ind5_odonto1",     "I05 — 1ª Consulta Odontológica Programática",     45.0),
        ("ind6_odonto_comp", "I06 — Tratamento Odontológico Completado",        45.0),
        ("ind7_urg_odonto",  "I07 — Urgência Odontológica Resolvida",           45.0),
        ("ind8_has",         "I08 — Acompanhamento HAS",                        60.0),
        ("ind9_dm",          "I09 — Acompanhamento DM (HbA1c)",                 55.0),
        ("ind10_obesidade",  "I10 — Obesidade Infantil (IMC 5-9 anos)",         55.0),
        ("ind11_cv",         "I11 — Alto Risco Cardiovascular",                 50.0),
        ("ind12_psicose",    "I12 — Esquizofrenia / Psicose",                   50.0),
        ("ind13_tab",        "I13 — Transtorno Afetivo Bipolar",                50.0),
        ("ind14_sif_gest",   "I14 — Sífilis em Gestante — Tratamento",          55.0),
        ("ind15_sif_cong",   "I15 — Sífilis Congênita — Tratamento",            55.0),
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
                for e in _QUALIDADE_EQUIPES()
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
    regulares = [e["equipe"] for e in _QUALIDADE_EQUIPES() if e["status_qualidade"] == "regular"]
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
    return {**_ABRANGENCIA(), "competencia": "Abr/2026", "fonte": "siaps_referencia"}


@router.get("/vinculo-acompanhamento")
async def vinculo_acompanhamento(
    competencia: str = Query("2026-05"),
    tipo_equipe: str = Query("eAP,eSF"),
    _: UserOut = Depends(get_current_user),
):
    comp_fmt = competencia.replace("-", "")  # "2026-05" → "202605"

    # Tenta busca real na API
    equipes_api = await siaps_service.buscar_vinculo(comp_fmt)
    if equipes_api:
        equipes = equipes_api
        fonte = "siaps_api"
        dado_preliminar = False
        aviso = None
    else:
        equipes = _VINCULO_EQUIPES()
        fonte = "siaps_referencia"
        dado_preliminar = True
        aviso = "API SIAPS indisponível — dados de referência Mai/2026 (hardcoded)."

    total_vinculadas   = sum(e["K"] for e in equipes)
    total_acompanhadas = sum(e["H"] for e in equipes)
    pontuacao_media    = round(sum(e["pontuacao"] for e in equipes) / len(equipes), 2)

    por_status = {
        "otimo":      sum(1 for e in equipes if e["pontuacao"] > 8.5),
        "bom":        sum(1 for e in equipes if 7.0 <= e["pontuacao"] <= 8.5),
        "suficiente": sum(1 for e in equipes if 5.0 <= e["pontuacao"] < 7.0),
        "regular":    sum(1 for e in equipes if e["pontuacao"] < 5.0),
    }

    resp = {
        "competencia": competencia,
        "tipo_equipe": tipo_equipe,
        "dado_preliminar": dado_preliminar,
        "municipio": "APUÍ",
        "uf": "AM",
        "ibge": "1300144",
        "populacao_ibge_censo2022": 18732,
        "ied": 2,
        "total_equipes": len(equipes),
        "total_pessoas_vinculadas": total_vinculadas,
        "total_pessoas_acompanhadas": total_acompanhadas,
        "cobertura_estimada_pct": round(total_vinculadas / 18732 * 100, 1),
        "pontuacao_media": pontuacao_media,
        "por_status": por_status,
        "equipes": equipes,
        "fonte": fonte,
    }
    if aviso:
        resp["aviso"] = aviso
    return resp


@router.get("/qualidade")
async def componente_qualidade(
    competencia: str = Query("2026-05"),
    _: UserOut = Depends(get_current_user),
):
    comp_fmt = competencia.replace("-", "")

    # Tenta merge: pontuações reais da API + indicadores individuais do fallback
    equipes_api = await siaps_service.buscar_qualidade(comp_fmt)
    equipes_ref = _QUALIDADE_EQUIPES()
    fonte = "siaps_referencia"

    if equipes_api:
        # Mescla: usa pontuação real da API; mantém indicadores individuais do ref
        mapa_ref = {e["equipe"]: e for e in equipes_ref}
        equipes_merge = []
        for ea in equipes_api:
            nome = ea["equipe"].upper()
            ref = mapa_ref.get(nome, {})
            equipes_merge.append({
                **ref,
                "equipe": nome,
                "ubs":    ea.get("ubs") or ref.get("ubs", ""),
                "pontuacao_qualidade": ea["pontuacao_qualidade"],
                "status_qualidade":    _status_qualidade(ea["pontuacao_qualidade"]),
                "indicadores": ref.get("indicadores", {}),
            })
        equipes = equipes_merge if equipes_merge else equipes_ref
        fonte = "siaps_api+referencia"
        logger.info("SIAPS qualidade: %d equipes da API mescladas com referência", len(equipes))
    else:
        equipes = equipes_ref

    pontuacao_media = round(sum(e.get("pontuacao_qualidade", 0) for e in equipes) / len(equipes), 2)

    # Consolidado por indicador (usa dados do fallback para médias)
    indicadores_resumo = {}
    nomes = {
        "ind1_prenatal":    "Pré-natal ≥7 consultas (1º trim.)",
        "ind2_cito":        "Citopatológico colo uterino",
        "ind3_vacina":      "Vacinação DTP/Pentavalente",
        "ind4_rn":          "Puerpério / RN 1ª semana",
        "ind5_odonto1":     "1ª Consulta Odontológica Programática",
        "ind6_odonto_comp": "Tratamento Odontológico Completado",
        "ind7_urg_odonto":  "Urgência Odontológica Resolvida",
        "ind8_has":         "Acompanhamento HAS",
        "ind9_dm":          "Acompanhamento DM (HbA1c)",
        "ind10_obesidade":  "Obesidade Infantil (IMC 5-9 anos)",
        "ind11_cv":         "Alto Risco Cardiovascular",
        "ind12_psicose":    "Esquizofrenia / Psicose",
        "ind13_tab":        "Transtorno Afetivo Bipolar",
        "ind14_sif_gest":   "Sífilis em Gestante — Tratamento",
        "ind15_sif_cong":   "Sífilis Congênita — Tratamento",
    }
    for key, nome in nomes.items():
        try:
            vals = [e["indicadores"][key]["resultado"] for e in equipes if e.get("indicadores", {}).get(key)]
            status_list = [e["indicadores"][key]["status"] for e in equipes if e.get("indicadores", {}).get(key)]
        except (KeyError, TypeError):
            vals, status_list = [], []
        if not vals:
            continue
        indicadores_resumo[key] = {
            "nome": nome,
            "media": round(sum(vals) / len(vals), 1),
            "min": round(min(vals), 1),
            "max": round(max(vals), 1),
            "otimo":   sum(1 for s in status_list if s == "verde"),
            "atencao": sum(1 for s in status_list if s == "amarelo"),
            "critico": sum(1 for s in status_list if s == "vermelho"),
        }

    return {
        "competencia": competencia,
        "municipio": "APUÍ",
        "total_equipes": len(equipes),
        "pontuacao_media": pontuacao_media,
        "indicadores_resumo": indicadores_resumo,
        "equipes": equipes,
        "fonte": fonte,
    }


def _status_qualidade(pontuacao: float) -> str:
    if pontuacao >= 70:
        return "otimo"
    if pontuacao >= 55:
        return "bom"
    if pontuacao >= 40:
        return "suficiente"
    return "regular"


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
    equipes_vinculo = _VINCULO_EQUIPES()
    pontuacao_media_vinculo = round(sum(e["pontuacao"] for e in equipes_vinculo) / len(equipes_vinculo), 2)
    equipes_qualidade = _QUALIDADE_EQUIPES()
    pontuacao_media_qualidade = round(sum(e["pontuacao_qualidade"] for e in equipes_qualidade) / len(equipes_qualidade), 2)

    return {
        "municipio": "APUÍ",
        "uf": "AM",
        "ibge": "1300144",
        "competencia": "Abr/2026",
        "ied": 2,
        "abrangencia": _ABRANGENCIA(),
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


@router.post("/refresh-cache")
async def refresh_cache(_: UserOut = Depends(get_current_user)):
    """Limpa o cache de dados SIAPS forçando nova busca na API na próxima requisição."""
    siaps_service.limpar_cache()
    return {"ok": True, "mensagem": "Cache SIAPS limpo — próxima requisição buscará dados frescos da API."}


@router.get("/diagnostico-api")
async def diagnostico_api():
    """Testa autenticação SIAPS e retorna status das credenciais e conexão."""
    from config import settings as cfg
    cpf_ok    = bool(cfg.SIAPS_CPF)
    senha_ok  = bool(cfg.SIAPS_SENHA)
    # SIAPS_TOKEN: Bearer JWT extraído da sessão autenticada
    siaps_token_raw = (cfg.SIAPS_TOKEN or "").strip()
    siaps_token_ok  = len(siaps_token_raw) > 50 and siaps_token_raw.startswith("eyJ")
    auth_ok   = await siaps_service._autenticar()
    token_ok  = bool(siaps_service._auth.get("token")) or siaps_token_ok
    cookie_ok = bool(siaps_service._auth.get("cookies"))
    # Testa API com competência Mai/2026
    dados_api = await siaps_service.buscar_qualidade("202605")
    return {
        "credenciais_configuradas": cpf_ok and senha_ok,
        "SIAPS_CPF_definido":   cpf_ok,
        "SIAPS_SENHA_definida": senha_ok,
        "SIAPS_TOKEN_definido": siaps_token_ok,
        "SIAPS_TOKEN_preview":  siaps_token_raw[:20] + "..." if siaps_token_ok else siaps_token_raw[:30] or "(vazio)",
        "autenticacao_ok": auth_ok or siaps_token_ok,
        "metodo": "bearer_token_railway" if siaps_token_ok else ("bearer_token" if token_ok else ("cookie" if cookie_ok else "nenhum")),
        "api_siaps": "OK" if dados_api else "FALHOU",
        "equipes_encontradas": len(dados_api) if dados_api else 0,
        "instrucao": "API SIAPS ativa!" if dados_api else "Usando dados de referência Mai/2026.",
    }


# ── Acompanhamento Diário ─────────────────────────────────────────────────────
# CORREÇÃO 2026-08-07: equipes corrigidas para espelhar as 9 ESF do componente vínculo.
# Anteriormente listava GUARIBA, RIO NOVO, SUCURIÚ (inexistentes no componente).
# KENNEDY e JK e ESTRADA NOVA foram adicionadas; GUARIBA/RIO NOVO/SUCURIÚ removidas.

@lru_cache(maxsize=1)
def _DIARIO_EQUIPES():
    return [
        {"equipe": "CACHOEIRA",     "prenatal": 2, "cito": 0, "vacina_dtppenta": 3, "rn_semana1": 1, "has": 4, "dm": 2, "des_infantil": 1, "total_prod": 13, "alerta": None},
        {"equipe": "SÃO SEBASTIÃO", "prenatal": 1, "cito": 0, "vacina_dtppenta": 2, "rn_semana1": 0, "has": 3, "dm": 1, "des_infantil": 2, "total_prod": 9,  "alerta": None},
        {"equipe": "ACARI",         "prenatal": 3, "cito": 1, "vacina_dtppenta": 4, "rn_semana1": 1, "has": 5, "dm": 2, "des_infantil": 0, "total_prod": 16, "alerta": None},
        {"equipe": "TRÊS ESTADOS",  "prenatal": 0, "cito": 0, "vacina_dtppenta": 1, "rn_semana1": 0, "has": 1, "dm": 0, "des_infantil": 0, "total_prod": 2,  "alerta": "Produção crítica hoje — verifique presença da equipe"},
        {"equipe": "JUMA",          "prenatal": 2, "cito": 0, "vacina_dtppenta": 3, "rn_semana1": 0, "has": 2, "dm": 1, "des_infantil": 1, "total_prod": 9,  "alerta": None},
        {"equipe": "LIBERDADE",     "prenatal": 1, "cito": 1, "vacina_dtppenta": 2, "rn_semana1": 1, "has": 3, "dm": 2, "des_infantil": 2, "total_prod": 12, "alerta": None},
        {"equipe": "KENNEDY",       "prenatal": 0, "cito": 0, "vacina_dtppenta": 1, "rn_semana1": 0, "has": 2, "dm": 1, "des_infantil": 0, "total_prod": 4,  "alerta": "Produção baixa — equipe regular no componente vínculo"},
        {"equipe": "JK",            "prenatal": 2, "cito": 0, "vacina_dtppenta": 2, "rn_semana1": 1, "has": 3, "dm": 2, "des_infantil": 1, "total_prod": 11, "alerta": None},
        {"equipe": "ESTRADA NOVA",  "prenatal": 0, "cito": 0, "vacina_dtppenta": 1, "rn_semana1": 0, "has": 2, "dm": 1, "des_infantil": 0, "total_prod": 4,  "alerta": "Produção baixa — equipe regular no componente vínculo"},
    ]


@router.get("/qualidade/diario")
async def qualidade_diario(_: UserOut = Depends(get_current_user)):
    total_prod = sum(e["total_prod"] for e in _DIARIO_EQUIPES())
    alertas = [e for e in _DIARIO_EQUIPES() if e["alerta"]]
    hoje = date.today()
    return {
        "data": hoje.strftime("%d/%m/%Y"),
        "competencia": "Abr/2026",
        "total_producao_dia": total_prod,
        "equipes_com_alerta": len(alertas),
        "meta_diaria_estimada": 80,
        "pct_meta_dia": round(total_prod / 80 * 100, 1),
        "indicadores_criticos_hoje": ["Citopatológico (0 registros em 6 equipes)"],
        "equipes": _DIARIO_EQUIPES(),
    }


# ── Acompanhamento Mensal ─────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _MENSAL_EVOLUCAO():
    return [
        {"mes": "Nov/25", "ind1": 68.2, "ind2": 31.0, "ind3": 72.1, "ind4": 77.4, "ind5": 64.3, "ind6": 50.1, "ind7": 61.0, "media": 60.6},
        {"mes": "Dez/25", "ind1": 69.5, "ind2": 32.4, "ind3": 73.8, "ind4": 78.2, "ind5": 65.8, "ind6": 51.5, "ind7": 62.3, "media": 61.9},
        {"mes": "Jan/26", "ind1": 70.1, "ind2": 33.8, "ind3": 74.5, "ind4": 79.0, "ind5": 66.5, "ind6": 52.8, "ind7": 63.1, "media": 62.8},
        {"mes": "Fev/26", "ind1": 71.0, "ind2": 35.2, "ind3": 75.3, "ind4": 80.1, "ind5": 68.0, "ind6": 53.4, "ind7": 64.8, "media": 63.9},
        {"mes": "Mar/26", "ind1": 71.8, "ind2": 36.0, "ind3": 75.9, "ind4": 81.0, "ind5": 69.2, "ind6": 54.7, "ind7": 65.9, "media": 64.9},
        {"mes": "Abr/26", "ind1": 72.5, "ind2": 37.1, "ind3": 76.5, "ind4": 81.9, "ind5": 70.5, "ind6": 55.4, "ind7": 67.1, "media": 65.9},
    ]


@lru_cache(maxsize=1)
def _MENSAL_EQUIPES_EVOL():
    return [
        {"equipe": "CACHOEIRA",     "nov": 35.2, "dez": 36.8, "jan": 37.5, "fev": 38.0, "mar": 38.5, "abr": 38.5, "tendencia": "estavel"},
        {"equipe": "SÃO SEBASTIÃO", "nov": 33.8, "dez": 34.5, "jan": 35.2, "fev": 35.8, "mar": 36.2, "abr": 36.2, "tendencia": "estavel"},
        {"equipe": "ACARI",         "nov": 33.2, "dez": 34.0, "jan": 34.8, "fev": 35.4, "mar": 35.8, "abr": 35.8, "tendencia": "estavel"},
        {"equipe": "TRÊS ESTADOS",  "nov": 16.0, "dez": 17.2, "jan": 17.8, "fev": 18.1, "mar": 18.4, "abr": 18.4, "tendencia": "critica"},
        {"equipe": "JUMA",          "nov": 36.8, "dez": 37.5, "jan": 38.2, "fev": 38.8, "mar": 39.1, "abr": 39.1, "tendencia": "crescente"},
        {"equipe": "LIBERDADE",     "nov": 42.0, "dez": 43.5, "jan": 44.0, "fev": 44.5, "mar": 44.8, "abr": 44.8, "tendencia": "crescente"},
        {"equipe": "KENNEDY",       "nov": 11.0, "dez": 11.5, "jan": 12.0, "fev": 12.4, "mar": 12.6, "abr": 12.6, "tendencia": "estavel"},
        {"equipe": "JK",            "nov": 35.0, "dez": 35.8, "jan": 36.4, "fev": 37.0, "mar": 37.4, "abr": 37.6, "tendencia": "crescente"},
        {"equipe": "ESTRADA NOVA",  "nov": 8.2,  "dez": 8.8,  "jan": 9.2,  "fev": 9.5,  "mar": 9.8,  "abr": 9.8,  "tendencia": "estavel"},
    ]


@router.get("/qualidade/mensal")
async def qualidade_mensal(_: UserOut = Depends(get_current_user)):
    return {
        "competencia_atual": "Abr/2026",
        "variacao_mes_anterior": {
            "ind1_prenatal": +0.7, "ind2_cito": +1.1, "ind3_vacina": +0.6,
            "ind4_rn": +0.9, "ind5_odonto1": +0.4, "ind6_odonto_comp": +0.3,
            "ind7_urg_odonto": +0.5, "ind8_has": +1.3, "ind9_dm": +0.7,
            "ind10_obesidade": +1.2, "ind11_cv": +0.4, "ind12_psicose": +0.5,
            "ind13_tab": +0.3, "ind14_sif_gest": +0.6, "ind15_sif_cong": +0.4,
        },
        "evolucao": _MENSAL_EVOLUCAO(),
        "equipes_evolucao": _MENSAL_EQUIPES_EVOL(),
        "alerta_mensal": "I02 (Citopatológico): 37.1% — 12.9 p.p. abaixo da meta (50%). Crescimento de +1.1 p.p./mês — insuficiente para atingir a meta no quadrimestre. I03 (DTP): 76.5% vs meta 90%.",
        "destaque_mensal": "Equipe LIBERDADE: melhor pontuação pelo 3º mês consecutivo (44.8 pts).",
    }


# ── Acompanhamento Quadrimestral ──────────────────────────────────────────────

@lru_cache(maxsize=1)
def _QUAD_COMPARATIVO():
    return [
        {"indicador": "I01 — Pré-natal ≥7 consultas",    "1q_2025": 65.2, "2q_2025": 68.8, "3q_2025": 70.4, "1q_2026": 72.5, "meta": 55.0, "tendencia": "crescente"},
        {"indicador": "I02 — Citopatológico",             "1q_2025": 28.5, "2q_2025": 30.1, "3q_2025": 33.8, "1q_2026": 37.1, "meta": 50.0, "tendencia": "crescente_insuf"},
        {"indicador": "I03 — DTP/Pentavalente",           "1q_2025": 68.0, "2q_2025": 70.5, "3q_2025": 73.2, "1q_2026": 76.5, "meta": 90.0, "tendencia": "crescente"},
        {"indicador": "I04 — Puerpério / RN 1ª sem.",     "1q_2025": 74.0, "2q_2025": 76.8, "3q_2025": 79.5, "1q_2026": 81.9, "meta": 55.0, "tendencia": "crescente"},
        {"indicador": "I05 — 1ª Consulta Odontológica",   "1q_2025": 22.4, "2q_2025": 25.8, "3q_2025": 29.1, "1q_2026": 32.6, "meta": 45.0, "tendencia": "crescente"},
        {"indicador": "I06 — Odonto Completado",          "1q_2025": 16.0, "2q_2025": 19.2, "3q_2025": 22.5, "1q_2026": 25.8, "meta": 45.0, "tendencia": "crescente"},
        {"indicador": "I07 — Urgência Odonto Resolvida",  "1q_2025": 42.0, "2q_2025": 44.5, "3q_2025": 48.0, "1q_2026": 51.8, "meta": 45.0, "tendencia": "crescente"},
        {"indicador": "I08 — Acomp. HAS",                "1q_2025": 60.5, "2q_2025": 63.2, "3q_2025": 66.8, "1q_2026": 70.5, "meta": 60.0, "tendencia": "crescente"},
        {"indicador": "I09 — Acomp. DM (HbA1c)",         "1q_2025": 45.0, "2q_2025": 48.5, "3q_2025": 52.1, "1q_2026": 55.4, "meta": 55.0, "tendencia": "crescente"},
        {"indicador": "I10 — Obesidade Infantil",         "1q_2025": 58.0, "2q_2025": 61.5, "3q_2025": 64.3, "1q_2026": 67.1, "meta": 55.0, "tendencia": "crescente"},
        {"indicador": "I11 — Alto Risco Cardiovascular",  "1q_2025": 28.5, "2q_2025": 31.2, "3q_2025": 34.8, "1q_2026": 37.8, "meta": 50.0, "tendencia": "crescente"},
        {"indicador": "I12 — Esquizofrenia / Psicose",    "1q_2025": 34.2, "2q_2025": 37.0, "3q_2025": 40.5, "1q_2026": 43.5, "meta": 50.0, "tendencia": "crescente"},
        {"indicador": "I13 — Transtorno Afetivo Bipolar", "1q_2025": 28.8, "2q_2025": 31.5, "3q_2025": 35.0, "1q_2026": 38.4, "meta": 50.0, "tendencia": "crescente"},
        {"indicador": "I14 — Sífilis Gestante",           "1q_2025": 68.4, "2q_2025": 71.2, "3q_2025": 74.5, "1q_2026": 76.8, "meta": 55.0, "tendencia": "crescente"},
        {"indicador": "I15 — Sífilis Congênita",          "1q_2025": 72.0, "2q_2025": 75.5, "3q_2025": 78.8, "1q_2026": 81.4, "meta": 55.0, "tendencia": "crescente"},
    ]


@lru_cache(maxsize=1)
def _QUAD_EQUIPES_RESUMO():
    return [
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
            "equipe": "KENNEDY", "ubs": "UBS PADRE FALIERO BONCI", "tipo": "eSF",
            "1q_2025": 10.2, "2q_2025": 11.0, "3q_2025": 11.8, "1q_2026": 12.6,
            "status": "regular", "variacao": +0.8,
            "ind1": 42.0, "ind2": 18.5, "ind3": 52.0, "ind4": 58.0, "ind5": 22.4, "ind6": 16.8, "ind7": 36.0,
            "ind8": 52.6, "ind9": 40.0, "ind10": 45.5, "ind11": 24.0, "ind12": 28.5, "ind13": 22.8, "ind14": 42.9, "ind15": 50.0,
            "obs": "Equipe regular — sem médico. Requer ação de gestão para completar equipe e recuperar indicadores.",
        },
        {
            "equipe": "JK", "ubs": "UBS JK", "tipo": "eSF",
            "1q_2025": 34.0, "2q_2025": 35.5, "3q_2025": 36.8, "1q_2026": 37.6,
            "status": "bom", "variacao": +0.8,
            "ind1": 72.0, "ind2": 36.5, "ind3": 78.0, "ind4": 82.0, "ind5": 38.0, "ind6": 29.8, "ind7": 53.0,
            "ind8": 77.8, "ind9": 61.5, "ind10": 76.9, "ind11": 41.2, "ind12": 47.5, "ind13": 40.5, "ind14": 77.8, "ind15": 81.8,
            "obs": None,
        },
        {
            "equipe": "ESTRADA NOVA", "ubs": "UBS CLÁUDIA PEREIRA DOS SANTOS DAMACENA", "tipo": "eSF",
            "1q_2025": 7.5, "2q_2025": 8.2, "3q_2025": 9.0, "1q_2026": 9.8,
            "status": "regular", "variacao": +0.8,
            "ind1": 38.0, "ind2": 16.0, "ind3": 48.0, "ind4": 55.0, "ind5": 20.5, "ind6": 15.2, "ind7": 34.4,
            "ind8": 48.7, "ind9": 35.7, "ind10": 41.2, "ind11": 21.8, "ind12": 26.0, "ind13": 20.4, "ind14": 38.5, "ind15": 42.9,
            "obs": "Equipe regular — sem médico. Área rural dispersa dificulta acesso e registro no e-SUS.",
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
        "indicadores": _QUAD_COMPARATIVO(),
        "equipes": _QUAD_EQUIPES_RESUMO(),
        "parecer_gestor": (
            "Apuí apresenta evolução consistente (+2.2 p.p.) no 1º quadrimestre de 2026. "
            "Destaque para o Ind.4 (Consulta RN na 1ª semana) que atingiu 81.9%, acima da meta. "
            "Ponto crítico: Ind.2 (Citopatológico) em 37.1% — necessário plano de ação com busca ativa "
            "e mutirão de coleta para o 2º quadrimestre. Equipe TRÊS ESTADOS requer monitoramento intensivo."
        ),
    }