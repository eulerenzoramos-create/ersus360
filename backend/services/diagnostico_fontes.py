"""
Coleta automática do Diagnóstico Situacional a partir das fontes oficiais JÁ integradas ao ERSUS360.

Regras (determinação do usuário — nunca inventar ou presumir dado):
  • Sem dado da fonte para o município/período → "nao_verificado", nunca irregularidade.
  • Classificação só sai de valor publicado pela fonte; nenhuma nota é recalculada.
  • "critico" só com regra explícita: aplicação < mínimo legal no SIOPS, suspensão publicada pelo
    e-Gestor, composição mínima incompleta no CNES (o próprio CNES/MS trata como causa de suspensão).
  • Cada resultado traz fonte, competência do dado, evidência e justificativa; "natureza" separa o achado
    comprovado (valor oficial) da hipótese (ex.: repasse não identificado pode ser coleta incompleta).

As regras (`regra_*`) são funções puras, testadas sem banco nem rede; os coletores (`coletar_*`) só
buscam o dado do município da sessão e chamam a regra.
"""
from __future__ import annotations

import json
import logging
from dataclasses import asdict, dataclass, field
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.diagnostico_catalogo import meses_do_periodo, rotulo_periodo

logger = logging.getLogger(__name__)


@dataclass
class Contexto:
    municipio_id: int
    ibge7: str
    exercicio: int
    periodo_tipo: str
    periodo: int

    @property
    def meses(self) -> tuple[int, int]:
        return meses_do_periodo(self.periodo_tipo, self.periodo)

    @property
    def competencias(self) -> list[str]:
        """Competências AAAA-MM do período."""
        ini, fim = self.meses
        return [f"{self.exercicio}-{m:02d}" for m in range(ini, fim + 1)]

    @property
    def fim(self) -> str:
        """Último dia do período (AAAA-MM-DD, comparação textual)."""
        return f"{self.exercicio}-{self.meses[1]:02d}-31"

    @property
    def rotulo(self) -> str:
        return rotulo_periodo(self.exercicio, self.periodo_tipo, self.periodo)


@dataclass
class Resultado:
    classificacao: str
    fonte: str
    justificativa: str
    competencia: str | None = None
    evidencia: str | None = None
    natureza: str | None = None           # comprovado | hipotese (None quando não verificado)
    data_referencia: date | None = None
    detalhes: dict = field(default_factory=dict)

    def como_dict(self) -> dict:
        return asdict(self)


def nao_verificado(fonte: str, motivo: str) -> Resultado:
    return Resultado("nao_verificado", fonte, motivo)


def _data(v) -> date | None:
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    try:
        return date.fromisoformat(str(v)[:10])
    except (TypeError, ValueError):
        return None


# ── G01 — SIOPS: aplicação mínima em ASPS ────────────────────────────────────

FONTE_SIOPS = "SIOPS — API de dados abertos do Ministério da Saúde (apidadosabertos.saude.gov.br/siops)"


def regra_siops(dados: dict, exercicio: int) -> Resultado:
    if not dados or dados.get("situacao_dado") != "oficial_validado":
        return nao_verificado(FONTE_SIOPS, f"O SIOPS não retornou dados do município para o exercício {exercicio}.")
    rec = dados.get("receita_impostos") or 0
    pct = dados.get("minimo_constitucional_pct_aplicado") or 0
    meta = dados.get("minimo_constitucional_pct_obrigatorio") or 15.0
    if rec <= 0 or pct <= 0:
        # Sem receita/percentual publicados não há como afirmar descumprimento.
        return nao_verificado(FONTE_SIOPS, f"O SIOPS não publicou receita de impostos e percentual aplicado do exercício {exercicio}.")
    ev = (f"Percentual aplicado em ASPS: {pct:.2f}% (mínimo {meta:.0f}%). Receita de impostos e transferências: "
          f"R$ {rec:,.2f}; gasto próprio em saúde: R$ {dados.get('gasto_proprio_saude') or 0:,.2f}."
          ).replace(",", "X").replace(".", ",").replace("X", ".")
    det = {k: dados.get(k) for k in ("receita_impostos", "gasto_proprio_saude", "gasto_total_saude",
                                     "minimo_constitucional_pct_aplicado", "minimo_constitucional_pct_obrigatorio")}
    if pct >= meta:
        return Resultado("regular", FONTE_SIOPS, f"Aplicação declarada no SIOPS atinge o mínimo legal (LC 141/2012).",
                         f"Exercício {exercicio}", ev, "comprovado", detalhes=det)
    return Resultado("critico", FONTE_SIOPS,
                     f"Aplicação declarada no SIOPS abaixo do mínimo de {meta:.0f}% (LC 141/2012, art. 7º).",
                     f"Exercício {exercicio}", ev, "comprovado", detalhes=det)


async def coletar_siops(db: AsyncSession, ctx: Contexto) -> Resultado:
    from services.siops_service import buscar_apuracao
    return regra_siops(await buscar_apuracao(ctx.exercicio), ctx.exercicio)


# ── G02 — FNS: previsto × recebido ───────────────────────────────────────────

FONTE_FNS = "FNS — transferências fundo a fundo coletadas × previsões das Portarias (ERSUS360)"


def regra_fns(painel: dict, ctx: Contexto) -> Resultado:
    linhas = painel.get("linhas") or []
    if not painel.get("total_previsoes"):
        return nao_verificado(FONTE_FNS, "Nenhuma previsão de repasse (Portaria) cadastrada para o município.")
    if not linhas:
        return nao_verificado(FONTE_FNS, f"Nenhuma parcela prevista em {ctx.rotulo}.")
    sit = painel.get("situacoes") or {}
    nao_rec, parcial, pend = sit.get("NAO_RECEBIDO", 0), sit.get("PARCIAL", 0), sit.get("CONCILIACAO_PENDENTE", 0)
    cards = painel.get("cards") or {}
    ev = (f"{len(linhas)} parcela(s) prevista(s) em {ctx.rotulo}: " +
          ", ".join(f"{k} {v}" for k, v in sorted(sit.items())) +
          f". Previsto R$ {cards.get('previsto', 0):,.2f}; recebido R$ {cards.get('recebido', 0):,.2f}."
          ).replace(",", "X").replace(".", ",").replace("X", ".")
    det = {"situacoes": sit, "cards": cards}
    comp = f"{ctx.competencias[0]} a {ctx.competencias[-1]}"
    if nao_rec or parcial or pend:
        partes = []
        if nao_rec:
            partes.append(f"{nao_rec} parcela(s) prevista(s) não identificada(s) no FNS")
        if parcial:
            partes.append(f"{parcial} recebida(s) com valor inferior ao previsto")
        if pend:
            partes.append(f"{pend} pagamento(s) sem conciliação")
        # A coleta do FNS pode estar incompleta: o achado precisa ser conferido antes de virar problema.
        return Resultado("pendencia", FONTE_FNS, "; ".join(partes) + ". Conferir no FNS antes de validar.",
                         comp, ev, "hipotese", detalhes=det)
    return Resultado("regular", FONTE_FNS, "Todas as parcelas vencidas do período foram identificadas no FNS.",
                     comp, ev, "comprovado", detalhes=det)


async def coletar_fns(db: AsyncSession, ctx: Contexto) -> Resultado:
    from services.previsao_fns import Filtros, painel
    ini, fim = ctx.meses
    return regra_fns(await painel(db, ctx.municipio_id, Filtros(exercicio=ctx.exercicio, mes_inicio=ini, mes_fim=fim)), ctx)


# ── G03 — InvestSUS ──────────────────────────────────────────────────────────

FONTE_INVESTSUS = "InvestSUS — propostas federais do Fundo Municipal de Saúde (ERSUS360)"
_DILIGENCIA = {"em_diligencia", "aguardando_complementacao"}
_PERDA = {"rejeitada", "cancelada"}


def regra_investsus(propostas: list[dict], exercicio: int) -> Resultado:
    if not propostas:
        return nao_verificado(FONTE_INVESTSUS, "Nenhuma proposta federal captada para o município "
                                               "(acesso ao InvestSUS pode não estar configurado).")
    dil = [p for p in propostas if p["situacao"] in _DILIGENCIA]
    perdas = [p for p in propostas if p["situacao"] in _PERDA and p.get("exercicio") == exercicio]
    ev_l = [f"{p['numero']}: {p['situacao_original'] or p['situacao']}" for p in dil + perdas]
    det = {"total": len(propostas), "em_diligencia": [p["numero"] for p in dil],
           "rejeitadas_canceladas": [p["numero"] for p in perdas]}
    if dil or perdas:
        partes = []
        if dil:
            partes.append(f"{len(dil)} proposta(s) em diligência/complementação")
        if perdas:
            partes.append(f"{len(perdas)} proposta(s) do exercício rejeitada(s) ou cancelada(s)")
        return Resultado("pendencia", FONTE_INVESTSUS, "; ".join(partes) + " (situação oficial do InvestSUS).",
                         f"Situação atual (exercício {exercicio})", "; ".join(ev_l[:20]), "comprovado", detalhes=det)
    return Resultado("regular", FONTE_INVESTSUS,
                     f"{len(propostas)} proposta(s) federal(is) sem diligência, rejeição ou cancelamento.",
                     f"Situação atual (exercício {exercicio})", None, "comprovado", detalhes=det)


async def coletar_investsus(db: AsyncSession, ctx: Contexto) -> Resultado:
    from models.investsus import PropostaInvestSUS
    rows = (await db.execute(select(PropostaInvestSUS).where(
        PropostaInvestSUS.municipio_id == ctx.municipio_id,
        PropostaInvestSUS.esfera == "federal"))).scalars().all()
    props = [{"numero": p.numero_proposta, "exercicio": p.exercicio, "situacao_original": p.situacao_original,
              "situacao": getattr(p.situacao_normalizada, "value", p.situacao_normalizada)} for p in rows]
    return regra_investsus(props, ctx.exercicio)


# ── B01 — SIAPS: classificação oficial do quadrimestre ──────────────────────

FONTE_SIAPS = "SIAPS — área pública, Avaliação do Quadrimestre (Ministério da Saúde)"


def escolher_quadrimestre(chaves: list[str], ctx: Contexto) -> str | None:
    """Último quadrimestre publicado que termina dentro do período."""
    ini, fim = ctx.meses
    alvo = {f"{ctx.exercicio}Q{q}" for q in range(1, 4) if ini <= 4 * q <= fim}
    dentro = sorted(c for c in chaves if c in alvo)
    return dentro[-1] if dentro else None


def regra_siaps(quad: dict | None, ctx: Contexto) -> Resultado:
    if not quad:
        return nao_verificado(FONTE_SIAPS, f"Avaliação do quadrimestre correspondente a {ctx.rotulo} não coletada "
                                           "ou ainda não publicada pelo Ministério da Saúde.")
    comps = quad.get("componentes") or []
    if not comps:
        return nao_verificado(FONTE_SIAPS, f"{quad['rotulo']}: a publicação não traz classificação de componentes.")
    linhas = [f"{c['componente']} ({c['tipo_equipe']}): Ótimo {c['otimo']}, Bom {c['bom']}, Suficiente {c['suficiente']}, "
              f"Regular {c['regular']}" for c in comps]
    regulares = [c for c in comps if c["regular"]]
    det = {"quadrimestre": quad["quadrimestre"], "versao": quad.get("versao"), "componentes": comps}
    if regulares:
        just = "; ".join(f"{c['regular']} de {c['total']} equipe(s) {c['tipo_equipe']} em Regular no componente "
                         f"{c['componente']}" for c in regulares)
        return Resultado("pendencia", FONTE_SIAPS, just + " (classificação oficial publicada).",
                         quad["rotulo"], "\n".join(linhas), "comprovado", _data(quad.get("coletado_em")), det)
    return Resultado("regular", FONTE_SIAPS, "Nenhuma equipe classificada como Regular na publicação oficial.",
                     quad["rotulo"], "\n".join(linhas), "comprovado", _data(quad.get("coletado_em")), det)


async def coletar_siaps(db: AsyncSession, ctx: Contexto) -> Resultado:
    from services import siaps_publico as sp
    quads = {c.chave: c for c in await sp._versoes_atuais(db, ctx.municipio_id, "quadrimestre")}
    chave = escolher_quadrimestre(list(quads), ctx)
    return regra_siaps(sp.normalizar_quadrimestre(quads[chave]) if chave else None, ctx)


# ── B02 — e-Gestor: ausência de envio ────────────────────────────────────────

FONTE_AUSENCIA = "e-Gestor APS — relatório público de ausência de envio (SISAB)"


def regra_ausencia(competencia: str | None, ausencias: list[dict], ctx: Contexto) -> Resultado:
    if not competencia:
        return nao_verificado(FONTE_AUSENCIA, f"Nenhuma coleta de ausência de envio nas competências de {ctx.rotulo}.")
    if not ausencias:
        return Resultado("regular", FONTE_AUSENCIA, f"Nenhum registro de ausência de envio na competência {competencia}.",
                         competencia, None, "comprovado")
    por_tipo: dict[str, int] = {}
    for a in ausencias:
        por_tipo[a["tipo_registro"]] = por_tipo.get(a["tipo_registro"], 0) + 1
    graves = [a for a in ausencias if (a.get("qt_consecutivas") or 0) >= 3]
    ev = "\n".join(f"{a['tipo_registro']} {a.get('ine') or a.get('cnes') or ''}: {a['descricao']} "
                   f"({a.get('qt_texto') or a.get('qt_consecutivas') or '-'})" for a in ausencias[:30])
    just = (f"{len(ausencias)} registro(s) de ausência de envio na competência {competencia} (" +
            ", ".join(f"{k}: {v}" for k, v in sorted(por_tipo.items())) + ")")
    if graves:
        just += f"; {len(graves)} com 3 ou mais competências consecutivas"
    return Resultado("pendencia", FONTE_AUSENCIA, just + ".", competencia, ev, "comprovado",
                     detalhes={"por_tipo": por_tipo, "consecutivas_3_ou_mais": len(graves)})


async def coletar_ausencia(db: AsyncSession, ctx: Contexto) -> Resultado:
    from models.egestor_ausencia import EgestorAusencia, EgestorAusenciaColeta
    comps = (await db.execute(select(EgestorAusenciaColeta.competencia).where(
        EgestorAusenciaColeta.municipio_id == ctx.municipio_id,
        EgestorAusenciaColeta.competencia.in_(ctx.competencias)))).scalars().all()
    comp = max(comps) if comps else None
    aus = []
    if comp:
        aus = [{"tipo_registro": a.tipo_registro, "ine": a.ine, "cnes": a.cnes, "descricao": a.descricao,
                "qt_consecutivas": a.qt_consecutivas, "qt_texto": a.qt_texto}
               for a in (await db.execute(select(EgestorAusencia).where(
                   EgestorAusencia.municipio_id == ctx.municipio_id,
                   EgestorAusencia.competencia == comp))).scalars()]
    return regra_ausencia(comp, aus, ctx)


# ── B03 — e-Gestor: situação de pagamento por equipe ────────────────────────

FONTE_PAGAMENTO = "e-Gestor APS — relatório público de pagamento por equipe"


def regra_pagamento(parcela: str | None, equipes: list[dict], ctx: Contexto) -> Resultado:
    if not parcela or not equipes:
        return nao_verificado(FONTE_PAGAMENTO, f"Nenhuma parcela do e-Gestor coletada para {ctx.rotulo}.")
    suspensas = [e for e in equipes if any(p["campo"].startswith("stSuspensao") for p in e["pendencias"])]
    outras = [e for e in equipes if e["pendencias"] and e not in suspensas]
    ev = "\n".join(f"INE {e['ine']}: " + "; ".join(f"{p['rotulo']} = {p['situacao']}" for p in e["pendencias"])
                   for e in suspensas + outras) or None
    comp = f"Parcela {parcela[4:]}/{parcela[:4]}"
    det = {"parcela": parcela, "equipes": len(equipes), "suspensas": len(suspensas), "com_pendencia": len(outras)}
    if suspensas:
        return Resultado("critico", FONTE_PAGAMENTO,
                         f"{len(suspensas)} equipe(s) com suspensão publicada pelo e-Gestor na parcela.",
                         comp, ev, "comprovado", detalhes=det)
    if outras:
        return Resultado("pendencia", FONTE_PAGAMENTO, f"{len(outras)} equipe(s) com pendência de validação na parcela.",
                         comp, ev, "comprovado", detalhes=det)
    return Resultado("regular", FONTE_PAGAMENTO, f"{len(equipes)} equipe(s) sem pendência de pagamento na parcela.",
                     comp, None, "comprovado", detalhes=det)


async def coletar_pagamento(db: AsyncSession, ctx: Contexto) -> Resultado:
    from models.egestor_pagamento import EgestorValidacaoEquipe
    parcelas_periodo = [c.replace("-", "") for c in ctx.competencias]
    parcelas = (await db.execute(select(EgestorValidacaoEquipe.nu_parcela).where(
        EgestorValidacaoEquipe.municipio_id == ctx.municipio_id,
        EgestorValidacaoEquipe.nu_parcela.in_(parcelas_periodo)).distinct())).scalars().all()
    parcela = max(parcelas) if parcelas else None
    equipes = []
    if parcela:
        for v in (await db.execute(select(EgestorValidacaoEquipe).where(
                EgestorValidacaoEquipe.municipio_id == ctx.municipio_id,
                EgestorValidacaoEquipe.nu_parcela == parcela))).scalars():
            equipes.append({"ine": v.ine, "pendencias": json.loads(v.pendencias or "[]")})
    return regra_pagamento(parcela, equipes, ctx)


# ── C01 — CNES: composição mínima das equipes ────────────────────────────────

FONTE_CNES = "CNES — XML-CNES do SISAB importado no ERSUS360"


def regra_cnes(data_arquivo: str | None, analise: dict | None, ctx: Contexto) -> Resultado:
    if not analise:
        return nao_verificado(FONTE_CNES, f"Nenhum XML-CNES importado com data até o fim de {ctx.rotulo}.")
    pend = analise.get("pendencias") or []
    criticas = [p for p in pend if p["severidade"] == "critica"]
    alertas = [p for p in pend if p["severidade"] != "critica"]
    ev = "\n".join(f"[{p['severidade']}] {p['mensagem']}" for p in criticas + alertas) or None
    comp = f"Arquivo CNES de {data_arquivo}" if data_arquivo else "Arquivo CNES"
    det = {"criticas": len(criticas), "alertas": len(alertas)}
    if criticas:
        return Resultado("critico", FONTE_CNES, f"{len(criticas)} equipe(s) com composição mínima incompleta no "
                         "cadastro (pode suspender o repasse da equipe).", comp, ev, "comprovado",
                         _data(data_arquivo), det)
    if alertas:
        return Resultado("pendencia", FONTE_CNES, f"{len(alertas)} alerta(s) de lotação no cadastro.",
                         comp, ev, "comprovado", _data(data_arquivo), det)
    return Resultado("regular", FONTE_CNES, "Equipes ativas com composição mínima lotada no cadastro "
                     "(cadastro não comprova funcionamento — ver item C02).", comp, None, "comprovado",
                     _data(data_arquivo), det)


async def coletar_cnes(db: AsyncSession, ctx: Contexto) -> Resultado:
    from models.cnes_xml import CnesXmlImportacao
    from routers.cnes_xml import _marcacoes
    from services import cnes_xml as cx
    regs = (await db.execute(select(CnesXmlImportacao).where(
        CnesXmlImportacao.municipio_id == ctx.municipio_id).order_by(CnesXmlImportacao.id.desc()))).scalars().all()
    for r in regs:
        data_arq = r.data_arquivo or (r.importado_em.date().isoformat() if r.importado_em else None)
        if data_arq and data_arq <= ctx.fim:
            return regra_cnes(data_arq, cx.analisar(json.loads(r.dados), _marcacoes()), ctx)
    return regra_cnes(None, None, ctx)


# ── E01 — FVS-AM: PQA-VS ─────────────────────────────────────────────────────

FONTE_PQA = "FVS-RCP/AM — painel público do PQA-VS"


def regra_pqa(itens: list[dict], rotulo: str | None, ctx: Contexto) -> Resultado:
    if not ctx.ibge7.startswith("13"):
        return nao_verificado(FONTE_PQA, "A fonte do PQA-VS integrada (FVS-RCP) cobre apenas municípios do Amazonas.")
    avaliados = [i for i in itens if i.get("alcance") in {"SIM", "NÃO"} and i.get("observacao") != "Ausência de casos"]
    if not avaliados:
        return nao_verificado(FONTE_PQA, f"A FVS não publicou indicadores avaliados do PQA-VS para {ctx.exercicio}.")
    abaixo = [i for i in avaliados if i["alcance"] == "NÃO"]
    ev = "\n".join(f"{i['indicador']}: resultado {i.get('resultado')}, meta {i.get('meta')}, alcance {i['alcance']}"
                   for i in avaliados)
    det = {"avaliados": len(avaliados), "abaixo_da_meta": [i["indicador"] for i in abaixo]}
    if abaixo:
        return Resultado("pendencia", FONTE_PQA, f"{len(abaixo)} de {len(avaliados)} indicador(es) avaliado(s) abaixo "
                         "da meta (alcance publicado pela FVS).", rotulo, ev, "comprovado", detalhes=det)
    return Resultado("regular", FONTE_PQA, f"{len(avaliados)} indicador(es) avaliado(s), todos com meta alcançada.",
                     rotulo, ev, "comprovado", detalhes=det)


async def coletar_pqa(db: AsyncSession, ctx: Contexto) -> Resultado:
    from models.vigilancia_fvs import FvsSerie
    from services.fvs_analise import _rotulo_periodo
    if not ctx.ibge7.startswith("13"):
        return regra_pqa([], None, ctx)
    q = select(FvsSerie).where(FvsSerie.fonte == "pqa_vs", FvsSerie.ibge6 == ctx.ibge7[:6],
                               FvsSerie.ano == ctx.exercicio, FvsSerie.indicador.like("IND_%"))
    rows = (await db.execute(q)).scalars().all()
    if ctx.periodo_tipo == "quadrimestre":
        rows = [r for r in rows if r.periodo_tipo != "quadrimestre" or r.periodo == ctx.periodo]
    if not rows:
        return regra_pqa([], None, ctx)
    ult = max((r.periodo_tipo, r.periodo) for r in rows)
    sel = [r for r in rows if (r.periodo_tipo, r.periodo) == ult]
    itens = [{"indicador": r.indicador, "resultado": r.valor, "meta": r.meta, "alcance": r.alcance,
              "observacao": r.texto} for r in sel]
    return regra_pqa(itens, _rotulo_periodo(ctx.exercicio, *ult), ctx)


# ── Registro ─────────────────────────────────────────────────────────────────

COLETORES = {
    "B01": coletar_siaps,
    "B02": coletar_ausencia,
    "B03": coletar_pagamento,
    "C01": coletar_cnes,
    "E01": coletar_pqa,
    "G01": coletar_siops,
    "G02": coletar_fns,
    "G03": coletar_investsus,
}


async def coletar(db: AsyncSession, codigo: str, ctx: Contexto) -> Resultado:
    """Executa o coletor do item. Falha da fonte vira "nao_verificado" com o motivo — nunca irregularidade."""
    try:
        return await COLETORES[codigo](db, ctx)
    except Exception as exc:  # fonte fora do ar, formato inesperado…
        logger.warning("Diagnóstico: coleta %s falhou: %s", codigo, exc)
        await db.rollback()
        return nao_verificado("Coleta automática", f"Falha ao consultar a fonte: {type(exc).__name__}. "
                                                   "Tentar novamente ou declarar com evidência.")
