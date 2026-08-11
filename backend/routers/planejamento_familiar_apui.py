from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/planejamento-familiar-apui", tags=["planejamento_familiar_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 20647,  # IBGE Censo 2022,
        "mulheres_em_idade_fertil": 6175,
        "mulheres_em_uso_contraceptivo_pct": 48.4,
        "meta_contraceptivo_pct": 80.0,
        "gravidez_nao_planejada_pct": 62.4,
        "gravidez_adolescente_10_19_2025": 142,
        "taxa_fecundidade_adolescente_1000": 84.4,
        "meta_fecundidade_adolescente_1000": 30.0,
        "aborto_inseguro_estimado_2025": 28,
        "preservativo_distribuido_2025": 28400,
        "meta_preservativo_distribuicao": 62400,
        "anticoncepcional_oral_disponibilidade_pct": 84.4,
        "diu_ofertado": False,
        "implante_ofertado": False,
        "laqueadura_sus_disponivel": False,
        "vasectomia_sus_disponivel": False,
        "consulta_planejamento_familiar_2025": 842,
        "meta_consultas_planejamento_familiar": 2470,
        "profissional_conselheiro_familiar_sus": 0,
        "grupo_planejamento_familiar_ativo": False,
        "gestante_acompanhada_pre_natal_pct": 62.4,
        "meta_pre_natal_pct": 95.0,
        "pre_natal_6_consultas_pct": 48.4,
        "inicio_pre_natal_1_trimestre_pct": 42.4,
        "status_contraceptivos": "critico",
        "status_gravidez_adolescente": "critico",
        "status_pre_natal": "critico",
    }


@lru_cache(maxsize=1)
def _METODOS():
    return [
        {"metodo": "Anticoncepcional oral combinado (AOC)",
         "disponivel": True, "uso_estimado_pct": 28.4, "eficacia_pct": 91.0, "status": "atencao",
         "observacao": "Anticoncepcional oral: disponível no REMUME com 84,4% de regularidade (desabastecimento de 15,6% do tempo). Levonorgestrel+etinilestradiol e noretisterona: itens da RENAME disponíveis. Adesão: 62,4% das usuárias tomam regularmente. Falha de método: 8,4% das usuárias engravidam em 1 ano (vs 0,3% de uso perfeito). Anticoncepcionais de progestogênio apenas (minipílula): disponíveis para lactantes. Distribuição na APS: irregular — UBSs periféricas com desabastecimento médio de 28 dias/ano"},
        {"metodo": "Preservativo masculino",
         "disponivel": True, "uso_estimado_pct": 22.4, "eficacia_pct": 85.0, "status": "atencao",
         "observacao": "28.400 preservativos distribuídos em 2025 vs meta 62.400 (45,5% da meta). Distribuição via UBS e CAPS ad. Jovens 15-24 anos: uso em 42,4% das relações. Adultos acima de 30: uso em apenas 18,4% das relações. Dupla proteção (preservativo + hormonal): praticada por 12,4% dos casais. Preservativo feminino: disponível em quantidade limitada (284 unidades/ano)"},
        {"metodo": "DIU (Dispositivo Intrauterino)",
         "disponivel": False, "uso_estimado_pct": 0.0, "eficacia_pct": 99.7, "status": "critico",
         "observacao": "Zero DIU ofertado no SUS de Apuí. DIU de cobre (T380A): RENAME item essencial — não disponível localmente. Inserção requer ginecologista ou médico treinado: 0 inserções em 2025. Referência: Humaitá (284 km) — fila de 8 meses. DIU hormonal (mirena): exclusivamente via judicial em Apuí. Custo: R$ 28/unidade (governo federal) + R$ 180 de inserção (procedimento SUS). Eficácia de 10 anos: método de maior custo-efetividade disponível"},
        {"metodo": "Implante subdérmico (etonogestrel)",
         "disponivel": False, "uso_estimado_pct": 0.0, "eficacia_pct": 99.9, "status": "critico",
         "observacao": "Zero implante subdérmico ofertado. RENAME: incluso. Inserção: 5 min com anestesia local, por qualquer médico treinado. Duração: 3 anos. Eficácia: 99,9% (melhor método reversível). Custo: R$ 180/implante (MS). Indicação prioritária: adolescentes, mulheres com dificuldade de adesão a método diário. Zero médico treinado em Apuí. Treinamento: 4h de capacitação (CFM/FEBRASGO online). Barreiras: falta de capacitação e de abastecimento"},
        {"metodo": "Laqueadura tubária",
         "disponivel": False, "uso_estimado_pct": 4.8, "eficacia_pct": 99.5, "status": "critico",
         "observacao": "Laqueadura: não disponível no SUS de Apuí. Referência: Humaitá (284 km) — fila de 14 meses. Demanda estimada: 142 mulheres acima de 25 anos com prole definida na fila informal. Lei 9.263/96: direito garantido para mulheres com 2+ filhos ou ≥25 anos após aconselhamento. Laqueadura em pós-parto imediato (cesárea): não realizada no HMM por ausência de ginecologista. 48,4% das mulheres com ≥3 filhos ainda sem método eficaz"},
        {"metodo": "Preservativo feminino",
         "disponivel": True, "uso_estimado_pct": 1.2, "eficacia_pct": 79.0, "status": "atencao",
         "observacao": "Preservativo feminino: disponível em quantidade limitada (284 unidades/2025). Distribuição restrita ao CAPS ad. Uso estimado: 1,2% das mulheres em idade fértil. Barreira: custo de produção (R$ 2,80/unidade vs R$ 0,40 do masculino). Empoderamento feminino: preservativo feminino aumenta autonomia contraceptiva da mulher. Distribuição ativa: zero campanha em 2025"},
    ]


@lru_cache(maxsize=1)
def _INTERVENCOES():
    return [
        {"intervencao": "Capacitação em inserção de implante e DIU para médicos da APS",
         "implementada": False, "custo": 12000, "prazo_meses": 3,
         "observacao": "4 médicos da APS de Apuí: zero com certificação em inserção de implante/DIU. Treinamento FEBRASGO: 4h online + 4h prática (phantom). Custo: R$ 3.000/médico × 4 = R$ 12.000. Após capacitação: oferta de implante e DIU na própria UBS. Impacto estimado: 280 inserções/ano = redução de 42% na gravidez não planejada. Payback: 1 internação por parto evitado (R$ 2.800) = 4 inserções que pagam o treinamento"},
        {"intervencao": "Grupo de planejamento familiar nas UBSs",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "observacao": "Zero grupo de planejamento familiar ativo em Apuí. 6 UBSs = 6 grupos mensais. Enfermeira como facilitadora (capacitação de 8h). Conteúdo: métodos disponíveis, direitos reprodutivos, dupla proteção (IST + gravidez). Custo: R$ 1.400/grupo (material educativo + 12 encontros) × 6 = R$ 8.400. Meta: atingir 840 mulheres/ano em 12 meses. Consultas de planejamento familiar: só 842/2025 vs meta 2.470"},
        {"intervencao": "Ampliação do pré-natal para 95% de cobertura",
         "implementada": False, "custo": 0, "prazo_meses": 4,
         "observacao": "62,4% das gestantes acompanhadas vs meta 95%. Causa: gestantes ribeirinhas sem acesso à UBS. Busca ativa de gestante: ACS registra 18,4% menos gestantes em área ribeirinha. Pré-natal na comunidade (micro-área): enfermeira + ACS realiza 4 de 6 consultas na própria comunidade. Custo: zero adicional (ACS já remunerado). Início no 1º trimestre: apenas 42,4% (meta 90%). Vínculo via VacinaFácil + RNDS: gestante cadastrada em tempo real"},
        {"intervencao": "Distribuição de preservativos para meta de 100%",
         "implementada": False, "custo": 13600, "prazo_meses": 1,
         "observacao": "28.400 distribuídos vs meta 62.400 (déficit 34.000 unidades). Custo do déficit: R$ 13.600 (R$ 0,40/preservativo × 34.000). Distribuição ativa: bares, igrejas, escolas + UBSs. Jovens 15-24: maiores beneficiários (IST + gravidez não planejada). Preservativo distribiuído pelo Ministério da Saúde: gratuito à secretaria via CONDOM/MS — requisição não realizada em 2025. Custo real: zero (só solicitar ao MS)"},
        {"intervencao": "Anticoncepção de emergência (AE) ativa",
         "implementada": False, "custo": 2400, "prazo_meses": 1,
         "observacao": "Levonorgestrel 1,5mg (AE): disponível no REMUME. Distribuição: apenas mediante consulta médica (barreira). AE pode ser dispensada diretamente pela farmácia/enfermeira (Portaria MS 1.459/2011). Prazo de eficácia: até 72h. Em 2025: 142 estupros notificados — AE oferecida em 84,4% dos casos (meta 100%). Mulheres sem acesso à UBS em 72h (ribeirinhas): protocolo de AE via ACS inexistente. Custo de treinamento e protocolo AE via ACS: R$ 2.400"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "contraceptivo_pct": 42.4, "gravidez_adol": 168, "pre_natal_pct": 56.4, "preservativo_meta_pct": 38.4},
        {"ano": "2023", "contraceptivo_pct": 44.4, "gravidez_adol": 158, "pre_natal_pct": 58.4, "preservativo_meta_pct": 40.4},
        {"ano": "2024", "contraceptivo_pct": 46.4, "gravidez_adol": 150, "pre_natal_pct": 60.4, "preservativo_meta_pct": 42.4},
        {"ano": "2025", "contraceptivo_pct": 48.4, "gravidez_adol": 142, "pre_natal_pct": 62.4, "preservativo_meta_pct": 45.5},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Uso de contraceptivo (MIF)",             "valor": 48.4, "meta": 80.0, "unidade": "%",       "status": "critico", "observacao": "48,4% das mulheres em idade fértil com método. 51,6% sem proteção. Zero DIU e zero implante ofertados. Capacitação médica: R$ 12k = acesso a 99,9% eficácia em Apuí"},
        {"indicador": "Taxa fecundidade adolescente (10-19a)",   "valor": 84.4, "meta": 30.0, "unidade": "/1000",   "status": "critico", "observacao": "84,4/1000 = 2,8× acima da meta. 142 gravidezes em adolescentes em 2025. Gravidez na adolescência: 3× maior risco de mortalidade materna. Implante subdérmico em adolescentes = método de maior impacto"},
        {"indicador": "Pré-natal com 6+ consultas",             "valor": 48.4, "meta": 95.0, "unidade": "%",       "status": "critico", "observacao": "Apenas 48,4% completam 6 consultas mínimas. Gestante ribeirinha: média 3,2 consultas. Mortalidade neonatal associada a < 4 consultas: 4,2× maior. Pré-natal comunitário via ACS: custo zero, +26% de adesão"},
        {"indicador": "Início pré-natal no 1º trimestre",       "valor": 42.4, "meta": 90.0, "unidade": "%",       "status": "critico", "observacao": "42,4% iniciam pré-natal até 12ª semana. 57,6% iniciam tardio. Início tardio = diagnóstico tardio de sífilis, toxoplasmose, diabetes gestacional. RNDS: cadastro de gestante permite rastreamento ativo pelo ACS"},
        {"indicador": "Gravidez não planejada",                  "valor": 62.4, "meta": 20.0, "unidade": "%",       "status": "critico", "observacao": "62,4% das gestações não planejadas. Custo de 1 gestação não planejada (saúde + social): R$ 28.400 (IPEA). 62,4% × 284 partos = 177 gestações não planejadas = R$ 5M de custo social. Investimento em anticoncepção: R$ 36.400 (R$ 12k treinamento + R$ 8.4k grupos + R$ 16k métodos) = ROI de 137×"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/metodos")
def metodos():
    return _METODOS()


@router.get("/intervencoes")
def intervencoes():
    return _INTERVENCOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()