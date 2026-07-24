from fastapi import APIRouter
from typing import Optional
import random

router = APIRouter(prefix="/api/vacinacao", tags=["vacinacao"])

random.seed(31)

def _doses(base: int, n: int = 12) -> list:
    meses = []
    v = base
    for _ in range(n):
        v = max(0, v + random.randint(-int(base * 0.15), int(base * 0.2)))
        meses.append(v)
    return meses

_MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

_IMUNOS = [
    {
        "id": "v01", "nome": "Pentavalente (DTP+Hib+HepB)", "sigla": "PENTA",
        "publico_alvo": "Crianças < 1 ano",
        "doses_aplicadas": 248, "meta": 285,
        "cobertura_pct": 87.0, "homogeneidade_pct": 82.0,
        "status": "alerta",
        "alertas": ["Cobertura abaixo de 90%", "Microárea 3 com homogeneidade crítica"],
    },
    {
        "id": "v02", "nome": "Poliomielite VIP+VOP", "sigla": "POLIO",
        "publico_alvo": "Crianças < 5 anos",
        "doses_aplicadas": 312, "meta": 290,
        "cobertura_pct": 107.6, "homogeneidade_pct": 96.0,
        "status": "meta_atingida",
        "alertas": [],
    },
    {
        "id": "v03", "nome": "Febre Amarela", "sigla": "FA",
        "publico_alvo": "Crianças > 9 meses e adultos",
        "doses_aplicadas": 420, "meta": 580,
        "cobertura_pct": 72.4, "homogeneidade_pct": 65.0,
        "status": "critico",
        "alertas": ["Cobertura CRÍTICA < 80%", "Homogeneidade crítica", "Área endêmica — prioridade máxima"],
    },
    {
        "id": "v04", "nome": "Tríplice Viral (SCR)", "sigla": "SCR",
        "publico_alvo": "Crianças 12 meses / 5 anos",
        "doses_aplicadas": 189, "meta": 195,
        "cobertura_pct": 96.9, "homogeneidade_pct": 91.0,
        "status": "meta_atingida",
        "alertas": [],
    },
    {
        "id": "v05", "nome": "BCG — Tuberculose", "sigla": "BCG",
        "publico_alvo": "RN ao nascer",
        "doses_aplicadas": 64, "meta": 68,
        "cobertura_pct": 94.1, "homogeneidade_pct": 88.0,
        "status": "meta_atingida",
        "alertas": [],
    },
    {
        "id": "v06", "nome": "Meningocócica C (MenC)", "sigla": "MENC",
        "publico_alvo": "Crianças 3–5 meses",
        "doses_aplicadas": 156, "meta": 190,
        "cobertura_pct": 82.1, "homogeneidade_pct": 74.0,
        "status": "alerta",
        "alertas": ["Homogeneidade abaixo de 80%"],
    },
    {
        "id": "v07", "nome": "Pneumocócica 10V (Pnc10)", "sigla": "PNC10",
        "publico_alvo": "Crianças < 2 anos",
        "doses_aplicadas": 278, "meta": 285,
        "cobertura_pct": 97.5, "homogeneidade_pct": 92.0,
        "status": "meta_atingida",
        "alertas": [],
    },
    {
        "id": "v08", "nome": "Influenza — Gestantes", "sigla": "GRIPE-GES",
        "publico_alvo": "Gestantes",
        "doses_aplicadas": 89, "meta": 110,
        "cobertura_pct": 80.9, "homogeneidade_pct": 76.0,
        "status": "alerta",
        "alertas": ["Cobertura abaixo de 90%"],
    },
    {
        "id": "v09", "nome": "Influenza — Idosos ≥60", "sigla": "GRIPE-IDO",
        "publico_alvo": "Idosos ≥ 60 anos",
        "doses_aplicadas": 648, "meta": 620,
        "cobertura_pct": 104.5, "homogeneidade_pct": 98.0,
        "status": "meta_atingida",
        "alertas": [],
    },
    {
        "id": "v10", "nome": "dT — Adultos e Gestantes", "sigla": "dT",
        "publico_alvo": "Adultos / Gestantes",
        "doses_aplicadas": 512, "meta": 650,
        "cobertura_pct": 78.8, "homogeneidade_pct": 71.0,
        "status": "critico",
        "alertas": ["Cobertura abaixo de 80%", "Gestantes com esquema incompleto"],
    },
    {
        "id": "v11", "nome": "Rotavírus Humano (VORH)", "sigla": "VORH",
        "publico_alvo": "Crianças 2–6 meses",
        "doses_aplicadas": 198, "meta": 200,
        "cobertura_pct": 99.0, "homogeneidade_pct": 95.0,
        "status": "meta_atingida",
        "alertas": [],
    },
    {
        "id": "v12", "nome": "Varicela (VZ)", "sigla": "VZ",
        "publico_alvo": "Crianças 4 anos",
        "doses_aplicadas": 87, "meta": 95,
        "cobertura_pct": 91.6, "homogeneidade_pct": 86.0,
        "status": "meta_atingida",
        "alertas": [],
    },
]

for im in _IMUNOS:
    base_mensal = im["meta"] // 12
    im["doses_por_mes"] = _doses(base_mensal)
    im["meses"] = _MESES

@router.get("/resumo")
def resumo():
    meta_at = [i for i in _IMUNOS if i["status"] == "meta_atingida"]
    alerta  = [i for i in _IMUNOS if i["status"] == "alerta"]
    critico = [i for i in _IMUNOS if i["status"] == "critico"]
    total   = sum(i["doses_aplicadas"] for i in _IMUNOS)
    meta    = sum(i["meta"] for i in _IMUNOS)
    cob_med = round(sum(i["cobertura_pct"] for i in _IMUNOS) / len(_IMUNOS), 1)
    hom_med = round(sum(i["homogeneidade_pct"] for i in _IMUNOS) / len(_IMUNOS), 1)
    doses_mes = sum(i["doses_por_mes"][-1] for i in _IMUNOS)
    return {
        "total_doses_ano":      total,
        "meta_doses_ano":       meta,
        "imuno_meta_atingida":  len(meta_at),
        "imuno_alerta":         len(alerta),
        "imuno_critico":        len(critico),
        "cobertura_media":      cob_med,
        "homogeneidade_media":  hom_med,
        "doses_ultimo_mes":     doses_mes,
    }

@router.get("/imunobiologicos")
def imunobiologicos(status: Optional[str] = None):
    data = _IMUNOS
    if status and status != "todos":
        data = [i for i in data if i["status"] == status]
    return data
