from fastapi import APIRouter
from functools import lru_cache
router = APIRouter(prefix="/api/matriciamento-nasf-apui", tags=["Matriciamento NASF-AB Apuí"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "equipes_sf_total": 6,
        "equipes_sf_com_emulti": 4,
        "equipes_sf_sem_apoio": 2,
        "profissionais_emulti_ativo": 8,
        "profissionais_emulti_meta": 14,
        "atendimentos_compartilhados_mes": 284,
        "consultorias_matriciais_mes": 148,
        "casos_discussao_quinzenal": 38,
        "visitas_domiciliares_conjuntas_mes": 64,
        "atividades_grupo_mes": 22,
        "encaminhamentos_reduzidos_pct": 28.4,
        "satisfacao_esf_pct": 78.4,
        "profissionais": {
            "psicologo": 1, "fisioterapeuta": 1, "nutricionista": 1,
            "farmaceutico": 1, "assistente_social": 1, "educador_fisico": 1,
            "terapeuta_ocupacional": 0, "fonoaudiologo": 0, "medico_ginecologista": 1,
            "medico_psiquiatra": 1, "medico_pediatra": 0
        },
        "status_cobertura": "atencao",
        "status_atividades": "ok",
    }


@lru_cache(maxsize=1)
def _EQUIPES():
    return [
        {"esf":"eSF 1 — Centro",          "medico":"Dr. Paulo Matos",    "com_emulti":True,  "apoio_nucleo":["Psicologia","Nutrição","Farmácia"],           "atend_compartilhados_mes":68, "discussao_caso":"Quinzenal","demanda_principal":"Saúde mental + DCNT"},
        {"esf":"eSF 2 — Bairro Novo",     "medico":"Dra. Carla Souza",   "com_emulti":True,  "apoio_nucleo":["Fisioterapia","Educação Física","Assist. Social"],"atend_compartilhados_mes":54, "discussao_caso":"Quinzenal","demanda_principal":"Reabilitação + Vulnerabilidade"},
        {"esf":"eSF 3 — Cohab I",         "medico":"Dr. João Lima",      "com_emulti":True,  "apoio_nucleo":["Psicologia","Farmácia","Nutrição"],            "atend_compartilhados_mes":62, "discussao_caso":"Mensal",  "demanda_principal":"Saúde mental infanto-juvenil"},
        {"esf":"eSF 4 — Cohab II",        "medico":"Dra. Ana Ferreira",  "com_emulti":True,  "apoio_nucleo":["Assist. Social","Farmácia"],                  "atend_compartilhados_mes":48, "discussao_caso":"Mensal",  "demanda_principal":"Situação social + polimedicados"},
        {"esf":"eSF 5 — PSF Rural I",     "medico":"Dr. Marcos Vieira",  "com_emulti":False, "apoio_nucleo":[],                                             "atend_compartilhados_mes":0,  "discussao_caso":"—",       "demanda_principal":"Sem apoio eMulti — distância 42 km"},
        {"esf":"eSF 6 — Ribeirinha",      "medico":"Sem médico fixo",    "com_emulti":False, "apoio_nucleo":[],                                             "atend_compartilhados_mes":0,  "discussao_caso":"—",       "demanda_principal":"Sem médico e sem eMulti — barco quinzenal"},
    ]


@lru_cache(maxsize=1)
def _ATIVIDADES():
    return [
        {"tipo":"Consulta compartilhada",           "realizadas_mes":124,"meta_mes":150,"profissional_apoio":"Psicologia / Fisioterapia","principais_queixas":"Ansiedade, dor crônica, DPOC"},
        {"tipo":"Teleconsultoria / matriciamento remoto","realizadas_mes":84,"meta_mes":80, "profissional_apoio":"Psiquiatra / Pediatra (Manaus)","principais_queixas":"Saúde mental grave, pediatria complexa"},
        {"tipo":"Discussão de caso clínico",         "realizadas_mes":38,"meta_mes":48, "profissional_apoio":"Todos os núcleos","principais_queixas":"Casos complexos multidisciplinares"},
        {"tipo":"Visita domiciliar conjunta",        "realizadas_mes":64,"meta_mes":60, "profissional_apoio":"Assist. Social + Fisioterapia","principais_queixas":"Acamados, situação de risco"},
        {"tipo":"Grupo educativo / terapêutico",     "realizadas_mes":22,"meta_mes":24, "profissional_apoio":"Nutrição + Ed. Físico + Psicologia","principais_queixas":"DCNT, saúde mental, alimentação"},
        {"tipo":"Interconsulta cirúrgica / odonto",  "realizadas_mes":12,"meta_mes":20, "profissional_apoio":"Ginecologista / Odontologia","principais_queixas":"Colposcopia, procedimentos eletivos"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes":"Jan/2025","atendimentos_compartilhados":248,"consultorias":128,"grupos":18,"vd_conjuntas":52},
        {"mes":"Fev/2025","atendimentos_compartilhados":264,"consultorias":138,"grupos":20,"vd_conjuntas":58},
        {"mes":"Mar/2025","atendimentos_compartilhados":272,"consultorias":142,"grupos":21,"vd_conjuntas":61},
        {"mes":"Abr/2025","atendimentos_compartilhados":278,"consultorias":144,"grupos":22,"vd_conjuntas":62},
        {"mes":"Mai/2025","atendimentos_compartilhados":281,"consultorias":146,"grupos":22,"vd_conjuntas":63},
        {"mes":"Jun/2025","atendimentos_compartilhados":284,"consultorias":148,"grupos":22,"vd_conjuntas":64},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador":"Equipes eSF com Apoio eMulti",       "valor":"4/6 (66,7%)","meta":"6/6 (100%)","status":"atencao","obs":"eSF Rural I e Ribeirinha sem apoio — 2 das mais vulneráveis. Sem TO e fonoaudiólogo no eMulti: crianças com atraso de desenvolvimento sem suporte especializado na APS"},
        {"indicador":"Profissionais eMulti / Meta",        "valor":"8/14",       "meta":"14",         "status":"atencao","obs":"Déficit de 6 profissionais: TO, fonoaudiólogo, pediatra e mais 3 generalistas. Carga excessiva nos 8 atuais — risco de esgotamento e rotatividade"},
        {"indicador":"Atendimentos Compartilhados/mês",    "valor":"284",        "meta":"≥ 300",      "status":"atencao","obs":"Matriciamento real ainda restrito — telessaúde cobre parte da demanda mas não substitui presença física para casos complexos"},
        {"indicador":"Encaminhamentos Reduzidos",          "valor":"28,4%",      "meta":"≥ 40%",      "status":"atencao","obs":"Matriciamento bem-sucedido ainda reduz menos encaminhamentos do que o esperado: resolutividade APS prejudicada pelo sub-número de profissionais"},
        {"indicador":"Satisfação eSF com eMulti",          "valor":"78,4%",      "meta":"≥ 85%",      "status":"atencao","obs":"Principal queixa: falta de agenda regular e imprevisibilidade do apoio. eSF reclama de não saber quando o profissional de saúde mental virá"},
        {"indicador":"Grupos Terapêuticos / mês",          "valor":"22",         "meta":"≥ 24",       "status":"ok",     "obs":"Grupos funcionando bem nas áreas com eMulti — limitados pela baixa cobertura rural"},
    ]


@router.get("/dashboard")
def dashboard(): return _DASHBOARD

@router.get("/equipes")
def equipes(): return _EQUIPES

@router.get("/atividades")
def atividades(): return _ATIVIDADES

@router.get("/historico")
def historico(): return _HISTORICO

@router.get("/indicadores")
def indicadores(): return _INDICADORES
