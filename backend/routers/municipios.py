"""Router: /api/municipios — ERSUS 360 — CNES dados abertos (somente o município da sessão)"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter
from services.cnes_service import resumo_estabelecimentos
from tenancy.contexto import municipio_atual
router = APIRouter(prefix="/api/municipios", tags=["Municípios"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
@router.get("/")
async def municipios():
    cnes = await resumo_estabelecimentos()
    total = len(cnes) if isinstance(cnes, list) else cnes.get("total")
    situacao = ("oficial_validado" if cnes else "nao_disponivel") if isinstance(cnes, list) else cnes.get("situacao_dado")
    mun = municipio_atual()
    return {"situacao_dado": situacao, "municipios": [{"ibge": mun.ibge, "nome": mun.nome, "uf": mun.uf, "estabelecimentos": total}], "fonte": "CNES — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(): return await municipios()
