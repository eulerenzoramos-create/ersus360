from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/prenatal-risco-gestacional-apui", tags=["prenatal_risco_gestacional_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        "nascidos_vivos_2025": 524,
        "gestantes_estimadas": 620,
        "prenatal_7_consultas_pct": 28.4,
        "meta_prenatal_7_consultas_pct": 100.0,
        "prenatal_nenhuma_consulta_pct": 8.4,
        "prenatal_nenhuma_consulta_n": 52,
        "prenatal_1a_consulta_ate_12s_pct": 42.4,
        "meta_1a_consulta_ate_12s_pct": 100.0,
        "risco_gestacional_alto_pct": 28.4,
        "risco_gestacional_alto_n": 176,
        "risco_gestacional_habitual_n": 444,
        "gestantes_adolescentes_pct": 22.4,
        "gestantes_adolescentes_n": 139,
        "gestantes_indigenas_pct": 14.4,
        "gestantes_garimpo_pct": 18.4,
        "gestantes_ribeirinhas_pct": 32.4,
        "obitos_maternos_2025": 4,
        "razao_mortalidade_materna_100k": 763.4,
        "meta_rmm_100k": 30.0,
        "causa_obito_mat_hemorragia_pct": 50.0,
        "causa_obito_mat_hipertensao_pct": 25.0,
        "causa_obito_mat_infeccao_pct": 25.0,
        "natimortos_2025": 18,
        "taxa_natimortalidade_1000": 34.4,
        "meta_natimortalidade_1000": 10.0,
        "sifilis_gestante_2025": 84,
        "sifilis_congenita_2025": 42,
        "hiv_gestante_positivo_2025": 12,
        "tarv_gestante_em_uso_pct": 72.4,
        "usgo_obstetricia_apui": 0,
        "obstetra_apui": 0,
        "enfermeira_obstetra_apui": 1,
        "leito_obstetricia_hmm": 8,
        "cesarea_pct": 62.4,
        "meta_cesarea_pct": 15.0,
        "parto_domiciliar_2025": 42,
        "parto_domiciliar_sem_assistencia_2025": 28,
        "custo_prenatal_completo_unico": 1200,
        "custo_obito_materno_impacto_social": 2800000,
        "status_prenatal": "critico",
        "status_mortalidade_materna": "critico",
        "status_sifilis": "critico",
    }


@lru_cache(maxsize=1)
def _GESTANTES():
    return [
        {"grupo": "Gestantes de risco habitual (72% das gestantes)",
         "n": 444, "prenatal_adequado_pct": 38.4, "1a_consulta_ate_12s_pct": 52.4,
         "status": "critico",
         "observacao": "444 gestantes de risco habitual. Prenatal adequado (7+ consultas): 38,4% (meta 100%). Problema: distância + transporte. Gestante ribeirinha: 4-8h de barco para UBS = impossível 7 consultas. Solução: USF Fluvial (barco-saúde) + teleconsulta entre consultas presenciais. Exames essenciais: hemograma, glicemia, sífilis, HIV, HBsAg, urina, tipagem sanguínea, toxoplasmose — disponíveis em Apuí (exceto HBsAg: 14 dias). 1ª consulta até 12 semanas: 52,4% (meta 100%). Início tardio = sem espaço para intervir em anemia + sífilis congênita + diabetes gestacional. ACS: visita em gravidez confirmada no domicílio = agendamento imediato"},
        {"grupo": "Gestantes de alto risco (28% das gestantes)",
         "n": 176, "prenatal_adequado_pct": 18.4, "1a_consulta_ate_12s_pct": 28.4,
         "status": "critico",
         "observacao": "176 gestantes de alto risco (HAG, diabetes gestacional, gemelar, cicatriz uterina, anomalia fetal). Pré-natal de alto risco: SISREG para Manaus. Tempo de espera: 284 dias (módulo Fila Cirúrgica). Gestação de 40 semanas: 284 dias de espera = nunca chega ao especialista antes do parto. Soluções: teleconsulta obstétrica (tele-obstetrícia, R$ 14k); médico especialista itinerante mensal (R$ 14k/mês). HAG (hipertensão arterial na gestação): causa de 25% dos óbitos maternos em Apuí. Diabetes gestacional: TTOG disponível mas realizado em 28,4% das gestantes. Pré-eclâmpsia: sulfato de magnésio disponível no HMM — protocolo de uso em 42,4% das equipes"},
        {"grupo": "Gestantes adolescentes (< 20 anos, 22,4%)",
         "n": 139, "prenatal_adequado_pct": 14.4, "1a_consulta_ate_12s_pct": 18.4,
         "status": "critico",
         "observacao": "139 gestantes adolescentes (22,4% — meta OMS < 10%). Taxa de gravidez na adolescência em Apuí: 3× a média brasileira. Fatores: baixa escolaridade, sem planejamento familiar (módulo Planejamento Familiar), ausência de PSE (Programa Saúde na Escola). Adolescente grávida: menor adesão ao pré-natal (14,4% com 7+ consultas). Maior risco: pré-eclâmpsia, baixo peso ao nascer, óbito neonatal. ACS: rastreia gravidez em adolescentes + encaminha à UBS imediatamente. Grupo de gestantes adolescentes no CRAS: apoio social + orientação nutricional. Planejamento familiar pós-parto: anticoncepcional reversível de longa ação (LARC) — ofertado em 18,4% das adolescentes pós-parto em Apuí"},
        {"grupo": "Gestantes indígenas e ribeirinhas (46,8%)",
         "n": 290, "prenatal_adequado_pct": 8.4, "1a_consulta_ate_12s_pct": 14.4,
         "status": "critico",
         "observacao": "290 gestantes indígenas (14,4%) e ribeirinhas (32,4%). Prenatal adequado: 8,4% — o mais baixo de todos os grupos. Barreiras: distância (4-8h de barco), custo do transporte (R$ 280/viagem), barreira cultural (parteira tradicional ainda presente em 42,4% dos partos ribeirinhos). Parto domiciliar: 42 em 2025, 28 sem nenhuma assistência qualificada. Natimortalidade nesse grupo: 2× a média municipal. DSEI/FUNAI: cobertura de indígenas em território — CASAI (Casa de Apoio à Saúde Indígena) em Apuí acolhe gestante no último mês. Parteira treinada: integração com ESF para partos domiciliares assistidos. USF Fluvial: SES-AM financia. Barco-saúde mensal: R$ 42k/ano, alcança 8 comunidades ribeirinhas"},
        {"grupo": "Sífilis na gestação e sífilis congênita",
         "n": 84, "prenatal_adequado_pct": 0, "1a_consulta_ate_12s_pct": 0,
         "status": "critico",
         "observacao": "84 casos de sífilis em gestantes (taxa: 160/1.000 NV — meta: < 1/1.000). 42 casos de sífilis congênita (meta zero). Penicilina G Benzatina 2,4M UI: disponível no REMUME. Problema: VDRL não realizado em 28,4% das consultas pré-natais. Sífilis congênita: CID-A50 — notificação obrigatória, indica falha gravíssima do pré-natal. Tratamento do parceiro: realizado em 28,4% dos casos (parceiro não tratado = reinfecção). TASO (tratamento de agente sexual operado): protocolo de rastreio e tratamento simultâneo do casal. Meta Rede Cegonha: zero sífilis congênita. Custo do fracasso: criança com sífilis congênita = R$ 84.000 em tratamento pediátrico especializado vs R$ 4,80 de penicilina"},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Protocolo de classificação de risco gestacional na 1ª consulta",
         "implementada": False, "custo": 2400, "prazo_meses": 1,
         "observacao": "Zero classificação de risco gestacional sistemática em Apuí. Protocolo MS (Rede Cegonha): 1ª consulta = classificação risco habitual vs alto. Alto risco: encaminhamento imediato para tele-obstetrícia. Formulário de classificação: 1 página, preenchida pelo médico/enfermeiro. Custo: R$ 2.400 (impressão + treinamento 2h). Impacto: 176 gestantes de alto risco identificadas e encaminhadas precocemente = detecção precoce de HAG (causa de 25% dos óbitos maternos). Protocolo de sulfato de magnésio para pré-eclâmpsia grave: imprime e fixa na parede do HMM. 1 óbito materno por eclâmpsia evitado = R$ 2,8M de impacto social evitado. Custo-efetividade: máxima"},
        {"acao": "VDRL em 100% das consultas pré-natais (eliminar sífilis congênita)",
         "implementada": False, "custo": 4200, "prazo_meses": 1,
         "observacao": "VDRL realizado em 71,6% das consultas pré-natais (meta: 100% na 1ª consulta + 3º trimestre). 42 casos de sífilis congênita em 2025 — cada um indica falha do pré-natal. Custo do VDRL: R$ 3,20/teste. Custo para eliminar: R$ 4.200 (kits + treinamento para teste rápido de sífilis na UBS). Penicilina G Benzatina: R$ 4,80/dose × 3 doses = R$ 14,40 por gestante tratada. Sífilis congênita: R$ 84.000 em tratamento pediátrico. ROI: R$ 4.200 investido vs R$ 3,53M em tratamento de 42 casos de congênita. Tratamento do parceiro: protocolo impresso → médico trata casal na mesma consulta. Meta: zero sífilis congênita em 12 meses"},
        {"acao": "Tele-obstetrícia para gestantes de alto risco (Telessaúde MS)",
         "implementada": False, "custo": 14000, "prazo_meses": 2,
         "observacao": "Zero obstetra em Apuí. 176 gestantes de alto risco sem acesso a especialista. SISREG: 284 dias de espera = gestação já terminou antes do especialista. Tele-obstetrícia (Telessaúde MS + HUPAA): gratuita, obstetra da UFAM avalia caso via videoconferência. Médico/enfermeira de Apuí apresenta caso + ultrassonografia. Custo: R$ 14.000 (tablet + internet + treinamento). Meta: toda gestante de alto risco tem avaliação especializada em < 30 dias. Diabetes gestacional: telediabetes gestacional = prescrição remota + controle local. HAG: telecardiocardiologia gestacional. Impacto: 3 óbitos maternos evitáveis/ano = inestimável + R$ 8,4M de impacto social"},
        {"acao": "Melhoria da cobertura de pré-natal para gestantes ribeirinhas (barco-saúde)",
         "implementada": False, "custo": 42000, "prazo_meses": 3,
         "observacao": "290 gestantes ribeirinhas/indígenas com pré-natal 8,4% adequado. Barco-saúde (USF Fluvial): SES-AM tem programa de UBSFs (Unidade Básica de Saúde Fluvial). Apuí: sem UBSF própria. Convênio SES-AM: barco-saúde mensal visita 8 comunidades ribeirinhas. Custo municipal: R$ 42.000 (cofinanciamento de 30% + logística local). Cada visita: 8 comunidades × 30 gestantes alcançadas = 240 consultas pré-natais/mês. Parto domiciliar sem assistência: 28 em 2025 → 0 com barco-saúde mensal. Parteira treinada integrada à ESF: parceria com FUNAI + Rede Cegonha. Natimortalidade ribeirinha: -50% com cobertura de pré-natal adequada (evidência SES-AM)"},
        {"acao": "Protocolo de manejo ativo do 3º estágio do parto (MATEP) no HMM",
         "implementada": False, "custo": 8400, "prazo_meses": 1,
         "observacao": "Hemorragia pós-parto: causa de 50% dos óbitos maternos em Apuí (2 de 4 em 2025). MATEP: ocitocina 10UI IM imediatamente após nascimento + tração controlada do cordão + massagem uterina. Custo: R$ 1,20/ampola de ocitocina. Protocolo impresso fixado na sala de parto. Custo total: R$ 8.400 (treinamento de toda equipe do HMM + simulação em manequim). Eficácia: MATEP reduz hemorragia grave em 60%. 2 óbitos maternos por hemorragia evitáveis = R$ 5,6M de impacto social. Misoprostol sublingual (600mcg): disponível no REMUME — alternativa quando ocitocina não disponível (partos domiciliares). Ácido tranexâmico IV: disponível no HMM — protocolo de uso em hemorragia pós-parto: 62,4% das equipes conhecem"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "prenatal_7_pct": 18.4, "obitos_maternos": 6, "rmm": 1145.0, "sifilis_congenita": 52, "natimortos": 24},
        {"ano": "2023", "prenatal_7_pct": 22.4, "obitos_maternos": 5, "rmm": 954.0,  "sifilis_congenita": 48, "natimortos": 22},
        {"ano": "2024", "prenatal_7_pct": 24.4, "obitos_maternos": 5, "rmm": 954.0,  "sifilis_congenita": 45, "natimortos": 20},
        {"ano": "2025", "prenatal_7_pct": 28.4, "obitos_maternos": 4, "rmm": 763.4,  "sifilis_congenita": 42, "natimortos": 18},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Razão de Mortalidade Materna (meta: 30/100k)",  "valor": 763.4, "meta": 30.0,  "unidade": "/100k NV", "status": "critico", "observacao": "763,4/100k NV — 25,4× acima da meta. 4 óbitos em 2025 (2 hemorragia, 1 eclâmpsia, 1 infecção). MATEP: evita 2/ano. Tele-obstetrícia: evita mais 1. Meta em 5 anos: < 60/100k"},
        {"indicador": "Pré-natal ≥ 7 consultas",                       "valor": 28.4,  "meta": 100.0, "unidade": "%",        "status": "critico", "observacao": "28,4% — 71,6% sem pré-natal adequado. Barco-saúde: +290 ribeirinhas/mês. ACS: agendamento imediato ao confirmar gravidez. 1ª consulta até 12 semanas: 42,4% (meta 100%)"},
        {"indicador": "Sífilis congênita (meta: zero)",                "valor": 42,    "meta": 0,     "unidade": "casos",    "status": "critico", "observacao": "42 casos = 42 falhas do pré-natal. VDRL + penicilina: R$ 18,60/gestante tratada. R$ 4.200 elimina em 12 meses. Cada caso evitado: R$ 84.000 em tratamento pediátrico"},
        {"indicador": "Natimortalidade (meta: ≤ 10/1.000)",            "valor": 34.4,  "meta": 10.0,  "unidade": "/1.000 NV","status": "critico", "observacao": "34,4/1.000 NV — 3,4× acima da meta. 18 natimortos em 2025 (62,4% em ribeirinhas sem pré-natal). Barco-saúde + tele-obstetrícia: -50% em 18 meses"},
        {"indicador": "Cesáreas (meta: ≤ 15%)",                        "valor": 62.4,  "meta": 15.0,  "unidade": "%",        "status": "critico", "observacao": "62,4% de cesáreas (meta OMS: 15%). Cesárea desnecessária: R$ 3.200 vs parto normal R$ 800. Protocolos de humanização do parto (HumanaMS): implantados em 18,4% das condutas do HMM"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/gestantes")
def gestantes():
    return _GESTANTES()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()