"""
Diagnóstico / Cobertura da Atenção Básica — Apuí/AM (aba do eGestor / SIAPS).

Tudo vem da API PÚBLICA do e-Gestor APS (relatorioaps-prd.saude.gov.br/financiamento/pagamento, sem login):
  • AGRUPADO  → parcelas publicadas, competência CNES de cada uma, TOTAL oficial da parcela e valor
                pago por plano orçamentário (série histórica completa)
  • COMPLETO  → quantidades (teto, credenciadas, homologadas, pagas) e valores de cada programa
  • validação por equipe (relatorio-detalhado) → situação de pagamento e pendências de CADA equipe

Regras (21/10/2026): nada é estimado nem preenchido com valor fixo. Parcela ainda não publicada aparece
como "não publicada" (antes a tela mostrava dados fixos de JUN/2026 rotulados como da parcela pedida).
A varredura manual do SCNES (monitor_scnes_service, 06/09/2026) é mostrada à parte, com a data da
varredura e o CNS mascarado, porque não é revalidada automaticamente.
"""
from __future__ import annotations

import asyncio
import logging
import re
from datetime import datetime, timedelta

import httpx

logger = logging.getLogger(__name__)

IBGE_6 = "130014"
IBGE_7 = "1300144"
MUNICIPIO = "Apuí"
UF = "AM"
FONTE = "e-Gestor APS — relatório público de pagamento (relatorioaps-prd.saude.gov.br)"
URL_PAGAMENTO = "https://relatorioaps-prd.saude.gov.br/financiamento/pagamento"
MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]
VARREDURA_SCNES = "06/09/2026"
TIPOS = {48: "eSF", 49: "eAP", 5: "eSB", 37: "eSB", 42: "eMulti", 7: "eSFR"}

_TTL = timedelta(hours=4)
_cache: dict[str, dict] = {}          # parcela → {"dados", "ts"}; "_agrupado" → série histórica

# compatibilidade com o job antigo do histórico (hoje a série vem do AGRUPADO a cada consulta)
HISTORICO_INCENTIVOS: list[dict] = []
_MAPA_COMP: dict[str, str] = {}


def rotulo_comp(comp_cnes: str) -> str:
    """'202608' → 'AGO/2026'."""
    return f"{MESES[int(comp_cnes[4:6]) - 1]}/{comp_cnes[:4]}"


def brl(v: float) -> str:
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _parcela_atual() -> str | None:
    """Parcela mais recente publicada já conhecida (None = descobrir na próxima consulta)."""
    serie = (_cache.get("_agrupado") or {}).get("dados") or []
    return serie[-1]["parcela_code"] if serie else None


async def _get(client: httpx.AsyncClient, params: dict) -> dict:
    r = await client.get(URL_PAGAMENTO, params=params, headers={"Accept": "application/json"})
    r.raise_for_status()
    return r.json()


async def serie_historica(client: httpx.AsyncClient, forcar: bool = False) -> list[dict]:
    """Todas as parcelas publicadas do município (AGRUPADO): total oficial e valor pago por plano."""
    c = _cache.get("_agrupado")
    if c and not forcar and datetime.utcnow() - c["ts"] < _TTL:
        return c["dados"]
    ano = datetime.utcnow().year
    d = await _get(client, {"unidadeGeografica": "MUNICIPIO", "coUf": IBGE_7[:2], "coMunicipio": IBGE_6,
                            "nuParcelaInicio": f"{ano - 1}01", "nuParcelaFim": f"{ano}12", "tipoRelatorio": "AGRUPADO"})
    serie = []
    for g in sorted(d.get("agrupamentos") or [], key=lambda g: g["nuParcela"]):
        planos = {(p.get("dsPlanoOrcamentario") or "").strip(): float(p.get("vlTotalCusteio") or 0) + float(p.get("vlTotalImplantacao") or 0)
                  for p in g.get("listaPagamentoPlanoOrcamentario") or []}
        serie.append({"parcela_code": g["nuParcela"], "parcela": f"{int(g['nuParcela'][4:])}/12",
                      "ano_parcela": g["nuParcela"][:4], "comp_cnes": g["nuCompCnes"],
                      "competencia": rotulo_comp(g["nuCompCnes"]), "total": float(g.get("total") or 0),
                      "planos": planos})
    _cache["_agrupado"] = {"dados": serie, "ts": datetime.utcnow()}
    HISTORICO_INCENTIVOS[:] = serie
    _MAPA_COMP.update({s["parcela_code"]: s["competencia"] for s in serie})
    return serie


async def _completo(parcela: str) -> dict:
    from services.egestor_aps import buscar_completo
    return (await buscar_completo(parcela_inicio=parcela, parcela_fim=parcela)).get("detalhado") or {}


def _mascarar_cns(texto: str) -> str:
    """CNS (15 dígitos) aparece só com os 4 últimos dígitos (LGPD: minimização)."""
    return re.sub(r"\b\d{11}(\d{4})\b", lambda m: "***********" + m.group(1), texto)


def varredura_scnes() -> dict:
    """Varredura manual do SCNES (dados de monitor_scnes_service, sem alteração; só o CNS é mascarado)."""
    from services.monitor_scnes_service import _EQUIPES, _PENDENCIAS
    sev = lambda s: "critico" if "CRÍTICO" in s else "alerta" if "MÉDIO" in s else "info"  # noqa: E731
    pend: dict[str, list[dict]] = {}
    for p in _PENDENCIAS:
        pend.setdefault(p["equipe"], []).append({"sev": sev(p["sev"]), "desc": _mascarar_cns(p["desc"])})
    equipes = [{"nome": e["nome"], "score": e["score"], "nivel": e["nivel"], "vinculadas": e["vinculadas"],
                "pendencias": pend.get(e["nome"], [])} for e in _EQUIPES]
    return {
        "data_varredura": VARREDURA_SCNES, "equipes": equipes,
        "score_medio": round(sum(e["score"] for e in _EQUIPES) / len(_EQUIPES), 1) if _EQUIPES else None,
        "total_vinculadas": sum(e["vinculadas"] for e in _EQUIPES),
        "pendencias_total": len(_PENDENCIAS),
        "pendencias_criticas": sum(1 for p in _PENDENCIAS if "CRÍTICO" in p["sev"]),
        "aviso": (f"Varredura manual do SCNES feita em {VARREDURA_SCNES}. Não é revalidada automaticamente: "
                  "confira cada item no SCNES e na validação oficial por equipe antes de agir."),
    }


def _suspenso(situacao: str | None) -> bool:
    s = (situacao or "").upper()
    return "SUSPENS" in s and not s.startswith(("N", "NÃ"))


def diagnosticos(det: dict, validacao: list[dict], serie: list[dict], parcela: str) -> list[dict]:
    """Só fatos publicados pelo e-Gestor na parcela — nenhuma estimativa nem palpite."""
    out: list[dict] = []

    def add(sev, titulo, texto):
        out.append({"severidade": sev, "titulo": titulo, "texto": texto, "fonte": FONTE})

    esb = det.get("esb") or {}
    progs = [("eSF", det.get("esf") or {}, "qt_credenciadas", "qt_homologadas", "qt_pagas"),
             ("eSB 40h", {**esb, "_pagas": (esb.get("qt_40h_pagas_modal_i") or 0) + (esb.get("qt_40h_pagas_modal_ii") or 0)} if esb else {},
              "qt_40h_credenciadas", "qt_40h_homologadas", "_pagas"),
             ("eMulti", det.get("emulti") or {}, "qt_credenciadas", "qt_homologadas", "qt_pagas"),
             ("eSFR (ribeirinha)", det.get("esfrb") or {}, "qt_credenciadas", "qt_homologadas", "qt_pagas"),
             ("ACS", det.get("acs") or {}, "qt_direto_credenciado", None, "qt_direto_pago"),
             ("Microscopistas", det.get("microscopistas") or {}, "qt_credenciados", None, "qt_pagos")]
    for nome, d, k_cred, k_hom, k_pag in progs:
        cred, pag = d.get(k_cred), d.get(k_pag)
        if cred is None or pag is None:
            continue
        hom = f" · homologadas: {d.get(k_hom)}" if k_hom and d.get(k_hom) is not None else ""
        if pag < cred:
            h = d.get(k_hom) if k_hom else None
            motivo = (" As credenciadas não homologadas não entram na validação por equipe do pagamento — conferir a homologação no e-Gestor."
                      if h is not None and h == pag else
                      " A validação por equipe abaixo mostra a situação publicada de cada equipe." if nome in ("eSF", "eSB 40h", "eMulti", "eSFR (ribeirinha)") else
                      " O e-Gestor publica apenas os totais deste programa.")
            add("alerta", f"{nome}: {cred - pag} credenciada(s) sem pagamento", f"Credenciadas: {cred}{hom} · pagas: {pag}.{motivo}")
        else:
            add("ok", f"{nome}: {pag} paga(s) de {cred} credenciada(s)", f"Credenciadas: {cred}{hom} · pagas: {pag}.")

    tetos = det.get("tetos") or {}
    esf = det.get("esf") or {}
    if tetos.get("esf") and esf.get("qt_credenciadas") is not None and esf["qt_credenciadas"] < tetos["esf"]:
        add("info", f"eSF: {tetos['esf'] - esf['qt_credenciadas']} vaga(s) de credenciamento abaixo do teto",
            f"Teto eSF publicado: {tetos['esf']} · credenciadas: {esf['qt_credenciadas']}.")

    for rot, campo in (("Qualidade eSF/eAP", "classificacao_qualidade_esf"), ("Vínculo e Acompanhamento eSF/eAP", "classificacao_vinculo_esf"),
                       ("Qualidade eMulti", "classificacao_qualidade_emulti")):
        v = det.get(campo)
        if v:
            add("ok" if v.upper() in ("OTIMO", "ÓTIMO", "BOM") else "alerta", f"Classificação {rot}: {v}",
                "Classificação oficial publicada na parcela.")

    for e in [e for e in validacao if e["pendencias"]]:
        add("critico" if any(_suspenso(p["situacao"]) for p in e["pendencias"]) else "alerta",
            f"Validação {e['tipo'] or ''} — {e['equipe'] or 'INE ' + e['ine']}",
            "; ".join(f"{p['rotulo']}: {p['situacao']}" for p in e["pendencias"]) + f" (CNES {e['cnes'] or '—'}).")
    if validacao and not any(e["pendencias"] for e in validacao):
        add("ok", f"Validação por equipe: {len(validacao)} equipes sem pendência",
            "Nenhuma suspensão ou pendência publicada para as equipes nesta parcela.")

    i = next((k for k, s in enumerate(serie) if s["parcela_code"] == parcela), None)
    if i:
        dif = serie[i]["total"] - serie[i - 1]["total"]
        if abs(dif) >= 0.01:
            add("info" if dif > 0 else "alerta", f"Total da parcela {'subiu' if dif > 0 else 'caiu'} {brl(abs(dif))}",
                f"Comparado à parcela anterior ({serie[i - 1]['parcela']} {serie[i - 1]['ano_parcela']}, competência {serie[i - 1]['competencia']}).")
    return out


async def _validacao_equipes(comp_cnes: str) -> list[dict]:
    from services import egestor_diagnostico as dg
    comp = f"{comp_cnes[:4]}-{comp_cnes[4:]}"
    async with httpx.AsyncClient(timeout=90) as c:
        r = (await dg._pagamento_competencias(IBGE_7, [comp], c)).get(comp) or {}
    vistos, saida = set(), []
    for e in r.get("equipes", []):
        if (e["ine"], e["co_componente"]) in vistos:
            continue
        vistos.add((e["ine"], e["co_componente"]))
        saida.append({"ine": e["ine"], "equipe": None, "tipo": TIPOS.get(e["co_componente"]), "componente": e["componente"],
                      "cnes": e["cnes"], "st_pagamento": e["st_pagamento"], "pendencias": e["pendencias"],
                      "ine_vinculada": e["ine_vinculada"], "equipe_vinculada": None})
    return sorted(saida, key=lambda x: (x["tipo"] or "", x["ine"]))


async def _nomes_equipes(validacao: list[dict]) -> None:
    """Nome oficial das equipes (lista pública do SIAPS já gravada no banco), quando disponível."""
    try:
        from sqlalchemy import select
        from database import AsyncSessionLocal
        from models.equipe_siaps import EquipeSiaps
        from models.municipio import Municipio
        async with AsyncSessionLocal() as db:
            mid = (await db.execute(select(Municipio.id).where(Municipio.codigo_ibge == IBGE_7))).scalar_one_or_none()
            if mid is None:
                return
            nomes = {e.ine: e.nome for e in (await db.execute(select(EquipeSiaps).where(EquipeSiaps.municipio_id == mid))).scalars()}
        for v in validacao:
            v["equipe"] = nomes.get(v["ine"])
            v["equipe_vinculada"] = nomes.get(v["ine_vinculada"]) if v.get("ine_vinculada") else None
    except Exception as exc:  # noqa: BLE001 — nomes são só para leitura
        logger.debug("nomes de equipes indisponíveis: %s", exc)


async def buscar_diagnostico_cobertura(parcela: str | None = None, forcar_atualizacao: bool = False) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            serie = await serie_historica(client, forcar_atualizacao)
        except (httpx.HTTPError, ValueError, KeyError) as e:
            serie = (_cache.get("_agrupado") or {}).get("dados") or []
            if not serie:
                return {"situacao_dado": "nao_disponivel", "fonte": FONTE,
                        "nota": f"e-Gestor APS indisponível agora ({e.__class__.__name__}). Nenhum dado foi estimado."}
    publicadas = [s["parcela_code"] for s in serie]
    parcela = parcela or publicadas[-1]
    base = {"municipio": MUNICIPIO, "uf": UF, "ibge": IBGE_7, "fonte": FONTE,
            "parcelas": [{"val": s["parcela_code"], "label": f"{s['competencia']} ({int(s['parcela_code'][4:])}ª parcela/{s['ano_parcela']})"}
                         for s in reversed(serie)],
            "ultima_publicada": publicadas[-1], "historico_incentivos": serie, "scnes_varredura": varredura_scnes()}
    if parcela not in publicadas:
        u = serie[-1]
        return {**base, "situacao_dado": "nao_publicada", "parcela_code": parcela,
                "nota": f"A parcela {int(parcela[4:])}/{parcela[:4]} ainda não foi publicada pelo Ministério da Saúde. "
                        f"Última publicada: {u['parcela']} de {u['ano_parcela']} (competência {u['competencia']})."}

    c = _cache.get(parcela)
    if c and not forcar_atualizacao and datetime.utcnow() - c["ts"] < _TTL:
        return {**base, **c["dados"]}
    s = next(x for x in serie if x["parcela_code"] == parcela)
    try:
        det = await _completo(parcela)
        if not det:
            raise ValueError("resposta COMPLETO vazia")
    except Exception as e:  # noqa: BLE001
        if c:
            return {**base, **c["dados"], "aviso_atualizacao": f"Falha ao atualizar agora; mostrando a coleta de {c['ts']:%d/%m/%Y %H:%M} UTC."}
        return {**base, "situacao_dado": "nao_disponivel", "parcela_code": parcela,
                "nota": f"e-Gestor APS indisponível para a parcela ({e.__class__.__name__}). Nenhum dado foi estimado."}
    try:
        validacao = await _validacao_equipes(s["comp_cnes"])
        await _nomes_equipes(validacao)
    except Exception as e:  # noqa: BLE001
        logger.warning("validação por equipe indisponível (parcela %s): %s", parcela, e)
        validacao = []
    esf, eap = det.get("esf") or {}, det.get("eap") or {}
    pago_esf_eap = next((v for k, v in s["planos"].items() if k.startswith("Equipes de Sa")), None)
    dados = {
        "situacao_dado": "oficial_validado", "parcela_code": parcela, "parcela": int(parcela[4:]),
        "ano_parcela": parcela[:4], "competencia": s["competencia"], "nu_comp_cnes": s["comp_cnes"],
        "total_parcela": s["total"], "planos": s["planos"],
        "populacao": det.get("populacao"), "ano_ref_populacao": det.get("ano_ref_populacao"),
        "faixa_equidade_esf": det.get("faixa_equidade_esf"),
        "classificacao_vinculo_esf": det.get("classificacao_vinculo_esf"),
        "classificacao_qualidade_esf": det.get("classificacao_qualidade_esf"),
        "classificacao_qualidade_emulti": det.get("classificacao_qualidade_emulti"),
        "tetos": det.get("tetos") or {},
        "esf": esf, "eap": eap,
        "esf_eap_pago_plano": pago_esf_eap,
        "esf_eap_diferenca_bruto_pago": (round(pago_esf_eap - (esf.get("vl_total_bruto") or 0) - (eap.get("vl_total_bruto") or 0), 2)
                                         if pago_esf_eap is not None else None),
        "emulti": det.get("emulti") or {}, "esb": det.get("esb") or {}, "acs": det.get("acs") or {},
        "esfr": det.get("esfrb") or {}, "microscopista": det.get("microscopistas") or {},
        "per_capita": det.get("per_capita") or {}, "pse": det.get("pse") or {},
        "validacao_equipes": validacao,
        "diagnosticos": diagnosticos(det, validacao, serie, parcela),
        "coletado_em": datetime.utcnow().isoformat() + "Z",
    }
    _cache[parcela] = {"dados": dados, "ts": datetime.utcnow()}
    return {**base, **dados}
