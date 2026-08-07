from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/ilpi-idoso-apui", tags=["ilpi_idoso_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 18732,  # IBGE Censo 2022,
        "populacao_idosa_60mais": 2224,
        "populacao_idosa_pct": 9.0,
        "idosos_dependentes_estimados": 334,
        "idosos_dependentes_pct": 15.0,
        "ilpi_municipio": 0,
        "ilpi_referencia_cidade": "Humaitá (284 km)",
        "cuidadores_formais_sus": 4,
        "meta_cuidadores": 28,
        "sad_visitas_idoso_mes": 48,
        "meta_sad_visitas_mes": 248,
        "quedas_hospitalizacao_2025": 42,
        "quedas_obito_2025": 8,
        "idosos_polifarmacia_5mais_med": 38.4,
        "idosos_sem_cuidador_formal": 84.4,
        "vacina_influenza_idoso_pct": 68.4,
        "meta_vacina_influenza_idoso_pct": 90.0,
        "vacina_pneumococica_idoso_pct": 42.4,
        "demencia_diagnosticados_pct": 14.4,
        "demencia_estimados": 222,
        "depressao_idoso_pct": 28.4,
        "desnutricao_idoso_pct": 22.4,
        "abuso_idoso_notificado_2025": 18,
        "abuso_idoso_subnotificacao_pct": 78.4,
        "status_atencao": "critico",
        "status_seguranca": "critico",
        "status_cobertura": "critico",
    }


@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {"condicao": "Quedas e fraturas",
         "estimados": 334, "acometidos_pct": 28.4, "acompanhamento_pct": 14.4, "status": "critico",
         "observacao": "42 hospitalizações por queda em 2025 — 8 óbitos. Fratura de fêmur proximal: mortalidade de 20-30% em 30 dias sem cirurgia. Cirurgia: TFD Humaitá (284 km), espera 14-21 dias (alta mortalidade no período). Idoso > 80a com fratura de quadril sem cirurgia em 72h: mortalidade 50% em 6 meses. Avaliação de risco de queda (Escala de Morse): realizada em 18,4% das consultas de idosos. Adaptação domiciliar (barras de apoio, tapete antiderrapante): orientada em 8,4% dos casos. Fisioterapia preventiva (equilíbrio/força): zero vagas locais. Vitamina D (deficiência em 68,4% dos idosos de Apuí): suplementada em 22,4%"},
        {"condicao": "Demência e Alzheimer",
         "estimados": 222, "acometidos_pct": 14.4, "acompanhamento_pct": 8.4, "status": "critico",
         "observacao": "222 estimados com algum grau de demência (9-10% de idosos > 65a). Apenas 14,4% diagnosticados — diagnóstico clínico simples (MEEM, teste do relógio) que pode ser feito pelo médico da APS. Ausência de diagnóstico = sem tratamento, sem suporte ao cuidador, sem planejamento. Donepezila e memantina: disponíveis no REMUME para Alzheimer confirmado. Neuropsicólogo: zero em Apuí — avaliação em Manaus (784 km). Grupo de suporte ao cuidador: inexistente. Idoso com demência avançada: risco de abandono, maus-tratos, institucionalização inadequada. Respiro ao cuidador: serviço inexistente em Apuí"},
        {"condicao": "Depressão e isolamento",
         "estimados": 631, "acometidos_pct": 28.4, "acompanhamento_pct": 18.4, "status": "critico",
         "observacao": "28,4% dos idosos com sintomas depressivos (Escala de Depressão Geriátrica — GDS). Aplicação da GDS na APS: 18,4% dos idosos avaliados. Depressão em idoso: infradiagnosticada (confundida com envelhecimento normal). Suicídio em idosos: 18,4 tentativas/100k/ano vs 8,4/100k na população geral. Antidepressivos (fluoxetina, amitriptilina): disponíveis. Cuidado: amitriptilina em idoso = risco de queda (anticolinérgico). Grupo de convivência de idosos: 1 ativo na sede (28 participantes), zero nas comunidades rurais. Isolamento ribeirinho: 48,4% dos idosos > 70a vivem sozinhos ou em comunidade remota sem contato semanal"},
        {"condicao": "Polifarmácia e reações adversas",
         "estimados": 855, "acometidos_pct": 38.4, "acompanhamento_pct": 12.4, "status": "critico",
         "observacao": "38,4% dos idosos com ≥ 5 medicamentos (polifarmácia). 8,4% com ≥ 10 medicamentos. Medicamentos inapropriados para idosos (Critérios de Beers): prescrito em 28,4% dos idosos. Principais: BZD (clonazepam/diazepam — queda + dependência), AINEs (sangramento GI + renal), anticolinérgicos. Revisão de medicamentos pelo farmacêutico: zero protocolo ativo. Internação por reação adversa a medicamento (RAM) em idoso: 6 casos em 2025. Conciliação medicamentosa na alta hospitalar: realizada em 18,4% dos casos. Dispensação informatizada com alerta de RAM: não implantada"},
        {"condicao": "Desnutrição e sarcopenia",
         "estimados": 490, "acometidos_pct": 22.4, "acompanhamento_pct": 8.4, "status": "critico",
         "observacao": "22,4% dos idosos com desnutrição ou risco nutricional (MNA-SF). Sarcopenia (perda de massa muscular): estimada em 28,4% dos idosos > 75a. MNA (Mini Nutritional Assessment) aplicado na APS: 8,4% dos idosos. Suplemento nutricional (Ensure/Fortini): disponível via judicial (84 ações ativas) — não está no REMUME local. Nutricionista: zero no NASF de Apuí. Idoso desnutrido: maior risco de queda, fratura, infecção, hospitalização e morte. Dentição inadequada (edentulismo): 62,4% dos idosos sem prótese dentária adequada = dificuldade alimentar = desnutrição"},
        {"condicao": "Abuso e violência ao idoso",
         "estimados": 80,  "acometidos_pct": 3.6,  "acompanhamento_pct": 22.5, "status": "critico",
         "observacao": "18 casos notificados em 2025, subnotificação de 78,4% = estimado 80+ casos/ano. Tipos: negligência (62,4%), violência psicológica (22,4%), violência física (12,4%), violência financeira (2,8%). Perpetrador: familiar cuidador em 84,4% dos casos (exaustão do cuidador). CREAS Apuí: sem psicólogo capacitado em violência ao idoso. Conselho Municipal do Idoso: sem reunião registrada em 2025. Disque 100 (denúncia): 28,4% dos profissionais sabem orientar o idoso sobre o serviço. Estatuto do Idoso (Lei 10.741/2003): capacitação de profissionais em 8,4%"},
    ]


@lru_cache(maxsize=1)
def _ILPI():
    return [
        {"servico": "ILPI no município",
         "disponivel": False, "capacidade": 0, "demanda_estimada": 84,
         "observacao": "Zero ILPIs em Apuí — demanda estimada de 84 vagas (idosos dependentes sem rede de suporte). ILPI mais próxima: Humaitá (284 km) — 12 vagas, fila de 18 meses. ILPI pública (municipal): custo de implantação R$ 840.000 (construção) + R$ 360.000/ano (operação para 20 residentes). ILPI comunitária (contrato com entidade filantrópica): R$ 1.200/idoso/mês via convênio = R$ 1.008.000/ano para 84 vagas. Financiamento pelo SUAS/MDS: possível via cofinanciamento federal. Atualmente: idoso dependente sem família permanece no HMM por ausência de alternativa (2 casos crônicos em leito hospitalar)"},
        {"servico": "Serviço de Atenção Domiciliar (SAD)",
         "disponivel": True, "capacidade": 4, "demanda_estimada": 84,
         "observacao": "SAD ativo com 4 cuidadores vs necessidade de 28 para cobertura da demanda. 4 cuidadores = 48 visitas/mês vs demanda de 248 visitas. Modalidade AD1 (APS): cobertura de baixa complexidade. Modalidade AD2/AD3 (EMAD): não implantada — exige médico e enfermeiro exclusivos. EMAD Apuí: sem financiamento — município < 40k hab precisa de consórcio ou habilitação individual. Idosos em AD2/AD3 estimados: 28 (acamados com curativos complexos, nutrição enteral, oxigênio). Cuidador informal (familiar): 84,4% dos idosos dependentes dependem exclusivamente de cuidador familiar não remunerado"},
        {"servico": "Centro-Dia para idosos",
         "disponivel": False, "capacidade": 0, "demanda_estimada": 124,
         "observacao": "Zero Centros-Dia em Apuí. Centro-Dia: modalidade diurna de cuidado (não internação) para idosos com dependência moderada. Custo: R$ 42k/mês para 30 vagas = R$ 1.400/vaga/mês (mais barato que ILPI e internação hospitalar). Financiamento via SUAS. Benefício: libera o cuidador familiar para trabalhar, evita internação hospitalar, estimulação cognitiva. 1 Centro-Dia de 30 vagas: evita 8-12 internações hospitalares/mês por quedas e exacerbações de doenças crônicas"},
        {"servico": "Grupo de convivência de idosos",
         "disponivel": True, "capacidade": 28, "demanda_estimada": 400,
         "observacao": "1 grupo ativo com 28 participantes na sede — zero nas 14 comunidades rurais. 400 idosos potencialmente beneficiados. Grupo de convivência: reduz depressão em 48%, isolamento em 62%, demanda de UBS em 28%. Custo: zero (espaço cedido, profissional do NASF). Barreira: transporte para comunidades rurais + sem profissional disponível. Estratégia: parcerias com igrejas e associações comunitárias rurais — grupo pode funcionar sem profissional de saúde"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "pop_idosa": 2024, "quedas_hosp": 52, "demencia_diag": 22,  "sad_visitas": 28,  "abuso_notif": 8},
        {"ano": "2023", "pop_idosa": 2084, "quedas_hosp": 48, "demencia_diag": 28,  "sad_visitas": 36,  "abuso_notif": 12},
        {"ano": "2024", "pop_idosa": 2154, "quedas_hosp": 44, "demencia_diag": 28,  "sad_visitas": 42,  "abuso_notif": 14},
        {"ano": "2025", "pop_idosa": 2224, "quedas_hosp": 42, "demencia_diag": 32,  "sad_visitas": 48,  "abuso_notif": 18},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Idosos dependentes sem cuidador formal",    "valor": 84.4, "meta": 20.0, "unidade": "%",   "status": "critico", "observacao": "84,4% dos idosos dependentes sem cuidador formal = familiares sobrecarregados + idoso em risco. 4 cuidadores para 334 dependentes. Expansão do SAD (EMAD) em consórcio com Humaitá: R$ 180k/ano para cobrir AD2/AD3. Cada internação evitada por SAD: R$ 2.840 economizado"},
        {"indicador": "Quedas com hospitalização",                 "valor": 42,   "meta": 10,   "unidade": "/a",  "status": "critico", "observacao": "42 quedas hospitalizadas em 2025, 8 óbitos. Avaliação de risco de queda na APS: 18,4% dos idosos. Custo de queda hospitalizada: R$ 8.400 média. Fisioterapia preventiva (equilíbrio/força) para idosos > 70a: zero vagas. Programa 'Academia do Idoso' (fisioterapia em grupo): custo R$ 24k/ano, evita 18+ quedas = economia R$ 151k/ano"},
        {"indicador": "Demência diagnosticada",                    "valor": 14.4, "meta": 70.0, "unidade": "%",   "status": "critico", "observacao": "85,6% sem diagnóstico de demência. MEEM + Teste do Relógio: 10 minutos na consulta de APS. Donepezila e memantina: no REMUME — sem diagnóstico = sem tratamento. Cuidador de idoso com demência: burnout em 48,4% (sem grupo de suporte). Diagnóstico precoce: retarda evolução + planejamento de vida digna"},
        {"indicador": "Cobertura vacinal influenza (idosos)",      "valor": 68.4, "meta": 90.0, "unidade": "%",   "status": "critico", "observacao": "68,4% vs meta 90%. 476 idosos sem vacinação anual. Influenza em idoso: hospitalizações 3× mais frequentes. Estratégia ativa (vacinação domiciliar ribeirinha): 28,4% dos casos de descoberta em idosos acima de 70a em comunidades remotas"},
        {"indicador": "Abuso e violência ao idoso notificado",     "valor": 18,   "meta": 0,    "unidade": "casos","status": "critico", "observacao": "18 notificados + subnotificação de 78,4% = 80+ reais. Perpetrador: familiar cuidador em burnout (sem respiro, sem suporte). Prevenção: grupo de suporte ao cuidador + respiro (serviço de cuidador temporário). CREAS: capacitação em violência ao idoso para toda equipe. Disque 100: divulgação ativa nas UBSs"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/condicoes")
def condicoes():
    return _CONDICOES()


@router.get("/ilpi")
def ilpi():
    return _ILPI()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()