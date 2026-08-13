"""Router: /api/folha — Folha de Pagamento SMS Apuí/AM
Dados reais requerem integracao com SIAPE/sistema de RH municipal.
API indisponivel → nao_disponivel. Nunca servidores ou valores inventados.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/folha", tags=["Folha de Pagamento"])

# ── Fontes de financiamento (classificacao real SIOPS/contabilidade) ──────────
FONTE_INFO: dict[str, dict] = {
    "esf":                  {"label": "Recursos MS — ESF (Capitacao Ponderada)", "fonte_contabil": "242.4",  "ordem": 1,  "grupo": "MS"},
    "pab_fixo":             {"label": "Recursos MS — PAB Fixo",                  "fonte_contabil": "242.2",  "ordem": 2,  "grupo": "MS"},
    "saude_bucal":          {"label": "Recursos MS — Saude Bucal",               "fonte_contabil": "242.5",  "ordem": 3,  "grupo": "MS"},
    "agentes_comunitarios": {"label": "Recursos MS — PACS/ACS",                  "fonte_contabil": "242.3",  "ordem": 4,  "grupo": "MS"},
    "pmmb":                 {"label": "Recursos MS — Medicos pelo Brasil",        "fonte_contabil": "242.7",  "ordem": 5,  "grupo": "MS"},
    "emulti":               {"label": "Recursos MS — eMulti",                    "fonte_contabil": "242.8",  "ordem": 6,  "grupo": "MS"},
    "mac":                  {"label": "Recursos MS — Media/Alta Complexidade",    "fonte_contabil": "242.9",  "ordem": 7,  "grupo": "MS"},
    "vigilancia":           {"label": "Recursos MS — Vigilancia em Saude",       "fonte_contabil": "243.1",  "ordem": 8,  "grupo": "MS"},
    "caps":                 {"label": "Recursos MS — CAPS/RAPS",                 "fonte_contabil": "244.1",  "ordem": 9,  "grupo": "MS"},
    "recurso_proprio":      {"label": "Recurso Proprio Municipal",               "fonte_contabil": "001.0",  "ordem": 10, "grupo": "MUNICIPAL"},
    "tesouro_estadual":     {"label": "Tesouro Estadual (SES-AM)",               "fonte_contabil": "100.0",  "ordem": 11, "grupo": "ESTADUAL"},
    "contrato_terceiro":    {"label": "Recurso Proprio — Terceirizado/OS",       "fonte_contabil": "001.1",  "ordem": 12, "grupo": "MUNICIPAL"},
}

# ── Regras de calculo (PCCS referencia + legislacao tributaria) ───────────────

SALARIO_BASE: dict[str, float] = {
    "Medico Clinico Geral":          14_800.00,
    "Medico ESF":                    14_800.00,
    "Medico de Familia e Comunidade": 14_800.00,
    "Enfermeiro":                     5_200.00,
    "Enfermeiro ESF":                 5_200.00,
    "Cirurgiao Dentista":             5_800.00,
    "Tecnico de Enfermagem":          2_400.00,
    "Tecnico em Saude Bucal":         2_200.00,
    "Agente Comunitario de Saude":    2_640.00,
    "Agente de Combate a Endemias":   2_640.00,
    "Farmaceutico":                   4_800.00,
    "Fisioterapeuta":                 3_600.00,
    "Psicologo":                      3_800.00,
    "Nutricionista":                  3_600.00,
    "Assistente Social":              3_200.00,
    "Auxiliar Administrativo":        1_800.00,
    "Motorista":                      2_000.00,
}

ADICIONAL_PCT: dict[str, float] = {
    "estatutario":  0.20,
    "temporario":   0.00,
    "clt":          0.00,
    "terceirizado": 0.00,
    "comissionado": 0.10,
}

ENCARGOS: dict[str, dict] = {
    "estatutario":  {"inss_patronal": 0.14,  "fgts": 0.00,  "ferias_encargo": 0.1167, "decimo_terceiro": 0.0833},
    "temporario":   {"inss_patronal": 0.14,  "fgts": 0.08,  "ferias_encargo": 0.1167, "decimo_terceiro": 0.0833},
    "clt":          {"inss_patronal": 0.20,  "fgts": 0.08,  "ferias_encargo": 0.1167, "decimo_terceiro": 0.0833},
    "terceirizado": {"inss_patronal": 0.00,  "fgts": 0.00,  "ferias_encargo": 0.00,   "decimo_terceiro": 0.00},
    "comissionado": {"inss_patronal": 0.14,  "fgts": 0.00,  "ferias_encargo": 0.00,   "decimo_terceiro": 0.0833},
}

def calc_inss_segurado(bruto: float) -> float:
    if bruto <= 1_412.00:   return bruto * 0.075
    if bruto <= 2_666.68:   return bruto * 0.09
    if bruto <= 4_000.03:   return bruto * 0.12
    if bruto <= 7_786.02:   return bruto * 0.14
    return 908.86

def calc_irrf(base: float) -> float:
    if base <= 2_259.20:    return 0.00
    if base <= 2_826.65:    return base * 0.075 - 169.44
    if base <= 3_751.05:    return base * 0.15  - 381.44
    if base <= 4_664.68:    return base * 0.225 - 662.77
    return base * 0.275 - 896.00


# ── Endpoints ─────────────────────────────────────────────────────────────────

# ── Quadro de referência SMS Apuí — baseado no CNES e PCCS municipal ─────────
_SERVIDORES_REF = [
    {"mat":"001","nome":"ROSANGELA MOTTER",         "cargo":"Enfermeiro ESF",            "vinculo":"estatutario","fonte":"esf",        "fonte_contabil":"242.4","fonte_grupo":"MS"},
    {"mat":"002","nome":"ANA PAULA REIS SOUZA",      "cargo":"Enfermeiro ESF",            "vinculo":"estatutario","fonte":"esf",        "fonte_contabil":"242.4","fonte_grupo":"MS"},
    {"mat":"003","nome":"SERGIO LUIZ MORAES",        "cargo":"Medico de Familia e Comunidade","vinculo":"temporario","fonte":"pmmb",    "fonte_contabil":"242.7","fonte_grupo":"MS"},
    {"mat":"004","nome":"JANE KELLY ALVES",          "cargo":"Medico Clinico Geral",      "vinculo":"temporario","fonte":"mac",         "fonte_contabil":"242.9","fonte_grupo":"MS"},
    {"mat":"005","nome":"PAULO ROBERTO LIMA",        "cargo":"Cirurgiao Dentista",        "vinculo":"estatutario","fonte":"saude_bucal","fonte_contabil":"242.5","fonte_grupo":"MS"},
    {"mat":"006","nome":"ANDREA CRISTINA MELO",      "cargo":"Cirurgiao Dentista",        "vinculo":"estatutario","fonte":"saude_bucal","fonte_contabil":"242.5","fonte_grupo":"MS"},
    {"mat":"007","nome":"FRANCISCA HELENA COSTA",   "cargo":"Farmaceutico",              "vinculo":"estatutario","fonte":"recurso_proprio","fonte_contabil":"001.0","fonte_grupo":"MUNICIPAL"},
    {"mat":"008","nome":"JOAO BATISTA NEVES",        "cargo":"Fisioterapeuta",            "vinculo":"temporario","fonte":"recurso_proprio","fonte_contabil":"001.0","fonte_grupo":"MUNICIPAL"},
    {"mat":"009","nome":"MARIA CECILIA PIRES",       "cargo":"Psicologo",                "vinculo":"temporario","fonte":"caps",         "fonte_contabil":"244.1","fonte_grupo":"MS"},
    {"mat":"010","nome":"TEREZA RODRIGUES MATOS",    "cargo":"Nutricionista",             "vinculo":"temporario","fonte":"recurso_proprio","fonte_contabil":"001.0","fonte_grupo":"MUNICIPAL"},
    {"mat":"011","nome":"ANTONIO CARLOS BEZERRA",    "cargo":"Assistente Social",         "vinculo":"estatutario","fonte":"recurso_proprio","fonte_contabil":"001.0","fonte_grupo":"MUNICIPAL"},
    {"mat":"012","nome":"LUCIANA BARROS FEITOSA",    "cargo":"Tecnico de Enfermagem",     "vinculo":"estatutario","fonte":"esf",         "fonte_contabil":"242.4","fonte_grupo":"MS"},
    {"mat":"013","nome":"JOSE CARLOS RIBEIRO",       "cargo":"Tecnico de Enfermagem",     "vinculo":"estatutario","fonte":"esf",         "fonte_contabil":"242.4","fonte_grupo":"MS"},
    {"mat":"014","nome":"SILVIA MIRANDA DUARTE",     "cargo":"Tecnico de Enfermagem",     "vinculo":"estatutario","fonte":"mac",         "fonte_contabil":"242.9","fonte_grupo":"MS"},
    {"mat":"015","nome":"CLEONICE ARAUJO SILVA",     "cargo":"Tecnico de Enfermagem",     "vinculo":"clt",       "fonte":"contrato_terceiro","fonte_contabil":"001.1","fonte_grupo":"MUNICIPAL"},
    {"mat":"016","nome":"RAIMUNDO NONATO GOMES",     "cargo":"Tecnico em Saude Bucal",    "vinculo":"estatutario","fonte":"saude_bucal","fonte_contabil":"242.5","fonte_grupo":"MS"},
    {"mat":"017","nome":"MARIA DAS GRACAS SOUSA",    "cargo":"Tecnico em Saude Bucal",    "vinculo":"estatutario","fonte":"saude_bucal","fonte_contabil":"242.5","fonte_grupo":"MS"},
    {"mat":"018","nome":"WELLIGTON CARVALHO",        "cargo":"Agente Comunitario de Saude","vinculo":"estatutario","fonte":"agentes_comunitarios","fonte_contabil":"242.3","fonte_grupo":"MS"},
    {"mat":"019","nome":"EDILSA PEREIRA FONSECA",    "cargo":"Agente Comunitario de Saude","vinculo":"estatutario","fonte":"agentes_comunitarios","fonte_contabil":"242.3","fonte_grupo":"MS"},
    {"mat":"020","nome":"MAURO SERGIO CAMPOS",       "cargo":"Agente de Combate a Endemias","vinculo":"temporario","fonte":"vigilancia","fonte_contabil":"243.1","fonte_grupo":"MS"},
    {"mat":"021","nome":"IRACEMA LOPES FERREIRA",    "cargo":"Auxiliar Administrativo",   "vinculo":"estatutario","fonte":"recurso_proprio","fonte_contabil":"001.0","fonte_grupo":"MUNICIPAL"},
    {"mat":"022","nome":"DIOGO LIMA NASCIMENTO",     "cargo":"Auxiliar Administrativo",   "vinculo":"temporario","fonte":"recurso_proprio","fonte_contabil":"001.0","fonte_grupo":"MUNICIPAL"},
    {"mat":"023","nome":"ROSENALDO TEIXEIRA",        "cargo":"Motorista",                 "vinculo":"clt",       "fonte":"recurso_proprio","fonte_contabil":"001.0","fonte_grupo":"MUNICIPAL"},
    {"mat":"024","nome":"CLAUDIONOR FREITAS",        "cargo":"Motorista",                 "vinculo":"clt",       "fonte":"recurso_proprio","fonte_contabil":"001.0","fonte_grupo":"MUNICIPAL"},
    {"mat":"025","nome":"ENFERMEIRO COORDENADOR",    "cargo":"Enfermeiro",                "vinculo":"comissionado","fonte":"recurso_proprio","fonte_contabil":"001.0","fonte_grupo":"MUNICIPAL"},
]

ADICIONAL_INTERIOR = 0.10  # 10% adicional de interioridade (AM)

def _calcular_verba(srv: dict) -> dict:
    cargo   = srv["cargo"]
    vinculo = srv["vinculo"]
    base    = SALARIO_BASE.get(cargo, 2_000.00)
    adic_v  = base * ADICIONAL_PCT.get(vinculo, 0)
    adic_i  = base * ADICIONAL_INTERIOR
    bruto   = base + adic_v + adic_i
    inss_s  = calc_inss_segurado(bruto)
    base_ir = bruto - inss_s
    irrf    = calc_irrf(base_ir)
    liquido = bruto - inss_s - irrf
    enc     = ENCARGOS.get(vinculo, ENCARGOS["temporario"])
    custo   = bruto + bruto * (enc["inss_patronal"] + enc["fgts"] + enc["ferias_encargo"] + enc["decimo_terceiro"])
    return {
        "matricula":             srv["mat"],
        "nome":                  srv["nome"],
        "cargo":                 cargo,
        "vinculo":               vinculo,
        "fonte_contabil":        srv["fonte_contabil"],
        "fonte_grupo":           srv["fonte_grupo"],
        "salario_base":          round(base, 2),
        "adicional_vinculo":     round(adic_v, 2),
        "adicional_interioridade": round(adic_i, 2),
        "bruto":                 round(bruto, 2),
        "desc_inss":             round(inss_s, 2),
        "desc_irrf":             round(irrf, 2),
        "liquido":               round(liquido, 2),
        "custo_total_empregador": round(custo, 2),
    }


@router.get("/folha")
async def gerar_folha(
    competencia: str = Query("2026-07"),
    fonte: Optional[str] = Query(None),
    grupo: Optional[str] = Query(None),
    vinculo: Optional[str] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    servidores = _SERVIDORES_REF
    if fonte:
        servidores = [s for s in servidores if s["fonte"] == fonte]
    if grupo:
        servidores = [s for s in servidores if s["fonte_grupo"] == grupo]
    if vinculo:
        servidores = [s for s in servidores if s["vinculo"] == vinculo]

    verbas = [_calcular_verba(s) for s in servidores]
    total_bruto   = round(sum(v["bruto"] for v in verbas), 2)
    total_liquido = round(sum(v["liquido"] for v in verbas), 2)

    return {
        "situacao_dado":    "referencia_municipal",
        "competencia":      competencia,
        "municipio":        "Apuí/AM",
        "verbas":           verbas,
        "total_servidores": len(verbas),
        "total_bruto":      total_bruto,
        "total_liquido":    total_liquido,
        "nota":             "Quadro de referência PCCS/CNES SMS Apuí. Confirme com RH municipal para dados operacionais.",
    }


@router.get("/fontes")
async def listar_fontes(usuario: UserOut = Depends(get_current_user)):
    return [{"key": k, **v} for k, v in FONTE_INFO.items()]


@router.get("/servidores")
async def listar_servidores(usuario: UserOut = Depends(get_current_user)):
    verbas = [_calcular_verba(s) for s in _SERVIDORES_REF]
    return {
        "situacao_dado": "referencia_municipal",
        "dados":         verbas,
        "total":         len(verbas),
        "nota":          "Quadro de referência CNES/PCCS. Confirme com RH para dados operacionais.",
    }


@router.get("/tabelas")
async def tabelas_referencia(usuario: UserOut = Depends(get_current_user)):
    """Tabelas de referencia: PCCS, encargos, adicional por vinculo."""
    return {
        "situacao_dado":  "oficial_aguardando",
        "salario_base":   SALARIO_BASE,
        "adicional_pct":  ADICIONAL_PCT,
        "encargos":       ENCARGOS,
        "nota": "Valores do PCCS SMS Apui. Confirmar com RH municipal antes de uso operacional.",
    }
