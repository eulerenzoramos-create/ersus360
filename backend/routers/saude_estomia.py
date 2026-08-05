"""Saúde da Pessoa com Ostomia e Cateterismo · FMS Apuí/AM"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-estomia", tags=["saude_estomia"])

@lru_cache(maxsize=1)
def _PACIENTES():
    return [
        {"tipo": "Colostomia",           "n": 28, "pct": 37.3, "provisoria": 8,  "definitiva": 20, "motivo_principal": "Câncer colorretal", "status": "ok"},
        {"tipo": "Urostomia",            "n": 12, "pct": 16.0, "provisoria": 3,  "definitiva": 9,  "motivo_principal": "Câncer de bexiga",  "status": "ok"},
        {"tipo": "Ileostomia",           "n": 10, "pct": 13.3, "provisoria": 6,  "definitiva": 4,  "motivo_principal": "Doença de Crohn/retocolite", "status": "atencao"},
        {"tipo": "Cateterismo vesical intermitente", "n": 18, "pct": 24.0, "provisoria": 0, "definitiva": 18, "motivo_principal": "Bexiga neurogênica/lesão medular", "status": "ok"},
        {"tipo": "Traqueostomia",        "n": 7,  "pct": 9.3,  "provisoria": 2,  "definitiva": 5,  "motivo_principal": "Obstrução/AVC/TCE",  "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _INSUMOS():
    return [
        {"insumo": "Bolsa coletora 1 peça — opaca",    "consumo_mes": 420, "estoque_atual": 840,  "meses_estoque": 2.0, "status": "atencao"},
        {"insumo": "Bolsa coletora 2 peças — placa",   "consumo_mes": 180, "estoque_atual": 720,  "meses_estoque": 4.0, "status": "ok"},
        {"insumo": "Bolsa urostomia",                   "consumo_mes": 72,  "estoque_atual": 288,  "meses_estoque": 4.0, "status": "ok"},
        {"insumo": "Sonda uretral intermitente 14Fr",   "consumo_mes": 108, "estoque_atual": 108,  "meses_estoque": 1.0, "status": "critico"},
        {"insumo": "Pasta protetora periostomia",       "consumo_mes": 50,  "estoque_atual": 100,  "meses_estoque": 2.0, "status": "atencao"},
        {"insumo": "Filtro carvão ativado p/ bolsa",    "consumo_mes": 280, "estoque_atual": 560,  "meses_estoque": 2.0, "status": "atencao"},
        {"insumo": "Cânula de traqueostomia (adulto)",  "consumo_mes": 14,  "estoque_atual": 42,   "meses_estoque": 3.0, "status": "ok"},
    ]


@router.get("/dashboard")
async def dashboard():
    total = sum(p["n"] for p in _PACIENTES())
    criticos_insumo = sum(1 for i in _INSUMOS() if i["status"] == "critico")
    atencao_insumo  = sum(1 for i in _INSUMOS() if i["status"] == "atencao")
    return {
        "pacientes_cadastrados": total,
        "novos_cadastros_mes": 4,
        "altas_mes": 1,
        "colostomias": 28,
        "urostomias": 12,
        "cateterismo_vesical": 18,
        "traqueostomias": 7,
        "consultas_estomaterapia_mes": 62,
        "visitas_domiciliares_mes": 18,
        "insumos_criticos": criticos_insumo,
        "insumos_atencao": atencao_insumo,
        "fornecimento_insumos_pct": 94.2,
        "complicacoes_periostomia_mes": 6,
        "internacoes_por_complicacao_mes": 2,
        "status_geral": "atencao",
        "competencia": "Jun/2026",
    }

@router.get("/pacientes")
async def pacientes():
    return _PACIENTES

@router.get("/insumos")
async def insumos():
    return _INSUMOS

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "pacientes": 68, "novos": 3, "consultas": 54, "complicacoes": 5, "internacoes": 1, "fornecimento_pct": 96.0},
        {"mes": "Fev/26", "pacientes": 69, "novos": 4, "consultas": 56, "complicacoes": 5, "internacoes": 1, "fornecimento_pct": 95.5},
        {"mes": "Mar/26", "pacientes": 71, "novos": 4, "consultas": 58, "complicacoes": 6, "internacoes": 2, "fornecimento_pct": 95.0},
        {"mes": "Abr/26", "pacientes": 72, "novos": 3, "consultas": 59, "complicacoes": 6, "internacoes": 2, "fornecimento_pct": 94.8},
        {"mes": "Mai/26", "pacientes": 74, "novos": 4, "consultas": 61, "complicacoes": 6, "internacoes": 2, "fornecimento_pct": 94.5},
        {"mes": "Jun/26", "pacientes": 75, "novos": 4, "consultas": 62, "complicacoes": 6, "internacoes": 2, "fornecimento_pct": 94.2},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Pacientes com ostomia/cateterismo cadastrados",      "valor": 75,  "meta": None, "unidade": "n",  "status": "ok",      "observacao": "Cobertura estimada 95% — programa municipal reconhecido como referência regional"},
        {"indicador": "Fornecimento de insumos especializados",             "valor": 94.2,"meta": 100.0,"unidade": "%",  "status": "atencao", "observacao": "Sonda uretral 14Fr com estoque crítico (1 mês) — pedido de reposição em andamento"},
        {"indicador": "Complicações periostomia/cateter por mês",          "valor": 6,   "meta": 2,    "unidade": "n",  "status": "atencao", "observacao": "Dermatite periostomia lidera — orientação e troca de pasta protetora em 4 casos"},
        {"indicador": "Internações por complicação de ostomia/cateter",     "valor": 2,   "meta": 0,    "unidade": "n/mês","status": "atencao","observacao": "2 internações em Jun/26 — 1 por obstrução ileal e 1 por ITU de repetição"},
        {"indicador": "Consultas de estomaterapia/mês",                    "valor": 62,  "meta": 75,   "unidade": "n",  "status": "atencao", "observacao": "Apenas 1 estomaterapeuta — tempo de espera médio 18 dias para consulta de rotina"},
        {"indicador": "Pacientes com traqueostomia em cuidado domiciliar", "valor": 5,   "meta": None, "unidade": "n",  "status": "atencao", "observacao": "5 traqueostomizados — 2 dependem de aspirador elétrico domiciliar; 1 sem fornecimento regular"},
    ]
