from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/tabagismo-dpoc-apui", tags=["tabagismo_dpoc_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "prevalencia_tabagismo_adulto_pct": 28.4,
        "media_brasil_tabagismo_pct": 12.1,
        "tabagismo_gestante_pct": 28.4,
        "tabagismo_adolescente_pct": 14.4,
        "tabagismo_indigena_pct": 42.4,
        "dpoc_estimados": 1284,
        "dpoc_diagnosticados_pct": 18.4,
        "asma_ativa_estimados": 742,
        "asma_controlada_pct": 28.4,
        "espirometria_disponivel": False,
        "pneumologista_municipio": 0,
        "tratamento_cessacao_tabagismo_ativo_pct": 8.4,
        "nicotina_terapia_disponivel": True,
        "grupo_cessacao_tabagismo": False,
        "queimadas_dias_ar_ruim_2024": 68,
        "pm25_pico_ug_m3": 284,
        "dpoc_internacoes_preveniveis_ano": 84,
        "custo_dpoc_internacoes_ano": 238560,
        "obitos_doencas_respiratorias_2025": 28,
        "status_tabagismo": "critico",
        "status_dpoc": "critico",
        "status_ar": "critico",
    }


@lru_cache(maxsize=1)
def _DOENCAS():
    return [
        {"doenca": "DPOC (Doença Pulmonar Obstrutiva Crônica)", "estimados": 1284, "diagnosticados_pct": 18.4, "controlados_pct": 12.4, "status": "critico",
         "observacao": "1.284 estimados com DPOC (5,2% da pop adulta) — apenas 18,4% diagnosticados (236 casos). 81,6% sem diagnóstico = sem tratamento = exacerbações evitáveis. Espirometria: indisponível em Apuí — diagnóstico definitivo de DPOC requer espirometria (padrão ouro). Diagnóstico clínico sem espirometria: falha em 28,4% (subdiagnóstico) ou excesso em 18,4% (superdiagnóstico). Broncodilatadores: salbutamol e ipratrópio disponíveis no REMUME. Corticoide inalatório: budesonida disponível. Tiotrópio (LAMA): não disponível — TFD ou judicial. Exacerbações: 84 internações/ano = R$ 238.560/ano em hospitalizações evitáveis. Fator agravante local: queimadas (68 dias/ano com PM2,5 > 150 μg/m³) causam 3-5 exacerbações adicionais/ano por paciente. Oxigênio domiciliar: 8 pacientes — cilindro de O2 via TFD Humaitá (284 km) a cada 15 dias"},
        {"doenca": "Asma brônquica",                           "estimados": 742, "diagnosticados_pct": 48.4, "controlados_pct": 28.4, "status": "critico",
         "observacao": "742 estimados com asma (3% da pop) — 48,4% diagnosticados (359 casos), apenas 28,4% controlados. Principal gatilho local: queimadas (PM2,5 284 μg/m³ em pico), umidade, fungos (habitações ribeirinhas úmidas), exposição a biomassa (fogão a lenha em 48,4% dos domicílios rurais). Asma grave: 84 pacientes — sem acesso a biológicos (dupilumabe, omalizumabe) sem ação judicial (R$ 8.400-48.000/mês). Crise asmática: salbutamol spray e nebulização no PS. SABA (β2 de curta ação) + ICS (corticoide inalatório): protocolo seguido em 62,4% dos asmáticos. Asma em criança < 5a: 124 casos — diagnóstico difícil sem espirometria pediátrica. Escola e asma: sem protocolo de manejo de crise nas escolas de Apuí — professores não treinados"},
        {"doenca": "Pneumonia adquirida na comunidade",        "estimados": 284, "diagnosticados_pct": 84.4, "controlados_pct": 72.4, "status": "atencao",
         "observacao": "284 casos/ano de PAC. Mortalidade hospitalar: 8,4% vs média BR 6,2% (sem UTI = maior mortalidade). Principal fator de risco local: tabagismo (28,4%), queimadas (poluição = defesas mucosas diminuídas), desnutrição (18,4% de anemia em adultos). Antibioticoterapia empírica: amoxicilina + azitromicina seguindo SBPT em 72,4% dos casos. Cultura de escarro: laboratório local não processa — TFD Humaitá. Oxigenioterapia: disponível. Ventilação mecânica: indisponível — paciente grave = UTI Humaitá (284 km)"},
        {"doenca": "Câncer de pulmão",                        "estimados": 28, "diagnosticados_pct": 28.4, "controlados_pct": 0.0, "status": "critico",
         "observacao": "28 casos estimados (prevalência ajustada por tabagismo de 28,4% + queimadas). Diagnóstico precoce: zero — TC de tórax via TFD Manaus (espera 90 dias). Broncoscopia: HUGV Manaus (784 km). Tratamento: oncologia Manaus ou Belém. Diagnóstico médio: estágio III-IV (sem rastreamento, sem acesso a exames). Sobrevida em 5 anos estágio IV: 5-10%. Cessação do tabagismo: reduz 87% do risco de CA de pulmão em 10 anos. Rastreamento por TC de baixa dose (alto risco): não disponível no SUS local"},
        {"doenca": "Doença intersticial pulmonar",            "estimados": 48, "diagnosticados_pct": 8.4,  "controlados_pct": 0.0, "status": "critico",
         "observacao": "48 casos estimados: silicose (garimpeiros: 18,4% dos garimpos pesquisados), pneumonite por hipersensibilidade (fungos em habitações ribeirinhas), sarcoidose. Silicose: doença ocupacional pelo garimpo — irreversível, progressiva. Sílica cristalina livre: presente em locais de garimpo de ouro. CEREST Apuí: sem pneumologista para diagnóstico de silicose. Nexo causal garimpeiro-silicose: difícil sem espirometria + TC + biópsia. Benefício previdenciário por silicose: 8 processos em Apuí"}
    ]


@lru_cache(maxsize=1)
def _CESSACAO():
    return [
        {"acao": "Grupo de cessação tabagismo (INCA)",        "implementada": False, "custo": 4800,   "prazo_meses": 2,
         "observacao": "Protocolo INCA gratuito: 4 sessões em grupo (1h/semana). Materiais gratuitos via CONPREV/MS. Barreira: profissional treinado no protocolo. Curso de capacitação EAD INCA: gratuito, 40h. Taxa de cessação com grupo: 30-35% em 12 meses. Grupo de 12 pessoas/ciclo, 4 ciclos/ano: 48 ex-fumantes/ano. Apuí: zero grupo de cessação ativo desde 2021"},
        {"acao": "Terapia de reposição nicotínica (TRN)",     "implementada": True,  "custo": 18000,  "prazo_meses": 0,
         "observacao": "Disponível no REMUME: adesivo de nicotina (14mg e 21mg) e goma de nicotina. Alcançando: apenas 8,4% dos tabagistas que querem parar. Barreira: médico não prescreve por falta de protocolo/tempo. Vareniclina (Champix): não disponível via SUS local — eficácia 3x maior que TRN. Bupropiona: disponível no REMUME — eficácia 2x TRN, mas raramente prescrita para tabagismo. Combinação TRN + bupropiona + grupo: 40-45% de cessação em 12 meses"},
        {"acao": "Abordagem breve (PAAP) na consulta",        "implementada": False, "custo": 0,      "prazo_meses": 1,
         "observacao": "PAAP (Perguntar, Avaliar, Aconselhar, Preparar): 3 minutos por consulta. Impacto: aumento de 30% na tentativa de cessação. Zero custo — integra consulta existente. Capacitação: 1 hora EAD. Apuí: profissional não pergunta sobre tabagismo em 72,4% das consultas. Registro no e-SUS: campo de tabagismo preenchido em apenas 28,4% dos prontuários. Prescrição de TRN após abordagem breve: em apenas 4,8%"},
        {"acao": "Alerta escolar (PROERD/PSE) antitabagismo", "implementada": False, "custo": 2400,   "prazo_meses": 3,
         "observacao": "Adolescente tabagista (14,4%): início médio do tabagismo em 12,4 anos — prevenção na escola é a mais custo-efetiva. PSE (Programa Saúde na Escola) implantado em 48,4% das escolas de Apuí — sem módulo de tabagismo. Material educativo INCA: gratuito, disponível online. Professores treinados: 18,4% vs meta 80%. Cigarrinho eletrônico (vape): crescente entre adolescentes — 8,4% dos alunos já usaram"},
        {"acao": "Ambientes livres de fumo",                  "implementada": False, "custo": 1200,   "prazo_meses": 2,
         "observacao": "Lei 9.294/96: proíbe fumo em locais fechados. Fiscalização em Apuí: zero autuações em 5 anos. Fumódromo (área designada): apenas na sede da prefeitura. Hospital livre de fumo: HMM não certificado — fumo identificado em área interna. Campanha de ambientes livres de fumo: custo de R$ 1.200 (placas + comunicação visual). Impacto: redução de 25% da exposição ao fumo passivo em espaços públicos"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "tabagismo_pct": 32.4, "dpoc_diagnosticados": 148, "asma_controlada_pct": 18.4, "internacoes_resp": 112, "obitos_resp": 34},
        {"ano": "2023", "tabagismo_pct": 30.8, "dpoc_diagnosticados": 184, "asma_controlada_pct": 22.4, "internacoes_resp": 104, "obitos_resp": 32},
        {"ano": "2024", "tabagismo_pct": 29.6, "dpoc_diagnosticados": 212, "asma_controlada_pct": 24.8, "internacoes_resp": 96,  "obitos_resp": 30},
        {"ano": "2025", "tabagismo_pct": 28.4, "dpoc_diagnosticados": 236, "asma_controlada_pct": 28.4, "internacoes_resp": 84,  "obitos_resp": 28},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Prevalência do tabagismo",            "valor": 28.4, "meta": 12.1, "unidade": "%",    "status": "critico", "observacao": "2,3x acima da média nacional. Tabagismo em gestante: 28,4% = prematuridade, baixo peso, maior mortalidade neonatal. Tabagismo indígena: 42,4% (cachimbo tradicional + cigarro industrializado). Cessação: 8,4% dos tabagistas receberam apoio formal para parar. Grupo de cessação + TRN: taxa de sucesso de 35%/ano = 84 ex-fumantes/ano em Apuí"},
        {"indicador": "DPOC diagnosticada",                  "valor": 18.4, "meta": 80.0, "unidade": "%diag","status": "critico", "observacao": "81,6% sem diagnóstico. Espirometria: indisponível em Apuí. Espirômetro portátil: R$ 4.800, pode ser feito na UBS por enfermeiro treinado. 84 internações DPOC/ano = R$ 238.560/ano evitável. Tratamento com broncodilatador LABA+LAMA: reduce exacerbações em 48% e hospitalizações em 35%"},
        {"indicador": "Asma controlada",                     "valor": 28.4, "meta": 70.0, "unidade": "%",    "status": "critico", "observacao": "71,6% dos asmáticos sem controle adequado. Principal gatilho evitável: queimadas. Plano de ação escrito para o asmático: em 8,4% vs meta 80%. Revisão de técnica inalatória: realizada em 18,4% das consultas. ICS (corticoide inalatório) regular: prescrito em 48,4% dos asmáticos moderados/graves — deve ser 100%"},
        {"indicador": "Óbitos por doenças respiratórias",   "valor": 28,   "meta": 12,   "unidade": "/a",   "status": "critico", "observacao": "28 óbitos em 2025 = 2,3x acima da meta. 60% relacionados ao tabagismo + queimadas. Pneumonia: 12 óbitos. DPOC: 8 óbitos. CA pulmão: 4 óbitos. Insuf. respiratória aguda: 4 óbitos. Zero UTI = mortalidade aumentada vs munícipios com UTI"},
        {"indicador": "Espirometria disponível",             "valor": "Não","meta": "Sim", "unidade": "",     "status": "critico", "observacao": "Espirômetro portátil: R$ 4.800 (compra via pregão eletrônico). Treinamento para uso: EAD gratuito + 8h presencial. Diagnóstico de DPOC sem espirometria: subdiagnóstico de 81,6% e decisões de tratamento inadequadas. ROI: 1 espirômetro diagnostica 1.048 casos subdiagnosticados de DPOC = R$ 0,46/diagnóstico vs R$ 2.840/internação evitável"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/doencas")
def doencas():
    return _DOENCAS()


@router.get("/cessacao")
def cessacao():
    return _CESSACAO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()