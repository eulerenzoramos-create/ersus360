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
Você é um assessor técnico em saúde pública que elabora Informes Técnicos \
formais para a Secretaria Municipal de Saúde de Apuí/AM (IBGE 1300144). \
Seus documentos seguem o padrão da administração pública brasileira: \
linguagem formal, precisa, sem palavras desnecessárias. \
Você analisa portarias do Ministério da Saúde e extrai: valores financeiros, \
habilitações, prazos, obrigações, recomendações práticas — sempre com foco \
em impacto direto para o Município de Apuí/AM.\
"""

_TEMPLATE_INSTRUCOES = """\
Com base nos dados da portaria abaixo, redija um Informe Técnico completo \
seguindo EXATAMENTE esta estrutura:

---
À Senhora [Nome da Secretária]
[Cargo]

Assunto: [Portaria + ementa resumida em uma linha]

Senhora Secretária,

[Parágrafo 1 — O que a portaria faz: objeto, programa, finalidade]

[Parágrafo 2 — Impacto direto em Apuí: se o município consta, valor recebido,
percentuais, IBGE 1300144. Se não constar nominalmente, informe que a portaria
é de abrangência federal/estadual e que deve ser verificada a elegibilidade.]

[Parágrafo 3 — Detalhes financeiros: valor, forma de repasse, FNS, FMS.
Se não houver valor, omita este parágrafo.]

[Parágrafo 4 — Recomendações operacionais: o que a secretaria deve fazer
(acompanhar OB, registrar no SIOPS, atualizar cadastro, prestar contas etc.)]

[Parágrafo 5 — Documentação e controle: quais documentos manter organizados
para prestação de contas e fiscalização.]

[Parágrafo de conclusão — Síntese em 2-3 linhas.]

Atenciosamente,

[Cidade/UF], [data por extenso].

EULER RAMOS DE OLIVEIRA
Assessor Técnico em Saúde Pública

Fonte: Diário Oficial da União[, Edição nº X, Seção Y, página Z], publicado em [data].
---

REGRAS OBRIGATÓRIAS:
- Use APENAS informações presentes no texto da portaria. NUNCA invente valores,
  percentuais, CNES, INE ou nomes de municípios que não estejam no texto.
- Se o texto estiver truncado (termina em "..."), indique que o texto integral
  deve ser verificado no link oficial.
- Valores financeiros: sempre por extenso após o numeral (ex: R$ 25.938,23
  (vinte e cinco mil, novecentos e trinta e oito reais e vinte e três centavos)).
- Código IBGE correto de Apuí: 1300144.
- Secretária: Rosângela Motter.
- Não use markdown, negrito, itálico nem bullets — somente texto corrido.
- Extensão: entre 400 e 700 palavras.
- Retorne APENAS o texto do informe, sem comentários adicionais.

DADOS DA PORTARIA:
Número: {numero}
Título: {titulo}
Data de publicação: {data_pub}
Órgão: {orgao}
Edição DOU: {edicao}
Seção DOU: {secao}
Página DOU: {pagina}
Relevância: {relevancia}
Prioridade: {prioridade}
Valores identificados: {valores}
Resumo/Conteúdo disponível:
{resumo}

Link oficial: {link}
"""


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

    # Monta o prompt com os dados da portaria
    prompt = _TEMPLATE_INSTRUCOES.format(
        numero=portaria.get("_numero") or portaria.get("numero") or "Não identificado",
        titulo=portaria.get("_titulo") or portaria.get("titulo") or "Sem título",
        data_pub=portaria.get("_data") or portaria.get("data_pub") or portaria.get("data_publicacao") or "Não informada",
        orgao=portaria.get("_orgao") or portaria.get("orgao") or "Ministério da Saúde",
        edicao=portaria.get("edicao_dou") or portaria.get("edicao") or "—",
        secao=portaria.get("secao_dou") or portaria.get("secao") or "DO1",
        pagina=portaria.get("pagina_dou") or portaria.get("pagina") or "—",
        relevancia=portaria.get("_relevancia") or portaria.get("relevancia") or "federal",
        prioridade=portaria.get("_prioridade") or portaria.get("prioridade") or "normativo",
        valores=", ".join(portaria.get("_valores") or portaria.get("valores_identificados") or []) or "Nenhum valor monetário identificado automaticamente",
        resumo=portaria.get("_resumo") or portaria.get("resumo") or portaria.get("corpo_completo") or "(conteúdo não disponível — verificar link oficial)",
        link=portaria.get("_link") or portaria.get("url_oficial") or "https://www.in.gov.br/leiturajornal",
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

    # Converte parágrafos em HTML (preserva quebras de parágrafo)
    paragrafos = [p.strip() for p in texto.split("\n") if p.strip()]
    corpo_html = "".join(
        f'<p style="margin:0 0 14px;line-height:1.8;text-align:justify">{p}</p>'
        for p in paragrafos
    )

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
