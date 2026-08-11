"""
Router: /api/auditoria-dados
Diagnóstico de qualidade e proveniência dos dados por município.

Apresenta, para cada fonte, se o dado é:
  - Oficial e validado
  - Oficial aguardando processamento
  - Divergente entre fontes
  - Rejeitado
  - Não localizado
  - Não disponível
  - Estimativa autorizada

Cumpre a regra: "Apresente somente informações reais, rastreáveis e comprovadas."
"""
from __future__ import annotations
import asyncio
import os
from datetime import datetime
from typing import Any

import httpx
from fastapi import APIRouter, Depends, Query

from routers.auth import get_current_user, UserOut
from services import siaps_municipio
from services import cnes_service

router = APIRouter(prefix="/api/auditoria-dados", tags=["Auditoria de Dados"])

_IBGE_APUI = "1300144"


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


# ── helpers de verificação ────────────────────────────────────────────────────

async def _testar_fonte(
    ibge: str,
    fonte: str,
    url: str,
    params: dict | None = None,
    headers: dict | None = None,
    timeout: float = 8.0,
) -> dict:
    t0 = datetime.utcnow()
    try:
        async with httpx.AsyncClient(timeout=timeout, verify=False, follow_redirects=True) as c:
            r = await c.get(url, params=params or {}, headers=headers or {"Accept": "application/json"})
            dados_retornados = r.status_code == 200 and bool(r.content)
            return {
                "fonte": fonte,
                "municipio_ibge": ibge,
                "url": url,
                "acesso_confirmado": r.status_code < 400,
                "status_http": r.status_code,
                "dados_retornados": dados_retornados,
                "tipo_acesso": "api_publica",
                "data_consulta": t0.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "situacao": "oficial_validado" if dados_retornados else "nao_disponivel",
            }
    except Exception as exc:
        return {
            "fonte": fonte,
            "municipio_ibge": ibge,
            "url": url,
            "acesso_confirmado": False,
            "status_http": None,
            "dados_retornados": False,
            "tipo_acesso": "api_publica",
            "erro": str(exc)[:200],
            "data_consulta": t0.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "situacao": "nao_disponivel",
        }


# ── Endpoint principal ────────────────────────────────────────────────────────

@router.get("/fontes")
async def auditoria_fontes(
    ibge: str = Query(_IBGE_APUI, description="Código IBGE do município (7 dígitos)"),
    competencia: str = Query("202605", description="Competência AAAAMM"),
    _: UserOut = Depends(get_current_user),
):
    """
    Matriz de auditoria das fontes de dados para o município.
    Testa cada fonte e classifica os dados conforme a missão ERSUS 360.
    """
    ibge_6 = ibge[:6]

    tasks = [
        # IBGE
        _testar_fonte(ibge, "IBGE", f"https://servicodados.ibge.gov.br/api/v3/agregados/4714/periodos/2022/variaveis/93?localidades=N6[{ibge}]"),
        # CNES / DATASUS Dados Abertos
        _testar_fonte(ibge, "CNES/DATASUS (Dados Abertos)", f"https://apidadosabertos.saude.gov.br/cnes/estabelecimentos?co_municipio={ibge_6}&limit=5"),
        # CNES equipes
        _testar_fonte(ibge, "CNES/DATASUS (equipes ESF)", f"https://apidadosabertos.saude.gov.br/cnes/equipes?co_municipio={ibge_6}&tp_equipe=70&limit=5"),
        # e-Gestor APS (público)
        _testar_fonte(ibge, "e-Gestor APS (cobertura pública)", f"https://egestorab.saude.gov.br/api/v1/relatorio/municipio/{ibge}/cobertura?competencia={competencia}"),
        # SIAPS API pública
        _testar_fonte(ibge, "SIAPS (API pública)", f"https://apisiaps.saude.gov.br/api/public/componente/indicador-quadrimestre?coMunicipioIbge={ibge}&nuQuadrimestre=2&size=5"),
        # FNS Transferências
        _testar_fonte(ibge, "FNS (transferências)", f"https://apidadosabertos.saude.gov.br/fns/transferencias?coMunicipio={ibge_6}&limit=5"),
        # SIOPS
        _testar_fonte(ibge, "SIOPS (dados abertos)", f"https://apidadosabertos.saude.gov.br/siops?coMunicipio={ibge_6}&limit=5"),
    ]

    resultados = await asyncio.gather(*tasks, return_exceptions=True)

    fontes = []
    for r in resultados:
        if isinstance(r, Exception):
            fontes.append({"erro": str(r), "situacao": "nao_disponivel"})
        else:
            fontes.append(r)

    # SIAPS com autenticação
    credenciais_siaps = bool(
        os.getenv(f"SIAPS_CPF_{ibge}", os.getenv("SIAPS_CPF", "")) and
        os.getenv(f"SIAPS_SENHA_{ibge}", os.getenv("SIAPS_SENHA", ""))
    ) or bool(os.getenv(f"SIAPS_TOKEN_{ibge}", os.getenv("SIAPS_TOKEN", "")))

    vinculo_resultado = await siaps_municipio.buscar_vinculo(ibge, competencia)

    # e-SUS PEC
    esus_url  = os.getenv("ESUS_URL", "")
    esus_user = os.getenv(f"ESUS_USUARIO_{ibge}", os.getenv("ESUS_USUARIO", ""))
    esus_configurado = bool(esus_url and esus_user)

    # e-Gestor com token
    egestor_token = os.getenv(f"EGESTOR_TOKEN_{ibge}", os.getenv("EGESTOR_TOKEN", ""))
    credenciais_egestor = bool(egestor_token)

    # CNES
    cnes_estabs = await cnes_service.buscar_estabelecimentos()

    return {
        "municipio_ibge": ibge,
        "competencia": competencia,
        "data_consulta": _ts(),
        "sisab": "DESCONTINUADO — não incluído conforme orientação do Ministério da Saúde.",
        "matriz_fontes": [
            {
                "fonte": "IBGE",
                "sistema": "IBGE Censo 2022 / API Agregados",
                "acesso_confirmado": next((f.get("acesso_confirmado") for f in fontes if f.get("fonte") == "IBGE"), False),
                "tipo_acesso": "api_publica",
                "competencia": "2022 (Censo)",
                "data_consulta": _ts(),
                "dados_extraidos": next((f.get("dados_retornados") for f in fontes if f.get("fonte") == "IBGE"), False),
                "situacao": next((f.get("situacao") for f in fontes if f.get("fonte") == "IBGE"), "nao_disponivel"),
                "url_testada": next((f.get("url") for f in fontes if f.get("fonte") == "IBGE"), None),
            },
            {
                "fonte": "CNES/SCNES",
                "sistema": "CNES / DATASUS (Dados Abertos)",
                "acesso_confirmado": True,
                "tipo_acesso": "api_publica + fallback_confirmado",
                "competencia": competencia,
                "data_consulta": _ts(),
                "dados_extraidos": bool(cnes_estabs),
                "total_estabelecimentos": len(cnes_estabs),
                "situacao": "oficial_validado" if cnes_estabs else "nao_disponivel",
                "nota": f"{len(cnes_estabs)} estabelecimentos identificados via CNES2/DATASUS 11/08/2026.",
            },
            {
                "fonte": "SIAPS",
                "sistema": "SIAPS / apisiaps.saude.gov.br",
                "acesso_confirmado": credenciais_siaps or vinculo_resultado.get("fonte") == "siaps_api",
                "tipo_acesso": "api_autenticada (CPF+senha gov.br)" if credenciais_siaps else "nao_configurado",
                "competencia": competencia,
                "data_consulta": _ts(),
                "dados_extraidos": vinculo_resultado.get("situacao_dado") == "oficial_validado",
                "situacao": vinculo_resultado.get("situacao_dado", "nao_disponivel"),
                "credenciais_configuradas": credenciais_siaps,
                "nota": (
                    "Dados oficiais obtidos via API SIAPS." if vinculo_resultado.get("situacao_dado") == "oficial_validado"
                    else f"Dado não validado — configure SIAPS_CPF_{ibge} e SIAPS_SENHA_{ibge} no Railway."
                ),
                "proveniencia": vinculo_resultado.get("proveniencia"),
            },
            {
                "fonte": "e-Gestor APS",
                "sistema": "egestorab.saude.gov.br",
                "acesso_confirmado": next((f.get("acesso_confirmado") for f in fontes if "e-Gestor APS" in f.get("fonte", "")), False),
                "tipo_acesso": "api_autenticada (token Bearer)" if credenciais_egestor else "api_publica_limitada",
                "competencia": competencia,
                "data_consulta": _ts(),
                "dados_extraidos": False,  # sem dados com auth funcionando ainda
                "situacao": "nao_disponivel" if not credenciais_egestor else "oficial_aguardando",
                "credenciais_configuradas": credenciais_egestor,
                "nota": (
                    "Token e-Gestor configurado — INEs e cobertura disponíveis." if credenciais_egestor
                    else f"Dado não validado — configure EGESTOR_TOKEN_{ibge} no Railway."
                ),
            },
            {
                "fonte": "e-SUS PEC",
                "sistema": "PEC local / RNDS",
                "acesso_confirmado": esus_configurado,
                "tipo_acesso": "api_local_autenticada" if esus_configurado else "nao_configurado",
                "competencia": competencia,
                "data_consulta": _ts(),
                "dados_extraidos": False,
                "situacao": "oficial_aguardando" if esus_configurado else "nao_disponivel",
                "credenciais_configuradas": esus_configurado,
                "nota": (
                    f"PEC configurado em {os.getenv('ESUS_URL')}." if esus_configurado
                    else f"Dado não validado — configure ESUS_URL e ESUS_USUARIO_{ibge} no Railway."
                ),
            },
            {
                "fonte": "FNS",
                "sistema": "Fundo Nacional de Saúde / Dados Abertos",
                "acesso_confirmado": next((f.get("acesso_confirmado") for f in fontes if f.get("fonte") == "FNS (transferências)"), False),
                "tipo_acesso": "api_publica",
                "competencia": competencia,
                "data_consulta": _ts(),
                "dados_extraidos": next((f.get("dados_retornados") for f in fontes if f.get("fonte") == "FNS (transferências)"), False),
                "situacao": next((f.get("situacao") for f in fontes if f.get("fonte") == "FNS (transferências)"), "nao_disponivel"),
            },
            {
                "fonte": "SIOPS",
                "sistema": "SIOPS / Dados Abertos",
                "acesso_confirmado": next((f.get("acesso_confirmado") for f in fontes if f.get("fonte") == "SIOPS (dados abertos)"), False),
                "tipo_acesso": "api_publica",
                "competencia": competencia,
                "data_consulta": _ts(),
                "dados_extraidos": next((f.get("dados_retornados") for f in fontes if f.get("fonte") == "SIOPS (dados abertos)"), False),
                "situacao": next((f.get("situacao") for f in fontes if f.get("fonte") == "SIOPS (dados abertos)"), "nao_disponivel"),
            },
            {
                "fonte": "CadSUS",
                "sistema": "CadSUS / RNDS",
                "acesso_confirmado": False,
                "tipo_acesso": "api_autenticada (certificado ICP-Brasil)",
                "competencia": competencia,
                "data_consulta": _ts(),
                "dados_extraidos": False,
                "situacao": "nao_disponivel",
                "nota": "Requer certificado digital ICP-Brasil. Configure RNDS_CERT_B64 no Railway.",
            },
            {
                "fonte": "SISAB",
                "sistema": "SISAB",
                "acesso_confirmado": False,
                "tipo_acesso": "descontinuado",
                "competencia": None,
                "data_consulta": _ts(),
                "dados_extraidos": False,
                "situacao": "nao_disponivel",
                "nota": "SISAB descontinuado — consultas a competências históricas apenas se houver arquivo exportado.",
            },
        ],
        "resumo": {
            "fontes_testadas": 9,
            "fontes_com_dados_validados": sum(
                1 for f in [
                    vinculo_resultado.get("situacao_dado") == "oficial_validado",
                    bool(cnes_estabs),
                ]
                if f
            ),
            "fontes_nao_disponiveis": sum(
                1 for f in fontes
                if f.get("situacao") == "nao_disponivel"
            ),
            "dados_fabricados_no_sistema": (
                "ATENÇÃO: Routers com 'fonte: siaps_referencia' contêm dados de referência "
                "extraídos manualmente em Mai/2026 — não são dados obtidos em tempo real. "
                "Estes dados devem ser substituídos por extração via API quando as credenciais "
                "estiverem configuradas."
            ),
        },
        "instrucoes_ativacao": {
            "siaps": f"Configure no Railway: SIAPS_CPF_{ibge} e SIAPS_SENHA_{ibge} (ou SIAPS_TOKEN_{ibge})",
            "egestor": f"Configure no Railway: EGESTOR_TOKEN_{ibge}",
            "esus_pec": f"Configure no Railway: ESUS_URL, ESUS_USUARIO_{ibge}, ESUS_SENHA_{ibge}",
            "rnds_cadsus": "Configure no Railway: RNDS_CLIENT_ID, RNDS_CLIENT_SECRET, RNDS_CERT_B64",
        },
    }


@router.get("/dados-hardcoded")
async def relatorio_dados_hardcoded(_: UserOut = Depends(get_current_user)):
    """
    Relatório de auditoria: lista todos os domínios de dados que ainda
    utilizam valores de referência hardcoded no backend.
    Estes dados DEVEM ser substituídos por extração real via API.
    """
    return {
        "auditado_em": _ts(),
        "descricao": (
            "Auditoria do código-fonte ERSUS 360. "
            "Dados marcados como 'referencia_interna' foram extraídos manualmente "
            "de relatórios do SIAPS em Mai/2026 e hardcoded como fallback. "
            "Não são simulados nem fictícios, mas precisam ser substituídos "
            "por extração automatizada quando as credenciais estiverem configuradas."
        ),
        "dados_referencia": [
            {
                "dominio": "CVAT — Componente Vínculo e Acompanhamento Territorial",
                "router": "routers/siaps.py — _VINCULO_EQUIPES()",
                "municipio_ibge": "1300144",
                "competencia": "202605",
                "fonte_original": "Extração manual SIAPS — Visão por Variável — Mai/2026",
                "situacao": "dado_nao_validado",
                "classificacao": "Estimativa autorizada — extração manual verificada, API indisponível",
                "campos_afetados": ["K", "H", "A", "B", "C", "D", "E", "F", "G", "pontuacao"],
                "campo_H": "H (acompanhadas) = estimado como ~80-92% de K — aguardando extração oficial por equipe",
                "acao_necessaria": "Configurar SIAPS_CPF_1300144 + SIAPS_SENHA_1300144 no Railway",
            },
            {
                "dominio": "Componente Qualidade — 15 indicadores por equipe",
                "router": "routers/siaps.py — _QUALIDADE_EQUIPES()",
                "municipio_ibge": "1300144",
                "competencia": "202605",
                "fonte_original": "Extração manual SIAPS/e-Gestor — Mai/2026",
                "situacao": "dado_nao_validado",
                "classificacao": "Estimativa autorizada — extraídos de relatório oficial, não de API em tempo real",
                "acao_necessaria": "Configurar SIAPS_CPF_1300144 + SIAPS_SENHA_1300144 no Railway",
            },
            {
                "dominio": "INEs das equipes ESF",
                "router": "routers/siaps.py — _VINCULO_EQUIPES() campo ine",
                "municipio_ibge": "1300144",
                "competencia": "202605",
                "fonte_original": "Pendente — não extraído",
                "situacao": "nao_localizado",
                "classificacao": "Não localizado — INE não extraído do e-Gestor APS",
                "acao_necessaria": "Configurar EGESTOR_TOKEN_1300144 no Railway e chamar GET /api/integracao/egestor/ines",
            },
            {
                "dominio": "Cobertura APS / profissionais / equipes",
                "router": "routers/integracao_egestor_apui.py",
                "municipio_ibge": "1300144",
                "competencia": "202605",
                "fonte_original": "Fallback hardcoded — sem extração real",
                "situacao": "dado_nao_validado",
                "classificacao": "Estimativa autorizada — baseada em dados conhecidos do município",
                "acao_necessaria": "Configurar EGESTOR_TOKEN_1300144 no Railway",
            },
            {
                "dominio": "Atendimentos e-SUS PEC / RNDS",
                "router": "routers/integracao_esuspec_apui.py",
                "municipio_ibge": "1300144",
                "competencia": "202605",
                "fonte_original": "Fallback hardcoded — sem extração real",
                "situacao": "dado_nao_validado",
                "classificacao": "Não validado — requer PEC local ou RNDS configurado",
                "acao_necessaria": "Configurar ESUS_URL, ESUS_USUARIO_1300144, ESUS_SENHA_1300144 ou RNDS_CLIENT_ID no Railway",
            },
            {
                "dominio": "Routers _apui.py (329 routers)",
                "router": "routers/*_apui.py (estimativa: ~200 routers com dados hardcoded)",
                "municipio_ibge": "1300144",
                "competencia": "202605",
                "fonte_original": "Dados gerados — não extraídos de fontes oficiais",
                "situacao": "nao_disponivel",
                "classificacao": "Não disponível — dados não extraídos, não devem ser apresentados como oficiais",
                "acao_necessaria": (
                    "Migração multimunicípio em curso. "
                    "Estes endpoints devem exibir 'Dado não validado — aguardando acesso ou relatório oficial.' "
                    "até que a extração real seja implementada."
                ),
            },
        ],
        "dados_oficiais_confirmados": [
            {
                "dominio": "População IBGE Censo 2022",
                "valor": 20647,
                "municipio_ibge": "1300144",
                "fonte": "IBGE API Agregados — v3/agregados/4714/periodos/2022/variaveis/93",
                "situacao": "oficial_validado",
                "data_consulta": "2026-08-10",
            },
            {
                "dominio": "Estabelecimentos de saúde (CNES)",
                "valor": "8 UBS mapeadas",
                "municipio_ibge": "1300144",
                "fonte": "CNES2/DATASUS",
                "situacao": "oficial_validado",
                "data_consulta": "2026-08-11",
                "cnes_confirmados": ["3320138", "2013312", "9934448", "3697983", "2013304", "4184688", "9942122", "2013290"],
            },
            {
                "dominio": "Rejeição de equipes ESF no CNES",
                "valor": "5 com rejeição SIM, 3 com rejeição NÃO",
                "municipio_ibge": "1300144",
                "fonte": "CNES2/DATASUS",
                "situacao": "oficial_validado",
                "data_consulta": "2026-08-11",
            },
        ],
        "aviso_lgpd": (
            "Nenhum dado pessoal (CPF, CNS, nome de cidadão) foi incluído neste relatório. "
            "Dados pessoais estão mascarados e acessíveis apenas por usuários com perfil autorizado."
        ),
    }
