"""Router: /api/folha — ERSUS 360 — Folha de Pagamento SMS Apuí/AM
Integração: importação de arquivo exportado do sistema Fiorele (CSV/TXT).
Os dados ficam em cache em memória (Railway) até o próximo deploy.
"""
from __future__ import annotations
import csv
import io
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from services.cnes_service import resumo_estabelecimentos
from tenancy.arquivos import pasta_municipio

router = APIRouter(prefix="/api/folha", tags=["Folha de Pagamento"])
logger = logging.getLogger(__name__)
_TS = lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

# Cache em arquivo para sobreviver a reinicializações dentro do mesmo deploy
def _cache_dir() -> Path:
    return pasta_municipio("cache", "folha")


def _cache_path(competencia: str) -> Path:
    return _cache_dir() / f"folha_{competencia.replace('-', '')}.json"


def _salvar(competencia: str, data: dict):
    with open(_cache_path(competencia), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)


def _ler(competencia: str) -> Optional[dict]:
    p = _cache_path(competencia)
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else None


def _listar_competencias() -> list[str]:
    comps = []
    for f in _cache_dir().glob("folha_*.json"):
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
    cnes = await resumo_estabelecimentos()
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




def _patches_path() -> Path:
    return pasta_municipio("cache", "folha") / "patches.json"


def _ler_patches() -> dict:
    """Lê patches locais: adições, exclusões e atualizações de status."""
    if _patches_path().exists():
        try:
            return json.loads(_patches_path().read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"adicionados": [], "excluidos": [], "status_overrides": {}}


def _salvar_patches(patches: dict):
    with open(_patches_path(), "w", encoding="utf-8") as f:
        json.dump(patches, f, ensure_ascii=False, indent=2)


def _aplicar_patches(verbas: list) -> list:
    """Aplica patches (adições/exclusões/status) sobre a lista base."""
    p = _ler_patches()
    mat_excluidas = set(p.get("excluidos", []))
    status_ov = p.get("status_overrides", {})
    result = []
    for v in verbas:
        if v["matricula"] in mat_excluidas:
            continue
        if v["matricula"] in status_ov:
            v = dict(v, status=status_ov[v["matricula"]])
        result.append(v)
    for extra in p.get("adicionados", []):
        if extra["matricula"] not in mat_excluidas:
            result.append(extra)
    return result


def _folha_com_patches(competencia: str) -> dict:
    base = _folha_referencia(competencia)
    verbas_p = _aplicar_patches(base["verbas"])
    fontes: dict = {}
    for v in verbas_p:
        fp = v["fonte_pagamento"]
        if fp not in fontes:
            fontes[fp] = {"label": fp, "contabil": v["fonte_contabil"],
                          "grupo": v["fonte_grupo"], "servidores": 0,
                          "bruto": 0.0, "liquido": 0.0, "custo_total": 0.0}
        fontes[fp]["servidores"] += 1
        fontes[fp]["bruto"]       = round(fontes[fp]["bruto"] + v["bruto"], 2)
        fontes[fp]["liquido"]     = round(fontes[fp]["liquido"] + v["liquido"], 2)
        fontes[fp]["custo_total"] = round(fontes[fp]["custo_total"] + v["custo_total_empregador"], 2)
    return {
        **base,
        "total_servidores": len(verbas_p),
        "total_bruto": round(sum(v["bruto"] for v in verbas_p), 2),
        "total_liquido": round(sum(v["liquido"] for v in verbas_p), 2),
        "total_inss_descontado": round(sum(v["desc_inss"] for v in verbas_p), 2),
        "total_irrf_descontado": round(sum(v["desc_irrf"] for v in verbas_p), 2),
        "total_custo_empregador": round(sum(v["custo_total_empregador"] for v in verbas_p), 2),
        "verbas": verbas_p,
        "resumo_por_fonte": list(fontes.values()),
    }


@router.get("/folha")
async def folha(competencia: str = Query("2026-07")):
    dados = _ler(competencia)
    if dados:
        return dados
    return _folha_com_patches(competencia)


@router.get("/competencias")
async def listar_competencias():
    return {"competencias": _listar_competencias()}


@router.get("/exportar-csv")
async def exportar_csv(competencia: str = Query("2026-07")):
    """Gera arquivo CSV da folha de pagamento para download."""
    from fastapi.responses import StreamingResponse
    import io

    dados = _ler(competencia)
    if not dados:
        dados = _folha_com_patches(competencia)

    def _fmt(v: float) -> str:
        return f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    linhas = [
        "Matrícula;Nome;Cargo;Vínculo;Status;Lotação;Fonte Pagamento;Grupo;"
        "Carga Horária;Salário Base;Adicional Interioridade;Total Bruto;"
        "INSS Descontado;IRRF Descontado;Total Líquido;Custo Empregador"
    ]
    for v in dados.get("verbas", []):
        linhas.append(";".join([
            str(v.get("matricula", "")),
            f'"{v.get("nome","")}"',
            f'"{v.get("cargo","")}"',
            str(v.get("vinculo", "")),
            str(v.get("status", "ativo")),
            f'"{v.get("lotacao") or v.get("setor") or ""}"',
            str(v.get("fonte_pagamento", "")),
            str(v.get("fonte_grupo", "")),
            str(v.get("carga_horaria", 40)),
            _fmt(v.get("salario_base", 0)),
            _fmt(v.get("adicional_interioridade", 0)),
            _fmt(v.get("bruto", 0)),
            _fmt(v.get("desc_inss", 0)),
            _fmt(v.get("desc_irrf", 0)),
            _fmt(v.get("liquido", 0)),
            _fmt(v.get("custo_total_empregador", 0)),
        ]))
    linhas.append("")
    linhas.append(";".join([
        "", f'"TOTAIS ({dados.get("total_servidores",0)} servidores)"',
        "", "", "", "", "", "", "",
        "", "",
        _fmt(dados.get("total_bruto", 0)),
        _fmt(dados.get("total_inss_descontado", 0)),
        _fmt(dados.get("total_irrf_descontado", 0)),
        _fmt(dados.get("total_liquido", 0)),
        _fmt(dados.get("total_custo_empregador", 0)),
    ]))

    conteudo = "﻿" + "\r\n".join(linhas)
    nome_arquivo = f"folha_apui_{competencia.replace('-','_')}.csv"

    return StreamingResponse(
        io.StringIO(conteudo),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={nome_arquivo}"},
    )


# ── Gestão de pessoal ─────────────────────────────────────────────────────────

@router.post("/funcionario")
async def adicionar_funcionario(payload: dict):
    """Adiciona novo servidor à folha (persiste na área do município)."""
    p = _ler_patches()
    mat = payload.get("matricula", f"NOVO{len(p['adicionados'])+1:04d}")
    payload["matricula"] = str(mat)
    payload.setdefault("status", "ativo")
    payload.setdefault("fonte_grupo", "MUNICIPAL")
    payload.setdefault("fonte_pagamento", "Municipal")
    payload.setdefault("fonte_contabil", "319011")
    payload.setdefault("vinculo", "estatutario")
    p["adicionados"].append(payload)
    _salvar_patches(p)
    return {"ok": True, "matricula": payload["matricula"], "mensagem": "Servidor adicionado com sucesso."}


@router.delete("/funcionario/{matricula}")
async def excluir_funcionario(matricula: str):
    """Marca servidor como excluído da folha (reversível)."""
    p = _ler_patches()
    if matricula not in p["excluidos"]:
        p["excluidos"].append(matricula)
    _salvar_patches(p)
    return {"ok": True, "matricula": matricula, "mensagem": "Servidor removido da folha ativa."}


@router.patch("/funcionario/{matricula}/status")
async def atualizar_status(matricula: str, payload: dict):
    """Atualiza status funcional (ativo/licenca/licenca_maternidade/afastado/cedido)."""
    novo_status = payload.get("status", "ativo")
    VALIDOS = {"ativo", "licenca", "licenca_maternidade", "afastado", "cedido", "ferias"}
    if novo_status not in VALIDOS:
        raise HTTPException(400, f"Status inválido. Use: {', '.join(VALIDOS)}")
    p = _ler_patches()
    p["status_overrides"][matricula] = novo_status
    _salvar_patches(p)
    return {"ok": True, "matricula": matricula, "status": novo_status}


def _presenca_estrutura(competencia: str, filtro: str = "") -> dict:
    """Monta a estrutura da folha de presença mensal, agrupada por UBS / unidade e, dentro dela, por setor."""
    from calendar import monthrange
    ano, mes = [int(x) for x in competencia.split("-")]
    _, dias_mes = monthrange(ano, mes)
    dados = _folha_com_patches(competencia)
    verbas = dados["verbas"]
    if filtro:
        verbas = [v for v in verbas if v.get("lotacao","") == filtro or v.get("setor","") == filtro
                  or v.get("ubs_nome","") == filtro]
    unidades: dict = {}
    for v in verbas:
        ubs = v.get("ubs_nome") or v.get("lotacao") or v.get("setor") or "Sem UBS"
        st = v.get("lotacao") or v.get("setor") or "Sem Setor"
        unidades.setdefault(ubs, {}).setdefault(st, []).append({
            "matricula": v["matricula"],
            "nome": v["nome"],
            "cargo": v["cargo"],
            "vinculo": v["vinculo"],
            "status": v.get("status", "ativo"),
            "carga_horaria": v.get("carga_horaria", 40),
        })
    unidades_lista = []
    for ubs, setores in sorted(unidades.items()):
        setores_lista = [{"nome": s, "servidores": servs} for s, servs in sorted(setores.items())]
        total = sum(len(s["servidores"]) for s in setores_lista)
        unidades_lista.append({"ubs_nome": ubs, "total_servidores": total, "setores": setores_lista})
    return {
        "competencia": competencia,
        "ano": ano,
        "mes": mes,
        "dias_mes": dias_mes,
        "unidades": unidades_lista,
    }


# UBS básica (Atenção Primária) × unidade especializada (Hospital, CAPS, Vigilância, Sede) —
# mesmo critério usado no frontend (filtro da Folha Detalhada / categorias da Folha de Presença).
def _categoria_ubs(nome: str) -> str:
    return "ubs" if (nome.startswith("UBS") or nome.startswith("Centro")) else "especializada"


def _dias_uteis_mes(ano: int, mes: int, dias_mes: int) -> list[int]:
    from datetime import date as _date
    return [d for d in range(1, dias_mes + 1) if _date(ano, mes, d).weekday() < 5]


def _marcacao_presenca(matricula: str, dia: int, status: str, marcacoes: dict) -> str:
    chave = f"{matricula}_{dia}"
    if chave in marcacoes:
        return marcacoes[chave]
    return "L" if status != "ativo" else "P"


@router.get("/presenca")
async def folha_presenca(competencia: str = Query("2026-07"), setor: str = Query("")):
    """Retorna estrutura para folha de presença mensal, agrupada por UBS / unidade e, dentro dela, por setor."""
    return _presenca_estrutura(competencia, setor)


def _presenca_path() -> Path:
    return pasta_municipio("cache", "folha") / "presenca.json"

@router.post("/presenca/salvar")
async def salvar_presenca(payload: dict):
    """Persiste as marcações de presença/falta da folha mensal."""
    competencia = payload.get("competencia", "")
    marcacoes = payload.get("marcacoes", {})
    if not competencia:
        raise HTTPException(400, "competencia obrigatória")
    dados: dict = {}
    if _presenca_path().exists():
        try:
            dados = json.loads(_presenca_path().read_text(encoding="utf-8"))
        except Exception:
            dados = {}
    dados[competencia] = marcacoes
    _presenca_path().write_text(json.dumps(dados, ensure_ascii=False), encoding="utf-8")
    total = len(marcacoes)
    faltas = sum(1 for v in marcacoes.values() if v in ("F", "FJ"))
    return {"ok": True, "competencia": competencia, "total_registros": total, "faltas": faltas}


@router.get("/presenca/marcacoes")
async def ler_marcacoes(competencia: str = Query("2026-07")):
    """Retorna marcações salvas para uma competência."""
    if not _presenca_path().exists():
        return {"competencia": competencia, "marcacoes": {}}
    try:
        dados = json.loads(_presenca_path().read_text(encoding="utf-8"))
        return {"competencia": competencia, "marcacoes": dados.get(competencia, {})}
    except Exception:
        return {"competencia": competencia, "marcacoes": {}}


def _marcacoes_salvas(competencia: str) -> dict:
    if not _presenca_path().exists():
        return {}
    try:
        dados = json.loads(_presenca_path().read_text(encoding="utf-8"))
        return dados.get(competencia, {})
    except Exception:
        return {}


def _gerado_em_pt() -> str:
    from datetime import datetime as _dt
    meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
             "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
    agora = _dt.now()
    return f"{agora.day:02d} de {meses[agora.month-1]} de {agora.year} às {agora.hour:02d}:{agora.minute:02d}"


_COMP_LABEL_PT = {
    "2026-01":"Jan/2026","2026-02":"Fev/2026","2026-03":"Mar/2026","2026-04":"Abr/2026",
    "2026-05":"Mai/2026","2026-06":"Jun/2026","2026-07":"Jul/2026","2026-08":"Ago/2026",
    "2026-09":"Set/2026","2026-10":"Out/2026","2026-11":"Nov/2026","2026-12":"Dez/2026",
}
_LABEL_STATUS_PT = {
    "ativo":"Ativo", "licenca":"Lic. Saúde", "licenca_maternidade":"Lic. Maternidade",
    "afastado":"Afastado", "cedido":"Cedido", "ferias":"Férias",
}
_LABEL_CATEGORIA_PT = {
    "ubs": "UBS / Unidades Básicas de Saúde",
    "especializada": "Unidades Especializadas",
    "todas": "Todas as Unidades",
}


def gerar_pdf_presenca(estrutura: dict, marcacoes: dict, categoria: str, gerado_em: str) -> bytes:
    """Gera a Folha de Presença em PDF (A4 paisagem), agrupada por UBS/unidade e setor,
    opcionalmente restrita a uma categoria (ubs | especializada)."""
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

    buf = io.BytesIO()
    ano, mes, dias_mes = estrutura["ano"], estrutura["mes"], estrutura["dias_mes"]
    dias_uteis = _dias_uteis_mes(ano, mes, dias_mes)

    unidades = estrutura["unidades"]
    if categoria in ("ubs", "especializada"):
        unidades = [u for u in unidades if _categoria_ubs(u["ubs_nome"]) == categoria]

    AZUL   = colors.HexColor("#1a3356")
    ROXO   = colors.HexColor("#6b2d8c")
    CINZA  = colors.HexColor("#6b7280")
    BORDA  = colors.HexColor("#dde4ee")
    COR_MARC = {
        "P": colors.HexColor("#059669"), "F": colors.HexColor("#dc2626"),
        "FJ": colors.HexColor("#d97706"), "FS": colors.HexColor("#6366f1"),
        "L": colors.HexColor("#0284c7"),
    }
    COR_CATEGORIA = {"ubs": AZUL, "especializada": ROXO}

    def _footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(CINZA)
        w, _h = landscape(A4)
        y = 0.8 * cm
        canvas.drawString(doc.leftMargin, y,
                           f"ERSUS 360 · SMS Apuí/AM · IBGE 1300144 · Gerado em {gerado_em}")
        canvas.drawRightString(w - doc.rightMargin, y, f"Página {canvas.getPageNumber()}")
        canvas.restoreState()

    doc = SimpleDocTemplate(
        buf, pagesize=landscape(A4),
        leftMargin=1*cm, rightMargin=1*cm, topMargin=1*cm, bottomMargin=1.3*cm,
        title=f"Folha de Presença {estrutura['competencia']}",
        author="ERSUS 360 · SMS Apuí/AM",
    )
    W = doc.width
    story = []

    comp_label = _COMP_LABEL_PT.get(estrutura["competencia"], estrutura["competencia"])
    titulo_cat = _LABEL_CATEGORIA_PT.get(categoria, "Todas as Unidades")
    story.append(Paragraph(f"<b>ERSUS 360</b> — Folha de Presença — {comp_label}",
                            ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=14, textColor=AZUL)))
    story.append(Paragraph(f"SMS Apuí/AM · IBGE 1300144 · {titulo_cat}",
                            ParagraphStyle("s", fontName="Helvetica", fontSize=9, textColor=CINZA, spaceAfter=6)))
    story.append(Paragraph(
        "P Presente · F Falta · FJ Falta Justificada · FS Folga/Escala · L Licença",
        ParagraphStyle("l", fontName="Helvetica", fontSize=7.5, textColor=CINZA, spaceAfter=10)))

    if not unidades:
        story.append(Paragraph("Nenhum servidor encontrado para os filtros informados.",
                                ParagraphStyle("e", fontName="Helvetica", fontSize=10, textColor=colors.red)))

    for u in unidades:
        cor_u = COR_CATEGORIA.get(_categoria_ubs(u["ubs_nome"]), AZUL)
        t_u = Table([[
            Paragraph(f"<b>{u['ubs_nome']}</b>",
                      ParagraphStyle("u", fontName="Helvetica-Bold", fontSize=10, textColor=colors.white)),
            Paragraph(f"{u['total_servidores']} servidores",
                      ParagraphStyle("ur", fontName="Helvetica", fontSize=8, textColor=colors.white, alignment=TA_RIGHT)),
        ]], colWidths=[W*0.75, W*0.25])
        t_u.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), cor_u),
            ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
            ("LEFTPADDING", (0,0), (-1,-1), 8), ("RIGHTPADDING", (0,0), (-1,-1), 8),
            ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ]))
        story.append(Spacer(1, 0.3*cm))
        story.append(t_u)

        for setor in u["setores"]:
            story.append(Spacer(1, 0.12*cm))
            story.append(Paragraph(
                f"<b>{setor['nome']}</b> — {len(setor['servidores'])} servidores",
                ParagraphStyle("st", fontName="Helvetica-Bold", fontSize=8, textColor=AZUL, spaceAfter=3)))

            n_dias = len(dias_uteis)
            col_nome, col_cargo, col_sit, col_pf = 3.6*cm, 2.6*cm, 1.4*cm, 0.65*cm
            resto = W - (col_nome + col_cargo + col_sit + 2*col_pf)
            col_dia = max(resto / n_dias, 0.4*cm) if n_dias else 0.4*cm
            colw = [col_nome, col_cargo, col_sit] + [col_dia]*n_dias + [col_pf, col_pf]

            style_nome  = ParagraphStyle("nm", fontName="Helvetica-Bold", fontSize=6.5, leading=7.5)
            style_cargo = ParagraphStyle("cg", fontName="Helvetica", fontSize=6, leading=7, textColor=CINZA)
            style_sit   = ParagraphStyle("si", fontName="Helvetica", fontSize=6, leading=7)

            header = ["Servidor", "Cargo", "Situação"] + [str(d) for d in dias_uteis] + ["P", "F"]
            rows = [header]
            cor_extra = []
            for i, s in enumerate(setor["servidores"], start=1):
                marc_linha = [_marcacao_presenca(s["matricula"], d, s["status"], marcacoes) for d in dias_uteis]
                total_p = marc_linha.count("P")
                total_f = sum(1 for m in marc_linha if m in ("F", "FJ"))
                rows.append(
                    [Paragraph(s["nome"], style_nome),
                     Paragraph(s["cargo"], style_cargo),
                     Paragraph(_LABEL_STATUS_PT.get(s["status"], "Ativo"), style_sit)]
                    + marc_linha
                    + [str(total_p), str(total_f) if total_f else "—"]
                )
                for j, m in enumerate(marc_linha):
                    cor_extra.append(("TEXTCOLOR", (3+j, i), (3+j, i), COR_MARC.get(m, colors.black)))

            t = Table(rows, colWidths=colw, repeatRows=1)
            t.setStyle(TableStyle([
                ("FONTSIZE", (0,0), (-1,-1), 6),
                ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
                ("FONTNAME", (-2,1), (-1,-1), "Helvetica-Bold"),
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#e8f1fa")),
                ("ALIGN", (3,0), (-1,-1), "CENTER"),
                ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
                ("GRID", (0,0), (-1,-1), 0.3, BORDA),
                ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f9fafb")]),
                ("LEFTPADDING", (0,0), (-1,-1), 2), ("RIGHTPADDING", (0,0), (-1,-1), 2),
                ("TOPPADDING", (0,0), (-1,-1), 2), ("BOTTOMPADDING", (0,0), (-1,-1), 2),
            ] + cor_extra))
            story.append(t)
        story.append(Spacer(1, 0.3*cm))

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    buf.seek(0)
    return buf.read()


@router.get("/presenca/pdf")
async def presenca_pdf(
    competencia: str = Query("2026-07"),
    categoria: str = Query("todas", description="todas | ubs | especializada"),
    unidade: str = Query("", description="Nome exato de uma UBS/unidade específica (opcional)"),
):
    """Gera a Folha de Presença em PDF — todas as unidades, só UBS básica, só unidades
    especializadas, ou uma unidade específica (parâmetro `unidade`)."""
    from fastapi.responses import StreamingResponse

    estrutura = _presenca_estrutura(competencia, unidade)
    if not estrutura["unidades"]:
        raise HTTPException(404, "Nenhum servidor encontrado para os filtros informados.")
    marcacoes = _marcacoes_salvas(competencia)
    gerado_em = _gerado_em_pt()
    pdf_bytes = gerar_pdf_presenca(estrutura, marcacoes, categoria, gerado_em)

    sufixo = f"_{unidade}" if unidade else (f"_{categoria}" if categoria in ("ubs", "especializada") else "")
    fname = f"ERSUS360_FolhaPresenca_{competencia}{sufixo}.pdf".replace(" ", "_").replace("/", "-")
    return StreamingResponse(
        io.BytesIO(pdf_bytes), media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{fname}"'},
    )


RESEND_API_KEY        = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM_PRESENCA   = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
EMAIL_RECIPIENT_PADRAO = os.getenv("EMAIL_RECIPIENT", "eulerenzoramos@gmail.com")


async def _enviar_email_com_anexo(destinatario: str, assunto: str, html: str,
                                   pdf_bytes: bytes, filename: str) -> dict:
    """Envia e-mail com PDF anexado via Resend (HTTPS — Railway bloqueia SMTP)."""
    if not RESEND_API_KEY:
        return {"ok": False, "erro": "RESEND_API_KEY não configurado no Railway. "
                                      "Configure essa variável para habilitar envio de e-mail."}
    import httpx, base64
    try:
        anexo_b64 = base64.b64encode(pdf_bytes).decode("ascii")
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
                json={
                    "from": EMAIL_FROM_PRESENCA, "to": [destinatario],
                    "subject": assunto, "html": html,
                    "attachments": [{"filename": filename, "content": anexo_b64}],
                },
            )
        if r.status_code in (200, 201):
            return {"ok": True}
        return {"ok": False, "erro": f"Resend HTTP {r.status_code}: {r.text[:300]}"}
    except Exception as e:
        return {"ok": False, "erro": str(e)}


@router.post("/presenca/email")
async def presenca_email(payload: dict):
    """Gera a Folha de Presença em PDF (todas, UBS básica, unidades especializadas ou uma
    unidade específica) e envia por e-mail como anexo."""
    competencia = payload.get("competencia", "2026-07")
    categoria   = payload.get("categoria", "todas")
    unidade     = payload.get("unidade", "")
    destinatario = payload.get("destinatario") or EMAIL_RECIPIENT_PADRAO

    estrutura = _presenca_estrutura(competencia, unidade)
    if not estrutura["unidades"]:
        raise HTTPException(404, "Nenhum servidor encontrado para os filtros informados.")
    marcacoes = _marcacoes_salvas(competencia)
    gerado_em = _gerado_em_pt()
    pdf_bytes = gerar_pdf_presenca(estrutura, marcacoes, categoria, gerado_em)

    alvo = unidade or _LABEL_CATEGORIA_PT.get(categoria, "Todas as Unidades")
    comp_label = _COMP_LABEL_PT.get(competencia, competencia)
    assunto = f"ERSUS 360 — Folha de Presença {comp_label} — {alvo}"
    html_corpo = (
        f'<div style="font-family:Arial,sans-serif;font-size:14px;color:#1e293b">'
        f"<p>Segue em anexo a <b>Folha de Presença</b> — competência <b>{comp_label}</b> — {alvo}.</p>"
        f'<p style="color:#64748b;font-size:12px">Gerado automaticamente pelo ERSUS 360 em {gerado_em}.</p>'
        f"</div>"
    )
    fname = f"ERSUS360_FolhaPresenca_{competencia}.pdf"
    resultado = await _enviar_email_com_anexo(destinatario, assunto, html_corpo, pdf_bytes, fname)
    if not resultado.get("ok"):
        raise HTTPException(502, resultado.get("erro", "Falha ao enviar e-mail."))
    return {"ok": True, "destinatario": destinatario, "assunto": assunto}


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
