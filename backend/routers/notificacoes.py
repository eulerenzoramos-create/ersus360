from fastapi import APIRouter
from typing import Optional
from functools import lru_cache

router = APIRouter(prefix="/api/notificacoes", tags=["notificacoes"])

@lru_cache(maxsize=1)
def _NOTIFICACOES():
    return [
        {
            "id": "N001", "titulo": "Atorvastatina VENCIDA — ação imediata",
            "descricao": "O lote de Atorvastatina 20mg (código MED-007) venceu em 25/07/2026. Necessário inutilizar o estoque (62 comprimidos) e registrar no HORUS. Acione a Central de Abastecimento Farmacêutico para reposição urgente.",
            "modulo": "Almoxarifado", "rota": "/almoxarifado", "tipo": "critico",
            "data": "24/07/2026", "hora": "08:12", "lida": False,
            "acao": "Ver estoque",
        },
        {
            "id": "N002", "titulo": "Seringa 5mL sem estoque",
            "descricao": "O estoque de Seringa Descartável 5mL (código EPI-002) zerou. Há 12 procedimentos agendados para esta semana que requerem este insumo. Solicitar reposição emergencial.",
            "modulo": "Almoxarifado", "rota": "/almoxarifado", "tipo": "critico",
            "data": "24/07/2026", "hora": "07:45", "lida": False,
            "acao": "Ver insumo",
        },
        {
            "id": "N003", "titulo": "Contrato manutenção equipamentos VENCIDO",
            "descricao": "O contrato CT-003/2025 (manutenção de equipamentos médicos — Tecno Med Ltda) venceu há 24 dias. Os equipamentos estão sem cobertura contratual. Necessário empenho emergencial ou dispensa de licitação.",
            "modulo": "Contratos", "rota": "/gestao-contratos", "tipo": "critico",
            "data": "24/07/2026", "hora": "06:00", "lida": False,
            "acao": "Ver contrato",
        },
        {
            "id": "N004", "titulo": "Cobertura Febre Amarela abaixo de 70%",
            "descricao": "A cobertura vacinal de Febre Amarela (FA) está em 52,1%, muito abaixo da meta de 95%. Apuí/AM é área endêmica. NOTA TÉCNICA: risco de surto. Acionar equipe de Vigilância em Saúde para intensificar busca ativa.",
            "modulo": "Vacinação", "rota": "/painel-vacinacao", "tipo": "critico",
            "data": "23/07/2026", "hora": "17:30", "lida": False,
            "acao": "Ver painel vacinação",
        },
        {
            "id": "N005", "titulo": "2 pacientes com risco crítico — busca ativa",
            "descricao": "A IA identificou 2 pacientes com score de prioridade acima de 90 (risco crítico) que não tiveram atendimento nos últimos 60 dias. ACS responsáveis foram notificados automaticamente. Requer visita domiciliar até 25/07.",
            "modulo": "Busca Ativa IA", "rota": "/busca-ativa-ia", "tipo": "critico",
            "data": "23/07/2026", "hora": "14:00", "lida": False,
            "acao": "Ver pacientes",
        },
        {
            "id": "N006", "titulo": "Contrato laboratório vencendo em 7 dias",
            "descricao": "O contrato CT-004/2025 (serviços laboratoriais — BioLab Diagnósticos Ltda) vence em 31/07/2026. Necessário iniciar processo de prorrogação ou nova licitação imediatamente para não interromper os serviços.",
            "modulo": "Contratos", "rota": "/gestao-contratos", "tipo": "alerta",
            "data": "24/07/2026", "hora": "09:00", "lida": False,
            "acao": "Ver contrato",
        },
        {
            "id": "N007", "titulo": "Exodontias acima do limite (31% vs 25% meta)",
            "descricao": "O indicador SB04 — Proporção de Exodontias — está em 31%, acima do limite máximo de 25% estabelecido pelo programa SB Brasil. Isso indica que a equipe de saúde bucal está extraindo mais do que restaurando. Necessária supervisão e capacitação.",
            "modulo": "Saúde Bucal", "rota": "/saude-bucal", "tipo": "alerta",
            "data": "23/07/2026", "hora": "10:15", "lida": False,
            "acao": "Ver indicadores",
        },
        {
            "id": "N008", "titulo": "Cobertura ESF abaixo da meta (74,2%)",
            "descricao": "A cobertura da Estratégia de Saúde da Família está em 74,2%, abaixo da meta de 80%. Uma equipe está com médico em licença. Solicitar credenciamento de médico substituto à SESAM.",
            "modulo": "APS", "rota": "/producao-aps", "tipo": "alerta",
            "data": "22/07/2026", "hora": "16:00", "lida": False,
            "acao": None,
        },
        {
            "id": "N009", "titulo": "3 itens do almoxarifado em alerta de reposição",
            "descricao": "Losartana 50mg, Dipirona Sódica e Luvas de Procedimento estão abaixo do estoque mínimo. A reposição deve ser solicitada nos próximos 5 dias para evitar ruptura de estoque.",
            "modulo": "Almoxarifado", "rota": "/almoxarifado", "tipo": "alerta",
            "data": "22/07/2026", "hora": "08:30", "lida": True,
            "acao": "Ver lista",
        },
        {
            "id": "N010", "titulo": "Repasse FNS — Componente Básico creditado",
            "descricao": "Repasse do Componente Básico da Assistência Farmacêutica (competência Jun/2026) foi creditado na conta do FMS no valor de R$ 8.450,00. Registre no SIGAF.",
            "modulo": "Financeiro", "rota": "/cronograma-repasses", "tipo": "sucesso",
            "data": "21/07/2026", "hora": "14:22", "lida": True,
            "acao": None,
        },
        {
            "id": "N011", "titulo": "Reunião do CMS agendada para 30/07",
            "descricao": "A próxima reunião ordinária do Conselho Municipal de Saúde está agendada para 30/07/2026 às 18h na Câmara Municipal. Pauta inclui análise do Relatório de Gestão do 2º quadrimestre. Quórum mínimo: 9 conselheiros.",
            "modulo": "CMS", "rota": "/conselho-municipal", "tipo": "info",
            "data": "21/07/2026", "hora": "09:00", "lida": True,
            "acao": None,
        },
        {
            "id": "N012", "titulo": "Ficha de Consumo Alimentar abaixo da meta",
            "descricao": "A Ficha de Consumo Alimentar no SISAB está com apenas 63% da meta mensal (38/60). As equipes precisam intensificar o registro de avaliações nutricionais, especialmente para crianças menores de 2 anos.",
            "modulo": "APS", "rota": "/producao-aps", "tipo": "info",
            "data": "20/07/2026", "hora": "11:00", "lida": True,
            "acao": None,
        },
    ]


_lidas: set = set()

@router.get("/resumo")
def resumo():
    nao_lidas = sum(1 for n in _NOTIFICACOES() if n["id"] not in _lidas and not n["lida"])
    criticas  = sum(1 for n in _NOTIFICACOES() if n["tipo"] == "critico")
    alertas   = sum(1 for n in _NOTIFICACOES() if n["tipo"] == "alerta")
    info      = sum(1 for n in _NOTIFICACOES() if n["tipo"] == "info")
    sucessos  = sum(1 for n in _NOTIFICACOES() if n["tipo"] == "sucesso")
    return {
        "total": len(_NOTIFICACOES()), "nao_lidas": nao_lidas,
        "criticas": criticas, "alertas": alertas, "info": info, "sucessos": sucessos,
    }

@router.get("/lista")
def lista(tipo: Optional[str] = None, lida: Optional[str] = None):
    items = list(_NOTIFICACOES)
    if tipo:
        items = [n for n in items if n["tipo"] == tipo]
    if lida == "true":
        items = [n for n in items if n["lida"] or n["id"] in _lidas]
    elif lida == "false":
        items = [n for n in items if not n["lida"] and n["id"] not in _lidas]
    result = []
    for n in items:
        item = dict(n)
        if n["id"] in _lidas:
            item["lida"] = True
        result.append(item)
    return result

@router.post("/marcar-lida")
def marcar_lida(body: dict):
    _lidas.add(body.get("id", ""))
    return {"ok": True}

@router.post("/marcar-todas-lidas")
def marcar_todas_lidas():
    for n in _NOTIFICACOES():
        _lidas.add(n["id"])
    return {"ok": True}
