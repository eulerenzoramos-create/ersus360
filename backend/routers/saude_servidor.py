"""
Saúde do Servidor — PCMSO · CAT · Afastamentos · Exames Periódicos · FMS Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-servidor", tags=["saude_servidor"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "servidores_sms_total": 218,
        "servidores_efetivos": 142,
        "servidores_contratos": 76,
        "afastamentos_mes": 12,
        "afastamentos_doenca_pct": 66.7,
        "cat_ano": 3,
        "exames_periodicos_pendentes": 38,
        "exames_periodicos_realizados_pct": 82.6,
        "vacinacao_servidores_pct": 91.2,
        "nota": "Referência baseada em parâmetros típicos SMS municípios amazônicos ~20 mil hab.",
    }


@router.get("/afastamentos")
async def afastamentos():
    return [
        {"situacao_dado": "referencia_municipal", "cid": "F41 – Ansiedade",              "casos": 4, "dias_perdidos": 48,  "categoria": "Saúde Mental",     "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "cid": "M54 – Dorsalgia",              "casos": 3, "dias_perdidos": 32,  "categoria": "Musculoesquelético","status": "atencao"},
        {"situacao_dado": "referencia_municipal", "cid": "J06 – IRA alta",               "casos": 2, "dias_perdidos": 10,  "categoria": "Respiratório",     "status": "ok"},
        {"situacao_dado": "referencia_municipal", "cid": "K29 – Gastrite",               "casos": 1, "dias_perdidos": 5,   "categoria": "Digestivo",        "status": "ok"},
        {"situacao_dado": "referencia_municipal", "cid": "Z76 – Acomp. saúde",           "casos": 1, "dias_perdidos": 3,   "categoria": "Outros",           "status": "ok"},
        {"situacao_dado": "referencia_municipal", "cid": "O26 – Gravidez de alto risco", "casos": 1, "dias_perdidos": 30,  "categoria": "Gestação",         "status": "ok"},
    ]


@router.get("/cat")
async def cat():
    return [
        {"situacao_dado": "referencia_municipal", "ano": 2024, "total_cat": 2, "com_afastamento": 1, "sem_afastamento": 1, "tipico": "Acidente perfurocortante (ACS domicílio)"},
        {"situacao_dado": "referencia_municipal", "ano": 2025, "total_cat": 4, "com_afastamento": 2, "sem_afastamento": 2, "tipico": "Acidente trânsito (moto) e lombalgias"},
        {"situacao_dado": "referencia_municipal", "ano": 2026, "total_cat": 3, "com_afastamento": 1, "sem_afastamento": 2, "tipico": "Acidente trânsito (moto) e queda"},
    ]


@router.get("/pcmso")
async def pcmso():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "pcmso_vigente": True,
        "responsavel_tecnico": "Médico do Trabalho — Contrato Externo (Humaitá)",
        "exames_periodicos_ano": 180,
        "exames_realizados": 142,
        "exames_pendentes": 38,
        "cobertura_pct": 78.9,
        "principais_riscos_identificados": [
            "Esforço físico (ACS) — lombalgia",
            "Agente biológico — HIV, Hepatite B (vacinação obrigatória)",
            "Estresse psicossocial — sobrecarga de trabalho",
            "Calor extremo — trabalho externo no campo",
            "Acidentes de trajeto (moto — única opção em comunidades rurais)",
        ],
        "vacinacao": {
            "hepatite_b_pct": 94.0,
            "influenza_pct": 91.2,
            "covid19_pct": 88.5,
            "tetano_pct": 86.0,
        },
        "nota": "Referência municipal Apuí/AM.",
    }


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "Afastamentos/mês",         "valor": 12,   "meta": 8,    "unidade": "afastos",    "status": "atencao", "observacao": "Saúde mental lidera (ansiedade — sobrecarga trabalho)."},
        {"situacao_dado": "referencia_municipal", "indicador": "Exames Periódicos OK (%)",  "valor": 78.9, "meta": 100,  "unidade": "%",          "status": "atencao", "observacao": "38 servidores com exame vencido — PCMSO em atraso."},
        {"situacao_dado": "referencia_municipal", "indicador": "CAT/ano",                   "valor": 3,    "meta": 0,    "unidade": "CAT",        "status": "atencao", "observacao": "Principal causa: acidente moto a serviço."},
        {"situacao_dado": "referencia_municipal", "indicador": "Vacinação Hep. B (%)",      "valor": 94.0, "meta": 100,  "unidade": "%",          "status": "atencao", "observacao": "Obrigatória para todos os profissionais de saúde."},
        {"situacao_dado": "referencia_municipal", "indicador": "Vacinação Influenza (%)",   "valor": 91.2, "meta": 100,  "unidade": "%",          "status": "atencao", "observacao": "Campanha anual — SMS lidera a vacinação."},
    ]
