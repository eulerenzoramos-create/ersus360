"""
Parâmetros e Indicadores do Ministério da Saúde para APS
Apuí/AM — IBGE 1300144

Fontes:
- Portaria GM/MS nº 2.979/2019 — Previne Brasil
- Portaria GM/MS nº 825/2023 — atualização indicadores Previne Brasil
- Nota Técnica DESF/SAPS/MS nº 7/2020 — parâmetros de produção APS
- Portaria GM/MS nº 2.436/2017 — PNAB (Política Nacional de APS)
- Portaria GM/MS nº 3.124/2012 — parâmetros cobertura UBS
- Nota Técnica CGIAE/SVS — cobertura vacinal
- Portaria SAS/MS nº 1.341/2012 — PMAQ-AB (indicadores odontológicos)
- Resolução CFO nº 63/2005 — parâmetros produção odontológica
- Portaria GM/MS nº 3.088/2011 — RAPS / eMulti
- SISPACTO 2024 — metas pactuadas por porte municipal
- SIAPS (e-Gestor APS) — sistema oficial de monitoramento dos indicadores Previne Brasil
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from typing import Optional
from random import Random
import hashlib

router = APIRouter(prefix="/api/parametros-ms", tags=["parametros-ms"])

# ── Dados do município ────────────────────────────────────────────────────────
MUNICIPIO = {
    "nome": "Apuí",
    "uf": "AM",
    "ibge": "1300144",
    "porte": 1,        # Pequeno Porte I (< 20.000 hab)
    "populacao": 24_800,  # estimativa IBGE 2024
    "populacao_rural_pct": 0.42,  # 42% zona rural/ribeirinha (fator Amazônia)
    "idhm": 0.594,     # IDHM 2010 (baixo)
    "regiao": "Amazônia Legal",
}

# ── PREVINE BRASIL — Portaria GM/MS 2.979/2019 + 825/2023 ────────────────────
# 8 indicadores com metas nacionais (ciclo 2024-2025)
PREVINE_BRASIL = [
    {
        "codigo": "PB01",
        "indicador": "Pré-natal — 6ª consulta até a 20ª semana",
        "portaria": "GM/MS 2.979/2019 art. 5º I",
        "meta_nacional": 60.0,
        "meta_apui": 50.0,  # ajuste porte I + Amazônia: equipes fluviais 21,8% vs urbanas 49,1% (Ciência & Saúde Coletiva 2021)
        "unidade": "%",
        "numerador": "Gestantes com ≥6 consultas pré-natal, sendo a 1ª até a 20ª semana",
        "denominador": "Total de nascidos vivos de mães residentes",
        "fonte": "SIAPS / SIAPS / e-Gestor APS",
        "periodicidade": "quadrimestral",
        "grupo": "Saúde da Mulher",
        "alerta_critico": 30.0,
        "alerta_atencao": 45.0,
        "descricao_gestor": "Identifica precocidade e regularidade do pré-natal. Meta abaixo de 30% = risco de mortalidade materna.",
        "acoes_melhoria": [
            "Busca ativa de gestantes não cadastradas via ACS",
            "Agendamento imediato na 1ª consulta identificada",
            "Monitoramento semanal pelo enfermeiro de equipe",
            "Uso do e-SUS para alertas de faltosas",
        ],
    },
    {
        "codigo": "PB02",
        "indicador": "Gestantes com atendimento odontológico realizado",
        "portaria": "GM/MS 2.979/2019 art. 5º II",
        "meta_nacional": 60.0,
        "meta_apui": 50.0,
        "unidade": "%",
        "numerador": "Gestantes com ≥1 atendimento odontológico no período de gestação",
        "denominador": "Total de nascidos vivos de mães residentes",
        "fonte": "SIAPS / SIAPS / e-Gestor APS",
        "periodicidade": "quadrimestral",
        "grupo": "Saúde Bucal",
        "alerta_critico": 20.0,
        "alerta_atencao": 35.0,
        "descricao_gestor": "Saúde bucal na gestação reduz prematuridade e baixo peso ao nascer.",
        "acoes_melhoria": [
            "Agendamento automático odonto na 1ª consulta pré-natal",
            "Articulação ESF ↔ ESB para lista conjunta de gestantes",
            "Atividades educativas na UBS sobre saúde bucal gestacional",
        ],
    },
    {
        "codigo": "PB03",
        "indicador": "Cobertura do exame citopatológico (Papanicolau)",
        "portaria": "GM/MS 2.979/2019 art. 5º III",
        "meta_nacional": 40.0,
        "meta_apui": 35.0,
        "unidade": "%",
        "numerador": "Mulheres de 25–64 anos com citopatológico coletado nos últimos 3 anos",
        "denominador": "Total de mulheres de 25–64 anos residentes",
        "fonte": "SIAPS / SISCOLO",
        "periodicidade": "quadrimestral",
        "grupo": "Saúde da Mulher",
        "alerta_critico": 15.0,
        "alerta_atencao": 25.0,
        "descricao_gestor": "Rastreio do câncer do colo do útero — 2ª neoplasia mais frequente em mulheres amazônicas.",
        "acoes_melhoria": [
            "Mutirão de coleta nas UBS — 1 dia/mês por equipe ESF",
            "Busca ativa via ACS com lista de mulheres pendentes",
            "Capacitação de enfermeiras para coleta autônoma",
            "Integração com SISCOLO para feedback de laudos",
        ],
    },
    {
        "codigo": "PB04",
        "indicador": "Cobertura vacinal — Polio e Pentavalente (≤1 ano)",
        "portaria": "GM/MS 2.979/2019 art. 5º IV",
        "meta_nacional": 95.0,
        "meta_apui": 90.0,  # meta regional Amazônia (logística difícil)
        "unidade": "%",
        "numerador": "Crianças <1 ano com esquema vacinal completo (polio + pentavalente)",
        "denominador": "Total de crianças nascidas vivas no período",
        "fonte": "SIPNI / SIAPS / e-Gestor APS",
        "periodicidade": "quadrimestral",
        "grupo": "Saúde da Criança",
        "alerta_critico": 70.0,
        "alerta_atencao": 80.0,
        "descricao_gestor": "Cobertura < 80% = risco real de surtos de poliomielite e difteria na Amazônia.",
        "acoes_melhoria": [
            "Sala de vacinas com horário estendido (sábados)",
            "Vacinação extramuros para comunidades ribeirinhas e rurais",
            "Bloqueio imediato de faltosas via ACS",
            "Cadeia de frio monitorada (alarme de temperatura)",
        ],
    },
    {
        "codigo": "PB05",
        "indicador": "Hipertensos com pressão arterial aferida (última consulta)",
        "portaria": "GM/MS 2.979/2019 art. 5º V",
        "meta_nacional": 50.0,
        "meta_apui": 50.0,
        "unidade": "%",
        "numerador": "Pessoas hipertensas com PA registrada em consulta no semestre",
        "denominador": "Total de hipertensos cadastrados no SIAPS",
        "fonte": "SIAPS / SIAPS / e-Gestor APS",
        "periodicidade": "quadrimestral",
        "grupo": "DCNT — HAS/DM",
        "alerta_critico": 20.0,
        "alerta_atencao": 35.0,
        "descricao_gestor": "Controle da HAS evita AVC, IAM e doença renal — principais causas de morte em Apuí.",
        "acoes_melhoria": [
            "Consulta de enfermagem com medição de PA (protocolo HiperDia)",
            "Grupo HiperDia mensal em cada UBS",
            "Visita domiciliar para hipertensos faltosos > 3 meses",
            "Ação na comunidade: tendas de aferição de PA",
        ],
    },
    {
        "codigo": "PB06",
        "indicador": "Diabéticos com solicitação de hemoglobina glicada",
        "portaria": "GM/MS 2.979/2019 art. 5º VI",
        "meta_nacional": 50.0,
        "meta_apui": 45.0,
        "unidade": "%",
        "numerador": "Pessoas diabéticas com HbA1c solicitada ou registrada no período",
        "denominador": "Total de diabéticos cadastrados no SIAPS",
        "fonte": "SIAPS / RNDS",
        "periodicidade": "quadrimestral",
        "grupo": "DCNT — HAS/DM",
        "alerta_critico": 15.0,
        "alerta_atencao": 30.0,
        "descricao_gestor": "Hemoglobina glicada é padrão ouro para controle do DM2. ATENÇÃO: equipes fluviais da Amazônia atingem apenas 3,5% (vs 12,8% urbanas) — Apuí precisa de laboratório local e estratégia para zona rural.",
        "acoes_melhoria": [
            "Solicitar HbA1c em toda consulta de DM (protocolo médico/enf.)",
            "Laboratório municipal com análise de HbA1c disponível",
            "Monitoramento mensal de diabéticos sem exame > 6 meses",
            "Grupo de educação em saúde — DM: alimentação e atividade física",
        ],
    },
    {
        "codigo": "PB07",
        "indicador": "Gestantes com sífilis tratada",
        "portaria": "GM/MS 2.979/2019 art. 5º VII + Nota SVS/MS 2022",
        "meta_nacional": 60.0,
        "meta_apui": 60.0,
        "unidade": "%",
        "numerador": "Gestantes com diagnóstico de sífilis que concluíram tratamento adequado",
        "denominador": "Gestantes com sífilis notificadas no SINAN",
        "fonte": "SINAN / SIAPS",
        "periodicidade": "quadrimestral",
        "grupo": "IST / HIV",
        "alerta_critico": 30.0,
        "alerta_atencao": 45.0,
        "descricao_gestor": "Sífilis congênita é EVITÁVEL — tratamento inadequado na gestação causa morte fetal e neonatal.",
        "acoes_melhoria": [
            "Teste rápido sífilis + HIV na 1ª consulta pré-natal e 3º trimestre",
            "Tratamento imediato com penicilina G benzatina (protocolo MS)",
            "Tratamento do parceiro como condição para cierre do caso",
            "Notificação compulsória e busca ativa pelo SINAN",
        ],
    },
    {
        "codigo": "PB08",
        "indicador": "Pessoas idosas com avaliação multidimensional",
        "portaria": "GM/MS 825/2023 — novo indicador",
        "meta_nacional": 50.0,
        "meta_apui": 45.0,
        "unidade": "%",
        "numerador": "Pessoas ≥60 anos com avaliação multidimensional rápida registrada",
        "denominador": "Total de pessoas ≥60 anos cadastradas no SIAPS",
        "fonte": "SIAPS / SIAPS / e-Gestor APS",
        "periodicidade": "quadrimestral",
        "grupo": "Saúde do Idoso",
        "alerta_critico": 15.0,
        "alerta_atencao": 30.0,
        "descricao_gestor": "Avaliação multidimensional identifica fragilidade, risco de quedas e polifarmácia no idoso.",
        "acoes_melhoria": [
            "Protocolo de avaliação multidimensional na consulta de enfermagem",
            "Visita domiciliar prioritária para idosos ≥75 anos",
            "Caderneta da Pessoa Idosa atualizada em cada consulta",
            "Grupo de atividade física para idosos (eMulti + APS)",
        ],
    },
]

# ── PARÂMETROS DE PRODUÇÃO POR CBO ────────────────────────────────────────────
# Nota Técnica DESF/SAPS/MS nº 7/2020 + Portaria 2.436/2017 Anexo III
PARAMETROS_CBO = {
    "Médico de Família e Comunidade": {
        "portaria": "Portaria GM/MS 2.436/2017 + NT DESF 7/2020",
        "jornada_horas": 40,  # CH semanal ESF
        "producao_dia": {
            "consulta_medica":        {"meta": 20, "min": 15, "label": "Consultas individuais/dia"},
            "visita_domiciliar":      {"meta": 4,  "min": 2,  "label": "Visitas domiciliares/dia"},
            "procedimento_medico":    {"meta": 6,  "min": 3,  "label": "Procedimentos médicos/dia"},
            "atendimento_urgencia":   {"meta": 3,  "min": 1,  "label": "Urgências APS/dia"},
            "atividade_coletiva":     {"meta": 1,  "min": 0,  "label": "Atividades coletivas/semana"},
        },
        "meta_mensal": {
            "consultas_total":    400,  # 20/dia × 20 dias úteis
            "visitas_domiciliar": 80,
            "procedimentos":      120,
        },
        "tempo_medio_consulta_min": 15,
        "observacao": "40% da agenda reservada para demanda espontânea (PNAB 2017)",
    },
    "Enfermeiro": {
        "portaria": "Portaria GM/MS 2.436/2017 + NT DESF 7/2020",
        "jornada_horas": 40,
        "producao_dia": {
            "consulta_enfermagem":    {"meta": 15, "min": 10, "label": "Consultas enfermagem/dia"},
            "procedimento_enfermagem":{"meta": 10, "min": 6,  "label": "Procedimentos/dia"},
            "visita_domiciliar":      {"meta": 3,  "min": 1,  "label": "Visitas domiciliares/dia"},
            "coleta_citopatologico":  {"meta": 5,  "min": 2,  "label": "Citopatológicos/semana"},
            "atividade_coletiva":     {"meta": 2,  "min": 1,  "label": "Atividades educativas/semana"},
            "supervisao_acs":         {"meta": 1,  "min": 1,  "label": "Reunião de equipe/semana"},
        },
        "meta_mensal": {
            "consultas_total":    300,
            "procedimentos":      200,
            "citopatologicos":    20,
        },
        "tempo_medio_consulta_min": 20,
        "observacao": "Pode realizar consulta de pré-natal, HiperDia, puericultura por protocolos municipais",
    },
    "Técnico de Enfermagem": {
        "portaria": "NT DESF/SAPS 7/2020",
        "jornada_horas": 40,
        "producao_dia": {
            "aferição_pa":          {"meta": 30, "min": 15, "label": "Aferições PA/dia"},
            "curativo":             {"meta": 15, "min": 8,  "label": "Curativos/dia"},
            "aplicacao_vacina":     {"meta": 20, "min": 10, "label": "Vacinas/dia"},
            "coleta_material":      {"meta": 10, "min": 5,  "label": "Coletas laboratoriais/dia"},
            "administracao_med":    {"meta": 20, "min": 10, "label": "Administração medicamentos/dia"},
            "nebulizacao":          {"meta": 10, "min": 5,  "label": "Nebulizações/dia"},
        },
        "meta_mensal": {
            "procedimentos_total": 800,
        },
        "tempo_medio_consulta_min": 10,
        "observacao": "Atua sob supervisão de enfermeiro; pode realizar triagem com protocolo aprovado",
    },
    "Agente Comunitário de Saúde": {
        "portaria": "Lei 11.350/2006 + Portaria 2.436/2017",
        "jornada_horas": 40,
        "producao_dia": {
            "visita_domiciliar":   {"meta": 6, "min": 4, "label": "Visitas domiciliares/dia"},
            "busca_ativa":         {"meta": 3, "min": 1, "label": "Buscas ativas/dia"},
        },
        "meta_mensal": {
            "visitas_domiciliar":  120,  # 6/dia × 20 dias úteis
            "familias_acompanhadas": 150,  # 750 / 5 ACS = 150 cada (PNAB)
            "cobertura_familias_pct": 100,  # meta: visitar 100% das famílias/mês
        },
        "microarea_max_familias": 150,
        "populacao_esf_parametro": 2000,  # Portaria GM/MS 3.493/2024 — parâmetro para cofinanciamento federal
        "observacao": "Portaria GM/MS 3.493/2024: 2.000 pessoas vinculadas por eSF (municípios ≤20k hab). Máximo 750 famílias/equipe (PNAB 2017 art. 41); cada ACS cobre ~150 famílias",
    },
    "Cirurgião-Dentista": {
        "portaria": "Resolução CFO 63/2005 + Portaria SAS 1.341/2012 (PMAQ-AB)",
        "jornada_horas": 40,
        "producao_dia": {
            "primeira_consulta_odo":  {"meta": 4,  "min": 2,  "label": "Primeiras consultas odonto/dia"},
            "procedimento_basico":    {"meta": 8,  "min": 5,  "label": "Procedimentos básicos/dia"},
            "exodontia":              {"meta": 2,  "min": 1,  "label": "Exodontias/dia"},
            "urgencia_odontologica":  {"meta": 2,  "min": 1,  "label": "Urgências odonto/dia"},
            "escovacao_supervisionada":{"meta": 10, "min": 5,  "label": "Escovações supervisionadas/dia"},
            "restauracao":            {"meta": 6,  "min": 3,  "label": "Restaurações/dia"},
            "aplicacao_fluor":        {"meta": 10, "min": 5,  "label": "Aplicações flúor/dia"},
        },
        "meta_mensal": {
            "procedimentos_total":    320,  # 16/dia × 20 dias
            "primeiras_consultas":    80,
            "tratamentos_concluidos": 36,  # 45% dos iniciados (PMAQ meta)
        },
        "indicador_eficiencia": {
            "exodontia_pct_max": 30.0,  # máx 30% dos proc. = exodontia (PMAQ)
            "tratamentos_concluidos_pct_min": 45.0,  # mín 45% iniciados concluídos
            "primeira_consulta_pct_min": 15.0,  # mín 15% pop/ano = 1ª consulta
        },
        "observacao": "ESB Tipo I: 1 dentista + 1 ASB. ESB Tipo II: 1 dentista + 1 ASB + 1 TSB (maior resolutividade)",
    },
    "Auxiliar em Saúde Bucal": {
        "portaria": "NT DESF 7/2020 + Resolução CFO 63/2005",
        "jornada_horas": 40,
        "producao_dia": {
            "preparo_consultorio":  {"meta": 16, "min": 10, "label": "Consultorios preparados/dia"},
            "revelacao_radiografia":{"meta": 5,  "min": 2,  "label": "Radiografias reveladas/dia"},
            "isolamento":           {"meta": 8,  "min": 4,  "label": "Isolamentos realizados/dia"},
            "escovacao_supervisionada":{"meta": 15,"min":8,  "label": "Escovações supervisionadas/dia"},
        },
        "meta_mensal": {"procedimentos_apoio": 320},
        "observacao": "Atua sob supervisão direta do dentista; executa atividades de suporte clínico",
    },
    "Técnico em Saúde Bucal": {
        "portaria": "NT DESF 7/2020 + Resolução CFO 63/2005",
        "jornada_horas": 40,
        "producao_dia": {
            "procedimento_preventivo": {"meta": 10, "min": 6, "label": "Procedimentos preventivos/dia"},
            "selante":                 {"meta": 8,  "min": 4, "label": "Selantes/dia"},
            "aplicacao_fluor":         {"meta": 12, "min": 6, "label": "Aplicações de flúor/dia"},
            "moldagem":                {"meta": 5,  "min": 2, "label": "Moldagens/dia"},
        },
        "meta_mensal": {"procedimentos_total": 200},
        "observacao": "TSB pode realizar procedimentos preventivos, moldagens e polimento (maior autonomia que ASB)",
    },
    "Fisioterapeuta": {
        "portaria": "Portaria GM/MS 3.088/2011 + NT eMulti 2022",
        "jornada_horas": 40,
        "producao_dia": {
            "atendimento_individual": {"meta": 10, "min": 6, "label": "Atendimentos individuais/dia"},
            "atendimento_grupo":      {"meta": 2,  "min": 1, "label": "Grupos (20 pax)/dia"},
            "visita_domiciliar":      {"meta": 2,  "min": 1, "label": "Visitas domiciliares/dia"},
            "interconsulta":          {"meta": 3,  "min": 1, "label": "Interconsultas/dia"},
        },
        "meta_mensal": {"atendimentos_total": 200, "grupos": 40},
        "observacao": "Referência para reabilitação física; apoio matricial às ESF para prevenção de quedas e LER/DORT",
    },
    "Nutricionista": {
        "portaria": "Portaria GM/MS 3.088/2011 + NT eMulti 2022",
        "jornada_horas": 40,
        "producao_dia": {
            "consulta_nutricional":   {"meta": 12, "min": 8,  "label": "Consultas nutricionais/dia"},
            "atendimento_grupo":      {"meta": 2,  "min": 1,  "label": "Grupos educativos/dia"},
            "visita_domiciliar":      {"meta": 2,  "min": 1,  "label": "Visitas domiciliares/dia"},
            "avaliacao_antropometrica":{"meta":10, "min": 5,  "label": "Avaliações SISVAN/dia"},
        },
        "meta_mensal": {"consultas_total": 240, "sisvan_registros": 200},
        "observacao": "Prioridade: desnutrição infantil, obesidade, gestantes e DM/HAS; apoio ao SISVAN",
    },
    "Psicólogo": {
        "portaria": "Portaria GM/MS 3.088/2011 + NT eMulti 2022 + CFP Resolução 04/2020",
        "jornada_horas": 40,
        "producao_dia": {
            "atendimento_individual": {"meta": 8, "min": 5,  "label": "Atendimentos individuais/dia"},
            "atendimento_grupo":      {"meta": 2, "min": 1,  "label": "Grupos terapêuticos/dia"},
            "interconsulta":          {"meta": 3, "min": 1,  "label": "Interconsultas ESF/dia"},
            "visita_domiciliar":      {"meta": 2, "min": 1,  "label": "Visitas domiciliares/dia"},
        },
        "meta_mensal": {"atendimentos_total": 160, "grupos": 40},
        "observacao": "Foco em saúde mental na APS: depressão, ansiedade, uso de álcool/drogas; integração com CAPS",
    },
    "Assistente Social": {
        "portaria": "Portaria GM/MS 3.088/2011 + NT eMulti 2022",
        "jornada_horas": 40,
        "producao_dia": {
            "atendimento_individual": {"meta": 10, "min": 6, "label": "Atendimentos individuais/dia"},
            "visita_domiciliar":      {"meta": 3,  "min": 2, "label": "Visitas domiciliares/dia"},
            "articulacao_rede":       {"meta": 3,  "min": 1, "label": "Articulações de rede/dia"},
            "grupo_comunitario":      {"meta": 1,  "min": 0, "label": "Grupos comunitários/semana"},
        },
        "meta_mensal": {"atendimentos_total": 200},
        "observacao": "Articulação com CRAS, CREAS, proteção social; benefícios BPC, Bolsa Família, LOAS",
    },
    "Farmacêutico": {
        "portaria": "Portaria GM/MS 3.088/2011 + Portaria 3.916/1998 (PNAF)",
        "jornada_horas": 40,
        "producao_dia": {
            "dispensacao_medicamento": {"meta": 30, "min": 15, "label": "Dispensações/dia"},
            "orientacao_farmaceutica": {"meta": 15, "min": 8,  "label": "Orientações farmacêuticas/dia"},
            "conciliacao_medicamentosa":{"meta": 5,  "min": 2,  "label": "Conciliações medicamentosas/dia"},
            "farmacovigilancia":       {"meta": 2,  "min": 0,  "label": "Notificações farmacovigilância/mês"},
        },
        "meta_mensal": {"dispensacoes_total": 600, "orientacoes": 300},
        "observacao": "Gestão da CAF; prescrição farmacêutica para condições simples (Lei 13.021/2014); conciliação em polimedicados. eMulti Estratégica (1-4 eSF): CH mínima 100h/equipe, max 40h/profissional — financiamento R$12.000/mês + bônus R$3.000 (Portaria MS 2024)",
    },
    "Educador Físico": {
        "portaria": "Portaria GM/MS 3.088/2011 + Portaria 2.681/2013 (PNPS)",
        "jornada_horas": 40,
        "producao_dia": {
            "grupo_atividade_fisica":  {"meta": 3,  "min": 2,  "label": "Grupos atividade física/dia"},
            "atendimento_individual":  {"meta": 5,  "min": 3,  "label": "Atendimentos individuais/dia"},
            "avaliacao_fisica":        {"meta": 5,  "min": 3,  "label": "Avaliações físicas/dia"},
            "academia_saude":          {"meta": 2,  "min": 1,  "label": "Sessões Academia da Saúde/dia"},
        },
        "meta_mensal": {"participantes_grupos": 500, "avaliacoes": 100},
        "observacao": "Grupos de idosos, HAS/DM, gestantes; Academia da Saúde; Programa AFAS (AF e Saúde)",
    },
    "Fonoaudiólogo": {
        "portaria": "Portaria GM/MS 3.088/2011 + NT eMulti 2022",
        "jornada_horas": 40,
        "producao_dia": {
            "atendimento_individual":   {"meta": 10, "min": 6, "label": "Atendimentos individuais/dia"},
            "triagem_auditiva":         {"meta": 5,  "min": 2, "label": "Triagens auditivas/dia"},
            "grupo_linguagem":          {"meta": 2,  "min": 1, "label": "Grupos linguagem/comunicação/dia"},
            "interconsulta":            {"meta": 3,  "min": 1, "label": "Interconsultas ESF/dia"},
        },
        "meta_mensal": {"atendimentos_total": 200},
        "observacao": "Triagem neonatal auditiva; linguagem infantil; disfagia; saúde vocal (professores, ACS)",
    },
}

# ── INDICADORES PMAQ-AB — ODONTOLOGIA ────────────────────────────────────────
# Portaria SAS/MS 1.341/2012 + Instrumento de Avaliação PMAQ 2ª e 3ª ciclos
PMAQ_ODONTO = [
    {
        "codigo": "ODO01",
        "indicador": "Cobertura de 1ª consulta odontológica programática",
        "meta_pct": 15.0,   # 15% da pop coberta / ano
        "calculo": "1ªs consultas odonto / população da área × 100",
        "fonte": "SIAPS",
        "grupo": "Acesso",
        "alerta_critico": 5.0,
        "alerta_atencao": 10.0,
        "descricao_gestor": "Indica se a população está conseguindo acesso inicial à saúde bucal.",
    },
    {
        "codigo": "ODO02",
        "indicador": "Proporção de tratamentos concluídos",
        "meta_pct": 45.0,
        "calculo": "Tratamentos concluídos / tratamentos iniciados × 100",
        "fonte": "SIAPS",
        "grupo": "Resolutividade",
        "alerta_critico": 20.0,
        "alerta_atencao": 30.0,
        "descricao_gestor": "Baixo percentual = pacientes abandonando tratamento ou falta de agenda de retorno.",
    },
    {
        "codigo": "ODO03",
        "indicador": "Razão exodontias / procedimentos clínicos individuais",
        "meta_pct": 30.0,   # máximo 30% (quanto MENOR, melhor)
        "calculo": "Exodontias / total procedimentos clínicos individuais × 100",
        "fonte": "SIAPS",
        "grupo": "Qualidade",
        "alerta_critico": 50.0,
        "alerta_atencao": 40.0,
        "sentido": "menor_melhor",
        "descricao_gestor": "Alta razão de exodontia = prática mutiladora e baixa resolutividade. Meta: max 30%.",
    },
    {
        "codigo": "ODO04",
        "indicador": "Cobertura de escovação dental supervisionada",
        "meta_pct": 5.0,    # 5% da pop / ano
        "calculo": "Escovações supervisionadas / população da área × 100",
        "fonte": "SIAPS",
        "grupo": "Prevenção",
        "alerta_critico": 1.0,
        "alerta_atencao": 3.0,
        "descricao_gestor": "Atividade coletiva preventiva — escolas, UBS. Reduz cárie e doenças periodontais.",
    },
    {
        "codigo": "ODO05",
        "indicador": "Urgências odontológicas resolvidas na UBS",
        "meta_pct": 80.0,
        "calculo": "Urgências resolvidas na própria UBS / total urgências × 100",
        "fonte": "SIAPS",
        "grupo": "Acesso / Urgência",
        "alerta_critico": 40.0,
        "alerta_atencao": 60.0,
        "descricao_gestor": "Urgências não resolvidas na APS sobrecarregam CEO e pronto-socorro.",
    },
]

# ── METAS SISPACTO 2024 — APUÍ/AM ────────────────────────────────────────────
# Resolução CIT 08/2016 + Nota Técnica CONASS/CONASEMS 2024
# Metas quadrimestrais pactuadas para municípios Porte I, Amazônia Legal
SISPACTO_APUI = {
    "ciclo": "2024",
    "referencia": "Resolução CIT 08/2016 — Pactuação Interfederativa",
    "metas": [
        {"indicador": "Cobertura da Atenção Básica",       "meta": 80.0,  "unidade": "%", "atual_estimado": 68.0},
        {"indicador": "Cobertura ESF",                     "meta": 70.0,  "unidade": "%", "atual_estimado": 62.0},
        {"indicador": "Proporção partos normais (SUS)",    "meta": 60.0,  "unidade": "%", "atual_estimado": 48.0},
        {"indicador": "Mortalidade infantil",              "meta": 15.0,  "unidade": "‰ NV", "atual_estimado": 18.5, "sentido": "menor_melhor"},
        {"indicador": "Mortalidade materna",               "meta": 60.0,  "unidade": "/100mil NV", "atual_estimado": 85.0, "sentido": "menor_melhor"},
        {"indicador": "Cobertura vacinal DPT/polio",       "meta": 95.0,  "unidade": "%", "atual_estimado": 82.0},
        {"indicador": "Exame citopatológico (Papanicolau)","meta": 40.0,  "unidade": "%", "atual_estimado": 28.0},
        {"indicador": "Pré-natal ≥6 consultas",            "meta": 55.0,  "unidade": "%", "atual_estimado": 42.0},
        {"indicador": "Razão de exames preventivos",       "meta": 0.4,   "unidade": "razão", "atual_estimado": 0.28},
        {"indicador": "Hospitalizações por ICSAP",         "meta": 22.0,  "unidade": "%", "atual_estimado": 31.0, "sentido": "menor_melhor"},
        {"indicador": "Cobertura HIPERDIA",                "meta": 50.0,  "unidade": "%", "atual_estimado": 34.0},
        {"indicador": "Notificações SINAN atualizadas",    "meta": 90.0,  "unidade": "%", "atual_estimado": 71.0},
    ],
}

# ── COBERTURA VACINAL — Calendário Nacional de Vacinação 2024 ────────────────
COBERTURA_VACINAL = [
    {"vacina": "BCG",              "faixa": "Ao nascer",       "meta": 90.0, "grupo": "Neonatal"},
    {"vacina": "Hepatite B",       "faixa": "Ao nascer",       "meta": 90.0, "grupo": "Neonatal"},
    {"vacina": "Pentavalente",     "faixa": "2/4/6 meses",     "meta": 95.0, "grupo": "1º ano"},
    {"vacina": "VIP (Polio)",      "faixa": "2/4/6 meses",     "meta": 95.0, "grupo": "1º ano"},
    {"vacina": "Pneumo 10V",       "faixa": "2/4 meses + ref", "meta": 95.0, "grupo": "1º ano"},
    {"vacina": "Rotavírus",        "faixa": "2/4 meses",       "meta": 90.0, "grupo": "1º ano"},
    {"vacina": "Meningococo C",    "faixa": "3/5 meses + ref", "meta": 95.0, "grupo": "1º ano"},
    {"vacina": "VRH (Rotavírus)",  "faixa": "2/4 meses",       "meta": 90.0, "grupo": "1º ano"},
    {"vacina": "Tríplice Viral",   "faixa": "12 meses",        "meta": 95.0, "grupo": "2º ano"},
    {"vacina": "Hepatite A",       "faixa": "15 meses",        "meta": 90.0, "grupo": "2º ano"},
    {"vacina": "VOP (Polio oral)", "faixa": "15 meses + 4 anos","meta": 95.0, "grupo": "Reforços"},
    {"vacina": "dT adulto",        "faixa": "≥20 anos (3 doses)","meta": 90.0,"grupo": "Adultos"},
    {"vacina": "Influenza",        "faixa": "Grupos de risco",  "meta": 90.0, "grupo": "Campanhas"},
    {"vacina": "HPV quadrivalente","faixa": "9–14 anos M/H",   "meta": 80.0, "grupo": "Adolescentes"},
    {"vacina": "Febre Amarela",    "faixa": "9 meses (dose única)","meta": 95.0,"grupo": "Amazônia"},
]

# ── HELPER SEED ───────────────────────────────────────────────────────────────
def _seed(key: str) -> int:
    return int(hashlib.md5(key.encode()).hexdigest(), 16) % 100_000

def _simular_valor(codigo: str, meta: float, ano: int, mes: int) -> float:
    """Valor simulado realístico com tendência de melhoria ao longo do ano."""
    r = Random(_seed(f"{codigo}{ano}{mes}"))
    variacao = r.uniform(-0.15, 0.25) * meta
    valor = meta * 0.65 + variacao + (mes / 12) * meta * 0.08
    return round(max(0, min(valor, 100)), 1)

def _status(valor: float, meta: float, critico: float, atencao: float, menor_melhor=False) -> str:
    if menor_melhor:
        if valor <= meta: return "normal"
        if valor <= atencao: return "atencao"
        return "critico"
    else:
        if valor >= meta: return "normal"
        if valor >= atencao: return "atencao"
        return "critico"


# ── ENDPOINTS ─────────────────────────────────────────────────────────────────

@router.get("/municipio")
async def get_municipio():
    """Dados do município e contexto para ajuste de metas."""
    return MUNICIPIO


@router.get("/previne-brasil")
async def get_previne_brasil(mes: int = Query(default=None), ano: int = Query(default=None)):
    """8 indicadores Previne Brasil com metas, situação atual simulada e ações de melhoria."""
    hoje = date.today()
    if not mes: mes = hoje.month
    if not ano: ano = hoje.year

    resultado = []
    n_critico = 0
    n_atencao = 0
    n_normal  = 0

    for ind in PREVINE_BRASIL:
        valor = _simular_valor(ind["codigo"], ind["meta_apui"], ano, mes)
        st = _status(valor, ind["meta_apui"], ind["alerta_critico"], ind["alerta_atencao"])
        if st == "critico": n_critico += 1
        elif st == "atencao": n_atencao += 1
        else: n_normal += 1

        gap = round(ind["meta_apui"] - valor, 1)
        resultado.append({
            **ind,
            "valor_atual": valor,
            "gap_meta": gap,
            "status": st,
            "atingiu_meta": valor >= ind["meta_apui"],
            "pct_meta": round(valor / ind["meta_apui"] * 100, 1),
        })

    return {
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "periodo": f"{mes:02d}/{ano}",
        "referencia": "Portaria GM/MS 2.979/2019 + 825/2023",
        "resumo": {
            "total": len(resultado),
            "normal": n_normal,
            "atencao": n_atencao,
            "critico": n_critico,
            "score_pct": round(n_normal / len(resultado) * 100, 0),
        },
        "indicadores": resultado,
    }


@router.get("/parametros-cbo")
async def get_parametros_cbo(cbo: Optional[str] = Query(default=None)):
    """Parâmetros de produção por CBO conforme Portarias MS e NT DESF 7/2020."""
    if cbo:
        if cbo in PARAMETROS_CBO:
            return {"cbo": cbo, **PARAMETROS_CBO[cbo]}
        return {"erro": f"CBO '{cbo}' não encontrado", "cbos_disponiveis": list(PARAMETROS_CBO.keys())}
    return {
        "referencia": "NT DESF/SAPS/MS nº 7/2020 + Portaria GM/MS 2.436/2017",
        "municipio": "Apuí/AM",
        "cbos": [{"cbo": k, **v} for k, v in PARAMETROS_CBO.items()],
    }


@router.get("/pmaq-odonto")
async def get_pmaq_odonto(mes: int = Query(default=None), ano: int = Query(default=None)):
    """5 indicadores PMAQ-AB odontológicos com situação simulada para Apuí."""
    hoje = date.today()
    if not mes: mes = hoje.month
    if not ano: ano = hoje.year

    resultado = []
    for ind in PMAQ_ODONTO:
        menor_melhor = ind.get("sentido") == "menor_melhor"
        valor = _simular_valor(ind["codigo"], ind["meta_pct"], ano, mes)
        if menor_melhor:
            valor = round(max(0, min(100, ind["meta_pct"] * 1.5 - valor * 0.3)), 1)
        st = _status(valor, ind["meta_pct"], ind["alerta_critico"], ind["alerta_atencao"], menor_melhor)
        resultado.append({
            **ind,
            "valor_atual": valor,
            "status": st,
            "pct_meta": round(valor / ind["meta_pct"] * 100, 1),
        })

    return {
        "municipio": "Apuí/AM",
        "periodo": f"{mes:02d}/{ano}",
        "referencia": "Portaria SAS/MS 1.341/2012 — PMAQ-AB",
        "indicadores": resultado,
    }


@router.get("/sispacto")
async def get_sispacto():
    """Metas SISPACTO 2024 pactuadas para Apuí/AM — porte municipal I, Amazônia Legal."""
    resultado = []
    for m in SISPACTO_APUI["metas"]:
        menor = m.get("sentido") == "menor_melhor"
        atual = m["atual_estimado"]
        meta  = m["meta"]
        if menor:
            st = "normal" if atual <= meta else ("atencao" if atual <= meta * 1.3 else "critico")
            pct = round(meta / atual * 100, 1) if atual > 0 else 0
        else:
            st = "normal" if atual >= meta else ("atencao" if atual >= meta * 0.7 else "critico")
            pct = round(atual / meta * 100, 1)
        resultado.append({**m, "status": st, "pct_meta": pct})

    n_crit = sum(1 for r in resultado if r["status"] == "critico")
    n_ok   = sum(1 for r in resultado if r["status"] == "normal")

    return {
        **SISPACTO_APUI,
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "porte": "Pequeno Porte I (< 20.000 hab) — Amazônia Legal",
        "resumo": {"total": len(resultado), "normal": n_ok, "critico": n_crit},
        "metas": resultado,
    }


@router.get("/cobertura-vacinal")
async def get_cobertura_vacinal(mes: int = Query(default=None), ano: int = Query(default=None)):
    """Cobertura vacinal por vacina — Calendário Nacional 2024."""
    hoje = date.today()
    if not mes: mes = hoje.month
    if not ano: ano = hoje.year

    resultado = []
    for v in COBERTURA_VACINAL:
        valor = _simular_valor(v["vacina"][:6], v["meta"], ano, mes)
        st = "normal" if valor >= v["meta"] else ("atencao" if valor >= v["meta"] * 0.8 else "critico")
        resultado.append({**v, "cobertura_atual": valor, "status": st})

    return {
        "municipio": "Apuí/AM",
        "periodo": f"{mes:02d}/{ano}",
        "referencia": "Calendário Nacional de Vacinação 2024 — MS/CGPNI",
        "vacinas": resultado,
        "resumo": {
            "total": len(resultado),
            "adequadas": sum(1 for r in resultado if r["status"] == "normal"),
            "criticas": sum(1 for r in resultado if r["status"] == "critico"),
        },
    }


@router.get("/painel-gestor")
async def get_painel_gestor(mes: int = Query(default=None), ano: int = Query(default=None)):
    """Painel consolidado para o gestor: todos os indicadores + alertas + prioridades."""
    hoje = date.today()
    if not mes: mes = hoje.month
    if not ano: ano = hoje.year

    pb   = await get_previne_brasil(mes=mes, ano=ano)
    pmaq = await get_pmaq_odonto(mes=mes, ano=ano)
    sisp = await get_sispacto()
    vac  = await get_cobertura_vacinal(mes=mes, ano=ano)

    # Prioridades críticas
    criticos = []
    for ind in pb["indicadores"]:
        if ind["status"] == "critico":
            criticos.append({
                "modulo": "Previne Brasil",
                "indicador": ind["indicador"],
                "valor": ind["valor_atual"],
                "meta": ind["meta_apui"],
                "gap": ind["gap_meta"],
                "acoes": ind["acoes_melhoria"][:2],
            })
    for ind in pmaq["indicadores"]:
        if ind["status"] == "critico":
            criticos.append({
                "modulo": "PMAQ-AB Odonto",
                "indicador": ind["indicador"],
                "valor": ind["valor_atual"],
                "meta": ind["meta_pct"],
                "gap": round(ind["meta_pct"] - ind["valor_atual"], 1),
                "acoes": [],
            })

    criticos.sort(key=lambda x: -abs(x["gap"]))

    score_geral = round(
        (pb["resumo"]["normal"] / pb["resumo"]["total"] * 0.5 +
         pmaq["resumo"]["indicadores"] and sum(1 for i in pmaq["indicadores"] if i["status"] == "normal") / len(pmaq["indicadores"]) * 0.3 or 0.3 +
         vac["resumo"]["adequadas"] / vac["resumo"]["total"] * 0.2) * 100, 0
    ) if True else 0

    return {
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "periodo": f"{mes:02d}/{ano}",
        "gerado_em": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "score_geral": score_geral,
        "resumo": {
            "previne_brasil": pb["resumo"],
            "pmaq_odonto":    {"total": len(pmaq["indicadores"]), "normal": sum(1 for i in pmaq["indicadores"] if i["status"] == "normal"), "critico": sum(1 for i in pmaq["indicadores"] if i["status"] == "critico")},
            "sispacto":       sisp["resumo"],
            "cobertura_vacinal": vac["resumo"],
        },
        "alertas_criticos": criticos,
        "previne_brasil":   pb["indicadores"],
        "pmaq_odonto":      pmaq["indicadores"],
        "sispacto":         sisp["metas"],
        "cobertura_vacinal": vac["vacinas"],
        "parametros_cbo":   {cbo: {"portaria": v["portaria"], "meta_mensal": v.get("meta_mensal", {}), "producao_dia": v["producao_dia"]} for cbo, v in PARAMETROS_CBO.items()},
    }
