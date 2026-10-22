"""Router: /api/relatorios — Relatórios de gestão (RAG/RDQA, financeiro) — ERSUS 360

Sem fonte oficial integrada: as rotas respondem nao_disponivel com a explicação. Até 21/10/2026 devolviam
uma lista de RAG/RDQA, convênios e uma "prestação de contas" com valores escritos no código — removidos.
Produção (diário, por equipe, PDF) fica em relatorio_producao*.py, com o mesmo prefixo.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/relatorios", tags=["Relatórios"])
NOTA = ("RAG e RDQA vêm do DigiSUS Gestor (Módulo Planejamento) e a execução financeira do SIOPS/FNS. "
        "Os relatórios, convênios e valores que existiam aqui não vieram dessas fontes e foram removidos. "
        "Repasses reais: telas do FNS; aplicação em saúde: SIOPS.")


def _nao_disponivel() -> dict:
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA,
            "verificado_em": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}


@router.get("/dashboard")
async def dashboard():
    return _nao_disponivel()


@router.get("/lista")
async def listar_relatorios():
    return _nao_disponivel()


@router.get("/downloads")
async def downloads():
    return _nao_disponivel()


@router.get("/financeiro")
async def relatorio_financeiro(ano: int = 0):
    return _nao_disponivel()


@router.get("/por-bloco")
async def relatorio_por_bloco(ano: int = 0):
    return _nao_disponivel()


@router.get("/por-programa")
async def relatorio_por_programa(ano: int = 0):
    return _nao_disponivel()


@router.get("/prestacao-contas")
async def prestacao_contas(ano: int = 0):
    return _nao_disponivel()


@router.get("/exportar-csv")
async def exportar_csv(tipo: str = "financeiro", ano: int = 0):
    # Antes: CSV com convênios fixos. Sem fonte, não há arquivo para baixar.
    return JSONResponse(_nao_disponivel() | {"detail": NOTA}, status_code=404)


@router.get("/exportar-pdf")
async def exportar_pdf(tipo: str = "gerencial", ano: int = 0):
    # Antes: PDF de uma linha "referencia". Sem fonte, não há arquivo para baixar.
    return JSONResponse(_nao_disponivel() | {"detail": NOTA}, status_code=404)
