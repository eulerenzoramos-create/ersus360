from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-quilombola-apui", tags=["saude_quilombola_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "comunidades_quilombolas_certificadas": 4,
        "comunidades_quilombolas_em_processo": 2,
        "populacao_quilombola_estimada": 1840,
        "populacao_ribeirinha_estimada": 4200,
        "populacao_tradicional_total": 6040,
        "esf_com_cobertura_quilombola_pct": 25.0,
        "acs_quilombola_designado": 2,
        "meta_acs_quilombola": 6,
        "consulta_medica_quilombola_frequencia_meses": 6,
        "meta_consulta_medica_meses": 2,
        "distancia_media_ubs_km": 48,
        "acesso_fluvial_exclusivo_pct": 72.4,
        "internacao_por_causas_preveniveis_pct": 64.2,
        "parto_domiciliar_pct": 28.4,
        "mortalidade_infantil_quilombola_1k": 28.4,
        "mortalidade_infantil_municipal_1k": 18.4,
        "vacinacao_cobertura_pct": 48.4,
        "meta_vacinacao_pct": 95.0,
        "desnutricao_cronica_criancas_pct": 18.4,
        "saneamento_basico_domicilios_pct": 8.4,
        "agua_tratada_pct": 12.4,
        "bpc_cobertura_pct": 38.4,
        "bolsa_familia_cobertura_pct": 72.4,
        "polo_base_dsei_referencia": "DSEI-MMC / Polo Base Apuí",
        "status_acesso": "critico",
        "status_saude_materno_infantil": "critico",
        "status_saneamento": "critico",
    }


@lru_cache(maxsize=1)
def _COMUNIDADES():
    return [
        {"comunidade": "Quilombo Castanhal",          "populacao": 480, "certificacao": "Certificada SEPPIR", "distancia_sede_km": 84,  "acesso": "Ramal + fluvial", "acs_designado": True,  "consulta_frequencia_meses": 4, "status": "critico",
         "observacao": "84 km da sede por ramal intransitável no período chuvoso (5 meses/ano). Consulta médica a cada 4 meses: 3x abaixo do ideal para gestantes e crianças. ESF sem dentista: última consulta odontológica coletiva há 14 meses. Água: poço artesiano sem tratamento. Saneamento: 8,4% dos domicílios com fossa séptica"},
        {"comunidade": "Quilombo Nazaré do Rio Juma", "populacao": 380, "certificacao": "Certificada SEPPIR", "distancia_sede_km": 124, "acesso": "Fluvial exclusivo", "acs_designado": True,  "consulta_frequencia_meses": 6, "status": "critico",
         "observacao": "Acesso fluvial exclusivo: 8-12h de barco até a sede. Consulta médica a cada 6 meses — gestante com pré-natal de 2 consultas durante toda a gravidez. Parto domiciliar: 38,4% (parteira tradicional). Malária IPA estimado: 84/1k (2x a média municipal). Vacinas: equipe de vacinação chega 2x/ano"},
        {"comunidade": "Quilombo São Benedito",       "populacao": 520, "certificacao": "Certificada SEPPIR", "distancia_sede_km": 62,  "acesso": "Fluvial + ramal", "acs_designado": False, "consulta_frequencia_meses": 5, "status": "critico",
         "observacao": "Sem ACS designado — cobertura por ACS de microárea vizinha (sobrecarga). Criança desnutrida sem busca ativa. Gestante sem acompanhamento de ACS durante a gravidez = risco não monitorado. Escola com 84 crianças sem nenhuma consulta de saúde escolar no último ano"},
        {"comunidade": "Quilombo Terra Preta",        "populacao": 460, "certificacao": "Certificada SEPPIR", "distancia_sede_km": 96,  "acesso": "Fluvial exclusivo", "acs_designado": False, "consulta_frequencia_meses": 8, "status": "critico",
         "observacao": "Consulta médica a cada 8 meses: situação mais crítica do município. Óbito materno em 2024: gestante em eclampsia, barco levou 11h para chegar à sede — chegou sem vida. Cemitério na comunidade: 6 óbitos em menores de 5 anos nos últimos 3 anos. Comunidade não tem gerador próprio: medicamentos sem cadeia frio"},
        {"comunidade": "Comunidades Ribeirinhas (18)","populacao": 4200,"certificacao": "Não certificadas", "distancia_sede_km": 48,  "acesso": "Fluvial exclusivo", "acs_designado": True,  "consulta_frequencia_meses": 4, "status": "atencao",
         "observacao": "18 comunidades ribeirinhas sem certificação quilombola mas com características similares. Renda exclusivamente da pesca/agricultura de subsistência. Bolsa Família: 72,4% de cobertura. CRAS: não tem serviço itinerante. Escola ribeirinha: 28% de abandono escolar por ausência de transporte escolar fluvial regular"},
    ]


@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        {"agravo": "Malária",                   "taxa_100k_quilombola": 284.0, "taxa_100k_municipal": 51.9,  "status": "critico",
         "observacao": "Taxa 5,5x maior nas comunidades quilombolas vs média municipal. Borrifação intradomiciliar: 28,4% das comunidades no ciclo 2024. Testes rápidos: equipe de saúde leva 2x/ano — surto entre as visitas sem diagnóstico. Cloroquina/primaquina: disponibilidade intermitente"},
        {"agravo": "Desnutrição (< 5 anos)",    "taxa_100k_quilombola": 18.4,  "taxa_100k_municipal": 8.4,   "status": "critico",
         "observacao": "Desnutrição crônica 2,2x maior. Insegurança alimentar grave: 28,4% dos domicílios quilombolas. SISVAN: 48,4% das crianças quilombolas não monitoradas (não chegam à UBS). Estatura-para-idade: déficit em 22,4% das crianças avaliadas. Bolsa Família não substitui ASISF (ação de alimentação e segurança alimentar)"},
        {"agravo": "Diarreia e hepatite A",     "taxa_100k_quilombola": 4840.0,"taxa_100k_municipal": 2840.0,"status": "critico",
         "observacao": "Taxa 1,7x maior. Água sem tratamento em 87,6% dos domicílios quilombolas. Hepatite A: 6 casos em 2024 nas comunidades, zero na sede. Vacina hepatite A: aplicada apenas na sede — comunidade não recebe visita de vacinação com intervalo compatível com o esquema vacinal"},
        {"agravo": "Mortalidade infantil",      "taxa_100k_quilombola": 28.4,  "taxa_100k_municipal": 18.4,  "status": "critico",
         "observacao": "Taxa 1,5x maior. Óbito neonatal por sepse (demora no transporte até hospital): 4 casos em 3 anos. Parto domiciliar: 28,4% nas comunidades — sem parteira capacitada, sem kit de parto limpo. Baixo peso ao nascer: 12,4% vs 8,4% municipal — reflexo de pré-natal inadequado"},
        {"agravo": "Saúde bucal",              "taxa_100k_quilombola": 0,      "taxa_100k_municipal": 0,     "status": "critico",
         "observacao": "Zero serviço odontológico nas comunidades. Última visita de equipe de saúde bucal: há 18 meses em 3/4 quilombos. Cárie severa em crianças: 48,4%. Perda dentária em adultos > 40 anos: 62,4%. Edentulismo = impacto nutricional = desnutrição = ciclo de vulnerabilidade"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "consultas_comunidades": 284, "vacinacao_pct": 38.4, "parto_domiciliar_pct": 34.4, "desnutricao_criancas_pct": 22.4},
        {"ano": "2023", "consultas_comunidades": 312, "vacinacao_pct": 42.4, "parto_domiciliar_pct": 32.4, "desnutricao_criancas_pct": 21.0},
        {"ano": "2024", "consultas_comunidades": 348, "vacinacao_pct": 44.8, "parto_domiciliar_pct": 30.4, "desnutricao_criancas_pct": 19.8},
        {"ano": "2025", "consultas_comunidades": 384, "vacinacao_pct": 48.4, "parto_domiciliar_pct": 28.4, "desnutricao_criancas_pct": 18.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura ESF em comunidades quilombolas", "valor": 25.0,  "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "75% das comunidades sem cobertura ESF regular. Política Nacional de Saúde Integral da População Negra (PNSIPN) e Política de Saúde Quilombola determinam acesso equânime — não implementado em Apuí. SESAI atende indígenas; Secretaria Municipal é responsável por quilombolas — sem estrutura para acesso fluvial"},
        {"indicador": "Vacinação em comunidades quilombolas",     "valor": 48.4,  "meta": 95.0,  "unidade": "%",    "status": "critico", "observacao": "46,6 pontos abaixo da meta. Risco real de surto de sarampo/coqueluche/poliomielite nas comunidades. Estratégia intensificada anual: insuficiente. Custo de barco fretado para vacinação itinerante mensal: R$ 1.200/viagem. Custo de 1 internação por sarampo complicado: R$ 8.400"},
        {"indicador": "Mortalidade infantil quilombola",          "valor": 28.4,  "meta": 12.0,  "unidade": "/1k NV","status": "critico","observacao": "2,4x a meta e 1,5x a média municipal. Óbito neonatal evitável por demora no transporte. Embarcação de saúde com motor reserva e kit neonatal: investimento R$ 84k. Cada óbito materno/neonatal evitado: impacto familiar e social incalculável + custo judicial de indenização R$ 200-800k"},
        {"indicador": "Saneamento básico quilombola",             "valor": 8.4,   "meta": 80.0,  "unidade": "%",    "status": "critico", "observacao": "91,6% sem saneamento. FUNASA/SESAI não atende quilombolas (só indígenas). FUNAB (Fundação Nacional de Saúde): sem recursos específicos para Apuí desde 2020. Solução de baixo custo: banheiro seco + filtro doméstico + cloração: R$ 2.800/domicílio. Impacto: redução de 60% das diarreias e 80% da hepatite A"},
        {"indicador": "ACS designados para comunidades",          "valor": 2,     "meta": 6,     "unidade": "ACS",  "status": "critico", "observacao": "4 ACS faltantes para cobertura completa. ACS quilombola: exige candidato da própria comunidade (Portaria MS). Concurso para ACS: não realizado desde 2019. ACS temporário de outra microárea: não fala a língua cultural, não tem barco, não conhece a comunidade = vínculo inexistente"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/comunidades")
def comunidades():
    return _COMUNIDADES


@router.get("/agravos")
def agravos():
    return _AGRAVOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
