# backend/routers/scnes_conformidade.py — Conformidade Cadastral SCNES por Equipe ESF
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/scnes-conformidade", tags=["scnes-conformidade"])

# ── Dados de referência ───────────────────────────────────────────────────────

_EQUIPES = [
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
        return [e for e in _EQUIPES if e["score_geral"] < 70]
    elif status == "atencao":
        return [e for e in _EQUIPES if 70 <= e["score_geral"] < 90]
    elif status == "conformes":
        return [e for e in _EQUIPES if e["score_geral"] >= 90]
    return _EQUIPES


@router.get("/resumo")
def resumo_conformidade():
    scores = [e["score_geral"] for e in _EQUIPES]
    score_municipio = round(sum(scores) / len(scores)) if scores else 0
    conformes = sum(1 for s in scores if s >= 90)
    criticas = sum(1 for s in scores if s < 70)

    return {
        "competencia": "2026/05",
        "score_municipio": score_municipio,
        "total_equipes": len(_EQUIPES),
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
    return {"ok": True, "mensagem": "Sincronização com SCNES solicitada. Dados atualizados em instantes.", "competencia": "2026/05"}
