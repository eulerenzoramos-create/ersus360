from fastapi import APIRouter

router = APIRouter(prefix="/api/dashboard-exec", tags=["dashboard-exec"])

_BLOCOS = [
    {
        "modulo": "Atenção Básica",
        "icone": "🏥",
        "indicadores": [
            {"nome": "Atendimentos/mês",       "valor": "1.913",  "status": "ok",     "tendencia": "estavel", "rota": "/producao-aps"},
            {"nome": "Cobertura ESF",           "valor": "74,2%",  "status": "alerta", "tendencia": "alta",    "rota": "/producao-aps"},
            {"nome": "Visitas domiciliares",    "valor": "1.240",  "status": "ok",     "tendencia": "estavel", "rota": "/producao-aps"},
            {"nome": "Previne Brasil Score",    "valor": "6,8",    "status": "alerta", "tendencia": "alta",    "rota": "/saude-bucal"},
        ],
    },
    {
        "modulo": "Vacinação PNI",
        "icone": "💉",
        "indicadores": [
            {"nome": "Cobertura média",         "valor": "76,4%",  "status": "alerta", "tendencia": "estavel", "rota": "/painel-vacinacao"},
            {"nome": "Doses este mês",          "valor": "1.247",  "status": "ok",     "tendencia": "alta",    "rota": "/painel-vacinacao"},
            {"nome": "Febre Amarela",           "valor": "52,1%",  "status": "critico","tendencia": "queda",   "rota": "/painel-vacinacao"},
            {"nome": "Meta atingida",           "valor": "5/12",   "status": "alerta", "tendencia": "estavel", "rota": "/painel-vacinacao"},
        ],
    },
    {
        "modulo": "Financeiro",
        "icone": "💰",
        "indicadores": [
            {"nome": "Execução orçamentária",   "valor": "61,3%",  "status": "ok",     "tendencia": "alta",    "rota": "/cronograma-repasses"},
            {"nome": "Repasse FNS pendente",    "valor": "R$ 0",   "status": "ok",     "tendencia": "estavel", "rota": "/cronograma-repasses"},
            {"nome": "Receita própria 15%",     "valor": "17,2%",  "status": "ok",     "tendencia": "estavel", "rota": "/cronograma-repasses"},
            {"nome": "Contratos vencendo",      "valor": "1",      "status": "alerta", "tendencia": null,      "rota": "/gestao-contratos"},
        ],
    },
    {
        "modulo": "Vigilância em Saúde",
        "icone": "🔬",
        "indicadores": [
            {"nome": "Malária IPA",             "valor": "12,4",   "status": "alerta", "tendencia": "queda",   "rota": "/producao-aps"},
            {"nome": "Cobertura água tratada",  "valor": "68,5%",  "status": "alerta", "tendencia": "estavel", "rota": "/mapa-sanitario"},
            {"nome": "Busca ativa ativa",       "valor": "10",     "status": "ok",     "tendencia": "alta",    "rota": "/busca-ativa-ia"},
            {"nome": "Pacientes críticos",      "valor": "2",      "status": "critico","tendencia": null,      "rota": "/busca-ativa-ia"},
        ],
    },
    {
        "modulo": "Gestão de Contratos",
        "icone": "📋",
        "indicadores": [
            {"nome": "Contratos vigentes",      "valor": "5",      "status": "ok",     "tendencia": "estavel", "rota": "/gestao-contratos"},
            {"nome": "Contrato vencido",        "valor": "1",      "status": "critico","tendencia": null,      "rota": "/gestao-contratos"},
            {"nome": "Valor carteira",          "valor": "R$ 3,1M","status": "ok",     "tendencia": "estavel", "rota": "/gestao-contratos"},
            {"nome": "Execução média",          "valor": "58,4%",  "status": "alerta", "tendencia": "alta",    "rota": "/gestao-contratos"},
        ],
    },
    {
        "modulo": "Saúde Bucal",
        "icone": "🦷",
        "indicadores": [
            {"nome": "Score SB Brasil",         "valor": "6,2",    "status": "alerta", "tendencia": "alta",    "rota": "/saude-bucal"},
            {"nome": "1ª Consulta odonto",      "valor": "61,8%",  "status": "alerta", "tendencia": "alta",    "rota": "/saude-bucal"},
            {"nome": "Tratamento concluído",    "valor": "48,3%",  "status": "alerta", "tendencia": "estavel", "rota": "/saude-bucal"},
            {"nome": "Exodontias (max 25%)",    "valor": "31,0%",  "status": "critico","tendencia": "queda",   "rota": "/saude-bucal"},
        ],
    },
    {
        "modulo": "Almoxarifado",
        "icone": "🏭",
        "indicadores": [
            {"nome": "Itens em alerta",         "valor": "3",      "status": "alerta", "tendencia": null,      "rota": "/almoxarifado"},
            {"nome": "Itens vencidos",          "valor": "1",      "status": "critico","tendencia": null,      "rota": "/almoxarifado"},
            {"nome": "Sem estoque",             "valor": "1",      "status": "critico","tendencia": null,      "rota": "/almoxarifado"},
            {"nome": "Itens OK",                "valor": "7/12",   "status": "ok",     "tendencia": "estavel", "rota": "/almoxarifado"},
        ],
    },
    {
        "modulo": "Gestão de Pessoas",
        "icone": "👥",
        "indicadores": [
            {"nome": "Cobertura PACS",          "valor": "91,3%",  "status": "ok",     "tendencia": "estavel", "rota": "/gestao-rh"},
            {"nome": "Profissionais ativos",    "valor": "148",    "status": "ok",     "tendencia": "estavel", "rota": "/gestao-rh"},
            {"nome": "Vacâncias abertas",       "valor": "4",      "status": "alerta", "tendencia": null,      "rota": "/gestao-rh"},
            {"nome": "Capacitações mes",        "valor": "3",      "status": "ok",     "tendencia": "alta",    "rota": "/gestao-rh"},
        ],
    },
    {
        "modulo": "Participação Social",
        "icone": "🤝",
        "indicadores": [
            {"nome": "CMS — Reuniões/ano",      "valor": "6/8",    "status": "ok",     "tendencia": "estavel", "rota": "/conselho-municipal"},
            {"nome": "Quórum médio",            "valor": "75,0%",  "status": "ok",     "tendencia": "estavel", "rota": "/conselho-municipal"},
            {"nome": "Deliberações pendentes",  "valor": "2",      "status": "alerta", "tendencia": null,      "rota": "/conselho-municipal"},
            {"nome": "Próxima reunião",         "valor": "30/Jul", "status": "ok",     "tendencia": null,      "rota": "/conselho-municipal"},
        ],
    },
]

@router.get("/resumo")
def resumo():
    todos = [ind for b in _BLOCOS for ind in b["indicadores"]]
    criticos = sum(1 for i in todos if i["status"] == "critico")
    alertas  = sum(1 for i in todos if i["status"] == "alerta")
    mods_ok  = sum(1 for b in _BLOCOS if not any(i["status"] == "critico" for i in b["indicadores"]))
    return {
        "saude_score":        6.8,
        "financeiro_score":   7.2,
        "alertas_criticos":   criticos,
        "alertas_atencao":    alertas,
        "modulos_ok":         mods_ok,
        "modulos_total":      len(_BLOCOS),
        "ultima_atualizacao": "24/07/2026 08:00",
        "blocos":             _BLOCOS,
    }
