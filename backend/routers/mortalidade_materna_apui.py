"""
Router: /api/mortalidade-materna-apui — ERSUS 360
Mortalidade materna via SIM (CID O00-O99) — DATASUS dados abertos.
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sim_sinasc_service import buscar_obitos, buscar_nascidos_vivos, buscar_historico_mortalidade

router = APIRouter(prefix="/api/mortalidade-materna-apui", tags=["mortalidade_materna_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    ob   = await buscar_obitos(ano)
    nasc = await buscar_nascidos_vivos(ano)
    maternos = [o for o in ob.get("obitos", []) if str(o.get("cid", "")).upper().startswith("O")]
    total_mat = len(maternos)
    total_nv  = nasc.get("total_nascidos") or 0
    rmm = round(total_mat / total_nv * 100_000, 1) if total_nv else None
    alertas = []
    if rmm is not None and rmm > 60:
        alertas.append({"nivel": "critico", "mensagem": f"RMM {rmm:.1f}/100 mil NV — acima de 60 (meta ODS 5.2)"})
    elif rmm is not None and rmm > 30:
        alertas.append({"nivel": "atencao", "mensagem": f"RMM {rmm:.1f}/100 mil NV — monitoramento recomendado"})
    return {
        "situacao_dado": ob.get("situacao_dado"),
        "ano": ano,
        "obitos_maternos": total_mat,
        "nascidos_vivos": total_nv,
        "razao_mortalidade_materna_100k_nv": rmm,
        "alertas": alertas,
        "fonte": "SIM + SINASC — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/historico")
async def historico():
    items = await buscar_historico_mortalidade()
    any_real = any(i.get("situacao_dado") == "oficial_validado" for i in items)
    return {"situacao_dado": "oficial_validado" if any_real else "nao_disponivel", "fonte": "SIM — DATASUS dados abertos", "verificado_em": _TS(), "anos": items}


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/por-causa")
async def por_causa():
    return {"situacao_dado": "nao_disponivel", "nota": "Detalhamento por causa obstétrica direta/indireta requer filtro CID no SIM (pendente).", "verificado_em": _TS()}
