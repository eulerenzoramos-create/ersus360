"""
SIOPS Live — Integração com portal FNS
Tenta a API pública oficial; se indisponível, baixa e parseia o CSV oficial do FNS.
Município: Apuí/AM · IBGE 1300144
"""
import asyncio
import csv
import io
import logging
import zipfile
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)

from fastapi import APIRouter, BackgroundTasks, HTTPException

router = APIRouter(prefix="/api/siops-live", tags=["siops_live"])

# ── Configuração ────────────────────────────────────────────────────────────
IBGE_APUI = "1300144"
IBGE_APUI_6 = "300144"   # alguns CSVs usam 6 dígitos

# API pública SIOPS (pode estar indisponível)
SIOPS_API_BASE = "https://siops-consulta-publica-api.saude.gov.br"

# CSV bulk do portal FNS — 6º bimestre 2025
FNS_CSV_URL = (
    "https://portalfns.saude.gov.br/idg_download/"
    "siops-despesas-por-fonte-subfuncao-natureza-municipais-2025-6o-bimestre/"
)

# Timeout em segundos para tentar a API oficial
API_TIMEOUT = 8.0

# Cache em memória — dura 24h
_cache: Dict[str, Any] = {}
_cache_ts: Optional[datetime] = None
_sync_lock = asyncio.Lock()

# ── Helpers ──────────────────────────────────────────────────────────────────

def _cache_valido() -> bool:
    if _cache_ts is None:
        return False
    return datetime.utcnow() - _cache_ts < timedelta(hours=24)


async def _tentar_api_oficial() -> Optional[Dict]:
    """Tenta os endpoints conhecidos da API pública SIOPS."""
    paths = [
        f"/api/municipio/{IBGE_APUI}/ec29",
        f"/municipio/{IBGE_APUI}/ec29",
        f"/api/financeiro/municipio/{IBGE_APUI}",
    ]
    async with httpx.AsyncClient(timeout=API_TIMEOUT, follow_redirects=True) as client:
        for path in paths:
            try:
                r = await client.get(f"{SIOPS_API_BASE}{path}")
                if r.status_code == 200:
                    data = r.json()
                    logger.info("SIOPS API ok: %s", path)
                    return {"fonte": "api_oficial", "dados": data, "path": path}
            except Exception as exc:
                logger.debug("SIOPS API falhou (%s): %s", path, exc)
    return None


async def _baixar_csv_fns() -> List[Dict]:
    """Baixa o ZIP do portal FNS e parseia o CSV filtrando Apuí."""
    logger.info("Baixando CSV SIOPS do portal FNS…")
    async with httpx.AsyncClient(
        timeout=httpx.Timeout(120.0, connect=15.0),
        follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0 (ERSUS360-FMS-Apui/1.0)"},
    ) as client:
        resp = await client.get(FNS_CSV_URL)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")
        content = resp.content

    # Se for ZIP, extrai
    if b"PK" in content[:4] or "zip" in content_type:
        zf = zipfile.ZipFile(io.BytesIO(content))
        csv_name = next((n for n in zf.namelist() if n.lower().endswith(".csv")), None)
        if not csv_name:
            raise ValueError("Nenhum CSV encontrado no ZIP")
        raw = zf.read(csv_name)
    else:
        raw = content

    # Tenta encodings comuns do governo brasileiro
    for enc in ("utf-8-sig", "latin-1", "cp1252"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        text = raw.decode("latin-1", errors="replace")

    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    rows = []
    for row in reader:
        ibge = (
            row.get("CO_IBGE") or row.get("CO_MUNICIPIO") or
            row.get("co_ibge") or row.get("IBGE") or ""
        ).strip().lstrip("0")
        if ibge in (IBGE_APUI.lstrip("0"), IBGE_APUI_6.lstrip("0"), IBGE_APUI, IBGE_APUI_6):
            rows.append({k.strip(): v.strip() for k, v in row.items()})

    logger.info("CSV FNS: %d linhas encontradas para Apuí (IBGE %s)", len(rows), IBGE_APUI)
    return rows


def _parse_valor(s: str) -> float:
    """Converte string BR de valor para float."""
    try:
        return float(s.replace(".", "").replace(",", ".").strip())
    except (ValueError, AttributeError):
        return 0.0


def _agrupar_despesas(rows: List[Dict]) -> Dict:
    """Agrupa linhas do CSV em estruturas úteis."""
    fontes: dict[str, float] = {}
    subfuncoes: dict[str, float] = {}
    naturezas: dict[str, float] = {}
    total_dotacao = total_empenhado = total_liquidado = total_pago = 0.0

    for r in rows:
        pago = _parse_valor(
            r.get("VL_PAGO") or r.get("PAGO") or r.get("vl_pago") or "0"
        )
        emp = _parse_valor(
            r.get("VL_EMPENHADO") or r.get("EMPENHADO") or r.get("vl_empenhado") or "0"
        )
        liq = _parse_valor(
            r.get("VL_LIQUIDADO") or r.get("LIQUIDADO") or r.get("vl_liquidado") or "0"
        )
        dot = _parse_valor(
            r.get("VL_DOTACAO_ATUALIZADA") or r.get("DOTACAO_ATUALIZADA") or
            r.get("VL_DOTACAO_INICIAL") or "0"
        )

        total_dotacao  += dot
        total_empenhado += emp
        total_liquidado += liq
        total_pago     += pago

        fonte = r.get("DS_FONTE") or r.get("FONTE") or r.get("ds_fonte") or "Outros"
        subfun = r.get("DS_SUBFUNCAO") or r.get("SUBFUNCAO") or r.get("ds_subfuncao") or "Outros"
        nat = r.get("DS_NATUREZA") or r.get("NATUREZA") or r.get("ds_natureza") or "Outros"

        fontes[fonte]       = fontes.get(fonte, 0) + pago
        subfuncoes[subfun]  = subfuncoes.get(subfun, 0) + pago
        naturezas[nat]      = naturezas.get(nat, 0) + pago

    return {
        "totais": {
            "dotacao":   round(total_dotacao, 2),
            "empenhado": round(total_empenhado, 2),
            "liquidado": round(total_liquidado, 2),
            "pago":      round(total_pago, 2),
        },
        "por_fonte":     sorted(
            [{"fonte": k, "pago": round(v, 2)} for k, v in fontes.items()],
            key=lambda x: -x["pago"]
        )[:15],
        "por_subfuncao": sorted(
            [{"subfuncao": k, "pago": round(v, 2)} for k, v in subfuncoes.items()],
            key=lambda x: -x["pago"]
        )[:15],
        "por_natureza":  sorted(
            [{"natureza": k, "pago": round(v, 2)} for k, v in naturezas.items()],
            key=lambda x: -x["pago"]
        )[:15],
        "total_linhas": len(rows),
    }


async def _sincronizar() -> dict:
    """Pipeline completo de sincronização com fallback."""
    global _cache, _cache_ts

    resultado: dict = {
        "ibge": IBGE_APUI,
        "municipio": "Apuí/AM",
        "sincronizado_em": datetime.utcnow().isoformat() + "Z",
        "fonte": None,
        "erro": None,
        "dados": None,
    }

    # 1. Tenta API oficial
    api_resp = await _tentar_api_oficial()
    if api_resp:
        resultado["fonte"] = "API pública SIOPS (ao vivo)"
        resultado["dados"] = api_resp["dados"]
        _cache.update(resultado)
        _cache_ts = datetime.utcnow()
        return resultado

    # 2. Baixa CSV do FNS
    try:
        rows = await _baixar_csv_fns()
        if rows:
            resultado["fonte"] = "CSV oficial FNS — 6º bimestre 2025"
            resultado["dados"] = _agrupar_despesas(rows)
        else:
            resultado["fonte"] = "CSV oficial FNS — sem dados para IBGE " + IBGE_APUI
            resultado["dados"] = {"aviso": "Município não encontrado no CSV — pode estar em bimestre anterior"}
    except Exception as exc:
        logger.exception("Erro ao baixar CSV FNS")
        resultado["erro"] = str(exc)
        resultado["fonte"] = "indisponível"
        resultado["dados"] = None

    _cache.update(resultado)
    _cache_ts = datetime.utcnow()
    return resultado


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/status")
async def status():
    """Status da integração e última sincronização."""
    return {
        "cache_valido": _cache_valido(),
        "sincronizado_em": _cache.get("sincronizado_em"),
        "fonte": _cache.get("fonte"),
        "ibge": IBGE_APUI,
        "municipio": "Apuí/AM",
        "api_oficial_url": SIOPS_API_BASE,
        "csv_url": FNS_CSV_URL,
    }


@router.post("/sincronizar")
async def sincronizar(background_tasks: BackgroundTasks):
    """Força sincronização imediata (download + parse)."""
    if _sync_lock.locked():
        return {"mensagem": "Sincronização já em andamento…", "aguarde": True}
    async with _sync_lock:
        resultado = await _sincronizar()
    return resultado


@router.get("/dashboard")
async def dashboard():
    """Retorna dados consolidados do SIOPS para Apuí."""
    if not _cache_valido():
        async with _sync_lock:
            if not _cache_valido():
                await _sincronizar()

    if not _cache.get("dados"):
        raise HTTPException(502, detail="Dados SIOPS não disponíveis. Use /sincronizar.")

    dados = _cache["dados"]
    fonte = _cache.get("fonte", "desconhecida")
    sync_em = _cache.get("sincronizado_em")

    # Se veio da API oficial, retorna direto
    if _cache.get("fonte", "").startswith("API"):
        return {"fonte": fonte, "sincronizado_em": sync_em, "dados_brutos": dados}

    # Se veio do CSV, monta dashboard estruturado
    totais = dados.get("totais", {})
    pct_exec = round((totais.get("pago", 0) / totais.get("dotacao", 1)) * 100, 1) if totais.get("dotacao") else 0

    return {
        "fonte": fonte,
        "sincronizado_em": sync_em,
        "ibge": IBGE_APUI,
        "municipio": "Apuí/AM",
        "totais": totais,
        "pct_execucao": pct_exec,
        "total_linhas_csv": dados.get("total_linhas", 0),
        "top_fontes":     dados.get("por_fonte", [])[:8],
        "top_subfuncoes": dados.get("por_subfuncao", [])[:8],
        "top_naturezas":  dados.get("por_natureza", [])[:8],
    }


@router.get("/despesas/por-fonte")
async def despesas_por_fonte():
    if not _cache_valido():
        await _sincronizar()
    dados = _cache.get("dados") or {}
    return dados.get("por_fonte", [])


@router.get("/despesas/por-subfuncao")
async def despesas_por_subfuncao():
    if not _cache_valido():
        await _sincronizar()
    dados = _cache.get("dados") or {}
    return dados.get("por_subfuncao", [])


@router.get("/despesas/por-natureza")
async def despesas_por_natureza():
    if not _cache_valido():
        await _sincronizar()
    dados = _cache.get("dados") or {}
    return dados.get("por_natureza", [])
