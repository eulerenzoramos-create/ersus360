"""
Router: /api/linha-tempo — Linha do Tempo Unificada do Cidadão — ERSUS 360

Sem integração com RNDS / e-SUS PEC, NÃO há histórico de cidadão a mostrar. Até 21/10/2026 esta rota
devolvia, para qualquer CNS consultado, a mesma lista de eventos clínicos inventados (consulta CID J06,
vacina, preventivo, encaminhamento TFD…) — um prontuário falso atribuído a quem fosse buscado.
Agora responde nao_disponivel e nunca devolve evento.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/linha-tempo", tags=["linha-tempo"])

NOTA = ("A linha do tempo do cidadão depende da integração com a RNDS e o e-SUS PEC, que ainda não está ativa. "
        "Nenhum dado de paciente é exibido nem estimado.")


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/cidadao")
async def buscar_cidadao(cns: str = Query(...)):
    return {"situacao_dado": "nao_disponivel", "dados": None, "nota": NOTA, "verificado_em": _ts()}


@router.get("/eventos")
async def listar_eventos(cns: str = Query(...), fontes: Optional[str] = Query(None), tipo: Optional[str] = Query(None)):
    return {"situacao_dado": "nao_disponivel", "dados": [], "eventos": [], "total_eventos": 0, "nota": NOTA,
            "verificado_em": _ts()}
