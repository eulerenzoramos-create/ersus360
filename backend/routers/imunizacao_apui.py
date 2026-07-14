from __future__ import annotations
from datetime import date as _date
from fastapi import APIRouter, Query
from services import pni_service

router = APIRouter(prefix="/api/imunizacao-apui", tags=["imunizacao_apui"])

_DASHBOARD = {
    "nascidos_vivos_ano": 248,
    "meta_cobertura_pct": 95.0,
    "bcg_pct": 84.2,
    "hepatite_b_ao_nascer_pct": 78.4,
    "pentavalente_d3_pct": 72.4,
    "polio_vpod3_pct": 68.4,
    "pneumo10_d3_pct": 70.4,
    "meningo_c_d2_pct": 64.2,
    "rotavirus_d2_pct": 62.4,
    "triplice_viral_d1_pct": 64.2,
    "triplice_viral_d2_pct": 58.4,
    "varicela_pct": 62.4,
    "hpv_feminino_d2_pct": 52.4,
    "hpv_masculino_d2_pct": 42.4,
    "influenza_idosos_pct": 72.4,
    "influenza_gestante_pct": 58.4,
    "abandono_pentavalente_d1_d3_pct": 18.4,
    "meta_abandono_pct": 5.0,
    "salas_vacinacao": 4,
    "sala_rural_funcionando": 2,
    "geladeiras_vacina": 2,
    "pane_cadeia_frio_2024": True,
    "doses_perdidas_pane_2024": 3840,
    "cobertura_zona_rural_estimada_pct": 42.4,
    "cobertura_ribeirinha_estimada_pct": 38.4,
    "status_criancas": "critico",
    "status_adolescentes": "critico",
    "status_cadeia_frio": "atencao",
}

_VACINAS = [
    {"vacina": "BCG (RN)",                  "cobertura_pct": 84.2,  "meta_pct": 95.0, "status": "atencao", "publico": "RN",              "observacao": "15,8% sem BCG — parto domiciliar e demora em registro civil atrasa vacinação. BCG em falta 2 meses/ano por falha no abastecimento CENADI"},
    {"vacina": "Hepatite B (ao nascer)",     "cobertura_pct": 78.4,  "meta_pct": 95.0, "status": "critico", "publico": "RN (< 24h)",      "observacao": "21,6% sem Hep B ao nascer — parto domiciliar impossibilita dose nas primeiras 24h. 3 dias para o cartório = perda da janela ideal. Hepatite B crônica evitável em gestantes HBsAg+ sem triagem"},
    {"vacina": "Pentavalente D3",            "cobertura_pct": 72.4,  "meta_pct": 95.0, "status": "critico", "publico": "< 1 ano",         "observacao": "Abandono D1→D3 de 18,4% — dificuldade de acesso em zona rural e ribeirinha. Calendário mensal incompatível com rotina de populações itinerantes (garimpo). Coriforme subindo por queda de Hib"},
    {"vacina": "VIP/VOP (Poliomielite D3)", "cobertura_pct": 68.4,  "meta_pct": 95.0, "status": "critico", "publico": "< 1 ano",         "observacao": "Cobertura abaixo do limiar de imunidade de rebanho (90%). Municípios com risco de reintrodução de polio em fronteiras amazônicas. Campanha nacional de vacinação não atinge área ribeirinha uniformemente"},
    {"vacina": "Tríplice Viral D1 (SCR)",   "cobertura_pct": 64.2,  "meta_pct": 95.0, "status": "critico", "publico": "12 meses",        "observacao": "Cobertura sarampo abaixo do limiar crítico (95%). AM teve surtos de sarampo em 2018-2019 que começaram em municípios com cobertura < 70%. Risco real de surto em Apuí no próximo ciclo epidêmico"},
    {"vacina": "Tríplice Viral D2",         "cobertura_pct": 58.4,  "meta_pct": 95.0, "status": "critico", "publico": "15 meses",        "observacao": "Drop-out D1→D2 de 9,1% adicional. 36,6% sem 2 doses de SCR — imunidade insuficiente para bloquear transmissão em surto. Sarampo, caxumba e rubéola são eliminações frágeis em contexto amazônico"},
    {"vacina": "HPV feminino D2",            "cobertura_pct": 52.4,  "meta_pct": 80.0, "status": "critico", "publico": "9-14 anos",       "observacao": "HPV é a principal causa evitável de câncer de colo uterino — câncer com alta mortalidade em AM por diagnóstico tardio. Vacinação escolar é a estratégia mais efetiva: escola sem PSE = HPV não vacinado"},
    {"vacina": "HPV masculino D2",           "cobertura_pct": 42.4,  "meta_pct": 80.0, "status": "critico", "publico": "11-14 anos",      "observacao": "Pior cobertura do calendário — menino não é levado ao posto de saúde com mesma frequência. Vacinação escolar masculina depende de PSE com 64,3% de cobertura de escolas"},
    {"vacina": "Influenza (≥ 60 anos)",      "cobertura_pct": 72.4,  "meta_pct": 90.0, "status": "atencao", "publico": "Idosos",          "observacao": "27,6% dos idosos sem influenza anual. Campanhas anuais com adesão variável. Idoso ribeirinho com dificuldade de acesso à UBS. Internação por influenza = transfer para Manaus em população vulnerável"},
    {"vacina": "Influenza (gestante)",       "cobertura_pct": 58.4,  "meta_pct": 90.0, "status": "critico", "publico": "Gestantes",       "observacao": "41,6% das gestantes sem influenza — risco de óbito materno por pneumonia influenza. Gestante só vai à UBS no pré-natal: oportunidade perdida se vacina em falta ou sala fechada"},
]

_CADEIA_FRIO = [
    {"sala": "UBS Central (sede)",       "geladeiras": 1, "funcionando": True,  "temperatura_ok_pct": 94.2, "doses_armazenadas": 1840, "status": "ok"},
    {"sala": "UBS Ramal do Acará",       "geladeiras": 1, "funcionando": True,  "temperatura_ok_pct": 88.4, "doses_armazenadas": 640,  "status": "atencao"},
    {"sala": "UBS Vila do Juma",         "geladeiras": 0, "funcionando": False, "temperatura_ok_pct": 0,    "doses_armazenadas": 0,    "status": "critico"},
    {"sala": "Posto Ribeirinho Igarapé", "geladeiras": 0, "funcionando": False, "temperatura_ok_pct": 0,    "doses_armazenadas": 0,    "status": "critico"},
]

_HISTORICO = [
    {"ano": "2022", "pentavalente_pct": 64.2, "scr_d1_pct": 58.4, "hpv_pct": 42.4, "influenza_idosos_pct": 64.2, "abandono_pct": 24.4},
    {"ano": "2023", "pentavalente_pct": 66.8, "scr_d1_pct": 60.8, "hpv_pct": 44.8, "influenza_idosos_pct": 66.8, "abandono_pct": 22.4},
    {"ano": "2024", "pentavalente_pct": 69.4, "scr_d1_pct": 62.4, "hpv_pct": 48.4, "influenza_idosos_pct": 69.4, "abandono_pct": 20.4},
    {"ano": "2025", "pentavalente_pct": 72.4, "scr_d1_pct": 64.2, "hpv_pct": 52.4, "influenza_idosos_pct": 72.4, "abandono_pct": 18.4},
]

_INDICADORES = [
    {"indicador": "Cobertura pentavalente D3",     "valor": 72.4, "meta": 95.0, "unidade": "%", "status": "critico", "observacao": "Abandono D1→D3 de 18,4% — maior causa: distância UBS em zona rural/ribeirinha. Criança de assentamento percorre 40-80 km para completar esquema. Vacinação domiciliar por ACS não está sistematizada"},
    {"indicador": "Cobertura SCR D1 (sarampo)",    "valor": 64.2, "meta": 95.0, "unidade": "%", "status": "critico", "observacao": "35,8% sem sarampo — abaixo do limiar de proteção de rebanho (95%). AM teve surto 2018-2019 com transmissão iniciada em municípios de baixa cobertura. Reintrodução via garimpo (trabalhadores de outras UFs/países) é risco real"},
    {"indicador": "Perda na cadeia de frio",       "valor": 3840, "meta": 0,    "unidade": "doses", "status": "critico", "observacao": "Pane em geladeira em 2024 destruiu 3.840 doses — R$ 28k em imunobiológicos. 2 salas sem geladeira (Vila do Juma, ribeirinha). Caixa de isopor com gelo = cadeia de frio precária para vacinação rural"},
    {"indicador": "HPV feminino D2",               "valor": 52.4, "meta": 80.0, "unidade": "%", "status": "critico", "observacao": "Câncer de colo é evitável — HPV é responsável por 99% dos casos. AM tem incidência entre as mais altas do Brasil. Cobertura 52,4% = 47,6% das meninas expostas a risco evitável de câncer na vida adulta"},
    {"indicador": "Cobertura zona ribeirinha (est.)","valor": 38.4,"meta": 95.0,"unidade": "%", "status": "critico", "observacao": "Estimativa baseada em SIAB/ACS: cobertura real pode ser ainda menor. Barco de vacinação SESAI cobre TI mas não comunidades ribeirinhas não-indígenas. Estratégia de vacinação fluvial municipal inexistente"},
]


@router.get("/dashboard")
async def dashboard(ano: int = Query(default=0)):
    if not ano:
        ano = _date.today().year - 1
    cobertura = await pni_service.buscar_cobertura(ano)
    return {
        **_DASHBOARD,
        "cobertura_vacinal_media_pct": cobertura["media_cobertura_pct"],
        "vacinas_abaixo_meta": cobertura["abaixo_meta"],
        "ano_referencia": ano,
        "fonte_pni": cobertura["fonte"],
    }


@router.get("/vacinas")
async def vacinas(ano: int = Query(default=0)):
    if not ano:
        ano = _date.today().year - 1
    cobertura = await pni_service.buscar_cobertura(ano)
    if cobertura.get("vacinas"):
        return {"ano": ano, "vacinas": cobertura["vacinas"], "fonte": cobertura["fonte"]}
    return _VACINAS


@router.get("/cadeia-frio")
def cadeia_frio():
    return _CADEIA_FRIO


@router.get("/historico")
async def historico():
    hist = await pni_service.buscar_historico(5)
    return hist or _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
