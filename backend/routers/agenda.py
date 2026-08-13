"""
Router: /api/agenda — Agenda de Gestão ERSUS 360
Dados de referência municipal — Apuí/AM
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/api/agenda", tags=["Agenda"])


@router.get("/eventos")
async def listar_eventos():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "id": 1,
            "titulo": "Envio RREO 2º Bimestre 2026 ao TCE/AM",
            "tipo": "legal",
            "data": "2026-04-30",
            "status": "pendente",
            "prioridade": "alta",
            "responsavel": "FMS / Financeiro",
            "descricao": "Prazo legal para envio do Relatório Resumido da Execução Orçamentária ao Tribunal de Contas do Estado. Multa em caso de atraso.",
            "dias_restantes": 47,
            "urgencia": "proximo",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 2,
            "titulo": "Prestação de contas Cofinanciamento APS — 1º Quadrimestre/26",
            "tipo": "producao",
            "data": "2026-04-15",
            "status": "pendente",
            "prioridade": "alta",
            "responsavel": "Coordenação APS",
            "descricao": "Encerramento do período de lançamento de produção no SISAB para fins do Cofinanciamento APS (P. 3.493/2024). Metas de consulta pré-natal, hipertensão e diabetes.",
            "dias_restantes": 33,
            "urgencia": "proximo",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 3,
            "titulo": "Reunião Conselho Municipal de Saúde — Março/26",
            "tipo": "reuniao",
            "data": "2026-03-28",
            "status": "concluido",
            "prioridade": "media",
            "responsavel": "Secretário Municipal de Saúde",
            "descricao": "Pauta: aprovação do Relatório Anual de Gestão 2025, calendário de obras e plano de ação CAPS.",
            "dias_restantes": None,
            "urgencia": None,
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 4,
            "titulo": "Renovação contratos ACS — 30 agentes",
            "tipo": "rh",
            "data": "2026-04-01",
            "status": "pendente",
            "prioridade": "alta",
            "responsavel": "Gestão de Pessoas / Jurídico",
            "descricao": "30 contratos de Agente Comunitário de Saúde vencem em 01/04. Necessário processo seletivo ou renovação via câmara municipal.",
            "dias_restantes": 19,
            "urgencia": "urgente",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 5,
            "titulo": "Capacitação EMAD — Curativos complexos e úlceras por pressão",
            "tipo": "capacitacao",
            "data": "2026-04-08",
            "status": "pendente",
            "prioridade": "media",
            "responsavel": "Educação Permanente",
            "descricao": "Treinamento para equipe SAD/EMAD com foco em manejo de úlceras por pressão grau II e III. Instrutor: Enfermeiro CCIH.",
            "dias_restantes": 26,
            "urgencia": "proximo",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 6,
            "titulo": "Campanha de doação de sangue — UBS Central",
            "tipo": "vigilancia",
            "data": "2026-04-14",
            "status": "pendente",
            "prioridade": "alta",
            "responsavel": "Hemoterapia / VISA",
            "descricao": "Campanha para repor estoque crítico de tipos O− e AB+. Meta: 50 doadores. Parceria com escolas e igrejas.",
            "dias_restantes": 32,
            "urgencia": "proximo",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 7,
            "titulo": "Licitação reparo lancha fluvial SAMU",
            "tipo": "patrimonio",
            "data": "2026-03-20",
            "status": "vencido",
            "prioridade": "alta",
            "responsavel": "Compras / SAMU",
            "descricao": "Abertura de processo licitatório para reparo do motor da lancha AM-0047 (inoperante desde 12/02). Prazo vencido — urgente retomada.",
            "dias_restantes": -13,
            "urgencia": "vencido",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 8,
            "titulo": "Entrega Relatório Anual de Gestão 2025 ao Conselho",
            "tipo": "legal",
            "data": "2026-03-31",
            "status": "concluido",
            "prioridade": "alta",
            "responsavel": "Secretário Municipal de Saúde",
            "descricao": "RAG 2025 aprovado na reunião do CMS de 28/03/2026. Documento enviado ao CONASS.",
            "dias_restantes": None,
            "urgencia": None,
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 9,
            "titulo": "Vacinação Antirrábica Canina — Campanha Municipal",
            "tipo": "vigilancia",
            "data": "2026-04-20",
            "status": "pendente",
            "prioridade": "media",
            "responsavel": "Vigilância Epidemiológica / Zoonoses",
            "descricao": "Campanha anual de vacinação antirrábica. Meta: 80% da população canina estimada (4.200 animais). Equipes volantes nas zonas rurais.",
            "dias_restantes": 38,
            "urgencia": "proximo",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 10,
            "titulo": "SIOPS — Envio dados 1º quadrimestre 2026",
            "tipo": "legal",
            "data": "2026-05-30",
            "status": "pendente",
            "prioridade": "alta",
            "responsavel": "FMS / Financeiro",
            "descricao": "Prazo para envio dos dados de execução financeira em saúde ao SIOPS/MS referente ao 1º quadrimestre de 2026.",
            "dias_restantes": 77,
            "urgencia": None,
        },
    ]


@router.get("/resumo-mes")
async def resumo_mes():
    return {
        "situacao_dado": "referencia_municipal",
        "mes_referencia": "Mar/2026",
        "total_eventos": 10,
        "pendentes": 7,
        "concluidos": 3,
        "vencidos": 1,
        "urgentes": 2,
        "proximos_7_dias": 0,
        "proximos_30_dias": 5,
    }


@router.get("/proximos-prazos")
async def proximos_prazos():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "id": 4,
            "titulo": "Renovação contratos ACS — 30 agentes",
            "data": "2026-04-01",
            "dias_restantes": 19,
            "urgencia": "urgente",
            "tipo": "rh",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 5,
            "titulo": "Capacitação EMAD — Curativos complexos",
            "data": "2026-04-08",
            "dias_restantes": 26,
            "urgencia": "proximo",
            "tipo": "capacitacao",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 2,
            "titulo": "Cofinanciamento APS — 1º Quadrimestre/26",
            "data": "2026-04-15",
            "dias_restantes": 33,
            "urgencia": "proximo",
            "tipo": "producao",
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 1,
            "titulo": "RREO 2º Bimestre 2026 — TCE/AM",
            "data": "2026-04-30",
            "dias_restantes": 47,
            "urgencia": "proximo",
            "tipo": "legal",
        },
    ]
