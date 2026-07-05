"""
Contratos & Licitações — FMS Apuí/AM
Lei 14.133/2021 (Nova Lei de Licitações) · Portal da Transparência
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/contratos", tags=["Contratos"])

# ── Dados reais simulados para Apuí/AM 2026 ──────────────────────────────────

_CONTRATOS = [
    # Medicamentos e insumos
    {"id": 1,  "numero": "001/2026", "objeto": "Aquisição de medicamentos essenciais — Componente Básico",          "fornecedor": "Distribuidora Farma Norte Ltda",       "cnpj": "12.345.678/0001-90", "modalidade": "Pregão Eletrônico", "valor_total": 480_000.00,  "valor_empenhado": 480_000.00,  "valor_pago": 320_000.00,  "vigencia_inicio": "2026-01-15", "vigencia_fim": "2026-12-31", "status": "vigente",    "area": "Farmácia",          "processo": "FMS-001/2026"},
    {"id": 2,  "numero": "002/2026", "objeto": "Aquisição de materiais médico-hospitalares e insumos odontológicos", "fornecedor": "MedSupply Amazônia Eireli",             "cnpj": "23.456.789/0001-01", "modalidade": "Pregão Eletrônico", "valor_total": 210_000.00,  "valor_empenhado": 210_000.00,  "valor_pago": 140_000.00,  "vigencia_inicio": "2026-01-20", "vigencia_fim": "2026-12-31", "status": "vigente",    "area": "APS",               "processo": "FMS-002/2026"},
    {"id": 3,  "numero": "003/2026", "objeto": "Serviço de manutenção preventiva e corretiva de equipamentos médicos","fornecedor": "TechMed Serviços Ltda",                "cnpj": "34.567.890/0001-12", "modalidade": "Dispensa",          "valor_total": 96_000.00,   "valor_empenhado": 96_000.00,   "valor_pago": 48_000.00,   "vigencia_inicio": "2026-02-01", "vigencia_fim": "2026-01-31", "status": "vencendo",   "area": "Infraestrutura",    "processo": "FMS-003/2026"},
    {"id": 4,  "numero": "004/2026", "objeto": "Locação de veículos para transporte sanitário (ambulância e carros)", "fornecedor": "Locavel Transportes AM Ltda",         "cnpj": "45.678.901/0001-23", "modalidade": "Pregão Eletrônico", "valor_total": 324_000.00,  "valor_empenhado": 324_000.00,  "valor_pago": 108_000.00,  "vigencia_inicio": "2026-01-10", "vigencia_fim": "2026-12-31", "status": "vigente",    "area": "Transporte",        "processo": "FMS-004/2026"},
    {"id": 5,  "numero": "005/2026", "objeto": "Serviço de coleta e destinação de resíduos de serviços de saúde",    "fornecedor": "Ecosul Resíduos AM Ltda",              "cnpj": "56.789.012/0001-34", "modalidade": "Dispensa",          "valor_total": 42_000.00,   "valor_empenhado": 42_000.00,   "valor_pago": 28_000.00,   "vigencia_inicio": "2026-01-05", "vigencia_fim": "2026-12-31", "status": "vigente",    "area": "Vigilância Sanitária","processo": "FMS-005/2026"},
    {"id": 6,  "numero": "006/2026", "objeto": "Aquisição de vacinas e insumos para Sala de Vacinas",                "fornecedor": "BioVida Distribuidora Ltda",           "cnpj": "67.890.123/0001-45", "modalidade": "Inexigibilidade",   "valor_total": 185_000.00,  "valor_empenhado": 185_000.00,  "valor_pago": 185_000.00,  "vigencia_inicio": "2026-01-01", "vigencia_fim": "2026-06-30", "status": "concluido",  "area": "Vigilância em Saúde","processo": "FMS-006/2026"},
    {"id": 7,  "numero": "007/2026", "objeto": "Obras de reforma e ampliação da UBS Bairro Kennedy",                  "fornecedor": "Construções São Lucas AM Ltda",        "cnpj": "78.901.234/0001-56", "modalidade": "Tomada de Preços",  "valor_total": 680_000.00,  "valor_empenhado": 680_000.00,  "valor_pago": 204_000.00,  "vigencia_inicio": "2026-03-01", "vigencia_fim": "2026-09-30", "status": "vigente",    "area": "Obras",             "processo": "FMS-007/2026"},
    {"id": 8,  "numero": "008/2026", "objeto": "Contratação de empresa especializada em sistemas de informação em saúde","fornecedor": "InfoSaúde Sistemas Ltda",            "cnpj": "89.012.345/0001-67", "modalidade": "Pregão Eletrônico", "valor_total": 120_000.00,  "valor_empenhado": 120_000.00,  "valor_pago": 40_000.00,   "vigencia_inicio": "2026-02-15", "vigencia_fim": "2026-02-14", "status": "vencendo",   "area": "TI",                "processo": "FMS-008/2026"},
    {"id": 9,  "numero": "009/2026", "objeto": "Aquisição de gêneros alimentícios para Programa Alimentação Saudável", "fornecedor": "Alimentos do Norte Coop Ltda",         "cnpj": "90.123.456/0001-78", "modalidade": "Pregão Eletrônico", "valor_total": 88_000.00,   "valor_empenhado": 88_000.00,   "valor_pago": 44_000.00,   "vigencia_inicio": "2026-01-20", "vigencia_fim": "2026-12-31", "status": "vigente",    "area": "APS",               "processo": "FMS-009/2026"},
    {"id": 10, "numero": "010/2026", "objeto": "Serviço de lavanderia hospitalar para Centro de Saúde e UBSs",         "fornecedor": "Lavanderia Higienização AM ME",         "cnpj": "01.234.567/0001-89", "modalidade": "Dispensa",          "valor_total": 36_000.00,   "valor_empenhado": 36_000.00,   "valor_pago": 18_000.00,   "vigencia_inicio": "2026-01-10", "vigencia_fim": "2026-12-31", "status": "vigente",    "area": "Infraestrutura",    "processo": "FMS-010/2026"},
    {"id": 11, "numero": "011/2026", "objeto": "Aquisição de equipamentos de informática para UBSs e sede FMS",        "fornecedor": "TecnoAmazon Comércio Eireli",          "cnpj": "11.222.333/0001-90", "modalidade": "Pregão Eletrônico", "valor_total": 156_000.00,  "valor_empenhado": 156_000.00,  "valor_pago": 156_000.00,  "vigencia_inicio": "2026-02-01", "vigencia_fim": "2026-05-31", "status": "concluido",  "area": "TI",                "processo": "FMS-011/2026"},
    {"id": 12, "numero": "012/2026", "objeto": "Serviço de segurança e monitoramento eletrônico das unidades de saúde", "fornecedor": "Vigiseg Segurança AM Ltda",            "cnpj": "22.333.444/0001-01", "modalidade": "Pregão Eletrônico", "valor_total": 72_000.00,   "valor_empenhado": 72_000.00,   "valor_pago": 24_000.00,   "vigencia_inicio": "2026-01-15", "vigencia_fim": "2026-12-31", "status": "vigente",    "area": "Infraestrutura",    "processo": "FMS-012/2026"},
    # Em licitação / planejados
    {"id": 13, "numero": "013/2026", "objeto": "Aquisição de veículo de emergência (ambulância UTI Móvel)",            "fornecedor": "—",                                   "cnpj": "—",                  "modalidade": "Pregão Eletrônico", "valor_total": 380_000.00,  "valor_empenhado": 0.00,        "valor_pago": 0.00,        "vigencia_inicio": "—",          "vigencia_fim": "—",          "status": "licitando",  "area": "Transporte",        "processo": "FMS-013/2026"},
    {"id": 14, "numero": "014/2026", "objeto": "Obras de construção da nova UBS Zona Rural — Vila Progresso",          "fornecedor": "—",                                   "cnpj": "—",                  "modalidade": "Tomada de Preços",  "valor_total": 920_000.00,  "valor_empenhado": 0.00,        "valor_pago": 0.00,        "vigencia_inicio": "—",          "vigencia_fim": "—",          "status": "licitando",  "area": "Obras",             "processo": "FMS-014/2026"},
    {"id": 15, "numero": "015/2026", "objeto": "Contratação de serviço de telemedicina para APS rural",                "fornecedor": "—",                                   "cnpj": "—",                  "modalidade": "Pregão Eletrônico", "valor_total": 144_000.00,  "valor_empenhado": 0.00,        "valor_pago": 0.00,        "vigencia_inicio": "—",          "vigencia_fim": "—",          "status": "planejado",  "area": "TI",                "processo": "FMS-015/2026"},
]

_LICITACOES_HIST = [
    {"mes": "Jan/26", "pregao": 3, "dispensa": 2, "tomada": 0, "inexig": 1},
    {"mes": "Fev/26", "pregao": 2, "dispensa": 1, "tomada": 1, "inexig": 0},
    {"mes": "Mar/26", "pregao": 1, "dispensa": 0, "tomada": 1, "inexig": 0},
    {"mes": "Abr/26", "pregao": 1, "dispensa": 0, "tomada": 0, "inexig": 0},
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _pct_pago(c: dict) -> float:
    if c["valor_total"] <= 0: return 0.0
    return round((c["valor_pago"] / c["valor_total"]) * 100, 1)

def _pct_empenhado(c: dict) -> float:
    if c["valor_total"] <= 0: return 0.0
    return round((c["valor_empenhado"] / c["valor_total"]) * 100, 1)

def _enriquecer(c: dict) -> dict:
    return {**c, "pct_pago": _pct_pago(c), "pct_empenhado": _pct_empenhado(c)}

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    vigentes   = [c for c in _CONTRATOS if c["status"] == "vigente"]
    vencendo   = [c for c in _CONTRATOS if c["status"] == "vencendo"]
    concluidos = [c for c in _CONTRATOS if c["status"] == "concluido"]
    licitando  = [c for c in _CONTRATOS if c["status"] in ("licitando", "planejado")]

    total_empenhado = sum(c["valor_empenhado"] for c in _CONTRATOS)
    total_pago      = sum(c["valor_pago"] for c in _CONTRATOS)
    total_valor     = sum(c["valor_total"] for c in _CONTRATOS)

    por_area: dict = {}
    for c in _CONTRATOS:
        por_area[c["area"]] = por_area.get(c["area"], 0) + c["valor_total"]

    por_modalidade: dict = {}
    for c in _CONTRATOS:
        por_modalidade[c["modalidade"]] = por_modalidade.get(c["modalidade"], 0) + 1

    return {
        "total_contratos":  len(_CONTRATOS),
        "vigentes":         len(vigentes),
        "vencendo_30d":     len(vencendo),
        "concluidos":       len(concluidos),
        "em_licitacao":     len(licitando),
        "total_valor":      round(total_valor, 2),
        "total_empenhado":  round(total_empenhado, 2),
        "total_pago":       round(total_pago, 2),
        "pct_pago":         round((total_pago / total_empenhado) * 100, 1) if total_empenhado else 0,
        "por_area":         [{"area": k, "valor": round(v, 2)} for k, v in sorted(por_area.items(), key=lambda x: -x[1])],
        "por_modalidade":   [{"modalidade": k, "n": v} for k, v in sorted(por_modalidade.items(), key=lambda x: -x[1])],
        "historico":        _LICITACOES_HIST,
        "competencia":      "Abr/2026",
    }


@router.get("/lista")
async def lista(status: str = "", area: str = ""):
    items = _CONTRATOS
    if status: items = [c for c in items if c["status"] == status]
    if area:   items = [c for c in items if c["area"] == area]
    return [_enriquecer(c) for c in items]


@router.get("/alertas")
async def alertas():
    vencendo  = [_enriquecer(c) for c in _CONTRATOS if c["status"] == "vencendo"]
    licitando = [_enriquecer(c) for c in _CONTRATOS if c["status"] == "licitando"]
    return {"vencendo": vencendo, "licitando": licitando}
