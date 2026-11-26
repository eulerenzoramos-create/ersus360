"""
Monitoramento CNES — relatório (PDF/Excel) e alertas automáticos a partir da validação (services/cnes_validacao.py).

Relatório: reaproveita o gerador de documentos do PMS Vivo (services/pms_relatorios.Documento/pdf/xlsx).
Alertas: depois de cada coleta do CNES, cada critério irregular vira um alerta na página Alertas (sem duplicar
enquanto não for resolvido); o alerta some sozinho quando o critério deixa de ser irregular. Determinístico —
nenhum texto de alerta é gerado por IA.
"""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.pms_relatorios import Documento, Secao

ROT_SIT = {"irregular": "Irregular", "atencao": "Atenção", "nao_verificavel": "Não verificável", "conforme": "Conforme"}
MODULO_ALERTA = "CNES"
PREFIXO = "CNES · "


def _rot(c: str | None) -> str:
    return f"{c[4:6]}/{c[:4]}" if c and len(c) == 6 else (c or "—")


def filtrar(v: dict, tipo: str | None = None, situacao: str | None = None, cnes: str | None = None) -> list[dict]:
    eqs = v["equipes"]
    if tipo:
        eqs = [e for e in eqs if e["tipo"] == tipo]
    if situacao:
        eqs = [e for e in eqs if e["situacao"] == situacao]
    if cnes:
        eqs = [e for e in eqs if any(x["cnes"] == cnes for x in e["estabelecimentos"])]
    return eqs


def documento(v: dict, municipio: str, equipes: list[dict]) -> Documento:
    comp = (f"CNES {_rot(v['competencia_cnes'])} · e-Gestor parcela {_rot(v.get('parcela_egestor'))} "
            f"(CNES {_rot(v.get('competencia_cnes_egestor'))})")
    cards = Secao("Resumo por modalidade", tabelas=[(
        ["Modalidade", "Cadastradas no CNES", "Ativas", "Credenciadas", "Homologadas", "Financiadas", "Regulares",
         "Com incompatibilidade", "Profissionais"],
        [[t, c["cadastradas_cnes"], c["ativas"], "não publicado" if c["credenciadas"] is None else c["credenciadas"],
          "não publicado" if c["homologadas"] is None else c["homologadas"], c["financiadas"], c["regulares"],
          c["com_incompatibilidade"], c["profissionais"]] for t, c in v["cards"].items() if c["cadastradas_cnes"]])])
    lista = Secao("Equipes", tabelas=[(
        ["INE", "Equipe", "Modalidade", "CNES", "Profissionais", "Carga horária", "Situação"],
        [[e["ine"], e["nome"], e["tipo"], ", ".join(x["cnes"] for x in e["estabelecimentos"]), e["n_profissionais"],
          f"{e['ch_total']} h", ROT_SIT[e["situacao"]]] for e in equipes])])
    conf = Secao("Conformidade normativa (critérios irregulares e em atenção)", tabelas=[(
        ["Equipe", "Critério", "Exigência MS", "Situação CNES", "Diferença", "Situação", "Fundamentação"],
        [[f"{e['tipo']} {e['nome']} ({e['ine']})", c["criterio"], c["exigencia"], c["situacao_cnes"], c["diferenca"],
          ROT_SIT[c["situacao"]],
          (f"{c['fundamentacao']['norma']}, {c['fundamentacao']['dispositivo']} — {c['fundamentacao']['url']}"
           if c.get("fundamentacao") else "—") + (f" · {c['observacao']}" if c.get("observacao") else "")]
         for e in equipes for c in e["criterios"] if c["situacao"] in ("irregular", "atencao")])])
    profs = Secao("Profissionais com irregularidade", tabelas=[(
        ["Equipe", "Profissional", "CBO", "CH CNES", "CH exigida", "CH em equipes da APS", "Motivo"],
        [[f"{e['tipo']} {e['nome']}", p["nome"], f"{p['cbo']} {p['ds_cbo']}", p["ch_cnes"],
          p["ch_exigida"] if p["ch_exigida"] is not None else "—", p["ch_aps_total"], "; ".join(p["motivos"])]
         for e in equipes for p in e["profissionais"] if p["situacao"] == "irregular"])])
    return Documento(
        titulo=f"Monitoramento CNES — {municipio}", subtitulo=comp,
        secoes=[cards, lista, conf, profs],
        aviso=("Validação automática: CNES (API pública) × Matriz Normativa da APS (PRC 2 e PRC 6, conferidas no "
               "Saúde Legis) × e-Gestor APS (relatório público) × SIAPS. Vínculos em outros municípios não aparecem "
               "na consulta do CNES por município."))


async def sincronizar_alertas(db: AsyncSession, municipio_id: int, v: dict) -> dict:
    """Cria alertas para critérios irregulares e resolve os que deixaram de existir."""
    from datetime import datetime

    from models.alerta import Alerta, SeveridadeAlerta
    atuais: dict[str, tuple[str, str]] = {}
    for e in v["equipes"]:
        for c in e["criterios"]:
            if c["situacao"] != "irregular":
                continue
            titulo = f"{PREFIXO}{e['tipo']} {e['nome']} — {c['criterio']}"[:200]
            f = c.get("fundamentacao") or {}
            desc = (f"INE {e['ine']} · {c['diferenca']} (exigência: {c['exigencia']}). "
                    + (f"{c['observacao']} " if c.get("observacao") else "")
                    + (f"Fundamentação: {f['norma']}, {f['dispositivo']}. " if f else "")
                    + f"CNES {_rot(v['competencia_cnes'])}.")
            atuais[titulo] = (desc, "critico" if "suspens" in c["criterio"].lower() or "e-Gestor" in c["criterio"]
                              else "atencao")
    abertos = {a.titulo: a for a in (await db.execute(select(Alerta).where(
        Alerta.municipio_id == municipio_id, Alerta.modulo == MODULO_ALERTA, Alerta.resolvido.is_(False)))).scalars()}
    criados = resolvidos = 0
    for titulo, (desc, sev) in atuais.items():
        if titulo in abertos:
            abertos[titulo].descricao = desc
        else:
            db.add(Alerta(municipio_id=municipio_id, titulo=titulo, descricao=desc, modulo=MODULO_ALERTA,
                          severidade=SeveridadeAlerta(sev)))
            criados += 1
    for titulo, a in abertos.items():
        if titulo not in atuais and titulo.startswith(PREFIXO):
            a.resolvido, a.resolvido_em = True, datetime.utcnow()
            resolvidos += 1
    await db.commit()
    return {"criados": criados, "resolvidos": resolvidos, "abertos": len(atuais)}
