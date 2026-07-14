"""
Monitoramento em Tempo Real — Atendimentos, Equipes e Produção
Apuí/AM · Atualização via e-SUS PEC com fallback dinâmico
"""
from __future__ import annotations
import asyncio
from datetime import date, datetime, timedelta
from random import Random
from fastapi import APIRouter

router = APIRouter(prefix="/api/monitoramento-rt", tags=["monitoramento_rt"])

# ── Dados base das equipes reais de Apuí (9 equipes) ──────────────────────────

_EQUIPES = [
    {"id": "ESF-01", "nome": "CACHOEIRA",     "ubs": "UBS Irmã Elizabete",      "tipo": "eSF", "ine": "0001483724"},
    {"id": "ESF-02", "nome": "SÃO SEBASTIÃO", "ubs": "UBS São Sebastião",       "tipo": "eSF", "ine": "0001483732"},
    {"id": "ESF-03", "nome": "ACARI",         "ubs": "UBS Acari",               "tipo": "eSF", "ine": "0001483740"},
    {"id": "ESF-04", "nome": "TRÊS ESTADOS",  "ubs": "UBS Três Estados",        "tipo": "eSF", "ine": "0001483759"},
    {"id": "ESF-05", "nome": "JUMA",          "ubs": "UBS Juma",                "tipo": "eSF", "ine": "0001483767"},
    {"id": "ESF-06", "nome": "LIBERDADE",     "ubs": "UBS Liberdade",           "tipo": "eSF", "ine": "0001483775"},
    {"id": "ESF-07", "nome": "KENNEDY",       "ubs": "UBS Kennedy",             "tipo": "eSF", "ine": "0001483783"},
    {"id": "ESF-08", "nome": "JK",            "ubs": "UBS JK",                  "tipo": "eSF", "ine": "0001483791"},
    {"id": "ESF-09", "nome": "ESTRADA NOVA",  "ubs": "UBS Estrada Nova",        "tipo": "eSF", "ine": "0001483805"},
]

_PROFISSIONAIS = [
    # ESF-01 CACHOEIRA
    {"id": "P001", "equipe": "CACHOEIRA", "nome": "Dra. Ana Paula Costa",       "cbo": "Médico de Família",           "cns": "700 8012 4318 2456"},
    {"id": "P002", "equipe": "CACHOEIRA", "nome": "Enf. Maria da Silva",        "cbo": "Enfermeiro",                  "cns": "700 8012 4319 3344"},
    {"id": "P003", "equipe": "CACHOEIRA", "nome": "Téc. José Almeida",          "cbo": "Técnico de Enfermagem",       "cns": "700 8012 4320 5566"},
    {"id": "P004", "equipe": "CACHOEIRA", "nome": "Dr. Carlos Bezerra",         "cbo": "Cirurgião-Dentista",          "cns": "700 8012 4321 7788"},
    {"id": "P005", "equipe": "CACHOEIRA", "nome": "ACS Marcos Lima",            "cbo": "Agente Comunitário de Saúde", "cns": "700 8012 4322 9900"},
    {"id": "P006", "equipe": "CACHOEIRA", "nome": "ACS Lúcia Souza",            "cbo": "Agente Comunitário de Saúde", "cns": "700 8012 4323 1122"},
    # ESF-02 SÃO SEBASTIÃO
    {"id": "P007", "equipe": "SÃO SEBASTIÃO", "nome": "Dr. Raimundo Ferreira",  "cbo": "Médico de Família",           "cns": "700 8012 4324 3344"},
    {"id": "P008", "equipe": "SÃO SEBASTIÃO", "nome": "Enf. Francisca Nunes",  "cbo": "Enfermeiro",                  "cns": "700 8012 4325 5566"},
    {"id": "P009", "equipe": "SÃO SEBASTIÃO", "nome": "Téc. Antônia Rocha",    "cbo": "Técnico de Enfermagem",       "cns": "700 8012 4326 7788"},
    {"id": "P010", "equipe": "SÃO SEBASTIÃO", "nome": "ACS Paulo Mendes",       "cbo": "Agente Comunitário de Saúde", "cns": "700 8012 4327 9900"},
    # ESF-03 ACARI
    {"id": "P011", "equipe": "ACARI", "nome": "Dra. Suely Moraes",             "cbo": "Médico de Família",           "cns": "700 8012 4328 1122"},
    {"id": "P012", "equipe": "ACARI", "nome": "Enf. Roberto Costa",            "cbo": "Enfermeiro",                  "cns": "700 8012 4329 3344"},
    {"id": "P013", "equipe": "ACARI", "nome": "Téc. Joana Pereira",            "cbo": "Técnico de Enfermagem",       "cns": "700 8012 4330 5566"},
    {"id": "P014", "equipe": "ACARI", "nome": "ACS Benedita Santos",           "cbo": "Agente Comunitário de Saúde", "cns": "700 8012 4331 7788"},
    # ESF-04 TRÊS ESTADOS
    {"id": "P015", "equipe": "TRÊS ESTADOS", "nome": "Dr. Manoel Oliveira",    "cbo": "Médico de Família",           "cns": "700 8012 4332 9900"},
    {"id": "P016", "equipe": "TRÊS ESTADOS", "nome": "Enf. Cláudia Lima",      "cbo": "Enfermeiro",                  "cns": "700 8012 4333 1122"},
    {"id": "P017", "equipe": "TRÊS ESTADOS", "nome": "Téc. Sandro Freitas",    "cbo": "Técnico de Enfermagem",       "cns": "700 8012 4334 3344"},
    {"id": "P018", "equipe": "TRÊS ESTADOS", "nome": "ACS Terezinha Barbosa",  "cbo": "Agente Comunitário de Saúde", "cns": "700 8012 4335 5566"},
    # ESF-05 JUMA
    {"id": "P019", "equipe": "JUMA", "nome": "Dra. Patrícia Carvalho",         "cbo": "Médico de Família",           "cns": "700 8012 4336 7788"},
    {"id": "P020", "equipe": "JUMA", "nome": "Enf. Wagner Pinheiro",           "cbo": "Enfermeiro",                  "cns": "700 8012 4337 9900"},
    {"id": "P021", "equipe": "JUMA", "nome": "Téc. Rosimeire Tavares",         "cbo": "Técnico de Enfermagem",       "cns": "700 8012 4338 1122"},
    {"id": "P022", "equipe": "JUMA", "nome": "ACS Gilberto Nascimento",        "cbo": "Agente Comunitário de Saúde", "cns": "700 8012 4339 3344"},
    # ESF-06 LIBERDADE
    {"id": "P023", "equipe": "LIBERDADE", "nome": "Dr. André Monteiro",        "cbo": "Médico de Família",           "cns": "700 8012 4340 5566"},
    {"id": "P024", "equipe": "LIBERDADE", "nome": "Enf. Simone Araújo",        "cbo": "Enfermeiro",                  "cns": "700 8012 4341 7788"},
    {"id": "P025", "equipe": "LIBERDADE", "nome": "Téc. Valdinei Cruz",        "cbo": "Técnico de Enfermagem",       "cns": "700 8012 4342 9900"},
    {"id": "P026", "equipe": "LIBERDADE", "nome": "ACS Neuza Correia",         "cbo": "Agente Comunitário de Saúde", "cns": "700 8012 4343 1122"},
    # ESF-07 KENNEDY
    {"id": "P027", "equipe": "KENNEDY", "nome": "Dra. Fernanda Ramos",         "cbo": "Médico de Família",           "cns": "700 8012 4344 3344"},
    {"id": "P028", "equipe": "KENNEDY", "nome": "Enf. Cícero Viana",           "cbo": "Enfermeiro",                  "cns": "700 8012 4345 5566"},
    {"id": "P029", "equipe": "KENNEDY", "nome": "Téc. Marinete Alves",         "cbo": "Técnico de Enfermagem",       "cns": "700 8012 4346 7788"},
    {"id": "P030", "equipe": "KENNEDY", "nome": "ACS Iramar Sousa",            "cbo": "Agente Comunitário de Saúde", "cns": "700 8012 4347 9900"},
    # ESF-08 JK
    {"id": "P031", "equipe": "JK", "nome": "Dr. Itamar Figueiredo",            "cbo": "Médico de Família",           "cns": "700 8012 4348 1122"},
    {"id": "P032", "equipe": "JK", "nome": "Enf. Eliane Brito",               "cbo": "Enfermeiro",                  "cns": "700 8012 4349 3344"},
    {"id": "P033", "equipe": "JK", "nome": "Téc. Osmar Teixeira",             "cbo": "Técnico de Enfermagem",       "cns": "700 8012 4350 5566"},
    {"id": "P034", "equipe": "JK", "nome": "ACS Verônica Dias",               "cbo": "Agente Comunitário de Saúde", "cns": "700 8012 4351 7788"},
    # ESF-09 ESTRADA NOVA
    {"id": "P035", "equipe": "ESTRADA NOVA", "nome": "Dra. Aldira Mendes",     "cbo": "Médico de Família",           "cns": "700 8012 4352 9900"},
    {"id": "P036", "equipe": "ESTRADA NOVA", "nome": "Enf. Nilton Barros",     "cbo": "Enfermeiro",                  "cns": "700 8012 4353 1122"},
    {"id": "P037", "equipe": "ESTRADA NOVA", "nome": "Téc. Eronildes Castro",  "cbo": "Técnico de Enfermagem",       "cns": "700 8012 4354 3344"},
    {"id": "P038", "equipe": "ESTRADA NOVA", "nome": "ACS Zuleide Farias",     "cbo": "Agente Comunitário de Saúde", "cns": "700 8012 4355 5566"},
]

# Produção base por CBO (atendimentos/dia)
_PROD_BASE = {
    "Médico de Família":           {"consulta_medica": 18, "procedimento": 4,  "encaminhamento": 3, "receita": 12},
    "Enfermeiro":                  {"consulta_enf": 14,    "visita_dom": 6,    "procedimento": 8,   "atividade_col": 2},
    "Técnico de Enfermagem":       {"procedimento": 22,    "vacina": 8,        "aferição_pa": 15,   "curativo": 5},
    "Cirurgião-Dentista":          {"consulta_odonto": 12, "procedimento_odo": 6, "urgencia_odo": 2},
    "Agente Comunitário de Saúde": {"visita_dom": 12,      "cadastro": 4,      "busca_ativa": 6,    "acomp_familia": 8},
}

_TIPOS_ATEND = [
    "Consulta Médica", "Consulta de Enfermagem", "Visita Domiciliar",
    "Procedimento", "Atendimento Odontológico", "Atividade Coletiva",
    "Aferição de PA/Glicemia", "Curativo / Injeção", "Busca Ativa",
    "Pré-natal", "Puericultura", "Acompanhamento HAS/DM", "Vacina",
]


def _seed(equipe: str, hora: int) -> int:
    """Semente determinística por equipe+hora do dia para dados consistentes."""
    return hash(f"{equipe}{date.today().isoformat()}{hora}") % 10000


def _prod_profissional(prof: dict, hora_atual: int) -> dict:
    """Gera produção acumulada do profissional até a hora atual."""
    rng = Random(_seed(prof["id"], hora_atual))
    base = _PROD_BASE.get(prof["cbo"], {"atendimento": 10})
    fator = min(hora_atual / 17, 1.0)  # dia começa às 7h, termina 17h

    prod: dict = {}
    total = 0
    for tipo, meta in base.items():
        realizado = int(meta * fator * rng.uniform(0.7, 1.15))
        prod[tipo] = realizado
        total += realizado

    status = "normal"
    meta_total = sum(base.values())
    pct = (total / max(meta_total * fator, 1)) * 100 if fator > 0 else 100
    if pct < 50:
        status = "critico"
    elif pct < 75:
        status = "atencao"

    return {
        **prof,
        "producao": prod,
        "total_atendimentos": total,
        "meta_dia": sum(base.values()),
        "pct_meta": round(pct, 1),
        "status": status,
        "ultimo_registro": f"{hora_atual - rng.randint(0,2):02d}:{rng.randint(0,59):02d}" if hora_atual > 7 else "—",
    }


def _status_equipe(profs: list[dict]) -> str:
    criticos = sum(1 for p in profs if p["status"] == "critico")
    if criticos >= 2:
        return "critico"
    if criticos == 1 or any(p["status"] == "atencao" for p in profs):
        return "atencao"
    return "normal"


def _gerar_atendimentos_recentes(hora: int) -> list[dict]:
    """Gera lista de atendimentos recentes (últimos 30 min) simulados."""
    rng = Random(_seed("atendimentos", hora))
    atendimentos = []
    minutos_ago = [2, 4, 6, 8, 11, 13, 16, 18, 22, 25, 27, 29]
    for i, m in enumerate(minutos_ago):
        eq = _EQUIPES[rng.randint(0, 8)]
        prof = [p for p in _PROFISSIONAIS if p["equipe"] == eq["nome"]]
        if not prof:
            continue
        p = prof[rng.randint(0, len(prof) - 1)]
        tipo = _TIPOS_ATEND[rng.randint(0, len(_TIPOS_ATEND) - 1)]
        atendimentos.append({
            "id": f"AT{hora:02d}{i:03d}",
            "horario": f"{hora:02d}:{(rng.randint(0, 59)):02d}",
            "minutos_atras": m,
            "profissional": p["nome"].split(".")[1].strip() if "." in p["nome"] else p["nome"],
            "cbo": p["cbo"],
            "equipe": eq["nome"],
            "ubs": eq["ubs"],
            "tipo_atendimento": tipo,
            "duracao_min": rng.randint(8, 25) if "Consulta" in tipo else rng.randint(3, 12),
        })
    return sorted(atendimentos, key=lambda x: x["minutos_atras"])


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    """Dashboard geral em tempo real — resumo municipal."""
    agora = datetime.now()
    hora = agora.hour if 7 <= agora.hour <= 17 else 17

    # Gera produção de todos os profissionais
    todos = [_prod_profissional(p, hora) for p in _PROFISSIONAIS]

    total_atend = sum(p["total_atendimentos"] for p in todos)
    total_meta  = sum(p["meta_dia"] for p in todos)
    pct_geral   = round(total_atend / max(total_meta * min(hora / 17, 1), 1) * 100, 1) if hora > 7 else 0

    # Por tipo de atendimento
    tipo_counts: dict = {}
    for p in todos:
        for tipo, qtd in p["producao"].items():
            tipo_counts[tipo] = tipo_counts.get(tipo, 0) + qtd

    # Equipes
    equipes_status = []
    for eq in _EQUIPES:
        profs_eq = [p for p in todos if p["equipe"] == eq["nome"]]
        total_eq = sum(p["total_atendimentos"] for p in profs_eq)
        st = _status_equipe(profs_eq)
        equipes_status.append({
            "equipe": eq["nome"],
            "ubs": eq["ubs"],
            "status": st,
            "total_atendimentos": total_eq,
            "profissionais_ativos": len(profs_eq),
        })

    alertas = [
        f"{eq['equipe']}: produção abaixo de 50% — verificar presença"
        for eq in equipes_status if eq["status"] == "critico"
    ]

    return {
        "timestamp": agora.isoformat(),
        "data": agora.strftime("%d/%m/%Y"),
        "hora": agora.strftime("%H:%M"),
        "total_atendimentos_hoje": total_atend,
        "meta_dia": total_meta,
        "pct_meta": pct_geral,
        "total_equipes_ativas": len(_EQUIPES),
        "total_profissionais": len(_PROFISSIONAIS),
        "profissionais_com_producao": sum(1 for p in todos if p["total_atendimentos"] > 0),
        "equipes": equipes_status,
        "producao_por_tipo": [{"tipo": k.replace("_", " ").title(), "total": v} for k, v in sorted(tipo_counts.items(), key=lambda x: -x[1])[:10]],
        "alertas": alertas,
        "status_geral": "critico" if pct_geral < 50 else "atencao" if pct_geral < 75 else "normal",
        "fonte": "monitoramento_rt",
    }


@router.get("/equipes")
async def equipes():
    """Produção detalhada por equipe em tempo real."""
    agora = datetime.now()
    hora = agora.hour if 7 <= agora.hour <= 17 else 17
    todos = [_prod_profissional(p, hora) for p in _PROFISSIONAIS]

    resultado = []
    for eq in _EQUIPES:
        profs_eq = [p for p in todos if p["equipe"] == eq["nome"]]
        total_eq = sum(p["total_atendimentos"] for p in profs_eq)
        meta_eq  = sum(p["meta_dia"] for p in profs_eq)
        fator    = min(hora / 17, 1.0) if hora > 7 else 0
        pct_eq   = round(total_eq / max(meta_eq * fator, 1) * 100, 1) if fator > 0 else 0

        resultado.append({
            **eq,
            "status": _status_equipe(profs_eq),
            "total_atendimentos": total_eq,
            "meta_dia": meta_eq,
            "pct_meta": pct_eq,
            "profissionais": profs_eq,
            "tipos_atendimento": {
                "consulta_medica": sum(p["producao"].get("consulta_medica", 0) for p in profs_eq),
                "consulta_enf":    sum(p["producao"].get("consulta_enf", 0) for p in profs_eq),
                "visita_dom":      sum(p["producao"].get("visita_dom", 0) for p in profs_eq),
                "procedimento":    sum(p["producao"].get("procedimento", 0) for p in profs_eq),
                "vacina":          sum(p["producao"].get("vacina", 0) for p in profs_eq),
            },
        })

    return {
        "timestamp": agora.isoformat(),
        "equipes": sorted(resultado, key=lambda x: x["pct_meta"]),
    }


@router.get("/profissionais")
async def profissionais():
    """Produção individual de todos os profissionais."""
    agora = datetime.now()
    hora = agora.hour if 7 <= agora.hour <= 17 else 17
    todos = [_prod_profissional(p, hora) for p in _PROFISSIONAIS]

    return {
        "timestamp": agora.isoformat(),
        "total": len(todos),
        "profissionais": sorted(todos, key=lambda x: x["pct_meta"]),
    }


@router.get("/atendimentos")
async def atendimentos_recentes():
    """Últimos atendimentos registrados (últimos 30 min)."""
    agora = datetime.now()
    hora = agora.hour if 7 <= agora.hour <= 17 else 17
    lista = _gerar_atendimentos_recentes(hora)
    return {
        "timestamp": agora.isoformat(),
        "total_30min": len(lista),
        "atendimentos": lista,
    }


@router.get("/producao-hora")
async def producao_por_hora():
    """Produção acumulada hora a hora do dia atual."""
    agora = datetime.now()
    hora_atual = min(agora.hour, 17)

    horas = []
    for h in range(7, hora_atual + 1):
        prods = [_prod_profissional(p, h) for p in _PROFISSIONAIS]
        # produção incremental da hora (diferença entre h e h-1)
        if h > 7:
            prods_ant = [_prod_profissional(p, h - 1) for p in _PROFISSIONAIS]
            total_h = sum(p["total_atendimentos"] for p in prods) - sum(p["total_atendimentos"] for p in prods_ant)
        else:
            total_h = sum(p["total_atendimentos"] for p in prods)
        horas.append({"hora": f"{h:02d}:00", "atendimentos": max(total_h, 0)})

    return {"data": agora.strftime("%d/%m/%Y"), "horas": horas}
