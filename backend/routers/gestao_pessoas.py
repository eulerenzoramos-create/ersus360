from fastapi import APIRouter
from functools import lru_cache

router = APIRouter(prefix="/api/gestao-pessoas", tags=["gestao_pessoas"])

@lru_cache(maxsize=1)
def _QUADRO_RESUMO():
    return {
        "servidores_ativos": 186,
        "servidores_afastados": 14,
        "contratos_temporarios": 48,
        "estagiarios": 12,
        "total_rh": 260,
        "cargos_vagos_criticos": 8,
        "folha_mensal_r": 984240,
        "folha_percentual_receita_saude": 62.4,
    }


@lru_cache(maxsize=1)
def _CARGOS():
    return [
        {"cargo": "Médico Clínico Geral", "lotados": 8, "necessarios": 12, "vacantes": 4,
         "afastados": 2, "temporarios": 3, "status": "critico"},
        {"cargo": "Enfermeiro", "lotados": 22, "necessarios": 24, "vacantes": 2,
         "afastados": 1, "temporarios": 4, "status": "atencao"},
        {"cargo": "Técnico de Enfermagem", "lotados": 48, "necessarios": 52, "vacantes": 4,
         "afastados": 3, "temporarios": 12, "status": "atencao"},
        {"cargo": "Agente Comunitário de Saúde", "lotados": 42, "necessarios": 48, "vacantes": 6,
         "afastados": 2, "temporarios": 0, "status": "critico"},
        {"cargo": "Cirurgião-Dentista", "lotados": 6, "necessarios": 8, "vacantes": 2,
         "afastados": 0, "temporarios": 1, "status": "critico"},
        {"cargo": "Farmacêutico", "lotados": 3, "necessarios": 4, "vacantes": 1,
         "afastados": 0, "temporarios": 1, "status": "atencao"},
        {"cargo": "Fisioterapeuta", "lotados": 2, "necessarios": 4, "vacantes": 2,
         "afastados": 0, "temporarios": 0, "status": "critico"},
        {"cargo": "Psicólogo", "lotados": 4, "necessarios": 6, "vacantes": 2,
         "afastados": 1, "temporarios": 2, "status": "atencao"},
        {"cargo": "Assistente Social", "lotados": 5, "necessarios": 6, "vacantes": 1,
         "afastados": 0, "temporarios": 1, "status": "ok"},
        {"cargo": "Agente de Endemias (ACE)", "lotados": 18, "necessarios": 20, "vacantes": 2,
         "afastados": 1, "temporarios": 4, "status": "atencao"},
    ]


@lru_cache(maxsize=1)
def _AFASTAMENTOS():
    return [
        {"motivo": "Licença Médica", "quantidade": 6, "media_dias": 28, "custo_mensal_r": 0, "status": "atencao"},
        {"motivo": "Licença Maternidade/Paternidade", "quantidade": 3, "media_dias": 120, "custo_mensal_r": 0, "status": "ok"},
        {"motivo": "Afastamento INSS (>15d)", "quantidade": 2, "media_dias": 64, "custo_mensal_r": 0, "status": "atencao"},
        {"motivo": "Licença Capacitação", "quantidade": 2, "media_dias": 14, "custo_mensal_r": 0, "status": "ok"},
        {"motivo": "Processo Disciplinar", "quantidade": 1, "media_dias": 180, "custo_mensal_r": 4200, "status": "critico"},
    ]


@lru_cache(maxsize=1)
def _ABSENTEISMO():
    return [
        {"mes": "Jan", "faltas_justificadas": 48, "faltas_nao_justificadas": 12, "horas_extras": 284, "taxa_absenteismo_pct": 3.8},
        {"mes": "Fev", "faltas_justificadas": 42, "faltas_nao_justificadas": 8,  "horas_extras": 312, "taxa_absenteismo_pct": 3.2},
        {"mes": "Mar", "faltas_justificadas": 54, "faltas_nao_justificadas": 14, "horas_extras": 268, "taxa_absenteismo_pct": 4.4},
        {"mes": "Abr", "faltas_justificadas": 46, "faltas_nao_justificadas": 10, "horas_extras": 298, "taxa_absenteismo_pct": 3.6},
        {"mes": "Mai", "faltas_justificadas": 58, "faltas_nao_justificadas": 16, "horas_extras": 342, "taxa_absenteismo_pct": 4.8},
        {"mes": "Jun", "faltas_justificadas": 52, "faltas_nao_justificadas": 11, "horas_extras": 318, "taxa_absenteismo_pct": 4.2},
    ]


@lru_cache(maxsize=1)
def _INDICADORES():
    return [
        {"indicador": "Folha de pagamento / receita saúde", "valor": 62.4, "meta": 60.0, "unidade": "%",
         "status": "critico", "observacao": "Acima do limite prudencial de 60% — risco fiscal para FMS"},
        {"indicador": "Cargos críticos vagos", "valor": 8, "meta": 0, "unidade": "cargos",
         "status": "critico", "observacao": "Médico (4), ACS (6), Fisioterapeuta (2), CD (2) — impacto direto no acesso"},
        {"indicador": "Taxa de absenteísmo", "valor": 4.2, "meta": 2.0, "unidade": "%",
         "status": "critico", "observacao": "Dobro da meta — falta não justificada crescente em Mai/Jun"},
        {"indicador": "Horas extras / mês", "valor": 318, "meta": 200, "unidade": "horas",
         "status": "atencao", "observacao": "59% acima da meta — compensação pela falta de profissionais"},
        {"indicador": "Servidores em afastamento", "valor": 14, "meta": None, "unidade": "servidores",
         "status": "atencao", "observacao": "5,4% do quadro afastado — Médico e Técnico de Enfermagem os mais afetados"},
        {"indicador": "Contratos temporários / quadro total", "valor": 18.5, "meta": 15.0, "unidade": "%",
         "status": "atencao", "observacao": "Alta dependência de temporários — risco de descontinuidade assistencial"},
    ]



@router.get("/dashboard")
def dashboard():
    return _QUADRO_RESUMO()


@router.get("/cargos")
def cargos():
    return _CARGOS()


@router.get("/afastamentos")
def afastamentos():
    return _AFASTAMENTOS()


@router.get("/absenteismo")
def absenteismo():
    return _ABSENTEISMO()


@router.get("/indicadores")
def indicadores():
    return _INDICADORES()