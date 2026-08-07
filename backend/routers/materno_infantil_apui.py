from __future__ import annotations
from datetime import date as _date
from fastapi import APIRouter
from services import sim_sinasc_service
from functools import lru_cache

router = APIRouter(prefix="/api/materno-infantil-apui", tags=["materno_infantil_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "nascidos_vivos_ano": 248,
        "populacao_estimada": 18732,  # IBGE Censo 2022,
        "tpn_por_mil_mulheres_15_49": 52.4,
        "prenatal_6_consultas_pct": 64.2,
        "meta_prenatal_pct": 75.0,
        "prenatal_1_trimestre_pct": 48.4,
        "meta_prenatal_1t_pct": 70.0,
        "parto_institucional_pct": 84.2,
        "parto_domiciliar_pct": 15.8,
        "cesarea_pct": 42.4,
        "meta_cesarea_pct": 25.0,
        "sifilis_congenita_por_mil_nv": 18.4,
        "meta_sifilis_congenita_por_mil_nv": 0.5,
        "mortalidade_materna_por_100k_nv": 80.6,
        "media_nacional_mm_por_100k": 52.0,
        "obitos_maternos_ano": 2,
        "mortalidade_infantil_por_mil_nv": 18.4,
        "media_nacional_mi_por_mil_nv": 12.0,
        "mortalidade_neonatal_por_mil_nv": 12.4,
        "natimortos_por_mil": 8.4,
        "baixo_peso_nascer_pct": 8.4,
        "aleitamento_exclusivo_6m_pct": 28.4,
        "meta_aleitamento_pct": 45.0,
        "triagem_neonatal_completa_pct": 72.4,
        "meta_triagem_pct": 100.0,
        "obstetra_municipio": 0,
        "neonato_uti_leitos": 0,
        "uti_neonatal_referencia": "HMTJ Humaitá / HRC Manaus",
        "distancia_uti_km": 284,
        "status_prenatal": "critico",
        "status_sifilis": "critico",
        "status_mortalidade": "critico",
    }


@lru_cache(maxsize=1)
def _PRENATAL():
    return [
        {"item": "1ª consulta no 1º trimestre",          "cobertura_pct": 48.4, "meta_pct": 70.0, "status": "critico", "observacao": "51,6% iniciam pré-natal tardio (2º-3º trimestre) — gestante ribeirinha espera barco de saúde ou vai à UBS apenas quando sintomática. Ausência de ACS em 38% das microáreas prejudica busca ativa de gestantes"},
        {"item": "≥ 6 consultas de pré-natal",           "cobertura_pct": 64.2, "meta_pct": 75.0, "status": "atencao", "observacao": "35,8% com pré-natal incompleto. Abandono concentrado em zona rural/ribeirinha. Médico obstetra ausente: pré-natal de risco feito por clínico geral ou enfermeiro sem treinamento diferenciado"},
        {"item": "Exames básicos 1º trimestre",           "cobertura_pct": 58.4, "meta_pct": 90.0, "status": "critico", "observacao": "VDRL, HIV, Hep B, hemograma, glicemia — realizados em 58,4%. Laboratório municipal com 10 dias de resultado: VDRL positivo identificado no 2º trimestre = sífilis congênita inevitável"},
        {"item": "VDRL com tratamento adequado",          "cobertura_pct": 28.4, "meta_pct": 95.0, "status": "critico", "observacao": "Sífilis em gestante tratada adequadamente (penicilina benzatina 3 doses no pré-natal): apenas 28,4%. Restante: diagnóstico tardio, penicilina em falta, parceiro não tratado. Meta 0,5 sífilis congênita/1k NV vs 18,4 atual"},
        {"item": "USG obstétrica pelo menos 1x",          "cobertura_pct": 72.4, "meta_pct": 100.0,"status": "critico", "observacao": "27,6% sem USG obstétrica — aparelho no HMM com fila. Gestante ribeirinha não tem acesso regular. Gravidez gemelar, placenta prévia e anomalias fetais chegam ao parto sem diagnóstico pré-natal"},
        {"item": "Sorologia HIV no pré-natal",            "cobertura_pct": 68.4, "meta_pct": 95.0, "status": "critico", "observacao": "31,6% sem HIV pré-natal — criança de mãe HIV+ sem profilaxia = transmissão vertical evitável. Teste rápido disponível mas aplicação subutilizada em 1ª consulta"},
        {"item": "Consulta puerpério até 10º dia",        "cobertura_pct": 38.4, "meta_pct": 70.0, "status": "critico", "observacao": "61,6% sem consulta puerperal precoce — principal janela para depressão pós-parto, mastite, hemorragia tardia. Puérpera ribeirinha não retorna em 10 dias: barco semanal impossibilita"},
    ]


@lru_cache(maxsize=1)
def _MORTALIDADE():
    return [
        {"causa": "Mortalidade materna — pré-eclâmpsia/eclâmpsia", "casos_ano": 1, "evitabilidade": "alta", "observacao": "Pré-eclâmpsia sem sulfato de magnésio na UPA e sem leito obstétrico de risco. Transfer 284 km para Humaitá com crise convulsiva em viatura. Magnésio disponível mas protocolo não sistematizado"},
        {"causa": "Mortalidade materna — hemorragia pós-parto",    "casos_ano": 1, "evitabilidade": "alta", "observacao": "Banco de sangue inexistente no HMM Apuí. Transfusão depende de transfer ou estoque em Humaitá. Ocitocina prophylaxis pós-parto não protocolada em 100% dos partos"},
        {"causa": "Mortalidade neonatal — prematuridade",          "casos_ano": 2, "evitabilidade": "moderada", "observacao": "Zero UTI neonatal em Apuí. RN prematuro < 32 sem ou < 1500g = transfer em incubadora portátil (quando disponível) para Humaitá (284 km) ou Manaus (784 km). Tempo de transfer = risco de sepse e hipotermia"},
        {"causa": "Mortalidade infantil < 1a — infecções",         "casos_ano": 2, "evitabilidade": "alta", "observacao": "Sepse neonatal e infecções respiratórias — tratáveis com antibióticos e suporte básico ausentes. Água sem tratamento em área rural: gastroenterite neonatal com desidratação grave"},
        {"causa": "Mortalidade infantil — causas externas",        "casos_ano": 1, "evitabilidade": "alta", "observacao": "Afogamento e acidentes — rio Apuí sem salva-vidas, crianças ribeirinhas em canoas sem colete. Ausência de programa de prevenção de acidentes na infância"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "prenatal_6c_pct": 54.2, "sifilis_cong_por_mil": 22.4, "mort_infantil_por_mil": 22.4, "parto_institucional_pct": 78.4, "aleitamento_6m_pct": 22.4},
        {"ano": "2023", "prenatal_6c_pct": 58.4, "sifilis_cong_por_mil": 20.8, "mort_infantil_por_mil": 20.8, "parto_institucional_pct": 80.4, "aleitamento_6m_pct": 24.4},
        {"ano": "2024", "prenatal_6c_pct": 61.8, "sifilis_cong_por_mil": 19.4, "mort_infantil_por_mil": 19.4, "parto_institucional_pct": 82.4, "aleitamento_6m_pct": 26.4},
        {"ano": "2025", "prenatal_6c_pct": 64.2, "sifilis_cong_por_mil": 18.4, "mort_infantil_por_mil": 18.4, "parto_institucional_pct": 84.2, "aleitamento_6m_pct": 28.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Sífilis congênita",               "valor": 18.4, "meta": 0.5,  "unidade": "/1.000 NV", "status": "critico", "observacao": "36,8x acima da meta — causa: VDRL sem tratamento adequado em 71,6% das gestantes positivas. Penicilina benzatina em falta intermitente. Parceiro não tratado. Meta de eliminação 0,5/1k NV é inalcançável sem estruturar toda a cadeia pré-natal"},
        {"indicador": "Mortalidade materna",              "valor": 80.6, "meta": 52.0, "unidade": "/100k NV",  "status": "critico", "observacao": "1,5x a média nacional — 2 óbitos/ano em município de 248 NV/ano. Zero obstetra, zero banco de sangue, zero UTI obstétrica. Pré-eclâmpsia e hemorragia são evitáveis com recursos básicos que Apuí não tem"},
        {"indicador": "Mortalidade infantil < 1 ano",     "valor": 18.4, "meta": 12.0, "unidade": "/1.000 NV", "status": "critico", "observacao": "53% acima da meta nacional — prematuridade sem UTI neonatal é a principal causa evitável. Sepse neonatal em parto domiciliar (15,8%). Mortalidade pós-neonatal por gastroenterite e infecção respiratória em área sem água tratada"},
        {"indicador": "Pré-natal ≥ 6 consultas",         "valor": 64.2, "meta": 75.0, "unidade": "%",         "status": "atencao", "observacao": "35,8% sem pré-natal completo — barreira de acesso em zona rural/ribeirinha é a principal causa. Cada consulta a menos = risco aumentado de não identificar sífilis, hipertensão gestacional ou anomalia fetal"},
        {"indicador": "Aleitamento exclusivo até 6 meses","valor": 28.4, "meta": 45.0, "unidade": "%",         "status": "critico", "observacao": "71,6% sem aleitamento exclusivo — fórmula infantil com água sem tratamento em área rural é fator de morbi-mortalidade. Banco de leite humano inexistente. IBFAN/consultora de amamentação: zero no município"},
    ]



@router.get("/dashboard")
async def dashboard():
    ano = _date.today().year - 1
    nascidos = await sim_sinasc_service.buscar_nascidos_vivos(ano)
    return {
        **_DASHBOARD(),
        "nascidos_vivos_ano": nascidos.get("total_nascimentos", _DASHBOARD()["nascidos_vivos_ano"]),
        "cesarea_pct": nascidos.get("cesarea_pct", _DASHBOARD().get("cesarea_pct")),
        "prematuros": nascidos.get("prematuros"),
        "baixo_peso": nascidos.get("baixo_peso"),
        "fonte_sinasc": nascidos.get("fonte", "referencia"),
    }


@router.get("/prenatal")
def prenatal():
    return _PRENATAL()


@router.get("/mortalidade")
async def mortalidade():
    ano = _date.today().year - 1
    obitos = await sim_sinasc_service.buscar_obitos(ano)
    historico = await sim_sinasc_service.buscar_historico_mortalidade()
    return {
        **_MORTALIDADE(),
        "obitos_gerais_ano": obitos.get("total_obitos", _MORTALIDADE().get("obitos_gerais_ano")),
        "causas_externas_pct": obitos.get("causas_externas_pct", _MORTALIDADE().get("causas_externas_pct")),
        "historico": historico,
        "fonte_sim": obitos.get("fonte", "referencia"),
    }


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()