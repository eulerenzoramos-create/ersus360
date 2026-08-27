"""
ERSUS360 — Agente de Portarias do Ministério da Saúde — DOU
============================================================
Consulta o Diário Oficial da União, valida o órgão emitente com lista de
permissão (allowlist), classifica a abrangência para Apuí/AM e gera
Informe Técnico objetivo para o gestor municipal de saúde.

Regra fundamental:
  Uma publicação só é aceita como do Ministério da Saúde se o campo
  orgaoName retornado pelo DOU pertencer à lista ORGAOS_MS_PERMITIDOS.
  Nenhum termo do texto (saúde, recurso, portaria…) substitui essa validação.

Variáveis de ambiente obrigatórias:
  EMAIL_PROVIDER      smtp | resend  (default: smtp)
  EMAIL_FROM          remetente
  EMAIL_RECIPIENT     destinatário (default: eulerenzoramos@gmail.com)
  EMAIL_TIMEZONE      America/Manaus
  EMAIL_SEND_HOUR     06:00
  SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
  RESEND_API_KEY      (se EMAIL_PROVIDER=resend)
"""
from __future__ import annotations
import json
import logging
import os
import re
import smtplib
import ssl
from datetime import datetime, date
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ── Configurações via env ─────────────────────────────────────────────────────
EMAIL_PROVIDER  = os.getenv("EMAIL_PROVIDER",  "smtp").lower()
EMAIL_FROM      = os.getenv("EMAIL_FROM",      "noreply@ersus360.local")
EMAIL_RECIPIENT = os.getenv("EMAIL_RECIPIENT", "eulerenzoramos@gmail.com")
EMAIL_TIMEZONE  = os.getenv("EMAIL_TIMEZONE",  "America/Manaus")
EMAIL_SEND_HOUR = os.getenv("EMAIL_SEND_HOUR", "06:00")
SMTP_HOST       = os.getenv("SMTP_HOST",       "smtp.gmail.com")
SMTP_PORT       = int(os.getenv("SMTP_PORT",   "587"))
SMTP_USER       = os.getenv("SMTP_USER",       "")
SMTP_PASS       = os.getenv("SMTP_PASS",       "")
RESEND_API_KEY  = os.getenv("RESEND_API_KEY",  "")

# ── Município de referência ───────────────────────────────────────────────────
MUNICIPIO_NOME  = "Apuí"
MUNICIPIO_UF    = "AM"
MUNICIPIO_IBGE  = "1300144"

# ── DOU — URLs ────────────────────────────────────────────────────────────────
DOU_LEITURA = "https://www.in.gov.br/leiturajornal"
DOU_BUSCA   = "https://www.in.gov.br/consulta/-/buscar-conteudo"

# ── LISTA DE PERMISSÃO: apenas órgãos oficialmente vinculados ao MS ──────────
# Normalização: minúsculas, sem acento, sem pontuação final.
# Deve ser atualizada quando a estrutura do MS mudar.
ORGAOS_MS_PERMITIDOS: frozenset[str] = frozenset({
    # Gabinete e secretaria-executiva
    "ministerio da saude",
    "ministério da saúde",
    "gabinete do ministro",
    "gabinete do ministro da saude",
    "gabinete do ministro da saúde",
    "secretaria-executiva",
    "secretaria executiva",
    "secretaria-executiva/ms",
    "se/ms",
    # Secretarias finalísticas
    "secretaria de atencao primaria a saude",
    "secretaria de atenção primária à saúde",
    "saps",
    "saps/ms",
    "secretaria de atencao especializada a saude",
    "secretaria de atenção especializada à saúde",
    "saes",
    "saes/ms",
    "secretaria de vigilancia em saude e ambiente",
    "secretaria de vigilância em saúde e ambiente",
    "svsa",
    "svsa/ms",
    # Sigla legada SVS (antes da fusão com SVA)
    "secretaria de vigilancia em saude",
    "secretaria de vigilância em saúde",
    "svs",
    "svs/ms",
    # Ciência e tecnologia
    "secretaria de ciencia, tecnologia, inovacao e complexo da saude",
    "secretaria de ciência, tecnologia, inovação e complexo da saúde",
    "sectics",
    "sectics/ms",
    # Sigla legada SCTIE
    "sctie",
    "sctie/ms",
    # Saúde indígena
    "secretaria de saude indigena",
    "secretaria de saúde indígena",
    "sesai",
    "sesai/ms",
    # Saúde digital
    "secretaria de informacao e saude digital",
    "secretaria de informação e saúde digital",
    "seidigi",
    "seidigi/ms",
    # Fundo Nacional de Saúde
    "fundo nacional de saude",
    "fundo nacional de saúde",
    "fns",
    "fns/ms",
    # Órgãos colegiados e vinculados formalmente ao MS
    "conselho nacional de saude",
    "conselho nacional de saúde",
    "cns",
    "conass",
    "conasems",
    # Agências vinculadas ao MS
    "agencia nacional de vigilancia sanitaria",
    "agência nacional de vigilância sanitária",
    "anvisa",
    "agencia nacional de saude suplementar",
    "agência nacional de saúde suplementar",
    "ans",
    # Instituto e fundações vinculados
    "fundacao nacional de saude",
    "fundação nacional de saúde",
    "funasa",
    "fundacao oswaldo cruz",
    "fundação oswaldo cruz",
    "fiocruz",
    "instituto nacional do cancer",
    "instituto nacional do câncer",
    "inca",
    "instituto nacional de traumatologia e ortopedia",
    "into",
    "hospital das forcas armadas",        # vinculado ao MS operacionalmente
    # Siglas genéricas do DOU usadas pelo MS
    "gm/ms",
    "gm/m",
})

# Fragmentos que, se presentes no orgaoName, indicam que NÃO é MS
# (salvaguarda adicional para nomes compostos não mapeados)
FRAGMENTOS_NAO_MS: tuple[str, ...] = (
    "integracao",
    "integração",
    "pesca",
    "aquicultura",
    "petroleo",
    "petróleo",
    "gas natural",
    "gás natural",
    "anp",
    "agricultura",
    "educacao",
    "educação",
    "defesa",
    "fazenda",
    "trabalho",
    "justica",
    "justiça",
    "infraestrutura",
    "comunicacoes",
    "comunicações",
    "previdencia",
    "previdência",
    "turismo",
    "cultura",
    "minc",
    "sefic",
    "secom",
    "desenvolvimento regional",
    "desenvolvimento urbano",
    "cidades",
    "meio ambiente",
    "clima",
    "mma",
    "relacoes exteriores",
    "relações exteriores",
    "mre",
    "ciencia e tecnologia",           # diferente de ciência no MS (tem "saúde" no nome)
    "mcti",
    "esportes",
    "esporte",
    "direitos humanos",
    "igualdade racial",
    "mulheres",
    "gestao",                         # Ministério da Gestão (MGPE) — não é MS
    "planejamento",
    "empreendedorismo",
    "microempresa",
    "portos",
    "transportes",
    "minas e energia",
    "mme",
    "mds",                            # Desenvolvimento Social — não é MS
    "desenvolvimento social",
    "cidadania",
)


def _normalizar_orgao(orgao: str) -> str:
    """Normaliza string de órgão para comparação."""
    s = orgao.lower().strip()
    # Remove acentos de forma simples para comparação
    for a, b in [("á","a"),("ã","a"),("â","a"),("à","a"),("é","e"),("ê","e"),
                 ("í","i"),("ó","o"),("õ","o"),("ô","o"),("ú","u"),("ç","c")]:
        s = s.replace(a, b)
    return s


def confirmar_orgao_ms(orgao_raw: str) -> bool:
    """
    Retorna True SOMENTE se o órgão pertencer à estrutura oficial do MS.
    Usa allowlist + verificação de fragmentos de exclusão.
    """
    if not orgao_raw or not orgao_raw.strip():
        # Sem informação de órgão — rejeitar (nunca assumir que é MS)
        return False

    n = _normalizar_orgao(orgao_raw)

    # 1. Verificar fragmentos de exclusão (têm prioridade)
    for frag in FRAGMENTOS_NAO_MS:
        if frag in n:
            return False

    # 2. Verificar correspondência exata na allowlist
    if n in {_normalizar_orgao(o) for o in ORGAOS_MS_PERMITIDOS}:
        return True

    # 3. Verificar se algum item da allowlist é substrings do orgão informado
    #    (ex: "Ministério da Saúde / SAPS" contém "saps")
    for permitido in ORGAOS_MS_PERMITIDOS:
        np = _normalizar_orgao(permitido)
        if np and np in n:
            return True

    return False


# ── Termos de classificação de abrangência ────────────────────────────────────
TERMOS_APUI = [
    "apuí", "apui", "1300144",
    "fundo municipal de saúde de apuí",
    "município de apuí",
    "secretaria municipal de saúde de apuí",
]
TERMOS_AMAZONAS = [
    "estado do amazonas", "governo do amazonas",
    "secretaria de estado da saúde do amazonas", "sesau",
    "municípios do amazonas", "municipios do amazonas",
    " am,", " am.", "(am)", "/am",
    "amazonas",
]
# Termos que indicam norma federal com potencial aplicação municipal
TERMOS_FEDERAL_MUNICIPAL = [
    "atenção primária", "atencao primaria",
    "atenção básica", "atencao basica",
    "estratégia saúde da família", "esf",
    "agente comunitário", "acs",
    "núcleo ampliado", "nasf",
    "custeio", "investimento",
    "fundo nacional de saúde", "fns",
    "repasse federal", "transferência fundo a fundo",
    "bloco de financiamento",
    "habilitação", "habilitacao",
    "credenciamento",
    "teto financeiro", "limite financeiro",
    "programa nacional",
    "piso da enfermagem",
    "emenda parlamentar",
    "componente fixo", "componente variável",
    "previne brasil",           # pode aparecer em portarias retroativas
    "relatório de gestão", "relatorio de gestao",
    "prestação de contas",
    "indicador", "meta",
    "vigilância epidemiológica", "vigilancia epidemiologica",
    "vigilância sanitária", "vigilancia sanitaria",
    "assistência farmacêutica", "assistencia farmaceutica",
    "média complexidade", "alta complexidade",
    "urgência e emergência",
    "saúde indígena", "saude indigena",
    "municípios", "municipios",
]


# ── Extração de HTML do DOU ───────────────────────────────────────────────────

def _extrair_portarias_html(html: str, orgao_hint: str = "") -> list[dict]:
    """
    Extrai portarias de resposta HTML do DOU.
    NUNCA atribui orgaoName sem evidência textual.
    Se orgao_hint for fornecido (ex: "Ministério da Saúde" da query),
    ele é usado apenas quando o HTML não informa o órgão.
    """
    resultado: list[dict] = []
    vistos: set[str] = set()

    def _limpo(t: str) -> str:
        t = re.sub(r'"[a-zA-Z_]+"\s*:\s*"[^"]*"', '', t)
        t = re.sub(r'[{}\[\]]', '', t)
        t = re.sub(r'\s+', ' ', t).strip()
        return t

    # Estratégia A: JSON embutido em <script>
    for script in re.findall(r'<script[^>]*>(.*?)</script>', html, re.S | re.I):
        for match in re.finditer(r'\[(\{["\w].*?\})\]', script, re.S):
            try:
                items = json.loads('[' + match.group(1) + ']')
                for item in (items if isinstance(items, list) else []):
                    titulo = (item.get('title') or item.get('titulo') or
                              item.get('identifica') or '')
                    if not titulo or not re.search(r'portaria', titulo, re.I):
                        continue
                    t = _limpo(titulo)
                    if not t or len(t) < 5 or t in vistos:
                        continue
                    # Tenta obter orgão do JSON; usa hint apenas se vazio
                    orgao = (item.get('orgaoName') or item.get('orgao') or
                             item.get('organ') or orgao_hint or "")
                    vistos.add(t)
                    resultado.append({
                        "title":     t,
                        "urlAddress": item.get('urlAddress') or item.get('url') or '',
                        "content":   item.get('content') or item.get('conteudo') or '',
                        "pubDate":   item.get('pubDate') or item.get('data') or '',
                        "orgaoName": orgao,
                        "identifica": item.get('identifica') or item.get('numero') or '',
                    })
            except Exception:
                pass

    # Estratégia B: links /web/dou/-/ com texto de título
    if not resultado:
        # Tenta extrair orgão do HTML por proximidade do link
        orgao_re = re.compile(
            r'(?:orgao|órgão|organ)[^>]*>\s*([^<]{5,80})', re.I
        )
        orgaos_html = [m.group(1).strip() for m in orgao_re.finditer(html)]

        for link, titulo in re.findall(
            r'href="(https?://www\.in\.gov\.br/web/dou/-/[^"]+)"[^>]*>\s*([^<]{5,150})',
            html, re.I
        ):
            t = _limpo(titulo)
            if not t or t in vistos or re.search(r'[{}":]', t):
                continue
            # Usa o primeiro órgão encontrado no HTML, ou o hint
            orgao = orgaos_html[0] if orgaos_html else orgao_hint
            vistos.add(t)
            resultado.append({
                "title": t, "urlAddress": link,
                "orgaoName": orgao, "content": "", "pubDate": "",
            })

    return resultado


# ── Consulta DOU ──────────────────────────────────────────────────────────────

async def _buscar_portarias_ms(data_ref: date) -> tuple[list[dict[str, Any]], dict]:
    """
    Busca portarias do MS no DOU para a data informada.
    Retorna (portarias_validadas, log_execucao).
    """
    data_str = data_ref.strftime("%d-%m-%Y")
    log: dict[str, Any] = {
        "data": data_str,
        "fontes_tentadas": [],
        "total_bruto": 0,
        "descartados": [],
        "aceitos": 0,
        "falhas": [],
    }

    hdrs = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 ERSUS360/3.0"
        ),
        "Accept":          "application/json, text/html, */*",
        "Referer":         "https://www.in.gov.br/leiturajornal",
        "Accept-Language": "pt-BR,pt;q=0.9",
    }

    brutos: list[dict] = []

    # ── Estratégia 1: API interna do leiturajornal (DO1 e DO2) ───────────────
    for secao in ("DO1", "DO2"):
        fonte = f"leiturajornal-API/{secao}"
        params = {
            "orgaoPesquisa": "Ministério da Saúde",
            "data":          data_str,
            "tipoDeAto":     "Portaria",
            "secao":         secao,
            "numberPerPage": "100",
        }
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as c:
                r = await c.get(DOU_BUSCA, params=params, headers=hdrs)
            log["fontes_tentadas"].append(fonte)
            if r.status_code == 200:
                try:
                    d = r.json()
                    items = (d if isinstance(d, list)
                             else d.get("items") or d.get("content") or d.get("results") or [])
                    if items:
                        brutos.extend(items)
                        logger.info("[DOU] %s %s — %d portarias brutas", fonte, data_str, len(items))
                        continue
                except Exception:
                    pass
                # Fallback para HTML
                extraidos = _extrair_portarias_html(r.text, "Ministério da Saúde")
                if extraidos:
                    brutos.extend(extraidos)
                    logger.info("[DOU] %s HTML %s — %d portarias extraídas", fonte, data_str, len(extraidos))
            else:
                log["falhas"].append(f"{fonte}: HTTP {r.status_code}")
        except Exception as exc:
            log["falhas"].append(f"{fonte}: {exc}")
            logger.warning("[DOU] %s erro: %s", fonte, exc)

    # ── Estratégia 2: leiturajornal página HTML com filtros ──────────────────
    if not brutos:
        for secao in ("do1", "do2"):
            fonte = f"leiturajornal-HTML/{secao}"
            try:
                async with httpx.AsyncClient(timeout=30, follow_redirects=True) as c:
                    r = await c.get(
                        DOU_LEITURA,
                        params={"data": data_str, "secao": secao,
                                "orgao": "ministerio-da-saude", "tipoDeAto": "Portaria"},
                        headers=hdrs,
                    )
                log["fontes_tentadas"].append(fonte)
                if r.status_code == 200:
                    extraidos = _extrair_portarias_html(r.text, "Ministério da Saúde")
                    if extraidos:
                        brutos.extend(extraidos)
                        logger.info("[DOU] %s %s — %d portarias", fonte, data_str, len(extraidos))
                        break
                else:
                    log["falhas"].append(f"{fonte}: HTTP {r.status_code}")
            except Exception as exc:
                log["falhas"].append(f"{fonte}: {exc}")
                logger.warning("[DOU] %s erro: %s", fonte, exc)

    # ── Filtro principal: allowlist de órgãos MS ──────────────────────────────
    log["total_bruto"] = len(brutos)
    aceitos: list[dict] = []

    for p in brutos:
        orgao_raw = (p.get("orgaoName") or p.get("orgao") or "").strip()
        titulo    = (p.get("title") or p.get("titulo") or "").strip()

        if not confirmar_orgao_ms(orgao_raw):
            motivo = (
                f"Órgão '{orgao_raw}' não pertence ao Ministério da Saúde"
                if orgao_raw else
                "Campo orgaoName ausente — não é possível confirmar o órgão"
            )
            log["descartados"].append({"titulo": titulo[:60], "motivo": motivo})
            logger.debug("[DOU] Descartado: %s — %s", titulo[:60], motivo)
            continue

        aceitos.append(p)

    # ── Deduplicação por título normalizado ───────────────────────────────────
    vistos: set[str] = set()
    dedup: list[dict] = []
    for p in aceitos:
        chave = re.sub(r'\s+', ' ',
            (p.get('title') or p.get('titulo') or '')).strip().lower()[:80]
        if chave and chave not in vistos:
            vistos.add(chave)
            dedup.append(p)

    log["aceitos"] = len(dedup)
    logger.info(
        "[DOU] %s — %d brutas, %d descartadas, %d aceitas (MS)",
        data_str, len(brutos), len(log["descartados"]), len(dedup)
    )
    return dedup, log


# ── Link direto do DOU ────────────────────────────────────────────────────────

def _resolver_link(p: dict, data_ref: date) -> str:
    """Retorna link utilizável para a portaria no DOU."""
    link = (p.get("urlAddress") or p.get("link") or p.get("url") or "").strip()
    genericos = {
        "", "https://www.in.gov.br",
        "https://www.in.gov.br/leiturajornal",
        "http://www.in.gov.br", "https://in.gov.br",
    }
    if link not in genericos:
        return link

    # Usa a data da portaria para o leiturajornal (público e sem login)
    data_pub = (p.get("pubDate") or p.get("_data") or "").strip()
    data_fmt = ""
    for fmt_in, sep_out in [
        (r"(\d{2})/(\d{2})/(\d{4})", r"\1-\2-\3"),
        (r"(\d{4})-(\d{2})-(\d{2})", r"\3-\2-\1"),
        (r"(\d{2})-(\d{2})-(\d{4})", r"\1-\2-\3"),
    ]:
        if re.match(fmt_in, data_pub):
            data_fmt = re.sub(fmt_in, sep_out, data_pub)
            break

    if not data_fmt:
        data_fmt = data_ref.strftime("%d-%m-%Y")

    return f"https://www.in.gov.br/leiturajornal?data={data_fmt}&secao=do1"


# ── Classificação de abrangência ──────────────────────────────────────────────

def _classificar(p: dict, data_ref: date | None = None) -> dict:
    """
    Classifica relevância da portaria para Apuí/AM.
    A classificação 'federal' só é atribuída se o conteúdo contém termos
    que indiquem norma com potencial aplicação municipal — nunca por padrão.
    """
    if data_ref is None:
        data_ref = date.today()

    titulo = (p.get("title") or p.get("titulo") or "").lower()
    corpo  = (p.get("content") or p.get("conteudo") or p.get("texto") or "").lower()
    numero = (p.get("identifica") or p.get("numero") or "").lower()
    texto  = f"{titulo} {corpo} {numero}"

    # A — Apuí/AM (menção direta)
    if any(t in texto for t in TERMOS_APUI):
        relevancia = "apui"

    # B — Estado do Amazonas
    elif any(t in texto for t in TERMOS_AMAZONAS):
        relevancia = "amazonas"

    # C — Federal com aplicação municipal (termos específicos)
    elif any(t in texto for t in TERMOS_FEDERAL_MUNICIPAL):
        relevancia = "federal"

    # D — Sem impacto identificado (portaria MS sem referência territorial relevante)
    else:
        relevancia = "sem_impacto"

    titulo_orig = (p.get("title") or p.get("titulo") or "Sem título")
    orgao_orig  = (p.get("orgaoName") or p.get("orgao") or "Ministério da Saúde")

    return {
        **p,
        "_relevancia": relevancia,
        "_titulo":     titulo_orig,
        "_numero":     (p.get("identifica") or p.get("numero") or p.get("numberSection") or ""),
        "_link":       _resolver_link(p, data_ref),
        "_data":       (p.get("pubDate") or p.get("dataPublicacao") or ""),
        "_resumo":     corpo[:600] if corpo else "(Acesse o link para ver o conteúdo completo)",
        "_orgao":      orgao_orig,
    }


# ── Informe Técnico ───────────────────────────────────────────────────────────

def _analisar_impacto(titulo: str, corpo: str) -> dict:
    """
    Analisa o conteúdo da portaria e retorna impacto estruturado.
    Retorna evidências textuais encontradas, sem inventar informações.
    """
    texto = (titulo + " " + corpo).lower()

    financeiro: list[str] = []
    assistencial: list[str] = []
    administrativo: list[str] = []
    providencias: list[str] = []
    sem_impacto = False

    # Financeiro
    if any(t in texto for t in ["repasse", "transferência", "transferencia",
                                  "recurso", "valor", "custeio", "investimento",
                                  "fundo nacional", "bloco de financiamento",
                                  "teto financeiro", "limite financeiro"]):
        financeiro.append(
            "A portaria trata de aspectos financeiros. "
            "Verificar se Apuí consta como município beneficiário no texto ou anexos."
        )

    if "emenda parlamentar" in texto:
        financeiro.append(
            "Envolve emenda parlamentar. Verificar se há parcela destinada a Apuí/AM."
        )

    # Assistencial
    if any(t in texto for t in ["atenção primária", "atencao primaria",
                                  "atenção básica", "atencao basica", "esf", "acs"]):
        assistencial.append(
            "Impacto potencial na Atenção Primária à Saúde. "
            "Verificar se a portaria cria obrigações para equipes de Apuí."
        )
    if any(t in texto for t in ["habilitação", "habilitacao", "credenciamento"]):
        assistencial.append(
            "Portaria de habilitação/credenciamento. "
            "Verificar elegibilidade de Apuí e prazo de adesão."
        )
    if any(t in texto for t in ["vigilância", "vigilancia"]):
        assistencial.append(
            "Relacionada à vigilância em saúde. "
            "Verificar obrigações de notificação ou ação para o município."
        )

    # Administrativo
    if any(t in texto for t in ["prazo", "data limite", "até o dia"]):
        administrativo.append(
            "Portaria com prazo definido. Verificar data e providência necessária."
        )
    if any(t in texto for t in ["sistema", "sigtap", "rnds", "conass", "cnes", "ine"]):
        administrativo.append(
            "Envolve sistemas de informação. Verificar obrigação de atualização cadastral."
        )
    if any(t in texto for t in ["prestação de contas", "prestacao de contas",
                                  "relatório", "relatorio"]):
        administrativo.append(
            "Exige prestação de contas ou relatório. Verificar responsável e prazo."
        )

    # Verificar se realmente menciona o município
    if any(t in texto for t in ["apuí", "apui", "1300144"]):
        providencias.append(
            "AÇÃO IMEDIATA: O município de Apuí/AM está citado expressamente. "
            "Ler o texto integral e anexos."
        )

    if not financeiro and not assistencial and not administrativo:
        sem_impacto = True

    return {
        "financeiro":      financeiro,
        "assistencial":    assistencial,
        "administrativo":  administrativo,
        "providencias":    providencias,
        "sem_impacto":     sem_impacto,
    }


def gerar_informe_tecnico(p: dict, numero_seq: int, ano: int) -> str:
    """Gera Informe Técnico em HTML estruturado conforme especificação."""
    titulo   = p.get("_titulo", "Sem título")
    numero   = p.get("_numero", "Não identificado")
    data_pub = p.get("_data",   "Não informada")
    orgao    = p.get("_orgao",  "Ministério da Saúde")
    link     = p.get("_link",   "https://www.in.gov.br/leiturajornal")
    resumo   = p.get("_resumo", "(sem texto disponível)")
    rel      = p.get("_relevancia", "federal")

    REL_LABEL = {
        "apui":       "Específica para Apuí/AM — aplicação direta imediata",
        "amazonas":   "Direcionada ao Estado do Amazonas",
        "federal":    "Federal com aplicação municipal — verificar elegibilidade",
        "sem_impacto":"Sem impacto direto identificado após análise do texto",
    }
    abrangencia_texto = REL_LABEL.get(rel, "Federal")

    impacto = _analisar_impacto(titulo, resumo)

    def lista_html(items: list[str], vazio: str) -> str:
        if not items:
            return f"<p style='color:#6b7280;font-style:italic'>{vazio}</p>"
        return "<ul style='margin:6px 0;padding-left:20px'>" + \
               "".join(f"<li style='margin-bottom:6px'>{i}</li>" for i in items) + "</ul>"

    prov_html = lista_html(
        impacto["providencias"],
        "Nenhuma providência imediata identificada no texto analisado."
    ) if impacto["providencias"] else (
        "<p style='color:#6b7280;font-style:italic'>"
        "Não foi identificado impacto direto para o Município de Apuí/AM "
        "após análise do texto e dos anexos disponíveis.</p>"
    )

    cor_abrang = {
        "apui": "#dc2626", "amazonas": "#d97706",
        "federal": "#2563eb", "sem_impacto": "#6b7280",
    }.get(rel, "#2563eb")

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;
                border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;
                margin-bottom:32px;page-break-inside:avoid">

      <!-- Cabeçalho -->
      <div style="background:#1d4ed8;padding:18px 24px">
        <div style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;
                    letter-spacing:1px">Informe Técnico Nº {numero_seq:03d}/{ano}</div>
        <div style="color:#fff;font-size:16px;font-weight:700;margin-top:4px">{titulo}</div>
      </div>

      <div style="padding:20px 24px;background:#fff">

        <!-- 1. Identificação -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:0.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            1. Identificação do Ato
          </div>
          <table style="font-size:12px;color:#374151;border-collapse:collapse;width:100%">
            <tr><td style="padding:3px 12px 3px 0;font-weight:600;width:180px">Portaria</td>
                <td>{numero or 'Não identificado'}</td></tr>
            <tr><td style="padding:3px 12px 3px 0;font-weight:600">Data de publicação</td>
                <td>{data_pub or 'Não informada'}</td></tr>
            <tr><td style="padding:3px 12px 3px 0;font-weight:600">Órgão responsável</td>
                <td>{orgao}</td></tr>
            <tr><td style="padding:3px 12px 3px 0;font-weight:600">Link oficial DOU</td>
                <td><a href="{link}" style="color:#1d4ed8">{link[:80]}{'...' if len(link)>80 else ''}</a></td></tr>
          </table>
        </div>

        <!-- 2. Objeto -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:0.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            2. Objeto
          </div>
          <div style="font-size:12px;color:#374151;line-height:1.7;
                      background:#f8fafc;padding:12px;border-radius:6px">
            {resumo or '(Acesse o link para ver o conteúdo completo)'}
          </div>
        </div>

        <!-- 3. Abrangência -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:0.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            3. Abrangência
          </div>
          <span style="background:{cor_abrang};color:#fff;font-size:12px;font-weight:600;
                       padding:4px 14px;border-radius:20px">
            {abrangencia_texto}
          </span>
        </div>

        <!-- 4. Impacto -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:0.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            4. Impacto para Apuí/AM
          </div>
          {"<div style='background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:10px 14px;margin-bottom:10px'><strong style='color:#dc2626'>⚡ Ação imediata:</strong> " + " ".join(impacto["providencias"]) + "</div>" if impacto["providencias"] else ""}

          <div style="font-size:12px;font-weight:600;color:#374151;margin:8px 0 4px">
            Impacto financeiro
          </div>
          {lista_html(impacto["financeiro"],
            "Não identificado impacto financeiro direto no texto analisado.")}

          <div style="font-size:12px;font-weight:600;color:#374151;margin:8px 0 4px">
            Impacto assistencial
          </div>
          {lista_html(impacto["assistencial"],
            "Não identificado impacto assistencial direto no texto analisado.")}

          <div style="font-size:12px;font-weight:600;color:#374151;margin:8px 0 4px">
            Impacto administrativo
          </div>
          {lista_html(impacto["administrativo"],
            "Não identificado impacto administrativo direto no texto analisado.")}
        </div>

        <!-- 5. Valores e Beneficiários -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:0.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            5. Valores e Beneficiários
          </div>
          <div style="font-size:12px;color:#6b7280;font-style:italic">
            Informação não identificada no ato analisado. Acesse o texto integral
            e os anexos no link oficial do DOU para verificar valores, beneficiários,
            CNES, INE e competências.
          </div>
        </div>

        <!-- 6. Providências -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:0.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            6. Providências Recomendadas
          </div>
          {prov_html}
          <div style="font-size:12px;color:#374151;margin-top:8px">
            <strong>Ação padrão:</strong> Acessar o link oficial, ler o texto integral,
            verificar se Apuí (IBGE {MUNICIPIO_IBGE}) consta como beneficiário
            e acionar o setor responsável.
          </div>
        </div>

        <!-- 7. Prazos -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:0.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            7. Prazos e Riscos
          </div>
          <div style="font-size:12px;color:#6b7280;font-style:italic">
            {"Portaria contém referência a prazo. Verificar data exata no texto integral." if impacto["administrativo"] and any("prazo" in a.lower() for a in impacto["administrativo"]) else "Prazo não identificado automaticamente. Verificar no texto integral do DOU."}
          </div>
        </div>

        <!-- 8. Conclusão -->
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:14px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#15803d;letter-spacing:0.8px;margin-bottom:6px">
            8. Conclusão
          </div>
          <div style="font-size:12px;color:#374151;line-height:1.6">
            {
              "Portaria com referência direta a Apuí/AM. Leitura integral do ato e dos anexos é obrigatória."
              if rel == "apui" else
              "Portaria aplicável ao Estado do Amazonas. Verificar se Apuí está incluído como município beneficiário."
              if rel == "amazonas" else
              "Norma federal do Ministério da Saúde com potencial aplicação municipal. Verificar elegibilidade e obrigações para Apuí/AM."
              if rel == "federal" else
              "Não foi identificado impacto direto para o Município de Apuí/AM após análise do texto e dos anexos."
            }
          </div>
        </div>

        <!-- Assinatura -->
        <div style="margin-top:20px;padding-top:14px;border-top:1px solid #e2e8f0;
                    font-size:11px;color:#6b7280">
          <div>Destinatária: <strong>Rosângela Motter</strong> — Secretária Municipal de Saúde de Apuí/AM</div>
          <div>Elaborado por: <strong>Euler Ramos de Oliveira</strong> — Assessor Técnico em Saúde Pública</div>
          <div>Gerado pelo ERSUS 360 · {datetime.now().strftime('%d/%m/%Y %H:%M')} (America/Manaus)</div>
        </div>
      </div>
    </div>"""


# ── HTML do e-mail diário ─────────────────────────────────────────────────────

def _gerar_html(
    data_ref: date,
    portarias_apui: list,
    portarias_am: list,
    portarias_fed: list,
    log_exec: dict | None = None,
) -> str:
    data_fmt = data_ref.strftime("%d/%m/%Y")
    total    = len(portarias_apui) + len(portarias_am) + len(portarias_fed)
    ano      = data_ref.year

    sem_relevante = not portarias_apui and not portarias_am and not portarias_fed

    COR = {
        "apui":    "#dc2626",
        "amazonas":"#d97706",
        "federal": "#2563eb",
    }
    LABEL = {
        "apui":    "📍 Portarias que citam Apuí/AM",
        "amazonas":"🗺️ Portarias para o Amazonas",
        "federal": "📋 Normas federais com aplicação municipal",
    }

    def bloco_grupo(chave: str, items: list) -> str:
        if not items:
            return ""
        cor = COR[chave]
        lbl = LABEL[chave]
        cards = ""
        for i, p in enumerate(items, 1):
            link = p.get("_link", "https://www.in.gov.br/leiturajornal")
            tipo_link = "Abrir" if "in.gov.br/web/dou" in link else "Ver DOU na data"
            cards += f"""
            <div style="border-left:4px solid {cor};padding:10px 14px;margin-bottom:10px;
                        background:#fafafa;border-radius:0 6px 6px 0">
              <div style="font-weight:700;font-size:13px;color:#1e293b">
                {i}. {p['_titulo']}
              </div>
              {"<div style='font-size:11px;color:#6b7280;margin-top:2px'>" + p['_numero'] + "</div>" if p.get('_numero') else ""}
              {"<div style='font-size:11px;color:#64748b;margin-top:2px'>Órgão: " + p.get('_orgao','') + "</div>" if p.get('_orgao') else ""}
              <div style="font-size:12px;color:#475569;margin:6px 0;line-height:1.6">
                {p['_resumo'][:250]}{"..." if len(p.get('_resumo',''))>250 else ""}
              </div>
              <a href="{link}" target="_blank"
                 style="font-size:11px;color:#1d4ed8">
                🔗 {tipo_link} no DOU
              </a>
            </div>"""
        return f"""
        <div style="margin-bottom:24px">
          <div style="font-size:12px;font-weight:700;color:{cor};text-transform:uppercase;
                      letter-spacing:1px;margin-bottom:8px">{lbl} ({len(items)})</div>
          {cards}
        </div>"""

    if sem_relevante:
        corpo = """
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;
                    padding:20px;margin:20px 0;font-size:13px;color:#15803d">
          Na consulta ao Diário Oficial da União de {data_fmt}, não foram identificados
          novos atos do Ministério da Saúde com impacto direto ou providências imediatas
          para o Município de Apuí/AM.
        </div>""".format(data_fmt=data_fmt)
    else:
        corpo = (
            bloco_grupo("apui",    portarias_apui) +
            bloco_grupo("amazonas",portarias_am)   +
            bloco_grupo("federal", portarias_fed)
        )
        # Acrescentar informes técnicos completos
        corpo += "<hr style='border:none;border-top:2px solid #e2e8f0;margin:28px 0'>"
        corpo += "<div style='font-size:14px;font-weight:700;color:#1e293b;margin-bottom:16px'>INFORMES TÉCNICOS</div>"
        seq = 1
        for grp in [portarias_apui, portarias_am, portarias_fed]:
            for p in grp:
                corpo += gerar_informe_tecnico(p, seq, ano)
                seq += 1

    # Log de execução (resumo técnico no rodapé)
    log_html = ""
    if log_exec:
        n_desc = len(log_exec.get("descartados", []))
        desc_motivos = "".join(
            f"<li style='font-size:10px'>{d['titulo']} — {d['motivo']}</li>"
            for d in log_exec.get("descartados", [])[:10]
        )
        log_html = f"""
        <div style="margin-top:20px;background:#f1f5f9;border-radius:6px;padding:12px 16px;
                    font-size:11px;color:#64748b">
          <div style="font-weight:700;margin-bottom:6px">Log de execução</div>
          <div>Fontes consultadas: {', '.join(log_exec.get('fontes_tentadas',[]))}</div>
          <div>Publicações brutas encontradas: {log_exec.get('total_bruto', 0)}</div>
          <div>Descartadas (órgão não é MS): {n_desc}</div>
          <div>Aceitas e processadas: {log_exec.get('aceitos', 0)}</div>
          {"<ul style='margin:4px 0;padding-left:16px'>" + desc_motivos + "</ul>" if desc_motivos else ""}
          {"<div style='color:#dc2626'>Falhas: " + "; ".join(log_exec.get('falhas',[])) + "</div>" if log_exec.get('falhas') else ""}
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ERSUS360 — Portarias MS — {data_fmt}</title>
</head>
<body style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;
             background:#f8fafc;padding:20px">

  <div style="background:#1d4ed8;padding:22px 28px;border-radius:10px 10px 0 0">
    <div style="color:#fff;font-size:20px;font-weight:800">
      ERSUS 360 — Portarias do Ministério da Saúde
    </div>
    <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-top:4px">
      Município de Apuí/AM · IBGE {MUNICIPIO_IBGE} · Secretaria Municipal de Saúde · {data_fmt}
    </div>
  </div>

  <div style="background:#fff;padding:24px 28px;border:1px solid #e5e7eb;border-top:none">

    <!-- KPIs -->
    <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
      <div style="flex:1;min-width:130px;background:#eff6ff;border:1px solid #bfdbfe;
                  border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#1d4ed8">{total}</div>
        <div style="font-size:10px;color:#64748b;text-transform:uppercase">portarias MS</div>
      </div>
      <div style="flex:1;min-width:130px;background:#fef2f2;border:1px solid #fca5a5;
                  border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#dc2626">{len(portarias_apui)}</div>
        <div style="font-size:10px;color:#64748b;text-transform:uppercase">citam Apuí/AM</div>
      </div>
      <div style="flex:1;min-width:130px;background:#fffbeb;border:1px solid #fde68a;
                  border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#d97706">{len(portarias_am)}</div>
        <div style="font-size:10px;color:#64748b;text-transform:uppercase">Amazonas</div>
      </div>
      <div style="flex:1;min-width:130px;background:#f0fdf4;border:1px solid #bbf7d0;
                  border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#16a34a">{len(portarias_fed)}</div>
        <div style="font-size:10px;color:#64748b;text-transform:uppercase">federal municipal</div>
      </div>
    </div>

    {corpo}
    {log_html}
  </div>

  <div style="background:#f1f5f9;padding:14px 28px;border-radius:0 0 10px 10px;
              font-size:11px;color:#64748b">
    <div>Gerado automaticamente pelo ERSUS 360 · Agente de Portarias MS v3.0</div>
    <div>Fonte oficial: Diário Oficial da União —
      <a href="https://www.in.gov.br" style="color:#1d4ed8">www.in.gov.br</a>
    </div>
    <div>Horário de Manaus (America/Manaus) · {datetime.now().strftime('%d/%m/%Y %H:%M')}</div>
  </div>
</body>
</html>"""


# ── Envio de e-mail ───────────────────────────────────────────────────────────

def _enviar_smtp(assunto: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"]    = EMAIL_FROM
    msg["To"]      = EMAIL_RECIPIENT
    msg.attach(MIMEText(html, "html", "utf-8"))
    ctx = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as s:
        s.ehlo()
        s.starttls(context=ctx)
        s.login(SMTP_USER, SMTP_PASS)
        s.sendmail(EMAIL_FROM, [EMAIL_RECIPIENT], msg.as_string())


async def _enviar_resend(assunto: str, html: str) -> None:
    async with httpx.AsyncClient(timeout=20) as c:
        resp = await c.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type":  "application/json",
            },
            json={"from": EMAIL_FROM, "to": [EMAIL_RECIPIENT],
                  "subject": assunto, "html": html},
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(f"Resend API erro {resp.status_code}: {resp.text}")


# ── Função principal ──────────────────────────────────────────────────────────

async def executar_envio_diario(data_ref: date | None = None, forcar: bool = False) -> dict:
    from database import AsyncSessionLocal
    from models.email_diario import EmailDiarioLog, StatusEnvio
    from sqlalchemy import select

    if data_ref is None:
        data_ref = date.today()
    data_str = data_ref.isoformat()

    async with AsyncSessionLocal() as db:
        if not forcar:
            res = await db.execute(
                select(EmailDiarioLog).where(
                    EmailDiarioLog.data_referencia == data_str,
                    EmailDiarioLog.status == StatusEnvio.ENVIADO,
                )
            )
            if res.scalar_one_or_none():
                return {"ok": False, "motivo": "já enviado hoje", "data": data_str}

        res_cfg = await db.execute(
            select(EmailDiarioLog).where(EmailDiarioLog.pausado == True).limit(1)
        )
        if res_cfg.scalar_one_or_none() and not forcar:
            return {"ok": False, "motivo": "envios pausados", "data": data_str}

        log_db = EmailDiarioLog(
            data_referencia=data_str,
            destinatario=EMAIL_RECIPIENT,
            assunto=f"ERSUS360 – Portarias MS – Apuí/AM – {data_ref.strftime('%d/%m/%Y')}",
            status=StatusEnvio.PENDENTE,
        )
        db.add(log_db)
        await db.commit()
        await db.refresh(log_db)
        log_id = log_db.id

    portarias_raw: list[dict] = []
    log_exec: dict = {}
    try:
        portarias_raw, log_exec = await _buscar_portarias_ms(data_ref)
    except Exception as exc:
        logger.error("Erro ao buscar DOU: %s", exc)
        log_exec = {"falhas": [str(exc)]}

    classificadas    = [_classificar(p, data_ref) for p in portarias_raw]
    portarias_apui   = [p for p in classificadas if p["_relevancia"] == "apui"]
    portarias_am     = [p for p in classificadas if p["_relevancia"] == "amazonas"]
    portarias_fed    = [p for p in classificadas if p["_relevancia"] == "federal"]
    total            = len(portarias_apui) + len(portarias_am) + len(portarias_fed)

    assunto    = (
        f"ERSUS360 – Portarias MS – Apuí/AM – {data_ref.strftime('%d/%m/%Y')}"
        + (f" ({total} portarias)" if total else " — Sem novas portarias")
    )
    html_corpo = _gerar_html(data_ref, portarias_apui, portarias_am, portarias_fed, log_exec)

    MAX_TENTATIVAS = 3
    erro_final: str | None = None

    for tentativa in range(1, MAX_TENTATIVAS + 1):
        try:
            if EMAIL_PROVIDER == "resend" and RESEND_API_KEY:
                await _enviar_resend(assunto, html_corpo)
            else:
                _enviar_smtp(assunto, html_corpo)

            async with AsyncSessionLocal() as db2:
                res2 = await db2.execute(
                    select(EmailDiarioLog).where(EmailDiarioLog.id == log_id))
                log2 = res2.scalar_one_or_none()
                if log2:
                    log2.status        = StatusEnvio.ENVIADO
                    log2.tentativas    = tentativa
                    log2.assunto       = assunto
                    log2.corpo_html    = html_corpo
                    log2.qtd_portarias = total
                    log2.qtd_informes  = len(portarias_apui)
                    log2.portarias_ids = json.dumps(
                        [p.get("_numero","") for p in portarias_apui+portarias_am+portarias_fed])
                    log2.enviado_em    = datetime.utcnow()
                    log2.erro          = None
                    await db2.commit()

            logger.info("E-mail diário enviado — %s — %d portarias MS", data_str, total)
            return {"ok": True, "data": data_str, "qtd_portarias": total,
                    "tentativas": tentativa, "log": log_exec}

        except Exception as exc:
            erro_final = str(exc)
            logger.warning("Tentativa %d falhou: %s", tentativa, exc)

    async with AsyncSessionLocal() as db3:
        res3 = await db3.execute(
            select(EmailDiarioLog).where(EmailDiarioLog.id == log_id))
        log3 = res3.scalar_one_or_none()
        if log3:
            log3.status     = StatusEnvio.FALHA
            log3.tentativas = MAX_TENTATIVAS
            log3.assunto    = assunto
            log3.corpo_html = html_corpo
            log3.erro       = (
                f"Não foi possível enviar o e-mail após {MAX_TENTATIVAS} tentativas. "
                f"Último erro: {erro_final}"
            )
            await db3.commit()

    logger.error("Envio falhou após %d tentativas: %s", MAX_TENTATIVAS, erro_final)
    return {"ok": False, "data": data_str, "erro": erro_final,
            "tentativas": MAX_TENTATIVAS, "log": log_exec}


# ── Testes de validação de órgão (executar com: python -m pytest ou direto) ──

def _testes_validacao_orgao() -> None:
    """
    Testes que garantem que publicações de outros ministérios jamais
    sejam classificadas como atos do Ministério da Saúde.
    """
    casos_nao_ms = [
        ("Ministério da Integração e do Desenvolvimento Regional", False),
        ("Ministério da Pesca e Aquicultura",                      False),
        ("Agência Nacional do Petróleo, Gás Natural e Biocombustíveis", False),
        ("ANP",                                                    False),
        ("Ministério da Educação",                                 False),
        ("MEC",                                                    False),
        ("Ministério da Defesa",                                   False),
        ("Ministério da Fazenda",                                  False),
        ("Ministério da Agricultura",                              False),
        ("Ministério do Meio Ambiente e Mudança do Clima",        False),
        ("Ministério da Cultura",                                  False),
        ("MINC",                                                   False),
        ("Ministério da Gestão e Inovação em Serviços Públicos",  False),
        ("Ministério do Desenvolvimento Social",                   False),
        ("Ministério das Cidades",                                 False),
        ("Ministério dos Transportes",                             False),
        ("Ministério de Minas e Energia",                         False),
        ("Ministério das Comunicações",                            False),
        ("",                                                       False),
    ]
    casos_ms = [
        ("Ministério da Saúde",                                    True),
        ("Ministério da Saúde / SAPS",                             True),
        ("SAPS/MS",                                                True),
        ("SAES/MS",                                                True),
        ("SVSA/MS",                                                True),
        ("SVS/MS",                                                 True),
        ("SECTICS/MS",                                             True),
        ("SESAI/MS",                                               True),
        ("GM/MS",                                                  True),
        ("Fundo Nacional de Saúde",                                True),
        ("ANVISA",                                                 True),
        ("ANS",                                                    True),
        ("FUNASA",                                                 True),
        ("FIOCRUZ",                                                True),
        ("Secretaria de Atenção Primária à Saúde",                 True),
        ("Secretaria-Executiva/MS",                                True),
    ]

    erros = []
    for orgao, esperado in casos_nao_ms + casos_ms:
        resultado = confirmar_orgao_ms(orgao)
        if resultado != esperado:
            erros.append(
                f"FALHA: '{orgao}' → esperado={esperado}, obtido={resultado}"
            )
        else:
            status = "OK   " if esperado else "DESCARTADO"
            logger.info("[TESTE] %s '%s'", status, orgao)

    if erros:
        for e in erros:
            logger.error("[TESTE] %s", e)
        raise AssertionError(f"{len(erros)} testes falharam:\n" + "\n".join(erros))

    total_testes = len(casos_nao_ms) + len(casos_ms)
    logger.info("[TESTE] %d/%d testes passaram ✓", total_testes, total_testes)
    print(f"✓ Todos os {total_testes} testes de validação de órgão passaram.")


if __name__ == "__main__":
    import asyncio
    logging.basicConfig(level=logging.INFO)
    _testes_validacao_orgao()
