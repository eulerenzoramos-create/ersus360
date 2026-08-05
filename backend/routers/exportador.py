from fastapi import APIRouter
from typing import Optional
import uuid
from functools import lru_cache

router = APIRouter(prefix="/api/exportador", tags=["exportador"])

@lru_cache(maxsize=1)
def _RELATORIOS():
    return [
        {
            "id": "REL-001", "nome": "Relatório de Gestão Quadrimestral",
            "descricao": "Consolidação dos indicadores do 2º quadrimestre 2026 (LC 141/2012)",
            "modulo": "Gestão", "formatos": ["pdf", "excel"],
            "ultima_geracao": "20/07/2026 14:30", "tempo_estimado_s": 12,
        },
        {
            "id": "REL-002", "nome": "Produção APS — Boletim Mensal",
            "descricao": "Atendimentos, CID-10 frequentes e fichas SISAB de Jul/2026",
            "modulo": "APS", "formatos": ["pdf", "excel", "csv"],
            "ultima_geracao": "23/07/2026 09:00", "tempo_estimado_s": 8,
        },
        {
            "id": "REL-003", "nome": "Mapa de Cobertura Vacinal PNI",
            "descricao": "Cobertura por imunobiológico vs. meta — competência Jul/2026",
            "modulo": "Vigilância", "formatos": ["pdf", "excel"],
            "ultima_geracao": "22/07/2026 10:00", "tempo_estimado_s": 6,
        },
        {
            "id": "REL-004", "nome": "Extrato Financeiro — Repasses FNS",
            "descricao": "Cronograma e execução de repasses federais de saúde — 2026",
            "modulo": "Financeiro", "formatos": ["pdf", "excel", "csv"],
            "ultima_geracao": "21/07/2026 11:45", "tempo_estimado_s": 5,
        },
        {
            "id": "REL-005", "nome": "Inventário do Almoxarifado",
            "descricao": "Posição de estoque, validades e movimentações — Jul/2026",
            "modulo": "Gestão", "formatos": ["excel", "csv"],
            "ultima_geracao": "24/07/2026 07:00", "tempo_estimado_s": 4,
        },
        {
            "id": "REL-006", "nome": "Indicadores IDSUS Municipal",
            "descricao": "Painel IDSUS por dimensão com comparativo estadual",
            "modulo": "Gestão", "formatos": ["pdf", "excel"],
            "ultima_geracao": None, "tempo_estimado_s": 10,
        },
        {
            "id": "REL-007", "nome": "Ata e Deliberações do CMS",
            "descricao": "Atas de reuniões e deliberações do Conselho Municipal de Saúde — 2026",
            "modulo": "Gestão", "formatos": ["pdf"],
            "ultima_geracao": "18/07/2026 16:00", "tempo_estimado_s": 7,
        },
        {
            "id": "REL-008", "nome": "Indicadores Saúde Bucal — CEO e SB Brasil",
            "descricao": "Desempenho dos indicadores odontológicos e procedimentos ambulatoriais",
            "modulo": "Saúde Bucal", "formatos": ["pdf", "excel"],
            "ultima_geracao": "19/07/2026 14:00", "tempo_estimado_s": 6,
        },
        {
            "id": "REL-009", "nome": "Carteira de Contratos",
            "descricao": "Situação dos contratos vigentes, vencendo e vencidos do FMS",
            "modulo": "Gestão", "formatos": ["pdf", "excel"],
            "ultima_geracao": "24/07/2026 08:30", "tempo_estimado_s": 5,
        },
        {
            "id": "REL-010", "nome": "Relatório de Busca Ativa — Priorização IA",
            "descricao": "Lista priorizada de pacientes por score de risco gerado pela IA",
            "modulo": "APS", "formatos": ["pdf", "excel"],
            "ultima_geracao": "23/07/2026 08:00", "tempo_estimado_s": 9,
        },
        {
            "id": "REL-011", "nome": "Mapa Sanitário — Unidades de Saúde",
            "descricao": "Ficha técnica e indicadores de cobertura de todas as unidades de Apuí/AM",
            "modulo": "Gestão", "formatos": ["pdf"],
            "ultima_geracao": "15/07/2026 10:00", "tempo_estimado_s": 8,
        },
        {
            "id": "REL-012", "nome": "Relatório de Equipamentos Médicos",
            "descricao": "Status, histórico de manutenção e depreciação do parque tecnológico",
            "modulo": "Gestão", "formatos": ["pdf", "excel"],
            "ultima_geracao": "10/07/2026 14:00", "tempo_estimado_s": 6,
        },
    ]


_geracoes_mes = 23

@router.get("/resumo")
def resumo():
    return {
        "relatorios_disponiveis": len(_RELATORIOS()),
        "geracoes_mes": _geracoes_mes,
        "ultima_exportacao": "24/07/2026 09:00",
        "formatos_suportados": ["pdf", "excel", "csv"],
    }

@router.get("/lista")
def lista(modulo: Optional[str] = None):
    items = list(_RELATORIOS)
    if modulo:
        items = [r for r in items if r["modulo"] == modulo]
    return items

@router.post("/gerar")
def gerar(body: dict):
    rel_id = body.get("relatorio_id", "")
    fmt    = body.get("formato", "pdf")
    rel    = next((r for r in _RELATORIOS() if r["id"] == rel_id), None)
    nome   = rel["nome"] if rel else "Relatório"
    job_id = str(uuid.uuid4())[:8].upper()
    return {
        "job_id":       f"JOB-{job_id}",
        "relatorio_id": rel_id,
        "nome":         nome,
        "formato":      fmt,
        "status":       "concluido",
        "criado_em":    "24/07/2026 08:45",
        "url_download": f"/static/exports/{rel_id.lower()}.{fmt}",
        "erro":         None,
    }
