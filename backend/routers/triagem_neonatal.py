"""Triagem Neonatal — Pezinho, Olhinho, Orelhinha, Coraçãozinho, Quadril · FMS Apuí/AM"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/triagem-neonatal", tags=["triagem_neonatal"])

@lru_cache(maxsize=1)
def _TESTES():
    return [
        {
            "teste": "Teste do Pezinho",
            "sigla": "TNDM",
            "prazo_ideal": "3–5 dias de vida",
            "realizados_ano": 156,
            "cobertura_pct": 94.5,
            "no_prazo_pct": 72.4,
            "alterados": 3,
            "em_acompanhamento": 3,
            "doencas_rastreadas": ["PKU","Hipotireoidismo","Anemia Falciforme","Fibrose Cística","Hiperplasia Adrenal Congênita"],
            "confirmados_2026": {"PKU": 0, "Hipotireoidismo": 2, "Anemia Falciforme": 1, "Fibrose Cística": 0, "HAC": 0},
            "status": "atencao",
        },
        {
            "teste": "Teste do Olhinho",
            "sigla": "TRV",
            "prazo_ideal": "Antes da alta hospitalar",
            "realizados_ano": 148,
            "cobertura_pct": 89.7,
            "no_prazo_pct": 88.5,
            "alterados": 2,
            "em_acompanhamento": 2,
            "doencas_rastreadas": ["Catarata congênita","Glaucoma congênito","Retinoblastoma","Outros"],
            "confirmados_2026": {"Catarata congênita": 1, "Outros alterados": 1},
            "status": "atencao",
        },
        {
            "teste": "Teste da Orelhinha",
            "sigla": "TANU",
            "prazo_ideal": "Até 30 dias de vida",
            "realizados_ano": 142,
            "cobertura_pct": 86.1,
            "no_prazo_pct": 64.8,
            "alterados": 8,
            "em_acompanhamento": 6,
            "doencas_rastreadas": ["Perda auditiva bilateral","PAIR neonatal","Neuropatia auditiva"],
            "confirmados_2026": {"Perda auditiva bilateral": 2, "Neuropatia auditiva": 1},
            "status": "critico",
        },
        {
            "teste": "Teste do Coraçãozinho",
            "sigla": "POX",
            "prazo_ideal": "Entre 24–48h de vida",
            "realizados_ano": 158,
            "cobertura_pct": 95.8,
            "no_prazo_pct": 94.3,
            "alterados": 1,
            "em_acompanhamento": 1,
            "doencas_rastreadas": ["Cardiopatias congênitas críticas"],
            "confirmados_2026": {"CCC": 1},
            "status": "ok",
        },
        {
            "teste": "Teste do Quadrilzinho",
            "sigla": "USG",
            "prazo_ideal": "Até 6 semanas de vida",
            "realizados_ano": 112,
            "cobertura_pct": 67.9,
            "no_prazo_pct": 58.0,
            "alterados": 4,
            "em_acompanhamento": 4,
            "doencas_rastreadas": ["Displasia do desenvolvimento do quadril"],
            "confirmados_2026": {"DDQ": 4},
            "status": "critico",
        },
    ]


@router.get("/dashboard")
async def dashboard():
    return {
        "nascidos_vivos_ano": 165,
        "cobertura_media_pct": 86.8,
        "testes_realizados_total": 716,
        "alterados_total": 18,
        "em_acompanhamento": 16,
        "confirmados_total": 13,
        "tratamentos_iniciados": 12,
        "teste_pezinho_cobertura": 94.5,
        "teste_orelhinha_cobertura": 86.1,
        "teste_quadril_cobertura": 67.9,
        "teste_olhinho_cobertura": 89.7,
        "teste_coracao_cobertura": 95.8,
        "testes_criticos": 2,
        "prazo_medio_resultado_dias": 18,
        "status_geral": "atencao",
        "competencia": "Jun/2026",
    }

@router.get("/testes")
async def testes():
    return _TESTES()

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "nascidos": 11, "pezinho_pct": 90.9, "orelhinha_pct": 81.8, "coracao_pct": 90.9, "quadril_pct": 63.6},
        {"mes": "Fev/26", "nascidos": 12, "pezinho_pct": 91.7, "orelhinha_pct": 83.3, "coracao_pct": 91.7, "quadril_pct": 66.7},
        {"mes": "Mar/26", "nascidos": 13, "pezinho_pct": 92.3, "orelhinha_pct": 84.6, "coracao_pct": 92.3, "quadril_pct": 69.2},
        {"mes": "Abr/26", "nascidos": 12, "pezinho_pct": 100.0,"orelhinha_pct": 91.7, "coracao_pct": 100.0,"quadril_pct": 75.0},
        {"mes": "Mai/26", "nascidos": 13, "pezinho_pct": 92.3, "orelhinha_pct": 84.6, "coracao_pct": 92.3, "quadril_pct": 69.2},
        {"mes": "Jun/26", "nascidos": 14, "pezinho_pct": 100.0,"orelhinha_pct": 92.9, "coracao_pct": 100.0,"quadril_pct": 71.4},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura teste do pezinho",             "valor": 94.5, "meta": 100.0, "unidade": "%", "status": "ok",      "observacao": "Meta próxima — 9 RN sem coleta (7 domiciliares ribeirinhos + 2 óbitos precoces)"},
        {"indicador": "Teste do pezinho no prazo (3–5 dias)",   "valor": 72.4, "meta": 95.0,  "unidade": "%", "status": "critico", "observacao": "27% fora do prazo — parto domiciliar rural e RN ribeirinho chegam à UBS após 10 dias"},
        {"indicador": "Cobertura teste da orelhinha",           "valor": 86.1, "meta": 95.0,  "unidade": "%", "status": "atencao", "observacao": "Equipamento BERA não disponível no município — TANU apenas emissão otoacústica; encaminham a Humaitá para BERA"},
        {"indicador": "Cobertura teste do quadrilzinho",        "valor": 67.9, "meta": 95.0,  "unidade": "%", "status": "critico", "observacao": "Ultrassom de quadril depende de agenda em Humaitá/AM — espera média 28 dias para agendamento"},
        {"indicador": "Casos confirmados em tratamento",        "valor": 92.3, "meta": 100.0, "unidade": "%", "status": "ok",      "observacao": "12/13 confirmados em tratamento — 1 família sem comparecimento após convocação (3 tentativas)"},
        {"indicador": "Hipotireoidismo congênito — confirmados","valor": 2,    "meta": None,  "unidade": "n", "status": "atencao", "observacao": "2 casos em 2026 — ambos em tratamento com levotiroxina; controle laboratorial trimestral"},
    ]