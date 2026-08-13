"""Gestão de Leitos — Ocupação · AIH · Transferências · FMS Apuí/AM
Apuí não possui hospital próprio com UTI; leitos SUS na UBS ampliada.
Regulação via CROSS/AM para Humaitá e Manaus.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/gestao-leitos", tags=["gestao_leitos"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "referencia_municipal",
        "municipio": "Apuí/AM",
        "competencia": "Mar/2026",
        "leitos_sus": 38,
        "taxa_ocupacao_pct": 76.3,
        "meta_ocupacao_pct_max": 85,
        "internacoes_mes": 112,
        "media_permanencia_dias": 5.8,
        "meta_permanencia_dias": 4.5,
        "leitos_uti": 0,
        "transferencias_saida_mes": 22,
        "aih_aprovadas_mes": 98,
        "obito_hospitalar_mes": 4,
    }


@router.get("/leitos-tipo")
async def leitos_tipo():
    return [
        {"situacao_dado": "referencia_municipal", "tipo": "Clínica Médica", "total": 16, "ocupados": 13, "taxa_ocup": 81.3, "media_perm_dias": 5.4, "status": "atencao"},
        {"situacao_dado": "referencia_municipal", "tipo": "Cirúrgico/Obs. Cirúrgica", "total": 8, "ocupados": 5, "taxa_ocup": 62.5, "media_perm_dias": 4.2, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "tipo": "Pediatria", "total": 6, "ocupados": 4, "taxa_ocup": 66.7, "media_perm_dias": 3.8, "status": "ok"},
        {"situacao_dado": "referencia_municipal", "tipo": "Isolamento/Infecciosas", "total": 4, "ocupados": 4, "taxa_ocup": 100.0, "media_perm_dias": 7.2, "status": "critico"},
        {"situacao_dado": "referencia_municipal", "tipo": "Ginecologia/Obstetrícia", "total": 4, "ocupados": 2, "taxa_ocup": 50.0, "media_perm_dias": 2.9, "status": "ok"},
    ]


@router.get("/causas-internacao")
async def causas_internacao():
    return [
        {"situacao_dado": "referencia_municipal", "cid_grupo": "Cap. X — Doenças Respiratórias (J00-J99)", "internacoes": 22, "pct": 19.6},
        {"situacao_dado": "referencia_municipal", "cid_grupo": "Cap. I — Doenças Cardiovasculares (I00-I99)", "internacoes": 18, "pct": 16.1},
        {"situacao_dado": "referencia_municipal", "cid_grupo": "Cap. XI — Digestivo (K00-K93)", "internacoes": 16, "pct": 14.3},
        {"situacao_dado": "referencia_municipal", "cid_grupo": "Cap. I — Malária/Infecciosas (A00-B99)", "internacoes": 14, "pct": 12.5},
        {"situacao_dado": "referencia_municipal", "cid_grupo": "Cap. XIX — Traumatismos (S00-T98)", "internacoes": 14, "pct": 12.5},
        {"situacao_dado": "referencia_municipal", "cid_grupo": "Cap. V — Transt. Mentais (F00-F99)", "internacoes": 10, "pct": 8.9},
        {"situacao_dado": "referencia_municipal", "cid_grupo": "Cap. IV — End./Metabólicas (E00-E90)", "internacoes": 10, "pct": 8.9},
        {"situacao_dado": "referencia_municipal", "cid_grupo": "Outros grupos CID", "internacoes": 8, "pct": 7.1},
    ]


@router.get("/historico")
async def historico():
    return [
        {"situacao_dado": "referencia_municipal", "mes": "Out/25", "internacoes": 98, "transferencias": 18, "taxa_ocup": 71.2},
        {"situacao_dado": "referencia_municipal", "mes": "Nov/25", "internacoes": 104, "transferencias": 20, "taxa_ocup": 73.8},
        {"situacao_dado": "referencia_municipal", "mes": "Dez/25", "internacoes": 95, "transferencias": 17, "taxa_ocup": 69.4},
        {"situacao_dado": "referencia_municipal", "mes": "Jan/26", "internacoes": 108, "transferencias": 21, "taxa_ocup": 74.6},
        {"situacao_dado": "referencia_municipal", "mes": "Fev/26", "internacoes": 106, "transferencias": 20, "taxa_ocup": 75.1},
        {"situacao_dado": "referencia_municipal", "mes": "Mar/26", "internacoes": 112, "transferencias": 22, "taxa_ocup": 76.3},
    ]


@router.get("/indicadores")
async def indicadores():
    return [
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Taxa de ocupação",
            "valor": 76.3,
            "unidade": "%",
            "meta": 85,
            "status": "ok",
            "observacao": "Dentro da meta, mas leitos de isolamento a 100% comprometem a capacidade de resposta a surtos.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Leitos UTI disponíveis",
            "valor": 0,
            "unidade": "leitos",
            "meta": 2,
            "status": "critico",
            "observacao": "Zero UTI no município. Pacientes graves percorrem 200 km (Humaitá) ou 600 km (Manaus).",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Média de permanência",
            "valor": 5.8,
            "unidade": "dias",
            "meta": 4.5,
            "status": "atencao",
            "observacao": "Internações por saúde mental (8,8 dias) e infecciosas (7,2 dias) elevam a média.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Taxa de transferência",
            "valor": 19.6,
            "unidade": "%",
            "meta": 10,
            "status": "critico",
            "observacao": "22 pacientes/mês transferidos — ausência de UTI e especialistas locais é a principal causa.",
        },
        {
            "situacao_dado": "referencia_municipal",
            "indicador": "Taxa de mortalidade hospitalar",
            "valor": 3.6,
            "unidade": "%",
            "meta": 3.0,
            "status": "atencao",
            "observacao": "4 óbitos em 112 internações. Casos graves transferidos reduzem a taxa local.",
        },
    ]
