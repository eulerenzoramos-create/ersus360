"""
Relatório PÚBLICO de Validação do SISAB (sem login) — retorno oficial do processamento da produção.

  sisab.saude.gov.br/paginas/acessoRestrito/relatorio/federal/envio/RelValidacao.xhtml  (tela JSF)

Para um município e uma competência de PRODUÇÃO, o SISAB informa quantas fichas recebeu por
CNES, INE e tipo de equipe e o resultado da validação: Aprovado, Duplicado, Data inválida,
Reprovado(motivo: CNES, INE, PROF, CBO) ou Não Aplicado. Com a opção "Considerar apenas produção
enviada no prazo" a mesma consulta mostra só o que chegou dentro do prazo da competência.

É isto que permite separar, com evidência oficial: nada recebido × recebido e reprovado × recebido
fora do prazo × recebido e aprovado no prazo. O relatório não identifica pessoas (só totais).

Conferido em 21/10/2026 (Apuí/AM, 12/2025): 46 linhas; INE 0001774026 sem nenhuma ficha recebida.
"""
from __future__ import annotations

import re
from urllib.parse import urlencode

import httpx

URL = "https://sisab.saude.gov.br/paginas/acessoRestrito/relatorio/federal/envio/RelValidacao.xhtml"
FONTE = "SISAB — Relatório público de Validação da produção (sisab.saude.gov.br)"
TIMEOUT = 180
HEADERS = {"User-Agent": "ERSUS360/1.0 (+gestao municipal; consulta publica)"}

VALIDACOES = ["1%", "2%", "3%", "4%", "N/A"]   # Aprovado, Duplicado, Data inválida, Reprovado, Não Aplicado


class SisabIndisponivel(RuntimeError):
    pass


def _viewstate(texto: str) -> str:
    m = (re.search(r'id="javax\.faces\.ViewState"><!\[CDATA\[([^\]]+)', texto)
         or re.search(r'name="javax\.faces\.ViewState"[^>]*value="([^"]+)"', texto))
    if not m:
        raise SisabIndisponivel("SISAB: tela de validação sem ViewState (layout mudou?)")
    return m.group(1)


def _form_id(html: str) -> str:
    """Formulário do relatório = o que contém o seletor de unidade geográfica."""
    i = html.find('id="unidGeo"')
    forms = [m for m in re.finditer(r'<form id="([^"]+)"', html) if m.start() < i]
    if i < 0 or not forms:
        raise SisabIndisponivel("SISAB: formulário do relatório não encontrado (layout mudou?)")
    return forms[-1].group(1)


def _select_com_opcao(html: str, valor: str) -> str:
    """Nome do <select> que tem uma opção com este valor (os nomes j_idtNN mudam entre versões)."""
    for m in re.finditer(r'<select[^>]*name="([^"]+)"[^>]*>(.*?)</select>', html, re.S):
        if f'value="{valor}"' in m.group(2):
            return m.group(1)
    raise SisabIndisponivel(f"SISAB: campo com a opção {valor!r} não encontrado (layout mudou?)")


def competencias_disponiveis(html: str) -> list[str]:
    """Competências de produção oferecidas na tela, em 'AAAA-MM'."""
    i = html.find('id="competencia"')
    trecho = html[i:i + 20000] if i >= 0 else ""
    return sorted({f"{v[:4]}-{v[4:]}" for v in re.findall(r'<option value="(\d{6})"', trecho)})


def ler_tabela(html: str) -> list[dict]:
    """Linhas do resultado (colunas CNES, INE, Tipo Equipe, Validação, Total)."""
    linhas: list[dict] = []
    for tabela in re.findall(r"<table[^>]*>.*?</table>", html, re.S):
        cab = None
        for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", tabela, re.S):
            cel = [re.sub(r"<[^>]+>", "", x).strip() for x in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", tr, re.S)]
            if cel[:2] == ["CNES", "INE"]:
                cab = cel
                continue
            if cab and len(cel) == len(cab) == 5:
                cnes, ine, tp, val, total = cel
                m = re.match(r"\s*([^(]+?)\s*(?:\(([^)]*)\))?\s*$", val)
                linhas.append({
                    "cnes": cnes.zfill(7) if cnes else None, "ine": ine.zfill(10) if ine else None,
                    "tp_equipe": tp or None, "validacao": (m.group(1) if m else val).strip(),
                    "motivo": (m.group(2) or None) if m else None,
                    "total": int(re.sub(r"\D", "", total) or 0),
                })
    return linhas


async def _sessao(client: httpx.AsyncClient, uf: str) -> tuple[str, str, str]:
    r = await client.get(URL)
    r.raise_for_status()
    html = r.text
    form, vs = _form_id(html), _viewstate(html)

    async def ajax(origem: str, extra: dict) -> str:
        nonlocal vs
        d = {form: form, "javax.faces.ViewState": vs, "javax.faces.source": origem,
             "javax.faces.partial.event": "change", "javax.faces.partial.execute": origem,
             "javax.faces.partial.render": "regioes script", "javax.faces.behavior.event": "valueChange",
             "javax.faces.partial.ajax": "true", **extra}
        resp = await client.post(URL, data=d, headers={"Faces-Request": "partial/ajax"})
        resp.raise_for_status()
        vs = _viewstate(resp.text)
        return resp.text

    await ajax("unidGeo", {"unidGeo": "municipio"})
    await ajax("estadoMunicipio", {"unidGeo": "municipio", "estadoMunicipio": uf})
    return html, form, vs


async def consultar(ibge: str, competencia: str, no_prazo: bool = False,
                    client: httpx.AsyncClient | None = None) -> dict:
    """Uma consulta (município × competência de produção). `no_prazo` = só o que chegou no prazo."""
    fechar = client is None
    client = client or httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True, headers=HEADERS)
    try:
        html, form, vs = await _sessao(client, str(ibge)[:2])
        disponiveis = competencias_disponiveis(html)
        if competencia not in disponiveis:
            return {"disponivel": False, "competencias_disponiveis": disponiveis, "linhas": []}
        dados = [(form, form), ("unidGeo", "municipio"), ("estadoMunicipio", str(ibge)[:2]),
                 ("municipios", str(ibge)[:6]), ("periodo", "producao"),
                 (_select_com_opcao(html, competencia.replace("-", "")), competencia.replace("-", "")),
                 ("colunas", "cnes"), ("colunas", "ine"), ("colunas", "tp_equipe")]
        campo_val = _select_com_opcao(html, "1%")
        dados += [(campo_val, v) for v in VALIDACOES]
        if no_prazo:
            dados.append(("envioPrazo", "on"))
        dados += [("javax.faces.ViewState", vs), ("verTela", "Ver em tela")]
        r = await client.post(URL, content=urlencode(dados),
                              headers={"Content-Type": "application/x-www-form-urlencoded"})
        r.raise_for_status()
        linhas = ler_tabela(r.text)
        if not linhas and "Valida" not in r.text:
            raise SisabIndisponivel("SISAB: resposta sem o relatório")
        return {"disponivel": True, "competencias_disponiveis": disponiveis, "linhas": linhas}
    except httpx.HTTPError as e:
        raise SisabIndisponivel(f"SISAB (relatório de validação) indisponível: {e}") from e
    finally:
        if fechar:
            await client.aclose()


async def validacao_competencia(ibge: str, competencia: str, client: httpx.AsyncClient | None = None) -> dict:
    """Total recebido + recebido no prazo, para a mesma competência."""
    total = await consultar(ibge, competencia, False, client)
    if not total["disponivel"]:
        return {"disponivel": False, "competencias_disponiveis": total["competencias_disponiveis"],
                "total": [], "no_prazo": []}
    prazo = await consultar(ibge, competencia, True, client)
    return {"disponivel": True, "competencias_disponiveis": total["competencias_disponiveis"],
            "total": total["linhas"], "no_prazo": prazo["linhas"]}


def resumo_ine(validacao: dict, ine: str) -> dict:
    """Totais oficiais de uma equipe: recebido, aprovado, reprovado por motivo, duplicado, no prazo."""
    def soma(linhas, filtro):
        return sum(l["total"] for l in linhas if l["ine"] == ine and filtro(l))
    tot, pr = validacao.get("total") or [], validacao.get("no_prazo") or []
    reprov: dict[str, int] = {}
    for l in tot:
        if l["ine"] == ine and l["validacao"].lower().startswith("reprovado"):
            reprov[l["motivo"] or "não informado"] = reprov.get(l["motivo"] or "não informado", 0) + l["total"]
    cnes = sorted({l["cnes"] for l in tot if l["ine"] == ine and l["cnes"]})
    return {
        "recebidos": soma(tot, lambda l: True),
        "aprovados": soma(tot, lambda l: l["validacao"] == "Aprovado"),
        "duplicados": soma(tot, lambda l: l["validacao"] == "Duplicado"),
        "data_invalida": soma(tot, lambda l: l["validacao"].lower().startswith("data")),
        "nao_aplicado": soma(tot, lambda l: l["validacao"].lower().startswith("n")),
        "reprovados": sum(reprov.values()), "reprovados_por_motivo": reprov,
        "recebidos_no_prazo": soma(pr, lambda l: True),
        "aprovados_no_prazo": soma(pr, lambda l: l["validacao"] == "Aprovado"),
        "cnes": cnes,
    }
