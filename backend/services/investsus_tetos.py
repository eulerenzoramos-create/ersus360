"""
InvestSUS — tetos municipais de emendas (PAP/MAC) e saldo remanescente.

Fonte única dos tetos: planilhas oficiais publicadas pelo Fundo Nacional de Saúde
(portalfns.saude.gov.br). Nada aqui é estimado: se a planilha não puder ser lida, o
teto fica "não disponível". O consumo do teto vem das propostas já gravadas no
InvestSUS 360 (is_propostas), uma única etapa de valor por proposta.

Regras de 2026 (conferidas no texto das portarias em 28/10/2026):

* Emendas individuais (RP 6) — Portaria GM/MS nº 10.297/2026
  - PAP (art. 16–17): até 100% do somatório dos incentivos repassados em 2025 nas
    ações do PAP e de ACS; +20% para município com IVS > 0,3 (art. 17, par. único).
  - MAC (art. 22–23): SAMU + Teto MAC total da Portaria GM/MS nº 10.146/2026, com
    acréscimos cumulativos (art. 23, I, "d"): produção FAEC, Amazônia Legal +30% e
    IVS > 0,3 com capacidade instalada em MAC +20%.
* Emendas coletivas (RP 7 bancada e RP 8 comissão) — Portaria GM/MS nº 8.283/2025,
  redação da Portaria GM/MS nº 10.352/2026
  - PAP (art. 30, par. único) e MAC (art. 31, § 1º) "limitados, cumulativamente":
    bancada e comissão dividem UM único teto.
  - MAC com os mesmos acréscimos FAEC / Amazônia Legal 30% / IVS 20% (art. 31, § 1º, I–III).
* Os tetos alcançam só o custeio "Incremento Temporário": ação 2E89 (PAP) e 2E90
  (MAC), GND 3. Investimento (estruturação, obras, equipamentos) não consome teto.
* Individuais e coletivas têm metodologias e planilhas distintas (Cartilha de
  Emendas PLOA 2026, p. 17): os dois tetos são independentes.
"""
from __future__ import annotations

import hashlib
import io
import logging
import re
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Iterable

from services import investsus_federal as fed

logger = logging.getLogger(__name__)

EXERCICIO_PADRAO = 2026

SITUACAO_CONFIRMADO = "confirmado"
SITUACAO_PENDENTE = "pendente_validacao"
SITUACAO_NAO_DISPONIVEL = "nao_disponivel"

PORTAL_FNS = "https://portalfns.saude.gov.br"
_PAGINA_INDIVIDUAIS = (f"{PORTAL_FNS}/emendas-individuais-confira-o-cronograma-e-a-portaria-"
                       "gm-ms-no-10-297-de-27-de-fevereiro-de-2026/")
_PAGINA_COLETIVAS = (f"{PORTAL_FNS}/emendas-coletivas-confira-o-cronograma-e-a-portaria-"
                     "gm-ms-no-10-352-de-17-de-marco-de-2026/")


@dataclass(frozen=True)
class FonteTeto:
    categoria: str
    grupo: str           # individual | coletiva
    componente: str      # pap | mac
    rotulo: str
    url_planilha: str
    url_pagina: str
    data_publicacao: date
    documento: str
    regra: str


FONTES: dict[int, dict[str, FonteTeto]] = {
    2026: {
        "individual_pap": FonteTeto(
            "individual_pap", "individual", "pap", "Emendas individuais (RP 6) — PAP",
            f"{PORTAL_FNS}/wp-content/uploads/2026/03/Teto_PAP_PortalFNS.xlsx",
            _PAGINA_INDIVIDUAIS, date(2026, 3, 3),
            "Portaria GM/MS nº 10.297, de 27/02/2026, arts. 16 e 17 — planilha SAPS/CGFAP",
            "Até 100% do somatório dos incentivos repassados em 2025 nas ações do PAP e de "
            "ACS (art. 17); acréscimo de 20% para IVS > 0,3 (art. 17, parágrafo único). A "
            "planilha publica o valor final do limite; o ERSUS360 não reaplica acréscimos.",
        ),
        "individual_mac": FonteTeto(
            "individual_mac", "individual", "mac", "Emendas individuais (RP 6) — MAC",
            f"{PORTAL_FNS}/wp-content/uploads/2026/03/Teto_MAC_PortalFNS.xlsx",
            _PAGINA_INDIVIDUAIS, date(2026, 3, 3),
            "Portaria GM/MS nº 10.297, de 27/02/2026, arts. 22 e 23; Teto MAC da Portaria "
            "GM/MS nº 10.146/2026 — planilha SAES/DRAC/CGOF",
            "SAMU + Teto MAC total (Portaria GM/MS nº 10.146/2026), com acréscimos cumulativos "
            "(art. 23, I, a–d): produção FAEC, Amazônia Legal +30% e IVS > 0,3 com capacidade "
            "instalada em MAC +20%. A planilha publica o valor por CNES (demonstrativo da "
            "produção MAC 01–12/2025) e não discrimina se os acréscimos já estão somados.",
        ),
        "coletiva_pap": FonteTeto(
            "coletiva_pap", "coletiva", "pap", "Emendas coletivas (RP 7 + RP 8) — PAP",
            f"{PORTAL_FNS}/wp-content/uploads/2026/03/SAPS_TETO_COLETIVAS_2026_Portal.xlsx",
            _PAGINA_COLETIVAS, date(2026, 3, 20),
            "Portaria GM/MS nº 8.283/2025, art. 30, parágrafo único (redação da Portaria "
            "GM/MS nº 10.352, de 17/03/2026) — planilha SAPS/CGFAP",
            "Bancada e comissão limitadas, cumulativamente, a até 100% do somatório dos "
            "incentivos repassados em 2025 nas ações do PAP (teto único para RP 7 + RP 8).",
        ),
        "coletiva_mac": FonteTeto(
            "coletiva_mac", "coletiva", "mac", "Emendas coletivas (RP 7 + RP 8) — MAC",
            f"{PORTAL_FNS}/wp-content/uploads/2026/03/Teto_MAC_PortalFNS-3-1.xlsx",
            _PAGINA_COLETIVAS, date(2026, 3, 20),
            "Portaria GM/MS nº 8.283/2025, art. 31, § 1º (redação da Portaria GM/MS nº "
            "10.352, de 17/03/2026) — planilha SAES/DRAC/CGOF",
            "Bancada e comissão limitadas, cumulativamente, a até 100% do Teto MAC do "
            "exercício, com acréscimos FAEC, Amazônia Legal +30% e IVS > 0,3 com capacidade "
            "instalada +20% (art. 31, § 1º, I–III). Teto único para RP 7 + RP 8. A planilha "
            "não discrimina se os acréscimos já estão somados.",
        ),
    },
}

# MAC: a planilha traz o valor-base por CNES sem dizer se os acréscimos do art. 23/31
# já estão somados — o valor publicado é exibido, mas o limite efetivo fica pendente.
_PENDENCIA_ACRESCIMOS_MAC = (
    "Valor publicado pelo FNS confirmado. Pendente de validação: a planilha não informa se os "
    "acréscimos de Amazônia Legal (+30%) e IVS (+20%) já estão incluídos. Conferir o limite "
    "efetivo em Ambiente Parlamentar → Relatórios → Consultar PAP ou MAC, ou no InvestSUS "
    "ao selecionar o componente Incremento MAC."
)


def fontes_do_exercicio(exercicio: int) -> dict[str, FonteTeto]:
    return FONTES.get(exercicio, {})


# ── Leitura das planilhas ─────────────────────────────────────────────────────

class PlanilhaInvalida(ValueError):
    pass


def _num(v: Any) -> float | None:
    if isinstance(v, bool) or v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip()
    if not re.fullmatch(r"-?[\d.,]+", s):
        return None
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _ibge6(v: Any) -> str:
    d = re.sub(r"\D", "", str(v if v is not None else ""))
    return d[:6]


def _cabecalho(linhas: list[tuple]) -> tuple[int, dict[str, int]] | None:
    """Linha de cabeçalho: a primeira (até a 25ª) com uma célula exatamente "IBGE"."""
    for i, linha in enumerate(linhas[:25]):
        nomes = [fed._norm(c) for c in linha]
        if "ibge" not in nomes:
            continue
        col: dict[str, int] = {"ibge": nomes.index("ibge")}
        for j, n in enumerate(nomes):
            if n == "cnes":
                col["cnes"] = j
            elif n == "ivs":
                col["ivs"] = j
            elif n.startswith("ds_estabelecimento") or n.startswith("secretarias municipais") \
                    or n in ("municipio", "municipios"):
                col.setdefault("nome", j)
            if n.startswith("vl ") or n.startswith("valor"):
                col["valor"] = j  # a última coluna de valor da linha
        if "valor" in col:
            return i, col
    return None


def _linhas_do_municipio(planilha: bytes, ibge6: str) -> list[dict]:
    try:
        import openpyxl
        wb = openpyxl.load_workbook(io.BytesIO(planilha), read_only=True, data_only=True)
    except Exception as exc:  # noqa: BLE001 — arquivo corrompido ou não-xlsx
        raise PlanilhaInvalida(f"arquivo não é uma planilha xlsx legível ({exc.__class__.__name__})")
    achados: list[dict] = []
    abas_lidas = 0
    try:
        for ws in wb.worksheets:
            linhas = list(ws.iter_rows(values_only=True))
            cab = _cabecalho(linhas)
            if not cab:
                continue
            abas_lidas += 1
            i_cab, col = cab
            for n_linha, linha in enumerate(linhas[i_cab + 1:], start=i_cab + 2):
                if col["ibge"] >= len(linha) or _ibge6(linha[col["ibge"]]) != ibge6:
                    continue
                valor = _num(linha[col["valor"]]) if col["valor"] < len(linha) else None
                if valor is None:
                    continue

                def cel(nome: str):
                    j = col.get(nome)
                    return linha[j] if j is not None and j < len(linha) else None

                achados.append({
                    "aba": ws.title, "linha": n_linha, "valor": valor,
                    "cnes": (str(cel("cnes")).strip().zfill(7) if cel("cnes") not in (None, "") else None),
                    "nome": (str(cel("nome")).strip() if cel("nome") else None),
                    "ivs": _num(cel("ivs")),
                    "entidade_sem_fins_lucrativos": "filantr" in fed._norm(ws.title),
                })
    finally:
        wb.close()
    if not abas_lidas:
        raise PlanilhaInvalida("nenhuma aba com colunas IBGE e VALOR — o leiaute da planilha mudou")
    return achados


def extrair_teto(fonte: FonteTeto, planilha: bytes, ibge6: str) -> dict:
    """Valor do município numa planilha do FNS. PAP: uma linha por município.
    MAC: uma linha por CNES (secretaria municipal + entidades sem fins lucrativos
    sob gestão municipal) — o teto do município é a soma dos CNES."""
    linhas = _linhas_do_municipio(planilha, ibge6)
    if not linhas:
        return {"valor": None, "situacao": SITUACAO_NAO_DISPONIVEL,
                "erro": f"IBGE {ibge6} não consta da planilha oficial", "detalhes": {}}
    if fonte.componente == "pap":
        if len(linhas) > 1:
            return {"valor": None, "situacao": SITUACAO_PENDENTE,
                    "erro": f"{len(linhas)} linhas para o IBGE {ibge6} na planilha PAP — conferir manualmente",
                    "detalhes": {"linhas": linhas}}
        ln = linhas[0]
        return {"valor": ln["valor"], "situacao": SITUACAO_CONFIRMADO, "erro": None,
                "detalhes": {"aba": ln["aba"], "linha": ln["linha"], "ivs": ln["ivs"], "municipio": ln["nome"]}}
    cnes = [{"cnes": ln["cnes"], "estabelecimento": ln["nome"], "valor": ln["valor"],
             "entidade_sem_fins_lucrativos": ln["entidade_sem_fins_lucrativos"],
             "aba": ln["aba"], "linha": ln["linha"]} for ln in linhas]
    return {"valor": round(sum(c["valor"] for c in cnes), 2), "situacao": SITUACAO_PENDENTE,
            "erro": None, "detalhes": {"cnes": cnes, "observacao": _PENDENCIA_ACRESCIMOS_MAC}}


async def baixar_planilha(url: str) -> tuple[bytes, str | None]:
    import httpx
    async with httpx.AsyncClient(timeout=90, follow_redirects=True,
                                 headers={"User-Agent": "ERSUS360/1.0 (consulta de tetos FNS)"}) as cli:
        r = await cli.get(url)
        r.raise_for_status()
        if not r.content.startswith(b"PK"):
            raise PlanilhaInvalida("o FNS não devolveu um arquivo xlsx")
        return r.content, r.headers.get("last-modified")


async def consultar_tetos(ibge: str, exercicio: int = EXERCICIO_PADRAO) -> list[dict]:
    """Baixa as planilhas oficiais do exercício e devolve um resultado por categoria
    (com erro registrado, nunca com valor inventado, quando a leitura falha)."""
    ibge6 = _ibge6(ibge)
    saida = []
    for fonte in fontes_do_exercicio(exercicio).values():
        base = {"categoria": fonte.categoria, "exercicio": exercicio, "url_planilha": fonte.url_planilha,
                "url_pagina": fonte.url_pagina, "documento": fonte.documento,
                "data_publicacao": fonte.data_publicacao, "arquivo_modificado_em": None, "hash_sha256": None}
        try:
            conteudo, modificado = await baixar_planilha(fonte.url_planilha)
            base.update(arquivo_modificado_em=modificado, hash_sha256=hashlib.sha256(conteudo).hexdigest())
            base.update(extrair_teto(fonte, conteudo, ibge6))
        except Exception as exc:  # noqa: BLE001 — falha de rede/leiaute vira "não disponível"
            logger.warning("Teto %s (%s): %s", fonte.categoria, ibge6, exc)
            base.update(valor=None, situacao=SITUACAO_NAO_DISPONIVEL, detalhes={},
                        erro=f"Falha ao ler a planilha oficial: {exc}")
        saida.append(base)
    return saida


# ── Consumo do teto pelas propostas ───────────────────────────────────────────

_SITUACOES_SEM_CONSUMO = {"cancelada", "rejeitada"}

_MOD_GRUPO = {"rp6": "individual", "rp7": "coletiva", "rp8": "coletiva", "programa": "programa"}


def _texto_proposta(p: Any) -> str:
    prog = getattr(p, "programa", None)
    partes = [getattr(p, c, None) for c in ("acao_orcamentaria", "componente", "bloco_financiamento",
                                            "finalidade", "tipo_objeto", "objeto")]
    partes.append(getattr(prog, "nome", None) if prog else None)
    return fed._norm(" | ".join(str(x) for x in partes if x))


def componente_do_teto(p: Any) -> str:
    """'pap' | 'mac' (custeio Incremento Temporário) | 'nao_consome' | 'a_classificar'."""
    t = _texto_proposta(p)
    fin = fed._norm(getattr(p, "tipo_financiamento", None))
    if "2e89" in t:
        return "pap"
    if "2e90" in t:
        return "mac"
    if fin == "investimento":
        return "nao_consome"
    if "incremento" in t:
        if re.search(r"primaria|\bpap\b|\baps\b|atencao basica", t):
            return "pap"
        if re.search(r"especializada|\bmac\b|media e alta|hospitalar|ambulatorial", t):
            return "mac"
    comp = fed._norm(getattr(p, "componente", None))
    if comp in ("pap", "mac") and fin in ("", "custeio"):
        return comp
    if fin != "custeio" and re.search(r"estruturacao|equipamento|construcao|ampliacao|reforma|veiculo|obra", t):
        return "nao_consome"
    return "a_classificar"


def valor_comprometido(p: Any) -> tuple[float, str]:
    """Um único estágio por proposta — nunca indicado + aprovado + empenhado + pago somados.
    Aprovado; se ainda não aprovado, valor da proposta; se ainda não cadastrada, indicado."""
    for campo, rotulo in (("valor_aprovado", "aprovado"), ("valor_proposta", "proposta"),
                          ("valor_indicado", "indicado")):
        v = float(getattr(p, campo, 0) or 0)
        if v > 0:
            return v, rotulo
    return 0.0, "sem_valor"


def _sit(p: Any) -> str:
    s = getattr(p, "situacao_normalizada", None)
    return getattr(s, "value", s) or ""


def _linha(p: Any, modalidade: str) -> dict:
    v, estagio = valor_comprometido(p)
    sit = _sit(p)
    return {"id": p.id, "numero_proposta": p.numero_proposta, "modalidade": modalidade,
            "situacao": sit, "fase": fed.fase_de(sit), "objeto": (p.objeto or "")[:160] or None,
            "valor": round(v, 2), "estagio": estagio,
            "valor_pago": round(float(getattr(p, "valor_pago", 0) or 0), 2)}


def _pct(parte: float | None, total: float | None) -> float | None:
    if parte is None or not total:
        return None
    return round(parte / total * 100, 1)


def montar_painel(tetos: dict[str, dict], propostas: Iterable[Any], modalidade_de,
                  exercicio: int = EXERCICIO_PADRAO) -> dict:
    """tetos: categoria → registro gravado (valor, situacao, documento...).
    propostas: PropostaInvestSUS do município (já filtradas por esfera federal).
    modalidade_de: função proposta → rp6 | rp7 | rp8 | programa | a_classificar."""
    consumo: dict[str, list[dict]] = {c: [] for c in ("individual_pap", "individual_mac",
                                                      "coletiva_pap", "coletiva_mac")}
    excluidas: dict[str, list[dict]] = {c: [] for c in consumo}
    a_classificar: dict[str, list[dict]] = {"individual": [], "coletiva": []}
    sem_modalidade: list[dict] = []
    programas: dict[str, dict] = {}
    outros_exercicios = 0

    for p in propostas:
        if p.exercicio != exercicio:
            outros_exercicios += 1
            continue
        mod = modalidade_de(p)
        grupo = _MOD_GRUPO.get(mod)
        linha = _linha(p, mod)
        if grupo == "programa":
            prog = getattr(p, "programa", None)
            chave = (getattr(prog, "nome", None) or p.bloco_financiamento or p.acao_orcamentaria
                     or p.objeto or "Programa não identificado")[:120]
            g = programas.setdefault(chave, {"programa": chave, "propostas": [], "valor_solicitado": 0.0,
                                             "valor_aprovado": 0.0, "valor_pago": 0.0})
            g["propostas"].append(linha)
            if linha["fase"] not in _SITUACOES_SEM_CONSUMO:
                g["valor_solicitado"] += linha["valor"]
                g["valor_aprovado"] += float(p.valor_aprovado or 0)
                g["valor_pago"] += float(p.valor_pago or 0)
            continue
        comp = componente_do_teto(p)
        if comp == "nao_consome":
            continue
        if grupo is None:
            if comp in ("pap", "mac"):
                sem_modalidade.append({**linha, "componente": comp})
            continue
        if comp == "a_classificar":
            if linha["fase"] not in _SITUACOES_SEM_CONSUMO:
                a_classificar[grupo].append(linha)
            continue
        cat = f"{grupo}_{comp}"
        (excluidas if linha["fase"] in _SITUACOES_SEM_CONSUMO else consumo)[cat].append(linha)

    cards = []
    for cat, linhas in consumo.items():
        fonte = fontes_do_exercicio(exercicio).get(cat)
        teto = tetos.get(cat) or {}
        teto_valor = teto.get("valor")
        comprometido = round(sum(x["valor"] for x in linhas), 2)
        saldo = round(teto_valor - comprometido, 2) if teto_valor is not None else None
        grupo = cat.split("_")[0]
        pend = a_classificar[grupo]
        if teto_valor is None:
            situacao = SITUACAO_NAO_DISPONIVEL
        elif teto.get("situacao") == SITUACAO_PENDENTE or pend:
            situacao = SITUACAO_PENDENTE
        else:
            situacao = SITUACAO_CONFIRMADO
        por_estagio: dict[str, float] = {}
        por_modalidade: dict[str, dict] = {}
        for x in linhas:
            por_estagio[x["estagio"]] = round(por_estagio.get(x["estagio"], 0) + x["valor"], 2)
            m = por_modalidade.setdefault(x["modalidade"], {"qtd": 0, "valor": 0.0})
            m["qtd"] += 1
            m["valor"] = round(m["valor"] + x["valor"], 2)
        memoria = [
            f"Teto oficial: {_brl(teto_valor)} — {teto.get('documento') or (fonte.documento if fonte else '—')}.",
            f"Regra do teto: {fonte.regra}" if fonte else "Regra do teto: não cadastrada para o exercício.",
            (f"Comprometido: {_brl(comprometido)} = soma de {len(linhas)} proposta(s) {exercicio} de custeio "
             f"Incremento Temporário {cat.split('_')[1].upper()} desta modalidade, um único estágio por proposta "
             "(aprovado; se não aprovado, valor da proposta; se não cadastrada, indicado). Empenhado e pago "
             "não são somados de novo."),
            (f"Saldo remanescente = {_brl(teto_valor)} − {_brl(comprometido)} = {_brl(saldo)}."
             if saldo is not None else "Saldo não calculado: teto oficial não disponível."),
        ]
        if excluidas[cat]:
            memoria.append(f"{len(excluidas[cat])} proposta(s) cancelada(s)/rejeitada(s) não subtraída(s) — "
                           "conferir no InvestSUS se o valor voltou ao teto.")
        if pend:
            memoria.append(f"{len(pend)} proposta(s) {grupo}(is) {exercicio} sem componente identificado "
                           "(PAP/MAC, custeio ou investimento) ficaram fora do cálculo — classificar para validar o saldo.")
        if teto.get("situacao") == SITUACAO_PENDENTE and (teto.get("detalhes") or {}).get("observacao"):
            memoria.append(teto["detalhes"]["observacao"])
        cards.append({
            "categoria": cat, "grupo": grupo, "componente": cat.split("_")[1],
            "rotulo": fonte.rotulo if fonte else cat,
            "teto": _teto_publico(teto, fonte),
            "comprometido": comprometido,
            "saldo": saldo,
            "acima_do_teto": saldo is not None and saldo < 0,
            "perc_utilizado": _pct(comprometido, teto_valor),
            "perc_disponivel": _pct(saldo, teto_valor) if saldo is not None else None,
            "situacao": situacao,
            "por_estagio": por_estagio,
            "por_modalidade": por_modalidade,
            "propostas": linhas,
            "excluidas": excluidas[cat],
            "memoria_calculo": memoria,
        })

    return {
        "exercicio": exercicio,
        "cards": cards,
        "a_classificar": a_classificar,
        "sem_modalidade": sem_modalidade,
        "propostas_outros_exercicios": outros_exercicios,
        "programacao": {
            "situacao": SITUACAO_NAO_DISPONIVEL,
            "nota": ("Recursos de programação do Ministério da Saúde não têm teto municipal único publicado "
                     "pelo FNS: o valor máximo é definido em cada portaria/edital de programa (LOA 2026). "
                     "Valor máximo e saldo ficam como \"não disponível\" até que a portaria do programa "
                     "fixe um limite para o município."),
            "programas": [{**g, "valor_solicitado": round(g["valor_solicitado"], 2),
                           "valor_aprovado": round(g["valor_aprovado"], 2), "valor_pago": round(g["valor_pago"], 2),
                           "valor_maximo": None, "saldo": None, "situacao_limite": SITUACAO_NAO_DISPONIVEL}
                          for g in sorted(programas.values(), key=lambda g: -g["valor_solicitado"])],
        },
        "fontes": [{"categoria": f.categoria, "rotulo": f.rotulo, "documento": f.documento,
                    "url_planilha": f.url_planilha, "url_pagina": f.url_pagina,
                    "data_publicacao": f.data_publicacao.isoformat()}
                   for f in fontes_do_exercicio(exercicio).values()],
    }


def _teto_publico(teto: dict, fonte: FonteTeto | None) -> dict:
    def iso(v):
        return v.isoformat() if isinstance(v, (date, datetime)) else v
    return {
        "valor": teto.get("valor"),
        "situacao": teto.get("situacao") or SITUACAO_NAO_DISPONIVEL,
        "documento": teto.get("documento") or (fonte.documento if fonte else None),
        "url_planilha": teto.get("url_planilha") or (fonte.url_planilha if fonte else None),
        "url_pagina": teto.get("url_pagina") or (fonte.url_pagina if fonte else None),
        "data_publicacao": iso(teto.get("data_publicacao")) or (fonte.data_publicacao.isoformat() if fonte else None),
        "consultado_em": iso(teto.get("consultado_em")),
        "arquivo_modificado_em": teto.get("arquivo_modificado_em"),
        "detalhes": teto.get("detalhes") or {},
        "erro": teto.get("erro") if teto else "Tetos ainda não consultados — use \"Atualizar Tetos Municipais\".",
    }


def _brl(v: float | None) -> str:
    if v is None:
        return "não disponível"
    s = f"{abs(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{'-' if v < 0 else ''}R$ {s}"
