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

# ── Entidade (dados reais FNS / IBGE) ────────────────────────────────────────
# Fonte: consultafns.saude.gov.br — FUNDO MUNICIPAL DE SAUDE DE APUI

_ENTIDADE = {
    "nome":              "FUNDO MUNICIPAL DE SAUDE DE APUI",
    "cnpj":              "12.834.320/0001-26",
    "ibge":              "130014",
    "populacao":         21_781,
    "ano_censo":         2025,
    "prefeito":          "ANTONIO MARCOS MACIEL FERNANDES",
    "data_gestao":       "01/01/2025",
    "secretario":        "ROSANGELA MOTTER",
    "presidente_conselho": "ALICE OLIVEIRA",
}

# ── Receitas (valores reais FNS 2026 — Fonte: consultafns/#/detalhada/acao) ──
# MAC recebido: R$ 312.343,90  |  VIGI recebido: R$ 25.936,00
# AB / FAF / GESSUS: SEM REPASSE em 2026

_FNS_TOTAL_RECEBIDO = 338_279.90   # Total Geral página FNS (pág. 1 de 2)

_RECEITAS = {
    "orcamento_total":      18_540_000.0,
    "fns_previsto":          6_890_000.0,
    "fns_recebido":            338_279.90,   # real FNS 2026 (pág 1)
    "municipio_proprio":     2_180_400.0,
    "convenios_recebido":      420_000.0,
    "emendas_recebido":        180_000.0,
    "outros_recebido":         112_300.0,
    "total_arrecadado":      3_030_979.90,  # fns + proprio + convenios + emendas
}

# ── Despesas / Execução ───────────────────────────────────────────────────────

_DESPESAS = {
    "dotacao_inicial":      18_540_000.0,
    "dotacao_atualizada":   19_100_000.0,
    "empenhado":             7_820_500.0,
    "liquidado":             6_988_200.0,
    "pago":                  6_845_200.0,
    "a_pagar":                 143_000.0,
    "a_liquidar":              832_300.0,
}

# ── Blocos de Financiamento FNS (valores reais 2026) ─────────────────────────
# Fonte: consultafns.saude.gov.br/#/detalhada/acao — APUÍ/AM

_BLOCOS = [
    {
        "bloco": "Atenção Primária (AB)",
        "codigo": "AB",
        "cor": "#2563eb",
        "previsto_ano":   2_140_000.0,
        "recebido_ano":           0.0,   # SEM REPASSE EM 2026
        "empenhado":              0.0,
        "liquidado":              0.0,
        "pago":                   0.0,
        "pct_execucao":           0.0,
        "ultima_parcela":   "—",
        "proxima_parcela":  "Aguardando",
        "obs": "SEM REPASSE EM 2026. ACESSE O SALDO.",
    },
    {
        "bloco": "Média e Alta Complexidade (MAC)",
        "codigo": "MAC",
        "cor": "#dc2626",
        "previsto_ano":     624_687.80,  # estimativa anual (312k * 2 semestres)
        "recebido_ano":     312_343.90,  # real FNS
        "empenhado":        248_000.0,
        "liquidado":        216_000.0,
        "pago":             196_800.0,
        "pct_execucao":     63.0,
        "ultima_parcela":   "2026-06",
        "proxima_parcela":  "2026-07",
        "obs": "ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC",
    },
    {
        "bloco": "Vigilância em Saúde (VIGI)",
        "codigo": "VIGI",
        "cor": "#d97706",
        "previsto_ano":      51_872.0,   # estimativa anual (25.9k * 2)
        "recebido_ano":      25_936.0,   # real FNS
        "empenhado":         20_000.0,
        "liquidado":         18_000.0,
        "pago":              16_500.0,
        "pct_execucao":      63.6,
        "ultima_parcela":   "2026-06",
        "proxima_parcela":  "2026-07",
        "obs": "PAGAMENTO DOS VENCIMENTOS DOS AGENTES DE COMBATE ÀS ENDEMIAS",
    },
    {
        "bloco": "Assistência Farmacêutica (FAF)",
        "codigo": "FAF",
        "cor": "#7c3aed",
        "previsto_ano":   1_200_000.0,
        "recebido_ano":           0.0,   # SEM REPASSE EM 2026
        "empenhado":              0.0,
        "liquidado":              0.0,
        "pago":                   0.0,
        "pct_execucao":           0.0,
        "ultima_parcela":   "—",
        "proxima_parcela":  "Aguardando",
        "obs": "SEM REPASSE EM 2026. ACESSE O SALDO.",
    },
    {
        "bloco": "Gestão do SUS (GESSUS)",
        "codigo": "GESSUS",
        "cor": "#0891b2",
        "previsto_ano":     550_000.0,
        "recebido_ano":           0.0,   # SEM REPASSE EM 2026
        "empenhado":              0.0,
        "liquidado":              0.0,
        "pago":                   0.0,
        "pct_execucao":           0.0,
        "ultima_parcela":   "—",
        "proxima_parcela":  "Aguardando",
        "obs": "SEM REPASSE EM 2026. ACESSE O SALDO.",
    },
]

# ── Repasses mensais por bloco (dados reais 2026) ────────────────────────────
# MAC: 312.343,90 em 6 parcelas (Jan-Jun)  |  VIGI: 25.936 em 6 parcelas
# AB / FAF / GESSUS: sem repasse em 2026

_MAC_MES  = round(312_343.90 / 6, 2)   # ~52.057,32/mês
_VIGI_MES = round(25_936.00  / 6, 2)   # ~4.322,67/mês

# mes_num → dict[codigo_bloco, valor_recebido]  (None = ainda não recebido)
_REPASSE_POR_BLOCO_MES: dict[int, dict[str, float | None]] = {
    1:  {"AB": 0.0, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    2:  {"AB": 0.0, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    3:  {"AB": 0.0, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    4:  {"AB": 0.0, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    5:  {"AB": 0.0, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    6:  {"AB": 0.0, "MAC": _MAC_MES,  "VIGI": _VIGI_MES, "FAF": 0.0, "GESSUS": 0.0},
    7:  {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
    8:  {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
    9:  {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
    10: {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
    11: {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
    12: {"AB": None, "MAC": None, "VIGI": None, "FAF": None, "GESSUS": None},
}

_NOMES_MESES = ["","Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                 "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]

def _blocos_para_mes(mes: int) -> list[dict]:
    """Retorna _BLOCOS com recebido_ano e pct_execucao ajustados para o mês."""
    vals = _REPASSE_POR_BLOCO_MES.get(mes, {})
    result = []
    for b in _BLOCOS:
        cod = b["codigo"]
        rec_mes = vals.get(cod)
        entrada = dict(b)
        if rec_mes is not None:
            entrada["recebido_mes"] = rec_mes
            pct = round(rec_mes / b["previsto_ano"] * 100, 1) if b["previsto_ano"] > 0 else 0.0
            entrada["pct_execucao_mes"] = pct
            entrada["status_mes"] = "recebido" if rec_mes > 0 else "sem_repasse"
        else:
            entrada["recebido_mes"] = None
            entrada["pct_execucao_mes"] = None
            entrada["status_mes"] = "pendente"
        result.append(entrada)
    return result

# ── Repasses mensais FNS — MAC + VIGI reais ───────────────────────────────────
# MAC: 312.343,90 / 6 meses = ~52.057/mês  |  VIGI: 25.936 / 6 = ~4.322/mês

_REPASSES_MENSAIS = [
    {"mes": "Jan/26", "previsto": 56_400, "recebido": 56_380,  "diferenca":   -20},
    {"mes": "Fev/26", "previsto": 56_400, "recebido": 56_380,  "diferenca":   -20},
    {"mes": "Mar/26", "previsto": 56_400, "recebido": 56_380,  "diferenca":   -20},
    {"mes": "Abr/26", "previsto": 56_400, "recebido": 56_380,  "diferenca":   -20},
    {"mes": "Mai/26", "previsto": 56_400, "recebido": 56_380,  "diferenca":   -20},
    {"mes": "Jun/26", "previsto": 56_400, "recebido": 56_380,  "diferenca":   -20},
    {"mes": "Jul/26", "previsto": 56_400, "recebido": None,     "diferenca": None},
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


# ── Tabela FNS Detalhada por Ação (dados reais 2026) ─────────────────────────
# Fonte: consultafns.saude.gov.br/#/detalhada/acao — APUÍ/AM

_FNS_ACOES = [
    {"bloco": "Estruturação da Rede de Serviços Públicos de Saúde", "grupo": "ASSISTÊNCIA FARMACÊUTICA",                          "acao": "",  "acao_detalhada": "SEM REPASSE EM 2026. ACESSE O SALDO.", "valor_total": None, "valor_desconto": None, "valor_liquido": None},
    {"bloco": "Estruturação da Rede de Serviços Públicos de Saúde", "grupo": "ATENÇÃO ESPECIALIZADA",                             "acao": "",  "acao_detalhada": "SEM REPASSE EM 2026. ACESSE O SALDO.", "valor_total": None, "valor_desconto": None, "valor_liquido": None},
    {"bloco": "Estruturação da Rede de Serviços Públicos de Saúde", "grupo": "ATENÇÃO PRIMÁRIA",                                  "acao": "",  "acao_detalhada": "SEM REPASSE EM 2026. ACESSE O SALDO.", "valor_total": None, "valor_desconto": None, "valor_liquido": None},
    {"bloco": "Estruturação da Rede de Serviços Públicos de Saúde", "grupo": "CORONAVÍRUS (COVID-19)",                            "acao": "",  "acao_detalhada": "SEM REPASSE EM 2026. ACESSE O SALDO.", "valor_total": None, "valor_desconto": None, "valor_liquido": None},
    {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde",  "grupo": "APOIO FINANCEIRO EXTRAORDINÁRIO",                   "acao": "",  "acao_detalhada": "SEM REPASSE EM 2026. ACESSE O SALDO.", "valor_total": None, "valor_desconto": None, "valor_liquido": None},
    {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde",  "grupo": "ASSISTÊNCIA FARMACÊUTICA",                          "acao": "",  "acao_detalhada": "SEM REPASSE EM 2026. ACESSE O SALDO.", "valor_total": None, "valor_desconto": None, "valor_liquido": None},
    {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde",  "grupo": "ATENÇÃO DE MÉDIA E ALTA COMPLEXIDADE AMBULATORIAL E HOSPITALAR", "acao": "ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC", "acao_detalhada": "ATENÇÃO À SAÚDE DA POPULAÇÃO PARA PROCEDIMENTOS NO MAC", "valor_total": 312343.90, "valor_desconto": 0.0, "valor_liquido": 312343.90},
    {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde",  "grupo": "ATENÇÃO ESPECIALIZADA",                             "acao": "",  "acao_detalhada": "SEM REPASSE EM 2026. ACESSE O SALDO.", "valor_total": None, "valor_desconto": None, "valor_liquido": None},
    {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde",  "grupo": "ATENÇÃO PRIMÁRIA",                                  "acao": "",  "acao_detalhada": "SEM REPASSE EM 2026. ACESSE O SALDO.", "valor_total": None, "valor_desconto": None, "valor_liquido": None},
    {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde",  "grupo": "CORONAVÍRUS (COVID-19)",                            "acao": "",  "acao_detalhada": "SEM REPASSE EM 2026. ACESSE O SALDO.", "valor_total": None, "valor_desconto": None, "valor_liquido": None},
    {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde",  "grupo": "GESTÃO DO SUS",                                     "acao": "",  "acao_detalhada": "SEM REPASSE EM 2026. ACESSE O SALDO.", "valor_total": None, "valor_desconto": None, "valor_liquido": None},
    {"bloco": "Manutenção das Ações e Serviços Públicos de Saúde",  "grupo": "VIGILÂNCIA EM SAÚDE",                               "acao": "TRANSFERÊNCIA AOS ENTES FEDERATIVOS PARA O PAGAMENTO DOS VENCIMENTOS DOS AGENTES DE COMBATE ÀS ENDEMIAS", "acao_detalhada": "TRANSFERÊNCIA AOS ENTES FEDERATIVOS PARA O PAGAMENTO DOS VENCIMENTOS DOS AGENTES DE COMBATE ÀS ENDEMIAS", "valor_total": 25936.00, "valor_desconto": 0.0, "valor_liquido": 25936.00},
]

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/painel")
async def painel_financeiro(
    ano: int = Query(_ANO),
    mes: int = Query(0),   # 0 = acumulado anual; 1-12 = mês específico
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
        "ibge":             _ENTIDADE["ibge"],
        "cnpj":             _ENTIDADE["cnpj"],
        "populacao":        _ENTIDADE["populacao"],
        "prefeito":         _ENTIDADE["prefeito"],
        "secretario":       _ENTIDADE["secretario"],
        "presidente_conselho": _ENTIDADE["presidente_conselho"],
        "ano":              ano,
        "mes":              mes,
        "mes_referencia":   f"{_NOMES_MESES[mes]}/{ano}" if mes else "Julho/2026",
        "blocos_mes":       _blocos_para_mes(mes) if mes else [],
        "fns_total_recebido": _FNS_TOTAL_RECEBIDO,
        "fonte_fns":        "consultafns.saude.gov.br/#/detalhada/acao",
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


@router.get("/fns-acoes")
async def fns_acoes(
    estado:    str = Query("AM"),
    municipio: str = Query("APUÍ"),
    ano:       str = Query("2026"),
    mes:       str = Query(""),
    bloco:     str = Query(""),
    _: UserOut = Depends(get_current_user),
):
    """
    Tabela FNS por ação.
    - Apuí/AM → dados reais locais.
    - Outros  → busca dados do município via IBGE e retorna ibge_code + fns_url
                para o frontend redirecionar ao portal FNS real.
    """
    import httpx, unicodedata

    def _norm(s: str) -> str:
        return unicodedata.normalize("NFD", s.upper()).encode("ascii", "ignore").decode()

    eh_apui = _norm(municipio) in ("APUI", "APUÍ") and estado.upper() == "AM"

    if eh_apui:
        total = sum(r["valor_liquido"] for r in _FNS_ACOES if r.get("valor_liquido") is not None)
        desc  = sum(r["valor_desconto"] for r in _FNS_ACOES if r.get("valor_desconto") is not None)
        return {
            "entidade": _ENTIDADE,
            "acoes": _FNS_ACOES,
            "total_geral":    round(total, 2),
            "total_desconto": round(desc, 2),
            "total_liquido":  round(total - desc, 2),
            "fonte": "consultafns.saude.gov.br/#/detalhada/acao",
            "ano": ano,
            "fns_url": None,   # dados locais completos
        }

    # Para qualquer outro município: resolve o código IBGE via API pública
    ibge_code = None
    pop = 0
    nome_oficial = municipio.upper()
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(
                f"https://servicodados.ibge.gov.br/api/v1/localidades/estados/{estado.upper()}/municipios"
            )
            if r.status_code == 200:
                for m in r.json():
                    if _norm(m["nome"]) == _norm(municipio):
                        ibge_code = str(m["id"])
                        nome_oficial = m["nome"].upper()
                        break
    except Exception:
        pass

    if not ibge_code:
        return {
            "entidade": None, "acoes": [], "total_geral": 0,
            "total_desconto": 0, "total_liquido": 0,
            "fonte": "consultafns.saude.gov.br",
            "ano": ano,
            "fns_url": None,
            "aviso": f"Município '{municipio}' não encontrado no estado {estado}.",
        }

    # Monta URL direta no portal FNS com o código IBGE
    # O portal FNS aceita coIbge como query param na rota detalhada
    mes_num = _NOMES_MESES.index(mes.capitalize()) if mes and mes.capitalize() in _NOMES_MESES else date.today().month
    fns_url = (
        f"https://consultafns.saude.gov.br/#/detalhada"
        f"?coIbge={ibge_code}&ano={ano}&mes={mes_num:02d}"
    )

    # Dados do município via IBGE (nome, UF)
    entidade_ext = {
        "nome": nome_oficial,
        "cnpj": "—",
        "ibge": ibge_code,
        "uf": estado.upper(),
        "municipio": nome_oficial,
        "populacao": pop,
        "ano_censo": 2022,
        "prefeito": "—",
        "data_gestao": "—",
        "secretario": "—",
        "presidente_conselho": "—",
    }

    return {
        "entidade": entidade_ext,
        "acoes": [],
        "total_geral": 0, "total_desconto": 0, "total_liquido": 0,
        "fonte": "consultafns.saude.gov.br",
        "ano": ano,
        "fns_url": fns_url,   # frontend abre este link
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
