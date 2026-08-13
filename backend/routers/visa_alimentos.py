"""
Router: /api/visa-alimentos — Vigilância Sanitária de Alimentos · Surtos ETA — FMS Apuí/AM
Dados de referência municipal. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/visa-alimentos", tags=["visa_alimentos"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2026",
        "total_estabelecimentos_alimentos": 62,
        "inspecionados_ano": 41,
        "resultado_bom": 26,
        "resultado_regular": 11,
        "resultado_insatisfatorio": 4,
        "licencas_vencidas": 10,
        "autos_abertos": 5,
        "autos_vencidos": 2,
        "proximas_inspecoes": 12,
        "historico": [
            {"mes": "Fev",  "realizadas": 6,  "programadas": 7},
            {"mes": "Mar",  "realizadas": 7,  "programadas": 8},
            {"mes": "Abr",  "realizadas": 8,  "programadas": 8},
            {"mes": "Mai",  "realizadas": 7,  "programadas": 8},
            {"mes": "Jun",  "realizadas": 8,  "programadas": 8},
            {"mes": "Jul",  "realizadas": 5,  "programadas": 7},
        ],
        "fonte": "Referência municipal FMS Apuí/AM",
    }


@router.get("/estabelecimentos")
async def estabelecimentos():
    return [
        {
            "razao": "Panificadora Pão de Ouro",
            "atividade": "Panificação",
            "risco": "medio",
            "ultima_inspecao": "2026-04-22",
            "proxima_inspecao": "2026-10-22",
            "resultado": "bom",
            "licenca_valida": True,
            "autos": 0,
        },
        {
            "razao": "Mercado do Norte",
            "atividade": "Mercado / Mercearia",
            "risco": "alto",
            "ultima_inspecao": "2026-03-10",
            "proxima_inspecao": "2026-09-10",
            "resultado": "regular",
            "licenca_valida": True,
            "autos": 1,
        },
        {
            "razao": "Açougue Irmãos Dias",
            "atividade": "Carnes e derivados",
            "risco": "alto",
            "ultima_inspecao": "2026-06-05",
            "proxima_inspecao": "2026-09-05",
            "resultado": "insatisfatorio",
            "licenca_valida": True,
            "autos": 2,
        },
        {
            "razao": "Lanchonete da Escola",
            "atividade": "Alimentação coletiva",
            "risco": "alto",
            "ultima_inspecao": "2026-05-18",
            "proxima_inspecao": "2026-11-18",
            "resultado": "bom",
            "licenca_valida": True,
            "autos": 0,
        },
        {
            "razao": "Restaurante A Floresta",
            "atividade": "Restaurante",
            "risco": "alto",
            "ultima_inspecao": "2026-02-28",
            "proxima_inspecao": "2026-08-28",
            "resultado": "regular",
            "licenca_valida": False,
            "autos": 1,
        },
        {
            "razao": "Depósito de Bebidas Apuí",
            "atividade": "Bebidas e embalagens",
            "risco": "medio",
            "ultima_inspecao": "2026-01-15",
            "proxima_inspecao": "2026-07-15",
            "resultado": "bom",
            "licenca_valida": False,
            "autos": 0,
        },
    ]


@router.get("/surtos-eta")
async def surtos_eta():
    return {
        "situacao_dado": "referencia_municipal",
        "total_surtos_ano": 2,
        "doentes_total": 18,
        "hospitalizados": 2,
        "obitos": 0,
        "surtos": [
            {
                "id": "ETA2026001",
                "data": "2026-03-12",
                "local": "Restaurante O Ribeirinho",
                "agente_provavel": "Salmonella spp.",
                "alimento_suspeito": "Frango grelhado (T° incorreta)",
                "doentes": 11,
                "hospitalizados": 1,
                "obitos": 0,
                "encerrado": True,
                "conduta": "Interdição temporária + treinamento manipuladores. Reaberto em 26/03.",
            },
            {
                "id": "ETA2026002",
                "data": "2026-06-08",
                "local": "Evento comunitário — bairro Nova Apuí",
                "agente_provavel": "Staphylococcus aureus",
                "alimento_suspeito": "Maionese de festa (conservação inadequada)",
                "doentes": 7,
                "hospitalizados": 1,
                "obitos": 0,
                "encerrado": True,
                "conduta": "Amostra coletada e enviada ao LACEN-AM. Educação em saúde alimentar.",
            },
        ],
    }


@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan", "inspecoes": 5, "surtos": 0, "conformidade_pct": 88},
        {"mes": "Fev", "inspecoes": 6, "surtos": 0, "conformidade_pct": 86},
        {"mes": "Mar", "inspecoes": 7, "surtos": 1, "conformidade_pct": 82},
        {"mes": "Abr", "inspecoes": 8, "surtos": 0, "conformidade_pct": 84},
        {"mes": "Mai", "inspecoes": 7, "surtos": 0, "conformidade_pct": 87},
        {"mes": "Jun", "inspecoes": 8, "surtos": 1, "conformidade_pct": 80},
        {"mes": "Jul", "inspecoes": 5, "surtos": 0, "conformidade_pct": 88},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {
            "indicador": "Taxa de conformidade das inspeções",
            "valor": 85, "unidade": "%",
            "meta": 90,
            "status": "atencao",
            "observacao": "15% dos estabelecimentos com resultado regular ou insatisfatório. Meta VISA: 90% conformes.",
        },
        {
            "indicador": "Licenças sanitárias válidas",
            "valor": 84, "unidade": "%",
            "meta": 100,
            "status": "atencao",
            "observacao": "10 estabelecimentos com licença vencida. Notificação emitida para regularização em 30 dias.",
        },
        {
            "indicador": "Tempo médio de resposta a surto ETA",
            "valor": 18, "unidade": "horas",
            "meta": 24,
            "status": "ok",
            "observacao": "Tempo médio de investigação abaixo de 24h conforme PNVSA.",
        },
        {
            "indicador": "Cobertura de inspeção anual",
            "valor": 66, "unidade": "%",
            "meta": 80,
            "status": "atencao",
            "observacao": "41 de 62 estabelecimentos inspecionados em 2026. 12 inspeções programadas para 2º semestre.",
        },
    ]
