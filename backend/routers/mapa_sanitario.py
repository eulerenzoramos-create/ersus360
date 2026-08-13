"""
Router: /api/mapa-sanitario — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/mapa-sanitario", tags=["mapa-sanitario"])

_TS = "2026-08-13T00:00:00Z"

_UNIDADES = [
    {
        "cnes": "2802090",
        "nome": "UBS Central Apuí",
        "tipo": "UBS",
        "natureza": "publico_municipal",
        "logradouro": "Av. Paraná, 550 — Centro",
        "bairro": "Centro",
        "lat": -7.1950,
        "lon": -59.8880,
        "telefone": "(97) 3566-1234",
        "horario": "07h–17h (seg–sex)",
        "servicos": ["Clínica Geral", "Enfermagem", "Odontologia", "Imunização", "Laboratório", "Ultrassonografia", "Raio-X"],
        "equipes_esf": 1,
        "situacao": "ativa",
        "populacao_adscrita": 5200,
    },
    {
        "cnes": "2802104",
        "nome": "ESF Centro",
        "tipo": "ESF",
        "natureza": "publico_municipal",
        "logradouro": "Rua Goiás, 120 — Centro",
        "bairro": "Centro",
        "lat": -7.1960,
        "lon": -59.8895,
        "telefone": "(97) 3566-1250",
        "horario": "07h–17h (seg–sex)",
        "servicos": ["Clínica Geral", "Enfermagem", "Odontologia", "ACS", "Visita Domiciliar"],
        "equipes_esf": 1,
        "situacao": "ativa",
        "populacao_adscrita": 4800,
    },
    {
        "cnes": "2802112",
        "nome": "ESF Bairro Novo",
        "tipo": "ESF",
        "natureza": "publico_municipal",
        "logradouro": "Rua Minas Gerais, 45 — Bairro Novo",
        "bairro": "Bairro Novo",
        "lat": -7.2010,
        "lon": -59.8840,
        "telefone": "(97) 3566-1270",
        "horario": "07h–17h (seg–sex)",
        "servicos": ["Clínica Geral", "Enfermagem", "ACS", "Visita Domiciliar"],
        "equipes_esf": 1,
        "situacao": "ativa",
        "populacao_adscrita": 4600,
    },
    {
        "cnes": "2802120",
        "nome": "ESF Rio Juma",
        "tipo": "ESF",
        "natureza": "publico_municipal",
        "logradouro": "Ramal Rio Juma — Zona Rural (Km 12)",
        "bairro": "Zona Rural",
        "lat": -7.2200,
        "lon": -59.9100,
        "telefone": None,
        "horario": "07h–13h (seg–sex)",
        "servicos": ["Enfermagem", "ACS", "Visita Domiciliar"],
        "equipes_esf": 0,
        "situacao": "ativa_sem_medico",
        "populacao_adscrita": 3100,
        "obs": "Atendimento médico itinerante quinzenal",
    },
    {
        "cnes": "2802138",
        "nome": "Vigilância Sanitária Municipal",
        "tipo": "VISA",
        "natureza": "publico_municipal",
        "logradouro": "Sede Prefeitura — Rua Central, s/n",
        "bairro": "Centro",
        "lat": -7.1940,
        "lon": -59.8870,
        "telefone": "(97) 3566-1200",
        "horario": "08h–14h (seg–sex)",
        "servicos": ["Inspeção sanitária", "Alvarás", "Educação sanitária"],
        "equipes_esf": 0,
        "situacao": "ativa",
        "populacao_adscrita": None,
    },
]


@router.get("/resumo")
async def resumo():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí",
        "ibge": "1300144",
        "uf": "AM",
        "total_unidades": len(_UNIDADES),
        "ubs": sum(1 for u in _UNIDADES if u["tipo"] == "UBS"),
        "esf": sum(1 for u in _UNIDADES if u["tipo"] == "ESF"),
        "visa": sum(1 for u in _UNIDADES if u["tipo"] == "VISA"),
        "populacao_coberta": sum(u["populacao_adscrita"] or 0 for u in _UNIDADES),
        "equipes_esf_ativas": sum(u["equipes_esf"] for u in _UNIDADES),
        "cobertura_esf_pct": 78.5,
        "verificado_em": _TS,
    }


@router.get("/unidades")
async def unidades(tipo: Optional[str] = Query(None)):
    items = list(_UNIDADES)
    if tipo:
        items = [u for u in items if u["tipo"].lower() == tipo.lower()]
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(items),
        "unidades": items,
        "verificado_em": _TS,
    }
