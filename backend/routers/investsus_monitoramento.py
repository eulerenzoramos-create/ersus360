"""
InvestSUS — Monitoramento de Execução da Proposta.

Os dados oficiais são lidos pelo navegador do próprio usuário logado no InvestSUS (gov.br não
permite login pelo servidor) e enviados a /sincronizar. A equipe pode preparar o preenchimento
no ERSUS360 (mesmas regras do formulário oficial) e marcar quando lançou no InvestSUS; o
ERSUS360 não grava nada no InvestSUS.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Body, HTTPException, Query
from sqlalchemy import select

from models.investsus import (
    AlertaInvestSUS, MonitoramentoColetaInvestSUS, MonitoramentoInvestSUS, MonitoramentoRegistroInvestSUS,
    PropostaInvestSUS,
)
from routers.investsus import (
    DbDep, UserDep, _filtro_escopo, _filtro_visivel, _modalidade_de, _municipio_id, _pode_sincronizar,
    _registrar_alertas,
)
from services import investsus_monitoramento as mon

router = APIRouter(prefix="/api/investsus/monitoramento", tags=["InvestSUS"])

TIPO_ALERTA = "monitoramento_desatualizado"
_CAMPOS_FORM = ("execucao_iniciada", "status_execucao", "percentual_execucao", "data_provavel_finalizacao")


PERFIS_PREENCHIMENTO = {"administrador_geral", "superadmin", "admin", "gestor", "financeiro", "contabilidade",
                        "planejamento"}


def _pode_preencher(user) -> None:
    """Quem lança a execução (financeiro/contabilidade/planejamento), gestor e administradores."""
    if not user.administrador_geral and user.role not in PERFIS_PREENCHIMENTO:
        raise HTTPException(403, "Seu perfil não permite preparar o monitoramento.")


def _reg_dict(r: MonitoramentoRegistroInvestSUS) -> dict:
    return {
        "id": r.id, "monitoramento_id": r.monitoramento_id, "origem": r.origem,
        "execucao_iniciada": r.execucao_iniciada, "status_execucao": r.status_execucao,
        "percentual_execucao": r.percentual_execucao,
        "data_provavel_finalizacao": r.data_provavel_finalizacao.isoformat() if r.data_provavel_finalizacao else None,
        "descricao": mon.descrever(r.execucao_iniciada, r.status_execucao, r.percentual_execucao,
                                   r.data_provavel_finalizacao),
        "observacao": r.observacao, "usuario": r.usuario,
        "criado_em": r.criado_em.isoformat() if r.criado_em else None,
        "lancado_no_investsus": r.lancado_no_investsus,
        "lancado_em": r.lancado_em.isoformat() if r.lancado_em else None, "lancado_por": r.lancado_por,
    }


def _item_dict(m: MonitoramentoInvestSUS, prop: PropostaInvestSUS | None, pendente_ersus: dict | None,
               agora: datetime) -> dict:
    status = mon.status_monitoramento(m.st_atualizacao, m.status_execucao_lista, m.dt_operacao, agora)
    return {
        "id": m.id, "numero_proposta": m.numero_proposta, "co_proposta": m.co_proposta, "exercicio": m.exercicio,
        "tipo_recurso": m.tipo_recurso, "tipo_proposta": m.tipo_proposta, "situacao": m.situacao,
        "instrumento": m.instrumento, "valor": m.valor,
        "status": status, "status_rotulo": mon.ROTULO_STATUS[status],
        "st_atualizacao": m.st_atualizacao,
        "dt_operacao": m.dt_operacao.isoformat() if m.dt_operacao else None,
        **mon.prazos(status, m.dt_operacao, m.data_provavel_finalizacao, m.status_execucao, agora),
        "execucao_iniciada": m.execucao_iniciada, "status_execucao": m.status_execucao,
        "percentual_execucao": m.percentual_execucao,
        "data_provavel_finalizacao": m.data_provavel_finalizacao.isoformat() if m.data_provavel_finalizacao else None,
        "descricao": mon.descrever(m.execucao_iniciada, m.status_execucao, m.percentual_execucao,
                                   m.data_provavel_finalizacao),
        "presente_ultima_coleta": m.presente_ultima_coleta,
        "atualizado_em": m.atualizado_em.isoformat() if m.atualizado_em else None,
        "link_investsus": f"{mon.URL_TELA}?proposta={m.numero_proposta}",
        "proposta": None if prop is None else {
            "id": prop.id, "modalidade": _modalidade_de(prop), "objeto": (prop.objeto or "")[:200] or None,
            "parlamentar": None, "valor_pago": prop.valor_pago, "perc_financeiro": prop.perc_financeiro,
        },
        "preenchimento_ersus_pendente": pendente_ersus,
    }


async def aplicar_coleta(db, mid: int, payload: dict, usuario: str | None, agora: datetime | None = None) -> dict:
    agora = agora or datetime.utcnow()
    itens = payload.get("itens")
    if not isinstance(itens, list):
        raise HTTPException(422, "Envie 'itens': lista de {item, monitoramento}.")
    anos = sorted({int(a) for a in (payload.get("anos") or []) if str(a).isdigit()})

    props = (await db.execute(select(PropostaInvestSUS).where(PropostaInvestSUS.municipio_id == mid))).scalars().all()
    por_numero = {mon.so_digitos(p.numero_proposta): p for p in props if p.numero_proposta}
    existentes = {m.numero_proposta: m for m in (await db.execute(select(MonitoramentoInvestSUS).where(
        MonitoramentoInvestSUS.municipio_id == mid))).scalars().all()}

    vistos: set[str] = set()
    novos = alterados = alertas = encerrados = 0
    for bruto in itens:
        if not isinstance(bruto, dict):
            continue
        n = mon.normalizar_item(bruto.get("item") or {})
        if not n or n["numero_proposta"] in vistos:
            continue
        vistos.add(n["numero_proposta"])
        form = mon.normalizar_monitoramento(bruto.get("monitoramento"))
        m = existentes.get(n["numero_proposta"])
        antes = None if m is None else tuple(getattr(m, c) for c in _CAMPOS_FORM)
        if m is None:
            m = MonitoramentoInvestSUS(municipio_id=mid, numero_proposta=n["numero_proposta"], primeira_coleta_em=agora)
            db.add(m)
            existentes[n["numero_proposta"]] = m
            novos += 1
        for k, v in n.items():
            setattr(m, k, v)
        if bruto.get("monitoramento") is not None:  # projeto sem resposta não apaga o que já havia
            for k, v in form.items():
                setattr(m, k, v)
            m.payload_monitoramento = bruto.get("monitoramento") if isinstance(bruto.get("monitoramento"), dict) else None
        m.payload_lista = bruto.get("item")
        prop = por_numero.get(n["numero_proposta"])
        m.proposta_id = prop.id if prop else None
        m.presente_ultima_coleta = True
        m.atualizado_em = agora
        depois = tuple(getattr(m, c) for c in _CAMPOS_FORM)
        await db.flush()
        if depois != antes and any(v is not None for v in depois):
            alterados += 1
            db.add(MonitoramentoRegistroInvestSUS(
                municipio_id=mid, monitoramento_id=m.id, origem="investsus", usuario=usuario, criado_em=agora,
                lancado_no_investsus=True, lancado_em=m.dt_operacao or agora,
                **dict(zip(_CAMPOS_FORM, depois))))
            # Preenchimentos do ERSUS iguais ao oficial passam a contar como lançados.
            pend = (await db.execute(select(MonitoramentoRegistroInvestSUS).where(
                MonitoramentoRegistroInvestSUS.monitoramento_id == m.id,
                MonitoramentoRegistroInvestSUS.origem == "ersus",
                MonitoramentoRegistroInvestSUS.lancado_no_investsus == False))).scalars().all()  # noqa: E712
            for r in pend:
                if tuple(getattr(r, c) for c in _CAMPOS_FORM) == depois:
                    r.lancado_no_investsus, r.lancado_em, r.lancado_por = True, agora, "Conferido no InvestSUS"

        status = mon.status_monitoramento(m.st_atualizacao, m.status_execucao_lista, m.dt_operacao, agora)
        if prop is not None:
            if status == mon.DESATUALIZADA:
                alertas += await _registrar_alertas(db, prop, mid, [{
                    "tipo_alerta": TIPO_ALERTA, "nivel": "atencao",
                    "titulo": f"Monitoramento de Execução desatualizado — proposta {m.numero_proposta}",
                    "descricao": ("O InvestSUS marca esta proposta paga como sem atualização do monitoramento "
                                  "há mais de 30 dias (ou nunca preenchido)."),
                    "providencia": ("Preencher o Monitoramento de Execução no InvestSUS (Início → Monitoramento "
                                    "de Execução → lápis da proposta) e sincronizar o ERSUS360."),
                }])
            else:
                for al in (await db.execute(select(AlertaInvestSUS).where(
                        AlertaInvestSUS.proposta_id == prop.id, AlertaInvestSUS.tipo_alerta == TIPO_ALERTA,
                        AlertaInvestSUS.resolvido == False))).scalars().all():  # noqa: E712
                    al.resolvido, al.resolvido_em = True, agora
                    al.resolvido_por = f"InvestSUS ({mon.ROTULO_STATUS[status].lower()})"
                    encerrados += 1

    # Some da lista só nos anos efetivamente consultados.
    for num, m in existentes.items():
        if num not in vistos and (not anos or (m.exercicio in anos)):
            m.presente_ultima_coleta = False

    resumo = {s: 0 for s in mon.ROTULO_STATUS}
    for num in vistos:
        m = existentes[num]
        resumo[mon.status_monitoramento(m.st_atualizacao, m.status_execucao_lista, m.dt_operacao, agora)] += 1
    resumo["total"] = len(vistos)
    db.add(MonitoramentoColetaInvestSUS(
        municipio_id=mid, coletado_em=agora, usuario=usuario, anos=anos,
        resumo_oficial=payload.get("resumos") if isinstance(payload.get("resumos"), dict) else None, resumo=resumo))
    await db.commit()
    return {"ok": True, "lidas": len(vistos), "novas": novos, "alteradas": alterados,
            "alertas": alertas, "alertas_encerrados": encerrados, "resumo": resumo}


@router.post("/sincronizar")
async def sincronizar(db: DbDep, user: UserDep, payload: dict = Body(...)):
    """Recebe o que o navegador do usuário leu do Monitoramento do InvestSUS."""
    _pode_sincronizar(user)
    return await aplicar_coleta(db, _municipio_id(user), payload, user.nome)


@router.get("")
async def listar(db: DbDep, user: UserDep, ano: int | None = Query(None), numero: str | None = Query(None)):
    mid = _municipio_id(user)
    agora = datetime.utcnow()
    q = select(MonitoramentoInvestSUS).where(MonitoramentoInvestSUS.municipio_id == mid,
                                             MonitoramentoInvestSUS.presente_ultima_coleta == True)  # noqa: E712
    if ano:
        q = q.where(MonitoramentoInvestSUS.exercicio == ano)
    linhas = (await db.execute(q)).scalars().all()
    if numero and mon.so_digitos(numero):
        linhas = [m for m in linhas if mon.so_digitos(numero) in m.numero_proposta]

    props = {p.id: p for p in (await db.execute(select(PropostaInvestSUS).where(
        PropostaInvestSUS.municipio_id == mid))).scalars().all()}
    pend = {}
    for r in (await db.execute(select(MonitoramentoRegistroInvestSUS).where(
            MonitoramentoRegistroInvestSUS.municipio_id == mid, MonitoramentoRegistroInvestSUS.origem == "ersus",
            MonitoramentoRegistroInvestSUS.lancado_no_investsus == False).order_by(  # noqa: E712
            MonitoramentoRegistroInvestSUS.criado_em))).scalars().all():
        pend[r.monitoramento_id] = _reg_dict(r)  # fica o mais recente
    itens = [_item_dict(m, props.get(m.proposta_id), pend.get(m.id), agora) for m in linhas]
    ordem = {mon.DESATUALIZADA: 0, mon.ATUALIZADA: 1, mon.FINALIZADA: 2}
    itens.sort(key=lambda x: (ordem[x["status"]], x["vence_em_dias"] if x["vence_em_dias"] is not None else 999,
                              x["numero_proposta"]))

    por_status = {s: {"quantidade": 0, "valor": 0.0} for s in mon.ROTULO_STATUS}
    for x in itens:
        por_status[x["status"]]["quantidade"] += 1
        por_status[x["status"]]["valor"] += x["valor"] or 0

    # Propostas pagas no ERSUS360 que não aparecem no Monitoramento do InvestSUS.
    coletas = (await db.execute(select(MonitoramentoColetaInvestSUS).where(
        MonitoramentoColetaInvestSUS.municipio_id == mid).order_by(
        MonitoramentoColetaInvestSUS.coletado_em.desc()).limit(1))).scalars().all()
    ultima = coletas[0] if coletas else None
    sem_monitoramento = []
    if ultima:
        no_monit = {m.numero_proposta for m in (await db.execute(select(MonitoramentoInvestSUS).where(
            MonitoramentoInvestSUS.municipio_id == mid,
            MonitoramentoInvestSUS.presente_ultima_coleta == True))).scalars().all()}  # noqa: E712
        visiveis = (await db.execute(select(PropostaInvestSUS).where(
            PropostaInvestSUS.municipio_id == mid, _filtro_escopo(), _filtro_visivel()))).scalars().all()
        for p in visiveis:
            if (p.valor_pago or 0) <= 0 or (p.exercicio or 0) < mon.ANO_INICIAL:
                continue
            if ano and p.exercicio != ano:
                continue
            if mon.so_digitos(p.numero_proposta) in no_monit:
                continue
            sem_monitoramento.append({
                "id": p.id, "numero_proposta": p.numero_proposta, "exercicio": p.exercicio,
                "modalidade": _modalidade_de(p), "valor_pago": p.valor_pago,
                "situacao_original": p.situacao_original})

    return {
        "url_tela": mon.URL_TELA,
        "regras": {"dias_validade": mon.DIAS_VALIDADE, "dias_aviso": mon.DIAS_AVISO_VENCER,
                   "ano_inicial": mon.ANO_INICIAL},
        "resumo": {
            "total": len(itens), "valor_total": sum(x["valor"] or 0 for x in itens),
            "por_status": por_status,
            "a_vencer": sum(1 for x in itens if x["a_vencer"]),
            "data_provavel_vencida": sum(1 for x in itens if x["data_provavel_vencida"]),
            "nao_iniciadas": sum(1 for x in itens if x["execucao_iniciada"] == "N"),
            "sem_formulario": sum(1 for x in itens if not x["execucao_iniciada"]),
            "preenchimentos_nao_lancados": sum(1 for x in itens if x["preenchimento_ersus_pendente"]),
            "pagas_sem_monitoramento": len(sem_monitoramento),
            "percentual_medio": (round(sum(x["percentual_execucao"] or 0 for x in itens if x["execucao_iniciada"] == "S")
                                       / max(1, sum(1 for x in itens if x["execucao_iniciada"] == "S")), 1)
                                 if any(x["execucao_iniciada"] == "S" for x in itens) else None),
        },
        "itens": itens,
        "pagas_sem_monitoramento": sem_monitoramento,
        "ultima_coleta": None if not ultima else {
            "coletado_em": ultima.coletado_em.isoformat(), "usuario": ultima.usuario, "anos": ultima.anos,
            "resumo": ultima.resumo, "resumo_oficial": ultima.resumo_oficial},
    }


@router.get("/historico")
async def historico(db: DbDep, user: UserDep, ano: int | None = Query(None), limite: int = Query(300, le=2000)):
    mid = _municipio_id(user)
    monits = {m.id: m for m in (await db.execute(select(MonitoramentoInvestSUS).where(
        MonitoramentoInvestSUS.municipio_id == mid))).scalars().all()}
    regs = (await db.execute(select(MonitoramentoRegistroInvestSUS).where(
        MonitoramentoRegistroInvestSUS.municipio_id == mid).order_by(
        MonitoramentoRegistroInvestSUS.criado_em.desc()).limit(limite))).scalars().all()
    saida = []
    for r in regs:
        m = monits.get(r.monitoramento_id)
        if ano and (not m or m.exercicio != ano):
            continue
        saida.append({**_reg_dict(r), "numero_proposta": m.numero_proposta if m else None,
                      "exercicio": m.exercicio if m else None, "tipo_proposta": m.tipo_proposta if m else None})
    coletas = (await db.execute(select(MonitoramentoColetaInvestSUS).where(
        MonitoramentoColetaInvestSUS.municipio_id == mid).order_by(
        MonitoramentoColetaInvestSUS.coletado_em.desc()).limit(20))).scalars().all()
    return {"registros": saida, "coletas": [
        {"coletado_em": c.coletado_em.isoformat(), "usuario": c.usuario, "anos": c.anos, "resumo": c.resumo}
        for c in coletas]}


async def _monitoramento_do_municipio(db, mid: int, mon_id: int) -> MonitoramentoInvestSUS:
    m = (await db.execute(select(MonitoramentoInvestSUS).where(
        MonitoramentoInvestSUS.id == mon_id, MonitoramentoInvestSUS.municipio_id == mid))).scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Monitoramento não encontrado")
    return m


@router.get("/{mon_id}")
async def detalhe(mon_id: int, db: DbDep, user: UserDep):
    mid = _municipio_id(user)
    m = await _monitoramento_do_municipio(db, mid, mon_id)
    prop = (await db.execute(select(PropostaInvestSUS).where(PropostaInvestSUS.id == m.proposta_id))).scalar_one_or_none() \
        if m.proposta_id else None
    regs = (await db.execute(select(MonitoramentoRegistroInvestSUS).where(
        MonitoramentoRegistroInvestSUS.monitoramento_id == m.id).order_by(
        MonitoramentoRegistroInvestSUS.criado_em.desc()))).scalars().all()
    pend = next((_reg_dict(r) for r in regs if r.origem == "ersus" and not r.lancado_no_investsus), None)
    return {**_item_dict(m, prop, pend, datetime.utcnow()), "registros": [_reg_dict(r) for r in regs]}


@router.post("/{mon_id}/registros")
async def preencher(mon_id: int, db: DbDep, user: UserDep, payload: dict = Body(...)):
    """Preenchimento feito no ERSUS360, com as mesmas regras do formulário do InvestSUS.
    Fica como 'a lançar no InvestSUS' até a equipe marcar como lançado (ou a sincronização conferir)."""
    _pode_preencher(user)
    mid = _municipio_id(user)
    m = await _monitoramento_do_municipio(db, mid, mon_id)
    try:
        v = mon.validar_registro(payload)
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    r = MonitoramentoRegistroInvestSUS(municipio_id=mid, monitoramento_id=m.id, origem="ersus",
                                       usuario=user.nome, criado_em=datetime.utcnow(), **v)
    db.add(r)
    await db.commit()
    await db.refresh(r)
    return _reg_dict(r)


@router.post("/registros/{reg_id}/lancado")
async def marcar_lancado(reg_id: int, db: DbDep, user: UserDep):
    _pode_preencher(user)
    mid = _municipio_id(user)
    r = (await db.execute(select(MonitoramentoRegistroInvestSUS).where(
        MonitoramentoRegistroInvestSUS.id == reg_id, MonitoramentoRegistroInvestSUS.municipio_id == mid,
        MonitoramentoRegistroInvestSUS.origem == "ersus"))).scalar_one_or_none()
    if not r:
        raise HTTPException(404, "Preenchimento não encontrado")
    r.lancado_no_investsus, r.lancado_em, r.lancado_por = True, datetime.utcnow(), user.nome
    await db.commit()
    return _reg_dict(r)


async def sincronizar_pelo_servidor(mid: int, cred: dict[str, str]) -> dict:
    """Usado pelo job agendado: lê o Monitoramento com o acesso de integração do município."""
    from database import AsyncSessionLocal
    from routers.investsus import _dados_fundo
    async with AsyncSessionLocal() as db:
        fundo = await _dados_fundo(db, mid)
    payload = await mon.coletar_servidor(fundo["cnpj"], fundo["ibge"], cred)
    async with AsyncSessionLocal() as db:
        return await aplicar_coleta(db, mid, payload, "Automático (servidor)")
