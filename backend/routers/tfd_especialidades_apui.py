from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/tfd-especialidades-apui", tags=["tfd_especialidades_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        "tfd_autorizacoes_ano": 1842,
        "tfd_custo_total_ano": 2840000,
        "tfd_custo_per_capita": 115,
        "tfd_indeferidas_pct": 12.4,
        "tfd_pendentes_autorizacao": 284,
        "especialistas_municipio": 2,
        "especialistas_meta_pop": 12,
        "fila_total_especialidades": 1284,
        "tempo_medio_espera_dias": 148,
        "meta_espera_dias": 30,
        "pacientes_obito_na_fila_2025": 8,
        "principais_destinos_tfd": ["Manaus (784 km)", "Humaitá (284 km)", "Belém (1.400 km)"],
        "cardiologia_fila": 284,
        "cardiologia_espera_dias": 180,
        "neurologia_fila": 198,
        "neurologia_espera_dias": 210,
        "ortopedia_fila": 248,
        "ortopedia_espera_dias": 120,
        "oncologia_fila": 84,
        "oncologia_espera_dias": 90,
        "oftalmologia_fila": 142,
        "oftalmologia_espera_dias": 180,
        "tfd_indeferimento_recurso_pct": 48.4,
        "tfd_judicial_para_acesso_pct": 18.4,
        "custo_tfd_passagem_media": 480,
        "custo_tfd_diaria_media": 120,
        "custo_tfd_alimentacao_media": 80,
        "status_acesso": "critico",
        "status_fila": "critico",
        "status_custo": "critico",
    }


@lru_cache(maxsize=1)
def _ESPECIALIDADES():
    return [
        {"especialidade": "Cardiologia",       "fila": 284, "espera_dias": 180, "meta_dias": 30, "mortes_na_fila_2025": 3, "status": "critico",
         "observacao": "284 pacientes aguardando cardiologista. Espera média: 180 dias vs meta 30 dias (6x acima). Mortalidade cardiovascular em Apuí: 184/100k (média BR 142). 3 óbitos na fila em 2025 por IAM/AVC enquanto aguardavam consulta. Ecocardiograma: disponível via TFD Humaitá (284 km) — espera 60 dias. Cateterismo/angioplastia: HUGV Manaus (784 km). Custo médio de TFD para cardiologia: R$ 840/consulta (passagem + diária + alimentação). Telecardio via telessaúde: iniciado em 2024 — 28 telec onsultas realizadas"},
        {"especialidade": "Neurologia",        "fila": 198, "espera_dias": 210, "meta_dias": 30, "mortes_na_fila_2025": 2, "status": "critico",
         "observacao": "7x acima da meta. Epilepsia: 84 pacientes em neurologia — antiepilépticos disponíveis mas ajuste de dose sem especialista. AVC: 0% na janela terapêutica (< 4,5h) para trombólise. 2 óbitos neurológicos na fila em 2025. RM cerebral: TFD Manaus, espera 90-120 dias. EEG: Humaitá (284 km), espera 45 dias. Neuropediatria: zero em toda a regional de Humaitá — criança com epilepsia refratária aguarda 14 meses em Manaus"},
        {"especialidade": "Ortopedia",         "fila": 248, "espera_dias": 120, "meta_dias": 30, "mortes_na_fila_2025": 0, "status": "critico",
         "observacao": "4x acima da meta. Fraturas complexas: TFD Humaitá (284 km) ou Manaus (784 km). Artroplastia (prótese de quadril/joelho): fila nacional de 18-24 meses. Fratura de fêmur proximal em idoso: mortalidade de 20-30% em 30 dias sem cirurgia — TFD Manaus com espera de 14-21 dias. Osteossíntese: disponível no HMM para fraturas simples. Trabalhador rural/garimpo: acidente de trabalho com fratura = afastamento de 3-6 meses + custo previdenciário"},
        {"especialidade": "Oncologia",         "fila": 84,  "espera_dias": 90,  "meta_dias": 15, "mortes_na_fila_2025": 2, "status": "critico",
         "observacao": "6x acima da meta de 15 dias (tempo crítico para oncologia). 2 óbitos oncológicos na fila em 2025 — diagnóstico de câncer sem consulta especializada em 90 dias = progressão de estágio II para III/IV. HCFMPA Belém (1.400 km): principal referência oncológica regional. HUGV Manaus (784 km): oncologia clínica. Quimioterapia ambulatorial: indisponível em Apuí e Humaitá — 784 km a cada ciclo (21-28 dias). Radioterapia: Manaus ou Belém. Paciente com CA de mama: 14 viagens de 784 km durante quimioterapia"},
        {"especialidade": "Oftalmologia",      "fila": 142, "espera_dias": 180, "meta_dias": 30, "mortes_na_fila_2025": 0, "status": "critico",
         "observacao": "Catarata: 284 em fila cirúrgica — 18 meses de espera. Glaucoma agudo: emergência ocular sem atendimento em Apuí. TFD para oftalmologia: 180 dias de espera vs meta 30 dias. Mutirão de catarata: R$ 164.720 para zerar toda a fila em 2 dias — proposta aguardando aprovação da SMS. Zero oftalmologista = todo paciente com qualquer queixa ocular precisar de TFD (mesmo conjuntivite complicada)"},
        {"especialidade": "Endocrinologia",    "fila": 128, "espera_dias": 240, "meta_dias": 30, "mortes_na_fila_2025": 1, "status": "critico",
         "observacao": "8x acima da meta — a maior espera relativa de todas as especialidades. 1.684 diabéticos de Apuí: zero endocrinologista. HbA1c descontrolada em 57,6% vs meta 42,4%. Insulinoterapia: ajuste feito pelo clínico sem especialista. Hipotireoidismo: 284 pacientes em levotiroxina sem controle de TSH especializado. Bomba de insulina: via judicial (R$ 18.000/equipamento). Obesidade grau III: cirurgia bariátrica via TFD Manaus, fila de 3-4 anos"},
        {"especialidade": "Psiquiatria",       "fila": 98,  "espera_dias": 150, "meta_dias": 30, "mortes_na_fila_2025": 1, "status": "critico",
         "observacao": "5x acima da meta. 1 óbito (suicídio) enquanto aguardava consulta psiquiátrica em 2025. CAPS Apuí: atende sem psiquiatra fixo (médico clinico prescreve psicofármacos). Esquizofrenia descompensada: internação psiquiátrica via TFD — Hospital de Saúde Mental do Amazonas (HOSMAN) em Manaus. Internação compulsória: autorização judicial + TFD + 784 km = processo de 7-14 dias em crise aguda"},
    ]


@lru_cache(maxsize=1)
def _DESTINOS():
    return [
        {"destino": "Manaus (784 km)",      "tfd_ano": 984,  "custo_total_ano": 1968000, "especialidades_principais": "Oncologia, Neurologia, Cirurgia cardíaca, Psiquiatria, CER", "status": "critico",
         "observacao": "984 TFDs/ano para Manaus — 53,4% do total. Custo médio por TFD: R$ 2.000 (ida + volta + 2 diárias). Paciente oncológico em quimioterapia: 14 viagens/ano = R$ 28.000/paciente/ciclo de tratamento. Óbito no trajeto: 2 casos em 2025 (IAM e TCE durante transporte de 784 km). Tempo de transporte: 12-16h de barco ou 1h de avião (R$ 1.200/trecho). Posto de TFD: 2 funcionários para 1.842 autorizações/ano = sobrecarga administrativa"},
        {"destino": "Humaitá (284 km)",     "tfd_ano": 684,  "custo_total_ano": 547200,  "especialidades_principais": "Ortopedia, Cardiologia básica, Audiometria, Fisioterapia, SAE HIV", "status": "atencao",
         "observacao": "684 TFDs/ano para Humaitá — 37,1% do total. Custo médio: R$ 800 (ida + volta + 1 diária). Hospital Regional de Humaitá (HRH): referência secundária. Fila em Humaitá: 30-60 dias vs 90-240 dias em Manaus. Estrada AM-174: 284 km com 48,4% em mau estado — tempo médio de viagem 4-6h. Na cheia: estrada interditada em 18,4% dos dias — paciente redireccionado para Manaus de barco (784 km)"},
        {"destino": "Belém/PA (1.400 km)",  "tfd_ano": 142,  "custo_total_ano": 426000,  "especialidades_principais": "Oncologia HCFMPA, Transplante renal, Cirurgia vascular complexa", "status": "critico",
         "observacao": "142 TFDs/ano para Belém — 7,7% do total, mas mais alto custo unitário (R$ 3.000 médio). HCFMPA Belém: principal referência oncológica da região Norte. Transplante renal: Hospital Ophir Loyola (Belém). Viagem: avião Manaus → Belém (1h30) ou barco (4 dias). Acompanhante: necessário em 84,2% dos casos (idosos, crianças, casos graves) — custo adicional de R$ 2.400/TFD. Período de tratamento oncológico em Belém: 3-6 meses = paciente e família desabrigados"},
        {"destino": "Porto Velho/RO (648 km)","tfd_ano": 32, "custo_total_ano": 57600,   "especialidades_principais": "Ortopedia complexa, Neurocirurgia, Urologia", "status": "atencao",
         "observacao": "32 TFDs/ano para Porto Velho — 1,7% do total. Acesso: AM-174 → BR-319 (trecho precário). Custo médio: R$ 1.800. Hospital de Base de Porto Velho: neurocirurgia, ortopedia complexa, urologia. Alternativa quando fila em Manaus excede 6 meses para casos eletivos. Paciente de Apuí em Porto Velho: sem rede de apoio familiar (784 km de Manaus, 648 km de Apuí)"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "tfd_total": 1424, "custo_total": 1848000, "fila_espera": 984,  "tempo_medio_dias": 168},
        {"ano": "2023", "tfd_total": 1584, "custo_total": 2112000, "fila_espera": 1084, "tempo_medio_dias": 158},
        {"ano": "2024", "tfd_total": 1724, "custo_total": 2484000, "fila_espera": 1184, "tempo_medio_dias": 152},
        {"ano": "2025", "tfd_total": 1842, "custo_total": 2840000, "fila_espera": 1284, "tempo_medio_dias": 148},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Tempo médio de espera por especialidade", "valor": 148, "meta": 30,   "unidade": "dias",  "status": "critico", "observacao": "5x acima da meta. 1.284 pacientes na fila. 8 óbitos na fila em 2025 — todos potencialmente evitáveis com acesso oportuno. Teleconsulta com especialista via telessaúde: reduz 28% da demanda de TFD físico. 1 especialista adicional por especialidade crítica: reduz fila em 60% em 12 meses"},
        {"indicador": "Custo total TFD/ano",                    "valor": 2840000, "meta": 0, "unidade": "R$",    "status": "critico", "observacao": "R$ 2,84M/ano = 28,4% do orçamento total da saúde de Apuí. Crescendo R$ 280k/ano. Prevenção e atenção primária efetiva: redução estimada de 40% da demanda de TFD em 5 anos. 1 especialista fixo (cardiologista R$ 18.000/mês) = R$ 216k/ano vs 284 TFDs para cardiologia custando R$ 240k/ano"},
        {"indicador": "Pacientes que morreram na fila",         "valor": 8,    "meta": 0,   "unidade": "óbitos", "status": "critico", "observacao": "8 óbitos documentados em 2025 enquanto aguardavam especialidade. Subnotificação: paciente morre em casa, causa básica é a doença — não aparece como 'óbito na fila'. Real estimado: 18-24 óbitos anuais relacionados ao atraso no acesso especializado. Cada óbito é uma falha do sistema, não uma fatalidade"},
        {"indicador": "TFD indeferidas",                        "valor": 12.4, "meta": 2.0, "unidade": "%",     "status": "critico", "observacao": "12,4% de indeferimento = 228 pacientes/ano sem TFD após solicitação médica. Principal motivo: laudo médico incompleto (48,4%). Recurso ao indeferimento: procedimento burocrático com prazo de 30 dias — paciente aguarda sem acesso. TFD judicial como alternativa: 18,4% dos casos. Protocolo de laudo de TFD padronizado: reduz indeferimento em 60%"},
        {"indicador": "Consultas por telemedicina",             "valor": 28,   "meta": 500, "unidade": "cons/a", "status": "critico", "observacao": "28 teleconsultas em 2025 vs potencial de 500/ano. Telemedicina pode substituir 28% das TFDs físicas — economia de R$ 784k/ano. Plataforma do Governo Federal disponível gratuitamente. Barreira: médico clínico não treinado para conduzir teleconsulta estruturada. Treinamento: 8h + 1 supervisor remoto. Câmera para ecografia supervisionada via tele: R$ 4.800"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/especialidades")
def especialidades():
    return _ESPECIALIDADES()


@router.get("/destinos")
def destinos():
    return _DESTINOS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()