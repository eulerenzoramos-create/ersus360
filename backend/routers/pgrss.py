"""PGRSS — Plano de Gerenciamento de Resíduos de Serviços de Saúde · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/pgrss", tags=["pgrss"])

@router.get("/dashboard")
async def dashboard():
    return {
        "residuos_total_kg_mes": 2840,
        "residuos_infectantes_kg_mes": 1420,
        "residuos_quimicos_kg_mes": 186,
        "residuos_comuns_kg_mes": 1234,
        "perfurocortantes_caixas_mes": 84,
        "autoclave_funcionando": True,
        "coleta_terceirizada": True,
        "empresa_coleta": "Bioservice AM",
        "ultima_coleta_dias": 3,
        "proxima_coleta_dias": 4,
        "conformidade_pct": 78.4,
        "status_geral": "atencao",
        "nao_conformidades_mes": 6,
        "residuos_per_capita_kg_leito": 45.8,
    }

@router.get("/grupos")
async def grupos():
    return [
        {"grupo": "A — Infectantes",        "descricao": "Materiais biológicos, placenta, hemoderivados", "kg_mes": 1420,"coleta": "Diária",   "armazenamento": "Abrigo externo refrigerado", "destino": "Autoclave + aterro classe II", "conformidade_pct": 88.2, "status": "ok"},
        {"grupo": "B — Químicos",           "descricao": "Quimioterápicos, reagentes, mercúrio",          "kg_mes": 186, "coleta": "Quinzenal","armazenamento": "Sala exclusiva ventilada",   "destino": "Co-processamento — Manaus",    "conformidade_pct": 72.4, "status": "atencao", "alerta": "Armazenamento de mercúrio ainda em gaveta — não conforme"},
        {"grupo": "D — Comuns",             "descricao": "Resíduos administrativos e de varrição",        "kg_mes": 1234,"coleta": "Diária",   "armazenamento": "Contentor externo",          "destino": "Aterro municipal",             "conformidade_pct": 91.6, "status": "ok"},
        {"grupo": "E — Perfurocortantes",   "descricao": "Agulhas, lancetas, lâminas, vidros",            "kg_mes": 0,   "coleta": "Quinzenal","armazenamento": "Caixas rígidas ≤3/4",       "destino": "Co-processamento — Manaus",    "conformidade_pct": 86.4, "status": "ok",      "caixas_mes": 84},
        {"grupo": "C — Radioativos",        "descricao": "Materiais com radiação ionizante",              "kg_mes": 0,   "coleta": "Mensal",   "armazenamento": "Sala blindada — N/A Apuí",  "destino": "N/A — sem serviço nuclear",    "conformidade_pct": 100,  "status": "ok"},
    ]

@router.get("/nao-conformidades")
async def nao_conformidades():
    return [
        {"id": "NC-001", "descricao": "Resíduo infectante em saco comum (preto)",       "local": "Clínica Médica",   "data": "28/03/26", "gravidade": "alta",  "corrigida": False, "prazo": "02/04/26"},
        {"id": "NC-002", "descricao": "Caixa de perfurocortante com >3/4 de capacidade","local": "UPA",              "data": "27/03/26", "gravidade": "media", "corrigida": True,  "prazo": "28/03/26"},
        {"id": "NC-003", "descricao": "Mercúrio em gaveta sem recipiente adequado",     "local": "Farmácia",         "data": "26/03/26", "gravidade": "alta",  "corrigida": False, "prazo": "31/03/26"},
        {"id": "NC-004", "descricao": "Rótulo ilegível em bomba de quimioterápico",     "local": "Ambulatório",      "data": "25/03/26", "gravidade": "media", "corrigida": False, "prazo": "01/04/26"},
        {"id": "NC-005", "descricao": "Abrigo externo com porta sem fechamento",        "local": "Hospital",         "data": "24/03/26", "gravidade": "alta",  "corrigida": False, "prazo": "28/03/26"},
        {"id": "NC-006", "descricao": "Coletor de perfurocortante sem identificação",   "local": "ESF Central",      "data": "22/03/26", "gravidade": "baixa", "corrigida": True,  "prazo": "25/03/26"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "infectantes": 1280,"quimicos": 168,"comuns": 1148,"perfurocortantes_cx": 76, "conformidade": 74.2, "nc": 8},
        {"mes": "Nov/25", "infectantes": 1310,"quimicos": 172,"comuns": 1182,"perfurocortantes_cx": 78, "conformidade": 75.8, "nc": 7},
        {"mes": "Dez/25", "infectantes": 1260,"quimicos": 160,"comuns": 1120,"perfurocortantes_cx": 72, "conformidade": 76.4, "nc": 8},
        {"mes": "Jan/26", "infectantes": 1380,"quimicos": 178,"comuns": 1210,"perfurocortantes_cx": 82, "conformidade": 77.2, "nc": 7},
        {"mes": "Fev/26", "infectantes": 1400,"quimicos": 182,"comuns": 1224,"perfurocortantes_cx": 84, "conformidade": 77.8, "nc": 6},
        {"mes": "Mar/26", "infectantes": 1420,"quimicos": 186,"comuns": 1234,"perfurocortantes_cx": 84, "conformidade": 78.4, "nc": 6},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Conformidade geral PGRSS",         "valor": 78.4, "meta": 90,  "unidade": "%",    "status": "atencao", "observacao": "Grupos B e A com pendências"},
        {"indicador": "Não conformidades abertas",        "valor": 4,    "meta": 0,   "unidade": "un",   "status": "atencao", "observacao": "4 de alta gravidade não corrigidas"},
        {"indicador": "Geração resíduos/leito/dia",       "valor": 45.8, "meta": 40,  "unidade": "kg",   "status": "atencao", "observacao": "Acima da média AM de 38 kg/leito/dia"},
        {"indicador": "Segregação correta (auditoria)",   "valor": 84.2, "meta": 95,  "unidade": "%",    "status": "atencao", "observacao": "Treinamento necessário — Clínica Médica"},
        {"indicador": "Capacitação ReSS — funcionários",  "valor": 68.4, "meta": 90,  "unidade": "%",    "status": "critico", "observacao": "31% sem treinamento obrigatório"},
        {"indicador": "Autoclave funcionamento",          "valor": 100,  "meta": 100, "unidade": "%",    "status": "ok",      "observacao": "Manutenção preventiva em dia"},
    ]
