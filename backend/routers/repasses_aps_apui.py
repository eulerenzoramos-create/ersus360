"""
Router: /api/repasses-aps/apui — ERSUS 360
Módulo de Repasses Financeiros da APS — Apuí/AM (IBGE 130014)

REGRA ABSOLUTA: Nenhum valor fictício ou estimado é apresentado como oficial.
Cada registro indica sua fonte, data de coleta e nível de confiança.

Fontes utilizadas:
  - e-Gestor APS (relatorioaps.saude.gov.br): totais mensais e eMulti (via prints do gestor AGO/2026)
  - Portaria GM/MS nº 3.493/2024 (estrutura de componentes)
  - Portaria GM/MS nº 635/2023 (eMulti)

Situações possíveis de um dado:
  oficial_confirmado  → valor extraído/confirmado de fonte oficial identificada
  oficial_aguardando  → valor registrado pelo gestor, pendente de reconciliação automática
  nao_disponivel      → dado não obtido da fonte oficial; não usar zero como substituto
  integracao_pendente → API/scraper configurado mas ainda não executado
"""
from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/api/repasses-aps", tags=["repasses_aps"])

IBGE = "130014"
MUNICIPIO = "Apuí"
UF = "AM"
CNPJ_FMS = "12.834.320/0001-26"

# ─────────────────────────────────────────────────────────────────────────────
# DADOS CONFIRMADOS — fonte: prints do e-Gestor APS enviados pelo gestor AGO/2026
# URL de referência: relatorioaps.saude.gov.br/gerenciaaps/pagamento
# ─────────────────────────────────────────────────────────────────────────────

# Totais mensais confirmados via e-Gestor APS (tela principal de pagamento)
TOTAIS_MENSAIS = [
    {
        "competencia": "NOV/2025", "mes": "2025-11", "parcela": "1/12",
        "total_oficial": 618703.11,
        "fonte": "e-Gestor APS — Relatórios Públicos → Pagamento",
        "fonte_situacao": "oficial_confirmado",
        "coletado_em": "2026-08-18T00:00:00Z",
        "coletado_por": "Gestor FMS Apuí — print AGO/2026",
        "componentes_situacao": "nao_disponivel",
        "componentes_nota": "Detalhamento por ação não confirmado para esta competência. Consultar e-Gestor APS.",
    },
    {
        "competencia": "DEZ/2025", "mes": "2025-12", "parcela": "2/12",
        "total_oficial": 589588.00,
        "fonte": "e-Gestor APS — Relatórios Públicos → Pagamento",
        "fonte_situacao": "oficial_confirmado",
        "coletado_em": "2026-08-18T00:00:00Z",
        "coletado_por": "Gestor FMS Apuí — print AGO/2026",
        "componentes_situacao": "nao_disponivel",
        "componentes_nota": "Detalhamento por ação não confirmado para esta competência. Consultar e-Gestor APS.",
    },
    {
        "competencia": "JAN/2026", "mes": "2026-01", "parcela": "3/12",
        "total_oficial": 606004.75,
        "fonte": "e-Gestor APS — Relatórios Públicos → Pagamento",
        "fonte_situacao": "oficial_confirmado",
        "coletado_em": "2026-08-18T00:00:00Z",
        "coletado_por": "Gestor FMS Apuí — print AGO/2026",
        "componentes_situacao": "nao_disponivel",
        "componentes_nota": "Detalhamento por ação não confirmado para esta competência. Consultar e-Gestor APS.",
    },
    {
        "competencia": "FEV/2026", "mes": "2026-02", "parcela": "4/12",
        "total_oficial": 606871.75,
        "fonte": "e-Gestor APS — Relatórios Públicos → Pagamento",
        "fonte_situacao": "oficial_confirmado",
        "coletado_em": "2026-08-18T00:00:00Z",
        "coletado_por": "Gestor FMS Apuí — print AGO/2026",
        "componentes_situacao": "nao_disponivel",
        "componentes_nota": "Detalhamento por ação não confirmado para esta competência. Consultar e-Gestor APS.",
    },
    {
        "competencia": "MAR/2026", "mes": "2026-03", "parcela": "5/12",
        "total_oficial": 609710.75,
        "fonte": "e-Gestor APS — Relatórios Públicos → Pagamento",
        "fonte_situacao": "oficial_confirmado",
        "coletado_em": "2026-08-18T00:00:00Z",
        "coletado_por": "Gestor FMS Apuí — print AGO/2026",
        "componentes_situacao": "nao_disponivel",
        "componentes_nota": "Detalhamento por ação não confirmado para esta competência. Consultar e-Gestor APS.",
    },
    {
        "competencia": "ABR/2026", "mes": "2026-04", "parcela": "6/12",
        "total_oficial": 595996.75,
        "fonte": "e-Gestor APS — Relatórios Públicos → Pagamento",
        "fonte_situacao": "oficial_confirmado",
        "coletado_em": "2026-08-18T00:00:00Z",
        "coletado_por": "Gestor FMS Apuí — print AGO/2026",
        "componentes_situacao": "nao_disponivel",
        "componentes_nota": "Detalhamento por ação não confirmado para esta competência. Consultar e-Gestor APS.",
    },
    {
        "competencia": "MAI/2026", "mes": "2026-05", "parcela": "7/12",
        "total_oficial": 630371.75,
        "fonte": "e-Gestor APS — Relatórios Públicos → Pagamento",
        "fonte_situacao": "oficial_confirmado",
        "coletado_em": "2026-08-18T00:00:00Z",
        "coletado_por": "Gestor FMS Apuí — print AGO/2026",
        # Componente eMulti Remoto confirmado por print MAI/2026
        "componentes_situacao": "parcial",
        "componentes_nota": "Apenas eMulti com detalhamento confirmado. Demais ações: consultar e-Gestor APS.",
        "emulti_detalhado": {
            "custeio": 12000.00,
            "qualidade": 2250.00,
            "remoto": 2500.00,
            "total": 16750.00,
            "fonte": "e-Gestor APS — print enviado pelo gestor AGO/2026",
            "fonte_situacao": "oficial_confirmado",
        },
    },
    {
        "competencia": "JUN/2026", "mes": "2026-06", "parcela": "8/12",
        "total_oficial": 637231.75,
        "fonte": "e-Gestor APS — Relatórios Públicos → Pagamento",
        "fonte_situacao": "oficial_confirmado",
        "coletado_em": "2026-08-18T00:00:00Z",
        "coletado_por": "Gestor FMS Apuí — print AGO/2026",
        "componentes_situacao": "confirmado",
        "componentes_nota": "Detalhamento por ação confirmado via e-Gestor APS — prints AGO/2026",
        # Sub-componente eMulti com remoto=0 para JUN
        "emulti_detalhado": {
            "custeio": 12000.00,
            "qualidade": 2250.00,
            "remoto": 0.00,
            "total": 14250.00,
            "fonte": "e-Gestor APS — print enviado pelo gestor AGO/2026",
            "fonte_situacao": "oficial_confirmado",
        },
    },
]

# Detalhamento por ação de JUN/2026 — confirmado via e-Gestor APS
COMPONENTES_JUN2026 = [
    {
        "acao": "eSF e eAP",
        "descricao": "Equipes de Saúde da Família e Equipes de Atenção Primária",
        "portaria": "Port. GM/MS nº 3.493/2024",
        "valor_custeio": 227826.00,
        "valor_implantacao": 0.00,
        "valor_total": 227826.00,
        "fonte_situacao": "oficial_confirmado",
        "fonte": "e-Gestor APS — total da ação confirmado via print AGO/2026",
        "coletado_em": "2026-08-18T00:00:00Z",
        "sub_componentes": [
            {
                "item": "Custeio eSF/eAP (equipes homologadas)",
                "valor": None,
                "situacao": "nao_disponivel",
                "nota": "Detalhamento por equipe/INE/CNES não confirmado. Consultar e-Gestor APS.",
            },
            {
                "item": "Componente de Qualidade eSF/eAP",
                "valor": None,
                "situacao": "nao_disponivel",
                "nota": "Valor não confirmado individualmente. Consultar e-Gestor APS.",
            },
        ],
        "inconsistencias": [],
    },
    {
        "acao": "Atenção à Saúde Bucal",
        "descricao": "Equipes de Saúde Bucal (eSB) e componentes",
        "portaria": "Port. GM/MS nº 3.493/2024",
        "valor_custeio": 104799.00,
        "valor_implantacao": 0.00,
        "valor_total": 104799.00,
        "fonte_situacao": "oficial_confirmado",
        "fonte": "e-Gestor APS — total da ação confirmado via print AGO/2026",
        "coletado_em": "2026-08-18T00:00:00Z",
        "sub_componentes": [
            {
                "item": "Custeio eSB 40h (equipes homologadas)",
                "valor": None,
                "situacao": "nao_disponivel",
                "nota": "Valor custeio base não confirmado individualmente. Consultar e-Gestor APS.",
            },
            {
                "item": "Componente de Qualidade eSB 40h",
                "valor": 30000.00,
                "situacao": "oficial_confirmado",
                "fonte": "e-Gestor APS — print enviado pelo gestor AGO/2026 (tela: eSB 40h / Comp. Qualidade / JUN/2026 / 8/12)",
                "coletado_em": "2026-08-18T00:00:00Z",
                "nota": "R$ 30.000,00 confirmado. O sistema anterior apresentava R$ 17.400,00 — valor corrigido.",
            },
            {
                "item": "eSB modalidade carga horária diferenciada",
                "valor": None,
                "situacao": "nao_disponivel",
                "nota": "Verificar existência e valor no e-Gestor APS.",
            },
        ],
        "inconsistencias": [
            {
                "codigo": "INC-ESB-001",
                "descricao": "Sistema ERSUS anterior apresentava Comp. Qualidade eSB 40h = R$ 17.400,00. "
                             "Valor real confirmado no e-Gestor APS: R$ 30.000,00. Diferença: R$ 12.600,00.",
                "gravidade": "alta",
                "corrigido": True,
                "corrigido_em": "2026-08-18",
            },
        ],
    },
    {
        "acao": "eMulti",
        "descricao": "Equipes Multiprofissionais na APS",
        "portaria": "Port. GM/MS nº 635/2023 + Port. GM/MS nº 3.493/2024",
        "valor_custeio": 14250.00,
        "valor_implantacao": 0.00,
        "valor_total": 14250.00,
        "fonte_situacao": "oficial_confirmado",
        "fonte": "e-Gestor APS — prints enviados pelo gestor AGO/2026 (3 telas: custeio, qualidade, remoto)",
        "coletado_em": "2026-08-18T00:00:00Z",
        "sub_componentes": [
            {
                "item": "Custeio eMulti",
                "valor": 12000.00,
                "situacao": "oficial_confirmado",
                "fonte": "e-Gestor APS — tela Custeio eMulti JUN/2026 8/12",
                "indicadores_egestor": {
                    "equipes_credenciadas": 1,
                    "equipes_homologadas": 1,
                    "equipes_pagas": 1,
                    "implantacao": 0.00,
                    "pagamento": 12000.00,
                    "ajuste": 0.00,
                    "desconto": 0.00,
                    "total": 12000.00,
                },
            },
            {
                "item": "Componente de Qualidade eMulti",
                "valor": 2250.00,
                "situacao": "oficial_confirmado",
                "fonte": "e-Gestor APS — tela Qualidade eMulti JUN/2026 8/12",
                "indicadores_egestor": {
                    "pagamento": 2250.00,
                    "ajuste": 0.00,
                    "desconto": 0.00,
                    "total": 2250.00,
                },
            },
            {
                "item": "Atendimento Remoto TIC — eMulti",
                "valor": 0.00,
                "valor_referencia": 12000.00,
                "situacao": "oficial_confirmado",
                "status_pagamento": "nao_pago",
                "fonte": "e-Gestor APS — tela Atendimento Remoto eMulti JUN/2026 8/12",
                "indicadores_egestor": {
                    "equipes_adesao_remoto_tic": 1,
                    "equipes_atendimento_remoto_pagas": 0,
                    "pagamento": 0.00,
                    "ajuste": 0.00,
                    "desconto": 0.00,
                    "total": 0.00,
                },
                "alerta": "R$ 12.000,00/mês bloqueado — 'Qtd equipes c/ atendimento remoto pagas = 0'. "
                          "Causa: ausência de produção com modalidade Remoto no e-SUS PEC transmitida ao SISAB.",
            },
        ],
        "inconsistencias": [
            {
                "codigo": "INC-001",
                "tipo": "producao_esus",
                "gravidade": "critica",
                "titulo": "Atendimento Remoto eMulti não pago — JAN a AGO/2026 (exceto MAI/2026)",
                "descricao": "Equipe aderiu ao TIC, está homologada e credenciada. "
                             "O e-Gestor confirma 0 equipes pagas no Atendimento Remoto. "
                             "Causa identificada: sem produção registrada com modalidade Remoto no e-SUS PEC.",
                "impacto_financeiro_mensal": 12000.00,
                "portaria": "Art. 6º, I — Port. GM/MS nº 635/2023",
                "acao_corretiva": "Registrar atendimentos individuais com modalidade 'Remoto' no e-SUS PEC e transmitir ao SISAB.",
                "prazo_recomendado": "2026-09-01",
                "responsavel": "Coordenador da eMulti / Profissionais da equipe",
            },
        ],
    },
    {
        "acao": "Agentes Comunitários de Saúde",
        "descricao": "ACS vinculados às equipes de Saúde da Família",
        "portaria": "Port. GM/MS nº 3.493/2024",
        "valor_custeio": 213972.00,
        "valor_implantacao": 0.00,
        "valor_total": 213972.00,
        "fonte_situacao": "oficial_confirmado",
        "fonte": "e-Gestor APS — total da ação confirmado via print AGO/2026",
        "coletado_em": "2026-08-18T00:00:00Z",
        "sub_componentes": [
            {
                "item": "Incentivo financeiro ACS (AFC + IFP)",
                "valor": None,
                "situacao": "nao_disponivel",
                "nota": "Detalhamento por ACS/INE/CNES não confirmado. Consultar e-Gestor APS.",
            },
            {
                "item": "Componente de Qualidade ACS",
                "valor": None,
                "situacao": "nao_disponivel",
                "nota": "Valor não confirmado individualmente. Consultar e-Gestor APS.",
            },
        ],
        "inconsistencias": [],
    },
    {
        "acao": "Demais programas, serviços e equipes da APS",
        "descricao": "Outros incentivos APS habilitados no município",
        "portaria": "Port. GM/MS nº 3.493/2024 — Anexo IV",
        "valor_custeio": 65585.00,
        "valor_implantacao": 0.00,
        "valor_total": 65585.00,
        "fonte_situacao": "oficial_confirmado",
        "fonte": "e-Gestor APS — total da ação confirmado via print AGO/2026",
        "coletado_em": "2026-08-18T00:00:00Z",
        "sub_componentes": [
            {
                "item": "Programas e serviços habilitados (detalhamento pendente)",
                "valor": None,
                "situacao": "nao_disponivel",
                "nota": "Composição interna não confirmada. Verificar cada programa habilitado no e-Gestor APS.",
            },
        ],
        "inconsistencias": [],
    },
    {
        "acao": "Componente per capita de base populacional",
        "descricao": "Incentivo baseado na população cadastrada nas equipes",
        "portaria": "Port. GM/MS nº 3.493/2024 — Art. 8º",
        "valor_custeio": 10799.75,
        "valor_implantacao": 0.00,
        "valor_total": 10799.75,
        "fonte_situacao": "oficial_confirmado",
        "fonte": "e-Gestor APS — total da ação confirmado via print AGO/2026",
        "coletado_em": "2026-08-18T00:00:00Z",
        "sub_componentes": [
            {
                "item": "Per capita (população e valor unitário)",
                "valor": None,
                "situacao": "nao_disponivel",
                "nota": "População cadastrada e valor unitário não confirmados individualmente. Consultar e-Gestor APS.",
            },
        ],
        "inconsistencias": [],
    },
    {
        "acao": "Promoção à Saúde",
        "descricao": "Incentivo de promoção à saúde (Academia da Saúde, etc.)",
        "portaria": "Port. GM/MS nº 3.493/2024 — Anexo V",
        "valor_custeio": 0.00,
        "valor_implantacao": 0.00,
        "valor_total": 0.00,
        "fonte_situacao": "oficial_confirmado",
        "fonte": "e-Gestor APS — total = R$ 0,00 confirmado via print AGO/2026",
        "coletado_em": "2026-08-18T00:00:00Z",
        "sub_componentes": [],
        "inconsistencias": [],
        "nota": "R$ 0,00 oficial — município não recebeu este incentivo em JUN/2026.",
    },
]


def _conciliacao_jun2026():
    soma = sum(c["valor_total"] for c in COMPONENTES_JUN2026)
    total = 637231.75
    diferenca = round(total - soma, 2)
    return {
        "total_oficial": total,
        "soma_componentes": round(soma, 2),
        "diferenca": diferenca,
        "conciliado": abs(diferenca) < 0.01,
        "status": "OK" if abs(diferenca) < 0.01 else "DIVERGENCIA",
    }


def _historico_emulti():
    """Histórico eMulti por competência — dado onde confirmado, nao_disponivel onde não."""
    return [
        {"competencia": "Jan/2026", "mes": "2026-01", "parcela": "3/12",
         "custeio": None, "qualidade": None, "remoto": None, "total": None,
         "situacao": "nao_disponivel",
         "nota": "Detalhamento eMulti não confirmado para esta competência."},
        {"competencia": "Fev/2026", "mes": "2026-02", "parcela": "4/12",
         "custeio": None, "qualidade": None, "remoto": None, "total": None,
         "situacao": "nao_disponivel",
         "nota": "Detalhamento eMulti não confirmado para esta competência."},
        {"competencia": "Mar/2026", "mes": "2026-03", "parcela": "5/12",
         "custeio": None, "qualidade": None, "remoto": None, "total": None,
         "situacao": "nao_disponivel",
         "nota": "Detalhamento eMulti não confirmado para esta competência."},
        {"competencia": "Abr/2026", "mes": "2026-04", "parcela": "6/12",
         "custeio": None, "qualidade": None, "remoto": None, "total": None,
         "situacao": "nao_disponivel",
         "nota": "Detalhamento eMulti não confirmado para esta competência."},
        {"competencia": "Mai/2026", "mes": "2026-05", "parcela": "7/12",
         "custeio": 12000.00, "qualidade": 2250.00, "remoto": 2500.00, "total": 16750.00,
         "situacao": "oficial_confirmado",
         "fonte": "e-Gestor APS — print Atendimento Remoto eMulti MAI/2026 enviado pelo gestor AGO/2026"},
        {"competencia": "Jun/2026", "mes": "2026-06", "parcela": "8/12",
         "custeio": 12000.00, "qualidade": 2250.00, "remoto": 0.00, "total": 14250.00,
         "situacao": "oficial_confirmado",
         "fonte": "e-Gestor APS — prints custeio/qualidade/remoto eMulti JUN/2026 enviados pelo gestor AGO/2026"},
    ]


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/competencias")
async def listar_competencias(
    ano: Optional[int] = Query(None, description="Filtrar por ano (ex: 2026)"),
):
    """Lista todas as competências com totais oficiais e status de detalhamento."""
    dados = TOTAIS_MENSAIS
    if ano:
        dados = [m for m in dados if m["mes"].startswith(str(ano))]

    total_jan_jun_2026 = sum(
        m["total_oficial"] for m in TOTAIS_MENSAIS
        if m["mes"].startswith("2026-0") and m["mes"] <= "2026-06"
    )

    conciliacao = _conciliacao_jun2026()

    return {
        "municipio": MUNICIPIO,
        "uf": UF,
        "ibge": IBGE,
        "cnpj_fms": CNPJ_FMS,
        "fonte_primaria": "e-Gestor APS — relatorioaps.saude.gov.br/gerenciaaps/pagamento",
        "metodo_coleta": "Prints do portal enviados pelo gestor FMS Apuí em AGO/2026",
        "ultima_atualizacao": "2026-08-18T00:00:00Z",
        "competencias": dados,
        "resumo": {
            "total_competencias": len(dados),
            "total_jan_jun_2026": total_jan_jun_2026,
            "total_jan_jun_2026_esperado": 3686187.50,
            "conciliacao_jan_jun_2026": {
                "status": "OK" if abs(total_jan_jun_2026 - 3686187.50) < 0.01 else "DIVERGENCIA",
                "diferenca": round(total_jan_jun_2026 - 3686187.50, 2),
            },
            "conciliacao_jun2026": conciliacao,
        },
        "nota_integridade": (
            "Todos os totais mensais são extraídos de prints oficiais do e-Gestor APS. "
            "Detalhamentos por ação somente estão confirmados para JUN/2026. "
            "Competências anteriores requerem consulta adicional ao e-Gestor APS. "
            "Nenhum valor foi simulado, estimado ou gerado artificialmente."
        ),
    }


@router.get("/competencias/{competencia_mes}")
async def detalhe_competencia(competencia_mes: str):
    """
    Retorna detalhamento completo de uma competência.
    competencia_mes: formato YYYY-MM (ex: 2026-06)
    """
    mes = next((m for m in TOTAIS_MENSAIS if m["mes"] == competencia_mes), None)
    if not mes:
        return {
            "situacao": "competencia_nao_encontrada",
            "competencia_solicitada": competencia_mes,
            "competencias_disponiveis": [m["mes"] for m in TOTAIS_MENSAIS],
        }

    if competencia_mes == "2026-06":
        conciliacao = _conciliacao_jun2026()
        return {
            "municipio": MUNICIPIO, "uf": UF, "ibge": IBGE,
            "competencia": mes["competencia"],
            "mes": mes["mes"],
            "parcela": mes["parcela"],
            "total_oficial": mes["total_oficial"],
            "fonte": mes["fonte"],
            "fonte_situacao": mes["fonte_situacao"],
            "coletado_em": mes["coletado_em"],
            "componentes_situacao": mes["componentes_situacao"],
            "acoes": COMPONENTES_JUN2026,
            "conciliacao": conciliacao,
            "alerta_remoto_emulti": (
                "eMulti — Atendimento Remoto: R$ 0,00 pago em JUN/2026. "
                "R$ 12.000,00 bloqueado por falta de produção remota no e-SUS PEC. "
                "Em MAI/2026, R$ 2.500,00 foi recebido. Demais meses: confirmar no e-Gestor APS."
            ),
        }

    # Para outras competências: total confirmado, componentes não disponíveis
    return {
        "municipio": MUNICIPIO, "uf": UF, "ibge": IBGE,
        "competencia": mes["competencia"],
        "mes": mes["mes"],
        "parcela": mes["parcela"],
        "total_oficial": mes["total_oficial"],
        "fonte": mes["fonte"],
        "fonte_situacao": mes["fonte_situacao"],
        "coletado_em": mes["coletado_em"],
        "componentes_situacao": mes.get("componentes_situacao", "nao_disponivel"),
        "componentes_nota": mes.get("componentes_nota"),
        "acoes": None,
        "mensagem": (
            "Detalhamento por ação não confirmado para esta competência. "
            "Consultar e-Gestor APS em: relatorioaps.saude.gov.br/gerenciaaps/pagamento. "
            "Selecionar município Apuí/AM (IBGE 130014) e competência correspondente."
        ),
        "emulti_detalhado": mes.get("emulti_detalhado"),
    }


@router.get("/historico-emulti")
async def historico_emulti():
    """Histórico do incentivo eMulti por competência — dados confirmados e pendentes."""
    h = _historico_emulti()
    confirmados = [x for x in h if x["situacao"] == "oficial_confirmado"]
    total_remoto_confirmado = sum(
        x["remoto"] for x in confirmados if x["remoto"] is not None
    )
    total_perdido_confirmado = sum(
        12000.0 - x["remoto"] for x in confirmados if x["remoto"] is not None
    )
    return {
        "municipio": MUNICIPIO,
        "componente": "eMulti — Atendimento Remoto TIC",
        "portaria": "Port. GM/MS nº 635/2023",
        "valor_mensal_referencia": 12000.00,
        "historico": h,
        "resumo_confirmado": {
            "competencias_com_dado": len(confirmados),
            "competencias_sem_dado": len(h) - len(confirmados),
            "total_remoto_recebido_confirmado": total_remoto_confirmado,
            "total_remoto_nao_recebido_confirmado": total_perdido_confirmado,
            "nota": "Apenas MAI e JUN/2026 têm dados confirmados. "
                    "Para demais meses, consultar e-Gestor APS.",
        },
    }


@router.get("/inconsistencias")
async def listar_inconsistencias():
    """Lista todas as inconsistências financeiras identificadas."""
    inconsistencias = []
    for comp in COMPONENTES_JUN2026:
        for inc in comp.get("inconsistencias", []):
            inconsistencias.append({
                "acao": comp["acao"],
                **inc,
            })

    # Inconsistência global: Remoto eMulti
    inconsistencias.append({
        "acao": "eMulti",
        "codigo": "INC-GLOBAL-001",
        "tipo": "perda_financeira_acumulada",
        "gravidade": "critica",
        "titulo": "Perda acumulada Atendimento Remoto eMulti — competências com dado incompleto",
        "descricao": (
            "Valor de R$ 12.000,00/mês (Atendimento Remoto TIC) confirmado como não pago em JUN/2026 "
            "e parcialmente pago em MAI/2026 (R$ 2.500,00). "
            "Demais meses JAN-ABR/2026 sem dado confirmado — valor em risco não pode ser calculado com precisão. "
            "Consultar e-Gestor APS para confirmar valores de cada competência."
        ),
        "valor_mensal_risco": 12000.00,
        "impacto_confirmado_jun": 12000.00,
        "impacto_confirmado_mai": 9500.00,
        "total_impacto_confirmado": 21500.00,
        "acao_corretiva": (
            "1. Verificar e-Gestor APS para cada mês JAN-ABR/2026; "
            "2. Registrar produção remota no e-SUS PEC com modalidade 'Remoto'; "
            "3. Transmitir ao SISAB; "
            "4. Acompanhar normalização no próximo processamento."
        ),
        "responsavel": "Coordenador eMulti + TI e-SUS PEC",
        "prazo": "2026-09-01",
    })

    return {
        "municipio": MUNICIPIO,
        "total": len(inconsistencias),
        "criticas": sum(1 for i in inconsistencias if i.get("gravidade") == "critica"),
        "altas": sum(1 for i in inconsistencias if i.get("gravidade") == "alta"),
        "inconsistencias": inconsistencias,
        "nota": (
            "Inconsistências identificadas com base nos dados confirmados. "
            "Outras possíveis inconsistências podem existir nas competências sem detalhamento confirmado."
        ),
    }


@router.get("/resumo-executivo")
async def resumo_executivo():
    """Painel executivo: totais, variações, alertas e status."""
    totais_2026 = [m for m in TOTAIS_MENSAIS if m["mes"].startswith("2026")]
    total_acumulado = sum(m["total_oficial"] for m in totais_2026)
    maior = max(totais_2026, key=lambda m: m["total_oficial"])
    menor = min(totais_2026, key=lambda m: m["total_oficial"])

    return {
        "municipio": MUNICIPIO, "uf": UF, "ibge": IBGE,
        "referencia": "JAN–JUN/2026 (dados confirmados e-Gestor APS)",
        "cards": {
            "total_acumulado_2026": {
                "valor": total_acumulado,
                "descricao": "Total acumulado JAN–JUN/2026",
                "fonte_situacao": "oficial_confirmado",
            },
            "media_mensal_2026": {
                "valor": round(total_acumulado / len(totais_2026), 2) if totais_2026 else None,
                "descricao": "Média mensal JAN–JUN/2026",
                "fonte_situacao": "calculado",
            },
            "maior_repasse_2026": {
                "competencia": maior["competencia"],
                "valor": maior["total_oficial"],
                "fonte_situacao": "oficial_confirmado",
            },
            "menor_repasse_2026": {
                "competencia": menor["competencia"],
                "valor": menor["total_oficial"],
                "fonte_situacao": "oficial_confirmado",
            },
            "perda_remoto_emulti_confirmada": {
                "valor": 21500.00,
                "descricao": "Perda confirmada Atendimento Remoto eMulti (JUN + MAI/2026)",
                "nota": "Demais meses pendentes de confirmação no e-Gestor APS.",
                "fonte_situacao": "oficial_confirmado",
            },
        },
        "alertas_criticos": [
            {
                "nivel": "critico",
                "acao": "eMulti",
                "titulo": "Atendimento Remoto TIC não pago",
                "valor": 12000.00,
                "competencia_confirmada": "JUN/2026",
                "providencia": "Registrar produção remota no e-SUS PEC com modalidade Remoto e transmitir ao SISAB.",
            },
            {
                "nivel": "alto",
                "acao": "eSB 40h — Qualidade",
                "titulo": "Dado corrigido: R$ 17.400 → R$ 30.000 (JUN/2026)",
                "valor": 30000.00,
                "competencia_confirmada": "JUN/2026",
                "providencia": "Versões anteriores do sistema apresentavam valor incorreto. Dado agora corrigido.",
            },
        ],
        "dados_pendentes": [
            "Detalhamento por ação para NOV/2025–MAI/2026",
            "Breakdowns por equipe/INE/CNES para todas as ações em JUN/2026",
            "Quantidade e valores individuais dos ACS financiados",
            "Composição dos 'Demais programas' (R$ 65.585,00 em JUN/2026)",
            "Valores históricos eMulti para JAN–ABR/2026",
            "Dados de JUL e AGO/2026 (competências em processamento)",
        ],
        "como_obter_pendentes": (
            "Acessar e-Gestor APS em relatorioaps.saude.gov.br/gerenciaaps/pagamento. "
            "Selecionar município Apuí/AM (IBGE 130014). "
            "Navegar em cada ação e competência. "
            "Usar 'Ver detalhes' em cada linha. "
            "Encaminhar prints para atualização no ERSUS360."
        ),
        "ultima_atualizacao": "2026-08-18T00:00:00Z",
        "metodo": "Prints do e-Gestor APS fornecidos pelo gestor FMS Apuí",
    }


@router.get("/validacao-conciliacao")
async def validacao_conciliacao():
    """Valida automaticamente se soma dos componentes bate com total oficial."""
    conc = _conciliacao_jun2026()
    return {
        "competencia": "JUN/2026",
        "validacao": conc,
        "detalhamento": [
            {
                "acao": c["acao"],
                "valor": c["valor_total"],
                "fonte_situacao": c["fonte_situacao"],
            }
            for c in COMPONENTES_JUN2026
        ],
        "nota": (
            "A conciliação está correta: soma dos componentes = total oficial do e-Gestor APS. "
            "Para demais competências, detalhamento não disponível para conciliação."
        ) if conc["conciliado"] else (
            "DIVERGENCIA DETECTADA: a soma dos componentes não corresponde ao total oficial. "
            "Verificar dados de entrada."
        ),
    }
