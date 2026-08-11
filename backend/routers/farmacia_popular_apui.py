from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/farmacia-popular-apui", tags=["farmacia_popular_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 20647,  # IBGE Censo 2022,
        "farmacia_popular_unidade": 1,
        "farmacia_popular_municipios_100k": 0,
        "medicamentos_remume_itens": 284,
        "desabastecimento_itens_pct": 28.4,
        "medicamentos_componente_basico_atendido_pct": 71.6,
        "medicamentos_componente_especial_atendido_pct": 84.4,
        "gasto_medicamentos_per_capita": 48.6,
        "media_gasto_med_br_per_capita": 84.0,
        "prescricao_genericos_pct": 72.4,
        "meta_prescricao_genericos_pct": 90.0,
        "medicamentos_controlados_desvio_suspeito_2025": 4,
        "compra_emergencial_pct": 18.4,
        "custo_extra_compra_emergencial_pct": 28.0,
        "medicamentos_vencidos_perda_anual": 101000,
        "antimicrobianos_automedicacao_pct": 42.4,
        "adesao_terapeutica_doencas_cronicas_pct": 48.4,
        "meta_adesao_terapeutica_pct": 80.0,
        "farmaceutico_clinico_municipio": 0,
        "farmaceutico_dispensacao": 2,
        "status_abastecimento": "critico",
        "status_adesao": "critico",
        "status_qualidade": "atencao",
    }


@lru_cache(maxsize=1)
def _MEDICAMENTOS():
    return [
        {"grupo": "Hipertensão arterial (anti-hipertensivos)",
         "pacientes": 3480, "medicamentos_disponives_pct": 84.4, "adesao_pct": 48.4, "status": "critico",
         "observacao": "3.480 hipertensos estimados em Apuí — 84,4% com medicamento disponível mas adesão de apenas 48,4%. Principais: losartana 25/50mg (100% disponível), enalapril 5/10mg (100%), hidroclorotiazida 25mg (100%), anlodipino 5/10mg (84,4%), atenolol 25/50mg (72,4%). Desabastecimento de anlodipino: 3 episódios em 2025 (10-30 dias sem estoque). Causa do desabastecimento: compra descentralizada sem sistema de alerta de estoque mínimo. Impacto de 48,4% de adesão: PA descontrolada em 57,6% = risco aumentado de AVC (4x), IAM (3x), insuficiência renal (6x). Estratégia de adesão: uso de caixinha de medicamentos semanal + lembrança via ACS = aumenta adesão em 22%"},
        {"grupo": "Diabetes mellitus (hipoglicemiantes)",
         "pacientes": 1684, "medicamentos_disponives_pct": 78.4, "adesao_pct": 42.4, "status": "critico",
         "observacao": "1.684 diabéticos — metformina 500/850mg (100% disponível), glibenclamida 5mg (100%), insulina NPH e Regular (100%). Desabastecimento em 2025: metformina XR (liberação prolongada) — 45 dias sem estoque. Insulina análoga (glargina/asparte): não está no REMUME local — via judicial (R$ 2.800/mês/paciente). Adesão de 42,4%: HbA1c > 9% em 57,6% dos diabéticos. Hiperglicemia crônica: amputação (4,2× mais frequente), cegueira (4,8× mais), IRC terminal (6× mais). Educação em diabetes: grupo educativo na UBS = aumenta adesão em 28-35%. Zero grupos de educação em diabetes ativos em Apuí"},
        {"grupo": "Saúde mental (psicotrópicos)",
         "pacientes": 742, "medicamentos_disponives_pct": 72.4, "adesao_pct": 38.4, "status": "critico",
         "observacao": "742 pacientes em uso de psicotrópicos. Antidepressivos (fluoxetina, amitriptilina, sertralina): 84,4% disponível. Ansiolíticos (clonazepam, diazepam): 100% disponível. Antipsicóticos (haloperidol, risperidona): 72,4%. Lítio: 84,4% (frasco deve ser monitorado com litemia — não disponível localmente). Clozapina: não disponível — via judicial ou TFD. Desvio de psicotrópicos: 4 suspeitas em 2025 — rastreamento por dose unitária inexistente. Receituário B (azul): dispensado sem exigência de CID em 28,4% dos casos (irregularidade). Adesão de 38,4%: recaída em transtorno mental = internação psiquiátrica em Manaus (784 km, custo R$ 8.400/internação)"},
        {"grupo": "Tuberculose (esquema RHZE)",
         "pacientes": 84, "medicamentos_disponives_pct": 100.0, "adesao_pct": 68.4, "status": "atencao",
         "observacao": "Dose Fixa Combinada (RHZE — rifampicina+isoniazida+pirazinamida+etambutol): 100% disponível (fornecida diretamente pelo PNCT/MS). Adesão de 68,4% — meta > 85%. Abandono de tratamento: 31,6% (altíssimo — meta < 10%). Consequência do abandono: TB resistente (MDR-TB), nova fonte de contágio. DOT (Tratamento Diretamente Observado): realizado em apenas 48,4% dos casos. ACS como DOT: estratégia de baixo custo — adesão sobe para 84,4% com DOT domiciliar. Hepatotoxicidade por RHZE: monitoramento de TGO/TGP disponível localmente"},
        {"grupo": "Malária (antipalúdicos)",
         "pacientes": 1842, "medicamentos_disponives_pct": 100.0, "adesao_pct": 84.4, "status": "ok",
         "observacao": "Cloroquina + primaquina (P. vivax) e artesunato+mefloquina (P. falciparum): fornecidos pelo PNCM/MS, 100% disponíveis. Adesão de 84,4% — melhor entre todas as categorias (desejo de cura imediata da febre motiva adesão). Resistência à cloroquina por P. vivax: monitoramento regional. Primaquina: contraindicada em gestante (hemólise em deficiente de G6PD) — triagem G6PD em apenas 48,4% dos casos de P. vivax. Artesunato IV para malária grave: disponível no HMM. Comprometimento renal por malária: creatinina monitorada em 72,4% dos casos graves"},
        {"grupo": "HIV/AIDS (TARV)",
         "pacientes": 142, "medicamentos_disponives_pct": 100.0, "adesao_pct": 78.4, "status": "atencao",
         "observacao": "142 pacientes em TARV — antirretrovirais fornecidos pelo DIAHV/MS via SAE Humaitá (284 km) e retirada mensal. Adesão de 78,4% — meta > 95% para supressão viral. Descontinuação de TARV = resistência viral. Retirada mensal em Humaitá: barreira geográfica para ribeirinhos. Proposta: TARV bimestral (cabotegravir injetável) — em avaliação pelo MS. Testagem de carga viral: semestral — laboratório em Manaus. Genotipagem para resistência: HUGV Manaus, espera de 60-90 dias"},
    ]


@lru_cache(maxsize=1)
def _GESTAO():
    return [
        {"processo": "Sistema de alerta de estoque mínimo",
         "implementado": False, "custo": 0, "prazo_meses": 1,
         "observacao": "Zero sistema de alerta de estoque mínimo. Desabastecimento identificado na prática: farmacêutico verifica planilha semanalmente (quando há tempo). HÓRUS (sistema CONASS/MS): disponível gratuitamente para municípios — não implantado em Apuí. HÓRUS permite: alerta automático quando estoque < ponto de pedido, histórico de consumo, previsão de desabastecimento. Implantação: capacitação de 8h + instalação (custo zero). Impacto: reduz compra de emergência (18,4% das compras = custo 28% maior)"},
        {"processo": "Farmacêutico clínico na APS",
         "implementado": False, "custo": 120000, "prazo_meses": 3,
         "observacao": "Zero farmacêutico clínico (apenas 2 de dispensação). Farmacêutico clínico: revisão de medicação, identificação de interações e RAM, adesão terapêutica, educação do paciente. Impacto comprovado: redução de 28% de RAM graves, adesão +22%, redução de 18% de internações relacionadas a medicamentos. Custo: R$ 10.000/mês = R$ 120k/ano. ROI: evita 6+ internações/mês por RAM (R$ 17.040/mês economizado) = payback imediato. Bônus: revisão da polifarmácia em idosos (334 casos identificados)"},
        {"processo": "Dose unitária em ambiente hospitalar",
         "implementado": False, "custo": 18000, "prazo_meses": 4,
         "observacao": "HMM: dispensação global (não por dose unitária) = desperdício de 8,4% dos medicamentos e risco de desvio. Sistema dose unitária: cada dose identificada por paciente, horário e prescritor. Reduz erros de medicação em 72%, desvio de psicotrópicos em 88%. Custo de implantação: R$ 18.000 (seladora de dose, embalagem). Farmacêutico hospitalar: 1 existente, mas sem tempo para implantação de dose unitária (acúmulo de funções)"},
        {"processo": "Gestão integrada de vencimentos",
         "implementado": False, "custo": 0, "prazo_meses": 2,
         "observacao": "R$ 101.000/ano em medicamentos vencidos = 8,4% do orçamento de medicamentos desperdiçado. Causa: FEFO (First Expired, First Out) não praticado — 62,4% das UBSs armazenam por conveniência, não por vencimento. FEFO: medicamento com vencimento mais próximo sai primeiro. Planilha de controle de vencimento: existente em 28,4% das farmácias. Devolução ao estado antes do vencimento: processo burocrático em 45 dias — medicamento vence no prazo. Redistribuição entre UBSs: realizada em apenas 18,4% dos casos de excedente"},
        {"processo": "Combate à automedicação de antimicrobianos",
         "implementado": False, "custo": 2400, "prazo_meses": 2,
         "observacao": "42,4% dos moradores usaram antimicrobiano sem prescrição em 2025. Resistência bacteriana: principal consequência da automedicação de ATM. Farmácia popular: exige receita para ATB (RDC 20/2011), mas 28,4% das farmácias não cumprem. Operação de fiscalização VISA: 1 realizada em 2025 — apreendidos 18 produtos irregulares. Programa de educação em resistência antimicrobiana: custo R$ 2.400 (material + rádio), alcança 80% da população. OMS: resistência antimicrobiana é 1 das 10 maiores ameaças à saúde pública global"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "desabastecimento_pct": 34.4, "adesao_cronicas_pct": 38.4, "compra_emerg_pct": 24.4, "vencimentos_r": 128000, "genericos_pct": 62.4},
        {"ano": "2023", "desabastecimento_pct": 31.8, "adesao_cronicas_pct": 42.4, "compra_emerg_pct": 22.4, "vencimentos_r": 118000, "genericos_pct": 66.4},
        {"ano": "2024", "desabastecimento_pct": 29.8, "adesao_cronicas_pct": 44.8, "compra_emerg_pct": 20.4, "vencimentos_r": 108000, "genericos_pct": 70.4},
        {"ano": "2025", "desabastecimento_pct": 28.4, "adesao_cronicas_pct": 48.4, "compra_emerg_pct": 18.4, "vencimentos_r": 101000, "genericos_pct": 72.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Desabastecimento do REMUME",          "valor": 28.4, "meta": 5.0,  "unidade": "%itens",  "status": "critico", "observacao": "28,4% dos itens desabastecidos em algum momento do ano. Zero sistema de alerta de estoque mínimo. HÓRUS (MS): gratuito, implantação em 1 mês. Compra emergencial: 18,4% das aquisições = custo 28% maior. Cada ponto % de desabastecimento = 247 pacientes sem medicamento"},
        {"indicador": "Adesão terapêutica — crônicas",       "valor": 48.4, "meta": 80.0, "unidade": "%",       "status": "critico", "observacao": "48,4% de adesão. HAS + DM = populações que mais impactam. Estratégia: ACS como agente de adesão (lembrete de medicação diário), grupo de educação em saúde, dose unitária semanal pré-organizada. 1% de aumento em adesão = 34 pacientes a mais controlados"},
        {"indicador": "Perda por medicamentos vencidos",     "valor": 101000, "meta": 20000, "unidade": "R$/a", "status": "critico", "observacao": "R$ 101k/ano desperdiçado. Causa: FEFO não praticado, sem alerta de vencimento. Implantação de FEFO + planilha de vencimento: custo zero, reduz perda em 70% = economia de R$ 70.700/ano"},
        {"indicador": "Prescrição de genéricos",             "valor": 72.4, "meta": 90.0, "unidade": "%",       "status": "critico", "observacao": "72,4% vs meta 90%. Genérico: mesma eficácia, 30-70% mais barato. 1% de aumento em prescrição de genérico = R$ 2.000-8.000 de economia anual. Auditoria de prescrição: realizada em 8,4% das receitas. Feedback ao prescriptor sobre taxa de genérico: zero implantado"},
        {"indicador": "Automedicação de antimicrobianos",    "valor": 42.4, "meta": 5.0,  "unidade": "%pop",    "status": "critico", "observacao": "42,4% usaram ATM sem receita em 2025. Resistência bacteriana: MRSA crescente no HMM, KPC detectado em 2024. Campanha de educação: R$ 2.400, alcança 80% da população. Fiscalização VISA de farmácias: 1× em 2025 vs mínimo 4× recomendado"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/medicamentos")
def medicamentos():
    return _MEDICAMENTOS()


@router.get("/gestao")
def gestao():
    return _GESTAO()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()