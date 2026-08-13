"""
Router: /api/pics — PICS Práticas Integrativas e Complementares
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
Ofertas ativas: Acupuntura, Fitoterapia, Meditação/Mindfulness,
Auriculoterapia, Arteterapia. Sem médico acupunturista local —
profissional itinerante quinzenal (via TFD invertido).
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/pics", tags=["pics"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "atendimentos_mes": 214,
        "aumento_atendimentos_pct": 12,
        "satisfacao_pct": 93,
        "modalidades_ativas": 5,
        "profissionais_habilitados": 4,
        "reducao_encaminhamentos_especialidade_pct": 11,
        "usuarios_ativos": 148,
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan", "acupuntura": 28, "fitoterapia": 41, "satisfacao_pct": 90},
        {"mes": "Fev", "acupuntura": 31, "fitoterapia": 44, "satisfacao_pct": 91},
        {"mes": "Mar", "acupuntura": 33, "fitoterapia": 47, "satisfacao_pct": 92},
        {"mes": "Abr", "acupuntura": 35, "fitoterapia": 49, "satisfacao_pct": 92},
        {"mes": "Mai", "acupuntura": 37, "fitoterapia": 52, "satisfacao_pct": 93},
        {"mes": "Jun", "acupuntura": 38, "fitoterapia": 54, "satisfacao_pct": 93},
    ]


@router.get("/modalidades")
async def modalidades():
    return [
        {
            "modalidade": "Auriculoterapia",
            "profissional": "Enf. Simone Ramos — COFEN/AURICULO",
            "carga_semanal_h": 8,
            "atendimentos_mes": 72,
            "pacientes_ativos": 54,
            "status": "ok",
            "observacao": None,
        },
        {
            "modalidade": "Fitoterapia",
            "profissional": "Farm. Cláudia Mota — CRF-AM 1234",
            "carga_semanal_h": 8,
            "atendimentos_mes": 54,
            "pacientes_ativos": 38,
            "status": "ok",
            "observacao": "Horto medicinal ativo na UBS Centro — 18 espécies.",
        },
        {
            "modalidade": "Acupuntura",
            "profissional": "Dr. Renato Prado — CRM-AM 4567 (itinerante qz)",
            "carga_semanal_h": 4,
            "atendimentos_mes": 38,
            "pacientes_ativos": 29,
            "status": "atencao",
            "observacao": "Profissional itinerante quinzenal — fila de espera 22 pacientes.",
        },
        {
            "modalidade": "Meditação / Mindfulness",
            "profissional": "Psic. Tânia Alves — CRP 12-5678",
            "carga_semanal_h": 4,
            "atendimentos_mes": 32,
            "pacientes_ativos": 21,
            "status": "ok",
            "observacao": "Grupos de 8 pessoas — alta adesão pós-pandemia.",
        },
        {
            "modalidade": "Arteterapia",
            "profissional": "T.O. Fernanda Costa — COFFITO 98765",
            "carga_semanal_h": 4,
            "atendimentos_mes": 18,
            "pacientes_ativos": 6,
            "status": "ok",
            "observacao": "Grupos saúde mental — vinculado ao CAPS I.",
        },
    ]


@router.get("/grupos-especiais")
async def grupos_especiais():
    return [
        {
            "grupo": "Dor crônica (lombalgia, artrose)",
            "participantes": 41,
            "pics_ofertadas": ["Acupuntura", "Auriculoterapia"],
            "status": "ok",
        },
        {
            "grupo": "Ansiedade e estresse",
            "participantes": 38,
            "pics_ofertadas": ["Meditação / Mindfulness", "Auriculoterapia"],
            "status": "ok",
        },
        {
            "grupo": "HAS / DM — complementar",
            "participantes": 34,
            "pics_ofertadas": ["Fitoterapia", "Meditação / Mindfulness"],
            "status": "ok",
        },
        {
            "grupo": "Tabagismo",
            "participantes": 12,
            "pics_ofertadas": ["Auriculoterapia", "Acupuntura"],
            "status": "atencao",
        },
        {
            "grupo": "Saúde mental — CAPS",
            "participantes": 23,
            "pics_ofertadas": ["Arteterapia", "Meditação / Mindfulness"],
            "status": "ok",
        },
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Satisfação do usuário PICS",                  "valor": 93, "meta": 90, "unidade": "%",      "status": "ok",      "observacao": "Alta aceitação — principal: auriculoterapia e fitoterapia."},
        {"indicador": "Cobertura PICS / população",                  "valor": 0.7,"meta": 2,  "unidade": "%",      "status": "critico", "observacao": "Abaixo da recomendação PNPICS. Oferta limitada a 2 UBS."},
        {"indicador": "Lista de espera acupuntura (dias)",           "valor": 32, "meta": 14, "unidade": "dias",   "status": "critico", "observacao": "Profissional itinerante — gargalo de oferta."},
        {"indicador": "Modalidades ofertadas no município",           "valor": 5,  "meta": 8,  "unidade": "modal.", "status": "atencao", "observacao": "Faltam: homeopatia, termalismo, meditação avançada."},
        {"indicador": "Redução encaminhamentos dor crônica",         "valor": 11, "meta": 15, "unidade": "%",      "status": "atencao", "observacao": "Impacto positivo na fila de fisioterapia."},
        {"indicador": "Horto medicinal — espécies cultivadas",       "valor": 18, "meta": 20, "unidade": "espécies","status": "atencao","observacao": "Meta PNPICS: 20 espécies mínimas para fitoterapia."},
    ]
