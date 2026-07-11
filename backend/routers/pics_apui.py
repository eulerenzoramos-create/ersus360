from fastapi import APIRouter
router = APIRouter()

@router.get("/api/pics-apui/dashboard")
def pics_dashboard():
    return {
        "praticas_implantadas": 7,
        "praticas_meta_pnpic": 10,
        "profissionais_habilitados": 9,
        "atendimentos_ano": 2840,
        "atendimentos_mes_atual": 248,
        "usuarios_cadastrados": 1240,
        "acupuntura_disponivel": True,
        "fitoterapia_disponivel": True,
        "meditacao_disponivel": True,
        "auriculoterapia_disponivel": True,
        "yoga_disponivel": False,
        "homeopatia_disponivel": False,
        "plantas_horto_qtd": 42,
        "remedio_fitoterapico_disponiveis": 14,
        "reducao_medicamentos_convencionais_pct": 28.4,
        "satisfacao_usuario_pct": 91.2,
    }

@router.get("/api/pics-apui/praticas")
def pics_praticas():
    return [
        {
            "pratica": "Acupuntura",
            "profissional": "1 médico acupunturista (RPA)",
            "atendimentos_mes": 82,
            "indicacoes_principais": ["Dor crônica","Lombalgia","Ansiedade","Enxaqueca"],
            "disponibilidade": "Quinzenal (2x/mês) — médico de Manaus",
            "lista_espera": 68,
            "status": "atencao",
        },
        {
            "pratica": "Fitoterapia / Plantas Medicinais",
            "profissional": "2 farmacêuticos treinados",
            "atendimentos_mes": 84,
            "indicacoes_principais": ["HAS leve","Ansiedade","Gastrite","Insônia","Gripe"],
            "disponibilidade": "Diária — CAF e UBS Central",
            "lista_espera": 0,
            "status": "ok",
        },
        {
            "pratica": "Auriculoterapia",
            "profissional": "4 enfermeiros habilitados",
            "atendimentos_mes": 48,
            "indicacoes_principais": ["Ansiedade","Tabagismo","Dor","Insônia"],
            "disponibilidade": "3x/semana — UBS Central",
            "lista_espera": 14,
            "status": "ok",
        },
        {
            "pratica": "Meditação / Mindfulness",
            "profissional": "2 psicólogos e 1 educador físico",
            "atendimentos_mes": 56,
            "indicacoes_principais": ["Estresse","Ansiedade","Burnout","Hipertensão"],
            "disponibilidade": "2x/semana — CAPS e UBS",
            "lista_espera": 8,
            "status": "ok",
        },
        {
            "pratica": "Terapia Comunitária Integrativa (TCI)",
            "profissional": "1 assistente social + 1 enfermeiro",
            "atendimentos_mes": 32,
            "indicacoes_principais": ["Sofrimento mental","Violência doméstica","Luto","Isolamento"],
            "disponibilidade": "Semanal — CAPS e comunidades",
            "lista_espera": 0,
            "status": "ok",
        },
        {
            "pratica": "Arteterapia / Musicoterapia",
            "profissional": "1 terapeuta ocupacional",
            "atendimentos_mes": 28,
            "indicacoes_principais": ["Saúde mental","Saúde da criança","Reabilitação"],
            "disponibilidade": "2x/semana — CAPS Infanto",
            "lista_espera": 0,
            "status": "ok",
        },
        {
            "pratica": "Práticas Corporais (Dança Circular, Automassagem)",
            "profissional": "1 educador físico + 1 enfermeiro",
            "atendimentos_mes": 44,
            "indicacoes_principais": ["Idosos","DCNT","Saúde mental","Obesidade"],
            "disponibilidade": "3x/semana — UBS e Academia da Saúde",
            "lista_espera": 0,
            "status": "ok",
        },
    ]

@router.get("/api/pics-apui/horto")
def pics_horto():
    return [
        {"planta": "Erva-cidreira (Melissa officinalis)",     "indicacao": "Ansiedade e insônia",    "forma": "Chá",          "disponivel": True},
        {"planta": "Boldo (Plectranthus barbatus)",            "indicacao": "Dispepsia e gastrite",  "forma": "Tintura/Chá",  "disponivel": True},
        {"planta": "Espinheira-santa (Maytenus ilicifolia)",   "indicacao": "Úlcera/gastrite",       "forma": "Cápsula/Chá",  "disponivel": True},
        {"planta": "Babosa (Aloe vera)",                       "indicacao": "Cicatrização e queimaduras","forma": "Gel",     "disponivel": True},
        {"planta": "Copaíba (Copaifera sp.)",                  "indicacao": "Anti-inflamatório",     "forma": "Óleo/cápsula","disponivel": True},
        {"planta": "Açaí (Euterpe oleracea)",                  "indicacao": "Anemia — suplementação","forma": "Polpa",      "disponivel": True},
        {"planta": "Andiroba (Carapa guianensis)",             "indicacao": "Repelente natural / anti-inflamatório","forma": "Óleo","disponivel": True},
        {"planta": "Unha-de-gato (Uncaria tomentosa)",        "indicacao": "Imunomodulação / artrite","forma": "Cápsula",   "disponivel": True},
    ]

@router.get("/api/pics-apui/historico")
def pics_historico():
    return [
        {"ano": 2022, "atendimentos": 840,  "praticas": 3, "usuarios": 420,  "reducao_med_pct": 12.0},
        {"ano": 2023, "atendimentos": 1480, "praticas": 5, "usuarios": 720,  "reducao_med_pct": 19.0},
        {"ano": 2024, "atendimentos": 2240, "praticas": 6, "usuarios": 1040, "reducao_med_pct": 24.0},
        {"ano": 2025, "atendimentos": 2840, "praticas": 7, "usuarios": 1240, "reducao_med_pct": 28.4},
    ]

@router.get("/api/pics-apui/indicadores")
def pics_indicadores():
    return [
        {"indicador": "Práticas PNPIC Implantadas",            "valor": 7,    "meta": 10,   "unidade": "práticas","status": "atencao","observacao": "Faltam: Homeopatia, Yoga, Termalismo — ausência de profissionais habilitados"},
        {"indicador": "Atendimentos/Ano",                      "valor": 2840, "meta": 2400, "unidade": "atend.",  "status": "ok",     "observacao": "Meta superada — alta demanda por fitoterapia (plantas amazônicas disponíveis localmente)"},
        {"indicador": "Redução Uso de Medicamentos Conv.",      "valor": 28.4, "meta": 20.0, "unidade": "%",      "status": "ok",     "observacao": "28,4% dos usuários PICS reduziram medicamentos convencionais — economia de R$ 48k/ano"},
        {"indicador": "Satisfação do Usuário",                 "valor": 91.2, "meta": 85.0, "unidade": "%",      "status": "ok",     "observacao": "Alta satisfação — PICS é porta de entrada para comunidades que resistem à medicina ocidental"},
        {"indicador": "Lista de Espera Acupuntura",            "valor": 68,   "meta": 15,   "unidade": "pessoas","status": "critico","observacao": "Acupunturista só 2x/mês — fila crescente; indicar para médico de família com treinamento"},
        {"indicador": "Plantas no Horto Medicinal",            "valor": 42,   "meta": 50,   "unidade": "espécies","status": "atencao","observacao": "Horto no HMM-Apuí com plantas amazônicas — ampliar com parceria com comunidades indígenas"},
    ]
