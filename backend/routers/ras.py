# backend/routers/ras.py — Rede de Atenção à Saúde (RAS) · FMS Apuí
from fastapi import APIRouter

router = APIRouter(prefix="/api/ras", tags=["ras"])

_PONTOS = [
    {
        "id": "P01", "nome": "UBS Centro — ESF I e II", "tipo": "Unidade Básica de Saúde",
        "nivel_atencao": "APS", "municipio": "Apuí", "ativo": True,
        "capacidade_instalada": 1800, "producao_mes": 1420, "ocupacao_pct": 79,
        "indicadores": [
            {"nome": "Cobertura ESF", "valor": "78%", "status": "atencao"},
            {"nome": "Produção ACS", "valor": "85%", "status": "ok"},
            {"nome": "Cito realizado", "valor": "41%", "status": "critico"},
        ],
    },
    {
        "id": "P02", "nome": "UBS Castanhal — ESF III", "tipo": "Unidade Básica de Saúde",
        "nivel_atencao": "APS", "municipio": "Apuí", "ativo": True,
        "capacidade_instalada": 900, "producao_mes": 680, "ocupacao_pct": 76,
        "indicadores": [
            {"nome": "Cobertura ESF", "valor": "72%", "status": "atencao"},
            {"nome": "SCNES conformidade", "valor": "64%", "status": "atencao"},
            {"nome": "Score CADSUS", "valor": "72%", "status": "ok"},
        ],
    },
    {
        "id": "P03", "nome": "UBS Zona Rural — ESF IV", "tipo": "Unidade Básica de Saúde",
        "nivel_atencao": "APS", "municipio": "Apuí — Zona Rural", "ativo": True,
        "capacidade_instalada": 600, "producao_mes": 310, "ocupacao_pct": 52,
        "indicadores": [
            {"nome": "Médico CNES ativo", "valor": "NÃO", "status": "critico"},
            {"nome": "Rejeição SIAPS", "valor": "9.4%", "status": "critico"},
            {"nome": "Score risco ESF", "valor": "85/100", "status": "critico"},
        ],
    },
    {
        "id": "P04", "nome": "UBS Nova Esperança — ESF V", "tipo": "Unidade Básica de Saúde",
        "nivel_atencao": "APS", "municipio": "Apuí — Bairro Nova Esperança", "ativo": True,
        "capacidade_instalada": 750, "producao_mes": 690, "ocupacao_pct": 92,
        "indicadores": [
            {"nome": "Score Previne", "valor": "82%", "status": "ok"},
            {"nome": "SCNES conformidade", "valor": "91%", "status": "ok"},
            {"nome": "CADSUS qualidade", "valor": "88%", "status": "ok"},
        ],
    },
    {
        "id": "P05", "nome": "UPA Centro — Apuí", "tipo": "Unidade de Pronto Atendimento",
        "nivel_atencao": "Urgencia", "municipio": "Apuí", "ativo": True,
        "capacidade_instalada": 600, "producao_mes": 488, "ocupacao_pct": 81,
        "indicadores": [
            {"nome": "Atendimentos/mês", "valor": "488", "status": "ok"},
            {"nome": "Tempo porta-médico", "valor": "22min", "status": "ok"},
            {"nome": "Taxa de internação", "valor": "8.2%", "status": "atencao"},
        ],
    },
    {
        "id": "P06", "nome": "CAPS AD — Centro de Atenção Psicossocial Álcool e Drogas", "tipo": "CAPS AD",
        "nivel_atencao": "RAPS", "municipio": "Apuí", "ativo": True,
        "capacidade_instalada": 120, "producao_mes": 98, "ocupacao_pct": 82,
        "indicadores": [
            {"nome": "Usuários ativos", "valor": "98", "status": "ok"},
            {"nome": "Adesão tratamento", "valor": "74%", "status": "atencao"},
            {"nome": "Internações evitadas", "valor": "12/mês", "status": "ok"},
        ],
    },
    {
        "id": "P07", "nome": "Serviço de Atenção Domiciliar — SAD Apuí", "tipo": "SAD",
        "nivel_atencao": "Domiciliar", "municipio": "Apuí", "ativo": True,
        "capacidade_instalada": 80, "producao_mes": 64, "ocupacao_pct": 80,
        "indicadores": [
            {"nome": "Pacientes em acomp.", "valor": "64", "status": "ok"},
            {"nome": "Visitas/semana", "valor": "192", "status": "ok"},
            {"nome": "Alta por melhora", "valor": "68%", "status": "ok"},
        ],
    },
    {
        "id": "P08", "nome": "LAM — Laboratório Análises Médicas Municipal", "tipo": "Laboratório",
        "nivel_atencao": "MAC", "municipio": "Apuí", "ativo": True,
        "capacidade_instalada": 2000, "producao_mes": 1680, "ocupacao_pct": 84,
        "indicadores": [
            {"nome": "Exames/mês", "valor": "1.680", "status": "ok"},
            {"nome": "Prazo resultado", "valor": "2 dias úteis", "status": "ok"},
            {"nome": "Laudos pendentes", "valor": "38", "status": "atencao"},
        ],
    },
]

_FLUXOS = [
    {"origem":"UBS Centro","destino":"UPA Centro","tipo_fluxo":"Urgência / Crise HAS","volume_mes":48,"tempo_medio_dias":0,"status":"adequado"},
    {"origem":"ESF I–V","destino":"LAM Municipal","tipo_fluxo":"Exames laboratoriais","volume_mes":620,"tempo_medio_dias":2,"status":"adequado"},
    {"origem":"ESF III – Zona Rural","destino":"Hospital Regional AM","tipo_fluxo":"TFD — Ortopedia","volume_mes":12,"tempo_medio_dias":104,"status":"sobrecarregado"},
    {"origem":"ESF I–V","destino":"Clínicas Especializadas Manaus","tipo_fluxo":"Regulação SISREG","volume_mes":38,"tempo_medio_dias":52,"status":"sobrecarregado"},
    {"origem":"UPA Centro","destino":"CAPS AD","tipo_fluxo":"Saúde Mental — Crise","volume_mes":14,"tempo_medio_dias":1,"status":"adequado"},
    {"origem":"ESF V – Ribeirinha","destino":"SAD Apuí","tipo_fluxo":"Alta hospitalar / Domiciliar","volume_mes":6,"tempo_medio_dias":3,"status":"subuti"},
    {"origem":"ESF I–V","destino":"Vigilância em Saúde","tipo_fluxo":"Notificação Compulsória SINAN","volume_mes":49,"tempo_medio_dias":3,"status":"adequado"},
    {"origem":"LAM Municipal","destino":"Hospital Regional AM","tipo_fluxo":"Exames de alta complexidade","volume_mes":22,"tempo_medio_dias":14,"status":"adequado"},
]

_RESUMO = {
    "pontos_rede": len(_PONTOS),
    "aps_credenciadas": len([p for p in _PONTOS if p["nivel_atencao"] == "APS"]),
    "servicos_mac": len([p for p in _PONTOS if p["nivel_atencao"] == "MAC"]),
    "cobertura_populacao_pct": 78.4,
    "producao_total_mes": sum(p["producao_mes"] for p in _PONTOS),
    "servicos_integrados": 6,
    "ultima_atualizacao": "2026-07-23 06:00",
}


@router.get("/resumo")
def resumo():
    return _RESUMO


@router.get("/pontos")
def pontos():
    return _PONTOS


@router.get("/fluxos")
def fluxos():
    return _FLUXOS


@router.post("/gerar-relatorio")
def gerar():
    return {"ok": True, "mensagem": "Relatório RAS gerado. PDF disponível para download em /api/ras/download.", "paginas": 28}
