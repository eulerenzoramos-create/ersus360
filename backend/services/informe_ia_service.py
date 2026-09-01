"""
Serviço de geração de Informe Técnico via IA (Claude API).

Gera um documento formal em prosa jurídica a partir do conteúdo
de uma portaria do DOU, no modelo usado pela Secretaria Municipal
de Saúde de Apuí/AM.

A chave ANTHROPIC_API_KEY deve estar definida como variável de ambiente
no Railway — nunca hardcoded.
"""
from __future__ import annotations

import os
import logging
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
Com base nos dados da portaria abaixo, elabore um Informe Técnico seguindo \
EXATAMENTE esta estrutura e este modelo. Não altere a estrutura, não adicione \
seções e não omita seções.

---
INFORME TÉCNICO – ERSUS360
PORTARIA {orgao} Nº {numero}, DE {data_pub}
Assunto: {assunto_placeholder}
Publicação: {data_pub}
Órgão responsável: {orgao}
Área: {area_placeholder}
Vigência: {vigencia_placeholder}

RESUMO DA PORTARIA
[Escrever no máximo dois parágrafos curtos explicando: (1) o que a portaria \
estabelece e qual é seu objetivo; (2) qual programa, política, recurso ou serviço \
está sendo tratado e quem é alcançado pela medida, quando essa informação constar \
no texto principal. Não analisar impacto territorial. Não mencionar municípios \
específicos. Usar somente o texto fornecido.]

PRINCIPAIS DISPOSIÇÕES
[Listar de três a cinco tópicos objetivos com as principais determinações \
da portaria, extraídos exclusivamente do texto principal. \
Formato: — [disposição]. Não inventar disposições.]

PRAZOS
[Informar somente os prazos expressamente previstos no texto principal. \
Se não houver prazo, escrever exatamente: \
"A portaria não estabelece prazo específico em seu texto principal."]

ORIENTAÇÃO AO GESTOR
[Escrever uma orientação breve e diretamente relacionada ao conteúdo da portaria. \
Não criar obrigação, procedimento ou providência que não esteja fundamentada \
no texto oficial. Máximo três linhas.]

FONTE OFICIAL
{link}

Elaborado automaticamente pelo Agente de Portarias do Ministério da Saúde – ERSUS360.
---

REGRAS OBRIGATÓRIAS DE REDAÇÃO:
- Preencher os campos {assunto_placeholder}, {area_placeholder} e \
  {vigencia_placeholder} com base no texto da portaria.
- Para {assunto_placeholder}: extrair o assunto principal em uma linha.
- Para {area_placeholder}: classificar em uma das categorias: \
  Atenção Primária à Saúde | Atenção Especializada | Vigilância em Saúde | \
  Assistência Farmacêutica | Saúde Indígena | Saúde Digital | \
  Gestão do Trabalho | Piso da Enfermagem | Infraestrutura e obras | \
  Financiamento do SUS | Habilitação ou credenciamento | \
  Programas e políticas de saúde | Alteração normativa | \
  Outros assuntos do Ministério da Saúde.
- Para {vigencia_placeholder}: informar a data de vigência do texto ou \
  "Informação não identificada no texto principal da portaria."
- Usar somente informações presentes no texto da portaria.
- Não copiar integralmente a portaria.
- Não usar markdown, negrito, itálico nem bullets com * — usar somente — (travessão).
- Não emitir opinião pessoal.
- Não analisar anexos ou tabelas.
- Não apresentar valores que estejam somente em anexos.
- Texto de no máximo uma página (300 a 500 palavras no total).
- Retornar APENAS o informe, sem comentários adicionais.

DADOS DA PORTARIA:
Número: {numero}
Título: {titulo}
Data de publicação: {data_pub}
Órgão: {orgao}
Edição DOU: {edicao}
Seção DOU: {secao}
Página DOU: {pagina}
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
        pagina=portaria.get("pagina_dou") or portaria.get("pagina") or "—",
        resumo=conteudo_para_ia,
        link=link or "https://www.in.gov.br/leiturajornal",
        # Placeholders preenchidos pela IA com base no conteúdo
        assunto_placeholder="[preencher com o assunto principal da portaria]",
        area_placeholder="[classificar por área temática]",
        vigencia_placeholder="[informar vigência ou 'Informação não identificada no texto principal da portaria.']",
    )

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=api_key)
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
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


def formatar_informe_html(texto: str, portaria: dict, data_hoje: date | None = None) -> str:
    """
    Converte o texto gerado pela IA em HTML imprimível no mesmo
    estilo do documento atual do ERSUS360.
    """
    if data_hoje is None:
        data_hoje = date.today()

    data_br = data_hoje.strftime("%d/%m/%Y")
    titulo = portaria.get("_titulo") or portaria.get("titulo") or "Portaria MS"
    numero = portaria.get("_numero") or portaria.get("numero") or ""
    link   = portaria.get("_link") or portaria.get("url_oficial") or "https://www.in.gov.br/leiturajornal"

    # Converte o texto estruturado em HTML com seções destacadas
    SECOES = {
        "RESUMO DA PORTARIA",
        "PRINCIPAIS DISPOSIÇÕES",
        "PRAZOS",
        "ORIENTAÇÃO AO GESTOR",
        "FONTE OFICIAL",
    }
    linhas = texto.split("\n")
    blocos_html = []
    for linha in linhas:
        l = linha.strip()
        if not l:
            continue
        if l in SECOES:
            blocos_html.append(
                f'<p style="margin:18px 0 6px;font-weight:700;font-size:12px;'
                f'text-transform:uppercase;letter-spacing:.5px;color:#1d4ed8;'
                f'border-bottom:1px solid #e2e8f0;padding-bottom:4px">{l}</p>'
            )
        elif l.startswith("INFORME TÉCNICO") or l.startswith("PORTARIA "):
            blocos_html.append(
                f'<p style="margin:0 0 4px;font-weight:700;font-size:13px;color:#1e293b">{l}</p>'
            )
        elif l.startswith("Assunto:") or l.startswith("Publicação:") or \
             l.startswith("Órgão") or l.startswith("Área:") or l.startswith("Vigência:"):
            blocos_html.append(
                f'<p style="margin:0 0 3px;font-size:12px;color:#374151">{l}</p>'
            )
        elif l.startswith("—") or l.startswith("-"):
            blocos_html.append(
                f'<p style="margin:0 0 6px;padding-left:12px;line-height:1.7;'
                f'text-align:justify;border-left:2px solid #e2e8f0">{l}</p>'
            )
        else:
            blocos_html.append(
                f'<p style="margin:0 0 12px;line-height:1.8;text-align:justify">{l}</p>'
            )
    corpo_html = "\n".join(blocos_html)

    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Informe Técnico — {numero} — {data_br}</title>
  <style>
    body {{
      font-family: Arial, sans-serif;
      margin: 0; padding: 0;
      background: #f8fafc;
      color: #1e293b;
      font-size: 13px;
    }}
    .no-print {{display:block}}
    @media print {{
      .no-print {{display:none!important}}
      body {{background:#fff;margin:0}}
      .pagina {{box-shadow:none;margin:0;border-radius:0}}
    }}
    .toolbar {{
      position:sticky;top:0;z-index:100;
      background:#1d4ed8;
      padding:10px 24px;
      display:flex;gap:12px;align-items:center;
    }}
    .btn-print {{
      padding:8px 22px;background:#fff;color:#1d4ed8;
      border:none;border-radius:6px;cursor:pointer;
      font-size:13px;font-weight:700;
    }}
    .pagina {{
      max-width:820px;margin:32px auto;
      background:#fff;
      box-shadow:0 4px 24px rgba(0,0,0,.10);
      border-radius:10px;
      overflow:hidden;
    }}
    .cabecalho {{
      background:#1d4ed8;
      padding:10px 32px;
      display:flex;align-items:center;gap:12px;
    }}
    .cabecalho-label {{
      font-size:10px;font-weight:700;
      text-transform:uppercase;letter-spacing:1px;
      color:rgba(255,255,255,.75);
    }}
    .cabecalho-titulo {{
      font-size:15px;font-weight:800;color:#fff;margin-top:2px;
    }}
    .corpo {{padding:32px 40px;}}
    .destinatario {{margin-bottom:24px;}}
    .destinatario p {{margin:0;line-height:1.6;}}
    .assunto {{
      font-weight:700;
      border-left:4px solid #1d4ed8;
      padding-left:12px;
      margin-bottom:24px;
      color:#1e293b;
    }}
    .texto-informe p {{
      margin:0 0 14px;
      line-height:1.85;
      text-align:justify;
      color:#1e293b;
    }}
    .assinatura {{
      margin-top:32px;
      padding-top:20px;
      border-top:1px solid #e2e8f0;
      font-size:12px;
      color:#374151;
    }}
    .assinatura .nome {{
      font-size:13px;font-weight:700;
      color:#1e293b;
      text-transform:uppercase;
      margin-top:16px;
    }}
    .fonte {{
      background:#f0f9ff;
      border:1px solid #bae6fd;
      border-radius:6px;
      padding:10px 16px;
      margin-top:24px;
      font-size:11px;color:#0369a1;
    }}
    .fonte a {{color:#0369a1;}}
    .rodape {{
      background:#f8fafc;
      border-top:1px solid #e2e8f0;
      padding:10px 40px;
      font-size:10px;
      color:#94a3b8;
      display:flex;justify-content:space-between;
    }}
  </style>
</head>
<body>

<div class="no-print toolbar">
  <button class="btn-print" onclick="window.print()">🖨 Imprimir / Salvar PDF</button>
  <span style="color:rgba(255,255,255,.8);font-size:12px">
    ERSUS 360 · Informe Técnico · {data_br}
  </span>
</div>

<div class="pagina">
  <div class="cabecalho">
    <div>
      <div class="cabecalho-label">ERSUS 360 — Sistema de Monitoramento em Saúde Pública</div>
      <div class="cabecalho-titulo">Informe Técnico — {numero}</div>
    </div>
  </div>

  <div class="corpo">
    <div class="texto-informe">
      {corpo_html}
    </div>

    <div class="fonte">
      🔗 <strong>Fonte oficial:</strong>&nbsp;
      <a href="{link}" target="_blank" rel="noopener noreferrer">{link}</a>
    </div>
  </div>

  <div class="rodape">
    <span>Apuí/AM — IBGE 1300144 · Secretaria Municipal de Saúde</span>
    <span>Gerado pelo ERSUS 360 em {data_br}</span>
  </div>
</div>

</body>
</html>"""
