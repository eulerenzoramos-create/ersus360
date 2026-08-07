from __future__ import annotations
from datetime import date as _date
from fastapi import APIRouter
from services import previne_service
from functools import lru_cache

router = APIRouter(prefix="/api/atencao-primaria-apui", tags=["atencao_primaria_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "populacao_estimada": 24700,
        "equipes_esf_ativas": 8,
        "meta_equipes_esf": 12,
        "cobertura_esf_pct": 64.2,
        "meta_cobertura_esf_pct": 100.0,
        "acs_ativos": 28,
        "microareas_total": 42,
        "microareas_sem_acs_pct": 33.3,
        "ubs_total": 8,
        "ubs_sem_medico": 3,
        "ubs_sem_medico_pct": 37.5,
        "nasf_equipes": 1,
        "meta_nasf": 2,
        "consultas_hab_ano": 1.8,
        "meta_consultas_hab_ano": 3.0,
        "visitas_domiciliares_familias_pct": 48.4,
        "meta_visitas_pct": 100.0,
        "absenteismo_medico_pct": 28.4,
        "hiperdia_cadastrados": 3684,
        "hiperdia_ativo_pct": 58.4,
        "meta_hiperdia_pct": 85.0,
        "prenatal_6c_pct": 64.2,
        "programa_mais_medicos": True,
        "medicos_mais_medicos": 3,
        "medicos_concursados": 2,
        "medicos_total": 5,
        "rotatividade_medicos_ano_pct": 42.4,
        "status_cobertura": "critico",
        "status_acesso": "critico",
        "status_acs": "atencao",
    }


@lru_cache(maxsize=1)
def _EQUIPES():
    return [
        {"equipe": "ESF 01 — UBS Central",              "localidade": "Sede urbana",         "populacao": 3200, "medico": True,  "enfermeiro": True,  "acs": 4, "acs_meta": 4, "nasf": True,  "status": "ok",      "producao_consultas_mes": 384},
        {"equipe": "ESF 02 — UBS Vila Nova",             "localidade": "Sede urbana",         "populacao": 2840, "medico": True,  "enfermeiro": True,  "acs": 3, "acs_meta": 4, "nasf": True,  "status": "atencao", "producao_consultas_mes": 312},
        {"equipe": "ESF 03 — UBS Ramal do Acará",        "localidade": "Ramal do Acará",      "populacao": 2400, "medico": True,  "enfermeiro": True,  "acs": 3, "acs_meta": 4, "nasf": False, "status": "atencao", "producao_consultas_mes": 248},
        {"equipe": "ESF 04 — UBS Vila do Juma",          "localidade": "Vila do Juma",        "populacao": 1840, "medico": False, "enfermeiro": True,  "acs": 2, "acs_meta": 3, "nasf": False, "status": "critico", "producao_consultas_mes": 128},
        {"equipe": "ESF 05 — UBS Assentamento Juma",     "localidade": "Zona rural / assentam.", "populacao": 1680, "medico": True, "enfermeiro": True, "acs": 2, "acs_meta": 3, "nasf": False, "status": "atencao", "producao_consultas_mes": 184},
        {"equipe": "ESF 06 — UBS PA Castanheira",        "localidade": "Assentamento rural",  "populacao": 1560, "medico": False, "enfermeiro": True,  "acs": 2, "acs_meta": 3, "nasf": False, "status": "critico", "producao_consultas_mes": 112},
        {"equipe": "ESF 07 — UBS Ribeirinha I",          "localidade": "Área ribeirinha",     "populacao": 1280, "medico": False, "enfermeiro": True,  "acs": 2, "acs_meta": 3, "nasf": False, "status": "critico", "producao_consultas_mes": 84},
        {"equipe": "ESF 08 — UBS Ribeirinha II",         "localidade": "Área ribeirinha",     "populacao": 1060, "medico": True,  "enfermeiro": True,  "acs": 2, "acs_meta": 3, "nasf": False, "status": "atencao", "producao_consultas_mes": 96},
    ]


@lru_cache(maxsize=1)
def _INDICADORES_APS():
    return [
        {"indicador": "Consulta pré-natal 1º trimestre",  "resultado_pct": 48.4,  "meta_pct": 70.0,  "status": "critico"},
        {"indicador": "Pré-natal ≥ 6 consultas",          "resultado_pct": 64.2,  "meta_pct": 75.0,  "status": "atencao"},
        {"indicador": "HIPERDIA acompanhamento ativo",     "resultado_pct": 58.4,  "meta_pct": 85.0,  "status": "critico"},
        {"indicador": "Consulta puerpério até 10º dia",    "resultado_pct": 38.4,  "meta_pct": 70.0,  "status": "critico"},
        {"indicador": "Visita domiciliar ACS / família",   "resultado_pct": 48.4,  "meta_pct": 100.0, "status": "critico"},
        {"indicador": "Atualização cadastro SISAB",        "resultado_pct": 72.4,  "meta_pct": 100.0, "status": "atencao"},
        {"indicador": "Cobertura vacinal pentavalente D3", "resultado_pct": 72.4,  "meta_pct": 95.0,  "status": "critico"},
        {"indicador": "Rastreamento CA colo (Papanicolau)","resultado_pct": 28.4,  "meta_pct": 80.0,  "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "cobertura_esf_pct": 56.4, "equipes_esf": 7, "consultas_hab": 1.4, "hiperdia_ativo_pct": 48.4, "ubs_sem_medico": 4},
        {"ano": "2023", "cobertura_esf_pct": 58.8, "equipes_esf": 7, "consultas_hab": 1.5, "hiperdia_ativo_pct": 52.4, "ubs_sem_medico": 4},
        {"ano": "2024", "cobertura_esf_pct": 61.4, "equipes_esf": 8, "consultas_hab": 1.6, "hiperdia_ativo_pct": 55.4, "ubs_sem_medico": 3},
        {"ano": "2025", "cobertura_esf_pct": 64.2, "equipes_esf": 8, "consultas_hab": 1.8, "hiperdia_ativo_pct": 58.4, "ubs_sem_medico": 3},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Cobertura ESF",                    "valor": 64.2, "meta": 100.0, "unidade": "%", "status": "critico", "observacao": "35,8% da população sem APS estruturada — concentrada em zona ribeirinha (3 aldeias ribeirinhas sem UBS fixa) e rural disperso. 4 equipes faltantes demandam R$ 840k/ano em custeio. Sem ESF = prevenção zero, HIPERDIA descontrolado, gestante sem pré-natal"},
        {"indicador": "UBS com médico",                   "valor": 62.5, "meta": 100.0, "unidade": "% UBS", "status": "critico", "observacao": "3/8 UBS sem médico — Mais Médicos cobre parte mas rotatividade 42,4%/ano impede vínculo longitudinal. Vila do Juma, PA Castanheira e Ribeirinha I dependem de médico itinerante ou enfermeiro como único profissional prescriptor"},
        {"indicador": "Microáreas sem ACS",               "valor": 33.3, "meta": 0.0,   "unidade": "% microáreas","status": "atencao", "observacao": "14/42 microáreas sem ACS — busca ativa impossível para gestantes, faltosos do HIPERDIA, crianças sem vacina. ACS é o elo essencial entre UBS e ribeirinho/assentado. Vaga de ACS mal remunerada (R$ 2.640/mês) = alta rotatividade e microáreas descobertas"},
        {"indicador": "Rastreamento CA colo (Papanicolau)","valor": 28.4, "meta": 80.0, "unidade": "%","status": "critico", "observacao": "71,6% das mulheres 25-64 sem exame nos últimos 3 anos. AM tem incidência de CA colo entre as mais altas do Brasil. UBS sem ginecologista: coleta por enfermeiro nem sempre disponível. Resultado em 30-45 dias via LACEN-AM: mulher positiva já não retorna"},
        {"indicador": "Consultas/hab/ano",                "valor": 1.8,  "meta": 3.0,   "unidade": "cons/hab","status": "critico", "observacao": "1,8 vs meta OMS 3,0 — APS subprodutora por falta de médico, absenteísmo 28,4% e demanda represada. Consulta espontânea domina: consulta programática (HIPERDIA, pré-natal, puericultura) é secundarizada pela urgência cotidiana"},
    ]



@router.get("/dashboard")
async def dashboard():
    hoje = _date.today()
    comp = f"{hoje.year}{hoje.month:02d}"
    previne = await previne_service.buscar_indicadores(comp)
    media_pct = previne.get("media_geral_pct") or 68.0
    return {
        **_DASHBOARD(),
        "previne_media_pct": media_pct,
        "previne_indicadores": len(previne.get("indicadores", [])),
        "fonte_previne": previne.get("fonte", "referencia"),
    }


@router.get("/equipes")
def equipes():
    return _EQUIPES()


@router.get("/indicadores-aps")
async def indicadores_aps():
    hoje = _date.today()
    comp = f"{hoje.year}{hoje.month:02d}"
    previne = await previne_service.buscar_indicadores(comp)
    inds = previne.get("indicadores", [])
    if inds:
        return {"fonte": previne.get("fonte"), "indicadores": inds}
    return _INDICADORES_APS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()