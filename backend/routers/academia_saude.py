"""
Router: /api/academia-saude — ERSUS 360
Dados de referência municipal — Apuí/AM 2026.
situacao_dado = referencia_municipal
2 polos ativos. Educador físico + nutricionista compartilhado.
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/academia-saude", tags=["academia_saude"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "atendimentos_mes": 487,
        "aumento_atendimentos_pct": 8,
        "satisfacao_pct": 91,
        "modalidades_ativas": 6,
        "profissionais_habilitados": 3,
        "reducao_encaminhamentos_especialidade_pct": 14,
        "usuarios_ativos": 312,
        "polos_ativos": 2,
        "municipio": "Apuí/AM",
        "competencia": "Jun/2026",
    }


@router.get("/polos")
async def polos():
    return [
        {
            "polo": "Polo Centro — Praça da Saúde",
            "endereco": "Av. Tancredo Neves, s/n — Centro, Apuí/AM",
            "equipe_referencia": "ESF Centro",
            "usuarios_ativos": 178,
            "capacidade": 200,
            "ocupacao_pct": 89,
            "horarios": "Seg/Qua/Sex 7h-9h e 16h-18h · Ter/Qui 7h-9h",
            "modalidades": ["Exercícios aeróbicos", "Musculação adaptada", "Alongamento", "Dança sênior"],
            "status": "ok",
            "profissional_responsavel": "Ed. Físico Marcos Oliveira — CREF 12345-AM",
            "infraestrutura": ["piso emborrachado", "aparelhos ao ar livre", "cobertura"],
        },
        {
            "polo": "Polo Cidade Nova — Quadra Coberta",
            "endereco": "R. das Palmeiras, 47 — Cidade Nova, Apuí/AM",
            "equipe_referencia": "ESF Cidade Nova",
            "usuarios_ativos": 134,
            "capacidade": 150,
            "ocupacao_pct": 89,
            "horarios": "Seg/Qua/Sex 7h30-9h30 · Ter/Qui 16h-18h",
            "modalidades": ["Ginástica funcional", "Yoga", "Alongamento", "Caminhada orientada"],
            "status": "ok",
            "profissional_responsavel": "Ed. Física Ana Carvalho — CREF 23456-AM",
            "infraestrutura": ["quadra coberta", "tatames", "equipamentos portáteis"],
        },
    ]


@router.get("/grupos-especiais")
async def grupos_especiais():
    return [
        {
            "grupo": "Idosos ≥ 60 anos",
            "participantes": 187,
            "foco": "Equilíbrio, mobilidade, prevenção de quedas (IVCF)",
            "frequencia_semanal": 3,
            "profissional": "Ed. Físico + Fisioterapeuta (TFD)",
            "status": "ok",
            "observacao": "Principal grupo — redução de quedas em 22% vs ano anterior.",
        },
        {
            "grupo": "Hipertensos e Diabéticos",
            "participantes": 94,
            "foco": "Controle PA e glicemia, caminhada supervisionada",
            "frequencia_semanal": 3,
            "profissional": "Ed. Físico + médico ESF mensalmente",
            "status": "ok",
            "observacao": "Parceria Hiperdia — redução de abandono medicamento em 18%.",
        },
        {
            "grupo": "Mulheres pós-parto",
            "participantes": 22,
            "foco": "Readaptação corporal, exercício aeróbico leve, saúde mental",
            "frequencia_semanal": 2,
            "profissional": "Ed. Física + enfermeira ESF",
            "status": "ok",
            "observacao": "Grupo criado em Mar/26 — alta adesão.",
        },
        {
            "grupo": "Crianças / Adolescentes em sobrepeso",
            "participantes": 9,
            "foco": "Jogos recreativos, educação alimentar",
            "frequencia_semanal": 2,
            "profissional": "Ed. Físico + nutricionista",
            "status": "atencao",
            "observacao": "Baixa adesão por parte dos pais. Meta: 20 participantes.",
        },
    ]


@router.get("/historico")
async def historico():
    return [
        {"mes": "Jan", "atendimentos": 441, "satisfacao_pct": 88},
        {"mes": "Fev", "atendimentos": 452, "satisfacao_pct": 89},
        {"mes": "Mar", "atendimentos": 461, "satisfacao_pct": 90},
        {"mes": "Abr", "atendimentos": 468, "satisfacao_pct": 91},
        {"mes": "Mai", "atendimentos": 479, "satisfacao_pct": 91},
        {"mes": "Jun", "atendimentos": 487, "satisfacao_pct": 91},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"indicador": "Usuários ativos / capacidade instalada",   "valor": 89, "meta": 85, "unidade": "%",      "status": "ok",      "observacao": "Ocupação saudável — aguarda expansão polo rural."},
        {"indicador": "Satisfação do usuário",                    "valor": 91, "meta": 90, "unidade": "%",      "status": "ok",      "observacao": "Avaliação trimestral (mai/26)."},
        {"indicador": "Cobertura idosos frágeis / pré-frágeis",   "valor": 52, "meta": 60, "unidade": "%",      "status": "atencao", "observacao": "Meta: alcançar 60% dos idosos com IVCF ≥4."},
        {"indicador": "Cobertura HAS/DM cadastrados",             "valor": 5,  "meta": 10, "unidade": "%",      "status": "critico", "observacao": "Alta demanda — falta polo próximo ao bairro Colônia."},
        {"indicador": "Modalidades ofertadas",                    "valor": 6,  "meta": 6,  "unidade": "modal.", "status": "ok",      "observacao": "Meta atingida — incluída dança sênior em Abr/26."},
        {"indicador": "Redução encaminhamentos especialidade",    "valor": 14, "meta": 15, "unidade": "%",      "status": "atencao", "observacao": "Próximo da meta — impacto em fisioterapia e cardiologia."},
    ]
