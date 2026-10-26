"""
Router: /api/pec-agente — PEC_SYNC_AGENT (e-SUS APS/PEC → ERSUS360), multi-município.

Arquitetura: e-SUS PEC (banco local) → agente local SOMENTE LEITURA (pec_sync_agent/)
→ HTTPS → este router → banco do ERSUS360 (segregado por municipio_id) → Painel ACS.

Autenticação do agente: cabeçalho X-Sync-Key = chave do PRÓPRIO município, lida só de
variável de ambiente via tenancy.credenciais (sistema "PEC_AGENTE"):
    ERSUS_SYNC_KEY_{IBGE7}          (ERSUS_SYNC_KEY sem sufixo = Apuí, legado)
O município vem do campo `ibge` do envio e precisa estar ativo/em implantação; chave de
um município nunca vale para outro.

Contrato AGREGADO (LGPD — minimização): nenhum nome/CPF/CNS/endereço/dado clínico de
cidadão. Campos extras são RECUSADOS (extra="forbid") para que nada além do contrato
entre por engano. O nome do ACS é dado funcional do profissional (Lista de ACS); a
identificação técnica do ACS é um hash (`chave`), nunca CPF/CNS.
"""
from __future__ import annotations

import hashlib
import json
import logging
import asyncio
import re
import secrets
from datetime import date, datetime, timedelta, timezone
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.municipio import Municipio
from models.pec_agente import PecAcsLote, PecAgenteExecucao, PecEsquemaRelatorio, PecInconsistenciaLote
from routers.auth import ip_de
from routers.fns_previsao import _pode_editar
from services.pec_acs import ORIGEM_AUTOMATICA, ORIGEM_CAPTURA
from services.pec_captura import ConflitoComLoteDoAgente, gravar_lote_territorio
from tenancy.auditoria import registrar_auditoria
from tenancy.contexto import MunicipioContexto
from tenancy.credenciais import credencial
from tenancy.escopo import SessaoMunicipal

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/pec-agente", tags=["PEC_SYNC_AGENT"])

DbDep = Annotated[AsyncSession, Depends(get_db)]

# O agente roda a cada 4 h (pec_sync_agent). Acima de 2 ciclos sem envio = desatualizado.
FREQUENCIA_HORAS = 4
LIMITE_DESATUALIZADO = timedelta(hours=FREQUENCIA_HORAS * 2)
SITUACOES_ACEITAS = {"ativo", "implantacao"}

_RE_COMP = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
_RE_DATA = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_RE_CHAVE = re.compile(r"^[0-9a-f]{16,64}$")


# ── Contrato ──────────────────────────────────────────────────────────────────

class _Base(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Equipe(_Base):
    ine: str = Field(min_length=1, max_length=15)
    nome: Optional[str] = Field(None, max_length=200)
    tipo: Optional[str] = Field(None, max_length=30)
    cnes: Optional[str] = Field(None, max_length=10)
    unidade: Optional[str] = Field(None, max_length=200)


class Acs(_Base):
    chave: str = Field(description="hash do identificador do profissional — nunca CPF/CNS")
    nome: Optional[str] = Field(None, max_length=200)
    cbo: Optional[str] = Field(None, max_length=10)
    ine: Optional[str] = Field(None, max_length=15)
    microareas: list[str] = Field(default_factory=list, max_length=50)
    ativo: bool = True

    @field_validator("chave")
    @classmethod
    def _chave_hash(cls, v: str) -> str:
        if not _RE_CHAVE.match(v):
            raise ValueError("chave do ACS deve ser um hash hexadecimal (nunca CPF/CNS)")
        return v


class Microarea(_Base):
    codigo: str = Field(min_length=1, max_length=10)
    ine: Optional[str] = Field(None, max_length=15)
    acs_chave: Optional[str] = None
    domicilios: Optional[int] = Field(None, ge=0)
    familias: Optional[int] = Field(None, ge=0)
    individuos: Optional[int] = Field(None, ge=0)
    familias_visitadas: Optional[int] = Field(None, ge=0)


class VisitaDia(_Base):
    data: str
    acs_chave: Optional[str] = None
    ine: Optional[str] = Field(None, max_length=15)
    microarea: Optional[str] = Field(None, max_length=10)
    total: int = Field(ge=0)
    realizadas: Optional[int] = Field(None, ge=0)
    recusadas: Optional[int] = Field(None, ge=0)
    ausentes: Optional[int] = Field(None, ge=0)

    @field_validator("data")
    @classmethod
    def _data(cls, v: str) -> str:
        if not _RE_DATA.match(v):
            raise ValueError("data no formato AAAA-MM-DD")
        return v


class Grupos(_Base):
    ine: Optional[str] = Field(None, max_length=15)
    microarea: Optional[str] = Field(None, max_length=10)
    gestantes: Optional[int] = Field(None, ge=0)
    criancas_menor_2: Optional[int] = Field(None, ge=0)
    hipertensos: Optional[int] = Field(None, ge=0)
    diabeticos: Optional[int] = Field(None, ge=0)
    idosos: Optional[int] = Field(None, ge=0)
    acamados: Optional[int] = Field(None, ge=0)
    domiciliados: Optional[int] = Field(None, ge=0)


class Totais(_Base):
    cadastros_individuais: Optional[int] = Field(None, ge=0)
    cadastros_domiciliares: Optional[int] = Field(None, ge=0)
    familias: Optional[int] = Field(None, ge=0)


class Periodo(_Base):
    inicio: str
    fim: str


class LoteAcsIn(_Base):
    ibge: str
    competencia: str
    gerado_em: datetime
    agente_versao: str = Field(max_length=30)
    pec_versao: Optional[str] = Field(None, max_length=30)
    periodo: Periodo
    equipes: list[Equipe] = Field(default_factory=list, max_length=500)
    acs: list[Acs] = Field(default_factory=list, max_length=2000)
    microareas: list[Microarea] = Field(default_factory=list, max_length=5000)
    visitas: list[VisitaDia] = Field(default_factory=list, max_length=100_000)
    grupos: list[Grupos] = Field(default_factory=list, max_length=5000)
    totais: Totais = Field(default_factory=Totais)
    criterios: dict[str, str] = Field(default_factory=dict)

    @field_validator("competencia")
    @classmethod
    def _comp(cls, v: str) -> str:
        if not _RE_COMP.match(v):
            raise ValueError("competencia no formato AAAA-MM")
        return v


class ColunaEsquema(_Base):
    nome: str = Field(max_length=100)
    tipo: Optional[str] = Field(None, max_length=60)
    select: Optional[bool] = None   # o usuário somente-leitura pode ler esta coluna?


class TabelaEsquema(_Base):
    colunas: list[ColunaEsquema] = Field(default_factory=list, max_length=400)
    select_permitido: Optional[bool] = None


class EsquemaIn(_Base):
    ibge: str
    agente_versao: str = Field(max_length=30)
    pec_versao: Optional[str] = Field(None, max_length=30)
    tabelas: dict[str, TabelaEsquema] = Field(default_factory=dict, max_length=300)


class HeartbeatIn(_Base):
    ibge: str
    agente_versao: str = Field(max_length=30)
    pec_versao: Optional[str] = Field(None, max_length=30)
    banco_pec_ok: bool
    erro: Optional[str] = Field(None, max_length=500)


class MicroareaCaptura(_Base):
    codigo: str = Field(min_length=1, max_length=12, description='número da microárea; "FORA" = imóveis fora de área')
    imoveis: int = Field(ge=0, le=200_000)
    cadastro_completo: Optional[int] = Field(None, ge=0)
    cadastro_atualizado: Optional[int] = Field(None, ge=0)
    domicilios_visitados: Optional[int] = Field(None, ge=0)
    domicilios_a_visitar: Optional[int] = Field(None, ge=0)

    @model_validator(mode="after")
    def _coerente(self):
        for campo in ("cadastro_completo", "cadastro_atualizado"):
            v = getattr(self, campo)
            if v is not None and v > self.imoveis:
                raise ValueError(f"{campo} maior que o total de imóveis da microárea {self.codigo}")
        if (self.domicilios_visitados is not None and self.domicilios_a_visitar is not None
                and self.domicilios_visitados > self.domicilios_a_visitar):
            raise ValueError(f"domicílios visitados maior que os a visitar na microárea {self.codigo}")
        return self


class EquipeCaptura(_Base):
    ine: str = Field(min_length=1, max_length=15)
    nome: str = Field(min_length=1, max_length=200)
    tipo: Optional[str] = Field(None, max_length=30)
    cnes: Optional[str] = Field(None, max_length=10)
    unidade: Optional[str] = Field(None, max_length=200)
    microareas: list[MicroareaCaptura] = Field(default_factory=list, max_length=100)


class CapturaTerritorioIn(_Base):
    """Captura assistida da tela "Acompanhamento do território" do PEC (só contadores; nenhum dado de cidadão)."""
    formato: Literal["ersus360-pec-territorio-v1"]
    ibge: str
    origem: Literal["captura_assistida_pec_web"]
    fonte: Optional[str] = Field(None, max_length=300)
    capturado_em: datetime
    mes_referencia: str
    equipes: list[EquipeCaptura] = Field(min_length=1, max_length=200)

    @field_validator("mes_referencia")
    @classmethod
    def _comp(cls, v: str) -> str:
        if not _RE_COMP.match(v):
            raise ValueError("mes_referencia no formato AAAA-MM")
        return v


# ── Autenticação do agente ────────────────────────────────────────────────────

async def _municipio_do_agente(db: AsyncSession, ibge: str, chave: str, request: Request,
                               tipo: str, agente_versao: str | None) -> Municipio:
    ibge = (ibge or "").strip()
    m = (await db.execute(select(Municipio).where(Municipio.codigo_ibge == ibge))).scalar_one_or_none()
    if not m or (m.situacao or "") not in SITUACOES_ACEITAS:
        raise HTTPException(404, "Município não habilitado no ERSUS360.")
    ctx = MunicipioContexto(id=m.id, uuid=m.uuid, ibge=m.codigo_ibge, nome=m.nome, uf=m.uf)
    esperado = credencial("PEC_AGENTE", "SYNC_KEY", ctx)
    if not esperado:
        raise HTTPException(503, f"Chave do agente não configurada (ERSUS_SYNC_KEY_{m.codigo_ibge}).")
    if not secrets.compare_digest((chave or "").encode("utf-8"), esperado.encode("utf-8")):
        db.add(PecAgenteExecucao(municipio_id=m.id, tipo=tipo, status="rejeitado",
                                 mensagem="Chave de sincronização inválida.", agente_versao=agente_versao,
                                 ip_origem=ip_de(request)))
        await db.commit()
        raise HTTPException(401, "Chave de sincronização inválida.")
    return m


def _hash(payload: dict) -> str:
    sem_data = {k: v for k, v in payload.items() if k != "gerado_em"}
    return hashlib.sha256(json.dumps(sem_data, sort_keys=True, ensure_ascii=False, default=str).encode()).hexdigest()


# ── Endpoints do agente (autenticados pela X-Sync-Key) ────────────────────────

@router.post("/acs")
async def receber_lote_acs(body: LoteAcsIn, request: Request, db: DbDep,
                           x_sync_key: str = Header(..., alias="X-Sync-Key")):
    m = await _municipio_do_agente(db, body.ibge, x_sync_key, request, "acs", body.agente_versao)
    payload = body.model_dump(mode="json")
    h = _hash(payload)
    registros = len(body.acs) + len(body.microareas) + len(body.visitas) + len(body.grupos)

    lote = (await db.execute(select(PecAcsLote).where(
        PecAcsLote.municipio_id == m.id, PecAcsLote.competencia == body.competencia))).scalar_one_or_none()
    status = "aceito"
    if lote and lote.hash_conteudo == h:
        status = "sem_alteracao"
        lote.recebido_em = datetime.utcnow()
        lote.gerado_em = body.gerado_em.replace(tzinfo=None)
    else:
        if not lote:
            lote = PecAcsLote(municipio_id=m.id, competencia=body.competencia)
            db.add(lote)
        lote.recebido_em = datetime.utcnow()
        lote.gerado_em = body.gerado_em.replace(tzinfo=None)
        lote.periodo_inicio, lote.periodo_fim = body.periodo.inicio, body.periodo.fim
        lote.agente_versao, lote.pec_versao = body.agente_versao, body.pec_versao
        lote.hash_conteudo = h
        lote.payload = payload
    db.add(PecAgenteExecucao(municipio_id=m.id, tipo="acs", status=status, competencia=body.competencia,
                             registros=registros, agente_versao=body.agente_versao, pec_versao=body.pec_versao,
                             ip_origem=ip_de(request),
                             mensagem=f"{len(body.acs)} ACS · {len(body.microareas)} microáreas · "
                                      f"{len(body.visitas)} linhas de visita · {len(body.grupos)} linhas de grupos"))
    await db.commit()
    log.info("PEC_SYNC_AGENT %s: lote ACS %s %s (%d registros)", m.codigo_ibge, body.competencia, status, registros)
    return {"ok": True, "status": status, "competencia": body.competencia, "registros": registros}


@router.post("/esquema")
async def receber_esquema(body: EsquemaIn, request: Request, db: DbDep,
                          x_sync_key: str = Header(..., alias="X-Sync-Key")):
    m = await _municipio_do_agente(db, body.ibge, x_sync_key, request, "esquema", body.agente_versao)
    db.add(PecEsquemaRelatorio(municipio_id=m.id, pec_versao=body.pec_versao,
                               agente_versao=body.agente_versao, payload=body.model_dump(mode="json")))
    sem_select = sorted(t for t, d in body.tabelas.items() if d.select_permitido is False)
    db.add(PecAgenteExecucao(municipio_id=m.id, tipo="esquema", status="aceito", registros=len(body.tabelas),
                             agente_versao=body.agente_versao, pec_versao=body.pec_versao, ip_origem=ip_de(request),
                             mensagem=f"{len(body.tabelas)} tabelas descritas"
                                      + (f"; sem permissão de leitura: {', '.join(sem_select)}" if sem_select else "")))
    await db.commit()
    return {"ok": True, "tabelas": len(body.tabelas), "sem_permissao": sem_select}


@router.post("/heartbeat")
async def receber_heartbeat(body: HeartbeatIn, request: Request, db: DbDep,
                            x_sync_key: str = Header(..., alias="X-Sync-Key")):
    m = await _municipio_do_agente(db, body.ibge, x_sync_key, request, "heartbeat", body.agente_versao)
    db.add(PecAgenteExecucao(municipio_id=m.id, tipo="heartbeat",
                             status="aceito" if body.banco_pec_ok else "erro_origem",
                             agente_versao=body.agente_versao, pec_versao=body.pec_versao, ip_origem=ip_de(request),
                             mensagem=None if body.banco_pec_ok else (body.erro or "Agente sem acesso ao banco do PEC")))
    await db.commit()
    return {"ok": True}


# ── Captura assistida (sessão do município, perfil de edição) ─────────────────

@router.post("/captura-territorio")
async def importar_captura_territorio(body: CapturaTerritorioIn, request: Request, current: SessaoMunicipal, db: DbDep):
    """Importa a captura assistida do território do PEC. Vira o lote da competência, marcado com a origem;
    nunca substitui um lote do agente local (que é a fonte oficial de atualização automática)."""
    _pode_editar(current)
    if str(body.ibge) != str(current.municipio_ibge):
        raise HTTPException(403, "Esta captura pertence a outro município.")
    cap_utc = body.capturado_em.astimezone(timezone.utc).replace(tzinfo=None) if body.capturado_em.tzinfo else body.capturado_em
    try:
        return await gravar_lote_territorio(
            db, current.municipio_id, competencia=body.mes_referencia, capturado_em=cap_utc,
            equipes=[e.model_dump() for e in body.equipes], fonte=body.fonte, autor=current.username,
            origem=ORIGEM_CAPTURA, ip=ip_de(request), usuario=current)
    except ConflitoComLoteDoAgente:
        raise HTTPException(409, "Já existe um lote do agente local para esta competência; a captura assistida não o substitui.")


# ── Sincronização automática do território (API web do PEC) ───────────────────

_SYNC_EM_ANDAMENTO: set[int] = set()


def acesso_pec_web(ctx: MunicipioContexto):
    """Credenciais do município (variáveis de ambiente) ou None se a integração não está configurada."""
    from services.pec_territorio_web import Acesso
    url = credencial("ESUS", "PEC_URL", ctx) or credencial("ESUS", "URL", ctx)
    usuario, senha = credencial("ESUS", "USUARIO", ctx), credencial("ESUS", "SENHA", ctx)
    return Acesso(url=url, usuario=usuario, senha=senha) if (url and usuario and senha) else None


def competencia_agora() -> str:
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo("America/Manaus")).strftime("%Y-%m")


async def sincronizar_territorio_municipio(db: AsyncSession, m: Municipio, *, autor: str = "sincronização automática",
                                           ip: str | None = None, automatica: bool = False) -> dict:
    """Lê o território no PEC e grava o lote da competência atual. Falhas viram um item no histórico (sem credenciais).
    Trava de segurança: depois de um LOGIN RECUSADO as execuções automáticas pausam (o PEC bloqueia a conta após
    várias tentativas erradas); só uma atualização sob demanda, feita depois de corrigir a credencial, volta a tentar."""
    from services.pec_captura import registrar_falha_sync
    from services.pec_territorio_web import PecWebErro, coletar_territorio
    ctx = MunicipioContexto(id=m.id, uuid=m.uuid, ibge=m.codigo_ibge, nome=m.nome, uf=m.uf)
    acesso = acesso_pec_web(ctx)
    if not acesso:
        return {"ok": False, "motivo": "nao_configurado"}
    comp = competencia_agora()
    if automatica:
        ultima = (await db.execute(select(PecAgenteExecucao).where(
            PecAgenteExecucao.municipio_id == m.id, PecAgenteExecucao.tipo == "sync_web")
            .order_by(PecAgenteExecucao.recebido_em.desc()).limit(1))).scalar_one_or_none()
        msg_ult = (ultima.mensagem or "") if ultima else ""
        if ultima and ultima.status == "erro_origem" and (
                msg_ult.startswith("Login recusado") or msg_ult.startswith("Login:") and "incorretos" in msg_ult.lower()):
            return {"ok": False, "motivo": "login_recusado_pausado"}
    try:
        equipes = await coletar_territorio(acesso)
        if not equipes:
            raise PecWebErro("O PEC não devolveu equipes com microáreas para esta conta (perfil sem acesso ao território?).")
        return await gravar_lote_territorio(db, m.id, competencia=comp, capturado_em=datetime.utcnow(), equipes=equipes,
                                            fonte="e-SUS PEC — API web (Acompanhamento do território)", autor=autor,
                                            origem=ORIGEM_AUTOMATICA, ip=ip)
    except ConflitoComLoteDoAgente as e:
        return {"ok": False, "motivo": "lote_do_agente", "detalhe": str(e)}
    except PecWebErro as e:
        await registrar_falha_sync(db, m.id, comp, str(e))
        return {"ok": False, "motivo": "falha", "detalhe": str(e)}


async def _sync_em_segundo_plano(municipio_id: int, ip: str | None) -> None:
    from database import AsyncSessionLocal
    try:
        async with AsyncSessionLocal() as db:
            m = (await db.execute(select(Municipio).where(Municipio.id == municipio_id))).scalar_one()
            r = await sincronizar_territorio_municipio(db, m, autor="atualização sob demanda", ip=ip)
            log.info("PEC território %s (sob demanda): %s", m.codigo_ibge, {k: v for k, v in r.items() if k != "detalhe"})
    except Exception as e:
        log.exception("PEC território: erro inesperado na atualização sob demanda")
        try:       # o usuário vê no histórico da aba Capturar PEC (só o tipo do erro, nunca credenciais)
            from database import AsyncSessionLocal
            from services.pec_captura import registrar_falha_sync
            async with AsyncSessionLocal() as db:
                await registrar_falha_sync(db, municipio_id, competencia_agora(), f"Erro interno na sincronização ({type(e).__name__}); veja o log do servidor.")
        except Exception:
            log.exception("PEC território: não foi possível registrar a falha no histórico")
    finally:
        _SYNC_EM_ANDAMENTO.discard(municipio_id)


@router.post("/sincronizar-territorio", status_code=202)
async def sincronizar_territorio(request: Request, current: SessaoMunicipal, db: DbDep):
    """"Atualizar agora": dispara a leitura do território pela API web do PEC. Roda em segundo plano
    (leva dezenas de segundos); o resultado aparece no histórico e na situação."""
    _pode_editar(current)
    m = (await db.execute(select(Municipio).where(Municipio.id == current.municipio_id))).scalar_one()
    ctx = MunicipioContexto(id=m.id, uuid=m.uuid, ibge=m.codigo_ibge, nome=m.nome, uf=m.uf)
    if not acesso_pec_web(ctx):
        raise HTTPException(409, f"Integração não configurada: defina ESUS_PEC_URL, ESUS_USUARIO e ESUS_SENHA no servidor "
                                 f"(para outro município que não Apuí, com o sufixo _{m.codigo_ibge}).")
    if m.id in _SYNC_EM_ANDAMENTO:
        return {"ok": True, "iniciado": False, "mensagem": "Já há uma atualização em andamento."}
    _SYNC_EM_ANDAMENTO.add(m.id)
    asyncio.get_running_loop().create_task(_sync_em_segundo_plano(m.id, ip_de(request)))
    return {"ok": True, "iniciado": True, "mensagem": "Atualização iniciada; acompanhe no histórico de execuções."}


# ── Consulta (sessão do município) ────────────────────────────────────────────

def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat() + "Z" if dt else None


async def lote_mais_recente(db: AsyncSession, municipio_id: int, competencia: str | None = None) -> PecAcsLote | None:
    q = select(PecAcsLote).where(PecAcsLote.municipio_id == municipio_id)
    if competencia:
        q = q.where(PecAcsLote.competencia == competencia)
    return (await db.execute(q.order_by(PecAcsLote.competencia.desc()).limit(1))).scalar_one_or_none()


async def situacao_agente(db: AsyncSession, municipio_id: int, agora: datetime | None = None) -> dict:
    agora = agora or datetime.utcnow()
    ultimas = (await db.execute(select(PecAgenteExecucao).where(
        PecAgenteExecucao.municipio_id == municipio_id).order_by(PecAgenteExecucao.recebido_em.desc()).limit(50))).scalars().all()
    ultima_ok = next((e for e in ultimas if e.tipo == "acs" and e.status in ("aceito", "sem_alteracao")), None)
    ultimo_contato = next((e for e in ultimas if e.status != "rejeitado" and e.tipo not in ("captura", "sync_web")), None)
    captura = next((e for e in ultimas if e.tipo == "captura" and e.status == "aceito"), None)
    sync_web = next((e for e in ultimas if e.tipo == "sync_web"), None)
    erro = next((e for e in ultimas if e.status == "erro_origem"), None)
    lote = await lote_mais_recente(db, municipio_id)

    if not ultimo_contato:
        estado, texto = "sem_agente", "Nenhum envio do agente local recebido ainda."
    elif erro and erro is ultimo_contato:
        estado, texto = "erro", f"O agente não consegue ler o banco do PEC: {erro.mensagem}"
    elif agora - ultimo_contato.recebido_em > LIMITE_DESATUALIZADO:
        estado, texto = "offline", "O agente não se comunica há mais de dois ciclos de atualização."
    elif not ultima_ok:
        estado, texto = "conectado", "Agente conectado; ainda não enviou dados dos ACS."
    elif agora - ultima_ok.recebido_em > LIMITE_DESATUALIZADO:
        estado, texto = "desatualizado", "Os dados dos ACS estão acima do limite de atualização."
    else:
        estado, texto = "atualizado", "Dados dos ACS atualizados pelo agente local."
    return {
        "estado": estado,
        "texto": texto,
        "modo": f"Atualização automática a cada {FREQUENCIA_HORAS} h (agente local, consulta periódica)",
        "frequencia_horas": FREQUENCIA_HORAS,
        "ultimo_contato": _iso(ultimo_contato.recebido_em if ultimo_contato else None),
        "ultima_sincronizacao_acs": _iso(ultima_ok.recebido_em if ultima_ok else None),
        "agente_versao": ultimo_contato.agente_versao if ultimo_contato else None,
        "pec_versao": (lote.pec_versao if lote else None) or (ultimo_contato.pec_versao if ultimo_contato else None),
        "ultimo_lote": None if not lote else {
            "competencia": lote.competencia, "recebido_em": _iso(lote.recebido_em),
            "lido_no_pec_em": _iso(lote.gerado_em), "periodo_inicio": lote.periodo_inicio,
            "periodo_fim": lote.periodo_fim,
        },
        "captura": None if not captura else {
            "recebido_em": _iso(captura.recebido_em), "competencia": captura.competencia, "mensagem": captura.mensagem,
        },
        "sincronizacao_web": {
            "frequencia_horas": FREQUENCIA_HORAS,
            "ultima_execucao": None if not sync_web else {
                "status": sync_web.status, "recebido_em": _iso(sync_web.recebido_em), "mensagem": sync_web.mensagem},
        },
        "rejeicoes_24h": sum(1 for e in ultimas if e.status == "rejeitado"
                             and agora - e.recebido_em < timedelta(hours=24)),
    }


@router.get("/situacao")
async def get_situacao(current: SessaoMunicipal, db: DbDep):
    return await situacao_agente(db, current.municipio_id)


@router.get("/execucoes")
async def get_execucoes(current: SessaoMunicipal, db: DbDep, limite: int = Query(50, ge=1, le=200)):
    rows = (await db.execute(select(PecAgenteExecucao).where(
        PecAgenteExecucao.municipio_id == current.municipio_id)
        .order_by(PecAgenteExecucao.recebido_em.desc()).limit(limite))).scalars().all()
    return {"execucoes": [{
        "id": e.id, "tipo": e.tipo, "status": e.status, "recebido_em": _iso(e.recebido_em),
        "competencia": e.competencia, "registros": e.registros, "rejeitados": e.rejeitados,
        "mensagem": e.mensagem, "agente_versao": e.agente_versao, "pec_versao": e.pec_versao,
    } for e in rows]}


@router.get("/esquema")
async def get_esquema(current: SessaoMunicipal, db: DbDep):
    if not current.administrador_geral and current.role not in ("admin", "gestor"):
        raise HTTPException(403, "Acesso restrito")
    r = (await db.execute(select(PecEsquemaRelatorio).where(
        PecEsquemaRelatorio.municipio_id == current.municipio_id)
        .order_by(PecEsquemaRelatorio.recebido_em.desc()).limit(1))).scalar_one_or_none()
    if not r:
        return {"recebido_em": None, "tabelas": {}}
    return {"recebido_em": _iso(r.recebido_em), "pec_versao": r.pec_versao,
            "agente_versao": r.agente_versao, "tabelas": (r.payload or {}).get("tabelas", {})}


# ── Inconsistências do recebimento de fichas no PEC ───────────────────────────
# Fonte no PEC: tb_recebimento_lote/_item/_validacao_erros (o "Relatório de inconsistências").
# Só contagens por tipo de ficha × CNES × situação × tipo de erro; a mensagem do PEC chega
# com números longos mascarados (nenhum CPF/CNS) e é mascarada de novo aqui.

_RE_NUMERO_LONGO = re.compile(r"\d{5,}")
TIPOS_ERRO = Literal["campo_nao_preenchido", "campo_invalido", "regra", "sem_detalhe"]


def mascarar_mensagem(v: str | None) -> str | None:
    if v is None:
        return None
    v = _RE_NUMERO_LONGO.sub("###", " ".join(v.split()))
    return v[:200] or None


class SituacaoQtd(_Base):
    situacao: str = Field(max_length=80)
    quantidade: int = Field(ge=0)


class RegistrosFicha(_Base):
    tipo_ficha: str = Field(max_length=120)
    cnes: Optional[str] = Field(None, max_length=10)
    situacao: str = Field(max_length=80)
    quantidade: int = Field(ge=0)


class ErroFicha(_Base):
    tipo_ficha: str = Field(max_length=120)
    cnes: Optional[str] = Field(None, max_length=10)
    tipo_erro: TIPOS_ERRO
    mensagem: Optional[str] = Field(None, max_length=400)
    quantidade: int = Field(ge=0)

    @field_validator("mensagem")
    @classmethod
    def _mascara(cls, v):
        return mascarar_mensagem(v)


class TotaisInconsistencia(_Base):
    lotes: int = Field(0, ge=0)
    registros: int = Field(0, ge=0)


class LoteInconsistenciasIn(_Base):
    ibge: str
    competencia: str
    gerado_em: datetime
    agente_versao: str = Field(max_length=30)
    pec_versao: Optional[str] = Field(None, max_length=30)
    periodo: Periodo
    totais: TotaisInconsistencia = Field(default_factory=TotaisInconsistencia)
    por_situacao: list[SituacaoQtd] = Field(default_factory=list, max_length=50)
    por_tipo_ficha: list[RegistrosFicha] = Field(default_factory=list, max_length=5000)
    erros: list[ErroFicha] = Field(default_factory=list, max_length=2000)

    @field_validator("competencia")
    @classmethod
    def _comp(cls, v: str) -> str:
        if not _RE_COMP.match(v):
            raise ValueError("competencia no formato AAAA-MM")
        return v


@router.post("/inconsistencias")
async def receber_inconsistencias(body: LoteInconsistenciasIn, request: Request, db: DbDep,
                                  x_sync_key: str = Header(..., alias="X-Sync-Key")):
    m = await _municipio_do_agente(db, body.ibge, x_sync_key, request, "inconsistencias", body.agente_versao)
    payload = body.model_dump(mode="json")
    h = _hash(payload)
    lote = (await db.execute(select(PecInconsistenciaLote).where(
        PecInconsistenciaLote.municipio_id == m.id,
        PecInconsistenciaLote.competencia == body.competencia))).scalar_one_or_none()
    status = "sem_alteracao" if lote and lote.hash_conteudo == h else "aceito"
    if not lote:
        lote = PecInconsistenciaLote(municipio_id=m.id, competencia=body.competencia)
        db.add(lote)
    lote.recebido_em = datetime.utcnow()
    lote.gerado_em = body.gerado_em.replace(tzinfo=None)
    if status == "aceito":
        lote.agente_versao, lote.pec_versao = body.agente_versao, body.pec_versao
        lote.hash_conteudo = h
        lote.payload = payload
    db.add(PecAgenteExecucao(municipio_id=m.id, tipo="inconsistencias", status=status,
                             competencia=body.competencia, registros=body.totais.registros,
                             agente_versao=body.agente_versao, pec_versao=body.pec_versao, ip_origem=ip_de(request),
                             mensagem=f"{body.totais.lotes} lotes · {body.totais.registros} registros recebidos · "
                                      f"{len(body.erros)} linhas de erro"))
    await db.commit()
    return {"ok": True, "status": status, "competencia": body.competencia}


@router.get("/inconsistencias/painel")
async def painel_inconsistencias(current: SessaoMunicipal, db: DbDep, competencia: str = Query("")):
    stmt = select(PecInconsistenciaLote).where(PecInconsistenciaLote.municipio_id == current.municipio_id)
    competencias = [c for (c,) in (await db.execute(
        select(PecInconsistenciaLote.competencia).where(PecInconsistenciaLote.municipio_id == current.municipio_id)
        .order_by(PecInconsistenciaLote.competencia.desc()))).all()]
    if competencia:
        stmt = stmt.where(PecInconsistenciaLote.competencia == competencia)
    lote = (await db.execute(stmt.order_by(PecInconsistenciaLote.competencia.desc()).limit(1))).scalar_one_or_none()
    situacao = await situacao_agente(db, current.municipio_id)
    if not lote:
        return {"status": "aguardando_agente", "competencias": competencias, "agente": situacao["estado"],
                "lote": None}
    p = lote.payload or {}
    return {"status": "ok", "competencias": competencias, "agente": situacao["estado"],
            "lote": {"competencia": lote.competencia, "recebido_em": _iso(lote.recebido_em),
                     "gerado_em": _iso(lote.gerado_em), "pec_versao": lote.pec_versao,
                     "periodo": p.get("periodo"), "totais": p.get("totais"),
                     "por_situacao": p.get("por_situacao", []), "por_tipo_ficha": p.get("por_tipo_ficha", []),
                     "erros": p.get("erros", [])},
            "fonte": "e-SUS PEC — Relatório de inconsistências do recebimento (agente local, agregado)"}
