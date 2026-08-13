"""
Router: /api/farmacia — Gestao da Assistencia Farmaceutica
Dados de referencia municipal para Apui/AM.
situacao_dado = "referencia_municipal" em todos os endpoints.
"""
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut
from typing import Optional

router = APIRouter(prefix="/api/farmacia", tags=["Farmacia"])


@router.get("/dashboard")
async def dashboard(_: UserOut = Depends(get_current_user)):
    """Dashboard Farmacia Municipal — referencia municipal Apui/AM."""
    return {
        "situacao_dado":                        "referencia_municipal",
        "municipio":                            "Apui/AM",
        "competencia":                          "Jun/2026",
        "total_medicamentos":                   214,
        "itens_criticos":                         8,
        "itens_zerados":                          3,
        "dispensacoes_mes":                     4_812,
        "usuarios_atendidos_mes":               1_847,
        "execucao_popular":                       72.3,
        "execucao_bnafar":                        68.9,
        "custo_basico_mes":                     48_200.0,
        "custo_especializado_mes":               6_840.0,
        "cobertura_rename_pct":                   91.6,
        "itens_vencimento_30d":                    12,
        "nota": "Referencia municipal — Farmacia Basica do FMS de Apui/AM (~21.781 hab).",
    }


@router.get("/estoque")
async def estoque(
    situacao: Optional[str] = Query(None, description="Filtro: ok | critico | zerado | excesso"),
    _: UserOut = Depends(get_current_user),
):
    """Estoque de medicamentos — referencia municipal Apui/AM."""
    itens = [
        {"id":  1, "nome": "Amoxicilina 500mg cps",           "principio_ativo": "Amoxicilina",           "forma_farmaceutica": "Capsulas",   "apresentacao": "500mg",  "estoque_atual":   480, "estoque_minimo":  600, "situacao": "critico",  "validade": "2026-09-30", "programa": "RENAME",      "demanda_mensal":  800, "dispensado_mes":  790, "ruptura_historica": True},
        {"id":  2, "nome": "Salbutamol spray 100mcg",          "principio_ativo": "Salbutamol",            "forma_farmaceutica": "Aerossol",    "apresentacao": "100mcg", "estoque_atual":    60, "estoque_minimo":  200, "situacao": "zerado",   "validade": "2026-12-31", "programa": "RENAME",      "demanda_mensal":  220, "dispensado_mes":  215, "ruptura_historica": True},
        {"id":  3, "nome": "Sulfato Ferroso 40mg comp",        "principio_ativo": "Sulfato Ferroso",       "forma_farmaceutica": "Comprimidos", "apresentacao": "40mg",   "estoque_atual":  1_200, "estoque_minimo": 1_500, "situacao": "critico", "validade": "2027-03-31", "programa": "RENAME",      "demanda_mensal": 1_800, "dispensado_mes": 1_750, "ruptura_historica": True},
        {"id":  4, "nome": "Azitromicina 500mg comp",          "principio_ativo": "Azitromicina",          "forma_farmaceutica": "Comprimidos", "apresentacao": "500mg",  "estoque_atual":   350, "estoque_minimo":  400, "situacao": "critico",  "validade": "2026-11-30", "programa": "RENAME",      "demanda_mensal":  420, "dispensado_mes":  408, "ruptura_historica": False},
        {"id":  5, "nome": "Metformina 850mg comp",            "principio_ativo": "Metformina",            "forma_farmaceutica": "Comprimidos", "apresentacao": "850mg",  "estoque_atual":  3_200, "estoque_minimo": 2_000, "situacao": "ok",      "validade": "2027-06-30", "programa": "HiperDia",    "demanda_mensal": 2_200, "dispensado_mes": 2_180, "ruptura_historica": False},
        {"id":  6, "nome": "Losartana 50mg comp",              "principio_ativo": "Losartana",             "forma_farmaceutica": "Comprimidos", "apresentacao": "50mg",   "estoque_atual":  4_800, "estoque_minimo": 3_000, "situacao": "ok",      "validade": "2027-08-31", "programa": "HiperDia",    "demanda_mensal": 3_200, "dispensado_mes": 3_150, "ruptura_historica": False},
        {"id":  7, "nome": "Atenolol 50mg comp",               "principio_ativo": "Atenolol",              "forma_farmaceutica": "Comprimidos", "apresentacao": "50mg",   "estoque_atual":  2_400, "estoque_minimo": 1_800, "situacao": "ok",      "validade": "2027-04-30", "programa": "HiperDia",    "demanda_mensal": 1_900, "dispensado_mes": 1_880, "ruptura_historica": False},
        {"id":  8, "nome": "Hidroclorotiazida 25mg comp",      "principio_ativo": "Hidroclorotiazida",     "forma_farmaceutica": "Comprimidos", "apresentacao": "25mg",   "estoque_atual":  2_100, "estoque_minimo": 1_500, "situacao": "ok",      "validade": "2027-05-31", "programa": "HiperDia",    "demanda_mensal": 1_600, "dispensado_mes": 1_590, "ruptura_historica": False},
        {"id":  9, "nome": "Glibenclamida 5mg comp",           "principio_ativo": "Glibenclamida",         "forma_farmaceutica": "Comprimidos", "apresentacao": "5mg",    "estoque_atual":   900, "estoque_minimo": 800,   "situacao": "ok",      "validade": "2027-01-31", "programa": "HiperDia",    "demanda_mensal":  850, "dispensado_mes":  840, "ruptura_historica": False},
        {"id": 10, "nome": "Captopril 25mg comp",              "principio_ativo": "Captopril",             "forma_farmaceutica": "Comprimidos", "apresentacao": "25mg",   "estoque_atual":  1_800, "estoque_minimo": 1_200, "situacao": "ok",      "validade": "2027-02-28", "programa": "HiperDia",    "demanda_mensal": 1_300, "dispensado_mes": 1_280, "ruptura_historica": False},
        {"id": 11, "nome": "Doxiciclina 100mg cps",            "principio_ativo": "Doxiciclina",           "forma_farmaceutica": "Capsulas",    "apresentacao": "100mg",  "estoque_atual":  1_200, "estoque_minimo": 600,   "situacao": "ok",      "validade": "2026-10-31", "programa": "Malaria",     "demanda_mensal":  500, "dispensado_mes":  487, "ruptura_historica": False},
        {"id": 12, "nome": "Cloroquina 150mg comp",            "principio_ativo": "Cloroquina",            "forma_farmaceutica": "Comprimidos", "apresentacao": "150mg",  "estoque_atual":  2_400, "estoque_minimo": 800,   "situacao": "excesso", "validade": "2027-09-30", "programa": "Malaria",     "demanda_mensal":  600, "dispensado_mes":  580, "ruptura_historica": False},
        {"id": 13, "nome": "Ivermectina 6mg comp",             "principio_ativo": "Ivermectina",           "forma_farmaceutica": "Comprimidos", "apresentacao": "6mg",    "estoque_atual":   840, "estoque_minimo": 500,   "situacao": "ok",      "validade": "2027-03-31", "programa": "Endemias",    "demanda_mensal":  480, "dispensado_mes":  462, "ruptura_historica": False},
        {"id": 14, "nome": "Acido Folico 5mg comp",            "principio_ativo": "Acido Folico",          "forma_farmaceutica": "Comprimidos", "apresentacao": "5mg",    "estoque_atual":  2_800, "estoque_minimo": 2_000, "situacao": "ok",      "validade": "2027-06-30", "programa": "Materno",     "demanda_mensal": 2_100, "dispensado_mes": 2_085, "ruptura_historica": False},
        {"id": 15, "nome": "Paracetamol 750mg comp",           "principio_ativo": "Paracetamol",           "forma_farmaceutica": "Comprimidos", "apresentacao": "750mg",  "estoque_atual":  6_200, "estoque_minimo": 3_000, "situacao": "excesso", "validade": "2027-07-31", "programa": "RENAME",      "demanda_mensal": 3_200, "dispensado_mes": 3_180, "ruptura_historica": False},
        {"id": 16, "nome": "Dipirona 500mg comp",              "principio_ativo": "Dipirona",              "forma_farmaceutica": "Comprimidos", "apresentacao": "500mg",  "estoque_atual":  5_400, "estoque_minimo": 3_000, "situacao": "excesso", "validade": "2027-08-31", "programa": "RENAME",      "demanda_mensal": 3_100, "dispensado_mes": 3_050, "ruptura_historica": False},
        {"id": 17, "nome": "Omeprazol 20mg cps",               "principio_ativo": "Omeprazol",             "forma_farmaceutica": "Capsulas",    "apresentacao": "20mg",   "estoque_atual":  2_800, "estoque_minimo": 2_200, "situacao": "ok",      "validade": "2027-04-30", "programa": "RENAME",      "demanda_mensal": 2_300, "dispensado_mes": 2_280, "ruptura_historica": False},
        {"id": 18, "nome": "Amitriptilina 25mg comp",          "principio_ativo": "Amitriptilina",         "forma_farmaceutica": "Comprimidos", "apresentacao": "25mg",   "estoque_atual":   420, "estoque_minimo": 400,   "situacao": "ok",      "validade": "2027-01-31", "programa": "Saude Mental","demanda_mensal":  410, "dispensado_mes":  398, "ruptura_historica": False},
        {"id": 19, "nome": "Carbonato de Calcio 500mg comp",   "principio_ativo": "Carbonato de Calcio",   "forma_farmaceutica": "Comprimidos", "apresentacao": "500mg",  "estoque_atual":  1_600, "estoque_minimo": 1_200, "situacao": "ok",      "validade": "2027-05-31", "programa": "RENAME",      "demanda_mensal": 1_250, "dispensado_mes": 1_230, "ruptura_historica": False},
        {"id": 20, "nome": "Prednisona 20mg comp",             "principio_ativo": "Prednisona",            "forma_farmaceutica": "Comprimidos", "apresentacao": "20mg",   "estoque_atual":     0, "estoque_minimo":  300, "situacao": "zerado",   "validade": None,          "programa": "RENAME",      "demanda_mensal":  290, "dispensado_mes":    0, "ruptura_historica": True},
    ]

    if situacao:
        itens = [i for i in itens if i["situacao"] == situacao]

    return itens


@router.get("/programas")
async def programas(_: UserOut = Depends(get_current_user)):
    """Programas de assistencia farmaceutica — referencia municipal Apui/AM."""
    return [
        {"programa": "HiperDia — Hipertensao e Diabetes",   "previsto": 12_000, "realizado":  9_876, "execucao": 82.3, "situacao": "atencao",  "pacientes_ativos":  418, "custo_mes_r":  9_876.0},
        {"programa": "RENAME — Medicamentos Essenciais",    "previsto": 24_000, "realizado": 18_480, "execucao": 77.0, "situacao": "atencao",  "pacientes_ativos": 1_240, "custo_mes_r": 18_480.0},
        {"programa": "Malaria — Endemias",                  "previsto":  3_600, "realizado":  3_124, "execucao": 86.8, "situacao": "ok",       "pacientes_ativos":   184, "custo_mes_r":  3_124.0},
        {"programa": "Farmacia Popular (FP)",                "previsto":  8_400, "realizado":  6_073, "execucao": 72.3, "situacao": "critico",  "pacientes_ativos":   312, "custo_mes_r":  6_073.0},
        {"programa": "Saude Mental",                        "previsto":  2_400, "realizado":  1_920, "execucao": 80.0, "situacao": "atencao",  "pacientes_ativos":    87, "custo_mes_r":  1_920.0},
        {"programa": "Materno-infantil (Pre-natal)",        "previsto":  3_200, "realizado":  2_984, "execucao": 93.3, "situacao": "ok",       "pacientes_ativos":   319, "custo_mes_r":  2_984.0},
        {"programa": "Endemias / Vigilancia",               "previsto":  1_800, "realizado":  1_620, "execucao": 90.0, "situacao": "ok",       "pacientes_ativos":   214, "custo_mes_r":  1_620.0},
    ]


@router.get("/dispensacoes")
async def dispensacoes(_: UserOut = Depends(get_current_user)):
    """Evolucao mensal de dispensacoes — referencia municipal 2026."""
    return [
        {"mes": "Jan/26", "total_dispensacoes": 4_512, "usuarios_atendidos": 1_712},
        {"mes": "Fev/26", "total_dispensacoes": 4_384, "usuarios_atendidos": 1_658},
        {"mes": "Mar/26", "total_dispensacoes": 4_621, "usuarios_atendidos": 1_801},
        {"mes": "Abr/26", "total_dispensacoes": 4_698, "usuarios_atendidos": 1_824},
        {"mes": "Mai/26", "total_dispensacoes": 4_756, "usuarios_atendidos": 1_839},
        {"mes": "Jun/26", "total_dispensacoes": 4_812, "usuarios_atendidos": 1_847},
    ]


@router.get("/alertas")
async def alertas(_: UserOut = Depends(get_current_user)):
    """Alertas farmaceuticos — referencia municipal Apui/AM."""
    return {
        "situacao_dado": "referencia_municipal",
        "total_alertas":  8,
        "alertas": [
            {"nivel": "CRITICO",  "item": "Salbutamol spray 100mcg",   "mensagem": "Estoque zerado — 60 unidades restantes, demanda 220/mes. Ruptura iminente.",             "acao_sugerida": "Solicitar compra emergencial ou redistribuicao"},
            {"nivel": "CRITICO",  "item": "Prednisona 20mg comp",       "mensagem": "Item zerado. Sem estoque atual. Ultima dispensacao ha 15 dias.",                         "acao_sugerida": "Iniciar processo de compra urgente"},
            {"nivel": "ATENCAO",  "item": "Amoxicilina 500mg cps",      "mensagem": "Estoque critico: 480 unidades (60% do minimo). Historico de ruptura.",                  "acao_sugerida": "Solicitar compra imediata"},
            {"nivel": "ATENCAO",  "item": "Sulfato Ferroso 40mg comp",  "mensagem": "Estoque 80% do minimo. Demanda alta — programa materno-infantil.",                      "acao_sugerida": "Verificar proxima entrega BNAFAR"},
            {"nivel": "ATENCAO",  "item": "Azitromicina 500mg comp",    "mensagem": "Estoque 87% do minimo. Sazonalidade respiratoria pode aumentar demanda.",               "acao_sugerida": "Monitorar consumo nas proximas 2 semanas"},
            {"nivel": "ATENCAO",  "item": "Farmacia Popular",           "mensagem": "Execucao 72.3% — abaixo da meta de 75%. Revisar cadastro de credenciados.",             "acao_sugerida": "Verificar credenciamento e divulgacao do programa"},
            {"nivel": "INFO",     "item": "Paracetamol 750mg comp",     "mensagem": "Estoque em excesso: 6.200 unidades (193% do minimo). Verificar validade.",              "acao_sugerida": "Redistribuir para outras UBS se possivel"},
            {"nivel": "INFO",     "item": "Vencimento proximo 30d",     "mensagem": "12 lotes com vencimento nos proximos 30 dias. Priorizar dispensacao.",                  "acao_sugerida": "Listar itens e monitorar rotatividade"},
        ],
    }
