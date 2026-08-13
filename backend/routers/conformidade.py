"""
Router: /api/conformidade — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/conformidade", tags=["Conformidade"])

_TS = "2026-08-13T00:00:00Z"

_ITENS = [
    {"id": "C01", "norma": "EC 29/2000 — Aplicação mínima 15% em saúde",          "situacao": "conforme",       "valor_verificado": "18,4%",       "prazo": "anual",              "observacao": "Apurado em SIOPS"},
    {"id": "C02", "norma": "Lei 8.142/90 — RDQA aprovado pelo CMS",               "situacao": "conforme",       "valor_verificado": "3/3 RDQA 2025","prazo": "quadrimestral",      "observacao": "Resoluções CMS 03, 05/2025 e pendente Q3"},
    {"id": "C03", "norma": "Lei 8.142/90 — RAG aprovado pelo CMS",                "situacao": "conforme",       "valor_verificado": "RAG 2024 aprovado","prazo": "anual",           "observacao": "Resolução CMS 02/2025"},
    {"id": "C04", "norma": "Res. CIT — PMS vigente e publicado",                  "situacao": "conforme",       "valor_verificado": "PMS 2022-2025","prazo": "quadrienal",         "observacao": "Aprovado CMS Resolução 02/2022"},
    {"id": "C05", "norma": "SCNES — Cadastro de estabelecimentos atualizado",     "situacao": "conforme",       "valor_verificado": "4 unidades ativas","prazo": "mensal",          "observacao": "Última atualização ago/2025"},
    {"id": "C06", "norma": "SIOPS — Declaração enviada",                          "situacao": "conforme",       "valor_verificado": "Enviado",      "prazo": "bimestral",          "observacao": "Bimestre mai-jun/2025 enviado"},
    {"id": "C07", "norma": "CF Art. 198 — Fundo Municipal de Saúde ativo",        "situacao": "conforme",       "valor_verificado": "FMS ativo",    "prazo": "permanente",         "observacao": "CNPJ ativo, conta bancária exclusiva"},
    {"id": "C08", "norma": "Portaria GM 2.436/2017 — ESF com equipe completa",   "situacao": "atencao",        "valor_verificado": "2/3 equipes completas","prazo": "permanente",   "observacao": "ESF Rio Juma sem médico regular"},
    {"id": "C09", "norma": "RDC ANVISA 36/2013 — Vigilância Sanitária Hospitalar","situacao": "nao_aplicavel",  "valor_verificado": "Sem hospital próprio","prazo": "permanente",   "observacao": "Município sem hospital municipal"},
    {"id": "C10", "norma": "Lei 9.782/99 — Vigilância Sanitária Municipal ativa", "situacao": "conforme",       "valor_verificado": "VISA ativa",   "prazo": "permanente",         "observacao": "VISA municipal com fiscal designado"},
    {"id": "C11", "norma": "RES. CFM — Prontuário eletrônico (e-SUS PEC)",        "situacao": "conforme",       "valor_verificado": "e-SUS PEC ativo","prazo": "permanente",       "observacao": "Versão 5.x em uso nas 3 ESF"},
    {"id": "C12", "norma": "Portaria MS 1.286/2013 — Ouvidoria ativa",            "situacao": "atencao",        "valor_verificado": "Ouvidoria via 136","prazo": "permanente",     "observacao": "Sem ouvidoria municipal própria — apenas 136"},
    {"id": "C13", "norma": "TCE-AM — Prestação de contas FMS em dia",             "situacao": "conforme",       "valor_verificado": "2024 prestado","prazo": "anual",              "observacao": "Contas 2024 enviadas ao TCE em mar/2025"},
    {"id": "C14", "norma": "Lei 13.587/2018 — Programa Nacional Imunização ativo","situacao": "atencao",        "valor_verificado": "DTP 88,2%",    "prazo": "permanente",         "observacao": "Meta 95% não atingida — plano de recuperação necessário"},
]


@router.get("/dashboard")
async def dashboard_conformidade(_: UserOut = Depends(get_current_user)):
    conformes = sum(1 for i in _ITENS if i["situacao"] == "conforme")
    atencao = sum(1 for i in _ITENS if i["situacao"] == "atencao")
    nao_conformes = sum(1 for i in _ITENS if i["situacao"] == "nao_conforme")
    nao_aplicavel = sum(1 for i in _ITENS if i["situacao"] == "nao_aplicavel")
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_itens_verificados": len(_ITENS),
        "conformes": conformes,
        "atencao": atencao,
        "nao_conformes": nao_conformes,
        "nao_aplicavel": nao_aplicavel,
        "percentual_conformidade": round(100 * conformes / (len(_ITENS) - nao_aplicavel), 1),
        "itens": _ITENS,
        "ultima_verificacao": "2025-08-13",
        "verificado_em": _TS,
    }


@router.get("/itens")
async def listar_itens(
    situacao: Optional[str] = Query(None),
    _: UserOut = Depends(get_current_user),
):
    itens = list(_ITENS)
    if situacao:
        itens = [i for i in itens if i["situacao"] == situacao]
    return {
        "situacao_dado": "referencia_municipal",
        "total": len(itens),
        "itens": itens,
        "verificado_em": _TS,
    }
