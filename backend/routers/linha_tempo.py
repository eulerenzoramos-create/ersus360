"""
Router: /api/linha-tempo — Linha do Tempo Unificada do Cidadão — ERSUS 360
Dados de referência anonimizados — Apuí/AM. situacao_dado = referencia_municipal.
Nenhum dado real de paciente é exibido.
"""
from __future__ import annotations
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/linha-tempo", tags=["linha-tempo"])

_TS = "2026-08-13T00:00:00Z"

_CIDADAO_DEMO = {
    "cns_hash": "DEMO-ANONIMO",
    "municipio": "Apuí/AM",
    "sexo": "F",
    "faixa_etaria": "30-39 anos",
    "equipe_esf": "ESF Centro",
    "unidade_referencia": "UBS Central Apuí",
}

_EVENTOS_DEMO = [
    {
        "id": "EVT-001",
        "data": "2025-01-08",
        "tipo": "consulta_medica",
        "descricao": "Consulta clínica — queixa respiratória",
        "unidade": "UBS Central Apuí",
        "profissional_categoria": "Médico Clínico Geral",
        "fonte": "e-SUS PEC",
        "cid10": "J06",
        "conduta": "Prescrição medicamentosa",
    },
    {
        "id": "EVT-002",
        "data": "2025-02-14",
        "tipo": "vacina",
        "descricao": "Vacinação — dTpa (reforço adulto)",
        "unidade": "Sala de Vacinas Central",
        "profissional_categoria": "Técnica de Enfermagem",
        "fonte": "SIPNI",
        "imunobiologico": "dTpa",
        "lote": "XXX",
    },
    {
        "id": "EVT-003",
        "data": "2025-03-05",
        "tipo": "exame",
        "descricao": "Coleta citopatológico do colo uterino",
        "unidade": "ESF Centro",
        "profissional_categoria": "Enfermeira",
        "fonte": "e-SUS PEC",
        "resultado": "pendente",
    },
    {
        "id": "EVT-004",
        "data": "2025-03-20",
        "tipo": "resultado_exame",
        "descricao": "Resultado citopatológico — negativo para malignidade",
        "unidade": "Laboratório Municipal",
        "fonte": "SISCAN",
        "resultado": "negativo",
    },
    {
        "id": "EVT-005",
        "data": "2025-04-10",
        "tipo": "consulta_enfermagem",
        "descricao": "Consulta de enfermagem — pré-natal (4ª consulta)",
        "unidade": "ESF Centro",
        "profissional_categoria": "Enfermeira",
        "fonte": "e-SUS PEC",
        "semanas_gestacionais": 24,
    },
    {
        "id": "EVT-006",
        "data": "2025-04-10",
        "tipo": "prescricao",
        "descricao": "Prescrição — sulfato ferroso + ácido fólico",
        "unidade": "ESF Centro",
        "fonte": "e-SUS PEC",
        "medicamentos": ["Sulfato Ferroso 40mg", "Ácido Fólico 5mg"],
    },
    {
        "id": "EVT-007",
        "data": "2025-05-22",
        "tipo": "visita_domiciliar",
        "descricao": "Visita domiciliar — ACS — monitoramento pré-natal",
        "unidade": "ESF Centro",
        "profissional_categoria": "Agente Comunitário de Saúde",
        "fonte": "e-SUS PEC",
    },
    {
        "id": "EVT-008",
        "data": "2025-06-18",
        "tipo": "consulta_medica",
        "descricao": "Consulta pré-natal (6ª) + solicitação US obstétrica",
        "unidade": "UBS Central Apuí",
        "profissional_categoria": "Médico Clínico Geral",
        "fonte": "e-SUS PEC",
        "cid10": "Z34",
        "exames_solicitados": ["Ultrassonografia obstétrica morfológica"],
    },
    {
        "id": "EVT-009",
        "data": "2025-07-30",
        "tipo": "regulacao",
        "descricao": "Encaminhamento TFD — consulta ginecológica Humaitá/AM",
        "unidade": "Central de Regulação Apuí",
        "fonte": "SISREG",
        "especialidade": "Ginecologia",
        "municipio_referencia": "Humaitá/AM",
        "status": "agendado",
    },
]


@router.get("/cidadao")
async def buscar_cidadao(cns: str = Query(...)):
    return {
        "cns": cns,
        "situacao_dado": "referencia_municipal",
        "nota": "Dados anonimizados de referência. Cidadão real requer integração RNDS + e-SUS PEC.",
        "municipio": "Apuí/AM",
        "perfil": _CIDADAO_DEMO,
        "total_eventos": len(_EVENTOS_DEMO),
        "verificado_em": _TS,
    }


@router.get("/eventos")
async def listar_eventos(
    cns: str = Query(...),
    fontes: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
):
    eventos = list(_EVENTOS_DEMO)
    if tipo:
        eventos = [e for e in eventos if e["tipo"] == tipo]
    if fontes:
        fontes_list = [f.strip() for f in fontes.split(",")]
        eventos = [e for e in eventos if e.get("fonte") in fontes_list]
    return {
        "cns": cns,
        "situacao_dado": "referencia_municipal",
        "nota": "Eventos anonimizados de referência — Apuí/AM.",
        "total_eventos": len(eventos),
        "eventos": eventos,
        "verificado_em": _TS,
    }
