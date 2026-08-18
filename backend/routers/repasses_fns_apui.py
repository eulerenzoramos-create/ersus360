"""
Router: /api/repasses-fns — Repasses do Fundo Nacional de Saúde — Apuí/AM
Fonte oficial: consultafns.saude.gov.br (fundo a fundo)
Fallback: api.portaldatransparencia.gov.br

Complementa (não substitui) o módulo e-Gestor APS em /api/repasses-aps.
"""
from __future__ import annotations

import logging
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.transferencia_fns import TransferenciaFns, ColetaFns
from services.fns_transferencias import (
    coletar_transferencias,
    listar_transferencias,
    resumo_por_tipo,
    resumo_mensal,
    classificar_tipo,
)
from services.egestor_aps import listar_parcelas  # para conciliação

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/repasses-fns", tags=["Repasses FNS"])

IBGE_APUI = "130014"
MESES_PT  = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
              "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


def _float(v) -> float | None:
    try:
        return float(v) if v is not None else None
    except Exception:
        return None

def _f2(v) -> float:
    return round(float(v or 0), 2)


# ── Status da integração ───────────────────────────────────────────────────────

@router.get("/status")
async def status_integracao(db: AsyncSession = Depends(get_db)):
    """Retorna situação atual da integração FNS: dados no banco, última coleta."""
    import os
    transp_ok = bool(os.getenv("TRANSPARENCIA_API_KEY"))
    fns_cpf_ok = bool(os.getenv("FNS_API_CPF"))
    fns_senha_ok = bool(os.getenv("FNS_API_SENHA"))

    # Contagem de transferências no banco
    total_stmt = select(func.count()).select_from(TransferenciaFns).where(
        TransferenciaFns.municipio_ibge == IBGE_APUI
    )
    total_transferencias = (await db.execute(total_stmt)).scalar_one() or 0

    # Soma total líquido
    soma_stmt = select(func.sum(TransferenciaFns.valor_liquido)).where(
        TransferenciaFns.municipio_ibge == IBGE_APUI
    )
    total_valor = (await db.execute(soma_stmt)).scalar_one()

    # Última coleta
    coleta_stmt = (
        select(ColetaFns)
        .where(ColetaFns.municipio_ibge == IBGE_APUI)
        .order_by(ColetaFns.id.desc())
        .limit(1)
    )
    ultima_coleta = (await db.execute(coleta_stmt)).scalar_one_or_none()

    return {
        "sistema": "FNS — Fundo Nacional de Saúde",
        "municipio": "Apuí/AM",
        "ibge": IBGE_APUI,
        "fontes_disponiveis": {
            "consultafns": True,
            "transparencia_api": transp_ok,
            "fns_api_autenticada": fns_cpf_ok and fns_senha_ok,
        },
        "banco": {
            "total_transferencias": total_transferencias,
            "total_valor_liquido": _float(total_valor),
            "ultima_coleta": ultima_coleta.concluido_em.isoformat() if ultima_coleta and ultima_coleta.concluido_em else None,
            "ultima_coleta_sucesso": ultima_coleta.sucesso if ultima_coleta else None,
        },
        "verificado_em": datetime.utcnow().isoformat(),
        "nota": "Fonte FNS complementa o e-Gestor APS. Valores não são somados diretamente.",
    }


# ── Coleta / Sincronização ─────────────────────────────────────────────────────

@router.post("/sincronizar")
async def sincronizar(
    exercicio: int = Query(..., description="Ano, ex: 2026"),
    mes:       int = Query(..., ge=1, le=12, description="Mês 1-12"),
    db: AsyncSession = Depends(get_db),
):
    """
    Coleta transferências do FNS para o mês/ano informado e salva no banco.
    Percorre todas as páginas. Valida total coletado vs total oficial.
    """
    resultado = await coletar_transferencias(exercicio, mes, db)
    return resultado


@router.post("/sincronizar-periodo")
async def sincronizar_periodo(
    exercicio:  int = Query(...),
    mes_inicio: int = Query(1, ge=1, le=12),
    mes_fim:    int = Query(12, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
):
    """Sincroniza múltiplos meses de um exercício."""
    resultados = []
    for mes in range(mes_inicio, mes_fim + 1):
        r = await coletar_transferencias(exercicio, mes, db)
        resultados.append({"mes": mes, **r})
    return {
        "exercicio": exercicio,
        "periodo": f"{mes_inicio:02d}–{mes_fim:02d}",
        "resultados": resultados,
        "total_inseridos": sum(r.get("registros_inseridos", 0) for r in resultados),
    }


# ── Listagem e filtros ─────────────────────────────────────────────────────────

@router.get("/transferencias")
async def listar(
    exercicio:      Optional[int]   = Query(None),
    mes:            Optional[int]   = Query(None, ge=1, le=12),
    tipo_incentivo: Optional[str]   = Query(None),
    bloco:          Optional[str]   = Query(None),
    grupo:          Optional[str]   = Query(None),
    busca:          Optional[str]   = Query(None),
    pagina:         int             = Query(1, ge=1),
    tamanho:        int             = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Lista transferências com filtros, paginação e totalizadores."""
    todos = await listar_transferencias(
        db, exercicio=exercicio, mes=mes,
        tipo_incentivo=tipo_incentivo, bloco=bloco, grupo=grupo, busca=busca,
    )

    total_registros = len(todos)
    total_bruto    = sum(_f2(t.valor_total) for t in todos)
    total_desconto = sum(_f2(t.valor_desconto) for t in todos)
    total_liquido  = sum(_f2(t.valor_liquido) for t in todos)

    # Paginação
    inicio = (pagina - 1) * tamanho
    pagina_items = todos[inicio: inicio + tamanho]

    def _serialize(t: TransferenciaFns) -> dict:
        return {
            "id":              t.id,
            "exercicio":       t.exercicio,
            "mes":             t.mes,
            "mes_nome":        MESES_PT[t.mes] if t.mes else None,
            "competencia":     t.competencia,
            "data_pagamento":  t.data_pagamento.isoformat() if t.data_pagamento else None,
            "bloco":           t.bloco,
            "grupo":           t.grupo,
            "acao":            t.acao,
            "acao_detalhada":  t.acao_detalhada,
            "tipo_incentivo":  t.tipo_incentivo,
            "numero_ob":       t.numero_ob,
            "numero_portaria": t.numero_portaria,
            "valor_total":     _float(t.valor_total),
            "valor_desconto":  _float(t.valor_desconto),
            "valor_liquido":   _float(t.valor_liquido),
            "situacao":        t.situacao,
            "fonte":           t.fonte,
            "data_coleta":     t.data_coleta.isoformat() if t.data_coleta else None,
            "nu_parcela_egestor":   t.nu_parcela_egestor,
            "status_conciliacao":   t.status_conciliacao,
            "diferenca_valor":      _float(t.diferenca_valor),
        }

    return {
        "total_registros": total_registros,
        "total_bruto":     round(total_bruto, 2),
        "total_desconto":  round(total_desconto, 2),
        "total_liquido":   round(total_liquido, 2),
        "pagina":          pagina,
        "tamanho":         tamanho,
        "total_paginas":   max(1, -(-total_registros // tamanho)),
        "transferencias":  [_serialize(t) for t in pagina_items],
        "fonte":           "banco_de_dados",
        "nota":            "Dados coletados do FNS. Não somados com e-Gestor APS.",
    }


# ── Cards / Dashboard ─────────────────────────────────────────────────────────

@router.get("/resumo")
async def resumo(
    exercicio: Optional[int] = Query(None),
    mes:       Optional[int] = Query(None, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
):
    """Cards do painel FNS: totais, quantidade, maior tipo, última transferência."""
    todos = await listar_transferencias(db, exercicio=exercicio, mes=mes)

    if not todos:
        return {
            "situacao_dado": "nao_disponivel",
            "nota": "Nenhuma transferência FNS no banco para o período. Execute /sincronizar.",
            "exercicio": exercicio,
            "mes": mes,
        }

    total_bruto    = sum(_f2(t.valor_total) for t in todos)
    total_desconto = sum(_f2(t.valor_desconto) for t in todos)
    total_liquido  = sum(_f2(t.valor_liquido) for t in todos)

    # Maior tipo
    por_tipo: dict[str, float] = {}
    for t in todos:
        tipo = t.tipo_incentivo or "Outros"
        por_tipo[tipo] = por_tipo.get(tipo, 0) + _f2(t.valor_liquido)
    maior_tipo = max(por_tipo, key=por_tipo.get) if por_tipo else None
    maior_valor = por_tipo.get(maior_tipo, 0) if maior_tipo else 0

    # Última transferência (por data_pagamento)
    ultima = max(todos, key=lambda t: t.data_pagamento or date.min)

    exercicios = sorted({t.exercicio for t in todos}, reverse=True)
    meses_disponiveis = sorted({t.mes for t in todos if t.mes})

    return {
        "situacao_dado": "oficial_validado",
        "exercicio": exercicio,
        "mes": mes,
        "totais": {
            "total_bruto":        round(total_bruto, 2),
            "total_desconto":     round(total_desconto, 2),
            "total_liquido":      round(total_liquido, 2),
            "quantidade_transferencias": len(todos),
        },
        "maior_incentivo": {
            "tipo":  maior_tipo,
            "valor": round(maior_valor, 2),
            "percentual": round((maior_valor / total_liquido * 100) if total_liquido > 0 else 0, 1),
        },
        "ultima_transferencia": {
            "data_pagamento": ultima.data_pagamento.isoformat() if ultima.data_pagamento else None,
            "grupo":     ultima.grupo,
            "acao":      ultima.acao,
            "valor_liquido": _float(ultima.valor_liquido),
        },
        "exercicios_disponiveis": exercicios,
        "meses_disponiveis": meses_disponiveis,
        "coletado_em": max((t.data_coleta for t in todos if t.data_coleta), default=None),
        "nota": "Valores FNS. Consultar aba Conciliação para comparativo com e-Gestor APS.",
    }


# ── Gráficos ──────────────────────────────────────────────────────────────────

@router.get("/grafico-tipos")
async def grafico_tipos(
    exercicio: Optional[int] = Query(None),
    mes:       Optional[int] = Query(None, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
):
    """Dados para gráfico de barras horizontais por tipo de incentivo."""
    dados = await resumo_por_tipo(db, exercicio=exercicio, mes=mes)
    total_liq = sum(d["total_liquido"] for d in dados)

    return {
        "dados": [
            {
                **d,
                "percentual": round((d["total_liquido"] / total_liq * 100) if total_liq > 0 else 0, 1),
            }
            for d in dados
        ],
        "total_liquido_geral": round(total_liq, 2),
        "exercicio": exercicio,
        "mes": mes,
    }


@router.get("/grafico-mensal")
async def grafico_mensal(
    exercicio: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Dados para gráfico de evolução mensal por tipo de incentivo (barras empilhadas)."""
    dados = await resumo_mensal(db, exercicio=exercicio)

    # Reorganiza para formato [{mes, tipo1: valor, tipo2: valor, ...}]
    por_mes: dict[str, dict] = {}
    tipos: set[str] = set()

    for d in dados:
        chave = f"{d['exercicio']}/{d['mes']:02d}" if d["mes"] else str(d["exercicio"])
        if chave not in por_mes:
            por_mes[chave] = {"competencia": chave, "exercicio": d["exercicio"], "mes": d["mes"]}
        por_mes[chave][d["tipo_incentivo"]] = round(d["total_liquido"], 2)
        tipos.add(d["tipo_incentivo"])

    return {
        "dados": list(por_mes.values()),
        "tipos": sorted(tipos),
    }


# ── Conciliação FNS × e-Gestor APS ────────────────────────────────────────────

@router.get("/conciliacao")
async def conciliacao(
    exercicio: int = Query(2026),
    db: AsyncSession = Depends(get_db),
):
    """
    Compara transferências do FNS com competências do e-Gestor APS.

    Lógica:
    - Identifica transferências FNS classificadas como "Atenção Primária"
    - Busca competências APS do e-Gestor para o mesmo exercício
    - Confronta por mês/competência e valor
    - Classifica status de conciliação

    REGRA FUNDAMENTAL: não soma valores das duas fontes.
    Mostra separado: valor e-Gestor APS × valor FNS × diferença.
    """
    # Busca transferências APS do FNS
    aps_fns = await listar_transferencias(
        db, exercicio=exercicio, tipo_incentivo=None
    )

    # Agrupa FNS por mês (apenas APS e relacionados)
    TIPOS_APS = {"Atenção Primária", "ACS — Agentes Comunitários de Saúde", "ACE — Agentes de Combate às Endemias"}
    fns_por_mes: dict[int, dict] = {}
    fns_outros: dict[str, float] = {}

    for t in aps_fns:
        if t.tipo_incentivo in TIPOS_APS:
            mes = t.mes or 0
            if mes not in fns_por_mes:
                fns_por_mes[mes] = {"mes": mes, "transferencias": [], "total_fns": 0.0}
            fns_por_mes[mes]["transferencias"].append({
                "grupo": t.grupo,
                "acao":  t.acao,
                "acao_detalhada": t.acao_detalhada,
                "tipo_incentivo": t.tipo_incentivo,
                "valor_total":    _float(t.valor_total),
                "valor_desconto": _float(t.valor_desconto),
                "valor_liquido":  _float(t.valor_liquido),
                "data_pagamento": t.data_pagamento.isoformat() if t.data_pagamento else None,
                "numero_ob":      t.numero_ob,
            })
            fns_por_mes[mes]["total_fns"] = round(
                fns_por_mes[mes]["total_fns"] + _f2(t.valor_liquido), 2
            )
        else:
            tipo = t.tipo_incentivo or "Outros"
            fns_outros[tipo] = round(fns_outros.get(tipo, 0) + _f2(t.valor_liquido), 2)

    # Busca competências e-Gestor APS
    egestor_data = []
    try:
        from services.egestor_aps import buscar_pagamentos
        parcelas = await listar_parcelas(exercicio)
        if parcelas:
            egestor_raw = await buscar_pagamentos(parcelas[0], parcelas[-1])
            egestor_data = egestor_raw if isinstance(egestor_raw, list) else egestor_raw.get("competencias", [])
    except Exception as e:
        logger.warning(f"Conciliação: falha ao buscar e-Gestor APS: {e}")

    # Monta comparativo por competência
    MESES_NOMES = {1:"Jan",2:"Fev",3:"Mar",4:"Abr",5:"Mai",6:"Jun",
                   7:"Jul",8:"Ago",9:"Set",10:"Out",11:"Nov",12:"Dez"}

    linhas = []
    meses_egestor = set()

    for comp in egestor_data:
        # e-Gestor usa parcela (NOV/2025=1, DEZ/2025=2, ...) — mapeamos para mês calendário
        comp_label = comp.get("competencia", "")  # ex: "MAR/2026"
        total_egestor = comp.get("total_oficial", 0)
        parcela = comp.get("parcela", "")
        nu_parcela = comp.get("nu_parcela", "")

        # Tenta identificar o mês do pagamento FNS correspondente
        mes_cal = None
        for m, nome in MESES_NOMES.items():
            if nome.upper() in comp_label.upper():
                mes_cal = m
                break

        fns_info = fns_por_mes.get(mes_cal, {}) if mes_cal else {}
        total_fns = fns_info.get("total_fns", 0)
        transferencias_fns = fns_info.get("transferencias", [])

        if mes_cal:
            meses_egestor.add(mes_cal)

        # Determina status da conciliação
        if not transferencias_fns:
            status = "pagamento_nao_identificado_no_fns"
        elif abs(total_fns - total_egestor) < 0.02:
            status = "conciliado"
        elif abs(total_fns - total_egestor) < (total_egestor * 0.05):
            status = "conciliado_com_diferenca_de_agrupamento"
        elif total_fns > total_egestor:
            status = "valor_fns_maior_exige_analise"
        else:
            status = "valor_divergente"

        linhas.append({
            "competencia_egestor":  comp_label,
            "parcela":              parcela,
            "nu_parcela":           nu_parcela,
            "mes_calendario":       mes_cal,
            "mes_nome":             MESES_NOMES.get(mes_cal, "?") if mes_cal else "?",
            "total_egestor":        round(float(total_egestor), 2),
            "total_fns":            round(total_fns, 2),
            "diferenca":            round(float(total_fns) - float(total_egestor), 2),
            "status_conciliacao":   status,
            "transferencias_fns":   transferencias_fns,
            "conciliado":           status in ("conciliado", "conciliado_com_diferenca_de_agrupamento"),
        })

    # Meses com transferências FNS sem competência e-Gestor correspondente
    fns_sem_egestor = [
        {
            "mes": m,
            "mes_nome": MESES_NOMES.get(m, "?"),
            "total_fns": info["total_fns"],
            "status_conciliacao": "transferencia_retroativa_ou_competencia_nao_processada",
            "transferencias_fns": info["transferencias"],
        }
        for m, info in fns_por_mes.items()
        if m not in meses_egestor and m != 0
    ]

    total_egestor_geral  = sum(l["total_egestor"] for l in linhas)
    total_fns_aps_geral  = sum(l["total_fns"] for l in linhas)
    conciliados          = sum(1 for l in linhas if l["conciliado"])

    return {
        "exercicio": exercicio,
        "resumo": {
            "total_competencias_egestor": len(linhas),
            "total_conciliadas":          conciliados,
            "total_nao_conciliadas":      len(linhas) - conciliados,
            "total_fns_sem_egestor":      len(fns_sem_egestor),
            "total_egestor":              round(total_egestor_geral, 2),
            "total_fns_aps":              round(total_fns_aps_geral, 2),
            "diferenca_geral":            round(total_fns_aps_geral - total_egestor_geral, 2),
        },
        "conciliacao_por_competencia": linhas,
        "fns_sem_correspondencia_egestor": fns_sem_egestor,
        "outros_incentivos_fns":       fns_outros,
        "nota": (
            "ATENÇÃO: os valores do e-Gestor APS e do FNS NÃO são somados. "
            "Representam perspectivas diferentes da mesma transferência. "
            "Diferenças de agrupamento são esperadas (e-Gestor detalha competência, "
            "FNS registra data de crédito bancário)."
        ),
    }


# ── Histórico de coletas ──────────────────────────────────────────────────────

@router.get("/historico-coletas")
async def historico_coletas(
    exercicio: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Lista registros de coletas anteriores do FNS."""
    stmt = (
        select(ColetaFns)
        .where(ColetaFns.municipio_ibge == IBGE_APUI)
        .order_by(ColetaFns.id.desc())
        .limit(50)
    )
    if exercicio:
        stmt = stmt.where(ColetaFns.exercicio == exercicio)

    result = await db.execute(stmt)
    coletas = result.scalars().all()

    return [
        {
            "id": c.id,
            "exercicio": c.exercicio,
            "mes": c.mes,
            "competencia": c.competencia,
            "sucesso": c.sucesso,
            "total_registros": c.total_registros,
            "registros_coletados": c.registros_coletados,
            "total_oficial_bruto": _float(c.total_oficial_bruto),
            "total_coletado_bruto": _float(c.total_coletado_bruto),
            "divergencia_total": _float(c.divergencia_total),
            "todas_paginas_ok": c.todas_paginas_ok,
            "fonte": c.fonte,
            "iniciado_em": c.iniciado_em.isoformat() if c.iniciado_em else None,
            "concluido_em": c.concluido_em.isoformat() if c.concluido_em else None,
            "mensagem_erro": c.mensagem_erro,
        }
        for c in coletas
    ]
