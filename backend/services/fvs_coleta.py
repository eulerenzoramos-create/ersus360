"""
Coletores da Vigilância em Saúde — FVS-RCP/AM (Agente IA — Vigilância em Saúde ERSUS360, etapa de extração).

Cada coletor lê UMA pasta pública da FVS no Tableau Public (services/fvs_tableau.py), reproduz a
regra de contagem que a própria FVS usa no painel (fórmulas lidas da pasta de trabalho) e devolve
só números por município × período. Nada é estimado: se a fonte não publica, não há linha.

  pqa_vs       Indicadores do PQA-VS: série 2012–2023 (resultado e meta) e, de 2023 em diante,
               numerador/denominador/resultado/alcance da meta, por ano ou quadrimestre.
  sinan        Monitoramento SINAN da FVS: casos por doença/agravo (contagem de registros, como o
               painel — "Casos = COUNT"), por ano, mês e semana epidemiológica; recortes por sexo,
               faixa etária, zona e raça/cor nos últimos anos.
  malaria      SIVEP-Malária: "Positivos" = RES_EXAM 2–11 e ID_LVC = 2 (sem lâmina de verificação
               de cura) e DT_NOTIF ≤ "Data de atualização" da pasta; por município PROVÁVEL DE
               INFECÇÃO (MUN_INFE), como o mapa de IPA da FVS. IPA = positivos ÷ população da
               planilha da FVS × 1.000, com as classes do próprio painel.
  aesop        AESOP/CIEVS: avisos por município e semana epidemiológica; SRAG (SIVEP-Gripe),
               vírus respiratórios (GAL) e síndrome gripal agregada.
  vacinometro  Vacinômetro COVID-19: doses aplicadas por município do estabelecimento.

O total "Amazonas" (ibge6 = 130000) é a soma dos municípios do AM na própria base.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import re
from collections import defaultdict
from datetime import date, datetime, timedelta

from sqlalchemy import delete, desc, insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.vigilancia_fvs import FvsFonteEstado, FvsMunicipio, FvsSerie, FvsSincronizacao
from services import fvs_tableau as tb
from services.fvs_catalogo import COLETORES

logger = logging.getLogger(__name__)

IBGE_AM = "130000"
ANOS_DETALHE = 5          # semanas, meses e recortes: ano corrente + 4 anteriores (anos completos ficam todos)
_travas: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

CLASSES_IPA = [  # painel Malária da FVS (campo IPA_Classe)
    (0, "Sem transmissão / IPA zero"), (1, "Controle / IPA>0 e <=1"), (10, "Baixo risco / IPA>1 e <=10"),
    (50, "Médio risco / IPA>10 e <=50"), (100, "Alto risco / IPA>50 e <=100"),
]


def classe_ipa(ipa: float | None) -> str:
    if not ipa:
        return CLASSES_IPA[0][1]
    for limite, rotulo in CLASSES_IPA[1:]:
        if ipa <= limite:
            return rotulo
    return "Altíssimo risco / IPA>100"


# ── Utilidades ────────────────────────────────────────────────────────────────

def semana_epidemiologica(d: date) -> tuple[int, int]:
    """(ano, SE) pelo calendário epidemiológico: semanas de domingo a sábado; a SE 1 é a que
    contém o primeiro sábado de janeiro com pelo menos 4 dias no ano."""
    def inicio(ano: int) -> date:
        jan4 = date(ano, 1, 4)
        return jan4 - timedelta(days=(jan4.weekday() + 1) % 7)   # domingo da semana de 4/jan
    ano = d.year
    if d < inicio(ano):
        ano -= 1
    elif d >= inicio(ano + 1):
        ano += 1
    return ano, (d - inicio(ano)).days // 7 + 1


def numero(v) -> float | None:
    if v is None or isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace("%", "")
    if not s or s in {"-", "X", "x"}:
        return None
    if re.fullmatch(r"-?\d{1,3}(\.\d{3})+(,\d+)?", s):
        s = s.replace(".", "").replace(",", ".")
    else:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def ibge6(v) -> str | None:
    s = re.sub(r"\D", "", str(v or ""))
    return s[:6] if len(s) >= 6 else None


def _linha(indicador, mun, ano, tipo="ano", periodo=0, valor=None, recorte="total", recorte_valor="", **extra):
    return {"indicador": indicador, "ibge6": mun, "ano": int(ano), "periodo_tipo": tipo, "periodo": int(periodo),
            "recorte": recorte, "recorte_valor": str(recorte_valor or "")[:80], "valor": valor,
            "numerador": extra.get("numerador"), "denominador": extra.get("denominador"),
            "meta": (extra.get("meta") or None) and str(extra["meta"])[:40],
            "alcance": extra.get("alcance"), "texto": (extra.get("texto") or None) and str(extra["texto"])[:80]}


def _chave(r: dict) -> tuple:
    return (r["indicador"], r["ibge6"], r["ano"], r["periodo_tipo"], r["periodo"], r["recorte"], r["recorte_valor"])


def _somar_estado(linhas: list[dict], contagens: set[str] | None = None) -> list[dict]:
    """Acrescenta o total do Amazonas (soma dos municípios do AM) — só para indicadores de contagem."""
    soma: dict[tuple, float] = defaultdict(float)
    for r in linhas:
        if (r["ibge6"] or "").startswith("13") and r["ibge6"] != IBGE_AM and r["valor"] is not None                 and (contagens is None or r["indicador"] in contagens):
            soma[(r["indicador"], r["ano"], r["periodo_tipo"], r["periodo"], r["recorte"], r["recorte_valor"])] += r["valor"]
    return linhas + [_linha(k[0], IBGE_AM, k[1], k[2], k[3], v, k[4], k[5]) for k, v in soma.items()]


# ── PQA-VS ────────────────────────────────────────────────────────────────────

_RE_IND = re.compile(r"^IND[_ ]?\s*0?(\d{1,2})[_ ]")


def _ind(col: str) -> str | None:
    m = _RE_IND.match(col.strip())
    return f"IND_{int(m.group(1)):02d}" if m else None


def _anos(col: str) -> list[int]:
    return [int(a) for a in re.findall(r"20\d\d", col)]


def _ler_pqa_largo(t: "tb.Tabela") -> tuple[list[dict], dict]:
    """Planilhas 2023+ (uma coluna por indicador × NUM/DEN/RES/META/ALCANCE)."""
    cols = t.colunas
    col_mun = next((c for c in ("COD_MUN", "IBGE") if c in cols), None)
    col_quad = next((c for c in cols if c.lower().startswith("quadrimestre")), None)
    ano_tab = max((a for c in cols if _ind(c) for a in _anos(c)), default=None)
    if not col_mun or not ano_tab:
        return [], {}
    por_ind: dict[str, list[str]] = defaultdict(list)
    for c in cols:
        if (k := _ind(c)):
            por_ind[k].append(c)
    metas = {}
    for k, cs in por_ind.items():
        m = next((c for c in cs if "META" in c.upper()), None)
        if m:
            metas[k] = re.sub(r"^.*?META\s*", "", m, flags=re.I).replace("_", " ").strip() or None

    def escolher(cs: list[str], tipo: str) -> list[str]:
        alvo = [c for c in cs if re.search(rf"[_ ]{tipo}", c, re.I) and ano_tab in _anos(c)]
        return alvo

    linhas = []
    sel = ", ".join(t.col(c) for c in cols)
    for row in t.consulta(f"SELECT {sel} FROM {{t}}"):
        r = dict(zip(cols, row))
        mun = ibge6(r[col_mun])
        if not mun:
            continue
        if col_quad:
            q = re.search(r"\d", str(r[col_quad] or ""))
            if not q:
                continue
            tipo, per = "quadrimestre", int(q.group())
        else:
            tipo, per = "ano", 0
        for k, cs in por_ind.items():
            finais = [c for c in cs if re.search(r"FINAL|M[ÉE]DIA PARCIAL", c, re.I)]
            res_cols = finais or [c for c in escolher(cs, "RES") if "FINAL" not in c.upper()] \
                or [c for c in cs if re.search(r"Resultado", c, re.I) and ano_tab in _anos(c)]
            num_cols, den_cols = escolher(cs, "NUM"), escolher(cs, "DEN")
            num = numero(r[num_cols[0]]) if len(num_cols) == 1 else None
            den = numero(r[den_cols[0]]) if len(den_cols) == 1 else None
            res_bruto = r[res_cols[0]] if res_cols else None
            valor = numero(res_bruto)
            alcance = None
            for c in cs:
                if "META" in c.upper() or "ALCANCE" in c.upper():
                    v = str(r[c] or "").strip().upper()
                    if v in {"SIM", "NÃO", "NAO"}:
                        alcance = "SIM" if v == "SIM" else "NÃO"
                        break
            texto = None
            aus = next((c for c in cs if "AUS" in c.upper()), None)
            if aus and str(r[aus] or "").strip().upper() == "X":
                texto = "Ausência de casos"
            elif valor is None and res_bruto not in (None, "", "-"):
                texto = str(res_bruto)
            if valor is None and num is None and den is None and alcance is None and texto is None:
                continue
            linhas.append(_linha(k, mun, ano_tab, tipo, per, valor, numerador=num, denominador=den,
                                 meta=metas.get(k), alcance=alcance, texto=texto))
    return linhas, metas


def coletar_pqa_vs(ext: "tb.Extracao") -> dict:
    linhas: dict[tuple, dict] = {}
    nomes: dict[str, str] = {}
    duplicados = 0
    serie = ext.tabela({"Ano", "Resultado", "Número Indicador", "Código", "Indicador", "Meta"})
    if serie:
        cs = ["Ano", "Resultado", "Número Indicador", "Código", "Indicador", "Meta"]
        for ano, res, n, cod, nome, meta in serie.consulta(f"SELECT {', '.join(serie.col(c) for c in cs)} FROM {{t}}"):
            mun, k = ibge6(cod), f"IND_{int(n):02d}" if str(n).isdigit() else None
            if not mun or not k or not str(ano).isdigit():
                continue
            nomes[k] = " ".join(str(nome).split())
            v = numero(res)
            r = _linha(k, mun, ano, valor=v, meta=meta, texto=None if v is not None else res)
            duplicados += _chave(r) in linhas
            linhas[_chave(r)] = r
    metas_recentes: dict[str, str] = {}
    for t in ext.tabelas_com(set()):
        if not any(_ind(c) for c in t.colunas) or not ({"COD_MUN", "IBGE"} & set(t.colunas)):
            continue
        novas, metas = _ler_pqa_largo(t)
        metas_recentes.update(metas)
        for r in novas:   # planilha anual/quadrimestral prevalece sobre a série (tem numerador/denominador)
            linhas[_chave(r)] = r
    municipios = []
    cad = ext.tabela({"codigo7", "codigo", "Município", "Regional"})
    if cad:
        pops = [c for c in cad.colunas if re.fullmatch(r"pop20\d\d", c)]
        cs = ["codigo7", "Município", "Regional"] + pops
        for row in cad.consulta(f"SELECT {', '.join(cad.col(c) for c in cs)} FROM {{t}}"):
            c7, nome, reg = row[:3]
            if not (c7 and str(c7).startswith("13")) or str(c7).endswith("00000"):
                continue   # a planilha tem também a linha "Amazonas" (1300000)
            municipios.append({"ibge7": str(c7), "ibge6": str(c7)[:6], "nome": nome, "regiao_saude": reg})
            for col, p in zip(pops, row[3:]):   # população que a FVS usa no PQA-VS (denominador das taxas)
                if numero(p):
                    r = _linha("populacao", str(c7)[:6], int(col[3:]), valor=numero(p))
                    linhas[_chave(r)] = r
        linhas.update({_chave(r): r for r in _somar_estado([r for r in linhas.values() if r["indicador"] == "populacao"])})
    periodos = sorted({(r["ano"], r["periodo_tipo"], r["periodo"]) for r in linhas.values()
                       if r["indicador"].startswith("IND_")})
    ult = periodos[-1] if periodos else None
    ref = None
    if ult:
        ref = f"{ult[2]}º quadrimestre/{ult[0]}" if ult[1] == "quadrimestre" else f"ano {ult[0]}"
    return {"linhas": list(linhas.values()), "municipios": municipios,
            "extra": {"indicadores_ate_2023": nomes, "metas_recentes": metas_recentes,
                      "nota_definicoes": "De 2024 em diante o PQA-VS segue a Portaria GM/MS nº 6.878, de 17/04/2025 "
                                         "(cartilha PQA-VS); alguns indicadores mudaram de definição e meta. A pasta "
                                         "pública não liga cada número à descrição nova, então o ERSUS360 mostra o "
                                         "número e a meta publicados."},
            "data_referencia": ref, "validacao": {"duplicados_na_serie": duplicados}}


# ── SINAN (monitoramento da FVS) ──────────────────────────────────────────────

def _limite_detalhe() -> int:
    return date.today().year - ANOS_DETALHE + 1


def coletar_sinan(ext: "tb.Extracao") -> dict:
    t = ext.tabela({"Doenca/Agravo", "Data", "Municipio"})
    if not t:
        raise tb.TableauIndisponivel("Tabela de notificações não encontrada na pasta do SINAN.")
    agr, dt, mun = t.col("Doenca/Agravo"), t.col("Data"), t.col("Municipio")
    filtro = f"WHERE CAST({mun} AS TEXT) LIKE '13%' AND CAST({mun} AS TEXT) NOT LIKE '130000%' AND {dt} IS NOT NULL"
    fora = t.consulta(f"SELECT COUNT(*) FROM {{t}} WHERE CAST({mun} AS TEXT) NOT LIKE '13%' OR {mun} IS NULL")[0][0]
    ignorado = t.consulta(f"SELECT COUNT(*) FROM {{t}} WHERE CAST({mun} AS TEXT) LIKE '130000%'")[0][0]
    sem_data = t.consulta(f"SELECT COUNT(*) FROM {{t}} WHERE {dt} IS NULL")[0][0]
    linhas: list[dict] = []
    for a, m, ano, n in t.consulta(f"SELECT {agr}, {mun}, EXTRACT(YEAR FROM {dt}), COUNT(*) FROM {{t}} {filtro} GROUP BY 1,2,3"):
        linhas.append(_linha(f"casos:{a}", ibge6(m), ano, valor=float(n)))
    lim = _limite_detalhe()
    semanas: dict[tuple, float] = defaultdict(float)
    for a, m, d, n in t.consulta(f"SELECT {agr}, {mun}, {dt}, COUNT(*) FROM {{t}} {filtro} "
                                 f"AND {dt} >= DATE '{lim - 1}-12-25' GROUP BY 1,2,3"):
        d = date(d.year, d.month, d.day)
        ano_se, se = semana_epidemiologica(d)
        if ano_se >= lim:
            semanas[(a, ibge6(m), ano_se, "se", se)] += n
        if d.year >= lim:
            semanas[(a, ibge6(m), d.year, "mes", d.month)] += n
    linhas += [_linha(f"casos:{k[0]}", k[1], k[2], k[3], k[4], v) for k, v in semanas.items()]
    for nome_rec, coluna in (("sexo", "Sexo"), ("faixa_etaria", "Faixa etaria"),
                             ("zona", "Zona de Residência"), ("raca_cor", "Raça/Cor")):
        if coluna not in t.colunas:
            continue
        c = t.col(coluna)
        rec: dict[tuple, float] = defaultdict(float)   # nulo e vazio caem no mesmo rótulo: soma
        for a, m, ano, v, n in t.consulta(f"SELECT {agr}, {mun}, EXTRACT(YEAR FROM {dt}), {c}, COUNT(*) FROM {{t}} "
                                          f"{filtro} AND EXTRACT(YEAR FROM {dt}) >= {lim} GROUP BY 1,2,3,4"):
            rec[(a, ibge6(m), int(ano), (str(v).strip() if v is not None else "") or "Ignorado/em branco")] += n
        linhas += [_linha(f"casos:{k[0]}", k[1], k[2], valor=float(v), recorte=nome_rec, recorte_valor=k[3])
                   for k, v in rec.items()]
    linhas = _somar_estado(linhas)
    maxd = t.consulta(f"SELECT MAX({dt}) FROM {{t}} {filtro}")[0][0]
    agravos = sorted({r["indicador"][6:] for r in linhas})
    return {"linhas": linhas, "extra": {"agravos": agravos},
            "data_referencia": f"notificações até {maxd.day:02d}/{maxd.month:02d}/{maxd.year}" if maxd else None,
            "validacao": {"registros_fora_do_am_ignorados": fora, "registros_sem_data": sem_data,
                          "registros_am_municipio_ignorado_130000": ignorado}}


# ── Malária (SIVEP-Malária) ───────────────────────────────────────────────────

def coletar_malaria(ext: "tb.Extracao") -> dict:
    t = ext.tabela({"RES_EXAM", "ID_LVC ", "DT_NOTIF", "MUN_INFE"}) or ext.tabela({"RES_EXAM", "ID_LVC", "DT_NOTIF", "MUN_INFE"})
    if not t:
        raise tb.TableauIndisponivel("Tabela de notificações não encontrada na pasta da malária.")
    lvc = t.col("ID_LVC " if "ID_LVC " in t.colunas else "ID_LVC")
    res, dt, mun, sexo = t.col("RES_EXAM"), t.col("DT_NOTIF"), t.col("MUN_INFE"), t.col("SEXO")
    atualizacao = tb.parametro_twb(ext.twb, "Data de atualização")
    corte = f"AND {dt} <= DATE '{atualizacao}'" if atualizacao and re.fullmatch(r"\d{4}-\d\d-\d\d", atualizacao) else ""
    positivos = f"{res} BETWEEN 2 AND 11 AND {lvc} = 2 AND {dt} IS NOT NULL {corte}"
    am = f"CAST({mun} AS TEXT) LIKE '13%' AND CAST({mun} AS TEXT) NOT LIKE '130000%'"
    sem_mun = t.consulta(f"SELECT COUNT(*) FROM {{t}} WHERE {positivos} AND {mun} IS NULL")[0][0]
    linhas: list[dict] = []
    por_ano: dict[tuple, float] = {}
    for m, ano, n in t.consulta(f"SELECT {mun}, EXTRACT(YEAR FROM {dt}), COUNT(*) FROM {{t}} WHERE {positivos} AND {am} GROUP BY 1,2"):
        por_ano[(ibge6(m), int(ano))] = float(n)
        linhas.append(_linha("positivos", ibge6(m), ano, valor=float(n)))
    lim = _limite_detalhe()
    acum: dict[tuple, float] = defaultdict(float)
    for m, d, n in t.consulta(f"SELECT {mun}, {dt}, COUNT(*) FROM {{t}} WHERE {positivos} AND {am} "
                              f"AND {dt} >= DATE '{lim - 1}-12-25' GROUP BY 1,2"):
        d = date(d.year, d.month, d.day)
        ano_se, se = semana_epidemiologica(d)
        if ano_se >= lim:
            acum[(ibge6(m), ano_se, "se", se)] += n
        if d.year >= lim:
            acum[(ibge6(m), d.year, "mes", d.month)] += n
    linhas += [_linha("positivos", k[0], k[1], k[2], k[3], v) for k, v in acum.items()]
    parasita = (f"CASE WHEN {res} = 4 THEN 'Vivax' WHEN {res} IN (2,3,5,6,7,9) THEN 'Falciparum' "
                f"WHEN {res} IN (8,10,11) THEN 'Outros' END")
    for m, ano, p, n in t.consulta(f"SELECT {mun}, EXTRACT(YEAR FROM {dt}), {parasita}, COUNT(*) FROM {{t}} "
                                   f"WHERE {positivos} AND {am} GROUP BY 1,2,3"):
        linhas.append(_linha("positivos", ibge6(m), ano, valor=float(n), recorte="parasita", recorte_valor=p))
    for m, ano, s, n in t.consulta(f"SELECT {mun}, EXTRACT(YEAR FROM {dt}), {sexo}, COUNT(*) FROM {{t}} "
                                   f"WHERE {positivos} AND {am} AND EXTRACT(YEAR FROM {dt}) >= {lim} GROUP BY 1,2,3"):
        linhas.append(_linha("positivos", ibge6(m), ano, valor=float(n), recorte="sexo",
                             recorte_valor={"M": "Masculino", "F": "Feminino"}.get(s, "Ignorado/em branco")))
    linhas = _somar_estado(linhas)
    # População usada pela FVS no mapa de IPA (planilha "População_AM_2021" da própria pasta)
    pop_t = ext.tabela({"Código", "Município", "Pop."})
    populacao = {}
    if pop_t:
        for cod, p in pop_t.consulta(f"SELECT {pop_t.col('Código')}, {pop_t.col('Pop.')} FROM {{t}}"):
            if ibge6(cod) and numero(p):
                populacao[ibge6(cod)] = numero(p)
        if populacao:
            populacao[IBGE_AM] = sum(populacao.values())
    for (m, ano), n in list(por_ano.items()) + [((IBGE_AM, a), sum(v for (mm, aa), v in por_ano.items() if aa == a))
                                               for a in {a for _, a in por_ano}]:
        if populacao.get(m):
            ipa = n / populacao[m] * 1000
            linhas.append(_linha("ipa", m, ano, valor=round(ipa, 2), numerador=n, denominador=populacao[m],
                                 texto=classe_ipa(ipa)))
    ref = None
    if atualizacao and re.fullmatch(r"\d{4}-\d\d-\d\d", atualizacao):
        a, mm, d = atualizacao.split("-")
        ref = f"notificações até {d}/{mm}/{a} (data de atualização do painel)"
    return {"linhas": linhas, "extra": {"populacao_referencia": "População_AM_2021 (planilha da FVS no painel)"},
            "data_referencia": ref, "validacao": {"positivos_sem_municipio_de_infeccao": sem_mun}}


# ── AESOP / SRAG ──────────────────────────────────────────────────────────────

def coletar_aesop(ext: "tb.Extracao") -> dict:
    linhas: list[dict] = []
    ult = None
    for t in ext.tabelas_com({"cod_ibge", "SE", "Aviso AESOP"}):   # série histórica + semana atual
        campos = {"Aviso AESOP": "aviso_aesop", "Aviso APS": "aviso_aps", "Aviso PIP": "aviso_pip", "DQI": "dqi",
                  "Probabilidade de Crescimento (%)": "prob_crescimento_pct",
                  "N. de Semanas em Avisos Consecutivos": "semanas_aviso_consecutivas",
                  "N. de Municípios Fronteiriços em Aviso": "municipios_fronteiricos_em_aviso",
                  "Provável Sindrome Gripal na APS": "sindrome_gripal_aps",
                  "Total de Atendimentos na APS": "atendimentos_aps"}
        cs = ["cod_ibge", "SE"] + [c for c in campos if c in t.colunas]
        for row in t.consulta(f"SELECT {', '.join(t.col(c) for c in cs)} FROM {{t}}"):
            r = dict(zip(cs, row))
            mun, m = ibge6(r["cod_ibge"]), re.fullmatch(r"(\d{1,2})-(\d{4})", str(r["SE"] or ""))
            if not mun or not m:
                continue
            se, ano = int(m.group(1)), int(m.group(2))
            ult = max(ult or (0, 0), (ano, se))
            for c, ind in campos.items():
                if c not in r or r[c] in (None, ""):
                    continue
                v = numero(r[c])
                eh_texto = ind.startswith("aviso") or ind == "dqi"
                linhas.append(_linha(ind, mun, ano, "se", se, None if eh_texto else v,
                                     texto=str(r[c]) if eh_texto else None))
    g = ext.tabela({"Banco", "Ano", "Semana Epidemiológica", "codigo"})
    if g:
        cs = ["Banco", "Ano", "Semana Epidemiológica", "codigo", "Casos_SRAG", "Casos_GAL", "Casos_SG_Agreg",
              "GAL - Vírus Respiratórios"]
        cs = [c for c in cs if c in g.colunas]
        acum: dict[tuple, float] = defaultdict(float)
        for row in g.consulta(f"SELECT {', '.join(g.col(c) for c in cs)} FROM {{t}}"):
            r = dict(zip(cs, row))
            mun, ano, se = ibge6(r["codigo"]), numero(r["Ano"]), numero(r["Semana Epidemiológica"])
            if not mun or not ano or not se:
                continue
            if r["Banco"] == "Sivep_SRAG" and numero(r.get("Casos_SRAG")):
                acum[("srag_casos", mun, int(ano), int(se), "total", "")] += numero(r["Casos_SRAG"])
            elif r["Banco"] == "Sivep_SG_Agregados" and numero(r.get("Casos_SG_Agreg")):
                acum[("sg_casos_agregados", mun, int(ano), int(se), "total", "")] += numero(r["Casos_SG_Agreg"])
            elif r["Banco"] == "GAL_VR_RtPCR" and numero(r.get("Casos_GAL")) and r.get("GAL - Vírus Respiratórios"):
                acum[("gal_virus_detectados", mun, int(ano), int(se), "virus", r["GAL - Vírus Respiratórios"])] += numero(r["Casos_GAL"])
        linhas += [_linha(k[0], k[1], k[2], "se", k[3], v, k[4], k[5]) for k, v in acum.items()]
    linhas = _somar_estado(linhas, {"srag_casos", "sg_casos_agregados", "gal_virus_detectados",
                                    "sindrome_gripal_aps", "atendimentos_aps"})
    return {"linhas": linhas, "extra": {},
            "data_referencia": f"SE {ult[1]}/{ult[0]}" if ult else None, "validacao": {}}


# ── Vacinômetro COVID-19 ──────────────────────────────────────────────────────

def coletar_vacinometro(ext: "tb.Extracao") -> dict:
    t = ext.tabela({"estabelecimento_municipio_codigo", "vacina_dataAplicacao", "vacina_descricao_dose", "vacina_nome"})
    if not t:
        raise tb.TableauIndisponivel("Tabela de doses não encontrada no Vacinômetro.")
    mun, dt, dose = t.col("estabelecimento_municipio_codigo"), t.col("vacina_dataAplicacao"), t.col("vacina_descricao_dose")
    filtro = f"WHERE CAST({mun} AS TEXT) LIKE '13%' AND CAST({mun} AS TEXT) NOT LIKE '130000%' AND {dt} IS NOT NULL"
    linhas = []
    for m, ano, n in t.consulta(f"SELECT {mun}, EXTRACT(YEAR FROM {dt}), COUNT(*) FROM {{t}} {filtro} GROUP BY 1,2"):
        linhas.append(_linha("doses_covid19", ibge6(m), ano, valor=float(n)))
    for m, ano, mes, n in t.consulta(f"SELECT {mun}, EXTRACT(YEAR FROM {dt}), EXTRACT(MONTH FROM {dt}), COUNT(*) "
                                     f"FROM {{t}} {filtro} GROUP BY 1,2,3"):
        linhas.append(_linha("doses_covid19", ibge6(m), ano, "mes", mes, float(n)))
    for m, ano, d, n in t.consulta(f"SELECT {mun}, EXTRACT(YEAR FROM {dt}), {dose}, COUNT(*) FROM {{t}} {filtro} GROUP BY 1,2,3"):
        linhas.append(_linha("doses_covid19", ibge6(m), ano, valor=float(n), recorte="dose", recorte_valor=d or "Não informada"))
    linhas = _somar_estado(linhas)
    maxd = t.consulta(f"SELECT MAX({dt}) FROM {{t}} {filtro}")[0][0]
    return {"linhas": linhas, "extra": {},
            "data_referencia": f"doses aplicadas até {maxd.day:02d}/{maxd.month:02d}/{maxd.year}" if maxd else None,
            "validacao": {}}


EXTRATORES = {"pqa_vs": coletar_pqa_vs, "sinan": coletar_sinan, "malaria": coletar_malaria,
              "aesop": coletar_aesop, "vacinometro": coletar_vacinometro}


# ── Validação e gravação ──────────────────────────────────────────────────────

def consolidar(linhas: list[dict]) -> tuple[list[dict], dict]:
    """Linhas repetidas na fonte: idênticas viram uma; com valores diferentes são descartadas e relatadas
    (não escolhemos qual número da FVS está certo)."""
    grupos: dict[tuple, list[dict]] = defaultdict(list)
    for r in linhas:
        grupos[_chave(r)].append(r)
    saida, identicas, conflitos = [], 0, []
    campos = ("valor", "numerador", "denominador", "alcance", "texto", "meta")
    for k, rs in grupos.items():
        if len(rs) == 1:
            saida.append(rs[0])
        elif len({tuple(r[c] for c in campos) for r in rs}) == 1:
            identicas += len(rs) - 1
            saida.append(rs[0])
        else:
            conflitos.append(list(k))
    return saida, {"repeticoes_identicas_consolidadas": identicas, "chaves_conflitantes_descartadas": len(conflitos),
                   "exemplos_conflito": conflitos[:10]}


def validar(linhas: list[dict], municipios_am: set[str]) -> dict:
    vistos, dup = set(), 0
    fora = set()
    for r in linhas:
        k = _chave(r)
        dup += k in vistos
        vistos.add(k)
        if r["ibge6"] != IBGE_AM and municipios_am and r["ibge6"] not in municipios_am:
            fora.add(r["ibge6"])
    presentes = {r["ibge6"] for r in linhas}
    anos = [r["ano"] for r in linhas]
    return {"linhas": len(linhas), "chaves_duplicadas": dup, "codigos_fora_da_lista_do_am": sorted(fora),
            "municipios_sem_dado": sorted(municipios_am - presentes) if municipios_am else [],
            "sem_valor_numerico": sum(1 for r in linhas if r["valor"] is None),
            "ano_min": min(anos) if anos else None, "ano_max": max(anos) if anos else None}


def _hash(linhas: list[dict]) -> str:
    base = sorted((_chave(r), r["valor"], r["numerador"], r["denominador"], r["alcance"], r["texto"]) for r in linhas)
    return hashlib.sha256(json.dumps(base, ensure_ascii=False, default=str).encode()).hexdigest()


def _executar_coletor(coletor: str) -> dict:
    """Parte bloqueante (download + Hyper). Roda fora do loop de eventos."""
    pasta = COLETORES[coletor]["workbook"]
    meta = tb.metadados(pasta)
    with tb.abrir_pasta(pasta) as ext:
        out = EXTRATORES[coletor](ext)
    out["publicado_em"] = meta["publicado_em"]
    out["perfil"] = meta["perfil"]
    return out


async def estado(db: AsyncSession, fonte: str) -> FvsFonteEstado:
    e = await db.get(FvsFonteEstado, fonte)
    if not e:
        e = FvsFonteEstado(fonte=fonte)
        db.add(e)
    return e


async def municipios_am(db: AsyncSession) -> set[str]:
    return set((await db.execute(select(FvsMunicipio.ibge6))).scalars())


async def sincronizar(db: AsyncSession, coletor: str, origem: str = "agendada", usuario: str | None = None,
                      forcar: bool = False) -> dict:
    """Verifica se a FVS republicou a pasta; se sim (ou forcar), coleta, valida e substitui a série da fonte."""
    if coletor not in COLETORES:
        raise ValueError("fonte desconhecida")
    trava = _travas[coletor]
    if trava.locked():
        return {"fonte": coletor, "situacao": "executando", "mensagem": "Já há uma sincronização desta fonte em andamento."}
    async with trava:
        est = await estado(db, coletor)
        log = FvsSincronizacao(fonte=coletor, origem=origem, usuario=usuario)
        db.add(log)
        est.ultima_tentativa = datetime.utcnow()
        await db.commit()
        try:
            if not forcar and est.situacao == "ok" and est.publicado_na_fonte:
                meta = await asyncio.to_thread(tb.metadados, COLETORES[coletor]["workbook"])
                if meta["publicado_em"] and meta["publicado_em"] <= est.publicado_na_fonte:
                    log.situacao, log.concluido_em = "sem_mudanca", datetime.utcnow()
                    log.publicado_na_fonte = meta["publicado_em"]
                    est.ultima_sucesso = datetime.utcnow()
                    est.mensagem = "Sem nova publicação da FVS desde a última sincronização."
                    await db.commit()
                    return {"fonte": coletor, "situacao": "sem_mudanca", "publicado_na_fonte": meta["publicado_em"]}
            out = await asyncio.to_thread(_executar_coletor, coletor)
            if out.get("municipios"):
                await _gravar_municipios(db, out["municipios"])
            am = await municipios_am(db)
            linhas, consol = consolidar([r for r in out["linhas"] if r["ibge6"]])
            validacao = {**validar(linhas, am), **consol, **out.get("validacao", {})}
            if validacao["chaves_duplicadas"]:
                raise RuntimeError(f"{validacao['chaves_duplicadas']} chaves duplicadas após a agregação — gravação cancelada")
            h = _hash(linhas)
            diff = await _substituir(db, coletor, linhas, log.id) if h != est.hash_conteudo else {"novos": 0, "alterados": 0, "removidos": 0}
            log.situacao = "ok" if h != est.hash_conteudo else "sem_mudanca"
            log.registros, log.hash_conteudo, log.validacao = len(linhas), h, validacao
            log.novos, log.alterados, log.removidos = diff["novos"], diff["alterados"], diff["removidos"]
            log.publicado_na_fonte, log.concluido_em = out["publicado_em"], datetime.utcnow()
            est.situacao, est.mensagem = "ok", None
            est.publicado_na_fonte, est.data_referencia = out["publicado_em"], out.get("data_referencia")
            est.registros, est.hash_conteudo, est.ultima_sucesso = len(linhas), h, datetime.utcnow()
            if out.get("extra"):
                est.mensagem = json.dumps(out["extra"], ensure_ascii=False)[:20000]
            await db.commit()
            return {"fonte": coletor, "situacao": log.situacao, "registros": len(linhas), **diff,
                    "data_referencia": est.data_referencia, "publicado_na_fonte": out["publicado_em"]}
        except Exception as exc:  # noqa: BLE001 — qualquer falha vira registro visível, sem derrubar a tela
            await db.rollback()
            msg = str(exc)[:1000]
            if isinstance(exc, tb.DadoPessoalDetectado):
                msg = ("Bloqueado por proteção de dados: a pasta pública passou a conter dado pessoal "
                       "identificado. Nada foi lido nem gravado. " + msg)
            logger.warning("[FVS] %s: %s", coletor, msg)
            log = await db.get(FvsSincronizacao, log.id)
            est = await estado(db, coletor)
            log.situacao, log.erro, log.concluido_em = "erro", msg, datetime.utcnow()
            est.situacao = "bloqueado_lgpd" if isinstance(exc, tb.DadoPessoalDetectado) else "erro"
            est.ultima_tentativa = datetime.utcnow()
            est.mensagem = msg
            await db.commit()
            return {"fonte": coletor, "situacao": "erro", "mensagem": msg}


async def _gravar_municipios(db: AsyncSession, municipios: list[dict]) -> None:
    atuais = {m.ibge6: m for m in (await db.execute(select(FvsMunicipio))).scalars()}
    for m in municipios:
        reg = atuais.get(m["ibge6"])
        if reg:
            reg.nome, reg.regiao_saude, reg.atualizado_em = m["nome"], m["regiao_saude"], datetime.utcnow()
        else:
            db.add(FvsMunicipio(**m, fonte="FVS-RCP/AM — planilha de municípios do painel PQA-VS"))
    await db.flush()


async def _substituir(db: AsyncSession, fonte: str, linhas: list[dict], sinc_id: int) -> dict:
    cols = (FvsSerie.indicador, FvsSerie.ibge6, FvsSerie.ano, FvsSerie.periodo_tipo, FvsSerie.periodo,
            FvsSerie.recorte, FvsSerie.recorte_valor, FvsSerie.valor, FvsSerie.texto)
    antes = {tuple(r[:7]): (r[7], r[8]) for r in (await db.execute(select(*cols).where(FvsSerie.fonte == fonte)))}
    depois = {_chave(r): (r["valor"], r["texto"]) for r in linhas}
    novos = sum(1 for k in depois if k not in antes)
    alterados = sum(1 for k, v in depois.items() if k in antes and antes[k] != v)
    removidos = sum(1 for k in antes if k not in depois)
    await db.execute(delete(FvsSerie).where(FvsSerie.fonte == fonte))
    for i in range(0, len(linhas), 5000):
        await db.execute(insert(FvsSerie), [{**r, "fonte": fonte, "sincronizacao_id": sinc_id} for r in linhas[i:i + 5000]])
    return {"novos": novos, "alterados": alterados, "removidos": removidos}


async def sincronizar_todas(db: AsyncSession, origem: str = "agendada", usuario: str | None = None,
                            forcar: bool = False) -> list[dict]:
    # PQA-VS primeiro: é dele que vem a lista dos 62 municípios com a Região de Saúde
    return [await sincronizar(db, c, origem, usuario, forcar) for c in COLETORES]


async def historico(db: AsyncSession, fonte: str | None = None, limite: int = 50) -> list[dict]:
    q = select(FvsSincronizacao).order_by(desc(FvsSincronizacao.iniciado_em)).limit(limite)
    if fonte:
        q = q.where(FvsSincronizacao.fonte == fonte)
    return [{"id": s.id, "fonte": s.fonte, "origem": s.origem, "usuario": s.usuario, "iniciado_em": s.iniciado_em,
             "concluido_em": s.concluido_em, "situacao": s.situacao, "registros": s.registros, "novos": s.novos,
             "alterados": s.alterados, "removidos": s.removidos, "publicado_na_fonte": s.publicado_na_fonte,
             "validacao": s.validacao, "erro": s.erro}
            for s in (await db.execute(q)).scalars()]
