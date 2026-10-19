"""Informe Técnico (IA): uma folha A4, seções numeradas, pontuação normalizada e sem cabeçalho duplicado."""
import json
from datetime import date

from services.informe_ia_service import (
    _extrair_json, _limpar_texto_ia, _pontuar, _titulo_legivel, formatar_informe_html,
)

PORTARIA = {"_titulo": "PORTARIA SE/MS Nº 998, DE 15 DE OUTUBRO DE 2026", "_numero": "",
            "_link": "https://www.in.gov.br/leiturajornal"}
DADOS = {
    "assunto": "Resultado de análise de pedido de readequação de projeto do PRONON",
    "identificacao": "A Portaria SE/MS nº 998 foi publicada no DOU em 19/10/2026 ,pelo Secretário Executivo",
    "objeto": "Dá publicidade ao resultado de análise de pedido de readequação de projeto vinculado ao <b>PRONON</b>.",
    "determinacoes": ["Divulga o resultado da análise", "As demais disposições devem ser verificadas no texto integral."],
    "prazos": "A portaria não estabelece prazo específico em seu texto principal.",
    "orientacao": "Consultar o texto integral no link oficial",
}


def test_estrutura_em_secoes_numeradas():
    html = formatar_informe_html(json.dumps(DADOS, ensure_ascii=False), PORTARIA, date(2026, 10, 19))
    for n, rotulo in enumerate(["Identificação", "Objeto e finalidade", "Principais determinações",
                                "Prazos e vigência", "Orientação ao gestor"], 1):
        assert f"<span>{n}</span>{rotulo}" in html
    assert "<ol><li>Divulga o resultado da análise.</li>" in html                   # item ganhou ponto final
    assert "Portaria SE/MS nº 998, de 15 de outubro de 2026" in html                # referência legível, não em caixa alta
    assert "<strong>Assunto:</strong> Resultado de análise de pedido de readequação de projeto do PRONON." in html
    assert '<div class="cabecalho-titulo">Informe Técnico</div>' in html


def test_pontuacao_normalizada_e_texto_escapado():
    html = formatar_informe_html(json.dumps(DADOS, ensure_ascii=False), PORTARIA, date(2026, 10, 19))
    assert "19/10/2026, pelo Secretário Executivo." in html                         # sem espaço antes da vírgula, com ponto final
    assert "&lt;b&gt;PRONON&lt;/b&gt;" in html and "<b>PRONON</b>" not in html
    assert "Consultar o texto integral no link oficial.</p>" in html


def test_aceita_json_em_cerca_de_codigo_e_nao_duplica_a_fonte():
    cercado = "```json\n" + json.dumps(DADOS, ensure_ascii=False) + "\n```"
    assert _extrair_json(cercado)["assunto"].startswith("Resultado")
    html = formatar_informe_html(cercado, PORTARIA, date(2026, 10, 19))
    assert html.count("https://www.in.gov.br/leiturajornal") == 2                   # só a caixa "Fonte oficial" (href + texto)


def test_resposta_fora_do_formato_cai_em_texto_corrido():
    texto = ("Informe Técnico nº — /2026\nSecretaria Municipal de Saúde de Apuí/AM\n"
             "A portaria trata do resultado de análise de pedido de readequação de projeto do PRONON\n"
             "Fonte: Diário Oficial da União, publicado em 19/10/2026.")
    assert _extrair_json(texto) is None
    assert _limpar_texto_ia(texto)[0].startswith("A portaria trata")
    html = formatar_informe_html(texto, PORTARIA, date(2026, 10, 19))
    assert "A portaria trata do resultado de análise de pedido de readequação de projeto do PRONON.</p>" in html
    assert "nº — /2026" not in html and "Fonte: Diário Oficial" not in html


def test_folha_a4_com_escala_automatica():
    html = formatar_informe_html(json.dumps(DADOS, ensure_ascii=False), PORTARIA, date(2026, 10, 19))
    assert "size: A4 portrait" in html and 'id="pagina"' in html and "beforeprint" in html and "width: 178mm" in html


def test_ajudantes_de_texto():
    assert _pontuar("Veja https://www.in.gov.br/x ,conforme art.13,inciso II") == "Veja https://www.in.gov.br/x, conforme art.13, inciso II."
    assert _pontuar("  texto   com   espaços  ") == "texto com espaços."
    assert _titulo_legivel("PORTARIA SE/MS Nº 998, DE 15 DE OUTUBRO DE 2026") == "Portaria SE/MS nº 998, de 15 de outubro de 2026"
    assert _titulo_legivel("Portaria GM/MS nº 1.234/2026") == "Portaria GM/MS nº 1.234/2026"
