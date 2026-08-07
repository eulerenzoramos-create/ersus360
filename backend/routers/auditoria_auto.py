# backend/routers/auditoria_auto.py — Auditoria Automática Mensal (cron)
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/auditoria-auto", tags=["auditoria-auto"])

@lru_cache(maxsize=1)
def _ITENS_JUL():
    return [
        {"id":"A01","modulo":"SIAPS","descricao":"Taxa de rejeição de lotes no mês","status":"alerta","valor_encontrado":"9.4% na ESF III","valor_esperado":"< 8%","acao_recomendada":"Revisar fichas CDS — campos obrigatórios"},
        {"id":"A02","modulo":"SCNES","descricao":"Profissionais sem registro CNES ativo","status":"critico","valor_encontrado":"1 médico (ESF III)","valor_esperado":"0 pendências","acao_recomendada":"Regularizar CRM e CNES em até 7 dias"},
        {"id":"A03","modulo":"CADSUS","descricao":"CNS inválidos acima do limite","status":"alerta","valor_encontrado":"8.4% nas microáreas rurais","valor_esperado":"< 5%","acao_recomendada":"Mutirão de atualização cadastral agosto"},
        {"id":"A04","modulo":"Previne Brasil","descricao":"Indicadores C/B/M com atingimento < 70%","status":"critico","valor_encontrado":"3 indicadores críticos","valor_esperado":"0 indicadores críticos","acao_recomendada":"Plano de ação 90 dias — reunião de gestão"},
        {"id":"A05","modulo":"RNDS","descricao":"Taxa de erro nos endpoints FHIR R4","status":"ok","valor_encontrado":"2.1% erros/24h","valor_esperado":"< 5%","acao_recomendada":"-"},
        {"id":"A06","modulo":"Financeiro","descricao":"Execução orçamentária do mês","status":"ok","valor_encontrado":"88.8%","valor_esperado":"> 80%","acao_recomendada":"-"},
        {"id":"A07","modulo":"Score de Risco","descricao":"Equipes com piora > 10 pontos","status":"alerta","valor_encontrado":"ESF III: +14 pontos","valor_esperado":"Nenhuma piora > 10 pontos","acao_recomendada":"Acionar plano de apoio técnico — ESF III"},
        {"id":"A08","modulo":"CADSUS","descricao":"Unicidade de CNS — duplicidades ativas","status":"ok","valor_encontrado":"0 duplicidades","valor_esperado":"0","acao_recomendada":"-"},
    ]


@lru_cache(maxsize=1)
def _ITENS_JUN():
    return [
        {"id":"B01","modulo":"SIAPS","descricao":"Taxa de rejeição de lotes no mês","status":"ok","valor_encontrado":"4.2%","valor_esperado":"< 8%","acao_recomendada":"-"},
        {"id":"B02","modulo":"SCNES","descricao":"Profissionais sem registro CNES ativo","status":"ok","valor_encontrado":"0 pendências","valor_esperado":"0 pendências","acao_recomendada":"-"},
        {"id":"B03","modulo":"CADSUS","descricao":"CNS inválidos acima do limite","status":"ok","valor_encontrado":"4.8%","valor_esperado":"< 5%","acao_recomendada":"-"},
        {"id":"B04","modulo":"Previne Brasil","descricao":"Indicadores C/B/M com atingimento < 70%","status":"alerta","valor_encontrado":"2 indicadores","valor_esperado":"0","acao_recomendada":"Foco em C02 e B02"},
        {"id":"B05","modulo":"RNDS","descricao":"Taxa de erro nos endpoints FHIR R4","status":"ok","valor_encontrado":"1.8%","valor_esperado":"< 5%","acao_recomendada":"-"},
        {"id":"B06","modulo":"Financeiro","descricao":"Execução orçamentária do mês","status":"ok","valor_encontrado":"91.2%","valor_esperado":"> 80%","acao_recomendada":"-"},
        {"id":"B07","modulo":"Score de Risco","descricao":"Equipes com piora > 10 pontos","status":"ok","valor_encontrado":"Nenhuma","valor_esperado":"Nenhuma","acao_recomendada":"-"},
        {"id":"B08","modulo":"CADSUS","descricao":"Unicidade de CNS — duplicidades ativas","status":"ok","valor_encontrado":"0","valor_esperado":"0","acao_recomendada":"-"},
    ]


@lru_cache(maxsize=1)
def _EXECUCOES():
    return [
        {
            "id": 3, "competencia": "Julho/2026",
            "inicio": "2026-07-01 06:00", "fim": "2026-07-01 06:12",
            "status": "com_falhas", "total_verificacoes": 8,
            "ok": 4, "alertas": 2, "criticos": 2,
            "disparada_por": "cron", "itens": _ITENS_JUL(),
        },
        {
            "id": 2, "competencia": "Junho/2026",
            "inicio": "2026-06-01 06:00", "fim": "2026-06-01 06:10",
            "status": "concluida", "total_verificacoes": 8,
            "ok": 7, "alertas": 1, "criticos": 0,
            "disparada_por": "cron", "itens": _ITENS_JUN(),
        },
        {
            "id": 1, "competencia": "Maio/2026",
            "inicio": "2026-05-01 06:00", "fim": "2026-05-01 06:09",
            "status": "concluida", "total_verificacoes": 8,
            "ok": 6, "alertas": 2, "criticos": 0,
            "disparada_por": "manual", "itens": [],
        },
    ]


@lru_cache(maxsize=1)
def _CONFIG():
    return {
        "ativo": True,
        "expressao_cron": "0 6 1 * *",
        "descricao_cron": "Todo dia 1º do mês às 06:00 (horário de Manaus)",
        "proxima_execucao": "2026-08-01 06:00",
        "ultima_execucao": "2026-07-01 06:12",
        "total_execucoes": 3,
    }



@router.get("/execucoes")
def listar_execucoes():
    return _EXECUCOES


@router.get("/config")
def obter_config():
    return _CONFIG


@router.post("/disparar")
def disparar():
    return {
        "ok": True,
        "mensagem": "Auditoria manual disparada. Execução iniciada às 2026-07-23 10:00. Resultados disponíveis em ~12 minutos.",
        "id_execucao": 99,
    }


@router.post("/config")
def atualizar_config(body: dict):
    ativo = body.get("ativo", _CONFIG()["ativo"])
    return {
        "ok": True,
        "ativo": ativo,
        "mensagem": f"Cron {'ativado' if ativo else 'pausado'} com sucesso.",
    }
