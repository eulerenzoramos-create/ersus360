"""
Router: /api/gestao — Produção APS / Painel de Gestão
Atendimentos, procedimentos, vacinas, visitas, status SISAB — Apuí/AM
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, Query
from routers.auth import get_current_user, UserOut

router = APIRouter(prefix="/api/gestao", tags=["Produção APS"])

_ANO = 2026

# ── Atendimentos mensais ──────────────────────────────────────────────────────

_ATENDIMENTOS_MENSAIS = [
    {"mes": "Jan/26", "medico": 820, "enfermeiro": 540, "odontologico": 210, "outros": 95,  "total": 1665},
    {"mes": "Fev/26", "medico": 790, "enfermeiro": 510, "odontologico": 195, "outros": 88,  "total": 1583},
    {"mes": "Mar/26", "medico": 870, "enfermeiro": 580, "odontologico": 230, "outros": 102, "total": 1782},
    {"mes": "Abr/26", "medico": 840, "enfermeiro": 560, "odontologico": 218, "outros": 98,  "total": 1716},
    {"mes": "Mai/26", "medico": 855, "enfermeiro": 572, "odontologico": 224, "outros": 101, "total": 1752},
    {"mes": "Jun/26", "medico": 868, "enfermeiro": 585, "odontologico": 228, "outros": 104, "total": 1785},
    {"mes": "Jul/26", "medico": 412, "enfermeiro": 280, "odontologico": 105, "outros": 48,  "total": 845},  # parcial
]

# ── Procedimentos SIGTAP (top 10) ─────────────────────────────────────────────

_PROCEDIMENTOS_SIGTAP = [
    {"codigo": "0301010145", "descricao": "Consulta médica em atenção básica",          "quantidade": 5455, "unidade": "UBS Central"},
    {"codigo": "0301010250", "descricao": "Consulta de enfermagem em atenção básica",   "quantidade": 3627, "unidade": "UBS Central"},
    {"codigo": "0301010269", "descricao": "Atendimento individual em odontologia",      "quantidade": 1410, "unidade": "UBS Central"},
    {"codigo": "0214010058", "descricao": "Hemograma completo",                          "quantidade": 1240, "unidade": "Lab. Municipal"},
    {"codigo": "0214010147", "descricao": "Dosagem de glicemia em jejum",               "quantidade": 1180, "unidade": "Lab. Municipal"},
    {"codigo": "0201010739", "descricao": "Coleta para exame citopatológico",            "quantidade": 512,  "unidade": "UBS Central"},
    {"codigo": "0301070024", "descricao": "Visita domiciliar por profissional nível sup","quantidade": 428, "unidade": "ESF Rural"},
    {"codigo": "0101010010", "descricao": "Cadastramento/atualização - indivíduo",       "quantidade": 390, "unidade": "UBS II"},
    {"codigo": "0202010473", "descricao": "Ultrassonografia obstétrica",                 "quantidade": 186, "unidade": "UBS Central"},
    {"codigo": "0301100039", "descricao": "Visita domiciliar - ACS",                    "quantidade": 2980, "unidade": "ESF/ACS"},
]

# ── Vacinas aplicadas (competência 2026) ──────────────────────────────────────

_VACINAS = [
    {"vacina": "BCG",                "doses_aplicadas": 38,  "meta_ano": 45,  "pct": 84.4, "status": "verde"},
    {"vacina": "Hepatite B (RN)",    "doses_aplicadas": 37,  "meta_ano": 45,  "pct": 82.2, "status": "verde"},
    {"vacina": "Pentavalente (DTP)", "doses_aplicadas": 142, "meta_ano": 135, "pct": 105.2,"status": "verde"},
    {"vacina": "VIP (Poliomielite)", "doses_aplicadas": 139, "meta_ano": 135, "pct": 103.0,"status": "verde"},
    {"vacina": "Rotavírus Humano",   "doses_aplicadas": 130, "meta_ano": 135, "pct": 96.3, "status": "verde"},
    {"vacina": "Pneumocócica 10V",   "doses_aplicadas": 128, "meta_ano": 135, "pct": 94.8, "status": "amarelo"},
    {"vacina": "Meningocócica C",    "doses_aplicadas": 120, "meta_ano": 135, "pct": 88.9, "status": "amarelo"},
    {"vacina": "Febre Amarela",      "doses_aplicadas": 980, "meta_ano": 1000,"pct": 98.0, "status": "verde"},
    {"vacina": "Influenza",          "doses_aplicadas": 3820,"meta_ano": 4200,"pct": 91.0, "status": "verde"},
    {"vacina": "HPV (meninas 9–14)", "doses_aplicadas": 88,  "meta_ano": 110, "pct": 80.0, "status": "amarelo"},
    {"vacina": "Tríplice Viral",     "doses_aplicadas": 142, "meta_ano": 160, "pct": 88.8, "status": "amarelo"},
    {"vacina": "COVID-19 (reforço)", "doses_aplicadas": 1240,"meta_ano": 2000,"pct": 62.0, "status": "vermelho"},
]

# ── Visitas domiciliares ACS ───────────────────────────────────────────────────

_VISITAS_MENSAIS = [
    {"mes": "Jan/26", "programadas": 4820, "realizadas": 4612, "pct": 95.7},
    {"mes": "Fev/26", "programadas": 4820, "realizadas": 4490, "pct": 93.1},
    {"mes": "Mar/26", "programadas": 4820, "realizadas": 4701, "pct": 97.5},
    {"mes": "Abr/26", "programadas": 4820, "realizadas": 4580, "pct": 95.0},
    {"mes": "Mai/26", "programadas": 4820, "realizadas": 4650, "pct": 96.5},
    {"mes": "Jun/26", "programadas": 4820, "realizadas": 4620, "pct": 95.8},
    {"mes": "Jul/26", "programadas": 2410, "realizadas": 2180, "pct": 90.5},  # parcial
]

# ── Status SISAB ──────────────────────────────────────────────────────────────

_SISAB = {
    "status_envio": "em_dia",
    "ultima_competencia_enviada": "2026-06",
    "proxima_competencia": "2026-07",
    "prazo_envio": "2026-08-15",
    "dias_para_prazo": 42,
    "fichas_pendentes": 0,
    "inconsistencias": 14,
    "cns_sem_cpf": 8,
    "producao_sem_equipe": 6,
    "equipes_ativas": 3,
    "equipes_com_producao_mes": 3,
    "pct_fichas_validadas": 97.2,
    "historico_envio": [
        {"competencia": "2025-12", "status": "enviado", "fichas": 1820},
        {"competencia": "2026-01", "status": "enviado", "fichas": 1890},
        {"competencia": "2026-02", "status": "enviado", "fichas": 1750},
        {"competencia": "2026-03", "status": "enviado", "fichas": 1930},
        {"competencia": "2026-04", "status": "enviado", "fichas": 1860},
        {"competencia": "2026-05", "status": "enviado", "fichas": 1910},
        {"competencia": "2026-06", "status": "enviado", "fichas": 1940},
        {"competencia": "2026-07", "status": "pendente", "fichas": None},
    ],
}

# ── Equipes ESF ───────────────────────────────────────────────────────────────

_EQUIPES_ESF = [
    {
        "cnes": "2801234", "nome": "ESF 001 — Centro", "unidade": "UBS Central",
        "area": "Área 1 + 2 + 3",
        "composicao": {
            "medico": {"nome": "Dr. Paulo Henrique Costa", "cns": "123456789012345", "carga_horaria": 40, "ativo": True},
            "enfermeiro": {"nome": "Enf. Ana Clara Souza", "cns": "234567890123456", "carga_horaria": 40, "ativo": True},
            "tecnico_enfermagem": {"nome": "Ana Beatriz Santos", "cns": "345678901234567", "carga_horaria": 40, "ativo": True},
            "acs_count": 5,
        },
        "completa": True,
        "populacao_cadastrada": 3420,
        "familias": 1140,
        "pct_cobertura": 98.2,
        "producao_mes": 685,
    },
    {
        "cnes": "2801235", "nome": "ESF 002 — Zona Rural", "unidade": "UBS Zona Rural",
        "area": "Área 4 + 5 + 6 + 7",
        "composicao": {
            "medico": {"nome": "Dr. Marcos Figueiredo", "cns": "456789012345678", "carga_horaria": 40, "ativo": True},
            "enfermeiro": {"nome": "Enf. Rita de Cássia Lima", "cns": "567890123456789", "carga_horaria": 40, "ativo": True},
            "tecnico_enfermagem": None,
            "acs_count": 4,
        },
        "completa": False,
        "incompleta_motivo": "Técnico de Enfermagem sem registro ativo no CNES",
        "populacao_cadastrada": 2680,
        "familias": 893,
        "pct_cobertura": 76.9,
        "producao_mes": 510,
    },
    {
        "cnes": "2801236", "nome": "ESF 003 — Castanho", "unidade": "UBS Castanho",
        "area": "Área 8 (PA do Castanho)",
        "composicao": {
            "medico": None,
            "enfermeiro": {"nome": "Enf. Pedro Rocha", "cns": "678901234567890", "carga_horaria": 40, "ativo": True},
            "tecnico_enfermagem": {"nome": "Juliana Nascimento", "cns": "789012345678901", "carga_horaria": 40, "ativo": True},
            "acs_count": 3,
        },
        "completa": False,
        "incompleta_motivo": "Equipe sem médico — afastamento por licença. Substituto em processo seletivo.",
        "populacao_cadastrada": 1420,
        "familias": 473,
        "pct_cobertura": 63.4,
        "producao_mes": 290,
    },
]

# ── Atividades coletivas ───────────────────────────────────────────────────────

_ATIVIDADES_COLETIVAS = [
    {"tipo": "Grupo de HAS/DM",       "participantes": 42, "responsavel": "Enf. Ana Clara",   "local": "UBS Central",    "realizadas_ano": 14},
    {"tipo": "Grupo de Gestantes",     "participantes": 18, "responsavel": "Enf. Rita Cássia", "local": "UBS Rural",      "realizadas_ano": 11},
    {"tipo": "Saúde do Escolar (PSE)", "participantes": 210,"responsavel": "CD. Juliana",      "local": "E. E. Apuí",     "realizadas_ano": 8},
    {"tipo": "Grupo de Tabagismo",     "participantes": 12, "responsavel": "Psic. Fernanda",   "local": "CAPS",           "realizadas_ano": 10},
    {"tipo": "Saúde do Idoso",         "participantes": 35, "responsavel": "Fisio. Roberto",   "local": "UBS Central",    "realizadas_ano": 12},
    {"tipo": "Puericultura coletiva",  "participantes": 28, "responsavel": "Enf. Ana Clara",   "local": "UBS Central",    "realizadas_ano": 9},
]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/painel")
async def painel_gestao(_: UserOut = Depends(get_current_user)):
    """Painel consolidado de produção APS."""
    total_atend = sum(m["total"] for m in _ATENDIMENTOS_MENSAIS[:6])
    total_visitas = sum(m["realizadas"] for m in _VISITAS_MENSAIS[:6])
    media_mensal = round(total_atend / 6, 0)
    equipes_completas = sum(1 for e in _EQUIPES_ESF if e["completa"])

    return {
        "municipio": "Apuí",
        "uf": "AM",
        "periodo": "Jan–Jul/2026",
        "total_atendimentos_ano": total_atend,
        "media_mensal_atendimentos": int(media_mensal),
        "total_visitas_domiciliares_ano": total_visitas,
        "equipes_esf_total": len(_EQUIPES_ESF),
        "equipes_completas": equipes_completas,
        "sisab_status": _SISAB["status_envio"],
        "sisab_inconsistencias": _SISAB["inconsistencias"],
        "populacao_coberta_esf": sum(e["populacao_cadastrada"] for e in _EQUIPES_ESF),
        "pct_cobertura_media": round(sum(e["pct_cobertura"] for e in _EQUIPES_ESF) / len(_EQUIPES_ESF), 1),
        "fonte": "referencia",
    }


@router.get("/atendimentos")
async def atendimentos(_: UserOut = Depends(get_current_user)):
    total = sum(m["total"] for m in _ATENDIMENTOS_MENSAIS)
    return {
        "serie_mensal": _ATENDIMENTOS_MENSAIS,
        "total_periodo": total,
        "media_mensal": round(total / len(_ATENDIMENTOS_MENSAIS), 1),
        "fonte": "referencia",
    }


@router.get("/procedimentos")
async def procedimentos(
    top: int = Query(10, ge=5, le=50),
    _: UserOut = Depends(get_current_user),
):
    ordenados = sorted(_PROCEDIMENTOS_SIGTAP, key=lambda x: x["quantidade"], reverse=True)
    return {"procedimentos": ordenados[:top], "total_tipos": len(ordenados), "fonte": "referencia"}


@router.get("/vacinas")
async def vacinas(_: UserOut = Depends(get_current_user)):
    criticas  = [v for v in _VACINAS if v["status"] == "vermelho"]
    atencao   = [v for v in _VACINAS if v["status"] == "amarelo"]
    em_dia    = [v for v in _VACINAS if v["status"] == "verde"]
    return {
        "vacinas": _VACINAS,
        "criticas": len(criticas),
        "atencao":  len(atencao),
        "em_dia":   len(em_dia),
        "pct_cobertura_media": round(sum(v["pct"] for v in _VACINAS) / len(_VACINAS), 1),
        "fonte": "referencia",
    }


@router.get("/visitas")
async def visitas(_: UserOut = Depends(get_current_user)):
    total_prog = sum(m["programadas"] for m in _VISITAS_MENSAIS)
    total_real = sum(m["realizadas"] for m in _VISITAS_MENSAIS)
    return {
        "serie_mensal": _VISITAS_MENSAIS,
        "total_programadas": total_prog,
        "total_realizadas": total_real,
        "pct_cumprimento": round(total_real / total_prog * 100, 1),
        "fonte": "referencia",
    }


@router.get("/sisab")
async def sisab_status(_: UserOut = Depends(get_current_user)):
    return {**_SISAB, "municipio": "Apuí/AM", "fonte": "referencia"}


@router.get("/equipes-esf")
async def equipes_esf(_: UserOut = Depends(get_current_user)):
    return {
        "equipes": _EQUIPES_ESF,
        "total": len(_EQUIPES_ESF),
        "completas": sum(1 for e in _EQUIPES_ESF if e["completa"]),
        "incompletas": sum(1 for e in _EQUIPES_ESF if not e["completa"]),
        "populacao_total": sum(e["populacao_cadastrada"] for e in _EQUIPES_ESF),
        "fonte": "referencia",
    }


@router.get("/atividades-coletivas")
async def atividades_coletivas(_: UserOut = Depends(get_current_user)):
    return {
        "atividades": _ATIVIDADES_COLETIVAS,
        "total_tipos": len(_ATIVIDADES_COLETIVAS),
        "total_participantes": sum(a["participantes"] for a in _ATIVIDADES_COLETIVAS),
        "fonte": "referencia",
    }
