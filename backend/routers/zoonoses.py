"""
Router: /api/zoonoses — Controle de Zoonoses · Raiva · Ofidismo · Escorpionismo · Leptospirose — FMS Apuí/AM
Dados de referência municipal. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/zoonoses", tags=["zoonoses"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jul/2026",
        "acidentes_ofidicos_mes": 4,
        "acidentes_escorpionismo_mes": 2,
        "cobertura_raiva_pct": 88,
        "meta_raiva_pct": 95,
        "leptospirose_casos_mes": 3,
        "fonte": "Referência municipal FMS Apuí/AM",
    }


@router.get("/historico")
async def historico():
    return [
        {"mes": "Fev", "ofidismo": 3, "escorpionismo": 1, "araneismo": 0, "leptospirose": 1},
        {"mes": "Mar", "ofidismo": 5, "escorpionismo": 2, "araneismo": 1, "leptospirose": 2},
        {"mes": "Abr", "ofidismo": 6, "escorpionismo": 3, "araneismo": 1, "leptospirose": 3},
        {"mes": "Mai", "ofidismo": 4, "escorpionismo": 2, "araneismo": 0, "leptospirose": 2},
        {"mes": "Jun", "ofidismo": 3, "escorpionismo": 2, "araneismo": 0, "leptospirose": 2},
        {"mes": "Jul", "ofidismo": 4, "escorpionismo": 2, "araneismo": 0, "leptospirose": 3},
    ]


@router.get("/acidentes")
async def acidentes():
    return [
        {
            "tipo": "Ofidismo",
            "especie_principal": "Bothrops atrox (jararaca)",
            "casos_mes": 4,
            "casos_graves": 1,
            "obitos": 0,
            "status": "atencao",
            "soro_disponivel": True,
            "doses_soro": 18,
            "tempo_atend_medio_h": 3.2,
            "meta_tempo_h": 6,
            "locais_ocorrencia": ["Zona rural km 160–200", "Assentamento São João", "Garimpo"],
        },
        {
            "tipo": "Escorpionismo",
            "especie_principal": "Tityus obscurus",
            "casos_mes": 2,
            "casos_graves": 0,
            "obitos": 0,
            "status": "ok",
            "soro_disponivel": True,
            "doses_soro": 6,
            "tempo_atend_medio_h": 1.8,
            "meta_tempo_h": 4,
            "locais_ocorrencia": ["Centro", "Nova Apuí"],
        },
        {
            "tipo": "Araneismo",
            "especie_principal": "Phoneutria sp.",
            "casos_mes": 0,
            "casos_graves": 0,
            "obitos": 0,
            "status": "ok",
            "soro_disponivel": True,
            "doses_soro": 4,
            "tempo_atend_medio_h": None,
            "meta_tempo_h": 4,
            "locais_ocorrencia": ["Zona rural"],
        },
        {
            "tipo": "Leptospirose",
            "especie_principal": "Leptospira spp.",
            "casos_mes": 3,
            "casos_graves": 1,
            "obitos": 0,
            "status": "atencao",
            "soro_disponivel": None,
            "doses_soro": None,
            "tempo_atend_medio_h": None,
            "meta_tempo_h": None,
            "locais_ocorrencia": ["Bairro São Francisco (área alagada)", "Ribeirão do Apuí"],
        },
    ]


@router.get("/raiva")
async def raiva():
    return {
        "situacao_dado": "referencia_municipal",
        "cobertura_pct": 88,
        "vacinados_campanha": 3520,
        "total_caes_estimado": 4000,
        "cobertura_felina_pct": 74,
        "gatos_vacinados": 890,
        "total_gatos_estimado": 1200,
        "casos_humanos_ano": 0,
        "focos_positivos_ano": 0,
        "alertas": [
            "Cobertura canina 88% — abaixo da meta de 95%. Reforço necessário na zona rural.",
            "Bairro São Francisco: cobertura estimada 71%. Agendamento de vacinação avulsa.",
        ],
        "fonte": "Referência municipal FMS Apuí/AM (PNRH 2026)",
    }
