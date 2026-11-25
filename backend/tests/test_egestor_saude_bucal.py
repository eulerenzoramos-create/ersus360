"""Total da saúde bucal (eSB) do e-Gestor: deve fechar com a soma oficial dos componentes de saúde bucal."""
from services.egestor_aps import _total_saude_bucal
from tests.dados_egestor_apui_202610 import PARCELA_202610

# Componentes de saúde bucal do relatório: eSB 40h, CH diferenciada, qualidade eSB 40h, UOM, CEO, LRPD, Sesb
_COMPONENTES_SB = {5, 37, 50, 9, 18, 19, 43}


def test_total_saude_bucal_fecha_com_componentes_oficiais_202610():
    oficial = sum(c["resumo"]["vlTotal"] for c in PARCELA_202610["componentes"]
                  if c["co_componente"] in _COMPONENTES_SB)
    assert oficial == 113820
    assert _total_saude_bucal(PARCELA_202610["consolidado"]) == 113820


def test_total_saude_bucal_inclui_uom_e_recursos_extras():
    pg = {"vlPagamentoEsb40h": 60210, "vlPagamentoEsb40hQualidade": 31500, "vlPagamentoUom": 9360,
          "vlPagamentoLrpdMunicipal": 0, "vlPagamentoEsbChDifQualidade": 100,
          "vlPagamentoQualidadeExtraEsb40H": 50, "vlPagamentoUomImplantacao": 10,
          "vlPagamentoCeoEstadual": 5, "vlPagamentoLrpdEstadual": 1}
    assert _total_saude_bucal(pg) == 60210 + 31500 + 9360 + 100 + 50 + 10 + 5 + 1


def test_sesb_nao_soma_duas_vezes():
    base = {"vlPagamentoEsb40h": 1000}
    assert _total_saude_bucal({**base, "vlPagamentoSesb": 300, "vlPagamentoDesempenhoSesb": 200}) == 1500
    assert _total_saude_bucal({**base, "vlPagamentoSesb": 300, "vlPagamentoDesempenhoSesb": 200,
                               "vlTotalPagamentoSesb": 500}) == 1500
