"""Oncologia e Cuidados Paliativos · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/oncologia", tags=["oncologia"])

@router.get("/dashboard")
async def dashboard():
    return {
        "pacientes_oncologicos": 34,
        "em_tratamento_ativo": 18,
        "cuidados_paliativos": 9,
        "casos_novos_mes": 3,
        "aguardando_diagnostico": 7,
        "tempo_medio_diagnostico_dias": 62,
        "meta_diagnostico_dias": 30,
        "tempo_medio_tratamento_dias": 88,
        "meta_tratamento_dias": 60,
        "encaminhados_oncologia_referencia": 22,
        "obitos_mes": 1,
        "status_geral": "critico",
        "principais_topografias": ["Mama", "Próstata", "Colo de útero", "Cólon"],
        "tfd_oncologia_ativos": 16,
    }

@router.get("/pacientes")
async def pacientes():
    return [
        {"id": "ONC-001", "topografia": "Mama",         "estadiamento": "III-A", "situacao": "Em QT",         "ciclo": "4/6",  "tempo_espera_dias": 45,  "tfd": True,  "status": "atencao", "alerta": None},
        {"id": "ONC-002", "topografia": "Próstata",      "estadiamento": "II",   "situacao": "Em RT",         "ciclo": "18/35","tempo_espera_dias": 62,  "tfd": True,  "status": "ok",      "alerta": None},
        {"id": "ONC-003", "topografia": "Colo de útero", "estadiamento": "II-B", "situacao": "Em QT+RT",      "ciclo": "3/6",  "tempo_espera_dias": 78,  "tfd": True,  "status": "atencao", "alerta": "Toxicidade G2 — náuseas"},
        {"id": "ONC-004", "topografia": "Cólon",         "estadiamento": "IV",   "situacao": "Paliativos",    "ciclo": None,   "tempo_espera_dias": None,"tfd": False, "status": "critico", "alerta": "Metástase hepática — morfina SOS"},
        {"id": "ONC-005", "topografia": "Pulmão",        "estadiamento": "IIIB", "situacao": "Aguard. biópsia","ciclo": None,  "tempo_espera_dias": 94,  "tfd": False, "status": "critico", "alerta": "94 dias sem diagnóstico — acima da meta"},
        {"id": "ONC-006", "topografia": "Mama",          "estadiamento": "I",    "situacao": "Pós-cirurgia",  "ciclo": None,   "tempo_espera_dias": 28,  "tfd": False, "status": "ok",      "alerta": None},
        {"id": "ONC-007", "topografia": "Tireoide",      "estadiamento": "II",   "situacao": "Em hormonioterapia","ciclo":"2/12","tempo_espera_dias": 34,"tfd": True,  "status": "ok",      "alerta": None},
        {"id": "ONC-008", "topografia": "Leucemia LLA",  "estadiamento": "Indução","situacao":"Em QT pediátrica","ciclo":"1/4","tempo_espera_dias": 18,  "tfd": True,  "status": "atencao", "alerta": "Criança 6a — suporte nutricional necessário"},
        {"id": "ONC-009", "topografia": "Linfoma NH",    "estadiamento": "II-A", "situacao": "Em QT CHOP",    "ciclo": "2/6",  "tempo_espera_dias": 41,  "tfd": True,  "status": "ok",      "alerta": None},
        {"id": "ONC-010", "topografia": "Próstata",      "estadiamento": "IV",   "situacao": "Paliativos",    "ciclo": None,   "tempo_espera_dias": None,"tfd": False, "status": "critico", "alerta": "Dor óssea refratária — avaliação ANS"},
    ]

@router.get("/paliativos")
async def paliativos():
    return [
        {"id": "PAL-001", "diagnostico": "Ca cólon IV",    "sintoma_principal": "Dor abdominal EVA 8/10", "morfina_dose": "30 mg/d",    "visita_domiciliar": True,  "familiar_cuidador": True,  "dias_programa": 42,  "status": "critico"},
        {"id": "PAL-002", "diagnostico": "Ca pulmão IIIB", "sintoma_principal": "Dispneia em repouso",   "morfina_dose": "20 mg/d",    "visita_domiciliar": True,  "familiar_cuidador": True,  "dias_programa": 28,  "status": "critico"},
        {"id": "PAL-003", "diagnostico": "Ca próstata IV", "sintoma_principal": "Dor óssea EVA 7/10",   "morfina_dose": "40 mg/d",    "visita_domiciliar": False, "familiar_cuidador": False, "dias_programa": 67,  "status": "critico", "alerta": "Sem cuidador familiar — assistência social"},
        {"id": "PAL-004", "diagnostico": "Ca mama IV",     "sintoma_principal": "Fadiga + anorexia",     "morfina_dose": "15 mg/d",    "visita_domiciliar": True,  "familiar_cuidador": True,  "dias_programa": 18,  "status": "atencao"},
        {"id": "PAL-005", "diagnostico": "Ca pâncreas IV", "sintoma_principal": "Dor epigástrica EVA 9","morfina_dose": "60 mg/d",    "visita_domiciliar": True,  "familiar_cuidador": True,  "dias_programa": 12,  "status": "critico"},
        {"id": "PAL-006", "diagnostico": "Ca fígado IV",   "sintoma_principal": "Ascite + icterícia",    "morfina_dose": "10 mg/d",    "visita_domiciliar": True,  "familiar_cuidador": True,  "dias_programa": 8,   "status": "atencao"},
        {"id": "PAL-007", "diagnostico": "LMA refratária","sintoma_principal": "Infecções recorrentes",  "morfina_dose": None,         "visita_domiciliar": False, "familiar_cuidador": True,  "dias_programa": 5,   "status": "atencao"},
        {"id": "PAL-008", "diagnostico": "Ca ovário III-C","sintoma_principal": "Dor pélvica + ascite",  "morfina_dose": "20 mg/d",    "visita_domiciliar": True,  "familiar_cuidador": True,  "dias_programa": 34,  "status": "atencao"},
        {"id": "PAL-009", "diagnostico": "GBM grau IV",   "sintoma_principal": "Déficit neurológico",   "morfina_dose": "15 mg/d",    "visita_domiciliar": True,  "familiar_cuidador": True,  "dias_programa": 22,  "status": "critico"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "casos_novos": 2, "em_tratamento": 16, "paliativos": 7,  "obitos": 1, "tempo_diag_dias": 68, "tfd_ativos": 14},
        {"mes": "Nov/25", "casos_novos": 3, "em_tratamento": 17, "paliativos": 8,  "obitos": 2, "tempo_diag_dias": 65, "tfd_ativos": 15},
        {"mes": "Dez/25", "casos_novos": 2, "em_tratamento": 16, "paliativos": 8,  "obitos": 1, "tempo_diag_dias": 70, "tfd_ativos": 14},
        {"mes": "Jan/26", "casos_novos": 4, "em_tratamento": 18, "paliativos": 9,  "obitos": 2, "tempo_diag_dias": 64, "tfd_ativos": 15},
        {"mes": "Fev/26", "casos_novos": 3, "em_tratamento": 18, "paliativos": 9,  "obitos": 1, "tempo_diag_dias": 62, "tfd_ativos": 16},
        {"mes": "Mar/26", "casos_novos": 3, "em_tratamento": 18, "paliativos": 9,  "obitos": 1, "tempo_diag_dias": 62, "tfd_ativos": 16},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Tempo diagnóstico → tratamento",    "valor": 62,  "meta": 30,   "unidade": "dias", "status": "critico", "observacao": "Acima do prazo lei 12.732"},
        {"indicador": "Pacientes em cuidados paliativos",  "valor": 9,   "meta": None, "unidade": "un",   "status": "atencao", "observacao": "Suporte de dor e conforto"},
        {"indicador": "TFD oncologia ativos",              "valor": 16,  "meta": None, "unidade": "un",   "status": "atencao", "observacao": "Custo médio R$2.400/paciente/mês"},
        {"indicador": "Cobertura rastreio mama (40-69a)",  "valor": 32.4,"meta": 70,   "unidade": "%",    "status": "critico", "observacao": "Abaixo da meta — ICSAP câncer"},
        {"indicador": "Cobertura rastreio colo útero",     "valor": 38.1,"meta": 80,   "unidade": "%",    "status": "critico", "observacao": "Meta ministerial 80%"},
        {"indicador": "Sem cuidador formal (paliativos)",  "valor": 1,   "meta": 0,    "unidade": "pac",  "status": "critico", "observacao": "PAL-003 sem suporte familiar"},
    ]
