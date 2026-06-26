"""
Router: /api/planejamento — Planejamento Municipal de Saúde
PMS · Programação Anual de Saúde (PAS) · Relatório Anual de Gestão (RAG)
Exportação automática para DIGISUS Gestor
"""
from __future__ import annotations
from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from database import get_db

router = APIRouter(prefix="/api/planejamento", tags=["Planejamento"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


class AcaoPAS(BaseModel):
    id: int
    codigo: str
    descricao: str
    eixo: str
    meta_fisica: float
    meta_financeira_prevista: float
    meta_financeira_realizada: float
    execucao_fisica: int       # 0–100 %
    situacao: str
    responsavel: str
    competencia: str


class RAGSecao(BaseModel):
    titulo: str
    conteudo: str
    indicadores: list[dict] = []


class PlanejamentoDashboard(BaseModel):
    acoes_total: int
    acoes_concluidas: int
    acoes_em_andamento: int
    acoes_atrasadas: int
    execucao_financeira_geral: float
    execucao_fisica_geral: float
    competencia: str
    atualizado_em: datetime


@router.get("/dashboard", response_model=PlanejamentoDashboard)
async def planejamento_dashboard(municipio_id: int = Query(1)):
    return PlanejamentoDashboard(
        acoes_total=24,
        acoes_concluidas=8,
        acoes_em_andamento=12,
        acoes_atrasadas=4,
        execucao_financeira_geral=61.3,
        execucao_fisica_geral=58.7,
        competencia="2026-06",
        atualizado_em=datetime.utcnow(),
    )


@router.get("/pas/acoes", response_model=list[AcaoPAS])
async def listar_acoes_pas(
    municipio_id: int = Query(1),
    eixo: str | None = Query(None),
):
    """Programação Anual de Saúde — ações por eixo."""
    acoes = [
        AcaoPAS(id=1, codigo="APS.001", descricao="Implantação e manutenção de equipes de Saúde da Família",
            eixo="Atenção Primária", meta_fisica=3.0, meta_financeira_prevista=890000,
            meta_financeira_realizada=695000, execucao_fisica=100, situacao="Em Execução",
            responsavel="Coordenação APS", competencia="2026"),
        AcaoPAS(id=2, codigo="APS.002", descricao="Aquisição de equipamentos e materiais para UBS",
            eixo="Atenção Primária", meta_fisica=4.0, meta_financeira_prevista=180000,
            meta_financeira_realizada=72000, execucao_fisica=40, situacao="Em Execução",
            responsavel="Coordenação APS", competencia="2026"),
        AcaoPAS(id=3, codigo="FAR.001", descricao="Ampliação da oferta de medicamentos — Farmácia Popular",
            eixo="Assistência Farmacêutica", meta_fisica=1.0, meta_financeira_prevista=610000,
            meta_financeira_realizada=173240, execucao_fisica=28, situacao="Crítico",
            responsavel="Farmácia Municipal", competencia="2026"),
        AcaoPAS(id=4, codigo="MAC.001", descricao="Manutenção de serviços de Média e Alta Complexidade",
            eixo="MAC", meta_fisica=1.0, meta_financeira_prevista=480000,
            meta_financeira_realizada=197000, execucao_fisica=41, situacao="Crítico",
            responsavel="Regulação", competencia="2026"),
        AcaoPAS(id=5, codigo="VIG.001", descricao="Fortalecimento da vigilância epidemiológica e sanitária",
            eixo="Vigilância em Saúde", meta_fisica=1.0, meta_financeira_prevista=320000,
            meta_financeira_realizada=208000, execucao_fisica=65, situacao="Em Andamento",
            responsavel="VISA/VIEP", competencia="2026"),
        AcaoPAS(id=6, codigo="PES.001", descricao="Capacitação de profissionais de saúde do município",
            eixo="Gestão do Trabalho", meta_fisica=120.0, meta_financeira_prevista=85000,
            meta_financeira_realizada=62000, execucao_fisica=73, situacao="Em Andamento",
            responsavel="RH Saúde", competencia="2026"),
        AcaoPAS(id=7, codigo="INF.001", descricao="Reforma e ampliação da UBS Central",
            eixo="Infraestrutura", meta_fisica=1.0, meta_financeira_prevista=420000,
            meta_financeira_realizada=0, execucao_fisica=0, situacao="Em Licitação",
            responsavel="Engenharia Municipal", competencia="2026"),
        AcaoPAS(id=8, codigo="TFD.001", descricao="Custeio de tratamento fora do domicílio (TFD)",
            eixo="Regulação", meta_fisica=200.0, meta_financeira_prevista=240000,
            meta_financeira_realizada=148000, execucao_fisica=62, situacao="Em Andamento",
            responsavel="Regulação / TFD", competencia="2026"),
    ]
    if eixo:
        acoes = [a for a in acoes if a.eixo == eixo]
    return acoes


@router.get("/rag/gerar")
async def gerar_rag(municipio_id: int = Query(1), ano: int = Query(2026)):
    """
    Gera automaticamente o Relatório Anual de Gestão (RAG) estruturado.
    Pronto para exportação ao DIGISUS Gestor.
    """
    return {
        "municipio": "Apuí/AM",
        "ano_referencia": ano,
        "gerado_em": datetime.utcnow().isoformat(),
        "status": "rascunho",
        "secoes": [
            {
                "titulo": "1. Análise da Situação de Saúde",
                "conteudo": (
                    f"O município de Apuí/AM, com população estimada de 22.124 habitantes (IBGE {ano}), "
                    "possui 4 Unidades Básicas de Saúde e 3 equipes de Saúde da Família ativas. "
                    "A cobertura da Estratégia de Saúde da Família é de 68,4%, abaixo da meta nacional de 100%."
                ),
                "indicadores": [
                    {"nome": "Cobertura ESF", "valor": 68.4, "meta": 100, "unidade": "%"},
                    {"nome": "Pré-natal 7+ consultas", "valor": 85.1, "meta": 100, "unidade": "%"},
                ]
            },
            {
                "titulo": "2. Execução do Plano Municipal de Saúde",
                "conteudo": (
                    "Das 24 ações programadas no PMS, 8 foram concluídas (33%), "
                    "12 estão em execução (50%) e 4 apresentam atraso (17%). "
                    "A execução financeira geral atingiu 61,3% do previsto no período."
                ),
                "indicadores": [
                    {"nome": "Ações concluídas", "valor": 8, "meta": 24, "unidade": "ações"},
                    {"nome": "Execução financeira", "valor": 61.3, "meta": 100, "unidade": "%"},
                ]
            },
            {
                "titulo": "3. Recursos Financeiros e Execução Orçamentária",
                "conteudo": (
                    "O FMS Apuí/AM recebeu R$ 2.300.000,00 em repasses federais no período, "
                    "distribuídos entre os blocos de Atenção Básica, MAC, Vigilância em Saúde e Farmácia. "
                    "O bloco MAC apresenta execução crítica de 41%, exigindo ação corretiva imediata."
                ),
                "indicadores": [
                    {"nome": "Total repasses federais", "valor": 2300000, "meta": 0, "unidade": "R$"},
                    {"nome": "Execução MAC", "valor": 41.0, "meta": 100, "unidade": "%"},
                ]
            },
            {
                "titulo": "4. Metas e Indicadores do Previne Brasil",
                "conteudo": (
                    "Do total de 20 indicadores avaliados no ciclo 2022–2025, "
                    "14 foram atingidos (70%). Os principais destaques positivos são: "
                    "pré-natal adequado (85,1%), cobertura vacinal BCG (92,3%) e proporção de parto normal (95,1%). "
                    "Os indicadores críticos são farmácia popular (28,4%) e execução MAC (41%)."
                ),
                "indicadores": [
                    {"nome": "Indicadores atingidos", "valor": 14, "meta": 20, "unidade": "indicadores"},
                    {"nome": "Taxa de atingimento", "valor": 70.0, "meta": 100, "unidade": "%"},
                ]
            },
        ],
        "proximos_passos": [
            "Acionar regulação para aumentar a execução MAC até 80% até setembro/2026",
            "Regularizar estoque de Losartana e Metformina (Farmácia Popular)",
            "Iniciar processo licitatório para reforma da UBS Central",
            "Qualificar 2 novas equipes de Saúde da Família para ampliar cobertura ESF",
        ]
    }


@router.get("/digisus/exportar")
async def exportar_digisus(municipio_id: int = Query(1), ano: int = Query(2026)):
    """Gera estrutura JSON compatível com exportação ao DIGISUS Gestor."""
    return {
        "versao_digisus": "2.0",
        "municipio_ibge": "1300144",
        "ano_referencia": str(ano),
        "competencia_envio": datetime.utcnow().strftime("%Y-%m"),
        "acoes_programadas": 24,
        "acoes_realizadas": 8,
        "execucao_percentual": 61.3,
        "status_exportacao": "pronto",
        "observacao": "Arquivo gerado pelo ERSUS 360 — FMS Apuí/AM. Validar antes de enviar ao DIGISUS.",
        "gerado_em": datetime.utcnow().isoformat(),
    }
