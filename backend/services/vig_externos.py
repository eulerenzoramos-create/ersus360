"""
Coletores de fontes oficiais NÃO-FVS usadas no Painel de Vigilância em Saúde (dados públicos, sem login).

Verificado em 05/11/2026 (acesso, formato e cobertura):

  inpe_focos   INPE — Programa Queimadas, arquivos públicos de focos de calor
               (https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/).
               Usa só o SATÉLITE DE REFERÊNCIA (AQUA, passagem da tarde — "AQUA_M-T"), que é o que o
               próprio INPE recomenda para comparar períodos: a soma de todos os satélites conta o mesmo
               fogo várias vezes e muda conforme os satélites em operação.
                 • anos fechados: anual/EstadosBr_sat_ref/AM/focos_br_am_ref_{ano}.zip; se ainda não
                   publicado, anual/Brasil_sat_ref/focos_br_ref_{ano}.zip (filtrado para o AM);
                 • ano corrente: mensal/Brasil/focos_mensal_br_{AAAAMM}.csv (todos os satélites; filtramos
                   AQUA_M-T + AMAZONAS). Meses fechados ficam em cache local pelo Last-Modified.
               Arquivos anuais não trazem o código IBGE: o município é casado pelo nome (sem acento) com a
               lista oficial dos 62 municípios; nome que não casar é contado e relatado na validação.

  sisagua      Ministério da Saúde — API de Dados Abertos (apidadosabertos.saude.gov.br), SISAGUA,
               "vigilância — parâmetros básicos" (amostras coletadas pela VIGILÂNCIA municipal; não é o
               controle feito pela empresa de abastecimento). Por município e mês: amostras analisadas por
               parâmetro, E. coli e coliformes totais PRESENTES, turbidez > 5,0 uT e cloro residual livre
               < 0,2 mg/L (valores de referência da Portaria GM/MS nº 888/2021, Anexo XX da PRC nº 5/2017).

Nada é estimado: mês/município sem registro na fonte não gera linha (a tela mostra "Dados não disponíveis").
"""
from __future__ import annotations

import csv
import io
import json
import logging
import os
import re
import tempfile
import unicodedata
import zipfile
from collections import defaultdict
from datetime import date

import httpx

logger = logging.getLogger(__name__)

IBGE_AM = "130000"
UA = {"User-Agent": "ERSUS360-vigilancia/1.0 (coleta de dados publicos)"}

INPE_BASE = "https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv"
SAT_REFERENCIA = "AQUA_M-T"
SISAGUA_URL = "https://apidadosabertos.saude.gov.br/sisagua/vigilancia-parametros-basicos"

# Portaria GM/MS nº 888/2021 (Anexo XX da PRC nº 5/2017): padrão para o sistema de distribuição
TURBIDEZ_MAX_UT = 5.0
CLORO_LIVRE_MIN_MG_L = 0.2
PARAMETROS_SISAGUA = {
    "Escherichia coli": "ecoli",
    "Coliformes totais": "coliformes",
    "Turbidez (uT)": "turbidez",
    "Cloro residual livre (mg/L)": "cloro",
}


class FonteExternaIndisponivel(RuntimeError):
    pass


def normalizar_nome(nome: str) -> str:
    s = unicodedata.normalize("NFKD", (nome or "").strip().upper())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^A-Z ]", "", s.replace("-", " ")).strip()


def _semana_epidemiologica(d: date) -> tuple[int, int]:
    from services.fvs_coleta import semana_epidemiologica
    return semana_epidemiologica(d)


def _linha(indicador, mun, ano, tipo="ano", periodo=0, valor=None, **extra):
    return {"indicador": indicador, "ibge6": mun, "ano": int(ano), "periodo_tipo": tipo, "periodo": int(periodo),
            "recorte": "total", "recorte_valor": "", "valor": valor, "numerador": extra.get("numerador"),
            "denominador": extra.get("denominador"), "meta": extra.get("meta"), "alcance": None,
            "texto": extra.get("texto")}


def _somar_am(linhas: list[dict]) -> list[dict]:
    soma: dict[tuple, float] = defaultdict(float)
    for r in linhas:
        if r["ibge6"] != IBGE_AM and r["valor"] is not None:
            soma[(r["indicador"], r["ano"], r["periodo_tipo"], r["periodo"])] += r["valor"]
    return linhas + [_linha(k[0], IBGE_AM, k[1], k[2], k[3], v) for k, v in soma.items()]


# ── INPE — focos de calor ─────────────────────────────────────────────────────

def _cache_dir() -> str:
    d = os.path.join(tempfile.gettempdir(), "ersus360_inpe_focos")
    os.makedirs(d, exist_ok=True)
    return d


def _baixar(cli: httpx.Client, url: str) -> bytes | None:
    r = cli.get(url)
    if r.status_code == 404:
        return None
    r.raise_for_status()
    return r.content


def _datas_de_zip(conteudo: bytes, nomes: dict[str, str], sem_casar: set[str]) -> list[tuple[str, date]]:
    """(ibge6, data) de cada foco do AM num arquivo anual do satélite de referência."""
    z = zipfile.ZipFile(io.BytesIO(conteudo))
    bruto = z.read(z.namelist()[0])
    try:
        texto = bruto.decode("utf-8")
    except UnicodeDecodeError:
        texto = bruto.decode("latin-1")
    out = []
    for row in csv.DictReader(io.StringIO(texto)):
        if normalizar_nome(row.get("estado", "")) != "AMAZONAS":
            continue
        mun = nomes.get(normalizar_nome(row.get("municipio", "")))
        if not mun:
            sem_casar.add(row.get("municipio", ""))
            continue
        d = (row.get("data_pas") or "")[:10]
        if re.fullmatch(r"\d{4}-\d\d-\d\d", d):
            out.append((mun, date.fromisoformat(d)))
    return out


def _datas_do_mes(cli: httpx.Client, ano: int, mes: int, fechado: bool) -> list[tuple[str, date]] | None:
    """Arquivo mensal do Brasil (todos os satélites) → focos AQUA_M-T do AM. Cache em disco para meses fechados."""
    url = f"{INPE_BASE}/mensal/Brasil/focos_mensal_br_{ano}{mes:02d}.csv"
    cache = os.path.join(_cache_dir(), f"{ano}{mes:02d}.json")
    cab = cli.head(url)
    if cab.status_code == 404:
        return None
    cab.raise_for_status()
    marca = cab.headers.get("last-modified", "")
    if fechado and os.path.exists(cache):
        try:
            with open(cache, encoding="utf-8") as f:
                c = json.load(f)
            if c.get("last_modified") == marca:
                return [(m, date.fromisoformat(d)) for m, d in c["focos"]]
        except (OSError, ValueError, KeyError):
            pass
    out: list[tuple[str, date]] = []
    with cli.stream("GET", url) as r:
        r.raise_for_status()
        cab_csv = None
        for linha in r.iter_lines():
            campos = linha.split(",")
            if cab_csv is None:
                cab_csv = {c.strip(): i for i, c in enumerate(campos)}
                continue
            try:
                if campos[cab_csv["satelite"]] != SAT_REFERENCIA or campos[cab_csv["estado_id"]].strip() != "13":
                    continue
                mun = campos[cab_csv["municipio_id"]].strip()[:6]
                d = date.fromisoformat(campos[cab_csv["data_hora_gmt"]][:10])
            except (KeyError, IndexError, ValueError):
                continue
            if mun.startswith("13") and len(mun) == 6:
                out.append((mun, d))
    if fechado:
        try:
            with open(cache, "w", encoding="utf-8") as f:
                json.dump({"last_modified": marca, "focos": [(m, d.isoformat()) for m, d in out]}, f)
        except OSError:
            pass
    return out


def coletar_inpe_focos(nomes: dict[str, str], anos: int = 5) -> dict:
    """nomes: {nome normalizado: ibge6} dos 62 municípios (lista oficial gravada pelo coletor do PQA-VS)."""
    if not nomes:
        raise FonteExternaIndisponivel("Lista dos municípios do AM ainda não carregada (rode antes o PQA-VS).")
    hoje = date.today()
    sem_casar: set[str] = set()
    focos: list[tuple[str, date]] = []
    origem_ano: dict[int, str] = {}
    with httpx.Client(timeout=180, headers=UA, follow_redirects=True) as cli:
        for ano in range(hoje.year - anos + 1, hoje.year + 1):
            conteudo = None
            if ano < hoje.year:
                conteudo = _baixar(cli, f"{INPE_BASE}/anual/EstadosBr_sat_ref/AM/focos_br_am_ref_{ano}.zip")
                origem_ano[ano] = "anual AM (satélite de referência)"
                if conteudo is None:
                    conteudo = _baixar(cli, f"{INPE_BASE}/anual/Brasil_sat_ref/focos_br_ref_{ano}.zip")
                    origem_ano[ano] = "anual Brasil (satélite de referência)"
            if conteudo is not None:
                focos += _datas_de_zip(conteudo, nomes, sem_casar)
                continue
            origem_ano[ano] = "mensal Brasil (filtrado AQUA_M-T)"
            # o mês anterior ainda pode ser republicado nos primeiros dias: só os anteriores a ele vão para o cache
            mes_anterior = (hoje.year, hoje.month - 1) if hoje.month > 1 else (hoje.year - 1, 12)
            for mes in range(1, 13 if ano < hoje.year else hoje.month + 1):
                r = _datas_do_mes(cli, ano, mes, fechado=(ano, mes) < mes_anterior)
                if r is not None:
                    focos += r
    if not focos:
        raise FonteExternaIndisponivel("Nenhum foco lido dos arquivos do INPE (formato mudou ou serviço fora do ar).")
    acum: dict[tuple, float] = defaultdict(float)
    for mun, d in focos:
        acum[(mun, d.year, "ano", 0)] += 1
        acum[(mun, d.year, "mes", d.month)] += 1
        ano_se, se = _semana_epidemiologica(d)
        acum[(mun, ano_se, "se", se)] += 1
    linhas = _somar_am([_linha("focos_calor", k[0], k[1], k[2], k[3], v) for k, v in acum.items()])
    ultima = max(d for _, d in focos)
    return {"linhas": linhas, "publicado_em": None,
            "data_referencia": f"focos até {ultima:%d/%m/%Y} (satélite de referência AQUA_M-T)",
            "extra": {"satelite": SAT_REFERENCIA, "origem_por_ano": {str(k): v for k, v in origem_ano.items()},
                      "metodo": "Contagem de focos do satélite de referência do INPE por município e data da passagem."},
            "validacao": {"municipios_sem_correspondencia": sorted(x for x in sem_casar if x)[:30],
                          "focos_lidos": len(focos)}}


# ── SISAGUA — vigilância da qualidade da água ────────────────────────────────

def _num(v) -> float | None:
    if v in (None, ""):
        return None
    try:
        return float(str(v).replace(".", "").replace(",", ".")) if "," in str(v) else float(v)
    except ValueError:
        return None


def coletar_sisagua(nomes: dict[str, str], anos: int = 3, pagina: int = 1000, max_paginas: int = 60) -> dict:
    hoje = date.today()
    sem_casar: set[str] = set()
    acum: dict[tuple, float] = defaultdict(float)
    total = 0
    ultima: date | None = None
    with httpx.Client(timeout=120, headers=UA) as cli:
        for ano in range(hoje.year - anos + 1, hoje.year + 1):
            for p in range(max_paginas):
                r = cli.get(SISAGUA_URL, params={"uf": "AM", "ano": ano, "limit": pagina, "offset": p * pagina})
                if r.status_code >= 500:
                    raise FonteExternaIndisponivel(f"API SISAGUA respondeu {r.status_code}.")
                r.raise_for_status()
                regs = r.json().get("parametros") or []
                for x in regs:
                    chave = PARAMETROS_SISAGUA.get(x.get("parametro") or "")
                    if not chave:
                        continue
                    cod = str(x.get("codigo_ibge") or "")[:6]
                    mun = cod if cod.startswith("13") and len(cod) == 6 else nomes.get(normalizar_nome(x.get("municipio", "")))
                    if not mun:
                        sem_casar.add(x.get("municipio") or "")
                        continue
                    mes = int(x.get("mes") or 0)
                    if not 1 <= mes <= 12:
                        continue
                    total += 1
                    try:
                        dc = date.fromisoformat(str(x.get("data_da_coleta"))[:10])
                        ultima = max(ultima or dc, dc)
                    except ValueError:
                        pass
                    res = (x.get("resultado") or "").strip().upper()
                    acum[(f"amostras:{chave}", mun, ano, mes)] += 1
                    if chave in ("ecoli", "coliformes") and res == "PRESENTE":
                        acum[(f"presenca:{chave}", mun, ano, mes)] += 1
                    elif chave == "turbidez" and (_num(res) or 0) > TURBIDEZ_MAX_UT:
                        acum[("fora_padrao:turbidez", mun, ano, mes)] += 1
                    elif chave == "cloro" and _num(res) is not None and _num(res) < CLORO_LIVRE_MIN_MG_L:
                        acum[("fora_padrao:cloro", mun, ano, mes)] += 1
                if len(regs) < pagina:
                    break
            else:
                logger.warning("[SISAGUA] %s: limite de páginas atingido", ano)
    if not total:
        raise FonteExternaIndisponivel("A API do SISAGUA não devolveu amostras do Amazonas.")
    linhas = [_linha(k[0], k[1], k[2], "mes", k[3], v) for k, v in acum.items()]
    por_ano: dict[tuple, float] = defaultdict(float)
    for k, v in acum.items():
        por_ano[(k[0], k[1], k[2])] += v
    linhas += [_linha(k[0], k[1], k[2], "ano", 0, v) for k, v in por_ano.items()]
    return {"linhas": _somar_am(linhas), "publicado_em": None,
            "data_referencia": f"coletas até {ultima:%d/%m/%Y}" if ultima else None,
            "extra": {"referencias": {"turbidez_max_uT": TURBIDEZ_MAX_UT, "cloro_livre_min_mg_L": CLORO_LIVRE_MIN_MG_L,
                                      "norma": "Portaria GM/MS nº 888/2021 (Anexo XX da PRC nº 5/2017)"},
                      "escopo": "Amostras da vigilância (Vigiagua) — parâmetros básicos"},
            "validacao": {"amostras_lidas": total, "municipios_sem_correspondencia": sorted(x for x in sem_casar if x)[:30]}}


EXTERNOS = {"inpe_focos": coletar_inpe_focos, "sisagua": coletar_sisagua}
