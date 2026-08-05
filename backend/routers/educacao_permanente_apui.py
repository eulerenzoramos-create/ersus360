from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/educacao-permanente-apui", tags=["educacao_permanente_apui"])

@lru_cache(maxsize=1)
def _DASHBOARD():
    return {
        "municipio": "Apuí/AM",
        "populacao_total": 24700,
        "profissionais_saude_total": 284,
        # Capacitação
        "profissionais_capacitados_2025": 84,
        "capacitados_pct": 29.6,
        "meta_capacitados_pct": 100.0,
        "horas_educacao_permanente_media": 4.2,
        "meta_horas_ep_ano": 40.0,
        "curso_unasus_matriculados": 28,
        "meta_unasus_pct": 80.0,
        # Residência / Internato
        "medico_residente_apui": 0,
        "residencia_mfc_vaga": False,
        "internato_rural_2025": 2,
        # PNAB / PREVINE
        "equipes_sf_apui": 4,
        "acs_total": 28,
        "acs_capacitado_sisab_pct": 42.4,
        "meta_acs_sisab_pct": 100.0,
        # Humanização / PNH
        "acolhimento_treinado_pct": 28.4,
        "meta_acolhimento_pct": 100.0,
        "ouvidoria_capacitada": True,
        "pnh_implantado": False,
        # Telecapacitação
        "telessaude_teleconsultoria_mes": 18,
        "metaboard_teleconsultoria_mes": 100,
        "webinario_participantes_2025": 84,
        "tele_educacao_horas_2025": 42.0,
        # Estrutura EPS
        "comissao_eps_apui": False,
        "plano_eps_2025": False,
        "verba_eps_planejada_2025": 0,
        "meta_verba_eps": 84000,
        "nucleo_eps_apui": False,
        "status_capacitacao": "critico",
        "status_educacao_permanente": "critico",
        "status_unasus": "critico",
    }


@lru_cache(maxsize=1)
def _ACOES():
    return [
        {"acao": "Plano Municipal de Educação Permanente em Saúde — elaboração e execução",
         "implementada": False, "custo": 8400, "prazo_meses": 2,
         "observacao": "Plano EPS: zero em Apuí. CONASS/CONASEMS: formulário padronizado + COSEMS-AM apoia elaboração. Custo de oficina de planejamento: R$ 8.400 (facilitador + impressão). EPS: inclui capacitação em serviço + grupos tutoriais + reuniões de equipe. Comissão de Integração Ensino-Serviço (CIES) regional: participação gratuita + apoio técnico. Verba EPS: R$ 0 planejada (meta R$ 84.000/ano = R$ 296/profissional). PNEPS 2004: lei que exige EPS nos municípios — Apuí sem implementação."},
        {"acao": "UNA-SUS — capacitação online 100% dos profissionais em 12 meses",
         "implementada": False, "custo": 0, "prazo_meses": 3,
         "observacao": "UNASUS: plataforma gratuita do MS. 28 matriculados (meta: 227 = 80% dos 284 profissionais). Cursos prioritários: Manejo Clínico da Dengue (carga: 20h) + SISAB Web (8h) + Saúde da Mulher APS (30h) + Atualização ESF (40h). Custo: R$ 0. Responsável: coordenador de EPS (criar função). 60 cursos relevantes disponíveis. Meta: 40h/profissional/ano. Apuí: 4,2h/profissional/ano atual."},
        {"acao": "Tele-educação — webinários quinzenais com TELESSAÚDE-AM",
         "implementada": False, "custo": 0, "prazo_meses": 1,
         "observacao": "TELESSAÚDE-AM: 18 teleconsultorias/mês (meta 100). Tele-educação: webinários quinzenais gratuitos — participação de toda equipe da UBS. Temas: emergências clínicas, protocolos APS, SIAB, saúde mental, manejo de casos complexos. Custo: R$ 0 (equipamento já disponível: computador + internet). 1 webinário/mês substituído por reunião de equipe = 12h tele-educação/ano/profissional. Meta: 20h tele-educação + 20h UNASUS = 40h/ano."},
        {"acao": "Residência Médica de Família e Comunidade — vaga em Apuí",
         "implementada": False, "custo": 84000, "prazo_meses": 12,
         "observacao": "Zero médico residente em Apuí. MFC residente: produtividade dupla (residente + preceptor) + fidelização pós-residência. Convênio UNASUS + UFAM + SES-AM: vagas COREMU-AM para municípios remotos. Custo município: R$ 84.000/ano (bolsa residência 50% + infraestrutura). Preceptor: médico de família já existente (gratificação R$ 1.400/mês). Internato rural UFAM: 2 estagiários 2025 — formalizar fluxo de permanência pós-formatura."},
        {"acao": "Capacitação em acolhimento e humanização — Política Nacional de Humanização",
         "implementada": False, "custo": 4200, "prazo_meses": 2,
         "observacao": "Acolhimento com classificação de risco: 28,4% capacitados (meta 100%). PNH: política do MS, custo zero + apoio COSEMS-AM. Capacitação: 8h presencial + 4h UNASUS = R$ 4.200 (facilitador + material). Acolhimento: -40% de encaminhamentos desnecessários + -28% de tempo de espera. Burocracia eliminada: 80% dos problemas de saúde resolvidos na APS com acolhimento qualificado. Implantação do Núcleo Ampliado de Saúde da Família (NASF/eMulti) após capacitação: ROI 8:1."},
    ]


@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {"ano": "2022", "capacitados_pct": 18.4, "horas_ep": 2.4, "unasus_matriculados": 8,  "tele_educacao_horas": 12.0, "webinarios": 28},
        {"ano": "2023", "capacitados_pct": 22.4, "horas_ep": 3.2, "unasus_matriculados": 14, "tele_educacao_horas": 24.0, "webinarios": 42},
        {"ano": "2024", "capacitados_pct": 26.4, "horas_ep": 3.8, "unasus_matriculados": 22, "tele_educacao_horas": 34.0, "webinarios": 62},
        {"ano": "2025", "capacitados_pct": 29.6, "horas_ep": 4.2, "unasus_matriculados": 28, "tele_educacao_horas": 42.0, "webinarios": 84},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Profissionais capacitados (meta: 100%/ano)",           "valor": 29.6, "meta": 100.0, "unidade": "%",       "status": "critico", "observacao": "29,6%. Plano EPS: zero. COSEMS-AM apoia elaboração. UNA-SUS: R$ 0. 40h/profissional = meta PNEPS."},
        {"indicador": "Horas de EP/profissional/ano (meta: ≥ 40h)",          "valor": 4.2,  "meta": 40.0,  "unidade": "h",       "status": "critico", "observacao": "4,2h (10,5% da meta). UNA-SUS gratuito: +20h. Tele-educação TELESSAÚDE-AM: +20h. Total: 40h sem custo."},
        {"indicador": "UNA-SUS matriculados (meta: 80% dos profissionais)",  "valor": 28,   "meta": 227,   "unidade": "profis.", "status": "critico", "observacao": "28/227. Plataforma gratuita MS. 60 cursos disponíveis. Coordenador EPS: criar função (sem custo extra)."},
        {"indicador": "Tele-educação TELESSAÚDE-AM (meta: 100 consultoria/mês)", "valor": 18, "meta": 100, "unidade": "cons/mês","status": "critico", "observacao": "18/100. Webinários quinzenais gratuitos. R$ 0. -40% encaminhamentos. 1 webinário = substituído por reunião de equipe."},
        {"indicador": "Residência MFC em Apuí (meta: ≥ 1 vaga)",             "valor": 0,    "meta": 1,     "unidade": "vagas",   "status": "critico", "observacao": "Zero. Convênio UFAM + SES-AM: R$ 84.000/ano. Preceptor: médico já existente +R$ 1.400/mês. Fidelização pós-residência."},
        {"indicador": "Plano Municipal EPS (meta: elaborado + executado)",   "valor": 0,    "meta": 1,     "unidade": "planos",  "status": "critico", "observacao": "Zero. COSEMS-AM apoia: R$ 8.400 (oficina). CIES regional: participação gratuita. PNEPS 2004 obrigatório."},
    ]


@lru_cache(maxsize=1)
def _PROGRAMAS():
    return [
        {"programa": "UNA-SUS", "descricao": "Plataforma gratuita do Ministério da Saúde — +60 cursos EAD em saúde", "status": "parcial", "beneficiarios": 28, "meta": 227, "custo": 0},
        {"programa": "TELESSAÚDE-AM", "descricao": "Tele-educação + tele-consultoria — webinários quinzenais gratuitos", "status": "parcial", "beneficiarios": 18, "meta": 100, "custo": 0},
        {"programa": "Residência MFC", "descricao": "Residência Médica de Família e Comunidade — convênio UFAM/SES-AM", "status": "ausente", "beneficiarios": 0, "meta": 1, "custo": 84000},
        {"programa": "Internato Rural UFAM", "descricao": "Estagiários de medicina em Apuí — fidelização pós-formatura", "status": "parcial", "beneficiarios": 2, "meta": 6, "custo": 0},
        {"programa": "PNH — Humanização", "descricao": "Acolhimento + classificação de risco + HumanizaSUS", "status": "ausente", "beneficiarios": 0, "meta": 284, "custo": 4200},
        {"programa": "Plano EPS Municipal", "descricao": "Planejamento anual de educação permanente — PNEPS obrigatório", "status": "ausente", "beneficiarios": 0, "meta": 1, "custo": 8400},
    ]



@router.get("/dashboard")
def dashboard():
    return _DASHBOARD


@router.get("/programas")
def programas():
    return _PROGRAMAS


@router.get("/acoes")
def acoes():
    return _ACOES


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
