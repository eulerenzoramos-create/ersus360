"""SPD — Saúde da Pessoa com Deficiência · BPC · CIF · Reabilitação · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/spd", tags=["spd"])

@router.get("/dashboard")
async def dashboard():
    return {
        "pessoas_cadastradas": 684,
        "bpc_beneficiarios": 248,
        "em_reabilitacao_ativa": 186,
        "aguardando_avaliacao": 68,
        "carteira_de_saude_pcd": 312,
        "encaminhamentos_especialidade_mes": 48,
        "adaptacoes_domiciliares_mes": 8,
        "fisioterapia_sessoes_mes": 486,
        "fonoaudiologia_sessoes_mes": 124,
        "terapia_ocupacional_sessoes_mes": 98,
        "deficiencias_fisicas_pct": 42.4,
        "deficiencias_intelectuais_pct": 28.6,
        "status_geral": "atencao",
    }

@router.get("/tipos")
async def tipos():
    return [
        {"tipo": "Deficiência física / motora",       "total": 290, "pct": 42.4, "em_reabilitacao": 84, "bpc": 68,  "servicos_principais": "Fisioterapia · Órteses/próteses"},
        {"tipo": "Deficiência intelectual",            "total": 196, "pct": 28.6, "em_reabilitacao": 48, "bpc": 86,  "servicos_principais": "TO · Fonoaudiologia · APAE"},
        {"tipo": "Deficiência auditiva",               "total": 98,  "pct": 14.3, "em_reabilitacao": 28, "bpc": 42,  "servicos_principais": "Fonoaudiologia · AASI"},
        {"tipo": "Deficiência visual",                 "total": 64,  "pct": 9.4,  "em_reabilitacao": 18, "bpc": 38,  "servicos_principais": "Saúde ocular · Bengala · Reabilitação"},
        {"tipo": "Deficiência múltipla",               "total": 24,  "pct": 3.5,  "em_reabilitacao": 8,  "bpc": 14,  "servicos_principais": "Cuidados integrados · Home care"},
        {"tipo": "Transtorno do Espectro Autista (TEA)","total": 12,  "pct": 1.8,  "em_reabilitacao": 4,  "bpc": 0,   "servicos_principais": "ABA · TO · Fonoaudiologia"},
    ]

@router.get("/reabilitacao")
async def reabilitacao():
    return [
        {"servico": "Fisioterapia",            "sessoes_mes": 486, "pacientes_ativos": 84, "lista_espera": 28, "tempo_espera_dias": 45, "profissionais": 2, "status": "atencao"},
        {"servico": "Terapia Ocupacional",     "sessoes_mes": 98,  "pacientes_ativos": 32, "lista_espera": 18, "tempo_espera_dias": 60, "profissionais": 1, "status": "atencao"},
        {"servico": "Fonoaudiologia",          "sessoes_mes": 124, "pacientes_ativos": 38, "lista_espera": 24, "tempo_espera_dias": 75, "profissionais": 1, "status": "critico"},
        {"servico": "Psicologia (PCD)",        "sessoes_mes": 48,  "pacientes_ativos": 18, "lista_espera": 12, "tempo_espera_dias": 40, "profissionais": 1, "status": "ok"},
        {"servico": "Oficina Ortopédica",      "sessoes_mes": 18,  "pacientes_ativos": 48, "lista_espera": 8,  "tempo_espera_dias": 90, "profissionais": 0, "status": "critico"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "cadastrados": 648, "em_reab": 164, "sessoes": 684,  "encaminhamentos": 38, "bpc": 236},
        {"mes": "Nov/25", "cadastrados": 658, "em_reab": 170, "sessoes": 704,  "encaminhamentos": 42, "bpc": 240},
        {"mes": "Dez/25", "cadastrados": 664, "em_reab": 174, "sessoes": 648,  "encaminhamentos": 34, "bpc": 242},
        {"mes": "Jan/26", "cadastrados": 670, "em_reab": 178, "sessoes": 724,  "encaminhamentos": 44, "bpc": 244},
        {"mes": "Fev/26", "cadastrados": 678, "em_reab": 182, "sessoes": 748,  "encaminhamentos": 46, "bpc": 246},
        {"mes": "Mar/26", "cadastrados": 684, "em_reab": 186, "sessoes": 756,  "encaminhamentos": 48, "bpc": 248},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Pessoas com deficiência cadastradas",      "valor": 684,  "meta": None, "unidade": "un","status": "ok",      "observacao": "Estimativa IBGE Apuí: ~750 PCD (2.7% pop.)"},
        {"indicador": "Cobertura de reabilitação ativa",          "valor": 27.2, "meta": 40,  "unidade": "%", "status": "atencao", "observacao": "186/684 — lista de espera representa 27% dos ativos"},
        {"indicador": "Tempo espera fonoaudiologia",              "valor": 75,   "meta": 30,  "unidade": "dias","status":"critico",  "observacao": "1 fonoaudiólogo para 38 pac. ativos + 24 em espera"},
        {"indicador": "Oficina Ortopédica sem profissional",      "valor": 1,    "meta": 0,   "unidade": "un","status": "critico",  "observacao": "Órteses e próteses: 48 pacientes sem atendimento"},
        {"indicador": "BPC — beneficiários acompanhados",         "valor": 100,  "meta": 100, "unidade": "%", "status": "ok",      "observacao": "248 beneficiários com acompanhamento na APS"},
        {"indicador": "Adaptações domiciliares realizadas",       "valor": 8,    "meta": None, "unidade": "un","status": "ok",      "observacao": "Rampa, corrimão, sanitário adaptado"},
    ]
