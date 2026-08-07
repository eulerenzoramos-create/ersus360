from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/recursos-humanos-saude-apui", tags=["recursos_humanos_saude_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "total_profissionais_saude": 284,
        "medicos_total": 12,
        "medicos_mais_medicos": 4,
        "medicos_concursados": 2,
        "medicos_contrato_temporario": 6,
        "medicos_especialistas_municipio": 0,
        "vagas_medico_nao_preenchidas": 6,
        "rotatividade_medicos_pct": 72.4,
        "meta_rotatividade_pct": 20.0,
        "enfermeiros_total": 28,
        "enfermeiros_por_leito": 0.18,
        "meta_enfermeiro_leito": 0.33,
        "acs_total": 28,
        "acs_meta_municipio": 42,
        "acs_cobertura_pct": 66.7,
        "absenteismo_geral_pct": 28.4,
        "meta_absenteismo_pct": 5.0,
        "plano_cargos_salarios": False,
        "adicional_interioridade_pct": 0.0,
        "salario_medico_municipio_R": 14800,
        "salario_medico_manaus_R": 28400,
        "concurso_publico_ultimo_ano": 2019,
        "contratados_temporarios_pct": 64.2,
        "capacitacao_horas_ano_media": 8.4,
        "meta_capacitacao_horas": 40.0,
        "status_medicos": "critico",
        "status_rotatividade": "critico",
        "status_formacao": "atencao",
    }


@lru_cache(maxsize=1)
def _CARGOS():
    return [
        {"categoria": "Médico clínico geral",      "vagas": 8,  "preenchidas": 4,  "temporarios": 3, "concursados": 1, "salario_R": 14800, "rotatividade_pct": 84.2, "status": "critico",  "observacao": "50% das vagas não preenchidas. Temporários: contratos de 6-12 meses — alta incerteza, profissional não investe na comunidade. Salário R$ 14.800 vs R$ 28.400 em Manaus. Zero adicional de interioridade. Resultado: médico fica 1 ciclo e não renova"},
        {"categoria": "Médico Mais Médicos (PMMB)","vagas": 4,  "preenchidas": 4,  "temporarios": 4, "concursados": 0, "salario_R": 13500, "rotatividade_pct": 48.4, "status": "atencao",  "observacao": "4 médicos do PMMB — programa federal que garante mínimo de médicos em áreas remotas. Vinculação ao programa, não ao município: ao encerrar ciclo, vaga fica descoberta por 3-6 meses. Dependência estrutural de programa federal para cobertura básica"},
        {"categoria": "Enfermeiro",                "vagas": 32, "preenchidas": 28, "temporarios": 18,"concursados": 10,"salario_R": 4800,  "rotatividade_pct": 42.4, "status": "atencao",  "observacao": "87,5% de preenchimento mas 64,3% temporários. Enfermeiro é o profissional que mais conhece a comunidade: rotatividade alta desfaz vínculo terapêutico. Salário R$ 4.800 sem plano de carreira: enfermeiro sai em 2-3 anos para concurso estadual"},
        {"categoria": "ACS (Agente Com. de Saúde)","vagas": 42, "preenchidas": 28, "temporarios": 6, "concursados": 22,"salario_R": 2824,  "rotatividade_pct": 18.4, "status": "atencao",  "observacao": "33,3% das vagas descobertas — 14 microáreas sem ACS. ACS é o mais fixo (morador local), mas salário próximo ao mínimo. Áreas ribeirinhas e ramais: ACS faz percurso de 4-8h a pé ou de canoa para cada domicílio"},
        {"categoria": "Dentista",                  "vagas": 8,  "preenchidas": 5,  "temporarios": 3, "concursados": 2, "salario_R": 5200,  "rotatividade_pct": 38.4, "status": "atencao",  "observacao": "37,5% das vagas não preenchidas. ESB (Equipe Saúde Bucal) incompleta em 3/8 UBS — sem equipe odontológica. Cárie e doença periodontal: procedimentos não realizados por falta de dentista, acumulam fila para cirurgia"},
        {"categoria": "Farmacêutico",               "vagas": 6,  "preenchidas": 4,  "temporarios": 2, "concursados": 2, "salario_R": 4400,  "rotatividade_pct": 28.4, "status": "atencao",  "observacao": "33,3% de cobertura inadequada para assistência farmacêutica completa. HMM com 1 farmacêutico para 28 leitos (adequado na razão mas sem sistema informatizado). Farmácias das UBS sem farmacêutico responsável em 3 unidades"},
        {"categoria": "Fisioterapeuta",             "vagas": 4,  "preenchidas": 1,  "temporarios": 1, "concursados": 0, "salario_R": 4200,  "rotatividade_pct": 100.0,"status": "critico",  "observacao": "75% de vagas descobertas. 1 fisioterapeuta para 24.700 hab. Reabilitação pós-AVC, fratura e amputação: paciente esperando meses sem fisioterapia. AVC sem fisioterapia precoce = sequela definitiva que poderia ser reduzida com reabilitação dentro de 72h"},
        {"categoria": "Psicólogo",                  "vagas": 3,  "preenchidas": 1,  "temporarios": 1, "concursados": 0, "salario_R": 4200,  "rotatividade_pct": 100.0,"status": "critico",  "observacao": "Zero psicólogo concursado. 1 temporário no CAPS I. Suicídio 18,4/100k (2,8x nacional). CAPS I superlotado 153%. 2/3 das vagas de psicólogo cobertas por encaminhamento para Manaus — fila de 6-12 meses"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "medicos_total": 10, "vagas_nao_preench": 8, "rotatividade_pct": 78.4, "absenteismo_pct": 24.4, "temporarios_pct": 58.4},
        {"ano": "2023", "medicos_total": 11, "vagas_nao_preench": 7, "rotatividade_pct": 74.4, "absenteismo_pct": 26.4, "temporarios_pct": 61.4},
        {"ano": "2024", "medicos_total": 11, "vagas_nao_preench": 7, "rotatividade_pct": 72.4, "absenteismo_pct": 27.4, "temporarios_pct": 63.2},
        {"ano": "2025", "medicos_total": 12, "vagas_nao_preench": 6, "rotatividade_pct": 72.4, "absenteismo_pct": 28.4, "temporarios_pct": 64.2},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Rotatividade de médicos",              "valor": 72.4,  "meta": 20.0,  "unidade": "%/ano",     "status": "critico", "observacao": "72,4% dos médicos não renovam contrato após 12 meses. Sem plano de cargos/salários e sem adicional de interioridade: Apuí compete com Manaus pagando 47% do salário. PMMB garante cobertura mínima mas cria dependência estrutural de programa federal que pode ser revisto"},
        {"indicador": "Médicos especialistas no município",   "valor": 0,     "meta": 3,     "unidade": "médicos",   "status": "critico", "observacao": "Zero especialista em Apuí (nenhuma especialidade: zero ginecologista, zero obstetra, zero psiquiatra, zero pediatra, zero cirurgião de plantão permanente). Cada especialidade = R$ 28.000-48.000/mês necessários + moradia + estrutura. Município de pequeno porte sem capacidade fiscal"},
        {"indicador": "Absenteísmo geral",                    "valor": 28.4,  "meta": 5.0,   "unidade": "%",         "status": "critico", "observacao": "28,4% de absenteísmo — ausências por doença, licença, falta não justificada. Em equipe mínima de 12 médicos, 28,4% = 3,4 médicos ausentes/dia. UBS com médico único: 1 ausência = UBS fechada. Absenteísmo elevado = sobrecarga dos que ficam = mais adoecimento = mais absenteísmo"},
        {"indicador": "Profissionais com capacitação/ano",    "valor": 8.4,   "meta": 40.0,  "unidade": "horas",     "status": "atencao", "observacao": "8,4h/ano vs 40h recomendadas. Capacitação requer deslocamento para Manaus (784 km) ou teleformação sem conectividade. Profissional temporário não investe em capacitação para cargo que não vai manter. Educação Permanente em Saúde estruturada apenas no papel"},
        {"indicador": "Plano de Cargos e Salários (PCCS)",    "valor": 0,     "meta": 1,     "unidade": "plano",     "status": "critico", "observacao": "Sem PCCS: sem promoção por mérito, sem progressão por tempo de serviço, sem incentivo de fixação. Profissional concursado em Apuí ganha igual ao temporário contratado ontem. Nenhum estímulo para qualificação ou permanência. Elaboração do PCCS: investimento pontual de R$ 40-80k com impacto de décadas na fixação"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD()


@router.get("/cargos")
def cargos():
    return _CARGOS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()