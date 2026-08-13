"""
Router: /api/atencao-especializada — ERSUS 360
Dados de referência municipal — Apuí/AM (pop. ~20 mil)
Sem hospital próprio; referência MAC em Humaitá e Manaus. TFD frequente.
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/api/atencao-especializada", tags=["atencao_especializada"])

_VERIFICADO = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "consultas_especializadas_mes": 312,
        "total_lista_espera": 487,
        "especialidades_presencial": 4,
        "especialidades_disponiveis": 14,
        "especialidades_criticas": 6,
        "exames_mac_mes": 198,
        "referencias_manaus_mes": 38,
        "contrareferencia_pct": 41,
        "policlinica": False,
        "verificado_em": _VERIFICADO,
    }


@router.get("/especialidades")
async def especialidades():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Cardiologia",
            "disponibilidade": "itinerante_trimestral",
            "profissionais": 0,
            "consultas_mes": 28,
            "lista_espera": 94,
            "tempo_espera_dias": 76,
            "status": "critico",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Neurologia",
            "disponibilidade": "referencia_manaus",
            "profissionais": 0,
            "consultas_mes": 6,
            "lista_espera": 72,
            "tempo_espera_dias": 148,
            "status": "critico",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Ortopedia",
            "disponibilidade": "itinerante_mensal",
            "profissionais": 0,
            "consultas_mes": 34,
            "lista_espera": 68,
            "tempo_espera_dias": 112,
            "status": "critico",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Dermatologia",
            "disponibilidade": "referencia_manaus",
            "profissionais": 0,
            "consultas_mes": 12,
            "lista_espera": 58,
            "tempo_espera_dias": 168,
            "status": "critico",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Oftalmologia",
            "disponibilidade": "itinerante_quinzenal",
            "profissionais": 0,
            "consultas_mes": 48,
            "lista_espera": 62,
            "tempo_espera_dias": 45,
            "status": "atencao",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Ginecologia/Obstetrícia",
            "disponibilidade": "presencial",
            "profissionais": 2,
            "consultas_mes": 74,
            "lista_espera": 22,
            "tempo_espera_dias": 18,
            "status": "ok",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Pediatria",
            "disponibilidade": "presencial",
            "profissionais": 1,
            "consultas_mes": 62,
            "lista_espera": 28,
            "tempo_espera_dias": 22,
            "status": "ok",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Psiquiatria",
            "disponibilidade": "telessaude",
            "profissionais": 0,
            "consultas_mes": 18,
            "lista_espera": 41,
            "tempo_espera_dias": 55,
            "status": "atencao",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Endocrinologia",
            "disponibilidade": "referencia_manaus",
            "profissionais": 0,
            "consultas_mes": 8,
            "lista_espera": 34,
            "tempo_espera_dias": 132,
            "status": "critico",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Urologia",
            "disponibilidade": "itinerante_trimestral",
            "profissionais": 0,
            "consultas_mes": 14,
            "lista_espera": 29,
            "tempo_espera_dias": 98,
            "status": "critico",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Pneumologia",
            "disponibilidade": "telessaude",
            "profissionais": 0,
            "consultas_mes": 9,
            "lista_espera": 21,
            "tempo_espera_dias": 60,
            "status": "atencao",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Clínica Médica",
            "disponibilidade": "presencial",
            "profissionais": 2,
            "consultas_mes": 82,
            "lista_espera": 15,
            "tempo_espera_dias": 12,
            "status": "ok",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Otorrinolaringologia",
            "disponibilidade": "itinerante_mensal",
            "profissionais": 0,
            "consultas_mes": 16,
            "lista_espera": 27,
            "tempo_espera_dias": 64,
            "status": "atencao",
        },
        {
            "situacao_dado": "referencia_municipal",
            "especialidade": "Cirurgia Geral",
            "disponibilidade": "presencial",
            "profissionais": 1,
            "consultas_mes": 30,
            "lista_espera": 16,
            "tempo_espera_dias": 28,
            "status": "ok",
        },
    ]


@router.get("/exames-mac")
async def exames_mac():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "exame": "Ressonância Magnética",
            "realizados_mes": 8,
            "lista_espera": 62,
            "tempo_espera_dias": 180,
            "status": "critico",
            "local": "Manaus (600 km)",
        },
        {
            "situacao_dado": "referencia_municipal",
            "exame": "Tomografia Computadorizada",
            "realizados_mes": 14,
            "lista_espera": 48,
            "tempo_espera_dias": 120,
            "status": "critico",
            "local": "Humaitá (200 km)",
        },
        {
            "situacao_dado": "referencia_municipal",
            "exame": "Ecocardiograma",
            "realizados_mes": 12,
            "lista_espera": 38,
            "tempo_espera_dias": 90,
            "status": "critico",
            "local": "Humaitá (200 km)",
        },
        {
            "situacao_dado": "referencia_municipal",
            "exame": "Endoscopia Digestiva",
            "realizados_mes": 18,
            "lista_espera": 44,
            "tempo_espera_dias": 75,
            "status": "critico",
            "local": "Humaitá (200 km)",
        },
        {
            "situacao_dado": "referencia_municipal",
            "exame": "Densitometria Óssea",
            "realizados_mes": 10,
            "lista_espera": 28,
            "tempo_espera_dias": 68,
            "status": "atencao",
            "local": "Humaitá (200 km)",
        },
        {
            "situacao_dado": "referencia_municipal",
            "exame": "Eletroencefalograma",
            "realizados_mes": 6,
            "lista_espera": 19,
            "tempo_espera_dias": 82,
            "status": "critico",
            "local": "Manaus (600 km)",
        },
        {
            "situacao_dado": "referencia_municipal",
            "exame": "Ultrassonografia Geral",
            "realizados_mes": 68,
            "lista_espera": 31,
            "tempo_espera_dias": 18,
            "status": "atencao",
            "local": "UBS Apuí (local)",
        },
        {
            "situacao_dado": "referencia_municipal",
            "exame": "Eletrocardiograma",
            "realizados_mes": 82,
            "lista_espera": 8,
            "tempo_espera_dias": 5,
            "status": "ok",
            "local": "UBS Apuí (local)",
        },
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "consultas_especializadas": 274, "referencias_manaus": 31, "contrareferencias_pct": 38},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "consultas_especializadas": 288, "referencias_manaus": 34, "contrareferencias_pct": 40},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "consultas_especializadas": 261, "referencias_manaus": 29, "contrareferencias_pct": 37},
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "consultas_especializadas": 295, "referencias_manaus": 36, "contrareferencias_pct": 42},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "consultas_especializadas": 304, "referencias_manaus": 35, "contrareferencias_pct": 40},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "consultas_especializadas": 312, "referencias_manaus": 38, "contrareferencias_pct": 41},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Taxa de contrarreferência",
            "valor": 41,
            "unidade": "%",
            "meta": 80,
            "status": "critico",
            "observacao": "Pacientes retornam sem laudo estruturado; cuidado fragmentado entre Manaus e Apuí.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Consultas especializadas per capita",
            "valor": 0.18,
            "unidade": "cons/hab/ano",
            "meta": 0.30,
            "status": "critico",
            "observacao": "Parâmetro MS Portaria 1.631/2015: 0,30 consultas/hab/ano para municípios de porte I.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Espera média neurologia",
            "valor": 148,
            "unidade": "dias",
            "meta": 60,
            "status": "critico",
            "observacao": "Sem neurologista residente; única via é encaminhamento a Manaus via CROSS/AM.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Espera média oftalmologia",
            "valor": 45,
            "unidade": "dias",
            "meta": 30,
            "status": "atencao",
            "observacao": "Oftalmologista itinerante quinzenal — fila reduzida mas ainda acima da meta.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Especialidades com profissional local",
            "valor": 4,
            "unidade": "espec.",
            "meta": 8,
            "status": "critico",
            "observacao": "Clínica Médica, Ginec./Obst., Pediatria e Cirurgia Geral possuem residente fixo.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Exames MAC realizados/mês",
            "valor": 198,
            "unidade": "exames",
            "meta": 250,
            "status": "atencao",
            "observacao": "Limite de referência para Humaitá não supre demanda de exames de alta complexidade.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Pacientes em TFD Manaus/mês",
            "valor": 38,
            "unidade": "pacientes",
            "meta": None,
            "status": "atencao",
            "observacao": "Custo estimado R$ 1.900/paciente (transporte + diária). Total: ~R$ 72.200/mês.",
        },
    ]
