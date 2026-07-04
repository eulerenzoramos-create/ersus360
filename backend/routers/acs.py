"""
Router: /api/acs — Módulo ACS (Agentes Comunitários de Saúde)
Apuí/AM — 3 equipes ESF, 8 microáreas, 12 ACS ativos
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/acs", tags=["ACS"])

# ── Dados de referência ───────────────────────────────────────────────────────

_ACS: list[dict] = [
    {"id": 1,  "nome": "Maria Aparecida Silva",    "microarea": "MA-01", "esf": "ESF I",   "ativo": True,  "familias_cadastradas": 148, "familias_meta": 150},
    {"id": 2,  "nome": "João Carlos Nascimento",   "microarea": "MA-02", "esf": "ESF I",   "ativo": True,  "familias_cadastradas": 132, "familias_meta": 150},
    {"id": 3,  "nome": "Ana Paula Ferreira",        "microarea": "MA-03", "esf": "ESF I",   "ativo": True,  "familias_cadastradas": 141, "familias_meta": 150},
    {"id": 4,  "nome": "Raimundo Nonato Costa",    "microarea": "MA-04", "esf": "ESF II",  "ativo": True,  "familias_cadastradas": 155, "familias_meta": 150},
    {"id": 5,  "nome": "Francisca Lima Santos",    "microarea": "MA-05", "esf": "ESF II",  "ativo": True,  "familias_cadastradas": 137, "familias_meta": 150},
    {"id": 6,  "nome": "Antônio Mendes Rocha",     "microarea": "MA-06", "esf": "ESF II",  "ativo": True,  "familias_cadastradas": 122, "familias_meta": 150},
    {"id": 7,  "nome": "Benedita Sousa Oliveira",  "microarea": "MA-07", "esf": "ESF III", "ativo": True,  "familias_cadastradas": 163, "familias_meta": 150},
    {"id": 8,  "nome": "Sebastião Alves Teixeira", "microarea": "MA-08", "esf": "ESF III", "ativo": True,  "familias_cadastradas": 118, "familias_meta": 150},
    {"id": 9,  "nome": "Rosa Maria Barbosa",       "microarea": "MA-07", "esf": "ESF III", "ativo": True,  "familias_cadastradas": 87,  "familias_meta": 100},
    {"id": 10, "nome": "Carlos Eduardo Martins",   "microarea": "MA-08", "esf": "ESF III", "ativo": False, "familias_cadastradas": 0,   "familias_meta": 100},
    {"id": 11, "nome": "Teresinha Gomes Peixoto",  "microarea": "MA-02", "esf": "ESF I",   "ativo": True,  "familias_cadastradas": 76,  "familias_meta": 100},
    {"id": 12, "nome": "Manoel Ferreira Nunes",    "microarea": "MA-05", "esf": "ESF II",  "ativo": True,  "familias_cadastradas": 95,  "familias_meta": 100},
]

_MES_REF = {"mes": 7, "ano": 2026, "label": "Julho/2026"}

_VISITAS: list[dict] = [
    {"acs_id": 1,  "programadas": 148, "realizadas": 141, "nao_encontradas": 12, "recusas": 3},
    {"acs_id": 2,  "programadas": 143, "realizadas": 108, "nao_encontradas": 18, "recusas": 5},
    {"acs_id": 3,  "programadas": 141, "realizadas": 138, "nao_encontradas": 8,  "recusas": 1},
    {"acs_id": 4,  "programadas": 155, "realizadas": 155, "nao_encontradas": 7,  "recusas": 0},
    {"acs_id": 5,  "programadas": 137, "realizadas": 124, "nao_encontradas": 15, "recusas": 4},
    {"acs_id": 6,  "programadas": 122, "realizadas": 110, "nao_encontradas": 22, "recusas": 6},
    {"acs_id": 7,  "programadas": 163, "realizadas": 152, "nao_encontradas": 14, "recusas": 2},
    {"acs_id": 8,  "programadas": 118, "realizadas": 97,  "nao_encontradas": 19, "recusas": 7},
    {"acs_id": 9,  "programadas": 87,  "realizadas": 83,  "nao_encontradas": 5,  "recusas": 1},
    {"acs_id": 10, "programadas": 0,   "realizadas": 0,   "nao_encontradas": 0,  "recusas": 0},
    {"acs_id": 11, "programadas": 76,  "realizadas": 72,  "nao_encontradas": 6,  "recusas": 2},
    {"acs_id": 12, "programadas": 95,  "realizadas": 88,  "nao_encontradas": 10, "recusas": 3},
]

_INDICADORES_ACS: list[dict] = [
    # por ACS: gestantes acompanhadas, crianças < 2a, HAS, DM, idosos
    {"acs_id": 1,  "gestantes_ativas": 8,  "criancas_lt2": 12, "has": 34, "dm": 11, "idosos": 22},
    {"acs_id": 2,  "gestantes_ativas": 6,  "criancas_lt2": 9,  "has": 29, "dm": 8,  "idosos": 17},
    {"acs_id": 3,  "gestantes_ativas": 7,  "criancas_lt2": 11, "has": 31, "dm": 9,  "idosos": 20},
    {"acs_id": 4,  "gestantes_ativas": 9,  "criancas_lt2": 14, "has": 38, "dm": 12, "idosos": 25},
    {"acs_id": 5,  "gestantes_ativas": 5,  "criancas_lt2": 8,  "has": 27, "dm": 7,  "idosos": 16},
    {"acs_id": 6,  "gestantes_ativas": 4,  "criancas_lt2": 7,  "has": 24, "dm": 6,  "idosos": 14},
    {"acs_id": 7,  "gestantes_ativas": 10, "criancas_lt2": 16, "has": 40, "dm": 14, "idosos": 28},
    {"acs_id": 8,  "gestantes_ativas": 4,  "criancas_lt2": 6,  "has": 21, "dm": 5,  "idosos": 12},
    {"acs_id": 9,  "gestantes_ativas": 3,  "criancas_lt2": 5,  "has": 17, "dm": 4,  "idosos": 10},
    {"acs_id": 10, "gestantes_ativas": 0,  "criancas_lt2": 0,  "has": 0,  "dm": 0,  "idosos": 0},
    {"acs_id": 11, "gestantes_ativas": 3,  "criancas_lt2": 4,  "has": 14, "dm": 3,  "idosos": 8},
    {"acs_id": 12, "gestantes_ativas": 4,  "criancas_lt2": 6,  "has": 18, "dm": 5,  "idosos": 11},
]

_MICROAREAS = [
    {"codigo": "MA-01", "nome": "Centro",             "zona": "urbana", "esf": "ESF I"},
    {"codigo": "MA-02", "nome": "Bairro Novo",        "zona": "urbana", "esf": "ESF I"},
    {"codigo": "MA-03", "nome": "Santo Antônio",      "zona": "urbana", "esf": "ESF I"},
    {"codigo": "MA-04", "nome": "Industrial",         "zona": "urbana", "esf": "ESF II"},
    {"codigo": "MA-05", "nome": "Rio Apuí",           "zona": "rural",  "esf": "ESF II"},
    {"codigo": "MA-06", "nome": "Setor Norte",        "zona": "rural",  "esf": "ESF II"},
    {"codigo": "MA-07", "nome": "Ramal do Cupim",     "zona": "rural",  "esf": "ESF III"},
    {"codigo": "MA-08", "nome": "Assentamento Trop.", "zona": "rural",  "esf": "ESF III"},
]


def _enriquecer_acs(acs: dict) -> dict:
    vis = next((v for v in _VISITAS if v["acs_id"] == acs["id"]), {})
    ind = next((i for i in _INDICADORES_ACS if i["acs_id"] == acs["id"]), {})

    prog = vis.get("programadas", 0)
    real = vis.get("realizadas", 0)
    pct_visitas = round(real / prog * 100, 1) if prog > 0 else 0
    pct_cad = round(acs["familias_cadastradas"] / acs["familias_meta"] * 100, 1) if acs["familias_meta"] > 0 else 0

    status = (
        "afastado" if not acs["ativo"] else
        "destaque" if pct_visitas >= 95 and pct_cad >= 90 else
        "critico"  if pct_visitas < 70 or pct_cad < 60 else
        "regular"
    )

    return {
        **acs,
        "visitas": vis,
        "indicadores": ind,
        "pct_visitas": pct_visitas,
        "pct_cadastro": pct_cad,
        "status": status,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard_acs(_: UserOut = Depends(get_current_user)):
    acs_ativos = [a for a in _ACS if a["ativo"]]
    total_familias  = sum(a["familias_cadastradas"] for a in acs_ativos)
    total_meta      = sum(a["familias_meta"] for a in acs_ativos)
    total_prog      = sum(v["programadas"] for v in _VISITAS)
    total_real      = sum(v["realizadas"]  for v in _VISITAS)
    total_gestantes = sum(i["gestantes_ativas"] for i in _INDICADORES_ACS)
    total_criancas  = sum(i["criancas_lt2"] for i in _INDICADORES_ACS)
    total_has       = sum(i["has"] for i in _INDICADORES_ACS)
    total_dm        = sum(i["dm"]  for i in _INDICADORES_ACS)

    acs_enriquecidos = [_enriquecer_acs(a) for a in _ACS]
    destaques = [a for a in acs_enriquecidos if a["status"] == "destaque"]
    criticos  = [a for a in acs_enriquecidos if a["status"] == "critico"]

    return {
        "municipio": "Apuí/AM",
        "mes_referencia": _MES_REF,
        "kpis": {
            "total_acs":            len(_ACS),
            "acs_ativos":           len(acs_ativos),
            "total_microareas":     len(_MICROAREAS),
            "familias_cadastradas": total_familias,
            "familias_meta":        total_meta,
            "pct_cobertura":        round(total_familias / total_meta * 100, 1) if total_meta else 0,
            "visitas_programadas":  total_prog,
            "visitas_realizadas":   total_real,
            "pct_visitas":          round(total_real / total_prog * 100, 1) if total_prog else 0,
            "gestantes_ativas":     total_gestantes,
            "criancas_lt2":         total_criancas,
            "has_acompanhados":     total_has,
            "dm_acompanhados":      total_dm,
        },
        "acs_destaques":  destaques[:3],
        "acs_criticos":   criticos,
        "distribuicao_esf": {
            "ESF I":   sum(1 for a in acs_ativos if a["esf"] == "ESF I"),
            "ESF II":  sum(1 for a in acs_ativos if a["esf"] == "ESF II"),
            "ESF III": sum(1 for a in acs_ativos if a["esf"] == "ESF III"),
        },
        "fonte": "referencia",
    }


@router.get("/lista")
async def lista_acs(
    esf: str | None = Query(None),
    _: UserOut = Depends(get_current_user),
):
    acs_list = _ACS if not esf else [a for a in _ACS if a["esf"] == esf]
    return {
        "mes_referencia": _MES_REF,
        "acs": [_enriquecer_acs(a) for a in acs_list],
        "fonte": "referencia",
    }


@router.get("/microareas")
async def microareas(_: UserOut = Depends(get_current_user)):
    resultado = []
    for ma in _MICROAREAS:
        acs_ma = [a for a in _ACS if a["microarea"] == ma["codigo"]]
        acs_ativos_ma = [a for a in acs_ma if a["ativo"]]
        familias  = sum(a["familias_cadastradas"] for a in acs_ativos_ma)
        meta      = sum(a["familias_meta"] for a in acs_ma)
        vis_prog  = sum(v["programadas"] for v in _VISITAS if v["acs_id"] in [a["id"] for a in acs_ma])
        vis_real  = sum(v["realizadas"]  for v in _VISITAS if v["acs_id"] in [a["id"] for a in acs_ma])
        gestantes = sum(i["gestantes_ativas"] for i in _INDICADORES_ACS if i["acs_id"] in [a["id"] for a in acs_ativos_ma])

        pct_cad = round(familias / meta * 100, 1) if meta else 0
        pct_vis = round(vis_real / vis_prog * 100, 1) if vis_prog else 0
        sem = "verde" if pct_cad >= 90 and pct_vis >= 90 else "amarelo" if pct_cad >= 70 else "vermelho"

        resultado.append({
            **ma,
            "acs_count":            len(acs_ma),
            "acs_ativos":           len(acs_ativos_ma),
            "familias_cadastradas": familias,
            "familias_meta":        meta,
            "pct_cobertura":        pct_cad,
            "visitas_realizadas":   vis_real,
            "visitas_programadas":  vis_prog,
            "pct_visitas":          pct_vis,
            "gestantes_ativas":     gestantes,
            "semaforo":             sem,
        })

    return {"microareas": resultado, "fonte": "referencia"}


@router.get("/{acs_id}")
async def detalhe_acs(
    acs_id: int,
    _: UserOut = Depends(get_current_user),
):
    acs = next((a for a in _ACS if a["id"] == acs_id), None)
    if not acs:
        from fastapi import HTTPException
        raise HTTPException(404, "ACS não encontrado")

    historico_visitas = [
        {"mes": "Jan/26", "realizadas": 134, "programadas": 148},
        {"mes": "Fev/26", "realizadas": 138, "programadas": 148},
        {"mes": "Mar/26", "realizadas": 141, "programadas": 148},
        {"mes": "Abr/26", "realizadas": 145, "programadas": 148},
        {"mes": "Mai/26", "realizadas": 139, "programadas": 148},
        {"mes": "Jun/26", "realizadas": 143, "programadas": 148},
        {"mes": "Jul/26", "realizadas": next(
            (v["realizadas"] for v in _VISITAS if v["acs_id"] == acs_id), 0
        ), "programadas": 148},
    ]

    return {
        "acs": _enriquecer_acs(acs),
        "historico_visitas": historico_visitas,
        "fonte": "referencia",
    }
