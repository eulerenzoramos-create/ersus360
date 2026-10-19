"""
Lê o território do e-SUS PEC pela API web do próprio PEC (GraphQL em /api/graphql), com a conta de
serviço do município — a mesma consulta que a tela "Gestão de cadastros › Acompanhamento do território" faz.

Só CONTADORES por equipe e microárea (imóveis, cadastro completo/atualizado, domicílios visitados/a visitar).
Nenhuma consulta pede logradouros, imóveis ou cidadãos. Somente leitura: nenhuma mutation além do login.

Credenciais ficam só em variáveis de ambiente do município (tenancy.credenciais, sistema "ESUS":
ESUS_PEC_URL, ESUS_USUARIO, ESUS_SENHA) — nunca no banco, no código ou no log.
Recomendação: conta DEDICADA, com perfil somente de consulta, fornecida pela Secretaria.
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass

import httpx

log = logging.getLogger(__name__)

TIMEOUT = 40
SIGLAS_ESF = {"ESF", "ESFR", "EAP"}          # equipes com território/microáreas
ID_FORA_DE_AREA = "FA"                        # microárea que o PEC usa para imóveis sem microárea
PAGINA = {"size": 50, "fetchPageInfo": False, "sort": ["nome"]}

Q_LOGIN = "mutation Login($input: LoginInput!) { login(input: $input) { success } }"
Q_UNIDADES = ("query UnidadesSaudeSelectField($input: UnidadesSaudeQueryInput!) { unidadesSaude(input: $input) "
              "{ content { id cnes nome ativo } } }")
Q_EQUIPES = ("query EquipeSelectField($input: EquipesQueryInput!) { equipes(input: $input) "
             "{ content { id nome ine ativo tipoEquipe { sigla } } } }")
Q_MICROAREAS = ("query VisualizacaoTerritorial($input: TerritorioEquipeQueryInput!) "
                "{ territorioEquipe(input: $input) { microareas } }")
Q_INDICES = ("query TerritorioMicroarea($input: TerritorioMicroareaQueryInput!) { territorioMicroarea(input: $input) "
             "{ id indices { quantidadeImoveisCadastroCompleto totalImoveisNaoRecusados quantidadeImoveisAtualizados "
             "totalImoveisAtualizados quantidadeDomiciliosAvaliados quantidadeDomiciliosVisitados } } }")


class PecWebErro(RuntimeError):
    """Falha ao ler o PEC (rede, login recusado, consulta recusada). A mensagem nunca contém credenciais."""


class PecConsultaRecusada(PecWebErro):
    """O PEC respondeu, mas recusou a operação (lista "errors" do GraphQL)."""


@dataclass(frozen=True)
class Acesso:
    url: str
    usuario: str
    senha: str


def _limpa(texto: str, acesso: Acesso) -> str:
    t = " ".join(str(texto).split())
    for segredo in (acesso.senha, acesso.usuario):
        if segredo:
            t = t.replace(segredo, "***")
    return t[:300]


async def _gql(c: httpx.AsyncClient, acesso: Acesso, operacao: str, query: str, entrada: dict) -> dict:
    try:
        r = await c.post("/api/graphql", json={"operationName": operacao, "query": query, "variables": {"input": entrada}})
    except httpx.HTTPError as e:
        raise PecWebErro(f"{operacao}: sem conexão com o PEC ({type(e).__name__})") from e
    if r.status_code != 200:
        raise PecWebErro(f"{operacao}: o PEC respondeu HTTP {r.status_code}")
    try:
        corpo = r.json()
    except ValueError as e:
        raise PecWebErro(f"{operacao}: resposta do PEC não é JSON") from e
    if corpo.get("errors"):
        msg = _limpa((corpo["errors"][0] or {}).get("message", "erro desconhecido"), acesso)
        raise PecConsultaRecusada(f"{operacao}: {msg}")
    return corpo.get("data") or {}


async def _login(c: httpx.AsyncClient, acesso: Acesso) -> None:
    try:
        dados = await _gql(c, acesso, "Login", Q_LOGIN, {"username": acesso.usuario, "password": acesso.senha})
    except PecConsultaRecusada as e:
        # qualquer recusa do PEC no login (senha errada, conta bloqueada, campos inválidos) conta como login recusado:
        # o agendamento pausa para não gastar as tentativas da conta
        raise PecWebErro("Login recusado pelo PEC: " + str(e).removeprefix("Login: ")) from e
    if not (dados.get("login") or {}).get("success"):
        raise PecWebErro("Login recusado pelo PEC: confira usuário e senha da conta de serviço (ESUS_USUARIO/ESUS_SENHA).")


def _n(v) -> int | None:
    return int(v) if isinstance(v, (int, float)) else None


async def _equipe(c, acesso, sem: asyncio.Semaphore, unidade: dict, eq: dict) -> dict:
    base = {"tipoEndereco": "LOGRADOURO", "stAtivo": True}
    async with sem:
        d = await _gql(c, acesso, "VisualizacaoTerritorial", Q_MICROAREAS, {"cnes": unidade["cnes"], "ine": eq["ine"], **base})
    codigos = list((d.get("territorioEquipe") or {}).get("microareas") or [])
    micro = []
    for cod in codigos:
        async with sem:
            d = await _gql(c, acesso, "TerritorioMicroarea", Q_INDICES, {
                "cnes": unidade["cnes"], "ine": eq["ine"], **base, "isCadastroCompleto": None, "isCadastroRecusado": None,
                "microarea": cod, "pageParams": {"page": 0, "size": 1}})
        ind = ((d.get("territorioMicroarea") or {}).get("indices")) or {}
        total = _n(ind.get("totalImoveisNaoRecusados"))
        if total is None:
            continue
        micro.append({"codigo": "FORA" if cod == ID_FORA_DE_AREA else str(cod), "imoveis": total,
                      "cadastro_completo": _n(ind.get("quantidadeImoveisCadastroCompleto")),
                      "cadastro_atualizado": _n(ind.get("quantidadeImoveisAtualizados")),
                      "domicilios_visitados": _n(ind.get("quantidadeDomiciliosVisitados")),
                      "domicilios_a_visitar": _n(ind.get("quantidadeDomiciliosAvaliados"))})
    return {"ine": eq["ine"], "nome": eq["nome"].title(), "tipo": "eSF", "cnes": unidade["cnes"],
            "unidade": unidade["nome"], "microareas": micro}


async def coletar_territorio(acesso: Acesso, client: httpx.AsyncClient | None = None, simultaneas: int = 4) -> list[dict]:
    """Equipes ESF/eAP ativas do município com os contadores de cada microárea."""
    fechar = client is None
    c = client or httpx.AsyncClient(base_url=acesso.url.rstrip("/"), timeout=TIMEOUT, follow_redirects=True,
                                    headers={"Accept": "application/json", "Content-Type": "application/json"})
    try:
        await _login(c, acesso)
        und = await _gql(c, acesso, "UnidadesSaudeSelectField", Q_UNIDADES,
                         {"query": None, "mostrarInativas": False, "pageParams": PAGINA})
        sem = asyncio.Semaphore(simultaneas)
        tarefas = []
        for u in (und.get("unidadesSaude") or {}).get("content") or []:
            if not u.get("ativo", True):
                continue
            eqs = await _gql(c, acesso, "EquipeSelectField", Q_EQUIPES,
                             {"query": None, "unidadeSaudeId": u["id"], "mostrarInativas": False, "pageParams": PAGINA})
            for e in (eqs.get("equipes") or {}).get("content") or []:
                sigla = ((e.get("tipoEquipe") or {}).get("sigla") or "").upper()
                if e.get("ativo", True) and sigla in SIGLAS_ESF and e.get("ine"):
                    tarefas.append(_equipe(c, acesso, sem, u, e))
        equipes = await asyncio.gather(*tarefas)
        return [e for e in equipes if e["microareas"]]
    finally:
        if fechar:
            await c.aclose()
