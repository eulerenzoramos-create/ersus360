"""TB e Hanseníase — SINAN · DOTS · PQT · Vigilância Epidemiológica · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/tb-hanseniase", tags=["tb_hanseniase"])

@router.get("/dashboard")
async def dashboard():
    return {
        "tb_casos_novos_mes": 4,
        "tb_em_tratamento": 28,
        "tb_cura_pct": 82.1,
        "tb_meta_cura_pct": 85.0,
        "tb_abandono_pct": 8.4,
        "tb_dots_cobertura_pct": 78.6,
        "tb_tb_rr_suspeitos": 1,
        "hanseniase_casos_novos_mes": 2,
        "hanseniase_em_tratamento": 18,
        "hanseniase_cura_pct": 88.9,
        "hanseniase_grau2_incapacidade_pct": 11.1,
        "hanseniase_contatos_examinados_pct": 72.4,
        "meta_contatos_examinados_pct": 100,
        "coinfeccao_tb_hiv_pct": 14.3,
        "status_geral": "atencao",
    }

@router.get("/tuberculose")
async def tuberculose():
    return {
        "em_tratamento": 28,
        "esquemas": [
            {"esquema": "RHZE (2 meses)",     "pacientes": 12, "fase": "intensiva",    "dots": True},
            {"esquema": "RH (4 meses)",       "pacientes": 14, "fase": "manutencao",   "dots": True},
            {"esquema": "RHE — TB resistente","pacientes": 2,  "fase": "especializado","dots": True},
        ],
        "desfechos_ultimos_12m": [
            {"desfecho": "Cura",              "casos": 32, "pct": 82.1},
            {"desfecho": "Abandono",          "casos": 4,  "pct": 10.3},
            {"desfecho": "Óbito por TB",      "casos": 1,  "pct": 2.6},
            {"desfecho": "Mudança de esquema","casos": 2,  "pct": 5.1},
        ],
        "formas": [
            {"forma": "Pulmonar bacilífera",   "casos": 18, "pct": 64.3, "contatos_por_caso": 8},
            {"forma": "Pulmonar não bacilífera","casos": 6,  "pct": 21.4, "contatos_por_caso": 4},
            {"forma": "Extrapulmonar",          "casos": 4,  "pct": 14.3, "contatos_por_caso": 2},
        ],
        "populacoes_vulneraveis": [
            {"grupo": "Indígenas",          "casos_12m": 8,  "pct_total": 20.5, "alerta": True},
            {"grupo": "Privados de liberdade","casos_12m": 4, "pct_total": 10.3, "alerta": True},
            {"grupo": "Pessoas em situação de rua","casos_12m": 3, "pct_total": 7.7, "alerta": True},
            {"grupo": "Coinfectados TB/HIV","casos_12m": 6,  "pct_total": 15.4, "alerta": True},
        ],
        "tb_drogarresistente": {
            "suspeitos_mes": 1,
            "em_investigacao": 1,
            "confirmados_12m": 0,
            "encaminhamento": "HUAM/Manaus",
        },
    }

@router.get("/hanseniase")
async def hanseniase():
    return {
        "em_tratamento": 18,
        "esquemas": [
            {"esquema": "PQT PB 6 doses",   "pacientes": 8,  "classificacao": "Paucibacilar"},
            {"esquema": "PQT MB 12 doses",  "pacientes": 10, "classificacao": "Multibacilar"},
        ],
        "classificacao_operacional": [
            {"tipo": "Paucibacilar (PB)",    "casos": 8,  "pct": 44.4},
            {"tipo": "Multibacilar (MB)",    "casos": 10, "pct": 55.6},
        ],
        "grau_incapacidade_diagnostico": [
            {"grau": "Grau 0 — sem incapacidade",    "casos": 12, "pct": 66.7},
            {"grau": "Grau 1 — sens. reduzida",      "casos": 4,  "pct": 22.2},
            {"grau": "Grau 2 — incapacidade visível","casos": 2,  "pct": 11.1},
        ],
        "contatos_examinados": {
            "registrados": 124,
            "examinados": 90,
            "pct": 72.4,
            "meta_pct": 100,
            "pendentes": 34,
        },
        "desfechos_ultimos_12m": [
            {"desfecho": "Cura",     "casos": 16, "pct": 88.9},
            {"desfecho": "Abandono", "casos": 1,  "pct": 5.6},
            {"desfecho": "Óbito",    "casos": 1,  "pct": 5.6},
        ],
    }

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "tb_novos": 3, "tb_tratamento": 26, "tb_cura_pct": 80.0, "hans_novos": 2, "hans_tratamento": 17, "hans_cura_pct": 87.5, "contatos_exam_pct": 68.0},
        {"mes": "Nov/25", "tb_novos": 4, "tb_tratamento": 27, "tb_cura_pct": 81.0, "hans_novos": 1, "hans_tratamento": 17, "hans_cura_pct": 88.0, "contatos_exam_pct": 69.4},
        {"mes": "Dez/25", "tb_novos": 3, "tb_tratamento": 27, "tb_cura_pct": 81.5, "hans_novos": 2, "hans_tratamento": 18, "hans_cura_pct": 88.0, "contatos_exam_pct": 70.8},
        {"mes": "Jan/26", "tb_novos": 4, "tb_tratamento": 27, "tb_cura_pct": 81.8, "hans_novos": 1, "hans_tratamento": 18, "hans_cura_pct": 88.2, "contatos_exam_pct": 71.6},
        {"mes": "Fev/26", "tb_novos": 3, "tb_tratamento": 28, "tb_cura_pct": 82.0, "hans_novos": 2, "hans_tratamento": 18, "hans_cura_pct": 88.5, "contatos_exam_pct": 72.0},
        {"mes": "Mar/26", "tb_novos": 4, "tb_tratamento": 28, "tb_cura_pct": 82.1, "hans_novos": 2, "hans_tratamento": 18, "hans_cura_pct": 88.9, "contatos_exam_pct": 72.4},
    ]
