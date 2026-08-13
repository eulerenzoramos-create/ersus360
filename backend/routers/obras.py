"""
Router: /api/obras — Módulo 4: Obras e SISMOB — FMS Apuí/AM
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/obras", tags=["Obras"])

# ── Banco de dados em memória ──────────────────────────────────────────────────
_obras: list[dict] = [
    {
        "id": 1,
        "situacao_dado": "referencia_municipal",
        "nome_estabelecimento": "UBS Central de Apuí",
        "tipo_estabelecimento": "UBS",
        "tipo_obra": "Reforma",
        "valor_contrato": 480000.0,
        "empresa_construtora": "Construções do Norte Ltda",
        "engenheiro_resp": "Engº Carlos Mendes",
        "art_numero": "AM-2024-001842",
        "data_inicio": "2024-08-15",
        "data_previsao_conclusao": "2025-04-30",
        "status": "Paralisada",
        "percentual_executado": 48,
        "numero_sismob": "SISMOB-2024-AM-0014",
        "observacoes": "Paralisada por inadimplência da construtora. Processo de rescisão em andamento na PGM.",
    },
    {
        "id": 2,
        "situacao_dado": "referencia_municipal",
        "nome_estabelecimento": "UBS Rio Juma",
        "tipo_estabelecimento": "UBS",
        "tipo_obra": "Construção",
        "valor_contrato": 860000.0,
        "empresa_construtora": "AM Edificações S/A",
        "engenheiro_resp": "Engª Fernanda Castro",
        "art_numero": "AM-2025-003218",
        "data_inicio": "2025-03-01",
        "data_previsao_conclusao": "2026-09-30",
        "status": "Em andamento",
        "percentual_executado": 34,
        "numero_sismob": "SISMOB-2025-AM-0007",
        "observacoes": "Progresso regular. Risco de atraso por estrada intransitável no período chuvoso (dez–mar).",
    },
    {
        "id": 3,
        "situacao_dado": "referencia_municipal",
        "nome_estabelecimento": "CAPS Apuí",
        "tipo_estabelecimento": "CAPS",
        "tipo_obra": "Construção",
        "valor_contrato": 1240000.0,
        "empresa_construtora": "Amazônia Obras e Serviços Ltda",
        "engenheiro_resp": "Engº Ricardo Souza",
        "art_numero": "AM-2025-004411",
        "data_inicio": "2025-06-01",
        "data_previsao_conclusao": "2027-02-28",
        "status": "Em licitação",
        "percentual_executado": 0,
        "numero_sismob": "SISMOB-2025-AM-0019",
        "observacoes": "Licitação publicada em 18/03/2026. Abertura das propostas em 08/04/2026.",
    },
    {
        "id": 4,
        "situacao_dado": "referencia_municipal",
        "nome_estabelecimento": "Academia da Saúde — Bairro Novo Horizonte",
        "tipo_estabelecimento": "Academia da Saúde",
        "tipo_obra": "Construção",
        "valor_contrato": 320000.0,
        "empresa_construtora": "TerraForma Engenharia Ltda",
        "engenheiro_resp": "Engª Patrícia Lima",
        "art_numero": "AM-2024-008201",
        "data_inicio": "2024-10-01",
        "data_previsao_conclusao": "2025-12-30",
        "status": "Concluída",
        "percentual_executado": 100,
        "numero_sismob": "SISMOB-2024-AM-0029",
        "observacoes": "Entregue em 22/12/2025. Inauguração com 120 usuários cadastrados.",
    },
    {
        "id": 5,
        "situacao_dado": "referencia_municipal",
        "nome_estabelecimento": "Reforma Telhado UBS Santo Antônio",
        "tipo_estabelecimento": "UBS",
        "tipo_obra": "Reforma",
        "valor_contrato": 94000.0,
        "empresa_construtora": "Construtora Apuí Serviços",
        "engenheiro_resp": "Engº Marcos Vieira",
        "art_numero": "AM-2026-000118",
        "data_inicio": "2026-02-10",
        "data_previsao_conclusao": "2026-05-10",
        "status": "Em andamento",
        "percentual_executado": 62,
        "numero_sismob": None,
        "observacoes": "Recurso próprio FMS. Prazo mantido conforme cronograma.",
    },
]
_next_id = 6


class ObraCreate(BaseModel):
    nome_estabelecimento: str
    tipo_estabelecimento: str = "UBS"
    tipo_obra: str = "Construção"
    valor_contrato: float = 0.0
    empresa_construtora: str = ""
    engenheiro_resp: str = ""
    art_numero: str = ""
    data_inicio: str = ""
    data_previsao_conclusao: str = ""
    status: str = "Em licitação"
    percentual_executado: float = 0.0
    numero_sismob: Optional[str] = None
    observacoes: str = ""


@router.get("/dashboard")
async def dashboard():
    total = len(_obras)
    andamento = sum(1 for o in _obras if o["status"] == "Em andamento")
    paralisada = sum(1 for o in _obras if o["status"] == "Paralisada")
    concluida = sum(1 for o in _obras if o["status"] == "Concluída")
    licitacao = sum(1 for o in _obras if o["status"] == "Em licitação")
    valor_total = sum(o["valor_contrato"] for o in _obras)
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "total_obras": total,
        "em_andamento": andamento,
        "paralisadas": paralisada,
        "concluidas": concluida,
        "em_licitacao": licitacao,
        "valor_total_contratos": valor_total,
    }


@router.get("/")
async def listar_obras():
    return _obras


@router.post("/")
async def criar_obra(body: ObraCreate):
    global _next_id
    nova = {"id": _next_id, "situacao_dado": "referencia_municipal", **body.model_dump()}
    _obras.append(nova)
    _next_id += 1
    return nova


@router.get("/{obra_id}")
async def detalhar_obra(obra_id: int):
    for o in _obras:
        if o["id"] == obra_id:
            return o
    raise HTTPException(status_code=404, detail="Obra não encontrada")


@router.put("/{obra_id}")
async def atualizar_obra(obra_id: int, body: ObraCreate):
    for i, o in enumerate(_obras):
        if o["id"] == obra_id:
            _obras[i] = {"id": obra_id, "situacao_dado": "referencia_municipal", **body.model_dump()}
            return _obras[i]
    raise HTTPException(status_code=404, detail="Obra não encontrada")


@router.delete("/{obra_id}")
async def remover_obra(obra_id: int):
    for i, o in enumerate(_obras):
        if o["id"] == obra_id:
            _obras.pop(i)
            return {"ok": True}
    raise HTTPException(status_code=404, detail="Obra não encontrada")
