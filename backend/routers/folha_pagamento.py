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

@router.get("/folha")
async def gerar_folha(
    competencia: str = Query("2026-07"),
    fonte: Optional[str] = Query(None),
    grupo: Optional[str] = Query(None),
    vinculo: Optional[str] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    """Folha de pagamento real requer integracao com SIAPE ou sistema RH municipal."""
    return {
        "situacao_dado":    "nao_disponivel",
        "competencia":      competencia,
        "municipio":        "Apui/AM",
        "verbas":           [],
        "total_servidores": None,
        "total_bruto":      None,
        "total_liquido":    None,
        "nota": "Folha de pagamento requer integracao com SIAPE ou sistema de RH municipal. Nenhum servidor inventado.",
    }


@router.get("/fontes")
async def listar_fontes(usuario: UserOut = Depends(get_current_user)):
    """Fontes de financiamento da folha (classificacao SIOPS)."""
    return [{"key": k, **v} for k, v in FONTE_INFO.items()]


@router.get("/servidores")
async def listar_servidores(usuario: UserOut = Depends(get_current_user)):
    """Servidores reais requerem integracao com SIAPE ou sistema RH municipal."""
    return {
        "situacao_dado": "nao_disponivel",
        "dados":         [],
        "nota": "Quadro de servidores requer integracao com SIAPE ou sistema de RH municipal. Nenhum servidor inventado.",
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
