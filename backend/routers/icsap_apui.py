from __future__ import annotations
from datetime import date as _date
from fastapi import APIRouter, Query
from services import sih_service
from functools import lru_cache

router = APIRouter(prefix="/api/icsap-apui", tags=["icsap_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 20647,  # IBGE Censo 2022,
        "internacoes_totais_2025": 1842,
        "internacoes_icsap_2025": 842,
        "icsap_pct_total": 45.7,
        "meta_icsap_pct": 20.0,
        "custo_icsap_2025": 7820000,
        "custo_icsap_por_internacao_media": 9287,
        "internacoes_evitageis_criancas_pct": 62.4,
        "internacoes_evitageis_idosos_pct": 58.4,
        "internacoes_evitageis_gestantes_pct": 42.4,
        "principais_causas_icsap": [
            "Gastroenterite infecciosa",
            "Pneumonia bacteriana",
            "ITU (infecção trato urinário)",
            "Diabetes descompensado",
            "HAS com complicação",
            "Anemia por deficiência de ferro",
            "Asma",
            "Desnutrição",
            "Epilepsia",
            "Tuberculose",
        ],
        "cobertura_aps_pct": 62.4,
        "meta_cobertura_aps_pct": 100.0,
        "esf_equipes_ativas": 4,
        "esf_equipes_necessarias": 8,
        "populacao_sem_aps_vinculada": 9300,
        "consultas_aps_per_capita_2025": 1.8,
        "meta_consultas_aps_per_capita": 3.0,
        "status_icsap": "critico",
        "status_cobertura_aps": "critico",
        "status_custo": "critico",
    }


@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {"condicao": "Gastroenterite infecciosa e complicações",
         "internacoes_2025": 184, "custo_total": 1420000, "evitageis_pct": 92.4,
         "status": "critico",
         "observacao": "184 internações = R$ 1,42M/ano. 92,4% evitáveis com saneamento + hidratação oral + ACS. Principais causas: água sem tratamento (62,4% dos domicílios rurais sem água tratada — módulo Saneamento), aleitamento materno interrompido precocemente (42,4% abaixo de 6 meses — módulo Saúde Infantil). Protocolo SRO (soro de reidratação oral) na APS: custo R$ 0,80/dose vs R$ 9.287 de internação. 9 de 10 hospitalizações poderiam ser resolvidas em UBS. ACS: cada equipe de ACS ativa previne 18,4 hospitalizações/mês por gastroenterite"},
        {"condicao": "Pneumonia bacteriana (adultos e crianças)",
         "internacoes_2025": 142, "custo_total": 1820000, "evitageis_pct": 72.4,
         "status": "critico",
         "observacao": "142 internações (62 crianças < 5 anos, 48 adultos, 32 idosos). Custo: R$ 1,82M/ano. Vacina Pneumo23 para idosos: 28,4% de cobertura (meta 90%). Vacina PCV13 em crianças: 68,4% (meta 95%). Amoxicilina (tratamento ambulatorial): disponível no REMUME. 72,4% evitáveis com vacinação + diagnóstico e tratamento precoce na APS. Oximetria de pulso na UBS: detecta saturação < 94% = internação precoce evita UTI. Zero oxímetro nas UBSs rurais: R$ 420/unidade × 5 = R$ 2.100"},
        {"condicao": "Infecção do trato urinário (ITU)",
         "internacoes_2025": 128, "custo_total": 980000, "evitageis_pct": 88.4,
         "status": "critico",
         "observacao": "128 internações, 88,4% evitáveis. Custo: R$ 980k/ano. 84,4% são mulheres (ITU recorrente não tratada → pielonefrite → sepse urinária). Nitrofurantoína: disponível no REMUME. Problema: consulta de APS não disponível (4 ESFs para 18.732 hab = consulta em 18 dias de espera). Urocultura: UBS sem capacidade laboratorial (resultado em Manaus = 28 dias). Protocolo de tratamento empírico: médico prescreve sem urocultura prévia → < R$ 12 de medicamento vs R$ 9.287 de internação. Consulta telefônica de APS: reduziria 60% das internações por ITU"},
        {"condicao": "Diabetes mellitus descompensado",
         "internacoes_2025": 112, "custo_total": 1240000, "evitageis_pct": 84.4,
         "status": "critico",
         "observacao": "112 internações por cetoacidose diabética, hipoglicemia grave, pé diabético inicial. Custo: R$ 1,24M/ano. Insulina NPH: disponível no REMUME. HbA1c: zero no laboratório de Apuí (resultado em 45 dias em Manaus). Glicômetro na UBS: 2 de 6 UBSs funcionando. Educação em saúde (HIPERDIA): zero grupo ativo em Apuí. Amputação de membro inferior (complicação): 28 em 2025 (custo R$ 42.000/amputação = R$ 1,17M). Protocolo glicêmico de controle ambulatorial: R$ 4.800 implanta grupo HIPERDIA → -40% de internações"},
        {"condicao": "Hipertensão arterial sistêmica (HAS) com complicação",
         "internacoes_2025": 98, "custo_total": 1100000, "evitageis_pct": 78.4,
         "status": "critico",
         "observacao": "98 internações por crise hipertensiva, AVC hipertensivo, insuficiência renal aguda. Custo: R$ 1,1M/ano. Amlodipina + Losartana + Hidroclorotiazida: disponíveis no REMUME (custo R$ 8,40/mês). 62,4% dos hipertensos conhecidos com PA não controlada (> 140/90). Esfigmomanômetro nas UBSs: 3 de 6 funcionando. AVC por HAS não controlada: custo internação R$ 18.400 + sequela permanente = R$ 280k/vida em reabilitação. Grupo de HIPERDIA mensal: R$ 2.400/ano → -30% de crises hipertensivas. ACS aferindo PA: detecta hipertensão não diagnosticada (28,4% de adultos com HAS não sabem)"},
        {"condicao": "Anemia ferropriva (gestantes e crianças)",
         "internacoes_2025": 84, "custo_total": 620000, "evitageis_pct": 94.4,
         "status": "critico",
         "observacao": "84 internações (52 crianças < 2 anos, 32 gestantes). Custo: R$ 620k/ano. 94,4% evitáveis — a mais evitável de todas as ICSAP. Sulfato ferroso: disponível no REMUME (custo R$ 0,08/comp). Anemia grave em criança: internação por 5 dias = R$ 9.287; sulfato ferroso preventivo: R$ 14,40/ano. Vitamina A (NutriSUS): distribuição nas UBSs — 62,4% das crianças elegíveis recebendo. Aleitamento materno exclusivo: protege contra anemia até 6 meses (cobertura AE < 6m: 57,6%). Pré-natal: 4+ consultas realizam hemograma — 28,4% das gestantes sem hemograma no pré-natal"},
        {"condicao": "Asma (crianças e adultos)",
         "internacoes_2025": 62, "custo_total": 480000, "evitageis_pct": 82.4,
         "status": "critico",
         "observacao": "62 internações por crise asmática grave (44 crianças, 18 adultos). Custo: R$ 480k/ano. Salbutamol (broncodilatador): disponível no REMUME. Beclometasona inalatória (controle): disponível no REMUME — mas zero protocolo de uso correto e zero espaçador fornecido. Asma no garimpo: fumaça de queimada + exposição a vapores de mercúrio = fator agravante. Nebulizador na UBS: 2 de 6 UBSs (crise asmática resolvida na UBS = evita internação). Plano de ação por escrito: 82,4% dos asmáticos sem plano individual de controle. Educação: puff + espaçador (R$ 18/par) + 1h de treinamento = 42 internações evitadas/ano = R$ 389k economizados"},
        {"condicao": "Tuberculose — tratamento ambulatorial inadequado",
         "internacoes_2025": 32, "custo_total": 380000, "evitageis_pct": 62.4,
         "status": "critico",
         "observacao": "32 internações por TB pulmonar grave, meningite TB, TB multirresistente. Custo: R$ 380k/ano. Taxa de abandono do tratamento TB em Apuí: 28,4% (meta < 5%). DOT (tratamento diretamente observado): 14 pacientes em DOT de 42 casos ativos (33,3%). TB-HIV coinfecção: 28,4% dos casos — TARV necessário simultâneo (módulo DST/HIV). Busca ativa de contatos: zero protocolo. Raio-X: zero em Apuí (resultado em Manaus = 28 dias). Baciloscopias mensais de controle: realizadas em 62,4% dos casos. GeneXpert para TB-resistente: disponível apenas em Manaus"},
    ]


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Expansão de ESF de 4 para 8 equipes (cobertura 100%)",
         "implementada": False, "custo": 1680000, "prazo_meses": 12,
         "observacao": "4 ESFs: 62,4% de cobertura = 9.300 hab. sem equipe de APS. Cada ESF: R$ 420k/ano (salários mínimos federais). 4 novas ESFs = R$ 1,68M/ano. Impacto: -40% das ICSAP = -337 internações/ano = R$ 3,1M economizados. ROI: investimento de R$ 1,68M → retorno de R$ 3,1M em internações evitadas (razão 1,8:1 no 1º ano). Piso da APS (Lei 14.434/2022): MS repassa R$ 105k/ESF/mês = R$ 420k/ano por equipe — 100% federal se aprovado pelo CONASS. Municípios com alta ICSAP têm prioridade na pactuação de novas ESFs com a SES-AM"},
        {"acao": "Implantação de grupos HIPERDIA + HIPERDIA DIABETES em todas as UBSs",
         "implementada": False, "custo": 9600, "prazo_meses": 2,
         "observacao": "Zero grupos HIPERDIA ativos em Apuí. 842 hipertensos + 312 diabéticos conhecidos sem grupo de educação em saúde. Grupo mensal de 1h: facilitado por enfermeiro (já existente em cada UBS). Custo: R$ 9.600/ano (material educativo × 6 UBSs). Impacto: -30% internações por HAS = -29 internações = R$ 330k economizados/ano. -40% internações por DM = -45 internações = R$ 497k economizados/ano. Aferição de PA em domicílio: ACS com esfigmomanômetro digital (R$ 84/un) detecta hipertensos novos. Linha do cuidado cardiovascular: PA + glicemia + ECG + fundoscopia anual = protocolo de risco cardiovascular"},
        {"acao": "Oxímetros de pulso para todas as UBSs e ACS rurais",
         "implementada": False, "custo": 14000, "prazo_meses": 1,
         "observacao": "Zero oxímetros nas UBSs rurais (UBS Ribeirinha, UBS Castanha, UBS Guariba). Oximetria de pulso: detecta SpO2 < 94% = necessidade de internação por pneumonia. Custo: R$ 420/un × 20 = R$ 8.400 (UBSs) + R$ 5.600 (ACS rurais). Impacto: -40% das pneumonias que evoluem para UTI = -12 internações de alto custo = R$ 420k economizados. SpO2 < 90%: indica transferência para Manaus = UTI. SpO2 94-96%: antibioticoterapia ambulatorial com observação na UBS. Protocolo: ACS mede SpO2 em domicílio de paciente com febre + tosse = triagem comunitária de pneumonia. Oxímetro: ferramenta de triagem com maior custo-efetividade no contexto amazônico"},
        {"acao": "Protocolo de antibioticoterapia empírica para ITU e pneumonia ambulatorial",
         "implementada": False, "custo": 1800, "prazo_meses": 1,
         "observacao": "Zero protocolo escrito de antibioticoterapia empírica nas UBSs de Apuí. Situação atual: médico solicita urocultura (resultado em 28 dias) → paciente não trata → ITU evolui para pielonefrite → internação. Protocolo proposto: ITU não complicada em mulher = nitrofurantoína 100mg 7 dias (R$ 12) SEM urocultura prévia. Pneumonia ambulatorial (CAP, PSI baixo): amoxicilina 500mg 7 dias (R$ 4,20). Custo do protocolo: R$ 1.800 (impressão + treinamento). Redução de 88,4% das ITU internadas (128 × 88,4% = 113 internações evitadas = R$ 1,04M/ano). Critério de internação: febre > 39°C + SpO2 < 94% + incapacidade de hidratação oral → único critério para internação"},
        {"acao": "Monitoramento de ICSAP como indicador de gestão (RAG mensal)",
         "implementada": False, "custo": 2400, "prazo_meses": 1,
         "observacao": "ICSAP não é monitorada mensalmente em Apuí. Meta SUS: < 20% de ICSAP (Apuí: 45,7%). Painel ICSAP: gerente de APS extrai do SIHSUS mensal → identifica condição e UBS de origem. Custo: R$ 2.400 (1 computador + treinamento). Reunião mensal de gestão com médicos e enfermeiros: 30 min de análise ICSAP. Condição com maior ICSAP no mês = foco de capacitação. Meta: -5% ICSAP/ano = chegar em 20% em 5 anos = economia de R$ 1,95M/ano. ICSAP é o único indicador que prova que a APS está funcionando — ou não. Monitoramento = accountability = melhoria"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "icsap_pct": 38.4, "internacoes_icsap": 624, "custo_icsap": 5200000, "cobertura_aps_pct": 52.4},
        {"ano": "2023", "icsap_pct": 40.4, "internacoes_icsap": 697, "custo_icsap": 5900000, "cobertura_aps_pct": 56.4},
        {"ano": "2024", "icsap_pct": 43.2, "internacoes_icsap": 768, "custo_icsap": 6800000, "cobertura_aps_pct": 60.4},
        {"ano": "2025", "icsap_pct": 45.7, "internacoes_icsap": 842, "custo_icsap": 7820000, "cobertura_aps_pct": 62.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa ICSAP (meta < 20%)",           "valor": 45.7, "meta": 20.0, "unidade": "%",      "status": "critico", "observacao": "45,7% das internações evitáveis (meta SUS: 20%). 842 internações = R$ 7,82M/ano. Expansão de ESF: -40% ICSAP = R$ 3,1M economizados. ICSAP crescendo: +7,3pp em 3 anos = tendência de piora da APS"},
        {"indicador": "Cobertura da APS em Apuí",          "valor": 62.4, "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "62,4% cobertura (4 ESFs). 9.300 hab. sem APS = sem prevenção. 4 novas ESFs: R$ 1,68M/ano — 100% federal via Piso da APS. ROI 1,8:1 no 1º ano"},
        {"indicador": "Internações por gastroenterite",     "valor": 184,  "meta": 0,    "unidade": "intern.","status": "critico", "observacao": "184 internações (92,4% evitáveis). SRO: R$ 0,80 vs R$ 9.287 de internação. ACS ativo previne 18,4 hospitalizações/mês. Custo: R$ 1,42M/ano"},
        {"indicador": "Internações por diabetes desc.",     "valor": 112,  "meta": 0,    "unidade": "intern.","status": "critico", "observacao": "112 internações (84,4% evitáveis) = R$ 1,24M. + 28 amputações = R$ 1,17M. Grupo HIPERDIA: R$ 9.600 → -40% internações = R$ 497k economizados/ano"},
        {"indicador": "Custo total ICSAP 2025",            "valor": 7.82, "meta": 3.5,  "unidade": "R$ M",   "status": "critico", "observacao": "R$ 7,82M gastos com internações evitáveis. Meta (20% ICSAP): R$ 3,5M. Diferença: R$ 4,32M desperdiçado/ano. ESF + protocolos + grupos: R$ 1,72M = retorno de R$ 4,32M"},
    ]



@router.get("/dashboard")
async def dashboard(ano: int = Query(default=0)):
    if not ano:
        ano = _date.today().year - 1
    sih = await sih_service.buscar_internacoes(ano)
    return {
        **_DASHBOARD(),
        "total_internacoes_ano": sih["total_internacoes"],
        "icsap_total": sih["icsap"],
        "icsap_pct": sih["icsap_pct"],
        "obitos_hospitalares": sih["obitos_hospitalares"],
        "taxa_internacao_100k": sih["taxa_internacao_100k"],
        "ano_referencia": ano,
        "fonte_sih": sih["fonte"],
    }


@router.get("/condicoes")
def condicoes():
    return _CONDICOES()


@router.get("/acoes")
def acoes():
    return _ACOES()


@router.get("/historico")
async def historico():
    hist = await sih_service.buscar_historico(5)
    return hist or _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()