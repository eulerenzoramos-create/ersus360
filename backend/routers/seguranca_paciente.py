"""Segurança do Paciente — NSP · Incidentes · Indicadores · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/seguranca-paciente", tags=["seguranca_paciente"])

@router.get("/dashboard")
async def dashboard():
    return {
        "incidentes_mes": 18,
        "incidentes_com_dano": 4,
        "incidentes_sem_dano": 14,
        "near_miss": 12,
        "taxa_notificacao_por_100leitos": 8.6,
        "meta_taxa_notificacao": 10.0,
        "events_adversos_graves": 1,
        "queda_paciente_mes": 6,
        "infeccao_relacionada_assistencia_mes": 3,
        "erro_medicacao_mes": 5,
        "identificacao_incorreta_mes": 2,
        "cirurgia_segura_conformidade_pct": 84.6,
        "higiene_maos_conformidade_pct": 72.4,
        "competencia": "Jun/2026",
        "status_geral": "atencao",
    }

@router.get("/incidentes")
async def incidentes():
    return [
        {"tipo": "Queda de paciente",             "mes": "Jun/26", "n": 6, "com_dano": 2, "sem_dano": 4, "near_miss": 3, "gravidade": "moderada", "unidade": "Clínica Médica",    "medida": "Revisão protocolo de contenção lateral"},
        {"tipo": "Erro de medicação",              "mes": "Jun/26", "n": 5, "com_dano": 1, "sem_dano": 4, "near_miss": 4, "gravidade": "leve",     "unidade": "Farmácia/Enf.",     "medida": "Dupla checagem reimplementada em Jul/26"},
        {"tipo": "Infecção relacionada à assist.", "mes": "Jun/26", "n": 3, "com_dano": 1, "sem_dano": 2, "near_miss": 2, "gravidade": "grave",    "unidade": "UTI/CME",           "medida": "Cultura de ponta de cateter e revisão protocolo ICS"},
        {"tipo": "Identificação incorreta",        "mes": "Jun/26", "n": 2, "com_dano": 0, "sem_dano": 2, "near_miss": 2, "gravidade": "leve",     "unidade": "SADT",              "medida": "Treinamento pulseira de identificação"},
        {"tipo": "Falha em equipamento",           "mes": "Jun/26", "n": 1, "com_dano": 0, "sem_dano": 1, "near_miss": 1, "gravidade": "leve",     "unidade": "Centro Cirúrgico",  "medida": "Monitor cardíaco em manutenção"},
        {"tipo": "Úlcera por pressão",             "mes": "Jun/26", "n": 1, "com_dano": 0, "sem_dano": 1, "near_miss": 0, "gravidade": "moderada", "unidade": "Clínica Médica",    "medida": "Escala de Braden revisada 2×/turno"},
    ]

@router.get("/protocolos")
async def protocolos():
    return [
        {"protocolo": "Cirurgia Segura (checklist OMS)",        "conformidade_pct": 84.6, "meta_pct": 95, "auditorias_mes": 28, "status": "atencao",  "observacao": "Etapa 'Antes da Incisão' com maior taxa de omissão (12%)"},
        {"protocolo": "Higiene das Mãos (OMS — 5 momentos)",    "conformidade_pct": 72.4, "meta_pct": 85, "auditorias_mes": 284,"status": "atencao",  "observacao": "Momento 2 (antes de proc. asséptico) com menor adesão (58%)"},
        {"protocolo": "Identificação do Paciente (2 identif.)", "conformidade_pct": 92.8, "meta_pct": 95, "auditorias_mes": 184,"status": "ok",       "observacao": "Pulseira e confirmação verbal — melhora de 8 p.p. vs Jan/26"},
        {"protocolo": "Prevenção de Queda (escala Morse)",      "conformidade_pct": 78.4, "meta_pct": 90, "auditorias_mes": 84, "status": "atencao",  "observacao": "Avaliação na admissão: 94% — reavaliação após mudança de clínica: 62%"},
        {"protocolo": "Prescrição Segura (dupla checagem)",     "conformidade_pct": 68.4, "meta_pct": 95, "auditorias_mes": 284,"status": "critico",  "observacao": "Reimplementação após evento adverso Jun/26 — acompanhamento semanal NSP"},
        {"protocolo": "Prevenção de Úlcera por Pressão",        "conformidade_pct": 86.4, "meta_pct": 90, "auditorias_mes": 56, "status": "atencao",  "observacao": "Reposicionamento 2h: 94% — escala Braden na admissão: 78%"},
        {"protocolo": "Comunicação Crítica (SBAR/ISOBAR)",      "conformidade_pct": 64.8, "meta_pct": 85, "auditorias_mes": 48, "status": "critico",  "observacao": "Passagem de plantão SBAR formalizada em Mar/26 — adesão ainda baixa"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "incidentes": 24, "com_dano": 6, "near_miss": 18, "cirurgia_segura_pct": 76.4, "higiene_maos_pct": 64.8},
        {"mes": "Fev/26", "incidentes": 22, "com_dano": 5, "near_miss": 16, "cirurgia_segura_pct": 78.4, "higiene_maos_pct": 66.4},
        {"mes": "Mar/26", "incidentes": 20, "com_dano": 5, "near_miss": 14, "cirurgia_segura_pct": 80.4, "higiene_maos_pct": 68.4},
        {"mes": "Abr/26", "incidentes": 18, "com_dano": 4, "near_miss": 14, "cirurgia_segura_pct": 82.4, "higiene_maos_pct": 70.4},
        {"mes": "Mai/26", "incidentes": 20, "com_dano": 5, "near_miss": 12, "cirurgia_segura_pct": 83.4, "higiene_maos_pct": 71.4},
        {"mes": "Jun/26", "incidentes": 18, "com_dano": 4, "near_miss": 12, "cirurgia_segura_pct": 84.6, "higiene_maos_pct": 72.4},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Taxa de notificação de incidentes/100 leitos", "valor": 8.6,  "meta": 10.0, "unidade": "taxa","status": "atencao", "observacao": "Notificação ainda subótima — meta de notificação ≥ 10/100 leitos/mês"},
        {"indicador": "Higiene das mãos — conformidade",              "valor": 72.4, "meta": 85.0, "unidade": "%",   "status": "atencao", "observacao": "Momento 2 (pré-proc. asséptico) é o mais crítico (58%)"},
        {"indicador": "Cirurgia segura — checklist OMS",              "valor": 84.6, "meta": 95.0, "unidade": "%",   "status": "atencao", "observacao": "Etapa 'Antes da Incisão' com maior gap de conformidade"},
        {"indicador": "Prescrição segura — dupla checagem",           "valor": 68.4, "meta": 95.0, "unidade": "%",   "status": "critico", "observacao": "Erro de medicação com dano em Jun/26 — plano de ação ativo"},
        {"indicador": "Comunicação SBAR — passagem de plantão",       "valor": 64.8, "meta": 85.0, "unidade": "%",   "status": "critico", "observacao": "Protocolo implantado Mar/26 — treinamento em andamento"},
        {"indicador": "Quedas com dano — taxa/1000 pacientes-dia",    "valor": 2.4,  "meta": 1.0,  "unidade": "taxa","status": "atencao", "observacao": "Acima da meta — revisão protocolo contenção lateral em andamento"},
        {"indicador": "IRAS — taxa de infecção hospitalar",           "valor": 4.8,  "meta": 3.0,  "unidade": "%",   "status": "atencao", "observacao": "ICS cateter: 1 caso Jun/26 — CCIH em investigação"},
    ]
