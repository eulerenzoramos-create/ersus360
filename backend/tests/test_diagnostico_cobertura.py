"""Aba Diagnóstico/Cobertura (eGestor): só dados publicados, sem valores fixos; CNS mascarado."""
from services import egestor_diagnostico_scraper as s


def test_cns_mascarado_e_varredura_sem_alterar_texto():
    assert s._mascarar_cns("MARIA — CBO 322205 · CNS 705408412586591") == "MARIA — CBO 322205 · CNS ***********6591"
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
