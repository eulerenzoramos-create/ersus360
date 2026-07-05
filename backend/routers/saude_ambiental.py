"""
Saúde Ambiental — Apuí/AM
Qualidade da água · Saneamento · Agrotóxicos · Clima/Saúde
VIGIAGUA · VIGIPIECES · PNQS · Resolução CONAMA 357/2005
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-ambiental", tags=["Saúde Ambiental"])

_DASHBOARD = {
    "competencia": "Mar/2026",
    "amostras_agua_mes": 48,
    "amostras_conformes_pct": 79.2,
    "amostras_conformes_status": "atencao",
    "pontos_monitorados": 12,
    "alertas_ativos": 3,
    "alertas_status": "atencao",
    "intoxicacoes_agrotoxico_mes": 2,
    "cobertura_saneamento_pct": 38.4,
    "cobertura_saneamento_status": "critico",
}

_QUALIDADE_AGUA = [
    {"ponto":"Sistema Apuí Centro",      "tipo":"SAA","coliformes_totais":"Ausente","cloro_residual":0.8,"turbidez":1.2,"fluor":0.7,"status":"ok",     "ultima_coleta":"Mar/26","alerta":None},
    {"ponto":"Sistema Bairro São José",  "tipo":"SAA","coliformes_totais":"Presente","cloro_residual":0.3,"turbidez":2.8,"fluor":0.4,"status":"alerta","ultima_coleta":"Mar/26","alerta":"Coliformes totais detectados — interditar uso"},
    {"ponto":"Poço Comunitário Matupi",  "tipo":"SAC","coliformes_totais":"Presente","cloro_residual":0.0,"turbidez":4.1,"fluor":0.0,"status":"critico","ultima_coleta":"Mar/26","alerta":"Coliformes + cloro ausente — risco gastroenterite"},
    {"ponto":"Chafariz Zona Rural km 12","tipo":"SAI","coliformes_totais":"Ausente","cloro_residual":0.5,"turbidez":1.8,"fluor":0.3,"status":"ok",     "ultima_coleta":"Mar/26","alerta":None},
    {"ponto":"Rio Apuí (captação ETA)",  "tipo":"Bruta","coliformes_totais":"Presente","cloro_residual":None,"turbidez":12.4,"fluor":None,"status":"monitoramento","ultima_coleta":"Mar/26","alerta":"Turbidez elevada — período chuvoso"},
    {"ponto":"Sistema ESF São Francisco","tipo":"SAA","coliformes_totais":"Ausente","cloro_residual":0.7,"turbidez":1.4,"fluor":0.6,"status":"ok",     "ultima_coleta":"Mar/26","alerta":None},
]

_HISTORICO_CONFORMIDADE = [
    {"mes":"Out/25","amostras":44,"conformes":37,"pct":84.1,"nao_conformes":7},
    {"mes":"Nov/25","amostras":46,"conformes":39,"pct":84.8,"nao_conformes":7},
    {"mes":"Dez/25","amostras":42,"conformes":34,"pct":81.0,"nao_conformes":8},
    {"mes":"Jan/26","amostras":48,"conformes":40,"pct":83.3,"nao_conformes":8},
    {"mes":"Fev/26","amostras":48,"conformes":39,"pct":81.3,"nao_conformes":9},
    {"mes":"Mar/26","amostras":48,"conformes":38,"pct":79.2,"nao_conformes":10},
]

_AGROTOXICOS = [
    {"id":"INT-001","agente":"Glifosato","ocupacao":"Agricultor familiar","exposicao":"Crônica","gravidade":"leve","municipio":"Apuí","mes":"Jan/26","notificado_sinan":True},
    {"id":"INT-002","agente":"Organofosforado","ocupacao":"Trabalhador rural","exposicao":"Aguda","gravidade":"moderada","municipio":"Apuí","mes":"Fev/26","notificado_sinan":True,"alerta":"Hospitalização 48h — investigar EPI"},
    {"id":"INT-003","agente":"Carbamato","ocupacao":"Agricultor familiar","exposicao":"Aguda","gravidade":"leve","municipio":"Apuí","mes":"Mar/26","notificado_sinan":True},
]

_SANEAMENTO = [
    {"localidade":"Apuí Centro",        "agua_tratada_pct":82.4,"esgoto_pct":34.1,"residuos_coleta_pct":88.0,"situacao":"parcial"},
    {"localidade":"Bairro São José",    "agua_tratada_pct":68.2,"esgoto_pct":12.4,"residuos_coleta_pct":72.0,"situacao":"deficiente"},
    {"localidade":"Matupi (Distrito)",  "agua_tratada_pct":41.8,"esgoto_pct":4.2, "residuos_coleta_pct":48.0,"situacao":"critico"},
    {"localidade":"Zona Rural km 1-30", "agua_tratada_pct":18.4,"esgoto_pct":0.0, "residuos_coleta_pct":12.0,"situacao":"critico"},
    {"localidade":"Comunidades Rurais", "agua_tratada_pct":8.2, "esgoto_pct":0.0, "residuos_coleta_pct":4.0, "situacao":"critico"},
]

@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD

@router.get("/qualidade-agua")
async def qualidade_agua():
    return _QUALIDADE_AGUA

@router.get("/historico-conformidade")
async def historico_conformidade():
    return _HISTORICO_CONFORMIDADE

@router.get("/agrotoxicos")
async def agrotoxicos():
    return _AGROTOXICOS

@router.get("/saneamento")
async def saneamento():
    return _SANEAMENTO
