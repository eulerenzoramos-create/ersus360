"""
Calendário oficial de envio de dados ao SIAPS (Secretaria de Atenção Primária à Saúde).

Fonte: sisaps.saude.gov.br/sistemas/siaps → Materiais de Apoio → Calendário Siaps,
"Calendário Siaps para 2026" (conferido em 28/09/2026). A data limite é o 10º dia
útil do mês seguinte à competência (Portaria de Consolidação nº 1 SAPS/MS/2021).

Regra do município: o relatório do SIAPS é extraído no DIA SEGUINTE à data limite,
quando a competência já foi fechada pelo envio.
"""
from __future__ import annotations

from datetime import date, timedelta

FONTE = "https://sisaps.saude.gov.br/sistemas/siaps/ — Calendário Siaps 2026"

# (competência AAAA-MM, início, fim, data limite de envio)
CALENDARIO: list[tuple[str, date, date, date]] = [
    ("2025-12", date(2025, 12, 1), date(2025, 12, 31), date(2026, 1, 15)),
    ("2026-01", date(2026, 1, 1), date(2026, 1, 31), date(2026, 2, 13)),
    ("2026-02", date(2026, 2, 1), date(2026, 2, 28), date(2026, 3, 13)),
    ("2026-03", date(2026, 3, 1), date(2026, 3, 31), date(2026, 4, 15)),
    ("2026-04", date(2026, 4, 1), date(2026, 4, 30), date(2026, 5, 15)),
    ("2026-05", date(2026, 5, 1), date(2026, 5, 31), date(2026, 6, 16)),
    ("2026-06", date(2026, 6, 1), date(2026, 6, 30), date(2026, 7, 14)),
    ("2026-07", date(2026, 7, 1), date(2026, 7, 31), date(2026, 8, 14)),
    ("2026-08", date(2026, 8, 1), date(2026, 8, 31), date(2026, 9, 15)),
    ("2026-09", date(2026, 9, 1), date(2026, 9, 30), date(2026, 10, 15)),
    ("2026-10", date(2026, 10, 1), date(2026, 10, 31), date(2026, 11, 16)),
    ("2026-11", date(2026, 11, 1), date(2026, 11, 30), date(2026, 12, 14)),
    ("2026-12", date(2026, 12, 1), date(2026, 12, 31), date(2027, 1, 15)),
]

MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
         "agosto", "setembro", "outubro", "novembro", "dezembro"]
AVISAR_DIAS_ANTES = (7, 3, 1, 0)   # dias antes da data limite em que o alerta é gerado


def nome_competencia(comp: str) -> str:
    ano, mes = comp.split("-")
    return f"{MESES[int(mes) - 1].capitalize()}/{ano}"


def data_relatorio(limite: date) -> date:
    return limite + timedelta(days=1)


def nivel(dias: int) -> str:
    """Severidade pelo número de dias até a data limite."""
    return "critico" if dias <= 1 else "atencao" if dias <= 7 else "info"


def calendario(hoje: date) -> list[dict]:
    itens = []
    for comp, ini, fim, lim in CALENDARIO:
        rel = data_relatorio(lim)
        situacao = ("envio_encerrado" if hoje > lim else "prazo_de_envio" if hoje > fim else
                    "em_producao" if hoje >= ini else "futura")
        itens.append({"competencia": comp, "nome": nome_competencia(comp), "inicio": ini.isoformat(),
                      "fim": fim.isoformat(), "data_limite": lim.isoformat(), "data_relatorio": rel.isoformat(),
                      "dias_para_limite": (lim - hoje).days, "situacao": situacao})
    return itens


def proximo_prazo(hoje: date) -> dict | None:
    """Competência com a próxima data limite (hoje incluso)."""
    for item in calendario(hoje):
        if item["dias_para_limite"] >= 0:
            return {**item, "nivel": nivel(item["dias_para_limite"])}
    return None


def alertas_do_dia(hoje: date) -> list[dict]:
    """Alertas a gerar hoje: avisos de envio (7, 3, 1 dia e no dia) e o dia de extrair o relatório."""
    alertas = []
    for comp, _ini, _fim, lim in CALENDARIO:
        nome, dias = nome_competencia(comp), (lim - hoje).days
        if dias in AVISAR_DIAS_ANTES:
            quando = "HOJE" if dias == 0 else "amanhã" if dias == 1 else f"em {dias} dias"
            alertas.append({
                "chave": f"siaps-envio-{comp}-{dias}", "severidade": nivel(dias),
                "titulo": f"SIAPS: prazo de envio da competência {nome} termina {quando} ({lim:%d/%m/%Y})",
                "descricao": ("Conferir se toda a produção das equipes foi transmitida do e-SUS PEC ao SIAPS "
                              "até o 10º dia útil. Dado não enviado no prazo não conta para o cofinanciamento "
                              f"da APS. Fonte: {FONTE}."),
            })
        if hoje == data_relatorio(lim):
            alertas.append({
                "chave": f"siaps-relatorio-{comp}", "severidade": "atencao",
                "titulo": f"SIAPS: extrair hoje os relatórios da competência {nome}",
                "descricao": ("O prazo de envio terminou ontem. Baixar no SIAPS (Visão por Competência → "
                              "\"Baixar dados\") o CVAT eAP/eSF e os indicadores de Qualidade, inclusive a aba "
                              "eSFR, e importar em Central de Inconsistências → Relatórios do SIAPS."),
            })
    return alertas
