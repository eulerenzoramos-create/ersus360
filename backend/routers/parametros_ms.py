"""
Parâmetros e Indicadores do Ministério da Saúde para APS
Apuí/AM — IBGE 1300144

Fontes:
- Portaria GM/MS nº 3.493/2024 — Novo modelo de cofinanciamento federal da APS
  (substitui e extingue o Novo Financiamento APS — Portaria GM/MS 2.979/2019)
- Portaria GM/MS nº 7.799/2025 — atualização componente qualidade e vínculo
- Nota Técnica DEAPS/SAPS/MS nº 6/2025 — metodologia cálculo vínculo e qualidade
- Nota Técnica DESF/SAPS/MS nº 30/2025 — metodologia cofinanciamento eSF/eAP
- Nota Técnica DESF/SAPS/MS nº 7/2020 — parâmetros de produção APS
- Portaria GM/MS nº 2.436/2017 — PNAB (Política Nacional de APS)
- Portaria GM/MS nº 3.493/2024 art. 8º — parâmetro 2.000 pessoas/eSF (Porte I)
- Portaria SAS/MS nº 1.341/2012 — PMAQ-AB (parâmetros odontológicos CBO)
- Resolução CFO nº 63/2005 — parâmetros produção odontológica
- SISPACTO 2024 — metas pactuadas por porte municipal
- SIAPS (e-Gestor APS) — sistema oficial de monitoramento dos 15 indicadores
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

# ── COMPONENTE QUALIDADE — NOVO FINANCIAMENTO APS ─────────────────────────────
# Portaria GM/MS nº 3.493/2024 + Portaria GM/MS nº 7.799/2025
# NT DEAPS/SAPS/MS nº 6/2025
# O PREVINE BRASIL (Portaria 2.979/2019) FOI EXTINTO e substituído por este modelo.
# 15 indicadores em 3 grupos: C (eSF/eAP), B (eSB), M (eMulti)
# Classificação por conceito: Regular | Suficiente | Bom | Ótimo
# Efeitos financeiros: a partir da parcela 05/2025 (maio 2025)

# Faixas do Componente Qualidade:
#   Ótimo     > 7,5   (bônus integral)
#   Bom       5,0–7,5
#   Suficiente 2,6–4,9
#   Regular   ≤ 2,5   (sem bônus)

INDICADORES_QUALIDADE = {
    "extincao_previne_brasil": {
        "status": "EXTINTO",
        "portaria_extincao": "Portaria GM/MS nº 3.493, de 10 de abril de 2024",
        "substituido_por": "Componente Qualidade — Portaria 3.493/2024 + Portaria 7.799/2025",
        "observacao": (
            "O Novo Financiamento APS (Portaria GM/MS 2.979/2019) foi formalmente extinto com a "
            "publicação da Portaria GM/MS 3.493/2024, que instituiu o novo modelo de "
            "cofinanciamento federal da APS. Os 8 indicadores do Novo Financiamento APS foram "
            "substituídos por 15 novos indicadores organizados em 3 grupos: C (eSF/eAP), "
            "B (eSB) e M (eMulti). Efeitos financeiros a partir de maio/2025 (parcela 05/2025)."
        ),
    },
    "grupo_C": {
        "sigla": "C",
        "descricao": "Indicadores do Componente Qualidade — eSF e eAP",
        "total_indicadores": 7,
        "equipes": ["eSF", "eAP"],
        "portaria": "Portaria GM/MS 3.493/2024 + Portaria 7.799/2025",
        "nota_tecnica": "NT DEAPS/SAPS/MS nº 6/2025",
        "indicadores": [
            {
                "codigo": "C1",
                "nome": "Mais Acesso à Atenção Primária à Saúde",
                "grupo": "Acesso",
                "numerador": "Número de atendimentos individuais realizados por médico ou enfermeiro da eSF/eAP",
                "denominador": "Número de pessoas vinculadas à equipe no período",
                "unidade": "média de atend./pessoa",
                "classificacao": {
                    "otimo":      "> 3,0 atend/pessoa/ano",
                    "bom":        "2,0 a 3,0",
                    "suficiente": "1,0 a 1,9",
                    "regular":    "< 1,0",
                },
                "meta_nacional": "Bom ou Ótimo",
                "meta_apui": "Suficiente a Bom (contexto ribeirinho/rural reduz acesso)",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS (e-SUS APS)",
                "peso": 1,
                "descricao_gestor": (
                    "Mede a oferta de atendimentos em relação à população vinculada. "
                    "Profissionais elegíveis: Médico ESF/MFC, Enfermeiro ESF. "
                    "Apuí: equipes ribeirinhas têm menor acesso por dispersão territorial."
                ),
                "acoes_melhoria": [
                    "Ampliar agenda de médico e enfermeiro com turnos extras",
                    "Telemedicina para comunidades distantes (eMulti + APS)",
                    "Reduzir absenteísmo de profissionais com plano de RH",
                    "Registrar corretamente todos os atendimentos no e-SUS",
                ],
            },
            {
                "codigo": "C2",
                "nome": "Cuidado no Desenvolvimento Infantil",
                "grupo": "Saúde da Criança",
                "numerador": "Crianças de 0–72 meses com ao menos 1 atendimento de puericultura por médico ou enfermeiro no período",
                "denominador": "Total de crianças de 0–72 meses vinculadas à equipe",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 60%",
                    "bom":        "40% a 59%",
                    "suficiente": "20% a 39%",
                    "regular":    "< 20%",
                },
                "meta_nacional": "Bom (≥ 40%)",
                "meta_apui": "Suficiente a Bom",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": (
                    "Substitui o antigo indicador de vacinação do Novo Financiamento APS. "
                    "Foca no cuidado longitudinal da criança — puericultura regular. "
                    "Atualização 2025: pediatristas e especialistas agora elegíveis; "
                    "visita domiciliar após 30 dias de vida contabiliza."
                ),
                "acoes_melhoria": [
                    "Protocolo de puericultura por faixa etária (0–6m, 7–12m, 1–2a, 2–4a, 4–6a)",
                    "Busca ativa via ACS de crianças sem consulta > 3 meses",
                    "Caderneta da Criança atualizada em cada consulta",
                    "Articulação com creches e escolas para identificar faltosas",
                ],
            },
            {
                "codigo": "C3",
                "nome": "Cuidado na Gestação e Puerpério",
                "grupo": "Saúde da Mulher",
                "numerador": "Gestantes/puérperas com ≥6 consultas pré-natal (sendo 1ª até 12ª semana) OU puérperas com consulta até 42º dia pós-parto",
                "denominador": "Total de nascidos vivos de mães vinculadas à equipe",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 60%",
                    "bom":        "40% a 59%",
                    "suficiente": "20% a 39%",
                    "regular":    "< 20%",
                },
                "meta_nacional": "Bom (≥ 40%)",
                "meta_apui": "Regular a Suficiente — equipes ribeirinhas: 21,8% (vs 49,1% urbanas)",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / SINASC / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": (
                    "Incorpora pré-natal (antigo PB01) + puerpério. "
                    "Atualização 2025: teleconsulta permitida até 12ª semana; "
                    "ginecologistas/obstetras e dentistas agora elegíveis. "
                    "CRÍTICO para Apuí: risco de mortalidade materna por baixa cobertura ribeirinha."
                ),
                "acoes_melhoria": [
                    "Busca ativa de gestantes via ACS nos primeiros 30 dias de gravidez",
                    "Uso de teleconsulta para gestantes de comunidades distantes (até 12ª semana)",
                    "Consulta puerperal na UBS ou domicílio até 42º dia",
                    "Integração ESF ↔ Maternidade para notificação de parto",
                    "Registro rigoroso no e-SUS: SOAP com campo gestante",
                ],
            },
            {
                "codigo": "C4",
                "nome": "Cuidado da Pessoa com Diabetes Mellitus",
                "grupo": "DCNT",
                "numerador": "Pessoas com DM vinculadas com ≥1 atendimento por médico/enfermeiro + hemoglobina glicada solicitada no período",
                "denominador": "Total de pessoas com DM vinculadas à equipe",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 50%",
                    "bom":        "30% a 49%",
                    "suficiente": "15% a 29%",
                    "regular":    "< 15%",
                },
                "meta_nacional": "Bom (≥ 30%)",
                "meta_apui": "Regular a Suficiente — equipes fluviais atingem apenas 3,5% de HbA1c",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / RNDS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": (
                    "Incorpora e amplia o antigo PB06 (HbA1c). "
                    "Agora exige TANTO consulta QUANTO exame laboratorial. "
                    "CRÍTICO para Apuí: acesso a laboratório na zona rural é o maior gargalo."
                ),
                "acoes_melhoria": [
                    "Laboratório municipal com análise de HbA1c e glicemia disponível",
                    "Protocolo de solicitação de HbA1c a cada 6 meses em todo DM",
                    "Grupo HiperDia mensal com educação em automonitoramento",
                    "Visita domiciliar para diabéticos faltosos > 4 meses",
                    "Kit de teste rápido de glicemia capilar levado nas visitas ribeirinhas",
                ],
            },
            {
                "codigo": "C5",
                "nome": "Cuidado da Pessoa com Hipertensão Arterial",
                "grupo": "DCNT",
                "numerador": "Pessoas com HAS vinculadas com ≥2 atendimentos por médico/enfermeiro + PA aferida em ambos no período",
                "denominador": "Total de pessoas com HAS vinculadas à equipe",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 50%",
                    "bom":        "30% a 49%",
                    "suficiente": "15% a 29%",
                    "regular":    "< 15%",
                },
                "meta_nacional": "Bom (≥ 30%)",
                "meta_apui": "Suficiente a Bom",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": (
                    "Amplia o antigo PB05. Agora exige 2 atendimentos com PA registrada (não apenas 1). "
                    "Aferição de PA é o procedimento mais simples e mais resolutivo da APS."
                ),
                "acoes_melhoria": [
                    "Consulta de enfermagem HAS semestral obrigatória com PA registrada no e-SUS",
                    "Grupo HiperDia: aferição coletiva de PA mensal em cada UBS",
                    "Tendas de aferição de PA em feiras, igrejas, comunidades",
                    "Alerta no e-SUS para hipertensos sem consulta > 5 meses",
                ],
            },
            {
                "codigo": "C6",
                "nome": "Cuidado da Pessoa Idosa",
                "grupo": "Saúde do Idoso",
                "numerador": "Pessoas ≥60 anos vinculadas com avaliação multidimensional rápida (AMR) registrada no período",
                "denominador": "Total de pessoas ≥60 anos vinculadas à equipe",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 50%",
                    "bom":        "30% a 49%",
                    "suficiente": "15% a 29%",
                    "regular":    "< 15%",
                },
                "meta_nacional": "Bom (≥ 30%)",
                "meta_apui": "Suficiente a Bom",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": (
                    "Incorpora e amplia o antigo PB08. "
                    "Avaliação multidimensional rápida identifica fragilidade, risco de quedas, "
                    "polifarmácia e dependência funcional."
                ),
                "acoes_melhoria": [
                    "AMR na consulta de enfermagem — Caderneta da Pessoa Idosa",
                    "Visita domiciliar prioritária para idosos ≥75 anos e acamados",
                    "Grupo de atividade física e prevenção de quedas (eMulti + APS)",
                    "Revisão de polifarmácia com farmacêutico da eMulti",
                ],
            },
            {
                "codigo": "C7",
                "nome": "Cuidado da Mulher na Prevenção do Câncer",
                "grupo": "Saúde da Mulher",
                "numerador": "Mulheres de 25–64 anos com citopatológico cervical coletado nos últimos 3 anos",
                "denominador": "Total de mulheres de 25–64 anos vinculadas à equipe",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 40%",
                    "bom":        "25% a 39%",
                    "suficiente": "12% a 24%",
                    "regular":    "< 12%",
                },
                "meta_nacional": "Bom (≥ 25%)",
                "meta_apui": "Suficiente — acesso difícil em zona rural",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / SISCOLO / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": (
                    "Incorpora o antigo PB03 (citopatológico). "
                    "Câncer do colo do útero é a 2ª neoplasia mais frequente em mulheres amazônicas. "
                    "100% evitável com rastreio regular."
                ),
                "acoes_melhoria": [
                    "Mutirão de coleta: 1 dia/mês por equipe ESF exclusivo para citopatológico",
                    "Enfermeiras capacitadas para coleta autônoma (protocolo MS)",
                    "Busca ativa via ACS: lista de mulheres sem coleta > 3 anos",
                    "Coleta itinerante nas comunidades rurais e ribeirinhas",
                    "Integração com SISCOLO para monitoramento de resultados alterados",
                ],
            },
        ],
    },
    "grupo_B": {
        "sigla": "B",
        "descricao": "Indicadores do Componente Qualidade — Equipe de Saúde Bucal (eSB)",
        "total_indicadores": 6,
        "equipes": ["eSB Modalidade I", "eSB Modalidade II"],
        "portaria": "Portaria GM/MS 3.493/2024 + Portaria 7.799/2025",
        "nota_tecnica": "Notas Metodológicas B1–B6 — SIAPS/SAPS/MS",
        "indicadores": [
            {
                "codigo": "B1",
                "nome": "Primeira Consulta Odontológica Programada na APS",
                "grupo": "Acesso Bucal",
                "numerador": "Pessoas com primeira consulta odontológica programada registrada no período",
                "denominador": "População vinculada à eSB no período",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 15%",
                    "bom":        "10% a 14%",
                    "suficiente": "5% a 9%",
                    "regular":    "< 5%",
                },
                "meta_nacional": "Bom (≥ 10%)",
                "meta_apui": "Suficiente a Bom",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": "Acesso à atenção odontológica pela população vinculada. Base do cuidado continuado.",
                "acoes_melhoria": [
                    "Agenda de CD com 40% para demanda espontânea e 60% programada",
                    "Cadastro ativo de pacientes sem 1ª consulta nos últimos 2 anos",
                    "Mutirão odontológico em escolas e UBS",
                ],
            },
            {
                "codigo": "B2",
                "nome": "Tratamento Odontológico Concluído",
                "grupo": "Qualidade Bucal",
                "numerador": "Pessoas com tratamento odontológico concluído no período",
                "denominador": "Pessoas com primeira consulta programada no período",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 60%",
                    "bom":        "40% a 59%",
                    "suficiente": "20% a 39%",
                    "regular":    "< 20%",
                },
                "meta_nacional": "Bom (≥ 40%)",
                "meta_apui": "Suficiente (dificuldade de adesão em zona rural)",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": "Mede resolutividade: proporção dos tratamentos iniciados que são concluídos.",
                "acoes_melhoria": [
                    "Consultas de retorno agendadas já na 1ª consulta",
                    "Ligação/WhatsApp para lembrete de consultas de retorno",
                    "Registro rigoroso de 'tratamento concluído' no e-SUS",
                ],
            },
            {
                "codigo": "B3",
                "nome": "Taxa de Exodontias na APS",
                "grupo": "Qualidade Bucal",
                "numerador": "Número de extrações dentárias (exodontias) realizadas no período",
                "denominador": "Total de procedimentos odontológicos individuais (preventivos + curativos + exodontias)",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "< 10%",
                    "bom":        "10% a 19%",
                    "suficiente": "20% a 29%",
                    "regular":    "≥ 30%",
                },
                "meta_nacional": "Bom ou Ótimo (< 20%)",
                "meta_apui": "Suficiente a Regular (histórico de alta taxa extrativista)",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": (
                    "INDICADOR INVERSO: quanto menor, melhor. "
                    "Alta taxa de exodontia = modelo extrativista, não resolutivo. "
                    "Meta: reduzir extrações priorizando restauração e preservação dental."
                ),
                "acoes_melhoria": [
                    "Capacitação em dentística restauradora para CD (ART, resinas)",
                    "Protocolo: exodontia só após tentativa conservadora",
                    "Tratamento restaurador atraumático (ART) para municípios sem estrutura completa",
                    "Educação em saúde bucal: escovação, flúor, alimentação",
                ],
            },
            {
                "codigo": "B4",
                "nome": "Escovação Supervisionada em Faixa Etária Escolar (6–12 anos)",
                "grupo": "Prevenção Bucal",
                "numerador": "Crianças de 6–12 anos vinculadas com ≥1 escovação supervisionada registrada no período",
                "denominador": "Total de crianças de 6–12 anos vinculadas à eSB",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 50%",
                    "bom":        "30% a 49%",
                    "suficiente": "15% a 29%",
                    "regular":    "< 15%",
                },
                "meta_nacional": "Bom (≥ 30%)",
                "meta_apui": "Suficiente (escolas rurais sem ESB acessível)",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": "Ação preventiva coletiva — reduz cárie dentária na idade escolar. Articulação PSE.",
                "acoes_melhoria": [
                    "Articulação eSB + PSE (Programa Saúde na Escola)",
                    "Escovação supervisionada nas escolas municipais mensalmente",
                    "Kit escovação: escova + dentifrício via programas do MS",
                ],
            },
            {
                "codigo": "B5",
                "nome": "Procedimentos Odontológicos Preventivos na APS",
                "grupo": "Prevenção Bucal",
                "numerador": "Procedimentos preventivos realizados (aplicação de flúor, selantes, profilaxia, etc.)",
                "denominador": "Total de procedimentos odontológicos individuais realizados",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 50%",
                    "bom":        "30% a 49%",
                    "suficiente": "15% a 29%",
                    "regular":    "< 15%",
                },
                "meta_nacional": "Bom (≥ 30%)",
                "meta_apui": "Suficiente",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": "Proporção preventiva da agenda odontológica — quanto maior, mais resolutiva e menos extrativista.",
                "acoes_melhoria": [
                    "Incorporar aplicação de flúor e selantes de fóssulas na rotina",
                    "Treinamento de ASB/TSB para procedimentos preventivos coletivos",
                    "Registro correto de procedimentos preventivos no e-SUS BPA",
                ],
            },
            {
                "codigo": "B6",
                "nome": "Tratamento Restaurador Atraumático (ART) na APS",
                "grupo": "Qualidade Bucal",
                "numerador": "Procedimentos de ART (restauração atraumática) realizados no período",
                "denominador": "Total de procedimentos restauradores realizados",
                "unidade": "%",
                "classificacao": {
                    "otimo":      "≥ 40%",
                    "bom":        "20% a 39%",
                    "suficiente": "10% a 19%",
                    "regular":    "< 10%",
                },
                "meta_nacional": "Bom (≥ 20%)",
                "meta_apui": "Suficiente a Bom (ART é essencial para Apuí — equipes sem estrutura completa)",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": (
                    "ART = restauração com instrumentos manuais + cimento de ionômero de vidro. "
                    "Ideal para equipes ribeirinhas/rurais sem energia elétrica ou equipamento completo. "
                    "Apuí: uso de ART é estratégico para equipes fluviais."
                ),
                "acoes_melhoria": [
                    "Capacitação em ART para todos os CDs das equipes fluviais",
                    "Kit ART na embarcação sanitária (sem necessidade de energia elétrica)",
                    "Cimento de ionômero de vidro no almoxarifado municipal",
                    "Registro de ART no e-SUS como procedimento restaurador",
                ],
            },
        ],
    },
    "grupo_M": {
        "sigla": "M",
        "descricao": "Indicadores do Componente Qualidade — Equipe Multiprofissional (eMulti)",
        "total_indicadores": 2,
        "equipes": ["eMulti Estratégica", "eMulti Complementar", "eMulti Ampliada"],
        "portaria": "Portaria GM/MS 3.493/2024 + Portaria 7.799/2025",
        "nota_tecnica": "Notas Metodológicas M1 e M2 — SIAPS/SAPS/MS",
        "indicadores": [
            {
                "codigo": "M1",
                "nome": "Média de Atendimentos por Pessoa pela eMulti na APS",
                "grupo": "Acesso eMulti",
                "numerador": "Total de atendimentos individuais realizados por profissionais da eMulti no período",
                "denominador": "Total de pessoas vinculadas às eSF/eAP apoiadas pela eMulti",
                "unidade": "média de atend./pessoa",
                "classificacao": {
                    "otimo":      "≥ 1,0 atend./pessoa/ano",
                    "bom":        "0,5 a 0,9",
                    "suficiente": "0,2 a 0,4",
                    "regular":    "< 0,2",
                },
                "meta_nacional": "Suficiente a Bom",
                "meta_apui": "Suficiente (eMulti recém-implantada — crescimento gradual esperado)",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": (
                    "Mede o alcance de atendimentos individuais da eMulti em relação à população. "
                    "Profissionais elegíveis: todos os 21 CBOs da eMulti (assistente social, "
                    "farmacêutico, fisioterapeuta, fonoaudiólogo, nutricionista, psicólogo, "
                    "terapeuta ocupacional, educador físico, médicos especialistas, etc.)"
                ),
                "acoes_melhoria": [
                    "Agenda da eMulti com vagas para atendimento individual por encaminhamento das eSF",
                    "Registro de TODOS os atendimentos individuais no e-SUS (SOAP)",
                    "Priorizar populações vulneráveis: idosos, gestantes, crianças, ribeirinhos",
                    "Teleconsulta com psicólogo e nutricionista para comunidades distantes",
                ],
            },
            {
                "codigo": "M2",
                "nome": "Ações Interprofissionais Realizadas pela eMulti na APS",
                "grupo": "Qualidade eMulti",
                "numerador": "Ações interprofissionais registradas (reuniões matriciais, projetos terapêuticos singulares, atividades coletivas conjuntas com eSF)",
                "denominador": "Número de eSF/eAP apoiadas pela eMulti no período",
                "unidade": "média de ações/eSF",
                "classificacao": {
                    "otimo":      "≥ 4 ações/eSF/mês",
                    "bom":        "2 a 3 ações/eSF/mês",
                    "suficiente": "1 ação/eSF/mês",
                    "regular":    "< 1 ação/eSF/mês",
                },
                "meta_nacional": "Bom (≥ 2 ações/eSF/mês)",
                "meta_apui": "Suficiente (início de implantação)",
                "periodicidade": "quadrimestral",
                "fonte": "SIAPS / e-Gestor APS",
                "peso": 1,
                "descricao_gestor": (
                    "Mede a integração da eMulti com as eSF. "
                    "Inclui: matriciamento, PTS (Projeto Terapêutico Singular), atividades coletivas "
                    "conjuntas, consultas compartilhadas. Essencial para o modelo de apoio matricial."
                ),
                "acoes_melhoria": [
                    "Reunião de matriciamento mensal da eMulti com cada eSF (obrigatória)",
                    "PTS para casos complexos: eMulti + ESF + família",
                    "Atividades coletivas conjuntas: grupo de caminhada, grupo de saúde mental",
                    "Registro de atividades coletivas no e-SUS para contabilizar M2",
                ],
            },
        ],
    },
}

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


@router.get("/componente-qualidade")
async def get_componente_qualidade(mes: int = Query(default=None), ano: int = Query(default=None)):
    """
    15 indicadores do Componente Qualidade — Portaria GM/MS 3.493/2024 + 7.799/2025.
    Substitui o Novo Financiamento APS (extinto). Grupos C (eSF/eAP), B (eSB), M (eMulti).
    """
    hoje = date.today()
    if not mes: mes = hoje.month
    if not ano: ano = hoje.year

    def _classificar(codigo: str, ano: int, mes: int) -> dict:
        seed = int(hashlib.md5(f"{codigo}-{ano}-{mes}".encode()).hexdigest(), 16)
        rng = Random(seed)
        # Simula resultado na escala 0–10 (nota do indicador)
        nota = round(rng.uniform(1.5, 9.5), 1)
        if nota > 7.5:
            conceito = "Ótimo"
            cor = "green"
        elif nota >= 5.0:
            conceito = "Bom"
            cor = "blue"
        elif nota >= 2.6:
            conceito = "Suficiente"
            cor = "yellow"
        else:
            conceito = "Regular"
            cor = "red"
        return {"nota": nota, "conceito": conceito, "cor": cor}

    # chaves curtas ("C", "B", "M") conforme esperado pelo frontend
    grupos_resultado = {}
    total_otimo = total_bom = total_suficiente = total_regular = 0

    def _conceito_de_nota(nota: float) -> str:
        if nota > 7.5:   return "Ótimo"
        if nota >= 5.0:  return "Bom"
        if nota >= 2.6:  return "Suficiente"
        return "Regular"

    for grupo_key, sigla in (("grupo_C", "C"), ("grupo_B", "B"), ("grupo_M", "M")):
        grupo = INDICADORES_QUALIDADE[grupo_key]
        inds = []
        g_otimo = g_bom = g_suf = g_reg = 0
        for ind in grupo["indicadores"]:
            cls = _classificar(ind["codigo"], ano, mes)
            c = cls["conceito"]
            if c == "Ótimo":     total_otimo += 1;  g_otimo += 1
            elif c == "Bom":     total_bom += 1;    g_bom += 1
            elif c == "Suficiente": total_suficiente += 1; g_suf += 1
            else:                total_regular += 1; g_reg += 1
            inds.append({**ind, **cls})

        g_total = len(inds)
        notas = [i["nota"] for i in inds]
        nota_media = round(sum(notas) / g_total, 1) if g_total else 0.0
        pct_bom_otimo = round((g_otimo + g_bom) / g_total * 100) if g_total else 0

        grupos_resultado[sigla] = {
            **{k: v for k, v in grupo.items() if k != "indicadores"},
            "indicadores": inds,
            "nota_media": nota_media,
            "conceito_medio": _conceito_de_nota(nota_media),
            "pct_bom_otimo": pct_bom_otimo,
        }

    total = total_otimo + total_bom + total_suficiente + total_regular
    return {
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "periodo": f"{mes:02d}/{ano}",
        "modelo": "Novo Financiamento APS — Portaria GM/MS 3.493/2024 + 7.799/2025",
        "nota_tecnica": "NT DEAPS/SAPS/MS nº 6/2025",
        "fonte": "SIAPS / e-Gestor APS",
        "aviso": "PREVINE BRASIL EXTINTO — substituído por este modelo desde abril/2024",
        "efeitos_financeiros": "A partir de maio/2025 (parcela 05/2025)",
        "extincao_previne_brasil": INDICADORES_QUALIDADE["extincao_previne_brasil"],
        "faixas_classificacao": {
            "otimo":      "Nota > 7,5 — bônus integral no componente qualidade",
            "bom":        "Nota 5,0–7,5",
            "suficiente": "Nota 2,6–4,9",
            "regular":    "Nota ≤ 2,5 — sem bônus de qualidade",
        },
        "resumo": {
            "total_indicadores": total,
            "otimo": total_otimo,
            "bom": total_bom,
            "suficiente": total_suficiente,
            "regular": total_regular,
            "pct_bom_otimo": round((total_otimo + total_bom) / total * 100, 1) if total else 0,
        },
        "grupos": grupos_resultado,
    }


@router.get("/previne-brasil")
async def get_previne_brasil_legado():
    """EXTINTO — redireciona para o novo endpoint /componente-qualidade."""
    return {
        "aviso": "O PREVINE BRASIL FOI EXTINTO.",
        "portaria_extincao": "Portaria GM/MS nº 3.493, de 10 de abril de 2024",
        "substituido_por": "/api/parametros-ms/componente-qualidade",
        "modelo_atual": "Componente Qualidade — 15 indicadores (C1–C7, B1–B6, M1–M2)",
        "nota_tecnica": "NT DEAPS/SAPS/MS nº 6/2025",
        "efeitos_financeiros": "A partir de maio/2025 (parcela 05/2025)",
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
    """Painel consolidado — novo modelo de financiamento APS (Portaria 3.493/2024)."""
    hoje = date.today()
    if not mes: mes = hoje.month
    if not ano: ano = hoje.year

    qual = await get_componente_qualidade(mes=mes, ano=ano)
    sisp = await get_sispacto()
    vac  = await get_cobertura_vacinal(mes=mes, ano=ano)

    # Alertas por indicadores Regular
    criticos = []
    for grupo_key in ("grupo_C", "grupo_B", "grupo_M"):
        grp = qual["grupos"][grupo_key]
        for ind in grp["indicadores"]:
            if ind["conceito"] == "Regular":
                criticos.append({
                    "modulo": f"Componente Qualidade — {grp['sigla']}",
                    "indicador": ind["nome"],
                    "conceito": ind["conceito"],
                    "nota": ind["nota"],
                    "meta_apui": ind.get("meta_apui", "—"),
                    "acoes": ind.get("acoes_melhoria", [])[:2],
                })
            elif ind["conceito"] == "Suficiente":
                criticos.append({
                    "modulo": f"Componente Qualidade — {grp['sigla']}",
                    "indicador": ind["nome"],
                    "conceito": ind["conceito"],
                    "nota": ind["nota"],
                    "meta_apui": ind.get("meta_apui", "—"),
                    "acoes": ind.get("acoes_melhoria", [])[:1],
                })

    criticos.sort(key=lambda x: x["nota"])

    total_qual = qual["resumo"]["total_indicadores"]
    pct_bom_otimo = qual["resumo"]["pct_bom_otimo"]
    pct_vac_ok = round(vac["resumo"]["adequadas"] / vac["resumo"]["total"] * 100, 0)

    score_geral = round(pct_bom_otimo * 0.6 + pct_vac_ok * 0.4, 0)

    return {
        "municipio": "Apuí/AM",
        "ibge": "1300144",
        "periodo": f"{mes:02d}/{ano}",
        "gerado_em": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "modelo": "Novo Financiamento APS — Portaria GM/MS 3.493/2024 + 7.799/2025",
        "aviso_previne_brasil": "EXTINTO desde Portaria GM/MS 3.493/2024 — substituído pelo Componente Qualidade (15 indicadores)",
        "score_geral": score_geral,
        "resumo": {
            "componente_qualidade": qual["resumo"],
            "sispacto":            sisp["resumo"],
            "cobertura_vacinal":   vac["resumo"],
        },
        "alertas_criticos": criticos[:10],
        "componente_qualidade": qual["grupos"],
        "sispacto":             sisp["metas"],
        "cobertura_vacinal":    vac["vacinas"],
        "parametros_cbo":       {cbo: {"portaria": v["portaria"], "meta_mensal": v.get("meta_mensal", {}), "producao_dia": v["producao_dia"]} for cbo, v in PARAMETROS_CBO.items()},
    }
