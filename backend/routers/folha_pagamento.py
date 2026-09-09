"""Router: /api/folha — ERSUS 360 — Folha de Pagamento SMS Apuí/AM
Integração: importação de arquivo exportado do sistema Fiorele (CSV/TXT).
Os dados ficam em cache em memória (Railway) até o próximo deploy.
"""
from __future__ import annotations
import csv
import io
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from services.cnes_service import buscar_estabelecimentos

router = APIRouter(prefix="/api/folha", tags=["Folha de Pagamento"])
logger = logging.getLogger(__name__)
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

# Cache em arquivo para sobreviver a reinicializações dentro do mesmo deploy
_CACHE_DIR = Path("/tmp/ersus_folha_cache")
_CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _cache_path(competencia: str) -> Path:
    return _CACHE_DIR / f"folha_{competencia.replace('-', '')}.json"


def _salvar(competencia: str, data: dict):
    with open(_cache_path(competencia), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def _ler(competencia: str) -> Optional[dict]:
    p = _cache_path(competencia)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def _listar_competencias() -> list[str]:
    comps = []
    for f in _CACHE_DIR.glob("folha_*.json"):
        name = f.stem.replace("folha_", "")
        if len(name) == 6:
            comps.append(f"{name[:4]}-{name[4:]}")
    return sorted(comps, reverse=True)


# ── Parsers do Fiorele ────────────────────────────────────────────────────────
# O Fiorele exporta folha em CSV com ponto-e-vírgula (;) ou pipe (|)
# Colunas padrão detectadas automaticamente

_ALIAS: dict[str, str] = {
    # matrícula
    "matrícula": "matricula", "matricula": "matricula", "mat": "matricula",
    "nr_matricula": "matricula", "nrmatricula": "matricula",
    # nome
    "nome": "nome", "servidor": "nome", "nome_servidor": "nome",
    "funcionário": "nome", "funcionario": "nome",
    # cargo
    "cargo": "cargo", "função": "cargo", "funcao": "cargo",
    "descricao_cargo": "cargo", "desc_cargo": "cargo",
    # vínculo
    "vínculo": "vinculo", "vinculo": "vinculo", "tipo_vinculo": "vinculo",
    "regime": "vinculo", "tipo_regime": "vinculo",
    # salário base
    "salário_base": "salario_base", "salario_base": "salario_base",
    "vl_salario": "salario_base", "salario": "salario_base",
    "vencimento_base": "salario_base",
    # vencimentos / bruto
    "bruto": "bruto", "total_vencimentos": "bruto", "vl_bruto": "bruto",
    "total_bruto": "bruto", "vencimentos": "bruto",
    # INSS
    "inss": "desc_inss", "desc_inss": "desc_inss", "vl_inss": "desc_inss",
    "previdência": "desc_inss", "previdencia": "desc_inss",
    # IRRF
    "irrf": "desc_irrf", "desc_irrf": "desc_irrf", "vl_irrf": "desc_irrf",
    "imposto_renda": "desc_irrf",
    # líquido
    "líquido": "liquido", "liquido": "liquido", "total_liquido": "liquido",
    "vl_liquido": "liquido", "valor_liquido": "liquido",
    # fonte contábil
    "fonte": "fonte_pagamento", "fonte_pagamento": "fonte_pagamento",
    "fonte_recurso": "fonte_pagamento", "fonte_contabil": "fonte_contabil",
    # grupo
    "grupo": "fonte_grupo", "grupo_despesa": "fonte_grupo",
    # adicional interioridade
    "interioridade": "adicional_interioridade",
    "adicional_interioridade": "adicional_interioridade",
}

_VINCULOS = {
    "estatutário": "estatutario", "estatutario": "estatutario",
    "temporário": "temporario", "temporario": "temporario",
    "clt": "clt", "comissionado": "comissionado",
    "terceirizado": "terceirizado",
}


def _brl(s: str) -> float:
    """Converte string BRL (1.234,56 ou 1234.56) para float."""
    if not s or s.strip() in ("-", "", "0"):
        return 0.0
    s = s.strip().replace("R$", "").replace(" ", "")
    if "," in s and "." in s:
        s = s.replace(".", "").replace(",", ".")
    elif "," in s:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def _detectar_separador(texto: str) -> str:
    primeira = texto.split("\n")[0]
    if primeira.count(";") >= 3:
        return ";"
    if primeira.count("|") >= 3:
        return "|"
    return ","


def _normalizar_col(c: str) -> str:
    return c.strip().lower().replace(" ", "_").replace("á","a").replace("é","e") \
        .replace("í","i").replace("ó","o").replace("ú","u").replace("ã","a") \
        .replace("â","a").replace("ê","e").replace("ô","o").replace("ç","c")


def _parsear_fiorele(conteudo: str, competencia: str) -> dict:
    sep = _detectar_separador(conteudo)
    reader = csv.DictReader(io.StringIO(conteudo), delimiter=sep)

    verbas: list[dict] = []
    erros: list[str] = []

    for i, row in enumerate(reader, 1):
        # Mapeia colunas via alias
        mapped: dict[str, str] = {}
        for col, val in row.items():
            k = _normalizar_col(col)
            campo = _ALIAS.get(k)
            if campo:
                mapped[campo] = val.strip()

        if not mapped.get("nome") and not mapped.get("matricula"):
            continue  # linha vazia ou cabeçalho duplicado

        salario_base = _brl(mapped.get("salario_base", "0"))
        bruto        = _brl(mapped.get("bruto", "0")) or salario_base
        desc_inss    = _brl(mapped.get("desc_inss", "0"))
        desc_irrf    = _brl(mapped.get("desc_irrf", "0"))
        liquido      = _brl(mapped.get("liquido", "0")) or (bruto - desc_inss - desc_irrf)
        adicional    = _brl(mapped.get("adicional_interioridade", "0"))

        vinculo_raw = mapped.get("vinculo", "").lower()
        vinculo = _VINCULOS.get(vinculo_raw, vinculo_raw or "estatutario")

        # Encargos patronais estimados por vínculo (INSS empregador + FGTS)
        taxa_encargo = {"clt": 0.28, "terceirizado": 0.0}.get(vinculo, 0.20)
        custo_total  = bruto * (1 + taxa_encargo)

        verbas.append({
            "matricula":              mapped.get("matricula", f"#{i:04d}"),
            "nome":                   mapped.get("nome", "—"),
            "cargo":                  mapped.get("cargo", "—"),
            "vinculo":                vinculo,
            "fonte_pagamento":        mapped.get("fonte_pagamento", "Municipal"),
            "fonte_contabil":         mapped.get("fonte_contabil", "—"),
            "fonte_grupo":            mapped.get("fonte_grupo", "—"),
            "salario_base":           salario_base,
            "adicional_interioridade": adicional,
            "bruto":                  bruto,
            "desc_inss":              desc_inss,
            "desc_irrf":              desc_irrf,
            "liquido":                liquido,
            "custo_total_empregador": custo_total,
        })

    if not verbas:
        raise ValueError("Nenhuma linha de servidor encontrada no arquivo. Verifique o formato.")

    # Totais
    total_bruto   = sum(v["bruto"]   for v in verbas)
    total_liquido = sum(v["liquido"] for v in verbas)
    total_inss    = sum(v["desc_inss"] for v in verbas)
    total_irrf    = sum(v["desc_irrf"] for v in verbas)
    total_custo   = sum(v["custo_total_empregador"] for v in verbas)

    # Resumo por fonte de pagamento
    fontes: dict[str, dict] = {}
    for v in verbas:
        fp = v["fonte_pagamento"]
        if fp not in fontes:
            fontes[fp] = {"label": fp, "contabil": v["fonte_contabil"],
                          "grupo": v["fonte_grupo"], "servidores": 0,
                          "bruto": 0.0, "liquido": 0.0, "custo_total": 0.0}
        fontes[fp]["servidores"] += 1
        fontes[fp]["bruto"]      += v["bruto"]
        fontes[fp]["liquido"]    += v["liquido"]
        fontes[fp]["custo_total"] += v["custo_total_empregador"]

    return {
        "situacao_dado": "oficial_importado",
        "fonte": f"Fiorele — importação manual — {competencia}",
        "competencia": competencia,
        "importado_em": _TS(),
        "total_servidores": len(verbas),
        "total_bruto": total_bruto,
        "total_liquido": total_liquido,
        "total_inss_descontado": total_inss,
        "total_irrf_descontado": total_irrf,
        "total_custo_empregador": total_custo,
        "verbas": verbas,
        "resumo_por_fonte": list(fontes.values()),
        "erros_importacao": erros,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    cnes = await buscar_estabelecimentos()
    return {
        "situacao_dado": cnes.get("situacao_dado"),
        "total_estabelecimentos": cnes.get("total"),
        "nota": "Folha individual importada via Fiorele. Use /api/folha/importar para enviar o arquivo.",
        "fonte": "CNES + Fiorele",
        "verificado_em": _TS(),
    }


@router.get("/indicadores")
async def indicadores():
    return await dashboard()


_FOLHA_REF_PATH = Path(__file__).parent.parent / "data" / "folha_referencia.json"


def _folha_referencia(competencia: str) -> dict:
    """Folha real SMS Apuí/AM — 179 servidores — Folha oficial SEMSA (Clieonice).
    Dados carregados de backend/data/folha_referencia.json gerado a partir da
    planilha oficial fornecida pela gestão SEMSA Apuí/AM.
    """
    import json as _json
    verbas = _json.loads(_FOLHA_REF_PATH.read_text(encoding="utf-8"))

    fontes: dict = {}
    for v in verbas:
        fp = v["fonte_pagamento"]
        if fp not in fontes:
            fontes[fp] = {"label": fp, "contabil": v["fonte_contabil"],
                          "grupo": v["fonte_grupo"], "servidores": 0,
                          "bruto": 0.0, "liquido": 0.0, "custo_total": 0.0}
        fontes[fp]["servidores"] += 1
        fontes[fp]["bruto"]       = round(fontes[fp]["bruto"] + v["bruto"], 2)
        fontes[fp]["liquido"]     = round(fontes[fp]["liquido"] + v["liquido"], 2)
        fontes[fp]["custo_total"] = round(fontes[fp]["custo_total"] + v["custo_total_empregador"], 2)

    total_bruto = round(sum(v["bruto"]  for v in verbas), 2)
    total_liq   = round(sum(v["liquido"] for v in verbas), 2)
    total_inss  = round(sum(v["desc_inss"] for v in verbas), 2)
    total_irrf  = round(sum(v["desc_irrf"] for v in verbas), 2)
    total_custo = round(sum(v["custo_total_empregador"] for v in verbas), 2)

    return {
        "situacao_dado": "oficial_importado",
        "fonte": "Folha Oficial SMS Apuí/AM — SEMSA (Clieonice)",
        "competencia": competencia,
        "importado_em": _TS(),
        "total_servidores": len(verbas),
        "total_bruto": total_bruto,
        "total_liquido": total_liq,
        "total_inss_descontado": total_inss,
        "total_irrf_descontado": total_irrf,
        "total_custo_empregador": total_custo,
        "verbas": verbas,
        "resumo_por_fonte": list(fontes.values()),
        "erros_importacao": [],
    }




@router.get("/folha")
async def folha(competencia: str = Query("2026-07")):
    """Retorna folha importada do Fiorele ou dados de referência."""
    dados = _ler(competencia)
    if dados:
        return dados
    return _folha_referencia(competencia)


@router.get("/competencias")
async def listar_competencias():
    return {"competencias": _listar_competencias()}


@router.post("/importar")
async def importar_fiorele(
    arquivo: UploadFile = File(...),
    competencia: str = Query("2026-07"),
):
    """
    Recebe o arquivo CSV/TXT exportado do Fiorele e processa a folha de pagamento.
    Passo: Menu Folha → Exportar → CSV (separador ponto-e-vírgula).
    """
    if not arquivo.filename:
        raise HTTPException(400, "Arquivo não informado.")

    ext = arquivo.filename.lower().rsplit(".", 1)[-1]
    if ext not in ("csv", "txt", "tsv"):
        raise HTTPException(400, f"Formato '{ext}' não suportado. Envie CSV ou TXT.")

    conteudo_bytes = await arquivo.read()
    # Tenta UTF-8, depois latin-1 (Windows-1252 comum no Fiorele)
    for enc in ("utf-8-sig", "latin-1", "utf-8"):
        try:
            conteudo = conteudo_bytes.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise HTTPException(400, "Não foi possível decodificar o arquivo. Use UTF-8 ou Latin-1.")

    try:
        dados = _parsear_fiorele(conteudo, competencia)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        logger.exception("Erro ao parsear arquivo Fiorele")
        raise HTTPException(500, f"Erro interno ao processar arquivo: {e}")

    _salvar(competencia, dados)
    logger.info(
        "Folha Fiorele importada: competencia=%s servidores=%d bruto=%.2f",
        competencia, dados["total_servidores"], dados["total_bruto"],
    )
    return {
        "ok": True,
        "competencia": competencia,
        "servidores_importados": dados["total_servidores"],
        "total_bruto": dados["total_bruto"],
        "total_liquido": dados["total_liquido"],
        "mensagem": f"Folha {competencia} importada com sucesso — {dados['total_servidores']} servidores.",
    }
