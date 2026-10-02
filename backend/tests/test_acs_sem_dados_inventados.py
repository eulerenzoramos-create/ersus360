"""Painel ACS: sem fonte real conectada, nenhuma rota pode devolver nome, visita, cadastro ou
indicador inventado — só "dado não disponível" (regra do projeto: nenhum valor é simulado)."""
import json

from routers import acs


async def _todas_as_respostas():
    return {
        "dashboard": await acs.dashboard(ano=0, esf=""),
        "indicadores": await acs.indicadores(ano=0),
        "producao": await acs.producao(ano=0),
        "lista": await acs.lista_acs(esf=""),
        "microareas": await acs.microareas(),
        "visitas": await acs.esus_visitas(periodo="mensal", competencia="", data="", ano=""),
        "calendario": await acs.esus_calendario(),
        "cad_ind": await acs.esus_cadastros_individuais(pagina=1, tamanho=50),
        "cad_dom": await acs.esus_cadastros_domiciliares(pagina=1, tamanho=50),
        "acs": await acs.esus_acs(),
        "territorios": await acs.esus_territorios(),
        "tempo_real": await acs.esus_tempo_real(),
    }


async def test_dashboard_e_listas_indisponiveis():
    r = await _todas_as_respostas()
    assert r["dashboard"]["situacao_dado"] == "nao_disponivel" and r["dashboard"]["kpis"] is None
    assert r["lista"]["acs"] == [] and r["lista"]["total"] == 0
    assert r["microareas"]["microareas"] == []
    assert r["visitas"]["dados"] is None
    assert r["acs"]["dados"] == [] and r["territorios"]["dados"] == []
    assert r["cad_dom"]["total"] == 0 and r["cad_ind"]["total"] == 0
    assert r["tempo_real"]["dados"]["kpis_mes"] is None


async def test_nenhuma_rota_expoe_dado_de_acs_inventado():
    texto = json.dumps(await _todas_as_respostas(), ensure_ascii=False)
    for proibido in ("familias_cadastradas", "pct_visitas", "gestantes_ativas", "destaque",
                     "critico", "afastado", "referencia_municipal", "Ana Carla"):
        assert proibido not in texto, proibido
