"""
Router: /api/clima-saude-apui — ERSUS 360
Clima e saúde via SINAN (doenças vetoriais) + SIH — DATASUS dados abertos.
Dados climáticos INMET/CEMADEN requerem integração (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_malaria, buscar_dengue
from services.sih_service import buscar_internacoes

router = APIRouter(prefix="/api/clima-saude-apui", tags=["clima_saude_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Dados climáticos INMET/CEMADEN e correlação com saúde requerem integração (pendente). SINAN/SIH como proxy epidemiológico."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    malaria = await buscar_malaria(ano)
    dengue  = await buscar_dengue(ano)
    sih     = await buscar_internacoes(ano)
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [malaria, dengue, sih])
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "ano": ano,
        "malaria": malaria,
        "dengue": dengue,
        "internacoes": sih.get("total_internacoes"),
        "nota": _NOTA,
        "fonte": "SINAN + SIH — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
