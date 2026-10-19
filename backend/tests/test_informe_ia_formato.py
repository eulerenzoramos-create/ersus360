"""Informe Técnico (IA): documento padronizado em uma folha A4, sem cabeçalho duplicado nem título em branco."""
from datetime import date

from services.informe_ia_service import _limpar_texto_ia, formatar_informe_html

TEXTO = """Informe Técnico nº — /2026
Secretaria Municipal de Saúde de Apuí/AM
A Portaria SE/MS nº 998, de 15 de outubro de 2026, foi publicada no Diário Oficial da União em 19/10/2026.
O objeto é a divulgação do resultado de análise de pedido de readequação <b>PRONON</b>.
Fonte: Diário Oficial da União, publicado em 19/10/2026. Disponível em: https://www.in.gov.br/leiturajornal"""


def test_remove_cabecalho_repetido_e_markdown():
    p = _limpar_texto_ia("**Informe Técnico nº 12/2026**\nSecretaria Municipal de Saúde\n## Texto real do parágrafo um, que não é cabeçalho e deve ficar.")
    assert p == ["Texto real do parágrafo um, que não é cabeçalho e deve ficar."]


def test_titulo_nao_fica_em_branco_e_texto_e_escapado():
    html = formatar_informe_html(TEXTO, {"_titulo": "Portaria SE/MS nº 998/2026", "_numero": ""}, date(2026, 10, 19))
    assert "Informe Técnico — Portaria SE/MS nº 998/2026" in html
    assert "Informe Técnico — </div>" not in html and "nº — /2026" not in html
    assert "&lt;b&gt;PRONON&lt;/b&gt;" in html and "<b>PRONON</b>" not in html        # texto da IA nunca vira HTML


def test_sem_numero_nem_titulo_usa_so_informe_tecnico():
    html = formatar_informe_html("Parágrafo único do informe com conteúdo suficiente para teste.", {}, date(2026, 10, 19))
    assert '<div class="cabecalho-titulo">Informe Técnico</div>' in html


def test_padroniza_uma_folha_a4():
    html = formatar_informe_html(TEXTO, {"_numero": "998/2026"}, date(2026, 10, 19))
    assert "size: A4 portrait" in html and 'id="pagina"' in html and "beforeprint" in html
    assert "width: 178mm" in html                      # mesma largura na tela e na impressão
    assert "Gerado pelo ERSUS 360 em 19/10/2026" in html
