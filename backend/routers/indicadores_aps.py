"""
Router: /api/indicadores-aps — Indicadores APS · Três Camadas
  A. Operacional diário   — fonte e-SUS APS/PEC    (verde)
  B. Monitoramento mensal — fonte SIAPS             (azul)
  C. Avaliação quadrimestral — resultado oficial    (roxo)

Regra: nunca apresentar dado diário como resultado oficial do SIAPS.
"""
from __future__ import annotations
import os
import logging
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import text, select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from routers.auth import get_current_user, UserOut
from database import AsyncSessionLocal
from models.indicadores_aps import (
    IndicadorConfig, ClassificacaoConfig, SincronizacaoLog,
    ResultadoMensalSiaps, ResultadoCvatMensal, ResultadoQuadrimestral,
    ProjecaoDiaria, InconsistenciaAPS,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/indicadores-aps", tags=["Indicadores APS"])

IBGE_DEFAULT = os.getenv("FNS_MUNICIPIO_IBGE", "1300144")

# ── Helpers ────────────────────────────────────────────────────────────────────

def _ts():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _comp_label(comp: str) -> str:
    """'2026-05' → 'Mai/2026'"""
    MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]
    try:
        ano, mes = comp.split("-")
        return f"{MESES[int(mes)-1]}/{ano}"
    except Exception:
        return comp


def _quadrimestre_de(competencia: str) -> tuple[int, int]:
    """Retorna (ano, quadrimestre) para uma competência 'AAAA-MM'."""
    try:
        ano, mes = competencia.split("-")
        m = int(mes)
        q = 1 if m <= 4 else (2 if m <= 8 else 3)
        return int(ano), q
    except Exception:
        return date.today().year, 1


def _meses_quadrimestre(ano: int, q: int) -> list[str]:
    if q == 1: meses = [1, 2, 3, 4]
    elif q == 2: meses = [5, 6, 7, 8]
    else: meses = [9, 10, 11, 12]
    return [f"{ano}-{m:02d}" for m in meses]


def _classificar_cvat(pontuacao: float) -> str:
    if pontuacao > 8.5: return "otimo"
    if pontuacao >= 7.0: return "bom"
    if pontuacao >= 5.0: return "suficiente"
    return "regular"


def _label_classificacao(c: str) -> str:
    return {"otimo": "Ótimo", "bom": "Bom", "suficiente": "Suficiente", "regular": "Regular"}.get(c, c)


# ── Dados de referência Apuí/AM (fallback quando sem SIAPS) ────────────────────
# FONTE: dados confirmados e-Gestor / SIAPS competência Mai/2026
# Identificação: referencia_municipal — NÃO é dado oficial em tempo real

_CLASSIFICACOES_PADRAO = [
    {"componente": "CVAT",      "classificacao": "otimo",      "label": "Ótimo",      "limite_min": 8.51, "limite_max": None,  "cor_hex": "#1d4ed8", "versao": "2024.1"},
    {"componente": "CVAT",      "classificacao": "bom",        "label": "Bom",        "limite_min": 7.0,  "limite_max": 8.5,   "cor_hex": "#16a34a", "versao": "2024.1"},
    {"componente": "CVAT",      "classificacao": "suficiente", "label": "Suficiente", "limite_min": 5.0,  "limite_max": 6.99,  "cor_hex": "#d97706", "versao": "2024.1"},
    {"componente": "CVAT",      "classificacao": "regular",    "label": "Regular",    "limite_min": 0.0,  "limite_max": 4.99,  "cor_hex": "#dc2626", "versao": "2024.1"},
    {"componente": "QUALIDADE", "classificacao": "otimo",      "label": "Ótimo",      "limite_min": 75.0, "limite_max": None,  "cor_hex": "#1d4ed8", "versao": "2024.1"},
    {"componente": "QUALIDADE", "classificacao": "bom",        "label": "Bom",        "limite_min": 55.0, "limite_max": 74.99, "cor_hex": "#16a34a", "versao": "2024.1"},
    {"componente": "QUALIDADE", "classificacao": "suficiente", "label": "Suficiente", "limite_min": 40.0, "limite_max": 54.99, "cor_hex": "#d97706", "versao": "2024.1"},
    {"componente": "QUALIDADE", "classificacao": "regular",    "label": "Regular",    "limite_min": 0.0,  "limite_max": 39.99, "cor_hex": "#dc2626", "versao": "2024.1"},
]

_VARIAVEIS_CVAT = {
    "A": {"nome": "Pessoas somente com Cadastro Individual atualizado",              "pts": "0,75 pts/pessoa"},
    "B": {"nome": "Pessoas com Cadastro Individual e Domiciliar atualizado",        "pts": "1,5 pts/pessoa"},
    "C": {"nome": "Total de pessoas com Cadastro (A + B)",                          "pts": "—"},
    "D": {"nome": "Pessoas acompanhadas sem critério prioritário",                  "pts": "1 pt/pessoa"},
    "E": {"nome": "Crianças e idosos acompanhados",                                 "pts": "1,2 pts/pessoa"},
    "F": {"nome": "Beneficiários BPC ou PBF acompanhados",                          "pts": "1,3 pts/equipe"},
    "G": {"nome": "Crianças e idosos beneficiários BPC ou PBF acompanhados",        "pts": "2,5 pts/pessoa"},
    "H": {"nome": "Total de pessoas Acompanhadas",                                  "pts": "—"},
    "I": {"nome": "Atendimentos sujeitos à Avaliação de Satisfação",                "pts": "—"},
    "J": {"nome": "Atendimentos com Avaliação de Satisfação (>5% → 0,3 pts; ≤5% → 0,15 pts)", "pts": "variável"},
    "K": {"nome": "Pessoas vinculadas à Equipe",                                    "pts": "—"},
}

_REF_CVAT_APUI_202605 = [
    {"ubs": "UBS IRMA ELIZABETE",                     "equipe": "CACHOEIRA",     "ine": "0000563104", "tipo": "eSF", "cnes": "2080168", "parametro": 3500, "A": 720, "B": 1210, "C": 1930, "D": 580, "E": 420, "F": 190, "G": 110, "H": 1654, "I": 290, "J": 22, "K": 1980, "pontuacao": 8.6},
    {"ubs": "UBS ANIZIO FERREIRA DA SILVA",           "equipe": "SAO SEBASTIAO", "ine": "0000563066", "tipo": "eSF", "cnes": "2080168", "parametro": 3200, "A": 680, "B": 1100, "C": 1780, "D": 530, "E": 390, "F": 175, "G": 100, "H": 1510, "I": 270, "J": 20, "K": 1830, "pontuacao": 8.3},
    {"ubs": "UBS ANIZIO FERREIRA DA SILVA",           "equipe": "ACARI",         "ine": "0000563082", "tipo": "eSF", "cnes": "2080168", "parametro": 3100, "A": 660, "B": 1080, "C": 1740, "D": 510, "E": 370, "F": 165, "G": 95,  "H": 1480, "I": 260, "J": 18, "K": 1790, "pontuacao": 8.2},
    {"ubs": "UBS OSVALDO LEMES CABRAL",               "equipe": "TRES ESTADOS",  "ine": "0000563120", "tipo": "eSF", "cnes": "2080168", "parametro": 2800, "A": 500, "B": 820,  "C": 1320, "D": 380, "E": 270, "F": 130, "G": 70,  "H": 1120, "I": 190, "J": 12, "K": 1350, "pontuacao": 6.4},
    {"ubs": "CENTRO DE SAUDE CURUMIM",                "equipe": "JUMA",          "ine": "0000563147", "tipo": "eSF", "cnes": "6820662", "parametro": 3400, "A": 730, "B": 1190, "C": 1920, "D": 570, "E": 415, "F": 185, "G": 108, "H": 1640, "I": 285, "J": 21, "K": 1970, "pontuacao": 8.5},
    {"ubs": "CENTRO DE SAUDE CURUMIM",                "equipe": "LIBERDADE",     "ine": "0000563155", "tipo": "eSF", "cnes": "6820662", "parametro": 3600, "A": 790, "B": 1320, "C": 2110, "D": 640, "E": 465, "F": 210, "G": 130, "H": 1780, "I": 330, "J": 26, "K": 2180, "pontuacao": 9.1},
    {"ubs": "UBS PADRE FALIERO BONCI",                "equipe": "KENNEDY",       "ine": "0000563163", "tipo": "eSF", "cnes": "6820662", "parametro": 3300, "A": 700, "B": 1150, "C": 1850, "D": 560, "E": 405, "F": 180, "G": 105, "H": 1580, "I": 280, "J": 21, "K": 1900, "pontuacao": 9.3},
    {"ubs": "UBS JK",                                 "equipe": "JK",            "ine": "0000563171", "tipo": "eSF", "cnes": "6820662", "parametro": 3250, "A": 690, "B": 1130, "C": 1820, "D": 545, "E": 395, "F": 178, "G": 102, "H": 1560, "I": 276, "J": 20, "K": 1870, "pontuacao": 8.4},
    {"ubs": "UBS CLAUDIA PEREIRA DOS SANTOS DAMACENA","equipe": "ESTRADA NOVA",  "ine": "0000563198", "tipo": "eSF", "cnes": "6820662", "parametro": 2900, "A": 420, "B": 690,  "C": 1110, "D": 310, "E": 220, "F": 110, "G": 58,  "H": 940,  "I": 155, "J": 9,  "K": 1140, "pontuacao": 5.8},
]

_INDICADORES_15 = [
    {"codigo": "IND01", "nome": "Proporção de gestantes com pelo menos 6 consultas pré-natal realizadas"},
    {"codigo": "IND02", "nome": "Proporção de gestantes com atendimento odontológico realizado"},
    {"codigo": "IND03", "nome": "Proporção de gravidez na adolescência"},
    {"codigo": "IND04", "nome": "Proporção de mulheres com coleta de citopatológico"},
    {"codigo": "IND05", "nome": "Proporção de mulheres de 50 a 69 anos com solicitação de mamografia"},
    {"codigo": "IND06", "nome": "Proporção de pessoas hipertensas com pressão arterial aferida"},
    {"codigo": "IND07", "nome": "Proporção de pessoas diabéticas com hemoglobina glicada solicitada"},
    {"codigo": "IND08", "nome": "Proporção de pessoas com tuberculose com tratamento supervisionado"},
    {"codigo": "IND09", "nome": "Proporção de contatos intradomiciliares de hanseníase examinados"},
    {"codigo": "IND10", "nome": "Cobertura vacinal de poliomielite e pentavalente"},
    {"codigo": "IND11", "nome": "Proporção de crianças menores de 1 ano de idade com consultas em dia"},
    {"codigo": "IND12", "nome": "Proporção de pessoas com obesidade atendidas"},
    {"codigo": "IND13", "nome": "Proporção de pessoas com saúde mental acompanhadas"},
    {"codigo": "IND14", "nome": "Cobertura de saúde bucal — 1ª consulta odontológica programática"},
    {"codigo": "IND15", "nome": "Proporção de idosos com caderneta atualizada"},
]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/competencias")
async def listar_competencias(
    ibge: str = Query(IBGE_DEFAULT),
    _: UserOut = Depends(get_current_user),
):
    """Lista competências disponíveis no banco para o município."""
    async with AsyncSessionLocal() as db:
        try:
            rows = (await db.execute(
                text("""
                    SELECT DISTINCT competencia FROM resultado_mensal_siaps
                    WHERE municipio_ibge = :ibge
                    ORDER BY competencia DESC LIMIT 24
                """),
                {"ibge": ibge}
            )).fetchall()
            comps = [r[0] for r in rows]
        except Exception:
            comps = []

    # Garante competência atual sempre disponível
    atual = date.today().strftime("%Y-%m")
    if atual not in comps:
        comps = [atual] + comps

    return {
        "competencias": [{"valor": c, "label": _comp_label(c)} for c in comps],
        "total": len(comps),
        "verificado_em": _ts(),
    }


@router.get("/dashboard")
async def dashboard_indicadores(
    ibge:        str = Query(IBGE_DEFAULT),
    competencia: str = Query(None),
    periodicidade: str = Query("mensal"),   # "diario" | "mensal" | "quadrimestral"
    _: UserOut = Depends(get_current_user),
):
    """Dashboard unificado com as três camadas claramente separadas."""
    if not competencia:
        competencia = date.today().strftime("%Y-%m")

    comp_label = _comp_label(competencia)
    ano, q = _quadrimestre_de(competencia)
    meses_q = _meses_quadrimestre(ano, q)

    # Tenta buscar dados do banco
    cvat_db = await _buscar_cvat_db(ibge, competencia)
    mensal_db = await _buscar_mensal_db(ibge, competencia)
    quad_db = await _buscar_quad_db(ibge, ano, q)

    # Fallback: referência municipal quando competência bate
    usando_ref = False
    if not cvat_db and competencia in ("2026-05", "2026-04"):
        cvat_db = _ref_cvat_para_resposta(competencia)
        usando_ref = True

    # Monta dashboard
    return {
        "municipio": {"ibge": ibge, "uf": "AM", "municipio": "APUÍ" if ibge == "1300144" else ibge},
        "competencia": {"valor": competencia, "label": comp_label},
        "periodicidade": periodicidade,
        "quadrimestre": {"ano": ano, "numero": q, "meses": meses_q, "label": f"Q{q}/{ano}"},

        # ── Camada A: Operacional/PEC ──────────────────────────────────────────
        "operacional": {
            "tipo": "operacional",
            "identificacao": "Estimativa operacional — fonte e-SUS APS/PEC",
            "cor": "#16a34a",
            "icone": "PEC",
            "disponivel": False,
            "nota": "Configure ESUS_USUARIO e ESUS_SENHA no Railway para dados operacionais do PEC.",
            "dados": None,
        },

        # ── Camada B: Mensal SIAPS ─────────────────────────────────────────────
        "mensal": {
            "tipo": "mensal",
            "identificacao": "Resultado mensal preliminar do SIAPS" if (cvat_db or mensal_db) else "Referência municipal — não substitui resultado oficial do SIAPS",
            "cor": "#1d4ed8",
            "icone": "SIAPS",
            "situacao": "preliminar" if usando_ref else ("referencia_municipal" if not cvat_db else cvat_db.get("situacao", "preliminar")),
            "disponivel": bool(cvat_db or mensal_db),
            "competencia": competencia,
            "data_extracao": cvat_db.get("data_extracao") if cvat_db else None,
            "cvat": cvat_db,
            "qualidade": mensal_db,
        },

        # ── Camada C: Quadrimestral ────────────────────────────────────────────
        "quadrimestral": {
            "tipo": "quadrimestral",
            "identificacao": "Resultado oficial da avaliação quadrimestral",
            "cor": "#7c3aed",
            "icone": "OFICIAL",
            "disponivel": bool(quad_db),
            "ano": ano,
            "quadrimestre": q,
            "dados": quad_db,
        },

        "variaveis_cvat": _VARIAVEIS_CVAT,
        "classificacoes": _CLASSIFICACOES_PADRAO,
        "verificado_em": _ts(),
    }


@router.get("/cvat")
async def cvat_competencia(
    ibge:        str = Query(IBGE_DEFAULT),
    competencia: str = Query(None),
    equipe_ine:  str = Query(None),
    _: UserOut = Depends(get_current_user),
):
    """CVAT — Componente Vínculo e Acompanhamento Territorial."""
    if not competencia:
        competencia = date.today().strftime("%Y-%m")

    dados = await _buscar_cvat_db(ibge, competencia)
    usando_ref = False

    if not dados and competencia in ("2026-05", "2026-04"):
        dados = _ref_cvat_para_resposta(competencia)
        usando_ref = True

    if not dados:
        return {
            "situacao": "nao_disponivel",
            "identificacao": "Resultado mensal preliminar do SIAPS",
            "cor": "#1d4ed8",
            "disponivel": False,
            "competencia": competencia,
            "competencia_label": _comp_label(competencia),
            "nota": "Importe os dados do SIAPS via /api/indicadores-aps/importar-siaps ou configure as credenciais.",
            "verificado_em": _ts(),
        }

    equipes = dados.get("equipes", [])
    if equipe_ine:
        equipes = [e for e in equipes if e.get("ine") == equipe_ine]

    return {
        "situacao": "referencia_municipal" if usando_ref else dados.get("situacao", "preliminar"),
        "identificacao": "Referência municipal — não substitui resultado oficial do SIAPS" if usando_ref else "Resultado mensal preliminar do SIAPS",
        "cor": "#f59e0b" if usando_ref else "#1d4ed8",
        "disponivel": True,
        "competencia": competencia,
        "competencia_label": _comp_label(competencia),
        "data_extracao": dados.get("data_extracao"),
        "variaveis": _VARIAVEIS_CVAT,
        **{k: v for k, v in dados.items() if k not in ("equipes", "data_extracao", "situacao")},
        "equipes": equipes,
        "verificado_em": _ts(),
    }


@router.get("/mensal")
async def qualidade_mensal(
    ibge:        str = Query(IBGE_DEFAULT),
    competencia: str = Query(None),
    equipe_ine:  str = Query(None),
    indicador:   str = Query(None),
    _: UserOut = Depends(get_current_user),
):
    """Monitoramento mensal — Componente Qualidade."""
    if not competencia:
        competencia = date.today().strftime("%Y-%m")

    async with AsyncSessionLocal() as db:
        try:
            q = select(ResultadoMensalSiaps).where(
                ResultadoMensalSiaps.municipio_ibge == ibge,
                ResultadoMensalSiaps.competencia == competencia,
            )
            if equipe_ine:
                q = q.where(ResultadoMensalSiaps.equipe_ine == equipe_ine)
            if indicador:
                q = q.where(ResultadoMensalSiaps.indicador_codigo == indicador)
            rows = (await db.execute(q)).scalars().all()
        except Exception:
            rows = []

    if not rows:
        return {
            "situacao": "nao_disponivel",
            "identificacao": "Resultado mensal preliminar do SIAPS",
            "cor": "#1d4ed8",
            "disponivel": False,
            "competencia": competencia,
            "competencia_label": _comp_label(competencia),
            "nota": "Dados mensais do SIAPS não importados para esta competência.",
            "verificado_em": _ts(),
        }

    return {
        "situacao": rows[0].situacao,
        "identificacao": "Resultado mensal preliminar do SIAPS",
        "cor": "#1d4ed8",
        "disponivel": True,
        "competencia": competencia,
        "competencia_label": _comp_label(competencia),
        "data_publicacao": rows[0].data_publicacao,
        "data_extracao": rows[0].data_extracao.isoformat() if rows[0].data_extracao else None,
        "resultados": [
            {
                "equipe_ine": r.equipe_ine,
                "equipe_nome": r.equipe_nome,
                "equipe_tipo": r.equipe_tipo,
                "cnes": r.cnes,
                "indicador_codigo": r.indicador_codigo,
                "indicador_nome": r.indicador_nome,
                "numerador": r.numerador,
                "denominador": r.denominador,
                "resultado_pct": r.resultado_pct,
                "meta": r.meta,
                "pontuacao": r.pontuacao,
                "classificacao": r.classificacao,
                "situacao": r.situacao,
                "fonte": r.fonte,
            }
            for r in rows
        ],
        "verificado_em": _ts(),
    }


@router.get("/quadrimestral")
async def avaliacao_quadrimestral(
    ibge: str = Query(IBGE_DEFAULT),
    ano:  int = Query(None),
    q:    int = Query(None, description="Quadrimestre: 1, 2 ou 3"),
    _: UserOut = Depends(get_current_user),
):
    """Avaliação quadrimestral — resultado oficial."""
    if not ano:
        ano = date.today().year
    if not q:
        _, q = _quadrimestre_de(date.today().strftime("%Y-%m"))

    meses = _meses_quadrimestre(ano, q)

    async with AsyncSessionLocal() as db:
        try:
            rows = (await db.execute(
                select(ResultadoQuadrimestral).where(
                    ResultadoQuadrimestral.municipio_ibge == ibge,
                    ResultadoQuadrimestral.ano == ano,
                    ResultadoQuadrimestral.quadrimestre == q,
                )
            )).scalars().all()
        except Exception:
            rows = []

    if not rows:
        return {
            "situacao": "nao_disponivel",
            "identificacao": "Resultado oficial da avaliação quadrimestral",
            "cor": "#7c3aed",
            "disponivel": False,
            "ano": ano,
            "quadrimestre": q,
            "meses": meses,
            "nota": f"Resultado quadrimestral Q{q}/{ano} não importado ainda.",
            "verificado_em": _ts(),
        }

    return {
        "situacao": "oficial",
        "identificacao": "Resultado oficial da avaliação quadrimestral",
        "cor": "#7c3aed",
        "disponivel": True,
        "ano": ano,
        "quadrimestre": q,
        "meses": meses,
        "data_publicacao": rows[0].data_publicacao if rows else None,
        "resultados": [
            {
                "equipe_ine": r.equipe_ine,
                "equipe_nome": r.equipe_nome,
                "indicador_codigo": r.indicador_codigo,
                "indicador_nome": r.indicador_nome,
                "media_quadrimestre": r.media_quadrimestre,
                "pontuacao": r.pontuacao,
                "classificacao": r.classificacao,
                "componente": r.componente,
                "resultado_mes1": r.resultado_mes1,
                "resultado_mes2": r.resultado_mes2,
                "resultado_mes3": r.resultado_mes3,
                "resultado_mes4": r.resultado_mes4,
                "valor_financeiro": r.valor_financeiro,
                "situacao": r.situacao,
                "fonte": r.fonte,
            }
            for r in rows
        ],
        "verificado_em": _ts(),
    }


@router.get("/indicadores-config")
async def listar_indicadores_config(
    vigente: bool = Query(True),
    tipo_equipe: str = Query(None),
    _: UserOut = Depends(get_current_user),
):
    """Lista configuração dos indicadores (versionada)."""
    async with AsyncSessionLocal() as db:
        try:
            q = select(IndicadorConfig).where(IndicadorConfig.vigente == vigente)
            if tipo_equipe:
                q = q.where(IndicadorConfig.tipo_equipe.contains(tipo_equipe))
            rows = (await db.execute(q)).scalars().all()
        except Exception:
            rows = []

    if not rows:
        # Retorna os 15 indicadores padrão quando não há configuração no banco
        return {
            "fonte": "padrao_codigo",
            "versao": "2024.1",
            "indicadores": _INDICADORES_15,
            "total": len(_INDICADORES_15),
            "verificado_em": _ts(),
        }

    return {
        "fonte": "banco",
        "indicadores": [
            {
                "codigo": r.codigo, "nome": r.nome, "descricao": r.descricao,
                "numerador_desc": r.numerador_desc, "denominador_desc": r.denominador_desc,
                "formula": r.formula, "tipo_equipe": r.tipo_equipe,
                "meta": r.parametro_meta, "pontuacao_max": r.pontuacao_max,
                "versao": r.versao, "vigente": r.vigente,
            }
            for r in rows
        ],
        "total": len(rows),
        "verificado_em": _ts(),
    }


@router.get("/sincronizacoes")
async def historico_sincronizacoes(
    ibge:  str = Query(IBGE_DEFAULT),
    fonte: str = Query(None),
    limit: int = Query(20),
    _: UserOut = Depends(get_current_user),
):
    """Histórico de sincronizações."""
    async with AsyncSessionLocal() as db:
        try:
            q = select(SincronizacaoLog).where(
                SincronizacaoLog.municipio_ibge == ibge
            ).order_by(SincronizacaoLog.iniciado_em.desc()).limit(limit)
            if fonte:
                q = q.where(SincronizacaoLog.fonte == fonte)
            rows = (await db.execute(q)).scalars().all()
        except Exception:
            rows = []

    return {
        "sincronizacoes": [
            {
                "id": r.id,
                "fonte": r.fonte,
                "competencia": r.competencia,
                "iniciado_em": r.iniciado_em.isoformat() if r.iniciado_em else None,
                "concluido_em": r.concluido_em.isoformat() if r.concluido_em else None,
                "duracao_s": r.duracao_s,
                "sucesso": r.sucesso,
                "registros_inseridos": r.registros_inseridos,
                "registros_atualizados": r.registros_atualizados,
                "registros_rejeitados": r.registros_rejeitados,
                "erros": r.erros,
                "metodo": r.metodo,
                "versao_pec": r.versao_pec,
                "observacao": r.observacao,
            }
            for r in rows
        ],
        "total": len(rows),
        "verificado_em": _ts(),
    }


@router.post("/importar-siaps")
async def importar_dados_siaps(
    ibge:       str = Query(IBGE_DEFAULT),
    competencia: str = Query(None),
    _: UserOut = Depends(get_current_user),
):
    """
    Importa dados do SIAPS para o banco.
    Usa o serviço existente (siaps_service / siaps_municipio).
    """
    if not competencia:
        competencia = date.today().strftime("%Y-%m")

    t0 = datetime.utcnow()
    log = SincronizacaoLog(
        municipio_ibge=ibge,
        fonte="SIAPS",
        competencia=competencia,
        iniciado_em=t0,
        metodo="api",
    )

    async with AsyncSessionLocal() as db:
        try:
            db.add(log)
            await db.flush()

            # Chama serviço existente
            from services.siaps_municipio import buscar_qualidade, buscar_vinculo
            qualidade = await buscar_qualidade(ibge, competencia)
            vinculo   = await buscar_vinculo(ibge, competencia)

            inseridos = 0
            if qualidade.get("fonte") == "esus_pec" or qualidade.get("fonte") == "siaps":
                for eq in qualidade.get("equipes", []):
                    for ind in eq.get("indicadores", []):
                        obj = ResultadoMensalSiaps(
                            municipio_ibge=ibge,
                            competencia=competencia,
                            equipe_ine=eq.get("ine"),
                            equipe_nome=eq.get("equipe"),
                            equipe_tipo=eq.get("tipo"),
                            cnes=eq.get("cnes"),
                            indicador_codigo=ind.get("codigo"),
                            indicador_nome=ind.get("nome"),
                            numerador=ind.get("numerador"),
                            denominador=ind.get("denominador"),
                            resultado_pct=ind.get("resultado"),
                            meta=ind.get("meta"),
                            pontuacao=ind.get("pontuacao"),
                            classificacao=ind.get("status"),
                            situacao="preliminar",
                            fonte="SIAPS",
                            versao_metodologia="2024.1",
                            sincronizacao_id=log.id,
                        )
                        db.add(obj)
                        inseridos += 1

            log.sucesso = True
            log.registros_inseridos = inseridos
            log.concluido_em = datetime.utcnow()
            log.duracao_s = (datetime.utcnow() - t0).total_seconds()
            await db.commit()

            return {
                "sucesso": True,
                "competencia": competencia,
                "registros_inseridos": inseridos,
                "duracao_s": log.duracao_s,
                "verificado_em": _ts(),
            }

        except Exception as e:
            log.sucesso = False
            log.erros = 1
            log.observacao = str(e)[:500]
            log.concluido_em = datetime.utcnow()
            await db.commit()
            raise HTTPException(status_code=500, detail=f"Erro na importação: {e}")


@router.get("/inconsistencias")
async def listar_inconsistencias(
    ibge:      str = Query(IBGE_DEFAULT),
    competencia: str = Query(None),
    gravidade: str = Query(None),
    situacao:  str = Query("aberta"),
    _: UserOut = Depends(get_current_user),
):
    async with AsyncSessionLocal() as db:
        try:
            q = select(InconsistenciaAPS).where(InconsistenciaAPS.municipio_ibge == ibge)
            if competencia:
                q = q.where(InconsistenciaAPS.competencia == competencia)
            if gravidade:
                q = q.where(InconsistenciaAPS.gravidade == gravidade)
            if situacao:
                q = q.where(InconsistenciaAPS.situacao == situacao)
            rows = (await db.execute(q.order_by(InconsistenciaAPS.criado_em.desc()).limit(100))).scalars().all()
        except Exception:
            rows = []

    return {
        "inconsistencias": [
            {
                "id": r.id,
                "competencia": r.competencia,
                "equipe": r.equipe_nome,
                "tipo": r.tipo,
                "gravidade": r.gravidade,
                "descricao": r.descricao,
                "causa_provavel": r.causa_provavel,
                "situacao": r.situacao,
                "criado_em": r.criado_em.isoformat() if r.criado_em else None,
            }
            for r in rows
        ],
        "total": len(rows),
        "verificado_em": _ts(),
    }


# ── Helpers de banco ───────────────────────────────────────────────────────────

async def _buscar_cvat_db(ibge: str, competencia: str) -> dict | None:
    async with AsyncSessionLocal() as db:
        try:
            rows = (await db.execute(
                select(ResultadoCvatMensal).where(
                    ResultadoCvatMensal.municipio_ibge == ibge,
                    ResultadoCvatMensal.competencia == competencia,
                )
            )).scalars().all()
        except Exception:
            return None

    if not rows:
        return None

    equipes = []
    for r in rows:
        eq = {
            "ubs": r.ubs, "equipe": r.equipe_nome, "ine": r.equipe_ine,
            "tipo": r.equipe_tipo, "cnes": r.cnes, "parametro": r.populacao_parametro,
            "pontuacao": r.pontuacao,
            "classificacao": r.classificacao,
            "status": r.classificacao,
        }
        for v in "ABCDEFGHIJK":
            eq[v] = getattr(r, f"var_{v}", 0)
        equipes.append(eq)

    pcts = [e["pontuacao"] for e in equipes if e["pontuacao"]]
    media = round(sum(pcts) / len(pcts), 2) if pcts else 0

    por_status = {"otimo": 0, "bom": 0, "suficiente": 0, "regular": 0}
    for e in equipes:
        c = _classificar_cvat(e["pontuacao"])
        por_status[c] = por_status.get(c, 0) + 1

    return {
        "total_equipes": len(equipes),
        "total_pessoas_vinculadas": sum(e.get("K", 0) or 0 for e in equipes),
        "total_pessoas_acompanhadas": sum(e.get("H", 0) or 0 for e in equipes),
        "pontuacao_media": media,
        "ied": rows[0].ied_municipal if rows else "—",
        "por_status": por_status,
        "equipes": equipes,
        "situacao": rows[0].situacao if rows else "preliminar",
        "data_extracao": rows[0].data_extracao.isoformat() if rows and rows[0].data_extracao else None,
        "fonte": "SIAPS",
    }


async def _buscar_mensal_db(ibge: str, competencia: str) -> dict | None:
    async with AsyncSessionLocal() as db:
        try:
            rows = (await db.execute(
                select(ResultadoMensalSiaps).where(
                    ResultadoMensalSiaps.municipio_ibge == ibge,
                    ResultadoMensalSiaps.competencia == competencia,
                )
            )).scalars().all()
        except Exception:
            return None
    return {"total": len(rows), "resultados": rows} if rows else None


async def _buscar_quad_db(ibge: str, ano: int, q: int) -> dict | None:
    async with AsyncSessionLocal() as db:
        try:
            rows = (await db.execute(
                select(ResultadoQuadrimestral).where(
                    ResultadoQuadrimestral.municipio_ibge == ibge,
                    ResultadoQuadrimestral.ano == ano,
                    ResultadoQuadrimestral.quadrimestre == q,
                )
            )).scalars().all()
        except Exception:
            return None
    return {"total": len(rows)} if rows else None


def _ref_cvat_para_resposta(competencia: str) -> dict:
    equipes = _REF_CVAT_APUI_202605
    pcts = [e["pontuacao"] for e in equipes]
    media = round(sum(pcts) / len(pcts), 2) if pcts else 0
    por_status = {"otimo": 0, "bom": 0, "suficiente": 0, "regular": 0}
    for e in equipes:
        c = _classificar_cvat(e["pontuacao"])
        por_status[c] = por_status.get(c, 0) + 1

    return {
        "total_equipes": len(equipes),
        "total_pessoas_vinculadas": sum(e.get("K", 0) for e in equipes),
        "total_pessoas_acompanhadas": sum(e.get("H", 0) for e in equipes),
        "pontuacao_media": media,
        "ied": "II",
        "por_status": por_status,
        "equipes": [
            {**e, "status": _classificar_cvat(e["pontuacao"]), "classificacao": _classificar_cvat(e["pontuacao"])}
            for e in equipes
        ],
        "situacao": "referencia_municipal",
        "data_extracao": "2026-07-22T00:00:00Z",
        "fonte": "referencia_municipal",
        "nota": "Dados de referência confirmados no e-Gestor / SIAPS para Apuí/AM. Importe via SIAPS para atualização automática.",
        "competencia_ref": "2026-05",
    }
