"""Saúde do Servidor — PCMSO · CAT · Afastamentos · Exames Periódicos · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-servidor", tags=["saude_servidor"])

@router.get("/dashboard")
async def dashboard():
    return {
        "total_servidores": 486,
        "afastamentos_ativos": 28,
        "afastamentos_mes": 34,
        "dias_perdidos_mes": 284,
        "taxa_absenteismo_pct": 4.8,
        "meta_absenteismo_pct": 4,
        "cat_abertas_mes": 4,
        "exames_periodicos_pendentes": 68,
        "exames_periodicos_pct_dia": 86.0,
        "acidentes_trabalho_mes": 4,
        "doencas_trabalho_confirmadas_ano": 3,
        "status_geral": "atencao",
    }

@router.get("/afastamentos")
async def afastamentos():
    return [
        {"cid": "F32", "descricao": "Episódio depressivo",          "casos": 6, "dias_mes": 64,  "categoria": "Saúde mental",      "setor": "Enfermagem"},
        {"cid": "M54", "descricao": "Dorsalgia (lombalgia)",         "casos": 5, "dias_mes": 42,  "categoria": "Musculoesquelético","setor": "Misto"},
        {"cid": "J06", "descricao": "IRAS / Gripe",                  "casos": 4, "dias_mes": 16,  "categoria": "Infecciosa",        "setor": "Misto"},
        {"cid": "Z76", "descricao": "Acompanhante de familiar",      "casos": 4, "dias_mes": 28,  "categoria": "Familiar",          "setor": "Misto"},
        {"cid": "F41", "descricao": "Transtorno de ansiedade",       "casos": 3, "dias_mes": 36,  "categoria": "Saúde mental",      "setor": "Recepção/Admin"},
        {"cid": "S61", "descricao": "Acidente de trabalho — mão",    "casos": 2, "dias_mes": 18,  "categoria": "Acidente trabalho", "setor": "Centro Cirúrgico"},
        {"cid": "K29", "descricao": "Gastrite / GI",                 "casos": 2, "dias_mes": 12,  "categoria": "Digestivo",         "setor": "Misto"},
        {"cid": "N39", "descricao": "ITU recorrente",                "casos": 2, "dias_mes": 10,  "categoria": "Urológico",         "setor": "Enfermagem"},
        {"cid": "Z56", "descricao": "Problemas emprego/condições",   "casos": 2, "dias_mes": 18,  "categoria": "Saúde mental",      "setor": "Farmácia"},
        {"cid": "I10", "descricao": "Hipertensão não controlada",    "casos": 2, "dias_mes": 14,  "categoria": "Cardiovascular",    "setor": "Misto"},
        {"cid": "Outros","descricao": "Outros CIDs",                 "casos": 2, "dias_mes": 26,  "categoria": "Outros",            "setor": "Misto"},
    ]

@router.get("/cat")
async def cat():
    return [
        {"cat": "CAT-2603-001", "data": "08/03/26", "servidor": "Técnico de Enfermagem",       "setor": "Centro Cirúrgico",   "tipo": "Acidente típico", "agente": "Perfurocortante",       "gravidade": "leve",    "status": "investigando"},
        {"cat": "CAT-2603-002", "data": "12/03/26", "servidor": "Auxiliar de serviços gerais", "setor": "Almoxarifado",       "tipo": "Acidente típico", "agente": "Queda em mesmo nível",  "gravidade": "leve",    "status": "concluido"},
        {"cat": "CAT-2602-008", "data": "18/02/26", "servidor": "Enfermeiro",                  "setor": "UPA 24h",            "tipo": "Acidente típico", "agente": "Exposição biológica",   "gravidade": "moderado","status": "concluido"},
        {"cat": "CAT-2603-003", "data": "22/03/26", "servidor": "ACS",                         "setor": "ESF Bela Vista",     "tipo": "Trajeto",         "agente": "Colisão motocicleta",   "gravidade": "moderado","status": "investigando"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "afastamentos": 28, "dias_perdidos": 236, "absenteismo_pct": 3.9, "cat": 2, "periodicos_pct": 82.4},
        {"mes": "Nov/25", "afastamentos": 30, "dias_perdidos": 248, "absenteismo_pct": 4.1, "cat": 3, "periodicos_pct": 83.6},
        {"mes": "Dez/25", "afastamentos": 38, "dias_perdidos": 324, "absenteismo_pct": 5.4, "cat": 1, "periodicos_pct": 84.2},
        {"mes": "Jan/26", "afastamentos": 32, "dias_perdidos": 268, "absenteismo_pct": 4.5, "cat": 2, "periodicos_pct": 84.8},
        {"mes": "Fev/26", "afastamentos": 36, "dias_perdidos": 296, "absenteismo_pct": 4.9, "cat": 3, "periodicos_pct": 85.4},
        {"mes": "Mar/26", "afastamentos": 34, "dias_perdidos": 284, "absenteismo_pct": 4.8, "cat": 4, "periodicos_pct": 86.0},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Taxa de absenteísmo",                 "valor": 4.8,  "meta": 4.0, "unidade": "%", "status": "atencao", "observacao": "Saúde mental = 34% dos dias perdidos"},
        {"indicador": "Exames periódicos em dia",            "valor": 86.0, "meta": 100, "unidade": "%", "status": "atencao", "observacao": "68 servidores com exame vencido"},
        {"indicador": "CAT abertas no mês",                  "valor": 4,    "meta": 0,   "unidade": "un","status": "atencao", "observacao": "2 perfurocortante + 1 exposição biológica + 1 acidente trajeto"},
        {"indicador": "Acidentes com perfurocortante",       "valor": 2,    "meta": 0,   "unidade": "un","status": "critico", "observacao": "Centro Cirúrgico — avaliar uso de EPIs"},
        {"indicador": "Afastamentos por saúde mental",       "valor": 34.0, "meta": 20,  "unidade": "%", "status": "critico", "observacao": "F32+F41+Z56 = 34% dos afastamentos — solicitar apoio NASF"},
        {"indicador": "Servidores com LTCAT/PPP atualizado", "valor": 78.4, "meta": 100, "unidade": "%", "status": "atencao", "observacao": "Setores de risco biológico e químico prioritários"},
    ]
