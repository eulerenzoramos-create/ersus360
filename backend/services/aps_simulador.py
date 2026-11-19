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


def _brl(v) -> str:
    return "R$ " + f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


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
    uf = next((e["detalhe"].get("sgUf") for e in pg["equipes"] if (e.get("detalhe") or {}).get("sgUf")), None)
    perfil = {"uf": uf, "estrato_ied": estrato, "estrato_texto": r48.get("dsFaixaIndiceEquidade"), "populacao": populacao,
              "populacao_ano": pop_ano, "quadrimestre_avaliacao": quad, "cobertura_estimada": cobertura,
              "classificacao_vinculo_egestor": pg.get("classificacao_vinculo"),
              "classificacao_qualidade_egestor": pg.get("classificacao_qualidade"),
              "equipes": [{"tipo": t, "cadastradas_siaps": cadastradas[t],
                           "homologadas_siaps": (hv or {}).get("homologadas", {}).get(t),
                           "validas_siaps": (hv or {}).get("validas", {}).get(t)} for t in tipos]}

    # ── Regra de pagamento de vínculo e qualidade — detectada no próprio pagamento do e-Gestor ─────────────
    # Para cada componente, compara o valor pago com (a) todas as equipes no valor "Bom" (regra de transição) e
    # (b) a classificação de cada equipe em cada avaliação quadrimestral capturada. O que fechar é a regra que o
    # MS aplicou nesta parcela. Equipe paga sem avaliação no quadrimestre (nova homologação) entra como "Bom"
    # (Art. 12-D, § 2º). Nada fecha → divergência (parâmetro/norma a registrar).
    por_quad: dict[str, dict] = {}
    for r in await sq._ativos(db, municipio_id):
        por_quad.setdefault(r.quadrimestre, {})[(r.componente, r.ine)] = r
    quads = sorted(por_quad, reverse=True)
    pg_eq: dict[str, list] = {}
    for e in pg["equipes"]:
        pg_eq.setdefault(e["ine"], []).append(e)
    pagos = {co: [e["ine"] for e in pg["equipes"] if e["co_componente"] == co and e["ok"]] for co in (48, 5, 42, 7)}
    r5 = _res(comps, 5)
    qI, qII = int(_n(r5.get("qtPagamentoModalidadeI"))), int(_n(r5.get("qtPagamentoModalidadeII")))
    qIq, qIIq = int(_n(r5.get("qtPagamentoEqpQuilombAssentModalI"))), int(_n(r5.get("qtPagamentoEqpQuilombAssentModalII")))
    ref42 = (_res(comps, 42).get("_referencia") or {})
    qpag = ref42.get("quantitativoPagamento") or {}
    mod_emulti = {"qtAmpliada": "ampliada", "qtComplementar": "complementar", "qtEstrategica": "estrategica"}
    emulti_mods = {m: int(qpag.get(k) or 0) for k, m in mod_emulti.items() if qpag.get(k)}

    def chave_esb(ine: str) -> str | None:
        det = next((v["detalhe"] for v in pg_eq.get(ine, []) if v["co_componente"] == 5), {}) or {}
        mod = "II" if str(det.get("modalidade")) == "2" else "I" if str(det.get("modalidade")) == "1" else None
        if mod is None:
            return None
        tot, quil = (qI, qIq) if mod == "I" else (qII, qIIq)
        if quil and quil != tot:
            return None                                    # mistura comum × quilombola/assentamento: não identificável
        return f"qualidade.eSB.{mod}{'_quil' if quil else ''}"

    REGRAS = [
        ("qualidade.eSF", "eSF — qualidade", "QUALIDADE", pagos[48], lambda i: "qualidade.eSF", r48.get("vlPagamentoQualidade")),
        ("vinculo.eSF", "eSF — vínculo e acompanhamento", "CVAT", pagos[48], lambda i: "vinculo.eSF", r48.get("vlPagamentoVinculo")),
        ("qualidade.eSB", "eSB — qualidade", "QUALIDADE", pagos[5], chave_esb, _res(comps, 50).get("vlTotal")),
        ("qualidade.eMulti", "eMulti — qualidade", "QUALIDADE", pagos[42],
         (lambda i: f"qualidade.eMulti.{next(iter(emulti_mods))}") if len(emulti_mods) == 1 else (lambda i: None),
         _res(comps, 51).get("vlTotal")),
        ("qualidade.eSFR", "eSFR — qualidade", "QUALIDADE", pagos[7], lambda i: "qualidade.eSFR", _res(comps, 58).get("vlTotal")),
        ("vinculo.eSFR", "eSFR — vínculo e acompanhamento", "CVAT", pagos[7], lambda i: "vinculo.eSFR", _res(comps, 61).get("vlTotal")),
    ]
    periodo = (params.get("transicao.periodo") or {}).get("valor_texto") or ""
    fim_transicao = periodo.split("-")[-1] if "-" in periodo else "999999"
    regras: dict[str, dict] = {}
    cands_por: dict[str, list] = {}
    diferencas: list[dict] = []
    for chave, rotulo, comp_q, ines_pagos, chave_fn, pago in REGRAS:
        if not ines_pagos or pago is None:
            continue
        pago = _n(pago)

        def val(ine, classe, _f=chave_fn):
            k = _f(ine)
            return V(f"{k}.{classe}") if k and classe in ap.CLASSES else None

        def soma(classes: dict, _ines=ines_pagos, _val=val) -> float | None:
            vs = [_val(i, classes.get(i) or "bom") for i in _ines]
            return None if any(v is None for v in vs) else round(sum(vs), 2)

        cand_bom = soma({})
        cands = []
        for q in quads:
            cls = {i: (por_quad[q].get((comp_q, i)).classificacao if por_quad[q].get((comp_q, i)) else None) for i in ines_pagos}
            cands.append((q, cls, soma(cls)))
        tol = TOL * max(1, len(ines_pagos))
        reg = {"chave": chave, "rotulo": rotulo, "pago": pago, "equipes_pagas": len(ines_pagos), "componente_siaps": comp_q,
               "valor_bom": cand_bom, "regra": None, "quadrimestre": None, "esperado": None, "classes": {}}
        bom_ok = cand_bom is not None and abs(cand_bom - pago) <= tol
        # avaliação que explica o pagamento: com alguma equipe fora de "Bom" (senão não se distingue da transição)
        achou = next(((q, cls, s) for q, cls, s in cands if s is not None and abs(s - pago) <= tol
                      and any((cls.get(i) or "bom") != "bom" for i in ines_pagos)), None)
        empate = next(((q, cls, s) for q, cls, s in cands if s is not None and abs(s - pago) <= tol
                       and any(cls.get(i) for i in ines_pagos)), None)
        if cand_bom is None and not achou:
            reg["regra"] = "sem_parametro"
        elif achou:
            q, cls, s = achou
            reg.update(regra="classificacao", quadrimestre=q, esperado=s,
                       classes={i: cls.get(i) or "bom" for i in ines_pagos})
        elif bom_ok:
            # todas "Bom": transição ou classificação Bom de fato — resolvido abaixo pelo mesmo componente do SIAPS
            reg.update(regra="bom", esperado=cand_bom, classes={i: "bom" for i in ines_pagos},
                       _empate=empate[0] if empate and parcela > fim_transicao else None)
        else:
            reg.update(regra="divergente", esperado=cand_bom)
        # previsão com a avaliação mais recente (a próxima parcela recalculada usa a avaliação seguinte)
        if reg["regra"] == "classificacao" and quads and quads[0] > reg["quadrimestre"]:
            q0, cls0 = cands[0][0], cands[0][1]
            s0 = soma({i: cls0.get(i) or reg["classes"].get(i) for i in ines_pagos})   # sem avaliação nova: mantém a paga
            reg.update(previsao_quadrimestre=q0, previsao_mensal=s0,
                       variacao_mensal=None if s0 is None else round(s0 - pago, 2))
        regras[chave] = reg
        cands_por[chave] = (cands, soma, ines_pagos)
        if reg["regra"] == "divergente":
            diferencas.append({"tipo": "parametro_divergente", "componente": rotulo, "esperado_norma": cand_bom,
                               "pago_egestor": pago, "diferenca": round(pago - cand_bom, 2),
                               "texto": f"{rotulo}: o valor pago ({_brl(pago)}) não fecha nem com “Bom” para todas "
                                        f"({_brl(cand_bom)}) nem com a classificação das equipes em nenhuma avaliação "
                                        "capturada. Registrar a norma vigente ou capturar a avaliação do quadrimestre."})
            alertas.append({"tipo": "atualizacao_manual", "chave": chave,
                            "texto": f"“{rotulo}”: pagamento não confere com os parâmetros cadastrados — registrar a norma vigente."})
        elif reg["regra"] == "sem_parametro":
            lacunas.append(f"{rotulo}: sem tabela por classificação cadastrada para a modalidade paga — incremento não calculado.")

    # empate "Bom para todas" × avaliação com todas "Bom": se outro componente do mesmo bloco do SIAPS (ex.: qualidade)
    # já é pago pela classificação das equipes, este também é
    for reg in regras.values():
        q_emp = reg.pop("_empate", None)
        if reg["regra"] == "bom" and q_emp and any(o["regra"] == "classificacao" and o["componente_siaps"] == reg["componente_siaps"]
                                                   and o.get("quadrimestre") == q_emp for o in regras.values()):
            reg.update(regra="classificacao", quadrimestre=q_emp)
            if quads and quads[0] > q_emp:
                cs, soma_f, ines_f = cands_por[reg["chave"]]
                q0, cls0 = cs[0][0], cs[0][1]
                s0 = soma_f({i: cls0.get(i) or "bom" for i in ines_f})
                reg.update(previsao_quadrimestre=q0, previsao_mensal=s0,
                           variacao_mensal=None if s0 is None else round(s0 - reg["pago"], 2))
    ROT_REGRA = {"bom": "todas as equipes no valor “Bom” (regra de transição / nova homologação)",
                 "classificacao": "classificação de cada equipe na avaliação {q}",
                 "divergente": "não identificada — pago não confere com os parâmetros",
                 "sem_parametro": "sem parâmetro cadastrado"}
    for reg in regras.values():
        reg["regra_texto"] = ROT_REGRA[reg["regra"]].format(q=reg.get("quadrimestre"))
    transicao = {"periodo": (params.get("transicao.periodo") or {}).get("valor_texto"),
                 "norma": params["transicao.periodo"]["norma"],
                 "regras": [{"componente": r["rotulo"], "regra": r["regra"], "texto": r["regra_texto"],
                             "quadrimestre": r.get("quadrimestre")} for r in regras.values()],
                 "texto": ("Transição (PRT 6.907/2025; perguntas frequentes do SIAPS): de maio/2024 a dezembro/2025 o MS "
                           "pagou vínculo e qualidade no valor “Bom”. O simulador identifica, no pagamento de cada parcela, "
                           "qual regra foi aplicada em cada componente.")}

    # ── Conferência do componente fixo ────────────────────────────────────────────────────────────────
    confere: dict[str, bool] = {}
    if estrato and qt_pag_esf and r48.get("vlPagamentoFixo") is not None:
        esperado = V(f"fixo.eSF.{estrato}") * qt_pag_esf
        confere["fixo.eSF"] = abs(esperado - _n(r48.get("vlPagamentoFixo"))) <= TOL * qt_pag_esf
        if not confere["fixo.eSF"]:
            diferencas.append({"tipo": "parametro_divergente", "componente": "eSF — componente fixo",
                               "esperado_norma": esperado, "pago_egestor": r48.get("vlPagamentoFixo"),
                               "texto": f"eSF — componente fixo: pela norma (Art. 9º-B, {estrato}) seriam {_brl(esperado)}; "
                                        f"o e-Gestor pagou {_brl(_n(r48.get('vlPagamentoFixo')))}."})
    for reg in regras.values():
        if reg.get("variacao_mensal"):
            v = reg["variacao_mensal"]
            diferencas.append({"tipo": "previsao_proxima_avaliacao", "componente": reg["rotulo"], "diferenca": v,
                               "texto": f"{reg['rotulo']}: com a avaliação {reg['previsao_quadrimestre']} (mais recente) o "
                                        f"valor mensal passa de {_brl(reg['pago'])} para {_brl(reg['previsao_mensal'])} "
                                        f"({'+' if v > 0 else '−'}{_brl(abs(v))}/mês) quando o MS aplicar essa avaliação."})

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
                               "texto": f"{c['componente']}: desconto de {_brl(abs(_n(c['vl_desconto'])))} nesta "
                                        "parcela (ver pendências das equipes no Relatório de Pagamento)."})
        cred, pag = r.get("qtCredenciado"), r.get("qtPagamento")
        if isinstance(cred, (int, float)) and isinstance(pag, (int, float)) and cred > pag:
            diferencas.append({"tipo": "credenciada_sem_pagamento", "componente": c["componente"],
                               "texto": f"{c['componente']}: {int(cred)} credenciada(s), {int(pag)} paga(s) — "
                                        f"{int(cred - pag)} sem pagamento nesta parcela."})
    mensal_atual = round(sum(_n(c["vl_total"]) for c in componentes), 2)
    d48, d49 = _n(_comp(comps, 48).get("vl_desconto")), _n(_comp(comps, 49).get("vl_desconto"))
    if d48 and d48 == d49 and not _n(_res(comps, 49).get("qtCredenciado")):
        diferencas.append({"tipo": "desconto_repetido", "componente": "eSF/eAP", "diferenca": d49,
                           "texto": f"O e-Gestor publica o mesmo desconto ({_brl(abs(d49))}) na eSF e na eAP, sem eAP "
                                    "credenciada. O total acima soma os dois como publicado; conferir no e-Gestor/FNS se é "
                                    "um único desconto (nesse caso o valor recebido é maior)."})

    # ── Por equipe: pago (pela regra identificada) × previsto (avaliação mais recente) × potencial ─────────
    nomes = {e.ine: e for e in equipes_siaps}
    ines = sorted(set(nomes) | set(pg_eq), key=lambda i: (tipos.index(nomes[i].tipo) if i in nomes and nomes[i].tipo in tipos else 9,
                                                           nomes[i].nome if i in nomes else i))
    por_equipe, inc_prox, inc_otimo, inc_apos, inc_nc = [], 0.0, 0.0, 0.0, 0.0
    fim_trans = [0.0, 0.0]          # [perdas, ganhos] por mês quando a classificação real passar a valer
    COMP_POR_TIPO = {"eSF": [("vinculo", "vinculo.eSF"), ("qualidade", "qualidade.eSF")], "eSB": [("qualidade", "qualidade.eSB")],
                     "eMulti": [("qualidade", "qualidade.eMulti")],
                     "eSFR": [("vinculo", "vinculo.eSFR"), ("qualidade", "qualidade.eSFR")]}
    FN = {r[0]: r[4] for r in REGRAS}

    def rateio(co: int, campo: str, qt_campo: str = "qtPagamento") -> float | None:
        r = _res(comps, co)
        qt = _n(r.get(qt_campo))
        return round(_n(r.get(campo)) / qt, 2) if qt and r.get(campo) is not None else None

    for ine in ines:
        eq = nomes.get(ine)
        tipo = eq.tipo if eq else (pg_eq[ine][0].get("tipo") if pg_eq.get(ine) else None)
        vals = pg_eq.get(ine, [])
        pago_ok = any(v["ok"] for v in vals) if vals else None
        pend = [p["rotulo"] + ": " + str(p["situacao"]) for v in vals for p in v["pendencias"]]
        aq, av = aval.get(("QUALIDADE", ine)), aval.get(("CVAT", ine))
        linha = {"ine": ine, "equipe": eq.nome if eq else (vals[0].get("equipe") if vals else None), "tipo": tipo,
                 "homologada": aq.homologada if aq else None, "valida": aq.equipe_valida if aq else None,
                 "credenciada_egestor": bool(vals), "pagamento_ok": pago_ok, "pendencias": pend,
                 "vinculo": {"classificacao": av.classificacao, "nota": av.nota_final} if av else None,
                 "qualidade": {"classificacao": aq.classificacao, "nota": aq.nota_final} if aq else None,
                 "atual": {}, "norma": {}, "melhoria": [], "observacoes": []}
        # custeio/fixo (não dependem de classificação)
        if pago_ok:
            if tipo == "eSF":
                linha["atual"]["fixo"] = rateio(48, "vlPagamentoFixo")
            elif tipo == "eSB":
                linha["atual"]["custeio"] = rateio(5, "vlPagamento", "qtPagamentoModalidadeI") if not qII else None
            elif tipo == "eMulti":
                linha["atual"]["custeio"] = rateio(42, "vlPagamento", "qtHomologado")
                linha["atual"]["atendimento_remoto"] = _n(_res(comps, 55).get("vlTotal")) / max(1, sum(emulti_mods.values())) if emulti_mods else None
            elif tipo == "eSFR":
                linha["atual"]["custeio"] = rateio(7, "vlPagamento")
        linha["norma"] = {k: v for k, v in linha["atual"].items()}
        if tipo == "eSF" and estrato:
            linha["norma"]["fixo"] = V(f"fixo.eSF.{estrato}")
        for comp_k, chave in COMP_POR_TIPO.get(tipo, []):
            reg_regra = regras.get(chave)
            reg_aval = av if comp_k == "vinculo" else aq
            kfn = FN.get(chave)
            k_base = kfn(ine) if kfn else None
            if pago_ok and reg_regra and reg_regra["regra"] in ("bom", "classificacao") and k_base:
                cl_pago = reg_regra["classes"].get(ine, "bom")
                linha["atual"][comp_k] = V(f"{k_base}.{cl_pago}")
            elif pago_ok and reg_regra:
                tot = {"qualidade.eSF": r48.get("vlPagamentoQualidade"), "vinculo.eSF": r48.get("vlPagamentoVinculo"),
                       "qualidade.eSB": _res(comps, 50).get("vlTotal"), "qualidade.eMulti": _res(comps, 51).get("vlTotal"),
                       "qualidade.eSFR": _res(comps, 58).get("vlTotal"), "vinculo.eSFR": _res(comps, 61).get("vlTotal")}.get(chave)
                linha["atual"][comp_k] = round(_n(tot) / max(1, reg_regra["equipes_pagas"]), 2)
            if not reg_aval or reg_aval.classificacao not in ap.CLASSES or not k_base:
                if linha["atual"].get(comp_k) is not None:
                    linha["norma"][comp_k] = linha["atual"][comp_k]          # sem avaliação nova: mantém o pago
                if not k_base and pago_ok:
                    linha["observacoes"].append(f"Modalidade sem tabela de {comp_k} identificável: valor pela norma não calculado.")
                elif pago_ok:
                    linha["observacoes"].append(f"Sem classificação de {comp_k} na avaliação mais recente do SIAPS.")
                continue
            cl = reg_aval.classificacao
            atual_v = V(f"{k_base}.{cl}")
            regra = reg_regra["regra"] if reg_regra else "sem_parametro"
            if regra == "bom":
                # ainda pago como "Bom": a previsão continua "Bom"; o efeito da classificação real vale no fim da transição
                linha["norma"][comp_k] = V(f"{k_base}.bom")
                delta = round(atual_v - V(f"{k_base}.bom"), 2)
                if delta and pago_ok and reg_aval.equipe_valida:
                    linha["fim_transicao"] = linha.get("fim_transicao", []) + [
                        {"componente": comp_k, "classificacao": cl, "variacao_mensal": delta}]
                    fim_trans[0 if delta < 0 else 1] += delta
            else:
                linha["norma"][comp_k] = atual_v
            efeito = {"classificacao": "proxima_avaliacao", "bom": "apos_transicao"}.get(regra, "nao_confirmado")
            alvo = _proxima(cl)
            if alvo:
                ganho = V(f"{k_base}.{alvo}") - atual_v
                linha["melhoria"].append({"componente": comp_k, "de": cl, "para": alvo, "incremento_mensal": ganho,
                                          "confirmado": efeito != "nao_confirmado", "efeito": efeito,
                                          "plano": plano_melhoria(reg_aval, alvo), "norma": params[f"{k_base}.{alvo}"]["norma"]})
                if reg_aval.equipe_valida and pago_ok:
                    if efeito == "proxima_avaliacao":
                        inc_prox += ganho
                    elif efeito == "apos_transicao":
                        inc_apos += ganho
                    else:
                        inc_nc += ganho
            if cl != "otimo" and reg_aval.equipe_valida and pago_ok and efeito == "proxima_avaliacao":
                inc_otimo += V(f"{k_base}.otimo") - atual_v
        linha["atual"] = {k: v for k, v in linha["atual"].items() if v is not None}
        linha["norma"] = {k: v for k, v in linha["norma"].items() if v is not None}
        linha["atual_total"] = round(sum(_n(v) for v in linha["atual"].values()), 2) if linha["atual"] else None
        linha["norma_total"] = round(sum(_n(v) for v in linha["norma"].values()), 2) if linha["norma"] else None
        por_equipe.append(linha)

    efeito_hoje = inc_prox > 0
    variacao_proxima = round(sum(r.get("variacao_mensal") or 0 for r in regras.values()), 2)
    desempenho = {
        "incremento_mensal_proximo_nivel": round(inc_prox, 2),
        "incremento_mensal_todas_otimo": round(inc_otimo, 2),
        "incremento_mensal_apos_transicao": round(inc_apos, 2),
        "incremento_mensal_nao_confirmado": round(inc_nc, 2),
        "variacao_proxima_avaliacao_mensal": variacao_proxima,
        "fim_transicao_perdas_mensal": round(fim_trans[0], 2),
        "fim_transicao_ganhos_mensal": round(fim_trans[1], 2),
        "efeito_financeiro": "imediato" if efeito_hoje else "apos_transicao",
        "regras": list(regras.values()),
        "texto": ("Incremento por desempenho = valor pela norma com a classificação melhorada − valor pela norma com a "
                  "classificação atual (equipes válidas). Entra no total só onde o MS já paga pela classificação de cada "
                  "equipe (regra identificada no pagamento). Onde ainda paga “Bom” para todas (transição), o ganho aparece "
                  "como “após a transição”."),
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
    inc_desemp_total = desempenho["incremento_mensal_proximo_nivel"]
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
                                                  desempenho["incremento_mensal_apos_transicao"], 2),
            "incremento_desempenho_apos_transicao_mensal": desempenho["incremento_mensal_apos_transicao"],
            "variacao_proxima_avaliacao_mensal": desempenho["variacao_proxima_avaliacao_mensal"],
            "fim_transicao_perdas_mensal": desempenho["fim_transicao_perdas_mensal"],
            "fim_transicao_ganhos_mensal": desempenho["fim_transicao_ganhos_mensal"],
            "oportunidades": len(oportunidades),
            "oportunidades_confirmadas": sum(1 for o in oportunidades if o["elegibilidade"] == "confirmada"),
            "oportunidades_pendentes": sum(1 for o in oportunidades if o["elegibilidade"] == "potencial"),
            "oportunidades_dados_insuficientes": sum(1 for o in oportunidades if o["elegibilidade"] == "dados_insuficientes")}

    respostas = _respostas(kpis, desempenho, oportunidades, pg, transicao)
    por_tipo = resumo_por_tipo(componentes, por_equipe, regras, oportunidades)
    return {
        "situacao_dado": "oficial_validado", "parcela": parcela, "parcela_rotulo": pg["parcela_rotulo"],
        "parcelas": pg["parcelas"], "competencia_cnes": pg.get("competencia_cnes"),
        "fontes": [FONTE_EGESTOR, FONTE_SIAPS + (f" ({quad})" if quad else ""),
                   "Parâmetros: " + ap.FONTE_BASE],
        "nao_utiliza": "CNS e e-SUS PEC não são fontes deste simulador.",
        "perfil": perfil, "transicao": transicao, "kpis": kpis, "componentes": componentes,
        "diferencas": diferencas, "por_equipe": por_equipe, "desempenho": desempenho,
        "oportunidades": oportunidades, "alertas": alertas, "lacunas": lacunas, "respostas": respostas,
        "por_tipo": por_tipo,
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
    ref_esf = ("fixo do estrato + vínculo e qualidade no valor “Bom” (nova homologação recebe “Bom” até o 2º recálculo, "
               "Art. 12-D, § 2º)" if por_esf_norma else "valor por eSF pago nesta parcela (e-Gestor)")

    # 1. eSF credenciada e ainda não homologada
    if isinstance(cred, (int, float)) and isinstance(hom, (int, float)) and cred > hom:
        n = int(cred - hom)
        ops.append(_op("esf_homologacao", "eSF — homologação de equipe já credenciada", quantidade=n,
                       situacao_atual=f"{int(cred)} eSF credenciadas, {int(hom)} homologadas, {int(pag or 0)} pagas (e-Gestor).",
                       perfil=f"Estrato {estrato[1:] if estrato else '—'}; teto {teto} eSF.",
                       elegibilidade="potencial", custeio_unitario=por_esf_norma or por_esf,
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
                           elegibilidade="potencial", custeio_unitario=por_esf_norma or por_esf,
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
    ops.extend(_oportunidades_esfr(comps, params, perfil))
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
            sit = f"{int(qt_c or 0)} eSFR credenciada(s), {_brl(pago)} na parcela."
        else:
            sit = (f"{int(qt_c)} credenciado(s); " if isinstance(qt_c, (int, float)) else "") + \
                  ("sem recebimento nesta parcela." if not pago else f"{_brl(pago)} na parcela.")
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


AMAZONIA_LEGAL_PANTANAL = {"AC", "AM", "AP", "PA", "RO", "RR", "TO", "MT", "MA", "MS"}   # MS: Pantanal Sul-Mato-Grossense


def _oportunidades_esfr(comps, params, perfil) -> list[dict]:
    """Arranjo ribeirinho (PRT GM/MS 5.850/2024, Arts. 69–72; PRT 8.994/2025): o pagamento da eSFR no e-Gestor é
    comparado com o custeio base. Se só o base é pago, profissionais adicionais e logística não estão sendo
    custeados — oportunidade de adequação. Estruturas registradas (embarcações/unidades de apoio) vêm do e-Gestor."""
    V = lambda k: ap.valor(params, k)                                  # noqa: E731
    r7 = _res(comps, 7)
    if not r7 or not V("esfr.custeio"):
        return []
    norma = params["esfr.custeio"]["norma"].split(",")[0]
    qt = int(_n(r7.get("qtPagamento")))
    pago_custeio = _n(r7.get("vlPagamento"))
    base = V("esfr.custeio") * qt
    so_base = qt and abs(pago_custeio - base) <= TOL
    est = _res(comps, 7).get("_estruturas") or _res(comps, 10).get("_estruturas") or {}
    emb, apoio = est.get("embarcacoes") or [], est.get("unidades_apoio") or []
    uf = perfil.get("uf")
    amazonia = uf in AMAZONIA_LEGAL_PANTANAL if uf else None
    fator = 1.0 if amazonia is not False else 0.5        # PRT 8.994/2025: 50% fora da Amazônia Legal/Pantanal
    r14 = _res(comps, 14)
    micro = int(_n(r14.get("qtPagamento")))
    v_micro = (_ref(comps, 14).get("valoresReferencia") or {}).get("vlCusteio")
    v_acs = (_ref(comps, 12).get("valoresReferencia") or {}).get("vlCusteio")
    situacao = (f"{qt} eSFR paga(s): {_brl(pago_custeio)} de custeio "
                + ("(só o valor base — sem profissionais adicionais nem logística)." if so_base else
                   f"(base {_brl(base)} + adicionais/logística {_brl(pago_custeio - base)}).")
                + f" Registradas no e-Gestor: {len(emb)} embarcação(ões), {len(apoio)} unidade(s) de apoio.")
    etapas = ["Elaborar o projeto: território, população das comunidades, rios do circuito, programação anual de viagens "
              "(retorno a cada comunidade em até 60 dias), organização da oferta e da referência/urgência",
              "Aprovar a proposta na CIB/CIR e o Plano de Saúde no Conselho Municipal de Saúde",
              "Solicitar ao Ministério da Saúde pelo sistema de credenciamento vigente (análise técnica e orçamentária da SAPS)",
              "Após a portaria, cadastrar no SCNES os profissionais, embarcações e unidades de apoio vinculados ao estabelecimento",
              "Manter a produção mensal nos sistemas nacionais"]
    cond = ["Atendimento à população por no mínimo 14 dias/mês + 2 dias de educação permanente/planejamento",
            "Embarcações e unidades de apoio identificadas com a programação visual do SUS e cadastradas no SCNES"]
    ops = []
    comum = dict(portaria=norma, condicoes=cond, etapas=etapas, situacao_atual=situacao,
                 perfil=(f"Município com eSFR credenciada e paga; UF {uf or '—'} "
                         + ("(Amazônia Legal/Pantanal: logística sem o limite de 50% da PRT 8.994/2025)." if amazonia else
                            "(logística limitada a 50% pela PRT 8.994/2025)." if amazonia is False else "(UF não identificada).")))
    if not qt:
        return ops
    # logística: embarcações já registradas sem incentivo
    if so_base and emb:
        ops.append(_op("esfr_embarcacao_registrada", "eSFR — incentivo de logística das embarcações já registradas",
                       quantidade=min(4, len(emb)), custeio_unitario=round(V("esfr.logistica.embarcacao") * fator, 2), elegibilidade="potencial",
                       fundamento=f"{params['esfr.logistica.embarcacao']['norma']}: R$ 6.000 por embarcação de pequeno porte "
                                  "(até 4). O e-Gestor registra a embarcação, mas o custeio pago é só o valor base.",
                       pendencias=["Aprovação CIB/CIR do arranjo", "Solicitação do incentivo de logística ao MS"],
                       providencia="Adequar a eSFR à portaria: solicitar o incentivo de logística da(s) embarcação(ões) já registrada(s).",
                       observacao="Embarcação(ões): " + "; ".join(f"nº {e.get('nuEmbarcacao', '—')} — {e.get('dsComunidadeAtendida', '')} "
                                                                f"({e.get('noEmbarcacao', '')})" for e in emb[:4]),
                       **comum))
    rest_emb = max(0, 4 - len(emb))
    for oid, nome, chave, qtd, txt in (
            ("esfr_embarcacoes", "eSFR — novas embarcações de pequeno porte", "esfr.logistica.embarcacao", rest_emb, "até 4 embarcações"),
            ("esfr_unidades_apoio", "eSFR — unidades de apoio (satélites)", "esfr.logistica.unidade_apoio", max(0, 4 - len(apoio)), "até 4 unidades de apoio"),
            ("esfr_pickup", "eSFR — veículos pick-up 4x4", "esfr.logistica.pickup", 2, "até 2 pick-ups")):
        if qtd:
            ops.append(_op(oid, nome, quantidade=qtd, custeio_unitario=round(V(chave) * fator, 2), elegibilidade="potencial",
                           fundamento=f"{params[chave]['norma']}: {_brl(V(chave))} por unidade ({txt})"
                                      + ("" if fator == 1 else " — 50% fora da Amazônia Legal/Pantanal (PRT 8.994/2025)") + ".",
                           pendencias=["Estrutura existente/adquirida", "Aprovação CIB/CIR", "Solicitação ao MS"],
                           providencia=f"Avaliar necessidade do território e incluir {txt.replace('até ', 'até ')} no projeto da eSFR.",
                           **comum))
    # profissionais adicionais (só o base é pago → nenhum adicional custeado hoje)
    if so_base:
        for oid, nome, chave, qtd in (("esfr_aux_enf", "eSFR — auxiliares/técnicos de enfermagem adicionais", "esfr.prof.aux_tec_enfermagem", 11),
                                      ("esfr_saude_bucal", "eSFR — auxiliar/técnico em saúde bucal", "esfr.prof.saude_bucal", 1),
                                      ("esfr_nivel_superior", "eSFR — profissionais de nível superior adicionais", "esfr.prof.nivel_superior", 2)):
            ops.append(_op(oid, nome, quantidade=qtd, custeio_unitario=V(chave), elegibilidade="potencial",
                           fundamento=f"{params[chave]['norma']}: {_brl(V(chave))} por profissional/mês.",
                           pendencias=["Profissionais contratados e cadastrados na eSFR no SCNES", "Aprovação CIB/CIR", "Solicitação ao MS"],
                           providencia="Incluir os profissionais adicionais no projeto/solicitação da eSFR.",
                           observacao="Quantidade = máximo da portaria; o e-Gestor paga hoje só o custeio base (nenhum adicional).",
                           **comum))
    if v_micro and micro < 12:
        ops.append(_op("esfr_microscopistas", "eSFR — microscopistas adicionais (região endêmica)", quantidade=12 - micro,
                       custeio_unitario=v_micro, elegibilidade="potencial",
                       fundamento=f"PRT GM/MS 5.850/2024, Art. 70 (até 12, valor vigente por profissional); valor de referência "
                                  f"do e-Gestor {_brl(v_micro)}. Hoje {micro} pagos.",
                       pendencias=["Área endêmica de malária", "Profissionais cadastrados na eSFR"],
                       providencia="Avaliar necessidade de microscopistas (área endêmica) até o limite de 12.", **comum))
    # nova eSFR (usa vaga do teto de eSF)
    vq, vv = V("qualidade.eSFR.bom"), V("vinculo.eSFR.bom")
    ops.append(_op("esfr_nova", "eSFR — nova equipe ribeirinha (vaga do teto de eSF)", quantidade=1,
                   custeio_unitario=round(V("esfr.custeio") + (vq or 0) + (vv or 0), 2),
                   implantacao_unitaria=V("esfr.implantacao"), elegibilidade="potencial",
                   fundamento=f"{norma}: custeio {_brl(V('esfr.custeio'))} + vínculo e qualidade “Bom” por 12 parcelas "
                              f"(Art. 69-D); implantação {_brl(V('esfr.implantacao'))} (Art. 69-A).",
                   pendencias=["Comunidades acessadas por rio", "Vaga no teto de eSF", "Aprovação CIB/CIR"],
                   providencia="Se houver comunidades só acessíveis por rio, comparar nova eSFR × nova eSF na vaga do teto.",
                   grupo_exclusivo="esf_vaga", **comum))
    return ops


GRUPOS_TIPO = [
    ("eSF", "Saúde da Família (eSF/eAP)", {48, 49, 72}, ("esf_", "eap_"), ("qualidade.eSF", "vinculo.eSF")),
    ("eSB", "Saúde Bucal (eSB)", {5, 37, 50, 9, 19, 18, 43}, ("esb_", "uom"), ("qualidade.eSB",)),
    ("eMulti", "Multiprofissional (eMulti)", {42, 51, 55, 73}, ("emulti_",), ("qualidade.eMulti",)),
    ("eSFR", "Saúde da Família Ribeirinha (eSFR)", {7, 58, 61, 14, 10}, ("esfr", "ubsf"), ("qualidade.eSFR", "vinculo.eSFR")),
    ("ACS", "Agentes Comunitários de Saúde", {12, 31}, ("acs",), ()),
    ("Outros", "Demais programas e incentivos", None, (), ()),
]


def resumo_por_tipo(componentes, por_equipe, regras, oportunidades) -> list[dict]:
    """Projeções organizadas por tipo de equipe: quanto recebe, o que muda com a próxima avaliação, ganho por
    melhoria de indicadores, efeito do fim da transição e oportunidades (com valores) — tudo do cálculo acima."""
    usados, ops_usadas, saida = set(), set(), []
    for tipo, nome, cos, prefixos, chaves in GRUPOS_TIPO:
        comps = [c for c in componentes if (c["co"] in cos if cos is not None else c["co"] not in usados)]
        usados |= {c["co"] for c in comps}
        ops = [o for o in oportunidades if (o["id"].startswith(prefixos) if prefixos else o["id"] not in ops_usadas)]
        ops_usadas |= {o["id"] for o in ops}
        eqs = [e for e in por_equipe if e.get("tipo") == tipo or (tipo == "eSF" and e.get("tipo") == "eAP")]
        pago = round(sum(_n(c["vl_total"]) for c in comps), 2)
        variacao = round(sum(regras[k].get("variacao_mensal") or 0 for k in chaves if k in regras), 2)
        melhoria = {"proxima_avaliacao": 0.0, "apos_transicao": 0.0, "nao_confirmado": 0.0}
        for e in eqs:
            if not e.get("pagamento_ok") or e.get("valida") is False:
                continue
            for m in e.get("melhoria", []):
                melhoria[m.get("efeito", "nao_confirmado")] += _n(m["incremento_mensal"])
        perdas = round(sum(f["variacao_mensal"] for e in eqs for f in e.get("fim_transicao", []) if f["variacao_mensal"] < 0), 2)
        ganhos = round(sum(f["variacao_mensal"] for e in eqs for f in e.get("fim_transicao", []) if f["variacao_mensal"] > 0), 2)
        grupos: dict[str, float] = {}
        for o in ops:
            if o["elegibilidade"] in ("confirmada", "potencial") and o.get("incremento_mensal"):
                g = o.get("grupo_exclusivo") or o["id"]
                grupos[g] = max(grupos.get(g, 0), o["incremento_mensal"])
        if not comps and not ops and not eqs:
            continue
        destaque = []
        if variacao:
            destaque.append({"tipo": "proxima_avaliacao", "valor": variacao})
        if perdas:
            destaque.append({"tipo": "fim_transicao_perda", "valor": perdas})
        saida.append({
            "tipo": tipo, "nome": nome,
            "equipes": sum(1 for e in eqs if e.get("pagamento_ok")),
            "equipes_cadastradas": len(eqs),
            "recebe_mensal": pago, "recebe_anual": round(pago * 12, 2),
            "regras": [{"componente": regras[k]["rotulo"], "texto": regras[k]["regra_texto"]} for k in chaves if k in regras],
            "variacao_proxima_avaliacao_mensal": variacao,
            "melhoria_indicadores_mensal": round(melhoria["proxima_avaliacao"], 2),
            "melhoria_apos_transicao_mensal": round(melhoria["apos_transicao"], 2),
            "melhoria_nao_confirmada_mensal": round(melhoria["nao_confirmado"], 2),
            "fim_transicao_perdas_mensal": perdas, "fim_transicao_ganhos_mensal": ganhos,
            "credenciamento_a_confirmar_mensal": round(sum(grupos.values()), 2),
            "oportunidades": [{"id": o["id"], "programa": o["programa"], "elegibilidade": o["elegibilidade"],
                               "elegibilidade_rotulo": o["elegibilidade_rotulo"], "quantidade": o.get("quantidade"),
                               "incremento_mensal": o.get("incremento_mensal"), "incremento_anual": o.get("incremento_anual"),
                               "custeio_unitario": o.get("custeio_unitario"), "implantacao_total": o.get("implantacao_total"),
                               "grupo_exclusivo": o.get("grupo_exclusivo")} for o in ops],
            "providencias": list(dict.fromkeys(o["providencia"] for o in ops
                                               if o["providencia"] and o["elegibilidade"] in ("confirmada", "potencial"))),
            "atencao": destaque,
        })
    return saida


def _respostas(kpis, desempenho, ops, pg, transicao) -> list[dict]:
    brl = _brl
    pot = [o for o in ops if o["elegibilidade"] == "potencial"]
    conf = [o for o in ops if o["elegibilidade"] == "confirmada"]
    return [
        {"pergunta": "Quanto o município recebe atualmente?",
         "resposta": f"{brl(kpis['financiamento_atual_mensal'])} na {pg['parcela_rotulo']} (pago, e-Gestor) — "
                     f"projeção anual {brl(kpis['financiamento_atual_anual'])} se mantido."},
        {"pergunta": "Quanto poderá incrementar melhorando os indicadores?",
         "resposta": (f"{brl(desempenho['incremento_mensal_proximo_nivel'])}/mês subindo um nível nas equipes válidas, nos "
                      f"componentes já pagos pela classificação de cada equipe "
                      f"({brl(desempenho['incremento_mensal_todas_otimo'])}/mês com todas em Ótimo)."
                      + (f" Mais {brl(desempenho['incremento_mensal_apos_transicao'])}/mês no vínculo/demais componentes "
                         "ainda pagos como “Bom” (valem após a transição)." if desempenho["incremento_mensal_apos_transicao"] else "")
                      + (f" Com a avaliação mais recente, o valor mensal já muda {'+' if desempenho['variacao_proxima_avaliacao_mensal'] > 0 else '−'}"
                         f"{brl(abs(desempenho['variacao_proxima_avaliacao_mensal']))} quando o MS aplicá-la."
                         if desempenho["variacao_proxima_avaliacao_mensal"] else "")
                      + (f" Atenção: quando o vínculo deixar de ser pago como “Bom”, as equipes hoje abaixo de Bom perdem "
                         f"{brl(abs(desempenho['fim_transicao_perdas_mensal']))}/mês (e as acima ganham "
                         f"{brl(desempenho['fim_transicao_ganhos_mensal'])}/mês)." if desempenho.get("fim_transicao_perdas_mensal") else "")
                      + (f" {brl(desempenho['incremento_mensal_nao_confirmado'])}/mês dependem de parâmetro a atualizar."
                         if desempenho["incremento_mensal_nao_confirmado"] else ""))},
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
         "resposta": " ".join(f"• {p}" for p in dict.fromkeys(o["providencia"] for o in pot if o["providencia"])) or "—"},
    ]
