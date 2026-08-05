from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/vigilancia-sanitaria-apui", tags=["vigilancia_sanitaria_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "estabelecimentos_total": 284,
        "estabelecimentos_alto_risco": 48,
        "pct_alto_risco": 16.9,
        "inspecoes_regulares_pct": 38.4,
        "meta_inspecoes_pct": 80.0,
        "inspecoes_realizadas_ano": 109,
        "inspecoes_pendentes": 175,
        "auto_infracao_ano": 28,
        "interdições_ano": 8,
        "surtos_alimentares_ano": 8,
        "casos_surtos_total": 84,
        "agua_pontos_monitorados": 18,
        "agua_monitoramento_regular_pct": 38.4,
        "meta_agua_pct": 100.0,
        "agua_irregular_pct": 42.4,
        "raiva_vacinacao_caes_gatos_pct": 48.4,
        "meta_vacinacao_raiva_pct": 80.0,
        "leptospirose_casos_ano": 3,
        "apreensoes_produtos_irregulares_ano": 12,
        "laboratorio_referencia": "LACEN-AM (Manaus)",
        "distancia_lacen_km": 784,
        "vigilantes_sanitarios": 3,
        "meta_vigilantes": 8,
        "status_inspecoes": "critico",
        "status_agua": "critico",
        "status_zoonoses": "atencao",
    }


@lru_cache(maxsize=1)
def _ESTABELECIMENTOS():
    return [
        {"segmento": "Alimentos (mercados/restaurantes/lanchonetes)", "total": 128, "alto_risco": 18, "inspecionados_pct": 42.4, "irregulares_pct": 28.4, "status": "atencao"},
        {"segmento": "Serviços de saúde (clínicas/labs/farmácias)",  "total": 48,  "alto_risco": 22, "inspecionados_pct": 58.4, "irregulares_pct": 22.4, "status": "atencao"},
        {"segmento": "Cosméticos e saneantes",                       "total": 24,  "alto_risco": 4,  "inspecionados_pct": 28.4, "irregulares_pct": 18.4, "status": "critico"},
        {"segmento": "Água para consumo humano (SAA/SAC)",           "total": 18,  "alto_risco": 8,  "inspecionados_pct": 38.4, "irregulares_pct": 42.4, "status": "critico"},
        {"segmento": "Garimpo / produtos químicos",                  "total": 38,  "alto_risco": 38, "inspecionados_pct": 8.4,  "irregulares_pct": 92.0, "status": "critico"},
        {"segmento": "Cemitérios / funerárias",                      "total": 4,   "alto_risco": 2,  "inspecionados_pct": 50.0, "irregulares_pct": 25.0, "status": "atencao"},
        {"segmento": "Educação / creches / escolas",                 "total": 28,  "alto_risco": 4,  "inspecionados_pct": 48.4, "irregulares_pct": 22.4, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _ZOONOSES():
    return [
        {"agravo": "Raiva animal",          "situacao": "Endêmica — vacinação cães/gatos 48,4% (meta 80%)", "casos_humanos_ano": 0,  "risco": "alto",   "acao_prioritaria": "Campanha anual de vacinação antirrábica — cobertura em zona rural < 20%"},
        {"agravo": "Leptospirose",          "situacao": "3 casos humanos confirmados (2025)",                "casos_humanos_ano": 3,  "risco": "alto",   "acao_prioritaria": "Controle de roedores em áreas periurbanas e ribeirinhas. Lixão a céu aberto favorece proliferação"},
        {"agravo": "Leishmaniose visceral", "situacao": "2 casos autóctones/ano — reservatórios não mapeados","casos_humanos_ano": 2, "risco": "alto",   "acao_prioritaria": "Eutanásia de cães soropositivos, controle de flebotomíneos. CCZV estruturado apenas na capital"},
        {"agravo": "Esquistossomose",       "situacao": "Não endêmica — vigilância passiva",                 "casos_humanos_ano": 0,  "risco": "baixo",  "acao_prioritaria": "Manter vigilância em viajantes e populações ribeirinhas"},
        {"agravo": "Toxoplasmose",          "situacao": "Subnotificada — triagem neonatal incompleta",        "casos_humanos_ano": 4, "risco": "medio",  "acao_prioritaria": "Triagem pré-natal e neonatal. Toxoplasmose congênita em 4 RN/ano — monitoramento neurológico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "inspecoes_pct": 28.4, "irregulares_pct": 38.4, "surtos_alimentares": 10, "agua_irregular_pct": 52.4, "raiva_vacinacao_pct": 38.4},
        {"ano": "2023", "inspecoes_pct": 32.4, "irregulares_pct": 34.8, "surtos_alimentares": 9,  "agua_irregular_pct": 48.4, "raiva_vacinacao_pct": 42.4},
        {"ano": "2024", "inspecoes_pct": 35.8, "irregulares_pct": 32.4, "surtos_alimentares": 9,  "agua_irregular_pct": 44.8, "raiva_vacinacao_pct": 45.8},
        {"ano": "2025", "inspecoes_pct": 38.4, "irregulares_pct": 28.4, "surtos_alimentares": 8,  "agua_irregular_pct": 42.4, "raiva_vacinacao_pct": 48.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura de inspeção sanitária",          "valor": 38.4,  "meta": 80.0,  "unidade": "%",  "status": "critico", "observacao": "61,6% dos estabelecimentos sem inspeção regular. 3 vigilantes para 284 estabelecimentos = impossibilidade operacional. Risco de surtos alimentares, medicamentos irregulares e água contaminada sem detecção"},
        {"indicador": "Qualidade da água para consumo",           "valor": 57.6,  "meta": 100.0, "unidade": "% amostras ok", "status": "critico", "observacao": "42,4% das amostras irregulares — principalmente áreas rurais e ribeirinhas sem SAA. LACEN-AM (784 km) para análises laboratoriais. Cisterna e poço sem tratamento são a norma fora da sede"},
        {"indicador": "Vacinação antirrábica cães/gatos",         "valor": 48.4,  "meta": 80.0,  "unidade": "%",  "status": "atencao", "observacao": "Zona rural < 20% de cobertura. Último caso de raiva humana no AM em 2010 mas risco persiste. Rotina de vacinação interrompida 2020-2022 pela pandemia não foi plenamente recuperada"},
        {"indicador": "Surtos alimentares investigados",          "valor": 8,     "meta": 0,     "unidade": "surtos/ano", "status": "critico", "observacao": "8 surtos/84 casos em 2025 — subnotificação estimada alta. Fiscalização de 42,4% dos estabelecimentos alimentares com 28,4% de irregularidades. Ausência de laboratório local para análise bromatológica"},
        {"indicador": "Controle garimpo / produtos irregulares",  "valor": 8.4,   "meta": 100.0, "unidade": "% inspecionado", "status": "critico", "observacao": "Garimpo ilegal (38 pontos) com 92% de irregularidade sanitária — mercúrio, cianeto e explosivos sem controle. VISA municipal não tem mandato legal nem segurança para atuar em garimpo ilegal. Demanda ação federal conjunta"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/estabelecimentos")
def estabelecimentos():
    return _ESTABELECIMENTOS


@router.get("/zoonoses")
def zoonoses():
    return _ZOONOSES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
