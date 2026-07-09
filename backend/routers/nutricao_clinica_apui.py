from fastapi import APIRouter

router = APIRouter(prefix="/api/nutricao-clinica-apui", tags=["Nutrição Clínica Apuí"])

@router.get("/dashboard")
def dashboard():
    return {
        "nutricionistas_sus": 1,
        "nutricionistas_necessarios": 4,
        "pacientes_terapia_nutricional": 28,
        "desnutricao_hospitalar_pct": 38.4,
        "triagem_nutricional_hospitalar_pct": 42.4,
        "meta_triagem_pct": 100.0,
        "pacientes_nutricao_enteral": 8,
        "pacientes_nutricao_parenteral": 0,
        "nutricao_parenteral_disponivel": False,
        "obesidade_adultos_pct": 28.4,
        "sobrepeso_adultos_pct": 42.8,
        "desnutricao_infantil_pct": 28.4,
        "status_desnutricao": "critico",
        "status_obesidade": "atencao",
        "ambulatorio_nutricao": False,
    }

@router.get("/avaliacao-nutricional")
def avaliacao_nutricional():
    return [
        {"grupo": "Crianças < 5 anos",
         "desnutricao_pct": 28.4, "sobrepeso_pct": 8.4, "eutrofico_pct": 63.2,
         "status": "critico",
         "obs": "28,4% de desnutrição crônica (baixa estatura p/ idade). Meta: < 5% (OMS)."},
        {"grupo": "Adolescentes (10–19 anos)",
         "desnutricao_pct": 12.8, "sobrepeso_pct": 18.4, "eutrofico_pct": 68.8,
         "status": "atencao",
         "obs": "Duplo fardo: desnutrição e sobrepeso crescentes. Dados PSE 2025."},
        {"grupo": "Adultos (20–59 anos)",
         "desnutricao_pct": 8.4,  "sobrepeso_pct": 42.8, "eutrofico_pct": 48.8,
         "status": "atencao",
         "obs": "Obesidade adulta: 28,4%. Associada ao aumento de DM e HAS no município."},
        {"grupo": "Idosos (60+ anos)",
         "desnutricao_pct": 22.4, "sobrepeso_pct": 28.4, "eutrofico_pct": 49.2,
         "status": "critico",
         "obs": "Desnutrição em idosos frequentemente subdiagnosticada. Triagem MNA não aplicada rotineiramente."},
        {"grupo": "Gestantes",
         "desnutricao_pct": 14.8, "sobrepeso_pct": 22.4, "eutrofico_pct": 62.8,
         "status": "atencao",
         "obs": "14,8% de baixo peso gestacional — risco de RN com baixo peso ao nascer."},
        {"grupo": "Pacientes hospitalizados",
         "desnutricao_pct": 38.4, "sobrepeso_pct": 14.8, "eutrofico_pct": 46.8,
         "status": "critico",
         "obs": "38,4% de desnutrição hospitalar — nenhum protocolo de triagem rotineira implantado."},
    ]

@router.get("/servicos")
def servicos():
    return [
        {"servico": "Ambulatório de Nutrição",       "disponivel": False, "atendimentos_mes": 0,
         "demanda_estimada": 284, "status": "critico",
         "obs": "Inexistente. Consultas de nutrição realizadas somente por demanda espontânea na UBS."},
        {"servico": "Triagem Nutricional Hospitalar","disponivel": True,  "atendimentos_mes": 42,
         "demanda_estimada": 84, "status": "atencao",
         "obs": "Aplicada em apenas 42,4% das internações. MNA e NRS-2002 não padronizados."},
        {"servico": "Terapia Nutricional Enteral",   "disponivel": True,  "atendimentos_mes": 8,
         "demanda_estimada": 18, "status": "atencao",
         "obs": "8 pacientes em NE. Fórmulas com desabastecimento frequente (3 episódios em 2025)."},
        {"servico": "Nutrição Parenteral (NP)",      "disponivel": False, "atendimentos_mes": 0,
         "demanda_estimada": 4,  "status": "critico",
         "obs": "NP não disponível. Pacientes com indicação transferidos para Manaus."},
        {"servico": "Grupo de Alimentação Saudável", "disponivel": True,  "atendimentos_mes": 184,
         "demanda_estimada": 500,"status": "atencao",
         "obs": "2 grupos/semana no NASF. Cobertura insuficiente para a demanda do HIPERDIA."},
        {"servico": "Suplementação Nutricional (BLH/criança)", "disponivel": True, "atendimentos_mes": 284,
         "demanda_estimada": 480,"status": "atencao",
         "obs": "Suplementação de ferro e vitamina A. Cobertura 59,2% das crianças 6–24 meses."},
    ]

@router.get("/historico")
def historico():
    return [
        {"ano": 2022, "desnutricao_inf_pct": 32.4, "obesidade_adultos_pct": 24.4, "desnutricao_hosp_pct": 42.4, "triagem_hosp_pct": 28.4},
        {"ano": 2023, "desnutricao_inf_pct": 30.8, "obesidade_adultos_pct": 25.8, "desnutricao_hosp_pct": 40.8, "triagem_hosp_pct": 34.8},
        {"ano": 2024, "desnutricao_inf_pct": 29.4, "obesidade_adultos_pct": 27.2, "desnutricao_hosp_pct": 39.4, "triagem_hosp_pct": 38.4},
        {"ano": 2025, "desnutricao_inf_pct": 28.4, "obesidade_adultos_pct": 28.4, "desnutricao_hosp_pct": 38.4, "triagem_hosp_pct": 42.4},
    ]

@router.get("/indicadores")
def indicadores():
    return [
        {"indicador": "Desnutrição hospitalar",             "valor": 38.4, "unidade": "%", "meta": 10,  "status": "critico",
         "observacao": "38,4% dos pacientes internados com desnutrição. Sem triagem sistemática (MNA/NRS-2002)."},
        {"indicador": "Triagem nutricional hospitalar",     "valor": 42.4, "unidade": "%", "meta": 100, "status": "critico",
         "observacao": "57,6% dos pacientes internados sem triagem nutricional. Aumento de complicações e óbito."},
        {"indicador": "Nutricionistas SUS disponíveis",    "valor": 1,    "unidade": "prof.", "meta": 4,"status": "critico",
         "observacao": "1 nutricionista para 19.788 hab. Referência CFN: 1/2.000 em APS. Déficit de 3 profissionais."},
        {"indicador": "Nutrição parenteral disponível",    "valor": 0,    "unidade": "unid.", "meta": 1,"status": "critico",
         "observacao": "Inexistente. Pacientes críticos sem NP transferidos para UTI em Manaus."},
        {"indicador": "Obesidade em adultos",              "valor": 28.4, "unidade": "%",  "meta": 20, "status": "atencao",
         "observacao": "Crescimento de 3,9 pp em 3 anos. Correlacionado ao aumento de DM e eventos cardiovasculares."},
    ]
