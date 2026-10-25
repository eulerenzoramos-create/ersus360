"""
Diagnóstico Situacional da Saúde Municipal — regras de negócio (geração, coleta, painel, comparação, alertas).

Tudo filtrado pelo município passado pelo router (sempre o da sessão). Ver models/diagnostico_situacional.py.
"""
from __future__ import annotations

import json
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.alerta import Alerta, SeveridadeAlerta
from models.diagnostico_situacional import DiagAcao, DiagDiagnostico, DiagHistorico, DiagItem
from services import diagnostico_catalogo as cat
from services import diagnostico_fontes as fontes

ROTULO_CLASS = cat.CLASSIFICACOES


# ── Serialização ──────────────────────────────────────────────────────────────

def _iso(v):
    return v.isoformat() if isinstance(v, (date, datetime)) else v


def dict_diagnostico(d: DiagDiagnostico) -> dict:
    return {"id": d.id, "exercicio": d.exercicio, "periodo_tipo": d.periodo_tipo, "periodo": d.periodo,
            "rotulo": cat.rotulo_periodo(d.exercicio, d.periodo_tipo, d.periodo), "situacao": d.situacao,
            "situacao_rotulo": cat.SITUACOES.get(d.situacao, d.situacao),
            "responsavel_tecnico": d.responsavel_tecnico, "objetivo": d.objetivo, "observacoes": d.observacoes,
            "ultima_coleta": _iso(d.ultima_coleta), "criado_por": d.criado_por, "criado_em": _iso(d.criado_em),
            "concluido_por": d.concluido_por, "concluido_em": _iso(d.concluido_em)}


def tipo_dado(i: DiagItem) -> str:
    """Como o relatório rotula o dado: automático, declarado ou validado."""
    if i.validacao == "confirmado":
        return "validado"
    return i.origem


def dict_item(i: DiagItem) -> dict:
    c = cat.POR_CODIGO.get(i.codigo)
    return {"id": i.id, "codigo": i.codigo, "area": i.area, "area_nome": cat.AREAS.get(i.area),
            "titulo": c.titulo if c else i.codigo, "pergunta": c.pergunta if c else None,
            "modo": c.modo if c else None, "modo_rotulo": cat.MODOS.get(c.modo) if c else None,
            "fonte_sugerida": c.fonte_sugerida if c else None,
            "evidencia_esperada": c.evidencia_esperada if c else None,
            "classificacao": i.classificacao, "classificacao_rotulo": ROTULO_CLASS.get(i.classificacao),
            "origem": i.origem, "natureza": i.natureza, "validacao": i.validacao, "tipo_dado": tipo_dado(i),
            "fonte": i.fonte, "competencia": i.competencia, "evidencia": i.evidencia,
            "data_referencia": _iso(i.data_referencia), "justificativa": i.justificativa,
            "detalhes": json.loads(i.detalhes) if i.detalhes else None,
            "prioridade": i.prioridade, "responsavel": i.responsavel, "observacoes": i.observacoes,
            "vazio_assistencial": bool(i.vazio_assistencial), "validado_por": i.validado_por,
            "validado_em": _iso(i.validado_em), "atualizado_por": i.atualizado_por,
            "atualizado_em": _iso(i.atualizado_em)}


def acao_atrasada(a: DiagAcao, hoje: date | None = None) -> bool:
    hoje = hoje or date.today()
    return bool(a.quando and a.quando < hoje and a.status in {"nao_iniciada", "em_andamento"})


def dict_acao(a: DiagAcao, item: DiagItem | None = None) -> dict:
    d = {k: _iso(getattr(a, k)) for k in (
        "id", "diagnostico_id", "item_id", "o_que", "por_que", "onde", "quando", "quem", "como", "quanto",
        "quanto_texto", "produto", "indicador", "evidencia", "prioridade", "status", "criado_por", "criado_em",
        "atualizado_por", "atualizado_em")}
    d["atrasada"] = acao_atrasada(a)
    if item is not None:
        d["item_codigo"] = item.codigo
        d["item_titulo"] = cat.POR_CODIGO[item.codigo].titulo if item.codigo in cat.POR_CODIGO else item.codigo
    return d


# ── Geração e coleta ──────────────────────────────────────────────────────────

def historico(db: AsyncSession, item: DiagItem, evento: str, descricao: str, usuario: str | None) -> None:
    db.add(DiagHistorico(item_id=item.id, municipio_id=item.municipio_id, evento=evento,
                         descricao=descricao[:4000], usuario=usuario))


async def criar(db: AsyncSession, municipio_id: int, exercicio: int, periodo_tipo: str, periodo: int,
                usuario: str, responsavel: str | None = None, objetivo: str | None = None) -> DiagDiagnostico:
    d = DiagDiagnostico(municipio_id=municipio_id, exercicio=exercicio, periodo_tipo=periodo_tipo, periodo=periodo,
                        criado_por=usuario, responsavel_tecnico=responsavel, objetivo=objetivo)
    db.add(d)
    await db.flush()
    for c in cat.ITENS:
        db.add(DiagItem(diagnostico_id=d.id, municipio_id=municipio_id, area=c.area, codigo=c.codigo,
                        classificacao="nao_verificado",
                        origem="automatico" if c.modo == "automatico" else "declarado",
                        justificativa=None if c.modo == "automatico" else
                        f"{cat.MODOS[c.modo]}: aguardando declaração do município com evidência.",
                        atualizado_por=usuario))
    await db.flush()
    return d


async def itens_do(db: AsyncSession, d: DiagDiagnostico) -> list[DiagItem]:
    return list((await db.execute(select(DiagItem).where(
        DiagItem.diagnostico_id == d.id, DiagItem.municipio_id == d.municipio_id)
        .order_by(DiagItem.codigo))).scalars())


async def coletar(db: AsyncSession, d: DiagDiagnostico, ibge7: str, usuario: str) -> dict:
    """Roda os coletores automáticos. Só reescreve item automático ainda não validado nem contestado."""
    ctx = fontes.Contexto(d.municipio_id, ibge7, d.exercicio, d.periodo_tipo, d.periodo)
    resumo = {"atualizados": [], "preservados": [], "nao_verificados": []}
    itens = {i.codigo: i for i in await itens_do(db, d)}
    for codigo in fontes.COLETORES:
        item = itens.get(codigo)
        if item is None:
            continue
        r = await fontes.coletar(db, codigo, ctx)
        if item.origem != "automatico" or item.validacao != "pendente":
            resumo["preservados"].append(codigo)
            historico(db, item, "coleta", f"Nova coleta ({ROTULO_CLASS[r.classificacao]}) não aplicada: item "
                      f"{'declarado' if item.origem != 'automatico' else item.validacao} pelo técnico.", usuario)
            await db.commit()
            continue
        antes = item.classificacao
        item.classificacao, item.fonte, item.competencia = r.classificacao, r.fonte, r.competencia
        item.evidencia, item.justificativa, item.natureza = r.evidencia, r.justificativa, r.natureza
        item.data_referencia = r.data_referencia or date.today()
        item.detalhes = json.dumps(r.detalhes, ensure_ascii=False, default=str) if r.detalhes else None
        item.atualizado_por, item.atualizado_em = usuario, datetime.utcnow()
        historico(db, item, "coleta", f"Coleta automática: {ROTULO_CLASS.get(antes)} → {ROTULO_CLASS[r.classificacao]}. "
                  f"{r.justificativa}", usuario)
        (resumo["nao_verificados"] if r.classificacao == "nao_verificado" else resumo["atualizados"]).append(codigo)
        # grava item a item: a falha de uma fonte (rollback no coletor) não desfaz os itens já coletados
        await db.commit()
    d.ultima_coleta = datetime.utcnow()
    await db.commit()
    return resumo


# ── Painel, comparação e alertas ─────────────────────────────────────────────

def totais(itens: list[DiagItem]) -> dict:
    t = {k: 0 for k in cat.CLASSIFICACOES}
    for i in itens:
        t[i.classificacao] = t.get(i.classificacao, 0) + 1
    return t


_ORD_PRIO = {"alta": 0, "media": 1, "baixa": 2, None: 3}


def problemas(itens: list[DiagItem]) -> list[DiagItem]:
    """Críticos antes de pendências; dentro de cada, prioridade definida pelo técnico."""
    return sorted((i for i in itens if i.classificacao in {"critico", "pendencia"}),
                  key=lambda i: (-cat.GRAVIDADE[i.classificacao], _ORD_PRIO.get(i.prioridade, 3), i.codigo))


async def anterior(db: AsyncSession, d: DiagDiagnostico) -> DiagDiagnostico | None:
    todos = (await db.execute(select(DiagDiagnostico).where(
        DiagDiagnostico.municipio_id == d.municipio_id, DiagDiagnostico.id != d.id))).scalars().all()
    chave = cat.chave_ordem(d.exercicio, d.periodo_tipo, d.periodo)
    antes = [x for x in todos if cat.chave_ordem(x.exercicio, x.periodo_tipo, x.periodo) < chave]
    return max(antes, key=lambda x: cat.chave_ordem(x.exercicio, x.periodo_tipo, x.periodo)) if antes else None


def comparar(itens_atual: list[DiagItem], itens_anterior: list[DiagItem]) -> dict:
    ant = {i.codigo: i for i in itens_anterior}
    pioraram, melhoraram, novos_criticos, mudancas = [], [], [], []
    for i in itens_atual:
        a = ant.get(i.codigo)
        if not a or a.classificacao == i.classificacao:
            continue
        linha = {"codigo": i.codigo, "titulo": cat.POR_CODIGO[i.codigo].titulo if i.codigo in cat.POR_CODIGO else i.codigo,
                 "antes": a.classificacao, "depois": i.classificacao}
        mudancas.append(linha)
        ga, gd = cat.GRAVIDADE.get(a.classificacao), cat.GRAVIDADE.get(i.classificacao)
        if ga is not None and gd is not None:
            (pioraram if gd > ga else melhoraram).append(linha)
        if i.classificacao == "critico":
            novos_criticos.append(linha)
    return {"pioraram": pioraram, "melhoraram": melhoraram, "novos_criticos": novos_criticos, "mudancas": mudancas,
            "totais_anterior": totais(itens_anterior), "totais_atual": totais(itens_atual)}


async def acoes_do(db: AsyncSession, d: DiagDiagnostico) -> list[DiagAcao]:
    return list((await db.execute(select(DiagAcao).where(
        DiagAcao.diagnostico_id == d.id, DiagAcao.municipio_id == d.municipio_id,
        DiagAcao.excluido_em.is_(None)).order_by(DiagAcao.id))).scalars())


def alertas(itens: list[DiagItem], acoes: list[DiagAcao], comp: dict | None) -> list[dict]:
    saida = []
    for linha in (comp or {}).get("novos_criticos", []):
        saida.append({"severidade": "critico", "tipo": "novo_critico",
                      "texto": f"{linha['codigo']} {linha['titulo']}: passou a Crítico "
                               f"(antes {ROTULO_CLASS.get(linha['antes'])})."})
    for linha in (comp or {}).get("pioraram", []):
        if linha["depois"] != "critico":
            saida.append({"severidade": "atencao", "tipo": "piora",
                          "texto": f"{linha['codigo']} {linha['titulo']}: piorou de {ROTULO_CLASS.get(linha['antes'])} "
                                   f"para {ROTULO_CLASS.get(linha['depois'])}."})
    for i in itens:
        if i.classificacao == "critico" and i.validacao == "pendente":
            saida.append({"severidade": "atencao", "tipo": "critico_sem_validacao",
                          "texto": f"{i.codigo} {cat.POR_CODIGO[i.codigo].titulo}: crítico aguardando validação técnica."})
    for a in acoes:
        if acao_atrasada(a):
            saida.append({"severidade": "atencao", "tipo": "acao_atrasada",
                          "texto": f"Ação 5W2H \"{a.o_que[:80]}\" com prazo vencido em {a.quando:%d/%m/%Y}."})
    return saida


async def painel(db: AsyncSession, d: DiagDiagnostico) -> dict:
    itens = await itens_do(db, d)
    ant = await anterior(db, d)
    comp = comparar(itens, await itens_do(db, ant)) if ant else None
    acoes = await acoes_do(db, d)
    por_area = []
    for area, nome in cat.AREAS.items():
        da = [i for i in itens if i.area == area]
        por_area.append({"area": area, "nome": nome, "totais": totais(da),
                         "modos": {m: sum(1 for i in da if cat.POR_CODIGO[i.codigo].modo == m) for m in cat.MODOS}})
    return {
        "diagnostico": dict_diagnostico(d),
        "totais": totais(itens),
        "total_itens": len(itens),
        "por_tipo_dado": {t: sum(1 for i in itens if tipo_dado(i) == t) for t in ("automatico", "declarado", "validado")},
        "por_area": por_area,
        "problemas": [dict_item(i) for i in problemas(itens)][:15],
        "prioridades": [dict_item(i) for i in problemas(itens) if i.prioridade == "alta"],
        "anterior": dict_diagnostico(ant) if ant else None,
        "evolucao": comp,
        "alertas": alertas(itens, acoes, comp),
        "acoes": {"total": len(acoes), "atrasadas": sum(1 for a in acoes if acao_atrasada(a)),
                  "concluidas": sum(1 for a in acoes if a.status == "concluida")},
        "nota": "Ausência de dado = Não verificado (nunca irregularidade). Dados automáticos vêm das fontes oficiais "
                "integradas; dados declarados e validações são registrados pelos técnicos do município.",
    }


async def registrar_alertas_centrais(db: AsyncSession, d: DiagDiagnostico, dados_painel: dict) -> int:
    """Novos críticos vão também para a central de alertas (módulo "Diagnóstico"), sem duplicar."""
    novos = 0
    for a in dados_painel["alertas"]:
        if a["tipo"] != "novo_critico":
            continue
        existe = (await db.execute(select(Alerta.id).where(
            Alerta.municipio_id == d.municipio_id, Alerta.modulo == "Diagnóstico", Alerta.descricao == a["texto"],
            Alerta.resolvido.is_(False)))).first()
        if not existe:
            db.add(Alerta(municipio_id=d.municipio_id, severidade=SeveridadeAlerta.CRITICO, modulo="Diagnóstico",
                          titulo=f"Diagnóstico {dados_painel['diagnostico']['rotulo']}: novo item crítico"[:200],
                          descricao=a["texto"]))
            novos += 1
    await db.commit()
    return novos


async def recoletar_abertos(db: AsyncSession, municipio_id: int, ibge7: str, usuario: str = "sistema") -> list[dict]:
    """Rotina diária: atualiza a coleta automática dos diagnósticos do município que não estão concluídos.
    Mesmas regras da coleta manual (item declarado, validado ou contestado não é reescrito)."""
    abertos = (await db.execute(select(DiagDiagnostico).where(
        DiagDiagnostico.municipio_id == municipio_id, DiagDiagnostico.situacao != "concluido"))).scalars().all()
    saida = []
    for d in abertos:
        resumo = await coletar(db, d, ibge7, usuario)
        novos = await registrar_alertas_centrais(db, d, await painel(db, d))
        saida.append({"diagnostico_id": d.id, "rotulo": cat.rotulo_periodo(d.exercicio, d.periodo_tipo, d.periodo),
                      "alertas_novos": novos, **resumo})
    return saida
