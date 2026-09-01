"""
ERSUS360 — Agente de Portarias do Ministério da Saúde — DOU
============================================================
Versão 5.0 — Validação por título + captura ampliada de todos os atos MS

Regra fundamental (nunca violar):
  Uma publicação só é aceita como do Ministério da Saúde se o campo
  orgaoName retornado pelo DOU pertencer à ORGAOS_MS_PERMITIDOS.
  orgao_hint NUNCA é atribuído a itens sem evidência estrutural de órgão.

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
import hashlib
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

# ─────────────────────────────────────────────────────────────────────────────
# LISTA DE PERMISSÃO — órgãos oficialmente vinculados ao Ministério da Saúde
# Atualize esta lista conforme mudanças na estrutura do MS.
# ─────────────────────────────────────────────────────────────────────────────
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
    "secretaria de vigilancia em saude",
    "secretaria de vigilância em saúde",
    "svs",
    "svs/ms",
    "secretaria de ciencia, tecnologia, inovacao e complexo da saude",
    "secretaria de ciência, tecnologia, inovação e complexo da saúde",
    "sectics",
    "sectics/ms",
    "sctie",
    "sctie/ms",
    "secretaria de saude indigena",
    "secretaria de saúde indígena",
    "sesai",
    "sesai/ms",
    "secretaria de informacao e saude digital",
    "secretaria de informação e saúde digital",
    "seidigi",
    "seidigi/ms",
    # Fundo Nacional de Saúde
    "fundo nacional de saude",
    "fundo nacional de saúde",
    "fns",
    "fns/ms",
    # Conselhos e órgãos colegiados vinculados
    "conselho nacional de saude",
    "conselho nacional de saúde",
    "cns",
    # Agências reguladoras vinculadas ao MS
    "agencia nacional de vigilancia sanitaria",
    "agência nacional de vigilância sanitária",
    "anvisa",
    "agencia nacional de saude suplementar",
    "agência nacional de saúde suplementar",
    "ans",
    # Fundações e institutos vinculados
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
    # Siglas genéricas usadas pelo DOU para atos do MS
    "gm/ms",
    "gm/m",
    "ministerio da saude/gm",
    "ministério da saúde/gm",
})

# ─────────────────────────────────────────────────────────────────────────────
# FRAGMENTOS DE EXCLUSÃO — se presentes no orgaoName, indica que NÃO é MS
# Salvaguarda para nomes compostos não mapeados na allowlist.
# PRIORIDADE MÁXIMA: fragmento de exclusão bate qualquer match da allowlist.
# ─────────────────────────────────────────────────────────────────────────────
FRAGMENTOS_NAO_MS: tuple[str, ...] = (
    "integracao",
    "integração",
    "pesca",
    "aquicultura",
    "petroleo",
    "petróleo",
    "gas natural",
    "gás natural",
    "/anp",          # Agência Nacional do Petróleo
    "setad",         # Secretaria de Estado — não MS
    "/mcti",         # Ministério de Ciência, Tecnologia e Inovação
    "mcti/",
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
    "/mma",
    "relacoes exteriores",
    "relações exteriores",
    "/mre",
    "esporte",
    "direitos humanos",
    "igualdade racial",
    "mulheres",
    "gestao e inovacao",   # MGPE — Ministério da Gestão
    "gestão e inovação",
    "planejamento",
    "empreendedorismo",
    "microempresa",
    "portos",
    "transportes",
    "minas e energia",
    "/mme",
    "/mds",
    "desenvolvimento social",
    "cidadania",
    "indios",               # FUNAI — não é vinculada ao MS
    "índios",
    "funai",
    "amazonia",             # Ministério da Amazônia ≠ MS
    "amazônia",
    "susep",               # Seguros Privados — não é MS
    "fcrb",                # Fundação Casa de Rui Barbosa — Cultura
    "cgccr",               # Conselho de Controle de Atividades Financeiras
    "coaf",
    "/igi",                # Instituto de Gestão — não MS
    "alf/",                # Alfândega — Fazenda
    "dnit",                # Transportes
    "anac",                # Aviação Civil
    "anatel",              # Comunicações
    "aneel",               # Energia Elétrica
    "/ana ",               # Agência Nacional de Águas — evita "analise"
    "anm/",                # Mineração
    "antaq",               # Transportes Aquaviários
    "antt",                # Transportes Terrestres
    "ancine",              # Cinema — Cultura
    "cvm/",                # Valores Mobiliários — Fazenda
    "ibama",               # Meio Ambiente
    "ibge",                # IBGE não é MS
    "iphan",               # Cultura
    "incra",               # Agricultura
    "dpf",                 # Polícia Federal — Justiça
    "inmetro",             # Indústria
    "inpi",                # Propriedade Industrial
    "inss",                # Previdência
    "bcb/",                # Banco Central
    "bacen",
    # Receita Federal / Fazenda
    "rfb",
    "sucor",
    "srrf",
    "receita federal",
    # Forças Armadas / Defesa
    "com8",
    "comgex",
    "comando",
    "exercito",
    "exército",
    "marinha",
    "aeronautica",
    "aeronáutica",
    "depto de pessoal",
    "dep pessoal",
    "de pessoal",
    # Outros não-MS
    "diger",
    "dgp/",
    "direns",
    "deaer",
    "comrj",
    # Secretarias executivas de outros ministérios
    "se/mapa",
    "se/mcti",
    "se/mec",
    "se/mj",
    "se/md",
    # Ministério da Integração e Desenvolvimento Regional
    "midr",
    # Instituto Nacional de Tecnologia da Informação
    "iti",
    # Polícia Rodoviária / Polícia Federal / Procuradoria
    "pr/rs",
    "dg/pf",
    "prpf",
    # DG genérico de outros órgãos
    "dg/anatel",
    "dg/anac",
    "dg/anvisa" ,   # nota: DG da ANVISA É do MS — cuidado, não adicionar apenas "dg"
    # Universidades e institutos federais
    "progepe",
    "prodegesp",
    "progesp",
    "ufjf",
    "ufpa/",
    "ufam/",
    # COAF / CGU
    "coaf",
    "cgu/",
)

# ─────────────────────────────────────────────────────────────────────────────
# SIGLAS MS NO TÍTULO — se o título da portaria contém uma dessas siglas
# precedida de "PORTARIA", é definitivamente do Ministério da Saúde.
# ─────────────────────────────────────────────────────────────────────────────
SIGLAS_MS_NO_TITULO: frozenset[str] = frozenset({
    "gm/ms", "gm/m", "saps/ms", "saes/ms", "svsa/ms", "svs/ms",
    "sectics/ms", "sctie/ms", "sesai/ms", "seidigi/ms", "se/ms",
    "fns/ms", "fns", "anvisa", "ans/ms",
    "ministerio da saude", "ministério da saúde",
})

# Siglas de outros órgãos que aparecem no padrão "PORTARIA [SIGLA] Nº X"
SIGLAS_NAO_MS_NO_TITULO: frozenset[str] = frozenset({
    "setad/mcti", "mcti", "fcrb", "susep", "cgccr/susep", "alf/igi",
    "dnit", "anac", "anatel", "aneel", "anm", "antaq", "antt", "ancine",
    "cvm", "ibama", "ibge", "iphan", "incra", "dpf", "inmetro", "inpi",
    "inss", "bcb", "bacen", "secom", "sefic", "minc", "mapa", "mre",
    "mds", "mcidades", "minfra", "mtur", "mec", "md", "mmfdh", "mj",
    "ms/me", "mp", "mpog", "sef", "stn", "srf", "receita federal",
    "cgccr", "coaf", "igi", "alf",
    # Ministério da Integração e Desenvolvimento Regional
    "midr",
    # Instituto Nacional de Tecnologia da Informação
    "iti",
    # Polícia / PF
    "dg/pf", "pr/rs", "prpf",
    # Secretarias Executivas de outros ministérios
    "se/mapa", "se/mcti", "se/mec", "se/mj", "se/md", "se/mtur",
    "se/minfra", "se/mre", "se/mds", "se/mmfdh", "se/me",
    # RFB / Receita Federal
    "rfb", "rfb/sucor", "rfb/srrf", "sucor", "srrf",
    # Forças Armadas
    "com8dn", "com8°dn", "com8", "comgex", "comaer", "colog",
    # Universidades / institutos federais (PROGEPE, PRODEGESP etc.)
    "progepe", "prodegesp", "progesp", "ufjf", "ufpa", "ufam", "ufba",
    "ufpr", "ufsc", "ufmg", "ufrj", "ufrgs", "ufpe", "ufc", "ufg",
    "unifesp", "fiocruz/ms",   # fiocruz/ms é do MS — mantém só fiocruz isolado
    "fcrb", "coaf", "cgu",
})


def _normalizar_orgao(orgao: str) -> str:
    """Normaliza string de órgão para comparação: minúsculas, sem acento."""
    s = orgao.lower().strip()
    for a, b in [
        ("á","a"),("ã","a"),("â","a"),("à","a"),
        ("é","e"),("ê","e"),("í","i"),("ó","o"),
        ("õ","o"),("ô","o"),("ú","u"),("ç","c"),
    ]:
        s = s.replace(a, b)
    return s


def _orgao_do_titulo(titulo: str) -> str:
    """
    Extrai a sigla do órgão do título de portaria no formato DOU.
    Ex: "PORTARIA GM/MS Nº 12.129, DE 26 DE AGOSTO" → "gm/ms"
        "PORTARIA SETAD/MCTI Nº 10.316, DE 28 ..." → "setad/mcti"
    Retorna string vazia se não conseguir extrair.
    """
    t = titulo.strip()
    # Padrão: PORTARIA [SIGLA] Nº/N.º X ou PORTARIA [SIGLA], DE
    m = re.match(
        r'^portaria\s+([A-Za-záàâãéêíóôõúüç/\-]+)\s+n[º°\.º]?\s',
        t, re.I
    )
    if m:
        return m.group(1).lower().strip()
    # Tenta sem "Nº" — ex: "PORTARIA GM/MS, DE 26..."
    m2 = re.match(r'^portaria\s+([A-Za-záàâãéêíóôõúüç/\-]{2,30})\s*,', t, re.I)
    if m2:
        return m2.group(1).lower().strip()
    return ""


def _titulo_confirma_ms(titulo: str) -> bool | None:
    """
    Analisa o título da portaria para confirmar ou negar se é do MS.
    Retorna True se confirmar MS, False se negar, None se indeterminado.
    """
    t_lower = titulo.lower()

    # "PORTARIA DE PESSOAL" → portaria de RH interno (nomeações, remoções,
    # exonerações de servidores). Irrelevante para gestão de saúde pública.
    # Rejeitar sempre, mesmo quando a sigla do órgão é do MS.
    if "de pessoal" in t_lower:
        return False

    sigla = _orgao_do_titulo(titulo)
    if not sigla:
        return None

    # Normaliza para comparação
    sigla_n = _normalizar_orgao(sigla)

    # Confirma explicitamente como MS
    for ms_sig in SIGLAS_MS_NO_TITULO:
        ms_n = _normalizar_orgao(ms_sig)
        if ms_n == sigla_n or ms_n in sigla_n:
            return True

    # Rejeita explicitamente como não-MS
    for nao_ms in SIGLAS_NAO_MS_NO_TITULO:
        nao_ms_n = _normalizar_orgao(nao_ms)
        if nao_ms_n == sigla_n or nao_ms_n in sigla_n:
            return False

    # Verifica fragmentos de exclusão na sigla
    for frag in FRAGMENTOS_NAO_MS:
        if frag in sigla_n:
            return False

    return None  # Indeterminado — deixa confirmar_orgao_ms decidir


def confirmar_orgao_ms(orgao_raw: str, titulo: str = "") -> bool:
    """
    Retorna True SOMENTE se o órgão pertencer à estrutura oficial do MS.

    Ordem de verificação:
    1. Análise do título (mais confiável que orgaoName quando disponível)
    2. Fragmentos de exclusão no orgaoName — prioridade máxima
    3. Correspondência na allowlist
    4. Órgão vazio E título indeterminado → rejeitar por segurança
    """
    # 1. Título como fonte primária de confirmação/rejeição
    if titulo:
        resultado_titulo = _titulo_confirma_ms(titulo)
        if resultado_titulo is True:
            return True
        if resultado_titulo is False:
            return False
        # resultado_titulo is None → continua com orgaoName

    if not orgao_raw or not orgao_raw.strip():
        return False

    n = _normalizar_orgao(orgao_raw)

    # 2. Fragmentos de exclusão — prioridade máxima
    for frag in FRAGMENTOS_NAO_MS:
        if frag in n:
            return False

    # 3. Correspondência exata na allowlist
    if n in {_normalizar_orgao(o) for o in ORGAOS_MS_PERMITIDOS}:
        return True

    # 4. A allowlist é substring do orgão informado
    #    (ex: "Ministério da Saúde / SAPS" contém "saps")
    for permitido in ORGAOS_MS_PERMITIDOS:
        np = _normalizar_orgao(permitido)
        if len(np) >= 3 and np in n:
            return True

    return False


def _capitalizar_sentencas(texto: str) -> str:
    """
    Capitaliza a primeira letra de cada sentença.
    A API de busca do DOU retorna o campo 'content' em minúsculas.
    """
    if not texto:
        return texto
    # Capitaliza o primeiro caractere
    resultado = texto[:1].upper() + texto[1:]
    # Capitaliza após . ! ? seguido de espaço(s)
    resultado = re.sub(
        r'([.!?]\s+)([a-záàâãéêíóôõúüçñ])',
        lambda m: m.group(1) + m.group(2).upper(),
        resultado,
    )
    return resultado


def _gerar_chave_dedup(p: dict) -> str:
    """Chave única para deduplicação de portaria."""
    titulo = re.sub(r"\s+", " ", (p.get("title") or p.get("titulo") or "")).strip().lower()
    orgao  = _normalizar_orgao(p.get("orgaoName") or p.get("orgao") or "")
    numero = re.sub(r"\s+", " ", (p.get("identifica") or p.get("numero") or "")).strip().lower()
    data   = (p.get("pubDate") or p.get("dataPublicacao") or "").strip()
    raw    = f"{orgao}|{numero}|{data}|{titulo[:60]}"
    return hashlib.md5(raw.encode()).hexdigest()


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
TERMOS_FEDERAL_MUNICIPAL = [
    # Atenção Primária
    "atenção primária", "atencao primaria",
    "atenção básica", "atencao basica",
    "estratégia saúde da família", "saúde da família", "esf",
    "agente comunitário", "acs",
    "núcleo ampliado", "nasf",
    "equipe de saúde", "equipes de saúde",
    "unidade básica", "ubs",
    # Financeiro
    "custeio", "investimento",
    "fundo nacional de saúde", "fns",
    "fundo municipal", "fundo estadual",
    "repasse federal", "repasse financeiro",
    "transferência fundo a fundo", "transferencia fundo",
    "bloco de financiamento", "bloco de custeio",
    "teto financeiro", "limite financeiro",
    "emenda parlamentar",
    "componente fixo", "componente variável",
    "recurso federal", "recursos federais",
    "piso da atenção", "piso da enfermagem",
    # Programas nacionais
    "programa nacional", "política nacional",
    "habilitação", "habilitacao",
    "credenciamento",
    "relatório de gestão", "relatorio de gestao",
    "prestação de contas",
    "indicador", "meta",
    # Vigilância
    "vigilância epidemiológica", "vigilancia epidemiologica",
    "vigilância sanitária", "vigilancia sanitaria",
    "vigilância em saúde",
    # Especialidades
    "assistência farmacêutica", "assistencia farmaceutica",
    "média complexidade", "alta complexidade",
    "urgência e emergência",
    "saúde indígena", "saude indigena",
    "saúde mental", "saude mental",
    "saúde bucal",
    "rede de atenção",
    # Abrangência
    "municípios", "municipios",
    "gestores municipais", "secretarias municipais",
    "municípios habilitados", "municípios beneficiários",
    "todos os municípios",
]
TERMOS_URGENTE = [
    "até o dia", "até o prazo", "encerramento",
    "suspensão de repasse", "suspensão de transferência",
    "bloqueio", "glosa", "devolução de recurso",
    "prazo improrrogável",
]


# ── Extração de HTML do DOU ───────────────────────────────────────────────────

def _extrair_orgao_de_bloco_html(bloco: str) -> str:
    """
    Tenta extrair o nome do órgão de um bloco HTML de artigo do DOU.
    Retorna string vazia se não encontrar.
    """
    # Padrões comuns no HTML do DOU leiturajornal
    padroes = [
        r'class="[^"]*(?:orgao|organ|dou-header)[^"]*"[^>]*>\s*([^<]{3,120})',
        r'data-orgao="([^"]{3,120})"',
        r'<h[23][^>]*class="[^"]*(?:orgao|organ)[^"]*"[^>]*>\s*([^<]{3,120})',
    ]
    for pat in padroes:
        m = re.search(pat, bloco, re.I)
        if m:
            v = m.group(1).strip()
            if v and len(v) > 2:
                return v
    return ""


def _extrair_portarias_html(
    html: str,
    orgao_hint: str = "",
    usar_hint_como_fallback: bool = False,
) -> list[dict]:
    """
    Extrai portarias de resposta HTML do DOU.

    REGRA FUNDAMENTAL:
    - orgao_hint só é usado quando usar_hint_como_fallback=True AND
      a requisição foi feita com filtro de órgão confirmado (ex: orgaoPesquisa=Ministério da Saúde).
    - Se usar_hint_como_fallback=False e o órgão não está no JSON/HTML → orgaoName="".
    - orgaoName="" → confirmar_orgao_ms() retorna False → item descartado.

    Isso garante que atos de outros órgãos nunca apareçam como MS por default.
    """
    resultado: list[dict] = []
    vistos: set[str] = set()

    def _limpo(t: str) -> str:
        t = re.sub(r'"[a-zA-Z_]+"\s*:\s*"[^"]*"', '', t)
        t = re.sub(r'[{}\[\]]', '', t)
        t = re.sub(r'\s+', ' ', t).strip()
        return t

    # ── Estratégia A: __NEXT_DATA__ (Next.js) ────────────────────────────────
    next_data_match = re.search(
        r'<script[^>]+id="__NEXT_DATA__"[^>]*>(.*?)</script>',
        html, re.S | re.I
    )
    if next_data_match:
        try:
            nd = json.loads(next_data_match.group(1))
            props = nd.get("props", {}).get("pageProps", {})
            items_nd = (
                props.get("atos") or props.get("results") or
                props.get("items") or props.get("portarias") or []
            )
            for item in (items_nd if isinstance(items_nd, list) else []):
                titulo = (item.get("title") or item.get("titulo") or
                          item.get("identifica") or "")
                if not titulo:
                    continue
                t = _limpo(titulo)
                if not t or len(t) < 5 or t in vistos:
                    continue
                orgao = (item.get("orgaoName") or item.get("orgao") or
                         item.get("organ") or "")
                if not orgao and usar_hint_como_fallback:
                    orgao = orgao_hint
                vistos.add(t)
                resultado.append({
                    "title":      t,
                    "urlAddress": item.get("urlAddress") or item.get("url") or "",
                    "content":    item.get("content") or item.get("conteudo") or "",
                    "pubDate":    item.get("pubDate") or item.get("data") or "",
                    "orgaoName":  orgao,
                    "identifica": item.get("identifica") or item.get("numero") or "",
                })
        except Exception:
            pass

    # ── Estratégia B: JSON em <script> genéricos ──────────────────────────────
    if not resultado:
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
                        # Órgão vem APENAS do JSON — não usar hint global
                        orgao = (item.get('orgaoName') or item.get('orgao') or
                                 item.get('organ') or '')
                        if not orgao and usar_hint_como_fallback:
                            orgao = orgao_hint
                        vistos.add(t)
                        resultado.append({
                            "title":      t,
                            "urlAddress": item.get('urlAddress') or item.get('url') or '',
                            "content":    item.get('content') or item.get('conteudo') or '',
                            "pubDate":    item.get('pubDate') or item.get('data') or '',
                            "orgaoName":  orgao,
                            "identifica": item.get('identifica') or item.get('numero') or '',
                        })
                except Exception:
                    pass

    # ── Estratégia C: links /web/dou/-/ com extração por bloco de artigo ─────
    if not resultado:
        # Divide o HTML em blocos por artigo para associar órgão correto a cada um
        # O DOU separa artigos por seções de órgão — tentamos identificar essas seções
        blocos = re.split(r'(?=<(?:div|section|article)[^>]+class="[^"]*(?:grupo|section|article|ato)[^"]*")', html, flags=re.I)

        orgao_corrente = ""
        for bloco in blocos:
            # Tenta extrair órgão do início do bloco
            orgao_bloco = _extrair_orgao_de_bloco_html(bloco[:500])
            if orgao_bloco:
                orgao_corrente = orgao_bloco

            for link, titulo in re.findall(
                r'href="(https?://www\.in\.gov\.br/web/dou/-/[^"]+)"[^>]*>\s*([^<]{5,150})',
                bloco, re.I
            ):
                t = _limpo(titulo)
                if not t or t in vistos or re.search(r'[{}":]', t):
                    continue

                # Órgão: usar o do bloco atual se encontrado; hint APENAS se filtro aplicado
                orgao = orgao_corrente
                if not orgao and usar_hint_como_fallback:
                    orgao = orgao_hint

                vistos.add(t)
                resultado.append({
                    "title":      t,
                    "urlAddress": link,
                    "orgaoName":  orgao,
                    "content":    "",
                    "pubDate":    "",
                    "identifica": "",
                })

    return resultado


# ── Extração de valores monetários ────────────────────────────────────────────

def _extrair_valores(texto: str) -> list[str]:
    """Extrai referências a valores monetários no texto."""
    valores: list[str] = []
    for m in re.finditer(
        r'R\$\s*[\d\.]+(?:,\d+)?(?:\s*(?:mil|milh[oõ]es?|bilh[oõ]es?))?',
        texto, re.I
    ):
        v = m.group().strip()
        if v not in valores:
            valores.append(v)
    return valores[:5]  # Máximo 5 referências


# ── Consulta DOU ──────────────────────────────────────────────────────────────

async def _buscar_portarias_ms(data_ref: date) -> tuple[list[dict[str, Any]], dict]:
    """
    Busca SOMENTE portarias do Ministério da Saúde no DOU.

    Regra fundamental: só aceitar item se o TÍTULO contiver sigla MS explícita
    (GM/MS, SAPS/MS, SAES/MS etc.) OU orgaoName for comprovadamente do MS.
    usar_hint_como_fallback=False em todas as estratégias para não contaminar
    resultados de outros órgãos.

    Estratégias (ordem de confiabilidade):
    1. leiturajornal org="Ministério da Saúde" + ato="Portaria" — DO1 e DO2
    2. leiturajornal org="Ministério da Saúde" + ato="Portaria Normativa"
    3. API buscar-conteudo só se 1+2 retornaram 0 resultados
    """
    data_str = data_ref.strftime("%d-%m-%Y")
    log: dict[str, Any] = {
        "data":            data_str,
        "fontes_tentadas": [],
        "total_bruto":     0,
        "descartados":     [],
        "aceitos":         0,
        "falhas":          [],
        "estrategia_usada": "",
    }

    hdrs = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 ERSUS360/5.0"
        ),
        "Accept":          "text/html,application/xhtml+xml,*/*",
        "Referer":         "https://www.in.gov.br/leiturajornal",
        "Accept-Language": "pt-BR,pt;q=0.9",
    }

    brutos: list[dict] = []

    # ── Estratégia 1 e 2: leiturajornal com filtro duplo org + ato ───────────
    # Regra de hint seletivo:
    # - Items com sigla explícita no título (GM/MS, SAPS/MS etc.) → validar pelo título
    # - Items sem sigla no título (PORTARIA Nº X) → aplicar hint "Ministério da Saúde"
    #   pois o DOU filtrou por org=MS e o formato genérico não tem sigla
    # - Items com sigla de outro órgão no título → rejeitar sempre
    TIPOS_PORTARIA = ["Portaria", "Portaria Normativa"]
    for tipo_ato in TIPOS_PORTARIA:
        for secao in ("do1", "do2"):
            fonte = f"leiturajornal/{tipo_ato.replace(' ','_')}/{secao}"
            try:
                async with httpx.AsyncClient(timeout=30, follow_redirects=True) as c:
                    r = await c.get(
                        DOU_LEITURA,
                        params={
                            "data":  data_str,
                            "secao": secao,
                            "org":   "Ministério da Saúde",
                            "ato":   tipo_ato,
                        },
                        headers=hdrs,
                    )
                log["fontes_tentadas"].append(fonte)
                if r.status_code == 200:
                    extraidos = _extrair_portarias_html(
                        r.text, usar_hint_como_fallback=False
                    )
                    validos = []
                    for p in extraidos:
                        titulo_p = p.get("title", "")
                        # Exige que seja portaria
                        if not re.search(r'^\s*portaria\b', titulo_p, re.I):
                            continue
                        resultado_titulo = _titulo_confirma_ms(titulo_p)

                        if resultado_titulo is True:
                            # Sigla MS explícita no título → aceitar
                            validos.append(p)
                        elif resultado_titulo is False:
                            # Sigla de outro órgão explícita → rejeitar
                            continue
                        else:
                            # resultado_titulo is None: título sem sigla identificável
                            # Só aceita se o orgaoName da API (sem hint) for definitivamente MS
                            orgao_api = (p.get("orgaoName") or "").strip()
                            if orgao_api and confirmar_orgao_ms(orgao_api.lower(), titulo_p):
                                validos.append(p)
                            # Sem sigla MS no título E orgaoName vazio/não-MS → REJEITAR
                            # (evita falsos positivos de outros órgãos com título genérico)
                    if validos:
                        brutos.extend(validos)
                        log["estrategia_usada"] = fonte
                        logger.info(
                            "[DOU] %s %s — %d brutos, %d válidos",
                            fonte, data_str, len(extraidos), len(validos)
                        )
                    else:
                        logger.info("[DOU] %s %s — 0 portarias MS", fonte, data_str)
                else:
                    log["falhas"].append(f"{fonte}: HTTP {r.status_code}")
            except Exception as exc:
                log["falhas"].append(f"{fonte}: {exc}")
                logger.warning("[DOU] %s erro: %s", fonte, exc)

    # ── Estratégia 3: API /buscar-conteudo — só se nenhum resultado ──────────
    if not brutos:
        for secao in ("DO1", "DO2"):
            fonte = f"API/{secao}/Portaria"
            try:
                async with httpx.AsyncClient(timeout=20, follow_redirects=True) as c:
                    r = await c.get(
                        DOU_BUSCA,
                        params={
                            "orgaoPesquisa": "Ministério da Saúde",
                            "data":          data_str,
                            "tipoDeAto":     "Portaria",
                            "secao":         secao,
                            "numberPerPage": "100",
                        },
                        headers={**hdrs, "Accept": "application/json, */*"},
                    )
                log["fontes_tentadas"].append(fonte)
                if r.status_code == 200:
                    try:
                        d = r.json()
                        items = (d if isinstance(d, list)
                                 else d.get("items") or d.get("content") or d.get("results") or [])
                        if items:
                            # Sem hint — validação obrigatória por título
                            validos = [
                                p for p in items
                                if isinstance(p, dict)
                                and re.search(r'\bportaria\b', p.get("title", "") or p.get("identifica", ""), re.I)
                                and confirmar_orgao_ms(
                                    p.get("orgaoName", ""),
                                    p.get("title", "") or p.get("identifica", "")
                                )
                            ]
                            brutos.extend(validos)
                            logger.info("[DOU] %s %s — %d JSON, %d MS válidos", fonte, data_str, len(items), len(validos))
                    except Exception:
                        extraidos = _extrair_portarias_html(r.text, usar_hint_como_fallback=False)
                        validos = [
                            p for p in extraidos
                            if re.search(r'\bportaria\b', p.get("title", ""), re.I)
                            and confirmar_orgao_ms(p.get("orgaoName", ""), p.get("title", ""))
                        ]
                        brutos.extend(validos)
            except Exception as exc:
                log["falhas"].append(f"{fonte}: {exc}")

    # ── Filtro principal: PORTARIA + órgão MS ────────────────────────────────
    log["total_bruto"] = len(brutos)
    aceitos: list[dict] = []

    for p in brutos:
        orgao_raw = (p.get("orgaoName") or p.get("orgao") or "").strip()
        titulo    = (p.get("title") or p.get("titulo") or p.get("identifica") or "").strip()

        # Filtro 1: título deve começar com PORTARIA (obrigatório)
        if not re.search(r'^\s*portaria\b', titulo, re.I):
            log["descartados"].append({
                "titulo": titulo[:80],
                "orgao":  orgao_raw[:80],
                "motivo": "Tipo de ato inválido — não é portaria",
            })
            continue

        # Filtro 2: órgão MS confirmado pelo título ou orgaoName
        if not confirmar_orgao_ms(orgao_raw, titulo):
            resultado_titulo = _titulo_confirma_ms(titulo)
            if resultado_titulo is False:
                motivo = f"Título indica órgão não-MS: '{titulo[:80]}'"
            elif orgao_raw:
                motivo = f"Órgão '{orgao_raw[:80]}' não pertence ao Ministério da Saúde"
            else:
                motivo = (
                    "Campo orgaoName ausente e título não confirma órgão MS. "
                    "Descartado por segurança."
                )
            log["descartados"].append({
                "titulo": titulo[:80],
                "orgao":  orgao_raw[:80],
                "motivo": motivo,
            })
            logger.debug("[DOU] Descartado: %s — %s", titulo[:60], motivo)
            continue

        aceitos.append(p)

    # ── Deduplicação por chave composta ───────────────────────────────────────
    vistos_chaves: set[str] = set()
    dedup: list[dict] = []
    for p in aceitos:
        chave = _gerar_chave_dedup(p)
        if chave not in vistos_chaves:
            vistos_chaves.add(chave)
            p["_chave_dedup"] = chave
            dedup.append(p)

    log["aceitos"] = len(dedup)
    logger.info(
        "[DOU] %s — %d brutas, %d descartadas, %d aceitas (MS válidas)",
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

    # Filtros reais confirmados pelo portal DOU: org= e ato=
    from urllib.parse import urlencode
    qs = urlencode({
        "data":   data_fmt,
        "secao":  "do1",
        "org":    "Ministério da Saúde",
        "ato":    "Portaria",
    })
    return f"https://www.in.gov.br/leiturajornal?{qs}"


# ── Classificação de abrangência e prioridade ─────────────────────────────────

def _classificar_prioridade(titulo: str, corpo: str, relevancia: str) -> str:
    """
    Classifica nível de prioridade para o gestor municipal:
    urgente | prazo | financeiro | normativo | sem_impacto
    """
    texto = (titulo + " " + corpo).lower()
    if relevancia == "apui":
        return "urgente"
    if any(t in texto for t in TERMOS_URGENTE):
        return "urgente"
    if any(t in texto for t in ["prazo", "data limite", "até o dia", "até "]):
        return "prazo"
    if any(t in texto for t in ["repasse", "transferência", "transferencia",
                                   "recurso financeiro", "valor", "custeio",
                                   "investimento", "fundo", "emenda parlamentar"]):
        return "financeiro"
    if relevancia in ("federal", "amazonas"):
        return "normativo"
    return "sem_impacto"


def _classificar(p: dict, data_ref: date | None = None) -> dict:
    """
    Classifica relevância da portaria para Apuí/AM e define prioridade.
    """
    if data_ref is None:
        data_ref = date.today()

    titulo_orig = (p.get("title") or p.get("titulo") or "Sem título")
    corpo_orig  = (p.get("content") or p.get("conteudo") or p.get("texto") or "")
    numero_orig = (p.get("identifica") or p.get("numero") or p.get("numberSection") or "")
    orgao_orig  = (p.get("orgaoName") or p.get("orgao") or "Ministério da Saúde")

    # Tipo do ato inferido do título quando não disponível na estrutura
    tipo_ato = p.get("tipoDeAto") or p.get("tipo_ato") or "Portaria"
    if not p.get("tipoDeAto"):
        t_lower = titulo_orig.lower()
        if "portaria normativa" in t_lower:
            tipo_ato = "Portaria Normativa"
        elif "portaria conjunta" in t_lower:
            tipo_ato = "Portaria Conjunta"
        elif "instrução normativa" in t_lower or "instrucao normativa" in t_lower:
            tipo_ato = "Instrução Normativa"
        elif "resolução" in t_lower or "resolucao" in t_lower:
            tipo_ato = "Resolução"
        elif "despacho" in t_lower:
            tipo_ato = "Despacho"
        else:
            tipo_ato = "Portaria"

    # Cópias lowercased apenas para classificação — nunca armazenadas como _resumo
    titulo = titulo_orig.lower()
    corpo  = corpo_orig.lower()
    numero = numero_orig.lower()
    texto  = f"{titulo} {corpo} {numero}"

    if any(t in texto for t in TERMOS_APUI):
        relevancia = "apui"
    elif any(t in texto for t in TERMOS_AMAZONAS):
        relevancia = "amazonas"
    elif any(t in texto for t in TERMOS_FEDERAL_MUNICIPAL):
        relevancia = "federal"
    else:
        # Portaria MS validada → padrão "federal": toda portaria MS afeta municípios
        # Só marca "sem_impacto" se for claramente um ato interno (despacho sem conteúdo)
        tipo_lower = tipo_ato.lower()
        if tipo_lower in ("despacho",) and not corpo.strip():
            relevancia = "sem_impacto"
        else:
            relevancia = "federal"

    prioridade = _classificar_prioridade(titulo, corpo, relevancia)
    valores    = _extrair_valores(texto)

    return {
        **p,
        "_relevancia": relevancia,
        "_prioridade": prioridade,
        "_tipo_ato":   tipo_ato,
        "_titulo":     titulo_orig,
        "_numero":     numero_orig,
        "_link":       _resolver_link(p, data_ref),
        "_data":       (p.get("pubDate") or p.get("dataPublicacao") or ""),
        "_resumo":     _capitalizar_sentencas(corpo_orig[:600]) if corpo_orig else "(Acesse o link para ver o conteúdo completo)",
        "_orgao":      orgao_orig,
        "_valores":    valores,
    }


# ── Análise de impacto ────────────────────────────────────────────────────────

def _analisar_impacto(titulo: str, corpo: str) -> dict:
    """
    Analisa o conteúdo da portaria e retorna impacto estruturado.
    Não inventa informações — só registra quando há evidência textual.
    """
    texto = (titulo + " " + corpo).lower()

    financeiro: list[str] = []
    assistencial: list[str] = []
    administrativo: list[str] = []
    providencias: list[str] = []

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
    valores = _extrair_valores(texto)
    if valores:
        financeiro.append(
            f"Valores identificados no texto: {', '.join(valores)}. "
            "Verificar associação ao município."
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
    if any(t in texto for t in ["sistema", "sigtap", "rnds", "cnes", "ine"]):
        administrativo.append(
            "Envolve sistemas de informação. Verificar obrigação de atualização cadastral."
        )
    if any(t in texto for t in ["prestação de contas", "prestacao de contas",
                                   "relatório", "relatorio"]):
        administrativo.append(
            "Exige prestação de contas ou relatório. Verificar responsável e prazo."
        )

    # Providências imediatas
    if any(t in texto for t in ["apuí", "apui", "1300144"]):
        providencias.append(
            "AÇÃO IMEDIATA: O município de Apuí/AM está citado expressamente. "
            "Ler o texto integral e anexos com urgência."
        )
    if any(t in texto for t in TERMOS_URGENTE):
        providencias.append(
            "Portaria contém prazo urgente ou risco de suspensão de recursos. "
            "Verificar imediatamente o texto integral."
        )

    return {
        "financeiro":     financeiro,
        "assistencial":   assistencial,
        "administrativo": administrativo,
        "providencias":   providencias,
        "sem_impacto":    not (financeiro or assistencial or administrativo),
    }


# ── Informe Técnico ───────────────────────────────────────────────────────────

def gerar_informe_tecnico(p: dict, numero_seq: int, ano: int) -> str:
    """Gera Informe Técnico em HTML estruturado (8 seções)."""
    titulo   = p.get("_titulo", "Sem título")
    numero   = p.get("_numero", "Não identificado")
    data_pub = p.get("_data",   "Não informada")
    orgao    = p.get("_orgao",  "Ministério da Saúde")
    link     = p.get("_link",   "https://www.in.gov.br/leiturajornal")
    resumo   = p.get("_resumo", "(sem texto disponível)")
    rel      = p.get("_relevancia", "federal")
    valores  = p.get("_valores", [])

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

    cor_abrang = {
        "apui": "#dc2626", "amazonas": "#d97706",
        "federal": "#2563eb", "sem_impacto": "#6b7280",
    }.get(rel, "#2563eb")

    # Tabela de valores
    if valores:
        valores_html = (
            "<table style='font-size:12px;border-collapse:collapse;width:100%'>"
            "<tr style='background:#f1f5f9'>"
            "<th style='padding:6px 10px;text-align:left;border:1px solid #e2e8f0'>Valor identificado</th>"
            "<th style='padding:6px 10px;text-align:left;border:1px solid #e2e8f0'>Observação</th>"
            "</tr>"
            + "".join(
                f"<tr><td style='padding:5px 10px;border:1px solid #e2e8f0'>{v}</td>"
                f"<td style='padding:5px 10px;border:1px solid #e2e8f0;color:#6b7280'>"
                f"Verificar associação a Apuí (IBGE {MUNICIPIO_IBGE}) no texto integral</td></tr>"
                for v in valores
            )
            + "</table>"
        )
    else:
        valores_html = (
            "<p style='color:#6b7280;font-style:italic'>"
            "Informação não identificada no ato analisado. Acesse o texto integral "
            "e os anexos no link oficial do DOU para verificar valores, CNES, INE e competências.</p>"
        )

    tem_prazo = impacto["administrativo"] and any(
        "prazo" in a.lower() for a in impacto["administrativo"]
    )

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:800px;margin:0 auto;
                border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;
                margin-bottom:32px;page-break-inside:avoid">

      <!-- Cabeçalho -->
      <div style="background:#1d4ed8;padding:18px 24px">
        <div style="color:rgba(255,255,255,.7);font-size:11px;text-transform:uppercase;
                    letter-spacing:1px">Informe Técnico Nº {numero_seq:03d}/{ano}</div>
        <div style="color:#fff;font-size:16px;font-weight:700;margin-top:4px">{titulo}</div>
      </div>

      <div style="padding:20px 24px;background:#fff">

        <!-- 1. Identificação -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            1. Identificação do Ato
          </div>
          <table style="font-size:12px;color:#374151;border-collapse:collapse;width:100%">
            <tr><td style="padding:3px 12px 3px 0;font-weight:600;width:200px">Portaria</td>
                <td>{numero or 'Não identificado'}</td></tr>
            <tr><td style="padding:3px 12px 3px 0;font-weight:600">Publicação DOU</td>
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
                      color:#1d4ed8;letter-spacing:.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">2. Objeto</div>
          <div style="font-size:12px;color:#374151;line-height:1.7;
                      background:#f8fafc;padding:12px;border-radius:6px">
            {resumo}
          </div>
        </div>

        <!-- 3. Abrangência -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">3. Abrangência</div>
          <span style="background:{cor_abrang};color:#fff;font-size:12px;font-weight:600;
                       padding:5px 16px;border-radius:20px">{abrangencia_texto}</span>
        </div>

        <!-- 4. Impacto -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            4. Impacto para Apuí/AM
          </div>
          {"<div style='background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;padding:10px 14px;margin-bottom:10px'><strong style='color:#dc2626'>⚡ Ação imediata requerida:</strong><ul style='margin:6px 0;padding-left:20px'>" + "".join(f"<li>{prov}</li>" for prov in impacto["providencias"]) + "</ul></div>" if impacto["providencias"] else ""}
          <div style="font-size:12px;font-weight:600;color:#374151;margin:8px 0 4px">Impacto financeiro</div>
          {lista_html(impacto["financeiro"], "Não identificado impacto financeiro direto no texto analisado.")}
          <div style="font-size:12px;font-weight:600;color:#374151;margin:8px 0 4px">Impacto assistencial</div>
          {lista_html(impacto["assistencial"], "Não identificado impacto assistencial direto no texto analisado.")}
          <div style="font-size:12px;font-weight:600;color:#374151;margin:8px 0 4px">Impacto administrativo</div>
          {lista_html(impacto["administrativo"], "Não identificado impacto administrativo direto no texto analisado.")}
        </div>

        <!-- 5. Valores e Beneficiários -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            5. Valores e Beneficiários
          </div>
          {valores_html}
        </div>

        <!-- 6. Providências Recomendadas -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            6. Providências Recomendadas
          </div>
          <table style="font-size:12px;border-collapse:collapse;width:100%;margin-bottom:10px">
            <tr style="background:#f1f5f9">
              <th style="padding:6px 10px;text-align:left;border:1px solid #e2e8f0">Providência</th>
              <th style="padding:6px 10px;text-align:left;border:1px solid #e2e8f0">Setor</th>
              <th style="padding:6px 10px;text-align:left;border:1px solid #e2e8f0">Prioridade</th>
            </tr>
            <tr>
              <td style="padding:5px 10px;border:1px solid #e2e8f0">
                Acessar o link oficial e ler o texto integral e anexos
              </td>
              <td style="padding:5px 10px;border:1px solid #e2e8f0">Assessoria Técnica</td>
              <td style="padding:5px 10px;border:1px solid #e2e8f0">Alta</td>
            </tr>
            <tr>
              <td style="padding:5px 10px;border:1px solid #e2e8f0">
                Verificar se Apuí (IBGE {MUNICIPIO_IBGE}) consta como beneficiário
              </td>
              <td style="padding:5px 10px;border:1px solid #e2e8f0">Assessoria Técnica</td>
              <td style="padding:5px 10px;border:1px solid #e2e8f0">Alta</td>
            </tr>
            {"<tr><td style='padding:5px 10px;border:1px solid #e2e8f0'>Verificar prazo e acionar setor responsável</td><td style='padding:5px 10px;border:1px solid #e2e8f0'>Secretaria de Saúde</td><td style='padding:5px 10px;border:1px solid #e2e8f0;color:#dc2626;font-weight:700'>Urgente</td></tr>" if tem_prazo else ""}
          </table>
        </div>

        <!-- 7. Prazos e Riscos -->
        <div style="margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#1d4ed8;letter-spacing:.8px;margin-bottom:8px;
                      border-bottom:2px solid #dbeafe;padding-bottom:4px">
            7. Prazos e Riscos
          </div>
          <div style="font-size:12px;color:#6b7280;font-style:italic">
            {"⚠️ Portaria contém referência a prazo. Verificar data exata no texto integral e registrar no controle de prazos da Secretaria." if tem_prazo else "Prazo não identificado automaticamente. Verificar no texto integral do DOU e registrar se houver."}
          </div>
        </div>

        <!-- 8. Conclusão -->
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:14px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;
                      color:#15803d;letter-spacing:.8px;margin-bottom:6px">
            8. Conclusão
          </div>
          <div style="font-size:12px;color:#374151;line-height:1.6">
            {"Portaria com referência direta a Apuí/AM. Leitura integral do ato e dos anexos é obrigatória com urgência."
            if rel == "apui" else
            "Portaria aplicável ao Estado do Amazonas. Verificar se Apuí está incluído como município beneficiário."
            if rel == "amazonas" else
            "Norma federal do Ministério da Saúde com potencial aplicação municipal. Verificar elegibilidade e obrigações para Apuí/AM."
            if rel == "federal" else
            "Não foi identificado impacto direto para o Município de Apuí/AM após análise do texto e dos anexos disponíveis."}
          </div>
        </div>

        <!-- Assinaturas -->
        <div style="margin-top:24px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#6b7280">
          <div>Destinatária: <strong>Rosângela Motter</strong> — Secretária Municipal de Saúde de Apuí/AM</div>
          <div>Elaborado por: <strong>Euler Ramos de Oliveira</strong> — Assessor Técnico em Saúde Pública</div>
          <div>Gerado pelo ERSUS 360 · {datetime.now().strftime('%d/%m/%Y %H:%M')} (America/Manaus)</div>
        </div>

        <!-- Link DOU -->
        <div style="margin-top:14px;padding:10px 14px;background:#f8fafc;
                    border-radius:6px;font-size:11px;border:1px solid #e2e8f0">
          <div style="color:#64748b;margin-bottom:4px">🔗 Ver DOU na data de publicação</div>
          <a href="{link}" style="color:#1d4ed8;word-break:break-all">{link}</a>
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

    COR = {"apui": "#dc2626", "amazonas": "#d97706", "federal": "#2563eb"}
    LABEL = {
        "apui":    "📍 Apuí/AM — Ação imediata",
        "amazonas":"🏛 Estado do Amazonas",
        "federal": "🇧🇷 Federal com aplicação municipal",
    }

    def _card(p: dict, rel: str, seq: int) -> str:
        titulo    = p.get("_titulo", "")
        numero    = p.get("_numero", "")
        link      = p.get("_link",   "https://www.in.gov.br/leiturajornal")
        resumo    = p.get("_resumo", "")
        prioridade = p.get("_prioridade", "normativo")
        COR_PRIO = {
            "urgente":    "#dc2626",
            "prazo":      "#d97706",
            "financeiro": "#059669",
            "normativo":  "#2563eb",
            "sem_impacto":"#6b7280",
        }
        prio_cor  = COR_PRIO.get(prioridade, "#2563eb")
        prio_text = {
            "urgente":    "🔴 Urgente",
            "prazo":      "🟠 Prazo/Providência",
            "financeiro": "🟢 Recurso Financeiro",
            "normativo":  "🔵 Orientação Normativa",
            "sem_impacto":"⚪ Sem impacto direto",
        }.get(prioridade, prioridade)

        return f"""
        <div style="border:1px solid {COR[rel]}30;border-radius:8px;margin-bottom:12px;overflow:hidden">
          <div style="background:{COR[rel]}10;padding:12px 16px;border-left:4px solid {COR[rel]}">
            <div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap">
              <span style="background:{COR[rel]};color:#fff;font-size:10px;font-weight:700;
                           padding:2px 10px;border-radius:20px">{LABEL[rel]}</span>
              <span style="background:{prio_cor}18;color:{prio_cor};font-size:10px;font-weight:700;
                           padding:2px 10px;border-radius:20px;border:1px solid {prio_cor}40">
                {prio_text}
              </span>
            </div>
            <div style="font-size:13px;font-weight:700;color:#1e293b">{titulo}</div>
            {f'<div style="font-size:11px;color:#64748b;margin-top:2px">{numero}</div>' if numero else ''}
          </div>
          <div style="padding:10px 16px;font-size:12px;color:#374151;line-height:1.6">
            {resumo[:400] + '…' if len(resumo) > 400 else resumo}
          </div>
          <div style="padding:8px 16px;border-top:1px solid #f1f5f9">
            <a href="{link}" style="color:#1d4ed8;font-size:12px;font-weight:600">
              📎 Ver no DOU →
            </a>
          </div>
        </div>"""

    if sem_relevante:
        corpo = f"""
        <div style="text-align:center;padding:40px;color:#64748b">
          <div style="font-size:36px;margin-bottom:12px">✅</div>
          <div style="font-size:16px;font-weight:700">Nenhum ato com impacto direto</div>
          <div style="font-size:13px;margin-top:8px">
            Na consulta ao Diário Oficial da União de {data_fmt}, não foram identificados
            novos atos do Ministério da Saúde com impacto direto ou providências imediatas
            para o Município de Apuí/AM.
          </div>
        </div>"""
    else:
        secoes = ""
        for portarias, rel in [(portarias_apui, "apui"),
                                (portarias_am,   "amazonas"),
                                (portarias_fed,  "federal")]:
            if portarias:
                secoes += f"""
                <div style="margin-bottom:24px">
                  <div style="font-size:12px;font-weight:700;color:{COR[rel]};
                              text-transform:uppercase;letter-spacing:.8px;
                              margin-bottom:10px;border-bottom:2px solid {COR[rel]}30;
                              padding-bottom:6px">
                    {LABEL[rel]} — {len(portarias)} ato(s)
                  </div>
                  {"".join(_card(p, rel, i+1) for i, p in enumerate(portarias))}
                </div>"""
        corpo = secoes

    # Log de execução
    log_html = ""
    if log_exec:
        desc = log_exec.get("descartados", [])
        falhas = log_exec.get("falhas", [])
        if desc or falhas:
            log_html = f"""
            <div style="margin-top:24px;padding:14px;background:#f8fafc;
                        border-radius:8px;font-size:11px;color:#64748b;
                        border:1px solid #e2e8f0">
              <div style="font-weight:700;color:#475569;margin-bottom:8px">
                📋 Log de execução
              </div>
              <div>Fonte: {log_exec.get('estrategia_usada','não informada')}</div>
              <div>Brutas: {log_exec.get('total_bruto',0)} · Descartadas: {len(desc)} · Aceitas: {log_exec.get('aceitos',0)}</div>
              {('<div style="margin-top:6px;color:#dc2626">Falhas: ' + ' | '.join(falhas[:3]) + '</div>') if falhas else ''}
            </div>"""

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>ERSUS360 — Portarias MS — {data_fmt}</title>
</head>
<body style="font-family:Arial,sans-serif;margin:0;padding:20px 32px;
             color:#1e293b;background:#f8fafc;font-size:13px">
  <div style="max-width:700px;margin:0 auto">

    <!-- Cabeçalho -->
    <div style="background:#1d4ed8;border-radius:10px;padding:20px 28px;margin-bottom:24px">
      <div style="color:rgba(255,255,255,.7);font-size:11px;font-weight:700;
                  text-transform:uppercase;letter-spacing:1px">ERSUS 360</div>
      <div style="color:#fff;font-size:18px;font-weight:800;margin-top:4px">
        Portarias do Ministério da Saúde — DOU
      </div>
      <div style="color:rgba(255,255,255,.8);font-size:13px;margin-top:4px">{data_fmt}</div>
    </div>

    <!-- Resumo -->
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
      {"".join(f'<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;text-align:center;min-width:90px"><div style="font-size:22px;font-weight:800;color:{cor}">{val}</div><div style="font-size:10px;color:#64748b;font-weight:600">{lab}</div></div>'
        for val, lab, cor in [
          (total,                    "MS válidos",     "#1d4ed8"),
          (len(portarias_apui),      "Apuí/AM",        "#dc2626"),
          (len(portarias_am),        "Amazonas",       "#d97706"),
          (len(portarias_fed),       "Federal Munic.", "#2563eb"),
        ])}
    </div>

    {corpo}
    {log_html}

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;
                font-size:11px;color:#94a3b8;text-align:center">
      ERSUS 360 — Sistema de Monitoramento em Saúde Pública · Apuí/AM<br>
      Secretária: Rosângela Motter · Assessor: Euler Ramos de Oliveira<br>
      Gerado automaticamente em {datetime.now().strftime('%d/%m/%Y %H:%M')} (America/Manaus)
    </div>
  </div>
</body>
</html>"""


# ── Envio de e-mail ───────────────────────────────────────────────────────────

async def _enviar_email(assunto: str, html: str) -> dict:
    if EMAIL_PROVIDER == "resend":
        return await _enviar_resend(assunto, html)
    return await _enviar_smtp(assunto, html)


async def _enviar_smtp(assunto: str, html: str) -> dict:
    if not SMTP_USER or not SMTP_PASS:
        return {"ok": False, "erro": "SMTP_USER ou SMTP_PASS não configurados"}
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = assunto
        msg["From"]    = EMAIL_FROM
        msg["To"]      = EMAIL_RECIPIENT
        msg.attach(MIMEText(html, "html", "utf-8"))
        ctx = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.ehlo()
            s.starttls(context=ctx)
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(EMAIL_FROM, EMAIL_RECIPIENT, msg.as_string())
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "erro": str(e)}


async def _enviar_resend(assunto: str, html: str) -> dict:
    if not RESEND_API_KEY:
        return {"ok": False, "erro": "RESEND_API_KEY não configurado"}
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}",
                         "Content-Type": "application/json"},
                json={"from": EMAIL_FROM, "to": [EMAIL_RECIPIENT],
                      "subject": assunto, "html": html},
            )
        if r.status_code in (200, 201):
            return {"ok": True}
        return {"ok": False, "erro": f"Resend HTTP {r.status_code}: {r.text[:200]}"}
    except Exception as e:
        return {"ok": False, "erro": str(e)}


# ── Persistência no banco ─────────────────────────────────────────────────────

async def _salvar_portarias_db(
    portarias: list[dict],
    data_ref: date,
    log_exec: dict,
    resultado_email: dict,
    modo: str = "auto",
    usuario: str | None = None,
) -> None:
    """
    Salva portarias classificadas e log de execução no banco de dados.
    Usa a chave_dedup para evitar inserções duplicadas (INSERT OR IGNORE).
    """
    try:
        from database import AsyncSessionLocal
        from models.portaria_dou import PortariaDOU, ExecucaoPortarias
        from sqlalchemy import select
        import json as _json

        agora = datetime.utcnow()
        sem_impacto = [p for p in portarias if p["_relevancia"] == "sem_impacto"]

        async with AsyncSessionLocal() as db:
            # ── Salva portarias ───────────────────────────────────────────────
            inseridos = duplicatas = 0
            for p in portarias:
                chave = p.get("_chave_dedup") or _gerar_chave_dedup(p)
                # Verifica duplicata
                ex = await db.execute(
                    select(PortariaDOU).where(PortariaDOU.chave_dedup == chave)
                )
                if ex.scalar_one_or_none():
                    duplicatas += 1
                    continue

                impacto = _analisar_impacto(
                    p.get("_titulo", ""), p.get("_resumo", "")
                )
                row = PortariaDOU(
                    titulo=p.get("_titulo", "")[:1000],
                    numero=p.get("_numero", "")[:100],
                    tipo_ato=(p.get("_tipo_ato") or "Portaria")[:50],
                    data_publicacao=data_ref.strftime("%Y-%m-%d"),
                    secao_dou="DO1",
                    orgao=p.get("_orgao", "")[:200],
                    resumo=(p.get("_resumo") or "")[:600],
                    url_oficial=(p.get("_link") or "")[:1000],
                    id_dou=(p.get("id_dou") or p.get("urlAddress") or "")[:200],
                    relevancia=p.get("_relevancia", "sem_impacto"),
                    prioridade=p.get("_prioridade", "normativo"),
                    valores_identificados=_json.dumps(p.get("_valores", []), ensure_ascii=False),
                    impacto_financeiro=_json.dumps(impacto["financeiro"], ensure_ascii=False),
                    impacto_assistencial=_json.dumps(impacto["assistencial"], ensure_ascii=False),
                    impacto_administrativo=_json.dumps(impacto["administrativo"], ensure_ascii=False),
                    providencias=_json.dumps(impacto["providencias"], ensure_ascii=False),
                    chave_dedup=chave,
                    status="processado",
                    capturado_em=agora,
                    processado_em=agora,
                )
                db.add(row)
                inseridos += 1

            # ── Salva log de execução ─────────────────────────────────────────
            apui    = [p for p in portarias if p["_relevancia"] == "apui"]
            am      = [p for p in portarias if p["_relevancia"] == "amazonas"]
            federal = [p for p in portarias if p["_relevancia"] == "federal"]

            exec_log = ExecucaoPortarias(
                data_referencia=data_ref.isoformat(),
                iniciado_em=agora,
                concluido_em=datetime.utcnow(),
                estrategia_usada=log_exec.get("estrategia_usada", ""),
                fontes_tentadas=_json.dumps(log_exec.get("fontes_tentadas", []), ensure_ascii=False),
                total_bruto=log_exec.get("total_bruto", 0),
                total_descartados=len(log_exec.get("descartados", [])),
                total_aceitos=log_exec.get("aceitos", 0),
                total_apui=len(apui),
                total_amazonas=len(am),
                total_federal=len(federal),
                total_sem_impacto=len(sem_impacto),
                total_duplicatas=duplicatas,
                descartados_json=_json.dumps(
                    log_exec.get("descartados", [])[:50], ensure_ascii=False
                ),
                falhas_json=_json.dumps(log_exec.get("falhas", []), ensure_ascii=False),
                email_enviado=resultado_email.get("ok", False),
                email_erro=resultado_email.get("erro"),
                modo=modo,
                usuario=usuario,
            )
            db.add(exec_log)
            await db.commit()

            logger.info(
                "[DB] %s — %d inseridas, %d duplicatas ignoradas",
                data_ref, inseridos, duplicatas
            )
    except Exception as exc:
        logger.error("[DB] Falha ao salvar portarias no banco: %s", exc, exc_info=True)


# ── Execução diária ───────────────────────────────────────────────────────────

async def executar_envio_diario(
    data_ref: date | None = None,
    forcar: bool = False,
    modo: str = "auto",
    usuario: str | None = None,
) -> dict:
    if data_ref is None:
        data_ref = date.today()

    logger.info("[Portarias] Iniciando execução — %s (modo=%s)", data_ref, modo)

    try:
        portarias_brutas, log_exec = await _buscar_portarias_ms(data_ref)
    except Exception as exc:
        logger.error("[Portarias] Falha na busca DOU: %s", exc)
        return {"ok": False, "erro": f"Falha ao consultar o DOU: {exc}"}

    portarias = [_classificar(p, data_ref) for p in portarias_brutas]

    apui    = [p for p in portarias if p["_relevancia"] == "apui"]
    am      = [p for p in portarias if p["_relevancia"] == "amazonas"]
    federal = [p for p in portarias if p["_relevancia"] == "federal"]

    data_fmt = data_ref.strftime("%d/%m/%Y")
    assunto  = f"ERSUS360 — Portarias do Ministério da Saúde no DOU — {data_fmt}"

    if not apui and not am and not federal:
        assunto = f"ERSUS360 — DOU {data_fmt} — Sem portarias MS com impacto identificado"

    html = _gerar_html(data_ref, apui, am, federal, log_exec)
    resultado = await _enviar_email(assunto, html)
    resultado.update({
        "data":              data_fmt,
        "qtd_portarias":     len(portarias),
        "qtd_apui":          len(apui),
        "qtd_amazonas":      len(am),
        "qtd_federal":       len(federal),
        "log":               log_exec,
    })

    # Persiste no banco (não bloqueia retorno se falhar)
    try:
        await _salvar_portarias_db(portarias, data_ref, log_exec, resultado, modo, usuario)
    except Exception as exc:
        logger.error("[Portarias] Falha ao persistir no banco: %s", exc)
        resultado["aviso_db"] = f"Dados não persistidos no banco: {exc}"

    logger.info(
        "[Portarias] %s — %d portarias MS (%d Apuí, %d AM, %d Federal) — email: %s",
        data_ref, len(portarias), len(apui), len(am), len(federal),
        "ok" if resultado.get("ok") else resultado.get("erro"),
    )
    return resultado


# ── Testes de validação de órgão ─────────────────────────────────────────────

def _testes_validacao_orgao() -> dict:
    """
    Suite de testes para confirmar_orgao_ms() com validação por título.
    Retorna {'passou': int, 'falhou': int, 'erros': list}.
    """
    # (orgao, titulo, esperado, descricao)
    casos: list[tuple[str, str, bool, str]] = [
        # ── Validação por TÍTULO (GM/MS, SAPS/MS, etc.) ──────────────────────
        ("",             "PORTARIA GM/MS Nº 12.129, DE 26 DE AGOSTO DE 2026",      True,  "GM/MS pelo título"),
        ("",             "PORTARIA SAPS/MS Nº 1.234, DE 01 DE SETEMBRO DE 2026",  True,  "SAPS pelo título"),
        ("",             "Portaria GM/MS Nº 12.132, de 26 de agosto de 2026",     True,  "GM/MS minúsculas"),
        ("",             "PORTARIA SETAD/MCTI Nº 10.316, DE 28 DE AGOSTO",        False, "SETAD/MCTI pelo título"),
        ("",             "PORTARIA FCRB Nº 85, DE 28 DE AGOSTO DE 2026",          False, "FCRB pelo título"),
        ("",             "PORTARIA CGCCR/SUSEP Nº 30, de 28 de agosto de 2026",   False, "SUSEP pelo título"),
        ("",             "PORTARIA ALF/IGI Nº 60, DE 28 DE AGOSTO DE 2026",       False, "ALF/IGI pelo título"),
        ("",             "PORTARIA MCTI Nº 10.308, DE 28 DE AGOSTO DE 2026",      False, "MCTI pelo título"),
        # ── Validação por ORGAO (fallback quando título não define) ───────────
        ("Ministério da Saúde",                                      "", True,  "MS principal"),
        ("MINISTÉRIO DA SAÚDE",                                      "", True,  "MS maiúsculas"),
        ("ministério da saúde",                                      "", True,  "MS minúsculas"),
        ("Secretaria de Atenção Primária à Saúde",                   "", True,  "SAPS nome completo"),
        ("SAPS/MS",                                                  "", True,  "SAPS sigla"),
        ("Secretaria de Atenção Especializada à Saúde",             "", True,  "SAES nome completo"),
        ("SAES/MS",                                                  "", True,  "SAES sigla"),
        ("Secretaria de Vigilância em Saúde e Ambiente",            "", True,  "SVSA nome"),
        ("SVSA/MS",                                                  "", True,  "SVSA sigla"),
        ("SECTICS/MS",                                               "", True,  "SECTICS sigla"),
        ("SESAI/MS",                                                 "", True,  "SESAI sigla"),
        ("SEIDIGI/MS",                                               "", True,  "SEIDIGI sigla"),
        ("Fundo Nacional de Saúde",                                  "", True,  "FNS nome"),
        ("FNS",                                                      "", True,  "FNS sigla"),
        ("ANVISA",                                                   "", True,  "ANVISA"),
        ("Agência Nacional de Vigilância Sanitária",                "", True,  "ANVISA nome"),
        ("ANS",                                                      "", True,  "ANS"),
        ("FUNASA",                                                   "", True,  "FUNASA"),
        ("FIOCRUZ",                                                  "", True,  "FIOCRUZ"),
        ("GM/MS",                                                    "", True,  "GM/MS sigla"),
        ("Gabinete do Ministro da Saúde",                           "", True,  "Gabinete MS"),
        ("Secretaria-Executiva/MS",                                  "", True,  "SE/MS"),
        ("SE/MS",                                                    "", True,  "SE/MS sigla"),
        ("INCA",                                                     "", True,  "INCA"),
        ("Secretaria de Saúde Indígena / SESAI",                    "", True,  "SESAI com sub"),
        # ── Não-MS por orgao ──────────────────────────────────────────────────
        ("Ministério da Integração e do Desenvolvimento Regional",  "", False, "Integração"),
        ("Ministério da Pesca e Aquicultura",                       "", False, "Pesca"),
        ("Agência Nacional do Petróleo, Gás Natural e Biocombustíveis", "", False, "ANP"),
        ("Ministério da Educação",                                  "", False, "MEC"),
        ("Ministério da Defesa",                                    "", False, "Defesa"),
        ("Ministério da Fazenda",                                   "", False, "Fazenda"),
        ("Ministério do Trabalho",                                  "", False, "Trabalho"),
        ("Ministério da Justiça",                                   "", False, "Justiça"),
        ("Ministério da Infraestrutura",                            "", False, "Infraestrutura"),
        ("Ministério das Comunicações",                             "", False, "Comunicações"),
        ("Ministério da Previdência Social",                        "", False, "Previdência"),
        ("Ministério do Turismo",                                   "", False, "Turismo"),
        ("Ministério da Cultura",                                   "", False, "Cultura"),
        ("Ministério do Meio Ambiente e Mudança do Clima",          "", False, "Meio Ambiente"),
        ("Ministério das Relações Exteriores",                      "", False, "Relações Ext."),
        ("Ministério dos Esportes",                                 "", False, "Esportes"),
        ("Ministério dos Direitos Humanos",                         "", False, "Dir. Humanos"),
        ("Ministério do Desenvolvimento Social",                    "", False, "Des. Social"),
        ("Ministério de Minas e Energia",                           "", False, "Minas e Energia"),
        ("",                                                         "", False, "Vazio"),
    ]

    passou = 0
    falhou = 0
    erros: list[str] = []

    for orgao, titulo, esperado, descricao in casos:
        resultado = confirmar_orgao_ms(orgao, titulo)
        if resultado == esperado:
            passou += 1
        else:
            falhou += 1
            erros.append(
                f"FALHOU [{descricao}]: confirmar_orgao_ms('{orgao}', '{titulo[:40]}') "
                f"retornou {resultado}, esperado {esperado}"
            )

    if erros:
        logger.error("[Testes] %d/%d falharam:\n%s", falhou, len(casos), "\n".join(erros))
    else:
        logger.info("[Testes] Todos os %d casos passaram.", passou)

    return {"passou": passou, "falhou": falhou, "total": len(casos), "erros": erros}
