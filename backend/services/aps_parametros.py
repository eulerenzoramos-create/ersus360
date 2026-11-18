"""
Parâmetros normativos do Simulador de Financiamento da APS.

Base: texto da Portaria GM/MS nº 3.493, de 10/04/2024 (consolidado BVS/MS, com as redações da PRT GM/MS
6.907/2025), lido em 18/11/2026. Só entram aqui números que estão no texto da norma — nada é estimado.
Atualizações (norma nova, nota técnica) entram pela tabela aps_parametro_norma, com fonte, data e
justificativa, e só passam a valer depois de validadas; a versão anterior é preservada para o histórico.

Monitoramento automático: o e-Gestor publica, em cada componente do relatório de pagamento, os "valores de
referência" e a portaria vigente. A cada sincronização do e-Gestor, `detectar_alteracoes` compara o que foi
publicado com a última versão registrada; se mudou, registra a alteração (pendente de validação) e o
Simulador avisa o gestor. Tabelas que o e-Gestor não publica (valores por classificação, transição) não
têm fonte automática: o Simulador sinaliza quando o valor pago diverge da tabela (atualização manual).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.aps_parametro import ApsParametroNorma

PRT = "PRT GM/MS 3.493/2024"
FONTE_BASE = ("Portaria GM/MS nº 3.493/2024 — texto consolidado (bvsms.saude.gov.br/bvs/saudelegis/gm/2024/"
              "prt3493_11_04_2024.html), com redação da PRT GM/MS 6.907/2025; lido em 18/11/2026")
CLASSES = ("otimo", "bom", "suficiente", "regular")
ROTULO_CLASSE = {"otimo": "Ótimo", "bom": "Bom", "suficiente": "Suficiente", "regular": "Regular"}


def _tab(prefixo: str, valores: tuple, norma: str) -> dict:
    return {f"{prefixo}.{c}": (v, norma) for c, v in zip(CLASSES, valores)}


BASE: dict[str, tuple[float | str | None, str]] = {
    # Componente fixo por equipe e estrato do IED (Art. 9º-B)
    **{f"fixo.eSF.E{i}": (v, f"{PRT}, Art. 9º-B") for i, v in enumerate((18000, 16000, 14000, 12000), 1)},
    **{f"fixo.eAP30.E{i}": (v, f"{PRT}, Art. 9º-B") for i, v in enumerate((10800, 9600, 8400, 7200), 1)},
    **{f"fixo.eAP20.E{i}": (v, f"{PRT}, Art. 9º-B") for i, v in enumerate((7200, 6400, 5600, 4800), 1)},
    # Vínculo e acompanhamento territorial (Anexo II — Anexo XCIX-A)
    **_tab("vinculo.eSF", (8000, 6000, 4000, 2000), f"{PRT}, Anexo II"),
    **_tab("vinculo.eAP30", (4000, 3000, 2000, 1000), f"{PRT}, Anexo II"),
    **_tab("vinculo.eAP20", (3000, 2250, 1500, 750), f"{PRT}, Anexo II"),
    # Qualidade (Anexo III — Anexo XCIX-B)
    **_tab("qualidade.eSF", (8000, 6000, 4000, 2000), f"{PRT}, Anexo III"),
    **_tab("qualidade.eAP30", (4000, 3000, 2000, 1000), f"{PRT}, Anexo III"),
    **_tab("qualidade.eAP20", (3000, 2250, 1500, 750), f"{PRT}, Anexo III"),
    **_tab("qualidade.eMulti.ampliada", (9000, 6750, 4500, 2250), f"{PRT}, Anexo III"),
    **_tab("qualidade.eMulti.complementar", (6000, 4500, 3000, 1500), f"{PRT}, Anexo III"),
    **_tab("qualidade.eMulti.estrategica", (3000, 2250, 1500, 750), f"{PRT}, Anexo III"),
    **_tab("qualidade.eSB.I", (2449, 1836.75, 1224.5, 612.25), f"{PRT}, Anexo III"),
    **_tab("qualidade.eSB.II", (3267, 2450.25, 1633.5, 816.75), f"{PRT}, Anexo III"),
    **_tab("qualidade.eSB.I_quil", (3673.5, 2755.13, 1836.75, 918.38), f"{PRT}, Anexo III"),
    **_tab("qualidade.eSB.II_quil", (4900.5, 3675.38, 2450.25, 1225.13), f"{PRT}, Anexo III"),
    # Incentivo de implantação (parcela única, não recorrente — Art. 9º-C)
    "implantacao.eSF": (30000, f"{PRT}, Art. 9º-C"), "implantacao.eAP30": (16800, f"{PRT}, Art. 9º-C"),
    "implantacao.eAP20": (10800, f"{PRT}, Art. 9º-C"), "implantacao.eSB40": (14000, f"{PRT}, Art. 9º-C"),
    "implantacao.eMulti.ampliada": (36000, f"{PRT}, Art. 9º-C"),
    "implantacao.eMulti.complementar": (24000, f"{PRT}, Art. 9º-C"),
    "implantacao.eMulti.estrategica": (12000, f"{PRT}, Art. 9º-C"),
    # Parâmetro de cadastro por eSF, por porte populacional (Art. 11, § 1º; limite +50% no § 2º)
    "cadastro.eSF.ate20mil": (2000, f"{PRT}, Art. 11, § 1º"), "cadastro.eSF.ate50mil": (2500, f"{PRT}, Art. 11, § 1º"),
    "cadastro.eSF.ate100mil": (2750, f"{PRT}, Art. 11, § 1º"), "cadastro.eSF.acima100mil": (3000, f"{PRT}, Art. 11, § 1º"),
    # Transição (Art. 3º, I e II, red. PRT GM/MS 6.907/2025; perguntas frequentes do SIAPS, v1.0 de 11/11/2025):
    # vínculo e qualidade pagos no valor "Bom" de maio/2024 a dezembro/2025. Depois disso o Simulador identifica
    # a regra efetivamente aplicada no próprio pagamento de cada parcela (ver aps_simulador).
    "transicao.periodo": ("202405-202512", "PRT GM/MS 3.493/2024, Art. 3º (red. PRT GM/MS 6.907/2025); FAQ SIAPS"),
}

FONTE_7799 = ("Portaria GM/MS nº 7.799/2025 — texto em bvsms.saude.gov.br/bvs/saudelegis/gm/2025/prt7799_21_08_2025.html "
              "(Anexo XCIX-B), lido em 18/11/2026")
FONTE_9591 = ("Portaria GM/MS nº 9.591/2025 (DOU 23/12/2025) — tabela do Anexo XCIX-B para eSB 40h reproduzida em "
              "acsace.com.br (texto oficial na BVS indisponível em 18/11/2026); valores conferidos com o pagamento do "
              "e-Gestor (parcela 10/2026: 4 eSB Ótimo × R$ 3.750 + 6 Bom × R$ 3.000 = R$ 33.000 pagos)")
FONTE_5850 = ("Portaria GM/MS nº 5.850/2024, republicada (DOU nº 236, 09/12/2024) — bvsms.saude.gov.br/bvs/saudelegis/gm/"
              "2025/prt5850_06_02_2025_REP.html, Arts. 69 a 72 e Anexos; com a PRT GM/MS nº 8.994/2025 (até 2 profissionais "
              "de nível superior; limite de 50% fora da Amazônia Legal/Pantanal); lido em 18/11/2026. Custeio de R$ 24.000 "
              "conferido com o valor de referência publicado no e-Gestor")

# Versões posteriores da tabela (vigência AAAAMM). Valem a partir da competência indicada; antes dela vale a BASE.
VERSOES: list[tuple[str, str, float, str, str]] = [
    *[(f"qualidade.eSFR.{c}", "202508", v, "PRT GM/MS 7.799/2025, Anexo XCIX-B", FONTE_7799)
      for c, v in zip(CLASSES, (8000, 6000, 4000, 2000))],
    *[(f"qualidade.eCR.{m}.{c}", "202508", v, "PRT GM/MS 7.799/2025, Anexo XCIX-B", FONTE_7799)
      for m, vs in (("III", (8000, 6000, 4000, 2000)), ("II", (7000, 5250, 3500, 1750)), ("I", (6000, 4500, 3000, 1500)))
      for c, v in zip(CLASSES, vs)],
    *[(f"vinculo.eSFR.{c}", "202412", v, "PRT GM/MS 5.850/2024, Anexo XCIX-A", FONTE_5850)
      for c, v in zip(CLASSES, (8000, 6000, 4000, 2000))],
    # eSFR — arranjo ribeirinho (Arts. 69 a 72): custeio, implantação, profissionais adicionais e logística
    ("esfr.custeio", "202412", 24000, "PRT GM/MS 5.850/2024, Art. 69", FONTE_5850),
    ("esfr.implantacao", "202412", 50000, "PRT GM/MS 5.850/2024, Art. 69-A", FONTE_5850),
    ("esfr.prof.aux_tec_enfermagem", "202412", 2375, "PRT GM/MS 5.850/2024, Art. 71 e Anexo (até 11)", FONTE_5850),
    ("esfr.prof.saude_bucal", "202412", 2375, "PRT GM/MS 5.850/2024, Art. 71 e Anexo (até 1)", FONTE_5850),
    ("esfr.prof.nivel_superior", "202412", 5000, "PRT GM/MS 5.850/2024, Art. 71 e Anexo; PRT 8.994/2025 (até 2)", FONTE_5850),
    ("esfr.logistica.embarcacao", "202412", 6000, "PRT GM/MS 5.850/2024, Art. 72 e Anexo (até 4)", FONTE_5850),
    ("esfr.logistica.pickup", "202412", 6000, "PRT GM/MS 5.850/2024, Art. 72 e Anexo (até 2)", FONTE_5850),
    ("esfr.logistica.unidade_apoio", "202412", 4000, "PRT GM/MS 5.850/2024, Art. 72 e Anexo (até 4)", FONTE_5850),
    *[(f"qualidade.eSB.{m}.{c}", "202601", v, "PRT GM/MS 9.591/2025, Anexo XCIX-B (eSB 40h)", FONTE_9591)
      for m, vs in (("I", (2500, 2000, 1500, 1000)), ("II", (3300, 2500, 1700, 1200)),
                    ("I_quil", (3750, 3000, 2250, 1500)), ("II_quil", (4950, 3750, 2550, 1800)))
      for c, v in zip(CLASSES, vs)],
]

DESCRICAO = {
    "fixo": "Componente fixo (por equipe, conforme estrato do IED)",
    "vinculo": "Vínculo e acompanhamento territorial (por classificação)",
    "qualidade": "Componente de qualidade (por classificação)",
    "implantacao": "Incentivo de implantação (parcela única)",
    "cadastro": "Parâmetro de pessoas cadastradas por eSF",
    "transicao": "Regra de transição do pagamento de vínculo e qualidade",
}


def _vale(p: ApsParametroNorma, competencia: str) -> bool:
    return p.situacao in ("vigente", "substituido") and p.vigencia_inicio <= competencia \
        and (p.vigencia_fim is None or competencia < p.vigencia_fim)


async def vigentes(db: AsyncSession, municipio_id: int, competencia: str) -> dict[str, dict]:
    """Parâmetros que valem na competência (AAAAMM): base da portaria + atualizações validadas (nacionais ou do
    município), escolhendo a versão cuja vigência cobre a competência — cálculo histórico preservado."""
    saida = {k: {"valor": v if not isinstance(v, str) else None, "valor_texto": v if isinstance(v, str) else None,
                 "norma": n, "fonte": FONTE_BASE, "origem": "norma", "vigencia_inicio": None, "id": None}
             for k, (v, n) in BASE.items()}
    for k, vig, v, n, f in VERSOES:
        if competencia >= vig:
            saida[k] = {"valor": v, "valor_texto": None, "norma": n, "fonte": f, "origem": "norma",
                        "vigencia_inicio": vig, "id": None}
    regs = (await db.execute(select(ApsParametroNorma).where(
        (ApsParametroNorma.municipio_id.is_(None)) | (ApsParametroNorma.municipio_id == municipio_id),
        ApsParametroNorma.origem == "manual").order_by(ApsParametroNorma.vigencia_inicio, ApsParametroNorma.id))).scalars()
    for p in regs:
        if _vale(p, competencia):
            saida[p.chave] = {"valor": p.valor, "valor_texto": p.valor_texto, "norma": p.norma, "fonte": p.fonte,
                              "origem": "atualizacao_validada", "vigencia_inicio": p.vigencia_inicio, "id": p.id}
    return saida


def valor(params: dict, chave: str) -> float | None:
    p = params.get(chave)
    return p["valor"] if p else None


async def historico(db: AsyncSession, municipio_id: int) -> list[dict]:
    regs = (await db.execute(select(ApsParametroNorma).where(
        (ApsParametroNorma.municipio_id.is_(None)) | (ApsParametroNorma.municipio_id == municipio_id))
        .order_by(ApsParametroNorma.registrado_em.desc()))).scalars()
    return [{"id": p.id, "chave": p.chave, "valor": p.valor, "valor_texto": p.valor_texto, "norma": p.norma,
             "fonte": p.fonte, "origem": p.origem, "justificativa": p.justificativa,
             "vigencia_inicio": p.vigencia_inicio, "vigencia_fim": p.vigencia_fim, "situacao": p.situacao,
             "detalhe": p.detalhe, "registrado_por": p.registrado_por,
             "registrado_em": p.registrado_em.isoformat() if p.registrado_em else None,
             "validado_por": p.validado_por, "validado_em": p.validado_em.isoformat() if p.validado_em else None}
            for p in regs]


async def registrar(db: AsyncSession, municipio_id: int | None, dados: dict, usuario: str) -> ApsParametroNorma:
    """Atualização manual: entra como pendente de validação (não altera nenhum cálculo até ser validada)."""
    p = ApsParametroNorma(municipio_id=municipio_id, chave=dados["chave"], valor=dados.get("valor"),
                          valor_texto=dados.get("valor_texto"), norma=dados["norma"], fonte=dados["fonte"],
                          origem="manual", justificativa=dados["justificativa"],
                          vigencia_inicio=dados["vigencia_inicio"], situacao="pendente_validacao",
                          registrado_por=usuario)
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


async def decidir(db: AsyncSession, municipio_id: int, pid: int, aprovar: bool, usuario: str) -> ApsParametroNorma | None:
    """Valida (ou rejeita) uma atualização. A versão anterior da mesma chave ganha vigencia_fim e é preservada."""
    p = await db.get(ApsParametroNorma, pid)
    if p is None or p.situacao != "pendente_validacao" or p.municipio_id not in (None, municipio_id):
        return None
    p.validado_por, p.validado_em = usuario, datetime.utcnow()
    if not aprovar:
        p.situacao = "rejeitado"
    elif p.origem == "egestor":
        p.situacao = "vigente"           # alteração detectada no e-Gestor: só registro de ciência
    else:
        anteriores = (await db.execute(select(ApsParametroNorma).where(
            ApsParametroNorma.chave == p.chave, ApsParametroNorma.origem == "manual",
            ApsParametroNorma.situacao == "vigente", ApsParametroNorma.id != p.id,
            ApsParametroNorma.municipio_id.is_(None) if p.municipio_id is None
            else ApsParametroNorma.municipio_id == p.municipio_id))).scalars()
        for a in anteriores:
            if a.vigencia_inicio < p.vigencia_inicio:
                a.situacao, a.vigencia_fim = "substituido", p.vigencia_inicio
        p.situacao = "vigente"
    await db.commit()
    return p


async def detectar_alteracoes(db: AsyncSession, municipio_id: int, componentes: list[dict], parcela: str) -> list[str]:
    """Compara os valores de referência publicados pelo e-Gestor (com a portaria vigente) com o último registro.
    Novo ou diferente → nova linha 'pendente_validacao' (origem egestor). Nada é apagado."""
    novas = []
    for c in componentes:
        ref = (c.get("resumo") or {}).get("_referencia") or {}
        vr = ref.get("valoresReferencia") or ref.get("listaValoresReferencia")
        if not vr:
            continue
        chave = f"egestor.ref.{c['co_componente']}"
        ultimo = (await db.execute(select(ApsParametroNorma).where(
            ApsParametroNorma.municipio_id == municipio_id, ApsParametroNorma.chave == chave)
            .order_by(ApsParametroNorma.id.desc()).limit(1))).scalars().first()
        if ultimo is not None and ultimo.detalhe == vr:
            continue
        portarias = sorted({str(x.get("portaria")) for x in (vr if isinstance(vr, list) else [vr]) if x.get("portaria")})
        db.add(ApsParametroNorma(
            municipio_id=municipio_id, chave=chave, valor=None, valor_texto=c.get("ds_componente", "")[:200],
            norma="; ".join(portarias)[:200] or "não informada pelo e-Gestor",
            fonte=f"e-Gestor APS — relatório de pagamento, parcela {parcela}, valores de referência",
            origem="egestor", vigencia_inicio=parcela, detalhe=vr,
            justificativa=("Primeiro registro dos valores de referência publicados." if ultimo is None else
                           "O e-Gestor passou a publicar valores de referência diferentes do último registro."),
            situacao="vigente" if ultimo is None else "pendente_validacao", registrado_por="monitor e-Gestor"))
        if ultimo is not None:
            novas.append(c.get("ds_componente") or chave)
    await db.commit()
    return novas
