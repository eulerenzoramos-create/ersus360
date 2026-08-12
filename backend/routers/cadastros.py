"""Router: /api/cadastros — Cadastros Mestres (Fase 3)
Profissionais, Unidades de Saude, Equipes, ACS, Medicamentos, Fornecedores

Dados reais via CNES/DATASUS e e-SUS PEC (Railway env vars).
API indisponivel → nao_disponivel ou lista vazia. Nunca dados ficticios.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from routers.auth import get_current_user, UserOut
from config import settings
from services import cnes_service, esus_service

router = APIRouter(prefix="/api/cadastros", tags=["Cadastros Mestres"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ProfissionalOut(BaseModel):
    id: int
    nome: str
    cns: Optional[str]
    cbo: Optional[str]
    cbo_descricao: Optional[str]
    vinculo: Optional[str]
    carga_horaria: Optional[int]
    unidade_nome: Optional[str]
    equipe_nome: Optional[str]
    ativo: bool
    situacao_dado: str = "nao_disponivel"
    fonte: str = "nao_disponivel"


class UnidadeOut(BaseModel):
    id: int
    cnes: str
    nome: str
    tipo: Optional[str]
    endereco: Optional[str]
    telefone: Optional[str]
    ativa: bool
    situacao_dado: str = "oficial_aguardando"
    fonte: str = "cnes_datasus"


class EquipeOut(BaseModel):
    id: int
    ine: Optional[str]
    nome: str
    tipo: str
    unidade_nome: Optional[str]
    num_microareas: Optional[int]
    num_familias: Optional[int]
    ativa: bool
    situacao_dado: str = "nao_disponivel"
    fonte: str = "nao_disponivel"


class ACSOut(BaseModel):
    id: int
    nome: str
    microarea: str
    equipe_nome: Optional[str]
    num_familias: Optional[int]
    num_pessoas: Optional[int]
    ativo: bool
    situacao_dado: str = "nao_disponivel"


class MedicamentoOut(BaseModel):
    id: int
    dcb: str
    nome_comercial: Optional[str]
    apresentacao: str
    concentracao: str
    componente_rename: str
    controlado: bool
    ativo: bool
    situacao_dado: str = "nao_disponivel"


class FornecedorOut(BaseModel):
    id: int
    cnpj: str
    razao_social: str
    nome_fantasia: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    segmento: Optional[str]
    ativo: bool
    situacao_dado: str = "nao_disponivel"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/profissionais")
async def listar_profissionais(
    ativo: Optional[bool] = Query(None),
    equipe: Optional[str] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    """Profissionais de saude via e-SUS PEC. Retorna lista vazia se API indisponivel."""
    dados = await esus_service.buscar_profissionais()
    if ativo is not None:
        dados = [p for p in dados if p.get("ativo", True) == ativo]
    if equipe:
        dados = [p for p in dados if (p.get("equipe_nome") or "").lower() == equipe.lower()]
    return dados


@router.get("/profissionais/{prof_id}")
async def get_profissional(prof_id: int, usuario: UserOut = Depends(get_current_user)):
    """Profissional por ID — busca na lista do e-SUS PEC."""
    dados = await esus_service.buscar_profissionais()
    p = next((x for x in dados if x.get("id") == prof_id), None)
    if not p:
        raise HTTPException(404, "Profissional nao encontrado ou e-SUS PEC indisponivel")
    return p


@router.get("/unidades", response_model=list[UnidadeOut])
async def listar_unidades(usuario: UserOut = Depends(get_current_user)):
    """Unidades de saude via CNES/DATASUS. Fallback: dados confirmados CNES2 11/08/2026."""
    cnes_data = await cnes_service.buscar_estabelecimentos()
    result = []
    for idx, e in enumerate(cnes_data, start=1):
        result.append(UnidadeOut(
            id=idx,
            cnes=str(e.get("cnes", "")),
            nome=e.get("nome", ""),
            tipo=e.get("tipo", ""),
            endereco=f'{e.get("logradouro", "")} — {e.get("bairro", "")}'.strip(" — ") or None,
            telefone=e.get("telefone") or None,
            ativa=e.get("ativo", True),
            situacao_dado="oficial_aguardando",
            fonte="cnes_datasus",
        ))
    return result


@router.get("/equipes")
async def listar_equipes(
    tipo: Optional[str] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    """Equipes ESF via CNES/DATASUS. Dados confirmados 11/08/2026 — INEs pendentes."""
    dados = await cnes_service.buscar_equipes_saude()
    if tipo:
        dados = [e for e in dados if (e.get("tipo") or "").lower() == tipo.lower()]
    return [
        {**e, "situacao_dado": "oficial_aguardando", "fonte": "cnes_datasus"}
        for e in dados
    ]


@router.get("/acs")
async def listar_acs(
    equipe: Optional[str] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    """ACS cadastrados — requer integracao com e-SUS PEC ou CNES."""
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Cadastro de ACS requer integracao com e-SUS PEC. Configure ESUS_URL no Railway.",
    }


@router.get("/medicamentos")
async def listar_medicamentos(
    componente: Optional[str] = Query(None),
    controlado: Optional[bool] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    """Medicamentos — requer integracao com sistema de farmacia municipal."""
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Estoque de medicamentos requer integracao com SIAFARM ou sistema local.",
    }


@router.get("/fornecedores")
async def listar_fornecedores(usuario: UserOut = Depends(get_current_user)):
    """Fornecedores — requer integracao com sistema de compras/licitacoes."""
    return {
        "situacao_dado": "nao_disponivel",
        "dados": [],
        "nota": "Cadastro de fornecedores requer integracao com sistema de licitacoes municipal.",
    }


@router.get("/resumo")
async def resumo_cadastros(usuario: UserOut = Depends(get_current_user)):
    unidades = await cnes_service.buscar_estabelecimentos()
    equipes  = await cnes_service.buscar_equipes_saude()
    profissionais = await esus_service.buscar_profissionais()
    return {
        "profissionais_ativos": len(profissionais) if profissionais else None,
        "unidades_ativas":      len(unidades)       if unidades      else None,
        "equipes_ativas":       len(equipes)        if equipes       else None,
        "acs_ativos":           None,
        "familias_cadastradas": None,
        "medicamentos_ativos":  None,
        "fornecedores_ativos":  None,
        "municipio":            settings.MUNICIPIO_NOME,
        "ibge":                 settings.MUNICIPIO_IBGE,
        "situacao_dado":        "oficial_aguardando",
        "nota": "Unidades e equipes: CNES/DATASUS. Profissionais: e-SUS PEC. ACS/medicamentos/fornecedores: nao_disponivel.",
    }
