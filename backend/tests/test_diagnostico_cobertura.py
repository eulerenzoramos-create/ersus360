"""Aba Diagnóstico/Cobertura (eGestor): só dados publicados, sem valores fixos; CNS mascarado."""
from services import egestor_diagnostico_scraper as s


def test_cns_mascarado_e_varredura_sem_alterar_texto():
    cns = "7" + "0" * 10 + "6591"   # dado-ficticio: montado em tempo de execução, não é um CNS real
    assert s._mascarar_cns(f"MARIA — CBO 322205 · CNS {cns}") == "MARIA — CBO 322205 · CNS ***********6591"
    v = s.varredura_scnes()
    assert v["data_varredura"] == "06/09/2026" and "Não é revalidada" in v["aviso"]
    textos = [p["desc"] for e in v["equipes"] for p in e["pendencias"]]
    assert not any(c.isdigit() and len(c) == 15 for t in textos for c in t.split())   # nenhum CNS inteiro


def test_diagnosticos_so_com_fatos_publicados():
    det = {"esf": {"qt_credenciadas": 10, "qt_homologadas": 9, "qt_pagas": 9},
           "esb": {"qt_40h_credenciadas": 10, "qt_40h_homologadas": 10, "qt_40h_pagas_modal_i": 10, "qt_40h_pagas_modal_ii": 0},
           "acs": {"qt_direto_credenciado": 67, "qt_direto_pago": 66}, "tetos": {"esf": 11},
           "classificacao_qualidade_esf": "BOM"}
    serie = [{"parcela_code": "202609", "parcela": "9/12", "ano_parcela": "2026", "competencia": "JUL/2026", "total": 660252.75},
             {"parcela_code": "202610", "parcela": "10/12", "ano_parcela": "2026", "competencia": "AGO/2026", "total": 648752.75}]
    val = [{"ine": "1", "equipe": "X", "tipo": "eSB", "cnes": "9", "pendencias": [
        {"campo": "stSuspensaoProducao", "rotulo": "Suspensão por falta de produção", "situacao": "SUSPENSO"}]}]
    d = {x["titulo"]: x for x in s.diagnosticos(det, val, serie, "202610")}
    assert "homologação" in d["eSF: 1 credenciada(s) sem pagamento"]["texto"]      # sem palpite de qual equipe
    assert d["eSB 40h: 10 paga(s) de 10 credenciada(s)"]["severidade"] == "ok"
    assert d["Validação eSB — X"]["severidade"] == "critico"
    assert d["Total da parcela caiu R$ 11.500,00"]["severidade"] == "alerta"
    assert not any("cobertura estimada" in t.lower() or "provável" in t.lower() for t in d)   # nada estimado


async def test_parcela_nao_publicada_nao_inventa(monkeypatch):
    serie = [{"parcela_code": "202610", "parcela": "10/12", "ano_parcela": "2026", "comp_cnes": "202608",
              "competencia": "AGO/2026", "total": 1.0, "planos": {}}]

    async def falsa(client, forcar=False):
        return serie
    monkeypatch.setattr(s, "serie_historica", falsa)
    r = await s.buscar_diagnostico_cobertura("202611")
    assert r["situacao_dado"] == "nao_publicada" and "ainda não foi publicada" in r["nota"]
    assert "esf" not in r and r["ultima_publicada"] == "202610"


def test_resumo_planos_oficial_copia_ajuste_desconto_e_efetivo():
    from services.egestor_aps import resumo_planos_oficial
    r = resumo_planos_oficial([
        {"dsPlanoOrcamentario": "Equipes de Saúde da Família - eSF e equipes de Atenção Primária - eAP",
         "vlIntegral": 270000, "vlAjuste": 0, "vlDesconto": -42174, "vlEfetivoRepasse": 227826},
        {"dsPlanoOrcamentario": "Atenção à Saúde Bucal", "vlIntegral": 113820, "vlAjuste": 0, "vlDesconto": 0, "vlEfetivoRepasse": 113820},
        {"dsPlanoOrcamentario": "Equipes Multiprofissionais - eMulti", "vlIntegral": 16750},
        {"dsPlanoOrcamentario": "Agentes Comunitários de Saúde", "vlIntegral": 213972, "vlEfetivoRepasse": 213972},
        {"dsPlanoOrcamentario": "Componente per capita de base populacional", "vlIntegral": 10799.75},
        {"dsPlanoOrcamentario": "", "vlIntegral": 1},
    ])
    assert [x["programa"] for x in r] == ["esf_eap", "esb", "emulti", "acs", "per_capita"]
    assert r[0]["vl_desconto"] == -42174 and r[0]["vl_efetivo"] == 227826 and r[0]["vl_integral"] == 270000
    # campo não publicado fica None (tela mostra "—"), nunca zero inventado
    assert r[2]["vl_desconto"] is None and r[2]["vl_efetivo"] is None


def test_vinculo_qualidade_nota_e_valor_publicados():
    from services.egestor_aps import vinculo_qualidade_oficial
    pg = {"qtEsfTotalPgto": 9, "dsClassificacaoVinculoEsfEap": "BOM", "dsClassificacaoQualidadeEsfEap": "BOM",
          "vlVinculoEsf": 54000, "vlQualidadeEsf": 72000, "qtEapTotalPgto": 0,
          "qtSbPagamentoModalidadeI": 10, "dsClassificacaoQualidadeEsb40h": "ÓTIMO; BOM",
          "vlPagamentoEsb40hQualidade": 33000, "vlQualidadeEsb40hOtimo": 15000, "vlQualidadeEsb40hBom": 18000,
          "dsClassificacaoQualidadeEsbChDif20h": "-", "vlQualidadeEsbChDif20h": 0,
          "dsClassificacaoQualidadeEmulti": "BOM", "vlPagamentoEmultiQualidade": 2250, "qtEmultiPagas": 1,
          "qtRibeirinhaPagas": 1, "vlPagamentoEsfrbVinculoAcomp": 6000, "vlPagamentoEsfrbQualidade": 6000}
    ls = {(l["programa"], l["componente"]): l for l in vinculo_qualidade_oficial(pg)}
    assert ls[("eSF", "vinculo")]["classificacao"] == "BOM" and ls[("eSF", "vinculo")]["valor"] == 54000
    assert ls[("eSF", "qualidade")]["valor"] == 72000 and ls[("eSF", "qualidade")]["equipes_pagas"] == 9
    esb = ls[("eSB 40h", "qualidade")]
    assert esb["valor"] == 33000 and {p["classificacao"]: p["valor"] for p in esb["partes"]} == {"ÓTIMO": 15000, "BOM": 18000}
    # eSFR: valor publicado, nota não publicada → None (nunca inventada)
    assert ls[("eSFR", "vinculo")]["classificacao"] is None and ls[("eSFR", "vinculo")]["valor"] == 6000
    # sem valor e nota "-" → linha omitida; eAP sem equipes → omitida
    assert ("eSB 20h", "qualidade") not in ls and ("eAP", "vinculo") not in ls
