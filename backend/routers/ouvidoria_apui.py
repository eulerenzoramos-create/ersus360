from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/ouvidoria-apui", tags=["ouvidoria_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "manifestacoes_total_ano": 284,
        "reclamacoes": 148,
        "denuncias": 42,
        "sugestoes": 52,
        "elogios": 28,
        "solicitacoes": 14,
        "respondidas_pct": 78.2,
        "meta_resposta_pct": 95.0,
        "tempo_medio_resposta_dias": 18,
        "meta_tempo_dias": 10,
        "anonimas_pct": 42.4,
        "reincidencias_ano": 38,
        "satisfacao_media_nota": 3.2,
        "satisfacao_meta_nota": 4.0,
        "canal_predominante": "Presencial / Balcão",
        "status_resposta": "atencao",
        "status_tempo": "atencao",
    }


@lru_cache(maxsize=1)
def _TEMAS():
    return [
        {"tema": "Demora no atendimento (UPA/UBS)",        "total": 64, "pct": 22.5, "resolvidas_pct": 72.0, "status": "atencao"},
        {"tema": "Falta de médico / especialista",          "total": 48, "pct": 16.9, "resolvidas_pct": 42.0, "status": "critico"},
        {"tema": "Falta de medicamento na farmácia",        "total": 38, "pct": 13.4, "resolvidas_pct": 68.4, "status": "atencao"},
        {"tema": "Demora na regulação / fila longa",        "total": 32, "pct": 11.3, "resolvidas_pct": 38.4, "status": "critico"},
        {"tema": "Infraestrutura / limpeza das unidades",   "total": 28, "pct":  9.9, "resolvidas_pct": 82.4, "status": "atencao"},
        {"tema": "Atendimento inadequado / desrespeito",    "total": 22, "pct":  7.7, "resolvidas_pct": 88.4, "status": "ok"},
        {"tema": "Falta de exames / equipamentos",          "total": 18, "pct":  6.3, "resolvidas_pct": 32.4, "status": "critico"},
        {"tema": "Transporte sanitário",                    "total": 14, "pct":  4.9, "resolvidas_pct": 64.2, "status": "atencao"},
        {"tema": "Vacinação / imunização",                  "total": 12, "pct":  4.2, "resolvidas_pct": 92.0, "status": "ok"},
        {"tema": "Outros",                                  "total": 8,  "pct":  2.9, "resolvidas_pct": 75.0, "status": "ok"},
    ]


@lru_cache(maxsize=1)
def _CANAIS():
    return [
        {"canal": "Presencial / Balcão",  "manifestacoes": 148, "pct": 52.1},
        {"canal": "Telefone (0800)",       "manifestacoes": 64,  "pct": 22.5},
        {"canal": "WhatsApp Municipal",    "manifestacoes": 42,  "pct": 14.8},
        {"canal": "Formulário digital",    "manifestacoes": 18,  "pct":  6.3},
        {"canal": "E-mail institucional",  "manifestacoes": 12,  "pct":  4.3},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan/25", "total": 22, "reclamacoes": 12, "denuncias": 3, "sugestoes": 4, "respondidas_pct": 76.4, "tempo_resp": 20},
        {"mes": "Fev/25", "total": 20, "reclamacoes": 10, "denuncias": 4, "sugestoes": 3, "respondidas_pct": 77.2, "tempo_resp": 19},
        {"mes": "Mar/25", "total": 24, "reclamacoes": 13, "denuncias": 5, "sugestoes": 4, "respondidas_pct": 78.4, "tempo_resp": 18},
        {"mes": "Abr/25", "total": 26, "reclamacoes": 14, "denuncias": 6, "sugestoes": 4, "respondidas_pct": 79.2, "tempo_resp": 17},
        {"mes": "Mai/25", "total": 28, "reclamacoes": 16, "denuncias": 7, "sugestoes": 3, "respondidas_pct": 78.8, "tempo_resp": 17},
        {"mes": "Jun/25", "total": 30, "reclamacoes": 18, "denuncias": 8, "sugestoes": 2, "respondidas_pct": 78.2, "tempo_resp": 18},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Taxa de resposta",                  "valor": 78.2, "meta": 95.0, "unidade": "%",     "status": "atencao", "observacao": "21,8% das manifestações sem resposta — sobrecarga da equipe (1 ouvidor para 24.892 hab.)"},
        {"indicador": "Tempo médio de resposta",           "valor": 18,   "meta": 10,   "unidade": "dias",  "status": "atencao", "observacao": "18 dias vs meta 10 — prazo quase 2× acima; denúncias ficam até 30 dias sem retorno"},
        {"indicador": "Satisfação do usuário (0–5)",       "valor": 3.2,  "meta": 4.0,  "unidade": "nota",  "status": "atencao", "observacao": "Usuários insatisfeitos com resolutividade — principais queixas não são solucionadas estruturalmente"},
        {"indicador": "Manifestações por falta de médico", "valor": 48,   "meta": 0,    "unidade": "manif.","status": "critico", "observacao": "Problema estrutural — falta de especialistas em Apuí não é resolvida pela ouvidoria"},
        {"indicador": "Reincidências (mesma queixa)",      "valor": 38,   "meta": 0,    "unidade": "casos", "status": "atencao", "observacao": "38 reincidências indicam resolução superficial — causas não são endereçadas na origem"},
        {"indicador": "Canal digital (internet)",          "valor": 10.6, "meta": 40.0, "unidade": "%",     "status": "critico", "observacao": "Só 10,6% usam canais digitais — população rural sem smartphone ou internet de qualidade"},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/temas")
def temas():
    return _TEMAS


@router.get("/canais")
def canais():
    return _CANAIS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
