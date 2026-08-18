"""
Router: /api/matriz-fns — Repasses mensais do FNS em formato matricial
Município: Apuí/AM · IBGE 130014 · FMS CNPJ 12.834.320/0001-26

Retorna dados pivotados por (grupo, ação, componente) × mês
para montar a tabela matricial na interface.

Fonte: tabela transferencias_fns — dados oficiais consultafns.saude.gov.br
"""
from __future__ import annotations

import logging
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from database import get_db
from models.transferencia_fns import TransferenciaFns, ColetaFns

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/matriz-fns", tags=["Matriz FNS"])

IBGE = "130014"
MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
         "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]


def _dec(v) -> float:
    if v is None:
        return 0.0
    try:
        return float(v)
    except Exception:
        return 0.0


# ── Endpoint principal: matriz pivotada ────────────────────────────────────────

@router.get("/tabela")
async def tabela_mensal(
    exercicio:      int            = Query(2026),
    mes_inicio:     int            = Query(1, ge=1, le=12),
    mes_fim:        int            = Query(12, ge=1, le=12),
    grupo:          Optional[str]  = Query(None),
    acao:           Optional[str]  = Query(None),
    componente:     Optional[str]  = Query(None),
    tipo_incentivo: Optional[str]  = Query(None),
    busca:          Optional[str]  = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna matriz: cada linha = (grupo, ação, componente, tipo)
    com o valor líquido somado para cada mês (1–12).

    Cada célula [linha][mes] = soma dos valores_liquidos daquele
    componente naquele mês.
    """
    # ── Filtros ──────────────────────────────────────────────────────────────
    filtros = [
        TransferenciaFns.municipio_ibge == IBGE,
        TransferenciaFns.exercicio == exercicio,
        TransferenciaFns.ativo == True,
    ]
    if mes_inicio:
        filtros.append(TransferenciaFns.mes >= mes_inicio)
    if mes_fim:
        filtros.append(TransferenciaFns.mes <= mes_fim)
    if grupo:
        filtros.append(TransferenciaFns.grupo.ilike(f"%{grupo}%"))
    if acao:
        filtros.append(TransferenciaFns.acao.ilike(f"%{acao}%"))
    if componente:
        filtros.append(TransferenciaFns.acao_detalhada.ilike(f"%{componente}%"))
    if tipo_incentivo:
        filtros.append(TransferenciaFns.tipo_incentivo == tipo_incentivo)
    if busca:
        pattern = f"%{busca}%"
        filtros.append(
            TransferenciaFns.grupo.ilike(pattern) |
            TransferenciaFns.acao.ilike(pattern) |
            TransferenciaFns.acao_detalhada.ilike(pattern) |
            TransferenciaFns.tipo_incentivo.ilike(pattern)
        )

    # ── Busca todos os registros com filtro ──────────────────────────────────
    stmt = (
        select(TransferenciaFns)
        .where(and_(*filtros))
        .order_by(
            TransferenciaFns.tipo_incentivo,
            TransferenciaFns.grupo,
            TransferenciaFns.acao,
            TransferenciaFns.acao_detalhada,
            TransferenciaFns.mes,
        )
    )
    result = await db.execute(stmt)
    registros = result.scalars().all()

    # ── Agrupa em matriz (grupo, ação, componente, tipo) × mês ───────────────
    # Chave de agrupamento por linha
    linhas: dict[tuple, dict] = {}

    for r in registros:
        grupo_k  = r.grupo or r.tipo_incentivo or "Não classificado"
        acao_k   = r.acao or ""
        comp_k   = r.acao_detalhada or ""
        tipo_k   = r.tipo_incentivo or "Não classificado"
        bloco_k  = r.bloco or ""

        key = (grupo_k, acao_k, comp_k, tipo_k)

        if key not in linhas:
            linhas[key] = {
                "grupo":     grupo_k,
                "acao":      acao_k,
                "componente": comp_k,
                "tipo":      tipo_k,
                "bloco":     bloco_k,
                "meses":     {m: {"total": Decimal("0"), "ids": [], "qtd": 0} for m in range(1, 13)},
                "total_anual": Decimal("0"),
            }

        m = r.mes or 0
        if 1 <= m <= 12:
            vl = r.valor_liquido or Decimal("0")
            linhas[key]["meses"][m]["total"] += vl
            linhas[key]["meses"][m]["ids"].append(r.id)
            linhas[key]["meses"][m]["qtd"] += 1
            linhas[key]["total_anual"] += vl

    # ── Ordena por grupo → ação → componente ─────────────────────────────────
    ORDEM_GRUPOS = {
        "Atenção Primária": 1,
        "MAC — Média e Alta Complexidade": 2,
        "Atenção Especializada": 2,
        "Assistência Farmacêutica": 3,
        "Vigilância em Saúde": 4,
        "Gestão do SUS": 5,
        "Piso Salarial da Enfermagem": 6,
        "ACS — Agentes Comunitários de Saúde": 7,
        "ACE — Agentes de Combate às Endemias": 8,
        "Emendas Parlamentares": 9,
        "Investimentos": 10,
        "Outros incentivos": 99,
        "Não classificado": 100,
    }

    def _ordem(key: tuple) -> tuple:
        grupo_v = key[0]
        prioridade = next(
            (v for k, v in ORDEM_GRUPOS.items() if k.lower() in grupo_v.lower()),
            50
        )
        return (prioridade, key[0], key[1], key[2])

    linhas_ordenadas = sorted(linhas.items(), key=lambda x: _ordem(x[0]))

    # ── Subtotais por grupo ───────────────────────────────────────────────────
    subtotais_grupo: dict[str, dict] = {}
    for key, dados in linhas_ordenadas:
        g = dados["grupo"]
        if g not in subtotais_grupo:
            subtotais_grupo[g] = {
                "meses": {m: Decimal("0") for m in range(1, 13)},
                "total": Decimal("0"),
            }
        for m in range(1, 13):
            subtotais_grupo[g]["meses"][m] += dados["meses"][m]["total"]
        subtotais_grupo[g]["total"] += dados["total_anual"]

    # ── Total mensal geral ────────────────────────────────────────────────────
    totais_mensais: dict[int, Decimal] = {m: Decimal("0") for m in range(1, 13)}
    total_geral = Decimal("0")
    for dados in linhas.values():
        for m in range(1, 13):
            totais_mensais[m] += dados["meses"][m]["total"]
        total_geral += dados["total_anual"]

    # ── Meses com status (coletado vs não coletado) ───────────────────────────
    coletas_stmt = (
        select(ColetaFns.mes, ColetaFns.sucesso, ColetaFns.todas_paginas_ok)
        .where(
            ColetaFns.municipio_ibge == IBGE,
            ColetaFns.exercicio == exercicio,
        )
        .order_by(ColetaFns.id.desc())
    )
    coletas_result = await db.execute(coletas_stmt)
    coletas_rows = coletas_result.fetchall()

    meses_coletados: dict[int, str] = {}
    for row in coletas_rows:
        m = row.mes or 0
        if m not in meses_coletados:
            if not row.sucesso:
                meses_coletados[m] = "pendente"
            elif row.todas_paginas_ok is False:
                meses_coletados[m] = "incompleto"
            else:
                meses_coletados[m] = "ok"

    def _status_mes(m: int) -> str:
        return meses_coletados.get(m, "nao_coletado")

    # ── Serializa resposta ────────────────────────────────────────────────────
    def _s_dec(d: Decimal) -> float | None:
        v = float(d)
        return v if v != 0.0 else None

    linhas_json = []
    for key, dados in linhas_ordenadas:
        meses_json = {}
        for m in range(1, 13):
            cel = dados["meses"][m]
            meses_json[str(m)] = {
                "valor": _s_dec(cel["total"]),
                "ids": cel["ids"],
                "qtd": cel["qtd"],
                "status_coleta": _status_mes(m),
            }
        linhas_json.append({
            "grupo":      dados["grupo"],
            "acao":       dados["acao"],
            "componente": dados["componente"],
            "tipo":       dados["tipo"],
            "bloco":      dados["bloco"],
            "meses":      meses_json,
            "total_anual": float(dados["total_anual"]) if dados["total_anual"] else 0.0,
        })

    subtotais_json = {}
    for g, st in subtotais_grupo.items():
        subtotais_json[g] = {
            "meses":  {str(m): float(st["meses"][m]) for m in range(1, 13)},
            "total":  float(st["total"]),
        }

    return {
        "exercicio":      exercicio,
        "mes_inicio":     mes_inicio,
        "mes_fim":        mes_fim,
        "total_linhas":   len(linhas_json),
        "total_geral":    float(total_geral),
        "totais_mensais": {str(m): float(totais_mensais[m]) for m in range(1, 13)},
        "subtotais_grupo": subtotais_json,
        "linhas":         linhas_json,
        "meses_status":   {str(m): _status_mes(m) for m in range(1, 13)},
        "grupos_disponiveis": sorted(set(k[0] for k in linhas)),
        "tipos_disponiveis":  sorted(set(k[3] for k in linhas)),
        "nota": (
            "Valores líquidos do FNS. Cada célula pode conter múltiplas transferências "
            "— clique para ver o detalhamento."
        ),
    }


# ── Endpoint: detalhamento de uma célula (grupo+ação+comp+mês) ────────────────

@router.get("/detalhe-celula")
async def detalhe_celula(
    exercicio:  int           = Query(...),
    mes:        int           = Query(..., ge=1, le=12),
    grupo:      Optional[str] = Query(None),
    acao:       Optional[str] = Query(None),
    componente: Optional[str] = Query(None),
    ids:        Optional[str] = Query(None, description="IDs separados por vírgula"),
    db: AsyncSession = Depends(get_db),
):
    """
    Retorna todas as transferências individuais que compõem uma célula da matriz.
    Pode filtrar por ids específicos (retornados pela /tabela) ou por grupo/ação/comp/mês.
    """
    if ids:
        id_list = [int(i) for i in ids.split(",") if i.strip().isdigit()]
        stmt = (
            select(TransferenciaFns)
            .where(TransferenciaFns.id.in_(id_list))
            .order_by(TransferenciaFns.data_pagamento)
        )
    else:
        filtros = [
            TransferenciaFns.municipio_ibge == IBGE,
            TransferenciaFns.exercicio == exercicio,
            TransferenciaFns.mes == mes,
            TransferenciaFns.ativo == True,
        ]
        if grupo:
            filtros.append(
                (TransferenciaFns.grupo.ilike(f"%{grupo}%")) |
                (TransferenciaFns.tipo_incentivo.ilike(f"%{grupo}%"))
            )
        if acao:
            filtros.append(TransferenciaFns.acao.ilike(f"%{acao}%"))
        if componente:
            filtros.append(TransferenciaFns.acao_detalhada.ilike(f"%{componente}%"))
        stmt = (
            select(TransferenciaFns)
            .where(and_(*filtros))
            .order_by(TransferenciaFns.data_pagamento)
        )

    result = await db.execute(stmt)
    rows = result.scalars().all()

    def _ser(r: TransferenciaFns) -> dict:
        return {
            "id":               r.id,
            "exercicio":        r.exercicio,
            "mes":              r.mes,
            "competencia":      r.competencia,
            "data_pagamento":   r.data_pagamento.isoformat() if r.data_pagamento else None,
            "grupo":            r.grupo,
            "acao":             r.acao,
            "acao_detalhada":   r.acao_detalhada,
            "tipo_incentivo":   r.tipo_incentivo,
            "bloco":            r.bloco,
            "numero_portaria":  r.numero_portaria,
            "numero_ob":        r.numero_ob,
            "numero_proposta":  r.numero_proposta,
            "numero_processo":  r.numero_processo,
            "conta_bancaria":   r.conta_bancaria,
            "valor_total":      float(r.valor_total)   if r.valor_total   else None,
            "valor_desconto":   float(r.valor_desconto) if r.valor_desconto else 0.0,
            "valor_liquido":    float(r.valor_liquido) if r.valor_liquido else None,
            "situacao":         r.situacao,
            "fonte":            r.fonte,
            "url_consultada":   r.url_consultada,
            "data_coleta":      r.data_coleta.isoformat() if r.data_coleta else None,
            "pagina_coleta":    r.pagina_coleta,
        }

    total_liquido = sum(float(r.valor_liquido or 0) for r in rows)
    total_bruto   = sum(float(r.valor_total or 0) for r in rows)
    total_desconto = sum(float(r.valor_desconto or 0) for r in rows)

    return {
        "exercicio":     exercicio,
        "mes":           mes,
        "mes_nome":      MESES[mes - 1],
        "grupo":         grupo,
        "acao":          acao,
        "componente":    componente,
        "qtd":           len(rows),
        "total_bruto":   round(total_bruto, 2),
        "total_desconto": round(total_desconto, 2),
        "total_liquido": round(total_liquido, 2),
        "transferencias": [_ser(r) for r in rows],
        "validacao_liquido": round(total_bruto - total_desconto, 2) == round(total_liquido, 2),
    }


# ── Endpoint: validações automáticas ─────────────────────────────────────────

@router.get("/validacoes")
async def validacoes(
    exercicio: int = Query(2026),
    db: AsyncSession = Depends(get_db),
):
    """Executa validações automáticas nos dados coletados e retorna divergências."""
    alertas = []

    # 1. Registros sem grupo
    sem_grupo_stmt = select(func.count()).select_from(TransferenciaFns).where(
        TransferenciaFns.municipio_ibge == IBGE,
        TransferenciaFns.exercicio == exercicio,
        TransferenciaFns.grupo.is_(None),
        TransferenciaFns.ativo == True,
    )
    sem_grupo = (await db.execute(sem_grupo_stmt)).scalar_one() or 0
    if sem_grupo:
        alertas.append({
            "tipo": "classificacao_incompleta",
            "severidade": "media",
            "mensagem": f"{sem_grupo} transferências sem grupo classificado",
            "providencia": "Sincronizar novamente — a API pode ter retornado esses campos em páginas não coletadas",
        })

    # 2. Valor líquido ≠ bruto − desconto
    registros_stmt = select(TransferenciaFns).where(
        TransferenciaFns.municipio_ibge == IBGE,
        TransferenciaFns.exercicio == exercicio,
        TransferenciaFns.ativo == True,
        TransferenciaFns.valor_total.isnot(None),
        TransferenciaFns.valor_liquido.isnot(None),
    )
    registros_result = await db.execute(registros_stmt)
    registros = registros_result.scalars().all()

    divergencias_valor = []
    for r in registros:
        esperado = float(r.valor_total or 0) - float(r.valor_desconto or 0)
        real = float(r.valor_liquido or 0)
        if abs(esperado - real) > 0.02:
            divergencias_valor.append({
                "id": r.id, "mes": r.mes,
                "esperado": round(esperado, 2), "real": round(real, 2),
                "diferenca": round(abs(esperado - real), 2),
            })
    if divergencias_valor:
        alertas.append({
            "tipo": "divergencia_valor_liquido",
            "severidade": "alta",
            "mensagem": f"{len(divergencias_valor)} registros com valor líquido ≠ bruto − desconto",
            "detalhes": divergencias_valor[:10],
            "providencia": "Verificar na fonte FNS se o desconto está correto",
        })

    # 3. Coletas incompletas
    coletas_stmt = select(ColetaFns).where(
        ColetaFns.municipio_ibge == IBGE,
        ColetaFns.exercicio == exercicio,
    ).order_by(ColetaFns.mes, ColetaFns.id.desc())
    coletas_result = await db.execute(coletas_stmt)
    coletas = coletas_result.scalars().all()

    meses_vistos = set()
    coletas_incompletas = []
    for c in coletas:
        if c.mes not in meses_vistos:
            meses_vistos.add(c.mes)
            if c.todas_paginas_ok is False:
                coletas_incompletas.append({
                    "mes": c.mes, "total_paginas": c.total_paginas,
                    "registros_coletados": c.registros_coletados,
                    "total_registros": c.total_registros,
                    "divergencia_total": float(c.divergencia_total or 0),
                })
    if coletas_incompletas:
        alertas.append({
            "tipo": "paginas_nao_coletadas",
            "severidade": "alta",
            "mensagem": f"{len(coletas_incompletas)} meses com coleta incompleta (nem todas as páginas foram processadas)",
            "detalhes": coletas_incompletas,
            "providencia": "Executar nova sincronização para esses meses",
        })

    # 4. Totais mensais
    total_geral_calc = sum(float(r.valor_liquido or 0) for r in registros)

    return {
        "exercicio": exercicio,
        "total_registros": len(registros),
        "total_geral_calculado": round(total_geral_calc, 2),
        "alertas": alertas,
        "status": "ok" if not alertas else "com_alertas",
        "validacoes_ok": {
            "registros_com_grupo": sem_grupo == 0,
            "valores_liquidos_corretos": len(divergencias_valor) == 0,
            "coletas_completas": len(coletas_incompletas) == 0,
        },
    }


# ── Endpoint: lista de grupos/ações disponíveis ────────────────────────────────

@router.get("/opcoes-filtro")
async def opcoes_filtro(
    exercicio: int = Query(2026),
    db: AsyncSession = Depends(get_db),
):
    """Retorna os valores disponíveis para cada filtro."""
    stmt = select(
        TransferenciaFns.grupo,
        TransferenciaFns.acao,
        TransferenciaFns.acao_detalhada,
        TransferenciaFns.tipo_incentivo,
        TransferenciaFns.bloco,
    ).where(
        TransferenciaFns.municipio_ibge == IBGE,
        TransferenciaFns.exercicio == exercicio,
        TransferenciaFns.ativo == True,
    ).distinct()

    result = await db.execute(stmt)
    rows = result.fetchall()

    grupos       = sorted(set(r[0] for r in rows if r[0]))
    acoes        = sorted(set(r[1] for r in rows if r[1]))
    componentes  = sorted(set(r[2] for r in rows if r[2]))
    tipos        = sorted(set(r[3] for r in rows if r[3]))
    blocos       = sorted(set(r[4] for r in rows if r[4]))

    return {
        "exercicio":   exercicio,
        "grupos":      grupos,
        "acoes":       acoes,
        "componentes": componentes,
        "tipos":       tipos,
        "blocos":      blocos,
    }
