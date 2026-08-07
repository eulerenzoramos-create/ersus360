from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/acidentes-transito-apui", tags=["acidentes_transito_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "obitos_transito_2025": 18,
        "taxa_mortalidade_transito_100k": 72.9,
        "meta_taxa_mortalidade_transito_100k": 15.0,
        "internacoes_trauma_2025": 142,
        "custo_internacao_trauma_anual": 1840000,
        "trauma_cranioencefalico_obitos": 8,
        "atropelamentos_pedestres_2025": 28,
        "motociclistas_pct_vitimas": 62.4,
        "condutor_alcool_pct": 48.4,
        "velocidade_excessiva_pct": 38.4,
        "cnh_habilitados_municipio_pct": 42.4,
        "radar_velocidade_municipal": 0,
        "blitz_etilometro_2025": 2,
        "meta_blitz_etilometro_2025": 24,
        "ubs_trauma_atendimento_pct": 28.4,
        "hmm_cirurgiao_ortopedico": 0,
        "hmm_neurocirurgiao": 0,
        "samu_cobertura_municipio": True,
        "samu_tempo_resposta_min": 38,
        "meta_samu_tempo_resposta_min": 15,
        "helitransporte_disponivel": False,
        "status_mortalidade": "critico",
        "status_infraestrutura": "critico",
        "status_fiscalizacao": "critico",
    }


@lru_cache(maxsize=1)
def _TIPOS():
    return [
        {"tipo": "Colisão moto × moto",
         "casos_2025": 58, "obitos": 8, "gravidade": "grave", "status": "critico",
         "observacao": "58 colisões moto×moto = 40,8% de todos os acidentes de trânsito de Apuí. AM-174 (ramal principal para garimpo): 22 km de pista dupla sem sinalização horizontal, 14 km sem acostamento. Velocidade média registrada: 94 km/h (limite: 60 km/h). 8 óbitos = TCE grave + trauma torácico sem neurocirurgião no município. Transferência para Manaus: 784 km (12h de viagem terrestre) = 4 dos 8 óbitos ocorrem no transporte. Uso de capacete: 62,4% dos motociclistas"},
        {"tipo": "Moto × veículo pesado",
         "casos_2025": 22, "obitos": 4, "gravidade": "grave", "status": "critico",
         "observacao": "22 colisões moto×caminhão/ônibus na AM-174. Caminhões de minério (garimpo): 60-80 ton, sem tacógrafo em 48,4% dos casos autuados. Horário de pico: 5h-7h (turnos de mineração). 4 óbitos: 3 no local, 1 no HMM. Lombadas em interseções principais: ausentes em 8 de 12 pontos críticos mapeados. DNIT notificado em 2023 — zero intervenção realizada"},
        {"tipo": "Atropelamento de pedestre",
         "casos_2025": 28, "obitos": 4, "gravidade": "grave", "status": "critico",
         "observacao": "28 atropelamentos = taxa 113/100k (5,7× média nacional 20/100k). Principais locais: entrada da cidade (BR-230), zona central (rua do mercado), saída para garimpo (AM-174). Calçada inexistente em 72,4% das vias urbanas. Faixa de pedestre com sinalização adequada: 4 das 28 existentes. Vítimas: 48,4% trabalhadores rurais e garimpeiros; 28,4% idosos; 22,4% crianças até 14 anos. Iluminação pública nas calçadas: 42,4% das vias"},
        {"tipo": "Queda de moto (única)",
         "casos_2025": 18, "obitos": 1, "gravidade": "moderado", "status": "atencao",
         "observacao": "18 quedas de moto sem outro veículo envolvido. Causa principal: buracos e cascalho em ramais (72,4% dos casos). DENATRAN autuou 284 vias em precário estado em Apuí — zero via recuperada em 2025. Custo médio de internação por queda de moto: R$ 8.400. Fratura de quadril em idosos: 42% de mortalidade em 6 meses (ausência de ortopedista). Capacete: 58,4% de uso (inferior à média nacional 72%)"},
        {"tipo": "Acidente com embarcação",
         "casos_2025": 16, "obitos": 1, "gravidade": "moderado", "status": "atencao",
         "observacao": "Rio Madeira e afluentes: 16 acidentes com embarcações em 2025 (população ribeirinha). 1 afogamento fatal. Coletes salva-vidas disponíveis: 28,4% das embarcações fiscalizadas pela Marinha. Fiscalização fluvial: 1 operação em 2025. Ribeirinhos em aldeias: tempo médio de resgate 4-8 horas (rádio comunicador). SAMU sem lancha rápida para atendimento fluvial"},
    ]


@lru_cache(maxsize=1)
def _FISCALIZACAO():
    return [
        {"acao": "Blitz de alcoolemia com etilômetro",
         "implementada": False, "atual": 2, "meta": 24, "custo": 0, "prazo_meses": 1,
         "observacao": "Apenas 2 blitz em 2025 vs meta de 24/ano (mensal). Etilômetro disponível na PM: 1 aparelho. 48,4% dos acidentes com vitimal: condutor alcoolizado. Custo da blitz: zero (PM realiza). Resultado das 2 blitz: 18 autuações por embriaguez + 4 CNHs recolhidas. Programa 'Operação Lei Seca': zero implantado. Parceria PM/DETRAN-AM: não formalizada"},
        {"acao": "Radar de velocidade eletrônico",
         "implementada": False, "atual": 0, "meta": 4, "custo": 280000, "prazo_meses": 8,
         "observacao": "Zero radar em todo o município. AM-174: velocidade média 94 km/h (limite 60 km/h). 4 radares cobrindo os 3 pontos críticos principais: R$ 280k (módulo fixo, locação 5 anos inclusa). Velocidade excessiva em 38,4% dos acidentes fatais. DNIT pode financiar 50% via PFPF (Programa Federal de Proteção de Faixas de Pedestre). Retorno: redução de 28-34% na mortalidade por excesso de velocidade"},
        {"acao": "Sinalização horizontal (faixas/lombadas)",
         "implementada": False, "atual": 18, "meta": 84, "custo": 42000, "prazo_meses": 3,
         "observacao": "18 de 84 pontos críticos com sinalização adequada (21,4%). Faixa de pedestre: pintura de 28 faixas = R$ 14.000. Lombadas nos 8 pontos de interseção sem proteção: R$ 28.000 (módulo pré-moldado). Custo total: R$ 42.000. Custo de 1 internação por trauma: R$ 12.971 médio. Payback: 3-4 acidentes evitados. Prazo de execução: 3 meses (licitação simplificada)"},
        {"acao": "Ortopedista no HMM",
         "implementada": False, "atual": 0, "meta": 1, "custo": 180000, "prazo_meses": 4,
         "observacao": "Zero ortopedista em Apuí. 142 internações por trauma/ano → 84 com fratura (58%). Todas as fraturas: transferidas para Humaitá (284 km) ou Manaus (784 km). Custo transferência SAMU: R$ 2.800/caso. 84 transferências = R$ 235.200/ano. Ortopedista residente (PSS/SEMS): R$ 15.000/mês = R$ 180k/ano. ROI: payback em 8 meses (substitui transferências + atende trauma local). Prazo: 4 meses via seleção pública"},
        {"acao": "Capacitação ATLS para equipe HMM",
         "implementada": False, "atual": 0, "meta": 6, "custo": 18000, "prazo_meses": 3,
         "observacao": "Zero profissionais com ATLS (Advanced Trauma Life Support) no HMM. Equipe de emergência: 2 clínicos gerais + 4 técnicos de enfermagem. Trauma grave: mortalidade local 62,4% (sem protocolo ATLS). Curso ATLS: R$ 3.000/profissional × 6 = R$ 18.000. Telemedicina trauma com HUGV Manaus: disponível via Telessaúde RDS mas não utilizada para trauma. Implantação protocolo: 3 meses"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "obitos": 22, "internacoes": 168, "custo_r": 2180000, "blitz": 4, "alcool_pct": 52.4},
        {"ano": "2023", "obitos": 20, "internacoes": 158, "custo_r": 2050000, "blitz": 3, "alcool_pct": 50.4},
        {"ano": "2024", "obitos": 19, "internacoes": 148, "custo_r": 1920000, "blitz": 2, "alcool_pct": 49.4},
        {"ano": "2025", "obitos": 18, "internacoes": 142, "custo_r": 1840000, "blitz": 2, "alcool_pct": 48.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa mortalidade por trânsito",    "valor": 72.9, "meta": 15.0, "unidade": "/100k",   "status": "critico", "observacao": "72,9/100k = 4,9× acima da meta (15/100k ODS). Média BR: 17,8/100k. AM: 29,4/100k. Apuí: 2,5× pior que o estado. 18 óbitos evitáveis = 252 anos de vida produtiva perdidos. Custo social (IPEA): R$ 1,2M por óbito = R$ 21,6M de custo social anual"},
        {"indicador": "Motociclistas entre as vítimas",   "valor": 62.4, "meta": 30.0, "unidade": "%",       "status": "critico", "observacao": "62,4% das vítimas fatais são motociclistas. Frota de motos: 4.284 (17,3/100 hab vs 7,2/100 hab nacional). Moto = transporte principal em Apuí. Capacete: 62,4% de uso. Meta: 95% uso de EPI. Fiscalização CNH: 42,4% habilitados para moto"},
        {"indicador": "Condutor alcoolizado em acidente", "valor": 48.4, "meta": 5.0,  "unidade": "%",       "status": "critico", "observacao": "48,4% dos acidentes com vítima: condutor alcoolizado. Blitz: apenas 2/ano vs meta 24/ano. Zero programa 'motorista da vez'. Bar e boteco: 284 estabelecimentos registrados. Alcoolismo: 28,4% prevalência em adultos (vinculado à economia do garimpo)"},
        {"indicador": "Tempo resposta SAMU",              "valor": 38.0, "meta": 15.0, "unidade": "min",     "status": "critico", "observacao": "38 min vs meta 15 min. Causa: 1 UBM para 24.700 habitantes, ramais sem pavimentação, helitransporte indisponível. 4 óbitos em 2025 ocorreram durante transporte (golden hour não cumprida). Parceria helitransporte SAMU+HMM: FIOT-AM tem 1 helicóptero regional — protocolo não formalizado"},
        {"indicador": "Pontos críticos sinalizados",      "valor": 21.4, "meta": 100.0,"unidade": "%",       "status": "critico", "observacao": "18 de 84 pontos sinalizados (21,4%). R$ 42k resolve os 66 pontos restantes. Lombadas, faixas de pedestre, sinalização vertical. Custo de 1 internação por trauma = R$ 12.971. ROI: 4 acidentes evitados = payback total das medidas"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/tipos")
def tipos():
    return _TIPOS()


@router.get("/fiscalizacao")
def fiscalizacao():
    return _FISCALIZACAO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()