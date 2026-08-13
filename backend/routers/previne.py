"""
Router: /api/previne — Novo Financiamento APS (7 indicadores Previne Brasil)
Dados de referencia municipal para Apui/AM.
situacao_dado = "referencia_municipal" em todos os endpoints.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/previne", tags=["Novo Financiamento APS"])

_IBGE = "1300144"
_COMP = "202606"

_INDICADORES_REF = [
    {
        "indicador":    1,
        "nome":         "Pre-natal com pelo menos 6 consultas",
        "numerador":    198,
        "denominador":  319,
        "resultado":    62.1,
        "meta_estadual": 60.0,
        "meta_nacional": 70.0,
        "classificacao": "Bom",
        "semaforo":     "amarelo",
        "nota_tecnica": "Meta nacional 70%. Municipio atingiu meta estadual mas nao a nacional.",
    },
    {
        "indicador":    2,
        "nome":         "Citopatologico do colo do utero",
        "numerador":    876,
        "denominador":  2_096,
        "resultado":    41.8,
        "meta_estadual": 40.0,
        "meta_nacional": 60.0,
        "classificacao": "Regular",
        "semaforo":     "vermelho",
        "nota_tecnica": "Acesso limitado ao exame na regiao. Coleta mensal nas UBS.",
    },
    {
        "indicador":    3,
        "nome":         "Vacinacao DTP — criancas ate 1 ano",
        "numerador":    344,
        "denominador":  389,
        "resultado":    88.4,
        "meta_estadual": 85.0,
        "meta_nacional": 90.0,
        "classificacao": "Bom",
        "semaforo":     "amarelo",
        "nota_tecnica": "Proximo da meta nacional. Perdas na area rural por dificuldade logistica.",
    },
    {
        "indicador":    4,
        "nome":         "Consulta RN na 1a semana de vida",
        "numerador":    174,
        "denominador":  319,
        "resultado":    54.6,
        "meta_estadual": 55.0,
        "meta_nacional": 70.0,
        "classificacao": "Regular",
        "semaforo":     "vermelho",
        "nota_tecnica": "Partos hospitalares em municipio de referencia dificultam retorno precoce.",
    },
    {
        "indicador":    5,
        "nome":         "Acompanhamento HAS",
        "numerador":    933,
        "denominador":  1_933,
        "resultado":    48.3,
        "meta_estadual": 50.0,
        "meta_nacional": 60.0,
        "classificacao": "Regular",
        "semaforo":     "vermelho",
        "nota_tecnica": "Sub-cadastro de hipertensos. Busca ativa em andamento pelas equipes ESF.",
    },
    {
        "indicador":    6,
        "nome":         "Acompanhamento DM — HbA1c nos ultimos 12 meses",
        "numerador":    228,
        "denominador":  589,
        "resultado":    38.7,
        "meta_estadual": 40.0,
        "meta_nacional": 55.0,
        "classificacao": "Ruim",
        "semaforo":     "vermelho",
        "nota_tecnica": "HbA1c indisponivel no municipio — encaminhamento para laboratorio de referencia.",
    },
    {
        "indicador":    7,
        "nome":         "Cuidado Pessoas com Obesidade",
        "numerador":    412,
        "denominador":  1_401,
        "resultado":    29.4,
        "meta_estadual": 30.0,
        "meta_nacional": 45.0,
        "classificacao": "Ruim",
        "semaforo":     "vermelho",
        "nota_tecnica": "Indicador novo (2024). Estrategia de rastreamento em implantacao.",
    },
]


@router.get("/indicadores")
async def listar_indicadores(
    competencia: str = Query(None, description="AAAAMM — omitir usa competencia atual"),
    _: UserOut = Depends(get_current_user),
):
    """7 indicadores Previne Brasil — referencia municipal Apui/AM."""
    comp = competencia or _COMP
    return {
        "situacao_dado":  "referencia_municipal",
        "municipio":      "Apui",
        "ibge":           _IBGE,
        "competencia":    comp,
        "total_equipes":  4,
        "indicadores":    _INDICADORES_REF,
        "media_resultado": round(
            sum(i["resultado"] for i in _INDICADORES_REF) / len(_INDICADORES_REF), 1
        ),
        "nota": "Referencia municipal — dados plausíveis para Apui/AM. Substituir por dados reais do e-Gestor APS quando disponivel.",
    }


@router.get("/historico")
async def historico_indicadores(
    meses: int = Query(6, ge=1, le=24),
    _: UserOut = Depends(get_current_user),
):
    """Historico mensal dos indicadores Previne Brasil — referencia municipal."""
    historico = []
    competencias = [
        ("202601", "Jan/26"), ("202602", "Fev/26"), ("202603", "Mar/26"),
        ("202604", "Abr/26"), ("202605", "Mai/26"), ("202606", "Jun/26"),
    ][-meses:]

    bases = [59.2, 60.1, 60.8, 61.4, 61.9, 62.1]    # ind1
    bases2 = [39.1, 39.8, 40.5, 41.0, 41.5, 41.8]   # ind2
    bases3 = [85.2, 86.1, 86.9, 87.5, 88.0, 88.4]   # ind3
    bases4 = [50.1, 51.2, 52.0, 53.1, 54.0, 54.6]   # ind4
    bases5 = [44.1, 45.0, 46.2, 47.1, 47.8, 48.3]   # ind5
    bases6 = [35.0, 36.1, 37.0, 37.8, 38.3, 38.7]   # ind6
    bases7 = [24.1, 25.2, 26.8, 27.5, 28.7, 29.4]   # ind7

    listas = [bases, bases2, bases3, bases4, bases5, bases6, bases7]
    offset = 6 - len(competencias)

    for i, (comp, label) in enumerate(competencias):
        historico.append({
            "competencia": comp,
            "label":       label,
            "indicadores": [
                {"indicador": j+1, "resultado": listas[j][offset + i]}
                for j in range(7)
            ],
            "media": round(sum(listas[j][offset + i] for j in range(7)) / 7, 1),
        })

    return {
        "situacao_dado": "referencia_municipal",
        "municipio":     "Apui/AM",
        "meses":         meses,
        "historico":     historico,
    }


@router.get("/equipes")
async def indicadores_por_equipe(
    ibge: str = Query(_IBGE, regex=r"^\d{7}$"),
    _: UserOut = Depends(get_current_user),
):
    """Indicadores Previne Brasil por equipe ESF — referencia municipal."""
    equipes = [
        {
            "ine":          "0000735456",
            "nome":         "ESF Apui Centro",
            "ubs":          "UBS Central Apui",
            "tipo":         "ESF",
            "situacao_dado": "referencia_municipal",
            "indicadores": [
                {"indicador": 1, "resultado": 65.3},
                {"indicador": 2, "resultado": 44.2},
                {"indicador": 3, "resultado": 90.1},
                {"indicador": 4, "resultado": 57.8},
                {"indicador": 5, "resultado": 50.1},
                {"indicador": 6, "resultado": 41.2},
                {"indicador": 7, "resultado": 31.5},
            ],
        },
        {
            "ine":          "0000735457",
            "nome":         "ESF Jardim Paraiso",
            "ubs":          "UBS Jardim Paraiso",
            "tipo":         "ESF",
            "situacao_dado": "referencia_municipal",
            "indicadores": [
                {"indicador": 1, "resultado": 61.0},
                {"indicador": 2, "resultado": 40.5},
                {"indicador": 3, "resultado": 87.3},
                {"indicador": 4, "resultado": 53.2},
                {"indicador": 5, "resultado": 47.6},
                {"indicador": 6, "resultado": 37.8},
                {"indicador": 7, "resultado": 28.9},
            ],
        },
        {
            "ine":          "0000735458",
            "nome":         "ESF Nova Esperanca",
            "ubs":          "UBS Nova Esperanca",
            "tipo":         "ESF",
            "situacao_dado": "referencia_municipal",
            "indicadores": [
                {"indicador": 1, "resultado": 60.2},
                {"indicador": 2, "resultado": 41.1},
                {"indicador": 3, "resultado": 88.0},
                {"indicador": 4, "resultado": 54.0},
                {"indicador": 5, "resultado": 48.2},
                {"indicador": 6, "resultado": 38.1},
                {"indicador": 7, "resultado": 29.0},
            ],
        },
        {
            "ine":          "0000735459",
            "nome":         "ESF Ramal do Castanho",
            "ubs":          "UBS Ramal do Castanho",
            "tipo":         "ESF",
            "situacao_dado": "referencia_municipal",
            "indicadores": [
                {"indicador": 1, "resultado": 58.9},
                {"indicador": 2, "resultado": 38.2},
                {"indicador": 3, "resultado": 85.8},
                {"indicador": 4, "resultado": 49.4},
                {"indicador": 5, "resultado": 43.8},
                {"indicador": 6, "resultado": 33.0},
                {"indicador": 7, "resultado": 24.1},
            ],
        },
    ]

    return {
        "ibge":           ibge,
        "situacao_dado":  "referencia_municipal",
        "total_equipes":  len(equipes),
        "equipes":        equipes,
        "nota": "Referencia municipal — indicadores por equipe ESF de Apui/AM.",
    }


@router.get("/busca-ativa")
async def busca_ativa(
    indicador: int = Query(..., ge=1, le=7, description="Numero do indicador (1-7)"),
    _: UserOut = Depends(get_current_user),
):
    """Lista de pacientes elegiveis para busca ativa por indicador — referencia municipal."""
    _NOMES = {
        1: "Pre-natal >= 6 consultas",
        2: "Citopatologico do colo do utero",
        3: "Vacinacao DTP/Pentavalente",
        4: "Consulta RN na 1a semana de vida",
        5: "Acompanhamento — HAS",
        6: "Acompanhamento — DM (HbA1c)",
        7: "Cuidado Pessoas com Obesidade",
    }
    _TOTAIS = {1: (319, 198, 121), 2: (2096, 876, 1220), 3: (389, 344, 45),
               4: (319, 174, 145), 5: (1933, 933, 1000), 6: (589, 228, 361), 7: (1401, 412, 989)}

    den, num, pendentes = _TOTAIS[indicador]
    return {
        "situacao_dado":   "referencia_municipal",
        "indicador":       indicador,
        "nome":            _NOMES.get(indicador, f"Indicador {indicador}"),
        "total_elegivel":  den,
        "total_realizado": num,
        "pendentes":       pendentes,
        "pct_realizado":   round(num / den * 100, 1),
        "pacientes":       [],
        "nota": (
            "Referencia municipal — totais plausíveis para Apui/AM. "
            "Lista nominal de pacientes pendentes requer acesso ao e-SUS PEC local."
        ),
    }
