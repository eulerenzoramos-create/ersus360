"""
Avaliação quadrimestral OFICIAL por equipe — área logada do SIAPS (captura assistida).

Fonte: a própria tela "Avaliação do Quadrimestre" do SIAPS consulta
  apisiaps.saude.gov.br/componente/indicador-quadrimestre?coMunicipioIbge&nuQuadrimestre&sgEquipe&coTipoIndicador
  (coTipoIndicador 119 = Componente II – Vínculo e Acompanhamento Territorial; 120 = Componente III – Qualidade)
e devolve, por equipe: nota final, classificação, se a equipe é válida/homologada e, por indicador, código
(C1…, B1…, M1…, R1…, CR1…, P1…), peso, conceito (0,25/0,50/0,75/1,00), classificação, resultado, NM, DN e os
valores mês a mês. É o cálculo do Ministério (NT nº 8/2026 e nº 12/2026-DEAPS/SAPS/MS) — o ERSUS360 só guarda
e mostra; nenhuma nota é recalculada aqui.

Cada equipe/quadrimestre/componente guarda versões: se o MS mudar a nota (correções de versão do SIAPS),
nasce uma nova versão e a anterior fica preservada (ativa=False).
"""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from datetime import datetime

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.siaps_publico import SiapsPublicoColeta, SiapsQuadrimestreEquipe

COMPONENTE_POR_CODIGO = {119: "CVAT", 120: "QUALIDADE"}
CLASSES = {"OTIMO": "otimo", "BOM": "bom", "SUFICIENTE": "suficiente", "REGULAR": "regular"}
_CHAVES_IND = {"SG": "codigo", "NOTA": "nota", "PESO": "peso", "CONCEITO": "conceito", "CLASSIFICACAO": "classificacao",
               "SCORE": "score", "NM": "nm", "DN": "dn", "NPS": "nps", "LSSCORE": "mensal_score",
               "LSNM": "mensal_nm", "LSDN": "mensal_dn"}
_DIMENSOES_CVAT = {"101": "Dimensão Cadastro", "102": "Dimensão Acompanhamento", "103": "Satisfação do usuário"}
MAX_ITENS = 2000
ORDEM_SG = {"eSF": 0, "eAP": 1, "eSFR": 2, "eSB": 3, "eMulti": 4, "eCR": 5, "eAPP": 6}


class QuadrimestralInvalido(ValueError):
    pass


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().upper()
    return re.sub(r"\s+", " ", s).strip()


def _classe(v) -> str | None:
    return CLASSES.get(_norm(str(v))) if v else None


def _fmt(v) -> str:
    return "—" if v is None else f"{v:g}"


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _mensal(v, nivel: int = 0) -> dict | None:
    """{"MES1": 3, …} ou, em C7/R6, por boa prática: {"BPA": {"MES1": …}, …}."""
    if not isinstance(v, dict):
        return None
    return {str(k)[:6]: (_mensal(x, 1) if isinstance(x, dict) and nivel == 0 else _num(x))
            for k, x in list(v.items())[:8]}


def indicadores(bruto) -> list[dict]:
    """dsComponenteIndicador do SIAPS → lista enxuta (só códigos, números e classificações)."""
    if isinstance(bruto, str):
        try:
            bruto = json.loads(bruto)
        except ValueError as e:
            raise QuadrimestralInvalido("Componente de indicador ilegível.") from e
    if not isinstance(bruto, dict):
        return []
    saida = []
    for co, d in bruto.items():
        if not str(co).isdigit() or not isinstance(d, dict):
            continue
        item: dict = {"co": int(co)}
        for k, alvo in _CHAVES_IND.items():
            if k not in d:
                continue
            v = d[k]
            if alvo == "codigo":
                item[alvo] = str(v)[:6]
            elif alvo == "classificacao":
                item[alvo] = _classe(v)
            elif alvo.startswith("mensal_"):
                item[alvo] = _mensal(v)
            else:
                item[alvo] = _num(v)
        item.setdefault("codigo", _DIMENSOES_CVAT.get(str(co), str(co)))
        saida.append(item)
    return sorted(saida, key=lambda i: i["codigo"])


def validar(itens) -> list[dict]:
    if not isinstance(itens, list):
        raise QuadrimestralInvalido("Bloco quadrimestral fora do formato.")
    if len(itens) > MAX_ITENS:
        raise QuadrimestralInvalido("Bloco quadrimestral grande demais.")
    saida = []
    for it in itens:
        if not isinstance(it, dict):
            raise QuadrimestralInvalido("Item quadrimestral fora do formato.")
        q = str(it.get("quadrimestre", ""))
        if not re.fullmatch(r"20\d{2}Q[1-3]", q):
            raise QuadrimestralInvalido(f"Quadrimestre inválido: {q!r}")
        comp = COMPONENTE_POR_CODIGO.get(it.get("componente"))
        if not comp:
            raise QuadrimestralInvalido("Componente quadrimestral desconhecido.")
        ine = re.sub(r"\D", "", str(it.get("ine", "")))
        if not ine:
            raise QuadrimestralInvalido("Item quadrimestral sem INE.")
        nota = it.get("nota_final")
        if nota is not None and _num(nota) is None:
            raise QuadrimestralInvalido("Nota final não numérica.")
        saida.append({"quadrimestre": q, "componente": comp, "sg_equipe": str(it.get("sg_equipe", ""))[:10],
                      "ine": ine.zfill(10), "equipe": str(it.get("equipe", ""))[:120], "cnes": str(it.get("cnes", ""))[:10],
                      "ubs": str(it.get("ubs", ""))[:200], "nota_final": nota, "classificacao": _classe(it.get("classificacao")),
                      "equipe_valida": it.get("equipe_valida") == "S", "homologada": it.get("homologada") == "S",
                      "indicadores": indicadores(it.get("indicadores"))})
    return saida


async def gravar(db: AsyncSession, municipio_id: int, itens: list[dict], quando: datetime) -> dict:
    """Grava as versões novas (não faz commit)."""
    atuais = {(r.quadrimestre, r.componente, r.ine): r for r in (await db.execute(
        select(SiapsQuadrimestreEquipe).where(SiapsQuadrimestreEquipe.municipio_id == municipio_id,
                                              SiapsQuadrimestreEquipe.ativa.is_(True)))).scalars()}
    novos, revisados, iguais = 0, [], 0
    for it in itens:
        h = hashlib.sha256(json.dumps(it, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        chave = (it["quadrimestre"], it["componente"], it["ine"])
        atual = atuais.get(chave)
        if atual and atual.hash == h:
            iguais += 1
            continue
        versao = 1
        if atual:
            atual.ativa = False
            versao = atual.versao + 1
            revisados.append(f"{it['quadrimestre']} {it['componente']} {it['equipe']}: "
                             f"{_fmt(atual.nota_final)}→{_fmt(it['nota_final'])} ({atual.classificacao}→{it['classificacao']})")
        else:
            novos += 1
        reg = SiapsQuadrimestreEquipe(municipio_id=municipio_id, versao=versao, ativa=True, hash=h,
                                      capturado_em=quando, **it)
        db.add(reg)
        atuais[chave] = reg
    await db.flush()
    return {"novos": novos, "revisados": revisados, "sem_mudanca": iguais}


async def _publicados(db: AsyncSession, municipio_id: int) -> set[str]:
    return {c for (c,) in (await db.execute(
        select(SiapsPublicoColeta.chave).where(SiapsPublicoColeta.municipio_id == municipio_id,
                                               SiapsPublicoColeta.recurso == "quadrimestre").distinct())).all()}


async def _ativos(db: AsyncSession, municipio_id: int) -> list[SiapsQuadrimestreEquipe]:
    return list((await db.execute(select(SiapsQuadrimestreEquipe)
                                  .where(SiapsQuadrimestreEquipe.municipio_id == municipio_id,
                                         SiapsQuadrimestreEquipe.ativa.is_(True)))).scalars())


async def por_equipe(db: AsyncSession, municipio_id: int, quadrimestre: str | None = None) -> dict:
    regs = await _ativos(db, municipio_id)
    quads = sorted({r.quadrimestre for r in regs}, reverse=True)
    if not quads:
        return {"situacao_dado": "nao_disponivel", "quadrimestres": [], "grupos": []}
    q = quadrimestre if quadrimestre in quads else quads[0]
    publicados = await _publicados(db, municipio_id)
    grupos: dict[tuple, list] = {}
    for r in regs:
        if r.quadrimestre == q:
            grupos.setdefault((r.componente, r.sg_equipe), []).append(r)
    saida = []
    for (comp, sg), rs in sorted(grupos.items(), key=lambda x: (x[0][0] != "CVAT", ORDEM_SG.get(x[0][1], 9))):
        rs = sorted(rs, key=lambda r: (not r.equipe_valida, -(r.nota_final or 0)))
        saida.append({
            "componente": comp, "sg_equipe": sg,
            "contagem_validas": {c: sum(1 for r in rs if r.classificacao == c and r.equipe_valida) for c in CLASSES.values()},
            "equipes": [{"ine": r.ine, "equipe": r.equipe, "ubs": r.ubs, "cnes": r.cnes, "nota_final": r.nota_final,
                         "classificacao": r.classificacao, "equipe_valida": r.equipe_valida, "homologada": r.homologada,
                         "indicadores": r.indicadores, "versao": r.versao, "capturado_em": r.capturado_em.isoformat()}
                        for r in rs]})
    publicado = q in publicados
    return {"situacao_dado": "oficial", "quadrimestre": q, "quadrimestres": quads,
            "situacao": "publicado" if publicado else "preliminar",
            "nota_situacao": ("Avaliação quadrimestral publicada pelo Ministério da Saúde (área pública do SIAPS)."
                              if publicado else
                              "Este quadrimestre ainda não foi publicado na área pública do SIAPS: resultado preliminar "
                              "da área logada, pode mudar até a publicação."),
            "grupos": saida}


async def conferencia(db: AsyncSession, municipio_id: int) -> dict:
    """Confere as contagens Ótimo/Bom/Suficiente/Regular publicadas na área pública (por tipo de equipe) com as
    equipes VÁLIDAS capturadas da área logada. Só diz 'confere' quando as duas fontes existem e batem."""
    publicos = (await db.execute(select(SiapsPublicoColeta)
                                 .where(SiapsPublicoColeta.municipio_id == municipio_id,
                                        SiapsPublicoColeta.recurso == "quadrimestre")
                                 .order_by(SiapsPublicoColeta.chave, desc(SiapsPublicoColeta.versao)))).scalars().all()
    ultimo: dict[str, SiapsPublicoColeta] = {}
    for c in publicos:
        ultimo.setdefault(c.chave, c)
    capturado: dict[tuple, dict] = {}        # só equipes válidas
    todas: dict[tuple, dict] = {}            # válidas + homologadas não válidas
    nao_validas: dict[tuple, list] = {}
    for r in await _ativos(db, municipio_id):
        k = (r.quadrimestre, r.componente, r.sg_equipe)
        alvo = [todas] + ([capturado] if r.equipe_valida else [])
        for d in alvo:
            cont = d.setdefault(k, {c: 0 for c in CLASSES.values()})
            if r.classificacao in cont:
                cont[r.classificacao] += 1
        if not r.equipe_valida:
            capturado.setdefault(k, {c: 0 for c in CLASSES.values()})
            nao_validas.setdefault(k, []).append(f"{r.equipe} ({r.classificacao or '—'})")
    publico: dict[tuple, dict] = {}
    for q, col in ultimo.items():
        for i in (col.payload or {}).get("classificacaoFinalComponente", []):
            publico[(q, i.get("tipoOrigem"), i.get("sgEquipe"))] = {
                "otimo": i.get("qtdClassificacaoOtimo", 0), "bom": i.get("qtdClassificacaoBom", 0),
                "suficiente": i.get("qtdClassificacaoSuficiente", 0), "regular": i.get("qtdClassificacaoRegular", 0)}
    itens = []
    for chave in sorted(set(publico) | set(capturado), key=lambda k: (k[0], k[1] or "", ORDEM_SG.get(k[2], 9)), reverse=True):
        pub, cap = publico.get(chave), capturado.get(chave)
        nota = None
        if pub is None or cap is None:
            situacao = "sem_comparacao"
        elif pub == cap:
            situacao = "confere"
        elif pub == todas.get(chave):
            # a área pública contou também equipe(s) homologada(s) não válida(s) para o componente
            situacao = "confere"
            nota = "Área pública inclui equipe(s) não válida(s): " + ", ".join(nao_validas.get(chave, []))
        else:
            situacao = "diverge"
        itens.append({"quadrimestre": chave[0], "componente": chave[1], "sg_equipe": chave[2],
                      "publico": pub, "capturado": cap, "situacao": situacao, "nota": nota,
                      "nao_validas": nao_validas.get(chave, [])})
    integridade = [p for r in await _ativos(db, municipio_id) for p in problemas_integridade(r)]
    return {"itens": itens, "integridade": integridade,
            "resumo": {**{s: sum(1 for i in itens if i["situacao"] == s) for s in ("confere", "diverge", "sem_comparacao")},
                       "equipes_conferidas": len(await _ativos(db, municipio_id)), "problemas_integridade": len(integridade)},
            "regra": "Compara as contagens Ótimo/Bom/Suficiente/Regular publicadas na área pública do SIAPS com as "
                     "equipes da área logada (válidas; se a área pública também contou equipes homologadas não "
                     "válidas, isso é indicado). 'Sem comparação' quando falta uma das fontes."}


# ── Conferência de integridade contra as Notas Técnicas nº 8/2026 e nº 12/2026-DEAPS/SAPS/MS ──────────
# Não substitui o resultado do MS: só aponta quando o publicado não fecha com a regra publicada.
PESOS_NT = {
    "C1": 1, "C2": 2, "C3": 2, "C4": 1, "C5": 1, "C6": 1, "C7": 2,            # NT 8/2026, Quadro 2 (eSF/eAP)
    "B1": 2, "B2": 2, "B3": 2, "B4": 1, "B5": 2, "B6": 1,                      # NT 8/2026, Quadro 3 (eSB)
    "M1": 6, "M2": 4,                                                           # NT 8/2026, Quadro 4 (eMulti)
    "R1": 1, "R2": 2, "R3": 2, "R4": 1.5, "R5": 1.5, "R6": 2,                  # NT 12/2026, Quadro 3 (eSFR)
    "CR1": 2, "CR2": 2, "CR3": 3, "CR4": 3,                                    # NT 12/2026, Quadro 4 (eCR)
    "P1": 1, "P2": 1, "P3": 1, "P4": 3, "P5": 3, "P6": 1,                      # NT 12/2026, Quadro 5 (eAPP)
}
CONCEITO_NT = {"regular": 0.25, "suficiente": 0.5, "bom": 0.75, "otimo": 1.0}


def faixa_componente_iii(nota: float) -> str:
    """NT 8/2026 Quadro 6 e NT 12/2026 Quadro 6."""
    return "otimo" if nota > 7.5 else "bom" if nota >= 5 else "suficiente" if nota > 2.5 else "regular"


def faixa_componente_ii(nota: float) -> str:
    """NT 8/2026 Quadro 5."""
    return "otimo" if nota > 8.5 else "bom" if nota >= 7 else "suficiente" if nota >= 5 else "regular"


def problemas_integridade(r) -> list[dict]:
    out = []

    def p(texto):
        out.append({"quadrimestre": r.quadrimestre, "componente": r.componente, "sg_equipe": r.sg_equipe,
                    "ine": r.ine, "equipe": r.equipe, "problema": texto})

    if r.nota_final is not None and r.classificacao:
        esperado = (faixa_componente_iii if r.componente == "QUALIDADE" else faixa_componente_ii)(r.nota_final)
        if esperado != r.classificacao:
            p(f"Nota final {r.nota_final} publicada como {r.classificacao}, mas a faixa da Nota Técnica é {esperado}.")
    if r.componente != "QUALIDADE":
        return out
    inds = [i for i in (r.indicadores or []) if i.get("peso") is not None]
    if not inds:
        return out
    soma_peso = sum(i["peso"] for i in inds)
    if abs(soma_peso - 10) > 1e-6:
        p(f"Soma dos pesos = {soma_peso:g} (a Nota Técnica prevê 10).")
    soma_nota = sum(i.get("nota") or 0 for i in inds)
    if r.nota_final is not None and abs(soma_nota - r.nota_final) > 0.011:
        p(f"Soma das notas dos indicadores = {soma_nota:g}, nota final publicada = {r.nota_final:g}.")
    for i in inds:
        cod = i.get("codigo")
        if cod in PESOS_NT and abs(PESOS_NT[cod] - i["peso"]) > 1e-6:
            p(f"{cod}: peso {i['peso']:g} diferente do previsto na Nota Técnica ({PESOS_NT[cod]:g}).")
        conc = CONCEITO_NT.get(i.get("classificacao"))
        if conc is not None and i.get("conceito") is not None and abs(conc - i["conceito"]) > 1e-6:
            p(f"{cod}: conceito {i['conceito']:g} não corresponde à classificação {i['classificacao']} ({conc:g}).")
        if i.get("conceito") is not None and i.get("nota") is not None and abs(i["conceito"] * i["peso"] - i["nota"]) > 0.011:
            p(f"{cod}: nota {i['nota']:g} ≠ conceito {i['conceito']:g} × peso {i['peso']:g}.")
    return out


async def homologadas_e_validas(db: AsyncSession, municipio_id: int) -> dict | None:
    """Equipes homologadas e válidas por modalidade no quadrimestre mais recente capturado (Componente III,
    que cobre todas as modalidades). None quando não há captura."""
    regs = [r for r in await _ativos(db, municipio_id) if r.componente == "QUALIDADE"]
    if not regs:
        return None
    q = max(r.quadrimestre for r in regs)
    doq = [r for r in regs if r.quadrimestre == q]
    sgs = sorted({r.sg_equipe for r in doq}, key=lambda s: ORDEM_SG.get(s, 9))
    return {"quadrimestre": q,
            "homologadas": {s: sum(1 for r in doq if r.sg_equipe == s and r.homologada) for s in sgs},
            "validas": {s: sum(1 for r in doq if r.sg_equipe == s and r.equipe_valida) for s in sgs}}
