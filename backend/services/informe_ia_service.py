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
Com base nos dados da portaria abaixo, redija um Informe Técnico formal \
em texto corrido (prosa contínua), SEM títulos de seção, SEM bullets, \
SEM marcadores. O informe é dirigido à Secretária Municipal de Saúde \
de Apuí/AM e deve conter apenas informações extraídas diretamente do texto \
principal — nenhuma informação inventada ou deduzida.

O informe será impresso em UMA única página A4. O cabeçalho (título, número, destinatário, \
elaborador, data e assinatura) já é inserido pelo documento: NÃO escreva título, número do \
informe, "Para:", "Assunto:" nem endereçamento. Comece diretamente no Parágrafo 1.

Estrutura obrigatória em prosa — cada item vira um parágrafo curto (no máximo 3 frases):

Parágrafo 1 — Identificação: mencione o número da portaria, o órgão emissor, \
a data de publicação e o assunto principal extraído do texto.

Parágrafo 2 — Objeto e objetivo: explique o que a portaria estabelece, \
qual programa ou política está sendo tratado e qual é sua finalidade.

Parágrafo 3 — Principais determinações: descreva em texto corrido as \
principais disposições do ato, extraídas exclusivamente do texto principal. \
Se o texto estiver truncado, informe que o texto completo deve ser \
verificado no link oficial.

Parágrafo 4 — Prazos e vigência: mencione os prazos expressamente previstos \
no texto principal. Se não houver, escreva que a portaria não estabelece \
prazo específico em seu texto principal.

Parágrafo 5 — Orientação ao gestor: uma recomendação objetiva e diretamente \
fundamentada no conteúdo oficial do ato normativo.

Ao final, uma linha com:
Fonte: Diário Oficial da União, publicado em {data_pub}. Disponível em: {link}

REGRAS ABSOLUTAS:
- Texto corrido, sem títulos de seção, sem bullets, sem numeração.
- Usar apenas informações do texto principal fornecido. NUNCA inventar.
- Não analisar impacto territorial, estadual ou municipal.
- Não mencionar municípios específicos.
- Não consultar ou mencionar anexos.
- Entre 200 e 300 palavras no total (cabe em uma página A4).
- Retornar APENAS o texto do informe, sem comentários adicionais.

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
    Converte o texto gerado pela IA em HTML imprimível, padronizado em UMA folha A4:
    o conteúdo tem largura fixa de 178 mm (A4 menos margens) tanto na tela quanto na impressão e,
    se passar da altura útil, a escala é reduzida automaticamente até caber em uma página.
    """
    if data_hoje is None:
        data_hoje = date.today()

    e = html_lib.escape
    data_br = data_hoje.strftime("%d/%m/%Y")
    titulo = portaria.get("_titulo") or portaria.get("titulo") or ""
    numero = portaria.get("_numero") or portaria.get("numero") or ""
    link = portaria.get("_link") or portaria.get("url_oficial") or "https://www.in.gov.br/leiturajornal"
    ident = (numero or titulo).strip()                      # nunca deixa o título do informe em branco
    titulo_doc = f"Informe Técnico — {ident}" if ident else "Informe Técnico"

    blocos_html = []
    for p in _limpar_texto_ia(texto):
        if p.lower().startswith("fonte:"):
            blocos_html.append(f'<p class="fonte-texto">{e(p)}</p>')
        else:
            blocos_html.append(f"<p>{e(p)}</p>")
    corpo_html = "\n".join(blocos_html)

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{e(titulo_doc)} — {data_br}</title>
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
    .cabecalho {{ background: #1d4ed8; padding: 8px 16px; border-radius: 6px 6px 0 0; }}
    .cabecalho-label {{ font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,.8); }}
    .cabecalho-titulo {{ font-size: 12pt; font-weight: 800; color: #fff; margin-top: 2px; }}
    .ident {{ width: 100%; border-collapse: collapse; margin: 10px 0 8px; font-size: 9.5pt; color: #334155; }}
    .ident td {{ width: 50%; vertical-align: top; padding: 0 10px 0 0; }}
    .ident td + td {{ padding: 0 0 0 12px; border-left: 1px solid #e2e8f0; }}
    .rotulo {{ font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #94a3b8; margin-bottom: 2px; }}
    .nome {{ font-weight: 700; color: #1e293b; font-size: 10pt; }}
    .linha {{ border-top: 2px solid #1d4ed8; margin-bottom: 10px; }}
    .texto-informe p {{ margin: 0 0 7px; line-height: 1.45; text-align: justify; }}
    .texto-informe p.fonte-texto {{ font-size: 8.5pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;
                                   text-align: left; word-break: break-all; }}
    .fonte {{ background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 5px; padding: 6px 12px; margin-top: 8px;
             font-size: 8.5pt; color: #0369a1; word-break: break-all; }}
    .fonte a {{ color: #0369a1; }}
    .assinatura {{ margin-top: 16px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 9.5pt; color: #374151; }}
    .assinatura .linha-assina {{ display: inline-block; text-align: center; min-width: 240px; border-top: 1px solid #334155;
                                padding-top: 4px; margin-top: 18px; }}
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
    <div class="cabecalho-titulo">{e(titulo_doc)}</div>
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
  <div class="linha"></div>

  <div class="texto-informe">
    {corpo_html}
  </div>

  <div class="fonte">
    🔗 <strong>Fonte oficial:</strong>&nbsp;<a href="{e(link, quote=True)}" target="_blank" rel="noopener noreferrer">{e(link)}</a>
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
