"""
Router: /api/clima-saude-apui — ERSUS 360
Clima e saúde via SINAN (doenças vetoriais) — DATASUS dados abertos.
Dados climáticos INMET/CEMADEN requerem integração (pendente).
"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.sinan_service import buscar_malaria, buscar_dengue

router = APIRouter(prefix="/api/clima-saude-apui", tags=["clima_saude_apui"])
_TS  = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "Dados climáticos INMET/CEMADEN e correlação com saúde requerem integração (pendente). Aqui só aparecem casos de malária e dengue notificados."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    malaria = await buscar_malaria(ano)
    dengue  = await buscar_dengue(ano)
    # total de internações do SIH removido em 21/10/2026: não mede efeito do clima
    any_real = any(d.get("situacao_dado") == "oficial_validado" for d in [malaria, dengue])
    return {
        "situacao_dado": "oficial_validado" if any_real else "nao_disponivel",
        "ano": ano,
        "malaria": malaria,
        "dengue": dengue,
        "nota": _NOTA,
        "fonte": "SINAN — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)
