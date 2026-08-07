from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/saude-ocular", tags=["saude_ocular"])

@lru_cache(maxsize=1)
def _CONDICOES():
    return [
        {"condicao": "Erro Refrativo (miopía/hipermetropia/astigmatismo)", "casos_ano": 412, "cirurgia": False,
         "oculos_dispensados": 284, "lista_espera_avaliacao": 128, "status": "atencao"},
        {"condicao": "Catarata", "casos_ano": 68, "cirurgia": True,
         "cirurgias_ano": 42, "meta_cirurgias": 60, "lista_espera_cirurgia": 86, "tempo_espera_dias": 124, "status": "critico"},
        {"condicao": "Glaucoma", "casos_ano": 34, "cirurgia": False,
         "em_tratamento": 34, "lista_espera_avaliacao": 22, "status": "atencao"},
        {"condicao": "Retinopatia Diabética", "casos_ano": 28, "cirurgia": False,
         "rastreados_pct": 44.2, "meta_rastreio_pct": 80.0, "status": "critico"},
        {"condicao": "Pterígio", "casos_ano": 22, "cirurgia": True,
         "cirurgias_ano": 14, "lista_espera_cirurgia": 36, "tempo_espera_dias": 68, "status": "atencao"},
        {"condicao": "Conjuntivite / Outras", "casos_ano": 186, "cirurgia": False,
         "lista_espera_avaliacao": 0, "status": "ok"},
    ]


@lru_cache(maxsize=1)
def _OCULOS():
    return [
        {"programa": "Olhar Brasil (escolares)", "beneficiarios_ano": 148, "triagens_realizadas": 312,
         "encaminhados_spec": 84, "oculos_dispensados": 142, "status": "ok"},
        {"programa": "Idosos (60+)", "beneficiarios_ano": 86, "triagens_realizadas": 142,
         "encaminhados_spec": 68, "oculos_dispensados": 72, "status": "atencao"},
        {"programa": "Pessoas com Deficiência", "beneficiarios_ano": 24, "triagens_realizadas": 48,
         "encaminhados_spec": 22, "oculos_dispensados": 18, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan", "consultas_oftalmo": 142, "cirurgias": 6, "oculos_dispensados": 48, "lista_espera_catarata": 78},
        {"mes": "Fev", "consultas_oftalmo": 128, "cirurgias": 4, "oculos_dispensados": 42, "lista_espera_catarata": 80},
        {"mes": "Mar", "consultas_oftalmo": 156, "cirurgias": 8, "oculos_dispensados": 54, "lista_espera_catarata": 76},
        {"mes": "Abr", "consultas_oftalmo": 148, "cirurgias": 6, "oculos_dispensados": 50, "lista_espera_catarata": 82},
        {"mes": "Mai", "consultas_oftalmo": 162, "cirurgias": 9, "oculos_dispensados": 58, "lista_espera_catarata": 84},
        {"mes": "Jun", "consultas_oftalmo": 158, "cirurgias": 9, "oculos_dispensados": 32, "lista_espera_catarata": 86},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Lista espera catarata", "valor": 86, "meta": 0, "unidade": "pacientes",
         "status": "critico", "observacao": "124 dias de espera — catarata bilateral causa cegueira evitável"},
        {"indicador": "Cirurgias catarata/ano", "valor": 42, "meta": 60, "unidade": "cirurgias",
         "status": "critico", "observacao": "70% da meta — capacidade cirúrgica insuficiente"},
        {"indicador": "Rastreio retinopatia diabética", "valor": 44.2, "meta": 80.0, "unidade": "%",
         "status": "critico", "observacao": "Menos da metade dos diabéticos rastreados — risco de cegueira"},
        {"indicador": "Óculos dispensados/ano", "valor": 232, "meta": None, "unidade": "pares",
         "status": "ok", "observacao": "Programa Olhar Brasil e idosos — cobertura satisfatória"},
        {"indicador": "Tempo espera pterígio", "valor": 68, "meta": 30, "unidade": "dias",
         "status": "critico", "observacao": "Pterígio avançado causa astigmatismo e comprometimento visual"},
        {"indicador": "Cobertura oftalmologista", "valor": 1, "meta": None, "unidade": "especialista",
         "status": "atencao", "observacao": "Município com 1 oftalmologista — itinerante, 2x/semana"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "consultas_oftalmo_mes": 158,
        "cirurgias_mes": 9,
        "cirurgias_catarata_ano": 42,
        "lista_espera_catarata": 86,
        "tempo_espera_catarata_dias": 124,
        "oculos_dispensados_ano": 232,
        "rastreio_retinopatia_pct": 44.2,
        "oftalmologistas": 1,
        "atendimento_oftalmo": "itinerante 2x/semana",
        "condicoes_monitoradas": 6,
    }


@router.get("/condicoes")
def condicoes():
    return _CONDICOES()


@router.get("/oculos-dispensados")
def oculos_dispensados():
    return _OCULOS()


@router.get("/historico")
def historico():
    return _HISTORICO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()