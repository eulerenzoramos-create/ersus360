"""
InvestSUS — Monitoramento de Execução da Proposta (tela "Monitoramento de Emendas").

Regras copiadas do próprio InvestSUS (módulo público monitoramento, lido em 27/11/2026):
- A lista traz só propostas na situação "Proposta Paga" (idSituacaoProposta 67), a partir de 2025.
- Cor da linha: statusExecucao "T" → finalizada; stAtualizacao "A" → atualizada; "P" → desatualizada;
  sem dtOperacao → desatualizada; senão atualizada se a última operação tem até 30 dias.
- Formulário: execucaoIniciada (S/N); se N → data provável obrigatória, hoje ou futura;
  se S → statusExecucao TOTAL (percentual 100 e data de finalização não futura, gravada como
  dataProvavelFinalizacao) ou PARCIAL (percentual 1–100 e data provável hoje ou futura).

Funções puras (sem banco) para serem testadas isoladamente.
"""
from __future__ import annotations

import re
from datetime import date, datetime, timedelta, timezone

INVESTSUS_API = "https://investsus-backend-prd.saude.gov.br/api"
URL_TELA = "https://investsus.saude.gov.br/monitoramento"
SITUACAO_PROPOSTA_PAGA = 67
ANO_INICIAL = 2025
DIAS_VALIDADE = 30          # o InvestSUS considera atualizada até 30 dias após a última operação
DIAS_AVISO_VENCER = 7       # o ERSUS360 avisa quando faltam 7 dias ou menos

FINALIZADA, ATUALIZADA, DESATUALIZADA = "finalizada", "atualizada", "desatualizada"
ROTULO_STATUS = {FINALIZADA: "Finalizada", ATUALIZADA: "Atualizada", DESATUALIZADA: "Desatualizada"}


def so_digitos(v) -> str:
    return re.sub(r"\D", "", str(v or ""))


def para_datetime(v) -> datetime | None:
    """dtOperacao pode vir como ISO, dd/mm/aaaa, ou milissegundos (Java)."""
    if v in (None, ""):
        return None
    if isinstance(v, datetime):
        return v.replace(tzinfo=None)
    if isinstance(v, (int, float)):
        try:
            return datetime.fromtimestamp(v / 1000 if v > 1e11 else v, tz=timezone.utc).replace(tzinfo=None)
        except (OverflowError, OSError, ValueError):
            return None
    s = str(v).strip()
    if re.fullmatch(r"\d{2}/\d{2}/\d{4}.*", s):
        try:
            return datetime.strptime(s[:10], "%d/%m/%Y")
        except ValueError:
            return None
    try:
        d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return d.astimezone(timezone.utc).replace(tzinfo=None) if d.tzinfo else d
    except ValueError:
        return None


def para_data(v) -> date | None:
    if isinstance(v, date) and not isinstance(v, datetime):
        return v
    d = para_datetime(v)
    return d.date() if d else None


def _sub(obj, campo: str):
    """Lê 'tipoProposta.descricao' de dicts aninhados."""
    for parte in campo.split("."):
        if not isinstance(obj, dict):
            return None
        obj = obj.get(parte)
    return obj


def normalizar_item(item: dict) -> dict | None:
    """Linha de /monitoramento/paginado → campos do ERSUS360. Sem número de proposta → None."""
    numero = so_digitos(item.get("numero") or item.get("nuProposta") or item.get("numeroProposta"))
    if not numero:
        return None
    exercicio = item.get("anoExercicio") or item.get("ano")
    try:
        exercicio = int(str(exercicio)[:4]) if exercicio else exercicio_do_numero(numero)
    except ValueError:
        exercicio = exercicio_do_numero(numero)
    try:
        valor = float(item.get("valor") or 0)
    except (TypeError, ValueError):
        valor = 0.0
    tp_id = _sub(item, "tipoProposta.id")
    return {
        "numero_proposta": numero,
        "co_proposta": str(item.get("coProposta")) if item.get("coProposta") not in (None, "") else None,
        "exercicio": exercicio,
        "tipo_recurso": _sub(item, "tipoRecurso.descricao"),
        "tipo_proposta": _sub(item, "tipoProposta.descricao"),
        "tipo_proposta_id": int(tp_id) if isinstance(tp_id, (int, float)) or (isinstance(tp_id, str) and tp_id.isdigit()) else None,
        "situacao": _sub(item, "situacao.descricaoExterna") or _sub(item, "situacao.descricao"),
        "instrumento": str(item["descricaoInstrumento"]) if item.get("descricaoInstrumento") not in (None, "") else None,
        "valor": valor,
        "st_atualizacao": (str(item["stAtualizacao"]).strip().upper()[:5] if item.get("stAtualizacao") else None),
        "status_execucao_lista": (str(item["statusExecucao"]).strip().upper()[:20] if item.get("statusExecucao") else None),
        "dt_operacao": para_datetime(item.get("dtOperacao")),
    }


def exercicio_do_numero(numero: str) -> int | None:
    """Número InvestSUS: …AAAA00 no fim (ex.: 36000746409202600 → 2026)."""
    n = so_digitos(numero)
    if len(n) >= 6:
        try:
            ano = int(n[-6:-2])
            return ano if 2000 <= ano <= 2100 else None
        except ValueError:
            return None
    return None


def normalizar_monitoramento(m) -> dict:
    """Resposta de /monitoramento/projeto/{co} → campos do formulário oficial."""
    if not isinstance(m, dict):
        return {"execucao_iniciada": None, "status_execucao": None, "percentual_execucao": None,
                "data_provavel_finalizacao": None}
    ini = str(m.get("execucaoIniciada") or "").strip().upper()[:1] or None
    st = str(m.get("statusExecucao") or "").strip().upper() or None
    if st == "T":
        st = "TOTAL"
    elif st == "P":
        st = "PARCIAL"
    try:
        pct = float(m["percentualExecucao"]) if m.get("percentualExecucao") not in (None, "") else None
    except (TypeError, ValueError):
        pct = None
    return {
        "execucao_iniciada": ini if ini in ("S", "N") else None,
        "status_execucao": st if st in ("TOTAL", "PARCIAL") else None,
        "percentual_execucao": pct,
        "data_provavel_finalizacao": para_data(m.get("dataProvavelFinalizacao")),
    }


def status_monitoramento(st_atualizacao: str | None, status_execucao_lista: str | None,
                         dt_operacao: datetime | None, agora: datetime | None = None) -> str:
    """Mesma regra de cor da tela do InvestSUS (calcularClasseLinha)."""
    agora = agora or datetime.utcnow()
    if (status_execucao_lista or "").upper() in ("T", "TOTAL"):
        return FINALIZADA
    if (st_atualizacao or "").upper() == "A":
        return ATUALIZADA
    if (st_atualizacao or "").upper() == "P":
        return DESATUALIZADA
    if not dt_operacao:
        return DESATUALIZADA
    return ATUALIZADA if (agora - dt_operacao).days <= DIAS_VALIDADE else DESATUALIZADA


def prazos(status: str, dt_operacao: datetime | None, data_provavel: date | None,
           status_execucao: str | None, agora: datetime | None = None) -> dict:
    """Dias desde a última atualização, dias até vencer os 30 dias e data provável vencida."""
    agora = agora or datetime.utcnow()
    dias_desde = (agora - dt_operacao).days if dt_operacao else None
    vence_em = None
    if status == ATUALIZADA and dt_operacao:
        vence_em = DIAS_VALIDADE - dias_desde
    data_vencida = bool(
        status != FINALIZADA and data_provavel and status_execucao != "TOTAL" and data_provavel < agora.date())
    return {
        "dias_desde_atualizacao": dias_desde,
        "vence_em_dias": vence_em,
        "data_limite_atualizacao": (dt_operacao + timedelta(days=DIAS_VALIDADE)).date().isoformat() if dt_operacao else None,
        "a_vencer": vence_em is not None and 0 <= vence_em <= DIAS_AVISO_VENCER,
        "data_provavel_vencida": data_vencida,
    }


def validar_registro(d: dict, hoje: date | None = None) -> dict:
    """Valida o preenchimento com as mesmas regras do formulário do InvestSUS.
    Retorna os campos normalizados; levanta ValueError com a mensagem do InvestSUS."""
    hoje = hoje or date.today()
    ini = str(d.get("execucao_iniciada") or "").upper()
    if ini not in ("S", "N"):
        raise ValueError("Informe se a execução foi iniciada (Sim ou Não).")
    obs = (d.get("observacao") or "").strip()[:2000] or None
    if ini == "N":
        prov = para_data(d.get("data_provavel_finalizacao"))
        if not prov:
            raise ValueError("Preencha os campos obrigatórios.")
        if prov < hoje:
            raise ValueError("Data provável deve ser hoje ou futura.")
        return {"execucao_iniciada": "N", "status_execucao": None, "percentual_execucao": None,
                "data_provavel_finalizacao": prov, "observacao": obs}
    st = str(d.get("status_execucao") or "").upper()
    if st not in ("TOTAL", "PARCIAL"):
        raise ValueError("Preencha os campos obrigatórios.")
    if st == "TOTAL":
        fim = para_data(d.get("data_finalizacao") or d.get("data_provavel_finalizacao"))
        if not fim:
            raise ValueError("Preencha os campos obrigatórios.")
        if fim > hoje:
            raise ValueError("A data de finalização não pode ser futura.")
        return {"execucao_iniciada": "S", "status_execucao": "TOTAL", "percentual_execucao": 100.0,
                "data_provavel_finalizacao": fim, "observacao": obs}
    pct = d.get("percentual_execucao")
    if pct in (None, ""):
        raise ValueError("Percentual de execução é obrigatório.")
    try:
        pct = float(str(pct).replace(",", "."))
    except ValueError:
        raise ValueError("Percentual de execução deve estar entre 1 e 100.")
    if not 1 <= pct <= 100:
        raise ValueError("Percentual de execução deve estar entre 1 e 100.")
    prov = para_data(d.get("data_provavel_finalizacao"))
    if not prov:
        raise ValueError("Preencha os campos obrigatórios.")
    if prov < hoje:
        raise ValueError("Data provável deve ser hoje ou futura.")
    return {"execucao_iniciada": "S", "status_execucao": "PARCIAL", "percentual_execucao": pct,
            "data_provavel_finalizacao": prov, "observacao": obs}


def descrever(execucao_iniciada, status_execucao, percentual, data_provavel) -> str:
    if execucao_iniciada == "N":
        return f"Não iniciada · previsão {data_provavel.strftime('%d/%m/%Y') if data_provavel else '—'}"
    if status_execucao == "TOTAL":
        return f"Executada 100% · finalizada em {data_provavel.strftime('%d/%m/%Y') if data_provavel else '—'}"
    if status_execucao == "PARCIAL":
        p = f"{percentual:.0f}%" if percentual is not None else "—"
        return f"Parcial {p} · previsão {data_provavel.strftime('%d/%m/%Y') if data_provavel else '—'}"
    return "Sem monitoramento cadastrado"


def anos_monitorados(ano_atual: int | None = None) -> list[int]:
    """Ano atual e anterior, nunca antes do início do Monitoramento no InvestSUS."""
    ano = ano_atual or datetime.now().year
    return [a for a in (ano - 1, ano) if a >= ANO_INICIAL]


async def coletar_servidor(cnpj: str, ibge7: str, cred: dict[str, str]) -> dict:
    """Mesma leitura que o navegador faz, feita pelo servidor com o acesso de integração do
    município (tenancy.credenciais, sistema INVESTSUS). Devolve o payload de /sincronizar
    ou levanta RuntimeError com o motivo (sem acesso, sessão expirada, portal fora do ar)."""
    import asyncio
    import httpx
    from services.investsus_scraper import _cabecalhos_contexto, autenticar_cliente

    cnpj = so_digitos(cnpj)
    if len(cnpj) != 14:
        raise RuntimeError("CNPJ do Fundo Municipal de Saúde não cadastrado para o município.")
    erros: list = []
    headers = {**_cabecalhos_contexto(ibge7, cnpj), "Content-Type": "application/json"}
    itens: list[dict] = []
    resumos: dict = {}
    async with httpx.AsyncClient(follow_redirects=True, headers=headers, timeout=45.0) as client:
        if await autenticar_cliente(client, cred, erros):
            raise RuntimeError("; ".join(e["erro"] for e in erros))
        for ano in anos_monitorados():
            for pagina in range(1, 21):
                r = await client.post(f"{INVESTSUS_API}/monitoramento/paginado", json={
                    "filter": {"idSituacaoProposta": SITUACAO_PROPOSTA_PAGA, "ano": ano, "cnpj": cnpj},
                    "pageNumber": pagina, "pageSize": 100})
                if r.status_code in (401, 403):
                    raise RuntimeError(f"InvestSUS recusou o acesso ({r.status_code}): sessão expirada ou sem permissão.")
                r.raise_for_status()
                d = r.json()
                lote = d if isinstance(d, list) else (d.get("items") or [])
                itens.extend(x for x in lote if isinstance(x, dict))
                total = len(lote) if isinstance(d, list) else int(d.get("total") or len(lote))
                if not lote or len(lote) < 100 or len(itens) >= total:
                    break
            try:
                r = await client.get(f"{INVESTSUS_API}/geral/monitoramento/tipos-monitoramento/valores",
                                     params={"idSituacaoProposta": SITUACAO_PROPOSTA_PAGA, "ano": ano, "cnpj": cnpj})
                if r.status_code == 200:
                    resumos[str(ano)] = r.json()
            except Exception:  # o resumo do gráfico é opcional
                pass

        sem = asyncio.Semaphore(4)

        async def projeto(co):
            async with sem:
                try:
                    r = await client.get(f"{INVESTSUS_API}/monitoramento/projeto/{co}")
                    if r.status_code == 200:
                        return r.json() if r.content else {}
                except Exception:
                    return None
                return None

        forms = await asyncio.gather(*(projeto(i.get("coProposta")) if i.get("coProposta") not in (None, "")
                                       else asyncio.sleep(0, result=None) for i in itens))
    return {"anos": anos_monitorados(), "resumos": resumos,
            "itens": [{"item": i, "monitoramento": f} for i, f in zip(itens, forms)]}
