from fastapi import APIRouter

router = APIRouter(prefix="/api/banco-sangue-hemoterapia-apui", tags=["Banco de Sangue Apuí"])

@router.get("/dashboard")
def dashboard():
    return {
        "banco_sangue_local": False,
        "referencia_hemocentro": "Hemoam Manaus (690 km)",
        "coletas_ano": 84,
        "necessidade_estimada_bolsas": 480,
        "deficit_pct": 82.5,
        "transfusoes_emergenciais_ano": 38,
        "hemocomponentes_locais": 0,
        "doadores_cadastrados": 28,
        "taxa_doacao_por_mil": 0.34,
        "meta_oms_doacao_por_mil": 10.0,
        "bolsas_descartadas_pct": 12.4,
        "status_banco": "critico",
        "campanha_ativa": False,
        "transfusoes_suspensas_mes_anterior": 4,
    }

@router.get("/componentes")
def componentes():
    return [
        {"componente": "Concentrado de Hemácias",      "disponivel_local": False, "estoque_bolsas": 0,
         "necessidade_mensal": 28, "fonte": "Hemoam Manaus", "status": "critico",
         "observacao": "100% dependente de envio de Manaus. Prazo médio 48–72h em emergência."},
        {"componente": "Plasma Fresco Congelado",       "disponivel_local": False, "estoque_bolsas": 0,
         "necessidade_mensal": 8,  "fonte": "Hemoam Manaus", "status": "critico",
         "observacao": "Disponível apenas para casos eletivos via regulação."},
        {"componente": "Concentrado de Plaquetas",      "disponivel_local": False, "estoque_bolsas": 0,
         "necessidade_mensal": 4,  "fonte": "Hemoam Manaus", "status": "critico",
         "observacao": "Validade de 5 dias — impossível manter estoque no município."},
        {"componente": "Crioprecipitado",               "disponivel_local": False, "estoque_bolsas": 0,
         "necessidade_mensal": 2,  "fonte": "Hemoam Manaus", "status": "critico",
         "observacao": "Utilizado em hemofilia e coagulopatias."},
        {"componente": "Albumina humana",               "disponivel_local": False, "estoque_bolsas": 0,
         "necessidade_mensal": 6,  "fonte": "SCTIE/Manaus", "status": "critico",
         "observacao": "Via APAC. Atraso médio de 28 dias para liberação."},
    ]

@router.get("/campanhas")
def campanhas():
    return [
        {"campanha": "Doe Sangue — Dia Mundial do Doador (Jun/2025)",
         "data": "2025-06-14", "coletas": 18, "descartadas": 2, "aproveitadas": 16,
         "status": "encerrada", "observacao": "Única campanha realizada em 2025 até o momento."},
        {"campanha": "Campanha Carnaval (Fev/2025)",
         "data": "2025-02-28", "coletas": 12, "descartadas": 3, "aproveitadas": 9,
         "status": "encerrada", "observacao": "Realizada em parceria com UPA."},
        {"campanha": "Campanha Volta às Aulas (Jan/2025)",
         "data": "2025-01-20", "coletas": 8,  "descartadas": 0, "aproveitadas": 8,
         "status": "encerrada", "observacao": "Foco em servidores municipais."},
        {"campanha": "2º Semestre 2025 (planejada)",
         "data": "2025-10-01", "coletas": 0, "descartadas": 0, "aproveitadas": 0,
         "status": "planejada", "observacao": "Parceria com Hemoam prevista. Meta: 40 doações."},
    ]

@router.get("/historico")
def historico():
    return [
        {"ano": 2022, "coletas": 58, "transfusoes": 28, "doadores_ativos": 14, "descartadas_pct": 18.4},
        {"ano": 2023, "coletas": 68, "transfusoes": 32, "doadores_ativos": 18, "descartadas_pct": 14.8},
        {"ano": 2024, "coletas": 76, "transfusoes": 36, "doadores_ativos": 22, "descartadas_pct": 13.2},
        {"ano": 2025, "coletas": 84, "transfusoes": 38, "doadores_ativos": 28, "descartadas_pct": 12.4},
    ]

@router.get("/indicadores")
def indicadores():
    return [
        {"indicador": "Banco de sangue local",          "valor": 0,    "unidade": "unid.", "meta": 1,   "status": "critico",
         "observacao": "Inexistente. Município 100% dependente de Manaus para hemocomponentes."},
        {"indicador": "Taxa de doação voluntária",      "valor": 0.34, "unidade": "/1000 hab", "meta": 10, "status": "critico",
         "observacao": "Meta OMS de 10 doações/1000 hab. Apuí: 0,34 — 97% abaixo da meta."},
        {"indicador": "Déficit de hemocomponentes",     "valor": 82.5, "unidade": "%", "meta": 0,   "status": "critico",
         "observacao": "Apenas 82 bolsas coletadas de 480 necessárias/ano. Cirurgias eletivas suspensas por falta."},
        {"indicador": "Transfusões suspensas (últ. mês)","valor": 4,  "unidade": "casos", "meta": 0, "status": "critico",
         "observacao": "4 transfusões necessárias não realizadas no mês anterior por indisponibilidade de estoque."},
        {"indicador": "Bolsas descartadas",             "valor": 12.4, "unidade": "%", "meta": 5,   "status": "atencao",
         "observacao": "12,4% das bolsas coletadas descartadas por falhas no processamento ou sorologias reagentes."},
    ]
