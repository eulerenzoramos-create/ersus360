"""
Referência oficial do pagamento no FNS ("Comp./Parcela").

O consultafns informa, no detalhamento de cada pagamento, a parcela da Portaria
a que ele se refere — ex.: "09/12 em 2026" ou "Única em 2025". O mês do crédito
NÃO é a referência: uma parcela 06/12 pode ser paga em setembro, e uma parcela
única de 2025 pode ser paga em 2026.

Este serviço busca esse detalhamento (endpoint público detalhe-pagamento, o mesmo
da tela "Detalhar pagamento" do portal) e grava a parcela nos registros FNS que o
sistema JÁ possui — sem criar registro novo. Também completa OB, Portaria e dados
bancários quando ainda estiverem vazios.
"""
from __future__ import annotations

import logging
import re
import unicodedata
from datetime import date, datetime
from decimal import Decimal

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.municipio import Municipio
from models.transferencia_fns import TransferenciaFns
from tenancy.contexto import ibge6, ibge7, municipio_atual

logger = logging.getLogger(__name__)

_URL = "https://consultafns.saude.gov.br/recursos/consulta-detalhada/detalhe-pagamento"
_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ERSUS360/1.0)",
    "Accept": "application/json",
    "Origin": "https://consultafns.saude.gov.br",
    "Referer": "https://consultafns.saude.gov.br/",
}


def parse_parcela(s: str | None) -> dict:
    """'09/12 em 2026' → numero 9, total 12, ano 2026; 'Única em 2025' → ano 2025."""
    txt = (s or "").strip()
    if not txt:
        return {}
    m = re.search(r"(\d{1,3})\s*/\s*(\d{1,3})\s*em\s*(\d{4})", txt)
    if m:
        return {"parcela_fns": txt[:40], "parcela_numero": int(m.group(1)),
                "parcela_total": int(m.group(2)), "parcela_ano": int(m.group(3))}
    ano = re.search(r"(\d{4})", txt)
    unica = "nica" in unicodedata.normalize("NFKD", txt).encode("ascii", "ignore").decode().lower()
    return {"parcela_fns": txt[:40], "parcela_numero": 1 if unica else None,
            "parcela_total": 1 if unica else None, "parcela_ano": int(ano.group(1)) if ano else None}


def _norm(s: str | None) -> str:
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9]+", " ", s.upper()).strip()


def _dec(v) -> Decimal | None:
    try:
        return Decimal(str(v)).quantize(Decimal("0.01")) if v is not None else None
    except Exception:  # noqa: BLE001
        return None


def _data(v: str | None) -> date | None:
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime((v or "").strip()[:10], fmt).date()
        except ValueError:
            continue
    return None


async def _buscar(exercicio: int, mes: int, cnpj: str, uf: str, municipio6: str) -> list[dict]:
    itens: list[dict] = []
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, headers=_HEADERS) as client:
        for page in range(1, 11):
            r = await client.get(_URL, params={
                "page": page, "count": 50, "ano": exercicio, "mes": mes, "tipoConsulta": 2,
                "estado": uf, "municipio": municipio6, "cpfCnpjUg": cnpj})
            if r.status_code != 200:
                raise RuntimeError(f"consultafns detalhe-pagamento HTTP {r.status_code}")
            dados = (r.json().get("resultado") or {}).get("dados") or []
            itens.extend(dados)
            if len(dados) < 50:
                break
    return itens


def _componente(item: dict) -> str:
    pf = ((item.get("id") or {}).get("programaFundo") or {})
    return pf.get("descricao") or item.get("nomeComponente") or ""


async def atualizar_parcelas(db: AsyncSession, exercicio: int, mes: int) -> dict:
    """Grava a parcela oficial do FNS nos registros do município da sessão para o
    mês de pagamento informado. Casamento: nº da OB quando já conhecido; senão
    componente + valor líquido (grupos iguais são pareados pela ordem das OBs)."""
    ctx = municipio_atual()
    mun = await db.get(Municipio, ctx.id) if ctx.id else None
    cnpj = re.sub(r"\D", "", (mun.cnpj_fundo if mun else "") or "")
    if not cnpj:
        return {"ok": False, "motivo": "CNPJ do fundo municipal não cadastrado"}

    itens = await _buscar(exercicio, mes, cnpj, ctx.uf or "", ibge6())
    registros = list((await db.execute(
        select(TransferenciaFns)
        .where(TransferenciaFns.municipio_ibge.in_([ibge6(), ibge7()]))
        .where(TransferenciaFns.exercicio == exercicio)
        .where(TransferenciaFns.mes == mes)
        .where(TransferenciaFns.ativo.is_(True))
    )).scalars().all())

    usados: set[int] = set()
    pares: list[tuple[dict, TransferenciaFns]] = []
    # 1) nº da OB já conhecido
    por_ob = {r.numero_ob: r for r in registros if r.numero_ob}
    pendentes = []
    for it in itens:
        r = por_ob.get(str(it.get("numeroDocumentoSiafi") or ""))
        if r and r.id not in usados:
            pares.append((it, r)); usados.add(r.id)
        else:
            pendentes.append(it)
    # 2) componente + valor líquido
    grupos_it: dict[tuple, list[dict]] = {}
    for it in pendentes:
        grupos_it.setdefault((_norm(_componente(it)), _dec(it.get("valorLiquido"))), []).append(it)
    grupos_reg: dict[tuple, list[TransferenciaFns]] = {}
    for r in registros:
        if r.id not in usados:
            grupos_reg.setdefault((_norm(r.acao_detalhada), _dec(r.valor_liquido)), []).append(r)
    ambiguos = 0
    for chave, its in grupos_it.items():
        regs = grupos_reg.get(chave, [])
        if not regs:
            continue
        if len(its) != len(regs):
            ambiguos += 1
            continue
        its = sorted(its, key=lambda x: str(x.get("numeroDocumentoSiafi") or ""))
        regs = sorted(regs, key=lambda x: (x.numero_ob or "", x.id))
        pares.extend(zip(its, regs))

    atualizados = 0
    for it, r in pares:
        info = parse_parcela(it.get("competencia"))
        for campo, valor in info.items():
            setattr(r, campo, valor)
        # completa só o que estiver vazio (nunca sobrescreve dado já existente)
        r.numero_ob = r.numero_ob or (str(it.get("numeroDocumentoSiafi") or "") or None)
        r.numero_portaria = r.numero_portaria or (str(it.get("nuPortaria") or "") or None)
        r.banco_ob = r.banco_ob or it.get("codigoBanco")
        r.agencia_ob = r.agencia_ob or it.get("codigoAgencia")
        r.numero_conta_ob = r.numero_conta_ob or it.get("contaCorrente")
        r.numero_processo = r.numero_processo or ((it.get("id") or {}).get("processoFormatado"))
        r.data_ob = r.data_ob or _data(it.get("dataCriacaoSiafi"))
        r.data_pagamento = r.data_pagamento or r.data_ob
        atualizados += 1
    await db.commit()
    return {"ok": True, "pagamentos_fns": len(itens), "atualizados": atualizados,
            "grupos_ambiguos": ambiguos}
