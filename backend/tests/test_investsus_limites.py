"""Tela Limites do InvestSUS — mapeamento dos 8 tipos e conferência com os tetos."""
from services import investsus_limites as lim

TIPOS_2026 = [
    "INCREMENTO AO CUSTEIO DE SERVIÇOS DA ATENÇÃO PRIMÁRIA À SAÚDE - COLETIVAS",
    "INCREMENTO AO CUSTEIO DE SERVIÇOS DA ATENÇÃO ESPECIALIZADA À SAÚDE - COLETIVAS",
    "INCREMENTO AO CUSTEIO DE SERVIÇOS DA ATENÇÃO PRIMÁRIA À SAÚDE",
    "INCREMENTO AO CUSTEIO DE SERVIÇOS DA ATENÇÃO ESPECIALIZADA À SAÚDE",
    "INCREMENTO AO PROGRAMA AGORA TEM ESPECIALISTAS",
    "CUSTEIO PAP",
    "CUSTEIO MAC",
    "CUSTEIO EM AÇÕES E SERVIÇOS DA REDE SARAH",
]


def test_categorias_dos_oito_tipos():
    assert [lim.categoria_do_tipo(t) for t in TIPOS_2026] == [
        "coletiva_pap", "coletiva_mac", "individual_pap", "individual_mac", None, None, None, None]


def test_area_dos_programas():
    assert [lim.area_do_tipo(t) for t in TIPOS_2026[4:]] == ["mac", "pap", "mac", "mac"]


def test_ordem_igual_ao_investsus():
    assert [lim.ordem(t) for t in TIPOS_2026] == list(range(8))


def test_montar_tipo_coletiva_pap_apui():
    t = lim.montar_tipo(1, TIPOS_2026[0], [{"nomeMunicipio": "APUI", "valorTeto": 8078142.0,
                                             "valorIndicado": 5700110.0, "valorSaldo": 2378032.0,
                                             "tipoLimite": "IBGE"}])
    assert t["categoria"] == "coletiva_pap"
    assert (t["limite"], t["valor_indicado"], t["limite_a_indicar"]) == (8078142.0, 5700110.0, 2378032.0)
    assert t["linhas"][0]["nome"] == "APUI"


def test_cnes_soma_estabelecimentos_e_marca_compartilhado():
    t = lim.montar_tipo(9, "CUSTEIO MAC", [
        {"descricao": "HOSPITAL X", "valorTeto": 100.5, "valorIndicado": 50, "valorSaldo": 50.5, "tipoLimite": "CNES"},
        {"descricao": "UBS Y", "valorTeto": 0, "valorIndicado": 0, "valorSaldo": 0, "tipoLimite": "CNES"},
    ])
    assert t["tipo_limite"] == "CNES"
    assert t["limite"] == 100.5 and t["limite_a_indicar"] == 50.5
    assert t["linhas"][0]["nome"] == "HOSPITAL X"
    assert t["linhas"][1]["compartilhado_secretaria"] is True


def test_tipo_sem_linhas_fica_sem_valor():
    t = lim.montar_tipo(5, "CUSTEIO PAP", [])
    assert t["limite"] is None and t["valor_indicado"] is None


def _painel(teto, util):
    card = {"categoria": "coletiva_pap", "teto": {"valor": teto}, "comprometido": util,
            "situacao": "pendente_validacao", "memoria_calculo": []}
    return {"cards": [card], "resumo": {"linhas": [{"categoria": "coletiva_pap", "situacao": "pendente_validacao"}]}}


LIM = {"coletiva_pap": {"descricao": TIPOS_2026[0], "limite": 8078142.0, "valor_indicado": 5700110.0,
                        "limite_a_indicar": 2378032.0, "capturado_em": "2026-11-11T10:00:00"}}


def test_confere_valida_card():
    p = _painel(8078142.0, 5700110.0)
    lim.aplicar_conferencia(p, LIM)
    c = p["cards"][0]
    assert c["investsus_limites"]["validado"] is True
    assert c["situacao"] == "confirmado"
    assert p["resumo"]["linhas"][0]["situacao"] == "confirmado"


def test_utilizado_divergente_fica_pendente_com_diferenca():
    p = _painel(8078142.0, 5000000.0)
    lim.aplicar_conferencia(p, LIM)
    c = p["cards"][0]
    assert c["situacao"] == "pendente_validacao"
    assert c["investsus_limites"]["limite_confere"] is True
    assert c["investsus_limites"]["diferenca_indicado"] == 700110.0
    assert any("diverge do Valor Indicado" in m for m in c["memoria_calculo"])


def test_sem_captura_nao_mexe_na_situacao():
    p = _painel(8078142.0, 5700110.0)
    lim.aplicar_conferencia(p, {})
    assert p["cards"][0]["situacao"] == "pendente_validacao"
    assert p["cards"][0]["investsus_limites"] == {"disponivel": False}
