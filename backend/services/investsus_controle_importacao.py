"""
InvestSUS — leitura das planilhas de controle já preenchidas pelo Fundo (sem banco).

Dois modelos usados em Apuí/AM:

MAC (uma aba por natureza de despesa)
    A1: "CONTROLE EXECUÇÃO EMENDA ... 33.90.30 - R$ 400.000,00 ..."
    linha 2: Data (A entrada, B saída) | FORNECEDOR | FINALIDADE | N. NOTA FISCAL | VALOR | SALDO ATUAL

PAP (uma aba por finalidade/meta do plano)
    linha 2: DATA ENTRADA/SAIDA | FINALIDADE | VALOR | ELEMENTO DE DESPESA (D consumo,
             E pessoa jurídica, F locomoção) | FORNECEDOR | N. NOTA FISCAL | VALOR | SALDO ATUAL
    B5: nome da finalidade

Só as SAÍDAS (notas) são lidas — o valor previsto vem do plano oficial do InvestSUS. Cada
nota vira um lançamento "nota_fiscal" depois que o técnico confere a prévia.
"""
from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime
from typing import Any

ABA_DADOS_GERAIS = "dados gerais"
# Colunas de elemento do modelo PAP (texto do cabeçalho na linha 4) → natureza
ELEMENTOS_PAP = {"consumo": "339030", "cosumo": "339030", "pessoa juridica": "339039",
                 "despesa com locomocao": "339033", "locomocao": "339033", "pessoa fisica": "339036"}


def _norm(v: Any) -> str:
    t = unicodedata.normalize("NFKD", str(v or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", t).strip()


def _num(v: Any) -> float | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).upper().replace("O", "0").replace("R$", "").replace(" ", "")   # "20.OOO,OO"
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _data(v: Any) -> date | None:
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    s = str(v or "").strip()
    m = re.match(r"^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$", s)
    if m:
        d, mth, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            return date(y + 2000 if y < 100 else y, mth, d)
        except ValueError:
            return None
    try:
        return date.fromisoformat(s[:10])
    except ValueError:
        return None


def natureza_do_titulo(titulo: Any) -> str | None:
    """'... 33.90.33.00-R$100.000,00' / '33.90.30' / '339039' → '339033' / '339030' / '339039'."""
    t = str(titulo or "")
    m = re.search(r"\b([34])\.?([34])\.?(\d{2})\.?(\d{2})(?:\.\d{2})?\b", t)
    return "".join(m.groups()) if m else None


def _cabecalho(ws) -> tuple[int, dict[str, int]] | None:
    """Linha e colunas (1-based) do cabeçalho com 'NOTA FISCAL'."""
    for r in range(1, 8):
        cols = {}
        for c in range(1, min(ws.max_column, 14) + 1):
            v = _norm(ws.cell(r, c).value)
            if not v:
                continue
            if "nota fiscal" in v:
                cols["nf"] = c
            elif v.startswith("fornecedor"):
                cols["fornecedor"] = c
            elif v.startswith("finalidade"):
                cols["finalidade"] = c
            elif v.startswith("saldo"):
                cols["saldo"] = c
            elif v.startswith("valor"):
                cols.setdefault("valores", []).append(c)
            elif v.startswith("elemento"):
                cols["elemento"] = c
            elif v.startswith("data"):
                cols["data"] = c
        if "nf" in cols:
            return r, cols
    return None


def ler_aba(ws) -> dict:
    """Uma aba de controle → {modelo, titulo, natureza, finalidade, notas[], avisos[]}."""
    titulo = str(ws.cell(1, 1).value or "").strip()
    cab = _cabecalho(ws)
    out = {"aba": ws.title, "titulo": titulo[:300], "natureza": natureza_do_titulo(titulo) or natureza_do_titulo(ws.title),
           "finalidade": None, "modelo": None, "notas": [], "avisos": []}
    if not cab:
        out["avisos"].append("Aba sem coluna 'Nº nota fiscal' — ignorada.")
        return out
    linha_cab, cols = cab
    valores = cols.get("valores", [])
    # valor da nota = coluna VALOR depois da coluna da NF (no PAP há outra VALOR antes: o previsto)
    col_valor = next((c for c in valores if c > cols["nf"]), valores[-1] if valores else None)
    if not col_valor:
        out["avisos"].append("Aba sem coluna VALOR — ignorada.")
        return out
    pap = "elemento" in cols
    out["modelo"] = "pap" if pap else "mac"
    elementos: dict[int, str] = {}
    if pap:
        # sub-cabeçalho (linha +2) com consumo / pessoa jurídica / locomoção
        for c in range(cols["elemento"], cols.get("fornecedor", cols["elemento"] + 3)):
            for r in (linha_cab + 1, linha_cab + 2):
                cod = ELEMENTOS_PAP.get(_norm(ws.cell(r, c).value))
                if cod:
                    elementos[c] = cod
        col_fin = cols.get("finalidade", 2)
        for r in range(linha_cab + 1, linha_cab + 6):
            v = ws.cell(r, col_fin).value
            if v and not _norm(v).startswith(("valor", "finalidade")):
                out["finalidade"] = str(v).strip()
                break
    col_data = cols.get("data", 1)
    for r in range(linha_cab + 1, ws.max_row + 1):
        valor = _num(ws.cell(r, col_valor).value)
        if not valor or valor <= 0:
            continue
        nf = ws.cell(r, cols["nf"]).value
        fornecedor = ws.cell(r, cols["fornecedor"]).value if "fornecedor" in cols else None
        d = _data(ws.cell(r, col_data).value) or (_data(ws.cell(r, col_data + 1).value) if not pap else None)
        natureza = out["natureza"]
        if pap:
            marcados = [cod for c, cod in elementos.items() if ws.cell(r, c).value not in (None, "")]
            natureza = marcados[0] if len(marcados) == 1 else None
        historico = ws.cell(r, cols["finalidade"]).value if "finalidade" in cols and not pap else None
        if pap:
            historico = ws.cell(r, cols.get("finalidade", 2)).value
        out["notas"].append({
            "linha": r, "data": d.isoformat() if d else None, "valor": round(valor, 2),
            "nota_fiscal": str(nf).strip() if nf not in (None, "") else None,
            "fornecedor": str(fornecedor).strip() if fornecedor not in (None, "") else None,
            "historico": str(historico).strip()[:300] if historico not in (None, "") else None,
            "natureza": natureza,
        })
    return out


def ler_planilha(wb) -> dict:
    """Planilha inteira: nº da proposta da aba de dados gerais + abas de controle."""
    numero = None
    abas = []
    for ws in wb.worksheets:
        if ABA_DADOS_GERAIS in _norm(ws.title):
            for r in range(1, min(ws.max_row, 40) + 1):
                if "proposta" in _norm(ws.cell(r, 1).value) and _norm(ws.cell(r, 1).value).startswith("n"):
                    v = ws.cell(r, 2).value
                    numero = (f"{v:.0f}" if isinstance(v, float) else str(v or "")).strip() or None
            continue
        abas.append(ler_aba(ws))
    return {"numero_proposta": numero, "abas": abas}


def _palavras(t: str) -> set[str]:
    return {p for p in re.findall(r"[a-z0-9]{4,}", _norm(t))}


def _parecido(a: str, b: str) -> float:
    pa, pb = _palavras(a), _palavras(b)
    return len(pa & pb) / len(pa | pb) if pa and pb else 0.0


def vincular(aba: dict, acoes: list[dict]) -> tuple[int | None, str]:
    """Escolhe a ação de cada aba: pela finalidade (PAP), pela natureza (MAC) ou única ação.
    acoes: [{id, descricao, grupo, natureza_despesa}] ativas da proposta."""
    if len(acoes) == 1:
        return acoes[0]["id"], "única ação do plano"
    alvo = aba.get("finalidade") or aba.get("titulo") or aba.get("aba") or ""
    if aba.get("modelo") == "mac" and aba.get("natureza"):
        mesma = [a for a in acoes if (a.get("natureza_despesa") or "") == aba["natureza"]]
        if len(mesma) == 1:
            return mesma[0]["id"], f"natureza {aba['natureza']}"
    melhor, nota = None, 0.0
    for a in acoes:
        s = max(_parecido(alvo, a.get("grupo") or ""), _parecido(alvo, a["descricao"]))
        if s > nota:
            melhor, nota = a, s
    if melhor and nota >= 0.35:
        return melhor["id"], f"finalidade parecida ({int(nota * 100)}%)"
    return None, "não foi possível identificar a ação — escolha na prévia"
