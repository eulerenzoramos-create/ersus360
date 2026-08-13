"""
Router: /api/ist-hiv — ERSUS 360
IST / HIV / AIDS / Hepatites Virais · Cascata 90-90-90 · FMS Apuí/AM
Dados de referência municipal — situacao_dado = referencia_municipal
Perfil AM: alta prevalência regional (Amazônia, garimpo, mobilidade populacional)
"""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(prefix="/api/ist-hiv", tags=["IST / HIV / AIDS"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2025",
        "pvha_total": 48,
        "hiv_novos_ano": 6,
        "tarv_pct": 83.3,
        "cv_suprimida_pct": 72.9,
        "sifilis_adquirida_ano": 28,
        "sifilis_gestante_ano": 14,
        "sifilis_congenita_ano": 3,
        "obitos_aids_ano": 1,
        "prep_usuarios": 8,
        "pep_dispensacoes_ano": 12,
        "cascata_meta": "90-90-90",
        "hepatite_b_novos_ano": 4,
        "hepatite_c_novos_ano": 2,
        "nota": "Referência baseada em parâmetros epidemiológicos para municípios amazônicos ~20 mil hab. Alta prevalência regional.",
    }


@router.get("/indicadores")
async def indicadores():
    return [
        {"situacao_dado": "referencia_municipal", "indicador": "PVHA em TARV (meta: 90%)",               "valor": 83.3, "meta": 90,  "unidade": "%",    "status": "atencao", "observacao": "8 PVHA sem TARV — evasão rural e perda de seguimento."},
        {"situacao_dado": "referencia_municipal", "indicador": "Carga Viral Suprimida (meta: 90%)",       "valor": 72.9, "meta": 90,  "unidade": "%",    "status": "critico", "observacao": "Falha terapêutica e abandono. Teleconsulta infectologia UNA-SUS."},
        {"situacao_dado": "referencia_municipal", "indicador": "Sífilis Congênita (meta: eliminação)",   "valor": 3,    "meta": 0,   "unidade": "casos", "status": "critico", "observacao": "3 casos/ano — meta MS: 0,5/1.000 NV. Pré-natal inadequado."},
        {"situacao_dado": "referencia_municipal", "indicador": "Testagem HIV/Sífilis Gestantes (%)",     "valor": 84.2, "meta": 100, "unidade": "%",    "status": "atencao", "observacao": "15,8% das gestantes sem testagem — acesso rural comprometido."},
        {"situacao_dado": "referencia_municipal", "indicador": "PrEP — usuários ativos",                 "valor": 8,    "meta": None,"unidade": "pac.", "status": "ok",      "observacao": "Dispensação pela UBS Central — TDF/3TC disponível (MS)."},
        {"situacao_dado": "referencia_municipal", "indicador": "Taxa Sífilis Adquirida (por 100 mil)",   "valor": 140,  "meta": 30,  "unidade": "/100k", "status": "critico", "observacao": "4,7× a meta nacional. Intensificar testagem e tratamento dos parceiros."},
        {"situacao_dado": "referencia_municipal", "indicador": "Hepatite B — vacinação 3 doses ≥18a (%)", "valor": 72.4,"meta": 95,  "unidade": "%",   "status": "atencao", "observacao": "Vacinação adulto insuficiente — estratégia de oportunidade na UBS."},
    ]


@router.get("/hiv-pacientes")
async def hiv_pacientes():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "2025",
        "pvha_total": 48,
        "perfil_por_faixa": [
            {"faixa": "15–24 anos", "pvha": 6,  "tarv_pct": 66.7, "cv_suprimida_pct": 50.0, "cd4_medio": 420, "status": "critico"},
            {"faixa": "25–34 anos", "pvha": 14, "tarv_pct": 78.6, "cv_suprimida_pct": 64.3, "cd4_medio": 510, "status": "atencao"},
            {"faixa": "35–44 anos", "pvha": 16, "tarv_pct": 87.5, "cv_suprimida_pct": 81.3, "cd4_medio": 580, "status": "atencao"},
            {"faixa": "45–59 anos", "pvha": 10, "tarv_pct": 90.0, "cv_suprimida_pct": 80.0, "cd4_medio": 620, "status": "atencao"},
            {"faixa": "≥60 anos",   "pvha": 2,  "tarv_pct": 100,  "cv_suprimida_pct": 100,  "cd4_medio": 640, "status": "ok"},
        ],
        "cascata_90_90_90": {
            "diagnosticados_pct": 88.4,
            "em_tarv_dos_diag_pct": 83.3,
            "cv_suprimida_dos_tarv_pct": 72.9,
            "observacao": "Abaixo da meta 90-90-90 em todos os pilares — evasão rural e teleconsulta insuficiente.",
        },
        "tarv_esquemas": [
            {"esquema": "TDF + 3TC + DTG (1ª linha)", "pacientes": 32, "pct": 80.0},
            {"esquema": "AZT + 3TC + NVP (antigo)",   "pacientes": 4,  "pct": 10.0},
            {"esquema": "2ª linha / resgate",          "pacientes": 4,  "pct": 10.0},
        ],
        "nota": "Referência municipal Apuí/AM. DTG — esquema atual MS.",
    }


@router.get("/testagem")
async def testagem():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jan–Jun 2026",
        "testes_rapidos_hiv_mes": 148,
        "testes_rapidos_sifilis_mes": 184,
        "testes_rapidos_hepatite_b_mes": 92,
        "testes_rapidos_hepatite_c_mes": 48,
        "positividade_hiv_pct": 2.0,
        "positividade_sifilis_pct": 7.6,
        "positividade_hep_b_pct": 2.2,
        "positividade_hep_c_pct": 2.1,
        "testagem_campanha_julho_2025": 842,
        "pontos_testagem": ["UBS Central", "CAPS AD", "Maternidade (pré-natal)", "Unidade Prisional", "Aldeias indígenas (SESAI)"],
        "testagem_gestantes_pct": 84.2,
        "testagem_parceiros_pct": 42.4,
        "nota": "Positividade sífilis alta (7,6%) — supera média nacional de 1,4%. Contexto garimpo e mobilidade.",
    }


@router.get("/prep")
async def prep():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "periodo": "Jun 2026",
        "prep_usuarios_ativos": 8,
        "prep_perfil": [
            {"grupo": "HSH (homens que fazem sexo com homens)", "usuarios": 4, "pct": 50.0},
            {"grupo": "Mulheres trans / travestis",             "usuarios": 2, "pct": 25.0},
            {"grupo": "Parcerias sorodiscordantes",             "usuarios": 2, "pct": 25.0},
        ],
        "prep_medicamento": "TDF/3TC (Tenofovir + Lamivudina) — 1 comprimido/dia",
        "prep_disponivel": True,
        "prep_ruptura_meses": 0,
        "pep_dispensacoes_ano": 12,
        "pep_motivo_principal": "Violência sexual (8/12) e acidente ocupacional (4/12)",
        "profilaxia_is_disponivel": True,
        "observacao": "PrEP disponível na UBS Central. Adesão monitorada trimestralmente. Ampliar para populações-chave rurais.",
        "nota": "Referência municipal Apuí/AM.",
    }
