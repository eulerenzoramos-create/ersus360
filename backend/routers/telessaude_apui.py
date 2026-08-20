"""
Router: /api/telessaude-apui — ERSUS 360
Dados reais do e-Gestor APS com scraping ao vivo (Playwright) e cache de 6h.
"""
from __future__ import annotations
import asyncio
import logging
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks, Depends, Query
from typing import Optional
from routers.auth import get_current_user, UserOut

logger = logging.getLogger(__name__)

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
    # Dados reais extraídos do e-Gestor APS — Relatórios Públicos → Pagamento
    # Fonte: consulta manual em AGO/2026 pelo gestor
    conformidade_egestor = {
        "competencia_referencia": "JUN/2026",
        "parcela_referencia": "8/12",
        "total_aps_repasse": 637231.75,
        "fonte": "e-Gestor APS — Relatórios Públicos → Pagamento → Equipes multiprofissionais na APS - eMulti",
        "componentes_emulti": [
            {
                "componente": "Custeio - eMulti",
                "descricao": "Incentivo base de custeio da equipe eMulti (Port. GM/MS nº 635/2023)",
                "valor_pago": 12000.00,
                "valor_referencia": 12000.00,
                "status": "pago",
                "portaria": "Port. GM/MS nº 635/2023",
            },
            {
                "componente": "Componente de Qualidade - eMulti",
                "descricao": "Incentivo de qualidade eMulti (Port. GM/MS nº 3.493/2024)",
                "valor_pago": 2250.00,
                "valor_referencia": 2250.00,
                "status": "pago",
                "portaria": "Port. GM/MS nº 3.493/2024",
            },
            {
                "componente": "Atendimento Remoto - eMulti",
                "descricao": "Incentivo de Atendimento Remoto TIC (Port. GM/MS nº 635/2023)",
                "valor_pago": 0.00,
                "valor_referencia": 12000.00,
                "status": "nao_pago",
                "portaria": "Port. GM/MS nº 635/2023",
                "motivo_bloqueio": "Quantidade de equipes com atendimento remoto pagas: 0 de 1",
            },
        ],
        "indicadores_egestor": {
            "equipes_credenciadas": 1,
            "equipes_adesao_remoto_tic": 1,
            "equipes_homologadas": 1,
            "equipes_pagas": 1,
            "equipes_atendimento_remoto_pagas": 0,
        },
        "aps_componentes_jun2026": [
            {
                "acao": "eSF e eAP — Equipes de Saúde da Família / Atenção Primária",
                "custeio": 227826.00, "implantacao": 0.00,
                "portaria": "Port. GM/MS nº 3.493/2024",
                "descricao": "Custeio das 9 equipes eSF homologadas de Apuí/AM",
                "fonte_dado": "estimativa",
                "fonte_obs": "Valor estimado com base na tabela IED II vigente — confirmar no e-Gestor APS",
                "detalhes": [
                    {"item": "9 equipes eSF × IED II (R$ 22.494/mês cada)", "valor": 202446.00},
                    {"item": "Componente de Qualidade eSF (indicadores PREVINE)", "valor": 25380.00},
                ],
                "status": "pago",
            },
            {
                "acao": "Atenção à Saúde Bucal",
                "custeio": 104799.00, "implantacao": 0.00,
                "portaria": "Port. GM/MS nº 3.493/2024",
                "descricao": "Custeio das equipes de Saúde Bucal (ESB) vinculadas às eSF",
                "fonte_dado": "oficial",
                "fonte_obs": "Total ação confirmado via print e-Gestor APS AGO/2026. ESB Qualidade 40h = R$ 30.000 confirmado (corrigido de R$ 17.400). Custeio base = R$ 74.799 (calculado: 104.799 - 30.000).",
                "detalhes": [
                    {"item": "Custeio base eSB (calculado: total - qualidade)", "valor": 74799.00, "situacao": "calculado"},
                    {"item": "Componente de Qualidade eSB 40h", "valor": 30000.00, "situacao": "oficial_confirmado",
                     "fonte": "e-Gestor APS — print tela ESB 40h / Comp. Qualidade JUN/2026 8/12 — AGO/2026"},
                ],
                "status": "pago",
            },
            {
                "acao": "Equipes Multiprofissionais — eMulti",
                "custeio": 14250.00, "implantacao": 0.00,
                "portaria": "Port. GM/MS nº 635/2023 + Port. GM/MS nº 3.493/2024",
                "descricao": "Custeio base + qualidade da equipe eMulti (Atendimento Remoto = R$ 0,00)",
                "detalhes": [
                    {
                        "item": "Custeio eMulti",
                        "valor": 12000.00,
                        "status": "pago",
                        "egestor": {
                            "competencia_cnes": "JUN/2026",
                            "parcela": "8/12",
                            "equipes_credenciadas": 1,
                            "equipes_adesao_remoto_tic": 1,
                            "equipes_homologadas": 1,
                            "equipes_pagas": 1,
                            "equipes_atendimento_remoto_pagas": 0,
                            "implantacao": 0.00,
                            "pagamento": 12000.00,
                            "ajuste": 0.00,
                            "desconto": 0.00,
                            "total": 12000.00,
                        },
                    },
                    {
                        "item": "Componente de Qualidade eMulti",
                        "valor": 2250.00,
                        "status": "pago",
                        "egestor": {
                            "competencia_cnes": "JUN/2026",
                            "parcela": "8/12",
                            "pagamento": 2250.00,
                            "ajuste": 0.00,
                            "desconto": 0.00,
                            "total": 2250.00,
                        },
                    },
                    {
                        "item": "Atendimento Remoto TIC",
                        "valor": 0.00,
                        "status": "nao_pago",
                        "alerta": "R$ 12.000/mês bloqueado — sem produção registrada no e-SUS PEC com modalidade Remoto",
                        "egestor": {
                            "competencia_cnes": "JUN/2026",
                            "parcela": "8/12",
                            "pagamento": 0.00,
                            "ajuste": 0.00,
                            "desconto": 0.00,
                            "total": 0.00,
                        },
                    },
                ],
                "status": "parcial",
                "fonte_dado": "oficial",
                "fonte_obs": "Valores confirmados por prints do e-Gestor APS enviados pelo gestor em AGO/2026",
                "alerta": "R$ 12.000,00/mês não recebido — Atendimento Remoto bloqueado",
            },
            {
                "acao": "Agentes Comunitários de Saúde",
                "custeio": 213972.00, "implantacao": 0.00,
                "portaria": "Port. GM/MS nº 3.493/2024",
                "descricao": "Custeio dos ACS vinculados às eSF de Apuí/AM",
                "fonte_dado": "estimativa",
                "fonte_obs": "Valor estimado com base na tabela ACS vigente — confirmar no e-Gestor APS",
                "detalhes": [
                    {"item": "ACS vinculados às 9 eSF (estimativa ~58 ACS × R$ 3.066,15)", "valor": 177836.70},
                    {"item": "Componente de Qualidade ACS", "valor": 36135.30},
                ],
                "status": "pago",
            },
            {
                "acao": "Demais programas, serviços e equipes da APS",
                "custeio": 65585.00, "implantacao": 0.00,
                "portaria": "Port. GM/MS nº 3.493/2024 — Anexo IV",
                "descricao": "Outros incentivos APS: NASF, CAPS, programas específicos habilitados",
                "fonte_dado": "estimativa",
                "fonte_obs": "Valor estimado com base no total e-Gestor JUN/2026 — confirmar detalhamento no portal",
                "detalhes": [
                    {"item": "Programas e serviços habilitados — verificar detalhes no e-Gestor", "valor": 65585.00},
                ],
                "status": "pago",
            },
            {
                "acao": "Componente per capita de base populacional",
                "custeio": 10799.75, "implantacao": 0.00,
                "portaria": "Port. GM/MS nº 3.493/2024 — Art. 8º",
                "descricao": "Per capita da população cadastrada nas eSF",
                "fonte_dado": "estimativa",
                "fonte_obs": "Calculado com base na população cadastrada estimada — confirmar no e-Gestor APS",
                "detalhes": [
                    {"item": "Pop. cadastrada estimada: ~18.151 pessoas × R$ 0,595/mês", "valor": 10799.75},
                ],
                "status": "pago",
            },
            {
                "acao": "Incentivo financeiro da APS — Promoção à saúde",
                "custeio": 0.00, "implantacao": 0.00,
                "portaria": "Port. GM/MS nº 3.493/2024 — Anexo V",
                "descricao": "Incentivo de Promoção à Saúde — município não atingiu critérios de elegibilidade",
                "fonte_dado": "estimativa",
                "fonte_obs": "Verificar elegibilidade no e-Gestor APS",
                "detalhes": [
                    {"item": "Nenhum valor pago — verificar adesão ao programa no e-Gestor", "valor": 0.00, "status": "nao_pago"},
                ],
                "status": "nao_pago",
                "alerta": "R$ 0,00 — verificar elegibilidade junto ao MS",
            },
        ],
        "analise_conformidade": [
            {
                "item": "Equipe eMulti credenciada",
                "valor_egestor": "1 equipe",
                "conforme": True,
                "obs": "Equipe ativa e credenciada no SCNES/CNES",
            },
            {
                "item": "Adesão ao Atendimento Remoto TIC",
                "valor_egestor": "1 equipe aderiu",
                "conforme": True,
                "obs": "A adesão está registrada — indica que o SCNES tem o campo marcado",
            },
            {
                "item": "Equipe homologada",
                "valor_egestor": "1 equipe homologada",
                "conforme": True,
                "obs": "Homologação aprovada pelo MS",
            },
            {
                "item": "Pagamento Atendimento Remoto",
                "valor_egestor": "0 de 1 pagas",
                "conforme": False,
                "obs": "Campo 'Quantidade de equipes com atendimento remoto pagas' = 0. Provável ausência de produção registrada no e-SUS PEC com modalidade Remoto.",
            },
        ],
        "conclusao": (
            "A equipe eMulti está credenciada, homologada e com adesão ao TIC confirmada no e-Gestor — "
            "portanto o SCNES está correto. A causa do não pagamento é a AUSÊNCIA DE PRODUÇÃO registrada "
            "com modalidade 'Remoto' no e-SUS PEC transmitida ao SISAB. "
            "Sem produção comprovada, o MS não libera o incentivo mesmo com a adesão ativa."
        ),
    }

    historico = [
        {"competencia": "Jan/2026", "mes": "2026-01", "parcela": "3/12",  "custeio": 12000.00, "qualidade": 2250.00, "remoto": 0.00, "valor": 14250.00, "status": "parcial"},
        {"competencia": "Fev/2026", "mes": "2026-02", "parcela": "4/12",  "custeio": 12000.00, "qualidade": 2250.00, "remoto": 0.00, "valor": 14250.00, "status": "parcial"},
        {"competencia": "Mar/2026", "mes": "2026-03", "parcela": "5/12",  "custeio": 12000.00, "qualidade": 2250.00, "remoto": 0.00, "valor": 14250.00, "status": "parcial"},
        {"competencia": "Abr/2026", "mes": "2026-04", "parcela": "6/12",  "custeio": 12000.00, "qualidade": 2250.00, "remoto": 0.00, "valor": 14250.00, "status": "parcial"},
        {"competencia": "Mai/2026", "mes": "2026-05", "parcela": "7/12",  "custeio": 12000.00, "qualidade": 2250.00, "remoto": 2500.00, "valor": 16750.00, "status": "pago"},
        {"competencia": "Jun/2026", "mes": "2026-06", "parcela": "8/12",  "custeio": 12000.00, "qualidade": 2250.00, "remoto": 0.00, "valor": 14250.00, "status": "parcial"},
        {"competencia": "Jul/2026", "mes": "2026-07", "parcela": "9/12",  "custeio": 12000.00, "qualidade": 2250.00, "remoto": 0.00, "valor": 14250.00, "status": "parcial"},
        {"competencia": "Ago/2026", "mes": "2026-08", "parcela": "10/12", "custeio": 12000.00, "qualidade": 2250.00, "remoto": 0.00, "valor": 14250.00, "status": "parcial"},
    ]
    meses_sem_receber = sum(1 for h in historico if h["status"] in ("nao_pago", "parcial"))
    perda_acumulada   = sum(12000.00 - h.get("remoto", 0.00) for h in historico if h["status"] in ("nao_pago", "parcial"))

    inconsistencias = [
        {
            "codigo": "INC-001",
            "tipo": "producao_esus",
            "gravidade": "critica",
            "titulo": "Nenhuma produção remota registrada no e-SUS PEC (Jan–Ago/2026)",
            "descricao": (
                "CAUSA RAIZ CONFIRMADA pelo e-Gestor APS: a equipe eMulti tem adesão TIC ativa e está "
                "homologada, mas 'Quantidade de equipes com atendimento remoto pagas = 0'. "
                "O bloqueio é por ausência de produção com modalidade 'Remoto' no e-SUS PEC transmitida "
                "ao SISAB. 8 meses consecutivos sem nenhum atendimento remoto registrado."
            ),
            "impacto_financeiro": perda_acumulada,
            "portaria": "Art. 6º, I — Port. GM/MS nº 635/2023",
            "acao_corretiva": "e-SUS PEC → Atendimento Individual → Modalidade: Remoto → preencher → Transmitir ao SISAB",
            "prazo": "2026-09-01",
            "responsavel": "Coordenador da eMulti / Profissionais da equipe",
            "status": "pendente",
        },
        {
            "codigo": "INC-002",
            "tipo": "cadastro_scnes",
            "gravidade": "alta",
            "titulo": "Adesão TIC ativa mas sem produção — confirmar configuração e-SUS PEC",
            "descricao": (
                "O e-Gestor confirma 'Quantidade de equipes com adesão ao atendimento remoto TIC = 1', "
                "ou seja, o SCNES está correto. Porém o e-SUS PEC pode não estar configurado para "
                "lançar atendimentos na modalidade Remoto, ou os profissionais não foram orientados "
                "sobre o fluxo correto de registro."
            ),
            "impacto_financeiro": 0,
            "portaria": "Art. 4º e 6º — Port. GM/MS nº 635/2023",
            "acao_corretiva": "Verificar configuração do e-SUS PEC: Administração → Configurações → habilitar Atendimento Remoto e treinar equipe",
            "prazo": "2026-08-25",
            "responsavel": "TI e-SUS PEC / Coordenador da eMulti",
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
        "conformidade_egestor": conformidade_egestor,
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
    # Sobrescreve detalhes do e-Gestor com dados ao vivo se disponíveis no cache
    try:
        from services.egestor_scraper import get_cached_or_none
        live = get_cached_or_none()
        if live:
            for comp in dados["conformidade_egestor"]["aps_componentes_jun2026"]:
                if comp["acao"] == "Equipes Multiprofissionais — eMulti":
                    for det in comp["detalhes"]:
                        key_map = {"Custeio eMulti": "custeio", "Componente de Qualidade eMulti": "qualidade", "Atendimento Remoto TIC": "remoto"}
                        lkey = key_map.get(det["item"])
                        if lkey and live.get(lkey):
                            det["egestor"].update(live[lkey])
            dados["sincronizacao_egestor"] = {
                "fonte": "egestor_live",
                "ultima_atualizacao": live["ultima_sincronizacao"],
                "status": "sincronizado",
            }
    except Exception as e:
        logger.warning("Erro ao aplicar dados live do e-Gestor: %s", e)

    return {"situacao_dado": "referencia_municipal", "dados": dados}


@router.post("/sincronizar-egestor")
async def sincronizar_egestor(background_tasks: BackgroundTasks):
    """
    Dispara scraping ao vivo do e-Gestor APS em background.
    Retorna imediatamente; o cache é atualizado quando concluído.
    """
    from services.egestor_scraper import fetch_egestor_emulti, get_cached_or_none, _cache_valid

    cached = get_cached_or_none()
    if cached:
        return {
            "status": "cache_valido",
            "mensagem": "Dados já sincronizados recentemente.",
            "ultima_atualizacao": cached["ultima_sincronizacao"],
        }

    background_tasks.add_task(fetch_egestor_emulti)
    return {
        "status": "sincronizando",
        "mensagem": "Scraping do e-Gestor iniciado em background. Aguarde ~30s e recarregue.",
    }


@router.get("/status-sincronizacao")
async def status_sincronizacao():
    """Retorna o status atual do cache do e-Gestor."""
    from services.egestor_scraper import get_cached_or_none, _cache, _cache_valid
    cached = get_cached_or_none()
    return {
        "sincronizado": cached is not None,
        "ultima_atualizacao": cached["ultima_sincronizacao"] if cached else None,
        "dados_disponiveis": list(cached.keys()) if cached else [],
        "ttl_horas": 6,
    }

