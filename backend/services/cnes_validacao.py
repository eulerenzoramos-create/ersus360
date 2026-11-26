"""
Validações automáticas das equipes da APS — retrato do CNES × Matriz Normativa × e-Gestor × SIAPS.

Determinístico: cada critério compara o dado oficial com a regra vigente (aps_parametros / fns_portarias_normas)
e devolve a fundamentação. A IA não decide nada aqui; só interpreta e recomenda sobre este resultado.

Fontes de cada informação (diretriz do gestor):
  • equipes, profissionais, CBO e carga horária ......... CNES (models.cnes_retrato — API pública)
  • composição mínima e carga exigida ................... Matriz Normativa (PRC 2 e PRC 6 conferidas)
  • credenciamento, homologação, pagamento, suspensões .. e-Gestor APS (relatório público de pagamento)
  • tipo oficial da equipe (eSF/eSFR/eSB/eMulti) ........ SIAPS (API pública de equipes)
  • risco ................................................ cruzamento das fontes acima

Situações de um critério: conforme | irregular | atencao | nao_verificavel (sem dado ou regra não conferida).
"""
from __future__ import annotations

import json
from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from services import aps_matriz_normativa as mn
from services import aps_parametros as ap
from services import fns_portarias_normas as N

CONFORME, IRREGULAR, ATENCAO, NAO_VERIFICAVEL = "conforme", "irregular", "atencao", "nao_verificavel"
_ORDEM = {IRREGULAR: 3, ATENCAO: 2, NAO_VERIFICAVEL: 1, CONFORME: 0}
CO_ESF, CO_ESFR, CO_ESB40, CO_ESB_DIF, CO_EMULTI, CO_EAP = 48, 7, 5, 37, 42, 49


def _fund(disp: str) -> dict:
    d = N.DISPOSITIVOS[disp]
    n = N.NORMAS[d["norma"]]
    return {"norma": n["nome"], "dispositivo": d["dispositivo"], "url": n["url"], "chave": disp}


def _v(params: dict, chave: str) -> float | None:
    return (params.get(chave) or {}).get("valor")


def _cat(cbo: str) -> str | None:
    cbo = (cbo or "").upper()
    for k in ("acs", "tsb", "medico", "enfermeiro", "aux_tec_enfermagem", "dentista", "asb_tsb"):
        if cbo.startswith(mn.CATEGORIAS[k]["cbo"]):
            return "asb_tsb" if k == "tsb" else k
    return None


def _crit(criterio, exigencia, situacao_cnes, diferenca, situacao, disp, observacao=None):
    return {"criterio": criterio, "exigencia": exigencia, "situacao_cnes": situacao_cnes, "diferenca": diferenca,
            "situacao": situacao, "fundamentacao": _fund(disp) if disp else None, "observacao": observacao}


def tipo_oficial(eq: dict, siaps: dict[str, str], egestor_eq: dict[str, list]) -> str:
    if eq["ine"] in siaps:
        return siaps[eq["ine"]]
    if any(r["co"] == CO_ESFR for r in egestor_eq.get(eq["ine"], [])):
        return "eSFR"
    return {"70": "eSF", "71": "eSB", "72": "eMulti"}.get(eq["tp_equipe"], eq["sigla"] or eq["tp_equipe"])


MODALIDADES_EMULTI = (("ampliada", "Ampliada"), ("complementar", "Complementar"), ("estrategica", "Estratégica"))
_QT_EMULTI = {"qtAmpliada": "Ampliada", "qtIntermunicipal": "Ampliada - Intermunicipal",
              "qtComplementar": "Complementar", "qtEstrategica": "Estratégica"}


def modalidades_emulti(egestor: dict) -> dict:
    """Modalidade oficial das eMulti pelo e-Gestor (componente Custeio - eMulti): quantitativo credenciado e pago
    por modalidade (_referencia). Por equipe: só quando é inequívoco — todas as eMulti pagas na parcela estão numa
    única modalidade (o relatório público não traz a modalidade em cada linha de equipe)."""
    ref = ((egestor.get("resumos") or {}).get(CO_EMULTI) or {}).get("_referencia") or {}
    cred = {_QT_EMULTI[k]: v for k, v in (ref.get("quantitativoCredenciado") or {}).items() if k in _QT_EMULTI and v}
    pago = {_QT_EMULTI[k]: v for k, v in (ref.get("quantitativoPagamento") or {}).items() if k in _QT_EMULTI and v}
    valores = {x.get("dsSubTipoEquipe"): x.get("vlCusteio") for x in ref.get("listaValoresReferencia") or []}
    pagas = sorted(ine for ine, regs in (egestor.get("equipes") or {}).items()
                   if any(r["co"] == CO_EMULTI and (r["st_pagamento"] or "").upper() == "PAGO" for r in regs))
    por_ine = {}
    if len(pago) == 1 and pagas and next(iter(pago.values())) == len(pagas):
        por_ine = {ine: next(iter(pago)) for ine in pagas}
    return {"credenciadas": cred, "pagas": pago, "valores_referencia": valores, "por_ine": por_ine,
            "fonte": f"e-Gestor APS — Custeio eMulti, parcela {egestor.get('parcela')}" if ref else None}


def _lista(vs: list[dict]) -> str:
    return ", ".join(f"{v.get('sigla') or ''} {v['nome']} ({v['ine']})".strip() for v in vs) or "nenhuma"


def resumo_vinculos(eq: dict, tipo: str, coletados: bool = True) -> str | None:
    """Resumo para a coluna "Vínculos" (dado oficial do CNES; None = retrato sem vínculos coletados)."""
    if not coletados or ("equipes_vinculadas" not in eq and tipo in ("eSB", "eMulti")):
        return None
    ida, volta = eq.get("equipes_vinculadas") or [], eq.get("vinculos_recebidos") or []
    if tipo == "eMulti":
        return f"{len(ida)} equipe(s) vinculada(s)"
    if tipo == "eSB":
        return ("Vinculada a " + ", ".join(f"{v.get('sigla') or ''} {v['nome']}".strip() for v in ida)) if ida             else "Sem equipe de referência"
    esb = [v for v in volta if v["sigla"] == "ESB"]
    emu = [v for v in volta if v["sigla"] == "EMULTI"]
    partes = []
    if esb:
        partes.append("eSB " + ", ".join(v["nome"] for v in esb))
    if emu:
        partes.append("eMulti " + ", ".join(v["nome"] for v in emu))
    return " · ".join(partes) or "Sem eSB/eMulti vinculada"


def _vinculos(eq, tipo, modalidade, params, egestor_eq, coletados: bool = True) -> list[dict]:
    """Vínculos oficiais do CNES (serviço nasf-esf) × regras da matriz × vínculo usado pelo e-Gestor.
    `coletados` = o retrato tem vínculos (coletas anteriores a esta versão não têm): sem eles, nada é afirmado."""
    if not eq["ativa"]:
        return []
    if not coletados:
        return [_crit("Vínculos entre equipes (CNES)", "Conforme a matriz normativa", "Vínculos não coletados neste retrato",
                      "—", NAO_VERIFICAVEL, "PRC2_PNAB_ESB_VINC" if tipo != "eMulti" else "PRC2_40F_P2",
                      "Clique em Atualizar CNES para coletar os vínculos.")]
    ida, volta = eq.get("equipes_vinculadas"), eq.get("vinculos_recebidos") or []
    out = []
    if tipo == "eSB":
        if ida is None:
            return [_crit("Equipe de referência da eSB", "Vinculada a uma eSF/eAP/eSFR", "Vínculo não coletado",
                          "—", NAO_VERIFICAVEL, "PRC2_PNAB_ESB_VINC", "Atualize o CNES para coletar os vínculos.")]
        eg = next((r["payload"].get("coEquipeEsfEap") for r in egestor_eq.get(eq["ine"], [])
                   if r["co"] in (CO_ESB40, CO_ESB_DIF) and r["payload"].get("coEquipeEsfEap")), None)
        eg = str(eg).zfill(10) if eg else None
        sit = IRREGULAR if not ida else ATENCAO if len(ida) > 1 or (eg and eg not in {v["ine"] for v in ida}) else CONFORME
        out.append(_crit("Equipe de referência da eSB", "Vinculada a uma eSF/eAP/eSFR", _lista(ida),
                         "Sem equipe de referência no CNES" if not ida else
                         (f"e-Gestor usa outra equipe de referência (INE {eg})" if eg and eg not in {v["ine"] for v in ida}
                          else "Mais de uma equipe de referência" if len(ida) > 1 else "—"),
                         sit, "PRC2_PNAB_ESB_VINC"))
    if tipo in ("eSF", "eSFR", "eAP"):
        esb = [v for v in volta if v["sigla"] == "ESB"]
        emu = [v for v in volta if v["sigla"] == "EMULTI"]
        out.append(_crit("eMulti vinculada", "No máximo uma eMulti por equipe", _lista(emu),
                         "Vinculada a mais de uma eMulti" if len(emu) > 1 else "—",
                         IRREGULAR if len(emu) > 1 else CONFORME, "PRC2_40F_P2"))
        # e-Gestor paga saúde bucal tendo esta equipe como referência, mas o CNES não mostra a eSB vinculada
        esb_eg = sorted({ine for ine, regs in egestor_eq.items() for r in regs
                         if r["co"] in (CO_ESB40, CO_ESB_DIF)
                         and str(r["payload"].get("coEquipeEsfEap") or "").zfill(10) == eq["ine"]})
        falta = [i for i in esb_eg if i not in {v["ine"] for v in esb}]
        out.append(_crit("eSB vinculada", "eSB com custeio federal vinculada à equipe de referência", _lista(esb),
                         (f"e-Gestor paga eSB (INE {', '.join(falta)}) com esta equipe de referência, sem vínculo no CNES"
                          if falta else "—"), ATENCAO if falta else CONFORME, "PRC2_PNAB_ESB_VINC"))
    if tipo == "eMulti" and ida is not None:
        n = len(ida)
        faixa = None
        if modalidade:
            m = {"Ampliada": "ampliada", "Complementar": "complementar", "Estratégica": "estrategica"}.get(
                modalidade.split(" ")[0])
            if m:
                faixa = (_v(params, f"regra.eMulti.{m}.equipes_vinculadas_min"),
                         _v(params, f"regra.eMulti.{m}.equipes_vinculadas_max"))
        fora = faixa and not (faixa[0] <= n <= faixa[1])
        disp = {"Ampliada": "PRC2_40G_I", "Complementar": "PRC2_40G_II", "Estratégica": "PRC2_40G_III"}.get(
            (modalidade or "").split(" ")[0], "PRC2_40F_P2")
        out.append(_crit("Equipes vinculadas à eMulti",
                         (f"eMulti {modalidade}: {faixa[0]:.0f} a {faixa[1]:.0f} equipes" if faixa else
                          "Ampliada 10–12 · Complementar 5–9 · Estratégica 1–4 equipes"),
                         f"{n}: {_lista(ida)}",
                         "Nenhuma equipe vinculada" if n == 0 else (f"Fora da faixa da modalidade ({n})" if fora else "—"),
                         IRREGULAR if n == 0 or fora else CONFORME, disp))
    return out


# ── Validação por equipe ──────────────────────────────────────────────────────

def _composicao(tipo, ativos, params, ant_ativos):
    """Composição mínima (eSF/eSFR/eAP) com o percentual de suspensão do Anexo C da PRC 6."""
    exig = {"eSF": ("medico", "enfermeiro", "aux_tec_enfermagem", "acs"),
            "eSFR": ("medico", "enfermeiro", "aux_tec_enfermagem"),
            "eAP": ("medico", "enfermeiro")}[tipo]
    disp = {"eSF": "PRC2_PNAB_ESF_COMP", "eSFR": "PRC2_ESFR_18", "eAP": "PRC2_PNAB_EAP_COMP"}[tipo]
    tem = defaultdict(int)
    for p in ativos:
        if (c := _cat(p["cbo"])):
            tem[c] += 1
    faltam = [c for c in exig if not tem[c]]
    out = [_crit("Composição mínima", ", ".join(mn.CATEGORIAS[c]["nome"] for c in exig),
                 ", ".join(f"{mn.CATEGORIAS[c]['nome']}: {tem[c]}" for c in exig),
                 ("Falta: " + ", ".join(mn.CATEGORIAS[c]["nome"] for c in faltam)) if faltam else "—",
                 IRREGULAR if faltam else CONFORME, disp)]
    if faltam and tipo in ("eSF", "eAP"):
        f = set(faltam)
        if {"medico", "enfermeiro"} <= f or len(f) >= 3:
            pct = _v(params, "regra.suspensao.pct.ausencia_tres_ou_medico_e_enfermeiro")
        elif f & {"medico", "enfermeiro"} and f & {"acs", "aux_tec_enfermagem"}:
            pct = _v(params, "regra.suspensao.pct.ausencia_combinada")
        elif f & {"medico", "enfermeiro"}:
            pct = _v(params, "regra.suspensao.pct.ausencia_medico_ou_enfermeiro")
        elif {"acs", "aux_tec_enfermagem"} <= f:
            pct = _v(params, "regra.suspensao.pct.ausencia_aux_tec_e_acs")
        else:
            pct = _v(params, "regra.suspensao.pct.ausencia_aux_tec_ou_acs")
        persiste = ant_ativos is not None and all(
            not any(_cat(p["cbo"]) == c for p in ant_ativos) for c in faltam)
        n = int(_v(params, "regra.suspensao.competencias_cnes") or 2)
        out.append(_crit("Risco de suspensão (ausência na equipe mínima)",
                         f"Suspensão de {pct:.0f}% se a ausência durar {n} competências do CNES",
                         "Ausência também na competência anterior" if persiste else
                         ("Primeira competência com ausência" if ant_ativos is not None else "Sem retrato anterior"),
                         f"{pct:.0f}%", IRREGULAR if persiste else ATENCAO, "PRC6_ANEXO_C"))
    return out


def _ch_individual(ativos, exigida, disp, rotulo):
    abaixo = [p for p in ativos if p["ch_total"] < exigida]
    return _crit(f"Carga horária individual ({rotulo})", f"{exigida:.0f} h semanais",
                 f"{len(ativos) - len(abaixo)} de {len(ativos)} com {exigida:.0f} h ou mais",
                 (f"{len(abaixo)} abaixo: " + ", ".join(f"{p['nome']} ({p['ch_total']} h)" for p in abaixo))
                 if abaixo else "—", IRREGULAR if abaixo else CONFORME, disp), {id(p) for p in abaixo}


def validar_equipe(eq, tipo, params, egestor_eq, ch_aps_pessoa, esf_por_pessoa, ant_eq, mod_emulti=None,
                   vinculos_coletados=True):
    ativos = [p for p in eq["profissionais"] if p["ativo"]]
    ant_ativos = [p for p in ant_eq["profissionais"] if p["ativo"]] if ant_eq else None
    criterios, prof_sit = [], {}
    modalidade = perfil = None
    vinc_lista = eq.get("equipes_vinculadas")
    abaixo_ids: set = set()

    if not eq["ativa"]:
        criterios.append(_crit("Equipe ativa no CNES", "Cadastro ativo", f"Desativada em {eq['dt_desativacao']}",
                               "—", IRREGULAR, "PRC6_ANEXO_C"))
    if tipo in ("eSF", "eSFR", "eAP"):
        criterios += _composicao(tipo, ativos, params, ant_ativos)
    if tipo == "eSF":
        c, abaixo_ids = _ch_individual(ativos, _v(params, "regra.eSF.ch_individual") or 40, "PRC2_PNAB_ESF_40H", "eSF")
        criterios.append(c)
        dup = [p for p in ativos if p["chave"] and esf_por_pessoa.get(p["chave"], 0) > 1]
        criterios.append(_crit("Vínculo a uma única eSF", "1 eSF por profissional",
                               f"{len(dup)} profissional(is) em mais de uma eSF" if dup else "Nenhum em mais de uma eSF",
                               ", ".join(p["nome"] for p in dup) or "—", IRREGULAR if dup else CONFORME,
                               "PRC2_PNAB_ESF_VINC"))
    if tipo == "eSFR":
        criterios.append(_crit("Carga horária individual (eSFR)", "Não fixada no Anexo XXII (arts. 16 a 20)",
                               f"Carga total da equipe: {eq['ch_total']} h", "—", NAO_VERIFICAVEL, "PRC2_ESFR_18",
                               "Regra pendente de confirmação no texto oficial — não é presumida."))
    if tipo == "eSB":
        tem = defaultdict(int)
        for p in ativos:
            if (c := _cat(p["cbo"])):
                tem[c] += 1
        mod = next((str(r["payload"].get("modalidade")) for r in egestor_eq.get(eq["ine"], [])
                    if r["co"] in (CO_ESB40, CO_ESB_DIF) and r["payload"].get("modalidade")), None)
        disp = "PRC2_PNAB_ESB_II" if mod == "2" else "PRC2_PNAB_ESB_I"
        falta = [] if tem["dentista"] else ["Cirurgião(ã)-dentista"]
        if mod == "2" and not any(p["cbo"].startswith(mn.CATEGORIAS["tsb"]["cbo"]) for p in ativos):
            falta.append("Técnico(a) em saúde bucal")
        if tem["asb_tsb"] < (2 if mod == "2" else 1):
            falta.append("ASB/TSB")
        criterios.append(_crit(f"Composição — Modalidade {'II' if mod == '2' else 'I'}"
                               + ("" if mod else " (modalidade não publicada no e-Gestor)"),
                               "Cirurgião-dentista e ASB ou TSB" if mod != "2" else "Cirurgião-dentista, TSB e ASB/TSB",
                               f"Dentista: {tem['dentista']}, ASB/TSB: {tem['asb_tsb']}",
                               ("Falta: " + ", ".join(falta)) if falta else "—", IRREGULAR if falta else CONFORME, disp))
        minimo = _v(params, "regra.eSB20.ch_individual") or 20
        c, abaixo_ids = _ch_individual(ativos, minimo, "PRC2_PNAB_ESB_20H", "mínimo de qualquer modalidade de eSB")
        criterios.append(c)
        comp = [r for r in egestor_eq.get(eq["ine"], []) if r["co"] == CO_ESB40]
        if comp and any(p["ch_total"] < 40 for p in ativos):
            uom = comp[0]["payload"].get("stEsbUom")
            criterios.append(_crit("Carga horária × eSB 40h paga no e-Gestor", "eSB paga como 40h",
                                   "Profissional(is) com menos de 40 h nesta equipe no CNES",
                                   f"e-Gestor informa: {uom}" if uom and uom != "-" else "—",
                                   ATENCAO, "PRC2_PNAB_ESB_20H",
                                   "Conferir no SCNES a carga horária e o arranjo (CH compartilhada) da eSB."))
    if tipo == "eMulti":
        fora = [p for p in ativos if p["cbo"] not in mn.CBO_EMULTI]
        criterios.append(_crit("Categorias e CBO (Anexo 6)", "Somente as categorias do Anexo 6",
                               f"{len(ativos) - len(fora)} de {len(ativos)} no Anexo 6",
                               ", ".join(f"{p['nome']} (CBO {p['cbo']})" for p in fora) or "—",
                               IRREGULAR if fora else CONFORME, "PRC2_40F_I"))
        med_min = _v(params, "regra.eMulti.ch_individual.medico") or 10
        dem_min = _v(params, "regra.eMulti.ch_individual.demais") or 20
        abaixo = [p for p in ativos if p["ch_total"] < (med_min if p["cbo"].startswith("225") else dem_min)]
        abaixo_ids = {id(p) for p in abaixo}
        criterios.append(_crit("Carga horária individual", f"Médico ≥ {med_min:.0f} h; demais ≥ {dem_min:.0f} h",
                               f"{len(ativos) - len(abaixo)} de {len(ativos)} no mínimo",
                               ", ".join(f"{p['nome']} ({p['ch_total']} h)" for p in abaixo) or "—",
                               IRREGULAR if abaixo else CONFORME, "PRC2_40F_III"))
        total = sum(p["ch_total"] for p in ativos)
        por_cat = defaultdict(int)
        for p in ativos:
            por_cat[p["cbo"]] += p["ch_total"]
        eg = next((r["payload"] for r in egestor_eq.get(eq["ine"], []) if r["co"] == CO_EMULTI), None)
        vinc_eg = eg.get("qtEquipeVinculada") if eg else None
        vinc = len(vinc_lista) if vinc_lista is not None else vinc_eg
        compat = []
        for m, rot in MODALIDADES_EMULTI:
            ok = total >= (_v(params, f"regra.eMulti.{m}.ch_total_min") or 0) and \
                max(por_cat.values() or [0]) <= (_v(params, f"regra.eMulti.{m}.ch_max_mesma_categoria") or 0)
            if vinc is not None:
                ok = ok and (_v(params, f"regra.eMulti.{m}.equipes_vinculadas_min") or 0) <= vinc <= \
                    (_v(params, f"regra.eMulti.{m}.equipes_vinculadas_max") or 0)
            if ok:
                compat.append(rot)
        criterios.append(_crit("Carga horária da equipe e modalidade",
                               "Ampliada ≥ 300 h · Complementar ≥ 200 h · Estratégica ≥ 100 h (soma individual)",
                               f"{total} h; maior categoria {max(por_cat.values() or [0])} h"
                               + (f"; {vinc} equipes vinculadas ({'CNES' if vinc_lista is not None else 'e-Gestor'})"
                                  if vinc is not None else ""),
                               ("Compatível com: " + ", ".join(compat)) if compat else "Nenhuma modalidade atendida",
                               CONFORME if compat else IRREGULAR, "PRC2_40G_P2",
                               (f"CH apta no e-Gestor: {eg.get('qtCargaHorariaProfApto')} h; "
                                f"{vinc_eg} equipes vinculadas no e-Gestor." if eg else None)))
        perfil = compat[0] if len(compat) == 1 else (", ".join(compat) or None)
        modalidade = (mod_emulti or {}).get("por_ine", {}).get(eq["ine"])
        disp_mod = {"Ampliada": "PRC2_40G_I", "Complementar": "PRC2_40G_II", "Estratégica": "PRC2_40G_III"}
        if modalidade:
            ok = modalidade in compat or (modalidade.startswith("Ampliada") and "Ampliada" in compat)
            criterios.append(_crit(
                "Modalidade credenciada × carga horária e vínculos",
                f"eMulti {modalidade}: requisitos do art. 40-G", f"Credenciada e paga como {modalidade} (e-Gestor)",
                "—" if ok else (f"Perfil no CNES compatível com: {', '.join(compat)}" if compat
                                else "Perfil no CNES não atende nenhuma modalidade"),
                CONFORME if ok else IRREGULAR, disp_mod.get(modalidade.split(" ")[0], "PRC2_40G_P2"),
                None if ok else "Ajustar a carga horária/vínculos no SCNES ou solicitar a alteração de modalidade "
                                "(art. 40-E, §§ 2º e 3º)."))
        else:
            criterios.append(_crit(
                "Modalidade credenciada", "Credenciamento e homologação pelo Ministério da Saúde",
                "Não credenciada/paga como eMulti no e-Gestor",
                (f"Perfil no CNES compatível com: {', '.join(compat)}" if compat
                 else "Perfil no CNES não atende nenhuma modalidade"), ATENCAO, "PRC2_40H",
                "Sem portaria de credenciamento identificada para esta equipe: a modalidade não é oficial; o perfil "
                "foi calculado pela carga horária e pelas equipes vinculadas no CNES."))

    criterios += _vinculos(eq, tipo, modalidade, params, egestor_eq, vinculos_coletados)

    # Acúmulo acima de 60 h em equipes da APS (PRC 6, art. 12-K, § 4º)
    lim = _v(params, "regra.aps.ch_max_acumulada") or 60
    acima = [p for p in ativos if p["chave"] and ch_aps_pessoa.get(p["chave"], 0) > lim]
    criterios.append(_crit("Acúmulo de carga horária em equipes da APS", f"Até {lim:.0f} h semanais por profissional",
                           f"{len(acima)} acima de {lim:.0f} h" if acima else f"Ninguém acima de {lim:.0f} h",
                           ", ".join(f"{p['nome']} ({ch_aps_pessoa[p['chave']]} h)" for p in acima) or "—",
                           IRREGULAR if acima else CONFORME, "PRC6_12K_P4"))

    # Cruzamento com o e-Gestor (credenciamento/homologação/pagamento/suspensões)
    regs = egestor_eq.get(eq["ine"], [])
    if regs:
        pend = [p for r in regs for p in r["pendencias"]]
        obs = None
        txt = " ".join(f"{p['rotulo']} {p['campo']}" for p in pend).upper()
        if ("DUPLICIDADE" in txt or "ACIMA" in txt or "CARGAHORA" in txt) and not acima and not (
                tipo == "eSF" and any(p["chave"] and esf_por_pessoa.get(p["chave"], 0) > 1 for p in ativos)):
            obs = ("O e-Gestor aponta duplicidade/carga horária acima do limite, mas nas lotações deste município no "
                   "CNES isso não aparece: provável vínculo em OUTRO município. Conferir no CNES o histórico de cada "
                   "profissional da equipe.")
        criterios.append(_crit("Situação no e-Gestor (pagamento e suspensões)", "Válido e sem suspensão",
                               "; ".join(f"{r['ds']}: {r['st_pagamento']}" for r in regs),
                               "; ".join(f"{p['rotulo']}: {p['situacao']}" for p in pend) or "—",
                               IRREGULAR if pend else CONFORME, "PRC6_12K_P4" if obs else "PRC6_ANEXO_C", obs))
    elif eq["ativa"]:
        criterios.append(_crit("Credenciamento/homologação no e-Gestor", "Equipe homologada e paga",
                               "Ativa no CNES", "Não aparece no relatório de pagamento do e-Gestor", ATENCAO, None,
                               "Equipe cadastrada no CNES sem pagamento federal na parcela: conferir credenciamento, "
                               "homologação ou se é custeada só pelo município."))

    profs = []
    for p in eq["profissionais"]:
        if not p["ativo"]:
            continue
        exig = {"eSF": _v(params, "regra.eSF.ch_individual"), "eSB": _v(params, "regra.eSB20.ch_individual"),
                "eMulti": (med_min if p["cbo"].startswith("225") else dem_min) if tipo == "eMulti" else None
                }.get(tipo)
        motivos = []
        if id(p) in abaixo_ids:
            motivos.append(f"carga horária abaixo de {exig:.0f} h")
        if p["chave"] and ch_aps_pessoa.get(p["chave"], 0) > lim:
            motivos.append(f"acúmulo de {ch_aps_pessoa[p['chave']]} h em equipes da APS")
        if tipo == "eSF" and p["chave"] and esf_por_pessoa.get(p["chave"], 0) > 1:
            motivos.append("em mais de uma eSF")
        if tipo == "eMulti" and p["cbo"] not in mn.CBO_EMULTI:
            motivos.append("CBO fora do Anexo 6")
        profs.append({"chave": p["chave"], "nome": p["nome"], "cbo": p["cbo"], "ds_cbo": p["ds_cbo"],
                      "categoria": mn.CATEGORIAS.get(_cat(p["cbo"]) or "", {}).get("nome"),
                      "ch_cnes": p["ch_total"], "ch_exigida": exig, "equipe_minima": p["equipe_minima"],
                      "ch_aps_total": ch_aps_pessoa.get(p["chave"]),
                      "situacao": IRREGULAR if motivos else CONFORME, "motivos": motivos})

    # situação geral: pior entre os critérios verificáveis; "não verificável" só se nada pôde ser verificado
    verif = [c["situacao"] for c in criterios if c["situacao"] != NAO_VERIFICAVEL]
    sit = max(verif, key=_ORDEM.get) if verif else NAO_VERIFICAVEL
    return {"ine": eq["ine"], "nome": eq["nome"], "tipo": tipo, "tipo_cnes": eq["tp_equipe"], "sigla_cnes": eq["sigla"],
            "modalidade": modalidade, "modalidade_fonte": (mod_emulti or {}).get("fonte") if modalidade else None,
            "perfil_cnes": perfil, "equipes_vinculadas": vinc_lista,
            "vinculos_recebidos": eq.get("vinculos_recebidos") or [], "resumo_vinculos": resumo_vinculos(eq, tipo, vinculos_coletados),
            "rotulo_modalidade": (f"eMulti {modalidade}" if modalidade else
                                  f"eMulti (não credenciada · perfil {perfil})" if tipo == "eMulti" and perfil else
                                  "eMulti (não credenciada)" if tipo == "eMulti" else tipo),
            "estabelecimentos": eq["estabelecimentos"], "ativa": eq["ativa"], "dt_ativacao": eq["dt_ativacao"],
            "n_profissionais": len(ativos), "ch_total": eq["ch_total"],
            "credenciada": bool(regs), "homologada": any(r["payload"].get("portariaHomologacao") not in (None, "-")
                                                         for r in regs),
            "financiada": any((r["st_pagamento"] or "").upper() in ("PAGO", "VÁLIDO", "VALIDO") for r in regs),
            "situacao": sit, "incompatibilidades": sum(c["situacao"] == IRREGULAR for c in criterios),
            "criterios": criterios, "profissionais": profs}


def validar(retrato: dict, anterior: dict | None, params: dict, egestor: dict, siaps: dict[str, str]) -> dict:
    """Valida todas as equipes do retrato. `egestor` = {parcela, comp_cnes, resumos{co: resumo}, equipes{ine: [...]}}."""
    eg_eq = egestor.get("equipes", {})
    ch_aps: dict[str, int] = defaultdict(int)
    esf_por_pessoa: dict[str, int] = defaultdict(int)
    tipos = {}
    for eq in retrato["equipes"]:
        tipos[eq["ine"]] = tipo_oficial(eq, siaps, eg_eq)
        if not eq["ativa"]:
            continue
        for p in eq["profissionais"]:
            if p["ativo"] and p["chave"]:
                ch_aps[p["chave"]] += p["ch_total"]
        if tipos[eq["ine"]] == "eSF":
            for k in {p["chave"] for p in eq["profissionais"] if p["ativo"] and p["chave"]}:
                esf_por_pessoa[k] += 1
    ant = {e["ine"]: e for e in (anterior or {}).get("equipes", [])}
    mod = modalidades_emulti(egestor)
    # retrato coletado antes da versão com vínculos: nenhuma equipe não-eSF tem a chave "equipes_vinculadas"
    coletados = any("equipes_vinculadas" in e for e in retrato["equipes"] if e.get("tp_equipe") != "70")
    equipes = [validar_equipe(eq, tipos[eq["ine"]], params, eg_eq, ch_aps, esf_por_pessoa, ant.get(eq["ine"]), mod,
                              coletados)
               for eq in retrato["equipes"]]

    # Equipes pagas/credenciadas no e-Gestor que não estão no CNES (ausência de cadastro ativo)
    no_cnes = {e["ine"] for e in retrato["equipes"] if e["ativa"]}
    fantasmas = sorted({ine for ine, regs in eg_eq.items() if ine not in no_cnes})

    cards = {}
    res = egestor.get("resumos", {})
    for tipo, cos in (("eMulti", (CO_EMULTI,)), ("eSB", (CO_ESB40, CO_ESB_DIF)), ("eSF", (CO_ESF,)),
                      ("eSFR", (CO_ESFR,)), ("eAP", (CO_EAP,))):
        eqs = [e for e in equipes if e["tipo"] == tipo]
        r = [res.get(co) or {} for co in cos]
        cards[tipo] = {
            "cadastradas_cnes": len(eqs), "ativas": sum(e["ativa"] for e in eqs),
            "credenciadas": (sum(x.get("qtCredenciado") or 0 for x in r)
                             if any("qtCredenciado" in x for x in r) else None),   # None = não publicado
            "homologadas": (sum(x.get("qtHomologado") or 0 for x in r)
                            if any("qtHomologado" in x for x in r) else None),
            "financiadas": sum(e["financiada"] for e in eqs),
            "regulares": sum(e["situacao"] == CONFORME for e in eqs),
            "com_incompatibilidade": sum(e["incompatibilidades"] > 0 for e in eqs),
            "profissionais": sum(e["n_profissionais"] for e in eqs),
        }
    em = [e for e in equipes if e["tipo"] == "eMulti"]
    cards["eMulti"]["por_modalidade"] = [
        {"modalidade": m, "credenciadas": mod["credenciadas"].get(m, 0), "pagas": mod["pagas"].get(m, 0),
         "no_cnes": sum(e["modalidade"] == m for e in em)}
        for m in ("Ampliada", "Ampliada - Intermunicipal", "Complementar", "Estratégica")
        if mod["credenciadas"].get(m) or mod["pagas"].get(m) or any(e["modalidade"] == m for e in em)]
    cards["eMulti"]["nao_credenciadas_cnes"] = sum(e["ativa"] and not e["modalidade"] for e in em)
    cards["eMulti"]["fonte_modalidade"] = mod["fonte"]
    return {"competencia_cnes": retrato.get("competencia"), "parcela_egestor": egestor.get("parcela"),
            "competencia_cnes_egestor": egestor.get("comp_cnes"), "cards": cards, "equipes": equipes,
            "egestor_sem_cnes": fantasmas,
            "resumo": {"equipes": len(equipes), "irregulares": sum(e["situacao"] == IRREGULAR for e in equipes),
                       "atencao": sum(e["situacao"] == ATENCAO for e in equipes),
                       "profissionais_irregulares": sum(p["situacao"] == IRREGULAR for e in equipes
                                                        for p in e["profissionais"])}}


# ── Carga das fontes gravadas ─────────────────────────────────────────────────

async def _egestor(db: AsyncSession, municipio_id: int) -> dict:
    from models.egestor_pagamento import EgestorPagamentoComponente, EgestorValidacaoEquipe
    parcela = (await db.execute(select(func.max(EgestorPagamentoComponente.nu_parcela))
                                .where(EgestorPagamentoComponente.municipio_id == municipio_id))).scalar()
    if not parcela:
        return {}
    comps = (await db.execute(select(EgestorPagamentoComponente).where(
        EgestorPagamentoComponente.municipio_id == municipio_id,
        EgestorPagamentoComponente.nu_parcela == parcela))).scalars().all()
    regs = (await db.execute(select(EgestorValidacaoEquipe).where(
        EgestorValidacaoEquipe.municipio_id == municipio_id, EgestorValidacaoEquipe.nu_parcela == parcela))).scalars()
    ds = {c.co_componente: c.ds_componente for c in comps}
    equipes: dict[str, list] = defaultdict(list)
    for r in regs:
        equipes[r.ine].append({"co": r.co_componente, "ds": ds.get(r.co_componente, str(r.co_componente)),
                               "st_pagamento": r.st_pagamento, "pendencias": json.loads(r.pendencias or "[]"),
                               "payload": json.loads(r.payload or "{}")})
    return {"parcela": parcela, "comp_cnes": comps[0].nu_comp_cnes if comps else None,
            "resumos": {c.co_componente: json.loads(c.resumo or "{}") for c in comps}, "equipes": dict(equipes)}


async def _siaps(db: AsyncSession, municipio_id: int) -> dict[str, str]:
    from models.equipe_siaps import EquipeSiaps
    return {e.ine: e.tipo for e in (await db.execute(select(EquipeSiaps).where(
        EquipeSiaps.municipio_id == municipio_id, EquipeSiaps.ativa.is_(True)))).scalars()}


async def montar(db: AsyncSession, municipio_id: int, competencia: str | None = None) -> dict | None:
    from models.cnes_retrato import CnesRetrato
    from services import cnes_publico as cp
    reg = await (cp.de_competencia(db, municipio_id, competencia) if competencia else cp.ultimo(db, municipio_id))
    if not reg:
        return None
    ant = (await db.execute(select(CnesRetrato).where(CnesRetrato.municipio_id == municipio_id,
                                                      CnesRetrato.competencia < reg.competencia)
                            .order_by(CnesRetrato.competencia.desc()).limit(1))).scalar_one_or_none()
    params = await ap.vigentes(db, municipio_id, reg.competencia)
    r = validar(reg.dados, ant.dados if ant else None, params, await _egestor(db, municipio_id),
                await _siaps(db, municipio_id))
    r["coletado_em"] = reg.coletado_em.isoformat() + "Z" if reg.coletado_em else None
    r["alteracoes"] = reg.alteracoes
    return r
