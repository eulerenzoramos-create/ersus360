"""
Ouvidoria SUS — FMS Apuí/AM
Lei 13.460/2017 · Decreto 9.492/2018 · e-OUV / Fala.BR
"""
from fastapi import APIRouter
from datetime import date, timedelta

router = APIRouter(prefix="/api/ouvidoria", tags=["Ouvidoria"])

# ── Tipos e status ─────────────────────────────────────────────────────────────

TIPOS = ["Reclamação", "Denúncia", "Sugestão", "Elogio", "Solicitação", "Acesso à Informação"]
AREAS = ["UBS", "APS/ESF", "Farmácia", "Urgência/Emergência", "SAMU", "Vigilância Sanitária", "Outros"]

# ── Dados realísticos para Apuí/AM ────────────────────────────────────────────

_MANIFESTACOES = [
    # id, protocolo, tipo, area, assunto, status, prazo_dias_restantes, prioridade, criado
    {"id": 1,  "protocolo": "AM-00124-2026", "tipo": "Reclamação",           "area": "Farmácia",               "assunto": "Falta de medicamento para hipertensão na UBS Central",                 "status": "em_andamento",   "dias_restantes": 8,  "prioridade": "alta",   "criado": "2026-03-14", "cidadao": "M.A.S.", "resposta": None,                        "canal": "Presencial"},
    {"id": 2,  "protocolo": "AM-00125-2026", "tipo": "Denúncia",             "area": "UBS",                    "assunto": "Servidor ausente no horário de atendimento — UBS Bairro Kennedy",      "status": "em_andamento",   "dias_restantes": 3,  "prioridade": "critica","criado": "2026-03-19", "cidadao": "J.F.O.", "resposta": None,                        "canal": "Fala.BR"},
    {"id": 3,  "protocolo": "AM-00126-2026", "tipo": "Sugestão",             "area": "APS/ESF",                "assunto": "Ampliar horário da ESF Liberdade para atendimento aos sábados",          "status": "concluida",      "dias_restantes": 0,  "prioridade": "normal", "criado": "2026-03-10", "cidadao": "R.C.P.", "resposta": "Sugestão encaminhada à Gerência de APS para análise de viabilidade.", "canal": "Telefone 136"},
    {"id": 4,  "protocolo": "AM-00127-2026", "tipo": "Reclamação",           "area": "SAMU",                   "assunto": "Demora no atendimento do SAMU — chamado sem resposta por 40 min",        "status": "concluida",      "dias_restantes": 0,  "prioridade": "critica","criado": "2026-03-08", "cidadao": "L.T.M.", "resposta": "Apuração realizada. Equipe estava em atendimento simultâneo. Resposta enviada ao cidadão.", "canal": "Fala.BR"},
    {"id": 5,  "protocolo": "AM-00128-2026", "tipo": "Solicitação",          "area": "APS/ESF",                "assunto": "Solicitação de visita domiciliar para idosa acamada — Rua das Acácias",  "status": "concluida",      "dias_restantes": 0,  "prioridade": "alta",   "criado": "2026-03-12", "cidadao": "F.A.S.", "resposta": "Visita agendada para 20/03 pela ACS responsável pela microárea.",     "canal": "Presencial"},
    {"id": 6,  "protocolo": "AM-00129-2026", "tipo": "Elogio",               "area": "APS/ESF",                "assunto": "Elogio à equipe ESF Liberdade pelo acompanhamento pré-natal exemplar",  "status": "concluida",      "dias_restantes": 0,  "prioridade": "normal", "criado": "2026-03-15", "cidadao": "C.F.R.", "resposta": "Elogio registrado e comunicado à equipe. Muito obrigado!",           "canal": "E-mail"},
    {"id": 7,  "protocolo": "AM-00130-2026", "tipo": "Acesso à Informação",  "area": "Outros",                 "assunto": "Solicitação de relatório de gastos com saúde 2025 (LAI)",                "status": "em_andamento",   "dias_restantes": 15, "prioridade": "normal", "criado": "2026-04-01", "cidadao": "A.B.C.", "resposta": None,                        "canal": "Fala.BR"},
    {"id": 8,  "protocolo": "AM-00131-2026", "tipo": "Reclamação",           "area": "Vigilância Sanitária",   "assunto": "Denúncia de estabelecimento alimentar sem condições higiênicas",        "status": "em_andamento",   "dias_restantes": 12, "prioridade": "alta",   "criado": "2026-04-05", "cidadao": "P.Q.R.", "resposta": None,                        "canal": "Presencial"},
    {"id": 9,  "protocolo": "AM-00132-2026", "tipo": "Reclamação",           "area": "UBS",                    "assunto": "Equipamento de fisioterapia quebrado há 3 meses sem manutenção",         "status": "em_andamento",   "dias_restantes": -5, "prioridade": "alta",   "criado": "2026-03-05", "cidadao": "M.S.L.", "resposta": None,                        "canal": "Telefone 136"},
    {"id": 10, "protocolo": "AM-00133-2026", "tipo": "Sugestão",             "area": "APS/ESF",                "assunto": "Implantação de grupo de caminhada para pacientes hipertensos e diabéticos","status": "em_andamento",   "dias_restantes": 20, "prioridade": "normal", "criado": "2026-04-08", "cidadao": "I.N.O.", "resposta": None,                        "canal": "Fala.BR"},
    {"id": 11, "protocolo": "AM-00134-2026", "tipo": "Denúncia",             "area": "Farmácia",               "assunto": "Irregularidade na dispensação: medicamento entregue sem prescrição",    "status": "em_andamento",   "dias_restantes": 7,  "prioridade": "critica","criado": "2026-04-03", "cidadao": "K.L.N.", "resposta": None,                        "canal": "Fala.BR"},
    {"id": 12, "protocolo": "AM-00135-2026", "tipo": "Elogio",               "area": "UBS",                    "assunto": "Elogio ao médico da UBS Três Estados pelo atendimento humanizado",       "status": "concluida",      "dias_restantes": 0,  "prioridade": "normal", "criado": "2026-04-10", "cidadao": "D.E.F.", "resposta": "Elogio registrado e comunicado ao profissional.",                   "canal": "Presencial"},
]

_HISTORICO_MENSAL = [
    {"mes": "Nov/25", "recebidas": 6,  "concluidas": 5,  "pendentes": 1},
    {"mes": "Dez/25", "recebidas": 8,  "concluidas": 7,  "pendentes": 1},
    {"mes": "Jan/26", "recebidas": 9,  "concluidas": 8,  "pendentes": 1},
    {"mes": "Fev/26", "recebidas": 10, "concluidas": 8,  "pendentes": 2},
    {"mes": "Mar/26", "recebidas": 14, "concluidas": 10, "pendentes": 4},
    {"mes": "Abr/26", "recebidas": 12, "concluidas": 4,  "pendentes": 8},
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _semaforo(dias: int) -> str:
    if dias < 0:   return "vencido"
    if dias <= 5:  return "urgente"
    if dias <= 15: return "atencao"
    return "ok"

def _enriquecer(m: dict) -> dict:
    return {**m, "semaforo": _semaforo(m["dias_restantes"])}

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard():
    total     = len(_MANIFESTACOES)
    concl     = sum(1 for m in _MANIFESTACOES if m["status"] == "concluida")
    em_and    = sum(1 for m in _MANIFESTACOES if m["status"] == "em_andamento")
    vencidas  = sum(1 for m in _MANIFESTACOES if m["dias_restantes"] < 0)
    urgentes  = sum(1 for m in _MANIFESTACOES if 0 <= m["dias_restantes"] <= 5)
    criticas  = sum(1 for m in _MANIFESTACOES if m["prioridade"] == "critica")

    por_tipo = {}
    for m in _MANIFESTACOES:
        por_tipo[m["tipo"]] = por_tipo.get(m["tipo"], 0) + 1

    por_area = {}
    for m in _MANIFESTACOES:
        por_area[m["area"]] = por_area.get(m["area"], 0) + 1

    por_canal = {}
    for m in _MANIFESTACOES:
        por_canal[m["canal"]] = por_canal.get(m["canal"], 0) + 1

    return {
        "total":             total,
        "concluidas":        concl,
        "em_andamento":      em_and,
        "prazo_vencido":     vencidas,
        "prazo_urgente":     urgentes,
        "criticas":          criticas,
        "pct_concluidas":    round(concl / total * 100, 1),
        "tempo_medio_dias":  12.4,
        "por_tipo":          [{"tipo": k, "n": v} for k, v in sorted(por_tipo.items(), key=lambda x: -x[1])],
        "por_area":          [{"area": k, "n": v} for k, v in sorted(por_area.items(), key=lambda x: -x[1])],
        "por_canal":         [{"canal": k, "n": v} for k, v in sorted(por_canal.items(), key=lambda x: -x[1])],
        "historico":         _HISTORICO_MENSAL,
        "competencia":       "Abr/2026",
    }


@router.get("/manifestacoes")
async def manifestacoes(status: str = "", tipo: str = "", prioridade: str = ""):
    items = _MANIFESTACOES
    if status:     items = [m for m in items if m["status"] == status]
    if tipo:       items = [m for m in items if m["tipo"] == tipo]
    if prioridade: items = [m for m in items if m["prioridade"] == prioridade]
    return [_enriquecer(m) for m in items]


@router.get("/manifestacoes/{id}")
async def manifestacao_detalhe(id: int):
    m = next((m for m in _MANIFESTACOES if m["id"] == id), None)
    if not m:
        from fastapi import HTTPException
        raise HTTPException(404, "Manifestação não encontrada")
    return _enriquecer(m)


@router.get("/alertas")
async def alertas():
    criticos = [_enriquecer(m) for m in _MANIFESTACOES
                if m["status"] == "em_andamento" and (m["dias_restantes"] < 0 or m["prioridade"] == "critica")]
    urgentes = [_enriquecer(m) for m in _MANIFESTACOES
                if m["status"] == "em_andamento" and 0 <= m["dias_restantes"] <= 5]
    return {"criticos": criticos, "urgentes": urgentes}
