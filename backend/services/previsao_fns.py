"""
Previsão da Portaria × Recebimento FNS — camada de conciliação do Controle Financeiro FNS.

Reaproveita o que já existe:
  - recebido  = transferências já coletadas do FNS (transferencias_fns). Nunca
                se cria outro registro financeiro; a conciliação só VINCULA o
                registro existente à previsão (previsao_id + competencia_referencia).
  - previsto  = portarias_municipio (vínculo Portaria ↔ município), expandida em
                parcelas por competência conforme periodicidade/quantidade.

Regras:
  - Previsão NÃO é receita: nunca é somada ao recebido.
  - A data do crédito é mantida, mas não define sozinha a competência.
  - Valor igual NÃO basta para vincular: exige identidade (nº da Portaria ou
    componente/ação) e janela de competência; havendo mais de uma possibilidade,
    fica CONCILIAÇÃO PENDENTE para vínculo manual (auditado).
  - Registro sem valor líquido (Transparência API legada) nunca confirma pagamento.
  - Tudo por município da sessão (multi-tenant): previsões por municipio_id,
    transferências pelo IBGE da sessão.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.portaria import PortariaMunicipio
from models.transferencia_fns import TransferenciaFns
from tenancy.contexto import ibge6, ibge7

PAGO = "PAGO"
PARCIAL = "PARCIAL"
NAO_RECEBIDO = "NAO_RECEBIDO"
PAGO_A_MAIOR = "PAGO_A_MAIOR"
A_VENCER = "A_VENCER"
PENDENTE = "CONCILIACAO_PENDENTE"

PASSO_MESES = {"unica": 0, "mensal": 1, "bimestral": 2, "trimestral": 3,
               "quadrimestral": 4, "semestral": 6, "anual": 12}
JANELA_MESES = 3      # pagamento aceito até 3 meses após a competência
TOLERANCIA = Decimal("0.01")


# ── Utilitários ──────────────────────────────────────────────────────────────

def norm(s: str | None) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9]+", " ", s.upper()).strip()


def comp_parse(s: str | None) -> tuple[int, int] | None:
    """Aceita AAAA-MM, AAAA/MM e MM/AAAA."""
    if not s:
        return None
    m = re.fullmatch(r"\s*(\d{4})[-/](\d{1,2})\s*", s) or None
    if m:
        a, mes = int(m.group(1)), int(m.group(2))
    else:
        m = re.fullmatch(r"\s*(\d{1,2})[-/](\d{4})\s*", s)
        if not m:
            return None
        a, mes = int(m.group(2)), int(m.group(1))
    return (a, mes) if 1 <= mes <= 12 else None


def comp_fmt(a: int, m: int) -> str:
    return f"{a:04d}-{m:02d}"


def comp_idx(a: int, m: int) -> int:
    return a * 12 + (m - 1)


def comp_de_idx(i: int) -> tuple[int, int]:
    return i // 12, i % 12 + 1


def portaria_rotulo(p: PortariaMunicipio) -> str:
    port = p.portaria
    if not port:
        return "—"
    orgao = port.orgao_emissor or "GM/MS"
    return f"{orgao} nº {port.numero}/{port.ano}"


def _digitos_portaria(s: str | None) -> tuple[str, str | None] | None:
    grupos = re.findall(r"\d+", s or "")
    if not grupos:
        return None
    numero = grupos[0].lstrip("0") or "0"
    ano = next((g for g in grupos[1:] if len(g) == 4), None)
    return numero, ano


def mes_pagamento(t: TransferenciaFns) -> tuple[int, int] | None:
    if t.data_pagamento:
        return t.data_pagamento.year, t.data_pagamento.month
    if t.exercicio and t.mes:
        return t.exercicio, t.mes
    return None


# ── Parcelas da previsão ─────────────────────────────────────────────────────

@dataclass
class Parcela:
    previsao: PortariaMunicipio
    numero: int
    competencia: str          # AAAA-MM
    idx: int                  # índice absoluto do mês
    valor: Decimal


def parcelas(p: PortariaMunicipio) -> list[Parcela]:
    inicio = comp_parse(p.competencia)
    if not inicio:
        return []
    per = (p.periodicidade or "unica").lower()
    passo = PASSO_MESES.get(per, 0)
    qtd = 1 if passo == 0 else max(1, int(p.qtd_parcelas or 1))
    if p.valor_parcela:
        valor = Decimal(str(p.valor_parcela))
    else:
        valor = (Decimal(str(p.valor_municipio or 0)) / qtd).quantize(Decimal("0.01"))
    base = comp_idx(*inicio)
    saida = []
    for n in range(qtd):
        i = base + n * passo
        saida.append(Parcela(p, n + 1, comp_fmt(*comp_de_idx(i)), i, valor))
    return saida


# ── Identidade previsão × transferência ──────────────────────────────────────

def identidade_confere(p: PortariaMunicipio, t: TransferenciaFns) -> bool:
    """Mesma Portaria (quando ambos informam) ou mesmo componente/ação.
    Valor NÃO é critério de identidade."""
    port = p.portaria
    dp = _digitos_portaria(port.numero if port else None)
    dt = _digitos_portaria(t.numero_portaria)
    if dp and dt:
        if dp[0] != dt[0]:
            return False
        if dt[1] and port and str(port.ano) != dt[1]:
            return False
        return True
    comp_p, comp_t = norm(p.componente), norm(t.acao_detalhada)
    if comp_p and comp_t:
        curto, longo = sorted((comp_p, comp_t), key=len)
        return comp_p == comp_t or (len(curto) >= 12 and curto in longo)
    acao_p, acao_t = norm(p.acao), norm(t.acao)
    if acao_p and acao_p == acao_t:
        return not p.grupo or norm(p.grupo) == norm(t.grupo)
    return False


def na_janela(parcela: Parcela, t: TransferenciaFns) -> bool:
    mp = mes_pagamento(t)
    if not mp:
        return False
    d = comp_idx(*mp) - parcela.idx
    return 0 <= d <= JANELA_MESES


# ── Carregamento (sempre do município da sessão) ─────────────────────────────

def _filtro_ibge():
    return TransferenciaFns.municipio_ibge.in_([ibge6(), ibge7()])


async def carregar_previsoes(db: AsyncSession, municipio_id: int) -> list[PortariaMunicipio]:
    stmt = (select(PortariaMunicipio)
            .options(selectinload(PortariaMunicipio.portaria))
            .where(PortariaMunicipio.municipio_id == municipio_id)
            .where(PortariaMunicipio.excluido_em.is_(None))
            .where(PortariaMunicipio.competencia.is_not(None)))
    return list((await db.execute(stmt)).scalars().all())


async def carregar_transferencias(db: AsyncSession, anos: set[int]) -> list[TransferenciaFns]:
    if not anos:
        return []
    stmt = (select(TransferenciaFns)
            .where(_filtro_ibge())
            .where(TransferenciaFns.ativo.is_(True))
            .where(TransferenciaFns.exercicio.in_(sorted(anos))))
    return list((await db.execute(stmt)).scalars().all())


def _anos_relevantes(prevs: list[PortariaMunicipio]) -> set[int]:
    anos: set[int] = set()
    for p in prevs:
        for pa in parcelas(p):
            a = comp_de_idx(pa.idx)[0]
            anos.update({a, comp_de_idx(pa.idx + JANELA_MESES)[0]})
    return anos


# ── Conciliação automática (conservadora) ────────────────────────────────────

async def conciliar(db: AsyncSession, municipio_id: int, usuario: str = "sistema") -> dict:
    """Vincula automaticamente só os casos sem ambiguidade. Não altera vínculos
    manuais. Retorna contagens."""
    prevs = await carregar_previsoes(db, municipio_id)
    if not prevs:
        return {"previsoes": 0, "vinculados": 0}
    transfs = await carregar_transferencias(db, _anos_relevantes(prevs))
    por_prev = {p.id: p for p in prevs}

    # parcelas já atendidas (qualquer vínculo existente)
    atendidas = {(t.previsao_id, t.competencia_referencia) for t in transfs if t.previsao_id}
    livres = [t for t in transfs if not t.previsao_id and t.valor_liquido is not None]

    todas = [pa for p in prevs for pa in parcelas(p)]
    candidatos: dict[tuple[int, str], list[TransferenciaFns]] = {}
    for pa in todas:
        chave = (pa.previsao.id, pa.competencia)
        if chave in atendidas:
            continue
        candidatos[chave] = [t for t in livres if identidade_confere(pa.previsao, t) and na_janela(pa, t)]

    vinculados = 0
    mudou = True
    while mudou:
        mudou = False
        disputa: dict[int, int] = {}
        for lista in candidatos.values():
            for t in lista:
                disputa[t.id] = disputa.get(t.id, 0) + 1
        for chave, lista in list(candidatos.items()):
            if len(lista) == 1 and disputa[lista[0].id] == 1:
                t = lista[0]
                t.previsao_id = chave[0]
                t.competencia_referencia = chave[1]
                t.vinculo_tipo = "automatico"
                t.vinculo_por = usuario
                t.vinculo_em = datetime.utcnow()
                vinculados += 1
                del candidatos[chave]
                for outra in candidatos.values():
                    if t in outra:
                        outra.remove(t)
                mudou = True
                break
    await db.commit()
    return {"previsoes": len(por_prev), "vinculados": vinculados}


# ── Painel Previsto × Recebido ───────────────────────────────────────────────

@dataclass
class Filtros:
    exercicio: int
    mes_inicio: int = 1
    mes_fim: int = 12
    grupo: str | None = None
    tipo_incentivo: str | None = None
    busca: str | None = None


def _f(v) -> float:
    return float(Decimal(str(v or 0)).quantize(Decimal("0.01")))


def _situacao(previsto: Decimal, recebido: Decimal, vinculadas: list, sem_valor: bool,
              candidatos: list, futura: bool) -> str:
    if not vinculadas:
        if candidatos:
            return PENDENTE
        return A_VENCER if futura else NAO_RECEBIDO
    if sem_valor:
        return PENDENTE          # coleta incompleta: não confirma pagamento
    if abs(recebido - previsto) <= TOLERANCIA:
        return PAGO
    return PARCIAL if recebido < previsto else PAGO_A_MAIOR


async def painel(db: AsyncSession, municipio_id: int, f: Filtros) -> dict:
    prevs = await carregar_previsoes(db, municipio_id)
    transfs = await carregar_transferencias(db, _anos_relevantes(prevs) | {f.exercicio})
    hoje = date.today()
    idx_hoje = comp_idx(hoje.year, hoje.month)

    vinculadas_por: dict[tuple[int, str], list[TransferenciaFns]] = {}
    for t in transfs:
        if t.previsao_id:
            vinculadas_por.setdefault((t.previsao_id, t.competencia_referencia), []).append(t)
    livres = [t for t in transfs if not t.previsao_id]

    busca = norm(f.busca)
    linhas, sugeridos = [], set()
    for p in prevs:
        pars = parcelas(p)
        pendentes_serie = []
        for pa in pars:
            a, m = comp_de_idx(pa.idx)
            if a != f.exercicio or not (f.mes_inicio <= m <= f.mes_fim):
                continue
            vinc = vinculadas_por.get((p.id, pa.competencia), [])
            cands = [] if vinc else [t for t in livres if identidade_confere(p, t) and na_janela(pa, t)]
            relacionados = vinc or cands
            if f.grupo and norm(f.grupo) not in norm(p.grupo) and not any(
                    norm(f.grupo) in norm(t.grupo) for t in relacionados):
                continue
            if f.tipo_incentivo and not any(t.tipo_incentivo == f.tipo_incentivo for t in relacionados):
                continue
            if busca and busca not in norm(" ".join(filter(None, [
                    portaria_rotulo(p), p.grupo, p.acao, p.componente, p.fundamento]))):
                continue
            com_valor = [t for t in vinc if t.valor_liquido is not None]
            recebido = sum((Decimal(str(t.valor_liquido)) for t in com_valor), Decimal("0"))
            sem_valor = any(t.valor_liquido is None for t in vinc)
            situacao = _situacao(pa.valor, recebido, vinc, sem_valor, cands, pa.idx > idx_hoje)
            datas = sorted({t.data_pagamento.isoformat() for t in vinc if t.data_pagamento})
            fora_do_mes = any((mp := mes_pagamento(t)) and comp_idx(*mp) != pa.idx for t in vinc)
            linha = {
                "previsao_id": p.id, "parcela": pa.numero, "qtd_parcelas": len(pars),
                "competencia": pa.competencia, "portaria": portaria_rotulo(p),
                "grupo": p.grupo, "acao": p.acao, "componente": p.componente,
                "previsto": _f(pa.valor), "recebido": _f(recebido) if vinc else 0.0,
                "diferenca": _f(recebido - pa.valor) if vinc else _f(-pa.valor),
                "datas_credito": datas, "situacao": situacao,
                "vinculo_tipo": vinc[0].vinculo_tipo if vinc else None,
                "transferencias": [
                    {"id": t.id, "valor_liquido": _f(t.valor_liquido) if t.valor_liquido is not None else None,
                     "data_pagamento": t.data_pagamento.isoformat() if t.data_pagamento else None,
                     "numero_ob": t.numero_ob, "vinculo_tipo": t.vinculo_tipo}
                    for t in vinc],
                "candidatos": [
                    {"id": t.id, "valor_liquido": _f(t.valor_liquido) if t.valor_liquido is not None else None,
                     "data_pagamento": t.data_pagamento.isoformat() if t.data_pagamento else None,
                     "componente": t.acao_detalhada, "numero_portaria": t.numero_portaria}
                    for t in cands],
                "sugestao_transferencia_id": None,
                "pago_em_mes_diferente": bool(fora_do_mes),
                "coleta_incompleta": sem_valor,
            }
            linhas.append(linha)
            if situacao == PENDENTE and not vinc:
                pendentes_serie.append((pa, linha, cands))
        # sugestão (só sugestão, exige confirmação manual): pareia em ordem cronológica
        usados: set[int] = set()
        for pa, linha, cands in sorted(pendentes_serie, key=lambda x: x[0].idx):
            ordenados = sorted((t for t in cands if t.id not in usados and t.id not in sugeridos
                                and t.valor_liquido is not None),
                               key=lambda t: comp_idx(*mes_pagamento(t)))
            if ordenados:
                linha["sugestao_transferencia_id"] = ordenados[0].id
                usados.add(ordenados[0].id)
                sugeridos.add(ordenados[0].id)

    linhas.sort(key=lambda l: (l["competencia"], l["portaria"], l["parcela"]))
    previsto = sum(Decimal(str(l["previsto"])) for l in linhas)
    recebido = sum(Decimal(str(l["recebido"])) for l in linhas)
    a_receber = sum(max(Decimal(str(l["previsto"])) - Decimal(str(l["recebido"])), Decimal("0")) for l in linhas)

    cont: dict[str, int] = {}
    for l in linhas:
        cont[l["situacao"]] = cont.get(l["situacao"], 0) + 1

    return {
        "exercicio": f.exercicio,
        "cards": {
            "previsto": _f(previsto), "recebido": _f(recebido), "a_receber": _f(a_receber),
            "pct_recebido": round(float(recebido / previsto * 100), 2) if previsto else None,
        },
        "situacoes": cont,
        "linhas": linhas,
        "alertas": alertas_de(linhas),
        "matriz": matriz_de(linhas),
        "pagamentos_sem_previsao": sum(
            1 for t in livres if t.exercicio == f.exercicio
            and not any(identidade_confere(p, t) for p in prevs)),
        "total_previsoes": len(prevs),
        # classificações já registradas pelo FNS (para preencher a previsão igual à fonte)
        "classificacoes_fns": sorted({
            (t.grupo or "", t.acao or "", t.acao_detalhada or "")
            for t in transfs if t.exercicio == f.exercicio and (t.acao or t.acao_detalhada)}),
        "nota": "Previsão não é receita: os valores recebidos vêm só dos registros do FNS "
                "(sem duplicar e sem somar com o e-Gestor APS).",
    }


def alertas_de(linhas: list[dict]) -> list[dict]:
    def n(sit): return sum(1 for l in linhas if l["situacao"] == sit)
    alertas = []
    if n(NAO_RECEBIDO):
        alertas.append({"tipo": "previsto_nao_identificado", "severidade": "alta",
                        "mensagem": f"⚠ Repasse previsto não identificado no FNS ({n(NAO_RECEBIDO)} competência(s))",
                        "providencia": "Sincronizar com o FNS ou verificar a previsão da Portaria"})
    if n(PARCIAL):
        alertas.append({"tipo": "recebido_inferior", "severidade": "media",
                        "mensagem": f"⚠ Valor recebido inferior ao previsto ({n(PARCIAL)} competência(s))",
                        "providencia": "Conferir descontos e a Portaria correspondente"})
    if n(PENDENTE):
        alertas.append({"tipo": "pagamento_sem_conciliacao", "severidade": "media",
                        "mensagem": f"⚠ Pagamento FNS sem conciliação com previsão ({n(PENDENTE)} competência(s))",
                        "providencia": "Revisar na visão Previsto × Recebido e vincular manualmente"})
    fora = sum(1 for l in linhas if l["pago_em_mes_diferente"])
    if fora:
        alertas.append({"tipo": "pago_em_outro_mes", "severidade": "info",
                        "mensagem": f"ℹ Pagamento realizado em mês diferente da competência de referência ({fora})",
                        "providencia": "Informativo: a competência segue a previsão, não a data do crédito"})
    return alertas


def matriz_de(linhas: list[dict]) -> list[dict]:
    """Grupo/Ação/Componente × mês de competência: previsto, recebido e diferença."""
    mat: dict[tuple, dict] = {}
    for l in linhas:
        k = (l["grupo"] or "", l["acao"] or "", l["componente"] or "")
        linha = mat.setdefault(k, {"grupo": k[0], "acao": k[1], "componente": k[2],
                                   "meses": {m: {"previsto": 0.0, "recebido": 0.0, "diferenca": 0.0}
                                             for m in range(1, 13)}})
        m = int(l["competencia"][5:7])
        cel = linha["meses"][m]
        cel["previsto"] = round(cel["previsto"] + l["previsto"], 2)
        cel["recebido"] = round(cel["recebido"] + l["recebido"], 2)
        cel["diferenca"] = round(cel["recebido"] - cel["previsto"], 2)
    return sorted(mat.values(), key=lambda x: (x["grupo"], x["acao"], x["componente"]))


async def resumo_alertas(db: AsyncSession, municipio_id: int, exercicio: int) -> list[dict]:
    """Alertas da conciliação para o sistema de validações já existente."""
    dados = await painel(db, municipio_id, Filtros(exercicio=exercicio))
    return dados["alertas"] if dados["total_previsoes"] else []
