"""
Router: /api/ia — IA Gestora (Claude API)
Chat contextualizado com dados reais do banco de dados.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
import anthropic

from config import settings
from database import get_db
from routers.auth import get_current_user, UserOut
from services.ia_service import responder_ia

router = APIRouter(prefix="/api/ia", tags=["IA Gestora"])

PERGUNTAS_SUGERIDAS = [
    "Quanto o município recebeu em 2026?",
    "Quanto foi recebido para Atenção Básica (APS)?",
    "Existe saldo do Piso da Enfermagem?",
    "Qual recurso vence primeiro?",
    "Quais recursos estão parados há mais tempo?",
    "Quais obras estão atrasadas?",
    "Quais programas possuem baixa execução?",
    "Quanto existe disponível em conta hoje?",
]

_historico: list[dict] = []

SYSTEM_PROMPT = """Você é a IA Gestora do ERSUS 360, assistente especialista em gestão municipal do SUS para o Fundo Municipal de Saúde de Apuí/AM (Amazonas, código IBGE 1300144).

CONTEXTO ATUAL (Junho/2026):
- Indicadores: 14/20 atingidos (70%), execução média 74%
- Repasses federais: R$ 2.300.000,00 recebidos no período
- Execução MAC: 41% — CRÍTICO (meta: 100%)
- Farmácia Popular: 28,4% — CRÍTICO
- Cobertura ESF: 68,4% — ATENÇÃO
- Pré-natal 7+: 85,1% ✓
- Vacinal BCG: 92,3% ✓
- Convênios vigentes: 4 (AB, MAC, Vigilância, Farmácia)
- Alertas ativos: 3 (2 críticos, 1 atenção)
- UBS: 4 unidades, 3 equipes SF ativas

MÓDULOS DO SISTEMA:
- APS: Atenção Primária (SISAB, e-SUS, ICSAP, Previne Brasil)
- FNS/Convênios: repasses federais, sync automático diário às 06h
- Farmácia: Hórus, BNAFAR, estoque, dispensação, Farmácia Popular
- Planejamento: PMS, PAS, RAG automatizado, exportação DIGISUS
- Vigilância: agravos, vacinação, VISA
- Transporte/TFD: frota, manutenção, Tratamento Fora do Domicílio
- Regulação: solicitações, autorizações, tempo médio de espera

LEGISLAÇÃO RELEVANTE:
- Portaria GM/MS nº 3.992/2017 (blocos de financiamento)
- Decreto nº 7.508/2011 (RENAME, Redes de Atenção)
- Previne Brasil (Portaria 2.979/2019)
- NOB-RH/SUS, LGPD aplicada à saúde

Responda sempre em português do Brasil. Seja objetivo, técnico e prático. Cite normas quando relevante. Máximo 5 parágrafos."""


class MensagemChat(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    mensagens: list[MensagemChat]


class ChatResponse(BaseModel):
    resposta: str
    tokens_usados: int | None = None


class PerguntaIn(BaseModel):
    pergunta: str


class RespostaOut(BaseModel):
    pergunta: str
    resposta: str
    timestamp: str


# ── Endpoint contextualizado (usa banco de dados) ────────────────────────────

@router.post("/pergunta", response_model=RespostaOut)
async def fazer_pergunta(
    dados: PerguntaIn,
    db: AsyncSession = Depends(get_db),
    current: UserOut = Depends(get_current_user),
):
    """Responde perguntas em linguagem natural usando dados reais do banco."""
    resposta = await responder_ia(dados.pergunta, db)
    registro = {
        "pergunta": dados.pergunta,
        "resposta": resposta,
        "timestamp": datetime.now().isoformat(),
        "usuario": current.username,
    }
    _historico.append(registro)
    if len(_historico) > 100:
        _historico.pop(0)
    return RespostaOut(
        pergunta=dados.pergunta,
        resposta=resposta,
        timestamp=registro["timestamp"],
    )


@router.get("/historico")
async def historico(
    limit: int = 20,
    _: UserOut = Depends(get_current_user),
):
    return list(reversed(_historico[-limit:]))


@router.get("/sugestoes")
async def sugestoes(_: UserOut = Depends(get_current_user)):
    return {"perguntas": PERGUNTAS_SUGERIDAS}


# ── Endpoint de chat livre (mantido para compatibilidade) ────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(503, "ANTHROPIC_API_KEY não configurada. Adicione ao .env")
    if not body.mensagens:
        raise HTTPException(400, "Forneça ao menos uma mensagem")

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    try:
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": m.role, "content": m.content} for m in body.mensagens],
        )
        texto = response.content[0].text if response.content else ""
        return ChatResponse(
            resposta=texto,
            tokens_usados=response.usage.input_tokens + response.usage.output_tokens,
        )
    except anthropic.AuthenticationError:
        raise HTTPException(401, "ANTHROPIC_API_KEY inválida")
    except anthropic.RateLimitError:
        raise HTTPException(429, "Limite de requisições atingido. Aguarde um momento.")
    except Exception as e:
        raise HTTPException(500, f"Erro ao chamar a IA: {str(e)}")
