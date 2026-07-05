"""Academia da Saúde — PNPS · Atividade Física · Práticas Corporais · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/academia-saude", tags=["academia_saude"])

@router.get("/dashboard")
async def dashboard():
    return {
        "polos_ativos": 3,
        "polos_cadastrados": 4,
        "polo_inativo": 1,
        "usuarios_cadastrados": 1_284,
        "usuarios_ativos_mes": 864,
        "frequencia_media_semana": 3.2,
        "modalidades_ofertadas": 12,
        "profissionais_ef_vinculados": 4,
        "profissionais_ef_meta": 4,
        "meta_usuarios_2026": 1_500,
        "cobertura_pct": 85.6,
        "grupos_especiais": 284,
        "custo_mensal": 18_400.00,
        "status_geral": "atencao",
        "competencia": "Jun/2026",
    }

@router.get("/polos")
async def polos():
    return [
        {
            "id": 1, "nome": "Polo Academia da Saúde — Centro", "localizacao": "Av. Sete de Setembro, s/n",
            "area_m2": 480, "status": "ativo", "usuarios_cadastrados": 540, "usuarios_ativos": 380,
            "frequencia_media": 3.8, "profissional_ef": "Prof. Marcos Antônio", "carga_horaria": 40,
            "infraestrutura": {"vestiario": True, "cobertura": True, "equipamentos_aerobicos": 12, "equipamentos_musculacao": 18, "quadra": True, "bebedouro": True},
            "modalidades": ["Musculação","Aeróbica","Yoga","Hidroginástica (piscina municipal)","Dança de salão","Alongamento"],
            "horarios": "Seg–Sex: 06h–09h e 16h–20h · Sáb: 07h–11h",
        },
        {
            "id": 2, "nome": "Polo Academia da Saúde — Kennedy", "localizacao": "Praça do Kennedy",
            "area_m2": 320, "status": "ativo", "usuarios_cadastrados": 384, "usuarios_ativos": 284,
            "frequencia_media": 3.2, "profissional_ef": "Prof.ª Aline Souza", "carga_horaria": 40,
            "infraestrutura": {"vestiario": False, "cobertura": True, "equipamentos_aerobicos": 8, "equipamentos_musculacao": 10, "quadra": False, "bebedouro": True},
            "modalidades": ["Musculação","Aeróbica","Pilates","Zumba","Caminhada orientada"],
            "horarios": "Seg–Sex: 06h–09h e 16h–19h · Sáb: 07h–10h",
        },
        {
            "id": 3, "nome": "Polo Academia da Saúde — Linha 7", "localizacao": "Centro Comunitário Linha 7",
            "area_m2": 240, "status": "ativo", "usuarios_cadastrados": 248, "usuarios_ativos": 164,
            "frequencia_media": 2.4, "profissional_ef": "Prof. Ronaldo Dias", "carga_horaria": 20,
            "infraestrutura": {"vestiario": False, "cobertura": True, "equipamentos_aerobicos": 4, "equipamentos_musculacao": 6, "quadra": False, "bebedouro": True},
            "modalidades": ["Ginástica Funcional","Alongamento","Caminhada orientada","Dança"],
            "horarios": "Ter/Qui/Sáb: 07h–10h",
        },
        {
            "id": 4, "nome": "Polo Academia da Saúde — Vila Progresso", "localizacao": "UBS Vila Progresso",
            "area_m2": 180, "status": "inativo", "usuarios_cadastrados": 112, "usuarios_ativos": 0,
            "frequencia_media": 0, "profissional_ef": None, "carga_horaria": 0,
            "infraestrutura": {"vestiario": False, "cobertura": False, "equipamentos_aerobicos": 2, "equipamentos_musculacao": 0, "quadra": False, "bebedouro": False},
            "modalidades": [],
            "horarios": "INATIVO — aguardando contratação de Profissional de EF",
        },
    ]

@router.get("/grupos-especiais")
async def grupos_especiais():
    return [
        {"grupo": "Hipertensos e diabéticos",   "usuarios": 128, "polo": "Centro",     "profissional": "Prof. Marcos Antônio",  "dias": "Ter/Qui", "horario": "08h–09h", "encaminhamentos_ubs": True},
        {"grupo": "Idosos (≥60 anos)",           "usuarios": 84,  "polo": "Centro",     "profissional": "Prof.ª Aline Souza",    "dias": "Seg/Qua/Sex", "horario": "07h–08h", "encaminhamentos_ubs": False},
        {"grupo": "Gestantes — atividade segura","usuarios": 28,  "polo": "Kennedy",    "profissional": "Prof.ª Aline Souza",    "dias": "Ter/Qui",   "horario": "09h–10h", "encaminhamentos_ubs": True},
        {"grupo": "Reabilitação pós-cirúrgica",  "usuarios": 24,  "polo": "Centro",     "profissional": "Prof. Marcos Antônio",  "dias": "Seg/Qua",   "horario": "16h–17h", "encaminhamentos_ubs": True},
        {"grupo": "Saúde Mental — CAPS",         "usuarios": 20,  "polo": "Kennedy",    "profissional": "Prof.ª Aline Souza",    "dias": "Sex",       "horario": "15h–16h", "encaminhamentos_ubs": True},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan/26", "usuarios_ativos": 720, "novas_matriculas": 84, "frequencia_media": 2.8, "eventos_pnps": 1},
        {"mes": "Fev/26", "usuarios_ativos": 764, "novas_matriculas": 68, "frequencia_media": 3.0, "eventos_pnps": 2},
        {"mes": "Mar/26", "usuarios_ativos": 800, "novas_matriculas": 72, "frequencia_media": 3.1, "eventos_pnps": 1},
        {"mes": "Abr/26", "usuarios_ativos": 820, "novas_matriculas": 48, "frequencia_media": 3.2, "eventos_pnps": 3},
        {"mes": "Mai/26", "usuarios_ativos": 848, "novas_matriculas": 60, "frequencia_media": 3.2, "eventos_pnps": 2},
        {"mes": "Jun/26", "usuarios_ativos": 864, "novas_matriculas": 56, "frequencia_media": 3.2, "eventos_pnps": 2},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Usuários ativos/mês",              "valor": 864,   "meta": 1_500, "unidade": "n",  "status": "atencao", "observacao": "57.6% da meta 2026 — Polo Vila Progresso inativo reduz potencial"},
        {"indicador": "Frequência média/semana",           "valor": 3.2,   "meta": 4.0,   "unidade": "vis","status": "atencao", "observacao": "Polo Linha 7 com frequência mais baixa (2.4) — distância e transporte"},
        {"indicador": "Polos ativos",                      "valor": 3,     "meta": 4,     "unidade": "n",  "status": "atencao", "observacao": "Polo Vila Progresso inativo desde Mar/26 — vaga PEF em processo seletivo"},
        {"indicador": "Grupos especiais atendidos",        "valor": 284,   "meta": 300,   "unidade": "n",  "status": "atencao", "observacao": "Grupo gestantes e CAPS com maior lista de espera"},
        {"indicador": "Profissionais EF contratados",      "valor": 4,     "meta": 4,     "unidade": "n",  "status": "ok",      "observacao": "Quadro completo considerando polo inativo — 3 em 40h, 1 em 20h"},
        {"indicador": "Eventos PNPS realizados/ano",       "valor": 11,    "meta": 24,    "unidade": "n",  "status": "atencao", "observacao": "Caminhada da Saúde e Dia do Movimento as modalidades com maior adesão"},
    ]
