"""
Router: Auditoria APS — Central de Auditoria, Trilha e Plano de Acao
API indisponivel / dados nao coletados → nao_disponivel. Nunca dados ficticios.
"""
from __future__ import annotations
from fastapi import APIRouter, Query
from datetime import datetime

router = APIRouter(prefix="/api/auditoria", tags=["Auditoria APS"])

# ── Auto-avaliacao das integracoes do ERSUS 360 ───────────────────────────────
# Checklist real do estado de implementacao de cada sistema — nao sao dados de saude.
# ok=True = funcionalidade implementada; ok=False = gap identificado.

SISTEMAS_BASE = [
    {
        "id": "cnes",  "sigla": "SCNES/CNES",  "nome": "Cadastro Nacional de Estabelecimentos",
        "cor": "#1351b4",
        "detalhes": [
            {"label": "Cadastro de Estabelecimentos",        "ok": True},
            {"label": "Cadastro de Equipes ESF",             "ok": True},
            {"label": "Cadastro de Profissionais",           "ok": True},
            {"label": "Vinculos profissional/equipe",        "ok": True},
            {"label": "Carga Horaria",                       "ok": True},
            {"label": "CBO — Classificacao Ocupacional",     "ok": True},
            {"label": "Equipes Homologadas",                 "ok": True},
            {"label": "INE — Identificador Nacional Equipe", "ok": True},
            {"label": "CNES Expirado — Alertas",             "ok": False, "nota": "Sem alerta automatico configurado"},
            {"label": "Historico de Alteracoes SCNES",       "ok": False, "nota": "Versionamento ausente"},
            {"label": "Sincronizacao Automatica SCNES API",  "ok": False, "nota": "Sem integracao com API SCNES"},
            {"label": "Score de Conformidade por Equipe",    "ok": False, "nota": "Indicador nao implementado"},
            {"label": "Plano de Correcao Cadastral",         "ok": False, "nota": "Workflow pos-auditoria ausente"},
            {"label": "Relatorio Divergencia SCNES x PEC",   "ok": False, "nota": "Comparativo nao implementado"},
        ],
    },
    {
        "id": "esus",  "sigla": "eSUS PEC",  "nome": "Prontuario Eletronico do Cidadao",
        "cor": "#059669",
        "detalhes": [
            {"label": "Cadastro Individual",              "ok": True},
            {"label": "Cadastro Domiciliar",              "ok": True},
            {"label": "Familias / Nucleos Familiares",    "ok": True},
            {"label": "Agenda",                           "ok": True},
            {"label": "Visitas Domiciliares",             "ok": True},
            {"label": "Vacinacao",                        "ok": True},
            {"label": "Busca Ativa",                      "ok": True},
            {"label": "Atividades Coletivas",             "ok": True},
            {"label": "Producao enviada ao SIAPS",        "ok": True},
            {"label": "Atendimento Individual PEC",       "ok": True},
            {"label": "Atendimento Odontologico PEC",     "ok": True},
            {"label": "Procedimentos PEC",                "ok": True},
            {"label": "Prescricao / Receituario PEC",     "ok": False, "nota": "Sem endpoint de prescricoes"},
            {"label": "Encaminhamentos PEC → SISREG",     "ok": False, "nota": "Fluxo de referencia nao auditado"},
            {"label": "Evolucao Clinica / SOAP",          "ok": False, "nota": "Dados clinicos nao integrados"},
            {"label": "Solicitacao de Exames PEC",        "ok": False, "nota": "Sem leitura de solicitacoes"},
        ],
    },
    {
        "id": "siaps", "sigla": "SIAPS", "nome": "Sistema Informacao Atencao Primaria",
        "cor": "#d97706",
        "detalhes": [
            {"label": "Recepcao de Lotes",          "ok": True},
            {"label": "Producao Enviada",            "ok": True},
            {"label": "Producao Processada",         "ok": True},
            {"label": "Producao Rejeitada",          "ok": True},
            {"label": "Competencias",                "ok": True},
            {"label": "Historico de Transmissoes",   "ok": True},
            {"label": "Logs de Envio",               "ok": True},
            {"label": "Monitor de Lotes Real-Time",  "ok": True},
            {"label": "Erros por Item/Ficha",        "ok": False, "nota": "Detalhamento por ficha rejeitada ausente"},
        ],
    },
    {
        "id": "egestor", "sigla": "e-Gestor", "nome": "e-Gestor APS — Financiamento e Qualidade",
        "cor": "#1351b4",
        "detalhes": [
            {"label": "Indicadores Previne Brasil",        "ok": True},
            {"label": "Componente Qualidade",              "ok": True},
            {"label": "Vinculo e Acompanhamento",          "ok": True},
            {"label": "Score ERSUS 360",                   "ok": True},
            {"label": "Ranking Municipal",                 "ok": True},
            {"label": "Historico de Indicadores",          "ok": True},
            {"label": "Comparativo entre Equipes",         "ok": True},
            {"label": "Comparativo entre Municipios",      "ok": True},
            {"label": "Evolucao Quadrimestral",            "ok": True},
            {"label": "Simulador Financeiro por Cenario",  "ok": False, "nota": "Recomendado — nao implementado"},
        ],
    },
    {
        "id": "rnds", "sigla": "RNDS", "nome": "Rede Nacional de Dados em Saude (FHIR R4)",
        "cor": "#dc2626",
        "detalhes": [
            {"label": "Identificacao do Cidadao (CNS/CPF)",       "ok": True},
            {"label": "Vacinacao — Imunobiologico Administrado",   "ok": True},
            {"label": "Prescricao Eletronica (MedicationRequest)", "ok": False, "nota": "FHIR endpoint ausente"},
            {"label": "Receita Digital (RES)",                     "ok": False, "nota": "Nao implementado"},
            {"label": "Resultado de Exames (DiagnosticReport)",    "ok": False, "nota": "FHIR endpoint ausente"},
            {"label": "Historico Clinico Sumario (IPS-BR)",        "ok": False, "nota": "Sem integracao RNDS"},
            {"label": "Documentos Clinicos (Composition)",         "ok": False, "nota": "Sem integracao RNDS"},
            {"label": "Compartilhamento de Dados Clinicos",        "ok": False, "nota": "Gateway mTLS ausente"},
            {"label": "Interoperabilidade FHIR R4",                "ok": False, "nota": "Nenhum endpoint FHIR implementado"},
        ],
    },
    {
        "id": "cadsus", "sigla": "CADSUS", "nome": "Cadastro Nacional de Usuarios do SUS",
        "cor": "#7c3aed",
        "detalhes": [
            {"label": "CNS — Cartao Nacional de Saude",       "ok": True},
            {"label": "CPF — Validacao de Formato",           "ok": True},
            {"label": "Dados Cadastrais Basicos",             "ok": True},
            {"label": "Sincronizacao Cadastral",              "ok": True},
            {"label": "Validacao CNS via WS CADSUS",          "ok": False, "nota": "Sem consulta ao Web Service"},
            {"label": "Deteccao de Duplicidade CNS/CPF",      "ok": False, "nota": "Sem auditoria cruzada CADSUS"},
        ],
    },
]


def _calcular_sistema(s: dict) -> dict:
    """Calcula score e status a partir do checklist de funcionalidades."""
    total = len(s["detalhes"])
    ok    = sum(1 for d in s["detalhes"] if d["ok"])
    score = round(ok / total * 100) if total else 0
    status = "ok" if score >= 90 else "critico" if score < 40 else "warn"
    return {**s, "score": score, "status": status,
            "funcionalidades_total": total, "funcionalidades_ok": ok}


def _sistemas_calculados() -> list[dict]:
    return [_calcular_sistema(s) for s in SISTEMAS_BASE]


def _score_geral() -> int:
    sistemas = _sistemas_calculados()
    scores = [s["score"] for s in sistemas]
    return round(sum(scores) / len(scores)) if scores else 0


# ── Regras de auditoria (definicoes — sem contadores ficticios) ───────────────

REGRAS_BASE = [
    {"id":1,"nome":"Validade INE por Equipe","sistema":"SCNES/CNES","descricao":"Verifica se todos os INEs das equipes ESF estao vigentes e sem pendencias no SCNES.","ativa":True,"frequencia":"Diaria — 06:00"},
    {"id":2,"nome":"Completude Fichas Cadastro Individual","sistema":"eSUS PEC","descricao":"Calcula % de campos obrigatorios preenchidos nas fichas de cadastro individual do PEC.","ativa":True,"frequencia":"Semanal — Segunda"},
    {"id":3,"nome":"Taxa de Rejeicao SIAPS","sistema":"SIAPS","descricao":"Monitora % de fichas rejeitadas por competencia. Alerta quando supera 5%.","ativa":True,"frequencia":"Por lote enviado"},
    {"id":4,"nome":"Conformidade RNDS — Certificado mTLS","sistema":"RNDS","descricao":"Verifica se o certificado digital RNDS esta valido e a integracao respondendo.","ativa":True,"frequencia":"Diaria — 08:00"},
    {"id":5,"nome":"CNS Valido por Microarea","sistema":"CADSUS","descricao":"Verifica % de cidadaos com CNS preenchido e valido por microarea.","ativa":True,"frequencia":"Mensal — 1o dia"},
    {"id":6,"nome":"Score e-Gestor x Previne Brasil","sistema":"e-Gestor","descricao":"Compara indicadores do e-Gestor com metas estabelecidas e projeta tendencia para o quadrimestre.","ativa":True,"frequencia":"Mensal — apos competencia"},
    {"id":7,"nome":"Auditoria Completa Mensal","sistema":"Todos","descricao":"Executa varredura completa em todos os sistemas. Gera relatorio consolidado de conformidade.","ativa":True,"frequencia":"Mensal — 5o dia util"},
    {"id":8,"nome":"Divergencia SCNES x PEC","sistema":"SCNES/CNES","descricao":"Cruza profissionais ativos no SCNES com os cadastrados no eSUS PEC. Alerta divergencias.","ativa":False,"frequencia":"Semanal — Quarta"},
]

# ── Plano de acao (em memoria — sem contagens ficticias de saude) ─────────────
# Tarefas descrevem gaps tecnicos do sistema ERSUS 360, nao dados de pacientes.

_tarefas: list[dict] = [
    {"id":1,"titulo":"Renovar certificado mTLS RNDS","descricao":"Solicitar novo certificado ICP-Brasil ao DATASUS para autenticacao na RNDS.","sistema":"RNDS","categoria":"Certificado Digital","responsavel":"TI Municipal","prazo":"2026-08-01","prioridade":"critica","status":"em_andamento","criado_em":"01/07/2026","atualizado_em":"10/07/2026","evidencia":None,"comentarios":0,"origem_alerta":"RNDS — gateway mTLS ausente"},
    {"id":2,"titulo":"Implementar gateway RNDS no backend","descricao":"Criar services/rnds_gateway.py com autenticacao mTLS e endpoints FHIR R4 para Immunization e MedicationRequest.","sistema":"RNDS","categoria":"Desenvolvimento","responsavel":"TI Municipal","prazo":"2026-09-30","prioridade":"critica","status":"aberto","criado_em":"23/07/2026","atualizado_em":"23/07/2026","evidencia":None,"comentarios":0,"origem_alerta":"Nenhum endpoint FHIR R4 implementado"},
    {"id":3,"titulo":"Ativar sincronizacao automatica SCNES","descricao":"Configurar cron diario no Railway para sincronizar profissionais e equipes via API SCNES.","sistema":"SCNES/CNES","categoria":"Integracao","responsavel":"TI Municipal","prazo":"2026-08-30","prioridade":"alta","status":"aberto","criado_em":"15/07/2026","atualizado_em":"22/07/2026","evidencia":None,"comentarios":0,"origem_alerta":None},
]
_prox_id = 4


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard_auditoria():
    sistemas = _sistemas_calculados()
    return {
        "score_geral":        _score_geral(),
        "situacao_dado":      "oficial_validado",
        "sistemas":           sistemas,
        "alertas_ativos":     {"situacao_dado": "nao_disponivel", "dados": [], "nota": "Alertas operacionais requerem integracao com banco de inconsistencias."},
        "regras":             REGRAS_BASE,
        "tarefas_abertas":    sum(1 for t in _tarefas if t["status"] in ("aberto","em_andamento")),
        "nota":               "Score calculado a partir do checklist de funcionalidades implementadas no ERSUS 360.",
    }


@router.post("/executar-completa")
async def executar_auditoria_completa():
    sistemas = _sistemas_calculados()
    return {
        "status":              "executado",
        "timestamp":           datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "score_geral":         _score_geral(),
        "sistemas_verificados": len(sistemas),
        "mensagem":            "Varredura de funcionalidades concluida.",
    }


@router.post("/regras/{regra_id}/executar")
async def executar_regra(regra_id: int):
    regra = next((r for r in REGRAS_BASE if r["id"] == regra_id), None)
    if not regra:
        return {"erro": "Regra nao encontrada"}
    return {
        "regra_id":    regra_id,
        "nome":        regra["nome"],
        "resultado":   "nao_disponivel",
        "executado_em": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "mensagem":    f"Regra '{regra['nome']}' registrada. Execucao automatica requer integracao com API do sistema alvo.",
    }


@router.get("/plano-acao")
async def listar_plano_acao():
    return _tarefas


@router.post("/plano-acao")
async def criar_tarefa(body: dict):
    global _prox_id
    nova = {
        "id":           _prox_id,
        "titulo":       body.get("titulo", ""),
        "descricao":    body.get("descricao", ""),
        "sistema":      body.get("sistema", "Geral"),
        "categoria":    body.get("categoria", ""),
        "responsavel":  body.get("responsavel", ""),
        "prazo":        body.get("prazo", ""),
        "prioridade":   body.get("prioridade", "media"),
        "status":       "aberto",
        "criado_em":    datetime.now().strftime("%d/%m/%Y"),
        "atualizado_em": datetime.now().strftime("%d/%m/%Y"),
        "evidencia":    None,
        "comentarios":  0,
        "origem_alerta": body.get("origem_alerta"),
    }
    _tarefas.append(nova)
    _prox_id += 1
    return nova


@router.put("/plano-acao/{tarefa_id}")
async def atualizar_tarefa(tarefa_id: int, body: dict):
    tarefa = next((t for t in _tarefas if t["id"] == tarefa_id), None)
    if not tarefa:
        return {"erro": "Tarefa nao encontrada"}
    tarefa.update({k: v for k, v in body.items() if k in tarefa})
    tarefa["atualizado_em"] = datetime.now().strftime("%d/%m/%Y")
    return tarefa


@router.get("/trilha")
async def trilha_auditoria(
    pagina: int = Query(0),
    acao: str | None = Query(None),
    sistema: str | None = Query(None),
    severidade: str | None = Query(None),
):
    """Trilha de auditoria — requer integracao com sistema de logs (ex: auditoria_auto.py)."""
    return {
        "situacao_dado": "nao_disponivel",
        "eventos":       [],
        "total":         0,
        "paginas":       0,
        "pagina_atual":  pagina,
        "nota":          "Trilha de auditoria requer integracao com banco de logs operacionais. Nenhum evento simulado.",
    }
