"""
Leitura dos relatórios exportados do SIAPS ("Baixar dados", CSV ou XLSX).

Formato conferido nos arquivos reais de Apuí (Jul/26, gerados em 28/09/2026):

    Ministério da Saúde - MS
    ...
    Relatório CVAT - Visão por Competência | Relatório Qualidade - Visão por Competência
    Dado Preliminar                               (linha opcional)
    Município: 130014 / APUÍ
    Indicador: Mais acesso à eSFR                 (só Qualidade)
    Competência selecionada: JUL/26
    Condição das Equipes: Considera apenas equipes homologadas
    Tipo de Equipe: eAP, eSF
    CNES;ESTABELECIMENTO;TIPO DO ESTABELECIMENTO;INE;NOME DA EQUIPE;SIGLA DA EQUIPE;<valores...>;PONTUAÇÃO
    "3320138\t";"UBS IRMA ELIZABETE\t";...;"8,25\t"
    Fonte: Sistema de Informação para a Atenção Primária à Saúde - SIAPS

No CSV cada célula vem entre aspas com um TAB no fim; vazio = " - "; decimais
com vírgula. No CVAT as colunas de valor são, na ordem, o parâmetro e as
variáveis A…K do componente Vínculo e Acompanhamento Territorial.
"""
from __future__ import annotations

import csv
import io
import re
import unicodedata

TAMANHO_MAXIMO = 5 * 1024 * 1024
MESES = {m: i for i, m in enumerate(
    ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"], start=1)}
CVAT_CHAVES = ["parametro", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]


class RelatorioInvalido(ValueError):
    pass


def _sem_acento(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c)).upper()


def _celula(v) -> str:
    return "" if v is None else str(v).replace("﻿", "").strip()


def _linhas_brutas(conteudo: bytes, nome: str) -> list[list[str]]:
    if len(conteudo) > TAMANHO_MAXIMO:
        raise RelatorioInvalido("Arquivo maior que 5 MB")
    if conteudo[:2] == b"PK" or nome.lower().endswith(".xlsx"):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(conteudo), read_only=True, data_only=True)
        except Exception as e:
            raise RelatorioInvalido("Planilha .xlsx ilegível") from e
        ws = wb.worksheets[0]
        return [[_celula(v) for v in row] for row in ws.iter_rows(values_only=True)]
    for enc in ("utf-8-sig", "latin-1"):
        try:
            texto = conteudo.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    return [[_celula(v) for v in row] for row in csv.reader(io.StringIO(texto), delimiter=";", quotechar='"')]


def _numero(v: str) -> float | int | None:
    v = v.strip()
    if v in ("", "-"):
        return None
    try:
        return int(v) if re.fullmatch(r"-?\d+", v) else float(v.replace(".", "").replace(",", ".")) \
            if re.fullmatch(r"-?[\d.]+,\d+", v) else float(v)
    except ValueError:
        return None


def _competencia(texto: str) -> str:
    m = re.search(r"([A-Za-zÇç]{3})\s*/\s*(\d{2,4})", texto)
    if not m or _sem_acento(m.group(1)) not in MESES:
        raise RelatorioInvalido(f"Competência não reconhecida: {texto!r}")
    ano = int(m.group(2))
    return f"{ano + 2000 if ano < 100 else ano}-{MESES[_sem_acento(m.group(1))]:02d}"


def ler_relatorio(conteudo: bytes, nome: str = "") -> dict:
    linhas = _linhas_brutas(conteudo, nome)
    meta: dict[str, str] = {}
    titulo = ""
    preliminar = False
    inicio_tabela = None
    for i, row in enumerate(linhas):
        primeira = next((c for c in row if c), "")
        if not primeira:
            continue
        chave = _sem_acento(primeira)
        if [_sem_acento(c) for c in row[:1]] == ["CNES"] and any(_sem_acento(c) == "INE" for c in row):
            inicio_tabela = i
            break
        if chave.startswith("RELATORIO "):
            titulo = chave
        elif chave == "DADO PRELIMINAR":
            preliminar = True
        elif ":" in primeira:
            k, v = primeira.split(":", 1)
            meta[_sem_acento(k).strip()] = v.strip()

    if "RELATORIO CVAT" in titulo:
        componente = "cvat"
    elif "RELATORIO QUALIDADE" in titulo:
        componente = "qualidade"
    else:
        raise RelatorioInvalido("Não é um relatório do SIAPS reconhecido (esperado: Relatório CVAT ou "
                                "Relatório Qualidade — Visão por Competência, botão \"Baixar dados\").")
    if "VISAO POR COMPETENCIA" not in titulo:
        raise RelatorioInvalido("Use a \"Visão por Competência\" do SIAPS ao baixar o relatório.")
    if inicio_tabela is None:
        raise RelatorioInvalido("Tabela de equipes não encontrada no arquivo")
    mun = re.match(r"\s*(\d{6,7})", meta.get("MUNICIPIO", ""))
    if not mun:
        raise RelatorioInvalido("Município (código IBGE) não encontrado no cabeçalho")

    # O cabeçalho do CSV não vem entre aspas e alguns nomes de coluna têm ";"
    # dentro de parênteses ("… (CONSULTA AGENDADA PROGRAMADA; CUIDADO CONTINUADO; …)").
    cab: list[str] = []
    for c in (c for c in linhas[inicio_tabela] if c):
        if cab and cab[-1].count("(") > cab[-1].count(")"):
            cab[-1] = f"{cab[-1]}; {c}"
        else:
            cab.append(c)
    colunas_valor = cab[6:]
    if not colunas_valor or _sem_acento(colunas_valor[-1]) != "PONTUACAO":
        raise RelatorioInvalido("Última coluna esperada: PONTUAÇÃO")
    if componente == "cvat" and len(colunas_valor) != len(CVAT_CHAVES) + 1:
        raise RelatorioInvalido(f"Relatório CVAT com {len(colunas_valor)} colunas de valor; esperado "
                                f"{len(CVAT_CHAVES) + 1} (parâmetro, A…K e pontuação)")

    registros = []
    for row in linhas[inicio_tabela + 1:]:
        cel = row[:len(cab)]
        if len(cel) < len(cab) or not re.fullmatch(r"\d{6,7}", cel[0] or ""):
            continue                                   # linha vazia / rodapé "Fonte: ..."
        valores = [_numero(v) for v in cel[6:]]
        reg = {"cnes": cel[0].zfill(7), "ubs": cel[1], "tipo_estabelecimento": cel[2],
               "ine": cel[3].zfill(10), "equipe": cel[4], "sigla": cel[5],
               "pontuacao": valores[-1]}
        if componente == "cvat":
            reg.update(dict(zip(CVAT_CHAVES, valores[:-1])))
        else:
            reg["valores"] = dict(zip(colunas_valor[:-1], valores[:-1]))
        registros.append(reg)
    if not registros:
        raise RelatorioInvalido("Nenhuma equipe encontrada no relatório")

    return {
        "componente": componente,
        "indicador": meta.get("INDICADOR", "") if componente == "qualidade" else "",
        "competencia": _competencia(meta.get("COMPETENCIA SELECIONADA", "")),
        "tipo_equipe": meta.get("TIPO DE EQUIPE", "").strip() or "—",
        "condicao": meta.get("CONDICAO DAS EQUIPES"),
        "municipio_ibge": mun.group(1),
        "gerado_em": meta.get("DADO GERADO EM"),
        "dado_preliminar": preliminar,
        "colunas": colunas_valor,
        "linhas": registros,
    }


def status_cvat(p: float | None) -> str:
    """Faixas do componente Vínculo usadas no ERSUS360 (mesma régua da tela SIAPS)."""
    if p is None:
        return "sem_dado"
    return "otimo" if p > 8.5 else "bom" if p >= 7 else "suficiente" if p >= 5 else "regular"
