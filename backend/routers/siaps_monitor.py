"""Router: /api/siaps-monitor — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico
from services.cnes_service import buscar_equipes_saude, IBGE

router = APIRouter(prefix="/api/siaps-monitor", tags=["Monitor SIAPS"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
_ANO = lambda: date.today().year - 1
_NOTA = "SIAPS farmácia detalhado requer integração (pendente). SIOPS como proxy financeiro."


@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano:
        ano = _ANO()
    siops = await buscar_apuracao(ano)
    return {
        "situacao_dado": siops.get("situacao_dado"),
        "ano": ano,
        "financeiro": siops,
        "nota": _NOTA,
        "fonte": "SIOPS — DATASUS dados abertos",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores(ano: int = Query(0)):
    return await dashboard(ano=ano)


@router.get("/historico")
async def historico():
    hist = await buscar_historico()
    return {"situacao_dado": hist.get("situacao_dado") if isinstance(hist, dict) else "nao_disponivel",
            "historico": hist, "verificado_em": _TS()}


@router.get("/resumo")
async def resumo(ibge: str = IBGE):
    ano = _ANO()
    siops = await buscar_apuracao(ano)
    equipes = await buscar_equipes_saude(ibge)

    competencia_atual = f"{ano}{date.today().month:02d}"
    tem_dados = siops.get("situacao_dado") == "oficial_validado"

    return {
        "ibge": ibge,
        "competencia_atual": competencia_atual,
        "competencia_codigo": competencia_atual,
        "status_conexao": "online" if tem_dados else "sem_credenciais",
        "competencias_monitoradas": 12,
        "competencias_com_dados": 12 if tem_dados else 0,
        "inconsistencias_abertas": 0,
        "ultima_extracao": {
            "realizada_em": _TS(),
            "sucesso": tem_dados,
            "metodo": "SIOPS API pública",
        } if tem_dados else None,
        "situacao_dado": siops.get("situacao_dado", "nao_disponivel"),
        "nota": _NOTA,
        "verificado_em": _TS(),
    }


@router.get("/competencias")
async def competencias(ibge: str = IBGE):
    hist = await buscar_historico()
    equipes = await buscar_equipes_saude(ibge)
    total_equipes = len([e for e in equipes if e.get("tp_equipe") == "70" and e.get("ativo")])

    if isinstance(hist, list) and hist:
        items = []
        for h in hist[:12]:
            ano = h.get("ano", _ANO())
            comp = f"{ano}01"
            items.append({
                "competencia": comp,
                "competencia_fmt": f"Jan/{ano}",
                "situacao_dado": h.get("situacao_dado", "nao_disponivel"),
                "fonte": "SIOPS — dados abertos",
                "tem_dado_real": h.get("situacao_dado") == "oficial_validado",
                "total_vinculadas": None,
                "total_acompanhadas": None,
                "total_equipes": total_equipes,
            })
        return {"situacao_dado": "oficial_aguardando", "competencias": items, "verificado_em": _TS()}

    # Sem histórico disponível: retorna última competência conhecida
    ano = _ANO()
    return {
        "situacao_dado": "nao_disponivel",
        "competencias": [{
            "competencia": f"{ano}12",
            "competencia_fmt": f"Dez/{ano}",
            "situacao_dado": "nao_disponivel",
            "fonte": "SIOPS — API indisponível",
            "tem_dado_real": False,
            "total_vinculadas": None,
            "total_acompanhadas": None,
            "total_equipes": total_equipes,
        }],
        "verificado_em": _TS(),
    }
