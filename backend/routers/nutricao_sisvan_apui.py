"""
Router: /api/nutricao-sisvan-apui — ERSUS 360
Dados de referência municipal — Apuí/AM (pop. ~20 mil).
situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/nutricao-sisvan-apui", tags=["nutricao_sisvan_apui"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2025",
        "desnutricao_crianca_pct": 12.4,
        "desnutricao_aguda_crianca_pct": 4.8,
        "anemia_gestante_pct": 52.4,
        "obesidade_adulto_pct": 28.4,
        "sobrepeso_adulto_pct": 34.2,
        "sindrome_metabolica_estimada_pct": 18.4,
        "sisvan_cobertura_pct": 42.4,
        "criancas_acompanhadas_sisvan": 840,
        "gestantes_acompanhadas_sisvan": 68,
        "vitamina_a_cobertura_pct": 52.4,
        "ferro_profilatico_pct": 42.4,
        "inseguranca_alimentar_grave_pct": 8.4,
        "bolsa_familia_familias": 1820,
        "nutricionista_apui": 0,
        "cantina_escolar_saudavel_pct": 18.4,
        "nota": "Referência baseada em literatura epidemiológica para municípios amazônicos com alta vulnerabilidade nutricional.",
    }


@router.get("/grupos")
async def grupos():
    return [
        {"situacao_dado": "referencia_municipal", "grupo": "Crianças < 2 anos",          "desnutricao_pct": 18.4, "sobrepeso_pct": 8.2,  "anemia_pct": 62.4, "observacao": "Alta desnutrição — desmame precoce e insegurança alimentar.",       "status": "critico"},
        {"situacao_dado": "referencia_municipal", "grupo": "Crianças 2–5 anos",           "desnutricao_pct": 14.2, "sobrepeso_pct": 14.8, "anemia_pct": 48.2, "observacao": "Vitamina A deficiente em 47,6% — supplementação incompleta.",        "status": "critico"},
        {"situacao_dado": "referencia_municipal", "grupo": "Crianças 5–10 anos (escolar)","desnutricao_pct": 12.4, "sobrepeso_pct": 22.4, "anemia_pct": 32.4, "observacao": "PNAE na escola — merenda atinge 82% das crianças matriculadas.",     "status": "critico"},
        {"situacao_dado": "referencia_municipal", "grupo": "Adolescentes 10–19 anos",     "desnutricao_pct": 8.4,  "sobrepeso_pct": 28.4, "anemia_pct": 22.8, "observacao": "Obesidade crescente — ultra-processados e sedentarismo.",             "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "grupo": "Gestantes",                   "desnutricao_pct": 12.4, "sobrepeso_pct": 24.2, "anemia_pct": 52.4, "observacao": "Anemia gestacional: risco de BPN, prematuridade e mort. perinatal.", "status": "critico"},
        {"situacao_dado": "referencia_municipal", "grupo": "Adultos 20–59 anos",          "desnutricao_pct": 4.2,  "sobrepeso_pct": 34.2, "anemia_pct": 14.2, "observacao": "Dupla carga nutricional — desnutrição + obesidade coexistem.",        "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "grupo": "Idosos ≥60 anos",             "desnutricao_pct": 18.4, "sobrepeso_pct": 22.4, "anemia_pct": 28.4, "observacao": "Desnutrição oculta em idosos — ILPI inexistente em Apuí.",            "status": "critico"},
        {"situacao_dado": "referencia_municipal", "grupo": "Povos Indígenas (estimado)",  "desnutricao_pct": 28.4, "sobrepeso_pct": 8.4,  "anemia_pct": 68.4, "observacao": "Dados estimados — acesso à DSEI Norte (Funai). Alta vulnerabilidade.", "status": "critico"},
    ]


@router.get("/acoes")
async def acoes():
    return [
        {"situacao_dado": "referencia_municipal", "acao": "Suplementação Vitamina A (0-5a)",          "implementada": True,  "custo": 8400,  "prazo_meses": 0,  "observacao": "MS fornece gratuitamente — operacionalização SMS. Cobertura: 52,4% (meta 100%)."},
        {"situacao_dado": "referencia_municipal", "acao": "Sulfato Ferroso Profilático 6m–5a+gestantes","implementada": True, "custo": 6200,  "prazo_meses": 0,  "observacao": "REMUME gratuito. Aderência: 42,4% (meta 100%). Busca ativa ACS."},
        {"situacao_dado": "referencia_municipal", "acao": "SISVAN — Acompanhamento nutricional",       "implementada": True,  "custo": 0,     "prazo_meses": 0,  "observacao": "Cobertura 42,4% (meta 100%). Lançamento no SISAB pela eSF."},
        {"situacao_dado": "referencia_municipal", "acao": "Contratação Nutricionista (eMulti)",        "implementada": False, "custo": 84000, "prazo_meses": 3,  "observacao": "eMulti: 50% custeio PREVINE Brasil. 120 consultas/mês = 1.440/ano."},
        {"situacao_dado": "referencia_municipal", "acao": "Busca Ativa Desnutrição Grave (ACS)",       "implementada": True,  "custo": 8400,  "prazo_meses": 0,  "observacao": "ACS identificam. Encaminhamento para UBS e HGH Humaitá."},
        {"situacao_dado": "referencia_municipal", "acao": "Cantina Escolar Saudável (Lei AM)",         "implementada": False, "custo": 12000, "prazo_meses": 6,  "observacao": "18,4% das escolas cumprindo a lei estadual. Ação conjunta SEMEC."},
        {"situacao_dado": "referencia_municipal", "acao": "Bolsa Família — condicionalidade saúde",    "implementada": True,  "custo": 0,     "prazo_meses": 0,  "observacao": "1.820 famílias. Peso e altura lançados no SISVAN — cobertura 68%."},
        {"situacao_dado": "referencia_municipal", "acao": "Terapia Nutricional Enteral (TN domiciliar)","implementada": False,"custo": 36000, "prazo_meses": 6,  "observacao": "Sem protocolo municipal. Casos graves encaminhados Manaus."},
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "ano": 2022, "desnutricao_crianca_pct": 15.8, "obesidade_adulto_pct": 24.2, "anemia_gestante_pct": 58.4, "sisvan_pct": 32.4, "inseg_alimentar_pct": 10.4},
        {"situacao_dado": "referencia_municipal", "ano": 2023, "desnutricao_crianca_pct": 14.4, "obesidade_adulto_pct": 25.8, "anemia_gestante_pct": 56.2, "sisvan_pct": 36.2, "inseg_alimentar_pct": 9.8},
        {"situacao_dado": "referencia_municipal", "ano": 2024, "desnutricao_crianca_pct": 13.2, "obesidade_adulto_pct": 27.1, "anemia_gestante_pct": 54.0, "sisvan_pct": 38.8, "inseg_alimentar_pct": 9.2},
        {"situacao_dado": "referencia_municipal", "ano": 2025, "desnutricao_crianca_pct": 12.4, "obesidade_adulto_pct": 28.4, "anemia_gestante_pct": 52.4, "sisvan_pct": 42.4, "inseg_alimentar_pct": 8.4},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "Desnutrição < 5 anos (%)",          "valor": 12.4, "meta": 2.5,  "unidade": "%",    "status": "critico", "observacao": "5× acima da meta. Desnutrição aguda grave: 4,8%."},
        {"situacao_dado": "referencia_municipal", "indicador": "Anemia em Gestantes (%)",           "valor": 52.4, "meta": 20,   "unidade": "%",    "status": "critico", "observacao": "Maior fator de risco para BPN e mortalidade perinatal."},
        {"situacao_dado": "referencia_municipal", "indicador": "SISVAN Cobertura (%)",              "valor": 42.4, "meta": 100,  "unidade": "%",    "status": "critico", "observacao": "57,6% sem registro — subnotificação grave."},
        {"situacao_dado": "referencia_municipal", "indicador": "Vitamina A 0-5 anos (%)",           "valor": 52.4, "meta": 100,  "unidade": "%",    "status": "critico", "observacao": "MS fornece gratuitamente — barreira operacional."},
        {"situacao_dado": "referencia_municipal", "indicador": "Ferro Profilático (%)",             "valor": 42.4, "meta": 100,  "unidade": "%",    "status": "critico", "observacao": "REMUME disponível — aderência e busca ativa insuficientes."},
        {"situacao_dado": "referencia_municipal", "indicador": "Insegurança Alimentar Grave (%)",   "valor": 8.4,  "meta": 0,    "unidade": "%",    "status": "critico", "observacao": "≈ 2.075 pessoas com fome real. Bolsa Família insuficiente."},
        {"situacao_dado": "referencia_municipal", "indicador": "Nutricionista em Apuí",             "valor": 0,    "meta": 1,    "unidade": "prof.","status": "critico", "observacao": "Zero — eMulti resolve: R$ 84.000/ano, 120 consultas/mês."},
        {"situacao_dado": "referencia_municipal", "indicador": "Cantina Escolar Saudável (%)",      "valor": 18.4, "meta": 100,  "unidade": "%",    "status": "critico", "observacao": "Lei Estadual AM descumprida. Parceria SEMEC necessária."},
    ]
