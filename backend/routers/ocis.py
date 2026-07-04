"""
ERSUS 360 — OCIS: Centro de Operações em Saúde
Alertas, Regulação, TFD, Mapa de Saúde
"""
from fastapi import APIRouter, Depends
from routers.auth import get_current_user

router = APIRouter(prefix="/api/ocis", tags=["OCIS"])


@router.get("/dashboard")
async def dashboard_ocis(_=Depends(get_current_user)):
    return {
        "alertas_criticos": 3,
        "alertas_avisos": 7,
        "tfd_em_andamento": 5,
        "regulacao_fila_total": 42,
        "regulacao_media_espera_dias": 18,
        "score_ersus": 72.4,
        "fonte": "referencia",
    }


@router.get("/central-alertas")
async def central_alertas(_=Depends(get_current_user)):
    return {
        "alertas": [
            {
                "id": 1, "nivel": "CRITICO", "categoria": "Epidemiológico",
                "titulo": "IPA Malária acima do limiar",
                "descricao": "IPA de 12,3 casos/1000 hab — limiar de alerta é 10,0",
                "data": "2026-07-01T08:30:00", "resolvido": False,
            },
            {
                "id": 2, "nivel": "CRITICO", "categoria": "Financeiro",
                "titulo": "Convênio MAC vence em 28 dias",
                "descricao": "Convênio 793457/2024 — MAC vence em 29/07/2026",
                "data": "2026-07-01T09:00:00", "resolvido": False,
            },
            {
                "id": 3, "nivel": "CRITICO", "categoria": "Clínico",
                "titulo": "Meta Previne Brasil — 2 indicadores abaixo",
                "descricao": "Ind.5 Hipertensão (58%) e Ind.6 Diabetes (55%) abaixo da meta de 60%",
                "data": "2026-07-01T06:00:00", "resolvido": False,
            },
            {
                "id": 4, "nivel": "AVISO", "categoria": "Operacional",
                "titulo": "3 servidores em afastamento simultâneo",
                "descricao": "ESF 02 com 2 médicos afastados — equipe descoberta",
                "data": "2026-06-30T14:00:00", "resolvido": False,
            },
            {
                "id": 5, "nivel": "AVISO", "categoria": "Administrativo",
                "titulo": "5 servidores com férias vencidas",
                "descricao": "Férias vencidas há mais de 12 meses — risco de processo",
                "data": "2026-07-01T07:00:00", "resolvido": False,
            },
            {
                "id": 6, "nivel": "AVISO", "categoria": "Infraestrutura",
                "titulo": "UBS Bela Vista sem gerador",
                "descricao": "Gerador com defeito há 15 dias — vacinação em risco",
                "data": "2026-06-28T10:00:00", "resolvido": False,
            },
        ],
        "total_criticos": 3,
        "total_avisos": 3,
        "fonte": "referencia",
    }


@router.get("/regulacao/fila-espera")
async def fila_espera(_=Depends(get_current_user)):
    return {
        "fila": [
            {"especialidade": "Ortopedia", "aguardando": 14, "media_espera_dias": 28},
            {"especialidade": "Cardiologia", "aguardando": 8, "media_espera_dias": 18},
            {"especialidade": "Neurologia", "aguardando": 6, "media_espera_dias": 35},
            {"especialidade": "Oftalmologia", "aguardando": 7, "media_espera_dias": 22},
            {"especialidade": "Ginecologia", "aguardando": 5, "media_espera_dias": 12},
            {"especialidade": "Urologia", "aguardando": 2, "media_espera_dias": 45},
        ],
        "total_fila": 42,
        "meta_espera_dias": 30,
        "dentro_meta_pct": 71.4,
        "fonte": "referencia",
    }


@router.get("/tfd")
async def listar_tfd(_=Depends(get_current_user)):
    return {
        "tfd": [
            {
                "id": 1, "paciente": "Maria A. dos Santos",
                "cid": "M16.0", "especialidade": "Ortopedia",
                "hospital_destino": "Hospital Universitário — Manaus/AM",
                "tipo_transporte": "terrestre", "data_viagem": "2026-07-05",
                "status": "agendado", "custo_estimado": 380.0,
            },
            {
                "id": 2, "paciente": "José B. Lima",
                "cid": "I25.1", "especialidade": "Cardiologia",
                "hospital_destino": "HUGV — Manaus/AM",
                "tipo_transporte": "aereo", "data_viagem": "2026-07-03",
                "status": "realizado", "custo_estimado": 2400.0,
            },
            {
                "id": 3, "paciente": "Ana C. Ferreira",
                "cid": "N18.3", "especialidade": "Nefrologia",
                "hospital_destino": "HUGV — Manaus/AM",
                "tipo_transporte": "terrestre", "data_viagem": "2026-07-08",
                "status": "agendado", "custo_estimado": 380.0,
            },
        ],
        "resumo": {
            "total_mes": 5, "agendados": 3, "realizados": 2,
            "custo_mes": 6200.0, "tipo_mais_frequente": "terrestre",
        },
        "fonte": "referencia",
    }


@router.get("/tfd/dashboard")
async def dashboard_tfd(_=Depends(get_current_user)):
    return {
        "total_mes": 5,
        "custo_total_mes": 6200.0,
        "custo_medio": 1240.0,
        "por_tipo": {"terrestre": 3, "aereo": 1, "aquaviario": 1},
        "por_especialidade": [
            {"especialidade": "Ortopedia", "qtd": 2},
            {"especialidade": "Cardiologia", "qtd": 1},
            {"especialidade": "Nefrologia", "qtd": 1},
            {"especialidade": "Oncologia", "qtd": 1},
        ],
        "destinos": [
            {"cidade": "Manaus/AM", "qtd": 4},
            {"cidade": "Humaitá/AM", "qtd": 1},
        ],
        "fonte": "referencia",
    }


@router.get("/mapa/unidades")
async def mapa_unidades(_=Depends(get_current_user)):
    return {
        "unidades": [
            {"nome": "UBS Central", "tipo": "UBS", "lat": -7.2037, "lng": -59.8888, "ativa": True},
            {"nome": "UBS Vila Nova", "tipo": "UBS", "lat": -7.2105, "lng": -59.8941, "ativa": True},
            {"nome": "UBS Bela Vista", "tipo": "UBS", "lat": -7.1978, "lng": -59.8820, "ativa": True},
            {"nome": "UBS Rural KM 180", "tipo": "UBS Rural", "lat": -7.3200, "lng": -59.9500, "ativa": False},
            {"nome": "Hospital Municipal", "tipo": "Hospital", "lat": -7.2020, "lng": -59.8870, "ativa": True},
            {"nome": "Farmácia Central", "tipo": "Farmácia", "lat": -7.2010, "lng": -59.8880, "ativa": True},
        ],
        "fonte": "referencia",
    }
