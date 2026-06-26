"""
Router: /api/farmacia — Gestão da Assistência Farmacêutica
Hórus · BNAFAR · Estoque · Dispensação · Farmácia Popular
"""
from __future__ import annotations
from datetime import datetime, date
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from database import get_db

router = APIRouter(prefix="/api/farmacia", tags=["Farmácia"])
DbDep = Annotated[AsyncSession, Depends(get_db)]


class MedicamentoEstoque(BaseModel):
    id: int
    nome: str
    principio_ativo: str
    forma_farmaceutica: str
    apresentacao: str
    estoque_atual: int
    estoque_minimo: int
    estoque_maximo: int
    situacao: str   # "ok" | "critico" | "zerado" | "excesso"
    validade: str | None = None
    programa: str   # "RENAME" | "COMPONENTE_BASICO" | "POPULAR"


class DispensacaoMes(BaseModel):
    mes: str
    total_dispensacoes: int
    usuarios_atendidos: int
    medicamentos_dispensados: int


class FarmaciaDashboard(BaseModel):
    total_medicamentos: int
    itens_criticos: int
    itens_zerados: int
    dispensacoes_mes: int
    usuarios_atendidos_mes: int
    execucao_popular: float
    execucao_bnafar: float
    competencia: str
    atualizado_em: datetime


@router.get("/dashboard", response_model=FarmaciaDashboard)
async def farmacia_dashboard(municipio_id: int = Query(1)):
    return FarmaciaDashboard(
        total_medicamentos=89,
        itens_criticos=3,
        itens_zerados=1,
        dispensacoes_mes=1247,
        usuarios_atendidos_mes=412,
        execucao_popular=28.4,   # crítico
        execucao_bnafar=61.2,
        competencia="2026-06",
        atualizado_em=datetime.utcnow(),
    )


@router.get("/estoque", response_model=list[MedicamentoEstoque])
async def listar_estoque(
    municipio_id: int = Query(1),
    situacao: str | None = Query(None),
):
    """Estoque de medicamentos com situação semáforo."""
    estoque = [
        MedicamentoEstoque(id=1, nome="Amoxicilina 500mg", principio_ativo="Amoxicilina", forma_farmaceutica="Cápsula",
            apresentacao="Cx 21 cáp", estoque_atual=450, estoque_minimo=200, estoque_maximo=1000,
            situacao="ok", validade="2027-03", programa="COMPONENTE_BASICO"),
        MedicamentoEstoque(id=2, nome="Metformina 850mg", principio_ativo="Metformina", forma_farmaceutica="Comprimido",
            apresentacao="Cx 30 comp", estoque_atual=85, estoque_minimo=300, estoque_maximo=900,
            situacao="critico", validade="2026-12", programa="POPULAR"),
        MedicamentoEstoque(id=3, nome="Losartana 50mg", principio_ativo="Losartana Potássica", forma_farmaceutica="Comprimido",
            apresentacao="Cx 30 comp", estoque_atual=42, estoque_minimo=400, estoque_maximo=1200,
            situacao="critico", validade="2026-11", programa="POPULAR"),
        MedicamentoEstoque(id=4, nome="Enalapril 10mg", principio_ativo="Enalapril", forma_farmaceutica="Comprimido",
            apresentacao="Cx 30 comp", estoque_atual=0, estoque_minimo=200, estoque_maximo=800,
            situacao="zerado", validade=None, programa="COMPONENTE_BASICO"),
        MedicamentoEstoque(id=5, nome="Azitromicina 500mg", principio_ativo="Azitromicina", forma_farmaceutica="Comprimido",
            apresentacao="Cx 3 comp", estoque_atual=280, estoque_minimo=100, estoque_maximo=500,
            situacao="ok", validade="2027-06", programa="COMPONENTE_BASICO"),
        MedicamentoEstoque(id=6, nome="Atorvastatina 20mg", principio_ativo="Atorvastatina", forma_farmaceutica="Comprimido",
            apresentacao="Cx 30 comp", estoque_atual=156, estoque_minimo=200, estoque_maximo=600,
            situacao="critico", validade="2026-10", programa="POPULAR"),
        MedicamentoEstoque(id=7, nome="Omeprazol 20mg", principio_ativo="Omeprazol", forma_farmaceutica="Cápsula",
            apresentacao="Cx 28 cáp", estoque_atual=620, estoque_minimo=150, estoque_maximo=700,
            situacao="ok", validade="2027-05", programa="COMPONENTE_BASICO"),
        MedicamentoEstoque(id=8, nome="Glibenclamida 5mg", principio_ativo="Glibenclamida", forma_farmaceutica="Comprimido",
            apresentacao="Cx 30 comp", estoque_atual=310, estoque_minimo=100, estoque_maximo=600,
            situacao="ok", validade="2027-02", programa="POPULAR"),
    ]
    if situacao:
        estoque = [m for m in estoque if m.situacao == situacao]
    return estoque


@router.get("/dispensacoes", response_model=list[DispensacaoMes])
async def dispensacoes_mensais(municipio_id: int = Query(1), ano: int = Query(2026)):
    return [
        DispensacaoMes(mes="Janeiro", total_dispensacoes=1089, usuarios_atendidos=361, medicamentos_dispensados=42),
        DispensacaoMes(mes="Fevereiro", total_dispensacoes=1142, usuarios_atendidos=378, medicamentos_dispensados=45),
        DispensacaoMes(mes="Março", total_dispensacoes=1198, usuarios_atendidos=394, medicamentos_dispensados=44),
        DispensacaoMes(mes="Abril", total_dispensacoes=1165, usuarios_atendidos=386, medicamentos_dispensados=43),
        DispensacaoMes(mes="Maio", total_dispensacoes=1221, usuarios_atendidos=401, medicamentos_dispensados=46),
        DispensacaoMes(mes="Junho", total_dispensacoes=1247, usuarios_atendidos=412, medicamentos_dispensados=47),
    ]


@router.get("/programas")
async def programas_farmacia(municipio_id: int = Query(1)):
    """Execução por programa farmacêutico."""
    return [
        {"programa": "Farmácia Popular", "previsto": 610000, "realizado": 173240, "execucao": 28.4, "situacao": "critico"},
        {"programa": "Componente Básico (BNAFAR)", "previsto": 280000, "realizado": 171360, "execucao": 61.2, "situacao": "atencao"},
        {"programa": "Hórus — Estoque e Dispensação", "previsto": 0, "realizado": 0, "execucao": 100.0, "situacao": "ok"},
    ]
