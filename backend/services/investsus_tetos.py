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
            "não discrimina se os acréscimos já estão somados. O FNS publicou o mesmo arquivo para MAC "
            "individual e coletiva (conteúdo idêntico, conferido por SHA-256 em 29/10/2026): os dois tetos "
            "partem do mesmo Teto MAC, então valores iguais são esperados — não é erro de leitura.",
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




# ── Limites oficiais do InvestSUS (tela "Limites" / arquivo importado) ────────
# O InvestSUS (investsus.saude.gov.br/limite) é o sistema que controla o limite de cada
# componente. Não há API pública autorizada para essa tela: o valor entra no ERSUS360
# transcrito pelo usuário (com a data da consulta) ou por planilha/CSV importado, sempre
# com responsável, data/hora e versão. Nunca há login automatizado nem captura de sessão.

SITUACAO_VALIDADO = "validado"
SITUACAO_DIVERGENTE = "divergente"

ORIGEM_FNS = "planilha_fns"
ORIGEM_TELA = "investsus_tela"
ORIGEM_ARQUIVO = "arquivo"
ORIGENS_INVESTSUS = (ORIGEM_TELA, ORIGEM_ARQUIVO)

CATEGORIAS_EMENDA = ("individual_pap", "individual_mac", "coletiva_pap", "coletiva_mac")
PROGRAMA_CUSTEIO_PAP = "programa_custeio_pap"
PROGRAMA_AGORA_TEM_ESPECIALISTAS = "programa_agora_tem_especialistas"
CATEGORIAS_PROGRAMA = (PROGRAMA_CUSTEIO_PAP, PROGRAMA_AGORA_TEM_ESPECIALISTAS)

# Rótulos exatamente como aparecem no seletor da tela Limites do InvestSUS (exercício 2026).
LIMITES_INVESTSUS: dict[str, str] = {
    "individual_pap": "Incremento ao custeio de serviços da Atenção Primária à Saúde",
    "individual_mac": "Incremento ao custeio de serviços da Atenção Especializada à Saúde",
    "coletiva_pap": "Incremento ao custeio de serviços da Atenção Primária à Saúde - Coletivas",
    "coletiva_mac": "Incremento ao custeio de serviços da Atenção Especializada à Saúde - Coletivas",
    PROGRAMA_AGORA_TEM_ESPECIALISTAS: "Incremento ao Programa Agora Tem Especialistas",
    PROGRAMA_CUSTEIO_PAP: "Custeio PAP",
}
ROTULO_CURTO: dict[str, str] = {
    "individual_pap": "RP 6 — PAP", "individual_mac": "RP 6 — MAC",
    "coletiva_pap": "RP 7/RP 8 — PAP", "coletiva_mac": "RP 7/RP 8 — MAC",
    PROGRAMA_CUSTEIO_PAP: "Programa — Custeio PAP",
    PROGRAMA_AGORA_TEM_ESPECIALISTAS: "Programa — Agora Tem Especialistas",
}

LIMIAR_ESGOTAMENTO = 80.0       # % de utilização a partir do qual o teto está "próximo do esgotamento"
TOLERANCIA = 0.01               # centavo: diferença aceita entre valores oficiais e calculados
DIAS_TETO_DESATUALIZADO = 30
DIAS_SINCRONIZACAO_DESATUALIZADA = 7


def categoria_do_limite(texto: Any) -> str | None:
    """Rótulo da tela Limites do InvestSUS (ou o código da categoria) → categoria."""
    t = fed._norm(texto).replace("–", "-")
    if not t:
        return None
    if t in LIMITES_INVESTSUS:
        return t
    if "agora tem especialistas" in t:
        return PROGRAMA_AGORA_TEM_ESPECIALISTAS
    if re.fullmatch(r"custeio (do )?(pap|aps)", t):
        return PROGRAMA_CUSTEIO_PAP
    if re.search(r"coletiv|\brp ?7\b|\brp ?8\b|bancada|comissao", t):
        grupo = "coletiva"
    elif re.search(r"incremento|\brp ?6\b|individua", t):
        grupo = "individual"
    else:
        return None
    if re.search(r"primaria|\bpap\b|\baps\b", t):
        return f"{grupo}_pap"
    if re.search(r"especializada|\bmac\b|media e alta", t):
        return f"{grupo}_mac"
    return None


class ArquivoLimitesInvalido(ValueError):
    pass


_COLUNAS_ARQUIVO = {
    "exercicio": ("exercicio", "ano", "exercicio da emenda"),
    "ibge": ("ibge", "codigo ibge", "cod ibge", "co_municipio_ibge", "municipio ibge"),
    "limite": ("limite", "componente", "categoria", "modalidade", "descricao do limite"),
    "valor_limite": ("valor limite", "valor_limite", "limite total", "valor do limite", "teto"),
    "valor_utilizado": ("valor utilizado", "valor_utilizado", "utilizado", "comprometido"),
    "saldo": ("saldo", "saldo disponivel", "valor disponivel", "disponivel"),
}


def _linhas_arquivo(conteudo: bytes, nome: str) -> list[list[Any]]:
    nome_n = (nome or "").lower()
    if nome_n.endswith(".xlsx") or conteudo.startswith(b"PK"):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(conteudo), read_only=True, data_only=True)
        except Exception as exc:  # noqa: BLE001
            raise ArquivoLimitesInvalido(f"planilha xlsx ilegível ({exc.__class__.__name__})")
        try:
            return [list(r) for r in wb.worksheets[0].iter_rows(values_only=True)]
        finally:
            wb.close()
    if nome_n.endswith(".csv") or nome_n.endswith(".txt"):
        import csv
        for cod in ("utf-8-sig", "latin-1"):
            try:
                texto = conteudo.decode(cod)
                break
            except UnicodeDecodeError:
                continue
        amostra = texto[:2000]
        sep = ";" if amostra.count(";") >= amostra.count(",") else ","
        return [r for r in csv.reader(io.StringIO(texto), delimiter=sep)]
    raise ArquivoLimitesInvalido("formato não aceito — envie .xlsx ou .csv")


def ler_arquivo_limites(conteudo: bytes, nome: str, ibge: str, exercicio: int) -> dict:
    """Valida estrutura, exercício, município e modalidade de uma planilha/CSV de limites.
    Devolve {linhas: [...válidas], erros: [...], hash_sha256}. Nada é gravado aqui."""
    linhas = _linhas_arquivo(conteudo, nome)
    cab_i, col = None, {}
    for i, ln in enumerate(linhas[:15]):
        nomes = [fed._norm(c).replace("_", " ") for c in ln]
        achadas = {}
        for chave, sinonimos in _COLUNAS_ARQUIVO.items():
            for j, n in enumerate(nomes):
                if n in {s.replace("_", " ") for s in sinonimos}:
                    achadas[chave] = j
                    break
        if {"exercicio", "ibge", "limite", "valor_limite"} <= set(achadas):
            cab_i, col = i, achadas
            break
    if cab_i is None:
        raise ArquivoLimitesInvalido(
            "cabeçalho não encontrado — o arquivo precisa das colunas exercicio, ibge, limite e valor_limite "
            "(valor_utilizado e saldo são opcionais). Baixe o modelo na tela.")
    ibge6 = _ibge6(ibge)
    validas, erros = [], []
    vistas: set[str] = set()
    for n, ln in enumerate(linhas[cab_i + 1:], start=cab_i + 2):
        if not any(c not in (None, "") for c in ln):
            continue

        def cel(chave):
            j = col.get(chave)
            return ln[j] if j is not None and j < len(ln) else None

        problemas = []
        ex = _num(cel("exercicio"))
        if ex is None or int(ex) != exercicio:
            problemas.append(f"exercício {cel('exercicio')!r} diferente de {exercicio}")
        if _ibge6(cel("ibge")) != ibge6:
            problemas.append(f"IBGE {cel('ibge')!r} não é o do município da sessão")
        cat = categoria_do_limite(cel("limite"))
        if not cat:
            problemas.append(f"limite {cel('limite')!r} não reconhecido (use o nome da tela Limites do InvestSUS)")
        elif cat in vistas:
            problemas.append(f"limite {cel('limite')!r} repetido no arquivo")
        valor = _num(cel("valor_limite"))
        util = _num(cel("valor_utilizado")) if cel("valor_utilizado") not in (None, "") else None
        saldo = _num(cel("saldo")) if cel("saldo") not in (None, "") else None
        if valor is None or valor < 0:
            problemas.append(f"valor_limite {cel('valor_limite')!r} inválido")
        problemas += conferir_valores(valor, util, saldo)
        if problemas:
            erros.append({"linha": n, "erros": problemas})
            continue
        vistas.add(cat)
        if util is None and saldo is not None:
            util = round(valor - saldo, 2)
        validas.append({"linha": n, "categoria": cat, "rotulo_oficial": LIMITES_INVESTSUS.get(cat),
                        "valor_limite": valor, "valor_utilizado": util,
                        "saldo": saldo if saldo is not None else (round(valor - util, 2) if util is not None else None)})
    if not validas and not erros:
        raise ArquivoLimitesInvalido("arquivo sem linhas de dados")
    return {"linhas": validas, "erros": erros, "hash_sha256": hashlib.sha256(conteudo).hexdigest()}


def conferir_valores(valor: float | None, utilizado: float | None, saldo: float | None) -> list[str]:
    """Limite − utilizado = saldo (quando os três vêm da tela) — pega erro de digitação."""
    erros = []
    if utilizado is not None and utilizado < 0:
        erros.append("valor_utilizado negativo")
    if valor is not None and utilizado is not None and saldo is not None \
            and abs(valor - utilizado - saldo) > TOLERANCIA:
        erros.append(f"limite ({_brl(valor)}) − utilizado ({_brl(utilizado)}) ≠ saldo ({_brl(saldo)}) — conferir a transcrição")
    return erros


def ultimos_limites_investsus(registros: Iterable[dict]) -> dict[str, dict]:
    """Registro mais recente (tela ou arquivo) por categoria."""
    ult: dict[str, dict] = {}
    for r in registros:
        if r.get("origem") not in ORIGENS_INVESTSUS or r.get("valor_limite") is None:
            continue
        atual = ult.get(r["categoria"])
        if atual is None or (r.get("versao") or 0, _ts(r.get("registrado_em"))) > \
                (atual.get("versao") or 0, _ts(atual.get("registrado_em"))):
            ult[r["categoria"]] = r
    return ult


def _ts(v) -> str:
    return v.isoformat() if isinstance(v, (date, datetime)) else str(v or "")


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
    """'pap' | 'mac' (custeio Incremento Temporário) | 'programa_agora_tem_especialistas'
    | 'nao_consome' | 'a_classificar'."""
    t = _texto_proposta(p)
    fin = fed._norm(getattr(p, "tipo_financiamento", None))
    if "2e89" in t:
        return "pap"
    if "2e90" in t:
        return "mac"
    if "agora tem especialistas" in t:
        return PROGRAMA_AGORA_TEM_ESPECIALISTAS
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


def categoria_programa(p: Any) -> str | None:
    """Programa do MS com limite próprio na tela Limites (Custeio PAP, Agora Tem Especialistas)."""
    t = _texto_proposta(p)
    if "agora tem especialistas" in t:
        return PROGRAMA_AGORA_TEM_ESPECIALISTAS
    if re.search(r"custeio", t) and re.search(r"\bpap\b|\baps\b|primaria|2e89", t):
        return PROGRAMA_CUSTEIO_PAP
    return None


def valor_comprometido(p: Any) -> tuple[float, str]:
    """Um único estágio por proposta — nunca indicado + aprovado + empenhado + pago somados.
    Aprovado; se ainda não aprovado, valor da proposta; se ainda não cadastrada, indicado."""
    for campo, rotulo in (("valor_aprovado", "aprovado"), ("valor_proposta", "proposta"),
                          ("valor_indicado", "indicado")):
        v = float(getattr(p, campo, 0) or 0)
        if v > 0:
            return v, rotulo
    return 0.0, "sem_valor"


def situacao_pagamento(p: Any) -> str:
    """pago | parcial | aprovado_nao_pago | sem_aprovacao."""
    apr = float(getattr(p, "valor_aprovado", 0) or 0)
    pago = float(getattr(p, "valor_pago", 0) or 0)
    if apr > 0 and pago >= apr - TOLERANCIA:
        return "pago"
    if pago > 0:
        return "parcial"
    return "aprovado_nao_pago" if apr > 0 else "sem_aprovacao"


def _sit(p: Any) -> str:
    s = getattr(p, "situacao_normalizada", None)
    return getattr(s, "value", s) or ""


_ESTAGIO_TEXTO = {"aprovado": "valor aprovado", "proposta": "valor da proposta (ainda não aprovada)",
                  "indicado": "valor indicado (proposta ainda não cadastrada)", "sem_valor": "sem valor"}


def _f(p: Any, campo: str) -> float:
    return round(float(getattr(p, campo, 0) or 0), 2)


def _linha(p: Any, modalidade: str) -> dict:
    v, estagio = valor_comprometido(p)
    sit = _sit(p)
    return {"id": p.id, "numero_proposta": p.numero_proposta, "modalidade": modalidade,
            "tipo_emenda": fed.MODALIDADES.get(modalidade, {}).get("curto", "A classificar"),
            "situacao": sit, "fase": fed.fase_de(sit), "objeto": (p.objeto or "")[:160] or None,
            "acao_orcamentaria": getattr(p, "acao_orcamentaria", None),
            "valor": round(v, 2), "estagio": estagio,
            "valor_indicado": _f(p, "valor_indicado"), "valor_proposta": _f(p, "valor_proposta"),
            "valor_aprovado": _f(p, "valor_aprovado"), "valor_empenhado": _f(p, "valor_empenhado"),
            "valor_pago": _f(p, "valor_pago"), "valor_devolvido": _f(p, "valor_devolvido"),
            "situacao_pagamento": situacao_pagamento(p)}


def _pct(parte: float | None, total: float | None) -> float | None:
    if parte is None or not total:
        return None
    return round(parte / total * 100, 1)


_METRICAS = ("valor_indicado", "valor_proposta", "valor_aprovado", "valor_empenhado", "valor_pago", "valor_devolvido")


def _metricas(linhas: list[dict]) -> dict:
    m = {k: round(sum(x[k] for x in linhas), 2) for k in _METRICAS}
    m["comprometido"] = round(sum(x["valor"] for x in linhas), 2)
    m["qtd"] = len(linhas)
    m["aprovadas_nao_pagas"] = sum(1 for x in linhas if x["situacao_pagamento"] == "aprovado_nao_pago")
    return m


def semaforo(teto: float | None, comprometido: float) -> dict:
    """Situação do teto por utilização — a cor sempre acompanha um texto."""
    if teto is None:
        return {"cor": "cinza", "texto": "Sem teto oficial registrado"}
    perc = _pct(comprometido, teto) if teto else (100.0 if comprometido > 0 else 0.0)
    if comprometido > teto + TOLERANCIA:
        return {"cor": "vermelho", "texto": "Comprometido acima do teto"}
    if perc is not None and perc >= 100:
        return {"cor": "vermelho", "texto": "Teto esgotado"}
    if perc is not None and perc >= LIMIAR_ESGOTAMENTO:
        return {"cor": "amarelo", "texto": "Próximo do esgotamento"}
    return {"cor": "verde", "texto": "Saldo disponível"}


def _validar(cat: str, teto_fns: dict, inv: dict | None, comprometido: float, pendentes: int) -> dict:
    """Validação do teto e do saldo. O teto só é "validado" quando confirmado na tela Limites do
    InvestSUS (registro do usuário ou arquivo); o saldo, quando o "utilizado" oficial confere com o
    comprometido calculado e não há proposta do grupo sem classificação."""
    fns_val = teto_fns.get("valor")
    motivos: list[str] = []
    divergencias: list[dict] = []
    teto_oficial = inv["valor_limite"] if inv else fns_val
    if teto_oficial is None:
        v_teto = SITUACAO_NAO_DISPONIVEL
        motivos.append("Teto não registrado — atualize pelas planilhas do FNS ou registre o valor da tela "
                       "Limites do InvestSUS.")
    elif inv:
        v_teto = SITUACAO_VALIDADO
        if fns_val is not None and abs(fns_val - inv["valor_limite"]) > TOLERANCIA:
            divergencias.append({
                "tipo": "teto_fns_x_investsus", "fns": fns_val, "investsus": inv["valor_limite"],
                "diferenca": round(inv["valor_limite"] - fns_val, 2),
                "mensagem": (f"Limite na tela do InvestSUS ({_brl(inv['valor_limite'])}) difere da planilha do FNS "
                             f"({_brl(fns_val)}): diferença {_brl(round(inv['valor_limite'] - fns_val, 2))}. Vale o "
                             "limite do InvestSUS" + (" (a planilha MAC publica o valor-base, sem os acréscimos)."
                                                      if cat.endswith("_mac") else ".")),
            })
    else:
        v_teto = SITUACAO_PENDENTE
        motivos.append("Teto lido só da planilha do FNS — confirme na tela Limites do InvestSUS e registre o valor.")
        if (teto_fns.get("detalhes") or {}).get("observacao"):
            motivos.append(teto_fns["detalhes"]["observacao"])

    util_of = inv.get("valor_utilizado") if inv else None
    if teto_oficial is None:
        v_saldo = SITUACAO_NAO_DISPONIVEL
    elif util_of is not None and abs(util_of - comprometido) > TOLERANCIA:
        v_saldo = SITUACAO_DIVERGENTE
        divergencias.append({
            "tipo": "utilizado_investsus_x_ersus", "investsus": util_of, "ersus360": comprometido,
            "diferenca": round(util_of - comprometido, 2),
            "mensagem": (f"Utilizado na tela do InvestSUS ({_brl(util_of)}) ≠ comprometido calculado pelo ERSUS360 "
                         f"({_brl(comprometido)}): diferença {_brl(round(util_of - comprometido, 2))}. Sincronize as "
                         "propostas e confira canceladas/rejeitadas e propostas sem componente."),
        })
    elif v_teto == SITUACAO_VALIDADO and util_of is not None and not pendentes:
        v_saldo = SITUACAO_VALIDADO
    else:
        v_saldo = SITUACAO_PENDENTE
        if v_teto == SITUACAO_VALIDADO and util_of is None:
            motivos.append("Valor utilizado da tela Limites não registrado — saldo calculado pelo ERSUS360 sem conferência oficial.")
    if pendentes:
        motivos.append(f"{pendentes} proposta(s) do grupo sem componente identificado ficaram fora do cálculo.")
    return {"teto": v_teto, "saldo": v_saldo, "motivos": motivos, "divergencias": divergencias,
            "teto_oficial": teto_oficial, "origem_teto": ("investsus_limites" if inv else ORIGEM_FNS if fns_val is not None else None)}


def _limite_publico(inv: dict | None) -> dict | None:
    if not inv:
        return None
    return {k: (_ts(inv.get(k)) if k in ("registrado_em", "consultado_em") else inv.get(k))
            for k in ("id", "valor_limite", "valor_utilizado", "saldo", "origem", "rotulo_oficial", "versao",
                      "consultado_em", "registrado_em", "registrado_por", "arquivo_nome", "arquivo_hash",
                      "documento", "observacao")}


def montar_painel(tetos: dict[str, dict], propostas: Iterable[Any], modalidade_de,
                  exercicio: int = EXERCICIO_PADRAO, registros: Iterable[dict] = ()) -> dict:
    """tetos: categoria → registro gravado da planilha do FNS (valor, situacao, documento...).
    propostas: PropostaInvestSUS do município (já filtradas por esfera federal).
    modalidade_de: função proposta → rp6 | rp7 | rp8 | programa | a_classificar.
    registros: histórico de limites (LimiteOficialInvestSUS) do município no exercício."""
    limites_inv = ultimos_limites_investsus(registros)
    consumo: dict[str, list[dict]] = {c: [] for c in CATEGORIAS_EMENDA}
    excluidas: dict[str, list[dict]] = {c: [] for c in consumo}
    a_classificar: dict[str, list[dict]] = {"individual": [], "coletiva": []}
    sem_modalidade: list[dict] = []
    nao_consome: list[dict] = []
    programas: dict[str, dict] = {}
    outros_exercicios = 0

    def _programa(chave: str, categoria: str | None, linha: dict, fora: bool):
        g = programas.setdefault(chave, {"programa": chave, "categoria": categoria, "propostas": [], "excluidas": []})
        (g["excluidas"] if fora else g["propostas"]).append(linha)

    for p in propostas:
        if p.exercicio != exercicio:
            outros_exercicios += 1
            continue
        mod = modalidade_de(p)
        grupo = _MOD_GRUPO.get(mod)
        linha = _linha(p, mod)
        fora = linha["fase"] in _SITUACOES_SEM_CONSUMO
        if grupo == "programa":
            cat_prog = categoria_programa(p)
            prog = getattr(p, "programa", None)
            chave = LIMITES_INVESTSUS[cat_prog] if cat_prog else (
                getattr(prog, "nome", None) or p.bloco_financiamento or p.acao_orcamentaria
                or p.objeto or "Programa não identificado")[:120]
            linha["componente"] = "programa"
            _programa(chave, cat_prog, linha, fora)
            continue
        comp = componente_do_teto(p)
        linha["componente"] = comp
        if comp == PROGRAMA_AGORA_TEM_ESPECIALISTAS:
            # Emenda destinada ao Programa Agora Tem Especialistas: limite próprio, fora dos tetos PAP/MAC.
            _programa(LIMITES_INVESTSUS[comp], comp, linha, fora)
            continue
        if comp == "nao_consome":
            nao_consome.append(linha)
            continue
        if grupo is None:
            if comp in ("pap", "mac"):
                sem_modalidade.append(linha)
            continue
        if comp == "a_classificar":
            if not fora:
                a_classificar[grupo].append(linha)
            continue
        cat = f"{grupo}_{comp}"
        (excluidas if fora else consumo)[cat].append(linha)

    cards = []
    for cat, linhas in consumo.items():
        fonte = fontes_do_exercicio(exercicio).get(cat)
        teto = tetos.get(cat) or {}
        grupo, comp = cat.split("_")
        pend = a_classificar[grupo]
        met = _metricas(linhas)
        comprometido = met["comprometido"]
        val = _validar(cat, teto, limites_inv.get(cat), comprometido, len(pend))
        teto_oficial = val["teto_oficial"]
        saldo = round(teto_oficial - comprometido, 2) if teto_oficial is not None else None
        if teto.get("valor") is None:
            situacao = SITUACAO_NAO_DISPONIVEL if teto_oficial is None else SITUACAO_PENDENTE
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
        detalhe_modalidade = {mod: _metricas([x for x in linhas if x["modalidade"] == mod])
                              for mod in (("rp7", "rp8") if grupo == "coletiva" else ("rp6",))}
        inv = limites_inv.get(cat)
        cards.append({
            "categoria": cat, "grupo": grupo, "componente": comp,
            "rotulo": fonte.rotulo if fonte else ROTULO_CURTO[cat],
            "rotulo_curto": ROTULO_CURTO[cat],
            "rotulo_investsus": LIMITES_INVESTSUS[cat],
            "teto": _teto_publico(teto, fonte),
            "limite_investsus": _limite_publico(inv),
            "teto_oficial": teto_oficial,
            "origem_teto": val["origem_teto"],
            "comprometido": comprometido,
            "saldo": saldo,
            "acima_do_teto": saldo is not None and saldo < -TOLERANCIA,
            "perc_utilizado": _pct(comprometido, teto_oficial),
            "perc_disponivel": _pct(saldo, teto_oficial) if saldo is not None else None,
            "situacao": situacao,
            "validacao": {k: val[k] for k in ("teto", "saldo", "motivos", "divergencias")},
            "semaforo": semaforo(teto_oficial, comprometido),
            "metricas": met,
            "por_estagio": por_estagio,
            "por_modalidade": por_modalidade,
            "detalhe_modalidade": detalhe_modalidade,
            "propostas": linhas,
            "excluidas": excluidas[cat],
            "a_classificar": pend,
            "memoria_linhas": memoria_linhas(cat, linhas, excluidas[cat], pend),
            "memoria_calculo": _memoria_texto(cat, exercicio, teto, fonte, inv, val, met, saldo,
                                              excluidas[cat], pend),
        })

    progs = []
    for cat in CATEGORIAS_PROGRAMA:  # limites com nome próprio na tela aparecem sempre
        programas.setdefault(LIMITES_INVESTSUS[cat], {"programa": LIMITES_INVESTSUS[cat], "categoria": cat,
                                                      "propostas": [], "excluidas": []})
    for g in programas.values():
        met = _metricas(g["propostas"])
        inv = limites_inv.get(g["categoria"]) if g["categoria"] else None
        val = _validar(g["categoria"] or "programa", {}, inv, met["comprometido"], 0)
        limite = val["teto_oficial"]
        saldo = round(limite - met["comprometido"], 2) if limite is not None else None
        progs.append({
            "programa": g["programa"], "categoria": g["categoria"],
            "rotulo_curto": ROTULO_CURTO.get(g["categoria"] or "", "Programa — " + g["programa"][:60]),
            "propostas": g["propostas"], "excluidas": g["excluidas"],
            "valor_solicitado": met["comprometido"],
            "valor_aprovado": met["valor_aprovado"], "valor_pago": met["valor_pago"],
            "metricas": met,
            "valor_maximo": limite, "saldo": saldo,
            "perc_utilizado": _pct(met["comprometido"], limite),
            "situacao_limite": SITUACAO_NAO_DISPONIVEL if limite is None else SITUACAO_CONFIRMADO,
            "limite_investsus": _limite_publico(inv),
            "validacao": {k: val[k] for k in ("teto", "saldo", "motivos", "divergencias")},
            "semaforo": semaforo(limite, met["comprometido"]),
            "memoria_linhas": memoria_linhas(g["categoria"] or "programa", g["propostas"], g["excluidas"], []),
        })
    progs.sort(key=lambda g: (g["categoria"] is None, -g["valor_solicitado"]))

    return {
        "exercicio": exercicio,
        "cards": cards,
        "a_classificar": a_classificar,
        "sem_modalidade": sem_modalidade,
        "nao_consome": nao_consome,
        "propostas_outros_exercicios": outros_exercicios,
        "programacao": {
            "situacao": (SITUACAO_CONFIRMADO if any(g["valor_maximo"] is not None for g in progs)
                         else SITUACAO_NAO_DISPONIVEL),
            "nota": ("Recursos de programa do Ministério da Saúde não têm teto municipal único publicado pelo FNS. "
                     "Os limites \"Custeio PAP\" e \"Incremento ao Programa Agora Tem Especialistas\" aparecem na tela "
                     "Limites do InvestSUS e só valem aqui depois de registrados (transcrição ou arquivo). Sem registro, "
                     "valor máximo e saldo ficam \"não disponível\". Esses limites são separados dos tetos de emendas."),
            "programas": progs,
        },
        "limites_investsus": {c: LIMITES_INVESTSUS[c] for c in (*CATEGORIAS_EMENDA, *CATEGORIAS_PROGRAMA)},
        "regras": {"limiar_esgotamento": LIMIAR_ESGOTAMENTO, "tolerancia": TOLERANCIA},
        "fontes": [{"categoria": f.categoria, "rotulo": f.rotulo, "documento": f.documento,
                    "url_planilha": f.url_planilha, "url_pagina": f.url_pagina,
                    "data_publicacao": f.data_publicacao.isoformat()}
                   for f in fontes_do_exercicio(exercicio).values()],
    }


def memoria_linhas(cat: str, incluidas: list[dict], excluidas: list[dict], pendentes: list[dict]) -> list[dict]:
    """Cada proposta considerada, com a justificativa da inclusão ou exclusão no teto."""
    comp = cat.split("_")[-1].upper() if cat in CATEGORIAS_EMENDA else "Programa"
    saida = []
    for x in incluidas:
        saida.append({**x, "incluida": True, "valor_considerado": x["valor"],
                      "justificativa": (f"Incluída: {comp} {x.get('acao_orcamentaria') or ''}".rstrip()
                                        + f" — conta uma única vez pelo {_ESTAGIO_TEXTO[x['estagio']]}.")})
    for x in excluidas:
        saida.append({**x, "incluida": False, "valor_considerado": 0.0,
                      "justificativa": (f"Excluída: proposta {x['fase']} não ocupa o limite (o valor volta ao teto). "
                                        "Conferir na tela Limites do InvestSUS.")})
    for x in pendentes:
        saida.append({**x, "incluida": False, "valor_considerado": 0.0,
                      "justificativa": "Fora do cálculo: componente (PAP/MAC, custeio ou investimento) não "
                                       "identificado — classificar para validar o saldo."})
    return saida


def _memoria_texto(cat, exercicio, teto, fonte, inv, val, met, saldo, excl, pend) -> list[str]:
    teto_oficial = val["teto_oficial"]
    if inv:
        origem = (f"tela Limites do InvestSUS (\"{LIMITES_INVESTSUS[cat]}\"), "
                  + (f"arquivo {inv.get('arquivo_nome')}" if inv.get("origem") == ORIGEM_ARQUIVO else "transcrito")
                  + f" por {inv.get('registrado_por') or '—'}, versão {inv.get('versao')}")
    elif teto.get("valor") is not None:
        origem = teto.get("documento") or (fonte.documento if fonte else "planilha FNS")
    else:
        origem = "não registrado"
    memoria = [
        f"Teto oficial: {_brl(teto_oficial)} — {origem}.",
        f"Regra do teto: {fonte.regra}" if fonte else "Regra do teto: não cadastrada para o exercício.",
        (f"Comprometido: {_brl(met['comprometido'])} = soma de {met['qtd']} proposta(s) {exercicio} de custeio "
         f"Incremento Temporário {cat.split('_')[1].upper()} desta modalidade, um único estágio por proposta "
         "(aprovado; se não aprovado, valor da proposta; se não cadastrada, indicado). Empenhado e pago "
         "não são somados de novo."),
        (f"Saldo para novas propostas = {_brl(teto_oficial)} − {_brl(met['comprometido'])} = {_brl(saldo)}."
         if saldo is not None else "Saldo não calculado: teto oficial não disponível."),
    ]
    if cat.startswith("coletiva"):
        memoria.append("RP 7 (bancada) e RP 8 (comissão) dividem este teto: um único controle, cada proposta "
                       "contada uma vez, sem somar o teto duas vezes.")
    if met["valor_devolvido"]:
        memoria.append(f"Devoluções registradas ({_brl(met['valor_devolvido'])}) não recompõem o teto sem ato "
                       "oficial — mostradas só para conferência.")
    if excl:
        memoria.append(f"{len(excl)} proposta(s) cancelada(s)/rejeitada(s) excluída(s) do comprometido — conferir na "
                       "tela Limites do InvestSUS se o valor voltou ao teto.")
    if pend:
        memoria.append(f"{len(pend)} proposta(s) {cat.split('_')[0]}(is) {exercicio} sem componente identificado "
                       "(PAP/MAC, custeio ou investimento) ficaram fora do cálculo — classificar para validar o saldo.")
    memoria += [m for m in val["motivos"] if m not in memoria and "sem componente identificado" not in m]
    memoria += [d["mensagem"] for d in val["divergencias"]]
    return memoria


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
        "hash_sha256": teto.get("hash_sha256"),
        "detalhes": teto.get("detalhes") or {},
        "erro": teto.get("erro") if teto else "Tetos ainda não consultados — use \"Atualizar Tetos Municipais\".",
    }


# ── Alertas de tetos (calculados a cada consulta; não prometem indicação nem liberação) ──

def alertas_tetos(painel: dict, historico: Iterable[dict] = (), ultima_sincronizacao: datetime | None = None,
                  ultima_consulta_fns: datetime | None = None, agora: datetime | None = None) -> list[dict]:
    agora = agora or datetime.utcnow()
    ex = painel["exercicio"]
    alertas: list[dict] = []

    def add(tipo, nivel, categoria, titulo, mensagem):
        alertas.append({"tipo": tipo, "nivel": nivel, "categoria": categoria, "exercicio": ex,
                        "titulo": titulo, "mensagem": mensagem})

    controles = [(c["categoria"], c["rotulo_curto"], c["teto_oficial"], c["saldo"], c["semaforo"], c["validacao"],
                  c["metricas"]) for c in painel["cards"]]
    controles += [(g["categoria"] or "programa", g["rotulo_curto"], g["valor_maximo"], g["saldo"], g["semaforo"],
                   g["validacao"], g["metricas"]) for g in painel["programacao"]["programas"]]
    for cat, rot, teto, saldo, sem, val, met in controles:
        if sem["cor"] == "vermelho":
            add("teto_esgotado", "critico", cat, f"{rot} {ex}: {sem['texto'].lower()}",
                f"Comprometido {_brl(met['comprometido'])} de um teto de {_brl(teto)} (saldo {_brl(saldo)}). "
                "Novas propostas nesta modalidade dependem de cancelamento, rejeição ou alteração oficial do teto.")
        elif sem["cor"] == "amarelo":
            add("teto_proximo_esgotamento", "atencao", cat, f"{rot} {ex}: teto próximo do esgotamento",
                f"Utilização de {_pct(met['comprometido'], teto)}% (≥ {LIMIAR_ESGOTAMENTO:.0f}%); saldo {_brl(saldo)}.")
        if val["saldo"] == SITUACAO_VALIDADO and saldo is not None and saldo > TOLERANCIA:
            add("saldo_validado_disponivel", "informativo", cat, f"{rot} {ex}: saldo validado disponível",
                f"Saldo de {_brl(saldo)} conferido com a tela Limites do InvestSUS. É capacidade de cadastro de novas "
                "propostas — não garante indicação parlamentar nem liberação de recurso.")
        for d in val["divergencias"]:
            add("divergencia_investsus", "atencao", cat, f"{rot} {ex}: divergência InvestSUS × ERSUS360", d["mensagem"])
        if met["aprovadas_nao_pagas"]:
            add("aprovadas_nao_pagas", "atencao", cat, f"{rot} {ex}: {met['aprovadas_nao_pagas']} proposta(s) aprovada(s) sem pagamento",
                "Propostas aprovadas que ainda não receberam repasse do FNS — acompanhar empenho e pagamento.")

    pend = sum(len(v) for v in painel["a_classificar"].values()) + len(painel["sem_modalidade"])
    if pend:
        add("propostas_a_regularizar", "atencao", None, f"{pend} proposta(s) {ex} a regularizar",
            "Propostas sem componente (PAP/MAC) ou sem modalidade (RP 6/7/8) ficam fora dos tetos e impedem a "
            "validação do saldo. Classifique-as ou sincronize os detalhes.")

    # Alteração oficial: mesmo limite, mesma origem, valor diferente da versão anterior.
    por_chave: dict[tuple, list[dict]] = {}
    for r in historico:
        if r.get("valor_limite") is None:
            continue
        chave = (r["categoria"], "fns" if r.get("origem") == ORIGEM_FNS else "investsus")
        por_chave.setdefault(chave, []).append(r)
    for (cat, origem), regs in por_chave.items():
        regs.sort(key=lambda r: (r.get("versao") or 0, _ts(r.get("registrado_em"))))
        if len(regs) >= 2 and abs(regs[-1]["valor_limite"] - regs[-2]["valor_limite"]) > TOLERANCIA:
            add("alteracao_oficial_teto", "atencao", cat, f"{ROTULO_CURTO.get(cat, cat)} {ex}: limite oficial alterado",
                f"{'Planilha do FNS' if origem == 'fns' else 'Tela Limites do InvestSUS'}: de "
                f"{_brl(regs[-2]['valor_limite'])} para {_brl(regs[-1]['valor_limite'])} "
                f"(registro de {_ts(regs[-1].get('registrado_em'))[:10]}). Revise as propostas planejadas.")

    if ultima_consulta_fns is None:
        add("dados_desatualizados", "informativo", None, "Tetos do FNS ainda não consultados",
            "Use \"Atualizar Tetos Municipais\" para ler as planilhas oficiais do exercício.")
    elif (agora - ultima_consulta_fns).days > DIAS_TETO_DESATUALIZADO:
        add("dados_desatualizados", "informativo", None, "Tetos do FNS desatualizados",
            f"Última leitura das planilhas oficiais em {ultima_consulta_fns:%d/%m/%Y} (há mais de "
            f"{DIAS_TETO_DESATUALIZADO} dias).")
    if ultima_sincronizacao is None or (agora - ultima_sincronizacao).days > DIAS_SINCRONIZACAO_DESATUALIZADA:
        add("dados_desatualizados", "atencao", None, "Propostas desatualizadas em relação ao InvestSUS",
            ("Nenhuma sincronização com o InvestSUS registrada." if ultima_sincronizacao is None else
             f"Última sincronização em {ultima_sincronizacao:%d/%m/%Y} (há mais de {DIAS_SINCRONIZACAO_DESATUALIZADA} "
             "dias).") + " O comprometido pode não refletir o InvestSUS.")
    ordem = {"critico": 0, "urgente": 1, "atencao": 2, "informativo": 3}
    alertas.sort(key=lambda a: ordem.get(a["nivel"], 9))
    return alertas


# ── Exportação da memória de cálculo (PDF / Excel) ────────────────────────────

_SIT_TEXTO = {SITUACAO_VALIDADO: "Validado", SITUACAO_PENDENTE: "Pendente de validação",
              SITUACAO_DIVERGENTE: "Divergente", SITUACAO_NAO_DISPONIVEL: "Não disponível",
              SITUACAO_CONFIRMADO: "Confirmado"}
_PAG_TEXTO = {"pago": "Pago", "parcial": "Pago parcialmente", "aprovado_nao_pago": "Aprovada, não paga",
              "sem_aprovacao": "Sem aprovação"}

_ESTAGIO_CURTO = {"aprovado": "Aprovado", "proposta": "Valor da proposta", "indicado": "Indicado", "sem_valor": "Sem valor"}


def _data_br(v) -> str:
    t = _ts(v)[:10]
    return "/".join(reversed(t.split("-"))) if len(t) == 10 else "—"


COLUNAS_MEMORIA = ["Proposta", "Tipo de emenda", "Componente", "Situação", "Pagamento", "Estágio",
                   "Valor considerado", "Incluída", "Justificativa"]


def controle_da_categoria(painel: dict, categoria: str) -> dict | None:
    for c in painel["cards"]:
        if c["categoria"] == categoria:
            return c
    for g in painel["programacao"]["programas"]:
        if g["categoria"] == categoria:
            return {**g, "teto_oficial": g["valor_maximo"], "comprometido": g["metricas"]["comprometido"],
                    "memoria_calculo": [], "rotulo": g["programa"]}
    return None


def _resumo_controle(c: dict, municipio: str, exercicio: int) -> list[tuple[str, str]]:
    met = c["metricas"]
    lim = c.get("limite_investsus") or {}
    teto = c.get("teto") or {}
    return [
        ("Município", municipio), ("Exercício", str(exercicio)), ("Controle", c.get("rotulo_curto") or c.get("rotulo")),
        ("Teto oficial", _brl(c["teto_oficial"])),
        ("Origem do teto", ("Tela Limites do InvestSUS" if lim else "Planilha FNS" if teto.get("valor") is not None else "—")),
        ("Instrumento normativo / fonte", lim.get("documento") or teto.get("documento") or "—"),
        ("Data da fonte", _data_br(lim.get("consultado_em") or lim.get("registrado_em") or teto.get("consultado_em"))),
        ("Indicado", _brl(met["valor_indicado"])), ("Cadastrado em propostas", _brl(met["valor_proposta"])),
        ("Comprometido no teto", _brl(met["comprometido"])), ("Aprovado", _brl(met["valor_aprovado"])),
        ("Pago", _brl(met["valor_pago"])), ("Saldo para novas propostas", _brl(c["saldo"])),
        ("Utilização", f"{_pct(met['comprometido'], c['teto_oficial']):.1f}%".replace(".", ",") if c["teto_oficial"] else "—"),
        ("Situação do teto", c["semaforo"]["texto"]),
        ("Validação do teto", _SIT_TEXTO.get(c["validacao"]["teto"], c["validacao"]["teto"])),
        ("Validação do saldo", _SIT_TEXTO.get(c["validacao"]["saldo"], c["validacao"]["saldo"])),
    ]


def _linhas_memoria(c: dict) -> list[list]:
    return [[x["numero_proposta"], x["tipo_emenda"], (x.get("componente") or "").upper(),
             fed.FASES.get(x.get("fase") or "", x.get("situacao") or "—"), _PAG_TEXTO.get(x["situacao_pagamento"], "—"),
             _ESTAGIO_CURTO.get(x["estagio"], x["estagio"]), x["valor_considerado"], "Sim" if x["incluida"] else "Não",
             x["justificativa"]]
            for x in c["memoria_linhas"]]


def exportar_memoria_xlsx(c: dict, municipio: str, exercicio: int, gerado_por: str) -> bytes:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill

    wb = Workbook()
    ws = wb.active
    ws.title = "Memória de cálculo"
    ws.append([f"Memória de Cálculo do Teto — {c.get('rotulo_curto') or c.get('rotulo')} — {exercicio}"])
    ws["A1"].font = Font(bold=True, size=13)
    ws.append([f"Gerado em {datetime.now():%d/%m/%Y %H:%M} por {gerado_por} · ERSUS360 — InvestSUS"])
    ws.append([])
    for k, v in _resumo_controle(c, municipio, exercicio):
        ws.append([k, v])
        ws.cell(ws.max_row, 1).font = Font(bold=True)
    ws.append([])
    ws.append(["Memória"])
    ws.cell(ws.max_row, 1).font = Font(bold=True)
    for m in c.get("memoria_calculo") or []:
        ws.append([m])
    for d in c["validacao"]["divergencias"]:
        ws.append(["Divergência", d["mensagem"]])
    ws.append([])
    ws.append(COLUNAS_MEMORIA)
    for cel in ws[ws.max_row]:
        cel.font = Font(bold=True)
        cel.fill = PatternFill("solid", fgColor="E2E8F0")
    for ln in _linhas_memoria(c):
        ws.append(ln)
        ws.cell(ws.max_row, 7).number_format = '#,##0.00'
    ws.append(["Total comprometido", "", "", "", "", "", c["metricas"]["comprometido"]])
    ws.cell(ws.max_row, 1).font = Font(bold=True)
    for col, larg in zip("ABCDEFGHI", (24, 14, 12, 18, 18, 12, 18, 9, 80)):
        ws.column_dimensions[col].width = larg
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def exportar_memoria_pdf(c: dict, municipio: str, exercicio: int, gerado_por: str) -> bytes:
    from xml.sax.saxutils import escape

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    buf = io.BytesIO()
    tam = landscape(A4)
    titulo = f"Memória de Cálculo do Teto — {c.get('rotulo_curto') or c.get('rotulo')} — {exercicio}"
    doc = SimpleDocTemplate(buf, pagesize=tam, leftMargin=1.3 * cm, rightMargin=1.3 * cm, topMargin=1.3 * cm,
                            bottomMargin=1.3 * cm, title=titulo, author="ERSUS360")
    ss = getSampleStyleSheet()
    cel = ParagraphStyle("cel", parent=ss["BodyText"], fontSize=7.5, leading=9)
    el = [Paragraph(escape(titulo), ss["Title"]),
          Paragraph(escape(f"Gerado em {datetime.now():%d/%m/%Y %H:%M} por {gerado_por} · ERSUS360 — InvestSUS"), ss["Normal"]),
          Spacer(1, 6)]
    resumo = Table([[Paragraph(f"<b>{escape(k)}</b>", cel), Paragraph(escape(v), cel)]
                    for k, v in _resumo_controle(c, municipio, exercicio)], colWidths=[6 * cm, 12 * cm])
    resumo.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#94a3b8"))]))
    el += [resumo, Spacer(1, 8), Paragraph("Memória", ss["Heading2"])]
    for m in (c.get("memoria_calculo") or []):
        el.append(Paragraph(escape(m), ss["BodyText"]))
    el += [Spacer(1, 6), Paragraph("Propostas consideradas", ss["Heading2"])]
    larguras = [3.2, 1.8, 2.2, 2.4, 2.6, 2.2, 2.8, 1.5, 8.4]
    dados = [[Paragraph(f"<b>{escape(h)}</b>", cel) for h in COLUNAS_MEMORIA]]
    for ln in _linhas_memoria(c):
        dados.append([Paragraph(escape(_brl(v) if i == 6 else str(v)), cel) for i, v in enumerate(ln)])
    dados.append([Paragraph("<b>Total comprometido</b>", cel)] + [""] * 5
                 + [Paragraph(f"<b>{escape(_brl(c['metricas']['comprometido']))}</b>", cel), "", ""])
    tb = Table(dados, repeatRows=1, colWidths=[w * cm for w in larguras])
    tb.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#94a3b8")),
                            ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    el.append(tb)
    doc.build(el)
    return buf.getvalue()


def _brl(v: float | None) -> str:
    if v is None:
        return "não disponível"
    s = f"{abs(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{'-' if v < 0 else ''}R$ {s}"
