"""Tela "Limites" do InvestSUS (investsus.saude.gov.br → Limites).

O InvestSUS mostra, por exercício, um tipo de limite por vez (8 em 2026):

  INCREMENTO AO CUSTEIO DE SERVIÇOS DA ATENÇÃO PRIMÁRIA À SAÚDE - COLETIVAS
  INCREMENTO AO CUSTEIO DE SERVIÇOS DA ATENÇÃO ESPECIALIZADA À SAÚDE - COLETIVAS
  INCREMENTO AO CUSTEIO DE SERVIÇOS DA ATENÇÃO PRIMÁRIA À SAÚDE
  INCREMENTO AO CUSTEIO DE SERVIÇOS DA ATENÇÃO ESPECIALIZADA À SAÚDE
  INCREMENTO AO PROGRAMA AGORA TEM ESPECIALISTAS
  CUSTEIO PAP
  CUSTEIO MAC
  CUSTEIO EM AÇÕES E SERVIÇOS DA REDE SARAH

API oficial usada pela própria tela (lida pelo navegador do usuário logado no gov.br,
mesmo relay das propostas):
  GET /api/corporativo/entidades/tipo-limites                       → [{id, descricao}]
  GET /api/corporativo/entidades/{cnpj}/limites?ano=A&tipoTeto=ID   → linhas com
      nomeMunicipio | descricao (CNES), valorTeto (Limite), valorIndicado (Valor Indicado),
      valorSaldo (Limite a Indicar), tipoLimite (IBGE | CNES)

Os valores são gravados exatamente como o InvestSUS devolve — nada é estimado. Os quatro
"Incremento ao custeio" são os mesmos tetos das planilhas do FNS (individual/coletiva ×
PAP/MAC) e servem para validar o card de teto do ERSUS360.
"""
from __future__ import annotations

import unicodedata
from typing import Any

# Tolerância de centavos entre o InvestSUS e o ERSUS360 (arredondamentos).
TOLERANCIA = 0.01

# Ordem da lista do InvestSUS (para exibir igual quando o id não vier).
ORDEM_OFICIAL = [
    "INCREMENTO AO CUSTEIO DE SERVICOS DA ATENCAO PRIMARIA A SAUDE - COLETIVAS",
    "INCREMENTO AO CUSTEIO DE SERVICOS DA ATENCAO ESPECIALIZADA A SAUDE - COLETIVAS",
    "INCREMENTO AO CUSTEIO DE SERVICOS DA ATENCAO PRIMARIA A SAUDE",
    "INCREMENTO AO CUSTEIO DE SERVICOS DA ATENCAO ESPECIALIZADA A SAUDE",
    "INCREMENTO AO PROGRAMA AGORA TEM ESPECIALISTAS",
    "CUSTEIO PAP",
    "CUSTEIO MAC",
    "CUSTEIO EM ACOES E SERVICOS DA REDE SARAH",
]


def normalizar(texto: Any) -> str:
    s = unicodedata.normalize("NFKD", str(texto or "")).encode("ascii", "ignore").decode()
    return " ".join(s.upper().replace("–", "-").split())


def categoria_do_tipo(descricao: Any) -> str | None:
    """Tipo de limite do InvestSUS → categoria de teto do ERSUS360 (ou None = outro programa).
    Só os quatro "Incremento ao custeio de serviços" são os tetos de emenda PAP/MAC."""
    d = normalizar(descricao)
    if not d.startswith("INCREMENTO AO CUSTEIO DE SERVICOS"):
        return None
    if "ATENCAO PRIMARIA" in d:
        comp = "pap"
    elif "ATENCAO ESPECIALIZADA" in d:
        comp = "mac"
    else:
        return None
    return f"{'coletiva' if 'COLETIVA' in d else 'individual'}_{comp}"


def area_do_tipo(descricao: Any) -> str:
    d = normalizar(descricao)
    if "PRIMARIA" in d or d.endswith(" PAP") or d == "CUSTEIO PAP":
        return "pap"
    if "ESPECIALIZADA" in d or "ESPECIALISTA" in d or d.endswith(" MAC") or "SARAH" in d:
        return "mac"
    return "outros"


def _num(v: Any) -> float | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return round(float(v), 2)
    s = str(v).strip().replace("R$", "").strip()
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return round(float(s), 2)
    except ValueError:
        return None


def linha_limite(raw: dict) -> dict:
    """Linha bruta de /entidades/{cnpj}/limites → formato interno (mesmas colunas da tela)."""
    tipo = str(raw.get("tipoLimite") or "").upper() or None
    nome = raw.get("descricao") if tipo == "CNES" else (raw.get("nomeMunicipio") or raw.get("descricao"))
    teto = _num(raw.get("valorTeto"))
    return {
        "nome": (str(nome).strip() if nome else None),
        "cnes": raw.get("codigoCnes") or raw.get("coCnes") or raw.get("cnes"),
        "tipo_limite": tipo,
        "limite": teto,
        "valor_indicado": _num(raw.get("valorIndicado")),
        "limite_a_indicar": _num(raw.get("valorSaldo")),
        # valorTeto 0 = "Compartilhado com a secretaria" (mensagem da própria tela)
        "compartilhado_secretaria": teto == 0,
    }


def _soma(linhas: list[dict], campo: str) -> float | None:
    vals = [x[campo] for x in linhas if x.get(campo) is not None]
    return round(sum(vals), 2) if vals else None


def montar_tipo(tipo_id: Any, descricao: str, linhas_brutas: list[dict] | None) -> dict:
    """Um tipo de limite capturado: linhas + totais (Limite / Valor Indicado / Limite a Indicar)."""
    linhas = [linha_limite(r) for r in (linhas_brutas or []) if isinstance(r, dict)]
    return {
        "tipo_id": str(tipo_id) if tipo_id is not None else None,
        "descricao": str(descricao or "").strip(),
        "categoria": categoria_do_tipo(descricao),
        "area": area_do_tipo(descricao),
        "tipo_limite": next((x["tipo_limite"] for x in linhas if x["tipo_limite"]), None),
        "linhas": linhas,
        "limite": _soma(linhas, "limite"),
        "valor_indicado": _soma(linhas, "valor_indicado"),
        "limite_a_indicar": _soma(linhas, "limite_a_indicar"),
    }


def ordem(descricao: str) -> int:
    d = normalizar(descricao)
    return ORDEM_OFICIAL.index(d) if d in ORDEM_OFICIAL else len(ORDEM_OFICIAL)


def conferir_card(card: dict, lim: dict | None) -> dict:
    """Confere o card de teto do ERSUS360 (planilha FNS + propostas) com a tela Limites.

    Regra (desde PR #80): o teto só é "validado" quando o Limite do InvestSUS está
    registrado e o utilizado do ERSUS360 confere com o Valor Indicado do InvestSUS."""
    if not lim or lim.get("limite") is None:
        return {"disponivel": False}
    teto_fns = (card.get("teto") or {}).get("valor")
    util = card.get("comprometido")
    limite_ok = teto_fns is not None and abs(teto_fns - lim["limite"]) <= TOLERANCIA
    indicado_ok = (lim.get("valor_indicado") is not None and util is not None
                   and abs(util - lim["valor_indicado"]) <= TOLERANCIA)
    return {
        "disponivel": True,
        "descricao": lim.get("descricao"),
        "limite": lim["limite"],
        "valor_indicado": lim.get("valor_indicado"),
        "limite_a_indicar": lim.get("limite_a_indicar"),
        "capturado_em": lim.get("capturado_em"),
        "limite_confere": limite_ok,
        "indicado_confere": indicado_ok,
        "diferenca_limite": round(lim["limite"] - teto_fns, 2) if teto_fns is not None else None,
        "diferenca_indicado": (round(lim["valor_indicado"] - util, 2)
                               if lim.get("valor_indicado") is not None and util is not None else None),
        "validado": limite_ok and indicado_ok,
    }


def aplicar_conferencia(painel: dict, limites: dict[str, dict]) -> None:
    """Anexa a conferência com a tela Limites a cada card de teto e atualiza a situação:
    validado → "confirmado"; divergente → "pendente_validacao" com a explicação na memória."""
    from services.investsus_tetos import SITUACAO_CONFIRMADO, SITUACAO_PENDENTE, _brl
    for card in painel.get("cards", []):
        conf = conferir_card(card, limites.get(card["categoria"]))
        card["investsus_limites"] = conf
        if not conf["disponivel"]:
            continue
        mem = card.setdefault("memoria_calculo", [])
        mem.append(f"Tela Limites do InvestSUS ({conf['descricao']}): Limite {_brl(conf['limite'])} · "
                   f"Valor Indicado {_brl(conf['valor_indicado'])} · Limite a Indicar {_brl(conf['limite_a_indicar'])}.")
        if conf["validado"]:
            card["situacao"] = SITUACAO_CONFIRMADO
            mem.append("Validado: teto e utilizado conferem com a tela Limites do InvestSUS.")
        else:
            card["situacao"] = SITUACAO_PENDENTE
            if not conf["limite_confere"]:
                mem.append(f"Teto da planilha FNS diverge do Limite do InvestSUS em {_brl(conf['diferenca_limite'])}.")
            if not conf["indicado_confere"]:
                mem.append(f"Utilizado no ERSUS360 diverge do Valor Indicado do InvestSUS em "
                           f"{_brl(conf['diferenca_indicado'])} — sincronizar as propostas ou classificar as pendentes.")
    for linha in (painel.get("resumo") or {}).get("linhas", []):
        card = next((c for c in painel.get("cards", []) if c["categoria"] == linha["categoria"]), None)
        if card:
            linha["situacao"] = card["situacao"]
