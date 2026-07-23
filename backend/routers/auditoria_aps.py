"""
Router: Auditoria APS — Central de Auditoria, Trilha e Plano de Ação
"""
from __future__ import annotations
from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import random, hashlib, uuid

router = APIRouter(prefix="/api/auditoria", tags=["Auditoria APS"])

# ── Dados de referência ───────────────────────────────────────────────────────

SISTEMAS_BASE = [
    {
        "id": "cnes",  "sigla": "SCNES/CNES",  "nome": "Cadastro Nacional de Estabelecimentos",
        "cor": "#1351b4", "score": 71, "status": "warn",
        "funcionalidades_total": 14, "funcionalidades_ok": 10, "alertas_ativos": 2,
        "ultimo_check": "23/07/2026 14:30", "proxima_verificacao": "24/07/2026 06:00",
        "detalhes": [
            {"label": "Cadastro de Estabelecimentos",        "ok": True},
            {"label": "Cadastro de Equipes ESF",             "ok": True},
            {"label": "Cadastro de Profissionais",           "ok": True},
            {"label": "Vínculos profissional/equipe",        "ok": True},
            {"label": "Carga Horária",                       "ok": True},
            {"label": "CBO — Classificação Ocupacional",     "ok": True},
            {"label": "Equipes Homologadas",                 "ok": True},
            {"label": "INE — Identificador Nacional Equipe", "ok": True},
            {"label": "CNES Expirado — Alertas",             "ok": False, "nota": "Sem alerta automático configurado"},
            {"label": "Histórico de Alterações SCNES",       "ok": False, "nota": "Versionamento ausente"},
            {"label": "Sincronização Automática SCNES API",  "ok": False, "nota": "Sem integração com API SCNES"},
            {"label": "Score de Conformidade por Equipe",    "ok": False, "nota": "Indicador não implementado"},
            {"label": "Plano de Correção Cadastral",         "ok": False, "nota": "Workflow pós-auditoria ausente"},
            {"label": "Relatório Divergência SCNES × PEC",   "ok": False, "nota": "Comparativo não implementado"},
        ],
    },
    {
        "id": "esus",  "sigla": "eSUS PEC",  "nome": "Prontuário Eletrônico do Cidadão",
        "cor": "#059669", "score": 78, "status": "warn",
        "funcionalidades_total": 16, "funcionalidades_ok": 12, "alertas_ativos": 1,
        "ultimo_check": "23/07/2026 14:30", "proxima_verificacao": "24/07/2026 06:00",
        "detalhes": [
            {"label": "Cadastro Individual",              "ok": True},
            {"label": "Cadastro Domiciliar",              "ok": True},
            {"label": "Famílias / Núcleos Familiares",    "ok": True},
            {"label": "Agenda",                           "ok": True},
            {"label": "Visitas Domiciliares",             "ok": True},
            {"label": "Vacinação",                        "ok": True},
            {"label": "Busca Ativa",                      "ok": True},
            {"label": "Atividades Coletivas",             "ok": True},
            {"label": "Produção enviada ao SIAPS",        "ok": True},
            {"label": "Atendimento Individual PEC",       "ok": True},
            {"label": "Atendimento Odontológico PEC",     "ok": True},
            {"label": "Procedimentos PEC",                "ok": True},
            {"label": "Prescrição / Receituário PEC",     "ok": False, "nota": "Sem endpoint de prescrições"},
            {"label": "Encaminhamentos PEC → SISREG",     "ok": False, "nota": "Fluxo de referência não auditado"},
            {"label": "Evolução Clínica / SOAP",          "ok": False, "nota": "Dados clínicos não integrados"},
            {"label": "Solicitação de Exames PEC",        "ok": False, "nota": "Sem leitura de solicitações"},
        ],
    },
    {
        "id": "siaps", "sigla": "SIAPS", "nome": "Sistema Informação Atenção Primária",
        "cor": "#d97706", "score": 89, "status": "ok",
        "funcionalidades_total": 9, "funcionalidades_ok": 8, "alertas_ativos": 0,
        "ultimo_check": "23/07/2026 14:30", "proxima_verificacao": "24/07/2026 06:00",
        "detalhes": [
            {"label": "Recepção de Lotes",          "ok": True},
            {"label": "Produção Enviada",            "ok": True},
            {"label": "Produção Processada",         "ok": True},
            {"label": "Produção Rejeitada",          "ok": True},
            {"label": "Competências",                "ok": True},
            {"label": "Histórico de Transmissões",   "ok": True},
            {"label": "Logs de Envio",               "ok": True},
            {"label": "Monitor de Lotes Real-Time",  "ok": True},
            {"label": "Erros por Item/Ficha",        "ok": False, "nota": "Detalhamento por ficha rejeitada ausente"},
        ],
    },
    {
        "id": "egestor", "sigla": "e-Gestor", "nome": "e-Gestor APS — Financiamento e Qualidade",
        "cor": "#1351b4", "score": 94, "status": "ok",
        "funcionalidades_total": 10, "funcionalidades_ok": 9, "alertas_ativos": 0,
        "ultimo_check": "23/07/2026 14:30", "proxima_verificacao": "24/07/2026 06:00",
        "detalhes": [
            {"label": "Indicadores Previne Brasil",        "ok": True},
            {"label": "Componente Qualidade",              "ok": True},
            {"label": "Vínculo e Acompanhamento",          "ok": True},
            {"label": "Score ERSUS 360",                   "ok": True},
            {"label": "Ranking Municipal",                 "ok": True},
            {"label": "Histórico de Indicadores",          "ok": True},
            {"label": "Comparativo entre Equipes",         "ok": True},
            {"label": "Comparativo entre Municípios",      "ok": True},
            {"label": "Evolução Quadrimestral",            "ok": True},
            {"label": "Simulador Financeiro por Cenário",  "ok": False, "nota": "Recomendado — não implementado"},
        ],
    },
    {
        "id": "rnds", "sigla": "RNDS", "nome": "Rede Nacional de Dados em Saúde (FHIR R4)",
        "cor": "#dc2626", "score": 22, "status": "critico",
        "funcionalidades_total": 9, "funcionalidades_ok": 2, "alertas_ativos": 4,
        "ultimo_check": "23/07/2026 14:30", "proxima_verificacao": "24/07/2026 06:00",
        "detalhes": [
            {"label": "Identificação do Cidadão (CNS/CPF)",       "ok": True},
            {"label": "Vacinação — Imunobiológico Administrado",   "ok": True},
            {"label": "Prescrição Eletrônica (MedicationRequest)", "ok": False, "nota": "FHIR endpoint ausente"},
            {"label": "Receita Digital (RES)",                     "ok": False, "nota": "Não implementado"},
            {"label": "Resultado de Exames (DiagnosticReport)",    "ok": False, "nota": "FHIR endpoint ausente"},
            {"label": "Histórico Clínico Sumário (IPS-BR)",        "ok": False, "nota": "Sem integração RNDS"},
            {"label": "Documentos Clínicos (Composition)",         "ok": False, "nota": "Sem integração RNDS"},
            {"label": "Compartilhamento de Dados Clínicos",        "ok": False, "nota": "Gateway mTLS ausente"},
            {"label": "Interoperabilidade FHIR R4",                "ok": False, "nota": "Nenhum endpoint FHIR implementado"},
        ],
    },
    {
        "id": "cadsus", "sigla": "CADSUS", "nome": "Cadastro Nacional de Usuários do SUS",
        "cor": "#7c3aed", "score": 65, "status": "warn",
        "funcionalidades_total": 6, "funcionalidades_ok": 4, "alertas_ativos": 1,
        "ultimo_check": "23/07/2026 14:30", "proxima_verificacao": "24/07/2026 06:00",
        "detalhes": [
            {"label": "CNS — Cartão Nacional de Saúde",       "ok": True},
            {"label": "CPF — Validação de Formato",           "ok": True},
            {"label": "Dados Cadastrais Básicos",             "ok": True},
            {"label": "Sincronização Cadastral",              "ok": True},
            {"label": "Validação CNS via WS CADSUS",          "ok": False, "nota": "Sem consulta ao Web Service"},
            {"label": "Detecção de Duplicidade CNS/CPF",      "ok": False, "nota": "Sem auditoria cruzada CADSUS"},
        ],
    },
]

def _score_geral() -> int:
    scores = [s["score"] for s in SISTEMAS_BASE]
    return round(sum(scores) / len(scores))

def _gerar_hash(conteudo: str) -> str:
    return hashlib.sha256(conteudo.encode()).hexdigest()

# ── Alertas referência ────────────────────────────────────────────────────────

ALERTAS_BASE = [
    {"id":1,"sistema":"RNDS","titulo":"Nenhum endpoint FHIR R4 implementado","descricao":"A integração RNDS é obrigatória pela Portaria SAPS 1.434/2020 para compartilhamento de dados clínicos.","severidade":"critico","criado_em":"22/07/2026","responsavel":None,"status":"aberto"},
    {"id":2,"sistema":"SCNES/CNES","titulo":"INE da ESF IV próximo de expirar","descricao":"O INE 0000123456 da ESF IV vence em 15/08/2026. Sem renovação, a produção não será processada pelo SIAPS.","severidade":"alta","criado_em":"21/07/2026","responsavel":"Coord. Atenção Primária","status":"em_andamento"},
    {"id":3,"sistema":"CADSUS","titulo":"87 cidadãos sem CNS válido na Microárea MA-03","descricao":"Cadastros com CNS vazio ou inválido impedem acompanhamento longitudinal e vinculação na RNDS.","severidade":"alta","criado_em":"20/07/2026","responsavel":None,"status":"aberto"},
    {"id":4,"sistema":"RNDS","titulo":"Certificado mTLS RNDS vencido","descricao":"O certificado digital para autenticação na RNDS expirou em 01/07/2026. Todas as transmissões estão bloqueadas.","severidade":"critico","criado_em":"01/07/2026","responsavel":"TI Municipal","status":"em_andamento"},
    {"id":5,"sistema":"eSUS PEC","titulo":"Taxa de completude de fichas abaixo de 70%","descricao":"Apenas 67% dos campos obrigatórios das fichas de cadastro individual estão preenchidos.","severidade":"media","criado_em":"19/07/2026","responsavel":"Gestor APS","status":"aberto"},
    {"id":6,"sistema":"SIAPS","titulo":"Lote de Jun/2026 com 8% de rejeição","descricao":"124 fichas do lote da competência 202606 foram rejeitadas. Motivo principal: CBO incompatível com o procedimento.","severidade":"media","criado_em":"05/07/2026","responsavel":"Coord. Atenção Primária","status":"resolvido"},
    {"id":7,"sistema":"RNDS","titulo":"Prescrições eletrônicas não transmitidas à RNDS","descricao":"A Portaria MS 2.482/2021 exige envio de prescrições à RNDS. Sistema não possui essa funcionalidade.","severidade":"critico","criado_em":"15/07/2026","responsavel":None,"status":"aberto"},
    {"id":8,"sistema":"SCNES/CNES","titulo":"3 profissionais sem vínculo ativo no SCNES","descricao":"Profissionais cadastrados no PEC não aparecem como ativos no SCNES. Produção não será computada.","severidade":"alta","criado_em":"18/07/2026","responsavel":"TI Municipal","status":"aberto"},
]

# ── Regras referência ─────────────────────────────────────────────────────────

REGRAS_BASE = [
    {"id":1,"nome":"Validade INE por Equipe","sistema":"SCNES/CNES","descricao":"Verifica se todos os INEs das equipes ESF estão vigentes e sem pendências no SCNES.","ativa":True,"frequencia":"Diária — 06:00","ultima_execucao":"23/07/2026 06:00","resultado":"alerta","total_verificacoes":180,"total_alertas":2},
    {"id":2,"nome":"Completude Fichas Cadastro Individual","sistema":"eSUS PEC","descricao":"Calcula % de campos obrigatórios preenchidos nas fichas de cadastro individual do PEC.","ativa":True,"frequencia":"Semanal — Segunda","ultima_execucao":"21/07/2026","resultado":"alerta","total_verificacoes":52,"total_alertas":8},
    {"id":3,"nome":"Taxa de Rejeição SIAPS","sistema":"SIAPS","descricao":"Monitora % de fichas rejeitadas por competência. Alerta quando supera 5%.","ativa":True,"frequencia":"Por lote enviado","ultima_execucao":"05/07/2026","resultado":"ok","total_verificacoes":24,"total_alertas":1},
    {"id":4,"nome":"Conformidade RNDS — Certificado mTLS","sistema":"RNDS","descricao":"Verifica se o certificado digital RNDS está válido e a integração respondendo.","ativa":True,"frequencia":"Diária — 08:00","ultima_execucao":"23/07/2026 08:00","resultado":"erro","total_verificacoes":180,"total_alertas":22},
    {"id":5,"nome":"CNS Válido por Microárea","sistema":"CADSUS","descricao":"Verifica % de cidadãos com CNS preenchido e válido por microárea.","ativa":True,"frequencia":"Mensal — 1º dia","ultima_execucao":"01/07/2026","resultado":"alerta","total_verificacoes":12,"total_alertas":3},
    {"id":6,"nome":"Score e-Gestor × Previne Brasil","sistema":"e-Gestor","descricao":"Compara indicadores do e-Gestor com metas estabelecidas e projeta tendência para o quadrimestre.","ativa":True,"frequencia":"Mensal — após competência","ultima_execucao":"10/07/2026","resultado":"ok","total_verificacoes":12,"total_alertas":0},
    {"id":7,"nome":"Auditoria Completa Mensal","sistema":"Todos","descricao":"Executa varredura completa em todos os sistemas. Gera relatório consolidado de conformidade.","ativa":True,"frequencia":"Mensal — 5º dia útil","ultima_execucao":"08/07/2026","resultado":"alerta","total_verificacoes":6,"total_alertas":12},
    {"id":8,"nome":"Divergência SCNES × PEC","sistema":"SCNES/CNES","descricao":"Cruza profissionais ativos no SCNES com os cadastrados no eSUS PEC. Alerta divergências.","ativa":False,"frequencia":"Semanal — Quarta","ultima_execucao":"pendente","resultado":"pendente","total_verificacoes":0,"total_alertas":0},
]

# ── Tarefas referência ────────────────────────────────────────────────────────

_tarefas: list[dict] = [
    {"id":1,"titulo":"Renovar certificado mTLS RNDS","descricao":"Solicitar novo certificado ICP-Brasil ao DATASUS para autenticação na RNDS.","sistema":"RNDS","categoria":"Certificado Digital","responsavel":"TI Municipal","prazo":"2026-08-01","prioridade":"critica","status":"em_andamento","criado_em":"01/07/2026","atualizado_em":"10/07/2026","evidencia":None,"comentarios":3,"origem_alerta":"Certificado mTLS RNDS vencido"},
    {"id":2,"titulo":"Renovar INE ESF IV no SCNES","descricao":"Entrar no SCNES e atualizar o INE da equipe ESF IV antes do vencimento em 15/08.","sistema":"SCNES/CNES","categoria":"Cadastro","responsavel":"Coord. Atenção Primária","prazo":"2026-08-10","prioridade":"alta","status":"aberto","criado_em":"21/07/2026","atualizado_em":"21/07/2026","evidencia":None,"comentarios":1,"origem_alerta":"INE da ESF IV próximo de expirar"},
    {"id":3,"titulo":"Regularizar 87 cidadãos sem CNS na MA-03","descricao":"ACS responsável deve atualizar os cadastros com CNS válido via CADSUS Web.","sistema":"CADSUS","categoria":"Qualidade Cadastral","responsavel":"Enfermeira ESF I","prazo":"2026-08-15","prioridade":"alta","status":"aberto","criado_em":"20/07/2026","atualizado_em":"20/07/2026","evidencia":None,"comentarios":0,"origem_alerta":"87 cidadãos sem CNS válido na MA-03"},
    {"id":4,"titulo":"Corrigir CBO dos procedimentos rejeitados SIAPS","descricao":"Revisar 124 fichas rejeitadas e corrigir o CBO dos profissionais para reenvio.","sistema":"SIAPS","categoria":"Produção","responsavel":"Gestor APS","prazo":"2026-07-31","prioridade":"media","status":"concluido","criado_em":"05/07/2026","atualizado_em":"20/07/2026","evidencia":"Lote reprocessado em 20/07/2026 — taxa 0%","comentarios":5,"origem_alerta":"Lote Jun/2026 com 8% de rejeição"},
    {"id":5,"titulo":"Implementar gateway RNDS no backend","descricao":"Criar services/rnds_gateway.py com autenticação mTLS e endpoints FHIR R4 para Immunization e MedicationRequest.","sistema":"RNDS","categoria":"Desenvolvimento","responsavel":"TI Municipal","prazo":"2026-09-30","prioridade":"critica","status":"aberto","criado_em":"23/07/2026","atualizado_em":"23/07/2026","evidencia":None,"comentarios":0,"origem_alerta":"Nenhum endpoint FHIR R4 implementado"},
    {"id":6,"titulo":"Ativar sincronização automática SCNES","descricao":"Configurar cron diário no Railway para sincronizar profissionais e equipes via API SCNES.","sistema":"SCNES/CNES","categoria":"Integração","responsavel":"TI Municipal","prazo":"2026-08-30","prioridade":"alta","status":"pendente_evidencia","criado_em":"15/07/2026","atualizado_em":"22/07/2026","evidencia":None,"comentarios":2,"origem_alerta":None},
]
_prox_id = 7

# ── Trilha de auditoria referência ────────────────────────────────────────────

def _gerar_eventos(pagina: int, tamanho: int = 50) -> list[dict]:
    acoes = ["LOGIN","VIEW","UPDATE","CREATE","EXPORT","AUDIT","SYNC","DELETE"]
    modulos = ["ACSPainel","AnaliseMunicipio","PrevineBrasil","SiapsEgestor","Auditoria","PlanoAcao","CentralAuditoria","TrilhaAuditoria"]
    sistemas = ["eSUS PEC","SCNES/CNES","SIAPS","e-Gestor","CADSUS","Sistema"]
    usuarios = ["Rosangela","Euler Ramos","Gestor APS","enfermeira.esf1","ti.municipal"]
    perfis   = ["Gestor Municipal","Admin","Gestor APS","Enfermeira","TI"]
    entidades = ["ACS","Equipe ESF","Cidadão","Lote SIAPS","Indicador","Tarefa","Regra"]
    campos   = [None,"nome","cns","cbo","prazo","status","responsavel","ine_vigencia"]

    eventos = []
    base_ts = datetime(2026, 7, 23, 14, 30) - timedelta(minutes=pagina * tamanho)

    for i in range(tamanho):
        ts = base_ts - timedelta(minutes=i * 3 + random.randint(0, 5))
        acao = random.choice(acoes)
        campo = random.choice(campos) if acao == "UPDATE" else None
        val_ant = f"valor_antigo_{i}" if campo else None
        val_nov = f"valor_novo_{i}" if campo else None
        sev = "critico" if acao == "DELETE" else "aviso" if acao in ["UPDATE","EXPORT"] else "info"
        conteudo = f"{ts.isoformat()}:{acao}:{random.choice(usuarios)}:{i}"
        eventos.append({
            "id": pagina * tamanho + i + 1,
            "timestamp": ts.strftime("%d/%m/%Y %H:%M:%S"),
            "usuario": random.choice(usuarios),
            "perfil": random.choice(perfis),
            "acao": acao,
            "modulo": random.choice(modulos),
            "sistema": random.choice(sistemas),
            "entidade": random.choice(entidades),
            "entidade_id": str(random.randint(1, 9999)),
            "campo_alterado": campo,
            "valor_anterior": val_ant,
            "valor_novo": val_nov,
            "ip": f"192.168.{random.randint(1,5)}.{random.randint(10,99)}",
            "hash": _gerar_hash(conteudo),
            "severidade": sev,
        })
    return eventos

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def dashboard_auditoria():
    return {
        "score_geral": _score_geral(),
        "conformidade_pct": 74,
        "sistemas": SISTEMAS_BASE,
        "alertas_ativos": ALERTAS_BASE,
        "regras": REGRAS_BASE,
        "ultima_auditoria": "23/07/2026 14:30",
        "proxima_auditoria": "24/07/2026 06:00",
        "tarefas_abertas": sum(1 for t in _tarefas if t["status"] in ("aberto","em_andamento")),
    }


@router.post("/executar-completa")
async def executar_auditoria_completa():
    return {
        "status": "executado",
        "timestamp": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "score_geral": _score_geral(),
        "sistemas_verificados": len(SISTEMAS_BASE),
        "alertas_gerados": sum(s["alertas_ativos"] for s in SISTEMAS_BASE),
        "mensagem": "Auditoria completa executada com sucesso.",
    }


@router.post("/regras/{regra_id}/executar")
async def executar_regra(regra_id: int):
    regra = next((r for r in REGRAS_BASE if r["id"] == regra_id), None)
    if not regra:
        return {"erro": "Regra não encontrada"}
    return {
        "regra_id": regra_id,
        "nome": regra["nome"],
        "resultado": "ok",
        "executado_em": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "mensagem": f"Regra '{regra['nome']}' executada.",
    }


@router.get("/plano-acao")
async def listar_plano_acao():
    return _tarefas


@router.post("/plano-acao")
async def criar_tarefa(body: dict):
    global _prox_id
    nova = {
        "id": _prox_id,
        "titulo": body.get("titulo", ""),
        "descricao": body.get("descricao", ""),
        "sistema": body.get("sistema", "Geral"),
        "categoria": body.get("categoria", ""),
        "responsavel": body.get("responsavel", ""),
        "prazo": body.get("prazo", ""),
        "prioridade": body.get("prioridade", "media"),
        "status": "aberto",
        "criado_em": datetime.now().strftime("%d/%m/%Y"),
        "atualizado_em": datetime.now().strftime("%d/%m/%Y"),
        "evidencia": None,
        "comentarios": 0,
        "origem_alerta": body.get("origem_alerta"),
    }
    _tarefas.append(nova)
    _prox_id += 1
    return nova


@router.put("/plano-acao/{tarefa_id}")
async def atualizar_tarefa(tarefa_id: int, body: dict):
    tarefa = next((t for t in _tarefas if t["id"] == tarefa_id), None)
    if not tarefa:
        return {"erro": "Tarefa não encontrada"}
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
    TOTAL = 1250
    TAMANHO = 50
    eventos = _gerar_eventos(pagina, TAMANHO)
    if acao:
        eventos = [e for e in eventos if e["acao"] == acao]
    if sistema:
        eventos = [e for e in eventos if e["sistema"] == sistema]
    if severidade:
        eventos = [e for e in eventos if e["severidade"] == severidade]
    return {
        "eventos": eventos,
        "total": TOTAL,
        "paginas": TOTAL // TAMANHO + 1,
        "pagina_atual": pagina,
    }
