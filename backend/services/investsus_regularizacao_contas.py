"""
InvestSUS — Regularização de Contas de Emendas (ADPF 854).

Fonte: painel público do FNS "Regularização Contas Emendas"
(portalfns.saude.gov.br → InvestSUS → Painéis → Emendas Parlamentares → Regularização Contas Emendas),
um mashup Qlik Sense com acesso anônimo:

    https://investsuspaineis.saude.gov.br/extensions/CGIN_Painel_Reg_Contas_Emendas/CGIN_Painel_Reg_Contas_Emendas.html

Em vez de clicar em telas e no botão "Exportar", o coletor fala direto com o Qlik Engine
(JSON-RPC por WebSocket) — o mesmo canal que a página usa. Conferido em 17/11/2026:

* app  ``f1488696-fe9b-4eff-b29d-c4f1c7b942a6`` (variável ID_APP do mashup)
* tabela "Situação de Regularidade de Contas" = objeto ``nJTtyT`` (13 colunas, mesmas do Exportar)
* data de atualização BB/CEF = objeto ``mgpWZj``
* campos de filtro: ``UF``, ``MUNICIPIO`` (maiúsculas, sem acento: "APUI"), ``CO_ESFERA_ADMINISTRATIVA``
  ("MUNICIPAL" | "ESTADUAL"). A tabela só calcula com UF + MUNICIPIO + ESFERA selecionados.
* STATUS possíveis: REGULARIZADA, PENDENTE, ABERTURA RECENTE, NÃO INFORMADO PELO BANCO.

Cada sessão WebSocket tem seleções próprias: nada aqui altera o painel para outros usuários.
Nenhum valor é inventado: se o Qlik não responder, a coleta falha e os dados gravados ficam como estão.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
import unicodedata
from datetime import date, datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)

HOST = "investsuspaineis.saude.gov.br"
URL_PAINEL = f"https://{HOST}/extensions/CGIN_Painel_Reg_Contas_Emendas/CGIN_Painel_Reg_Contas_Emendas.html"
ID_APP = "f1488696-fe9b-4eff-b29d-c4f1c7b942a6"
OBJ_TABELA = "nJTtyT"
OBJ_ATUALIZACAO = "mgpWZj"
FONTE = "Portal FNS - InvestSUS / Regularização Contas Emendas"

STATUS_REGULARIZADA = "REGULARIZADA"
STATUS_PENDENTE = "PENDENTE"
STATUS_ABERTURA_RECENTE = "ABERTURA RECENTE"
STATUS_NAO_INFORMADO = "NÃO INFORMADO PELO BANCO"
# Exige ação do Fundo (regularizar titularidade). "Abertura recente" e "não informado" são
# acompanhamento: o banco ainda não devolveu a situação da conta.
STATUS_COM_PENDENCIA = {STATUS_PENDENTE}
STATUS_EM_ACOMPANHAMENTO = {STATUS_ABERTURA_RECENTE, STATUS_NAO_INFORMADO}

COLUNAS = ["CNPJ", "UF", "MUNICIPIO", "ESFERA", "BANCO", "AGENCIA C/ DV", "CONTA C/ DV",
           "NOVA CONTA (ALTERAÇÃO CEF)", "DATA ABERTURA", "STATUS", "EMENDA", "PROPOSTA", "Link Consulta"]

TIMEOUT_S = 40
PAGINA = 500  # linhas por página do hipercubo (13 colunas × 500 = 6.500 células, abaixo do limite 10.000)


class ColetaRegularizacaoErro(RuntimeError):
    pass


# ── Normalização ──────────────────────────────────────────────────────────────

def nome_qlik(nome: str) -> str:
    """Nome do município como o painel grava: maiúsculas, sem acento ("Apuí" → "APUI")."""
    s = unicodedata.normalize("NFKD", nome or "").encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", s).strip().upper()


def _digitos(v: Any) -> str:
    return re.sub(r"\D", "", str(v or ""))


def _data_iso(v: str | None) -> str | None:
    v = (v or "").strip()
    m = re.fullmatch(r"(\d{2})/(\d{2})/(\d{4})", v)
    if m:
        try:
            return date(int(m[3]), int(m[2]), int(m[1])).isoformat()
        except ValueError:
            return None
    m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", v[:10])
    return v[:10] if m else None


def _texto(v: Any) -> str:
    s = "" if v is None else str(v).strip()
    return "" if s in ("-", "null", "None") else s


def _banco(v: str) -> str:
    s = _texto(v)
    if s in ("001", "1") or "BRASIL" in s.upper():
        return "Banco do Brasil"
    if s in ("104",) or "CEF" in s.upper() or "CAIXA" in s.upper():
        return "Caixa Econômica Federal"
    return s


def propostas_da_linha(numero: str) -> list[str]:
    """O painel junta mais de uma proposta numa conta com ';'."""
    return [p for p in (_digitos(x) for x in (numero or "").split(";")) if p]


def normalizar_linha(celulas: list[str] | dict) -> dict:
    """Uma linha da tabela (lista na ordem de COLUNAS, ou dict com os rótulos) → contrato JSON."""
    if isinstance(celulas, dict):
        d = {k.strip(): v for k, v in celulas.items()}
        valores = [d.get(c, "") for c in COLUNAS]
    else:
        valores = list(celulas) + [""] * (len(COLUNAS) - len(celulas))
    cnpj, uf, mun, esfera, banco, ag, conta, nova, abertura, status, emenda, proposta, link = (
        _texto(x) for x in valores[:13])
    status = status.upper()
    numero_proposta = ";".join(propostas_da_linha(proposta)) or proposta
    return {
        "cnpj": _digitos(cnpj),
        "uf": uf.upper(),
        "municipio": nome_qlik(mun),
        "esfera": esfera.upper(),
        "banco": _banco(banco),
        "agencia_dv": ag,
        "conta_dv": conta.upper(),
        "nova_conta_cef": nova,
        "data_abertura": _data_iso(abertura),
        "status_regularizacao": status,
        "possui_pendencia": status in STATUS_COM_PENDENCIA,
        "numero_emenda": _digitos(emenda) or emenda,
        "numero_proposta": numero_proposta,
        "link_consulta_fns": link if link.startswith("https://consultafns.saude.gov.br/") else "",
    }


def resumo(contas: list[dict]) -> dict:
    por_status: dict[str, int] = {}
    for c in contas:
        por_status[c["status_regularizacao"]] = por_status.get(c["status_regularizacao"], 0) + 1
    return {
        "total_contas": len(contas),
        "total_regularizadas": por_status.get(STATUS_REGULARIZADA, 0),
        "total_pendentes": sum(1 for c in contas if c["possui_pendencia"]),
        "total_em_acompanhamento": sum(por_status.get(s, 0) for s in STATUS_EM_ACOMPANHAMENTO),
        "por_status": por_status,
    }


def datas_atualizacao(texto: str) -> dict:
    """"Data de Atualização - BB : 06/11/2026 --//-- Data de Atualização - CEF: 17/11/2026"."""
    out = {}
    for banco in ("BB", "CEF"):
        m = re.search(rf"{banco}\s*:\s*(\d{{2}}/\d{{2}}/\d{{4}})", texto or "")
        out[f"atualizacao_{banco.lower()}"] = _data_iso(m[1]) if m else None
    return out


def montar_payload(contas: list[dict], uf: str, municipio: str, esfera: str,
                   extras: dict | None = None) -> dict:
    return {
        "metadata": {
            "fonte": FONTE,
            "url_painel": URL_PAINEL,
            "data_extracao": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "filtros_aplicados": {"uf": uf, "municipio": municipio, "esfera": esfera},
            "resumo": resumo(contas),
            **(extras or {}),
        },
        "contas": contas,
    }


# ── Qlik Engine (JSON-RPC sobre WebSocket) ────────────────────────────────────

class _Engine:
    def __init__(self, ws):
        self.ws = ws
        self._id = 0

    async def call(self, handle: int, method: str, params: dict | list) -> dict:
        self._id += 1
        meu = self._id
        await self.ws.send(json.dumps({"jsonrpc": "2.0", "id": meu, "handle": handle,
                                       "method": method, "params": params}))
        while True:
            msg = json.loads(await asyncio.wait_for(self.ws.recv(), TIMEOUT_S))
            if msg.get("id") != meu:
                continue  # notificações (OnConnected, change) e respostas antigas
            if "error" in msg:
                raise ColetaRegularizacaoErro(f"Qlik {method}: {msg['error'].get('message')}")
            return msg.get("result", {})


async def _sessao_anonima() -> tuple[str, str]:
    """O Qlik do FNS autentica visitante anônimo por redirecionamento: a página devolve o cookie
    de sessão (X-Qlik-Session); o WebSocket exige também o token CSRF (/qps/csrftoken)."""
    import httpx
    async with httpx.AsyncClient(follow_redirects=True, timeout=TIMEOUT_S,
                                 headers={"User-Agent": "ERSUS360-coletor/1.0"}) as c:
        r = await c.get(URL_PAINEL)
        r.raise_for_status()
        sessao = c.cookies.get("X-Qlik-Session")
        if not sessao:
            raise ColetaRegularizacaoErro("Painel do FNS não abriu sessão anônima (cookie X-Qlik-Session ausente)")
        t = await c.get(f"https://{HOST}/qps/csrftoken")
        csrf = t.headers.get("qlik-csrf-token")
    if not csrf:
        raise ColetaRegularizacaoErro("Painel do FNS não devolveu o token CSRF do Qlik")
    return f"X-Qlik-Session={sessao}", csrf


async def coletar(uf: str, municipio: str, esfera: str = "MUNICIPAL") -> dict:
    """Aplica UF/MUNICIPIO/ESFERA e lê 100% das linhas da tabela "Situação de Regularidade de Contas"."""
    import websockets

    uf, mun, esfera = uf.strip().upper(), nome_qlik(municipio), esfera.strip().upper()
    cookie, csrf = await _sessao_anonima()
    from urllib.parse import urlencode
    url = f"wss://{HOST}/app/{ID_APP}?" + urlencode({"reloadUri": URL_PAINEL, "qlik-csrf-token": csrf})
    try:
        conectar = websockets.connect(url, additional_headers={"Cookie": cookie, "Origin": f"https://{HOST}"},
                                      open_timeout=TIMEOUT_S, max_size=2 ** 24)
    except TypeError:  # websockets < 13
        conectar = websockets.connect(url, extra_headers={"Cookie": cookie, "Origin": f"https://{HOST}"},
                                      open_timeout=TIMEOUT_S, max_size=2 ** 24)
    async with conectar as ws:
        eng = _Engine(ws)
        doc = (await eng.call(-1, "OpenDoc", {"qDocName": ID_APP}))["qReturn"]["qHandle"]
        await eng.call(doc, "ClearAll", {"qLockedAlso": False})
        for campo, valor in (("UF", uf), ("MUNICIPIO", mun), ("CO_ESFERA_ADMINISTRATIVA", esfera)):
            h = (await eng.call(doc, "GetField", {"qFieldName": campo}))["qReturn"]["qHandle"]
            ok = (await eng.call(h, "SelectValues", {"qFieldValues": [{"qText": valor, "qIsNumeric": False}],
                                                     "qToggleMode": False, "qSoftLock": False})).get("qReturn")
            if not ok:
                raise ColetaRegularizacaoErro(f"Filtro {campo}={valor} não aceito pelo painel")

        tab = (await eng.call(doc, "GetObject", {"qId": OBJ_TABELA}))["qReturn"]["qHandle"]
        hc = (await eng.call(tab, "GetLayout", {}))["qLayout"]["qHyperCube"]
        if hc.get("qError"):
            raise ColetaRegularizacaoErro(f"Tabela do painel com erro: {hc['qError']}")
        cabecalho = [d.get("qFallbackTitle") for d in hc.get("qDimensionInfo", [])]
        if [c.strip().upper() for c in cabecalho] != [c.upper() for c in COLUNAS]:
            # Layout mudou: melhor parar do que gravar coluna trocada.
            raise ColetaRegularizacaoErro(f"Colunas do painel mudaram: {cabecalho}")
        total = hc["qSize"]["qcy"]
        linhas: list[list[str]] = []
        for topo in range(0, total, PAGINA):
            pag = await eng.call(tab, "GetHyperCubeData", {
                "qPath": "/qHyperCubeDef",
                "qPages": [{"qTop": topo, "qLeft": 0, "qWidth": len(COLUNAS), "qHeight": min(PAGINA, total - topo)}]})
            for p in pag.get("qDataPages", []):
                linhas += [[c.get("qText", "") for c in r] for r in p["qMatrix"]]
        if len(linhas) != total:
            raise ColetaRegularizacaoErro(f"Leitura incompleta: {len(linhas)} de {total} linhas")

        extras: dict = {"linhas_no_painel": total}
        try:
            txt = await eng.call(doc, "GetObject", {"qId": OBJ_ATUALIZACAO})
            lay = await eng.call(txt["qReturn"]["qHandle"], "GetLayout", {})
            extras.update(datas_atualizacao(json.dumps(lay, ensure_ascii=False)))
        except Exception as exc:  # informativo; não invalida a coleta
            logger.info("Regularização contas: data de atualização não lida: %s", exc)

    contas = [normalizar_linha(r) for r in linhas]
    return montar_payload(contas, uf, mun, esfera, extras)


# ── Conferência do payload recebido de agente externo ─────────────────────────

def validar_payload(payload: dict, uf: str, municipio: str) -> list[dict]:
    """Normaliza e confere que TODAS as contas são do município da sessão (nunca grava dado de outro)."""
    if not isinstance(payload, dict) or not isinstance(payload.get("contas"), list):
        raise ValueError("Payload sem a lista 'contas'")
    if len(payload["contas"]) > 5000:
        raise ValueError("Payload grande demais (máx. 5000 contas)")
    alvo_uf, alvo_mun = uf.upper(), nome_qlik(municipio)
    contas = []
    for i, c in enumerate(payload["contas"]):
        if not isinstance(c, dict):
            raise ValueError(f"Conta {i} inválida")
        if "status_regularizacao" in c:  # já no contrato
            base = [c.get("cnpj"), c.get("uf"), c.get("municipio"), c.get("esfera"), c.get("banco"),
                    c.get("agencia_dv"), c.get("conta_dv"), c.get("nova_conta_cef"),
                    c.get("data_abertura"), c.get("status_regularizacao"), c.get("numero_emenda"),
                    c.get("numero_proposta"), c.get("link_consulta_fns")]
            n = normalizar_linha([str(x) if x is not None else "" for x in base])
        else:  # linha crua do Exportar (rótulos do painel)
            n = normalizar_linha(c)
        if n["uf"] != alvo_uf or n["municipio"] != alvo_mun:
            raise ValueError(f"Conta {i} é de {n['municipio']}/{n['uf']}, não de {alvo_mun}/{alvo_uf}")
        if not n["conta_dv"] or not n["status_regularizacao"]:
            raise ValueError(f"Conta {i} sem conta ou status")
        contas.append(n)
    return contas
