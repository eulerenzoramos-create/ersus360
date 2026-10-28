"""Dados oficiais dos parlamentares autores de emendas (partido, UF, cargo).

O InvestSUS só informa o nome do autor. Partido/UF/cargo vêm das APIs de dados abertos
da Câmara dos Deputados e do Senado Federal. Só preenche quando o nome bate com
exatamente um parlamentar — nome ambíguo ou não encontrado fica como está (nunca chutado).
Bancadas e comissões (RP7/RP8) não são pessoas e não são consultadas.
"""
from __future__ import annotations

import logging
import re
import unicodedata
from typing import Any, Iterable

import httpx

logger = logging.getLogger(__name__)

URL_CAMARA = "https://dadosabertos.camara.leg.br/api/v2/deputados"
URL_SENADO_ATUAL = "https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json"
URL_SENADO_LEGISLATURA = "https://legis.senado.leg.br/dadosabertos/senador/lista/legislatura/{ini}/{fim}.json"
LEGISLATURAS_CAMARA = (None, 57, 56)  # None = em exercício (partido atual); depois quem saiu
LEGISLATURAS_SENADO = (56, 57)

FONTE_CAMARA = "Câmara dos Deputados — Dados Abertos"
FONTE_SENADO = "Senado Federal — Dados Abertos"


def normalizar_nome(s: Any) -> str:
    t = unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().upper()
    t = re.sub(r"[^A-Z0-9 ]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def e_coletivo(p: Any) -> bool:
    """Bancada ou comissão — autor de RP7/RP8, não uma pessoa."""
    cargo = normalizar_nome(getattr(p, "cargo", None))
    nome = normalizar_nome(getattr(p, "nome", None))
    return cargo in ("BANCADA", "COMISSAO") or nome.startswith(("BANCADA", "COMISSAO"))


# ── Leitura das APIs ──────────────────────────────────────────────────────────

def deputados_de(dados: dict) -> list[dict]:
    return [{"nome": d.get("nome"), "partido": d.get("siglaPartido"), "uf": d.get("siglaUf"),
             "cargo": "Deputado Federal", "id_externo": str(d.get("id") or ""), "fonte": FONTE_CAMARA}
            for d in (dados or {}).get("dados") or [] if d.get("nome")]


def senadores_de(dados: dict) -> list[dict]:
    raiz = (dados or {}).get("ListaParlamentarEmExercicio") or (dados or {}).get("ListaParlamentarLegislatura") or {}
    lista = ((raiz.get("Parlamentares") or {}).get("Parlamentar")) or []
    if isinstance(lista, dict):
        lista = [lista]
    saida = []
    for x in lista:
        ident = x.get("IdentificacaoParlamentar") or {}
        if not ident.get("NomeParlamentar"):
            continue
        saida.append({"nome": ident.get("NomeParlamentar"), "nome_completo": ident.get("NomeCompletoParlamentar"),
                      "partido": ident.get("SiglaPartidoParlamentar"), "uf": ident.get("UfParlamentar"),
                      "cargo": "Senador", "id_externo": str(ident.get("CodigoParlamentar") or ""),
                      "fonte": FONTE_SENADO})
    return saida


async def _json(cli: httpx.AsyncClient, url: str, params: dict | None = None) -> dict:
    r = await cli.get(url, params=params, headers={"Accept": "application/json"})
    r.raise_for_status()
    return r.json()


async def carregar_parlamentares() -> tuple[list[dict], list[str]]:
    """Deputados e senadores das legislaturas recentes. Devolve (lista, erros).
    A lista em exercício vem antes: a lista por legislatura traz o partido da posse, não o atual."""
    erros: list[str] = []
    lista: list[dict] = []
    async with httpx.AsyncClient(timeout=60, follow_redirects=True,
                                 headers={"User-Agent": "ERSUS360/1.0 (autores de emendas)"}) as cli:
        for leg in LEGISLATURAS_CAMARA:
            pagina = 1
            try:
                while pagina <= 20:
                    params = {"itens": 100, "pagina": pagina, "ordem": "ASC", "ordenarPor": "nome"}
                    if leg:
                        params["idLegislatura"] = leg
                    dados = await _json(cli, URL_CAMARA, params)
                    itens = deputados_de(dados)
                    lista.extend(itens)
                    if len(itens) < 100:
                        break
                    pagina += 1
            except Exception as exc:  # noqa: BLE001 — falha de rede vira aviso, não dado inventado
                logger.warning("Câmara legislatura %s: %s", leg, exc)
                erros.append(f"Câmara ({f'legislatura {leg}' if leg else 'em exercício'}): {exc}")
        try:
            lista.extend(senadores_de(await _json(cli, URL_SENADO_ATUAL)))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Senado atual: %s", exc)
            erros.append(f"Senado (em exercício): {exc}")
        try:
            ini, fim = LEGISLATURAS_SENADO
            lista.extend(senadores_de(await _json(cli, URL_SENADO_LEGISLATURA.format(ini=ini, fim=fim))))
        except Exception as exc:  # noqa: BLE001
            logger.warning("Senado legislaturas: %s", exc)
            erros.append(f"Senado (legislaturas {LEGISLATURAS_SENADO}): {exc}")
    return lista, erros


# ── Correspondência nome → parlamentar ────────────────────────────────────────

def indexar(lista: Iterable[dict]) -> dict[str, list[dict]]:
    """nome normalizado → registros distintos (a 1ª ocorrência de cada id vence: legislatura
    atual e lista em exercício vêm antes)."""
    idx: dict[str, list[dict]] = {}
    vistos: set[tuple[str, str, str]] = set()
    for reg in lista:
        for nome in (reg.get("nome"), reg.get("nome_completo")):
            chave = normalizar_nome(nome)
            if not chave:
                continue
            marca = (chave, reg["cargo"], reg["id_externo"])
            if marca in vistos:
                continue
            vistos.add(marca)
            idx.setdefault(chave, []).append(reg)
    return idx


def encontrar(nome: str, idx: dict[str, list[dict]]) -> tuple[dict | None, str]:
    """(registro, motivo). motivo: 'encontrado' | 'nao_encontrado' | 'ambiguo'."""
    candidatos = idx.get(normalizar_nome(nome)) or []
    pessoas = {(c["cargo"], c["id_externo"]) for c in candidatos}
    if not pessoas:
        return None, "nao_encontrado"
    if len(pessoas) > 1:
        return None, "ambiguo"
    return candidatos[0], "encontrado"


def aplicar(parlamentares: Iterable[Any], lista: list[dict]) -> dict:
    """Preenche partido/UF/cargo nos objetos Parlamentar. Devolve o resumo da atualização."""
    idx = indexar(lista)
    resumo: dict[str, Any] = {"atualizados": 0, "sem_mudanca": 0, "coletivos": 0,
                              "nao_encontrados": [], "ambiguos": []}
    for p in parlamentares:
        if e_coletivo(p):
            resumo["coletivos"] += 1
            continue
        reg, motivo = encontrar(p.nome, idx)
        if reg is None:
            resumo["nao_encontrados" if motivo == "nao_encontrado" else "ambiguos"].append(p.nome)
            continue
        novo = {"partido": reg["partido"], "uf": reg["uf"], "cargo": reg["cargo"]}
        if all(getattr(p, k) == v for k, v in novo.items()):
            resumo["sem_mudanca"] += 1
            continue
        for k, v in novo.items():
            setattr(p, k, v)
        resumo["atualizados"] += 1
    return resumo
