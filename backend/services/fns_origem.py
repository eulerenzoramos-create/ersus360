"""
Origem dos recursos FNS: Ministério da Saúde × Emendas Parlamentares.

Fonte: detalhamento oficial de cada pagamento (consultafns detalhe-pagamento),
que já é buscado na sincronização para gravar a "Comp./Parcela".

  - emenda     → o FNS marca o programa como "EMENDA - …" (ex. EMENDA - INCREMENTO
                 TEMPORÁRIO AO CUSTEIO DOS SERVIÇOS DE ATENÇÃO PRIMÁRIA EM SAÚDE).
  - proposta   → pagamento vinculado a nº de proposta, sem a marca de emenda: a
                 origem precisa ser confirmada pela Secretaria.
  - ministerio → repasse regular (sem proposta).

O FNS não informa o TIPO da emenda. Ele vem da classificação feita pela
Secretaria (fns_propostas_origem) ou, na falta dela, da proposta cadastrada no
InvestSUS com o mesmo número. Sem nenhuma das duas: "emenda não classificada".
Nada aqui é somado aos totais do Controle Financeiro.
"""
from __future__ import annotations

import re
import unicodedata
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.fns_origem import FnsPagamentoDetalhe, FnsPropostaOrigem
from models.investsus import PropostaInvestSUS
from tenancy.contexto import ibge6, ibge7

TIPOS_CLASSIFICACAO = {
    "individual": "Emenda individual",
    "bancada": "Emenda de bancada",
    "comissao": "Emenda de comissão",
    "programa_ms": "Programa do Ministério (não é emenda)",
}
CATEGORIAS = ["ministerio", "individual", "bancada", "comissao",
              "emenda_nao_classificada", "proposta_nao_identificada"]
ROTULOS = {
    "ministerio": "Ministério da Saúde (regular)",
    "individual": "Emenda individual",
    "bancada": "Emenda de bancada",
    "comissao": "Emenda de comissão",
    "emenda_nao_classificada": "Emenda — tipo a classificar",
    "proposta_nao_identificada": "Proposta — origem a confirmar",
}

_GRUPOS = {
    "ATENCAO PRIMARIA": "Atenção Primária",
    "ATENCAO DE MEDIA E ALTA COMPLEXIDADE AMBULATORIAL E HOSPITALAR": "MAC — Média e Alta Complexidade",
    "ATENCAO ESPECIALIZADA": "Atenção Especializada",
    "ASSISTENCIA FARMACEUTICA": "Assistência Farmacêutica",
    "VIGILANCIA EM SAUDE": "Vigilância em Saúde",
    "GESTAO DO SUS": "Gestão do SUS",
}


def _norm(s: str | None) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9]+", " ", s.upper()).strip()


def grupo_do_item(item: dict) -> str:
    nome = item.get("nomeComponente") or ""
    return _GRUPOS.get(_norm(nome), nome.strip().title() or "Não classificado")


def componente_do_item(item: dict) -> str:
    return (((item.get("id") or {}).get("programaFundo") or {}).get("descricao") or "").strip()


def proposta_do_item(item: dict) -> str | None:
    proj = (((item.get("id") or {}).get("processoEntidadePrograma") or {}).get("projeto") or {})
    n = re.sub(r"\D", "", str(proj.get("numeroSubprojeto") or item.get("numeroProposta") or ""))
    return n or None


def origem_do_item(item: dict) -> str:
    if _norm(componente_do_item(item)).startswith("EMENDA"):
        return "emenda"
    return "proposta" if proposta_do_item(item) else "ministerio"


def _dec(v) -> Decimal | None:
    try:
        return Decimal(str(v)).quantize(Decimal("0.01")) if v is not None else None
    except Exception:  # noqa: BLE001
        return None


async def gravar_detalhes(db: AsyncSession, exercicio: int, mes: int, itens: list[dict]) -> int:
    """Substitui o espelho do mês pelo detalhamento recém-buscado (idempotente)."""
    await db.execute(delete(FnsPagamentoDetalhe)
                     .where(FnsPagamentoDetalhe.municipio_ibge == ibge6())
                     .where(FnsPagamentoDetalhe.exercicio == exercicio)
                     .where(FnsPagamentoDetalhe.mes == mes))
    vistos: set[str] = set()
    for i, it in enumerate(itens):
        ob = str(it.get("numeroDocumentoSiafi") or "")
        comp, prop = componente_do_item(it), proposta_do_item(it)
        chave = f"{ibge6()}|{exercicio}|{mes}|{ob}|{prop or ''}|{_norm(comp)[:60]}|{it.get('valorLiquido')}"
        if chave in vistos:                    # mesmo pagamento repetido na paginação
            chave = f"{chave}|{i}"
        vistos.add(chave)
        db.add(FnsPagamentoDetalhe(
            chave=chave[:200], municipio_ibge=ibge6(), exercicio=exercicio, mes=mes,
            grupo=grupo_do_item(it), componente=comp[:500] or None, numero_ob=ob or None,
            numero_portaria=str(it.get("nuPortaria") or "") or None, numero_proposta=prop,
            parcela_fns=(it.get("competencia") or "")[:40] or None,
            valor_liquido=_dec(it.get("valorLiquido")), origem=origem_do_item(it),
            data_ob=(it.get("dataCriacaoSiafi") or "")[:10] or None))
    return len(itens)


async def classificacoes(db: AsyncSession, municipio_id: int, numeros: set[str]) -> dict[str, dict]:
    """Classificação da Secretaria; na falta dela, o InvestSUS (mesmo nº de proposta)."""
    if not numeros:
        return {}
    saida: dict[str, dict] = {}
    for p in (await db.execute(select(PropostaInvestSUS).options(selectinload(PropostaInvestSUS.parlamentar))
                               .where(PropostaInvestSUS.municipio_id == municipio_id))).scalars():
        n = re.sub(r"\D", "", p.numero_proposta or "")
        tipo = getattr(p.tipo_emenda, "value", p.tipo_emenda)
        if n in numeros and tipo in ("individual", "bancada", "comissao"):
            saida[n] = {"tipo": tipo, "parlamentar": p.parlamentar.nome if p.parlamentar else None,
                        "numero_emenda": p.numero_emenda, "fonte": "InvestSUS", "observacao": None,
                        "classificado_por": None}
    for c in (await db.execute(select(FnsPropostaOrigem)
                               .where(FnsPropostaOrigem.municipio_id == municipio_id)
                               .where(FnsPropostaOrigem.numero_proposta.in_(sorted(numeros))))).scalars():
        saida[c.numero_proposta] = {"tipo": c.tipo, "parlamentar": c.parlamentar, "numero_emenda": c.numero_emenda,
                                    "fonte": "Secretaria", "observacao": c.observacao,
                                    "classificado_por": c.classificado_por}
    return saida


def categoria(origem: str, classif: dict | None) -> str:
    tipo = (classif or {}).get("tipo")
    if tipo == "programa_ms":
        return "ministerio"
    if tipo in ("individual", "bancada", "comissao"):
        return tipo
    if origem == "emenda":
        return "emenda_nao_classificada"
    if origem == "proposta":
        return "proposta_nao_identificada"
    return "ministerio"


def _f(v: Decimal) -> float:
    return float(v.quantize(Decimal("0.01")))


async def painel(db: AsyncSession, municipio_id: int, exercicio: int, mes_inicio: int = 1,
                 mes_fim: int = 12) -> dict:
    dets = list((await db.execute(
        select(FnsPagamentoDetalhe)
        .where(FnsPagamentoDetalhe.municipio_ibge.in_([ibge6(), ibge7()]))
        .where(FnsPagamentoDetalhe.exercicio == exercicio)
        .where(FnsPagamentoDetalhe.mes >= mes_inicio).where(FnsPagamentoDetalhe.mes <= mes_fim)
    )).scalars().all())
    classif = await classificacoes(db, municipio_id, {d.numero_proposta for d in dets if d.numero_proposta})

    vazio = lambda: {c: Decimal("0") for c in CATEGORIAS}  # noqa: E731
    meses: dict[int, dict[str, dict[str, Decimal]]] = {}
    totais_grupo: dict[str, dict[str, Decimal]] = {}
    propostas: dict[str, dict] = {}
    for d in dets:
        v = d.valor_liquido or Decimal("0")
        cat = categoria(d.origem, classif.get(d.numero_proposta or ""))
        g = d.grupo or "Não classificado"
        meses.setdefault(d.mes, {}).setdefault(g, vazio())[cat] += v
        totais_grupo.setdefault(g, vazio())[cat] += v
        if d.numero_proposta:
            pr = propostas.setdefault(d.numero_proposta, {
                "numero_proposta": d.numero_proposta, "origem_fns": d.origem, "grupo": g,
                "componente": d.componente, "portarias": set(), "valor": Decimal("0"), "pagamentos": [],
                "classificacao": classif.get(d.numero_proposta)})
            pr["valor"] += v
            if d.numero_portaria:
                pr["portarias"].add(d.numero_portaria)
            pr["pagamentos"].append({"mes": d.mes, "numero_ob": d.numero_ob, "data_ob": d.data_ob,
                                     "valor": _f(v), "parcela_fns": d.parcela_fns})

    def serial(cats: dict[str, Decimal]) -> dict:
        total = sum(cats.values(), Decimal("0"))
        emendas = sum((cats[c] for c in ("individual", "bancada", "comissao", "emenda_nao_classificada")), Decimal("0"))
        return {**{c: _f(cats[c]) for c in CATEGORIAS}, "total": _f(total), "emendas": _f(emendas),
                "pct_emendas": round(float(emendas / total * 100), 1) if total else 0.0}

    geral = vazio()
    for cats in totais_grupo.values():
        for c in CATEGORIAS:
            geral[c] += cats[c]
    return {
        "exercicio": exercicio,
        "categorias": [{"chave": c, "rotulo": ROTULOS[c]} for c in CATEGORIAS],
        "tipos_classificacao": [{"chave": k, "rotulo": v} for k, v in TIPOS_CLASSIFICACAO.items()],
        "meses": {m: {g: serial(c) for g, c in gs.items()} for m, gs in sorted(meses.items())},
        "grupos": {g: serial(c) for g, c in sorted(totais_grupo.items())},
        "geral": serial(geral),
        "propostas": sorted(({**p, "portarias": sorted(p["portarias"]), "valor": _f(p["valor"]),
                              "categoria": categoria(p["origem_fns"], p["classificacao"])}
                             for p in propostas.values()), key=lambda p: (-p["valor"], p["numero_proposta"])),
        "meses_com_detalhe": sorted(meses),
        "nota": "Composição pelo detalhamento oficial de cada pagamento do FNS. O FNS identifica a emenda e o "
                "nº da proposta, mas não o tipo (individual, bancada ou comissão): o tipo vem da classificação "
                "da Secretaria ou do InvestSUS.",
    }
