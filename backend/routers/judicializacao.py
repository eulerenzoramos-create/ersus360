"""Judicialização da Saúde — Ações Judiciais · Medicamentos · Custos · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/judicializacao", tags=["judicializacao"])

@router.get("/dashboard")
async def dashboard():
    return {
        "acoes_ativas": 68,
        "acoes_novas_mes": 8,
        "acoes_encerradas_mes": 4,
        "custo_mensal_total": 84620.50,
        "custo_medicamentos": 62480.00,
        "custo_procedimentos": 18640.00,
        "custo_outros": 3500.50,
        "medidas_liminares_ativas": 42,
        "cumprimento_prazo_pct": 88.6,
        "meta_cumprimento_pct": 95,
        "municipio_desfavoravel_ano": 48,
        "municipio_favoravel_ano": 12,
        "status_geral": "atencao",
    }

@router.get("/acoes")
async def acoes():
    return [
        {"processo": "0001234-22.2024.8.04.0001","objeto": "Insulina Glargina 100UI/mL",      "autor": "M.A.S.", "valor_mes": 1840.00, "prazo_cumprimento": "5 dias",  "status": "cumprido",   "tipo": "Medicamento",   "liminar": True},
        {"processo": "0002847-18.2024.8.04.0001","objeto": "Cirurgia cardíaca (Manaus)",      "autor": "J.C.R.", "valor_mes": 28400.00,"prazo_cumprimento": "Imediato","status": "pendente",   "tipo": "Procedimento",  "liminar": True},
        {"processo": "0003621-44.2023.8.04.0001","objeto": "Adalimumabe 40mg",                "autor": "A.L.F.", "valor_mes": 4280.00, "prazo_cumprimento": "10 dias", "status": "cumprido",   "tipo": "Medicamento",   "liminar": True},
        {"processo": "0004182-09.2024.8.04.0001","objeto": "Lecanemab (Alzheimer)",           "autor": "I.R.M.", "valor_mes": 18640.00,"prazo_cumprimento": "15 dias", "status": "contestado", "tipo": "Medicamento",   "liminar": False},
        {"processo": "0005847-31.2024.8.04.0001","objeto": "Home care especializado",         "autor": "E.S.T.", "valor_mes": 8400.00, "prazo_cumprimento": "7 dias",  "status": "cumprido",   "tipo": "Serviço",       "liminar": True},
        {"processo": "0006241-77.2023.8.04.0001","objeto": "Oxigênio domiciliar",             "autor": "P.A.C.", "valor_mes": 1240.00, "prazo_cumprimento": "3 dias",  "status": "cumprido",   "tipo": "Insumo",        "liminar": True},
        {"processo": "0007394-52.2024.8.04.0001","objeto": "Cadeira de rodas motorizada",     "autor": "F.M.O.", "valor_mes": 0,        "prazo_cumprimento": "Em curso","status": "pendente",   "tipo": "Órtese/prótese","liminar": False},
        {"processo": "0008621-14.2024.8.04.0001","objeto": "Fórmula infantil especial",       "autor": "B.L.S.", "valor_mes": 840.00,  "prazo_cumprimento": "5 dias",  "status": "cumprido",   "tipo": "Nutrição",      "liminar": True},
    ]

@router.get("/medicamentos")
async def medicamentos():
    return [
        {"medicamento": "Adalimumabe 40mg",          "processos": 4, "custo_mes": 17120.00, "disponivel_rename": False, "relacao": "REMEME",    "status": "atencao"},
        {"medicamento": "Insulina Glargina 100UI/mL","processos": 6, "custo_mes": 11040.00, "disponivel_rename": True,  "relacao": "RENAME",    "status": "ok"},
        {"medicamento": "Lecanemab (Alzheimer)",     "processos": 1, "custo_mes": 18640.00, "disponivel_rename": False, "relacao": "Off-label", "status": "critico"},
        {"medicamento": "Secukinumabe",              "processos": 2, "custo_mes": 6480.00,  "disponivel_rename": False, "relacao": "REMEME",    "status": "atencao"},
        {"medicamento": "Eculizumabe",               "processos": 1, "custo_mes": 4840.00,  "disponivel_rename": False, "relacao": "PCDT",      "status": "atencao"},
        {"medicamento": "Terapia enzimática (Gaucher)","processos": 1,"custo_mes": 2840.00, "disponivel_rename": False, "relacao": "PCDT",      "status": "ok"},
        {"medicamento": "Outros",                    "processos": 8, "custo_mes": 1520.00,  "disponivel_rename": True,  "relacao": "Variado",   "status": "ok"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "acoes_ativas": 58, "custo_total": 72480, "novas": 6, "encerradas": 3, "cumprimento_pct": 86.4},
        {"mes": "Nov/25", "acoes_ativas": 61, "custo_total": 76240, "novas": 7, "encerradas": 4, "cumprimento_pct": 87.2},
        {"mes": "Dez/25", "acoes_ativas": 64, "custo_total": 78640, "novas": 6, "encerradas": 3, "cumprimento_pct": 87.8},
        {"mes": "Jan/26", "acoes_ativas": 66, "custo_total": 81240, "novas": 7, "encerradas": 5, "cumprimento_pct": 88.0},
        {"mes": "Fev/26", "acoes_ativas": 66, "custo_total": 82480, "novas": 8, "encerradas": 8, "cumprimento_pct": 88.4},
        {"mes": "Mar/26", "acoes_ativas": 68, "custo_total": 84620, "novas": 8, "encerradas": 4, "cumprimento_pct": 88.6},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Custo mensal com judicialização",   "valor": 84620,"meta": None,"unidade": "R$","status": "atencao", "observacao": "Crescimento de 16.7% em 6 meses"},
        {"indicador": "Cumprimento de prazos judiciais",   "valor": 88.6, "meta": 95, "unidade": "%", "status": "atencao", "observacao": "Meta Defensoria/PGM: ≥95% nos prazos"},
        {"indicador": "Ações com liminar ativa",           "valor": 61.8, "meta": None,"unidade": "%", "status": "atencao", "observacao": "42/68 ações — risco de multa diária"},
        {"indicador": "Medicamentos off-label judicializados","valor": 1,"meta": 0,  "unidade": "un","status": "critico",  "observacao": "Lecanemab: sem aprovação ANVISA — recurso prioritário"},
        {"indicador": "Câmara de resolução pré-judicial",  "valor": 12,   "meta": 20, "unidade": "%", "status": "atencao", "observacao": "Meta: ≥20% resolvidos antes do ingresso judicial"},
        {"indicador": "Desfechos favoráveis ao município", "valor": 20,   "meta": 30, "unidade": "%", "status": "atencao", "observacao": "12 favoráveis / 60 julgados — fortalecer jurídico"},
    ]
