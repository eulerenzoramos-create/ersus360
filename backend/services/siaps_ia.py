"""
ERSUS IA — Analista SIAPS.

Responde perguntas, analisa o desempenho e redige planos de ação e relatórios usando SOMENTE os
resultados oficiais já captados pelo ERSUS360 para o município:
  • Avaliação do Quadrimestre (área pública do SIAPS — services/siaps_publico.py)
  • Faixa do Índice de Equidade e Dimensionamento (IED)
  • Resultados mensais por equipe do relatório SIAPS importado (resultado_mensal_siaps / resultado_cvat_mensal)
  • Classificação e pendências por equipe no e-Gestor (egestor_pagamento)
O modelo recebe esses dados como contexto; não consulta outra fonte e não recalcula nota oficial.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime

import anthropic
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.indicadores_aps import ResultadoCvatMensal, ResultadoMensalSiaps
from services import siaps_publico as sp

logger = logging.getLogger(__name__)

MODELO = "claude-opus-5-5"
MODOS = {
    "pergunta": ("Responda à pergunta do gestor.", "medium"),
    "analise": ("Faça a análise geral do desempenho da APS do município: o que está bem, o que piorou, "
                "quais equipes e indicadores exigem atenção primeiro e por quê.", "high"),
    "plano": ("Elabore um plano de ação para os próximos 90 dias focado nos componentes, equipes e indicadores "
              "com pior resultado: problema, ação, responsável sugerido (função, não nome), prazo e como "
              "acompanhar no próprio SIAPS/e-SUS.", "high"),
    "relatorio": ("Redija um relatório técnico-gerencial para a Secretaria Municipal de Saúde: resumo executivo, "
                  "situação por componente, evolução entre quadrimestres, equipes críticas, riscos para o "
                  "cofinanciamento e recomendações.", "high"),
}

SYSTEM = """Você é o ERSUS IA — Analista SIAPS, assistente de gestão da Atenção Primária à Saúde de um município brasileiro, dentro do sistema ERSUS360.

Regras:
- Use apenas os números que estão em <dados_oficiais>. Cada número citado deve dizer a fonte e o período (ex.: "SIAPS público, 1º quadrimestre/2026").
- Se a resposta depender de um dado que não está em <dados_oficiais>, diga claramente que o ERSUS360 ainda não tem esse dado e de onde ele viria (por exemplo: pontuação por equipe vem do relatório do SIAPS na área logada gov.br). Nunca estime, simule ou complete números.
- Não recalcule notas, pontuações nem classificações oficiais do Ministério da Saúde; compare apenas o que foi publicado.
- Diferencie dado preliminar, consolidado e "publicado na área pública" quando isso aparecer nos dados.
- Recomendações de boas práticas são permitidas, mas apresente-as como sugestões técnicas, ligadas ao indicador ou equipe que motivou cada uma.
- Escreva em português do Brasil, em linguagem clara para gestores, com títulos curtos e listas quando ajudar. Seja objetivo."""


class IAIndisponivel(RuntimeError):
    pass


async def montar_contexto(db: AsyncSession, municipio_id: int, ibge: str, nome: str | None = None) -> dict:
    """Junta os dados oficiais disponíveis. Cada bloco diz a fonte e se está vazio."""
    painel = await sp.painel(db, municipio_id, ibge)

    comps = (await db.execute(select(ResultadoMensalSiaps.competencia)
                              .where(ResultadoMensalSiaps.municipio_ibge.in_([ibge, ibge[:6]]))
                              .distinct().order_by(desc(ResultadoMensalSiaps.competencia)).limit(2))).scalars().all()
    mensais = []
    if comps:
        for r in (await db.execute(select(ResultadoMensalSiaps)
                                   .where(ResultadoMensalSiaps.municipio_ibge.in_([ibge, ibge[:6]]),
                                          ResultadoMensalSiaps.competencia.in_(comps))
                                   .order_by(ResultadoMensalSiaps.competencia, ResultadoMensalSiaps.equipe_nome))).scalars():
            mensais.append({"competencia": r.competencia, "equipe": r.equipe_nome, "ine": r.equipe_ine,
                            "tipo": r.equipe_tipo, "indicador": f"{r.indicador_codigo} {r.indicador_nome or ''}".strip(),
                            "numerador": r.numerador, "denominador": r.denominador, "resultado_pct": r.resultado_pct,
                            "meta": r.meta, "pontuacao": r.pontuacao, "classificacao": r.classificacao,
                            "situacao": r.situacao})

    comp_cvat = (await db.execute(select(ResultadoCvatMensal.competencia)
                                  .where(ResultadoCvatMensal.municipio_ibge.in_([ibge, ibge[:6]]))
                                  .order_by(desc(ResultadoCvatMensal.competencia)).limit(1))).scalar_one_or_none()
    cvat = []
    if comp_cvat:
        for r in (await db.execute(select(ResultadoCvatMensal)
                                   .where(ResultadoCvatMensal.municipio_ibge.in_([ibge, ibge[:6]]),
                                          ResultadoCvatMensal.competencia == comp_cvat))).scalars():
            cvat.append({"competencia": r.competencia, "equipe": r.equipe_nome, "ine": r.equipe_ine,
                         "pontuacao": r.pontuacao, "classificacao": r.classificacao, "situacao": r.situacao})

    egestor = None
    try:
        from services import egestor_pagamento as ep
        p = await ep.painel(db, municipio_id)
        if p.get("situacao_dado") != "nao_disponivel":
            egestor = {"parcela": p.get("parcela_rotulo"), "competencia_cnes": p.get("competencia_cnes_rotulo"),
                       "classificacao_qualidade": p.get("classificacao_qualidade"),
                       "classificacao_vinculo": p.get("classificacao_vinculo"),
                       "equipes_com_pendencia": [
                           {"equipe": e.get("equipe"), "ine": e.get("ine"),
                            "pendencias": [x.get("rotulo") for x in e.get("pendencias") or []]}
                           for e in p.get("equipes") or [] if e.get("pendencias")]}
    except Exception as exc:  # e-Gestor é complementar: a análise segue sem ele
        logger.warning("ERSUS IA: e-Gestor indisponível para o contexto: %s", exc)

    return {
        "municipio": {"nome": nome, "ibge": ibge},
        "avaliacao_quadrimestre_siaps_publico": {
            "fonte": painel["fonte"], "situacao": painel["situacao_dado"],
            "quadrimestres": painel["quadrimestres"], "alertas": painel["alertas"]},
        "equidade_ied": painel["equidade"],
        "resultados_mensais_por_equipe_relatorio_siaps": {
            "fonte": "Relatório do SIAPS importado no ERSUS360", "competencias": comps, "linhas": mensais}
            if mensais else "sem dados importados",
        "cvat_mensal_por_equipe_relatorio_siaps": cvat or "sem dados importados",
        "egestor_pagamento": egestor or "sem dados",
    }


def fontes_do_contexto(ctx: dict) -> list[str]:
    f = []
    q = ctx["avaliacao_quadrimestre_siaps_publico"]["quadrimestres"]
    if q:
        f.append(f"SIAPS público — Avaliação do Quadrimestre ({', '.join(x['quadrimestre'] for x in q)})")
    if ctx["equidade_ied"]:
        f.append(f"SIAPS público — IED {ctx['equidade_ied'].get('faixa_ied')}")
    m = ctx["resultados_mensais_por_equipe_relatorio_siaps"]
    if isinstance(m, dict):
        f.append(f"Relatório SIAPS importado ({', '.join(m['competencias'])})")
    if isinstance(ctx["cvat_mensal_por_equipe_relatorio_siaps"], list):
        f.append(f"CVAT por equipe ({ctx['cvat_mensal_por_equipe_relatorio_siaps'][0]['competencia']})")
    if isinstance(ctx["egestor_pagamento"], dict):
        f.append(f"e-Gestor — {ctx['egestor_pagamento']['parcela']}")
    return f


async def responder(db: AsyncSession, municipio_id: int, ibge: str, nome: str | None,
                    modo: str, pergunta: str | None) -> dict:
    if modo not in MODOS:
        raise ValueError("modo inválido")
    if not settings.ANTHROPIC_API_KEY:
        raise IAIndisponivel("A IA não está configurada no servidor (ANTHROPIC_API_KEY).")
    ctx = await montar_contexto(db, municipio_id, ibge, nome)
    fontes = fontes_do_contexto(ctx)
    if not fontes:
        raise IAIndisponivel("Ainda não há resultados oficiais do SIAPS captados para este município. "
                             "Clique em Atualizar na aba Avaliação Quadrimestre e tente de novo.")

    tarefa, effort = MODOS[modo]
    texto = (f"<dados_oficiais>\n{json.dumps(ctx, ensure_ascii=False, default=str)}\n</dados_oficiais>\n\n"
             f"Data de hoje: {datetime.now().strftime('%d/%m/%Y')}\nTarefa: {tarefa}")
    if pergunta:
        texto += f"\nPergunta do gestor: {pergunta}"

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    try:
        async with client.messages.stream(
            model=MODELO,
            max_tokens=16000,
            system=SYSTEM,
            messages=[{"role": "user", "content": texto}],
            # recusa de política → o próprio servidor da Anthropic tenta o modelo de reserva
            extra_headers={"anthropic-beta": "server-side-fallback-2026-07-01"},
            extra_body={"output_config": {"effort": effort}, "fallbacks": "default"},
        ) as stream:
            msg = await stream.get_final_message()
    except anthropic.AuthenticationError as e:
        raise IAIndisponivel("Chave da IA inválida no servidor.") from e
    except anthropic.RateLimitError as e:
        raise IAIndisponivel("Limite de uso da IA atingido. Tente de novo em alguns minutos.") from e
    except anthropic.APIStatusError as e:
        logger.error("ERSUS IA: erro da API (%s): %s", e.status_code, e)
        raise IAIndisponivel(f"A IA respondeu com erro ({e.status_code}).") from e
    except anthropic.APIConnectionError as e:
        raise IAIndisponivel("Sem conexão com o serviço de IA.") from e

    if msg.stop_reason == "refusal":
        raise IAIndisponivel("A IA não pôde responder a esta solicitação. Reformule a pergunta.")
    resposta = "".join(b.text for b in msg.content if b.type == "text").strip()
    if msg.stop_reason == "max_tokens":
        resposta += "\n\n_(Resposta interrompida pelo limite de tamanho.)_"
    return {"modo": modo, "resposta": resposta, "fontes": fontes, "modelo": msg.model,
            "gerado_em": datetime.utcnow().isoformat(),
            "aviso": "Análise gerada por IA a partir dos resultados oficiais captados. Confira os números na fonte."}
