"""
ERSUS 360 — Portais: Portal do Gestor e Portal do Cidadão
Endpoints públicos (sem auth) e endpoints do prefeito
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from routers.auth import get_current_user

router = APIRouter(tags=["Portais"])

# ── Portal do Gestor (autenticado) ────────────────────────────────────────────

@router.get("/api/portal/gestor/resumo")
async def portal_gestor_resumo(_=Depends(get_current_user)):
    return {
        "score_ersus": 72.4,
        "fns_recebido_mes": 187_066.0,
        "execucao_orcamentaria_pct": 81.2,
        "familias_atendidas_esf": 3847,
        "cobertura_vacinal_pct": 90.3,
        "metas_previne_atingidas": 5,
        "metas_previne_total": 7,
        "obras_andamento": 2,
        "alertas_criticos": 3,
        "competencia": "2026-06",
        "fonte": "referencia",
    }

# ── Portal do Cidadão (público — sem autenticação) ────────────────────────────

@router.get("/api/publico/unidades")
async def unidades_publicas():
    return {
        "unidades": [
            {
                "nome": "UBS Central Dr. João Pessoa",
                "endereco": "Av. Castelo Branco, 100 — Centro",
                "telefone": "(97) 3373-1100",
                "horario": "07h às 17h (seg–sex)",
                "servicos": ["Clínica Geral", "Ginecologia", "Pediatria", "Enfermagem", "Vacinas"],
            },
            {
                "nome": "UBS Vila Nova",
                "endereco": "Rua das Flores, 45 — Vila Nova",
                "telefone": "(97) 3373-1101",
                "horario": "07h às 13h (seg–sex)",
                "servicos": ["Clínica Geral", "Enfermagem", "Vacinas"],
            },
            {
                "nome": "UBS Bela Vista",
                "endereco": "Rua Amazonas, 210 — Bela Vista",
                "telefone": "(97) 3373-1102",
                "horario": "07h às 13h (seg–sex)",
                "servicos": ["Clínica Geral", "Enfermagem"],
            },
        ]
    }


@router.get("/api/publico/indicadores")
async def indicadores_publicos():
    return {
        "municipio": "Apuí/AM",
        "competencia": "2026-06",
        "cobertura_ab_pct": 68.5,
        "cobertura_vacinal_pct": 90.3,
        "previne_brasil": [
            {"indicador": "Pré-natal (≥6 consultas)", "resultado_pct": 82.0, "meta_pct": 60.0},
            {"indicador": "Citopatológico de colo uterino", "resultado_pct": 71.0, "meta_pct": 60.0},
            {"indicador": "Vacinas DTP/Penta em dia", "resultado_pct": 91.0, "meta_pct": 90.0},
            {"indicador": "Pré-natal na 1ª semana", "resultado_pct": 63.0, "meta_pct": 60.0},
            {"indicador": "Hipertensão controlada", "resultado_pct": 58.0, "meta_pct": 60.0},
            {"indicador": "Diabetes controlada", "resultado_pct": 55.0, "meta_pct": 60.0},
            {"indicador": "Desenvolvimento infantil", "resultado_pct": 78.0, "meta_pct": 60.0},
        ],
        "fonte": "sisab",
    }


@router.get("/api/publico/obras")
async def obras_publicas():
    return {
        "obras": [
            {
                "descricao": "Reforma e Ampliação UBS Central",
                "status": "em_execucao",
                "percentual_fisico": 68,
                "valor_total": 420000,
                "origem_recurso": "Emenda Parlamentar",
                "previsao_conclusao": "2026-09",
            },
            {
                "descricao": "Construção da Farmácia Central Municipal",
                "status": "contratada",
                "percentual_fisico": 0,
                "valor_total": 180000,
                "origem_recurso": "FNS — PAB Investimento",
                "previsao_conclusao": "2026-12",
            },
        ]
    }


class OuvidoriaEntrada(BaseModel):
    tipo: str
    assunto: str
    descricao: str
    unidade: Optional[str] = None
    contato: Optional[str] = None


@router.post("/api/publico/ouvidoria")
async def registrar_ouvidoria(dados: OuvidoriaEntrada):
    protocolo = f"OUV-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}"
    return {
        "protocolo": protocolo,
        "mensagem": "Manifestação registrada com sucesso",
        "prazo_resposta": "30 dias úteis conforme Lei de Acesso à Informação",
        "acompanhamento": f"Para acompanhar, informe o protocolo: {protocolo}",
    }


@router.get("/api/publico/ouvidoria/{protocolo}")
async def acompanhar_ouvidoria(protocolo: str):
    return {
        "protocolo": protocolo,
        "status": "em_analise",
        "descricao": "Sua manifestação está sendo analisada pela Ouvidoria Municipal de Saúde.",
        "prazo_resposta": "30 dias úteis",
        "data_registro": datetime.now().strftime("%Y-%m-%d"),
    }
