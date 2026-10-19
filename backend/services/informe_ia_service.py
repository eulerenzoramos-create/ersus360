"""
Serviço de geração de Informe Técnico via IA (Claude API).

Gera um documento formal em prosa jurídica a partir do conteúdo
de uma portaria do DOU, no modelo usado pela Secretaria Municipal
de Saúde de Apuí/AM.

A chave ANTHROPIC_API_KEY deve estar definida como variável de ambiente
no Railway — nunca hardcoded.
"""
from __future__ import annotations

import html as html_lib
import json
import os
import logging
import re
from datetime import date

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
Você é o Agente de Portarias do Ministério da Saúde do sistema ERSUS360. \
Sua função é elaborar Informes Técnicos formais, resumidos e objetivos \
sobre portarias do Ministério da Saúde publicadas no Diário Oficial da União. \
Seus documentos seguem o padrão da administração pública brasileira: \
linguagem formal, clara para gestores públicos de saúde, sem termos \
excessivamente jurídicos e sem palavras desnecessárias.

RESTRIÇÕES ABSOLUTAS — NUNCA VIOLAR:
- Não analisar impacto nacional, estadual ou municipal específico.
- Não identificar impacto para nenhum município em particular.
- Não consultar, interpretar ou mencionar anexos, tabelas ou arquivos complementares.
- Não realizar análise territorial de nenhuma espécie.
- Não pesquisar valores destinados a municípios ou estados específicos.
- Não criar providências que não estejam no texto principal da portaria.
- Não inventar valores, prazos, obrigações ou qualquer informação.
- Não apresentar conclusões sem fundamento no texto oficial.
- Usar SOMENTE o texto principal da portaria fornecido.
- Quando uma informação não estiver no texto principal, escrever exatamente:
  "Informação não identificada no texto principal da portaria."\
"""

_TEMPLATE_INSTRUCOES = """\
Com base nos dados da portaria abaixo, elabore um Informe Técnico formal, resumido e objetivo, \
dirigido à Secretária Municipal de Saúde de Apuí/AM. Use SOMENTE informações do texto principal \
fornecido; nada inventado ou deduzido.

O informe será impresso em UMA página A4. O documento já traz título, destinatário, elaborador, \
data, assinatura e link oficial: NÃO os escreva.

Responda APENAS com um objeto JSON válido (sem comentários e sem cercas de código), com exatamente \
estas chaves:
{{
  "assunto": "ementa em uma frase curta, até 25 palavras",
  "identificacao": "texto",
  "objeto": "texto",
  "determinacoes": ["item curto", "item curto"],
  "prazos": "texto",
  "orientacao": "texto"
}}

Como preencher cada chave:
- assunto: o tema da portaria em uma única frase.
- identificacao: número da portaria, órgão emissor, data de publicação no DOU e assunto principal \
(1 a 2 frases).
- objeto: o que o ato estabelece, o programa ou política tratado e a finalidade (2 a 3 frases).
- determinacoes: lista de 1 a 4 itens curtos (até 35 palavras cada) com as principais disposições \
do texto principal. Se o texto estiver truncado, o último item deve dizer que as demais disposições \
precisam ser verificadas no texto integral, no link oficial.
- prazos: prazos e vigência previstos no texto principal. Se não houver, escreva somente: \
"A portaria não estabelece prazo específico em seu texto principal." Não repita essa ideia em outra frase.
- orientacao: uma recomendação objetiva, fundamentada no conteúdo oficial do ato (1 a 2 frases).

Regras de redação:
- Português formal e claro, com pontuação correta; frases curtas; cada texto termina com ponto final.
- Sem markdown, sem listas dentro dos textos, sem repetir a mesma informação em seções diferentes.
- Quando uma informação não estiver no texto principal, escreva: \
"Informação não identificada no texto principal da portaria."
- NUNCA inventar valores, prazos ou obrigações. Não analisar impacto territorial, estadual ou \
municipal; não mencionar municípios; não consultar anexos.
- Total entre 180 e 280 palavras.

DADOS DA PORTARIA:
Número: {numero}
Título: {titulo}
Data de publicação: {data_pub}
Órgão: {orgao}
Edição DOU: {edicao}
Seção DOU: {secao}
Texto principal disponível:
{resumo}

Link oficial: {link}
"""


async def _buscar_texto_integral(url: str, timeout: int = 10) -> str:
    """
    Tenta obter o texto integral da portaria pelo link oficial do DOU.
    Retorna string vazia se falhar (não bloqueia a geração).
    """
    if not url or "in.gov.br" not in url:
        return ""
    try:
        import httpx
        from bs4 import BeautifulSoup
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True,
                                     headers={"User-Agent": "ERSUS360/1.0"}) as client:
            r = await client.get(url)
            if r.status_code != 200:
                return ""
            soup = BeautifulSoup(r.text, "html.parser")
            # Seletores específicos do DOU para o corpo do ato
            for sel in [
                ".texto-dou", ".dou-paragraph", "[class*='dou-body']",
                "article", ".corpo-texto", ".materia-dou",
            ]:
                el = soup.select_one(sel)
                if el:
                    return el.get_text(" ", strip=True)[:4000]
            # Fallback: body inteiro
            body = soup.body
            return body.get_text(" ", strip=True)[:4000] if body else ""
    except Exception as exc:
        logger.warning("[InformeIA] Falha ao buscar texto integral: %s", exc)
        return ""


async def gerar_informe_ia(
    portaria: dict,
    data_hoje: date | None = None,
) -> str:
    """
    Gera texto formal de Informe Técnico via Claude API.

    Args:
        portaria: dict com campos _titulo, _numero, _resumo, _link, etc.
        data_hoje: data de elaboração (padrão: hoje)

    Returns:
        Texto do informe em prosa formal. Em caso de erro, retorna mensagem
        descritiva para que o usuário saiba que a geração falhou.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY não configurada. Defina a variável de ambiente no Railway."
        )

    if data_hoje is None:
        data_hoje = date.today()

    # Tenta obter texto integral do DOU (melhora muito a análise da IA)
    link = portaria.get("_link") or portaria.get("url_oficial") or ""
    resumo_curto = portaria.get("_resumo") or portaria.get("resumo") or portaria.get("corpo_completo") or ""
    texto_integral = ""
    if link and "in.gov.br/web/dou" in link:
        texto_integral = await _buscar_texto_integral(link)
        if texto_integral:
            logger.info("[InformeIA] Texto integral obtido: %d chars", len(texto_integral))

    conteudo_para_ia = texto_integral or resumo_curto or "(conteúdo não disponível — verificar link oficial)"
    if texto_integral:
        conteudo_para_ia = f"[TEXTO INTEGRAL OBTIDO DO DOU — {len(texto_integral)} caracteres]\n\n{texto_integral}"
    elif resumo_curto:
        conteudo_para_ia = f"[RESUMO TRUNCADO — texto completo disponível no link]\n\n{resumo_curto}"

    # Monta o prompt com os dados da portaria
    prompt = _TEMPLATE_INSTRUCOES.format(
        numero=portaria.get("_numero") or portaria.get("numero") or "Não identificado",
        titulo=portaria.get("_titulo") or portaria.get("titulo") or "Sem título",
        data_pub=portaria.get("_data") or portaria.get("data_pub") or portaria.get("data_publicacao") or "Não informada",
        orgao=portaria.get("_orgao") or portaria.get("orgao") or "Ministério da Saúde",
        edicao=portaria.get("edicao_dou") or portaria.get("edicao") or "—",
        secao=portaria.get("secao_dou") or portaria.get("secao") or "DO1",
        resumo=conteudo_para_ia,
        link=link or "https://www.in.gov.br/leiturajornal",
    )

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=api_key)
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=900,
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )
        texto = message.content[0].text.strip()
        logger.info(
            "[InformeIA] Informe gerado — %s tokens entrada, %s saída",
            message.usage.input_tokens,
            message.usage.output_tokens,
        )
        return texto

    except Exception as exc:
        logger.error("[InformeIA] Erro na geração: %s", exc, exc_info=True)
        raise RuntimeError(f"Falha ao gerar informe via IA: {exc}") from exc


_SECOES = (
    ("identificacao", "Identificação"),
    ("objeto", "Objeto e finalidade"),
    ("determinacoes", "Principais determinações"),
    ("prazos", "Prazos e vigência"),
    ("orientacao", "Orientação ao gestor"),
)


def _limpar_texto_ia(texto: str) -> list[str]:
    """Parágrafos do texto da IA, sem o que o documento já traz (título, número, endereçamento) e sem markdown."""
    linhas = [re.sub(r"[*_#`]+", "", l).strip() for l in texto.splitlines()]
    paragrafos = [l for l in linhas if l]
    # a IA às vezes repete o cabeçalho ("Informe Técnico nº — /2026", "Secretaria Municipal de Saúde de ...")
    while paragrafos and len(paragrafos[0]) < 100 and re.match(
        r"^(informe t[eé]cnico|secretaria municipal|para:|assunto:|de:)", paragrafos[0], re.I
    ):
        paragrafos.pop(0)
    return paragrafos


def _pontuar(txt: str) -> str:
    """Normaliza espaços e pontuação de uma frase/parágrafo: sem espaço antes de , . ; : ) e com ponto final."""
    t = re.sub(r"[*_#`]+", "", str(txt or ""))
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"\s+([,.;:!?)])", r"\1", t)
    t = re.sub(r"([,;:])(?=[^\s\d)\"'/])", r"\1 ", t)       # espaço depois de vírgula/ponto e vírgula/dois pontos
    t = re.sub(r"\.{2,}(?!\.)", ".", t)
    if t and t[-1] not in ".!?:":
        t += "."
    return t


def _extrair_json(texto: str) -> dict | None:
    """Objeto JSON da resposta da IA (aceita cerca de código); None se não for o formato esperado."""
    bruto = texto.strip()
    bruto = re.sub(r"^```(?:json)?\s*|\s*```$", "", bruto, flags=re.I)
    ini, fim = bruto.find("{"), bruto.rfind("}")
    if ini < 0 or fim <= ini:
        return None
    try:
        dados = json.loads(bruto[ini:fim + 1])
    except ValueError:
        return None
    return dados if isinstance(dados, dict) and any(k in dados for k, _ in _SECOES) else None


_ACRONIMO = re.compile(r"\b([a-z]{2,5}/[a-z]{2,5})\b")


def _titulo_legivel(txt: str) -> str:
    """'PORTARIA SE/MS Nº 998, DE 15 DE OUTUBRO DE 2026' → 'Portaria SE/MS nº 998, de 15 de outubro de 2026'."""
    t = (txt or "").strip()
    if t and t == t.upper():
        t = t.lower()
        t = _ACRONIMO.sub(lambda m: m.group(1).upper(), t)
        t = t[:1].upper() + t[1:]
    return t


def formatar_informe_html(
    texto: str,
    portaria: dict,
    data_hoje: date | None = None,
    destinatario_nome: str = "Rosangela Montter",
    destinatario_cargo: str = "Secretária Municipal de Saúde",
    destinatario_local: str = "Apuí/AM",
    elaborador_nome: str = "Euler Ramos de Oliveira",
    elaborador_cargo: str = "Assessor Técnico em Saúde Pública",
) -> str:
    """
    Converte a resposta da IA em HTML imprimível, padronizado em UMA folha A4, com seções numeradas
    (identificação, objeto, determinações, prazos, orientação). O conteúdo tem largura fixa de 178 mm
    na tela e na impressão e, se passar da altura útil, a escala é reduzida automaticamente.
    Se a IA não devolver o JSON esperado, o texto corrido é mostrado em uma única seção.
    """
    if data_hoje is None:
        data_hoje = date.today()

    e = html_lib.escape
    data_br = data_hoje.strftime("%d/%m/%Y")
    titulo = portaria.get("_titulo") or portaria.get("titulo") or ""
    numero = portaria.get("_numero") or portaria.get("numero") or ""
    link = portaria.get("_link") or portaria.get("url_oficial") or "https://www.in.gov.br/leiturajornal"
    referencia = _titulo_legivel(titulo or numero)

    dados = _extrair_json(texto)
    ementa = ""
    if dados:
        ementa = _pontuar(dados.get("assunto", ""))
        secoes_html = []
        n = 0
        for chave, rotulo in _SECOES:
            valor = dados.get(chave)
            if isinstance(valor, list):
                itens = [_pontuar(i) for i in valor if str(i).strip()]
                if not itens:
                    continue
                corpo = "<ol>" + "".join(f"<li>{e(i)}</li>" for i in itens) + "</ol>"
            else:
                par = _pontuar(valor)
                if not par:
                    continue
                corpo = f"<p>{e(par)}</p>"
            n += 1
            secoes_html.append(f'<section class="sec"><h2><span>{n}</span>{e(rotulo)}</h2>{corpo}</section>')
        corpo_html = "\n".join(secoes_html)
    else:
        paragrafos = [p for p in _limpar_texto_ia(texto) if not p.lower().startswith("fonte:")]
        corpo_html = '<section class="sec">' + "".join(f"<p>{e(_pontuar(p))}</p>" for p in paragrafos) + "</section>"

    bloco_ref = ""
    if referencia or ementa:
        bloco_ref = (
            '<div class="assunto">'
            + (f'<div class="rotulo">Referência</div><div class="ref">{e(referencia)}</div>' if referencia else "")
            + (f'<div class="ementa"><strong>Assunto:</strong> {e(ementa)}</div>' if ementa else "")
            + "</div>"
        )

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Informe Técnico{(" — " + e(referencia)) if referencia else ""} — {data_br}</title>
  <style>
    @page {{ size: A4 portrait; margin: 14mm 16mm; }}
    * {{ box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
    body {{ font-family: Arial, sans-serif; margin: 0; background: #f1f5f9; color: #1e293b; font-size: 10.5pt; }}
    .toolbar {{ position: sticky; top: 0; z-index: 100; background: #1d4ed8; padding: 10px 24px;
               display: flex; gap: 12px; align-items: center; }}
    .btn-print {{ padding: 8px 22px; background: #fff; color: #1d4ed8; border: none; border-radius: 6px;
                 cursor: pointer; font-size: 13px; font-weight: 700; }}
    .toolbar span {{ color: rgba(255,255,255,.85); font-size: 12px; }}
    /* folha A4 na tela; o conteúdo (.pagina) tem a mesma largura e tipografia da impressão */
    .folha {{ width: 210mm; min-height: 297mm; margin: 24px auto; padding: 14mm 16mm; background: #fff;
             box-shadow: 0 4px 24px rgba(0,0,0,.12); }}
    .pagina {{ width: 178mm; }}
    .cabecalho {{ background: #1d4ed8; padding: 9px 16px; border-radius: 6px; }}
    .cabecalho-label {{ font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,.8); }}
    .cabecalho-titulo {{ font-size: 15pt; font-weight: 800; color: #fff; margin-top: 2px; letter-spacing: .3px; }}
    .ident {{ width: 100%; border-collapse: collapse; margin: 10px 0 8px; font-size: 9.5pt; color: #334155; }}
    .ident td {{ width: 50%; vertical-align: top; padding: 0 10px 0 0; }}
    .ident td + td {{ padding: 0 0 0 12px; border-left: 1px solid #e2e8f0; }}
    .rotulo {{ font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #94a3b8; margin-bottom: 2px; }}
    .nome {{ font-weight: 700; color: #1e293b; font-size: 10pt; }}
    .assunto {{ border-left: 4px solid #1d4ed8; background: #f8fafc; padding: 7px 12px; margin: 0 0 12px; }}
    .assunto .ref {{ font-size: 11pt; font-weight: 700; color: #0f172a; }}
    .assunto .ementa {{ margin-top: 3px; font-size: 10pt; color: #334155; line-height: 1.4; }}
    .sec {{ margin: 0 0 10px; break-inside: avoid; }}
    .sec h2 {{ display: flex; align-items: center; gap: 6px; margin: 0 0 4px; padding-bottom: 2px; border-bottom: 1px solid #dbeafe;
              font-size: 8.5pt; text-transform: uppercase; letter-spacing: .6px; color: #1d4ed8; }}
    .sec h2 span {{ display: inline-block; width: 15px; height: 15px; border-radius: 50%; background: #1d4ed8; color: #fff;
                   font-size: 8pt; line-height: 15px; text-align: center; letter-spacing: 0; }}
    .sec p, .sec li {{ margin: 0 0 4px; line-height: 1.5; text-align: justify; }}
    .sec ol {{ margin: 0; padding-left: 20px; }}
    .fonte {{ background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 5px; padding: 6px 12px; margin-top: 10px;
             font-size: 8.5pt; color: #0369a1; word-break: break-all; }}
    .fonte a {{ color: #0369a1; }}
    .assinatura {{ margin-top: 14px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9.5pt; color: #374151; }}
    .assinatura .linha-assina {{ display: block; text-align: center; width: 240px; border-top: 1px solid #334155;
                                padding-top: 4px; margin-top: 22px; }}
    .rodape {{ margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 5px; font-size: 7.5pt; color: #94a3b8;
              display: flex; justify-content: space-between; }}
    @media print {{
      body {{ background: #fff; }}
      .no-print {{ display: none !important; }}
      .folha {{ width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; }}
    }}
  </style>
</head>
<body>

<div class="no-print toolbar">
  <button class="btn-print" onclick="window.print()">🖨 Imprimir / Salvar PDF</button>
  <span>ERSUS 360 · Informe Técnico · {data_br}</span>
  <span id="aviso-escala"></span>
</div>

<div class="folha">
<div class="pagina" id="pagina">
  <div class="cabecalho">
    <div class="cabecalho-label">ERSUS 360 — Sistema de Monitoramento em Saúde Pública</div>
    <div class="cabecalho-titulo">Informe Técnico</div>
  </div>

  <table class="ident">
    <tr>
      <td>
        <div class="rotulo">Para</div>
        <div class="nome">{e(destinatario_nome)}</div>
        <div>{e(destinatario_cargo)} — {e(destinatario_local)}</div>
      </td>
      <td>
        <div class="rotulo">Elaborado por</div>
        <div class="nome">{e(elaborador_nome)}</div>
        <div>{e(elaborador_cargo)}</div>
        <div>Data: {data_br}</div>
      </td>
    </tr>
  </table>

  {bloco_ref}

  <div class="texto-informe">
    {corpo_html}
  </div>

  <div class="fonte">
    🔗 <strong>Fonte oficial (Diário Oficial da União):</strong>&nbsp;<a href="{e(link, quote=True)}" target="_blank" rel="noopener noreferrer">{e(link)}</a>
  </div>

  <div class="assinatura">
    <div>{e(destinatario_local)}, {data_br}</div>
    <div class="linha-assina">
      <div style="font-weight:700;text-transform:uppercase;color:#1e293b;letter-spacing:.5px">{e(elaborador_nome)}</div>
      <div style="color:#475569;font-size:9pt">{e(elaborador_cargo)}</div>
    </div>
  </div>

  <div class="rodape">
    <span>{e(destinatario_local)} — Secretaria Municipal de Saúde</span>
    <span>Gerado pelo ERSUS 360 em {data_br}</span>
  </div>
</div>
</div>

<script>
  // Padroniza em UMA folha A4: altura útil = 297 mm − 2 × 14 mm de margem. Se o conteúdo passar, reduz a escala.
  (function () {{
    var MM = 96 / 25.4, maxH = 268 * MM;
    var p = document.getElementById('pagina');
    function aplicar(z) {{ p.style.zoom = z; p.style.width = (178 / z) + 'mm'; }}
    function ajustar() {{
      var z = 1; aplicar(z);
      while (p.getBoundingClientRect().height > maxH && z > 0.55) {{ z = Math.round((z - 0.02) * 100) / 100; aplicar(z); }}
      var aviso = document.getElementById('aviso-escala');
      if (aviso) aviso.textContent = z < 1 ? 'Ajustado para 1 página (escala ' + Math.round(z * 100) + '%)' : '1 página';
    }}
    window.addEventListener('load', ajustar);
    window.addEventListener('beforeprint', ajustar);
  }})();
</script>

</body>
</html>"""
