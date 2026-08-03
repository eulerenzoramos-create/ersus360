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
            _cache.update(resultado)
            _cache_ts = datetime.utcnow()
            return resultado
    except Exception as exc:
        logger.warning("CSV FNS indisponível: %s — usando dados SIOPS homologados", exc)

    # 3. Fallback: dados reais do RREO 1° Bimestre 2026 homologado SIOPS 29/04/2026
    resultado["fonte"] = "SIOPS homologado — 1° Bimestre 2026 (ROSANGELA MOTTER, 29/04/2026)"
    resultado["dados"] = _dados_homologados()
    _cache.update(resultado)
    _cache_ts = datetime.utcnow()
    return resultado


def _dados_homologados() -> dict:
    """Dados reais do RREO Anexo 12 homologado no SIOPS em 29/04/2026 para Apuí/AM."""
    return {
        "totais": {
            "dotacao":   8_414_391.22,
            "empenhado": 3_729_513.03,
            "liquidado": 1_829_747.04,
            "pago":      1_788_296.13,
        },
        "pct_execucao": 21.25,
        "asps": {
            "receita_base":      10_238_107.09,
            "minimo_15pct":       1_535_716.06,
            "valor_aplicado_liq": 1_829_747.04,
            "pct_aplicado_liq":      17.87,
            "pct_aplicado_emp":      36.42,
            "cumpriu": True,
        },
        "por_fonte": [
            {"fonte": "Recursos Próprios (Impostos)",   "pago": 1_788_296.13},
            {"fonte": "Transferências SUS (União)",     "pago": 2_264_211.35},
            {"fonte": "Transferências SUS (Estado/AM)", "pago":     192.30},
        ],
        "por_subfuncao": [
            {"subfuncao": "Atenção Básica",               "empenhado": 1_379_663.41, "liquidado":   320_700.60, "pago":   312_746.29},
            {"subfuncao": "Outras Subfunções",            "empenhado": 1_699_543.55, "liquidado": 1_194_431.41, "pago": 1_191_069.81},
            {"subfuncao": "Assistência Hospitalar e Amb.","empenhado":   407_095.06, "liquidado":   157_480.97, "pago":   127_345.97},
            {"subfuncao": "Vigilância Epidemiológica",    "empenhado":   243_211.01, "liquidado":   157_134.06, "pago":   157_134.06},
            {"subfuncao": "Suporte Profilático",          "empenhado":           0,  "liquidado":           0,  "pago":           0},
            {"subfuncao": "Vigilância Sanitária",         "empenhado":           0,  "liquidado":           0,  "pago":           0},
            {"subfuncao": "Alimentação e Nutrição",       "empenhado":           0,  "liquidado":           0,  "pago":           0},
        ],
        "por_natureza": [
            {"natureza": "Despesas Correntes", "pago": 1_788_296.13},
            {"natureza": "Despesas de Capital","pago":           0},
        ],
        "rp_nao_processados": 1_899_765.99,
        "total_saude": {
            "empenhado": 8_320_267.57,
            "liquidado": 4_096_291.72,
            "pago":      4_052_507.48,
        },
        "total_linhas": 0,
        "bimestre": "1° Bimestre 2026",
        "periodo": "Janeiro e Fevereiro de 2026",
    }


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

    # Se ainda sem dados (nunca deve acontecer após refactoring), usa homologados direto
    dados = _cache.get("dados") or _dados_homologados()
    fonte = _cache.get("fonte") or "SIOPS homologado — 1° Bimestre 2026"
    sync_em = _cache.get("sincronizado_em")

    # Se veio da API oficial, retorna direto
    if _cache.get("fonte", "").startswith("API"):
        return {"fonte": fonte, "sincronizado_em": sync_em, "dados_brutos": dados}

    totais = dados.get("totais", {})
    pct_exec = dados.get("pct_execucao") or (
        round((totais.get("pago", 0) / totais.get("dotacao", 1)) * 100, 1)
        if totais.get("dotacao") else 0
    )

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
        "asps":           dados.get("asps"),
        "rp_nao_processados": dados.get("rp_nao_processados"),
        "total_saude":    dados.get("total_saude"),
        "bimestre":       dados.get("bimestre", ""),
        "periodo":        dados.get("periodo", ""),
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


# ── Overrides manuais ────────────────────────────────────────────────────────
_overrides: Dict[str, Any] = {}

from pydantic import BaseModel

class OverrideItem(BaseModel):
    categoria: str   # "fonte" | "subfuncao" | "natureza"
    chave: str       # valor da linha
    campo: str       # "pago" | "empenhado" | "liquidado" | "dotacao"
    valor: float
    observacao: Optional[str] = None

@router.post("/override")
async def salvar_override(item: OverrideItem):
    """Salva override manual sobre dado do SIOPS."""
    key = f"{item.categoria}::{item.chave}::{item.campo}"
    _overrides[key] = {
        "categoria": item.categoria,
        "chave": item.chave,
        "campo": item.campo,
        "valor": item.valor,
        "observacao": item.observacao,
        "editado_em": datetime.utcnow().isoformat() + "Z",
    }
    return {"ok": True, "key": key}

@router.get("/overrides")
async def listar_overrides():
    return list(_overrides.values())

@router.delete("/override/{categoria}/{chave}/{campo}")
async def deletar_override(categoria: str, chave: str, campo: str):
    key = f"{categoria}::{chave}::{campo}"
    _overrides.pop(key, None)
    return {"ok": True}


# ── Exportação PDF ────────────────────────────────────────────────────────────
from fastapi.responses import StreamingResponse

@router.get("/exportar-pdf")
async def exportar_pdf():
    """Gera PDF do relatório SIOPS com dados atuais do cache."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
        )
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    except ImportError:
        raise HTTPException(500, "reportlab não disponível")

    if not _cache.get("dados"):
        raise HTTPException(502, "Sincronize os dados antes de exportar.")

    dados  = _cache["dados"]
    totais = dados.get("totais", {})
    fonte  = _cache.get("fonte", "—")
    sync   = _cache.get("sincronizado_em", "—")

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    AZUL   = colors.HexColor("#1e3a5f")
    AZUL2  = colors.HexColor("#1d4ed8")
    VERDE  = colors.HexColor("#16a34a")
    CINZA  = colors.HexColor("#f8fafc")
    CINZA2 = colors.HexColor("#e2e8f0")

    title_style = ParagraphStyle("titulo", parent=styles["Title"],
                                 textColor=AZUL, fontSize=18, spaceAfter=4)
    sub_style   = ParagraphStyle("sub", parent=styles["Normal"],
                                 textColor=colors.HexColor("#64748b"), fontSize=9)
    h2_style    = ParagraphStyle("h2", parent=styles["Heading2"],
                                 textColor=AZUL, fontSize=12, spaceBefore=14, spaceAfter=4)
    cell_style  = ParagraphStyle("cell", parent=styles["Normal"], fontSize=8)

    def brlk(v):
        if v >= 1_000_000: return f"R${v/1_000_000:.2f}M"
        if v >= 1_000:     return f"R${v/1_000:.0f}K"
        return f"R${v:.2f}"

    story = []

    # Cabeçalho
    story.append(Paragraph("SIOPS — Relatório de Despesas em Saúde", title_style))
    story.append(Paragraph(f"Município: Apuí/AM · IBGE 1300144 · Fonte: {fonte}", sub_style))
    story.append(Paragraph(f"Gerado em: {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} UTC · Sincronizado: {sync[:19].replace('T',' ') if sync != '—' else '—'}", sub_style))
    story.append(HRFlowable(width="100%", thickness=1, color=AZUL, spaceAfter=12))

    # Totais
    story.append(Paragraph("Resumo Financeiro", h2_style))
    tot_data = [
        ["Indicador", "Valor", "% da Dotação"],
        ["Dotação Atualizada",  brlk(totais.get("dotacao", 0)),   "100,0%"],
        ["Empenhado",           brlk(totais.get("empenhado", 0)),
         f"{(totais.get('empenhado',0)/max(totais.get('dotacao',1),1)*100):.1f}%"],
        ["Liquidado",           brlk(totais.get("liquidado", 0)),
         f"{(totais.get('liquidado',0)/max(totais.get('dotacao',1),1)*100):.1f}%"],
        ["Pago",                brlk(totais.get("pago", 0)),
         f"{(totais.get('pago',0)/max(totais.get('dotacao',1),1)*100):.1f}%"],
    ]
    ts = TableStyle([
        ("BACKGROUND", (0,0), (-1,0), AZUL),
        ("TEXTCOLOR",  (0,0), (-1,0), colors.white),
        ("FONTNAME",   (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",   (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [CINZA, colors.white]),
        ("GRID",       (0,0), (-1,-1), 0.4, CINZA2),
        ("ALIGN",      (1,0), (-1,-1), "RIGHT"),
        ("LEFTPADDING",(0,0), (-1,-1), 8),
        ("RIGHTPADDING",(0,0),(-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0),(-1,-1), 5),
    ])
    t = Table(tot_data, colWidths=[9*cm, 5*cm, 4*cm])
    t.setStyle(ts)
    story.append(t)
    story.append(Spacer(1, 0.4*cm))

    def tabela_section(titulo, itens, col_key, col_label):
        story.append(Paragraph(titulo, h2_style))
        rows = [[col_label, "Valor Pago (R$)", "% do Total"]]
        total_v = sum(i.get("pago", 0) for i in itens)
        for item in itens:
            v = item.get("pago", 0)
            pct = f"{v/total_v*100:.1f}%" if total_v else "—"
            rows.append([
                Paragraph(str(item.get(col_key, "—")), cell_style),
                brlk(v),
                pct,
            ])
        # Overrides
        ovrs = [o for o in _overrides.values() if o["categoria"] == col_key and o["campo"] == "pago"]
        for o in ovrs:
            rows.append([
                Paragraph(f"✎ {o['chave']} (editado)", cell_style),
                brlk(o["valor"]),
                f"{'—'} *override",
            ])
        t2 = Table(rows, colWidths=[10*cm, 4.5*cm, 3.5*cm])
        t2.setStyle(TableStyle([
            ("BACKGROUND",  (0,0), (-1,0), AZUL2),
            ("TEXTCOLOR",   (0,0), (-1,0), colors.white),
            ("FONTNAME",    (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE",    (0,0), (-1,-1), 8),
            ("ROWBACKGROUNDS",(0,1),(-1,-1),[CINZA, colors.white]),
            ("GRID",        (0,0), (-1,-1), 0.3, CINZA2),
            ("ALIGN",       (1,0), (-1,-1), "RIGHT"),
            ("LEFTPADDING", (0,0), (-1,-1), 6),
            ("RIGHTPADDING",(0,0), (-1,-1), 6),
            ("TOPPADDING",  (0,0), (-1,-1), 4),
            ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ]))
        story.append(t2)
        story.append(Spacer(1, 0.3*cm))

    tabela_section("Despesa por Fonte de Recurso",   dados.get("por_fonte", []),     "fonte",     "Fonte")
    tabela_section("Despesa por Subfunção",           dados.get("por_subfuncao", []), "subfuncao", "Subfunção")
    tabela_section("Despesa por Natureza de Despesa", dados.get("por_natureza", []),  "natureza",  "Natureza")

    # Rodapé de overrides
    if _overrides:
        story.append(Paragraph("Ajustes Manuais Aplicados", h2_style))
        ovr_data = [["Categoria", "Chave", "Campo", "Valor", "Observação", "Editado em"]]
        for o in _overrides.values():
            ovr_data.append([
                o["categoria"], o["chave"][:40], o["campo"],
                brlk(o["valor"]), o.get("observacao") or "—",
                o["editado_em"][:16].replace("T"," "),
            ])
        t3 = Table(ovr_data, colWidths=[2.5*cm, 4.5*cm, 2*cm, 2.5*cm, 3.5*cm, 3*cm])
        t3.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,0), colors.HexColor("#d97706")),
            ("TEXTCOLOR", (0,0),(-1,0), colors.white),
            ("FONTNAME",  (0,0),(-1,0), "Helvetica-Bold"),
            ("FONTSIZE",  (0,0),(-1,-1), 7),
            ("GRID",      (0,0),(-1,-1), 0.3, CINZA2),
            ("TOPPADDING",(0,0),(-1,-1), 4),
            ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ]))
        story.append(t3)

    doc.build(story)
    buf.seek(0)
    filename = f"SIOPS_Apui_AM_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
