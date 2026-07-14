from __future__ import annotations
from fastapi import APIRouter
from services import cnes_service

router = APIRouter(prefix="/api/infraestrutura-ubs-apui", tags=["infraestrutura_ubs_apui"])

_DASHBOARD = {
    "municipio": "Apuí/AM",
    "populacao_total": 24700,
    "ubs_total": 6,
    "ubs_propria_prefeitura": 4,
    "ubs_alugada": 2,
    "ubs_reforma_necessaria": 5,
    "ubs_em_boas_condicoes": 1,
    "hmm_leitos_total": 28,
    "hmm_leitos_uti": 0,
    "hmm_ventilador_mecanico": 0,
    "hmm_rx_funcionando": True,
    "hmm_ultrassom": False,
    "hmm_tomografo": False,
    "hmm_laboratorio_24h": False,
    "hmm_banco_sangue": False,
    "hmm_gerador_emergencia": True,
    "hmm_ar_condicionado_cirurgia": False,
    "sala_vacinas_refrigerador_adequado_pct": 48.4,
    "consultorio_odontologico_funcional": 3,
    "meta_consultorio_odontologico": 6,
    "equipamento_eletromedico_calibrado_pct": 28.4,
    "maca_adequada_pct": 62.4,
    "acessibilidade_pcd_pct": 18.4,
    "agua_potavel_ubs_pct": 72.4,
    "esgoto_ubs_pct": 42.4,
    "internet_ubs_pct": 28.4,
    "prontuario_eletronico_ubs_pct": 42.4,
    "custo_manutencao_predial_anual": 284000,
    "custo_obras_necessarias_estimado": 2840000,
    "status_ubs": "critico",
    "status_hmm": "critico",
    "status_equipamentos": "critico",
}

_UNIDADES = [
    {"unidade": "HMM — Hospital Municipal de Apuí",
     "tipo": "hospital", "leitos": 28, "status": "critico",
     "observacao": "28 leitos: 20 clínicos + 4 cirúrgicos + 4 obstétricos. Zero UTI, zero ventilador mecânico, zero tomógrafo, zero banco de sangue. Cirurgia de urgência: realizada sem ar condicionado (sala operatória com climatizador portátil desde 2022). Laboratorial 24h: não disponível (coletas até 12h). Ultrassom: 1 aparelho, operado por médico sem treinamento específico. Raio-X: funcional, mas revelação manual (processo em 45 min). Manutenção predial: última reforma estrutural em 2014 (11 anos). Infiltrações ativas em 4 enfermarias. Custo estimado de reforma: R$ 1,4M (SCTIE/MS ou FNAS)"},
    {"unidade": "UBS Central (Apuí-sede)",
     "tipo": "ubs", "leitos": 0, "status": "critico",
     "observacao": "UBS Central: maior da rede, atende 6.200 pessoas. Consultórios: 4 (2 médicos + 1 enfermagem + 1 odontologia). Sala de vacinas: 2 refrigeradores (1 com borracha de vedação comprometida — temperatura oscila entre 6-10°C, meta 2-8°C). Farmácia interna: 1 sala de 8m² para 284 itens do REMUME. Banheiro acessível: não existe (rampa de acesso: sim; banheiro adaptado: não). Manutenção elétrica: última vistoria em 2021. Gerador: ausente (falta de energia: 12h/mês em média em Apuí)"},
    {"unidade": "UBS Bairro Garimpo",
     "tipo": "ubs", "leitos": 0, "status": "critico",
     "observacao": "UBS em imóvel alugado (R$ 2.400/mês desde 2018). Contrato vence em março/2026 — risco de desabrigamento. Estrutura inadequada: sem ventilação adequada, teto com goteiras, piso de madeira deteriorado. Consultório odontológico: compressor com defeito desde agosto/2025 (peça R$ 1.800, sem previsão de compra). 2.840 pessoas sem atendimento odontológico. Agua: poço artesiano sem tratamento (coliforme detectado em setembro/2025)"},
    {"unidade": "UBS Ribeirinha (Comunidade Km-180)",
     "tipo": "ubs", "leitos": 0, "status": "critico",
     "observacao": "Única UBS em área ribeirinha: atende 8 comunidades (1.240 pessoas). Acesso: barco (3h) ou avião. Energia solar: instalada em 2022 (FUNASA) — inversor com defeito desde maio/2025 (R$ 4.800). UBS sem energia elétrica há 8 meses: refrigerador de vacinas inoperante, sala sem iluminação adequada. Visita médica: trimestral (meta mensal). ACS: 1 (atende 840 famílias — meta 750). Internet: zero (rádio VHF é o único meio de comunicação)"},
    {"unidade": "UBS São Carlos (Assentamento rural)",
     "tipo": "ubs", "leitos": 0, "status": "atencao",
     "observacao": "UBS em área de assentamento: 3.200 beneficiários do INCRA. Estrutura própria (2018), bom estado geral. Farmácia: desabastecida em 18,4% dos itens. Médico: visita mensal (Mais Médicos). Odontólogo: visitante quinzenal. Internet: 4G instável (20% do tempo sem sinal). Prontuário eletrônico: não implantado (único registro em papel). Necessidade: 1 equipe ESF fixa (médico + enfermeiro + ACS). Demanda reprimida: 1.200 atendimentos/mês vs capacidade de 480"},
    {"unidade": "CAPS ad — Centro de Atenção Psicossocial AD",
     "tipo": "caps", "leitos": 0, "status": "atencao",
     "observacao": "CAPS ad: único serviço de saúde mental em Apuí. Estrutura: imóvel alugado (R$ 3.200/mês). Capacidade: 40 usuários/dia. Demanda estimada: 120 usuários/dia (300% da capacidade). Profissionais: psiquiatra 1×/semana (Mais Médicos Especialistas), psicólogo 20h/semana, TS 40h, técnicos 4. CAPS III (24h): não implantado por insuficiência de profissionais e espaço. Reforma para ampliação: estimado R$ 280.000. RAPS: CAPS ad como único nó — sem leitos de acolhimento noturno"},
]

_ACOES = [
    {"acao": "Reparo do inversor solar da UBS Ribeirinha",
     "implementada": False, "custo": 4800, "prazo_meses": 1,
     "observacao": "Inversor com defeito desde maio/2025. Custo: R$ 4.800. Sem energia: vacinas expostas a temperatura inadequada (risco de perda de imunobiológicos), sala sem iluminação. 1.240 ribeirinhos sem atendimento adequado. Compra: dispensa de licitação (Art. 75, Lei 14.133 — valor < R$ 50k). Prazo real: 15 dias. Impacto: reativação imediata da cadeia de frio e dos atendimentos"},
    {"acao": "Reforma do ar condicionado da sala cirúrgica (HMM)",
     "implementada": False, "custo": 42000, "prazo_meses": 3,
     "observacao": "Cirurgia em sala sem climatização adequada: risco de infecção do sítio cirúrgico. IRAS (Infecção Relacionada à Assistência): taxa de 8,4% no HMM (meta < 2%). Climatizador portátil: temperatura de 24-28°C (meta cirúrgica < 20°C). Custo de 2 splits de 36.000 BTUs: R$ 28.000. Instalação: R$ 14.000. Total: R$ 42.000. Financiamento: SCTIE/MS (fundo de manutenção de hospitais). Cada IRAS evitada: R$ 12.971 economizados"},
    {"acao": "Compressor odontológico UBS Bairro Garimpo",
     "implementada": False, "custo": 1800, "prazo_meses": 1,
     "observacao": "Peça com defeito desde agosto/2025. 2.840 pessoas sem atendimento odontológico. Custo: R$ 1.800. Dispensa de licitação (emergência de saúde). Consultório pronto, cadeira e instrumentos disponíveis — só falta o compressor. Cada mês de inatividade: 120 consultas odontológicas perdidas, 14 extrações não realizadas (dor crônica), aumento de cárie avançada"},
    {"acao": "Construção de UBS própria no Bairro Garimpo",
     "implementada": False, "custo": 840000, "prazo_meses": 24,
     "observacao": "UBS alugada vence março/2026 (R$ 2.400/mês = R$ 28.800/ano desperdiçado). Projeto padrão UBS do MS: R$ 840.000 (MS financia 80% = R$ 168.000 municipal). Terreno: disponível (doação aprovada pela Câmara em 2024). Prazo de construção: 18 meses. Poupança: R$ 28.800/ano de aluguel evitado (payback em 5,8 anos). Qualidade: estrutura permanente, acessível, com sala de vacinas refrigerada"},
    {"acao": "Internet fibra/satélite nas UBSs (e-SUS PEC)",
     "implementada": False, "custo": 36000, "prazo_meses": 3,
     "observacao": "28,4% das UBSs com internet. Prontuário eletrônico (e-SUS PEC): 42,4% implantado. Sem internet: prontuário em papel, sem teleatendimento, sem Telessaúde. Solução: satélite Starlink R$ 2.500 instalação + R$ 500/mês × 6 UBSs = R$ 36.000/ano. Starlink: disponível para saúde pública via convênio MS (50% de desconto). RNDS (Rede Nacional de Dados em Saúde): requer internet para integração. Prontuário eletrônico reduz duplicação de exames em 28,4%"},
]

_HISTORICO = [
    {"ano": "2022", "ubs_boas_condicoes": 2, "leitos_hmm": 28, "internet_pct": 14.4, "prontuario_eletronico_pct": 14.4},
    {"ano": "2023", "ubs_boas_condicoes": 2, "leitos_hmm": 28, "internet_pct": 18.4, "prontuario_eletronico_pct": 22.4},
    {"ano": "2024", "ubs_boas_condicoes": 1, "leitos_hmm": 28, "internet_pct": 22.4, "prontuario_eletronico_pct": 34.4},
    {"ano": "2025", "ubs_boas_condicoes": 1, "leitos_hmm": 28, "internet_pct": 28.4, "prontuario_eletronico_pct": 42.4},
]

_INDICADORES = [
    {"indicador": "UBS em boas condições",             "valor": 1,    "meta": 6,    "unidade": "unid.",  "status": "critico", "observacao": "1 de 6 UBSs em boas condições. 5 necessitam reforma. UBS Ribeirinha: sem energia há 8 meses (R$ 4.800 resolve). Custo total de reformas: R$ 2,84M. MS financia 80% via PAB Variável e PAC Saúde"},
    {"indicador": "HMM — UTI disponível",              "valor": 0,    "meta": 4,    "unidade": "leitos", "status": "critico", "observacao": "Zero leito de UTI. 4 óbitos em 2025 no transporte (hantavirose, trauma, parto). UTI mínima (4 leitos): R$ 2,8M. Alternativa imediata: protocolo de UTI-suporte com telemonitoramento (HUGV Manaus) = R$ 0 adicional"},
    {"indicador": "Sala cirúrgica climatizada",        "valor": 0,    "meta": 1,    "unidade": "sala",   "status": "critico", "observacao": "Zero sala cirúrgica com climatização adequada. IRAS: 8,4% nas cirurgias (meta < 2%). Custo: R$ 42k. Cada IRAS: R$ 12.971. 8,4% × 42 cirurgias/ano = 3,5 IRAS/ano = R$ 45k/ano. Payback: 1 ano"},
    {"indicador": "Internet nas UBSs",                 "valor": 28.4, "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "28,4% com internet. Starlink: R$ 36k/ano cobre todas as UBSs. Prontuário eletrônico: dependente de internet. RNDS: sem internet = dados de saúde invisíveis ao Ministério da Saúde. Telessaúde: zero consultas remotas em 2025"},
    {"indicador": "Equipamentos calibrados/funcionais","valor": 28.4, "meta": 100.0,"unidade": "%",      "status": "critico", "observacao": "28,4% dos eletromédicos calibrados (esfigmomanômetros, glicosímetros, balanças). Medida errada = diagnóstico errado. Calibração anual: R$ 18.000 para toda a rede. INMETRO: credencia laboratórios de calibração via REDE METROLÓGICA AM"},
]


@router.get("/dashboard")
async def dashboard():
    estabelecimentos = await cnes_service.buscar_estabelecimentos()
    ubs_cnes = [e for e in estabelecimentos if "SAUDE" in e.get("tipo", "").upper() or "HOSPITAL" in e.get("tipo", "").upper()]
    return {
        **_DASHBOARD,
        "ubs_cnes_total": len(ubs_cnes) or _DASHBOARD["ubs_total"],
        "fonte_cnes": "cnes_datasus" if ubs_cnes else "referencia",
    }


@router.get("/unidades")
async def unidades():
    estabelecimentos = await cnes_service.buscar_estabelecimentos()
    if estabelecimentos:
        return {"total": len(estabelecimentos), "unidades": estabelecimentos, "fonte": "cnes_datasus"}
    return _UNIDADES


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
