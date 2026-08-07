# backend/routers/scnes_conformidade.py — Conformidade Cadastral SCNES por Equipe ESF
from fastapi import APIRouter, Query
from typing import Optional
from functools import lru_cache

router = APIRouter(prefix="/api/scnes-conformidade", tags=["scnes-conformidade"])

# ── Dados de referência ───────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _EQUIPES():
    return [
        {
            "ine": "0001420551", "nome": "Equipe de Saúde da Família I", "tipo": "ESF",
            "unidade": "UBS Centro", "cnes": "2345678", "municipio": "Mun. Exemplo", "uf": "BA",
            "status_cnes": "ativo", "score_geral": 88, "tendencia": "melhora",
            "dimensoes": {
                "vinculacao": {"score": 92, "peso": 20, "label": "Vinculação da Equipe", "itens_ok": 9, "itens_total": 10, "observacao": ""},
                "profissionais": {"score": 85, "peso": 25, "label": "Cadastro de Profissionais", "itens_ok": 17, "itens_total": 20, "observacao": "CH semanal desatualizada para 1 profissional"},
                "carga_horaria": {"score": 90, "peso": 20, "label": "Carga Horária Semanal", "itens_ok": 18, "itens_total": 20, "observacao": ""},
                "area_atuacao": {"score": 88, "peso": 15, "label": "Área de Atuação Registrada", "itens_ok": 7, "itens_total": 8, "observacao": ""},
                "formacao": {"score": 82, "peso": 10, "label": "Formação Profissional", "itens_ok": 4, "itens_total": 5, "observacao": "1 especialização pendente de atualização"},
                "equipamentos": {"score": 95, "peso": 10, "label": "Equipamentos e Instalações", "itens_ok": 19, "itens_total": 20, "observacao": ""},
            },
            "pendencias": [
                {"id": 1, "categoria": "Profissionais", "descricao": "Carga horária semanal do médico clínico geral desatualizada (36h → 40h)", "criticidade": "media", "prazo_legal": "2026-06-30", "status": "em_correcao"},
                {"id": 2, "categoria": "Formação", "descricao": "Especialização em Medicina de Família não informada no SCNES", "criticidade": "baixa", "prazo_legal": None, "status": "pendente"},
            ],
            "ultima_atualizacao": "2026-05-15", "proxima_verificacao": "2026-06-15",
        },
        {
            "ine": "0001420552", "nome": "Equipe de Saúde da Família II", "tipo": "ESF",
            "unidade": "UBS Bairro Norte", "cnes": "2345679", "municipio": "Mun. Exemplo", "uf": "BA",
            "status_cnes": "ativo", "score_geral": 64, "tendencia": "piora",
            "dimensoes": {
                "vinculacao": {"score": 70, "peso": 20, "label": "Vinculação da Equipe", "itens_ok": 7, "itens_total": 10, "observacao": "Enfermeira desvinculada após substituição"},
                "profissionais": {"score": 60, "peso": 25, "label": "Cadastro de Profissionais", "itens_ok": 12, "itens_total": 20, "observacao": "ACS substitutos não cadastrados no SCNES"},
                "carga_horaria": {"score": 55, "peso": 20, "label": "Carga Horária Semanal", "itens_ok": 11, "itens_total": 20, "observacao": "9 profissionais com CH inconsistente"},
                "area_atuacao": {"score": 72, "peso": 15, "label": "Área de Atuação Registrada", "itens_ok": 5, "itens_total": 7, "observacao": ""},
                "formacao": {"score": 68, "peso": 10, "label": "Formação Profissional", "itens_ok": 3, "itens_total": 5, "observacao": ""},
                "equipamentos": {"score": 78, "peso": 10, "label": "Equipamentos e Instalações", "itens_ok": 14, "itens_total": 18, "observacao": "Negatoscópio com manutenção pendente"},
            },
            "pendencias": [
                {"id": 3, "categoria": "Profissionais", "descricao": "3 ACS substitutos atuando sem cadastro no SCNES", "criticidade": "critica", "prazo_legal": "2026-06-01", "status": "pendente"},
                {"id": 4, "categoria": "Carga Horária", "descricao": "Inconsistência na CH semanal de 9 profissionais", "criticidade": "alta", "prazo_legal": "2026-06-15", "status": "pendente"},
                {"id": 5, "categoria": "Vinculação", "descricao": "Enfermeira responsável técnica não atualizada após substituição", "criticidade": "critica", "prazo_legal": "2026-05-31", "status": "pendente"},
            ],
            "ultima_atualizacao": "2026-04-20", "proxima_verificacao": "2026-05-20",
        },
        {
            "ine": "0001420553", "nome": "Equipe de Saúde da Família III", "tipo": "ESF",
            "unidade": "UBS Zona Rural", "cnes": "2345680", "municipio": "Mun. Exemplo", "uf": "BA",
            "status_cnes": "ativo", "score_geral": 95, "tendencia": "estavel",
            "dimensoes": {
                "vinculacao": {"score": 100, "peso": 20, "label": "Vinculação da Equipe", "itens_ok": 10, "itens_total": 10, "observacao": ""},
                "profissionais": {"score": 95, "peso": 25, "label": "Cadastro de Profissionais", "itens_ok": 19, "itens_total": 20, "observacao": ""},
                "carga_horaria": {"score": 100, "peso": 20, "label": "Carga Horária Semanal", "itens_ok": 20, "itens_total": 20, "observacao": ""},
                "area_atuacao": {"score": 88, "peso": 15, "label": "Área de Atuação Registrada", "itens_ok": 7, "itens_total": 8, "observacao": ""},
                "formacao": {"score": 90, "peso": 10, "label": "Formação Profissional", "itens_ok": 9, "itens_total": 10, "observacao": ""},
                "equipamentos": {"score": 92, "peso": 10, "label": "Equipamentos e Instalações", "itens_ok": 18, "itens_total": 20, "observacao": ""},
            },
            "pendencias": [
                {"id": 6, "categoria": "Área de Atuação", "descricao": "Setor 12A sem área de atuação formal registrada", "criticidade": "baixa", "prazo_legal": None, "status": "pendente"},
            ],
            "ultima_atualizacao": "2026-05-18", "proxima_verificacao": "2026-06-18",
        },
        {
            "ine": "0001420554", "nome": "Equipe de Saúde da Família IV", "tipo": "ESF",
            "unidade": "UBS Sul", "cnes": "2345681", "municipio": "Mun. Exemplo", "uf": "BA",
            "status_cnes": "ativo", "score_geral": 72, "tendencia": "melhora",
            "dimensoes": {
                "vinculacao": {"score": 80, "peso": 20, "label": "Vinculação da Equipe", "itens_ok": 8, "itens_total": 10, "observacao": ""},
                "profissionais": {"score": 70, "peso": 25, "label": "Cadastro de Profissionais", "itens_ok": 14, "itens_total": 20, "observacao": "CBO desatualizado para 3 ACS"},
                "carga_horaria": {"score": 75, "peso": 20, "label": "Carga Horária Semanal", "itens_ok": 15, "itens_total": 20, "observacao": ""},
                "area_atuacao": {"score": 62, "peso": 15, "label": "Área de Atuação Registrada", "itens_ok": 5, "itens_total": 8, "observacao": "3 microáreas sem área formal"},
                "formacao": {"score": 80, "peso": 10, "label": "Formação Profissional", "itens_ok": 4, "itens_total": 5, "observacao": ""},
                "equipamentos": {"score": 70, "peso": 10, "label": "Equipamentos e Instalações", "itens_ok": 14, "itens_total": 20, "observacao": "Esfigmomanômetro e balança com calibração vencida"},
            },
            "pendencias": [
                {"id": 7, "categoria": "Profissionais", "descricao": "CBO desatualizado para 3 ACS (antigo 5151-05 → 5151-20)", "criticidade": "media", "prazo_legal": "2026-07-01", "status": "pendente"},
                {"id": 8, "categoria": "Área de Atuação", "descricao": "Microáreas 4A, 4B e 4C sem formalização de área de atuação", "criticidade": "media", "prazo_legal": None, "status": "pendente"},
                {"id": 9, "categoria": "Equipamentos", "descricao": "Calibração do esfigmomanômetro e balança vencida desde 2025-12", "criticidade": "alta", "prazo_legal": "2026-06-01", "status": "em_correcao"},
            ],
            "ultima_atualizacao": "2026-05-10", "proxima_verificacao": "2026-06-10",
        },
        {
            "ine": "0001420555", "nome": "Equipe de Saúde da Família V", "tipo": "ESF",
            "unidade": "UBS Leste", "cnes": "2345682", "municipio": "Mun. Exemplo", "uf": "BA",
            "status_cnes": "ativo", "score_geral": 91, "tendencia": "melhora",
            "dimensoes": {
                "vinculacao": {"score": 95, "peso": 20, "label": "Vinculação da Equipe", "itens_ok": 9, "itens_total": 10, "observacao": ""},
                "profissionais": {"score": 90, "peso": 25, "label": "Cadastro de Profissionais", "itens_ok": 18, "itens_total": 20, "observacao": ""},
                "carga_horaria": {"score": 95, "peso": 20, "label": "Carga Horária Semanal", "itens_ok": 19, "itens_total": 20, "observacao": ""},
                "area_atuacao": {"score": 88, "peso": 15, "label": "Área de Atuação Registrada", "itens_ok": 7, "itens_total": 8, "observacao": ""},
                "formacao": {"score": 85, "peso": 10, "label": "Formação Profissional", "itens_ok": 4, "itens_total": 5, "observacao": ""},
                "equipamentos": {"score": 90, "peso": 10, "label": "Equipamentos e Instalações", "itens_ok": 18, "itens_total": 20, "observacao": ""},
            },
            "pendencias": [
                {"id": 10, "categoria": "Profissionais", "descricao": "Registro CFM do médico vencendo em 2026-08-31", "criticidade": "baixa", "prazo_legal": "2026-08-31", "status": "pendente"},
            ],
            "ultima_atualizacao": "2026-05-17", "proxima_verificacao": "2026-06-17",
        },
    ]



def _filtrar_equipes(status: str) -> list:
    if status == "criticas":
        return [e for e in _EQUIPES() if e["score_geral"] < 70]
    elif status == "atencao":
        return [e for e in _EQUIPES() if 70 <= e["score_geral"] < 90]
    elif status == "conformes":
        return [e for e in _EQUIPES() if e["score_geral"] >= 90]
    return _EQUIPES


@router.get("/resumo")
def resumo_conformidade():
    scores = [e["score_geral"] for e in _EQUIPES()]
    score_municipio = round(sum(scores) / len(scores)) if scores else 0
    conformes = sum(1 for s in scores if s >= 90)
    criticas = sum(1 for s in scores if s < 70)

    return {
        "competencia": "2026/05",
        "score_municipio": score_municipio,
        "total_equipes": len(_EQUIPES()),
        "equipes_conformes": conformes,
        "equipes_criticas": criticas,
        "distribuicao": [
            {"faixa": "Excelente (≥90)", "qtd": sum(1 for s in scores if s >= 90), "cor": "#16a34a"},
            {"faixa": "Atenção (70–89)", "qtd": sum(1 for s in scores if 70 <= s < 90), "cor": "#d97706"},
            {"faixa": "Crítico (<70)", "qtd": sum(1 for s in scores if s < 70), "cor": "#dc2626"},
        ],
        "top_pendencias": [
            {"categoria": "Carga Horária Semanal", "qtd": 3},
            {"categoria": "ACS sem Cadastro SCNES", "qtd": 3},
            {"categoria": "CBO Desatualizado", "qtd": 2},
            {"categoria": "Área de Atuação", "qtd": 2},
            {"categoria": "Equipamentos/Calibração", "qtd": 1},
        ],
    }


@router.get("/equipes")
def listar_equipes(status: Optional[str] = Query("todos")):
    return _filtrar_equipes(status or "todos")


@router.post("/sincronizar")
def sincronizar_scnes():
    return {"ok": True, "mensagem": "Sincronizacao com SCNES solicitada. Dados atualizados em instantes.", "competencia": "2026/05"}


# ── 1. Alertas CNES Expirado ──────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _ALERTAS_CNES():
    return [
        {
            "id": "ALC001",
            "equipe": "ESF III — UBS Zona Rural",
            "ine": "0001420553",
            "cnes": "2345680",
            "tipo": "cnes_expirado",
            "titulo": "Medico sem registro ativo no SCNES",
            "descricao": "O medico responsavel pela equipe ESF III nao possui vinculo ativo no SCNES ha 45 dias. Producao mensal descartada pelo e-Gestor enquanto pendente.",
            "severidade": "critica",
            "data_expiracao": "2026-05-18",
            "dias_vencido": 67,
            "acao_recomendada": "Regularizar CRM e cadastro CNES imediatamente — prazo maximo: 7 dias uteis",
            "status": "pendente",
            "modulo_correcao": "/conformidade-scnes",
        },
        {
            "id": "ALC002",
            "equipe": "ESF II — UBS Bairro Norte",
            "ine": "0001420552",
            "cnes": "2345679",
            "tipo": "vinculo_inativo",
            "titulo": "Enfermeira responsavel tecnica desvinculada",
            "descricao": "Enfermeira RT nao atualizada no SCNES apos substituicao em 2026-04-20. Risco de inabilitacao da equipe para recebimento de incentivos Previne Brasil.",
            "severidade": "critica",
            "data_expiracao": "2026-05-31",
            "dias_vencido": 54,
            "acao_recomendada": "Atualizar vinculo da nova enfermeira RT no portal SCNES com CPF, CRM/COREN e CH",
            "status": "pendente",
            "modulo_correcao": "/conformidade-scnes",
        },
        {
            "id": "ALC003",
            "equipe": "ESF II — UBS Bairro Norte",
            "ine": "0001420552",
            "cnes": "2345679",
            "tipo": "acs_sem_cadastro",
            "titulo": "3 ACS substitutos sem cadastro SCNES",
            "descricao": "Tres agentes comunitarios de saude substitutos estao realizando atendimentos e visitas domiciliares sem cadastro formal no SCNES. Visitas invalidas para fins de producao SISAB.",
            "severidade": "alta",
            "data_expiracao": "2026-06-01",
            "dias_vencido": 53,
            "acao_recomendada": "Cadastrar ACS no portal SCNES com CPF, PIS e area de atuacao antes do fechamento da competencia",
            "status": "em_correcao",
            "modulo_correcao": "/conformidade-scnes",
        },
        {
            "id": "ALC004",
            "equipe": "ESF IV — UBS Sul",
            "ine": "0001420554",
            "cnes": "2345681",
            "tipo": "equipamento_vencido",
            "titulo": "Calibracao de equipamentos vencida",
            "descricao": "Esfigmomanometro e balança da UBS Sul com calibracao vencida desde 2025-12. Irregularidade sanitaria que pode comprometer habilitacao do CNES.",
            "severidade": "alta",
            "data_expiracao": "2026-01-01",
            "dias_vencido": 204,
            "acao_recomendada": "Solicitar visita de calibracao ao IPEM-AM — custo estimado R$ 180,00",
            "status": "em_correcao",
            "modulo_correcao": "/conformidade-scnes",
        },
        {
            "id": "ALC005",
            "equipe": "ESF V — UBS Leste",
            "ine": "0001420555",
            "cnes": "2345682",
            "tipo": "registro_vencendo",
            "titulo": "CFM do medico vencendo em 38 dias",
            "descricao": "Registro CFM do Dr. Fabio Andrade vence em 2026-08-31. Apos o vencimento o medico nao podera ser vinculado ao SCNES e a equipe perdera habilitacao.",
            "severidade": "media",
            "data_expiracao": "2026-08-31",
            "dias_vencido": -38,
            "acao_recomendada": "Solicitar renovacao CFM via portal CFM Online — prazo 30 dias antes do vencimento",
            "status": "pendente",
            "modulo_correcao": "/conformidade-scnes",
        },
        {
            "id": "ALC006",
            "equipe": "UBS Centro — Geral",
            "ine": None,
            "cnes": "2801478",
            "tipo": "licenca_sanitaria",
            "titulo": "Licenca sanitaria vencendo em 22 dias",
            "descricao": "A licenca sanitaria da UBS Centro (CNES 2801478) vence em 2026-08-15. Sem renovacao a unidade perde habilitacao para todos os procedimentos credenciados.",
            "severidade": "media",
            "data_expiracao": "2026-08-15",
            "dias_vencido": -22,
            "acao_recomendada": "Protocolar renovacao na VISA municipal com 30 dias de antecedencia — documentos obrigatorios: planta baixa, laudos tecnicos e ART do responsavel",
            "status": "pendente",
            "modulo_correcao": "/conformidade-scnes",
        },
    ]



@router.get("/alertas-cnes")
def alertas_cnes():
    criticos = sum(1 for a in _ALERTAS_CNES() if a["severidade"] == "critica")
    altos    = sum(1 for a in _ALERTAS_CNES() if a["severidade"] == "alta")
    medios   = sum(1 for a in _ALERTAS_CNES() if a["severidade"] == "media")
    return {
        "total": len(_ALERTAS_CNES()),
        "criticos": criticos,
        "altos": altos,
        "medios": medios,
        "alertas": _ALERTAS_CNES(),
        "ultima_verificacao": "2026-07-24 06:00",
    }


# ── 2. Historico de Alteracoes SCNES ─────────────────────────────────────────

@lru_cache(maxsize=1)
def _HISTORICO():
    return [
        {
            "id": "HIST001",
            "data": "2026-07-01",
            "hora": "08:30",
            "equipe": "ESF I — UBS Centro",
            "ine": "0001420551",
            "tipo_alteracao": "atualizacao_ch",
            "campo": "Carga Horaria Semanal",
            "valor_anterior": "36h/semana",
            "valor_novo": "40h/semana",
            "profissional": "Dr. Carlos Mendonca (CRM-AM 4821)",
            "responsavel_alteracao": "Gestor RH — Maria Souza",
            "status": "aprovada",
            "impacto": "Score CH: 88 → 96 pontos",
        },
        {
            "id": "HIST002",
            "data": "2026-06-28",
            "hora": "14:15",
            "equipe": "ESF IV — UBS Sul",
            "ine": "0001420554",
            "tipo_alteracao": "atualizacao_cbo",
            "campo": "Codigo Brasileiro de Ocupacoes (CBO)",
            "valor_anterior": "5151-05",
            "valor_novo": "5151-20",
            "profissional": "ACS Joao Pedro, ACS Marta Lima, ACS Rodrigo Farias",
            "responsavel_alteracao": "Coordenadora APS — Dra. Patricia Lima",
            "status": "aprovada",
            "impacto": "Regularizacao CBO para 3 ACS — score profissionais +8pts",
        },
        {
            "id": "HIST003",
            "data": "2026-06-20",
            "hora": "09:00",
            "equipe": "ESF II — UBS Bairro Norte",
            "ine": "0001420552",
            "tipo_alteracao": "desvinculacao",
            "campo": "Profissional Responsavel Tecnico",
            "valor_anterior": "Enf. Carla Santos (COREN-AM 789012)",
            "valor_novo": "— (vaga em aberto)",
            "profissional": "Enf. Carla Santos",
            "responsavel_alteracao": "RH FMS — Secretaria Municipal de Saude",
            "status": "pendente_regularizacao",
            "impacto": "Equipe sem RT formal — risco de descredenciamento",
        },
        {
            "id": "HIST004",
            "data": "2026-06-15",
            "hora": "11:45",
            "equipe": "ESF III — UBS Zona Rural",
            "ine": "0001420553",
            "tipo_alteracao": "novo_profissional",
            "campo": "Novo ACS Cadastrado",
            "valor_anterior": "—",
            "valor_novo": "ACS Benedita Costa (PIS 12345678900) — Area Rural Norte",
            "profissional": "ACS Benedita Costa",
            "responsavel_alteracao": "Coordenadora APS — Dra. Patricia Lima",
            "status": "aprovada",
            "impacto": "Cobertura Area Rural Norte regularizada",
        },
        {
            "id": "HIST005",
            "data": "2026-06-10",
            "hora": "16:00",
            "equipe": "ESF V — UBS Leste",
            "ine": "0001420555",
            "tipo_alteracao": "atualizacao_area",
            "campo": "Area de Atuacao",
            "valor_anterior": "Setor Leste parcial",
            "valor_novo": "Setor Leste completo — setores L1 a L7",
            "profissional": "Equipe ESF V (todos)",
            "responsavel_alteracao": "Gestao de Cadastros — FMS",
            "status": "aprovada",
            "impacto": "Area de atuacao regularizada — score area +14pts",
        },
        {
            "id": "HIST006",
            "data": "2026-05-30",
            "hora": "10:20",
            "equipe": "ESF I — UBS Centro",
            "ine": "0001420551",
            "tipo_alteracao": "atualizacao_formacao",
            "campo": "Formacao Profissional",
            "valor_anterior": "Medicina Geral",
            "valor_novo": "Medicina Geral + Especializacao Medicina de Familia e Comunidade (SBMFC)",
            "profissional": "Dr. Carlos Mendonca (CRM-AM 4821)",
            "responsavel_alteracao": "Dr. Carlos Mendonca — via portal SCNES",
            "status": "aprovada",
            "impacto": "Score formacao: 82 → 90 pontos",
        },
        {
            "id": "HIST007",
            "data": "2026-05-20",
            "hora": "07:30",
            "equipe": "Sistema — Sincronizacao Automatica",
            "ine": None,
            "tipo_alteracao": "sincronizacao",
            "campo": "Sincronizacao Global SCNES",
            "valor_anterior": "Competencia 2026/04",
            "valor_novo": "Competencia 2026/05",
            "profissional": "—",
            "responsavel_alteracao": "Sistema ERSUS 360 — Cron automatico",
            "status": "aprovada",
            "impacto": "5 equipes atualizadas — 12 pendencias identificadas",
        },
    ]



@router.get("/historico")
def historico_alteracoes():
    return {
        "total_alteracoes": len(_HISTORICO()),
        "aprovadas": sum(1 for h in _HISTORICO() if h["status"] == "aprovada"),
        "pendentes_regularizacao": sum(1 for h in _HISTORICO() if h["status"] == "pendente_regularizacao"),
        "periodo": "Maio 2026 — Julho 2026",
        "alteracoes": _HISTORICO(),
    }


# ── 3. Sincronizacao Automatica SCNES API ─────────────────────────────────────

@lru_cache(maxsize=1)
def _SINCRONIZACOES():
    return [
        {"id": "SYNC007", "data": "2026-07-01", "hora": "06:00", "duracao_seg": 42, "status": "sucesso", "equipes_atualizadas": 5, "pendencias_novas": 0, "pendencias_resolvidas": 2, "competencia": "2026/06"},
        {"id": "SYNC006", "data": "2026-06-01", "hora": "06:00", "duracao_seg": 38, "status": "sucesso", "equipes_atualizadas": 5, "pendencias_novas": 2, "pendencias_resolvidas": 1, "competencia": "2026/05"},
        {"id": "SYNC005", "data": "2026-05-01", "hora": "06:00", "duracao_seg": 51, "status": "sucesso", "equipes_atualizadas": 5, "pendencias_novas": 4, "pendencias_resolvidas": 0, "competencia": "2026/04"},
        {"id": "SYNC004", "data": "2026-04-01", "hora": "06:00", "duracao_seg": 29, "status": "sucesso", "equipes_atualizadas": 4, "pendencias_novas": 1, "pendencias_resolvidas": 3, "competencia": "2026/03"},
        {"id": "SYNC003", "data": "2026-03-01", "hora": "06:01", "duracao_seg": 0,  "status": "falha",   "equipes_atualizadas": 0, "pendencias_novas": 0, "pendencias_resolvidas": 0, "competencia": "2026/02", "erro": "Timeout na API SCNES — reprocessado manualmente em 2026-03-02"},
        {"id": "SYNC002", "data": "2026-02-01", "hora": "06:00", "duracao_seg": 44, "status": "sucesso", "equipes_atualizadas": 5, "pendencias_novas": 3, "pendencias_resolvidas": 1, "competencia": "2026/01"},
    ]



@router.get("/sincronizacao")
def status_sincronizacao():
    ultima = _SINCRONIZACOES()[0]
    return {
        "status_api": "online",
        "frequencia": "Mensal — todo dia 1 as 06:00",
        "ultima_sincronizacao": {
            "data": ultima["data"],
            "hora": ultima["hora"],
            "status": ultima["status"],
            "duracao_seg": ultima["duracao_seg"],
            "competencia": ultima["competencia"],
        },
        "proxima_sincronizacao": "2026-08-01 06:00",
        "historico_execucoes": _SINCRONIZACOES(),
        "endpoints_scnes": [
            {"nome": "Consulta Equipe", "url": "/fnes/r01007ie01.asp", "status": "online"},
            {"nome": "Profissionais", "url": "/fnes/r01007ie04.asp", "status": "online"},
            {"nome": "Estabelecimento", "url": "/fnes/r01007ie02.asp", "status": "online"},
        ],
        "taxa_sucesso": round(sum(1 for s in _SINCRONIZACOES() if s["status"] == "sucesso") / len(_SINCRONIZACOES()) * 100),
    }


# ── 4. Plano de Correcao Cadastral ───────────────────────────────────────────

@lru_cache(maxsize=1)
def _PLANO_CORRECAO():
    return [
        {
            "id": "PC001",
            "equipe": "ESF II — UBS Bairro Norte",
            "ine": "0001420552",
            "titulo": "Cadastrar 3 ACS substitutos no SCNES",
            "descricao": "Tres ACS substitutos atuando sem cadastro formal. Incluir CPF, PIS, CBO 5151-20 e area de atuacao de cada um.",
            "responsavel": "Coordenadora APS",
            "prazo": "2026-07-31",
            "prioridade": "critica",
            "status": "em_andamento",
            "passos": [
                {"ordem": 1, "descricao": "Reunir CPF e PIS dos 3 ACS substitutos", "feito": True},
                {"ordem": 2, "descricao": "Preencher ficha de cadastro SCNES para cada ACS", "feito": True},
                {"ordem": 3, "descricao": "Enviar para validacao do gestor municipal", "feito": False},
                {"ordem": 4, "descricao": "Protocolar no portal SCNES e aguardar ativacao", "feito": False},
            ],
            "dimensao_afetada": "profissionais",
            "ganho_estimado_score": 12,
        },
        {
            "id": "PC002",
            "equipe": "ESF II — UBS Bairro Norte",
            "ine": "0001420552",
            "titulo": "Vincular nova enfermeira RT",
            "descricao": "Enf. Carla Santos desligada em junho. Nova RT: Enf. Juliana Ferreira (COREN-AM 892341). Prazo critico — equipe sem RT formalmente registrada.",
            "responsavel": "Gestao RH FMS",
            "prazo": "2026-07-28",
            "prioridade": "critica",
            "status": "aberto",
            "passos": [
                {"ordem": 1, "descricao": "Obter COREN e CPF da Enf. Juliana Ferreira", "feito": False},
                {"ordem": 2, "descricao": "Acessar portal SCNES — Profissionais — Responsavel Tecnico", "feito": False},
                {"ordem": 3, "descricao": "Inativar vinculo da Enf. Carla Santos", "feito": False},
                {"ordem": 4, "descricao": "Inserir vinculo da Enf. Juliana com CH 40h/semana", "feito": False},
            ],
            "dimensao_afetada": "vinculacao",
            "ganho_estimado_score": 18,
        },
        {
            "id": "PC003",
            "equipe": "ESF III — UBS Zona Rural",
            "ine": "0001420553",
            "titulo": "Regularizar registro medico no SCNES",
            "descricao": "Medico responsavel sem CRM ativo vinculado. Risco de descredenciamento da equipe e perda financeira de R$ 23.000/mes em incentivos.",
            "responsavel": "Direcao do Municipio",
            "prazo": "2026-07-27",
            "prioridade": "critica",
            "status": "aberto",
            "passos": [
                {"ordem": 1, "descricao": "Verificar situacao do CRM junto ao CFM-AM", "feito": False},
                {"ordem": 2, "descricao": "Se CRM inativo: solicitar reativacao com taxa correspondente", "feito": False},
                {"ordem": 3, "descricao": "Atualizar vinculo no portal SCNES com novo CRM ativo", "feito": False},
                {"ordem": 4, "descricao": "Confirmar habilitacao da equipe no e-Gestor APS", "feito": False},
            ],
            "dimensao_afetada": "profissionais",
            "ganho_estimado_score": 22,
        },
        {
            "id": "PC004",
            "equipe": "ESF IV — UBS Sul",
            "ine": "0001420554",
            "titulo": "Calibracao de equipamentos essenciais",
            "descricao": "Esfigmomanometro e balança com calibracao vencida desde 2025-12. Exigencia sanitaria para manutencao do habite-se do CNES.",
            "responsavel": "Coordenacao de Infraestrutura FMS",
            "prazo": "2026-08-15",
            "prioridade": "alta",
            "status": "em_andamento",
            "passos": [
                {"ordem": 1, "descricao": "Solicitar orcamento ao IPEM-AM via oficio", "feito": True},
                {"ordem": 2, "descricao": "Empenhar R$ 180,00 para calibracao", "feito": False},
                {"ordem": 3, "descricao": "Agendar visita tecnica do IPEM na UBS Sul", "feito": False},
                {"ordem": 4, "descricao": "Anexar certificados de calibracao ao prontuario SCNES", "feito": False},
            ],
            "dimensao_afetada": "equipamentos",
            "ganho_estimado_score": 8,
        },
        {
            "id": "PC005",
            "equipe": "ESF IV — UBS Sul",
            "ine": "0001420554",
            "titulo": "Atualizar CBO de 3 ACS",
            "descricao": "ACS com CBO 5151-05 desatualizado. Novo padrao: CBO 5151-20. Correcao necessaria para validade das producoes SISAB.",
            "responsavel": "Coordenadora APS",
            "prazo": "2026-07-31",
            "prioridade": "media",
            "status": "concluido",
            "passos": [
                {"ordem": 1, "descricao": "Identificar 3 ACS com CBO desatualizado", "feito": True},
                {"ordem": 2, "descricao": "Atualizar CBO no portal SCNES para cada ACS", "feito": True},
                {"ordem": 3, "descricao": "Validar ativacao pelo sistema SCNES (24-48h)", "feito": True},
            ],
            "dimensao_afetada": "profissionais",
            "ganho_estimado_score": 6,
        },
    ]



@router.get("/plano-correcao")
def plano_correcao():
    abertos    = sum(1 for p in _PLANO_CORRECAO() if p["status"] == "aberto")
    andamento  = sum(1 for p in _PLANO_CORRECAO() if p["status"] == "em_andamento")
    concluidos = sum(1 for p in _PLANO_CORRECAO() if p["status"] == "concluido")
    ganho_total = sum(p["ganho_estimado_score"] for p in _PLANO_CORRECAO() if p["status"] != "concluido")
    return {
        "total_tarefas": len(_PLANO_CORRECAO()),
        "abertos": abertos,
        "em_andamento": andamento,
        "concluidos": concluidos,
        "ganho_potencial_score": ganho_total,
        "tarefas": _PLANO_CORRECAO(),
    }


@router.post("/plano-correcao/{tarefa_id}/resolver")
def resolver_tarefa(tarefa_id: str):
    for t in _PLANO_CORRECAO():
        if t["id"] == tarefa_id:
            t["status"] = "concluido"
            for p in t["passos"]:
                p["feito"] = True
            return {"ok": True, "mensagem": f"Tarefa {tarefa_id} marcada como concluida."}
    return {"ok": False, "mensagem": "Tarefa nao encontrada."}


# ── 5. Relatorio Divergencia SCNES x PEC ─────────────────────────────────────

@lru_cache(maxsize=1)
def _DIVERGENCIAS():
    return [
        {
            "equipe": "ESF I — UBS Centro",
            "ubs": "UBS Centro",
            "ine": "0001420551",
            "cnes": "2345678",
            "campo": "Medico Responsavel",
            "profissional": "Dr. Carlos Mendonça",
            "cbo": "Médico — CBO 225142",
            "valor_scnes": "Dr. Carlos Mendonca (CRM-AM 4821)",
            "valor_pec":   "Dr. Carlos Mendonca (CRM-AM 4821)",
            "status": "convergente",
            "tipo": "profissional",
        },
        {
            "equipe": "ESF I — UBS Centro",
            "ubs": "UBS Centro",
            "ine": "0001420551",
            "cnes": "2345678",
            "campo": "Carga Horaria Medico",
            "profissional": "Dr. Carlos Mendonça",
            "cbo": "Médico — CBO 225142",
            "valor_scnes": "40h/semana",
            "valor_pec":   "36h/semana",
            "status": "divergente",
            "criticidade": "media",
            "tipo": "carga_horaria",
            "orientacao": "Atualizar CH no PEC para 40h — compativel com o SCNES",
        },
        {
            "equipe": "ESF II — UBS Bairro Norte",
            "ubs": "UBS Bairro Norte",
            "ine": "0001420552",
            "cnes": "2345679",
            "campo": "Enfermeira Responsavel Tecnico",
            "profissional": "Enf. Carla Santos (INATIVA) → Enf. Juliana Ferreira",
            "cbo": "Enfermeiro — CBO 223505",
            "valor_scnes": "Enf. Carla Santos (COREN-AM 789012) — INATIVA",
            "valor_pec":   "Enf. Juliana Ferreira (COREN-AM 892341)",
            "status": "divergente",
            "criticidade": "critica",
            "tipo": "profissional",
            "orientacao": "SCNES nao reflete a RT atual — atualizar vinculo urgente no SCNES",
        },
        {
            "equipe": "ESF II — UBS Bairro Norte",
            "ubs": "UBS Bairro Norte",
            "ine": "0001420552",
            "cnes": "2345679",
            "campo": "Numero de ACS",
            "profissional": "ACS (3 substitutos sem cadastro no SCNES)",
            "cbo": "Agente Comunitário de Saúde — CBO 515105",
            "valor_scnes": "2 ACS ativos",
            "valor_pec":   "5 ACS (3 substitutos sem SCNES)",
            "status": "divergente",
            "criticidade": "alta",
            "tipo": "quadro_profissional",
            "orientacao": "Cadastrar 3 ACS substitutos no SCNES para regularizacao",
        },
        {
            "equipe": "ESF III — UBS Zona Rural",
            "ubs": "UBS Zona Rural",
            "ine": "0001420553",
            "cnes": "2345680",
            "campo": "Medico da Equipe",
            "profissional": "Dr. Rogerio Nunes (vaga sem CRM ativo no SCNES)",
            "cbo": "Médico — CBO 225142",
            "valor_scnes": "— (vaga sem CRM ativo)",
            "valor_pec":   "Dr. Rogerio Nunes (CRM-AM 5934) — Vaga em aberto no SCNES",
            "status": "divergente",
            "criticidade": "critica",
            "tipo": "profissional",
            "orientacao": "Regularizar CRM no CFM-AM e atualizar SCNES — equipe desabilitada",
        },
        {
            "equipe": "ESF III — UBS Zona Rural",
            "ubs": "UBS Zona Rural",
            "ine": "0001420553",
            "cnes": "2345680",
            "campo": "Area de Atuacao",
            "profissional": "—",
            "cbo": "—",
            "valor_scnes": "Zona Rural Norte — setores ZR1 a ZR6",
            "valor_pec":   "Zona Rural Norte — setores ZR1 a ZR6",
            "status": "convergente",
            "tipo": "area",
        },
        {
            "equipe": "ESF IV — UBS Sul",
            "ubs": "UBS Sul",
            "ine": "0001420554",
            "cnes": "2345681",
            "campo": "CBO dos ACS",
            "profissional": "Todos os ACS da equipe",
            "cbo": "Agente Comunitário de Saúde — CBO 515105 → 5151-20",
            "valor_scnes": "CBO 5151-20 (atualizado em 2026-06-28)",
            "valor_pec":   "CBO 5151-20",
            "status": "convergente",
            "tipo": "cbo",
        },
        {
            "equipe": "ESF IV — UBS Sul",
            "ubs": "UBS Sul",
            "ine": "0001420554",
            "cnes": "2345681",
            "campo": "Equipamentos Habilitados",
            "profissional": "Equipe / Responsável pela UBS",
            "cbo": "—",
            "valor_scnes": "Esfigmomanometro + Balança (calibracao vencida 2025-12)",
            "valor_pec":   "Esfigmomanometro + Balança (em uso regular)",
            "status": "divergente",
            "criticidade": "media",
            "tipo": "equipamentos",
            "orientacao": "PEC registra uso regular mas SCNES aponta calibracao vencida — corrigir calibracao",
        },
        {
            "equipe": "ESF V — UBS Leste",
            "ubs": "UBS Leste",
            "ine": "0001420555",
            "cnes": "2345682",
            "campo": "Medico da Equipe",
            "profissional": "Dr. Fábio Andrade",
            "cbo": "Médico — CRM-AM 6102 (CFM vencendo 2026-08-31)",
            "valor_scnes": "Dr. Fabio Andrade (CRM-AM 6102) — CFM vencendo 2026-08-31",
            "valor_pec":   "Dr. Fabio Andrade (CRM-AM 6102)",
            "status": "alerta",
            "criticidade": "media",
            "tipo": "profissional",
            "orientacao": "CFM vencendo — solicitar renovacao preventiva",
        },
        {
            "equipe": "ESF V — UBS Leste",
            "ubs": "UBS Leste",
            "ine": "0001420555",
            "cnes": "2345682",
            "campo": "Numero de Microareas",
            "profissional": "—",
            "cbo": "—",
            "valor_scnes": "7 microareas (L1 a L7)",
            "valor_pec":   "7 microareas (L1 a L7)",
            "status": "convergente",
            "tipo": "area",
        },
    ]



@router.get("/divergencia-pec")
def divergencia_pec():
    convergentes = sum(1 for d in _DIVERGENCIAS() if d["status"] == "convergente")
    divergentes  = sum(1 for d in _DIVERGENCIAS() if d["status"] == "divergente")
    alertas      = sum(1 for d in _DIVERGENCIAS() if d["status"] == "alerta")
    criticas     = sum(1 for d in _DIVERGENCIAS() if d.get("criticidade") == "critica")
    return {
        "total_campos": len(_DIVERGENCIAS()),
        "convergentes": convergentes,
        "divergentes": divergentes,
        "alertas": alertas,
        "criticas": criticas,
        "taxa_convergencia": round(convergentes / len(_DIVERGENCIAS()) * 100),
        "competencia_scnes": "2026/06",
        "competencia_pec": "2026/07",
        "divergencias": _DIVERGENCIAS(),
        "ultima_comparacao": "2026-07-24 06:00",
    }
