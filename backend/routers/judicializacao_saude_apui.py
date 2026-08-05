from fastapi import APIRouter
from functools import lru_cache
router = APIRouter(prefix="/api/judicializacao-saude-apui", tags=["Judicialização em Saúde Apuí"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "processos_ativos_2025": 84,
        "processos_novos_2025": 48,
        "processos_encerrados_2025": 28,
        "cumprimento_judicial_em_dia_pct": 72.4,
        "descumprimento_multas_2025_r": 48000,
        "gasto_judicializacao_2025_r": 384000,
        "gasto_judicializacao_orcamento_saude_pct": 4.2,
        "medicamentos_demandados_distintos": 38,
        "medicamentos_lista_sus_pct": 28.6,
        "medicamentos_fora_lista_pct": 71.4,
        "cirurgias_judiciais_pendentes": 12,
        "internacoes_judiciais_ativas": 8,
        "representacao_juridica_gratuita_pct": 84.2,
        "nap_nudjus_resposta_media_dias": 18,
        "status_cumprimento": "atencao",
        "status_financeiro": "critico",
        "status_medicamentos": "critico",
    }


@lru_cache(maxsize=1)
def _PROCESSOS_POR_CATEGORIA():
    return [
        {"categoria":"Medicamentos fora do RENAME/REMUME","processos":48,"valor_mensal_r":18400,"complexidade":"alta",  "status":"critico","principais":"Adalimumabe, Tofacitinibe, Trastuzumabe, enzimas para doenças raras"},
        {"categoria":"Cirurgias eletivas com longa espera","processos":12,"valor_mensal_r":8400, "complexidade":"alta",  "status":"atencao","principais":"Ortopedia (joelho/quadril), Colecistectomia, Catarata"},
        {"categoria":"Internação / vaga hospitalar",       "processos":8, "valor_mensal_r":6200, "complexidade":"alta",  "status":"atencao","principais":"Leito UTI, leito psiquiátrico, leito reabilitação"},
        {"categoria":"Exames diagnósticos (TC/RM/PET)",    "processos":10,"valor_mensal_r":3800, "complexidade":"media", "status":"atencao","principais":"TC sem equipamento local, RM, PET-Scan oncológico"},
        {"categoria":"Tratamento oncológico",              "processos":4, "valor_mensal_r":12800,"complexidade":"alta",  "status":"critico","principais":"Quimioterapia, imunoterapia, radioterapia em Manaus"},
        {"categoria":"Insumos para diabetes",              "processos":2, "valor_mensal_r":1800, "complexidade":"baixa","status":"ok",     "principais":"Sensor de glicose contínuo, caneta insulina"},
    ]


@lru_cache(maxsize=1)
def _MEDICAMENTOS_JUDICIAIS():
    return [
        {"medicamento":"Adalimumabe 40mg/0,4mL","indicacao":"Artrite reumatoide","lista_sus":"Não","custo_mensal_r":4200,"processos":8, "alternativa_sus":"Metotrexate + sulfassalazina — tentativa documentada"},
        {"medicamento":"Tofacitinibe 5mg","indicacao":"Artrite reumatoide grave","lista_sus":"Não","custo_mensal_r":3800,"processos":6, "alternativa_sus":"Biologicos SUS não disponíveis em Apuí"},
        {"medicamento":"Trastuzumabe","indicacao":"Ca mama HER2+","lista_sus":"Sim (APAC)","custo_mensal_r":8400,"processos":4,"alternativa_sus":"Acesso via APAC/ALTA — demora >60 dias"},
        {"medicamento":"Idursulfase (enzima)","indicacao":"Síndrome de Hunter","lista_sus":"Sim (CEAF)","custo_mensal_r":28000,"processos":2,"alternativa_sus":"CEAF em Manaus — distância 784 km"},
        {"medicamento":"Sensor glicose contínuo","indicacao":"DM1 — hipoglicemias graves","lista_sus":"Não","custo_mensal_r":900,"processos":2,"alternativa_sus":"Glicosímetro convencional insuficiente"},
        {"medicamento":"Oxcarbazepina 600mg","indicacao":"Epilepsia refratária","lista_sus":"Não","custo_mensal_r":280,"processos":4, "alternativa_sus":"Carbamazepina falhou — documentado"},
        {"medicamento":"Sildenafila 20mg (HP)","indicacao":"Hipertensão pulmonar","lista_sus":"Sim (CEAF)","custo_mensal_r":1200,"processos":3,"alternativa_sus":"CEAF — demora 90+ dias para habilitação"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano":"2022","processos_novos":28,"gasto_r":184000,"medicamentos_fora_lista_pct":62.4,"cumprimento_pct":82.4},
        {"ano":"2023","processos_novos":34,"gasto_r":248000,"medicamentos_fora_lista_pct":66.8,"cumprimento_pct":78.4},
        {"ano":"2024","processos_novos":42,"gasto_r":312000,"medicamentos_fora_lista_pct":69.4,"cumprimento_pct":74.2},
        {"ano":"2025","processos_novos":48,"gasto_r":384000,"medicamentos_fora_lista_pct":71.4,"cumprimento_pct":72.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador":"Gastos Judicialização / Orçamento Saúde","valor":"4,2% (R$ 384k)","meta":"< 2%","status":"critico","obs":"Crescimento de 109% em 3 anos. Tendência de expansão — sem NAT/NAJ estruturado para defesa extrajudicial. R$ 384k consumidos de recursos não planejados, impactando ações de vigilância e atenção básica"},
        {"indicador":"Medicamentos Fora do RENAME/REMUME",    "valor":"71,4%",          "meta":"< 30%","status":"critico","obs":"7 em cada 10 processos pedem medicamento sem evidência suficiente para inclusão na lista ou com alternativa terapêutica disponível não tentada. Ausência de comitê de análise técnica de prescrições judiciais"},
        {"indicador":"Cumprimento Judicial em Dia",           "valor":"72,4%",          "meta":"≥ 95%","status":"atencao","obs":"27,6% em atraso — multas de R$ 48k em 2025. Principal causa: medicamento importado com prazo de entrega superior ao prazo judicial de 48h. Sem estoque estratégico de medicamentos judicializados"},
        {"indicador":"Resposta NAP/NUDJUS",                  "valor":"18 dias",         "meta":"≤ 5 dias","status":"atencao","obs":"Município sem NATjus próprio — depende de estrutura estadual em Manaus. 18 dias de resposta média inviabiliza defesa em prazo judicial de 48h"},
        {"indicador":"Processos por Alternativa SUS não Tentada","valor":"38 de 48 analisados","meta":"0","status":"critico","obs":"79% dos processos têm alternativa terapêutica no SUS documentada mas não tentada ou não disponível localmente. Ausência de protocolos clínicos atualizados na APS favorece escalada direta para judicial"},
    ]


@router.get("/dashboard")
def dashboard(): return _DASHBOARD

@router.get("/processos-categoria")
def processos_categoria(): return _PROCESSOS_POR_CATEGORIA

@router.get("/medicamentos-judiciais")
def medicamentos(): return _MEDICAMENTOS_JUDICIAIS

@router.get("/historico")
def historico(): return _HISTORICO

@router.get("/indicadores")
def indicadores(): return _INDICADORES
