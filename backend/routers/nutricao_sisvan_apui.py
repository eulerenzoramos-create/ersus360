from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/nutricao-sisvan-apui", tags=["nutricao_sisvan_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        # SISVAN cobertura
        "sisvan_cobertura_pct": 42.4,
        "meta_sisvan_pct": 100.0,
        "criancas_acompanhadas_sisvan": 1842,
        "gestantes_acompanhadas_sisvan": 284,
        # Desnutrição
        "desnutricao_crianca_pct": 12.4,
        "meta_desnutricao_pct": 2.5,
        "desnutricao_aguda_crianca_pct": 4.8,
        "anemia_crianca_pct": 42.4,
        "anemia_gestante_pct": 52.4,
        "deficiencia_vitamina_a_pct": 28.4,
        "deficiencia_vitamina_d_pct": 62.4,
        # Excesso de peso
        "sobrepeso_adulto_pct": 52.4,
        "obesidade_adulto_pct": 28.4,
        "obesidade_infantil_pct": 18.4,
        "meta_obesidade_adulto_pct": 20.0,
        "sindrome_metabolica_estimada_pct": 42.4,
        # Programas
        "sisvan_ubs_ativas_pct": 62.4,
        "nutrisus_bolsa_familia_pct": 68.4,
        "vitamina_a_cobertura_pct": 52.4,
        "meta_vitamina_a_pct": 100.0,
        "ferro_profilatico_pct": 42.4,
        "meta_ferro_pct": 100.0,
        "aleitamento_exclusivo_6m_pct": 28.4,
        # Insegurança alimentar
        "inseguranca_alimentar_leve_pct": 28.4,
        "inseguranca_alimentar_moderada_pct": 18.4,
        "inseguranca_alimentar_grave_pct": 8.4,
        "indigentes_estimados": 1284,
        "bolsa_familia_familias": 1842,
        "cras_ativo": True,
        "nutricionista_apui": 0,
        "cantina_escolar_saudavel_pct": 18.4,
        "status_desnutricao": "critico",
        "status_obesidade": "atencao",
        "status_sisvan": "critico",
    }


@lru_cache(maxsize=1)
def _GRUPOS():
    return [
        {"grupo": "Crianças 0-5 anos",
         "desnutricao_pct": 12.4, "sobrepeso_pct": 18.4, "anemia_pct": 42.4,
         "status": "critico",
         "observacao": "12,4% das crianças < 5a com desnutrição (meta PNDS: < 2,5%). 42,4% com anemia ferropriva — causa: desmame precoce + baixo consumo de carne. Vitamina A: deficiência em 28,4% (cegueira noturna + infecções recorrentes). Suplementação Vitamina A: MS fornece gratuitamente, dose semestral 6m-5a — cobertura 52,4% (meta 100%). Sulfato ferroso profilático: 6m-5a — 42,4% recebem (meta 100%). Curva de crescimento no cartão: ACS avalia mensalmente — base da vigilância nutricional. Desnutrição grave (SAM): terapia nutricional intensiva no CAPS Nutricional — inexistente em Apuí. Referência: HGH-Humaitá para desnutrição grave. 4,8% em desnutrição aguda grave: risco de óbito sem tratamento imediato."},
        {"grupo": "Gestantes e Puérperas",
         "desnutricao_pct": 8.4, "sobrepeso_pct": 28.4, "anemia_pct": 52.4,
         "status": "critico",
         "observacao": "52,4% das gestantes com anemia (meta < 20%). Anemia gestacional: baixo peso ao nascer + prematuridade + mortalidade perinatal. Sulfato ferroso 40mg + ácido fólico 5mg: gratuito no REMUME — aderência 42,4% (meta 100%). Ganho de peso inadequado na gestação: 42,4% (sub-ponderal ou obesa). IMC gestacional: avaliado em 68,4% das consultas de pré-natal. Cálcio 1g/dia: gratuito, reduz eclâmpsia — prescrito em 28,4% das gestantes de alto risco. Ácido fólico pré-concepcional: apenas 12,4% das mulheres em idade fértil usam (meta 100% das planejando gravidez). Deficiência de iodo: sal iodado em 92,4% dos domicílios — monitoramento ZNut/MS."},
        {"grupo": "Crianças e Adolescentes 6-19 anos",
         "desnutricao_pct": 6.4, "sobrepeso_pct": 28.4, "anemia_pct": 18.4,
         "status": "atencao",
         "observacao": "28,4% de sobrepeso/obesidade em crianças e adolescentes (obesidade infantil: 18,4%). Cantina escolar saudável: 18,4% das escolas (meta 100% — Lei Estadual). Ultraprocessados: 68,4% do consumo calórico dos adolescentes. Refrigerante: 72,4% consomem diariamente. PSE (Programa Saúde na Escola): módulo nutrição — não implementado em 62,4% das escolas. Deficiência de ferro em adolescentes: 18,4% (meninas em idade fértil: 28,4%). PNAE (Programa Nacional de Alimentação Escolar): R$ 0,53/refeição para ensino fundamental = disponível. 30% dos recursos PNAE devem ser em produtos da agricultura familiar: cumprimento em Apuí 12,4% (meta 30%)."},
        {"grupo": "Adultos 20-59 anos",
         "desnutricao_pct": 2.4, "sobrepeso_pct": 52.4, "anemia_pct": 8.4,
         "status": "atencao",
         "observacao": "52,4% de sobrepeso + 28,4% de obesidade em adultos. Síndrome metabólica estimada: 42,4% (HAS + DM + dislipidemia + obesidade central). Obesidade: causa principal de HAS + DM2 + doença cardiovascular em Apuí. NASF/eMulti: nutricionista — zero em Apuí. Consulta nutricional no SUS: lista de espera 6 meses em Humaitá. Insegurança alimentar grave: 8,4% (2.075 pessoas) = fome real. Bolsa Família: 1.842 famílias — mais de 50% da população. Ultra-processados: acesso facilitado + agricultura familiar enfraquecida. Horticultura comunitária: 0 projetos formais em Apuí (ATER/EMATER disponível)."},
        {"grupo": "Idosos 60+ anos",
         "desnutricao_pct": 18.4, "sobrepeso_pct": 28.4, "anemia_pct": 28.4,
         "status": "critico",
         "observacao": "18,4% dos idosos com desnutrição (maior grupo de risco — sarcopenia + anorexia da senescência). Anemia em idosos: 28,4% — causa: deficiência de B12 + ferro + ácido fólico + doença crônica. Mini Avaliação Nutricional (MAN): aplicada em 8,4% dos idosos (meta 100%). Vitamina D em idosos: deficiência em 62,4% — quedas + fraturas + imunidade. Suplementação proteica: zero disponível no SUS de Apuí. Sarcopenia: -40% de força muscular = dependência + quedas + mortalidade. Dieta mediterrânea adaptada à realidade amazônica: peixe local + açaí + tucumã + mandioca = custo zero. CRAS: distribuição de cestas básicas para idosos em extrema pobreza — 184 atendidos/mês."},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Vitamina A semestral e sulfato ferroso mensal — cobertura 100% (0-5 anos)",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "observacao": "Vitamina A: 52,4% (meta 100%). Sulfato ferroso profilático: 42,4% (meta 100%). MS fornece ambos gratuitamente. Custo de operacionalização: R$ 8.400 (busca ativa ACS + transporte). Vitamina A: 1 dose semestral = -24% de mortalidade infantil. Ferro profilático: -50% de anemia em < 5a. ACS com lista nominal das crianças com atraso na dose = busca ativa domiciliar em 1 semana."},
        {"acao": "Nutricionista no eMulti — consulta nutricional no SUS de Apuí",
         "implementada": False, "custo": 84000, "prazo_meses": 3,
         "observacao": "Zero nutricionista em Apuí. 52,4% de sobrepeso adulto + 12,4% de desnutrição infantil. Nutricionista eMulti: R$ 84.000/ano (PREVINE BRASIL cobre 50% = R$ 42.000 município). Atendimento: 120 consultas/mês = 1.440/ano. DM2 com orientação nutricional: redução A1c -1,0% = menos insulina + menos internações. 1 internação por descompensação DM evitada: R$ 4.200. ROI conservador: 3:1."},
        {"acao": "Vigilância nutricional — SISVAN 100% das crianças < 5a e gestantes",
         "implementada": False, "custo": 4200, "prazo_meses": 2,
         "observacao": "SISVAN: 42,4% de cobertura (meta 100%). ACS: pesa criança mensalmente + registra no SISVAN Web. Curva de crescimento: identifica desvio nutricional em 1 mês. Desnutrição detectada precoce: intervenção ambulatorial. Detectada tardia: internação = R$ 8.400. Treinamento SISVAN Web: R$ 4.200 (4h + formulários). 2.075 crianças < 5a × 100% = meta de acompanhamento mensal."},
        {"acao": "Cantina escolar saudável — implementação nas escolas municipais",
         "implementada": False, "custo": 14000, "prazo_meses": 4,
         "observacao": "18,4% das escolas com cantina saudável (meta 100% — Lei Estadual AM). Obesidade infantil: 18,4%. Ultra-processado na escola: principal vetor de obesidade precoce. Cantina saudável: proibição de refrigerante + salgadinho + doces industrializados. Custo de implantação: R$ 14.000 (assessoria nutricional + comunicação). PNAE 30% agricultura familiar: Apuí tem 12,4% — aumento para 30% = R$ 84.000/ano para agricultores locais. Horticultura escolar: R$ 8.400 (sementes + estrutura) = produto fresco na merenda."},
        {"acao": "Programa de combate à insegurança alimentar — articulação CRAS + Bolsa Família",
         "implementada": False, "custo": 0, "prazo_meses": 1,
         "observacao": "8,4% com insegurança alimentar grave (2.075 pessoas). Bolsa Família: 1.842 famílias — verificar atualização cadastral (28,4% com pendências). CRAS: busca ativa de famílias elegíveis ao BF não inscritas. Custo de articulação: R$ 0 (reunião CRAS + Saúde + Assistência). Banco de alimentos: parceria CONAB/PGPM-Bio — alimentos a preço de custo para CRAS. Horta comunitária: EMATER/ATER disponível gratuitamente. 1 família fora do BF que deveria estar = R$ 600/mês não recebido."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "desnutricao_crianca_pct": 14.4, "obesidade_adulto_pct": 24.4, "anemia_gestante_pct": 56.4, "sisvan_pct": 32.4, "inseg_alimentar_pct": 62.4},
        {"ano": "2023", "desnutricao_crianca_pct": 13.4, "obesidade_adulto_pct": 25.8, "anemia_gestante_pct": 54.4, "sisvan_pct": 36.4, "inseg_alimentar_pct": 60.4},
        {"ano": "2024", "desnutricao_crianca_pct": 12.8, "obesidade_adulto_pct": 27.2, "anemia_gestante_pct": 53.4, "sisvan_pct": 39.4, "inseg_alimentar_pct": 57.4},
        {"ano": "2025", "desnutricao_crianca_pct": 12.4, "obesidade_adulto_pct": 28.4, "anemia_gestante_pct": 52.4, "sisvan_pct": 42.4, "inseg_alimentar_pct": 55.2},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Desnutrição em crianças < 5a (meta: < 2,5%)",         "valor": 12.4, "meta": 2.5,   "unidade": "%",    "status": "critico", "observacao": "12,4% (5× meta). 4,8% desnutrição aguda grave. Vitamina A + ferro: R$ 8.400. MS fornece. -24% mortalidade."},
        {"indicador": "Anemia em gestantes (meta: < 20%)",                    "valor": 52.4, "meta": 20.0,  "unidade": "%",    "status": "critico", "observacao": "52,4%. Sulfato ferroso + ácido fólico: REMUME gratuito. Aderência 42,4%. ACS entrega + registra."},
        {"indicador": "Obesidade adulta (meta: < 20%)",                       "valor": 28.4, "meta": 20.0,  "unidade": "%",    "status": "atencao", "observacao": "28,4% (+ 52,4% sobrepeso). Nutricionista eMulti: R$ 84.000/ano (50% PREVINE). Síndrome metabólica: 42,4%."},
        {"indicador": "SISVAN cobertura (meta: 100% crianças < 5a)",          "valor": 42.4, "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "42,4%. Treinamento ACS: R$ 4.200. Desnutrição detectada precoce: ambulatorial vs tardia: R$ 8.400 internação."},
        {"indicador": "Vitamina A 6m-5a (meta: 100%)",                       "valor": 52.4, "meta": 100.0, "unidade": "%",    "status": "critico", "observacao": "52,4%. Busca ativa ACS: R$ 8.400. -24% mortalidade infantil. MS distribui gratuitamente."},
        {"indicador": "Insegurança alimentar grave (meta: 0%)",               "valor": 8.4,  "meta": 0.0,   "unidade": "%",    "status": "critico", "observacao": "8,4% = 2.075 pessoas. Atualização cadastral BF + CRAS busca ativa: R$ 0. 1 família sem BF: -R$ 600/mês."},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/grupos")
def grupos():
    return _GRUPOS()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()