from fastapi import APIRouter
import random
from functools import lru_cache

router = APIRouter(prefix="/api/saude-bucal", tags=["saude-bucal"])

random.seed(17)

@lru_cache(maxsize=1)
def _MESES():
    return ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]


def _hist(base: int) -> list:
    v = base; out = []
    for _ in range(12):
        v = max(0, v + random.randint(-int(base * 0.15), int(base * 0.18)))
        out.append(v)
    return out

@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {
            "id": "sb01", "codigo": "C06", "nome": "Proporção de pessoas com 1ª consulta odontológica programática",
            "grupo": "Previne Brasil", "meta": 420, "realizado": 312,
            "unidade": "consultas", "pct_meta": 74.3, "status": "alerta", "tendencia": "alta",
        },
        {
            "id": "sb02", "codigo": "C07", "nome": "Tratamentos odontológicos concluídos",
            "grupo": "Previne Brasil", "meta": 300, "realizado": 241,
            "unidade": "tratamentos", "pct_meta": 80.3, "status": "alerta", "tendencia": "estavel",
        },
        {
            "id": "sb03", "codigo": "SB01", "nome": "Cobertura de 1ª consulta odontológica programática (% pop.)",
            "grupo": "SB Brasil", "meta": 20, "realizado": 14,
            "unidade": "%", "pct_meta": 70.0, "status": "alerta", "tendencia": "queda",
        },
        {
            "id": "sb04", "codigo": "SB02", "nome": "Proporção de exodontias em relação às ações odontológicas básicas",
            "grupo": "SB Brasil", "meta": 25, "realizado": 31,
            "unidade": "%", "pct_meta": 0, "status": "critico", "tendencia": "queda",
        },
        {
            "id": "sb05", "codigo": "SB03", "nome": "Média de ações odontológicas básicas por pessoa",
            "grupo": "SB Brasil", "meta": 3, "realizado": 2.1,
            "unidade": "ações/pess.", "pct_meta": 70.0, "status": "alerta", "tendencia": "alta",
        },
        {
            "id": "sb06", "codigo": "CEO01", "nome": "Procedimentos especializados no CEO — periodontia",
            "grupo": "CEO", "meta": 180, "realizado": 168,
            "unidade": "procedimentos", "pct_meta": 93.3, "status": "meta_atingida", "tendencia": "estavel",
        },
        {
            "id": "sb07", "codigo": "CEO02", "nome": "Procedimentos especializados no CEO — endodontia",
            "grupo": "CEO", "meta": 120, "realizado": 118,
            "unidade": "procedimentos", "pct_meta": 98.3, "status": "meta_atingida", "tendencia": "alta",
        },
        {
            "id": "sb08", "codigo": "CEO03", "nome": "Procedimentos especializados no CEO — diagnóstico bucal",
            "grupo": "CEO", "meta": 96, "realizado": 72,
            "unidade": "exames", "pct_meta": 75.0, "status": "alerta", "tendencia": "alta",
        },
    ]


for ind in _INDICADORES():
    base_m = int(ind["realizado"] / 6)
    ind["historico"] = _hist(base_m)
    ind["meses"] = _MESES()

@lru_cache(maxsize=1)
def _PROCEDIMENTOS():
    return [
        {"codigo": "03.01.01.007-2", "descricao": "Consulta/atendimento odontológico", "quantidade": 312, "meta_mensal": 70},
        {"codigo": "03.01.01.013-7", "descricao": "Tratamento de urgência em saúde bucal", "quantidade": 48, "meta_mensal": 40},
        {"codigo": "03.01.06.003-6", "descricao": "Restauração em resina composta (1 face)", "quantidade": 186, "meta_mensal": 150},
        {"codigo": "03.01.06.005-2", "descricao": "Restauração em resina composta (2+ faces)", "quantidade": 74, "meta_mensal": 80},
        {"codigo": "03.01.06.009-5", "descricao": "Exodontia de dente permanente", "quantidade": 96, "meta_mensal": 60},
        {"codigo": "03.01.06.011-7", "descricao": "Raspagem supragengival", "quantidade": 142, "meta_mensal": 120},
        {"codigo": "03.01.06.013-3", "descricao": "Raspagem subgengival (por sextante)", "quantidade": 38, "meta_mensal": 60},
        {"codigo": "03.01.07.003-4", "descricao": "Fluoretação dentária", "quantidade": 204, "meta_mensal": 180},
        {"codigo": "03.01.07.009-3", "descricao": "Selante dentário (por dente)", "quantidade": 168, "meta_mensal": 160},
        {"codigo": "03.01.07.015-8", "descricao": "Controle de placa bacteriana", "quantidade": 88, "meta_mensal": 100},
        {"codigo": "03.01.08.001-0", "descricao": "Radiografia periapical (unitária)", "quantidade": 52, "meta_mensal": 60},
        {"codigo": "03.01.06.002-8", "descricao": "Tratamento endodôntico — molar", "quantidade": 22, "meta_mensal": 25},
    ]


@router.get("/resumo")
def resumo():
    total_proc = sum(p["quantidade"] for p in _PROCEDIMENTOS())
    meta_proc  = sum(p["meta_mensal"] for p in _PROCEDIMENTOS())
    return {
        "score_sb":                  5.8,
        "procedimentos_mes":         total_proc,
        "meta_procedimentos":        meta_proc,
        "primeira_consulta_pct":     74.3,
        "tratamento_concluido_pct":  80.3,
        "cobertura_1a_consulta":     14.0,
        "exodontias_pct":            31.0,
        "equipes_sb":                2,
        "ceo_ativo":                 True,
    }

@router.get("/indicadores")
def indicadores():
    return _INDICADORES()

@router.get("/procedimentos")
def procedimentos():
    return _PROCEDIMENTOS()