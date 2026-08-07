from __future__ import annotations
import asyncio
from datetime import date
from fastapi import APIRouter
from services import siops_service, previne_service, sih_service, pni_service, sia_service
from config import settings
from functools import lru_cache

router = APIRouter(prefix="/api/score-municipal", tags=["score_municipal"])

@lru_cache(maxsize=1)
def _DIMENSOES():
    return [
        {"dimensao": "Atenção Primária à Saúde",     "peso": 25, "score": 52.4, "cor": "#2563eb",
         "subdimensoes": [
             {"item": "Cobertura ESF", "valor": 72.0, "meta": 95.0, "score": 44.4},
             {"item": "Novo Financiamento APS (IFP)", "valor": 0.52, "meta": 1.0, "score": 52.0},
             {"item": "ICSAP (inverso)", "valor": 18.4, "meta": 8.0, "score": 43.5},
             {"item": "Produção APS/hab", "valor": 3.2, "meta": 5.0, "score": 64.0},
         ]},
        {"dimensao": "Vigilância em Saúde",           "peso": 15, "score": 61.2, "cor": "#7c3aed",
         "subdimensoes": [
             {"item": "Cobertura vacinal (média)", "valor": 83.4, "meta": 95.0, "score": 70.5},
             {"item": "Encerramento SINAN ≤60d", "valor": 79.4, "meta": 95.0, "score": 63.5},
             {"item": "Controle malária (IPA)", "valor": 49.7, "meta": 10.0, "score": 20.1},
             {"item": "Saneamento / água tratada", "valor": 75.3, "meta": 99.0, "score": 76.1},
         ]},
        {"dimensao": "Saúde da Mulher e Criança",     "peso": 15, "score": 48.6, "cor": "#db2777",
         "subdimensoes": [
             {"item": "7+ consultas pré-natal", "valor": 58.4, "meta": 90.0, "score": 44.2},
             {"item": "TMI (<5a)", "valor": 16.2, "meta": 12.0, "score": 42.6},
             {"item": "Papanicolau cobertura", "valor": 52.3, "meta": 80.0, "score": 55.4},
             {"item": "TAN cobertura", "valor": 86.4, "meta": 95.0, "score": 83.2},
         ]},
        {"dimensao": "Doenças Crônicas / DCNT",       "peso": 12, "score": 44.8, "cor": "#d97706",
         "subdimensoes": [
             {"item": "HAS controlada", "valor": 57.1, "meta": 90.0, "score": 47.4},
             {"item": "DM controlada", "valor": 54.1, "meta": 85.0, "score": 46.3},
             {"item": "Rastreio câncer colo/mama", "valor": 47.1, "meta": 80.0, "score": 42.5},
             {"item": "Obesidade prevalência (inv.)", "valor": 26.7, "meta": 15.0, "score": 43.8},
         ]},
        {"dimensao": "Saúde Mental",                  "peso": 8,  "score": 38.4, "cor": "#4f46e5",
         "subdimensoes": [
             {"item": "CAPS superlotação (inverso)", "valor": 108.0, "meta": 80.0, "score": 26.0},
             {"item": "Tentativas suicídio/mês (inv.)", "valor": 7, "meta": 2, "score": 28.6},
             {"item": "Reinternação psiquiátrica (inv.)", "valor": 30.4, "meta": 15.0, "score": 49.3},
             {"item": "Leitos psiquiátricos SUS", "valor": 0, "meta": 10, "score": 0.0},
         ]},
        {"dimensao": "Financeiro / Gestão FMS",       "peso": 10, "score": 57.8, "cor": "#0891b2",
         "subdimensoes": [
             {"item": "Aplicação mínima (≥15%)", "valor": 126.3, "meta": 15.0, "score": 100.0},
             {"item": "Pessoal/despesa (≤60%)", "valor": 62.4, "meta": 60.0, "score": 48.4},
             {"item": "Execução blocos SUS", "valor": 85.8, "meta": 95.0, "score": 84.2},
             {"item": "Exec. emendas parlam.", "valor": 57.0, "meta": 90.0, "score": 35.0},
         ]},
        {"dimensao": "Saúde Digital / e-SUS",         "peso": 8,  "score": 62.4, "cor": "#16a34a",
         "subdimensoes": [
             {"item": "Adesão PEC", "valor": 87.5, "meta": 100.0, "score": 87.5},
             {"item": "Cobertura prontuário", "valor": 65.9, "meta": 90.0, "score": 57.7},
             {"item": "RNDS integradas", "valor": 25.0, "meta": 100.0, "score": 25.0},
             {"item": "Transmissão SISAB", "valor": 91.7, "meta": 97.0, "score": 80.0},
         ]},
        {"dimensao": "Recursos Humanos",              "peso": 7,  "score": 41.2, "cor": "#dc2626",
         "subdimensoes": [
             {"item": "Médicos/1000 hab.", "valor": 0.42, "meta": 1.0, "score": 42.0},
             {"item": "Absenteísmo (inv.)", "valor": 4.2, "meta": 2.0, "score": 47.6},
             {"item": "Folha/receita (inv.)", "valor": 62.4, "meta": 60.0, "score": 48.4},
             {"item": "ACS cobertura", "valor": 87.5, "meta": 100.0, "score": 87.5},
         ]},
    ]


@lru_cache(maxsize=1)
def _HISTORICO_SCORE():
    return [
        {"ano": 2022, "score_geral": 38.2, "aps": 44.1, "vigilancia": 52.4, "mulher_crianca": 40.2, "dcnt": 36.8},
        {"ano": 2023, "score_geral": 41.8, "aps": 47.2, "vigilancia": 55.8, "mulher_crianca": 43.6, "dcnt": 39.4},
        {"ano": 2024, "score_geral": 46.4, "aps": 50.1, "vigilancia": 58.4, "mulher_crianca": 46.8, "dcnt": 42.1},
        {"ano": 2025, "score_geral": 50.2, "aps": 52.4, "vigilancia": 61.2, "mulher_crianca": 48.6, "dcnt": 44.8},
    ]


@lru_cache(maxsize=1)
def _COMPARATIVO_AM():
    return {
        "municipio": "Apuí/AM",
        "score_apui": 50.2,
        "media_am": 48.6,
        "mediana_am": 46.2,
        "melhor_am": 74.8,
        "pior_am": 22.4,
        "ranking_estado": 18,
        "total_municipios_am": 62,
        "categoria": "Moderado",
    }


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Score ERSUS 360 Geral", "valor": 50.2, "meta": 70.0, "unidade": "pontos",
         "status": "atencao", "observacao": "Score moderado — acima da mediana estadual (46,2) mas distante da meta de 70 pontos"},
        {"indicador": "Pior dimensão: Saúde Mental", "valor": 38.4, "meta": 70.0, "unidade": "pontos",
         "status": "critico", "observacao": "Sem leitos psiquiátricos SUS, CAPS superlotados e suicídios em alta"},
        {"indicador": "Ranking AM", "valor": 18, "meta": None, "unidade": "º/62",
         "status": "atencao", "observacao": "18º entre 62 municípios amazonenses — posição intermediária"},
        {"indicador": "Evolução 2022→2025", "valor": 12.0, "meta": None, "unidade": "pontos",
         "status": "ok", "observacao": "Ganho de 12 pontos em 3 anos — tendência positiva sustentada"},
        {"indicador": "Dimensão financeira", "valor": 57.8, "meta": 70.0, "unidade": "pontos",
         "status": "atencao", "observacao": "Aplicação constitucional OK (100 pts) mas pessoal e emendas puxam o score para baixo"},
    ]



async def _dimensoes_dinamicas() -> list[dict]:
    """Substitui dimensões com dados reais de APIs públicas."""
    hoje = date.today()
    comp = f"{hoje.year}{hoje.month:02d}"
    ano  = hoje.year - 1

    previne_data, siops_data, sih_data, pni_data, sia_data = await asyncio.gather(
        previne_service.buscar_indicadores(comp),
        siops_service.buscar_apuracao(hoje.year),
        sih_service.buscar_internacoes(ano),
        pni_service.buscar_cobertura(ano),
        sia_service.buscar_producao_aps(ano),
    )

    dims = list(_DIMENSOES())  # cópia rasa

    # Dimensão 0: APS — Novo Financiamento APS + SIH/ICSAP + SIA produção
    ind_previne = previne_data.get("indicadores", [])
    media_pct = previne_data.get("media_geral_pct") or 68.0
    ifp = round(sum(
        min(i.get("resultado_pct", 0) / i.get("meta_pct", 60.0), 1.0)
        for i in ind_previne
    ) / len(ind_previne), 2) if ind_previne else 0.52

    icsap_pct = float(sih_data.get("icsap_pct") or 18.4)
    icsap_score = round(max(0, 100 - (icsap_pct - 8.0) / (40.0 - 8.0) * 100), 1)  # escala 8%=100pts
    per_capita = float(sia_data.get("per_capita") or 3.2)
    dims[0] = {
        **dims[0],
        "score": round(media_pct * 0.55 + icsap_score * 0.25 + min(per_capita / 5.0 * 100, 100) * 0.1 + 68.4 / 95.0 * 100 * 0.1, 1),
        "subdimensoes": [
            {"item": "Cobertura ESF",       "valor": 68.4,     "meta": 95.0, "score": round(68.4 / 95.0 * 100, 1)},
            {"item": "Novo Financiamento APS (IFP)", "valor": ifp,      "meta": 1.0,  "score": round(ifp * 100, 1)},
            {"item": "ICSAP (inverso)",      "valor": icsap_pct,"meta": 8.0,  "score": icsap_score},
            {"item": "Produção APS/hab",     "valor": per_capita,"meta": 5.0, "score": round(min(per_capita / 5.0 * 100, 100), 1)},
        ],
        "fonte": previne_data.get("fonte", "referencia"),
    }

    # Dimensão 1: Vigilância — cobertura vacinal (PNI)
    media_vacinal = float(pni_data.get("media_cobertura_pct") or 83.4)
    dims[1] = {
        **dims[1],
        "subdimensoes": [
            {"item": "Cobertura vacinal (média)", "valor": media_vacinal, "meta": 95.0, "score": round(media_vacinal / 95.0 * 100, 1)},
            {"item": "Encerramento SINAN ≤60d",  "valor": 79.4, "meta": 95.0, "score": 63.5},
            {"item": "Controle malária (IPA)",    "valor": 49.7, "meta": 10.0, "score": 20.1},
            {"item": "Saneamento / água tratada", "valor": 75.3, "meta": 99.0, "score": 76.1},
        ],
        "score": round((media_vacinal / 95.0 * 100 + 63.5 + 20.1 + 76.1) / 4, 1),
        "fonte": pni_data.get("fonte", "referencia"),
    }

    # Dimensão 5: Financeiro — SIOPS
    proprio = float(siops_data.get("minimo_constitucional_pct_aplicado") or 17.16)
    aplicacao_score = min(proprio / 15.0 * 100, 100)
    dims[5] = {
        **dims[5],
        "subdimensoes": [
            {"item": "Aplicação mínima (≥15%)", "valor": proprio, "meta": 15.0, "score": round(aplicacao_score, 1)},
            {"item": "Pessoal/despesa (≤60%)",  "valor": 62.4,    "meta": 60.0, "score": 48.4},
            {"item": "Execução blocos SUS",     "valor": 85.8,    "meta": 95.0, "score": 84.2},
            {"item": "Exec. emendas parlam.",   "valor": 57.0,    "meta": 90.0, "score": 35.0},
        ],
        "score": round((aplicacao_score * 0.25 + 48.4 * 0.25 + 84.2 * 0.25 + 35.0 * 0.25), 1),
        "fonte": siops_data.get("fonte", "referencia"),
    }

    return dims


@router.get("/dashboard")
async def dashboard():
    dims = await _dimensoes_dinamicas()
    scores = {d["dimensao"]: d["score"] for d in dims}
    melhor = max(scores, key=scores.get)
    pior   = min(scores, key=scores.get)
    score_geral = round(sum(d["score"] * d["peso"] / 100 for d in dims), 1)
    return {
        "score_geral": score_geral,
        "categoria": "Excelente" if score_geral >= 80 else "Bom" if score_geral >= 65 else "Moderado" if score_geral >= 50 else "Crítico",
        "ranking_am": 18,
        "total_municipios_am": 62,
        "dimensoes_avaliadas": len(dims),
        "dimensao_melhor": melhor,
        "score_melhor": scores[melhor],
        "dimensao_pior": pior,
        "score_pior": scores[pior],
        "evolucao_3anos": 12.0,
        "media_am": 48.6,
    }


@router.get("/dimensoes")
async def dimensoes():
    return await _dimensoes_dinamicas()


@router.get("/historico")
def historico():
    return _HISTORICO_SCORE()


@router.get("/comparativo")
def comparativo():
    return _COMPARATIVO_AM()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()


@router.get("/recomendacoes-ia")
async def recomendacoes_ia():
    """Gera recomendações priorizadas usando IA com base no score atual."""
    if not settings.ANTHROPIC_API_KEY:
        # Retorna recomendações estáticas quando IA não disponível
        return _RECOMENDACOES_ESTATICAS()

    dims = await _dimensoes_dinamicas()
    dims_sorted = sorted(dims, key=lambda d: d["score"])

    resumo = "\n".join(
        f"- {d['dimensao']}: score {d['score']}/100 (peso {d['peso']}%)"
        for d in dims_sorted
    )
    piores_subdims = []
    for d in dims_sorted[:3]:
        for s in sorted(d.get("subdimensoes", []), key=lambda x: x["score"])[:2]:
            piores_subdims.append(f"  • {d['dimensao']} → {s['item']}: {s['valor']} (meta {s['meta']})")

    prompt = f"""Analise o Score Municipal ERSUS 360 do município de Apuí/AM (Amazonas) e gere um plano de ação priorizado.

SCORE ATUAL POR DIMENSÃO (ordem crescente = pior primeiro):
{resumo}

SUBDIMENSÕES CRÍTICAS (pior desempenho):
{chr(10).join(piores_subdims)}

Gere exatamente 6 recomendações no formato JSON:
[
  {{
    "prioridade": 1,
    "dimensao": "nome da dimensão",
    "acao": "ação específica em 1 frase",
    "impacto": "impacto esperado no score em pontos (ex: +3,2 pts)",
    "prazo": "30 dias | 60 dias | 90 dias | 6 meses",
    "responsavel": "quem deve executar",
    "urgencia": "critico | alto | medio"
  }}
]

Seja específico para a realidade de Apuí/AM. Responda APENAS com o JSON, sem texto adicional."""

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        import json
        texto = response.content[0].text.strip()
        # Remove markdown code blocks se presentes
        if texto.startswith("```"):
            texto = texto.split("```")[1]
            if texto.startswith("json"):
                texto = texto[4:]
        recomendacoes = json.loads(texto)
        return {"fonte": "ia", "recomendacoes": recomendacoes, "modelo": "claude-haiku"}
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("IA recomendacoes erro: %s", exc)
        return _RECOMENDACOES_ESTATICAS()


@lru_cache(maxsize=1)
def _RECOMENDACOES_ESTATICAS():
    return {
        "fonte": "referencia",
        "recomendacoes": [
            {"prioridade": 1, "dimensao": "Saúde Mental", "acao": "Ativar protocolo de crise e ampliar atendimento CAPS — reduzir superlotação de 108% para <80%", "impacto": "+8,4 pts", "prazo": "60 dias", "responsavel": "Coordenador CAPS / Secretário de Saúde", "urgencia": "critico"},
            {"prioridade": 2, "dimensao": "Recursos Humanos", "acao": "Contratar 1 médico via PMM e 2 enfermeiros para elevar razão enfermeiro/leito de 0,18 para 0,25", "impacto": "+5,1 pts", "prazo": "90 dias", "responsavel": "RH / Gestão de Contratos", "urgencia": "critico"},
            {"prioridade": 3, "dimensao": "Atenção Primária à Saúde", "acao": "Intensificar busca ativa para elevar cobertura ESF de 68,4% para ≥75% (Meta Novo Financiamento APS Q4)", "impacto": "+4,2 pts", "prazo": "30 dias", "responsavel": "Coordenador APS / ACS", "urgencia": "alto"},
            {"prioridade": 4, "dimensao": "Vigilância em Saúde", "acao": "Campanha vacinação casa a casa para elevar cobertura média de 83,4% para ≥90% (BCG, pentavalente, HPV)", "impacto": "+3,8 pts", "prazo": "60 dias", "responsavel": "Coordenador Imunização / Sala de Vacinas", "urgencia": "alto"},
            {"prioridade": 5, "dimensao": "Saúde da Mulher e Criança", "acao": "Criar grupo de pré-natal de risco e agenda prioritária para elevar 7+ consultas de 58,4% para ≥70%", "impacto": "+3,2 pts", "prazo": "90 dias", "responsavel": "Enfermeira obstetra / Coordenador Materno-Infantil", "urgencia": "alto"},
            {"prioridade": 6, "dimensao": "Financeiro / Gestão FMS", "acao": "Executar emendas parlamentares paradas — elevar de 57% para ≥80% de execução até dezembro", "impacto": "+2,9 pts", "prazo": "6 meses", "responsavel": "Diretor FMS / Contador", "urgencia": "medio"},
        ],
    }
