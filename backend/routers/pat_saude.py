"""PAT Saúde — Patrimônio de Saúde · Inventário · Depreciação · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/pat-saude", tags=["pat_saude"])

@router.get("/dashboard")
async def dashboard():
    return {
        "bens_tombados": 1284,
        "valor_patrimonial_total": 8_640_000.00,
        "valor_depreciado_total": 2_840_000.00,
        "valor_liquido_total": 5_800_000.00,
        "equipamentos_medicos": 284,
        "equipamentos_inoperantes": 28,
        "equipamentos_inoperantes_pct": 9.9,
        "bens_para_descarte": 48,
        "manutencoes_preventivas_pendentes": 64,
        "inventario_atualizado_pct": 86.4,
        "meta_inventario_pct": 100,
        "bens_sem_plaqueta": 124,
        "investimento_equipamentos_ano": 380_000.00,
        "status_geral": "atencao",
    }

@router.get("/categorias")
async def categorias():
    return [
        {"categoria": "Equipamentos médico-hospitalares", "quantidade": 284, "valor_total": 4_280_000, "valor_liquido": 2_840_000, "depreciacao_media_pct": 33.6, "inoperantes": 18, "vida_util_media_anos": 10, "status": "atencao"},
        {"categoria": "Mobiliário hospitalar",            "quantidade": 486, "valor_total": 1_240_000, "valor_liquido": 984_000,   "depreciacao_media_pct": 20.6, "inoperantes": 8,  "vida_util_media_anos": 15, "status": "ok"},
        {"categoria": "Equipamentos de informática",      "quantidade": 284, "valor_total": 864_000,   "valor_liquido": 428_000,   "depreciacao_media_pct": 50.5, "inoperantes": 2,  "vida_util_media_anos": 5,  "status": "atencao"},
        {"categoria": "Veículos e embarcações",           "quantidade": 28,  "valor_total": 1_840_000, "valor_liquido": 1_284_000, "depreciacao_media_pct": 30.2, "inoperantes": 0,  "vida_util_media_anos": 10, "status": "ok"},
        {"categoria": "Instrumentais e ferramentas",      "quantidade": 124, "valor_total": 284_000,   "valor_liquido": 198_000,   "depreciacao_media_pct": 30.3, "inoperantes": 0,  "vida_util_media_anos": 8,  "status": "ok"},
        {"categoria": "Outros bens permanentes",          "quantidade": 78,  "valor_total": 132_000,   "valor_liquido": 66_000,    "depreciacao_media_pct": 50.0, "inoperantes": 0,  "vida_util_media_anos": 10, "status": "ok"},
    ]

@router.get("/criticos")
async def criticos():
    return [
        {"bem": "Autoclave de grande porte",           "categoria": "Equip. Médico",  "unidade": "CME",         "ano_aquisicao": 2016, "vida_util_anos": 10, "estado": "inoperante",     "valor_aquisicao": 48000, "reparo_orcado": 18000, "urgencia": "alta",   "observacao": "Sem funcionamento desde Jan/26 — esterilização prejudicada"},
        {"bem": "Raio-X digital (sala cirúrgica)",     "categoria": "Equip. Médico",  "unidade": "Centro Cirúrg","ano_aquisicao": 2018, "vida_util_anos": 10, "estado": "manutencao",     "valor_aquisicao": 186000,"reparo_orcado": 24000, "urgencia": "alta",   "observacao": "Em manutenção corretiva — 22 dias parado"},
        {"bem": "Ultrassom obstétrico",                "categoria": "Equip. Médico",  "unidade": "Maternidade", "ano_aquisicao": 2019, "vida_util_anos": 10, "estado": "funcionando",    "valor_aquisicao": 84000, "reparo_orcado": 0,     "urgencia": "baixa",  "observacao": "Preventiva pendente há 8 meses"},
        {"bem": "Ambulância UTI Móvel",                "categoria": "Veículo",        "unidade": "SAMU",        "ano_aquisicao": 2022, "vida_util_anos": 10, "estado": "funcionando",    "valor_aquisicao": 320000,"reparo_orcado": 0,     "urgencia": "baixa",  "observacao": "Em dia — revisão programada para Mai/26"},
        {"bem": "Lancha fluvial SAMU",                 "categoria": "Embarcação",     "unidade": "SAMU",        "ano_aquisicao": 2019, "vida_util_anos": 10, "estado": "inoperante",     "valor_aquisicao": 164000,"reparo_orcado": 48000, "urgencia": "alta",   "observacao": "Motor avariado — comunidades ribeirinhas sem cobertura"},
        {"bem": "Câmara fria vacinas (UBS Central)",   "categoria": "Equip. Médico",  "unidade": "UBS Central", "ano_aquisicao": 2020, "vida_util_anos": 10, "estado": "funcionando",    "valor_aquisicao": 28000, "reparo_orcado": 0,     "urgencia": "media",  "observacao": "Termômetro externo com falha — monitoramento manual"},
        {"bem": "Gerador de energia (Hospital)",       "categoria": "Equip. Infraest.","unidade": "Hospital",   "ano_aquisicao": 2017, "vida_util_anos": 12, "estado": "funcionando",    "valor_aquisicao": 86000, "reparo_orcado": 0,     "urgencia": "media",  "observacao": "Óleo diesel: revisão preventiva pendente"},
        {"bem": "Mesa cirúrgica (sala principal)",     "categoria": "Equip. Médico",  "unidade": "Centro Cirúrg","ano_aquisicao": 2015, "vida_util_anos": 10, "estado": "obsoleto",       "valor_aquisicao": 64000, "reparo_orcado": 32000, "urgencia": "alta",   "observacao": "Vida útil encerrada — substituição prevista no PAI 2026"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"ano": 2021, "bens_tombados": 1086, "investimento": 280000, "descarte": 48000,  "inventario_pct": 72.4, "inoperantes": 38},
        {"ano": 2022, "bens_tombados": 1124, "investimento": 320000, "descarte": 64000,  "inventario_pct": 78.6, "inoperantes": 34},
        {"ano": 2023, "bens_tombados": 1168, "investimento": 284000, "descarte": 40000,  "inventario_pct": 80.4, "inoperantes": 32},
        {"ano": 2024, "bens_tombados": 1224, "investimento": 348000, "descarte": 72000,  "inventario_pct": 82.8, "inoperantes": 30},
        {"ano": 2025, "bens_tombados": 1264, "investimento": 364000, "descarte": 56000,  "inventario_pct": 84.6, "inoperantes": 28},
        {"ano": 2026, "bens_tombados": 1284, "investimento": 380000, "descarte": 0,      "inventario_pct": 86.4, "inoperantes": 28},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Equipamentos médicos inoperantes",      "valor": 9.9,  "meta": 5,   "unidade": "%","status": "atencao",  "observacao": "28/284 — autoclave CME e lancha SAMU com maior impacto operacional"},
        {"indicador": "Inventário patrimonial atualizado",     "valor": 86.4, "meta": 100, "unidade": "%","status": "atencao",  "observacao": "124 bens sem plaquetagem — exigência TCE/AM"},
        {"indicador": "Bens para descarte/alienação",          "valor": 48,   "meta": 0,   "unidade": "un","status": "atencao", "observacao": "Processo de desfazimento previsto para 2º semestre 2026"},
        {"indicador": "Preventivas de equip. médicos pendentes","valor": 64,   "meta": 0,  "unidade": "un","status": "atencao",  "observacao": "Ultrassom obstétrico e gerador entre os mais críticos"},
        {"indicador": "Bens com vida útil encerrada em uso",   "valor": 8,    "meta": 0,   "unidade": "un","status": "critico",  "observacao": "Mesa cirúrgica e 7 outros — risco de falha durante procedimento"},
        {"indicador": "Investimento em equipamentos (2026)",   "valor": 380000,"meta": None,"unidade": "R$","status": "ok",      "observacao": "PAI 2026 — inclui nova ambulância e equip. odontológico"},
    ]
