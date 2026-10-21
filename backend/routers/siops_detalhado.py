"""
Router: /api/siops-detalhado — ERSUS 360
SIOPS detalhado: EC29, vinculação, execução por bloco — dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico, alerta_minimo

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
    if (alerta := alerta_minimo(result)):
        alertas.append(alerta)
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


_NAO_PUBLICA = ("A consulta pública de indicadores do SIOPS não publica este detalhamento. Consulte o demonstrativo "
                "completo no SIOPS (área de transmissão do município) ou o RREO Anexo 12.")


def _cab(d: dict, ano: int) -> dict:
    return {"situacao_dado": d.get("situacao_dado", "nao_disponivel"), "ano": ano, "periodo": d.get("periodo"),
            "fonte": d.get("fonte"), "verificado_em": _TS()}


@router.get("/blocos")
async def blocos(ano: int = Query(0)):
    """Despesa por bloco (AB, MAC, Vigilância…): não publicada na consulta pública de indicadores."""
    ano = ano or _ANO()
    d = await buscar_apuracao(ano)
    return {**_cab(d, ano), "situacao_dado": "nao_disponivel" if d.get("situacao_dado") != "oficial_validado" else "nao_publicado",
            "blocos": [], "total_despesa": d.get("despesa_total_saude"), "nota": _NAO_PUBLICA}


@router.get("/transferencias")
async def transferencias(ano: int = Query(0)):
    ano = ano or _ANO()
    d = await buscar_apuracao(ano)
    return {**_cab(d, ano),
            "transferencias": [
                {"origem": "Transferências para a Saúde (SUS) — total", "valor": d.get("transferencias_sus"), "tipo": "sus", "indicador": "1.3"},
                {"origem": "Das quais: da União para a Saúde", "valor": d.get("transferencias_uniao_saude"), "tipo": "federal", "indicador": "1.4"},
                {"origem": "Recursos próprios aplicados em ASPS", "valor": d.get("despesa_asps_recursos_proprios"), "tipo": "municipal", "indicador": "3.2"},
            ],
            "total": d.get("despesa_total_saude")}


@router.get("/execucao-orcamentaria")
async def execucao_orcamentaria(ano: int = Query(0)):
    """Empenhado/liquidado/pago NÃO são publicados na consulta de indicadores — antes a rota repetia a despesa
    total nos três campos, o que induzia a erro."""
    ano = ano or _ANO()
    d = await buscar_apuracao(ano)
    return {**_cab(d, ano), "empenhado": None, "liquidado": None, "pago": None, "dotacao_atualizada": None,
            "percentual_execucao": None, "despesa_total_saude": d.get("despesa_total_saude"), "nota": _NAO_PUBLICA}


@router.get("/despesa-natureza")
async def despesa_natureza(ano: int = Query(0)):
    ano = ano or _ANO()
    d = await buscar_apuracao(ano)
    vt = d.get("despesa_total_saude") or 0
    pct = lambda v: round(v / vt * 100, 2) if (vt and v is not None) else None  # noqa: E731
    itens = [("Pessoal e encargos", "despesa_pessoal_saude", "2.2"), ("Medicamentos", "despesa_medicamentos_saude", "2.3"),
             ("Serviços de terceiros — pessoa jurídica", "despesa_servicos_terceiros_pj", "2.4"),
             ("Investimentos", "despesa_investimentos_saude", "2.5"),
             ("Instituições privadas sem fins lucrativos", "despesa_instituicoes_sem_fins_lucrativos", "2.6")]
    return {**_cab(d, ano),
            "naturezas": [{"natureza": n, "valor": d.get(k), "percentual": pct(d.get(k)), "indicador": ind} for n, k, ind in itens],
            "total": d.get("despesa_total_saude"),
            "nota": "Valores dos indicadores 2.2 a 2.6 do SIOPS; as demais naturezas não são publicadas separadamente."}


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
                "receita_total": h.get("receita_total"),
                "despesa_saude": h.get("despesa_total_saude"),
                "periodo": h.get("periodo"),
                "pct_saude": h.get("pct_aplicado_saude") or h.get("percentual_saude_receita"),
                "situacao_dado": h.get("situacao_dado", "nao_disponivel"),
            })
    return {
        "situacao_dado": "oficial_validado" if anos_list else "nao_disponivel",
        "serie_historica": anos_list,
        "fonte": "SIOPS — DATASUS dados abertos",
        "verificado_em": _TS(),
    }
