# backend/routers/cadsus_qualidade.py — Qualidade Cadastral CADSUS por Microárea
from fastapi import APIRouter, Query
from typing import Optional
from functools import lru_cache

router = APIRouter(prefix="/api/cadsus-qualidade", tags=["cadsus-qualidade"])

# ── Dados de referência ───────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _MICROAREAS():
    return [
        {
            "codigo": "MA-1A", "nome": "Microárea 1A — Centro Norte", "acs": "Maria Santos", "ine_equipe": "0001420551", "total_cidadaos": 142,
            "score_qualidade": 91, "tendencia": "melhora",
            "indicadores": {
                "completude": {"label": "Completude de Campos Obrigatórios", "pct": 94, "meta": 90, "qtd_ok": 133, "total": 142},
                "cns_valido": {"label": "CNS Válido / Verificado", "pct": 88, "meta": 85, "qtd_ok": 125, "total": 142},
                "endereco": {"label": "Endereço Completo", "pct": 96, "meta": 90, "qtd_ok": 136, "total": 142},
                "unicidade": {"label": "Sem Duplicidade no Sistema", "pct": 99, "meta": 98, "qtd_ok": 141, "total": 142},
                "atualizacao": {"label": "Atualizado nos últimos 12 meses", "pct": 82, "meta": 80, "qtd_ok": 116, "total": 142},
            },
            "criticos": [
                {"cns": "710 0081 6093 0008", "nome": "João da Silva", "problema": "CNS não verificado no CADSUS", "criticidade": "alta"},
                {"cns": "710 0012 4567 0003", "nome": "Maria Souza", "problema": "Endereço incompleto (sem complemento)", "criticidade": "media"},
            ],
        },
        {
            "codigo": "MA-1B", "nome": "Microárea 1B — Centro Sul", "acs": "Ana Carvalho", "ine_equipe": "0001420551", "total_cidadaos": 118,
            "score_qualidade": 76, "tendencia": "estavel",
            "indicadores": {
                "completude": {"label": "Completude de Campos Obrigatórios", "pct": 78, "meta": 90, "qtd_ok": 92, "total": 118},
                "cns_valido": {"label": "CNS Válido / Verificado", "pct": 71, "meta": 85, "qtd_ok": 84, "total": 118},
                "endereco": {"label": "Endereço Completo", "pct": 84, "meta": 90, "qtd_ok": 99, "total": 118},
                "unicidade": {"label": "Sem Duplicidade no Sistema", "pct": 97, "meta": 98, "qtd_ok": 115, "total": 118},
                "atualizacao": {"label": "Atualizado nos últimos 12 meses", "pct": 68, "meta": 80, "qtd_ok": 80, "total": 118},
            },
            "criticos": [
                {"cns": "710 0019 9800 0012", "nome": "Pedro Oliveira", "problema": "Não atualizado há 18 meses", "criticidade": "alta"},
                {"cns": "710 0033 2221 0015", "nome": "Lucia Ferreira", "problema": "CNS inválido (dígito verificador errado)", "criticidade": "alta"},
                {"cns": "710 0044 8880 0018", "nome": "Carlos Mendes", "problema": "Campos obrigatórios incompletos (raça/cor e escolaridade)", "criticidade": "media"},
                {"cns": "710 0055 1110 0020", "nome": "Rosa Lima", "problema": "Endereço desatualizado", "criticidade": "media"},
            ],
        },
        {
            "codigo": "MA-2A", "nome": "Microárea 2A — Bairro Norte I", "acs": "José Pereira", "ine_equipe": "0001420552", "total_cidadaos": 156,
            "score_qualidade": 58, "tendencia": "piora",
            "indicadores": {
                "completude": {"label": "Completude de Campos Obrigatórios", "pct": 61, "meta": 90, "qtd_ok": 95, "total": 156},
                "cns_valido": {"label": "CNS Válido / Verificado", "pct": 55, "meta": 85, "qtd_ok": 86, "total": 156},
                "endereco": {"label": "Endereço Completo", "pct": 70, "meta": 90, "qtd_ok": 109, "total": 156},
                "unicidade": {"label": "Sem Duplicidade no Sistema", "pct": 88, "meta": 98, "qtd_ok": 137, "total": 156},
                "atualizacao": {"label": "Atualizado nos últimos 12 meses", "pct": 45, "meta": 80, "qtd_ok": 70, "total": 156},
            },
            "criticos": [
                {"cns": "710 0066 7771 0022", "nome": "Antonia Reis", "problema": "Duplicidade detectada — 2 cadastros com mesmo CPF", "criticidade": "alta"},
                {"cns": "710 0077 3330 0025", "nome": "Francisco Costa", "problema": "Não atualizado há 24 meses", "criticidade": "alta"},
                {"cns": "710 0088 9990 0028", "nome": "Benedita Alves", "problema": "CNS ausente — cidadão sem cartão SUS", "criticidade": "alta"},
                {"cns": "710 0099 1110 0030", "nome": "Manoel Souza", "problema": "Raça/cor não informada", "criticidade": "media"},
                {"cns": "710 0011 2223 0033", "nome": "Conceição Nunes", "problema": "Data de nascimento inconsistente com RG", "criticidade": "alta"},
            ],
        },
        {
            "codigo": "MA-3A", "nome": "Microárea 3A — Zona Rural I", "acs": "Francisca Gomes", "ine_equipe": "0001420553", "total_cidadaos": 98,
            "score_qualidade": 95, "tendencia": "melhora",
            "indicadores": {
                "completude": {"label": "Completude de Campos Obrigatórios", "pct": 97, "meta": 90, "qtd_ok": 95, "total": 98},
                "cns_valido": {"label": "CNS Válido / Verificado", "pct": 96, "meta": 85, "qtd_ok": 94, "total": 98},
                "endereco": {"label": "Endereço Completo", "pct": 98, "meta": 90, "qtd_ok": 96, "total": 98},
                "unicidade": {"label": "Sem Duplicidade no Sistema", "pct": 100, "meta": 98, "qtd_ok": 98, "total": 98},
                "atualizacao": {"label": "Atualizado nos últimos 12 meses", "pct": 89, "meta": 80, "qtd_ok": 87, "total": 98},
            },
            "criticos": [
                {"cns": "710 0022 3334 0035", "nome": "Raimundo Matos", "problema": "Endereço rural sem localização GPS", "criticidade": "media"},
            ],
        },
        {
            "codigo": "MA-4A", "nome": "Microárea 4A — Zona Sul I", "acs": "Rosangela Lima", "ine_equipe": "0001420554", "total_cidadaos": 134,
            "score_qualidade": 69, "tendencia": "melhora",
            "indicadores": {
                "completude": {"label": "Completude de Campos Obrigatórios", "pct": 72, "meta": 90, "qtd_ok": 96, "total": 134},
                "cns_valido": {"label": "CNS Válido / Verificado", "pct": 66, "meta": 85, "qtd_ok": 88, "total": 134},
                "endereco": {"label": "Endereço Completo", "pct": 80, "meta": 90, "qtd_ok": 107, "total": 134},
                "unicidade": {"label": "Sem Duplicidade no Sistema", "pct": 94, "meta": 98, "qtd_ok": 126, "total": 134},
                "atualizacao": {"label": "Atualizado nos últimos 12 meses", "pct": 58, "meta": 80, "qtd_ok": 78, "total": 134},
            },
            "criticos": [
                {"cns": "710 0033 4445 0037", "nome": "Joana Barbosa", "problema": "CNS não verificado + endereço incompleto", "criticidade": "alta"},
                {"cns": "710 0044 5556 0040", "nome": "Severino Castro", "problema": "Não atualizado há 20 meses", "criticidade": "alta"},
                {"cns": "710 0055 6667 0042", "nome": "Helena Rocha", "problema": "Escolaridade e situação de trabalho em branco", "criticidade": "media"},
            ],
        },
        {
            "codigo": "MA-5A", "nome": "Microárea 5A — Leste I", "acs": "Talita Araújo", "ine_equipe": "0001420555", "total_cidadaos": 127,
            "score_qualidade": 88, "tendencia": "melhora",
            "indicadores": {
                "completude": {"label": "Completude de Campos Obrigatórios", "pct": 91, "meta": 90, "qtd_ok": 116, "total": 127},
                "cns_valido": {"label": "CNS Válido / Verificado", "pct": 87, "meta": 85, "qtd_ok": 110, "total": 127},
                "endereco": {"label": "Endereço Completo", "pct": 93, "meta": 90, "qtd_ok": 118, "total": 127},
                "unicidade": {"label": "Sem Duplicidade no Sistema", "pct": 99, "meta": 98, "qtd_ok": 126, "total": 127},
                "atualizacao": {"label": "Atualizado nos últimos 12 meses", "pct": 78, "meta": 80, "qtd_ok": 99, "total": 127},
            },
            "criticos": [
                {"cns": "710 0066 8889 0044", "nome": "Ilda Freitas", "problema": "Atualização pendente (72% do prazo expirado)", "criticidade": "media"},
                {"cns": "710 0077 9990 0046", "nome": "Lauro Macedo", "problema": "CNS diferente do registrado no PEC", "criticidade": "alta"},
            ],
        },
    ]



def _filtrar(filtro: str) -> list:
    if filtro == "criticas":
        return [m for m in _MICROAREAS() if m["score_qualidade"] < 65]
    elif filtro == "atencao":
        return [m for m in _MICROAREAS() if 65 <= m["score_qualidade"] < 85]
    elif filtro == "boas":
        return [m for m in _MICROAREAS() if m["score_qualidade"] >= 85]
    return _MICROAREAS()


@router.get("/resumo")
def resumo_qualidade():
    total_cid = sum(m["total_cidadaos"] for m in _MICROAREAS())
    scores = [m["score_qualidade"] for m in _MICROAREAS()]
    score_mun = round(sum(scores) / len(scores))

    # aprox. completos = pct médio de completude * total
    completos = int(total_cid * 0.82)
    incompletos = total_cid - completos

    return {
        "competencia": "2026/05",
        "total_microareas": len(_MICROAREAS()),
        "score_municipio": score_mun,
        "total_cidadaos": total_cid,
        "cidadaos_completos": completos,
        "cidadaos_incompletos": incompletos,
        "distribuicao_score": [
            {"faixa": "Boa (≥85)", "qtd": sum(1 for s in scores if s >= 85), "pct": round(sum(1 for s in scores if s >= 85)/len(scores)*100), "cor": "#16a34a"},
            {"faixa": "Atenção (65–84)", "qtd": sum(1 for s in scores if 65 <= s < 85), "pct": round(sum(1 for s in scores if 65 <= s < 85)/len(scores)*100), "cor": "#d97706"},
            {"faixa": "Crítica (<65)", "qtd": sum(1 for s in scores if s < 65), "pct": round(sum(1 for s in scores if s < 65)/len(scores)*100), "cor": "#dc2626"},
        ],
        "indicadores_municipio": {
            "completude": {"label": "Completude de Campos Obrigatórios", "pct": 82, "meta": 90},
            "cns_valido": {"label": "CNS Válido / Verificado", "pct": 77, "meta": 85},
            "endereco": {"label": "Endereço Completo", "pct": 87, "meta": 90},
            "unicidade": {"label": "Sem Duplicidade", "pct": 96, "meta": 98},
            "atualizacao": {"label": "Atualizado ≤12 meses", "pct": 70, "meta": 80},
        },
        "historico_score": [
            {"mes": "Jul/25", "score": 64},
            {"mes": "Ago/25", "score": 66},
            {"mes": "Set/25", "score": 68},
            {"mes": "Out/25", "score": 70},
            {"mes": "Nov/25", "score": 72},
            {"mes": "Dez/25", "score": 74},
            {"mes": "Jan/26", "score": 74},
            {"mes": "Fev/26", "score": 76},
            {"mes": "Mar/26", "score": 77},
            {"mes": "Abr/26", "score": 78},
            {"mes": "Mai/26", "score": score_mun},
        ],
    }


@router.get("/microareas")
def listar_microareas(filtro: Optional[str] = Query("todas")):
    return _filtrar(filtro or "todas")


@router.post("/sincronizar")
def sincronizar_cadsus():
    return {"ok": True, "mensagem": "Sincronização com CADSUS solicitada. Dados de qualidade serão recalculados."}