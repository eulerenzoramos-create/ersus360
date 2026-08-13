"""Telessaúde — Teleconsulta · Tele-ECG · Teledermatologia · 2ª Opinião · FMS Apuí/AM
Plataforma: Rede HU-UFAM / RUTE · Tele-ECG via SCTIE/MS
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/telessaude", tags=["telessaude"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "total_teleatendimentos_mes": 124,
        "especialidades_ativas": 8,
        "tempo_medio_resposta_horas": 3.2,
        "meta_resposta_horas": 4,
        "internacoes_evitadas_pct": 62,
        "economia_estimada_mes": 48600,
        "regulacoes_evitadas_mes": 38,
    }


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "teleconsultas": 72, "teleecg": 18, "telederma": 14, "segunda_opiniao": 8, "economia": 38200},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "teleconsultas": 78, "teleecg": 20, "telederma": 16, "segunda_opiniao": 9, "economia": 41400},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "teleconsultas": 68, "teleecg": 16, "telederma": 12, "segunda_opiniao": 7, "economia": 35100},
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "teleconsultas": 88, "teleecg": 22, "telederma": 18, "segunda_opiniao": 11, "economia": 44800},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "teleconsultas": 92, "teleecg": 24, "telederma": 18, "segunda_opiniao": 10, "economia": 46700},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "teleconsultas": 96, "teleecg": 26, "telederma": 20, "segunda_opiniao": 11, "economia": 48600},
    ]


@router.get("/especialidades")
async def especialidades():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Cardiologia (Tele-ECG + consulta)",
            "teleconsultas": 26,
            "tele_ecg": 26,
            "tempo_resp_h": 2.1,
            "regulacoes_evitadas": 10,
            "resolubilidade_pct": 74,
            "observacao": None,
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Psiquiatria",
            "teleconsultas": 22,
            "tele_ecg": 0,
            "tempo_resp_h": 3.8,
            "regulacoes_evitadas": 9,
            "resolubilidade_pct": 68,
            "observacao": None,
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Dermatologia (Teledermatoscopia)",
            "teleconsultas": 20,
            "tele_ecg": 0,
            "tempo_resp_h": 5.2,
            "regulacoes_evitadas": 8,
            "resolubilidade_pct": 71,
            "observacao": "Tempo resposta acima da meta (4h) — único dermatologista parceiro com alta demanda.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Pneumologia",
            "teleconsultas": 18,
            "tele_ecg": 0,
            "tempo_resp_h": 3.0,
            "regulacoes_evitadas": 6,
            "resolubilidade_pct": 66,
            "observacao": None,
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Neurologia",
            "teleconsultas": 14,
            "tele_ecg": 0,
            "tempo_resp_h": 4.6,
            "regulacoes_evitadas": 4,
            "resolubilidade_pct": 48,
            "observacao": "Muitos casos requerem presencial — resolubilidade limitada para epilepsia e AVC.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Endocrinologia",
            "teleconsultas": 12,
            "tele_ecg": 0,
            "tempo_resp_h": 2.9,
            "regulacoes_evitadas": 5,
            "resolubilidade_pct": 72,
            "observacao": None,
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Oftalmologia",
            "teleconsultas": 8,
            "tele_ecg": 0,
            "tempo_resp_h": 3.5,
            "regulacoes_evitadas": 2,
            "resolubilidade_pct": 42,
            "observacao": "Casos de cirurgia (catarata, pterígio) não resolvíveis via tele — encaminhamento inevitável.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "2ª Opinião Formativa",
            "teleconsultas": 11,
            "tele_ecg": 0,
            "tempo_resp_h": 3.1,
            "regulacoes_evitadas": 4,
            "resolubilidade_pct": 80,
            "observacao": None,
        },
    ]
