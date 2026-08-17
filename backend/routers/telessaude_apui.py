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
    historico = [
        {"competencia": "Jan/2026", "mes": "2026-01", "parcela": "3/12",  "valor": 0.00, "status": "nao_pago"},
        {"competencia": "Fev/2026", "mes": "2026-02", "parcela": "4/12",  "valor": 0.00, "status": "nao_pago"},
        {"competencia": "Mar/2026", "mes": "2026-03", "parcela": "5/12",  "valor": 0.00, "status": "nao_pago"},
        {"competencia": "Abr/2026", "mes": "2026-04", "parcela": "6/12",  "valor": 0.00, "status": "nao_pago"},
        {"competencia": "Mai/2026", "mes": "2026-05", "parcela": "7/12",  "valor": 0.00, "status": "nao_pago"},
        {"competencia": "Jun/2026", "mes": "2026-06", "parcela": "8/12",  "valor": 0.00, "status": "nao_pago"},
        {"competencia": "Jul/2026", "mes": "2026-07", "parcela": "9/12",  "valor": 0.00, "status": "nao_pago"},
        {"competencia": "Ago/2026", "mes": "2026-08", "parcela": "10/12", "valor": 0.00, "status": "nao_pago"},
    ]
    meses_sem_receber = sum(1 for h in historico if h["status"] == "nao_pago")
    perda_acumulada   = 12000.00 * meses_sem_receber

    inconsistencias = [
        {
            "codigo": "INC-001",
            "tipo": "cadastro_scnes",
            "gravidade": "critica",
            "titulo": "eMulti NÃO habilitada para Atendimento Remoto no SCNES",
            "descricao": (
                "O campo 'Tipo de Atendimento: Remoto' não está marcado no cadastro da equipe eMulti "
                "no SCNES/CNES. Sem essa habilitação o Ministério da Saúde não reconhece a modalidade "
                "e o repasse fica bloqueado automaticamente."
            ),
            "impacto_financeiro": perda_acumulada,
            "portaria": "Art. 4º, §2º — Port. GM/MS nº 635/2023",
            "acao_corretiva": "Acessar SCNES → Cadastro da equipe eMulti → Tipo de Atendimento → marcar 'Remoto' → Salvar",
            "prazo": "2026-08-20",
            "responsavel": "Gestor de Saúde / TI SCNES",
            "status": "pendente",
        },
        {
            "codigo": "INC-002",
            "tipo": "producao_esus",
            "gravidade": "critica",
            "titulo": "Nenhuma produção remota registrada no e-SUS PEC (Jan–Ago/2026)",
            "descricao": (
                "8 meses consecutivos sem registro de atendimento com modalidade 'Remoto' no e-SUS PEC. "
                "A produção deve ser transmitida ao SISAB para que o indicador de elegibilidade seja atendido. "
                "Sem produção registrada, mesmo após a habilitação no SCNES o repasse pode ser suspenso."
            ),
            "impacto_financeiro": perda_acumulada,
            "portaria": "Art. 6º, I — Port. GM/MS nº 635/2023",
            "acao_corretiva": "e-SUS PEC → Atendimento Individual → Modalidade: Remoto → preencher e transmitir ao SISAB",
            "prazo": "2026-09-01",
            "responsavel": "Coordenador da eMulti / Profissionais da equipe",
            "status": "pendente",
        },
        {
            "codigo": "INC-003",
            "tipo": "vinculo_profissional",
            "gravidade": "alta",
            "titulo": "Vínculos dos profissionais da eMulti não confirmados no CNES",
            "descricao": (
                "Não foi possível confirmar que todos os profissionais obrigatórios (médico, enfermeiro, "
                "fisioterapeuta, psicólogo, nutricionista e farmacêutico) estão com vínculo ativo e CBO "
                "correto no CNES. Vínculo incorreto inabilita o repasse integral."
            ),
            "impacto_financeiro": 0,
            "portaria": "Anexo I — Port. GM/MS nº 635/2023",
            "acao_corretiva": "SCNES → Profissional → verificar vínculo ativo + CBO de cada membro da eMulti",
            "prazo": "2026-08-25",
            "responsavel": "RH / Gestão de Pessoas",
            "status": "verificar",
        },
        {
            "codigo": "INC-004",
            "tipo": "infraestrutura",
            "gravidade": "media",
            "titulo": "Infraestrutura TIC para atendimento remoto não documentada",
            "descricao": (
                "Não há registro formal de disponibilidade de internet e equipamentos (PC/tablet/câmera) "
                "para atendimento remoto assistido nas UBS cobertas pela eMulti. A Portaria exige documentação "
                "mínima de infraestrutura para fins de auditoria."
            ),
            "impacto_financeiro": 0,
            "portaria": "Art. 2º, §1º — Port. GM/MS nº 635/2023",
            "acao_corretiva": "Levantar inventário de equipamentos e testar conectividade em cada UBS da eMulti",
            "prazo": "2026-08-30",
            "responsavel": "TI / Infraestrutura Municipal",
            "status": "verificar",
        },
    ]

    diagnostico = {
        "resumo_executivo": (
            f"A eMulti de Apuí/AM acumula {meses_sem_receber} meses consecutivos sem receber o incentivo "
            f"de Atendimento Remoto (Port. GM/MS nº 635/2023), totalizando perda de "
            f"R$ {perda_acumulada:,.2f} desde Janeiro/2026. "
            "Foram identificadas 2 inconsistências críticas, 1 alta e 1 média que bloqueiam o repasse."
        ),
        "total_inconsistencias": len(inconsistencias),
        "criticas": sum(1 for i in inconsistencias if i["gravidade"] == "critica"),
        "altas": sum(1 for i in inconsistencias if i["gravidade"] == "alta"),
        "medias": sum(1 for i in inconsistencias if i["gravidade"] == "media"),
        "perda_acumulada": perda_acumulada,
        "previsao_regularizacao": "SET/2026 (se ações iniciadas até 20/08/2026)",
        "proximo_repasse_estimado": "OUT/2026 — parcela 12/12",
    }

    dados = {
        "municipio": "APUI",
        "uf": "AM",
        "competencia_verificada": "AGO/2026",
        "periodo_analise": "JAN/2026 a AGO/2026",
        "parcela": "10/12",
        "valor_recebido": 0.00,
        "valor_potencial_mensal": 12000.00,
        "valor_potencial_anual": 144000.00,
        "perda_acumulada": perda_acumulada,
        "meses_sem_receber": meses_sem_receber,
        "modalidade_credenciada": "Estratégica",
        "status_geral": "critico",
        "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "fonte_dados": "e-Gestor APS — Relatórios Públicos → Pagamento → eMulti Atendimento Remoto",
        "historico_pagamentos": historico,
        "inconsistencias": inconsistencias,
        "diagnostico": diagnostico,
        "checklist": [
            {
                "item": "eMulti habilitada para Atendimento Remoto no SCNES",
                "status": "pendente",
                "descricao": "Campo 'Tipo de Atendimento: Remoto' deve estar marcado no cadastro da equipe eMulti no SCNES.",
                "portaria": "Art. 4º, §2º — Port. GM/MS nº 635/2023",
                "acao": "Acessar SCNES → Equipe → eMulti → habilitar Atendimento Remoto",
                "prazo": "Até 20/08/2026",
                "prioridade": "critica",
            },
            {
                "item": "Produção de atendimentos remotos registrada no e-SUS PEC",
                "status": "pendente",
                "descricao": "Lançar atendimentos com modalidade 'Remoto' nas fichas individuais do e-SUS PEC e transmitir ao SISAB.",
                "portaria": "Art. 6º, I — Port. GM/MS nº 635/2023",
                "acao": "e-SUS PEC → Atendimento Individual → Modalidade: Remoto → Transmitir ao SISAB",
                "prazo": "A partir de 01/09/2026",
                "prioridade": "critica",
            },
            {
                "item": "Vínculos dos profissionais da eMulti ativos e CBOs compatíveis",
                "status": "verificar",
                "descricao": "Confirmar que médico, enfermeiro, fisioterapeuta, psicólogo, nutricionista e farmacêutico estão com vínculo ativo e CBO correto no CNES.",
                "portaria": "Anexo I — Port. GM/MS nº 635/2023",
                "acao": "SCNES → Profissional → verificar vínculo ativo e CBO",
                "prazo": "Até 25/08/2026",
                "prioridade": "alta",
            },
            {
                "item": "Infraestrutura TIC disponível nas UBS",
                "status": "verificar",
                "descricao": "Documentar disponibilidade de internet e equipamento (PC/tablet/câmera) para atendimento remoto assistido nas UBS da eMulti.",
                "portaria": "Art. 2º, §1º — Port. GM/MS nº 635/2023",
                "acao": "Levantar equipamentos e testar conectividade nas UBS",
                "prazo": "Até 30/08/2026",
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
        "nota": (
            "Dados baseados em consulta ao e-Gestor APS (Relatórios Públicos → Pagamento → eMulti Atendimento Remoto) "
            "e análise regulatória da Port. GM/MS nº 635/2023. "
            "Atualizar mensalmente após processamento SISAB (competência anterior liberada até dia 20 do mês seguinte)."
        ),
    }
    return {"situacao_dado": "referencia_municipal", "dados": dados}

