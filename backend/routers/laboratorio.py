"""Laboratório Municipal — Exames · Resultados · Produção · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/laboratorio", tags=["laboratorio"])

@router.get("/dashboard")
async def dashboard():
    return {
        "exames_mes": 3_840,
        "exames_pendentes": 284,
        "exames_pendentes_criticos": 28,
        "prazo_medio_resultado_dias": 3.4,
        "meta_prazo_dias": 3.0,
        "amostras_rejeitadas_mes": 48,
        "amostras_rejeitadas_pct": 1.25,
        "exames_urgentes_mes": 284,
        "taxa_exames_criticos_notificados_pct": 94.6,
        "calibracoes_em_dia_pct": 87.5,
        "reagentes_em_falta": 3,
        "custo_exame_medio": 12.40,
        "competencia": "Jun/2026",
        "status_geral": "atencao",
    }

@router.get("/producao")
async def producao():
    return {
        "por_grupo": [
            {"grupo": "Hematologia",          "exames": 840,   "pct_total": 21.9, "prazo_medio": 1.2, "status": "ok"},
            {"grupo": "Bioquímica",            "exames": 1_120, "pct_total": 29.2, "prazo_medio": 2.8, "status": "ok"},
            {"grupo": "Urinálise",             "exames": 480,   "pct_total": 12.5, "prazo_medio": 1.0, "status": "ok"},
            {"grupo": "Microbiologia",         "exames": 284,   "pct_total": 7.4,  "prazo_medio": 5.4, "status": "atencao"},
            {"grupo": "Imunologia/Sorologia",  "exames": 320,   "pct_total": 8.3,  "prazo_medio": 3.2, "status": "ok"},
            {"grupo": "Parasitologia",         "exames": 184,   "pct_total": 4.8,  "prazo_medio": 2.4, "status": "ok"},
            {"grupo": "Citopatologia",         "exames": 248,   "pct_total": 6.5,  "prazo_medio": 8.4, "status": "atencao"},
            {"grupo": "Hormônios",             "exames": 164,   "pct_total": 4.3,  "prazo_medio": 4.8, "status": "atencao"},
            {"grupo": "Outros",                "exames": 200,   "pct_total": 5.2,  "prazo_medio": 3.0, "status": "ok"},
        ],
        "top_exames": [
            {"exame": "Hemograma completo",          "codigo": "02.02.01.038-0", "quantidade": 680, "prazo": 1.0},
            {"exame": "Glicemia de jejum",            "codigo": "02.02.01.011-7", "quantidade": 520, "prazo": 2.4},
            {"exame": "Urina tipo I (EAS)",           "codigo": "02.02.01.037-2", "quantidade": 480, "prazo": 1.0},
            {"exame": "Creatinina",                   "codigo": "02.02.01.013-3", "quantidade": 364, "prazo": 2.4},
            {"exame": "Colesterol total + frações",   "codigo": "02.02.01.010-9", "quantidade": 340, "prazo": 2.8},
            {"exame": "TGO/TGP (transaminases)",      "codigo": "02.02.01.040-2", "quantidade": 284, "prazo": 2.8},
            {"exame": "HbA1c (hemoglobina glicada)",  "codigo": "02.02.01.031-3", "quantidade": 248, "prazo": 3.4},
            {"exame": "TSH / T4 livre",               "codigo": "02.02.01.047-0", "quantidade": 164, "prazo": 4.8},
            {"exame": "Cultura + antibiograma",       "codigo": "02.03.01.005-0", "quantidade": 128, "prazo": 5.6},
            {"exame": "Exame citopatológico cervical","codigo": "02.01.07.002-2", "quantidade": 124, "prazo": 8.4},
        ],
    }

@router.get("/pendentes-criticos")
async def pendentes_criticos():
    return [
        {"exame": "Cultura + antibiograma (LCR)",  "paciente_id": "CNS-001", "unidade_solicitante": "Urgência",     "dias_espera": 6, "status": "critico", "observacao": "Suspeita meningite bacteriana — aguardando LACEN/AM"},
        {"exame": "Exame citopatológico cervical",  "paciente_id": "CNS-012", "unidade_solicitante": "UBS Central",  "dias_espera": 14,"status": "critico", "observacao": "Atraso no lote enviado ao LACEN — reenvio previsto"},
        {"exame": "PCR SARS-CoV-2 (Flu)",           "paciente_id": "CNS-034", "unidade_solicitante": "Urgência",     "dias_espera": 4, "status": "atencao", "observacao": "Kit em falta — aguardando reposição LACEN"},
        {"exame": "Sorologia HIV confirmatório",    "paciente_id": "CNS-048", "unidade_solicitante": "COAS",         "dias_espera": 7, "status": "critico", "observacao": "Aguardando Western Blot LACEN/AM"},
        {"exame": "HbA1c — gestante alto risco",    "paciente_id": "CNS-067", "unidade_solicitante": "Maternidade",  "dias_espera": 5, "status": "atencao", "observacao": "Cartucho esgotado — solicitação emergência enviada"},
        {"exame": "TSH neonatal (triagem)",          "paciente_id": "CNS-089", "unidade_solicitante": "Maternidade",  "dias_espera": 3, "status": "atencao", "observacao": "Lote pendente — PKU e outros aguardando transporte para Manaus"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "exames": 3_480, "pendentes": 320, "rejeitadas": 52, "prazo_medio": 3.8, "criticos": 24},
        {"mes": "Fev/26", "exames": 3_240, "pendentes": 300, "rejeitadas": 48, "prazo_medio": 3.6, "criticos": 22},
        {"mes": "Mar/26", "exames": 3_680, "pendentes": 310, "rejeitadas": 50, "prazo_medio": 3.5, "criticos": 26},
        {"mes": "Abr/26", "exames": 3_720, "pendentes": 290, "rejeitadas": 46, "prazo_medio": 3.4, "criticos": 28},
        {"mes": "Mai/26", "exames": 3_800, "pendentes": 280, "rejeitadas": 44, "prazo_medio": 3.4, "criticos": 26},
        {"mes": "Jun/26", "exames": 3_840, "pendentes": 284, "rejeitadas": 48, "prazo_medio": 3.4, "criticos": 28},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Prazo médio de resultado",            "valor": 3.4, "meta": 3.0,  "unidade": "dias","status": "atencao", "observacao": "Microbiologia e citopatologia puxam a média — LACEN responsável pelo atraso"},
        {"indicador": "Amostras rejeitadas/mês",             "valor": 1.25,"meta": 1.0,  "unidade": "%",  "status": "atencao", "observacao": "Principal causa: coleta em tubo errado (38%) e volume insuficiente (28%)"},
        {"indicador": "Exames críticos notificados em <1h",  "valor": 94.6,"meta": 100.0,"unidade": "%",  "status": "atencao", "observacao": "5 casos não notificados em Jun/26 — maioria após 18h (plantão reduzido)"},
        {"indicador": "Equipamentos calibrados/certificados", "valor": 87.5,"meta": 100.0,"unidade": "%",  "status": "atencao", "observacao": "2 equipamentos com calibração vencida — processo INMETRO em andamento"},
        {"indicador": "Reagentes sem estoque crítico",        "valor": 3,   "meta": 0,    "unidade": "n",  "status": "critico", "observacao": "PCR Flu, HbA1c (cartucho) e cultura anaeróbia em falta — pedidos enviados"},
        {"indicador": "Exames/habitante/ano",                 "valor": 2.1, "meta": 2.5,  "unidade": "n",  "status": "atencao", "observacao": "Referência nacional para municípios de pequeno porte: 2.5 exames/hab/ano"},
    ]
