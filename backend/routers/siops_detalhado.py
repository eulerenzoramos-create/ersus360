"""
Router: /api/siops-detalhado — ERSUS 360
SIOPS detalhado: EC29, vinculação, execução por bloco — dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico

router = APIRouter(prefix="/api/siops-detalhado", tags=["siops_detalhado"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_apuracao(ano)
    result["verificado_em"] = _TS()
    return result


@router.get("/historico")
async def historico():
    items = await buscar_historico()
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/ec29")
async def ec29(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    result = await buscar_apuracao(ano)
    pct = result.get("percentual_saude_receita")
    alertas = []
    if pct is not None and pct < 15.0:
        alertas.append({"nivel": "critico", "mensagem": f"EC29: {pct:.1f}% abaixo do mínimo constitucional de 15%"})
    return {
        "situacao_dado": result.get("situacao_dado"),
        "ano": ano,
        "percentual_aplicado_saude": pct,
        "minimo_constitucional_pct": 15.0,
        "alertas": alertas,
        "fonte": "SIOPS — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/blocos")
async def blocos(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    d = await buscar_apuracao(ano)
    vt = d.get("vl_despesa_total") or 0
    def _pct(v): return round(v / vt * 100, 1) if vt else None
    return {
        "situacao_dado": d.get("situacao_dado", "nao_disponivel"),
        "ano": ano,
        "blocos": [
            {"bloco": "Atenção Básica", "valor": d.get("vl_ab"), "percentual": _pct(d.get("vl_ab") or 0)},
            {"bloco": "Média e Alta Complexidade", "valor": d.get("vl_mac"), "percentual": _pct(d.get("vl_mac") or 0)},
            {"bloco": "Vigilância em Saúde", "valor": d.get("vl_vigilancia"), "percentual": _pct(d.get("vl_vigilancia") or 0)},
            {"bloco": "Assistência Farmacêutica", "valor": d.get("vl_farmacia"), "percentual": _pct(d.get("vl_farmacia") or 0)},
            {"bloco": "Gestão do SUS", "valor": d.get("vl_gestao"), "percentual": _pct(d.get("vl_gestao") or 0)},
        ],
        "total_despesa": vt,
        "fonte": "SIOPS — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/transferencias")
async def transferencias(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    d = await buscar_apuracao(ano)
    return {
        "situacao_dado": d.get("situacao_dado", "nao_disponivel"),
        "ano": ano,
        "transferencias": [
            {"origem": "União (Federal)", "valor": d.get("vl_transferencias_uniao"), "tipo": "federal"},
            {"origem": "Estado (AM)", "valor": d.get("vl_transferencias_estado"), "tipo": "estadual"},
            {"origem": "Recursos Próprios (Municipal)", "valor": d.get("vl_recursos_proprios"), "tipo": "municipal"},
        ],
        "total": d.get("vl_despesa_total"),
        "fonte": "SIOPS — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/execucao-orcamentaria")
async def execucao_orcamentaria(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    d = await buscar_apuracao(ano)
    return {
        "situacao_dado": d.get("situacao_dado", "nao_disponivel"),
        "ano": ano,
        "empenhado": d.get("vl_despesa_total"),
        "liquidado": d.get("vl_despesa_total"),
        "pago": d.get("vl_despesa_total"),
        "dotacao_atualizada": None,
        "percentual_execucao": None,
        "nota": "SIOPS não detalha empenho/liquidação separadamente — valor total como proxy.",
        "fonte": "SIOPS — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/despesa-natureza")
async def despesa_natureza(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    d = await buscar_apuracao(ano)
    vt = d.get("vl_despesa_total") or 0
    def _pct(v): return round(v / vt * 100, 1) if vt else None
    return {
        "situacao_dado": d.get("situacao_dado", "nao_disponivel"),
        "ano": ano,
        "naturezas": [
            {"natureza": "Pessoal e Encargos", "valor": d.get("vl_pessoal_encargos"), "percentual": _pct(d.get("vl_pessoal_encargos") or 0)},
            {"natureza": "Material de Consumo", "valor": d.get("vl_material_consumo"), "percentual": _pct(d.get("vl_material_consumo") or 0)},
            {"natureza": "Serviços de Terceiros", "valor": d.get("vl_servicos_terceiros"), "percentual": _pct(d.get("vl_servicos_terceiros") or 0)},
            {"natureza": "Investimentos", "valor": d.get("vl_investimentos"), "percentual": _pct(d.get("vl_investimentos") or 0)},
            {"natureza": "Outras Despesas Correntes", "valor": None, "percentual": None},
        ],
        "total": vt,
        "fonte": "SIOPS — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/receita-despesa")
async def receita_despesa(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    hist = await buscar_historico()
    anos_list = []
    if isinstance(hist, list):
        for h in hist[-5:]:
            anos_list.append({
                "ano": h.get("ano"),
                "receita_total": h.get("vl_receita_total"),
                "despesa_saude": h.get("vl_despesa_total"),
                "pct_saude": h.get("pct_aplicado_saude") or h.get("percentual_saude_receita"),
                "situacao_dado": h.get("situacao_dado", "nao_disponivel"),
            })
    return {
        "situacao_dado": "oficial_validado" if anos_list else "nao_disponivel",
        "serie_historica": anos_list,
        "fonte": "SIOPS — DATASUS dados abertos",
        "verificado_em": _TS(),
    }
