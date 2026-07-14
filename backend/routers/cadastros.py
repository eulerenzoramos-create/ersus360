"""Router: /api/cadastros — Cadastros Mestres (Fase 3)
Profissionais, Unidades de Saúde, Equipes, ACS, Medicamentos, Fornecedores
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from routers.auth import get_current_user, UserOut
from config import settings
from services import cnes_service

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
    fonte: str = "referencia"


class UnidadeOut(BaseModel):
    id: int
    cnes: str
    nome: str
    tipo: Optional[str]
    endereco: Optional[str]
    telefone: Optional[str]
    ativa: bool
    fonte: str = "referencia"


class EquipeOut(BaseModel):
    id: int
    ine: Optional[str]
    nome: str
    tipo: str
    unidade_nome: Optional[str]
    num_microareas: Optional[int]
    num_familias: Optional[int]
    ativa: bool
    fonte: str = "referencia"


class ACSOut(BaseModel):
    id: int
    nome: str
    microarea: str
    equipe_nome: Optional[str]
    num_familias: Optional[int]
    num_pessoas: Optional[int]
    ativo: bool


class MedicamentoOut(BaseModel):
    id: int
    dcb: str
    nome_comercial: Optional[str]
    apresentacao: str
    concentracao: str
    componente_rename: str
    controlado: bool
    ativo: bool


class FornecedorOut(BaseModel):
    id: int
    cnpj: str
    razao_social: str
    nome_fantasia: Optional[str]
    telefone: Optional[str]
    email: Optional[str]
    segmento: Optional[str]
    ativo: bool


# ─── Dados de referência Apuí/AM ──────────────────────────────────────────────

PROFISSIONAIS_REF: list[dict] = [
    {"id": 1, "nome": "Dr. Paulo Henrique Costa",      "cns": "705001234567890", "cbo": "225125", "cbo_descricao": "Médico da Família", "vinculo": "estatutario", "carga_horaria": 40, "unidade_nome": "UBS Central Apuí", "equipe_nome": "ESF I", "ativo": True},
    {"id": 2, "nome": "Enf. Ana Clara Souza",          "cns": "705001234567891", "cbo": "223505", "cbo_descricao": "Enfermeiro da Família", "vinculo": "estatutario", "carga_horaria": 40, "unidade_nome": "UBS Central Apuí", "equipe_nome": "ESF I", "ativo": True},
    {"id": 3, "nome": "Dr. Marcos Figueiredo",         "cns": "705001234567892", "cbo": "225125", "cbo_descricao": "Médico da Família", "vinculo": "temporario",  "carga_horaria": 40, "unidade_nome": "UBS Zona Rural",    "equipe_nome": "ESF II", "ativo": True},
    {"id": 4, "nome": "Enf. Rita de Cássia Lima",      "cns": "705001234567893", "cbo": "223505", "cbo_descricao": "Enfermeiro", "vinculo": "estatutario",  "carga_horaria": 40, "unidade_nome": "UBS Zona Rural",    "equipe_nome": "ESF II", "ativo": True},
    {"id": 5, "nome": "CD. Juliana Torres",            "cns": "705001234567894", "cbo": "223208", "cbo_descricao": "Cirurgião Dentista ESF", "vinculo": "estatutario", "carga_horaria": 40, "unidade_nome": "UBS Central Apuí", "equipe_nome": "eSB I", "ativo": True},
    {"id": 6, "nome": "Farm. Carla Dias",              "cns": "705001234567895", "cbo": "223405", "cbo_descricao": "Farmacêutico", "vinculo": "clt", "carga_horaria": 40, "unidade_nome": "Farmácia Central", "equipe_nome": None, "ativo": True},
    {"id": 7, "nome": "Fisio. Roberto Alves",          "cns": "705001234567896", "cbo": "223605", "cbo_descricao": "Fisioterapeuta", "vinculo": "terceirizado", "carga_horaria": 20, "unidade_nome": "UBS Central Apuí", "equipe_nome": "eMulti I", "ativo": True},
    {"id": 8, "nome": "Psic. Fernanda Matos",          "cns": "705001234567897", "cbo": "251510", "cbo_descricao": "Psicólogo", "vinculo": "clt", "carga_horaria": 20, "unidade_nome": "CAPS", "equipe_nome": None, "ativo": True},
]

UNIDADES_REF: list[dict] = [
    {"id": 1, "cnes": "2784563", "nome": "UBS Central Apuí",        "tipo": "Centro de Saúde / UBS", "endereco": "Av. Airton Senna, 100 — Centro", "telefone": "(97) 3571-1200", "ativa": True},
    {"id": 2, "cnes": "2784571", "nome": "UBS Zona Rural — Maici",  "tipo": "Posto de Saúde",         "endereco": "Estrada AM-174, Km 30",           "telefone": None,              "ativa": True},
    {"id": 3, "cnes": "2784589", "nome": "Farmácia Central",        "tipo": "Farmácia",               "endereco": "Av. Airton Senna, 120 — Centro",  "telefone": "(97) 3571-1210", "ativa": True},
    {"id": 4, "cnes": "2784597", "nome": "CAPS Apuí",               "tipo": "CAPS",                   "endereco": "Rua das Flores, 50 — Centro",      "telefone": "(97) 3571-1220", "ativa": True},
]

EQUIPES_REF: list[dict] = [
    {"id": 1, "ine": "0000000001", "nome": "ESF I — Centro",       "tipo": "ESF",    "unidade_nome": "UBS Central Apuí",       "num_microareas": 5, "num_familias": 850,  "ativa": True},
    {"id": 2, "ine": "0000000002", "nome": "ESF II — Zona Rural",  "tipo": "eSFR",   "unidade_nome": "UBS Zona Rural — Maici", "num_microareas": 4, "num_familias": 620,  "ativa": True},
    {"id": 3, "ine": "0000000003", "nome": "eSB I — Centro",       "tipo": "eSB",    "unidade_nome": "UBS Central Apuí",       "num_microareas": None, "num_familias": None, "ativa": True},
    {"id": 4, "ine": "0000000004", "nome": "eMulti I — Centro",    "tipo": "eMulti", "unidade_nome": "UBS Central Apuí",       "num_microareas": None, "num_familias": None, "ativa": True},
]

ACS_REF: list[dict] = [
    {"id": 1, "nome": "Maria das Graças Lima",  "microarea": "01", "equipe_nome": "ESF I", "num_familias": 142, "num_pessoas": 498, "ativo": True},
    {"id": 2, "nome": "José Raimundo Pereira",  "microarea": "02", "equipe_nome": "ESF I", "num_familias": 138, "num_pessoas": 472, "ativo": True},
    {"id": 3, "nome": "Ana Beatriz Santos",     "microarea": "03", "equipe_nome": "ESF I", "num_familias": 155, "num_pessoas": 531, "ativo": True},
    {"id": 4, "nome": "Carlos Eduardo Silva",   "microarea": "04", "equipe_nome": "ESF I", "num_familias": 130, "num_pessoas": 445, "ativo": True},
    {"id": 5, "nome": "Rosa Maria Ferreira",    "microarea": "05", "equipe_nome": "ESF I", "num_familias": 144, "num_pessoas": 489, "ativo": True},
    {"id": 6, "nome": "Francisco Assis Costa",  "microarea": "01", "equipe_nome": "ESF II", "num_familias": 152, "num_pessoas": 518, "ativo": True},
    {"id": 7, "nome": "Luciana Oliveira",        "microarea": "02", "equipe_nome": "ESF II", "num_familias": 139, "num_pessoas": 462, "ativo": True},
    {"id": 8, "nome": "Pedro Augusto Nunes",    "microarea": "03", "equipe_nome": "ESF II", "num_familias": 146, "num_pessoas": 501, "ativo": True},
    {"id": 9, "nome": "Antônia Rodrigues",      "microarea": "04", "equipe_nome": "ESF II", "num_familias": 128, "num_pessoas": 437, "ativo": True},
]

MEDICAMENTOS_REF: list[dict] = [
    {"id": 1,  "dcb": "Amoxicilina",           "nome_comercial": None,          "apresentacao": "Cápsula 500mg",         "concentracao": "500mg",  "componente_rename": "basico",    "controlado": False, "ativo": True},
    {"id": 2,  "dcb": "Metformina",             "nome_comercial": None,          "apresentacao": "Comprimido 500mg",      "concentracao": "500mg",  "componente_rename": "basico",    "controlado": False, "ativo": True},
    {"id": 3,  "dcb": "Captopril",              "nome_comercial": None,          "apresentacao": "Comprimido 25mg",       "concentracao": "25mg",   "componente_rename": "basico",    "controlado": False, "ativo": True},
    {"id": 4,  "dcb": "Losartana Potássica",    "nome_comercial": None,          "apresentacao": "Comprimido 50mg",       "concentracao": "50mg",   "componente_rename": "basico",    "controlado": False, "ativo": True},
    {"id": 5,  "dcb": "Atorvastatina",          "nome_comercial": None,          "apresentacao": "Comprimido 20mg",       "concentracao": "20mg",   "componente_rename": "basico",    "controlado": False, "ativo": True},
    {"id": 6,  "dcb": "Clonazepam",             "nome_comercial": "Rivotril",    "apresentacao": "Comprimido 2mg",        "concentracao": "2mg",    "componente_rename": "basico",    "controlado": True,  "ativo": True},
    {"id": 7,  "dcb": "Risperidona",            "nome_comercial": None,          "apresentacao": "Comprimido 2mg",        "concentracao": "2mg",    "componente_rename": "especializado", "controlado": False, "ativo": True},
    {"id": 8,  "dcb": "Rifampicina + Isoniazida", "nome_comercial": None,        "apresentacao": "Comprimido 150+75mg",   "concentracao": "combo",  "componente_rename": "estrategico","controlado": False, "ativo": True},
    {"id": 9,  "dcb": "Insulina Humana NPH",    "nome_comercial": None,          "apresentacao": "Frasco-ampola 100UI/mL","concentracao": "100UI/mL","componente_rename": "basico",   "controlado": False, "ativo": True},
    {"id": 10, "dcb": "Sulfato Ferroso",         "nome_comercial": None,         "apresentacao": "Comprimido 40mg",       "concentracao": "40mg",   "componente_rename": "basico",    "controlado": False, "ativo": True},
]

FORNECEDORES_REF: list[dict] = [
    {"id": 1, "cnpj": "12.345.678/0001-90", "razao_social": "Farmácias Reunidas Ltda",    "nome_fantasia": "FarmaRedes",   "telefone": "(92) 3333-1111", "email": "compras@farmaredes.com.br",  "segmento": "Medicamentos",  "ativo": True},
    {"id": 2, "cnpj": "98.765.432/0001-10", "razao_social": "MedSupply Distribuidora",    "nome_fantasia": "MedSupply",    "telefone": "(92) 3333-2222", "email": "vendas@medsupply.com.br",   "segmento": "Equipamentos",  "ativo": True},
    {"id": 3, "cnpj": "11.222.333/0001-44", "razao_social": "EPI Saúde Comercial Eireli", "nome_fantasia": "EPI Saúde",    "telefone": "(92) 3333-3333", "email": "epi@episaude.com.br",        "segmento": "EPI / Insumos", "ativo": True},
]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/profissionais", response_model=list[ProfissionalOut])
async def listar_profissionais(
    ativo: Optional[bool] = Query(None),
    equipe: Optional[str] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    dados = PROFISSIONAIS_REF
    if ativo is not None:
        dados = [p for p in dados if p["ativo"] == ativo]
    if equipe:
        dados = [p for p in dados if (p.get("equipe_nome") or "").lower() == equipe.lower()]
    return [ProfissionalOut(**p, fonte="referencia") for p in dados]


@router.get("/profissionais/{prof_id}", response_model=ProfissionalOut)
async def get_profissional(prof_id: int, usuario: UserOut = Depends(get_current_user)):
    p = next((x for x in PROFISSIONAIS_REF if x["id"] == prof_id), None)
    if not p:
        raise HTTPException(404, "Profissional não encontrado")
    return ProfissionalOut(**p, fonte="referencia")


@router.get("/unidades", response_model=list[UnidadeOut])
async def listar_unidades(usuario: UserOut = Depends(get_current_user)):
    cnes_data = await cnes_service.buscar_estabelecimentos()
    if cnes_data:
        result = []
        for idx, e in enumerate(cnes_data, start=1):
            result.append(UnidadeOut(
                id=idx,
                cnes=str(e.get("cnes", "")),
                nome=e.get("nome", ""),
                tipo=e.get("tipo", ""),
                endereco=f'{e.get("logradouro", "")} — {e.get("bairro", "")}'.strip(" — "),
                telefone=e.get("telefone"),
                ativa=e.get("ativo", True),
                fonte="cnes_datasus",
            ))
        return result
    return [UnidadeOut(**u, fonte="referencia") for u in UNIDADES_REF]


@router.get("/equipes", response_model=list[EquipeOut])
async def listar_equipes(
    tipo: Optional[str] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    dados = EQUIPES_REF
    if tipo:
        dados = [e for e in dados if e["tipo"].lower() == tipo.lower()]
    return [EquipeOut(**e, fonte="referencia") for e in dados]


@router.get("/acs", response_model=list[ACSOut])
async def listar_acs(
    equipe: Optional[str] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    dados = ACS_REF
    if equipe:
        dados = [a for a in dados if (a.get("equipe_nome") or "").lower() == equipe.lower()]
    return [ACSOut(**a) for a in dados]


@router.get("/medicamentos", response_model=list[MedicamentoOut])
async def listar_medicamentos(
    componente: Optional[str] = Query(None),
    controlado: Optional[bool] = Query(None),
    usuario: UserOut = Depends(get_current_user),
):
    dados = MEDICAMENTOS_REF
    if componente:
        dados = [m for m in dados if m["componente_rename"] == componente]
    if controlado is not None:
        dados = [m for m in dados if m["controlado"] == controlado]
    return [MedicamentoOut(**m) for m in dados]


@router.get("/fornecedores", response_model=list[FornecedorOut])
async def listar_fornecedores(usuario: UserOut = Depends(get_current_user)):
    return [FornecedorOut(**f) for f in FORNECEDORES_REF]


@router.get("/resumo")
async def resumo_cadastros(usuario: UserOut = Depends(get_current_user)):
    return {
        "profissionais_ativos": sum(1 for p in PROFISSIONAIS_REF if p["ativo"]),
        "unidades_ativas":      sum(1 for u in UNIDADES_REF if u["ativa"]),
        "equipes_ativas":       sum(1 for e in EQUIPES_REF if e["ativa"]),
        "acs_ativos":           sum(1 for a in ACS_REF if a["ativo"]),
        "familias_cadastradas": sum(a["num_familias"] or 0 for a in ACS_REF if a["ativo"]),
        "medicamentos_ativos":  sum(1 for m in MEDICAMENTOS_REF if m["ativo"]),
        "fornecedores_ativos":  sum(1 for f in FORNECEDORES_REF if f["ativo"]),
        "municipio": settings.MUNICIPIO_NOME,
        "ibge": settings.MUNICIPIO_IBGE,
        "fonte": "referencia",
    }
