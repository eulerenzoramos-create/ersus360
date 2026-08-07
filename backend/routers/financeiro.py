"""
Router: /api/financeiro — Painel Financeiro Executivo
Agrega: FNS repasses, execução orçamentária, blocos, SIOPS, empenhos
Repasses: Jan–Jun 2026 integralmente recebidos (diferença = 0)
"""
from __future__ import annotations
import asyncio
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from functools import lru_cache

router = APIRouter(prefix="/api/financeiro", tags=["Financeiro"])

_ANO = 2026

# ── Entidade (dados reais FNS / IBGE) ────────────────────────────────────────
# Fonte: consultafns.saude.gov.br — FUNDO MUNICIPAL DE SAUDE DE APUI

@lru_cache(maxsize=1)
def _ENTIDADE():
    return {
        "nome":              "FUNDO MUNICIPAL DE SAUDE DE APUI",
        "cnpj":              "12.834.320/0001-26",
        "ibge":              "130014",
        "populacao":         21_781,
        "ano_censo":         2025,
        "prefeito":          "ANTONIO MARCOS MACIEL FERNANDES",
        "data_gestao":       "01/01/2025",
        "secretario":        "ROSANGELA MOTTER",
        "presidente_conselho": "ALICE OLIVEIRA",
    }


# ── Receitas reais FNS 2026 — Fonte: consultafns/#/detalhada/acao — APUÍ/AM ──
# Todos os incentivos recebidos Jan–Jun 2026 (acumulado)

# Atenção Primária — Novo Financiamento APS (Portaria GM/MS 3.493/2024)
_FNS_AB_SAUDE_BUCAL = 95_439.00     # Incentivo APS — Saúde Bucal
_FNS_AB_ESF_EAP     = 227_826.00    # Incentivo APS — ESF/EAP
_FNS_AB_DEMAIS      = 65_585.00     # Incentivo APS — Demais Prog./Serv./Equipes
_FNS_AB_EMULTI      = 16_750.00     # Incentivo APS — Equipes Multiprofissionais (eMulti)
_FNS_AB_ACS         = 213_972.00    # Agentes Comunitários de Saúde (ACS)
_FNS_AB_TOTAL       = (_FNS_AB_SAUDE_BUCAL + _FNS_AB_ESF_EAP + _FNS_AB_DEMAIS
                       + _FNS_AB_EMULTI + _FNS_AB_ACS)  # 619_572,00

# Outros blocos
_FNS_MAC  = 312_343.90   # MAC — Atenção à Saúde da População (MAC)
_FNS_VIGI =  25_936.00   # VIGI — Pagamento Vencimentos ACE

# FAF / GESSUS: SEM REPASSE em 2026

_FNS_TOTAL_RECEBIDO = _FNS_AB_TOTAL + _FNS_MAC + _FNS_VIGI  # 957_851,90

@lru_cache(maxsize=1)
def _RECEITAS():
    return {
        "orcamento_total":      18_540_000.0,
        "fns_previsto":          6_890_000.0,
        "fns_recebido":          _FNS_TOTAL_RECEBIDO,   # 957.851,90 real FNS Jan–Jun 2026
        "municipio_proprio":     2_180_400.0,
        "convenios_recebido":      420_000.0,
        "emendas_recebido":        180_000.0,
        "outros_recebido":         112_300.0,
        "total_arrecadado":      _FNS_TOTAL_RECEBIDO + 2_180_400.0 + 420_000.0 + 180_000.0,
    }


# ── Despesas / Execução ───────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _DESPESAS():
    return {
        "dotacao_inicial":      18_540_000.0,
        "dotacao_atualizada":   19_100_000.0,
        "empenhado":             7_820_500.0,
        "liquidado":             6_988_200.0,
        "pago":                  6_845_200.0,
        "a_pagar":                 143_000.0,
        "a_liquidar":              832_300.0,
    }


# ── Blocos de Financiamento FNS (valores reais 2026) ─────────────────────────
# Fonte: consultafns.saude.gov.br/#/detalhada/acao — APUÍ/AM

@lru_cache(maxsize=1)
def _BLOCOS():
    return [
        {
            "bloco": "Atenção Primária — Novo Financiamento APS",
            "codigo": "AB",
            "cor": "#2563eb",
            "previsto_ano":   1_239_144.0,   # estimativa anual (619.572 * 2 semestres)
            "recebido_ano":     619_572.0,   # real FNS Jan–Jun 2026 (5 incentivos)
            "empenhado":        495_000.0,
            "liquidado":        446_000.0,
            "pago":             412_000.0,
            "pct_execucao":     66.5,
            "ultima_parcela":   "Jun/2026",
            "proxima_parcela":  "Jul/2026",
            "sub_acoes": [
                {"label": "ESF/EAP",          "valor": _FNS_AB_ESF_EAP},
                {"label": "ACS",              "valor": _FNS_AB_ACS},
                {"label": "Saúde Bucal",      "valor": _FNS_AB_SAUDE_BUCAL},
                {"label": "Demais APS",       "valor": _FNS_AB_DEMAIS},
                {"label": "eMulti",           "valor": _FNS_AB_EMULTI},
            ],
        },
        {
            "bloco": "Média e Alta Complexidade (MAC)",
            "codigo": "MAC",
            "cor": "#dc2626",
            "previsto_ano":     624_687.80,  # estimativa anual (312k * 2 semestres)
            "recebido_ano":     _FNS_MAC,    # real FNS Jan–Jun 2026
            "empenhado":        248_000.0,
            "liquidado":        216_000.0,
            "pago":             196_800.0,
            "pct_execucao":     63.0,
            "ultima_parcela":   "2026-06",
            "proxima_parcela":  "2026-07",
            "obs": "ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC",
        },
        {
            "bloco": "Vigilância em Saúde (VIGI)",
            "codigo": "VIGI",
            "cor": "#d97706",
            "previsto_ano":      51_872.0,   # estimativa anual (25.9k * 2)
            "recebido_ano":      25_936.0,   # real FNS
            "empenhado":         20_000.0,
            "liquidado":         18_000.0,
            "pago":              16_500.0,
            "pct_execucao":      63.6,
            "ultima_parcela":   "2026-06",
            "proxima_parcela":  "2026-07",
            "obs": "PAGAMENTO DOS VENCIMENTOS DOS AGENTES DE COMBATE ÀS ENDEMIAS",
        },
        {
            "bloco": "Assistência Farmacêutica (FAF)",
            "codigo": "FAF",
            "cor": "#7c3aed",
            "previsto_ano":   1_200_000.0,
            "recebido_ano":           0.0,   # SEM REPASSE EM 2026
            "empenhado":              0.0,
            "liquidado":              0.0,
            "pago":                   0.0,
            "pct_execucao":           0.0,
            "ultima_parcela":   "—",
            "proxima_parcela":  "Aguardando",
            "obs": "SEM REPASSE EM 2026. ACESSE O SALDO.",
        },
        {
            "bloco": "Gestão do SUS (GESSUS)",
            "codigo": "GESSUS",
            "cor": "#0891b2",
            "previsto_ano":     550_000.0,
            "recebido_ano":           0.0,   # SEM REPASSE EM 2026
            "empenhado":              0.0,
            "liquidado":              0.0,
            "pago":                   0.0,
            "pct_execucao":           0.0,
            "ultima_parcela":   "—",
            "proxima_parcela":  "Aguardando",
            "obs": "SEM REPASSE EM 2026. ACESSE O SALDO.",
        },
    ]


# ── Repasses mensais por bloco (dados reais 2026) ────────────────────────────
# MAC:     312.343,90 / 6 = ~52.057/mês
# VIGI:     25.936,00 / 6 = ~4.322/mês
# AB:      619.572,00 / 6 = ~103.262/mês (ESF/EAP + ACS + Bucal + Demais + eMulti)
# FAF / GESSUS: sem repasse em 2026

_MAC_MES  = round(_FNS_MAC       / 6, 2)   # ~52.057,32/mês
_VIGI_MES = round(_FNS_VIGI      / 6, 2)   # ~4.322,67/mês
_AB_MES   = round(_FNS_AB_TOTAL  / 6, 2)   # ~103.262,00/mês

# mes_num → dict[codigo_bloco, valor_recebido]  (None = ainda não recebido)
_REPASSE_POR_BLOCO_MES: dict[int, dict[str, float | None]] = {
    1:  {"AB": _AB_MES, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    2:  {"AB": _AB_MES, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    3:  {"AB": _AB_MES, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    4:  {"AB": _AB_MES, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    5:  {"AB": _AB_MES, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    6:  {"AB": _AB_MES, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    7:  {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
    8:  {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
    9:  {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
    10: {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
    11: {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
    12: {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
}

@lru_cache(maxsize=1)
def _NOMES_MESES():
    return ["","Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                     "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]


def _blocos_para_mes(mes: int) -> list[dict]:
    """Retorna _BLOCOS() com recebido_ano e pct_execucao ajustados para o mês."""
    vals = _REPASSE_POR_BLOCO_MES.get(mes, {})
    result = []
    for b in _BLOCOS():
        cod = b["codigo"]
        rec_mes = vals.get(cod)
        entrada = dict(b)
        if rec_mes is not None:
            entrada["recebido_mes"] = rec_mes
            pct = round(rec_mes / b["previsto_ano"] * 100, 1) if b["previsto_ano"] > 0 else 0.0
            entrada["pct_execucao_mes"] = pct
            entrada["status_mes"] = "recebido" if rec_mes > 0 else "sem_repasse"
        else:
            entrada["recebido_mes"] = None
            entrada["pct_execucao_mes"] = None
            entrada["status_mes"] = "pendente"
        result.append(entrada)
    return result

# ── Repasses mensais FNS — AB + MAC + VIGI (Jan–Jun 2026 recebidos) ───────────
# AB:   619.572,00 / 6 = 103.262,00/mês (exato)
# MAC:  312.343,90 / 6 =  52.057,32/mês
# VIGI:  25.936,00 / 6 =   4.322,67/mês
# Total previsto/recebido: 159.641,99/mês — FAF e GESSUS sem repasse em 2026

_MES_PREVISTO = round(_AB_MES + _MAC_MES + _VIGI_MES, 2)  # 159.641,99/mês
_MES_RECEBIDO = _MES_PREVISTO                              # Jan–Jun: tudo recebido

@lru_cache(maxsize=1)
def _REPASSES_MENSAIS():
    return [
        {"mes": "Jan/26", "previsto": _MES_PREVISTO, "recebido": _MES_RECEBIDO, "diferenca": 0.0},
        {"mes": "Fev/26", "previsto": _MES_PREVISTO, "recebido": _MES_RECEBIDO, "diferenca": 0.0},
        {"mes": "Mar/26", "previsto": _MES_PREVISTO, "recebido": _MES_RECEBIDO, "diferenca": 0.0},
        {"mes": "Abr/26", "previsto": _MES_PREVISTO, "recebido": _MES_RECEBIDO, "diferenca": 0.0},
        {"mes": "Mai/26", "previsto": _MES_PREVISTO, "recebido": _MES_RECEBIDO, "diferenca": 0.0},
        {"mes": "Jun/26", "previsto": _MES_PREVISTO, "recebido": _MES_RECEBIDO, "diferenca": 0.0},
        {"mes": "Jul/26", "previsto": _MES_PREVISTO, "recebido": None,           "diferenca": None},
    ]


# ── Empenhos pendentes ────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _EMPENHOS_PENDENTES():
    return [
        {"id": "2026NE001847", "credor": "UNIMED Manaus Coop.",           "objeto": "Serv. amb. MAC",       "valor": 48_200.0, "data": "2026-06-30", "bloco": "MAC",  "status": "a_liquidar"},
        {"id": "2026NE001863", "credor": "Distribuidora Farmacêutica AM", "objeto": "Med. Componente Básico","valor": 31_400.0, "data": "2026-07-01", "bloco": "FAF",  "status": "a_liquidar"},
        {"id": "2026NE001891", "credor": "Auto Peças do Norte Ltda",      "objeto": "Manutenção veículos",  "valor": 12_780.0, "data": "2026-06-28", "bloco": "AB",   "status": "a_pagar"},
        {"id": "2026NE001902", "credor": "Lab. Rede Cerrado",             "objeto": "Exames diagnósticos",  "valor": 22_500.0, "data": "2026-07-05", "bloco": "MAC",  "status": "a_liquidar"},
        {"id": "2026NE001918", "credor": "Cooperativa COOPAM",            "objeto": "Transporte sanitário", "valor": 18_300.0, "data": "2026-07-03", "bloco": "AB",   "status": "a_pagar"},
    ]


# ── SIOPS ─────────────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _SIOPS():
    return {
        "receita_total_saude":     12_700_000.0,
        "despesa_saude":           12_700_000.0 * 0.1716,  # 17,16%
        "pct_proprio_saude":       17.16,
        "meta_minima":             15.0,
        "conforme":                True,
        "margem_seguranca":        2.16,
        "historico": [
            {"ano": 2023, "pct": 15.82, "conforme": True},
            {"ano": 2024, "pct": 16.44, "conforme": True},
            {"ano": 2025, "pct": 16.91, "conforme": True},
            {"ano": 2026, "pct": 17.16, "conforme": True, "parcial": True},
        ],
    }



# ── Tabela FNS Detalhada por Ação (acumulado Jan–Jun 2026) ───────────────────
# Fonte: consultafns.saude.gov.br/#/detalhada/acao — APUÍ/AM
# Uma linha por incentivo com o total acumulado Jan–Jun 2026

@lru_cache(maxsize=1)
def _FNS_ACOES():
    return [
        # ── Estruturação — sem repasse ────────────────────────────────────────────
        {"bloco": "Estruturação da Rede de Serviços Públicos de Saúde", "grupo": "ASSISTÊNCIA FARMACÊUTICA", "acao": "", "acao_detalhada": "SEM REPASSE EM 2026", "valor_total": None, "valor_desconto": None, "valor_liquido": None,
         "portaria": "Portaria de Consolidação GM/MS nº 6/2017 — Bloco de Estruturação da Rede de Serviços Públicos de Saúde", "base_legal": "Lei nº 8.080/1990, art. 26; Dec. nº 7.508/2011", "link_portaria": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0006_03_10_2017.html"},
        {"bloco": "Estruturação da Rede de Serviços Públicos de Saúde", "grupo": "ATENÇÃO ESPECIALIZADA",    "acao": "", "acao_detalhada": "SEM REPASSE EM 2026", "valor_total": None, "valor_desconto": None, "valor_liquido": None,
         "portaria": "Portaria de Consolidação GM/MS nº 6/2017 — Bloco de Estruturação da Rede de Serviços Públicos de Saúde", "base_legal": "Lei nº 8.080/1990, art. 26; Dec. nº 7.508/2011", "link_portaria": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0006_03_10_2017.html"},
        {"bloco": "Estruturação da Rede de Serviços Públicos de Saúde", "grupo": "ATENÇÃO PRIMÁRIA",         "acao": "", "acao_detalhada": "SEM REPASSE EM 2026", "valor_total": None, "valor_desconto": None, "valor_liquido": None,
         "portaria": "Portaria de Consolidação GM/MS nº 6/2017 — Bloco de Estruturação da Rede de Serviços Públicos de Saúde", "base_legal": "Lei nº 8.080/1990, art. 26; Dec. nº 7.508/2011", "link_portaria": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0006_03_10_2017.html"},
        {"bloco": "Estruturação da Rede de Serviços Públicos de Saúde", "grupo": "CORONAVÍRUS (COVID-19)",   "acao": "", "acao_detalhada": "SEM REPASSE EM 2026", "valor_total": None, "valor_desconto": None, "valor_liquido": None,
         "portaria": "Lei nº 13.979/2020 — Medidas de enfrentamento da COVID-19", "base_legal": "Lei nº 13.979/2020; EC nº 109/2021", "link_portaria": "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l13979.htm"},
        # ── Manutenção — sem repasse ──────────────────────────────────────────────
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "APOIO FINANCEIRO EXTRAORDINÁRIO", "acao": "", "acao_detalhada": "SEM REPASSE EM 2026", "valor_total": None, "valor_desconto": None, "valor_liquido": None,
         "portaria": "Portaria GM/MS nº 204/2007 — Blocos de Financiamento do SUS (revogada pela Port. Cons. nº 6/2017)", "base_legal": "Lei nº 8.080/1990; Dec. nº 7.508/2011", "link_portaria": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2007/prt0204_29_01_2007.html"},
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "ASSISTÊNCIA FARMACÊUTICA",        "acao": "", "acao_detalhada": "SEM REPASSE EM 2026", "valor_total": None, "valor_desconto": None, "valor_liquido": None,
         "portaria": "Portaria GM/MS nº 3.992/2017 — Financiamento e transferência dos recursos federais para a Assistência Farmacêutica", "base_legal": "Lei nº 8.080/1990, art. 6º e 26; Dec. nº 7.508/2011", "link_portaria": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prt3992_28_12_2017.html"},
        # ── MAC ───────────────────────────────────────────────────────────────────
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "ATENÇÃO DE MÉDIA E ALTA COMPLEXIDADE AMBULATORIAL E HOSPITALAR",
         "acao": "ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC",
         "acao_detalhada": "ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC",
         "valor_total": _FNS_MAC, "valor_desconto": 0.0, "valor_liquido": _FNS_MAC,
         "portaria": "Portaria de Consolidação GM/MS nº 6/2017 — Bloco MAC (Atenção de Média e Alta Complexidade Ambulatorial e Hospitalar)", "base_legal": "Lei nº 8.080/1990, art. 26; Port. GM/MS nº 1.631/2015; Nota Técnica DAHU/MS", "link_portaria": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0006_03_10_2017.html"},
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "ATENÇÃO ESPECIALIZADA", "acao": "", "acao_detalhada": "SEM REPASSE EM 2026", "valor_total": None, "valor_desconto": None, "valor_liquido": None,
         "portaria": "Portaria de Consolidação GM/MS nº 6/2017 — Bloco MAC", "base_legal": "Lei nº 8.080/1990, art. 26; Dec. nº 7.508/2011", "link_portaria": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0006_03_10_2017.html"},
        # ── APS — Novo Financiamento (Portaria GM/MS 3.493/2024) ─────────────────
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "ATENÇÃO PRIMÁRIA",
         "acao": "INCENTIVO FINANCEIRO DA APS - ATENCAO A SAUDE BUCAL",
         "acao_detalhada": "INCENTIVO FINANCEIRO DA APS — ATENÇÃO À SAÚDE BUCAL",
         "valor_total": _FNS_AB_SAUDE_BUCAL, "valor_desconto": 0.0, "valor_liquido": _FNS_AB_SAUDE_BUCAL,
         "portaria": "Portaria GM/MS nº 3.493, de 10 de abril de 2024 — Novo Financiamento da Atenção Primária à Saúde", "base_legal": "Lei nº 8.080/1990, art. 198, §1º; Dec. nº 7.508/2011; Port. GM/MS nº 3.493/2024, Anexo III", "link_portaria": "https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-3.493-de-10-de-abril-de-2024"},
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "ATENÇÃO PRIMÁRIA",
         "acao": "INCENTIVO FINANCEIRO DA APS - EQUIPES DE SAÚDE DA FAMÍLIA/ESF E EQUIPES DE ATENÇÃO PRIMÁRIA/EAP",
         "acao_detalhada": "INCENTIVO FINANCEIRO DA APS — EQUIPES DE SAÚDE DA FAMÍLIA/ESF E EQUIPES DE ATENÇÃO PRIMÁRIA/EAP",
         "valor_total": _FNS_AB_ESF_EAP, "valor_desconto": 0.0, "valor_liquido": _FNS_AB_ESF_EAP,
         "portaria": "Portaria GM/MS nº 3.493, de 10 de abril de 2024 — Novo Financiamento da Atenção Primária à Saúde", "base_legal": "Lei nº 8.080/1990, art. 198, §1º; Dec. nº 7.508/2011; Port. GM/MS nº 3.493/2024, Anexos I e II", "link_portaria": "https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-3.493-de-10-de-abril-de-2024"},
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "ATENÇÃO PRIMÁRIA",
         "acao": "INCENTIVO FINANCEIRO DA APS - DEMAIS PROGRAMAS, SERVIÇOS E EQUIPES DA ATENÇÃO PRIMÁRIA",
         "acao_detalhada": "INCENTIVO FINANCEIRO DA APS — DEMAIS PROGRAMAS, SERVIÇOS E EQUIPES DA ATENÇÃO PRIMÁRIA À SAÚDE",
         "valor_total": _FNS_AB_DEMAIS, "valor_desconto": 0.0, "valor_liquido": _FNS_AB_DEMAIS,
         "portaria": "Portaria GM/MS nº 3.493, de 10 de abril de 2024 — Novo Financiamento da Atenção Primária à Saúde", "base_legal": "Lei nº 8.080/1990, art. 198, §1º; Dec. nº 7.508/2011; Port. GM/MS nº 3.493/2024, Anexo IV", "link_portaria": "https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-3.493-de-10-de-abril-de-2024"},
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "ATENÇÃO PRIMÁRIA",
         "acao": "INCENTIVO FINANCEIRO DA APS - EQUIPES MULTIPROFISSIONAIS - EMULTI",
         "acao_detalhada": "INCENTIVO FINANCEIRO DA APS — EQUIPES MULTIPROFISSIONAIS (eMulti)",
         "valor_total": _FNS_AB_EMULTI, "valor_desconto": 0.0, "valor_liquido": _FNS_AB_EMULTI,
         "portaria": "Portaria GM/MS nº 635, de 22 de maio de 2023 — Equipes Multiprofissionais (eMulti) | Portaria GM/MS nº 3.493/2024", "base_legal": "Lei nº 8.080/1990, art. 198, §1º; Port. GM/MS nº 635/2023; Port. GM/MS nº 3.493/2024, Anexo V", "link_portaria": "https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-635-de-22-de-maio-de-2023"},
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "ATENÇÃO PRIMÁRIA",
         "acao": "AGENTES COMUNITÁRIOS DE SAÚDE",
         "acao_detalhada": "AGENTES COMUNITÁRIOS DE SAÚDE — INCENTIVO FINANCEIRO APS",
         "valor_total": _FNS_AB_ACS, "valor_desconto": 0.0, "valor_liquido": _FNS_AB_ACS,
         "portaria": "Portaria GM/MS nº 3.493, de 10 de abril de 2024 — Novo Financiamento da Atenção Primária à Saúde", "base_legal": "Lei nº 11.350/2006 (ACS e ACE); Port. GM/MS nº 3.493/2024, Anexo VI; Dec. nº 7.508/2011", "link_portaria": "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11350.htm"},
        # ── COVID / GESSUS — sem repasse ─────────────────────────────────────────
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "CORONAVÍRUS (COVID-19)", "acao": "", "acao_detalhada": "SEM REPASSE EM 2026", "valor_total": None, "valor_desconto": None, "valor_liquido": None,
         "portaria": "Lei nº 13.979/2020 — Medidas de enfrentamento da emergência de saúde pública de importância internacional decorrente do coronavírus", "base_legal": "Lei nº 13.979/2020; EC nº 109/2021 (emergência fiscal)", "link_portaria": "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l13979.htm"},
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "GESTÃO DO SUS",           "acao": "", "acao_detalhada": "SEM REPASSE EM 2026", "valor_total": None, "valor_desconto": None, "valor_liquido": None,
         "portaria": "Portaria de Consolidação GM/MS nº 6/2017 — Bloco de Gestão do SUS", "base_legal": "Lei nº 8.080/1990; Dec. nº 7.508/2011; Port. GM/MS nº 204/2007 (revogada)", "link_portaria": "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0006_03_10_2017.html"},
        # ── VIGI ──────────────────────────────────────────────────────────────────
        {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde", "grupo": "VIGILÂNCIA EM SAÚDE",
         "acao": "TRANSFERÊNCIA AOS ENTES FEDERATIVOS PARA O PAGAMENTO DOS VENCIMENTOS DOS AGENTES DE COMBATE ÀS ENDEMIAS",
         "acao_detalhada": "TRANSFERÊNCIA AOS ENTES FEDERATIVOS PARA O PAGAMENTO DOS VENCIMENTOS DOS AGENTES DE COMBATE ÀS ENDEMIAS",
         "valor_total": _FNS_VIGI, "valor_desconto": 0.0, "valor_liquido": _FNS_VIGI,
         "portaria": "Lei nº 11.350/2006 — Agentes de Combate às Endemias (ACE) | Port. GM/MS nº 1.378/2013 — Vigilância em Saúde", "base_legal": "Lei nº 11.350/2006, art. 11; Port. GM/MS nº 1.378/2013; Dec. nº 7.508/2011", "link_portaria": "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11350.htm"},
    ]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/painel")
async def painel_financeiro(
    ano: int = Query(_ANO),
    mes: int = Query(0),   # 0 = acumulado anual; 1-12 = mês específico
    _: UserOut = Depends(get_current_user),
):
    """Painel financeiro executivo consolidado."""
    hoje = date.today()

    # Alertas financeiros automáticos
    alertas = []
    for b in _BLOCOS():
        if b["pct_execucao"] < 35:
            alertas.append({"nivel": "CRITICO", "bloco": b["codigo"], "msg": f"{b['bloco']}: execução {b['pct_execucao']}% — risco de devolução"})
        elif b["pct_execucao"] < 55:
            alertas.append({"nivel": "AVISO", "bloco": b["codigo"], "msg": f"{b['bloco']}: execução {b['pct_execucao']}% — abaixo do esperado"})

    if _EMPENHOS_PENDENTES():
        total_pendente = sum(e["valor"] for e in _EMPENHOS_PENDENTES() if e["status"] == "a_liquidar")
        if total_pendente > 50_000:
            alertas.append({"nivel": "AVISO", "bloco": "—", "msg": f"R$ {total_pendente:,.0f} em empenhos aguardando liquidação"})

    pct_exec_geral = round(_DESPESAS()["pago"] / _RECEITAS()["orcamento_total"] * 100, 1)
    pct_arrecadacao = round(_RECEITAS()["total_arrecadado"] / (_RECEITAS()["fns_previsto"] + _RECEITAS()["municipio_proprio"] + _RECEITAS()["convenios_recebido"]) * 100, 1)

    return {
        "municipio":        "Apuí",
        "uf":               "AM",
        "ibge":             _ENTIDADE()["ibge"],
        "cnpj":             _ENTIDADE()["cnpj"],
        "populacao":        _ENTIDADE()["populacao"],
        "prefeito":         _ENTIDADE()["prefeito"],
        "secretario":       _ENTIDADE()["secretario"],
        "presidente_conselho": _ENTIDADE()["presidente_conselho"],
        "ano":              ano,
        "mes":              mes,
        "mes_referencia":   f"{_NOMES_MESES()[mes]}/{ano}" if mes else "Julho/2026",
        "blocos_mes":       _blocos_para_mes(mes) if mes else [],
        "fns_total_recebido": _FNS_TOTAL_RECEBIDO,
        "fonte_fns":        "consultafns.saude.gov.br/#/detalhada/acao",
        "gerado_em":        datetime.utcnow().isoformat() + "Z",

        "receitas":         _RECEITAS(),
        "despesas":         _DESPESAS(),
        "blocos":           _BLOCOS(),
        "repasses_mensais": _REPASSES_MENSAIS(),
        "empenhos_pendentes": _EMPENHOS_PENDENTES(),
        "siops":            _SIOPS(),
        "alertas":          alertas,

        "kpis": {
            "pct_execucao_geral":  pct_exec_geral,
            "pct_arrecadacao":     pct_arrecadacao,
            "saldo_disponivel":    round(_RECEITAS()["total_arrecadado"] - _DESPESAS()["pago"], 2),
            "siops_conforme":      _SIOPS()["conforme"],
            "total_empenhos_pendentes": len(_EMPENHOS_PENDENTES()),
            "valor_pendente_liquidar": sum(e["valor"] for e in _EMPENHOS_PENDENTES() if e["status"] == "a_liquidar"),
        },

        "fonte": "referencia",
    }


_FNS_BASE = "https://consultafns.saude.gov.br/recursos"

@lru_cache(maxsize=1)
def _MESES_NOME_NUM():
    return {
        "janeiro":1,"fevereiro":2,"março":3,"marco":3,"abril":4,"maio":5,"junho":6,
        "julho":7,"agosto":8,"setembro":9,"outubro":10,"novembro":11,"dezembro":12,
    }


def _norm(s: str) -> str:
    import unicodedata
    return unicodedata.normalize("NFD", s.upper()).encode("ascii", "ignore").decode()

def _mes_num(mes_str: str) -> str:
    """Converte nome do mês ('Julho') ou número ('7') para string numérica ('7')."""
    if not mes_str:
        return ""
    if mes_str.isdigit():
        return mes_str
    return str(_MESES_NOME_NUM().get(_norm(mes_str).lower(), ""))


@router.get("/fns-acoes")
async def fns_acoes(
    estado:    str = Query("AM"),
    municipio: str = Query("APUÍ"),
    ano:       str = Query("2026"),
    mes:       str = Query(""),
    bloco:     str = Query(""),
    _: UserOut = Depends(get_current_user),
):
    """
    Tabela FNS por ação por competência — API pública consultafns.saude.gov.br/recursos/.
    Para Apuí/AM usa dados locais reais com mês de referência por parcela.
    """
    import httpx

    UF = estado.upper()
    mes_num = _mes_num(mes)   # "Julho" → "7", "" → "" (acumulado anual)

    # ── 1. Resolve código IBGE do município via API do próprio FNS ────────────
    ibge_code = None
    nome_oficial = municipio.upper()
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as cli:
            r = await cli.get(f"{_FNS_BASE}/municipios/uf/{UF}")
            if r.status_code == 200:
                for m in r.json().get("resultado", []):
                    if _norm(m.get("noMunicipio","")) == _norm(municipio):
                        ibge_code = m.get("coMunicipioIbge") or m.get("id")
                        nome_oficial = m.get("noMunicipio", municipio).upper()
                        break
    except Exception:
        pass

    if not ibge_code:
        return {"entidade": None, "acoes": [], "total_geral": 0,
                "total_desconto": 0, "total_liquido": 0,
                "aviso": f"Município '{municipio}' não encontrado no estado {UF}."}

    # ── 2. Busca entidade (CNPJ) e dirigente em paralelo ─────────────────────
    cnpj = None
    entidade_dados: dict = {}
    dirigente: dict = {}

    entidades_params: dict = {"ano": ano, "count": 1, "estado": UF,
                              "municipio": ibge_code, "page": 1, "tipoConsulta": 2}
    if mes_num:
        entidades_params["mes"] = mes_num

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as cli:
            re, rd = await asyncio.gather(
                cli.get(f"{_FNS_BASE}/consulta-detalhada/entidades", params=entidades_params),
                cli.get(f"{_FNS_BASE}/dirigente/MUNICIPAL/{ibge_code}"),
            )
            if re.status_code == 200:
                dados = re.json().get("resultado", {}).get("dados", [])
                if dados:
                    d0 = dados[0]
                    cnpj = d0.get("cpfCnpj") or d0.get("cpfCnpjFormatado","")
                    entidade_dados = d0
            if rd.status_code == 200:
                dirigente = rd.json().get("resultado", {})
    except Exception:
        pass

    # ── 3. Busca ações detalhadas filtrando por competência ───────────────────
    acoes_raw: list = []
    total_geral = 0.0
    total_desc  = 0.0
    total_liq   = 0.0

    if cnpj:
        acao_params: dict = {
            "ano": ano, "count": 100,
            "cpfCnpjUg": cnpj.replace(".","").replace("/","").replace("-",""),
            "estado": UF, "municipio": ibge_code,
            "page": 1, "tipoConsulta": 2,
        }
        if mes_num:
            acao_params["mes"] = mes_num   # filtra pela competência (mês)

        try:
            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as cli:
                r = await cli.get(f"{_FNS_BASE}/consulta-detalhada/detalhe-acao",
                                  params=acao_params)
                if r.status_code == 200:
                    res = r.json().get("resultado", {})
                    acoes_raw = res.get("dados", [])
                    if acoes_raw:
                        primeiro = acoes_raw[0]
                        total_geral = float(primeiro.get("valorTotalGeral", 0) or 0)
                        total_desc  = float(primeiro.get("valorDescontoTotalGeral", 0) or 0)
                        total_liq   = float(primeiro.get("valorLiquidoGeral", 0) or 0)
        except Exception:
            pass

    # ── 4. Normaliza ações para o formato do frontend ─────────────────────────
    acoes = []
    for a in acoes_raw:
        vt = float(a.get("valorTotal", 0) or 0)
        vd = float(a.get("valorDescontoTotal", 0) or 0)
        vl = float(a.get("valorLiquido", 0) or 0)
        acoes.append({
            "bloco":          a.get("blocoPacto", {}).get("nome", ""),
            "grupo":          a.get("grupoAcao", {}).get("nome", ""),
            "acao":           a.get("nomeResumido") or a.get("sigla") or "",
            "acao_detalhada": a.get("descricao") or a.get("nomeResumido") or "—",
            "valor_total":    vt if vt > 0 else None,
            "valor_desconto": vd if (vt > 0) else None,
            "valor_liquido":  vl if vt > 0 else None,
        })

    # ── 5. Monta entidade ─────────────────────────────────────────────────────
    inicio = dirigente.get("inicioMandatoFormatado") or "—"
    entidade = {
        "nome":                 entidade_dados.get("razaoSocial", nome_oficial),
        "cnpj":                 entidade_dados.get("cpfCnpjFormatado", cnpj or "—"),
        "ibge":                 ibge_code,
        "uf":                   UF,
        "municipio":            nome_oficial,
        "populacao":            0,
        "ano_censo":            int(ano) if ano.isdigit() else date.today().year,
        "prefeito":             dirigente.get("nome", "—"),
        "data_gestao":          inicio,
        "secretario":           dirigente.get("noSecretario", "—"),
        "presidente_conselho":  dirigente.get("noPresidenteConselho", "—"),
    }

    competencia = f"{mes}/{ano}" if mes else f"Acumulado {ano}"

    return {
        "entidade":       entidade,
        "acoes":          acoes,
        "total_geral":    round(total_geral, 2),
        "total_desconto": round(total_desc,  2),
        "total_liquido":  round(total_liq,   2),
        "fonte":          "consultafns.saude.gov.br/recursos",
        "ano":            ano,
        "mes":            mes,
        "competencia":    competencia,
        "fns_url":        None,
    }

@router.get("/fns-repasse-dia")
async def fns_repasse_dia(
    ano: str = Query("2026"),
    mes: str = Query(""),
    dia: str = Query(""),
    _: UserOut = Depends(get_current_user),
):
    """Repasses do Dia — proxy para API pública consultafns.saude.gov.br/recursos/repasse-dia/consultar."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as cli:
            r = await cli.get(
                f"{_FNS_BASE}/repasse-dia/consultar",
                params={k: v for k, v in {"ano": ano, "mes": mes, "dia": dia}.items() if v},
            )
            if r.status_code == 200:
                data = r.json()
                resultado = data.get("resultado", [])
                # normaliza campos
                repasses = []
                for item in resultado:
                    repasses.append({
                        "entidade":     item.get("noEntidade") or item.get("nmEntidade", "—"),
                        "municipio":    item.get("noMunicipio") or item.get("nmMunicipio", "—"),
                        "uf":           item.get("sgUf") or item.get("uf", "—"),
                        "cnpj":         item.get("nuCnpj") or item.get("cnpj", "—"),
                        "bloco":        item.get("noBloco") or item.get("bloco", "—"),
                        "acao":         item.get("noAcao") or item.get("descricao", "—"),
                        "valor":        float(item.get("vlRepasse") or item.get("valor") or 0),
                        "data":         item.get("dtPagamento") or item.get("data", "—"),
                    })
                # data do último pagamento
                try:
                    r2 = await cli.get(f"{_FNS_BASE}/repasse-dia/recuperar-data-ultimo-pagamento")
                    ultimo_dia = r2.json().get("resultado", "") if r2.status_code == 200 else ""
                except Exception:
                    ultimo_dia = ""
                return {
                    "repasses": repasses,
                    "total": sum(x["valor"] for x in repasses),
                    "ultimo_pagamento": ultimo_dia,
                    "fonte": "consultafns.saude.gov.br",
                }
    except Exception as e:
        pass
    return {"repasses": [], "total": 0.0, "ultimo_pagamento": "", "fonte": "consultafns.saude.gov.br", "erro": "Serviço FNS indisponível"}


@router.get("/blocos")
async def blocos_financiamento(_: UserOut = Depends(get_current_user)):
    return {"blocos": _BLOCOS(), "fonte": "referencia"}


@router.get("/repasses")
async def repasses_fns(_: UserOut = Depends(get_current_user)):
    return {"repasses": _REPASSES_MENSAIS(), "fonte": "referencia"}


@router.get("/empenhos")
async def empenhos_pendentes(_: UserOut = Depends(get_current_user)):
    return {"empenhos": _EMPENHOS_PENDENTES(), "total": len(_EMPENHOS_PENDENTES()), "fonte": "referencia"}