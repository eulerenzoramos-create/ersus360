"""VISA Alimentos — Vigilância Sanitária de Alimentos · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/visa-alimentos", tags=["visa_alimentos"])

@router.get("/dashboard")
async def dashboard():
    return {
        "estabelecimentos_cadastrados": 284,
        "inspecionados_ano": 198,
        "inspecionados_pct": 69.7,
        "irregulares": 48,
        "autos_infracao_ano": 32,
        "suspensoes_ativas": 6,
        "interdições_ativas": 2,
        "amostras_coletadas_ano": 64,
        "amostras_reprovadas": 8,
        "amostras_reprovadas_pct": 12.5,
        "surtos_eta_ano": 3,
        "surtos_em_investigacao": 1,
        "competencia": "Jun/2026",
        "status_geral": "atencao",
    }

@router.get("/estabelecimentos")
async def estabelecimentos():
    return [
        {"tipo": "Restaurantes e lanchonetes",    "cadastrados": 64,  "inspecionados": 52, "irregulares": 14, "suspensos": 2, "interditados": 0, "conformidade_pct": 73.1},
        {"tipo": "Mercados e supermercados",       "cadastrados": 48,  "inspecionados": 40, "irregulares": 8,  "suspensos": 1, "interditados": 1, "conformidade_pct": 80.0},
        {"tipo": "Padarias e confeitarias",        "cadastrados": 28,  "inspecionados": 20, "irregulares": 6,  "suspensos": 1, "interditados": 0, "conformidade_pct": 70.0},
        {"tipo": "Açougues e peixarias",           "cadastrados": 24,  "inspecionados": 18, "irregulares": 8,  "suspensos": 2, "interditados": 1, "conformidade_pct": 55.6},
        {"tipo": "Feiras e feirantes ambulantes",  "cadastrados": 48,  "inspecionados": 24, "irregulares": 6,  "suspensos": 0, "interditados": 0, "conformidade_pct": 75.0},
        {"tipo": "Cantinas escolares (privado)",   "cadastrados": 18,  "inspecionados": 14, "irregulares": 2,  "suspensos": 0, "interditados": 0, "conformidade_pct": 85.7},
        {"tipo": "Indústria artesanal de alim.",   "cadastrados": 28,  "inspecionados": 18, "irregulares": 4,  "suspensos": 0, "interditados": 0, "conformidade_pct": 77.8},
        {"tipo": "Frigoríficos e abatedouros",     "cadastrados": 8,   "inspecionados": 6,  "irregulares": 0,  "suspensos": 0, "interditados": 0, "conformidade_pct": 100.0},
        {"tipo": "Outros (depósitos, distribuid.)", "cadastrados": 18, "inspecionados": 6,  "irregulares": 0,  "suspensos": 0, "interditados": 0, "conformidade_pct": 100.0},
    ]

@router.get("/surtos-eta")
async def surtos_eta():
    return {
        "surtos_ano": 3,
        "casos_totais": 84,
        "hospitalizados": 8,
        "obitos": 0,
        "em_investigacao": 1,
        "surtos": [
            {
                "id": 1, "data": "2026-02-14", "local": "Restaurante Popular — Bairro Kennedy",
                "agente_suspeito": "Salmonella spp.", "casos": 28, "hospitalizados": 3,
                "alimento_suspeito": "Frango assado manipulado sem controle de temperatura",
                "desfecho": "Encerrado — estabelecimento autuado e treinamento obrigatório",
                "status": "encerrado",
            },
            {
                "id": 2, "data": "2026-04-22", "local": "Evento comunitário — Linha 7",
                "agente_suspeito": "Staphylococcus aureus", "casos": 34, "hospitalizados": 4,
                "alimento_suspeito": "Maionese caseira mantida fora da cadeia fria por 6+ horas",
                "desfecho": "Encerrado — orientação coletiva e reforço SENAR",
                "status": "encerrado",
            },
            {
                "id": 3, "data": "2026-06-08", "local": "Cantina Escola Estadual — Centro",
                "agente_suspeito": "Investigação em andamento", "casos": 22, "hospitalizados": 1,
                "alimento_suspeito": "Suspeita: suco de frutas fermentado",
                "desfecho": "Amostras enviadas ao LACEN/AM — resultado em 15 dias",
                "status": "em_investigacao",
            },
        ],
    }

@router.get("/historico")
async def historico():
    return [
        {"ano": 2022, "inspecoes": 148, "irregulares": 72, "autos": 48, "surtos": 2, "conformidade_pct": 51.4},
        {"ano": 2023, "inspecoes": 164, "irregulares": 64, "autos": 40, "surtos": 4, "conformidade_pct": 61.0},
        {"ano": 2024, "inspecoes": 172, "irregulares": 58, "autos": 38, "surtos": 3, "conformidade_pct": 66.3},
        {"ano": 2025, "inspecoes": 184, "irregulares": 54, "autos": 36, "surtos": 2, "conformidade_pct": 70.7},
        {"ano": 2026, "inspecoes": 198, "irregulares": 48, "autos": 32, "surtos": 3, "conformidade_pct": 75.8},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura de inspeção anual",         "valor": 69.7, "meta": 80.0, "unidade": "%","status": "atencao", "observacao": "86 estabelecimentos sem inspeção — açougues e peixarias com menor cobertura"},
        {"indicador": "Estabelecimentos em conformidade",    "valor": 75.8, "meta": 85.0, "unidade": "%","status": "atencao", "observacao": "Açougues/peixarias com menor conformidade (55.6%) — risco de surtos hídrico-alimentares"},
        {"indicador": "Amostras de alimentos reprovadas",    "valor": 12.5, "meta": 5.0,  "unidade": "%","status": "atencao", "observacao": "8/64 amostras fora do padrão — coliformes e contagem de S. aureus os mais frequentes"},
        {"indicador": "Surtos de ETA investigados",          "valor": 3,    "meta": 0,    "unidade": "n", "status": "atencao","observacao": "1 surto ainda em investigação — Escola Estadual Centro"},
        {"indicador": "Estabelecimentos interditados ativos","valor": 2,    "meta": 0,    "unidade": "n", "status": "atencao","observacao": "Açougue Linha 7 e Supermercado BK interditos por condição insalubre"},
        {"indicador": "Treinamento BPF — cobertura",         "valor": 42.6, "meta": 70.0, "unidade": "%","status": "critico", "observacao": "Programa BPF 2026 com 121 manipuladores capacitados de 284 previstos"},
    ]
