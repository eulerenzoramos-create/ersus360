"""Contratos — Gestão de Contratos e Convênios da Saúde · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/contratos", tags=["contratos"])

@router.get("/dashboard")
async def dashboard():
    return {
        "contratos_ativos": 38,
        "valor_total_mensal": 284600.00,
        "contratos_vencendo_30d": 5,
        "contratos_vencidos": 2,
        "fornecedores_ativos": 28,
        "empenhos_mes": 68,
        "medicamentos_pct": 41.2,
        "servicos_terceiros_pct": 28.4,
        "equipamentos_pct": 18.6,
        "obras_pct": 11.8,
        "execucao_orcamentaria_pct": 84.6,
        "status_geral": "atencao",
    }

@router.get("/contratos")
async def contratos():
    return [
        {"contrato": "FMS-001/2025", "objeto": "Fornecimento de medicamentos — COMBASE",    "fornecedor": "Farmed Distribuidora Ltda",    "valor_mensal": 68400.00,  "inicio": "01/01/2025", "termino": "31/12/2025", "saldo_pct": 92.4, "status": "ativo",    "categoria": "medicamentos"},
        {"contrato": "FMS-002/2025", "objeto": "Serviços laboratoriais — exames básicos",    "fornecedor": "Labormed Diagnósticos",        "valor_mensal": 24800.00,  "inicio": "01/03/2025", "termino": "28/02/2026", "saldo_pct": 78.6, "status": "ativo",    "categoria": "servicos"},
        {"contrato": "FMS-003/2025", "objeto": "Locação de veículos para saúde",            "fornecedor": "AM Fleet Amazonas Ltda",       "valor_mensal": 18600.00,  "inicio": "01/02/2025", "termino": "31/01/2026", "saldo_pct": 65.2, "status": "ativo",    "categoria": "servicos"},
        {"contrato": "FMS-004/2024", "objeto": "Manutenção de equipamentos médicos",        "fornecedor": "TechMed Soluções AM",          "valor_mensal": 12400.00,  "inicio": "01/07/2024", "termino": "30/06/2025", "saldo_pct": 4.2,  "status": "vencendo", "categoria": "equipamentos"},
        {"contrato": "FMS-005/2025", "objeto": "Fornecimento de material hospitalar",       "fornecedor": "Cirúrgica São Marcos",         "valor_mensal": 16800.00,  "inicio": "01/04/2025", "termino": "31/03/2026", "saldo_pct": 74.8, "status": "ativo",    "categoria": "material"},
        {"contrato": "FMS-006/2024", "objeto": "Serviços de vigilância 24h UPA",           "fornecedor": "Segurança AM Proteção Ltda",   "valor_mensal": 8400.00,   "inicio": "01/08/2024", "termino": "31/07/2025", "saldo_pct": 12.6, "status": "vencendo", "categoria": "servicos"},
        {"contrato": "FMS-007/2025", "objeto": "Contrato de radiologia digital",            "fornecedor": "Imagem Diagnóstica AM",        "valor_mensal": 14200.00,  "inicio": "01/05/2025", "termino": "30/04/2026", "saldo_pct": 82.4, "status": "ativo",    "categoria": "servicos"},
        {"contrato": "FMS-008/2024", "objeto": "Reforma estrutural UBS Zona Rural",        "fornecedor": "Construtora Norte AM Ltda",    "valor_mensal": 0,          "inicio": "01/09/2024", "termino": "28/02/2025", "saldo_pct": 0,    "status": "vencido",  "categoria": "obras"},
        {"contrato": "FMS-009/2024", "objeto": "Aquisição de microscópios e autoclaves",    "fornecedor": "Equipar Med Distribuidora",    "valor_mensal": 0,          "inicio": "01/10/2024", "termino": "31/03/2025", "saldo_pct": 0,    "status": "vencido",  "categoria": "equipamentos"},
        {"contrato": "FMS-010/2025", "objeto": "Software gestão e-SUS PEC",                "fornecedor": "DATASUS / Governo Federal",    "valor_mensal": 0,          "inicio": "01/01/2025", "termino": "31/12/2025", "saldo_pct": 100,  "status": "ativo",    "categoria": "ti"},
    ]

@router.get("/fornecedores")
async def fornecedores():
    return [
        {"fornecedor": "Farmed Distribuidora Ltda",    "contratos_ativos": 3, "valor_total_mes": 68400.00, "avaliacao": 8.6, "ocorrencias": 0, "categoria": "medicamentos", "registro_anvisa": True},
        {"fornecedor": "Labormed Diagnósticos",        "contratos_ativos": 1, "valor_total_mes": 24800.00, "avaliacao": 7.8, "ocorrencias": 1, "categoria": "laboratorio",  "registro_anvisa": True},
        {"fornecedor": "AM Fleet Amazonas Ltda",       "contratos_ativos": 1, "valor_total_mes": 18600.00, "avaliacao": 7.2, "ocorrencias": 2, "categoria": "transporte",   "registro_anvisa": False},
        {"fornecedor": "TechMed Soluções AM",          "contratos_ativos": 2, "valor_total_mes": 12400.00, "avaliacao": 8.1, "ocorrencias": 0, "categoria": "equipamentos", "registro_anvisa": True},
        {"fornecedor": "Cirúrgica São Marcos",         "contratos_ativos": 2, "valor_total_mes": 16800.00, "avaliacao": 8.4, "ocorrencias": 0, "categoria": "material",     "registro_anvisa": True},
        {"fornecedor": "Segurança AM Proteção Ltda",   "contratos_ativos": 1, "valor_total_mes": 8400.00,  "avaliacao": 6.4, "ocorrencias": 3, "categoria": "vigilancia",   "registro_anvisa": False},
        {"fornecedor": "Imagem Diagnóstica AM",        "contratos_ativos": 1, "valor_total_mes": 14200.00, "avaliacao": 9.0, "ocorrencias": 0, "categoria": "radiologia",   "registro_anvisa": True},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "valor_empenhado": 248600, "valor_pago": 234200, "contratos_ativos": 34, "novos": 2, "encerrados": 1},
        {"mes": "Nov/25", "valor_empenhado": 256400, "valor_pago": 241800, "contratos_ativos": 35, "novos": 3, "encerrados": 2},
        {"mes": "Dez/25", "valor_empenhado": 268200, "valor_pago": 258600, "contratos_ativos": 36, "novos": 2, "encerrados": 1},
        {"mes": "Jan/26", "valor_empenhado": 274800, "valor_pago": 268400, "contratos_ativos": 37, "novos": 2, "encerrados": 1},
        {"mes": "Fev/26", "valor_empenhado": 278400, "valor_pago": 272600, "contratos_ativos": 38, "novos": 3, "encerrados": 2},
        {"mes": "Mar/26", "valor_empenhado": 284600, "valor_pago": 278200, "contratos_ativos": 38, "novos": 1, "encerrados": 1},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Contratos vencidos sem renovação",     "valor": 2,    "meta": 0,   "unidade": "un","status": "critico",  "observacao": "FMS-008 (obra UBS rural) e FMS-009 (equipamentos) — sem processo de renovação"},
        {"indicador": "Contratos vencendo em 30 dias",        "valor": 5,    "meta": 0,   "unidade": "un","status": "atencao",  "observacao": "Processo licitatório em andamento para 3 deles"},
        {"indicador": "Execução orçamentária mensal",         "valor": 84.6, "meta": 90,  "unidade": "%", "status": "atencao",  "observacao": "R$278.200 pagos de R$284.600 empenhados"},
        {"indicador": "Ocorrências graves — fornecedores",    "valor": 3,    "meta": 0,   "unidade": "un","status": "atencao",  "observacao": "Segurança AM: 3 ocorrências no contrato de vigilância"},
        {"indicador": "Regularidade fiscal de fornecedores",  "valor": 92.8, "meta": 100, "unidade": "%", "status": "atencao",  "observacao": "2 fornecedores com certidões vencidas"},
        {"indicador": "Processos com licitação regular",      "valor": 100,  "meta": 100, "unidade": "%", "status": "ok",       "observacao": "Todos os contratos com processo licitatório documentado"},
    ]
