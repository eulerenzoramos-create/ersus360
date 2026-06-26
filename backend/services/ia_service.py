"""
IA Service — Módulo 11: IA Gestora
Consulta o banco em tempo real e usa Claude para responder em linguagem natural.
"""
from __future__ import annotations
import logging
from datetime import datetime

import anthropic
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models import Convenio, Repasse, Indicador, Municipio
from models.alerta import Alerta, SeveridadeAlerta
from models.execucao import Empenho, Pagamento, AplicacaoFinanceira
from models.obra import Obra, StatusObra

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Você é o assistente financeiro do ERSUS 360, sistema de gestão do Fundo Municipal de Saúde.
Você tem acesso aos dados reais do município e deve responder de forma clara, objetiva e precisa.
Use os dados de contexto fornecidos. Formate valores monetários como R$ X.XXX.XX.
Seja direto e informativo. Se não tiver dados suficientes, informe ao gestor o que falta verificar."""


async def _coletar_contexto(db: AsyncSession) -> dict:
    """Coleta um snapshot dos dados financeiros do banco para enriquecer o prompt."""
    ctx: dict = {}

    # Município
    res_mun = await db.execute(select(Municipio).limit(1))
    mun = res_mun.scalar_one_or_none()
    if mun:
        ctx["municipio"] = f"{mun.nome}/{mun.uf} (IBGE: {mun.codigo_ibge})"

    # Totais de repasses por bloco
    stmt_rep = select(
        Repasse.tipo_repasse,
        func.sum(Repasse.valor_realizado).label("total"),
        func.count(Repasse.id).label("qtd"),
    ).group_by(Repasse.tipo_repasse)
    res_rep = await db.execute(stmt_rep)
    ctx["repasses_por_bloco"] = [
        {"bloco": r[0], "total": r[1], "qtd": r[2]} for r in res_rep.all()
    ]

    # Total geral recebido
    total_rec = (
        await db.execute(
            select(func.coalesce(func.sum(Repasse.valor_realizado), 0))
        )
    ).scalar() or 0.0
    ctx["total_recebido"] = total_rec

    # Convênios vigentes com saldo
    res_conv = await db.execute(
        select(Convenio).where(Convenio.situacao.in_(["Vigente", "Em Execução"]))
    )
    convenios = res_conv.scalars().all()
    conv_resumo = []
    for c in convenios:
        conv_resumo.append({
            "numero": c.numero,
            "objeto": c.objeto[:60],
            "programa": c.programa,
            "recebido": c.valor_recebido or c.valor_contrato,
            "saldo": c.saldo_disponivel,
            "prazo": c.prazo_utilizacao,
        })
    ctx["convenios_vigentes"] = conv_resumo

    # Alertas críticos ativos
    res_alertas = await db.execute(
        select(Alerta)
        .where(Alerta.resolvido == False, Alerta.severidade == SeveridadeAlerta.CRITICO)
        .limit(5)
    )
    ctx["alertas_criticos"] = [
        {"titulo": a.titulo, "descricao": a.descricao[:100]}
        for a in res_alertas.scalars().all()
    ]

    # Indicadores com situação ruim
    res_ind = await db.execute(
        select(Indicador).where(Indicador.situacao == "Nao_atingido").limit(5)
    )
    ctx["indicadores_criticos"] = [
        {"indicador": i.indicador, "eixo": i.eixo, "valor": i.valor_alcancado}
        for i in res_ind.scalars().all()
    ]

    # Obras atrasadas
    from datetime import date
    res_obras = await db.execute(
        select(Obra).where(
            Obra.status == StatusObra.ANDAMENTO,
            Obra.data_previsao_conclusao < date.today(),
        ).limit(5)
    )
    ctx["obras_atrasadas"] = [
        {"nome": o.nome_estabelecimento, "tipo": o.tipo_estabelecimento, "perc": o.perc_fisico}
        for o in res_obras.scalars().all()
    ]

    # Rendimentos acumulados
    total_rend = (
        await db.execute(
            select(func.coalesce(func.sum(AplicacaoFinanceira.rendimento), 0))
        )
    ).scalar() or 0.0
    ctx["total_rendimentos"] = total_rend

    return ctx


async def responder_ia(pergunta: str, db: AsyncSession) -> str:
    """
    Responde a uma pergunta do gestor usando contexto real do banco + Claude.
    """
    if not settings.ANTHROPIC_API_KEY:
        return (
            "⚠️ Chave da API Anthropic não configurada. "
            "Defina ANTHROPIC_API_KEY no arquivo .env para ativar a IA Gestora."
        )

    try:
        ctx = await _coletar_contexto(db)
    except Exception as exc:
        logger.warning("Erro ao coletar contexto para IA: %s", exc)
        ctx = {}

    contexto_str = f"""
=== DADOS DO MUNICÍPIO ===
{ctx.get('municipio', 'Não disponível')}

=== TOTAL RECEBIDO DO FNS ===
R$ {ctx.get('total_recebido', 0):,.2f}

=== TOTAL DE RENDIMENTOS ===
R$ {ctx.get('total_rendimentos', 0):,.2f}

=== REPASSES POR BLOCO ===
{_formatar_lista(ctx.get('repasses_por_bloco', []), ['bloco', 'total', 'qtd'])}

=== CONVÊNIOS VIGENTES ===
{_formatar_lista(ctx.get('convenios_vigentes', []), ['numero', 'objeto', 'recebido', 'saldo', 'prazo'])}

=== ALERTAS CRÍTICOS ATIVOS ===
{_formatar_lista(ctx.get('alertas_criticos', []), ['titulo'])}

=== INDICADORES COM BAIXO DESEMPENHO ===
{_formatar_lista(ctx.get('indicadores_criticos', []), ['indicador', 'eixo', 'valor'])}

=== OBRAS ATRASADAS ===
{_formatar_lista(ctx.get('obras_atrasadas', []), ['nome', 'tipo', 'perc'])}

Data de hoje: {datetime.now().strftime('%d/%m/%Y')}
"""

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"Contexto financeiro do município:\n{contexto_str}\n\nPergunta do gestor: {pergunta}",
                }
            ],
        )
        return response.content[0].text

    except anthropic.AuthenticationError:
        return "❌ Chave da API Anthropic inválida. Verifique o arquivo .env."
    except anthropic.RateLimitError:
        return "⏳ Limite de requisições da API atingido. Tente novamente em alguns segundos."
    except Exception as exc:
        logger.error("Erro na IA Gestora: %s", exc)
        return f"❌ Erro ao processar sua pergunta: {exc}"


def _formatar_lista(items: list[dict], campos: list[str]) -> str:
    if not items:
        return "  Nenhum registro encontrado."
    linhas = []
    for item in items:
        partes = []
        for campo in campos:
            val = item.get(campo)
            if val is not None:
                if isinstance(val, float):
                    partes.append(f"{campo}: R$ {val:,.2f}")
                else:
                    partes.append(f"{campo}: {val}")
        linhas.append("  • " + " | ".join(partes))
    return "\n".join(linhas)
