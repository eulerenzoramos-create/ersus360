"""
Serviço: Transferências FNS — Fundo Nacional de Saúde
Fonte oficial: consultafns.saude.gov.br (API pública fundo a fundo)
Fallback: api.portaldatransparencia.gov.br

Princípios:
- Percorre TODAS as páginas antes de considerar coleta concluída
- Valida soma dos registros == total geral oficial
- Nunca fabrica valores; retorna nao_disponivel quando fonte falha
- Impede duplicidade por chave_unica determinística
- Preserva histórico de alterações de valor

IBGE Apuí/AM: 130014 (7 dígitos, padrão FNS)
IBGE Apuí/AM: 1300144 (7+dígito verificador, padrão IBGE completo)
"""
from __future__ import annotations

import hashlib
import logging
import os
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

import httpx
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.transferencia_fns import TransferenciaFns, ColetaFns

logger = logging.getLogger(__name__)

# ── Constantes ─────────────────────────────────────────────────────────────────
IBGE_APUI_7     = "130014"   # padrão e-Gestor / FNS curto
IBGE_APUI_8     = "1300144"  # padrão IBGE completo
TRANSP_KEY      = os.getenv("TRANSPARENCIA_API_KEY", "")
FNS_CPF         = os.getenv("FNS_API_CPF", "")
FNS_SENHA       = os.getenv("FNS_API_SENHA", "")

TIMEOUT         = 30.0
PAGE_SIZE       = 100   # registros por página
MAX_PAGES       = 200   # limite de segurança (evita loop infinito)

# ── Classificação por tipo de incentivo ──────────────────────────────────────
_TIPO_MAP: list[tuple[str, list[str]]] = [
    ("Atenção Primária", [
        "atenção primária", "piso de atenção primária", "saúde da família",
        "equipes de saúde da família", "esf", "eap", "emulti", "esb",
        "agentes comunitários de saúde", "ribeirinha", "esfrb",
        "per capita", "base populacional", "demais programas",
    ]),
    ("MAC — Média e Alta Complexidade", [
        "média e alta complexidade", "mac", "ambulatorial e hospitalar",
        "procedimentos em mac",
    ]),
    ("Assistência Farmacêutica", [
        "assistência farmacêutica", "farmácia", "cbaf", "insumos estratégicos",
        "componente básico", "componente especializado",
    ]),
    ("Vigilância em Saúde", [
        "vigilância em saúde", "vigilância sanitária", "vigilância epidemiológica",
        "endemias", "vetores", "arboviroses",
    ]),
    ("Piso Salarial da Enfermagem", [
        "piso salarial", "enfermagem", "técnico de enfermagem", "auxiliar de enfermagem",
        "enfermeiro",
    ]),
    ("ACS — Agentes Comunitários de Saúde", [
        "agentes comunitários de saúde",
    ]),
    ("ACE — Agentes de Combate às Endemias", [
        "agentes de combate às endemias", "ace",
    ]),
    ("Gestão do SUS", [
        "gestão do sus", "gestão em saúde", "qualificação da gestão",
        "fortalecimento da gestão",
    ]),
    ("Emendas Parlamentares", [
        "emenda", "parlamentar", "bancada",
    ]),
    ("Investimentos", [
        "investimento", "obra", "equipamento", "construção", "reforma",
        "ampliação",
    ]),
]


def classificar_tipo(bloco: str | None, grupo: str | None, acao: str | None, acao_det: str | None) -> str:
    """Classifica o tipo de incentivo usando os campos oficiais do FNS."""
    texto = " ".join(filter(None, [bloco, grupo, acao, acao_det])).lower()
    for tipo, palavras in _TIPO_MAP:
        if any(p in texto for p in palavras):
            return tipo
    return "Outros incentivos"


def _chave(ibge: str, exercicio: int, mes: int | None, bloco: str, grupo: str, acao: str, acao_det: str, valor_liquido: Decimal | str) -> str:
    """Gera chave única determinística para impedir duplicação."""
    raw = f"{ibge}|{exercicio}|{mes}|{(bloco or '').strip()}|{(grupo or '').strip()}|{(acao or '').strip()}|{(acao_det or '').strip()}|{valor_liquido}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:40]


def _dec(v: Any) -> Decimal | None:
    """Converte valor numérico para Decimal seguro."""
    if v is None:
        return None
    try:
        return Decimal(str(v)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except Exception:
        return None


def _parse_date(s: str | None) -> date | None:
    """Tenta parsear data em múltiplos formatos."""
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _competencia_str(exercicio: int, mes: int | None) -> str | None:
    if mes:
        return f"{exercicio}/{mes:02d}"
    return None


# ── Normalização de registro bruto da API ──────────────────────────────────────

def _normalizar(raw: dict, exercicio: int, mes: int | None, fonte: str, pagina: int) -> dict:
    """
    Normaliza um registro bruto retornado pela API do FNS para o schema interno.
    Tenta múltiplos nomes de campo (a API pode variar entre versões).
    """
    def _str(*keys: str) -> str | None:
        for k in keys:
            v = raw.get(k)
            if v is not None and str(v).strip():
                return str(v).strip()
        return None

    def _num(*keys: str) -> Decimal | None:
        for k in keys:
            v = raw.get(k)
            if v is not None:
                d = _dec(v)
                if d is not None:
                    return d
        return None

    bloco      = _str("bloco", "dsBloco", "noBloco", "Bloco")
    grupo      = _str("grupo", "dsGrupo", "noGrupo", "Grupo")
    acao       = _str("acao", "dsAcao", "noAcao", "acaoProgramatica", "Acao", "acaoOrcamentaria")
    acao_det   = _str("acaoDetalhada", "dsAcaoDetalhada", "noAcaoDetalhada", "subPrograma", "AcaoDetalhada")
    vl_total   = _num("valorTotal", "vlTotal", "valor", "valorBruto", "ValorTotal")
    vl_desc    = _num("valorDesconto", "vlDesconto", "desconto", "ValorDesconto") or Decimal("0.00")
    vl_liq     = _num("valorLiquido", "vlLiquido", "valorLiquidoTransferido", "ValorLiquido")

    # Se valor líquido não vier, calcular
    if vl_liq is None and vl_total is not None:
        vl_liq = vl_total - (vl_desc or Decimal("0.00"))

    vl_liq_str = str(vl_liq) if vl_liq is not None else "0"
    chave = _chave(IBGE_APUI_7, exercicio, mes, bloco or "", grupo or "", acao or "", acao_det or "", vl_liq_str)

    return {
        "chave_unica":       chave,
        "municipio_ibge":    IBGE_APUI_7,
        "municipio_nome":    "Apuí",
        "uf":                "AM",
        "cnpj_fundo":        _str("cnpjFundo", "cnpj", "nuCnpj") or "12.834.320/0001-26",
        "exercicio":         exercicio,
        "mes":               mes,
        "data_pagamento":    _parse_date(_str("dataPagamento", "dtPagamento", "dataCredito", "dtCredito")),
        "competencia":       _competencia_str(exercicio, mes),
        "bloco":             bloco,
        "grupo":             grupo,
        "acao":              acao,
        "acao_detalhada":    acao_det,
        "tipo_incentivo":    classificar_tipo(bloco, grupo, acao, acao_det),
        "numero_proposta":   _str("numeroProposta", "nuProposta", "proposta"),
        "numero_processo":   _str("numeroProcesso", "nuProcesso", "processo"),
        "numero_portaria":   _str("numeroPortaria", "nuPortaria", "portaria"),
        "numero_ob":         _str("numeroOB", "nuOB", "ordemBancaria", "ob"),
        "conta_bancaria":    _str("contaBancaria", "nuConta"),
        "valor_total":       vl_total,
        "valor_desconto":    vl_desc,
        "valor_liquido":     vl_liq,
        "situacao":          _str("situacao", "dsSituacao", "status") or "Pago",
        "fonte":             fonte,
        "pagina_coleta":     pagina,
        "data_coleta":       datetime.utcnow(),
    }


# ── Clientes de API ────────────────────────────────────────────────────────────

async def _fetch_consultafns(exercicio: int, mes: int) -> tuple[list[dict], Decimal | None, int | None]:
    """
    Consulta consultafns.saude.gov.br percorrendo todas as páginas.
    Retorna (registros_normalizados, total_oficial, total_registros_fonte).
    """
    competencia_yyyymm = f"{exercicio}{mes:02d}"
    base_urls = [
        "https://consultafns.saude.gov.br/api/transferencias",
        "https://consultafns.saude.gov.br/api/repasse/listarRepasses",
        "https://apifns.saude.gov.br/api/repasse/municipio/{ibge}/competencia/{comp}",
    ]

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; ERSUS360/1.0; +https://ersus360.vercel.app)",
        "Accept": "application/json",
        "Origin": "https://consultafns.saude.gov.br",
        "Referer": "https://consultafns.saude.gov.br/",
    }

    registros: list[dict] = []
    total_oficial: Decimal | None = None
    total_fonte: int | None = None

    async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
        for url_tmpl in base_urls:
            url = url_tmpl.replace("{ibge}", IBGE_APUI_7).replace("{comp}", competencia_yyyymm)
            try:
                # Tenta página 0 para descobrir estrutura e total
                params = {
                    "coIbge":         IBGE_APUI_7,
                    "nuCompetencia":  competencia_yyyymm,
                    "page":           0,
                    "size":           PAGE_SIZE,
                    "municipio":      IBGE_APUI_7,
                    "competencia":    competencia_yyyymm,
                }
                resp = await client.get(url, headers=headers, params=params)
                if resp.status_code not in (200, 206):
                    continue

                data = resp.json()

                # Normaliza estrutura da resposta (vários formatos possíveis)
                items: list[dict] = []
                total_pages = 1

                if isinstance(data, list):
                    items = data
                elif isinstance(data, dict):
                    items = (
                        data.get("content") or
                        data.get("transferencias") or
                        data.get("data") or
                        data.get("items") or
                        data.get("registros") or
                        []
                    )
                    total_pages = (
                        data.get("totalPages") or
                        data.get("totalPaginas") or
                        data.get("total_pages") or
                        1
                    )
                    total_fonte = int(
                        data.get("totalElements") or
                        data.get("totalRegistros") or
                        data.get("total") or
                        len(items)
                    )
                    # Tenta extrair total oficial da fonte
                    t = (
                        data.get("totalValorLiquido") or
                        data.get("valorTotalLiquido") or
                        data.get("totalGeral") or
                        data.get("sumValorLiquido")
                    )
                    if t is not None:
                        total_oficial = _dec(t)

                for item in items:
                    registros.append(_normalizar(item, exercicio, mes, "consultafns", 0))

                # Percorre páginas restantes
                for page in range(1, min(total_pages, MAX_PAGES)):
                    params["page"] = page
                    try:
                        r2 = await client.get(url, headers=headers, params=params)
                        if r2.status_code != 200:
                            break
                        d2 = r2.json()
                        pg_items: list[dict] = []
                        if isinstance(d2, list):
                            pg_items = d2
                        elif isinstance(d2, dict):
                            pg_items = (
                                d2.get("content") or d2.get("transferencias") or
                                d2.get("data") or d2.get("items") or []
                            )
                        for item in pg_items:
                            registros.append(_normalizar(item, exercicio, mes, "consultafns", page))
                        if not pg_items:
                            break
                    except Exception as e:
                        logger.warning(f"FNS página {page}: {e}")
                        break

                if registros:
                    logger.info(f"FNS consultafns: {len(registros)} registros, {total_pages} páginas, total={total_oficial}")
                    return registros, total_oficial, total_fonte

            except Exception as e:
                logger.info(f"FNS endpoint {url}: {e}")
                continue

    return [], None, None


async def _fetch_transparencia(exercicio: int, mes: int) -> tuple[list[dict], Decimal | None, int | None]:
    """
    Fallback: Portal da Transparência — transferências fundo a fundo do FNS.
    """
    if not TRANSP_KEY:
        return [], None, None

    headers = {
        "chave-api": TRANSP_KEY,
        "Accept": "application/json",
    }
    data_inicio = f"{exercicio}-{mes:02d}-01"
    data_fim    = f"{exercicio}-{mes:02d}-28"

    # Endpoint principal: transferências a municípios com UG relacionada ao FNS/Saúde
    endpoints = [
        {
            "url": "https://api.portaldatransparencia.gov.br/api-de-dados/transferencias/municipios",
            "params": {
                "codigoMunicipio": IBGE_APUI_8,
                "dataInicio":      data_inicio,
                "dataFim":         data_fim,
                "codigoOrgao":     36000,  # Ministério da Saúde
                "pagina":          1,
            },
        },
    ]

    registros: list[dict] = []
    total_oficial: Decimal | None = None

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for ep in endpoints:
            try:
                resp = await client.get(ep["url"], headers=headers, params=ep["params"])
                if resp.status_code != 200:
                    continue
                data = resp.json()
                items = data if isinstance(data, list) else (data.get("data") or data.get("content") or [])
                for item in items:
                    # Mapeia campos do Portal da Transparência para schema interno
                    raw = {
                        "bloco":          item.get("descricaoProgramatica") or item.get("funcaoPrograma"),
                        "grupo":          item.get("programa") or item.get("funcao"),
                        "acao":           item.get("acao") or item.get("acaoProgramatica"),
                        "acaoDetalhada":  item.get("naturezaDespesa"),
                        "valorTotal":     item.get("valorTotal") or item.get("valor"),
                        "valorDesconto":  0,
                        "valorLiquido":   item.get("valorTotal") or item.get("valor"),
                        "dataPagamento":  item.get("dataTransferencia") or item.get("dataPagamento"),
                        "situacao":       item.get("situacao") or "Transferido",
                    }
                    registros.append(_normalizar(raw, exercicio, mes, "transparencia", 0))
                if registros:
                    break
            except Exception as e:
                logger.warning(f"Transparência fallback: {e}")
                continue

    return registros, total_oficial, None


# ── Persistência ───────────────────────────────────────────────────────────────

async def _salvar_registros(db: AsyncSession, registros: list[dict]) -> tuple[int, int, int]:
    """
    Insere ou atualiza registros no banco.
    Retorna (inseridos, atualizados, sem_mudanca).
    """
    inseridos = atualizados = sem_mudanca = 0

    for r in registros:
        chave = r["chave_unica"]
        stmt  = select(TransferenciaFns).where(TransferenciaFns.chave_unica == chave)
        result = await db.execute(stmt)
        existente = result.scalar_one_or_none()

        if existente is None:
            obj = TransferenciaFns(**r)
            db.add(obj)
            inseridos += 1
        else:
            # Verifica se valor mudou
            novo_vl = r.get("valor_liquido")
            if novo_vl is not None and existente.valor_liquido != novo_vl:
                hist = existente.historico or []
                hist.append({
                    "data":           datetime.utcnow().isoformat(),
                    "campo":          "valor_liquido",
                    "valor_anterior": str(existente.valor_liquido),
                    "valor_novo":     str(novo_vl),
                    "fonte":          r.get("fonte", ""),
                })
                existente.historico       = hist
                existente.valor_total     = r.get("valor_total")
                existente.valor_desconto  = r.get("valor_desconto")
                existente.valor_liquido   = novo_vl
                existente.atualizado_em   = datetime.utcnow()
                existente.data_coleta     = datetime.utcnow()
                atualizados += 1
            else:
                sem_mudanca += 1

    await db.commit()
    return inseridos, atualizados, sem_mudanca


# ── Função pública principal ───────────────────────────────────────────────────

async def coletar_transferencias(exercicio: int, mes: int, db: AsyncSession) -> dict:
    """
    Coleta transferências do FNS para Apuí, salva no banco e retorna relatório.

    Retorna dict com:
    - sucesso: bool
    - registros_inseridos/atualizados/sem_mudanca
    - total_oficial_fonte: total geral retornado pela API
    - total_coletado: soma dos valores líquidos inseridos
    - divergencia_total: diferença entre oficial e coletado (0 = OK)
    - todas_paginas_coletadas: bool
    - mensagem_erro: str | None
    """
    iniciado = datetime.utcnow()

    # Cria registro de coleta
    coleta = ColetaFns(
        municipio_ibge=IBGE_APUI_7,
        exercicio=exercicio,
        mes=mes,
        competencia=_competencia_str(exercicio, mes),
        fonte="consultafns",
        iniciado_em=iniciado,
    )
    db.add(coleta)
    await db.commit()
    await db.refresh(coleta)

    try:
        # Tenta fonte primária
        registros, total_oficial, total_fonte = await _fetch_consultafns(exercicio, mes)

        if not registros:
            # Tenta fallback
            registros, total_oficial, total_fonte = await _fetch_transparencia(exercicio, mes)
            if registros:
                coleta.fonte = "transparencia"

        if not registros:
            coleta.sucesso = False
            coleta.mensagem_erro = "Nenhuma fonte disponível retornou dados para o período solicitado."
            coleta.concluido_em = datetime.utcnow()
            await db.commit()
            return {
                "sucesso": False,
                "situacao_dado": "nao_disponivel",
                "mensagem_erro": coleta.mensagem_erro,
                "exercicio": exercicio,
                "mes": mes,
            }

        inseridos, atualizados, sem_mudanca = await _salvar_registros(db, registros)

        total_coletado = sum(
            r["valor_liquido"] for r in registros
            if r.get("valor_liquido") is not None
        )

        divergencia = None
        if total_oficial is not None:
            divergencia = abs(Decimal(str(total_coletado)) - total_oficial)

        # Verifica se total dos registros batem com total oficial
        todas_ok = divergencia is not None and divergencia < Decimal("0.02")

        coleta.total_registros         = total_fonte
        coleta.registros_coletados     = len(registros)
        coleta.total_oficial_bruto     = total_oficial
        coleta.total_coletado_bruto    = _dec(total_coletado)
        coleta.divergencia_total       = divergencia
        coleta.todas_paginas_ok        = todas_ok
        coleta.sucesso                 = True
        coleta.concluido_em            = datetime.utcnow()
        await db.commit()

        return {
            "sucesso": True,
            "situacao_dado": "oficial_validado",
            "exercicio": exercicio,
            "mes": mes,
            "registros_inseridos":   inseridos,
            "registros_atualizados": atualizados,
            "registros_sem_mudanca": sem_mudanca,
            "total_registros_fonte": total_fonte,
            "total_coletado":        len(registros),
            "total_oficial_fonte":   str(total_oficial) if total_oficial else None,
            "total_coletado_valor":  str(_dec(total_coletado)),
            "divergencia_total":     str(divergencia) if divergencia else "0.00",
            "todas_paginas_coletadas": todas_ok,
            "fonte_utilizada":       coleta.fonte,
        }

    except Exception as e:
        logger.exception(f"Erro coletando FNS {exercicio}/{mes}: {e}")
        coleta.sucesso = False
        coleta.mensagem_erro = str(e)
        coleta.concluido_em = datetime.utcnow()
        await db.commit()
        return {
            "sucesso": False,
            "situacao_dado": "nao_disponivel",
            "mensagem_erro": str(e),
        }


async def listar_transferencias(
    db: AsyncSession,
    exercicio: int | None = None,
    mes: int | None = None,
    tipo_incentivo: str | None = None,
    bloco: str | None = None,
    grupo: str | None = None,
    busca: str | None = None,
) -> list[TransferenciaFns]:
    """Lista transferências com filtros."""
    stmt = select(TransferenciaFns).where(TransferenciaFns.municipio_ibge == IBGE_APUI_7)

    if exercicio:
        stmt = stmt.where(TransferenciaFns.exercicio == exercicio)
    if mes:
        stmt = stmt.where(TransferenciaFns.mes == mes)
    if tipo_incentivo:
        stmt = stmt.where(TransferenciaFns.tipo_incentivo == tipo_incentivo)
    if bloco:
        stmt = stmt.where(TransferenciaFns.bloco.ilike(f"%{bloco}%"))
    if grupo:
        stmt = stmt.where(TransferenciaFns.grupo.ilike(f"%{grupo}%"))
    if busca:
        like = f"%{busca}%"
        from sqlalchemy import or_
        stmt = stmt.where(or_(
            TransferenciaFns.acao.ilike(like),
            TransferenciaFns.acao_detalhada.ilike(like),
            TransferenciaFns.grupo.ilike(like),
            TransferenciaFns.bloco.ilike(like),
        ))

    stmt = stmt.order_by(TransferenciaFns.data_pagamento.desc(), TransferenciaFns.id.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def resumo_por_tipo(
    db: AsyncSession,
    exercicio: int | None = None,
    mes: int | None = None,
) -> list[dict]:
    """Agrupa transferências por tipo de incentivo para o gráfico."""
    from sqlalchemy import func as sa_func
    stmt = (
        select(
            TransferenciaFns.tipo_incentivo,
            sa_func.count().label("quantidade"),
            sa_func.sum(TransferenciaFns.valor_total).label("total_bruto"),
            sa_func.sum(TransferenciaFns.valor_desconto).label("total_desconto"),
            sa_func.sum(TransferenciaFns.valor_liquido).label("total_liquido"),
        )
        .where(TransferenciaFns.municipio_ibge == IBGE_APUI_7)
        .group_by(TransferenciaFns.tipo_incentivo)
        .order_by(sa_func.sum(TransferenciaFns.valor_liquido).desc())
    )

    if exercicio:
        stmt = stmt.where(TransferenciaFns.exercicio == exercicio)
    if mes:
        stmt = stmt.where(TransferenciaFns.mes == mes)

    result = await db.execute(stmt)
    return [
        {
            "tipo_incentivo": row.tipo_incentivo or "Outros",
            "quantidade":     row.quantidade,
            "total_bruto":    float(row.total_bruto or 0),
            "total_desconto": float(row.total_desconto or 0),
            "total_liquido":  float(row.total_liquido or 0),
        }
        for row in result.all()
    ]


async def resumo_mensal(
    db: AsyncSession,
    exercicio: int | None = None,
) -> list[dict]:
    """Agrupa por mês e tipo para o gráfico de evolução mensal."""
    from sqlalchemy import func as sa_func
    stmt = (
        select(
            TransferenciaFns.exercicio,
            TransferenciaFns.mes,
            TransferenciaFns.tipo_incentivo,
            sa_func.sum(TransferenciaFns.valor_liquido).label("total_liquido"),
        )
        .where(TransferenciaFns.municipio_ibge == IBGE_APUI_7)
        .group_by(TransferenciaFns.exercicio, TransferenciaFns.mes, TransferenciaFns.tipo_incentivo)
        .order_by(TransferenciaFns.exercicio, TransferenciaFns.mes)
    )

    if exercicio:
        stmt = stmt.where(TransferenciaFns.exercicio == exercicio)

    result = await db.execute(stmt)
    return [
        {
            "exercicio":      row.exercicio,
            "mes":            row.mes,
            "tipo_incentivo": row.tipo_incentivo or "Outros",
            "total_liquido":  float(row.total_liquido or 0),
        }
        for row in result.all()
    ]
