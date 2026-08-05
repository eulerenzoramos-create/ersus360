from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/vig-epidem-avancada", tags=["vig_epidem_avancada"])

@lru_cache(maxsize=1)
def _SURTOS():
    return [
        {"id": "SRT-2026-001", "agravo": "Síndrome Diarreica Aguda", "bairro": "Vila Nova / Zona Rural Ramal do Juma",
         "data_inicio": "2026-03-12", "casos_confirmados": 38, "casos_suspeitos": 14, "obitos": 0,
         "investigacao": "concluida", "causa_provavel": "Água contaminada — poço coletivo sem tratamento",
         "medidas": ["Distribuição hipoclorito", "Notificação VIGIÁGUA", "Busca ativa ACS"], "status": "encerrado"},
        {"id": "SRT-2026-002", "agravo": "Intoxicação por Agrotóxico (Milho)", "bairro": "Comunidade Bela Vista / Ramal km 48",
         "data_inicio": "2026-04-28", "casos_confirmados": 6, "casos_suspeitos": 4, "obitos": 0,
         "investigacao": "em_andamento", "causa_provavel": "Aplicação sem EPI — Cipermetrina + Atrazina",
         "medidas": ["Afastamento área", "Notificação SINAN", "Apoio CEREST Humaitá"], "status": "ativo"},
        {"id": "SRT-2026-003", "agravo": "Síndrome Gripal com Internação", "bairro": "Centro / Bairro Santo Antônio",
         "data_inicio": "2026-06-02", "casos_confirmados": 22, "casos_suspeitos": 31, "obitos": 1,
         "investigacao": "em_andamento", "causa_provavel": "Influenza A H3N2 — confirmado LACEN/AM",
         "medidas": ["Campanha vacinal intensificada", "Antiviral Oseltamivir nos grupos de risco", "Isolamento domiciliar"], "status": "ativo"},
    ]


@lru_cache(maxsize=1)
def _BOLETIM_SEMANAS():
    return [
        {"semana": "SE 01", "dengue": 0, "malaria": 3, "leptospirose": 1, "hepatite_a": 0, "influenza": 2, "dda": 68, "total_notificacoes": 74},
        {"semana": "SE 02", "dengue": 0, "malaria": 4, "leptospirose": 0, "hepatite_a": 1, "influenza": 4, "dda": 72, "total_notificacoes": 81},
        {"semana": "SE 03", "dengue": 1, "malaria": 2, "leptospirose": 2, "hepatite_a": 0, "influenza": 6, "dda": 84, "total_notificacoes": 95},
        {"semana": "SE 04", "dengue": 2, "malaria": 5, "leptospirose": 0, "hepatite_a": 0, "influenza": 8, "dda": 91, "total_notificacoes": 106},
        {"semana": "SE 05", "dengue": 0, "malaria": 6, "leptospirose": 1, "hepatite_a": 2, "influenza": 5, "dda": 78, "total_notificacoes": 92},
        {"semana": "SE 06", "dengue": 1, "malaria": 3, "leptospirose": 0, "hepatite_a": 0, "influenza": 9, "dda": 86, "total_notificacoes": 99},
        {"semana": "SE 07", "dengue": 3, "malaria": 4, "leptospirose": 1, "hepatite_a": 1, "influenza": 12, "dda": 94, "total_notificacoes": 115},
        {"semana": "SE 08", "dengue": 2, "malaria": 7, "leptospirose": 0, "hepatite_a": 0, "influenza": 14, "dda": 88, "total_notificacoes": 111},
    ]


@lru_cache(maxsize=1)
def _SINAN_AGRAVOS():
    return [
        {"agravo": "Malária", "codigo": "A50", "notificacoes_ano": 284, "confirmados": 264, "encerrados_60d_pct": 82.4, "pendentes": 18, "status": "critico"},
        {"agravo": "Leishmaniose Tegumentar", "codigo": "B55.1", "notificacoes_ano": 48, "confirmados": 42, "encerrados_60d_pct": 78.6, "pendentes": 6, "status": "atencao"},
        {"agravo": "Dengue", "codigo": "A90", "notificacoes_ano": 24, "confirmados": 18, "encerrados_60d_pct": 91.7, "pendentes": 2, "status": "atencao"},
        {"agravo": "Tuberculose", "codigo": "A15", "notificacoes_ano": 40, "confirmados": 40, "encerrados_60d_pct": 70.0, "pendentes": 4, "status": "critico"},
        {"agravo": "Hanseníase", "codigo": "A30", "notificacoes_ano": 36, "confirmados": 36, "encerrados_60d_pct": 86.1, "pendentes": 1, "status": "ok"},
        {"agravo": "Hepatite B", "codigo": "B16", "notificacoes_ano": 18, "confirmados": 14, "encerrados_60d_pct": 77.8, "pendentes": 3, "status": "atencao"},
        {"agravo": "HIV/AIDS", "codigo": "B24", "notificacoes_ano": 14, "confirmados": 14, "encerrados_60d_pct": 92.9, "pendentes": 0, "status": "ok"},
        {"agravo": "Sífilis (todas)", "codigo": "A53", "notificacoes_ano": 91, "confirmados": 91, "encerrados_60d_pct": 68.1, "pendentes": 12, "status": "critico"},
        {"agravo": "Intoxicação Exógena", "codigo": "T65", "notificacoes_ano": 32, "confirmados": 28, "encerrados_60d_pct": 75.0, "pendentes": 5, "status": "atencao"},
        {"agravo": "Violência Doméstica", "codigo": "Z63", "notificacoes_ano": 64, "confirmados": 64, "encerrados_60d_pct": 84.4, "pendentes": 2, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Surtos ativos no município", "valor": 2, "meta": 0, "unidade": "surtos",
         "status": "critico", "observacao": "Intoxicação agrotóxico Bela Vista + Síndrome Gripal Centro — investigação em andamento"},
        {"indicador": "Notificações SINAN pendentes (>60d)", "valor": 53, "meta": 0, "unidade": "notificações",
         "status": "critico", "observacao": "Sífilis (12), Malária (18) e Tuberculose (4) concentram os atrasos"},
        {"indicador": "Oportunidade investigação surto (≤48h)", "valor": 66.7, "meta": 100.0, "unidade": "%",
         "status": "critico", "observacao": "1 de 3 surtos com investigação iniciada fora do prazo de 48h"},
        {"indicador": "Encerramento oportuno SINAN (≤60d)", "valor": 79.4, "meta": 90.0, "unidade": "%",
         "status": "atencao", "observacao": "79% dos casos encerrados no prazo — abaixo da meta nacional de 90%"},
        {"indicador": "Boletim epidemiológico semanal emitido", "valor": 26, "meta": 26, "unidade": "boletins/semestre",
         "status": "ok", "observacao": "Boletim semanal em dia — CIEVS municipal ativo"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan", "total_notificacoes": 312, "surtos_novos": 0, "encerrados_oportuno_pct": 81.4},
        {"mes": "Fev", "total_notificacoes": 284, "surtos_novos": 0, "encerrados_oportuno_pct": 83.1},
        {"mes": "Mar", "total_notificacoes": 398, "surtos_novos": 1, "encerrados_oportuno_pct": 76.2},
        {"mes": "Abr", "total_notificacoes": 342, "surtos_novos": 1, "encerrados_oportuno_pct": 78.9},
        {"mes": "Mai", "total_notificacoes": 364, "surtos_novos": 0, "encerrados_oportuno_pct": 80.4},
        {"mes": "Jun", "total_notificacoes": 412, "surtos_novos": 1, "encerrados_oportuno_pct": 79.4},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "surtos_ativos": 2,
        "surtos_encerrados_ano": 1,
        "notificacoes_mes": 412,
        "notificacoes_pendentes_60d": 53,
        "agravos_monitorados": 10,
        "encerramento_oportuno_pct": 79.4,
        "boletins_emitidos_semestre": 26,
        "casos_confirmados_semana_atual": 78,
    }


@router.get("/surtos")
def surtos():
    return _SURTOS


@router.get("/boletim-semanal")
def boletim_semanal():
    return _BOLETIM_SEMANAS


@router.get("/sinan-agravos")
def sinan_agravos():
    return _SINAN_AGRAVOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
