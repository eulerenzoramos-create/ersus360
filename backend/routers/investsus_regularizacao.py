"""
InvestSUS — Regularização de Contas de Emendas (ADPF 854).

Fonte: painel público do FNS "Regularização Contas Emendas" (Qlik), lido por
services/investsus_regularizacao_contas.py. Cruza cada conta com a proposta gravada e gera
alerta quando o painel marca a conta como PENDENTE; encerra o alerta quando ela é regularizada.
"""
from __future__ import annotations

import logging
import re
from datetime import date, datetime

from fastapi import APIRouter, Body, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from models.investsus import (
    AlertaInvestSUS, ColetaRegularizacaoInvestSUS, ContaRegularizacaoInvestSUS, PropostaInvestSUS,
)
from routers.investsus import (
    DbDep, UserDep, _ROTULO_NIVEL_GERAL, _dados_fundo, _filtro_escopo, _filtro_visivel,
    _modalidade_de, _municipio_id, _pode_sincronizar, _registrar_alertas,
)
from services import investsus_regularizacao_contas as reg

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/investsus/regularizacao-contas", tags=["InvestSUS"])

TIPO_ALERTA_CONTA = "regularizacao_conta_pendente"


def _so_conta(v: str | None) -> str:
    return re.sub(r"[^0-9X]", "", (v or "").upper())


def _conta_dict(c: ContaRegularizacaoInvestSUS, prop: PropostaInvestSUS | None) -> dict:
    d = {k: getattr(c, k) for k in (
        "id", "cnpj", "uf", "municipio", "esfera", "banco", "agencia_dv", "conta_dv", "nova_conta_cef",
        "status_regularizacao", "possui_pendencia", "numero_emenda", "numero_proposta",
        "link_consulta_fns", "presente_ultima_coleta", "historico", "proposta_id")}
    d["data_abertura"] = c.data_abertura.isoformat() if c.data_abertura else None
    d["atualizado_em"] = c.atualizado_em.isoformat() if c.atualizado_em else None
    divergencias: list[str] = []
    d["proposta"] = None
    if prop is not None:
        if prop.numero_emenda and c.numero_emenda and _so_conta(prop.numero_emenda) != _so_conta(c.numero_emenda):
            divergencias.append(f"Emenda no painel ({c.numero_emenda}) difere da proposta ({prop.numero_emenda})")
        conta_prop = _so_conta(prop.conta_bancaria)
        if conta_prop and _so_conta(c.conta_dv).lstrip("0") not in conta_prop:
            divergencias.append(f"Conta no painel ({c.conta_dv}) difere da conta da proposta ({prop.conta_bancaria})")
        d["proposta"] = {
            "id": prop.id, "numero_proposta": prop.numero_proposta, "exercicio": prop.exercicio,
            "modalidade": _modalidade_de(prop),
            "situacao": prop.situacao_normalizada.value if prop.situacao_normalizada else None,
            "situacao_original": prop.situacao_original,
            "parlamentar": prop.parlamentar.nome if prop.parlamentar else None,
            "valor_aprovado": prop.valor_aprovado, "valor_pago": prop.valor_pago,
            "objeto": (prop.objeto or "")[:200] or None,
        }
    d["divergencias"] = divergencias
    return d


def _data(v) -> date | None:
    try:
        return date.fromisoformat(v) if v else None
    except (TypeError, ValueError):
        return None


async def aplicar_coleta(db, mid: int, payload: dict, origem: str, usuario: str | None) -> dict:
    """Grava a coleta (contrato JSON do agente), cruza com as propostas e gera/encerra alertas."""
    from models.alerta import Alerta, SeveridadeAlerta
    contas = payload["contas"]
    meta = payload.get("metadata") or {}
    agora = datetime.utcnow()

    props = (await db.execute(select(PropostaInvestSUS).where(PropostaInvestSUS.municipio_id == mid))).scalars().all()
    por_numero = {_so_conta(p.numero_proposta): p for p in props if p.numero_proposta}
    existentes = {(c.conta_dv, c.numero_proposta): c for c in (await db.execute(
        select(ContaRegularizacaoInvestSUS).where(ContaRegularizacaoInvestSUS.municipio_id == mid))).scalars().all()}

    vistos: set = set()
    novas_pendencias = encerrados = vinculadas = 0
    for n in contas:
        chave = (n["conta_dv"], n["numero_proposta"])
        if chave in vistos:
            continue
        vistos.add(chave)
        prop = next((por_numero[x] for x in reg.propostas_da_linha(n["numero_proposta"]) if x in por_numero), None)
        c = existentes.get(chave)
        status_antes = c.status_regularizacao if c else None
        if c is None:
            c = ContaRegularizacaoInvestSUS(municipio_id=mid, conta_dv=n["conta_dv"],
                                            numero_proposta=n["numero_proposta"], primeira_coleta_em=agora,
                                            historico=[])
            db.add(c)
        for campo in ("cnpj", "uf", "municipio", "esfera", "banco", "agencia_dv", "nova_conta_cef",
                      "status_regularizacao", "possui_pendencia", "numero_emenda", "link_consulta_fns"):
            setattr(c, campo, n.get(campo))
        c.data_abertura = _data(n.get("data_abertura"))
        c.proposta_id = prop.id if prop else None
        c.presente_ultima_coleta = True
        c.atualizado_em = agora
        mudou = status_antes != n["status_regularizacao"]
        if mudou:
            c.historico = list(c.historico or []) + [
                {"em": agora.isoformat(timespec="seconds"), "de": status_antes, "para": n["status_regularizacao"]}]
        vinculadas += 1 if prop else 0

        titulo = f"Conta {n['conta_dv']} da proposta {n['numero_proposta']} pendente de regularização (ADPF 854)"
        if n["possui_pendencia"]:
            novas_pendencias += 1 if mudou else 0
            if prop is not None:
                await _registrar_alertas(db, prop, mid, [{
                    "tipo_alerta": TIPO_ALERTA_CONTA, "nivel": "urgente", "titulo": titulo,
                    "descricao": (f"O painel Regularização Contas Emendas do FNS marca a conta {n['banco']} "
                                  f"ag. {n['agencia_dv']} c/c {n['conta_dv']} (emenda {n['numero_emenda']}) como "
                                  f"{n['status_regularizacao']}."),
                    "providencia": ("Regularizar a titularidade da conta junto ao banco e conferir no painel do "
                                    "FNS (atualização semanal). Dúvidas: investsus@saude.gov.br."),
                }])
            elif mudou:
                # Sem proposta gravada: vai direto à central de Alertas (uma vez por mudança de status).
                db.add(Alerta(municipio_id=mid, titulo=titulo[:200], modulo="InvestSUS",
                              descricao="Conta sem proposta correspondente no InvestSUS 360.",
                              severidade=SeveridadeAlerta(_ROTULO_NIVEL_GERAL["urgente"])))
        elif prop is not None:
            abertos = (await db.execute(select(AlertaInvestSUS).where(
                AlertaInvestSUS.proposta_id == prop.id, AlertaInvestSUS.tipo_alerta == TIPO_ALERTA_CONTA,
                AlertaInvestSUS.resolvido == False))).scalars().all()  # noqa: E712
            for al in abertos:
                if n["conta_dv"] in (al.titulo or ""):
                    al.resolvido, al.resolvido_em = True, agora
                    al.resolvido_por = f"Painel FNS ({n['status_regularizacao'].lower()})"
                    encerrados += 1

    for chave, c in existentes.items():
        if chave not in vistos:
            c.presente_ultima_coleta = False

    db.add(ColetaRegularizacaoInvestSUS(
        municipio_id=mid, coletado_em=agora, origem=origem, usuario=usuario,
        filtros=meta.get("filtros_aplicados"), resumo=reg.resumo(contas),
        atualizacao_bb=_data(meta.get("atualizacao_bb")), atualizacao_cef=_data(meta.get("atualizacao_cef")), ok=True))
    await db.commit()
    return {"ok": True, "coletado_em": agora.isoformat(), "resumo": reg.resumo(contas),
            "vinculadas_a_propostas": vinculadas, "novas_pendencias": novas_pendencias,
            "alertas_encerrados": encerrados}


async def sincronizar(db, mid: int, origem: str, usuario: str | None) -> dict:
    """Lê o painel do FNS para o município (UF + nome + esfera municipal) e grava.
    Falha não apaga nada: fica registrada na tabela de coletas."""
    fundo = await _dados_fundo(db, mid)
    try:
        payload = await reg.coletar(fundo["uf"], fundo["nome"], "MUNICIPAL")
    except Exception as exc:
        db.add(ColetaRegularizacaoInvestSUS(municipio_id=mid, origem=origem, usuario=usuario, ok=False,
                                            erro=str(exc)[:2000]))
        await db.commit()
        raise
    return await aplicar_coleta(db, mid, payload, origem, usuario)


@router.get("")
async def listar(db: DbDep, user: UserDep):
    """Contas do painel FNS × propostas do município, com resumo, divergências e última coleta."""
    mid = _municipio_id(user)
    contas = (await db.execute(select(ContaRegularizacaoInvestSUS).where(
        ContaRegularizacaoInvestSUS.municipio_id == mid))).scalars().all()
    contas.sort(key=lambda c: (not c.possui_pendencia, -(c.data_abertura.toordinal() if c.data_abertura else 0)))
    props = {p.id: p for p in (await db.execute(
        select(PropostaInvestSUS).options(selectinload(PropostaInvestSUS.parlamentar))
        .where(PropostaInvestSUS.municipio_id == mid))).scalars().all()}
    linhas = [_conta_dict(c, props.get(c.proposta_id)) for c in contas]
    atuais = [x for x in linhas if x["presente_ultima_coleta"]]

    # Propostas visíveis já pagas cuja conta não aparece no painel.
    no_painel = {x for c in contas if c.presente_ultima_coleta for x in reg.propostas_da_linha(c.numero_proposta)}
    sem_conta = []
    if contas:  # sem coleta ainda, não há o que comparar
        visiveis = (await db.execute(select(PropostaInvestSUS).where(
            PropostaInvestSUS.municipio_id == mid, _filtro_escopo(), _filtro_visivel()))).scalars().all()
        sem_conta = [{"id": p.id, "numero_proposta": p.numero_proposta, "exercicio": p.exercicio,
                      "modalidade": _modalidade_de(p), "valor_pago": p.valor_pago,
                      "situacao": p.situacao_normalizada.value if p.situacao_normalizada else None}
                     for p in visiveis
                     if (p.valor_pago or 0) > 0 and _so_conta(p.numero_proposta) not in no_painel]

    coletas = (await db.execute(select(ColetaRegularizacaoInvestSUS).where(
        ColetaRegularizacaoInvestSUS.municipio_id == mid).order_by(
        ColetaRegularizacaoInvestSUS.coletado_em.desc()).limit(10))).scalars().all()
    ultima_ok = next((c for c in coletas if c.ok), None)
    falha = next((c for c in coletas if not c.ok), None)
    por_status: dict[str, int] = {}
    for x in atuais:
        por_status[x["status_regularizacao"]] = por_status.get(x["status_regularizacao"], 0) + 1
    return {
        "fonte": reg.FONTE, "url_painel": reg.URL_PAINEL,
        "resumo": {
            "total_contas": len(atuais),
            "total_regularizadas": por_status.get(reg.STATUS_REGULARIZADA, 0),
            "total_pendentes": sum(1 for x in atuais if x["possui_pendencia"]),
            "total_em_acompanhamento": sum(por_status.get(s, 0) for s in reg.STATUS_EM_ACOMPANHAMENTO),
            "vinculadas": sum(1 for x in atuais if x["proposta"]),
            "sem_proposta": sum(1 for x in atuais if not x["proposta"]),
            "com_divergencia": sum(1 for x in atuais if x["divergencias"]),
            "por_status": por_status,
        },
        "contas": atuais,
        "contas_fora_do_painel": [x for x in linhas if not x["presente_ultima_coleta"]],
        "propostas_pagas_sem_conta_no_painel": sem_conta,
        "ultima_coleta": None if not ultima_ok else {
            "coletado_em": ultima_ok.coletado_em.isoformat(), "origem": ultima_ok.origem,
            "usuario": ultima_ok.usuario, "filtros": ultima_ok.filtros,
            "atualizacao_bb": ultima_ok.atualizacao_bb.isoformat() if ultima_ok.atualizacao_bb else None,
            "atualizacao_cef": ultima_ok.atualizacao_cef.isoformat() if ultima_ok.atualizacao_cef else None},
        "ultima_falha": None if not falha or (ultima_ok and ultima_ok.coletado_em > falha.coletado_em) else {
            "coletado_em": falha.coletado_em.isoformat(), "erro": falha.erro},
    }


@router.post("/sincronizar")
async def sincronizar_agora(db: DbDep, user: UserDep):
    """Lê agora o painel público do FNS (sem login) para o município da sessão."""
    _pode_sincronizar(user)
    mid = _municipio_id(user)
    try:
        return await sincronizar(db, mid, "qlik_engine", user.nome)
    except reg.ColetaRegularizacaoErro as exc:
        raise HTTPException(502, f"Painel do FNS: {exc}")
    except Exception as exc:
        logger.warning("Regularização contas: falha na coleta: %s", exc)
        raise HTTPException(502, "Painel do FNS indisponível agora. Tente novamente em alguns minutos.")


@router.post("/ingest")
async def ingest(db: DbDep, user: UserDep, payload: dict = Body(...)):
    """Recebe o JSON de um agente externo (contrato em docs/AGENTE_REGULARIZACAO_CONTAS.md).
    Só aceita contas do município da sessão: uma linha de outro município rejeita o lote inteiro."""
    _pode_sincronizar(user)
    mid = _municipio_id(user)
    fundo = await _dados_fundo(db, mid)
    try:
        contas = reg.validar_payload(payload, fundo["uf"], fundo["nome"])
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    meta = dict(payload.get("metadata") or {}) if isinstance(payload.get("metadata"), dict) else {}
    meta["filtros_aplicados"] = {"uf": fundo["uf"].upper(), "municipio": reg.nome_qlik(fundo["nome"]),
                                 "esfera": "MUNICIPAL"}
    return await aplicar_coleta(db, mid, {"metadata": meta, "contas": contas}, "agente_externo", user.nome)
