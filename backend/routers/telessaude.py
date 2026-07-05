"""Telessaúde — Teleconsulta, Tele-ECG, Telediagnóstico · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/telessaude", tags=["telessaude"])

@router.get("/dashboard")
async def dashboard():
    return {
        "teleconsultas_mes": 142,
        "teleecg_mes": 68,
        "teledermatologia_mes": 34,
        "segunda_opiniao_mes": 18,
        "total_teleatendimentos_mes": 262,
        "internacoes_evitadas_pct": 34.2,
        "satisfacao_profissional_pct": 88.4,
        "tempo_medio_resposta_horas": 4.2,
        "meta_resposta_horas": 6,
        "especialidades_ativas": 8,
        "status_geral": "ok",
        "economia_estimada_mes": 48600,
        "regulacoes_evitadas_mes": 28,
    }

@router.get("/especialidades")
async def especialidades():
    return [
        {"especialidade": "Cardiologia",      "teleconsultas": 38, "tele_ecg": 68, "regulacoes_evitadas": 12, "resolubilidade_pct": 72.0, "tempo_resp_h": 3.2, "status": "ok"},
        {"especialidade": "Dermatologia",     "teleconsultas": 28, "tele_ecg": 0,  "regulacoes_evitadas": 8,  "resolubilidade_pct": 68.5, "tempo_resp_h": 5.8, "status": "ok"},
        {"especialidade": "Psiquiatria",      "teleconsultas": 22, "tele_ecg": 0,  "regulacoes_evitadas": 4,  "resolubilidade_pct": 54.5, "tempo_resp_h": 6.4, "status": "atencao", "observacao": "Demanda crescente — fila espera 18 casos"},
        {"especialidade": "Endocrinologia",   "teleconsultas": 18, "tele_ecg": 0,  "regulacoes_evitadas": 2,  "resolubilidade_pct": 61.1, "tempo_resp_h": 4.8, "status": "ok"},
        {"especialidade": "Neurologia",       "teleconsultas": 14, "tele_ecg": 0,  "regulacoes_evitadas": 1,  "resolubilidade_pct": 50.0, "tempo_resp_h": 7.2, "status": "atencao", "observacao": "Baixa resolubilidade — casos complexos"},
        {"especialidade": "Ginecologia",      "teleconsultas": 12, "tele_ecg": 0,  "regulacoes_evitadas": 1,  "resolubilidade_pct": 75.0, "tempo_resp_h": 3.6, "status": "ok"},
        {"especialidade": "Pediatria",        "teleconsultas": 8,  "tele_ecg": 0,  "regulacoes_evitadas": 0,  "resolubilidade_pct": 87.5, "tempo_resp_h": 2.8, "status": "ok"},
        {"especialidade": "Pneumologia",      "teleconsultas": 2,  "tele_ecg": 0,  "regulacoes_evitadas": 0,  "resolubilidade_pct": 50.0, "tempo_resp_h": 5.2, "status": "ok"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "teleconsultas": 118, "teleecg": 58, "telederma": 28, "segunda_opiniao": 14, "total": 218, "economia": 38200},
        {"mes": "Nov/25", "teleconsultas": 124, "teleecg": 62, "telederma": 30, "segunda_opiniao": 16, "total": 232, "economia": 40800},
        {"mes": "Dez/25", "teleconsultas": 108, "teleecg": 52, "telederma": 24, "segunda_opiniao": 12, "total": 196, "economia": 34400},
        {"mes": "Jan/26", "teleconsultas": 132, "teleecg": 64, "telederma": 32, "segunda_opiniao": 16, "total": 244, "economia": 42800},
        {"mes": "Fev/26", "teleconsultas": 138, "teleecg": 66, "telederma": 32, "segunda_opiniao": 18, "total": 254, "economia": 44600},
        {"mes": "Mar/26", "teleconsultas": 142, "teleecg": 68, "telederma": 34, "segunda_opiniao": 18, "total": 262, "economia": 48600},
    ]

@router.get("/solicitantes")
async def solicitantes():
    return [
        {"esf": "ESF Central",       "teleconsultas_mes": 52, "adesao_pct": 94.2, "resolubilidade_pct": 71.2, "top_especialidade": "Cardiologia"},
        {"esf": "ESF Matupi",        "teleconsultas_mes": 38, "adesao_pct": 88.6, "resolubilidade_pct": 68.4, "top_especialidade": "Dermatologia"},
        {"esf": "ESF Vila Nova",     "teleconsultas_mes": 28, "adesao_pct": 82.1, "resolubilidade_pct": 64.3, "top_especialidade": "Psiquiatria"},
        {"esf": "ESF Rio Juma",      "teleconsultas_mes": 18, "adesao_pct": 71.4, "resolubilidade_pct": 72.2, "top_especialidade": "Pediatria"},
        {"esf": "UBS Igapó-Açu",     "teleconsultas_mes": 6,  "adesao_pct": 58.3, "resolubilidade_pct": 83.3, "top_especialidade": "Ginecologia"},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Resolubilidade teleconsultas",   "valor": 66.9, "meta": 70,  "unidade": "%", "status": "atencao", "observacao": "Evita deslocamentos e TFD"},
        {"indicador": "Tempo médio de resposta",        "valor": 4.2,  "meta": 6,   "unidade": "h", "status": "ok",      "observacao": "Abaixo da meta — excelente"},
        {"indicador": "Satisfação dos solicitantes",    "valor": 88.4, "meta": 80,  "unidade": "%", "status": "ok",      "observacao": "Alta adesão nas ESF"},
        {"indicador": "Regulações evitadas/mês",        "valor": 28,   "meta": 20,  "unidade": "un","status": "ok",      "observacao": "Reduz fila SISREG 9%"},
        {"indicador": "Economia estimada/mês",          "valor": 48600,"meta": None,"unidade": "R$","status": "ok",      "observacao": "TFD + diárias + transporte"},
        {"indicador": "Cobertura ESF com telessaúde",   "valor": 100,  "meta": 100, "unidade": "%", "status": "ok",      "observacao": "Todas as 5 unidades conectadas"},
    ]
