"""
InvestSUS — captação de propostas FEDERAIS do Fundo Municipal de Saúde.

Escopo (services/investsus_federal.py): somente recursos federais — emendas RP 6,
RP 7, RP 8 e Recursos de Programa do Ministério da Saúde. Itens identificados como
estaduais são descartados aqui e contados em "fora_escopo".

Autenticação no portal investsus.saude.gov.br (login gov.br do gestor do Fundo),
por município — tenancy.credenciais, sistema "INVESTSUS":
    INVESTSUS_COOKIE_{IBGE7}   cookie de sessão capturado após login (expira em ~5h)
    INVESTSUS_TOKEN_{IBGE7}    token JWT extraído do navegador
    INVESTSUS_CPF_{IBGE7} + INVESTSUS_SENHA_{IBGE7}   password grant (fallback)
(sem sufixo = Apuí/AM, credenciais legadas).

Endpoint: POST https://investsus-backend-prd.saude.gov.br/api/propostas/paginado
O CNPJ consultado é SEMPRE o do Fundo do município da sessão (Municipio.cnpj_fundo).
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any

import httpx

from services import investsus_federal as fed

logger = logging.getLogger(__name__)

_BACKEND   = "https://investsus-backend-prd.saude.gov.br/api"
_CLIENT_ID = "INVESTSUS"
_TIMEOUT   = 45.0

_TOKEN_URL_PRINCIPAL = "https://acesso.saude.gov.br/realms/saude/protocol/openid-connect/token"
_TOKEN_URL_FALLBACK  = "https://acesso.saude.gov.br/auth/realms/saude/protocol/openid-connect/token"


def somente_digitos(valor: str | None) -> str:
    return "".join(ch for ch in str(valor or "") if ch.isdigit())


def _cabecalhos_contexto(ibge7: str, cnpj: str) -> dict:
    """Headers de contexto do usuário adicionados pelo proxy F5 do portal InvestSUS:
    UF (2 dígitos do IBGE) / IBGE6 / CNPJ do Fundo — do município da sessão."""
    return {
        "cz-aphrodite-de-peixes": "DIREME",
        "cz-milo-de-escopiao":    "ENTPUBLICAFNS",
        "cz-mu-de-aries":         f"{ibge7[:2]}/{ibge7[:6]}/{cnpj}",
        "Origin":                 "https://investsus.saude.gov.br",
        "Referer":                "https://investsus.saude.gov.br/",
    }


async def _autenticar(client: httpx.AsyncClient, cpf: str, senha: str) -> str:
    """Bearer token via Keycloak password grant (acesso.saude.gov.br, realm 'saude')."""
    payload = {"grant_type": "password", "client_id": _CLIENT_ID, "username": cpf, "password": senha}
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    for url in [_TOKEN_URL_PRINCIPAL, _TOKEN_URL_FALLBACK]:
        try:
            resp = await client.post(url, data=payload, headers=headers, timeout=_TIMEOUT)
            if resp.status_code == 404:
                continue
            body = resp.json()
            if resp.status_code == 400:
                err = body.get("error", "")
                desc = body.get("error_description", "")
                if "invalid_grant" in err or "Invalid user" in desc:
                    raise RuntimeError(f"Credenciais rejeitadas: {desc}. Verifique INVESTSUS_CPF/SENHA do município.")
                logger.debug("Token %s: %s %s", url, err, desc)
                continue
            if resp.status_code == 401:
                raise RuntimeError("Credenciais rejeitadas (401). Verifique INVESTSUS_CPF/SENHA do município.")
            resp.raise_for_status()
            token = body.get("access_token")
            if token:
                logger.info("InvestSUS: autenticado (gov.br realm=saude, client=%s)", _CLIENT_ID)
                return str(token)
        except RuntimeError:
            raise
        except Exception as e:
            logger.debug("Auth %s: %s", url, e)
            continue

    raise RuntimeError("Não foi possível autenticar no InvestSUS via gov.br. Verifique as credenciais do município.")


def _descricao(campo) -> str:
    if isinstance(campo, dict):
        return str(campo.get("descricao") or campo.get("nome") or "")
    return str(campo or "")


def _normalizar_proposta(raw: dict, cnpj: str) -> dict:
    """Item bruto de /api/propostas/paginado → formato interno.
    Campos confirmados (08/10/2026): numero, valor, anoExercicio, situacao{descricao},
    descricaoInstrumento, tipoProposta{descricao}, tipoRecurso{descricao}, objeto{descricao}.
    Campos de resultado primário/parlamentar são lidos quando presentes."""
    numero = str(raw.get("numero") or raw.get("numeroProposta") or raw.get("id") or "")
    sit = raw.get("situacao") or {}
    situacao = _descricao(sit)
    tipo_recurso = _descricao(raw.get("tipoRecurso"))          # EMENDA / PROGRAMA / ...
    tipo_proposta = _descricao(raw.get("tipoProposta"))        # INCREMENTO MAC, CUSTEIO PAP...
    tipo_emenda_txt = _descricao(raw.get("tipoEmenda") or raw.get("descricaoTipoEmenda"))
    objeto_desc = _descricao(raw.get("objeto")) or tipo_proposta
    parlamentar = raw.get("parlamentar") or raw.get("nomeParlamentar") or raw.get("autor") or ""
    parlamentar = _descricao(parlamentar)

    modalidade = fed.classificar_modalidade(
        tipo_recurso, tipo_emenda_txt,
        resultado_primario=raw.get("resultadoPrimario") or raw.get("rp") or raw.get("codigoResultadoPrimario"),
    )
    if modalidade is None:
        modalidade = fed.MODALIDADE_A_CLASSIFICAR
    valor = float(raw.get("valor") or 0)

    return {
        "numero_proposta":    numero,
        "numero_emenda":      str(raw.get("numeroEmenda") or raw.get("codigoEmenda") or "") or None,
        "numero_instrumento": str(raw.get("descricaoInstrumento") or raw.get("numeroInstrumento") or ""),
        "objeto":             objeto_desc,
        "modalidade":         modalidade,
        "tipo_emenda":        fed.tipo_emenda_de_modalidade(modalidade),
        "esfera":             fed.classificar_esfera(tipo_recurso, tipo_emenda_txt, parlamentar),
        "programa":           tipo_proposta,
        "tipo_recurso_raw":   tipo_recurso,
        "tipo_raw":           tipo_proposta,
        "parlamentar":        parlamentar,
        "valor_global":       valor,
        "valor_aprovado":     float(raw.get("valorAprovado") or valor or 0),
        "valor_repassado":    float(raw.get("valorRepassado") or raw.get("valorPago") or 0),
        "valor_executado":    float(raw.get("valorExecutado") or 0),
        "situacao_raw":       situacao or "",
        "exercicio":          int(raw.get("anoExercicio") or raw.get("exercicio") or datetime.now().year),
        "cnpj_proponente":    cnpj,
        "fonte":              "investsus",
        "raw":                raw,
    }


async def _buscar_propostas_paginado(client: httpx.AsyncClient, cnpj: str, ano: int) -> tuple[list[dict], str | None]:
    """Retorna (itens, mensagem_de_erro) — erro nunca é descartado em silêncio,
    mesmo quando alguma página já trouxe resultados."""
    all_items: list[dict] = []
    page = 1
    while True:
        body = {
            "filter": {"ano": str(ano), "cnpj": cnpj, "idAgrupadorTipoProposta": None},
            "pageNumber": page,
            "pageSize":   100,
        }
        try:
            resp = await client.post(f"{_BACKEND}/propostas/paginado", json=body, timeout=_TIMEOUT)
            if resp.status_code in (401, 403):
                msg = ("Sessão do InvestSUS expirada ou credencial rejeitada (401/403). Faça login no portal "
                       "e atualize o cookie/token do município nas variáveis do servidor.")
                logger.error("InvestSUS paginado p%d: %s", page, msg)
                return all_items, msg
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list):
                items, total = data, len(data)
            else:
                items = data.get("items") or data.get("content") or data.get("propostas") or []
                total = data.get("total") or data.get("totalElements") or len(items)
            all_items.extend(items)
            logger.info("InvestSUS propostas %d: %d/%d", ano, len(all_items), total)
            if len(all_items) >= int(total) or len(items) < 100:
                break
            page += 1
        except Exception as e:
            logger.error("InvestSUS paginado p%d: %s", page, e)
            return all_items, f"Falha ao buscar página {page}: {e}"
    return all_items, None


def _separar_escopo(propostas: list[dict], resultado: dict) -> list[dict]:
    """Mantém somente itens de esfera habilitada (federal); conta os descartados."""
    dentro = [p for p in propostas if fed.esfera_habilitada(p.get("esfera"))]
    resultado["fora_escopo"] = resultado.get("fora_escopo", 0) + (len(propostas) - len(dentro))
    return dentro


def _resultado_vazio() -> dict[str, Any]:
    return {"propostas": [], "repasses": [], "erros": [], "fora_escopo": 0,
            "sincronizado_em": datetime.utcnow().isoformat() + "Z"}


async def sincronizar_investsus(cnpj: str, ibge7: str, cred: dict[str, str]) -> dict:
    """Busca as propostas do Fundo (exercício atual e anterior) no InvestSUS.
    cred: {"COOKIE","TOKEN","CPF","SENHA"} do município (tenancy.credenciais)."""
    cnpj = somente_digitos(cnpj)
    resultado = _resultado_vazio()
    if len(cnpj) != 14:
        resultado["erros"].append({"endpoint": "cadastro", "erro": "CNPJ do Fundo Municipal de Saúde não cadastrado para o município."})
        return resultado

    ano = datetime.now().year
    headers: dict = {**_cabecalhos_contexto(ibge7, cnpj), "Content-Type": "application/json"}
    cookie = (cred.get("COOKIE") or "").strip()
    token = (cred.get("TOKEN") or "").strip()
    if cookie:
        # 'scpa' é cookie do portal gov.br e conflita com a sessão do InvestSUS
        partes = [p.strip() for p in cookie.split(";") if p.strip() and not p.strip().lower().startswith("scpa=")]
        headers["Cookie"] = "; ".join(partes)
    elif token:
        headers["Authorization"] = f"Bearer {token}"

    async with httpx.AsyncClient(follow_redirects=True, headers=headers) as client:
        if not cookie and not token:
            cpf, senha = somente_digitos(cred.get("CPF")), (cred.get("SENHA") or "").strip()
            if not cpf or not senha:
                resultado["erros"].append({"endpoint": "auth", "erro": "Credenciais do InvestSUS não configuradas para o município."})
                return resultado
            try:
                client.headers["Authorization"] = f"Bearer {await _autenticar(client, cpf, senha)}"
            except Exception as exc:
                logger.error("InvestSUS auth falhou: %s", exc)
                resultado["erros"].append({"endpoint": "auth", "erro": str(exc)})
                return resultado

        for exercicio in (ano, ano - 1):
            raws, erro = await _buscar_propostas_paginado(client, cnpj, exercicio)
            resultado["propostas"].extend(_normalizar_proposta(r, cnpj) for r in raws)
            if erro:
                resultado["erros"].append({"endpoint": f"propostas/{exercicio}", "erro": erro})

    resultado["propostas"] = _separar_escopo(resultado["propostas"], resultado)
    logger.info("InvestSUS: %d propostas federais, %d fora do escopo, %d erros",
                len(resultado["propostas"]), resultado["fora_escopo"], len(resultado["erros"]))
    return resultado


async def sincronizar_investsus_relay(items: list[dict], cnpj: str) -> dict:
    """Normaliza itens JÁ BUSCADOS pelo navegador do usuário na API real do InvestSUS
    (bookmarklet com fetch(), reaproveitando a sessão logada) — usado quando o servidor
    não alcança o host. Mesmo formato bruto de /api/propostas/paginado."""
    cnpj = somente_digitos(cnpj)
    resultado = _resultado_vazio()
    resultado["propostas"] = _separar_escopo([_normalizar_proposta(r, cnpj) for r in items], resultado)
    return resultado


def normalizar_item_tela(item: dict, cnpj: str) -> dict:
    """Item lido da TELA de Propostas do InvestSUS pelo navegador (colunas Nº da proposta,
    Tipo de Recurso, Tipo, Situação, Valor) → formato interno."""
    tipo_recurso = str(item.get("tipo_recurso_raw") or "")
    tipo_raw = str(item.get("tipo_raw") or "")
    modalidade = fed.classificar_modalidade(
        tipo_recurso, str(item.get("tipoEmenda") or ""), resultado_primario=item.get("resultado_primario"),
    ) or fed.MODALIDADE_A_CLASSIFICAR
    valor = float(item.get("valor_global") or item.get("valorEmpenhado") or item.get("valor") or 0)
    componente = "MAC" if "MAC" in tipo_raw.upper() else "PAP" if "PAP" in tipo_raw.upper() else None
    financiamento = ("incremento" if "INCREMENTO" in tipo_raw.upper()
                     else "custeio" if "CUSTEIO" in tipo_raw.upper() else None)
    pago = item.get("valor_repassado") or item.get("valorPago")
    return {
        "numero_proposta":    str(item.get("numero_proposta") or item.get("codigoEmenda") or item.get("numero") or ""),
        "numero_instrumento": str(item.get("numero_instrumento") or item.get("codigoSubEmenda") or ""),
        "objeto":             str(item.get("objeto") or item.get("descricao")
                                  or " - ".join(p for p in (tipo_recurso, tipo_raw) if p and p != "-")),
        "modalidade":         modalidade,
        "tipo_emenda":        fed.tipo_emenda_de_modalidade(modalidade),
        "esfera":             fed.classificar_esfera(tipo_recurso, item.get("tipoEmenda"), item.get("parlamentar")),
        "componente":         componente,
        "tipo_financiamento": financiamento,
        "parlamentar":        str(item.get("parlamentar") or item.get("nomeAutor") or ""),
        "valor_global":       valor,
        "valor_aprovado":     valor,
        "valor_repassado":    float(pago) if pago else 0.0,
        "valor_executado":    float(item.get("valor_executado") or 0),
        "situacao_raw":       str(item.get("situacao_raw") or item.get("situacao") or item.get("fase") or ""),
        "exercicio":          int(item.get("exercicio") or item.get("ano") or datetime.now().year),
        "cnpj_proponente":    cnpj,
        "fonte":              "sincronizacao_browser",
        "raw":                item,
    }


# ── Portal da Transparência CGU — complemento federal sem login no InvestSUS ──
# Chave global TRANSPARENCIA_API_KEY (a mesma de services/fns_portal_service.py).

_API_TRANSP = "https://api.portaldatransparencia.gov.br/api-de-dados"


def _parse_valor_br(v: Any) -> float:
    """Converte valores do Portal da Transparência (string pt-BR, ex. '- 35.865,08') para float."""
    if v is None or v == "":
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip().replace("R$", "").strip()
    negativo = s.startswith("-")
    s = s.lstrip("-").strip().replace(".", "").replace(",", ".")
    try:
        n = float(s)
    except ValueError:
        return 0.0
    return -n if negativo else n


def _localidade_confere(raw: dict, municipio_nome: str, uf: str) -> bool:
    """A API de emendas da CGU não filtra pelo beneficiário: só aceitamos a emenda se a
    localidade do gasto for o próprio município (nunca importar emenda de outro lugar)."""
    loc = fed._norm(raw.get("localidadeDoGasto") or raw.get("localidade") or "")
    nome = fed._norm(municipio_nome)
    return bool(loc and nome and nome in loc and (not uf or fed._norm(uf) in loc))


def _normalizar_emenda_transparencia(raw: dict, cnpj: str) -> dict:
    numero = str(raw.get("codigoEmenda") or raw.get("numero") or raw.get("numeroEmenda") or "")
    autor = _descricao(raw.get("nomeAutor") or raw.get("autor") or raw.get("parlamentar") or "")
    valor = _parse_valor_br(raw.get("valorEmpenhado") or raw.get("valor"))
    tipo_emenda_txt = str(raw.get("tipoEmenda") or "")
    modalidade = fed.classificar_modalidade(tipo_emenda_txt) or fed.MODALIDADE_A_CLASSIFICAR
    return {
        "numero_proposta":    numero,
        "numero_emenda":      str(raw.get("numeroEmenda") or numero) or None,
        "numero_instrumento": str(raw.get("codigoSubEmenda") or raw.get("numeroInstrumento") or ""),
        "objeto":             str(raw.get("descricao") or raw.get("objeto") or tipo_emenda_txt),
        "modalidade":         modalidade,
        "tipo_emenda":        fed.tipo_emenda_de_modalidade(modalidade),
        "esfera":             fed.ESFERA_FEDERAL,  # base da CGU = orçamento federal
        "programa":           str(raw.get("funcao") or raw.get("subfuncao") or ""),
        "parlamentar":        autor,
        "valor_global":       valor,
        "valor_aprovado":     valor,
        "valor_repassado":    _parse_valor_br(raw.get("valorPago") or raw.get("valorLiquidado")),
        "valor_executado":    0.0,
        "situacao_raw":       str(raw.get("situacao") or ""),
        "exercicio":          int(raw.get("ano") or datetime.now().year),
        "cnpj_proponente":    cnpj,
        "fonte":              "portal_transparencia",
        "raw":                raw,
    }


async def sincronizar_transparencia(cnpj: str, municipio_nome: str, uf: str) -> dict:
    """Emendas parlamentares FEDERAIS via Portal da Transparência CGU (não depende de
    login no InvestSUS). Só grava emendas cuja localidade do gasto é o município."""
    chave = os.getenv("TRANSPARENCIA_API_KEY", "").strip()
    cnpj = somente_digitos(cnpj)
    resultado = _resultado_vazio()
    if not chave:
        resultado["erros"].append({
            "endpoint": "auth",
            "erro": "TRANSPARENCIA_API_KEY não configurada (obtenha em portaldatransparencia.gov.br/api-de-dados).",
        })
        return resultado

    headers = {"chave-api-dados": chave, "Accept": "application/json"}
    ano_atual = datetime.now().year
    descartadas = 0
    async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
        for ano in (ano_atual, ano_atual - 1):
            try:
                resp = await client.get(f"{_API_TRANSP}/emendas", params={"ano": ano, "pagina": 1})
                if resp.status_code == 401:
                    resultado["erros"].append({"endpoint": "emendas", "erro": "Chave TRANSPARENCIA_API_KEY inválida ou expirada (401)."})
                    break
                if resp.status_code != 200:
                    resultado["erros"].append({"endpoint": "emendas", "erro": f"HTTP {resp.status_code} (ano {ano})"})
                    continue
                body = resp.json()
                itens = body if isinstance(body, list) else (body.get("data") or body.get("content") or [])
                for it in itens:
                    if _localidade_confere(it, municipio_nome, uf):
                        resultado["propostas"].append(_normalizar_emenda_transparencia(it, cnpj))
                    else:
                        descartadas += 1
            except Exception as exc:
                resultado["erros"].append({"endpoint": "emendas", "erro": str(exc)[:160]})

    resultado["descartadas_outra_localidade"] = descartadas
    logger.info("InvestSUS (Transparência CGU): %d emendas do município, %d de outras localidades descartadas",
                len(resultado["propostas"]), descartadas)
    return resultado
