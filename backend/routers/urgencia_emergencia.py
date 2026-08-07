"""
Urgência e Emergência — UPA / SAMU — Apuí/AM
Portaria GM/MS nº 1.600/2011 — Rede de Atenção às Urgências
"""
from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/urgencia-emergencia", tags=["Urgência e Emergência"])

@lru_cache(maxsize=1)
def _ATENDIMENTOS_MENSAL():
    return [
        {"mes":"Out/25","atendimentos":618,"manchester_vermelho":12,"manchester_laranja":48,"manchester_amarelo":187,"manchester_verde":284,"manchester_azul":87,"procedimentos_cirurgicos":8,"transferencias":11,"obitos_ue":1},
        {"mes":"Nov/25","atendimentos":634,"manchester_vermelho":14,"manchester_laranja":52,"manchester_amarelo":194,"manchester_verde":291,"manchester_azul":83,"procedimentos_cirurgicos":9,"transferencias":12,"obitos_ue":0},
        {"mes":"Dez/25","atendimentos":598,"manchester_vermelho":11,"manchester_laranja":44,"manchester_amarelo":178,"manchester_verde":279,"manchester_azul":86,"procedimentos_cirurgicos":7,"transferencias":10,"obitos_ue":1},
        {"mes":"Jan/26","atendimentos":651,"manchester_vermelho":16,"manchester_laranja":58,"manchester_amarelo":201,"manchester_verde":296,"manchester_azul":80,"procedimentos_cirurgicos":11,"transferencias":14,"obitos_ue":0},
        {"mes":"Fev/26","atendimentos":672,"manchester_vermelho":18,"manchester_laranja":61,"manchester_amarelo":208,"manchester_verde":302,"manchester_azul":83,"procedimentos_cirurgicos":12,"transferencias":15,"obitos_ue":1},
        {"mes":"Mar/26","atendimentos":694,"manchester_vermelho":19,"manchester_laranja":65,"manchester_amarelo":214,"manchester_verde":311,"manchester_azul":85,"procedimentos_cirurgicos":13,"transferencias":17,"obitos_ue":0},
    ]


@lru_cache(maxsize=1)
def _SAMU_OCORRENCIAS():
    return [
        {"mes":"Out/25","ocorrencias":48,"usa_acionamentos":8,"usb_acionamentos":40,"tempo_resposta_med_min":14.2,"suporte_avancado":8,"suporte_basico":40,"obitos_cena":0},
        {"mes":"Nov/25","ocorrencias":52,"usa_acionamentos":9,"usb_acionamentos":43,"tempo_resposta_med_min":15.1,"suporte_avancado":9,"suporte_basico":43,"obitos_cena":1},
        {"mes":"Dez/25","ocorrencias":44,"usa_acionamentos":7,"usb_acionamentos":37,"tempo_resposta_med_min":13.8,"suporte_avancado":7,"suporte_basico":37,"obitos_cena":0},
        {"mes":"Jan/26","ocorrencias":58,"usa_acionamentos":11,"usb_acionamentos":47,"tempo_resposta_med_min":16.4,"suporte_avancado":11,"suporte_basico":47,"obitos_cena":0},
        {"mes":"Fev/26","ocorrencias":61,"usa_acionamentos":12,"usb_acionamentos":49,"tempo_resposta_med_min":15.9,"suporte_avancado":12,"suporte_basico":49,"obitos_cena":1},
        {"mes":"Mar/26","ocorrencias":65,"usa_acionamentos":13,"usb_acionamentos":52,"tempo_resposta_med_min":17.2,"suporte_avancado":13,"suporte_basico":52,"obitos_cena":0},
    ]


@lru_cache(maxsize=1)
def _CAUSAS_ATENDIMENTO():
    return [
        {"causa":"Doenças cardiovasculares",  "pct":22.4,"tendencia":"estavel"},
        {"causa":"Traumatismos / acidentes",  "pct":18.7,"tendencia":"alta"},
        {"causa":"Aparelho respiratório",     "pct":16.3,"tendencia":"estavel"},
        {"causa":"Doenças infecciosas",       "pct":14.8,"tendencia":"alta"},
        {"causa":"Saúde mental / intox. SPA","pct":9.2, "tendencia":"alta"},
        {"causa":"Gastrointestinal",          "pct":8.4, "tendencia":"estavel"},
        {"causa":"Outras causas",             "pct":10.2,"tendencia":"estavel"},
    ]


@lru_cache(maxsize=1)
def _FROTA_SAMU():
    return [
        {"veiculo":"USA-01 (Ambulância Avançada)","tipo":"USA","placa":"PHJ-3421","status":"operacional","km_rodados_mes":1240,"ultima_manutencao":"Fev/26"},
        {"veiculo":"USB-01 (Ambulância Básica)",  "tipo":"USB","placa":"PHK-2318","status":"operacional","km_rodados_mes":2180,"ultima_manutencao":"Jan/26"},
        {"veiculo":"USB-02 (Ambulância Básica)",  "tipo":"USB","placa":"PHK-2319","status":"manutencao", "km_rodados_mes":0,   "ultima_manutencao":"Mar/26"},
        {"veiculo":"Moto (SAMU Moto)",            "tipo":"Moto","placa":"PHM-1142","status":"operacional","km_rodados_mes":380,"ultima_manutencao":"Fev/26"},
    ]


@router.get("/dashboard")
async def dashboard():
    ult_ue   = _ATENDIMENTOS_MENSAL()[-1]
    ult_samu = _SAMU_OCORRENCIAS()[-1]
    criticos_ue = ult_ue["manchester_vermelho"] + ult_ue["manchester_laranja"]
    return {
        "competencia":          "Mar/2026",
        "atendimentos_mes":     ult_ue["atendimentos"],
        "criticos_mes":         criticos_ue,
        "transferencias_mes":   ult_ue["transferencias"],
        "samu_ocorrencias_mes": ult_samu["ocorrencias"],
        "tempo_resposta_samu":  ult_samu["tempo_resposta_med_min"],
        "frota_disponivel":     sum(1 for v in _FROTA_SAMU() if v["status"]=="operacional"),
        "frota_total":          len(_FROTA_SAMU()),
        "historico_ue":         _ATENDIMENTOS_MENSAL(),
        "historico_samu":       _SAMU_OCORRENCIAS(),
    }

@router.get("/atendimentos")
async def atendimentos():
    return _ATENDIMENTOS_MENSAL

@router.get("/samu")
async def samu():
    return {"ocorrencias": _SAMU_OCORRENCIAS(), "frota": _FROTA_SAMU()}

@router.get("/causas")
async def causas():
    return _CAUSAS_ATENDIMENTO
