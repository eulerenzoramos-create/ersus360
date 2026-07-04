"""
Router: /api/financeiro — Painel Financeiro Executivo
Agrega: FNS repasses, execução orçamentária, blocos, SIOPS, empenhos
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/financeiro", tags=["Financeiro"])

_ANO = 2026

# ── Receitas ──────────────────────────────────────────────────────────────────

_RECEITAS = {
    "orcamento_total":      18_540_000.0,
    "fns_previsto":          6_890_000.0,
    "fns_recebido":          3_245_700.0,
    "municipio_proprio":     2_180_400.0,   # aplicado em saúde
    "convenios_recebido":      420_000.0,
    "emendas_recebido":        180_000.0,
    "outros_recebido":         112_300.0,
    "total_arrecadado":      6_138_400.0,
}

# ── Despesas / Execução ───────────────────────────────────────────────────────

_DESPESAS = {
    "dotacao_inicial":      18_540_000.0,
    "dotacao_atualizada":   19_100_000.0,   # suplementações
    "empenhado":             7_820_500.0,
    "liquidado":             6_988_200.0,
    "pago":                  6_845_200.0,
    "a_pagar":                 143_000.0,   # liquidado - pago
    "a_liquidar":              832_300.0,   # empenhado - liquidado
}

# ── Blocos de Financiamento FNS ───────────────────────────────────────────────

_BLOCOS = [
    {
        "bloco": "Atenção Básica (AB)",
        "codigo": "AB",
        "cor": "#2563eb",
        "previsto_ano":   2_140_000.0,
        "recebido_ano":   1_070_000.0,
        "empenhado":        830_000.0,
        "liquidado":        752_000.0,
        "pago":             695_000.0,
        "pct_execucao":     64.9,
        "ultima_parcela":   "2026-06-25",
        "proxima_parcela":  "2026-07-25",
    },
    {
        "bloco": "Média e Alta Complexidade (MAC)",
        "codigo": "MAC",
        "cor": "#dc2626",
        "previsto_ano":   1_440_000.0,
        "recebido_ano":     480_000.0,
        "empenhado":        248_000.0,
        "liquidado":        216_000.0,
        "pago":             196_800.0,
        "pct_execucao":     41.0,
        "ultima_parcela":   "2026-06-25",
        "proxima_parcela":  "2026-07-25",
    },
    {
        "bloco": "Vigilância em Saúde (VIGI)",
        "codigo": "VIGI",
        "cor": "#d97706",
        "previsto_ano":     960_000.0,
        "recebido_ano":     480_000.0,
        "empenhado":        312_000.0,
        "liquidado":        280_000.0,
        "pago":             249_600.0,
        "pct_execucao":     52.0,
        "ultima_parcela":   "2026-06-25",
        "proxima_parcela":  "2026-07-25",
    },
    {
        "bloco": "Assistência Farmacêutica (FAF)",
        "codigo": "FAF",
        "cor": "#7c3aed",
        "previsto_ano":   1_200_000.0,
        "recebido_ano":     600_000.0,
        "empenhado":        214_000.0,
        "liquidado":        192_000.0,
        "pago":             173_240.0,
        "pct_execucao":     28.9,
        "ultima_parcela":   "2026-06-25",
        "proxima_parcela":  "2026-07-25",
    },
    {
        "bloco": "Gestão do SUS (GESSUS)",
        "codigo": "GESSUS",
        "cor": "#0891b2",
        "previsto_ano":     550_000.0,
        "recebido_ano":     275_000.0,
        "empenhado":        198_000.0,
        "liquidado":        181_000.0,
        "pago":             166_000.0,
        "pct_execucao":     60.4,
        "ultima_parcela":   "2026-06-25",
        "proxima_parcela":  "2026-07-25",
    },
]

# ── Repasses mensais FNS (timeline) ──────────────────────────────────────────

_REPASSES_MENSAIS = [
    {"mes": "Jan/26", "previsto": 540_475, "recebido": 538_200,  "diferenca": -2_275},
    {"mes": "Fev/26", "previsto": 540_475, "recebido": 541_100,  "diferenca":    625},
    {"mes": "Mar/26", "previsto": 540_475, "recebido": 537_800,  "diferenca": -2_675},
    {"mes": "Abr/26", "previsto": 540_475, "recebido": 542_400,  "diferenca":  1_925},
    {"mes": "Mai/26", "previsto": 540_475, "recebido": 543_100,  "diferenca":  2_625},
    {"mes": "Jun/26", "previsto": 540_475, "recebido": 543_100,  "diferenca":  2_625},
    {"mes": "Jul/26", "previsto": 540_475, "recebido": None,      "diferenca": None},   # pendente
]

# ── Empenhos pendentes ────────────────────────────────────────────────────────

_EMPENHOS_PENDENTES = [
    {"id": "2026NE001847", "credor": "UNIMED Manaus Coop.",           "objeto": "Serv. amb. MAC",       "valor": 48_200.0, "data": "2026-06-30", "bloco": "MAC",  "status": "a_liquidar"},
    {"id": "2026NE001863", "credor": "Distribuidora Farmacêutica AM", "objeto": "Med. Componente Básico","valor": 31_400.0, "data": "2026-07-01", "bloco": "FAF",  "status": "a_liquidar"},
    {"id": "2026NE001891", "credor": "Auto Peças do Norte Ltda",      "objeto": "Manutenção veículos",  "valor": 12_780.0, "data": "2026-06-28", "bloco": "AB",   "status": "a_pagar"},
    {"id": "2026NE001902", "credor": "Lab. Rede Cerrado",             "objeto": "Exames diagnósticos",  "valor": 22_500.0, "data": "2026-07-05", "bloco": "MAC",  "status": "a_liquidar"},
    {"id": "2026NE001918", "credor": "Cooperativa COOPAM",            "objeto": "Transporte sanitário", "valor": 18_300.0, "data": "2026-07-03", "bloco": "AB",   "status": "a_pagar"},
]

# ── SIOPS ─────────────────────────────────────────────────────────────────────

_SIOPS = {
    "receita_total_saude":     12_700_000.0,
    "despesa_saude":           12_700_000.0 * 0.1716,  # 17,16%
    "pct_proprio_saude":       17.16,
    "meta_minima":             15.0,
    "conforme":                True,
    "margem_seguranca":        2.16,
    "historico": [
        {"ano": 2023, "pct": 15.82, "conforme": True},
        {"ano": 2024, "pct": 16.44, "conforme": True},
        {"ano": 2025, "pct": 16.91, "conforme": True},
        {"ano": 2026, "pct": 17.16, "conforme": True, "parcial": True},
    ],
}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/painel")
async def painel_financeiro(
    ano: int = Query(_ANO),
    _: UserOut = Depends(get_current_user),
):
    """Painel financeiro executivo consolidado."""
    hoje = date.today()

    # Alertas financeiros automáticos
    alertas = []
    for b in _BLOCOS:
        if b["pct_execucao"] < 35:
            alertas.append({"nivel": "CRITICO", "bloco": b["codigo"], "msg": f"{b['bloco']}: execução {b['pct_execucao']}% — risco de devolução"})
        elif b["pct_execucao"] < 55:
            alertas.append({"nivel": "AVISO", "bloco": b["codigo"], "msg": f"{b['bloco']}: execução {b['pct_execucao']}% — abaixo do esperado"})

    if _EMPENHOS_PENDENTES:
        total_pendente = sum(e["valor"] for e in _EMPENHOS_PENDENTES if e["status"] == "a_liquidar")
        if total_pendente > 50_000:
            alertas.append({"nivel": "AVISO", "bloco": "—", "msg": f"R$ {total_pendente:,.0f} em empenhos aguardando liquidação"})

    pct_exec_geral = round(_DESPESAS["pago"] / _RECEITAS["orcamento_total"] * 100, 1)
    pct_arrecadacao = round(_RECEITAS["total_arrecadado"] / (_RECEITAS["fns_previsto"] + _RECEITAS["municipio_proprio"] + _RECEITAS["convenios_recebido"]) * 100, 1)

    return {
        "municipio":        "Apuí",
        "uf":               "AM",
        "ibge":             "1300144",
        "ano":              ano,
        "mes_referencia":   "Julho/2026",
        "gerado_em":        datetime.utcnow().isoformat() + "Z",

        "receitas":         _RECEITAS,
        "despesas":         _DESPESAS,
        "blocos":           _BLOCOS,
        "repasses_mensais": _REPASSES_MENSAIS,
        "empenhos_pendentes": _EMPENHOS_PENDENTES,
        "siops":            _SIOPS,
        "alertas":          alertas,

        "kpis": {
            "pct_execucao_geral":  pct_exec_geral,
            "pct_arrecadacao":     pct_arrecadacao,
            "saldo_disponivel":    round(_RECEITAS["total_arrecadado"] - _DESPESAS["pago"], 2),
            "siops_conforme":      _SIOPS["conforme"],
            "total_empenhos_pendentes": len(_EMPENHOS_PENDENTES),
            "valor_pendente_liquidar": sum(e["valor"] for e in _EMPENHOS_PENDENTES if e["status"] == "a_liquidar"),
        },

        "fonte": "referencia",
    }


@router.get("/blocos")
async def blocos_financiamento(_: UserOut = Depends(get_current_user)):
    return {"blocos": _BLOCOS, "fonte": "referencia"}


@router.get("/repasses")
async def repasses_fns(_: UserOut = Depends(get_current_user)):
    return {"repasses": _REPASSES_MENSAIS, "fonte": "referencia"}


@router.get("/empenhos")
async def empenhos_pendentes(_: UserOut = Depends(get_current_user)):
    return {"empenhos": _EMPENHOS_PENDENTES, "total": len(_EMPENHOS_PENDENTES), "fonte": "referencia"}
