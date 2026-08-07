from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/farmacia-basica-apui", tags=["farmacia_basica_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "itens_rename_pactuados": 108,
        "itens_estoque_adequado": 91,
        "itens_em_falta_30d": 12,
        "itens_abaixo_estoque_minimo": 18,
        "disponibilidade_basico_pct": 84.2,
        "meta_disponibilidade_pct": 95.0,
        "dispensacoes_mes": 8400,
        "usuarios_cadastrados_hiperdia": 3824,
        "adesao_medicamento_hiperdia_pct": 72.4,
        "meta_adesao_pct": 85.0,
        "insulina_desabastecimento_meses_2025": 3,
        "psicofarmacos_disponibilidade_pct": 84.2,
        "farmaceuticos_sus": 2,
        "farmaceuticos_necessarios": 8,
        "ubs_sem_farmaceutico_pct": 75.0,
        "ceaf_referencia": "Manicoré / Manaus",
        "ceaf_pacientes_municipio": 184,
        "custo_total_componente_basico_mes_R": 124000,
        "perdas_validade_pct": 4.8,
        "meta_perdas_pct": 2.0,
        "status_disponibilidade": "atencao",
        "status_adesao": "atencao",
        "status_rh": "critico",
    }


@lru_cache(maxsize=1)
def _ITENS_CRITICOS():
    return [
        {"item": "Insulina NPH 100UI/mL",             "categoria": "DM",      "falta_dias": 28, "pacientes_impactados": 184, "alternativa": "Nenhuma", "status": "critico"},
        {"item": "Metformina 850mg",                   "categoria": "DM",      "falta_dias": 0,  "pacientes_impactados": 0,   "alternativa": "OK",      "status": "ok"},
        {"item": "Enalapril 10mg",                     "categoria": "HAS",     "falta_dias": 0,  "pacientes_impactados": 0,   "alternativa": "OK",      "status": "ok"},
        {"item": "Clonazepam 2mg",                     "categoria": "Psiq.",   "falta_dias": 18, "pacientes_impactados": 84,  "alternativa": "Parcial", "status": "critico"},
        {"item": "Artemisinina combinada (malária)",   "categoria": "Malária", "falta_dias": 12, "pacientes_impactados": 48,  "alternativa": "Nenhuma", "status": "critico"},
        {"item": "Penicilina Benzatina 1.200.000UI",   "categoria": "Sífilis", "falta_dias": 8,  "pacientes_impactados": 22,  "alternativa": "Nenhuma", "status": "critico"},
        {"item": "Salbutamol spray 100mcg",            "categoria": "Resp.",   "falta_dias": 14, "pacientes_impactados": 124, "alternativa": "Nenhuma", "status": "critico"},
        {"item": "Rifampicina + Isoniazida (TB)",      "categoria": "TB",      "falta_dias": 0,  "pacientes_impactados": 0,   "alternativa": "OK",      "status": "ok"},
        {"item": "Haloperidol 5mg",                    "categoria": "Psiq.",   "falta_dias": 22, "pacientes_impactados": 42,  "alternativa": "Parcial", "status": "critico"},
        {"item": "Amoxicilina 500mg",                  "categoria": "ATB",     "falta_dias": 0,  "pacientes_impactados": 0,   "alternativa": "OK",      "status": "ok"},
        {"item": "Sulfato Ferroso 40mg",               "categoria": "Nutric.", "falta_dias": 7,  "pacientes_impactados": 284, "alternativa": "Parcial", "status": "atencao"},
        {"item": "Ácido Fólico 5mg",                   "categoria": "Nutric.", "falta_dias": 0,  "pacientes_impactados": 0,   "alternativa": "OK",      "status": "ok"},
    ]


@lru_cache(maxsize=1)
def _ADESAO_DCNT():
    return [
        {"grupo": "HAS leve/moderada",         "pacientes": 1284, "adesao_pct": 78.4, "abandono_pct": 12.4, "sem_medicamento_pct": 9.2,  "status": "atencao"},
        {"grupo": "HAS grave / resistente",    "pacientes": 284,  "adesao_pct": 68.4, "abandono_pct": 18.4, "sem_medicamento_pct": 13.2, "status": "critico"},
        {"grupo": "DM tipo 2 (sem insulina)",  "pacientes": 684,  "adesao_pct": 72.4, "abandono_pct": 14.2, "sem_medicamento_pct": 13.4, "status": "atencao"},
        {"grupo": "DM tipo 1 / insulinodep.",  "pacientes": 184,  "adesao_pct": 58.4, "abandono_pct": 22.4, "sem_medicamento_pct": 19.2, "status": "critico"},
        {"grupo": "Saúde mental (CAPS)",       "pacientes": 284,  "adesao_pct": 64.2, "abandono_pct": 24.4, "sem_medicamento_pct": 11.4, "status": "critico"},
        {"grupo": "TB (PQT completo)",         "pacientes": 22,   "adesao_pct": 64.2, "abandono_pct": 18.4, "sem_medicamento_pct": 17.4, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "disponibilidade_pct": 80.4, "dispensacoes": 7840, "itens_falta": 16, "adesao_hiperdia_pct": 68.4, "custo_R": 118000},
        {"mes": "Fev/25", "disponibilidade_pct": 81.2, "dispensacoes": 7960, "itens_falta": 15, "adesao_hiperdia_pct": 69.8, "custo_R": 119000},
        {"mes": "Mar/25", "disponibilidade_pct": 82.4, "dispensacoes": 8080, "itens_falta": 14, "adesao_hiperdia_pct": 70.8, "custo_R": 120000},
        {"mes": "Abr/25", "disponibilidade_pct": 83.4, "dispensacoes": 8200, "itens_falta": 13, "adesao_hiperdia_pct": 71.4, "custo_R": 121000},
        {"mes": "Mai/25", "disponibilidade_pct": 83.8, "dispensacoes": 8320, "itens_falta": 13, "adesao_hiperdia_pct": 72.0, "custo_R": 123000},
        {"mes": "Jun/25", "disponibilidade_pct": 84.2, "dispensacoes": 8400, "itens_falta": 12, "adesao_hiperdia_pct": 72.4, "custo_R": 124000},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Disponibilidade Componente Básico",  "valor": 84.2, "meta": 95.0, "unidade": "%",      "status": "atencao", "observacao": "10,8 pp abaixo da meta — 12 itens em falta há > 30 dias. Insulina NPH desabastecida 3 meses em 2025 impactou 184 diabéticos insulinodependentes. Falta de penicilina benzatina em 8 dias compromete tratamento de sífilis"},
        {"indicador": "Farmacêuticos SUS",                  "valor": 2,    "meta": 8,    "unidade": "profis.", "status": "critico", "observacao": "2 de 8 farmacêuticos necessários — 75% das UBS sem farmacêutico residente. Dispensação feita por técnico ou auxiliar de enfermagem. Sem orientação farmacêutica = abandono de tratamento e interações medicamentosas não detectadas"},
        {"indicador": "Adesão — HIPERDIA",                  "valor": 72.4, "meta": 85.0, "unidade": "%",      "status": "atencao", "observacao": "27,6% sem adesão ao medicamento de HAS/DM — principal causa de ICSAP (184 internações/ano). Abandono por desabastecimento (13,2% sem medicamento), distância e efeitos colaterais não gerenciados"},
        {"indicador": "Adesão — Saúde Mental",              "valor": 64.2, "meta": 85.0, "unidade": "%",      "status": "critico", "observacao": "35,8% sem adesão aos psicofarmacos — abandono de tratamento alimenta 28,4% de desinstitucionalização do CAPS. Desabastecimento de haloperidol e clonazepam em 2025 diretamente relacionado"},
        {"indicador": "Perdas por vencimento",              "valor": 4.8,  "meta": 2.0,  "unidade": "%",      "status": "atencao", "observacao": "4,8% vs meta 2% — gestão de estoque sem sistema informatizado em 3 UBS. Compras sem análise de consumo histórico geram excesso de alguns itens e falta de outros simultaneamente"},
        {"indicador": "Componente Especializado (CEAF)",    "valor": 184,  "meta": None, "unidade": "pcts",   "status": "critico", "observacao": "184 pacientes dependem do CEAF em Manicoré/Manaus — deslocamento para retirada mensal. Falta de 1 mês gera ruptura terapêutica. Sem farmácia satélite municipal para o CEAF — lacuna programática crítica"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/itens-criticos")
def itens_criticos():
    return _ITENS_CRITICOS()


@router.get("/adesao")
def adesao():
    return _ADESAO_DCNT()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()