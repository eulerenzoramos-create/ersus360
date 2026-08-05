from fastapi import APIRouter
from functools import lru_cache
router = APIRouter(prefix="/api/farmacovigilancia-apui", tags=["Farmacovigilância Apuí"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "notificacoes_ram_2025": 48,
        "notificacoes_meta_2025": 60,
        "notificacoes_graves_2025": 12,
        "notificacoes_leves_moderadas_2025": 36,
        "medicamentos_envolvidos_distintos": 28,
        "investigacoes_concluidas_pct": 87.5,
        "desvios_qualidade_notificados": 8,
        "medicamentos_recolhidos_anvisa_2025": 3,
        "alertas_anvisa_recebidos_2025": 22,
        "alertas_anvisa_verificados_pct": 86.4,
        "profissionais_treinados_farmacovig_pct": 48.4,
        "unidades_com_formulario_ram": 7,
        "unidades_total": 9,
        "interacoes_medicamentosas_detectadas": 184,
        "polifarmacia_pacientes_monitorados": 124,
        "status_notificacao": "atencao",
        "status_alertas": "atencao",
        "status_qualidade": "ok",
    }


@lru_cache(maxsize=1)
def _RAMS():
    return [
        {"id":"RAM-2025-001","medicamento":"Metformina 850mg","ram":"Acidose lática","gravidade":"grave","desfecho":"Hospitalização","notificante":"Médico UBS Centro","data":"2025-02-14","investigacao":"Concluída — paciente com IR não identificada","acao":"Ajuste de dose; alerta prescritores"},
        {"id":"RAM-2025-002","medicamento":"Anlodipino 5mg","ram":"Edema periférico grave","gravidade":"moderada","desfecho":"Internação ambulatorial","notificante":"Enfermeiro","data":"2025-03-08","investigacao":"Concluída","acao":"Troca de anti-hipertensivo"},
        {"id":"RAM-2025-003","medicamento":"Amoxicilina 500mg","ram":"Reação anafilática","gravidade":"grave","desfecho":"Atendimento UPA — recuperado","notificante":"Médico UPA","data":"2025-03-22","investigacao":"Concluída","acao":"Registro de alergia em prontuário"},
        {"id":"RAM-2025-004","medicamento":"Ivermectina 6mg","ram":"Síndrome de Mazzotti","gravidade":"moderada","desfecho":"Recuperação completa","notificante":"Agente de saúde","data":"2025-04-11","investigacao":"Concluída — uso em carga parasitária alta","acao":"Protocolo de dose fracionada"},
        {"id":"RAM-2025-005","medicamento":"Sulfato ferroso 40mg","ram":"Intolerância gastrointestinal","gravidade":"leve","desfecho":"Abandono de tratamento","notificante":"Farmacêutico","data":"2025-05-03","investigacao":"Concluída","acao":"Orientação ingestão com alimentos"},
        {"id":"RAM-2025-006","medicamento":"Ceftriaxona 1g IV","ram":"Pseudolitíase biliar","gravidade":"moderada","desfecho":"Suspensão e resolução espontânea","notificante":"Médico UPA","data":"2025-05-18","investigacao":"Em andamento","acao":"Suspensão do medicamento"},
        {"id":"RAM-2025-007","medicamento":"Hidroxicloroquina 400mg","ram":"Alteração visual","gravidade":"grave","desfecho":"Encaminhamento oftalmologia","notificante":"Médico","data":"2025-06-02","investigacao":"Em andamento","acao":"Suspensão; avaliação oftalmológica urgente"},
        {"id":"RAM-2025-008","medicamento":"Haloperidol 5mg","ram":"Distonia aguda","gravidade":"grave","desfecho":"Revertida com biperideno","notificante":"Enfermeiro CAPS","data":"2025-06-20","investigacao":"Concluída","acao":"Ajuste posológico; biperideno disponível"},
    ]


@lru_cache(maxsize=1)
def _DESVIOS_QUALIDADE():
    return [
        {"lote":"DQ-2025-01","medicamento":"Amoxicilina 500mg cap","problema":"Cápsula com odor alterado — suspeita de degradação","fornecedor":"Furp","lote_fab":"FAB2024089","acao":"Quarentena + notificação NOTIVISA","status":"recolhido"},
        {"lote":"DQ-2025-02","medicamento":"Insulina NPH 100UI","problema":"Flaconetes com turbidez fora do padrão","fornecedor":"Biobrás","lote_fab":"INS202411B","acao":"Suspensão imediata + comunicação SESA-AM","status":"recolhido"},
        {"lote":"DQ-2025-03","medicamento":"Digoxina 0,25mg comp","problema":"Frasco aberto recebido no almoxarifado","fornecedor":"Distribuidora local","lote_fab":"DIG20241204","acao":"Devolução + registro de irregularidade","status":"devolvido"},
        {"lote":"DQ-2025-04","medicamento":"Ácido fólico 5mg","problema":"Comprimidos fragmentados — transporte inadequado","fornecedor":"CEMEAM","lote_fab":"AFO202503","acao":"Notificação ao CEMEAM; substituição de lote","status":"substituido"},
        {"lote":"DQ-2025-05","medicamento":"Dipirona 500mg/mL amp","problema":"Partículas visíveis na solução","fornecedor":"Farmácia popular local","lote_fab":"DIP20250212","acao":"Recolhimento; notificação VISA municipal","status":"recolhido"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano":"2022","rams":28,"graves":6,"desvios":4,"alertas_recebidos":14,"treinados_pct":28.4},
        {"ano":"2023","rams":34,"graves":8,"desvios":5,"alertas_recebidos":16,"treinados_pct":34.2},
        {"ano":"2024","rams":42,"graves":10,"desvios":7,"alertas_recebidos":19,"treinados_pct":42.4},
        {"ano":"2025","rams":48,"graves":12,"desvios":8,"alertas_recebidos":22,"treinados_pct":48.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador":"Notificações RAM / Meta",                "valor":"48/60 (80%)",  "meta":"≥ 60/ano",  "status":"atencao","obs":"Subnotificação estimada em 70-80% — cultura de notificação fraca. Profissionais não reconhecem RAM como evento notificável obrigatório. Formulário NOTIVISA não disponível em todas as UBS"},
        {"indicador":"RAM Graves",                             "valor":"12 (25%)",     "meta":"< 10%",     "status":"critico","obs":"1 a cada 4 notificações é grave. Polifarmácia em idosos (124 pacientes) e automedicação com ivermectina e antibióticos são fatores de risco locais"},
        {"indicador":"Alertas ANVISA Verificados",             "valor":"86,4%",        "meta":"100%",      "status":"atencao","obs":"3 alertas não verificados — principalmente por falta de acesso ao sistema NOTIVISA e sobrecarga do farmacêutico (1 profissional para 9 unidades)"},
        {"indicador":"Profissionais Treinados Farmacovigilância","valor":"48,4%",      "meta":"≥ 80%",     "status":"atencao","obs":"Treinamento feito apenas em capacitações pontuais. Médicos e enfermeiros das UBS rurais nunca participaram de treinamento de farmacovigilância"},
        {"indicador":"Interações Medicamentosas Detectadas",   "valor":"184 pacientes","meta":"Redução 20%","status":"atencao","obs":"Detecção manual — sem sistema de alerta de interação integrado ao prontuário. Principal risco: anticoagulante + AINE, hipoglicemiante + álcool (garimpo)"},
        {"indicador":"Desvios de Qualidade Notificados",       "valor":"8",            "meta":"≥ 10/ano",  "status":"atencao","obs":"Subnotificação de desvios — equipes não reconhecem produto com alteração visual como desvio notificável. 3 recolhimentos por alerta ANVISA em 2025"},
    ]


@router.get("/dashboard")
def dashboard(): return _DASHBOARD

@router.get("/rams")
def rams(): return _RAMS

@router.get("/desvios-qualidade")
def desvios(): return _DESVIOS_QUALIDADE

@router.get("/historico")
def historico(): return _HISTORICO

@router.get("/indicadores")
def indicadores(): return _INDICADORES
