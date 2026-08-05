from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/mapa-sanitario", tags=["mapa-sanitario"])

@lru_cache(maxsize=1)
def _UNIDADES():
    return [
        {
            "id": "u01", "nome": "UBS Central — Dr. José Leão", "tipo": "UBS", "cnes": "2517043",
            "endereco": "Rua Coronel Figueiredo, 215", "bairro": "Centro", "zona": "urbana",
            "latitude": -7.1986, "longitude": -59.8807,
            "equipes": 2, "profissionais": 18, "populacao_vinculada": 3200,
            "score_previne": 7.1, "status_cnes": "ativo",
            "horario": "07h–17h (seg–sex)",
            "servicos": ["Consulta médica", "Enfermagem", "Odontologia", "Vacinas", "Preventivo", "Pré-natal", "Coleta laboratorial"],
            "indicadores": [
                {"nome": "Score Previne", "valor": "7,1", "cor": "#16a34a"},
                {"nome": "ESF", "valor": "2 equipes", "cor": "#1351b4"},
                {"nome": "Cobertura", "valor": "3.200 pess.", "cor": "#0d9488"},
            ],
        },
        {
            "id": "u02", "nome": "UBS Bairro Novo", "tipo": "UBS", "cnes": "2517051",
            "endereco": "Av. Raimundo Pereira, 88", "bairro": "Bairro Novo", "zona": "urbana",
            "latitude": -7.2140, "longitude": -59.8720,
            "equipes": 1, "profissionais": 10, "populacao_vinculada": 1800,
            "score_previne": 6.4, "status_cnes": "ativo",
            "horario": "07h–17h (seg–sex)",
            "servicos": ["Consulta médica", "Enfermagem", "Vacinas", "Pré-natal", "Curativo"],
            "indicadores": [
                {"nome": "Score Previne", "valor": "6,4", "cor": "#d97706"},
                {"nome": "Cobertura", "valor": "1.800 pess.", "cor": "#0d9488"},
            ],
        },
        {
            "id": "u03", "nome": "UBS Rural Zona Norte", "tipo": "UBS", "cnes": "2517078",
            "endereco": "Ramal do Castanhal, km 12", "bairro": "Zona Rural Norte", "zona": "rural",
            "latitude": -6.9800, "longitude": -59.7600,
            "equipes": 1, "profissionais": 7, "populacao_vinculada": 980,
            "score_previne": 5.8, "status_cnes": "ativo",
            "horario": "07h–13h (seg/qua/sex)",
            "servicos": ["Consulta enfermagem", "Vacinas", "Curativos", "Dispensação básica"],
            "indicadores": [
                {"nome": "Score Previne", "valor": "5,8", "cor": "#dc2626"},
                {"nome": "Cobertura", "valor": "980 pess.", "cor": "#0d9488"},
                {"nome": "Alerta", "valor": "Sem médico", "cor": "#dc2626"},
            ],
        },
        {
            "id": "u04", "nome": "UBS Rio Juma", "tipo": "UBS", "cnes": "2517086",
            "endereco": "Comunidade Rio Juma, s/n", "bairro": "Zona Rural Sul", "zona": "rural",
            "latitude": -7.4500, "longitude": -59.9200,
            "equipes": 1, "profissionais": 5, "populacao_vinculada": 620,
            "score_previne": 6.0, "status_cnes": "ativo",
            "horario": "08h–12h (ter/qui)",
            "servicos": ["Consulta médica itinerante", "Vacinas", "Enfermagem"],
            "indicadores": [
                {"nome": "Score Previne", "valor": "6,0", "cor": "#d97706"},
                {"nome": "Acesso", "valor": "Via fluvial", "cor": "#0369a1"},
            ],
        },
        {
            "id": "u05", "nome": "CAPS AD — Bem-Estar", "tipo": "CAPS", "cnes": "2517094",
            "endereco": "Rua das Palmeiras, 340", "bairro": "Centro", "zona": "urbana",
            "latitude": -7.2010, "longitude": -59.8850,
            "equipes": 0, "profissionais": 8, "populacao_vinculada": 0,
            "score_previne": None, "status_cnes": "ativo",
            "horario": "08h–18h (seg–sex)",
            "servicos": ["Psiquiatria", "Psicologia", "Assistência social", "Grupo terapêutico", "Dispensação CID F"],
            "indicadores": [
                {"nome": "Usuários ativos", "valor": "73", "cor": "#7c3aed"},
                {"nome": "Capacidade", "valor": "100", "cor": "#9ca3af"},
            ],
        },
        {
            "id": "u06", "nome": "UPA Apuí", "tipo": "UPA", "cnes": "7235410",
            "endereco": "Av. Tupinambá, 1100", "bairro": "Centro", "zona": "urbana",
            "latitude": -7.1950, "longitude": -59.8780,
            "equipes": 0, "profissionais": 32, "populacao_vinculada": 0,
            "score_previne": None, "status_cnes": "ativo",
            "horario": "24h",
            "servicos": ["Urgência e emergência", "Observação", "Pequenas cirurgias", "Exames de imagem"],
            "indicadores": [
                {"nome": "Leitos observação", "valor": "12", "cor": "#dc2626"},
                {"nome": "Atend./mês", "valor": "840", "cor": "#374151"},
            ],
        },
        {
            "id": "u07", "nome": "SAD — Serviço de Atenção Domiciliar", "tipo": "SAD", "cnes": "2517102",
            "endereco": "Rua Coronel Figueiredo, 215 (UBS Central)", "bairro": "Centro", "zona": "urbana",
            "latitude": -7.2000, "longitude": -59.8820,
            "equipes": 0, "profissionais": 4, "populacao_vinculada": 0,
            "score_previne": None, "status_cnes": "ativo",
            "horario": "08h–17h (seg–sex)",
            "servicos": ["Visitas domiciliares", "Curativos complexos", "Suporte nutricional", "Fisioterapia domiciliar"],
            "indicadores": [
                {"nome": "Pacientes ativos", "valor": "28", "cor": "#0d9488"},
            ],
        },
        {
            "id": "u08", "nome": "LAM — Laboratório Municipal", "tipo": "LAM", "cnes": "2517110",
            "endereco": "Av. do Comércio, 55", "bairro": "Centro", "zona": "urbana",
            "latitude": -7.1975, "longitude": -59.8810,
            "equipes": 0, "profissionais": 5, "populacao_vinculada": 0,
            "score_previne": None, "status_cnes": "ativo",
            "horario": "07h–12h (seg–sáb)",
            "servicos": ["Hemograma", "Glicemia", "Lipidograma", "PCR malária", "Urina tipo I", "Parasitológico"],
            "indicadores": [
                {"nome": "Exames/mês", "valor": "1.240", "cor": "#ea580c"},
            ],
        },
    ]


@router.get("/resumo")
def resumo():
    ativas = [u for u in _UNIDADES() if u["status_cnes"] == "ativo"]
    esf    = [u for u in _UNIDADES() if u["tipo"] == "UBS"]
    pop_cob = sum(u["populacao_vinculada"] for u in _UNIDADES())
    equipes  = sum(u["equipes"] for u in _UNIDADES())
    return {
        "total_unidades":     len(_UNIDADES()),
        "unidades_ativas":    len(ativas),
        "populacao_coberta":  pop_cob,
        "populacao_total":    8800,
        "cobertura_esf_pct":  round(pop_cob / 8800 * 100, 1),
        "equipes_esf":        equipes,
        "municipio":          "Apuí/AM",
        "area_km2":           54279,
    }

@router.get("/unidades")
def unidades():
    return _UNIDADES
