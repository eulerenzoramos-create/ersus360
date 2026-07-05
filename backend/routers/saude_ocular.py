"""
Saúde Ocular — Apuí/AM
Triagem visual · Catarata · Glaucoma · Refrativo · Óculos populares
Política Nacional de Atenção à Saúde Ocular
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-ocular", tags=["Saúde Ocular"])

_DASHBOARD = {
    "competencia": "Mar/2026",
    "triagens_mes": 124,
    "alteracoes_detectadas_mes": 38,
    "alteracoes_pct": 30.6,
    "encaminhamentos_oftalmologia": 22,
    "lista_espera_cirurgia_catarata": 36,
    "lista_espera_status": "critico",
    "oculos_dispensados_mes": 14,
    "glaucoma_acompanhados": 18,
}

_TRIAGENS_HISTORICO = [
    {"mes":"Out/25","triagens":108,"alteracoes":32,"acuidade_reducao":14,"refrativo":12,"suspeita_glaucoma":4,"suspeita_catarata":8,"encaminhados":20},
    {"mes":"Nov/25","triagens":112,"alteracoes":34,"acuidade_reducao":15,"refrativo":13,"suspeita_glaucoma":3,"suspeita_catarata":9,"encaminhados":21},
    {"mes":"Dez/25","triagens":98, "alteracoes":29,"acuidade_reducao":12,"refrativo":10,"suspeita_glaucoma":3,"suspeita_catarata":8,"encaminhados":18},
    {"mes":"Jan/26","triagens":118,"alteracoes":36,"acuidade_reducao":16,"refrativo":14,"suspeita_glaucoma":4,"suspeita_catarata":9,"encaminhados":22},
    {"mes":"Fev/26","triagens":122,"alteracoes":37,"acuidade_reducao":17,"refrativo":14,"suspeita_glaucoma":5,"suspeita_catarata":10,"encaminhados":22},
    {"mes":"Mar/26","triagens":124,"alteracoes":38,"acuidade_reducao":18,"refrativo":14,"suspeita_glaucoma":5,"suspeita_catarata":11,"encaminhados":22},
]

_CASOS_CATARATA = [
    {"id":"OC-001","olho":"Bilateral","grau":"Grau III","acuidade_vd":"0.1","acuidade_ve":"0.1","indicacao":"Cirurgia urgente","aguardando_meses":8, "situacao":"lista espera","alerta":"Aguardando >6 meses — cegueira funcional"},
    {"id":"OC-002","olho":"OD",      "grau":"Grau II","acuidade_vd":"0.3","acuidade_ve":"0.8","indicacao":"Cirurgia eletiva", "aguardando_meses":5, "situacao":"lista espera","alerta":None},
    {"id":"OC-003","olho":"OE",      "grau":"Grau II","acuidade_vd":"0.7","acuidade_ve":"0.3","indicacao":"Cirurgia eletiva", "aguardando_meses":4, "situacao":"lista espera","alerta":None},
    {"id":"OC-004","olho":"Bilateral","grau":"Grau IV","acuidade_vd":"0.05","acuidade_ve":"0.05","indicacao":"Cirurgia urgente","aguardando_meses":10,"situacao":"lista espera","alerta":"Cegueira legal bilateral — prioridade máxima"},
    {"id":"OC-005","olho":"OD",      "grau":"Grau I","acuidade_vd":"0.5","acuidade_ve":"0.9","indicacao":"Acompanhamento",   "aguardando_meses":0, "situacao":"acompanhamento","alerta":None},
]

_GLAUCOMA = [
    {"id":"GL-001","tipo":"Glaucoma ângulo aberto","po_mmhg_od":22,"po_mmhg_oe":21,"medicacao":"Timolol 0.5% + Dorzolamida","controle":"parcial","consulta_dias":45,"alerta":"PO limítrofe — revisar esquema"},
    {"id":"GL-002","tipo":"Glaucoma ângulo aberto","po_mmhg_od":18,"po_mmhg_oe":17,"medicacao":"Latanoprosta 0.005%","controle":"sim","consulta_dias":30,"alerta":None},
    {"id":"GL-003","tipo":"Glaucoma ângulo fechado","po_mmhg_od":28,"po_mmhg_oe":14,"medicacao":"Pilocarpina + Timolol","controle":"nao","consulta_dias":14,"alerta":"PO elevada OD — encaminhar urgência oftalmológica"},
    {"id":"GL-004","tipo":"HTO suspeita","po_mmhg_od":23,"po_mmhg_oe":22,"medicacao":"Em observação","controle":"monitoramento","consulta_dias":60,"alerta":None},
    {"id":"GL-005","tipo":"Glaucoma ângulo aberto","po_mmhg_od":16,"po_mmhg_oe":16,"medicacao":"Bimatoprosta 0.01%","controle":"sim","consulta_dias":42,"alerta":None},
]

_INDICADORES = [
    {"indicador":"Triagem visual APS/mês",             "valor":124,"meta":150,"unidade":"triagens","status":"atencao","observacao":"Meta ESF Apuí"},
    {"indicador":"Taxa de alterações detectadas",      "valor":30.6,"meta":None,"unidade":"%","status":"ok","observacao":"Mar/26"},
    {"indicador":"Lista espera cirurgia catarata",     "valor":36,"meta":10,"unidade":"pacientes","status":"critico","observacao":"Espera média 6.2 meses","invertido":True},
    {"indicador":"Encaminhamentos resolvidos (alta)",  "valor":38.2,"meta":70.0,"unidade":"%","status":"critico","observacao":"Referência oftalmologia Humaitá"},
    {"indicador":"Óculos dispensados/mês",             "valor":14,"meta":20,"unidade":"pares","status":"atencao","observacao":"Programa Óculos do SUS"},
    {"indicador":"Glaucoma sob controle (PO<18)",      "valor":66.7,"meta":80.0,"unidade":"%","status":"atencao","observacao":"12 de 18 acompanhados"},
]

@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD

@router.get("/triagens")
async def triagens():
    return _TRIAGENS_HISTORICO

@router.get("/catarata")
async def catarata():
    return _CASOS_CATARATA

@router.get("/glaucoma")
async def glaucoma():
    return _GLAUCOMA

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES
