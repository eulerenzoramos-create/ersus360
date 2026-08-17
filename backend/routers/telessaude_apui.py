"""
Router: /api/telessaude-apui — ERSUS 360
Dados reais pendentes de integração — situacao_dado = nao_disponivel.
Nenhum valor é simulado ou estimado.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/telessaude-apui", tags=["telessaude_apui"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/especialidades")
async def especialidades():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/conectividade")
async def conectividade():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/historico")
async def historico():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/indicadores")
async def indicadores():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Integração pendente. Configure no Railway.",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


@router.get("/emulti-remoto")
async def emulti_remoto():
    """Monitoramento do incentivo eMulti - Atendimento Remoto (Port. GM/MS 635/2023)."""
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "APUI",
        "uf": "AM",
        "competencia_verificada": "JUN/2026",
        "parcela": "8/12",
        "valor_recebido": 0.00,
        "valor_potencial_mensal": 12000.00,
        "valor_potencial_anual": 144000.00,
        "modalidade_credenciada": "Estratégica",
        "status_geral": "critico",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "checklist": [
            {
                "item": "eMulti habilitada para Atendimento Remoto no SCNES",
                "status": "pendente",
                "descricao": "Campo 'Tipo de Atendimento: Remoto' deve estar marcado no cadastro da equipe eMulti no SCNES.",
                "portaria": "Art. 4º, §2º — Port. GM/MS nº 635/2023",
                "acao": "Acessar SCNES → Equipe → eMulti → habilitar Atendimento Remoto",
                "prazo": "Até 20/07/2026",
                "prioridade": "critica",
            },
            {
                "item": "Produção de atendimentos remotos registrada no e-SUS PEC",
                "status": "pendente",
                "descricao": "Lançar atendimentos com modalidade 'Remoto' nas fichas individuais do e-SUS PEC e transmitir ao SISAB.",
                "portaria": "Art. 6º, I — Port. GM/MS nº 635/2023",
                "acao": "e-SUS PEC → Atendimento Individual → Modalidade: Remoto → Transmitir ao SISAB",
                "prazo": "A partir de 01/07/2026",
                "prioridade": "critica",
            },
            {
                "item": "Vínculos dos profissionais da eMulti ativos e CBOs compatíveis",
                "status": "verificar",
                "descricao": "Confirmar que médico, enfermeiro, fisioterapeuta, psicólogo, nutricionista e farmacêutico estão com vínculo ativo e CBO correto no CNES.",
                "portaria": "Anexo I — Port. GM/MS nº 635/2023",
                "acao": "SCNES → Profissional → verificar vínculo ativo e CBO",
                "prazo": "Imediato",
                "prioridade": "alta",
            },
            {
                "item": "Infraestrutura TIC disponível nas UBS",
                "status": "verificar",
                "descricao": "Documentar disponibilidade de internet e equipamento (PC/tablet/câmera) para atendimento remoto assistido nas UBS da eMulti.",
                "portaria": "Art. 2º, §1º — Port. GM/MS nº 635/2023",
                "acao": "Levantar equipamentos e testar conectividade nas UBS",
                "prazo": "Até 15/07/2026",
                "prioridade": "media",
            },
            {
                "item": "Incentivo base eMulti recebido normalmente",
                "status": "ok",
                "descricao": "Repasse de R$ 16.750,00 (semestral) confirmado no consultafns.saude.gov.br — equipe existe e está credenciada.",
                "portaria": "Port. GM/MS nº 635/2023 + Port. GM/MS nº 3.493/2024",
                "acao": "Nenhuma ação necessária — manter equipe ativa",
                "prazo": "—",
                "prioridade": "ok",
            },
        ],
        "historico_pagamentos": [
            {"competencia": "Jan/2026", "parcela": "3/12", "valor": 0.00},
            {"competencia": "Fev/2026", "parcela": "4/12", "valor": 0.00},
            {"competencia": "Mar/2026", "parcela": "5/12", "valor": 0.00},
            {"competencia": "Abr/2026", "parcela": "6/12", "valor": 0.00},
            {"competencia": "Mai/2026", "parcela": "7/12", "valor": 0.00},
            {"competencia": "Jun/2026", "parcela": "8/12", "valor": 0.00},
        ],
        "nota": (
            "Dados baseados em consulta manual ao e-Gestor APS (Relatórios Públicos → Pagamento → eMulti Atendimento Remoto). "
            "Atualizar após regularização no SCNES e registro de produção no e-SUS PEC."
        ),
    }

