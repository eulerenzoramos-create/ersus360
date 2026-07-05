"""Frota de Saúde — Veículos · Manutenção · Disponibilidade · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/frota", tags=["frota"])

@router.get("/dashboard")
async def dashboard():
    return {
        "total_veiculos": 24,
        "disponiveis": 18,
        "manutencao": 4,
        "inoperantes": 2,
        "disponibilidade_pct": 75.0,
        "meta_disponibilidade_pct": 85,
        "km_rodados_mes": 28640,
        "custo_combustivel_mes": 18420.50,
        "custo_manutencao_mes": 12840.00,
        "viagens_mes": 486,
        "pacientes_transportados_mes": 1284,
        "veiculos_vencidos_revisao": 5,
        "status_geral": "atencao",
    }

@router.get("/veiculos")
async def veiculos():
    return [
        {"placa": "PHI-2A48", "tipo": "Ambulância UTI Móvel",      "ano": 2021, "km_atual": 124840, "status": "disponivel",  "proxima_revisao_km": 130000, "combustivel": "Diesel",   "lotacao": "UPA 24h",          "observacao": None},
        {"placa": "PHI-3B12", "tipo": "Ambulância Básica",         "ano": 2020, "km_atual": 186420, "status": "disponivel",  "proxima_revisao_km": 190000, "combustivel": "Diesel",   "lotacao": "Hospital Mun.",    "observacao": None},
        {"placa": "PHI-4C88", "tipo": "Ambulância Básica",         "ano": 2019, "km_atual": 214860, "status": "manutencao",  "proxima_revisao_km": None,   "combustivel": "Diesel",   "lotacao": "Hospital Mun.",    "observacao": "Troca de amortecedores — prev. 3 dias"},
        {"placa": "PHI-5D24", "tipo": "Van 15 lugares",            "ano": 2022, "km_atual": 84240,  "status": "disponivel",  "proxima_revisao_km": 90000,  "combustivel": "Flex",     "lotacao": "TFD",              "observacao": None},
        {"placa": "PHI-6E56", "tipo": "Van 15 lugares",            "ano": 2021, "km_atual": 96480,  "status": "disponivel",  "proxima_revisao_km": 100000, "combustivel": "Flex",     "lotacao": "TFD",              "observacao": None},
        {"placa": "PHI-7F30", "tipo": "Micro-ônibus 28 lugares",   "ano": 2018, "km_atual": 312480, "status": "inoperante",  "proxima_revisao_km": None,   "combustivel": "Diesel",   "lotacao": "TFD",              "observacao": "Motor — aguardando licitação para reforma"},
        {"placa": "PHI-8G14", "tipo": "Carro passeio",             "ano": 2023, "km_atual": 48240,  "status": "disponivel",  "proxima_revisao_km": 50000,  "combustivel": "Flex",     "lotacao": "Vigilância Sanit.","observacao": None},
        {"placa": "PHI-9H72", "tipo": "Carro passeio",             "ano": 2020, "km_atual": 168420, "status": "manutencao",  "proxima_revisao_km": None,   "combustivel": "Flex",     "lotacao": "SMS",              "observacao": "Revisão preventiva 168.000 km"},
        {"placa": "PHI-0I44", "tipo": "Moto Honda CG",             "ano": 2022, "km_atual": 28480,  "status": "disponivel",  "proxima_revisao_km": 30000,  "combustivel": "Flex",     "lotacao": "ACS/ESF",          "observacao": None},
        {"placa": "PHI-1J88", "tipo": "Lancha (transporte fluvial)","ano": 2019, "km_atual": None,   "status": "inoperante",  "proxima_revisao_km": None,   "combustivel": "Gasolina", "lotacao": "Comunidades ribeirinhas","observacao": "Motor de popa — aguarda peças (60 dias)"},
    ]

@router.get("/manutencoes")
async def manutencoes():
    return [
        {"veiculo": "PHI-4C88", "tipo": "Corretiva", "servico": "Troca de amortecedores dianteiros", "valor": 2840.00, "oficina": "Auto Peças Apuí",     "prazo_dias": 3,  "status": "em_andamento"},
        {"veiculo": "PHI-8G14", "tipo": "Preventiva","servico": "Revisão 50.000 km (óleo, filtros, correia)", "valor": 1240.00, "oficina": "Concessionária Manaus","prazo_dias": 7, "status": "agendada"},
        {"veiculo": "PHI-9H72", "tipo": "Preventiva","servico": "Revisão 168.000 km",               "valor": 1840.00, "oficina": "Auto Mecânica Central", "prazo_dias": 2,  "status": "em_andamento"},
        {"veiculo": "PHI-7F30", "tipo": "Corretiva", "servico": "Reforma do motor — licitação",     "valor": 28400.00,"oficina": "A licitar",            "prazo_dias": 60, "status": "pendente"},
        {"veiculo": "PHI-1J88", "tipo": "Corretiva", "servico": "Motor de popa — peças importadas", "valor": 8400.00, "oficina": "Náutica Manaus",        "prazo_dias": 45, "status": "pendente"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "viagens": 428, "km": 24280, "pacientes": 1124, "disponibilidade_pct": 83.3, "custo_total": 28640},
        {"mes": "Nov/25", "viagens": 448, "km": 25840, "pacientes": 1184, "disponibilidade_pct": 87.5, "custo_total": 29840},
        {"mes": "Dez/25", "viagens": 386, "km": 22480, "pacientes": 1048, "disponibilidade_pct": 79.2, "custo_total": 26480},
        {"mes": "Jan/26", "viagens": 462, "km": 26840, "pacientes": 1212, "disponibilidade_pct": 83.3, "custo_total": 30280},
        {"mes": "Fev/26", "viagens": 472, "km": 27640, "pacientes": 1248, "disponibilidade_pct": 79.2, "custo_total": 31240},
        {"mes": "Mar/26", "viagens": 486, "km": 28640, "pacientes": 1284, "disponibilidade_pct": 75.0, "custo_total": 31260},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Disponibilidade da frota",           "valor": 75.0, "meta": 85,  "unidade": "%",   "status": "critico", "observacao": "2 inoperantes + 4 em manutenção = 6/24 indisponíveis"},
        {"indicador": "Veículos com revisão vencida",       "valor": 5,    "meta": 0,   "unidade": "un",  "status": "atencao", "observacao": "5 veículos com revisão preventiva atrasada"},
        {"indicador": "Custo médio por km",                 "valor": 1.08, "meta": 1.20,"unidade": "R$/km","status":"ok",        "observacao": "R$31.260 ÷ 28.640 km"},
        {"indicador": "Lancha fluvial inoperante",          "valor": 1,    "meta": 0,   "unidade": "un",  "status": "critico", "observacao": "Comunidades ribeirinhas sem transporte fluvial há 60d"},
        {"indicador": "Pacientes transportados/mês",        "valor": 1284, "meta": None, "unidade": "un",  "status": "ok",      "observacao": "TFD representa 68% dos transportes"},
    ]
