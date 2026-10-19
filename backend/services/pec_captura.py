"""
Grava o lote de TERRITÓRIO do PEC (imóveis e domicílios visitados por equipe e microárea).

Usado pela importação assistida (arquivo gerado a partir da tela do PEC) e pela sincronização
automática (API web do e-SUS PEC). Em ambos os casos o lote só contém contadores — nada de
cidadão — e fica marcado com a origem. Um lote do AGENTE LOCAL nunca é substituído.
"""
from __future__ import annotations

import calendar
import hashlib
import json
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.pec_agente import PecAcsLote, PecAgenteExecucao
from services.pec_acs import ORIGEM_AUTOMATICA, ORIGEM_CAPTURA, ORIGENS_TERRITORIO
from tenancy.auditoria import registrar_auditoria

CRITERIOS = {
    "imoveis": "Imóveis cadastrados na microárea, conforme o contador do PEC.",
    "domicilios_visitados": "Domicílios visitados no mês na microárea (contador do PEC), sobre os domicílios a visitar.",
    "nao_capturado": "ACS, visitas por dia/profissional, famílias e grupos prioritários não fazem parte desta captura.",
}


class ConflitoComLoteDoAgente(RuntimeError):
    """Já existe lote do agente local para a competência: o território do PEC não o substitui."""


def _hash(payload: dict) -> str:
    sem_data = {k: v for k, v in payload.items() if k not in ("capturado_em", "gerado_em")}
    return hashlib.sha256(json.dumps(sem_data, sort_keys=True, ensure_ascii=False, default=str).encode()).hexdigest()


async def gravar_lote_territorio(
    db: AsyncSession, municipio_id: int, *, competencia: str, capturado_em: datetime, equipes: list[dict],
    fonte: str | None, autor: str, origem: str, ip: str | None = None, usuario=None,
) -> dict:
    """`capturado_em` em UTC naive. `equipes`: [{ine, nome, tipo, cnes, unidade, microareas:[{codigo, imoveis,
    cadastro_completo, cadastro_atualizado, domicilios_visitados, domicilios_a_visitar}]}]."""
    assert origem in ORIGENS_TERRITORIO
    lote = (await db.execute(select(PecAcsLote).where(
        PecAcsLote.municipio_id == municipio_id, PecAcsLote.competencia == competencia))).scalar_one_or_none()
    if lote and (lote.payload or {}).get("origem") not in ORIGENS_TERRITORIO:
        raise ConflitoComLoteDoAgente(
            "Já existe um lote do agente local para esta competência; o território do PEC não o substitui.")

    ano, mes = int(competencia[:4]), int(competencia[5:])
    ult_dia = calendar.monthrange(ano, mes)[1]
    parcial = capturado_em.date() < date(ano, mes, ult_dia)      # antes do fim do mês = contagem parcial
    micro, lista_equipes = [], []
    for e in equipes:
        lista_equipes.append({k: e.get(k) for k in ("ine", "nome", "tipo", "cnes", "unidade")})
        for m in e.get("microareas") or []:
            micro.append({"codigo": m["codigo"], "ine": e["ine"], "domicilios": m["imoveis"],
                          "cadastro_completo": m.get("cadastro_completo"), "cadastro_atualizado": m.get("cadastro_atualizado"),
                          "domicilios_visitados": m.get("domicilios_visitados"),
                          "domicilios_a_visitar": m.get("domicilios_a_visitar")})
    payload = {
        "origem": origem, "fonte": fonte, "capturado_em": capturado_em.isoformat() + "Z", "capturado_por": autor,
        "parcial_ate": capturado_em.date().isoformat() if parcial else None,
        "equipes": lista_equipes, "acs": [], "microareas": micro, "visitas": [], "grupos": [], "totais": {},
        "criterios": CRITERIOS,
    }
    agora = datetime.utcnow()
    if not lote:
        lote = PecAcsLote(municipio_id=municipio_id, competencia=competencia)
        db.add(lote)
    versao = "sincronizacao-web" if origem == ORIGEM_AUTOMATICA else "captura-assistida"
    lote.recebido_em, lote.gerado_em = agora, capturado_em
    lote.periodo_inicio = f"{competencia}-01"
    lote.periodo_fim = capturado_em.date().isoformat() if parcial else f"{competencia}-{ult_dia:02d}"
    lote.agente_versao, lote.pec_versao, lote.hash_conteudo, lote.payload = versao, None, _hash(payload), payload

    rotulo = "Sincronização automática" if origem == ORIGEM_AUTOMATICA else f"Captura assistida por {autor}"
    db.add(PecAgenteExecucao(
        municipio_id=municipio_id, tipo="sync_web" if origem == ORIGEM_AUTOMATICA else "captura", status="aceito",
        competencia=competencia, registros=len(micro), agente_versao=versao, ip_origem=ip,
        mensagem=f"{rotulo}: {len(lista_equipes)} equipes · {len(micro)} microáreas"
                 + (f" · parcial até {capturado_em.date().isoformat()}" if parcial else "")))
    await registrar_auditoria(
        db, "PEC_TERRITORIO_SINCRONIZADO" if origem == ORIGEM_AUTOMATICA else "PEC_CAPTURA_TERRITORIO_IMPORTADA",
        usuario=usuario, login=None if usuario else autor, municipio_id=municipio_id, ip=ip, tabela="pec_acs_lotes",
        detalhe=f"{competencia}: {len(lista_equipes)} equipes, {len(micro)} microáreas")
    await db.commit()
    return {"ok": True, "competencia": competencia, "equipes": len(lista_equipes), "microareas": len(micro),
            "parcial_ate": payload["parcial_ate"]}


async def registrar_falha_sync(db: AsyncSession, municipio_id: int, competencia: str | None, mensagem: str) -> None:
    """Falha da sincronização automática: aparece no histórico da aba Capturar PEC (sem credenciais na mensagem)."""
    db.add(PecAgenteExecucao(municipio_id=municipio_id, tipo="sync_web", status="erro_origem", competencia=competencia,
                             agente_versao="sincronizacao-web", mensagem=mensagem[:900]))
    await db.commit()
