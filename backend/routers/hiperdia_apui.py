"""
Router: /api/hiperdia-apui — ERSUS 360
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
Alta prevalência HAS/DM no interior AM — população adulta sedentária,
dieta rica em carboidratos, baixa cobertura de especialistas.
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/hiperdia-apui", tags=["hiperdia_apui"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "hipertensos_cadastrados": 1847,
        "hipertensos_cobertura_pct": 68,
        "hipertensos_controlados_pct": 41,
        "meta_controlados_pct": 60,
        "diabeticos_cadastrados": 621,
        "diabeticos_cobertura_pct": 64,
        "diabeticos_controlados_pct": 34,
        "meta_diabeticos_controlados_pct": 55,
        "hba1c_media_pct": 8.6,
        "meta_hba1c_pct": 7.0,
        "abandono_tratamento_pct": 22,
        "meta_abandono_pct": 10,
        "internacoes_icsap_has_dm_ano": 47,
        "amputacoes_dm_ano": 3,
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/controle-has")
async def controle_has():
    return {
        "situacao_dado": "referencia_municipal",
        "distribuicao_estadiamento": [
            {"estadio": "Normal / Controlada (< 130/80)",  "n": 757,  "pct": 41, "cor": "ok"},
            {"estadio": "Estágio 1 (130-139/80-89)",       "n": 498,  "pct": 27, "cor": "atencao"},
            {"estadio": "Estágio 2 (140-159/90-99)",       "n": 387,  "pct": 21, "cor": "critico"},
            {"estadio": "Estágio 3 (≥ 160/100)",           "n": 148,  "pct": 8,  "cor": "critico"},
            {"estadio": "Em investigação / sem aferição",  "n": 57,   "pct": 3,  "cor": "atencao"},
        ],
        "por_equipe": [
            {"equipe": "ESF Centro",      "cadastrados": 498, "controlados": 211, "pct_controle": 42},
            {"equipe": "ESF Cidade Nova", "cadastrados": 534, "controlados": 224, "pct_controle": 42},
            {"equipe": "ESF Colônia",     "cadastrados": 412, "controlados": 155, "pct_controle": 38},
            {"equipe": "ESF Rural",       "cadastrados": 403, "controlados": 167, "pct_controle": 41},
        ],
    }


@router.get("/controle-dm")
async def controle_dm():
    return {
        "situacao_dado": "referencia_municipal",
        "distribuicao_controle": [
            {"grupo": "Controlado (HbA1c < 7%)",          "n": 211,  "pct": 34, "cor": "ok"},
            {"grupo": "Alerta (HbA1c 7-8%)",              "n": 180,  "pct": 29, "cor": "atencao"},
            {"grupo": "Descontrolado (HbA1c 8-10%)",      "n": 155,  "pct": 25, "cor": "critico"},
            {"grupo": "Muito descontrolado (HbA1c > 10%)", "n": 75,  "pct": 12, "cor": "critico"},
        ],
        "por_equipe": [
            {"equipe": "ESF Centro",      "cadastrados": 168, "controlados_hba1c": 58,  "pct_controle": 35, "sem_hba1c_6m": 42},
            {"equipe": "ESF Cidade Nova", "cadastrados": 181, "controlados_hba1c": 63,  "pct_controle": 35, "sem_hba1c_6m": 51},
            {"equipe": "ESF Colônia",     "cadastrados": 138, "controlados_hba1c": 44,  "pct_controle": 32, "sem_hba1c_6m": 38},
            {"equipe": "ESF Rural",       "cadastrados": 134, "controlados_hba1c": 46,  "pct_controle": 34, "sem_hba1c_6m": 34},
        ],
        "complicacoes_ativas": {
            "pes_diabetico": 34,
            "retinopatia_suspeita": 51,
            "nefropatia_estagio_3_4": 18,
            "amputacoes_acumuladas": 12,
        },
    }


@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "hipertensos_controlados_pct": 38, "diabeticos_controlados_pct": 31, "internacoes_icsap": 7, "novos_diagnosticos_has": 12, "novos_diagnosticos_dm": 5},
        {"mes": "Fev/26", "hipertensos_controlados_pct": 39, "diabeticos_controlados_pct": 32, "internacoes_icsap": 8, "novos_diagnosticos_has": 10, "novos_diagnosticos_dm": 4},
        {"mes": "Mar/26", "hipertensos_controlados_pct": 40, "diabeticos_controlados_pct": 33, "internacoes_icsap": 9, "novos_diagnosticos_has": 13, "novos_diagnosticos_dm": 6},
        {"mes": "Abr/26", "hipertensos_controlados_pct": 40, "diabeticos_controlados_pct": 33, "internacoes_icsap": 7, "novos_diagnosticos_has": 11, "novos_diagnosticos_dm": 4},
        {"mes": "Mai/26", "hipertensos_controlados_pct": 41, "diabeticos_controlados_pct": 34, "internacoes_icsap": 8, "novos_diagnosticos_has": 14, "novos_diagnosticos_dm": 5},
        {"mes": "Jun/26", "hipertensos_controlados_pct": 41, "diabeticos_controlados_pct": 34, "internacoes_icsap": 8, "novos_diagnosticos_has": 12, "novos_diagnosticos_dm": 5},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Proporção HAS controlada",                   "valor": 41,  "meta": 60,  "unidade": "%",       "status": "critico",  "observacao": "Abaixo da meta Previne Brasil. Principal causa: abandono."},
        {"indicador": "Proporção DM controlado (HbA1c < 7%)",       "valor": 34,  "meta": 55,  "unidade": "%",       "status": "critico",  "observacao": "Acesso limitado à HbA1c — laboratório fora do município."},
        {"indicador": "Cobertura cadastral HAS (estimativa pop.)",   "valor": 68,  "meta": 80,  "unidade": "%",       "status": "atencao",  "observacao": "~870 HAS estimados não cadastrados."},
        {"indicador": "Cobertura cadastral DM (estimativa pop.)",    "valor": 64,  "meta": 80,  "unidade": "%",       "status": "critico",  "observacao": "Alta subdiagnose em zona rural."},
        {"indicador": "Abandono de tratamento HAS/DM",               "valor": 22,  "meta": 10,  "unidade": "%",       "status": "critico",  "observacao": "Relacionado a desabastecimento e distância."},
        {"indicador": "Internações ICSAP HAS+DM / ano",              "valor": 47,  "meta": 25,  "unidade": "intern.", "status": "critico",  "observacao": "Predomina HAS estágio 3 sem controle."},
        {"indicador": "Amputações membros inferiores DM / ano",      "valor": 3,   "meta": 0,   "unidade": "casos",   "status": "critico",  "observacao": "Todos referenciados pós-amputação para Manaus."},
        {"indicador": "HbA1c realizado nos últimos 6 meses (%DM)",   "valor": 48,  "meta": 75,  "unidade": "%",       "status": "critico",  "observacao": "Barreira logística — lab em Humaitá."},
    ]
