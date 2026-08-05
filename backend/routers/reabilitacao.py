from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/reabilitacao", tags=["reabilitacao"])

@lru_cache(maxsize=1)
def _MODALIDADES():
    return [
        {"modalidade": "Fisioterapia", "pacientes_ativos": 284, "lista_espera": 148,
         "tempo_espera_dias": 42, "sessoes_mes": 1242, "profissionais": 2,
         "alta_mes": 18, "status": "critico"},
        {"modalidade": "Terapia Ocupacional", "pacientes_ativos": 142, "lista_espera": 96,
         "tempo_espera_dias": 58, "sessoes_mes": 486, "profissionais": 1,
         "alta_mes": 8, "status": "critico"},
        {"modalidade": "Fonoaudiologia", "pacientes_ativos": 98, "lista_espera": 64,
         "tempo_espera_dias": 48, "sessoes_mes": 312, "profissionais": 1,
         "alta_mes": 6, "status": "critico"},
        {"modalidade": "Psicologia (Reabilitação)", "pacientes_ativos": 112, "lista_espera": 82,
         "tempo_espera_dias": 54, "sessoes_mes": 364, "profissionais": 1,
         "alta_mes": 7, "status": "critico"},
        {"modalidade": "Assistência Social", "pacientes_ativos": 248, "lista_espera": 22,
         "tempo_espera_dias": 14, "sessoes_mes": 512, "profissionais": 2,
         "alta_mes": 24, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _PCD_CADASTROS():
    return [
        {"tipo_deficiencia": "Física / Motora", "cadastrados": 412, "beneficio_bpc": 124,
         "ortese_protese_indicada": 98, "ortese_protese_entregue": 62, "status": "critico"},
        {"tipo_deficiencia": "Intelectual / Cognitiva", "cadastrados": 218, "beneficio_bpc": 142,
         "ortese_protese_indicada": 12, "ortese_protese_entregue": 12, "status": "ok"},
        {"tipo_deficiencia": "Visual", "cadastrados": 164, "beneficio_bpc": 84,
         "ortese_protese_indicada": 148, "ortese_protese_entregue": 102, "status": "atencao"},
        {"tipo_deficiencia": "Auditiva", "cadastrados": 152, "beneficio_bpc": 64,
         "ortese_protese_indicada": 104, "ortese_protese_entregue": 68, "status": "atencao"},
        {"tipo_deficiencia": "Múltipla", "cadastrados": 86, "beneficio_bpc": 54,
         "ortese_protese_indicada": 42, "ortese_protese_entregue": 24, "status": "critico"},
        {"tipo_deficiencia": "TEA / Autismo", "cadastrados": 68, "beneficio_bpc": 34,
         "ortese_protese_indicada": 8, "ortese_protese_entregue": 8, "status": "ok"},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"mes": "Jan", "sessoes_total": 2684, "novos_pacientes": 42, "altas": 58, "lista_espera_total": 384},
        {"mes": "Fev", "sessoes_total": 2548, "novos_pacientes": 38, "altas": 52, "lista_espera_total": 396},
        {"mes": "Mar", "sessoes_total": 2812, "novos_pacientes": 48, "altas": 64, "lista_espera_total": 388},
        {"mes": "Abr", "sessoes_total": 2764, "novos_pacientes": 44, "altas": 60, "lista_espera_total": 402},
        {"mes": "Mai", "sessoes_total": 2916, "novos_pacientes": 52, "altas": 68, "lista_espera_total": 408},
        {"mes": "Jun", "sessoes_total": 2916, "novos_pacientes": 46, "altas": 63, "lista_espera_total": 412},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Lista de espera total (reabilitação)", "valor": 412, "meta": 0, "unidade": "pacientes",
         "status": "critico", "observacao": "412 aguardando — fisioterapia concentra 36% da espera"},
        {"indicador": "Tempo espera fisioterapia", "valor": 42, "meta": 15, "unidade": "dias",
         "status": "critico", "observacao": "2,8× acima da meta — 1 profissional para cada 142 pacientes"},
        {"indicador": "Órteses/próteses entregues/indicadas", "valor": 74.1, "meta": 95.0, "unidade": "%",
         "status": "critico", "observacao": "256 dispositivos indicados, 192 entregues — 64 PCD sem dispositivo"},
        {"indicador": "PCD cadastrados no município", "valor": 1100, "meta": None, "unidade": "pessoas",
         "status": "atencao", "observacao": "1.100 PCD — 5,8% da população estimada (vs 24% nacional)"},
        {"indicador": "CER na cidade", "valor": 0, "meta": 1, "unidade": "unidades",
         "status": "critico", "observacao": "Sem CER — reabilitação especializada apenas via referência"},
        {"indicador": "BPC recebido por PCD", "valor": 502, "meta": None, "unidade": "beneficiários",
         "status": "ok", "observacao": "502 PCD com BPC — cobertura previdenciária parcial"},
    ]



@router.get("/dashboard")
def dashboard():
    return {
        "pcd_cadastrados": 1100,
        "pacientes_reab_ativos": 884,
        "lista_espera_total": 412,
        "sessoes_mes": 2916,
        "modalidades": 5,
        "fisioterapeutas": 2,
        "cer_municipal": False,
        "ortese_protese_pendente": 64,
        "bpc_beneficiarios": 502,
        "alta_mes": 63,
    }


@router.get("/modalidades")
def modalidades():
    return _MODALIDADES


@router.get("/pcd-cadastros")
def pcd_cadastros():
    return _PCD_CADASTROS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
