"""Router: /api/financeiro — ERSUS 360 — SIOPS dados abertos"""
from __future__ import annotations
from datetime import date, datetime
from fastapi import APIRouter, Query
from services.siops_service import buscar_apuracao, buscar_historico, alerta_minimo
from services.resumo import como_resumo
router = APIRouter(prefix="/api/financeiro", tags=["Financeiro"])
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"); _ANO = lambda: date.today().year - 1
_NOTA = "Dados financeiros municipais detalhados requerem SICONFI/SIGFIS (pendente). SIOPS como proxy saúde."
@router.get("/dashboard")
async def dashboard(ano: int = Query(0)):
    if not ano: ano = _ANO()
    siops = await buscar_apuracao(ano)
    alertas = []
    pct = siops.get("percentual_saude_receita")
    if (alerta := alerta_minimo(siops)):
        alertas.append(alerta)
    return {"situacao_dado": siops.get("situacao_dado"), "ano": ano, "financeiro": siops, "alertas": alertas, "nota": _NOTA, "fonte": "SIOPS — DATASUS dados abertos", "verificado_em": _TS()}
@router.get("/indicadores")
async def indicadores(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/resumo")
async def resumo(ano: int = Query(0)): return await dashboard(ano=ano)
@router.get("/historico")
async def historico():
    hist = como_resumo(await buscar_historico(), "historico")
    return {"situacao_dado": hist.get("situacao_dado"), "historico": hist, "nota": _NOTA, "verificado_em": _TS()}


# ── Consulta FNS (Painel Financeiro): transferências reais coletadas do FNS ───────────────────────────
# Antes estas rotas não existiam e o Painel caía na rota genérica "não disponível". Os dados vêm da
# tabela de transferências do FNS que o ERSUS360 já coleta (services/fns_transferencias.py) — só Apuí.
from typing import Optional as _Opt

from fastapi import Depends as _Depends
from sqlalchemy.ext.asyncio import AsyncSession as _Sess

from database import get_db as _get_db
from services.fns_transferencias import IBGE_APUI_7 as _IBGE_FNS, listar_transferencias as _listar
from tenancy.escopo import SessaoMunicipal as _Sessao

_FONTE_FNS = "FNS — consulta de pagamentos (transferências coletadas pelo ERSUS360)"
_MESES = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]


def _so_municipio_coletado(current) -> dict | None:
    if (current.municipio_ibge or "")[:6] != _IBGE_FNS[:6]:
        return {"situacao_dado": "nao_disponivel", "acoes": [], "repasses": [], "fonte": _FONTE_FNS,
                "aviso": "A coleta de transferências do FNS ainda não está ativa para este município."}
    return None


def _f(v) -> float:
    return float(v or 0)


@router.get("/fns-acoes")
async def fns_acoes(current: _Sessao, ano: int = Query(0), mes: _Opt[str] = Query(None), bloco: _Opt[str] = Query(None),
                    db: _Sess = _Depends(_get_db)):
    """Ações pagas pelo FNS ao município no ano (e mês/bloco, se informados)."""
    if (bloqueio := _so_municipio_coletado(current)):
        return bloqueio
    ano = ano or date.today().year
    m = int(mes) if mes and str(mes).isdigit() else None
    ts = await _listar(db, exercicio=ano, mes=m, bloco=bloco or None)
    acoes = [{"id": t.id, "bloco": t.bloco, "grupo": t.grupo, "acao": t.acao, "acao_detalhada": t.acao_detalhada,
              "competencia": t.competencia, "data_pagamento": t.data_pagamento.isoformat() if t.data_pagamento else None,
              "numero_ob": t.numero_ob, "numero_portaria": t.numero_portaria,
              "valor_total": _f(t.valor_total), "valor_desconto": _f(t.valor_desconto), "valor_liquido": _f(t.valor_liquido)}
             for t in ts]
    return {"situacao_dado": "oficial_validado" if acoes else "nao_disponivel",
            "competencia": f"{_MESES[m]}/{ano}" if m else str(ano),
            "acoes": acoes, "entidade": None,
            "total_geral": round(sum(a["valor_total"] for a in acoes), 2),
            "total_desconto": round(sum(a["valor_desconto"] for a in acoes), 2),
            "total_liquido": round(sum(a["valor_liquido"] for a in acoes), 2),
            "fonte": _FONTE_FNS,
            "aviso": None if acoes else "Nenhuma transferência do FNS coletada para o período escolhido."}


@router.get("/fns-repasse-dia")
async def fns_repasse_dia(current: _Sessao, ano: int = Query(...), mes: int = Query(..., ge=1, le=12), dia: int = Query(..., ge=1, le=31),
                          db: _Sess = _Depends(_get_db)):
    """Repasses do FNS pagos numa data (pela data de pagamento registrada)."""
    if (bloqueio := _so_municipio_coletado(current)):
        return bloqueio
    todos = await _listar(db, exercicio=ano)
    alvo = date(ano, mes, dia)
    dia_ts = [t for t in todos if t.data_pagamento and t.data_pagamento == alvo]
    pagos = sorted((t.data_pagamento for t in todos if t.data_pagamento), reverse=True)
    rep = [{"uf": current.municipio_uf or "AM", "municipio": current.municipio, "entidade": "Fundo Municipal de Saúde",
            "bloco": t.bloco, "acao": t.acao_detalhada or t.acao, "valor": _f(t.valor_liquido),
            "data": t.data_pagamento.strftime("%d/%m/%Y")} for t in dia_ts]
    return {"situacao_dado": "oficial_validado", "repasses": rep, "total": round(sum(r["valor"] for r in rep), 2),
            "ultimo_pagamento": pagos[0].strftime("%d/%m/%Y") if pagos else None, "fonte": _FONTE_FNS}
