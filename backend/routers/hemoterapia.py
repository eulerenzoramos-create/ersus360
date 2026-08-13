"""Hemoterapia — Banco de Sangue · Hemocomponentes · Doadores · FMS Apuí/AM
Apuí não possui hemocentro próprio; coletas feitas na UBS e enviadas a Humaitá/Manaus.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/hemoterapia", tags=["hemoterapia"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "doacoes_mes": 28,
        "meta_doacoes_mes": 40,
        "autossuficiencia_pct": 52,
        "status_estoque": "atencao",
        "descarte_pct": 6.4,
        "bolsas_descartadas_mes": 2,
        "triagem_inaptos_pct": 18.2,
        "estoque_critico": True,
        "hemocomponentes_criticos": ["O−", "AB+", "Plaquetas"],
    }


@router.get("/doacoes-historico")
async def doacoes_historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "coletadas": 24, "aptas": 20, "descartadas": 4},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "coletadas": 26, "aptas": 22, "descartadas": 4},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "coletadas": 22, "aptas": 18, "descartadas": 4},
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "coletadas": 30, "aptas": 26, "descartadas": 4},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "coletadas": 28, "aptas": 24, "descartadas": 4},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "coletadas": 31, "aptas": 29, "descartadas": 2},
    ]


@router.get("/estoque")
async def estoque():
    return [
        {"situacao_dado": "referencia_municipal", "hemocomponente": "Concentrado de Hemácias O+", "bolsas": 8, "estoque_minimo": 6, "validade_media_dias": 21, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "hemocomponente": "Concentrado de Hemácias O−", "bolsas": 1, "estoque_minimo": 4, "validade_media_dias": 21, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "hemocomponente": "Concentrado de Hemácias A+", "bolsas": 5, "estoque_minimo": 4, "validade_media_dias": 21, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "hemocomponente": "Concentrado de Hemácias B+", "bolsas": 3, "estoque_minimo": 4, "validade_media_dias": 21, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "hemocomponente": "Concentrado de Hemácias AB+", "bolsas": 0, "estoque_minimo": 2, "validade_media_dias": 21, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "hemocomponente": "Plasma Fresco Congelado", "bolsas": 6, "estoque_minimo": 4, "validade_media_dias": 90, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "hemocomponente": "Plaquetas", "bolsas": 1, "estoque_minimo": 4, "validade_media_dias": 5, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "hemocomponente": "Crioprecipitado", "bolsas": 4, "estoque_minimo": 3, "validade_media_dias": 365, "status": "ok"},
    ]


@router.get("/triagem-causas")
async def triagem_causas():
    return [
        {"situacao_dado": "referencia_municipal", "causa": "Anemia (Hb < 12,5 g/dL)", "inaptos": 8},
        {"situacao_dado": "referencia_municipal", "causa": "Janela imunológica / exposição de risco", "inaptos": 6},
        {"situacao_dado": "referencia_municipal", "causa": "Uso de medicamentos contraindicados", "inaptos": 4},
        {"situacao_dado": "referencia_municipal", "causa": "Hipertensão não controlada", "inaptos": 3},
        {"situacao_dado": "referencia_municipal", "causa": "Infecção recente (< 30 dias)", "inaptos": 3},
        {"situacao_dado": "referencia_municipal", "causa": "Peso < 50 kg", "inaptos": 2},
        {"situacao_dado": "referencia_municipal", "causa": "Outras causas", "inaptos": 1},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Autossuficiência em hemocomponentes",
            "valor": 52,
            "unidade": "%",
            "meta": 80,
            "status": "critico",
            "observacao": "Dependência de transfusões externas (Humaitá/Manaus) em casos de cirurgia e trauma.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Doações por 1.000 habitantes",
            "valor": 1.4,
            "unidade": "‰",
            "meta": 3.0,
            "status": "critico",
            "observacao": "OMS recomenda mínimo de 10‰; Brasil meta 3‰. Apuí muito abaixo — necessária campanha permanente.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Taxa de descarte de bolsas",
            "valor": 6.4,
            "unidade": "%",
            "meta": 5.0,
            "status": "atencao",
            "observacao": "Principal causa: vencimento por baixo giro (plaquetas validade 5 dias).",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Taxa de inaptidão na triagem",
            "valor": 18.2,
            "unidade": "%",
            "meta": 15,
            "status": "atencao",
            "observacao": "Anemia e janela imunológica são as principais causas — refletem perfil de saúde da população.",
        },
    ]
