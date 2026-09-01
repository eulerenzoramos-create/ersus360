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
Com base nos dados da portaria abaixo, redija um Informe Técnico formal \
em texto corrido (prosa contínua), SEM títulos de seção, SEM bullets, \
SEM marcadores. O informe é dirigido à Secretária Municipal de Saúde \
de Apuí/AM e deve conter apenas informações extraídas diretamente do texto \
principal — nenhuma informação inventada ou deduzida.

Estrutura obrigatória em prosa — cada item vira um parágrafo:

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
- Entre 250 e 450 palavras no total.
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
    Converte o texto gerado pela IA em HTML imprimível no mesmo
    estilo do documento atual do ERSUS360.
    """
    if data_hoje is None:
        data_hoje = date.today()

    data_br = data_hoje.strftime("%d/%m/%Y")
    titulo = portaria.get("_titulo") or portaria.get("titulo") or "Portaria MS"
    numero = portaria.get("_numero") or portaria.get("numero") or ""
    link   = portaria.get("_link") or portaria.get("url_oficial") or "https://www.in.gov.br/leiturajornal"

    # Renderiza parágrafos em prosa simples
    paragrafos = [p.strip() for p in texto.split("\n") if p.strip()]
    blocos_html = []
    for p in paragrafos:
        if p.lower().startswith("fonte:"):
            blocos_html.append(
                f'<p style="margin:20px 0 0;font-size:11px;color:#64748b;'
                f'border-top:1px solid #e2e8f0;padding-top:12px">{p}</p>'
            )
        else:
            blocos_html.append(
                f'<p style="margin:0 0 14px;line-height:1.85;text-align:justify">{p}</p>'
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

    <!-- Identificação formal do documento -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:22px;font-size:12px;color:#334155">
      <tr>
        <td style="width:50%;vertical-align:top;padding:0 12px 0 0;border-right:1px solid #e2e8f0">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:4px">Para</div>
          <div style="font-weight:700;color:#1e293b;font-size:13px">{destinatario_nome}</div>
          <div style="color:#475569">{destinatario_cargo}</div>
          <div style="color:#475569">Secretaria Municipal de Saúde — {destinatario_local}</div>
        </td>
        <td style="width:50%;vertical-align:top;padding:0 0 0 12px">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:4px">Elaborado por</div>
          <div style="font-weight:700;color:#1e293b;font-size:13px">{elaborador_nome}</div>
          <div style="color:#475569">{elaborador_cargo}</div>
          <div style="color:#475569">Data: {data_br}</div>
        </td>
      </tr>
    </table>
    <div style="border-top:2px solid #1d4ed8;margin-bottom:22px"></div>

    <div class="texto-informe">
      {corpo_html}
    </div>

    <div class="fonte">
      🔗 <strong>Fonte oficial:</strong>&nbsp;
      <a href="{link}" target="_blank" rel="noopener noreferrer">{link}</a>
    </div>

    <!-- Assinatura -->
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#374151">
      <div style="margin-bottom:32px">Apuí/AM, {data_br}</div>
      <div style="display:inline-block;text-align:center;min-width:260px">
        <div style="border-top:1px solid #334155;padding-top:6px;margin-top:0">
          <div style="font-weight:700;font-size:12px;text-transform:uppercase;color:#1e293b;letter-spacing:.5px">{elaborador_nome}</div>
          <div style="color:#475569;font-size:11px">{elaborador_cargo}</div>
          <div style="color:#475569;font-size:11px">Secretaria Municipal de Saúde — {destinatario_local}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="rodape">
    <span>Apuí/AM — IBGE 1300144 · Secretaria Municipal de Saúde</span>
    <span>Gerado pelo ERSUS 360 em {data_br}</span>
  </div>
</div>

</body>
</html>"""
