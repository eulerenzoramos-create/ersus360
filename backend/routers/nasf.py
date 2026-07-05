"""NASF-AB — Núcleo Ampliado de Saúde da Família · Apoio Matricial · FMS Apuí/AM"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/nasf", tags=["nasf"])

@router.get("/dashboard")
async def dashboard():
    return {
        "profissionais_nasf": 9,
        "equipes_apoiadas": 5,
        "atendimentos_compartilhados_mes": 284,
        "atendimentos_individuais_mes": 486,
        "discussoes_caso_mes": 48,
        "visitas_domiciliares_mes": 124,
        "pacientes_acompanhados": 1284,
        "casos_vulnerabilidade_social": 186,
        "encaminhamentos_nasf_mes": 68,
        "resolubilidade_pct": 72.4,
        "status_geral": "ok",
    }

@router.get("/equipe")
async def equipe():
    return [
        {"profissional": "Psicóloga Ana Lima",          "categoria": "Psicologia",           "carga_h": 40, "esf_apoiadas": ["ESF Centro I","ESF Centro II"], "atend_mes": 96,  "discuss_mes": 12, "status": "ok"},
        {"profissional": "Assistente Social Carla",     "categoria": "Serviço Social",       "carga_h": 40, "esf_apoiadas": ["ESF Centro I","ESF Bela Vista"],"atend_mes": 84,  "discuss_mes": 10, "status": "ok"},
        {"profissional": "Fisioterapeuta Bruno",        "categoria": "Fisioterapia",         "carga_h": 40, "esf_apoiadas": ["ESF Centro II","ESF Matupi"],    "atend_mes": 72,  "discuss_mes": 8,  "status": "ok"},
        {"profissional": "Nutricionista Paula",         "categoria": "Nutrição",             "carga_h": 40, "esf_apoiadas": ["ESF Bela Vista","ESF Itaparana"],"atend_mes": 64,  "discuss_mes": 7,  "status": "ok"},
        {"profissional": "Farmacêutico Marcos",         "categoria": "Farmácia Clínica",     "carga_h": 20, "esf_apoiadas": ["ESF Centro I"],                  "atend_mes": 48,  "discuss_mes": 5,  "status": "atencao"},
        {"profissional": "Ed. Físico Rafael",           "categoria": "Educação Física",      "carga_h": 40, "esf_apoiadas": ["ESF Centro I","ESF Centro II"], "atend_mes": 124, "discuss_mes": 4,  "status": "ok"},
        {"profissional": "T. Ocupacional Juliana",      "categoria": "Terapia Ocupacional",  "carga_h": 20, "esf_apoiadas": ["ESF Bela Vista"],                "atend_mes": 38,  "discuss_mes": 6,  "status": "atencao"},
        {"profissional": "Médico veterinário (zoonoses)","categoria": "Medicina Veterinária","carga_h": 20, "esf_apoiadas": ["ESF Matupi","ESF Itaparana"],    "atend_mes": 18,  "discuss_mes": 2,  "status": "ok"},
        {"profissional": "Psiquiatra Dra. Fernanda",    "categoria": "Psiquiatria",          "carga_h": 8,  "esf_apoiadas": ["ESF Centro I","ESF Centro II"], "atend_mes": 22,  "discuss_mes": 4,  "status": "ok"},
    ]

@router.get("/prioridades")
async def prioridades():
    return [
        {"categoria": "Saúde mental / Sofrimento psíquico",     "casos": 284, "pct": 22.1, "esf_maior_demanda": "ESF Centro I",   "status": "atencao"},
        {"categoria": "Vulnerabilidade social / SUAS",           "casos": 186, "pct": 14.5, "esf_maior_demanda": "ESF Bela Vista",  "status": "atencao"},
        {"categoria": "DCNT — gestão multiprofissional",         "casos": 348, "pct": 27.1, "esf_maior_demanda": "ESF Centro II",   "status": "ok"},
        {"categoria": "Crianças e adolescentes em risco",        "casos": 124, "pct": 9.7,  "esf_maior_demanda": "ESF Centro I",   "status": "atencao"},
        {"categoria": "Idoso em vulnerabilidade / isolamento",   "casos": 98,  "pct": 7.6,  "esf_maior_demanda": "ESF Bela Vista",  "status": "ok"},
        {"categoria": "Abordagem familiar / conflitos",          "casos": 86,  "pct": 6.7,  "esf_maior_demanda": "ESF Matupi",     "status": "ok"},
        {"categoria": "Uso de álcool e drogas",                  "casos": 68,  "pct": 5.3,  "esf_maior_demanda": "ESF Centro I",   "status": "atencao"},
        {"categoria": "Deficiência física / reabilitação",       "casos": 84,  "pct": 6.5,  "esf_maior_demanda": "ESF Itaparana",  "status": "ok"},
    ]

@router.get("/historico")
async def historico():
    return [
        {"mes": "Out/25", "atend_compartilhados": 236, "atend_individuais": 412, "discuss_caso": 38, "visitas": 98,  "resolubilidade_pct": 70.2},
        {"mes": "Nov/25", "atend_compartilhados": 248, "atend_individuais": 428, "discuss_caso": 42, "visitas": 108, "resolubilidade_pct": 71.4},
        {"mes": "Dez/25", "atend_compartilhados": 214, "atend_individuais": 368, "discuss_caso": 32, "visitas": 84,  "resolubilidade_pct": 69.8},
        {"mes": "Jan/26", "atend_compartilhados": 258, "atend_individuais": 448, "discuss_caso": 44, "visitas": 112, "resolubilidade_pct": 71.8},
        {"mes": "Fev/26", "atend_compartilhados": 268, "atend_individuais": 462, "discuss_caso": 46, "visitas": 118, "resolubilidade_pct": 72.0},
        {"mes": "Mar/26", "atend_compartilhados": 284, "atend_individuais": 486, "discuss_caso": 48, "visitas": 124, "resolubilidade_pct": 72.4},
    ]

@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Resolubilidade NASF-AB",               "valor": 72.4, "meta": 80,  "unidade": "%", "status": "atencao", "observacao": "Meta DAB: ≥80% de casos resolvidos sem referenciamento"},
        {"indicador": "Atendimentos compartilhados/equipe/mês","valor": 56.8, "meta": 60,  "unidade": "un","status": "atencao", "observacao": "Média 5 equipes: 284÷5"},
        {"indicador": "Discussões de caso/equipe/mês",        "valor": 9.6,  "meta": 10,  "unidade": "un","status": "ok",      "observacao": "Apoio matricial ativo"},
        {"indicador": "Cobertura de equipes apoiadas",        "valor": 100,  "meta": 100, "unidade": "%", "status": "ok",      "observacao": "5/5 ESF com NASF-AB vinculado"},
        {"indicador": "Casos de vulnerabilidade acompanhados","valor": 186,  "meta": None, "unidade": "un","status": "ok",      "observacao": "Integração com CRAS/CREAS em andamento"},
    ]
