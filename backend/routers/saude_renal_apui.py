from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-renal-apui", tags=["saude_renal_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_total": 24700,
        "drc_prevalencia_estimada_pct": 4.2,
        "drc_casos_estimados": 1038,
        "drc_diagnosticada_pct": 22.4,
        "drc_estadio_avancado_pct": 64.2,
        "hemodialise_municipio": False,
        "hemodialise_referencia": "Humaitá (284 km) ou Manaus (784 km)",
        "hemodialise_vagas_sus_fila_meses": 6,
        "nefrologista_municipio": 0,
        "creatinina_laboratorio_dias": 14,
        "tfd_hemodialise_viagens_mes": 48,
        "tfd_custo_paciente_hemodialise_R_mes": 2840,
        "transplante_renal_acompanhamento": "HEMOAM Manaus (784 km)",
        "itu_internacoes_ano": 84,
        "litiase_renal_internacoes_ano": 28,
        "drc_has_dm_prevalencia_associada_pct": 72.4,
        "amputacao_diabetes_ano": 12,
        "status_hemodialise": "critico",
        "status_diagnostico": "critico",
        "status_prevencao": "atencao",
    }


@lru_cache(maxsize=1)
def _ESTAGIOS_DRC():
    return [
        {"estagio": "DRC G1 (TFG ≥ 90)", "descricao": "Lesão renal com TFG normal/aumentada", "estimados": 280, "diagnosticados": 42, "manejados_aps_pct": 48.4, "status": "atencao",
         "observacao": "DRC G1 = controlável na APS com controle rigoroso de HAS e DM. 48,4% com manejo inadequado: anti-hipertensivo inconstante, glicemia sem monitoramento domiciliar. Detecção em G1 evita progressão — mas rastreio com microalbuminúria não realizado sistematicamente em Apuí por falta de insumo laboratorial"},
        {"estagio": "DRC G2 (TFG 60-89)",  "descricao": "Leve redução da TFG",                "estimados": 224, "diagnosticados": 38, "manejados_aps_pct": 42.4, "status": "atencao",
         "observacao": "Progressão de G2 para G3 prevenível com IECA/BRA e controle metabólico. IECA: disponível na farmácia municipal com desabastecimento médio 28 dias/ano. Sem nefrologista: risco de progressão não avaliado com equação CKD-EPI. Creatinina + microalbuminúria: exame disponível com espera de 14-21 dias"},
        {"estagio": "DRC G3 (TFG 30-59)", "descricao": "Moderada redução da TFG",             "estimados": 284, "diagnosticados": 84, "manejados_aps_pct": 28.4, "status": "critico",
         "observacao": "G3 = ponto de inflexão — progressão para diálise sem intervenção em 5-8 anos. Referência a nefrologista obrigatória: inexistente em Apuí, TFD para Humaitá/Manaus com espera de 4-6 meses. Hiperparatireoidismo secundário, anemia renal: sem monitoramento. PTH, ferro sérico: não disponíveis no laboratório municipal"},
        {"estagio": "DRC G4 (TFG 15-29)", "descricao": "Grave redução da TFG",                "estimados": 148, "diagnosticados": 28, "manejados_aps_pct": 8.4,  "status": "critico",
         "observacao": "G4 = preparação para terapia renal substitutiva (TRS). Fístula arteriovenosa: confecção cirúrgica em Manaus com espera de 6-12 meses. Paciente em G4 sem preparo para diálise = urgência dialítica = mortalidade 3-4x maior que o planejado. Dieta hipoproteica: sem nutricionista renal = progressão acelerada"},
        {"estagio": "DRC G5 (TFG < 15)",  "descricao": "Falência renal — TRS obrigatória",    "estimados": 102, "diagnosticados": 42, "manejados_aps_pct": 0.0,  "status": "critico",
         "observacao": "Hemodiálise: zero em Apuí. Diálise peritoneal: zero em Apuí. TFD para hemodiálise: 3x/semana, 284-784 km/sessão. Custo real (TFD + deslocamento): R$ 2.840/mês. Paciente com falta de energia elétrica 48h/mês: bomba de diálise peritoneal inoperante. Mortalidade pré-diálise por desacesso: estimada em 28,4%"},
    ]


@lru_cache(maxsize=1)
def _CAUSAS():
    return [
        {"causa": "Hipertensão Arterial (nefroesclerose)",  "proporcao_drc_pct": 42.4, "controlada_municipio_pct": 38.4, "status": "critico",
         "observacao": "Maior causa de DRC em Apuí. HAS não controlada danifica os glomérulos progressivamente. Anti-hipertensivos em falta 48 dias/ano = dano renal cumulativo irreversível. 1.849 hipertensos não cadastrados no HIPERDIA = sem monitoramento renal"},
        {"causa": "Diabetes Mellitus (nefropatia diabética)","proporcao_drc_pct": 28.4, "controlada_municipio_pct": 42.4, "status": "critico",
         "observacao": "DM = 2ª maior causa de DRC. Nefropatia diabética: detectável por microalbuminúria antes da perda de função. Rastreio sistemático anual: não realizado em 72,4% dos diabéticos. HbA1c > 8%: 57,6% dos diabéticos. Amputação diabética: 12/ano — extremidade perdida = dano renal já avançado em 84,2% dos amputados"},
        {"causa": "ITU de repetição (pielonefrite crônica)","proporcao_drc_pct": 14.4, "controlada_municipio_pct": 62.4, "status": "atencao",
         "observacao": "84 internações por ITU/ano. Pielonefrite crônica não tratada = cicatriz renal = DRC progressiva. Urocultura: laboratório municipal com espera de 7-14 dias — antibiótico empírico sem antibiograma gera resistência e falha terapêutica"},
        {"causa": "Nefrotoxicidade (medicamentos/metais)",  "proporcao_drc_pct": 8.4,  "controlada_municipio_pct": 28.4, "status": "critico",
         "observacao": "Mercúrio (garimpo): nefrotoxicidade direta. Mercúrio médio 28,4 μg/L em garimpeiros (limite 5,0). Uso de anti-inflamatórios sem prescrição: prevalente na população rural. AINEs + HAS + DM = triple nefrotóxico. AINES disponíveis sem receita em farmácias locais"},
        {"causa": "Glomerulopatias e outras",               "proporcao_drc_pct": 6.4,  "controlada_municipio_pct": 18.4, "status": "critico",
         "observacao": "Diagnóstico por biópsia renal: impossível em Apuí. Glomerulonefrite pós-estreptocócica: prevalente em crianças com amigdalite não tratada (43,4% sem acesso a penicilina na primeira consulta). Progressão para DRC crônica não monitorada por ausência de exame periódico de urina na APS"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "drc_diagnosticada_pct": 14.4, "hemodialise_tfd_pacientes": 18, "itu_internacoes": 98, "amputacao_diabetes": 16},
        {"ano": "2023", "drc_diagnosticada_pct": 16.8, "hemodialise_tfd_pacientes": 22, "itu_internacoes": 92, "amputacao_diabetes": 15},
        {"ano": "2024", "drc_diagnosticada_pct": 19.4, "hemodialise_tfd_pacientes": 36, "itu_internacoes": 88, "amputacao_diabetes": 13},
        {"ano": "2025", "drc_diagnosticada_pct": 22.4, "hemodialise_tfd_pacientes": 48, "itu_internacoes": 84, "amputacao_diabetes": 12},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "DRC diagnosticada",                   "valor": 22.4, "meta": 80.0, "unidade": "%",     "status": "critico", "observacao": "77,6% sem diagnóstico. DRC é silenciosa até G3-G4: paciente sem sintomas não busca atendimento. Rastreio ativo (microalbuminúria + creatinina anual em HAS/DM) poderia detectar G1-G2 tratáveis. Custo de detecção precoce: R$ 28/paciente. Custo de hemodiálise: R$ 4.200/mês/paciente"},
        {"indicador": "DRC em estágio avançado (G4-G5)",     "valor": 64.2, "meta": 20.0, "unidade": "%",     "status": "critico", "observacao": "Detecção tardia = custo humano e financeiro máximo. 64,2% em G4-G5 no diagnóstico = fila de diálise imediata. TFD hemodiálise: 3 viagens/semana para Humaitá ou Manaus. Custo TFD anual/paciente: R$ 34.080 — custo de rastreio precoce seria R$ 28/ano"},
        {"indicador": "Hemodiálise disponível em Apuí",      "valor": 0,    "meta": 1,    "unidade": "serviço","status": "critico", "observacao": "Zero. 48 pacientes em TFD hemodiálise (3x/semana = 144 viagens/mês). Implantação de Clínica de Diálise em Apuí: custo R$ 1,2M + custeio R$ 28k/mês. Paciente sem condição de transporte: abandona hemodiálise = óbito previsível em 2-4 semanas"},
        {"indicador": "Rastreio DRC em HAS/DM (microalbuminúria)", "valor": 18.4, "meta": 80.0, "unidade": "%", "status": "critico", "observacao": "81,6% dos HAS/DM sem rastreio renal anual. Microalbuminúria disponível no laboratório municipal com frequência irregular — insumo com desabastecimento médio 42 dias/ano. Sem rastreio: G1-G2 evoluem para G3-G4 silenciosamente"},
        {"indicador": "Amputação por diabetes (pé diabético)","valor": 12,   "meta": 4,    "unidade": "casos/ano","status": "critico","observacao": "3x acima da meta esperada. Amputação = falha de toda a cadeia preventiva: controle glicêmico, rastreio de neuropatia, cuidado dos pés. Zero podólogo, zero protocolo de pé diabético sistematizado. Cada amputação: R$ 12.800 (internação + prótese) vs R$ 480/ano de prevenção integral"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/estagios")
def estagios():
    return _ESTAGIOS_DRC()


@router.get("/causas")
def causas():
    return _CAUSAS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()