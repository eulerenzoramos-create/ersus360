from fastapi import APIRouter

router = APIRouter(prefix="/api/laboratorio-apui", tags=["laboratorio_apui"])

_DASHBOARD = {
    "exames_realizados_mes": 2840,
    "exames_realizados_ano": 32480,
    "exames_proprios_pct": 62.4,
    "exames_terceirizados_pct": 37.6,
    "tempo_medio_laudo_dias": 4.2,
    "meta_laudo_dias": 2.0,
    "exames_criticos_mes": 84,
    "exames_fora_prazo_pct": 18.4,
    "cobertura_populacao_pct": 68.4,
    "equipamentos_funcionando_pct": 78.4,
    "equipamentos_manutencao": 2,
    "reativos_em_falta_itens": 4,
    "participacao_controle_qualidade": True,
    "lacen_envios_mes": 22,
    "status_prazo": "atencao",
    "status_equipamentos": "atencao",
}

_EXAMES_GRUPO = [
    {"grupo": "Hematologia (hemograma, coagulograma)", "realizados_mes": 684, "pct": 24.1, "tempo_dias": 1.0, "proprio": True,  "status": "ok"},
    {"grupo": "Bioquímica (glicose, ureia, creatinina)","realizados_mes": 528, "pct": 18.6, "tempo_dias": 1.0, "proprio": True,  "status": "ok"},
    {"grupo": "Imunologia (sorologias, HIV, sífilis)",  "realizados_mes": 364, "pct": 12.8, "tempo_dias": 2.0, "proprio": True,  "status": "ok"},
    {"grupo": "Parasitologia (coproparasitológico, TBS)","realizados_mes": 312,"pct": 11.0,"tempo_dias": 2.0, "proprio": True,  "status": "ok"},
    {"grupo": "Malária (gota espessa / TDR)",           "realizados_mes": 284, "pct": 10.0, "tempo_dias": 0.5, "proprio": True,  "status": "ok"},
    {"grupo": "Urinálise (EQU, urocultura)",            "realizados_mes": 248, "pct": 8.7,  "tempo_dias": 3.0, "proprio": True,  "status": "ok"},
    {"grupo": "Microbiologia (culturas bacterianas)",   "realizados_mes": 148, "pct": 5.2,  "tempo_dias": 7.0, "proprio": True,  "status": "atencao"},
    {"grupo": "Anatomopatológico (biópsia, PAAF)",      "realizados_mes": 84,  "pct": 3.0,  "tempo_dias": 21.0,"proprio": False, "status": "atencao"},
    {"grupo": "Hormônios / endocrinologia",             "realizados_mes": 96,  "pct": 3.4,  "tempo_dias": 8.0, "proprio": False, "status": "atencao"},
    {"grupo": "Genética / biologia molecular",          "realizados_mes": 42,  "pct": 1.5,  "tempo_dias": 30.0,"proprio": False, "status": "critico"},
    {"grupo": "Outros",                                 "realizados_mes": 50,  "pct": 1.7,  "tempo_dias": 5.0, "proprio": True,  "status": "ok"},
]

_EQUIPAMENTOS = [
    {"equipamento": "Analisador hematológico (celula. auto.)", "funcionando": True,  "ultimo_calibre": "Jun/25", "garantia": "2026", "status": "ok"},
    {"equipamento": "Analisador bioquímico (semiautomático)",  "funcionando": True,  "ultimo_calibre": "Mai/25", "garantia": "2025", "status": "atencao"},
    {"equipamento": "Microscópio trinocular (gota espessa)",   "funcionando": True,  "ultimo_calibre": "Jun/25", "garantia": "2027", "status": "ok"},
    {"equipamento": "Centrífuga laboratorial",                 "funcionando": False, "ultimo_calibre": "Mar/25", "garantia": "N/A",  "status": "critico"},
    {"equipamento": "Autoclave para esterilização",            "funcionando": True,  "ultimo_calibre": "Abr/25", "garantia": "2026", "status": "ok"},
    {"equipamento": "Estufa bacteriológica",                   "funcionando": True,  "ultimo_calibre": "Jan/25", "garantia": "2024", "status": "atencao"},
    {"equipamento": "Banho-maria",                             "funcionando": False, "ultimo_calibre": "Fev/25", "garantia": "N/A",  "status": "critico"},
    {"equipamento": "Leitora de ELISA",                        "funcionando": True,  "ultimo_calibre": "Jun/25", "garantia": "2027", "status": "ok"},
]

_HISTORICO = [
    {"mes": "Jan/25", "realizados": 2524, "criticos": 68,  "fora_prazo_pct": 20.4, "terceiriz": 37.8},
    {"mes": "Fev/25", "realizados": 2612, "criticos": 72,  "fora_prazo_pct": 19.8, "terceiriz": 37.6},
    {"mes": "Mar/25", "realizados": 2698, "criticos": 76,  "fora_prazo_pct": 19.2, "terceiriz": 37.8},
    {"mes": "Abr/25", "realizados": 2748, "criticos": 78,  "fora_prazo_pct": 18.8, "terceiriz": 37.4},
    {"mes": "Mai/25", "realizados": 2798, "criticos": 82,  "fora_prazo_pct": 18.6, "terceiriz": 37.6},
    {"mes": "Jun/25", "realizados": 2840, "criticos": 84,  "fora_prazo_pct": 18.4, "terceiriz": 37.6},
]

_INDICADORES = [
    {"indicador": "Tempo médio de laudo",                "valor": 4.2,  "meta": 2.0,   "unidade": "dias",  "status": "atencao", "observacao": "Laudo 2× acima da meta — microbiologia (7d) e anatomopatológico (21d) puxam a média. Terceirização sem SLA claro"},
    {"indicador": "Exames fora do prazo",                "valor": 18.4, "meta": 5.0,   "unidade": "%",     "status": "atencao", "observacao": "18,4% dos exames com resultado atrasado — impacta conduta clínica e pode gerar dano ao paciente"},
    {"indicador": "Equipamentos em manutenção",          "valor": 2,    "meta": 0,     "unidade": "equip.","status": "atencao", "observacao": "Centrífuga e banho-maria parados — exames dependentes ficam represados ou terceirizados com custo adicional"},
    {"indicador": "Reativos em falta",                   "valor": 4,    "meta": 0,     "unidade": "itens", "status": "atencao", "observacao": "4 itens de reativo em desabastecimento — hormônios e sorologias específicas afetadas"},
    {"indicador": "Cobertura da população",              "valor": 68.4, "meta": 90.0,  "unidade": "%",     "status": "atencao", "observacao": "31,6% sem acesso regular a exames — populações ribeirinhas e indígenas com coleta apenas em mutirões"},
    {"indicador": "Envios ao LACEN/mês",                 "valor": 22,   "meta": None,  "unidade": "amostras","status": "ok",   "observacao": "22 amostras/mês enviadas ao LACEN-AM (Manaus) — resultado retorna em 7–30 dias dependendo do exame"},
]


@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/exames-grupo")
def exames_grupo():
    return _EXAMES_GRUPO


@router.get("/equipamentos")
def equipamentos():
    return _EQUIPAMENTOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
