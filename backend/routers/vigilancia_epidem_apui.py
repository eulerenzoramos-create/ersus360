from __future__ import annotations
from datetime import date as _date
import asyncio
from fastapi import APIRouter
from services import sinan_service
from functools import lru_cache

router = APIRouter(prefix="/api/vigilancia-epidem-apui", tags=["vigilancia_epidem_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "notificacoes_ano": 1284,
        "notificacoes_investigadas_pct": 84.2,
        "meta_investigacao_pct": 100.0,
        "surtos_confirmados_ano": 8,
        "surtos_em_investigacao": 2,
        "agravos_monitorados": 28,
        "agravos_acima_limiar": 6,
        "oportunidade_notificacao_pct": 72.4,
        "meta_oportunidade_pct": 80.0,
        "completude_ficha_pct": 68.4,
        "meta_completude_pct": 90.0,
        "sala_situacao_ativa": True,
        "boletim_semanal_publicado": True,
        "status_notificacao": "atencao",
        "status_completude": "critico",
        "malaria_casos_ano": 1284,
        "dengue_casos_ano": 284,
        "leishmaniose_casos_ano": 48,
    }


@lru_cache(maxsize=1)
def _AGRAVOS():
    return [
        {"agravo": "Malária",                       "cid": "B50-B54", "casos_ano": 1284, "taxa_100k": 5190, "tendencia": "estavel",    "limiar_epidemico": 1500, "status": "atencao"},
        {"agravo": "Dengue",                         "cid": "A97",     "casos_ano": 284,  "taxa_100k": 1148, "tendencia": "crescente",  "limiar_epidemico": 100,  "status": "critico"},
        {"agravo": "Leishmaniose tegumentar",         "cid": "B55.1",   "casos_ano": 48,   "taxa_100k": 194,  "tendencia": "crescente",  "limiar_epidemico": 30,   "status": "critico"},
        {"agravo": "Hepatite A",                     "cid": "B15",     "casos_ano": 38,   "taxa_100k": 154,  "tendencia": "decrescente","limiar_epidemico": 50,   "status": "atencao"},
        {"agravo": "Leptospirose",                   "cid": "A27",     "casos_ano": 28,   "taxa_100k": 113,  "tendencia": "estavel",    "limiar_epidemico": 20,   "status": "critico"},
        {"agravo": "Tuberculose",                    "cid": "A15-A19", "casos_ano": 22,   "taxa_100k": 89,   "tendencia": "crescente",  "limiar_epidemico": 15,   "status": "critico"},
        {"agravo": "Sífilis congênita",              "cid": "A50",     "casos_ano": 18,   "taxa_100k": None, "tendencia": "crescente",  "limiar_epidemico": 5,    "status": "critico"},
        {"agravo": "HIV/AIDS (novos diagnósticos)",  "cid": "B20-B24", "casos_ano": 14,   "taxa_100k": 57,   "tendencia": "estavel",    "limiar_epidemico": None, "status": "atencao"},
        {"agravo": "Intoxicação por agrotóxico",     "cid": "T60",     "casos_ano": 32,   "taxa_100k": 129,  "tendencia": "crescente",  "limiar_epidemico": 20,   "status": "critico"},
        {"agravo": "Violência interpessoal (VIVA)",  "cid": "T74",     "casos_ano": 84,   "taxa_100k": 340,  "tendencia": "crescente",  "limiar_epidemico": None, "status": "atencao"},
        {"agravo": "Acidente por animal peçonhento", "cid": "T63",     "casos_ano": 284,  "taxa_100k": 1148, "tendencia": "estavel",    "limiar_epidemico": 200,  "status": "critico"},
        {"agravo": "Hanseníase",                     "cid": "A30",     "casos_ano": 12,   "taxa_100k": 49,   "tendencia": "decrescente","limiar_epidemico": None, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _SURTOS():
    return [
        {"surto": "Surto dengue — Setor Industrial",    "agravo": "Dengue",         "data_inicio": "2025-01", "casos": 84,  "investigado": True,  "encerrado": True,  "observacao": "Foco Aedes em terrenos baldios — 12 visitas VVS"},
        {"surto": "Surto hepatite A — área ribeirinha",  "agravo": "Hepatite A",     "data_inicio": "2025-02", "casos": 28,  "investigado": True,  "encerrado": True,  "observacao": "Contaminação hídrica — implantação de filtros domiciliares"},
        {"surto": "Surto DDA — Escola Municipal",        "agravo": "DDA",            "data_inicio": "2025-03", "casos": 48,  "investigado": True,  "encerrado": True,  "observacao": "Alimento contaminado — merenda escolar suspensa por 5 dias"},
        {"surto": "Leishmaniose — Ramal do Acará",       "agravo": "Leishmaniose",   "data_inicio": "2025-04", "casos": 14,  "investigado": True,  "encerrado": False, "observacao": "Cluster em área de desmatamento — borrifação em andamento"},
        {"surto": "Leptospirose — período chuvoso",      "agravo": "Leptospirose",   "data_inicio": "2025-05", "casos": 18,  "investigado": True,  "encerrado": True,  "observacao": "Inundação de ruas + contato com roedores — 2 óbitos investigados"},
        {"surto": "Intox. agrotóxico — zona rural",      "agravo": "Agrotóxico",     "data_inicio": "2025-05", "casos": 12,  "investigado": True,  "encerrado": True,  "observacao": "Uso irregular de metamidofós — lavradores sem EPI"},
        {"surto": "Dengue — Jardim Apuí",               "agravo": "Dengue",         "data_inicio": "2025-06", "casos": 62,  "investigado": True,  "encerrado": False, "observacao": "Em investigação — LIRAa realizado, índice 4,8% (RISCO)"},
        {"surto": "Surto sífilis congênita",             "agravo": "Síf. congênita", "data_inicio": "2025-01", "casos": 8,   "investigado": False, "encerrado": False, "observacao": "8 casos em 2025 vs meta ZERO — investigação pendente de cobertura pré-natal"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "notificacoes": 98,  "investigadas_pct": 82.4, "surtos": 1, "completude_pct": 65.2},
        {"mes": "Fev/25", "notificacoes": 104, "investigadas_pct": 83.0, "surtos": 1, "completude_pct": 66.4},
        {"mes": "Mar/25", "notificacoes": 112, "investigadas_pct": 83.8, "surtos": 1, "completude_pct": 67.2},
        {"mes": "Abr/25", "notificacoes": 108, "investigadas_pct": 84.2, "surtos": 2, "completude_pct": 68.0},
        {"mes": "Mai/25", "notificacoes": 124, "investigadas_pct": 84.0, "surtos": 2, "completude_pct": 68.4},
        {"mes": "Jun/25", "notificacoes": 138, "investigadas_pct": 84.2, "surtos": 2, "completude_pct": 68.4},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Investigação de notificações",    "valor": 84.2, "meta": 100.0, "unidade": "%",         "status": "atencao", "observacao": "15,8% das notificações sem investigação concluída — sífilis congênita (8 casos) sem investigação em atraso crítico"},
        {"indicador": "Completude das fichas SINAN",     "valor": 68.4, "meta": 90.0,  "unidade": "%",         "status": "critico", "observacao": "68,4% vs meta 90% — campos obrigatórios em branco comprometem análise epidemiológica e ações de controle"},
        {"indicador": "Oportunidade de notificação",     "valor": 72.4, "meta": 80.0,  "unidade": "%",         "status": "atencao", "observacao": "27,6% das notificações fora do prazo — atraso prejudica resposta a surtos e encerramento de casos"},
        {"indicador": "Dengue — taxa de incidência",     "valor": 1148, "meta": None,  "unidade": "/100k",     "status": "critico", "observacao": "LIRAa 4,8% em Jun/25 — risco ALTO de epidemia. 2 surtos ativos, focos persistentes no Setor Industrial e Jd. Apuí"},
        {"indicador": "Acidente por animal peçonhento",  "valor": 1148, "meta": None,  "unidade": "/100k",     "status": "critico", "observacao": "284 casos/ano — taxa 10× acima da média nacional. Bothrops (jararaca) causa 72% dos acidentes ofídicos em área de mata"},
        {"indicador": "Surtos ativos",                   "valor": 2,    "meta": 0,     "unidade": "surtos",    "status": "atencao", "observacao": "Dengue (Jd. Apuí) e Leishmaniose (Ramal do Acará) em investigação ativa — equipes de VVS com capacidade limitada"},
    ]



@router.get("/dashboard")
async def dashboard():
    ano = _date.today().year - 1
    malaria_data, dengue_data = await asyncio.gather(
        sinan_service.buscar_malaria(ano),
        sinan_service.buscar_dengue(ano),
    )
    return {
        **_DASHBOARD,
        "malaria_casos_ano":  malaria_data["total_casos"],
        "dengue_casos_ano":   dengue_data["total_casos"],
        "malaria_ipa":        malaria_data["ipa"],
        "dengue_incidencia":  dengue_data.get("incidencia_100k", 0),
        "fonte_malaria":      malaria_data["fonte"],
        "fonte_dengue":       dengue_data["fonte"],
    }


@router.get("/agravos")
def agravos():
    return _AGRAVOS


@router.get("/surtos")
def surtos():
    return _SURTOS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
