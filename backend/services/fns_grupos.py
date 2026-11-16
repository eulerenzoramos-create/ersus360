"""Nome padronizado dos grupos do FNS (o mesmo do filtro "Grupo" da tela de Repasses).

O FNS (e a API legada da Transparência) grava o grupo em caixa alta e com o nome
longo; a tela mostra o nome curto. Os filtros recebem o nome curto, então a
comparação precisa passar sempre por aqui.
"""
from __future__ import annotations

NORM_GRUPO: dict[str, str] = {
    "ATENÇÃO PRIMÁRIA": "Atenção Primária",
    "ATENÇÃO ESPECIALIZADA": "Atenção Especializada",
    "ATENÇÃO DE MÉDIA E ALTA COMPLEXIDADE AMBULATORIAL E HOSPITALAR": "MAC — Média e Alta Complexidade",
    "ASSISTÊNCIA FARMACÊUTICA": "Assistência Farmacêutica",
    "VIGILÂNCIA EM SAÚDE": "Vigilância em Saúde",
    "GESTÃO DO SUS": "Gestão do SUS",
    "CONTRATO DE GESTÃO": "Gestão do SUS",
    "CORONAVÍRUS (COVID-19)": "Outros incentivos",
    "APOIO FINANCEIRO EXTRAORDINÁRIO": "Outros incentivos",
    "PISO SALARIAL DA ENFERMAGEM": "Piso Salarial da Enfermagem",
    "EMENDAS PARLAMENTARES": "Emendas Parlamentares",
    "INVESTIMENTOS": "Investimentos",
}


def grupo_canonico(g: str | None) -> str:
    if not g or not g.strip():
        return "Não classificado"
    return NORM_GRUPO.get(g.strip().upper(), g.strip())


def grupos_brutos(canonico: str) -> list[str]:
    """Nomes gravados pelo FNS que correspondem ao nome padronizado do filtro."""
    alvo = (canonico or "").strip()
    return [bruto for bruto, can in NORM_GRUPO.items() if can.lower() == alvo.lower()]


def grupo_confere(filtro: str | None, grupo: str | None) -> bool:
    """O filtro pode vir padronizado ("MAC — Média e Alta Complexidade") ou como trecho do nome do FNS."""
    if not filtro:
        return True
    if grupo_canonico(grupo).lower() == filtro.strip().lower():
        return True
    return filtro.strip().lower() in (grupo or "").lower()
