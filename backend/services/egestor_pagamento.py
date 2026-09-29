"""
Comunicação automática com o e-Gestor APS (relatório público de pagamento, sem login).

  GET relatorioaps-prd.saude.gov.br/financiamento/pagamento?tipoRelatorio=AGRUPADO&coMunicipio=<6>…
      → parcelas publicadas do município e o processo (coProcesso) de cada uma
  GET …/financiamento/pagamento/componente-pagamento?coProcesso=…&coPlanoOrcamentario=…
      → componentes pagos em cada plano orçamentário (eSF, eAP, eSB, eMulti, eSFR, ACS…)
  GET …/financiamento/pagamento/municipio/relatorio-detalhado?…
      → valores do componente, classificação Qualidade/Vínculo e a validação de CADA equipe
        (stPagamento, suspensões por duplicidade, produção, composição, carga horária…)

Conferido em 29/09/2026 para Apuí (parcela 202609 / CNES 202607): eSF 9 equipes, eSB 10 equipes,
Qualidade BOM, Vínculo BOM. É o mesmo dado das telas do e-Gestor — nada é recalculado aqui.
Profissionais (CNS) publicados no detalhamento de ACS NÃO são gravados.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.egestor_pagamento import EgestorPagamentoComponente, EgestorValidacaoEquipe

logger = logging.getLogger(__name__)

BASE = "https://relatorioaps-prd.saude.gov.br/financiamento/pagamento"
TIMEOUT = 90
PARCELAS_GUARDADAS = 3

# Situações que o e-Gestor publica como "tudo certo"; qualquer outra vira pendência da equipe.
OK = {"VALIDO", "VALIDA", "ATIVO", "ATIVA", "NAO SUSPENSO", "NAO SUSPENSA", "NAO", "PAGO", "-", ""}
ROTULOS = {
    "stPagamento": "Pagamento", "stEquipeAtiva": "Equipe ativa", "stEsbAtiva": "eSB ativa",
    "stUnidadeValida": "Unidade válida", "stTipoEquipe": "Tipo de equipe",
    "stSuspensaoDuplicidadeEsf": "Suspensão por duplicidade", "stSuspensaoProducao": "Suspensão por falta de produção",
    "stSuspensaoComposicaoProprc": "Suspensão por composição", "stSuspensaoOrgControle": "Suspensão por órgão de controle",
    "stPossuiProfAcimacargahora": "Profissional acima da carga horária", "stVinculoValido": "Vínculo eSB × eSF/eAP",
}
# Informativos (não são suspensão): ex. eSB com carga horária compartilhada com a UOM.
INFORMATIVOS = {"stEsbUom"}
TIPO_POR_COMPONENTE = {48: "eSF", 49: "eAP", 5: "eSB", 37: "eSB", 42: "eMulti", 7: "eSFR"}


class EgestorIndisponivel(RuntimeError):
    pass


def _norm(v) -> str:
    import unicodedata
    s = unicodedata.normalize("NFKD", str(v or "")).encode("ascii", "ignore").decode()
    return s.strip().upper()


def pendencias(validacao: dict) -> list[dict]:
    return [{"campo": k, "rotulo": ROTULOS.get(k, k), "situacao": v}
            for k, v in validacao.items()
            if k.startswith("st") and k not in INFORMATIVOS and _norm(v) not in OK]


async def _get(client: httpx.AsyncClient, url: str, params: dict):
    r = await client.get(url, params=params)
    r.raise_for_status()
    return r.json()


async def buscar(ibge: str, parcelas: int = PARCELAS_GUARDADAS, client: httpx.AsyncClient | None = None) -> list[dict]:
    """Últimas parcelas publicadas do município com componentes e validação por equipe."""
    ibge6, uf = ibge[:6], ibge[:2]
    fechar = client is None
    client = client or httpx.AsyncClient(timeout=TIMEOUT)
    try:
        ano = datetime.utcnow().year
        ag = await _get(client, BASE, {"unidadeGeografica": "MUNICIPIO", "coUf": uf, "coMunicipio": ibge6,
                                       "nuParcelaInicio": f"{ano - 1}01", "nuParcelaFim": f"{ano}12",
                                       "tipoRelatorio": "AGRUPADO"})
        grupos = sorted(ag.get("agrupamentos") or [], key=lambda g: g["nuParcela"], reverse=True)[:parcelas]
        comp = await _get(client, BASE, {"unidadeGeografica": "MUNICIPIO", "coUf": uf, "coMunicipio": ibge6,
                                         "nuParcelaInicio": grupos[-1]["nuParcela"] if grupos else f"{ano}01",
                                         "nuParcelaFim": grupos[0]["nuParcela"] if grupos else f"{ano}12",
                                         "tipoRelatorio": "COMPLETO"}) if grupos else {}
        munic = {p["nuParcela"]: p for p in comp.get("pagamentos") or []}
        saida = []
        for g in grupos:
            componentes = []
            for plano in g.get("listaPagamentoPlanoOrcamentario") or []:
                cs = await _get(client, f"{BASE}/componente-pagamento",
                                {"coProcesso": g["coProcesso"], "coPlanoOrcamentario": plano["coSeqPlanoOrcamentario"]})
                for c in cs:
                    d = await _get(client, f"{BASE}/municipio/relatorio-detalhado", {
                        "nuParcela": c["nuParcela"], "nuCompCnes": c["nuCompCnes"], "coMunicipio": ibge6,
                        "coComponentePagamento": c["coComponentePagamento"], "coProcesso": c["coProcesso"],
                        "coProcessoPagamento": c["coProcessoPagamento"], "coProcessoValidacao": c["coProcessoValidacao"],
                        "coPlanoOrcamentario": c["coPlanoOrcamentario"]})
                    d = d if isinstance(d, dict) else {}
                    componentes.append({"co_plano": plano["coSeqPlanoOrcamentario"], "ds_plano": plano["dsPlanoOrcamentario"],
                                        "co_componente": c["coComponentePagamento"],
                                        "ds_componente": c["dsComponentePagamento"].strip(),
                                        "resumo": {k: v for k, v in d.items() if not isinstance(v, (list, dict))},
                                        "equipes": d.get("validacoesEquipes") or []})
            m = munic.get(g["nuParcela"], {})
            saida.append({"nu_parcela": g["nuParcela"], "nu_comp_cnes": g["nuCompCnes"],
                          "classificacao_qualidade": m.get("dsClassificacaoQualidadeEsfEap"),
                          "classificacao_vinculo": m.get("dsClassificacaoVinculoEsfEap"),
                          "componentes": componentes})
        return saida
    except (httpx.HTTPError, ValueError, KeyError, TypeError) as e:
        raise EgestorIndisponivel(f"e-Gestor (relatório público de pagamento) indisponível: {e}") from e
    finally:
        if fechar:
            await client.aclose()


async def sincronizar(db: AsyncSession, municipio_id: int, ibge: str) -> dict:
    """Grava as últimas parcelas. Parcela sem componentes no e-Gestor não apaga o que já existe."""
    parcelas = await buscar(ibge)
    gravadas = []
    for p in parcelas:
        if not p["componentes"]:
            continue
        for tabela in (EgestorPagamentoComponente, EgestorValidacaoEquipe):
            await db.execute(delete(tabela).where(tabela.municipio_id == municipio_id,
                                                  tabela.nu_parcela == p["nu_parcela"]))
        agora = datetime.utcnow()
        for c in p["componentes"]:
            r = c["resumo"]
            db.add(EgestorPagamentoComponente(
                municipio_id=municipio_id, nu_parcela=p["nu_parcela"], nu_comp_cnes=p["nu_comp_cnes"],
                co_plano=c["co_plano"], ds_plano=c["ds_plano"], co_componente=c["co_componente"],
                ds_componente=c["ds_componente"], vl_total=r.get("vlTotal"), vl_desconto=r.get("vlDesconto"),
                vl_ajuste=r.get("vlAjuste"),
                classificacao_qualidade=r.get("dsClassificacaoQualidade") or (p["classificacao_qualidade"] if c["co_componente"] in (48, 49) else None),
                classificacao_vinculo=r.get("dsClassificacaoVinculo") or (p["classificacao_vinculo"] if c["co_componente"] in (48, 49) else None),
                resumo=json.dumps(r, ensure_ascii=False), coletado_em=agora))
            vistos = set()
            for e in c["equipes"]:
                ine = str(e.get("coEquipe") or e.get("coEquipeEsb") or "").zfill(10)
                if not ine.strip("0") or ine in vistos:
                    continue
                vistos.add(ine)
                vinc = e.get("coEquipeEsfEap")
                db.add(EgestorValidacaoEquipe(
                    municipio_id=municipio_id, nu_parcela=p["nu_parcela"], co_componente=c["co_componente"],
                    ine=ine, ine_vinculada=str(vinc).zfill(10) if vinc else None,
                    cnes=str(e.get("codigoEstabelecimento") or e.get("coCnes") or "") or None,
                    st_pagamento=e.get("stPagamento"),
                    pendencias=json.dumps(pendencias(e), ensure_ascii=False),
                    payload=json.dumps(e, ensure_ascii=False), coletado_em=agora))
        gravadas.append(p["nu_parcela"])
    # mantém só as últimas parcelas
    antigas = (await db.execute(select(EgestorPagamentoComponente.nu_parcela)
                                .where(EgestorPagamentoComponente.municipio_id == municipio_id)
                                .distinct())).scalars().all()
    for velha in sorted(antigas, reverse=True)[PARCELAS_GUARDADAS:]:
        for tabela in (EgestorPagamentoComponente, EgestorValidacaoEquipe):
            await db.execute(delete(tabela).where(tabela.municipio_id == municipio_id, tabela.nu_parcela == velha))
    await db.commit()
    return {"ok": bool(gravadas), "parcelas": gravadas,
            "motivo": None if gravadas else "e-Gestor não publicou pagamento para o município"}


def _parcela_rotulo(nu: str) -> str:
    return f"{int(nu[4:])}ª parcela/{nu[:4]}"


def _mes(comp: str) -> str:
    return f"{['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][int(comp[4:]) - 1]}/{comp[:4]}"


async def painel(db: AsyncSession, municipio_id: int, parcela: str | None = None) -> dict:
    from models.equipe_siaps import EquipeSiaps
    parcelas = sorted((await db.execute(select(EgestorPagamentoComponente.nu_parcela)
                                        .where(EgestorPagamentoComponente.municipio_id == municipio_id)
                                        .distinct())).scalars().all(), reverse=True)
    if not parcelas:
        return {"situacao_dado": "nao_disponivel", "parcelas": [],
                "fonte": "e-Gestor APS — relatório público de pagamento (relatorioaps-prd.saude.gov.br)"}
    parcela = parcela if parcela in parcelas else parcelas[0]
    comps = list((await db.execute(select(EgestorPagamentoComponente).where(
        EgestorPagamentoComponente.municipio_id == municipio_id, EgestorPagamentoComponente.nu_parcela == parcela)
        .order_by(EgestorPagamentoComponente.co_plano, EgestorPagamentoComponente.co_componente))).scalars())
    vals = list((await db.execute(select(EgestorValidacaoEquipe).where(
        EgestorValidacaoEquipe.municipio_id == municipio_id, EgestorValidacaoEquipe.nu_parcela == parcela))).scalars())
    nomes = {e.ine: e.nome for e in (await db.execute(
        select(EquipeSiaps).where(EquipeSiaps.municipio_id == municipio_id))).scalars()}
    desc = {c.co_componente: c.ds_componente for c in comps}
    equipes = []
    for v in sorted(vals, key=lambda v: (v.co_componente, nomes.get(v.ine, v.ine))):
        pend = json.loads(v.pendencias)
        equipes.append({"ine": v.ine, "equipe": nomes.get(v.ine), "tipo": TIPO_POR_COMPONENTE.get(v.co_componente),
                        "componente": desc.get(v.co_componente), "cnes": v.cnes, "ine_vinculada": v.ine_vinculada,
                        "equipe_vinculada": nomes.get(v.ine_vinculada) if v.ine_vinculada else None,
                        "co_componente": v.co_componente, "st_pagamento": v.st_pagamento,
                        "pendencias": pend, "ok": not pend, "detalhe": json.loads(v.payload)})
    esf = next((c for c in comps if c.co_componente == 48), None)
    return {
        "situacao_dado": "oficial_validado",
        "fonte": "e-Gestor APS — relatório público de pagamento (relatorioaps-prd.saude.gov.br)",
        "parcelas": [{"nu_parcela": p, "rotulo": _parcela_rotulo(p)} for p in parcelas],
        "parcela": parcela, "parcela_rotulo": _parcela_rotulo(parcela),
        "competencia_cnes": comps[0].nu_comp_cnes if comps else None,
        "competencia_cnes_rotulo": _mes(comps[0].nu_comp_cnes) if comps else None,
        "coletado_em": max((c.coletado_em for c in comps), default=None),
        "classificacao_qualidade": esf.classificacao_qualidade if esf else None,
        "classificacao_vinculo": esf.classificacao_vinculo if esf else None,
        "total": round(sum(c.vl_total or 0 for c in comps), 2),
        "descontos": round(sum(c.vl_desconto or 0 for c in comps), 2),
        "componentes": [{"co_plano": c.co_plano, "plano": c.ds_plano, "co_componente": c.co_componente,
                         "componente": c.ds_componente, "vl_total": c.vl_total, "vl_desconto": c.vl_desconto,
                         "vl_ajuste": c.vl_ajuste, "classificacao_qualidade": c.classificacao_qualidade,
                         "classificacao_vinculo": c.classificacao_vinculo, "resumo": json.loads(c.resumo)}
                        for c in comps if (c.vl_total or c.vl_desconto)],
        "equipes": equipes,
        "equipes_com_pendencia": sum(1 for e in equipes if not e["ok"]),
    }
