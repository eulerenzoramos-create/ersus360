"""
Reabilitação / Pessoa com Deficiência — Apuí/AM
RCPD · BPC/LOAS · CER · NASF-AB reabilitação · Órteses/Próteses
Decreto 7.612/2011 (Plano Viver sem Limite) · Lei 13.146/2015 (LGPD)
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/reabilitacao", tags=["Reabilitação / Deficiência"])

_DASHBOARD = {
    "competencia": "Mar/2026",
    "pcd_cadastrados": 184,
    "bpc_beneficiarios": 62,
    "em_reabilitacao": 47,
    "lista_espera_cer": 28,
    "lista_espera_status": "atencao",
    "atendimentos_mes": 186,
    "opme_solicitacoes_pendentes": 9,
    "opme_status": "atencao",
}

_PACIENTES = [
    {"id":"PCD-001","deficiencia":"Física — hemiplegia","causa":"AVC","modalidade":"Fisioterapia","sessoes_mes":8, "opme":None,        "bpc":True, "alerta":None},
    {"id":"PCD-002","deficiencia":"Intelectual — síndrome de Down","causa":"Congênita","modalidade":"Fonoaudiologia","sessoes_mes":4,"opme":None,"bpc":True,"alerta":None},
    {"id":"PCD-003","deficiencia":"Física — amputação MMII","causa":"DM pé diabético","modalidade":"Fisioterapia + Prótese","sessoes_mes":6,"opme":"Prótese MMII pendente","bpc":False,"alerta":"OPME há 4 meses aguardando aprovação"},
    {"id":"PCD-004","deficiencia":"Auditiva — SNHL bilateral","causa":"Congênita","modalidade":"Fonoaudiologia + AASI","sessoes_mes":4,"opme":"AASI aguardando","bpc":True,"alerta":"AASI solicitado — encaminhar CER"},
    {"id":"PCD-005","deficiencia":"Visual — cegueira bilateral","causa":"Glaucoma avançado","modalidade":"Reabilitação visual","sessoes_mes":2,"opme":None,"bpc":True,"alerta":None},
    {"id":"PCD-006","deficiencia":"Física — paraplegia","causa":"TCE acidente","modalidade":"Fisioterapia + Cadeira rodas","sessoes_mes":8,"opme":"Cadeira rodas motorizada pendente","bpc":False,"alerta":"Cadeira rodas 6 meses aguardando"},
    {"id":"PCD-007","deficiencia":"TEA","causa":"Congênita","modalidade":"Psicologia + Fonoaud.","sessoes_mes":6,"opme":None,"bpc":True,"alerta":None},
    {"id":"PCD-008","deficiencia":"Física — sequela poliomielite","causa":"Poliomielite","modalidade":"Fisioterapia","sessoes_mes":4,"opme":None,"bpc":True,"alerta":None},
    {"id":"PCD-009","deficiencia":"Mental — esquizofrenia","causa":"—","modalidade":"CAPS + Reabilitação","sessoes_mes":4,"opme":None,"bpc":True,"alerta":None},
    {"id":"PCD-010","deficiencia":"Física — hemiplegia","causa":"AVC","modalidade":"Fisioterapia","sessoes_mes":8,"opme":None,"bpc":False,"alerta":"Sem BPC — avaliar elegibilidade"},
]

_PRODUCAO_MENSAL = [
    {"mes":"Out/25","fisioterapia":68,"fonoaudiologia":32,"terapia_ocupacional":18,"psicologia":28,"total":146},
    {"mes":"Nov/25","fisioterapia":72,"fonoaudiologia":34,"terapia_ocupacional":20,"psicologia":30,"total":156},
    {"mes":"Dez/25","fisioterapia":58,"fonoaudiologia":28,"terapia_ocupacional":14,"psicologia":24,"total":124},
    {"mes":"Jan/26","fisioterapia":76,"fonoaudiologia":36,"terapia_ocupacional":22,"psicologia":32,"total":166},
    {"mes":"Fev/26","fisioterapia":78,"fonoaudiologia":38,"terapia_ocupacional":24,"psicologia":34,"total":174},
    {"mes":"Mar/26","fisioterapia":84,"fonoaudiologia":40,"terapia_ocupacional":26,"psicologia":36,"total":186},
]

_INDICADORES = [
    {"indicador":"PCD cadastrados no sistema",          "valor":184,"meta":None,"unidade":"pessoas","status":"ok",     "observacao":"SIGTAP/RCPD"},
    {"indicador":"BPC/LOAS beneficiários ativos",       "valor":62, "meta":None,"unidade":"pessoas","status":"ok",     "observacao":"INSS — revisão bienal"},
    {"indicador":"Em reabilitação ativa",               "valor":47, "meta":None,"unidade":"pessoas","status":"ok",     "observacao":"25.5% dos cadastrados"},
    {"indicador":"Lista espera CER regional",           "valor":28, "meta":10,  "unidade":"pessoas","status":"atencao","observacao":"CER Humaitá","invertido":True},
    {"indicador":"OPME aguardando aprovação",           "valor":9,  "meta":3,   "unidade":"solicit.","status":"atencao","observacao":"Média espera 4.2 meses","invertido":True},
    {"indicador":"Atendimentos reabilitação/mês",       "valor":186,"meta":150, "unidade":"atend.", "status":"ok",     "observacao":"Mar/26 — acima da meta"},
    {"indicador":"PCD com benefício assistencial",      "valor":33.7,"meta":None,"unidade":"%","status":"ok",          "observacao":"62 de 184 cadastrados"},
]

@router.get("/dashboard")
async def dashboard():
    return _DASHBOARD

@router.get("/pacientes")
async def pacientes():
    return _PACIENTES

@router.get("/producao")
async def producao():
    return _PRODUCAO_MENSAL

@router.get("/indicadores")
async def indicadores():
    return _INDICADORES
