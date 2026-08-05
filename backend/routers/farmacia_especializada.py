"""
Farmácia Especializada / Alto Custo — Apuí/AM
CEAF · RENAME · Componente Especializado · Judicialização
Portaria GM/MS nº 1.554/2013 (CEAF)
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/farmacia-especializada", tags=["Farmácia Especializada"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "competencia": "Mar/2026",
        "pacientes_ceaf": 87,
        "medicamentos_ativos": 24,
        "demandas_judiciais_ativas": 6,
        "demandas_judiciais_status": "atencao",
        "renovacoes_vencer_30d": 11,
        "renovacoes_status": "atencao",
        "gasto_mes": 28640.0,
        "gasto_federal_pct": 68.2,
    }


@lru_cache(maxsize=1)
def _MEDICAMENTOS():
    return [
        {"medicamento":"Adalimumabe 40mg/0,8mL (AR/Psoríase)",  "componente":"Especializado A1","pacientes":4, "custo_mes":8420.0,"estoque_doses":48, "status":"ok"},
        {"medicamento":"Etanercepte 50mg (AR/Espondilite)",      "componente":"Especializado A1","pacientes":2, "custo_mes":6240.0,"estoque_doses":24, "status":"ok"},
        {"medicamento":"Levodopa+Carbidopa (Parkinson)",         "componente":"Especializado B1","pacientes":7, "custo_mes":1820.0,"estoque_doses":840,"status":"ok"},
        {"medicamento":"Clozapina 100mg (Esquizofrenia refrat.)","componente":"Especializado B1","pacientes":3, "custo_mes":960.0, "estoque_doses":270,"status":"ok"},
        {"medicamento":"Metotrexato inj. (AR grave)",            "componente":"Especializado B1","pacientes":5, "custo_mes":1240.0,"estoque_doses":120,"status":"ok"},
        {"medicamento":"Tacrolimo 1mg (Transplante renal)",      "componente":"Especializado A1","pacientes":1, "custo_mes":2180.0,"estoque_doses":90, "status":"ok"},
        {"medicamento":"Imatinibe 400mg (LMC)",                  "componente":"Especializado A1","pacientes":1, "custo_mes":3640.0,"estoque_doses":30, "status":"atencao","alerta":"Estoque para <15 dias — solicitar urgente"},
        {"medicamento":"Insulina glargina 100UI/mL",             "componente":"Especializado B2","pacientes":12,"custo_mes":2880.0,"estoque_doses":360,"status":"ok"},
        {"medicamento":"Salmeterol/Fluticasona (DPOC grave)",    "componente":"Especializado B2","pacientes":8, "custo_mes":1640.0,"estoque_doses":240,"status":"ok"},
        {"medicamento":"Omalizumabe 150mg (Asma grave)",         "componente":"Especializado A1","pacientes":2, "custo_mes":4820.0,"estoque_doses":16, "status":"atencao","alerta":"Requer autorização prévia renovada"},
    ]


@lru_cache(maxsize=1)
def _JUDICIALIZACOES():
    return [
        {"id":"JUD-001","medicamento":"Tofacitinibe 5mg (AR)","valor_mes":2840.0,"fase":"Em andamento","origem":"Defensoria Pública","data_inicio":"Set/25","alerta":"Medicamento sem protocolo CEAF — impacto financeiro"},
        {"id":"JUD-002","medicamento":"Dupilumabe 300mg (Dermatite atópica)","valor_mes":6420.0,"fase":"Sentença favorável","origem":"Advocacia particular","data_inicio":"Jul/25","alerta":"Decisão obriga fornecimento — sem previsão RENAME"},
        {"id":"JUD-003","medicamento":"Secukinumabe 150mg (Psoríase)","valor_mes":4280.0,"fase":"Em andamento","origem":"Defensoria Pública","data_inicio":"Nov/25","alerta":None},
        {"id":"JUD-004","medicamento":"Enzima alglucosidase alfa (Pompe)","valor_mes":18400.0,"fase":"Em andamento","origem":"Ministério Público","data_inicio":"Jan/26","alerta":"Doença rara — custo crítico ao município"},
        {"id":"JUD-005","medicamento":"Sitagliptina 100mg (DM2)","valor_mes":480.0,"fase":"Recurso","origem":"Advocacia particular","data_inicio":"Out/25","alerta":None},
        {"id":"JUD-006","medicamento":"Rivaroxabana 20mg (FA/TEV)","valor_mes":620.0,"fase":"Em andamento","origem":"Defensoria Pública","data_inicio":"Fev/26","alerta":"Alternativa no RENAME disponível — contestar"},
    ]


@lru_cache(maxsize=1)
def _RENOVACOES():
    return [
        {"paciente":"PAC-CEAF-012","medicamento":"Levodopa+Carbidopa","vencimento":"Abr/26","dias_restantes":18,"status":"urgente"},
        {"paciente":"PAC-CEAF-031","medicamento":"Clozapina 100mg","vencimento":"Abr/26","dias_restantes":22,"status":"urgente"},
        {"paciente":"PAC-CEAF-007","medicamento":"Etanercepte 50mg","vencimento":"Abr/26","dias_restantes":24,"status":"urgente"},
        {"paciente":"PAC-CEAF-044","medicamento":"Insulina glargina","vencimento":"Abr/26","dias_restantes":26,"status":"urgente"},
        {"paciente":"PAC-CEAF-019","medicamento":"Metotrexato inj.","vencimento":"Mai/26","dias_restantes":32,"status":"atencao"},
        {"paciente":"PAC-CEAF-058","medicamento":"Salmeterol/Fluticasona","vencimento":"Mai/26","dias_restantes":35,"status":"atencao"},
        {"paciente":"PAC-CEAF-003","medicamento":"Adalimumabe 40mg","vencimento":"Mai/26","dias_restantes":38,"status":"atencao"},
        {"paciente":"PAC-CEAF-022","medicamento":"Omalizumabe 150mg","vencimento":"Mai/26","dias_restantes":41,"status":"atencao"},
    ]


@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD

@router.get("/medicamentos")
async def medicamentos():
    return _MEDICAMENTOS

@router.get("/judicializacoes")
async def judicializacoes():
    return _JUDICIALIZACOES

@router.get("/renovacoes")
async def renovacoes():
    return _RENOVACOES
