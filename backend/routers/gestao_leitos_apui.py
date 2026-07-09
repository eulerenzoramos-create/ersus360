from fastapi import APIRouter

router = APIRouter(prefix="/api/gestao-leitos-apui", tags=["gestao_leitos_apui"])

_DASHBOARD = {
    "leitos_total": 38,
    "leitos_sus": 38,
    "leitos_uti": 0,
    "leitos_ocupados": 28,
    "taxa_ocupacao_pct": 73.7,
    "meta_ocupacao_pct_max": 85.0,
    "internacoes_mes": 148,
    "alta_mes": 138,
    "obito_hospitalar_mes": 2,
    "media_permanencia_dias": 5.8,
    "meta_permanencia_dias": 4.5,
    "aih_aprovadas_mes": 148,
    "aih_valor_medio_r": 842.0,
    "transferencias_saida_mes": 42,
    "status_leitos": "atencao",
}

_LEITOS_TIPO = [
    {"tipo": "Clínica Médica",          "total": 16, "ocupados": 13, "taxa_ocup": 81.3, "media_perm_dias": 5.2, "status": "atencao"},
    {"tipo": "Cirúrgico/Obs. Cirúrgica","total": 8,  "ocupados": 5,  "taxa_ocup": 62.5, "media_perm_dias": 4.8, "status": "ok"},
    {"tipo": "Pediatria",               "total": 6,  "ocupados": 4,  "taxa_ocup": 66.7, "media_perm_dias": 4.2, "status": "ok"},
    {"tipo": "Isolamento/Infecciosas",  "total": 4,  "ocupados": 4,  "taxa_ocup": 100.0,"media_perm_dias": 8.4, "status": "critico"},
    {"tipo": "Ginecologia/Obstetrícia", "total": 4,  "ocupados": 2,  "taxa_ocup": 50.0, "media_perm_dias": 3.8, "status": "ok"},
]

_PRINCIPAIS_CAUSAS_INTERNACAO = [
    {"cid_grupo": "J00–J99 — Respiratório",        "internacoes": 32, "pct": 21.6, "perm_media": 5.2},
    {"cid_grupo": "K00–K93 — Digestivo",           "internacoes": 24, "pct": 16.2, "perm_media": 4.8},
    {"cid_grupo": "A00–B99 — Infecciosas/Parasit.","internacoes": 22, "pct": 14.9, "perm_media": 7.2},
    {"cid_grupo": "S00–T98 — Traumatismos",        "internacoes": 18, "pct": 12.2, "perm_media": 6.4},
    {"cid_grupo": "I00–I99 — Cardiovascular",      "internacoes": 14, "pct": 9.5,  "perm_media": 5.8},
    {"cid_grupo": "B50–B54 — Malária",             "internacoes": 12, "pct": 8.1,  "perm_media": 4.2},
    {"cid_grupo": "E00–E90 — Endócrinas (DM)",     "internacoes": 10, "pct": 6.8,  "perm_media": 5.6},
    {"cid_grupo": "F00–F99 — Transtornos mentais", "internacoes": 8,  "pct": 5.4,  "perm_media": 8.8},
    {"cid_grupo": "Outras",                        "internacoes": 8,  "pct": 5.3,  "perm_media": 4.0},
]

_HISTORICO = [
    {"mes": "Jan/25", "internacoes": 128, "taxa_ocup": 68.4, "perm_media": 5.4, "transferencias": 36, "obitos": 1},
    {"mes": "Fev/25", "internacoes": 132, "taxa_ocup": 70.2, "perm_media": 5.6, "transferencias": 38, "obitos": 2},
    {"mes": "Mar/25", "internacoes": 138, "taxa_ocup": 71.8, "perm_media": 5.8, "transferencias": 40, "obitos": 1},
    {"mes": "Abr/25", "internacoes": 140, "taxa_ocup": 72.4, "perm_media": 5.8, "transferencias": 42, "obitos": 2},
    {"mes": "Mai/25", "internacoes": 144, "taxa_ocup": 73.1, "perm_media": 5.9, "transferencias": 41, "obitos": 2},
    {"mes": "Jun/25", "internacoes": 148, "taxa_ocup": 73.7, "perm_media": 5.8, "transferencias": 42, "obitos": 2},
]

_INDICADORES = [
    {"indicador": "UTI — leitos disponíveis",          "valor": 0,    "meta": 4,    "unidade": "leitos",  "status": "critico", "observacao": "Apuí não possui UTI — pacientes graves transferidos para Manaus (600 km de distância)"},
    {"indicador": "Leitos isolamento (100% ocupados)", "valor": 100.0,"meta": 85.0, "unidade": "%",       "status": "critico", "observacao": "4/4 leitos de isolamento ocupados — sem capacidade para surtos ou epidemias"},
    {"indicador": "Taxa de ocupação hospitalar",       "valor": 73.7, "meta": 85.0, "unidade": "%",       "status": "ok",      "observacao": "Dentro do intervalo ideal (70–85%). Risco de superlotação em surtos sazonais"},
    {"indicador": "Média de permanência",              "valor": 5.8,  "meta": 4.5,  "unidade": "dias",    "status": "atencao", "observacao": "29% acima da meta — internações por infecciosas e saúde mental com maior permanência"},
    {"indicador": "Transferências p/ Manaus/mês",      "valor": 42,   "meta": 20,   "unidade": "pacientes","status": "atencao","observacao": "42 transferências/mês — principalmente UTI, neurocirurgia, cardiologia intervencionista"},
    {"indicador": "Óbito hospitalar/mês",              "valor": 2,    "meta": None, "unidade": "óbitos",  "status": "atencao", "observacao": "Taxa de mortalidade hospitalar 1,35% — monitoramento contínuo do comitê de óbito"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/leitos-tipo")
def leitos_tipo():
    return _LEITOS_TIPO


@router.get("/causas-internacao")
def causas_internacao():
    return _PRINCIPAIS_CAUSAS_INTERNACAO


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
