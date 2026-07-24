# backend/services/fns_portal_service.py
# Integração com Portal da Transparência CGU — Transferências FNS → Apuí/AM
import os
import httpx
import json
import uuid
from datetime import datetime
from pathlib import Path

TRANSPARENCIA_API_KEY = os.getenv("TRANSPARENCIA_API_KEY", "")
IBGE_APUI = "1300144"
BASE_URL   = "https://api.portaldatransparencia.gov.br/api-de-dados"
DATA_FILE  = Path(__file__).parent.parent / "data" / "repasses_apui.json"

MESES_ABREV = {
    1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
    7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez",
}

# Mapeamento: palavras-chave no nome do órgão/programa → bloco
BLOCO_KEYWORDS = {
    "ATENCAO PRIMARIA":            "Atenção Primária",
    "ATENÇAO PRIMÁRIA":            "Atenção Primária",
    "APS":                         "Atenção Primária",
    "PREVINE":                     "Atenção Primária",
    "FAEC":                        "Atenção Primária",
    "VIGILANCIA":                  "Vigilância em Saúde",
    "VIGILÂNCIA":                  "Vigilância em Saúde",
    "EPIDEMIOLOGICA":              "Vigilância em Saúde",
    "EPIDEMIOLÓGICA":              "Vigilância em Saúde",
    "MEDIA E ALTA":                "Média e Alta Complexidade",
    "MÉDIA E ALTA":                "Média e Alta Complexidade",
    "MAC":                         "Média e Alta Complexidade",
    "HOSPITALAR":                  "Média e Alta Complexidade",
    "AMBULATORIAL":                "Média e Alta Complexidade",
    "SAUDE MENTAL":                "Saúde Mental",
    "SAÚDE MENTAL":                "Saúde Mental",
    "RAPS":                        "Saúde Mental",
    "CAPS":                        "Saúde Mental",
    "PSICOSSOCIAL":                "Saúde Mental",
}

def _inferir_bloco(texto: str) -> str:
    txt = texto.upper()
    for kw, bloco in BLOCO_KEYWORDS.items():
        if kw in txt:
            return bloco
    return "Atenção Primária"  # default para transfers não classificadas

def _formatar_data_br(data_iso: str | None) -> str | None:
    if not data_iso:
        return None
    try:
        d = datetime.fromisoformat(data_iso[:10])
        return d.strftime("%d/%m/%Y")
    except Exception:
        return data_iso

def _competencia(mes: int, ano: int) -> str:
    return f"{MESES_ABREV[mes]}/{ano}"

def carregar_repasses() -> dict:
    if DATA_FILE.exists():
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return {"municipio": "Apuí", "uf": "AM", "ibge": IBGE_APUI,
            "cnpj_fms": "05.895.603/0001-79", "ultima_sincronizacao": None,
            "fonte_dados": "manual", "repasses": []}

def salvar_repasses(data: dict) -> None:
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

async def sincronizar_portal_transparencia(ano: int = 2026) -> dict:
    """
    Busca transferências reais FNS → Apuí/AM via Portal da Transparência CGU.
    Requer env var TRANSPARENCIA_API_KEY (obter em: portaldatransparencia.gov.br/api).
    """
    if not TRANSPARENCIA_API_KEY:
        return {
            "ok": False,
            "erro": "TRANSPARENCIA_API_KEY não configurada. Adicione a chave no Railway env vars.",
            "instrucao": "Acesse portaldatransparencia.gov.br/api-de-dados/swagger-ui.html, "
                         "registre-se e adicione a chave como TRANSPARENCIA_API_KEY no Railway.",
        }

    headers = {
        "chave-api-dados": TRANSPARENCIA_API_KEY,
        "Accept": "application/json",
    }

    data = carregar_repasses()
    repasses_existentes = {r["id"]: r for r in data.get("repasses", [])}
    novos_repasses: list[dict] = []
    erros: list[str] = []

    mes_atual = datetime.now().month

    async with httpx.AsyncClient(timeout=15) as client:
        for mes in range(1, mes_atual + 2):  # até mês seguinte
            if mes > 12:
                break
            mes_ano = f"{mes:02d}{ano}"
            try:
                # Endpoint: transferências para município por período
                resp = await client.get(
                    f"{BASE_URL}/transferencias",
                    params={
                        "mesAnoInicio": mes_ano,
                        "mesAnoFim":    mes_ano,
                        "codigoIbge":   IBGE_APUI,
                        "pagina":       1,
                    },
                    headers=headers,
                )
                if resp.status_code == 401:
                    return {"ok": False, "erro": "Chave API inválida ou expirada.",
                            "instrucao": "Verifique TRANSPARENCIA_API_KEY no Railway."}

                if resp.status_code != 200:
                    erros.append(f"{_competencia(mes, ano)}: HTTP {resp.status_code}")
                    continue

                transferencias = resp.json()
                if not isinstance(transferencias, list):
                    transferencias = transferencias.get("data", [])

                for t in transferencias:
                    # Filtra apenas transferências do Ministério da Saúde / FNS
                    orgao = str(t.get("nomeOrgao", "") or t.get("orgao", {}).get("nome", "")).upper()
                    if "SAUDE" not in orgao and "SAÚDE" not in orgao and "FNS" not in orgao:
                        continue

                    valor = float(t.get("valor", 0) or t.get("valorTransferido", 0) or 0)
                    if valor <= 0:
                        continue

                    nome_acao = str(t.get("nomeAcao", "") or t.get("acao", {}).get("nome", ""))
                    bloco = _inferir_bloco(f"{orgao} {nome_acao}")
                    data_transf = t.get("dataTransferencia") or t.get("data")
                    portaria = t.get("numeroPortaria") or t.get("portaria", "")

                    novo = {
                        "id": f"api-{ano}{mes:02d}-{uuid.uuid4().hex[:6]}",
                        "competencia": _competencia(mes, ano),
                        "bloco": bloco,
                        "programa": nome_acao or f"{bloco} — FNS Fundo a Fundo",
                        "valor_previsto": valor,
                        "valor_creditado": valor,
                        "data_prevista": f"15/{mes:02d}/{ano}",
                        "data_credito": _formatar_data_br(data_transf),
                        "status": "creditado",
                        "portaria": portaria or "FNS — Portal da Transparência CGU",
                        "observacao": f"Dado real — Portal da Transparência CGU. IBGE {IBGE_APUI}.",
                        "fonte": "portal_transparencia",
                    }
                    novos_repasses.append(novo)

            except httpx.TimeoutException:
                erros.append(f"{_competencia(mes, ano)}: timeout na API")
            except Exception as ex:
                erros.append(f"{_competencia(mes, ano)}: {str(ex)[:80]}")

    # Mescla: mantém edições manuais, adiciona/atualiza dados da API
    ids_api = {r["id"] for r in novos_repasses}
    manuais = [r for r in data["repasses"] if r.get("fonte") == "manual"]
    finais = manuais + novos_repasses

    data["repasses"] = finais
    data["ultima_sincronizacao"] = datetime.now().isoformat()
    data["fonte_dados"] = "portal_transparencia" if novos_repasses else "manual"
    salvar_repasses(data)

    return {
        "ok": True,
        "novos_registros": len(novos_repasses),
        "erros": erros,
        "ultima_sincronizacao": data["ultima_sincronizacao"],
        "aviso": "Dados importados do Portal da Transparência CGU — Transferências FNS → Apuí/AM (IBGE 1300144).",
    }
