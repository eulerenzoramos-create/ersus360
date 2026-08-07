from __future__ import annotations
from datetime import date as _date
from fastapi import APIRouter, Query
from services import sih_service
from functools import lru_cache

router = APIRouter(prefix="/api/gestao-hospitalar-apui", tags=["gestao_hospitalar_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "hospital_nome": "Hospital Municipal de Apuí (HMM)",
        "leitos_sus_total": 28,
        "leitos_necessarios_meta": 62,
        "leitos_por_mil_hab": 1.13,
        "meta_leitos_por_mil": 2.5,
        "taxa_ocupacao_pct": 84.2,
        "meta_ocupacao_pct": 75.0,
        "uti_leitos": 0,
        "uti_referencia": "HMTJ Humaitá (284 km) / HRS Manaus (784 km)",
        "cirurgias_eletivas_mes": 12,
        "cirurgias_urgencia_mes": 28,
        "centro_cirurgico_salas": 1,
        "suspensao_cirurgica_meses_2025": 3,
        "internacoes_mes": 148,
        "internacoes_transferidas_mes": 48,
        "reinternacao_30_dias_pct": 22.4,
        "meta_reinternacao_pct": 15.0,
        "tempo_espera_leito_horas": 8.4,
        "meta_espera_leito_horas": 2.0,
        "banco_sangue": False,
        "hemoterapia_referencia": "Hemoam Manaus",
        "medicos_plantonistas_dia": 2,
        "enfermeiros_leito_ratio": 0.18,
        "meta_enfermeiro_leito": 0.33,
        "farmaceutico_hospitalar": 1,
        "cme_autoclave_grande_porte": False,
        "obitos_hospitalares_ano": 28,
        "obitos_evitaveis_estimados_pct": 42.4,
        "custo_diaria_sus_R": 312,
        "status_capacidade": "critico",
        "status_rh": "critico",
        "status_seguranca": "critico",
    }


@lru_cache(maxsize=1)
def _PRODUCAO():
    return [
        {"mes": "Jan", "internacoes": 138, "cirurgias": 36, "transferencias": 42, "obitos": 2, "ocupacao_pct": 78.4},
        {"mes": "Fev", "internacoes": 128, "cirurgias": 32, "transferencias": 38, "obitos": 2, "ocupacao_pct": 74.8},
        {"mes": "Mar", "internacoes": 152, "cirurgias": 42, "transferencias": 52, "obitos": 3, "ocupacao_pct": 86.4},
        {"mes": "Abr", "internacoes": 144, "cirurgias": 38, "transferencias": 48, "obitos": 2, "ocupacao_pct": 82.4},
        {"mes": "Mai", "internacoes": 158, "cirurgias": 44, "transferencias": 54, "obitos": 3, "ocupacao_pct": 88.4},
        {"mes": "Jun", "internacoes": 142, "cirurgias": 0,  "transferencias": 58, "obitos": 2, "ocupacao_pct": 80.4},
        {"mes": "Jul", "internacoes": 164, "cirurgias": 0,  "transferencias": 62, "obitos": 3, "ocupacao_pct": 92.4},
        {"mes": "Ago", "internacoes": 156, "cirurgias": 0,  "transferencias": 56, "obitos": 3, "ocupacao_pct": 89.4},
        {"mes": "Set", "internacoes": 148, "cirurgias": 40, "transferencias": 44, "obitos": 2, "ocupacao_pct": 84.4},
        {"mes": "Out", "internacoes": 152, "cirurgias": 44, "transferencias": 46, "obitos": 2, "ocupacao_pct": 86.4},
        {"mes": "Nov", "internacoes": 148, "cirurgias": 42, "transferencias": 48, "obitos": 2, "ocupacao_pct": 84.4},
        {"mes": "Dez", "internacoes": 142, "cirurgias": 38, "transferencias": 50, "obitos": 2, "ocupacao_pct": 80.4},
    ]


@lru_cache(maxsize=1)
def _FRAGILIDADES():
    return [
        {"area": "Capacidade instalada",       "status": "critico",  "descricao": "28 leitos SUS para 24.700 hab = 1,13/1k (meta 2,5/1k). 34 leitos adicionais necessários. Ocupação 84,2% em estrutura subdimensionada = internação no corredor em pico de demanda (dengue, sazonal)"},
        {"area": "UTI (zero leitos)",          "status": "critico",  "descricao": "Sem UTI: IAM, AVC, sepse grave, politrauma, RN prematuro = transfer imediato. 48 transferências/mês, 33% em condição crítica. Transfer para Humaitá 284 km em viatura sem UTI móvel = alta mortalidade no trajeto"},
        {"area": "Banco de sangue",            "status": "critico",  "descricao": "Sem banco de sangue — hemorragia cirúrgica ou obstétrica depende de transfer para HEMOAM Manaus. Cirurgia de emergência com sangramento intraoperatório = suspensão do procedimento ou óbito intraoperatório"},
        {"area": "Centro cirúrgico (1 sala)",  "status": "critico",  "descricao": "1 sala cirúrgica suspensa 3 meses em 2025 por falta de anestesista. Cirurgias eletivas acumulam fila. Cirurgia de urgência (apendicite, fratura, CES) concorre com a única sala disponível"},
        {"area": "Recursos humanos",           "status": "critico",  "descricao": "Enfermeiro/leito 0,18 (meta 0,33) — 1 enfermeiro para 5,6 leitos. 2 médicos plantonistas para 28 leitos + emergência. Rotatividade alta: Apuí paga 40-60% do salário de Manaus para mesma carga de trabalho"},
        {"area": "CME / esterilização",        "status": "atencao",  "descricao": "Autoclave de grande porte ausente — materiais pesados enviados para Humaitá ou reprocessados com autoclave pequena inadequada para instrumentais cirúrgicos. Risco de infecção cirúrgica por reprocessamento inadequado"},
        {"area": "Farmácia hospitalar",        "status": "atencao",  "descricao": "1 farmacêutico para 28 leitos (meta 1/30 leitos — adequado na razão). Porém: concilia medicamentos de uso contínuo com antibióticos IV sem sistema informatizado. Dispensação manual = risco de erro"},
        {"area": "Óbitos evitáveis",           "status": "critico",  "descricao": "28 óbitos hospitalares/ano — 42,4% estimados evitáveis com recursos básicos ausentes (UTI, banco de sangue, cirurgião disponível). Comitê de mortalidade hospitalar não operante em 2025"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "internacoes_ano": 1548, "transferencias_ano": 528, "cirurgias_ano": 384, "taxa_ocupacao_pct": 78.4, "obitos": 24},
        {"ano": "2023", "internacoes_ano": 1624, "transferencias_ano": 516, "cirurgias_ano": 396, "taxa_ocupacao_pct": 80.4, "obitos": 25},
        {"ano": "2024", "internacoes_ano": 1692, "transferencias_ano": 548, "cirurgias_ano": 408, "taxa_ocupacao_pct": 82.4, "obitos": 26},
        {"ano": "2025", "internacoes_ano": 1776, "transferencias_ano": 576, "cirurgias_ano": 396, "taxa_ocupacao_pct": 84.2, "obitos": 28},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Leitos SUS / 1.000 hab",           "valor": 1.13,  "meta": 2.5,   "unidade": "/1.000",    "status": "critico", "observacao": "55% abaixo da meta — 34 leitos adicionais necessários. Com crescimento populacional de 2,4%/ano e envelhecimento, déficit piora. Ampliação física do HMM é obra de 18-24 meses: decisão precisa ser hoje para entregar em 2027"},
        {"indicador": "Taxa de ocupação hospitalar",      "valor": 84.2,  "meta": 75.0,  "unidade": "%",         "status": "critico", "observacao": "Supera a taxa segura (75%) — não há margem para surto ou sazonalidade. Dengue (284 casos/2025) + sazonalidade respiratória lotam o HMM sem pico: qualquer surto adicional = colapso hospitalar"},
        {"indicador": "Transferências / internações",     "valor": 32.4,  "meta": 10.0,  "unidade": "%",         "status": "critico", "observacao": "32,4% das internações resultam em transfer — sem UTI, sem banco de sangue, sem cirurgião de plantão 24h. Cada transfer custa R$ 2.800-4.200 (SAMU aéreo) + TFD + familiar acompanhante. Transferências evitáveis estimadas em 40%"},
        {"indicador": "Reinternação hospitalar em 30 dias","valor": 22.4, "meta": 15.0,  "unidade": "%",         "status": "critico", "observacao": "Alta sem continuidade de cuidado: paciente com IC sai sem ajuste de diurético, DPOC sai sem nebulização domiciliar, DRC sai sem dietista. Reinternação = falha da APS + alta precoce + descontinuidade. Custo: R$ 312/diária × média 6 dias"},
        {"indicador": "Óbitos evitáveis estimados",       "valor": 42.4,  "meta": 10.0,  "unidade": "% dos óbitos","status": "critico","observacao": "11-12 óbitos/ano evitáveis com UTI (4-5), banco de sangue (2-3), cirurgião 24h (2-3), protocolo sepse (2). Comitê de mortalidade hospitalar inativo em 2025: óbito evitável não é reconhecido, corrigido nem responsabilizado"},
    ]



@router.get("/dashboard")
async def dashboard(ano: int = Query(default=0)):
    if not ano:
        ano = _date.today().year - 1
    sih = await sih_service.buscar_internacoes(ano)
    return {
        **_DASHBOARD(),
        "internacoes_ano": sih["total_internacoes"],
        "taxa_internacao_100k": sih["taxa_internacao_100k"],
        "obitos_hospitalares": sih["obitos_hospitalares"],
        "icsap_pct": sih["icsap_pct"],
        "ano_referencia": ano,
        "fonte_sih": sih["fonte"],
    }


@router.get("/producao")
def producao():
    return _PRODUCAO()


@router.get("/fragilidades")
def fragilidades():
    return _FRAGILIDADES()


@router.get("/historico")
async def historico():
    hist = await sih_service.buscar_historico(5)
    return hist or _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()