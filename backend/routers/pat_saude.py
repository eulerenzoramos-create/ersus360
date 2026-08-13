"""PAT Saúde — Patrimônio de Saúde · Inventário · Depreciação · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/pat-saude", tags=["pat_saude"])

_TS = "2026-08-13T00:00:00Z"

_CATEGORIAS = [
    {"categoria": "Equipamentos Médico-Hospitalares", "quantidade": 48, "valor_total": 382000.00, "valor_liquido": 241600.00, "depreciacao_media_pct": 36.8, "inoperantes": 4,  "status": "atencao"},
    {"categoria": "Mobiliário Clínico",               "quantidade": 92, "valor_total": 112000.00, "valor_liquido":  89600.00, "depreciacao_media_pct": 20.0, "inoperantes": 2,  "status": "ok"},
    {"categoria": "Equipamentos de Informática",      "quantidade": 34, "valor_total":  68000.00, "valor_liquido":  35700.00, "depreciacao_media_pct": 47.5, "inoperantes": 6,  "status": "critico"},
    {"categoria": "Veículos / Frota SMS",             "quantidade":  5, "valor_total": 520000.00, "valor_liquido": 338000.00, "depreciacao_media_pct": 35.0, "inoperantes": 1,  "status": "atencao"},
    {"categoria": "Equipamentos Odontológicos",       "quantidade": 12, "valor_total":  74000.00, "valor_liquido":  59200.00, "depreciacao_media_pct": 20.0, "inoperantes": 0,  "status": "ok"},
    {"categoria": "Eletrodomésticos / Climatização",  "quantidade": 28, "valor_total":  46000.00, "valor_liquido":  30800.00, "depreciacao_media_pct": 33.0, "inoperantes": 2,  "status": "atencao"},
]

_CRITICOS = [
    {"bem": "Autoclave 21L — UBS Central",        "estado": "inoperante",  "urgencia": "alta",  "unidade": "UBS Central Apuí",      "categoria": "Equip. Médico-Hosp.", "ano_aquisicao": 2017, "valor_aquisicao": 12800.00, "reparo_orcado": 3200.00,  "observacao": "Resistência queimada. Esterilização comprometida — usar autoclave reserva."},
    {"bem": "Raio-X 50mA portátil",               "estado": "manutencao",  "urgencia": "alta",  "unidade": "UBS Central Apuí",      "categoria": "Equip. Médico-Hosp.", "ano_aquisicao": 2019, "valor_aquisicao": 42000.00, "reparo_orcado": 8500.00,  "observacao": "Tubo com micro-fratura — em conserto por empresa credenciada ANVISA."},
    {"bem": "Ambulância VW Kombi (AFP-1204)",      "estado": "manutencao",  "urgencia": "alta",  "unidade": "Frota SMS",             "categoria": "Veículos / Frota",    "ano_aquisicao": 2016, "valor_aquisicao": 98000.00, "reparo_orcado": 14000.00, "observacao": "Motor necessita revisão geral. Cobertura zona rural comprometida."},
    {"bem": "Computador Dell (SCNES ESF Centro)",  "estado": "inoperante",  "urgencia": "media", "unidade": "ESF Centro",            "categoria": "Informática",         "ano_aquisicao": 2015, "valor_aquisicao":  3200.00, "reparo_orcado":    800.00, "observacao": "HD com defeito. Sistema e-SUS PEC indisponível nesta unidade."},
    {"bem": "Nebulizador ultrassônico UBS Central","estado": "inoperante",  "urgencia": "media", "unidade": "UBS Central Apuí",      "categoria": "Equip. Médico-Hosp.", "ano_aquisicao": 2018, "valor_aquisicao":  1800.00, "reparo_orcado":      0.00, "observacao": "Obsoleto — descarte recomendado. Substituição por novo modelo prevista."},
    {"bem": "Ar condicionado sala vacinas (ESF BN)","estado": "manutencao", "urgencia": "alta",  "unidade": "ESF Bairro Novo",       "categoria": "Climatização",        "ano_aquisicao": 2020, "valor_aquisicao":  4200.00, "reparo_orcado":  1200.00, "observacao": "Compressor com defeito — temperatura sala vacinas em risco. Urgente."},
]

_HISTORICO = [
    {"ano": 2021, "bens_tombados": 189, "valor_patrimonial": 980000.00,  "valor_liquido": 720000.00, "inventario_pct": 62.0, "inoperantes": 18},
    {"ano": 2022, "bens_tombados": 196, "valor_patrimonial": 1020000.00, "valor_liquido": 740000.00, "inventario_pct": 68.0, "inoperantes": 16},
    {"ano": 2023, "bens_tombados": 205, "valor_patrimonial": 1080000.00, "valor_liquido": 770000.00, "inventario_pct": 74.0, "inoperantes": 15},
    {"ano": 2024, "bens_tombados": 214, "valor_patrimonial": 1150000.00, "valor_liquido": 790000.00, "inventario_pct": 81.0, "inoperantes": 14},
    {"ano": 2025, "bens_tombados": 219, "valor_patrimonial": 1202000.00, "valor_liquido": 794900.00, "inventario_pct": 85.0, "inoperantes": 15},
]

_INDICADORES = [
    {"indicador": "Taxa de bens tombados com inventário atualizado", "valor": 85.0,      "meta": 90.0,      "unidade": "%",  "status": "atencao",  "observacao": "Faltam 15% de bens sem inventário confirmado. Meta: 90%."},
    {"indicador": "Valor patrimonial líquido total",                 "valor": 794900.00, "meta": None,      "unidade": "R$", "status": "ok",       "observacao": "Após depreciação calculada pelo método linear."},
    {"indicador": "Taxa de equipamentos médicos operantes",          "valor": 91.7,      "meta": 95.0,      "unidade": "%",  "status": "atencao",  "observacao": "4 de 48 equipamentos médico-hospitalares inoperantes."},
    {"indicador": "Taxa de bens sem plaqueta de tombamento",         "valor": 8.2,       "meta": 5.0,       "unidade": "%",  "status": "atencao",  "observacao": "18 bens sem plaqueta identificados no último inventário."},
    {"indicador": "Tempo médio resolução manutenção corretiva",      "valor": 22.0,      "meta": 15.0,      "unidade": "dias","status": "critico", "observacao": "Acima da meta de 15 dias. Falta de contrato de manutenção preventiva."},
    {"indicador": "Veículos frota operacionais",                     "valor": 80.0,      "meta": 85.0,      "unidade": "%",  "status": "atencao",  "observacao": "4 de 5 veículos operacionais — 1 ambulância em manutenção."},
]


@router.get("/dashboard")
async def dashboard():
    total_bens = sum(c["quantidade"] for c in _CATEGORIAS)
    valor_total = sum(c["valor_total"] for c in _CATEGORIAS)
    valor_liquido = sum(c["valor_liquido"] for c in _CATEGORIAS)
    inoperantes = sum(c["inoperantes"] for c in _CATEGORIAS)
    equip_medicos = next(c["quantidade"] for c in _CATEGORIAS if "Médico" in c["categoria"])
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "bens_tombados": total_bens,
        "valor_patrimonial_total": valor_total,
        "valor_liquido_total": valor_liquido,
        "investimento_equipamentos_ano": 78000.00,
        "equipamentos_medicos": equip_medicos,
        "equipamentos_inoperantes": inoperantes,
        "equipamentos_inoperantes_pct": round(100 * inoperantes / total_bens, 1),
        "bens_para_descarte": 3,
        "inventario_atualizado_pct": 85.0,
        "bens_sem_plaqueta": 18,
        "verificado_em": _TS,
    }


@router.get("/categorias")
async def categorias():
    return _CATEGORIAS


@router.get("/criticos")
async def criticos():
    return _CRITICOS


@router.get("/historico")
async def historico():
    return _HISTORICO


@router.get("/indicadores")
async def indicadores():
    return _INDICADORES
