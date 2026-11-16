"""
Agente de Análise das Portarias do FNS (aba Repasses Mensais — FNS › Portarias).

Como decide:
  • Natureza do recurso (CUSTEIO / INVESTIMENTO / OUTRA / EM ANÁLISE) vem do BLOCO OFICIAL que o FNS informa em
    cada transferência (blocoPacto do consultafns) — nunca do título da portaria. Cada transferência é classificada
    sozinha; uma portaria com blocos diferentes recebe as duas etiquetas.
  • As 12 categorias de despesa saem da base normativa conferida (services/fns_portarias_normas.py), ajustada pela
    finalidade oficial do repasse (grupo/ação/componente do FNS). Na dúvida, "EXIGE ANÁLISE COMPLEMENTAR".
  • A IA só entra na consulta do gestor ("Posso adquirir um veículo com este recurso?") e só pode citar
    dispositivos da base conferida. A análise em lote é determinística e não gasta IA.

Consultivo: nada aqui autoriza despesa, empenho, pagamento ou alteração orçamentária, e nada altera
transferencias_fns — as classificações ficam em fns_portaria_analise.
"""
from __future__ import annotations

import hashlib
import json
import logging
import re
from collections import defaultdict
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.fns_origem import FnsPagamentoDetalhe
from models.fns_portaria_analise import FnsNormaVerificacao, FnsPortariaAnalise, FnsPortariaAnaliseVersao
from models.transferencia_fns import TransferenciaFns
from services import fns_portarias_normas as N

logger = logging.getLogger(__name__)

VERSAO_REGRAS = "2026-11-16.5"   # mudar quando as regras mudarem → todas as análises são refeitas
SEM_PORTARIA = "Sem portaria"
PENDENTE_TXT = "Classificação pendente de confirmação"
AVISO = ("Análise consultiva do ERSUS360. Não autoriza despesa, empenho, pagamento nem alteração orçamentária. "
         "Confirme com a contabilidade, o controle interno e a portaria original antes de executar.")

NATUREZAS = ("CUSTEIO", "INVESTIMENTO", "OUTRA NATUREZA", "EM ANÁLISE")

# Estados de validação (a IA nunca marca VALIDADA: só o responsável, por ação expressa)
EST_PENDENTE = "ANÁLISE PENDENTE"
EST_NORMA = "NORMA LOCALIZADA"
EST_CONFERIDA = "FUNDAMENTAÇÃO CONFERIDA"
EST_AGUARDANDO = "AGUARDANDO VALIDAÇÃO TÉCNICA"
EST_VALIDADA = "VALIDADA PELO RESPONSÁVEL"
ESTADOS = (EST_PENDENTE, EST_NORMA, EST_CONFERIDA, EST_AGUARDANDO, EST_VALIDADA)
_PROG = {p["chave"]: p for p in N.PROGRAMAS}


# ── Classificação por transferência ───────────────────────────────────────────────

def classificar_natureza(bloco: str | None) -> dict:
    """Natureza pelo bloco de financiamento oficial informado pelo FNS."""
    b = N.normalizar(bloco)
    if not b:
        return {"natureza": "EM ANÁLISE", "fundamento": [],
                "motivo": "O FNS não informou o bloco de financiamento desta transferência. " + PENDENTE_TXT + "."}
    if "MANUTENCAO" in b or "CUSTEIO" in b:
        return {"natureza": "CUSTEIO", "fundamento": ["PRC6_3_I_II", "PRC6_5_CAPUT"],
                "motivo": f"Bloco oficial do FNS: “{bloco}” (Bloco de Manutenção das ASPS — despesas correntes)."}
    if "ESTRUTURACAO" in b or "INVESTIMENTO" in b:
        return {"natureza": "INVESTIMENTO", "fundamento": ["PRC6_3_I_II", "PRC6_6_CAPUT"],
                "motivo": f"Bloco oficial do FNS: “{bloco}” (Bloco de Estruturação — despesas de capital)."}
    return {"natureza": "OUTRA NATUREZA", "fundamento": [],
            "motivo": f"Bloco “{bloco}” não corresponde aos blocos da PRC 6/2017, art. 3º. " + PENDENTE_TXT + "."}


_PERFIS = [
    # (chave, rótulo, palavras procuradas na finalidade oficial do FNS)
    ("piso_enfermagem", "Assistência financeira complementar — piso salarial da enfermagem",
     ["PISO SALARIAL", "ENFERMAGEM"]),
    ("acs_ace", "Assistência financeira complementar — vencimento de ACS/ACE",
     ["AGENTES COMUNITARIOS", "AGENTES DE COMBATE", "PAGAMENTO DOS VENCIMENTOS"]),
    ("emenda", "Emenda parlamentar (conferir portaria e proposta)",
     ["EMENDA", "INCREMENTO TEMPORARIO"]),
    ("assist_farm", "Assistência Farmacêutica", ["ASSISTENCIA FARMACEUTICA", "CBAF"]),
    ("extraordinario", "Apoio extraordinário / emergência", ["CORONAVIRUS", "COVID", "APOIO FINANCEIRO EXTRAORDINARIO",
                                                             "EMERGENCIA"]),
    ("contrato_gestao", "Contrato de gestão", ["CONTRATO DE GESTAO"]),
]


def perfil_finalidade(grupo: str | None, acao: str | None, acao_det: str | None) -> dict:
    prog = N.programa_por_texto(grupo, acao, acao_det)
    if prog:   # programa com norma de origem/regulamentação no catálogo conferido
        return {"chave": prog["chave"], "rotulo": prog["nome"], "programa": True}
    texto = N.normalizar(" ".join(filter(None, [grupo, acao, acao_det])))
    for chave, rotulo, palavras in _PERFIS:
        if any(p in texto for p in palavras):
            return {"chave": chave, "rotulo": rotulo}
    return {"chave": "regular", "rotulo": "Repasse regular do bloco"}


def matriz_despesas(natureza: str, perfil: str) -> list[dict]:
    """As 12 categorias com classificação, justificativa e fundamentação."""
    base = N.matriz_base(natureza)
    out = []
    for chave, rotulo in N.CATEGORIAS:
        if base is None:
            status, just, disp = (N.ANALISE, "Natureza do recurso não confirmada pelo bloco oficial do FNS. "
                                  + PENDENTE_TXT + ".", [])
        else:
            status, just, disp = base[chave]
            disp = list(disp)
        prog = _PROG.get(perfil)
        if prog and base is not None:
            if prog.get("pendente"):
                if status in (N.PERMITIDO, N.COM_CONDICOES):
                    status = N.ANALISE
                    just = prog["pendente"] + " Regra geral do bloco: " + just
            else:
                regra = prog["regras"].get(chave) if natureza == "CUSTEIO" else None
                if regra:
                    status, just, disp = regra[0], regra[1], list(regra[2])
                elif status in (N.PERMITIDO, N.COM_CONDICOES) and prog.get("limite"):
                    just = f"{just} {prog['limite']}"
                    disp += [k for k, papel in prog["origem"] if papel == "aplicação"]
        elif natureza == "CUSTEIO" and perfil in ("piso_enfermagem", "acs_ace"):
            if chave == "pessoal":
                status = N.COM_CONDICOES
                just = ("Finalidade específica do repasse: pagamento da categoria indicada pelo FNS, em conta "
                        "segregada, conforme a norma do programa.")
                disp = ["PRC6_5_P2", "PRC6_3_P2_I"]
            elif status != N.VEDADO:
                status = N.ANALISE
                just = ("Repasse com finalidade específica de pagamento de pessoal; outro uso depende da norma do "
                        "programa e do programa de trabalho. " + just)
                disp = ["PRC6_3_P2_I", *disp]
        elif natureza == "CUSTEIO" and perfil == "emenda" and chave == "pessoal":
            status = N.ANALISE
            just = ("Emenda de incremento temporário: o uso para pessoal depende da portaria de incremento do "
                    "exercício e das regras da LDO — não confirmado na base normativa do ERSUS360. " + just)
        elif natureza == "CUSTEIO" and perfil == "assist_farm" and chave not in ("medicamentos", "obras"):
            status = N.ANALISE
            just = ("Recurso da Assistência Farmacêutica: finalidade vinculada à aquisição de medicamentos e "
                    "insumos do componente. " + just)
            disp = ["PRC6_3_P2_I", *disp]
        elif perfil in ("extraordinario", "contrato_gestao") and status in (N.PERMITIDO, N.COM_CONDICOES):
            status = N.ANALISE
            just = ("Repasse extraordinário ou de contrato de gestão: conferir a norma específica antes de aplicar. "
                    + just)
        out.append({"categoria": chave, "rotulo": rotulo, "classificacao": status, "justificativa": just,
                    "fundamentacao": [N.citar(d) for d in dict.fromkeys(disp)]})
    return out


def _so_digitos(s: str | None) -> str:
    return re.sub(r"\D", "", s or "").lstrip("0")


# ── Coleta de dados ─────────────────────────────────────────────────────────────

async def _transferencias(db: AsyncSession, ibge: str, exercicio: int) -> list[TransferenciaFns]:
    ibge7 = ibge if len(ibge) == 7 else None
    filtros = [TransferenciaFns.exercicio == exercicio, TransferenciaFns.ativo == True]  # noqa: E712
    alvo = [ibge, ibge[:6]] + ([ibge7] if ibge7 else [])
    filtros.append(TransferenciaFns.municipio_ibge.in_(list(dict.fromkeys(alvo))))
    stmt = select(TransferenciaFns).where(*filtros).order_by(TransferenciaFns.mes, TransferenciaFns.id)
    return list((await db.execute(stmt)).scalars().all())


async def _propostas_por_ob(db: AsyncSession, ibge: str, exercicio: int) -> dict[str, set[str]]:
    rows = (await db.execute(select(FnsPagamentoDetalhe.numero_ob, FnsPagamentoDetalhe.numero_proposta)
                             .where(FnsPagamentoDetalhe.municipio_ibge.in_([ibge, ibge[:6]]),
                                    FnsPagamentoDetalhe.exercicio == exercicio))).all()
    out: dict[str, set[str]] = defaultdict(set)
    for ob, prop in rows:
        if ob and prop:
            out[ob].add(prop)
    return out


async def _documentos(db: AsyncSession, municipio_id: int | None, numeros: set[str], exercicio: int) -> dict[str, dict]:
    """Portaria cadastrada no catálogo do ERSUS360 (portarias) + valor previsto para o município."""
    from models.portaria import Portaria, PortariaMunicipio
    alvo = {_so_digitos(n) for n in numeros if _so_digitos(n)}
    if not alvo:
        return {}
    out: dict[str, dict] = {}
    for p in (await db.execute(select(Portaria))).scalars():
        k = _so_digitos(p.numero)
        if k not in alvo or (p.ano and p.ano > exercicio):
            continue
        out.setdefault(k, {"candidatos": []})["candidatos"].append({
            "id": p.id, "numero": p.numero, "ano": p.ano, "orgao": p.orgao_emissor, "programa": p.programa,
            "objeto": p.objeto, "natureza_cadastrada": p.natureza,
            "data_publicacao": p.data_publicacao.isoformat() if p.data_publicacao else None,
            "link": p.link_diario})
    if municipio_id and out:
        ids = [c["id"] for d in out.values() for c in d["candidatos"]]
        for pm in (await db.execute(select(PortariaMunicipio).where(PortariaMunicipio.municipio_id == municipio_id,
                                                                    PortariaMunicipio.portaria_id.in_(ids),
                                                                    PortariaMunicipio.excluido_em.is_(None)))).scalars():
            for d in out.values():
                for c in d["candidatos"]:
                    if c["id"] == pm.portaria_id:
                        c["valor_previsto_municipio"] = round(float(pm.valor_municipio or 0), 2)
    return out


async def _propostas_investsus(db: AsyncSession, municipio_id: int | None, numeros: set[str]) -> dict[str, dict]:
    if not municipio_id or not numeros:
        return {}
    from models.investsus import PlanoTrabalho, PropostaInvestSUS
    out = {}
    for p in (await db.execute(select(PropostaInvestSUS).where(PropostaInvestSUS.municipio_id == municipio_id,
                                                               PropostaInvestSUS.numero_proposta.in_(list(numeros))))).scalars():
        planos = (await db.execute(select(PlanoTrabalho).where(PlanoTrabalho.proposta_id == p.id))).scalars().all()
        out[p.numero_proposta] = {
            "numero_proposta": p.numero_proposta, "objeto": p.objeto, "finalidade": p.finalidade,
            "tipo_financiamento": p.tipo_financiamento, "componente": p.componente,
            "prazo_previsto": p.prazo_previsto,
            "planos_trabalho": [{"versao": pl.versao, "situacao": pl.situacao, "objeto": pl.objeto,
                                 "valor_indicado": pl.valor_indicado,
                                 "data_aprovacao": pl.data_aprovacao.isoformat() if pl.data_aprovacao else None}
                                for pl in planos]}
    return out


async def _execucao(db: AsyncSession, municipio_id: int | None, exercicio: int) -> dict[str, dict]:
    """Empenhado/liquidado/pago lançados na Execução Financeira, por nº de portaria."""
    if not municipio_id:
        return {}
    from models.execucao_fns import ExecucaoFns
    out: dict[str, dict] = defaultdict(lambda: {"empenhado": 0.0, "liquidado": 0.0, "pago": 0.0, "lancamentos": 0})
    for e in (await db.execute(select(ExecucaoFns).where(ExecucaoFns.municipio_id == municipio_id,
                                                         ExecucaoFns.exercicio == exercicio,
                                                         ExecucaoFns.ativo == True))).scalars():  # noqa: E712
        k = _so_digitos(e.portaria)
        if not k:
            continue
        o = out[k]
        o["empenhado"] += float(e.empenhado or 0)
        o["liquidado"] += float(e.liquidado or 0)
        o["pago"] += float(e.pago or 0)
        o["lancamentos"] += 1
    return dict(out)


async def _estado_normas(db: AsyncSession) -> dict[str, dict]:
    return {v.dispositivo: {"confere": v.confere, "detalhe": v.detalhe,
                            "verificado_em": v.verificado_em.isoformat() if v.verificado_em else None}
            for v in (await db.execute(select(FnsNormaVerificacao))).scalars()}


# ── Análise de uma portaria ──────────────────────────────────────────────────────

def _br(iso: str | None) -> str:
    return f"{iso[8:10]}/{iso[5:7]}/{iso[:4]}" if iso and len(iso) >= 10 else "—"


def _fundamentacao_completa(chaves: set[str], estado_normas: dict, datas_repasse: list[str]) -> list[dict]:
    hoje = date.today().isoformat()
    out = []
    for k in sorted(chaves):
        c = N.citar(k)
        v = estado_normas.get(k)
        if v is None:
            c["vigencia"] = "Texto conferido manualmente em 16/11/2026; a rotina automática ainda não rodou."
        elif v["confere"] is True:
            c["vigencia"] = f"Texto oficial conferido em {_br(v['verificado_em'])}: dispositivo presente."
        elif v["confere"] is False:
            c["vigencia"] = f"ATENÇÃO: trecho não encontrado no texto oficial em {_br(v['verificado_em'])} — " \
                            "possível alteração ou revogação. " + PENDENTE_TXT + "."
        else:
            c["vigencia"] = f"Página oficial indisponível na última verificação ({_br(v['verificado_em'])})."
        prazo = N.DISPOSITIVOS[k].get("prazo_ate")
        if prazo:
            na_data = [d for d in datas_repasse if d and d <= prazo]
            c["vigencia"] += (f" Prazo da redação conferida: até {prazo[8:]}/{prazo[5:7]}/{prazo[:4]}. "
                              + ("Aplicável hoje." if hoje <= prazo else
                                 "Encerrado hoje — não há nova autorização no texto conferido.")
                              + (" Vigente na data de parte dos repasses." if na_data else ""))
        out.append(c)
    return out


def _orientacao(naturezas: set[str], perfil: str, pendente: bool, numero: str) -> str:
    if pendente or not naturezas or naturezas & {"EM ANÁLISE", "OUTRA NATUREZA"}:
        return ("Natureza ou norma do recurso ainda sem confirmação suficiente. Não empenhe com base nesta "
                "classificação: confira o bloco no extrato do FNS e a portaria original"
                + (f" nº {numero}" if numero != SEM_PORTARIA else "") + " e registre a portaria no catálogo do ERSUS360.")
    linhas = []
    if "CUSTEIO" in naturezas:
        linhas.append("Recurso de custeio (Bloco de Manutenção): use em despesas correntes das ações e serviços da "
                      "finalidade do repasse; obra nova e ampliação são vedadas.")
    if "INVESTIMENTO" in naturezas:
        linhas.append("Recurso de investimento (Bloco de Estruturação): use somente em equipamentos e obras do "
                      "objeto aprovado; não paga custeio nem pessoal.")
    if perfil in ("piso_enfermagem", "acs_ace"):
        linhas.append("Finalidade específica de pagamento de pessoal da categoria indicada pelo FNS.")
    if perfil == "emenda":
        linhas.append("Emenda de incremento temporário: siga a portaria e a proposta aprovada.")
    linhas.append("Comprove a aplicação no RAG e mantenha o recurso na conta específica do bloco.")
    return " ".join(linhas[:5])


def _orientacao_programas(naturezas: set[str], perfil: str, pendente: bool, numero: str,
                          vinculados: list[dict]) -> str:
    """Orientação objetiva (até 5 linhas) a partir da norma de regulamentação de cada programa."""
    if pendente or not vinculados:
        return _orientacao(naturezas, perfil, True, numero)
    linhas = []
    for v in vinculados[:3]:
        ex = f" Exemplo: {v['exemplos'][0][0].lower()}{v['exemplos'][0][1:]}." if v["exemplos"] else ""
        linhas.append(f"{v['nome']}: {v['limite']}{ex}")
    if "INVESTIMENTO" in naturezas and not any(v["chave"] == "investimento_rede" for v in vinculados):
        linhas.append("A parte de investimento só paga o objeto aprovado (equipamentos/obras).")
    linhas.append("Comprove a aplicação no RAG e mantenha o recurso na conta específica do bloco.")
    return " ".join(linhas[:5])


def analisar(numero: str, transfs: list[TransferenciaFns], *, exercicio: int, documentos: dict,
             propostas_ob: dict[str, set[str]], propostas_is: dict[str, dict], execucao: dict,
             estado_normas: dict) -> dict:
    itens = []
    naturezas: dict[str, float] = defaultdict(float)
    perfis: dict[str, str] = {}
    combos: dict[tuple[str, str], str] = {}
    uso_prog: dict[str, list] = defaultdict(list)
    programas, grupos, blocos, propostas = set(), set(), set(), set()
    fund_chaves: set[str] = {"PRC6_3_I_II", "PRC6_3_P1", "PRC6_3_P2_I", "PRC6_3_P3", "PRC6_3_P5_I", "LC141_13_P2",
                             "LC141_36", "L8080_36", "LC172_2", "LC172_5"}
    for t in transfs:
        nat = classificar_natureza(t.bloco)
        pf = perfil_finalidade(t.grupo, t.acao, t.acao_detalhada)
        vl = round(float(t.valor_liquido or 0), 2)
        naturezas[nat["natureza"]] += vl
        perfis[pf["chave"]] = pf["rotulo"]
        combos[(nat["natureza"], pf["chave"])] = pf["rotulo"]
        prog_t = _PROG.get(pf["chave"])
        uso_prog[pf["chave"] if prog_t else "_sem_programa"].append((t, vl))
        fund_chaves.update(nat["fundamento"])
        if t.bloco:
            blocos.add(t.bloco)
        if t.grupo:
            grupos.add(t.grupo)
        programas.add(" — ".join(x for x in [t.acao, t.acao_detalhada] if x) or (t.grupo or "—"))
        props = set(propostas_ob.get(t.numero_ob or "", set()))
        if t.numero_proposta:
            props.add(t.numero_proposta)
        propostas |= props
        itens.append({"id": t.id, "mes": t.mes, "data_pagamento": t.data_pagamento.isoformat() if t.data_pagamento else None,
                      "numero_ob": t.numero_ob, "bloco": t.bloco, "grupo": t.grupo,
                      "programa": t.acao_detalhada or t.acao, "parcela_fns": t.parcela_fns,
                      "valor_liquido": vl, "natureza": nat["natureza"], "motivo_natureza": nat["motivo"],
                      "finalidade": pf["rotulo"], "propostas": sorted(props),
                      "despesa": {"CUSTEIO": "Correntes", "INVESTIMENTO": "Capital"}.get(nat["natureza"], "A confirmar")})

    total = round(sum(i["valor_liquido"] for i in itens), 2)
    nats = {k for k, v in naturezas.items() if v or len(naturezas) == 1}
    perfil_principal = next(iter(perfis)) if len(perfis) == 1 else ("misto" if perfis else "regular")

    # despesas permitidas — uma matriz por (natureza, finalidade) presente: uma portaria que mistura, por
    # exemplo, Piso APS e vencimento de ACS recebe as duas análises, cada transferência na sua
    por_nat: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for (nat_, pf_), rot in sorted(combos.items()):
        if nat_ in nats:
            por_nat[nat_].append((pf_, rot))
    matrizes = {}
    for nat_, lst in por_nat.items():
        for pf_, rot in lst:
            matrizes[nat_ if len(lst) == 1 else f"{nat_} — {rot}"] = matriz_despesas(nat_, pf_)
    if not matrizes:
        matrizes = {"EM ANÁLISE": matriz_despesas("EM ANÁLISE", "regular")}
    for m in matrizes.values():
        for c in m:
            fund_chaves.update(f["chave"] for f in c["fundamentacao"])

    # documento oficial
    doc = documentos.get(_so_digitos(numero)) if numero != SEM_PORTARIA else None
    candidatos = (doc or {}).get("candidatos", [])
    documento = candidatos[0] if len(candidatos) == 1 else None
    pendencias = []
    if numero == SEM_PORTARIA:
        pendencias.append("Transferências sem número de portaria informado pelo FNS — vincular a portaria.")
    elif not candidatos:
        pendencias.append(f"Portaria nº {numero} não cadastrada no catálogo do ERSUS360: ano, data de publicação e "
                          "texto não confirmados.")
    elif len(candidatos) > 1:
        pendencias.append(f"Há {len(candidatos)} portarias nº {numero} no catálogo (anos "
                          f"{', '.join(str(c['ano']) for c in candidatos)}): confirmar qual fundamenta o repasse.")
    if nats & {"EM ANÁLISE", "OUTRA NATUREZA"}:
        pendencias.append("Há transferência sem bloco de financiamento reconhecido.")
    normas_alteradas = [k for k in fund_chaves if (estado_normas.get(k) or {}).get("confere") is False]
    if normas_alteradas:
        pendencias.append("Dispositivo usado não foi reencontrado no texto oficial: "
                          + ", ".join(N.DISPOSITIVOS[k]["dispositivo"] + " (" + N.NORMAS[N.DISPOSITIVOS[k]['norma']]['nome'] + ")"
                                      for k in sorted(normas_alteradas)) + ".")
    insuficiente = bool(nats & {"EM ANÁLISE", "OUTRA NATUREZA"}) or numero == SEM_PORTARIA or bool(normas_alteradas)

    # ── Normas de origem e regulamentação de cada programa presente na portaria ─────────────
    vinculados, sem_norma = [], []
    for chave, lst in uso_prog.items():
        valor = round(sum(v for _, v in lst), 2)
        if chave == "_sem_programa":
            nomes = sorted({(t.acao_detalhada or t.acao or t.grupo or "Programa não informado pelo FNS") for t, _ in lst})
            sem_norma.append({"nome": " · ".join(nomes), "valor": valor, "qtd": len(lst)})
            continue
        prog = _PROG[chave]
        normas_p = []
        for k, papel in prog["origem"]:
            c = N.citar(k)
            v = estado_normas.get(k) or {}
            c.update({"papel": N.PAPEL_ROTULO.get(papel, papel), "conferido": v.get("confere"),
                      "verificado_em": v.get("verificado_em")})
            normas_p.append(c)
            fund_chaves.add(k)
        vinculados.append({"chave": chave, "nome": prog["nome"], "valor": valor, "qtd": len(lst),
                           "normas": normas_p, "limite": prog.get("limite") or "",
                           "exemplos": prog.get("exemplos", []), "condicoes": prog.get("condicoes", []),
                           "pendente": prog.get("pendente")})
    for sn in sem_norma:
        pendencias.append(f"Programa sem norma de regulamentação conferida no ERSUS360: {sn['nome']} — análise pendente.")
    for v in vinculados:
        if v["pendente"]:
            pendencias.append(f"{v['nome']}: {v['pendente']}")

    # ── Estado de validação ──────────────────────────────────────────────────────────────────
    nao_conferidos = sorted(k for k in fund_chaves if (estado_normas.get(k) or {}).get("confere") is not True)
    link_ok = bool(documento and documento.get("link"))
    if ((nats & {"EM ANÁLISE", "OUTRA NATUREZA"}) or sem_norma or any(v["pendente"] for v in vinculados)
            or normas_alteradas or not vinculados):
        estado, motivo = EST_PENDENTE, ("Há transferência sem natureza confirmada ou programa sem norma de "
                                        "regulamentação conferida.")
    elif nao_conferidos:
        estado, motivo = EST_NORMA, (f"Normas localizadas; {len(nao_conferidos)} dispositivo(s) ainda sem conferência "
                                     "automática no texto oficial — clique em Verificar normas.")
    elif not link_ok:
        estado, motivo = EST_CONFERIDA, ("Fundamentação conferida no texto oficial; falta registrar o link oficial "
                                         "da portaria de repasse.")
    else:
        estado, motivo = EST_AGUARDANDO, ("Fundamentação conferida e portaria de repasse identificada; falta a "
                                          "validação técnica do responsável.")

    # plano de trabalho / proposta
    props_info = [propostas_is[p] for p in sorted(propostas) if p in propostas_is]
    if props_info:
        plano = {"exigido": "Sim — repasse vinculado a proposta", "propostas": props_info,
                 "texto": "Execução deve seguir o objeto e o plano de trabalho da proposta no InvestSUS."}
    elif propostas:
        plano = {"exigido": "Sim — repasse vinculado a proposta", "propostas": [{"numero_proposta": p} for p in sorted(propostas)],
                 "texto": "Proposta informada pelo FNS, mas ainda não sincronizada do InvestSUS: conferir objeto e plano."}
    elif "INVESTIMENTO" in nats:
        plano = {"exigido": "Sim — investimento", "propostas": [],
                 "texto": "Investimento exige objeto aprovado (proposta/portaria). Proposta não identificada no ERSUS360."}
    else:
        plano = {"exigido": "Não identificado", "propostas": [],
                 "texto": "Nenhum plano de trabalho específico identificado; a aplicação segue o Plano de Saúde e a PAS."}

    prazos_prop = [p.get("prazo_previsto") for p in props_info if p.get("prazo_previsto")]
    ex = execucao.get(_so_digitos(numero)) if numero != SEM_PORTARIA else None
    if ex:
        comprometido = round(ex["empenhado"] - ex["pago"], 2)
        disponivel = round(total - ex["empenhado"], 2)
    saldos = {
        "transferido": total,
        "autorizado": (documento or {}).get("valor_previsto_municipio"),
        "bancario": None, "bancario_nota": "Não disponível: o extrato da conta específica não está integrado ao ERSUS360.",
        "contabil": None, "contabil_nota": "Não disponível: a contabilidade municipal não está integrada ao ERSUS360.",
        "empenhado": round(ex["empenhado"], 2) if ex else None,
        "pago": round(ex["pago"], 2) if ex else None,
        "comprometido": comprometido if ex else None,
        "comprometido_nota": "Empenhado − pago, lançados na Execução Financeira com o nº desta portaria." if ex else
                             "Sem lançamentos na Execução Financeira com o nº desta portaria.",
        "disponivel_estimado": disponivel if ex else None,
        "disponivel_nota": ("Estimativa: transferido no exercício − empenhado. Não inclui saldo de exercícios "
                            "anteriores nem rendimentos; o saldo efetivo depende do extrato e da contabilidade.") if ex else
                           "Não calculado: sem empenhos registrados para esta portaria.",
    }

    datas = [i["data_pagamento"] for i in itens if i["data_pagamento"]]
    prazos = {
        "prazo_execucao": ("Prazo informado na proposta: " + "; ".join(prazos_prop) + " (conferir na portaria).") if prazos_prop
        else "Nenhum prazo legal de execução identificado nas fontes do ERSUS360 — consultar a portaria específica.",
        "saldos_remanescentes": "O saldo continua vinculado à finalidade original até a aplicação integral "
                                "(PRC 6/2017, art. 3º, §§ 2º e 3º). A autorização de transposição da LC 172/2020 "
                                "vigorou até 31/12/2025 na redação conferida; não há nova autorização no texto conferido.",
        "plano_trabalho": plano,
        "planejamento": "Incluir a aplicação no Plano de Saúde, na PAS e na LOA municipal (Lei 8.080/1990, art. 36).",
        "monitoramento": "Comprovar no RAG apreciado pelo Conselho de Saúde (PRC 6/2017, art. 3º, § 5º, I) e nos "
                         "relatórios quadrimestrais (LC 141/2012, art. 36).",
        "reprogramacao_devolucao": "Regras de reprogramação ou devolução não identificadas nas normas gerais "
                                   "conferidas — dependem da portaria específica. " + N.ANALISE + ".",
    }

    municipio = next((f"{t.municipio_nome or ''}/{t.uf or ''}".strip("/") for t in transfs if t.municipio_nome), None)
    fundo = next((t.cnpj_fundo for t in transfs if t.cnpj_fundo), None)
    identificacao = {
        "numero": numero,
        "ano": (documento or {}).get("ano"),
        "data_publicacao": (documento or {}).get("data_publicacao"),
        "orgao": (documento or {}).get("orgao"),
        "link": (documento or {}).get("link"),
        "objeto_documento": (documento or {}).get("objeto"),
        "programas": sorted(programas),
        "grupos": sorted(grupos),
        "blocos": sorted(blocos),
        "finalidade": " / ".join(sorted(set(perfis.values()))) or "—",
        "naturezas": {k: round(v, 2) for k, v in naturezas.items()},
        "valor_transferido": total,
        "municipio": municipio, "fundo_cnpj": fundo,
        "candidatos_catalogo": candidatos if len(candidatos) > 1 else [],
    }

    situacao = "pendente_confirmacao" if (insuficiente or estado == EST_PENDENTE) else "preliminar"
    vedadas = sorted({f"{c['rotulo']} ({nat.split(' — ')[0].lower()})"
                      for nat, m in matrizes.items() for c in m if c["classificacao"] == N.VEDADO})
    aplicacao = list(dict.fromkeys(c["rotulo"] for m in matrizes.values() for c in m
                                   if c["classificacao"] in (N.PERMITIDO, N.COM_CONDICOES)))
    return {
        "versao_regras": VERSAO_REGRAS,
        "numero_portaria": numero, "exercicio": exercicio,
        "estado_validacao": estado, "estado_motivo": motivo,
        "portaria_repasse": {"numero": numero,
                             "numero_formatado": numero_formatado(numero) if numero != SEM_PORTARIA else None,
                             "ano": (documento or {}).get("ano"),
                             "data_publicacao": (documento or {}).get("data_publicacao"),
                             "link": (documento or {}).get("link"),
                             "papel": "Autoriza a transferência ao município; as regras de aplicação estão nas "
                                      "normas de origem e regulamentação"},
        "programas_vinculados": vinculados,
        "programas_sem_norma": sem_norma,
        "como_utilizar": [{"programa": v["nome"], "limite": v["limite"], "exemplos": v["exemplos"]}
                          for v in vinculados if not v["pendente"]],
        "despesas_vedadas": [{"despesa": c["rotulo"], "recurso": nat, "justificativa": c["justificativa"],
                              "fundamentacao": [f"{f['norma']}, {f['dispositivo']}" for f in c["fundamentacao"]]}
                             for nat, m in matrizes.items() for c in m if c["classificacao"] == N.VEDADO],
        "condicoes_execucao": list(dict.fromkeys([c for v in vinculados for c in v["condicoes"]] + [
            "Incluir a aplicação no Plano de Saúde, na PAS e na LOA municipal (Lei 8.080/1990, art. 36)",
            "Movimentar o recurso na conta específica do bloco (PRC 6/2017, art. 3º, § 1º)",
            "Comprovar a aplicação no RAG apreciado pelo Conselho de Saúde (PRC 6/2017, art. 3º, § 5º, I)"])),
        "naturezas": sorted(nats), "situacao": situacao,
        "classificacao_texto": PENDENTE_TXT if (insuficiente or estado == EST_PENDENTE) else motivo,
        "identificacao": identificacao,
        "despesas": matrizes,
        "aplicacao": aplicacao,
        "restricoes": vedadas,
        "prazos": prazos, "saldos": saldos,
        "fundamentacao": _fundamentacao_completa(fund_chaves, estado_normas, datas),
        "orientacao": _orientacao_programas(nats, perfil_principal, insuficiente or estado == EST_PENDENTE,
                                            numero, vinculados),
        "pendencias": pendencias,
        "transferencias": itens,
        "aviso": AVISO,
    }


def alteracoes(anterior: dict, novo: dict) -> list[str]:
    """O que mudou entre a análise anterior e a nova (registrado para auditoria)."""
    if not anterior:
        return []
    out = []
    if sorted(anterior.get("naturezas", [])) != sorted(novo.get("naturezas", [])):
        out.append(f"Natureza: {', '.join(anterior.get('naturezas', [])) or '—'} → {', '.join(novo.get('naturezas', []))}")
    if anterior.get("estado_validacao") != novo.get("estado_validacao"):
        out.append(f"Estado: {anterior.get('estado_validacao') or 'sem estado (versão anterior)'} → "
                   f"{novo.get('estado_validacao')}")
    va = (anterior.get("identificacao") or {}).get("valor_transferido")
    vn = (novo.get("identificacao") or {}).get("valor_transferido")
    if va != vn:
        out.append(f"Valor transferido: {va} → {vn}")
    pa = {v["nome"] for v in anterior.get("programas_vinculados", [])}
    pn = {v["nome"] for v in novo.get("programas_vinculados", [])}
    if pa != pn:
        out.append("Normas de origem vinculadas: " + (", ".join(sorted(pn - pa)) or "nenhuma nova")
                   + (" (removidas: " + ", ".join(sorted(pa - pn)) + ")" if pa - pn else ""))

    def _cls(r):
        return {(nat, c["categoria"]): c["classificacao"] for nat, m in (r.get("despesas") or {}).items() for c in m}
    ca, cn = _cls(anterior), _cls(novo)
    mud = [f"{k[1]} ({k[0]}): {ca[k]} → {cn[k]}" for k in cn if k in ca and ca[k] != cn[k]]
    if mud:
        out.append(f"{len(mud)} classificação(ões) de despesa revista(s) com base na norma de origem: "
                   + "; ".join(mud[:6]) + ("…" if len(mud) > 6 else ""))
    return out


def _hash(numero: str, transfs: list[TransferenciaFns], extra: dict) -> str:
    base = [VERSAO_REGRAS, numero] + [
        f"{t.id}|{t.valor_liquido}|{t.bloco}|{t.grupo}|{t.acao}|{t.acao_detalhada}|{t.numero_ob}|{t.numero_proposta}"
        for t in transfs]
    base.append(json.dumps(extra, sort_keys=True, default=str))
    return hashlib.sha256("\n".join(base).encode()).hexdigest()


# ── Lote ───────────────────────────────────────────────────────────────────────

async def analisar_lote(db: AsyncSession, municipio_id: int | None, ibge: str, exercicio: int,
                        forcar: bool = False) -> dict:
    """Analisa todas as portarias do exercício. Só regrava o que mudou (transferências, catálogo, normas)."""
    transfs = await _transferencias(db, ibge, exercicio)
    grupos: dict[str, list[TransferenciaFns]] = defaultdict(list)
    for t in transfs:
        grupos[(t.numero_portaria or "").strip() or SEM_PORTARIA].append(t)

    documentos = await _documentos(db, municipio_id, set(grupos), exercicio)
    propostas_ob = await _propostas_por_ob(db, ibge, exercicio)
    todas_props = {p for s in propostas_ob.values() for p in s} | {t.numero_proposta for t in transfs if t.numero_proposta}
    propostas_is = await _propostas_investsus(db, municipio_id, todas_props)
    execucao = await _execucao(db, municipio_id, exercicio)
    estado_normas = await _estado_normas(db)

    existentes = {a.numero_portaria: a for a in (await db.execute(
        select(FnsPortariaAnalise).where(FnsPortariaAnalise.municipio_ibge == ibge,
                                         FnsPortariaAnalise.exercicio == exercicio))).scalars()}
    agora = datetime.utcnow()
    novas = atualizadas = mantidas = 0
    for numero, ts in grupos.items():
        extra = {"doc": documentos.get(_so_digitos(numero)), "ex": execucao.get(_so_digitos(numero)),
                 "normas": {k: v["confere"] for k, v in estado_normas.items()},
                 "props": {p: propostas_is.get(p) for p in sorted(todas_props)}}
        h = _hash(numero, ts, extra)
        a = existentes.get(numero)
        if a and a.hash_entrada == h and not forcar:
            a.verificado_em = agora
            mantidas += 1
            continue
        r = analisar(numero, ts, exercicio=exercicio, documentos=documentos, propostas_ob=propostas_ob,
                     propostas_is=propostas_is, execucao=execucao, estado_normas=estado_normas)
        if a is None:
            a = FnsPortariaAnalise(municipio_ibge=ibge, exercicio=exercicio, numero_portaria=numero)
            db.add(a)
            novas += 1
        else:
            atualizadas += 1
            anterior = a.resultado or {}
            db.add(FnsPortariaAnaliseVersao(
                analise_id=a.id, municipio_ibge=ibge, exercicio=exercicio, numero_portaria=numero,
                resultado=anterior, hash_entrada=a.hash_entrada,
                estado=("VALIDADA PELO RESPONSÁVEL" if a.validado_em else anterior.get("estado_validacao")),
                validado_por=a.validado_por, validado_em=a.validado_em, arquivado_em=agora,
                motivo="Reanálise: transferências, catálogo de portarias, normas ou regras mudaram"))
            r["alteracoes"] = alteracoes(anterior, r)
            if a.validado_em:   # dados mudaram: a validação anterior deixa de valer
                r["validacao_anterior"] = {"por": a.validado_por, "em": a.validado_em.isoformat(),
                                           "nota": a.nota_validacao}
                a.validado_por = a.validado_em = a.nota_validacao = None
        a.resultado = r
        a.naturezas = ",".join(r["naturezas"])
        a.situacao = r["situacao"]
        a.total_liquido = r["identificacao"]["valor_transferido"]
        a.qtd_transferencias = len(ts)
        a.hash_entrada = h
        a.verificado_em = agora
    await db.commit()
    return {"exercicio": exercicio, "portarias": len(grupos), "novas": novas, "atualizadas": atualizadas,
            "sem_alteracao": mantidas, "transferencias": len(transfs), "verificado_em": agora.isoformat()}


async def painel(db: AsyncSession, municipio_id: int | None, ibge: str, exercicio: int) -> dict:
    """Consolidado + lista resumida. Reanalisa antes (só o que mudou) para incluir transferências novas."""
    lote = await analisar_lote(db, municipio_id, ibge, exercicio)
    analises = (await db.execute(select(FnsPortariaAnalise).where(FnsPortariaAnalise.municipio_ibge == ibge,
                                                                  FnsPortariaAnalise.exercicio == exercicio))).scalars().all()
    totais = {n: 0.0 for n in NATUREZAS}
    ids_vistos: set[int] = set()
    sem_identificacao = 0
    lista = []
    for a in analises:
        r = a.resultado or {}
        if not r.get("transferencias") and not a.qtd_transferencias:
            continue
        for t in r.get("transferencias", []):
            if t["id"] in ids_vistos:     # cada transferência conta uma vez só
                continue
            ids_vistos.add(t["id"])
            totais[t["natureza"]] = totais.get(t["natureza"], 0.0) + t["valor_liquido"]
            if a.numero_portaria == SEM_PORTARIA or t["natureza"] in ("EM ANÁLISE", "OUTRA NATUREZA"):
                sem_identificacao += 1
        situacao = "validada" if a.validado_em else a.situacao
        estado = EST_VALIDADA if a.validado_em else (r.get("estado_validacao") or EST_PENDENTE)
        lista.append({"numero_portaria": a.numero_portaria, "naturezas": r.get("naturezas", []),
                      "situacao": situacao, "estado": estado, "estado_motivo": r.get("estado_motivo"),
                      "programas_vinculados": [v["nome"] for v in r.get("programas_vinculados", [])],
                      "classificacao_texto": r.get("classificacao_texto"),
                      "programas": r.get("identificacao", {}).get("programas", []),
                      "grupos": r.get("identificacao", {}).get("grupos", []),
                      "blocos": r.get("identificacao", {}).get("blocos", []),
                      "finalidade": r.get("identificacao", {}).get("finalidade"),
                      "valor_transferido": r.get("identificacao", {}).get("valor_transferido", 0),
                      "qtd_transferencias": a.qtd_transferencias,
                      "pendencias": len(r.get("pendencias", [])),
                      "verificado_em": a.verificado_em.isoformat() if a.verificado_em else None,
                      "validado_por": a.validado_por})
    normas = await _estado_normas(db)
    return {
        "exercicio": exercicio,
        "consolidado": {
            "total_custeio": round(totais.get("CUSTEIO", 0), 2),
            "total_investimento": round(totais.get("INVESTIMENTO", 0), 2),
            "total_outra_natureza": round(totais.get("OUTRA NATUREZA", 0), 2),
            "total_pendente": round(totais.get("EM ANÁLISE", 0) + totais.get("OUTRA NATUREZA", 0), 2),
            "total_geral": round(sum(totais.values()), 2),
            "portarias_analisadas": sum(1 for x in lista if x["numero_portaria"] != SEM_PORTARIA),
            "portarias_validadas": sum(1 for x in lista if x["situacao"] == "validada"),
            "portarias_pendentes": sum(1 for x in lista if x["situacao"] == "pendente_confirmacao"),
            "transferencias_analisadas": len(ids_vistos),
            "transferencias_sem_identificacao": sem_identificacao,
            "por_estado": {e: sum(1 for x in lista if x["estado"] == e) for e in ESTADOS},
        },
        "estados": list(ESTADOS),
        "ultima_verificacao": lote["verificado_em"],
        "normas_verificadas_em": max((v["verificado_em"] for v in normas.values() if v["verificado_em"]), default=None),
        "normas_com_alerta": sorted(k for k, v in normas.items() if v["confere"] is False),
        "portarias": sorted(lista, key=lambda x: -(x["valor_transferido"] or 0)),
        "aviso": AVISO,
    }


async def detalhe(db: AsyncSession, municipio_id: int | None, ibge: str, exercicio: int, numero: str) -> dict | None:
    a = (await db.execute(select(FnsPortariaAnalise).where(FnsPortariaAnalise.municipio_ibge == ibge,
                                                           FnsPortariaAnalise.exercicio == exercicio,
                                                           FnsPortariaAnalise.numero_portaria == numero))).scalar_one_or_none()
    if a is None:
        await analisar_lote(db, municipio_id, ibge, exercicio)
        a = (await db.execute(select(FnsPortariaAnalise).where(FnsPortariaAnalise.municipio_ibge == ibge,
                                                               FnsPortariaAnalise.exercicio == exercicio,
                                                               FnsPortariaAnalise.numero_portaria == numero))).scalar_one_or_none()
    if a is None:
        return None
    r = dict(a.resultado)
    r["verificado_em"] = a.verificado_em.isoformat() if a.verificado_em else None
    r["validacao"] = ({"por": a.validado_por, "em": a.validado_em.isoformat(), "nota": a.nota_validacao}
                      if a.validado_em else None)
    if a.validado_em:
        r["situacao"] = "validada"
        r["estado_validacao"] = EST_VALIDADA
    r["links"] = await links_oficiais(db, numero, exercicio)
    r["historico"] = [{"versao_arquivada_em": v.arquivado_em.isoformat() if v.arquivado_em else None,
                       "estado": v.estado, "validado_por": v.validado_por, "motivo": v.motivo}
                      for v in (await db.execute(select(FnsPortariaAnaliseVersao)
                                                 .where(FnsPortariaAnaliseVersao.analise_id == a.id)
                                                 .order_by(FnsPortariaAnaliseVersao.id.desc()).limit(10))).scalars()]
    return r


# ── Link oficial da portaria ─────────────────────────────────────────────────────
# O FNS informa só o número da portaria (nuPortaria), sem ano nem data. O link vem, nesta ordem:
#   1. catálogo de portarias do ERSUS360 (cadastrado pelo gestor) — confirmado
#   2. coletor diário do DOU (portarias_dou) — portarias do MS com o mesmo número; a conferir
#   3. busca no DOU já preenchida com o número — sempre disponível

DOMINIOS_OFICIAIS = ("in.gov.br", "saude.gov.br", "bvsms.saude.gov.br", "gov.br", "planalto.gov.br")


def link_oficial_valido(url: str | None) -> bool:
    from urllib.parse import urlparse
    try:
        u = urlparse((url or "").strip())
    except ValueError:
        return False
    host = (u.hostname or "").lower()
    return u.scheme == "https" and any(host == d or host.endswith("." + d) for d in DOMINIOS_OFICIAIS)


def numero_formatado(numero: str) -> str:
    d = _so_digitos(numero)
    return f"{int(d):,}".replace(",", ".") if d else numero


def _numero_no_titulo(titulo: str | None) -> str:
    m = re.search(r"N[º°O]\.?\s*([\d.]+)", N.normalizar(titulo).replace("N.O", "NO"))
    return _so_digitos(m.group(1)) if m else ""


def _ano_no_titulo(titulo: str | None) -> int | None:
    anos = re.findall(r"\b(20\d{2}|19\d{2})\b", titulo or "")
    return int(anos[-1]) if anos else None


def url_busca_dou(numero: str) -> str:
    from urllib.parse import urlencode
    q = f'"Portaria GM/MS nº {numero_formatado(numero)}"'
    return "https://www.in.gov.br/consulta/-/buscar/dou?" + urlencode(
        {"q": q, "s": "todos", "exactDate": "all", "sortType": "0"})


async def links_oficiais(db: AsyncSession, numero: str, exercicio: int) -> dict:
    out = {"cadastrado": [], "dou": [], "busca_dou": None, "numero_formatado": None}
    if numero == SEM_PORTARIA or not _so_digitos(numero):
        return out
    alvo = _so_digitos(numero)
    out["numero_formatado"] = numero_formatado(numero)
    out["busca_dou"] = url_busca_dou(numero)

    from models.portaria import Portaria
    for p in (await db.execute(select(Portaria))).scalars():
        if _so_digitos(p.numero) == alvo and (not p.ano or p.ano <= exercicio) and link_oficial_valido(p.link_diario):
            out["cadastrado"].append({"ano": p.ano, "orgao": p.orgao_emissor, "link": p.link_diario,
                                      "data_publicacao": p.data_publicacao.isoformat() if p.data_publicacao else None})

    try:
        from models.portaria_dou import PortariaDOU
        async with db.begin_nested():   # savepoint: uma falha aqui não aborta a transação da análise
            rows = (await db.execute(select(PortariaDOU).where(PortariaDOU.numero.isnot(None),
                                                               PortariaDOU.url_oficial.isnot(None)))).scalars().all()
    except Exception as exc:  # tabela do coletor ausente num ambiente novo: segue sem ela
        logger.warning("Portarias IA: portarias_dou indisponível: %s", exc)
        rows = []
    vistos = set()
    for p in rows:
        if (_so_digitos(p.numero) != alvo and _numero_no_titulo(p.titulo) != alvo) or not link_oficial_valido(p.url_oficial):
            continue
        ano = _ano_no_titulo(p.titulo) or (int(p.data_publicacao[:4]) if p.data_publicacao else None)
        if ano and ano > exercicio or p.url_oficial in vistos:
            continue
        vistos.add(p.url_oficial)
        out["dou"].append({"titulo": p.titulo, "ano": ano, "data_publicacao": p.data_publicacao,
                           "orgao": p.orgao, "link": p.url_oficial})
    out["dou"].sort(key=lambda x: x.get("data_publicacao") or "", reverse=True)
    return out


async def registrar_documento(db: AsyncSession, numero: str, ano: int, link: str,
                              data_publicacao: date | None) -> dict:
    """Cadastra o link oficial no catálogo de portarias. Cria a portaria (número + ano) se ainda não existir;
    numa portaria existente só preenche o que está vazio — nunca sobrescreve dado já cadastrado."""
    from models.portaria import Portaria
    if not link_oficial_valido(link):
        raise ValueError("Use o link oficial (https) do DOU (in.gov.br) ou do Ministério da Saúde (saude.gov.br).")
    alvo = _so_digitos(numero)
    if not alvo or numero == SEM_PORTARIA:
        raise ValueError("Portaria sem número.")
    existente = next((p for p in (await db.execute(select(Portaria).where(Portaria.ano == ano))).scalars()
                      if _so_digitos(p.numero) == alvo), None)
    if existente is None:
        existente = Portaria(numero=alvo, ano=ano, orgao_emissor="GM/MS", link_diario=link.strip(),
                             data_publicacao=data_publicacao)
        db.add(existente)
        acao = "criada"
    else:
        if existente.link_diario and existente.link_diario.strip() != link.strip():
            raise ValueError(f"A portaria nº {numero_formatado(numero)}/{ano} já tem outro link cadastrado no catálogo.")
        existente.link_diario = existente.link_diario or link.strip()
        existente.data_publicacao = existente.data_publicacao or data_publicacao
        acao = "atualizada"
    await db.commit()
    return {"ok": True, "acao": acao, "numero": alvo, "ano": ano}


async def validar(db: AsyncSession, ibge: str, exercicio: int, numero: str, usuario: str, nota: str | None) -> bool:
    a = (await db.execute(select(FnsPortariaAnalise).where(FnsPortariaAnalise.municipio_ibge == ibge,
                                                           FnsPortariaAnalise.exercicio == exercicio,
                                                           FnsPortariaAnalise.numero_portaria == numero))).scalar_one_or_none()
    if a is None:
        return False
    r = dict(a.resultado or {})
    estado = r.get("estado_validacao")
    if estado not in (EST_CONFERIDA, EST_AGUARDANDO):
        raise ValueError(f"A análise está em \"{estado or EST_PENDENTE}\": só é possível validar depois que a "
                         "fundamentação for conferida no texto oficial.")
    agora = datetime.utcnow()
    a.validado_por, a.validado_em, a.nota_validacao = usuario, agora, (nota or None)
    r["registro_validacao"] = {
        "responsavel": usuario, "em": agora.isoformat(), "nota": nota or None, "estado_na_validacao": estado,
        "fontes": [{"norma": f["norma"], "dispositivo": f["dispositivo"], "url": f["url"],
                    "vigencia": f.get("vigencia")} for f in r.get("fundamentacao", [])],
        "alteracoes_identificadas": r.get("alteracoes", []),
    }
    a.resultado = r
    await db.commit()
    return True


# ── Verificação de vigência dos dispositivos ────────────────────────────────────

def _texto_html(html: str) -> str:
    import html as _html
    sem_tags = re.sub(r"<[^>]+>", " ", html)
    # Saúde Legis escreve acentos como entidades (espec&iacute;fica) e o Planalto usa &nbsp;
    return N.normalizar(_html.unescape(sem_tags).replace(" ", " "))


async def verificar_normas(db: AsyncSession) -> dict:
    """Busca o texto oficial de cada norma e confere se cada dispositivo continua lá."""
    import httpx
    textos: dict[str, str | None] = {}
    async with httpx.AsyncClient(timeout=60, follow_redirects=True,
                                 headers={"User-Agent": "Mozilla/5.0 (compatible; ERSUS360/1.0)"}) as client:
        for chave, n in N.NORMAS.items():
            try:
                r = await client.get(n["url"])
                bruto = r.content
                html = None
                # o Saúde Legis declara UTF-8 mas entrega Windows-1252: tenta UTF-8 estrito antes
                for enc in ("utf-8", "cp1252", "latin-1"):
                    try:
                        html = bruto.decode(enc or "utf-8")
                        break
                    except (LookupError, UnicodeDecodeError):
                        continue
                textos[chave] = _texto_html(html or "") if r.status_code == 200 else None
            except Exception as exc:  # fonte fora do ar não derruba a rotina
                logger.warning("Portarias IA: norma %s indisponível: %s", chave, exc)
                textos[chave] = None
    existentes = {v.dispositivo: v for v in (await db.execute(select(FnsNormaVerificacao))).scalars()}
    agora = datetime.utcnow()
    resumo = {"conferem": 0, "nao_conferem": [], "indisponiveis": []}
    for k, d in N.DISPOSITIVOS.items():
        texto = textos.get(d["norma"])
        if texto is None:
            confere, det = None, "Página oficial indisponível."
            resumo["indisponiveis"].append(k)
        else:
            confere = N.normalizar(d["conferencia"]) in texto
            det = "Trecho encontrado." if confere else f"Trecho “{d['conferencia']}” não encontrado."
            if confere:
                resumo["conferem"] += 1
            else:
                resumo["nao_conferem"].append(k)
        v = existentes.get(k) or FnsNormaVerificacao(dispositivo=k)
        v.confere, v.detalhe, v.verificado_em = confere, det, agora
        db.add(v)
    await db.commit()
    resumo["verificado_em"] = agora.isoformat()
    return resumo


# ── Consulta do gestor (IA) ──────────────────────────────────────────────────────

class IAIndisponivel(RuntimeError):
    pass


MODELO = "claude-opus-5-5"
_CLASSES = [N.PERMITIDO, N.COM_CONDICOES, N.VEDADO, N.ANALISE, PENDENTE_TXT.upper()]
_SCHEMA = {
    "type": "object",
    "properties": {
        "classificacao": {"type": "string", "enum": _CLASSES},
        "categoria": {"type": "string",
                      "enum": [c for c, _ in N.CATEGORIAS] + ["saldo_remanescente", "fora_das_categorias"]},
        "norma_origem": {"type": "string"},
        "justificativa": {"type": "string"},
        "base_legal": {"type": "array", "items": {
            "type": "object",
            "properties": {"chave": {"type": "string"}, "como_se_aplica": {"type": "string"}},
            "required": ["chave", "como_se_aplica"], "additionalProperties": False}},
        "condicoes": {"type": "array", "items": {"type": "string"}},
        "falta_confirmar": {"type": "array", "items": {"type": "string"}},
        "orientacao": {"type": "string"},
    },
    "required": ["classificacao", "categoria", "norma_origem", "justificativa", "base_legal", "condicoes",
                 "falta_confirmar", "orientacao"],
    "additionalProperties": False,
}

SYSTEM = """Você é o Agente de Análise das Portarias do FNS do ERSUS360, especialista em financiamento do SUS, e responde a gestores municipais de saúde.

Responda à despesa pretendida considerando SOMENTE a portaria selecionada (em <analise_portaria>) e os dispositivos em <base_normativa>.

Regras:
- Classifique a despesa em: PERMITIDO, PERMITIDO COM CONDIÇÕES, VEDADO, EXIGE ANÁLISE COMPLEMENTAR ou CLASSIFICAÇÃO PENDENTE DE CONFIRMAÇÃO.
- A natureza do recurso (custeio/investimento) é a que está na análise, tirada do bloco oficial do FNS. Não a deduza do título da portaria.
- Distinga a portaria de repasse (portaria_repasse: só autoriza a transferência) das normas de origem e regulamentação do programa (programas_vinculados[].normas), que definem como o recurso pode ser usado. Baseie a resposta nas normas de origem; não presuma que a portaria de repasse traz as regras de aplicação.
- Em norma_origem, escreva a(s) norma(s) de origem/regulamentação usadas (ex.: "Portaria GM/MS nº 4.986/2024, art. 2º, II"). Se o programa estiver em programas_sem_norma ou com "pendente", escreva "não conferida" e use CLASSIFICAÇÃO PENDENTE DE CONFIRMAÇÃO.
- Para saldo remanescente, use a categoria saldo_remanescente e a regra de vinculação à finalidade (PRC 6/2017, art. 3º, §§ 2º e 3º) e a situação da LC 172/2020 que está na base.
- Em base_legal, use apenas chaves que existem em <base_normativa>. Não cite artigo, lei, prazo ou autorização que não esteja lá; se a resposta depender de norma que não está na base (a portaria específica, a LDO, uma nota técnica), diga isso em falta_confirmar e use EXIGE ANÁLISE COMPLEMENTAR.
- Se a natureza estiver EM ANÁLISE ou OUTRA NATUREZA, ou a análise estiver pendente de confirmação, a classificação é CLASSIFICAÇÃO PENDENTE DE CONFIRMAÇÃO, salvo se a despesa for vedada em qualquer bloco.
- Não invente prazos, valores, saldos nem planos de trabalho. Diferencie saldo bancário, contábil, comprometido e disponível só com os dados presentes.
- Você é consultivo: nunca diga que a despesa está autorizada para empenho ou pagamento; oriente a confirmar com a contabilidade e o controle interno.
- justificativa: até 6 linhas. orientacao: até 5 linhas, objetiva. Português do Brasil, linguagem de gestor."""


def _contexto_ia(r: dict) -> dict:
    enxuto = {k: v for k, v in r.items() if k not in ("transferencias", "fundamentacao")}
    enxuto["transferencias_resumo"] = [
        {k: t[k] for k in ("mes", "programa", "bloco", "natureza", "finalidade", "valor_liquido", "propostas")}
        for t in r.get("transferencias", [])[:60]]
    return enxuto


async def consultar_aplicacao(db: AsyncSession, municipio_id: int | None, ibge: str, exercicio: int, numero: str,
                              pergunta: str, api_key: str | None) -> dict:
    if not api_key:
        raise IAIndisponivel("A IA não está configurada no servidor (ANTHROPIC_API_KEY).")
    r = await detalhe(db, municipio_id, ibge, exercicio, numero)
    if r is None:
        raise LookupError("Portaria não encontrada nas transferências do exercício.")
    estado = await _estado_normas(db)
    base = [{"chave": k, **N.citar(k), "conferido_no_texto_oficial": (estado.get(k) or {}).get("confere", "manual 16/11/2026")}
            for k in N.DISPOSITIVOS]
    texto = (f"<analise_portaria>\n{json.dumps(_contexto_ia(r), ensure_ascii=False, default=str)}\n</analise_portaria>\n\n"
             f"<base_normativa>\n{json.dumps(base, ensure_ascii=False)}\n</base_normativa>\n\n"
             f"Data de hoje: {date.today().strftime('%d/%m/%Y')}\n"
             f"Despesa pretendida pelo gestor: {pergunta}")

    import anthropic
    client = anthropic.AsyncAnthropic(api_key=api_key)
    try:
        async with client.messages.stream(
            model=MODELO,
            max_tokens=16000,
            system=SYSTEM,
            messages=[{"role": "user", "content": texto}],
            extra_headers={"anthropic-beta": "server-side-fallback-2026-07-01"},
            extra_body={"output_config": {"effort": "high", "format": {"type": "json_schema", "schema": _SCHEMA}},
                        "fallbacks": "default"},
        ) as stream:
            msg = await stream.get_final_message()
    except anthropic.AuthenticationError as e:
        raise IAIndisponivel("Chave da IA inválida no servidor.") from e
    except anthropic.RateLimitError as e:
        raise IAIndisponivel("Limite de uso da IA atingido. Tente de novo em alguns minutos.") from e
    except anthropic.APIStatusError as e:
        logger.error("Portarias IA: erro da API (%s): %s", e.status_code, e)
        raise IAIndisponivel(f"A IA respondeu com erro ({e.status_code}).") from e
    except anthropic.APIConnectionError as e:
        raise IAIndisponivel("Sem conexão com o serviço de IA.") from e

    if msg.stop_reason == "refusal":
        raise IAIndisponivel("A IA não pôde responder a esta solicitação. Reformule a pergunta.")
    if msg.stop_reason == "max_tokens":
        raise IAIndisponivel("A resposta da IA ficou incompleta. Tente uma pergunta mais curta.")
    bruto = "".join(b.text for b in msg.content if b.type == "text").strip()
    try:
        resp = json.loads(bruto)
    except json.JSONDecodeError as e:
        raise IAIndisponivel("A IA devolveu uma resposta em formato inesperado.") from e
    return montar_resposta(resp, r, msg.model)


def montar_resposta(resp: dict, analise: dict, modelo: str) -> dict:
    """Valida a resposta da IA: só ficam citações da base conferida; sem base válida, vira análise complementar."""
    base_ok, descartadas = [], []
    for b in resp.get("base_legal", []):
        if b.get("chave") in N.DISPOSITIVOS:
            base_ok.append({**N.citar(b["chave"]), "como_se_aplica": b.get("como_se_aplica", "")})
        else:
            descartadas.append(b.get("chave"))
    classificacao = resp.get("classificacao")
    if not base_ok and classificacao in (N.PERMITIDO, N.COM_CONDICOES, N.VEDADO):
        classificacao = N.ANALISE
        resp.setdefault("falta_confirmar", []).append("A resposta não trouxe fundamentação da base conferida.")
    if (analise.get("situacao") == "pendente_confirmacao" or analise.get("estado_validacao") == EST_PENDENTE) \
            and classificacao in (N.PERMITIDO, N.COM_CONDICOES):
        classificacao = PENDENTE_TXT.upper()
    return {
        "classificacao": classificacao,
        "categoria": resp.get("categoria"),
        "norma_origem": resp.get("norma_origem", ""),
        "justificativa": resp.get("justificativa", ""),
        "base_legal": base_ok,
        "citacoes_descartadas": [d for d in descartadas if d],
        "condicoes": resp.get("condicoes", []),
        "falta_confirmar": resp.get("falta_confirmar", []),
        "orientacao": resp.get("orientacao", ""),
        "modelo": modelo,
        "gerado_em": datetime.utcnow().isoformat(),
        "aviso": AVISO,
    }


# ── Envio do PDF da análise técnica por e-mail ───────────────────────────────────

_RE_EMAIL = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


def validar_emails(lista: list[str]) -> list[str]:
    destinos = []
    for e in lista:
        e = (e or "").strip().lower()
        if not e:
            continue
        if not _RE_EMAIL.match(e) or len(e) > 254:
            raise ValueError(f"E-mail inválido: {e}")
        if e not in destinos:
            destinos.append(e)
    if not destinos:
        raise ValueError("Informe ao menos um e-mail.")
    if len(destinos) > 5:
        raise ValueError("Envie para no máximo 5 destinatários de cada vez.")
    return destinos


async def enviar_pdf_email(r: dict, pdf: bytes, nome_arquivo: str, destinos: list[str], mensagem: str | None, *,
                           municipio: str | None, remetente_nome: str | None) -> dict:
    """Envia pelo Resend (HTTPS — o Railway bloqueia SMTP), com o PDF anexado."""
    import base64
    import html as _html
    import os

    import httpx

    chave = os.getenv("RESEND_API_KEY", "")
    remetente = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
    if not chave:
        return {"ok": False, "erro": "Envio de e-mail não configurado no servidor (RESEND_API_KEY). "
                                     "Baixe o PDF e anexe ao seu e-mail."}
    links = r.get("links") or {}
    titulo = ("Transferências sem portaria identificada" if r.get("numero_portaria") == SEM_PORTARIA
              else f"Portaria nº {links.get('numero_formatado') or r.get('numero_portaria')}")
    assunto = f"Análise técnica — {titulo} — Exercício {r.get('exercicio')}" + (f" — {municipio}" if municipio else "")
    ident = r.get("identificacao") or {}
    valor = "R$ " + f"{float(ident.get('valor_transferido') or 0):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    corpo = (
        f"<p>{_html.escape(mensagem).replace(chr(10), '<br>')}</p>" if mensagem else ""
    ) + (
        f"<p>Segue em anexo a análise técnica da <b>{_html.escape(titulo)}</b> (exercício {r.get('exercicio')}), "
        f"gerada pelo ERSUS360{' para ' + _html.escape(municipio) if municipio else ''}.</p>"
        f"<p>Natureza: <b>{_html.escape(', '.join(r.get('naturezas') or ['EM ANÁLISE']))}</b><br>"
        f"Valor transferido: <b>{valor}</b><br>"
        f"Orientação: {_html.escape(r.get('orientacao') or '')}</p>"
        f"<p style='color:#6b7280;font-size:12px'>{_html.escape(AVISO)}</p>"
        f"<p style='color:#6b7280;font-size:12px'>Enviado por {_html.escape(remetente_nome or 'usuário do ERSUS360')} "
        f"pelo ERSUS360.</p>"
    )
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            resp = await c.post("https://api.resend.com/emails",
                                headers={"Authorization": f"Bearer {chave}", "Content-Type": "application/json"},
                                json={"from": remetente, "to": destinos, "subject": assunto, "html": corpo,
                                      "attachments": [{"filename": nome_arquivo,
                                                       "content": base64.b64encode(pdf).decode()}]})
    except httpx.HTTPError as e:
        logger.warning("Portarias IA: e-mail não enviado: %s", e)
        return {"ok": False, "erro": "Serviço de e-mail indisponível agora. Baixe o PDF e anexe ao seu e-mail."}
    if resp.status_code in (200, 201):
        return {"ok": True}
    logger.warning("Portarias IA: Resend HTTP %s: %s", resp.status_code, resp.text[:300])
    if resp.status_code == 403 and remetente.endswith("@resend.dev"):
        return {"ok": False, "erro": "O remetente de teste do servidor só entrega para o dono da conta de e-mail. "
                                     "Configure um domínio verificado (EMAIL_FROM) ou baixe o PDF e anexe ao seu e-mail."}
    return {"ok": False, "erro": f"O serviço de e-mail recusou o envio (HTTP {resp.status_code}). "
                                 "Baixe o PDF e anexe ao seu e-mail."}
