"""
Simulador de Financiamento e Potencial de Incremento da APS (módulo eGestor).

Fontes de dados — SOMENTE as integrações já existentes:
  • e-Gestor APS (relatório público de pagamento, tabelas egestor_pagamento_*): valores pagos por componente,
    quantitativos (teto, credenciadas, homologadas, pagas), validação/suspensão de cada equipe, estrato do IED,
    valores de referência por modalidade com a portaria vigente e a população usada pelo MS;
  • SIAPS (equipes_siaps, siaps_quadrimestre_equipe, siaps_publico_coleta): equipes do município e a avaliação
    quadrimestral oficial por equipe (Vínculo/CVAT e Qualidade, nota, classificação e indicadores).
CNS e e-SUS PEC NÃO são usados aqui (continuam funcionando nos outros módulos).

Regras: nenhum valor é inventado. Parâmetros por classificação vêm da norma (services/aps_parametros.py) e
são conferidos contra o valor efetivamente pago no e-Gestor; se divergirem, o incremento correspondente é
mostrado como "não confirmado" e não entra no total. Oportunidades não verificadas ou mutuamente
excludentes também não são somadas como recurso garantido.
"""
from __future__ import annotations

import unicodedata

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.equipe_siaps import EquipeSiaps
from services import aps_parametros as ap
from services import egestor_pagamento as ep
from services import siaps_quadrimestral as sq

FONTE_EGESTOR = "e-Gestor APS — relatório público de pagamento"
FONTE_SIAPS = "SIAPS — avaliação quadrimestral por equipe"
ORDEM = ap.CLASSES[::-1]                      # regular → suficiente → bom → otimo
CONCEITO = {"regular": 0.25, "suficiente": 0.5, "bom": 0.75, "otimo": 1.0}
ELEG = {"confirmada": "Elegibilidade confirmada", "potencial": "Potencialmente elegível",
        "nao_elegivel": "Não elegível", "dados_insuficientes": "Dados insuficientes"}
TOL = 0.51                                     # tolerância de centavos na conferência


def _n(v) -> float:
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else 0.0


def _norm(s) -> str:
    return unicodedata.normalize("NFKD", str(s or "")).encode("ascii", "ignore").decode().strip().upper()


def _proxima(c: str | None) -> str | None:
    if c not in ORDEM:
        return None
    i = ORDEM.index(c)
    return ORDEM[i + 1] if i + 1 < len(ORDEM) else None


def _estrato(txt) -> str | None:
    d = "".join(ch for ch in str(txt or "") if ch.isdigit())
    return f"E{d}" if d in ("1", "2", "3", "4") else None


def plano_melhoria(r, alvo: str) -> dict:
    """Menor conjunto de indicadores (maior peso primeiro) que, subindo um nível de cada vez, leva a nota da
    equipe à classificação-alvo. Regra da nota: Σ conceito × peso (NT 8/2026 e NT 12/2026)."""
    faixa = sq.faixa_componente_iii if r.componente == "QUALIDADE" else sq.faixa_componente_ii
    inds = [dict(i) for i in (r.indicadores or []) if i.get("peso") and i.get("classificacao") in CONCEITO]
    nota = r.nota_final
    if nota is None:
        return {"possivel": False, "motivo": "Nota final não publicada para a equipe."}
    if not inds:
        return {"possivel": None, "motivo": "O SIAPS não detalhou peso/conceito dos indicadores desta avaliação.",
                "nota_atual": nota}
    passos, n = [], nota
    nivel = {i["codigo"]: i["classificacao"] for i in inds}
    while ORDEM.index(faixa(round(n, 4))) < ORDEM.index(alvo):
        cand = [i for i in inds if nivel[i["codigo"]] != "otimo"]
        if not cand:
            return {"possivel": False, "motivo": "Mesmo com todos os indicadores em Ótimo a nota não alcança a faixa.",
                    "nota_atual": nota}
        i = max(cand, key=lambda x: (x["peso"], -ORDEM.index(nivel[x["codigo"]])))
        de = nivel[i["codigo"]]
        para = ORDEM[ORDEM.index(de) + 1]
        ganho = (CONCEITO[para] - CONCEITO[de]) * i["peso"]
        n += ganho
        nivel[i["codigo"]] = para
        passos.append({"indicador": i["codigo"], "de": de, "para": para, "peso": i["peso"], "ganho_nota": round(ganho, 3)})
    return {"possivel": True, "nota_atual": nota, "nota_projetada": round(n, 3), "passos": passos}


async def _ultima_avaliacao(db: AsyncSession, municipio_id: int) -> tuple[dict, str | None]:
    regs = await sq._ativos(db, municipio_id)
    if not regs:
        return {}, None
    q = max(r.quadrimestre for r in regs)
    return {(r.componente, r.ine): r for r in regs if r.quadrimestre == q}, q


def _comp(comps: dict, co: int) -> dict:
    return comps.get(co) or {}


def _res(comps: dict, co: int) -> dict:
    return _comp(comps, co).get("resumo") or {}


async def simular(db: AsyncSession, municipio_id: int, parcela: str | None = None) -> dict:
    pg = await ep.painel(db, municipio_id, parcela)
    if pg.get("situacao_dado") != "oficial_validado":
        return {"situacao_dado": pg.get("situacao_dado", "nao_disponivel"), "nota": pg.get("nota"),
                "parcelas": pg.get("parcelas", []),
                "lacunas": ["Sem parcela do e-Gestor coletada para o município: rode “Atualizar agora” no "
                            "Relatório de Pagamento (e-Gestor)."]}
    parcela = pg["parcela"]
    params = await ap.vigentes(db, municipio_id, parcela)
    V = lambda k: ap.valor(params, k)                                  # noqa: E731
    comps = {c["co_componente"]: c for c in pg["componentes"]}
    # o painel omite componentes zerados; o resumo bruto deles (programas sem recebimento) vem da tabela
    from models.egestor_pagamento import EgestorPagamentoComponente
    import json
    for c in (await db.execute(select(EgestorPagamentoComponente).where(
            EgestorPagamentoComponente.municipio_id == municipio_id,
            EgestorPagamentoComponente.nu_parcela == parcela))).scalars():
        comps.setdefault(c.co_componente, {"co_componente": c.co_componente, "componente": c.ds_componente,
                                           "vl_total": c.vl_total, "vl_desconto": c.vl_desconto,
                                           "resumo": json.loads(c.resumo or "{}")})
    lacunas: list[str] = []
    alertas: list[dict] = []

    # ── Perfil municipal ─────────────────────────────────────────────────────────────────────────────
    r48 = _res(comps, 48)
    estrato = _estrato(r48.get("dsFaixaIndiceEquidade") or _res(comps, 49).get("dsFaixaIndiceEquidade"))
    if not estrato:
        lacunas.append("Estrato do IED não publicado no componente eSF/eAP do e-Gestor desta parcela.")
    pop = ((_res(comps, 33).get("_referencia") or {}).get("populacao") or {})
    populacao, pop_ano = pop.get("quantidade"), pop.get("anoReferencia")
    if not populacao:
        lacunas.append("População oficial não disponível (o e-Gestor publica no incentivo populacional; "
                       "sincronize o e-Gestor depois desta atualização).")
    equipes_siaps = list((await db.execute(select(EquipeSiaps).where(
        EquipeSiaps.municipio_id == municipio_id, EquipeSiaps.ativa.is_(True)))).scalars())
    if not equipes_siaps:
        lacunas.append("Equipes do SIAPS não sincronizadas para o município.")
    aval, quad = await _ultima_avaliacao(db, municipio_id)
    if not aval:
        lacunas.append("Avaliação quadrimestral por equipe (SIAPS área logada) não capturada: classificações e "
                       "potencial por desempenho ficam indisponíveis.")
    hv = await sq.homologadas_e_validas(db, municipio_id)
    tipos = ["eSF", "eAP", "eSFR", "eSB", "eMulti", "eCR", "eAPP"]
    cadastradas = {t: sum(1 for e in equipes_siaps if e.tipo == t) for t in tipos}
    qt_pag_esf = _n(r48.get("qtPagamento"))
    cobertura = None
    if populacao and V(f"cadastro.eSF.ate20mil") and qt_pag_esf:
        porte = ("ate20mil" if populacao <= 20000 else "ate50mil" if populacao <= 50000 else
                 "ate100mil" if populacao <= 100000 else "acima100mil")
        cap = V(f"cadastro.eSF.{porte}") * qt_pag_esf
        cobertura = {"parametro_por_esf": V(f"cadastro.eSF.{porte}"), "porte": porte, "capacidade_cadastro": cap,
                     "percentual": round(min(100.0, cap / populacao * 100), 1),
                     "nota": "Capacidade de cadastro das eSF pagas pelo parâmetro do Art. 11, § 1º (sem eAP/eSFR) "
                             "dividida pela população do MS — não é a cobertura oficial do e-Gestor."}
    perfil = {"estrato_ied": estrato, "estrato_texto": r48.get("dsFaixaIndiceEquidade"), "populacao": populacao,
              "populacao_ano": pop_ano, "quadrimestre_avaliacao": quad, "cobertura_estimada": cobertura,
              "classificacao_vinculo_egestor": pg.get("classificacao_vinculo"),
              "classificacao_qualidade_egestor": pg.get("classificacao_qualidade"),
              "equipes": [{"tipo": t, "cadastradas_siaps": cadastradas[t],
                           "homologadas_siaps": (hv or {}).get("homologadas", {}).get(t),
                           "validas_siaps": (hv or {}).get("validas", {}).get(t)} for t in tipos]}

    # ── Transição (Art. 3º) ─────────────────────────────────────────────────────────────────────────────
    fim = (params.get("transicao.fim") or {}).get("valor_texto")
    em_transicao = None if not fim else parcela < fim
    transicao = {"meses": V("transicao.meses"), "fim": fim, "em_transicao": em_transicao,
                 "norma": params["transicao.meses"]["norma"],
                 "texto": ("Durante a transição o MS paga vínculo e qualidade de eSF/eAP no valor “Bom”, "
                           "independente do desempenho. "
                           + ("Competência final ainda não registrada: o efeito financeiro do desempenho é "
                              "mostrado como “após a transição”." if not fim else
                              f"Transição até {fim[4:]}/{fim[:4]} (registrada)."))}
    if not fim:
        alertas.append({"tipo": "atualizacao_manual", "texto": "Registrar a competência final da regra de transição "
                        "(Art. 3º da PRT 3.493/2024, red. PRT 6.907/2025) para aplicar o desempenho real.",
                        "chave": "transicao.fim"})

    # ── Conferência norma × pago (diferenças) ─────────────────────────────────────────────────────────────
    confere: dict[str, bool] = {}
    diferencas: list[dict] = []

    def conferir(chave: str, rotulo: str, esperado: float | None, pago: float | None, qt: float, base: str):
        if esperado is None or pago is None or not qt:
            return
        ok = abs(esperado - pago) <= TOL * max(1, qt)
        confere[chave] = ok
        if not ok:
            diferencas.append({"tipo": "parametro_divergente", "componente": rotulo, "esperado_norma": esperado,
                               "pago_egestor": pago, "diferenca": round(pago - esperado, 2),
                               "texto": f"{rotulo}: pela norma ({base}) seriam R$ {esperado:,.2f}; o e-Gestor pagou "
                                        f"R$ {pago:,.2f}. Há norma posterior não registrada ou outra regra aplicada — "
                                        "o incremento deste componente não entra no total até atualizar o parâmetro."})
            alertas.append({"tipo": "atualizacao_manual", "texto": f"Parâmetro de “{rotulo}” diverge do valor pago "
                            "no e-Gestor: registrar a norma vigente.", "chave": chave})

    if estrato and qt_pag_esf:
        conferir("fixo.eSF", "eSF — componente fixo", V(f"fixo.eSF.{estrato}") * qt_pag_esf,
                 r48.get("vlPagamentoFixo"), qt_pag_esf, f"Art. 9º-B, {estrato}")
    cl_v = _norm(pg.get("classificacao_vinculo")).lower() or None
    cl_q = _norm(pg.get("classificacao_qualidade")).lower() or None
    if qt_pag_esf and cl_v in ap.CLASSES:
        conferir("vinculo.eSF", "eSF — vínculo e acompanhamento", V(f"vinculo.eSF.{cl_v}") * qt_pag_esf,
                 r48.get("vlPagamentoVinculo"), qt_pag_esf, f"Anexo II, {ap.ROTULO_CLASSE[cl_v]}")
    if qt_pag_esf and cl_q in ap.CLASSES:
        conferir("qualidade.eSF", "eSF — qualidade", V(f"qualidade.eSF.{cl_q}") * qt_pag_esf,
                 r48.get("vlPagamentoQualidade"), qt_pag_esf, f"Anexo III, {ap.ROTULO_CLASSE[cl_q]}")
    # eMulti: modalidade pelos quantitativos pagos
    ref42 = (_res(comps, 42).get("_referencia") or {})
    qpag = ref42.get("quantitativoPagamento") or {}
    mod_emulti = {"qtAmpliada": "ampliada", "qtComplementar": "complementar", "qtEstrategica": "estrategica"}
    emulti_mods = {m: int(qpag.get(k) or 0) for k, m in mod_emulti.items() if qpag.get(k)}
    if emulti_mods:
        esperado = sum(V(f"qualidade.eMulti.{m}.bom") * q for m, q in emulti_mods.items())
        conferir("qualidade.eMulti", "eMulti — qualidade", esperado, _res(comps, 51).get("vlTotal"),
                 sum(emulti_mods.values()), "Anexo III, Bom (transição)")
    # eSB: modalidade I/II e quilombola/assentamento pelos quantitativos pagos
    r5 = _res(comps, 5)
    esb_mods = {}
    qI, qII = int(_n(r5.get("qtPagamentoModalidadeI"))), int(_n(r5.get("qtPagamentoModalidadeII")))
    qIq, qIIq = int(_n(r5.get("qtPagamentoEqpQuilombAssentModalI"))), int(_n(r5.get("qtPagamentoEqpQuilombAssentModalII")))
    for m, q in (("I_quil", qIq), ("II_quil", qIIq), ("I", max(0, qI - qIq)), ("II", max(0, qII - qIIq))):
        if q:
            esb_mods[m] = q
    if esb_mods:
        esperado = sum(V(f"qualidade.eSB.{m}.bom") * q for m, q in esb_mods.items())
        conferir("qualidade.eSB", "eSB — qualidade", esperado, _res(comps, 50).get("vlTotal"),
                 sum(esb_mods.values()), "Anexo III, Bom (transição)")

    # ── Situação atual por componente (valores pagos — fonte oficial) ────────────────────────────────────
    componentes = []
    for c in pg["componentes"]:
        r = c.get("resumo") or {}
        componentes.append({"co": c["co_componente"], "componente": c["componente"], "plano": c.get("plano"),
                            "teto": r.get("qtTeto"), "credenciadas": r.get("qtCredenciado"),
                            "homologadas": r.get("qtHomologado"),
                            "pagas": r.get("qtPagamento", r.get("qtPagamentoModalidadeI")),
                            "vl_fixo": r.get("vlPagamentoFixo"), "vl_vinculo": r.get("vlPagamentoVinculo"),
                            "vl_qualidade": r.get("vlPagamentoQualidade"), "vl_desconto": c.get("vl_desconto"),
                            "vl_ajuste": c.get("vl_ajuste"), "vl_total": c.get("vl_total")})
        if _n(c.get("vl_desconto")):
            diferencas.append({"tipo": "desconto", "componente": c["componente"], "diferenca": c["vl_desconto"],
                               "texto": f"{c['componente']}: desconto de R$ {abs(_n(c['vl_desconto'])):,.2f} nesta "
                                        "parcela (ver pendências das equipes no Relatório de Pagamento)."})
        cred, pag = r.get("qtCredenciado"), r.get("qtPagamento")
        if isinstance(cred, (int, float)) and isinstance(pag, (int, float)) and cred > pag:
            diferencas.append({"tipo": "credenciada_sem_pagamento", "componente": c["componente"],
                               "texto": f"{c['componente']}: {int(cred)} credenciada(s), {int(pag)} paga(s) — "
                                        f"{int(cred - pag)} sem pagamento nesta parcela."})
    mensal_atual = round(sum(_n(c["vl_total"]) for c in componentes), 2)

    # ── Por equipe: valor atual (rateio do pago) × previsto pela norma com o desempenho real ────────────
    pg_eq: dict[str, list] = {}
    for e in pg["equipes"]:
        pg_eq.setdefault(e["ine"], []).append(e)
    nomes = {e.ine: e for e in equipes_siaps}
    ines = sorted(set(nomes) | set(pg_eq), key=lambda i: (tipos.index(nomes[i].tipo) if i in nomes and nomes[i].tipo in tipos else 9,
                                                           nomes[i].nome if i in nomes else i))
    por_equipe, inc_prox, inc_otimo, inc_nc = [], 0.0, 0.0, 0.0

    def rateio(co: int, campo: str, qt_campo: str = "qtPagamento") -> float | None:
        r = _res(comps, co)
        qt = _n(r.get(qt_campo))
        return round(_n(r.get(campo)) / qt, 2) if qt and r.get(campo) is not None else None

    for ine in ines:
        eq = nomes.get(ine)
        tipo = eq.tipo if eq else (pg_eq[ine][0].get("tipo") if pg_eq.get(ine) else None)
        val = pg_eq.get(ine, [])
        pago_ok = any(v["ok"] for v in val) if val else None
        pend = [p["rotulo"] + ": " + str(p["situacao"]) for v in val for p in v["pendencias"]]
        aq, av = aval.get(("QUALIDADE", ine)), aval.get(("CVAT", ine))
        linha = {"ine": ine, "equipe": eq.nome if eq else (val[0].get("equipe") if val else None), "tipo": tipo,
                 "homologada": aq.homologada if aq else None, "valida": aq.equipe_valida if aq else None,
                 "credenciada_egestor": bool(val), "pagamento_ok": pago_ok, "pendencias": pend,
                 "vinculo": {"classificacao": av.classificacao, "nota": av.nota_final} if av else None,
                 "qualidade": {"classificacao": aq.classificacao, "nota": aq.nota_final} if aq else None,
                 "atual": {}, "norma": {}, "melhoria": [], "observacoes": []}
        if tipo == "eSF":
            if pago_ok:
                linha["atual"] = {"fixo": rateio(48, "vlPagamentoFixo"), "vinculo": rateio(48, "vlPagamentoVinculo"),
                                  "qualidade": rateio(48, "vlPagamentoQualidade")}
            linha["norma"]["fixo"] = V(f"fixo.eSF.{estrato}") if estrato else None
            for comp_k, reg, chave in (("vinculo", av, "vinculo.eSF"), ("qualidade", aq, "qualidade.eSF")):
                if not reg or reg.classificacao not in ap.CLASSES:
                    linha["observacoes"].append(f"Sem classificação de {comp_k} no SIAPS.")
                    continue
                atual_v = V(f"{chave}.{reg.classificacao}")
                linha["norma"][comp_k] = atual_v
                confirmado = confere.get(chave, False)
                for alvo, acum in ((_proxima(reg.classificacao), "prox"), ("otimo", "otimo")):
                    if not alvo or alvo == reg.classificacao or (acum == "otimo" and reg.classificacao == "otimo"):
                        continue
                    ganho = V(f"{chave}.{alvo}") - atual_v
                    if acum == "prox":
                        plano = plano_melhoria(reg, alvo)
                        linha["melhoria"].append({"componente": comp_k, "de": reg.classificacao, "para": alvo,
                                                  "incremento_mensal": ganho, "confirmado": confirmado,
                                                  "plano": plano, "norma": params[f"{chave}.{alvo}"]["norma"]})
                    if not reg.equipe_valida:
                        continue
                    if confirmado:
                        if acum == "prox":
                            inc_prox += ganho
                        else:
                            inc_otimo += ganho
                    elif acum == "prox":
                        inc_nc += ganho
        elif tipo == "eSB":
            if pago_ok:
                linha["atual"] = {"custeio": rateio(5, "vlPagamento", "qtPagamentoModalidadeI")
                                  if not qII else None,
                                  "qualidade": round(_n(_res(comps, 50).get("vlTotal")) / sum(esb_mods.values()), 2)
                                  if esb_mods else None}
            mods = list(esb_mods)
            if aq and aq.classificacao in ap.CLASSES and len(mods) == 1:
                chave = f"qualidade.eSB.{mods[0]}"
                atual_v = V(f"{chave}.{aq.classificacao}")
                linha["norma"]["qualidade"] = atual_v
                alvo = _proxima(aq.classificacao)
                if alvo:
                    ganho = V(f"{chave}.{alvo}") - atual_v
                    conf = confere.get("qualidade.eSB", False)
                    linha["melhoria"].append({"componente": "qualidade", "de": aq.classificacao, "para": alvo,
                                              "incremento_mensal": ganho, "confirmado": conf,
                                              "plano": plano_melhoria(aq, alvo), "norma": params[f"{chave}.{alvo}"]["norma"]})
                    if aq.equipe_valida:
                        inc_prox, inc_nc = (inc_prox + ganho, inc_nc) if conf else (inc_prox, inc_nc + ganho)
                if aq.classificacao != "otimo" and aq.equipe_valida and confere.get("qualidade.eSB"):
                    inc_otimo += V(f"{chave}.otimo") - atual_v
            elif len(mods) > 1:
                linha["observacoes"].append("Modalidade da eSB (I/II, quilombola/assentamento) não identificável por equipe.")
        elif tipo == "eMulti":
            if pago_ok:
                linha["atual"] = {"custeio": rateio(42, "vlPagamento", "qtHomologado"),
                                  "qualidade": _n(_res(comps, 51).get("vlTotal")) / max(1, sum(emulti_mods.values())) if emulti_mods else None,
                                  "atendimento_remoto": _n(_res(comps, 55).get("vlTotal")) / max(1, sum(emulti_mods.values())) if emulti_mods else None}
            if len(emulti_mods) == 1 and aq and aq.classificacao in ap.CLASSES and pago_ok:
                m = next(iter(emulti_mods))
                chave = f"qualidade.eMulti.{m}"
                atual_v = V(f"{chave}.{aq.classificacao}")
                linha["norma"]["qualidade"] = atual_v
                alvo = _proxima(aq.classificacao)
                if alvo:
                    ganho = V(f"{chave}.{alvo}") - atual_v
                    conf = confere.get("qualidade.eMulti", False)
                    linha["melhoria"].append({"componente": "qualidade", "de": aq.classificacao, "para": alvo,
                                              "incremento_mensal": ganho, "confirmado": conf,
                                              "plano": plano_melhoria(aq, alvo), "norma": params[f"{chave}.{alvo}"]["norma"]})
                    if aq.equipe_valida:
                        inc_prox, inc_nc = (inc_prox + ganho, inc_nc) if conf else (inc_prox, inc_nc + ganho)
                if aq.classificacao != "otimo" and aq.equipe_valida and confere.get("qualidade.eMulti"):
                    inc_otimo += V(f"{chave}.otimo") - atual_v
            if not val:
                linha["observacoes"].append("Equipe no SIAPS sem credenciamento/pagamento no e-Gestor.")
        elif tipo == "eSFR":
            if pago_ok:
                linha["atual"] = {"custeio": rateio(7, "vlPagamento"), "vinculo": _n(_res(comps, 61).get("vlTotal")) or None,
                                  "qualidade": _n(_res(comps, 58).get("vlTotal")) or None}
            linha["observacoes"].append("Valores de vínculo/qualidade da eSFR por classificação não estão na tabela "
                                        "da PRT 3.493/2024 cadastrada: incremento não calculado (atualização manual).")
        linha["atual_total"] = round(sum(_n(v) for v in linha["atual"].values()), 2) if linha["atual"] else None
        linha["norma_total"] = round(sum(_n(v) for v in linha["norma"].values()), 2) if linha["norma"] else None
        por_equipe.append(linha)

    efeito_hoje = em_transicao is False
    desempenho = {
        "incremento_mensal_proximo_nivel": round(inc_prox, 2),
        "incremento_mensal_todas_otimo": round(inc_otimo, 2),
        "incremento_mensal_nao_confirmado": round(inc_nc, 2),
        "efeito_financeiro": "imediato" if efeito_hoje else "apos_transicao",
        "texto": ("Incremento por desempenho = valor pela norma com a classificação melhorada − valor pela norma com a "
                  "classificação atual (equipes válidas). Só entram parâmetros conferidos com o valor pago no e-Gestor. "
                  + ("" if efeito_hoje else "Enquanto durar a transição, o MS paga “Bom”: o incremento vale a partir "
                     "do fim da transição.")),
    }

    oportunidades = _oportunidades(comps, params, perfil, cadastradas, hv, pg, equipes_siaps, aval)
    inc_cred_conf = round(sum(o["incremento_mensal"] or 0 for o in oportunidades
                              if o["elegibilidade"] == "confirmada" and o["conta_no_total"]), 2)
    grupos: dict[str, float] = {}
    for o in oportunidades:
        if o["elegibilidade"] == "potencial" and o["incremento_mensal"]:
            g = o.get("grupo_exclusivo") or o["id"]
            grupos[g] = max(grupos.get(g, 0), o["incremento_mensal"])
    inc_cred_pot = round(sum(grupos.values()), 2)
    implantacao_pot = round(sum(o.get("implantacao_total") or 0 for o in oportunidades
                                if o["elegibilidade"] in ("confirmada", "potencial") and o.get("conta_implantacao", True)), 2)
    inc_desemp_total = desempenho["incremento_mensal_proximo_nivel"] if efeito_hoje else 0.0
    total_mensal = round(mensal_atual + inc_desemp_total + inc_cred_conf, 2)

    pend_norma = [h for h in await ap.historico(db, municipio_id) if h["situacao"] == "pendente_validacao"]
    for h in pend_norma:
        alertas.append({"tipo": "norma_alterada" if h["origem"] == "egestor" else "validacao_pendente",
                        "texto": (f"e-Gestor publicou novos valores de referência para “{h['valor_texto']}” "
                                  f"({h['norma']}) — validar." if h["origem"] == "egestor" else
                                  f"Atualização de parâmetro “{h['chave']}” aguardando validação."), "id": h["id"]})

    kpis = {"financiamento_atual_mensal": mensal_atual, "financiamento_atual_anual": round(mensal_atual * 12, 2),
            "incremento_desempenho_mensal": desempenho["incremento_mensal_proximo_nivel"],
            "incremento_desempenho_efeito": desempenho["efeito_financeiro"],
            "incremento_credenciamento_confirmado_mensal": inc_cred_conf,
            "incremento_credenciamento_a_confirmar_mensal": inc_cred_pot,
            "implantacao_nao_recorrente_a_confirmar": implantacao_pot,
            "total_potencial_mensal": total_mensal, "total_potencial_anual": round(total_mensal * 12, 2),
            "total_com_a_confirmar_mensal": round(total_mensal + inc_cred_pot +
                                                  (0 if efeito_hoje else desempenho["incremento_mensal_proximo_nivel"]), 2),
            "oportunidades": len(oportunidades),
            "oportunidades_confirmadas": sum(1 for o in oportunidades if o["elegibilidade"] == "confirmada"),
            "oportunidades_pendentes": sum(1 for o in oportunidades if o["elegibilidade"] == "potencial"),
            "oportunidades_dados_insuficientes": sum(1 for o in oportunidades if o["elegibilidade"] == "dados_insuficientes")}

    respostas = _respostas(kpis, desempenho, oportunidades, pg, transicao)
    return {
        "situacao_dado": "oficial_validado", "parcela": parcela, "parcela_rotulo": pg["parcela_rotulo"],
        "parcelas": pg["parcelas"], "competencia_cnes": pg.get("competencia_cnes"),
        "fontes": [FONTE_EGESTOR, FONTE_SIAPS + (f" ({quad})" if quad else ""),
                   "Parâmetros: " + ap.FONTE_BASE],
        "nao_utiliza": "CNS e e-SUS PEC não são fontes deste simulador.",
        "perfil": perfil, "transicao": transicao, "kpis": kpis, "componentes": componentes,
        "diferencas": diferencas, "por_equipe": por_equipe, "desempenho": desempenho,
        "oportunidades": oportunidades, "alertas": alertas, "lacunas": lacunas, "respostas": respostas,
        "parametros_usados": params,
        "formulas": {
            "desempenho": "Incremento por desempenho = valor projetado com melhoria dos indicadores − valor previsto com desempenho atual",
            "credenciamento": "Incremento por credenciamento = soma dos novos custeios recorrentes com elegibilidade "
                              "confirmada, descontadas substituições/incompatibilidades",
            "consolidado": "Potencial consolidado = financiamento atual + incremento por desempenho (com efeito na "
                           "competência) + incremento líquido por credenciamentos confirmados",
            "nao_somado": "Oportunidades “potencialmente elegíveis”, alternativas excludentes e incentivos de "
                          "implantação aparecem separados e não entram no total garantido.",
        },
    }


def _ref(comps: dict, co: int) -> dict:
    return (_res(comps, co).get("_referencia") or {})


def _op(id_: str, programa: str, **kw) -> dict:
    base = {"id": id_, "programa": programa, "situacao_atual": "", "perfil": "", "elegibilidade": "dados_insuficientes",
            "quantidade": None, "custeio_unitario": None, "implantacao_unitaria": None, "incremento_mensal": None,
            "incremento_anual": None, "implantacao_total": None, "portaria": None, "fundamento": None,
            "condicoes": [], "etapas": [], "pendencias": [], "disponibilidade": "Não verificável nas bases "
            "autorizadas (e-Gestor/SIAPS): conferir abertura no e-Gestor (Credenciamento) antes de solicitar.",
            "providencia": "", "grupo_exclusivo": None, "conta_no_total": True}
    base.update(kw)
    if base["incremento_mensal"] is None and base["quantidade"] and base["custeio_unitario"]:
        base["incremento_mensal"] = round(base["quantidade"] * base["custeio_unitario"], 2)
    if base["incremento_mensal"] is not None:
        base["incremento_anual"] = round(base["incremento_mensal"] * 12, 2)
    if base["quantidade"] and base["implantacao_unitaria"]:
        base["implantacao_total"] = round(base["quantidade"] * base["implantacao_unitaria"], 2)
    base["elegibilidade_rotulo"] = ELEG[base["elegibilidade"]]
    return base


def _oportunidades(comps, params, perfil, cadastradas, hv, pg, equipes_siaps, aval) -> list[dict]:
    V = lambda k: ap.valor(params, k)                                  # noqa: E731
    ops: list[dict] = []
    estrato = perfil["estrato_ied"]
    r48 = _res(comps, 48)
    teto, cred, hom, pag = (r48.get(k) for k in ("qtTeto", "qtCredenciado", "qtHomologado", "qtPagamento"))
    # valor mensal praticado por eSF nesta parcela (oficial) — referência para nova eSF
    por_esf = None
    if _n(pag):
        por_esf = round((_n(r48.get("vlPagamentoFixo")) + _n(r48.get("vlPagamentoVinculo")) +
                         _n(r48.get("vlPagamentoQualidade"))) / _n(pag), 2)
    por_esf_norma = (V(f"fixo.eSF.{estrato}") + V("vinculo.eSF.bom") + V("qualidade.eSF.bom")) if estrato else None
    ref_esf = "valor por eSF pago nesta parcela (e-Gestor)" if por_esf else "PRT 3.493/2024 (fixo + vínculo/qualidade “Bom”)"

    # 1. eSF credenciada e ainda não homologada
    if isinstance(cred, (int, float)) and isinstance(hom, (int, float)) and cred > hom:
        n = int(cred - hom)
        ops.append(_op("esf_homologacao", "eSF — homologação de equipe já credenciada", quantidade=n,
                       situacao_atual=f"{int(cred)} eSF credenciadas, {int(hom)} homologadas, {int(pag or 0)} pagas (e-Gestor).",
                       perfil=f"Estrato {estrato[1:] if estrato else '—'}; teto {teto} eSF.",
                       elegibilidade="potencial", custeio_unitario=por_esf or por_esf_norma,
                       implantacao_unitaria=V("implantacao.eSF"), portaria="PRT GM/MS 3.493/2024",
                       fundamento="Art. 9º-B (fixo), Art. 3º § 3º (nova homologação recebe vínculo e qualidade no valor "
                                  f"“Bom”), Art. 9º-C (implantação). Custeio por equipe: {ref_esf}.",
                       condicoes=["Equipe completa e ativa no SCNES na competência avaliada",
                                  "Homologação publicada em portaria do MS", "Produção enviada ao SISAB"],
                       etapas=["Conferir a equipe no SCNES (composição, carga horária, INE)",
                               "Acompanhar a homologação no e-Gestor (Credenciamento)",
                               "Após a portaria, conferir o pagamento na parcela seguinte"],
                       pendencias=["Homologação pelo MS"], providencia="Verificar por que a eSF credenciada não foi homologada e regularizar no SCNES.",
                       disponibilidade="Equipe já credenciada (e-Gestor).", grupo_exclusivo="esf_vaga"))
    # 2. Vaga de credenciamento dentro do teto
    if isinstance(teto, (int, float)) and isinstance(cred, (int, float)):
        vagas = int(teto - cred)
        if vagas > 0:
            ops.append(_op("esf_nova", "eSF — credenciamento de nova equipe (vaga no teto)", quantidade=vagas,
                           situacao_atual=f"Teto de {int(teto)} eSF; {int(cred)} credenciadas → {vagas} vaga(s).",
                           perfil=f"População {perfil['populacao'] or '—'}; estrato {estrato[1:] if estrato else '—'}.",
                           elegibilidade="potencial", custeio_unitario=por_esf or por_esf_norma,
                           implantacao_unitaria=V("implantacao.eSF"), portaria="PRT GM/MS 3.493/2024",
                           fundamento=f"Art. 9º-B, Art. 9º-C e teto publicado no e-Gestor. Custeio por equipe: {ref_esf}.",
                           condicoes=["Profissionais (médico, enfermeiro, técnico de enfermagem, ACS) contratados",
                                      "UBS/estrutura física disponível", "Cadastro da equipe no SCNES"],
                           etapas=["Cadastrar a equipe no SCNES", "Solicitar credenciamento no e-Gestor",
                                   "Aguardar portaria de credenciamento e homologação"],
                           pendencias=["Profissionais e estrutura (não verificáveis nas bases autorizadas)",
                                       "Abertura de credenciamento no e-Gestor"],
                           providencia="Avaliar necessidade territorial e solicitar credenciamento no e-Gestor.",
                           grupo_exclusivo="esf_vaga"))
            ops.append(_op("eap_nova", "eAP 30h — alternativa à eSF na mesma vaga", quantidade=vagas,
                           situacao_atual="Nenhuma eAP credenciada.", perfil="Vaga do teto pode ser eSF ou eAP.",
                           elegibilidade="potencial",
                           custeio_unitario=(V(f"fixo.eAP30.{estrato}") + V("vinculo.eAP30.bom") + V("qualidade.eAP30.bom"))
                           if estrato else None,
                           implantacao_unitaria=V("implantacao.eAP30"), portaria="PRT GM/MS 3.493/2024",
                           fundamento="Art. 9º-B, Anexos II e III (valor “Bom” para nova homologação, Art. 3º § 3º).",
                           condicoes=["Médico e enfermeiro com 30h"], etapas=["Cadastrar no SCNES", "Solicitar no e-Gestor"],
                           pendencias=["Excludente com a eSF na mesma vaga"], providencia="Comparar com a eSF antes de decidir.",
                           grupo_exclusivo="esf_vaga", conta_no_total=False))
        elif vagas <= 0:
            ops.append(_op("esf_teto", "eSF — novas equipes", elegibilidade="nao_elegivel",
                           situacao_atual=f"Teto de {int(teto)} eSF já ocupado ({int(cred)} credenciadas).",
                           perfil=f"Estrato {estrato[1:] if estrato else '—'}.", portaria="PRT GM/MS 3.493/2024",
                           fundamento="Teto de equipes publicado no e-Gestor.", providencia="Sem vaga no teto atual."))

    # 3. Segunda eMulti (SIAPS × e-Gestor)
    ref42 = _ref(comps, 42)
    qcred = (ref42.get("quantitativoCredenciado") or {}).get("qtTotal")
    lista = ref42.get("listaValoresReferencia") or []
    custeios = {_norm(x.get("dsSubTipoEquipe")).replace("EMULTI ", "").lower(): x for x in lista}
    emultis = [e for e in equipes_siaps if e.tipo == "eMulti"]
    nao_cred = [e for e in emultis if not any(v["ine"] == e.ine for v in pg["equipes"])]
    if emultis and qcred is not None and len(emultis) > int(qcred):
        nomes = ", ".join(f"{e.nome} (INE {e.ine})" for e in nao_cred) or f"{len(emultis) - int(qcred)} equipe(s)"
        for mod in ("estrategica", "complementar", "ampliada"):
            x = next((v for k, v in custeios.items() if mod in _norm(k).lower()), None)
            if not x:
                continue
            ops.append(_op(f"emulti_{mod}", f"eMulti {mod.capitalize()} — credenciamento da equipe cadastrada",
                           quantidade=1, situacao_atual=f"SIAPS: {len(emultis)} eMulti; e-Gestor: {int(qcred)} credenciada(s). "
                                                        f"Sem credenciamento: {nomes}.",
                           perfil="Modalidade da equipe não identificável nas bases autorizadas.",
                           elegibilidade="potencial",
                           custeio_unitario=round(_n(x.get("vlCusteio")) + _n(V(f"qualidade.eMulti.{mod}.bom")), 2),
                           implantacao_unitaria=x.get("vlImplantacao"), portaria=x.get("portaria"),
                           fundamento=f"Custeio de referência publicado no e-Gestor ({x.get('portaria')}) + qualidade “Bom” "
                                      "(PRT 3.493/2024, Anexo III). Sem direito automático: depende de credenciamento e homologação.",
                           condicoes=["Modalidade definida pela carga horária e nº de eSF/eAP vinculadas",
                                      "Composição mínima da modalidade no SCNES", "Credenciamento e homologação pelo MS"],
                           etapas=["Conferir no SCNES modalidade, profissionais e carga horária da equipe",
                                   "Verificar se já existe ato de credenciamento", "Solicitar credenciamento no e-Gestor",
                                   "Acompanhar a portaria de homologação"],
                           pendencias=["Modalidade", "Ato de credenciamento", "Homologação"],
                           providencia="Prioridade: confirmar modalidade e solicitar credenciamento da 2ª eMulti.",
                           grupo_exclusivo="emulti_2"))
    # 4. eSB — modalidade II e novas equipes
    r5, ref5 = _res(comps, 5), _ref(comps, 5).get("valoresReferencia") or {}
    vI, vII = ref5.get("vlCusteioModalidadeI"), ref5.get("vlCusteioModalidadeII")
    qI = int(_n(r5.get("qtPagamentoModalidadeI")))
    if vI and vII and qI:
        ops.append(_op("esb_modII", "eSB 40h — passagem da Modalidade I para II", quantidade=qI,
                       situacao_atual=f"{qI} eSB na Modalidade I (e-Gestor).", perfil="Todas as eSB pagas na Modalidade I.",
                       elegibilidade="potencial", custeio_unitario=round(vII - vI, 2), portaria=ref5.get("portaria"),
                       fundamento=f"Diferença de custeio I→II publicada no e-Gestor ({ref5.get('portaria')}).",
                       condicoes=["Composição da Modalidade II no SCNES (inclui técnico em saúde bucal)"],
                       etapas=["Contratar/cadastrar TSB", "Atualizar a equipe no SCNES", "Solicitar alteração no e-Gestor"],
                       pendencias=["Profissionais (não verificável nas bases autorizadas)"],
                       providencia="Avaliar contratação de TSB por equipe.",
                       observacao="Custeio unitário = acréscimo por equipe que mudar de modalidade; a quantidade é o "
                                  "máximo possível (todas as eSB)."))
    esb_cred = r5.get("qtCredenciado")
    base_esb = sum(cadastradas.get(t, 0) for t in ("eSF", "eAP", "eSFR"))
    if esb_cred is not None:
        ops.append(_op("esb_nova", "eSB 40h — novas equipes", elegibilidade="dados_insuficientes",
                       situacao_atual=f"{int(esb_cred)} eSB credenciadas; {base_esb} eSF/eAP/eSFR no SIAPS.",
                       perfil="O teto de eSB não é publicado nas bases autorizadas.", custeio_unitario=vI,
                       implantacao_unitaria=V("implantacao.eSB40") or ref5.get("vlImplantacao"),
                       portaria=ref5.get("portaria"), fundamento="Valores de referência do e-Gestor.",
                       pendencias=["Teto de eSB do município"], providencia="Consultar o teto de eSB no e-Gestor (Credenciamento)."))
    # 5. Programas publicados no e-Gestor sem recebimento (descoberta automática)
    conhecidos = {
        6: ("ecr", "Equipe de Consultório na Rua (eCR)", ["População em situação de rua no território (critério da portaria)"]),
        7: ("esfr", "eSF Ribeirinha (eSFR) — novas equipes", ["Território ribeirinho/fluvial com população dispersa"]),
        8: ("academia", "Academia da Saúde — polo", ["Polo construído/habilitado"]),
        9: ("uom", "Unidade Odontológica Móvel (UOM)", ["Veículo/unidade móvel e eSB vinculada"]),
        10: ("ubsf", "Unidade Básica de Saúde Fluvial (UBSF)", ["Embarcação UBSF e equipe ribeirinha"]),
        17: ("residencia", "Residência Multiprofissional em Saúde da Família", ["Programa de residência credenciado"]),
        35: ("atividade_fisica", "Incentivo de Atividade Física", ["Profissional de educação física e meta de fichas"]),
        72: ("esf_quilombola", "eSF Quilombola", ["Território quilombola reconhecido"]),
    }
    for co, (oid, nome, cond) in conhecidos.items():
        r, ref = _res(comps, co), _ref(comps, co)
        if not r:
            continue
        vr = ref.get("valoresReferencia") or ref.get("listaValoresReferencia")
        vr_list = vr if isinstance(vr, list) else ([vr] if vr else [])
        custeio = next((x.get("vlCusteio") or x.get("vlCusteioModalidadeI") or x.get("valor") for x in vr_list
                        if x.get("vlCusteio") or x.get("vlCusteioModalidadeI") or x.get("valor")), None)
        portaria = next((x.get("portaria") for x in vr_list if x.get("portaria") not in (None, "-")), None)
        qt_c = r.get("qtCredenciado")
        pago = _n(r.get("vlTotal"))
        if oid == "esfr":
            sit = f"{int(qt_c or 0)} eSFR credenciada(s), R$ {pago:,.2f} na parcela."
        else:
            sit = (f"{int(qt_c)} credenciado(s); " if isinstance(qt_c, (int, float)) else "") + \
                  ("sem recebimento nesta parcela." if not pago else f"R$ {pago:,.2f} na parcela.")
        if pago and oid not in ("esfr", "uom"):
            continue
        ops.append(_op(oid, nome, elegibilidade="dados_insuficientes", situacao_atual=sit,
                       perfil="Requisito territorial/estrutural não verificável no e-Gestor/SIAPS.",
                       custeio_unitario=custeio, implantacao_unitaria=next((x.get("vlImplantacao") for x in vr_list
                                                                          if x.get("vlImplantacao")), None),
                       portaria=portaria, fundamento=f"Valor de referência publicado no e-Gestor ({portaria or 'portaria não informada'}).",
                       condicoes=cond, pendencias=["Critérios específicos do programa", "Abertura/vagas"],
                       providencia="Verificar critérios na portaria e a abertura do programa no e-Gestor."))
    # 6. ACS — teto
    r12 = _res(comps, 12)
    if r12.get("qtTeto") is not None:
        t, c_, p_ = int(_n(r12.get("qtTeto"))), int(_n(r12.get("qtCredenciado"))), int(_n(r12.get("qtPagamento")))
        vacs = (_ref(comps, 12).get("valoresReferencia") or {}).get("vlCusteio")
        ops.append(_op("acs", "Agentes Comunitários de Saúde — ampliação",
                       elegibilidade="nao_elegivel" if c_ >= t else "potencial",
                       situacao_atual=f"Teto {t}, credenciados {c_}, pagos {p_} (e-Gestor).",
                       perfil="Quantitativo acima do teto." if c_ > t else "", quantidade=max(0, t - c_) or None,
                       custeio_unitario=vacs, portaria=(_ref(comps, 12).get("valoresReferencia") or {}).get("portaria"),
                       fundamento="Teto e valor de referência publicados no e-Gestor.",
                       providencia=("Sem vaga: credenciados acima do teto." if c_ >= t else "Solicitar credenciamento de ACS.")))
    return ops


def _respostas(kpis, desempenho, ops, pg, transicao) -> list[dict]:
    brl = lambda v: f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")  # noqa: E731
    pot = [o for o in ops if o["elegibilidade"] == "potencial"]
    conf = [o for o in ops if o["elegibilidade"] == "confirmada"]
    return [
        {"pergunta": "Quanto o município recebe atualmente?",
         "resposta": f"{brl(kpis['financiamento_atual_mensal'])} na {pg['parcela_rotulo']} (pago, e-Gestor) — "
                     f"projeção anual {brl(kpis['financiamento_atual_anual'])} se mantido."},
        {"pergunta": "Quanto poderá incrementar melhorando os indicadores?",
         "resposta": f"{brl(desempenho['incremento_mensal_proximo_nivel'])}/mês subindo um nível nas equipes válidas "
                     f"({brl(desempenho['incremento_mensal_todas_otimo'])}/mês com todas em Ótimo)"
                     + ("." if desempenho["efeito_financeiro"] == "imediato" else " — efeito após a transição (hoje o MS paga “Bom”).")
                     + (f" Mais {brl(desempenho['incremento_mensal_nao_confirmado'])}/mês dependem de parâmetro a atualizar."
                        if desempenho["incremento_mensal_nao_confirmado"] else "")},
        {"pergunta": "Quais novos programas e equipes poderá solicitar?",
         "resposta": ", ".join(o["programa"] for o in pot) or "Nenhuma oportunidade com perfil compatível identificada."},
        {"pergunta": "O município atende aos requisitos de credenciamento?",
         "resposta": (f"{len(conf)} confirmada(s); {len(pot)} potencialmente elegível(is) com requisitos a confirmar "
                      f"(profissionais, estrutura, abertura no e-Gestor); {kpis['oportunidades_dados_insuficientes']} "
                      "sem dados suficientes nas bases autorizadas.")},
        {"pergunta": "Quanto cada novo credenciamento poderá acrescentar?",
         "resposta": "; ".join(f"{o['programa']}: {brl(o['incremento_mensal'])}/mês ({brl(o['incremento_anual'])}/ano)"
                               for o in pot if o["incremento_mensal"]) or "—"},
        {"pergunta": "Quais providências o gestor deve tomar?",
         "resposta": " ".join(f"• {o['providencia']}" for o in pot if o["providencia"]) or "—"},
    ]
