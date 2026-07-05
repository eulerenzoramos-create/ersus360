"""CRIE — Centro de Referência para Imunobiológicos Especiais · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/crie", tags=["crie"])

@router.get("/dashboard")
async def dashboard():
    return {
        "pacientes_cadastrados_crie": 184,
        "doses_administradas_mes": 128,
        "doses_administradas_ano": 864,
        "solicitacoes_pendentes": 12,
        "solicitacoes_aprovadas_mes": 28,
        "solicitacoes_recusadas_mes": 2,
        "estoque_doses_total": 480,
        "imunobiologicos_em_falta": 2,
        "temperatura_ok_pct": 98.4,
        "encaminhamentos_para_manaus": 8,
        "competencia": "Jun/2026",
        "status_geral": "atencao",
    }

@router.get("/imunobiologicos")
async def imunobiologicos():
    return [
        {"imunobiologico": "Vacina Febre Amarela (dose extra)",       "indicacao": "Imunocomprometidos, gestantes em risco", "estoque_doses": 84, "estoque_minimo": 20, "validade": "2027-03", "temperatura_ok": True,  "solicitacoes_mes": 18, "status": "ok"},
        {"imunobiologico": "Vacina Pneumocócica 23-valente (PPV23)",  "indicacao": "Imunocomprometidos ≥2 anos, cirrose",    "estoque_doses": 48, "estoque_minimo": 10, "validade": "2026-12", "temperatura_ok": True,  "solicitacoes_mes": 12, "status": "ok"},
        {"imunobiologico": "Vacina Meningocócica ACWY",               "indicacao": "Contatos de doença invasiva, HAM",       "estoque_doses": 28, "estoque_minimo": 8,  "validade": "2027-01", "temperatura_ok": True,  "solicitacoes_mes": 8,  "status": "ok"},
        {"imunobiologico": "Vacina Hepatite A (HAV) — imunocompr.",   "indicacao": "Hepatopatas crônicos, HIV",              "estoque_doses": 36, "estoque_minimo": 10, "validade": "2027-06", "temperatura_ok": True,  "solicitacoes_mes": 6,  "status": "ok"},
        {"imunobiologico": "Imunoglobulina Anti-Hepatite B (HBIG)",   "indicacao": "Pós-exposição, RN mãe HBsAg+",          "estoque_doses": 12, "estoque_minimo": 5,  "validade": "2026-11", "temperatura_ok": True,  "solicitacoes_mes": 4,  "status": "atencao"},
        {"imunobiologico": "Imunoglobulina Anti-Rábica (RIG)",        "indicacao": "Pós-exposição grave ao vírus rábico",   "estoque_doses": 6,  "estoque_minimo": 4,  "validade": "2026-10", "temperatura_ok": True,  "solicitacoes_mes": 3,  "status": "atencao"},
        {"imunobiologico": "Vacina Varicela (dose extra — adult.)",   "indicacao": "Imunocomprometidos sem evidência imun.", "estoque_doses": 0,  "estoque_minimo": 6,  "validade": "—",       "temperatura_ok": False, "solicitacoes_mes": 5,  "status": "critico"},
        {"imunobiologico": "Vacina Influenza (dose dupla)",           "indicacao": "Imunocomprometidos severos",            "estoque_doses": 0,  "estoque_minimo": 8,  "validade": "—",       "temperatura_ok": False, "solicitacoes_mes": 4,  "status": "critico"},
        {"imunobiologico": "Imunoglobulina Antitetânica (TIG)",       "indicacao": "Profilaxia pós-exposição tétano",       "estoque_doses": 18, "estoque_minimo": 6,  "validade": "2027-04", "temperatura_ok": True,  "solicitacoes_mes": 2,  "status": "ok"},
        {"imunobiologico": "Vacina Tríplice Bacteriana acelular (DTPa adulto)", "indicacao": "Gestantes CRIE, imunocompr.", "estoque_doses": 48, "estoque_minimo": 10, "validade": "2027-02", "temperatura_ok": True,  "solicitacoes_mes": 14, "status": "ok"},
    ]

@router.get("/pacientes")
async def pacientes():
    return {
        "total_cadastrados": 184,
        "por_indicacao": [
            {"indicacao": "HIV/AIDS em TARV",                  "n": 48, "pct": 26.1},
            {"indicacao": "Neoplasias malignas em tratamento", "n": 28, "pct": 15.2},
            {"indicacao": "Transplantados",                    "n": 12, "pct": 6.5},
            {"indicacao": "Síndrome nefrótica / insuf. renal", "n": 24, "pct": 13.0},
            {"indicacao": "Hepatopatas crônicos",              "n": 18, "pct": 9.8},
            {"indicacao": "Diabéticos tipo 1 (alto risco)",    "n": 20, "pct": 10.9},
            {"indicacao": "Doenças autoimunes em imunossup.",  "n": 16, "pct": 8.7},
            {"indicacao": "Asplenia anatômica ou funcional",   "n": 8,  "pct": 4.3},
            {"indicacao": "Outras indicações CRIE",            "n": 10, "pct": 5.4},
        ],
    }

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "doses": 124, "solicitacoes": 28, "aprovadas": 26, "encaminhamentos_manaus": 6},
        {"mes": "Fev/26", "doses": 112, "solicitacoes": 24, "aprovadas": 22, "encaminhamentos_manaus": 8},
        {"mes": "Mar/26", "doses": 136, "solicitacoes": 30, "aprovadas": 28, "encaminhamentos_manaus": 6},
        {"mes": "Abr/26", "doses": 148, "solicitacoes": 32, "aprovadas": 30, "encaminhamentos_manaus": 8},
        {"mes": "Mai/26", "doses": 128, "solicitacoes": 28, "aprovadas": 26, "encaminhamentos_manaus": 8},
        {"mes": "Jun/26", "doses": 128, "solicitacoes": 28, "aprovadas": 28, "encaminhamentos_manaus": 8},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Imunobiológicos em falta no estoque",    "valor": 2,   "meta": 0,   "unidade": "n",  "status": "critico", "observacao": "Varicela (dose extra adulto) e Influenza (dose dupla) — pedido emergência enviado a Manaus"},
        {"indicador": "Controle de temperatura (cadeia fria)", "valor": 98.4, "meta": 100, "unidade": "%",  "status": "atencao", "observacao": "1 geladeira com oscilação registrada em Jun/26 — manutenção corretiva realizada"},
        {"indicador": "Solicitações aprovadas/mês",            "valor": 28,  "meta": None, "unidade": "n",  "status": "ok",      "observacao": "Taxa de aprovação 93.3% — 2 recusas por indicação fora do Manual CRIE"},
        {"indicador": "Pacientes cadastrados CRIE",            "valor": 184, "meta": None, "unidade": "n",  "status": "ok",      "observacao": "HIV/AIDS em TARV é o maior grupo (26.1%) — acompanhamento conjunto COAS"},
        {"indicador": "Encaminhamentos p/ Manaus/mês",         "valor": 8,   "meta": None, "unidade": "n",  "status": "atencao", "observacao": "Imunobiológicos de competência estadual — custo e logística fluvial/aérea"},
        {"indicador": "Prazo médio solicitação → administração","valor": 4.2, "meta": 7,   "unidade": "dias","status": "ok",     "observacao": "Dentro do prazo CRIE/MS — exceção: itens em falta que aguardam Manaus (>14 dias)"},
    ]
