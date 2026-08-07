from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/leishmaniose-visceral-apui", tags=["leishmaniose_visceral_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "casos_lv_2025": 42,
        "incidencia_lv_100k": 170.0,
        "meta_incidencia_lv_100k": 1.0,
        "casos_lv_criancas_menor_5": 18,
        "criancas_pct_casos": 42.9,
        "obitos_lv_2025": 8,
        "letalidade_pct": 19.0,
        "meta_letalidade_pct": 5.0,
        "obitos_evitageis_diagnostico_precoce": 6,
        "tempo_diagnostico_medio_dias": 84,
        "meta_tempo_diagnostico_dias": 30,
        "municipio_endemia_alta": True,
        "leishmaniose_tegumentar_coinfecciosa_pct": 22.4,
        "coinfecao_lv_hiv_pct": 18.4,
        "miltefosina_disponivel": False,
        "glucantime_disponivel": True,
        "anfotericina_b_disponivel_percentual": 62.4,
        "teste_rapido_rk39_ubs_pct": 28.4,
        "microscopista_treinado": 2,
        "entomologista_campo": 0,
        "borrifacao_intradomiciliar_2025_domicilios": 842,
        "meta_borrifacao_domicilios": 6800,
        "caes_sorologicamente_positivos_estimados": 1284,
        "caes_testados": 284,
        "caes_sacrificados_2025": 42,
        "populacao_ribeirinha_sem_controle": 8400,
        "custo_tratamento_lv_paciente": 18400,
        "custo_total_lv_2025": 772800,
        "status_incidencia": "critico",
        "status_letalidade": "critico",
        "status_controle": "critico",
    }


@lru_cache(maxsize=1)
def _CASOS():
    return [
        {"grupo": "Crianças < 5 anos",
         "casos_2025": 18, "letalidade_pct": 27.8, "diagnostico_medio_dias": 96,
         "status": "critico",
         "observacao": "18 casos (42,9% do total). Letalidade 27,8% (5 óbitos) — taxa 5,6× acima da meta de 5%. Crianças < 5 anos: forma grave de LV quase universal (esplenomegalia massiva + desnutrição + anemia). Diagnóstico precoce: febre prolongada + esplenomegalia em criança na Amazônia = suspeita clínica imediata. Teste rápido rK39: sensibilidade 94% em criança < 5 anos. Disponível em 28,4% das UBSs (2 de 6). Anfotericina B lipossomal (1ª linha criança < 5 anos): zero doses em Apuí em 2025 — média 3 doses de Manaus em 14 dias. Desnutrição associada: 62,4% das crianças com LV em Apuí tinham desnutrição prévia (fator de risco × 4)"},
        {"grupo": "Adultos (garimpo e zona rural)",
         "casos_2025": 16, "letalidade_pct": 12.5, "diagnostico_medio_dias": 78,
         "status": "critico",
         "observacao": "16 casos em adultos (38,1%). Letalidade 12,5% (2 óbitos). Perfil: garimpeiro (56,3%), trabalhador rural (31,2%), ribeirinho (12,5%). Coinfecção LV-HIV: 18,4% dos casos adultos — tratamento padrão ineficaz em coinfectados (Anfotericina B lipossomal obrigatória). Subnotificação: 28% estimado — febre crônica de garimpeiro = diagnóstico diferencial entre malária (teste rápido disponível) vs LV (sem teste rápido no garimpo). Miltefosina (oral, 28 dias): zero disponível em Apuí — tratamento de 1ª linha em países da América Latina, não adotado no Brasil ainda. Glucantime IM 20 dias: disponível no HMM — mas abandono de tratamento: 28,4%"},
        {"grupo": "HIV-positivos (coinfecção LV-HIV)",
         "casos_2025": 8, "letalidade_pct": 37.5, "diagnostico_medio_dias": 112,
         "status": "critico",
         "observacao": "8 casos de coinfecção LV-HIV (18,4% do total de LV). Letalidade 37,5% (3 óbitos) — a forma mais letal. Reativação de LV em imunossuprimido (CD4 < 200): 50% recidiva após tratamento. Anfotericina B lipossomal 5mg/kg/dia × 28 dias: custo R$ 42.000/paciente — zero doses em Apuí. SISREG para AMB Infecciosa (Manaus): 284 dias de espera (módulo Fila Cirúrgica). Profilaxia secundária (Anfotericina B quinzenal): custo R$ 2.800/mês — zero em Apuí. Taxa de detecção de HIV em casos de LV: 62,4% (2 casos sem diagnóstico de HIV ao chegarem com LV)"},
        {"grupo": "Ribeirinhos em áreas sem controle vetorial",
         "casos_2025": 0, "letalidade_pct": 0.0, "diagnostico_medio_dias": 140,
         "status": "critico",
         "observacao": "8.400 ribeirinhos em área endêmica sem borrifação intradomiciliar (BI) e sem teste de rastreio. Casos estimados não notificados: 12 adicionais (subnotificação 22,4%). BI com inseticida piretroide (UBV): 842 domicílios em 2025 vs meta de 6.800 = 12,4% de cobertura. Cada BI protege domicílio por 6 meses: R$ 84/domicílio × 6.800 = R$ 571k (custo único) vs R$ 18.400/caso de LV tratado × casos evitados. Canoa de saúde com microscopista: acessa comunidade sem estrada. Teste rK39 + lâmina de punção: diagnóstico em 1h no campo. UBS Ribeirinha: 8 meses sem energia (módulo Infraestrutura) = zero microscopia, zero conservação de Glucantime"},
    ]


@lru_cache(maxsize=1)
def _CONTROLE():
    return [
        {"acao": "Expansão do teste rápido rK39 para todas as UBSs e postos de garimpo",
         "implementada": False, "custo": 18000, "prazo_meses": 1,
         "observacao": "rK39 disponível em 28,4% das UBSs (2 de 6). Tempo diagnóstico médio atual: 84 dias (meta: 30 dias). Cada dia de atraso = 3,4% maior probabilidade de forma grave. rK39: R$ 18/teste × 600 testes/ano = R$ 10.800. Geladeira para conservação: R$ 3.600. Treinamento 1h: R$ 3.600. Total: R$ 18.000. Impacto: 84 → 1 dia de diagnóstico em UBS. 6 óbitos evitáveis/ano = cada óbito infantil evitado = inestimável + R$ 2,4M de perdas econômicas evitadas por criança. Posto de garimpo: ACS com kit rK39 + Glucantime + instrução = diagnóstico e tratamento iniciado no campo"},
        {"acao": "Borrifação intradomiciliar em 100% dos domicílios endêmicos",
         "implementada": False, "custo": 571200, "prazo_meses": 6,
         "observacao": "Cobertura atual: 12,4% (842/6.800 domicílios). Meta: 100% = 6.800 domicílios. SUCAM (SES-AM): realiza borrifação intradomiciliar (BI) com UBV piretroides. Custo municipal: R$ 84/domicílio × 6.800 = R$ 571.200 (custo único; SES-AM financia 80% = R$ 456.960 estadual; municipal: R$ 114.240). Eficácia: BI reduz casos de LV em 68,4% nas áreas borrifadas. Meta de controle nacional: < 10 casos/ano em Apuí. BI + controle canino + rK39 = eliminação da LV como problema de saúde pública em 3 anos. Vetor (Lutzomyia longipalpis): pico de transmissão de março a maio (chuvas) = BI ideal em fevereiro"},
        {"acao": "Sorologia canina + sacrifício + programa de controle de reservatório",
         "implementada": False, "custo": 84000, "prazo_meses": 3,
         "observacao": "Cães positivos estimados: 1.284. Testados: 284 (22,1%). Sacrificados: 42 (3,3% dos positivos estimados). Protocolo MMA/MS: cão sorologicamente positivo (EIE + TR Kalazar Detect) → eutanásia (Resolução CFMV 1000/2012). Custo: sorologia EIE R$ 42/cão + eutanásia R$ 28/cão = R$ 70 × 1.284 cães = R$ 89.880. Vacina Leishmune (canina): R$ 84/dose × 1.000 cães = R$ 84.000. Programa integrado (vacinação + testagem + controle): R$ 84.000 municipal + R$ 89.880 para teste + sacrifício. ZOONOSES: Apuí não tem CCZ (Centro de Controle de Zoonoses) — executado pela Secretaria de Agricultura. Comunicação: educação em saúde para tutores de cães é obrigatória para evitar abandono por medo"},
        {"acao": "Anfotericina B lipossomal em estoque permanente no HMM",
         "implementada": False, "custo": 168000, "prazo_meses": 2,
         "observacao": "Zero doses de Anfotericina B lipossomal em Apuí em 2025. 3 crianças < 5 anos morreram aguardando transferência para Manaus (distância: 480km, tempo: 12-18h por rio). Anfotericina B lipossomal (AMBILM): 1ª linha para crianças, gestantes e coinfecção LV-HIV. Custo: R$ 4.200/frasco × 20 frascos em estoque de emergência = R$ 84.000. Validade: 18 meses. Reposição: MS via componente especializado da assistência farmacêutica (CEAF). Protocolo: médico do HMM prescreve + notifica SINAN = MS repõe gratuitamente (RENAME). R$ 168.000 inicial (2 estoques de segurança) = garante tratamento de 8 casos graves/ano sem transferência a Manaus"},
        {"acao": "Treinamento de microscopistas da APS e implantação de vigilância entomológica",
         "implementada": False, "custo": 28000, "prazo_meses": 3,
         "observacao": "2 microscopistas treinados em Apuí (para malária — não para LV). Zero entomologista de campo. Vigilância entomológica de Lu. longipalpis: armadilha CDC = R$ 1.200/un × 12 = R$ 14.400 (12 pontos de monitoramento). Dados de densidade vetorial: antecipa surtos de LV (pico vetorial → alerta → BI preventiva). Treinamento: ILMD/Fiocruz Amazônia (Manaus) — curso gratuito para microscopistas de municípios endêmicos. Custo restante: R$ 13.600 (transporte + hospedagem × 4 profissionais). Cada microscopista treinado: diagnóstico de LV em 1h vs 84 dias de envio para Manaus. SINAN-LV: notificação em 24h (obrigatória) — taxa atual: 62,4% notificam em 24h"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "casos": 28, "obitos": 4, "incidencia_100k": 113.4, "borrifacao_pct": 8.4},
        {"ano": "2023", "casos": 32, "obitos": 5, "incidencia_100k": 129.5, "borrifacao_pct": 10.2},
        {"ano": "2024", "casos": 38, "obitos": 7, "incidencia_100k": 153.8, "borrifacao_pct": 11.8},
        {"ano": "2025", "casos": 42, "obitos": 8, "incidencia_100k": 170.0, "borrifacao_pct": 12.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Incidência LV/100k (meta: 1,0)",     "valor": 170.0, "meta": 1.0,  "unidade": "/100k", "status": "critico", "observacao": "170× acima da meta de eliminação. 42 casos em 2025, crescimento de +50% em 3 anos. BI + controle canino + rK39: elimina LV como problema de saúde pública em 3 anos"},
        {"indicador": "Letalidade LV (meta: ≤ 5%)",         "valor": 19.0,  "meta": 5.0,  "unidade": "%",     "status": "critico", "observacao": "8 óbitos (19,0%). Meta: 5%. 6 óbitos evitáveis com diagnóstico precoce (rK39: R$ 18k) + Anfotericina B lipossomal em estoque (R$ 168k)"},
        {"indicador": "Tempo médio de diagnóstico",          "valor": 84,    "meta": 30,   "unidade": "dias",  "status": "critico", "observacao": "84 dias (meta: 30). rK39 em todas as UBSs: 84 → 1 dia. Cada dia de atraso: +3,4% de probabilidade de forma grave. 6 óbitos infantis evitáveis/ano"},
        {"indicador": "Cobertura de borrifação intradomic.", "valor": 12.4,  "meta": 100.0,"unidade": "%",     "status": "critico", "observacao": "12,4% cobertura (842/6.800). SES-AM financia 80% = R$ 114k municipal para 100% de cobertura. BI reduz casos em 68,4%"},
        {"indicador": "Cães testados para LV",               "valor": 22.1,  "meta": 100.0,"unidade": "%",     "status": "critico", "observacao": "22,1% (284/1.284 positivos estimados). Reservatório canino principal da LV urbana. Programa integrado: R$ 84k → elimina reservatório em 18 meses"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/casos")
def casos():
    return _CASOS()


@router.get("/controle")
def controle():
    return _CONTROLE()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()