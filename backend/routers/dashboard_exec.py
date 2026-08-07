# -*- coding: utf-8 -*-
from fastapi import APIRouter
from datetime import datetime
from functools import lru_cache

router = APIRouter(prefix="/api/dashboard-exec", tags=["dashboard-exec"])

@lru_cache(maxsize=1)
def _BLOCOS():
    return [
        {
            "modulo": "Atencao Basica",
            "icone": "hospital",
            "indicadores": [
                {"nome": "Atendimentos/mes",        "valor": "1.913",  "status": "ok",     "tendencia": "estavel", "rota": "/producao-aps"},
                {"nome": "Cobertura ESF",           "valor": "74,2%",  "status": "alerta", "tendencia": "alta",    "rota": "/producao-aps"},
                {"nome": "Visitas domiciliares",    "valor": "1.240",  "status": "ok",     "tendencia": "estavel", "rota": "/producao-aps"},
                {"nome": "Previne Brasil Score",    "valor": "8,3",    "status": "ok",     "tendencia": "alta",    "rota": "/saude-bucal"},
            ],
        },
        {
            "modulo": "Vacinacao PNI",
            "icone": "syringe",
            "indicadores": [
                {"nome": "Cobertura media",         "valor": "76,4%",  "status": "alerta", "tendencia": "estavel", "rota": "/vacinacao"},
                {"nome": "Doses este mes",          "valor": "1.247",  "status": "ok",     "tendencia": "alta",    "rota": "/vacinacao"},
                {"nome": "Febre Amarela",           "valor": "52,1%",  "status": "critico","tendencia": "queda",   "rota": "/vacinacao"},
                {"nome": "Meta atingida",           "valor": "5/12",   "status": "alerta", "tendencia": "estavel", "rota": "/vacinacao"},
            ],
        },
        {
            "modulo": "Financeiro",
            "icone": "dollar",
            "indicadores": [
                {"nome": "Execucao orcamentaria",   "valor": "61,3%",  "status": "ok",     "tendencia": "alta",    "rota": "/cronograma-repasses"},
                {"nome": "Repasse FNS pendente",    "valor": "R$ 0",   "status": "ok",     "tendencia": "estavel", "rota": "/cronograma-repasses"},
                {"nome": "Receita propria 15%",     "valor": "17,2%",  "status": "ok",     "tendencia": "estavel", "rota": "/cronograma-repasses"},
                {"nome": "Contratos vencendo",      "valor": "1",      "status": "alerta", "tendencia": None,      "rota": "/gestao-contratos"},
            ],
        },
        {
            "modulo": "Vigilancia em Saude",
            "icone": "microscope",
            "indicadores": [
                {"nome": "Malaria IPA",             "valor": "12,4",   "status": "alerta", "tendencia": "queda",   "rota": "/producao-aps"},
                {"nome": "Cobertura agua tratada",  "valor": "68,5%",  "status": "alerta", "tendencia": "estavel", "rota": "/mapa-sanitario"},
                {"nome": "Busca ativa ativa",       "valor": "10",     "status": "ok",     "tendencia": "alta",    "rota": "/busca-ativa-ia"},
                {"nome": "Pacientes criticos",      "valor": "2",      "status": "critico","tendencia": None,      "rota": "/busca-ativa-ia"},
            ],
        },
        {
            "modulo": "Gestao de Contratos",
            "icone": "clipboard",
            "indicadores": [
                {"nome": "Contratos vigentes",      "valor": "5",      "status": "ok",     "tendencia": "estavel", "rota": "/gestao-contratos"},
                {"nome": "Contrato vencido",        "valor": "1",      "status": "critico","tendencia": None,      "rota": "/gestao-contratos"},
                {"nome": "Valor carteira",          "valor": "R$ 3,1M","status": "ok",     "tendencia": "estavel", "rota": "/gestao-contratos"},
                {"nome": "Execucao media",          "valor": "58,4%",  "status": "alerta", "tendencia": "alta",    "rota": "/gestao-contratos"},
            ],
        },
        {
            "modulo": "Saude Bucal",
            "icone": "tooth",
            "indicadores": [
                {"nome": "Score SB Brasil",         "valor": "6,2",    "status": "alerta", "tendencia": "alta",    "rota": "/saude-bucal"},
                {"nome": "1a Consulta odonto",      "valor": "61,8%",  "status": "alerta", "tendencia": "alta",    "rota": "/saude-bucal"},
                {"nome": "Tratamento concluido",    "valor": "48,3%",  "status": "alerta", "tendencia": "estavel", "rota": "/saude-bucal"},
                {"nome": "Exodontias (max 25%)",    "valor": "31,0%",  "status": "critico","tendencia": "queda",   "rota": "/saude-bucal"},
            ],
        },
        {
            "modulo": "Almoxarifado",
            "icone": "warehouse",
            "indicadores": [
                {"nome": "Itens em alerta",         "valor": "3",      "status": "alerta", "tendencia": None,      "rota": "/almoxarifado"},
                {"nome": "Itens vencidos",          "valor": "1",      "status": "critico","tendencia": None,      "rota": "/almoxarifado"},
                {"nome": "Sem estoque",             "valor": "1",      "status": "critico","tendencia": None,      "rota": "/almoxarifado"},
                {"nome": "Itens OK",                "valor": "7/12",   "status": "ok",     "tendencia": "estavel", "rota": "/almoxarifado"},
            ],
        },
        {
            "modulo": "Gestao de Pessoas",
            "icone": "users",
            "indicadores": [
                {"nome": "Cobertura PACS",          "valor": "91,3%",  "status": "ok",     "tendencia": "estavel", "rota": "/gestao-rh"},
                {"nome": "Profissionais ativos",    "valor": "148",    "status": "ok",     "tendencia": "estavel", "rota": "/gestao-rh"},
                {"nome": "Vacancias abertas",       "valor": "4",      "status": "alerta", "tendencia": None,      "rota": "/gestao-rh"},
                {"nome": "Capacitacoes mes",        "valor": "3",      "status": "ok",     "tendencia": "alta",    "rota": "/gestao-rh"},
            ],
        },
        {
            "modulo": "Participacao Social",
            "icone": "handshake",
            "indicadores": [
                {"nome": "CMS - Reunioes/ano",      "valor": "6/8",    "status": "ok",     "tendencia": "estavel", "rota": "/conselho-saude"},
                {"nome": "Quorum medio",            "valor": "75,0%",  "status": "ok",     "tendencia": "estavel", "rota": "/conselho-saude"},
                {"nome": "Deliberacoes pendentes",  "valor": "2",      "status": "alerta", "tendencia": None,      "rota": "/conselho-saude"},
                {"nome": "Proxima reuniao",         "valor": "30/Jul", "status": "ok",     "tendencia": None,      "rota": "/conselho-saude"},
            ],
        },
    ]


@router.get("/resumo")
def resumo():
    todos = [ind for b in _BLOCOS() for ind in b["indicadores"]]
    criticos = sum(1 for i in todos if i["status"] == "critico")
    alertas  = sum(1 for i in todos if i["status"] == "alerta")
    mods_ok  = sum(1 for b in _BLOCOS() if not any(i["status"] == "critico" for i in b["indicadores"]))
    agora = datetime.now().strftime("%d/%m/%Y %H:%M")
    return {
        "saude_score":        7.6,
        "financeiro_score":   7.2,
        "alertas_criticos":   criticos,
        "alertas_atencao":    alertas,
        "modulos_ok":         mods_ok,
        "modulos_total":      len(_BLOCOS()),
        "ultima_atualizacao": agora,
        "blocos":             _BLOCOS(),
    }
