"""
SIOPS Service — indicadores oficiais HOMOLOGADOS do SIOPS (consulta pública, sem login).

  GET https://siops-consulta-publica-api.saude.gov.br/v1/indicador/municipal/{ibge6}/{ano}/{periodo}
      → [{numero_indicador, ds_indicador, numerador, denominador, indicador_calculado}, ...]
        ou [{"error": "msg03", "message": "Dados não homologado(s)."}]

O "período" é ACUMULADO no ano e usa códigos próprios (mapeados em 21/10/2026 pela receita total
crescente de Apuí/2025): 1º bim = 12 · 2º = 14 · 3º = 1 · 4º = 18 · 5º = 20 · 6º (ano fechado) = 2.
O serviço anterior consultava um endereço inexistente (apidadosabertos…/siops/indicadores/…) e
nunca trazia dado. Sem homologação → nao_disponivel; nada é estimado.
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta
from typing import Optional

import httpx

from tenancy.contexto import ibge7, municipio_atual

logger = logging.getLogger(__name__)

_BASE = "https://siops-consulta-publica-api.saude.gov.br/v1/indicador/municipal"
_TIMEOUT = 20
FONTE = "SIOPS — consulta pública de indicadores homologados (siops-consulta-publica-api.saude.gov.br)"
CODIGO_BIMESTRE = {1: 12, 2: 14, 3: 1, 4: 18, 5: 20, 6: 2}
MINIMO_MUNICIPAL_PCT = 15.0          # LC 141/2012, art. 7º
_TTL = timedelta(hours=6)
_cache: dict[tuple[str, int, int], tuple[datetime, Optional[list]]] = {}


def _num(v) -> Optional[float]:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _pct(texto) -> Optional[float]:
    """'19,13 %' → 19.13 · 'R$ 84,14' → 84.14 · 0 → 0.0"""
    if texto is None:
        return None
    if isinstance(texto, (int, float)):
        return float(texto)
    t = str(texto).replace("R$", "").replace("%", "").replace(".", "").replace(",", ".").strip()
    return _num(t)


async def indicadores(ano: int, bimestre: int, ibge: str | None = None) -> Optional[list[dict]]:
    """Lista oficial do bimestre (acumulado) ou None se não homologado/indisponível."""
    ibge6 = (ibge or ibge7())[:6]
    chave = (ibge6, ano, bimestre)
    c = _cache.get(chave)
    if c and datetime.utcnow() - c[0] < _TTL:
        return c[1]
    dados: Optional[list] = None
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as cli:
            r = await cli.get(f"{_BASE}/{ibge6}/{ano}/{CODIGO_BIMESTRE[bimestre]}")
        j = r.json() if r.headers.get("content-type", "").startswith("application/json") else None
        if isinstance(j, list) and j and "numero_indicador" in j[0]:
            dados = j
    except Exception as exc:  # noqa: BLE001
        logger.debug("SIOPS %s/%s/%s: %s", ibge6, ano, bimestre, exc)
        return None                    # erro de rede não fica em cache
    _cache[chave] = (datetime.utcnow(), dados)
    return dados


def _montar(ano: int, bimestre: int, lista: list[dict]) -> dict:
    m = {x["numero_indicador"]: x for x in lista}
    g = lambda k, campo: _num((m.get(k) or {}).get(campo))  # noqa: E731
    pct_asps = _pct((m.get("3.2") or {}).get("indicador_calculado"))
    receita_base = g("3.2", "denominador")
    return {
        "municipio": municipio_atual().nome, "uf": municipio_atual().uf, "ibge": ibge7(), "ano": ano,
        "bimestre": bimestre, "ano_fechado": bimestre == 6,
        "periodo": "ano completo (6º bimestre)" if bimestre == 6 else f"acumulado até o {bimestre}º bimestre",
        # nomes usados pelas telas
        "despesa_total_saude": g("2.1", "numerador"),
        "percentual_saude_receita": pct_asps,
        # detalhamento
        "receita_total": g("1.1", "denominador"),
        "receita_impostos_transferencias": receita_base,
        "despesa_asps_recursos_proprios": g("3.2", "numerador"),
        "minimo_constitucional_pct_obrigatorio": MINIMO_MUNICIPAL_PCT,
        "minimo_constitucional_valor_obrigatorio": round(receita_base * MINIMO_MUNICIPAL_PCT / 100, 2) if receita_base else None,
        "minimo_constitucional_pct_aplicado": pct_asps,
        "superavit_minimo_pct": round(pct_asps - MINIMO_MUNICIPAL_PCT, 2) if pct_asps is not None else None,
        # ano em andamento: o percentual muda até o fechamento — nunca afirmar "não atingido" antes do 6º bimestre
        "status_minimo": None if pct_asps is None else (
            ("atingido" if pct_asps >= MINIMO_MUNICIPAL_PCT else "nao_atingido") if bimestre == 6 else
            ("parcial_acima" if pct_asps >= MINIMO_MUNICIPAL_PCT else "parcial_abaixo")),
        "transferencias_sus": g("1.3", "numerador"),
        "despesa_pessoal_saude": g("2.2", "numerador"),
        "populacao_siops": g("2.1", "denominador"),
        "despesa_saude_por_habitante": _pct((m.get("2.1") or {}).get("indicador_calculado")),
        "despesa_medicamentos_saude": g("2.3", "numerador"),
        "despesa_servicos_terceiros_pj": g("2.4", "numerador"),
        "despesa_investimentos_saude": g("2.5", "numerador"),
        "despesa_instituicoes_sem_fins_lucrativos": g("2.6", "numerador"),
        "transferencias_uniao_saude": g("1.4", "numerador"),
        "receita_impostos_proprios": g("1.1", "numerador"),
        "gasto_total_saude": g("2.1", "numerador"),
        "gasto_proprio_saude": g("3.2", "numerador"),
        "indicadores": [{"numero": x["numero_indicador"], "descricao": (x.get("ds_indicador") or "").strip(),
                         "numerador": _num(x.get("numerador")), "denominador": _num(x.get("denominador")),
                         "valor": x.get("indicador_calculado")} for x in lista],
        "situacao_dado": "oficial_validado", "fonte": FONTE,
        "nota": None if bimestre == 6 else (f"{ano}: dados acumulados até o {bimestre}º bimestre homologado — "
                                             "o percentual pode mudar até o fechamento do ano."),
    }


def _sem_dado(ano: int) -> dict:
    return {"municipio": municipio_atual().nome, "uf": municipio_atual().uf, "ibge": ibge7(), "ano": ano,
            "situacao_dado": "nao_disponivel", "fonte": FONTE,
            "nota": f"O SIOPS não tem dados homologados de {ano} para o município."}


def alerta_minimo(a: dict) -> Optional[dict]:
    """Alerta do mínimo constitucional (LC 141/2012) com o período certo — usado por todas as telas."""
    pct = a.get("percentual_saude_receita")
    if pct is None or pct >= MINIMO_MUNICIPAL_PCT:
        return None
    if a.get("ano_fechado"):
        return {"nivel": "critico", "mensagem": f"{a['ano']}: {pct:.2f}% da receita própria aplicada em saúde — abaixo do mínimo de 15% (LC 141/2012). Fonte: SIOPS."}
    return {"nivel": "atencao", "mensagem": f"{a['ano']} ({a['periodo']}): {pct:.2f}% aplicado até agora — abaixo de 15%. "
                                            "Parcial: o percentual anual só se confirma no 6º bimestre. Fonte: SIOPS."}


async def buscar_apuracao(ano: int) -> dict:
    """Último bimestre HOMOLOGADO do ano (o 6º = ano fechado)."""
    for bim in range(6, 0, -1):
        lista = await indicadores(ano, bim)
        if lista:
            return _montar(ano, bim, lista)
    return _sem_dado(ano)


async def buscar_historico(anos: int = 5) -> list[dict]:
    """Últimos anos (o corrente pode estar parcial). Ano sem homologação → nao_disponivel."""
    atual = date.today().year
    saida = []
    for ano in range(atual - anos + 1, atual + 1):
        a = await buscar_apuracao(ano)
        saida.append({"ano": ano, "minimo_pct": a.get("percentual_saude_receita"), "status": a.get("status_minimo"),
                      "despesa_total_saude": a.get("despesa_total_saude"), "receita_total": a.get("receita_total"),
                      "transferencias_sus": a.get("transferencias_sus"), "periodo": a.get("periodo"), "bimestre": a.get("bimestre"),
                      "ano_fechado": a.get("ano_fechado"), "situacao_dado": a["situacao_dado"], "fonte": a["fonte"]})
    return saida
