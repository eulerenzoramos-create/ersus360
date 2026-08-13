"""
Router: /api/seguranca-paciente — ERSUS 360
Dados de referência municipal — Apuí/AM
Núcleo de Segurança do Paciente · Portaria MS nº 529/2013
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/seguranca-paciente", tags=["seguranca_paciente"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "incidentes_notificados_mes": 18,
        "eventos_adversos_mes": 6,
        "near_miss_mes": 12,
        "taxa_notificacao_por_100_internacoes": 5.4,
        "meta_notificacao": 3.0,
        "incidentes_graves": 1,
        "protocolos_implantados": 4,
        "meta_protocolos": 6,
        "nsp_ativo": True,
    }


@router.get("/incidentes")
async def incidentes():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "id": 1,
            "tipo": "Erro de medicação",
            "categoria": "Evento adverso",
            "data": "2026-03-04",
            "desfecho": "Dano leve",
            "setor": "Farmácia / Clínica Médica",
            "investigado": True,
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 2,
            "tipo": "Queda de paciente",
            "categoria": "Evento adverso",
            "data": "2026-03-09",
            "desfecho": "Sem dano",
            "setor": "Clínica Médica",
            "investigado": True,
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 3,
            "tipo": "Identificação incorreta de paciente",
            "categoria": "Near-miss",
            "data": "2026-03-11",
            "desfecho": "Interceptado antes do dano",
            "setor": "Laboratório",
            "investigado": True,
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 4,
            "tipo": "Atraso diagnóstico — malária grave",
            "categoria": "Evento adverso grave",
            "data": "2026-03-15",
            "desfecho": "Transferência UTI Humaitá",
            "setor": "Pronto-Atendimento",
            "investigado": False,
        },
        {
            "situacao_dado": "referencia_municipal",
            "id": 5,
            "tipo": "Infecção de sítio cirúrgico",
            "categoria": "Evento adverso",
            "data": "2026-03-18",
            "desfecho": "Dano moderado — antibioticoterapia",
            "setor": "Cirúrgico",
            "investigado": True,
        },
    ]


@router.get("/protocolos")
async def protocolos():
    return [
        {"situacao_dado": "referencia_municipal", "protocolo": "Higienização das mãos", "status": "implantado", "conformidade_pct": 78, "meta_pct": 95},
        {"situacao_dado": "referencia_municipal", "protocolo": "Identificação do paciente", "status": "implantado", "conformidade_pct": 84, "meta_pct": 95},
        {"situacao_dado": "referencia_municipal", "protocolo": "Segurança na prescrição, uso e administração de medicamentos", "status": "implantado", "conformidade_pct": 71, "meta_pct": 90},
        {"situacao_dado": "referencia_municipal", "protocolo": "Prevenção de quedas", "status": "implantado", "conformidade_pct": 62, "meta_pct": 90},
        {"situacao_dado": "referencia_municipal", "protocolo": "Úlcera por pressão — prevenção", "status": "em_implantacao", "conformidade_pct": 40, "meta_pct": 85},
        {"situacao_dado": "referencia_municipal", "protocolo": "Cirurgia segura", "status": "pendente", "conformidade_pct": 0, "meta_pct": 90},
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "incidentes": 12, "eventos_adversos": 4, "near_miss": 8, "graves": 0},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "incidentes": 14, "eventos_adversos": 5, "near_miss": 9, "graves": 1},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "incidentes": 11, "eventos_adversos": 3, "near_miss": 8, "graves": 0},
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "incidentes": 16, "eventos_adversos": 5, "near_miss": 11, "graves": 0},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "incidentes": 15, "eventos_adversos": 5, "near_miss": 10, "graves": 0},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "incidentes": 18, "eventos_adversos": 6, "near_miss": 12, "graves": 1},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Taxa de notificação de incidentes",
            "valor": 5.4,
            "unidade": "por 100 internações",
            "meta": 3.0,
            "status": "ok",
            "observacao": "Taxa acima da meta indica cultura de notificação ativa — positivo para segurança.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Conformidade — Higienização das mãos",
            "valor": 78,
            "unidade": "%",
            "meta": 95,
            "status": "atencao",
            "observacao": "Principais falhas no turno noturno e na entrada de plantão. Treinamento programado.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Protocolos MS implantados",
            "valor": 4,
            "unidade": "de 6",
            "meta": 6,
            "status": "atencao",
            "observacao": "Úlcera por pressão e Cirurgia Segura ainda em implantação.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Eventos adversos graves/mês",
            "valor": 1,
            "unidade": "evento",
            "meta": 0,
            "status": "critico",
            "observacao": "Atraso diagnóstico em malária grave — investigação em andamento pelo NSP.",
        },
    ]
