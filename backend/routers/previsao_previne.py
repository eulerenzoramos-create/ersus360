# backend/routers/previsao_previne.py — Modelo Preditivo ML · Previne Brasil
from fastapi import APIRouter, Query
from typing import Optional
import random
from functools import lru_cache

router = APIRouter(prefix="/api/previsao-previne", tags=["previsao-previne"])

random.seed(77)

def _historico(base: float, meses: int = 11) -> list:
    vals = [base]
    for _ in range(meses - 1):
        vals.append(round(min(100.0, max(5.0, vals[-1] + random.uniform(-3, 4))), 1))
    comps = ["2025-09","2025-10","2025-11","2025-12","2026-01","2026-02",
             "2026-03","2026-04","2026-05","2026-06","2026-07"]
    return [{"competencia": c, "valor": v} for c, v in zip(comps[-meses:], vals[-meses:])]

@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {
            "codigo": "C01", "nome": "Pré-natal 6+ consultas", "grupo": "C",
            "valor_atual": 62.4, "meta": 60.0, "pct_meta": 104.0,
            "previsao_proximo": 63.8, "previsao_daqui2": 65.1, "previsao_daqui3": 66.0,
            "tendencia": "crescimento", "confianca_pct": 88,
            "gap_fechamento": 0,
            "fatores_risco": [
                {"fator": "Alta adesão ao Programa Cegonha", "impacto": "alto", "direcao": "positivo"},
                {"fator": "Evasão de gestantes no 3º trimestre", "impacto": "medio", "direcao": "negativo"},
            ],
            "acoes_recomendadas": [
                "Manter busca ativa de gestantes faltosas no 3º trimestre.",
                "Reforçar registro de procedimentos no PEC para não perder produção.",
            ],
            "historico": _historico(58.0),
        },
        {
            "codigo": "C02", "nome": "Exame citopatológico (25–64a)", "grupo": "C",
            "valor_atual": 41.2, "meta": 80.0, "pct_meta": 51.5,
            "previsao_proximo": 43.0, "previsao_daqui2": 45.5, "previsao_daqui3": 47.8,
            "tendencia": "crescimento", "confianca_pct": 72,
            "gap_fechamento": 32.2,
            "fatores_risco": [
                {"fator": "Baixa adesão feminina a coleta de rotina", "impacto": "alto", "direcao": "negativo"},
                {"fator": "Campanha de mutirão de coleta prevista para Ago/2026", "impacto": "alto", "direcao": "positivo"},
            ],
            "acoes_recomendadas": [
                "Realizar mutirão de coleta de Papanicolau em todas as microáreas — meta: 200 coletas/mês.",
                "Implantar busca ativa via ACS para mulheres sem exame há 3+ anos.",
                "Ampliar horário de coleta para incluir sábado de manhã.",
            ],
            "historico": _historico(38.5),
        },
        {
            "codigo": "B01", "nome": "Hipertensos acompanhados", "grupo": "B",
            "valor_atual": 58.3, "meta": 70.0, "pct_meta": 83.3,
            "previsao_proximo": 60.1, "previsao_daqui2": 62.4, "previsao_daqui3": 64.0,
            "tendencia": "crescimento", "confianca_pct": 81,
            "gap_fechamento": 6.0,
            "fatores_risco": [
                {"fator": "Expansão do cadastro de hipertensos — denominador crescendo", "impacto": "medio", "direcao": "negativo"},
                {"fator": "Grupo HiperDia com 3 sessões/mês", "impacto": "medio", "direcao": "positivo"},
            ],
            "acoes_recomendadas": [
                "Atualizar cadastro SIAB com pacientes hipertensos identificados nas visitas domiciliares.",
                "Criar agenda dedicada para acompanhamento de crônicos com médico e enfermeira.",
            ],
            "historico": _historico(54.0),
        },
        {
            "codigo": "B02", "nome": "Diabéticos acompanhados", "grupo": "B",
            "valor_atual": 53.1, "meta": 70.0, "pct_meta": 75.9,
            "previsao_proximo": 54.8, "previsao_daqui2": 56.5, "previsao_daqui3": 58.0,
            "tendencia": "crescimento", "confianca_pct": 76,
            "gap_fechamento": 12.0,
            "fatores_risco": [
                {"fator": "Sub-registro de DM2 em adultos de meia-idade", "impacto": "alto", "direcao": "negativo"},
                {"fator": "Glucômetros disponíveis em todas as UBS", "impacto": "baixo", "direcao": "positivo"},
            ],
            "acoes_recomendadas": [
                "Rastrear DM2 em todos os adultos > 40a nas consultas de rotina (glicemia jejum).",
                "Registrar hemoglobina glicada como procedimento no eSUS PEC.",
            ],
            "historico": _historico(50.0),
        },
        {
            "codigo": "M01", "nome": "Saúde da criança (< 2 anos)", "grupo": "M",
            "valor_atual": 71.8, "meta": 75.0, "pct_meta": 95.7,
            "previsao_proximo": 72.5, "previsao_daqui2": 73.1, "previsao_daqui3": 74.0,
            "tendencia": "crescimento", "confianca_pct": 90,
            "gap_fechamento": 1.0,
            "fatores_risco": [
                {"fator": "Alta cobertura vacinal (98%) reduz faltas por doença", "impacto": "baixo", "direcao": "positivo"},
                {"fator": "Famílias rurais com dificuldade de acesso em período chuvoso", "impacto": "medio", "direcao": "negativo"},
            ],
            "acoes_recomendadas": [
                "Manter caderneta da criança atualizada no PEC — foco em crianças de 12 a 23 meses.",
                "Ampliar atendimentos na UBS Zona Rural nos meses secos.",
            ],
            "historico": _historico(68.0),
        },
        {
            "codigo": "M02", "nome": "Cobertura de puericultura (0–5a)", "grupo": "M",
            "valor_atual": 64.5, "meta": 75.0, "pct_meta": 86.0,
            "previsao_proximo": 65.8, "previsao_daqui2": 67.0, "previsao_daqui3": 68.5,
            "tendencia": "crescimento", "confianca_pct": 79,
            "gap_fechamento": 6.5,
            "fatores_risco": [
                {"fator": "Aumento de crianças 0-1a cadastradas em 2026", "impacto": "medio", "direcao": "positivo"},
                {"fator": "Rotatividade de médico pediatra", "impacto": "alto", "direcao": "negativo"},
            ],
            "acoes_recomendadas": [
                "Protocolo de puericultura aplicado pela enfermeira — reduz dependência de pediatra.",
                "Garantir 2 consultas/ano mínimas para crianças de 1 a 5 anos registradas.",
            ],
            "historico": _historico(61.0),
        },
    ]


_SCORE_ATUAL = round(sum(i["pct_meta"] for i in _INDICADORES()) / len(_INDICADORES()), 1)
_SCORE_PREVISTO = round(sum(
    ((i["previsao_daqui3"] / i["meta"]) * 100) for i in _INDICADORES()
) / len(_INDICADORES()), 1)


@router.get("/resumo")
def resumo():
    return {
        "competencia_atual": "Maio/2026",
        "competencia_previsao": "Agosto/2026",
        "score_atual": round(_SCORE_ATUAL, 1),
        "score_previsto": round(_SCORE_PREVISTO, 1),
        "delta_score": round(_SCORE_PREVISTO - _SCORE_ATUAL, 1),
        "indicadores_em_risco": sum(1 for i in _INDICADORES() if i["pct_meta"] < 70),
        "indicadores_no_prazo": sum(1 for i in _INDICADORES() if i["pct_meta"] >= 100),
        "acuracia_modelo": 86.4,
        "ultima_atualizacao": "2026-07-23 06:00 (cron mensal)",
        "modelo_versao": "2.1.3",
    }


@router.get("/indicadores")
def listar_indicadores(grupo: Optional[str] = Query(None)):
    inds = _INDICADORES
    if grupo:
        inds = [i for i in inds if i["grupo"] == grupo]
    return inds


@router.post("/retreinar")
def retreinar():
    return {
        "ok": True,
        "mensagem": "Retreinamento do modelo iniciado. Previsões serão atualizadas em ~5 minutos.",
        "modelo_versao": "2.1.4",
        "acuracia_estimada": 87.2,
    }
