from fastapi import APIRouter

router = APIRouter(prefix="/api/psicologia-aps-apui", tags=["Psicologia APS Apuí"])

@router.get("/dashboard")
def dashboard():
    return {
        "psicologos_nasf": 1,
        "psicologos_necessarios": 3,
        "atendimentos_mes": 184,
        "demanda_estimada_mes": 580,
        "cobertura_pct": 31.7,
        "lista_espera": 228,
        "tempo_espera_medio_dias": 84,
        "meta_espera_dias": 30,
        "transtornos_comuns_prevalencia_pct": 28.4,
        "burnout_servidores_saude_pct": 42.4,
        "sofrimento_psiq_acs_pct": 38.4,
        "grupos_terapeuticos_ativos": 2,
        "encaminhamentos_caps_mes": 28,
        "apoio_matricial_equipes_mes": 14,
        "status_cobertura": "critico",
        "status_espera": "critico",
    }

@router.get("/demanda")
def demanda():
    return [
        {"motivo": "Ansiedade / transtornos ansiosos (F40-F41)",
         "casos_mes": 82, "pct": 44.6, "atendidos_pct": 28.4, "status": "critico",
         "obs": "Principal demanda. Correlação com desemprego, isolamento rural e violência doméstica."},
        {"motivo": "Depressão (F32-F33)",
         "casos_mes": 48, "pct": 26.1, "atendidos_pct": 32.8, "status": "critico",
         "obs": "Subdiagnóstico frequente na APS. PHQ-9 não aplicado rotineiramente."},
        {"motivo": "Sofrimento psíquico por uso de álcool (F10)",
         "casos_mes": 28, "pct": 15.2, "atendidos_pct": 18.4, "status": "critico",
         "obs": "Referência ao CAPS I para tratamento especializado. Alta evasão (42%)."},
        {"motivo": "Violência doméstica / trauma (F43)",
         "casos_mes": 14, "pct": 7.6,  "atendidos_pct": 42.8, "status": "atencao",
         "obs": "Articulação com CRAS e DEAM. Atendimento prioritário pelo protocolo municipal."},
        {"motivo": "Sofrimento de profissionais de saúde",
         "casos_mes": 12, "pct": 6.5,  "atendidos_pct": 22.4, "status": "critico",
         "obs": "ACS e equipes ESF com burnout. Sem programa de saúde do trabalhador da saúde estruturado."},
    ]

@router.get("/acoes")
def acoes():
    return [
        {"acao": "Ampliação de psicólogos no NASF para 2 profissionais",
         "responsavel": "RH/FMS", "prazo": "2025-12", "status": "planejado",
         "descricao": "Aprovação de vaga em concurso público. Decreto de criação de cargo tramitando na Câmara."},
        {"acao": "Implantação de grupos terapêuticos na UBS Central",
         "responsavel": "NASF/FMS", "prazo": "2025-09", "status": "em_andamento",
         "descricao": "Grupo de ansiedade e grupo de luto. Capacidade: 15 pessoas/grupo/semana."},
        {"acao": "Apoio matricial sistemático a todas as equipes ESF",
         "responsavel": "Psicologia/NASF", "prazo": "2025-10", "status": "em_andamento",
         "descricao": "Matriciamento mensal para as 7 equipes. Meta: 100% com suporte em saúde mental."},
        {"acao": "Protocolo de rastreio de depressão na APS (PHQ-9)",
         "responsavel": "Gestão/FMS", "prazo": "2025-11", "status": "planejado",
         "descricao": "Aplicação em todos os adultos > 18 anos nas consultas de rotina."},
        {"acao": "Programa de saúde mental para servidores da FMS",
         "responsavel": "SESMT/FMS", "prazo": "2026-03", "status": "planejado",
         "descricao": "Rodas de conversa, supervisão clínica e apoio ao ACS. Meta: reduzir burnout de 42% para 25%."},
    ]

@router.get("/historico")
def historico():
    return [
        {"mes": "Jan/25", "atendimentos": 148, "lista_espera": 248, "grupos_realizados": 6,  "matriciamentos": 10},
        {"mes": "Fev/25", "atendimentos": 158, "lista_espera": 242, "grupos_realizados": 7,  "matriciamentos": 12},
        {"mes": "Mar/25", "atendimentos": 162, "lista_espera": 238, "grupos_realizados": 8,  "matriciamentos": 12},
        {"mes": "Abr/25", "atendimentos": 172, "lista_espera": 234, "grupos_realizados": 8,  "matriciamentos": 13},
        {"mes": "Mai/25", "atendimentos": 178, "lista_espera": 230, "grupos_realizados": 8,  "matriciamentos": 14},
        {"mes": "Jun/25", "atendimentos": 184, "lista_espera": 228, "grupos_realizados": 8,  "matriciamentos": 14},
    ]

@router.get("/indicadores")
def indicadores():
    return [
        {"indicador": "Cobertura de psicologia na APS",    "valor": 31.7, "unidade": "%",    "meta": 80,  "status": "critico",
         "observacao": "1 psicólogo para 19.788 hab. 68,3% da demanda sem atendimento."},
        {"indicador": "Tempo de espera para psicologia",   "valor": 84,   "unidade": "dias", "meta": 30,  "status": "critico",
         "observacao": "84 dias de espera média. 228 pacientes em lista de espera ativa."},
        {"indicador": "Burnout em servidores de saúde",    "valor": 42.4, "unidade": "%",    "meta": 15,  "status": "critico",
         "observacao": "42,4% dos servidores da FMS com sinais de burnout. ACS são o grupo mais afetado."},
        {"indicador": "Apoio matricial — equipes cobertas","valor": 4,    "unidade": "equipes","meta": 7,  "status": "atencao",
         "observacao": "4 de 7 equipes ESF com matriciamento mensal. 3 equipes do interior sem suporte."},
        {"indicador": "Prevalência de transtornos comuns", "valor": 28.4, "unidade": "%",    "meta": None,"status": "atencao",
         "observacao": "28,4% da população adulta com transtornos mentais comuns (ansiedade, depressão leve-moderada)."},
    ]
