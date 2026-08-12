"""
FNS Service — Integração FNS / Portal da Transparência

Fontes (em ordem de prioridade):
  1. consultafns.saude.gov.br REST API
  2. Portal da Transparência (TRANSPARENCIA_API_KEY)
  3. consultafns.saude.gov.br scraping HTML

Fallback: se todos falharem, retorna status="sem_dados".
"""
from __future__ import annotations
import json
import logging
import os
import re
from datetime import datetime

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config import settings
from models import Convenio, Repasse, Alerta, SeveridadeAlerta
from schemas.fns import FnsRepasseItem, FnsSyncResult

TRANSP_KEY  = os.getenv("TRANSPARENCIA_API_KEY", "")
TRANSP_BASE = "https://api.portaldatransparencia.gov.br/api-de-dados"

logger = logging.getLogger(__name__)

COMPETENCIAS_LABEL = {
    1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
}

# Limiar de alerta: repasse abaixo de X% do previsto gera alerta crítico
LIMIAR_CRITICO = 0.50
LIMIAR_ATENCAO = 0.75


def _competencia_str(mes: int, ano: int) -> str:
    return f"{ano}-{mes:02d}"


def _valor(texto: str) -> float:
    """Converte 'R$ 1.234.567,89' → 1234567.89"""
    texto = texto.replace("R$", "").replace(".", "").replace(",", ".").strip()
    try:
        return float(re.sub(r"[^\d.]", "", texto))
    except ValueError:
        return 0.0


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(httpx.TransportError),
    reraise=False,
)
async def _fetch_fns_page(
    mes: int, ano: int, ibge: str
) -> str | None:
    """
    Raspa a página de transferências do FNS para um município.
    Retorna o HTML da resposta ou None se falhar.

    URL padrão: https://consultafns.saude.gov.br/#/transferencias
    A consulta é feita via POST JSON ou query string, dependendo da versão do portal.
    Aqui implementamos os dois padrões mais comuns.
    """
    url_base = settings.FNS_BASE_URL
    timeout = settings.FNS_TIMEOUT_SECONDS

    # Padrão 1: API REST interna do portal (versão mais recente)
    api_url = f"{url_base}/api/transferencias"
    params = {
        "coIbge": ibge,
        "nuCompetencia": f"{ano}{mes:02d}",
        "page": 0,
        "size": 100,
    }
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(api_url, params=params)
            if resp.status_code == 200:
                return resp.text
    except Exception as exc:
        logger.warning("FNS API REST falhou: %s", exc)

    # Padrão 2: página HTML clássica
    html_url = f"{url_base}/#/transferencias"
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(
                html_url,
                params={"coIbge": ibge, "competencia": f"{mes:02d}/{ano}"},
            )
            if resp.status_code == 200:
                return resp.text
    except Exception as exc:
        logger.warning("FNS HTML falhou: %s", exc)

    return None


def _parse_html(html: str, mes: int, ano: int) -> list[FnsRepasseItem]:
    """Extrai repasses de uma página HTML do portal FNS."""
    soup = BeautifulSoup(html, "lxml")
    itens: list[FnsRepasseItem] = []
    competencia = _competencia_str(mes, ano)

    # Tenta parsear resposta JSON (API REST)
    try:
        import json
        data = json.loads(html)
        # Estrutura comum do portal: {"content": [...], "totalElements": N}
        registros = data.get("content") or data.get("transferencias") or []
        for r in registros:
            itens.append(FnsRepasseItem(
                numero_convenio=str(r.get("nuConvenio") or r.get("numero") or ""),
                objeto=str(r.get("dsObjeto") or r.get("objeto") or ""),
                bloco=str(r.get("dsBloco") or r.get("bloco") or "Custeio e investimento"),
                competencia=competencia,
                valor_previsto=float(r.get("vlProgramado") or r.get("valorPrevisto") or 0),
                valor_realizado=float(r.get("vlTransferido") or r.get("valorRealizado") or 0),
                data_repasse=str(r.get("dtTransferencia") or "")[:10] or None,
                tipo=str(r.get("tpTransferencia") or "Federal"),
                novos=int(r.get("nuRepasse") or 0),
            ))
        return itens
    except (json.JSONDecodeError, TypeError):
        pass

    # Fallback: scraping HTML
    tabela = soup.find("table")
    if not tabela:
        return itens

    linhas = tabela.find_all("tr")[1:]  # pula cabeçalho
    for linha in linhas:
        colunas = [td.get_text(strip=True) for td in linha.find_all("td")]
        if len(colunas) < 4:
            continue
        itens.append(FnsRepasseItem(
            numero_convenio=colunas[0] if len(colunas) > 0 else "",
            objeto=colunas[1] if len(colunas) > 1 else "",
            bloco=colunas[2] if len(colunas) > 2 else "Federal",
            competencia=competencia,
            valor_previsto=_valor(colunas[3]) if len(colunas) > 3 else 0.0,
            valor_realizado=_valor(colunas[4]) if len(colunas) > 4 else 0.0,
            data_repasse=None,
            tipo="Federal",
            novos=0,
        ))

    return itens


async def _fetch_transparencia(mes: int, ano: int) -> list[FnsRepasseItem]:
    """
    Busca transferências do Portal da Transparência (API oficial com chave).
    Fonte: transferencias-voluntarias (convênios FNS → município).
    """
    if not TRANSP_KEY:
        return []

    competencia = _competencia_str(mes, ano)
    headers = {"chave-api": TRANSP_KEY, "Accept": "application/json"}
    itens: list[FnsRepasseItem] = []

    # Transferências voluntárias (convênios)
    url_vol = f"{TRANSP_BASE}/transferencias-voluntarias-municipio-estado"
    params_vol = {
        "codigoMunicipio": settings.FNS_MUNICIPIO_IBGE,
        "dataInicio": f"{ano}-{mes:02d}-01",
        "dataFim":   f"{ano}-{mes:02d}-28",
        "pagina": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            r = await client.get(url_vol, headers=headers, params=params_vol)
            if r.status_code == 200:
                data = r.json()
                registros = data if isinstance(data, list) else data.get("content", data.get("data", []))
                for rec in registros:
                    itens.append(FnsRepasseItem(
                        numero_convenio=str(
                            rec.get("codigoConvenio") or rec.get("codigo") or rec.get("id") or ""
                        ),
                        objeto=str(rec.get("objeto") or rec.get("descricao") or "Transferência FNS")[:500],
                        bloco=str(rec.get("programa") or rec.get("acao") or rec.get("bloco") or "Custeio FNS"),
                        competencia=competencia,
                        valor_previsto=float(rec.get("valorProgramado") or rec.get("valor") or 0),
                        valor_realizado=float(rec.get("valorTransferido") or rec.get("valorRealizado") or rec.get("valor") or 0),
                        data_repasse=str(rec.get("dataPublicacao") or rec.get("dataTransferencia") or "")[:10] or None,
                        tipo="Federal",
                        novos=0,
                    ))
    except Exception as exc:
        logger.warning("Portal Transparência (voluntárias) falhou: %s", exc)

    # Transferências fundo a fundo (repasses bloco FNS)
    url_faf = f"{TRANSP_BASE}/transferencias/municipios"
    params_faf = {
        "municipiosCodigo": settings.FNS_MUNICIPIO_IBGE,
        "dataInicio": f"{ano}-{mes:02d}-01",
        "dataFim":   f"{ano}-{mes:02d}-28",
        "pagina": 1,
    }
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            r2 = await client.get(url_faf, headers=headers, params=params_faf)
            if r2.status_code == 200:
                data2 = r2.json()
                registros2 = data2 if isinstance(data2, list) else data2.get("content", [])
                for rec in registros2:
                    # Filtra só FNS (unidade gestora 36213)
                    ug = rec.get("unidadeGestora", {})
                    if "saude" in str(ug.get("nome", "")).lower() or "fns" in str(ug.get("nome", "")).lower() or not ug:
                        itens.append(FnsRepasseItem(
                            numero_convenio=str(rec.get("codigo") or rec.get("id") or ""),
                            objeto=str(rec.get("objeto") or rec.get("descricao") or "Repasse FNS bloco")[:500],
                            bloco=str(rec.get("programa") or "Bloco de Financiamento SUS"),
                            competencia=competencia,
                            valor_previsto=float(rec.get("valor") or 0),
                            valor_realizado=float(rec.get("valor") or 0),
                            data_repasse=str(rec.get("data") or "")[:10] or None,
                            tipo="Federal",
                            novos=0,
                        ))
    except Exception as exc:
        logger.warning("Portal Transparência (municipios) falhou: %s", exc)

    logger.info("Portal Transparência: %d repasses encontrados para %s/%d", len(itens), mes, ano)
    return itens


async def fns_preview(mes: int, ano: int) -> list[FnsRepasseItem]:
    """
    Consulta o FNS e retorna a lista de repasses SEM gravar no banco.
    Ordem: consultafns REST → Portal Transparência → consultafns HTML.
    """
    # 1. Tenta API REST do consultafns
    html = await _fetch_fns_page(mes, ano, settings.FNS_MUNICIPIO_IBGE)
    if html:
        itens = _parse_html(html, mes, ano)
        if itens:
            logger.info("consultafns: %d repasses encontrados", len(itens))
            return itens

    # 2. Fallback: Portal da Transparência (API oficial com chave)
    itens_transp = await _fetch_transparencia(mes, ano)
    if itens_transp:
        return itens_transp

    logger.info("Todas as fontes FNS indisponíveis para %02d/%d — sem dados.", mes, ano)
    return []


async def fns_sync(
    mes: int,
    ano: int,
    municipio_id: int,
    db: AsyncSession,
) -> FnsSyncResult:
    """
    Sincroniza repasses do FNS com o banco de dados.
    - Busca convênios existentes pelo número
    - Insere repasses novos
    - Atualiza repasses já existentes
    - Gera alertas para baixa execução
    """
    competencia = _competencia_str(mes, ano)
    executado_em = datetime.utcnow()

    itens = await fns_preview(mes, ano)
    if not itens:
        return FnsSyncResult(
            status="sem_dados",
            municipio_ibge=settings.FNS_MUNICIPIO_IBGE,
            competencia=competencia,
            total_encontrados=0,
            novos_inseridos=0,
            atualizados=0,
            alertas_gerados=0,
            mensagem="Nenhum dado encontrado no FNS para a competência solicitada.",
            executado_em=executado_em,
        )

    novos = 0
    atualizados = 0
    alertas_gerados = 0

    # Busca todos os convênios do município de uma vez
    stmt = select(Convenio).where(Convenio.municipio_id == municipio_id)
    result = await db.execute(stmt)
    convenios_db: list[Convenio] = list(result.scalars().all())
    convenio_map = {c.numero: c for c in convenios_db}

    for item in itens:
        # Localiza ou cria convênio
        conv = convenio_map.get(item.numero_convenio)
        if not conv:
            # Cria convênio automaticamente se não existir
            from models.convenio import SituacaoConvenio
            conv = Convenio(
                municipio_id=municipio_id,
                numero=item.numero_convenio,
                objeto=item.objeto[:500],
                situacao=SituacaoConvenio.VIGENTE,
                valor_contrato=item.valor_previsto,
            )
            db.add(conv)
            await db.flush()  # gera o ID
            convenio_map[item.numero_convenio] = conv

        # Verifica se já existe repasse para esta competência
        stmt_r = select(Repasse).where(
            and_(
                Repasse.convenio_id == conv.id,
                Repasse.competencia == competencia,
            )
        )
        res_r = await db.execute(stmt_r)
        rep_existente: Repasse | None = res_r.scalar_one_or_none()

        if rep_existente:
            rep_existente.valor_previsto = item.valor_previsto
            rep_existente.valor_realizado = item.valor_realizado
            rep_existente.novos_repasses = item.novos
            rep_existente.origem = "fns_sync"
            if item.data_repasse:
                rep_existente.data_repasse = item.data_repasse
            atualizados += 1
        else:
            novo_rep = Repasse(
                convenio_id=conv.id,
                competencia=competencia,
                mes=mes,
                ano=ano,
                tipo_repasse=item.tipo,
                novos_repasses=item.novos,
                valor_previsto=item.valor_previsto,
                valor_realizado=item.valor_realizado,
                data_repasse=item.data_repasse,
                origem="fns_sync",
            )
            db.add(novo_rep)
            novos += 1

        # ── Gerar alertas de baixa execução ──────────────────────────────
        if item.valor_previsto > 0:
            perc = item.valor_realizado / item.valor_previsto
            if perc < LIMIAR_CRITICO:
                alerta = Alerta(
                    municipio_id=municipio_id,
                    convenio_id=conv.id,
                    titulo=f"Execução crítica: {item.bloco} ({perc:.0%})",
                    descricao=(
                        f"Convênio {item.numero_convenio} — {item.objeto[:80]}. "
                        f"Realizado R${item.valor_realizado:,.2f} de "
                        f"R${item.valor_previsto:,.2f} previstos ({perc:.1%})."
                    ),
                    modulo="FNS",
                    severidade=SeveridadeAlerta.CRITICO,
                )
                db.add(alerta)
                alertas_gerados += 1
            elif perc < LIMIAR_ATENCAO:
                alerta = Alerta(
                    municipio_id=municipio_id,
                    convenio_id=conv.id,
                    titulo=f"Execução abaixo de 75%: {item.bloco}",
                    descricao=(
                        f"Convênio {item.numero_convenio}. "
                        f"Execução: {perc:.1%} ({item.competencia})."
                    ),
                    modulo="FNS",
                    severidade=SeveridadeAlerta.ATENCAO,
                )
                db.add(alerta)
                alertas_gerados += 1

    await db.commit()

    return FnsSyncResult(
        status="ok",
        municipio_ibge=settings.FNS_MUNICIPIO_IBGE,
        competencia=competencia,
        total_encontrados=len(itens),
        novos_inseridos=novos,
        atualizados=atualizados,
        alertas_gerados=alertas_gerados,
        itens=itens,
        mensagem=f"Sync concluído: {novos} novos, {atualizados} atualizados, {alertas_gerados} alertas.",
        executado_em=executado_em,
    )
