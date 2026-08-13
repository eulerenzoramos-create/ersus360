"""
Router: /api/saude-lgbtqia-apui — ERSUS 360
Saúde LGBTQIA+ — Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/saude-lgbtqia-apui", tags=["saude_lgbtqia_apui"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "populacao_lgbtqia_estimada_pct": 8.0,
        "populacao_lgbtqia_estimada": 1600,
        "atendimentos_lgbtqia_identificados_mes": 28,
        "uso_nome_social_implementado": True,
        "treinamento_equipes_concluido_pct": 42.4,
        "violencias_notificadas_ano": 6,
        "ist_lgbtqia_notificadas_ano": 12,
        "sifilis_homo_bisse_ano": 8,
        "hiv_novos_homo_bisse_ano": 2,
        "prep_usuarios_lgbtqia": 5,
        "nota": "Referência baseada em dados PNLGBT e literatura de municípios amazônicos.",
    }


@router.get("/agravos")
async def agravos():
    return [
        {"situacao_dado": "referencia_municipal", "agravo": "Sífilis (homo/bissexuais)",      "casos_ano": 8,  "taxa_comparativa": "3,2× maior que heterossexuais", "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "HIV (homo/transsexuais)",         "casos_ano": 2,  "taxa_comparativa": "2,1× maior que heteros",        "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Depressão e ansiedade",           "casos_ano": 48, "taxa_comparativa": "2,8× maior (minoria estresse)", "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Ideação suicida",                 "casos_ano": 12, "taxa_comparativa": "4× maior (PAHO 2024)",          "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "Uso abusivo de álcool/drogas",   "casos_ano": 22, "taxa_comparativa": "1,8× maior",                    "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "agravo": "Violência LGBTfóbica",           "casos_ano": 6,  "taxa_comparativa": "Subnotificação estimada: 80%",   "status": "critico"},
        {"situacao_dado": "referencia_municipal", "agravo": "IST em geral",                   "casos_ano": 12, "taxa_comparativa": "Alta prevalência — PrEP 5 usu.", "status": "atencao"},
    ]


@router.get("/barreiras")
async def barreiras():
    return [
        {"situacao_dado": "referencia_municipal", "barreira": "Discriminação na UBS",             "impacto": "alto",   "implementada_solucao": False, "observacao": "42,4% das equipes sem treinamento. Rotatividade médica alta."},
        {"situacao_dado": "referencia_municipal", "barreira": "Uso do Nome Social",               "impacto": "alto",   "implementada_solucao": True,  "observacao": "Portaria municipal 2024 — implementado no prontuário e recepção."},
        {"situacao_dado": "referencia_municipal", "barreira": "Falta de profissional capacitado", "impacto": "alto",   "implementada_solucao": False, "observacao": "Sem profissional referência LGBTQIA+ na rede municipal."},
        {"situacao_dado": "referencia_municipal", "barreira": "Estigma / LGBTfobia",              "impacto": "muito_alto","implementada_solucao": False,"observacao": "Interior amazônico — estigma cultural elevado. 6 notificações/ano."},
        {"situacao_dado": "referencia_municipal", "barreira": "Acesso a hormônios (travestis/trans)","impacto": "alto","implementada_solucao": False, "observacao": "Processo transexualizador via Manaus (longa fila). Sem oferta local."},
        {"situacao_dado": "referencia_municipal", "barreira": "Distância do CAPS / saúde mental", "impacto": "medio",  "implementada_solucao": False, "observacao": "CAPS AD sem psiquiatra fixo. Teleconsulta parcialmente resolvida."},
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "ano": 2023, "atendimentos": 168, "violencias": 3, "ist": 8,  "prep_usu": 2, "treinamento_pct": 18.4},
        {"situacao_dado": "referencia_municipal", "ano": 2024, "atendimentos": 228, "violencias": 5, "ist": 10, "prep_usu": 4, "treinamento_pct": 32.4},
        {"situacao_dado": "referencia_municipal", "ano": 2025, "atendimentos": 312, "violencias": 6, "ist": 12, "prep_usu": 5, "treinamento_pct": 42.4},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "Equipes com treinamento LGBTQIA+ (%)",    "valor": 42.4, "meta": 100, "unidade": "%",     "status": "atencao", "observacao": "57,6% sem treinamento — risco de discriminação na UBS."},
        {"situacao_dado": "referencia_municipal", "indicador": "Nome Social implementado na rede",         "valor": 1,    "meta": 1,   "unidade": "simNão","status": "ok",      "observacao": "Portaria municipal ativa. Recepção e prontuário adaptados."},
        {"situacao_dado": "referencia_municipal", "indicador": "Violências LGBTfóbicas notificadas/ano",  "valor": 6,    "meta": 0,   "unidade": "casos", "status": "critico", "observacao": "Subnotificação estimada em 80%. Rede de proteção fraca."},
        {"situacao_dado": "referencia_municipal", "indicador": "PrEP — usuários LGBTQIA+ ativos",         "valor": 5,    "meta": None,"unidade": "pac.",  "status": "ok",      "observacao": "Dispensação UBS Central — medicamento disponível (MS)."},
        {"situacao_dado": "referencia_municipal", "indicador": "Ideação suicida LGBTQIA+ notificada/ano","valor": 12,   "meta": 0,   "unidade": "casos", "status": "critico", "observacao": "4× maior que população geral. CAPS sem grupo específico."},
        {"situacao_dado": "referencia_municipal", "indicador": "Processo transexualizador — acesso",      "valor": 0,    "meta": 1,   "unidade": "local", "status": "critico", "observacao": "Sem oferta local. Fila Manaus: 18–24 meses de espera."},
    ]
