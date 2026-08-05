from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-crianca-apui", tags=["saude_crianca_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_menor_5_anos": 1482,
        "populacao_menor_10_anos": 2964,
        "nascidos_vivos_ano": 248,
        "acompanhamento_siab_menor_2_pct": 64.2,
        "meta_acompanhamento_pct": 100.0,
        "puericultura_consultas_ano_crianca": 2.4,
        "meta_puericultura_consultas": 6.0,
        "desnutricao_cronica_dea_pct": 13.2,
        "meta_desnutricao_pct": 3.0,
        "sobrepeso_obesidade_menor_10_pct": 18.4,
        "anemia_ferropriva_menor_2_pct": 38.4,
        "meta_anemia_pct": 10.0,
        "teste_pezinho_pct": 72.4,
        "meta_teste_pezinho_pct": 100.0,
        "teste_orelhinha_pct": 48.4,
        "meta_teste_orelhinha_pct": 100.0,
        "teste_olhinho_pct": 38.4,
        "meta_teste_olhinho_pct": 100.0,
        "diarreia_recorrente_menor_5_pct": 28.4,
        "internacao_diarreia_menores_5_ano": 48,
        "parasitoses_intestinais_pct": 64.2,
        "violencia_contra_crianca_notif_ano": 28,
        "trabalho_infantil_estimado": 84,
        "criancas_fora_escola_pct": 12.4,
        "suplementacao_vit_a_pct": 64.2,
        "meta_vit_a_pct": 80.0,
        "sulfato_ferroso_pct": 48.4,
        "meta_ferro_pct": 80.0,
        "pediatra_municipio": 0,
        "status_nutricao": "critico",
        "status_desenvolvimento": "critico",
        "status_triagens": "critico",
    }


@lru_cache(maxsize=1)
def _TRIAGENS_NEONATAIS():
    return [
        {"triagem": "Teste do pezinho (fenilcetonúria, hipotireoidismo, etc.)", "cobertura_pct": 72.4, "meta_pct": 100.0, "status": "atencao", "prazo_ideal_dias": "3-5 dias", "observacao": "27,6% sem triagem — parto domiciliar (15,8%) não acessa. Resultado em 15-30 dias via LACEN-AM: hipotireoidismo congênito não tratado até 30 dias = deficiência intelectual irreversível"},
        {"triagem": "Teste da orelhinha (triagem auditiva neonatal)",           "cobertura_pct": 48.4, "meta_pct": 100.0, "status": "critico", "prazo_ideal_dias": "até 30 dias", "observacao": "51,6% sem triagem auditiva — aparelho OEA disponível no HMM mas fluxo não sistematizado. Perda auditiva não diagnosticada atrasa desenvolvimento de linguagem, causa fracasso escolar e distorção idade-série"},
        {"triagem": "Teste do olhinho (reflexo vermelho)",                      "cobertura_pct": 38.4, "meta_pct": 100.0, "status": "critico", "prazo_ideal_dias": "antes da alta", "observacao": "61,6% sem triagem — retinopatia da prematuridade e catarata congênita tratáveis até 3 meses tornam-se irreversíveis sem diagnóstico precoce. Sem oftalmologista: encaminhamento para Manaus (784 km)"},
        {"triagem": "Teste do coraçãozinho (cardiopatia congênita)",            "cobertura_pct": 28.4, "meta_pct": 100.0, "status": "critico", "prazo_ideal_dias": "24-48h pós-parto", "observacao": "Oximetria de pulso pré e pós-ductal: simples, barata, salva vida. 71,6% sem triagem — cardiopatia crítica vai para casa e retorna em choque. HMM tem oxímetro mas protocolo não implementado"},
        {"triagem": "Triagem de displasia do quadril",                          "cobertura_pct": 22.4, "meta_pct": 100.0, "status": "critico", "prazo_ideal_dias": "1ª puericultura", "observacao": "Displasia não tratada até 6 meses = cirurgia maior. Manobra de Barlow/Ortolani na puericultura: médico ou enfermeiro capacitado. Cirurgia ortopédica pediátrica: Manaus (784 km)"},
    ]


@lru_cache(maxsize=1)
def _NUTRICAO_CRIANCA():
    return [
        {"faixa": "< 6 meses",  "desnutricao_ag_pct": 4.8,  "desnutricao_cr_pct": 8.4,  "sobrepeso_pct": 8.4,  "anemia_pct": 28.4, "status": "critico"},
        {"faixa": "6–23 meses", "desnutricao_ag_pct": 8.4,  "desnutricao_cr_pct": 13.2, "sobrepeso_pct": 12.4, "anemia_pct": 38.4, "status": "critico"},
        {"faixa": "2–4 anos",   "desnutricao_ag_pct": 6.4,  "desnutricao_cr_pct": 14.8, "sobrepeso_pct": 16.4, "anemia_pct": 32.4, "status": "critico"},
        {"faixa": "5–9 anos",   "desnutricao_ag_pct": 4.2,  "desnutricao_cr_pct": 12.4, "sobrepeso_pct": 22.4, "anemia_pct": 18.4, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "acomp_siab_pct": 52.4, "desnutricao_cr_pct": 16.4, "anemia_pct": 42.4, "teste_pezinho_pct": 62.4, "vit_a_pct": 56.4},
        {"ano": "2023", "acomp_siab_pct": 56.4, "desnutricao_cr_pct": 15.2, "anemia_pct": 40.8, "teste_pezinho_pct": 66.8, "vit_a_pct": 58.8},
        {"ano": "2024", "acomp_siab_pct": 60.8, "desnutricao_cr_pct": 14.2, "anemia_pct": 39.4, "teste_pezinho_pct": 69.4, "vit_a_pct": 61.4},
        {"ano": "2025", "acomp_siab_pct": 64.2, "desnutricao_cr_pct": 13.2, "anemia_pct": 38.4, "teste_pezinho_pct": 72.4, "vit_a_pct": 64.2},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Acompanhamento SISAB < 2 anos",  "valor": 64.2, "meta": 100.0, "unidade": "%",       "status": "critico", "observacao": "35,8% das crianças < 2 anos sem acompanhamento regular na APS. Puericultura 2,4 consultas/ano vs 6 preconizadas. Criança ribeirinha tem acesso mensal irregular à UBS: vacinas atrasadas, desnutrição não detectada, desenvolvimento não monitorado"},
        {"indicador": "Desnutrição crônica < 5 anos",   "valor": 13.2, "meta": 3.0,   "unidade": "%",       "status": "critico", "observacao": "4,4x acima da meta — zona ribeirinha e rural com prevalência estimada > 20%. SISVAN com cobertura 58,4% em < 5 anos: subnotificação subestima o problema. Desnutrição crônica na primeira infância = déficit cognitivo irreversível, ciclo de pobreza"},
        {"indicador": "Anemia ferropriva < 2 anos",     "valor": 38.4, "meta": 10.0,  "unidade": "%",       "status": "critico", "observacao": "3,8x acima da meta — sulfato ferroso profilático em 48,4% (meta 80%). Aleitamento exclusivo apenas 28,4% até 6 meses: introdução precoce de alimentos sem ferro biodisponível. Anemia na primeira infância = deficit cognitivo, baixo rendimento escolar"},
        {"indicador": "Teste da orelhinha",              "valor": 48.4, "meta": 100.0, "unidade": "%",       "status": "critico", "observacao": "51,6% sem triagem auditiva. Perda auditiva bilateral congênita não diagnosticada até 6 meses = criança muda funcional. Aparelho OEA existe no HMM mas sem protocolo de aplicação universal. Fluxo pós-resultado positivo: fonoaudiólogo em Manaus"},
        {"indicador": "Trabalho infantil (estimado)",    "valor": 84,   "meta": 0,     "unidade": "crianças","status": "critico", "observacao": "84 crianças em trabalho infantil estimado — garimpo ilegal e agricultura familiar utilizam mão de obra infantil. CREAS com capacidade limitada para fiscalização. Trabalho infantil no garimpo = exposição a mercúrio, acidente, abandono escolar"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/triagens")
def triagens():
    return _TRIAGENS_NEONATAIS


@router.get("/nutricao")
def nutricao():
    return _NUTRICAO_CRIANCA


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
