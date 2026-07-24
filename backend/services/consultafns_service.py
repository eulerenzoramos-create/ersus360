# backend/services/consultafns_service.py
# Integração com consultafns.saude.gov.br — Fundo a Fundo — Apuí/AM
import httpx
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

IBGE_APUI   = "1300144"
IBGE_CURTO  = "130014"   # sem o dígito verificador (usado pelo FNS)
CNPJ_FMS    = "12.834.320/0001-26"
ANO_BASE    = 2026

MESES = {
    1:"Janeiro",2:"Fevereiro",3:"Marco",4:"Abril",5:"Maio",6:"Junho",
    7:"Julho",8:"Agosto",9:"Setembro",10:"Outubro",11:"Novembro",12:"Dezembro",
}
MESES_ABREV = {
    1:"Jan",2:"Fev",3:"Mar",4:"Abr",5:"Mai",6:"Jun",
    7:"Jul",8:"Ago",9:"Set",10:"Out",11:"Nov",12:"Dez",
}

# API interna do consultafns.saude.gov.br (descoberta por inspeção de rede)
FNS_API_BASE = "https://consultafns.saude.gov.br/api"

BLOCO_MAP = {
    "ATENCAO PRIMARIA":             "Atencao Primaria",
    "ATENÇÃO PRIMÁRIA":             "Atencao Primaria",
    "PISO DE ATENCAO PRIMARIA":     "Atencao Primaria",
    "ESF":                          "Atencao Primaria",
    "APS":                          "Atencao Primaria",
    "ACS":                          "Atencao Primaria",
    "AGENTES COMUNITARIOS":         "Atencao Primaria",
    "EMULTI":                       "Atencao Primaria",
    "SAUDE BUCAL":                  "Atencao Primaria",
    "MEDIA E ALTA":                 "Media e Alta Complexidade",
    "MÉDIA E ALTA":                 "Media e Alta Complexidade",
    "MAC":                          "Media e Alta Complexidade",
    "PROCEDIMENTOS NO MAC":         "Media e Alta Complexidade",
    "VIGILANCIA":                   "Vigilancia em Saude",
    "VIGILÂNCIA":                   "Vigilancia em Saude",
    "ACE":                          "Vigilancia em Saude",
    "ENDEMIAS":                     "Vigilancia em Saude",
    "FARMACEUTICA":                 "Assistencia Farmaceutica",
    "FARMACÊUTICA":                 "Assistencia Farmaceutica",
    "CBAF":                         "Assistencia Farmaceutica",
    "SAUDE MENTAL":                 "Saude Mental",
    "SAÚDE MENTAL":                 "Saude Mental",
    "RAPS":                         "Saude Mental",
    "CAPS":                         "Saude Mental",
    "PSICOSSOCIAL":                 "Saude Mental",
}

def _inferir_bloco(texto: str) -> str:
    up = texto.upper()
    for kw, bloco in BLOCO_MAP.items():
        if kw in up:
            return bloco
    return "Atencao Primaria"

def _fmt_data(iso: str | None) -> str | None:
    if not iso:
        return None
    try:
        d = datetime.fromisoformat(iso[:10])
        return d.strftime("%d/%m/%Y")
    except Exception:
        return iso

def _competencia(mes: int, ano: int) -> str:
    return f"{MESES_ABREV[mes]}/{ano}"

def _status_from_valores(autorizado: float, pago: float) -> str:
    if pago >= autorizado and autorizado > 0:
        return "creditado"
    if pago > 0:
        return "parcial"
    return "previsto"

async def buscar_repasses_fns(ano: int = ANO_BASE, mes: int | None = None) -> dict:
    """
    Tenta buscar dados da API interna do consultafns.saude.gov.br.
    Retorna dict com lista de repasses no formato do sistema.
    """
    meses_alvo = [mes] if mes else list(range(1, 13))
    repasses = []
    erros = []

    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "pt-BR,pt;q=0.9",
        "Origin": "https://consultafns.saude.gov.br",
        "Referer": "https://consultafns.saude.gov.br/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }

    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        for m in meses_alvo:
            if m > datetime.now().month + 1 and ano >= datetime.now().year:
                continue
            try:
                # Endpoint 1: consulta detalhada por ação (fundo a fundo)
                resp = await client.get(
                    f"{FNS_API_BASE}/repasse/detalhada/acao",
                    params={
                        "ibge":        IBGE_CURTO,
                        "ano":         str(ano),
                        "mes":         str(m),
                        "tipoConsulta": "1",  # 1 = Fundo a Fundo
                    },
                    headers=headers,
                )

                if resp.status_code == 200:
                    dados = resp.json()
                    # Normaliza diferentes formatos de resposta
                    itens = dados if isinstance(dados, list) else dados.get("itens", dados.get("data", dados.get("resultado", [])))

                    for item in itens:
                        bloco_raw  = str(item.get("dsBloco", item.get("bloco", item.get("nmBloco", ""))))
                        acao_raw   = str(item.get("dsAcao", item.get("acao", item.get("nmAcao", ""))))
                        programa   = str(item.get("dsPrograma", item.get("programa", item.get("nmPrograma", acao_raw))))
                        val_auto   = float(item.get("vlAutorizado", item.get("valorAutorizado", item.get("valor", 0))) or 0)
                        val_pago   = float(item.get("vlPago", item.get("valorPago", item.get("valorCreditado", 0))) or 0)
                        dt_pag     = item.get("dtPagamento", item.get("dataPagamento", item.get("dataCreditado")))
                        portaria   = str(item.get("dsPortaria", item.get("portaria", bloco_raw)))

                        if val_auto <= 0:
                            continue

                        status = _status_from_valores(val_auto, val_pago)
                        bloco  = _inferir_bloco(f"{bloco_raw} {acao_raw}")

                        repasses.append({
                            "id":              f"fns-{ano}{m:02d}-{len(repasses):03d}",
                            "competencia":     _competencia(m, ano),
                            "bloco":           bloco,
                            "programa":        programa or acao_raw or bloco_raw,
                            "valor_previsto":  val_auto,
                            "valor_creditado": val_pago if val_pago > 0 else None,
                            "data_prevista":   f"15/{m:02d}/{ano}",
                            "data_credito":    _fmt_data(dt_pag),
                            "status":          status,
                            "portaria":        portaria,
                            "observacao":      f"Dado real — consultafns.saude.gov.br. {MESES.get(m,'')}/{ano}.",
                            "fonte":           "fns_real",
                        })

                elif resp.status_code == 404:
                    erros.append(f"{_competencia(m, ano)}: sem dados no FNS")
                else:
                    # Tenta endpoint alternativo
                    resp2 = await client.get(
                        f"{FNS_API_BASE}/transferencia/municipio",
                        params={"codigoIbge": IBGE_CURTO, "ano": ano, "mes": m},
                        headers=headers,
                    )
                    if resp2.status_code == 200:
                        dados2 = resp2.json()
                        itens2 = dados2 if isinstance(dados2, list) else dados2.get("data", [])
                        for item in itens2:
                            val = float(item.get("valor", 0) or 0)
                            if val <= 0:
                                continue
                            bloco_r = str(item.get("bloco", ""))
                            repasses.append({
                                "id":              f"fns-{ano}{m:02d}-{len(repasses):03d}",
                                "competencia":     _competencia(m, ano),
                                "bloco":           _inferir_bloco(bloco_r),
                                "programa":        str(item.get("programa", bloco_r)),
                                "valor_previsto":  val,
                                "valor_creditado": None,
                                "data_prevista":   f"15/{m:02d}/{ano}",
                                "data_credito":    None,
                                "status":          "previsto",
                                "portaria":        str(item.get("portaria", "")),
                                "observacao":      f"consultafns.saude.gov.br — {MESES.get(m,'')}/{ano}.",
                                "fonte":           "fns_real",
                            })
                    else:
                        erros.append(f"{_competencia(m, ano)}: HTTP {resp.status_code} / {resp2.status_code}")

            except httpx.TimeoutException:
                erros.append(f"{_competencia(m, ano)}: timeout")
            except Exception as ex:
                erros.append(f"{_competencia(m, ano)}: {str(ex)[:80]}")

    return {
        "ok":        len(repasses) > 0,
        "repasses":  repasses,
        "erros":     erros,
        "total":     len(repasses),
        "fonte":     "consultafns.saude.gov.br",
        "timestamp": datetime.now().isoformat(),
    }
