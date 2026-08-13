"""
Router: /api/planejamento — ERSUS 360
Dados de referência municipal — Apuí/AM. situacao_dado = referencia_municipal.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/planejamento", tags=["Planejamento"])

_TS = "2026-08-13T00:00:00Z"


@router.get("/dashboard")
async def planejamento_dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí",
        "uf": "AM",
        "populacao_estimada": 20286,
        "gestao": "2021-2024",
        "secretaria": "Rosângela Motter",
        "pms_vigente": "2022-2025",
        "pms_aprovado_cms": True,
        "pms_aprovado_em": "2022-03-15",
        "rdqa_situacao": "em_dia",
        "ultimo_rdqa": "2026-04",
        "total_metas_pms": 48,
        "metas_concluidas": 19,
        "metas_em_andamento": 24,
        "metas_atrasadas": 5,
        "percentual_execucao": 74.3,
        "verificado_em": _TS,
    }


@router.get("/planos")
async def listar_planos():
    return {
        "situacao_dado": "referencia_municipal",
        "planos": [
            {
                "id": "PMS-2022",
                "nome": "Plano Municipal de Saúde 2022-2025",
                "vigencia_inicio": "2022-01-01",
                "vigencia_fim": "2025-12-31",
                "aprovado_cms": True,
                "aprovado_em": "2022-03-15",
                "resolucao_cms": "Resolução CMS nº 02/2022",
                "eixos": 6,
                "objetivos": 18,
                "metas": 48,
                "acoes": 112,
                "status": "vigente",
            },
            {
                "id": "PAS-2025",
                "nome": "Programação Anual de Saúde 2025",
                "vigencia_inicio": "2025-01-01",
                "vigencia_fim": "2025-12-31",
                "aprovado_cms": True,
                "aprovado_em": "2025-01-20",
                "resolucao_cms": "Resolução CMS nº 01/2025",
                "eixos": 6,
                "objetivos": 18,
                "metas": 48,
                "acoes": 98,
                "status": "vigente",
            },
        ],
        "verificado_em": _TS,
    }


@router.get("/metas")
async def listar_metas():
    return {
        "situacao_dado": "referencia_municipal",
        "total": 48,
        "concluidas": 19,
        "em_andamento": 24,
        "atrasadas": 5,
        "metas": [
            {"id": "M01", "eixo": "Atenção Primária", "descricao": "Cobertura da ESF ≥ 80%", "meta": 80.0, "realizado": 78.5, "status": "em_andamento"},
            {"id": "M02", "eixo": "Atenção Primária", "descricao": "Cobertura vacinal DTP ≥ 95%", "meta": 95.0, "realizado": 88.2, "status": "atrasada"},
            {"id": "M03", "eixo": "Atenção Primária", "descricao": "Pré-natal 7+ consultas ≥ 75%", "meta": 75.0, "realizado": 71.4, "status": "em_andamento"},
            {"id": "M04", "eixo": "Vigilância Epidemiológica", "descricao": "Notificações SINAN em até 7 dias ≥ 90%", "meta": 90.0, "realizado": 93.1, "status": "concluida"},
            {"id": "M05", "eixo": "Vigilância Epidemiológica", "descricao": "Controle de malária — IPA < 10", "meta": 10.0, "realizado": 7.8, "status": "concluida"},
            {"id": "M06", "eixo": "Gestão e Planejamento", "descricao": "RDQA quadrimestral entregue no prazo", "meta": 3, "realizado": 3, "status": "concluida"},
            {"id": "M07", "eixo": "Saúde Mental", "descricao": "Implantação do CAPS AD tipo I", "meta": 1, "realizado": 0, "status": "atrasada"},
            {"id": "M08", "eixo": "Saúde Bucal", "descricao": "Primeira consulta odontológica programática ≥ 6%", "meta": 6.0, "realizado": 5.3, "status": "em_andamento"},
            {"id": "M09", "eixo": "Assistência Farmacêutica", "descricao": "Abastecimento REMUME ≥ 95%", "meta": 95.0, "realizado": 96.8, "status": "concluida"},
            {"id": "M10", "eixo": "Gestão e Planejamento", "descricao": "Capacitações EducaSUS ≥ 80 servidores/ano", "meta": 80, "realizado": 62, "status": "em_andamento"},
        ],
        "verificado_em": _TS,
    }


@router.get("/pas/acoes")
async def listar_acoes_pas():
    return {
        "situacao_dado": "referencia_municipal",
        "pas": "2025",
        "total_acoes": 98,
        "acoes_concluidas": 41,
        "acoes_em_andamento": 47,
        "acoes_nao_iniciadas": 10,
        "acoes": [
            {"id": "A001", "eixo": "Atenção Primária", "descricao": "Manter 3 equipes ESF completas", "responsavel": "Coord. APS", "prazo": "2025-12-31", "status": "em_andamento"},
            {"id": "A002", "eixo": "Atenção Primária", "descricao": "Implantar Sala de Vacinas na UBS Rio Juma", "responsavel": "Coord. Imunização", "prazo": "2025-06-30", "status": "concluida"},
            {"id": "A003", "eixo": "Vigilância Epidemiológica", "descricao": "Borrifação residual intradomiciliar — zona rural", "responsavel": "SEVIG", "prazo": "2025-04-30", "status": "concluida"},
            {"id": "A004", "eixo": "Gestão", "descricao": "Envio RDQA 1º quadrimestre 2025 ao DIGISUS", "responsavel": "Secretária", "prazo": "2025-05-20", "status": "concluida"},
            {"id": "A005", "eixo": "Gestão", "descricao": "Renovação Plano de Cargos SMS", "responsavel": "RH SMS", "prazo": "2025-09-30", "status": "em_andamento"},
            {"id": "A006", "eixo": "Infraestrutura", "descricao": "Reforma UBS Central — telhado e banheiros", "responsavel": "Prefeitura/SMS", "prazo": "2025-10-31", "status": "em_andamento"},
            {"id": "A007", "eixo": "Saúde Indígena", "descricao": "Articulação com DSEI Madeira para atendimento ribeirinho", "responsavel": "Secretária", "prazo": "2025-12-31", "status": "em_andamento"},
        ],
        "verificado_em": _TS,
    }


@router.get("/rag/gerar")
async def gerar_rag():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2025",
        "rag": {
            "titulo": "Relatório Anual de Gestão — SMS Apuí 2025 (preliminar)",
            "secretaria": "Rosângela Motter",
            "gestao": "2021-2024",
            "aprovacao_cms_prevista": "2026-03-20",
            "secoes": [
                "1. Perfil Epidemiológico e Demográfico",
                "2. Atenção Primária à Saúde — ESF / ACS",
                "3. Vigilância em Saúde (Epidemiológica, Sanitária, Ambiental)",
                "4. Assistência Farmacêutica e Insumos",
                "5. Gestão de Pessoas — Quadro de Servidores",
                "6. Execução Orçamentária e Financeira",
                "7. Cumprimento de Metas do PMS 2022-2025",
                "8. Participação e Controle Social",
            ],
            "indicadores_destaque": {
                "cobertura_esf": "78.5%",
                "cobertura_vacinal_dtp": "88.2%",
                "pre_natal_7consultas": "71.4%",
                "ipa_malaria": 7.8,
                "notificacoes_sinan_em_prazo": "93.1%",
            },
        },
        "gerado_em": _TS,
    }


@router.get("/digisus/exportar")
async def exportar_digisus():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí",
        "ibge": "1300144",
        "digisus": {
            "pms_enviado": True,
            "pas_enviado": True,
            "rdqa_1q_2025": "enviado",
            "rdqa_2q_2025": "enviado",
            "rdqa_3q_2025": "em_prazo",
            "rag_2024_enviado": True,
            "pendencias": [],
        },
        "exportado_em": _TS,
    }
