"""Router: /api/folha — Folha de Pagamento SMS Apuí/AM"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/folha", tags=["Folha de Pagamento"])

# ── Tabela de salários-base por cargo (PCCS referência SMS Apuí) ──────────────
SALARIO_BASE: dict[str, float] = {
    "Médico Clínico Geral":         14_800.00,
    "Médico ESF":                   14_800.00,
    "Médico de Família e Comunidade":14_800.00,
    "Enfermeiro":                    5_200.00,
    "Enfermeiro ESF":                5_200.00,
    "Cirurgião Dentista":            5_800.00,
    "Técnico de Enfermagem":         2_400.00,
    "Técnico em Saúde Bucal":        2_200.00,
    "Agente Comunitário de Saúde":   2_640.00,
    "Agente de Combate a Endemias":  2_640.00,
    "Farmacêutico":                  4_800.00,
    "Fisioterapeuta":                3_600.00,
    "Psicólogo":                     3_800.00,
    "Nutricionista":                 3_600.00,
    "Assistente Social":             3_200.00,
    "Auxiliar Administrativo":       1_800.00,
    "Motorista":                     2_000.00,
}

# ── Adicional de interioridade / insalubridade por vínculo ────────────────────
ADICIONAL_PCT: dict[str, float] = {
    "estatutario":  0.20,   # 20% adicional estabilidade
    "temporario":   0.00,
    "clt":          0.00,
    "terceirizado": 0.00,
    "comissionado": 0.10,
}

# ── Fonte de pagamento: descrição e sigla contábil ────────────────────────────
FONTE_INFO: dict[str, dict] = {
    "esf":                  {"label": "Recursos MS — ESF (Capitação)",          "fonte_contabil": "242.4",  "ordem": 1, "grupo": "MS"},
    "pab_fixo":             {"label": "Recursos MS — PAB Fixo",                 "fonte_contabil": "242.2",  "ordem": 2, "grupo": "MS"},
    "saude_bucal":          {"label": "Recursos MS — Saúde Bucal",              "fonte_contabil": "242.5",  "ordem": 3, "grupo": "MS"},
    "agentes_comunitarios": {"label": "Recursos MS — PACS/ACS",                 "fonte_contabil": "242.3",  "ordem": 4, "grupo": "MS"},
    "pmmb":                 {"label": "Recursos MS — Médicos pelo Brasil",       "fonte_contabil": "242.7",  "ordem": 5, "grupo": "MS"},
    "emulti":               {"label": "Recursos MS — eMulti",                   "fonte_contabil": "242.8",  "ordem": 6, "grupo": "MS"},
    "mac":                  {"label": "Recursos MS — Média/Alta Complexidade",   "fonte_contabil": "242.9",  "ordem": 7, "grupo": "MS"},
    "vigilancia":           {"label": "Recursos MS — Vigilância em Saúde",      "fonte_contabil": "243.1",  "ordem": 8, "grupo": "MS"},
    "caps":                 {"label": "Recursos MS — CAPS/RAPS",                "fonte_contabil": "244.1",  "ordem": 9, "grupo": "MS"},
    "recurso_proprio":      {"label": "Recurso Próprio Municipal",              "fonte_contabil": "001.0",  "ordem":10, "grupo": "MUNICIPAL"},
    "tesouro_estadual":     {"label": "Tesouro Estadual (SES-AM)",              "fonte_contabil": "100.0",  "ordem":11, "grupo": "ESTADUAL"},
    "contrato_terceiro":    {"label": "Recurso Próprio — Terceirizado/OS",      "fonte_contabil": "001.1",  "ordem":12, "grupo": "MUNICIPAL"},
}

# ── Encargos patronais por vínculo ────────────────────────────────────────────
ENCARGOS: dict[str, dict] = {
    "estatutario":  {"inss_patronal": 0.14,  "fgts": 0.00,  "ferias_encargo": 0.1167, "decimo_terceiro": 0.0833},
    "temporario":   {"inss_patronal": 0.14,  "fgts": 0.08,  "ferias_encargo": 0.1167, "decimo_terceiro": 0.0833},
    "clt":          {"inss_patronal": 0.20,  "fgts": 0.08,  "ferias_encargo": 0.1167, "decimo_terceiro": 0.0833},
    "terceirizado": {"inss_patronal": 0.00,  "fgts": 0.00,  "ferias_encargo": 0.00,   "decimo_terceiro": 0.00},
    "comissionado": {"inss_patronal": 0.14,  "fgts": 0.00,  "ferias_encargo": 0.00,   "decimo_terceiro": 0.0833},
}

# ── Descontos legais (IRRF faixa simplificada / INSS segurado) ────────────────
def calc_inss_segurado(bruto: float) -> float:
    if bruto <= 1_412.00:   return bruto * 0.075
    if bruto <= 2_666.68:   return bruto * 0.09
    if bruto <= 4_000.03:   return bruto * 0.12
    if bruto <= 7_786.02:   return bruto * 0.14
    return 908.86  # teto INSS 2026

def calc_irrf(base: float) -> float:
    if base <= 2_259.20:    return 0.00
    if base <= 2_826.65:    return base * 0.075 - 169.44
    if base <= 3_751.05:    return base * 0.15  - 381.44
    if base <= 4_664.68:    return base * 0.225 - 662.77
    return base * 0.275 - 896.00

# ── Quadro de servidores (ampliado com salários reais) ────────────────────────
SERVIDORES = [
    # ─ ESF / Capitação Ponderada ─
    {"id":  1, "matricula":"SMS-001", "nome":"Dr. Paulo Henrique Costa",      "cargo":"Médico Clínico Geral",          "vinculo":"estatutario",  "ch":40, "unidade":"UBS Irmã Elizabete",                      "equipe":"CACHOEIRA",    "fonte":"pab_fixo",            "admissao":"2018-03-01"},
    {"id":  2, "matricula":"SMS-002", "nome":"Enf. Ana Clara Souza",          "cargo":"Enfermeiro ESF",                "vinculo":"estatutario",  "ch":40, "unidade":"UBS Irmã Elizabete",                      "equipe":"CACHOEIRA",    "fonte":"esf",                 "admissao":"2019-06-01"},
    {"id":  3, "matricula":"SMS-003", "nome":"Dr. Marcos Figueiredo",         "cargo":"Médico ESF",                    "vinculo":"temporario",   "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"SÃO SEBASTIÃO","fonte":"esf",                 "admissao":"2024-01-15"},
    {"id":  4, "matricula":"SMS-004", "nome":"Enf. Rita de Cássia Lima",      "cargo":"Enfermeiro ESF",                "vinculo":"estatutario",  "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"SÃO SEBASTIÃO","fonte":"esf",                 "admissao":"2020-02-01"},
    {"id":  5, "matricula":"SMS-005", "nome":"Dr. Raimundo Nonato Ferreira",  "cargo":"Médico ESF",                    "vinculo":"temporario",   "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"ACARI",        "fonte":"esf",                 "admissao":"2025-03-01"},
    {"id":  6, "matricula":"SMS-006", "nome":"Enf. Francisca Nunes Pereira",  "cargo":"Enfermeiro ESF",                "vinculo":"estatutario",  "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"ACARI",        "fonte":"esf",                 "admissao":"2021-08-01"},
    {"id":  7, "matricula":"SMS-007", "nome":"Dr. Manoel Oliveira Júnior",    "cargo":"Médico ESF",                    "vinculo":"temporario",   "ch":40, "unidade":"UBS Osvaldo Lemes Cabral",                "equipe":"TRÊS ESTADOS", "fonte":"esf",                 "admissao":"2025-01-10"},
    {"id":  8, "matricula":"SMS-008", "nome":"Enf. Cláudia Lima Figueiredo",  "cargo":"Enfermeiro ESF",                "vinculo":"estatutario",  "ch":40, "unidade":"UBS Osvaldo Lemes Cabral",                "equipe":"TRÊS ESTADOS", "fonte":"esf",                 "admissao":"2019-11-01"},
    {"id":  9, "matricula":"SMS-009", "nome":"Dra. Patrícia Carvalho Matos",  "cargo":"Médico de Família e Comunidade","vinculo":"temporario",   "ch":40, "unidade":"Centro de Saúde Curumim",                 "equipe":"JUMA",         "fonte":"esf",                 "admissao":"2024-06-01"},
    {"id": 10, "matricula":"SMS-010", "nome":"Enf. Wagner Pinheiro Sousa",    "cargo":"Enfermeiro ESF",                "vinculo":"estatutario",  "ch":40, "unidade":"Centro de Saúde Curumim",                 "equipe":"JUMA",         "fonte":"esf",                 "admissao":"2020-09-01"},
    {"id": 11, "matricula":"SMS-011", "nome":"Dr. Anderson Lima",             "cargo":"Médico de Família e Comunidade","vinculo":"temporario",   "ch":40, "unidade":"Centro de Saúde Curumim",                 "equipe":"LIBERDADE",    "fonte":"esf",                 "admissao":"2023-07-01"},
    {"id": 12, "matricula":"SMS-012", "nome":"Enf. Juliana Neves",            "cargo":"Enfermeiro ESF",                "vinculo":"estatutario",  "ch":40, "unidade":"Centro de Saúde Curumim",                 "equipe":"LIBERDADE",    "fonte":"esf",                 "admissao":"2022-02-01"},
    {"id": 13, "matricula":"SMS-013", "nome":"Dra. Fernanda Costa",           "cargo":"Médico de Família e Comunidade","vinculo":"estatutario",  "ch":40, "unidade":"UBS Padre Faliero Bonci",                 "equipe":"KENNEDY",      "fonte":"esf",                 "admissao":"2017-04-01"},
    {"id": 14, "matricula":"SMS-014", "nome":"Enf. Rodrigo Melo",             "cargo":"Enfermeiro ESF",                "vinculo":"estatutario",  "ch":40, "unidade":"UBS Padre Faliero Bonci",                 "equipe":"KENNEDY",      "fonte":"esf",                 "admissao":"2018-10-01"},
    {"id": 15, "matricula":"SMS-015", "nome":"Dr. Edilson Paiva",             "cargo":"Médico ESF",                    "vinculo":"temporario",   "ch":40, "unidade":"UBS JK",                                  "equipe":"JK",           "fonte":"esf",                 "admissao":"2025-05-01"},
    {"id": 16, "matricula":"SMS-016", "nome":"Enf. Vanessa Monteiro",         "cargo":"Enfermeiro ESF",                "vinculo":"estatutario",  "ch":40, "unidade":"UBS JK",                                  "equipe":"JK",           "fonte":"esf",                 "admissao":"2021-03-01"},
    {"id": 17, "matricula":"SMS-017", "nome":"Enf. Claudiane Rocha",          "cargo":"Enfermeiro ESF",                "vinculo":"estatutario",  "ch":40, "unidade":"UBS Claudia Pereira dos Santos Damacena", "equipe":"ESTRADA NOVA",  "fonte":"esf",                 "admissao":"2020-05-01"},
    # ─ Técnicos de Enfermagem ESF ─
    {"id": 18, "matricula":"SMS-018", "nome":"Téc. José da Silva",            "cargo":"Técnico de Enfermagem",         "vinculo":"estatutario",  "ch":40, "unidade":"UBS Irmã Elizabete",                      "equipe":"CACHOEIRA",    "fonte":"esf",                 "admissao":"2016-09-01"},
    {"id": 19, "matricula":"SMS-019", "nome":"Téc. Antônia Rocha Barbosa",    "cargo":"Técnico de Enfermagem",         "vinculo":"estatutario",  "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"SÃO SEBASTIÃO","fonte":"esf",                 "admissao":"2017-04-01"},
    {"id": 20, "matricula":"SMS-020", "nome":"Téc. Joana Pereira Teixeira",   "cargo":"Técnico de Enfermagem",         "vinculo":"estatutario",  "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"ACARI",        "fonte":"esf",                 "admissao":"2018-08-01"},
    {"id": 21, "matricula":"SMS-021", "nome":"Téc. Sandro Freitas Moura",     "cargo":"Técnico de Enfermagem",         "vinculo":"estatutario",  "ch":40, "unidade":"UBS Osvaldo Lemes Cabral",                "equipe":"TRÊS ESTADOS", "fonte":"esf",                 "admissao":"2019-02-01"},
    {"id": 22, "matricula":"SMS-022", "nome":"Téc. Rosimeire Tavares Cruz",   "cargo":"Técnico de Enfermagem",         "vinculo":"estatutario",  "ch":40, "unidade":"Centro de Saúde Curumim",                 "equipe":"JUMA",         "fonte":"esf",                 "admissao":"2020-07-01"},
    {"id": 23, "matricula":"SMS-023", "nome":"Téc. Sandra Vieira",            "cargo":"Técnico de Enfermagem",         "vinculo":"estatutario",  "ch":40, "unidade":"UBS Padre Faliero Bonci",                 "equipe":"KENNEDY",      "fonte":"esf",                 "admissao":"2021-01-01"},
    {"id": 24, "matricula":"SMS-024", "nome":"Téc. Cleide Santos",            "cargo":"Técnico de Enfermagem",         "vinculo":"estatutario",  "ch":40, "unidade":"UBS JK",                                  "equipe":"JK",           "fonte":"esf",                 "admissao":"2019-06-01"},
    {"id": 25, "matricula":"SMS-025", "nome":"Téc. Antônio Pereira",          "cargo":"Técnico de Enfermagem",         "vinculo":"temporario",   "ch":40, "unidade":"UBS Claudia Pereira dos Santos Damacena", "equipe":"ESTRADA NOVA",  "fonte":"esf",                 "admissao":"2023-11-01"},
    # ─ Agentes Comunitários de Saúde ─
    {"id": 26, "matricula":"SMS-026", "nome":"ACS Marcos Antônio Lima",       "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Irmã Elizabete",                      "equipe":"CACHOEIRA",    "fonte":"agentes_comunitarios","admissao":"2015-04-01"},
    {"id": 27, "matricula":"SMS-027", "nome":"ACS Lúcia Aparecida Souza",     "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Irmã Elizabete",                      "equipe":"CACHOEIRA",    "fonte":"agentes_comunitarios","admissao":"2015-04-01"},
    {"id": 28, "matricula":"SMS-028", "nome":"ACS Francisco das Chagas",      "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Irmã Elizabete",                      "equipe":"CACHOEIRA",    "fonte":"agentes_comunitarios","admissao":"2016-08-01"},
    {"id": 29, "matricula":"SMS-029", "nome":"ACS Paulo César Mendes",        "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"SÃO SEBASTIÃO","fonte":"agentes_comunitarios","admissao":"2016-03-01"},
    {"id": 30, "matricula":"SMS-030", "nome":"ACS Rosária Bezerra Santos",    "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"SÃO SEBASTIÃO","fonte":"agentes_comunitarios","admissao":"2017-05-01"},
    {"id": 31, "matricula":"SMS-031", "nome":"ACS Benedita dos Santos Lima",  "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"ACARI",        "fonte":"agentes_comunitarios","admissao":"2015-09-01"},
    {"id": 32, "matricula":"SMS-032", "nome":"ACS Edilson Freire Cardoso",    "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"ACARI",        "fonte":"agentes_comunitarios","admissao":"2016-11-01"},
    {"id": 33, "matricula":"SMS-033", "nome":"ACS Terezinha Barbosa Nunes",   "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Osvaldo Lemes Cabral",                "equipe":"TRÊS ESTADOS", "fonte":"agentes_comunitarios","admissao":"2015-06-01"},
    {"id": 34, "matricula":"SMS-034", "nome":"ACS Gilmar Pinheiro Ramos",     "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Osvaldo Lemes Cabral",                "equipe":"TRÊS ESTADOS", "fonte":"agentes_comunitarios","admissao":"2016-04-01"},
    {"id": 35, "matricula":"SMS-035", "nome":"ACS Gilberto Nascimento Dias",  "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"Centro de Saúde Curumim",                 "equipe":"JUMA",         "fonte":"agentes_comunitarios","admissao":"2017-02-01"},
    {"id": 36, "matricula":"SMS-036", "nome":"ACS Conceição Nunes",           "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Padre Faliero Bonci",                 "equipe":"KENNEDY",      "fonte":"agentes_comunitarios","admissao":"2015-10-01"},
    {"id": 37, "matricula":"SMS-037", "nome":"ACS Francisco Lima",            "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Padre Faliero Bonci",                 "equipe":"KENNEDY",      "fonte":"agentes_comunitarios","admissao":"2016-02-01"},
    {"id": 38, "matricula":"SMS-038", "nome":"ACS Lindomar Feitosa",          "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS JK",                                  "equipe":"JK",           "fonte":"agentes_comunitarios","admissao":"2015-07-01"},
    {"id": 39, "matricula":"SMS-039", "nome":"ACS Luzia Ferreira",            "cargo":"Agente Comunitário de Saúde",   "vinculo":"estatutario",  "ch":40, "unidade":"UBS Claudia Pereira dos Santos Damacena", "equipe":"ESTRADA NOVA",  "fonte":"agentes_comunitarios","admissao":"2016-09-01"},
    # ─ Saúde Bucal ─
    {"id": 40, "matricula":"SMS-040", "nome":"CD. Juliana Torres",            "cargo":"Cirurgião Dentista",            "vinculo":"estatutario",  "ch":40, "unidade":"UBS Irmã Elizabete",                      "equipe":"ESB I",        "fonte":"saude_bucal",         "admissao":"2017-09-01"},
    {"id": 41, "matricula":"SMS-041", "nome":"CD. Marcos Vinicius Almeida",   "cargo":"Cirurgião Dentista",            "vinculo":"temporario",   "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"ESB II",       "fonte":"saude_bucal",         "admissao":"2024-03-01"},
    {"id": 42, "matricula":"SMS-042", "nome":"TSB Ana Beatriz Santos",        "cargo":"Técnico em Saúde Bucal",        "vinculo":"estatutario",  "ch":40, "unidade":"UBS Irmã Elizabete",                      "equipe":"ESB I",        "fonte":"saude_bucal",         "admissao":"2020-11-01"},
    {"id": 43, "matricula":"SMS-043", "nome":"TSB Carlos Eduardo Silva",      "cargo":"Técnico em Saúde Bucal",        "vinculo":"estatutario",  "ch":40, "unidade":"UBS Anizio Ferreira da Silva",            "equipe":"ESB II",       "fonte":"saude_bucal",         "admissao":"2021-06-01"},
    # ─ Farmácia / Assistência Farmacêutica ─
    {"id": 44, "matricula":"SMS-044", "nome":"Farm. Carla Dias",              "cargo":"Farmacêutico",                  "vinculo":"clt",          "ch":40, "unidade":"Farmácia Central",                         "equipe":"—",            "fonte":"recurso_proprio",     "admissao":"2021-05-10"},
    {"id": 45, "matricula":"SMS-045", "nome":"Farm. Diego Carvalho",          "cargo":"Farmacêutico",                  "vinculo":"estatutario",  "ch":40, "unidade":"Farmácia Central",                         "equipe":"—",            "fonte":"recurso_proprio",     "admissao":"2018-07-01"},
    # ─ eMulti ─
    {"id": 46, "matricula":"SMS-046", "nome":"Fisio. Roberto Alves",          "cargo":"Fisioterapeuta",                "vinculo":"terceirizado", "ch":20, "unidade":"Núcleo eMulti SMS",                        "equipe":"eMulti",       "fonte":"emulti",              "admissao":"2023-08-01"},
    {"id": 47, "matricula":"SMS-047", "nome":"Psic. Fernanda Matos",          "cargo":"Psicólogo",                     "vinculo":"clt",          "ch":20, "unidade":"Núcleo eMulti SMS",                        "equipe":"eMulti",       "fonte":"emulti",              "admissao":"2022-01-10"},
    {"id": 48, "matricula":"SMS-048", "nome":"Nutr. Simone Bastos",           "cargo":"Nutricionista",                 "vinculo":"temporario",   "ch":20, "unidade":"Núcleo eMulti SMS",                        "equipe":"eMulti",       "fonte":"emulti",              "admissao":"2024-08-01"},
    # ─ CAPS / Saúde Mental ─
    {"id": 49, "matricula":"SMS-049", "nome":"Dr. Henrique Lopes",            "cargo":"Médico Clínico Geral",          "vinculo":"temporario",   "ch":40, "unidade":"CAPS Maria Salete Tasca",                  "equipe":"CAPS",         "fonte":"caps",                "admissao":"2025-01-20"},
    {"id": 50, "matricula":"SMS-050", "nome":"Enf. Maria das Graças Lima",    "cargo":"Enfermeiro",                    "vinculo":"estatutario",  "ch":40, "unidade":"CAPS Maria Salete Tasca",                  "equipe":"CAPS",         "fonte":"caps",                "admissao":"2016-07-01"},
    # ─ Recurso Próprio Municipal ─
    {"id": 51, "matricula":"SMS-051", "nome":"Maria das Graças Lima",         "cargo":"Auxiliar Administrativo",       "vinculo":"estatutario",  "ch":40, "unidade":"Secretaria Municipal de Saúde",            "equipe":"—",            "fonte":"recurso_proprio",     "admissao":"2015-04-01"},
    {"id": 52, "matricula":"SMS-052", "nome":"José Raimundo Pereira",         "cargo":"Motorista",                     "vinculo":"estatutario",  "ch":40, "unidade":"Secretaria Municipal de Saúde",            "equipe":"—",            "fonte":"recurso_proprio",     "admissao":"2016-07-01"},
    {"id": 53, "matricula":"SMS-053", "nome":"Carlos Eduardo Silva",          "cargo":"Auxiliar Administrativo",       "vinculo":"estatutario",  "ch":40, "unidade":"Secretaria Municipal de Saúde",            "equipe":"—",            "fonte":"recurso_proprio",     "admissao":"2017-03-01"},
]


def _calcular_verba(s: dict, competencia: str) -> dict:
    cargo = s["cargo"]
    vinculo = s["vinculo"]
    ch = s["ch"]
    fonte = s["fonte"]

    sal_base = SALARIO_BASE.get(cargo, 2_000.00)
    # proporcional por carga horária (40h = integral)
    if ch < 40:
        sal_base = sal_base * (ch / 40)

    adicional_interioridade = sal_base * ADICIONAL_PCT.get(vinculo, 0)
    bruto = round(sal_base + adicional_interioridade, 2)

    # Descontos
    enc = ENCARGOS.get(vinculo, {})
    inss_seg  = round(calc_inss_segurado(bruto) if vinculo != "terceirizado" else 0, 2)
    base_irrf = bruto - inss_seg
    irrf      = round(calc_irrf(base_irrf) if vinculo != "terceirizado" else 0, 2)
    liquido   = round(bruto - inss_seg - irrf, 2)

    # Encargos patronais
    enc_inss     = round(bruto * enc.get("inss_patronal", 0), 2)
    enc_fgts     = round(bruto * enc.get("fgts", 0), 2)
    enc_ferias   = round(bruto * enc.get("ferias_encargo", 0), 2)
    enc_dec_terc = round(bruto * enc.get("decimo_terceiro", 0), 2)
    custo_total  = round(bruto + enc_inss + enc_fgts + enc_ferias + enc_dec_terc, 2)

    fi = FONTE_INFO.get(fonte, {"label": fonte, "fonte_contabil": "001.0", "ordem": 99, "grupo": "MUNICIPAL"})

    return {
        "matricula":            s["matricula"],
        "nome":                 s["nome"],
        "cargo":                cargo,
        "vinculo":              vinculo,
        "carga_horaria":        ch,
        "unidade":              s["unidade"],
        "equipe":               s.get("equipe", "—"),
        "fonte_pagamento":      fonte,
        "fonte_label":          fi["label"],
        "fonte_contabil":       fi["fonte_contabil"],
        "fonte_grupo":          fi["grupo"],
        "fonte_ordem":          fi["ordem"],
        "competencia":          competencia,
        "salario_base":         sal_base,
        "adicional_interioridade": adicional_interioridade,
        "bruto":                bruto,
        "desc_inss":            inss_seg,
        "desc_irrf":            irrf,
        "liquido":              liquido,
        "enc_inss_patronal":    enc_inss,
        "enc_fgts":             enc_fgts,
        "enc_ferias_prop":      enc_ferias,
        "enc_decimo_terceiro":  enc_dec_terc,
        "custo_total_empregador": custo_total,
    }


@router.get("/folha")
async def gerar_folha(
    competencia: str = Query("2026-07", description="Competência no formato YYYY-MM"),
    fonte: Optional[str] = Query(None),
    grupo: Optional[str] = Query(None),
    vinculo: Optional[str] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    verbas = [_calcular_verba(s, competencia) for s in SERVIDORES]

    if fonte:
        verbas = [v for v in verbas if v["fonte_pagamento"] == fonte]
    if grupo:
        verbas = [v for v in verbas if v["fonte_grupo"] == grupo]
    if vinculo:
        verbas = [v for v in verbas if v["vinculo"] == vinculo]

    # Ordenar: fonte_ordem → nome
    verbas.sort(key=lambda v: (v["fonte_ordem"], v["nome"]))

    total_bruto   = round(sum(v["bruto"]   for v in verbas), 2)
    total_liquido = round(sum(v["liquido"] for v in verbas), 2)
    total_inss    = round(sum(v["desc_inss"] for v in verbas), 2)
    total_irrf    = round(sum(v["desc_irrf"] for v in verbas), 2)
    total_custo   = round(sum(v["custo_total_empregador"] for v in verbas), 2)

    # Resumo por fonte
    por_fonte: dict[str, dict] = {}
    for v in verbas:
        k = v["fonte_pagamento"]
        if k not in por_fonte:
            por_fonte[k] = {"fonte": k, "label": v["fonte_label"], "grupo": v["fonte_grupo"],
                             "contabil": v["fonte_contabil"], "servidores": 0,
                             "bruto": 0, "liquido": 0, "custo_total": 0}
        por_fonte[k]["servidores"] += 1
        por_fonte[k]["bruto"]      = round(por_fonte[k]["bruto"]      + v["bruto"],   2)
        por_fonte[k]["liquido"]    = round(por_fonte[k]["liquido"]     + v["liquido"], 2)
        por_fonte[k]["custo_total"]= round(por_fonte[k]["custo_total"] + v["custo_total_empregador"], 2)

    resumo_fonte = sorted(por_fonte.values(), key=lambda x: FONTE_INFO.get(x["fonte"], {}).get("ordem", 99))

    return {
        "competencia":   competencia,
        "municipio":     "Apuí/AM",
        "total_servidores": len(verbas),
        "total_bruto":   total_bruto,
        "total_liquido": total_liquido,
        "total_inss_descontado": total_inss,
        "total_irrf_descontado": total_irrf,
        "total_custo_empregador": total_custo,
        "resumo_por_fonte": resumo_fonte,
        "verbas": verbas,
    }


@router.get("/fontes")
async def listar_fontes(usuario: UserOut = Depends(get_current_user)):
    return [{"key": k, **v} for k, v in FONTE_INFO.items()]


@router.get("/servidores")
async def listar_servidores(usuario: UserOut = Depends(get_current_user)):
    return SERVIDORES
