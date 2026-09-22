"""
Credenciais de integração POR MUNICÍPIO.

Política do projeto: senhas e tokens NUNCA ficam no banco nem no código — só em
variáveis de ambiente do servidor (Railway). Cada município tem as suas:

    {VARIAVEL}_{IBGE7}        ex.: SIAPS_CPF_1399991, FNS_API_SENHA_1399991

As variáveis sem sufixo (FNS_API_CPF, SIAPS_SENHA, ...) são as credenciais
históricas de Apuí/AM e só valem para Apuí. Nenhum outro município usa
credencial de outro: sem a variável própria, a integração fica "não configurada".

A tabela `credenciais_municipio` registra apenas QUAIS variáveis cada município
usa e se estão presentes — nunca os valores.
"""
from __future__ import annotations

import os

from config import settings
from tenancy.contexto import MunicipioContexto, municipio_atual

# sistema → campo → variável base
SISTEMAS: dict[str, dict] = {
    "FNS": {"descricao": "API do Fundo Nacional de Saúde (apifns)",
            "campos": {"CPF": "FNS_API_CPF", "SENHA": "FNS_API_SENHA"}},
    "SIAPS": {"descricao": "SIAPS / e-Gestor APS (gestor municipal)",
              "campos": {"CPF": "SIAPS_CPF", "SENHA": "SIAPS_SENHA", "TOKEN": "SIAPS_TOKEN",
                         "REFRESH_TOKEN": "SIAPS_REFRESH_TOKEN"}},
    "EGESTOR": {"descricao": "e-Gestor AB (token)",
                "campos": {"TOKEN": "EGESTOR_TOKEN", "USUARIO": "EGESTOR_USUARIO", "SENHA": "EGESTOR_SENHA"}},
    "ESUS": {"descricao": "e-SUS APS PEC do município",
             "campos": {"URL": "ESUS_URL", "PEC_URL": "ESUS_PEC_URL", "USUARIO": "ESUS_USUARIO",
                        "SENHA": "ESUS_SENHA"}},
    "LEDI": {"descricao": "LEDI APS (transmissão ao PEC)",
             "campos": {"PEC_URL": "LEDI_PEC_URL", "USUARIO": "LEDI_USUARIO", "SENHA": "LEDI_SENHA"}},
    "RNDS": {"descricao": "RNDS / Conecte SUS (certificado ICP-Brasil do estabelecimento)",
             "campos": {"CNES": "RNDS_CNES", "CLIENT_ID": "RNDS_CLIENT_ID", "CLIENT_SECRET": "RNDS_CLIENT_SECRET",
                        "CERT_B64": "RNDS_CERT_B64", "CERT_PASSWORD": "RNDS_CERT_PASSWORD"}},
}

# Campos que, preenchidos, bastam para considerar o sistema configurado
MINIMOS: dict[str, list[list[str]]] = {
    "FNS": [["CPF", "SENHA"]],
    "SIAPS": [["CPF", "SENHA"], ["TOKEN"]],
    "EGESTOR": [["TOKEN"], ["USUARIO", "SENHA"]],
    "ESUS": [["URL", "USUARIO", "SENHA"], ["PEC_URL", "USUARIO", "SENHA"]],
    "LEDI": [["PEC_URL", "USUARIO", "SENHA"]],
    "RNDS": [["CNES", "CLIENT_ID", "CERT_B64", "CERT_PASSWORD"]],
}


def nome_variavel(sistema: str, campo: str, ibge: str) -> str:
    return f"{SISTEMAS[sistema]['campos'][campo]}_{ibge}"


def _legado(base: str) -> str:
    # settings lê o .env em desenvolvimento; os.getenv cobre variáveis fora do Settings
    valor = os.getenv(base)
    if valor is None:
        valor = getattr(settings, base, "") or ""
    return str(valor)


def _valor(sistema: str, campo: str, ctx: MunicipioContexto) -> tuple[str, str | None]:
    """(valor, origem) — origem: 'municipal', 'legado_apui' ou None."""
    proprio = os.getenv(nome_variavel(sistema, campo, ctx.ibge), "").strip()
    if proprio:
        return proprio, "municipal"
    if ctx.legado:
        v = _legado(SISTEMAS[sistema]["campos"][campo]).strip()
        if v:
            return v, "legado_apui"
    return "", None


def credencial(sistema: str, campo: str, ctx: MunicipioContexto | None = None) -> str:
    """Valor da credencial do município da sessão ('' se não configurada)."""
    return _valor(sistema, campo, ctx or municipio_atual())[0]


def configurado(sistema: str, ctx: MunicipioContexto | None = None) -> bool:
    ctx = ctx or municipio_atual()
    return any(all(credencial(sistema, c, ctx) for c in grupo) for grupo in MINIMOS[sistema])


def status_municipio(ctx: MunicipioContexto) -> list[dict]:
    """Situação de cada integração do município — SEM expor valores."""
    saida = []
    for sistema, info in SISTEMAS.items():
        campos = {}
        for campo in info["campos"]:
            valor, origem = _valor(sistema, campo, ctx)
            campos[campo] = {
                "variavel": nome_variavel(sistema, campo, ctx.ibge),
                "configurada": bool(valor),
                "origem": origem,
            }
        saida.append({"sistema": sistema, "descricao": info["descricao"],
                      "configurado": configurado(sistema, ctx), "campos": campos})
    return saida
