from fastapi import APIRouter

router = APIRouter(prefix="/api/aleitamento-materno-apui", tags=["Aleitamento Materno Apuí"])

@router.get("/dashboard")
def dashboard():
    return {
        "ame_6meses_pct": 38.2,
        "meta_ame_pct": 90.0,
        "am_continuado_1ano_pct": 54.8,
        "am_continuado_2anos_pct": 28.4,
        "blh_implantado": False,
        "blh_referencia": "HGH Humaitá (284 km)",
        "puerperasOrientadas_pct": 72.4,
        "formula_infantil_uso_pct": 61.8,
        "rn_ame_alta_hospitalar_pct": 48.4,
        "desmame_precoce_pct": 61.8,
        "status_ame": "critico",
        "status_continuado": "atencao",
        "alojamento_conjunto_pct": 82.4,
        "contato_pele_pele_pct": 68.4,
    }

@router.get("/indicadores-amamentacao")
def indicadores_amamentacao():
    return [
        {"indicador": "AME exclusivo até 6 meses",              "valor": 38.2,  "meta": 90.0,  "unidade": "%", "status": "critico"},
        {"indicador": "AM continuado até 1 ano",                "valor": 54.8,  "meta": 75.0,  "unidade": "%", "status": "critico"},
        {"indicador": "AM continuado até 2 anos",               "valor": 28.4,  "meta": 50.0,  "unidade": "%", "status": "critico"},
        {"indicador": "RN em AME na alta hospitalar",           "valor": 48.4,  "meta": 90.0,  "unidade": "%", "status": "critico"},
        {"indicador": "Alojamento conjunto",                    "valor": 82.4,  "meta": 100.0, "unidade": "%", "status": "atencao"},
        {"indicador": "Contato pele a pele pós-parto",          "valor": 68.4,  "meta": 90.0,  "unidade": "%", "status": "atencao"},
        {"indicador": "Puérperas orientadas sobre AM",          "valor": 72.4,  "meta": 100.0, "unidade": "%", "status": "atencao"},
        {"indicador": "Uso de fórmula até 6 meses",            "valor": 61.8,  "meta": 10.0,  "unidade": "%", "status": "critico"},
        {"indicador": "Grupos de apoio à amamentação",          "valor": 0,     "meta": 2,     "unidade": "grupos", "status": "critico"},
        {"indicador": "BLH implantado",                         "valor": 0,     "meta": 1,     "unidade": "unid.", "status": "critico"},
    ]

@router.get("/acoes")
def acoes():
    return [
        {"acao": "Implantação de grupo de apoio ao aleitamento materno (GALMA)",
         "responsavel": "Enfermagem/FMS", "prazo": "2025-12", "status": "planejado",
         "descricao": "Grupo mensal para gestantes e puérperas; envolve NASF e ACS."},
        {"acao": "Capacitação de equipes ESF em técnica de amamentação",
         "responsavel": "Educação Permanente/FMS", "prazo": "2025-09", "status": "em_andamento",
         "descricao": "Treinamento para 100% das enfermeiras das 7 equipes ESF."},
        {"acao": "Protocolo de aleitamento materno na UPA/maternidade",
         "responsavel": "Gestão Hospitalar", "prazo": "2025-10", "status": "planejado",
         "descricao": "Rotina de contato pele a pele e AME na alta."},
        {"acao": "Redução de fórmulas sem indicação médica",
         "responsavel": "Farmácia/FMS", "prazo": "2025-08", "status": "planejado",
         "descricao": "Auditoria de prescrições de fórmula; protocolo de indicação restrita."},
        {"acao": "Parceria com BLH de Humaitá",
         "responsavel": "Regulação/FMS", "prazo": "2025-12", "status": "planejado",
         "descricao": "Fluxo de doação e transporte de leite humano pasteurizado para RN prematuros."},
    ]

@router.get("/historico")
def historico():
    return [
        {"ano": 2022, "ame_6m_pct": 28.4, "am_1ano_pct": 44.8, "am_2anos_pct": 18.4, "formula_pct": 71.6},
        {"ano": 2023, "ame_6m_pct": 32.8, "am_1ano_pct": 48.2, "am_2anos_pct": 22.4, "formula_pct": 67.2},
        {"ano": 2024, "ame_6m_pct": 36.4, "am_1ano_pct": 51.4, "am_2anos_pct": 26.8, "formula_pct": 63.6},
        {"ano": 2025, "ame_6m_pct": 38.2, "am_1ano_pct": 54.8, "am_2anos_pct": 28.4, "formula_pct": 61.8},
    ]

@router.get("/indicadores")
def indicadores():
    return [
        {"indicador": "Prevalência de AME até 6 meses", "valor": 38.2, "unidade": "%", "meta": 90, "status": "critico",
         "observacao": "Abaixo da meta nacional. Desmame precoce impacta mortalidade infantil e desnutrição."},
        {"indicador": "BLH — Banco de Leite Humano", "valor": 0, "unidade": "unid.", "meta": 1, "status": "critico",
         "observacao": "Inexistente. Prematuros e RN de risco sem acesso a leite humano pasteurizado."},
        {"indicador": "AM continuado até 2 anos", "valor": 28.4, "unidade": "%", "meta": 50, "status": "critico",
         "observacao": "Meta OMS não atingida. Impacto no desenvolvimento neurológico e imunidade."},
        {"indicador": "Contato pele a pele pós-parto", "valor": 68.4, "unidade": "%", "meta": 90, "status": "atencao",
         "observacao": "Protocolo não padronizado na maternidade. Treinamento em andamento."},
        {"indicador": "Grupo de apoio ao aleitamento (GALMA)", "valor": 0, "unidade": "grupos", "meta": 2, "status": "critico",
         "observacao": "Nenhum grupo implantado. Puérperas sem suporte estruturado pós-alta."},
    ]
