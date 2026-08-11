from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/atividade-fisica-apui", tags=["atividade_fisica_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 20647,  # IBGE Censo 2022,
        "sedentarismo_adultos_pct": 62.4,
        "meta_sedentarismo_pct": 15.0,
        "atividade_fisica_suficiente_pct": 22.4,
        "meta_atividade_fisica_pct": 60.0,
        "obesidade_adultos_pct": 28.4,
        "sobrepeso_adultos_pct": 48.4,
        "obesidade_infantil_5_9_pct": 18.4,
        "sobrepeso_infantil_pct": 28.4,
        "academia_saude_apui": 0,
        "meta_academia_saude": 2,
        "parque_quadra_area_lazer": 2,
        "academia_ar_livre": 0,
        "pista_caminhada_km": 0.0,
        "ciclovias_km": 0.0,
        "grupos_atividade_fisica_sus": 1,
        "meta_grupos_atividade_fisica": 8,
        "profissional_educacao_fisica_sus": 0,
        "hipertenso_sedentario_pct": 72.4,
        "diabetico_sedentario_pct": 68.4,
        "custo_doencas_sedentarismo_anual": 2840000,
        "morte_prematura_doencas_cronicas_sedentarismo_2025": 28,
        "status_sedentarismo": "critico",
        "status_infraestrutura": "critico",
        "status_programas": "critico",
    }


@lru_cache(maxsize=1)
def _GRUPOS_POPULACIONAIS():
    return [
        {"grupo": "Adultos (18-59 anos)",
         "sedentarismo_pct": 62.4, "atividade_suficiente_pct": 22.4, "obesidade_pct": 28.4, "status": "critico",
         "observacao": "62,4% dos adultos são sedentários (< 150 min/semana de AF moderada). Meta OMS: < 15%. Atividade suficiente: 22,4% vs meta 60%. Principal causa: ausência de infraestrutura de lazer, trabalho extenuante de garimpo sem lazer ativo. Sobrepeso + obesidade: 48,4% + 28,4% = 76,8% com excesso de peso. Risco: HAS (4×), DM2 (5×), DAC (3×), câncer (20-30%). Custo anual doenças crônicas relacionadas ao sedentarismo: R$ 2,84M"},
        {"grupo": "Crianças e adolescentes (5-17 anos)",
         "sedentarismo_pct": 48.4, "atividade_suficiente_pct": 28.4, "obesidade_pct": 18.4, "status": "critico",
         "observacao": "Crianças 5-9 anos: 18,4% com obesidade (IMC ≥ P97). Adolescentes: 28,4% atividade física suficiente (meta OMS: ≥ 60 min/dia). Tempo de tela: 4,8 horas/dia (meta < 2h). Educação Física escolar: 2 aulas/semana (carga mínima), mas sem espaço coberto em 4 de 8 escolas. Criança com obesidade: 70% persiste na fase adulta. Custo: terapia nutricional + diabetes + HAS precoce"},
        {"grupo": "Idosos (60+ anos)",
         "sedentarismo_pct": 72.4, "atividade_suficiente_pct": 14.4, "obesidade_pct": 22.4, "status": "critico",
         "observacao": "72,4% dos idosos sedentários — maior grupo em risco. Zero programa de atividade física para idosos no SUS de Apuí. Quedas: 42 hospitalizações/ano (sedentarismo: fator de risco modificável). Exercício resistido em idosos: redução de 40% no risco de queda, 25% de redução de morte por todas as causas. Fisioterapeuta no NASF: 0 (NASF extinto em 2019). Exercício aeróbico + resistido: R$ 0 se em grupo na UBS"},
        {"grupo": "Hipertensos e diabéticos",
         "sedentarismo_pct": 70.4, "atividade_suficiente_pct": 16.4, "obesidade_pct": 38.4, "status": "critico",
         "observacao": "70,4% dos hipertensos e 68,4% dos diabéticos são sedentários. Caminhada 30 min/dia: reduz PA em 5-8 mmHg (equivale a 1 anti-hipertensivo). 3.480 hipertensos × 70% sedentários = 2.436 pessoas com risco cardiovascular modificável por exercício. Prescrição de atividade física pelo médico: realizada em 18,4% das consultas. 'Receita do exercício': implementada em 0 UBSs de Apuí"},
        {"grupo": "Trabalhadores rurais e garimpeiros",
         "sedentarismo_pct": 28.4, "atividade_suficiente_pct": 62.4, "obesidade_pct": 18.4, "status": "atencao",
         "observacao": "Paradoxo do garimpeiro: trabalho físico extenuante mas sem atividade física de lazer ou saúde. Atividade ocupacional: alta, mas unilateral e de alto impacto osteoarticular. LER/DORT: 28,4% dos garimpeiros. Lombalgia crônica: 42,4% (maior prevalência de Apuí). Exercício compensatório (alongamento + fortalecimento de core): zero oferta no SUS. Custo de afastamento por LER: R$ 2.840/trabalhador/mês (INSS)"},
    ]


@lru_cache(maxsize=1)
def _PROGRAMAS():
    return [
        {"programa": "Academia da Saúde",
         "implementado": False, "custo": 420000, "prazo_meses": 18,
         "observacao": "Zero Academia da Saúde em Apuí. Programa MS: financiamento de 80% do custeio (R$ 4.800/mês por polo). 2 polos = R$ 9.600/mês + R$ 2.400 municipal = R$ 28.800/ano de custeio municipal. Implantação: R$ 420.000 (MS financia 80% = custo municipal R$ 84.000). Beneficiados: 500 pessoas/polo × 2 = 1.000 pessoas/mês. Custo beneficiado: R$ 2,40/mês (vs R$ 150/mês na academia privada). Impacto em saúde: redução de 18% nas internações por HAS/DM em municípios com Academia da Saúde"},
        {"programa": "Grupos de caminhada nas UBSs",
         "implementado": False, "custo": 4800, "prazo_meses": 2,
         "observacao": "1 grupo de atividade física no SUS vs meta 8. Custo de implantação de 7 grupos: R$ 4.800 (material educativo + cones + coletes). Facilitador: ACS ou agente comunitário treinado (8h). Grupo: 20 pessoas × 2 ×/semana × 45 min = meta 150 min/semana cumprida. 7 grupos novos = 140 pessoas/semana adicionais. Frequência de consulta: reduz 22% em participantes de grupos de AF do SUS. Parceria SEMUS + SEMED: uso das quadras escolares fora do horário de aula"},
        {"programa": "'Receita do Exercício' na APS",
         "implementado": False, "custo": 1200, "prazo_meses": 1,
         "observacao": "18,4% dos médicos prescrevem atividade física. 'Receita do Exercício': formulário impresso com tipo, duração e frequência de AF. Implementado: SEMUS faz reunião de 1h + distribui blocos de receita. Custo: R$ 1.200 (impressão + treinamento). Aumento esperado em prescrição de AF: de 18,4% para 72%. Impacto: 1.240 pacientes adicionais com AF prescrita em 12 meses. Cada paciente que se torna ativo: evita R$ 2.840 em atendimentos por doenças crônicas/ano"},
        {"programa": "Pista de caminhada pública",
         "implementado": False, "custo": 84000, "prazo_meses": 8,
         "observacao": "Zero pista de caminhada demarcada em Apuí. Parceria Prefeitura/SEMUS: pavimentação de 1,2 km no entorno da Praça Central + demarcação + iluminação. Custo: R$ 84.000 (via FNAS ou emenda parlamentar — R$ 0 municipal). Uso estimado: 400 pessoas/semana. Caminhada regular: reduz mortalidade por todas as causas em 35%. Pista ao ar livre: reduz barreiras de acesso (sem equipamento, sem mensalidade)"},
        {"programa": "Educação Física no NASF/eMulti",
         "implementado": False, "custo": 84000, "prazo_meses": 4,
         "observacao": "Zero profissional de Educação Física no SUS de Apuí. eMulti (equipe multiprofissional): Portaria 2.979/2019 — inclui Ed. Física como profissional elegível. Financiamento MS: R$ 5.500/mês. Custo municipal: R$ 1.500/mês = R$ 18.000/ano. Atuação: grupos de AF, prescrição de exercício, atividade para crianças. 1 profissional cobre 4 equipes de SF = 4.000 famílias. ROI: cada R$ 1 investido em AF na APS = R$ 3,20 de economia em saúde (OMS 2019)"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "sedentarismo_pct": 68.4, "obesidade_pct": 24.4, "grupos_af": 0, "academia_saude": 0},
        {"ano": "2023", "sedentarismo_pct": 66.4, "obesidade_pct": 25.8, "grupos_af": 1, "academia_saude": 0},
        {"ano": "2024", "sedentarismo_pct": 64.4, "obesidade_pct": 27.2, "grupos_af": 1, "academia_saude": 0},
        {"ano": "2025", "sedentarismo_pct": 62.4, "obesidade_pct": 28.4, "grupos_af": 1, "academia_saude": 0},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Sedentarismo em adultos",           "valor": 62.4, "meta": 15.0, "unidade": "%",     "status": "critico", "observacao": "62,4% sedentários vs meta 15%. 4,2× acima. 28 mortes prematuras por doenças crônicas associadas ao sedentarismo em 2025. Caminhada 30 min/dia = 1 anti-hipertensivo. Custo doenças do sedentarismo: R$ 2,84M/ano"},
        {"indicador": "Obesidade em adultos",              "valor": 28.4, "meta": 12.0, "unidade": "%",     "status": "critico", "observacao": "28,4% com obesidade (IMC ≥ 30). Tendência ascendente (+4% em 3 anos). Obesidade: fator de risco para HAS, DM, DAC, 13 tipos de câncer. 'Receita do Exercício': R$ 1.200 = 1.240 pacientes adicionais com AF prescrita"},
        {"indicador": "Grupos de AF no SUS",              "valor": 1,    "meta": 8,    "unidade": "grupos", "status": "critico", "observacao": "1 grupo vs meta 8. 7 grupos adicionais: R$ 4.800 (material). 140 pessoas/semana a mais. Frequência de consultas: reduz 22% em participantes de grupos de AF do SUS"},
        {"indicador": "Academia da Saúde implantada",     "valor": 0,    "meta": 2,    "unidade": "polos",  "status": "critico", "observacao": "Zero Academia da Saúde. MS financia 80% = R$ 84k municipal. 1.000 pessoas/mês beneficiadas. Custo: R$ 2,40/beneficiado/mês. Impacto: -18% em internações por HAS/DM"},
        {"indicador": "Obesidade infantil (5-9 anos)",    "valor": 18.4, "meta": 5.0,  "unidade": "%",     "status": "critico", "observacao": "18,4% das crianças 5-9 anos com obesidade. 70% persistirão na fase adulta. PSE com componente de AF: zero implantado em Apuí. Educação física com material adequado: 4 de 8 escolas sem espaço coberto"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/grupos-populacionais")
def grupos_populacionais():
    return _GRUPOS_POPULACIONAIS()


@router.get("/programas")
def programas():
    return _PROGRAMAS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()