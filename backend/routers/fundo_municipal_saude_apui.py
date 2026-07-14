from __future__ import annotations
from datetime import date as _date
from fastapi import APIRouter
from services import siops_service

router = APIRouter(prefix="/api/fundo-municipal-saude-apui", tags=["fundo_municipal_saude_apui"])

_DASHBOARD = {
    "ano_referencia": 2025,
    "receita_total_prevista_R": 28400000,
    "receita_total_executada_R": 18200000,
    "execucao_pct": 64.1,
    "transferencias_federais_R": 12400000,
    "transferencias_estaduais_R": 2800000,
    "recursos_proprios_municipio_R": 3000000,
    "asps_percentual_pct": 22.4,
    "meta_asps_pct": 15.0,
    "asps_status": "ok",
    "emendas_parlamentares_R": 1840000,
    "emendas_executadas_pct": 48.4,
    "blocos_custeio_R": 14200000,
    "blocos_investimento_R": 4200000,
    "blocos_investimento_executado_pct": 42.4,
    "subfuncao_atencao_basica_R": 8400000,
    "subfuncao_hospitalar_ambulatorial_R": 6200000,
    "subfuncao_vigilancia_R": 1400000,
    "gasto_per_capita_R": 736,
    "media_brasil_per_capita_R": 1124,
    "inadimplencia_prestacao_contas": False,
    "auditoria_ultima": "2024",
    "status_execucao": "atencao",
    "status_investimento": "critico",
    "status_emendas": "atencao",
}

_RECEITAS = [
    {"fonte": "PAB Fixo (MAC)",                 "valor_R": 4200000, "executado_pct": 84.2, "status": "ok",      "observacao": "Piso de Atenção Básica transferido mensalmente via Fundo a Fundo. Redução relativa por baixa produção APS (absenteísmo 28,4%). Previne Brasil: 3 indicadores abaixo da meta = desconto no próximo quadrimestre"},
    {"fonte": "MAC (Média/Alta Complexidade)",   "valor_R": 3800000, "executado_pct": 78.4, "status": "atencao","observacao": "MAC subutilizado — Apuí não tem especialidades para faturar procedimentos de média complexidade. 32,4% das internações transferidas para Humaitá/Manaus = MAC perdido para outro município"},
    {"fonte": "Vigilância em Saúde",             "valor_R": 1400000, "executado_pct": 92.4, "status": "ok",      "observacao": "Bloco bem executado. Inclui PNAB vigilância, PNCT, Malária (alto endemismo) e Dengue (surto 2025). Agentes de endemias: 2 (meta 12) — subexecução por incapacidade de contratar"},
    {"fonte": "Rede de Atenção Psicossocial",    "valor_R": 480000,  "executado_pct": 64.2, "status": "atencao","observacao": "CAPS I sem CAPS AD credenciado = recurso RAPS não reivindicado. Zero CAPS AD = zero incentivo federal CAPS AD. Transferência federal para RAPS depende de serviços credenciados: Apuí perde R$ 280k/ano por não ter CAPS AD"},
    {"fonte": "Emendas Parlamentares",           "valor_R": 1840000, "executado_pct": 48.4, "status": "atencao","observacao": "48,4% de execução — objeto de auditoria. Emendas para equipamentos: 3 licitações desertas por falta de fornecedor no prazo. Equipamentos de saúde em Apuí: frete amazônico + prazo de entrega 90-180 dias inviabiliza licitação padrão"},
    {"fonte": "Transferências Estaduais (SES-AM)","valor_R": 2800000, "executado_pct": 72.4, "status": "atencao","observacao": "SES-AM transfere mediante convênios com contrapartida municipal. 3 convênios com prestação de contas atrasada bloquearam R$ 480k em 2025. Técnico de prestação de contas: 1 servidor acumulando função"},
    {"fonte": "Recursos Próprios (ASPS)",        "valor_R": 3000000, "executado_pct": 84.2, "status": "ok",      "observacao": "ASPS 22,4% — acima do mínimo constitucional de 15%. Porém: recursos próprios insuficientes para cofinanciar rede hospitalar. Município de pequeno porte com base tributária limitada: IPTU + ISS = R$ 3,2M/ano total arrecadado"},
]

_DESPESAS_MENSAIS = [
    {"mes": "Jan", "custeio": 1180000, "investimento": 240000, "pessoal": 780000, "total": 2200000},
    {"mes": "Fev", "custeio": 1080000, "investimento": 120000, "pessoal": 780000, "total": 1980000},
    {"mes": "Mar", "custeio": 1240000, "investimento": 480000, "pessoal": 780000, "total": 2500000},
    {"mes": "Abr", "custeio": 1160000, "investimento": 280000, "pessoal": 780000, "total": 2220000},
    {"mes": "Mai", "custeio": 1280000, "investimento": 320000, "pessoal": 780000, "total": 2380000},
    {"mes": "Jun", "custeio": 1120000, "investimento": 180000, "pessoal": 780000, "total": 2080000},
    {"mes": "Jul", "custeio": 1340000, "investimento": 240000, "pessoal": 780000, "total": 2360000},
    {"mes": "Ago", "custeio": 1200000, "investimento": 280000, "pessoal": 780000, "total": 2260000},
    {"mes": "Set", "custeio": 1160000, "investimento": 360000, "pessoal": 780000, "total": 2300000},
    {"mes": "Out", "custeio": 1220000, "investimento": 400000, "pessoal": 780000, "total": 2400000},
    {"mes": "Nov", "custeio": 1180000, "investimento": 180000, "pessoal": 780000, "total": 2140000},
    {"mes": "Dez", "custeio": 1040000, "investimento": 120000, "pessoal": 780000, "total": 1940000},
]

_HISTORICO = [
    {"ano": "2022", "receita_R": 22400000, "execucao_pct": 72.4, "per_capita_R": 618, "asps_pct": 19.8, "emendas_exec_pct": 38.4},
    {"ano": "2023", "receita_R": 24800000, "execucao_pct": 68.4, "per_capita_R": 668, "asps_pct": 20.4, "emendas_exec_pct": 42.4},
    {"ano": "2024", "receita_R": 26400000, "execucao_pct": 66.4, "per_capita_R": 704, "asps_pct": 21.4, "emendas_exec_pct": 44.8},
    {"ano": "2025", "receita_R": 28400000, "execucao_pct": 64.1, "per_capita_R": 736, "asps_pct": 22.4, "emendas_exec_pct": 48.4},
]

_INDICADORES = [
    {"indicador": "Execução orçamentária FMS",             "valor": 64.1,  "meta": 95.0,  "unidade": "%",          "status": "atencao", "observacao": "35,9% da LOA não executada — R$ 10,2M em dotações não gastos ao final do exercício. Principal causa: dificuldade de contratação de RH especializado (médicos, fisioterapeutas) e licitações desertas para equipamentos. Recursos devolvidos à União quando não executados no prazo"},
    {"indicador": "Gasto per capita em saúde",             "valor": 736,   "meta": 1124,  "unidade": "R$/hab",     "status": "atencao", "observacao": "34,6% abaixo da média nacional. Municípios com isolamento amazônico têm custo 40-80% maior por serviço do que a média — Apuí executa menos com custos maiores. Frete de medicamentos de Manaus: +28% sobre o custo padrão"},
    {"indicador": "Emendas parlamentares executadas",       "valor": 48.4,  "meta": 90.0,  "unidade": "%",          "status": "atencao", "observacao": "R$ 948k em emendas não executadas — risco de devolução e bloqueio de novas emendas. Licitações para equipamentos com 3 iterações desertas: especificação técnica rígida + logística amazônica + prazo curto = nenhum fornecedor propõe. Solução: pregão com critério de logística amazônica"},
    {"indicador": "Execução bloco investimento",           "valor": 42.4,  "meta": 90.0,  "unidade": "%",          "status": "critico", "observacao": "57,6% do bloco de investimento não executado. Obras: 2 UBS rurais com projeto aprovado, licitação não realizada (2 anos paradas). Equipamentos: 4 lotes com pregão não homologado. Investimento não realizado = rede sem expansão + demanda crescente não atendida"},
    {"indicador": "ASPS — Aplicação em saúde (SIOPS)",    "valor": 22.4,  "meta": 15.0,  "unidade": "%",          "status": "ok",      "observacao": "ASPS acima do mínimo constitucional — cumprimento formal. Porém: 78,6% do gasto próprio vai para custeio de pessoal, restando 21,4% para insumos e serviços. Cumprimento do mínimo não garante qualidade de gasto: distribuição entre custeio/investimento/pessoal revela fragilidade estrutural"},
]


@router.get("/dashboard")
async def dashboard():
    ano = _date.today().year
    siops = await siops_service.buscar_apuracao(ano)
    proprio_pct = float(siops.get("minimo_constitucional_pct_aplicado") or 22.4)
    gasto_proprio = float(siops.get("gastoProprioSaude") or 0) or _DASHBOARD["recursos_proprios_municipio_R"]
    receita = float(siops.get("receitaImpostos") or 0) or _DASHBOARD["receita_total_prevista_R"]
    return {
        **_DASHBOARD,
        "asps_percentual_pct": proprio_pct,
        "asps_status": "ok" if proprio_pct >= 15.0 else "critico",
        "recursos_proprios_municipio_R": int(gasto_proprio) if gasto_proprio > 0 else _DASHBOARD["recursos_proprios_municipio_R"],
        "receita_total_prevista_R": int(receita) if receita > 0 else _DASHBOARD["receita_total_prevista_R"],
        "fonte_siops": siops.get("fonte", "referencia"),
    }


@router.get("/receitas")
def receitas():
    return _RECEITAS


@router.get("/despesas-mensais")
def despesas_mensais():
    return _DESPESAS_MENSAIS


@router.get("/historico")
def historico():
    return _HISTORICO


@router.get("/indicadores")
def indicadores():
    return _INDICADORES
