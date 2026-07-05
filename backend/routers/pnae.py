"""PNAE — Programa Nacional de Alimentação Escolar · FNDE · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/pnae", tags=["pnae"])

@router.get("/dashboard")
async def dashboard():
    return {
        "alunos_beneficiados": 4286,
        "escolas_atendidas": 28,
        "repasse_fnde_mensal": 38640.00,
        "repasse_fnde_anual": 463680.00,
        "contrapartida_municipal_pct": 30.0,
        "valor_per_capita_dia": 0.53,
        "meta_per_capita_dia": 0.53,
        "cardapios_aprovados_pct": 92.8,
        "nutricionistas_responsaveis": 2,
        "agricultores_da_local_pct": 34.6,
        "meta_da_local_pct": 30.0,
        "amostras_laboratorio_ok_pct": 88.2,
        "escolas_sem_nutri_visita_mes": 6,
        "status_geral": "atencao",
    }

@router.get("/escolas")
async def escolas():
    return [
        {"escola": "EMEF São José",          "tipo": "Municipal Urbana",  "alunos": 486, "refeicoes_dia": 3, "nutricionista_visita_mes": True,  "cardapio_aprovado": True,  "agricultora_local_pct": 42.0, "status": "ok"},
        {"escola": "EMEF Nossa Sra Auxiliadora","tipo": "Municipal Urbana","alunos": 412, "refeicoes_dia": 2, "nutricionista_visita_mes": True,  "cardapio_aprovado": True,  "agricultora_local_pct": 38.0, "status": "ok"},
        {"escola": "EEF Apuí",               "tipo": "Estadual Urbana",   "alunos": 628, "refeicoes_dia": 2, "nutricionista_visita_mes": True,  "cardapio_aprovado": True,  "agricultora_local_pct": 28.0, "status": "ok"},
        {"escola": "EMEF Zona Rural KM 180", "tipo": "Municipal Rural",   "alunos": 124, "refeicoes_dia": 3, "nutricionista_visita_mes": False, "cardapio_aprovado": True,  "agricultora_local_pct": 68.0, "status": "atencao"},
        {"escola": "EMEF Gleba Nova Olinda", "tipo": "Municipal Rural",   "alunos": 86,  "refeicoes_dia": 3, "nutricionista_visita_mes": False, "cardapio_aprovado": False, "agricultora_local_pct": 72.0, "status": "atencao"},
        {"escola": "EMEF Comunidade Forquilha","tipo": "Municipal Rural",  "alunos": 48,  "refeicoes_dia": 3, "nutricionista_visita_mes": False, "cardapio_aprovado": True,  "agricultora_local_pct": 84.0, "status": "atencao"},
        {"escola": "EMEF Ribeirinha S. Francisco","tipo": "Municipal Ribeirinha","alunos": 38, "refeicoes_dia": 3, "nutricionista_visita_mes": False, "cardapio_aprovado": False, "agricultora_local_pct": 90.0, "status": "critico"},
    ]

@router.get("/fornecedores")
async def fornecedores():
    return [
        {"fornecedor": "COOPAM — Cooperativa Agricultores AM", "tipo": "Agricultura Familiar/DAP", "produtos": ["hortaliças","frutas","tubérculos"],    "valor_contrato_mensal": 8640.00,  "entregas_no_prazo_pct": 92.4, "dap_regularizada": True,  "certificado_organico": False, "status": "ok"},
        {"fornecedor": "Assoc. Produtores Vale do Juma",        "tipo": "Agricultura Familiar/DAP", "produtos": ["legumes","ovos","farinha"],            "valor_contrato_mensal": 4320.00,  "entregas_no_prazo_pct": 88.6, "dap_regularizada": True,  "certificado_organico": False, "status": "ok"},
        {"fornecedor": "Distribuidora Norte AM Alimentos Ltda", "tipo": "Licitação Regular",        "produtos": ["grãos","massas","enlatados","óleo"],  "valor_contrato_mensal": 18640.00, "entregas_no_prazo_pct": 78.4, "dap_regularizada": False, "certificado_organico": False, "status": "atencao"},
        {"fornecedor": "Padaria São João",                      "tipo": "Micro Empresa Local",      "produtos": ["pão","biscoito"],                     "valor_contrato_mensal": 3200.00,  "entregas_no_prazo_pct": 96.0, "dap_regularizada": False, "certificado_organico": False, "status": "ok"},
        {"fornecedor": "Pesca Rio Madeira — Comunidade",        "tipo": "Agricultura Familiar/DAP", "produtos": ["peixe fresco","tambaqui"],            "valor_contrato_mensal": 3840.00,  "entregas_no_prazo_pct": 82.0, "dap_regularizada": True,  "certificado_organico": False, "status": "atencao"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "alunos": 4248, "repasse_fnde": 38200, "da_local_pct": 30.2, "cardapios_ok_pct": 88.4, "amostras_ok_pct": 84.6},
        {"mes": "Nov/25", "alunos": 4260, "repasse_fnde": 38320, "da_local_pct": 31.8, "cardapios_ok_pct": 90.2, "amostras_ok_pct": 86.8},
        {"mes": "Dez/25", "alunos": 4272, "repasse_fnde": 38440, "da_local_pct": 32.4, "cardapios_ok_pct": 92.0, "amostras_ok_pct": 86.2},
        {"mes": "Jan/26", "alunos": 4280, "repasse_fnde": 38520, "da_local_pct": 33.6, "cardapios_ok_pct": 91.4, "amostras_ok_pct": 87.4},
        {"mes": "Fev/26", "alunos": 4282, "repasse_fnde": 38560, "da_local_pct": 33.8, "cardapios_ok_pct": 92.4, "amostras_ok_pct": 87.8},
        {"mes": "Mar/26", "alunos": 4286, "repasse_fnde": 38640, "da_local_pct": 34.6, "cardapios_ok_pct": 92.8, "amostras_ok_pct": 88.2},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Escolas rurais sem visita do nutricionista",  "valor": 6,    "meta": 0,   "unidade": "un","status": "atencao",  "observacao": "2 nutricionistas para 28 escolas — zona rural prejudicada"},
        {"indicador": "Cardápios sem aprovação técnica",             "valor": 2,    "meta": 0,   "unidade": "un","status": "atencao",  "observacao": "EMEF Gleba Nova Olinda e EMEF Ribeirinha S. Francisco"},
        {"indicador": "Aquisição da Agricultura Familiar",           "valor": 34.6, "meta": 30,  "unidade": "%", "status": "ok",       "observacao": "Acima do mínimo legal (30%) — R$13.370/mês via DAP"},
        {"indicador": "Amostras laboratoriais conformes",            "valor": 88.2, "meta": 95,  "unidade": "%", "status": "atencao",  "observacao": "Análise microbiológica: 3 não conformidades em hortaliças"},
        {"indicador": "Repasse FNDE executado",                      "valor": 100,  "meta": 100, "unidade": "%", "status": "ok",       "observacao": "R$38.640/mês — 4.286 alunos × R$0,53/dia"},
        {"indicador": "Prestação de contas FNDE",                    "valor": 100,  "meta": 100, "unidade": "%", "status": "ok",       "observacao": "SIGPC/FNDE — prestação anual em dia"},
    ]
