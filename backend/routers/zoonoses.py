"""Controle de Zoonoses — Raiva · Ofidismo · Escorpionismo · Leptospirose · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/zoonoses", tags=["zoonoses"])

@router.get("/dashboard")
async def dashboard():
    return {
        "caes_vacinados_raiva_mes": 1284,
        "cobertura_raiva_pct": 84.6,
        "meta_raiva_pct": 95,
        "acidentes_ofidicos_mes": 8,
        "acidentes_escorpionismo_mes": 24,
        "acidentes_araneismo_mes": 6,
        "leptospirose_casos_mes": 3,
        "animais_apreendidos_mes": 48,
        "pontos_controle_raiva": 12,
        "alertas_ativos": 2,
        "status_geral": "atencao",
    }

@router.get("/acidentes")
async def acidentes():
    return [
        {
            "tipo": "Ofidismo",
            "casos_mes": 8, "casos_graves": 2, "obitos": 0,
            "especie_principal": "Bothrops (jararaca)",
            "soro_disponivel": True, "doses_soro": 28,
            "tempo_atend_medio_h": 4.2, "meta_tempo_h": 6,
            "locais_ocorrencia": ["Zona rural/mata (75%)", "Comunidades ribeirinhas (25%)"],
            "status": "atencao"
        },
        {
            "tipo": "Escorpionismo",
            "casos_mes": 24, "casos_graves": 3, "obitos": 0,
            "especie_principal": "Tityus obscurus",
            "soro_disponivel": True, "doses_soro": 12,
            "tempo_atend_medio_h": 1.8, "meta_tempo_h": 2,
            "locais_ocorrencia": ["Residências urbanas (68%)", "Zona rural (32%)"],
            "status": "ok"
        },
        {
            "tipo": "Araneismo",
            "casos_mes": 6, "casos_graves": 0, "obitos": 0,
            "especie_principal": "Phoneutria (armadeira)",
            "soro_disponivel": True, "doses_soro": 8,
            "tempo_atend_medio_h": 2.4, "meta_tempo_h": 4,
            "locais_ocorrencia": ["Zona rural (83%)", "Residências (17%)"],
            "status": "ok"
        },
        {
            "tipo": "Leptospirose",
            "casos_mes": 3, "casos_graves": 1, "obitos": 0,
            "especie_principal": "Leptospira interrogans",
            "soro_disponivel": None, "doses_soro": None,
            "tempo_atend_medio_h": None, "meta_tempo_h": None,
            "locais_ocorrencia": ["Área inundada pós-chuva (100%)"],
            "status": "atencao"
        },
    ]

@router.get("/raiva")
async def raiva():
    return {
        "total_caes_estimado": 1520,
        "vacinados_campanha": 1284,
        "cobertura_pct": 84.6,
        "meta_pct": 95,
        "gatos_vacinados": 286,
        "total_gatos_estimado": 480,
        "cobertura_felina_pct": 59.6,
        "animais_apreendidos_mes": 48,
        "animais_eutanasiados": 4,
        "animais_adotados": 12,
        "observacao_focos": "Foco potencial na comunidade São Francisco — cães sem vacina > 40%",
        "pontos_vacinacao": [
            {"local": "UBS Centro",      "vacinados": 384, "status": "ok"},
            {"local": "UBS Bela Vista",  "vacinados": 298, "status": "ok"},
            {"local": "ESF Matupi",      "vacinados": 186, "status": "atencao"},
            {"local": "ESF Itaparana",   "vacinados": 124, "status": "ok"},
            {"local": "São Francisco",   "vacinados": 68,  "status": "critico"},
            {"local": "Brigada volante", "vacinados": 224, "status": "ok"},
        ]
    }

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "ofidismo": 6,  "escorpionismo": 18, "araneismo": 4, "leptospirose": 1, "apreensoes": 38},
        {"mes": "Nov/25", "ofidismo": 7,  "escorpionismo": 22, "araneismo": 5, "leptospirose": 2, "apreensoes": 42},
        {"mes": "Dez/25", "ofidismo": 4,  "escorpionismo": 28, "araneismo": 3, "leptospirose": 4, "apreensoes": 52},
        {"mes": "Jan/26", "ofidismo": 9,  "escorpionismo": 20, "araneismo": 7, "leptospirose": 2, "apreensoes": 44},
        {"mes": "Fev/26", "ofidismo": 7,  "escorpionismo": 21, "araneismo": 5, "leptospirose": 3, "apreensoes": 46},
        {"mes": "Mar/26", "ofidismo": 8,  "escorpionismo": 24, "araneismo": 6, "leptospirose": 3, "apreensoes": 48},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Cobertura vacina antirrábica canina",  "valor": 84.6, "meta": 95,  "unidade": "%", "status": "critico", "observacao": "Foco potencial em S.Francisco — < 50% cobertura local"},
        {"indicador": "Cobertura vacina antirrábica felina",  "valor": 59.6, "meta": 80,  "unidade": "%", "status": "critico", "observacao": "Gatos: vetor subestimado — meta estadual 80%"},
        {"indicador": "Acidentes ofídicos com soro disponível","valor": 100, "meta": 100, "unidade": "%", "status": "ok",      "observacao": "28 doses SAB disponíveis — estoque adequado"},
        {"indicador": "Tempo de atendimento ofídico",         "valor": 4.2,  "meta": 6,   "unidade": "h", "status": "ok",      "observacao": "Abaixo do limite MS: ≤6h pós-acidente"},
        {"indicador": "Leptospirose — casos no mês",          "valor": 3,    "meta": 0,   "unidade": "un","status": "atencao", "observacao": "Sazonalidade: pico período chuvoso (nov–mar)"},
        {"indicador": "Acidentes escorpionismo graves",        "valor": 3,    "meta": 0,   "unidade": "un","status": "atencao", "observacao": "Tityus obscurus — espécie altamente venenosa da Amazônia"},
    ]
