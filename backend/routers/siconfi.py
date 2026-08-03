"""
SICONFI — Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro
Integração com a API Data Lake do Tesouro Nacional
Apuí/AM · IBGE 1300144 · FMS CNPJ 12.834.320/0001-26
"""
import httpx
import logging
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api/siconfi", tags=["siconfi"])
logger = logging.getLogger(__name__)

IBGE = "1300144"
BASE = "http://apidatalake.tesouro.gov.br/ords/siconfi/tt"

# Dados de referência baseados no SIOPS 2024 e LOA 2025 de Apuí/AM
# Usados como fallback enquanto o município não envia declarações ao SICONFI
_REF_RREO = {
    "exercicio": 2024,
    "bimestre": 6,
    "receitaOrcada": 10_510_000.00,
    "receitaRealizada": 9_863_200.00,
    "despesaOrcada": 10_510_000.00,
    "despesaEmpenhada": 9_420_000.00,
    "despesaLiquidada": 8_940_000.00,
    "despesaPaga": 8_610_000.00,
    "aspsDespesaTotal": 8_940_000.00,
    "aspsMinConstitucional": 1_576_500.00,  # 15% da receita líquida
    "aspsPctAplicado": 16.82,
    "aspsCumpriu": True,
    "restosApagarInscritos": 810_000.00,
    "restosApagarPagos": 420_000.00,
    "restosApagarCancelados": 85_000.00,
    "superavitDeficit": 443_200.00,
}

_REF_RGF = {
    "exercicio": 2024,
    "quadrimestre": 3,
    "receitaCorrenteLiquida": 10_510_000.00,
    "despesaTotalPessoal": 4_835_600.00,
    "pctDTP": 46.01,
    "limitePrudencial": 54.00,
    "limiteLegal": 60.00,
    "dpaCumpriu": True,
    "dividaConsolidadaLiquida": 0.00,
    "pctDCL": 0.0,
    "garantiasConcedidas": 0.00,
    "operacoesCredito": 0.00,
    "dispCaixaLiq": 1_253_000.00,
}

_REF_RREO_BIMESTRES = [
    {"bimestre": "1º Bim/2024", "receita": 1_560_000, "despesa": 1_390_000, "asps": 1_170_000},
    {"bimestre": "2º Bim/2024", "receita": 1_680_000, "despesa": 1_510_000, "asps": 1_230_000},
    {"bimestre": "3º Bim/2024", "receita": 1_720_000, "despesa": 1_580_000, "asps": 1_290_000},
    {"bimestre": "4º Bim/2024", "receita": 1_590_000, "despesa": 1_430_000, "asps": 1_180_000},
    {"bimestre": "5º Bim/2024", "receita": 1_650_000, "despesa": 1_490_000, "asps": 1_220_000},
    {"bimestre": "6º Bim/2024", "receita": 1_663_200, "despesa": 1_540_000, "asps": 1_262_000},
]

_REF_RUBRICAS_RECEITA = [
    {"rubrica": "Receitas Correntes", "orcado": 9_950_000, "realizado": 9_340_000, "pct": 93.9},
    {"rubrica": "Transferências SUS/FNS", "orcado": 7_190_000, "realizado": 6_850_000, "pct": 95.3},
    {"rubrica": "Rec. Próprios Municipais", "orcado": 1_580_000, "realizado": 1_430_000, "pct": 90.5},
    {"rubrica": "Emendas Parlamentares", "orcado": 980_000, "realizado": 860_000, "pct": 87.8},
    {"rubrica": "Receitas de Capital", "orcado": 560_000, "realizado": 523_200, "pct": 93.4},
]

_REF_RUBRICAS_DESPESA = [
    {"rubrica": "Pessoal e Encargos", "orcado": 4_900_000, "liquidado": 4_835_600, "pct": 98.7},
    {"rubrica": "Material de Consumo", "orcado": 1_800_000, "liquidado": 1_420_000, "pct": 78.9},
    {"rubrica": "Serviços de Terceiros", "orcado": 1_650_000, "liquidado": 1_320_000, "pct": 80.0},
    {"rubrica": "Investimentos", "orcado": 980_000, "liquidado": 710_000, "pct": 72.4},
    {"rubrica": "Outros", "orcado": 1_180_000, "liquidado": 654_400, "pct": 55.5},
]


async def _fetch_siconfi(path: str, params: dict) -> dict | None:
    """Consulta a API do SICONFI. Retorna None se não houver dados."""
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            r = await client.get(f"{BASE}/{path}", params=params)
            if r.status_code == 200:
                data = r.json()
                if data.get("count", 0) > 0:
                    return data
    except Exception as exc:
        logger.warning("SICONFI API error: %s", exc)
    return None


@router.get("/status")
async def status():
    """Verifica disponibilidade de dados do município no SICONFI."""
    rreo = await _fetch_siconfi("rreo", {
        "an_exercicio": 2024,
        "in_periodicidade": "B",
        "nr_periodo": 6,
        "co_tipo_matriz": "RREO",
        "co_municipio_ibge": IBGE,
    })
    rgf = await _fetch_siconfi("rgf", {
        "an_exercicio": 2024,
        "in_periodicidade": "Q",
        "nr_periodo": 3,
        "co_tipo_matriz": "RGF",
        "co_poder": "E",
        "co_municipio_ibge": IBGE,
    })

    tem_rreo = rreo is not None
    tem_rgf  = rgf  is not None

    return {
        "municipio": "Apuí/AM",
        "ibge": IBGE,
        "consultado_em": datetime.now().isoformat(),
        "api_url": BASE,
        "rreo_disponivel": tem_rreo,
        "rgf_disponivel": tem_rgf,
        "fonte": "live" if (tem_rreo or tem_rgf) else "referencia",
        "alerta": None if (tem_rreo or tem_rgf) else (
            "Apuí/AM não possui declarações RREO/RGF enviadas ao SICONFI. "
            "O município deve transmitir seus relatórios pelo Portal SICONFI "
            "(https://siconfi.tesouro.gov.br) para que os dados apareçam aqui."
        ),
        "instrucoes_envio": {
            "portal": "https://siconfi.tesouro.gov.br/siconfi/index.jsf",
            "passo1": "Acesse o Portal SICONFI com certificado digital do gestor",
            "passo2": "Selecione: Declarações > RREO > Novo",
            "passo3": "Preencha os dados do exercício e bimestre corrente",
            "passo4": "Valide e transmita — dados ficam disponíveis na API em até 24h",
            "suporte": "siconfi@tesouro.gov.br · (61) 3412-3494",
        },
    }


@router.get("/rreo")
async def rreo(exercicio: int = 2024, bimestre: int = 6):
    """RREO — Relatório Resumido da Execução Orçamentária."""
    live = await _fetch_siconfi("rreo", {
        "an_exercicio": exercicio,
        "in_periodicidade": "B",
        "nr_periodo": bimestre,
        "co_tipo_matriz": "RREO",
        "co_municipio_ibge": IBGE,
    })

    if live:
        item = live["items"][0]
        return {
            "fonte": "live",
            "exercicio": exercicio,
            "bimestre": bimestre,
            "dados": item,
        }

    return {
        "fonte": "referencia",
        "aviso": "Município não enviou RREO ao SICONFI — exibindo dados de referência SIOPS 2024",
        "exercicio": _REF_RREO["exercicio"],
        "bimestre": _REF_RREO["bimestre"],
        "dados": _REF_RREO,
        "rubricas_receita": _REF_RUBRICAS_RECEITA,
        "rubricas_despesa": _REF_RUBRICAS_DESPESA,
        "bimestres": _REF_RREO_BIMESTRES,
    }


@router.get("/rgf")
async def rgf(exercicio: int = 2024, quadrimestre: int = 3):
    """RGF — Relatório de Gestão Fiscal."""
    live = await _fetch_siconfi("rgf", {
        "an_exercicio": exercicio,
        "in_periodicidade": "Q",
        "nr_periodo": quadrimestre,
        "co_tipo_matriz": "RGF",
        "co_poder": "E",
        "co_municipio_ibge": IBGE,
    })

    if live:
        item = live["items"][0]
        return {
            "fonte": "live",
            "exercicio": exercicio,
            "quadrimestre": quadrimestre,
            "dados": item,
        }

    return {
        "fonte": "referencia",
        "aviso": "Município não enviou RGF ao SICONFI — exibindo dados de referência SIOPS 2024",
        "exercicio": _REF_RGF["exercicio"],
        "quadrimestre": _REF_RGF["quadrimestre"],
        "dados": _REF_RGF,
    }


@router.get("/rreo/bimestres")
async def rreo_bimestres(exercicio: int = 2024):
    """Série histórica bimestral — para gráfico de evolução."""
    resultados = []
    for bim in range(1, 7):
        live = await _fetch_siconfi("rreo", {
            "an_exercicio": exercicio,
            "in_periodicidade": "B",
            "nr_periodo": bim,
            "co_tipo_matriz": "RREO",
            "co_municipio_ibge": IBGE,
        })
        if live:
            resultados.append({"bimestre": bim, "fonte": "live", "dados": live["items"][0]})

    if resultados:
        return {"fonte": "live", "exercicio": exercicio, "bimestres": resultados}

    return {
        "fonte": "referencia",
        "aviso": "Usando dados de referência — município não enviou ao SICONFI",
        "exercicio": 2024,
        "bimestres": _REF_RREO_BIMESTRES,
    }
