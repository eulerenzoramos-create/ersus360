"""
Router: /api/rdqa — Relatório Detalhado Quadrimestral de Ações (RDQA)
Geração automática do relatório obrigatório para apresentação ao CMS
a cada 4 meses (jan-abr / mai-ago / set-dez).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/rdqa", tags=["RDQA"])

_QUADRIMESTRES = {
    1: {"label": "1º Quadrimestre", "meses": "Janeiro – Abril",  "prazo_apresentacao": "2026-05-30"},
    2: {"label": "2º Quadrimestre", "meses": "Maio – Agosto",    "prazo_apresentacao": "2026-09-30"},
    3: {"label": "3º Quadrimestre", "meses": "Setembro – Dez.",  "prazo_apresentacao": "2027-01-30"},
}

def _quad_atual(d: date) -> int:
    return 1 if d.month <= 4 else (2 if d.month <= 8 else 3)


# ── Dados de referência ───────────────────────────────────────────────────────

_ACOES_EXECUTADAS = [
    {
        "eixo": "Atenção Primária",
        "acoes": [
            {"codigo": "APS.001", "descricao": "Manutenção das 3 equipes ESF", "meta_fisica": 3, "realizado": 3, "pct": 100, "status": "Concluído"},
            {"codigo": "APS.002", "descricao": "Aquisição de equipamentos para UBS", "meta_fisica": 100, "realizado": 40, "pct": 40, "status": "Em execução"},
            {"codigo": "APS.003", "descricao": "Capacitação das equipes ESF/NASF", "meta_fisica": 4, "realizado": 2, "pct": 50, "status": "Em execução"},
        ],
    },
    {
        "eixo": "Assistência Farmacêutica",
        "acoes": [
            {"codigo": "FAR.001", "descricao": "Abastecimento Farmácia Popular", "meta_fisica": 100, "realizado": 28, "pct": 28, "status": "Crítico"},
            {"codigo": "FAR.002", "descricao": "Renovação contrato distribuidora", "meta_fisica": 1, "realizado": 1, "pct": 100, "status": "Concluído"},
        ],
    },
    {
        "eixo": "Vigilância em Saúde",
        "acoes": [
            {"codigo": "VIG.001", "descricao": "Controle da malária — IPA", "meta_fisica": 1, "realizado": 1, "pct": 75, "status": "Em execução"},
            {"codigo": "VIG.002", "descricao": "Vacinação de rotina crianças", "meta_fisica": 95, "realizado": 87, "pct": 92, "status": "Em execução"},
            {"codigo": "VIG.003", "descricao": "Visitas VISA às unidades de saúde", "meta_fisica": 4, "realizado": 2, "pct": 50, "status": "Em execução"},
        ],
    },
    {
        "eixo": "Média e Alta Complexidade",
        "acoes": [
            {"codigo": "MAC.001", "descricao": "Execução MAC — ambulatório especializado", "meta_fisica": 100, "realizado": 41, "pct": 41, "status": "Crítico"},
            {"codigo": "MAC.002", "descricao": "Regulação de consultas e exames TFD", "meta_fisica": 200, "realizado": 87, "pct": 44, "status": "Crítico"},
        ],
    },
    {
        "eixo": "Gestão e Infraestrutura",
        "acoes": [
            {"codigo": "GES.001", "descricao": "Envio SIOPS 1º Quad.", "meta_fisica": 1, "realizado": 1, "pct": 100, "status": "Concluído"},
            {"codigo": "GES.002", "descricao": "Manutenção veículos da saúde", "meta_fisica": 100, "realizado": 60, "pct": 60, "status": "Em execução"},
            {"codigo": "GES.003", "descricao": "Elaboração PAS 2027", "meta_fisica": 1, "realizado": 0, "pct": 0, "status": "Não iniciado"},
        ],
    },
]

_INDICADORES_PREVINE = [
    {"numero": 1, "nome": "Pré-natal ≥ 6 consultas",        "resultado": 84.4,  "meta": 60.0,  "status": "verde"},
    {"numero": 2, "nome": "Citopatológico do colo do útero", "resultado": 43.0,  "meta": 60.0,  "status": "vermelho"},
    {"numero": 3, "nome": "Vacinação DTP/Penta",             "resultado": 82.9,  "meta": 95.0,  "status": "amarelo"},
    {"numero": 4, "nome": "Consulta RN 1ª semana",          "resultado": 91.1,  "meta": 60.0,  "status": "verde"},
    {"numero": 5, "nome": "HAS acompanhada",                 "resultado": 79.0,  "meta": 70.0,  "status": "verde"},
    {"numero": 6, "nome": "DM com HbA1c solicitada",         "resultado": 62.7,  "meta": 55.0,  "status": "verde"},
    {"numero": 7, "nome": "Obesidade infantil IMC",          "resultado": 55.7,  "meta": 55.0,  "status": "verde"},
]

_FINANCEIRO = {
    "receita_prevista":   18_540_000.0,
    "receita_realizada":  9_270_000.0,
    "despesa_prevista":   18_540_000.0,
    "despesa_realizada":  6_845_200.0,
    "execucao_pct":       73.8,
    "fns_recebido":       2_300_000.0,
    "proprio_saude_pct":  17.16,
    "proprio_saude_meta": 15.0,
    "blocos": [
        {"bloco": "Atenção Básica (AB)",             "previsto": 890_000, "realizado": 695_000, "pct": 78.1},
        {"bloco": "Média e Alta Complexidade (MAC)", "previsto": 480_000, "realizado": 196_800, "pct": 41.0},
        {"bloco": "Vigilância em Saúde (VIGI)",      "previsto": 320_000, "realizado": 249_600, "pct": 78.0},
        {"bloco": "Farmácia (FAF)",                  "previsto": 610_000, "realizado": 173_240, "pct": 28.4},
    ],
}

_ALERTAS_GESTAO = [
    {"nivel": "CRITICO", "titulo": "Execução MAC abaixo de 50%", "acao": "Contatar operadora UNIMED para regularização dos repasses ambulatoriais"},
    {"nivel": "CRITICO", "titulo": "Citopatológico: apenas 43% da meta", "acao": "Iniciar busca ativa via ACS para 678 mulheres elegíveis pendentes"},
    {"nivel": "AVISO",   "titulo": "Farmácia Popular: 28,4% de execução", "acao": "Regularizar estoque crítico de Losartana e Metformina"},
    {"nivel": "AVISO",   "titulo": "Cobertura ESF: 68,4% (meta 100%)", "acao": "Processo seletivo para 4ª equipe ESF — zona rural"},
]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/gerar")
async def gerar_rdqa(
    quadrimestre: int = Query(2, ge=1, le=3),
    ano: int = Query(2026),
    _: UserOut = Depends(get_current_user),
):
    """Gera o RDQA completo para apresentação ao Conselho Municipal de Saúde."""
    quad = _QUADRIMESTRES[quadrimestre]
    hoje = date.today()

    # Totais de ações
    total_acoes = sum(len(e["acoes"]) for e in _ACOES_EXECUTADAS)
    concluidas  = sum(sum(1 for a in e["acoes"] if a["status"] == "Concluído") for e in _ACOES_EXECUTADAS)
    criticas    = sum(sum(1 for a in e["acoes"] if a["status"] == "Crítico")   for e in _ACOES_EXECUTADAS)
    pct_medio   = round(sum(a["pct"] for e in _ACOES_EXECUTADAS for a in e["acoes"]) / total_acoes, 1)

    # Previne
    prev_verde    = sum(1 for i in _INDICADORES_PREVINE if i["status"] == "verde")
    prev_vermelho = sum(1 for i in _INDICADORES_PREVINE if i["status"] == "vermelho")

    return {
        "municipio": "Apuí",
        "uf": "AM",
        "ibge": "1300144",
        "ano": ano,
        "quadrimestre": quadrimestre,
        "quadrimestre_label": quad["label"],
        "periodo_meses": quad["meses"],
        "prazo_apresentacao": quad["prazo_apresentacao"],
        "gerado_em": datetime.utcnow().isoformat() + "Z",
        "gerado_por": "ERSUS 360 — Sistema Automático",

        # Resumo executivo
        "resumo": {
            "total_acoes": total_acoes,
            "concluidas": concluidas,
            "em_execucao": total_acoes - concluidas - criticas,
            "criticas": criticas,
            "pct_execucao_medio": pct_medio,
            "previne_verdes": prev_verde,
            "previne_vermelhos": prev_vermelho,
            "financeiro_execucao_pct": _FINANCEIRO["execucao_pct"],
            "proprio_saude_pct": _FINANCEIRO["proprio_saude_pct"],
            "proprio_saude_ok": _FINANCEIRO["proprio_saude_pct"] >= _FINANCEIRO["proprio_saude_meta"],
        },

        # Ações por eixo
        "eixos": _ACOES_EXECUTADAS,

        # Previne Brasil
        "previne_brasil": {
            "indicadores": _INDICADORES_PREVINE,
            "total_verde": prev_verde,
            "total_vermelho": prev_vermelho,
            "total_amarelo": len(_INDICADORES_PREVINE) - prev_verde - prev_vermelho,
        },

        # Financeiro
        "financeiro": _FINANCEIRO,

        # Alertas para CMS
        "alertas_gestao": _ALERTAS_GESTAO,

        # Próximos passos
        "proximos_passos": [
            f"Apresentar RDQA ao CMS até {quad['prazo_apresentacao']}",
            "Regularizar execução MAC: reunião urgente com regulação e operadora",
            "Lançar edital para processo seletivo simplificado (4ª equipe ESF)",
            "Aumentar cobertura citopatológico via busca ativa nas microáreas MA-02 e MA-07",
            "Enviar SIOPS 2º Quadrimestre até 31/07/2026",
        ],

        "fonte": "referencia",
    }


@router.get("/historico")
async def historico_rdqa(
    ano: int = Query(2026),
    _: UserOut = Depends(get_current_user),
):
    """Histórico de RDQAs apresentados ao CMS."""
    return {
        "ano": ano,
        "municipio": "Apuí/AM",
        "historico": [
            {
                "quadrimestre": 1, "periodo": "Jan–Abr/2026",
                "status_apresentacao": "Aprovado",
                "data_apresentacao": "2026-05-28",
                "pct_execucao": 58.2,
                "observacao": "Aprovado em reunião ordinária CMS nº 12/2026",
            },
            {
                "quadrimestre": 2, "periodo": "Mai–Ago/2026",
                "status_apresentacao": "Pendente",
                "data_apresentacao": None,
                "pct_execucao": 73.8,
                "observacao": "Prazo: 30/09/2026 — em elaboração",
            },
            {
                "quadrimestre": 3, "periodo": "Set–Dez/2026",
                "status_apresentacao": "Não iniciado",
                "data_apresentacao": None,
                "pct_execucao": None,
                "observacao": "Prazo: 30/01/2027",
            },
        ],
        "fonte": "referencia",
    }
