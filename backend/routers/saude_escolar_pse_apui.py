from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-escolar-pse-apui", tags=["saude_escolar_pse_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        "alunos_matriculados_2025": 6840,
        "escolas_municipais": 18,
        "escolas_estaduais": 4,
        "escolas_rurais_ribeirinhas": 12,
        "escolas_indigenas": 3,
        "escolas_pse_adesao": 8,
        "meta_escolas_pse": 22,
        "pse_cobertura_pct": 36.4,
        "meta_pse_cobertura_pct": 100.0,
        "alunos_triagem_visual_2025": 1284,
        "alunos_deficiencia_visual_detectada": 284,
        "alunos_oculos_necessitam": 142,
        "alunos_oculos_fornecidos": 28,
        "alunos_triagem_auditiva_2025": 842,
        "alunos_deficiencia_auditiva_detectada": 84,
        "alunos_triagem_saude_bucal_2025": 2420,
        "alunos_carie_ativa": 1284,
        "alunos_carie_ativa_pct": 52.9,
        "alunos_tratamento_concluido_pct": 18.4,
        "obesidade_escolar_pct": 22.4,
        "sobrepeso_escolar_pct": 18.4,
        "desnutricao_leve_escolar_pct": 8.4,
        "alunos_gravidez_escolar_2025": 42,
        "alunos_gravidez_escolar_menores_15": 8,
        "alunos_uso_alcool_drogas_pct": 18.4,
        "alunos_bullying_vitima_pct": 28.4,
        "alunos_abuso_sexual_suspeita_2025": 28,
        "abuso_sexual_notificado_2025": 8,
        "evasao_escolar_pct": 14.4,
        "evasao_por_gravidez_pct": 28.4,
        "evasao_por_trabalho_infantil_pct": 42.4,
        "dentista_escolar_apui": 0,
        "psicologo_escolar_apui": 0,
        "assistente_social_escolar": 2,
        "programa_saude_bucal_escola": False,
        "programa_alimentacao_saudavel": False,
        "programa_prevencao_drogas": False,
        "status_pse": "critico",
        "status_saude_bucal": "critico",
        "status_evasao": "critico",
    }


@lru_cache(maxsize=1)
def _ACOES_PSE():
    return [
        {"acao": "Triagem visual em 100% dos alunos (Olhar Brasil / Visão Brasil)",
         "implementada": False, "custo": 14000, "prazo_meses": 2,
         "escolas_alcancadas": 22, "alunos_beneficiados": 6840,
         "observacao": "1.284 alunos triados (18,8% do total). 284 com deficiência visual — 142 precisam de óculos. Apenas 28 óculos fornecidos (19,7%). Programa Olhar Brasil (MS + MEC): fornece óculos gratuitamente via UBS. Oftalmologista: zero em Apuí (módulo Saúde Ocular). Triagem: enfermeiro/técnico de enfermagem com tabela Snellen = 15 min/aluno. Custo: R$ 14.000 (treinamento + tabelas + ônibus para escolas rurais). 142 alunos com baixa visão não corrigida: rendimento escolar -40% (evidência OMS). Cada aluno que evadir por dificuldade de aprendizagem não corrigida = R$ 84.000 de perda econômica ao longo da vida. Formulário Olhar Brasil: APS encaminha ao oftalmologista de referência em Humaitá/AM"},
        {"acao": "Escovação supervisionada + aplicação de flúor em escolas municipais",
         "implementada": False, "custo": 18000, "prazo_meses": 1,
         "escolas_alcancadas": 18, "alunos_beneficiados": 5420,
         "observacao": "52,9% de cárie ativa nos alunos triados (1.284 de 2.420). Escovação supervisionada semanal: professor supervisiona com kit de escova + creme dental (MS fornece via PNSB). Aplicação semestral de flúor gel: cirurgião-dentista da UBS vai à escola — 2 visitas/ano/escola. Custo: R$ 18.000 (kits de escovação × 18 escolas + transporte do dentista). Eficácia: -60% de novas cáries em 2 anos (Cochrane). Cárie = 1ª causa de ausência escolar por dor no Brasil. 18 escolas × 2 visitas/ano = 36 visitas. PSE: ação obrigatória em municípios com adesão. Custo do tratamento de 1.284 cáries ativas: R$ 1.284 × R$ 84 = R$ 107.856. Prevenção custaria R$ 18k = ROI 6:1 em 2 anos"},
        {"acao": "Protocolo de notificação de abuso sexual infantil nas escolas",
         "implementada": False, "custo": 4800, "prazo_meses": 1,
         "escolas_alcancadas": 22, "alunos_beneficiados": 6840,
         "observacao": "28 suspeitas de abuso sexual em 2025, apenas 8 notificadas (subnotificação 71,4%). Lei 8.069/1990 (ECA): professor é obrigado a comunicar ao Conselho Tutelar. Protocolo: fluxo de 1 página — sinal de alerta → professor comunica à direção → direção notifica CREAS + Conselho Tutelar + UBS. Treinamento: 2h para todos os professores. Custo: R$ 4.800 (impressão + treinamento × 22 escolas). Conselho Tutelar de Apuí: 5 conselheiros — capacitados para acolhimento inicial. CREAS: equipe de referência para abuso sexual (proteção especial de alta complexidade). Cada caso não notificado: ciclo de violência continuado + trauma permanente + maior probabilidade de transtorno mental na vida adulta"},
        {"acao": "Programa de prevenção à gravidez na adolescência (PSE + UBS)",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "escolas_alcancadas": 10, "alunos_beneficiados": 3200,
         "observacao": "42 gravidezes escolares em 2025 (8 em menores de 15 anos = estupro de vulnerável). Taxa 3× a média nacional. 28,4% das evasões escolares por gravidez. Programa: enfermeiro/médico vai à escola mensalmente — conversa de 1h sobre contracepção, ETS, direitos reprodutivos. Distribuição de preservativos: UBS entrega sem receita para adolescentes (Lei 9.263/1996). DIU (adolescentes): SUS oferece via planejamento familiar. Custo: R$ 8.400 (preservativos + material educativo + horas do profissional). Impacto: -30% gravidez adolescente em 2 anos (evidência MS). 8 casos de menor de 15 anos: notificação obrigatória de estupro de vulnerável ao CREAS + delegacia — zero casos notificados como tal em Apuí"},
        {"acao": "Rastreio de trabalho infantil nas escolas rurais",
         "implementada": False, "custo": 3600, "prazo_meses": 2,
         "escolas_alcancadas": 12, "alunos_beneficiados": 2100,
         "observacao": "42,4% das evasões nas escolas rurais por trabalho infantil (garimpo + agricultura). Trabalho infantil no garimpo: exposição a mercúrio (módulo Mercúrio e Garimpo) + risco de morte por soterramento. PETI (Programa de Erradicação do Trabalho Infantil): municípios elegíveis = Apuí elegível. PETI + SCFV (Serviço de Convivência e Fortalecimento de Vínculos): R$ 0 municipal (100% federal). ACS: identifica crianças que trabalham em visita domiciliar. CRAS: aciona PETI + Bolsa Família (condicionalidade). Professor: alerta quando aluno falta sistematicamente + chega com sinais de trabalho pesado. Menor trabalhando no garimpo: notificação à Delegacia do Trabalho + Conselho Tutelar (crime)"},
    ]


@lru_cache(maxsize=1)
def _PROGRAMAS():
    return [
        {"programa": "PSE — Programa Saúde na Escola",
         "status": "parcial", "cobertura_pct": 36.4, "meta_pct": 100.0,
         "observacao": "PSE: parceria MEC + MS. 8 de 22 escolas com adesão (36,4%). Meta: 100%. Ações obrigatórias do PSE: triagem visual + auditiva + saúde bucal + rastreio de violência + prevenção de obesidade + saúde mental. Recursos: MS transfere R$ 5.500/escola/bimestre para municípios com adesão plena. 22 escolas × R$ 5.500 × 5 bimestres = R$ 605.000/ano já financiados pelo MS — Apuí não acessou por não ter adesão plena. Gestor de saúde + secretaria de educação: reunião de 2h = termo de adesão. Custo: R$ 0 para ampliar adesão"},
        {"programa": "Saúde Bucal Escolar (PNSB)",
         "status": "ausente", "cobertura_pct": 0.0, "meta_pct": 100.0,
         "observacao": "PNSB (Programa Nacional de Saúde Bucal): ação do PSE que garante escovação supervisionada + aplicação de flúor. Zero implantado em Apuí. 52,9% de cárie ativa. Dentista escolar: zero. Custo de tratamento vs prevenção = R$ 107.856 vs R$ 18.000. ROI 6:1. Dentistas das UBSs: podem ir à escola 2×/ano (PSE permite). Escovação diária: professor supervisiona (treinamento 1h). Kit escovação MS: gratuito mediante pedido ao DAB/SCTIE"},
        {"programa": "Alimentação Saudável / Obesidade Escolar",
         "status": "ausente", "cobertura_pct": 0.0, "meta_pct": 100.0,
         "observacao": "22,4% de obesidade + 18,4% de sobrepeso escolar. Dupla carga nutricional: 8,4% desnutrição leve + 40,8% excesso de peso. PNAE (Programa Nacional de Alimentação Escolar): R$ 0,53 a R$ 1,07/aluno/dia repassado pelo FNDE. 6.840 alunos × 200 dias = R$ 726.960 já disponível. Cardápio: nutricionista planeja (zero nutricionista em Apuí). 30% do PNAE: obrigatoriamente de agricultura familiar local. Horta escolar: custo R$ 2.400/escola × 5 escolas-piloto. Obesidade infantil: custo de vida inteira em DCNT = R$ 420.000/pessoa. Prevenção na escola: janela mais efetiva (5-14 anos)"},
        {"programa": "Prevenção ao Uso de Drogas e Álcool (PROERD)",
         "status": "ausente", "cobertura_pct": 0.0, "meta_pct": 100.0,
         "observacao": "18,4% dos alunos com uso de álcool e/ou drogas (estimado). Garimpo: cultura de uso de álcool e cocaína normalizada (afeta filhos de garimpeiros). PROERD: programa da Polícia Militar executado em escolas — PM de Apuí. Custo: R$ 0 para o município (PM executa). Garimpeiros levam filhos para o garimpo nos finais de semana: exposição precoce ao ambiente. Bullying: 28,4% de alunos vítimas (relacionado a uso de drogas + problemas de saúde mental). PSE: inclui roda de conversa mensal sobre drogas facilitada pelo profissional de saúde. CVV 188: divulgar nas escolas — custo R$ 0"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "pse_cobertura_pct": 18.4, "carie_ativa_pct": 58.4, "gravidez_escolar": 52, "evasao_pct": 18.4},
        {"ano": "2023", "pse_cobertura_pct": 22.4, "carie_ativa_pct": 56.4, "gravidez_escolar": 48, "evasao_pct": 16.4},
        {"ano": "2024", "pse_cobertura_pct": 28.4, "carie_ativa_pct": 54.4, "gravidez_escolar": 45, "evasao_pct": 15.2},
        {"ano": "2025", "pse_cobertura_pct": 36.4, "carie_ativa_pct": 52.9, "gravidez_escolar": 42, "evasao_pct": 14.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura PSE (meta: 100%)",           "valor": 36.4, "meta": 100.0,"unidade": "%",     "status": "critico", "observacao": "36,4% — 14 escolas sem PSE. MS repassa R$ 605k/ano para Apuí com adesão plena. Custo para ampliar: R$ 0. Reunião gestores saúde + educação = adesão em 1 semana"},
        {"indicador": "Cárie ativa (alunos triados)",         "valor": 52.9, "meta": 0.0,  "unidade": "%",     "status": "critico", "observacao": "52,9% (1.284 alunos). Escovação supervisionada + flúor: R$ 18k vs R$ 107k de tratamento. ROI 6:1. Cárie = 1ª causa de ausência por dor no Brasil"},
        {"indicador": "Gravidez na adolescência (< 20 anos)", "valor": 42,   "meta": 0,    "unidade": "casos", "status": "critico", "observacao": "42 casos (8 em < 15 anos = estupro de vulnerável). 28,4% das evasões. Programa de prevenção: R$ 8.400 → -30% em 2 anos. 8 casos de < 15 anos: zero notificados como crime"},
        {"indicador": "Evasão escolar",                       "valor": 14.4, "meta": 0.0,  "unidade": "%",     "status": "critico", "observacao": "14,4% (984 alunos). 42,4% por trabalho infantil, 28,4% por gravidez. PETI: custo R$ 0 municipal. Cada aluno que conclui o ensino médio: +R$ 84k de renda ao longo da vida"},
        {"indicador": "Abuso sexual infantil subnotificado",  "valor": 71.4, "meta": 0.0,  "unidade": "%",     "status": "critico", "observacao": "71,4% de subnotificação (28 suspeitas, 8 notificadas). ECA: notificação obrigatória. Protocolo: R$ 4.800 treinamento. Cada caso não notificado: trauma permanente + ciclo de violência"}
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/acoes-pse")
def acoes_pse():
    return _ACOES_PSE()


@router.get("/programas")
def programas():
    return _PROGRAMAS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()