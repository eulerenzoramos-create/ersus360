"""Router: /api/siconfi — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao
router = APIRouter(prefix="/api/siconfi", tags=["SICONFI"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "SICONFI requer acesso STN (pendente). SIOPS como proxy de execução financeira pública."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano)
    return {"situacao_dado": siops.get("situacao_dado"), "ano": ano, "despesa_total_saude": siops.get("despesa_total_saude"), "percentual_saude_receita": siops.get("percentual_saude_receita"), "nota": _NOTA, "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)

@router.get("/status")
async def status():
    return {
        "situacao_dado": "nao_disponivel",
        "sistema": "SICONFI",
        "descricao": "Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro (STN/MF)",
        "acesso": "pendente",
        "nota": _NOTA,
        "verificado_em": _TS(),
    }

@router.get("/rreo")
async def rreo(exercicio: int = Query(0), bimestre: int = Query(1)):
    if not exercicio: exercicio = _ANO()
    siops = await buscar_apuracao(exercicio)
    return {
        "situacao_dado": siops.get("situacao_dado", "nao_disponivel"),
        "exercicio": exercicio,
        "bimestre": bimestre,
        "nota": _NOTA + " RREO requer credencial STN direta.",
        "despesa_total_saude": siops.get("vl_despesa_total"),
        "percentual_saude": siops.get("pct_aplicado_saude") or siops.get("percentual_saude_receita"),
        "fonte": "SIOPS — proxy para RREO (dados abertos)",
        "verificado_em": _TS(),
    }

@router.get("/rgf")
async def rgf(exercicio: int = Query(0), quadrimestre: int = Query(1)):
    if not exercicio: exercicio = _ANO()
    siops = await buscar_apuracao(exercicio)
    return {
        "situacao_dado": siops.get("situacao_dado", "nao_disponivel"),
        "exercicio": exercicio,
        "quadrimestre": quadrimestre,
        "nota": _NOTA + " RGF requer credencial STN direta.",
        "despesa_pessoal": siops.get("vl_pessoal_encargos"),
        "fonte": "SIOPS — proxy para RGF (dados abertos)",
        "verificado_em": _TS(),
    }
