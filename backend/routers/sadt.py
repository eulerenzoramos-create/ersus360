"""SADT — Serviço de Apoio Diagnóstico e Terapêutico · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/sadt", tags=["sadt"])

@router.get("/dashboard")
async def dashboard():
    return {
        "exames_mes": 1842,
        "exames_lab_mes": 1240,
        "exames_imagem_mes": 402,
        "exames_outros_mes": 200,
        "pendentes_coleta": 38,
        "pendentes_resultado": 64,
        "criticos_pendentes": 4,
        "tat_lab_horas": 6.2,
        "tat_imagem_horas": 18.4,
        "meta_tat_lab_horas": 8,
        "meta_tat_imagem_horas": 24,
        "laudos_digitais_pct": 88.6,
        "status_geral": "atencao",
        "exames_alterados_mes": 287,
        "alterados_pct": 15.6,
    }

@router.get("/laboratorio")
async def laboratorio():
    return [
        {"exame": "Hemograma completo",        "realizados_mes": 320, "alterados": 62, "alt_pct": 19.4, "tat_h": 4.0,  "criticos": 3,  "status": "ok"},
        {"exame": "Glicemia de jejum",          "realizados_mes": 218, "alterados": 48, "alt_pct": 22.0, "tat_h": 3.5,  "criticos": 1,  "status": "ok"},
        {"exame": "HbA1c",                      "realizados_mes": 142, "alterados": 38, "alt_pct": 26.8, "tat_h": 5.0,  "criticos": 0,  "status": "ok"},
        {"exame": "Perfil lipídico",            "realizados_mes": 168, "alterados": 44, "alt_pct": 26.2, "tat_h": 4.5,  "criticos": 0,  "status": "ok"},
        {"exame": "Ureia e creatinina",         "realizados_mes": 124, "alterados": 28, "alt_pct": 22.6, "tat_h": 4.0,  "criticos": 2,  "status": "ok"},
        {"exame": "TGO/TGP/GGT",               "realizados_mes": 98,  "alterados": 18, "alt_pct": 18.4, "tat_h": 5.5,  "criticos": 1,  "status": "ok"},
        {"exame": "TSH/T4 livre",               "realizados_mes": 86,  "alterados": 22, "alt_pct": 25.6, "tat_h": 6.0,  "criticos": 0,  "status": "ok"},
        {"exame": "Urina rotina (EAS)",         "realizados_mes": 84,  "alterados": 27, "alt_pct": 32.1, "tat_h": 3.0,  "criticos": 0,  "status": "ok"},
        {"exame": "Cultura e antibiograma",     "realizados_mes": 42,  "alterados": 26, "alt_pct": 61.9, "tat_h": 72.0, "criticos": 4,  "status": "atencao", "alerta": "Tempo de resposta elevado — 72h para cultura"},
        {"exame": "Dengue NS1/IgM/IgG",        "realizados_mes": 58,  "alterados": 14, "alt_pct": 24.1, "tat_h": 5.0,  "criticos": 0,  "status": "ok"},
    ]

@router.get("/imagem")
async def imagem():
    return [
        {"modalidade": "Radiografia",        "realizados_mes": 180, "laudados": 178, "pendentes": 2,  "tat_h": 8.0,  "status": "ok",      "equipamento": "Digital — Hospital Municipal"},
        {"modalidade": "Ultrassonografia",   "realizados_mes": 96,  "laudados": 90,  "pendentes": 6,  "tat_h": 24.0, "status": "atencao", "equipamento": "Portátil — 2 US disponíveis"},
        {"modalidade": "ECG",                "realizados_mes": 68,  "laudados": 68,  "pendentes": 0,  "tat_h": 2.0,  "status": "ok",      "equipamento": "3 aparelhos — UPA + Hospital"},
        {"modalidade": "Espirometria",        "realizados_mes": 24,  "laudados": 24,  "pendentes": 0,  "tat_h": 6.0,  "status": "ok",      "equipamento": "1 espirômetro — Policlínica"},
        {"modalidade": "Ecocardiograma",      "realizados_mes": 18,  "laudados": 14,  "pendentes": 4,  "tat_h": 72.0, "status": "critico", "equipamento": "Itinerante — 2x/mês apenas", "alerta": "Fila espera: 28 pacientes"},
        {"modalidade": "Endoscopia digest.",  "realizados_mes": 12,  "laudados": 12,  "pendentes": 0,  "tat_h": 4.0,  "status": "ok",      "equipamento": "Contrato SISREG — 2x/mês"},
        {"modalidade": "Tomografia",          "realizados_mes": 4,   "laudados": 4,   "pendentes": 0,  "tat_h": 168.0,"status": "critico", "equipamento": "Via TFD — Humaitá ou Manaus", "alerta": "Sem TC no município — regulação obrigatória"},
    ]

@router.get("/criticos")
async def criticos():
    return [
        {"id": "LAB-2641", "exame": "Glicemia", "valor": "28 mg/dL",    "referencia": "70-99",  "paciente_id": "P-4821", "notificado": True,  "hora_resultado": "07:14", "hora_notificacao": "07:18", "conduta": "Glucagon IM + monitoramento"},
        {"id": "LAB-2688", "exame": "Potássio",  "valor": "6.8 mEq/L",  "referencia": "3.5-5.0","paciente_id": "P-5102", "notificado": True,  "hora_resultado": "09:32", "hora_notificacao": "09:36", "conduta": "ECG de urgência solicitado"},
        {"id": "LAB-2712", "exame": "Troponina", "valor": "2.4 ng/mL",  "referencia": "<0.04",  "paciente_id": "P-5238", "notificado": True,  "hora_resultado": "11:06", "hora_notificacao": "11:09", "conduta": "Transferência SAMU para Humaitá"},
        {"id": "LAB-2744", "exame": "Hb",        "valor": "4.2 g/dL",   "referencia": "12.0-16","paciente_id": "P-5341", "notificado": False, "hora_resultado": "13:48", "hora_notificacao": None,    "conduta": None, "alerta": "CRÍTICO NÃO NOTIFICADO — ação imediata"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "lab": 1180, "imagem": 368, "outros": 186, "total": 1734, "tat_lab": 6.8, "tat_imagem": 20.2, "criticos": 6},
        {"mes": "Nov/25", "lab": 1210, "imagem": 380, "outros": 192, "total": 1782, "tat_lab": 6.5, "tat_imagem": 19.8, "criticos": 5},
        {"mes": "Dez/25", "lab": 1160, "imagem": 350, "outros": 178, "total": 1688, "tat_lab": 7.0, "tat_imagem": 21.4, "criticos": 4},
        {"mes": "Jan/26", "lab": 1190, "imagem": 372, "outros": 188, "total": 1750, "tat_lab": 6.6, "tat_imagem": 20.8, "criticos": 7},
        {"mes": "Fev/26", "lab": 1228, "imagem": 390, "outros": 194, "total": 1812, "tat_lab": 6.3, "tat_imagem": 19.2, "criticos": 5},
        {"mes": "Mar/26", "lab": 1240, "imagem": 402, "outros": 200, "total": 1842, "tat_lab": 6.2, "tat_imagem": 18.4, "criticos": 4},
    ]
